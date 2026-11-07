/* S03-U530 《テュアラティン》
   相手のバトルフェイズ中、バトルフェイズ開始時に居た自分のモンスター（2体以上）が全て戦闘で破壊され
   墓地へ送られた時に手札から特殊召喚し、属性を1つ宣言してその属性のモンスターを全て破壊する。
   その後、このカードが表側表示で存在する限り、相手は宣言された属性のモンスターを召喚・特殊召喚できない。

   当時裁定（判定と測定の根拠）
     WIKI-6262167F5175 / WIKI-4CDE65C5B0A5 最後の 1 体が破壊された時に特殊召喚できる。
     WIKI-323A76C20CAD 戦闘以外で墓地へ行ったモンスターが 1 体でもいたら特殊召喚できない。
     WIKI-ED7E3C19B11C（09/12/13）バトルフェイズ開始時に手札に無ければ、その後に加わっても特殊召喚できない。
     WIKI-11583ED612D9 宣言した属性にこのカード自身が含まれる場合、自分も破壊される。
     WIKI-F2CBC0269F5E（08/12/26）神属性も宣言できる。
     WIKI-4DCA769F6F52（10/05/07）封印はその時のコントローラーから見た相手に適用される。

   場面
     A 形
     B 2 体が戦闘で破壊された時に特殊召喚し、宣言した属性を全て破壊する
     C 宣言した属性が自分の属性なら自身も破壊される
     D 封印（相手は宣言された属性を召喚・特殊召喚できない／別の属性はできる）
     E negative control（開始時 1 体だけ／戦闘以外で墓地へ行った／開始時に手札に無い）
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S530 = pathA.resolve(__dirname, '..');
const rdS530 = p => fsA.readFileSync(pathA.join(ROOT_S530, p), 'utf8');
const SRC_S530 = {
  'cards/HZZZZZZZZZZZZN_claude_s03_u530_tualatin.js': rdS530('cards/HZZZZZZZZZZZZN_claude_s03_u530_tualatin.js'),
  'docs/S03_U530_REPORT.md': rdS530('docs/S03_U530_REPORT.md'),
  'tools/check.py': rdS530('tools/check.py')
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
      let resp=[]; try{ resp=getChainResponsesV2(pr)||[]; }catch(e){ resp=[]; }
      const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
      if(want){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(want.card)),1);
        pointActivateV27(pr,want.zone,want.index,want.ownerS03); continue;}
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
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['テュアラティン'];
const keys=nativeEffectsV4('テュアラティン').map(e=>e.key);
ok('A1 ★ 登録され、手札からの特殊召喚と宣言・全体破壊の 2 つの効果、召喚封印の申告を持つ',
   keys.indexOf('hand-special')>=0 && keys.indexOf('declare-destroy')>=0
   && typeof sc.summonLockS03==='function'
   && ZONE_LOCAL_KEYS.indexOf('u530LockAttrS03')>=0 && ZONE_LOCAL_KEYS.indexOf('u530PendingS03')>=0,
   JSON.stringify({keys:keys}));
`, {expect:1});

/* ===== B. 2 体が戦闘で破壊された時 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-6262167F5175 / WIKI-4CDE65C5B0A5: 最後の 1 体が破壊された時に特殊召喚できる。 */
const tua=mk('テュアラティン',0);
const mine1=mk('ワイト',0,'up'), mine2=mk('ワイト',0,'up');
const foe1=mk('デーモンの召喚',1,'up'), foe2=mk('デーモンの召喚',1,'up');
gameState.players[0].hand=[tua];
gameState.players[0].mz=[mine1,mine2];
gameState.players[1].mz=[foe1,foe2];
baselineA();
toFoeBattle();
const t1=attack(1,0,0);
const afterFirst=zu(tua.uid);
PREFER=['闇'];
const t2=attack(1,1,0);
ok('B1 ★ バトルフェイズ開始時の 2 体が全て戦闘で破壊された時に手札から特殊召喚し、'
   +'宣言した闇属性のモンスターを全て破壊する（自身は光属性なので残る）',
   t1==='idle' && t2==='idle' && afterFirst==='hand' && zu(tua.uid)==='mz'
   && zu(foe1.uid)==='grave' && zu(foe2.uid)==='grave'
   && zu(mine1.uid)==='grave' && zu(mine2.uid)==='grave',
   JSON.stringify({afterFirst:afterFirst,tua:zu(tua.uid),foe1:zu(foe1.uid),foe2:zu(foe2.uid),
     mz0:mzNames(0),mz1:mzNames(1),titles:TITLES.slice(0,3)}));
audit('B1');
`, {expect:2});

/* ===== C. 自身も破壊される宣言 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-11583ED612D9: 宣言した属性にこのカード自身（光）が含まれる場合、自分も破壊される。 */
const tua=mk('テュアラティン',0);
const mine1=mk('ワイト',0,'up'), mine2=mk('ワイト',0,'up');
const foe1=mk('デーモンの召喚',1,'up'), foe2=mk('デーモンの召喚',1,'up');
const foeLight=mk('シャインエンジェル',1,'up');
gameState.players[0].hand=[tua];
gameState.players[0].mz=[mine1,mine2];
gameState.players[1].mz=[foe1,foe2,foeLight];
baselineA();
toFoeBattle();
attack(1,0,0);
PREFER=['光'];
const t2=attack(1,1,0);
ok('C1 ★ WIKI-11583ED612D9: 光属性を宣言すると、相手の光属性モンスターとともにこのカード自身も破壊される',
   t2==='idle' && zu(tua.uid)==='grave' && zu(foeLight.uid)==='grave'
   && zu(foe1.uid)==='mz' && zu(foe2.uid)==='mz',
   JSON.stringify({tua:zu(tua.uid),foeLight:zu(foeLight.uid),mz1:mzNames(1),titles:TITLES.slice(0,3)}));
audit('C1');
`, {expect:2});

/* ===== D. 封印 ===== */
harness(COMMON + String.raw`
fresh();
/* 宣言した属性のモンスターは相手が召喚・特殊召喚できない（別の属性はできる）。 */
const tua=mk('テュアラティン',0);
const mine1=mk('ワイト',0,'up'), mine2=mk('ワイト',0,'up');
const foe1=mk('カードガンナー',1,'up'), foe2=mk('カードガンナー',1,'up');
gameState.players[0].hand=[tua];
gameState.players[0].mz=[mine1,mine2];
gameState.players[1].mz=[foe1,foe2];
gameState.players[1].hand=[mk('デーモンの召喚',1),mk('シャインエンジェル',1)];
baselineA();
toFoeBattle();
attack(1,0,0);
PREFER=['闇'];
attack(1,1,0);
const locked=zu(tua.uid)==='mz' && String(cardOf(tua.uid).u530LockAttrS03)==='闇';
phase('main2');
TOASTS.length=0;
const darkWhy=v46FaceUpSummonRestrictionReason(1,dbOf(gameState.players[1].hand[handIdx(1,'デーモンの召喚')]),'normal');
const lightWhy=v46FaceUpSummonRestrictionReason(1,dbOf(gameState.players[1].hand[handIdx(1,'シャインエンジェル')]),'normal');
const t=drive();
ok('D1 ★ 宣言された闇属性は相手が召喚できず、別の属性（光）は召喚できる',
   t==='idle' && locked===true && !!darkWhy && !lightWhy,
   JSON.stringify({locked:locked,dark:String(darkWhy||'').slice(0,30),light:String(lightWhy||'')}));
audit('D1');
`, {expect:2});

/* ===== E. negative control ===== */
harness(COMMON + String.raw`
fresh();
/* 開始時にモンスターが 1 体だけなら発動できない。 */
const tua=mk('テュアラティン',0);
const mine1=mk('ワイト',0,'up');
const foe1=mk('デーモンの召喚',1,'up');
gameState.players[0].hand=[tua];
gameState.players[0].mz=[mine1];
gameState.players[1].mz=[foe1];
baselineA();
toFoeBattle();
const t1=attack(1,0,0);
ok('E1 ★ negative control: バトルフェイズ開始時のモンスターが 1 体だけなら特殊召喚できない',
   t1==='idle' && zu(tua.uid)==='hand' && (gameState.players[0].mz||[]).length===0,
   JSON.stringify({tua:zu(tua.uid),mz0:mzNames(0)}));
audit('E1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-323A76C20CAD: 戦闘以外で墓地へ行ったモンスターが 1 体でもいたら特殊召喚できない
   （1 体目を《地砕き》で破壊してから、もう 1 体を戦闘で破壊する）。 */
const tua=mk('テュアラティン',0);
const mine1=mk('ワイト',0,'up'), mine2=mk('デーモンの召喚',0,'up');
const foe1=mk('デーモンの召喚',1,'up');
gameState.players[0].hand=[tua];
gameState.players[0].mz=[mine1,mine2];
gameState.players[1].mz=[foe1];
gameState.players[1].hand=[mk('地砕き',1)];
baselineA();
phase('end');turn();phase('standby');phase('main1');
PREFER=[mine2.uid];
TOASTS.length=0;duelActivateFromHand(handIdx(1,'地砕き'));drive();
const killedByEffect=zu(mine2.uid)==='grave';
phase('battle');
const t1=attack(1,0,0);
ok('E2 ★ WIKI-323A76C20CAD: 戦闘以外で墓地へ行ったモンスターがいる場合は特殊召喚できない',
   t1==='idle' && killedByEffect && zu(mine1.uid)==='grave' && zu(tua.uid)==='hand',
   JSON.stringify({byEffect:killedByEffect,mine1:zu(mine1.uid),tua:zu(tua.uid),mz0:mzNames(0)}));
audit('E2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-ED7E3C19B11C（09/12/13）: バトルフェイズ開始時に手札に無く、その後《強欲な瓶》で引いた場合は
   特殊召喚できない。 */
const tua=mk('テュアラティン',0);
const mine1=mk('ワイト',0,'up'), mine2=mk('ワイト',0,'up');
const foe1=mk('デーモンの召喚',1,'up'), foe2=mk('デーモンの召喚',1,'up');
const jar=setc('強欲な瓶',0);
gameState.players[0].hand=[];
gameState.players[0].mz=[mine1,mine2];
gameState.players[0].sz=[jar];
gameState.players[0].deck=[tua].concat(Array.from({length:10},()=>mk('ワイト',0)));
gameState.players[1].mz=[foe1,foe2];
baselineA();
toFoeBattle();
attack(1,0,0);
/* 1 体目と 2 体目の間に引く（WIKI-F56FBA56619D と同じ場面） */
duelActivateResponseV2(0,'sz',findCardByUid(jar.uid).index,0);
const t0=drive();
const drawn=zu(tua.uid)==='hand';
const t1=attack(1,1,0);
ok('E3 ★ WIKI-ED7E3C19B11C（09/12/13）: バトルフェイズ開始時に手札に無ければ、その後引いても特殊召喚できない',
   t0==='idle' && t1==='idle' && drawn===true && zu(tua.uid)==='hand'
   && (gameState.players[0].mz||[]).length===0,
   JSON.stringify({drawn:drawn,tua:zu(tua.uid),mz0:mzNames(0),hand0:(gameState.players[0].hand||[]).map(nmOf)}));
audit('E3');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S530['cards/HZZZZZZZZZZZZN_claude_s03_u530_tualatin.js'];
const doc = SRC_S530['docs/S03_U530_REPORT.md'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-6262167F5175','WIKI-4CDE65C5B0A5','WIKI-323A76C20CAD','WIKI-ED7E3C19B11C','WIKI-11583ED612D9',
   'WIKI-F2CBC0269F5E','WIKI-4DCA769F6F52'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('F2 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-ED7E3C19B11C') >= 0 && doc.indexOf('未対応') >= 0);
okJs('F3 ★ このテストが tools/check.py に登録されている',
  SRC_S530['tools/check.py'].indexOf('test_s03_u530_tualatin.js') >= 0);
