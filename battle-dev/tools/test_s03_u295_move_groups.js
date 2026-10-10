/* S03-U295: group summaries per move group (one chain link's resolution, one activation's cost) — cards moved by two links of one chain are two
   occurrences: パラライズ・チェーン triggers twice in one SEGOC (the descriptor keeps the summary lists; the card's own trigger on the chain
   does not count as 「このカードの発動中」). Real DUEL paths, Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function pl(c){const hh=findCardByUid(c.uid);return hh?hh.p:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function lp(p){return gameState.players[p].lp;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;SEEN=[];TRIG=[];PREFER=[];
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:10},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(!q)return false;
  SEEN.push({title:q.title||'',kind:q.kind,min:q.min,max:q.max,n:(q.candidates||[]).length,keys:(q.candidates||[]).map(x=>x.uid!=null?x.uid:x.key)});
  const find=u=>q.candidates.findIndex(x=>x.uid===u||x.key===u||x.value===u||(x.card&&x.card.uid===u));
  if(q.max>1||q.min!==q.max){
    let ks=[];for(const u of PREFER){const j=find(u);if(j>=0&&ks.indexOf(q.candidates[j].key)<0)ks.push(q.candidates[j].key);}
    ks=ks.slice(0,q.max);for(const c of q.candidates){if(ks.length>=q.min)break;if(ks.indexOf(c.key)<0)ks.push(c.key);}
    PREFER=PREFER.filter(u=>find(u)<0);answerChoiceV49(ks);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){j=find(PREFER[k]);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<800;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push({names:g.map(c=>c.name),forced:st.rank<2});eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function up(n,p,pos){return mk(n,p,'up',pos);}
function down(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
function base(){gameState.posSnapV10=positionSnapshotV10(gameState);baselineA();}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
const trigNamed=n=>TRIG.filter(t=>t.names.indexOf(n)>=0);
const PC='パラライズ・チェーン',TH='魔力の棘';
function sumEvents(kind){return (gameState.eventLogS03||[]).filter(e=>e.eventName===kind);}
let S0,S1,t,w,ha,nb,gb;

fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(PC,0);const n1=setT('針虫の巣窟',1),n2=setT('針虫の巣窟',1);gameState.players[0].sz=[S0];gameState.players[1].sz=[n1,n2];
gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));base();
duelActivateFromZone(1,'sz',0);
let wq=toWindow();if(wq&&gameState.chainWindow.priority===0){chainPassV2();wq=toWindow();}
const o=findCardByUid(n2.uid);if(wq)duelActivateResponseV2(1,o.zone,o.index);
drive();
ok('G1: two links of one chain each mill 5 from the opponent Deck — two groups → パラライズ・チェーン triggers twice, 600',gameState.players[1].grave.filter(c=>cardName(c)==='ワイト').length===10&&lp(1)===7400&&trigNamed(PC).length===2,JSON.stringify({g:gameState.players[1].grave.length,lp:lp(1),TRIG}));
audit('G1');
/* G2: the activation descriptor keeps a summary's lists (the SEGOC continuation rebuilds the remaining candidates from it) */
const dsc=safeActivationEventV11({summaryS03:true,count:2,uids:[1,2],reasons:['effect'],actingPlayers:[0],items:[{uid:1,attr:'炎'}]});
const plain=safeActivationEventV11({count:2,uids:[1,2],reasons:['effect']});
ok('G2: a summary keeps uids / reasons / actingPlayers / items; another event still keeps scalars only',Array.isArray(dsc.reasons)&&dsc.reasons[0]==='effect'&&dsc.items[0].attr==='炎'&&dsc.uids.length===2&&!Array.isArray(plain.reasons)&&plain.count===2,JSON.stringify({dsc,plain}));
/* G3: one link milling 5 is still one group (one trigger, 300) */
fresh();gameState.activePlayer=1;gameState.turn=6;
S0=up(PC,0);gameState.players[0].sz=[S0];gameState.players[1].sz=[setT('針虫の巣窟',1)];base();
duelActivateFromZone(1,'sz',0);drive();
ok('G3: one link, 5 cards — one trigger, 300',lp(1)===7700&&trigNamed(PC).length===1,JSON.stringify({lp:lp(1),TRIG}));
audit('G3');
`);
