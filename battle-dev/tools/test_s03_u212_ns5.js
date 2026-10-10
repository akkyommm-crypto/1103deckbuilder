/* S03-U212: NOT_STARTED → TESTED — ダーク・エルフ, BF－東雲のコチ, フレンドッグ, ヴォルカニック・リボルバー, ワーム・テンタクルス, 竜の尖兵, アテナ
   (engine: attackLpCostS03; a conditional cannotSynchroMaterial). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u||(x.card&&x.card.uid===u));if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function lp(p){return gameState.players[p].lp;}
function acts(){return v41ReplayPackage(gameState).actions.map(x=>x.action||x);}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function oppAttack(){gameState.activePlayer=1;gameState.phase='battle';}

/* ===== A: ダーク・エルフ — 1000 LP paid to attack; not enough LP → no attack ===== */
fresh();
let de=mk('ダーク・エルフ',0,'up');gameState.players[0].mz=[de];gameState.phase='battle';baselineA();
ok('A: can declare with 8000 LP',canDeclareAttackV48(C(de)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('A: 1000 LP paid at the declaration; 2000 damage',lp(0)===7000&&lp(1)===6000,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
ok('A: the payment is a cost Action before ATTACK_DECLARE_V48',(function(){const a=acts();const iL=a.findIndex(x=>x.type==='LP'&&x.cause==='cost'),iD=a.findIndex(x=>x.type==='ATTACK_DECLARE_V48');return iL>=0&&iD>iL;})());
audit('A');
fresh();
de=mk('ダーク・エルフ',0,'up');gameState.players[0].mz=[de];gameState.players[0].lp=900;gameState.phase='battle';baselineA();
ok('A2: 900 LP — cannot declare an attack',!canDeclareAttackV48(C(de)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('A2: no payment, no damage',lp(0)===900&&lp(1)===8000);

/* ===== B: BF－東雲のコチ — cannot be a Synchro Material once special summoned ===== */
fresh();
let ko=mk('BF－東雲のコチ',0,'up'),fd=mk('フレンドッグ',0,'up'),cd=mk('ダーク・ダイブ・ボンバー',0);
gameState.players[0].mz=[ko,fd];gameState.players[0].ex=[cd];baselineA();
const cbB=exCombos(0,dbOf(cd)).combos.find(c=>c.materials.length===2);
if(cbB)beginExSummonV2(0,0,cbB.materials,'synchro','atk');drive();
ok('B: a Normal Summoned コチ is a Synchro Material (ダーク・ダイブ・ボンバー)',!!cbB&&z(cd)==='mz'&&z(ko)==='grave');
audit('B');
fresh();
ko=mk('BF－東雲のコチ',0,'up');ko.specialSummoned=true;fd=mk('フレンドッグ',0,'up');cd=mk('ダーク・ダイブ・ボンバー',0);
gameState.players[0].mz=[ko,fd];gameState.players[0].ex=[cd];baselineA();
ok('B2: a special summoned コチ — no Synchro combination',!exCombos(0,dbOf(cd)).combos.length);

/* ===== C: フレンドッグ — destroyed by battle: an 「E・HERO」 card and 「融合」 from the GY ===== */
fresh();
fd=mk('フレンドッグ',0,'up');let eh=mk('E・HERO クレイマン',0),fu=mk('融合',0),at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[fd];gameState.players[0].grave=[eh,fu];gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: クレイマン and 融合 added to the hand',z(fd)==='grave'&&z(eh)==='hand'&&z(fu)==='hand');
audit('C');
fresh();
fd=mk('フレンドッグ',0,'up');fu=mk('融合',0);at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[fd];gameState.players[0].grave=[fu];gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C2: no 「E・HERO」 — 融合 alone is added',z(fu)==='hand');

/* ===== D: ヴォルカニック・リボルバー — destroyed by battle: a 「ヴォルカニック」 from the Deck on top ===== */
fresh();
let vr=mk('ヴォルカニック・リボルバー',0,'up'),vb=mk('ヴォルカニック・バレット',0);at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[vr];gameState.players[0].deck.splice(3,0,vb);gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D: ヴォルカニック・バレット placed on top of the Deck',z(vr)==='grave'&&gameState.players[0].deck[0]===C(vb),JSON.stringify({top:cardName(gameState.players[0].deck[0]),TRIG}));
audit('D');

/* ===== E: ワーム・テンタクルス — banish a 「ワーム」 Reptile (cost): two attacks this turn ===== */
fresh();
let wt=mk('ワーム・テンタクルス',0,'up'),wx=mk('ワーム・ゼクス',0);gameState.players[0].mz=[wt];gameState.players[0].grave=[wx];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('E: ワーム・ゼクス banished (cost)',z(wx)==='banish');
ok('E: not activatable twice',strictScriptLegalityV2('ワーム・テンタクルス',0,'mz',0,{}).ok===false);
phase('battle');
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('E: two direct attacks (1700 × 2)',lp(1)===8000-3400,JSON.stringify({lp:lp(1)}));
audit('E');

/* ===== F: 竜の尖兵 — ① send a Dragon from the hand: ATK +300; ② sent to the GY by the opponent's effect: a Dragon Normal Monster from either GY ===== */
fresh();
let va=mk('竜の尖兵',0,'up'),be=mk('青眼の白龍',0);gameState.players[0].mz=[va];gameState.players[0].hand=[be];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('F: 青眼の白龍 sent from the hand; ATK 2000',z(be)==='grave'&&curATK(C(va))===2000);
audit('F');
fresh();
va=mk('竜の尖兵',0,'up');be=mk('青眼の白龍',1);let bh=mk('ブラック・ホール',1);
gameState.players[0].mz=[va];gameState.players[1].grave=[be];gameState.players[1].hand=[bh];gameState.activePlayer=1;baselineA();
duelActivateFromHand(0);drive();
ok('F2: destroyed by the opponent\'s ブラック・ホール → the opponent\'s 青眼の白龍 special summoned to its field',z(va)==='grave'&&z(be)==='mz'&&findCardByUid(be.uid).p===0,JSON.stringify({va:z(va),be:z(be),TRIG}));
audit('F2');
fresh();
va=mk('竜の尖兵',0,'up');be=mk('青眼の白龍',0);bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[va];gameState.players[0].grave=[be];gameState.players[0].hand=[bh];baselineA();TRIG.length=0;
duelActivateFromHand(0);drive();
ok('F3: its own ブラック・ホール — no activation',z(be)==='grave'&&!TRIG.some(t=>/竜の尖兵/.test(t)));

/* ===== G: アテナ — ① send a Fairy (cost), revive a Fairy; ② another Fairy summoned: 600 damage ===== */
fresh();
let an=mk('アテナ',0,'up'),sh=mk('シャインエンジェル',0,'up'),cn=mk('コーリング・ノヴァ',0);
gameState.players[0].mz=[an,sh];gameState.players[0].grave=[cn];baselineA();
PREFER=[sh.uid,cn.uid];duelActivateFromZone(0,'mz',0);drive();PREFER=[];
ok('G: シャインエンジェル sent (cost); コーリング・ノヴァ special summoned; 600 damage',z(sh)==='grave'&&z(cn)==='mz'&&lp(1)===7400,JSON.stringify({sh:z(sh),cn:z(cn),lp:lp(1),TRIG}));
audit('G');
fresh();
an=mk('アテナ',0,'up');sh=mk('シャインエンジェル',0);gameState.players[0].mz=[an];gameState.players[0].hand=[sh];baselineA();
doNormalSummon(0,'atk');drive();
ok('G2: a Fairy Normal Summoned → 600 damage',z(sh)==='mz'&&lp(1)===7400);
fresh();
an=mk('アテナ',0,'up');let wi=mk('ワイト',0);gameState.players[0].mz=[an];gameState.players[0].hand=[wi];baselineA();
doNormalSummon(0,'atk');drive();
ok('G3: a non-Fairy summoned — no damage',lp(1)===8000);
fresh();
an=mk('アテナ',0,'down','def');an.setTurn=4;sh=mk('シャインエンジェル',0,'down','def');sh.setTurn=4;gameState.players[0].mz=[an,sh];baselineA();
doFlipUp(0,'mz',1,'atk');drive();
ok('G4: face-down アテナ — no damage when a Fairy is Flip Summoned',lp(1)===8000);
`);
