/* S03-U415: デッキロック, 不協和音, 王宮の鉄壁, 縮退回路 (NOT_STARTED cards, carddata texts).

   デッキロック  （永続魔法）このカードがフィールド上に存在する限り、お互いにドロー以外の方法でデッキからカードを手札に加える事はできず、デッキからの特殊召喚もできない。発動後2回目の自分のスタンバイフェイズ時にこのカードを破壊する。
   不協和音      （永続罠）このカードがフィールド上に存在する限り、お互いのプレイヤーはシンクロ召喚できない。発動後3回目の自分のエンドフェイズ時にこのカードを墓地へ送る。
   王宮の鉄壁    （永続罠）①：このカードが魔法&罠ゾーンに存在する限り、お互いにカードを除外できない。
   縮退回路      （永続魔法）このカードがフィールド上に存在する限り、フィールド上から手札に戻るモンスターカードは手札に戻らずゲームから除外される。このカードのコントローラーは自分のスタンバイフェイズ毎に500ライフポイントを払う。この時に500ライフポイント払えない場合はこのカードを破壊する。

   Notes
   - New engine flags (engine/1ZZU deckLockSourceS03, S03-U415): banishBanS03 (FX_BANISH / FX_DESTROY_BANISH are refused), deckSummonBanS03 (API.specialSummon from the Deck is refused), fieldBounceBanishS03 (FX_BOUNCE of a non-Extra-Deck monster from the field banishes it instead).
   - デッキロック's hand lock is the existing continuous.lockDeckToHand (ライオウ); 不協和音 is a summonLockS03 on Special Summons of Synchro Monsters.
   - Countdown: デッキロック counts my face-up Standby Phases in the flag u415N (a Continuous Spell placed from the hand has no chain link, so no ACTIVATE operation runs) and is destroyed at the 2nd; 不協和音 (a Trap, the chain link resolves) stamps u415End = activation turn + 4 (activated in my turn) or + 5 (in the opponent's turn), the turn of my 3rd End Phase (the End Phase of the activation turn counts), checked by a forced End Phase trigger.
   - 縮退回路: the upkeep is a forced Standby Phase trigger: 500 Life Points are paid (API.payCost) while the controller keeps more than 500, otherwise the card is destroyed (same convention as スピリットの誘い). */

function u415Up(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
function u415Activate(type, stampTurns){
  return { key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:type==='trap'?2:1, events:['activate'],
    condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); },
    operation(ctx){
      if(!stampTurns) return;
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
      API.setCardFlag(me, 'u415End', Number(gameState.turn) + stampTurns(ctx), cardName(ctx.card), {silent:true});
    },
    afterResolve(){} };
}
function u415Due(ctx, phase){
  return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase===phase && ctx.card.u415End!=null && Number(gameState.turn)>=Number(ctx.card.u415End);
}

/* ---- デッキロック ---- */
/* A Continuous Spell placed from the hand has no chain link (its ACTIVATE operation never runs), so the countdown counts my face-up Standby Phases (u415N);
   the Standby Phase of the turn it is placed has already passed, so the 2nd one is two of my turns later. */
defineUnifiedCardV4('デッキロック', [u415Activate('spell', null), {
  key:'expire', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    const n = (Number(me.card.u415N) || 0) + 1;
    if(n >= 2) API.destroy(me, 'デッキロック'); else API.setCardFlag(me, 'u415N', n, 'デッキロック', {silent:true});
  },
  afterResolve(){}
}], {type:'spell', priority:1,
  passive:{ onStandbyPhase(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; } },
  continuous:{ scope:'self', from:['sz'], apply(){ return null; }, lockDeckToHand(){ return true; } } });
CARD_SCRIPTS['デッキロック'].deckSummonBanS03 = true;

/* ---- 不協和音 ---- */
defineUnifiedCardV4('不協和音', [u415Activate('trap', ctx=>(ctx.player===gameState.activePlayer ? 4 : 5)), {
  key:'expire', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u415Due(ctx, 'end'); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.sendToGrave(me, '不協和音'); },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true,
  passive:{ onEndPhase(ctx){ return u415Due(ctx, 'end'); } },
  summonLockS03:(i)=> i.kind==='special' && ((i.db && i.db.st) || []).indexOf('シンクロ')>=0 });

/* ---- 王宮の鉄壁 ---- */
defineUnifiedCardV4('王宮の鉄壁', [u415Activate('trap', null)], {type:'trap', priority:2});
CARD_SCRIPTS['王宮の鉄壁'].banishBanS03 = true;

/* ---- 縮退回路 ---- */
defineUnifiedCardV4('縮退回路', [u415Activate('spell', null), {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    if(API.me(ctx).lp > 500){ API.payCost(ctx.player, 500); return; }
    API.destroy(me, '縮退回路');
  },
  afterResolve(){}
}], {type:'spell', priority:1,
  passive:{ onStandbyPhase(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; } } });
CARD_SCRIPTS['縮退回路'].fieldBounceBanishS03 = true;
