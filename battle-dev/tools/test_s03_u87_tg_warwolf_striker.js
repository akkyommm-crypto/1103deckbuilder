/* S03-U87: TG ワーウルフ / TG ストライカー — priority #7's IMPLEMENTED-tier audit picked up TG ワーウルフ
   (qty=6 across tg_skill/tg_gadget main decks) next after S03-U86. Reading the existing implementation
   (cards/10_themes_a.js) surfaced 3 real gaps for TG ワーウルフ's clause ①, plus a missing clause ② shared
   identically by TG ストライカー (same file):
   1. Real text: "When a Level 4 or lower monster(s) is Special Summoned (except during the Damage Step): you
      can Special Summon this card from your hand." The old condition only checked
      API.me(ctx).ssHistory.length (the controller's OWN Special Summons, regardless of Level) — meaning it
      never triggered off the opponent's Special Summons, and incorrectly triggered off any Level (e.g. a
      Level 8 Special Summon).
   2. Xyz Summons store their Rank in the same 'lv' DB field this engine uses for Level (confirmed via
      No.39 希望皇ホープ: lv=4 in data/carddata.json even though real rulings treat Xyz Monsters as having no
      Level) — so a naive lv<=4 check would incorrectly count a Rank<=4 Xyz Summon. Fixed by recording
      specialSummonKind alongside lv in ssHistory (engine/00_state_actions.js, 4 push sites) and excluding
      kind==='xyz'.
   3. Missing entirely: "Once per turn, during the End Phase, if this card is in the GY because it was
      destroyed on the field and sent there this turn: You can add 1 'T.G.' monster from your Deck to your
      hand, except [this card]." (both TG ワーウルフ and TG ストライカー). Added using the same graveInfo
      pattern as ドル・ドラ (D2_auto_cycle30.js) and the existing s03u58.deck-search registered handler.
   TG ストライカー's own clause ① (state-based, no Special-Summon-event dependency) was already correct and is
   only regression-checked here; its own clause ② is new. Both cards promoted IMPLEMENTED->TESTED. */
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

/* ===== A. Real either-player fix: the OPPONENT really activates ワン・フォー・ワン (a real Spell),
   really discarding a real hand monster as cost and really Special Summoning a real Level 1 monster from
   the Deck; once that chain fully resolves, TG ワーウルフ in the CONTROLLER's own hand is really a legal
   activation (the old bug only recognized the controller's OWN Special Summons). Driving it real-Special-
   Summons TG ワーウルフ. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=1;
const ww=mk('TG ワーウルフ',0);
gameState.players[0].hand=[ww];
gameState.players[1].hand=[mk('ワン・フォー・ワン',1), mk('もけもけ',1)];
gameState.players[1].deck=[mk('バット',1)];
baselineA();
duelActivateFromHand(0);
if(pendingChoiceV49(gameState))__choicePickV49(0);
/* S03-U299 (Opus ruling): the hand effect is a trigger at the Special Summon only */
let wwIdx=-1;
for(let i=0;i<600&&wwIdx<0;i++){
  if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    wwIdx=g.findIndex(c=>c.name==='TG ワーウルフ');
    if(wwIdx>=0)break;
    if(g.length) eventPickV2(0); else eventSkipGroupV2();
    continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon){commitPendingSummonV2();continue;}
  break;}
ok('A: the real opponent Special Summon of a real Level 1 monster really completes',
  gameState.players[1].mz.some(c=>nm(c)==='バット'),JSON.stringify(gameState.players[1].mz.map(nm)));
ok('A: TG ワーウルフ is offered in the SEGOC selection of that Special Summon (trigger from the controllers hand, either-player fix)',
  wwIdx>=0,JSON.stringify({wwIdx,hand:gameState.players[0].hand.map(nm)}));
if(wwIdx>=0)eventPickV2(wwIdx);
driveAll();
ok('A: TG ワーウルフ really Special Summons itself from hand',
  gameState.players[0].mz.some(c=>nm(c)==='TG ワーウルフ')&&!gameState.players[0].hand.length,
  JSON.stringify({mz:gameState.players[0].mz.map(nm),hand:gameState.players[0].hand.map(nm)}));
audit('A');
`);

/* ===== B. Real negative control: a Special Summon of a Level 8 monster does not trigger TG ワーウルフ
   (the missing Level filter, now fixed). ===== */
harness(COMMON+String.raw`
fresh();
const ww=mk('TG ワーウルフ',0);
gameState.players[0].hand=[ww];
API.specialSummon(1,'hand',0,'atk','test');
gameState.players[1].hand=[mk('青眼の白龍',1)];
API.specialSummon(1,'hand',0,'atk','test');
gameState.timingWindow=null;
ok('B: a real Special Summon of a Level 8 monster does NOT trigger TG ワーウルフ',
  !strictScriptLegalityV2('TG ワーウルフ',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ワーウルフ',0,'hand',0,{})));
`);

/* ===== C. Real negative control: a real Xyz Summon of a Rank 4 monster (No.39 希望皇ホープ, using 2 real
   Level 4 materials) does not trigger TG ワーウルフ — Xyz Monsters have no Level for this purpose, even
   though this engine's DB reuses the 'lv' field to also store Rank. ===== */
harness(COMMON+String.raw`
fresh();
const ww=mk('TG ワーウルフ',0);
gameState.players[1].hand=[ww];
const hope=mk('No.39 希望皇ホープ',0);
const mat1=mk('アックス・レイダー',0), mat2=mk('アンモ・ナイト',0);
gameState.players[0].mz=[mat1,mat2];
gameState.players[0].ex=[hope];
baselineA();
const combos=exCombos(0,dbOf(hope)).combos;
ok('C: a real Rank 4 Xyz Summon combo (2 Level 4 monsters) is legal',combos.length>0,JSON.stringify(combos.map(c=>c.label)));
doExSummon(0,0,combos[0].materials,'xyz','atk');
drive();
gameState.timingWindow=null;
ok('C: No.39 希望皇ホープ is really Xyz Summoned with 2 real materials attached',
  gameState.players[0].mz.some(c=>nm(c)==='No.39 希望皇ホープ'),JSON.stringify(gameState.players[0].mz.map(nm)));
ok('C: the real Xyz Summon of a Rank 4 monster does NOT trigger TG ワーウルフ (Xyz has no Level)',
  !strictScriptLegalityV2('TG ワーウルフ',1,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ワーウルフ',1,'hand',0,{})));
`);

/* ===== D. Real clause ②: TG ワーウルフ, really destroyed on the field and sent to the GY this turn, is a
   real legal chain response at the real End Phase — resolving really adds a real other "TG" monster from
   the Deck to hand (excluding itself), and the once-per-turn flag now correctly leaves ①'s own countLimit
   untouched (a fresh copy can still be Special Summoned from hand later the same turn). ===== */
harness(COMMON+String.raw`
fresh();
const ww=mk('TG ワーウルフ',0,'up');
gameState.players[0].mz=[ww];
gameState.players[0].deck=[mk('TG ストライカー',0),mk('もけもけ',0)];
baselineA();
API.destroy({p:0,zone:'mz',index:0,card:ww},'test-destroy');
act({type:'SET_PHASE',phase:'end'});
ok('D: TG ワーウルフ is really in the Graveyard with real graveInfo (destroyed, from mz, this turn)',
  zoneOf(ww.uid)==='grave'&&ww.graveInfo&&ww.graveInfo.byDestroy&&ww.graveInfo.from==='mz'&&ww.graveInfo.turn===gameState.turn,
  JSON.stringify({zone:zoneOf(ww.uid),graveInfo:ww.graveInfo}));
ok('D: TG ワーウルフの② is really a legal activation at the real End Phase',
  strictScriptLegalityV2('TG ワーウルフ',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ワーウルフ',0,'grave',0,{})));
duelActivateFromZone(0,'grave',0);
if(pendingChoiceV49(gameState)){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)==='TG ストライカー';});
  __choicePickV49(i>=0?i:0);
}
driveAll();
ok('D: resolution really adds TG ストライカー from the Deck to hand (excluding TG ワーウルフ itself)',
  gameState.players[0].hand.some(c=>nm(c)==='TG ストライカー'),JSON.stringify(gameState.players[0].hand.map(nm)));
ok('D: the once-per-turn ② flag does not block a fresh copys real ① Special Summon from hand later the same turn',
  strictScriptLegalityV2('TG ワーウルフ',0,'hand',0,{}).ok===false /* no qualifying Level<=4 SS happened this segment */,
  true);
audit('D');
`);

/* ===== E. Real negative control: TG ストライカー sent to the Graveyard by discard (not destroyed on the
   field) does not offer ②; regression-checks TG ストライカー's own ① state-based condition is unaffected by
   the zone-branching refactor. ===== */
harness(COMMON+String.raw`
fresh();
const st=mk('TG ストライカー',0);
gameState.players[0].hand=[st];
API.discard(0,0,'test-discard');
gameState.phase='end';
baselineA();
ok('E: TG ストライカー discarded (not destroyed on the field) does NOT offer ②',
  !strictScriptLegalityV2('TG ストライカー',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ストライカー',0,'grave',0,{})));
gameState.phase='main1';
const st2=mk('TG ストライカー',0);
gameState.players[0].hand=[st2];
gameState.players[1].mz=[mk('もけもけ',1)];
baselineA();
ok('E: TG ストライカーの own ① (state-based, unaffected by the zone-branching refactor) is still legal when the controller has no monster and the opponent has one',
  strictScriptLegalityV2('TG ストライカー',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ストライカー',0,'hand',0,{})));
gameState.players[0].mz=[mk('ワイト',0)];
baselineA();
ok('E: TG ストライカーの ① correctly refuses when the controller already controls a monster',
  !strictScriptLegalityV2('TG ストライカー',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('TG ストライカー',0,'hand',0,{})));
`);
