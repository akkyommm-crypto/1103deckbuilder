/* =========================================================================
   S03-U214 — 「墓地へ送られるカードは墓地へは行かずゲームから除外される」 (光の追放者, 閃光の追放者, マクロコスモス; 次元の裂け目: monsters)
   -------------------------------------------------------------------------
   A face-up card on the field whose script declares graveToBanishS03 (true, or fn(card, src) → true for the cards it covers) replaces
   every move to a Graveyard: the card goes to its owner's banished zone instead. All GY moves go through pushZone (engine/00), which asks
   graveRedirectPileS03. The reducers that stamp graveInfo / queue onSendToGrave read the card back only when it really is in the GY, so
   a banished card gets neither; it gets banishInfo {turn, from:'graveRedirect', by} and an onRemove event instead.
   Simultaneity: the sources are captured when the outermost Action starts (applyAction, depth 0). Cards leaving in the same Action (ブラック・ホール,
   大嵐, a battle cleanup) are all covered by a source that leaves with them; the source itself still goes to the GY.
   A source whose effect is negated in the Action's state (cardEffectNegatedInActionStateS03), or a Spell / Trap still being activated,
   does not apply. Tokens vanish as before (reset returns null).
   ========================================================================= */
let GRAVE_REDIRECT_SNAPSHOT_S03 = null;
function graveRedirectSourcesLiveS03(gs){
  gs = gs || gameState;
  const out = [];
  if(!gs || !gs.players || typeof CARD_SCRIPTS==='undefined') return out;
  for(let p=0;p<2;p++){
    const P = gs.players[p];
    const cards = [].concat(P.mz||[], P.sz||[], P.field ? [P.field] : []);
    cards.forEach(c=>{
      if(!c || c.face!=='up') return;
      const sc = CARD_SCRIPTS[cardName(c)], rule = sc && sc.graveToBanishS03;
      if(!rule) return;
      if(c.activationPending || c.activationNegated) return;
      if(typeof cardEffectNegatedInActionStateS03==='function' && cardEffectNegatedInActionStateS03(gs, c)) return;
      if(typeof effectNegated==='function' && gs===gameState && effectNegated(c)) return;
      out.push({card:c, p, rule});
    });
  }
  /* S03-U233: 異次元グランド 「このターン、墓地へ送られるモンスターは墓地へは行かず除外される」 — not a card on the field but a turn-stamped
     flag of the player who activated it (temporaryFlags, cleared at the next turn); it covers both players' monster cards. */
  for(let p=0;p<2;p++){
    const tf = gs.players[p] && gs.players[p].temporaryFlags, g = tf && tf.graveToBanishTurnS03;
    if(g && Number(g.turn)===Number(gs.turn)) out.push({card:null, uid:null, p, name:g.by || '異次元グランド', rule:c=>dbOf(c).k==='m'});
  }
  return out;
}
/* applyAction (engine/00) calls this at depth 0 before the reducer and clears it afterwards.
   One effect often moves its cards with several Actions (ブラック・ホール destroys them one by one). A source that left the field during an
   Action stamped with an effect source (a.srcS03, engine/1ZG) stays in force for the following Actions stamped with the same source in
   that turn (gs.redirectDepartedS03, rebuilt by Replay from the same Actions). Unstamped Actions (costs, the Spell going to the GY after
   its resolution, battle) never see a departed source. */
let GRAVE_REDIRECT_KEY_S03 = null;
function captureGraveRedirectS03(gs, a){
  const live = graveRedirectSourcesLiveS03(gs);
  const key = (a && a.srcS03 && a.srcS03.uid!=null) ? a.srcS03.uid : null;
  const d = gs && gs.redirectDepartedS03;
  if(d && ((key!=null && d.key!==key) || Number(d.turn)!==Number(gs.turn))) delete gs.redirectDepartedS03;
  else if(d && key!=null && d.key===key && typeof CARD_SCRIPTS!=='undefined'){
    d.list.forEach(x=>{ const sc = CARD_SCRIPTS[x.name], rule = sc && sc.graveToBanishS03; if(rule) live.push({card:null, uid:x.uid, p:x.p, rule, name:x.name}); });
  }
  GRAVE_REDIRECT_SNAPSHOT_S03 = live; GRAVE_REDIRECT_KEY_S03 = key;
}
function releaseGraveRedirectS03(){ GRAVE_REDIRECT_SNAPSHOT_S03 = null; GRAVE_REDIRECT_KEY_S03 = null; }
function noteDepartedRedirectSourceS03(card, p){
  if(GRAVE_REDIRECT_KEY_S03==null || !card || card.uid==null) return;
  const gs = gameState, d = gs.redirectDepartedS03;
  const rec = (d && d.key===GRAVE_REDIRECT_KEY_S03 && Number(d.turn)===Number(gs.turn)) ? d : {key:GRAVE_REDIRECT_KEY_S03, turn:gs.turn, list:[]};
  if(!rec.list.some(x=>x.uid===card.uid)) rec.list.push({uid:card.uid, p, name:cardName(card)});
  gs.redirectDepartedS03 = rec;
}
/* the pile that `card` goes to instead of `arr` (a player's GY), or null */
function graveRedirectPileS03(arr, card){
  if(!arr || !card || typeof gameState==='undefined' || !gameState || !gameState.players) return null;
  let p = -1;
  for(let q=0;q<2;q++) if(gameState.players[q].grave===arr) p = q;
  if(p<0) return null;
  /* S03-U240: a 「宝玉獣」 whose controller chose 「墓地へ送らずに…魔法&罠カードゾーンに置く」 (engine/1ZZH) — its owner's zone */
  if(card.crystalPlaceS03 && typeof crystalPlacePileS03==='function'){ const cp = crystalPlacePileS03(gameState, p, card); if(cp) return cp; }
  /* S03-U268: equipped instead of the GY (ドラグニティ－ジャベリン, engine/1ZV) */
  if(card.equipInsteadS03 && typeof equipInsteadPileS03==='function'){ const ep = equipInsteadPileS03(gameState, p, card); if(ep) return ep; }
  const srcs = GRAVE_REDIRECT_SNAPSHOT_S03 || graveRedirectSourcesLiveS03(gameState);
  const self = srcs.find(s=>s.card===card);
  if(self) noteDepartedRedirectSourceS03(card, self.p);             /* it still covers the rest of this effect's moves */
  const hit = srcs.find(s=>{
    if(s.card===card || (s.uid!=null && s.uid===card.uid)) return false;   /* the source itself goes to the GY */
    if(s.rule===true) return true;
    try{ return typeof s.rule==='function' && !!s.rule(card, s.card || null); }catch(e){ return false; }
  });
  if(!hit) return null;
  const byName = hit.card ? cardName(hit.card) : hit.name;
  card.banishInfo = {turn:gameState.turn, from:'graveRedirect', by:byName};
  if(typeof queueDeferredEventV2==='function') queueDeferredEventV2('onRemove', {player:p, card, name:cardName(card), reason:'graveRedirect'});
  if(typeof logIt==='function') logIt(gameState, `${byName}：${cardName(card)} は墓地へは行かず除外`);
  return gameState.players[p].banish;
}
/* an onSendToGrave event for a card that the replacement banished instead never happened (processEventV27 / processEventBatchV28 skip it) */
function graveRedirectedEventS03(eventName, evt){
  if(eventName!=='onSendToGrave' || !evt) return false;
  const u = evt.uid!=null ? evt.uid : (evt.card && evt.card.uid!=null ? evt.card.uid : null);
  const h = (u!=null && typeof findCardByUid==='function') ? findCardByUid(u) : null;
  if(h && h.zone==='sz' && h.card.asSpellS03 && Number(h.card.asSpellS03.turn)===Number(gameState.turn)) return true;   /* S03-U240: placed instead */
  return !!(h && h.zone==='banish' && h.card.banishInfo && h.card.banishInfo.from==='graveRedirect');
}
