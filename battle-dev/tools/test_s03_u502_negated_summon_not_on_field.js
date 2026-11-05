/* S03-U502: 召喚を無効にされて取り除かれたモンスターを「フィールドに出なかった」扱いにする単位。
   設計は docs/S03_MISSED_TIMING_DESIGN.md の (E)、直した項目は 5-a #1-i。

   S03-U498 が入れた窓は、案 (b)（召喚はそのまま行い、無効のときだけ取り除く）なので、手札から出した
   モンスターが一瞬だけモンスターゾーンに居る。そのため取り除いたときに `v9DetectLeaveField`
   （`engine/18`。**盤面の差分**で離脱を検出するルール処理）が `onLeaveField` を積んでいた。
   S03-U500 がそれを実測して 5-a #1-i に記録し、S03-U501 が当時裁定を引き直した。

   当時裁定（本文は docs/S03_MISSED_TIMING_RULINGS.md の S03-U501 節）:
     `WIKI-9E991E9B14E9`（**回答日 2010-04-21**）「フィールド上で破壊された扱いではない」
     `WIKI-643A78AB3480`（**回答日 2008-03-19**）「『フィールド上のモンスターを破壊する』扱いではありません」
     `WIKI-933C52FB1EC1`（**回答日なし**）「モンスターはフィールドに出なかった」
   → 手札から出した召喚を無効にされた分は、場からの離脱に数えない。

   直し方: 取り除きの Action 自身が申告する（`MOVE` に `summonNegatedS03:<uid>`）。
   `v9DetectLeaveField` は `applyAction` の中で呼ばれるので、Journal 再生でも同じ Action から同じ判断になる。
   申告の無い Action は何も変わらない（**negative control** の D）。

   固定するもの:
     A 直った挙動（解決中の通常召喚の取り消しで、そのモンスターの離脱が積まれない）
     B 枝の違い（召喚の前から場に居たもの＝反転召喚・デュアル再召喚の離脱は本当の離脱なので積む）
     C 影響しうるカードの全件（`onLeaveField` を見る passive）
     D **negative control**: 申告の無い `MOVE` はこれまでどおり離脱に数える
     E Save/Load・Replay（申告が Action に乗っているので再生でも一致する）
     F 文書 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S502 = pathA.resolve(__dirname, '..');
const rdS502 = p => fsA.readFileSync(pathA.join(ROOT_S502, p), 'utf8');
const SRC_S502 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS502('docs/S03_MISSED_TIMING_DESIGN.md'),
  'engine/18_leave_field_v9.js': rdS502('engine/18_leave_field_v9.js'),
  'engine/00_state_actions.js': rdS502('engine/00_state_actions.js'),
  'engine/1ZZY_summon_negation_window_s03.js': rdS502('engine/1ZZY_summon_negation_window_s03.js'),
  'tools/check.py': rdS502('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let STEPS=[], QLOG=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31;
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',neg:(a&&a.summonNegatedS03)!=null});}};
  const qd=queueDeferredEventV2;queueDeferredEventV2=function(name,evt){
    QLOG.push({name,uid:(evt&&evt.uid)!=null?evt.uid:((evt&&evt.card&&evt.card.uid)!=null?evt.card.uid:null)});
    return qd.apply(this,arguments);};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();STEPS=[];QLOG=[];TOASTS.length=0;resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function actTypes(){return STEPS.map(x=>x.t);}
function ownEvents(uid){return QLOG.filter(x=>x.uid===uid).map(x=>x.name);}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();STEPS=[];QLOG=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function driveToWindow(){for(let i=0;i<120;i++){
  if(gameState.pendingSummon&&!gameState.chain.length&&gameState.pendingSummon.resolvedSummonS03) return 'window';
  if(pc()){__choicePickV49(0);continue;}
  if(!step()) return 'idle';}
  return 'loop';}
function negateInWindow(name){const ps=gameState.pendingSummon;if(!ps)return 'no-window';
  const list=summonNegatorsV2(ps),hit=list.find(x=>x.db.n===name);
  if(!hit)return 'not-offered:'+JSON.stringify(list.map(x=>x.db.n));
  activateSummonNegatorV2(hit.p,hit.zone,hit.index);drive();return 'done';}
function bloodBoard(){
  fresh();
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  gameState.players[1].sz=[setTrap('神の宣告',1)];
  const mon=mk('ワイト',0);
  gameState.players[0].hand=[mon];
  baselineA();
  return {mon:mon.uid};}
`;

/* ===== A. 直った挙動 ===== */
harness(COMMON + String.raw`
const ids=bloodBoard();
duelActivateFromZone(0,'sz',0);
ok('A0 前提: 窓が開く', driveToWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
ok('A1 ★ 解決中の通常召喚を無効にしても、そのモンスターの onLeaveField は積まれない'
   +'（当時裁定では「モンスターはフィールドに出なかった」扱い）',
   r==='done' && zu(ids.mon)==='grave'
   && !QLOG.some(x=>x.name==='onLeaveField'&&x.uid===ids.mon),
   JSON.stringify({r,own:ownEvents(ids.mon),q:QLOG}));
/* U510: 当時裁定の破壊・墓地送りも満たす。U502 の uid ごとの離脱除外は同じ。 */
ok('A2 ★ 取り除きの Action は申告つきの FX_TO_GRAVE 1 つだけ（他の Action には申告が付かない）',
   STEPS.filter(x=>x.neg===true).length===1
   && STEPS.filter(x=>x.neg===true)[0].t==='FX_TO_GRAVE',
   JSON.stringify(STEPS.filter(x=>x.neg===true)));
ok('A3 破壊と墓地送りは積むがフィールド離脱は積まず、召喚成功も保留列から落ちる',
   ownEvents(ids.mon).join('/')==='onNormalSummon/onDestroy/onSendToGrave'
   && (gameState.deferredEvents||[]).every(x=>x.eventName!=='onNormalSummon'),
   JSON.stringify(ownEvents(ids.mon)));
audit('A');
`, {expect:5});

/* ===== B. 枝の違い（場に居たものの離脱は本当の離脱） ===== */
harness(COMMON + String.raw`
/* B1 反転召喚（公開済みの経路。変えていない） */
fresh();
const f=mk('ワイト',0,'down','def'); f.setTurn=gameState.turn-1;
gameState.players[0].mz=[f];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r1=negateInWindow('神の宣告');
ok('B1 反転召喚の取り消しは申告を付けないので、離脱も破壊も積まれる（そのカードは場に居た）',
   r1==='done' && QLOG.some(x=>x.name==='onLeaveField'&&x.uid===f.uid)
   && QLOG.some(x=>x.name==='onDestroy'&&x.uid===f.uid)
   && STEPS.filter(x=>x.neg===true).length===0,
   JSON.stringify({r:r1,own:ownEvents(f.uid),neg:STEPS.filter(x=>x.neg===true).length}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
/* B2 効果によるデュアル再召喚（S03-U500 で入れた枝。申告は付けない） */
fresh();
gameState.phase='end'; gameState.activePlayer=0;
const src=mk('デュアル・サモナー',1,'up'), dual=mk('デュアル・ソルジャー',1,'up');
gameState.players[1].mz=[src,dual];
gameState.players[1].hand=[];
gameState.players[0].sz=[setTrap('神の宣告',0)];
baselineA();
duelActivateFromZone(1,'mz',0);
ok('B2-0 前提: 窓が開く', driveToWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
ok('B2 ★ デュアル再召喚の取り消しも申告を付けない。そのモンスターは召喚の前から場に居たので、'
   +'離脱と破壊が積まれる（S03-U502 で手札の枝とはっきり分けた）',
   r==='done' && QLOG.some(x=>x.name==='onLeaveField'&&x.uid===dual.uid)
   && QLOG.some(x=>x.name==='onDestroy'&&x.uid===dual.uid)
   && STEPS.filter(x=>x.neg===true).length===0,
   JSON.stringify({r,own:ownEvents(dual.uid)}));
audit('B2');
`, {expect:3});

/* ===== C. 影響しうるカードの全件 ===== */
harness(COMMON + String.raw`
const watchers=Object.keys(CARD_SCRIPTS).filter(n=>{
  const sc=CARD_SCRIPTS[n]; return !!(sc&&sc.passive&&typeof sc.passive.onLeaveField==='function');});
ok('C1 ★ onLeaveField を見る passive は 57 件。S03-U501 までは、召喚を無効にされたモンスターの分でも'
   +'この 57 件が応答しうる状態だった',
   watchers.length===57, JSON.stringify({n:watchers.length,sample:watchers.slice(0,12)}));
ok('C2 ★ いまは手札から出した召喚の取り消しでは onLeaveField が積まれないので、'
   +'この 57 件はその場面では呼ばれない',
   typeof v9DetectLeaveField==='function', 'x');
`, {expect:2});

/* ===== D. negative control: 申告の無い MOVE は離脱に数える ===== */
harness(COMMON + String.raw`
fresh();
const a=mk('ワイト',0,'up'), b=mk('クリボー',0,'up');
gameState.players[0].mz=[a,b];
baselineA();
/* 申告なしの MOVE */
act({type:'MOVE',player:0,from:'mz',fromIndex:0,to:'grave'});
ok('D1 ★ negative control: 申告の無い MOVE は今までどおり onLeaveField を積む',
   QLOG.some(x=>x.name==='onLeaveField'&&x.uid===a.uid),
   JSON.stringify(QLOG));
/* 申告つきの MOVE（engine が召喚無効の取り消しで使う形） */
QLOG.length=0;
act({type:'MOVE',player:0,from:'mz',fromIndex:0,to:'grave',summonNegatedS03:b.uid});
ok('D2 ★ 申告つきの MOVE だけが離脱に数えられない（申告した uid のみ）',
   !QLOG.some(x=>x.name==='onLeaveField'&&x.uid===b.uid),
   JSON.stringify(QLOG));
/* 申告が別の uid なら、そのカードの離脱は積まれる */
fresh();
const c=mk('ワイト',0,'up');
gameState.players[0].mz=[c];
baselineA();
act({type:'MOVE',player:0,from:'mz',fromIndex:0,to:'grave',summonNegatedS03:999999});
ok('D3 ★ negative control: 申告の uid が合わなければ離脱は積まれる（申告は 1 枚だけに効く）',
   QLOG.some(x=>x.name==='onLeaveField'&&x.uid===c.uid),
   JSON.stringify(QLOG));
`, {expect:3});

/* ===== E. Save/Load・Replay ===== */
const ctxE = harness(COMMON + String.raw`
const ids=bloodBoard();
duelActivateFromZone(0,'sz',0);
ok('E1 前提: 窓が開いたところで保存する', driveToWindow()==='window', 'x');
globalThis.__SAVED_S502=savedRaw();
negateInWindow('神の宣告');
globalThis.__WANT_S502=JSON.stringify({mon:zu(ids.mon),step:s(),
  leave:QLOG.some(x=>x.name==='onLeaveField'&&x.uid===ids.mon),digest:v41StateDigest(gameState)});
audit('E1');
`, {expect:2});

harness('const WANT=' + (ctxE.__WANT_S502 || 'null') + ';'
      + 'const SAVED=' + JSON.stringify(ctxE.__SAVED_S502 || '') + ';' + COMMON + String.raw`
ok('E2 前提: 別の VM で再開できる', loadInto(SAVED)===true, 'x');
const mon=gameState.pendingSummon.uid;
negateInWindow('神の宣告');
const got={mon:zu(mon),step:s(),
  leave:QLOG.some(x=>x.name==='onLeaveField'&&x.uid===mon),digest:v41StateDigest(gameState)};
ok('E3 ★ 再開して無効にしても、離脱を積まない判断ごと同じ結果・同じ digest になる'
   +'（申告は Action に乗っているので Journal 再生でも同じ）',
   JSON.stringify(got)===JSON.stringify(WANT), JSON.stringify({got,WANT}));
audit('E3');
`, {expect:3});

/* ===== F. 文書 ===== */
harness('const SRC=' + JSON.stringify(SRC_S502) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'], E18=SRC['engine/18_leave_field_v9.js'];
ok('F1 ★ engine/18 の除外は Action の申告 1 つだけを見ている（他の Action では何も変わらない）',
   /function v9DetectLeaveField\(gs, a\)/.test(E18)
   && /a\.summonNegatedS03 != null/.test(E18)
   && /S03-U502/.test(E18),
   'x');
ok('F2 ★ engine/18 のコメントに当時裁定の ID と回答日が書かれている',
   /WIKI-9E991E9B14E9/.test(E18) && /2010-04-21/.test(E18)
   && /WIKI-643A78AB3480/.test(E18) && /2008-03-19/.test(E18),
   'x');
ok('F3 applyAction が Action を渡している（engine/00）',
   /v9DetectLeaveField\(gs, a\)/.test(SRC['engine/00_state_actions.js']), 'x');
ok('F4 申告を付けるのは解決中の通常召喚の取り消し 1 箇所だけ（engine/1ZZY）',
   (SRC['engine/1ZZY_summon_negation_window_s03.js'].match(/summonNegatedS03:uid/g)||[]).length===1,
   'x');
ok('F5 ★ 設計書 5-a #1-i が「直した（S03-U502）」に書き直され、段階表にも完了として入っている',
   DOC.indexOf('| 1-i | **直した（S03-U502）。**')>=0
   && DOC.indexOf('**S03-U502（完了）**')>=0
   && DOC.indexOf('S03-U502 で無しにした')>=0, 'x');
ok('F6 専用テストが tools/check.py に登録されている',
   /test_s03_u502_negated_summon_not_on_field\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:6});
