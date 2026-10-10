/* S03-U278: the summoning player chooses face-up Attack or Defense for an effect Special Summon whose text gives no position (engine/1ZZK queue).
   Real DUEL paths (activation, chain resolution, the queued position choice), Replay-audited. */
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
globalThis.__MANUAL_SS_POSITION_S03=true;   /* this test answers the position choices itself */
let SEENC=[],EVQ8=[];const __qd8=queueDeferredEventV2;queueDeferredEventV2=function(n,e){EVQ8.push(n);return __qd8.apply(this,arguments);};const __rq=requestChoiceV49;requestChoiceV49=function(spec){SEENC.push(spec&&spec.title||'');return __rq.apply(this,arguments);};
function posChoices(){return SEENC.filter(t=>/表示形式/.test(t));}
/* ===== S1: 死者蘇生 (no position in its text) — Defense chosen ===== */
fresh();
let rv=mk('死者蘇生',0),gw=mk('ジェネティック・ワーウルフ',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[gw];baselineA();
SEENC=[];EVQ8=[];PREFER=[gw.uid,'def'];duelActivateFromHand(0);drive();PREFER=[];
ok('S1: 死者蘇生 — the summoning player chose face-up Defense',z(gw)==='mz'&&C(gw).face==='up'&&C(gw).pos==='def'&&posChoices().length===1,JSON.stringify({z:z(gw),pos:C(gw)&&C(gw).pos,ch:posChoices()}));
ok('S1: the Special Summon was not a position change (no onPositionChange event queued)',EVQ8.filter(n=>n==='onPositionChange').length===0&&EVQ8.indexOf('onSpecialSummon')>=0,JSON.stringify(EVQ8));
audit('S1');
/* S2: Attack chosen */
fresh();
rv=mk('死者蘇生',0);gw=mk('ジェネティック・ワーウルフ',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[gw];baselineA();
PREFER=[gw.uid,'atk'];duelActivateFromHand(0);drive();PREFER=[];
ok('S2: Attack chosen — face-up Attack, and it can attack (Battle Phase legal attackers include it)',z(gw)==='mz'&&C(gw).pos==='atk',JSON.stringify({pos:C(gw)&&C(gw).pos}));
audit('S2');
/* S3: 早すぎた埋葬 — 「表側攻撃表示で特殊召喚」: no choice */
fresh();
let pb=mk('早すぎた埋葬',0);gw=mk('ジェネティック・ワーウルフ',0);gameState.players[0].hand=[pb];gameState.players[0].grave=[gw];baselineA();
SEENC=[];PREFER=[gw.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('S3: 早すぎた埋葬 (text says Attack Position) — no position choice; face-up Attack',z(gw)==='mz'&&C(gw).pos==='atk'&&posChoices().length===0,JSON.stringify({pos:C(gw)&&C(gw).pos,ch:posChoices()}));
audit('S3');
/* S4: the opponent's 死者蘇生 — the opponent (summoning player) chooses */
fresh();
gameState.activePlayer=1;gameState.turn=6;
rv=mk('死者蘇生',1);let og=mk('ワイト',0);gameState.players[1].hand=[rv];gameState.players[0].grave=[og];baselineA();
SEENC=[];let posP=null;const __rq2=requestChoiceV49;requestChoiceV49=function(spec){if(/表示形式/.test(spec&&spec.title||''))posP=spec.player;return __rq2.apply(this,arguments);};
PREFER=[og.uid,'def'];duelActivateFromHand(0);drive();PREFER=[];requestChoiceV49=__rq2;
ok('S4: the opponent revives my ワイト to their field and chooses its position (Defense)',z(og)==='mz'&&pl(og)===1&&C(og).pos==='def'&&posP===1,JSON.stringify({z:z(og),p:pl(og),pos:C(og)&&C(og).pos,posP}));
audit('S4');
/* S5: 氷結界の武士 revived in Defense — not a change from Attack to Defense: it is not destroyed and nothing is drawn */
fresh();
rv=mk('死者蘇生',0);let ib5=mk('氷結界の武士',0);gameState.players[0].hand=[rv];gameState.players[0].grave=[ib5];baselineA();
const h5=gameState.players[0].hand.length,d5=gameState.players[0].deck.length;
PREFER=[ib5.uid,'def'];duelActivateFromHand(0);drive();PREFER=[];
ok('S5: 氷結界の武士 special summoned in Defense stays on the field; no draw',z(ib5)==='mz'&&C(ib5).pos==='def'&&gameState.players[0].deck.length===d5&&gameState.players[0].hand.length===h5-1,JSON.stringify({z:z(ib5),pos:C(ib5)&&C(ib5).pos,deck:gameState.players[0].deck.length,d5}));
audit('S5');
`);
