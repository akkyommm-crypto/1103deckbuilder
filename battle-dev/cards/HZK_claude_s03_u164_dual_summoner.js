/* S03-U164: デュアル・サモナー (2011):
   「相手のエンドフェイズ時に1度だけ500ライフポイントを払って発動する事ができる。手札または自分フィールド上に表側表示で存在する
   デュアルモンスター1体を通常召喚する。また、このカードは1ターンに1度だけ、戦闘では破壊されない。」
   - Offered at the opponent's End Phase (the onEndPhase event: the controller of this face-up card, not the turn player, may activate
     it once; engine note: represented as an optional effect of that event — the End Phase gives the non-turn player one chance).
     Cost: 500 LP.
   - Resolution: a Normal Summon by the effect (NORMAL_SUMMON prepaid — the player's own Normal Summon is not used; a summon made
     during a resolution has no summon-negation window). The Gemini monster is chosen at resolution (journaled choice):
       · from the hand — face-up Attack Position; Lv5-6 needs 1 Tribute, Lv7+ 2 (tributesNeeded), chosen at resolution;
       · a face-up Gemini monster on its controller's field that is not yet an Effect Monster — the Gemini Summon (GEMINI_SUMMON_S03).
     Then the onNormalSummon event, as for any Normal Summon.
   - once-per-turn battle protection: protectV21. */
function dualSummonerCandidatesS03(p){
  const P = gameState.players[p];
  const out = [];
  const tribs = tributeCandidates(p).length;
  P.hand.forEach((c,i)=>{
    if(!c || !isGeminiS03(c)) return;
    const need = tributesNeeded(dbOf(c), p);
    if(need===0 ? !hasMonsterZoneSpace(p) : tribs < need) return;
    const lock = (typeof v46FaceUpSummonRestrictionReason==='function') ? v46FaceUpSummonRestrictionReason(p, dbOf(c)) : '';
    if(lock) return;
    out.push(Object.assign(v17Handle(p,'hand',i,c), {need}));
  });
  P.mz.forEach((c,i)=>{
    if(!c || !isGeminiS03(c) || c.face!=='up' || c.dualUp) return;
    out.push(Object.assign(v17Handle(p,'mz',i,c), {need:0}));
  });
  return out;
}
defineScript('デュアル・サモナー', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドの表側表示のこのカードの効果です'; return false; }
    if(gameState.phase!=='end' || gameState.activePlayer===ctx.player){ ctx.reason = '相手のエンドフェイズ時に発動できます'; return false; }
    if(API.me(ctx).lp < 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    if(!dualSummonerCandidatesS03(ctx.player).length){ ctx.reason = '通常召喚できるデュアルモンスターがいません'; return false; }
    return true;
  },
  countLimit:1,
  cost(ctx, done){ if(API.me(ctx).lp < 500){ done(false); return; } API.payCost(ctx.player, 500); done(true); },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const cands = dualSummonerCandidatesS03(ctx.player);
    if(!cands.length){ API.log('デュアル・サモナー：通常召喚できるデュアルモンスターがいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'デュアル・サモナー：通常召喚するデュアルモンスター', candidates:cands, min:1, max:1, cancelable:false,
      resume:{handler:'s03u164.dual-summoner', args:{player:ctx.player}}, meta:{scriptName:'デュアル・サモナー'}});
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.activePlayer!==ctx.player; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'デュアル・サモナー', label:'デュアル・サモナー', perTurn:1, battle:(target, self)=> target===self }
  }
});
registerChoiceHandlerV49('s03u164.dual-summoner', (answer, args)=>{
  const pick = answer && answer.cards && answer.cards[0];
  if(!pick || pick.uid==null || !args) return;
  const p = args.player, h = findCardByUid(pick.uid);
  if(!h || h.p!==p || !isGeminiS03(h.card)) return;
  if(h.zone==='mz'){
    if(h.card.face!=='up' || h.card.dualUp) return;
    act({type:'GEMINI_SUMMON_S03', player:p, zone:'mz', index:h.index, uid:h.card.uid});
    const now = findCardByUid(pick.uid);
    if(now) queueDeferredEventV2('onNormalSummon', {player:p, name:cardName(now.card), card:now.card, geminiS03:true, byEffectS03:'デュアル・サモナー'});
    return;
  }
  if(h.zone!=='hand') return;
  const need = tributesNeeded(dbOf(h.card), p);
  if(need===0){ dualSummonerNormalSummonS03(p, pick.uid, []); return; }
  const tr = tributeCandidates(p);
  if(tr.length < need) return;
  API.requestChoice({player:p, kind:'card', title:`デュアル・サモナー：リリースするモンスター（${need}体）`, candidates:tr, min:need, max:need, cancelable:false,
    resume:{handler:'s03u164.dual-summoner-tribute', args:{player:p, uid:pick.uid}}, meta:{scriptName:'デュアル・サモナー'}});
});
registerChoiceHandlerV49('s03u164.dual-summoner-tribute', (answer, args)=>{
  if(!args) return;
  const uids = (answer && answer.cards || []).map(y=>y && y.uid).filter(u=>u!=null);
  dualSummonerNormalSummonS03(args.player, args.uid, uids);
});
function dualSummonerNormalSummonS03(p, uid, tributeUids){
  const tribs = [];
  tributeUids.forEach(u=>{
    const t = findCardByUid(u);
    if(!t || t.zone!=='mz' || t.p!==p) return;
    tribs.push(typeof snapshotCardV3==='function' ? snapshotCardV3(t.card,['atk','def','level','attribute','race','owner','originalAtk']) : null);
    act({type:'FX_TO_GRAVE', player:t.p, zone:t.zone, index:t.index, reason:'デュアル・サモナー（アドバンス召喚のリリース）', byDestroy:false,
      p3:{reason:'tribute', actingPlayer:p, fromZone:'mz'}});
  });
  const h = findCardByUid(uid);
  if(!h || h.zone!=='hand' || !hasMonsterZoneSpace(p)) return;
  act({type:'NORMAL_SUMMON', player:p, handIndex:h.index, pos:'atk', tributes:tributeUids.length, tributeValue:tributeUids.length, prepaid:true,
    p3Materials:tribs.filter(Boolean)});
  const summoned = lastSummonedCard(p);
  if(summoned) queueDeferredEventV2('onNormalSummon', {player:p, name:cardName(summoned), card:summoned, byEffectS03:'デュアル・サモナー'});
}
