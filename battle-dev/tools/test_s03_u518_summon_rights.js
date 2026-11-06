/* S03-U518: 召喚の権利・特殊召喚の未実装カード 3 枚（カード実装）。

   《決戦の火蓋》（NOT_STARTED・永続罠）
     自分の墓地のモンスターカード1枚をゲームから除外する事で、手札から通常モンスター1体を通常召喚する事ができる。
     この効果は自分ターンのメインフェイズ時にのみ発動する事ができる。
   《デビル・フランケン》（NOT_STARTED・星2）
     ①:5000LPを払って発動できる。エクストラデッキから融合モンスター1体を攻撃表示で特殊召喚する。
   《クルセイダー・オブ・エンディミオン》（NOT_STARTED・星4・デュアル）
     もう1度召喚した後、1ターンに1度、フィールドの魔力カウンターを置く事ができるカード1枚を対象として発動でき、
     そのカードに魔力カウンターを1つ置き、このカードの攻撃力はターン終了時まで600アップする。

   当時裁定（回答日つき）
     WIKI-55C383C128FC（2007-12-10）決戦の火蓋は《血の代償》と同様にチェーンブロックを作る。
     WIKI-38EC2882E2E0（2008-01-18）除外はコスト。
     WIKI-2AB690FE02B1（2007-12-10）1ターンに複数回発動できる。
     WIKI-1330B937F075（回答日なし）上級モンスターの通常召喚にはリリースが必要。
     WIKI-F0C82F8C96D2（2010-12-17）クルセイダーの魔力カウンターは対象を取る起動効果。
     WIKI-7924775F83D7（2010-12-17）数値アップ後に《スキルドレイン》を発動すると上昇数値は失われる。
     デビル・フランケンは wiki-rulings.js / rulings-data.js の**どちらにも当時の裁定が無い**（0 件）。

   固定するもの:
     A 形
     B 決戦の火蓋（除外コスト・通常召喚権を使わない・複数回・上級はリリース・negative control 3 件）
     C デビル・フランケン（5000LP・融合モンスターが攻撃表示で出る・正規の特殊召喚ではない・negative control 2 件）
     D クルセイダー（もう1度召喚が前提・カウンターと 600 アップ・スキルドレインで失われる・1ターンに1度）
     E Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S518 = pathA.resolve(__dirname, '..');
const rdS518 = p => fsA.readFileSync(pathA.join(ROOT_S518, p), 'utf8');
const SRC_S518 = {
  'cards/HZZZZZZZZZZZZB_claude_s03_u518_summon_rights.js': rdS518('cards/HZZZZZZZZZZZZB_claude_s03_u518_summon_rights.js'),
  'cards/00_generic_core.js': rdS518('cards/00_generic_core.js'),
  'docs/S03_U518_REPORT.md': rdS518('docs/S03_U518_REPORT.md'),
  'tools/check.py': rdS518('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=(q.candidates||[]).findIndex(x=>x&&x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
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
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function handNames(p){return (gameState.players[p].hand||[]).map(nmOf);}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function banishNames(p){return (gameState.players[p].banish||[]).map(nmOf);}
function actOfCard(p,c){const h=findCardByUid(c.uid);return h?getLegalZoneActions(p,h.zone,h.index).map(a=>a.id):[];}
function fieldUse(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function gemini(p,c){const h=findCardByUid(c.uid);doGeminiSummonS03(p,h.zone,h.index);return drive();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 3 枚が登録され、分類どおりの宣言になっている'
   +'（火蓋は場で発動する永続罠で回数制限なし / フランケンは起動効果で特殊召喚が目的 / クルセイダーは1ターンに1度の対象を取る効果）',
   CARD_SCRIPTS['決戦の火蓋'] && CARD_SCRIPTS['決戦の火蓋'].fieldIgnition===true
   && CARD_SCRIPTS['決戦の火蓋'].countLimit==null
   && CARD_SCRIPTS['デビル・フランケン'] && CARD_SCRIPTS['デビル・フランケン'].blocksIfNoSpecialSummon===true
   && CARD_SCRIPTS['クルセイダー・オブ・エンディミオン']
   && CARD_SCRIPTS['クルセイダー・オブ・エンディミオン'].countLimit===1
   && CARD_SCRIPTS['クルセイダー・オブ・エンディミオン'].targets===true,
   JSON.stringify({fuse:!!CARD_SCRIPTS['決戦の火蓋'],fr:!!CARD_SCRIPTS['デビル・フランケン'],
     cr:CARD_SCRIPTS['クルセイダー・オブ・エンディミオン'].countLimit}));
ok('A2 ★ クルセイダーはデュアルで、もう1度召喚されるまで効果を使えない宣言になっている（S03-U119 の共通機構）',
   isGeminiS03(mk('クルセイダー・オブ・エンディミオン',0))===true
   && ZONE_LOCAL_KEYS.indexOf('u518CrusaderBoostS03')>=0,
   JSON.stringify({gemini:isGeminiS03(mk('クルセイダー・オブ・エンディミオン',0))}));
`, {expect:2});

/* ===== B. 決戦の火蓋 ===== */
harness(COMMON + String.raw`
fresh();
/* 墓地のモンスター1枚を除外して、手札の通常モンスターを通常召喚する。通常召喚権は使わない。 */
const fuse=mk('決戦の火蓋',0,'up');
gameState.players[0].sz=[fuse];
const fodder=mk('ワイト',0);
gameState.players[0].grave=[fodder];
const w=mk('ワイト',0);
gameState.players[0].hand=[w];
baselineA();
const tr=fieldUse(0,fuse);
ok('B1 ★ 墓地のモンスターを除外（コスト）して手札の通常モンスターが通常召喚され、通常召喚権は残る',
   tr==='idle' && zu(fodder.uid)==='banish' && zu(w.uid)==='mz'
   && gameState.players[0].normalSummonUsed===false,
   JSON.stringify({fodder:zu(fodder.uid),w:zu(w.uid),ns:gameState.players[0].normalSummonUsed,mz:mzNames(0)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-2AB690FE02B1（07/12/10）: 1ターンに複数回発動できる。 */
const fuse=mk('決戦の火蓋',0,'up');
gameState.players[0].sz=[fuse];
gameState.players[0].grave=[mk('ワイト',0),mk('ワイト',0)];
gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0)];
baselineA();
const t1=fieldUse(0,fuse), n1=(gameState.players[0].mz||[]).length;
const t2=fieldUse(0,fuse), n2=(gameState.players[0].mz||[]).length;
ok('B2 ★ WIKI-2AB690FE02B1（07/12/10）: 同じターンに 2 回発動でき、2 体が通常召喚される',
   t1==='idle' && t2==='idle' && n1===1 && n2===2
   && (gameState.players[0].banish||[]).length===2
   && gameState.players[0].normalSummonUsed===false,
   JSON.stringify({n:[n1,n2],banish:banishNames(0),ns:gameState.players[0].normalSummonUsed}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-1330B937F075: 上級モンスターの通常召喚にはリリースが必要。 */
const fuse=mk('決戦の火蓋',0,'up');
gameState.players[0].sz=[fuse];
gameState.players[0].grave=[mk('ワイト',0)];
const tribute=mk('ワイト',0,'up');
gameState.players[0].mz=[tribute];
const curse=mk('カース・オブ・ドラゴン',0);
gameState.players[0].hand=[curse];
baselineA();
const tr=fieldUse(0,fuse);
ok('B3 ★ WIKI-1330B937F075: 星5の通常モンスターはリリース1体を払って通常召喚される',
   tr==='idle' && zu(curse.uid)==='mz' && zu(tribute.uid)==='grave'
   && mzNames(0).join(',')==='カース・オブ・ドラゴン',
   JSON.stringify({curse:zu(curse.uid),tribute:zu(tribute.uid),mz:mzNames(0)}));
audit('B3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control 1: リリースできるモンスターがいない星5は、そもそも発動できない。 */
const fuse=mk('決戦の火蓋',0,'up');
gameState.players[0].sz=[fuse];
gameState.players[0].grave=[mk('ワイト',0)];
const curse=mk('カース・オブ・ドラゴン',0);
gameState.players[0].hand=[curse];
baselineA();
const acts=actOfCard(0,fuse);
const tr=fieldUse(0,fuse);
ok('B4 ★ negative control: リリースを払えない星5だけが手札にある時は発動できない',
   tr==='idle' && zu(curse.uid)==='hand' && (gameState.players[0].banish||[]).length===0,
   JSON.stringify({curse:zu(curse.uid),acts:acts,toasts:TOASTS.slice(0,2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* negative control 2: 墓地にモンスターがいない。negative control 3: 相手のターン。 */
const fuse=mk('決戦の火蓋',0,'up');
gameState.players[0].sz=[fuse];
gameState.players[0].grave=[];
gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
const t1=fieldUse(0,fuse);
const emptyGrave=(gameState.players[0].mz||[]).length===0;
gameState.players[0].grave=[mk('ワイト',0)];
gameState.phase='end';
requestProcessorV27(PROCESSOR_V27.TURN);
drive();
TOASTS.length=0;
const t2=fieldUse(0,fuse);
ok('B5 ★ negative control: 墓地にモンスターがいない時と、自分のメインフェイズでない時は発動できない',
   t1==='idle' && t2==='idle' && emptyGrave
   && (gameState.players[0].mz||[]).length===0 && gameState.activePlayer===1,
   JSON.stringify({emptyGrave:emptyGrave,mz:mzNames(0),ap:gameState.activePlayer,toasts:TOASTS.slice(0,2)}));
`, {expect:1});

/* ===== C. デビル・フランケン ===== */
harness(COMMON + String.raw`
fresh();
const fr=mk('デビル・フランケン',0,'up');
gameState.players[0].mz=[fr];
const fus=mk('サウザンド・アイズ・サクリファイス',0);
gameState.players[0].ex=[fus];
gameState.players[0].lp=8000;
baselineA();
const tr=fieldUse(0,fr);
const now=findCardByUid(fus.uid);
ok('C1 ★ 5000LP を払ってエクストラデッキの融合モンスターが攻撃表示で特殊召喚される',
   tr==='idle' && zu(fus.uid)==='mz' && now.card.pos==='atk'
   && gameState.players[0].lp===3000,
   JSON.stringify({fus:zu(fus.uid),pos:now&&now.card.pos,lp:gameState.players[0].lp}));
ok('C2 ★ 融合召喚ではないので、正規の特殊召喚（properlySummonedS03）にはならない',
   now.card.properlySummonedS03!==true && now.card.specialSummonKind==='effect',
   JSON.stringify({proper:now.card.properlySummonedS03,kind:now.card.specialSummonKind}));
audit('C1');
`, {expect:3});

harness(COMMON + String.raw`
fresh();
/* negative control: LP がちょうど 5000 の時はこの実装では発動できない（当時の根拠が無い＝未確定。
   engine の既存の LP コストのうち厳しい側＝《簡易融合》と同じ読み方に合わせている）。
   negative control: エクストラデッキに融合モンスターがいない時も発動できない。 */
const fr=mk('デビル・フランケン',0,'up');
gameState.players[0].mz=[fr];
gameState.players[0].ex=[mk('サウザンド・アイズ・サクリファイス',0)];
gameState.players[0].lp=5000;
baselineA();
const t1=fieldUse(0,fr);
const lpKept=gameState.players[0].lp===5000 && (gameState.players[0].mz||[]).length===1;
gameState.players[0].lp=8000;
gameState.players[0].ex=[mk('ワイト',0)];
TOASTS.length=0;
const t2=fieldUse(0,fr);
ok('C3 ★ negative control: LP がちょうど 5000 の時と、エクストラデッキに融合モンスターがいない時は発動できない',
   t1==='idle' && t2==='idle' && lpKept
   && (gameState.players[0].mz||[]).length===1 && gameState.players[0].lp===8000,
   JSON.stringify({lpKept:lpKept,mz:mzNames(0),lp:gameState.players[0].lp,toasts:TOASTS.slice(0,2)}));
`, {expect:1});

/* ===== D. クルセイダー・オブ・エンディミオン ===== */
harness(COMMON + String.raw`
fresh();
/* もう1度召喚していない間は効果を使えない（デュアルの共通機構）。 */
const cr=mk('クルセイダー・オブ・エンディミオン',0,'up');cr.summonedTurn=3;
gameState.players[0].mz=[cr,mk('魔導戦士 ブレイカー',0,'up')];
baselineA();
const acts=actOfCard(0,cr);
const tr=fieldUse(0,cr);
ok('D1 ★ もう1度召喚されるまでは効果を発動できず、攻撃力も 1900 のまま',
   tr==='idle' && curATK(findCardByUid(cr.uid).card)===1900
   && geminiActiveS03(findCardByUid(cr.uid).card)===false
   && acts.indexOf('geminiSummon')>=0,
   JSON.stringify({atk:curATK(findCardByUid(cr.uid).card),acts:acts,toasts:TOASTS.slice(0,2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
const cr=mk('クルセイダー・オブ・エンディミオン',0,'up');cr.summonedTurn=3;
const breaker=mk('魔導戦士 ブレイカー',0,'up');
gameState.players[0].mz=[cr,breaker];
gameState.players[0].hand=[mk('スキルドレイン',0)];
gameState.players[0].lp=8000;
baselineA();
const g=gemini(0,cr);
const dual=geminiActiveS03(findCardByUid(cr.uid).card);
PREFER=[breaker.uid];
const t1=fieldUse(0,cr);
const atk1=curATK(findCardByUid(cr.uid).card);
const cnt1=counterTotalV22(gameState,0,'魔力');
TOASTS.length=0;
const t2=fieldUse(0,cr);
const atk2=curATK(findCardByUid(cr.uid).card);
ok('D2 ★ WIKI-F0C82F8C96D2（10/12/17）: もう1度召喚した後、対象のカードに魔力カウンターを1つ置き、'
   +'攻撃力は 600 アップする（1ターンに1度なので 2 回目は発動できない）',
   g==='idle' && t1==='idle' && t2==='idle' && dual===true
   && cnt1===1 && atk1===2500 && atk2===2500,
   JSON.stringify({dual:dual,cnt:cnt1,atk:[atk1,atk2],toasts:TOASTS.slice(0,2)}));
duelActivateFromHand(0);
const t3=drive();
const atk3=curATK(findCardByUid(cr.uid).card);
ok('D3 ★ WIKI-7924775F83D7（10/12/17）: 数値アップ後に《スキルドレイン》を発動すると上昇数値は失われる',
   t3==='idle' && atk3===1900 && counterTotalV22(gameState,0,'魔力')===1,
   JSON.stringify({atk3:atk3,counters:counterTotalV22(gameState,0,'魔力')}));
audit('D2');
`, {expect:3});

/* ===== E. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S518['cards/HZZZZZZZZZZZZB_claude_s03_u518_summon_rights.js'];
const coreSrc = SRC_S518['cards/00_generic_core.js'];
const doc = SRC_S518['docs/S03_U518_REPORT.md'];
okJs('E1 ★ カードは当時裁定の ID を根拠として持ち、デビル・フランケンは裁定が無い事を書いている',
  ['WIKI-55C383C128FC', 'WIKI-38EC2882E2E0', 'WIKI-2AB690FE02B1', 'WIKI-1330B937F075',
   'WIKI-F0C82F8C96D2', 'WIKI-7924775F83D7'].every(id => cardSrc.indexOf(id) >= 0)
  && cardSrc.indexOf('rulings-data.js') >= 0 && cardSrc.indexOf('RULING_UNRESOLVED') >= 0);
okJs('E2 ★ 共通手順はカード名を受け取れるようになり、既定は従来どおり血の代償',
  coreSrc.indexOf('S03-U518') >= 0 && coreSrc.indexOf('labelS518') >= 0
  && coreSrc.indexOf("const nameS518 = labelS518 || '血の代償';") >= 0);
okJs('E3 ★ 報告書に未対応と未確定が書かれている',
  doc.indexOf('RULING_UNRESOLVED') >= 0 && doc.indexOf('スキルドレイン') >= 0);
okJs('E4 ★ このテストが tools/check.py に登録されている',
  SRC_S518['tools/check.py'].indexOf('test_s03_u518_summon_rights.js') >= 0);
