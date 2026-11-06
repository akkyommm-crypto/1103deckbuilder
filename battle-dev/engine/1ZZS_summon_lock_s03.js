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
      /* S03-U517: 罠カードは、その効果が無効にされている間は何も適用しない
         （サモンリミッターと人造人間－サイコ・ショッカーが共に表側の場合、WIKI-D8FEA13745E1 / WIKI-942ECAD162E6 11/05/30）。 */
      if(dbOf(c).k==='t'){
        if(typeof trapNegated==='function' && trapNegated(c)) continue;
        if(typeof trapStunned==='function' && trapStunned(q, c)) continue;
      }
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
/* =========================================================================
   S03-U517 — 1ターンの「召喚行為」の回数（サモンリミッター）
   -------------------------------------------------------------------------
   「お互いのプレイヤーは1ターンに合計2回までしかモンスターを召喚・反転召喚・特殊召喚できない」は、
   そのカードが出る前に行った召喚行為も数える（WIKI-FA2EC0926915 08/03/06）。だから数える側は条件を見ずに
   常に数え、上限を決めるのは読む側（カードの summonLockS03）にする。
     ・無効にされた召喚は成功していないので数えない（WIKI-4FD72A35ED9E 08/08/20）。
       召喚成功イベントを予約した時点で数えるので、これはそのまま満たされる。
     ・お互いが特殊召喚するカードは、それぞれのプレイヤーが1回ずつ（WIKI-7E37568B7AAA 08/07/22）。
       プレイヤーごとに数えるので満たされる。
     ・同時に複数体を特殊召喚した場合に1回と数えるかは当時「調整中」（WIKI-3990B9280CC0 11/06/11）。
       ここでは出来事1回につき1回として数える（flushResolutionSummonBatchV2 がまとめた1イベント = 1回）。
   置き場は temporaryFlags.summonActsS03 なので、ターンの切り替えで消え（engine/00 の TURN）、
   Journal / 保存 / Replay の digest にも入る（engine/06 は temporaryFlags をそのまま digest に入れる）。
   数えるのは DUEL だけ（他のモードは召喚制限を適用しない）。
   ========================================================================= */
function bumpSummonActS03(gs, p){
  if(typeof PLAY_MODE==='undefined' || typeof PLAY_MODES==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return 0;
  if(p!==0 && p!==1) return 0;
  const P = (gs || gameState).players[p]; if(!P) return 0;
  const tf = P.temporaryFlags || (P.temporaryFlags = {});
  tf.summonActsS03 = (Number(tf.summonActsS03)||0) + 1;
  return tf.summonActsS03;
}
function noteSummonActS03(gs, item){
  if(!item || (item.eventName!=='onNormalSummon' && item.eventName!=='onSpecialSummon')) return 0;
  const e = item.evt || {};
  return bumpSummonActS03(gs || gameState, e.player);
}
function summonActsThisTurnS03(p, gs){
  const P = ((gs || (typeof gameState!=='undefined' ? gameState : null)) || {players:[]}).players[p];
  return Number((P && P.temporaryFlags || {}).summonActsS03) || 0;
}
/* S03-U517 — 特殊召喚そのものを目的とする効果の「発動」を止める側の判定。
   モンスターを問わずその時点でその player の特殊召喚が全てできない状態（カイザーコロシアム／サモンリミッター）は、
   モンスターの種類で決まる summonLockS03 とは別に、カードの発動の可否にも効く:
     《スケープ・ゴート》は発動自体ができない（WIKI-05D8FDD9315F 07/03/04）、
     3回目の召喚行為としての《死者蘇生》は発動できない（WIKI-3E01B205FCEA 09/05/28、WIKI-83BAECDD9B3A 09/05/28）。
   カード側は globalSummonLockS03({p, src, srcPlayer}) → true を宣言する。engine/40 の
   v46GlobalSpecialSummonRestrictionReason がこれを読み、strictScriptLegalityV2（engine/30）の
   blocksIfNoSpecialSummon の判定に乗る。強制効果はそこを通らないので発動して不発になる
   （WIKI-1305B3CE1B4E 09/08/30「発動しますが、不発になります」）。 */
function globalSummonLockReasonS03(p){
  if(typeof CARD_SCRIPTS === 'undefined' || !gameState || !gameState.players) return '';
  for(let q = 0; q < 2; q++){
    const Pq = gameState.players[q], srcs = [].concat(Pq.mz || [], Pq.sz || [], Pq.field ? [Pq.field] : []);
    for(const c of srcs){
      if(!c || c.face !== 'up' || c.activationPending || c.activationNegated) continue;
      const sc = CARD_SCRIPTS[cardName(c)], f = sc && sc.globalSummonLockS03;
      if(typeof f !== 'function') continue;
      if(typeof effectNegated === 'function' && effectNegated(c)) continue;
      if(dbOf(c).k === 't'){
        if(typeof trapNegated === 'function' && trapNegated(c)) continue;
        if(typeof trapStunned === 'function' && trapStunned(q, c)) continue;
      }
      let hit = false; try{ hit = !!f({p, src:c, srcPlayer:q}); }catch(e){ hit = false; }
      if(hit) return `${cardName(c)}の効果により特殊召喚できません`;
    }
  }
  return '';
}
