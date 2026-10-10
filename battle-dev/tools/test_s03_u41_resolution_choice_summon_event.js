/* S03-U41 C-S03-33 RESOLUTION_CHOICE_SUMMON_EVENT — a Special Summon chosen during resolution gets its summon timing in DUEL.
   Found by R1 widening (the provisional Dragunity / レダメ list vs 1103兎ラギア, seed 0x52310024, 兎ラギア first, turn 6):
   レッドアイズ・ダークネスメタルドラゴン's effect Special Summoned ドラグニティ－ブラックスピア through a resolution-time choice,
   but the processor had already ended the chain and drained events before the answer. The onSpecialSummon event stayed queued until a later
   turn, and the stale summon window refused ブラックスピア's ignition effect for the rest of Main Phase 1.
   2011 sources: yugioh-wiki 「起動効果」 age 82 (2011-05-23), 「優先権」 age 69 (2011-07-28): after a summon / Special Summon both players
   pass priority first; after that, ignition effects can be activated.
   Cards named here: レッドアイズ・ダークネスメタルドラゴン, ドラグニティ－ブラックスピア, ドラグニティ－ミリトゥム (TESTED). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function idxOf(c){const x=findCardByUid(c.uid);return x?x.index:-1;}
function journalTypes(){return (v41ReplayPackage(gameState).actions||[]).map(e=>(e.action||{}).type);}
function step(){
  const w=gameState.processorWaiting;
  if(pendingChoiceV49(gameState)) return 'choice';
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chainPass';}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'pointPass';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return 'idle';
}
function drive(){for(let i=0;i<200;i++){const r=step();if(r==='idle'||r==='choice')return r;}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}

/* board: player 0 Main Phase 1 with レッドアイズ・ダークネスメタルドラゴン face-up, ドラグニティ－ブラックスピア in hand,
   ドラグニティ－ミリトゥム in the GY (a Level 4 or lower Winged Beast for ブラックスピア's effect) */
resetA();
const redmd=mk('レッドアイズ・ダークネスメタルドラゴン',0);gameState.players[0].mz=[redmd];
const spear=mk('ドラグニティ－ブラックスピア',0);gameState.players[0].hand=[spear];
const mili=mk('ドラグニティ－ミリトゥム',0);gameState.players[0].grave=[mili];
baselineA();
ok('setup: the effect of レッドアイズ・ダークネスメタルドラゴン is legal',strictScriptLegalityV2('レッドアイズ・ダークネスメタルドラゴン',0,'mz',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('レッドアイズ・ダークネスメタルドラゴン',0,'mz',0,{})));

duelActivateFromZone(0,'mz',0);
const r1=drive();
const q=pendingChoiceV49(gameState);
ok('A: the resolution-time choice opens',r1==='choice'&&!!q&&/特殊召喚するドラゴン族/.test(String(q&&q.title||'')),JSON.stringify({r1,title:q&&q.title}));
const typesAtChoice=journalTypes();
const openAt=typesAtChoice.lastIndexOf('CHOICE_OPEN_V49');
ok('A: while the choice is open the processor waits on the chain resolution (nothing after the choice is processed yet)',
  gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='SOLVE_CHAIN'&&openAt>=0&&typesAtChoice.slice(openAt+1).length===0,
  JSON.stringify({paused:gameState.processorPaused,waiting:gameState.processorWaiting&&gameState.processorWaiting.type,after:typesAtChoice.slice(openAt+1)}));

const qi=q?q.candidates.findIndex(c=>c.uid===spear.uid):-1;
if(qi>=0) __choicePickV49(qi);
const r2=drive();
const types=journalTypes();
const ssAt=types.lastIndexOf('FX_SPECIAL_SUMMON'), queueAt=types.indexOf('EVENT_QUEUE_V31',ssAt), deqAt=types.indexOf('EVENT_DEQUEUE_V31',queueAt);
ok('B: ドラグニティ－ブラックスピア is Special Summoned',zoneOf(spear)==='mz',JSON.stringify({zone:zoneOf(spear)}));
ok('B: its summon event is processed right away (queued, then dequeued before the game returns to the open state)',
  r2==='idle'&&ssAt>=0&&queueAt>ssAt&&deqAt>queueAt&&!(gameState.deferredEvents||[]).length,
  JSON.stringify({r2,tail:types.slice(ssAt),deferred:(gameState.deferredEvents||[]).map(e=>e.eventName)}));
ok('B: the summon window closes after both players pass',gameState.timingWindow==null,JSON.stringify(gameState.timingWindow));
const L=strictScriptLegalityV2('ドラグニティ－ブラックスピア',0,'mz',idxOf(spear),{});
ok('C: in the open Main Phase the ignition effect of ドラグニティ－ブラックスピア is legal',L.ok,JSON.stringify(L));
audit('B/C');

/* ===== D. saved while the resolution-time choice is open, then resumed: the chain continues after the answer ===== */
resetA();
{
  const redmd2=mk('レッドアイズ・ダークネスメタルドラゴン',0);gameState.players[0].mz=[redmd2];
  const spear2=mk('ドラグニティ－ブラックスピア',0);gameState.players[0].hand=[spear2];
  const mili2=mk('ドラグニティ－ミリトゥム',0);gameState.players[0].grave=[mili2];
  baselineA();
  duelActivateFromZone(0,'mz',0);
  const rD=drive();
  ok('D: setup — the resolution-time choice is open and the processor waits',rD==='choice'&&gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='SOLVE_CHAIN',
    JSON.stringify({rD,waiting:gameState.processorWaiting&&gameState.processorWaiting.type}));
  saveDuel();globalThis.__RAWD=localStorage.getItem(DUEL_SAVE_KEY);globalThis.__SPEAR2=spear2.uid;
}
resetA();localStorage.setItem(DUEL_SAVE_KEY,globalThis.__RAWD);
const resumedD=offerResumeDuel();
const qD=pendingChoiceV49(gameState);
ok('D: the save resumes with the choice still open and the chain continuation waiting',resumedD&&!!qD&&gameState.processorPaused&&gameState.processorWaiting&&gameState.processorWaiting.type==='SOLVE_CHAIN',
  JSON.stringify({resumedD,choice:!!qD,paused:gameState.processorPaused,waiting:gameState.processorWaiting&&gameState.processorWaiting.type,queue:(gameState.processorQueue||[]).map(u=>u.type)}));
const qDi=qD?qD.candidates.findIndex(c=>c.uid===globalThis.__SPEAR2):-1;
if(qDi>=0) __choicePickV49(qDi);
const rD2=drive();
const spearD=findCardByUid(globalThis.__SPEAR2);
ok('D: after the answer ドラグニティ－ブラックスピア is summoned, its event is processed and the summon window is closed',
  rD2==='idle'&&spearD&&spearD.zone==='mz'&&!(gameState.deferredEvents||[]).length&&gameState.timingWindow==null&&!gameState.chain.length,
  JSON.stringify({rD2,zone:spearD&&spearD.zone,deferred:(gameState.deferredEvents||[]).map(e=>e.eventName),tw:gameState.timingWindow,chain:gameState.chain.length}));
ok('D: the ignition effect of ドラグニティ－ブラックスピア is legal after the resumed answer',
  !!spearD&&strictScriptLegalityV2('ドラグニティ－ブラックスピア',0,'mz',spearD.index,{}).ok,
  JSON.stringify(spearD?strictScriptLegalityV2('ドラグニティ－ブラックスピア',0,'mz',spearD.index,{}):null));
audit('D');
`);
