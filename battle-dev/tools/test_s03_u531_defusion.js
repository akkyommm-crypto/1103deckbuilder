/* S03-U531 《融合解除》
   フィールドの融合モンスター1体を対象として発動し、そのモンスターを持ち主のエクストラデッキに戻す。
   その後、そのモンスターの融合召喚に使用した融合素材モンスター一組が自分の墓地に揃っていれば、
   その一組を自分フィールドに特殊召喚できる。

   当時裁定（判定と測定の根拠）
     WIKI-5772E54131CD（10/11/04）融合召喚以外の方法で特殊召喚された融合モンスターでは素材を出せない。
     WIKI-6F274903FD7E（10/11/04）一時的に除外されて戻った場合は出せる。
     WIKI-D359E2863E30（10/11/04）後から墓地に戻した素材では出せない。
     WIKI-91526184443C 一組を全て出せない場合は 1 体も出せない。
     WIKI-2DC70EF9977F（07/08/22）融合召喚でない特殊召喚の素材は出せない。

   場面
     A 形
     B 融合召喚した融合モンスターを戻し、素材一組を自分の墓地から特殊召喚する
     C 《死者蘇生》で出し直した融合モンスターでは素材を出せない
     D 素材の 1 枚が墓地から無くなっていると 1 体も出せない／モンスターゾーンが足りない場合も出せない
     E 《亜空間物質転送装置》で一時的に除外されて戻った場合は出せる
     F negative control: 融合召喚されていない融合モンスター
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S531 = pathA.resolve(__dirname, '..');
const rdS531 = p => fsA.readFileSync(pathA.join(ROOT_S531, p), 'utf8');
const SRC_S531 = {
  'cards/HZZZZZZZZZZZZO_claude_s03_u531_defusion.js': rdS531('cards/HZZZZZZZZZZZZO_claude_s03_u531_defusion.js'),
  'docs/S03_U531_REPORT.md': rdS531('docs/S03_U531_REPORT.md'),
  'tools/check.py': rdS531('tools/check.py')
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function fromHand(p,name){TOASTS.length=0;duelActivateFromHand(handIdx(p,name));return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、対象を取る速攻魔法として宣言されている',
   !!CARD_SCRIPTS['融合解除'] && CARD_SCRIPTS['融合解除'].targets===true
   && CARD_SCRIPTS['融合解除'].type==='quick-play'
   && nativeEffectsV4('融合解除').map(e=>e.key).indexOf('defusion')>=0,
   JSON.stringify({type:CARD_SCRIPTS['融合解除'].type}));
`, {expect:1});

/* ===== B. 融合召喚 → 融合解除 ===== */
harness(COMMON + String.raw`
fresh();
const fm=mk('E・HERO フェザーマン',0), bl=mk('E・HERO バーストレディ',0);
const poly=mk('融合',0), defu=mk('融合解除',0);
const fw=mk('E・HERO フレイム・ウィングマン',0);
gameState.players[0].hand=[poly,fm,bl,defu];
gameState.players[0].ex=[fw];
baselineA();
PREFER=['atk'];
const t1=fromHand(0,'融合');
const fused=zu(fw.uid)==='mz' && cardOf(fw.uid).specialSummonKind==='fusion';
const recorded=Array.isArray(cardOf(fw.uid).fusionMatUidsS03) && cardOf(fw.uid).fusionMatUidsS03.length===2;
PREFER=[fw.uid,'atk'];
const t2=fromHand(0,'融合解除');
ok('B1 ★ 融合召喚した融合モンスターをエクストラデッキに戻し、融合素材一組を自分の墓地から特殊召喚する',
   t1==='idle' && t2==='idle' && fused && recorded
   && zu(fw.uid)==='ex' && zu(fm.uid)==='mz' && zu(bl.uid)==='mz',
   JSON.stringify({fused:fused,recorded:recorded,fw:zu(fw.uid),fm:zu(fm.uid),bl:zu(bl.uid),
     mz0:mzNames(0),titles:TITLES.slice(0,6)}));
audit('B1');
`, {expect:2});

/* ===== C. 死者蘇生で出し直した場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-5772E54131CD（10/11/04）: 融合召喚以外の方法で特殊召喚された融合モンスターでは素材を出せない。 */
const fm=mk('E・HERO フェザーマン',0), bl=mk('E・HERO バーストレディ',0);
const poly=mk('融合',0), defu=mk('融合解除',0), revive=mk('死者蘇生',0), hole=mk('ブラック・ホール',0);
const fw=mk('E・HERO フレイム・ウィングマン',0);
gameState.players[0].hand=[poly,fm,bl,defu,revive,hole];
gameState.players[0].ex=[fw];
baselineA();
PREFER=['atk'];
fromHand(0,'融合');
fromHand(0,'ブラック・ホール');   /* 融合モンスターを破壊して墓地へ */
const inGrave=zu(fw.uid)==='grave';
PREFER=[fw.uid,'atk'];
fromHand(0,'死者蘇生');          /* 融合召喚ではない特殊召喚 */
const back=zu(fw.uid)==='mz';
const cleared=!cardOf(fw.uid).fusionMatUidsS03;
PREFER=[fw.uid,'atk'];
const t=fromHand(0,'融合解除');
ok('C1 ★ WIKI-5772E54131CD（10/11/04）: 《死者蘇生》で出し直した融合モンスターでは素材を特殊召喚できない',
   t==='idle' && inGrave && back && cleared && zu(fw.uid)==='ex'
   && zu(fm.uid)==='grave' && zu(bl.uid)==='grave' && (gameState.players[0].mz||[]).length===0,
   JSON.stringify({inGrave:inGrave,back:back,cleared:cleared,fw:zu(fw.uid),
     fm:zu(fm.uid),bl:zu(bl.uid),mz0:mzNames(0)}));
audit('C1');
`, {expect:2});

/* ===== D. 一組が揃っていない場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-D359E2863E30（10/11/04）/ WIKI-91526184443C: 素材の 1 枚が墓地から無くなっていたら 1 体も出せない。 */
const fm=mk('E・HERO フェザーマン',0), bl=mk('E・HERO バーストレディ',0);
const poly=mk('融合',0), defu=mk('融合解除',0), revive=mk('死者蘇生',0);
const fw=mk('E・HERO フレイム・ウィングマン',0);
gameState.players[0].hand=[poly,fm,bl,defu,revive];
gameState.players[0].ex=[fw];
baselineA();
PREFER=['atk'];
fromHand(0,'融合');
PREFER=[fm.uid,'atk'];
fromHand(0,'死者蘇生');      /* 素材 1 枚を墓地から出してしまう */
const gone=zu(fm.uid)==='mz';
PREFER=[fw.uid,'atk'];
const t=fromHand(0,'融合解除');
ok('D1 ★ WIKI-D359E2863E30 / WIKI-91526184443C: 素材の 1 枚が墓地に無ければ 1 体も特殊召喚しない',
   t==='idle' && gone && zu(fw.uid)==='ex' && zu(bl.uid)==='grave'
   && (gameState.players[0].mz||[]).length===1,
   JSON.stringify({gone:gone,fw:zu(fw.uid),fm:zu(fm.uid),bl:zu(bl.uid),mz0:mzNames(0)}));
audit('D1');
`, {expect:2});

/* ===== E. 一時的に除外されて戻った場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-6F274903FD7E（10/11/04）: 《亜空間物質転送装置》で一時的に除外されて戻った場合は素材を出せる。 */
const fm=mk('E・HERO フェザーマン',0), bl=mk('E・HERO バーストレディ',0);
const poly=mk('融合',0), defu=mk('融合解除',0);
const warp=setc('亜空間物質転送装置',0);
const fw=mk('E・HERO フレイム・ウィングマン',0);
gameState.players[0].hand=[poly,fm,bl,defu];
gameState.players[0].sz=[warp];
gameState.players[0].ex=[fw];
baselineA();
PREFER=['atk'];
fromHand(0,'融合');
PREFER=[fw.uid];
useCard(0,warp);                 /* 一時的に除外 */
const away=zu(fw.uid)==='banish';
phase('end');                    /* エンドフェイズに戻る */
const returned=zu(fw.uid)==='mz';
const kept=Array.isArray(cardOf(fw.uid).fusionMatUidsS03);
turn();phase('standby');phase('main1');phase('end');turn();phase('standby');phase('main1');   /* 自分のターンに戻す（速攻魔法は自分のターンにしか手札から発動できない） */
PREFER=[fw.uid,'atk'];
const t=fromHand(0,'融合解除');
ok('E1 ★ WIKI-6F274903FD7E（10/11/04）: 一時的に除外されて戻った融合モンスターでも素材を特殊召喚できる',
   t==='idle' && away && returned && kept && zu(fw.uid)==='ex'
   && zu(fm.uid)==='mz' && zu(bl.uid)==='mz',
   JSON.stringify({away:away,returned:returned,kept:kept,fw:zu(fw.uid),fm:zu(fm.uid),bl:zu(bl.uid),
     mz0:mzNames(0)}));
audit('E1');
`, {expect:2});

/* ===== F. negative control ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-2DC70EF9977F（07/08/22）の読み方: 融合召喚されていない融合モンスターでは素材を出せない。 */
const fw=mk('E・HERO フレイム・ウィングマン',0,'up');
const defu=mk('融合解除',0);
gameState.players[0].mz=[fw];
gameState.players[0].hand=[defu];
gameState.players[0].grave=[mk('E・HERO フェザーマン',0),mk('E・HERO バーストレディ',0)];
baselineA();
PREFER=[fw.uid];
const t=fromHand(0,'融合解除');
ok('F1 ★ negative control: 融合召喚されていない融合モンスターは戻るだけで、墓地の同名カードは特殊召喚されない',
   t==='idle' && zu(fw.uid)==='ex' && (gameState.players[0].mz||[]).length===0
   && (gameState.players[0].grave||[]).filter(c=>cardName(c).indexOf('E・HERO')>=0).length===2,
   JSON.stringify({fw:zu(fw.uid),mz0:mzNames(0),grave0:graveNames(0)}));
audit('F1');
`, {expect:2});

/* ===== G. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S531['cards/HZZZZZZZZZZZZO_claude_s03_u531_defusion.js'];
const doc = SRC_S531['docs/S03_U531_REPORT.md'];
okJs('G1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-5772E54131CD','WIKI-6F274903FD7E','WIKI-D359E2863E30','WIKI-91526184443C','WIKI-2DC70EF9977F',
   'WIKI-23A6E39C389D','WIKI-D7F2FCEEA25F'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('G2 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-6F274903FD7E') >= 0 && doc.indexOf('未対応') >= 0);
okJs('G3 ★ このテストが tools/check.py に登録されている',
  SRC_S531['tools/check.py'].indexOf('test_s03_u531_defusion.js') >= 0);
