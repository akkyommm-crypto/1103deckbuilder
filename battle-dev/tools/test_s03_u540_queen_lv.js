/* S03-U540 《魅惑の女王 LV3》《LV5》《LV7》
   相手モンスターを装備カード扱いで自分に装備し（レベル上限つき・1枚まで）、戦闘破壊の身代わりにし、
   スタンバイフェイズに次の LV へ繋ぐ —— 同じ仕組みの 3 枚をまとめた単位。

   当時裁定（判定と測定の根拠）
     WIKI-0B91280F9E07 装備できるのは「レベル3以下と判別できる表側表示モンスターのみ」。
     WIKI-BB36264715CC 《LV5》の効果で特殊召喚した《LV7》を裏側にして反転召喚した後は吸収効果が使えない。
     WIKI-7AF9516DB3A7 / WIKI-CC23DF26FBE0 装備カード扱いのモンスターはモンスターカードではない。

   場面
     A 形
     B LV3 がレベル3以下の表側表示モンスターだけを装備でき（1ターンに1度・1枚まで）、攻守は変わらない
     C スタンバイフェイズに LV3 → LV5 → LV7 と繋がり、LV7 はレベル制限なしで装備できる
     D negative control: LV3 の効果で特殊召喚していない LV5 は吸収できない／反転召喚後の LV7 も使えない
     E 戦闘で破壊される場合、代わりに装備したモンスターが破壊される
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S540 = pathA.resolve(__dirname, '..');
const rdS540 = p => fsA.readFileSync(pathA.join(ROOT_S540, p), 'utf8');
const SRC_S540 = {
  'cards/HZZZZZZZZZZZZX_claude_s03_u540_queen_lv.js': rdS540('cards/HZZZZZZZZZZZZX_claude_s03_u540_queen_lv.js'),
  'docs/S03_U540_REPORT.md': rdS540('docs/S03_U540_REPORT.md'),
  'tools/check.py': rdS540('tools/check.py'),
  'build_manifest.json': rdS540('build_manifest.json')
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
function condOf(name,key,p,zone,index){
  const card=zoneCard(gameState.players[p],zone,index);
  const e=nativeEffectsV4(name).find(x=>x.key===key);
  if(!card||!e) return 'MISSING';
  const ctx=makeContext(p,card,zone,index,'legalCheck',{v4EffectKey:key});
  try{ return !!e.condition(ctx); }catch(err){ return 'ERR'; }
}
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
function useKey(p,c,key){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{v4EffectKey:key});return drive();}
function mzIdx(p,uid){return (gameState.players[p].mz||[]).findIndex(c=>c&&c.uid===uid);}
function poolN(lv){return u540PoolS03({player:0,opponent:1},lv).length;}
/* 盤面の作り込み: 「このカードの効果で装備した」状態を baselineA() の前に組む
   （engine/1N の applyGraveEquipV31 と同じ形。持ち主は相手のまま） */
function buildEquip(eqCard,hostCard,p){
  eqCard.controller=p;eqCard.face='up';eqCard.pos='atk';
  eqCard.equipUid=eqCard.uid;eqCard.equipTo={p:p,uid:hostCard.uid,sourceUid:hostCard.uid};
  eqCard.v46MonsterEquip=true;
  hostCard.equippedBy=[eqCard.uid];
  gameState.players[p].sz.push(eqCard);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const k3=nativeEffectsV4('魅惑の女王 LV3').map(e=>e.key);
const k5=nativeEffectsV4('魅惑の女王 LV5').map(e=>e.key);
const k7=nativeEffectsV4('魅惑の女王 LV7').map(e=>e.key);
ok('A1 ★ 3 枚が共通の定義で登録され、LV3/LV5 は吸収と LV 上げ、LV7 は吸収だけを持ち、戦闘破壊の身代わりを宣言している',
   k3.join(',')==='absorb,lv-up' && k5.join(',')==='absorb,lv-up' && k7.join(',')==='absorb'
   && ['魅惑の女王 LV3','魅惑の女王 LV5','魅惑の女王 LV7'].every(n=>CARD_SCRIPTS[n].equipHostSubstituteS03==='battle')
   && typeof CARD_SCRIPTS['魅惑の女王 LV3'].passive.onStandbyPhase==='function'
   && typeof CARD_SCRIPTS['魅惑の女王 LV7'].passive.onStandbyPhase!=='function',
   JSON.stringify({k3:k3,k5:k5,k7:k7}));
`, {expect:1});

/* ===== B. LV3 の吸収 ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-0B91280F9E07: 装備できるのはレベル3以下と判別できる表側表示モンスターのみ */
const q3=mk('魅惑の女王 LV3',0,'up');
gameState.players[0].mz=[q3];
const wight=mk('ワイト',1,'up');              /* レベル1・表側 → 候補 */
const demon=mk('デーモンの召喚',1,'up');      /* レベル6・表側 → 候補外 */
const hidden=setMon('ワイト',1);              /* 裏側 → 候補外 */
gameState.players[1].mz=[wight,demon,hidden];
baselineA();
const pool3=poolN(3);
PREFER=[wight.uid];
const r1=useKey(0,q3,'absorb');
const eq=cu(wight.uid);
const again=condOf('魅惑の女王 LV3','absorb',0,'mz',mzIdx(0,q3.uid));
ok('B1 ★ レベル3以下の表側表示モンスターだけを装備でき（候補は 1 体）、1ターンに1度・1枚まで、攻撃力は 500 のまま変わらない',
   r1==='idle' && pool3===1
   && zu(wight.uid)==='sz' && pu(wight.uid)===0
   && !!eq && eq.v46MonsterEquip===true && !!eq.equipTo && eq.equipTo.sourceUid===q3.uid
   && curATK(cu(q3.uid))===500 && curDEF(cu(q3.uid))===500
   && again===false,
   JSON.stringify({r1:r1,pool3:pool3,wight:zu(wight.uid),src:eq&&eq.equipTo&&eq.equipTo.sourceUid===q3.uid,atk:curATK(cu(q3.uid)),again:again}));
audit('B1');
`, {expect:2});

/* ===== C. LV の連鎖（スタンバイフェイズ） ===== */
harness(COMMON + String.raw`
fresh();
/* スタンバイフェイズに「この効果で装備カードを装備したこのカード」を墓地に送って次の LV を出す。
   装備の状態は baselineA() の前に組む（engine/1N と同じ形）。 */
const q3=mk('魅惑の女王 LV3',0,'up');
gameState.players[0].mz=[q3];
const taken=mk('ワイト',1,'up');
const q5=mk('魅惑の女王 LV5',0,'up');
gameState.players[0].hand=[q5];
buildEquip(taken,q3,0);
gameState.phase='standby';
baselineA();
const armed=condOf('魅惑の女王 LV3','lv-up',0,'mz',mzIdx(0,q3.uid));
const r1=useKey(0,q3,'lv-up');
const now=cu(q5.uid);
ok('C1 ★ スタンバイフェイズに、この効果で装備したこのカードを墓地へ送って「魅惑の女王 LV5」を特殊召喚し、「LV3 の効果で特殊召喚した」記録が残る',
   armed===true && r1==='idle'
   && zu(q3.uid)==='grave' && zu(q5.uid)==='mz'
   && !!now.summonSrcS03 && now.summonSrcS03.name==='魅惑の女王 LV3'
   && zu(taken.uid)==='grave' && pu(taken.uid)===1,
   JSON.stringify({armed:armed,r1:r1,q3:zu(q3.uid),q5:zu(q5.uid),src:now.summonSrcS03,taken:zu(taken.uid)}));
audit('C1');
`, {expect:2});

/* ===== C2. LV5 はレベル5以下・LV7 はレベル制限なし ===== */
harness(COMMON + String.raw`
fresh();
const q5=mk('魅惑の女王 LV5',0,'up');
q5.summonSrcS03={name:'魅惑の女王 LV3',turn:4};
const q7=mk('魅惑の女王 LV7',0,'up');
q7.summonSrcS03={name:'魅惑の女王 LV5',turn:4};
gameState.players[0].mz=[q5,q7];
const elf=mk('ホーリー・エルフ',1,'up');       /* レベル4 */
const demon=mk('デーモンの召喚',1,'up');       /* レベル6 */
gameState.players[1].mz=[elf,demon];
baselineA();
const pool5=poolN(5), poolAny=poolN(null);
PREFER=[elf.uid];
const r1=useKey(0,q5,'absorb');
PREFER=[demon.uid];
const r2=useKey(0,q7,'absorb');
ok('C2 ★ LV5 はレベル5以下だけ（候補 1 体）、LV7 はレベル制限なし（候補 2 体）で装備でき、どちらも自分の効果の印を持つ',
   r1==='idle' && r2==='idle' && pool5===1 && poolAny===2
   && zu(elf.uid)==='sz' && cu(elf.uid).equipTo.sourceUid===q5.uid
   && zu(demon.uid)==='sz' && cu(demon.uid).equipTo.sourceUid===q7.uid,
   JSON.stringify({r1:r1,r2:r2,pool5:pool5,poolAny:poolAny,elf:zu(elf.uid),demon:zu(demon.uid)}));
audit('C2');
`, {expect:2});

/* ===== D. negative control ===== */
harness(COMMON + String.raw`
fresh();
/* LV3 の効果で特殊召喚していない LV5 は吸収できない */
const q5=mk('魅惑の女王 LV5',0,'up');
gameState.players[0].mz=[q5];
const wight=mk('ワイト',1,'up');
gameState.players[1].mz=[wight];
baselineA();
const can5=condOf('魅惑の女王 LV5','absorb',0,'mz',mzIdx(0,q5.uid));
ok('D1 ★ negative control: 「魅惑の女王 LV3」の効果で特殊召喚していない LV5 は吸収効果を発動できない',
   can5===false, JSON.stringify({can5:can5}));
`, {expect:1});

/* ===== D2. 反転召喚した後は使えない ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-BB36264715CC: 《月の書》で裏側守備表示にしてから反転召喚すると吸収効果が使えなくなる */
const q7=mk('魅惑の女王 LV7',0,'up');
q7.summonSrcS03={name:'魅惑の女王 LV5',turn:4};
gameState.players[0].mz=[q7];
const foe=mk('ワイト',1,'up');
gameState.players[1].mz=[foe];
const book=mk('月の書',0,'up');
gameState.players[0].sz=[book];
baselineA();
const before=condOf('魅惑の女王 LV7','absorb',0,'mz',0);
PREFER=[q7.uid];
const r1=useCard(0,book);
const down=cu(q7.uid).face==='down';
doFlipUp(0,'mz',0,'atk');
const r2=drive();
const after=condOf('魅惑の女王 LV7','absorb',0,'mz',0);
ok('D2 ★ negative control: 《月の書》で裏側にしてから反転召喚した LV7 は、吸収効果を発動できない',
   before===true && r1==='idle' && down===true && r2==='idle' && after===false
   && Number(cu(q7.uid).flipSummonedTurnS03)===Number(gameState.turn),
   JSON.stringify({before:before,down:down,after:after,r1:r1,r2:r2,flip:cu(q7.uid).flipSummonedTurnS03}));
audit('D2');
`, {expect:2});

/* ===== E. 戦闘破壊の身代わり ===== */
harness(COMMON + String.raw`
fresh();
const q3=mk('魅惑の女王 LV3',0,'up');
gameState.players[0].mz=[q3];
const wight=mk('ワイト',1,'up');
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[wight,demon];
baselineA();
PREFER=[wight.uid];
const r1=useKey(0,q3,'absorb');
const r2=turn();
phase('battle');
const r3=attack(1,mzIdx(1,demon.uid),0);
ok('E1 ★ 戦闘で破壊される場合、代わりに装備した《ワイト》が持ち主の墓地へ破壊され、LV3 はフィールドに残る',
   r1==='idle' && r3==='idle'
   && zu(wight.uid)==='grave' && pu(wight.uid)===1
   && zu(q3.uid)==='mz' && gameState.players[0].lp===6000,
   JSON.stringify({r1:r1,r2:r2,r3:r3,wight:zu(wight.uid),q3:zu(q3.uid),lp0:gameState.players[0].lp}));
audit('E1');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S540['cards/HZZZZZZZZZZZZX_claude_s03_u540_queen_lv.js'];
const docSrc = SRC_S540['docs/S03_U540_REPORT.md'];
const manSrc = SRC_S540['build_manifest.json'];
const IDS_S540 = ['WIKI-0B91280F9E07','WIKI-BB36264715CC','WIKI-7AF9516DB3A7','WIKI-CC23DF26FBE0'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持つ', IDS_S540.every(id=>cardSrc.indexOf(id) >= 0));
okJs('F2 ★ 報告書に測った内容と残件が書かれている',
  IDS_S540.every(id=>docSrc.indexOf(id) >= 0) && docSrc.indexOf('未対応') >= 0 && docSrc.indexOf('未確定') >= 0);
okJs('F3 ★ テストとカードファイルが登録されている',
  SRC_S540['tools/check.py'].indexOf('test_s03_u540_queen_lv.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZX_claude_s03_u540_queen_lv.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZX_claude_s03_u540_queen_lv.js') < manSrc.indexOf('cards/40_auto_interpreter.js'));
