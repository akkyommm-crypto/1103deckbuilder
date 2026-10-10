/* =========================================================================
   S03-U190 — 「「ライトロード」と名のついた…の効果によって自分のデッキからカードが墓地へ送られた」
   -------------------------------------------------------------------------
   ライトロード・ウォリアー ガロス (a trigger each time another own-field ライトロード monster's effect sends cards from the Deck) and
   ライトロード・プリースト ジェニス (at the End Phase of a turn in which that happened) need to know *which effect* milled the Deck.
   - lswStampMillS03(a) (called from act()): a FX_MILL_TOP / FX_MILL applied while a chain link of a 「ライトロード」 card resolves gets
     a.lswSrcS03 = {name, uid} (the resolving link, RESOLVING_LINK_S03). Costs are not effects (SCRIPT_PHASE 'cost', or outside the
     resolution context — ライトロード・エンジェル ケルビム's cost mill is not stamped). Stamped on the Action, so Replay reads it back.
   - The End Phase mills (resolveEndPhaseMills, not a chain) stamp their source explicitly.
   - lswMillAppliedS03(gs, a, sent) (called from the FX_MILL_TOP / FX_MILL reducers): marks the Deck owner's players[p].lswMillTurnS03
     = turn and queues the event 'onLightswornMillS03' {player, src, srcUid, uids} (one per mill Action).
   Only 「ライトロード」-named sources are stamped, so every other Action keeps its shape.
   ========================================================================= */
const LSW_MILL_TYPES_S03 = Object.freeze(['FX_MILL_TOP','FX_MILL']);
function lswNamedS03(name){ return typeof name === 'string' && name.indexOf('ライトロード') >= 0; }
function lswStampMillS03(a){
  if(!a || a.lswSrcS03 !== undefined || LSW_MILL_TYPES_S03.indexOf(a.type) < 0) return a;
  if(typeof P3_EFFECT_CONTEXT === 'undefined' || !P3_EFFECT_CONTEXT) return a;
  if(typeof SCRIPT_PHASE !== 'undefined' && SCRIPT_PHASE === 'cost') return a;
  const r = (typeof RESOLVING_LINK_S03 !== 'undefined') ? RESOLVING_LINK_S03 : null;
  if(!r || !lswNamedS03(r.name)) return a;
  a.lswSrcS03 = {name:r.name, uid:(r.uid != null ? r.uid : null)};
  return a;
}
function lswMillAppliedS03(gs, a, sent){
  const s = a && a.lswSrcS03;
  if(!s || !lswNamedS03(s.name) || !Array.isArray(sent) || !sent.length) return;
  const P = gs.players[a.player]; if(!P) return;
  P.lswMillTurnS03 = gs.turn;
  if(typeof queueDeferredEventV2 === 'function' && typeof PLAY_MODE !== 'undefined' && PLAY_MODE === PLAY_MODES.DUEL)
    queueDeferredEventV2('onLightswornMillS03', {player:a.player, src:s.name, srcUid:(s.uid != null ? s.uid : null),
      uids:sent.map(c=>c && c.uid).filter(u=>u != null)});
}
/* did a 「ライトロード」 card's effect send cards from player p's Deck to the GY this turn? */
function lswMilledThisTurnS03(p){
  const P = gameState.players[p];
  return !!(P && P.lswMillTurnS03 != null && Number(P.lswMillTurnS03) === Number(gameState.turn));
}
