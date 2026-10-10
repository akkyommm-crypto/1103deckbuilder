/* =========================================================================
   S03-U137 — 「このカードがカードの効果の対象になった時、このカードを破壊する」
   -------------------------------------------------------------------------
   魂を削る死霊 had only its battle-proof / direct-damage discard parts; the self-destruction when targeted was recorded as
   "the next stage of the targeting-event base" and never implemented.
   Like S03-U28 (targeting negators) and S03-U66 (protectors), this runs right after CHAIN_ADD: every face-up monster-zone
   card among the new chain link's targets whose name is declared here (and whose effects are not negated) is destroyed at
   once. It builds no chain block (a continuous effect, as the other two hooks). Any card effect counts — own or opponent's,
   Spell, Trap or monster. Face-down it does nothing (its effect does not apply).
   ========================================================================= */
const TARGETED_SELF_DESTROY_S03 = {};
function declareTargetedSelfDestroyS03(name, spec){ TARGETED_SELF_DESTROY_S03[name] = spec || {}; }
function applyTargetedSelfDestroyS03(){
  const chain = (gameState && gameState.chain) || [];
  const link = chain[chain.length - 1];
  if(!link || link.chainId == null || !link.targets) return false;
  const restored = (typeof deserializeChainSelectionV2 === 'function') ? deserializeChainSelectionV2(link.targets) : [];
  const list = (Array.isArray(restored) ? restored : [restored]).filter(Boolean);
  let hit = false;
  list.forEach(t=>{
    const h = (t && t.card) ? locateCardAnyV4(t.card) : null;
    if(!h || h.zone !== 'mz' || !h.card || h.card.face !== 'up') return;
    const name = dbOf(h.card).n;
    if(!TARGETED_SELF_DESTROY_S03[name]) return;
    if(typeof effectNegated === 'function' && effectNegated(h.card)) return;
    API.destroy(h, `${name}（カードの効果の対象になった）`);
    hit = true;
  });
  return hit;
}
