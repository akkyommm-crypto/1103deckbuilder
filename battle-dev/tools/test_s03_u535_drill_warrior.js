/* S03-U535 《ドリル・ウォリアー》
   ①攻撃力を半分にしてこのターン直接攻撃できる。②手札を1枚捨ててこのカードを除外し、
   次の自分のスタンバイフェイズ時に特殊召喚して、その後レベル2以下のモンスター1体を手札に加えられる。

   当時裁定（判定と測定の根拠）
     WIKI-82A9719F4D3B（09/11/14）①②は起動効果、特殊召喚と回収は 1 つの誘発効果。
     WIKI-0F67AE89F61B（09/11/14）半分になった攻撃力はそのまま続く。
     WIKI-46DB70970EAE（09/12/02）直接攻撃できるだけで、モンスターへの攻撃も選べる。
     WIKI-BB138075AD8E（09/11/14）手札を捨てるのは効果処理。
     WIKI-0BCABB21D0F1（09/11/26）解決時に手札が 0 枚なら除外の効果は適用されない。
     WIKI-C8833988CC5F（09/11/14）特殊召喚できなかった場合は回収できない。
     WIKI-B2BC6877BD8D（10/06/16）回収は対象を取らない。

   場面
     A 形
     B ①攻撃力半分＋直接攻撃（1ターンに1度）
     C ②手札を捨てて除外し、次の自分のスタンバイフェイズに戻って回収する
     D negative control: 解決時に手札が 0 枚なら除外しない（《マインドクラッシュ》）
     E 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S535 = pathA.resolve(__dirname, '..');
const rdS535 = p => fsA.readFileSync(pathA.join(ROOT_S535, p), 'utf8');
const SRC_S535 = {
  'cards/HZZZZZZZZZZZZS_claude_s03_u535_drill_warrior.js': rdS535('cards/HZZZZZZZZZZZZS_claude_s03_u535_drill_warrior.js'),
  'docs/S03_U535_REPORT.md': rdS535('docs/S03_U535_REPORT.md'),
  'tools/check.py': rdS535('tools/check.py')
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
    if(typeof BATTLE_COMMAND_V29!=='undefined'&&BATTLE_COMMAND_V29&&BATTLE_COMMAND_V29.mode==='replayTarget'){
      battleReplayCancelV28();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function settle(){for(let i=0;i<40&&pc();i++)pick();}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function useKey(p,c,key){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{v4EffectKey:key});return drive();}
function respondZone(p,c){settle();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);settle();return true;}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function handNames(p){return (gameState.players[p].hand||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const keys=nativeEffectsV4('ドリル・ウォリアー').map(e=>e.key);
ok('A1 ★ 登録され、3 つの効果（攻撃力半分＋直接攻撃・除外・スタンバイフェイズの特殊召喚と回収）を持つ',
   keys.indexOf('half-direct')>=0 && keys.indexOf('banish-self')>=0 && keys.indexOf('standby-return')>=0
   && typeof CARD_SCRIPTS['ドリル・ウォリアー'].passive.onStandbyPhase==='function'
   && ZONE_LOCAL_KEYS.indexOf('u535HalfTurnS03')>=0,
   JSON.stringify({keys:keys}));
`, {expect:1});

/* ===== B. ①攻撃力半分＋直接攻撃 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-0F67AE89F61B（09/11/14）: 半分になった攻撃力はそのまま。
   WIKI-46DB70970EAE（09/12/02）: 直接攻撃できるようになる（相手モンスターが居ても直接攻撃できる）。 */
const drill=mk('ドリル・ウォリアー',0,'up');
gameState.players[0].mz=[drill];
const foe=mk('ワイト',1,'up');
gameState.players[1].mz=[foe];
baselineA();
const t1=useKey(0,drill,'half-direct');
const atkAfter=API.curAtk(findCardByUid(drill.uid));
/* 1ターンに1度：効果を指定しない発動はもう合法でない（②は手札が空なので不可） */
const legalAfter=strictScriptLegalityV2('ドリル・ウォリアー',0,'mz',0,{});
TOASTS.length=0;
const t2=useCard(0,drill);
const refused=legalAfter.ok===false && API.curAtk(findCardByUid(drill.uid))===1200;
phase('battle');
const t3=attack(0,0,'direct');           /* 相手モンスターが居ても直接攻撃できる */
ok('B1 ★ 攻撃力が半分（2400 → 1200）になり、相手モンスターが居ても直接攻撃でき、1ターンに1度である',
   t1==='idle' && t2==='idle' && t3==='idle' && atkAfter===1200 && refused
   && gameState.players[1].lp===6800 && zu(foe.uid)==='mz',
   JSON.stringify({atk:atkAfter,refused:refused,lp1:gameState.players[1].lp,foe:zu(foe.uid)}));
audit('B1');
`, {expect:2});

/* ===== C. ②除外 → 次の自分のスタンバイフェイズ ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-C96B7B51137A（09/11/14）: 特殊召喚と回収は 1 つの効果処理。
   WIKI-B2BC6877BD8D（10/06/16）: 回収は対象を取らない。 */
const drill=mk('ドリル・ウォリアー',0,'up');
gameState.players[0].mz=[drill];
const dis=mk('ワイト',0);
gameState.players[0].hand=[dis];
const low=mk('ニトロ・シンクロン',0);     /* レベル2 */
const high=mk('デーモンの召喚',0);        /* レベル6（候補に出ない） */
gameState.players[0].grave=[low,high];
baselineA();
PREFER=[dis.uid];
const t1=useKey(0,drill,'banish-self');
const away=zu(drill.uid)==='banish';
const discarded=zu(dis.uid)==='grave';
phase('end');turn();phase('standby');phase('main1');phase('end');turn();   /* 相手のターンを挟む */
PREFER=[low.uid];
const t2=phase('standby');               /* 自分のスタンバイフェイズ */
ok('C1 ★ 手札を1枚捨てて除外し、次の自分のスタンバイフェイズに特殊召喚して、'
   +'レベル2以下のモンスターを手札に加える',
   t1==='idle' && t2==='idle' && away && discarded
   && zu(drill.uid)==='mz' && zu(low.uid)==='hand' && zu(high.uid)==='grave',
   JSON.stringify({away:away,discarded:discarded,drill:zu(drill.uid),low:zu(low.uid),high:zu(high.uid),
     hand0:handNames(0),titles:TITLES.slice(0,4)}));
audit('C1');
`, {expect:2});

/* ===== D. 解決時に手札が 0 枚 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-0BCABB21D0F1（09/11/26）: 解決時に手札が 0 枚で捨てられない場合、除外の効果は適用されない。
   《マインドクラッシュ》で手札の《ワイト》を宣言して捨てさせる。 */
const drill=mk('ドリル・ウォリアー',0,'up');
gameState.players[0].mz=[drill];
const dis=mk('ワイト',0);
gameState.players[0].hand=[dis];
const crush=setc('マインドクラッシュ',1);
gameState.players[1].sz=[crush];
baselineA();
PREFER=['ワイト'];
duelActivateFromZone(0,'mz',findCardByUid(drill.uid).index,{v4EffectKey:'banish-self'});
const resp=respondZone(1,crush);
const t=drive();
ok('D1 ★ WIKI-0BCABB21D0F1（09/11/26）: 解決時に手札が 0 枚なら除外されない',
   t==='idle' && resp===true && zu(dis.uid)==='grave' && zu(drill.uid)==='mz'
   && (gameState.players[0].hand||[]).length===0,
   JSON.stringify({dis:zu(dis.uid),drill:zu(drill.uid),hand0:handNames(0),titles:TITLES.slice(0,4)}));
audit('D1');
`, {expect:2});

/* ===== E. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S535['cards/HZZZZZZZZZZZZS_claude_s03_u535_drill_warrior.js'];
const doc = SRC_S535['docs/S03_U535_REPORT.md'];
okJs('E1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-82A9719F4D3B','WIKI-0F67AE89F61B','WIKI-46DB70970EAE','WIKI-BB138075AD8E','WIKI-48764DEEA4C6',
   'WIKI-0BCABB21D0F1','WIKI-22D4985AF8EC','WIKI-C96B7B51137A','WIKI-C8833988CC5F','WIKI-B2BC6877BD8D'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('E2 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-0BCABB21D0F1') >= 0 && doc.indexOf('未対応') >= 0);
okJs('E3 ★ このテストが tools/check.py に登録されている',
  SRC_S535['tools/check.py'].indexOf('test_s03_u535_drill_warrior.js') >= 0);
