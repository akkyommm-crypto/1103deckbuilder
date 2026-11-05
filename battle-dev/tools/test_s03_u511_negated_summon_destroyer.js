/* S03-U511: 召喚を無効にして破壊した「破壊したプレイヤー」を記録する単位（挙動の変更あり）。

   S03-U509 / U510 で、召喚を無効にされたモンスターは「破壊され墓地へ送られた」扱いになったが、
   破壊したプレイヤー（byPlayer）は null のままだった（実測）。そのため
   「**相手によって**破壊され墓地へ送られた場合」を条件とする効果が発動できなかった。

   当時裁定（**回答日つき**）
     `WIKI-D70393946D93`（**2010-09-16**、掲載ページ《聖騎士ジャンヌ》）
       Q「《神の警告》で召喚を無効にされるなど、**フィールド上以外で破壊され墓地へ送られた**場合、
          効果は発動できますか？」 A「はい、発動できます。(10/09/16)」
     《聖騎士ジャンヌ》②のテキストは「このカードが**相手によって**破壊され墓地へ送られた場合」なので、
     この裁定は「召喚無効の破壊は相手による破壊である」ことまで含んでいる。
   同じ向きの二次資料（**回答日なし**）
     `R1103-SCRAPDRAGON-004`「召喚を無効にされて破壊され墓地へ送られた場合でも、
       相手によって破壊された場合の誘発効果を発動できる」

   入れた形
     1. `summonNegatePendingV2`（engine/30）が、無効にした側を Action に載せる（`byPlayerS511`）。
        実測（S03-U511）: その時点で chain はすでに空で `destroyerPlayerV30` は null を返すが、
        `RESOLVING_LINK_S03` と `P3_EFFECT_CONTEXT` はどちらも無効にした側を指している。
     2. `SUMMON_WINDOW_NEGATE_V42`（engine/00）が `pendingSummon.negatedByS511` に控える。
        Action に載っているので Journal 再生でも同じ値になる。
     3. 取り消しの破壊 4 経路（engine/40 の反転召喚・手札、engine/1ZZY のデュアル再召喚・解決中）が
        `byPlayer` として渡す。申告が無ければ今までどおり付かない。
     4. 《聖騎士ジャンヌ》の判定を、フィールド上以外の破壊にも当たるようにした
        （場での破壊の判定は 1 文字も変えていない）。

   固定するもの:
     A エンジンの形（誰が記録されるか）
     B 当時裁定の場面（手札・反転召喚・解決中の 3 経路）
     C negative control（従来経路・他のカード・S03-U509/U510 の形）
     D Replay 監査
     E 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S511 = pathA.resolve(__dirname, '..');
const rdS511 = p => fsA.readFileSync(pathA.join(ROOT_S511, p), 'utf8');
const SRC_S511 = {
  'cards/C8_auto_cycle26.js': rdS511('cards/C8_auto_cycle26.js'),
  'docs/S03_MISSED_TIMING_RULINGS.md': rdS511('docs/S03_MISSED_TIMING_RULINGS.md'),
  'docs/S03_U511_REPORT.md': rdS511('docs/S03_U511_REPORT.md'),
  'engine/30_processor_chain_battle.js': rdS511('engine/30_processor_chain_battle.js'),
  'engine/40_legal_script_engine.js': rdS511('engine/40_legal_script_engine.js'),
  'engine/1ZZY_summon_negation_window_s03.js': rdS511('engine/1ZZY_summon_negation_window_s03.js'),
  'tools/check.py': rdS511('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function graveCard(p,uid){return (gameState.players[p].grave||[]).find(c=>c&&c.uid===uid)||null;}
let STEPS=[], QLOG=[], NEG=[];
(function(){
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31;
    if(a&&a.type==='SUMMON_WINDOW_NEGATE_V42')NEG.push({reason:a.reason,byPlayerS511:a.byPlayerS511});
    try{return h.apply(this,arguments);}finally{
      if(d===0)STEPS.push({t:(a&&a.type)||'?',zone:(a&&a.zone)||'',byPlayer:(a&&a.byPlayer)});}};
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
function fresh(){resetA();resetVolatile();STEPS=[];QLOG=[];NEG=[];TOASTS.length=0;
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setTrap(nm,p){const c=mk(nm,p,'down');c.setTurn=gameState.turn-1;return c;}
function ownEvents(uid){return QLOG.filter(x=>x.uid===uid).map(x=>x.name);}
function dlog(uid){return (gameState.destroyedThisTurnV30||[]).filter(x=>x.uid===uid)
  .map(x=>({from:x.from,byPlayer:x.byPlayer,battle:x.battle}));}
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
/* 《聖騎士ジャンヌ》の場面。墓地に戦士族を置かないので、②の対象はジャンヌ自身だけになる。
   「コストの手札が墓地にあり、ジャンヌが手札に戻っている」なら②が通ったということ。 */
function jeanneFired(j,cost){ return zu(j.uid)==='hand' && zu(cost.uid)==='grave'; }
`;

/* ===== A. エンジンの形 ===== */
harness(COMMON + String.raw`
fresh();
const j=mk('聖騎士ジャンヌ',0), cost=mk('ワイト',0);
gameState.players[0].hand=[j,cost];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
ok('A1 ★ 無効の Action に「無効にした側」が載る（召喚した側 0 ではなく 1）',
   r==='done' && NEG.length===1 && NEG[0].byPlayerS511===1,
   JSON.stringify(NEG));
ok('A2 ★ 取り消しの破壊に byPlayer が付く（破壊の記録も手札からの破壊として 1 を持つ）',
   dlog(j.uid).length===1 && dlog(j.uid)[0].byPlayer===1
   && dlog(j.uid)[0].from==='hand' && dlog(j.uid)[0].battle===false,
   JSON.stringify(dlog(j.uid)));
ok('B1 ★ 当時裁定 WIKI-D70393946D93（10/09/16）: 手札から出した通常召喚を無効にされても'
   +'「相手によって破壊され墓地へ送られた場合」の②を発動できる（この単位の前は発動できなかった）',
   jeanneFired(j,cost),
   JSON.stringify({j:zu(j.uid),cost:zu(cost.uid),hand:gameState.players[0].hand.map(c=>cardName(c))}));
audit('A');
`, {expect:4});

/* ===== B. ほかの 2 経路 ===== */
harness(COMMON + String.raw`
fresh();
const j=mk('聖騎士ジャンヌ',0,'down','def'); j.setTurn=gameState.turn-1;
gameState.players[0].mz=[j];
const cost=mk('ワイト',0); gameState.players[0].hand=[cost];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=negateInWindow('神の宣告');
drive();
ok('B2 ★ 反転召喚を無効にされた場合も同じ（こちらは場での破壊なので from は mz のまま）',
   r==='done' && jeanneFired(j,cost)
   && dlog(j.uid).length===1 && dlog(j.uid)[0].from==='mz' && dlog(j.uid)[0].byPlayer===1,
   JSON.stringify({j:zu(j.uid),d:dlog(j.uid)}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
gameState.players[0].sz=[mk('血の代償',0,'up')];
gameState.players[1].sz=[setTrap('神の宣告',1)];
const j=mk('聖騎士ジャンヌ',0), cost=mk('ワイト',0);
gameState.players[0].hand=[j,cost];
baselineA();
duelActivateFromZone(0,'sz',0);
ok('B3-0 前提: 解決中の召喚の窓が開く', driveToResolvedWindow()==='window', 'x');
const r=negateInWindow('神の宣告');
drive();
ok('B3 ★ 解決中の通常召喚（S03-U510 の経路）でも発動できる',
   r==='done' && jeanneFired(j,cost)
   && dlog(j.uid).length===1 && dlog(j.uid)[0].byPlayer===1,
   JSON.stringify({j:zu(j.uid),d:dlog(j.uid)}));
audit('B3');
`, {expect:3});

/* ===== C. negative control ===== */
harness(COMMON + String.raw`
/* 場で相手の《地砕き》に破壊される従来の経路。この単位では 1 文字も変えていない。 */
fresh();
const j=mk('聖騎士ジャンヌ',0,'up');
gameState.players[0].mz=[j];
const cost=mk('ワイト',0); gameState.players[0].hand=[cost];
gameState.players[1].hand=[mk('地砕き',1)];
gameState.activePlayer=1;
baselineA();
duelActivateFromHand(0);
drive();
ok('C1 ★ negative control: 場で相手に破壊された従来の経路は今までどおり発動する',
   jeanneFired(j,cost) && NEG.length===0
   && dlog(j.uid).length===1 && dlog(j.uid)[0].from==='mz' && dlog(j.uid)[0].byPlayer===1,
   JSON.stringify({j:zu(j.uid),d:dlog(j.uid)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
/* 《クリッター》は「このカードが**フィールドから**墓地へ送られた場合」。破壊者が分かっても当たらない。 */
fresh();
const mon=mk('クリッター',0);
gameState.players[0].hand=[mon];
gameState.players[0].deck.splice(1,0,mk('ワイト',0));
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
const gi=(graveCard(0,mon.uid)||{}).graveInfo||null;
ok('C2 ★ negative control: 《クリッター》は相変わらず発動しない（R1103-WARNING-002、回答日なし）',
   r==='done' && gameState.players[0].hand.length===0
   && !!gi && gi.from==='hand' && gi.byPlayer===1,
   JSON.stringify({hand:gameState.players[0].hand.map(c=>cardName(c)),gi}));
ok('C3 ★ negative control: S03-U509 の形は変わっていない'
   +'（from は hand のまま、onDestroy と onSendToGrave だけで onRemove も onLeaveField も積まれない）',
   ownEvents(mon.uid).indexOf('onDestroy')>=0 && ownEvents(mon.uid).indexOf('onSendToGrave')>=0
   && ownEvents(mon.uid).indexOf('onRemove')<0 && ownEvents(mon.uid).indexOf('onLeaveField')<0,
   JSON.stringify(ownEvents(mon.uid)));
audit('C2');
`, {expect:3});

harness(COMMON + String.raw`
/* 破壊した側を問わない誘発（S03-U509 で直した《人造人間－サイコ・リターナー》）は今までどおり。 */
fresh();
const mon=mk('人造人間－サイコ・リターナー',0);
gameState.players[0].hand=[mon];
const sh=mk('人造人間－サイコ・ショッカー',0);
gameState.players[0].grave=[sh];
gameState.players[1].sz=[setTrap('神の宣告',1)];
baselineA();
finishNormalSummon(0,'atk',{bodies:0,value:0},null,null);
const r=negateInWindow('神の宣告');
drive();
ok('C4 ★ negative control: S03-U509 で直した《人造人間－サイコ・リターナー》は今までどおり発動する',
   r==='done' && zu(sh.uid)==='mz',
   JSON.stringify({shocker:zu(sh.uid),own:ownEvents(mon.uid)}));
audit('C4');
`, {expect:2});

/* ===== D. ソースの形 ===== */
harness('const S=' + JSON.stringify(SRC_S511) + ';' + String.raw`
const E30=S['engine/30_processor_chain_battle.js'], E40=S['engine/40_legal_script_engine.js'];
const EZY=S['engine/1ZZY_summon_negation_window_s03.js'], CARD=S['cards/C8_auto_cycle26.js'];
ok('D1 ★ 無効にした側は 1 か所（summonNegatorPlayerS511）で決め、Action に載せている',
   E30.indexOf('function summonNegatorPlayerS511(){')>=0
   && E30.indexOf('byPlayerS511:byS511')>=0,'');
ok('D2 ★ 取り消しの破壊 4 経路すべてが byPlayer を渡す（反転召喚・手札・デュアル再召喚・解決中）',
   (E40.match(/byS511==null\?\{\}:\{byPlayer:byS511\}/g)||[]).length===2
   && (EZY.match(/byS511==null\?\{\}:\{byPlayer:byS511\}/g)||[]).length===2,
   JSON.stringify({e40:(E40.match(/byS511==null\?\{\}:\{byPlayer:byS511\}/g)||[]).length,
                   ezy:(EZY.match(/byS511==null\?\{\}:\{byPlayer:byS511\}/g)||[]).length}));
ok('D3 ★ 《聖騎士ジャンヌ》の場での破壊の判定は変えていない（c1DestroyRecord を使う枝がそのまま残っている）',
   CARD.indexOf('const rec = c1DestroyRecord(ctx.card);')>=0
   && CARD.indexOf('return rec.battle || rec.byPlayer === foe;')>=0
   && CARD.indexOf('WIKI-D70393946D93')>=0,'');
`, {expect:3});

/* ===== E. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S511) + ';' + String.raw`
const RUL=S['docs/S03_MISSED_TIMING_RULINGS.md'], REP=S['docs/S03_U511_REPORT.md'], CHK=S['tools/check.py'];
ok('E1 ★ 裁定記録に S03-U511 節と裁定 ID がある',
   RUL.indexOf('S03-U511')>=0 && RUL.indexOf('WIKI-D70393946D93')>=0
   && RUL.indexOf('R1103-SCRAPDRAGON-004')>=0,'');
ok('E2 ★ 報告書に、対応した範囲と未対応の範囲が分けて書かれている',
   REP.indexOf('対応した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('WIKI-D70393946D93')>=0,'');
ok('E3 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u511_negated_summon_destroyer.js')>=0,'');
`, {expect:3});
