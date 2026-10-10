/* S03-U273: hand size limit — the turn player discards down to the limit at the end of the turn; 衰弱の霧, ヒエログリフの石版, 無限の手札 (2011 texts).
   Real DUEL paths (turn end through the processor, the discard choice, activation), Replay-audited. */
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
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
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
/* deferred-event spy (test instrumentation only) */
let EVQ=[];const __qd=queueDeferredEventV2;queueDeferredEventV2=function(n,e){EVQ.push({n,e});return __qd.apply(this,arguments);};
function evq273(n){return EVQ.filter(x=>x.n===n).map(x=>x.e);}
function hand(p,n,name){const a=[];for(let i=0;i<n;i++)a.push(mk(name||'ワイト',p));gameState.players[p].hand=a;return a;}
/* end the turn through the processor; returns the pending hand-limit choice (or null) */
function endTurnOpen(){toPhase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});for(let i=0;i<50;i++){const q=pc();if(q)return q;if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}break;}return pc();}
function answerUids(uids){const q=pc();if(!q)return false;const keys=uids.map(u=>{const c=q.candidates.find(x=>x.uid===u||(x.card&&x.card.uid===u));return c&&c.key;});answerChoiceV49(keys);drive();}

/* ===== H1: 8 cards at the end of the turn — the turn player chooses 2 to discard (rule discard), then the turn passes ===== */
fresh();
let h1=hand(0,8);const cy=mk('サイクロン',0),rb=mk('死者蘇生',0);h1[2]=cy;h1[5]=rb;baselineA();
EVQ=[];let q=endTurnOpen();
ok('H1: a discard choice opens for the turn player — exactly 2 of the 8 cards',!!q&&q.player===0&&q.min===2&&q.max===2&&q.candidates.length===8&&gameState.turn===5,JSON.stringify(q&&{p:q.player,min:q.min,max:q.max,n:q.candidates.length,turn:gameState.turn}));
answerUids([cy.uid,rb.uid]);
ok('H1: the 2 chosen cards are in the GY; 6 left in the hand',z(cy)==='grave'&&z(rb)==='grave'&&gameState.players[0].hand.length===6,JSON.stringify({c:z(cy),d:z(rb),n:gameState.players[0].hand.length}));
ok('H1: a rule discard — not 「効果で捨てられた」 (no onDiscard, no discardInfo); onDiscardAnyS03 with byEffect false',evq273('onDiscard').length===0&&evq273('onDiscardAnyS03').length===2&&evq273('onDiscardAnyS03').every(e=>e.byEffect===false)&&C(cy).discardInfo==null,JSON.stringify(evq273('onDiscardAnyS03').map(e=>e.byEffect)));
ok('H1: then the turn passes to the opponent',gameState.turn===6&&gameState.activePlayer===1&&!pc(),JSON.stringify({turn:gameState.turn,ap:gameState.activePlayer}));
audit('H1');
/* H2: exactly 6 — no choice; the opponent's 8 do not matter at this turn's end */
fresh();
hand(0,6);hand(1,8);baselineA();
q=endTurnOpen();drive();
ok('H2: 6 cards — no choice; the turn passes; the non-turn player keeps 8',!q&&gameState.turn===6&&gameState.players[0].hand.length===6&&gameState.players[1].hand.length>=8,JSON.stringify({q:!!q,turn:gameState.turn,h0:gameState.players[0].hand.length,h1:gameState.players[1].hand.length}));
audit('H2');

/* ===== I: 無限の手札 — no limit for either player while it is face-up ===== */
fresh();
let inf=up('無限の手札',0);gameState.players[0].sz=[inf];hand(0,9);baselineA();
q=endTurnOpen();drive();
ok('I1: 無限の手札 face-up — 9 cards, no choice; the turn passes with 9',!q&&gameState.turn===6&&gameState.players[0].hand.length===9,JSON.stringify({q:!!q,n:gameState.players[0].hand.length}));
audit('I1');
fresh();
inf=setT('無限の手札',0);gameState.players[0].sz=[inf];hand(0,7);baselineA();
q=endTurnOpen();
ok('I2: Set (face-down) 無限の手札 does not apply — 7 cards ask for 1 discard',!!q&&q.min===1,JSON.stringify(q&&{min:q.min}));
answerUids([gameState.players[0].hand[0].uid]);
ok('I2: after the discard the turn passes',gameState.turn===6&&gameState.players[0].hand.length===6);
audit('I2');

/* ===== F: 衰弱の霧 — the opponent's limit is 5 ===== */
fresh();
let fog=up('衰弱の霧',1);gameState.players[1].sz=[fog];hand(0,6);baselineA();
q=endTurnOpen();
ok('F1: under the opponent’s 衰弱の霧, 6 cards ask for 1 discard (limit 5)',!!q&&q.player===0&&q.min===1,JSON.stringify(q&&{p:q.player,min:q.min}));
answerUids([gameState.players[0].hand[3].uid]);
ok('F1: 5 cards left; the turn passes',gameState.players[0].hand.length===5&&gameState.turn===6);
audit('F1');
fresh();
fog=up('衰弱の霧',0);gameState.players[0].sz=[fog];hand(0,6);baselineA();
q=endTurnOpen();drive();
ok('F2: its controller is not limited — 6 cards, no choice',!q&&gameState.turn===6&&gameState.players[0].hand.length===6,JSON.stringify({q:!!q}));
audit('F2');

/* ===== S: ヒエログリフの石版 — pay 1000; this player's limit is 7 for the rest of the duel ===== */
fresh();
let hs=mk('ヒエログリフの石版',0);let h7=hand(0,7);gameState.players[0].hand=[hs].concat(h7);baselineA();
cast(0,'ヒエログリフの石版');
ok('S1: activated — 1000 LP paid, the card in the GY',lp(0)===7000&&z(hs)==='grave',JSON.stringify({lp0:lp(0),hs:z(hs)}));
q=endTurnOpen();drive();
ok('S1: 7 cards at the end of the turn — no choice (limit 7)',!q&&gameState.turn===6&&gameState.players[0].hand.length===7,JSON.stringify({q:!!q,n:gameState.players[0].hand.length}));
/* two turns later (its next turn): 8 cards → discard 1; the flag lasts for the duel */
nextTurn();
requestProcessorV27(PROCESSOR_V27.DRAW,{player:0});drive();   /* its normal draw */
const extra=gameState.players[0].hand.length;
q=endTurnOpen();
ok('S2: on its next turn (8 cards after the draw) — 1 discard (the limit stays 7)',extra===8&&!!q&&q.player===0&&q.min===1,JSON.stringify({extra,q:q&&{p:q.player,min:q.min}}));
answerUids([gameState.players[0].hand[0].uid]);
ok('S2: 7 left; the turn passes',gameState.players[0].hand.length===7&&gameState.activePlayer===1);
audit('S1-S2');
fresh();
hs=mk('ヒエログリフの石版',0);gameState.players[0].hand=[hs];gameState.players[0].lp=900;baselineA();
ok('S3: with 900 LP it cannot be activated',!legalHand('ヒエログリフの石版',0,0).ok,JSON.stringify(legalHand('ヒエログリフの石版',0,0)));
`);
