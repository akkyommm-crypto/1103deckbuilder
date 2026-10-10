/* S03-U170: the Start Step of the Battle Phase (POINT kind 'battleStart' before the battle command) and 威嚇する咆哮 (「このターン相手は
   攻撃宣言をする事ができない」, a turn-stamped player flag read by cannotAttackNow). Before, the Battle Phase went straight to the
   battle command: the non-turn player had no chance to respond at its start. Real DUEL path (processor phases and turns). */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;}
/* SEEN: every choice shown {title, names, min, max, cancelable}; TRIG: every trigger group offered {names, forced}.
   PREFER: uids / keys to pick first; SKIP_OPTIONAL: decline optional trigger groups. */
let PREFER=[],SEEN=[],TRIG=[],SKIP_OPTIONAL=false;
function pick(){const q=pc();SEEN.push({title:q.title,names:q.candidates.map(x=>x.name||x.label||(x.uid!=null?nm(findCardByUid(x.uid)&&findCardByUid(x.uid).card):x.value)),min:q.min,max:q.max,cancelable:!!q.cancelable,kind:q.kind});
  let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function drive(){for(let i=0;i<600;i++){
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});}
    if(g.length&&!(SKIP_OPTIONAL&&st.rank>=2))eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toPoint(kind){for(let i=0;i<80;i++){
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused&&(w.payload||{}).kind===kind)return true;
  if(pc()){pick();continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function journal(t){return V41_ACTION_JOURNAL.filter(x=>x.action.type===t);}
function chains(name){return journal('CHAIN_ADD').filter(x=>x.action&&(x.action.name===name||(x.action.link&&x.action.link.name===name)));}
function evOffered(name){return TRIG.some(e=>e.names.indexOf(name)>=0);}
function evForced(name){const e=TRIG.find(e=>e.names.indexOf(name)>=0);return !!(e&&e.forced);}
function seenFor(name){return SEEN.filter(s=>s.title.indexOf(name)===0);}
function atk(p,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:0,target:t==null?0:t});}
`;

const HELP=String.raw`
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function nextTurn(){phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
  requestProcessorV27(PROCESSOR_V27.DRAW,{player:gameState.activePlayer});drive();phase('standby');phase('main1');}
function decks(){for(let p=0;p<2;p++) gameState.players[p].deck=[mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p),mk('ワイト',p)];}
function hitAt(p,atkCard,target){const ai=gameState.players[p].mz.indexOf(atkCard),ti=gameState.players[p===0?1:0].mz.indexOf(target);
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:ai,target:ti});drive();}
`;


harness(COMMON+HELP+String.raw`
/* A. in the opponent's Battle Phase Start Step, 威嚇する咆哮 → no attack this turn */
fresh();
for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:8},()=>mk('ワイト',p));
const roar=mk('威嚇する咆哮',0,'down');roar.setTurn=4;gameState.players[0].sz=[roar];gameState.players[0].mz=[mk('ワイト',0,'up','atk')];
const gob=mk('ゴブリン突撃部隊',1,'up');gameState.players[1].mz=[gob];
gameState.activePlayer=1;gameState.phase='main1';baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});
const at=toPoint('battleStart');
const offered=at&&(getChainResponsesV2(0)||[]).some(r=>r.db.n==='威嚇する咆哮');
ok('A: entering the Battle Phase stops at the Start Step; the defending player is offered 威嚇する咆哮',at&&offered&&gameState.phase==='battle',JSON.stringify({at,offered,ph:gameState.phase}));
if(offered)pointActivateV27(0,'sz',0);
drive();
ok('A: 威嚇する咆哮 resolved — player II cannot declare an attack this turn',z(roar)==='grave'&&!canDeclareAttackV48(findCardByUid(gob.uid).card),JSON.stringify({roar:z(roar)}));
const jl=V41_ACTION_JOURNAL.length;
atk(1,0);drive();
ok('A: an attack request is refused (no attack declared, no damage)',!V41_ACTION_JOURNAL.slice(jl).some(x=>x.action.type==='ATTACK_DECLARE_V48')&&gameState.players[0].lp===8000);
audit('A');
/* C. only this turn */
nextTurn();nextTurn();phase('battle');
ok('C: in player II\'s next turn its monster can attack again',gameState.activePlayer===1&&canDeclareAttackV48(findCardByUid(gob.uid).card));

/* B. with no response the Start Step does not stop */
fresh();
decks();gameState.players[1].mz=[mk('ゴブリン突撃部隊',1,'up')];
gameState.activePlayer=1;gameState.phase='main1';baselineA();
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
ok('B: nobody has a response — the Start Step passes by itself and the battle command is ready',gameState.phase==='battle'&&!gameState.processorPaused&&!!BATTLE_COMMAND_V29);
`);
