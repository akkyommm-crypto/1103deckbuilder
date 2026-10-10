/* S03-U294: 「破壊した数」「破壊した場合」 use what the effect actually destroyed, after any optional substitute decision (engine/1ZZO API.afterDestroyS03) —
   サンダー・クラッシュ, グリフォンの羽根帚, 大波小波, 光帝クライス (and the converted scripts' own tests). Real DUEL paths, Replay-audited. */
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

function sumEvents(kind){return (gameState.eventLogS03||[]).filter(e=>e.eventName===kind);}
let S0,S1,t,w,ha,nb,gb;

const VP='M・HERO ヴェイパー',TT='宝玉獣 エメラルド・タートル',CAT='宝玉獣 アメジスト・キャット';
function decisionJob(){const p=gameState.pendingChoice;return p&&p.resume&&p.resume.args&&p.resume.args.job||null;}
function stepUntil(pred){for(let i=0;i<400;i++){if(pred())return true;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(step())continue;
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return pred();}return pred();}
let w0,vp,tt,t2,ct,kr;

/* ===== T: サンダー・クラッシュ / グリフォンの羽根帚 — 「破壊した数」 counts only what was destroyed ===== */
/* T1: M・HERO ヴェイパー is not destroyed by card effects — only 1 of 2 destroyed: 300 (was 600) */
fresh();
w0=up('ワイト',0);vp=up(VP,0);gameState.players[0].mz=[w0,vp];gameState.players[0].hand=[mk('サンダー・クラッシュ',0)];base();
cast(0,'サンダー・クラッシュ');
ok('T1: ヴェイパー survives; only the destroyed ワイト counts — 300 to the opponent',z(w0)==='grave'&&z(vp)==='mz'&&lp(1)===7700,JSON.stringify({w0:z(w0),vp:z(vp),lp:lp(1)}));
audit('T1');
/* T2: グリフォンの羽根帚 — 2 Spell / Trap cards destroyed: 1000 */
fresh();
gameState.players[0].sz=[setT('落とし穴',0),setT('落とし穴',0)];gameState.players[0].hand=[mk('グリフォンの羽根帚',0)];base();
cast(0,'グリフォンの羽根帚');
ok('T2: 2 own Spell / Trap cards destroyed — 1000 LP',lp(0)===9000&&gameState.players[0].grave.filter(c=>cardName(c)==='落とし穴').length===2,JSON.stringify({lp:lp(0)}));
audit('T2');

/* ===== W: 大波小波 — a deferred destruction (宝玉獣 placement decision) and an indestructible monster ===== */
/* W1: エメラルド・タートル (its owner decides: place it instead of the GY) and ヴェイパー (not destroyed by effects): 1 destroyed → up to 1 from the hand */
fresh();
tt=up(TT,0);vp=up(VP,0);t2=mk(TT,0);gameState.players[0].mz=[tt,vp];gameState.players[0].hand=[mk('大波小波',0),t2];base();
PREFER=[];duelActivateFromHand(0);
const opened=stepUntil(()=>{const p=gameState.pendingChoice;return !!(p&&p.resume&&p.resume.handler==='s03u173.destroy-sub');});
const job=decisionJob();
ok('W1: the substitute decision is open, and the 大波小波 continuation waits in its saved job',opened&&!!job&&Array.isArray(job.after)&&job.after.length===1&&job.after[0].h==='s03u294.tidal-after',JSON.stringify(job&&job.after));
PREFER=['place:'+tt.uid,t2.uid];drive();PREFER=[];
ok('W1: タートル destroyed and placed in the Spell & Trap Zone; ヴェイパー not destroyed; 1 destroyed → the WATER monster in the hand is Special Summoned',z(tt)==='sz'&&z(vp)==='mz'&&z(t2)==='mz',JSON.stringify({tt:z(tt),vp:z(vp),t2:z(t2)}));
audit('W1');
/* W2: the same, but the owner sends タートル to the GY: still 1 destroyed */
fresh();
tt=up(TT,0);vp=up(VP,0);t2=mk(TT,0);gameState.players[0].mz=[tt,vp];gameState.players[0].hand=[mk('大波小波',0),t2];base();
cast(0,'大波小波',['decline',t2.uid]);
ok('W2: タートル to the GY (declined placement) — 1 destroyed → 1 summoned',z(tt)==='grave'&&z(t2)==='mz',JSON.stringify({tt:z(tt),t2:z(t2)}));
audit('W2');
/* W3: negative — only ヴェイパー (not destroyed): nothing destroyed, no summon choice */
fresh();
vp=up(VP,0);t2=mk(TT,0);gameState.players[0].mz=[vp];gameState.players[0].hand=[mk('大波小波',0),t2];base();
cast(0,'大波小波',[t2.uid]);
ok('W3: negative — nothing destroyed: no Special Summon',z(vp)==='mz'&&z(t2)==='hand'&&!SEEN.some(x=>x.title.indexOf('大波小波：手札から')>=0),JSON.stringify({t2:z(t2)}));
audit('W3');

/* ===== K: 光帝クライス — a destroyed 宝玉獣 placed in the Spell & Trap Zone was destroyed: its controller may draw ===== */
fresh();
kr=mk('光帝クライス',0);w0=up('ワイト',0);ct=up(CAT,1);gameState.players[0].hand=[kr];gameState.players[0].mz=[w0];gameState.players[1].mz=[ct];base();
const h1=gameState.players[1].hand.length;
PREFER=[w0.uid,ct.uid,'place:'+ct.uid,'yes'];doNormalSummon(0,'atk');drive();PREFER=[];
ok('K1: アメジスト・キャット destroyed and placed (not in the GY) — it counts: the opponent drew 1',z(ct)==='sz'&&gameState.players[1].hand.length===h1+1,JSON.stringify({ct:z(ct),hand:gameState.players[1].hand.length-h1}));
audit('K1');
`);
