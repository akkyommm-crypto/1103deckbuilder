/* S03-U514: エクシーズ素材を使う未実装カード 3 枚（カード実装）。

   《巨星のミラ》（NOT_STARTED・ランク1）
     表側表示のこのカードが破壊される場合、代わりにエクシーズ素材を1つ取り除く事ができる。
     このカードが表側表示で存在する限り、自分フィールドの表側表示のレベル4以下のモンスターは
     カードの効果では破壊されない。
   《ブラック・レイ・ランサー》（NOT_STARTED・ランク3）
     1ターンに1度、エクシーズ素材を1つ取り除き、フィールドの表側表示モンスター1体を選択して発動できる。
     選択したモンスターの効果をエンドフェイズ時まで無効にする。
   《ラヴァルバル・イグニス》（NOT_STARTED・ランク3）
     このカードが戦闘を行うダメージステップ時に1度だけ、エクシーズ素材を1つ取り除いて発動できる。
     このカードの攻撃力はエンドフェイズ時まで500ポイントアップする。

   **新しい共通処理は足していない。** 使ったのは既存の仕組みだけ:
     任意の破壊身代わりの種別 'detach'（S03-U173）・破壊耐性 continuous.protectV21（v21）・
     X素材のコスト detachCostS03（S03-U114）・card.negatedUntilTurn（《エフェクト・ヴェーラー》と同じ）・
     ダメージステップの発動 dsTiming と API.modAtk(..., 'endPhase')。

   固定するもの:
     A 形
     B 巨星のミラ（身代わり・耐性・negative control）
     C ブラック・レイ・ランサー（無効・negative control・1ターンに1度）
     D ラヴァルバル・イグニス（攻撃力・negative control・1 ダメージステップに 1 度）
     E Replay 監査
     F 文書・登録 */
const harness = require('./astra_harness');
const fsA = require('fs'), pathA = require('path');
const ROOT_S514 = pathA.resolve(__dirname, '..');
const rdS514 = p => fsA.readFileSync(pathA.join(ROOT_S514, p), 'utf8');
const SRC_S514 = {
  'cards/HZZZZZZZZZZZX_claude_s03_u514_xyz_material.js': rdS514('cards/HZZZZZZZZZZZX_claude_s03_u514_xyz_material.js'),
  'docs/S03_U514_REPORT.md': rdS514('docs/S03_U514_REPORT.md'),
  'tools/check.py': rdS514('tools/check.py')
};

const COMMON = String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function zu(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function cardOf(uid){const h=findCardByUid(uid);return h?h.card:null;}
function mats(uid){const c=cardOf(uid);return c&&Array.isArray(c.xyz)?c.xyz.length:null;}
function mkXyz(name,p,matNames){
  const c=mk(name,p,'up');
  c.xyz=(matNames||[]).map(n=>{const m=mk(n,p);ensureCardUid(gameState,m);return m;});
  ensureCardUid(gameState,c);
  return c;}
let PREFER=[];
function resetVolatile(){EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  try{CHOICE_LEGACY_CB_V49=new Map();}catch(e){}try{ACTIVATION_PREP_S03=null;}catch(e){}try{RESOLVING_LINK_S03=null;}catch(e){}
  try{PENDING_SUMMON_COMMIT=null;PENDING_SUMMON_CANCEL=null;}catch(e){}try{EVT_CANDS=[];}catch(e){}
  try{PROCESSOR_PUMPING_V27=false;}catch(e){}try{APPLY_ACTION_DEPTH_V31=0;}catch(e){}
  try{DESTROY_SUB_BATCH_S03=null;}catch(e){}}
function fresh(){resetA();resetVolatile();TOASTS.length=0;PREFER=[];
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4961011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
/* PREFER に積んだ uid / キーがあればそれを選ぶ。無ければ先頭。 */
function pickPreferred(){const q=pc();if(!q)return false;
  let j=-1;
  for(let k=0;k<PREFER.length;k++){
    j=(q.candidates||[]).findIndex(x=>x&&((x.uid!=null&&x.uid===PREFER[k])||x.key===PREFER[k]));
    if(j>=0){PREFER.splice(k,1);break;}}
  __choicePickV49(j>=0?j:0);return true;}
function drive(){for(let i=0;i<900;i++){
  if(pickPreferred())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if((gameState.deferredEvents||[]).length){flushDeferredEventsV2();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});return drive();}
function attackS514(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx:atkIdx,target:target});return drive();}
function handIndexOf(p,name){return (gameState.players[p].hand||[]).findIndex(c=>c&&cardName(c)===name);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',
     pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,200));}
`;

/* ===== A. 形 ===== */
harness('const SRC=' + JSON.stringify(SRC_S514) + ';' + COMMON + String.raw`
fresh();
ok('A1 ★ 3 枚が登録され、既存の仕組みだけを使っている',
   !!CARD_SCRIPTS['巨星のミラ'] && !!CARD_SCRIPTS['ブラック・レイ・ランサー'] && !!CARD_SCRIPTS['ラヴァルバル・イグニス']
   && JSON.stringify(CARD_SCRIPTS['巨星のミラ'].destroySubstituteS03)==='{"kind":"detach","causes":["battle","effect"]}'
   && CARD_SCRIPTS['ブラック・レイ・ランサー'].detachCostS03.count===1
   && CARD_SCRIPTS['ブラック・レイ・ランサー'].countLimit===1
   && CARD_SCRIPTS['ラヴァルバル・イグニス'].dsTiming==='start',
   JSON.stringify({mira:CARD_SCRIPTS['巨星のミラ'].destroySubstituteS03,
     ds:CARD_SCRIPTS['ラヴァルバル・イグニス'].dsTiming}));
ok('A2 ★ 素材のコストと対象の選択は両方とも登録済みの選択として宣言している（保存・再開に耐える）',
   typeof CARD_SCRIPTS['ブラック・レイ・ランサー'].detachCostS03.targets==='function'
   && typeof CARD_SCRIPTS['ブラック・レイ・ランサー'].selectTargets==='function',
   '');
`, {expect:2});

/* ===== B. 巨星のミラ ===== */
harness(COMMON + String.raw`
fresh();
const mira=mkXyz('巨星のミラ',0,['ワイト','ワイト','ワイト']);
gameState.players[0].mz=[mira];
gameState.players[1].hand=[mk('ブラック・ホール',1)];
gameState.activePlayer=1;
baselineA();
duelActivateFromHand(handIndexOf(1,'ブラック・ホール'));
const tr=drive();
ok('B1 ★ 破壊される場合、代わりにエクシーズ素材を1つ取り除ける',
   tr==='idle' && zu(mira.uid)==='mz' && mats(mira.uid)===2,
   JSON.stringify({mira:zu(mira.uid),mats:mats(mira.uid)}));
audit('B1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
const mira=mkXyz('巨星のミラ',0,['ワイト','ワイト','ワイト']);
const low=mk('ワイト',0,'up');              /* レベル1 */
const high=mk('デーモンの召喚',0,'up');      /* レベル6 */
const foeLow=mk('ワイト',1,'up');            /* 相手のレベル1 */
gameState.players[0].mz=[mira,low,high];
gameState.players[1].mz=[foeLow];
gameState.players[1].hand=[mk('ブラック・ホール',1)];
gameState.activePlayer=1;
baselineA();
duelActivateFromHand(handIndexOf(1,'ブラック・ホール'));
const tr=drive();
ok('B2 ★ 自分の表側のレベル4以下は効果では破壊されない。レベル5以上と相手のモンスターは守らない',
   tr==='idle' && zu(low.uid)==='mz' && zu(high.uid)==='grave' && zu(foeLow.uid)==='grave',
   JSON.stringify({low:zu(low.uid),high:zu(high.uid),foeLow:zu(foeLow.uid),mira:zu(mira.uid)}));
audit('B2');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 素材が無ければ身代わりにできず、このカードも破壊される */
const mira=mkXyz('巨星のミラ',0,[]);
gameState.players[0].mz=[mira];
gameState.players[1].hand=[mk('ブラック・ホール',1)];
gameState.activePlayer=1;
baselineA();
duelActivateFromHand(handIndexOf(1,'ブラック・ホール'));
const tr=drive();
ok('B3 ★ negative control: エクシーズ素材が無ければ身代わりにできない',
   tr==='idle' && zu(mira.uid)==='grave',
   JSON.stringify({mira:zu(mira.uid)}));
`, {expect:1});

/* ===== C. ブラック・レイ・ランサー ===== */
harness(COMMON + String.raw`
fresh();
const lan=mkXyz('ブラック・レイ・ランサー',0,['ワイト','ワイト']);
gameState.players[0].mz=[lan];
const foe=mk('人造人間－サイコ・ショッカー',1,'up');
gameState.players[1].mz=[foe];
baselineA();
PREFER=[foe.uid];
const L=strictScriptLegalityV2('ブラック・レイ・ランサー',0,'mz',0,{});
duelActivateFromZone(0,'mz',0);
const tr=drive();
ok('C1 ★ 素材を1つ取り除き、選択した表側表示モンスターの効果をそのターンの終わりまで無効にする',
   L.ok===true && tr==='idle' && mats(lan.uid)===1
   && effectNegated(cardOf(foe.uid))===true
   && Number(cardOf(foe.uid).negatedUntilTurn)===Number(gameState.turn),
   JSON.stringify({legal:{ok:L.ok,reason:L.reason},mats:mats(lan.uid),
     negated:effectNegated(cardOf(foe.uid))}));
audit('C1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 素材が無ければ発動できない */
const lan=mkXyz('ブラック・レイ・ランサー',0,[]);
gameState.players[0].mz=[lan];
gameState.players[1].mz=[mk('人造人間－サイコ・ショッカー',1,'up')];
baselineA();
const L=strictScriptLegalityV2('ブラック・レイ・ランサー',0,'mz',0,{});
ok('C2 ★ negative control: エクシーズ素材が無ければ発動できない',
   L.ok===false && String(L.reason||'').indexOf('エクシーズ素材')>=0,
   JSON.stringify({ok:L.ok,reason:L.reason}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* 1 ターンに 1 度 */
const lan=mkXyz('ブラック・レイ・ランサー',0,['ワイト','ワイト']);
gameState.players[0].mz=[lan];
const foe=mk('人造人間－サイコ・ショッカー',1,'up');
const foe2=mk('デーモンの召喚',1,'up');
gameState.players[1].mz=[foe,foe2];
baselineA();
PREFER=[foe.uid];
duelActivateFromZone(0,'mz',0);
drive();
const after1=mats(lan.uid);
const L2=strictScriptLegalityV2('ブラック・レイ・ランサー',0,'mz',0,{});
ok('C3 ★ 1 ターンに 1 度しか使えない（素材はまだ残っている）',
   after1===1 && L2.ok===false,
   JSON.stringify({after1,second:{ok:L2.ok,reason:L2.reason}}));
`, {expect:1});

/* ===== D. ラヴァルバル・イグニス ===== */
harness(COMMON + String.raw`
fresh();
const ig=mkXyz('ラヴァルバル・イグニス',0,['ワイト','ワイト']);   /* 攻 1800 */
gameState.players[0].mz=[ig];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];            /* 攻 2500 */
gameState.phase='battle';
baselineA();
const tr=attackS514(0,0,0);
ok('D1 ★ 戦闘のダメージステップに素材を1つ取り除いて攻撃力 +500'
   +'（1800→2300 なので戦闘ダメージは 700 ではなく 200）',
   tr==='idle' && mats(ig.uid)===null && zu(ig.uid)==='grave'
   && gameState.players[0].lp===8000-200,
   JSON.stringify({ig:zu(ig.uid),lp0:gameState.players[0].lp}));
audit('D1');
`, {expect:2});

harness(COMMON + String.raw`
fresh();
/* negative control: 素材が無ければ攻撃力は上がらない（戦闘ダメージは 700） */
const ig=mkXyz('ラヴァルバル・イグニス',0,[]);
gameState.players[0].mz=[ig];
gameState.players[1].mz=[mk('デーモンの召喚',1,'up')];
gameState.phase='battle';
baselineA();
const tr=attackS514(0,0,0);
ok('D2 ★ negative control: エクシーズ素材が無ければ発動せず、ダメージは 700 のまま',
   tr==='idle' && zu(ig.uid)==='grave' && gameState.players[0].lp===8000-700,
   JSON.stringify({ig:zu(ig.uid),lp0:gameState.players[0].lp}));
`, {expect:1});

harness(COMMON + String.raw`
fresh();
/* 同じダメージステップでは 1 度だけ（素材 2 つでも 1 つしか減らない） */
const ig=mkXyz('ラヴァルバル・イグニス',0,['ワイト','ワイト']);
gameState.players[0].mz=[ig];
gameState.players[1].mz=[mk('ワイト',1,'up')];                    /* 攻 400 */
gameState.phase='battle';
baselineA();
const tr=attackS514(0,0,0);
ok('D3 ★ 同じダメージステップでは 1 度だけ（素材は 1 つしか減らない）',
   tr==='idle' && zu(ig.uid)==='mz' && mats(ig.uid)===1,
   JSON.stringify({ig:zu(ig.uid),mats:mats(ig.uid),lp1:gameState.players[1].lp}));
audit('D3');
`, {expect:2});

/* ===== F. 文書・登録 ===== */
harness('const S=' + JSON.stringify(SRC_S514) + ';' + String.raw`
const REP=S['docs/S03_U514_REPORT.md'], CHK=S['tools/check.py'];
ok('F1 ★ 報告書に、実装した効果と未対応の範囲が分けて書かれている',
   REP.indexOf('実装した範囲')>=0 && REP.indexOf('未対応の範囲')>=0
   && REP.indexOf('巨星のミラ')>=0 && REP.indexOf('ブラック・レイ・ランサー')>=0
   && REP.indexOf('ラヴァルバル・イグニス')>=0,'');
ok('F2 ★ check.py にこのテストが登録されている',
   CHK.indexOf('test_s03_u514_xyz_material.js')>=0,'');
`, {expect:2});
