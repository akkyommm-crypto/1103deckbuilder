/* S03-U274: extra Normal Summons — 二重召喚 (a second Normal Summon or Set), 氷結界の虎将 グルナード (an extra summon of a 「氷結界」 monster) (2011 texts).
   Real DUEL paths (activation, Normal Summon / Set / extra summon through the legal hand actions), Replay-audited. */
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
function acts(p,c){const i=gameState.players[p].hand.indexOf(C(c));return i<0?[]:getLegalHandActions(p,i).map(x=>x.id);}
function hi(p,c){return gameState.players[p].hand.indexOf(C(c));}
function summon(c){doNormalSummon(hi(0,c),'atk');drive();}
function setM(c){doSetMonsterLegal(hi(0,c));drive();}
function extraKey(c){const i=hi(0,c);const a=getLegalHandActions(0,i).find(x=>x.id==='extraNormalSummon');if(!a)return null;const m=/,"([^"]*)"\)|,'([^']*)'\)/.exec(a.run);return m?(m[1]||m[2]):null;}
function extraSummon(c){const k=extraKey(c);if(!k)return false;doExtraNormalSummonV370(hi(0,c),k);drive();return true;}

/* ===== D: 二重召喚 — up to 2 Normal Summons (or Sets) this turn ===== */
fresh();
let ds=mk('二重召喚',0),w1=mk('ワイト',0),w2=mk('ワイト',0),w3=mk('ワイト',0);gameState.players[0].hand=[ds,w1,w2,w3];baselineA();
cast(0,'二重召喚');
ok('D1: 二重召喚 resolves (to the GY)',z(ds)==='grave');
summon(w1);
ok('D1: after the first Normal Summon, a second Normal Summon and a Set are still offered',z(w1)==='mz'&&acts(0,w2).includes('normalSummon')&&acts(0,w2).includes('setMonster'),JSON.stringify({w1:z(w1),a:acts(0,w2)}));
summon(w2);
ok('D1: the second Normal Summon succeeds',z(w2)==='mz'&&gameState.players[0].mz.length===2);
ok('D1: no third Normal Summon / Set',!acts(0,w3).includes('normalSummon')&&!acts(0,w3).includes('setMonster'),JSON.stringify(acts(0,w3)));
audit('D1');
/* D2: the second one may be a Set; activated after the first summon */
fresh();
ds=mk('二重召喚',0);w1=mk('ワイト',0);w2=mk('ワイト',0);gameState.players[0].hand=[ds,w1,w2];baselineA();
summon(w1);
ok('D2: without 二重召喚, after a Normal Summon no Set is offered',!acts(0,w2).includes('setMonster')&&!acts(0,w2).includes('normalSummon'),JSON.stringify(acts(0,w2)));
cast(0,'二重召喚');
setM(w2);
ok('D2: 二重召喚 after the first summon — the second is a Set (face-down Defense)',z(w2)==='mz'&&C(w2).face==='down'&&C(w2).pos==='def',JSON.stringify({z:z(w2),f:C(w2)&&C(w2).face}));
audit('D2');
/* D3: a second 二重召喚 the same turn cannot be activated (no third summon) */
fresh();
ds=mk('二重召喚',0);let ds2=mk('二重召喚',0);w1=mk('ワイト',0);gameState.players[0].hand=[ds,ds2,w1];baselineA();
cast(0,'二重召喚');
ok('D3: a second 二重召喚 this turn is not legal',!legalHand('二重召喚',0,gameState.players[0].hand.indexOf(C(ds2))).ok);
/* the next turn the right is gone */
summon(w1);nextTurn();nextTurn();
const w4=gameState.players[0].hand.find(c=>cardName(c)==='ワイト');
ok('D3: two turns later the flag is gone (one Normal Summon again)',gameState.activePlayer===0&&!(gameState.players[0].temporaryFlags||{}).doubleSummonS03,JSON.stringify({ap:gameState.activePlayer,tf:gameState.players[0].temporaryFlags}));
audit('D3');

/* ===== G: 氷結界の虎将 グルナード — once per turn, an extra Normal Summon of a 「氷結界」 monster ===== */
fresh();
let gr=up('氷結界の虎将 グルナード',0),ib1=mk('氷結界の武士',0),ib2=mk('氷結界の武士',0),wt=mk('ワイト',0);gameState.players[0].mz=[gr];gameState.players[0].hand=[wt,ib1,ib2];baselineA();
ok('G1: a 「氷結界」 monster in the hand gets the extra summon; ワイト does not',!!extraKey(ib1)&&!extraKey(wt),JSON.stringify({ib:extraKey(ib1),wt:extraKey(wt)}));
summon(wt);
ok('G1: after the Normal Summon of ワイト, 氷結界の武士 can still be summoned (the extra right)',z(wt)==='mz'&&!!extraKey(ib1)&&!acts(0,ib1).includes('normalSummon'),JSON.stringify({a:acts(0,ib1)}));
ok('G1: the extra summon succeeds',extraSummon(ib1)&&z(ib1)==='mz'&&C(ib1).face==='up',JSON.stringify({z:z(ib1)}));
ok('G1: only once per turn — the second 氷結界の武士 gets nothing',!extraKey(ib2)&&!acts(0,ib2).includes('normalSummon'),JSON.stringify(acts(0,ib2)));
audit('G1');
/* G2: the extra right can be used first; the Normal Summon stays available */
fresh();
gr=up('氷結界の虎将 グルナード',0);ib1=mk('氷結界の武士',0);wt=mk('ワイト',0);gameState.players[0].mz=[gr];gameState.players[0].hand=[ib1,wt];baselineA();
ok('G2: the extra summon first',extraSummon(ib1)&&z(ib1)==='mz');
ok('G2: the ordinary Normal Summon is still available',acts(0,wt).includes('normalSummon'),JSON.stringify(acts(0,wt)));
summon(wt);
ok('G2: ワイト Normal Summoned too',z(wt)==='mz'&&gameState.players[0].mz.length===3);
audit('G2');
/* G3: face-down グルナード grants nothing */
fresh();
gr=mk('氷結界の虎将 グルナード',0,'down');gr.pos='def';ib1=mk('氷結界の武士',0);gameState.players[0].mz=[gr];gameState.players[0].hand=[ib1];baselineA();
ok('G3: face-down — no extra summon',!extraKey(ib1));
`);
