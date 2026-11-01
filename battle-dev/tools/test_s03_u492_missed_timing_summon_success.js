/* S03-U492: 「タイミングを逃す」の第 1 種別 ─ **召喚成功を条件とする発動**。
   設計は docs/S03_MISSED_TIMING_DESIGN.md（1-a / 3(A) / 3(B) / 3(C)）、裁定の抽出は docs/S03_MISSED_TIMING_RULINGS.md。

   根拠の裁定（S03-U487 / U491 が 2 件を混ぜて引用していたので S03-U492 で訂正した。どちらも取得 2011-08-26、
   `cards` 欄の「血の代償」は裁定が載っているページ名で、発動するカードではない）:
     WIKI-2B88D7C8D921  **回答日なし**  「この効果による通常召喚に対し《落とし穴》を発動できますか？」
       →「チェーン１で行われているならば、発動可能です。 チェーン２以上で行われ、召喚の後に別の処理がある場合は
          タイミングを逃す事になり発動できません。」                                  ← **本単位の対象**（召喚成功後の応答）
     WIKI-2CF23AA42E79  **回答日 2011-08-25**  「…《神の宣告》や《キックバック》・《昇天の角笛》などの
       召喚を無効にするカードを発動できますか？」→ 同じ答え。                        ← 召喚**無効**。本単位では触らない

   逃すのは応答する側のカード（《落とし穴》《奈落の落とし穴》や、召喚されたモンスター自身の召喚誘発）であって、
   《血の代償》ではない。《血の代償》は宣言表にも種別にも入れない。

   本単位で直した 2 点:
     (1) 処理番号の数え方を**拒否リスト → 許可リスト**に反転した。S03-U491 の拒否リストは列挙の漏れが
         「誤って逃す」側に落ちており、実測で《血の代償》チェーン１（＝発動できる）でも
         SPECIAL_WIN_DEFER_S03 が割り込んで番号が 3 → 4 とずれていた（H5 がその再現）。
         あわせて「適用が例外で終わった」「何も起きなかった」場合も進めないようにした。
     (2) 種別 summonSuccess を有効化した。判定は collectHandlers の 1 箇所だけで、
         通常の優先権・応答機会（召喚成功後の POINT 窓）と召喚無効の窓には触らない。

   対照（当時裁定どおりに分かれること）: C チェーン1 / D チェーン2で後続処理あり / E 後続リンクが処理なし /
   F 同時処理・強制誘発・普通の通常召喚 / G 保存→新しい VM→再開→Replay / H negative control。 */
const harness = require('./astra_harness');

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function s(){return gameState.procStepS03|0;}
function defs(){return (gameState.deferredEvents||[]).map(x=>[x.eventName,x.evt&&x.evt.stepS03]);}
let COLLECT=[], PTS=[];
const COLLECT_ORIG_S492=collectHandlers;
const POINT_ORIG_S492=pointResponsesV27;
const CHAINRESP_ORIG_S492=getChainResponsesV2;
const NEGATORS_ORIG_S492=summonNegatorsV2;
const BEGINWIN_ORIG_S492=beginSummonWindowV2;
(function(){
  const f=collectHandlers;collectHandlers=function(n,e){const r=f.apply(this,arguments);
    COLLECT.push({ev:n,stamp:(e&&e.stepS03!=null)?e.stepS03:null,now:s(),names:r.map(x=>x.name)});return r;};
  const g=pointResponsesV27;pointResponsesV27=function(p,pl){const r=g.apply(this,arguments);
    PTS.push({kind:pl&&pl.kind,p:p,names:r.map(x=>x.db&&x.db.n)});return r;};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();COLLECT=[];PTS=[];resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4920011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<800;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();COLLECT=[];PTS=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}

/* --- 盤面 ---
   p0 の《血の代償》で手札のモンスターを通常召喚し、p1 が前のターンに伏せた《奈落の落とし穴》
   （攻1500以上の召喚成功時に発動できる罠）が応答できるか。
   《奈落の落とし穴》は WIKI-2B88D7C8D921 の《落とし穴》と同じ「召喚成功時に発動できる」罠。
   召喚するのは《E・HERO エアーマン》（攻1800）。自身も「召喚に成功した時」の任意誘発を持つので、
   相手の応答と自分の召喚誘発の両方を 1 つの盤面で見られる。 */
function bloodBoard(opts){
  fresh();
  const o=opts||{};
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  if(o.chain1Card){const e=mk(o.chain1Card,0,'down');e.setTurn=gameState.turn-1;gameState.players[0].sz.push(e);}
  const air=mk(o.summon||'E・HERO エアーマン',0);
  gameState.players[0].hand=o.goblin?[mk('成金ゴブリン',0),air]:[air];
  /* デッキの一番上ではなく 2 枚目に置く。《成金ゴブリン》のドローで引かれてしまうと
     「召喚誘発でデッキから手札に加えたか」を見られなくなる（サーチはデッキ全体から選ぶ）。 */
  const ocean=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,ocean);
  let abyss=null;
  if(o.abyss!==false){abyss=mk('奈落の落とし穴',1,'down');abyss.setTurn=gameState.turn-1;gameState.players[1].sz.push(abyss);}
  if(o.wanghu) gameState.players[1].mz=[mk('王虎ワンフー',1,'up')];
  baselineA();
  return {air:air.uid, ocean:ocean.uid, abyss:abyss?abyss.uid:null};
}
/* チェーン1: 《血の代償》だけを発動する（召喚が最後に行われた処理になる）。
   発動の宣言時に「手札のどのモンスターを召喚するか」を聞かれるので、そこまで答える。 */
function activateChain1(){
  duelActivateFromZone(0,'sz',0);
  let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<5)__choicePickV49(0);
  return (gameState.chain||[]).length;
}
/* チェーン2: 先に別のカードをチェーン1で発動し、《血の代償》をチェーン2として積む */
function activateChain2(zone,index){
  duelActivateFromZone(0,zone,index);
  const r=getChainResponsesV2(0).find(x=>x.db.n==='血の代償');
  if(r) duelActivateResponseV2(0,r.zone,r.index);
  let g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<5)__choicePickV49(0);
  return (gameState.chain||[]).length;
}
function summonCollect(){return COLLECT.filter(c=>c.ev==='onNormalSummon'&&c.stamp!=null);}
function pointNames(kind){return PTS.filter(x=>x.kind===kind).map(x=>x.names);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
`;

/* ===== A. 処理番号の数え方（許可リスト・空振り・例外） =====
   engine のソースから「断りをログに書いて何もせず終わる許可リストの Action」を機械的に監査し、
   engine/1ZZX の一覧と一致することを固定する（他の Action に断りのログが足されればここが落ちる）。 */
const fsA = require('fs'), pathA = require('path');
const ROOT_S492 = pathA.resolve(__dirname, '..');
const rdS492 = p => fsA.readFileSync(pathA.join(ROOT_S492, p), 'utf8');
const ALLOW_S492 = (rdS492('engine/1ZZX_missed_timing_s03.js')
  .match(/const MISSED_TIMING_PROCESSING_S03 = new Map\(\[[\s\S]*?\n\]\);/) || [''])[0]
  .match(/\['([A-Z][A-Z0-9_]*)',/g) || [];
const ALLOW_SET_S492 = new Set(ALLOW_S492.map(x => x.slice(2, -2)));
/* S03-U493: 断りのログの一覧（拒否リスト）はもう持たない。ログを印にしなくなったので、
   「断りをログに書いて何もせず終わる Action は数えない」は盤面の署名だけで成立する。
   その監査は tools/test_s03_u493_missed_timing_state_and_audit.js の A が許可リスト全件で行う。 */

harness(COMMON + String.raw`
fresh();
const m=mk('ワイト',0);gameState.players[0].hand=[m];baselineA();
const a0=s();
act({type:'NORMAL_SUMMON',player:0,handIndex:0,pos:'atk'});
ok('A ★ 許可リストにある処理の Action は番号を 1 進める',s()===a0+1,JSON.stringify({before:a0,after:s()}));
const a1=s();
act({type:'EVENT_QUEUE_V31',item:{eventName:'onDummyS492',evt:{}}});
act({type:'SET_PRIORITY',player:0});
act({type:'SPECIAL_WIN_DEFER_S03',player:0});
ok('A ★ 許可リストに無い Action（帳簿・進行・勝敗確認）は番号を進めない',s()===a1,JSON.stringify({before:a1,after:s()}));
ok('A ★ S03-U491 が取りこぼしていた SPECIAL_WIN_DEFER_S03 は許可リストに無い（これが誤判定の原因だった）',
   missedTimingIsProcessingS03({type:'SPECIAL_WIN_DEFER_S03'})===false,'');
/* 空振り: 対象が存在しない処理の Action（盤面の署名も変わらず、イベントも積まれない） */
fresh();baselineA();
const a2=s(), bumped=[];
['FX_TO_GRAVE','FX_BANISH','FX_BOUNCE','FX_SELF_TO_GRAVE','SET_ST','SET_MONSTER','MOVE','TOGGLE_POS','FLIP']
  .forEach(t=>{const b=s();act({type:t,player:0,zone:'mz',index:3,handIndex:3});if(s()!==b)bumped.push(t);});
ok('A ★ 空振りに終わった処理の Action は番号を進めない（9 種で実測）',
   s()===a2&&!bumped.length,JSON.stringify({before:a2,after:s(),bumped}));
/* 断りをログに書いて何もせず終わる Action も、空振りなら進めない */
fresh();
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[0].normalSummonUsed=true;
baselineA();
const a3=s(), logs=[];
{const lf=logIt;logIt=function(gs,x){logs.push(String(x));return lf.apply(this,arguments);};
 act({type:'SET_MONSTER',player:0,handIndex:0});
 logIt=lf;}
ok('A ★ 断りをログに書いて何もせず終わる Action は、ログが増えても番号を進めない',
   s()===a3 && logs.some(x=>/通常召喚/.test(x)) && gameState.players[0].hand.length===1,
   JSON.stringify({before:a3,after:s(),logs,hand:gameState.players[0].hand.length}));
/* 例外で終わった適用 */
const a4=s();
const fx=missedTimingBeginS03(gameState,{type:'DRAW'});
logIt(gameState,'S03-U492: 例外で終わる適用の中で書かれたログ');
missedTimingEndS03(gameState,fx,false);
ok('A ★ 適用が例外で終わった場合は、ログが書かれていても番号を進めない',s()===a4,JSON.stringify({before:a4,after:s()}));
/* 刻みは「その処理が数えられた後の番号」になる */
const a5=s();
const fy=missedTimingBeginS03(gameState,{type:'DRAW'});
const stamp=missedTimingStampS03(gameState);
gameState.deferredEvents=[];
queueDeferredEventV2('onProbeS492',{player:0});
missedTimingEndS03(gameState,fy,true);
ok('A ★ 処理の最中に積まれた遅延イベントの刻みは、その処理が数えられた後の番号と一致する',
   stamp===a5+1 && gameState.deferredEvents[0].evt.stepS03===a5+1 && s()===a5+1,
   JSON.stringify({stamp,queued:gameState.deferredEvents[0].evt.stepS03,step:s(),before:a5}));
ok('A: 許可リストは FX_SET_STATE のうち「発動の表返し」だけを除き、他は数える（S03-U493 で訂正）',
   missedTimingIsProcessingS03({type:'FX_SET_STATE',face:'up',reason:'発動'})===false
   && missedTimingIsProcessingS03({type:'FX_SET_STATE',face:'down'})===true
   && missedTimingIsProcessingS03({type:'FX_SET_STATE',flipSummon:true})===true
   && missedTimingIsProcessingS03({type:'FX_SET_STATE',pos:'def'})===true
   && missedTimingIsProcessingS03({type:'FX_SET_STATE',lvDelta:1})===true,'');
ok('A: applyAction は最上位の適用でだけ数え、適用できたかどうかを渡している（engine/00 の配線）',
   /typeof missedTimingBeginS03==='function'/.test(String(applyAction))
   && /missedTimingEndS03\(gs,mtS492,mtAppliedS492\)/.test(String(applyAction)),'');
`, {expect:9});

/* ===== B. 判定の対象（種別）と、触らない場所 ===== */
harness(COMMON + String.raw`
fresh();
const air=mk('E・HERO エアーマン',0);gameState.players[0].mz=[air];baselineA();
const cand=en=>({name:'E・HERO エアーマン',p:0,zone:'mz',index:0,card:air,eventName:en,event:{}});
const snow=en=>({name:'スノーマンイーター',p:0,zone:'mz',index:0,card:air,eventName:en,event:{}});
const scar=en=>({name:'スカラベの大群',p:0,zone:'mz',index:0,card:air,eventName:en,event:{}});
const worm=en=>({name:'ニードルワーム',p:0,zone:'mz',index:0,card:air,eventName:en,event:{}});
gameState.procStepS03=10;
ok('B ★ 召喚成功のイベントで拾った候補は種別 summonSuccess に入る',
   missedTimingClassS03(cand('onNormalSummon'),{})==='summonSuccess'
   && missedTimingClassS03(cand('onSpecialSummon'),{})==='summonSuccess','');
ok('B ★ onFlip で種別に入るのは「反転召喚に成功した時」だけ — 「リバースした時」は S03-U494 で外した（R8）',
   missedTimingClassS03(scar('onFlip'),{flipSummon:true})==='summonSuccess'
   && missedTimingClassS03(scar('onFlip'),{})===null
   && MISSED_TIMING_CLASSES_S03.flipSummonReverse===false
   && missedTimingClassS03(snow('onFlip'),{flipSummon:true})===null
   && missedTimingClassS03(worm('onFlip'),{flipSummon:true})===null
   && missedTimingClassS03(worm('onFlip'),{})===null,'');
ok('B ★ 召喚成功以外のイベント（墓地送り・破壊・ドロー）は本単位の種別に入らない',
   ['onSendToGrave','onDestroy','onDraw','onLeaveField','onActivateSuccess']
   .every(en=>missedTimingClassS03(cand(en),{})===null),'');
ok('B ★ 番号が同じなら落とさない（R4「最後に行われた処理」）',
   missedTimingDropS03(cand('onNormalSummon'),{stepS03:10})===false
   && missedTimingDropS03(cand('onNormalSummon'),{stepS03:4})===true,'');
ok('B ★ 刻みの無いイベント（emitEvent の直接呼び出し・古い保存）は判定しない',
   missedTimingDropS03(cand('onNormalSummon'),{})===false
   && missedTimingDropS03(cand('onNormalSummon'),{stepS03:null})===false,'');
MISSED_TIMING_DECL_S03['E・HERO エアーマン']={mode:'never',ruling:'S03-U492 test'};
ok('B ★ never と宣言した例外カードは種別より強い（R5）',
   missedTimingDropS03(cand('onNormalSummon'),{stepS03:4})===false,'');
delete MISSED_TIMING_DECL_S03['E・HERO エアーマン'];
const fkeep=triggerCandidateForcedS03;
triggerCandidateForcedS03=function(){return true;};
ok('B ★ 強制誘発は種別に当てはまっても落とさない（R1。判定は既存の triggerCandidateForcedS03）',
   missedTimingDropS03(cand('onNormalSummon'),{stepS03:4})===false
   && /triggerCandidateForcedS03/.test(String(missedTimingDropS03)),'');
triggerCandidateForcedS03=fkeep;
ok('B ★ 判定は collectHandlers の 1 箇所だけ — 優先権・応答機会と召喚無効の窓には入っていない',
   /filterMissedTimingS03\(out, *evt\|\|\{\}\)/.test(String(COLLECT_ORIG_S492))
   && !/issedTiming/.test(String(POINT_ORIG_S492))
   && !/issedTiming/.test(String(CHAINRESP_ORIG_S492))
   && !/issedTiming/.test(String(NEGATORS_ORIG_S492))
   && !/issedTiming/.test(String(BEGINWIN_ORIG_S492)),'');
ok('B ★ 《血の代償》自身は宣言していない（逃すのは応答する側のカード）。宣言表は S03-U494 の R1 の 6 件だけ',
   missedTimingModeS03('血の代償')===null
   && JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03).sort())===JSON.stringify(
      ['サイコ・エンペラー','スノーマンイーター','バーニング・スカルヘッド','リチュア・チェイン','炎帝近衛兵','素早いビッグハムスター'].sort())
   && Object.keys(MISSED_TIMING_DECL_S03).every(k=>MISSED_TIMING_DECL_S03[k].mode==='never'
        && /^(WIKI|R1103)-/.test(MISSED_TIMING_DECL_S03[k].ruling||'')),
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03)));
`, {expect:9});

/* ===== C. 対照1: チェーン1 ─ 召喚が最後に行われた処理なので発動できる（WIKI-2B88D7C8D921） ===== */
harness(COMMON + String.raw`
const U=bloodBoard();
const links=activateChain1();
ok('C 前提: 《血の代償》がチェーン1で発動している',
   links===1 && gameState.chain[0].name==='血の代償',
   JSON.stringify({links,chain:(gameState.chain||[]).map(x=>x.name)}));
drive();
ok('C ★ 召喚成功のイベントの刻みが、判定時の番号と一致する（召喚が最後に行われた処理）',
   summonCollect().length>0 && summonCollect().every(c=>c.stamp===c.now),
   JSON.stringify(summonCollect().map(c=>[c.stamp,c.now])));
ok('C ★ 相手の《奈落の落とし穴》が発動でき、召喚したモンスターは除外される（当時裁定どおり）',
   zu(U.air)==='banish',JSON.stringify({air:zu(U.air)}));
ok('C ★ 召喚したモンスター自身の召喚誘発も働く（デッキの《E・HERO オーシャン》が手札に加わる）',
   zu(U.ocean)==='hand',JSON.stringify({ocean:zu(U.ocean)}));
ok('C ★ 何も落としていない',MISSED_TIMING_DROPS_S03.length===0,JSON.stringify(MISSED_TIMING_DROPS_S03));
audit('C');
`, {expect:6});

/* ===== D. チェーン2で召喚の後に別の処理がある ─ 逃す（WIKI-2B88D7C8D921） ===== */
const dRun = harness(COMMON + String.raw`
/* チェーン1 = 《成金ゴブリン》（解決でドローとライフ回復＝召喚の後の別の処理）、チェーン2 = 《血の代償》 */
const U=bloodBoard({goblin:true});
const links=activateChain2('hand',0);
ok('D 前提: 《成金ゴブリン》がチェーン1、《血の代償》がチェーン2',
   links===2 && gameState.chain[0].name==='成金ゴブリン' && gameState.chain[1].name==='血の代償',
   JSON.stringify({links,chain:(gameState.chain||[]).map(x=>x.name)}));
drive();
ok('D ★ 召喚成功のイベントの刻みより、判定時の番号が進んでいる（召喚の後に別の処理があった）',
   summonCollect().length>0 && summonCollect().every(c=>c.stamp<c.now),
   JSON.stringify(summonCollect().map(c=>[c.stamp,c.now])));
ok('D ★ 相手の《奈落の落とし穴》は発動できず、召喚したモンスターは場に残る（当時裁定どおり逃した）',
   zu(U.air)==='mz',JSON.stringify({air:zu(U.air)}));
ok('D ★ 召喚したモンスター自身の召喚誘発も逃す（《E・HERO オーシャン》はデッキに残る）',
   zu(U.ocean)==='deck',JSON.stringify({ocean:zu(U.ocean)}));
ok('D ★ 落とした記録に、条件が満たされた番号と判定時の番号が残る',
   MISSED_TIMING_DROPS_S03.length===2
   && MISSED_TIMING_DROPS_S03.every(d=>d.eventName==='onNormalSummon'&&d.stepS03<d.nowS03)
   && MISSED_TIMING_DROPS_S03.map(d=>d.name).sort().join('/')==='E・HERO エアーマン/奈落の落とし穴',
   JSON.stringify(MISSED_TIMING_DROPS_S03));
ok('D ★ 召喚成功後の POINT 窓は今までどおり開き、一般のクイックエフェクト（《血の代償》）が出る',
   pointNames('summonFast').length===2 && pointNames('summonFast')[0].indexOf('血の代償')>=0,
   JSON.stringify(pointNames('summonFast')));
ok('D ★ 《奈落の落とし穴》はもともと POINT 窓の応答候補ではない（経路は collectHandlers だけ）',
   pointNames('summonFast').every(ns=>ns.indexOf('奈落の落とし穴')<0),
   JSON.stringify(pointNames('summonFast')));
ok('D: チェーン1の処理（ドローと相手のライフ回復）は実際に行われている',
   gameState.players[1].lp===9000,String(gameState.players[1].lp));
audit('D');

/* 保存: チェーン2本を積み終えて応答窓が開いている所（刻みの付いた遅延イベントが残っている中断点）。
   この局面の解決の中で判定が行われるので、再開側で同じ判定になるかを見られる。 */
const V=bloodBoard({goblin:true});
activateChain2('hand',0);
globalThis.__U492={V, save:savedRaw(), step:s(), chainWindow:JSON.stringify(gameState.chainWindow||null),
  chain:(gameState.chain||[]).map(x=>x.name), deferred:JSON.parse(JSON.stringify(gameState.deferredEvents||[]))};
ok('D 前提: 保存した時点で応答窓が開いていて、刻みの付いた遅延イベントが残っている',
   !!gameState.chainWindow && (gameState.chain||[]).length===2
   && globalThis.__U492.deferred.some(x=>x.evt&&x.evt.stepS03!=null),
   JSON.stringify({window:globalThis.__U492.chainWindow,defs:defs()}));
drive();
globalThis.__U492.finalNoSave={air:zu(V.air), ocean:zu(V.ocean),
  step:s(), digest:v41StateDigest(gameState),
  drops:JSON.parse(JSON.stringify(MISSED_TIMING_DROPS_S03))};
ok('D: 保存せず最後まで進めた側でも、同じ判定になっている',
   globalThis.__U492.finalNoSave.air==='mz' && globalThis.__U492.finalNoSave.drops.length===2,
   JSON.stringify(globalThis.__U492.finalNoSave));
`, {expect:11});

/* ===== E. 対照2: チェーン2でも後続リンクが処理なしなら逃さない（チェーン番号だけの一律禁止ではない） ===== */
harness(COMMON + String.raw`
/* チェーン1 = 《王宮の弾圧》（永続罠の「カードの発動」。解決では何の処理も行わない）、チェーン2 = 《血の代償》 */
const U=bloodBoard({chain1Card:'王宮の弾圧'});
const links=activateChain2('sz',1);
ok('E 前提: 《王宮の弾圧》がチェーン1、《血の代償》がチェーン2（D と同じリンク番号）',
   links===2 && gameState.chain[0].name==='王宮の弾圧' && gameState.chain[1].name==='血の代償',
   JSON.stringify({links,chain:(gameState.chain||[]).map(x=>x.name)}));
drive();
ok('E ★ 後続リンクが処理なしなので番号が進まず、刻みと判定時の番号が一致する（R4 の《光神テテュス》08/01/30）',
   summonCollect().length>0 && summonCollect().every(c=>c.stamp===c.now),
   JSON.stringify(summonCollect().map(c=>[c.stamp,c.now])));
ok('E ★ チェーン2でも《奈落の落とし穴》は発動できる（リンク番号で一律に禁止していない）',
   zu(U.air)==='banish',JSON.stringify({air:zu(U.air)}));
ok('E ★ 何も落としていない',MISSED_TIMING_DROPS_S03.length===0,JSON.stringify(MISSED_TIMING_DROPS_S03));
audit('E');
`, {expect:5});

/* ===== F. 対照3: 強制誘発・普通の通常召喚・同時に行われた処理 ===== */
harness(COMMON + String.raw`
/* F1: 強制誘発はチェーン2で召喚の後に処理があっても逃さない（R1）
   《王虎ワンフー》= onOtherSummon の強制誘発（攻1400以下の召喚に反応して破壊する） */
let U=bloodBoard({goblin:true, summon:'ワイト', abyss:false, wanghu:true});
activateChain2('hand',0);
drive();
ok('F1 前提: 召喚の後に別の処理があり、番号が進んでいる',
   summonCollect().length>0 && summonCollect().every(c=>c.stamp<c.now),
   JSON.stringify(summonCollect().map(c=>[c.stamp,c.now])));
ok('F1 ★ 強制誘発（《王虎ワンフー》）は逃さず、召喚された《ワイト》を破壊する（R1）',
   zu(U.air)==='grave' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({air:zu(U.air),drops:MISSED_TIMING_DROPS_S03}));

/* F2: 普通の（チェーンを作らない）通常召喚では、召喚が最後に行われた処理なので逃さない */
U=bloodBoard({abyss:true});
gameState.players[0].sz=[];   /* 《血の代償》を使わず、手札から直接通常召喚する */
baselineA();
doNormalSummon(0,'atk');
drive();
ok('F2 ★ 普通の通常召喚では刻みと判定時の番号が一致し、召喚誘発も相手の応答も働く',
   summonCollect().length>0 && summonCollect().every(c=>c.stamp===c.now)
   && zu(U.air)==='banish' && zu(U.ocean)==='hand' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({collect:summonCollect().map(c=>[c.stamp,c.now]),air:zu(U.air),ocean:zu(U.ocean),
                   drops:MISSED_TIMING_DROPS_S03.length}));

/* F3: 同時に行われた処理が別々の Action で実装されている場合（R4）─ 《激流葬》の全体破壊 */
fresh();
const t=mk('激流葬',1,'down');t.setTurn=gameState.turn-1;gameState.players[1].sz=[t];
gameState.players[0].mz=[mk('ワイト',0,'up'),mk('ワイト',0,'up')];
gameState.players[0].hand=[mk('グリーン・ガジェット',0)];
gameState.players[0].deck.unshift(mk('レッド・ガジェット',0));
baselineA();
doNormalSummon(0,'atk');
drive();
const leave=COLLECT.filter(c=>c.ev==='onLeaveField'&&c.stamp!=null);
ok('F3 ★ 《激流葬》の同時破壊は、別々の Action で実装されていても同じ番号になる（空振りの 2 つめを数えない）',
   leave.length>=3 && new Set(leave.slice(0,3).map(c=>c.stamp)).size===1,
   JSON.stringify(leave.map(c=>[c.stamp,c.now])));

/* F4: 戦闘での相打ち */
fresh();
const atk=mk('ワイト',0,'up'), def=mk('ワイト',1,'up');
gameState.players[0].mz=[atk];gameState.players[1].mz=[def];
gameState.phase='battle';
baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});
drive();
const bl=COLLECT.filter(c=>c.ev==='onLeaveField'&&c.stamp!=null);
ok('F4 ★ 戦闘の相打ちで場を離れた 2 体は同じ番号になる（BATTLE_CLEANUP 1 回）',
   bl.length===2 && bl[0].stamp===bl[1].stamp && z(atk)==='grave' && z(def)==='grave',
   JSON.stringify(bl.map(c=>[c.stamp,c.now])));
ok('F4: 同一解決中の複数特殊召喚は 1 イベントにまとめられるので刻みも 1 つになる（既存の共通処理）',
   /queueDeferredEventV2\('onSpecialSummon',evt\)/.test(String(flushResolutionSummonBatchV2)),'');
`, {expect:6});

/* ===== G. 保存 → 新しい VM → 再開 → Replay（D の局面） ===== */
const H = dRun.__U492;
harness('const SAVED=' + JSON.stringify(H.save) + ';const REF=' + JSON.stringify(H.finalNoSave)
  + ';const V=' + JSON.stringify(H.V) + ';const DEFERRED=' + JSON.stringify(H.deferred)
  + ';const STEP_AT_SAVE=' + H.step + ';const CHAIN=' + JSON.stringify(H.chain) + ';'
  + COMMON + String.raw`
ok('G 前提: 保存に、条件が満たされた番号を刻んだ遅延イベントが入っている',
   DEFERRED.some(x=>x.evt&&x.evt.stepS03!=null),JSON.stringify(DEFERRED).slice(0,200));
loadInto(SAVED);
ok('G ★ 再開した直後の処理番号が、保存した時点と一致する',
   s()===STEP_AT_SAVE,JSON.stringify({now:s(),saved:STEP_AT_SAVE}));
ok('G ★ 再開した直後の遅延イベントの刻みが、保存した時点と一致する（判定の材料が失われていない）',
   JSON.stringify(defs())===JSON.stringify(DEFERRED.map(x=>[x.eventName,x.evt&&x.evt.stepS03])),
   JSON.stringify({now:defs(),saved:DEFERRED.map(x=>[x.eventName,x.evt&&x.evt.stepS03])}));
ok('G ★ 積んだチェーンも応答窓も再開されている（解決はこれから行われる）',
   JSON.stringify((gameState.chain||[]).map(x=>x.name))===JSON.stringify(CHAIN) && !!gameState.chainWindow,
   JSON.stringify({chain:(gameState.chain||[]).map(x=>x.name),window:gameState.chainWindow}));
drive();
ok('G ★ 新しい VM で再開して解決しても、保存なしの側と同じ判定になる（逃す）',
   zu(V.air)===REF.air && zu(V.ocean)===REF.ocean
   && MISSED_TIMING_DROPS_S03.length===REF.drops.length
   && JSON.stringify(MISSED_TIMING_DROPS_S03.map(d=>[d.name,d.stepS03,d.nowS03]))
      ===JSON.stringify(REF.drops.map(d=>[d.name,d.stepS03,d.nowS03])),
   JSON.stringify({air:zu(V.air),ocean:zu(V.ocean),drops:MISSED_TIMING_DROPS_S03,ref:REF.drops}));
ok('G ★ 最終の処理番号も保存なしの側と一致する',s()===REF.step,JSON.stringify({now:s(),ref:REF.step}));
ok('G ★ 最終の digest も保存なしの側と一致する',
   v41StateDigest(gameState)===REF.digest,JSON.stringify({now:v41StateDigest(gameState),ref:REF.digest}));
const A=v44ReplayAuditPackage(v41ReplayPackage(gameState));
ok('G ★ 再開後の Replay 監査も全 digest と最終状態を再現する',
   A.ok && A.finalDigest===v41StateDigest(gameState),JSON.stringify(A).slice(0,160));
`, {expect:8});

/* ===== H. negative control ===== */
harness(COMMON + String.raw`
/* H1: 種別を無効にすると、D の局面で逃さなくなる（S03-U491 以前の挙動） */
MISSED_TIMING_CLASSES_S03.summonSuccess=false;
const U=bloodBoard({goblin:true});
activateChain2('hand',0);
drive();
ok('H1 negative control: 種別を無効にすると、チェーン2で召喚の後に処理があっても逃さない（修正前の挙動）',
   zu(U.air)==='banish' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({air:zu(U.air),drops:MISSED_TIMING_DROPS_S03.length}));
`, {expect:1});

harness(COMMON + String.raw`
/* H2: 判定を素通りにしても同じ（判定の 1 箇所が効いていることの確認） */
filterMissedTimingS03=function(c){return c;};
const U=bloodBoard({goblin:true});
activateChain2('hand',0);
drive();
ok('H2 negative control: 判定を素通りにすると逃さない（判定は collectHandlers の 1 箇所で効いている）',
   zu(U.air)==='banish',JSON.stringify({air:zu(U.air)}));
`, {expect:1});

harness(COMMON + String.raw`
/* H3: 刻みを外すと判定そのものが働かない */
const q=queueDeferredEventV2;
queueDeferredEventV2=function(n,e){const r=q.apply(this,arguments);
  (gameState.deferredEvents||[]).forEach(x=>{if(x&&x.evt)delete x.evt.stepS03;});return r;};
const U=bloodBoard({goblin:true});
activateChain2('hand',0);
drive();
ok('H3 negative control: 刻みが無いと判定は働かない（逃さない）',
   zu(U.air)==='banish' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({air:zu(U.air),drops:MISSED_TIMING_DROPS_S03.length}));
`, {expect:1});

harness(COMMON + String.raw`
/* H4: 空振り・例外の除外を外すと、何も起きていない Action でも番号が進む */
fresh();baselineA();
const before=s();
for(let i=0;i<5;i++) act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:3});
const kept=s();
const endOrig=missedTimingEndS03;
missedTimingEndS03=function(gs,f,applied){if(f)gs.procStepS03=(gs.procStepS03|0)+1;};
for(let i=0;i<5;i++) act({type:'FX_TO_GRAVE',player:0,zone:'mz',index:3});
ok('H4 negative control: 空振りの除外を外すと、何も起きていない 5 回の Action で番号が 5 進む',
   kept===before && s()===before+5,JSON.stringify({before,kept,loose:s()}));
missedTimingEndS03=endOrig;
`, {expect:1});

harness(COMMON + String.raw`
/* H5: S03-U491 の「帳簿の Action でも番号を進める」性質を足すと、
   チェーン1（当時裁定では《奈落の落とし穴》を発動できる）でも誤って逃す。これが実測した欠陥の再現。
   S03-U491 の 39 種の拒否リストには SPECIAL_WIN_DEFER_S03 が入っていなかった。 */
const OLD39_S491=['EVENT_QUEUE_V31','EVENT_DEQUEUE_V31','EVENT_RESUME_V11','EVENT_SUMMARY_S03','EVENT_TAKE_S03',
  'CHAIN_ADD','CHAIN_CLEAR','CHAIN_NEGATE_LINK','CHAIN_RESOLVE_TOP','CHAIN_RETARGET_S03',
  'CHOICE_OPEN_V49','CHOICE_ANSWER_V49','CHOICE_CANCEL_V49',
  'PREP_TX_BEGIN_S03','PREP_TX_ABORT_S03','PREP_TX_COMMIT_S03',
  'SUMMON_WINDOW_OPEN_V42','SUMMON_WINDOW_CLOSE_V42','SUMMON_WINDOW_NEGATE_V42',
  'EX_SUMMON_PREPARE_V42','EX_SUMMON_CANCEL_V42',
  'COUNTER_CLEAR','MOD_CLEAR','MOD_CLEAR_LABEL_V7','LINK_CLEAR_V9',
  'ATTACK_PENDING_CLEAR_S03','ATTACK_PENDING_RETARGET_S03','SET_PRIORITY','SET_PHASE',
  'V4_EFFECT_REGISTER','V4_EFFECT_REMOVE','V4_EFFECT_RESET_S03',
  'EFFECT_COUNT_CONSUME_V44','COUNT_REFUND_S03',
  'SCHEDULE_ADD_V7','SCHEDULE_REMOVE_V7','LINGER_ADD_S03','NORMAL_SUMMON_ATTEMPT','PENDING_RESOLVE'];
ok('H5 前提: S03-U491 の拒否リストは 39 種で、SPECIAL_WIN_DEFER_S03 を取りこぼしていた',
   OLD39_S491.length===39 && OLD39_S491.indexOf('SPECIAL_WIN_DEFER_S03')<0,'');
const af=applyAction;
applyAction=function(gs,a){
  if(APPLY_ACTION_DEPTH_V31===0 && a && a.type && OLD39_S491.indexOf(a.type)<0) gs.procStepS03=(gs.procStepS03|0)+1;
  return af.apply(this,arguments);};
const U=bloodBoard();
activateChain1();
drive();
ok('H5 negative control ★ 拒否リストの性質を足すと、チェーン1でも刻みと番号がずれる',
   summonCollect().length>0 && summonCollect().every(c=>c.stamp<c.now),
   JSON.stringify(summonCollect().map(c=>[c.stamp,c.now])));
ok('H5 negative control ★ その結果《奈落の落とし穴》が発動できなくなる（当時裁定では発動できる＝誤判定）',
   zu(U.air)==='mz' && MISSED_TIMING_DROPS_S03.length>0,
   JSON.stringify({air:zu(U.air),drops:MISSED_TIMING_DROPS_S03}));
`, {expect:3});

/* ===== I. 裁定の引用（カード名・回答日の有無）と、召喚無効に触っていないこと ===== */
const DESIGN = rdS492('docs/S03_MISSED_TIMING_DESIGN.md');
const CORE = rdS492('cards/00_generic_core.js');
const U487R = rdS492('docs/S03_U487_REPORT.md');
const I = [
  /WIKI-2B88D7C8D921/.test(DESIGN) && /《落とし穴》/.test(DESIGN) && /回答日なし/.test(DESIGN),
  /WIKI-2CF23AA42E79/.test(DESIGN) && /昇天の角笛/.test(DESIGN) && /2011-08-25/.test(DESIGN),
  !/《奈落の落とし穴》を発動できますか/.test(CORE) && !/《奈落の落とし穴》を発動できますか/.test(U487R)
    && /誤って書き/.test(DESIGN),
  /WIKI-2B88D7C8D921/.test(CORE) && /WIKI-2CF23AA42E79/.test(CORE) && /S03-U492 で訂正/.test(U487R),
  /召喚そのものの無効/.test(DESIGN) && /S03-U493/.test(DESIGN),
];
harness('const I=' + JSON.stringify(I) + ';' + String.raw`
ok('I ★ WIKI-2B88D7C8D921 は《落とし穴》＝召喚成功後の応答で、回答日が無いと記録されている',I[0],'');
ok('I ★ WIKI-2CF23AA42E79 は《昇天の角笛》等の召喚無効で、回答日 2011-08-25 と記録されている',I[1],'');
ok('I ★ カード名を誤った引用は残っておらず、誤記は訂正の記述としてだけ残っている',I[2],'');
ok('I ★ カードの注釈に両方の裁定 ID が入り、S03-U487 報告に訂正が明記されている',I[3],'');
ok('I ★ 召喚無効は別タイミングとして分離され、別単位（S03-U493 以降）に回されている',I[4],'');
`, {expect:5});
