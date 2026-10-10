/* S03-U268: destruction replacement 'equipInstead' (engine/1ZV + 1ZZG) — ドラグニティ－ジャベリン. Real DUEL paths (battle and an effect destruction); Replay-audited. */
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
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function hitT(p,a,t){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:findCardByUid(a.uid).index,target:findCardByUid(t.uid).index});drive();}

/* ===== A: ドラグニティ－ジャベリン destroyed by battle — equipped to the Winged Beast 「ドラグニティ」 instead of going to the GY ===== */
fresh();
let jv=up('ドラグニティ－ジャベリン',0),an=up('ドラグニティ－アングス',0),be=up('青眼の白龍',1);
gameState.players[0].mz=[jv,an];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
PREFER=['eq:'+an.uid];hitT(1,be,jv);PREFER=[];
ok('A: destroyed by battle, then an Equip Card of ドラグニティ－アングス in the Spell & Trap Zone (not in the GY)',z(jv)==='sz'&&C(jv).equipTo?.uid===an.uid&&C(jv).v46MonsterEquip===true&&(C(an).equippedBy||[]).indexOf(C(jv).equipUid)>=0,JSON.stringify({jv:z(jv),eq:C(jv)&&C(jv).equipTo}));
audit('A');

/* ===== B: destroyed by an effect (地割れ) — same choice; declining sends it to the GY ===== */
fresh();
jv=up('ドラグニティ－ジャベリン',0);an=up('ドラグニティ－アングス',0);
gameState.players[0].mz=[jv,an];gameState.players[1].hand=[mk('地割れ',1)];gameState.activePlayer=1;gameState.turn=6;baselineA();
PREFER=['eq:'+an.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: 地割れ destroys it — equipped to ドラグニティ－アングス',z(jv)==='sz'&&C(jv).equipTo?.uid===an.uid,JSON.stringify({jv:z(jv)}));
audit('B');
fresh();
jv=up('ドラグニティ－ジャベリン',0);an=up('ドラグニティ－アングス',0);
gameState.players[0].mz=[jv,an];gameState.players[1].hand=[mk('地割れ',1)];gameState.activePlayer=1;gameState.turn=6;baselineA();
PREFER=['decline'];duelActivateFromHand(0);drive();PREFER=[];
ok('B2: declined — sent to the GY',z(jv)==='grave');
audit('B2');

/* ===== C: no Winged Beast 「ドラグニティ」 (only a Dragon one) — no choice, to the GY ===== */
fresh();
jv=up('ドラグニティ－ジャベリン',0);let ak=up('ドラグニティ－アキュリス',0);be=up('青眼の白龍',1);
gameState.players[0].mz=[jv,ak];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.turn=6;gameState.phase='battle';baselineA();
hitT(1,be,jv);
ok('C: only ドラグニティ－アキュリス (Dragon) — sent to the GY',z(jv)==='grave'&&z(ak)==='mz');
audit('C');
`);
