/* S03-U286: 地縛神 Chacu Challhua (Battle Phase prohibition while in Defense), 地縛神 Cusillu (release-type destruction substitute) (2011 texts).
   Real DUEL paths (activation, attacks, the substitute decision), Replay-audited. */
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
const CH='地縛神 Chacu Challhua', CU='地縛神 Cusillu';
function fieldSp(p){const f=up('山',p);gameState.players[p].field=f;return f;}
function legalZ(p,c){const h=findCardByUid(c.uid);return !!h&&strictScriptLegality(cardName(C(c)),p,h.zone,h.index).ok;}
/* ===== C: 地縛神 Chacu Challhua ===== */
fresh();
fieldSp(0);let ch=up(CH,0);gameState.players[0].mz=[ch];baselineA();
const dmg=Math.floor(curDEF(C(ch))/2);
duelActivateFromZone(0,'mz',0);drive();
ok('C1: once per turn — the opponent takes half its DEF',lp(1)===8000-dmg&&dmg>0,JSON.stringify({lp1:lp(1),dmg}));
ok('C1: not again this turn',!legalZ(0,ch));
toPhase('battle');hitT(0,ch,'direct');
ok('C1: the turn it used the effect it cannot attack',lp(1)===8000-dmg,String(lp(1)));
audit('C1');
fresh();
gameState.phase='battle';fieldSp(0);ch=up(CH,0);gameState.players[0].mz=[ch];baselineA();
hitT(0,ch,'direct');const afterHit=lp(1);toPhase('main2');
ok('C2: after it attacked, the effect cannot be activated',afterHit<8000&&!legalZ(0,ch),JSON.stringify({afterHit}));
audit('C2');
/* C3: face-up Defense → the opponent cannot conduct the Battle Phase; Attack Position → they can */
fresh();
gameState.activePlayer=1;gameState.turn=6;
fieldSp(0);ch=up(CH,0,'def');gameState.players[0].mz=[ch];baselineA();
ok('C3: in face-up Defense — the opponent’s Battle Phase is forbidden; from Main Phase 1 the next phase is the End Phase',battlePhaseForbiddenV340(gameState)==='effect'&&nextPhaseIdV27()==='end',JSON.stringify({f:battlePhaseForbiddenV340(gameState),n:nextPhaseIdV27()}));
fresh();
gameState.activePlayer=1;gameState.turn=6;
fieldSp(0);ch=up(CH,0);gameState.players[0].mz=[ch];baselineA();
ok('C3: in Attack Position — no restriction',!battlePhaseForbiddenV340(gameState)&&nextPhaseIdV27()==='battle');
fresh();
fieldSp(0);ch=up(CH,0,'def');gameState.players[0].mz=[ch];baselineA();
ok('C3: its controller’s own Battle Phase is not affected',!battlePhaseForbiddenV340(gameState));

/* ===== K: 地縛神 Cusillu — destroyed by battle: release another own monster instead, and the opponent’s LP become half ===== */
fresh();
gameState.phase='battle';
fieldSp(0);let cu=up(CU,0),w1=up('ワイト',0,'def'),be=up('青眼の白龍',1);gameState.players[0].mz=[cu,w1];gameState.players[1].mz=[be];baselineA();
PREFER=['rel:'+w1.uid];hitT(0,cu,be);PREFER=[];
ok('K1: attacking 青眼の白龍 it would be destroyed — ワイト released instead; it stays',z(cu)==='mz'&&z(w1)==='grave'&&C(w1).graveInfo&&C(w1).graveInfo.byDestroy===false,JSON.stringify({cu:z(cu),w1:z(w1)}));
ok('K1: the opponent’s LP become half (8000 → 4000); its controller took the battle damage',lp(1)===4000&&lp(0)<8000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('K1');
fresh();
gameState.phase='battle';
fieldSp(0);cu=up(CU,0);w1=up('ワイト',0);be=up('青眼の白龍',1);gameState.players[0].mz=[cu,w1];gameState.players[1].mz=[be];baselineA();
PREFER=['decline'];hitT(0,cu,be);PREFER=[];
ok('K2: declined — it is destroyed; nothing released; LP not halved',z(cu)==='grave'&&z(w1)==='mz'&&lp(1)===8000,JSON.stringify({cu:z(cu),lp1:lp(1)}));
audit('K2');
fresh();
gameState.phase='battle';
fieldSp(0);cu=up(CU,0);be=up('青眼の白龍',1);gameState.players[0].mz=[cu];gameState.players[1].mz=[be];baselineA();
hitT(0,cu,be);
ok('K3: no other monster to release — simply destroyed',z(cu)==='grave'&&lp(1)===8000,JSON.stringify({cu:z(cu)}));
`);
