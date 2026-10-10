/* S03-U44 per-effect forced triggers in DUEL SEGOC.
   Found while implementing S03-U43: a v4 unified card that declares forced:true on one effect (and not on the whole script) had that
   trigger offered as optional — it could be skipped and was ranked as an optional trigger — because the SEGOC grouping read only the
   script-level sc.forced. 28 unified cards use effect-level forced:true.
   Cards named here: チュウボーン, ドラグニティ－アキュリス, ドラグニティ－ファランクス, サイクロン (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
const SEEN=[];
function step(){
  const w=gameState.processorWaiting;
  const q=pendingChoiceV49(gameState);
  if(q){const want=globalThis.__PICK;const i=want?q.candidates.findIndex(c=>want.includes(c.uid)):-1;__choicePickV49(i>=0?i:0);return 'choice';}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE, g=st.groups[st.rank]||[];
    SEEN.push({eventName:st.eventName,rank:st.rank,names:g.map(c=>c.name),forced:g.map(c=>!!c.forced),events:g.map(c=>c.eventName||st.eventName)});
    if(g.length&&globalThis.__ACCEPT)eventPickV2(0);else eventSkipGroupV2();
    return 'evt';
  }
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chainPass';}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'pointPass';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summonCommit';}
  return 'idle';
}
function drive(){for(let i=0;i<400;i++){if(step()==='idle')return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}

/* ===== A. チュウボーン (effect-level forced:true): its Flip Summon trigger is a forced trigger and cannot be skipped ===== */
resetA();
const chu=mk('チュウボーン',0,'down','def');chu.setTurn=gameState.turn-1;gameState.players[0].mz=[chu];
baselineA();
SEEN.length=0;globalThis.__ACCEPT=false;
doFlipUp(0,'mz',0,'atk');
/* drive until the trigger group appears, try to skip it once, then accept */
let sawForced=null, skipped=false;
for(let i=0;i<200;i++){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.some(c=>c.name==='チュウボーン')){
      sawForced={rank:st.rank,forced:g.find(c=>c.name==='チュウボーン').forced};
      const before=st.rank; eventSkipGroupV2(); skipped=!!EVT_V2_STATE&&EVT_V2_STATE.rank!==before||!EVT_V2_STATE;
      break;
    }
  }
  if(step()==='idle')break;
}
ok('A: the チュウボーン trigger is grouped as the turn player\'s forced trigger (rank 0, forced)',!!sawForced&&sawForced.rank===0&&sawForced.forced===true,JSON.stringify(sawForced));
ok('A: the forced group cannot be skipped',skipped===false,JSON.stringify({skipped,rank:EVT_V2_STATE&&EVT_V2_STATE.rank}));
globalThis.__ACCEPT=true;
const rA=drive();
ok('A: after accepting, the opponent receives 3 チュウボーンJr.トークン',rA==='idle'&&gameState.players[1].mz.filter(c=>cardName(c)==='チュウボーンJr.トークン').length===3,
  JSON.stringify({rA,foe:gameState.players[1].mz.map(cardName)}));
audit('A');

/* ===== B. ドラグニティ－アキュリス: the optional summon trigger stays optional; the destroy trigger is forced ===== */
resetA();
const aklys=mk('ドラグニティ－アキュリス',0), phal=mk('ドラグニティ－ファランクス',0);
gameState.players[0].hand=[aklys,phal];
const wight=mk('ワイト',1);gameState.players[1].mz=[wight];
baselineA();
SEEN.length=0;globalThis.__ACCEPT=true;globalThis.__PICK=[phal.uid];
doNormalSummon(0,'atk');
drive();
const summonGroup=SEEN.find(x=>x.names.includes('ドラグニティ－アキュリス')&&x.eventName==='onNormalSummon');
ok('B: the summon trigger of ドラグニティ－アキュリス stays optional (rank 2, not forced)',!!summonGroup&&summonGroup.rank===2&&summonGroup.forced[summonGroup.names.indexOf('ドラグニティ－アキュリス')]===false,JSON.stringify(summonGroup||SEEN));
ok('B: setup — ドラグニティ－アキュリス is equipped to ドラグニティ－ファランクス',zoneOf(aklys)==='sz'&&aklys.v46MonsterEquip===true,JSON.stringify({aklys:zoneOf(aklys),phal:zoneOf(phal)}));
{
  const cyc=mk('サイクロン',1,'down');cyc.setTurn=gameState.turn-1;gameState.players[1].sz=[cyc];
  gameState.activePlayer=1;gameState.phase='main1';
  baselineA();
  SEEN.length=0;globalThis.__ACCEPT=true;globalThis.__PICK=[aklys.uid,wight.uid];
  duelActivateFromZone(1,'sz',0);
  const rB=drive();
  /* S03-U156: サイクロン and the equipped アキュリス leave the field together — their leave-field events are one simultaneous batch
     (engine/30 leaveBatchRunS03); the candidate still carries its own event (onLeaveField). */
  const destroyGroup=SEEN.find(x=>x.names.includes('ドラグニティ－アキュリス')&&x.events[x.names.indexOf('ドラグニティ－アキュリス')]==='onLeaveField');
  /* player 0 is the non-turn player here, so a forced trigger is rank 1 */
  ok('B: the destroy trigger of the sent equip is grouped as a forced trigger (rank 1 for the non-turn player)',!!destroyGroup&&destroyGroup.rank===1&&destroyGroup.forced[destroyGroup.names.indexOf('ドラグニティ－アキュリス')]===true,JSON.stringify(destroyGroup||SEEN));
  ok('B: the destroy resolves (ワイト destroyed)',rB==='idle'&&zoneOf(wight)==='grave',JSON.stringify({rB,wight:zoneOf(wight)}));
  audit('B');
}
`);
