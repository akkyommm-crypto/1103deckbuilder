/* U550 紫炎の霞城 / 断層地帯: existing continuous ATK and battleDamage hooks.
 Shien WIKI-09DF2241AE05 (undated): either player benefits. All question text read.
 Fault Zone: archive query returned 0 entries; additional era-specific rulings unconfirmed.
 No new battle state: existing pendingAttack / battle identities are authoritative. */
function u550AttackPairS03(){
  const b=gameState.battle,a=gameState.pendingAttack;
  const au=b?b.atkUid:(a&&a.attackerUid),du=b?b.targetUid:(a&&a.targetUid);
  if(au==null || du==null)return null;
  const attacker=findCardByUid(au),defender=findCardByUid(du);
  return attacker && defender && attacker.zone==='mz' && defender.zone==='mz' ? {attacker,defender} : null;
}
defineScript('紫炎の霞城',{
  type:'spell',priority:1,condition(){return true;},resolve(){},afterResolve(){},
  continuous:{scope:'allMonsters',from:['field'],
    apply(card){const pair=u550AttackPairS03();return pair && pair.attacker.card===card
      && pair.defender.card.face==='up' && isCardInGroupV4(pair.defender.card,GROUP.SIX_SAMURAI_NAMED) ? {atk:-500} : null;}}
});
defineScript('断層地帯',{
  type:'spell',priority:1,condition(){return true;},resolve(){},afterResolve(){},
  continuous:{scope:'allMonsters',from:['field'],apply(){return null;},
    battleDamage(info){return !info.direct && info.defCard && info.defCard.pos==='def'
      && currentRaceV17(info.defCard)==='岩石' && info.to===info.atkOwner ? info.amount*2 : info.amount;}}
});
