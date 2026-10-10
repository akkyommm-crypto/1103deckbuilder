/* S03-U118: field Trap negation (王宮のお触れ / トラップ・スタン / 人造人間－サイコ・ショッカー), one model.

   Measured on U117:
   - A Trap already on the chain was never negated when it resolved after 王宮のお触れ / トラップ・スタン had started
     applying (e.g. 聖なるバリア －ミラーフォース－ as chain 1, トラップ・スタン chained as chain 2 → Mirror Force still
     destroyed everything). trapNegated / trapStunned were only read by the activation legality check, the response
     candidate list and continuous effects — never at resolution.
   - Conversely the legality check refused to activate any Trap while they applied. By rule only the EFFECT of a field
     Trap is negated: activating it is legal (its cost is paid, it is negated when it resolves).
   - 人造人間－サイコ・ショッカー ("罠カードは発動できず、全てのフィールド上の罠カードの効果は無効化される") was ENGINE_GAP.

   Model:
   - negation:  continuous `negateTrap(card, self)` (王宮のお触れ, サイコ・ショッカー) or the トラップ・スタン turn flag;
                applies to Trap cards in the Spell & Trap Zone (face-up there while they resolve / apply).
   - prohibition: continuous `forbidTrapActivation(card, self, p)` (サイコ・ショッカー only) — the only thing that makes
                activating a Trap illegal.
   - resolution: resolveOnePreparedLinkV27 treats a Trap link whose card is in the Spell & Trap Zone and negated at
                that moment as effect-negated (the card still leaves the field / stays as usual). */

function trapActivationForbiddenS03(p, card){
  if(!card || dbOf(card).k!=='t' || typeof continuousSources!=='function') return '';
  let why = '';
  continuousSources().some(src=>{
    const f = src.sc && src.sc.continuous && src.sc.continuous.forbidTrapActivation;
    if(typeof f!=='function') return false;
    let hit = false;
    try{ hit = !!f(card, src.card, p); }catch(e){ hit = false; }
    if(hit) why = `${cardName(src.card)}の効果により罠カードは発動できません`;
    return hit;
  });
  return why;
}

/* is this Trap card's effect negated right now while it is in the Spell & Trap Zone? */
function trapFieldEffectNegatedS03(card){
  if(!card || dbOf(card).k!=='t') return false;
  const loc = typeof locateCard==='function' ? locateCard(card) : null;
  if(!loc || loc.zone!=='sz') return false;
  if(typeof trapNegated==='function' && trapNegated(card)) return true;
  if(typeof trapStunned==='function' && trapStunned(loc.p, card)) return true;
  return false;
}

/* resolution: a Trap chain link from the Spell & Trap Zone whose card is negated now */
function trapLinkNegatedAtResolutionS03(link, srcCard){
  if(!link || !srcCard) return false;
  if(spellLinkNegatedAtResolutionS03(link, srcCard)) return true;   /* S03-U251 */
  if(link.from && link.from!=='sz') return false;
  return trapFieldEffectNegatedS03(srcCard);
}

/* S03-U251: 「フィールドの魔法カードの効果は無効化される」 (サイレント・ソードマン LV7) — the same model for Spells.
   A face-up monster declares continuous `negateSpell(card, self)`. It applies to Spell cards on the field (Spell & Trap Zone /
   Field Zone): a Spell link whose card is there when it resolves (activated from the hand or Set) is effect-negated, and the
   continuous effects of such Spells are dropped (spellSourcesFilterS03, called from trapSourcesFilterS03 with the monster
   sources). Activating a Spell stays legal. A Spell effect activated from the GY / hand is not on the field: not negated. */
function spellNegatorSourcesS03(){
  if(typeof continuousSources!=='function') return [];
  return continuousSources().filter(n=>n && n.zone==='mz' && n.sc && n.sc.continuous && typeof n.sc.continuous.negateSpell==='function');
}
function spellFieldEffectNegatedS03(card){
  if(!card || dbOf(card).k!=='s') return false;
  const loc = typeof locateCard==='function' ? locateCard(card) : null;
  if(!loc || (loc.zone!=='sz' && loc.zone!=='field') || card.face==='down') return false;
  return spellNegatorSourcesS03().some(n=>{
    if(n.card===card) return false;
    try{ return !!n.sc.continuous.negateSpell(card, n.card); }catch(e){ return false; }
  });
}
function spellLinkNegatedAtResolutionS03(link, srcCard){
  if(!link || !srcCard || dbOf(srcCard).k!=='s') return false;
  return spellFieldEffectNegatedS03(srcCard);   // the card's position now decides (GY / hand → not on the field)
}
function spellSourcesFilterS03(outer, negators){
  if(!negators) return outer;
  const pool = negators.filter(n=>n && n.sc && n.sc.continuous && typeof n.sc.continuous.negateSpell==='function');
  if(!pool.length) return outer;
  return outer.filter(s=>{
    if(!s || !s.card || (s.zone!=='sz' && s.zone!=='field') || dbOf(s.card).k!=='s') return true;
    return !pool.some(n=>{
      if(n.card===s.card) return false;
      try{ return !!n.sc.continuous.negateSpell(s.card, n.card); }catch(e){ return false; }
    });
  });
}

/* continuous sources: drop Trap cards in the Spell & Trap Zone that are negated — by the トラップ・スタン turn flag, or by a
   `negateTrap` source among `negators` (null = the other Spell/Trap/Field sources themselves). Uses the negateTrap
   functions directly (never trapNegated → continuousSources) so there is no recursion. Two 王宮のお触れ negate each other. */
function trapSourcesFilterS03(outer, negators){
  const pool = negators || outer;
  outer = spellSourcesFilterS03(outer, negators);   /* S03-U251: monster negateSpell sources */
  return outer.filter(s=>{
    if(!s || !s.card || s.zone!=='sz' || dbOf(s.card).k!=='t') return true;
    if(!negators && typeof trapStunned==='function' && trapStunned(s.p, s.card)) return false;
    return !pool.some(n=>{
      if(!n || n===s || n.card===s.card) return false;
      const f = n.sc && n.sc.continuous && n.sc.continuous.negateTrap;
      if(typeof f!=='function') return false;
      try{ return !!f(s.card, n.card); }catch(e){ return false; }
    });
  });
}
