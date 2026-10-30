/* S03-U488: raw な召喚 Action で場に出した時にも、召喚成功のイベントを出す。
   S03-U487（《血の代償》）と同じクラスの欠陥。cards/ の中で act({type:'FX_SPECIAL_SUMMON'|'NORMAL_SUMMON'|'FX_EX_SUMMON'|'FX_RITUAL_SUMMON'}) を
   直接発火している箇所を走査した結果、残っていた実在経路は《降霊の儀式》だった。
   reducer も呼び出し側も召喚成功のイベントを積まないため、
     - onSpecialSummon が発火しない → 「特殊召喚に成功した時」の誘発が起きない
     - 召喚成功後の応答タイミング（summonFast の POINT）も作られない → 相手が《奈落の落とし穴》《激流葬》等で応答できない
   修正: API.specialSummon（engine/40）と同じ queueSpecialSummonSuccessV2 を呼ぶ。
   解決中は RESOLUTION_SUMMON_BATCH_V2 に入り、チェーン終了後に onSpecialSummon としてまとめて発火する。
   《降霊の儀式》が API.specialSummon を使わず raw な Action を使っているのは「ネクロバレーの影響を受けないため墓地ロックを迂回する」
   という既存の設計判断（カードの auditNote）で、そこは変えていない（その裁定自体は本単位の範囲外）。
   走査結果（本単位時点）:
     - cards/00_generic_core.js（血の代償）        … S03-U487 で正規の NORMAL_SUMMON + onNormalSummon に修正済み
     - cards/39_1103_expansion_v380b.js（降霊の儀式）… 本単位で修正
     - cards/HD_claude_s03_u53_instant_fusion.js（簡易融合）… 既に queueSpecialSummonSuccessV2 を呼んでいる
     - cards/HZK_claude_s03_u164_dual_summoner.js（デュアル・サモナー）… 既に NORMAL_SUMMON + onNormalSummon
     - cards/40_auto_interpreter.js（doExSummon）  … emitEvent('onSpecialSummon') を呼ぶ（DUEL のシンクロ・エクシーズは beginExSummonV2 の正規経路） */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function live(c){const h=findCardByUid(c.uid);return h?h.card:null;}
let ENQ=[],EVS=[];
(function(){const f=enqueueProcessorV27;enqueueProcessorV27=function(t,pl,front){
  if(t===PROCESSOR_V27.POINT&&pl&&pl.kind)ENQ.push(pl.kind);return f.apply(this,arguments);};
 const g=queueDeferredEventV2;queueDeferredEventV2=function(n,e){EVS.push(n);return g.apply(this,arguments);};})();
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function drive(){for(let i=0;i<600;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay 監査が全 digest と最終状態を再現する',pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,160));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;ENQ=[];EVS=[];
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  gameState.activePlayer=0;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4880011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:12},()=>mk('ワイト',p));}
/* 《降霊の儀式》で蘇生する《墓守の司令官》は攻撃力 1600 なので《奈落の落とし穴》の条件（1500 以上）を満たす */
function setup(withAbyss){fresh();
  const rit=mk('降霊の儀式',0,'down');rit.setTurn=gameState.turn-1;gameState.players[0].sz=[rit];
  const gk=mk('墓守の司令官',0);gameState.players[0].grave=[gk];
  if(withAbyss){const q=mk('奈落の落とし穴',1,'down');q.setTurn=gameState.turn-1;gameState.players[1].sz=[q];}
  baselineA();return {rit:rit,gk:gk};}
`;

/* ===== A. 《降霊の儀式》: 召喚成功のイベントと、相手の応答が働く ===== */
harness(COMMON+String.raw`
const S=setup(true);
ok('A 前提: 蘇生する《墓守の司令官》は攻撃力 1500 以上（《奈落の落とし穴》の条件）',
   (dbOf(S.gk).atk||0)>=1500,String(dbOf(S.gk).atk));
duelActivateFromZone(0,'sz',0);
drive();
ok('A ★ onSpecialSummon が発火する（修正前は一度も発火しなかった）',
   EVS.indexOf('onSpecialSummon')>=0,JSON.stringify(EVS));
ok('A ★ 召喚成功後の応答タイミング（summonFast の POINT）が作られる',
   ENQ.indexOf('summonFast')>=0,JSON.stringify(ENQ));
ok('A ★ 相手の《奈落の落とし穴》が応答して除外される（修正前は場に残っていた）',
   z(S.gk)==='banish',z(S.gk));
audit('A');
`);

/* ===== B. 相手の応答が無い盤面でも、召喚自体は今までどおり成立する ===== */
harness(COMMON+String.raw`
const S=setup(false);
duelActivateFromZone(0,'sz',0);
drive();
ok('B: 墓地の《墓守の司令官》が場に出ている',z(S.gk)==='mz',z(S.gk));
ok('B: 特殊召喚として扱われている',!!live(S.gk).specialSummoned,String(!!live(S.gk).specialSummoned));
ok('B: onSpecialSummon は発火し、窓も作られる',
   EVS.indexOf('onSpecialSummon')>=0&&ENQ.indexOf('summonFast')>=0,JSON.stringify({evs:EVS,enq:ENQ}));
audit('B');
`);

/* ===== C. 墓地ロックの迂回（カードの auditNote の既存の設計判断）を壊していない ===== */
harness(COMMON+String.raw`
const S=setup(false);
/* 《王家の眠る谷－ネクロバレー》を自分のフィールドゾーンに置く */
const nv=mk('王家の眠る谷－ネクロバレー',0,'up');gameState.players[0].field=nv;
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
ok('C: ネクロバレーがあっても蘇生できる（API の墓地ロックを迂回する既存の設計判断を維持している）',
   z(S.gk)==='mz',JSON.stringify({gk:z(S.gk),toasts:TOASTS.slice(-2)}));
ok('C: その場合も召喚成功のイベントは出る',EVS.indexOf('onSpecialSummon')>=0,JSON.stringify(EVS));
`);

/* ===== D. Negative control: イベントを出す呼び出しを外すと、元の欠陥に戻る ===== */
harness(COMMON+String.raw`
/* S03-U488 より前の実装（raw な Action だけ） */
CARD_SCRIPTS['降霊の儀式'].resolve=function(ctx){
  const t=resolveTarget(ctx.selectedTargets[0]);
  if(t&&t.zone==='grave')act({type:'FX_SPECIAL_SUMMON',player:ctx.player,from:'grave',fromIndex:t.index,pos:'atk',reason:'降霊の儀式'});
};
const S=setup(true);
duelActivateFromZone(0,'sz',0);
drive();
ok('D negative control 前提: 蘇生そのものは起きる',z(S.gk)==='mz',z(S.gk));
ok('D negative control: 修正前は onSpecialSummon が発火しない（これが直した欠陥）',
   EVS.indexOf('onSpecialSummon')<0,JSON.stringify(EVS));
ok('D negative control: 召喚成功後の POINT も作られない',ENQ.indexOf('summonFast')<0,JSON.stringify(ENQ));
ok('D negative control: 相手の《奈落の落とし穴》も応答できない（除外されずに場に残る）',
   z(S.gk)==='mz',z(S.gk));
`);

/* ===== E. 監査: raw な召喚 Action を使う箇所が、召喚成功のイベントも出していること ===== */
harness(COMMON+String.raw`
const SUMMON_ACT=/act\s*\(\s*(Object\.assign\s*\(\s*)?\{[^}]*type\s*:\s*['"](FX_SPECIAL_SUMMON|NORMAL_SUMMON|FX_EX_SUMMON|FX_RITUAL_SUMMON)['"]/;
const EVENT_CALL=/queueSpecialSummonSuccessV2|queueDeferredEventV2\s*\(\s*['"](onSpecialSummon|onNormalSummon)['"]|emitEvent\s*\(\s*['"](onSpecialSummon|onNormalSummon)['"]/;
/* CARD_SCRIPTS の関数（入れ子も見る）と、カード側のグローバル補助関数を対象にする */
function fnsOf(o,depth,out){
  if(!o||depth>4)return out;
  Object.keys(o).forEach(k=>{
    const v=o[k];
    if(typeof v==='function') out.push({src:String(v)});
    else if(v&&typeof v==='object') fnsOf(v,depth+1,out);
  });
  return out;
}
const offenders=[];
Object.keys(CARD_SCRIPTS).forEach(n=>{
  const fns=fnsOf(CARD_SCRIPTS[n],0,[]);
  const raw=fns.filter(f=>SUMMON_ACT.test(f.src));
  if(!raw.length) return;
  if(!raw.some(f=>EVENT_CALL.test(f.src))) offenders.push(n);
});
ok('E ★ CARD_SCRIPTS の中で raw な召喚 Action を使いながら召喚成功のイベントを出していないスクリプトは無い',
   offenders.length===0,JSON.stringify(offenders));
/* カード側のグローバル補助関数（CARD_SCRIPTS から辿れない）も個別に固定する */
ok('E: 《血の代償》の補助関数は NORMAL_SUMMON と onNormalSummon の両方を持つ（S03-U487）',
   SUMMON_ACT.test(String(s03BloodOfferTributeThenSummon))
   && /queueDeferredEventV2\s*\(\s*['"]onNormalSummon['"]/.test(String(s03BloodOfferTributeThenSummon)),'');
ok('E: 《降霊の儀式》の resolve は raw な Action と queueSpecialSummonSuccessV2 の両方を持つ（本単位）',
   SUMMON_ACT.test(String(CARD_SCRIPTS['降霊の儀式'].resolve))
   && /queueSpecialSummonSuccessV2/.test(String(CARD_SCRIPTS['降霊の儀式'].resolve)),'');
ok('E: doExSummon（cards/40_auto_interpreter.js）は raw な FX_EX_SUMMON と emitEvent の両方を持つ',
   SUMMON_ACT.test(String(doExSummon)) && /emitEvent\s*\(\s*['"]onSpecialSummon['"]/.test(String(doExSummon)),'');
ok('E: 正規のヘルパー queueSpecialSummonSuccessV2 は解決中はバッチへ、それ以外は即キューへ入れる',
   /RESOLUTION_SUMMON_BATCH_V2/.test(String(queueSpecialSummonSuccessV2))
   && /queueDeferredEventV2/.test(String(queueSpecialSummonSuccessV2)),'');
`);
