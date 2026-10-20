/* =========================================================================
   S03-U279 — special win conditions (「…が揃った時、自分はデュエルに勝利する」)
   -------------------------------------------------------------------------
   A script declares specialWinS03:{hand:[names…], label} — its owner wins when every named card is in that player's hand.
   specialWinCheckS03(gs) runs at the end of every applied Action (engine/00, like the LP-0 check), except while a single
   chain link resolves. CODEX-C01 brackets that link with journaled SPECIAL_WIN_DEFER_S03 Actions, including its resolution-time
   choices, then checks before the next lower link can resolve. Both players meeting a win condition at the same time → a draw.
   ========================================================================= */
function specialWinMetS03(gs, p){
  const P = gs && gs.players && gs.players[p];
  if(!P || typeof CARD_SCRIPTS === 'undefined') return null;
  const handNames = (P.hand || []).map(c=>c ? cardName(c) : '');
  for(const n of handNames){
    const sw = (CARD_SCRIPTS[n] || {}).specialWinS03;
    if(!sw || !Array.isArray(sw.hand)) continue;
    if(sw.hand.every(x=>handNames.indexOf(x) >= 0)) return sw.label || n;
  }
  /* S03-U401: the field form specialWinS03:{field:[names…]} (ウィジャ盤) — every named card stands face-up in the player's Spell & Trap Zone */
  const szNames = (P.sz || []).filter(c=>c && c.face==='up' && !c.activationPending).map(c=>cardName(c));
  for(const n of szNames){
    const sw = (CARD_SCRIPTS[n] || {}).specialWinS03;
    if(!sw || !Array.isArray(sw.field)) continue;
    if(sw.field.every(x=>szNames.indexOf(x) >= 0)) return sw.label || n;
  }
  return null;
}
function specialWinCheckS03(gs){
  if(!gs || gs.loser != null || !gs.players || gs.specialWinDeferredS03) return;
  const w0 = specialWinMetS03(gs, 0), w1 = specialWinMetS03(gs, 1);
  if(!w0 && !w1) return;
  if(w0 && w1){ gs.loser = -1; gs.duelEndedReason = 'draw'; logIt(gs, `<b>両者が同時に勝利条件を満たした — 引き分け</b>`); return; }
  const winner = w0 ? 0 : 1;
  gs.loser = winner === 0 ? 1 : 0;
  gs.duelEndedReason = 'specialWin';
  logIt(gs, `<b>${nameOf(winner)}：${w0 || w1} — デュエルに勝利</b>`);
}
function specialWinBeginLinkResolutionS03(){
  if(typeof gameState==='undefined' || !gameState || gameState.specialWinDeferredS03) return false;
  /* Internal resolution bookkeeping is journaled for Replay but must not make
     its own Undo checkpoint between the card effect's real Actions. */
  if(typeof commitAutomaticActionV44==='function') commitAutomaticActionV44({type:'SPECIAL_WIN_DEFER_S03',active:true});
  else act({type:'SPECIAL_WIN_DEFER_S03',active:true});
  return true;
}
function specialWinEndLinkResolutionS03(){
  if(typeof gameState==='undefined' || !gameState || !gameState.specialWinDeferredS03) return false;
  if(typeof commitAutomaticActionV44==='function') commitAutomaticActionV44({type:'SPECIAL_WIN_DEFER_S03',active:false});
  else act({type:'SPECIAL_WIN_DEFER_S03',active:false});
  return true;
}
