/* =========================================================================
   S03-U282 — 「地縛神」 common clauses and face-up uniqueness
   -------------------------------------------------------------------------
   All seven 地縛神 (2011 texts) share:
     「地縛神」と名のついたモンスターはフィールド上に1体しか表側表示で存在できない。
     フィールド魔法カードが表側表示で存在しない場合このカードを破壊する。
     相手はこのカードを攻撃対象に選択できない。 / このカードは相手プレイヤーに直接攻撃できる。
   - uniqueFaceUpS03: GROUP.X on a script → uniqueFaceUpReasonS03(db) refuses a face-up Normal / Flip / Special Summon while another face-up
     member of that group is on the field (either side; engine/40 v46FaceUpSummonRestrictionReason). A member turned face-up by an effect
     while another is face-up is flagged in the position detector (engine/19) and destroyed by the field-dependent enforcement (engine/1ZZF).
   - earthboundCommonS03(def): adds the common clauses to a 地縛神 script (selfDestroyWhenS03, canDirectAttack, cannotBeAttackTarget for itself).
   - continuous.noSelfEffectDestroyS03(card) on a face-up source (地縛大神官) → that card is not destroyed by its own effect (engine/1ZZF skips it).
   ========================================================================= */
function uniqueGroupOfS03(db){ const sc = (db && db.n && typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[db.n] : null; return (sc && sc.uniqueFaceUpS03) || null; }
function uniqueFaceUpMembersS03(gs, group){
  gs = gs || gameState; const out = [];
  gs.players.forEach((P, p)=>(P.mz || []).forEach(c=>{ if(c && c.face==='up' && typeof groupMemberNowS03==='function' && groupMemberNowS03(c, group)) out.push({p, card:c}); }));
  return out;
}
/* S03-U418: 「X」はフィールド上に1体しか表側表示で存在できない — a script declares uniqueNameS03:'any' (either field: 神禽王アレクトール, 渋い忍者) or 'own'
   (「自分フィールドに」: ガガガマジシャン, ジェスター・コンフィ); the card's own name is the group */
function uniqueNameScopeS03(db){ const sc = (db && db.n && typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[db.n] : null; return (sc && sc.uniqueNameS03) || null; }
function uniqueNameMembersS03(gs, name, side){
  gs = gs || gameState; const out = [];
  gs.players.forEach((P, p)=>{ if(side!=null && p!==side) return; (P.mz || []).forEach(c=>{ if(c && c.face==='up' && cardName(c)===name) out.push({p, card:c}); }); });
  return out;
}
function uniqueFaceUpReasonS03(db, p){
  const g = uniqueGroupOfS03(db);
  if(g) return uniqueFaceUpMembersS03(gameState, g).length ? '「地縛神」と名のついたモンスターはフィールド上に1体しか表側表示で存在できません' : '';
  const sn = uniqueNameScopeS03(db);
  if(sn && uniqueNameMembersS03(gameState, db.n, sn==='own' ? p : null).length) return `「${db.n}」はフィールド上に1体しか表側表示で存在できません`;
  return '';
}
/* engine/19: a card turned face-up from face-down — flag it when another member of its group is already face-up */
function uniqueFlipViolationS03(gs, uid){
  const h = (typeof findCardByUidInState==='function') ? findCardByUidInState(gs, uid) : null;
  if(!h || h.zone!=='mz' || h.card.face!=='up') return;
  const g = uniqueGroupOfS03(dbOf(h.card));
  if(!g){
    const sn = uniqueNameScopeS03(dbOf(h.card));   /* S03-U418 */
    if(sn && uniqueNameMembersS03(gs, cardName(h.card), sn==='own' ? h.p : null).some(x=>x.card!==h.card)) h.card.uniqueViolationS03 = true;
    return;
  }
  if(uniqueFaceUpMembersS03(gs, g).some(x=>x.card!==h.card)) h.card.uniqueViolationS03 = true;
}
/* engine/1ZZF: a face-up source protecting this card from destruction by its own effect */
function selfDestroyProtectedS03(card){
  if(typeof continuousSources!=='function') return false;
  return continuousSources().some(src=>{
    const f = src && src.sc && src.sc.continuous && src.sc.continuous.noSelfEffectDestroyS03;
    if(typeof f!=='function') return false;
    try{ return !!f(card, src.card); }catch(e){ return false; }
  });
}
function faceUpFieldSpellExistsS03(gs){ gs = gs || gameState; return gs.players.some(P=>P && P.field && P.field.face==='up'); }
function earthboundCommonS03(def){
  const d = Object.assign({}, def);
  d.uniqueFaceUpS03 = GROUP.EARTHBOUND;
  d.canDirectAttack = true;
  const own = d.selfDestroyWhenS03;
  d.selfDestroyWhenS03 = function(card, p){
    if(!faceUpFieldSpellExistsS03(gameState)) return 'フィールド魔法カードが表側表示で存在しないため破壊';
    return typeof own==='function' ? own(card, p) : false;
  };
  const cont = Object.assign({scope:'self', from:['mz'], apply(){ return null; }}, d.continuous || {});
  const cbat = cont.cannotBeAttackTarget;
  cont.cannotBeAttackTarget = (target, self)=> target===self || (typeof cbat==='function' && cbat(target, self));
  d.continuous = cont;
  return d;
}
