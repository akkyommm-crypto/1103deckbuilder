/* S03-U220: NOT_STARTED → TESTED — 干ばつ / 業火 / 深淵 / 烈風 / 豪雨 / 閃光の結界像, 召喚制限－パワーフィルター, 虚無の統括者, 漆黒の戦士 ワーウルフ, 暗黒の侵略者
   (engine: the special-summon lock also reads face-up Spells / Traps). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function ssr(p,name){return v46SpecialSummonRestrictionReason(p,dbOf(mk(name,p)));}
function lock(p,c,zone){return activationTypeLockReasonS03(p,C(c),zone,dbOf(c),{});}

/* ===== A: the six 結界像 — only monsters of their Attribute can be special summoned, by either player ===== */
const STATUES=[['干ばつの結界像','セイバーザウルス'],['業火の結界像','ヴォルカニック・バレット'],['深淵の結界像','ワイト'],['烈風の結界像','E・HERO エアーマン'],['豪雨の結界像','大くしゃみのカバザウルス'],['閃光の結界像','青眼の白龍']];
STATUES.forEach(([st,same],ix)=>{
  fresh();gameState.players[1].mz=[mk(st,1,'up')];baselineA();
  const other=(same==='青眼の白龍')?'ワイト':'青眼の白龍';
  ok('A'+ix+': '+st+' — '+same+' allowed, '+other+' locked, for both players',ssr(0,same)===''&&ssr(1,same)===''&&!!ssr(0,other)&&!!ssr(1,other),JSON.stringify([ssr(0,same),ssr(0,other)]));
});
fresh();
let gs=mk('豪雨の結界像',1,'up'),be=mk('青眼の白龍',0),kb=mk('大くしゃみのカバザウルス',0),mr=mk('死者蘇生',0);
gameState.players[1].mz=[gs];gameState.players[0].grave=[be,kb];gameState.players[0].hand=[mr];baselineA();
PREFER=[be.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: under 豪雨の結界像, 死者蘇生 skips 青眼; the WATER カバザウルス is summoned',z(be)==='grave'&&z(kb)==='mz');
audit('A');
fresh();
gameState.players[1].mz=[mk('閃光の結界像',1,'down','def')];baselineA();
ok('A: a face-down 結界像 locks nothing',ssr(0,'ワイト')==='');

/* ===== B: 召喚制限－パワーフィルター — a face-up Continuous Spell: no monster with 1000 or less ATK can be special summoned ===== */
fresh();
let pf=mk('召喚制限－パワーフィルター',0);let wt=mk('ワイト',0);be=mk('青眼の白龍',0);mr=mk('死者蘇生',0);
gameState.players[0].hand=[pf,mr];gameState.players[0].grave=[wt,be];baselineA();
duelActivateFromHand(0);drive();
ok('B: activated — face-up; ワイト (300) locked, 青眼 not',z(pf)==='sz'&&C(pf).face==='up'&&!!ssr(0,'ワイト')&&!!ssr(1,'ワイト')&&ssr(0,'青眼の白龍')==='');
PREFER=[wt.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('B: 死者蘇生 skips ワイト; 青眼 summoned',z(wt)==='grave'&&z(be)==='mz');
audit('B');
fresh();
gameState.players[0].sz=[mk('召喚制限－パワーフィルター',0,'down')];baselineA();
ok('B2: set face-down — no lock',ssr(0,'ワイト')==='');

/* ===== C: 虚無の統括者 — the opponent cannot special summon; it cannot be special summoned itself ===== */
fresh();
let vo=mk('虚無の統括者',0,'up');gameState.players[0].mz=[vo];baselineA();
ok('C: the opponent is locked, its controller is not',!!ssr(1,'ワイト')&&ssr(0,'ワイト')==='');
fresh();
vo=mk('虚無の統括者',0);gameState.players[0].grave=[vo];baselineA();
ok('C: itself cannot be special summoned',canEffectSpecialSummonS03(C(vo),'grave','死者蘇生')===false);

/* ===== D: 漆黒の戦士 ワーウルフ — the opponent cannot activate Trap cards in the Battle Phase ===== */
fresh();
let ww=mk('漆黒の戦士 ワーウルフ',1,'up'),ir=mk('威嚇する咆哮',0,'down');ir.setTurn=4;let ir2=mk('威嚇する咆哮',1,'down');ir2.setTurn=4;
gameState.players[1].mz=[ww];gameState.players[0].sz=[ir];gameState.players[1].sz=[ir2];gameState.phase='battle';baselineA();
ok('D: Battle Phase — the opponent\'s Trap locked, its own not',/ワーウルフ/.test(lock(0,ir,'sz'))&&lock(1,ir2,'sz')==='');
gameState.phase='main2';
ok('D: Main Phase 2 — not locked',lock(0,ir,'sz')==='');

/* ===== E: 暗黒の侵略者 — the opponent cannot activate Quick-Play Spell cards ===== */
fresh();
let di=mk('暗黒の侵略者',1,'up'),cy=mk('サイクロン',0),bh=mk('ブラック・ホール',0),os=mk('サイクロン',1,'down');os.setTurn=4;
gameState.players[1].mz=[di];gameState.players[0].hand=[cy,bh];gameState.players[1].sz=[os];baselineA();
ok('E: サイクロン (Quick-Play) locked; ブラック・ホール (Normal) not',/暗黒の侵略者/.test(lock(0,cy,'hand'))&&lock(0,bh,'hand')==='');
duelActivateFromHand(0);drive();
ok('E: サイクロン not activated',z(cy)==='hand'&&z(os)==='sz');
`);
