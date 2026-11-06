/* S03-U516: シンクロモンスターの未実装カード 2 枚（カード実装）。

   《ジュラック・メテオ》（NOT_STARTED・星10）
     このカードがシンクロ召喚に成功した時、フィールド上のカードを全て破壊する。
     その後、自分の墓地からチューナー1体を選んで特殊召喚できる。
   《フルール・ド・シュヴァリエ》（NOT_STARTED・星8）
     相手が魔法・罠カードを発動した時に発動する事ができる。その発動を無効にし破壊する。
     この効果は自分のターンに1度だけ発動する事ができる。

   当時裁定（**回答日つき**）
     `WIKI-1D6EA9DA49CF`（**2009-10-08**）《ジュラック・メテオ》は誘発効果。
     `WIKI-9FD0A5460B4A`（**2009-10-08**）破壊とチューナーの特殊召喚は**一連の 1 つの効果**で、
       「破壊を行った後に特殊召喚する処理になり同時ではありません」。
     `WIKI-DA5BD8451F54`（**2009-10-08**）特殊召喚するかどうかは**破壊の処理の後**に決め、
       その時に墓地のチューナーを選ぶ。
     `WIKI-0B6B75AF1BCD`（**2009-10-06**）墓地のチューナーは**対象を取らない**。
     `WIKI-F702CAEB190D`（**2010-09-16**）《フルール・ド・シュヴァリエ》は誘発即時効果。
     `WIKI-59AEA6994319`（**2010-09-16**）既に表側表示の魔法・罠の**効果の発動**は無効にできない。
     `WIKI-7F34FA9E9AB1`（**2010-09-16**）**カウンター罠**は無効にできない。
     `WIKI-2A95D67D1831`（**2010-09-16**）墓地で発動する効果も無効にできない。
     `WIKI-DBFFE8DBCE38` / `WIKI-4341E0D0F339`（**2010-09-16**）ダメージステップ中・ダメージ計算時も発動できる。
     `WIKI-EE8628654118`（**2010-09-19**）「自分のターンに1度だけ」は**1 ターンに 1 度**の意味。

   固定するもの:
     A 形
     B ジュラック・メテオ（全破壊 → その後にチューナーを選ぶ・negative control）
     C フルール・ド・シュヴァリエ（無効にし破壊・カウンター罠・1ターンに1度・自分の発動）
     D Replay 監査
     E 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S516 = pathA.resolve(__dirname, '..');
const rdS516 = p => fsA.readFileSync(pathA.join(ROOT_S516, p), 'utf8');
const SRC_S516 = {
  'cards/HZZZZZZZZZZZZ_claude_s03_u516_synchro.js': rdS516('cards/HZZZZZZZZZZZZ_claude_s03_u516_synchro.js'),
  'docs/S03_U516_REPORT.md': rdS516('docs/S03_U516_REPORT.md'),
  'tools/check.py': rdS516('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
let OFFERS=[], PREFER=[];
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;OFFERS=[];PREFER=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function choiceNames(){const q=pc();return q?((q.candidates||[]).map(x=>x&&(x.label||(x.card?cardName(x.card):x.key)))):null;}
function pickPreferred(){const q=pc();if(!q)return false;
  let j=-1;
  for(let k=0;k<PREFER.length;k++){
    j=(q.candidates||[]).findIndex(x=>x&&((x.uid!=null&&x.uid===PREFER[k])||x.key===PREFER[k]));
    if(j>=0){PREFER.splice(k,1);break;}}
  __choicePickV49(j>=0?j:0);return true;}
/* respondWith に積んだ名前のチェーン応答を 1 度だけ実際に発動する */
let RESPOND_WITH=[];
function driveS516(){
  for(let i=0;i<900;i++){
    if(pickPreferred())continue;
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){
      const pr=gameState.chainWindow.priority;
      let resp=[]; try{ resp=getChainResponsesV2(pr)||[]; }catch(e){ resp=[]; }
      OFFERS.push({pr:pr, names:resp.map(r=>cardName(r.card))});
      const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
      if(want){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(want.card)),1);
        duelActivateResponseV2(pr, want.zone, want.index, want.ownerS03); continue; }
      chainPassV2(); continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
/* シンクロ召喚の成功だけを実経路の形で起こす（素材を揃える手順はこのカードの効果ではない） */
function synchroArriveS516(card){
  const h=findCardByUid(card.uid);
  act({type:'FX_SPECIAL_SUMMON',player:0,from:h.zone,fromIndex:h.index,pos:'atk',reason:'シンクロ召喚',summonKind:'synchro'});
  const now=findCardByUid(card.uid);
  if(now && now.zone==='mz')
    queueDeferredEventV2('onSpecialSummon',{player:0,name:cardName(now.card),uid:card.uid,card:now.card,kind:'synchro'});
  return driveS516();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 2 枚が登録され、裁定どおりの分類になっている'
   +'（メテオは誘発効果・シュヴァリエは誘発即時効果で 1 ターンに 1 度）',
   !!CARD_SCRIPTS['ジュラック・メテオ'] && !!CARD_SCRIPTS['フルール・ド・シュヴァリエ']
   && CARD_SCRIPTS['フルール・ド・シュヴァリエ'].quickEffect===true
   && CARD_SCRIPTS['フルール・ド・シュヴァリエ'].countLimit===1
   && activationResponseDeclaredS03('フルール・ド・シュヴァリエ')===true,
   JSON.stringify({quick:CARD_SCRIPTS['フルール・ド・シュヴァリエ'].quickEffect,
     limit:CARD_SCRIPTS['フルール・ド・シュヴァリエ'].countLimit}));
ok('A2 ★ シュヴァリエはダメージステップでも発動できる宣言になっている（WIKI-DBFFE8DBCE38 10/09/16）',
   (CARD_SCRIPTS['フルール・ド・シュヴァリエ'].timing||[]).indexOf('damageStep')>=0,
   JSON.stringify(CARD_SCRIPTS['フルール・ド・シュヴァリエ'].timing));
`, {expect:2});

/* ===== B. ジュラック・メテオ ===== */
harness(COMMON + String.raw`
fresh();
const meteor=mk('ジュラック・メテオ',0);
gameState.players[0].ex=[meteor];
const myMon=mk('ワイト',0,'up');
const foeMon=mk('デーモンの召喚',1,'up');
const foeSt=mk('聖なるバリア －ミラーフォース－',1,'down');
gameState.players[0].mz=[myMon];
gameState.players[1].mz=[foeMon];
gameState.players[1].sz=[foeSt];
const tuner=mk('ジャンク・シンクロン',0);
gameState.players[0].grave=[tuner];
baselineA();
const tr=synchroArriveS516(meteor);
ok('B1 ★ シンクロ召喚成功時にフィールドのカードを全て破壊し（自身も含む）、'
   +'その後に墓地のチューナーを特殊召喚できる',
   tr==='idle' && zu(meteor.uid)==='grave' && zu(myMon.uid)==='grave'
   && zu(foeMon.uid)==='grave' && zu(foeSt.uid)==='grave'
   && zu(tuner.uid)==='mz',
   JSON.stringify({meteor:zu(meteor.uid),myMon:zu(myMon.uid),foeMon:zu(foeMon.uid),
     foeSt:zu(foeSt.uid),tuner:zu(tuner.uid)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-DA5BD8451F54（10/08）: 特殊召喚するかどうかは**破壊の処理の後**に決める。
   その帰結として、全体破壊で墓地へ落ちた自分のチューナーも候補になる。 */
const meteor=mk('ジュラック・メテオ',0);
gameState.players[0].ex=[meteor];
const fieldTuner=mk('ジャンク・シンクロン',0,'up');   /* 場にいるチューナー。破壊されて墓地へ */
gameState.players[0].mz=[fieldTuner];
gameState.players[0].grave=[];
baselineA();
PREFER=[fieldTuner.uid];
const tr=synchroArriveS516(meteor);
ok('B2 ★ 当時裁定 WIKI-DA5BD8451F54（09/10/08）: 破壊の後に決めるので、'
   +'全体破壊で墓地へ落ちたチューナーも特殊召喚できる',
   tr==='idle' && zu(meteor.uid)==='grave' && zu(fieldTuner.uid)==='mz',
   JSON.stringify({meteor:zu(meteor.uid),tuner:zu(fieldTuner.uid)}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 墓地にチューナーがいなければ特殊召喚は起きない（全破壊だけ起きる） */
const meteor=mk('ジュラック・メテオ',0);
gameState.players[0].ex=[meteor];
const myMon=mk('ワイト',0,'up');
gameState.players[0].mz=[myMon];
gameState.players[0].grave=[];
baselineA();
const tr=synchroArriveS516(meteor);
ok('B3 ★ negative control: 墓地にチューナーがいなければ特殊召喚は起きない',
   tr==='idle' && zu(meteor.uid)==='grave' && zu(myMon.uid)==='grave'
   && gameState.players[0].mz.length===0,
   JSON.stringify({mz0:gameState.players[0].mz.map(c=>cardName(c))}));
`, {expect:1});

/* ===== C. フルール・ド・シュヴァリエ ===== */
harness(COMMON + String.raw`
fresh();
const chev=mk('フルール・ド・シュヴァリエ',0,'up');
gameState.players[0].mz=[chev];
const target=mk('血の代償',0,'up');
gameState.players[0].sz=[target];
const spell=mk('サイクロン',1);
gameState.players[1].hand=[spell];
gameState.activePlayer=1;
baselineA();
RESPOND_WITH=['フルール・ド・シュヴァリエ'];
duelActivateFromHand(0);
const tr=driveS516();
ok('C1 ★ 相手の魔法カードの発動を無効にし破壊する（対象の《血の代償》は残る）',
   tr==='idle' && zu(spell.uid)==='grave' && zu(target.uid)==='sz'
   && OFFERS.some(o=>o.names.indexOf('フルール・ド・シュヴァリエ')>=0),
   JSON.stringify({spell:zu(spell.uid),target:zu(target.uid),offers:OFFERS}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* 当時裁定 WIKI-7F34FA9E9AB1（10/09/16）: カウンター罠は無効にできない。
   自分の《サイクロン》に相手が《神の宣告》をチェーンした場面で、候補に出ないことを見る。 */
const chev=mk('フルール・ド・シュヴァリエ',0,'up');
gameState.players[0].mz=[chev];
const ct=mk('神の宣告',1,'down'); ct.setTurn=gameState.turn-1;
gameState.players[1].sz=[ct];
gameState.players[0].hand=[mk('サイクロン',0)];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
RESPOND_WITH=['神の宣告','フルール・ド・シュヴァリエ'];
duelActivateFromHand(0);
const tr=driveS516();
const offeredToMe=OFFERS.filter(o=>o.pr===0).map(o=>o.names);
ok('C2 ★ 当時裁定 WIKI-7F34FA9E9AB1（10/09/16）: カウンター罠には応答できない（候補に出ない）',
   tr==='idle' && offeredToMe.every(ns=>ns.indexOf('フルール・ド・シュヴァリエ')<0),
   JSON.stringify({offers:OFFERS}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* 当時裁定 WIKI-EE8628654118（10/09/19）: 「自分のターンに1度だけ」は 1 ターンに 1 度。
   2 枚目の魔法には応答できない。 */
const chev=mk('フルール・ド・シュヴァリエ',0,'up');
gameState.players[0].mz=[chev];
gameState.players[0].sz=[mk('血の代償',0,'up')];
gameState.players[1].hand=[mk('サイクロン',1),mk('サイクロン',1)];
gameState.activePlayer=1;
baselineA();
RESPOND_WITH=['フルール・ド・シュヴァリエ'];
duelActivateFromHand(0);
driveS516();
OFFERS=[];
duelActivateFromHand(0);
const tr=driveS516();
ok('C3 ★ 1 ターンに 1 度なので、2 枚目の魔法には応答できない',
   tr==='idle' && OFFERS.filter(o=>o.pr===0).every(o=>o.names.indexOf('フルール・ド・シュヴァリエ')<0),
   JSON.stringify({offers:OFFERS,sz0:gameState.players[0].sz.map(c=>cardName(c))}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* negative control: 自分が発動した魔法には応答しない（「相手が」発動した時） */
const chev=mk('フルール・ド・シュヴァリエ',0,'up');
gameState.players[0].mz=[chev];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[1].sz=[mk('血の代償',1,'up')];
gameState.players[0].hand=[mk('サイクロン',0)];
baselineA();
duelActivateFromHand(0);
const tr=driveS516();
ok('C4 ★ negative control: 自分が発動した魔法には応答しない',
   tr==='idle' && OFFERS.every(o=>o.names.indexOf('フルール・ド・シュヴァリエ')<0),
   JSON.stringify({offers:OFFERS}));
`, {expect:1});

/* ===== E. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S516) + ';' + String.raw`
const REP=S['docs/S03_U516_REPORT.md'], CHK=S['tools/check.py'],
      CARD=S['cards/HZZZZZZZZZZZZ_claude_s03_u516_synchro.js'];
ok('E1 ★ 報告書に、実装した効果と未対応の範囲が分けて書かれている',
   REP.indexOf('実装した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('ジュラック・メテオ')>=0 && REP.indexOf('フルール・ド・シュヴァリエ')>=0,'');
ok('E2 ★ カードの中に当時裁定の ID が引かれている',
   ['WIKI-9FD0A5460B4A','WIKI-DA5BD8451F54','WIKI-0B6B75AF1BCD','WIKI-7F34FA9E9AB1',
    'WIKI-EE8628654118'].every(id=>CARD.indexOf(id)>=0),'');
ok('E3 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u516_synchro.js')>=0,'');
`, {expect:3});
