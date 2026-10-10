/* Auto cycle 11 — 24枚。engine 変更なし。
     IA 戦闘破壊まわりの追加処理
     IB 守備表示での反撃
     IC 破壊耐性・ダメージ軽減（v21 protect / continuous.battleDamage）
     ID 蘇生・回収（v7 scheduler / v30 B3 の破壊記録）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 守備表示のこのカードが攻撃を受け、守備力が攻撃モンスターの攻撃力を越えているか */
function b3ThornCounter(ctx){
  const b = ctx.battle || {};
  if(b.defCard !== ctx.card || !b.atkCard) return null;
  if(ctx.zone !== 'mz' || ctx.card.pos !== 'def') return null;
  if(!(curDEF(ctx.card) > curATK(b.atkCard))) return null;
  const h = locateCardAnyV4(b.atkCard);
  return (h && h.zone === 'mz') ? b.atkCard : null;
}
/* 「守備表示で攻撃を受け、守備力が上回っていれば攻撃モンスターを破壊」共通実装 */
function b3ThornMonster(name, timing){
  defineScript(name, {
    type:'monster', priority:1, forced:true, dsTiming:timing,
    condition(ctx){
      if(!b3ThornCounter(ctx)){ ctx.reason = '守備表示で攻撃を受け守備力が上回る必要があります'; return false; }
      return true;
    },
    resolve(ctx){
      const o = b3ThornCounter(ctx);
      const h = o && locateCardAnyV4(o);
      if(h && h.zone === 'mz') API.destroy(h, name);
    },
    afterResolve(){},
    passive:{ onDamageStep(ctx){ return !!b3ThornCounter(ctx); } }
  });
}
/* 「表側表示のこのカードをリリースして、このターン戦闘破壊された自分のモンスター1体をデッキへ」 */
function b3TributeRecycle(name, toBottom){
  defineScript(name, {
    type:'monster', priority:1, targets:true, timing:['mainPhase'],
    condition(ctx){
      if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
      if(!a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player }).length){
        ctx.reason = 'このターン戦闘で破壊され墓地へ送られたモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){ a7TributeSelf(ctx, done, name + '（コスト）'); },
    selectTargets(ctx, done){
      const q = a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player })
        .map(c => locateCardAnyV4(c)).filter(Boolean);
      API.selectCard(name + '：デッキに戻すモンスター', q, t => done([t]));
    },
    resolve(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(r && r.zone === 'grave') API.returnToDeck(r, toBottom, name);
    },
    afterResolve(){}
  });
}

/* ===================== IA. 戦闘破壊まわり ===================== */

/* 1. スクリーチ — 戦闘によって破壊された場合、デッキから水属性モンスター2体を墓地へ送る */
function b3WaterDeck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && x.db.at === '水');
}
defineScript('スクリーチ', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊された場合に発動します'; return false; }
    if(b3WaterDeck(ctx.player).length < 2){ ctx.reason = 'デッキに水属性モンスターが2体必要です'; return false; }
    return true;
  },
  resolve(ctx){
    for(let i = 0; i < 2; i++){
      const q = b3WaterDeck(ctx.player);
      if(!q.length) break;
      const r = resolveTarget(q[0]);
      if(!r || r.zone !== 'deck') break;
      API.mill(ctx.player, r.index, 'スクリーチ');
    }
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && b3WaterDeck(ctx.player).length >= 2; } }
});

/* 2. 地獄戦士 — 相手モンスターの攻撃によって破壊され墓地へ送られた時、
   この戦闘で自分が受けた戦闘ダメージを相手ライフにも与える */
defineScript('地獄戦士', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    const b = ctx.battle || {};
    if(b.defCard !== ctx.card){ ctx.reason = '相手モンスターの攻撃で破壊された場合に発動します'; return false; }
    if(!(Number(b.damage) > 0 && b.toPlayer === ctx.player)){
      ctx.reason = 'この戦闘で自分が戦闘ダメージを受けていません'; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || {};
    const n = Math.max(0, Number(b.damage) || 0);
    if(n > 0) API.damageLP(ctx.opponent, n);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(!a3SelfBattleDestroyed(ctx)) return false;
    const b = ctx.battle || {};
    return b.defCard === ctx.card && Number(b.damage) > 0 && b.toPlayer === ctx.player; } }
});

/* 3. ジャッカルの聖戦士 — 相手モンスターを戦闘破壊し相手の墓地へ送った時、
   そのカードを相手のデッキの一番上に戻す事ができる */
defineScript('ジャッカルの聖戦士', {
  type:'monster', priority:1, dsTiming:'after',
  condition(ctx){
    const v = a9KilledFoe(ctx);
    if(!v){ ctx.reason = '相手モンスターを戦闘破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = a9KilledFoe(ctx);
    const h = v && locateCardAnyV4(v);
    if(!h || h.zone !== 'mz') return;
    delete h.card.battleDestroyed;
    API.returnToDeck(h, false, 'ジャッカルの聖戦士');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a9KilledFoe(ctx); } }
});

/* 4. レガシーハンター — 裏側守備表示モンスターを戦闘破壊し墓地へ送った時、
   相手はランダムに手札を1枚デッキに戻し、その後デッキをシャッフルする */
function b3LegacyOk(ctx){
  const v = a9KilledFoe(ctx);
  if(!v) return false;
  return v.face === 'down' && v.pos === 'def';
}
defineScript('レガシーハンター', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!b3LegacyOk(ctx)){ ctx.reason = '裏側守備表示モンスターを戦闘破壊した場合に発動します'; return false; }
    if(!API.foe(ctx).hand.length){ ctx.reason = '相手の手札がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const H = API.foe(ctx).hand || [];
    if(!H.length) return;
    const i = duelRandomInt(H.length);
    const q = API.pileCards(ctx.opponent, 'hand');
    const t = q[i];
    if(t){ const r = resolveTarget(t); if(r && r.zone === 'hand') API.returnToDeck(r, false, 'レガシーハンター'); }
    API.shuffle(ctx.opponent);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return b3LegacyOk(ctx) && API.foe(ctx).hand.length > 0; } }
});

/* 5. 霞の谷の戦士 — このカードとの戦闘で破壊されなかった相手モンスターを
   ダメージステップ終了時に持ち主の手札に戻す */
defineScript('霞の谷の戦士', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!b2HammerSurvivor(ctx)){ ctx.reason = '戦闘で破壊されなかった相手モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = b2HammerSurvivor(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.returnToHand(h, '霞の谷の戦士');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'mz' && ctx.card.face === 'up' && !!b2HammerSurvivor(ctx); } }
});

/* 6. ヴァイロン・ヴァンガード は SKIP（ENGINE_GAP）。
   「このカードに装備されていた装備カードの数だけドロー」には、破壊された瞬間に
   何枚装備されていたかが要る。FX_TO_GRAVE は場を離れる前に dropEquips() で
   装備を外すため、onDestroy / onSendToGrave の時点では枚数を数えられず、
   graveInfo にも装備枚数は残らない。
   必要なのは「場を離れる直前の装備枚数」を graveInfo 等へ残す最小の provenance。 */

/* 7. ダーク・ヒーロー ゾンバイア — 戦闘によってモンスターを破壊する度に攻撃力200ダウン。
   相手プレイヤーに直接攻撃する事はできない。 */
function b3ZombyreStacks(card){ return Math.max(0, Number(card && card.b3ZombyreN) || 0); }
defineScript('ダーク・ヒーロー ゾンバイア', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  canDirectAttack:false,
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によってモンスターを破壊した場合に処理します'; return false; }
    if(ctx.zone !== 'mz'){ ctx.reason = 'フィールドに残っている必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.setCardFlag(me, 'b3ZombyreN', b3ZombyreStacks(ctx.card) + 1, 'ダーク・ヒーロー ゾンバイア');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && !!a9KilledFoe(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      const n = b3ZombyreStacks(self);
      return n > 0 ? { atk:-200 * n } : null;
    },
    cannotDirectAttack(target, self){ return target === (self || target); }
  }
});

/* 8. 堕天使エデ・アーラエ — 墓地から特殊召喚したこのカードは、
   守備表示モンスターを攻撃した場合に貫通する */
defineScript('堕天使エデ・アーラエ', {
  type:'monster', priority:1,
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      const self = info.self;
      /* 墓地から特殊召喚された場合のみ（v30 B2 の由来を使う） */
      if(!(self && self.specialSummoned && self.specialSummonedFrom === 'grave')) return 0;
      if(info.atkCard !== self || !info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    }
  }
});

/* ===================== IB. 守備表示での反撃 ===================== */

/* 9/10. 針千本（ダメージステップ終了時）／針二千本（ダメージ計算後） */
b3ThornMonster('針千本', 'end');
b3ThornMonster('針二千本', 'after');

/* 11. 不屈闘士レイレイ — 攻撃した場合バトルフェイズ終了時に守備表示になり、
   次の自分ターン終了時まで表示形式を変更できない */
b0AttackThenDefend('不屈闘士レイレイ');

/* ===================== IC. 破壊耐性・ダメージ軽減 ===================== */

/* 12. 海竜神の加護 — このターンのエンドフェイズ時まで、自分フィールドの
   レベル3以下の水属性モンスターは戦闘及びカードの効果では破壊されない */
function b3SeaGuardOk(target, self){
  const loc = locateCard(target), me = locateCard(self) || locateCardAnyV4(self);
  if(!loc || !me || loc.p !== me.p) return false;
  const f = gameState.players[loc.p] && gameState.players[loc.p].temporaryFlags;
  if(!(f && Number(f.b3SeaGuardTurn) === gameState.turn)) return false;
  const db = dbOf(target);
  return db.at === '水' && Number(db.lv || 99) <= 3;
}
defineScript('海竜神の加護', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){ API.setFlag(ctx.player, 'b3SeaGuardTurn', gameState.turn, true); },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['sz','grave'],
    apply(){ return null; },
    /* v21 の protect 宣言は「各フィールドが述語」のオブジェクト。
       関数を1つ返す形ではないので、battle / effect それぞれに条件を書く。 */
    protectV21:{
      key:'海竜神の加護',
      label:'海竜神の加護',
      battle: (target, self) => b3SeaGuardOk(target, self),
      effect: (target, self) => b3SeaGuardOk(target, self)
    }
  }
});

/* 13. ダメージ・ダイエット — このターン自分が受ける全てのダメージは半分になる */
defineScript('ダメージ・ダイエット', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){ API.setFlag(ctx.player, 'b3DietTurn', gameState.turn, true); },
  afterResolve(){},
  continuous:{
    scope:'self', from:['sz','grave'],
    apply(){ return null; },
    battleDamage(info){
      const self = info.self;
      const loc = locateCard(self) || locateCardAnyV4(self);
      const mine = loc ? loc.p : null;
      if(mine == null || info.to !== mine) return info.amount;
      const f = gameState.players[mine] && gameState.players[mine].temporaryFlags;
      if(!(f && Number(f.b3DietTurn) === gameState.turn)) return info.amount;
      return Math.floor(info.amount / 2);
    }
  }
});

/* 14. 魔轟神アシェンヴェイル — 戦闘を行うダメージ計算時に1度、手札を1枚墓地へ送り、
   そのダメージ計算時のみ攻撃力600アップ */
function b3AshenActive(card){
  const b = gameState.battle;
  if(!b) return false;
  const k = card && card.b3AshenBattle;
  if(k == null) return false;
  return k === String(gameState.turn) + ':' + String(b.atkUid) + ':' + String(b.targetUid);
}
defineScript('魔轟神アシェンヴェイル', {
  type:'monster', priority:2, dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!gameState.battle){ ctx.reason = '戦闘のダメージ計算時に発動します'; return false; }
    if(!a5BattleOtherOf(ctx.card) && gameState.battle.target !== 'direct'){
      ctx.reason = 'このカードが戦闘を行う場合に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(b3AshenActive(ctx.card)){ ctx.reason = 'このダメージ計算では既に発動しています'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = API.pileCards(ctx.player, 'hand');
    if(!q.length){ done(false); return; }
    API.selectCard('魔轟神アシェンヴェイル（コスト）：墓地へ送る手札', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){ API.sendHandToGrave(ctx.player, r.index, '魔轟神アシェンヴェイル（コスト）'); done(true); }
      else done(false);
    });
  },
  resolve(ctx){
    const b = gameState.battle;
    if(!b) return;
    const me = locateCardAnyV4(ctx.card);
    const key = String(gameState.turn) + ':' + String(b.atkUid) + ':' + String(b.targetUid);
    if(me) API.setCardFlag(me, 'b3AshenBattle', key, '魔轟神アシェンヴェイル');
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      return b3AshenActive(self) ? { atk:600 } : null;
    }
  }
});

/* ===================== ID. 蘇生・回収 ===================== */

/* 15/16. 女豹の傭兵／紅蓮の女守護兵 — 自身をリリースし、このターン戦闘破壊された
   自分のモンスター1体をデッキの一番上／一番下へ戻す */
b3TributeRecycle('女豹の傭兵', false);
b3TributeRecycle('紅蓮の女守護兵', true);

/* 17. 堕天使マリー — 墓地に存在する場合、自分のスタンバイフェイズ時に1度だけ200回復 */
defineScript('堕天使マリー', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地に存在する場合に発動します'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    if(Number(ctx.card.b3MarieTurn) === gameState.turn){ ctx.reason = 'このターンは既に発動しています'; return false; }
    return true;
  },
  resolve(ctx){
    API.recoverLP(ctx.player, 200);
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'b3MarieTurn', gameState.turn, '堕天使マリー');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'grave' && gameState.activePlayer === ctx.player
      && Number(ctx.card.b3MarieTurn) !== gameState.turn; } }
});

/* 18. ゲルニア — フィールドの表側表示のこのカードが相手の効果で破壊され墓地へ送られた場合、
   次の自分スタンバイフェイズにこのカードを墓地から特殊召喚する */
API.registerScheduleHandler('b3.gernia', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave' && (gameState.players[p].mz || []).length < ZONE_LIMITS.mz)
    API.specialSummon(p, 'grave', h.index, 'atk', 'ゲルニア', h.p);
});
defineScript('ゲルニア', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!b1FoxDestroyed(ctx)){ ctx.reason = '相手の効果で破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'b3.gernia',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card }, note:'ゲルニア' });
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){ return b1FoxDestroyed(ctx); } }
});

/* 19. リバイバルスライム — 戦闘によって墓地へ送られた時、1000ライフを払って
   次の自分のスタンバイフェイズに表側守備表示で特殊召喚できる */
API.registerScheduleHandler('b3.revivalSlime', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave' && (gameState.players[p].mz || []).length < ZONE_LIMITS.mz)
    API.specialSummon(p, 'grave', h.index, 'def', 'リバイバルスライム', h.p);
});
defineScript('リバイバルスライム', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).lp <= 1000){ ctx.reason = '1000ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'b3.revivalSlime',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card }, note:'リバイバルスライム' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && API.me(ctx).lp > 1000; } }
});

/* 20. 命の綱 — 自分モンスターが戦闘によって墓地へ送られた時、手札を全て捨てて発動する。
   そのモンスターの攻撃力を800アップさせてフィールドに特殊召喚する。 */
defineScript('命の綱', {
  type:'trap', priority:2, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(!a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player }).length){
      ctx.reason = 'このターン戦闘で墓地へ送られた自分のモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    const hand = API.me(ctx).hand || [];
    for(let i = hand.length - 1; i >= 0; i--) API.discard(ctx.player, i, '命の綱（コスト）', { byEffect:true, byPlayer:ctx.player });
    done(true);
  },
  selectTargets(ctx, done){
    const q = a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player })
      .map(c => locateCardAnyV4(c)).filter(Boolean);
    API.selectCard('命の綱：特殊召喚するモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    const card = r.card;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '命の綱', r.p);
    const now = locateCardAnyV4(card);
    if(now && now.zone === 'mz') API.modAtk(now, 800, 0, 'permanent', '命の綱');
  },
  afterResolve(){}
});

/* 21. 超能力治療 — エンドフェイズ時にのみ発動できる。
   このターン墓地へ送られたサイキック族モンスターの数×1000 ライフ回復する。 */
function b3PsychicToGraveThisTurn(p){
  return API.pileCards(p, 'grave', x => {
    if(x.db.k !== 'm' || x.db.ra !== 'サイキック') return false;
    const g = x.card.graveInfo;
    return !!(g && g.turn === gameState.turn);
  }).length;
}
defineScript('超能力治療', {
  type:'trap', priority:2, timing:['endPhase'],
  condition(ctx){
    if(gameState.phase !== 'end'){ ctx.reason = 'エンドフェイズ時に発動します'; return false; }
    if(!b3PsychicToGraveThisTurn(ctx.player)){ ctx.reason = 'このターン墓地へ送られたサイキック族がいません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = b3PsychicToGraveThisTurn(ctx.player);
    if(n > 0) API.recoverLP(ctx.player, n * 1000);
  },
  afterResolve(){}
});

/* 22. 緊急テレポート — 手札・デッキからレベル3以下のサイキック族1体を特殊召喚する。
   この効果で特殊召喚したモンスターはこのターンのエンドフェイズに除外される。 */
API.registerScheduleHandler('b3.teleportBanish', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.banish(h, '緊急テレポート');
});
function b3TeleportTargets(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && !x.db.ex
      && x.db.ra === 'サイキック' && Number(x.db.lv || 99) <= 3)
    .concat(API.pileCards(p, 'deck', x => x.db.k === 'm' && !x.db.ex
      && x.db.ra === 'サイキック' && Number(x.db.lv || 99) <= 3));
}
defineScript('緊急テレポート', {
  type:'spell', priority:2, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(!b3TeleportTargets(ctx.player).length){ ctx.reason = '対象のサイキック族がいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('緊急テレポート：特殊召喚するサイキック族', b3TeleportTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || (r.zone !== 'hand' && r.zone !== 'deck')) return;
    const card = r.card;
    ensureCardUid(gameState, card);
    API.specialSummon(ctx.player, r.zone, r.index, 'atk', '緊急テレポート', ctx.player);
    const now = locateCardAnyV4(card);
    if(now && now.zone === 'mz')
      API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'b3.teleportBanish',
                     args:{ uid:card.uid }, source:{ card:ctx.card }, note:'緊急テレポート' });
  },
  afterResolve(){}
});

/* 23. 深海の大ウナギ — フィールドから墓地へ送られた時、自分フィールドの
   表側表示の全ての水属性モンスターの攻撃力はエンドフェイズ時まで500アップする */
function b3EelOk(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('深海の大ウナギ', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!b3EelOk(ctx)){ ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.at === '水' }).length){
      ctx.reason = '自分フィールドに表側表示の水属性モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    API.fieldCards({ player:ctx.player, zone:'mz',
      filter:x => x.card.face === 'up' && x.db.at === '水' }).forEach(x => {
        const r = resolveTarget(x);
        if(r && r.zone === 'mz') API.modAtk(r, 500, 0, 'endPhase', '深海の大ウナギ');
      });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return b3EelOk(ctx) && API.fieldCards({ player:ctx.player, zone:'mz',
      filter:x => x.card.face === 'up' && x.db.at === '水' }).length > 0; } }
});

/* 24. 霊滅独鈷杵（装備魔法） — 装備モンスターが相手ライフに戦闘ダメージを与えた時、
   相手の墓地のモンスターを2体まで選択してゲームから除外できる */
API.registerChoiceHandler('b3.tokkosho', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave') API.banish(h, '霊滅独鈷杵');
  });
});
defineScript('霊滅独鈷杵', {
  type:'spell', priority:1,
  condition(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq){ ctx.reason = '装備モンスターがいません'; return false; }
    const e = ctx.event || {};
    if(!(Number(e.amount) > 0) || e.player !== ctx.opponent){
      ctx.reason = '装備モンスターが相手に戦闘ダメージを与えた場合に発動します'; return false; }
    if(!(e.attackerUid === eq.uid || e.defenderUid === eq.uid)){
      ctx.reason = '装備モンスターの戦闘ダメージではありません'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave', y => y.db.k === 'm').length){
      ctx.reason = '相手の墓地にモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = API.pileCards(ctx.opponent, 'grave', y => y.db.k === 'm');
    if(!q.length) return;
    API.requestChoice({
      player:ctx.player, kind:'card', title:'霊滅独鈷杵：除外する相手の墓地のモンスター（2体まで）',
      candidates:q, min:0, max:Math.min(2, q.length),
      resume:{ handler:'b3.tokkosho', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq) return false;
    const e = ctx.event || {};
    if(!(Number(e.amount) > 0) || e.player !== ctx.opponent) return false;
    if(!(e.attackerUid === eq.uid || e.defenderUid === eq.uid)) return false;
    return API.pileCards(ctx.opponent, 'grave', y => y.db.k === 'm').length > 0; } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});
