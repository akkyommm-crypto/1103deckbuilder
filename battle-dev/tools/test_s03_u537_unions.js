/* S03-U537 ユニオンモンスターの残り 3 枚
   《セコンド・ゴブリン》《守護霊アイリン》《メタル化寄生生物－ルナタイト》。
   S03-U313 の共通処理 declareUnionS03 に乗せる。エンジンへの追加は無い。

   当時裁定（判定と測定の根拠）
     WIKI-47313AD3D4A0（09/12/24）相手の《皆既日蝕の書》を《メタル化寄生生物－ルナタイト》で回避できる。
     WIKI-D657D4542632（09/03/05）ユニオンの効果を発動できない時でも《フォーメーション・ユニオン》で装備できる
       （装備先の規則 UNION_HOST_S03 はユニオン自身の発動可否を見ない）。
     WIKI-8294B5F99F4B（09/01/20）装備した同一ターン中に装備を解除して特殊召喚できる
       （1ターンに1度の記録はユニオン自身の効果だけが使う）。
     《セコンド・ゴブリン》《守護霊アイリン》の表示形式変更には当時裁定・現行Q&Aが無い（報告書 3 節）。

   場面
     A 形
     B 装備と装備解除（1ターンに1度）
     C 装備モンスターの表示形式を変更する（攻撃後の変更不可の永続効果は手動変更だけを止める）
     D 装備モンスターが戦闘によって破壊される場合、代わりにユニオンが破壊される
     E negative control: 効果による破壊では代わりにならない（substitute は戦闘のみ）
     F ルナタイト: 相手の魔法の効果を受けない／F2 negative control: 自分の魔法は受ける
     G 守護霊アイリン: 「不屈闘士レイレイ」に装備して表示形式を変更する
     H 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S537 = pathA.resolve(__dirname, '..');
const rdS537 = p => fsA.readFileSync(pathA.join(ROOT_S537, p), 'utf8');
const SRC_S537 = {
  'cards/HZZZZZZZZZZZZU_claude_s03_u537_unions.js': rdS537('cards/HZZZZZZZZZZZZU_claude_s03_u537_unions.js'),
  'docs/S03_U537_REPORT.md': rdS537('docs/S03_U537_REPORT.md'),
  'tools/check.py': rdS537('tools/check.py'),
  'build_manifest.json': rdS537('build_manifest.json')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cu(uid){const h=findCardByUid(uid);return h?h.card:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], TITLES=[];
function pick(){
  const q=pc(); TITLES.push(String(q.title||''));
  if(q.max>1||q.min!==q.max){
    const n=Math.max(Number(q.min)||0,1);
    answerChoiceV49((q.candidates||[]).slice(0,n).map(x=>x.key));
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);return drive();}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function useKey(p,c,key){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{v4EffectKey:key});return drive();}
function useCard(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function condOf(name,key,p,zone,index){
  const card=zoneCard(gameState.players[p],zone,index);
  const e=nativeEffectsV4(name).find(x=>x.key===key);
  if(!card||!e) return 'MISSING';
  const ctx=makeContext(p,card,zone,index,'legalCheck',{v4EffectKey:key});
  try{ return !!e.condition(ctx); }catch(err){ return 'ERR'; }
}
function equippedTo(eq,host){const e=cu(eq.uid);return !!(e&&e.v46MonsterEquip===true&&e.equipTo&&e.equipTo.uid===host.uid);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
const names=['セコンド・ゴブリン','守護霊アイリン','メタル化寄生生物－ルナタイト'];
const shaped=names.every(n=>{
  const sc=CARD_SCRIPTS[n];
  return !!sc && sc.unionS03===true && sc.equipSubstituteS03==='battle'
    && typeof UNION_HOST_S03[n]==='function'
    && nativeEffectsV4(n).map(e=>e.key).indexOf('union-equip')>=0
    && nativeEffectsV4(n).map(e=>e.key).indexOf('union-release')>=0;
});
const posKeys=['セコンド・ゴブリン','守護霊アイリン'].every(n=>nativeEffectsV4(n).map(e=>e.key).indexOf('host-position')>=0);
const luna=CARD_SCRIPTS['メタル化寄生生物－ルナタイト'];
ok('A1 ★ 3 枚が共通のユニオン処理で登録され、2 枚は表示形式変更の効果、ルナタイトは魔法を受けない継続効果を持つ',
   shaped && posKeys
   && typeof luna.continuous.grantUnaffectedS03==='function'
   && nativeEffectsV4('メタル化寄生生物－ルナタイト').map(e=>e.key).indexOf('host-position')<0,
   JSON.stringify({shaped:shaped,posKeys:posKeys,luna:typeof luna.continuous.grantUnaffectedS03}));
`, {expect:1});

/* ===== B. 装備と装備解除（1ターンに1度） ===== */
harness(COMMON + String.raw`
fresh();
const orc=mk('ジャイアント・オーク',0,'up');
const gob=mk('セコンド・ゴブリン',0,'up');
gameState.players[0].mz=[orc,gob];
baselineA();
const r1=useKey(0,gob,'union-equip');
const onHost=equippedTo(gob,orc);
/* 1ターンに1度：同じターンに装備解除はできない（効果の発動条件そのものを測る。
   duelActivateFromZone に v4EffectKey を渡す経路は呼び出し側が選んだ効果の条件を再判定しない） */
const l2=condOf('セコンド・ゴブリン','union-release',0,'sz',findCardByUid(gob.uid).index);
const r2=turn(), r3=turn();          /* 相手ターンを挟んで自分のターンへ */
const r4=useKey(0,gob,'union-release');
const back=cu(gob.uid);
ok('B1 ★ 自分のメインフェイズに「ジャイアント・オーク」へ装備でき、同じターンには解除できず、次の自分のターンに解除して表側攻撃表示で特殊召喚される',
   r1==='idle' && r4==='idle' && onHost && l2===false
   && zu(gob.uid)==='mz' && back.face==='up' && back.pos==='atk' && back.v46MonsterEquip!==true
   && zu(orc.uid)==='mz',
   JSON.stringify({r1:r1,r2:r2,r3:r3,r4:r4,onHost:onHost,l2:l2,gob:zu(gob.uid),face:back.face,pos:back.pos}));
audit('B1');
`, {expect:2});

/* ===== C. 装備モンスターの表示形式を変更する ===== */
harness(COMMON + String.raw`
fresh();
/* ジャイアント・オークは攻撃後にバトルフェイズ終了時に守備表示になり、次の自分のターン終了時まで
   「表示形式を変更できない」。これは手動変更を止める永続効果で、効果による変更は止めない。 */
const orc=mk('ジャイアント・オーク',0,'up');
const gob=mk('セコンド・ゴブリン',0,'up');
gameState.players[0].mz=[orc,gob];
baselineA();
const r1=useKey(0,gob,'union-equip');
phase('battle');
const r2=attack(0,0,'direct');
phase('main2');                       /* バトルフェイズ終了時に守備表示になる */
const posAfterBattle=cu(orc.uid).pos;
const lockedManual=canManualPositionChange(cu(orc.uid));
const r3=useKey(0,gob,'host-position');
const posAfterEffect=cu(orc.uid).pos;
/* この効果も 1 ターンに 1 度（効果の発動条件そのものを測る） */
const l2=condOf('セコンド・ゴブリン','host-position',0,'sz',findCardByUid(gob.uid).index);
ok('C1 ★ 攻撃後に守備表示になり手動では変更できない装備モンスターを、この効果で攻撃表示に変更でき、1ターンに1度である',
   r1==='idle' && r2==='idle' && r3==='idle'
   && posAfterBattle==='def' && lockedManual===false && posAfterEffect==='atk' && l2===false
   && gameState.players[1].lp===5800,
   JSON.stringify({r1:r1,r2:r2,r3:r3,afterBattle:posAfterBattle,locked:lockedManual,afterEffect:posAfterEffect,l2:l2,lp1:gameState.players[1].lp}));
audit('C1');
`, {expect:2});

/* ===== D. 戦闘破壊の身代わり ===== */
harness(COMMON + String.raw`
fresh();
const orc=mk('ジャイアント・オーク',0,'up');
const gob=mk('セコンド・ゴブリン',0,'up');
gameState.players[0].mz=[orc,gob];
const big=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[big];
baselineA();
const r1=useKey(0,gob,'union-equip');
const r2=turn();                      /* 相手のターン */
phase('battle');
const r3=attack(1,0,0);               /* 2500 で 2200 のオークを攻撃 */
ok('D1 ★ 装備モンスターが戦闘によって破壊される場合、代わりにユニオンが破壊され、装備モンスターは残る',
   r1==='idle' && r3==='idle'
   && zu(gob.uid)==='grave' && zu(orc.uid)==='mz' && cu(orc.uid).face==='up'
   && gameState.players[0].lp===7700,
   JSON.stringify({r1:r1,r2:r2,r3:r3,gob:zu(gob.uid),orc:zu(orc.uid),lp0:gameState.players[0].lp}));
audit('D1');
`, {expect:2});

/* ===== E. negative control: 効果による破壊では身代わりにならない ===== */
harness(COMMON + String.raw`
fresh();
const orc=mk('ジャイアント・オーク',0,'up');
const gob=mk('セコンド・ゴブリン',0,'up');
gameState.players[0].mz=[orc,gob];
const hole=mk('ブラック・ホール',1,'up');
gameState.players[1].hand=[hole];
baselineA();
const r1=useKey(0,gob,'union-equip');
const r2=turn();
const r3=useCard(1,hole);
ok('E1 ★ negative control: 「戦闘によって破壊される場合」の身代わりなので、効果による破壊では装備モンスターが破壊される',
   r1==='idle' && r3==='idle' && zu(orc.uid)==='grave' && zu(gob.uid)==='grave',
   JSON.stringify({r1:r1,r2:r2,r3:r3,orc:zu(orc.uid),gob:zu(gob.uid)}));
audit('E1');
`, {expect:2});

/* ===== F. ルナタイト: 相手の魔法の効果を受けない ===== */
harness(COMMON + String.raw`
fresh();
/* WIKI-47313AD3D4A0（09/12/24）: 相手の《皆既日蝕の書》の効果を回避できる */
const host=mk('ワイト',0,'up');
const other=mk('デーモンの召喚',0,'up');
const luna=mk('メタル化寄生生物－ルナタイト',0,'up');
gameState.players[0].mz=[host,other,luna];
const book=mk('皆既日蝕の書',1,'up');
gameState.players[1].hand=[book];
baselineA();
PREFER=[host.uid];
const r1=useKey(0,luna,'union-equip');
const onHost=equippedTo(luna,host);
const r2=turn();
const r3=useCard(1,book);
ok('F1 ★ 相手の《皆既日蝕の書》では装備モンスターは裏側守備表示にならず、同じ自分の別のモンスターはなる',
   r1==='idle' && r3==='idle' && onHost
   && cu(host.uid).face==='up' && cu(other.uid).face==='down',
   JSON.stringify({r1:r1,r2:r2,r3:r3,onHost:onHost,host:cu(host.uid).face,other:cu(other.uid).face,titles:TITLES.slice(0,4)}));
audit('F1');
`, {expect:2});

/* ===== F2. negative control: 自分の魔法の効果は受ける ===== */
harness(COMMON + String.raw`
fresh();
const host=mk('ワイト',0,'up');
const luna=mk('メタル化寄生生物－ルナタイト',0,'up');
gameState.players[0].mz=[host,luna];
const book=mk('皆既日蝕の書',0,'up');
gameState.players[0].hand=[book];
baselineA();
const r1=useKey(0,luna,'union-equip');
const onHost=equippedTo(luna,host);
const r2=useCard(0,book);
ok('F2 ★ negative control: 受けないのは相手がコントロールする魔法だけなので、自分の《皆既日蝕の書》では裏側守備表示になる',
   r1==='idle' && r2==='idle' && onHost && cu(host.uid).face==='down',
   JSON.stringify({r1:r1,r2:r2,onHost:onHost,host:cu(host.uid).face}));
audit('F2');
`, {expect:2});

/* ===== G. 守護霊アイリン ===== */
harness(COMMON + String.raw`
fresh();
const rei=mk('不屈闘士レイレイ',0,'up');
const irin=mk('守護霊アイリン',0,'up');
gameState.players[0].mz=[rei,irin];
baselineA();
const r1=useKey(0,irin,'union-equip');
const onHost=equippedTo(irin,rei);
const r2=useKey(0,irin,'host-position');
const posAfter=cu(rei.uid).pos;
/* 装備先の規則: 「不屈闘士レイレイ」以外には装備できない */
const wight=mk('ワイト',0,'up');
const canOther=unionCanEquipS03(cu(irin.uid), {p:0,zone:'mz',index:0,card:wight});
ok('G1 ★ 「不屈闘士レイレイ」に装備して表示形式を変更でき、装備先の規則は他のモンスターを許さない',
   r1==='idle' && r2==='idle' && onHost && posAfter==='def' && canOther===false,
   JSON.stringify({r1:r1,r2:r2,onHost:onHost,pos:posAfter,canOther:canOther}));
audit('G1');
`, {expect:2});

/* ===== H. 文書・登録 ===== */
const okJs = (label, cond, extra)=>{
  if(cond) console.log('PASS ' + label + (extra ? ' :: ' + extra : ''));
  else { console.log('FAIL ' + label + (extra ? ' :: ' + extra : '')); process.exitCode = 1; }
};
const cardSrc = SRC_S537['cards/HZZZZZZZZZZZZU_claude_s03_u537_unions.js'];
const docSrc = SRC_S537['docs/S03_U537_REPORT.md'];
const manSrc = SRC_S537['build_manifest.json'];
const IDS_S537 = ['WIKI-47313AD3D4A0','WIKI-D657D4542632','WIKI-5D98E3D9481F','WIKI-8294B5F99F4B'];
okJs('H1 ★ カードは当時裁定の ID を根拠として持つ', IDS_S537.every(id=>cardSrc.indexOf(id) >= 0));
okJs('H2 ★ 報告書に測った内容と残件が書かれている',
  IDS_S537.every(id=>docSrc.indexOf(id) >= 0) && docSrc.indexOf('未対応') >= 0 && docSrc.indexOf('未確定') >= 0);
okJs('H3 ★ テストとカードファイルが登録されている',
  SRC_S537['tools/check.py'].indexOf('test_s03_u537_unions.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZU_claude_s03_u537_unions.js') >= 0
  && manSrc.indexOf('HZZZZZZZZZZZZU_claude_s03_u537_unions.js') < manSrc.indexOf('cards/40_auto_interpreter.js'));
