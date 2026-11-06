/* S03-U523: 忘却の海底神殿（カード実装）と、「海」として扱われるカードの共通の探索（engine/1ZZZB）。

   《忘却の海底神殿》（NOT_STARTED・永続罠）
     このカードがフィールド上に存在する限り、このカードのカード名は「海」として扱う。
     1ターンに1度、自分フィールド上のレベル4以下の魚族・海竜族・水族モンスター1体を選択してゲームから除外できる。
     自分のエンドフェイズ時、この効果で除外したモンスターを特殊召喚する。

   当時裁定（回答日つき）
     WIKI-CAD8E3C2E5FD（2009-11-14）「《海》をコストにする効果」のコストに使用できる。
     WIKI-C8A821DF0FA0（2009-11-14）《王宮のお触れ》発動中はコストにできない。
     WIKI-ECF09EA16413（2009-12-11）セットされた状態ではコストにできない。
     WIKI-17D54319001D（2009-11-14）除外する効果は相手ターンにも発動でき、スペルスピードは2。
     WIKI-C1C1FCE76FDE（2009-11-14）除外する効果はダメージステップ中には発動できない。
     WIKI-9579091639BA（2009-11-14）このカードがフィールドを離れていた場合は特殊召喚できない。
     WIKI-B0409A61B7FF（2009-11-21）相手フィールドへ特殊召喚する事はできない。
     WIKI-F21786650DE6（2010-08-05）相手ターンと自分ターンに除外した 2 体は同時に特殊召喚される。
     WIKI-D46C2788D09D（2009-12-16）《伝説の都 アトランティス》と両方ある場合はどちらか 1 枚だけ送ればよい。

   固定するもの:
     A 形（登録・名前の扱い・セット中・無効化中）
     B 「海」をコストにする効果（海竜－ダイダロス）から見える
     C 除外する効果（自分ターン・相手ターン・1ターンに1度・ダメージステップ不可）
     D エンドフェイズの特殊召喚（2 体同時・自分フィールド・場を離れていたら不可）
     E Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S523 = pathA.resolve(__dirname, '..');
const rdS523 = p => fsA.readFileSync(pathA.join(ROOT_S523, p), 'utf8');
const SRC_S523 = {
  'cards/HZZZZZZZZZZZZG_claude_s03_u523_forgotten_temple.js': rdS523('cards/HZZZZZZZZZZZZG_claude_s03_u523_forgotten_temple.js'),
  'engine/1ZZZB_sea_name_s03.js': rdS523('engine/1ZZZB_sea_name_s03.js'),
  'docs/S03_U523_REPORT.md': rdS523('docs/S03_U523_REPORT.md'),
  'tools/check.py': rdS523('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
function pick(){
  const q=pc(); let j=-1; TITLES.push(String(q.title||''));
  for(const want of PREFER){
    j=(q.candidates||[]).findIndex(x=>x && (x.uid===want || x.key===want || x.value===want || x.label===want));
    if(j>=0) break;
  }
  __choicePickV49(j>=0?j:0);
}
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=0;return c;}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function banishNames(p){return (gameState.players[p].banish||[]).map(nmOf);}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形と名前の扱い ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、スペルスピード2の誘発即時として 1ターンに1度の除外効果を宣言している'
   +'（WIKI-17D54319001D 09/11/14）',
   !!CARD_SCRIPTS['忘却の海底神殿']
   && CARD_SCRIPTS['忘却の海底神殿'].quickEffect===true
   && CARD_SCRIPTS['忘却の海底神殿'].countLimit && CARD_SCRIPTS['忘却の海底神殿'].countLimit.n===1
   && (CARD_SCRIPTS['忘却の海底神殿'].countLimit.effects||[]).indexOf('banish')>=0
   && !CARD_SCRIPTS['忘却の海底神殿'].damageStepLegal && !CARD_SCRIPTS['忘却の海底神殿'].damageStepOnly
   && ZONE_LOCAL_KEYS.indexOf('u523TempleUidsS03')>=0,
   JSON.stringify({cl:CARD_SCRIPTS['忘却の海底神殿'].countLimit}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* WIKI-ECF09EA16413（09/12/11）: セット中は「海」として扱われない。表側表示なら扱われる。 */
const setTemple=setc('忘却の海底神殿',0);
gameState.players[0].sz=[setTemple];
baselineA();
const whileSet=seaCardsOnFieldS03(0).length;
const t1=useCard(0,setTemple);   /* カードの発動（効果は無い） */
const faceUp=seaCardsOnFieldS03(0).length;
ok('A2 ★ WIKI-ECF09EA16413（09/12/11）: セット中は「海」として扱われず、発動して表側になると扱われる',
   t1==='idle' && whileSet===0 && faceUp===1
   && currentNameV17(findCardByUid(setTemple.uid).card)==='海',
   JSON.stringify({whileSet:whileSet,faceUp:faceUp,toasts:TOASTS.slice(0,2)}));
audit('A2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-C8A821DF0FA0（09/11/14）: 《王宮のお触れ》発動中は「海」として扱う効果が無効になる。 */
const temple=mk('忘却の海底神殿',0,'up');
gameState.players[0].sz=[temple,mk('王宮のお触れ',0,'up')];
baselineA();
ok('A3 ★ WIKI-C8A821DF0FA0（09/11/14）: 罠の効果が無効になっている間は「海」として扱われない',
   seaCardsOnFieldS03(0).length===0 && seaOnFieldS03()===false,
   JSON.stringify({sea:seaCardsOnFieldS03(0).length,
     name:currentNameV17(findCardByUid(temple.uid).card)}));
`, {expect:1});

/* ===== B. 「海」をコストにする効果から見える ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-CAD8E3C2E5FD（09/11/14）: 《海竜－ダイダロス》のコスト（フィールドの「海」を墓地へ送る）に使える。 */
const temple=mk('忘却の海底神殿',0,'up');
gameState.players[0].sz=[temple];
const dai=mk('海竜－ダイダロス',0,'up');
gameState.players[0].mz=[dai];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
baselineA();
const t1=useCard(0,dai);
ok('B1 ★ WIKI-CAD8E3C2E5FD（09/11/14）: 魔法＆罠ゾーンの《忘却の海底神殿》を「海」として墓地へ送り、'
   +'《海竜－ダイダロス》の効果を発動できる',
   t1==='idle' && zu(temple.uid)==='grave' && zu(foe.uid)==='grave',
   JSON.stringify({temple:zu(temple.uid),foe:zu(foe.uid),grave:graveNames(0),toasts:TOASTS.slice(0,2)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 《王宮のお触れ》で「海」として扱われない間は、ダイダロスのコストにできず発動できない。 */
const temple=mk('忘却の海底神殿',0,'up');
gameState.players[0].sz=[temple,mk('王宮のお触れ',0,'up')];
const dai=mk('海竜－ダイダロス',0,'up');
gameState.players[0].mz=[dai];
baselineA();
const t1=useCard(0,dai);
ok('B2 ★ negative control: 「海」として扱われない間は《海竜－ダイダロス》を発動できない',
   t1==='idle' && zu(temple.uid)==='sz' && zu(dai.uid)==='mz',
   JSON.stringify({temple:zu(temple.uid),dai:zu(dai.uid),toasts:TOASTS.slice(0,2)}));
`, {expect:1});

/* ===== C. 除外する効果 ===== */
harness(COMMON + String.raw`
fresh();
/* 自分ターンに 1 回、1ターンに1度。 */
const temple=mk('忘却の海底神殿',0,'up');
gameState.players[0].sz=[temple];
const frog=mk('マーメイド・ナイト',0,'up');
const frog2=mk('マーメイド・ナイト',0,'up');
gameState.players[0].mz=[frog,frog2];
baselineA();
PREFER=[frog.uid];
const t1=useCard(0,temple);
PREFER=[frog2.uid];
const t2=useCard(0,temple);
ok('C1 ★ レベル4以下の水族（マーメイド・ナイト）を除外でき、1ターンに1度なので 2 回目は発動できない',
   t1==='idle' && t2==='idle' && zu(frog.uid)==='banish' && zu(frog2.uid)==='mz',
   JSON.stringify({frog:zu(frog.uid),frog2:zu(frog2.uid),banish:banishNames(0),toasts:TOASTS.slice(0,2)}));
audit('C1');
`, {expect:2});

/* ===== D. エンドフェイズの特殊召喚 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-17D54319001D（09/11/14）相手ターンにも発動できる。
   WIKI-F21786650DE6（10/08/05）相手ターンと自分ターンの 2 体は同時に特殊召喚される。
   WIKI-B0409A61B7FF（09/11/21）出す先は自分フィールド。 */
const temple=mk('忘却の海底神殿',0,'up');
gameState.players[0].sz=[temple];
const frogA=mk('マーメイド・ナイト',0,'up');
const frogB=mk('マーメイド・ナイト',0,'up');
gameState.players[0].mz=[frogA,frogB];
baselineA();
phase('end');turn();phase('standby');phase('main1');   /* 相手のターン */
PREFER=[frogA.uid];
const tFoe=useCard(0,temple);
phase('end');turn();phase('standby');phase('main1');   /* 自分のターン */
PREFER=[frogB.uid];
const tMine=useCard(0,temple);
const bothBanished=zu(frogA.uid)==='banish' && zu(frogB.uid)==='banish';
const tEnd=phase('end');
ok('D1 ★ 相手ターンにも発動でき、自分のエンドフェイズに 2 体が同時に自分フィールドへ特殊召喚される',
   tFoe==='idle' && tMine==='idle' && tEnd==='idle' && bothBanished
   && zu(frogA.uid)==='mz' && zu(frogB.uid)==='mz'
   && (gameState.players[1].mz||[]).length===0,
   JSON.stringify({both:bothBanished,a:zu(frogA.uid),b:zu(frogB.uid),mz0:mzNames(0),mz1:mzNames(1)}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-9579091639BA（09/11/14）: このカードがフィールドを離れていた場合は特殊召喚できない。 */
const temple=mk('忘却の海底神殿',0,'up');
gameState.players[0].sz=[temple];
const frog=mk('マーメイド・ナイト',0,'up');
gameState.players[0].mz=[frog];
gameState.players[0].hand=[mk('サイクロン',0)];
baselineA();
PREFER=[frog.uid];
const t1=useCard(0,temple);
PREFER=[temple.uid];
duelActivateFromHand(0);   /* 自分の《サイクロン》で自分の海底神殿を破壊する */
const t2=drive();
const tEnd=phase('end');
ok('D2 ★ WIKI-9579091639BA（09/11/14）: このカードが場を離れていると、エンドフェイズに特殊召喚されない',
   t1==='idle' && t2==='idle' && tEnd==='idle'
   && zu(temple.uid)==='grave' && zu(frog.uid)==='banish',
   JSON.stringify({temple:zu(temple.uid),frog:zu(frog.uid),mz:mzNames(0)}));
audit('D2');
`, {expect:2});

/* ===== E. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S523['cards/HZZZZZZZZZZZZG_claude_s03_u523_forgotten_temple.js'];
const engSrc = SRC_S523['engine/1ZZZB_sea_name_s03.js'];
const doc = SRC_S523['docs/S03_U523_REPORT.md'];
okJs('E1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-CAD8E3C2E5FD', 'WIKI-C8A821DF0FA0', 'WIKI-ECF09EA16413', 'WIKI-17D54319001D',
   'WIKI-C1C1FCE76FDE', 'WIKI-9579091639BA', 'WIKI-B0409A61B7FF', 'WIKI-F21786650DE6',
   'WIKI-D46C2788D09D'].every(id => cardSrc.indexOf(id) >= 0));
okJs('E2 ★ 共通の「海」探索は、なぜ 1 つにまとめたのかを裁定 ID つきで書いている',
  engSrc.indexOf('WIKI-CAD8E3C2E5FD') >= 0 && engSrc.indexOf('WIKI-C8A821DF0FA0') >= 0
  && engSrc.indexOf('function seaCardsOnFieldS03') >= 0);
okJs('E3 ★ 未対応（《大寒波》の封じの範囲）が根拠つきで書かれている',
  cardSrc.indexOf('WIKI-6CC4BF7CF2FB') >= 0 && doc.indexOf('大寒波') >= 0);
okJs('E4 ★ このテストが tools/check.py に登録されている',
  SRC_S523['tools/check.py'].indexOf('test_s03_u523_forgotten_temple.js') >= 0);
