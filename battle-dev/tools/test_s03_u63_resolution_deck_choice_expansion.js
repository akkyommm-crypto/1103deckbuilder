/* S03-U63 resolution-time Deck choice expansion (continues S03-U58's explicitly-flagged "beyond the
   representative set" scope).
   Requirement: S03-U58 fixed the pattern where a non-targeting Deck search/mill/Special-Summon choice was
   made at ACTIVATION time (in selectTargets, observing a possibly-stale Deck snapshot) instead of at
   RESOLUTION time (the rules-correct timing for a non-targeting effect, and SaveLoad/Replay-safe via the
   registered P1 ChoiceRequest pattern) for 4 representative cards. Audited script_coverage for the same
   shape (a legacy CARD_SCRIPTS entry whose selectTargets pulls candidates from the 'deck' pile for a
   non-targeting effect, sc.targets falsy) and found 21 more matches; fixed the 7 that are reachable in the
   1103_MAJOR_DECKS_v1 fixed lists: クリッター, E・HERO エアーマン, ローンファイア・ブロッサム,
   神秘の代行者 アース, 創造の代行者 ヴィーナス, カラクリ商人 壱七七, カラクリ大将軍 無零怒. The remaining
   14 (not reachable from a fixed-list deck) are left for a later, similarly-scoped unit if a real-duel
   measurement surfaces one (see docs/S03_U63_REPORT.md).
   Reused U58's own generic registered handlers (s03u58.deck-search / s03u58.deck-mill / s03u58.deck-special)
   wherever the pattern matched exactly; wrote one small dedicated handler (s03u63.venus-summon-sphere) for
   創造の代行者 ヴィーナス, whose candidates span both Deck and Hand (U58's deck-* handlers are Deck-only). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
function fresh(){
  resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';
}
function drive(){
  for(let i=0;i<600;i++){
    if(pendingChoiceV49(gameState)) return 'choice';
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
      const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
      if(g.length) eventPickV2(0); else eventSkipGroupV2();
      continue;
    }
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    return 'idle';
  }
  return 'loop';
}
function pickUid(uid){
  const q=pendingChoiceV49(gameState);
  if(!q) return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);
  if(i<0) return false;
  __choicePickV49(i);
  return true;
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
`;

/* ===== A. クリッター: real activation from GY, resolution-time search choice, then a real SaveLoad
   round-trip mid-choice confirming it survives (same class of fix as S03-U62/U58). ===== */
const first=harness(COMMON+String.raw`
/* S03-U156: クリッター is a trigger (「このカードがフィールド上から墓地へ送られた時」), not an effect activated from the GY at will:
   it is destroyed by an attack and the trigger goes through the regular event → chain → resolution path (engine/1ZT). */
fresh();
const crit=mk('クリッター',0,'up');
gameState.players[0].mz=[crit];gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
gameState.players[0].deck=[mk('ワイト',0),mk('E・HERO エアーマン',0)];
gameState.activePlayer=1;gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});
drive();
ok('A setup: クリッター opens a resolution-time search choice (registry resume, not activation-time)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
saveDuel();
globalThis.__RAW=localStorage.getItem(DUEL_SAVE_KEY);
`);
if(first.__RAW){
  harness('const RAW='+JSON.stringify(first.__RAW)+';'+COMMON+String.raw`
  fresh();localStorage.setItem(DUEL_SAVE_KEY,RAW);
  const resumed=offerResumeDuel();
  ok('A: the save/load restores the resolution-time choice',resumed&&!!pendingChoiceV49(gameState));
  const targetUid=pendingChoiceV49(gameState).candidates[0].uid;
  pickUid(targetUid);
  drive();
  ok('A: after reload, the search completes for real',gameState.players[0].hand.some(c=>c.uid===targetUid));
  audit('A resumed クリッター completes correctly');
  `);
}else{console.log('FAIL A: did not reach the save point');process.exitCode=2;}

/* ===== B. E・HERO エアーマン (major-deck card): the search branch, triggered via a real Special Summon so
   its own onSpecialSummon passive/condition fire for real; the mode confirm stays at activation, the
   specific search choice moves to resolution. ===== */
harness(COMMON+String.raw`
fresh();
const air=mk('E・HERO エアーマン',0);
gameState.players[0].hand=[air];
gameState.players[0].deck=[mk('E・HERO ネオス',0)];
baselineA();
API.specialSummon(0,'hand',0,'atk','test special summon');
flushDeferredEventsThroughProcessorV27();
drive();
ok('B setup: yes/no mode confirm opens first (still activation-time, unaffected by this unit)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).kind==='yesno');
__choicePickV49(0);
drive();
ok('B: the search choice opens at resolution (registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('B: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='E・HERO ネオス'));
audit('B airman search branch');
`);

/* ===== C. ローンファイア・ブロッサム (major-deck card): release stays activation-time (a real cost), the
   Special Summon target moves to resolution. ===== */
harness(COMMON+String.raw`
fresh();
const lf=mk('ローンファイア・ブロッサム',0);
const plant=mk('きのこマン',0);
gameState.players[0].mz=[lf,plant];
gameState.players[0].deck=[mk('ダンディライオン',0)];
baselineA();
duelActivateFromZone(0,'mz',0);
drive();
pickUid(plant.uid);
drive();
ok('C: the Special Summon target choice opens at resolution (registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('C: the release and Special Summon both happened for real',
  zoneOf(plant)==='grave'&&gameState.players[0].mz.some(c=>nm(c)==='ダンディライオン'));
audit('C lonefire blossom full cycle');
`);

/* ===== D/E/F/G. 神秘の代行者 アース, 創造の代行者 ヴィーナス, カラクリ商人 壱七七,
   カラクリ大将軍 無零怒 (all major-deck cards): each opens its resolution-time choice with a registry
   resume and completes the search/special-summon for real. ===== */
harness(COMMON+String.raw`
fresh();
const earth=mk('神秘の代行者 アース',0);
gameState.players[0].hand=[earth];
gameState.players[0].deck=[mk('裁きの代行者 サターン',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
ok('D: アース opens a resolution-time search choice (registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('D: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='裁きの代行者 サターン'));
audit('D earth full cycle');
`);
harness(COMMON+String.raw`
fresh();
const venus=mk('創造の代行者 ヴィーナス',0);
gameState.players[0].hand=[venus];
gameState.players[0].deck=[mk('神聖なる球体',0)];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromHand(0);
drive();
ok('E: ヴィーナス opens a resolution-time special-summon choice (registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('E: the Special Summon completes for real (from Deck)',
  gameState.players[0].mz.some(c=>nm(c)==='神聖なる球体'),
  JSON.stringify({mz:gameState.players[0].mz.map(nm)}));
audit('E venus special summon from deck');
`);
harness(COMMON+String.raw`
fresh();
const merch=mk('カラクリ商人 壱七七',0);
gameState.players[0].hand=[merch];
gameState.players[0].deck=[mk('カラクリ兵 弐参六',0)];
baselineA();
doNormalSummon(0,'atk');
flushDeferredEventsThroughProcessorV27();
drive();
ok('F: カラクリ商人 opens a resolution-time search choice (registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('F: the search completes for real',gameState.players[0].hand.some(c=>nm(c)==='カラクリ兵 弐参六'));
audit('F karakuri merchant full cycle');
`);
harness(COMMON+String.raw`
fresh();
const bureido=mk('カラクリ大将軍 無零怒',0);
gameState.players[0].hand=[bureido];
gameState.players[0].deck=[mk('カラクリ兵 弐参六',0)];
baselineA();
API.specialSummon(0,'hand',0,'def','test synchro summon');
/* 無零怒's own trigger requires ev.kind==='synchro'; API.specialSummon doesn't classify a summon kind, so
   drive its real condition()/resolve() directly against a synthetic onSpecialSummon(kind:'synchro') event —
   still the card's actual scripted functions, not a mock of this unit's own resolution-choice fix. */
const bh=findCardByUid(bureido.uid);
const sc=CARD_SCRIPTS['カラクリ大将軍 無零怒'];
const ctx=makeContext(0,bh.card,'mz',bh.index,'onSpecialSummon',{event:{card:bh.card,kind:'synchro'}});
if(sc.condition(ctx)) sc.resolve(ctx);
drive();
ok('G: 無零怒 opens a resolution-time special-summon choice (registry resume)',
  pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume.mode==='registry',
  JSON.stringify(pendingChoiceV49(gameState)&&pendingChoiceV49(gameState).resume));
__choicePickV49(0);
drive();
ok('G: the Special Summon completes for real',
  gameState.players[0].mz.some(c=>nm(c)==='カラクリ兵 弐参六'));
audit('G bureido full cycle');
`);
