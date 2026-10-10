/* =========================================================================
   S03-U240 — 「宝玉獣」: a monster card treated as a Continuous Spell in the Spell & Trap Zone
   -------------------------------------------------------------------------
   1. 「このカードがモンスターカードゾーン上で破壊された場合、墓地へ送らずに永続魔法カード扱いとして自分の魔法&罠カードゾーンに表側表示で
      置く事ができる」 — declared by the card script: crystalPlaceS03:{faceUpOnly?:true}. The choice uses the S03-U173 decision flow
      (engine/1ZV: kind 'placeSpell', asked at the destruction, not cancelable). The card is still destroyed (destruction events, counts);
      only its destination changes. The decision (journaled DESTROY_SUB_S03) marks the card crystalPlaceS03 {turn}; the GY move then
      goes to the owner's Spell & Trap Zone instead (graveRedirectPileS03, engine/1ZZG), face-up, card.asSpellS03 {turn}. A full zone
      sends it to the GY. Covered: effect destructions during a chain link resolution (API.destroy / destroyAll) and battle — the same
      reach as U173.
   2. 「…を永続魔法カード扱いとして自分の魔法&罠ゾーンに表側表示で置く」 by an effect (サファイア・ペガサス): placeAsSpellS03(p, from, index, reason)
      → the journaled FX_PLACE_SPELL_S03 (engine/00).
   A placed card is a monster card in the Spell & Trap Zone (dbOf(card).k stays 'm'); zone-based effects (大嵐, 宝玉の導き, 宝玉の契約) see it.
   Limit (documented): scripts that pick Spell / Trap cards by db.k ('s' / 't') do not see it.
   asSpellS03 is zone-local (gone when the card leaves the Spell & Trap Zone).
   ========================================================================= */
function crystalPlaceDeclS03(card){
  if(!card || typeof CARD_SCRIPTS==='undefined') return null;
  const sc = CARD_SCRIPTS[cardName(card)];
  return (sc && sc.crystalPlaceS03) || null;
}
function stZoneFreeS03(gs, p){ return !!(gs && gs.players[p]) && (gs.players[p].sz||[]).length < ZONE_LIMITS.sz; }
/* the pile replacing the GY for a card whose controller chose to place it (called by graveRedirectPileS03, engine/1ZZG) */
function crystalPlacePileS03(gs, p, card){
  const m = card && card.crystalPlaceS03;
  if(!m) return null;
  delete card.crystalPlaceS03;
  if(Number(m.turn)!==Number(gs.turn)) return null;
  if(!stZoneFreeS03(gs, p)){ logIt(gs, `${cardName(card)}：魔法＆罠ゾーンに空きがないため墓地へ送られる`); return null; }
  card.face = 'up';
  card.asSpellS03 = {turn:gs.turn};
  logIt(gs, `${cardName(card)}：墓地へ送らず、永続魔法カード扱いとして魔法＆罠ゾーンに表側表示で置く`);
  notePlacedAsSpellS03(p, card);
  return gs.players[p].sz;
}
/* S03-U242: 「「宝玉獣」モンスターが魔法&罠ゾーンに置かれる度に」 (宝玉の樹) — onPlacedAsSpellS03 {uid, player, name}, queued by both
   placement paths (destroyed → placed, and FX_PLACE_SPELL_S03) in a DUEL; drained like the other deferred events. */
function notePlacedAsSpellS03(p, card){
  if(!card || typeof queueDeferredEventV2!=='function' || typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return;
  queueDeferredEventV2('onPlacedAsSpellS03', {uid:card.uid, player:p, name:cardName(card)});
}
/* a monster card treated as a Continuous Spell in the Spell & Trap Zone */
function isPlacedAsSpellS03(card){ return !!(card && card.asSpellS03); }
/* 2. place a monster card from hand / Deck / GY (its owner's zone) */
function placeAsSpellS03(p, from, index, reason){
  const P = gameState.players[p]; if(!P) return false;
  const pile = from==='hand' ? P.hand : (from==='deck' ? P.deck : (from==='grave' ? P.grave : null));
  const card = pile && pile[index]; if(!card) return false;
  if(!stZoneFreeS03(gameState, p)){ if(typeof showToast==='function') showToast('魔法＆罠ゾーンに空きがありません'); return false; }
  ensureCardUid(gameState, card);
  act({type:'FX_PLACE_SPELL_S03', player:p, from, index, uid:card.uid, reason:reason||'効果'});
  return true;
}
/* reducer part (engine/00 FX_PLACE_SPELL_S03) */
function placeAsSpellReduceS03(gs, P, a){
  const pile = a.from==='hand' ? P.hand : (a.from==='deck' ? P.deck : (a.from==='grave' ? P.grave : null));
  if(!pile) return;
  const i = (a.uid!=null) ? pile.findIndex(c=>c && c.uid===a.uid) : a.index;
  if(i<0 || !pile[i]) return;
  if((P.sz||[]).length >= ZONE_LIMITS.sz){ logIt(gs, '魔法・罠ゾーンが一杯です'); return; }
  const card = pile.splice(i,1)[0];
  if(a.from==='grave') delete card.graveInfo;
  if(a.from==='deck') shuffle(P.deck, gs);
  card.face = 'up'; card.pos = 'atk';
  card.asSpellS03 = {turn:gs.turn};
  P.sz.push(card);
  logIt(gs, `${a.reason||'効果'}：${cardName(card)} を永続魔法カード扱いとして魔法＆罠ゾーンに表側表示で置く`);
  notePlacedAsSpellS03(a.player, card);
}
