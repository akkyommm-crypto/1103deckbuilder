/* S03-U244: スピリットモンスター (2011 texts) — 不死之炎鳥, 偉大天狗, 八俣大蛇, 八汰烏, 火之迦具土, 軍荼利, 雷帝神 (ENGINE_GAP:
   「召喚・リバースしたターンのエンドフェイズ時に持ち主の手札に戻る」 needed a per-card record of the turn it was flipped).
   Engine: card.flippedTurnS03 (engine/19, every face-down → face-up turn), effectFlags.skipDrawTurnS03 / handDiscardBeforeDrawS03
   (engine/30 processDrawV27, DRAW_SKIPPED_S03).
   The return is the card's only forced trigger at the End Phase. Unlike the cycle-13 helper (cards/B5, c2Spirit), no extra trigger is
   made at the summon / flip: the engine records both turns (summonedTurn, flippedTurnS03). 「このカードは特殊召喚できない」 = cannotSpecialSummon. */

function spiritActiveTurnS03(card){ return !!card && (Number(card.summonedTurn)===Number(gameState.turn) || Number(card.flippedTurnS03)===Number(gameState.turn)); }
function spiritReturnDueS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || gameState.phase!=='end') return false;
  if(!spiritActiveTurnS03(ctx.card)) return false;
  return Number(ctx.card.spiritReturnedS03)!==Number(gameState.turn);
}
function spiritReturnEffectS03(name){
  return {key:'spirit-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
    condition(ctx){ return spiritReturnDueS03(ctx); },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
      API.setCardFlag(me, 'spiritReturnedS03', gameState.turn, name, {silent:true});
      const now = locateCardAnyV4(ctx.card); if(now && now.zone==='mz') API.returnToHand(now, name);
    },
    afterResolve(){}};
}
/* 「このカードが相手ライフに戦闘ダメージを与えた時」 (a3DealtBattleDamage, cards/A3: the battle this card was in damaged the opponent) */
function spiritDamageEffectS03(name, op, forced){
  return {key:'battle-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:forced!==false,
    condition(ctx){ return ctx.zone==='mz' && a3DealtBattleDamage(ctx); },
    operation(ctx){ op(ctx, Number((ctx.event||{}).amount)||0); },
    afterResolve(){}};
}
function defineSpiritS03(name, extra, meta){
  defineUnifiedCardV4(name, [spiritReturnEffectS03(name)].concat(extra||[]), Object.assign({type:'monster', priority:1, cannotSpecialSummon:true}, meta||{}));
}
/* the opponent's next turn number (「次の相手ターン」) */
function nextOpponentTurnS03(ctx){ return gameState.activePlayer===ctx.opponent ? gameState.turn+2 : gameState.turn+1; }

/* ---- 不死之炎鳥: 相手ライフに戦闘ダメージを与えた時、与えた戦闘ダメージの数値分だけ自分のライフポイントを回復する。 ---- */
defineSpiritS03('不死之炎鳥', [spiritDamageEffectS03('不死之炎鳥', (ctx, n)=>{ if(n>0) API.recoverLP(ctx.player, n, '不死之炎鳥'); })]);

/* ---- 偉大天狗: 相手ライフに戦闘ダメージを与えた場合、次の相手ターンのバトルフェイズをスキップする。 ---- */
defineSpiritS03('偉大天狗', [spiritDamageEffectS03('偉大天狗', ctx=>API.skipNextBattlePhase(ctx.opponent))]);

/* ---- 八俣大蛇: 相手ライフに戦闘ダメージを与えた時、自分の手札が5枚になるまでデッキからカードをドローする。 ---- */
defineSpiritS03('八俣大蛇', [spiritDamageEffectS03('八俣大蛇', ctx=>{ const n = 5 - API.me(ctx).hand.length; if(n>0) API.draw(ctx.player, n); })]);

/* ---- 八汰烏: 相手ライフに戦闘ダメージを与えた場合、次の相手ターンのドローフェイズをスキップする。 ---- */
defineSpiritS03('八汰烏', [spiritDamageEffectS03('八汰烏', ctx=>{
  API.setFlag(ctx.opponent, 'skipDrawTurnS03', nextOpponentTurnS03(ctx), false);
  API.setFlag(ctx.opponent, 'skipDrawByS03', '八汰烏', false);
})]);

/* ---- 火之迦具土: 相手ライフに戦闘ダメージを与えた時に発動する。次のターンのドローフェイズのドロー前に相手は手札を全て捨てる。 ---- */
defineSpiritS03('火之迦具土', [spiritDamageEffectS03('火之迦具土', ctx=>{
  API.setFlag(ctx.opponent, 'handDiscardBeforeDrawS03', gameState.turn+1, false);
  API.setFlag(ctx.opponent, 'handDiscardByS03', '火之迦具土', false);
})]);

/* ---- 軍荼利: このカードがシンクロモンスターと戦闘を行う場合、ダメージ計算を行わず、そのモンスターとこのカードを持ち主の手札に戻す。
   (forced at the start of the damage step, as the other 「ダメージ計算を行わず」 cards in cards/A3) ---- */
function gundariFoeS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return null;
  const b = (typeof battleContextV28==='function' ? battleContextV28() : null) || {};
  const me = ctx.card.uid;
  const foe = (b.atkCard && b.atkCard.uid===me) ? b.defCard : ((b.defCard && b.defCard.uid===me) ? b.atkCard : null);
  if(!foe) return null;
  const h = findCardByUid(foe.uid);
  return (h && h.zone==='mz' && (dbOf(h.card).st||[]).indexOf('シンクロ')>=0) ? h : null;
}
defineSpiritS03('軍荼利', [{
  key:'synchro-bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!gundariFoeS03(ctx); },
  operation(ctx){
    const foe = gundariFoeS03(ctx), fu = foe && foe.card.uid;
    if(fu!=null){ const h = findCardByUid(fu); if(h && h.zone==='mz') API.returnToHand(h, '軍荼利'); }
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.returnToHand(me, '軍荼利');
    if(typeof endBattle==='function') endBattle();
  },
  afterResolve(){}
}], {dsTiming:'start'});

/* ---- 雷帝神: このカードが相手ライフに与える戦闘ダメージは半分になる。 ---- */
defineSpiritS03('雷帝神', [], {continuous:{scope:'self', from:['mz'], apply(){ return null; },
  battleDamage(info){
    const self = info && info.self; if(!self || self.face!=='up') return info.amount;
    const loc = locateCardAnyV4(self); if(!loc || loc.zone!=='mz') return info.amount;
    const mine = (info.atkCard===self) || (info.defCard===self);
    return (mine && info.to!==loc.p) ? Math.floor(info.amount/2) : info.amount;
  }}});
