/* S03-U119: デュアル (Gemini) — "もう1度召喚" (Gemini Summon) and the Normal-Monster treatment.

   Before this unit the engine had only the `dualUp` card flag (set by フォース・リリース) and treatedAsNormal()
   (cards/30_themes_b.js); a player could not Gemini Summon at all, and 24 of the 26 Gemini cards in the 2011 pool
   had no script (マジック・スライム was ENGINE_GAP for exactly this reason).

   Rules (2011):
   - A Gemini monster on the field or in the GY is a Normal Monster. While face-up in the Monster Zone its controller
     may Normal Summon it once more (uses the turn's Normal Summon; Main Phase; it counts as a Normal Summon — 神の宣告 /
     神の警告 can negate it, then the monster is destroyed; "召喚に成功した時" effects such as 奈落の落とし穴 react).
   - After that it is an Effect Monster and gains its effects until it leaves the field or is turned face-down.

   Implementation:
   - Gemini Summon = the normal summon window (beginSummonWindowV2) with kind 'normal' plus `geminiS03: true`, so every
     negator that answers a Normal Summon answers it. NORMAL_SUMMON_ATTEMPT consumes the Normal Summon first (as for a
     hand summon). Commit → journaled GEMINI_SUMMON_S03 (dualUp + summonedTurn) + onNormalSummon {geminiS03}. Negated →
     destroyed (FX_TO_GRAVE byDestroy). runSummonWindowResumeS03 handles both (engine/40).
   - `dualUp` is zone-local (ZONE_LOCAL_KEYS) and cleared when the card is turned face-down (FX_SET_STATE).
   - Card scripts gate their effects with geminiActiveS03(card) (see defineGeminiS03 in
     cards/HO_claude_s03_u119_gemini.js). */

function isGeminiS03(card){
  if(!card) return false;
  const st = dbOf(card).st || [];
  return st.indexOf('デュアル') >= 0;
}
/* the Gemini card currently has its effects: Gemini-Summoned (dualUp) and face-up in a Monster Zone */
function geminiActiveS03(card){
  if(!isGeminiS03(card) || !card.dualUp || card.face!=='up') return false;
  const h = typeof locateCardAnyV4==='function' ? locateCardAnyV4(card) : null;
  return !!(h && h.zone==='mz');
}
/* why this face-up Gemini monster cannot be Gemini Summoned now ('' = it can) */
function geminiSummonBlockedS03(card, p){
  if(!card || !isGeminiS03(card)) return 'デュアルモンスターではありません';
  if(typeof PLAY_MODE!=='undefined' && PLAY_MODE!==PLAY_MODES.DUEL) return 'DUELモードのみ';
  if(p!==gameState.activePlayer) return '自分のターンのみ';
  if(!(gameState.phase==='main1'||gameState.phase==='main2')) return 'メインフェイズのみ';
  const h = findCardByUid(ensureCardUid(gameState, card));
  if(!h || h.p!==p || h.zone!=='mz' || card.face!=='up') return '自分フィールドの表側表示のデュアルモンスターのみ';
  if(card.dualUp) return '既にもう1度召喚された状態です';
  const R = typeof rules==='function' ? rules() : {normalSummon:true};
  if(!R.normalSummon) return '今は通常召喚できません';
  if(!normalRightFreeS03(gameState.players[p])) return 'このターンは既に通常召喚しています';   /* S03-U274: 二重召喚 */
  if(gameState.chain.length || gameState.pendingSummon || gameState.pendingAttack || gameState.battle) return '処理中です';
  const lock = typeof v46FaceUpSummonRestrictionReason==='function' ? v46FaceUpSummonRestrictionReason(p, dbOf(card), 'normal') : '';
  if(lock) return lock;
  return '';
}
function doGeminiSummonS03(p, zone, idx){
  const c = zoneCard(gameState.players[p], zone, idx); if(!c) return;
  const why = geminiSummonBlockedS03(c, p);
  if(why){ showToast(why); return; }
  const nm = cardName(c);
  ensureCardUid(gameState, c);
  closeSheet();
  act({type:'NORMAL_SUMMON_ATTEMPT', player:p, name:nm});
  PENDING_SUMMON_COMMIT = PENDING_SUMMON_CANCEL = null;
  beginSummonWindowV2({player:p, name:nm, kind:'normal', geminiS03:true, label:'もう1度召喚（デュアル）', uid:c.uid,
    commit:'__pendingSummonCommit', cancel:'__pendingSummonCancel', resumeS03:{uid:c.uid}});
}
/* summon window continuation (called from runSummonWindowResumeS03) */
function geminiSummonResumeS03(ps, result){
  const r = ps.resumeS03, hit = findCardByUid(r.uid);
  if(result==='commit'){
    if(!hit || hit.zone!=='mz' || hit.card.face!=='up'){ logIt(gameState, `${ps.name} はもう1度召喚できる状態ではなくなった`); return false; }
    act({type:'GEMINI_SUMMON_S03', player:hit.p, zone:hit.zone, index:hit.index, uid:r.uid});
    const now = findCardByUid(r.uid);
    if(now) queueDeferredEventV2('onNormalSummon', {player:ps.player, name:ps.name, card:now.card, geminiS03:true});
    flushDeferredEventsV2();
    return true;
  }
  if(!hit || hit.zone!=='mz') return false;
  act({type:'FX_TO_GRAVE', player:hit.p, zone:hit.zone, index:hit.index, reason:'もう1度召喚を無効', byDestroy:true});
  return true;
}
