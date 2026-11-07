/* S03-U534 《ニトロ・ウォリアー》
   自分のターンに自分が魔法カードを発動した場合、そのターンのダメージ計算時のみ1度だけ攻撃力 +1000。
   このカードの攻撃で相手モンスターを破壊したダメージ計算後、相手の表側守備表示モンスター1体を選択して
   攻撃表示にし、そのモンスターにもう1度だけ続けて攻撃できる。

   当時裁定（判定と測定の根拠）
     WIKI-5B7D3137B22E（08/04/19）攻撃力アップはダメージ計算時の永続効果（チェーンブロックを作らない）。
     WIKI-167AABFDECDD（08/04/19）魔法を発動したターンの1回目の攻撃で必ず上昇する。
     WIKI-5FF944747E56（08/10/07）魔法の発動時に自分フィールドに存在していなければ上昇しない。
     WIKI-2127AE156834（10/11/17）もう1度攻撃する効果はダメージ計算後に対象を取って発動する。
     WIKI-6B508244BF77（09/09/30）対象が変わっても攻撃対象は変更できない。
     WIKI-67F51A7AD2D5（08/04/19）通常の攻撃と効果の攻撃で最大2回。

   場面
     A 形
     B 魔法を発動したターンの最初の攻撃で +1000（ダメージ計算時のみ）
     C negative control: 魔法の発動時に自分フィールドに居なかった場合は上昇しない（《心変わり》で奪った場合）
     D もう1度の攻撃（表示形式を変えて、その相手モンスターだけを攻撃できる・最大2回）
     E 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S534 = pathA.resolve(__dirname, '..');
const rdS534 = p => fsA.readFileSync(pathA.join(ROOT_S534, p), 'utf8');
const SRC_S534 = {
  'cards/HZZZZZZZZZZZZR_claude_s03_u534_nitro_warrior.js': rdS534('cards/HZZZZZZZZZZZZR_claude_s03_u534_nitro_warrior.js'),
  'engine/00_state_actions.js': rdS534('engine/00_state_actions.js'),
  'docs/S03_U534_REPORT.md': rdS534('docs/S03_U534_REPORT.md'),
  'tools/check.py': rdS534('tools/check.py')
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
function mkdef(n,p){const c=mk(n,p,'up');c.pos='def';return c;}
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
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function handIdx(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function fromHand(p,name){TOASTS.length=0;duelActivateFromHand(handIdx(p,name));return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['ニトロ・ウォリアー'];
ok('A1 ★ 登録され、魔法の発動を見る申告・攻撃回数の宣言・永続効果（攻守と攻撃対象）を持つ',
   !!sc && sc.spellActWatchS03===true && typeof sc.attackLimit==='function'
   && typeof sc.continuous.apply==='function' && typeof sc.continuous.cannotBeAttackedByS03==='function'
   && ZONE_LOCAL_KEYS.indexOf('spellActS03')>=0 && ZONE_LOCAL_KEYS.indexOf('u534ExtraS03')>=0,
   JSON.stringify({watch:sc&&sc.spellActWatchS03}));
`, {expect:1});

/* ===== B. 攻撃力アップ ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-167AABFDECDD（08/04/19）: 魔法を発動したターンの1回目の攻撃で必ず上昇する。
   攻撃力3000の相手モンスターに攻撃させ、上昇が無ければ自分が破壊される事で測る。 */
const nitro=mk('ニトロ・ウォリアー',0,'up');
gameState.players[0].mz=[nitro];
gameState.players[0].hand=[mk('強欲な壺',0)];
const foe=mk('青眼の白龍',1,'up');
gameState.players[1].mz=[foe];
baselineA();
const t1=fromHand(0,'強欲な壺');
const marked=!!cardOf(nitro.uid).spellActS03;
phase('battle');
const t2=attack(0,0,0);
ok('B1 ★ 魔法を発動したターンの1回目の攻撃のダメージ計算時に攻撃力 +1000（2800 → 3800 で 3000 を破壊）',
   t1==='idle' && t2==='idle' && marked && zu(foe.uid)==='grave' && zu(nitro.uid)==='mz'
   && gameState.players[1].lp===7200,
   JSON.stringify({marked:marked,foe:zu(foe.uid),nitro:zu(nitro.uid),lp1:gameState.players[1].lp}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 魔法を発動していないターンは上昇しない（2800 < 3000 で自分が破壊される）。 */
const nitro=mk('ニトロ・ウォリアー',0,'up');
gameState.players[0].mz=[nitro];
const foe=mk('青眼の白龍',1,'up');
gameState.players[1].mz=[foe];
baselineA();
phase('battle');
const t=attack(0,0,0);
ok('B2 ★ negative control: 魔法を発動していないターンは上昇せず、攻撃力3000との戦闘で破壊される',
   t==='idle' && zu(nitro.uid)==='grave' && zu(foe.uid)==='mz' && gameState.players[0].lp===7800,
   JSON.stringify({nitro:zu(nitro.uid),foe:zu(foe.uid),lp0:gameState.players[0].lp}));
audit('B2');
`, {expect:2});

/* ===== C. 魔法の発動時に自分フィールドに居なかった場合 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-5FF944747E56（08/10/07）: 魔法の発動時に自分フィールドに存在していなければ上昇しない。
   《心変わり》で相手の《ニトロ・ウォリアー》のコントロールを得ても上昇しない。 */
const nitro=mk('ニトロ・ウォリアー',1,'up');
gameState.players[1].mz=[nitro];
gameState.players[0].hand=[mk('心変わり',0)];
const foe=mk('青眼の白龍',1,'up');
gameState.players[1].mz=[nitro,foe];
baselineA();
PREFER=[nitro.uid];
const t1=fromHand(0,'心変わり');
const got=zu(nitro.uid)==='mz' && findCardByUid(nitro.uid).p===0;
const marked=!!cardOf(nitro.uid).spellActS03;
phase('battle');
const t2=attack(0,findCardByUid(nitro.uid).index,0);
ok('C1 ★ WIKI-5FF944747E56（08/10/07）: 魔法の発動時に自分フィールドに居なかった場合は上昇しない',
   t1==='idle' && t2==='idle' && got && !marked && zu(nitro.uid)==='grave' && zu(foe.uid)==='mz',
   JSON.stringify({got:got,marked:marked,nitro:zu(nitro.uid),foe:zu(foe.uid)}));
audit('C1');
`, {expect:2});

/* ===== D. もう1度の攻撃 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-2127AE156834（10/11/17）: ダメージ計算後に表側守備表示のモンスターを対象に取って発動する。
   WIKI-6B508244BF77（09/09/30）: 対象以外は攻撃対象にできない。
   WIKI-67F51A7AD2D5（08/04/19）: 最大 2 回。 */
const nitro=mk('ニトロ・ウォリアー',0,'up');
gameState.players[0].mz=[nitro];
const weak=mk('ワイト',1,'up');
const defA=mkdef('デーモンの召喚',1), defB=mkdef('ワイト',1);
gameState.players[1].mz=[weak,defA,defB];
baselineA();
phase('battle');
PREFER=[defA.uid];
const t1=attack(0,0,0);                   /* ワイトを破壊 → もう1度の効果 */
const pinned=Number(cardOf(nitro.uid).u534PinS03)===Number(defA.uid);
const posChanged=cardOf(defA.uid).pos==='atk';
TOASTS.length=0;
const t2=attack(0,0,findCardByUid(defB.uid).index);   /* 対象以外は攻撃できない */
const blocked=TOASTS.some(x=>x.indexOf('攻撃対象に選択できません')>=0);
const t3=attack(0,0,findCardByUid(defA.uid).index);   /* 対象には攻撃できる */
ok('D1 ★ ダメージ計算後に表側守備表示のモンスターを攻撃表示にし、そのモンスターにだけもう1度攻撃できる',
   t1==='idle' && t2==='idle' && t3==='idle' && pinned && posChanged && blocked
   && zu(weak.uid)==='grave' && zu(defA.uid)==='grave' && zu(defB.uid)==='mz',
   JSON.stringify({pinned:pinned,posChanged:posChanged,blocked:blocked,
     weak:zu(weak.uid),defA:zu(defA.uid),defB:zu(defB.uid),titles:TITLES.slice(0,3)}));
const t4=attack(0,0,findCardByUid(defB.uid).index);   /* 3 回目は攻撃できない */
ok('D2 ★ WIKI-67F51A7AD2D5（08/04/19）: 通常の攻撃とこの効果の攻撃で最大 2 回（3 回目は攻撃できない）',
   t4==='idle' && Number(cardOf(nitro.uid).attackCount)===2 && zu(defB.uid)==='mz',
   JSON.stringify({attackCount:cardOf(nitro.uid).attackCount,defB:zu(defB.uid)}));
audit('D');
`, {expect:3});

/* ===== E. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S534['cards/HZZZZZZZZZZZZR_claude_s03_u534_nitro_warrior.js'];
const engSrc = SRC_S534['engine/00_state_actions.js'];
const doc = SRC_S534['docs/S03_U534_REPORT.md'];
okJs('E1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-5B7D3137B22E','WIKI-167AABFDECDD','WIKI-B3DFB06AC6D7','WIKI-78D6ED4FE2E7','WIKI-5FF944747E56',
   'WIKI-2127AE156834','WIKI-67F51A7AD2D5','WIKI-6B508244BF77','WIKI-981A92839D13'].every(id=>cardSrc.indexOf(id) >= 0));
okJs('E2 ★ 共通側の印に、永続効果で読むための記録である事が書かれている',
  engSrc.indexOf('spellActWatchS03') >= 0 && engSrc.indexOf('WIKI-78D6ED4FE2E7') >= 0);
okJs('E3 ★ 報告書に測った内容と残件が書かれている',
  doc.indexOf('WIKI-5FF944747E56') >= 0 && doc.indexOf('未対応') >= 0);
okJs('E4 ★ このテストが tools/check.py に登録されている',
  SRC_S534['tools/check.py'].indexOf('test_s03_u534_nitro_warrior.js') >= 0);
