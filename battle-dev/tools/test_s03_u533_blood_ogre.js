/* S03-U533 《血涙のオーガ》
   相手ターンの1度のバトルフェイズ中に2回目の直接攻撃が宣言された時に手札から特殊召喚し、
   攻守は1回目の直接攻撃を行った（今フィールドに表側表示で居る）モンスターと同じ数値になる。
   このターン、このカードが表側表示で存在する限り、相手はこのカード以外を攻撃対象に選択できない。

   当時裁定（判定と測定の根拠）
     WIKI-CA335BBCDE3B（09/11/14）必ず「2回目」の直接攻撃宣言時に発動する。
     WIKI-282E13E4E6E2（09/11/14）無効にされた攻撃は数えない。
     WIKI-731D9CDDB279（09/11/14）1回目と2回目が同じモンスターでもよい。
     WIKI-74A968D14816（09/11/14）1回目のモンスターが場に居なければ数値は 0 のまま。
     WIKI-4DE60F5423BC（09/12/09）《バトルフェーダー》とは同一チェーンでどちらか1枚だけ。
     WIKI-B7D547F31F70（09/12/12）変化した値は「元々の数値」ではない。

   場面
     A 形
     B 2回目の直接攻撃宣言時に特殊召喚し、1回目のモンスターと同じ攻守になる
     C 3回目の直接攻撃宣言時には発動できない（negative control）
     D 1回目の攻撃が無効にされた場合は数えない
     E 1回目のモンスターが表側表示で居ない場合は数値が変わらない
     F このターン、相手はこのカード以外を攻撃対象に選択できない
     G 《バトルフェーダー》と同一チェーンではどちらか1枚だけ
     H 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S533 = pathA.resolve(__dirname, '..');
const rdS533 = p => fsA.readFileSync(pathA.join(ROOT_S533, p), 'utf8');
const SRC_S533 = {
  'cards/HZZZZZZZZZZZZQ_claude_s03_u533_blood_ogre.js': rdS533('cards/HZZZZZZZZZZZZQ_claude_s03_u533_blood_ogre.js'),
  'engine/00_state_actions.js': rdS533('engine/00_state_actions.js'),
  'docs/S03_U533_REPORT.md': rdS533('docs/S03_U533_REPORT.md'),
  'tools/check.py': rdS533('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cardOf(uid){const h=findCardByUid(uid);return h?h.card:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[], RESPOND_WITH=[];
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
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];RESPOND_WITH=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=0;return c;}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){pick();continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    /* 攻撃宣言後に盤面が変わった場合のリプレイ：ここでは攻撃を中止する */
    if(typeof BATTLE_COMMAND_V29!=='undefined'&&BATTLE_COMMAND_V29&&BATTLE_COMMAND_V29.mode==='replayTarget'){
      battleReplayCancelV28();continue;}
    if(gameState.chainWindow&&gameState.chain.length){
      const pr=gameState.chainWindow.priority;
      let resp=[]; try{ resp=getChainResponsesV2(pr)||[]; }catch(e){ resp=[]; }
      const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
      if(want){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(want.card)),1);
        duelActivateResponseV2(pr,want.zone,want.index,want.ownerS03); continue;}
      chainPassV2(); continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){
      const pr=(w.payload&&w.payload.priority!=null)?w.payload.priority:gameState.activePlayer;
      let found=null, foundP=pr;
      [pr,1-pr].forEach(q=>{ if(found) return;
        let resp=[]; try{ resp=getChainResponsesV2(q)||[]; }catch(e){ resp=[]; }
        const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
        if(want){ found=want; foundP=q; } });
      if(found){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(found.card)),1);
        pointActivateV27(foundP,found.zone,found.index,found.ownerS03); continue;}
      pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function toFoeBattle(){phase('end');turn();phase('standby');phase('main1');return phase('battle');}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function directs(){return ((gameState.directAttacksS03||{}).list||[]).map(x=>x.uid);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['血涙のオーガ'];
const keys=nativeEffectsV4('血涙のオーガ').map(e=>e.key);
ok('A1 ★ 登録され、手札のクイックエフェクト・数値の誘発・攻撃対象の制限（永続）を持つ',
   keys.indexOf('hand-special')>=0 && keys.indexOf('copy-stats')>=0
   && sc.quickEffect===true && (sc.activateFrom||[]).indexOf('hand')>=0
   && typeof sc.continuous.cannotBeAttackTarget==='function'
   && ZONE_LOCAL_KEYS.indexOf('u533PendingS03')>=0,
   JSON.stringify({keys:keys}));
`, {expect:1});

/* ===== B. 2回目の直接攻撃宣言時 ===== */
harness(COMMON + String.raw`
fresh();
const ogre=mk('血涙のオーガ',0);
gameState.players[0].hand=[ogre];
const a1=mk('デーモンの召喚',1,'up'), a2=mk('ワイト',1,'up');
gameState.players[1].mz=[a1,a2];
baselineA();
toFoeBattle();
const t1=attack(1,0,'direct');            /* 1 回目の直接攻撃 */
const afterFirst=zu(ogre.uid);
RESPOND_WITH=['血涙のオーガ'];
const t2=attack(1,1,'direct');            /* 2 回目の直接攻撃宣言時に発動 */
const ho=findCardByUid(ogre.uid);
ok('B1 ★ 2回目の直接攻撃が宣言された時に手札から特殊召喚し、攻守は1回目のモンスター（2500/1200）と同じになる',
   t1==='idle' && t2==='idle' && afterFirst==='hand' && !!ho && ho.zone==='mz'
   && API.curAtk(ho)===2500 && curDEF(ho.card)===1200,
   JSON.stringify({afterFirst:afterFirst,ogre:zu(ogre.uid),atk:ho&&API.curAtk(ho),def:ho&&curDEF(ho.card),
     lp0:gameState.players[0].lp,mz0:mzNames(0)}));
audit('B1');
`, {expect:2});

/* ===== C. 3回目では発動できない ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-CA335BBCDE3B（09/11/14）: 必ず「2回目」の時に発動する。 */
const ogre=mk('血涙のオーガ',0);
gameState.players[0].hand=[ogre];
const a1=mk('ワイト',1,'up'), a2=mk('ワイト',1,'up'), a3=mk('ワイト',1,'up');
gameState.players[1].mz=[a1,a2,a3];
baselineA();
toFoeBattle();
attack(1,0,'direct');
attack(1,1,'direct');                     /* 2 回目は発動しない（パスする） */
const t3=attack(1,2,'direct');            /* 3 回目 */
ok('C1 ★ negative control: 3回目の直接攻撃宣言時には発動できない',
   t3==='idle' && zu(ogre.uid)==='hand' && directs().length===3,
   JSON.stringify({ogre:zu(ogre.uid),directs:directs().length,lp0:gameState.players[0].lp}));
audit('C1');
`, {expect:2});

/* ===== D. 無効にされた攻撃は数えない ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-282E13E4E6E2（09/11/14）: 無効にされた攻撃は数えない。
   1 回目を《和睦の使者》ではなく《魔法の筒》で無効にし、次の宣言が「1回目」になる事を測る。 */
const ogre=mk('血涙のオーガ',0);
gameState.players[0].hand=[ogre];
const cyl=setc('魔法の筒',0);
gameState.players[0].sz=[cyl];
const a1=mk('ワイト',1,'up'), a2=mk('ワイト',1,'up'), a3=mk('ワイト',1,'up');
gameState.players[1].mz=[a1,a2,a3];
baselineA();
toFoeBattle();
RESPOND_WITH=['魔法の筒'];
attack(1,0,'direct');                     /* 無効にされる → 数えない */
const afterNegate=directs().length;
RESPOND_WITH=['血涙のオーガ'];
attack(1,1,'direct');                     /* これが「1回目」なので発動できない */
const afterSecond=zu(ogre.uid);
RESPOND_WITH=['血涙のオーガ'];
const t=attack(1,2,'direct');             /* これが「2回目」なので発動できる */
ok('D1 ★ WIKI-282E13E4E6E2（09/11/14）: 無効にされた直接攻撃は数えない（次の宣言が1回目になる）',
   t==='idle' && afterNegate===0 && afterSecond==='hand' && zu(ogre.uid)==='mz',
   JSON.stringify({afterNegate:afterNegate,afterSecond:afterSecond,ogre:zu(ogre.uid),
     directs:directs().length,lp1:gameState.players[1].lp}));
audit('D1');
`, {expect:2});

/* ===== E. 1回目のモンスターが表側表示で居ない場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-74A968D14816（09/11/14）: 1回目のモンスターが場に居なければ数値は 0 のまま。
   1 回目の後に《月の書》で裏側守備表示にする。 */
const ogre=mk('血涙のオーガ',0);
gameState.players[0].hand=[ogre];
const book=setc('月の書',0);
gameState.players[0].sz=[book];
const a1=mk('デーモンの召喚',1,'up'), a2=mk('ワイト',1,'up');
gameState.players[1].mz=[a1,a2];
baselineA();
toFoeBattle();
attack(1,0,'direct');
PREFER=[a1.uid];
duelActivateFromZone(0,'sz',findCardByUid(book.uid).index,{});
drive();
const faceDown=cardOf(a1.uid).face==='down';
RESPOND_WITH=['血涙のオーガ'];
const t=attack(1,1,'direct');
const ho=findCardByUid(ogre.uid);
ok('E1 ★ WIKI-74A968D14816（09/11/14）: 1回目のモンスターが表側表示で居ない場合、攻守は 0 のまま',
   t==='idle' && faceDown && !!ho && ho.zone==='mz' && API.curAtk(ho)===0 && curDEF(ho.card)===0,
   JSON.stringify({faceDown:faceDown,ogre:zu(ogre.uid),atk:ho&&API.curAtk(ho),def:ho&&curDEF(ho.card)}));
audit('E1');
`, {expect:2});

/* ===== F. 攻撃対象の制限 ===== */
harness(COMMON + String.raw`
fresh();
/* 直接攻撃を 2 回させるため自分の場は空にしておき、オーガが出た後に
   《リビングデッドの呼び声》でもう 1 体出して、そのモンスターを攻撃対象に選べない事を測る。 */
const ogre=mk('血涙のオーガ',0);
gameState.players[0].hand=[ogre];
const call=setc('リビングデッドの呼び声',0);
gameState.players[0].sz=[call];
const buried=mk('ワイト',0);
gameState.players[0].grave=[buried];
const a1=mk('デーモンの召喚',1,'up'), a2=mk('ワイト',1,'up'), a3=mk('ワイト',1,'up');
gameState.players[1].mz=[a1,a2,a3];
baselineA();
toFoeBattle();
attack(1,0,'direct');
RESPOND_WITH=['血涙のオーガ'];
attack(1,1,'direct');
const summoned=zu(ogre.uid)==='mz';
PREFER=[buried.uid];
duelActivateFromZone(0,'sz',findCardByUid(call.uid).index,{});
const t0=drive();
const revived=zu(buried.uid)==='mz';
const whyOther=attackTargetForbiddenReasonS03(1,cardOf(buried.uid),cardOf(a3.uid));
const whyOgre=attackTargetForbiddenReasonS03(1,cardOf(ogre.uid),cardOf(a3.uid));
TOASTS.length=0;
const t=attack(1,2,findCardByUid(buried.uid).index);   /* オーガ以外を攻撃対象にできない */
ok('F1 ★ このターン、相手はこのカード以外のモンスターを攻撃対象に選択できない',
   t0==='idle' && t==='idle' && summoned && revived && !!whyOther && !whyOgre
   && zu(buried.uid)==='mz',
   JSON.stringify({summoned:summoned,revived:revived,other:String(whyOther||'').slice(0,40),
     ogre:String(whyOgre||''),toasts:TOASTS.slice(0,2),mz0:mzNames(0)}));
audit('F1');
`, {expect:2});

/* ===== G. 《バトルフェーダー》と同一チェーン ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-4DE60F5423BC（09/12/09）: 同一チェーン上ではどちらか1枚しか発動できない。 */
const ogre=mk('血涙のオーガ',0), fader=mk('バトルフェーダー',0);
gameState.players[0].hand=[ogre,fader];
const a1=mk('ワイト',1,'up'), a2=mk('ワイト',1,'up');
gameState.players[1].mz=[a1,a2];
baselineA();
toFoeBattle();
attack(1,0,'direct');
RESPOND_WITH=['バトルフェーダー'];
const t=attack(1,1,'direct');
ok('G1 ★ WIKI-4DE60F5423BC（09/12/09）: 《バトルフェーダー》を同一チェーンで発動した場合、このカードは発動できない',
   t==='idle' && zu(fader.uid)==='mz' && zu(ogre.uid)==='hand',
   JSON.stringify({fader:zu(fader.uid),ogre:zu(ogre.uid),mz0:mzNames(0),phase:gameState.phase}));
audit('G1');
`, {expect:2});

/* ===== H. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S533['cards/HZZZZZZZZZZZZQ_claude_s03_u533_blood_ogre.js'];
const engSrc = SRC_S533['engine/00_state_actions.js'];
const doc = SRC_S533['docs/S03_U533_REPORT.md'];
okJs('H1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-BF4C6CA54276','WIKI-CA335BBCDE3B','WIKI-282E13E4E6E2','WIKI-9CAF81C756A1','WIKI-731D9CDDB279',
   'WIKI-74A968D14816','WIKI-4FF24E124B14','WIKI-B7D547F31F70','WIKI-4DE60F5423BC'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('H2 ★ 共通側の記録に、無効にされた攻撃を数えない理由が書かれている',
  engSrc.indexOf('WIKI-282E13E4E6E2') >= 0 && engSrc.indexOf('directAttacksS03') >= 0);
okJs('H3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-282E13E4E6E2') >= 0 && doc.indexOf('未対応') >= 0);
okJs('H4 ★ このテストが tools/check.py に登録されている',
  SRC_S533['tools/check.py'].indexOf('test_s03_u533_blood_ogre.js') >= 0);
