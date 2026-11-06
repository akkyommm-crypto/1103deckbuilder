/* S03-U520: 世紀の大泥棒, 天狗のうちわ（カード実装）。

   《世紀の大泥棒》（NOT_STARTED・星3）
     相手プレイヤーに戦闘ダメージを与える度にカード名を1つ宣言する。
     相手の手札を確認して宣言したカードがあった場合それを全て墓地に捨てる。
   《天狗のうちわ》（NOT_STARTED・永続罠）
     ①:このカードが魔法&罠ゾーンに存在する限り、レベル2以下のモンスターは反転召喚に成功した時に破壊される。
     この時、そのモンスターはフィールドで発動する効果を発動できない。

   当時裁定（回答日つき）
     WIKI-6FD2C17EEAE9（2010-07-04）相手の手札が 0 枚でもカード名を宣言する（宣言は強制）。
     WIKI-F921368DD337（2010-09-17）天狗のうちわの効果はチェーンブロックを作る（誘発効果）。
     WIKI-FD3CC99C4815（2009-01-03）発動が制限されるのはリバース効果だけではない。

   固定するもの:
     A 形
     B 世紀の大泥棒（宣言して同名を全て捨てる・手札 0 枚でも宣言・他のモンスターの戦闘では誘発しない）
     C 天狗のうちわ（レベル2以下の反転召喚を破壊・レベル3は破壊しない・リバース効果を発動できない・
       うちわが無ければ発動できる negative control）
     D Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S520 = pathA.resolve(__dirname, '..');
const rdS520 = p => fsA.readFileSync(pathA.join(ROOT_S520, p), 'utf8');
const SRC_S520 = {
  'cards/HZZZZZZZZZZZZD_claude_s03_u520_declare_flip.js': rdS520('cards/HZZZZZZZZZZZZD_claude_s03_u520_declare_flip.js'),
  'docs/S03_U520_REPORT.md': rdS520('docs/S03_U520_REPORT.md'),
  'tools/check.py': rdS520('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
function pick(){
  const q=pc(); let j=-1;
  TITLES.push(String(q.title||''));
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
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function handNames(p){return (gameState.players[p].hand||[]).map(nmOf);}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function flipUp(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;doFlipUp(p,h.zone,h.index,'atk');return drive();}
function codeOf(name){const d=CARD_DB.find(x=>x&&x.n===name);return d?String(canonicalCardCodeV4(d)||Number(d.c)||0):null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 2 枚が登録され、分類どおりの宣言になっている'
   +'（大泥棒は強制の誘発効果 / うちわは発動時の効果を持たない永続罠で、効果の発動を封じる宣言を持つ）',
   !!CARD_SCRIPTS['世紀の大泥棒'] && CARD_SCRIPTS['世紀の大泥棒'].forced===true
   && !!CARD_SCRIPTS['天狗のうちわ'] && CARD_SCRIPTS['天狗のうちわ'].forced===true
   && typeof CARD_SCRIPTS['天狗のうちわ'].activationLockS03==='function'
   && CARD_ACTIVATION_FREE_V32.has('天狗のうちわ'),
   JSON.stringify({thief:CARD_SCRIPTS['世紀の大泥棒'].forced,fan:CARD_SCRIPTS['天狗のうちわ'].forced}));
`, {expect:1});

/* ===== B. 世紀の大泥棒 ===== */
harness(COMMON + String.raw`
fresh();
/* 直接攻撃で戦闘ダメージを与え、宣言した名前のカードを相手の手札から全て捨てさせる。 */
const thief=mk('世紀の大泥棒',0,'up');
gameState.players[0].mz=[thief];
gameState.players[1].mz=[];
const w1=mk('ワイト',1), w2=mk('ワイト',1), cy=mk('サイクロン',1);
gameState.players[1].hand=[w1,cy,w2];
baselineA();
phase('battle');
PREFER=[codeOf('ワイト')];
const tr=attack(0,0,'direct');
ok('B1 ★ 戦闘ダメージを与える度にカード名を宣言し、相手の手札の同名カードを全て墓地へ捨てさせる',
   tr==='idle' && gameState.players[1].lp===7000
   && zu(w1.uid)==='grave' && zu(w2.uid)==='grave' && zu(cy.uid)==='hand'
   && TITLES.some(t=>t.indexOf('カード名を1つ宣言')>=0),
   JSON.stringify({lp:gameState.players[1].lp,hand:handNames(1),grave:graveNames(1),titles:TITLES.slice(0,3)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-6FD2C17EEAE9（10/07/04）: 相手の手札が 0 枚でも宣言する。 */
const thief=mk('世紀の大泥棒',0,'up');
gameState.players[0].mz=[thief];
gameState.players[1].hand=[];
baselineA();
phase('battle');
PREFER=[codeOf('ワイト')];
const tr=attack(0,0,'direct');
ok('B2 ★ WIKI-6FD2C17EEAE9（10/07/04）: 相手の手札が 0 枚でも誘発し、カード名の宣言まで行う',
   tr==='idle' && gameState.players[1].lp===7000
   && TITLES.some(t=>t.indexOf('カード名を1つ宣言')>=0)
   && (gameState.players[1].hand||[]).length===0,
   JSON.stringify({lp:gameState.players[1].lp,titles:TITLES.slice(0,3)}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 別のモンスターが与えた戦闘ダメージでは誘発しない。 */
const thief=mk('世紀の大泥棒',0,'up');
const other=mk('デーモンの召喚',0,'up');
gameState.players[0].mz=[thief,other];
const w1=mk('ワイト',1);
gameState.players[1].hand=[w1];
baselineA();
phase('battle');
PREFER=[codeOf('ワイト')];
const tr=attack(0,1,'direct');
ok('B3 ★ negative control: 別のモンスターの戦闘ダメージでは誘発せず、宣言も起きない',
   tr==='idle' && gameState.players[1].lp===5500
   && zu(w1.uid)==='hand'
   && !TITLES.some(t=>t.indexOf('カード名を1つ宣言')>=0),
   JSON.stringify({lp:gameState.players[1].lp,hand:handNames(1),titles:TITLES.slice(0,3)}));
audit('B3');
`, {expect:2});

/* ===== C. 天狗のうちわ ===== */
harness(COMMON + String.raw`
fresh();
/* レベル2以下のモンスターの反転召喚に成功した時に破壊する（チェーンブロックを作る誘発効果）。 */
const fan=mk('天狗のうちわ',0,'up');
gameState.players[0].sz=[fan];
const fd=mk('ワイト',0,'down');fd.pos='def';
gameState.players[0].mz=[fd];
baselineA();
const tr=flipUp(0,fd);
ok('C1 ★ レベル2以下のモンスターが反転召喚に成功すると破壊される',
   tr==='idle' && zu(fd.uid)==='grave',
   JSON.stringify({fd:zu(fd.uid),mz:(gameState.players[0].mz||[]).map(nmOf),toasts:TOASTS.slice(0,2)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: レベル3以上は破壊されない。 */
const fan=mk('天狗のうちわ',0,'up');
gameState.players[0].sz=[fan];
const fd=mk('カードガンナー',0,'down');fd.pos='def';
gameState.players[0].mz=[fd];
baselineA();
const tr=flipUp(0,fd);
ok('C2 ★ negative control: レベル3以上のモンスターは反転召喚しても破壊されない',
   tr==='idle' && zu(fd.uid)==='mz' && findCardByUid(fd.uid).card.face==='up',
   JSON.stringify({fd:zu(fd.uid),face:findCardByUid(fd.uid).card.face}));
audit('C2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-FD3CC99C4815（09/01/03）: そのモンスターはフィールドで発動する効果を発動できない。
   《スケルエンジェル》のリバース効果（1枚ドロー）は発動しない。 */
const fan=mk('天狗のうちわ',0,'up');
gameState.players[0].sz=[fan];
const angel=mk('スケルエンジェル',0,'down');angel.pos='def';
gameState.players[0].mz=[angel];
baselineA();
const before=(gameState.players[0].hand||[]).length;
const tr=flipUp(0,angel);
ok('C3 ★ WIKI-FD3CC99C4815（09/01/03）: 反転召喚されたレベル2以下のモンスターはフィールドで発動する'
   +'効果を発動できない（スケルエンジェルのドローが起きない）',
   tr==='idle' && zu(angel.uid)==='grave'
   && (gameState.players[0].hand||[]).length===before,
   JSON.stringify({angel:zu(angel.uid),before:before,after:(gameState.players[0].hand||[]).length}));
audit('C3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: うちわが無ければ、同じ《スケルエンジェル》のリバース効果は発動してドローする。 */
const angel=mk('スケルエンジェル',0,'down');angel.pos='def';
gameState.players[0].mz=[angel];
baselineA();
const before=(gameState.players[0].hand||[]).length;
const tr=flipUp(0,angel);
ok('C4 ★ negative control: うちわが無ければ同じリバース効果は発動し、1枚ドローする',
   tr==='idle' && zu(angel.uid)==='mz'
   && (gameState.players[0].hand||[]).length===before+1,
   JSON.stringify({angel:zu(angel.uid),before:before,after:(gameState.players[0].hand||[]).length}));
audit('C4');
`, {expect:2});

/* ===== D. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S520['cards/HZZZZZZZZZZZZD_claude_s03_u520_declare_flip.js'];
const doc = SRC_S520['docs/S03_U520_REPORT.md'];
okJs('D1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-6FD2C17EEAE9', 'WIKI-F921368DD337', 'WIKI-FD3CC99C4815'].every(id => cardSrc.indexOf(id) >= 0));
okJs('D2 ★ うちわの封じは S03-U217 の activationLockS03 と S03-U260 の反転召喚の記録で書かれている',
  cardSrc.indexOf('activationLockS03') >= 0 && cardSrc.indexOf('flipSummonedTurnS03') >= 0);
okJs('D3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-FD3CC99C4815') >= 0 && doc.indexOf('スケルエンジェル') >= 0);
okJs('D4 ★ このテストが tools/check.py に登録されている',
  SRC_S520['tools/check.py'].indexOf('test_s03_u520_declare_flip.js') >= 0);
