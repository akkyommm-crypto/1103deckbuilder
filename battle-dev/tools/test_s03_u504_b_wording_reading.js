/* S03-U504: (B-4) の「B 文言」4 枚を読解する単位（設計書 5-a の項目 10）。**挙動は変えていない。**

   S03-U495 は裁定 DB の引き方を直したとき、「他のカードのページで名前が挙がり句が引用されているが、
   その句がこのカードの話かどうかを読んでいない」4 枚を項目 10 に残した:
     《ジャンク・シンクロン》《デスカイザー・ドラゴン／バスター》《デブリ・ドラゴン》《レッド・ガジェット》
   この単位でその 4 枚を読み、**タイミングを逃す軸の話かどうか**を決めた。

   読解の結果:
     1. 《ジャンク・シンクロン》… 名前が挙がる裁定は**蘇生したモンスターの効果を無効にする永続効果**の話。
        `WIKI-EB2D10B532D5`（08/09/20、無効化の範囲）・`WIKI-296D4FFDBA92`（09/06/21）・
        `WIKI-6476EC5B8C29`（09/12/28）・`WIKI-23E6AE53AB31`（09/07/18）・`WIKI-521DF8D20F59`（11/01/12）。
        → **軸の話ではない。**(B-4)（機械分類だけ）のまま。
     2. 《デブリ・ドラゴン》… 同じく無効化とシンクロ素材の制約の話。
        `WIKI-E77AB6BFADEF`（09/07/29）・`WIKI-AFD2AB8A4FAB`（11/08/26）・`WIKI-A373F554823C`（09/09/09）・
        `WIKI-33E3B275DABF`（09/11/14）・`WIKI-23E6AE53AB31`（09/07/18）・`WIKI-6476EC5B8C29`（09/12/28）。
        → **軸の話ではない。**(B-4) のまま。
     3. 《デスカイザー・ドラゴン／バスター》… `WIKI-521DF8D20F59`（**回答日 2011-01-12**）は
        「特殊召喚された事により効果が発動した後、《月の書》で裏側守備表示にされた場合に特殊召喚できるか」
        → 「はい」。これは**発動後の解決**の話で、タイミングを逃すかどうかではない。
        自身のページの 2 件（`WIKI-D81479ABC3A8` 08/11/17 対象、`WIKI-79EDE997FA29` 08/11/20 リセット）も軸外。
        → **軸の話ではない。**(B-4) のまま。
     4. 《レッド・ガジェット》… `WIKI-E14C67136AC3`（掲載ページ《A・ジェネクス・アクセル》）の**追記**が軸の話。
        「攻撃力が倍になる効果は特殊召喚された後に新たにチェーンブロックは作られますか？」
        →「いいえ、特殊召喚する効果の一連の効果処理になりますので新たにチェーンブロックが作られることは
           ありません。(10/02/04) **なお、《レッド・ガジェット》を特殊召喚した場合効果を発動することが
           できます。(11/06/27)**」
        **回答日 2011-06-27** の後半が、1 回の解決の中で「特殊召喚 → 攻撃力が倍」と続いても
        《レッド・ガジェット》の誘発は**発動できる**と答えている（R4 の場面。《命の綱》
        `WIKI-97F65A6DBC45` と同じ形）。**実測の結果、いまのエンジンはこの裁定どおりである。**

   固定するもの:
     A 4 枚はいずれも (B-5) の許可リストに入っていない（＝落としていない）
     B 《レッド・ガジェット》の当時裁定の場面を実経路で再現し、発動できることを固定
     C その理由（解決中の特殊召喚成功のイベントは、リンクの解決が終わる所でまとめて積まれるので、
       刻みが最後になる）を実測で固定
     D **negative control**: 同じ盤面で刻みが 1 つ進めば落ちる（軸そのものは生きている）
     E 文書 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S504 = pathA.resolve(__dirname, '..');
const rdS504 = p => fsA.readFileSync(pathA.join(ROOT_S504, p), 'utf8');
const SRC_S504 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS504('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS504('docs/S03_MISSED_TIMING_RULINGS.md'),
  'engine/30_processor_chain_battle.js': rdS504('engine/30_processor_chain_battle.js'),
  'tools/check.py': rdS504('tools/check.py')
};
/* 読解した 4 枚と、読んだ裁定の ID */
const B_CARDS_S504 = ['ジャンク・シンクロン', 'デスカイザー・ドラゴン／バスター', 'デブリ・ドラゴン', 'レッド・ガジェット'];
const RULINGS_S504 = ['WIKI-EB2D10B532D5', 'WIKI-296D4FFDBA92', 'WIKI-6476EC5B8C29', 'WIKI-23E6AE53AB31',
  'WIKI-521DF8D20F59', 'WIKI-E77AB6BFADEF', 'WIKI-AFD2AB8A4FAB', 'WIKI-A373F554823C', 'WIKI-33E3B275DABF',
  'WIKI-D81479ABC3A8', 'WIKI-79EDE997FA29', 'WIKI-E14C67136AC3'];

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
/* 《A・ジェネクス・アクセル》の効果で墓地の《レッド・ガジェット》を特殊召喚する盤面 */
function accelBoard(){
  fresh();
  gameState.players[0].mz=[mk('A・ジェネクス・アクセル',0,'up')];
  const red=mk('レッド・ガジェット',0);
  gameState.players[0].grave=[red];
  gameState.players[0].hand=[mk('ワイト',0)];          /* 発動コストの手札 1 枚 */
  const yellow=mk('イエロー・ガジェット',0);
  gameState.players[0].deck.splice(1,0,yellow);
  baselineA();
  return {red:red.uid, yellow:yellow.uid};}
`;

/* ===== A. 4 枚はどれも落としていない ===== */
harness('const CARDS=' + JSON.stringify(B_CARDS_S504) + ';' + COMMON + String.raw`
ok('A1 ★ 読解した 4 枚はすべて実装されている',
   CARDS.every(n=>!!CARD_SCRIPTS[n]), JSON.stringify(CARDS.map(n=>n+':'+!!CARD_SCRIPTS[n])));
ok('A2 ★ 4 枚はどれも (B-5) の許可リストに入っていない（＝いまも 1 件も落としていない）',
   CARDS.every(n=>!MISSED_TIMING_CONFIRMED_S03[n]),
   JSON.stringify(CARDS.filter(n=>!!MISSED_TIMING_CONFIRMED_S03[n])));
ok('A3 《レッド・ガジェット》は召喚・特殊召喚の両方で誘発する（当時テキストどおり）',
   typeof (CARD_SCRIPTS['レッド・ガジェット'].passive||{}).onNormalSummon==='function'
   && typeof (CARD_SCRIPTS['レッド・ガジェット'].passive||{}).onSpecialSummon==='function',
   JSON.stringify(Object.keys(CARD_SCRIPTS['レッド・ガジェット'].passive||{})));
`, {expect:3});

/* ===== B / C. 《レッド・ガジェット》の当時裁定（11/06/27）を実経路で ===== */
harness(COMMON + String.raw`
const ids=accelBoard();
const L=strictScriptLegalityV2('A・ジェネクス・アクセル',0,'mz',0,{});
ok('B0 前提: 《A・ジェネクス・アクセル》の効果を発動できる', L.ok===true, JSON.stringify(L));
duelActivateFromZone(0,'mz',0);
const tr=drive();
ok('B1 ★ 当時裁定（WIKI-E14C67136AC3 の追記、回答日 2011-06-27）どおり、1 回の解決で'
   +'「特殊召喚 → 攻撃力が倍」と続いても《レッド・ガジェット》の効果は発動できる'
   +'（デッキの《イエロー・ガジェット》が手札へ）',
   tr==='idle' && zu(ids.yellow)==='hand' && zu(ids.red)==='mz'
   && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({yellow:zu(ids.yellow),red:zu(ids.red),
     drops:MISSED_TIMING_DROPS_S03.map(d=>d.name)}));
ok('B2 ★ 1 回の解決の刻みは 4 つ（手札を捨てる・特殊召喚・攻撃力・ガジェットのサーチ）',
   stepDeltas().join('/')==='FX_DISCARD:0->1/FX_SPECIAL_SUMMON:1->2/MOD_ADD:2->3/FX_SEARCH:3->4',
   JSON.stringify(stepDeltas()));
const c=COLLECT.find(x=>x.ev==='onSpecialSummon')||null;
ok('C1 ★ 理由（実測）: 解決中の特殊召喚成功のイベントはリンクの解決が終わる所でまとめて積まれるので'
   +'（flushResolutionSummonBatchV2）、刻みが**最後**になる。判定時に刻みと現在の番号が一致するため'
   +'R4 で落ちない',
   !!c && c.stamp===3 && c.now===3 && c.names.indexOf('レッド・ガジェット')>=0,
   JSON.stringify(c));
audit('B');
`, {expect:5});

/* ===== D. negative control: 軸そのものは生きている ===== */
harness(COMMON + String.raw`
/* 同じ《レッド・ガジェット》でも、召喚の後に別の処理が入る形（《ゴブリンドバーグ》の召喚誘発で
   特殊召喚し、そのあと自身が守備表示になる）では、(B-5) に入っていないので**落とさない**が、
   刻みは一致しなくなる。軸（R4 の比較）が生きていることを刻みで示す。 */
fresh();
const gob=mk('ゴブリンドバーグ',0), red=mk('レッド・ガジェット',0);
gameState.players[0].hand=[gob,red];
const yellow=mk('イエロー・ガジェット',0);
gameState.players[0].deck.splice(1,0,yellow);
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const tr=drive();
const c=COLLECT.find(x=>x.ev==='onSpecialSummon')||null;
ok('D1 ★ negative control: 召喚の後に守備表示にする処理が入る形では、刻みと判定時の番号が一致しない'
   +'（軸の比較は生きている）',
   !!c && c.stamp!==c.now,
   JSON.stringify({c,deltas:stepDeltas()}));
ok('D2 ★ それでも《レッド・ガジェット》は (B-5) の許可リストに無いので落とさない'
   +'（当時の根拠が無いものは従来挙動のまま ＝ S03-U496 の約束）',
   MISSED_TIMING_DROPS_S03.map(d=>d.name).indexOf('レッド・ガジェット')<0
   && zu(yellow.uid)==='hand',
   JSON.stringify({drops:MISSED_TIMING_DROPS_S03.map(d=>d.name),yellow:zu(yellow.uid)}));
audit('D');
`, {expect:3});

/* ===== E. 文書 ===== */
harness('const DOC=' + JSON.stringify(SRC_S504['docs/S03_MISSED_TIMING_DESIGN.md']) + ';'
      + 'const RUL=' + JSON.stringify(SRC_S504['docs/S03_MISSED_TIMING_RULINGS.md']) + ';'
      + 'const SRC=' + JSON.stringify(SRC_S504) + ';'
      + 'const IDS=' + JSON.stringify(RULINGS_S504) + ';' + COMMON + String.raw`
ok('E1 ★ 裁定記録に S03-U504 の節があり、読んだ裁定の ID が全部入っている',
   RUL.indexOf('S03-U504 で読解した「B 文言」の 4 枚')>=0
   && IDS.every(id=>RUL.indexOf(id)>=0),
   JSON.stringify(IDS.filter(id=>RUL.indexOf(id)<0)));
ok('E2 ★ 《レッド・ガジェット》の追記の回答日（2011-06-27）が記録されている',
   RUL.indexOf('2011-06-27')>=0 && RUL.indexOf('WIKI-E14C67136AC3')>=0, 'x');
ok('E3 ★ 設計書の項目 10 が「読解した」に書き直され、4 枚それぞれの結論が書かれている',
   DOC.indexOf('| 10 | **読解した（S03-U504）。**')>=0
   && DOC.indexOf('軸の話ではない')>=0,
   'x');
ok('E4 ★ 設計書に、解決中の特殊召喚成功のイベントが最後にまとめて積まれるという実測が書かれている',
   DOC.indexOf('flushResolutionSummonBatchV2')>=0, 'x');
ok('E5 ★ engine 側の該当箇所（flushResolutionSummonBatchV2）はリンクの解決の終わりで呼ばれている',
   /flushResolutionSummonBatchV2\(\); reconcileProcedureBaseStats\(\);/.test(SRC['engine/30_processor_chain_battle.js']),
   'x');
ok('E6 ★ 本単位は挙動を変えていない（engine にも cards にも S03-U504 の変更が無い）',
   SRC['engine/30_processor_chain_battle.js'].indexOf('S03-U504')<0, 'x');
ok('E7 専用テストが tools/check.py に登録されている',
   /test_s03_u504_b_wording_reading\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:7});
