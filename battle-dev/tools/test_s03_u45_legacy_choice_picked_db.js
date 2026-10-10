/* S03-U45 C-S03-36 LEGACY_CHOICE_PICKED_DB — legacy selectCard callbacks receive the card with its db in DUEL.
   Found by R1 on Astra's fixed lists (六武衆 vs 1103兎ラギア, R1_DECKS=six,rabbit): 10 of 12 responder duels stopped with
   EXCEPTION answerChoice "Cannot read properties of undefined (reading 'n')" as early as turn 1. 六武衆の荒行's target callback runs
   v340SixDeck(... x.db.n!==a.db.n ...), but in DUEL the legacy callback received the ChoiceRequest pick {key,label,value,p,zone,index,uid,card}
   with no db (outside DUEL the old picker passed {card, db}). The same unit also guards 諸刃の活人剣術 against a target that left the GY
   before resolution (seed 0x52310301; 2011 ruling 11/08/03: only the remaining target is Special Summoned).
   Cards named here: 六武衆の荒行, 真六武衆－キザン, 六武衆－ザンジ (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
const ERRORS=[];
function step(){
  const w=gameState.processorWaiting;
  const q=pendingChoiceV49(gameState);
  if(q){const want=globalThis.__PICK;const i=want?q.candidates.findIndex(c=>want.includes(c.uid)):-1;
    try{__choicePickV49(i>=0?i:0);}catch(e){ERRORS.push(String(e&&e.message));return 'error';}
    return 'choice';}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chainPass';}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'pointPass';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summonCommit';}
  return 'idle';
}
function drive(){for(let i=0;i<400;i++){const r=step();if(r==='idle'||r==='error')return r;}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}

/* ===== A. the resolved candidate carries db ===== */
resetA();
{
  const w=mk('ワイト',0);gameState.players[0].mz=[w];
  baselineA();
  const r=choiceResolveCandidateV49(gameState,{uid:w.uid});
  ok('A: a resolved choice candidate carries the card and its db (like pileCards results)',!!r&&r.card===w&&!!r.db&&r.db.n==='ワイト',JSON.stringify(r&&{zone:r.zone,hasDb:!!r.db,n:r.db&&r.db.n}));
}

/* ===== B. 六武衆の荒行 through its legacy target / summon choices in DUEL ===== */
resetA();
const kizan=mk('真六武衆－キザン',0);gameState.players[0].mz=[kizan];
const zanji=mk('六武衆－ザンジ',0,'down');gameState.players[0].deck=[zanji];
const trial=mk('六武衆の荒行',0);gameState.players[0].hand=[trial];
baselineA();
ok('B: setup — 六武衆の荒行 is legal (a 六武衆 with the same ATK and a different name is in the Deck)',strictScriptLegalityV2('六武衆の荒行',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('六武衆の荒行',0,'hand',0,{})));
globalThis.__PICK=[kizan.uid,zanji.uid];
let threw=null;
try{ duelActivateFromHand(0); }catch(e){ threw=String(e&&e.message); }
const rB=drive();
globalThis.__PICK=null;
ok('B: no exception while answering the legacy choices',threw===null&&ERRORS.length===0&&!gameState.systemFault,JSON.stringify({threw,ERRORS,fault:gameState.systemFault}));
ok('B: 六武衆－ザンジ is Special Summoned from the Deck',rB==='idle'&&zoneOf(zanji)==='mz',JSON.stringify({rB,zanji:zoneOf(zanji),kizan:zoneOf(kizan),toasts:TOASTS.slice(-3)}));
audit('B');

/* ===== C. two 六武衆の荒行 chained on the same target both chose the only matching Deck card: the upper link summons it,
   the lower link finds no matching card at resolution and summons nothing, with no resolution fault ===== */
resetA();
{
  const kizan2=mk('真六武衆－キザン',0);gameState.players[0].mz=[kizan2];
  const zanji2=mk('六武衆－ザンジ',0,'down');gameState.players[0].deck=[zanji2];
  const t1=mk('六武衆の荒行',0);gameState.players[0].hand=[t1];
  const t2=mk('六武衆の荒行',0,'down');t2.setTurn=gameState.turn-1;gameState.players[0].sz=[t2];
  baselineA();
  globalThis.__PICK=[kizan2.uid,zanji2.uid];
  let threwC=null;
  try{ duelActivateFromHand(0); }catch(e){ threwC=String(e&&e.message); }
  /* answer link 1's choices, then respond with the set 荒行 when player 0 gets priority in the chain window */
  let chained=false;
  for(let i=0;i<200;i++){
    if(!chained&&gameState.chainWindow&&gameState.chain.length===1&&gameState.chainWindow.priority===0&&!pendingChoiceV49(gameState)){
      const idx=gameState.players[0].sz.indexOf(t2);
      if(idx>=0){ try{ duelActivateResponseV2(0,'sz',idx); chained=true; continue; }catch(e){ threwC=String(e&&e.message); break; } }
    }
    const r=step(); if(r==='idle'||r==='error') break;
  }
  globalThis.__PICK=null;
  const actsC=(v41ReplayPackage(gameState).actions||[]).map(e=>e.action||{});
  const addsC=actsC.filter(a=>a.type==='CHAIN_ADD'&&a.name==='六武衆の荒行').length, resolvesC=actsC.filter(a=>a.type==='CHAIN_RESOLVE_TOP').length;
  ok('C: setup — the second 六武衆の荒行 was chained on the first and both links resolved (2 CHAIN_ADD, 2 CHAIN_RESOLVE_TOP)',chained===true&&addsC===2&&resolvesC===2,
    JSON.stringify({chained,addsC,resolvesC}));
  ok('C: no resolution fault or exception when the lower link\'s chosen Deck card is already gone',threwC===null&&ERRORS.length===0&&!gameState.systemFault,
    JSON.stringify({threwC,ERRORS,fault:gameState.systemFault}));
  ok('C: 六武衆－ザンジ was Special Summoned exactly once (by the upper link)',zoneOf(zanji2)==='mz'&&gameState.players[0].mz.filter(c=>cardName(c)==='六武衆－ザンジ').length===1,
    JSON.stringify({zanji:zoneOf(zanji2),mz:gameState.players[0].mz.map(cardName)}));
  audit('C');
}
`);
