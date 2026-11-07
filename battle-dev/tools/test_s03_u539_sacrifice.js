/* S03-U539 《サクリファイス》《サウザンド・アイズ・サクリファイス》
   相手モンスター1体を装備カード扱いとして自分に装備し、攻守がその数値になり、戦闘破壊の身代わりにする
   —— 同じ仕組みを 1 つの共通定義でまとめた単位。

   当時裁定（判定と測定の根拠）
     WIKI-503AC3E45E07（10/07/10）自分が戦闘ダメージを受けない場合、③は適用されない。
     WIKI-A303188453BB / WIKI-4D5378F1E3CC（09/08/29）装備カード扱いのまま破壊された場合、
       そのカード自身の「破壊された場合」の効果は働く（身代わりは破壊として墓地へ送る）。
     WIKI-D4D0FA960D3E（08/05/16）等: 装備カード扱いのモンスターはモンスターではない。
     現行Q&A fid 113 / 6156 / 11497（retro1103 C 推定）: ②の攻守はこのカード自身の効果による置き換え。

   場面
     A 形
     B 《イリュージョンの儀式》で儀式召喚し、相手モンスターを装備して攻守がその数値になる（1ターンに1度・1体のみ）
     C 戦闘で破壊される場合、代わりに装備したモンスターが破壊され、③で同じ数値の効果ダメージを相手も受ける
     D negative control: 装備していなければ③は働かず、攻守は 0 のままで自分が戦闘破壊される
     E SAS: このカード以外のフィールドのモンスターは攻撃できず、表示形式も変更できない
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S539 = pathA.resolve(__dirname, '..');
const rdS539 = p => fsA.readFileSync(pathA.join(ROOT_S539, p), 'utf8');
const SRC_S539 = {
  'cards/HZZZZZZZZZZZZW_claude_s03_u539_sacrifice.js': rdS539('cards/HZZZZZZZZZZZZW_claude_s03_u539_sacrifice.js'),
  'engine/40_legal_script_engine.js': rdS539('engine/40_legal_script_engine.js'),
  'engine/00_state_actions.js': rdS539('engine/00_state_actions.js'),
  'docs/S03_U539_REPORT.md': rdS539('docs/S03_U539_REPORT.md'),
  'tools/check.py': rdS539('tools/check.py'),
  'build_manifest.json': rdS539('build_manifest.json')
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const s1=CARD_SCRIPTS['サクリファイス'], s2=CARD_SCRIPTS['サウザンド・アイズ・サクリファイス'];
const k1=nativeEffectsV4('サクリファイス').map(e=>e.key), k2=nativeEffectsV4('サウザンド・アイズ・サクリファイス').map(e=>e.key);
ok('A1 ★ 2 枚が共通の定義で登録され、戦闘破壊の身代わりと攻守の置き換えを持ち、SAS だけが攻撃・表示形式の封じを持つ',
   !!s1 && !!s2
   && s1.equipHostSubstituteS03==='battle' && s2.equipHostSubstituteS03==='battle'
   && k1.join(',')==='equip-foe,reflect-damage' && k2.join(',')==='equip-foe'
   && typeof s1.continuous.apply==='function' && typeof s2.continuous.apply==='function'
   && typeof s2.continuous.cannotAttack==='function' && typeof s2.continuous.cannotChangePosition==='function'
   && typeof s1.continuous.cannotAttack!=='function',
   JSON.stringify({k1:k1,k2:k2}));
`, {expect:1});

/* ===== B. 儀式召喚と装備 ===== */
harness(COMMON + String.raw`
fresh();
const ritual=mk('イリュージョンの儀式',0,'up');
const sac=mk('サクリファイス',0,'up');
const fodder=mk('ワイト',0,'up');
gameState.players[0].sz=[ritual];          /* 儀式魔法は魔法＆罠ゾーンから発動する */
gameState.players[0].hand=[sac,fodder];
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[demon];
baselineA();
const r1=useCard(0,ritual);
const onField=zu(sac.uid)==='mz';
const r2=useKey(0,sac,'equip-foe');
const eq=cu(demon.uid);
const atk=curATK(cu(sac.uid)), def=curDEF(cu(sac.uid));
/* 1ターンに1度・1体のみ：効果の発動条件そのものを測る */
const again=condOf('サクリファイス','equip-foe',0,'mz',mzIdx(0,sac.uid));
ok('B1 ★ 儀式召喚した《サクリファイス》が相手の《デーモンの召喚》を装備カード扱いで装備し、攻守が 2500/1200 になる（1ターンに1度・1体のみ）',
   r1==='idle' && r2==='idle' && onField
   && zu(demon.uid)==='sz' && pu(demon.uid)===0
   && !!eq && eq.v46MonsterEquip===true && !!eq.equipTo && eq.equipTo.sourceUid===sac.uid
   && atk===2500 && def===1200 && again===false,
   JSON.stringify({r1:r1,r2:r2,sac:zu(sac.uid),demon:zu(demon.uid),src:eq&&eq.equipTo&&eq.equipTo.sourceUid===sac.uid,atk:atk,def:def,again:again,titles:TITLES}));
audit('B1');
`, {expect:2});

/* ===== C. 身代わりと③の反射ダメージ ===== */
harness(COMMON + String.raw`
fresh();
const sac=mk('サクリファイス',0,'up');
gameState.players[0].mz=[sac];
const wight=mk('ワイト',1,'up');
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[wight,demon];
baselineA();
PREFER=[wight.uid];
const r1=useKey(0,sac,'equip-foe');       /* 攻 300 の《ワイト》を装備 */
const atk=curATK(cu(sac.uid));
const r2=turn();
phase('battle');
const r3=attack(1,mzIdx(1,demon.uid),0);  /* 2500 で 300 の《サクリファイス》を攻撃 */
ok('C1 ★ 戦闘で破壊される場合は代わりに装備した《ワイト》が破壊され、受けた 2200 と同じ数値の効果ダメージを相手も受ける',
   r1==='idle' && r3==='idle' && atk===300
   && zu(wight.uid)==='grave' && pu(wight.uid)===1
   && zu(sac.uid)==='mz' && curATK(cu(sac.uid))===0
   && gameState.players[0].lp===5800 && gameState.players[1].lp===5800,
   JSON.stringify({r1:r1,r2:r2,r3:r3,atk:atk,wight:zu(wight.uid),sac:zu(sac.uid),lp0:gameState.players[0].lp,lp1:gameState.players[1].lp}));
audit('C1');
`, {expect:2});

/* ===== D. negative control: 装備していない場合 ===== */
harness(COMMON + String.raw`
fresh();
const sac=mk('サクリファイス',0,'up');
gameState.players[0].mz=[sac];
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[demon];
baselineA();
const r1=turn();
phase('battle');
const r2=attack(1,0,0);
ok('D1 ★ negative control: 装備していなければ攻守は 0 のままで自分が戦闘破壊され、③の効果ダメージも出ない',
   r2==='idle' && zu(sac.uid)==='grave'
   && gameState.players[0].lp===5500 && gameState.players[1].lp===8000,
   JSON.stringify({r1:r1,r2:r2,sac:zu(sac.uid),lp0:gameState.players[0].lp,lp1:gameState.players[1].lp}));
audit('D1');
`, {expect:2});

/* ===== E. SAS の封じ ===== */
harness(COMMON + String.raw`
fresh();
const sas=mk('サウザンド・アイズ・サクリファイス',0,'up');
const mine=mk('ワイト',0,'up');
gameState.players[0].mz=[sas,mine];
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[demon];
baselineA();
const blockMine=cannotAttackNow(cu(mine.uid)), blockFoe=cannotAttackNow(cu(demon.uid));
const selfOk=cannotAttackNow(cu(sas.uid));
const posMine=canManualPositionChange(cu(mine.uid)), posSelf=canManualPositionChange(cu(sas.uid));
phase('battle');
const r1=attack(0,mzIdx(0,mine.uid),'direct');     /* 攻撃できない */
const lp1=gameState.players[1].lp;
ok('E1 ★ SAS がある限り、このカード以外のモンスターは攻撃できず表示形式も変更できない（SAS 自身は可能）',
   blockMine===true && blockFoe===true && selfOk===false
   && posMine===false && posSelf===true && lp1===8000,
   JSON.stringify({blockMine:blockMine,blockFoe:blockFoe,selfOk:selfOk,posMine:posMine,posSelf:posSelf,r1:r1,lp1:lp1}));
audit('E1');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S539['cards/HZZZZZZZZZZZZW_claude_s03_u539_sacrifice.js'];
const docSrc = SRC_S539['docs/S03_U539_REPORT.md'];
const manSrc = SRC_S539['build_manifest.json'];
const IDS_S539 = ['WIKI-503AC3E45E07','WIKI-D4D0FA960D3E','WIKI-756299CDD223','WIKI-DB20E4E76CDC',
  'WIKI-8F8B9648C648','WIKI-5A00A96B12A6','WIKI-A303188453BB','WIKI-4D5378F1E3CC','WIKI-9A25B3DA6E23',
  'WIKI-E2ED41716746','WIKI-CA15F82514E4','WIKI-7274550C7E25','WIKI-702D46EDC71F','WIKI-5D4B80FEC3FD'];
okJs('F1 ★ カードは当時裁定の ID を根拠として持ち、エンジンの追加にも根拠が書かれている',
  IDS_S539.every(id=>cardSrc.indexOf(id) >= 0)
  && SRC_S539['engine/00_state_actions.js'].indexOf('S03-U539') >= 0
  && SRC_S539['engine/40_legal_script_engine.js'].indexOf('S03-U539') >= 0);
okJs('F2 ★ 報告書に測った内容と残件が書かれている',
  IDS_S539.every(id=>docSrc.indexOf(id) >= 0) && docSrc.indexOf('未対応') >= 0 && docSrc.indexOf('未確定') >= 0);
okJs('F3 ★ テストとカードファイルが登録されている',
  SRC_S539['tools/check.py'].indexOf('test_s03_u539_sacrifice.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZW_claude_s03_u539_sacrifice.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZW_claude_s03_u539_sacrifice.js') < manSrc.indexOf('cards/40_auto_interpreter.js'));
