/* Auto cycle 08 — 28枚。engine 変更なし。
     FA 戦闘破壊時の LP / 蘇生
     FB 戦闘・攻撃に伴う表示形式変更
     FC コントロール移動トリガー（v26 onControlChange）
     FD 手札から墓地へ送られた時（v30 B1 の byPlayer）
     FE 永続・装備の毎ターン処理
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 「このカードがフィールドに表側表示で存在する限り1度」を、
   場に出た瞬間を表す summonedTurn と突き合わせて表す。
   場を離れて戻れば summonedTurn が変わるので自然に再使用できる。 */
function b0FieldOnceUsed(card, key){
  const v = card && card[key];
  return v != null && v === (card.summonedTurn != null ? card.summonedTurn : -1);
}
function b0MarkFieldOnce(handle, key, name){
  if(!handle || !handle.card) return;
  const v = handle.card.summonedTurn != null ? handle.card.summonedTurn : -1;
  API.setCardFlag(handle, key, v, name);
}
/* 戦闘破壊した相手モンスターのレベル / 元々の攻撃力にもとづく共通実装 */
function b0KillReward(name, fn){
  defineScript(name, {
    type:'monster', priority:1, forced:true, dsTiming:'after',
    condition(ctx){
      if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によってモンスターを破壊した場合に発動します'; return false; }
      return true;
    },
    resolve(ctx){ const v = a9KilledFoe(ctx); if(v) fn(ctx, v); },
    afterResolve(){},
    passive:{ onDamageStep(ctx){ return !!a9KilledFoe(ctx); } }
  });
}
/* 「攻撃した場合バトルフェイズ終了時に守備表示になり、
    次の自分ターン終了時まで表示形式を変更できない」共通実装 */
function b0AttackThenDefend(name){
  defineScript(name, {
    type:'monster', priority:1, forced:true,
    condition(ctx){
      if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
      if(!ctx.card.attacked){ ctx.reason = '攻撃した場合に処理します'; return false; }
      if((Number(ctx.card.b0DefLockUntil) || 0) >= gameState.turn){ ctx.reason = '既に処理しています'; return false; }
      return true;
    },
    resolve(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      API.changePosition(me, 'def', name);
      API.setCardFlag(me, 'b0DefLockUntil', gameState.turn + 2, name);
    },
    afterResolve(){},
    passive:{ onBattlePhaseEnd(ctx){
      return ctx.zone === 'mz' && !!ctx.card.attacked
        && (Number(ctx.card.b0DefLockUntil) || 0) < gameState.turn; } },
    continuous:{
      scope:'self', from:['mz'],
      apply(){ return null; },
      cannotChangePosition(target, self){
        const me = self || target;
        return gameState.turn <= (Number(me && me.b0DefLockUntil) || 0);
      }
    }
  });
}

/* ===================== FA. 戦闘破壊時の LP / 蘇生 ===================== */

/* 1. ニードルバンカー — 破壊したモンスターのレベル×500ダメージ */
b0KillReward('ニードルバンカー', (ctx, v) => {
  const lv = Math.max(0, curLV(v) || 0);
  if(lv > 0) API.damageLP(ctx.opponent, lv * 500);
});
/* 2. フレムベル・グルニカ — 破壊したモンスターのレベル×200ダメージ */
b0KillReward('フレムベル・グルニカ', (ctx, v) => {
  const lv = Math.max(0, curLV(v) || 0);
  if(lv > 0) API.damageLP(ctx.opponent, lv * 200);
});
/* 3. マンモ・フォッシル — 相手ライフに400ダメージ */
b0KillReward('マンモ・フォッシル', ctx => { API.damageLP(ctx.opponent, 400); });
/* 4. 吸収天児 — 破壊したモンスターのレベル×300 ライフ回復 */
b0KillReward('吸収天児', (ctx, v) => {
  const lv = Math.max(0, curLV(v) || 0);
  if(lv > 0) API.recoverLP(ctx.player, lv * 300);
});
/* 5. 守護天使 ジャンヌ — 破壊したモンスターの「元々の攻撃力」分だけ回復 */
b0KillReward('守護天使 ジャンヌ', (ctx, v) => {
  const base = Math.max(0, Number(dbOf(v).atk) || 0);
  if(base > 0) API.recoverLP(ctx.player, base);
});

/* 6. ジャッカルの霊騎士 — 戦闘によって破壊し墓地へ送った相手モンスター1体を、
   自分フィールドに表側守備表示で特殊召喚できる。
   墓地へ送られてから拾うので、バトルフェイズ終了時に処理する。 */
function b0JackalVictims(ctx){
  const st = gameState.battlePhaseV6;
  const atks = (st && Array.isArray(st.attacks)) ? st.attacks : [];
  const myUid = ctx.card && ctx.card.uid;
  if(myUid == null) return [];
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  const out = [];
  atks.forEach(a => {
    if(!a) return;
    let other = null;
    if(a.attackerUid === myUid) other = a.defenderUid;
    else if(a.defenderUid === myUid) other = a.attackerUid;
    if(other == null) return;
    const killed = log.some(x => x && x.battle && x.uid === other
      && x.turn === gameState.turn && x.from === 'mz' && x.victimPlayer === ctx.opponent);
    if(!killed) return;
    const h = findCardByUid(other);
    if(h && h.zone === 'grave' && out.indexOf(h.card) < 0) out.push(h.card);
  });
  return out;
}
defineScript('ジャッカルの霊騎士', {
  type:'monster', priority:1, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(!b0JackalVictims(ctx).length){ ctx.reason = '戦闘で破壊した相手モンスターが墓地にいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ジャッカルの霊騎士：特殊召喚する相手モンスター',
      b0JackalVictims(ctx).map(c => locateCardAnyV4(c)).filter(Boolean), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.specialSummon(ctx.player, 'grave', r.index, 'def', 'ジャッカルの霊騎士', r.p);
  },
  afterResolve(){},
  passive:{ onBattlePhaseEnd(ctx){
    return b0JackalVictims(ctx).length > 0 && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* ===================== FB. 表示形式の変更 ===================== */

/* 7. カンガルー・チャンプ — このカードと戦闘を行ったモンスターは、ダメージ計算後に守備表示になる */
defineScript('カンガルー・チャンプ', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    if(h.card.pos === 'def' && h.card.face === 'up'){ ctx.reason = '既に表側守備表示です'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.changePosition(h, 'def', 'カンガルー・チャンプ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz') && !(h.card.pos === 'def' && h.card.face === 'up'); } }
});

/* 8. ゴロゴル — このカードと戦闘を行った相手モンスターは、
   ダメージステップ終了時に裏側守備表示になる */
defineScript('ゴロゴル', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    if(h.card.face === 'down'){ ctx.reason = '既に裏側表示です'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(!h || h.zone !== 'mz') return;
    API.changePosition(h, 'def', 'ゴロゴル');
    API.flip(h, 'down', 'ゴロゴル');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz' && h.card.face !== 'down'); } }
});

/* 9-11. ゴブリンエリート部隊／ゴブリン突撃部隊／ジャイアント・オーク —
   攻撃した場合バトルフェイズ終了時に守備表示になり、
   次の自分ターンの終了時まで表示形式を変更できない */
b0AttackThenDefend('ゴブリンエリート部隊');
b0AttackThenDefend('ゴブリン突撃部隊');
b0AttackThenDefend('ジャイアント・オーク');

/* 12. スピア・ドラゴン — ①守備表示モンスターを攻撃した場合に貫通
   ②攻撃した場合、ダメージステップ終了時に守備表示になる */
defineScript('スピア・ドラゴン', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    if(!a9SelfAttacked(ctx)){ ctx.reason = 'このカードが攻撃した場合に処理します'; return false; }
    if(ctx.zone !== 'mz'){ ctx.reason = 'フィールドに残っている必要があります'; return false; }
    if(ctx.card.pos === 'def'){ ctx.reason = '既に守備表示です'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.changePosition(me, 'def', 'スピア・ドラゴン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'mz' && a9SelfAttacked(ctx) && ctx.card.pos !== 'def'; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard !== info.self || !info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    }
  }
});

/* 13. ライライダー — このカードと戦闘を行った相手モンスターは、
   フィールドに表側表示で存在する限り攻撃できない */
defineScript('ライライダー', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    if(b0FieldOnceUsed(o, 'b0RaiLock')){ ctx.reason = '既に適用しています'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') b0MarkFieldOnce(h, 'b0RaiLock', 'ライライダー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz') && !b0FieldOnceUsed(o, 'b0RaiLock'); } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    /* 「フィールド上に表側表示で存在する限り」なので、場を離れて戻れば解除される。
       b0FieldOnceUsed は summonedTurn と突き合わせるので自動で失効する。 */
    cannotAttack(target){ return b0FieldOnceUsed(target, 'b0RaiLock'); }
  }
});

/* 14. ドラゴン族・封印の壺（永続罠） — フィールドの全てのドラゴン族は守備表示になり、
   表示形式を変更する事ができない */
defineScript('ドラゴン族・封印の壺', {
  type:'trap', priority:2, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    const q = API.fieldCards({ zone:'mz',
      filter:x => x.db.ra === 'ドラゴン' && !(x.card.face === 'up' && x.card.pos === 'def') });
    if(!q.length){ ctx.reason = '守備表示にするドラゴン族がいません'; return false; }
    return true;
  },
  resolve(){
    API.fieldCards({ zone:'mz', filter:x => x.db.ra === 'ドラゴン' }).forEach(x => {
      const r = resolveTarget(x);
      if(!r || r.zone !== 'mz') return;
      if(r.card.face === 'down') API.flip(r, 'up', 'ドラゴン族・封印の壺');
      API.changePosition(r, 'def', 'ドラゴン族・封印の壺');
    });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return CARD_SCRIPTS['ドラゴン族・封印の壺'].condition(ctx); },
            onSpecialSummon(ctx){ return CARD_SCRIPTS['ドラゴン族・封印の壺'].condition(ctx); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotChangePosition(target){ return dbOf(target).ra === 'ドラゴン'; }
  }
});

/* ===================== FC. コントロール移動トリガー ===================== */

/* 15/16. アメーバ／グリグル — 表側表示のこのカードのコントロールが相手に移った時。
   v26 の onControlChange を使う（payload は uid / fromPlayer / toPlayer）。 */
function b0ControlMovedAway(ctx){
  const e = ctx.event || {};
  if(e.uid == null || e.uid !== ctx.card.uid) return false;
  if(e.zone !== 'mz') return false;
  /* 「相手に移った」＝ 元の持ち主から見て相手側へ渡った */
  if(e.fromPlayer == null || e.toPlayer == null) return false;
  if(e.fromPlayer === e.toPlayer) return false;
  return true;
}
function b0DefineControlGift(name, key, apply){
  defineScript(name, {
    type:'monster', priority:1, forced:true,
    condition(ctx){
      if(!b0ControlMovedAway(ctx)){ ctx.reason = 'このカードのコントロールが相手に移った場合に発動します'; return false; }
      if(b0FieldOnceUsed(ctx.card, key)){ ctx.reason = 'このカードがフィールドにいる間は1度だけです'; return false; }
      return true;
    },
    resolve(ctx){
      const e = ctx.event || {};
      apply(ctx, e);
      const me = locateCardAnyV4(ctx.card);
      if(me) b0MarkFieldOnce(me, key, name);
    },
    afterResolve(){},
    passive:{ onControlChange(ctx){
      return b0ControlMovedAway(ctx) && !b0FieldOnceUsed(ctx.card, key); } }
  });
}
/* 相手（新しいコントローラー）が2000ダメージを受ける */
b0DefineControlGift('アメーバ', 'b0AmoebaUsed', (ctx, e) => { API.damageLP(e.toPlayer, 2000); });
/* 元の持ち主が3000回復する */
b0DefineControlGift('グリグル', 'b0GriggleUsed', (ctx, e) => { API.recoverLP(e.fromPlayer, 3000); });

/* ===================== FD. 手札から墓地へ送られた時 ===================== */

/* 17/18. 恵みの像／災いの像 — 相手がコントロールするカードの効果によって
   このカードが手札から墓地へ送られた時。v30 B1 の byPlayer で「相手の効果」を見る。 */
function b0StatueOk(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.from === 'hand' && g.turn === gameState.turn)) return false;
  /* 「相手がコントロールするカードの効果によって」 */
  const by = (g.byPlayer != null) ? g.byPlayer
           : (ctx.card.discardInfo && ctx.card.discardInfo.byPlayer);
  return by === ctx.opponent;
}
function b0DefineStatue(name, apply){
  defineScript(name, {
    type:'monster', priority:1, forced:true, activateFrom:['grave'],
    condition(ctx){
      if(!b0StatueOk(ctx)){ ctx.reason = '相手のカードの効果で手札から墓地へ送られた場合に発動します'; return false; }
      return true;
    },
    resolve(ctx){ apply(ctx); },
    afterResolve(){},
    passive:{ onDiscard(ctx){ return b0StatueOk(ctx); },
              onSendToGrave(ctx){ return b0StatueOk(ctx); } }
  });
}
b0DefineStatue('恵みの像', ctx => { API.recoverLP(ctx.player, 2000); });
b0DefineStatue('災いの像', ctx => { API.damageLP(ctx.opponent, 2000); });

/* ===================== FE. 起動・毎ターン処理 ===================== */

/* 19. ゼンマイニャンコ — 自分のメインフェイズに相手モンスター1体を持ち主の手札へ戻す。
   フィールドに表側表示で存在する限り1度だけ。 */
defineScript('ゼンマイニャンコ', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(b0FieldOnceUsed(ctx.card, 'b0NyankoUsed')){ ctx.reason = 'このカードがフィールドにいる間は1度だけです'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ゼンマイニャンコ：手札に戻す相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.returnToHand(r, 'ゼンマイニャンコ');
    const me = locateCardAnyV4(ctx.card);
    if(me) b0MarkFieldOnce(me, 'b0NyankoUsed', 'ゼンマイニャンコ');
  },
  afterResolve(){}
});

/* 20. ヒール・ウェーバー — このカード以外の自分の表側モンスター1体を選択し、
   そのレベル×100 ライフ回復する */
function b0OtherOwnFaceUp(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.card.face === 'up' });
}
defineScript('ヒール・ウェーバー', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!b0OtherOwnFaceUp(ctx).length){ ctx.reason = 'このカード以外の自分の表側モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヒール・ウェーバー：選択するモンスター', b0OtherOwnFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const lv = Math.max(0, curLV(r.card) || 0);
    if(lv > 0) API.recoverLP(ctx.player, lv * 100);
  },
  afterResolve(){}
});

/* 21. ヴォルカニック・エッジ — 1ターンに1度、相手ライフに500ダメージ。
   発動するターン、このカードは攻撃できない。 */
defineScript('ヴォルカニック・エッジ', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    API.damageLP(ctx.opponent, 500);
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'b0EdgeNoAtkTurn', gameState.turn, 'ヴォルカニック・エッジ');
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotAttack(target, self){
      const me = self || target;
      return Number(me && me.b0EdgeNoAtkTurn) === gameState.turn;
    }
  }
});

/* 22. リターン・ゾンビ — 自分のスタンバイフェイズに、このカードが墓地にあり
   手札が0枚なら、500払ってこのカードを手札に加える */
defineScript('リターン・ゾンビ', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地から発動します'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    if(API.me(ctx).hand.length !== 0){ ctx.reason = '自分の手札が0枚である必要があります'; return false; }
    if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToHand(me, 'リターン・ゾンビ');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'grave' && gameState.activePlayer === ctx.player
      && API.me(ctx).hand.length === 0 && API.me(ctx).lp > 500; } }
});

/* 23. 不死式冥界砲（永続魔法） — 自分フィールドにアンデット族が特殊召喚された時、
   相手ライフに800ダメージ。1ターンに1度。 */
function b0UndeadSummoned(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.player) return false;
  return b2SummonedCards(e).some(c => {
    const h = locateCardAnyV4(c);
    return !!(h && h.p === ctx.player && h.zone === 'mz') && dbOf(c).ra === 'アンデット';
  });
}
defineScript('不死式冥界砲', {
  type:'spell', priority:1, forced:true, countLimit:1,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!b0UndeadSummoned(ctx)){ ctx.reason = '自分フィールドにアンデット族が特殊召喚された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 800); },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up' && b0UndeadSummoned(ctx); } }
});

/* 24. 天空の泉（永続魔法） — 光属性モンスターが戦闘によって破壊され自分の墓地へ
   送られた時、そのモンスターを除外してその攻撃力分ライフを回復する */
function b0LightVictims(ctx){
  return a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player })
    .filter(c => dbOf(c).at === '光');
}
defineScript('天空の泉', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!b0LightVictims(ctx).length){ ctx.reason = '戦闘で破壊された光属性モンスターが墓地にいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('天空の泉：除外する光属性モンスター',
      b0LightVictims(ctx).map(c => locateCardAnyV4(c)).filter(Boolean), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    const atk = Math.max(0, curATK(r.card) || 0);
    API.banish(r, '天空の泉');
    if(atk > 0) API.recoverLP(ctx.player, atk);
  },
  afterResolve(){}
});

/* 25. 墓荒らしの報い（永続罠） — 自分のスタンバイフェイズ毎に、
   除外されている相手モンスターの数×100ダメージ */
defineScript('墓荒らしの報い', {
  type:'trap', priority:2, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    if(!API.pileCards(ctx.opponent, 'banish', x => x.db.k === 'm').length){
      ctx.reason = '除外されている相手モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = API.pileCards(ctx.opponent, 'banish', x => x.db.k === 'm').length;
    if(n > 0) API.damageLP(ctx.opponent, n * 100);
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up' && gameState.activePlayer === ctx.player
      && API.pileCards(ctx.opponent, 'banish', x => x.db.k === 'm').length > 0; } }
});

/* 26. 呪魂の仮面（装備魔法） — 装備モンスターは攻撃できない。
   自分のスタンバイフェイズ毎に、装備モンスターのコントローラーに500ダメージ。 */
defineScript('呪魂の仮面', {
  type:'spell', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = '魔法＆罠ゾーンに存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const eq = a8Equipped(ctx.card);
    const h = eq && locateCardAnyV4(eq);
    if(h) API.damageLP(h.p, 500);
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && gameState.activePlayer === ctx.player && !!a8Equipped(ctx.card); } },
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(){ return null; },
    cannotAttack(){ return true; }
  }
});

/* 27. 強奪（装備魔法） — 装備した相手モンスターのコントロールを得る。
   相手のスタンバイフェイズ毎に相手は1000ライフ回復する。 */
defineScript('強奪', {
  type:'spell', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = '魔法＆罠ゾーンに存在する必要があります'; return false; }
    if(gameState.activePlayer === ctx.player){ ctx.reason = '相手のスタンバイフェイズに処理します'; return false; }
    if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){ API.recoverLP(ctx.opponent, 1000); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && gameState.activePlayer !== ctx.player && !!a8Equipped(ctx.card); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});

/* 28. リーフ・フェアリー — このカードに装備された装備カード1枚を墓地へ送り、
   相手ライフに500ダメージを与える */
function b0EquipsOn(card){
  const uid = card && card.uid;
  if(uid == null) return [];
  const out = [];
  [0,1].forEach(p => (gameState.players[p].sz || []).forEach((c, i) => {
    if(c && c.equipTo && c.equipTo.uid === uid) out.push(v17Handle(p, 'sz', i, c));
  }));
  return out;
}
defineScript('リーフ・フェアリー', {
  type:'monster', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!b0EquipsOn(ctx.card).length){ ctx.reason = 'このカードに装備カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = b0EquipsOn(ctx.card);
    if(!q.length){ done(false); return; }
    API.selectCard('リーフ・フェアリー（コスト）：墓地へ送る装備カード', q, t => {
      const r = resolveTarget(t);
      if(r){ API.sendToGrave(r, 'リーフ・フェアリー（コスト）'); done(true); }
      else done(false);
    });
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){}
});
