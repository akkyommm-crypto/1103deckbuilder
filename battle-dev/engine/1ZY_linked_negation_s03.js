/* =========================================================================
   S03-U177 — 「このカードがフィールド上に表側表示で存在する限り、選択したモンスターの効果は無効化される」 (a monster source)
   -------------------------------------------------------------------------
   effectNegated() only read negation from Spell / Trap sources (スキルドレイン, デモンズ・チェーン); a monster that negates one selected
   monster while it stays face-up (E・HERO ブラック・ネオス) had no way to express it.
   - The link is two zone-local marks set by Actions (FX_CARD_FLAG_V46): the target's negLinkS03 = source uid and the source's
     negLinkTargetS03 = target uid. Either card leaving the field drops its mark → the link ends.
   - The target is negated while the source is a face-up monster, still linked to it, and not negated itself (guarded recursion).
   - linkNegateTargetS03(src, target, reason): script entry point (replaces the source's previous link).
   ========================================================================= */
let LINKED_NEG_GUARD_S03 = false;
function linkedNegationActiveS03(card){
  if(!card || card.negLinkS03==null || LINKED_NEG_GUARD_S03) return false;
  const src = (typeof findCardByUid==='function') ? findCardByUid(card.negLinkS03) : null;
  if(!src || src.zone!=='mz' || src.card.face!=='up' || src.card.negLinkTargetS03!==card.uid) return false;
  LINKED_NEG_GUARD_S03 = true;
  try{ return !effectNegated(src.card); } finally { LINKED_NEG_GUARD_S03 = false; }
}
/* the uid of the monster this source currently negates (null when the link has ended) */
function linkedNegationTargetS03(src){
  if(!src || src.negLinkTargetS03==null) return null;
  const t = findCardByUid(src.negLinkTargetS03);
  return (t && t.zone==='mz' && t.card.negLinkS03===src.uid) ? src.negLinkTargetS03 : null;
}
function linkNegateTargetS03(src, target, reason){
  const s = findCardByUid(ensureCardUid(gameState, src));
  const t = resolveTarget(target);
  if(!s || s.zone!=='mz' || !t || t.zone!=='mz') return false;
  ensureCardUid(gameState, t.card);
  act({type:'FX_CARD_FLAG_V46', player:s.p, zone:'mz', index:s.index, flag:'negLinkTargetS03', value:t.card.uid, reason});
  const t2 = findCardByUid(t.card.uid);
  act({type:'FX_CARD_FLAG_V46', player:t2.p, zone:'mz', index:t2.index, flag:'negLinkS03', value:s.card.uid, reason});
  logIt(gameState, `${reason}：${cardName(t2.card)} の効果を無効化（${cardName(s.card)} が表側表示で存在する限り）`);
  return true;
}
