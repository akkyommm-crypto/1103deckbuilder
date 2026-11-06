/* S03-U517: 召喚の回数を数えるカード 3 枚（カード実装）。

   《カイザーコロシアム》（NOT_STARTED・永続魔法）
     ①:自分フィールドにモンスターが存在する限り、相手はその数より多くなるように
     自身のフィールドにモンスターを出す事ができない。
   《サモンリミッター》（NOT_STARTED・永続罠）
     このカードがフィールド上に存在する限り、お互いのプレイヤーは1ターンに合計2回までしか
     モンスターを召喚・反転召喚・特殊召喚できない。
   《サモンチェーン》（NOT_STARTED・速攻魔法）
     ①:同一チェーン上で複数回同名カードの効果が発動していない場合、そのチェーン3以降に発動できる。
     このターン自分は通常召喚を3回まで行う事ができる。

   当時裁定（回答日つき。これがこの実装の根拠）
     WIKI-69B7A89DCDA8 効果適用前のモンスターは影響を受けない。相手の数が減れば自分の数までは召喚できる
       → 判定は召喚しようとした時点の盤面を数える。
     WIKI-902B1F48CA44（09/08/16）自分のモンスターをリリースして特殊召喚するのは可能
       → リリースは召喚の前なので、召喚時点で自分の数が 0 になり制限が外れる。
     WIKI-E315E720E7DE（09/05/01）数を超えないアドバンス召喚は可能。
     WIKI-05D8FDD9315F（07/03/04）/ WIKI-3E01B205FCEA（09/05/28）特殊召喚を目的とする効果は発動自体ができない。
     WIKI-FA2EC0926915（08/03/06）サモンリミッターは発動前の召喚行為も数える。
     WIKI-4FD72A35ED9E（08/08/20）無効になった召喚は数えない。
     WIKI-7E37568B7AAA（08/07/22）お互いが特殊召喚するカードは、それぞれ 1 回ずつ。
     WIKI-1305B3CE1B4E（09/08/30）強制の特殊召喚効果は「発動しますが、不発になります」。
     WIKI-D8FEA13745E1 / WIKI-942ECAD162E6（11/05/30）サイコ・ショッカーと共にある間は適用されない。
     WIKI-3990B9280CC0（11/06/11）同時特殊召喚を 1 回と数えるかは「調整中」。
     WIKI-BD81BAFC2896（11/04/17）サモンチェーンと二重召喚の両方でも通常召喚は最大 3 回。

   固定するもの:
     A 形（登録・宣言・通常召喚の上限の読み方・数える対象）
     B カイザーコロシアム（盤面の数で止める・自分は止めない・発動も止まる・negative control 2 件）
     C サモンリミッター（数える・3 回目を止める・反転召喚も数える・プレイヤーごと・発動前の分・ショッカー）
     D サモンチェーン（チェーン3以降・同名・3 回まで・二重召喚と併せても 3 回）
     E ターンで消える・文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S517 = pathA.resolve(__dirname, '..');
const rdS517 = p => fsA.readFileSync(pathA.join(ROOT_S517, p), 'utf8');
const SRC_S517 = {
  'cards/HZZZZZZZZZZZZA_claude_s03_u517_summon_counts.js': rdS517('cards/HZZZZZZZZZZZZA_claude_s03_u517_summon_counts.js'),
  'engine/1ZZS_summon_lock_s03.js': rdS517('engine/1ZZS_summon_lock_s03.js'),
  'engine/00_state_actions.js': rdS517('engine/00_state_actions.js'),
  'docs/S03_U517_REPORT.md': rdS517('docs/S03_U517_REPORT.md'),
  'tools/check.py': rdS517('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function dbn(n){for(const k in CARD_DB){if(CARD_DB[k]&&CARD_DB[k].n===n)return CARD_DB[k];}return {};}
let OFFERS=[], RESPOND_WITH=[];
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;OFFERS=[];RESPOND_WITH=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
function drive(){
  for(let i=0;i<900;i++){
    if(pc()){__choicePickV49(0);continue;}
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
    if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){
      const pr=gameState.chainWindow.priority;
      let resp=[]; try{ resp=getChainResponsesV2(pr)||[]; }catch(e){ resp=[]; }
      OFFERS.push({pr:pr,len:gameState.chain.length,names:resp.map(r=>cardName(r.card))});
      const want=resp.find(r=>RESPOND_WITH.indexOf(cardName(r.card))>=0);
      if(want){ RESPOND_WITH.splice(RESPOND_WITH.indexOf(cardName(want.card)),1);
        duelActivateResponseV2(pr,want.zone,want.index,want.ownerS03); continue; }
      chainPassV2(); continue;}
    const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
    return 'idle';}
  return 'loop';}
function hi(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function acts(p){return summonActsThisTurnS03(p);}
function summonMon(p,name){const i=hi(p,name);TOASTS.length=0;doNormalSummon(i,'atk');return drive();}
function mzNames(p){return (gameState.players[p].mz||[]).map(c=>c?cardName(c):'-');}
/* engine 自身の合法手リスト（UI が読むもの）。doNormalSummon は召喚権を見ないので、
   「召喚権がもう無い」の確認はこのリストで行う。 */
function canNS(p,name){const i=hi(p,name);if(i<0)return false;
  return (getLegalHandActions(p,i)||[]).some(a=>a&&a.id==='normalSummon');}
function handNames(p){return (gameState.players[p].hand||[]).map(c=>c?cardName(c):'-');}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness(COMMON + String.raw`
fresh();
ok('A1 ★ 3 枚が登録され、2 枚の制限カードは「召喚の可否」と「特殊召喚を目的とする効果の発動の可否」の'
   +'両方を宣言している（サモンチェーンは速攻魔法）',
   !!CARD_SCRIPTS['カイザーコロシアム'] && !!CARD_SCRIPTS['サモンリミッター'] && !!CARD_SCRIPTS['サモンチェーン']
   && typeof CARD_SCRIPTS['カイザーコロシアム'].summonLockS03==='function'
   && typeof CARD_SCRIPTS['カイザーコロシアム'].globalSummonLockS03==='function'
   && typeof CARD_SCRIPTS['サモンリミッター'].summonLockS03==='function'
   && typeof CARD_SCRIPTS['サモンリミッター'].globalSummonLockS03==='function'
   && CARD_SCRIPTS['サモンチェーン'].type==='quick-play',
   JSON.stringify({chain:CARD_SCRIPTS['サモンチェーン'].type}));
ok('A2 ★ 永続カード 2 枚は「カードの発動」だけで、発動時の効果を持たない（S03-U10 の分類と同じ扱い）',
   CARD_ACTIVATION_FREE_V32.has('カイザーコロシアム') && CARD_ACTIVATION_FREE_V32.has('サモンリミッター'),
   JSON.stringify({c:CARD_ACTIVATION_FREE_V32.has('カイザーコロシアム'),l:CARD_ACTIVATION_FREE_V32.has('サモンリミッター')}));
/* WIKI-BD81BAFC2896（11/04/17）: 複数枚でも増えない = 上限は最大値 */
ok('A3 ★ 通常召喚の上限は「与えられた回数の最大値」: 無し 1 / 二重召喚 2（使用済でも 2）/ サモンチェーン 3 / 両方 3',
   normalGrantMaxS03({temporaryFlags:{}})===1
   && normalGrantMaxS03({temporaryFlags:{doubleSummonS03:1}})===2
   && normalGrantMaxS03({temporaryFlags:{doubleSummonS03:2}})===2
   && normalGrantMaxS03({temporaryFlags:{normalGrantS03:3}})===3
   && normalGrantMaxS03({temporaryFlags:{doubleSummonS03:2,normalGrantS03:3}})===3,
   JSON.stringify([normalGrantMaxS03({temporaryFlags:{}}),
     normalGrantMaxS03({temporaryFlags:{doubleSummonS03:1}}),
     normalGrantMaxS03({temporaryFlags:{normalGrantS03:3}}),
     normalGrantMaxS03({temporaryFlags:{doubleSummonS03:2,normalGrantS03:3}})]));
/* 数えるのは召喚成功のイベントだけ（ドローのイベントでは増えない） */
ok('A4 ★ 召喚行為の数は召喚成功イベントだけで増え、プレイヤーごとに別々に数える',
   acts(0)===0
   && (noteSummonActS03(gameState,{eventName:'onDraw',evt:{player:0}}), acts(0)===0)
   && (noteSummonActS03(gameState,{eventName:'onNormalSummon',evt:{player:0}}), acts(0)===1)
   && (noteSummonActS03(gameState,{eventName:'onSpecialSummon',evt:{player:0}}), acts(0)===2)
   && acts(1)===0,
   JSON.stringify({p0:acts(0),p1:acts(1)}));
`, {expect:4});

/* ===== B. カイザーコロシアム ===== */
harness(COMMON + String.raw`
fresh();
/* 相手（p1）がカイザーコロシアムを出しており、お互い 1 体ずつ。p0 は召喚できない。 */
gameState.players[1].sz=[mk('カイザーコロシアム',1,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[0].mz=[mk('ワイト',0,'up')];
gameState.players[0].hand=[mk('デーモンの召喚',0)];
baselineA();
const tr=summonMon(0,'デーモンの召喚');
ok('B1 ★ お互い 1 体ずつの時、相手のカイザーコロシアムは自分の通常召喚を止める（WIKI-69B7A89DCDA8）',
   tr==='idle' && mzNames(0).join(',')==='ワイト'
   && TOASTS.some(t=>t.indexOf('カイザーコロシアム')>=0),
   JSON.stringify({mz:mzNames(0),toasts:TOASTS.slice(0,2)}));
ok('B2 ★ 止めるのは相手だけで、コロシアムを出している側は止まらない',
   v46FaceUpSummonRestrictionReason(1,dbn('デーモンの召喚'),'normal')===''
   && v46FaceUpSummonRestrictionReason(0,dbn('デーモンの召喚'),'normal')!=='',
   JSON.stringify({self:v46FaceUpSummonRestrictionReason(1,dbn('デーモンの召喚'),'normal'),
     foe:v46FaceUpSummonRestrictionReason(0,dbn('デーモンの召喚'),'normal')}));
ok('B2b ★ engine の合法手リストにも通常召喚が出てこない（止まっているのは操作の段階から）',
   canNS(0,'デーモンの召喚')===false,JSON.stringify(getLegalHandActions(0,hi(0,'デーモンの召喚')).map(a=>a.id)));
`, {expect:3});

harness(COMMON + String.raw`
fresh();
/* negative control 1: コロシアム側のモンスターが 0 体なら制限は無い（「自分フィールドにモンスターが存在する限り」）。
   WIKI-902B1F48CA44（09/08/16）が「できます」と答える形でもある。 */
gameState.players[1].sz=[mk('カイザーコロシアム',1,'up')];
gameState.players[1].mz=[];
gameState.players[0].mz=[mk('ワイト',0,'up'),mk('ワイト',0,'up')];
gameState.players[0].hand=[mk('クリボー',0)];
baselineA();
const tr=summonMon(0,'クリボー');
ok('B3 ★ negative control: コロシアム側のモンスターが 0 体なら、相手は 2 体から 3 体に増やせる',
   tr==='idle' && mzNames(0).indexOf('クリボー')>=0 && (gameState.players[0].mz||[]).length===3,
   JSON.stringify({mz:mzNames(0),toasts:TOASTS.slice(0,2)}));
audit('B3');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control 2: コロシアム側が 2 体で自分が 1 体なら、1 体増えても超えないので召喚できる
   （WIKI-E315E720E7DE 09/05/01 と同じ数え方）。並んだ後は次が止まる。 */
gameState.players[1].sz=[mk('カイザーコロシアム',1,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up'),mk('ワイト',1,'up')];
gameState.players[0].mz=[mk('ワイト',0,'up')];
gameState.players[0].hand=[mk('クリボー',0),mk('クリボー',0)];
baselineA();
const tr=summonMon(0,'クリボー');
ok('B4 ★ 相手の数（2）を超えない 1 体目は召喚でき、2 体に並んだ後は次の召喚が止まる',
   tr==='idle' && mzNames(0).length===2 && mzNames(0).indexOf('クリボー')>=0
   && v46FaceUpSummonRestrictionReason(0,dbn('クリボー'),'normal')!=='' && canNS(0,'クリボー')===false,
   JSON.stringify({mz:mzNames(0),after:v46FaceUpSummonRestrictionReason(0,dbn('クリボー'),'normal')}));
audit('B4');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-05D8FDD9315F（07/03/04）/ WIKI-3E01B205FCEA（09/05/28）: 特殊召喚そのものを目的とする効果は発動自体ができない。 */
gameState.players[1].sz=[mk('カイザーコロシアム',1,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up')];
gameState.players[0].mz=[mk('ワイト',0,'up')];
gameState.players[0].ex=[mk('サウザンド・アイズ・サクリファイス',0)];
gameState.players[0].hand=[mk('簡易融合',0)];
baselineA();
TOASTS.length=0;
duelActivateFromHand(hi(0,'簡易融合'));
const tr=drive();
ok('B5 ★ 特殊召喚を目的とする効果（簡易融合）は、数が並んでいる間は発動自体ができない'
   +'（WIKI-05D8FDD9315F 07/03/04）',
   tr==='idle' && handNames(0).indexOf('簡易融合')>=0
   && TOASTS.some(t=>t.indexOf('特殊召喚できません')>=0),
   JSON.stringify({hand:handNames(0),toasts:TOASTS.slice(0,2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* negative control: コロシアム側が 2 体なら同じ簡易融合は発動でき、融合モンスターが出る。 */
gameState.players[1].sz=[mk('カイザーコロシアム',1,'up')];
gameState.players[1].mz=[mk('ワイト',1,'up'),mk('ワイト',1,'up')];
gameState.players[0].mz=[mk('ワイト',0,'up')];
const fus=mk('サウザンド・アイズ・サクリファイス',0);
gameState.players[0].ex=[fus];
gameState.players[0].hand=[mk('簡易融合',0)];
baselineA();
TOASTS.length=0;
duelActivateFromHand(hi(0,'簡易融合'));
const tr=drive();
ok('B6 ★ negative control: 数を超えない時は同じ効果が発動でき、融合モンスターが出る',
   tr==='idle' && zu(fus.uid)==='mz',
   JSON.stringify({fus:zu(fus.uid),toasts:TOASTS.slice(0,2)}));
audit('B6');
`, {expect:2});

/* ===== C. サモンリミッター ===== */
harness(COMMON + String.raw`
fresh();
/* 相手（p1）がサモンリミッターを出している。自分の 3 回目の召喚行為が止まる。
   通常召喚権ではなく「召喚行為の回数」を測るため、通常召喚の上限だけ 3 にしてある。 */
gameState.players[1].sz=[mk('サモンリミッター',1,'up')];
gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
gameState.players[0].temporaryFlags.normalGrantS03=3;
baselineA();
const t1=summonMon(0,'ワイト'), a1=acts(0);
const t2=summonMon(0,'ワイト'), a2=acts(0);
const t3=summonMon(0,'ワイト'), a3=acts(0);
ok('C1 ★ 召喚行為は 1 回ずつ数えられ、2 回で止まる（3 回目の通常召喚は行われない）',
   t1==='idle' && t2==='idle' && t3==='idle' && a1===1 && a2===2 && a3===2
   && (gameState.players[0].mz||[]).length===2,
   JSON.stringify({a:[a1,a2,a3],mz:mzNames(0),toasts:TOASTS.slice(0,2)}));
ok('C2 ★ 止めた理由はサモンリミッターの効果として示される',
   TOASTS.some(t=>t.indexOf('サモンリミッター')>=0),JSON.stringify(TOASTS.slice(0,3)));
ok('C3 ★ 数はプレイヤーごと（相手の召喚行為は 0 のままで、相手は止まらない）',
   acts(1)===0 && v46FaceUpSummonRestrictionReason(1,dbn('ワイト'),'normal')==='',
   JSON.stringify({p1:acts(1)}));
audit('C1');
`, {expect:4});

harness(COMMON + String.raw`
fresh();
/* 反転召喚も「召喚行為」。1 回通常召喚 + 1 回反転召喚で 2 回に達する。 */
gameState.players[1].sz=[mk('サモンリミッター',1,'up')];
const fd=mk('ワイト',0,'down');fd.pos='def';
gameState.players[0].mz=[fd];
gameState.players[0].hand=[mk('ワイト',0),mk('デーモンの召喚',0)];
gameState.players[0].temporaryFlags.normalGrantS03=3;
baselineA();
const t1=summonMon(0,'ワイト'), a1=acts(0);
doFlipUp(0,'mz',findCardByUid(fd.uid).index,'atk');
const t2=drive(), a2=acts(0);
TOASTS.length=0;
const t3=summonMon(0,'デーモンの召喚'), a3=acts(0);
ok('C4 ★ 反転召喚も数えるので、通常召喚 1 回 + 反転召喚 1 回で 2 回に達し、次の召喚は止まる',
   t1==='idle' && t2==='idle' && t3==='idle' && a1===1 && a2===2 && a3===2
   && findCardByUid(fd.uid).card.face==='up'
   && mzNames(0).indexOf('デーモンの召喚')<0,
   JSON.stringify({a:[a1,a2,a3],mz:mzNames(0),toasts:TOASTS.slice(0,2)}));
audit('C4');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-FA2EC0926915（08/03/06）: 発動前に行った召喚行為も数える。
   伏せたサモンリミッターを 2 回召喚した後に発動すると、3 回目は止まる。 */
const lim=mk('サモンリミッター',1,'down');
gameState.players[1].sz=[lim];
gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
gameState.players[0].temporaryFlags.normalGrantS03=3;
baselineA();
const t1=summonMon(0,'ワイト'), t2=summonMon(0,'ワイト');
const before=acts(0);
duelActivateFromZone(1,'sz',0,{});
const tA=drive();
TOASTS.length=0;
const t3=summonMon(0,'ワイト');
ok('C5 ★ WIKI-FA2EC0926915（08/03/06）: 発動前の 2 回も数えているので、発動直後の 3 回目が止まる',
   t1==='idle' && t2==='idle' && tA==='idle' && t3==='idle' && before===2
   && findCardByUid(lim.uid).card.face==='up'
   && (gameState.players[0].mz||[]).length===2
   && TOASTS.some(t=>t.indexOf('サモンリミッター')>=0),
   JSON.stringify({before:before,mz:mzNames(0),face:findCardByUid(lim.uid).card.face,toasts:TOASTS.slice(0,2)}));
audit('C5');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* WIKI-D8FEA13745E1 / WIKI-942ECAD162E6（11/05/30）: 人造人間－サイコ・ショッカーが表側の間、
   罠であるサモンリミッターの効果は無効なので 3 回目も召喚できる。 */
gameState.players[1].sz=[mk('サモンリミッター',1,'up')];
gameState.players[1].mz=[mk('人造人間－サイコ・ショッカー',1,'up')];
gameState.players[0].hand=[mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
gameState.players[0].temporaryFlags.normalGrantS03=3;
baselineA();
const t1=summonMon(0,'ワイト'), t2=summonMon(0,'ワイト');
TOASTS.length=0;
const t3=summonMon(0,'ワイト');
ok('C6 ★ WIKI-D8FEA13745E1（11/05/30）: サイコ・ショッカーで罠が無効の間は 3 回目の召喚も通る',
   t1==='idle' && t2==='idle' && t3==='idle' && acts(0)===3
   && (gameState.players[0].mz||[]).length===3
   && trapNegated((gameState.players[1].sz||[])[0])===true,
   JSON.stringify({acts:acts(0),mz:mzNames(0),toasts:TOASTS.slice(0,2)}));
audit('C6');
`, {expect:2});

/* ===== D. サモンチェーン ===== */
harness(COMMON + String.raw`
fresh();
gameState.players[0].hand=[mk('サモンチェーン',0)];
baselineA();
TOASTS.length=0;
duelActivateFromHand(hi(0,'サモンチェーン'));
const tr=drive();
ok('D1 ★ チェーンが無い時は発動できない（チェーン3以降に発動する）',
   tr==='idle' && handNames(0).indexOf('サモンチェーン')>=0
   && TOASTS.some(t=>t.indexOf('チェーン3以降')>=0),
   JSON.stringify({hand:handNames(0),toasts:TOASTS.slice(0,2)}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* 実経路でチェーン 3 を作る: p0 の強欲な壺（1）→ p1 の強欲な瓶（2）→ p0 のサモンチェーン（3）。
   そのうえで二重召喚も発動しておく（WIKI-BD81BAFC2896 11/04/17: 両方でも最大 3 回）。 */
gameState.players[1].sz=[mk('強欲な瓶',1,'down')];
gameState.players[0].hand=[mk('二重召喚',0),mk('強欲な壺',0),mk('サモンチェーン',0),
  mk('ワイト',0),mk('ワイト',0),mk('ワイト',0),mk('ワイト',0)];
baselineA();
duelActivateFromHand(hi(0,'二重召喚'));
const tD=drive();
const max2=normalGrantMaxS03(gameState.players[0]);
RESPOND_WITH=['強欲な瓶','サモンチェーン'];
duelActivateFromHand(hi(0,'強欲な壺'));
const tC=drive();
const max3=normalGrantMaxS03(gameState.players[0]);
const seen=OFFERS.map(o=>o.len+':'+o.names.join('/')).join(' | ');
const ns1=canNS(0,'ワイト'), s1=summonMon(0,'ワイト');
const ns2=canNS(0,'ワイト'), s2=summonMon(0,'ワイト');
const ns3=canNS(0,'ワイト'), s3=summonMon(0,'ワイト');
const ns4=canNS(0,'ワイト');
ok('D2 ★ チェーン 3 以降として発動でき、このターンの通常召喚は 3 回まで差し出される（4 回目は出ない）',
   tD==='idle' && tC==='idle' && max2===2 && max3===3
   && s1==='idle' && s2==='idle' && s3==='idle'
   && ns1===true && ns2===true && ns3===true && ns4===false
   && (gameState.players[0].mz||[]).length===3,
   JSON.stringify({max2:max2,max3:max3,ns:[ns1,ns2,ns3,ns4],mz:mzNames(0),offers:seen.slice(0,180)}));
ok('D3 ★ WIKI-BD81BAFC2896（11/04/17）: 二重召喚と両方を発動しても通常召喚は 3 回で、回数は増えない',
   normalGrantMaxS03(gameState.players[0])===3
   && Number(gameState.players[0].temporaryFlags.normalGrantUsedS03)===2
   && gameState.players[0].normalSummonUsed===true
   && normalRightFreeS03(gameState.players[0])===false,
   JSON.stringify({used:gameState.players[0].temporaryFlags.normalGrantUsedS03,mz:mzNames(0)}));
audit('D2');
`, {expect:3});

harness(COMMON + String.raw`
fresh();
/* 同一チェーン上に同名カードが 2 つ並んだ場合は発動できない。
   p0 の強欲な壺（1）→ p1 の強欲な瓶（2）→ p1 の強欲な瓶（3）で同名が 2 つになる。 */
gameState.players[1].sz=[mk('強欲な瓶',1,'down'),mk('強欲な瓶',1,'down')];
gameState.players[0].hand=[mk('強欲な壺',0),mk('サモンチェーン',0)];
baselineA();
RESPOND_WITH=['強欲な瓶','強欲な瓶'];
duelActivateFromHand(hi(0,'強欲な壺'));
const tr=drive();
const offered=OFFERS.filter(o=>o.len>=3).some(o=>o.names.indexOf('サモンチェーン')>=0);
ok('D4 ★ 同一チェーン上で同名カードが複数回発動している間は、チェーン 3 以降でも応答に出てこない',
   tr==='idle' && offered===false
   && handNames(0).indexOf('サモンチェーン')>=0
   && OFFERS.some(o=>o.len>=3),
   JSON.stringify({offers:OFFERS.map(o=>o.len+':'+o.names.join('/')).join(' | ').slice(0,220)}));
audit('D4');
`, {expect:2});

/* ===== E. ターンで消える ===== */
harness(COMMON + String.raw`
fresh();
gameState.players[0].hand=[mk('ワイト',0)];
baselineA();
const t1=summonMon(0,'ワイト');
const before=acts(0);
requestProcessorV27(PROCESSOR_V27.PHASE,{to:'end'});
drive();
requestProcessorV27(PROCESSOR_V27.TURN);
const t2=drive();
ok('E1 ★ 召喚行為の数はターンの切り替えで消える（temporaryFlags なので保存・Replay にも入る）',
   t1==='idle' && t2==='idle' && before===1 && acts(0)===0 && gameState.turn===6,
   JSON.stringify({before:before,after:acts(0),turn:gameState.turn}));
audit('E1');
`, {expect:2});

const okJs = (label, cond, info) => {
  if (!cond) { console.log('FAIL ' + label + (info ? ' ' + info : '')); process.exitCode = 1; }
  else console.log('PASS ' + label);
};
const cardSrc = SRC_S517['cards/HZZZZZZZZZZZZA_claude_s03_u517_summon_counts.js'];
const engSrc = SRC_S517['engine/1ZZS_summon_lock_s03.js'];
const stateSrc = SRC_S517['engine/00_state_actions.js'];
const doc = SRC_S517['docs/S03_U517_REPORT.md'];
okJs('E2 ★ カードは当時裁定の ID を根拠として持つ（3 枚すべて）',
  ['WIKI-69B7A89DCDA8', 'WIKI-902B1F48CA44', 'WIKI-05D8FDD9315F', 'WIKI-FA2EC0926915', 'WIKI-4FD72A35ED9E',
   'WIKI-D8FEA13745E1', 'WIKI-3990B9280CC0', 'WIKI-BD81BAFC2896'].every(id => cardSrc.indexOf(id) >= 0));
okJs('E3 ★ 数える側（engine/1ZZS）は「常に数える」理由と「調整中」を明記している',
  engSrc.indexOf('WIKI-FA2EC0926915') >= 0 && engSrc.indexOf('WIKI-3990B9280CC0') >= 0
  && engSrc.indexOf('function noteSummonActS03') >= 0 && engSrc.indexOf('function globalSummonLockReasonS03') >= 0);
okJs('E4 ★ 通常召喚の上限（engine/00）は複数枚で増えない理由を裁定 ID 付きで書いている',
  stateSrc.indexOf('WIKI-BD81BAFC2896') >= 0 && stateSrc.indexOf('function normalGrantMaxS03') >= 0);
okJs('E5 ★ 報告書に未対応（トークンの特殊召喚・複数体を出す効果の発動可否）が書かれている',
  doc.indexOf('TOKEN_CREATE') >= 0 && doc.indexOf('WIKI-CA7FC24FF02B') >= 0 && doc.indexOf('スケープ・ゴート') >= 0);
okJs('E6 ★ このテストが tools/check.py に登録されている',
  SRC_S517['tools/check.py'].indexOf('test_s03_u517_summon_counts.js') >= 0);
