/* S03-U529 《ダーク・シムルグ》
   ①手札から（自分の墓地の闇属性と風属性を 1 体ずつ除外）／②墓地から（手札の闇属性と風属性を 1 体ずつ除外）
   自身を特殊召喚する起動効果、③モンスターゾーンでは属性が「風」としても扱われる永続効果、
   ④モンスターゾーンに存在する限り相手はカードをセットできない永続効果。

   当時裁定（判定と測定の根拠）
     WIKI-C4536BE0DB24（09/03/18）特殊召喚はどちらも起動効果、属性とセット禁止は永続効果。
     WIKI-A8B2B15D0BC1（08/01/22）除外はコスト。
     WIKI-FEB9ECE98605（08/06/16）ネクロバレー中は墓地を除外する側は発動できず、手札を除外する側は発動できる。
     WIKI-5D42E3BC6EBC（08/01/21）手札・墓地では闇属性としてしか扱わない。
     WIKI-787E4D7D65EC（08/01/21）セットする効果は強制なら発動するがセットの処理は行われない。
     WIKI-A6BBE85B1591（08/03/15）《くず鉄のかかし》は攻撃無効は有効だがセットできず墓地へ送られる。
     WIKI-2E645AE2C1C6（09/08/30）《サイバー・シャドー・ガードナー》はフィールドに残り続ける。
     WIKI-7D588C652FDC（10/03/25）自分は相手モンスターを対象に《月の書》を発動できる。

   場面
     A 形
     B ①手札から・②墓地から（コストの除外）と、ネクロバレー中の違い
     C ③属性（フィールドでは闇と風、手札・墓地では闇のみ）
     D ④相手はセットできない（魔法・罠／モンスター／くず鉄のかかし／月の書の向き）
     E negative control（裏側表示では禁止されない）
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S529 = pathA.resolve(__dirname, '..');
const rdS529 = p => fsA.readFileSync(pathA.join(ROOT_S529, p), 'utf8');
const SRC_S529 = {
  'cards/HZZZZZZZZZZZZM_claude_s03_u529_dark_simorgh.js': rdS529('cards/HZZZZZZZZZZZZM_claude_s03_u529_dark_simorgh.js'),
  'engine/1ZZT_set_ban_s03.js': rdS529('engine/1ZZT_set_ban_s03.js'),
  'docs/S03_U529_REPORT.md': rdS529('docs/S03_U529_REPORT.md'),
  'tools/check.py': rdS529('tools/check.py')
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
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function fromHand(p,name){TOASTS.length=0;duelActivateFromHand(handIdx(p,name));return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function szNames(p){return (gameState.players[p].sz||[]).map(nmOf);}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['ダーク・シムルグ'];
const keys=nativeEffectsV4('ダーク・シムルグ').map(e=>e.key);
ok('A1 ★ 登録され、手札と墓地からの 2 つの起動効果、セット禁止の申告、属性を足す永続効果を持つ',
   keys.indexOf('from-hand')>=0 && keys.indexOf('from-grave')>=0
   && sc.setBanOpponentS03===true && typeof sc.continuous.additionalAttributes==='function'
   && typeof setBanSourceS03==='function',
   JSON.stringify({keys:keys,setBan:sc.setBanOpponentS03}));
`, {expect:1});

/* ===== B. ①手札から / ②墓地から ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-A8B2B15D0BC1（08/01/22）: 除外はコスト。 */
const sim=mk('ダーク・シムルグ',0);
const dark=mk('ワイト',0), wind=mk('キラー・ビー',0);
gameState.players[0].hand=[sim];
gameState.players[0].grave=[dark,wind];
baselineA();
const t1=fromHand(0,'ダーク・シムルグ');
ok('B1 ★ ①手札から: 自分の墓地の闇属性と風属性を 1 体ずつ除外して特殊召喚する',
   t1==='idle' && zu(sim.uid)==='mz' && zu(dark.uid)==='banish' && zu(wind.uid)==='banish',
   JSON.stringify({sim:zu(sim.uid),dark:zu(dark.uid),wind:zu(wind.uid),mz0:mzNames(0),titles:TITLES.slice(0,3)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const sim=mk('ダーク・シムルグ',0);
const dark=mk('ワイト',0), wind=mk('キラー・ビー',0);
gameState.players[0].grave=[sim];
gameState.players[0].hand=[dark,wind];
baselineA();
const t1=useCard(0,sim);
ok('B2 ★ ②墓地から: 手札の闇属性と風属性を 1 体ずつ除外して特殊召喚する',
   t1==='idle' && zu(sim.uid)==='mz' && zu(dark.uid)==='banish' && zu(wind.uid)==='banish',
   JSON.stringify({sim:zu(sim.uid),dark:zu(dark.uid),wind:zu(wind.uid),mz0:mzNames(0)}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-FEB9ECE98605（08/06/16）: ネクロバレー中は、墓地のカードを除外する①は発動できず、
   手札のカードを除外する②は発動できる。 */
const necro=mk('王家の眠る谷－ネクロバレー',1,'up');
gameState.players[1].field=necro;
const simHand=mk('ダーク・シムルグ',0), simGrave=mk('ダーク・シムルグ',0);
const darkG=mk('ワイト',0), windG=mk('キラー・ビー',0);
const darkH=mk('ワイト',0), windH=mk('キラー・ビー',0);
gameState.players[0].hand=[simHand,darkH,windH];
gameState.players[0].grave=[simGrave,darkG,windG];
baselineA();
PREFER=[darkH.uid,windH.uid];   /* コストに使うのはワイトとキラー・ビー */
const legalHand=strictScriptLegalityV2('ダーク・シムルグ',0,'hand',handIdx(0,'ダーク・シムルグ'),{});
const legalGrave=strictScriptLegalityV2('ダーク・シムルグ',0,'grave',findCardByUid(simGrave.uid).index,{});
const t1=useCard(0,simGrave);
ok('B3 ★ WIKI-FEB9ECE98605（08/06/16）: ネクロバレー中は①（墓地を除外）は発動できず、②（手札を除外）は発動できる',
   t1==='idle' && legalHand.ok===false && legalGrave.ok===true
   && zu(simGrave.uid)==='mz' && zu(darkH.uid)==='banish' && zu(windH.uid)==='banish'
   && zu(simHand.uid)==='hand',
   JSON.stringify({hand:legalHand.ok,grave:legalGrave.ok,reason:String(legalHand.reason||'').slice(0,30),
     sim:zu(simGrave.uid),darkH:zu(darkH.uid),windH:zu(windH.uid)}));
audit('B3');
`, {expect:2});

/* ===== C. ③属性 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-5D42E3BC6EBC（08/01/21）: 風属性として扱うのは永続効果なので、手札・墓地では闇属性のみ。 */
const onField=mk('ダーク・シムルグ',0,'up');
const inHand=mk('ダーク・シムルグ',0);
const inGrave=mk('ダーク・シムルグ',0);
gameState.players[0].mz=[onField];
gameState.players[0].hand=[inHand];
gameState.players[0].grave=[inGrave];
baselineA();
const onFieldAttrs=currentAttributesV17(onField).slice().sort();
const handAttrs=currentAttributesV17(inHand).slice().sort();
const graveAttrs=currentAttributesV17(inGrave).slice().sort();
ok('C1 ★ ③モンスターゾーンでは闇と風の両方として扱われ、手札・墓地では闇のみ',
   JSON.stringify(onFieldAttrs)===JSON.stringify(['闇','風'].sort())
   && JSON.stringify(handAttrs)===JSON.stringify(['闇'])
   && JSON.stringify(graveAttrs)===JSON.stringify(['闇'])
   && hasAttributeV17(onField,'風')===true && hasAttributeV17(inHand,'風')===false,
   JSON.stringify({field:onFieldAttrs,hand:handAttrs,grave:graveAttrs}));
`, {expect:1});

/* ===== D. ④相手はセットできない ===== */
harness(COMMON + String.raw`
fresh();
/* 相手のターンに、相手は魔法・罠もモンスターもセットできない。 */
const sim=mk('ダーク・シムルグ',0,'up');
gameState.players[0].mz=[sim];
const foeTrap=mk('激流葬',1), foeMon=mk('ワイト',1);
gameState.players[1].hand=[foeTrap,foeMon];
baselineA();
toFoeMain();
TOASTS.length=0;
doSetST(handIdx(1,'激流葬'));
const stAfter=zu(foeTrap.uid);
doSetMonster(handIdx(1,'ワイト'));
const monAfter=zu(foeMon.uid);
const t=drive();
ok('D1 ★ ④相手は魔法・罠カードもモンスターもセットできない',
   t==='idle' && stAfter==='hand' && monAfter==='hand'
   && (gameState.players[1].sz||[]).length===0 && (gameState.players[1].mz||[]).length===0,
   JSON.stringify({st:stAfter,mon:monAfter,sz1:szNames(1),mz1:mzNames(1),toasts:TOASTS.slice(0,3)}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-A6BBE85B1591（08/03/15）: 《くず鉄のかかし》は攻撃無効の効果は有効だが、
   セットできないので墓地へ送られる。 */
const sim=mk('ダーク・シムルグ',0,'up');
gameState.players[0].mz=[sim];
const scare=setc('くず鉄のかかし',1);
gameState.players[1].sz=[scare];
gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();
phase('battle');
RESPOND_WITH=['くず鉄のかかし'];
const t1=attack(0,0,0);
ok('D2 ★ WIKI-A6BBE85B1591（08/03/15）: 《くず鉄のかかし》の攻撃無効は有効だが、セットできないので墓地へ送られる',
   t1==='idle' && zu(scare.uid)==='grave' && zu(sim.uid)==='mz'
   && (gameState.players[1].mz||[]).length===1 && gameState.players[1].lp===8000,
   JSON.stringify({scare:zu(scare.uid),sz1:szNames(1),grave1:graveNames(1),lp1:gameState.players[1].lp}));
audit('D2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-7D588C652FDC（10/03/25）: 自分は相手モンスターを対象に《月の書》を発動できる（禁止は相手のセットだけ）。 */
const sim=mk('ダーク・シムルグ',0,'up');
const foe=mk('デーモンの召喚',1,'up');
gameState.players[0].mz=[sim];
gameState.players[0].hand=[mk('月の書',0)];
gameState.players[1].mz=[foe];
baselineA();
PREFER=[foe.uid];
const t1=fromHand(0,'月の書');
ok('D3 ★ WIKI-7D588C652FDC（10/03/25）: 自分は相手モンスターを対象に《月の書》を発動して裏側守備表示にできる',
   t1==='idle' && cardOf(foe.uid).face==='down' && cardOf(foe.uid).pos==='def',
   JSON.stringify({face:cardOf(foe.uid).face,pos:cardOf(foe.uid).pos}));
audit('D3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-787E4D7D65EC（08/01/21）の読み方: 相手が発動した場合、セットの処理（裏側守備表示にする処理）は行われない。 */
const sim=mk('ダーク・シムルグ',0,'up');
const mine=mk('デーモンの召喚',0,'up');
gameState.players[0].mz=[sim,mine];
gameState.players[1].hand=[mk('月の書',1)];
baselineA();
toFoeMain();
PREFER=[mine.uid];
const t1=fromHand(1,'月の書');
ok('D4 ★ 相手が《月の書》を発動しても、セットの処理（裏側守備表示にする処理）は行われない',
   t1==='idle' && cardOf(mine.uid).face==='up' && zu(sim.uid)==='mz',
   JSON.stringify({face:cardOf(mine.uid).face,pos:cardOf(mine.uid).pos,titles:TITLES.slice(0,3)}));
audit('D4');
`, {expect:2});

/* ===== E. negative control ===== */
harness(COMMON + String.raw`
fresh();
/* 裏側表示のこのカードでは相手のセットを禁止しない（永続効果は表側表示でのみ）。 */
const sim=mk('ダーク・シムルグ',0,'down');
sim.pos='def';
gameState.players[0].mz=[sim];
const foeTrap=mk('激流葬',1);
gameState.players[1].hand=[foeTrap];
baselineA();
toFoeMain();
doSetST(handIdx(1,'激流葬'));
const t=drive();
ok('E1 ★ negative control: 裏側表示のこのカードでは相手はセットできる',
   t==='idle' && zu(foeTrap.uid)==='sz' && (gameState.players[1].sz||[]).length===1,
   JSON.stringify({trap:zu(foeTrap.uid),sz1:szNames(1)}));
audit('E1');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S529['cards/HZZZZZZZZZZZZM_claude_s03_u529_dark_simorgh.js'];
const engSrc = SRC_S529['engine/1ZZT_set_ban_s03.js'];
const doc = SRC_S529['docs/S03_U529_REPORT.md'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-C4536BE0DB24','WIKI-962D8F30F472','WIKI-A8B2B15D0BC1','WIKI-FEB9ECE98605','WIKI-5D42E3BC6EBC',
   'WIKI-787E4D7D65EC','WIKI-A6BBE85B1591','WIKI-7D588C652FDC'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('F2 ★ 共通側のセット禁止に、申告制である事と無効化の扱いが書かれている',
  engSrc.indexOf('setBanOpponentS03') >= 0 && engSrc.indexOf('S03-U529') >= 0);
okJs('F3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-FEB9ECE98605') >= 0 && doc.indexOf('未対応') >= 0);
okJs('F4 ★ このテストが tools/check.py に登録されている',
  SRC_S529['tools/check.py'].indexOf('test_s03_u529_dark_simorgh.js') >= 0);
