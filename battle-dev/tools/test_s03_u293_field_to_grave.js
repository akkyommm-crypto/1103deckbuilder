/* S03-U293: monsters sent from the field to the GY together (engine/1ZZN onFieldToGraveBatchS03; also in the battle cleanup batch); the summaries
   are part of the leave-field batch (one SEGOC with the per-card triggers) — 死の演算盤, バックファイア (2011 texts). Real DUEL paths, Replay-audited. */
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
const CA='死の演算盤',BF='バックファイア',AN='グレート・アンガス',GW='ギガテック・ウルフ',WT='ワイト';
function sumEvents(kind){return (gameState.eventLogS03||[]).filter(e=>e.eventName===kind);}
let S0,S1,t,w,ha,nb,gb;

const CHL=[];const __cp=chainPassV2;chainPassV2=function(){CHL.push(gameState.chain.map(l=>l.name));return __cp.apply(this,arguments);};
function battle(){gameState.phase='battle';}
function atk(p,a,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:idx(a),target:target==='direct'?'direct':idx(target)});drive();}
function setM(n,p){const c=mk(n,p,'down');c.pos='def';return c;}
let ca,bf,a0,a1,a2,b0,b1;

/* ===== C: 死の演算盤 — each time monsters on the field are sent to the GY, each owner takes 500 per own monster ===== */
/* C1: ブラック・ホール destroys 1 + 2 monsters (one face-down) — one trigger; P0 500, P1 1000 */
fresh();
ca=up(CA,0);gameState.players[0].sz=[ca];gameState.players[0].mz=[up(WT,0)];gameState.players[1].mz=[up(WT,1),setM(WT,1)];gameState.players[0].hand=[mk('ブラック・ホール',0)];base();
cast(0,'ブラック・ホール');
ok('C1: 3 monsters destroyed together — one forced trigger; the controller 500 (1 own), the opponent 1000 (2, a face-down one too)',lp(0)===7500&&lp(1)===7000&&trigNamed(CA).length===1,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('C1');
/* C2: battle — the opponent's monster destroyed by battle: its owner takes 500 besides the battle damage */
fresh();battle();
ca=up(CA,0);a0=up(AN,0);a1=up(WT,1);gameState.players[0].sz=[ca];gameState.players[0].mz=[a0];gameState.players[1].mz=[a1];base();
atk(0,a0,a1);
ok('C2: battle destruction — 1500 battle damage + 500 to the owner of the destroyed monster',z(a1)==='grave'&&lp(1)===6000&&lp(0)===8000&&trigNamed(CA).length===1,JSON.stringify({a1:z(a1),lp:[lp(0),lp(1)],TRIG}));
audit('C2');
/* C3: both monsters destroyed by battle at once — one trigger, 500 each */
fresh();battle();
ca=up(CA,0);a0=up(AN,0);a1=up(AN,1);gameState.players[0].sz=[ca];gameState.players[0].mz=[a0];gameState.players[1].mz=[a1];base();
atk(0,a0,a1);
ok('C3: mutual battle destruction — one trigger, 500 to each owner',z(a0)==='grave'&&z(a1)==='grave'&&lp(0)===7500&&lp(1)===7500&&trigNamed(CA).length===1,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('C3');
/* C4: a Tribute is sent to the GY too (not destroyed) — its owner takes 500 */
fresh();
ca=up(CA,0);a0=up(WT,0);gameState.players[0].sz=[ca];gameState.players[0].mz=[a0];gameState.players[0].hand=[mk('アイツ',0)];base();
PREFER=[a0.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('C4: Tribute Summon — the Tributed monster went to the GY: 500 to its owner',z(a0)==='grave'&&lp(0)===7500&&trigNamed(CA).length===1,JSON.stringify({a0:z(a0),lp:lp(0),TRIG}));
audit('C4');
/* C5: negative — a Spell / Trap card sent to the GY (サイクロン on a set Trap) is not a monster: no trigger */
fresh();
ca=up(CA,0);b1=setT('落とし穴',1);gameState.players[0].sz=[ca];gameState.players[1].sz=[b1];gameState.players[0].hand=[mk('サイクロン',0)];base();
cast(0,'サイクロン',[b1.uid]);
ok('C5: negative — a Trap card destroyed: no trigger, no damage',z(b1)==='grave'&&lp(0)===8000&&lp(1)===8000&&!trigNamed(CA).length,JSON.stringify({b1:z(b1),lp:[lp(0),lp(1)],TRIG}));
audit('C5');
/* C6: negative — set face-down: no trigger */
fresh();
ca=setT(CA,0);gameState.players[0].sz=[ca];gameState.players[1].mz=[up(WT,1)];gameState.players[0].hand=[mk('ブラック・ホール',0)];base();
cast(0,'ブラック・ホール');
ok('C6: negative — 死の演算盤 face-down: no damage',lp(1)===8000&&!trigNamed(CA).length,JSON.stringify({lp:lp(1),TRIG}));
audit('C6');
/* C7: the summary is part of the same event batch — クリッター (destroyed together) and 死の演算盤 are on one chain */
fresh();
ca=up(CA,0);const cr=up('クリッター',0);gameState.players[0].sz=[ca];gameState.players[0].mz=[cr];gameState.players[1].mz=[up(WT,1)];gameState.players[0].hand=[mk('ブラック・ホール',0)];base();
CHL.length=0;cast(0,'ブラック・ホール');
const both=CHL.some(c=>c.indexOf('クリッター')>=0&&c.indexOf(CA)>=0);
ok('C7: one SEGOC — the trigger of クリッター and 死の演算盤 are chained together (not one chain after the other)',both&&lp(0)===7500&&lp(1)===7500,JSON.stringify({CHL,lp:[lp(0),lp(1)]}));
audit('C7');

/* ===== B: バックファイア — each time face-up FIRE monsters on its controller's field are destroyed and sent to the GY: 500 to the opponent ===== */
/* B1: the opponent's サンダー・ボルト destroys 2 face-up FIRE monsters — one trigger, 500 */
fresh();gameState.activePlayer=1;gameState.turn=6;
bf=up(BF,0);gameState.players[0].sz=[bf];gameState.players[0].mz=[up(AN,0),up(GW,0)];gameState.players[1].hand=[mk('サンダー・ボルト',1)];base();
cast(1,'サンダー・ボルト');
ok('B1: 2 face-up FIRE monsters destroyed together — one trigger, 500 to the opponent',gameState.players[0].grave.length===2&&lp(1)===7500&&lp(0)===8000&&trigNamed(BF).length===1,JSON.stringify({lp:[lp(0),lp(1)],TRIG}));
audit('B1');
/* B2: negative — a face-down FIRE monster and a face-up DARK one destroyed: no trigger */
fresh();gameState.activePlayer=1;gameState.turn=6;
bf=up(BF,0);gameState.players[0].sz=[bf];gameState.players[0].mz=[setM(AN,0),up(WT,0)];gameState.players[1].hand=[mk('サンダー・ボルト',1)];base();
cast(1,'サンダー・ボルト');
ok('B2: negative — face-down FIRE / face-up DARK destroyed: no trigger',gameState.players[0].grave.length===2&&lp(1)===8000&&!trigNamed(BF).length,JSON.stringify({lp:lp(1),TRIG}));
audit('B2');
/* B3: negative — a FIRE monster Tributed (sent to the GY, not destroyed): no trigger */
fresh();
bf=up(BF,0);a0=up(AN,0);gameState.players[0].sz=[bf];gameState.players[0].mz=[a0];gameState.players[0].hand=[mk('アイツ',0)];base();
PREFER=[a0.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('B3: negative — Tributed, not destroyed: no trigger',z(a0)==='grave'&&lp(1)===8000&&!trigNamed(BF).length,JSON.stringify({a0:z(a0),lp:lp(1),TRIG}));
audit('B3');
/* B4: destroyed by battle (the opponent attacks) — 500 to the opponent */
fresh();gameState.activePlayer=1;gameState.turn=6;battle();
bf=up(BF,0);b0=up(GW,0);a1=up(AN,1);gameState.players[0].sz=[bf];gameState.players[0].mz=[b0];gameState.players[1].mz=[a1];base();
atk(1,a1,b0);
ok('B4: own FIRE monster destroyed by battle — 600 battle damage to me, 500 to the opponent',z(b0)==='grave'&&lp(0)===7400&&lp(1)===7500&&trigNamed(BF).length===1,JSON.stringify({b0:z(b0),lp:[lp(0),lp(1)],TRIG}));
audit('B4');
/* B5: negative — the opponent's FIRE monster destroyed: not on my field, no trigger */
fresh();
bf=up(BF,0);a1=up(AN,1);gameState.players[0].sz=[bf];gameState.players[1].mz=[a1];gameState.players[0].hand=[mk('サンダー・ボルト',0)];base();
cast(0,'サンダー・ボルト');
ok('B5: negative — the opponent FIRE monster destroyed: no trigger',z(a1)==='grave'&&lp(1)===8000&&!trigNamed(BF).length,JSON.stringify({lp:lp(1),TRIG}));
audit('B5');

/* ===== E: the summary contents ===== */
fresh();
gameState.players[0].mz=[up(AN,0)];gameState.players[1].mz=[up(WT,1),setM(WT,1)];gameState.players[0].hand=[mk('ブラック・ホール',0)];base();
const SUMS=[],origReduce=(typeof eventSummaryReduceS03==='function')?eventSummaryReduceS03:null;
if(origReduce) eventSummaryReduceS03=function(gs){const before=(gs.deferredEvents||[]).slice();origReduce(gs);(gs.deferredEvents||[]).filter(x=>before.indexOf(x)<0).forEach(x=>SUMS.push(JSON.parse(JSON.stringify(x))));};
cast(0,'ブラック・ホール');if(origReduce) eventSummaryReduceS03=origReduce;
const fs=SUMS.filter(x=>x.eventName==='onFieldToGraveBatchS03');
const it=fs.length===1?fs[0].evt.items:[];
ok('E1: one onFieldToGraveBatchS03 — count 3 (owner 0: 1, owner 1: 2); the FIRE face-up item keeps its Attribute, controller and destruction',fs.length===1&&fs[0].evt.count===3&&fs[0].evt.count0===1&&fs[0].evt.count1===2&&it.some(x=>x.attr==='炎'&&x.face==='up'&&x.ctrl===0&&x.byDestroy===true)&&it.filter(x=>x.face==='down').length===1,JSON.stringify(SUMS));
audit('E1');
`);
