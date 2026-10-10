/* =========================================================================
   S03-U115 — "unaffected by Spell/Trap card effects" (generic capability)
   -------------------------------------------------------------------------
   Consumer found: 《禁じられた聖槍》 (fixed list rabbit x2) — "このカード以外の魔法・罠カードの効果を受けない" was a
   flag (spearProof) that nothing ever read. Other cards of the same shape (E・HERO ワイルドマン, トラファスフィア,
   力の代行者 マーズ, サイレント・ソードマン LV5 …) can declare `unaffectedByS03(card, src, gs)` on their script.

   Contract
   - Effect source: while a chain link resolves, act() stamps affecting FX_* actions with
     a.srcS03 = {uid, k} (k = 'm' | 's' | 't') of the resolving card (RESOLVING_LINK_S03). Baked into the journaled
     Action → Replay decides the same way from the Action alone. Costs (paid during activation) are not stamped.
   - Reducer: an affecting action whose target card is unaffected by that source changes nothing (logged).
     FX_WIPE_ZONE is filtered per card. A card is never "unaffected" by its own effects.
   - Continuous effects: collectContinuous() (stat layers) and effectNegatedBy() (e.g. スキルドレイン) skip a Spell/Trap
     source for a card that is unaffected by it.
   - 禁じられた聖槍: card.spearProofS03 = {turn, srcUid}; active only in that turn, exempts the lance itself.
     Zone-local (cleared when the card leaves the field).
   ========================================================================= */

const S03U115_AFFECT_TYPES = Object.freeze(['FX_TO_GRAVE','FX_BOUNCE','FX_BANISH','FX_DESTROY_BANISH','FX_RETURN_DECK',
  'FX_CONTROL','MOD_ADD','MOD_SET','STAT_MOD_V14','NEGATE_CARD_V13','FX_NEGATE','FX_SET_STATE','CHAR_MOD_V17',
  'LEVEL_MOD_V16','FX_CARD_FLAG_V46','PROT_GRANT_V21','FX_EQUIP','V4_EFFECT_REGISTER','FX_WIPE_ZONE','FX_DETACH']);

function s03StampEffectSourceU115(a){
  if(!a || a.srcS03!==undefined || S03U115_AFFECT_TYPES.indexOf(a.type)<0) return a;
  const r = (typeof RESOLVING_LINK_S03!=='undefined') ? RESOLVING_LINK_S03 : null;
  if(!r || r.uid==null) return a;
  let k = null;
  const h = (typeof findCardByUid==='function') ? findCardByUid(r.uid) : null;
  if(h && h.card){ const d=dbOf(h.card); k = d ? d.k : null; }
  if(!k && r.name && typeof findCardIndex==='function'){ const i=findCardIndex(r.name); if(i>=0 && CARD_DB[i]) k = CARD_DB[i].k; }
  if(!k) return a;
  a.srcS03 = {uid:r.uid, k};
  /* S03-U168: the targeted uids of the resolving link (only when it targets), for the v21 non-targeting protections */
  if(Array.isArray(r.targetUids) && r.targetUids.length) a.srcS03.tg = r.targetUids.slice();
  return a;
}

/* Is `card` unaffected by an effect whose source is src {uid, k}? */
function s03UnaffectedByU115(gs, card, src){
  if(!card || !src || !src.k) return false;
  if(src.uid!=null && card.uid!=null && card.uid===src.uid) return false;      // never by its own effect
  const sp = card.spearProofS03;
  if(sp && gs && sp.turn===gs.turn && (src.k==='s' || src.k==='t') && sp.srcUid!==src.uid) return true;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(sc && typeof sc.unaffectedByS03==='function'){
    try{ if(sc.unaffectedByS03(card, src, gs)) return true; }catch(e){}
  }
  /* S03-U249: granted by another face-up card — continuous.grantUnaffectedS03(card, src, self) (暴君の威圧: 「…モンスターは、このカード以外の
     罠カードの効果を受けない」). Guarded: continuousSources() can itself ask about negation / immunity. */
  if(!S03U249_GRANT_GUARD && typeof continuousSources==='function'){
    S03U249_GRANT_GUARD = true;
    try{
      if(continuousSources().some(s=>{ const f = s.sc && s.sc.continuous && s.sc.continuous.grantUnaffectedS03; return typeof f==='function' && !!s.card && !!f(card, src, s.card); })) return true;
    }catch(e){}
    finally{ S03U249_GRANT_GUARD = false; }
  }
  return false;
}
let S03U249_GRANT_GUARD = false;
function s03ActionTargetCardU115(gs, a){
  if(a.type==='FX_EQUIP'){ const T=gs.players[a.targetP]; return T ? T.mz[a.targetMz] : null; }
  if(a.type==='V4_EFFECT_REGISTER'){
    const u = a.effect && a.effect.targetUid;
    const h = (u!=null && typeof findCardByUidInState==='function') ? findCardByUidInState(gs,u) : null;
    return (h && ['mz','sz','field'].includes(h.zone)) ? h.card : null;
  }
  const P = gs.players[a.player];
  if(!P) return null;
  if(a.type==='FX_DETACH') return P.mz[a.mzIndex] || null;
  if(!['mz','sz','field'].includes(a.zone)) return null;
  return zoneCard(P, a.zone, a.index);
}
/* true → the reducer must not apply this action (the target is unaffected by its source). */
function s03SkipUnaffectedActionU115(gs, a){
  if(!a || !a.srcS03 || a.type==='FX_WIPE_ZONE') return false;
  const c = s03ActionTargetCardU115(gs, a);
  if(!c || !s03UnaffectedByU115(gs, c, a.srcS03)) return false;
  logIt(gs, `${cardName(c)} は${a.srcS03.k==='t'?'罠':'魔法'}カードの効果を受けない`);
  return true;
}
/* continuous sources (stat layers / negation) */
function s03UnaffectedByContinuousU115(card, srcCard){
  if(!card || !srcCard) return false;
  const d = dbOf(srcCard); if(!d || (d.k!=='s' && d.k!=='t')) return false;
  const gs = (typeof gameState!=='undefined') ? gameState : null;
  return s03UnaffectedByU115(gs, card, {uid:srcCard.uid, k:d.k});
}
