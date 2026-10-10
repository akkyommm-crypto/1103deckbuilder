/* S03-U74: ワーム・ゼクス (Worm Xex) — continues U72/U73's priority #7 pass over the fixed lists'
   remaining PARTIAL AUTO_DECK_TABLE cards.
   Real text (Yugipedia, within cutoff): "When this card is Normal Summoned, you can send 1 Reptile-type
   'Worm' monster from your Deck to the Graveyard. If you control a face-up 'Worm Yagan', this card cannot
   be destroyed by battle." The pre-existing AUTO_DECK_TABLE entry had three real gaps: its filter's `group`
   field was dead metadata (never consumed by autoDeckMatches, so it would have allowed milling ANY
   Reptile-type monster, not just named "Worm" ones); `trig:"summon"` unconditionally wires both Normal AND
   Special Summon, but the real text is Normal-Summon-only; and the table cannot express the continuous
   battle-proof-while-a-named-card-is-present clause at all. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function isRegistry(){return pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume&&pendingChoiceV49(gameState).resume.mode==='registry';}
function graveNames(){return gameState.players[0].grave.map(c=>cardName(c));}
`;

/* ===== A. real Normal Summon, deck has a real Worm Reptile (ワームドレイク) AND a real non-Worm Reptile
   (くちばしヘビ): confirms the mill choice offered is really filtered to just the Worm one (the actual
   fix for the table's dead `group` field), and the mill really happens. ===== */
harness(COMMON+String.raw`
fresh();
const xex=mk('ワーム・ゼクス',0);
gameState.players[0].hand=[xex];
gameState.players[0].deck=[mk('ワームドレイク',0),mk('くちばしヘビ',0),mk('青眼の白龍',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
let st=drive();
ok('A: a real resolution-time mill choice opens (registry resume), correctly excluding the non-Worm Reptile',
  isRegistry()&&pendingChoiceV49(gameState).candidates.length===1
  &&pendingChoiceV49(gameState).candidates[0].label==='ワームドレイク',
  JSON.stringify(pendingChoiceV49(gameState)&&{resume:pendingChoiceV49(gameState).resume,candidates:pendingChoiceV49(gameState).candidates.map(c=>c.label)}));
if(st==='choice'){ __choicePickV49(0); drive(); }
audit('A ワーム・ゼクス Normal Summon mill');
ok('A: ワームドレイク is really sent to the Graveyard, くちばしヘビ stays in Deck',
  graveNames().includes('ワームドレイク')&&gameState.players[0].deck.some(c=>cardName(c)==='くちばしヘビ'),
  JSON.stringify({grave:graveNames(),deck:gameState.players[0].deck.map(c=>cardName(c))}));
`);

/* ===== B. real Special Summon: the mill is NOT offered (real text is Normal-Summon-only; the table's own
   trig:"summon" incorrectly wired both). ===== */
harness(COMMON+String.raw`
fresh();
const xex2=mk('ワーム・ゼクス',0);
gameState.players[0].hand=[xex2];
gameState.players[0].deck=[mk('ワームドレイク',0)];
baselineA();
act({type:'FX_SPECIAL_SUMMON',player:0,from:'hand',fromIndex:0,pos:'atk',reason:'テスト特殊召喚'});
queueSpecialSummonSuccessV2(0,xex2,'effect');
flushDeferredEventsThroughProcessorV27();
drive();
audit('B ワーム・ゼクス Special Summon (no mill)');
ok('B: a real Special Summon does NOT offer the mill (Normal-Summon-only, matching the real text)',
  !graveNames().includes('ワームドレイク')&&gameState.players[0].deck.some(c=>cardName(c)==='ワームドレイク'),
  JSON.stringify({grave:graveNames(),deck:gameState.players[0].deck.map(c=>cardName(c))}));
`);

/* ===== C. battleProof: real face-up ワーム・ヤガン present -> battleProof(card) is true; absent -> false.
   Checked via the real, production battleProof() function (engine/00_state_actions.js), the same one battle
   damage calculation consults for real. ===== */
harness(COMMON+String.raw`
fresh();
const xex3=mk('ワーム・ゼクス',0);
const yagan=mk('ワーム・ヤガン',0);
gameState.players[0].mz=[xex3,yagan];
baselineA();
ok('C: with a real face-up ワーム・ヤガン on the field, battleProof(ワーム・ゼクス) is really true',
  battleProof(xex3)===true);
gameState.players[0].mz=[xex3];
ok('C: without ワーム・ヤガン, battleProof(ワーム・ゼクス) is really false',
  battleProof(xex3)===false);
`);

/* ===== D. real, shared engine fix (engine/00_state_actions.js, battleProof()): found while building this
   card's own continuous.battleProof(card) clause. Any card whose own script declares continuous.battleProof
   as a FUNCTION (a conditional battle-proof clause) had its answer overridden by a cruder fallback once
   battleProofGrantedV15 ever returned false for it: battleProof() fell through past the dynamic check to a
   per-CARD-NAME cache populated by a blind regex match against the card's raw OCG text
   (/戦闘では破壊されない/.test(...)). Since a conditional clause's own OCG text always contains that phrase
   unconditionally (as part of describing the condition), the very first time the condition was ever
   satisfied, the cache permanently poisoned that card NAME to "always battle-proof" — even after the
   condition later stopped holding. This silently affected TWO already-implemented cards, one already
   published (カラクリ守衛 参壱参, S03-U71 — battle-proof only while in Attack Position) and this unit's own
   ワーム・ゼクス (battle-proof only while a face-up ワーム・ヤガン is controlled): both would have incorrectly
   stayed "cannot be destroyed by battle" forever, in any real duel, the instant their condition was ever true
   even once. Fixed generically: a card whose own script declares a dynamic continuous.battleProof now trusts
   that answer as final and never falls through to the cache/text-inference layers, regardless of card name or
   which specific card triggered the discovery. ===== */
harness(COMMON+String.raw`
fresh();
const saizan=mk('カラクリ守衛 参壱参',0);
gameState.players[0].mz=[saizan];
baselineA();
saizan.pos='atk';
const atkTrue=battleProof(saizan);
saizan.pos='def';
const defFalse=battleProof(saizan);
ok('D regression (shared battleProof() fix): カラクリ守衛 参壱参 (already-published S03-U71 card) is no longer permanently poisoned to battle-proof after ever being true once — ATK true, DEF really false',
  atkTrue===true&&defFalse===false,JSON.stringify({atkTrue,defFalse}));
`);

