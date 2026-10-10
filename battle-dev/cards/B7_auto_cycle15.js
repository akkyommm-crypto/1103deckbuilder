/* Auto cycle 15 — 23枚。engine 変更なし。
     VA エンドフェイズまでの一時修正（攻守・レベル）
     VB 自分エンドフェイズの定期処理（ライトロード等）
     VC 期限付きの制限・耐性
     VD 墓地・除外を跨ぐ処理
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function c4MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
/* 自分のエンドフェイズか */
function c4OwnEndPhase(ctx){
  return gameState.phase === 'end' && gameState.activePlayer === ctx.player;
}
/* 相手のエンドフェイズか */
function c4FoeEndPhase(ctx){
  return gameState.phase === 'end' && gameState.activePlayer === ctx.opponent;
}
/* 表側表示でそのゾーンにいるか */
function c4FaceUpAt(ctx, zone){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === zone && me.card.face === 'up');
}
/* 攻撃対象になった自分のモンスター（ダメージ計算時） */
function c4AttackedOwn(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const foe = b.player === 0 ? 1 : 0;
  if(foe !== ctx.player) return null;
  return (gameState.players[foe].mz || [])[b.target] || null;
}
/* 攻撃してきたモンスター */
function c4Attacker(){
  const b = gameState.battle;
  if(!b) return null;
  return (gameState.players[b.player].mz || [])[b.atkIdx] || null;
}

/* ===================== A. エンドフェイズまでの一時修正 ===================== */

/* 1. ゼンマイソルジャー — メインフェイズにレベル+1・攻撃力+400（表側で存在する限り1度） */
function c4WindupBoost(name, lvUp, atkUp){
  defineScript(name, {
    type:'monster', priority:1, timing:['mainPhase'], activateFrom:['mz'],
    condition(ctx){
      if(!c4FaceUpAt(ctx, 'mz')){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
      if(b0FieldOnceUsed(ctx.card, 'c4WindupUsed')){ ctx.reason = 'この効果は既に使用しています'; return false; }
      return true;
    },
    resolve(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      b0MarkFieldOnce(me, 'c4WindupUsed', name);
      API.modLevel(me, lvUp, 'endTurn', name);
      API.modAtk(me, atkUp, 0, 'endTurn', name);
    },
    afterResolve(){}
  });
}
c4WindupBoost('ゼンマイソルジャー', 1, 400);
/* 2. ゼンマイドッグ — レベル+2・攻撃力+600 */
c4WindupBoost('ゼンマイドッグ', 2, 600);

/* 3. ラッコアラ — 自分の場に他の獣族がいる場合、自分のモンスター1体の
      攻撃力をエンドフェイズ時まで1000アップ（1ターンに1度） */
function c4OtherBeast(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.card.face === 'up' && x.db.ra === '獣' }).length > 0;
}
defineScript('ラッコアラ', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c4FaceUpAt(ctx, 'mz')){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c4OtherBeast(ctx)){ ctx.reason = '自分フィールドに他の獣族モンスターが必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ラッコアラ：攻撃力を上げるモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.modAtk(r, 1000, 0, 'endTurn', 'ラッコアラ');
  },
  afterResolve(){}
});

/* 4. ミラクル・キッズ — 相手モンスター1体の攻撃力を、
      自分の墓地の「ヒーロー・キッズ」の数×400ダウン（エンドフェイズ時まで） */
defineScript('ミラクル・キッズ', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '相手フィールドに表側表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ミラクル・キッズ：攻撃力を下げる相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' }),
      t => done([t]));
  },
  resolve(ctx){
    const n = API.pileCards(ctx.player, 'grave', x => x.db.n === 'ヒーロー・キッズ').length;
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz' && n > 0) API.modAtk(r, -n * 400, 0, 'endTurn', 'ミラクル・キッズ');
  },
  afterResolve(){}
});

/* 5. ハーフ・カウンター — 攻撃されたダメージ計算時、攻撃対象の自分のモンスターの
      攻撃力を、攻撃モンスターの元々の攻撃力の半分だけエンドフェイズ時までアップ */
defineScript('ハーフ・カウンター', {
  /* canModifyNow（60_damage_segoc_ui_helpers.js:58）は、ダメージ計算時以降の攻守変更を
     damageStepOnly 宣言があるスクリプトにだけ許す。 */
  type:'trap', priority:2, dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    if(!c4AttackedOwn(ctx)){ ctx.reason = '自分のモンスターが攻撃されたダメージ計算時に発動します'; return false; }
    if(!c4Attacker()){ ctx.reason = '攻撃モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const target = c4AttackedOwn(ctx), atkr = c4Attacker();
    if(!target || !atkr) return;
    const h = locateCardAnyV4(target);
    if(!h || h.zone !== 'mz') return;
    API.modAtk(h, Math.floor(Math.max(0, dbOf(atkr).atk || 0) / 2), 0, 'endTurn', 'ハーフ・カウンター');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && !!c4AttackedOwn(ctx) && !!c4Attacker(); } }
});

/* 6. ジェム・マーチャント — 自分の地属性通常モンスターが戦闘を行うダメージステップに
      手札から墓地へ送り、そのモンスターの攻守をエンドフェイズ時まで1000アップ */
function c4EarthNormalInBattle(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const cands = [];
  const a = (gameState.players[b.player].mz || [])[b.atkIdx];
  const d = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  [a, d].forEach(c => {
    if(!c) return;
    const h = locateCardAnyV4(c);
    if(!h || h.p !== ctx.player || h.zone !== 'mz') return;
    const db = dbOf(c);
    if(db.at === '地' && (db.st || []).includes('通常')) cands.push(c);
  });
  return cands.length ? cands[0] : null;
}
defineScript('ジェム・マーチャント', {
  type:'monster', priority:2, activateFrom:['hand'], dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!c4EarthNormalInBattle(ctx)){
      ctx.reason = '自分の地属性通常モンスターが戦闘を行うダメージステップに発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'hand'){
      API.sendHandToGrave(ctx.player, me.index, 'ジェム・マーチャント'); done(true);
    }else done(false);
  },
  resolve(ctx){
    const t = c4EarthNormalInBattle(ctx);
    const h = t && locateCardAnyV4(t);
    if(h && h.zone === 'mz') API.modAtk(h, 1000, 1000, 'endTurn', 'ジェム・マーチャント');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const me = locateCardAnyV4(ctx.card);
    return !!me && me.zone === 'hand' && !!c4EarthNormalInBattle(ctx); } }
});

/* 7. ディスクライダー — 1ターンに1度、墓地の通常罠1枚を除外して
      攻撃力を相手のエンドフェイズ時まで500アップ */
function c4NormalTrapGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 't' && !x.db.sub);
}
/* 「相手のエンドフェイズ時まで」は until:'endTurn' では足りない（自分のターン終了で切れる）。
   v7 スケジューラで相手のエンドフェイズに MOD_CLEAR_LABEL_V7 を予約して期限を持たせる。 */
API.registerScheduleHandler('c4.riderBoost', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h) API.clearModsByLabel(h, 'ディスクライダー');
});
defineScript('ディスクライダー', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c4FaceUpAt(ctx, 'mz')){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c4NormalTrapGrave(ctx.player).length){ ctx.reason = '墓地に通常罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ディスクライダー：除外する通常罠', c4NormalTrapGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    API.banish(r, 'ディスクライダー');
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.modAtk(me, 500, 0, 'permanent', 'ディスクライダー');
    API.schedule({ at:'endPhase', turns:(gameState.activePlayer === ctx.player ? 1 : 0),
                   player:ctx.player, handler:'c4.riderBoost',
                   args:{ uid:me.card.uid }, source:{ card:ctx.card }, note:'ディスクライダー' });
  },
  afterResolve(){}
});

/* ===================== B. 自分エンドフェイズの定期処理 ===================== */

/* 8. ライトロード・パラディン ジェイン — 相手モンスターに攻撃するダメージステップの間
      攻撃力300アップ。自分エンドフェイズにデッキの上から2枚墓地へ送る */
function c4LightswornMill(name, n){
  defineScript(name, {
    type:'monster', priority:1, forced:true, activateFrom:['mz'],
    condition(ctx){
      if(!c4FaceUpAt(ctx, 'mz')){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
      if(!c4OwnEndPhase(ctx)){ ctx.reason = '自分のエンドフェイズに発動します'; return false; }
      if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
      return true;
    },
    resolve(ctx){ API.millTop(ctx.player, n, name); },
    afterResolve(){},
    passive:{ onEndPhase(ctx){
      return c4FaceUpAt(ctx, 'mz') && c4OwnEndPhase(ctx) && API.me(ctx).deck.length > 0; } },
    continuous:{
      scope:'self', from:['mz'],
      apply(card, self){
        if(card !== self || card.face !== 'up') return null;
        if(name !== 'ライトロード・パラディン ジェイン') return null;
        /* 相手モンスターに攻撃するダメージステップの間だけ +300 */
        const b = gameState.battle;
        if(!b || b.target === 'direct') return null;
        if((gameState.players[b.player].mz || [])[b.atkIdx] !== self) return null;
        return { atk:300 };
      }
    }
  });
}
c4LightswornMill('ライトロード・パラディン ジェイン', 2);

/* 9. ライトロード・モンク エイリン — 守備表示モンスターを攻撃したダメージ計算前に
      そのモンスターを持ち主のデッキに戻す。自分エンドフェイズに3枚墓地へ送る */
function c4EhrenTarget(ctx){
  if(!a3IsAttacker(ctx)) return null;
  const t = a3AttackTarget();
  return (t && t.pos === 'def') ? t : null;
}
defineScript('ライトロード・モンク エイリン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'start',
  condition(ctx){
    if(!c4FaceUpAt(ctx, 'mz')){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(c4EhrenTarget(ctx)) return true;
    if(c4OwnEndPhase(ctx) && API.me(ctx).deck.length) return true;
    ctx.reason = '守備表示モンスターを攻撃したダメージ計算前、または自分のエンドフェイズに発動します';
    return false;
  },
  resolve(ctx){
    const t = c4EhrenTarget(ctx);
    if(t){
      const h = locateCardAnyV4(t);
      if(h && h.zone === 'mz') API.returnToDeck(h, false, 'ライトロード・モンク エイリン');
      return;
    }
    if(c4OwnEndPhase(ctx)) API.millTop(ctx.player, 3, 'ライトロード・モンク エイリン');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return c4FaceUpAt(ctx, 'mz') && !!c4EhrenTarget(ctx); },
    onEndPhase(ctx){
      return c4FaceUpAt(ctx, 'mz') && c4OwnEndPhase(ctx) && API.me(ctx).deck.length > 0; }
  }
});

/* 10. ヴァイロン・デルタ — 表側守備表示の場合、自分エンドフェイズに
       デッキから装備魔法1枚を手札に加えられる */
function c4EquipDeck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 's' && x.db.sub === '装備');
}
defineScript('ヴァイロン・デルタ', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up' || me.card.pos !== 'def'){
      ctx.reason = '表側守備表示で存在する必要があります'; return false; }
    if(!c4OwnEndPhase(ctx)){ ctx.reason = '自分のエンドフェイズに発動します'; return false; }
    if(!c4EquipDeck(ctx.player).length){ ctx.reason = 'デッキに装備魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヴァイロン・デルタ：手札に加える装備魔法', c4EquipDeck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.returnToHand(r, 'ヴァイロン・デルタ');
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){
    const me = locateCardAnyV4(ctx.card);
    return !!me && me.zone === 'mz' && me.card.face === 'up' && me.card.pos === 'def'
      && c4OwnEndPhase(ctx) && c4EquipDeck(ctx.player).length > 0; } }
});

/* 11. キラー・スネーク — 墓地にある場合、自分スタンバイフェイズに手札に戻せる。
       次の相手エンドフェイズに墓地の「キラー・スネーク」1体を除外する（1ターンに1度） */
API.registerScheduleHandler('c4.killerSnake', (entry) => {
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  const q = API.pileCards(p, 'grave', x => x.db.n === 'キラー・スネーク');
  if(q.length) API.banish(q[0], 'キラー・スネーク');
});
defineScript('キラー・スネーク', {
  type:'monster', priority:1, countLimit:1, activateFrom:['grave'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ ctx.reason = '墓地に存在する必要があります'; return false; }
    if(gameState.phase !== 'standby' || gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave') return;
    API.returnToHand(me, 'キラー・スネーク');
    API.schedule({ at:'endPhase', turns:1, player:ctx.player, handler:'c4.killerSnake',
                   args:{ player:ctx.player }, source:{ card:ctx.card }, note:'キラー・スネーク' });
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    const me = locateCardAnyV4(ctx.card);
    return !!me && me.zone === 'grave' && gameState.activePlayer === ctx.player; } }
});

/* ===================== C. 期限付きの制限・耐性 ===================== */

/* 12. チューナーズ・バリア — 自分の表側チューナー1体を選択。
       次のターンのエンドフェイズ時まで戦闘・効果で破壊されない */
function c4BarrierOk(target, self){
  const loc = locateCard(target), me = locateCard(self) || locateCardAnyV4(self);
  if(!loc || !me) return false;
  if(target.c4BarrierUntil == null) return false;
  return Number(target.c4BarrierUntil) >= gameState.turn;
}
defineScript('チューナーズ・バリア', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c4OwnTuners(ctx).length){ ctx.reason = '自分フィールドに表側表示のチューナーがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('チューナーズ・バリア：守るチューナー', c4OwnTuners(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz')
      API.setCardFlag(r, 'c4BarrierUntil', gameState.turn + 1, 'チューナーズ・バリア');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz','grave'],
    apply(){ return null; },
    protectV21:{
      key:'チューナーズ・バリア', label:'チューナーズ・バリア',
      battle: (target, self) => c4BarrierOk(target, self),
      effect: (target, self) => c4BarrierOk(target, self)
    }
  }
});
function c4OwnTuners(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('チューナー') });
}

/* 13. ブリザード・ドラゴン — 相手モンスター1体を選択。次の相手のエンドフェイズ時まで
       攻撃宣言できず、表示形式も変更できない（1ターンに1度） */
defineScript('ブリザード・ドラゴン', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c4FaceUpAt(ctx, 'mz')){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ブリザード・ドラゴン：ロックする相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz')
      API.setCardFlag(r, 'c4BlizzardUntil', gameState.turn + 1, 'ブリザード・ドラゴン');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(card){
      return Number(card && card.c4BlizzardUntil || -1) >= gameState.turn;
    },
    cannotChangePosition(card){
      return Number(card && card.c4BlizzardUntil || -1) >= gameState.turn;
    }
  }
});

/* 14. スパイダー・ウェブ — 攻撃宣言したモンスターはダメージステップ終了時に守備表示になり、
       そのコントローラーから見て次の自分のターンのエンドフェイズ時まで表示形式を変更できない */
defineScript('スパイダー・ウェブ', {
  type:'spell', priority:1, forced:true, activateFrom:['sz'], dsTiming:'end',
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    const a = c4Attacker();
    if(!a){ ctx.reason = '攻撃宣言したモンスターがいません'; return false; }
    const h = locateCardAnyV4(a);
    if(!h || h.zone !== 'mz' || h.card.pos === 'def'){
      ctx.reason = '攻撃したモンスターがフィールドにいません'; return false; }
    return true;
  },
  resolve(ctx){
    const a = c4Attacker();
    const h = a && locateCardAnyV4(a);
    if(!h || h.zone !== 'mz') return;
    API.changePosition(h, 'def', 'スパイダー・ウェブ');
    const now = locateCardAnyV4(a);
    if(now) API.setCardFlag(now, 'c4WebUntil', gameState.turn + 2, 'スパイダー・ウェブ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up') return false;
    const a = c4Attacker();
    const h = a && locateCardAnyV4(a);
    return !!(h && h.zone === 'mz' && h.card.pos !== 'def'); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotChangePosition(card){
      const t = Number(card && card.c4WebUntil || 0);
      return t > 0 && gameState.turn < t;
    }
  }
});

/* 15. デプス・アミュレット — 相手モンスターの攻撃宣言時、手札を1枚捨てて攻撃を無効にする。
       発動後3回目の相手のエンドフェイズ時に破壊される */
API.registerScheduleHandler('c4.depthAmulet', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'sz') API.destroy(h, 'デプス・アミュレット', p);
});
defineScript('デプス・アミュレット', {
  type:'trap', priority:2,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(!a){ ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const hand = API.pileCards(ctx.player, 'hand', () => true);
    if(!hand.length){ done(false); return; }
    API.selectCard('デプス・アミュレット：捨てる手札', hand, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'デプス・アミュレット', { byEffect:true, byPlayer:ctx.player });
        done(true);
      }else done(false);
    });
  },
  resolve(ctx){
    API.negateAttack('デプス・アミュレット');
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz') return;
    if(me.card.c4DepthScheduled) return;
    ensureCardUid(gameState, me.card);
    API.setCardFlag(me, 'c4DepthScheduled', true, 'デプス・アミュレット');
    /* 発動後3回目の相手のエンドフェイズ */
    API.schedule({ at:'endPhase', turns:5, player:ctx.player, handler:'c4.depthAmulet',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'デプス・アミュレット' });
  },
  afterResolve(){}
});

/* 16. ブレイク・ドロー — 機械族にのみ装備可能。装備モンスターが戦闘で
       相手モンスターを破壊し墓地へ送った時ドローする。
       発動後3回目の自分のエンドフェイズ時に破壊される */
API.registerScheduleHandler('c4.breakDraw', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'sz') API.destroy(h, 'ブレイク・ドロー', p);
});
function c4EquippedKilled(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'sz') return false;
  const hostUid = me.card.equipTo && me.card.equipTo.uid;
  if(hostUid == null) return false;
  const b = ctx.battle || {};
  const host = findCardByUid(hostUid);
  if(!host || host.zone !== 'mz') return false;
  if(b.atkCard === host.card && b.destroyedDef && b.defCard) return true;
  if(b.defCard === host.card && b.destroyedAtk && b.atkCard) return true;
  return false;
}
defineScript('ブレイク・ドロー', {
  type:'spell', priority:1, forced:true, activateFrom:['sz'], dsTiming:'after',
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.ra === '機械'); } },
  condition(ctx){
    if(!c4EquippedKilled(ctx)){ ctx.reason = '装備モンスターが戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 1);
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz' || me.card.c4BreakScheduled) return;
    ensureCardUid(gameState, me.card);
    API.setCardFlag(me, 'c4BreakScheduled', true, 'ブレイク・ドロー');
    API.schedule({ at:'endPhase', turns:4, player:ctx.player, handler:'c4.breakDraw',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'ブレイク・ドロー' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return c4EquippedKilled(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 17. オーバー・デッド・ライン — 墓地から特殊召喚した自分の植物族の攻撃力が1000アップ。
       発動後2回目の自分のエンドフェイズ時に破壊される */
API.registerScheduleHandler('c4.overDeadLine', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'sz') API.destroy(h, 'オーバー・デッド・ライン', p);
});
defineScript('オーバー・デッド・ライン', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'endPhase', turns:3, player:ctx.player, handler:'c4.overDeadLine',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'オーバー・デッド・ライン' });
  },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['sz'],
    apply(card, self, info){
      if(!card || card.face !== 'up') return null;
      if(dbOf(card).ra !== '植物') return null;
      if(card.specialSummonedFrom !== 'grave') return null;
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'sz' || me.card.face !== 'up') return null;
      const loc = locateCard(card);
      if(!loc || loc.p !== me.p) return null;
      return { atk:1000 };
    }
  }
});

/* ===================== D. 墓地・除外を跨ぐ処理 ===================== */

/* 18. スナップドラゴン — 墓地へ送られた時、相手の手札をランダムに1枚選び、
       エンドフェイズ時まで表側表示でゲームから除外する（1ターンに1度） */
API.registerScheduleHandler('c4.snapDragon', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'banish') API.returnToHand(h, 'スナップドラゴン');
});
function c4SnapToGrave(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.turn === gameState.turn);
}
defineScript('スナップドラゴン', {
  type:'monster', priority:1, forced:true, countLimit:1, activateFrom:['grave'],
  condition(ctx){
    if(!c4SnapToGrave(ctx)){ ctx.reason = '墓地へ送られた時に発動します'; return false; }
    if(!gameState.players[ctx.opponent].hand.length){ ctx.reason = '相手の手札がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const H = gameState.players[ctx.opponent].hand || [];
    if(!H.length) return;
    /* ランダムに選ぶので相手の非公開情報は覗かない */
    const i = (typeof duelRandomInt === 'function') ? duelRandomInt(H.length) : 0;
    const h = locateCardAnyV4(H[i]);
    if(!h || h.zone !== 'hand') return;
    ensureCardUid(gameState, h.card);
    const uid = h.card.uid;
    API.banish(h, 'スナップドラゴン');
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c4.snapDragon',
                   args:{ uid:uid }, source:{ card:ctx.card }, note:'スナップドラゴン' });
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return c4SnapToGrave(ctx) && gameState.players[ctx.opponent].hand.length > 0; },
    onDestroy(ctx){ return c4SnapToGrave(ctx) && gameState.players[ctx.opponent].hand.length > 0; }
  }
});

/* 19. ヴァイパー・リボーン — 自分の墓地のモンスターが爬虫類族のみの場合、
       チューナー以外の墓地のモンスター1体を特殊召喚する。
       この効果で特殊召喚したモンスターはこのターンのエンドフェイズ時に破壊される */
API.registerScheduleHandler('c4.viperReborn', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.destroy(h, 'ヴァイパー・リボーン', p);
});
function c4OnlyReptiles(p){
  const mons = API.pileCards(p, 'grave', x => x.db.k === 'm');
  return mons.length > 0 && mons.every(x => x.db.ra === '爬虫類');
}
defineScript('ヴァイパー・リボーン', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!c4OnlyReptiles(ctx.player)){ ctx.reason = '自分の墓地のモンスターが爬虫類族のみである必要があります'; return false; }
    if(!c4MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    if(!API.pileCards(ctx.player, 'grave',
        x => x.db.k === 'm' && !(x.db.st || []).includes('チューナー')).length){
      ctx.reason = 'チューナー以外のモンスターが墓地にいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヴァイパー・リボーン：特殊召喚するモンスター',
      API.pileCards(ctx.player, 'grave',
        x => x.db.k === 'm' && !(x.db.st || []).includes('チューナー')),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c4MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ヴァイパー・リボーン', r.p);
    const now = findCardByUid(uid);
    if(now && now.zone === 'mz')
      API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c4.viperReborn',
                     args:{ uid:uid, player:ctx.player }, source:{ card:ctx.card },
                     note:'ヴァイパー・リボーン' });
  },
  afterResolve(){}
});

/* 20. ボーン・テンプル・ブロック — 手札を1枚捨て、お互いに相手の墓地から
       レベル4以下のモンスター1体を選択して自分フィールドに特殊召喚する。
       特殊召喚したモンスターは次のターンのエンドフェイズ時に破壊される */
API.registerScheduleHandler('c4.boneTemple', (entry) => {
  const uids = (entry && Array.isArray(entry.uids)) ? entry.uids : [];
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  uids.forEach(u => {
    const h = findCardByUid(u);
    if(h && h.zone === 'mz') API.destroy(h, 'ボーン・テンプル・ブロック', p);
  });
});
function c4Low(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && Number(x.db.lv) <= 4);
}
defineScript('ボーン・テンプル・ブロック', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!c4Low(ctx.opponent).length && !c4Low(ctx.player).length){
      ctx.reason = 'お互いの墓地にレベル4以下のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const hand = API.pileCards(ctx.player, 'hand', () => true);
    if(!hand.length){ done(false); return; }
    API.selectCard('ボーン・テンプル・ブロック：捨てる手札', hand, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'ボーン・テンプル・ブロック', { byEffect:true, byPlayer:ctx.player });
        done(true);
      }else done(false);
    });
  },
  selectTargets(ctx, done){
    /* 自分は「相手の墓地」から、相手は「自分の墓地」から選ぶ */
    const mine = c4Low(ctx.opponent), theirs = c4Low(ctx.player);
    const pickTheirs = (a) => {
      if(!theirs.length){ done(a ? [a] : []); return; }
      API.selectCard('ボーン・テンプル・ブロック：相手が選ぶモンスター', theirs, b => done(a ? [a, b] : [b]));
    };
    if(!mine.length){ pickTheirs(null); return; }
    API.selectCard('ボーン・テンプル・ブロック：相手の墓地から特殊召喚するモンスター', mine, a => pickTheirs(a));
  },
  resolve(ctx){
    const uids = [];
    (ctx.selectedTargets || []).forEach(t => {
      const r = t && resolveTarget(t);
      if(!r || r.zone !== 'grave') return;
      /* 「相手の墓地から自分フィールドへ」なので、召喚先は墓地の持ち主の相手側 */
      const to = (r.p === ctx.player) ? ctx.opponent : ctx.player;
      if(!c4MzOpen(to)) return;
      ensureCardUid(gameState, r.card);
      const uid = r.card.uid;
      API.specialSummon(to, 'grave', r.index, 'atk', 'ボーン・テンプル・ブロック', r.p);
      const now = findCardByUid(uid);
      if(now && now.zone === 'mz') uids.push(uid);
    });
    if(uids.length)
      API.schedule({ at:'endPhase', turns:2, player:ctx.player, handler:'c4.boneTemple',
                     args:{ uids:uids, player:ctx.player }, source:{ card:ctx.card },
                     note:'ボーン・テンプル・ブロック' });
  },
  afterResolve(){}
});

/* 21. カオス・インフィニティ — フィールドの守備表示モンスターを全て表側攻撃表示にし、
       その後デッキ・墓地から「機皇」モンスター1体を特殊召喚する。
       そのモンスターの効果は無効化され、エンドフェイズに破壊される */
API.registerScheduleHandler('c4.chaosInfinity', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.destroy(h, 'カオス・インフィニティ', p);
});
function c4Meklord(p){
  const out = [];
  API.pileCards(p, 'deck', x => x.db.k === 'm' && isCardInGroupV4(x.db, GROUP.MEKLORD)).forEach(x => out.push(x));
  API.pileCards(p, 'grave', x => x.db.k === 'm' && isCardInGroupV4(x.db, GROUP.MEKLORD)).forEach(x => out.push(x));
  return out;
}
defineScript('カオス・インフィニティ', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c4Meklord(ctx.player).length){ ctx.reason = 'デッキ・墓地に「機皇」モンスターがいません'; return false; }
    if(!c4MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('カオス・インフィニティ：特殊召喚する「機皇」', c4Meklord(ctx.player), t => done([t]));
  },
  resolve(ctx){
    /* フィールドの守備表示モンスターを全て表側攻撃表示にする */
    API.fieldCards({ zone:'mz', filter:x => x.card.pos === 'def' }).map(x => x.card).forEach(c => {
      const h = locateCardAnyV4(c);
      if(!h || h.zone !== 'mz') return;
      if(h.card.face === 'down') API.flip(h, 'up', 'カオス・インフィニティ');
      const now = locateCardAnyV4(c);
      if(now && now.zone === 'mz') API.changePosition(now, 'atk', 'カオス・インフィニティ');
    });
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || (r.zone !== 'deck' && r.zone !== 'grave') || !c4MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, r.zone, r.index, 'atk', 'カオス・インフィニティ', r.p);
    const now = findCardByUid(uid);
    if(now && now.zone === 'mz'){
      API.negate(now, 'カオス・インフィニティ');
      API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c4.chaosInfinity',
                     args:{ uid:uid, player:ctx.player }, source:{ card:ctx.card },
                     note:'カオス・インフィニティ' });
    }
  },
  afterResolve(){}
});

/* 22. フェデライザー — 戦闘によって破壊され墓地へ送られた時、
       デッキからデュアルモンスター1体を墓地へ送り、1枚ドローできる */
function c4DualDeck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && (x.db.st || []).includes('デュアル'));
}
defineScript('フェデライザー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c4DualDeck(ctx.player).length){ ctx.reason = 'デッキにデュアルモンスターがいません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('フェデライザー：墓地へ送るデュアルモンスター', c4DualDeck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'deck') return;
    API.sendToGrave(r, 'フェデライザー');
    API.draw(ctx.player, 1);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c4DualDeck(ctx.player).length > 0
      && API.me(ctx).deck.length > 0; } }
});

/* 23. レベル変換実験室 — 手札のモンスター1枚を相手に見せてサイコロを1回振る。
       1の目なら墓地へ送る。2〜6ならエンドフェイズ時までそのレベルになる */
defineScript('レベル変換実験室', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!API.pileCards(ctx.player, 'hand', x => x.db.k === 'm').length){
      ctx.reason = '手札にモンスターカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('レベル変換実験室：相手に見せるモンスター',
      API.pileCards(ctx.player, 'hand', x => x.db.k === 'm'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    /* replay 安全な duelRandomInt でサイコロを振る */
    const roll = (typeof duelRandomInt === 'function' ? duelRandomInt(6) : 0) + 1;
    API.setFlag(ctx.player, 'c4LevelLabRoll', roll, true);
    if(roll === 1){
      API.sendHandToGrave(ctx.player, r.index, 'レベル変換実験室');
      return;
    }
    const now = locateCardAnyV4(r.card);
    if(now && now.zone === 'hand') API.setLevel(now, roll, 'endTurn', 'レベル変換実験室');
  },
  afterResolve(){}
});
