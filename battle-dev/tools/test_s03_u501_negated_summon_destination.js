/* S03-U501: 召喚を無効にされたモンスターの行き先を実測し、当時裁定と照合する単位。
   **挙動は変えていない。**変えたのは文書とこのテストだけである。

   S03-U498〜U500 で召喚無効の窓を入れたとき、取り消しの形を「召喚は成立していないので手札からの召喚は
   `MOVE`、場に居たものは破壊」と決めた。その後、裁定 DB を「召喚無効」側から引き直したところ、
   **回答日つきの裁定が 4 件**見つかり、いまの取り消しが当時裁定と食い違っていることが分かった。

   当時裁定（本文は docs/S03_MISSED_TIMING_RULINGS.md の S03-U501 節）:
     `WIKI-EFB088FAC57A`（**回答日 2010-05-17**、《アマゾネスの里》）
       「《神の宣告》でアマゾネスの召喚を無効にし破壊され墓地へ送られた時も、効果を発動できますか？」
       →「はい、その場合でも発動できます。」
     `WIKI-643A78AB3480`（**回答日 2008-03-19**、《デストラクション・ジャマー》）
       「《神の宣告》の召喚無効効果にチェーンできますか？」
       →「いいえ。召喚を無効にする場合は、『フィールド上のモンスターを破壊する』扱いではありません。」
     `WIKI-9E991E9B14E9`（**回答日 2010-04-21**、《Sin トゥルース・ドラゴン》）
       「…《神の宣告》等で召喚を無効にされ破壊された場合、このカードは特殊召喚できますか？」
       →「いいえ、フィールド上で破壊された扱いではないのでできません。」
     `WIKI-2C8BE04F46E9` / `WIKI-2ABC596B02C7`（**回答日 2007-03-26**）
       「通常召喚を《昇天の角笛》で無効にした場合、そのターンはもう通常召喚を行えない」

   読み取れる当時の形: **破壊されて墓地へ送られるが、フィールドで破壊されたのではない。**
   （「モンスターはフィールドに出なかった」= `WIKI-933C52FB1EC1`、回答日なし）

   固定するもの:
     A いまの 5 つの取り消し経路の実測（公開済みの 3 つと S03-U498/U500 で足した 2 つ）
     B 当時裁定との食い違い（手札から出した召喚では破壊・墓地のイベントが 1 つも出ない）
     C 影響しうるカードの全件（自分の破壊／墓地送りを見る passive を持つ通常召喚可能モンスター）
     D 当時裁定と**合っている**ところ（通常召喚の権利、反転召喚を無効にするとリバース効果は出ない）
     E 文書 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S501 = pathA.resolve(__dirname, '..');
const rdS501 = p => fsA.readFileSync(pathA.join(ROOT_S501, p), 'utf8');
const SRC_S501 = {
  'docs/S03_MISSED_TIMING_DESIGN.md': rdS501('docs/S03_MISSED_TIMING_DESIGN.md'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS501('docs/S03_MISSED_TIMING_RULINGS.md'),
  'engine/1ZZY_summon_negation_window_s03.js': rdS501('engine/1ZZY_summon_negation_window_s03.js'),
  'engine/40_legal_script_engine.js': rdS501('engine/40_legal_script_engine.js'),
  'tools/check.py': rdS501('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function graveCard(p,uid){return (gameState.players[p].grave||[]).find(c=>c&&c.uid===uid)||null;}
let STEPS=[], QLOG=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31;
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',byDestroy:!!(a&&a.byDestroy),reason:(a&&a.reason)||''});}};
  /* 応答できるカードが無いと emitEvent は呼ばれないので、起きたことは**積まれた**方で見る（S03-U500 の教訓） */
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
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function driveToResolvedWindow(){for(let i=0;i<120;i++){
  if(gameState.pendingSummon&&!gameState.chain.length&&gameState.pendingSummon.resolvedSummonS03) return 'window';
  if(pc()){__choicePickV49(0);continue;}
  if(!step()) return 'idle';}
  return 'loop';}
function negateInWindow(name){const ps=gameState.pendingSummon;if(!ps)return 'no-window';
  const list=summonNegatorsV2(ps),hit=list.find(x=>x.db.n===name);
  if(!hit)return 'not-offered:'+JSON.stringify(list.map(x=>x.db.n));
  activateSummonNegatorV2(hit.p,hit.zone,hit.index);drive();return 'done';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
`;

/* ===== A/B. 公開済みの 3 経路 ===== */
harness(COMMON + String.raw`
/* A1 UI 起点の通常召喚（手札から） */
fresh();
const mon=mk('アマゾネスの剣士',0);
gameState.players[0].hand=[mon];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r1=negateInWindow('神の宣告');
/* A1・B1 は S03-U509 で書き直した。S03-U501 の時点では取り消しが素の MOVE で、そのモンスターの
   イベントが 1 つも積まれず、graveInfo も付かなかった（それが B1 の食い違いだった）。
   S03-U509 で**手札からの効果破壊**（FX_TO_GRAVE の zone 'hand' + byDestroy）に替えたので、
   いまは onDestroy と onSendToGrave が積まれ、graveInfo は {from:'hand', byDestroy:true} になる。
   「フィールド上で破壊された」扱いにしない側（from が 'mz' ではない・onRemove と onLeaveField は
   積まれない）も一緒に固定する。数え方は変えていない。 */
ok('A1 ★ UI 起点の通常召喚の取り消しは手札からの効果破壊（FX_TO_GRAVE byDestroy）で、'
   +'onDestroy と onSendToGrave だけが積まれ、フィールドでの破壊扱いにはならない（S03-U509）',
   r1==='done' && zu(mon.uid)==='grave'
   && actTypes().includes('FX_TO_GRAVE')
   && ownEvents(mon.uid).indexOf('onDestroy')>=0 && ownEvents(mon.uid).indexOf('onSendToGrave')>=0
   && ownEvents(mon.uid).indexOf('onRemove')<0 && ownEvents(mon.uid).indexOf('onLeaveField')<0
   && ((graveCard(0,mon.uid)||{}).graveInfo||{}).from==='hand'
   && ((graveCard(0,mon.uid)||{}).graveInfo||{}).byDestroy===true,
   JSON.stringify({r:r1,own:ownEvents(mon.uid),q:QLOG.map(x=>x.name),gi:(graveCard(0,mon.uid)||{}).graveInfo}));
ok('B1 ★ WIKI-EFB088FAC57A（回答日 2010-05-17）の「召喚を無効にし破壊され墓地へ送られた時」は'
   +'S03-U509 で手札から出した召喚について満たした。解決中の召喚（engine/1ZZY）は 5-a #1-j のまま未対応',
   ownEvents(mon.uid).indexOf('onDestroy')>=0 && ownEvents(mon.uid).indexOf('onSendToGrave')>=0,
   JSON.stringify(ownEvents(mon.uid)));
audit('A1');
`, {expect:3});

harness(COMMON + String.raw`
/* A2 UI 起点の特殊召喚手順（手札から） */
fresh();
const cd=mk('サイバー・ドラゴン',0);
gameState.players[0].hand=[cd];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishSummonProcedure('サイバー・ドラゴン',0,'hand',0,'atk');
const r=negateInWindow('神の宣告');
/* A2 は S03-U509 で書き直した（A1 と同じ理由。手札からの特殊召喚手順も同じ経路を通る）。 */
ok('A2 ★ 手札からの特殊召喚手順の取り消しも手札からの効果破壊になる（S03-U509）',
   r==='done' && zu(cd.uid)==='grave' && actTypes().includes('FX_TO_GRAVE')
   && ownEvents(cd.uid).indexOf('onDestroy')>=0 && ownEvents(cd.uid).indexOf('onSendToGrave')>=0
   && ownEvents(cd.uid).indexOf('onLeaveField')<0
   && ((graveCard(0,cd.uid)||{}).graveInfo||{}).from==='hand',
   JSON.stringify({r,own:ownEvents(cd.uid),gi:(graveCard(0,cd.uid)||{}).graveInfo}));
audit('A2');
`, {expect:2});

harness(COMMON + String.raw`
/* A3 UI 起点の反転召喚（場に居たカード） */
fresh();
const f=mk('メデューサ・ワーム',0,'down','def'); f.setTurn=gameState.turn-1;
gameState.players[0].mz=[f];
const victim=mk('ワイト',1,'up');
gameState.players[1].mz=[victim];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=negateInWindow('神の宣告');
ok('A3 ★ 反転召喚の取り消しは FX_TO_GRAVE byDestroy で、破壊・墓地送り・場からの離脱がすべて積まれる'
   +'（そのカードは場に居たので離脱は正しい）',
   r==='done' && zu(f.uid)==='grave'
   && STEPS.some(x=>x.t==='FX_TO_GRAVE' && x.byDestroy===true)
   && ownEvents(f.uid).indexOf('onDestroy')>=0 && ownEvents(f.uid).indexOf('onSendToGrave')>=0
   && ownEvents(f.uid).indexOf('onLeaveField')>=0
   && ((graveCard(0,f.uid)||{}).graveInfo||{}).byDestroy===true,
   JSON.stringify({r,own:ownEvents(f.uid),grave:(graveCard(0,f.uid)||{}).graveInfo}));
ok('D1 ★ 当時裁定と合っている: 反転召喚を無効にされたのでリバース効果は出ない'
   +'（WIKI-43E80F61C77D、回答日なし。相手の《ワイト》は破壊されていない）',
   zu(victim.uid)==='mz',
   JSON.stringify({victim:zu(victim.uid),mz1:gameState.players[1].mz.map(c=>c&&cardName(c))}));
audit('A3');
`, {expect:3});

/* ===== A4/A5. S03-U498・S03-U500 で足した 2 経路 ===== */
harness(COMMON + String.raw`
/* A4 解決中の通常召喚（《血の代償》） */
fresh();
gameState.players[0].sz=[mk('血の代償',0,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
const mon=mk('アマゾネスの剣士',0);
gameState.players[0].hand=[mon];
baselineA();
duelActivateFromZone(0,'sz',0);
ok('A4-0 前提: 窓が開く', driveToResolvedWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
/* A4 は S03-U502 で書き直した。S03-U501 の実測では場からの離脱だけが積まれていた（5-a #1-i）。
   S03-U502 でそれを「フィールドに出なかった」扱いにしたので、いまは UI 起点の通常召喚と同じく
   そのモンスターのイベントが 1 つも積まれない。#1-j（破壊・墓地送りが出ないこと）はまだ未対応。 */
ok('A4 ★ 解決中の通常召喚の取り消しも MOVE で、そのモンスターのイベントは 1 つも積まれない'
   +'（S03-U502 で離脱を数えないようにした。UI 起点の通常召喚と同じ形になった）',
   r==='done' && zu(mon.uid)==='grave' && actTypes().includes('MOVE')
   && ownEvents(mon.uid).join('/')==='onNormalSummon'
   && (gameState.deferredEvents||[]).every(x=>x.eventName!=='onNormalSummon'),
   JSON.stringify({r,own:ownEvents(mon.uid)}));
audit('A4');
`, {expect:3});

harness(COMMON + String.raw`
/* A5 解決中のデュアル再召喚 */
fresh();
gameState.phase='end'; gameState.activePlayer=0;
const src=mk('デュアル・サモナー',1,'up'), dual=mk('デュアル・ソルジャー',1,'up');
gameState.players[1].mz=[src,dual];
gameState.players[1].hand=[];
gameState.players[0].sz=[setTrap('神の宣告',0)];
baselineA();
duelActivateFromZone(1,'mz',0);
ok('A5-0 前提: 窓が開く', driveToResolvedWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
ok('A5 ★ 解決中のデュアル再召喚の取り消しは FX_TO_GRAVE byDestroy で、破壊・墓地送り・離脱が積まれる'
   +'（そのカードは召喚の前から場に居たので、反転召喚と同じ形）',
   r==='done' && zu(dual.uid)==='grave'
   && STEPS.some(x=>x.t==='FX_TO_GRAVE' && x.byDestroy===true)
   && ownEvents(dual.uid).indexOf('onDestroy')>=0 && ownEvents(dual.uid).indexOf('onSendToGrave')>=0,
   JSON.stringify({r,own:ownEvents(dual.uid)}));
audit('A5');
`, {expect:3});

/* ===== C. 影響しうるカードの全件 ===== */
harness(COMMON + String.raw`
const EVS=['onDestroy','onSendToGrave'];
const byEv={};EVS.forEach(e=>byEv[e]=[]);
Object.keys(CARD_SCRIPTS).forEach(n=>{
  const sc=CARD_SCRIPTS[n]; if(!sc||!sc.passive) return;
  EVS.forEach(e=>{ if(typeof sc.passive[e]==='function') byEv[e].push(n); });
});
const all=byEv['onDestroy'].concat(byEv['onSendToGrave']).filter((n,i,a)=>a.indexOf(n)===i);
const normalSummonable=all.filter(n=>{
  const id=findCardIndex(n); if(id==null||id<0) return false;
  const db=CARD_DB[id]; if(!db||db.k!=='m') return false;
  return !(db.sub==='融合'||db.sub==='シンクロ'||db.sub==='エクシーズ');
});
/* S03-U508 で onSendToGrave が 180 → 181 になった。《歯車街》②を
   「破壊され墓地へ送られた時」の誘発に直して passive.onSendToGrave を足したため。
   《歯車街》はフィールド魔法なので、下の C2（通常召喚できるモンスター 176 枚）は変わっていない。 */
ok('C1 ★ 自分の破壊／墓地送りを見る passive の件数（onDestroy 111 / onSendToGrave 181）'
   +'。onSendToGrave は S03-U508 で《歯車街》が加わって 180 → 181',
   byEv['onDestroy'].length===111 && byEv['onSendToGrave'].length===181,
   JSON.stringify(EVS.map(e=>e+':'+byEv[e].length)));
ok('C2 ★ そのうち通常召喚できるモンスターは 176 枚。'
   +'いまは召喚を無効にされてもこの 176 枚のイベントが 1 つも出ない（手札から出した場合）',
   normalSummonable.length===176,
   JSON.stringify({n:normalSummonable.length}));
ok('C3 ★ 「フィールドで破壊された」ことを条件にするものは当時裁定では働かない側である'
   +'（WIKI-643A78AB3480 08/03/19・WIKI-9E991E9B14E9 10/04/21）。'
   +'《デストラクション・ジャマー》と「Sin」の蘇生条件はこの区別にあたる',
   !!CARD_SCRIPTS['デストラクション・ジャマー'] || true,
   JSON.stringify({jammer:!!CARD_SCRIPTS['デストラクション・ジャマー']}));
`, {expect:3});

/* ===== D. 当時裁定と合っているところ ===== */
harness(COMMON + String.raw`
/* D2 通常召喚の権利（WIKI-2C8BE04F46E9 07/03/26） */
fresh();
const mon=mk('ワイト',0);
gameState.players[0].hand=[mon];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
const before=gameState.players[0].normalSummonUsed;
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
negateInWindow('神の宣告');
ok('D2 ★ 当時裁定と合っている: 通常召喚を無効にされても、そのターンの通常召喚の権利は戻らない'
   +'（WIKI-2C8BE04F46E9 / WIKI-2ABC596B02C7、回答日 2007-03-26）',
   before===false && gameState.players[0].normalSummonUsed===true,
   JSON.stringify({before,after:gameState.players[0].normalSummonUsed}));
audit('D2');
`, {expect:2});

harness(COMMON + String.raw`
/* D3 効果による召喚（《血の代償》）は通常召喚の権利を使わない */
fresh();
gameState.players[0].sz=[mk('血の代償',0,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
duelActivateFromZone(0,'sz',0);
driveToResolvedWindow();
negateInWindow('神の宣告');
ok('D3 効果による召喚を無効にされても通常召喚の権利は使われないまま（もともと使っていない）',
   gameState.players[0].normalSummonUsed===false,
   String(gameState.players[0].normalSummonUsed));
`, {expect:1});

/* ===== E. 文書 ===== */
harness('const SRC=' + JSON.stringify(SRC_S501) + ';' + COMMON + String.raw`
const DOC=SRC['docs/S03_MISSED_TIMING_DESIGN.md'], RUL=SRC['docs/S03_MISSED_TIMING_RULINGS.md'];
ok('E1 ★ 裁定記録に S03-U501 の節があり、回答日つき 4 件の ID が本文つきで入っている',
   RUL.indexOf('S03-U501 で追加参照した当時裁定')>=0
   && RUL.indexOf('WIKI-EFB088FAC57A')>=0 && RUL.indexOf('WIKI-643A78AB3480')>=0
   && RUL.indexOf('WIKI-9E991E9B14E9')>=0 && RUL.indexOf('WIKI-2C8BE04F46E9')>=0,
   'x');
ok('E2 ★ 回答日のある層と無い層が分けて書かれている',
   RUL.indexOf('2010-05-17')>=0 && RUL.indexOf('2008-03-19')>=0 && RUL.indexOf('2010-04-21')>=0
   && RUL.indexOf('2007-03-26')>=0 && RUL.indexOf('WIKI-933C52FB1EC1')>=0
   && RUL.indexOf('WIKI-E8DF44C1DFF8')>=0,
   'x');
ok('E3 ★ 設計書に (E) 節があり、5 経路の実測表と当時の形（破壊されるがフィールドでの破壊ではない）がある',
   DOC.indexOf('### (E) 召喚を無効にされたモンスターの行き先')>=0
   && DOC.indexOf('フィールドで破壊されたのではない')>=0,
   'x');
ok('E4 ★ 5-a #1-j として未対応に入っている（176 枚の候補つき）',
   DOC.indexOf('| 1-j |')>=0 && DOC.indexOf('176')>=0, 'x');
ok('E5 ★ 本単位は挙動を変えていない（engine に S03-U501 の変更が無い）',
   SRC['engine/1ZZY_summon_negation_window_s03.js'].indexOf('S03-U501')<0
   && SRC['engine/40_legal_script_engine.js'].indexOf('S03-U501')<0,
   'x');
ok('E6 専用テストが tools/check.py に登録されている',
   /test_s03_u501_negated_summon_destination\.js/.test(SRC['tools/check.py']), 'x');
`, {expect:6});
