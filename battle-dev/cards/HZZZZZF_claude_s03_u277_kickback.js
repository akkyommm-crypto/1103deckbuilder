/* S03-U277: キックバック (2011 text) — Counter Trap: モンスターの召喚・反転召喚を無効にし、そのモンスターを持ち主の手札に戻す。
   Engine (this unit): summonNegatePendingV2(reason, {toHand:true}) → SUMMON_WINDOW_NEGATE_V42 toHandS03 → the cancelled monster goes to its
   owner's hand instead of the GY (engine/00 + 30 + 40 runSummonWindowResumeS03). Normal Summon (including a Tribute Summon) and Flip Summon of
   either player; not a Special Summon. Parked by the Sonnet unit S03-U272 with this reproduction. */
defineScript('キックバック', {
  onOtherSummon:true,
  summonNegate:{kinds:['normal','flip']},
  type:'counter', priority:3,
  condition(ctx){
    const ps = gameState.pendingSummon;
    if(!ps || (ps.kind!=='normal' && ps.kind!=='flip') || ps.negated){ ctx.reason = 'モンスターの召喚・反転召喚に対して発動します'; return false; }
    return true;
  },
  resolve(){
    if(gameState.pendingSummon) summonNegatePendingV2('キックバック', {toHand:true});
    API.log('キックバック：召喚を無効にし、そのモンスターを持ち主の手札に戻す');
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onFlip(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && !!(ctx.event && ctx.event.flipSummon); }
  }
});
