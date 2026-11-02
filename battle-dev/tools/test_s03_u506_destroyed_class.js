/* S03-U506: 破壊が条件の誘発（種別 `destroyed`）を入れる単位。設計は docs/S03_MISSED_TIMING_DESIGN.md (F)。
   S03-U505 の監査で決めた形のうち、**破壊（D）の側だけ**を入れた（墓地送り 112 枚は別単位）。

   当時裁定:
     `WIKI-378544C74049`（**回答日 2008-05-30**、《砂塵の大竜巻》）
       「破壊が条件の任意効果はタイミングを逃すことになります。」
     `WIKI-17DDC86F4023`（**回答日 2009-05-14**、《古代の機械究極巨人》）
       「『破壊された時』ではなく『破壊された場合』なので、タイミングを逃さず発動します。」
     `WIKI-9E5470176D20`（**回答日 2009-08-07**、掲載ページ《おとり人形》）
       《スネーク・ホイッスル》はチェーン2 で破壊された場合「タイミングを逃すので発動できず、破壊されます」
     `WIKI-1B4D52FCA757`（**回答日 2010-08-11**、《グリフォンの羽根帚》）
       《歯車街》が逃す理由は「破壊後に**回復の処理**が挟まるので」。**魔法が墓地へ行くこと自体は挙げていない**

   この単位で分かって直したこと（実測）:
     破壊だけで終わる《地砕き》でも《スネーク・ホイッスル》が落ちていた。原因は (A) の許可リストに
     `FX_SELF_TO_GRAVE`（発動した魔法・罠が解決後に墓地へ送られるルール上の行為）が入っていたこと。
     発行しているのは 5 か所で**すべてそのカード自身の後片付け**なので、許可リストから外した。
     召喚成功の種別では影響が無かった（解決中の特殊召喚成功は `flushResolutionSummonBatchV2` が
     リンクの解決の最後に刻むため）。破壊の種別を入れて初めて実経路に出た。

   固定するもの:
     A 機構の形（正規表現・語・種別の表）
     B **negative control**: 召喚句（N/S/F/R）の読み取りが 1 件も変わっていない（全 4996 枚）
     C 当時裁定の場面（破壊だけなら発動でき、回復が続けば逃す）
     D (A) から `FX_SELF_TO_GRAVE` を外したことと、その呼び出し元の全件
     E **negative control**: 「場合」のカード・墓地送りの句・場からの離脱は落ちない
     F (B-5) の門（許可リストに無い D:時 のカードは落とさない）
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S506 = pathA.resolve(__dirname, '..');
const rdS506 = p => fsA.readFileSync(pathA.join(ROOT_S506, p), 'utf8');
const SRC_S506 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS506('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS506('docs/S03_MISSED_TIMING_RULINGS.md'),
  'engine/1ZZX_missed_timing_s03.js': rdS506('engine/1ZZX_missed_timing_s03.js'),
  'engine/20_effect_primitives_ex.js': rdS506('engine/20_effect_primitives_ex.js'),
  'engine/30_processor_chain_battle.js': rdS506('engine/30_processor_chain_battle.js'),
  'engine/40_legal_script_engine.js': rdS506('engine/40_legal_script_engine.js'),
  'engine/70_summon_procedures.js': rdS506('engine/70_summon_procedures.js'),
  'engine/1U_negated_activation_grave_s03.js': rdS506('engine/1U_negated_activation_grave_s03.js'),
  'tools/check.py': rdS506('tools/check.py')
};
/* S03-U506 の前（S03-U505 時点）に測った召喚句の基準。ここが 1 つでも動いたら読み取りを壊している。 */
const BASE_S506 = {
  cards: 4996, clauses: 531,
  per: {N:{toki:239,baai:49}, S:{toki:213,baai:53}, F:{toki:75,baai:8}, R:{toki:20,baai:35}},
  kinds: {N:{toki:238,baai:49,none:4709}, S:{toki:213,baai:53,none:4730},
          F:{toki:75,baai:8,none:4913}, R:{toki:20,baai:35,none:4941}}
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let STEPS=[], COLLECT=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',before:b,after:s()});}};
  const ch=collectHandlers;collectHandlers=function(ev,evt){
    const r=ch.apply(this,arguments);
    COLLECT.push({ev,names:(r||[]).map(x=>x.name),stamp:(evt&&evt.stepS03)!=null?evt.stepS03:null,now:s()});
    return r;};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];COLLECT=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=1;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function stepDeltas(){return STEPS.filter(x=>x.before!==x.after).map(x=>x.t+':'+x.before+'->'+x.after);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
/* p0（非ターンプレイヤー）が《スネーク・ホイッスル》を伏せ、爬虫類族が場に居る。p1 がそれを破壊する。 */
function whistleBoard(spell){
  fresh();
  const trap=setTrap('スネーク・ホイッスル',0);
  gameState.players[0].sz=[trap];
  const mon=mk('エーリアン・グレイ',0,'up');
  gameState.players[0].mz=[mon];
  const pool=mk('エーリアン・サイコ',0);
  gameState.players[0].deck.splice(1,0,pool);
  gameState.players[1].hand=[mk(spell,1)];
  baselineA();
  return {trap:trap.uid, mon:mon.uid, pool:pool.uid};}
`;

/* ===== A. 機構の形 ===== */
harness(COMMON + String.raw`
ok('A1 ★ 正規表現に「られた」が入った（これが無いと「墓地へ送られた時」に 1 件も当たらない）',
   String(MISSED_TIMING_TERM_S03).indexOf('られた')>=0,
   String(MISSED_TIMING_TERM_S03));
ok('A2 ★ 語の表に破壊・墓地送り・除外・リリースが入り、召喚語の割り当ては変わっていない',
   (function(){
     const m={}; MISSED_TIMING_SUMMON_WORDS_S03.forEach(w=>m[w[0]]=w[1]);
     return m['破壊']==='D' && m['戦闘で破壊']==='B' && m['墓地へ送']==='G'
       && m['フィールドから墓地へ送']==='GF' && m['除外']==='X' && m['リリース']==='T'
       && m['通常召喚']==='N' && m['特殊召喚']==='S' && m['反転召喚']==='F' && m['リバース']==='R'
       && m['召喚']==='N' && m['シンクロ召喚']==='S';
   })(),
   JSON.stringify(MISSED_TIMING_SUMMON_WORDS_S03.map(w=>w.join(':'))));
ok('A3 ★ 種別の表は onDestroy → D だけ（墓地送り・場からの離脱・除外は入れていない）',
   JSON.stringify(MISSED_TIMING_DESTROY_CLASS_S03)===JSON.stringify({onDestroy:'D'}),
   JSON.stringify(MISSED_TIMING_DESTROY_CLASS_S03));
ok('A4 ★ 有効な種別は summonSuccess と destroyed（flipSummonReverse は無効のまま）',
   MISSED_TIMING_CLASSES_S03.summonSuccess===true
   && MISSED_TIMING_CLASSES_S03.destroyed===true
   && MISSED_TIMING_CLASSES_S03.flipSummonReverse===false,
   JSON.stringify(MISSED_TIMING_CLASSES_S03));
ok('A5 ★ (B-5) の許可リストに入った破壊の組は 1 件だけ（《スネーク・ホイッスル》）',
   Object.keys(MISSED_TIMING_CONFIRMED_S03)
     .filter(n=>(MISSED_TIMING_CONFIRMED_S03[n].ev||[]).indexOf('onDestroy')>=0)
     .join('/')==='スネーク・ホイッスル',
   JSON.stringify(Object.keys(MISSED_TIMING_CONFIRMED_S03)
     .filter(n=>(MISSED_TIMING_CONFIRMED_S03[n].ev||[]).indexOf('onDestroy')>=0)));
`, {expect:5});

/* ===== B. negative control: 召喚句の読み取りは 1 件も変わっていない ===== */
harness('const BASE=' + JSON.stringify(BASE_S506) + ';' + COMMON + String.raw`
let cards=0, summonClauses=0;
const per={N:{toki:0,baai:0},S:{toki:0,baai:0},F:{toki:0,baai:0},R:{toki:0,baai:0}};
for(let i=0;i<CARD_DB.length;i++){
  const db=CARD_DB[i]; if(!db||!db.n) continue;
  cards++;
  missedTimingTextClausesS03(db.n).forEach(c=>c.cls.forEach(cl=>{
    if(per[cl]){ per[cl][c.kind==='時'?'toki':'baai']++; summonClauses++; }
  }));
}
const kinds={};
['N','S','F','R'].forEach(cl=>{
  let t=0,b=0,n=0;
  for(let i=0;i<CARD_DB.length;i++){
    const db=CARD_DB[i]; if(!db||!db.n) continue;
    const v=missedTimingClauseKindS03(db.n,cl);
    if(v==='toki')t++; else if(v==='baai')b++; else n++;
  }
  kinds[cl]={toki:t,baai:b,none:n};
});
ok('B1 ★ negative control: 全 4996 枚の召喚句（N/S/F/R）の件数が S03-U505 時点と完全に同じ',
   cards===BASE.cards && JSON.stringify(per)===JSON.stringify(BASE.per),
   JSON.stringify({cards,per}));
ok('B2 ★ negative control: カードごとの N/S/F/R の判定も完全に同じ',
   JSON.stringify(kinds)===JSON.stringify(BASE.kinds), JSON.stringify(kinds));
/* 1 つの句が複数の召喚語を持つことがある（「召喚・特殊召喚に成功した時」など）ので、
   句の数（531）と種類の出現数（692）は別である。ここは出現数で見る。 */
ok('B3 ★ negative control: 召喚語の出現数も S03-U505 時点と同じ 692',
   summonClauses===692
   && (BASE.per.N.toki+BASE.per.N.baai+BASE.per.S.toki+BASE.per.S.baai
       +BASE.per.F.toki+BASE.per.F.baai+BASE.per.R.toki+BASE.per.R.baai)===692,
   JSON.stringify({summonClauses}));
`, {expect:3});

/* ===== C. 当時裁定の場面 ===== */
harness(COMMON + String.raw`
/* C1 《地砕き》= 破壊だけで終わる → 発動できる */
const ids=whistleBoard('地砕き');
duelActivateFromHand(0);
drive();
const c1=COLLECT.find(x=>x.ev==='onDestroy')||null;
ok('C1 ★ 破壊だけで終わる効果なら《スネーク・ホイッスル》は発動でき、デッキの爬虫類族が特殊召喚される',
   zu(ids.mon)==='grave' && zu(ids.pool)==='mz' && zu(ids.trap)==='grave'
   && MISSED_TIMING_DROPS_S03.length===0
   && !!c1 && c1.stamp===c1.now && c1.names.indexOf('スネーク・ホイッスル')>=0,
   JSON.stringify({mon:zu(ids.mon),pool:zu(ids.pool),trap:zu(ids.trap),c1,deltas:stepDeltas()}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
/* C2 《ソウルテイカー》= 破壊の後に回復がある → 逃す（WIKI-1B4D52FCA757 の理由と同じ形） */
const ids=whistleBoard('ソウルテイカー');
duelActivateFromHand(0);
drive();
const c2=COLLECT.find(x=>x.ev==='onDestroy')||null;
ok('C2 ★ 破壊の後に回復の処理があると《スネーク・ホイッスル》はタイミングを逃す'
   +'（当時裁定 WIKI-9E5470176D20 09/08/07・WIKI-1B4D52FCA757 10/08/11）',
   zu(ids.mon)==='grave' && zu(ids.pool)==='deck' && zu(ids.trap)==='sz'
   && MISSED_TIMING_DROPS_S03.map(d=>d.name).join('/')==='スネーク・ホイッスル'
   && !!c2 && c2.stamp!==c2.now,
   JSON.stringify({mon:zu(ids.mon),pool:zu(ids.pool),trap:zu(ids.trap),c2,
     deltas:stepDeltas(),drops:MISSED_TIMING_DROPS_S03.map(d=>d.name)}));
ok('C3 ★ 刻みの違いが理由（破壊 1→2 のあと回復 2→3 が入る）',
   stepDeltas().join('/')==='MOVE:0->1/FX_TO_GRAVE:1->2/LP:2->3',
   JSON.stringify(stepDeltas()));
audit('C2');
`, {expect:3});

/* ===== D. (A) から FX_SELF_TO_GRAVE を外した ===== */
harness('const SRC=' + JSON.stringify(SRC_S506) + ';' + COMMON + String.raw`
ok('D1 ★ FX_SELF_TO_GRAVE は (A) の「処理」に数えない',
   MISSED_TIMING_PROCESSING_S03.get('FX_SELF_TO_GRAVE')===undefined
   && missedTimingIsProcessingS03({type:'FX_SELF_TO_GRAVE',player:0,zone:'sz',index:0})===false,
   JSON.stringify({has:MISSED_TIMING_PROCESSING_S03.has('FX_SELF_TO_GRAVE')}));
ok('D2 ★ 実測: 申告つきで実際に処理番号が動かない',
   (function(){
     fresh();
     const sp=mk('地砕き',0,'up'); gameState.players[0].sz=[sp]; baselineA();
     const before=s();
     act({type:'FX_SELF_TO_GRAVE',player:0,zone:'sz',index:0});
     return s()===before && (gameState.players[0].sz||[]).length===0;
   })(), 'x');
/* 呼び出し元の全件（S03-U506 で数えた。すべてそのカード自身の後片付け） */
const sites=['engine/20_effect_primitives_ex.js','engine/30_processor_chain_battle.js',
  'engine/40_legal_script_engine.js','engine/70_summon_procedures.js',
  'engine/1U_negated_activation_grave_s03.js'];
ok('D3 ★ FX_SELF_TO_GRAVE を発行するのはこの 5 ファイルだけで、各 1 箇所',
   sites.every(f=>(SRC[f].match(/type:\s*["']FX_SELF_TO_GRAVE["']/g)||[]).length===1),
   JSON.stringify(sites.map(f=>f+':'+(SRC[f].match(/type:\s*["']FX_SELF_TO_GRAVE["']/g)||[]).length)));
ok('D4 ★ engine のコメントに、外した理由と当時裁定（WIKI-1B4D52FCA757 10/08/11）が書かれている',
   SRC['engine/1ZZX_missed_timing_s03.js'].indexOf('FX_SELF_TO_GRAVE は数えない')>=0
   && SRC['engine/1ZZX_missed_timing_s03.js'].indexOf('WIKI-1B4D52FCA757')>=0
   && SRC['engine/1ZZX_missed_timing_s03.js'].indexOf('2010-08-11')>=0, 'x');
`, {expect:4});

/* ===== E. negative control: 落ちない側 ===== */
harness(COMMON + String.raw`
ok('E1 ★ negative control: 「破壊された場合」のカードは種別が付かない（WIKI-17DDC86F4023 09/05/14）',
   ['古代の機械究極巨人','月影龍クイラ','ライトニング・トライコーン','エレキトンボ','極星宝ドラウプニル']
     .every(n=>missedTimingClauseKindS03(n,'D')==='baai'
       && missedTimingClassS03({name:n,eventName:'onDestroy'},{stepS03:0})===null),
   JSON.stringify(['古代の機械究極巨人','月影龍クイラ','ライトニング・トライコーン','エレキトンボ',
     '極星宝ドラウプニル'].map(n=>n+':'+missedTimingClauseKindS03(n,'D'))));
ok('E2 ★ negative control: 配線が onDestroy でも句が「墓地へ送られた時」なら種別は付かない'
   +'（《森の番人グリーン・バブーン》。墓地送りの家族は別単位）',
   missedTimingClauseKindS03('森の番人グリーン・バブーン','D')===null
   && missedTimingClauseKindS03('森の番人グリーン・バブーン','G')==='toki'
   && missedTimingClassS03({name:'森の番人グリーン・バブーン',eventName:'onDestroy'},{stepS03:0})===null,
   'x');
ok('E3 ★ negative control: 墓地送り・場からの離脱・除外のイベントには種別が付かない',
   ['onSendToGrave','onLeaveField','onRemove','onFieldToGraveBatchS03']
     .every(e=>Object.keys(CARD_SCRIPTS).every(n=>
       missedTimingClassS03({name:n,eventName:e},{stepS03:0})===null)),
   'x');
`, {expect:3});

/* ===== F. (B-5) の門 ===== */
harness(COMMON + String.raw`
/* 配線が onDestroy かつ句が D:時 のカードのうち、許可リストに無いものは落とさない */
const wired=Object.keys(CARD_SCRIPTS).filter(n=>{
  const sc=CARD_SCRIPTS[n]; return !!(sc&&sc.passive&&typeof sc.passive.onDestroy==='function');});
const toki=wired.filter(n=>missedTimingClauseKindS03(n,'D')==='toki');
const notAllowed=toki.filter(n=>!MISSED_TIMING_CONFIRMED_S03[n]);
ok('F1 ★ onDestroy かつ「破壊された時」の候補は複数あり、許可リストに入っているのは 1 枚だけ',
   toki.length>=3 && notAllowed.length===toki.length-1,
   JSON.stringify({toki,notAllowed}));
ok('F2 ★ 許可リストに無い候補は (B-5) の門で落とさない（当時の根拠が無いので従来挙動）',
   notAllowed.every(n=>missedTimingDropS03(
     {name:n,eventName:'onDestroy',p:0},{stepS03:-1})===false),
   JSON.stringify(notAllowed.filter(n=>missedTimingDropS03(
     {name:n,eventName:'onDestroy',p:0},{stepS03:-1})!==false)));
/* R4 の比較を成立させるため、刻みを現在の番号（0）と違う値にする。
   実経路での証明は C2（《ソウルテイカー》）が持っている。 */
ok('F3 ★ 許可リストに入っている《スネーク・ホイッスル》は、番号が動いていれば落とす',
   missedTimingDropS03({name:'スネーク・ホイッスル',eventName:'onDestroy',p:0},{stepS03:-1})===true,
   JSON.stringify({drop:missedTimingDropS03({name:'スネーク・ホイッスル',eventName:'onDestroy',p:0},{stepS03:-1})}));
`, {expect:3});

/* ===== G. 文書・登録 ===== */
harness('const SRC=' + JSON.stringify(SRC_S506) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'], RUL=SRC['docs/S03_MISSED_TIMING_RULINGS.md'];
ok('G1 ★ 設計書 (F) に、入れたのは破壊の側だけだと書かれている',
   DOC.indexOf('### (F) 破壊・墓地送りが条件の誘発')>=0
   && DOC.indexOf('S03-U506')>=0, 'x');
ok('G2 ★ 設計書に FX_SELF_TO_GRAVE を外したことが書かれている',
   DOC.indexOf('FX_SELF_TO_GRAVE')>=0, 'x');
ok('G3 ★ 裁定記録に《スネーク・ホイッスル》の裁定（WIKI-9E5470176D20、回答日 2009-08-07）がある',
   RUL.indexOf('WIKI-9E5470176D20')>=0 && RUL.indexOf('2009-08-07')>=0, 'x');
ok('G4 ★ (B-5) の該当件に裁定 ID が付いている',
   (MISSED_TIMING_CONFIRMED_S03['スネーク・ホイッスル'].rulings||[]).join('/')==='WIKI-9E5470176D20'
   && MISSED_TIMING_CONFIRMED_S03['スネーク・ホイッスル'].basis==='A',
   JSON.stringify(MISSED_TIMING_CONFIRMED_S03['スネーク・ホイッスル']));
ok('G5 専用テストが tools/check.py に登録されている',
   /test_s03_u506_destroyed_class\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:5});
