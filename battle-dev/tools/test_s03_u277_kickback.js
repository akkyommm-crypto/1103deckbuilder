/* S03-U277: キックバック — a negated Normal / Flip Summon whose monster returns to its owner hand (2011 text).
   Real DUEL paths (Normal / Tribute / Flip Summon windows, summon negation), Replay-audited. */
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
function hi7(p,c){return gameState.players[p].hand.findIndex(x=>x.uid===c.uid);}
function toSummonWindow(){for(let i=0;i<30&&!gameState.pendingSummon;i++){if(!step())break;}return !!gameState.pendingSummon;}
function negators(){return gameState.pendingSummon?summonNegatorsV2(gameState.pendingSummon).map(x=>x.db.n):[];}

/* ===== K1: a Normal Summon of the opponent — negated, the monster back to its owner's hand ===== */
fresh();
let kb=setT('キックバック',1),bd=mk('ベビードラゴン',0);gameState.players[1].sz=[kb];gameState.players[0].hand=[bd];baselineA();
doNormalSummon(hi7(0,bd),'atk');
ok('K1: the summon window is open and lists キックバック',toSummonWindow()&&negators().includes('キックバック'),JSON.stringify(negators()));
activateSummonNegatorV2(1,'sz',0);drive();
ok('K1: negated — ベビードラゴン is back in its owner’s hand (not the GY); キックバック in the GY',z(bd)==='hand'&&pl(bd)===0&&z(kb)==='grave',JSON.stringify({bd:z(bd),kb:z(kb)}));
ok('K1: the Normal Summon was used',gameState.players[0].normalSummonUsed===true);
audit('K1');
/* K2: a Tribute Summon — the Tribute stays paid, the monster returns to the hand */
fresh();
kb=setT('キックバック',1);let cd=mk('サイバー・ドラゴン',0),tw=up('ワイト',0);gameState.players[1].sz=[kb];gameState.players[0].hand=[cd];gameState.players[0].mz=[tw];baselineA();
PREFER=[tw.uid];doNormalSummon(hi7(0,cd),'atk');
ok('K2: Tribute Summon of サイバー・ドラゴン (ワイト tributed) reaches the summon window',toSummonWindow()&&z(tw)==='grave',JSON.stringify({tw:z(tw)}));
PREFER=[];activateSummonNegatorV2(1,'sz',0);drive();
ok('K2: negated — サイバー・ドラゴン back in the hand; ワイト stays in the GY',z(cd)==='hand'&&z(tw)==='grave',JSON.stringify({cd:z(cd),tw:z(tw)}));
audit('K2');
/* K3: a Flip Summon — negated, the face-down monster returns to the hand */
fresh();
kb=setT('キックバック',1);let fw=setT('ワイト',0);fw.pos='def';gameState.players[1].sz=[kb];gameState.players[0].mz=[fw];baselineA();
doFlipUp(0,'mz',0,'atk');
ok('K3: Flip Summon window lists キックバック',toSummonWindow()&&gameState.pendingSummon.kind==='flip'&&negators().includes('キックバック'),JSON.stringify(negators()));
activateSummonNegatorV2(1,'sz',0);drive();
ok('K3: negated — ワイト returned from the Monster Zone to its owner’s hand',z(fw)==='hand'&&pl(fw)===0&&gameState.players[0].mz.length===0,JSON.stringify({fw:z(fw)}));
audit('K3');
/* K4: a Special Summon is not covered */
fresh();
kb=setT('キックバック',1);let rv=mk('死者蘇生',0),gw=mk('ワイト',0);gameState.players[1].sz=[kb];gameState.players[0].hand=[rv];gameState.players[0].grave=[gw];baselineA();
PREFER=[gw.uid];duelActivateFromHand(0);
let seenK4=false;for(let i=0;i<40;i++){if(gameState.pendingSummon){seenK4=seenK4||negators().includes('キックバック');commitPendingSummonV2();continue;}if(!step()){if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}}
PREFER=[];
ok('K4: 死者蘇生 (Special Summon) — キックバック is not offered and stays Set',!seenK4&&z(kb)==='sz'&&z(gw)==='mz',JSON.stringify({seenK4,kb:z(kb),gw:z(gw)}));
audit('K4');
`);
