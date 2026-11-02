/* S03-U507: 《虚無空間》の自壊がタイミングを逃す（**R1 の例外**。mode 'miss' の 1 件目）。

   当時裁定 `WIKI-07B43F63245D`（**回答日 2011-07-16**）:
     Q「《虚無空間》が存在する時に《オベリスクの巨神兵》をアドバンス召喚しました。この時、モンスターが
        墓地に送られましたが、《虚無空間》の自壊効果は発動しますか？」
     A「《虚無空間》の自壊効果の発動するタイミングを逃していますので破壊されません。(11/07/16)」

   これは **R1（強制誘発は逃さない）と衝突する。** R1 には回答日のある裁定が複数あるので外さず、
   このカードだけを (B-1) の宣言（mode 'miss'）で上書きし、宣言を R1 より先に見るようにした。

   **テキストの時代混在でもある**（S03-U494 の軸）。いまの `carddata.json` は改訂後のテキストで
   「デッキまたはフィールドから自分の墓地へカードが送られた**場合に発動する**」。2011 当時は
   「…墓地にカードが送られた**時**、このカードを破壊する」だった。だから (B-2) の文言では判定できず、
   カードごとの宣言が必要になる（実測：この語順では句が 1 つも読めない）。

   固定するもの:
     A 宣言の形（mode 'miss' は 1 件だけ）
     B 判定の順序（宣言は R1 より先）
     C 当時裁定の場面（アドバンス召喚のリリース → 自壊しない）
     D その裏返し（墓地送りが最後の処理 → 自壊する）
     E **negative control**: R1 は他の強制誘発を今までどおり守る
     F テキストの時代混在の記録
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S507 = pathA.resolve(__dirname, '..');
const rdS507 = p => fsA.readFileSync(pathA.join(ROOT_S507, p), 'utf8');
const SRC_S507 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS507('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS507('docs/S03_MISSED_TIMING_RULINGS.md'),
  'engine/1ZZX_missed_timing_s03.js': rdS507('engine/1ZZX_missed_timing_s03.js'),
  'tools/check.py': rdS507('tools/check.py')
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
    COLLECT.push({ev,names:(r||[]).map(x=>x.name),
      stamp:(evt&&evt.stepS03)!=null?evt.stepS03:null,now:s()});
    return r;};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];COLLECT=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function stepDeltas(){return STEPS.filter(x=>x.before!==x.after).map(x=>x.t+':'+x.before+'->'+x.after);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
`;

/* ===== A. 宣言の形 ===== */
harness(COMMON + String.raw`
ok('A1 ★ (B-1) に《虚無空間》の宣言があり、mode は miss・裁定 ID 付き',
   !!MISSED_TIMING_DECL_S03['虚無空間']
   && MISSED_TIMING_DECL_S03['虚無空間'].mode==='miss'
   && MISSED_TIMING_DECL_S03['虚無空間'].ruling==='WIKI-07B43F63245D',
   JSON.stringify(MISSED_TIMING_DECL_S03['虚無空間']));
ok('A2 ★ mode が miss の宣言は《虚無空間》1 件だけ（他はすべて never）',
   Object.keys(MISSED_TIMING_DECL_S03)
     .filter(n=>MISSED_TIMING_DECL_S03[n].mode==='miss').join('/')==='虚無空間'
   && Object.keys(MISSED_TIMING_DECL_S03)
     .filter(n=>MISSED_TIMING_DECL_S03[n].mode==='never').length>=6,
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03)
     .map(n=>n+':'+MISSED_TIMING_DECL_S03[n].mode)));
ok('A3 ★ 実測: いまのテキストでは句が 1 つも読めない（改訂後の語順のため）',
   missedTimingTextClausesS03('虚無空間').length===0
   && missedTimingClauseKindS03('虚無空間','G')===null
   && missedTimingClauseKindS03('虚無空間','D')===null,
   JSON.stringify({clauses:missedTimingTextClausesS03('虚無空間'),
     text:String((CARD_DB[findCardIndex('虚無空間')]||{}).e||'').slice(0,80)}));
`, {expect:3});

/* ===== B. 判定の順序 ===== */
harness(COMMON + String.raw`
fresh(); baselineA();
ok('B1 ★ 宣言 miss は、刻みが動いていれば落とす（R1 より先に見るので強制でも落ちる）',
   missedTimingDropS03({name:'虚無空間',eventName:'onSendToGrave',p:0},{stepS03:-1})===true,
   'x');
ok('B2 ★ 刻みが動いていなければ落とさない（R4 の比較は宣言より先）',
   missedTimingDropS03({name:'虚無空間',eventName:'onSendToGrave',p:0},{stepS03:0})===false,
   JSON.stringify({now:s()}));
ok('B3 ★ engine の判定で mode miss が R1 より上にある（順序そのものを固定）',
   (function(){
     const src=String(missedTimingDropS03);
     const iMiss=src.indexOf("mode === 'miss'"), iForced=src.indexOf('triggerCandidateForcedS03');
     return iMiss>=0 && iForced>=0 && iMiss<iForced;
   })(), 'x');
`, {expect:3});

/* ===== C. 当時裁定の場面 ===== */
harness(COMMON + String.raw`
fresh();
const kuu=mk('虚無空間',0,'up');
gameState.players[0].sz=[kuu];
const trib=mk('ワイト',0,'up');
gameState.players[0].mz=[trib];
const boss=mk('デーモンの召喚',0);
gameState.players[0].hand=[boss];
baselineA();
PREFER=[trib.uid];
doNormalSummon(0,'atk');
const tr=drive();
ok('C1 ★ 当時裁定どおり: アドバンス召喚でリリースしたモンスターが墓地へ送られても、'
   +'その後に召喚が続くので《虚無空間》は破壊されない',
   tr==='idle' && zu(kuu.uid)==='sz' && zu(trib.uid)==='grave' && zu(boss.uid)==='mz'
   && MISSED_TIMING_DROPS_S03.map(d=>d.name).join('/')==='虚無空間',
   JSON.stringify({kuu:zu(kuu.uid),trib:zu(trib.uid),boss:zu(boss.uid),
     deltas:stepDeltas(),drops:MISSED_TIMING_DROPS_S03.map(d=>d.name)}));
ok('C2 ★ 刻みの違いが理由（リリース 0→1 のあと召喚 1→2 が入る）',
   stepDeltas().join('/')==='FX_TO_GRAVE:0->1/NORMAL_SUMMON:1->2'
   && (COLLECT.find(c=>c.ev==='onSendToGrave')||{}).stamp===1
   && (COLLECT.find(c=>c.ev==='onSendToGrave')||{}).now===2,
   JSON.stringify({deltas:stepDeltas(),c:COLLECT.find(c=>c.ev==='onSendToGrave')}));
audit('C');
`, {expect:3});

/* ===== D. 裏返し ===== */
harness(COMMON + String.raw`
fresh();
const kuu=mk('虚無空間',0,'up');
gameState.players[0].sz=[kuu];
gameState.players[0].hand=[mk('おろかな埋葬',0)];
baselineA();
duelActivateFromHand(0);
const tr=drive();
ok('D1 ★ 墓地送りが最後の処理なら《虚無空間》は自壊する（宣言は R4 の比較を飛ばさない）',
   tr==='idle' && zu(kuu.uid)==='grave'
   && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({kuu:zu(kuu.uid),deltas:stepDeltas(),
     drops:MISSED_TIMING_DROPS_S03.map(d=>d.name),
     collect:COLLECT.filter(c=>c.ev==='onSendToGrave')}));
audit('D');
`, {expect:2});

/* ===== E. negative control: R1 は他の強制誘発を守る ===== */
harness(COMMON + String.raw`
fresh(); baselineA();
/* never 宣言のカードは今までどおり落ちない */
ok('E1 ★ negative control: never 宣言のカード（R1 の 6 枚ほか）は刻みが動いても落ちない',
   ['リチュア・チェイン','炎帝近衛兵','バーニング・スカルヘッド','サイコ・エンペラー','スノーマンイーター']
     .every(n=>missedTimingDropS03({name:n,eventName:'onNormalSummon',p:0},{stepS03:-1})===false),
   JSON.stringify(['リチュア・チェイン','炎帝近衛兵','バーニング・スカルヘッド','サイコ・エンペラー',
     'スノーマンイーター'].map(n=>n+':'+missedTimingDropS03(
       {name:n,eventName:'onNormalSummon',p:0},{stepS03:-1}))));
ok('E2 ★ negative control: 宣言の無いカードは R1 と (B-5) の門に今までどおり掛かる',
   missedTimingModeS03('ワイト')===null
   && missedTimingDropS03({name:'ワイト',eventName:'onNormalSummon',p:0},{stepS03:-1})===false,
   'x');
ok('E3 ★ R1 の分岐は残っている（engine の判定に triggerCandidateForcedS03 がある）',
   String(missedTimingDropS03).indexOf('triggerCandidateForcedS03')>=0, 'x');
`, {expect:3});

/* ===== F/G. 文書・登録 ===== */
harness('const SRC=' + JSON.stringify(SRC_S507) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'], RUL=SRC['docs/S03_MISSED_TIMING_RULINGS.md'];
const ENG=SRC['engine/1ZZX_missed_timing_s03.js'];
ok('F1 ★ engine のコメントに裁定 ID と回答日、R1 との衝突が書かれている',
   ENG.indexOf('WIKI-07B43F63245D')>=0 && ENG.indexOf('2011-07-16')>=0
   && ENG.indexOf('R1（強制誘発は逃さない）と衝突する')>=0, 'x');
ok('F2 ★ engine のコメントにテキストの時代混在（改訂後は「場合に発動する」）が書かれている',
   ENG.indexOf('場合に発動する')>=0 && ENG.indexOf('2011 当時は')>=0, 'x');
ok('F3 ★ 裁定記録に《虚無空間》の裁定本文がある',
   RUL.indexOf('WIKI-07B43F63245D')>=0 && RUL.indexOf('2011-07-16')>=0, 'x');
ok('G1 ★ 設計書の R1 の行に例外が書かれ、5-a に項目 11 として入り、段階表にも完了として入っている',
   DOC.indexOf('**例外 1 件（S03-U507）**')>=0
   && DOC.indexOf('| 11 | **R1 の例外は《虚無空間》1 枚だけ（S03-U507 で入れた）。**')>=0
   && DOC.indexOf('**S03-U507（完了）**')>=0, 'x');
ok('G2 専用テストが tools/check.py に登録されている',
   /test_s03_u507_vanity_emptiness_miss\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:5});
