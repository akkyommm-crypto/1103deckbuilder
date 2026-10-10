/* S03-U253: per-turn activation record (engine/1B) — ナチュル・スパイダーファング; 「通常召喚できない。「X」の効果で特殊召喚できる」 (engine/1ZK) —
   ハーピィ・レディ三姉妹. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
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
function cast(p,name,prefer){const i=gameState.players[p].hand.findIndex(c=>cardName(c)===name);PREFER=(prefer||[]).slice();duelActivateFromHand(i);drive();PREFER=[];}
function attack(c){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:findCardByUid(c.uid).index,target:'direct'});drive();}
function rec(p){const t=gameState.players[p].temporaryFlags;return (t&&t.activatedKindsS03)||{};}

/* ===== A: ナチュル・スパイダーファング — no attack until the opponent activates something this turn ===== */
fresh();
let sf=up('ナチュル・スパイダーファング',0),wt=up('ワイト',0),jar=mk('強欲な瓶',1,'down');jar.setTurn=3;
gameState.players[0].mz=[sf,wt];gameState.players[1].sz=[jar];gameState.phase='battle';baselineA();
attack(sf);
ok('A: the opponent has activated nothing — スパイダーファング cannot declare an attack',lp(1)===8000&&!C(sf).attacked,JSON.stringify({lp1:lp(1),att:C(sf).attacked}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:findCardByUid(wt.uid).index,target:'direct'});
let used=false;
for(let i=0;i<80;i++){
  if(step())continue;
  const w=gameState.processorWaiting;
  if(!used&&w&&w.type==='POINT'&&gameState.processorPaused&&offered(1,jar)){ used=true; pointActivateV27(1,'sz',0); continue; }
  if(drive()==='idle')break; }
drive();
ok('A: the opponent activates 強欲な瓶 (a Trap) during the attack of ワイト — recorded for that player',used&&z(jar)==='grave'&&rec(1).trap===true&&!rec(0).trap,JSON.stringify({used,jar:z(jar),r1:rec(1),r0:rec(0)}));
attack(sf);
ok('A: now スパイダーファング attacks directly (300 + 2100)',lp(1)===8000-300-2100,JSON.stringify({lp1:lp(1)}));
audit('A');

/* ===== A2: its controller's own activation does not count ===== */
fresh();
sf=up('ナチュル・スパイダーファング',0);gameState.players[0].mz=[sf];gameState.players[0].hand=[mk('強欲な壺',0)];baselineA();
cast(0,'強欲な壺');
ok('A2: own 強欲な壺 recorded for its controller only',rec(0).spell===true&&!rec(1).spell,JSON.stringify({r0:rec(0),r1:rec(1)}));
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'battle'});drive();
attack(sf);
ok('A2: スパイダーファング still cannot attack',lp(1)===8000);
audit('A2');

/* ===== A3: the record belongs to this turn — a new turn clears it ===== */
fresh();
gameState.players[1].temporaryFlags={activatedKindsS03:{monster:true}};sf=up('ナチュル・スパイダーファング',0);gameState.players[0].mz=[sf];gameState.phase='end';baselineA();
requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('A3: next turn — the old record is gone',gameState.turn===6&&!rec(1).monster,JSON.stringify({turn:gameState.turn,r1:rec(1)}));

/* ===== B: ハーピィ・レディ三姉妹 — only 万華鏡 summons it; once properly summoned, 死者蘇生 can revive it ===== */
fresh();
let sis=mk('ハーピィ・レディ三姉妹',0);gameState.players[0].hand=[sis];baselineA();
ok('B: no Normal Summon method',normalSummonMethodsFor(dbOf(C(sis)),0,'summon').length===0);
const other=API.specialSummon(0,'hand',0,'atk','リミッター解除');
ok('B: another effect cannot Special Summon it from the hand',!other&&z(sis)==='hand',JSON.stringify({other,z:z(sis)}));
fresh();
let hl=up('ハーピィ・レディ',0);sis=mk('ハーピィ・レディ三姉妹',0);gameState.players[0].mz=[hl];gameState.players[0].deck.push(sis);gameState.players[0].hand=[mk('万華鏡－華麗なる分身－',0)];baselineA();
cast(0,'万華鏡－華麗なる分身－',[sis.uid]);
ok('B: 万華鏡 Special Summons it from the Deck (properly summoned)',z(sis)==='mz'&&C(sis).properlySummonedS03===true,JSON.stringify({z:z(sis),p:C(sis)&&C(sis).properlySummonedS03}));
gameState.players[0].hand=[mk('ブラック・ホール',0),mk('死者蘇生',0)];ensureAllCardUids(gameState);baselineA();
cast(0,'ブラック・ホール');
ok('B: destroyed by ブラック・ホール',z(sis)==='grave');
cast(0,'死者蘇生',[sis.uid]);
ok('B: 死者蘇生 revives it (properly summoned before)',z(sis)==='mz',JSON.stringify({z:z(sis),t:TOASTS.slice(-2)}));
audit('B');
/* ===== C: マシンナーズ・スナイパー — neither player can attack a 「マシンナーズ」 monster other than the Sniper (engine/1ZU both-players flag) ===== */
fresh();
let sn=up('マシンナーズ・スナイパー',0),be=up('青眼の白龍',0),so=up('マシンナーズ・ソルジャー',1),w1=up('ワイト',1);
gameState.players[0].mz=[sn,be];gameState.players[1].mz=[so,w1];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:1,target:0});drive();
ok('C: its own controller cannot attack the opponent\'s マシンナーズ・ソルジャー',z(so)==='mz'&&lp(1)===8000&&!C(be).attacked,JSON.stringify({so:z(so),lp1:lp(1)}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:1,target:findCardByUid(w1.uid).index});drive();
ok('C: a non-マシンナーズ monster can still be attacked',z(w1)==='grave',JSON.stringify({w1:z(w1)}));
audit('C');
fresh();
sn=up('マシンナーズ・スナイパー',0);let so0=up('マシンナーズ・ソルジャー',0),be1=up('青眼の白龍',1);
gameState.players[0].mz=[sn,so0];gameState.players[1].mz=[be1];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('C2: the opponent cannot attack マシンナーズ・ソルジャー either',z(so0)==='mz'&&!C(be1).attacked,JSON.stringify({so0:z(so0)}));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C2: the Sniper itself can be attacked',z(sn)==='grave',JSON.stringify({sn:z(sn)}));
audit('C2');
fresh();
so=up('マシンナーズ・ソルジャー',1);be=up('青眼の白龍',0);gameState.players[0].mz=[be];gameState.players[1].mz=[so];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('C3 control: without the Sniper, マシンナーズ・ソルジャー is attacked and destroyed',z(so)==='grave');
`);
