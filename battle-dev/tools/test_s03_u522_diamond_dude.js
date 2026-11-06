/* S03-U522: D－HERO ダイヤモンドガイ（カード実装）と、墓地からの発動の動的な許可（engine/1ZZZA）。

   《D－HERO ダイヤモンドガイ》（NOT_STARTED・星4）
     ①:1ターンに1度、自分メインフェイズに発動できる。自分のデッキの一番上のカードをめくり、
     それが通常魔法カードだった場合、そのカードを墓地へ送る。違った場合、そのカードをデッキの一番下に戻す。
     この効果で通常魔法カードを墓地へ送った場合、次の自分ターンのメインフェイズに
     墓地のその通常魔法カードの発動時の効果を発動できる。

   当時裁定（回答日つき）
     WIKI-D82AA70AF049（回答日なし）起動効果なので自分のターンだけ。
     WIKI-EF0F11F0F5B7（2006-02-16）次の自分のターンにこのカードが場に無くても処理する。
     WIKI-7C1EE634F520（2006-02-16）発動しない事もでき、それ以降のターンには使えない。
     WIKI-0855121F0A77（2006-02-16）次の自分のメインフェイズならいつでもよい。
     WIKI-4FC1C763D881（2006-02-16）複数枚めくった場合は複数枚発動できる。
     WIKI-F23294BA0134（2006-02-16）その効果は魔法効果。
     WIKI-62E4A0F1CA35（2006-02-16）その通常魔法が墓地を離れていると発動できない。

   固定するもの:
     A 形（登録・engine の許可の仕組み）
     B めくったのが通常魔法なら墓地へ送り、そのターンはまだ発動できない
     C 次の自分のメインフェイズに墓地のその魔法を本当に発動でき、許可は 1 回で消える
     D その次のターンには発動できない（negative control）
     E 通常魔法でなければデッキの一番下へ戻り、許可も付かない（negative control）
     F 1ターンに1度（negative control）
     G ダイヤモンドガイが場を離れても発動できる
     H Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S522 = pathA.resolve(__dirname, '..');
const rdS522 = p => fsA.readFileSync(pathA.join(ROOT_S522, p), 'utf8');
const SRC_S522 = {
  'cards/HZZZZZZZZZZZZF_claude_s03_u522_diamond_dude.js': rdS522('cards/HZZZZZZZZZZZZF_claude_s03_u522_diamond_dude.js'),
  'engine/1ZZZA_grave_activation_grant_s03.js': rdS522('engine/1ZZZA_grave_activation_grant_s03.js'),
  'docs/S03_U522_REPORT.md': rdS522('docs/S03_U522_REPORT.md'),
  'tools/check.py': rdS522('tools/check.py')
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
  gameState.rngInitialSeed=gameState.rngState=0x4961011;}
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
/* 自分の次の手番のメインフェイズまで進める（ドロー→スタンバイ→メイン1） */
function nextOwnMain(){
  phase('end');turn();                   /* 相手のターンへ */
  phase('standby');phase('main1');
  phase('end');turn();                   /* 自分のターンへ */
  phase('standby');return phase('main1');
}
function useMz(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function graveIdx(p,uid){return (gameState.players[p].grave||[]).findIndex(c=>c&&c.uid===uid);}
function graveActs(p,uid){const i=graveIdx(p,uid);if(i<0)return [];return pileDuelActionsV370(p,'grave',i).map(a=>a.id);}
function useGrave(p,uid){const i=graveIdx(p,uid);TOASTS.length=0;duelActivateFromZone(p,'grave',i,{});return drive();}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function deckNames(p){return (gameState.players[p].deck||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、1ターンに1度の起動効果として宣言されている。'
   +'墓地からの発動の許可は engine 側（プレイヤーの effectFlags・uid とターンで引く・1回で消える）',
   !!CARD_SCRIPTS['D－HERO ダイヤモンドガイ']
   && CARD_SCRIPTS['D－HERO ダイヤモンドガイ'].countLimit===1
   && (CARD_SCRIPTS['D－HERO ダイヤモンドガイ'].timing||[]).indexOf('mainPhase')>=0
   && typeof grantGraveActivationS03==='function'
   && typeof graveActivationGrantedS03==='function'
   && typeof consumeGraveActivationGrantS03==='function',
   JSON.stringify({cl:CARD_SCRIPTS['D－HERO ダイヤモンドガイ'].countLimit}));
`, {expect:1});

/* ===== B / C / D. めくって墓地へ → 次の自分のメインフェイズに発動 → その次は不可 ===== */
harness(COMMON + String.raw`
fresh();
const dude=mk('D－HERO ダイヤモンドガイ',0,'up');
gameState.players[0].mz=[dude];
const pot=mk('強欲な壺',0);
gameState.players[0].deck=[pot].concat(Array.from({length:12},()=>mk('ワイト',0)));
gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));
gameState.players[0].hand=[];
baselineA();
const t1=useMz(0,dude);
const sameTurn=graveActs(0,pot.uid);
ok('B1 ★ めくったのが通常魔法なら墓地へ送る。そのターンはまだ墓地から発動できない',
   t1==='idle' && zu(pot.uid)==='grave' && sameTurn.indexOf('effect')<0,
   JSON.stringify({pot:zu(pot.uid),acts:sameTurn,grave:graveNames(0),toasts:TOASTS.slice(0,2)}));
const tn=nextOwnMain();
const handBefore=(gameState.players[0].hand||[]).length;
const nowActs=graveActs(0,pot.uid);
const t2=useGrave(0,pot.uid);
const afterActs=graveActs(0,pot.uid);
ok('C1 ★ 次の自分のメインフェイズに墓地のその通常魔法を本当に発動でき（発動時の効果が適用されて 2 枚ドロー）、'
   +'許可は 1 回で消える',
   tn==='idle' && t2==='idle' && nowActs.indexOf('effect')>=0
   && (gameState.players[0].hand||[]).length===handBefore+2 && afterActs.indexOf('effect')<0,
   JSON.stringify({now:nowActs,after:afterActs,hand:handBefore+' -> '+(gameState.players[0].hand||[]).length,
     turn:gameState.turn}));
audit('C1');
`, {expect:3});

harness(COMMON + String.raw`
fresh();
/* WIKI-7C1EE634F520（06/02/16）: 発動しなければ、それ以降のターンには使えない。 */
const dude=mk('D－HERO ダイヤモンドガイ',0,'up');
gameState.players[0].mz=[dude];
const pot=mk('強欲な壺',0);
gameState.players[0].deck=[pot].concat(Array.from({length:12},()=>mk('ワイト',0)));
gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));
baselineA();
useMz(0,dude);
nextOwnMain();
const onTime=graveActs(0,pot.uid);
nextOwnMain();
const tooLate=graveActs(0,pot.uid);
ok('D1 ★ WIKI-7C1EE634F520（06/02/16）: 発動しなければ、その次のターン以降は墓地から発動できない',
   onTime.indexOf('effect')>=0 && tooLate.indexOf('effect')<0,
   JSON.stringify({onTime:onTime,tooLate:tooLate,turn:gameState.turn}));
`, {expect:1});

/* ===== E. 通常魔法でない場合 ===== */
harness(COMMON + String.raw`
fresh();
const dude=mk('D－HERO ダイヤモンドガイ',0,'up');
gameState.players[0].mz=[dude];
const top=mk('デーモンの召喚',0);
gameState.players[0].deck=[top].concat(Array.from({length:12},()=>mk('ワイト',0)));
gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));
baselineA();
const t1=useMz(0,dude);
const last=(gameState.players[0].deck||[]).length-1;
ok('E1 ★ negative control: めくったのが通常魔法でなければデッキの一番下に戻り、墓地へも行かない',
   t1==='idle' && zu(top.uid)==='deck'
   && (gameState.players[0].deck||[])[last]===findCardByUid(top.uid).card
   && (gameState.players[0].grave||[]).length===0,
   JSON.stringify({top:zu(top.uid),bottom:nmOf((gameState.players[0].deck||[])[last]),
     grave:graveNames(0)}));
const tn=nextOwnMain();
ok('E2 ★ negative control: 許可も付かないので、次の自分のメインフェイズにも墓地から発動できない'
   +'（そもそも墓地に無い）',
   tn==='idle' && graveIdx(0,top.uid)<0,
   JSON.stringify({idx:graveIdx(0,top.uid)}));
audit('E1');
`, {expect:3});

/* ===== F. 1ターンに1度 ===== */
harness(COMMON + String.raw`
fresh();
const dude=mk('D－HERO ダイヤモンドガイ',0,'up');
gameState.players[0].mz=[dude];
gameState.players[0].deck=[mk('強欲な壺',0),mk('強欲な壺',0)].concat(Array.from({length:10},()=>mk('ワイト',0)));
gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));
baselineA();
const t1=useMz(0,dude);
const after1=(gameState.players[0].grave||[]).length;
const t2=useMz(0,dude);
ok('F1 ★ negative control: 1ターンに1度なので 2 回目は発動できない',
   t1==='idle' && t2==='idle' && after1===1 && (gameState.players[0].grave||[]).length===1,
   JSON.stringify({grave:graveNames(0),toasts:TOASTS.slice(0,2)}));
`, {expect:1});

/* ===== G. 場を離れても発動できる ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-EF0F11F0F5B7（06/02/16）: 次の自分のターンにこのカードが場に無くても処理する。 */
const dude=mk('D－HERO ダイヤモンドガイ',0,'up');
gameState.players[0].mz=[dude];
const pot=mk('強欲な壺',0);
gameState.players[0].deck=[pot].concat(Array.from({length:12},()=>mk('ワイト',0)));
gameState.players[1].deck=Array.from({length:12},()=>mk('ワイト',1));
gameState.players[0].hand=[mk('ブラック・ホール',0)];
baselineA();
useMz(0,dude);
/* 自分の《ブラック・ホール》でダイヤモンドガイを巻き込んで墓地へ送る */
duelActivateFromHand(0);
const tBH=drive();
const tn=nextOwnMain();
const handBefore=(gameState.players[0].hand||[]).length;
const acts=graveActs(0,pot.uid);
const t2=useGrave(0,pot.uid);
ok('G1 ★ WIKI-EF0F11F0F5B7（06/02/16）: ダイヤモンドガイが場を離れていても、'
   +'次の自分のメインフェイズに墓地のその通常魔法を発動できる',
   tBH==='idle' && tn==='idle' && t2==='idle'
   && zu(dude.uid)==='grave' && acts.indexOf('effect')>=0
   && (gameState.players[0].hand||[]).length===handBefore+2,
   JSON.stringify({dude:zu(dude.uid),acts:acts,hand:handBefore+' -> '+(gameState.players[0].hand||[]).length}));
audit('G1');
`, {expect:2});

/* ===== H. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S522['cards/HZZZZZZZZZZZZF_claude_s03_u522_diamond_dude.js'];
const engSrc = SRC_S522['engine/1ZZZA_grave_activation_grant_s03.js'];
const doc = SRC_S522['docs/S03_U522_REPORT.md'];
okJs('H1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-D82AA70AF049', 'WIKI-EF0F11F0F5B7', 'WIKI-7C1EE634F520', 'WIKI-0855121F0A77',
   'WIKI-4FC1C763D881', 'WIKI-F23294BA0134', 'WIKI-62E4A0F1CA35', 'WIKI-A38C1B14F167'].every(id => cardSrc.indexOf(id) >= 0));
okJs('H2 ★ engine 側の許可は、なぜその形なのかを裁定 ID つきで書いている',
  engSrc.indexOf('WIKI-EF0F11F0F5B7') >= 0 && engSrc.indexOf('WIKI-7C1EE634F520') >= 0
  && engSrc.indexOf('function grantGraveActivationS03') >= 0);
okJs('H3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-F23294BA0134') >= 0 && doc.indexOf('大寒波') >= 0);
okJs('H4 ★ このテストが tools/check.py に登録されている',
  SRC_S522['tools/check.py'].indexOf('test_s03_u522_diamond_dude.js') >= 0);
