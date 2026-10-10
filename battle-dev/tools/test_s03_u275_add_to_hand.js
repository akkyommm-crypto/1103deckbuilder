/* S03-U275: 「デッキから手札に加わった」 — a search raises onAddToHand; ワタポン, 強烈なはたき落とし (2011 texts).
   Real DUEL paths (battle, deck trigger search, activation, chain / event windows), Replay-audited. */
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
/* ===== W: ワタポン — added from its own Deck by a card effect → may Special Summon itself from the hand ===== */
fresh();
gameState.phase='battle';
let cr=up('クリッター',0),be=up('青眼の白龍',1),wp=mk('ワタポン',0);
gameState.players[0].mz=[cr];gameState.players[1].mz=[be];gameState.players[0].deck=[mk('ワイト',0),wp,mk('ワイト',0)];baselineA();
PREFER=[wp.uid];hitT(0,cr,be);PREFER=[];
ok('W1: クリッター destroyed by battle searched ワタポン (a search, FX_SEARCH)',z(cr)==='grave'&&z(wp)!=='deck',JSON.stringify({cr:z(cr),wp:z(wp)}));
ok('W1: ワタポン was then Special Summoned from the hand by its own trigger',z(wp)==='mz'&&C(wp).face==='up',JSON.stringify({wp:z(wp)}));
audit('W1');
/* W2: drawn — not added by a card effect: no trigger */
fresh();
gameState.phase='draw';gameState.drawnThisTurn=false;
wp=mk('ワタポン',0);gameState.players[0].deck=[wp,mk('ワイト',0)];baselineA();
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();
ok('W2: drawn by the normal draw — stays in the hand',z(wp)==='hand',JSON.stringify({wp:z(wp)}));
audit('W2');

/* ===== K: 強烈なはたき落とし — when the opponent adds a card from the Deck to the hand, they discard it ===== */
fresh();
gameState.activePlayer=1;gameState.turn=6;
let kn=setT('強烈なはたき落とし',0),rf=mk('増援',1),ck=mk('コマンド・ナイト',1);
gameState.players[0].sz=[kn];gameState.players[1].hand=[rf];gameState.players[1].deck=[mk('ワイト',1),ck,mk('ワイト',1)];baselineA();
PREFER=[ck.uid];cast(1,'増援');PREFER=[];
ok('K1: the opponent searched コマンド・ナイト with 増援; 強烈なはたき落とし made them discard it',z(rf)==='grave'&&z(ck)==='grave'&&z(kn)==='grave'&&pl(ck)===1,JSON.stringify({rf:z(rf),ck:z(ck),kn:z(kn)}));
ok('K1: the discard was by an effect of the other player (discardInfo byPlayer 0)',!!C(ck).discardInfo&&C(ck).discardInfo.byPlayer===0,JSON.stringify(C(ck)&&C(ck).discardInfo));
audit('K1');
/* K2: the opponent's draw is not 「デッキから手札に加えた」 by an effect event — not activated */
fresh();
gameState.activePlayer=1;gameState.turn=6;gameState.phase='draw';gameState.drawnThisTurn=false;
kn=setT('強烈なはたき落とし',0);gameState.players[0].sz=[kn];baselineA();
requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
ok('K2: the opponent’s normal draw — it stays Set',z(kn)==='sz'&&C(kn).face==='down');
audit('K2');
/* K3: its controller's own search — not activated */
fresh();
kn=setT('強烈なはたき落とし',0);rf=mk('増援',0);ck=mk('コマンド・ナイト',0);
gameState.players[0].sz=[kn];gameState.players[0].hand=[rf];gameState.players[0].deck=[ck,mk('ワイト',0)];baselineA();
PREFER=[ck.uid];cast(0,'増援');PREFER=[];
ok('K3: its own controller’s search — it stays Set, the card stays in the hand',z(kn)==='sz'&&z(ck)==='hand',JSON.stringify({kn:z(kn),ck:z(ck)}));
audit('K3');
/* W3: its Special Summon lets the player choose face-up Defense */
fresh();
gameState.phase='battle';
cr=up('クリッター',0);be=up('青眼の白龍',1);wp=mk('ワタポン',0);
gameState.players[0].mz=[cr];gameState.players[1].mz=[be];gameState.players[0].deck=[mk('ワイト',0),wp,mk('ワイト',0)];baselineA();
PREFER=[wp.uid,'def'];hitT(0,cr,be);PREFER=[];
ok('W3: ワタポン special summoned in face-up Defense Position (chosen)',z(wp)==='mz'&&C(wp).face==='up'&&C(wp).pos==='def',JSON.stringify({wp:z(wp),pos:C(wp)&&C(wp).pos}));
audit('W3');
`);
