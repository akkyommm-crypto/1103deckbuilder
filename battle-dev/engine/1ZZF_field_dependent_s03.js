/* =========================================================================
   S03-U196 — 「フィールドに「X」が存在しない場合にこのカードは破壊される」 (天空の使者 ゼラディアス: 天空の聖域)
   -------------------------------------------------------------------------
   A script declares destroyWithoutFieldS03:'X'. While such a monster is face-up in a Monster Zone and no face-up X is in either Field
   Zone, it is destroyed at the rule processing point (act(), after the Sin upkeep) as a journaled FX_TO_GRAVE Action — the same shape as
   enforceSinUpkeep. A negated monster (スキルドレイン) does not apply its own destruction.
   ========================================================================= */
let FIELD_DEPENDENT_RESOLVING_S03 = false;
function fieldDependentVictimsS03(gs){
  gs = gs || gameState;
  const out = [];
  for(let p=0;p<2;p++){
    (gs.players[p].mz||[]).forEach(c=>{
      if(!c || c.face!=='up') return;
      const sc = CARD_SCRIPTS[cardName(c)];
      const need = sc && sc.destroyWithoutFieldS03;
      if(!need) return;
      if(typeof effectNegated==='function' && effectNegated(c)) return;
      const present = [0,1].some(q=>{ const f = gs.players[q].field; return f && f.face==='up' && cardName(f)===need; });
      if(!present) out.push(c);
    });
    /* S03-U227: 「…の場合、このカードを破壊する」 — a face-up card whose script declares selfDestroyWhenS03(card, player) → true / a reason string
       (暴君の暴飲暴食: its controller holds 3 or more cards). A card still being activated, or negated, is not destroyed by its own text. */
    const P = gs.players[p];
    [].concat(P.mz||[], P.sz||[], P.field?[P.field]:[]).forEach(c=>{
      if(!c || c.face!=='up' || c.activationPending || out.indexOf(c)>=0) return;
      /* S03-U282: turned face-up by an effect while another member of its unique group was face-up — destroyed by the rule */
      if(c.uniqueViolationS03){ out.push(c); return; }
      const sc = CARD_SCRIPTS[cardName(c)], f = sc && sc.selfDestroyWhenS03;
      if(typeof f!=='function') return;
      if(typeof effectNegated==='function' && effectNegated(c)) return;
      let hit = false; try{ hit = f(c, p); }catch(e){ hit = false; }
      /* S03-U282: 「…は自身の効果では破壊されない」 (地縛大神官, engine/1ZZM) */
      if(hit && typeof selfDestroyProtectedS03==='function' && selfDestroyProtectedS03(c)) hit = false;
      if(hit) out.push(c);
    });
  }
  return out;
}
function enforceFieldDependentS03(){
  if(FIELD_DEPENDENT_RESOLVING_S03 || typeof commitAutomaticActionV44!=='function') return;
  const dead = fieldDependentVictimsS03(gameState);
  if(!dead.length) return;
  FIELD_DEPENDENT_RESOLVING_S03 = true;
  try{
    dead.slice().reverse().forEach(c=>{
      const loc = locateCard(c); if(!loc || ['mz','sz','field'].indexOf(loc.zone)<0) return;
      const sc = CARD_SCRIPTS[cardName(c)], need = sc.destroyWithoutFieldS03;
      let reason = need ? `「${need}」が存在しないため破壊` : `${cardName(c)}の効果により破壊`;
      if(c.uniqueViolationS03) reason = 'フィールド上に1体しか表側表示で存在できないため破壊';   /* S03-U282 */
      if(!need && typeof sc.selfDestroyWhenS03==='function'){ let r = null; try{ r = sc.selfDestroyWhenS03(c, loc.p); }catch(e){ r = null; } if(typeof r==='string') reason = r; }
      /* S03-U284: the destroyed card records why (its own text 'self' / a uniqueness rule 'unique'), e.g. 地縛神 Aslla piscu 「このカードの効果以外の方法」 */
      commitAutomaticActionV44({type:'FX_TO_GRAVE', player:loc.p, zone:loc.zone, index:loc.index, byDestroy:true, reason, selfRuleS03:(c.uniqueViolationS03 ? 'unique' : 'self')});
    });
  } finally { FIELD_DEPENDENT_RESOLVING_S03 = false; }
}
