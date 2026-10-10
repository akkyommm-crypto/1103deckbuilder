/* =========================================================================
   S03-U176 — 「相手の手札をランダムに1枚選んで破壊する」 and 「このカードは墓地からの特殊召喚はできない」
   -------------------------------------------------------------------------
   - HAND_DESTROY_RANDOM_S03 {player (whose hand), byPlayer, reason}: the random card is drawn INSIDE the Action (duelRandomInt with the
     state's RNG), so Replay destroys the same card. The card goes to its owner's GY as destroyed (graveInfo byDestroy, from 'hand');
     it is not a discard (no 暗黒界 discard event). onSendToGrave is queued.
   - destroyRandomHandCardS03(victim, reason, byPlayer): script entry point.
   - Script flag noGraveSpecialSummonS03:true — a summon condition read with the other conditions (engine/1ZK
     properlySummonedReasonS03): no Special Summon from the GY (「召喚条件を無視して」 still ignores it).
   ========================================================================= */
function destroyRandomHandCardS03(victim, reason, byPlayer){
  const H = (gameState.players[victim]||{}).hand||[];
  if(!H.length){ trace(`destroyRandomHand: 手札がありません`, false); return false; }
  const a = {type:'HAND_DESTROY_RANDOM_S03', player:victim, reason:reason||'効果'};
  if(byPlayer===0 || byPlayer===1) a.byPlayer = byPlayer;
  act(a);
  return true;
}
function handDestroyRandomReduceS03(gs, a){
  const P = gs.players[a.player]; if(!P) return;
  const H = P.hand||[];
  if(!H.length){ logIt(gs, `${a.reason||'効果'}：${nameOf(a.player)}の手札がありません`); return; }
  const i = (typeof duelRandomInt==='function') ? duelRandomInt(H.length, gs) : 0;
  const card = removeFrom(P, 'hand', i);
  if(!card) return;
  const owner = cardOwnerIndex(gs, card, a.player), G = gs.players[owner];
  pushZone(G.grave, card);
  const put = graveLastIsS03(G.grave, card);
  const byP = (a.byPlayer===0 || a.byPlayer===1) ? a.byPlayer : null;
  if(put){
    put.graveInfo = {turn:gs.turn, from:'hand', byDestroy:true, byPlayer:byP};
    if(typeof applyMoveProvenanceP3==='function') applyMoveProvenanceP3(put, a, 'hand');
  }
  logIt(gs, `${a.reason||'効果'}：${nameOf(a.player)}の手札から ${cardName(card)} をランダムに選んで破壊`);
  if(put && typeof queueDeferredEventV2==='function' && typeof PLAY_MODE!=='undefined' && PLAY_MODE===PLAY_MODES.DUEL)
    queueDeferredEventV2('onSendToGrave', {player:a.player, card:put, reason:'destroy', from:'hand', byPlayer:byP});
}
function graveSpecialSummonBanReasonS03(card, from){
  if(from!=='grave' || !card) return '';
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  return (sc && sc.noGraveSpecialSummonS03===true) ? `${cardName(card)}は墓地からの特殊召喚はできません` : '';
}
