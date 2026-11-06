/* S03-U512: スピリット支援の未実装 3 枚（カード実装）。

   《八汰鏡》（NOT_STARTED・装備魔法）
     スピリットモンスターにのみ装備可能。装備モンスターはエンドフェイズ時に手札に戻る効果を
     発動しなくてもよい。装備モンスターが戦闘によって破壊される場合、代わりにこのカードを破壊する。
   《伊弉凪》（ENGINE_GAP・星6 天使/風 2200/1000）
     手札のスピリットモンスター1体をゲームから除外し、手札から特殊召喚できる。
     自分フィールド上に表側表示で存在する限り、自分のスピリットは手札に戻る効果を発動しなくてもよい。
   《霊子エネルギー固定装置》（NOT_STARTED・永続魔法）
     存在する限りスピリットモンスターはフィールド上に残り続ける。自分のエンドフェイズ時に手札を
     1枚捨てる。捨てなければこのカードを破壊する。フィールドから離れた時、フィールド上の表側表示の
     スピリットモンスターは全て持ち主の手札に戻る。

   共通処理は 2 つだけ足した（S03-U244 の spiritReturnDueS03 / spiritReturnEffectS03 から読む）:
     spiritStayS03(card)          … 戻りが起きない（固定装置）
     spiritReturnOptionalS03(ctx) … 戻りが任意になる（八汰鏡・伊弉凪）
   任意化は誘発の強制／任意を変えるので、engine/1ZB に v4 effect の forcedWhenS03 を見る枝を足した。

   実経路で測る（フェイズ移行は PROCESSOR_V27.PHASE、攻撃は PROCESSOR_V27.ATTACK）。

   固定するもの:
     A 登録と形
     B 伊弉凪（特殊召喚手順と任意化）
     C 八汰鏡（装備・任意化・戦闘破壊の身代わり）
     D 霊子エネルギー固定装置（残り続ける・維持・自壊・離脱時の全戻し）
     E negative control（支援が無ければ従来どおり強制で戻る／装備先の制限）
     F Replay 監査（各場面）
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S512 = pathA.resolve(__dirname, '..');
const rdS512 = p => fsA.readFileSync(pathA.join(ROOT_S512, p), 'utf8');
const SRC_S512 = {
  'cards/HZZZX_claude_s03_u244_spirits.js': rdS512('cards/HZZZX_claude_s03_u244_spirits.js'),
  'cards/HZZZZZZZZZZZV_claude_s03_u512_spirit_support.js': rdS512('cards/HZZZZZZZZZZZV_claude_s03_u512_spirit_support.js'),
  'docs/S03_U512_REPORT.md': rdS512('docs/S03_U512_REPORT.md'),
  'engine/1ZB_trigger_forced_per_effect_s03.js': rdS512('engine/1ZB_trigger_forced_per_effect_s03.js'),
  'tools/check.py': rdS512('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function graveCard(p,uid){return (gameState.players[p].grave||[]).find(c=>c&&c.uid===uid)||null;}
let FORCED=[];
(function(){
  const ch=collectHandlers;collectHandlers=function(ev,evt){
    const r=ch.apply(this,arguments);
    if(ev==='onEndPhase')(r||[]).forEach(x=>FORCED.push({n:x.name,forced:triggerCandidateForcedS03(x)}));
    return r;};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;FORCED=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function stepS512(skip){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){
    const st=EVT_V2_STATE,g=st.groups[st.rank]||[];
    if(g.length && !skip) eventPickV2(0); else eventSkipGroupV2();
    return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!stepS512(false))return 'idle';}return 'loop';}
/* 任意誘発を 1 度だけ見送る。強制の群は engine が skip を受け付けないので、次からは発動させる。 */
function driveSkip(){let tries=0;
  for(let i=0;i<900;i++){
    if(pc()){__choicePickV49(0);continue;}
    const had=(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE)?((EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[]).length):0;
    const k=stepS512(had>0 && tries<1);
    if(had>0) tries++;
    if(!k) return 'idle';}
  return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function phaseSkip(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return driveSkip();}
function turnS512(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attackS512(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 登録と形 ===== */
harness('const SRC=' + JSON.stringify(SRC_S512) + ';' + COMMON + String.raw`
fresh();
ok('A1 ★ 3 枚が登録され、既存の仕組みを使っている（八汰鏡は戦闘破壊の身代わり、伊弉凪は特殊召喚手順）',
   !!CARD_SCRIPTS['八汰鏡'] && !!CARD_SCRIPTS['伊弉凪'] && !!CARD_SCRIPTS['霊子エネルギー固定装置']
   && CARD_SCRIPTS['八汰鏡'].equipSubstituteS03==='battle'
   && !!(CARD_SCRIPTS['伊弉凪'].summonProcedure||{}).cost,
   JSON.stringify({sub:CARD_SCRIPTS['八汰鏡'].equipSubstituteS03,
     sp:Object.keys((CARD_SCRIPTS['伊弉凪']||{}).summonProcedure||{})}));
ok('A2 ★ 共通処理は 2 つだけで、S03-U244 の戻りの判定から読んでいる',
   typeof spiritStayS03==='function' && typeof spiritReturnOptionalS03==='function'
   && SRC['cards/HZZZX_claude_s03_u244_spirits.js'].indexOf('spiritStayS03(ctx.card)')>=0
   && SRC['cards/HZZZX_claude_s03_u244_spirits.js'].indexOf('forcedWhenS03(ctx)')>=0,'');
ok('A3 ★ engine/1ZB の枝は申告（forcedWhenS03）がある effect だけを見る',
   SRC['engine/1ZB_trigger_forced_per_effect_s03.js'].indexOf("typeof e.forcedWhenS03 === 'function'")>=0
   && SRC['engine/1ZB_trigger_forced_per_effect_s03.js'].indexOf('e.forced === true || !!sc.forced')>=0,'');
`, {expect:3});

/* ===== B. 伊弉凪 ===== */
harness(COMMON + String.raw`
fresh();
const iz=mk('伊弉凪',0), sp=mk('八汰烏',0);
gameState.players[0].hand=[iz,sp];
baselineA();
const L=strictSummonProcedureLegality('伊弉凪',0,'hand',0);
finishSummonProcedure('伊弉凪',0,'hand',0,'atk');
const tr=drive();
ok('B1 ★ 伊弉凪：手札のスピリット1体を除外して手札から特殊召喚できる',
   L.ok===true && tr==='idle' && zu(iz.uid)==='mz' && zu(sp.uid)==='banish',
   JSON.stringify({legal:{ok:L.ok,reason:L.reason},iz:zu(iz.uid),spirit:zu(sp.uid)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 手札にスピリットがいなければ特殊召喚手順は通らない */
const iz=mk('伊弉凪',0);
gameState.players[0].hand=[iz,mk('ワイト',0)];
baselineA();
const L=strictSummonProcedureLegality('伊弉凪',0,'hand',0);
ok('B2 ★ negative control: 手札にスピリットがいなければ特殊召喚できない',
   L.ok===false && String(L.reason||'').indexOf('スピリット')>=0,
   JSON.stringify({ok:L.ok,reason:L.reason}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* 伊弉凪がいる間、自分のスピリットの戻りは任意になる（見送ると場に残る） */
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp, mk('伊弉凪',0,'up')];
baselineA();
const tr=phaseSkip('end');
ok('B3 ★ 伊弉凪がいる間は戻りが任意（forced false）で、見送るとスピリットは場に残る',
   tr==='idle' && zu(sp.uid)==='mz'
   && FORCED.some(x=>x.n==='八汰烏' && x.forced===false),
   JSON.stringify({forced:FORCED,spirit:zu(sp.uid)}));
audit('B3');
`, {expect:2});

/* ===== C. 八汰鏡 ===== */
harness(COMMON + String.raw`
fresh();
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp];
const mir=mk('八汰鏡',0);
gameState.players[0].hand=[mir];
baselineA();
duelActivateFromHand(0);
const tr=drive();
const equipped=(gameState.players[0].sz||[]).some(c=>c&&cardName(c)==='八汰鏡'&&c.equipTo);
const tr2=phaseSkip('end');
ok('C1 ★ 八汰鏡：スピリットに装備でき、装備モンスターの戻りが任意になる',
   tr==='idle' && equipped && zu(mir.uid)==='sz'
   && FORCED.some(x=>x.n==='八汰烏' && x.forced===false)
   && tr2==='idle' && zu(sp.uid)==='mz',
   JSON.stringify({equipped,mir:zu(mir.uid),forced:FORCED,spirit:zu(sp.uid)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: スピリット以外には装備できない */
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
gameState.players[0].hand=[mk('八汰鏡',0)];
baselineA();
duelActivateFromHand(0);
drive();
ok('C2 ★ negative control: スピリット以外のモンスターには装備できない',
   (gameState.players[0].sz||[]).every(c=>!(c&&cardName(c)==='八汰鏡'&&c.equipTo))
   && (gameState.players[0].hand||[]).some(c=>c&&cardName(c)==='八汰鏡'),
   JSON.stringify({sz:(gameState.players[0].sz||[]).map(c=>cardName(c)),
     hand:(gameState.players[0].hand||[]).map(c=>cardName(c)),toasts:TOASTS.slice(-2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* 戦闘で破壊される場合、代わりに八汰鏡が破壊される（S03-U183 の身代わり）。
   自分の番で装備 → ターンを渡して相手が攻撃する、という実経路で測る。 */
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn;   /* 攻 200 */
gameState.players[0].mz=[sp];
const mir=mk('八汰鏡',0);
gameState.players[0].hand=[mir];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];            /* 攻 2500 */
baselineA();
duelActivateFromHand(0);
drive();
const equipped=(gameState.players[0].sz||[]).some(c=>c&&cardName(c)==='八汰鏡'&&c.equipTo);
phaseSkip('end');          /* 自分のエンドフェイズ：戻りは任意なので見送る */
turnS512();
phase('standby');
phase('main1');
phase('battle');
const tr=attackS512(1,0,0);
ok('C3 ★ 装備モンスターが戦闘で破壊される場合、代わりに八汰鏡が破壊される',
   equipped && tr==='idle' && zu(sp.uid)==='mz' && zu(mir.uid)==='grave'
   && ((graveCard(0,mir.uid)||{}).graveInfo||{}).byDestroy===true,
   JSON.stringify({equipped,spirit:zu(sp.uid),mir:zu(mir.uid),
     gi:(graveCard(0,mir.uid)||{}).graveInfo||null}));
audit('C3');
`, {expect:2});

/* ===== D. 霊子エネルギー固定装置 ===== */
harness(COMMON + String.raw`
fresh();
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp];
const fx=mk('霊子エネルギー固定装置',0,'up');
gameState.players[0].sz=[fx];
const food=mk('ワイト',0);
gameState.players[0].hand=[food];
baselineA();
const tr=phase('end');
ok('D1 ★ 固定装置：スピリットは戻りの候補にも出ず、手札を1枚捨てて固定装置は残る',
   tr==='idle' && zu(sp.uid)==='mz' && zu(fx.uid)==='sz' && zu(food.uid)==='grave'
   && !FORCED.some(x=>x.n==='八汰烏'),
   JSON.stringify({forced:FORCED,spirit:zu(sp.uid),fixer:zu(fx.uid),food:zu(food.uid)}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn;
const sp2=mk('火之迦具土',1,'up'); sp2.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp];
gameState.players[1].mz=[sp2];
const fx=mk('霊子エネルギー固定装置',0,'up');
gameState.players[0].sz=[fx];
gameState.players[0].hand=[];
baselineA();
const tr=phase('end');
ok('D2 ★ 捨てる手札が無ければ自壊し、離れた時に両者の表側スピリットが全て手札へ戻る',
   tr==='idle' && zu(fx.uid)==='grave'
   && ((graveCard(0,fx.uid)||{}).graveInfo||{}).byDestroy===true
   && zu(sp.uid)==='hand' && zu(sp2.uid)==='hand',
   JSON.stringify({fixer:zu(fx.uid),s0:zu(sp.uid),s1:zu(sp2.uid),
     gi:(graveCard(0,fx.uid)||{}).graveInfo||null}));
audit('D2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* 相手のスピリットも「残り続ける」（テキストは所有者を限っていない）。
   相手のエンドフェイズでは、固定装置の維持（捨てる処理）は起きない。 */
const sp2=mk('火之迦具土',1,'up'); sp2.summonedTurn=gameState.turn;
gameState.players[1].mz=[sp2];
const fx=mk('霊子エネルギー固定装置',0,'up');
gameState.players[0].sz=[fx];
const keep=mk('ワイト',0);
gameState.players[0].hand=[keep];
gameState.activePlayer=1;
baselineA();
const tr=phase('end');
ok('D3 ★ 相手のスピリットもフィールドに残り、相手のエンドフェイズでは維持も起きない',
   tr==='idle' && zu(sp2.uid)==='mz' && zu(fx.uid)==='sz' && zu(keep.uid)==='hand'
   && !FORCED.some(x=>x.n==='火之迦具土'),
   JSON.stringify({forced:FORCED,s1:zu(sp2.uid),fixer:zu(fx.uid),keep:zu(keep.uid)}));
audit('D3');
`, {expect:2});

/* ===== E. negative control（従来挙動） ===== */
harness(COMMON + String.raw`
fresh();
const sp=mk('八汰烏',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp];
baselineA();
const tr=phase('end');
ok('E1 ★ negative control: 支援が無ければ戻りは強制のままで、手札に戻る（S03-U244 の挙動）',
   tr==='idle' && zu(sp.uid)==='hand'
   && FORCED.some(x=>x.n==='八汰烏' && x.forced===true),
   JSON.stringify({forced:FORCED,spirit:zu(sp.uid)}));
audit('E1');
`, {expect:2});

/* ===== F. スピリットの雛形は 2 つある（S03-U244 の defineSpiritS03 と cycle 13 の c2Spirit）===== */
harness(COMMON + String.raw`
fresh();
/* 《夜叉》は c2Spirit 側（非 v4・スクリプト全体が forced:true）。S03-U116 の forcedForEventS03 で
   エンドフェイズの戻りだけが任意になる（召喚・リバース時の効果は強制のまま）。 */
const sp=mk('夜叉',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp, mk('伊弉凪',0,'up')];
baselineA();
const tr=phaseSkip('end');
ok('F1 ★ もう一つの雛形（《夜叉》）でも伊弉凪で戻りが任意になり、見送ると場に残る',
   tr==='idle' && zu(sp.uid)==='mz'
   && FORCED.some(x=>x.n==='夜叉' && x.forced===false),
   JSON.stringify({forced:FORCED,spirit:zu(sp.uid)}));
audit('F1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const sp=mk('夜叉',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp];
const fx=mk('霊子エネルギー固定装置',0,'up');
gameState.players[0].sz=[fx];
const food=mk('ワイト',0);
gameState.players[0].hand=[food];
baselineA();
const tr=phase('end');
ok('F2 ★ もう一つの雛形（《夜叉》）でも固定装置があれば戻らない（候補にも出ない）',
   tr==='idle' && zu(sp.uid)==='mz' && zu(fx.uid)==='sz'
   && !FORCED.some(x=>x.n==='夜叉'),
   JSON.stringify({forced:FORCED,spirit:zu(sp.uid),fixer:zu(fx.uid)}));
audit('F2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 支援が無ければ《夜叉》も今までどおり強制で戻る */
const sp=mk('夜叉',0,'up'); sp.summonedTurn=gameState.turn;
gameState.players[0].mz=[sp];
baselineA();
const tr=phase('end');
ok('F3 ★ negative control: 支援が無ければ《夜叉》も強制で手札に戻る',
   tr==='idle' && zu(sp.uid)==='hand'
   && FORCED.some(x=>x.n==='夜叉' && x.forced===true),
   JSON.stringify({forced:FORCED,spirit:zu(sp.uid)}));
audit('F3');
`, {expect:2});

/* ===== G. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S512) + ';' + String.raw`
const REP=S['docs/S03_U512_REPORT.md'], CHK=S['tools/check.py'];
ok('G1 ★ 報告書に、実装した効果と未対応の範囲が分けて書かれている',
   REP.indexOf('実装した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('八汰鏡')>=0 && REP.indexOf('伊弉凪')>=0 && REP.indexOf('霊子エネルギー固定装置')>=0,'');
ok('G2 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u512_spirit_support.js')>=0,'');
`, {expect:2});
