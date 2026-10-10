/* S03-U222: NOT_STARTED → TESTED — 真紅眼の不死竜, ラヴァル・ウォリアー, ラヴァル炎樹海の妖女, 天界王 シナト, 対抗魔術, 闇の幻影.
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
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

/* ===== A: 真紅眼の不死竜 — Tribute Summon with 1 Zombie; destroys a Zombie by battle: it comes to its own field ===== */
fresh();
let ud=mk('真紅眼の不死竜',0),wt=mk('ワイト',0,'up');gameState.players[0].hand=[ud];gameState.players[0].mz=[wt];baselineA();
PREFER=[wt.uid];doNormalSummon(0,'atk');drive();PREFER=[];
ok('A: Tribute Summoned with 1 Zombie',z(ud)==='mz'&&z(wt)==='grave');
audit('A');
fresh();
ud=mk('真紅眼の不死竜',0,'up');let oz=mk('ワイト',1,'up');gameState.players[0].mz=[ud];gameState.players[1].mz=[oz];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A2: the opponent\'s ワイト destroyed → special summoned to its field',z(oz)==='mz'&&findCardByUid(oz.uid).p===0,JSON.stringify({oz:z(oz),TRIG}));
audit('A2');
fresh();
ud=mk('真紅眼の不死竜',0,'up');let nz=mk('セイバーザウルス',1,'up');gameState.players[0].mz=[ud];gameState.players[1].mz=[nz];gameState.phase='battle';baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('A3: a non-Zombie destroyed — no activation',z(nz)==='grave'&&!TRIG.some(t=>/不死竜/.test(t)));

/* ===== B: ラヴァル・ウォリアー — destroys a monster by battle with 4+ 「ラヴァル」 kinds in the GY: its original ATK as damage ===== */
fresh();
let lw=mk('ラヴァル・ウォリアー',0,'up');oz=mk('ワイト',1,'up');
gameState.players[0].mz=[lw];gameState.players[0].grave=['ラヴァルのマグマ砲兵','ラヴァルの炎車回し','ラヴァルバル・イグニス','ラヴァルバル・ドラゴン'].map(n=>mk(n,0));
gameState.players[1].mz=[oz];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B: 1500 battle damage + 300 (ワイト original ATK)',lp(1)===8000-1500-300,JSON.stringify({lp:lp(1),TRIG}));
audit('B');
fresh();
lw=mk('ラヴァル・ウォリアー',0,'up');oz=mk('ワイト',1,'up');
gameState.players[0].mz=[lw];gameState.players[0].grave=['ラヴァルのマグマ砲兵','ラヴァルの炎車回し','ラヴァルバル・イグニス','ラヴァルのマグマ砲兵'].map(n=>mk(n,0));
gameState.players[1].mz=[oz];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('B2: only 3 kinds — no extra damage',lp(1)===8000-1500);

/* ===== C: ラヴァル炎樹海の妖女 — sent from the field to the GY: own 「ラヴァル」 +200 per 「ラヴァル」 in the GY, until the End Phase ===== */
fresh();
let fl=mk('ラヴァル炎樹海の妖女',0,'up'),mg=mk('ラヴァルのマグマ砲兵',0,'up'),be=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[fl,mg];gameState.players[0].grave=[mk('ラヴァルの炎車回し',0)];gameState.players[1].mz=[be];gameState.activePlayer=1;gameState.phase='battle';baselineA();
const aC=curATK(C(mg));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: 妖女 destroyed → マグマ砲兵 +400 (2 「ラヴァル」 in the GY)',z(fl)==='grave'&&curATK(C(mg))===aC+400,JSON.stringify({a:curATK(C(mg)),aC,TRIG}));
audit('C');

/* ===== D: 天界王 シナト — destroys a Defense Position monster by battle: its original ATK as damage ===== */
fresh();
let sn=mk('天界王 シナト',0,'up');oz=mk('ワイト',1,'up','def');gameState.players[0].mz=[sn];gameState.players[1].mz=[oz];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('D: Defense ワイト destroyed → 300 damage',z(oz)==='grave'&&lp(1)===7700,JSON.stringify({lp:lp(1)}));
audit('D');
fresh();
sn=mk('天界王 シナト',0,'up');oz=mk('ワイト',1,'up');gameState.players[0].mz=[sn];gameState.players[1].mz=[oz];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('D2: an Attack Position monster — battle damage only',lp(1)===8000-3000);

/* ===== E: 対抗魔術 — remove 2 Spell Counters (cost): a Spell activation negated ===== */
fresh();
let cm=mk('対抗魔術',0,'down');cm.setTurn=4;let mp=mk('マジカルフィシアリスト',0,'up');mp.counters={'魔力':1};let bk=mk('魔導戦士 ブレイカー',0,'up');bk.counters={'魔力':1};
let mr=mk('死者蘇生',1),wg=mk('ワイト',1);
gameState.players[0].sz=[cm];gameState.players[0].mz=[mp,bk];gameState.players[1].hand=[mr];gameState.players[1].grave=[wg];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);
let w1=toWindow();const offE=w1&&offered(0,cm);if(offE)duelActivateResponseV2(0,'sz',0);drive();
ok('E: both counters removed (from two cards); 死者蘇生 negated and destroyed',offE&&!((C(mp).counters||{})['魔力'])&&!((C(bk).counters||{})['魔力'])&&z(mr)==='grave'&&z(wg)==='grave',JSON.stringify({offE,mp:C(mp).counters,bk:C(bk).counters,wg:z(wg)}));
audit('E');
fresh();
cm=mk('対抗魔術',0,'down');cm.setTurn=4;mp=mk('マジカルフィシアリスト',0,'up');mp.counters={'魔力':1};mr=mk('死者蘇生',1);
gameState.players[0].sz=[cm];gameState.players[0].mz=[mp];gameState.players[1].hand=[mr];gameState.players[1].grave=[mk('ワイト',1)];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);w1=toWindow();
ok('E2: only 1 counter — not offered',!(w1&&offered(0,cm)));

/* ===== F: 闇の幻影 — a Spell / Trap / monster effect activation targeting a face-up DARK monster: negated ===== */
fresh();
let di=mk('闇の幻影',0,'down');di.setTurn=4;let dk=mk('ワイト',0,'up'),mb=mk('月の書',1);
gameState.players[0].sz=[di];gameState.players[0].mz=[dk];gameState.players[1].hand=[mb];gameState.activePlayer=1;baselineA();
PREFER=[dk.uid];duelActivateFromHand(0);
w1=toWindow();const offF=w1&&offered(0,di);if(offF)duelActivateResponseV2(0,'sz',0);drive();
ok('F: 月の書 on the DARK ワイト negated; ワイト stays face-up',offF&&z(mb)==='grave'&&C(dk).face==='up');
audit('F');
fresh();
di=mk('闇の幻影',0,'down');di.setTurn=4;let lt=mk('青眼の白龍',0,'up');mb=mk('月の書',1);
gameState.players[0].sz=[di];gameState.players[0].mz=[lt];gameState.players[1].hand=[mb];gameState.activePlayer=1;baselineA();
PREFER=[lt.uid];duelActivateFromHand(0);w1=toWindow();
ok('F2: targeting a LIGHT monster — not offered',!(w1&&offered(0,di)));
`);
