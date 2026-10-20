/* =========================================================================
   S03-U404 — deck-movement locks declared by face-up cards
   -------------------------------------------------------------------------
   A face-up, non-negated card in a Monster / Spell & Trap / Field Zone (either side) whose script declares
     fieldReturnLockS03:true     (G・B・ハンター)   the cards on the field cannot be returned to the Deck          → FX_RETURN_DECK from mz / sz / field is refused
     deckToGraveLockS03:true     (次元要塞兵器)     nobody can send cards from the Deck to the Graveyard           → FX_TO_GRAVE from the deck, FX_MILL, FX_MILL_TOP are refused
     graveToDeckBanishS03:true   (転生断絶)         a card that would return from the Graveyard to the Deck is banished instead → FX_RETURN_DECK from the grave banishes
   Pure functions of the state (Replay-safe); they are read inside the reducers.
   ========================================================================= */
function deckLockSourceS03(gs, key){
  gs = gs || gameState;
  if(!gs || !gs.players || typeof CARD_SCRIPTS==='undefined') return false;
  return gs.players.some(P=>[].concat(P.mz||[], P.sz||[], P.field?[P.field]:[]).some(c=>{
    if(!c || c.face!=='up' || c.activationPending) return false;
    const sc = CARD_SCRIPTS[cardName(c)];
    if(!sc || sc[key]!==true) return false;
    return !(typeof effectNegated==='function' && effectNegated(c));
  }));
}
function fieldReturnLockedS03(gs){ return deckLockSourceS03(gs, 'fieldReturnLockS03'); }
function deckToGraveLockedS03(gs){ return deckLockSourceS03(gs, 'deckToGraveLockS03'); }
function graveToDeckBanishedS03(gs){ return deckLockSourceS03(gs, 'graveToDeckBanishS03'); }
function banishLockedS03(gs){ return deckLockSourceS03(gs, 'banishBanS03'); }              /* S03-U415: 王宮の鉄壁 — nobody can banish cards */
function deckSummonBannedS03(gs){ return deckLockSourceS03(gs, 'deckSummonBanS03'); }      /* S03-U415: デッキロック — no Special Summon from the Deck */
function fieldBounceBanishedS03(gs){ return deckLockSourceS03(gs, 'fieldBounceBanishS03'); } /* S03-U415: 縮退回路 — a monster returning from the field to the hand is banished */
