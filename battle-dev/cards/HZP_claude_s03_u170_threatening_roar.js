/* S03-U170: 威嚇する咆哮 (2011): 「このターン相手は攻撃宣言をする事ができない。」 (Normal Trap)
   Resolution: a turn-stamped player flag on the opponent (temporaryFlags.noAttackDeclareS03 = this turn; the per-turn flags are
   reset at the turn change), read by cannotAttackNow (engine/00, S03-U170) — no monster of that player can declare an attack
   this turn. Typically activated at the Start Step of the opponent's Battle Phase (S03-U170 POINT kind 'battleStart'). */
defineScript('威嚇する咆哮', {
  type:'trap', priority:2, quickEffect:true,
  condition(ctx){ return true; },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    API.setFlag(ctx.opponent, 'noAttackDeclareS03', gameState.turn, true);
    API.log('威嚇する咆哮：このターン、相手は攻撃宣言できない');
  },
  afterResolve(){}
});
