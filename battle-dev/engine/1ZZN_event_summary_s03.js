/* =========================================================================
   S03-U290 — grouped (simultaneous) Deck-to-GY and discard events with counts
   -------------------------------------------------------------------------
   「…が墓地へ送られる度に」「捨てたカードの数×500」「同じ枚数分」 need one event per group of cards that moved together, with the count and
   who moved them. The engine queues one event per card (onSendToGrave from:'deck' / onDiscardAnyS03).
   - When the processor starts draining the queued events (processDrainEventsV27), a journaled automatic action EVENT_SUMMARY_S03 adds, for the
     events queued so far that are not summarized yet, one summary per player:
       onMillBatchS03     {player (whose Deck), count, uids, actingPlayers[], reasons[]}     — Deck → GY
       onDiscardBatchS03  {player (whose hand), count, uids, actingPlayers[], reasons[], byEffect}  — hand → GY by discarding
     actingPlayers / reasons come from the provenance stamped on each queued event at the move (evt.provS03 = the action's P3 stamp:
     'cost' / 'effect' and the player whose card moved it; a discard by the hand-size rule (byEffect false) is 'rule'). The card's own
     moveProvenance is not read: a move without a P3 stamp leaves an older one on the card.
   - The original per-card events are kept (existing triggers are unchanged); summarized items are marked (evt.summarizedS03).
   - The events queued together up to a drain are the cards that moved together (one resolution, one cost payment, the hand-size rule).
   - S03-U293: onFieldToGraveBatchS03 {count, count0, count1 (per owner), uids, items[{uid, owner, ctrl, byDestroy, battle, face, attr, reason}]} — monsters
     sent from a Monster Zone to the GY together; also added to the battle cleanup batch (engine/30). Summaries are inserted after their group.
   ========================================================================= */
/* the P3 stamp of a move action, copied onto its queued event (engine/00 FX_MILL / FX_MILL_TOP / FX_TO_GRAVE from the Deck / FX_DISCARD) */
function eventProvS03(a){
  if(!a || !a.p3 || typeof a.p3!=='object') return {};
  const out = {reason: (['cost','effect','rule'].indexOf(a.p3.reason)>=0 ? a.p3.reason : 'effect')};
  if(a.p3.actingPlayer===0 || a.p3.actingPlayer===1) out.actingPlayer = a.p3.actingPlayer;
  if(a.p3.grpS03!=null) out.grp = String(a.p3.grpS03);   /* S03-U295: move group */
  return {provS03:out};
}
/* consumers: did a card effect (not a cost, not a rule) move cards in this summary? */
function eventSummaryByEffectS03(evt){ return !!evt && Array.isArray(evt.reasons) && evt.reasons.indexOf('effect') >= 0; }
/* S03-U293: a monster sent from a Monster Zone to the GY (graveInfo.from 'mz', written by the move: effect, mass destruction, battle, Synchro
   material, Tribute) — one summary for the whole group (both owners): 死の演算盤 「そのモンスターの持ち主は1枚につき」, バックファイア. */
function fieldToGraveItemS03(gs, uid, ctrlFallback){
  const h = (uid != null && typeof findCardByUidInState === 'function') ? findCardByUidInState(gs, uid) : null;
  const gi = h && h.zone==='grave' && h.card && h.card.graveInfo;
  if(!gi || gi.from!=='mz' || Number(gi.turn)!==Number(gs.turn)) return null;
  const ctrl = (gi.ctrlS03===0 || gi.ctrlS03===1) ? gi.ctrlS03 : ctrlFallback;
  return {uid:Number(uid), owner:h.p, ctrl:(ctrl===0 || ctrl===1) ? ctrl : h.p, byDestroy:!!gi.byDestroy, battle:!!gi.battle, face:gi.face||null,
          attr:gi.attrS03||null, reason:gi.reason||null};
}
function fieldToGraveSummaryEvtS03(items){
  const c = [0, 0]; items.forEach(x=>{ c[x.owner]++; });
  return {summaryS03:true, count:items.length, count0:c[0], count1:c[1], uids:items.map(x=>x.uid), items:items.map(x=>Object.assign({}, x))};
}
function eventSummaryKindS03(item, gs){
  if(!item || !item.evt || item.evt.summarizedS03) return null;
  if(item.eventName === 'onDiscardAnyS03') return 'onDiscardBatchS03';
  if(item.eventName === 'onSendToGrave' && item.evt.from === 'deck') return 'onMillBatchS03';
  if(item.eventName === 'onSendToGrave' && item.evt.from !== 'hand' && fieldToGraveItemS03(gs || gameState, item.evt.uid, item.evt.player)) return 'onFieldToGraveBatchS03';
  return null;
}
function eventSummaryPendingS03(gs){
  gs = gs || gameState;
  return (gs.deferredEvents || []).some(it=>!!eventSummaryKindS03(it, gs));
}
/* reducer of EVENT_SUMMARY_S03 (engine/00).
   S03-U293: each summary is inserted right after the last queued event of its group (not at the end of the queue), so a summary of cards that
   left the field together is part of the same leave-field batch (engine/30 leaveBatchRunS03): one SEGOC with the per-card triggers. */
function eventSummaryReduceS03(gs){
  const q = gs.deferredEvents || [];
  const groups = {};
  q.forEach((it, idx)=>{
    const kind = eventSummaryKindS03(it, gs);
    if(!kind) return;
    /* S03-U295: one summary per move group (a chain link's resolution, an activation's cost); before, everything drained together was one group */
    const grp = (it.evt.provS03 && it.evt.provS03.grp!=null) ? String(it.evt.provS03.grp) : '';
    if(kind === 'onFieldToGraveBatchS03'){
      const x = fieldToGraveItemS03(gs, it.evt.uid, it.evt.player);
      it.evt.summarizedS03 = true;
      const g = groups[kind + '|' + grp] || (groups[kind + '|' + grp] = {kind, items:[], last:idx});
      if(x && !g.items.some(y=>y.uid===x.uid)) g.items.push(x);
      g.last = idx;
      return;
    }
    it.evt.summarizedS03 = true;
    const p = (it.evt.player===0 || it.evt.player===1) ? it.evt.player : null;
    if(p == null) return;
    const key = kind + ':' + p + '|' + grp;
    const g = groups[key] || (groups[key] = {kind, player:p, uids:[], actingPlayers:[], reasons:[], byEffect:false, last:idx});
    g.last = idx;
    if(it.evt.uid != null) g.uids.push(it.evt.uid);
    const mp = it.evt.provS03 || null;
    const why = (kind==='onDiscardBatchS03' && it.evt.byEffect === false) ? 'rule' : ((mp && mp.reason) || 'effect');
    if(mp && (mp.actingPlayer===0 || mp.actingPlayer===1) && g.actingPlayers.indexOf(mp.actingPlayer) < 0) g.actingPlayers.push(mp.actingPlayer);
    if(g.reasons.indexOf(why) < 0) g.reasons.push(why);
    if(it.evt.byEffect === true) g.byEffect = true;
  });
  const adds = Object.keys(groups).sort().map(k=>{
    const g = groups[k];
    const evt = (g.kind === 'onFieldToGraveBatchS03') ? fieldToGraveSummaryEvtS03(g.items)
      : {summaryS03:true, player:g.player, count:g.uids.length, uids:g.uids.slice(), actingPlayers:g.actingPlayers.slice(), reasons:g.reasons.slice(), byEffect:g.byEffect};
    return {at:g.last, item:{eventName:g.kind, evt}};
  }).filter(a=>a.item.evt.count>0);
  /* insert from the back so earlier positions stay valid; equal positions keep the sorted order */
  adds.map((a, i)=>Object.assign(a, {i})).sort((a, b)=>(b.at - a.at) || (b.i - a.i)).forEach(a=>q.splice(a.at + 1, 0, a.item));
  gs.deferredEvents = q;
}
const EVENT_SUMMARY_KINDS_S03 = Object.freeze(['onMillBatchS03', 'onDiscardBatchS03', 'onFieldToGraveBatchS03']);
/* S03-U295: 「このカードの発動中」 — the card itself is on the chain as a card activation (its own trigger effects on the chain also set
   card.activationPending, so the flag alone would stop a face-up card from triggering a second time in the same chain) */
function cardBeingActivatedS03(card){
  if(!card || card.uid == null || typeof gameState === 'undefined' || !gameState) return false;
  return (gameState.chain || []).some(l=>l && l.uid === card.uid && l.cardActivationS03 === true);
}
