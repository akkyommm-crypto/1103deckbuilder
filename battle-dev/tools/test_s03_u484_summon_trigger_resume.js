/* S03-U484: 非 P1.1 の召喚・反転誘発がチェーンに乗った状態で保存すると、チェーン終了後の「召喚成功後のクイックエフェクト確認」（POINT summonFast / flipFast）が消える欠陥の修正と固定。
   背景（docs/S03_U483_REPORT.md の 4-b）: チェーン終了後の継続は EVT_V2_STATE.after というクロージャに入る。P1.1 の commitPreparedActivationV11 は同じ継続を CHAIN_ADD の eventResumeV11 にも載せるので
   gameState.eventChainResumeV11 として保存・再開を跨げるが、非 P1.1 の finishPrepare は載せないため、保存・再開でクロージャごと継続が消え、再開後は応答窓が開かなかった。
   該当は召喚・反転誘発の passive を持つスクリプトのうち非 P1.1 のもの（P1.1 宣言ありはごく一部）。実害は「相手の召喚に対してクイックエフェクトで応答する機会が、セーブ再開した側だけ失われる」こと。
   修正（engine/30・engine/40・engine/1O）:
     1. 継続のデータ版（EVT_RESUME_DATA_V484）を、クロージャ EVT_AFTER を作るその場所（processEventV27 / processEventBatchV28）で一緒に作る。
     2. startEventChainV2 が EVT_V2_STATE.resumeData へ引き取る。
     3. eventSelectionDescriptorV11 は「待機中のプロセッサ unit の payload からの再導出」をやめ、記録された resumeData を読む（= 捕まえたクロージャと必ず同じ継続になる）。
     4. 非 P1.1 の finishPrepare の CHAIN_ADD も eventResumeV11 を載せる（P1.1 と同じ形。resume が無い経路では今までどおり何も載せない）。
   この試験は、保存なしの通し実行と「誘発リンクがチェーンに乗った所で保存 → 新しい VM → 再開 → 解決」を、開いた POINT 窓の並び・最終 digest・Replay 監査で突き合わせる。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function liveOf(c){const h=findCardByUid(c.uid);return h?h.card:null;}
/* 2つを別々に数える。ENQ=窓が作られた回数（kind 別）、OPENED=実際に開いて応答を待った窓。
   POINT 窓は応答できるカードが無いと開かずに閉じるので、相手に伏せた速攻魔法を置いて実際に開く盤面にしてある。 */
let ENQ=[],OPENED=[];
(function(){const f=enqueueProcessorV27;enqueueProcessorV27=function(t,pl,front){
  if(t===PROCESSOR_V27.POINT&&pl&&pl.kind)ENQ.push(pl.kind);return f.apply(this,arguments);};})();
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
/* ページ再読み込みで消える実行時の変数（R1 の slReset と同じ範囲） */
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}}
function foe(){const q=mk('月の書',1,'down');q.setTurn=gameState.turn-1;gameState.players[1].sz.push(q);return q;}
function fresh(active){resetA();resetVolatile();ENQ=[];OPENED=[];gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4840011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function savedRaw(){localStorage.removeItem(DUEL_SAVE_KEY);saveDuel();return localStorage.getItem(DUEL_SAVE_KEY);}
function reload(raw){resetA();resetVolatile();ENQ=[];OPENED=[];localStorage.setItem(DUEL_SAVE_KEY,raw);return offerResumeDuel();}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){OPENED.push((w.payload&&w.payload.kind)||'?');pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function drive(until){for(let i=0;i<800;i++){
  if(until&&!pc()&&until())return 'until';
  if(pc()){__choicePickV49(0);continue;}
  if(!step())return 'idle';}return 'loop';}
function onChain(nm){return gameState.chain.some(l=>l.name===nm);}
/* 盤面の置き方。どの member も「誘発がチェーンに乗る」所まで到達させる */
const MEMBERS=[
 {key:'AIRMAN',name:'E・HERO エアーマン',ev:'onNormalSummon',want:'summonFast',
  setup:()=>{const c=mk('E・HERO エアーマン',0);gameState.players[0].hand=[c];
    gameState.players[0].deck.unshift(mk('E・HERO オーシャン',0));
    gameState.players[1].mz=[mk('ワイト',1)];foe();return {c:c}},
  go:function(x){doNormalSummon(0,'atk')}},
 {key:'BREAKER',name:'魔導戦士 ブレイカー',ev:'onNormalSummon',want:'summonFast',
  setup:()=>{const c=mk('魔導戦士 ブレイカー',0);gameState.players[0].hand=[c];
    gameState.players[1].sz=[mk('聖なるバリア －ミラーフォース－',1,'down')];gameState.players[1].mz=[mk('ワイト',1)];foe();return {c:c}},
  go:function(x){doNormalSummon(0,'atk')}},
 {key:'SNOWMAN',name:'スノーマンイーター',ev:'onFlip',want:'flipFast',
  setup:()=>{const c=mk('スノーマンイーター',0,'down','def');c.setTurn=gameState.turn-1;gameState.players[0].mz=[c];
    gameState.players[1].mz=[mk('ワイト',1)];foe();return {c:c}},
  go:function(x){doFlipUp(0,'mz',0,'atk')}},
 {key:'KNIGHT',name:'終末の騎士',ev:'onSpecialSummon(batch)',want:'summonFast',
  setup:()=>{const k=mk('終末の騎士',0);gameState.players[0].grave=[k];
    const r=mk('死者蘇生',0);gameState.players[0].hand=[r];gameState.players[1].mz=[mk('ワイト',1)];foe();return {c:k,r:r}},
  go:function(x){duelActivateFromHand(0,0)}}
];
`;

/* ================= VM1: 配線の固定、保存なしの通し実行、チェーン上での保存 ================= */
const first=harness(COMMON+String.raw`
globalThis.__SAVES={};

/* ---- 母集団: この修正が効く範囲を記録する（分類が静かに変わったら気づけるように） ---- */
{
  const EV=['onNormalSummon','onSpecialSummon','onFlip'];const all=[],p11=[];
  Object.keys(CARD_SCRIPTS).forEach(n=>{const sc=CARD_SCRIPTS[n];if(!sc||!sc.passive)return;
    if(!EV.some(e=>typeof sc.passive[e]==='function'))return;all.push(n);if(sc.activationV11)p11.push(n);});
  ok('母集団: 召喚・反転誘発の passive を持つスクリプトは 518 本、うち P1.1 宣言ありが 22 本、非 P1.1 の 496 本がこの修正の対象',
     all.length===518&&p11.length===22,JSON.stringify({all:all.length,p11:p11.length,non:all.length-p11.length}));
}
/* ---- 配線の固定: 継続のデータ版はクロージャを作る場所でしか作らない ---- */
{
  const src=processEventV27.toString()+processEventBatchV28.toString();
  ok('配線: EVT_RESUME_DATA_V484 を設定するのは processEventV27 と processEventBatchV28 だけ（クロージャ EVT_AFTER と同じ場所）',
     (src.match(/EVT_RESUME_DATA_V484=\{/g)||[]).length===2,String((src.match(/EVT_RESUME_DATA_V484=\{/g)||[]).length));
  const d=eventSelectionDescriptorV11.toString();
  ok('配線: eventSelectionDescriptorV11 は記録された resumeData を読み、待機中のプロセッサ unit の payload から再導出しない',
     /st\.resumeData/.test(d)&&!/processorWaiting/.test(d),d.slice(0,140));
  ok('配線: 非 P1.1 の発動経路（prepareDuelActivation）の CHAIN_ADD が eventResumeV11 を載せる',
     /eventResumeV11:opts\.eventSelectionV11\.resume/.test(prepareDuelActivation.toString()),'');
}

for(const m of MEMBERS){
  /* ===== 保存なしの通し実行 ===== */
  fresh(0);
  const x=m.setup();baselineA();
  m.go(x);
  const r1=drive(()=>onChain(m.name));
  ok(m.name+' 前提: '+m.ev+' の誘発がチェーンに乗る',onChain(m.name),JSON.stringify({drive:r1,chain:gameState.chain.map(l=>l.name)}));
  ok(m.name+' 前提: P1.1 宣言を持たない（この修正が直すのは非 P1.1 の経路）',
     !CARD_SCRIPTS[m.name].activationV11,'activationV11='+!!CARD_SCRIPTS[m.name].activationV11);
  ok(m.name+' 修正の核: 誘発がチェーンに乗った時点で、チェーン終了後の応答窓が状態として記録される（保存を跨げる形）',
     !!gameState.eventChainResumeV11&&gameState.eventChainResumeV11.processor===true&&
     !!gameState.eventChainResumeV11.postPoint&&gameState.eventChainResumeV11.postPoint.kind===m.want,
     JSON.stringify(gameState.eventChainResumeV11));
  const raw=savedRaw(),d0=v41StateDigest(gameState);
  drive();
  const opened=OPENED.slice(),enq=ENQ.slice(),fin=v41StateDigest(gameState);
  ok(m.name+' 保存なし: チェーン終了後に '+m.want+' の窓が作られ、相手の応答を待って実際に開く',
     enq.indexOf(m.want)>=0&&opened.indexOf(m.want)>=0,JSON.stringify({enq:enq,opened:opened}));
  audit(m.name+' 保存なし');
  globalThis.__SAVES[m.key]=JSON.stringify({raw:raw,d0:d0,final:fin,opened:opened,enq:enq,uid:x.c.uid});
}
`);

/* ================= VM2: 新しい VM で保存を読み込み、保存なしの通し実行と突き合わせる ================= */
const SAVES=first.__SAVES||{};
const KEYS=['AIRMAN','BREAKER','SNOWMAN','KNIGHT'];
if(KEYS.some(k=>!SAVES[k])){console.log('FAIL S03-U484 VM1 の保存が足りない: '+KEYS.filter(k=>!SAVES[k]).join(','));process.exitCode=2;}
else harness('const SAVES='+JSON.stringify(SAVES)+';'+COMMON+String.raw`
for(const m of MEMBERS){
  const S=JSON.parse(SAVES[m.key]);
  /* ===== 本題: チェーン上で保存 → 新しい VM → 再開 → 解決 ===== */
  const loaded=reload(S.raw);
  ok(m.name+' 再開: 保存した状態（誘発リンクがチェーン上）に戻る',
     loaded===true&&onChain(m.name)&&v41StateDigest(gameState)===S.d0,
     JSON.stringify({loaded:loaded,chain:gameState.chain.map(l=>l.name),digest:v41StateDigest(gameState)===S.d0}));
  ok(m.name+' 再開: 継続が状態として復元される（クロージャは新しい VM には存在しない）',
     CHAIN_AFTER_V2===null&&EVT_V2_STATE===null&&!!gameState.eventChainResumeV11&&
     !!gameState.eventChainResumeV11.postPoint&&gameState.eventChainResumeV11.postPoint.kind===m.want,
     JSON.stringify({after:CHAIN_AFTER_V2,evt:EVT_V2_STATE,resume:gameState.eventChainResumeV11}));
  drive();
  ok(m.name+' 再開: 作られた窓と開いた窓の並びが、保存なしの通し実行と完全に一致する',
     JSON.stringify(ENQ)===JSON.stringify(S.enq)&&JSON.stringify(OPENED)===JSON.stringify(S.opened),
     JSON.stringify({enq:ENQ,enqNoSave:S.enq,opened:OPENED,openedNoSave:S.opened}));
  ok(m.name+' 再開: '+m.want+' の窓が作られ、実際に開く（修正前はどちらも 0 回だった）',
     ENQ.indexOf(m.want)>=0&&OPENED.indexOf(m.want)>=0,JSON.stringify({enq:ENQ,opened:OPENED}));
  ok(m.name+' 再開: 最終 digest が保存なしの通し実行と一致する',v41StateDigest(gameState)===S.final,
     v41StateDigest(gameState)+' vs '+S.final);
  ok(m.name+' 再開: 継続は一度だけ使われて消える（窓が二重に開かない）',
     !gameState.eventChainResumeV11&&OPENED.filter(k=>k===m.want).length===S.opened.filter(k=>k===m.want).length,
     JSON.stringify({left:gameState.eventChainResumeV11||null,resumed:OPENED,noSave:S.opened}));
  audit(m.name+' 再開');

  /* ===== Negative control: 復元された継続を消すと、修正前と同じく窓が失われる ===== */
  reload(S.raw);
  delete gameState.eventChainResumeV11;
  drive();
  ok(m.name+' negative control: 復元された継続を消すと '+m.want+' の窓は作られず、開かない（これが修正前の挙動）',
     ENQ.indexOf(m.want)<0&&OPENED.indexOf(m.want)<0,JSON.stringify({enq:ENQ,opened:OPENED}));
}
`);
