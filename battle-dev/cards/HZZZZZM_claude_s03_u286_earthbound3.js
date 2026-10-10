/* S03-U286: 地縛神 Chacu Challhua, 地縛神 Cusillu (2011 texts) — parked by the Sonnet unit S03-U284 as engine work.
   Engine (this unit): continuous.noOpponentBattlePhaseS03(card) read by battlePhaseForbiddenV340 (engine/30); destruction substitute kind
   'releaseOwn' with an after-step (engine/1ZV). Common 地縛神 clauses: earthboundCommonS03 (engine/1ZZM, S03-U282). */

/* ---- 地縛神 Chacu Challhua: …また、1ターンに1度、このカードの守備力の半分のダメージを相手ライフに与える事ができる。この効果を発動するターン、
   このカードは攻撃できない。このカードがフィールド上に表側守備表示で存在する限り、相手はバトルフェイズを行えない。 ---- */
defineScript('地縛神 Chacu Challhua', earthboundCommonS03({
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if((typeof attackCountV48==='function' ? attackCountV48(ctx.card) : 0) > 0){ ctx.reason = 'このターン既に攻撃しています'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, '地縛神 Chacu Challhua', {silent:true}); done(true); },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz' || me.card.face!=='up') return; const n = Math.floor(curDEF(me.card)/2); if(n>0) API.damageLP(ctx.opponent, n); },
  afterResolve(){},
  continuous:{ noOpponentBattlePhaseS03:(card)=> !!card && card.face==='up' && card.pos==='def' }
}));

/* ---- 地縛神 Cusillu: …また、フィールド上に表側表示で存在するこのカードが戦闘によって破壊される場合、代わりにこのカード以外の自分フィールド上の
   モンスター1体をリリースして相手のライフポイントを半分にできる。 ----
   Optional (the controller is asked at the destruction, engine/1ZV). Halving is not damage: the opponent's LP becomes half (a fraction rounded up). */
defineScript('地縛神 Cusillu', earthboundCommonS03({
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '起動する効果はありません'; return false; },
  resolve(){}, afterResolve(){},
  destroySubstituteS03:{ kind:'releaseOwn', causes:['battle'], after(player){
    const opp = player===0 ? 1 : 0, lp = Number(gameState.players[opp].lp)||0, rest = Math.ceil(lp/2);
    if(lp > rest) act({type:'LP', player:opp, delta:-(lp-rest)});
    API.log(`地縛神 Cusillu：相手のライフポイントを半分にした（${lp} → ${rest}）`);
  } }
}));
