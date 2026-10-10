/* S03-U262: forced chain responses (engine/1P) — 死霊騎士デスカリバー・ナイト. Real DUEL paths (the chain window pass itself); Replay-audited. */
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
function ign(c,prefer){const h=findCardByUid(c.uid);PREFER=(prefer||[]).slice();duelActivateFromZone(h.p,'mz',h.index);drive();PREFER=[];}
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}

/* ===== A: the opponent's monster effect — 死霊騎士デスカリバー・ナイト is activated by force (passing is not possible), negates and destroys it ===== */
fresh();
let dk=up('死霊騎士デスカリバー・ナイト',0),a5=up('アームド・ドラゴン LV5',1),bb=mk('青眼の白龍',1),gw=up('ジェネティック・ワーウルフ',0);
gameState.players[0].mz=[dk,gw];gameState.players[1].mz=[a5];gameState.players[1].hand=[bb];gameState.activePlayer=1;baselineA();
ign(a5,[bb.uid,gw.uid]);
ok('A: デスカリバー released by force; LV5\'s activation negated and destroyed; its target survives (the cost was paid)',z(dk)==='grave'&&z(a5)==='grave'&&z(gw)==='mz'&&z(bb)==='grave',JSON.stringify({dk:z(dk),a5:z(a5),gw:z(gw),bb:z(bb)}));
audit('A');

/* ===== B: its controller's own monster effect too (「モンスターの効果が発動した時」, either player) ===== */
fresh();
dk=up('死霊騎士デスカリバー・ナイト',0);a5=up('アームド・ドラゴン LV5',0);bb=mk('青眼の白龍',0);gw=up('ジェネティック・ワーウルフ',1);
gameState.players[0].mz=[dk,a5];gameState.players[0].hand=[bb];gameState.players[1].mz=[gw];baselineA();
ign(a5,[bb.uid,gw.uid]);
ok('B: its controller\'s own LV5 effect is negated as well',z(dk)==='grave'&&z(a5)==='grave'&&z(gw)==='mz',JSON.stringify({dk:z(dk),a5:z(a5),gw:z(gw)}));
audit('B');

/* ===== C: a Spell activation does not trigger it; a face-down copy does nothing ===== */
fresh();
dk=up('死霊騎士デスカリバー・ナイト',0);gameState.players[0].mz=[dk];gameState.players[1].hand=[mk('強欲な壺',1)];gameState.activePlayer=1;baselineA();
cast(1,'強欲な壺');
ok('C: 強欲な壺 resolves (2 cards drawn); デスカリバー stays',z(dk)==='mz'&&gameState.players[1].hand.length===2);
audit('C');
fresh();
dk=mk('死霊騎士デスカリバー・ナイト',0,'down','def');a5=up('アームド・ドラゴン LV5',1);bb=mk('青眼の白龍',1);gw=up('ジェネティック・ワーウルフ',0);
gameState.players[0].mz=[dk,gw];gameState.players[1].mz=[a5];gameState.players[1].hand=[bb];gameState.activePlayer=1;baselineA();
ign(a5,[bb.uid,gw.uid]);
ok('C2: face-down — not activated; LV5 destroys ジェネティック・ワーウルフ',z(dk)==='mz'&&z(gw)==='grave'&&z(a5)==='mz',JSON.stringify({dk:z(dk),gw:z(gw)}));
`);
