/* S03-U526 《冥王竜ヴァンダルギオン》
   相手がコントロールするカードの発動をカウンター罠で無効にした場合、手札から特殊召喚し、
   無効にしたカードの種類により ●魔法 1500ダメージ / ●罠 相手フィールドのカード1枚破壊 /
   ●効果モンスター 自分の墓地からモンスター1体を特殊召喚 を発動する。

   当時裁定（engine/1ZZZC の窓と、カード側の条件の根拠）
     WIKI-9220FED3DC74 / WIKI-ECEE2A503FDB（09/05/15）カウンター罠を含む一連のチェーン処理の終了後に発動でき、
       いかなる場合でもタイミングを逃さない。
     WIKI-EF5C7C459933（05/03/04）特殊召喚は任意効果 / WIKI-0838EAF7312A（05/03/04）成功時の効果もチェーンに乗る。
     WIKI-6C057DCC8B74（05/03/14）成功時の効果は対象が無くても発動して不発。
     WIKI-DEB7C9EE867E（05/03/04）相手ターンでも発動できる。
     WIKI-19F58D392DF1（05/03/04）召喚・反転召喚・特殊召喚の無効では特殊召喚できない。
     WIKI-D06A75D8766F（07/01/04）手札に2枚あっても1枚だけ。
     WIKI-6215605D7356（08/01/08）お互いの手札にあれば双方が発動できる。
     WIKI-822781A9E595（09/01/03）無効にされたカードの種別で種類を見る。
     WIKI-A07AFFA1C527（11/06/04）複数種類を同時に無効にした場合は種類ごとにチェーンを組む。

   場面
     A 形
     B ●魔法（マジック・ジャマーで《強欲な壺》の発動を無効）と「2枚あっても1枚だけ」
     C ●罠（盗賊の七つ道具で《リビングデッドの呼び声》の発動を無効）
     D ●効果モンスター（天罰で《カードガンナー》の効果の発動を無効）
     E negative control: 自分のカードの発動を自分のカウンター罠で無効にした場合は発動できない
     F negative control: 《神の宣告》で召喚を無効にした場合は発動できない
     G 相手側（p1）の手札からでも同じように発動できる
     H Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S526 = pathA.resolve(__dirname, '..');
const rdS526 = p => fsA.readFileSync(pathA.join(ROOT_S526, p), 'utf8');
const SRC_S526 = {
  'cards/HZZZZZZZZZZZZJ_claude_s03_u526_vandalgyon.js': rdS526('cards/HZZZZZZZZZZZZJ_claude_s03_u526_vandalgyon.js'),
  'engine/1ZZZC_counter_negate_s03.js': rdS526('engine/1ZZZC_counter_negate_s03.js'),
  'docs/S03_U526_REPORT.md': rdS526('docs/S03_U526_REPORT.md'),
  'tools/check.py': rdS526('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cardOf(uid){const h=findCardByUid(uid);return h?h.card:null;}
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
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function fromHand(p,name){TOASTS.length=0;duelActivateFromHand(handIdx(p,name));return drive();}
function useZone(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function settle(){for(let i=0;i<40&&pc();i++)pick();}
function respond(p,c){settle();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);
  settle();   /* コストの選択まで答えるとチェーンに積まる */
  return gameState.chain.some(l=>l.name===cardName(c));}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['冥王竜ヴァンダルギオン'];
const keys=nativeEffectsV4('冥王竜ヴァンダルギオン').map(e=>e.key);
ok('A1 ★ 登録され、手札からの特殊召喚と種類別の 3 つの効果を持ち、対象を取る宣言がある',
   !!sc && keys.indexOf('hand-special')>=0 && keys.indexOf('kind-spell')>=0
   && keys.indexOf('kind-trap')>=0 && keys.indexOf('kind-monster')>=0 && sc.targets===true
   && typeof sc.passive.onCounterNegateS03==='function',
   JSON.stringify({keys:keys,targets:sc&&sc.targets,zoneKey:ZONE_LOCAL_KEYS.indexOf('u526KindsS03')>=0}));
`, {expect:1});

/* ===== B. ●魔法 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-DEB7C9EE867E（05/03/04）: 相手ターンでも発動できる。 */
gameState.activePlayer=1;
const van=mk('冥王竜ヴァンダルギオン',0), dis=mk('ワイト',0);
const jam=setc('マジック・ジャマー',0);
gameState.players[0].sz=[jam];
gameState.players[0].hand=[van,dis];
gameState.players[1].hand=[mk('強欲な壺',1)];
baselineA();
duelActivateFromHand(handIdx(1,'強欲な壺'));
PREFER=[dis.uid];                     /* 捨てるのはワイト（このカードを捨てない） */
const resp=respond(0,jam);
const t1=drive();
ok('B1 ★ WIKI-9220FED3DC74 / WIKI-ECEE2A503FDB: 相手の魔法の発動をカウンター罠で無効にした後、'
   +'一連のチェーン処理の終了後に手札から特殊召喚し、●魔法で1500ダメージを与える',
   t1==='idle' && resp===true && zu(van.uid)==='mz' && gameState.players[1].lp===6500
   && (gameState.players[1].hand||[]).length===0   /* 発動が無効なのでドローしない */
   && (gameState.players[1].grave||[]).some(c=>cardName(c)==='強欲な壺')
   && TITLES.some(x=>x.indexOf('特殊召喚する表示形式')>=0),
   JSON.stringify({van:zu(van.uid),lp1:gameState.players[1].lp,mz0:mzNames(0),
     hand1:(gameState.players[1].hand||[]).length,grave1:(gameState.players[1].grave||[]).map(nmOf),
     titles:TITLES.slice(0,4)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-D06A75D8766F（07/01/04）: 手札に 2 枚あっても特殊召喚できるのは 1 枚だけ。 */
gameState.activePlayer=1;
const vanA=mk('冥王竜ヴァンダルギオン',0), vanB=mk('冥王竜ヴァンダルギオン',0), dis=mk('ワイト',0);
const jam=setc('マジック・ジャマー',0);
gameState.players[0].sz=[jam];
gameState.players[0].hand=[vanA,vanB,dis];
gameState.players[1].hand=[mk('強欲な壺',1)];
baselineA();
duelActivateFromHand(handIdx(1,'強欲な壺'));
PREFER=[dis.uid];
respond(0,jam);
const t1=drive();
const inMz=[zu(vanA.uid),zu(vanB.uid)].filter(z=>z==='mz').length;
const inHand=[zu(vanA.uid),zu(vanB.uid)].filter(z=>z==='hand').length;
ok('B2 ★ WIKI-D06A75D8766F（07/01/04）: 同じ無効化では 1 枚しか特殊召喚できない（もう 1 枚は手札に残る）',
   t1==='idle' && inMz===1 && inHand===1 && gameState.players[1].lp===6500,
   JSON.stringify({a:zu(vanA.uid),b:zu(vanB.uid),lp1:gameState.players[1].lp}));
audit('B2');
`, {expect:2});

/* ===== C. ●罠 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-822781A9E595（09/01/03）と同じ読み方: 無効にされたカードの種別で種類を決める（ここでは永続罠＝●罠）。 */
gameState.activePlayer=1;
const van=mk('冥王竜ヴァンダルギオン',0);
const seven=setc('盗賊の七つ道具',0);
const call=setc('リビングデッドの呼び声',1);
const foe=mk('デーモンの召喚',1,'up'), buried=mk('ワイト',1);
gameState.players[0].sz=[seven];
gameState.players[0].hand=[van];
gameState.players[1].sz=[call];
gameState.players[1].mz=[foe];
gameState.players[1].grave=[buried];
baselineA();
PREFER=[buried.uid,foe.uid];          /* 呼び声の対象 → 破壊する相手のカード */
duelActivateFromZone(1,'sz',findCardByUid(call.uid).index,{});
const resp=respond(0,seven);
const t1=drive();
ok('C1 ★ 相手の罠の発動をカウンター罠で無効にした場合、●罠で相手フィールドのカード1枚を破壊する'
   +'（無効にされた呼び声の蘇生は起きない）',
   t1==='idle' && resp===true && zu(van.uid)==='mz' && zu(foe.uid)==='grave'
   && zu(buried.uid)==='grave' && gameState.players[0].lp===7000,
   JSON.stringify({van:zu(van.uid),foe:zu(foe.uid),buried:zu(buried.uid),
     lp0:gameState.players[0].lp,titles:TITLES.slice(0,5)}));
audit('C1');
`, {expect:2});

/* ===== C2. 対象が無い場合は発動して不発 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-6C057DCC8B74（05/03/14）: 成功時の効果は対象が存在しなくても発動して不発になる。
   相手の場には無効にされる罠しか無く、それも《盗賊の七つ道具》で破壊されるので、
   ●罠の効果が解決する時には相手フィールドが空になる。 */
gameState.activePlayer=1;
const van=mk('冥王竜ヴァンダルギオン',0);
const seven=setc('盗賊の七つ道具',0);
const call=setc('リビングデッドの呼び声',1);
const buried=mk('ワイト',1);
gameState.players[0].sz=[seven];
gameState.players[0].hand=[van];
gameState.players[1].sz=[call];
gameState.players[1].grave=[buried];
baselineA();
PREFER=[buried.uid];
duelActivateFromZone(1,'sz',findCardByUid(call.uid).index,{});
const resp=respond(0,seven);
const t1=drive();
ok('C2 ★ WIKI-6C057DCC8B74（05/03/14）: 対象が無くても特殊召喚は行われ、'
   +'●罠の効果は発動して不発になる（破壊の選択が開かない）',
   t1==='idle' && resp===true && zu(van.uid)==='mz' && zu(buried.uid)==='grave'
   && (gameState.players[1].mz||[]).length===0 && (gameState.players[1].sz||[]).length===0
   && !TITLES.some(x=>x.indexOf('破壊する相手のカード')>=0),
   JSON.stringify({van:zu(van.uid),mz1:mzNames(1),sz1:(gameState.players[1].sz||[]).map(nmOf),
     titles:TITLES.slice(0,5)}));
audit('C2');
`, {expect:2});

/* ===== D. ●効果モンスター ===== */
harness(COMMON + String.raw`
fresh();
gameState.activePlayer=1;
const van=mk('冥王竜ヴァンダルギオン',0), dis=mk('ワイト',0), rev=mk('デーモンの召喚',0);
const ten=setc('天罰',0);
const gunner=mk('カードガンナー',1,'up');
gameState.players[0].sz=[ten];
gameState.players[0].hand=[van,dis];
gameState.players[0].grave=[rev];
gameState.players[1].mz=[gunner];
baselineA();
duelActivateFromZone(1,'mz',findCardByUid(gunner.uid).index,{});
PREFER=[dis.uid];                     /* 天罰のコストはワイト */
const resp=respond(0,ten);
PREFER=[rev.uid];                     /* 蘇生するのはデーモンの召喚 */
const t1=drive();
ok('D1 ★ 相手の効果モンスターの効果の発動をカウンター罠で無効にした場合、'
   +'●効果モンスターで自分の墓地からモンスター1体を特殊召喚する',
   t1==='idle' && resp===true && zu(van.uid)==='mz' && zu(rev.uid)==='mz'
   && zu(gunner.uid)==='grave',
   JSON.stringify({van:zu(van.uid),rev:zu(rev.uid),gunner:zu(gunner.uid),
     mz0:mzNames(0),titles:TITLES.slice(0,5)}));
audit('D1');
`, {expect:2});

/* ===== E. negative control: 自分のカードを無効にした場合 ===== */
harness(COMMON + String.raw`
fresh();
/* テキストは「相手がコントロールするカードの発動を…無効にした場合」。 */
const van=mk('冥王竜ヴァンダルギオン',0), dis=mk('ワイト',0);
const jam=setc('マジック・ジャマー',0);
gameState.players[0].sz=[jam];
gameState.players[0].hand=[van,dis,mk('強欲な壺',0)];
baselineA();
const before=gameState.players[0].hand.length;
duelActivateFromHand(handIdx(0,'強欲な壺'));
PREFER=[dis.uid];
respond(0,jam);
const t1=drive();
ok('E1 ★ negative control: 自分のカードの発動を自分のカウンター罠で無効にしても特殊召喚できない',
   t1==='idle' && zu(van.uid)==='hand' && mzNames(0).length===0,
   JSON.stringify({van:zu(van.uid),mz0:mzNames(0),hand:(gameState.players[0].hand||[]).map(nmOf),before:before}));
audit('E1');
`, {expect:2});

/* ===== F. negative control: 召喚の無効 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-19F58D392DF1（05/03/04）: 《神の宣告》等で召喚・反転召喚・特殊召喚を無効にした場合は特殊召喚できない。 */
gameState.activePlayer=1;
const van=mk('冥王竜ヴァンダルギオン',0);
const dec=setc('神の宣告',0);
gameState.players[0].sz=[dec];
gameState.players[0].hand=[van];
gameState.players[1].hand=[mk('デーモンの召喚',1)];
gameState.players[1].mz=[mk('ワイト',1,'up'),mk('ワイト',1,'up')];
baselineA();
PREFER=[];
doNormalSummon(handIdx(1,'デーモンの召喚'),'atk');
settle();
const neg=!!gameState.pendingSummon && summonNegatorsV2(gameState.pendingSummon).some(x=>x.db.n==='神の宣告');
if(neg) activateSummonNegatorV2(0,'sz',findCardByUid(dec.uid).index,0);
const t1=drive();
ok('F1 ★ WIKI-19F58D392DF1（05/03/04）: 召喚を無効にした場合は特殊召喚できない',
   t1==='idle' && neg===true && zu(van.uid)==='hand' && mzNames(0).length===0,
   JSON.stringify({neg:neg,van:zu(van.uid),mz0:mzNames(0),mz1:mzNames(1),lp0:gameState.players[0].lp}));
audit('F1');
`, {expect:2});

/* ===== G. 相手側の手札からも同じように発動できる ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-6215605D7356（08/01/08）の読み方: 窓は無効にした player ごとに開く（ここでは p1 が無効にした場合）。 */
const van=mk('冥王竜ヴァンダルギオン',1), dis=mk('ワイト',1);
const jam=setc('マジック・ジャマー',1);
gameState.players[1].sz=[jam];
gameState.players[1].hand=[van,dis];
gameState.players[0].hand=[mk('強欲な壺',0)];
baselineA();
duelActivateFromHand(handIdx(0,'強欲な壺'));
PREFER=[dis.uid];
const resp=respond(1,jam);
const t1=drive();
ok('G1 ★ 相手（p1）の手札からでも、自分のカウンター罠で無効にした場合に特殊召喚して1500ダメージを与える',
   t1==='idle' && resp===true && zu(van.uid)==='mz' && gameState.players[0].lp===6500,
   JSON.stringify({van:zu(van.uid),lp0:gameState.players[0].lp,mz1:mzNames(1)}));
audit('G1');
`, {expect:2});

/* ===== H. 文書・登録 ===== */
harness(COMMON + String.raw`
fresh();
ok('H0 ★ 窓はチェーン終了時に 1 回だけ積まれる関数を持つ',
   typeof counterNegateFlushS03==='function' && typeof counterNegateKindsForS03==='function'
   && typeof counterNegateSourceS03==='function');
`, {expect:1});

const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S526['cards/HZZZZZZZZZZZZJ_claude_s03_u526_vandalgyon.js'];
const engSrc = SRC_S526['engine/1ZZZC_counter_negate_s03.js'];
const doc = SRC_S526['docs/S03_U526_REPORT.md'];
okJs('H1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-9220FED3DC74','WIKI-ECEE2A503FDB','WIKI-EF5C7C459933','WIKI-6C057DCC8B74','WIKI-19F58D392DF1',
   'WIKI-D06A75D8766F','WIKI-6215605D7356','WIKI-A07AFFA1C527'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('H2 ★ 共通側の記録と窓に、何を数えないかが書かれている',
  engSrc.indexOf('WIKI-19F58D392DF1') >= 0 && engSrc.indexOf('WIKI-9220FED3DC74') >= 0);
okJs('H3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-A07AFFA1C527') >= 0 && doc.indexOf('未対応') >= 0);
okJs('H4 ★ このテストが tools/check.py に登録されている',
  SRC_S526['tools/check.py'].indexOf('test_s03_u526_vandalgyon.js') >= 0);
