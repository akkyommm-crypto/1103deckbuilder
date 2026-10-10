/* S03-U106: TG ラッシュ・ライノ (T.G. Rush Rhino) — priority #7's IMPLEMENTED-tier audit, continuing after
   U105 (one of the 2 remaining qty=3 main-deck candidates found by U97's corrected cross-reference). Real
   text (confirmed via Yugipedia): "If this card attacks, it gains 400 ATK during the Damage Step only. Once
   per turn, during the End Phase, if this card is in the GY because it was destroyed on the field and sent
   there this turn: You can add 1 'T.G.' monster from your Deck to your hand, except 'T.G. Rush Rhino'."

   Clause ① (the continuous +400 ATK during the Damage Step while attacking) was already correctly
   implemented in cards/20_control_counter.js. But clause ②'s implementation only checked "is this card
   currently in the Graveyard" — none of its real restrictions were enforced: not "destroyed on the field
   and sent there THIS TURN" (any reason for being in the GY, e.g. a plain discard, was wrongly accepted),
   not "during the End Phase" (activatable at any time while in the GY), and not "once per turn" (no limit
   at all). This is the EXACT SAME real-text clause, in the EXACT SAME shape, already correctly implemented
   for TG ワーウルフ / TG ストライカー (cards/10_themes_a.js, S03-U87) — reused verbatim via the existing
   shared helpers (tgGraveClause/tgGraveResolve/tgDestroyedThisTurnS03U87/tgOtherPool), rather than
   reimplementing the same logic a third time.

   A SECOND card in the same file, TG サイバー・マジシャン, has the exact identical bug shape for its own
   (otherwise identically-worded) clause — fixed as a same-unit dependent recovery (precedent: S03-U86's
   ナチュル・パルキオン). It is not on any of the 13 fixed major decks, but the fix cost is effectively zero
   given the already-shared helpers, so it is folded into this unit rather than deferred.

   No engine change; both fixes reuse existing S03-U87 primitives. Promotes TG ラッシュ・ライノ and
   TG サイバー・マジシャン both IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  return 'idle';}
  return 'loop';}
function driveAll(){for(let i=0;i<20;i++){const st=drive();if(st!=='choice')return st;__choicePickV49(0);}return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real clause ① (regression, already correct): a real attack by TG ラッシュ・ライノ (real base ATK
   1600) really gains +400 ATK during the real Damage Step (real effective ATK 2000), really destroying a
   real 1700 ATK opponent monster it would otherwise lose to. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=0;gameState.phase='battle';
const rhino=mk('TG ラッシュ・ライノ',0);
gameState.players[0].mz=[rhino];
const foe=mk('アックス・レイダー',1); // real ATK 1700 (base 1600 loses, boosted 2000 wins)
gameState.players[1].mz=[foe];
baselineA();
ok('A setup: the real opponent monster ATK is below 2000 but real TG ラッシュ・ライノ base ATK (1600) alone is not enough',
  curATK(foe)>1600&&curATK(foe)<=2000,JSON.stringify(curATK(foe)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
driveAll();
ok('A: the real +400 Damage-Step ATK boost really lets TG ラッシュ・ライノ win a real battle it would otherwise lose',
  zoneOf(foe.uid)==='grave'&&zoneOf(rhino.uid)==='mz',
  JSON.stringify({foe:zoneOf(foe.uid),rhino:zoneOf(rhino.uid)}));
audit('A');
`);

/* ===== B. Real clause ② (the fixed bug): TG ラッシュ・ライノ, really destroyed on the real field and sent to
   the real GY THIS real turn, is a real legal activation at the real End Phase — resolving really adds a
   real other "TG" monster from the Deck to hand (excluding itself). ===== */
harness(COMMON+String.raw`
fresh();
const rhino=mk('TG ラッシュ・ライノ',0,'up');
gameState.players[0].mz=[rhino];
gameState.players[0].deck=[mk('TG ワーウルフ',0),mk('もけもけ',0)];
baselineA();
API.destroy({p:0,zone:'mz',index:0,card:rhino},'test-destroy');
ok('B: before the real End Phase, clause 2 is correctly NOT yet legal (right after the real destroy, still main1)',
  !strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{})));
act({type:'SET_PHASE',phase:'end'});
ok('B: TG ラッシュ・ライノ is really in the real Graveyard with real graveInfo (destroyed, from mz, this turn)',
  zoneOf(rhino.uid)==='grave'&&rhino.graveInfo&&rhino.graveInfo.byDestroy&&rhino.graveInfo.from==='mz'&&rhino.graveInfo.turn===gameState.turn,
  JSON.stringify({zone:zoneOf(rhino.uid),graveInfo:rhino.graveInfo}));
ok('B: clause 2 is really a legal activation at the real End Phase',
  strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{})));
duelActivateFromZone(0,'grave',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='TG ワーウルフ';});
  __choicePickV49(i>=0?i:0);
}
driveAll();
ok('B: resolution really adds TG ワーウルフ from the real Deck to real hand (excluding TG ラッシュ・ライノ itself)',
  gameState.players[0].hand.some(c=>nm(c)==='TG ワーウルフ'),JSON.stringify(gameState.players[0].hand.map(nm)));
audit('B');
`);

/* ===== C. Real negative control: TG ラッシュ・ライノ discarded (not destroyed on the field) does not offer
   clause 2, even at the real End Phase — the fixed bug's other half. ===== */
harness(COMMON+String.raw`
fresh();
const rhino=mk('TG ラッシュ・ライノ',0);
gameState.players[0].hand=[rhino];
API.discard(0,0,'test-discard');
gameState.phase='end';
baselineA();
ok('C: TG ラッシュ・ライノ discarded (not destroyed on the field) does NOT offer clause 2 even at the real End Phase',
  !strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{})));
`);

/* ===== D. TG サイバー・マジシャン (same-unit dependent recovery, identical bug shape): real clause 2 works
   the same way — really destroyed on the real field and sent to the real GY this turn, really legal only at
   the real End Phase, resolving really adds a real other "TG" monster. ===== */
harness(COMMON+String.raw`
fresh();
const mag=mk('TG サイバー・マジシャン',0,'up');
gameState.players[0].mz=[mag];
gameState.players[0].deck=[mk('TG ストライカー',0),mk('もけもけ',0)];
baselineA();
API.destroy({p:0,zone:'mz',index:0,card:mag},'test-destroy');
ok('D: before the real End Phase, clause 2 is correctly NOT yet legal (right after the real destroy, still main1)',
  !strictScriptLegalityV2('TG サイバー・マジシャン',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG サイバー・マジシャン',0,'grave',0,{})));
act({type:'SET_PHASE',phase:'end'});
ok('D: at the real End Phase, clause 2 is really legal',
  strictScriptLegalityV2('TG サイバー・マジシャン',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG サイバー・マジシャン',0,'grave',0,{})));
duelActivateFromZone(0,'grave',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='TG ストライカー';});
  __choicePickV49(i>=0?i:0);
}
driveAll();
ok('D: resolution really adds TG ストライカー from the real Deck to real hand',
  gameState.players[0].hand.some(c=>nm(c)==='TG ストライカー'),JSON.stringify(gameState.players[0].hand.map(nm)));
audit('D');
`);

/* ===== E. Real negative control: with no real other "TG" monster in the real Deck, clause 2 is correctly
   illegal even with all other real conditions met. ===== */
harness(COMMON+String.raw`
fresh();
const rhino=mk('TG ラッシュ・ライノ',0,'up');
gameState.players[0].mz=[rhino];
gameState.players[0].deck=[mk('もけもけ',0)];
baselineA();
API.destroy({p:0,zone:'mz',index:0,card:rhino},'test-destroy');
act({type:'SET_PHASE',phase:'end'});
ok('E: illegal with no real other "TG" monster in the real Deck',
  !strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ラッシュ・ライノ',0,'grave',0,{})));
`);
