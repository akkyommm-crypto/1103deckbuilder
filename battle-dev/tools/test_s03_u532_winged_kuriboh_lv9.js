/* S03-U532 《ハネクリボー LV9》
   チェーンが発生した時に手札から特殊召喚し、表側表示で存在する限りお互いの発動した魔法カードは
   墓地へ送られず除外され、攻守は相手の墓地の魔法カードの数×500 になる。自分フィールドに1枚だけ。

   当時裁定（判定と測定の根拠）
     WIKI-659785AC1626（08/05/02）チェーンが発生した時にチェーンする形で発動する。
     WIKI-CBB94CBDEEC2（08/05/13）ダメージステップ中は発動できない。
     WIKI-385F18A83A8A（08/05/02）同一チェーン上では 1 体だけ。
     WIKI-CF11BCF70C7E（11/01/08）破壊された永続魔法も除外される。
     WIKI-62F976F48DF9（11/01/08）発動を無効にされ破壊された魔法も除外される。
     WIKI-190811E08EFD（11/01/08）コストで墓地へ送る場合は除外されない。
     WIKI-EE40E392583E（08/05/08）手札の 2 枚目は出せない。

   場面
     A 形
     B チェーンに乗せて手札から特殊召喚／同一チェーンでは 1 体だけ
     C 発動した魔法カードが墓地ではなく除外される（解決後・破壊された永続魔法・無効にされた発動）
     D 攻守は相手の墓地の魔法カードの数×500
     E 1 枚しか表側表示で存在できない
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S532 = pathA.resolve(__dirname, '..');
const rdS532 = p => fsA.readFileSync(pathA.join(ROOT_S532, p), 'utf8');
const SRC_S532 = {
  'cards/HZZZZZZZZZZZZP_claude_s03_u532_winged_kuriboh_lv9.js': rdS532('cards/HZZZZZZZZZZZZP_claude_s03_u532_winged_kuriboh_lv9.js'),
  'engine/00_state_actions.js': rdS532('engine/00_state_actions.js'),
  'docs/S03_U532_REPORT.md': rdS532('docs/S03_U532_REPORT.md'),
  'tools/check.py': rdS532('tools/check.py')
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
function settle(){for(let i=0;i<40&&pc();i++)pick();}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function fromHand(p,name){TOASTS.length=0;duelActivateFromHand(handIdx(p,name));return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function respondHand(p,name){settle();duelActivateResponseV2(p,'hand',handIdx(p,name),p);settle();return true;}
function respondZone(p,c){settle();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);settle();return true;}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function graveNames(p){return (gameState.players[p].grave||[]).map(nmOf);}
function banishNames(p){return (gameState.players[p].banish||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['ハネクリボー LV9'];
ok('A1 ★ 登録され、手札のクイックエフェクト・魔法の除外の申告・1枚制限の条件・攻守の永続効果を持つ',
   !!sc && sc.quickEffect===true && (sc.activateFrom||[]).indexOf('hand')>=0
   && sc.spellToBanishS03===true && typeof sc.summonConditionS03==='function'
   && typeof sc.continuous.apply==='function' && typeof activatedSpellBanishS03==='function',
   JSON.stringify({quick:sc.quickEffect,banish:sc.spellToBanishS03}));
`, {expect:1});

/* ===== B. チェーンに乗せて特殊召喚 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-659785AC1626（08/05/02）: チェーンが発生した時にチェーンする形で発動する。 */
gameState.activePlayer=1;
const kur=mk('ハネクリボー LV9',0), kur2=mk('ハネクリボー LV9',0);
gameState.players[0].hand=[kur,kur2];
gameState.players[1].hand=[mk('強欲な壺',1)];
baselineA();
duelActivateFromHand(handIdx(1,'強欲な壺'));
const onChain=gameState.chain.length>0;
respondHand(0,'ハネクリボー LV9');
const second=strictScriptLegalityV2('ハネクリボー LV9',0,'hand',handIdx(0,'ハネクリボー LV9'),{});
const t=drive();
ok('B1 ★ 相手のカードの発動にチェーンして手札から特殊召喚でき、同一チェーンでは 2 体目を発動できない',
   t==='idle' && onChain && zu(kur.uid)==='mz' && second.ok===false && zu(kur2.uid)==='hand',
   JSON.stringify({onChain:onChain,kur:zu(kur.uid),second:second.ok,
     reason:String(second.reason||'').slice(0,30),mz0:mzNames(0),titles:TITLES.slice(0,3)}));
audit('B1');
`, {expect:2});

/* ===== C. 発動した魔法カードは除外される ===== */
harness(COMMON + String.raw`
fresh();
/* 解決後に墓地へ行く魔法（お互い）が除外される。 */
const kur=mk('ハネクリボー LV9',0,'up');
gameState.players[0].mz=[kur];
gameState.players[0].hand=[mk('強欲な壺',0)];
gameState.players[1].hand=[mk('強欲な壺',1)];
baselineA();
const t1=fromHand(0,'強欲な壺');
const mine=(gameState.players[0].banish||[]).some(c=>cardName(c)==='強欲な壺');
phase('end');turn();phase('standby');phase('main1');
const t2=fromHand(1,'強欲な壺');
const foe=(gameState.players[1].banish||[]).some(c=>cardName(c)==='強欲な壺');
ok('C1 ★ お互いの発動した魔法カードは墓地へ送られず除外される',
   t1==='idle' && t2==='idle' && mine && foe
   && !(gameState.players[0].grave||[]).some(c=>cardName(c)==='強欲な壺')
   && !(gameState.players[1].grave||[]).some(c=>cardName(c)==='強欲な壺'),
   JSON.stringify({mine:mine,foe:foe,banish0:banishNames(0),banish1:banishNames(1)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-CF11BCF70C7E（11/01/08）: 破壊された永続魔法も除外される。 */
const kur=mk('ハネクリボー LV9',0,'up');
gameState.players[0].mz=[kur];
const perm=mk('光の護封剣',1,'up');
gameState.players[1].sz=[perm];
gameState.players[0].hand=[mk('サイクロン',0)];
baselineA();
PREFER=[perm.uid];
const t=fromHand(0,'サイクロン');
ok('C2 ★ WIKI-CF11BCF70C7E（11/01/08）: 破壊された（発動済みの）永続魔法も除外される',
   t==='idle' && zu(perm.uid)==='banish',
   JSON.stringify({perm:zu(perm.uid),banish1:banishNames(1),grave1:graveNames(1)}));
audit('C2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-62F976F48DF9（11/01/08）: 発動を無効にされ破壊された魔法も除外される。 */
gameState.activePlayer=1;
const kur=mk('ハネクリボー LV9',0,'up');
gameState.players[0].mz=[kur];
const jam=setc('マジック・ジャマー',0);
gameState.players[0].sz=[jam];
gameState.players[0].hand=[mk('ワイト',0)];
const pot=mk('強欲な壺',1);
gameState.players[1].hand=[pot];
baselineA();
duelActivateFromHand(handIdx(1,'強欲な壺'));
PREFER=[gameState.players[0].hand[0].uid];
respondZone(0,jam);
const t=drive();
ok('C3 ★ WIKI-62F976F48DF9（11/01/08）: 発動を無効にされ破壊された魔法カードも除外される',
   t==='idle' && zu(pot.uid)==='banish' && (gameState.players[1].hand||[]).length===0,
   JSON.stringify({pot:zu(pot.uid),banish1:banishNames(1),grave1:graveNames(1)}));
audit('C3');
`, {expect:2});

/* ===== D. 攻守 ===== */
harness(COMMON + String.raw`
fresh();
const kur=mk('ハネクリボー LV9',0,'up');
gameState.players[0].mz=[kur];
gameState.players[1].grave=[mk('強欲な壺',1),mk('サイクロン',1),mk('大嵐',1),mk('ワイト',1)];
baselineA();
const hk=findCardByUid(kur.uid);
const atk=API.curAtk(hk), def=curDEF(hk.card);
ok('D1 ★ 攻撃力・守備力は相手の墓地の魔法カードの数×500（魔法 3 枚なので 1500）',
   atk===1500 && def===1500,
   JSON.stringify({atk:atk,def:def,grave1:graveNames(1)}));
`, {expect:1});

/* ===== E. 1 枚しか表側表示で存在できない ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-EE40E392583E（08/05/08）: 手札の 2 枚目は出せない（出す側のカード自身の条件）。 */
const kur=mk('ハネクリボー LV9',0,'up'), kur2=mk('ハネクリボー LV9',0);
gameState.players[0].mz=[kur];
gameState.players[0].hand=[kur2];
gameState.players[1].hand=[mk('強欲な壺',1)];
gameState.activePlayer=1;        /* baselineA の前に置く（後から状態を書き換えると digest が合わない） */
baselineA();
const why=v46FaceUpSummonRestrictionReason(0,dbOf(kur2),'special');
duelActivateFromHand(handIdx(1,'強欲な壺'));
const legal=strictScriptLegalityV2('ハネクリボー LV9',0,'hand',handIdx(0,'ハネクリボー LV9'),{});
const t=drive();
ok('E1 ★ 自分フィールドに表側表示のこのカードが居る間、2 枚目は特殊召喚できない',
   t==='idle' && !!why && legal.ok===false && zu(kur2.uid)==='hand',
   JSON.stringify({why:String(why||'').slice(0,40),legal:legal.ok,kur2:zu(kur2.uid)}));
audit('E1');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S532['cards/HZZZZZZZZZZZZP_claude_s03_u532_winged_kuriboh_lv9.js'];
const engSrc = SRC_S532['engine/00_state_actions.js'];
const doc = SRC_S532['docs/S03_U532_REPORT.md'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-659785AC1626','WIKI-CBB94CBDEEC2','WIKI-385F18A83A8A','WIKI-CF11BCF70C7E','WIKI-62F976F48DF9',
   'WIKI-190811E08EFD','WIKI-EE40E392583E','WIKI-115033D140BB'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('F2 ★ 共通側の置換に、コストで墓地へ送る場合は対象外である事が書かれている',
  engSrc.indexOf('WIKI-190811E08EFD') >= 0 && engSrc.indexOf('activatedSpellBanishS03') >= 0);
okJs('F3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-190811E08EFD') >= 0 && doc.indexOf('未対応') >= 0);
okJs('F4 ★ このテストが tools/check.py に登録されている',
  SRC_S532['tools/check.py'].indexOf('test_s03_u532_winged_kuriboh_lv9.js') >= 0);
