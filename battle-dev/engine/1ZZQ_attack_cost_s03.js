/* =========================================================================
   S03-U302 — attack-declaration cost: return another own card to the hand (霞の谷のファルコン)
   -------------------------------------------------------------------------
   「このカードは、このカード以外の自分フィールド上のカード1枚を手札に戻さなければ攻撃宣言できない。」
   - A script declares attackReturnCostS03:true. canDeclareAttackV48 refuses the attack while no other own card is on the field
     (Monster / Spell & Trap / Field Zone).
   - Every attack request of the UI (battlePickTargetV29, battleDirectV29, doAttack) goes through requestAttackS03. For such an attacker it
     opens a registry choice (the controller picks the card; cancelable = no attack, the attack is not used up). The answer returns the
     card to its owner's hand and then requests the attack. Attacker and target are kept by uid: returning a monster shifts the zone indices.
   - Save / resume: the choice is a registry choice with JSON args; the answer after a load does the same. Replay: the bounce, the choice and
     the attack are Actions.
   ========================================================================= */
const ATTACK_RETURN_COST_HANDLER_S03 = 's03u302.attack-return-cost';
function attackReturnCostS03(card){
  const sc = (card && typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  if(!sc || sc.attackReturnCostS03 !== true || !card || card.face !== 'up') return false;
  return !(typeof effectNegated === 'function' && effectNegated(card));
}
function attackReturnCandidatesS03(gs, p, attackerUid){
  gs = gs || gameState;
  const P = gs.players[p], out = [];
  if(!P) return out;
  (P.mz || []).forEach(c=>{ if(c && c.uid !== attackerUid) out.push(c); });
  (P.sz || []).forEach(c=>{ if(c) out.push(c); });
  if(P.field) out.push(P.field);
  return out;
}
function attackReturnCostBlockedS03(card){
  if(!attackReturnCostS03(card)) return false;
  const loc = (typeof locateCard === 'function') ? locateCard(card) : null;
  if(!loc) return true;
  ensureCardUid(gameState, card);
  return attackReturnCandidatesS03(gameState, loc.p, card.uid).length === 0;
}
/* the attack request itself, by uid (the indices are read now) */
function attackRequestNowS03(p, attackerUid, tgt, costPaid){
  const a = findCardByUid(Number(attackerUid));
  if(!a || a.zone !== 'mz' || a.p !== p) return false;
  let target = 'direct';
  if(tgt !== 'direct'){
    const t = findCardByUid(Number(tgt));
    if(!t || t.zone !== 'mz' || t.p === p) return false;
    target = t.index;
  }
  requestProcessorV27(PROCESSOR_V27.ATTACK, Object.assign({player:p, atkIdx:a.index, target}, costPaid ? {costPaidS03:true} : {}));
  return true;
}
/* ah = the attacker's location {p, index, card}; tgt = a target uid or 'direct' */
function requestAttackS03(ah, tgt){
  if(!ah || !ah.card) return false;
  ensureCardUid(gameState, ah.card);
  if(attackReturnCostS03(ah.card)){
    const cands = attackReturnCandidatesS03(gameState, ah.p, ah.card.uid);
    if(!cands.length){ if(typeof showToast === 'function') showToast('手札に戻せる他のカードが無いため攻撃宣言できません'); return false; }
    cands.forEach(c=>ensureCardUid(gameState, c));
    return !!requestChoiceV49({player:ah.p, kind:'card', title:`${cardName(ah.card)}：攻撃宣言のために手札に戻すカード`,
      candidates:cands, min:1, max:1, cancelable:true,
      resume:{handler:ATTACK_RETURN_COST_HANDLER_S03, args:{player:ah.p, attackerUid:ah.card.uid, target:tgt}},
      meta:{scriptName:cardName(ah.card)}});
  }
  return attackRequestNowS03(ah.p, ah.card.uid, tgt);
}
registerChoiceHandlerV49(ATTACK_RETURN_COST_HANDLER_S03, function(answer, args){
  if(!answer || answer.cancelled || !args) return;
  const pick = (answer.cards || []).find(x=>x && !x.stale && x.uid != null);
  const h = pick ? findCardByUid(Number(pick.uid)) : null;
  const a = findCardByUid(Number(args.attackerUid));
  if(!h || !a || h.p !== args.player || ['mz','sz','field'].indexOf(h.zone) < 0 || h.card.uid === a.card.uid) return;
  API.returnToHand(h, `${cardName(a.card)}（攻撃宣言のコスト）`);
  attackRequestNowS03(args.player, args.attackerUid, args.target, true);   /* the paid cost travels in the ATTACK payload */
});
