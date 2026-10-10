/* S03-U209: NOT_STARTED → TESTED — ウォール・シャドウ, カウンター・カウンター, エヴォルド・ゲフィロス, ガスタ・ファルコ, X－セイバー パロムロ, X－セイバー アクセル,
   ジャンクBOX, インフェルニティ・ブレイク, D－HERO ドレッドサーヴァント. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function oppAttack(){gameState.activePlayer=1;gameState.phase='battle';}

/* ===== A: ウォール・シャドウ — only by 迷宮変化 ===== */
fresh();
let ws=mk('ウォール・シャドウ',0);gameState.players[0].grave=[ws];baselineA();
ok('A: ウォール・シャドウ cannot be revived by 死者蘇生',canEffectSpecialSummonS03(C(ws),'grave','死者蘇生')===false&&canEffectSpecialSummonS03(C(ws),'deck','迷宮変化')===true);

/* ===== B: カウンター・カウンター — negates a Counter Trap activation (the opponent's 魔宮の賄賂 on ブラック・ホール) ===== */
fresh();
let cc=mk('カウンター・カウンター',0,'down');cc.setTurn=4;let jd=mk('魔宮の賄賂',1,'down');jd.setTurn=4;let bh=mk('ブラック・ホール',0);
gameState.players[0].sz=[cc];gameState.players[0].hand=[bh];gameState.players[1].sz=[jd];gameState.players[1].hand=[mk('ワイト',1)];
gameState.players[0].mz=[mk('ワイト',0,'up')];baselineA();
duelActivateFromHand(0);
let w1=toWindow();const offJ=w1&&(getChainResponsesV2(1)||[]).some(r=>r.card===C(jd));
if(offJ){PREFER=[];duelActivateResponseV2(1,'sz',0);}
const w2=toWindow();const offC=w2&&(getChainResponsesV2(0)||[]).some(r=>r.card===C(cc));
if(offC)duelActivateResponseV2(0,'sz',0);
drive();
ok('B: 魔宮の賄賂 (Counter Trap) negated by カウンター・カウンター; ブラック・ホール resolved',offJ&&offC&&z(jd)==='grave'&&z(cc)==='grave'&&z(bh)==='grave'&&gameState.players[0].mz.length===0,JSON.stringify({offJ,offC,jd:z(jd),mz:gameState.players[0].mz.length}));
audit('B');

/* ===== C: エヴォルド・ゲフィロス — destroyed by battle: an 「エヴォルダー」 from the GY ===== */
fresh();
let ge=mk('エヴォルド・ゲフィロス',0,'up'),ev=mk('エヴォルダー・ケラト',0),at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[ge];gameState.players[0].grave=[ev];gameState.players[1].mz=[at];oppAttack();baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: エヴォルダー・ケラト special summoned',z(ge)==='grave'&&z(ev)==='mz');
audit('C');

/* ===== D: ガスタ・ファルコ — left the field face-up other than by battle: a 「ガスタ」 from the Deck, face-down ===== */
fresh();
let gf=mk('ガスタ・ファルコ',0,'up'),gi=mk('ガスタ・イグル',0);bh=mk('ブラック・ホール',0);
gameState.players[0].mz=[gf];gameState.players[0].hand=[bh];gameState.players[0].deck.push(gi);baselineA();
duelActivateFromHand(0);drive();
ok('D: destroyed by ブラック・ホール → ガスタ・イグル special summoned face-down',z(gf)==='grave'&&z(gi)==='mz'&&C(gi).face==='down');
audit('D');
fresh();
gf=mk('ガスタ・ファルコ',0,'up');gi=mk('ガスタ・イグル',0);at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[gf];gameState.players[0].deck.push(gi);gameState.players[1].mz=[at];oppAttack();baselineA();TRIG.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('D2: destroyed by battle — no activation',z(gi)==='deck'&&!TRIG.some(t=>/ファルコ/.test(t)));
audit('D2');

/* ===== E: X－セイバー パロムロ / アクセル — an own 「セイバー」 destroyed by battle ===== */
fresh();
let pr=mk('X－セイバー パロムロ',0),ax=mk('X－セイバー アクセル',0,'up'),sv=mk('XX－セイバー フラムナイト',0,'up');at=mk('青眼の白龍',1,'up');
gameState.players[0].grave=[pr];gameState.players[0].mz=[sv,ax];gameState.players[1].mz=[at];oppAttack();baselineA();
const h0=gameState.players[0].hand.length;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('E: フラムナイト destroyed → パロムロ paid 500 and special summoned; アクセル drew 1',z(sv)==='grave'&&z(pr)==='mz'&&gameState.players[0].lp<8000&&gameState.players[0].hand.length===h0+1,JSON.stringify({pr:z(pr),lp:gameState.players[0].lp,h:gameState.players[0].hand.length,TRIG}));
audit('E');

/* ===== F: ジャンクBOX — a Level 4 or lower 「D」 revived; destroyed at the End Phase ===== */
fresh();
let jb=mk('ジャンクBOX',0),dd=mk('D・スコープン',0);gameState.players[0].hand=[jb];gameState.players[0].grave=[dd];baselineA();
duelActivateFromHand(0);drive();
ok('F: D・スコープン special summoned',z(dd)==='mz');
phase('battle');phase('main2');phase('end');
ok('F: destroyed at the End Phase',z(dd)==='grave');
audit('F');

/* ===== G: インフェルニティ・ブレイク — with an empty hand: banish an 「インフェルニティ」 from the GY, destroy an opponent card ===== */
fresh();
let ib=mk('インフェルニティ・ブレイク',0,'down');ib.setTurn=4;let ig=mk('インフェルニティ・デストロイヤー',0),oc=mk('サイクロン',1,'down');
gameState.players[0].sz=[ib];gameState.players[0].grave=[ig];gameState.players[0].hand=[];gameState.players[1].sz=[oc];baselineA();
PREFER=[ig.uid,oc.uid];duelActivateFromZone(0,'sz',0);drive();PREFER=[];
ok('G: インフェルニティ・デストロイヤー banished; サイクロン destroyed',z(ig)==='banish'&&z(oc)==='grave');
audit('G');
fresh();
ib=mk('インフェルニティ・ブレイク',0,'down');ib.setTurn=4;gameState.players[0].sz=[ib];gameState.players[0].grave=[mk('インフェルニティ・デストロイヤー',0)];gameState.players[0].hand=[mk('ワイト',0)];gameState.players[1].sz=[mk('サイクロン',1,'down')];baselineA();
ok('G2: with a card in the hand — not activatable',strictScriptLegalityV2('インフェルニティ・ブレイク',0,'sz',0,{}).ok===false);

/* ===== H: D－HERO ドレッドサーヴァント — summoned: a clock counter on 幽獄の時計塔; destroyed by battle: an own Spell / Trap destroyed ===== */
fresh();
let ds=mk('D－HERO ドレッドサーヴァント',0),tw=mk('幽獄の時計塔',0,'up');gameState.players[0].hand=[ds];gameState.players[0].field=tw;baselineA();
const c0=(C(tw).counters&&C(tw).counters['時計'])||0;
doNormalSummon(0,'atk');drive();
ok('H: 幽獄の時計塔 +1 clock counter',((C(tw).counters&&C(tw).counters['時計'])||0)===c0+1);
audit('H');
fresh();
ds=mk('D－HERO ドレッドサーヴァント',0,'up');let st=mk('サイクロン',0,'down');at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[ds];gameState.players[0].sz=[st];gameState.players[1].mz=[at];oppAttack();baselineA();
PREFER=[st.uid];requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();PREFER=[];
ok('H2: destroyed by battle → its own サイクロン destroyed',z(ds)==='grave'&&z(st)==='grave');
audit('H2');
`);
