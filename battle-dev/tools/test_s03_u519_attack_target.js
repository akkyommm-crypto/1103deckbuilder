/* S03-U519: パワー・フレーム, フォーメーション・ユニオン（カード実装）。

   《パワー・フレーム》（NOT_STARTED・罠）
     自分の表側モンスターが、その攻撃力より高い攻撃力のモンスターの攻撃対象に選択された時に発動でき、
     その攻撃を無効にし、このカードを攻撃対象モンスターに装備する。装備モンスターの攻撃力は、
     その時の攻撃モンスターと攻撃対象モンスターの攻撃力の差の数値分アップする。
   《フォーメーション・ユニオン》（NOT_STARTED・罠）
     次の効果から1つを選択して発動する。●場の自分のユニオンモンスター1体を装備可能なモンスターに装備する。
     ●装備カード扱いの自分のユニオンモンスター1体の装備を解除して表側攻撃表示で特殊召喚する。

   当時裁定（回答日つき）
     WIKI-518D4C8C4B50（2010-02-21）対象に取るのは攻撃対象モンスターだけ（攻撃モンスターは取らない）。
     WIKI-3AA3F72AEC8B（2010-02-21）上げる数値は**解決時**の両者の攻撃力の差（例: 1600+600=2200）。
     WIKI-2916A8C2E7B4（2010-03-24）発動にチェーンして破壊されても攻撃は無効になる。
     WIKI-B49FAB74603A（2009-03-05）スキルドレインでユニオンの効果が無効でも装備させられる。
     WIKI-D657D4542632（2009-03-05）ユニオンの効果を発動できない状態でも装備させられる。
     WIKI-8294B5F99F4B（2009-01-20）装備した同じターンに解除して特殊召喚でき、再度装備もできる。

   固定するもの:
     A 形（登録・宣言・ユニオンの装備可否の引き方）
     B パワー・フレーム（無効と装備・解除時の差で計算・チェーンで破壊されても無効・negative control）
     C フォーメーション・ユニオン（装備・解除して特殊召喚・スキルドレイン下でも装備・negative control）
     D Replay 監査・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S519 = pathA.resolve(__dirname, '..');
const rdS519 = p => fsA.readFileSync(pathA.join(ROOT_S519, p), 'utf8');
const SRC_S519 = {
  'cards/HZZZZZZZZZZZZC_claude_s03_u519_attack_target.js': rdS519('cards/HZZZZZZZZZZZZC_claude_s03_u519_attack_target.js'),
  'cards/HZZZZZZ_claude_s03_u313_union.js': rdS519('cards/HZZZZZZ_claude_s03_u313_union.js'),
  'docs/S03_U519_REPORT.md': rdS519('docs/S03_U519_REPORT.md'),
  'tools/check.py': rdS519('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function nmOf(c){return c?cardName(c):null;}
let PREFER=[], OFFERS=[], RESPOND_WITH=[];
function pick(){const q=pc();let j=-1;for(const u of PREFER){j=(q.candidates||[]).findIndex(x=>x&&x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);}
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];OFFERS=[];RESPOND_WITH=[];
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
      OFFERS.push({pr:pr,len:gameState.chain.length,names:resp.map(r=>cardName(r.card))});
      const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
      if(want){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(want.card)),1);
        duelActivateResponseV2(pr,want.zone,want.index,want.ownerS03); continue;}
      chainPassV2(); continue;}
    const w=gameState.processorWaiting;
    if(w&&w.type==='POINT'&&gameState.processorPaused){
      /* 攻撃宣言時の応答はチェーンがまだ無い POINT の窓で行う（pointActivateV27） */
      const pr=(w.payload&&w.payload.priority!=null)?w.payload.priority:gameState.activePlayer;
      let resp=[]; try{ resp=getChainResponsesV2(pr)||[]; }catch(e){ resp=[]; }
      OFFERS.push({pr:pr,len:0,names:resp.map(r=>cardName(r.card))});
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
/* ドローからバトルへは直接移れないので、ドロー→スタンバイ→メイン1→バトルと順に進める */
function toBattle(){phase('standby');phase('main1');return phase('battle');}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(nmOf);}
function szNames(p){return (gameState.players[p].sz||[]).map(nmOf);}
function equipHostUid(card){return card && card.equipTo ? card.equipTo.uid : null;}
function useField(p,c){const h=findCardByUid(c.uid);TOASTS.length=0;duelActivateFromZone(p,h.zone,h.index,{});return drive();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 2 枚が登録され、分類どおりの宣言になっている'
   +'（フレームは攻撃宣言時に発動し対象を取る罠 / ユニオンは発動時に効果を選択する罠）',
   !!CARD_SCRIPTS['パワー・フレーム'] && CARD_SCRIPTS['パワー・フレーム'].targets===true
   && !!CARD_SCRIPTS['フォーメーション・ユニオン']
   && typeof CARD_SCRIPTS['フォーメーション・ユニオン'].activationV11==='function',
   JSON.stringify({t:CARD_SCRIPTS['パワー・フレーム'].targets}));
/* ユニオンの host 規則は各カードの宣言をそのまま引く（S03-U519 の UNION_HOST_S03） */
fresh();
const shot=mk('バスター・ショットマン',0,'up');
const dendle=mk('デス・デンドル',0,'up');
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[shot,dendle,w];
baselineA();
const hw=findCardByUid(w.uid);
ok('A2 ★ 装備可否は各ユニオンが宣言した host 規則で決まる'
   +'（バスター・ショットマンはどのモンスターにも / デス・デンドルはブラッド・オーキスだけ）',
   Object.keys(UNION_HOST_S03).length>=10
   && unionCanEquipS03(shot,hw)===true
   && unionCanEquipS03(dendle,hw)===false,
   JSON.stringify({n:Object.keys(UNION_HOST_S03).length,
     shot:unionCanEquipS03(shot,hw),dendle:unionCanEquipS03(dendle,hw)}));
`, {expect:2});

/* ===== B. パワー・フレーム ===== */
harness(COMMON + String.raw`
fresh();
/* 相手の攻撃力 2500 が自分の攻撃力 300 を攻撃 → 無効にして装備し、差 2200 だけ上がる。 */
const frame=setc('パワー・フレーム',0);
gameState.players[0].sz=[frame];
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
baselineA();
phase('end');turn();
const t1=toBattle();
RESPOND_WITH=['パワー・フレーム'];
const t2=attack(1,0,0);
const nowW=findCardByUid(w.uid), nowF=findCardByUid(frame.uid);
ok('B1 ★ 攻撃を無効にし、このカードを攻撃対象モンスターに装備して差（2500-300=2200）だけ上げる',
   t1==='idle' && t2==='idle'
   && nowF.zone==='sz' && equipHostUid(nowF.card)===w.uid
   && curATK(nowW.card)===2500 && zu(w.uid)==='mz'
   && gameState.players[0].lp===8000,
   JSON.stringify({frame:nowF.zone,host:equipHostUid(nowF.card),atk:curATK(nowW.card),
     lp:gameState.players[0].lp,offers:OFFERS.map(o=>o.names.join('/')).join('|')}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-3AA3F72AEC8B（10/02/21）: 上げる数値は解決時の差。
   セットした《突進》をチェーンして攻撃対象の攻撃力を 300 → 1000 にすると、差は 1500 になり 1000+1500=2500。 */
const frame=setc('パワー・フレーム',0);
const dash=setc('突進',0);
gameState.players[0].sz=[frame,dash];
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
baselineA();
phase('end');turn();
toBattle();
PREFER=[w.uid];
RESPOND_WITH=['パワー・フレーム','突進'];
const tr=attack(1,0,0);
const nowW=findCardByUid(w.uid), nowF=findCardByUid(frame.uid);
ok('B2 ★ WIKI-3AA3F72AEC8B（10/02/21）: 解決時の差で計算する'
   +'（突進で 1000 になった後に差 1500 が乗り 2500 になる）',
   tr==='idle' && nowF.zone==='sz' && equipHostUid(nowF.card)===w.uid
   && Number(nowF.card.u519FrameAtkS03)===1500 && curATK(nowW.card)===2500,
   JSON.stringify({diff:nowF.card.u519FrameAtkS03,atk:curATK(nowW.card),
     offers:OFFERS.map(o=>o.len+':'+o.names.join('/')).join('|')}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-2916A8C2E7B4（10/03/24）: 発動にチェーンして破壊されても攻撃は無効になる（装備はされない）。 */
const frame=setc('パワー・フレーム',0);
gameState.players[0].sz=[frame];
const w=mk('ワイト',0,'up');
gameState.players[0].mz=[w];
const foe=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe];
const cyc=setc('サイクロン',1);
gameState.players[1].sz=[cyc];
baselineA();
phase('end');turn();
toBattle();
PREFER=[frame.uid];
RESPOND_WITH=['パワー・フレーム','サイクロン'];
const tr=attack(1,0,0);
ok('B3 ★ WIKI-2916A8C2E7B4（10/03/24）: チェーンされた《サイクロン》で破壊されても攻撃は無効になり、'
   +'自分は戦闘ダメージを受けない（装備はされない）',
   tr==='idle' && zu(frame.uid)==='grave' && zu(w.uid)==='mz'
   && gameState.players[0].lp===8000 && curATK(findCardByUid(w.uid).card)===300,
   JSON.stringify({frame:zu(frame.uid),w:zu(w.uid),lp:gameState.players[0].lp,
     offers:OFFERS.map(o=>o.len+':'+o.names.join('/')).join('|')}));
audit('B3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 攻撃モンスターの攻撃力が高くない時は応答に出てこない。 */
const frame=setc('パワー・フレーム',0);
gameState.players[0].sz=[frame];
const big=mk('デーモンの召喚',0,'up');
gameState.players[0].mz=[big];
const foe=mk('ワイト',1,'up');
gameState.players[1].mz=[foe];
baselineA();
phase('end');turn();
toBattle();
const tr=attack(1,0,0);
const offered=OFFERS.some(o=>o.names.indexOf('パワー・フレーム')>=0);
ok('B4 ★ negative control: 攻撃モンスターの攻撃力が攻撃対象より高くない時は発動の候補に出ない',
   tr==='idle' && offered===false && zu(frame.uid)==='sz',
   JSON.stringify({offers:OFFERS.map(o=>o.len+':'+o.names.join('/')).join('|'),frame:zu(frame.uid)}));
`, {expect:1});

/* ===== C. フォーメーション・ユニオン ===== */
harness(COMMON + String.raw`
fresh();
/* ●装備する: 灼岩魔獣（ユニオン）を氷岩魔獣に装備する。 */
const fu=setc('フォーメーション・ユニオン',0);
gameState.players[0].sz=[fu];
const union=mk('灼岩魔獣',0,'up');
const host=mk('氷岩魔獣',0,'up');
gameState.players[0].mz=[union,host];
baselineA();
const tr=useField(0,fu);
const nowU=findCardByUid(union.uid);
ok('C1 ★ ●の片方を選んで発動し、場のユニオンモンスターを装備可能なモンスターに装備する',
   tr==='idle' && nowU.zone==='sz' && nowU.card.v46MonsterEquip===true
   && equipHostUid(nowU.card)===host.uid && zu(host.uid)==='mz',
   JSON.stringify({union:nowU.zone,equip:nowU.card.v46MonsterEquip,host:equipHostUid(nowU.card),
     mz:mzNames(0),sz:szNames(0),toasts:TOASTS.slice(0,2)}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* ●解除する: 装備カード扱いのユニオンを解除して表側攻撃表示で特殊召喚する（WIKI-8294B5F99F4B 09/01/20）。 */
const fu=setc('フォーメーション・ユニオン',0);
const fu2=setc('フォーメーション・ユニオン',0);
gameState.players[0].sz=[fu,fu2];
const union=mk('灼岩魔獣',0,'up');
const host=mk('氷岩魔獣',0,'up');
gameState.players[0].mz=[union,host];
baselineA();
const t1=useField(0,fu);
const equipped=findCardByUid(union.uid).zone==='sz';
const t2=useField(0,fu2);
const nowU=findCardByUid(union.uid);
ok('C2 ★ WIKI-8294B5F99F4B（09/01/20）: 同じターンに装備し、装備を解除して表側攻撃表示で特殊召喚できる',
   t1==='idle' && t2==='idle' && equipped===true
   && nowU.zone==='mz' && nowU.card.face==='up' && nowU.card.pos==='atk'
   && nowU.card.v46MonsterEquip!==true,
   JSON.stringify({equipped:equipped,zone:nowU.zone,pos:nowU.card.pos,mz:mzNames(0),sz:szNames(0)}));
audit('C2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-B49FAB74603A（09/03/05）: スキルドレインでユニオンの効果が無効でも、この罠で装備させられる。 */
const fu=setc('フォーメーション・ユニオン',0);
gameState.players[0].sz=[fu];
const union=mk('灼岩魔獣',0,'up');
const host=mk('氷岩魔獣',0,'up');
gameState.players[0].mz=[union,host];
gameState.players[0].hand=[mk('スキルドレイン',0)];
gameState.players[0].lp=8000;
baselineA();
duelActivateFromHand(0);
const tSD=drive();
const drained=effectNegated(findCardByUid(union.uid).card)===true;
const tr=useField(0,fu);
const nowU=findCardByUid(union.uid);
ok('C3 ★ WIKI-B49FAB74603A（09/03/05）: ユニオンの効果が無効（スキルドレイン）でも装備させられる',
   tSD==='idle' && tr==='idle' && drained===true
   && nowU.zone==='sz' && nowU.card.v46MonsterEquip===true && equipHostUid(nowU.card)===host.uid,
   JSON.stringify({drained:drained,union:nowU.zone,host:equipHostUid(nowU.card),toasts:TOASTS.slice(0,2)}));
audit('C3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 場にユニオンモンスターが無く、装備カード扱いのユニオンも無い時は発動できない。 */
const fu=setc('フォーメーション・ユニオン',0);
gameState.players[0].sz=[fu];
gameState.players[0].mz=[mk('ワイト',0,'up')];
baselineA();
const tr=useField(0,fu);
ok('C4 ★ negative control: 装備できるユニオンも装備カード扱いのユニオンもいない時は発動できない',
   tr==='idle' && zu(fu.uid)==='sz' && findCardByUid(fu.uid).card.face==='down',
   JSON.stringify({fu:zu(fu.uid),face:findCardByUid(fu.uid).card.face,toasts:TOASTS.slice(0,2)}));
`, {expect:1});

/* ===== D. 文書・登録 ===== */
const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S519['cards/HZZZZZZZZZZZZC_claude_s03_u519_attack_target.js'];
const unionSrc = SRC_S519['cards/HZZZZZZ_claude_s03_u313_union.js'];
const doc = SRC_S519['docs/S03_U519_REPORT.md'];
okJs('D1 ★ カードは当時裁定の ID を根拠として持つ',
  ['WIKI-518D4C8C4B50', 'WIKI-3AA3F72AEC8B', 'WIKI-2916A8C2E7B4', 'WIKI-B49FAB74603A',
   'WIKI-D657D4542632', 'WIKI-8294B5F99F4B'].every(id => cardSrc.indexOf(id) >= 0));
okJs('D2 ★ ユニオンの host 規則は u313 の宣言をそのまま引く形で公開されている',
  unionSrc.indexOf('S03-U519') >= 0 && unionSrc.indexOf('const UNION_HOST_S03') >= 0
  && unionSrc.indexOf('function unionCanEquipS03') >= 0);
okJs('D3 ★ 報告書に未確定（「選択」が対象を取るか）が書かれている',
  doc.indexOf('RULING_UNRESOLVED') >= 0 && doc.indexOf('選択') >= 0);
okJs('D4 ★ このテストが tools/check.py に登録されている',
  SRC_S519['tools/check.py'].indexOf('test_s03_u519_attack_target.js') >= 0);
