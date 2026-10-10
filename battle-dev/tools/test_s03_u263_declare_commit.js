/* S03-U263: activation-time declarations that never committed — DNA移植手術, DNA改造手術, 幻惑の巻物 (status-correction unit). Real DUEL paths (declaration and target chosen at activation, the chain resolves); Replay-audited. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){const hh=findCardByUid(c.uid);return hh?hh.card:null;}
function idx(c){const hh=findCardByUid(c.uid);return hh?hh.index:-1;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function up(n,p,pos){return mk(n,p,'up',pos);}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
/* player ap attacks; player rp responds at the first POINT matching want(payload) with the card at (zone,i) */
function attackRespond(ap,a,target,rp,want,zone,i){
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:ap,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});
  let done=false;
  for(let k=0;k<300;k++){const w=gameState.processorWaiting;
    if(!done&&w&&w.type==='POINT'&&gameState.processorPaused&&want(w.payload||{})){pointActivateV27(rp,zone,i,0);done=true;continue;}
    if(!step())break;}
  drive();return done;}
function turnOf(p){gameState.activePlayer=p;gameState.turn=p===0?5:6;gameState.phase='battle';}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function attr(c){return currentAttributeV17(C(c));}
function race(c){return currentRaceV17(C(c));}
function declKey(v){const q=pc();if(!q)return null;const x=q.candidates.find(y=>y.value===v);return x?x.key:null;}

/* ===== A: DNA移植手術 — declared at activation; while it is on the field all face-up monsters are that Attribute ===== */
fresh();
let dna=setT('DNA移植手術',0),w0=up('ワイト',0),w1=up('ブラッド・ヴォルス',1);
gameState.players[0].sz=[dna];gameState.players[0].mz=[w0];gameState.players[1].mz=[w1];baselineA();
duelActivateFromZone(0,'sz',0);
const kA=declKey('光');PREFER=[kA];drive();PREFER=[];
ok('A: the declaration is made at activation and the activation resolves (chain empty, card face-up on the field)',kA!=null&&!gameState.chain.length&&z(dna)==='sz'&&C(dna).face==='up'&&API.persistentDeclaration(C(dna),'attribute')==='光',JSON.stringify({kA,chain:gameState.chain.length,d:API.persistentDeclaration(C(dna),'attribute')}));
ok('A: both players\' face-up monsters become LIGHT',attr(w0)==='光'&&attr(w1)==='光',JSON.stringify({a0:attr(w0),a1:attr(w1)}));
audit('A');

/* ===== B: DNA改造手術 — declared at activation; all face-up monsters are that Type ===== */
fresh();
let dk=setT('DNA改造手術',0);w0=up('ワイト',0);w1=up('ブラッド・ヴォルス',1);
gameState.players[0].sz=[dk];gameState.players[0].mz=[w0];gameState.players[1].mz=[w1];baselineA();
duelActivateFromZone(0,'sz',0);
const kB=declKey('ドラゴン');PREFER=[kB];drive();PREFER=[];
ok('B: resolves; both monsters become Dragon',kB!=null&&!gameState.chain.length&&race(w0)==='ドラゴン'&&race(w1)==='ドラゴン',JSON.stringify({kB,r0:race(w0),r1:race(w1)}));
audit('B');

/* ===== C: 幻惑の巻物 — declare an Attribute and choose the monster at activation; the equipped monster is that Attribute ===== */
fresh();
let sc=mk('幻惑の巻物',0);w0=up('ワイト',0);let w2=up('ワイト',0);
gameState.players[0].hand=[sc];gameState.players[0].mz=[w0,w2];baselineA();
duelActivateFromHand(0);
const kC=declKey('炎');PREFER=[kC,w2.uid];drive();PREFER=[];
ok('C: equipped to the chosen ワイト, which becomes FIRE; the other stays DARK',kC!=null&&z(sc)==='sz'&&C(sc).equipTo?.uid===w2.uid&&attr(w2)==='炎'&&attr(w0)==='闇',JSON.stringify({kC,eq:C(sc).equipTo,a2:attr(w2),a0:attr(w0)}));
audit('C');
fresh();
gameState.players[0].hand=[mk('幻惑の巻物',0)];baselineA();
ok('C2: no face-up monster — 幻惑の巻物 cannot be activated',!strictScriptLegalityV2('幻惑の巻物',0,'hand',0,{cardOverride:gameState.players[0].hand[0],logicalZone:'sz',prospectiveIndex:0}).ok);
`);
