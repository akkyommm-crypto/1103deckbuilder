/* =========================================================================
   S03-U144 — 「このカードが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動できない」
   -------------------------------------------------------------------------
   11 cards of the 2011 pool share this clause (古代の機械 line, E－HERO ワイルド・サイクロン, インフェルニティ・ビースト,
   A・ジェネクス・トライフォース …). 古代の機械巨人 was pinned ENGINE_GAP for exactly this, and 古代の機械巨竜's
   lockOpponentSpells / antiqueGearLock() existed but was never consulted anywhere.
   ■ Window: from the attack declaration (gs.pendingAttack) until the end of the Damage Step (gs.battle is cleared by
     finishDamageStepV28). The declared card must be the attacker (or, with whenBattling, either battler), face-up, with its
     effects not negated, and — when the card declares active(card) — currently having the effect (Gemini, empty hand …).
   ■ What is locked (for the other player only):
     - default: the activation of Spell / Trap CARDS (from the hand, or a set card); effects of face-up Continuous Spells /
       Traps are not card activations and stay allowed (same reading as the ショック・ルーラー lock, engine/1ZD);
     - allEffects (ジェムナイト・マディラ 「魔法・罠・モンスターの効果を発動できない」): every Spell / Trap / monster activation.
   Checked through activationTypeLockReasonS03 (engine/1ZD), which both legality paths already use. */
const ATTACK_LOCK_S03 = {};
function declareAttackLockS03(name, spec){ ATTACK_LOCK_S03[name] = Object.assign({whenBattling:false, allEffects:false}, spec||{}); }
function currentBattlersS03(){
  if(typeof gameState==='undefined' || !gameState) return null;
  const b = gameState.battle, a = gameState.pendingAttack;
  if(b) return {atk:b.atkUid, def:b.targetUid};
  if(a) return {atk:a.attackerUid, def:a.targetUid};
  return null;
}
function attackLockReasonS03(p, card, zone, db, opts){
  const bt = currentBattlersS03();
  if(!bt || !db) return '';
  const roles = [{uid:bt.atk, role:'atk'}, {uid:bt.def, role:'def'}];
  for(const x of roles){
    if(x.uid==null) continue;
    const h = findCardByUid(x.uid);
    if(!h || h.zone!=='mz' || !h.card || h.card.face!=='up') continue;
    const n = dbOf(h.card).n, spec = ATTACK_LOCK_S03[n];
    if(!spec) continue;
    if(x.role==='def' && !spec.whenBattling) continue;
    if(h.p===p) continue;
    if(typeof effectNegated==='function' && effectNegated(h.card)) continue;
    if(typeof spec.active==='function' && !spec.active(h.card, h)) continue;
    if(spec.allEffects){
      if(db.k==='s' || db.k==='t' || db.k==='m') return `「${n}」が戦闘を行うため、ダメージステップ終了時まで魔法・罠・モンスターの効果を発動できません`;
      continue;
    }
    if(db.k!=='s' && db.k!=='t') continue;
    const cardActivation = zone==='hand' || ((zone==='sz' || zone==='field') && card && card.face==='down') || !!(opts && opts.cardActivation);
    if(!cardActivation) continue;
    return `「${n}」の攻撃中は、ダメージステップ終了時まで魔法・罠カードを発動できません`;
  }
  return '';
}
