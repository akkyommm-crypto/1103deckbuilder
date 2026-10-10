/* System v31 (Astra 01): extend v15/v46 equipment; no parallel state model.
   All mutations below run inside applyAction, including lifecycle cleanup.
   Card-specific triggers, selections and eligibility stay in cards/. */
function graveEquipLegalV31(gs, player, eq, host){
  if(!gs.players[player] || !eq || !host || eq.zone!=='grave' || host.zone!=='mz') return false;
  if(!eq.card || !host.card || eq.card===host.card || eq.card.token || host.card.face!=='up') return false;
  const d=dbOf(eq.card);
  if(d.k!=='m' && !(d.k==='s' && d.sub==='装備')) return false;
  return gs.players[player].sz.length<ZONE_LIMITS.sz && equipLegalV15(eq.card,host);
}
function applyGraveEquipV31(gs,a){
  const eq=findCardByUidInState(gs,a.equipUid),host=findCardByUidInState(gs,a.targetUid);
  if(!eq || eq.p!==a.fromPlayer || !graveEquipLegalV31(gs,a.player,eq,host)) return false;
  const card=eq.card,owner=cardOwnerIndex(gs,card,eq.p),monster=dbOf(card).k==='m';
  gs.players[eq.p].grave.splice(eq.index,1);
  reset(card); delete card.graveInfo; delete card.discardInfo;
  card.owner=owner;card.controller=a.player;card.face='up';card.pos='atk';
  card.equipUid=card.uid;card.equipTo={p:host.p,uid:host.card.uid};
  if(a.sourceUid!=null)card.equipTo.sourceUid=a.sourceUid;
  if(monster)card.v46MonsterEquip=true;
  host.card.equippedBy=host.card.equippedBy||[];
  if(!host.card.equippedBy.includes(card.equipUid))host.card.equippedBy.push(card.equipUid);
  gs.players[a.player].sz.push(card);
  logIt(gs,`${a.reason||'効果'}：${cardName(card)} を ${cardName(host.card)} に装備`);
  if(typeof queueDeferredEventV2==='function' && PLAY_MODE===PLAY_MODES.DUEL)
    queueDeferredEventV2('onEquipAttached',{equipUid:card.equipUid,uid:host.card.uid,
      player:a.player,targetPlayer:host.p,owner,controller:a.player,fromPlayer:eq.p,
      from:'grave',sourceUid:a.sourceUid==null?null:a.sourceUid,byPlayer:a.player,
      reason:a.reason||'effect',turn:gs.turn,chainId:a.chainId==null?null:a.chainId});
  return true;
}
function clearEquipIdentityV31(card){
  if(!card)return;
  delete card.equipTo;delete card.equipUid;delete card.v46MonsterEquip;
}
/* An equipped card with a missing/face-down host is destroyed by game rule,
   not by the opponent's effect. Existing dropEquips routes the same case. */
function sendOrphanEquipV31(gs,player,index,markS03){
  const eq=gs.players[player].sz[index];if(!eq)return;
  const link=eq.equipTo,uid=eq.equipUid,owner=cardOwnerIndex(gs,eq,player);
  gs.players[player].sz.splice(index,1);
  pushZone(gs.players[owner].grave,eq);
  eq.graveInfo={turn:gs.turn,from:'sz',byDestroy:true,byPlayer:null,face:'up',pos:null,rule:'equip'};
  if(markS03 && markS03.hostToDeckS03) eq.graveInfo.hostToDeckS03=true;   /* S03-U183: the equipped monster returned to the Deck from its controller's field */
  if(typeof v15EmitEquipEvent==='function')v15EmitEquipEvent(gs,'onEquipDetached',
    {equipUid:uid,uid:link&&link.uid,player,targetPlayer:link&&link.p});
  if(typeof queueDeferredEventV2==='function' && PLAY_MODE===PLAY_MODES.DUEL)
    queueDeferredEventV2('onSendToGrave',{uid:eq.uid,player:owner,fromPlayer:player,
      from:'sz',reason:'equip-rule',byPlayer:null});
}
function reconcileEquipLinksV31(gs){
  const hosts=new Map(),attached=new Map();
  (gs.players||[]).forEach((P,p)=>(P.mz||[]).forEach(c=>{if(c)hosts.set(c.uid,{p,card:c});}));
  (gs.players||[]).forEach((P,p)=>{
    for(let i=P.sz.length-1;i>=0;i--){
      const eq=P.sz[i];if(!eq || !eq.equipTo)continue;
      const host=hosts.get(eq.equipTo.uid);
      if(!host || host.card.face!=='up'){sendOrphanEquipV31(gs,p,i);continue;}
      eq.equipTo.p=host.p;
      if(!attached.has(host.card.uid))attached.set(host.card.uid,[]);
      attached.get(host.card.uid).push(eq.equipUid);
    }
    // Equipment summoned/returned/banished must not retain its old relation.
    for(const zone of ['mz','grave','banish','hand','deck','ex'])
      for(const c of P[zone]||[])if(c && (c.equipTo || c.equipUid || c.v46MonsterEquip))clearEquipIdentityV31(c);
  });
  for(const [uid,host] of hosts){
    const ids=attached.get(uid)||[],old=host.card.equippedBy;
    if(old || ids.length)host.card.equippedBy=(old||[]).filter(x=>ids.includes(x));
    for(const id of ids)if(!host.card.equippedBy.includes(id))host.card.equippedBy.push(id);
  }
}
