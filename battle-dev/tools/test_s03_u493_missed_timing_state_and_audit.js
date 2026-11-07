/* S03-U493: 「タイミングを逃す」の精度 ─ (1) 表示形式・攻守・レベル・カウンターだけが変わる後続処理と、
   (2) 召喚成功のイベントで拾う候補の全件監査。設計は docs/S03_MISSED_TIMING_DESIGN.md（3(A) / 3(B) / 5）。

   本単位の根拠になる当時裁定（docs/S03_MISSED_TIMING_RULINGS.md）:
     WIKI-9FC5B41EDCF4  回答日 2011-04-17  《ゴブリンドバーグ》
       Q:「このカードで《E・HERO エアーマン》を特殊召喚する場合、エアーマンの効果はタイミングを逃さず発動できますか？」
       A:「いいえ、特殊召喚した後に**守備表示になる処理**が入りタイミングを逃してしまい、発動できません。」
     WIKI-0B439F71B94A  回答日 2011-04-18  同カードの裏返し（《聖なる輝き》で表側守備表示で通常召喚した場合は
       守備表示にする処理が行われないので、エアーマンの効果を発動できる）── 表側守備表示の通常召喚が
       未実装なので本単位では再現できない（G2）
     WIKI-97539AE7CAEB  回答日 2010-02-13  《ドラグニティ－ピルム》 特殊召喚の後に装備カード化する処理が入るので
       《奈落の落とし穴》《激流葬》はタイミングを逃す
     WIKI-3178D0C2D874  回答日 2010-07-03  《連鎖除外》 シャッフルは効果処理に含まれない（ルール上の行為）

   S03-U493 で直した 2 点（どちらも先に実経路で再現した）:
     (1) 「何か起きたか」の印が logIt の有無に依存していた。盤面の署名が枚数とライフしか見ていないため、
         表示形式・攻守・レベル・カウンターだけが変わる処理はログでしか判別できず、
         FX_SET_STATE の pos だけ／lvDelta だけの変更は許可リストの条件から外れて**数え落ちていた**。
         → 署名を 1 枚ごとの状態まで広げ、ログの印は完全に外した。
     (2) 種別が配線だけで決まっていたため、「場合」のカードまで落としていた。
         → 当時テキストの「時」／「場合」を足し、肯定的に「時」と読めるものだけを落とす。 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S493 = pathA.resolve(__dirname, '..');
const rdS493 = p => fsA.readFileSync(pathA.join(ROOT_S493, p), 'utf8');

/* 発動の表返し（reason:'発動'）を出す engine の箇所と、カードスクリプトが出していないことを数える。 */
const ACT_FLIP_SITES_S493 = (() => {
  const out = [];
  ['engine', 'cards'].forEach(dir => {
    fsA.readdirSync(pathA.join(ROOT_S493, dir)).filter(f => f.endsWith('.js')).sort().forEach(f => {
      rdS493(dir + '/' + f).split('\n').forEach((ln, i) => {
        if (ln.indexOf('FX_SET_STATE') >= 0 && /reason:\s*["']発動["']/.test(ln)) out.push(dir + '/' + f + ':' + (i + 1));
      });
    });
  });
  return out;
})();
const ALLOW_S493 = (rdS493('engine/1ZZX_missed_timing_s03.js')
  .match(/const MISSED_TIMING_PROCESSING_S03 = new Map\(\[[\s\S]*?\n\]\);/) || [''])[0]
  .match(/\['([A-Z][A-Z0-9_]*)',/g) || [];
const ALLOW_SET_S493 = new Set(ALLOW_S493.map(x => x.slice(2, -2)));

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function s(){return gameState.procStepS03|0;}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
let COLLECT=[], PTS=[], STEPS=[];
const COLLECT_ORIG_S493=collectHandlers;
const POINT_ORIG_S493=pointResponsesV27;
const CHAINRESP_ORIG_S493=getChainResponsesV2;
const NEGATORS_ORIG_S493=summonNegatorsV2;
const CARDSIG_ORIG_S493=missedTimingCardSigS03;
const CLAUSEKIND_ORIG_S493=missedTimingClauseKindS03;
(function(){
  const f=collectHandlers;collectHandlers=function(n,e){const r=f.apply(this,arguments);
    COLLECT.push({ev:n,stamp:(e&&e.stepS03!=null)?e.stepS03:null,now:s(),names:r.map(x=>x.name)});return r;};
  const g=pointResponsesV27;pointResponsesV27=function(p,pl){const r=g.apply(this,arguments);
    PTS.push({kind:pl&&pl.kind,p:p,names:r.map(x=>x.db&&x.db.n)});return r;};
  const h=applyAction;applyAction=function(gs,a){const d=APPLY_ACTION_DEPTH_V31,b=s();
    try{return h.apply(this,arguments);}finally{if(d===0)STEPS.push([(a&&a.type)||'?',b,s()]);}};
})();
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function fresh(){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4930011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();return 'flush';}
  return null;}
function drive(){for(let i=0;i<900;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function loadInto(raw){resetA();resetVolatile();COLLECT=[];PTS=[];STEPS=[];resetMissedTimingDropsS03();
  localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function stepsOf(t){return STEPS.filter(x=>x[0]===t);}
function dropNames(){return MISSED_TIMING_DROPS_S03.map(d=>d.name).sort();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}

/* --- 盤面1（WIKI-9FC5B41EDCF4）---
   p0 が《ゴブリンドバーグ》を通常召喚する。その召喚誘発で手札の《E・HERO エアーマン》（攻1800）を
   特殊召喚し、続けてゴブリンドバーグ自身が守備表示になる。
   p1 は前のターンに《奈落の落とし穴》（攻1500以上の召喚成功時に発動できる罠）を伏せている。 */
function gobBoard(){
  fresh();
  const gob=mk('ゴブリンドバーグ',0), air=mk('E・HERO エアーマン',0);
  gameState.players[0].hand=[gob,air];
  const ocean=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,ocean);
  const abyss=mk('奈落の落とし穴',1,'down');abyss.setTurn=gameState.turn-1;gameState.players[1].sz=[abyss];
  baselineA();
  return {gob:gob.uid, air:air.uid, ocean:ocean.uid, abyss:abyss.uid};
}
/* --- 盤面2（S03-U492 の《血の代償》盤面の派生）---
   p0 の sz[0]=《血の代償》（表側）、sz[1]=チェーン1で発動するカード（前のターンにセット）。
   《血の代償》をチェーン2として積み、手札のモンスターを通常召喚する。 */
function bloodBoard(o){
  fresh();
  gameState.players[0].sz=[mk('血の代償',0,'up')];
  if(o.chain1){const e=mk(o.chain1,0,'down');e.setTurn=gameState.turn-1;gameState.players[0].sz.push(e);}
  if(o.chain1Mz){gameState.players[0].mz=[mk(o.chain1Mz,0,'up')];}
  const mon=mk(o.summon,0);
  gameState.players[0].hand=[mon];
  (o.hand||[]).forEach(n=>gameState.players[0].hand.push(mk(n,0)));
  (o.grave||[]).forEach(n=>gameState.players[0].grave.push(mk(n,0)));
  const ocean=mk('E・HERO オーシャン',0);gameState.players[0].deck.splice(1,0,ocean);
  let abyss=null;
  if(o.abyss!==false){abyss=mk('奈落の落とし穴',1,'down');abyss.setTurn=gameState.turn-1;gameState.players[1].sz.push(abyss);}
  if(o.foeUp) gameState.players[1].mz=[mk(o.foeUp,1,'up')];
  if(o.foeDown) gameState.players[1].mz=[mk(o.foeDown,1,'down','def')];
  baselineA();
  return {mon:mon.uid, ocean:ocean.uid, abyss:abyss?abyss.uid:null};
}
/* チェーン1に 1 枚（コスト・対象の選択まで答える）、その上にチェーン2として《血の代償》を積む。 */
function stackTwo(zone,index){
  duelActivateFromZone(0,zone,index);
  let g=0;while(pc()&&(gameState.chain||[]).length<1&&g++<8)__choicePickV49(0);
  const r=(getChainResponsesV2(0)||[]).find(x=>x.db.n==='血の代償');
  if(r) duelActivateResponseV2(0,r.zone,r.index);
  g=0;while(pc()&&(gameState.chain||[]).length<2&&g++<8)__choicePickV49(0);
  return (gameState.chain||[]).length;
}
function summonCollect(){return COLLECT.filter(c=>/^on(Normal|Special)Summon$/.test(c.ev)&&c.stamp!=null);}
const BOTH_S493=['E・HERO エアーマン','奈落の落とし穴'].sort();
`;

/* ===== A. 「何か起きたか」の印 ─ ログに依存せず、1 枚ごとの状態で判定する ===== */
harness('const SITES=' + JSON.stringify(ACT_FLIP_SITES_S493) + ';'
      + 'const ALLOW=' + JSON.stringify([...ALLOW_SET_S493].sort()) + ';' + COMMON + String.raw`
fresh();baselineA();
ok('A1 ★ 「起きたか」の印は盤面の署名と遅延イベントだけ — ログは印にしていない',
   !/MISSED_TIMING_LOGS_S03|noteMissedTimingLogS03|MISSED_TIMING_REFUSAL_LOG_S03/.test(String(missedTimingEndS03))
   && !/MISSED_TIMING_LOGS_S03|f\.logs/.test(String(missedTimingBeginS03))
   && !/issedTiming/.test(String(logIt))
   && /missedTimingSigS03\(gs\) !== f\.sig/.test(String(missedTimingEndS03)),
   String(missedTimingEndS03).slice(0,160));
ok('A1 ★ ログ用のカウンタと断りのログの一覧は engine から消えている',
   typeof noteMissedTimingLogS03==='undefined' && typeof MISSED_TIMING_REFUSAL_LOG_S03==='undefined','');
const base={uid:7,face:'up',pos:'atk'};
const sig=c=>missedTimingCardSigS03(0,c);
const FIELDS=[['face','down'],['pos','def'],['lvMod',2],['mods',[{atk:1}]],['statModsV14',[{}]],
  ['lvModsV16',[{}]],['charV17',[{}]],['xyz',[{}]],['equippedBy',[1]],['equipTo',{p:1,uid:9}],
  ['negated',true],['negV13',{}],['dualUp',true],['counters',{'魔力':1}]];
const unseen=FIELDS.filter(f=>sig(Object.assign({},base,{[f[0]]:f[1]}))===sig(base)).map(f=>f[0]);
ok('A2 ★ 署名は表示形式・攻守修整・レベル・カウンター・装備・素材・無効を 1 枚ごとに見る（14 欄で実測）',
   unseen.length===0, JSON.stringify({unseen}));
ok('A2 ★ カウンターは種類と数の両方を見る',
   sig(Object.assign({},base,{counters:{'魔力':1}}))!==sig(Object.assign({},base,{counters:{'魔力':2}}))
   && sig(Object.assign({},base,{counters:{'魔力':1}}))!==sig(Object.assign({},base,{counters:{'A':1}})),'');
const BOOK=[['procedureBaseStats',{}],['attacked',true],['attackCount',3],['posWindowUsedTurnV10',5],
  ['positionChangedTurn',5],['flipSummonedTurnS03',5]];
const seenBook=BOOK.filter(f=>sig(Object.assign({},base,{[f[0]]:f[1]}))!==sig(base)).map(f=>f[0]);
ok('A3 ★ どの Action でも走る帳簿の欄（召喚方法の数値・攻撃済み・表示形式変更の記録）は署名に入れない',
   seenBook.length===0, JSON.stringify({seenBook}));
ok('A4 ★ 「発動」の表返しを出すのは engine の 3 箇所だけで、カードスクリプトには無い',
   SITES.length===3 && SITES.every(x=>x.indexOf('engine/')===0),JSON.stringify(SITES));
ok('A4 ★ missedTimingActivationFlipS03 はその形（face:up・pos なし・reason:発動）だけを真にする',
   missedTimingActivationFlipS03({face:'up',reason:'発動'})===true
   && missedTimingActivationFlipS03({face:'up',pos:'atk',reason:'発動'})===false
   && missedTimingActivationFlipS03({face:'up',reason:'効果で表側表示に',v10FlipEffect:true})===false
   && missedTimingActivationFlipS03({face:'up',reason:'ダメージ計算前のリバース'})===false
   && missedTimingActivationFlipS03({face:'down'})===false,'');
ok('A5 ★ 攻守・レベル・特性の修整は付けるときだけ数え、解除（clear）は数えない',
   ['STAT_MOD_V14','LEVEL_MOD_V16','CHAR_MOD_V17'].every(t=>
     missedTimingIsProcessingS03({type:t})===true && missedTimingIsProcessingS03({type:t,clear:true})===false)
   && ALLOW.indexOf('MOD_CLEAR')<0 && ALLOW.indexOf('COUNTER_CLEAR')<0,'');
fresh();
const brk=mk('魔導戦士 ブレイカー',0,'up');gameState.players[0].mz=[brk];baselineA();
const c0=s();
act({type:'COUNTER_ADD',player:0,zone:'mz',index:0,kind:'魔力',n:1});
const c1=s(), logsBefore=gameState.log.length;
/* 乗っていない種類のカウンターを取り除く。reducer は「0つ取り除いた」とログに書いて何も変えない。 */
act({type:'COUNTER_REMOVE',player:0,zone:'mz',index:0,kind:'A',n:1});
ok('A6 ★ カウンターは動いたときだけ数える — 0 個の取り除きはログが増えても数えない',
   c1===c0+1 && s()===c1 && gameState.log.length>logsBefore
   && JSON.stringify(cu(brk.uid).counters)===JSON.stringify({'魔力':1}),
   JSON.stringify({c0,c1,now:s(),logs:gameState.log.length-logsBefore,counters:cu(brk.uid).counters}));
fresh();
const w=mk('ワイト',0,'up');gameState.players[0].mz=[w];baselineA();
const p0=s();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,pos:'def',reason:'S03-U493'});
const p1=s();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,pos:'def',reason:'S03-U493'});
ok('A7 ★ 表示形式だけが変わる処理は数え、同じ表示形式にし直す空振りは数えない',
   p1===p0+1 && s()===p1 && cu(w.uid).pos==='def', JSON.stringify({p0,p1,now:s()}));
const l0=s();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,lvDelta:1,reason:'S03-U493'});
const l1=s();
act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,lvDelta:0,reason:'S03-U493'});
ok('A8 ★ レベルだけが変わる処理は数え、増減 0 の空振りは数えない',
   l1===l0+1 && s()===l1, JSON.stringify({l0,l1,now:s()}));
`, {expect:11});

/* ===== B. 条件1の再現と修正（実経路・WIKI-9FC5B41EDCF4） ===== */
harness(COMMON + String.raw`
let U=gobBoard();
doNormalSummon(0,'atk');
drive();
const ss=COLLECT.filter(c=>c.ev==='onSpecialSummon'&&c.stamp!=null);
const posSteps=stepsOf('FX_SET_STATE').filter(x=>x[1]!==x[2]);
ok('B1 前提: 特殊召喚の後に「守備表示になる」処理が入り、番号が 1 進む',
   ss.length===1 && ss[0].stamp<ss[0].now && posSteps.length>=1,
   JSON.stringify({ss:ss.map(c=>[c.stamp,c.now]),steps:STEPS.map(x=>x.join(':'))}).slice(0,420));
ok('B2 ★ 当時裁定どおり、《E・HERO エアーマン》の召喚誘発と相手の《奈落の落とし穴》の両方がタイミングを逃す',
   JSON.stringify(dropNames())===JSON.stringify(BOTH_S493) && ss[0].names.length===0,
   JSON.stringify({drops:dropNames(),kept:ss[0].names}));
ok('B2 ★ 逃した結果として、エアーマンは除外されずフィールドに残り、サーチも行われない',
   zu(U.air)==='mz' && zu(U.ocean)==='deck' && cu(U.gob).pos==='def',
   JSON.stringify({air:zu(U.air),ocean:zu(U.ocean),gobPos:cu(U.gob).pos}));
ok('B2 ★ 落としたのは召喚成功の応答だけ — 一般の応答機会（POINT 窓）は開いている',
   PTS.length>0, JSON.stringify(PTS.map(x=>x.kind+':'+x.p)).slice(0,160));
audit('B2');
/* negative control: S03-U492 の FX_SET_STATE の条件（裏にする／反転召喚だけを数える）に戻す。
   表示形式だけの変更が型ごと数え落ちるので、当時裁定で逃すはずの 2 件が両方とも残る。 */
const PRED_ORIG_S493=MISSED_TIMING_PROCESSING_S03.get('FX_SET_STATE');
MISSED_TIMING_PROCESSING_S03.set('FX_SET_STATE', a=>a.face==='down'||a.flipSummon===true);
U=gobBoard();
doNormalSummon(0,'atk');
drive();
const ss3=COLLECT.filter(c=>c.ev==='onSpecialSummon'&&c.stamp!=null);
ok('B3 ★ negative control: S03-U492 の FX_SET_STATE の条件に戻すと、守備表示の処理が数え落ちて両方とも逃さなくなる',
   MISSED_TIMING_DROPS_S03.length===0 && ss3.length===1 && ss3[0].stamp===ss3[0].now
   && zu(U.air)==='banish',
   JSON.stringify({drops:dropNames(),ss:ss3.map(c=>[c.stamp,c.now]),air:zu(U.air)}));
MISSED_TIMING_PROCESSING_S03.set('FX_SET_STATE', PRED_ORIG_S493);
fresh();
const gob=mk('ゴブリンドバーグ',0), lo=mk('ワイト',0);
gameState.players[0].hand=[gob,lo];
gameState.players[1].mz=[mk('王虎ワンフー',1,'up')];
baselineA();
doNormalSummon(0,'atk');
drive();
ok('B4 ★ 同じ「守備表示になる処理」が入っても、強制誘発（《王虎ワンフー》）は逃さず破壊する（R1）',
   zu(lo.uid)==='grave' && MISSED_TIMING_DROPS_S03.length===0,
   JSON.stringify({wight:zu(lo.uid),drops:dropNames()}));
ok('B5 ★ 装備・素材・無効も署名に入っているので、同じ機構で後続処理として数えられる（WIKI-97539AE7CAEB の形）',
   missedTimingCardSigS03(0,{uid:1,equipTo:{p:0,uid:2}})!==missedTimingCardSigS03(0,{uid:1})
   && missedTimingIsProcessingS03({type:'FX_MONSTER_EQUIP_V46'})===true
   && missedTimingIsProcessingS03({type:'FX_EQUIP'})===true,'');
`, {expect:8});

/* ===== C. 攻守・レベル・カウンター・表示形式だけが変わる後続処理（実経路） ===== */
harness(COMMON + String.raw`
let U=bloodBoard({chain1Mz:'トラゴエディア', summon:'E・HERO エアーマン', hand:['ワイト'], grave:['デーモンの召喚']});
let links=stackTwo('mz',0);
drive();
const lvSteps=stepsOf('FX_SET_STATE').filter(x=>x[1]!==x[2]);
ok('C1 前提: チェーン2で召喚し、チェーン1の解決でレベルだけが変わる',
   links===2 && summonCollect().length===1 && lvSteps.length>=1,
   JSON.stringify({links,collect:summonCollect().map(c=>[c.stamp,c.now]),steps:STEPS.map(x=>x.join(':'))}).slice(0,420));
ok('C1 ★ レベルだけが変わる後続処理（《トラゴエディア》④）でも、召喚成功を条件とする発動は逃す',
   JSON.stringify(dropNames())===JSON.stringify(BOTH_S493) && zu(U.mon)==='mz',
   JSON.stringify({drops:dropNames(),mon:zu(U.mon)}));
U=bloodBoard({chain1:'突進', summon:'E・HERO エアーマン', foeUp:'ワイト'});
links=stackTwo('sz',1);
drive();
ok('C2 ★ 攻守だけが変わる後続処理（《突進》）でも逃す — ログではなく署名で判定している',
   links===2 && stepsOf('MOD_ADD').some(x=>x[2]===x[1]+1)
   && JSON.stringify(dropNames())===JSON.stringify(BOTH_S493),
   JSON.stringify({links,mod:stepsOf('MOD_ADD'),drops:dropNames()}));
U=bloodBoard({chain1:'侵食細胞「A」', summon:'E・HERO エアーマン', foeUp:'ワイト'});
links=stackTwo('sz',1);
drive();
ok('C3 ★ カウンターだけが変わる後続処理（《侵食細胞「A」》）でも逃す',
   links===2 && stepsOf('COUNTER_ADD').some(x=>x[2]===x[1]+1)
   && JSON.stringify(dropNames())===JSON.stringify(BOTH_S493),
   JSON.stringify({links,cnt:stepsOf('COUNTER_ADD'),drops:dropNames()}));
U=bloodBoard({chain1:'生命力吸収魔術', summon:'E・HERO エアーマン', foeDown:'ワイト'});
links=stackTwo('sz',1);
drive();
ok('C4 ★ 効果で表側にする後続処理（《生命力吸収魔術》）でも逃す — セット発動の表返しとは区別している',
   links===2 && JSON.stringify(dropNames())===JSON.stringify(BOTH_S493),
   JSON.stringify({links,drops:dropNames(),steps:STEPS.map(x=>x.join(':'))}).slice(0,300));
missedTimingCardSigS03=function(n,c){return n;};
U=bloodBoard({chain1Mz:'トラゴエディア', summon:'E・HERO エアーマン', hand:['ワイト'], grave:['デーモンの召喚']});
stackTwo('mz',0);
drive();
ok('C5 ★ negative control: 署名を戻すとレベルの後続処理が数え落ち、《奈落の落とし穴》が発動してしまう',
   MISSED_TIMING_DROPS_S03.length===0 && zu(U.mon)==='banish',
   JSON.stringify({drops:dropNames(),mon:zu(U.mon)}));
missedTimingCardSigS03=CARDSIG_ORIG_S493;
ok('C6 ★ シャッフル・デッキの並べ替え・攻撃宣言・登録は許可リストに無い（ルール上の行為と帳簿）',
   ['SHUFFLE','DECK_ORDER_V20','FACEDOWN_SHUFFLE_V20','SS_POS_S03','ATTACK_DECLARE_V48','RESERVE_ADD','FX_CARD_FLAG_V46']
   .every(t=>missedTimingIsProcessingS03({type:t})===false),'');
`, {expect:7});

/* ===== D. 召喚成功のイベントで拾う候補の全件監査（条件2） ===== */
harness(COMMON + String.raw`
resetA();
const EVS=['onNormalSummon','onSpecialSummon','onFlip'];
const B={forced:[],summonNegate:[],decl:[],drop:[],baai:[],none:[]};
Object.keys(CARD_SCRIPTS).forEach(nm=>{
  const sc=CARD_SCRIPTS[nm]; if(!sc||!sc.passive) return;
  const evs=EVS.filter(e=>typeof sc.passive[e]==='function');
  if(!evs.length) return;
  const forced=!!sc.forced||typeof sc.forcedForEventS03==='function'
    ||!!(sc.v4Unified&&typeof nativeEffectsV4==='function'&&(nativeEffectsV4(nm)||[]).some(e=>e&&e.forced===true));
  if(forced){B.forced.push(nm);return;}
  if(sc.summonNegate){B.summonNegate.push(nm);return;}
  if(missedTimingModeS03(nm)==='never'){B.decl.push(nm);return;}
  const cls=evs.map(e=>missedTimingClassS03({name:nm,eventName:e},{flipSummon:true})).filter(Boolean);
  if(cls.length){B.drop.push(nm);return;}
  const k=missedTimingTextKindS03(nm);
  if(k.n==='baai'||k.s==='baai'||k.f==='baai'||k.r==='baai'){B.baai.push(nm);return;}
  B.none.push(nm);
});
const total=Object.keys(B).reduce((a,k)=>a+B[k].length,0);
/* S03-U516 で《ジュラック・メテオ》を実装したので母集団が 1 枚増えた（518 → 519、強制 255 → 256）。
   数え方は変えていない。このカードの召喚誘発は強制なので強制側に入る。 */
/* S03-U520 で《天狗のうちわ》を実装したので候補が 1 枚増えた（519 → 520、強制 256 → 257）。数え方は変えていない。 */
/* S03-U526 で《冥王竜ヴァンダルギオン》を実装したので 1 本増えた（強制の召喚誘発）。数え方は変えていない。 */
ok('D1 ★ 候補は 525 件。内訳は 強制 262 / 宣言 7 / 逃す 207 / 場合 15 / 召喚無効 6 / 文言なし 28（S03-U495 で更新、S03-U516/U520/U526/U530/U533/U536/U538 で各 1 枚増）',
   total===525 && B.forced.length===262 && B.decl.length===7 && B.drop.length===207
   && B.baai.length===15 && B.summonNegate.length===6 && B.none.length===28,
   JSON.stringify(Object.keys(B).reduce((a,k)=>(a[k]=B[k].length,a),{})));
ok('D2 ★ 「場合」と読める 15 件は落とさない（R7）— 一覧を固定する（S03-U494 で当時の根拠と照合）',
   JSON.stringify(B.baai.slice().sort())===JSON.stringify(['D－HERO ディスクガイ','E・HERO ガイア','ダッカー',
     'デスグレムリン','デスハムスター','ハネハネ','ハンニバル・ネクロマンサー','光神機－轟龍','名工 虎鉄',
     '夜霧のスナイパー','茫漠の死者','赤い忍者','電磁ミノ虫','青い忍者','魔導戦士 ブレイカー'].sort()),
   JSON.stringify(B.baai));
ok('D3 ★ 召喚無効のカード 6 件は別タイミングなので落とさない（WIKI-2CF23AA42E79、本単位の対象外）',
   JSON.stringify(B.summonNegate.slice().sort())===JSON.stringify(['エレキャンセル','キックバック','ライト・バニッシュ',
     '神の宣告','神の警告','重力崩壊'].sort())
   && B.summonNegate.every(nm=>missedTimingDropS03({name:nm,eventName:'onNormalSummon'},{stepS03:1})===false),
   JSON.stringify(B.summonNegate));
const noneDropped=[];
B.none.forEach(nm=>EVS.forEach(e=>{
  if(missedTimingDropS03({name:nm,eventName:e},{stepS03:1})) noneDropped.push(nm+'@'+e);}));
ok('D4 ★ 文言が読み取れない 24 件（旧「リバース:」表記のリバース効果など）は落とさない',
   noneDropped.length===0
   && B.none.indexOf('ニードルワーム')>=0 && B.none.indexOf('ペンギン・ソルジャー')>=0
   && B.none.indexOf('ねずみ取り')>=0,
   JSON.stringify({noneDropped:noneDropped.slice(0,8),sample:B.none.slice(0,4)}));
ok('D5 ★ 落とす 207 件はすべて「時」と読める召喚句を持ち、罠・魔法と「反転召喚に成功した時」の 4 枚を含む',
   B.drop.every(nm=>{const k=missedTimingTextKindS03(nm);return k.n==='toki'||k.s==='toki'||k.f==='toki';})
   && ['奈落の落とし穴','落とし穴','激流葬','E・HERO エアーマン','ゴブリンドバーグ','連鎖除外','深黒の落とし穴',
       'スカラベの大群','メデューサ・ワーム','ガーディアン・スタチュー','イナゴの軍勢']
      .every(nm=>B.drop.indexOf(nm)>=0),
   JSON.stringify(B.drop.slice(0,4)));
ok('D6 ★ 強制 255 件は配線に当てはまっても落とさない（R1）',
   B.forced.filter(nm=>!!CARD_SCRIPTS[nm].forced)
     .every(nm=>missedTimingDropS03({name:nm,eventName:'onNormalSummon'},{stepS03:1})===false),'');
const ALL=Object.keys(B).reduce((a,k)=>a.concat(B[k]),[]);
ok('D7 ★ R5 の例外 3 枚は墓地送りの誘発で候補に入らない（R5 の宣言は今も 0 件）。宣言表は R1 の 6 件と R10 の 1 件',
   ['ダーク・スプロケッター','ファラオの化身','アーケイン・ファイロ'].every(nm=>ALL.indexOf(nm)<0)
   /* S03-U507: 宣言表は 8 件になった（R1 の 6 件 + R10 の 1 件 + **S03-U507 の miss 1 件**）。 */
   && Object.keys(MISSED_TIMING_DECL_S03).length===8
   && Object.keys(MISSED_TIMING_DECL_S03).filter(k=>MISSED_TIMING_DECL_S03[k].mode==='never').length===7
   && Object.keys(MISSED_TIMING_DECL_S03).filter(k=>MISSED_TIMING_DECL_S03[k].mode==='miss')
        .join('/')==='虚無空間',
   JSON.stringify(Object.keys(MISSED_TIMING_DECL_S03)));
ok('D8 ★ 種別は配線と文言の両方を要求する（どちらか一方では落とさない）',
   missedTimingClassS03({name:'奈落の落とし穴',eventName:'onNormalSummon'},{})==='summonSuccess'
   && missedTimingClassS03({name:'奈落の落とし穴',eventName:'onDestroy'},{})===null
   && missedTimingClassS03({name:'魔導戦士 ブレイカー',eventName:'onNormalSummon'},{})===null
   && missedTimingClassS03({name:'ニードルワーム',eventName:'onFlip'},{flipSummon:true})===null,'');
ok('D9 ★ 「反転召喚に成功した時」と書かれた誘発は onFlip で拾われても召喚成功として扱う（反転召喚も召喚）',
   ['スカラベの大群','メデューサ・ワーム','ガーディアン・スタチュー','イナゴの軍勢'].every(nm=>
     missedTimingClassS03({name:nm,eventName:'onFlip'},{flipSummon:true})==='summonSuccess'
     && missedTimingClassS03({name:nm,eventName:'onFlip'},{})===null),'');
`, {expect:9});

/* ===== E. 「場合」と「時」の実経路の対照（条件2） ===== */
harness(COMMON + String.raw`
let U=bloodBoard({chain1:'成金ゴブリン', summon:'魔導戦士 ブレイカー'});
let links=stackTwo('sz',1);
drive();
ok('E1 前提: チェーン2の召喚の後にチェーン1の処理があり、番号が進んでいる',
   links===2 && summonCollect().length===1 && summonCollect()[0].stamp<summonCollect()[0].now,
   JSON.stringify({links,collect:summonCollect().map(c=>[c.stamp,c.now])}));
ok('E1 ★ 「場合」の《魔導戦士 ブレイカー》は逃さず魔力カウンターを置き、「時」の《奈落の落とし穴》だけが逃す（R7）',
   JSON.stringify(dropNames())===JSON.stringify(['奈落の落とし穴'])
   && zu(U.mon)==='mz' && (cu(U.mon).counters||{})['魔力']===1,
   JSON.stringify({drops:dropNames(),mon:zu(U.mon),counters:cu(U.mon).counters}));
audit('E1');
U=bloodBoard({chain1:'成金ゴブリン', summon:'E・HERO エアーマン'});
stackTwo('sz',1);
drive();
ok('E2 ★ 同じ盤面で「時」の《E・HERO エアーマン》なら、自身の召喚誘発も相手の応答も逃す',
   JSON.stringify(dropNames())===JSON.stringify(BOTH_S493) && zu(U.ocean)==='deck',
   JSON.stringify({drops:dropNames(),ocean:zu(U.ocean)}));
missedTimingClauseKindS03=function(){return 'toki';};
U=bloodBoard({chain1:'成金ゴブリン', summon:'魔導戦士 ブレイカー'});
stackTwo('sz',1);
drive();
const e3a=dropNames();
MISSED_TIMING_CONFIRMED_S03['魔導戦士 ブレイカー']={ev:['onNormalSummon'],basis:'TEST',rulings:[]};
U=bloodBoard({chain1:'成金ゴブリン', summon:'魔導戦士 ブレイカー'});
stackTwo('sz',1);
drive();
ok('E3 ★ negative control: 文言の判定を外しても (B-5) の許可リストが止め、許可リストにも入れて初めて落ちる',
   JSON.stringify(e3a)===JSON.stringify(['奈落の落とし穴'])
   && JSON.stringify(dropNames())===JSON.stringify(['奈落の落とし穴','魔導戦士 ブレイカー'].sort())
   && !(((cu(U.mon)||{}).counters||{})['魔力']),
   JSON.stringify({first:e3a,second:dropNames(),counters:(cu(U.mon)||{}).counters}));
delete MISSED_TIMING_CONFIRMED_S03['魔導戦士 ブレイカー'];
missedTimingClauseKindS03=CLAUSEKIND_ORIG_S493;
MISSED_TIMING_CLASSES_S03.summonSuccess=false;
U=bloodBoard({chain1:'成金ゴブリン', summon:'E・HERO エアーマン'});
stackTwo('sz',1);
drive();
ok('E4 ★ negative control: 種別を切ると何も落ちず、《奈落の落とし穴》がエアーマンを除外する',
   MISSED_TIMING_DROPS_S03.length===0 && zu(U.mon)==='banish',
   JSON.stringify({drops:dropNames(),mon:zu(U.mon)}));
MISSED_TIMING_CLASSES_S03.summonSuccess=true;
ok('E5 ★ negative control: 刻みの無いイベントと、番号が同じイベントは判定しない',
   missedTimingDropS03({name:'奈落の落とし穴',eventName:'onNormalSummon'},{})===false
   && missedTimingDropS03({name:'奈落の落とし穴',eventName:'onNormalSummon'},{stepS03:(gameState.procStepS03|0)})===false,'');
U=bloodBoard({chain1:'成金ゴブリン', summon:'E・HERO エアーマン'});
stackTwo('sz',1);
drive();
ok('E6 ★ 判定は collectHandlers の 1 箇所だけ — 優先権・応答機会と召喚無効の窓には入っていない',
   /filterMissedTimingS03\(out, *evt\|\|\{\}\)/.test(String(COLLECT_ORIG_S493))
   && !/issedTiming/.test(String(POINT_ORIG_S493))
   && !/issedTiming/.test(String(CHAINRESP_ORIG_S493))
   && !/issedTiming/.test(String(NEGATORS_ORIG_S493)),'');
ok('E6 ★ 落とした後も p0 の POINT 窓には《血の代償》が応答候補として出る（一般のクイックエフェクトは不変）',
   PTS.some(x=>x.p===0&&(x.names||[]).indexOf('血の代償')>=0),
   JSON.stringify(PTS.map(x=>[x.kind,x.p,x.names])).slice(0,240));
`, {expect:9});

/* ===== F-1. 保存（ここで作った保存データを、次の harness ＝ 新しい VM に渡す） ===== */
const ctxF = harness(COMMON + String.raw`
const U=bloodBoard({chain1:'成金ゴブリン', summon:'魔導戦士 ブレイカー'});
const links=stackTwo('sz',1);
globalThis.__SAVED_S493=savedRaw();
globalThis.__AT_SAVE_S493=JSON.stringify({step:s(),
  defs:(gameState.deferredEvents||[]).length, chain:(gameState.chain||[]).length});
ok('F1 前提: チェーン2本を積んだ応答窓で保存できている',
   links===2 && !!globalThis.__SAVED_S493 && globalThis.__SAVED_S493.length>0,
   JSON.stringify({links,len:(globalThis.__SAVED_S493||'').length}));
drive();
globalThis.__WANT_S493=JSON.stringify({drops:dropNames(), step:s(), mon:zu(U.mon),
  counters:JSON.stringify((cu(U.mon)||{}).counters||{}), digest:v41StateDigest(gameState)});
ok('F1 前提: 保存なしの解決では「場合」が残り「時」だけが逃す',
   JSON.stringify(dropNames())===JSON.stringify(['奈落の落とし穴']) && zu(U.mon)==='mz',
   globalThis.__WANT_S493);
ok('F1 ★ 署名と回数は差分だけを見るので状態に入らない（保存データにも gameState にも出ない）',
   globalThis.__SAVED_S493.indexOf('MISSED_TIMING')<0
   && JSON.stringify(gameState).indexOf('MISSED_TIMING')<0
   && typeof gameState.procStepS03==='number','');
`, {expect:3});

/* ===== F-2. 新しい VM で再開して突き合わせる ===== */
harness('const SAVED=' + JSON.stringify(ctxF.__SAVED_S493 || '') + ';'
      + 'const WANT=' + JSON.stringify(ctxF.__WANT_S493 || '') + ';'
      + 'const AT_SAVE=' + JSON.stringify(ctxF.__AT_SAVE_S493 || '') + ';' + COMMON + String.raw`
const want=JSON.parse(WANT), atSave=JSON.parse(AT_SAVE);
const resumed=loadInto(SAVED);
const atResume={step:s(), defs:(gameState.deferredEvents||[]).length, chain:(gameState.chain||[]).length};
ok('F2 前提: 別の VM で保存データから再開でき、チェーン・番号・遅延イベントが保存時のまま戻っている',
   resumed!==false && atResume.chain===2 && atResume.chain===atSave.chain
   && atResume.step===atSave.step && atResume.defs===atSave.defs,
   JSON.stringify({resumed:!!resumed,atResume,atSave}));
drive();
const brk=(gameState.players[0].mz||[]).find(c=>c&&dbOf(c).n==='魔導戦士 ブレイカー');
const got={drops:dropNames(), step:s(), mon:brk?'mz':'gone',
  counters:JSON.stringify((brk&&brk.counters)||{}), digest:v41StateDigest(gameState)};
ok('F2 ★ 新しい VM での再開後の解決が、保存なしの解決と同じ落とし方・同じ番号・同じ最終 digest になる',
   JSON.stringify(got.drops)===JSON.stringify(want.drops) && got.step===want.step
   && got.mon===want.mon && got.counters===want.counters && got.digest===want.digest,
   JSON.stringify({want,got}));
audit('F2');
`, {expect:3});

/* ===== G. 未対応（正確に残す。本単位は「全体完成」ではない） ===== */
const DESIGN_S493 = rdS493('docs/S03_MISSED_TIMING_DESIGN.md');
const ENGINE_S493 = rdS493('engine/1ZZX_missed_timing_s03.js');
harness('const DOC=' + JSON.stringify(DESIGN_S493) + ';const ENG=' + JSON.stringify(ENGINE_S493) + ';'
      + COMMON + String.raw`
ok('G1 ★ 「リバースした時」のリバース効果は種別から外れた（R8、S03-U494）— 反転召喚でも効果で表側でも落とさない',
   MISSED_TIMING_CLASSES_S03.flipSummonReverse===false
   && missedTimingClassS03({name:'スノーマンイーター',eventName:'onFlip'},{flipSummon:true})===null
   && missedTimingClassS03({name:'スノーマンイーター',eventName:'onFlip'},{})===null
   && /WIKI-B2BFD8FD6AFC/.test(ENG) && /WIKI-B2BFD8FD6AFC/.test(DOC),'');
fresh();
gameState.players[0].hand=[mk('ワイト',0)];
gameState.players[0].sz=[mk('聖なる輝き',0,'up')];
baselineA();
doNormalSummon(0,'def');
/* S03-U503 で文言を事実に合わせた（assertion はそのまま）:
   通常召喚の表示形式は選べない（doNormalSummon の pos は使われない）。
   表側守備表示になるのは《聖なる輝き》がある状態の「セット」だけで、そちらは S03-U503 で入れた
   （WIKI-0B439F71B94A の場面は tools/test_s03_u503_* が固定している）。 */
ok('G2 ★ 通常召喚で表示形式は選べない（pos は使われず常に攻撃表示）。表側守備表示は S03-U503 の「セット」経路だけ',
   (gameState.players[0].mz[0]||{}).pos==='atk' && /WIKI-0B439F71B94A/.test(DOC) && /聖なる輝き/.test(DOC),
   JSON.stringify({pos:(gameState.players[0].mz[0]||{}).pos}));
ok('G3 ★ 設計書に、許可リストと署名の取りこぼしが「逃さない」側に落ちることが書かれている',
   /逃さない/.test(DOC) && /許可リスト/.test(DOC) && /安全/.test(DOC),'');
ok('G4 ★ 設計書に、テキストの時代混在という限界と、その食い違いが落ちる向きが書かれている',
   /時代/.test(DOC) && /carddata\.json/.test(DOC) && /2011-11/.test(DOC),'');
ok('G5 ★ 設計書に、召喚無効（WIKI-2CF23AA42E79）が本単位の対象外であることが書かれている',
   /WIKI-2CF23AA42E79/.test(DOC) && /SUMMON_WINDOW/.test(DOC),'');
ok('G6 ★ 設計書の段階表に S03-U493 の完了分と未対応が分けて書かれている',
   /S03-U493/.test(DOC) && /未対応/.test(DOC),'');
`, {expect:6});
