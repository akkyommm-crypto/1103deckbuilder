/* =========================================================================
   S03-U392 — Spell / Trap Set ban for a turn range (大寒波)
   effectFlags.setBanS03 = [{from, to, label}] on a player (written with API.setFlag(p, 'setBanS03', list, false));
   SET_ST refuses while gs.turn is inside a range of the player. Pure function of the state (Replay-safe).
   ========================================================================= */
function setBannedS03(gs, P){
  const l = P && P.effectFlags && P.effectFlags.setBanS03;
  return Array.isArray(l) && l.some(b=>b && Number(b.from) <= Number(gs.turn) && Number(gs.turn) <= Number(b.to));
}
