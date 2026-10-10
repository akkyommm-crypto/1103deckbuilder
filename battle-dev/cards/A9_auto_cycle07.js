/* Auto cycle 07 — 28枚。engine 変更なし。
     DA 戦闘破壊時の追加処理（dsTiming 'after'：破壊処理前なのでまだ場にいる）
     DB 攻撃した場合のダメージステップ終了時処理（dsTiming 'end'）
     DC 戦闘ダメージ関連（onBattleDamage / continuous.battleDamage）
     DD 蘇生・除外・ドローの魔法／罠（v7 scheduler で「エンドフェイズに」を表す）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 「このカードが攻撃した」ダメージステップ終了時か */
function a9SelfAttacked(ctx){
  const b = ctx.battle || {};
  return b.atkCard === ctx.card;
}
/* 自分が戦闘で破壊した相手モンスター（'after' 時点ではまだ場にいる） */
function a9KilledFoe(ctx){ return a6DestroyedFoeInBattle(ctx); }
/* このカードと戦闘した相手 */
function a9BattleFoe(ctx){ return a3BattleOther(ctx); }
/* 相手フィールドの表側表示モンスター */
function a9FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' });
}
/* 自分の墓地の通常モンスター */
function a9NormalGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && (x.db.st || []).includes('通常'));
}
/* 「戦闘を行ったモンスターの効果を無効にする」共通実装（ダメージ計算後） */
function a9NegateBattledFoe(name, pick){
  defineScript(name, {
    type:'monster', priority:1, forced:true, dsTiming:'after', targets:false,
    condition(ctx){
      if(!pick(ctx)){ ctx.reason = 'この効果の条件を満たす戦闘ではありません'; return false; }
      return true;
    },
    resolve(ctx){
      const o = pick(ctx);
      const h = o && locateCardAnyV4(o);
      if(h && h.zone === 'mz') API.negate(h, name);
    },
    afterResolve(){},
    passive:{ onDamageStep(ctx){ return !!pick(ctx); } }
  });
}

/* ===================== DA. 戦闘破壊時の追加処理 ===================== */

/* 1. KA－2 デス・シザース — 戦闘破壊したモンスターのレベル×500ダメージ */
defineScript('KA－2 デス・シザース', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によってモンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = a9KilledFoe(ctx);
    if(!v) return;
    const lv = Math.max(0, curLV(v) || 0);
    if(lv > 0) API.damageLP(ctx.opponent, lv * 500);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a9KilledFoe(ctx); } }
});

/* 2. エメス・ザ・インフィニティ — 戦闘で相手モンスターを破壊した場合、攻撃力+700。
   MOD_ADD はダメージ計算以降を禁じているため、回数を整数で持ち継続効果で反映する。 */
function a9EmesStacks(card){ return Math.max(0, Number(card && card.a9EmesN) || 0); }
defineScript('エメス・ザ・インフィニティ', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(ctx.zone !== 'mz'){ ctx.reason = 'フィールドに残っている必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.setCardFlag(me, 'a9EmesN', a9EmesStacks(ctx.card) + 1, 'エメス・ザ・インフィニティ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && !!a9KilledFoe(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      const n = a9EmesStacks(self);
      return n > 0 ? { atk:700 * n } : null;
    }
  }
});

/* 3. インフェルノ・ハンマー — 戦闘で相手モンスターを破壊した時、
   相手フィールドの表側表示モンスター1体を裏側守備表示にする */
defineScript('インフェルノ・ハンマー', {
  type:'monster', priority:1, targets:true, dsTiming:'after',
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(!a9FoeFaceUp(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('インフェルノ・ハンマー：裏側守備表示にするモンスター', a9FoeFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.changePosition(r, 'def', 'インフェルノ・ハンマー');
    API.flip(r, 'down', 'インフェルノ・ハンマー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a9KilledFoe(ctx) && a9FoeFaceUp(ctx).length > 0; } }
});

/* 4. アマゾネス訓練生 — 戦闘で破壊したモンスターは墓地へ送らず持ち主のデッキの一番下へ。
   相手モンスターを破壊した場合、このカードの攻撃力+200。
   'after' は戦闘破壊処理（BATTLE_CLEANUP）より前なので、ここでデッキへ戻せば墓地を経由しない。 */
function a9AmazonStacks(card){ return Math.max(0, Number(card && card.a9AmazonN) || 0); }
defineScript('アマゾネス訓練生', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によってモンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = a9KilledFoe(ctx);
    const h = v && locateCardAnyV4(v);
    if(h && h.zone === 'mz'){
      delete h.card.battleDestroyed;          /* 墓地へは行かせない */
      API.returnToDeck(h, true, 'アマゾネス訓練生');
    }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.setCardFlag(me, 'a9AmazonN', a9AmazonStacks(ctx.card) + 1, 'アマゾネス訓練生');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a9KilledFoe(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      const n = a9AmazonStacks(self);
      return n > 0 ? { atk:200 * n } : null;
    }
  }
});

/* ===================== DB. 攻撃した場合のDS終了時処理 ===================== */

/* 5. アックス・ドラゴニュート — 攻撃した場合、ダメージステップ終了時に守備表示になる */
defineScript('アックス・ドラゴニュート', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    if(!a9SelfAttacked(ctx)){ ctx.reason = 'このカードが攻撃した場合に処理します'; return false; }
    if(ctx.zone !== 'mz'){ ctx.reason = 'フィールドに残っている必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.changePosition(me, 'def', 'アックス・ドラゴニュート');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && a9SelfAttacked(ctx); } }
});

/* 6. アマゾネスの賢者 — 攻撃した場合、ダメージステップ終了時に
   相手フィールドの魔法・罠カード1枚を選択して破壊する */
function a9FoeSpellTrap(ctx){
  return API.fieldCards({ player:ctx.opponent, filter:x => x.zone === 'sz' || x.zone === 'field' });
}
defineScript('アマゾネスの賢者', {
  type:'monster', priority:1, forced:true, targets:true, dsTiming:'end',
  condition(ctx){
    if(!a9SelfAttacked(ctx)){ ctx.reason = 'このカードが攻撃した場合に処理します'; return false; }
    if(!a9FoeSpellTrap(ctx).length){ ctx.reason = '相手フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('アマゾネスの賢者：破壊する魔法・罠カード', a9FoeSpellTrap(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, 'アマゾネスの賢者');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a9SelfAttacked(ctx) && a9FoeSpellTrap(ctx).length > 0; } }
});

/* 7/8. エレキタリス／A・O・J ブラインド・サッカー —
   戦闘を行ったモンスターの効果をダメージ計算後に無効化する */
a9NegateBattledFoe('エレキタリス', ctx => {
  const o = a9BattleFoe(ctx);
  return (o && (dbOf(o).st || []).includes('効果')) ? o : null;
});
a9NegateBattledFoe('A・O・J ブラインド・サッカー', ctx => {
  const o = a9BattleFoe(ctx);
  return (o && dbOf(o).at === '光') ? o : null;
});
/* エレキタリスは1度のバトルフェイズ中に2回攻撃できる */
CARD_SCRIPTS['エレキタリス'].attackLimit = 2;

/* 9. エレキツツキ — 1度のバトルフェイズ中に2回攻撃できる。
   このカードと戦闘を行ったモンスターは表示形式を変更できない。 */
defineScript('エレキツツキ', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  attackLimit:2,
  condition(ctx){
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    if(Number(o.a9WoodpeckerLock) === gameState.turn){ ctx.reason = '既に適用しています'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.setCardFlag(h, 'a9WoodpeckerLock', gameState.turn, 'エレキツツキ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz') && Number(o.a9WoodpeckerLock) !== gameState.turn; } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(target){
      return Number(target && target.a9WoodpeckerLock) === gameState.turn;
    }
  }
});

/* 10. でんきトカゲ — アンデット族以外のモンスターがこのカードを攻撃した場合、
   そのモンスターは次のターン攻撃宣言をする事ができない */
defineScript('でんきトカゲ', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const b = ctx.battle || {};
    if(b.defCard !== ctx.card || !b.atkCard){ ctx.reason = 'このカードが攻撃された場合に処理します'; return false; }
    if(dbOf(b.atkCard).ra === 'アンデット'){ ctx.reason = 'アンデット族には適用しません'; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || {};
    const h = b.atkCard && locateCardAnyV4(b.atkCard);
    /* 攻撃宣言できるのは自分のターンだけなので、「次のターン」は
       攻撃してきたプレイヤーの次の自分のターン（現在ターン+2）にあたる。 */
    if(h && h.zone === 'mz') API.setCardFlag(h, 'a9LizardLockTurn', gameState.turn + 2, 'でんきトカゲ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    return b.defCard === ctx.card && !!b.atkCard && dbOf(b.atkCard).ra !== 'アンデット'; } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(target){
      return Number(target && target.a9LizardLockTurn) === gameState.turn;
    }
  }
});

/* ===================== DC. 戦闘ダメージ関連 ===================== */

/* 11. アスワンの亡霊 — 相手プレイヤーに戦闘ダメージを与えた場合、
   自分の墓地の罠カード1枚をデッキの一番上に戻す事ができる */
function a9TrapGrave(p){ return API.pileCards(p, 'grave', x => x.db.k === 't'); }
defineScript('アスワンの亡霊', {
  type:'monster', priority:1, targets:true,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!a9TrapGrave(ctx.player).length){ ctx.reason = '墓地に罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('アスワンの亡霊：デッキの一番上に戻す罠カード', a9TrapGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, false, 'アスワンの亡霊');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return a3DealtBattleDamage(ctx) && a9TrapGrave(ctx.player).length > 0; } }
});

/* 12. クロスカウンター — 攻撃された守備表示モンスターの守備力が相手攻撃モンスターの
   攻撃力を越えていた場合、相手に与える戦闘ダメージは倍になる。
   ダメージ計算後にその攻撃モンスターを破壊する。 */
function a9CrossOk(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!atk || !def) return null;
  if(b.player === ctx.player) return null;          /* 攻撃してきたのが相手である必要がある */
  if(def.pos !== 'def') return null;
  if(!(curDEF(def) > curATK(atk))) return null;
  return atk;
}
defineScript('クロスカウンター', {
  type:'trap', priority:2, forced:true, dsTiming:'after', targets:false,
  condition(ctx){
    if(!a9CrossOk(ctx)){ ctx.reason = '守備力が攻撃モンスターの攻撃力を越えている必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const atk = a9CrossOk(ctx);
    const h = atk && locateCardAnyV4(atk);
    if(h && h.zone === 'mz') API.destroy(h, 'クロスカウンター');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a9CrossOk(ctx); } },
  continuous:{
    scope:'self', from:['sz'],
    apply(){ return null; },
    battleDamage(info){
      const b = gameState.battle;
      if(!b || b.target === 'direct') return info.amount;
      const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
      const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
      if(!atk || !def || def.pos !== 'def') return info.amount;
      if(!(curDEF(def) > curATK(atk))) return info.amount;
      if(info.to !== b.player) return info.amount;   /* 相手が受けるダメージだけ倍にする */
      return info.amount * 2;
    }
  }
});

/* 13. ダメージ・ゲート — 自分が戦闘ダメージを受けた時、その数値以下の攻撃力を持つ
   自分の墓地のモンスター1体を特殊召喚する */
function a9GateTargets(ctx, amount){
  return API.pileCards(ctx.player, 'grave',
    x => x.db.k === 'm' && !x.db.ex && Number(x.db.atk || 0) <= amount);
}
defineScript('ダメージ・ゲート', {
  type:'trap', priority:2, targets:true, includesSpecialSummon:true,
  condition(ctx){
    const e = ctx.event || {};
    if(!(Number(e.amount) > 0) || e.player !== ctx.player){
      ctx.reason = '自分が戦闘ダメージを受けた場合に発動します'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!a9GateTargets(ctx, Number(e.amount)).length){ ctx.reason = '墓地に対象のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const e = ctx.event || {};
    API.selectCard('ダメージ・ゲート：特殊召喚するモンスター', a9GateTargets(ctx, Number(e.amount)), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ダメージ・ゲート', r.p);
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    const e = ctx.event || {};
    return Number(e.amount) > 0 && e.player === ctx.player
      && API.me(ctx).mz.length < ZONE_LIMITS.mz
      && a9GateTargets(ctx, Number(e.amount)).length > 0; } }
});

/* 14. ガード・ブロック — 相手ターンの戦闘ダメージ計算時に発動できる。
   その戦闘による自分への戦闘ダメージは0になり、1枚ドローする。 */
defineScript('ガード・ブロック', {
  type:'trap', priority:2, dsTiming:'calc',
  condition(ctx){
    if(gameState.activePlayer === ctx.player){ ctx.reason = '相手ターンに発動します'; return false; }
    if(!gameState.battle){ ctx.reason = '戦闘のダメージ計算時に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'a9GuardTurn', gameState.turn, 'ガード・ブロック');
    API.draw(ctx.player, 1);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return gameState.activePlayer !== ctx.player && !!gameState.battle && API.me(ctx).deck.length > 0; } },
  continuous:{
    scope:'self', from:['sz','grave'],
    apply(){ return null; },
    battleDamage(info){
      const self = info.self;
      if(Number(self && self.a9GuardTurn) !== gameState.turn) return info.amount;
      const loc = locateCard(self) || locateCardAnyV4(self);
      const mine = loc ? loc.p : null;
      return (mine != null && info.to === mine) ? 0 : info.amount;
    }
  }
});

/* ===================== DD. 蘇生・除外・ドロー ===================== */

/* 15. 心変わり — 相手モンスター1体のコントロールをエンドフェイズ時まで得る */
defineScript('心変わり', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('心変わり：コントロールを得るモンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.changeControl(r, ctx.player, '心変わり', 'endPhase', { card:ctx.card });
  },
  afterResolve(){}
});

/* 16. ミスフォーチュン — 相手の表側表示モンスター1体の元々の攻撃力の半分のダメージ。
   このターン自分のモンスターは攻撃できない。 */
defineScript('ミスフォーチュン', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!a9FoeFaceUp(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ミスフォーチュン：対象にする相手モンスター', a9FoeFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r) return;
    /* 「元々の攻撃力」なので現在値ではなくカードテキストの数値を使う。 */
    const base = Math.max(0, Number(dbOf(r.card).atk) || 0);
    if(base > 0) API.damageLP(ctx.opponent, Math.floor(base / 2));
    API.setFlag(ctx.player, 'a9MisfortuneTurn', gameState.turn, true);
  },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotAttack(target, self){
      const loc = locateCard(target);
      if(!loc) return false;
      const f = gameState.players[loc.p] && gameState.players[loc.p].temporaryFlags;
      return !!(f && Number(f.a9MisfortuneTurn) === gameState.turn);
    }
  }
});

/* 17. 魂の解放 — お互いの墓地のカードを合計5枚まで選択して除外する */
API.registerChoiceHandler('a9.soulRelease', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave') API.banish(h, '魂の解放');
  });
});
function a9BothGraves(){
  return API.pileCards(0, 'grave').concat(API.pileCards(1, 'grave'));
}
defineScript('魂の解放', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(!a9BothGraves().length){ ctx.reason = '墓地にカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = a9BothGraves();
    if(!q.length) return;
    API.requestChoice({
      player:ctx.player, kind:'card', title:'魂の解放：除外するカード（合計5枚まで）',
      candidates:q, min:0, max:Math.min(5, q.length),
      resume:{ handler:'a9.soulRelease', args:{ player:ctx.player } }
    });
  },
  afterResolve(){}
});

/* 18. 終わりの始まり — 自分の墓地に闇属性が7体以上いる場合、その内5体を除外して3枚ドロー */
defineScript('終わりの始まり', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(a8DarkGrave(ctx.player).length < 7){ ctx.reason = '墓地に闇属性モンスターが7体以上必要です'; return false; }
    if(API.me(ctx).deck.length < 3){ ctx.reason = 'デッキが3枚必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    for(let i = 0; i < 5; i++){
      const q = a8DarkGrave(ctx.player);
      if(!q.length){ done(false); return; }
      const r = resolveTarget(q[0]);
      if(!r || r.zone !== 'grave'){ done(false); return; }
      API.banish(r, '終わりの始まり（コスト）');
    }
    done(true);
  },
  resolve(ctx){ API.draw(ctx.player, 3); },
  afterResolve(){}
});

/* 19. 次元の歪み — 自分の墓地にカードが存在しない場合、除外された自分のモンスター1体を特殊召喚する */
function a9BanishedOwnMonsters(p){
  return API.pileCards(p, 'banish', x => x.db.k === 'm' && !x.db.ex);
}
defineScript('次元の歪み', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(API.me(ctx).grave.length > 0){ ctx.reason = '自分の墓地にカードが存在しない必要があります'; return false; }
    if(!a9BanishedOwnMonsters(ctx.player).length){ ctx.reason = '除外されている自分のモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('次元の歪み：特殊召喚するモンスター', a9BanishedOwnMonsters(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'banish') API.specialSummon(ctx.player, 'banish', r.index, 'atk', '次元の歪み', r.p);
  },
  afterResolve(){}
});

/* 20. 黙する死者 — 自分の墓地の通常モンスター1体を守備表示で特殊召喚する。
   この効果で特殊召喚したモンスターは攻撃できない。 */
defineScript('黙する死者', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(!a9NormalGrave(ctx.player).length){ ctx.reason = '墓地に通常モンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('黙する死者：特殊召喚する通常モンスター', a9NormalGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    const card = r.card;
    API.specialSummon(ctx.player, 'grave', r.index, 'def', '黙する死者', r.p);
    const now = locateCardAnyV4(card);
    if(now && now.zone === 'mz') API.setCardFlag(now, 'cannotAttack', true, '黙する死者');
  },
  afterResolve(){}
});

/* 21. 思い出のブランコ — 自分の墓地の通常モンスター1体を特殊召喚する。
   この効果で特殊召喚したモンスターはこのターンのエンドフェイズに破壊される。 */
API.registerScheduleHandler('a9.swingDestroy', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.destroy(h, '思い出のブランコ');
});
defineScript('思い出のブランコ', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(!a9NormalGrave(ctx.player).length){ ctx.reason = '墓地に通常モンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('思い出のブランコ：特殊召喚する通常モンスター', a9NormalGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    const card = r.card;
    ensureCardUid(gameState, card);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '思い出のブランコ', r.p);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'a9.swingDestroy',
                   args:{ uid:card.uid }, source:{ card:ctx.card }, note:'思い出のブランコ' });
  },
  afterResolve(){}
});

/* 22. 真炎の爆発 — 自分の墓地から守備力200の炎属性モンスターを可能な限り特殊召喚する。
   この効果で特殊召喚したモンスターはこのターンのエンドフェイズに除外される。 */
API.registerScheduleHandler('a9.blazeBanish', (entry) => {
  const uids = (entry && entry.uids) || [];
  uids.forEach(u => {
    const h = findCardByUid(u);
    if(h && h.zone === 'mz') API.banish(h, '真炎の爆発');
  });
});
function a9Def200Fire(p){
  return API.pileCards(p, 'grave',
    x => x.db.k === 'm' && !x.db.ex && x.db.at === '炎' && Number(x.db.def) === 200);
}
defineScript('真炎の爆発', {
  type:'spell', priority:1, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(!a9Def200Fire(ctx.player).length){ ctx.reason = '墓地に守備力200の炎属性モンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const uids = [];
    while(API.me(ctx).mz.length < ZONE_LIMITS.mz){
      const q = a9Def200Fire(ctx.player);
      if(!q.length) break;
      const r = resolveTarget(q[0]);
      if(!r || r.zone !== 'grave') break;
      const card = r.card;
      ensureCardUid(gameState, card);
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', '真炎の爆発', r.p);
      const now = locateCardAnyV4(card);
      if(now && now.zone === 'mz') uids.push(card.uid); else break;
    }
    if(uids.length) API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'a9.blazeBanish',
                                   args:{ uids:uids }, source:{ card:ctx.card }, note:'真炎の爆発' });
  },
  afterResolve(){}
});

/* 23. 生け贄人形 — 自分のモンスター1体をリリースし、手札から通常召喚可能な
   レベル7のモンスター1体を特殊召喚する。そのモンスターはこのターン攻撃できない。 */
function a9Level7Hand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && !x.db.ex
    && Number(x.db.lv) === 7 && !(x.db.st || []).includes('特殊召喚'));
}
defineScript('生け贄人形', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){ ctx.reason = 'リリースするモンスターがいません'; return false; }
    if(!a9Level7Hand(ctx.player).length){ ctx.reason = '手札に通常召喚可能なレベル7のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('生け贄人形（コスト）：リリースするモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), t => {
        const r = resolveTarget(t);
        if(r && r.zone === 'mz'){ API.sendToGrave(r, '生け贄人形（コスト）'); done(true); }
        else done(false);
      });
  },
  selectTargets(ctx, done){
    API.selectCard('生け贄人形：特殊召喚するレベル7モンスター', a9Level7Hand(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    const card = r.card;
    API.specialSummon(ctx.player, 'hand', r.index, 'atk', '生け贄人形', ctx.player);
    const now = locateCardAnyV4(card);
    if(now && now.zone === 'mz') API.setCardFlag(now, 'cannotAttack', true, '生け贄人形');
  },
  afterResolve(){}
});

/* 24. 受け継がれる力 — 自分のモンスター1体を墓地へ送り、自分のモンスター1体の攻撃力を
   発動ターンのエンドフェイズまで、墓地へ送ったモンスターの攻撃力分アップする */
defineScript('受け継がれる力', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(API.fieldCards({ player:ctx.player, zone:'mz' }).length < 2){
      ctx.reason = '自分フィールドにモンスターが2体必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('受け継がれる力（コスト）：墓地へ送るモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), t => {
        const r = resolveTarget(t);
        if(!r || r.zone !== 'mz'){ done(false); return; }
        /* 「墓地に送ったモンスターの攻撃力」は送る直前の数値を使う。 */
        ctx.a9Inherit = curATK(r.card);
        API.sendToGrave(r, '受け継がれる力（コスト）');
        done(true);
      });
  },
  selectTargets(ctx, done){
    API.selectCard('受け継がれる力：攻撃力を上げるモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const n = Math.max(0, Number(ctx.a9Inherit) || 0);
    if(r && r.zone === 'mz' && n > 0) API.modAtk(r, n, 0, 'endPhase', '受け継がれる力');
  },
  afterResolve(){}
});

/* 25. 死者の生還 — 手札からモンスター1枚を捨て、このターン戦闘で破壊され自分の墓地へ
   送られたモンスター1体を、ターン終了時に手札に戻す */
API.registerScheduleHandler('a9.reviveHand', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave') API.returnToHand(h, '死者の生還');
});
defineScript('死者の生還', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!API.pileCards(ctx.player, 'hand', x => x.db.k === 'm').length){
      ctx.reason = '手札にモンスターがいません'; return false; }
    if(!a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player }).length){
      ctx.reason = 'このターン戦闘で破壊され墓地へ送られたモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('死者の生還（コスト）：捨てるモンスター',
      API.pileCards(ctx.player, 'hand', x => x.db.k === 'm'), t => {
        const r = resolveTarget(t);
        if(r && r.zone === 'hand'){
          API.discard(ctx.player, r.index, '死者の生還（コスト）', { byEffect:true, byPlayer:ctx.player });
          done(true);
        } else done(false);
      });
  },
  selectTargets(ctx, done){
    const q = a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player })
      .map(c => locateCardAnyV4(c)).filter(Boolean);
    API.selectCard('死者の生還：ターン終了時に手札へ戻すモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    ensureCardUid(gameState, r.card);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'a9.reviveHand',
                   args:{ uid:r.card.uid }, source:{ card:ctx.card }, note:'死者の生還' });
  },
  afterResolve(){}
});

/* 26. 催眠術 — 次の相手ターン、相手はモンスターの表示形式を変更できない */
defineScript('催眠術', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(ctx){
    API.setFlag(ctx.opponent, 'a9HypnosisUntil', gameState.turn + 1, true);
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotChangePosition(target){
      const loc = locateCard(target);
      if(!loc) return false;
      const f = gameState.players[loc.p] && gameState.players[loc.p].temporaryFlags;
      return !!(f && Number(f.a9HypnosisUntil) >= gameState.turn);
    }
  }
});

/* 27. アースクエイク・ジャイアント — このカードの表示形式が変更された時、
   相手フィールドのモンスター1体の表示形式を変更できる。1ターンに1度。 */
defineScript('アースクエイク・ジャイアント', {
  type:'monster', priority:1, countLimit:1, targets:true,
  condition(ctx){
    const e = ctx.event || {};
    if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))){
      ctx.reason = 'このカードの表示形式が変更された場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('アースクエイク・ジャイアント：表示形式を変更するモンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    if(r.card.face === 'down'){ API.flip(r, 'up', 'アースクエイク・ジャイアント'); API.changePosition(r, 'atk', 'アースクエイク・ジャイアント'); }
    else API.changePosition(r, r.card.pos === 'atk' ? 'def' : 'atk', 'アースクエイク・ジャイアント');
  },
  afterResolve(){},
  passive:{ onPositionChange(ctx){
    const e = ctx.event || {};
    return ((e.card === ctx.card) || (e.uid != null && e.uid === ctx.card.uid))
      && API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0; } }
});

/* 28. A・ジェネクス・クラッシャー — 自分フィールドにこのカードと同じ属性のモンスターが
   召喚された時、相手フィールドのカード1枚を選択して破壊できる。1ターンに1度。 */
function a9SameAttrSummoned(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.player) return false;
  const mine = dbOf(ctx.card).at;
  return b2SummonedCards(e).some(c => {
    if(!c || c === ctx.card) return false;
    const h = locateCardAnyV4(c);
    return !!(h && h.p === ctx.player && h.zone === 'mz') && dbOf(c).at === mine;
  });
}
function a9FoeAnyCard(ctx){
  return API.fieldCards({ player:ctx.opponent,
    filter:x => x.zone === 'mz' || x.zone === 'sz' || x.zone === 'field' });
}
defineScript('A・ジェネクス・クラッシャー', {
  type:'monster', priority:1, countLimit:1, targets:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!a9SameAttrSummoned(ctx)){ ctx.reason = '同じ属性のモンスターが召喚された場合に発動します'; return false; }
    if(!a9FoeAnyCard(ctx).length){ ctx.reason = '相手フィールドにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('A・ジェネクス・クラッシャー：破壊する相手のカード', a9FoeAnyCard(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, 'A・ジェネクス・クラッシャー');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return ctx.zone === 'mz' && ctx.card.face === 'up'
      && a9SameAttrSummoned(ctx) && a9FoeAnyCard(ctx).length > 0; } }
});
