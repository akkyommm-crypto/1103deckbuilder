/* S03-U279: special win conditions — 封印されしエクゾディア (2011 text).
   Real DUEL paths (normal draw through the processor, a Deck-to-hand action), Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(!q)return false;
  const find=u=>q.candidates.find(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const c=find(u);if(c&&ks.indexOf(c.key)<0)ks.push(c.key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>!find(u));answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function castOpen(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);PREFER=[];}
function legalHand(name,p,i){const P=gameState.players[p],c=P.hand[i];return strictScriptLegalityV2(name,p,'hand',i,{cardOverride:c,logicalZone:'sz',prospectiveIndex:(P.sz||[]).length});}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}
/* the cards in use respond in the chain windows (each at most once); the others pass */
const USED=new Set();
function windows(use,seen){seen=seen||[];USED.clear();
  for(let i=0;i<60;i++){ if(!toWindow())break;
    let did=false;
    for(const c of use){ const o=findCardByUid(c.uid); if(!o||USED.has(c.uid))continue; if(offered(o.p,c)){seen.push(c.uid);USED.add(c.uid);duelActivateResponseV2(o.p,o.zone,o.index);did=true;break;} }
    if(!did)chainPassV2(); }
  drive();return seen;}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,rp);done=true;continue;}
    if(!step())break;}
  return done;}
const EX=['封印されしエクゾディア','封印されし者の右腕','封印されし者の左腕','封印されし者の右足','封印されし者の左足'];
/* ===== X1: the fifth piece drawn by the normal draw — its owner wins at once ===== */
fresh();
gameState.phase='draw';gameState.drawnThisTurn=false;
let ex=EX.map(n=>mk(n,0));gameState.players[0].hand=ex.slice(0,4);gameState.players[0].deck=[ex[4],mk('ワイト',0)];baselineA();
ok('X1: 4 pieces in the hand — the duel goes on',gameState.loser==null);
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
ok('X1: drawing the fifth piece — player 0 wins (the opponent is the loser), reason specialWin',gameState.loser===1&&gameState.duelEndedReason==='specialWin',JSON.stringify({loser:gameState.loser,r:gameState.duelEndedReason}));
audit('X1');
/* X2: completed by a card effect adding the last piece from the Deck (the FX_SEARCH path every search card uses) */
fresh();
ex=EX.map(n=>mk(n,0));gameState.players[0].hand=ex.slice(1);gameState.players[0].deck=[mk('ワイト',0),ex[0]];baselineA();
API.searchDeck(0,1,'test search');
ok('X2: completed by a search (FX_SEARCH) — player 0 wins',gameState.loser===1&&gameState.duelEndedReason==='specialWin',JSON.stringify({loser:gameState.loser}));
audit('X2');
/* X3: pieces split between hand and field do not count; the opponent's pieces do not count for player 0 */
fresh();
ex=EX.map(n=>mk(n,0));gameState.players[0].hand=ex.slice(0,4);gameState.players[0].mz=[up('封印されし者の左足',0)];
let oe=EX.map(n=>mk(n,1));gameState.players[1].hand=oe.slice(0,4);baselineA();
API.draw(0,1);
ok('X3: 4 in the hand + 1 on the field (and the opponent holding 4) — no winner',gameState.loser==null,JSON.stringify({loser:gameState.loser}));
audit('X3');
`);
