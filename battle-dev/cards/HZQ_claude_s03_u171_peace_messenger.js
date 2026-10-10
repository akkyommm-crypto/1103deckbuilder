/* S03-U171: 和睦の使者 (2011): 「このターン、自分のモンスターは戦闘では破壊されず、自分が受ける戦闘ダメージは0になる。」 (Normal Trap)
   - 「自分のモンスターは戦闘では破壊されず」: a turn-stamped flag on its controller (temporaryFlags.noBattleDestroyS03 = this turn),
     read by battleProof (engine/00) — every monster that player controls this turn, including monsters that arrive later.
   - 「自分が受ける戦闘ダメージは0」: a System v18 LP rule (cause 'battle', mode 'prevent', this turn) for its controller. */
defineScript('和睦の使者', {
  type:'trap', priority:2, quickEffect:true,
  condition(ctx){ return true; },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    API.setFlag(ctx.player, 'noBattleDestroyS03', gameState.turn, true);
    addLpRuleV18({player:ctx.player, cause:'battle', mode:'prevent', turns:0, label:'和睦の使者'});
    API.log('和睦の使者：このターン、自分のモンスターは戦闘では破壊されず、戦闘ダメージは0になる');
  },
  afterResolve(){}
});
