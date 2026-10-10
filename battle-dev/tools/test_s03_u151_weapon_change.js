/* S03-U151: ウェポンチェンジ — the ATK/DEF swap lasts until the end of the opponent's next End Phase and ends when this card is
   destroyed. Before: until:'endTurn' (ended with its own turn) and no link to this card. Real DUEL path (activation, phases and
   turns through the processor), Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));return pkg;}
function uid(c){return ensureCardUid(gameState,c);}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.value===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function stats(c){const h=findCardByUid(c.uid);return h?curATK(h.card)+'/'+curDEF(h.card):null;}
/* player I's Standby Phase of turn 5: a face-up ウェポンチェンジ and ゴブリン突撃部隊 (Warrior 2300 / 0) */
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='standby';
  const wc=mk('ウェポンチェンジ',0,'up');gameState.players[0].sz=[wc];
  const gob=mk('ゴブリン突撃部隊',0,'up');gameState.players[0].mz=[gob];
  for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];
  return {wc,gob};}
`;

harness(COMMON+String.raw`
const s=fresh();
baselineA();
duelActivateFromZone(0,'sz',0);PREFER=[uid(s.gob)];drive();PREFER=[];
ok('A: activated in its own Standby Phase: 700 paid, ゴブリン突撃部隊 2300/0 → 0/2300',gameState.players[0].lp===7300&&stats(s.gob)==='0/2300',
  JSON.stringify({lp:gameState.players[0].lp,st:stats(s.gob)}));
phase('main1');nextTurn();
ok('A: during the opponent next turn it is still swapped',gameState.turn===6&&gameState.activePlayer===1&&stats(s.gob)==='0/2300',JSON.stringify({t:gameState.turn,st:stats(s.gob)}));
nextTurn();
ok('A: after the opponent End Phase (turn 7) it is back to 2300/0',gameState.turn===7&&stats(s.gob)==='2300/0',JSON.stringify({t:gameState.turn,st:stats(s.gob)}));
audit('A');
`);

/* destroyed → the swap ends at once */
harness(COMMON+String.raw`
const s=fresh();const cy=mk('サイクロン',0);gameState.players[0].hand=[cy];
baselineA();
duelActivateFromZone(0,'sz',0);PREFER=[uid(s.gob)];drive();PREFER=[];
ok('B: swapped (0/2300)',stats(s.gob)==='0/2300');
phase('main1');
duelActivateFromHand(0);PREFER=[uid(s.wc)];drive();PREFER=[];
ok('B: ウェポンチェンジ destroyed by サイクロン → the swap ends at once (2300/0)',z(s.wc)==='grave'&&stats(s.gob)==='2300/0',JSON.stringify({wc:z(s.wc),st:stats(s.gob)}));
audit('B');
`);
