/* S03-U216: NOT_STARTED → TESTED — 波動キャノン, 道連れ, 炎塵爆発, 猛吹雪. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(!q)return false;
  if(q.max>1){const keys=q.candidates.filter(x=>PREFER.includes(x.uid)).map(x=>x.key).slice(0,q.max);answerChoiceV49(keys.length?keys:[q.candidates[0].key]);return true;}
  let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}

/* ===== A: 波動キャノン — activation stamps its turn; later (cost: send it) 1000 × the controller's Standby Phases since then ===== */
fresh();
let wc=mk('波動キャノン',0);gameState.players[0].hand=[wc];baselineA();
duelActivateFromHand(0);drive();
ok('A: activated — face-up, its activation turn recorded',z(wc)==='sz'&&C(wc).face==='up'&&C(wc).waveTurnS03===5);
ok('A: fired in the same turn — no Standby Phase has passed (0 damage)',(function(){duelActivateFromZone(0,'sz',0);drive();return z(wc)==='grave'&&lp(1)===8000;})());
audit('A');
fresh();
wc=mk('波動キャノン',0,'up');wc.waveTurnS03=1;gameState.players[0].sz=[wc];baselineA();
duelActivateFromZone(0,'sz',0);drive();
ok('A2: activated in turn 1, fired in turn 5 — two own Standby Phases (3, 5): 2000 damage; the card sent (cost)',z(wc)==='grave'&&lp(1)===6000,JSON.stringify({lp:lp(1),wc:z(wc)}));
ok('A2: the send is a cost (before CHAIN_ADD)',(function(){const a=v41ReplayPackage(gameState).actions.map(x=>x.action||x);const iG=a.findIndex(x=>x.type==='FX_TO_GRAVE'),iC=a.findIndex(x=>x.type==='CHAIN_ADD');return iG>=0&&iC>iG;})());
audit('A2');

/* ===== B: 道連れ — a monster of its controller destroyed by battle: destroy a targeted field monster ===== */
fresh();
let cp=mk('道連れ',0,'down');cp.setTurn=4;let wt=mk('ワイト',0,'up'),be=mk('青眼の白龍',1,'up');
gameState.players[0].sz=[cp];gameState.players[0].mz=[wt];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
PREFER=[be.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();PREFER=[];
ok('B: ワイト destroyed → 道連れ destroys 青眼の白龍',z(wt)==='grave'&&z(be)==='grave'&&z(cp)==='grave',JSON.stringify({be:z(be),cp:z(cp),TRIG}));
audit('B');
fresh();
cp=mk('道連れ',0,'down');cp.setTurn=4;let ow=mk('ワイト',1,'up');be=mk('青眼の白龍',0,'up');
gameState.players[0].sz=[cp];gameState.players[0].mz=[be];gameState.players[1].mz=[ow];gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B2: the opponent\'s monster to its own GY — no activation',z(ow)==='grave'&&z(cp)==='sz'&&!TRIG.some(t=>/道連れ/.test(t)));

/* ===== C: 炎塵爆発 — banish all 「ラヴァル」 from the GY (cost): destroy up to that many field cards ===== */
fresh();
let db=mk('炎塵爆発',0,'down');db.setTurn=4;let l1=mk('ラヴァルのマグマ砲兵',0),l2=mk('ラヴァルの炎車回し',0),o1=mk('ワイト',1,'up'),o2=mk('サイクロン',1,'down'),o3=mk('ワイト',1,'up');
gameState.players[0].sz=[db];gameState.players[0].grave=[l1,l2];gameState.players[1].mz=[o1,o3];gameState.players[1].sz=[o2];baselineA();
PREFER=[o1.uid,o2.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('C: both 「ラヴァル」 banished; 2 chosen cards destroyed; the third stays',z(l1)==='banish'&&z(l2)==='banish'&&z(o1)==='grave'&&z(o2)==='grave'&&z(o3)==='mz',JSON.stringify({o1:z(o1),o2:z(o2),o3:z(o3)}));
audit('C');
fresh();
db=mk('炎塵爆発',0,'down');db.setTurn=4;gameState.players[0].sz=[db];gameState.players[1].mz=[mk('ワイト',1,'up')];baselineA();
ok('C2: no 「ラヴァル」 in the GY — not activatable',strictScriptLegalityV2('炎塵爆発',0,'sz',0,{}).ok===false);

/* ===== D: 猛吹雪 — its controller's Trap destroyed by the opponent's card effect: destroy a Spell / Trap on the field ===== */
fresh();
let bz=mk('猛吹雪',0,'down');bz.setTurn=4;let gk=mk('激流葬',0,'down');gk.setTurn=4;let cy=mk('サイクロン',1),ob=mk('ブラック・ホール',1,'down');ob.setTurn=4;
gameState.players[0].sz=[bz,gk];gameState.players[1].hand=[cy];gameState.players[1].sz=[ob];gameState.activePlayer=1;baselineA();
PREFER=[gk.uid,ob.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D: サイクロン destroys 激流葬 → 猛吹雪 destroys the opponent\'s set ブラック・ホール',z(gk)==='grave'&&z(ob)==='grave'&&z(bz)==='grave',JSON.stringify({gk:z(gk),ob:z(ob),bz:z(bz),TRIG}));
audit('D');
fresh();
bz=mk('猛吹雪',0,'down');bz.setTurn=4;gk=mk('激流葬',0,'down');gk.setTurn=4;cy=mk('サイクロン',0);ob=mk('ブラック・ホール',1,'down');ob.setTurn=4;
gameState.players[0].sz=[bz,gk];gameState.players[0].hand=[cy];gameState.players[1].sz=[ob];baselineA();TRIG.length=0;
PREFER=[gk.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('D2: its own サイクロン destroys 激流葬 — no activation',z(gk)==='grave'&&z(bz)==='sz'&&z(ob)==='sz');
`);
