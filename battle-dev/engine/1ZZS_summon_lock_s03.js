/* =========================================================================
   S03-U384 — summon locks by KIND (Normal Summon / Flip Summon / Special Summon)
   -------------------------------------------------------------------------
   v46FaceUpSummonRestrictionReason(p, db, kind) now asks summonLockReasonS03(p, db, kind) (engine/40). Callers name the kind:
   'normal' (Normal / Tribute Summon, Gemini re-summon), 'flip' (Flip Summon), 'special' (every Special Summon through
   v46SpecialSummonRestrictionReason). A caller that names no kind (older call sites) is checked against nothing kind-specific.
   Three sources, all derived from the board and from player flags (no new state):
     1. the SUMMONED card's own condition   CARD_SCRIPTS[name].summonConditionS03(p, db, kind) → '' or a reason
        (ジェノサイドキングデーモン: 「デーモン」 must be on the field to be Normal / Flip Summoned)
     2. a face-up card on the field         CARD_SCRIPTS[name].summonLockS03({p, db, kind, src, srcPlayer}) → true locks
        (レプティレス・サーヴァント: nobody can Normal Summon). Negated / still-activating sources apply nothing.
     3. turn-ranged bans on a player        effectFlags.summonBanS03 = [{from, to, kinds:['normal'|'flip'|'special'], match:{effect|synchro}, label}]
        written with banSummonS03(p, from, to, kinds, match, label) (大熱波, 完全防音壁). `match` narrows the summoned monster by its type.
   ========================================================================= */
function banSummonS03(p, from, to, kinds, match, label){
  const cur = API.getFlag(p, 'summonBanS03');
  const keep = (Array.isArray(cur) ? cur : []).filter(b=>b && Number(b.to) >= Number(gameState.turn));
  keep.push({from, to, kinds, match: match || {}, label});
  API.setFlag(p, 'summonBanS03', keep, false);
}
function summonBanMatchS03(match, db){
  const st = (db && db.st) || [];
  if(match && match.effect && st.indexOf('効果') < 0) return false;
  if(match && match.synchro && st.indexOf('シンクロ') < 0) return false;
  if(match && match.lvmin && !(Number(db && db.lv || 0) >= Number(match.lvmin))) return false;   /* S03-U419: Level N or higher */
  if(match && match.lvmax && !(Number(db && db.lv || 0) <= Number(match.lvmax))) return false;   /* S03-U429: Level N or lower (ワーム・ベイト: Levels 3 and 4 = lvmin 3, lvmax 4) */
  return true;
}
function summonLockReasonS03(p, db, kind){
  if(!db || db.k !== 'm' || !kind || typeof CARD_SCRIPTS === 'undefined' || !gameState || !gameState.players) return '';
  /* 1. the summoned card's own condition */
  const own = CARD_SCRIPTS[db.n];
  if(own && typeof own.summonConditionS03 === 'function'){
    let r = ''; try{ r = own.summonConditionS03(p, db, kind) || ''; }catch(e){ r = ''; }
    if(r) return r;
  }
  /* 2. face-up cards that lock summons */
  for(let q = 0; q < 2; q++){
    const Pq = gameState.players[q], srcs = [].concat(Pq.mz || [], Pq.sz || [], Pq.field ? [Pq.field] : []);
    for(const c of srcs){
      if(!c || c.face !== 'up' || c.activationPending || c.activationNegated) continue;
      const sc = CARD_SCRIPTS[cardName(c)], f = sc && sc.summonLockS03;
      if(typeof f !== 'function') continue;
      if(typeof effectNegated === 'function' && effectNegated(c)) continue;
      let hit = false; try{ hit = !!f({p, db, kind, src:c, srcPlayer:q}); }catch(e){ hit = false; }
      if(hit) return `${cardName(c)}の効果により${kind === 'special' ? '特殊召喚' : kind === 'flip' ? '反転召喚' : '召喚'}できません`;
    }
  }
  /* 3. turn-ranged bans */
  const bans = ((gameState.players[p] || {}).effectFlags || {}).summonBanS03;
  if(Array.isArray(bans)){
    const t = Number(gameState.turn);
    const hit = bans.find(b=>b && t >= Number(b.from) && t <= Number(b.to) && Array.isArray(b.kinds) && b.kinds.indexOf(kind) >= 0 && summonBanMatchS03(b.match, db));
    if(hit) return `${hit.label || '効果'}により${kind === 'special' ? '特殊召喚' : kind === 'flip' ? '反転召喚' : '召喚'}できません`;
  }
  return '';
}
