/* S03-U273: hand size limit modifiers (2011 texts) — 衰弱の霧, ヒエログリフの石版, 無限の手札.
   Engine (this unit, engine/1ZZJ): handLimitS03(gs, p) — 6, a duel-long player flag handLimitS03, continuous.handLimitS03(player, card, controller)
   (a number = that player's limit; Infinity = no limit). The turn player discards down to the limit at the end of the turn (rule discard). */

/* ---- 衰弱の霧 (Continuous Spell): 相手の手札制限枚数は5枚までになる。 ---- */
defineScript('衰弱の霧', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  continuous:{ handLimitS03(player, card, controller){ return player !== controller ? 5 : null; } }
});

/* ---- ヒエログリフの石版 (Spell): 1000ライフポイントを払う。そのデュエル中、自分の手札制限枚数が7枚になる。 ---- */
defineScript('ヒエログリフの石版', {
  type:'spell', priority:1,
  condition(ctx){ if(API.me(ctx).lp < 1000){ ctx.reason = '1000ライフポイントを払えません'; return false; } return true; },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  resolve(ctx){
    API.setFlag(ctx.player, 'handLimitS03', 7, false);
    API.log('ヒエログリフの石版：このデュエル中、手札制限枚数が7枚になる');
  },
  afterResolve(){}
});

/* ---- 無限の手札 (Continuous Spell): このカードがフィールド上に存在する限り、お互いのプレイヤーは手札枚数制限が無くなる。 ---- */
defineScript('無限の手札', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  continuous:{ handLimitS03(){ return Infinity; } }
});
