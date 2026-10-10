/* S03-U155: エネミーコントローラー (control change had no end — permanent), 異次元からの帰還 (End Phase banish was a reminder),
   封印の黄金櫃 (the banished card never returned — reminder only). Real DUEL path (activations, choices, phases and turns through
   the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function step(){
  if(pc()){pick();return true;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return true;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return true;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return true;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return true;}
  return false;}
function drive(){for(let i=0;i<800;i++){if(!step())return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function toStandby(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');}
function nextTurn(){toStandby();phase('main1');}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=0x5331a5e5;gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++){gameState.players[p].deck=[];for(let k=0;k<12;k++)gameState.players[p].deck.push(mk('ワイト',p));}}
`;

/* ===== A. エネミーコントローラー ===== */
harness(COMMON+String.raw`
fresh();
const wt=mk('ワイト',0,'up');gameState.players[0].mz=[wt];
const dm=mk('デーモンの召喚',1,'up'),fd=mk('ゴブリン突撃部隊',1,'down');fd.pos='def';gameState.players[1].mz=[dm,fd];
const ec=mk('エネミーコントローラー',0);gameState.players[0].hand=[ec];
baselineA();
PREFER=['no',uid(wt),uid(dm)];duelActivateFromHand(0);drive();PREFER=[];
ok('A: ワイト released (cost) and デーモンの召喚 comes under player I control',z(wt)==='grave'&&ctl(dm)===0,JSON.stringify({wt:z(wt),dm:ctl(dm)}));
phase('end');drive();
ok('A: at the End Phase the control returns to player II (it was permanent)',ctl(dm)===1,String(ctl(dm)));
audit('A');
`);

/* ===== B. 異次元からの帰還 ===== */
harness(COMMON+String.raw`
fresh();
const b1=mk('ワイト',0),b2=mk('ゴブリン突撃部隊',0);gameState.players[0].banish=[b1,b2];
const tr=mk('異次元からの帰還',0,'down');tr.setTurn=3;gameState.players[0].sz=[tr];
baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('B: half the LP paid, both banished monsters Special Summoned',gameState.players[0].lp===4000&&z(b1)==='mz'&&z(b2)==='mz',JSON.stringify({lp:gameState.players[0].lp,b1:z(b1),b2:z(b2)}));
phase('end');drive();
ok('B: at the End Phase they are banished again',z(b1)==='banish'&&z(b2)==='banish',JSON.stringify({b1:z(b1),b2:z(b2)}));
audit('B');
`);

/* ===== C. 封印の黄金櫃 ===== */
harness(COMMON+String.raw`
fresh();
const target=mk('サイクロン',0);gameState.players[0].deck.unshift(target);
const gs0=mk('封印の黄金櫃',0);gameState.players[0].hand=[gs0];
baselineA();
PREFER=[uid(target)];duelActivateFromHand(0);drive();PREFER=[];
ok('C: サイクロン chosen from the Deck and banished',z(target)==='banish');
nextTurn();toStandby();
ok('C: 1st own Standby Phase after activation (turn 7): still banished',gameState.turn===7&&gameState.phase==='standby'&&z(target)==='banish',JSON.stringify({t:gameState.turn,z:z(target)}));
phase('main1');nextTurn();toStandby();
ok('C: 2nd own Standby Phase (turn 9): added to the hand',gameState.turn===9&&z(target)==='hand',JSON.stringify({t:gameState.turn,z:z(target)}));
audit('C');
`);
