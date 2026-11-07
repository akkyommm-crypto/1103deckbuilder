/* S03-U538 「サイバー・ダーク」の残り 2 枚
   《鎧黒竜－サイバー・ダーク・ドラゴン》と《サイバーダーク・インパクト!》。
   S03-U323（3 体のサイバー・ダーク）と S03-U130/U132（融合魔法のプロファイル）の共通処理に乗せる。

   当時裁定（判定と測定の根拠）
     WIKI-BE7F854239D0（10/01/21）②は「このカードの効果で装備した」ものだけを数える。
     WIKI-C6723DC2A561 融合素材代用モンスター（沼地の魔神王）はデッキに戻せない。
     WIKI-C9215D98E674 《チェーン・マテリアル》でデッキのモンスターは素材にできない（素材は手札・フィールド・墓地）。
     WIKI-FED15B34D67A 手札・裏側表示の素材をデッキに戻す場合は相手に確認させる。
     WIKI-B96A2A7A27A1 / WIKI-6B70CD8BA572 / WIKI-BED6B9FEA833 装備カード扱いのモンスターが墓地へ送られた
       後の効果は共通処理のまま。

   場面
     A 形
     B 手札・フィールド（裏側）・墓地から素材を持ち主のデッキに戻して融合召喚し、墓地のドラゴン族を装備する
     C 戦闘で破壊される場合、代わりに装備したモンスターが破壊される
     D negative control: 墓地にドラゴン族がいなければ装備せず、攻撃力は墓地のモンスターの数×100 だけ上がる
     E negative control: 融合素材代用モンスターでは発動できない
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S538 = pathA.resolve(__dirname, '..');
const rdS538 = p => fsA.readFileSync(pathA.join(ROOT_S538, p), 'utf8');
const SRC_S538 = {
  'cards/HZZZZZZZZZZZZV_claude_s03_u538_cyberdark.js': rdS538('cards/HZZZZZZZZZZZZV_claude_s03_u538_cyberdark.js'),
  'engine/1ZL_fusion_spell_s03.js': rdS538('engine/1ZL_fusion_spell_s03.js'),
  'docs/S03_U538_REPORT.md': rdS538('docs/S03_U538_REPORT.md'),
  'tools/check.py': rdS538('tools/check.py'),
  'build_manifest.json': rdS538('build_manifest.json')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function pu(uid){const h=findCardByUid(uid);return h?h.p:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
function pick(){
  const q=pc(); TITLES.push(String(q.title||''));
  if(q.max>1||q.min!==q.max){
    answerChoiceV49((q.candidates||[]).slice(0,Math.max(Number(q.min)||0,1)).map(x=>x.key));
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
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
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
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function revealedUids(){
  return (v41ReplayPackage(gameState).actions||[]).map(e=>e.action||{})
    .filter(a=>a.type==='REVEAL_ADD_V20').reduce((acc,a)=>acc.concat(((a.rec||{}).uids)||[]),[]);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sc=CARD_SCRIPTS['鎧黒竜－サイバー・ダーク・ドラゴン'];
const prof=FUSION_SPELL_PROFILES_S03['サイバーダーク・インパクト!'];
ok('A1 ★ 2 枚が登録され、鎧黒竜は共通の身代わりと装備の効果を持ち、融合魔法は素材をデッキに戻すプロファイルを持つ',
   !!sc && sc.equipHostSubstituteS03==='battle'
   && nativeEffectsV4('鎧黒竜－サイバー・ダーク・ドラゴン').map(e=>e.key).join(',')==='summon-equip'
   && typeof sc.continuous.apply==='function'
   && !!CARD_SCRIPTS['サイバーダーク・インパクト!']
   && !!prof && prof.dispose==='deck' && prof.zones.join(',')==='hand,mz,grave'
   && prof.exNameIncludes==='鎧黒竜'
   && !!summonOnlyByS03(CARD_DB[findCardIndex('鎧黒竜－サイバー・ダーク・ドラゴン')]),
   JSON.stringify({sub:sc&&sc.equipHostSubstituteS03,prof:prof}));
`, {expect:1});

/* ===== B. 融合召喚と装備 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-C9215D98E674: 素材は手札・フィールド・墓地から。WIKI-FED15B34D67A: 手札・裏側の素材は確認させる。 */
const imp=mk('サイバーダーク・インパクト!',0,'up');
const horn=mk('サイバー・ダーク・ホーン',0,'up');
const edge=setMon('サイバー・ダーク・エッジ',0);            /* フィールドの裏側守備表示 */
const keel=mk('サイバー・ダーク・キール',0,'up');
const blue=mk('青眼の白龍',0,'up');
const ex=mk('鎧黒竜－サイバー・ダーク・ドラゴン',0,'down');
gameState.players[0].hand=[imp,horn];
gameState.players[0].mz=[edge];
gameState.players[0].grave=[keel,blue,mk('ワイト',0),mk('ワイト',0)];
gameState.players[0].ex=[ex];
baselineA();
PREFER=[blue.uid];
const r=useCard(0,imp);
const atk=curATK(cu(ex.uid));
const rev=revealedUids();
ok('B1 ★ 手札・フィールド（裏側）・墓地の 3 枚が持ち主のデッキに戻り、鎧黒竜が融合召喚され、墓地のドラゴン族を装備して攻撃力が上がる',
   r==='idle'
   && zu(horn.uid)==='deck' && zu(edge.uid)==='deck' && zu(keel.uid)==='deck'
   && pu(horn.uid)===0 && pu(edge.uid)===0 && pu(keel.uid)===0
   && zu(ex.uid)==='mz' && cu(ex.uid).face==='up'
   && zu(blue.uid)==='sz' && cu(blue.uid).v46MonsterEquip===true
   && cu(blue.uid).equipTo && cu(blue.uid).equipTo.sourceUid===ex.uid
   && atk===4200
   && rev.indexOf(horn.uid)>=0 && rev.indexOf(edge.uid)>=0,
   JSON.stringify({r:r,horn:zu(horn.uid),edge:zu(edge.uid),keel:zu(keel.uid),ex:zu(ex.uid),blue:zu(blue.uid),atk:atk,rev:rev,titles:TITLES}));
audit('B1');
`, {expect:2});

/* ===== C. 戦闘破壊の身代わり ===== */
harness(COMMON + String.raw`
fresh();
const imp=mk('サイバーダーク・インパクト!',0,'up');
const horn=mk('サイバー・ダーク・ホーン',0,'up');
const edge=mk('サイバー・ダーク・エッジ',0,'up');
const keel=mk('サイバー・ダーク・キール',0,'up');
const petit=mk('プチリュウ',0,'up');                        /* 攻600 のドラゴン族 */
const ex=mk('鎧黒竜－サイバー・ダーク・ドラゴン',0,'down');
gameState.players[0].hand=[imp,horn,edge,keel];
gameState.players[0].grave=[petit];
gameState.players[0].ex=[ex];
const big=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[big];
baselineA();
const r1=useCard(0,imp);
const atkBefore=curATK(cu(ex.uid));                         /* 1000 + 600 + 0 */
const r2=turn();
phase('battle');
const r3=attack(1,0,0);
ok('C1 ★ 戦闘で破壊される場合、代わりにこのカードの効果で装備したモンスターが破壊され、鎧黒竜は残る',
   r1==='idle' && r3==='idle' && atkBefore===1600
   && zu(petit.uid)==='grave' && zu(ex.uid)==='mz' && cu(ex.uid).face==='up'
   && gameState.players[0].lp===7100,
   JSON.stringify({r1:r1,r2:r2,r3:r3,atkBefore:atkBefore,petit:zu(petit.uid),ex:zu(ex.uid),lp0:gameState.players[0].lp}));
audit('C1');
`, {expect:2});

/* ===== D. negative control: 墓地にドラゴン族がいない ===== */
harness(COMMON + String.raw`
fresh();
const imp=mk('サイバーダーク・インパクト!',0,'up');
const horn=mk('サイバー・ダーク・ホーン',0,'up');
const edge=mk('サイバー・ダーク・エッジ',0,'up');
const keel=mk('サイバー・ダーク・キール',0,'up');
const ex=mk('鎧黒竜－サイバー・ダーク・ドラゴン',0,'down');
gameState.players[0].hand=[imp,horn,edge,keel];
gameState.players[0].grave=[mk('ワイト',0)];
gameState.players[0].ex=[ex];
baselineA();
const r=useCard(0,imp);
const atk=curATK(cu(ex.uid));
ok('D1 ★ negative control: 墓地にドラゴン族がいなければ装備せず、攻撃力は墓地のモンスターの数×100 だけ上がる',
   r==='idle' && zu(ex.uid)==='mz'
   && (gameState.players[0].sz||[]).length===0
   && atk===1100,
   JSON.stringify({r:r,ex:zu(ex.uid),sz:(gameState.players[0].sz||[]).length,atk:atk,grave:(gameState.players[0].grave||[]).map(nmOf)}));
audit('D1');
`, {expect:2});

/* ===== E. negative control: 融合素材代用モンスター ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-C6723DC2A561: 《沼地の魔神王》などの代用モンスターをデッキに戻す事はできない */
const imp=mk('サイバーダーク・インパクト!',0,'up');
const horn=mk('サイバー・ダーク・ホーン',0,'up');
const edge=mk('サイバー・ダーク・エッジ',0,'up');
const mud=mk('沼地の魔神王',0,'up');
const ex=mk('鎧黒竜－サイバー・ダーク・ドラゴン',0,'down');
gameState.players[0].hand=[imp,horn,edge,mud];
gameState.players[0].ex=[ex];
baselineA();
const opts=fusionSpellOptionsS03(0,'サイバーダーク・インパクト!').length;
const leg=strictScriptLegalityV2('サイバーダーク・インパクト!',0,'hand',0,{});
ok('E1 ★ negative control: 「キール」の代わりに《沼地の魔神王》があっても発動できない',
   opts===0 && leg.ok===false && zu(ex.uid)==='ex',
   JSON.stringify({opts:opts,leg:leg,ex:zu(ex.uid)}));
`, {expect:1});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S538['cards/HZZZZZZZZZZZZV_claude_s03_u538_cyberdark.js'];
const engSrc = SRC_S538['engine/1ZL_fusion_spell_s03.js'];
const docSrc = SRC_S538['docs/S03_U538_REPORT.md'];
const manSrc = SRC_S538['build_manifest.json'];
const IDS_S538 = ['WIKI-BE7F854239D0','WIKI-B96A2A7A27A1','WIKI-6B70CD8BA572','WIKI-BED6B9FEA833',
  'WIKI-8B83F58E64B5','WIKI-60A8E4781EE0','WIKI-C6723DC2A561','WIKI-C9215D98E674','WIKI-FED15B34D67A'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持ち、エンジンの追加もその根拠を書いている',
  IDS_S538.every(id=>cardSrc.indexOf(id) >= 0)
  && engSrc.indexOf('WIKI-FED15B34D67A') >= 0 && engSrc.indexOf('WIKI-C6723DC2A561') >= 0);
okJs('F2 ★ 報告書に測った内容と残件が書かれている',
  IDS_S538.every(id=>docSrc.indexOf(id) >= 0) && docSrc.indexOf('未対応') >= 0);
okJs('F3 ★ テストとカードファイルが登録されている',
  SRC_S538['tools/check.py'].indexOf('test_s03_u538_cyberdark.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZV_claude_s03_u538_cyberdark.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZV_claude_s03_u538_cyberdark.js') < manSrc.indexOf('cards/40_auto_interpreter.js'));
