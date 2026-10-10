/* S03-U162: マイン・モール (2011):
   「このカードは1ターンに1度だけ、戦闘では破壊されない。このカードが獣族モンスターのシンクロ召喚の素材として墓地へ送られた場合、
   自分のデッキからカードを1枚ドローする。このカードは相手のカードの効果によってフィールド上から離れた場合、ゲームから除外される。」
   - once-per-turn battle protection: System v21 protectV21 (perTurn 1).
   - Synchro material for a Beast (獣族) Synchro Monster: forced trigger from the GY on the material event (engine/00 queues onSendToGrave
     {reason:'synchroMaterial', summonUid}); the Synchro Monster's current Type is checked when the trigger is collected.
   - leaves the field by the opponent's card effect → banished instead (engine/00 banishWhenLeavesByOpponentEffectS03, from the move
     action's P3 stamp: destruction, sending to the GY, returning to the hand or the Deck by an effect whose controller is the
     opponent). Battle, costs and materials are not 「効果によって」. */
function mineMoleSynchroS03(ctx){
  if(!ctx || !ctx.card || ctx.zone!=='grave' || !eventIsSelfS03(ctx)) return false;
  const e = ctx.event || {};
  if(e.reason!=='synchroMaterial' || e.summonUid==null) return false;
  const h = findCardByUid(e.summonUid);
  return !!(h && h.card && currentRaceV17(h.card)==='獣');
}
defineScript('マイン・モール', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  banishIfLeavesByOpponentEffectS03:true,
  condition(ctx){
    if(!mineMoleSynchroS03(ctx)){ ctx.reason = '獣族モンスターのシンクロ召喚の素材として墓地へ送られた時に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return mineMoleSynchroS03(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'マイン・モール', label:'マイン・モール', perTurn:1, battle:(target, self)=> target===self }
  }
});
