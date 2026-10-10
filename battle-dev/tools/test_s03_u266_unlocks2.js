/* S03-U266: outdated ENGINE_GAP reasons 2 — 因幡之白兎, 阿修羅, サーチライトメン, きつね火, ワンショット・ブースター (engine: one-sided Set ban, function-form Tribute ban, Normal Summon success record). Real DUEL paths; Replay-audited. */
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
function setT(n,p){const c=mk(n,p,'down');c.setTurn=3;return c;}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:t==='direct'?'direct':findCardByUid(t.uid).index});drive();}
function toPhase(ph){const ord=['draw','standby','main1','battle','main2','end'];for(let k=0;k<8&&gameState.phase!==ph;k++){const i=ord.indexOf(gameState.phase);if(i<0||i>=ord.indexOf(ph))break;requestProcessorV27(PROCESSOR_V27.PHASE,{to:ord[i+1]});drive();}}
function nextTurn(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();}

/* ===== A: 因幡之白兎 — must attack directly while the opponent has monsters; returns to the hand at the End Phase of its summon turn ===== */
fresh();
let ib=mk('因幡之白兎',0),wt=up('ワイト',1);gameState.players[0].hand=[ib];gameState.players[1].mz=[wt];baselineA();
doNormalSummon(0,'atk');drive();toPhase('battle');
hitT(0,ib,wt);
ok('A: cannot attack the opponent\'s ワイト',z(wt)==='mz'&&!C(ib).attacked,JSON.stringify({wt:z(wt)}));
hitT(0,ib,'direct');
ok('A: attacks directly past ワイト: 700',gameState.players[1].lp===8000-700,String(gameState.players[1].lp));
toPhase('end');
ok('A: End Phase of its summon turn — back to the hand',z(ib)==='hand');
audit('A');
fresh();
ib=mk('因幡之白兎',0);gameState.players[0].hand=[ib];baselineA();
ok('A2: cannot be Special Summoned',!API.specialSummon(0,'hand',0,'atk','死者蘇生')&&z(ib)==='hand');

/* ===== B: 阿修羅 — attacks each opponent monster once; returns to the hand at the End Phase of its summon turn ===== */
fresh();
let as=mk('阿修羅',0),w1=up('ワイト',1),w2=up('ワイト',1);gameState.players[0].hand=[as];gameState.players[1].mz=[w1,w2];baselineA();
doNormalSummon(0,'atk');drive();toPhase('battle');
hitT(0,as,w1);hitT(0,as,w2);
ok('B: attacks both ワイト (two attacks), both destroyed',z(w1)==='grave'&&z(w2)==='grave',JSON.stringify({w1:z(w1),w2:z(w2)}));
hitT(0,as,'direct');
ok('B: no direct attack after attacking',gameState.players[1].lp===8000-1400-1400,String(gameState.players[1].lp));
toPhase('end');
ok('B: back to the hand at the End Phase',z(as)==='hand');
audit('B');

/* ===== C: サーチライトメン — flipped: this turn the opponent cannot Set cards ===== */
fresh();
let sl=setT('サーチライトメン',0),be=up('青眼の白龍',1),sp=mk('サイクロン',1),mn=mk('ワイト',1);
gameState.players[0].mz=[sl];gameState.players[1].mz=[be];gameState.players[1].hand=[sp,mn];sl.pos='def';gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
hitT(1,be,sl);
ok('C: flipped by the attack — the opponent (turn player) is stamped',Number((gameState.players[1].temporaryFlags||{}).noSetS03)===6,JSON.stringify(gameState.players[1].temporaryFlags));
toPhase('main2');
doSetST(0);drive();
doSetMonster(gameState.players[1].hand.findIndex(c=>c.uid===mn.uid));drive();
ok('C: it cannot Set a Spell nor a monster this turn',z(sp)==='hand'&&z(mn)==='hand',JSON.stringify({sp:z(sp),mn:z(mn)}));
audit('C');
nextTurn();nextTurn();toPhase('main1');
doSetST(gameState.players[1].hand.findIndex(c=>c.uid===sp.uid));drive();
ok('C: its next turn — it can Set again',z(sp)==='sz',JSON.stringify({t:gameState.turn,ap:gameState.activePlayer,sp:z(sp)}));

/* ===== D: きつね火 — destroyed by battle face-up: special summoned from the GY at that End Phase; cannot be Tributed while face-up ===== */
fresh();
let kb=up('きつね火',0);be=up('青眼の白龍',1);gameState.players[0].mz=[kb];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
hitT(1,be,kb);
ok('D: destroyed by battle',z(kb)==='grave');
toPhase('end');
ok('D: that End Phase — special summoned from the GY',z(kb)==='mz',JSON.stringify({kb:z(kb)}));
audit('D');
fresh();
kb=up('きつね火',0);let w3=up('ワイト',0),lv5=mk('ジェネティック・ワーウルフ',0);
gameState.players[0].mz=[kb,w3];gameState.players[0].hand=[lv5];baselineA();
const cands=tributeCandidates(0,dbOf(lv5)).map(x=>x.card.uid);
ok('D2: face-up きつね火 is not a Tribute candidate; ワイト is',cands.indexOf(kb.uid)<0&&cands.indexOf(w3.uid)>=0,JSON.stringify(cands));
C(kb).face='down';
ok('D2: face-down it can be Tributed',tributeCandidates(0,dbOf(lv5)).some(x=>x.card.uid===kb.uid));

/* ===== E: ワンショット・ブースター — special summoned from the hand in a turn its controller Normal Summoned; release: destroy an opponent monster that battled its monster ===== */
fresh();
let ob=mk('ワンショット・ブースター',0),nw=mk('ワイト',0);be=up('青眼の白龍',1,'def');let other=up('ワイト',1);
gameState.players[0].hand=[ob,nw];gameState.players[1].mz=[be,other];baselineA();
const lgE0=strictSummonProcedureLegality('ワンショット・ブースター',0,'hand',0);
doNormalSummon(gameState.players[0].hand.findIndex(c=>c.uid===nw.uid),'atk');drive();
const iob=gameState.players[0].hand.findIndex(c=>c.uid===ob.uid);
const lgE1=strictSummonProcedureLegality('ワンショット・ブースター',0,'hand',iob);
runSummonProcedure('ワンショット・ブースター',0,'hand',iob);if(!gameState.pendingSummon&&!pc())finishSummonProcedure('ワンショット・ブースター',0,'hand',iob,'atk');drive();
ok('E: not legal before a Normal Summon; legal after — special summoned',lgE0.ok===false&&lgE1.ok===true&&z(ob)==='mz',JSON.stringify({lgE0,lgE1,z:z(ob)}));
toPhase('battle');hitT(0,nw,be);toPhase('main2');
PREFER=[be.uid];duelActivateFromZone(0,'mz',findCardByUid(ob.uid).index);drive();PREFER=[];
ok('E: released — 青眼 (it battled ワイト) destroyed; the other ワイト could not be chosen',z(ob)==='grave'&&z(be)==='grave'&&z(other)==='mz',JSON.stringify({ob:z(ob),be:z(be),other:z(other)}));
audit('E');
fresh();
ob=up('ワンショット・ブースター',0);gameState.players[0].mz=[ob];gameState.players[1].mz=[up('ワイト',1)];baselineA();
ok('E2: no monster battled this turn — not activatable',!strictScriptLegalityV2('ワンショット・ブースター',0,'mz',0,{}).ok);
`);
