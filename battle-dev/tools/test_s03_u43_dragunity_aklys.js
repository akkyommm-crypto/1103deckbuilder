/* S03-U43 ドラグニティ－アキュリス on the DUEL path (found by R1-v1 on Astra's fixed lists: Normal Summoned 28 times with no effect).
   2011 text and yugioh-wiki age 85 (2011-08-21) rulings: optional summon trigger → Special Summon a Dragunity from the hand, then equip;
   forced targeted destroy when the equipped card is sent to the GY; no activation when the equipped monster left the field first.
   Cards named here: ドラグニティ－アキュリス (declared NOT_STARTED → TESTED by this unit); ドラグニティ－ファランクス, サイクロン, 強制脱出装置 (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function step(){
  const w=gameState.processorWaiting;
  const q=pendingChoiceV49(gameState);
  if(q){const want=globalThis.__PICK;const i=want?q.candidates.findIndex(c=>want.includes(c.uid)):-1;__choicePickV49(i>=0?i:0);return 'choice';}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length&&globalThis.__ACCEPT_TRIGGERS)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chainPass';}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'pointPass';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summonCommit';}
  return 'idle';
}
function drive(){for(let i=0;i<400;i++){if(step()==='idle')return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function board(){
  resetA();
  const aklys=mk('ドラグニティ－アキュリス',0), phal=mk('ドラグニティ－ファランクス',0);
  gameState.players[0].hand=[aklys,phal];
  const wight=mk('ワイト',1);gameState.players[1].mz=[wight];
  baselineA();
  return {aklys,phal,wight};
}
function normalSummonAklys(B){
  globalThis.__ACCEPT_TRIGGERS=true; globalThis.__PICK=[B.phal.uid];
  const idx=gameState.players[0].hand.indexOf(B.aklys);
  doNormalSummon(idx,'atk');
  const r=drive();
  globalThis.__PICK=null;
  return r;
}

/* ===== A. Normal Summon → Special Summon a Dragunity from the hand → equip ===== */
let B=board();
const rA=normalSummonAklys(B);
ok('A: ドラグニティ－ファランクス is Special Summoned from the hand',rA==='idle'&&zoneOf(B.phal)==='mz',JSON.stringify({rA,phal:zoneOf(B.phal)}));
ok('A: ドラグニティ－アキュリス is equipped to it as an Equip Card',zoneOf(B.aklys)==='sz'&&B.aklys.v46MonsterEquip===true&&!!B.aklys.equipTo&&B.aklys.equipTo.uid===B.phal.uid,
  JSON.stringify({zone:zoneOf(B.aklys),eq:B.aklys.v46MonsterEquip,to:B.aklys.equipTo}));
audit('A');

/* ===== B. the equipped copy destroyed by the opponent's サイクロン → forced targeted destroy of a field card ===== */
{
  const cyc=mk('サイクロン',1,'down');cyc.setTurn=gameState.turn-1;gameState.players[1].sz=[cyc];
  gameState.activePlayer=1;gameState.phase='main1';
  baselineA();
  globalThis.__ACCEPT_TRIGGERS=true; globalThis.__PICK=[B.aklys.uid,B.wight.uid];
  duelActivateFromZone(1,'sz',0);
  const rB=drive();
  globalThis.__PICK=null;
  ok('B: サイクロン destroyed the equipped ドラグニティ－アキュリス',zoneOf(B.aklys)==='grave',JSON.stringify({rB,aklys:zoneOf(B.aklys)}));
  ok('B: its effect destroyed the targeted ワイト',rB==='idle'&&zoneOf(B.wight)==='grave',JSON.stringify({rB,wight:zoneOf(B.wight),toasts:TOASTS.slice(-3)}));
  audit('B');
}

/* ===== C. the equipped monster leaves first (bounced by 強制脱出装置): the equip goes to the GY by rule; no destroy ===== */
B=board();
normalSummonAklys(B);
{
  const bounce=mk('強制脱出装置',1,'down');bounce.setTurn=gameState.turn-1;gameState.players[1].sz=[bounce];
  gameState.activePlayer=1;gameState.phase='main1';
  baselineA();
  globalThis.__ACCEPT_TRIGGERS=true; globalThis.__PICK=[B.phal.uid];
  duelActivateFromZone(1,'sz',0);
  const rC=drive();
  globalThis.__PICK=null;
  ok('C: the equipped ドラグニティ－ファランクス returned to the hand and the equip went to the GY by rule',zoneOf(B.phal)==='hand'&&zoneOf(B.aklys)==='grave'&&(B.aklys.graveInfo||{}).rule==='equip',
    JSON.stringify({rC,phal:zoneOf(B.phal),aklys:zoneOf(B.aklys),gi:B.aklys.graveInfo}));
  ok('C: the destroy effect does not activate (ワイト survives)',rC==='idle'&&zoneOf(B.wight)==='mz',JSON.stringify({rC,wight:zoneOf(B.wight)}));
  audit('C');
}
`);
