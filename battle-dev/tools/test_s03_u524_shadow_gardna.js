/* S03-U524: サイバー・シャドー・ガードナー（カード実装）。

   《サイバー・シャドー・ガードナー》（NOT_STARTED・永続罠）
     相手のメインフェイズ時に発動できる。このカードは発動後モンスターカード(機械族・地・星4・攻/守?)となり、
     自分のモンスターカードゾーンに特殊召喚する。
     このカードを攻撃対象とした相手モンスターの攻撃宣言時、このカードの攻撃力・守備力は相手攻撃モンスターと
     同じ数値になる。このカードは相手のエンドフェイズ時に魔法&罠カードゾーンにセットされる。
     このカードは罠カードとしても扱う。

   当時裁定（回答日つき）
     WIKI-1D20AFD4E3D6（2010-08-31）変化した攻撃力・守備力は元々の数値として扱う。
     WIKI-3B285A5D988E（2010-08-31）《収縮》《巨大化》は変化した後の数値の半分・倍になる。
     WIKI-86265C2E44AE（2009-06-12）生存した場合、ダメージステップ終了後も変化した数値のまま。
     WIKI-05116421EE18（2009-08-30）2 体目が攻撃宣言した時は 2 体目の攻撃力になる。
     WIKI-502486CEABE6（2010-06-18）/ WIKI-99CF1034A52C（2010-09-06）攻守の変動はチェーンブロックを作る。
     WIKI-D56999420D78（2009-02-09）セットされる時もチェーンブロックを作る。
     WIKI-801C30BE612F（回答日なし）破壊されて墓地へ送られた場合はセットされない。
     WIKI-33529E04EA15（回答日なし）この効果は対象を取らない。

   固定するもの:
     A 形（登録・宣言）
     B 相手のメインフェイズに発動して罠モンスターになる（自分のターンには発動できない）
     C 攻撃宣言時に攻守が攻撃モンスターと同じになる（守備表示なら破壊されない・2 体目で上書き・
       ダメージステップ後も残る・《収縮》は変化後の数値に掛かる）
     D 相手のエンドフェイズに魔法＆罠ゾーンにセットされる（破壊されていたらセットされない）
     E Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S524 = pathA.resolve(__dirname, '..');
const rdS524 = p => fsA.readFileSync(pathA.join(ROOT_S524, p), 'utf8');
const SRC_S524 = {
  'cards/HZZZZZZZZZZZZH_claude_s03_u524_shadow_gardna.js': rdS524('cards/HZZZZZZZZZZZZH_claude_s03_u524_shadow_gardna.js'),
  'docs/S03_U524_REPORT.md': rdS524('docs/S03_U524_REPORT.md'),
  'tools/check.py': rdS524('tools/check.py')
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
function toFoeMain(){phase('end');turn();phase('standby');return phase('main1');}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function szNames(p){return (gameState.players[p].sz||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 登録され、攻撃宣言時とエンドフェイズの誘発を宣言している（どちらも強制）',
   !!CARD_SCRIPTS['サイバー・シャドー・ガードナー']
   && CARD_SCRIPTS['サイバー・シャドー・ガードナー'].forced===true
   && typeof CARD_SCRIPTS['サイバー・シャドー・ガードナー'].passive.onAttackDeclare==='function'
   && typeof CARD_SCRIPTS['サイバー・シャドー・ガードナー'].passive.onEndPhase==='function'
   && ZONE_LOCAL_KEYS.indexOf('u524ShadowStatS03')>=0,
   JSON.stringify({forced:CARD_SCRIPTS['サイバー・シャドー・ガードナー'].forced}));
`, {expect:1});

/* ===== B. 相手のメインフェイズに発動して罠モンスターになる ===== */
harness(COMMON + String.raw`
fresh();
const guard=setc('サイバー・シャドー・ガードナー',0);
gameState.players[0].sz=[guard];
baselineA();
const tSelf=useCard(0,guard);   /* 自分のメインフェイズでは発動できない */
const stillSet=zu(guard.uid)==='sz' && cardOf(guard.uid).face==='down';
toFoeMain();
PREFER=['def'];
const tFoe=useCard(0,guard);
const now=cardOf(guard.uid);
ok('B1 ★ 自分のメインフェイズには発動できず、相手のメインフェイズに発動して'
   +'機械族・地・星4の罠モンスターになる（攻守は ? = 0 から始まる）',
   tSelf==='idle' && stillSet && tFoe==='idle' && zu(guard.uid)==='mz'
   && dbOf(now).k==='m' && dbOf(now).ra==='機械' && dbOf(now).at==='地' && Number(dbOf(now).lv)===4
   && curATK(now)===0 && isTrapCardS03(now)===true,
   JSON.stringify({zone:zu(guard.uid),k:dbOf(now).k,ra:dbOf(now).ra,lv:dbOf(now).lv,
     atk:curATK(now),pos:now.pos,titles:TITLES.slice(0,3),toasts:TOASTS.slice(0,2)}));
audit('B1');
`, {expect:2});

/* ===== C. 攻撃宣言時の攻守 ===== */
harness(COMMON + String.raw`
fresh();
/* 攻撃力2500のモンスターに攻撃宣言された場合、攻守が 2500 になるので「相打ち・戦闘ダメージ0」になる。
   数値が変わっていなければ（攻守0のまま）このカードだけが破壊されて 2500 のダメージを受ける。 */
const guard=setc('サイバー・シャドー・ガードナー',0);
gameState.players[0].sz=[guard];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
baselineA();
toFoeMain();
useCard(0,guard);
const beforeAtk=curATK(cardOf(guard.uid));
phase('battle');
const t1=attack(1,0,0);
ok('C1 ★ 攻撃宣言時に攻守が攻撃モンスターの攻撃力（2500）と同じになる'
   +'（相打ちになり戦闘ダメージを受けない。数値が変わらなければ 2500 のダメージを受ける）',
   t1==='idle' && beforeAtk===0
   && zu(guard.uid)==='grave' && zu(foe.uid)==='grave'
   && gameState.players[0].lp===8000,
   JSON.stringify({before:beforeAtk,guard:zu(guard.uid),foe:zu(foe.uid),lp:gameState.players[0].lp}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-86265C2E44AE（09/06/12）: 生存した場合、数値は変化したまま残る。
   WIKI-05116421EE18（09/08/30）: 2 体目の攻撃宣言ではその攻撃力に上書きされる。
   1 回目の攻撃は《くず鉄のかかし》で無効にして生存させる。 */
const guard=setc('サイバー・シャドー・ガードナー',0);
gameState.players[0].sz=[guard,setc('くず鉄のかかし',0)];
const big=mk('デーモンの召喚',1,'up');
const small=mk('ワイト',1,'up');
gameState.players[1].mz=[big,small];
baselineA();
toFoeMain();
useCard(0,guard);
phase('battle');
RESPOND_WITH=['くず鉄のかかし'];
const t1=attack(1,0,0);
const keptAtk=curATK(cardOf(guard.uid)), keptDef=curDEF(cardOf(guard.uid));
ok('C2 ★ WIKI-86265C2E44AE（09/06/12）: 攻撃が無効になって生存した後も、変化した数値（2500）のまま',
   t1==='idle' && zu(guard.uid)==='mz' && keptAtk===2500 && keptDef===2500
   && gameState.players[0].lp===8000,
   JSON.stringify({atk:keptAtk,def:keptDef,guard:zu(guard.uid),lp:gameState.players[0].lp}));
const t2=attack(1,1,0);
ok('C3 ★ WIKI-05116421EE18（09/08/30）: 2 体目（攻撃力300）の攻撃宣言で 300 に上書きされる'
   +'（上書きされていなければ 2500 のままで、相手が 2200 のダメージを受ける）',
   t2==='idle' && zu(guard.uid)==='grave' && zu(small.uid)==='grave'
   && gameState.players[1].lp===8000 && gameState.players[0].lp===8000,
   JSON.stringify({guard:zu(guard.uid),small:zu(small.uid),
     lp:[gameState.players[0].lp,gameState.players[1].lp]}));
audit('C2');
`, {expect:3});

harness(COMMON + String.raw`
fresh();
/* WIKI-3B285A5D988E（10/08/31）: 《収縮》は変化した後の数値の半分になる。
   1 回目の攻撃を《くず鉄のかかし》で無効にして 2500 のまま生存させ、その状態で《収縮》を使う。
   変化前の 0 に掛かるなら 0 のままになる。 */
const guard=setc('サイバー・シャドー・ガードナー',0);
gameState.players[0].sz=[guard,setc('くず鉄のかかし',0),setc('収縮',0)];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
baselineA();
toFoeMain();
useCard(0,guard);
phase('battle');
RESPOND_WITH=['くず鉄のかかし'];
const t1=attack(1,0,0);
const kept=curATK(cardOf(guard.uid));
const shrink=(gameState.players[0].sz||[]).find(c=>c&&cardName(c)==='収縮');
PREFER=[guard.uid];
const t2=useCard(0,shrink);
ok('C4 ★ WIKI-3B285A5D988E（10/08/31）: 《収縮》は変化した後の数値（2500）の半分（1250）になる',
   t1==='idle' && t2==='idle' && kept===2500 && curATK(cardOf(guard.uid))===1250,
   JSON.stringify({kept:kept,after:curATK(cardOf(guard.uid)),
     def:curDEF(cardOf(guard.uid)),titles:TITLES.slice(0,4)}));
audit('C4');
`, {expect:2});

/* ===== D. 相手のエンドフェイズにセットされる ===== */
harness(COMMON + String.raw`
fresh();
const guard=setc('サイバー・シャドー・ガードナー',0);
gameState.players[0].sz=[guard];
baselineA();
toFoeMain();
PREFER=['def'];
useCard(0,guard);
const asMonster=zu(guard.uid)==='mz';
const tEnd=phase('end');
const now=cardOf(guard.uid);
ok('D1 ★ WIKI-D56999420D78（09/02/09）: 相手のエンドフェイズに魔法＆罠ゾーンにセットされ、'
   +'モンスターとしての状態も数値も落ちる',
   asMonster && tEnd==='idle' && zu(guard.uid)==='sz' && now.face==='down'
   && now.asMonsterDbS03==null && now.u524ShadowStatS03==null && dbOf(now).k==='t',
   JSON.stringify({zone:zu(guard.uid),face:now.face,k:dbOf(now).k,
     mon:now.asMonsterDbS03==null,stat:now.u524ShadowStatS03==null,sz:szNames(0)}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-801C30BE612F: 破壊されて墓地へ送られた場合はセットされない。 */
const guard=setc('サイバー・シャドー・ガードナー',0);
gameState.players[0].sz=[guard];
gameState.players[1].hand=[mk('地砕き',1)];
baselineA();
toFoeMain();
PREFER=['def'];
useCard(0,guard);
duelActivateFromHand(0);   /* 相手のターンなので、相手の《地砕き》が自分の罠モンスターを破壊する */
const tDes=drive();
const tEnd=phase('end');
ok('D2 ★ WIKI-801C30BE612F: 破壊されて墓地へ送られた場合はセットされない',
   tDes==='idle' && tEnd==='idle' && zu(guard.uid)==='grave'
   && (gameState.players[0].sz||[]).length===0,
   JSON.stringify({zone:zu(guard.uid),sz:szNames(0),mz:mzNames(0)}));
audit('D2');
`, {expect:2});

/* ===== E. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S524['cards/HZZZZZZZZZZZZH_claude_s03_u524_shadow_gardna.js'];
const doc = SRC_S524['docs/S03_U524_REPORT.md'];
okJs('E1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-1D20AFD4E3D6', 'WIKI-3B285A5D988E', 'WIKI-86265C2E44AE', 'WIKI-05116421EE18',
   'WIKI-502486CEABE6', 'WIKI-99CF1034A52C', 'WIKI-D56999420D78', 'WIKI-801C30BE612F',
   'WIKI-33529E04EA15'].every(id => cardSrc.indexOf(id) >= 0));
okJs('E2 ★ 変化した数値を「元々の数値」の層で持つ理由が裁定つきで書かれている',
  cardSrc.indexOf('setBaseAtk') >= 0 && cardSrc.indexOf('WIKI-1D20AFD4E3D6') >= 0);
okJs('E3 ★ 未対応（罠モンスターの無効化・セット禁止カード）が根拠つきで書かれている',
  cardSrc.indexOf('WIKI-DC6D7637D286') >= 0 && doc.indexOf('ダーク・シムルグ') >= 0);
okJs('E4 ★ このテストが tools/check.py に登録されている',
  SRC_S524['tools/check.py'].indexOf('test_s03_u524_shadow_gardna.js') >= 0);
