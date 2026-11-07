/* S03-U541 《シー・アーチャー》《The アトモスフィア》《地底のアラクネー》
   「モンスター1体を装備カード扱いとして自分に装備する」同じ仕組みの 3 枚。
   エンジンへの追加は、任意の身代わりをホスト側が申告できるようにした 1 点（equipHostSubstituteOptionalS03）。

   当時裁定（判定と測定の根拠）
     WIKI-4C96ECDF55A6（09/10/27）シー・アーチャー: 装備は起動効果、自己強化と破壊代替は永続効果。
     WIKI-E678659CBF07（10/09/16）このカードと装備したモンスターが同時に破壊される場合は身代わりを使えない。
     WIKI-1577B0FF0555（09/09/26）身代わりで破壊した装備モンスターの「墓地へ送られた時」は発動できる。
     WIKI-524DDFFDE4D5 / WIKI-8A1338EE7506 / WIKI-7FAD37B22612 / WIKI-08C61FF2CB13（09/12/28）アトモスフィア。
     WIKI-8F834E1A7A8D / WIKI-9E07F8028E49 / WIKI-CFB024C0A1AF / WIKI-4F18E5430766（09/08）アラクネー。

   場面
     A 形
     B シー・アーチャー: 自分のレベル3以下だけを装備でき、攻撃力が 800 アップする（1ターンに1度・1体のみ）
     C 任意の身代わり: 効果で破壊される時に装備したモンスターを代わりに破壊できる／使わない選択もできる
     D アトモスフィア: 召喚条件（フィールド2体＋墓地1体を除外）で特殊召喚し、元々の数値分アップする
     E アラクネー: 攻撃時に相手は魔法・罠を発動できない／戦闘破壊の任意の身代わり
     F negative control: 解決時にアラクネーが場に表側表示で無い場合、選択した相手モンスターは墓地へ送られる
     G 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S541 = pathA.resolve(__dirname, '..');
const rdS541 = p => fsA.readFileSync(pathA.join(ROOT_S541, p), 'utf8');
const SRC_S541 = {
  'cards/HZZZZZZZZZZZZY_claude_s03_u541_equip_self.js': rdS541('cards/HZZZZZZZZZZZZY_claude_s03_u541_equip_self.js'),
  'engine/1ZV_destroy_substitute_s03.js': rdS541('engine/1ZV_destroy_substitute_s03.js'),
  'docs/S03_U541_REPORT.md': rdS541('docs/S03_U541_REPORT.md'),
  'tools/check.py': rdS541('tools/check.py'),
  'build_manifest.json': rdS541('build_manifest.json')
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
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];TITLES=[];SNAP=[];WATCH=null;
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function setc(n,p){const c=mk(n,p,'down');c.setTurn=0;return c;}
function condOf(name,key,p,zone,index){
  const card=zoneCard(gameState.players[p],zone,index);
  const e=nativeEffectsV4(name).find(x=>x.key===key);
  if(!card||!e) return 'MISSING';
  const ctx=makeContext(p,card,zone,index,'legalCheck',{v4EffectKey:key});
  try{ return !!e.condition(ctx); }catch(err){ return 'ERR'; }
}
/* 戦闘中に engine が何を出したか／何が合法だったかを記録する（S03-U144 のテストと同じ作り） */
let SNAP=[],WATCH=null;
const __gcrS541=getChainResponsesV2;
getChainResponsesV2=function(p){const r=__gcrS541.apply(this,arguments);
  if(gameState.pendingAttack||gameState.battle){const e={p,names:r.map(x=>x.db.n)};
    if(WATCH&&WATCH.p===p) e.L=strictScriptLegalityV2(WATCH.name,WATCH.p,WATCH.zone,WATCH.idx,{});
    SNAP.push(e);}
  return r;};
function lockedBy(name){return SNAP.some(e=>e.L&&e.L.ok===false&&new RegExp(name).test(e.L.reason||''));}
function offeredDuring(p,name){return SNAP.filter(e=>e.p===p).some(e=>e.names.indexOf(name)>=0);}
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
function respondZone(p,c){for(let i=0;i<40&&pc();i++)pick();const h=findCardByUid(c.uid);duelActivateResponseV2(p,h.zone,h.index,p);for(let i=0;i<40&&pc();i++)pick();return true;}
function mzIdx(p,uid){return (gameState.players[p].mz||[]).findIndex(c=>c&&c.uid===uid);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const sa=CARD_SCRIPTS['シー・アーチャー'], at=CARD_SCRIPTS['The アトモスフィア'], ar=CARD_SCRIPTS['地底のアラクネー'];
ok('A1 ★ 3 枚が登録され、2 枚はホスト側の任意の身代わりを申告し、アトモスフィアは召喚条件、アラクネーは攻撃時のロックを持つ',
   !!sa && !!at && !!ar
   && !!sa.equipHostSubstituteOptionalS03 && sa.equipHostSubstituteOptionalS03.causes.join(',')==='battle,effect'
   && !!ar.equipHostSubstituteOptionalS03 && ar.equipHostSubstituteOptionalS03.causes.join(',')==='battle'
   && !at.equipHostSubstituteOptionalS03
   && !!at.summonProcedure && typeof at.summonProcedure.cost==='function'
   && !!ATTACK_LOCK_S03['地底のアラクネー']
   && nativeEffectsV4('シー・アーチャー').map(e=>e.key).join(',')==='equip-own'
   && nativeEffectsV4('The アトモスフィア').map(e=>e.key).join(',')==='equip-foe'
   && nativeEffectsV4('地底のアラクネー').map(e=>e.key).join(',')==='equip-foe',
   JSON.stringify({sa:!!sa.equipHostSubstituteOptionalS03,ar:ar.equipHostSubstituteOptionalS03,at:!!at.summonProcedure}));
`, {expect:1});

/* ===== B. シー・アーチャーの装備 ===== */
harness(COMMON + String.raw`
fresh();
const archer=mk('シー・アーチャー',0,'up');
const small=mk('ワイト',0,'up');              /* レベル1 → 候補 */
const big=mk('ホーリー・エルフ',0,'up');       /* レベル4 → 候補外 */
gameState.players[0].mz=[archer,small,big];
baselineA();
PREFER=[small.uid];
const r1=useKey(0,archer,'equip-own');
const atk=curATK(cu(archer.uid));
const again=condOf('シー・アーチャー','equip-own',0,'mz',mzIdx(0,archer.uid));
ok('B1 ★ 自分のレベル3以下のモンスターだけを装備でき、攻撃力が 1200 → 2000 になり、1ターンに1度・1体のみ',
   r1==='idle'
   && zu(small.uid)==='sz' && cu(small.uid).v46MonsterEquip===true
   && cu(small.uid).equipTo.sourceUid===archer.uid
   && zu(big.uid)==='mz' && atk===2000 && again===false,
   JSON.stringify({r1:r1,small:zu(small.uid),big:zu(big.uid),atk:atk,again:again}));
audit('B1');
`, {expect:2});

/* ===== C. 任意の身代わり（効果による破壊） ===== */
harness(COMMON + String.raw`
fresh();
const archer=mk('シー・アーチャー',0,'up');
const small=mk('ワイト',0,'up');
gameState.players[0].mz=[archer,small];
const hole=mk('ブラック・ホール',1,'up');
gameState.players[1].hand=[hole];
baselineA();
PREFER=[small.uid];
const r1=useKey(0,archer,'equip-own');
const r2=turn();
PREFER=[small.uid];                            /* 身代わりに装備カードを選ぶ */
const r3=useCard(1,hole);
ok('C1 ★ 効果で破壊される時、代わりに装備したモンスターを破壊して《シー・アーチャー》は残る',
   r1==='idle' && r3==='idle'
   && zu(archer.uid)==='mz' && zu(small.uid)==='grave'
   && TITLES.some(t=>t.indexOf('シー・アーチャー')>=0 && t.indexOf('破壊されます')>=0),
   JSON.stringify({r1:r1,r2:r2,r3:r3,archer:zu(archer.uid),small:zu(small.uid),titles:TITLES}));
audit('C1');
`, {expect:2});

/* ===== C2. negative control: 身代わりを使わない選択もできる ===== */
harness(COMMON + String.raw`
fresh();
const archer=mk('シー・アーチャー',0,'up');
const small=mk('ワイト',0,'up');
gameState.players[0].mz=[archer,small];
const hole=mk('ブラック・ホール',1,'up');
gameState.players[1].hand=[hole];
baselineA();
PREFER=[small.uid];
const r1=useKey(0,archer,'equip-own');
const r2=turn();
PREFER=['decline'];                            /* 身代わりを使わない */
const r3=useCard(1,hole);
ok('C2 ★ negative control: 任意なので使わない選択ができ、その場合は《シー・アーチャー》が破壊される',
   r1==='idle' && r3==='idle' && zu(archer.uid)==='grave',
   JSON.stringify({r1:r1,r2:r2,r3:r3,archer:zu(archer.uid),small:zu(small.uid)}));
audit('C2');
`, {expect:2});

/* ===== D. The アトモスフィア ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-524DDFFDE4D5: 特殊召喚は召喚ルール効果。WIKI-08C61FF2CB13: 上がるのは記載された数値分。 */
const atmo=mk('The アトモスフィア',0,'up');
gameState.players[0].hand=[atmo];
const m1=mk('ワイト',0,'up'), m2=mk('ワイト',0,'up');
gameState.players[0].mz=[m1,m2];
gameState.players[0].grave=[mk('ワイト',0)];
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[demon];
baselineA();
const graveBefore=(gameState.players[0].grave||[]).length;
const legal=strictSummonProcedureLegality('The アトモスフィア',0,'hand',0);
/* 表示形式は 2 通り（表側攻撃／表側守備）なので、UI と同じ finishSummonProcedure を呼ぶ */
finishSummonProcedure('The アトモスフィア',0,'hand',0,'atk');
const r1=drive();
const onField=zu(atmo.uid)==='mz';
const banished=(gameState.players[0].banish||[]).length;
PREFER=[demon.uid];
const r2=useKey(0,atmo,'equip-foe');
const atk=curATK(cu(atmo.uid)), def=curDEF(cu(atmo.uid));
ok('D1 ★ フィールドの 2 体と墓地の 1 体を除外して特殊召喚され、相手モンスターを装備して攻守が元々の数値分アップする',
   r1==='idle' && r2==='idle' && onField && legal.ok===true
   && zu(m1.uid)==='banish' && zu(m2.uid)==='banish' && banished===3 && graveBefore===1
   && zu(demon.uid)==='sz' && cu(demon.uid).equipTo.sourceUid===atmo.uid
   && atk===3500 && def===2000,
   JSON.stringify({r1:r1,r2:r2,legal:legal,onField:onField,m1:zu(m1.uid),banished:banished,atk:atk,def:def,toasts:TOASTS}));
audit('D1');
`, {expect:2});

/* ===== E. 地底のアラクネー ===== */
harness(COMMON + String.raw`
fresh();
const arac=mk('地底のアラクネー',0,'up');
gameState.players[0].mz=[arac];
const foe=mk('ワイト',1,'up');
const demon=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe,demon];
const mf=mk('聖なるバリア －ミラーフォース－',1,'down');
mf.setTurn=3;
gameState.players[1].sz=[mf];
baselineA();
PREFER=[foe.uid];
const r1=useKey(0,arac,'equip-foe');
const equipped=zu(foe.uid)==='sz' && cu(foe.uid).equipTo.sourceUid===arac.uid;
SNAP=[];WATCH={p:1,name:'聖なるバリア －ミラーフォース－',zone:'sz',idx:0};
phase('battle');
const r2=attack(0,mzIdx(0,arac.uid),mzIdx(1,demon.uid));   /* 2400 で 2500 に攻撃 → 戦闘破壊される */
ok('E1 ★ 攻撃する場合、相手は魔法・罠を発動できず、戦闘で破壊される時は代わりに装備したモンスターを破壊できる',
   r1==='idle' && r2==='idle' && equipped
   && lockedBy('地底のアラクネー')===true
   && zu(mf.uid)==='sz'
   && zu(arac.uid)==='mz' && zu(foe.uid)==='grave' && pu(foe.uid)===1,
   JSON.stringify({r1:r1,r2:r2,equipped:equipped,locked:lockedBy('地底のアラクネー'),mf:zu(mf.uid),arac:zu(arac.uid),foe:zu(foe.uid),titles:TITLES}));
audit('E1');
`, {expect:2});

/* ===== F. negative control: 解決時にアラクネーが場にいない
       （シンクロモンスターなので《強制脱出装置》で戻る先はEXデッキ） ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-CFB024C0A1AF: 解決時にこのカードが表側表示で存在しない場合、選択された相手モンスターは墓地へ送られる */
const arac=mk('地底のアラクネー',0,'up');
gameState.players[0].mz=[arac];
const foe=mk('ワイト',1,'up');
gameState.players[1].mz=[foe];
const esc=mk('強制脱出装置',1,'down');
esc.setTurn=3;
gameState.players[1].sz=[esc];
baselineA();
PREFER=[foe.uid];
duelActivateFromZone(0,'mz',mzIdx(0,arac.uid),{v4EffectKey:'equip-foe'});
PREFER=[arac.uid];
const resp=respondZone(1,esc);                 /* 《強制脱出装置》でアラクネーを手札に戻す */
const r1=drive();
ok('F1 ★ negative control: 解決時にアラクネーが場に表側表示で存在しないので、選択した相手モンスターは装備されず墓地へ送られる',
   resp===true && r1==='idle'
   && zu(arac.uid)==='ex' && zu(foe.uid)==='grave' && pu(foe.uid)===1,
   JSON.stringify({resp:resp,r1:r1,arac:zu(arac.uid),foe:zu(foe.uid),titles:TITLES}));
audit('F1');
`, {expect:2});

/* ===== G. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S541['cards/HZZZZZZZZZZZZY_claude_s03_u541_equip_self.js'];
const engSrc = SRC_S541['engine/1ZV_destroy_substitute_s03.js'];
const docSrc = SRC_S541['docs/S03_U541_REPORT.md'];
const manSrc = SRC_S541['build_manifest.json'];
const IDS_S541 = ['WIKI-4C96ECDF55A6','WIKI-E678659CBF07','WIKI-1577B0FF0555','WIKI-674BE27C5926',
  'WIKI-124DEEBEADD2','WIKI-0E0AAE2B8206','WIKI-524DDFFDE4D5','WIKI-8A1338EE7506','WIKI-7FAD37B22612',
  'WIKI-08C61FF2CB13','WIKI-8F834E1A7A8D','WIKI-9E07F8028E49','WIKI-CFB024C0A1AF','WIKI-4F18E5430766'];
okJs('G1 ★ カードは当時裁定の ID を根拠として持ち、エンジンの追加にも根拠が書かれている',
  IDS_S541.every(id=>cardSrc.indexOf(id) >= 0) && engSrc.indexOf('S03-U541') >= 0);
okJs('G2 ★ 報告書に測った内容と残件が書かれている',
  IDS_S541.every(id=>docSrc.indexOf(id) >= 0) && docSrc.indexOf('未対応') >= 0 && docSrc.indexOf('未確定') >= 0);
okJs('G3 ★ テストとカードファイルが登録されている',
  SRC_S541['tools/check.py'].indexOf('test_s03_u541_equip_self.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZY_claude_s03_u541_equip_self.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZY_claude_s03_u541_equip_self.js') < manSrc.indexOf('cards/40_auto_interpreter.js'));
