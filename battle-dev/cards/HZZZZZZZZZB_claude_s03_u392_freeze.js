/* S03-U392: 悪夢の鉄檻, 大寒波, 閃光弾 (NOT_STARTED cards, carddata texts).

   悪夢の鉄檻  （通常魔法）全てのモンスターは(相手ターンで数えて)2ターンの間攻撃できない。2ターン後このカードを破壊する。
   大寒波      （通常魔法）メインフェイズ1の開始時に発動する事ができる。次の自分のドローフェイズ時まで、お互いに魔法・罠カードの効果の使用及び発動・セットはできない。
   閃光弾      （通常罠）相手モンスターの直接攻撃によって自分が戦闘ダメージを受けた時に発動できる。このターンのエンドフェイズになる。

   Notes
   - 悪夢の鉄檻 copies 光の護封剣 (S03-U07 / U154): remainsOnFieldAfterResolve, a continuous cannotAttack on every monster while it stands in the Spell & Trap Zone, and a scheduled destroy at the opponent's End Phase (the 2nd opponent turn counted from the activation).
   - 大寒波: 「メインフェイズ1の開始時」 is read like 大熱波 (u384MainStart); the card lingers (API.lingerS03 until the next turn) with activationLockS03 + locksStEffectsS03 for Spell / Trap cards of both players, and the Set ban is effectFlags.setBanS03 (engine/1ZZT) read by SET_ST.
   - 閃光弾: an optional trap trigger on the opponent's direct battle damage to me; the resolution requests the End Phase. */

/* ---- 悪夢の鉄檻 ---- */
API.registerScheduleHandler('u392.cage-destroy', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && (h.zone==='sz' || h.zone==='field') && Number(h.card.u392CageTurn)===Number(args.turn)) API.destroy(h, '悪夢の鉄檻');
});
defineScript('悪夢の鉄檻', {
  remainsOnFieldAfterResolve:true,
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; }, cannotAttack(){ return true; } },
  type:'spell', priority:1, quickEffect:false,
  condition(){ return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && (me.zone==='sz' || me.zone==='field')){
      ensureCardUid(gameState, ctx.card);
      API.setCardFlag(me, 'u392CageTurn', gameState.turn, '悪夢の鉄檻', {silent:true});
      API.schedule({at:'endPhase', turns:(gameState.activePlayer===ctx.player?3:2), player:ctx.opponent, handler:'u392.cage-destroy',
        args:{uid:ctx.card.uid, turn:gameState.turn}, note:'悪夢の鉄檻（相手ターンで数えて2ターン後に破壊）'});
    }
    API.log('悪夢の鉄檻：全てのモンスターは攻撃宣言できない（相手ターンで数えて2ターン後のエンドフェイズに破壊）');
  },
  afterResolve(){}
});

/* ---- 大寒波 ---- */
defineScript('大寒波', {
  type:'spell', priority:1, targets:false,
  condition(ctx){ if(!u384MainStart(ctx)){ ctx.reason = 'メインフェイズ1の開始時にのみ発動できます'; return false; } return true; },
  resolve(ctx){
    const T = gameState.turn;
    /* until my next Draw Phase: my own turn T and the opponent's turn T+1 */
    [0,1].forEach(q=>{
      const cur = API.getFlag(q, 'setBanS03');
      const keep = (Array.isArray(cur) ? cur : []).filter(b=>b && Number(b.to) >= Number(gameState.turn));
      keep.push({from:T, to:T+1, label:'大寒波'});
      API.setFlag(q, 'setBanS03', keep, false);
    });
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u392ColdTurn', T, '大寒波', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, '大寒波', T+1);
  },
  afterResolve(){},
  locksStEffectsS03:true,
  activationLockS03:(i)=> (i.db.k==='s' || i.db.k==='t') && Number(i.src.u392ColdTurn) >= Number(gameState.turn)-1 && Number(i.src.u392ColdTurn) <= Number(gameState.turn)
});

/* ---- 閃光弾 ---- */
function u392Flash(ctx){
  const e = ctx.event || {};
  return ctx.zone==='sz' && ctx.card.face==='down' && e.direct===true && e.player===ctx.player && e.dealtBy===ctx.opponent && Number(e.amount)>0;
}
defineScript('閃光弾', {
  type:'trap', priority:2,
  condition(ctx){ if(!u392Flash(ctx)){ ctx.reason = '相手モンスターの直接攻撃で戦闘ダメージを受けた時にのみ発動できます'; return false; } return true; },
  resolve(){ API.log('閃光弾：このターンのエンドフェイズになる'); requestProcessorV27(PROCESSOR_V27.PHASE, {to:'end'}); },
  afterResolve(){},
  passive:{ onDirectBattleDamage(ctx){ return u392Flash(ctx); } }
});
