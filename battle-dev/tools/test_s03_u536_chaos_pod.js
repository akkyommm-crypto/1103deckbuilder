/* S03-U536 《カオスポッド》
   リバース:フィールド上のモンスターを全て持ち主のデッキに加えてシャッフルする。その後、お互いのプレイヤーは
   それぞれのデッキに加えた数と同じ数のモンスターが出るまでデッキをめくり、その中からレベル4以下のモンスターを
   全て裏側守備表示で特殊召喚する。それ以外のめくったカードは全て墓地へ捨てる。

   当時裁定（判定と測定の根拠）
     WIKI-EE7F0FD9C805 破壊が確定している自身はデッキに戻さず、戻した枚数に数えない。
     WIKI-40865A68CC06 持ち主の異なるモンスターは元々の持ち主のデッキに戻り、その持ち主の枚数に数える。
     WIKI-181C35842ACF 融合モンスターはEXデッキに戻り、「デッキに戻ったモンスター」に数えない。
     WIKI-8525D514E977 モンスタートークンは消滅し、数えない。
     WIKI-330E11853767 一枚も戻せないならめくらない。
     WIKI-2C139A4EDD50 特殊召喚できないモンスターや上級モンスターは墓地へ送られるが、めくった数に数える。
     WIKI-D0DA5D38F294 特殊召喚できる数を超える場合は選んで出し、残りは墓地へ捨てる。
     WIKI-053C741FA707 裏側守備表示で特殊召喚されたモンスターの表示形式はそのターン変更できない。
     WIKI-C713005AECCE（08/03/04）リバース効果なので強制的に発動する。

   場面
     A 形
     B 反転召喚：両者のモンスターが持ち主のデッキに戻り、戻した数だけめくって裏側守備表示で特殊召喚される
     C1 持ち主の異なるモンスターは相手のデッキに戻り、相手の枚数として数える
     C2 negative control: 融合モンスターはEXデッキに戻り、枚数に数えない
     C3 上級モンスターは墓地へ送られるが、めくった数には数える
     D negative control: 戦闘破壊が確定した自身は戻らず数えない／戻った数が 0 の側はめくらない
     E 特殊召喚できる数を超える場合は、そのプレイヤーが出すカードを選び、残りは墓地へ捨てる
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S536 = pathA.resolve(__dirname, '..');
const rdS536 = p => fsA.readFileSync(pathA.join(ROOT_S536, p), 'utf8');
const SRC_S536 = {
  'cards/HZZZZZZZZZZZZT_claude_s03_u536_chaos_pod.js': rdS536('cards/HZZZZZZZZZZZZT_claude_s03_u536_chaos_pod.js'),
  'docs/S03_U536_REPORT.md': rdS536('docs/S03_U536_REPORT.md'),
  'tools/check.py': rdS536('tools/check.py'),
  'build_manifest.json': rdS536('build_manifest.json')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function pu(uid){const h=findCardByUid(uid);return h?h.p:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
function pick(){
  const q=pc(); TITLES.push(String(q.title||''));
  if(q.max>1||q.min!==q.max){
    const n=Math.max(Number(q.min)||0,1);
    answerChoiceV49((q.candidates||[]).slice(0,n).map(x=>x.key));
    return;
  }
  let j=-1;
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
function fresh(deck0,deck1){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  gameState.players[0].deck=Array.from({length:14},()=>mk(deck0||'ワイト',0));
  gameState.players[1].deck=Array.from({length:14},()=>mk(deck1||'ワイト',1));}
function setMon(n,p){const c=mk(n,p,'down','def');c.setTurn=0;return c;}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(typeof BATTLE_COMMAND_V29!=='undefined'&&BATTLE_COMMAND_V29&&BATTLE_COMMAND_V29.mode==='replayTarget'){
      battleReplayCancelV28();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function st(p){const P=gameState.players[p];return {mz:(P.mz||[]).length,deck:(P.deck||[]).length,grave:(P.grave||[]).length,ex:(P.ex||[]).length};}
function allSetDown(p){const a=(gameState.players[p].mz||[]);
  return a.length>0&&a.every(c=>c&&c.face==='down'&&c.pos==='def'&&Number(c.summonedTurn)===Number(gameState.turn));}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const keys=nativeEffectsV4('カオスポッド').map(e=>e.key);
const sc=CARD_SCRIPTS['カオスポッド'];
ok('A1 ★ 登録され、強制のリバース効果（onFlip）1 つを持つ',
   keys.length===1 && keys[0]==='flip-pod' && sc.forced===true
   && typeof sc.passive.onFlip==='function'
   && typeof u536ReturnAllS03==='function' && typeof u536RevealS03==='function'
   && !!CHOICE_HANDLERS_V49['s03u536.pick'],
   JSON.stringify({keys:keys,forced:sc.forced}));
`, {expect:1});

/* ===== B. 反転召喚：両者のモンスターが持ち主のデッキに戻り、戻した数だけめくる ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-C713005AECCE（08/03/04）: リバース効果なので強制的に発動する。
   WIKI-053C741FA707: 裏側守備表示で特殊召喚される（そのターン表示形式を変更できない）。 */
const pod=setMon('カオスポッド',0);
const mine=mk('ワイト',0,'up');
gameState.players[0].mz=[pod,mine];
const foe=mk('ワイト',1,'up');
gameState.players[1].mz=[foe];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=drive();
const s0=st(0), s1=st(1);
ok('B1 ★ 3 体が持ち主のデッキに戻り、自分は 2 枚・相手は 1 枚めくって、全て裏側守備表示で特殊召喚される',
   r==='idle'
   && s0.mz===2 && s0.deck===14 && s0.grave===0 && allSetDown(0)
   && s1.mz===1 && s1.deck===14 && s1.grave===0 && allSetDown(1)
   && mzNames(0).concat(mzNames(1)).every(n=>n==='ワイト'||n==='カオスポッド'),
   JSON.stringify({r:r,s0:s0,s1:s1,mz0:mzNames(0),mz1:mzNames(1)}));
audit('B1');
`, {expect:2});

/* ===== C1. 持ち主の異なるモンスター ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-40865A68CC06: 持ち主の異なるモンスターは元々の持ち主のデッキに戻り、その持ち主の枚数として数える。 */
const pod=setMon('カオスポッド',0);
const borrowed=mk('ワイト',0,'up'); borrowed.owner=1;      /* コントローラーは自分、持ち主は相手 */
gameState.players[0].mz=[pod,borrowed];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=drive();
const s0=st(0), s1=st(1);
ok('C1 ★ 持ち主が相手のモンスターは相手のデッキに戻り、相手の枚数 1 として数えられて相手がめくる',
   r==='idle'
   && s0.mz===1 && s0.deck===14 && s0.grave===0
   && s1.mz===1 && s1.deck===14 && s1.grave===0
   && allSetDown(0) && allSetDown(1),
   JSON.stringify({r:r,s0:s0,s1:s1}));
audit('C1');
`, {expect:2});

/* ===== C2. 融合モンスター（negative control） ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-181C35842ACF: 融合モンスターはEXデッキに戻るが、「デッキに戻ったモンスター」には数えない。 */
const pod=setMon('カオスポッド',0);
const fus=mk('紅陽鳥',0,'up');
gameState.players[0].mz=[pod,fus];
baselineA();
const exBefore=st(0).ex;
doFlipUp(0,'mz',0,'atk');
const r=drive();
const s0=st(0), s1=st(1);
ok('C2 ★ negative control: 融合モンスターはEXデッキに戻り枚数に数えないので、めくるのは 1 枚だけ',
   r==='idle'
   && zu(fus.uid)==='ex' && pu(fus.uid)===0 && s0.ex===exBefore+1
   && s0.mz===1 && s0.deck===14 && s0.grave===0 && allSetDown(0)
   && s1.mz===0 && s1.deck===14 && s1.grave===0,
   JSON.stringify({r:r,fus:zu(fus.uid),s0:s0,s1:s1}));
audit('C2');
`, {expect:2});

/* ===== C3. 上級モンスターは墓地へ送られるが、めくった数には数える ===== */
harness(COMMON + String.raw`
fresh('ワイト','デーモンの召喚');
/* WIKI-2C139A4EDD50: 特殊召喚できないモンスターや上級モンスターは墓地へ送られるが、めくった数に数える。 */
const pod=setMon('カオスポッド',0);
gameState.players[0].mz=[pod];
const big=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[big];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=drive();
const s0=st(0), s1=st(1);
ok('C3 ★ 相手がめくったレベル 6 モンスターは特殊召喚されず墓地へ送られる（めくった数には数える）',
   r==='idle'
   && s0.mz===1 && s0.deck===14 && s0.grave===0 && allSetDown(0)
   && s1.mz===0 && s1.deck===14 && s1.grave===1
   && (gameState.players[1].grave||[]).every(c=>cardName(c)==='デーモンの召喚'),
   JSON.stringify({r:r,s0:s0,s1:s1,g1:(gameState.players[1].grave||[]).map(nmOf)}));
audit('C3');
`, {expect:2});

/* ===== D. 戦闘破壊が確定した自身は戻らない／戻った数が 0 の側はめくらない ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-EE7F0FD9C805: 破壊が確定している場合、自身はデッキに戻さず枚数に数えない。
   WIKI-330E11853767: 一枚も戻せないならめくらない。 */
const atk=mk('デーモンの召喚',0,'up');
gameState.players[0].mz=[atk];
const pod=setMon('カオスポッド',1);
gameState.players[1].mz=[pod];
baselineA();
phase('battle');
const r=attack(0,0,0);
const s0=st(0), s1=st(1);
const one=(s0.mz + s0.grave)===1;    /* めくったのは 1 枚（デッキは 15 → 14） */
ok('D1 ★ negative control: 戦闘破壊された自身は墓地にあり戻らず、戻った数が 0 の相手はめくらない',
   r==='idle'
   && zu(pod.uid)==='grave' && pu(pod.uid)===1
   && s0.deck===14 && one
   && s1.mz===0 && s1.deck===14 && s1.grave===1,
   JSON.stringify({r:r,pod:zu(pod.uid),podP:pu(pod.uid),s0:s0,s1:s1}));
audit('D1');
`, {expect:2});

/* ===== E. 特殊召喚できる数を超える場合は選ぶ ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-D0DA5D38F294: 裏側守備表示で特殊召喚できる数を超える場合は、出すカードを選び、残りは墓地へ捨てる。 */
const pod=setMon('カオスポッド',0);
gameState.players[0].mz=[pod,mk('ワイト',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up'),mk('ワイト',0,'up')];
const borrowed=mk('ワイト',1,'up'); borrowed.owner=0;       /* 持ち主は自分、コントローラーは相手 */
gameState.players[1].mz=[borrowed];
baselineA();
doFlipUp(0,'mz',0,'atk');
const r=drive();
const s0=st(0), s1=st(1);
ok('E1 ★ 6 体が自分のデッキに戻り 6 枚めくるが、空きは 5 なので 5 体を選んで出し、残り 1 枚は墓地へ捨てる',
   r==='idle'
   && s0.mz===5 && s0.deck===14 && s0.grave===1 && allSetDown(0)
   && s1.mz===0 && s1.deck===14 && s1.grave===0
   && TITLES.some(t=>t.indexOf('裏側守備表示で特殊召喚するモンスター')>=0),
   JSON.stringify({r:r,s0:s0,s1:s1,titles:TITLES}));
audit('E1');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S536['cards/HZZZZZZZZZZZZT_claude_s03_u536_chaos_pod.js'];
const docSrc = SRC_S536['docs/S03_U536_REPORT.md'];
const manSrc = SRC_S536['build_manifest.json'];
const IDS_S536 = ['WIKI-EE7F0FD9C805','WIKI-40865A68CC06','WIKI-181C35842ACF','WIKI-48E1E4F372AF',
  'WIKI-8525D514E977','WIKI-330E11853767','WIKI-2C139A4EDD50','WIKI-D0DA5D38F294',
  'WIKI-053C741FA707','WIKI-C713005AECCE','WIKI-9D5344BF8AAD','WIKI-A9AAB0C03493'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持つ',
  IDS_S536.every(id=>cardSrc.indexOf(id) >= 0));
okJs('F2 ★ 報告書に測った内容と残件が書かれている',
  IDS_S536.every(id=>docSrc.indexOf(id) >= 0) && docSrc.indexOf('未対応') >= 0);
okJs('F3 ★ テストとカードファイルが登録されている',
  SRC_S536['tools/check.py'].indexOf('test_s03_u536_chaos_pod.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZT_claude_s03_u536_chaos_pod.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZT_claude_s03_u536_chaos_pod.js') < manSrc.indexOf('cards/40_auto_interpreter.js'));
