/* S03-U217: NOT_STARTED → TESTED — かつて神と呼ばれた亀, マジシャンズ・ヴァルキリア, ヒエラコスフィンクス, 闇竜の黒騎士, 魔轟神獣コカトル, ミラージュ・ドラゴン,
   メカニカル・ハウンド, フォトン・ケルベロス (engine: activationLockS03). Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function lock(p,c,zone){return activationTypeLockReasonS03(p,C(c),zone,dbOf(c),{});}

/* ===== A: かつて神と呼ばれた亀 — neither player can special summon a monster with 1800 or more ATK ===== */
fresh();
let tt=mk('かつて神と呼ばれた亀',1,'up'),be=mk('青眼の白龍',0),wt=mk('ワイト',0),mr=mk('死者蘇生',0);
gameState.players[1].mz=[tt];gameState.players[0].grave=[be,wt];gameState.players[0].hand=[mr];baselineA();
ok('A: locks 3000 ATK for both players, not 300',/亀/.test(v46SpecialSummonRestrictionReason(0,dbOf(be)))&&/亀/.test(v46SpecialSummonRestrictionReason(1,dbOf(be)))&&v46SpecialSummonRestrictionReason(0,dbOf(wt))==='');
PREFER=[be.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('A: 死者蘇生 skips 青眼の白龍; ワイト summoned',z(be)==='grave'&&z(wt)==='mz');
audit('A');

/* ===== B: マジシャンズ・ヴァルキリア — the opponent cannot target its other Spellcasters with attacks ===== */
fresh();
let mv=mk('マジシャンズ・ヴァルキリア',0,'up'),bm=mk('ブラック・マジシャン',0,'up');wt=mk('ワイト',0,'up');gameState.players[0].mz=[mv,bm,wt];baselineA();
ok('B: ブラック・マジシャン protected; ヴァルキリア itself and ワイト are not',!!attackTargetForbiddenReasonS03(1,C(bm))&&!attackTargetForbiddenReasonS03(1,C(mv))&&!attackTargetForbiddenReasonS03(1,C(wt)));
fresh();
mv=mk('マジシャンズ・ヴァルキリア',0,'up');bm=mk('ブラック・マジシャン',0,'up');let at=mk('青眼の白龍',1,'up');gameState.players[0].mz=[mv,bm];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('B2: an attack on ブラック・マジシャン is refused',z(bm)==='mz'&&gameState.players[0].lp===8000,JSON.stringify({bm:z(bm),T:TOASTS.slice(-2)}));

/* ===== C: ヒエラコスフィンクス — the opponent cannot target face-down Defense monsters ===== */
fresh();
let hs=mk('ヒエラコスフィンクス',0,'up'),fd=mk('ワイト',0,'down','def');fd.setTurn=4;at=mk('青眼の白龍',1,'up');gameState.players[0].mz=[hs,fd];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('C: the face-down ワイト is protected; the sphinx is not',!!attackTargetForbiddenReasonS03(1,C(fd))&&!attackTargetForbiddenReasonS03(1,C(hs)));
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('C: the attack on it is refused',z(fd)==='mz'&&C(fd).face==='down');

/* ===== D: 闇竜の黒騎士 — a Level 4 or lower Zombie destroyed by battle, from the opponent's GY to its own field ===== */
fresh();
let dk=mk('闇竜の黒騎士',0,'up'),zb=mk('ワイト',1),zn=mk('ワイト夫人',1);zb.graveInfo={turn:4,from:'mz',byDestroy:true,battle:true};zn.graveInfo={turn:4,from:'mz',byDestroy:true};
gameState.players[0].mz=[dk];gameState.players[1].grave=[zn,zb];baselineA();
duelActivateFromZone(0,'mz',0);drive();
ok('D: the battle-destroyed ワイト special summoned to its field; ワイト夫人 (not by battle) stays',z(zb)==='mz'&&findCardByUid(zb.uid).p===0&&z(zn)==='grave');
audit('D');
fresh();
dk=mk('闇竜の黒騎士',0,'up');zn=mk('ワイト夫人',1);zn.graveInfo={turn:4,from:'mz',byDestroy:true};gameState.players[0].mz=[dk];gameState.players[1].grave=[zn];baselineA();
ok('D2: no Zombie destroyed by battle — not activatable',strictScriptLegalityV2('闇竜の黒騎士',0,'mz',0,{}).ok===false);

/* ===== E: 魔轟神獣コカトル — destroys a monster by battle: discard a 「魔轟神」 (cost), draw 1 ===== */
fresh();
let kc=mk('魔轟神獣コカトル',0,'up'),fb=mk('魔轟神アシェンヴェイル',0),om=mk('ワイト',1,'up');
gameState.players[0].mz=[kc];gameState.players[0].hand=[fb];gameState.players[1].mz=[om];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('E: ワイト destroyed; アシェンヴェイル discarded; 1 card drawn',z(om)==='grave'&&z(fb)==='grave'&&gameState.players[0].hand.length===1,JSON.stringify({fb:z(fb),h:gameState.players[0].hand.length,TRIG}));
audit('E');

/* ===== F: ミラージュ・ドラゴン — the opponent cannot activate Trap cards in the Battle Phase ===== */
fresh();
let md=mk('ミラージュ・ドラゴン',1,'up'),ir=mk('威嚇する咆哮',0,'down');ir.setTurn=4;let ir2=mk('威嚇する咆哮',1,'down');ir2.setTurn=4;
gameState.players[1].mz=[md];gameState.players[0].sz=[ir];gameState.players[1].sz=[ir2];gameState.activePlayer=1;gameState.phase='battle';baselineA();
ok('F: in the Battle Phase the opponent\'s set Trap is locked; its own is not',/ミラージュ/.test(lock(0,ir,'sz'))&&lock(1,ir2,'sz')==='');
gameState.phase='main1';
ok('F: in the Main Phase it is not locked',lock(0,ir,'sz')==='');

/* ===== G: メカニカル・ハウンド — while its controller's hand is empty, the opponent cannot activate Spell cards ===== */
fresh();
let mh=mk('メカニカル・ハウンド',1,'up'),cy=mk('サイクロン',0),os=mk('サイクロン',1,'down');os.setTurn=4;
gameState.players[1].mz=[mh];gameState.players[1].hand=[];gameState.players[0].hand=[cy];gameState.players[1].sz=[os];baselineA();
ok('G: the hand-empty controller — the opponent\'s サイクロン locked',/メカニカル・ハウンド/.test(lock(0,cy,'hand')));
duelActivateFromHand(0);drive();
ok('G: not activated',z(cy)==='hand'&&z(os)==='sz'&&gameState.chain.length===0);
fresh();
mh=mk('メカニカル・ハウンド',1,'up');cy=mk('サイクロン',0);gameState.players[1].mz=[mh];gameState.players[1].hand=[mk('ワイト',1)];gameState.players[0].hand=[cy];baselineA();
ok('G2: its controller holds a card — no lock',lock(0,cy,'hand')==='');

/* ===== H: フォトン・ケルベロス — the turn it is Normal Summoned, neither player can activate Trap cards ===== */
fresh();
let pk=mk('フォトン・ケルベロス',0),t0=mk('威嚇する咆哮',0,'down'),t1=mk('威嚇する咆哮',1,'down');t0.setTurn=4;t1.setTurn=4;
gameState.players[0].hand=[pk];gameState.players[0].sz=[t0];gameState.players[1].sz=[t1];baselineA();
doNormalSummon(0,'atk');drive();
ok('H: after its Normal Summon both players\' set Traps are locked',z(pk)==='mz'&&/フォトン/.test(lock(0,t0,'sz'))&&/フォトン/.test(lock(1,t1,'sz')));
audit('H');
fresh();
pk=mk('フォトン・ケルベロス',0,'up');t1=mk('威嚇する咆哮',1,'down');t1.setTurn=4;gameState.players[0].mz=[pk];gameState.players[1].sz=[t1];baselineA();
ok('H2: not summoned this turn — no lock',lock(1,t1,'sz')==='');
`);
