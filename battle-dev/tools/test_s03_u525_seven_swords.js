/* S03-U525: セブン・ソード・ウォリアー（カード実装）。

   《セブン・ソード・ウォリアー》（NOT_STARTED・シンクロ・星7）
     1ターンに1度、このカードに装備カードが装備された時、相手ライフに800ポイントダメージを与える。
     また、1ターンに1度、このカードに装備された装備カード1枚を墓地へ送る事ができる。
     このカードに装備された装備カードが墓地へ送られた時、相手フィールド上に表側表示で存在する
     モンスター1体を選択して破壊する事ができる。

   当時裁定（回答日つき）
     WIKI-8464A3FDCE00（2011-03-31）装備カードを墓地へ送るのはコストではなく効果処理。
     WIKI-95A7FDC55945（2010-08-04）その効果は装備カード1枚を対象に取る。
     WIKI-3745358F4C59（2010-10-20）《サイクロン》で装備カードが破壊された場合も破壊効果は発動する。
     WIKI-E310EA381AD3（2010-08-04）破壊効果に1ターンの回数制限は無い。
     WIKI-3BCFDB9634BD（2010-08-05）2枚同時に墓地へ送られても効果は1回だけ。
     WIKI-183FF13CF89F（2010-08-04）このカードが破壊された事で装備魔法が墓地へ送られた場合は発動しない。
     WIKI-CE43322EF830（2010-08-04）《月の書》等でこのカードが裏側になった場合も発動しない。
     WIKI-00F9E5A7766A（2010-08-04）相手が装備した装備カードも対象になる。

   固定するもの:
     A 形
     B 装備された時の800ダメージ（1ターンに1度）
     C 装備カードを墓地へ送る効果（対象を取る・1ターンに1度）とそれによる破壊
     D 《サイクロン》で破壊された場合も破壊効果が発動し、回数制限が無い
     E このカードが破壊された事で装備が墓地へ行った場合は発動しない（negative control）
     F 2枚同時なら1回だけ
     G Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S525 = pathA.resolve(__dirname, '..');
const rdS525 = p => fsA.readFileSync(pathA.join(ROOT_S525, p), 'utf8');
const SRC_S525 = {
  'cards/HZZZZZZZZZZZZI_claude_s03_u525_seven_swords.js': rdS525('cards/HZZZZZZZZZZZZI_claude_s03_u525_seven_swords.js'),
  'docs/S03_U525_REPORT.md': rdS525('docs/S03_U525_REPORT.md'),
  'tools/check.py': rdS525('tools/check.py')
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
function useMz(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function useSz(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、3 つの効果（装備された時のダメージ・装備を墓地へ送る・墓地へ送られた時の破壊）を'
   +'持ち、対象を取る宣言がある',
   !!CARD_SCRIPTS['セブン・ソード・ウォリアー']
   && CARD_SCRIPTS['セブン・ソード・ウォリアー'].targets===true
   && typeof CARD_SCRIPTS['セブン・ソード・ウォリアー'].passive.onEquipAttached==='function'
   && typeof CARD_SCRIPTS['セブン・ソード・ウォリアー'].passive.onEquipDetached==='function'
   && ZONE_LOCAL_KEYS.indexOf('u525BurnTurnS03')>=0,
   JSON.stringify({targets:CARD_SCRIPTS['セブン・ソード・ウォリアー'].targets}));
`, {expect:1});

/* ===== B. 装備された時の800ダメージ（1ターンに1度） ===== */
harness(COMMON + String.raw`
fresh();
const sw=mk('セブン・ソード・ウォリアー',0,'up');
gameState.players[0].mz=[sw];
gameState.players[0].hand=[mk('伝説の剣',0),mk('伝説の剣',0)];
baselineA();
PREFER=[sw.uid];
const t1=fromHand(0,'伝説の剣');
const lp1=gameState.players[1].lp;
PREFER=[sw.uid];
const t2=fromHand(0,'伝説の剣');
ok('B1 ★ このカードに装備カードが装備された時に 800 ダメージを与え、1ターンに1度なので 2 枚目では与えない',
   t1==='idle' && t2==='idle' && lp1===7200 && gameState.players[1].lp===7200
   && (gameState.players[0].sz||[]).length===2,
   JSON.stringify({lp1:lp1,lp2:gameState.players[1].lp,sz:(gameState.players[0].sz||[]).map(nmOf)}));
audit('B1');
`, {expect:2});

/* ===== C. 装備カードを墓地へ送る効果と、それによる破壊 ===== */
harness(COMMON + String.raw`
fresh();
const sw=mk('セブン・ソード・ウォリアー',0,'up');
gameState.players[0].mz=[sw];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
gameState.players[0].hand=[mk('伝説の剣',0)];
baselineA();
/* 装備は実経路（手札から装備魔法を発動）で付ける */
PREFER=[sw.uid];
const tEq=fromHand(0,'伝説の剣');
const eq=(gameState.players[0].sz||[])[0];
PREFER=[eq.uid,foe.uid];
const t1=useMz(0,sw);
ok('C1 ★ WIKI-95A7FDC55945（10/08/04）/ WIKI-8464A3FDCE00（11/03/31）: 装備カード1枚を対象に取り、'
   +'効果処理で墓地へ送る。その装備カードが墓地へ送られた事で相手モンスター1体を破壊する',
   tEq==='idle' && t1==='idle' && zu(eq.uid)==='grave' && zu(foe.uid)==='grave',
   JSON.stringify({eq:zu(eq.uid),foe:zu(foe.uid),titles:TITLES.slice(0,3),toasts:TOASTS.slice(0,2)}));
const t2=useMz(0,sw);
ok('C2 ★ 墓地へ送る効果は1ターンに1度なので 2 回目は発動できない',
   t2==='idle' && TOASTS.some(t=>t.indexOf('このターンは既に使用')>=0 || t.indexOf('装備された装備カードがありません')>=0),
   JSON.stringify({toasts:TOASTS.slice(0,2)}));
audit('C1');
`, {expect:3});

/* ===== D. 《サイクロン》で破壊された場合・回数制限が無い事 ===== */
harness(COMMON + String.raw`
fresh();
const sw=mk('セブン・ソード・ウォリアー',0,'up');
gameState.players[0].mz=[sw];
const foeA=mk('デーモンの召喚',1,'up'), foeB=mk('ワイト',1,'up');
gameState.players[1].mz=[foeA,foeB];
gameState.players[0].hand=[mk('伝説の剣',0),mk('伝説の剣',0),mk('サイクロン',0)];
baselineA();
PREFER=[sw.uid];
fromHand(0,'伝説の剣');
PREFER=[sw.uid];
fromHand(0,'伝説の剣');
const eqA=(gameState.players[0].sz||[])[0], eqB=(gameState.players[0].sz||[])[1];
PREFER=[eqA.uid,foeA.uid];
const t1=useMz(0,sw);                 /* 自分の効果で 1 枚目を墓地へ → 1 体破壊 */
PREFER=[eqB.uid,foeB.uid];
const t2=fromHand(0,'サイクロン');    /* サイクロンで 2 枚目を破壊 → もう 1 体破壊 */
ok('D1 ★ WIKI-3745358F4C59（10/10/20）: 《サイクロン》で装備カードが破壊された場合も破壊効果は発動し、'
   +'WIKI-E310EA381AD3（10/08/04）: 1ターンの回数制限は無い（同じターンに 2 体破壊できる）',
   t1==='idle' && t2==='idle'
   && zu(eqA.uid)==='grave' && zu(eqB.uid)==='grave'
   && zu(foeA.uid)==='grave' && zu(foeB.uid)==='grave',
   JSON.stringify({eqA:zu(eqA.uid),eqB:zu(eqB.uid),foeA:zu(foeA.uid),foeB:zu(foeB.uid),
     mz:mzNames(1),titles:TITLES.slice(0,4)}));
audit('D1');
`, {expect:2});

/* ===== E. このカードが破壊された場合（negative control） ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-183FF13CF89F（10/08/04）: このカードが破壊された事で装備魔法が墓地へ送られた場合は発動しない。 */
const sw=mk('セブン・ソード・ウォリアー',0,'up');
gameState.players[0].mz=[sw];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
gameState.players[0].hand=[mk('伝説の剣',0),mk('ブラック・ホール',0)];
baselineA();
PREFER=[sw.uid];
fromHand(0,'伝説の剣');
const eq=(gameState.players[0].sz||[])[0];
TITLES.length=0;
/* 自分の《ブラック・ホール》で自分のウォリアーごと全体破壊する */
const t1=fromHand(0,'ブラック・ホール');
ok('E1 ★ WIKI-183FF13CF89F（10/08/04）: このカードが破壊された事で装備魔法が墓地へ送られた場合、'
   +'破壊効果は発動しない（相手モンスターも全体破壊で墓地へ行くので、装備の効果ではない事を'
   +'「破壊の選択が開かない」で確かめる）',
   t1==='idle' && zu(sw.uid)==='grave' && zu(eq.uid)==='grave'
   && !TITLES.some(t=>t.indexOf('破壊する相手モンスター')>=0),
   JSON.stringify({sw:zu(sw.uid),eq:zu(eq.uid),titles:TITLES.slice(0,4)}));
audit('E1');
`, {expect:2});

/* ===== F. 2枚同時なら1回だけ ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-3BCFDB9634BD（10/08/05）: 装備カードが 2 枚同時に墓地へ送られた場合でも 1 回だけ。 */
const sw=mk('セブン・ソード・ウォリアー',0,'up');
gameState.players[0].mz=[sw];
const foeA=mk('デーモンの召喚',1,'up'), foeB=mk('ワイト',1,'up');
gameState.players[1].mz=[foeA,foeB];
gameState.players[0].hand=[mk('伝説の剣',0),mk('伝説の剣',0),mk('大嵐',0)];
baselineA();
PREFER=[sw.uid];
fromHand(0,'伝説の剣');
PREFER=[sw.uid];
fromHand(0,'伝説の剣');
const eqA=(gameState.players[0].sz||[])[0], eqB=(gameState.players[0].sz||[])[1];
PREFER=[foeA.uid];
const t1=fromHand(0,'大嵐');
const destroyed=[zu(foeA.uid),zu(foeB.uid)].filter(z=>z==='grave').length;
ok('F1 ★ WIKI-3BCFDB9634BD（10/08/05）: 2 枚が同時に墓地へ送られても破壊効果は 1 回だけ'
   +'（相手モンスターは 1 体だけ破壊される）',
   t1==='idle' && zu(eqA.uid)==='grave' && zu(eqB.uid)==='grave' && destroyed===1,
   JSON.stringify({eqA:zu(eqA.uid),eqB:zu(eqB.uid),foeA:zu(foeA.uid),foeB:zu(foeB.uid),
     destroyed:destroyed,titles:TITLES.slice(0,4)}));
audit('F1');
`, {expect:2});

/* ===== G. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S525['cards/HZZZZZZZZZZZZI_claude_s03_u525_seven_swords.js'];
const doc = SRC_S525['docs/S03_U525_REPORT.md'];
okJs('G1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-8464A3FDCE00', 'WIKI-95A7FDC55945', 'WIKI-3745358F4C59', 'WIKI-E310EA381AD3',
   'WIKI-3BCFDB9634BD', 'WIKI-183FF13CF89F', 'WIKI-CE43322EF830', 'WIKI-02EA6A6B7D43',
   'WIKI-00F9E5A7766A'].every(id => cardSrc.indexOf(id) >= 0));
okJs('G2 ★ 「装備された時」「外れた時」を System v15 の装備イベントで見る理由が書かれている',
  cardSrc.indexOf('onEquipAttached') >= 0 && cardSrc.indexOf('onEquipDetached') >= 0);
okJs('G3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-3BCFDB9634BD') >= 0 && doc.indexOf('未対応') >= 0);
okJs('G4 ★ このテストが tools/check.py に登録されている',
  SRC_S525['tools/check.py'].indexOf('test_s03_u525_seven_swords.js') >= 0);
