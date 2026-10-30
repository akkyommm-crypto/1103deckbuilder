/* S03-U486: 召喚・反転で開いた応答タイミングの窓（gameState.timingWindow の 'summon' / 'flip'）を、その応答タイミングが終わった所で閉じる。
   背景（docs/S03_U483_REPORT.md の 4-a）: この窓は runtime/50_actions_save.js の updateTimingWindow が NORMAL_SUMMON / FX_SPECIAL_SUMMON / FX_EX_SUMMON /
   FX_RITUAL_SUMMON で開く。閉じていたのは「召喚成功後のクイックエフェクト確認（summonFast / flipFast）の POINT を両者がパスした時」だけ
   （queuePointContinuationV27 の clearTimingOnPass）で、その POINT が一度も作られない経路では閉じる処理が無く、そのフェイズの間
   currentTimings() に 'summon' が残り続けていた。結果、「召喚に成功した時」のカード（グリーン・ガジェット等）がメインフェイズのメニューに
   出続け、発動すると 1103 のルールで断られる。S03-U42 が FX_SET_STATE について直したのと同じ型の欠陥。
   さらにこの窓は Journal にも digest にも入っておらず offerResumeDuel が捨てるので、保存・再開した側だけ窓が無く、同じ盤面でメニューが食い違っていた。
   ユーザー判断（優先順位③）: 古い窓をそのまま保存するのは不適切。保存なし側にも不要な窓が残っているので、正しいタイミングで閉じ、再開後も一致させる。
   実測の起点: R1 の seed 0x52311015（tg_gadget × tg_skill, R1_POLICY=random, R1_RESPOND=1）turn 7 で《血の代償》の「通常召喚扱い」の特殊召喚の後、
   開いたメインフェイズでの getLegalZoneActions 14 回がすべて 'summon' の窓を見ていた → 修正後 0 回。
   なお《血の代償》自体は S03-U487 で正規の通常召喚（onNormalSummon + summonFast）に直したので、もう「POINT が作られない経路」ではない。
   この試験は、同じ性質が残っている実在経路《降霊の儀式》（墓地から raw FX_SPECIAL_SUMMON で蘇生し、召喚成功のイベントを出さない）で固定する。
   その「召喚成功のイベントが出ない」こと自体は別の欠陥で、本単位では直していない（docs/S03_U486_REPORT.md の 6）。
   修正: engine/30 の closeStaleSummonTimingS03 ─ プロセッサが実際に 1 つ以上処理し終えて、何も待っていない開いたメインフェイズに戻った時点で閉じる。
   加えて復旧経路（engine/1X・engine/1ZZP）がプロセッサのキューを捨てる時は、閉じ手（POINT）を失った召喚・反転の窓を引き継がない。 */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function pc(){return pendingChoiceV49(gameState);}
function uid(c){return ensureCardUid(gameState,c);}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function tw(){return gameState.timingWindow?JSON.stringify(gameState.timingWindow):'null';}
function twKind(){return gameState.timingWindow?gameState.timingWindow.kind:null;}
let OPENED=[],ENQ=[];
(function(){const f=enqueueProcessorV27;enqueueProcessorV27=function(t,pl,front){
  if(t===PROCESSOR_V27.POINT&&pl&&pl.kind)ENQ.push(pl.kind);return f.apply(this,arguments);};})();
function idle(){return !gameState.processorPaused&&!gameState.processorWaiting&&!(gameState.processorQueue||[]).length
  &&!(gameState.deferredEvents||[]).length&&!(gameState.chain||[]).length&&!gameState.pendingSummon&&!gameState.pendingChoice&&!gameState.battle
  &&!(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE);}
function step(){
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();return 'evt';}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();return 'summon';}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();return 'chain';}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){OPENED.push((w.payload&&w.payload.kind)||'?');pointPassV27();return 'point';}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();return 'pump';}
  return null;}
function drive(){for(let i=0;i<600;i++){if(pc()){__choicePickV49(0);continue;}if(!step())return 'idle';}return 'loop';}
function fresh(active){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;OPENED=[];ENQ=[];
  try{EVT_RESUME_DATA_V484=null;}catch(e){}
  gameState.activePlayer=active;gameState.firstPlayer=0;gameState.turn=5;gameState.phase='main1';
  gameState.rngInitialSeed=gameState.rngState=0x4860011;
  for(let p=0;p<2;p++)gameState.players[p].deck=Array.from({length:14},()=>mk('ワイト',p));}
/* 「召喚に成功した時」のカードが、開いたメインフェイズでメニューに出てしまうか */
function gadgetOffered(){
  const sc=CARD_SCRIPTS['グリーン・ガジェット'];
  const t=(typeof timingCheck==='function')?timingCheck(sc):null;
  return !!(t&&t.ok);
}
`;

/* ===== A. 召喚成功の POINT が作られない実在経路（《降霊の儀式》）: 応答タイミングが終われば窓は閉じる ===== */
harness(COMMON+String.raw`
fresh(0);
const rit=mk('降霊の儀式',0,'down');rit.setTurn=gameState.turn-1;gameState.players[0].sz=[rit];
const mon=mk('墓守の偵察者',0);gameState.players[0].grave=[mon];
gameState.players[0].hand=[mk('グリーン・ガジェット',0)];
baselineA();
ok('A 前提: 発動前は窓が開いていない',twKind()===null,tw());
ok('A 前提: 発動前は「召喚に成功した時」のカードは発動できない',!gadgetOffered(),JSON.stringify(timingCheck(CARD_SCRIPTS['グリーン・ガジェット'])));
duelActivateFromZone(0,'sz',0);
drive();
ok('A 前提: 《降霊の儀式》で墓地のモンスターが場に出た',z(mon)==='mz',JSON.stringify({mon:z(mon),toasts:TOASTS.slice(-2)}));
ok('A 前提: 応答タイミングはもう終わっている（プロセッサは空、チェーンも無い、開いたメインフェイズ）',
   idle()&&(gameState.phase==='main1'),JSON.stringify({phase:gameState.phase,q:(gameState.processorQueue||[]).length,defer:(gameState.deferredEvents||[]).length}));
ok('A ★ 開いたメインフェイズでは召喚の窓が閉じている（修正前はこのフェイズの間ずっと開いていた）',twKind()===null,tw());
ok('A ★ したがって「召喚に成功した時」のカードはメニューに出ない',!gadgetOffered(),JSON.stringify(timingCheck(CARD_SCRIPTS['グリーン・ガジェット'])));
ok('A: この経路では summonFast の POINT が一度も作られていない（＝既存の閉じ手が働かない経路であることの確認。開いた窓ではなく作られた POINT で見る）',
   ENQ.indexOf('summonFast')<0&&OPENED.indexOf('summonFast')<0,JSON.stringify({enq:ENQ,opened:OPENED}));
{const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
 ok('A: Replay 監査が全 digest と最終状態を再現する（窓は digest に含まれないので影響しない）',
    pkg.actions.length>0&&a.ok&&a.finalDigest===v41StateDigest(gameState),JSON.stringify(a).slice(0,180));}
`);

/* ===== B. 正の対照: 応答タイミングの「途中」では窓を閉じない（召喚誘発が死なないこと） ===== */
harness(COMMON+String.raw`
fresh(0);
const air=mk('E・HERO エアーマン',0);gameState.players[0].hand=[air];
gameState.players[0].deck.unshift(mk('E・HERO オーシャン',0));
gameState.players[1].mz=[mk('ワイト',1)];
const q=mk('月の書',1,'down');q.setTurn=gameState.turn-1;gameState.players[1].sz=[q];
baselineA();
doNormalSummon(0,'atk');
/* 誘発がチェーンに乗る所まで */
let guard=0;
while(guard++<200&&!gameState.chain.some(l=>l.name==='E・HERO エアーマン')){ if(pc()){__choicePickV49(0);continue;} if(!step())break; }
ok('B 前提: 召喚誘発がチェーンに乗っている',gameState.chain.some(l=>l.name==='E・HERO エアーマン'),JSON.stringify(gameState.chain.map(l=>l.name)));
ok('B ★ 応答タイミングの途中では窓を閉じない（閉じると召喚誘発・応答が死ぬ）',twKind()!==null,tw());
drive();
ok('B 前提: 召喚成功後のクイックエフェクト確認が実際に開いた',OPENED.indexOf('summonFast')>=0,JSON.stringify(OPENED));
ok('B ★ そのタイミングが終わった後は窓が閉じている',twKind()===null&&idle(),JSON.stringify({tw:tw(),idle:idle()}));
ok('B: エアーマンの効果は解決している（手札が増えた）',gameState.players[0].hand.length>=1,String(gameState.players[0].hand.length));
`);

/* ===== C. Negative control: 閉じる処理を外すと A が元の欠陥に戻る ===== */
harness(COMMON+String.raw`
closeStaleSummonTimingS03=function(){};   /* S03-U486 より前の状態（閉じ手が無い） */
fresh(0);
const rit=mk('降霊の儀式',0,'down');rit.setTurn=gameState.turn-1;gameState.players[0].sz=[rit];
const mon=mk('墓守の偵察者',0);gameState.players[0].grave=[mon];
gameState.players[0].hand=[mk('グリーン・ガジェット',0)];
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
ok('C negative control 前提: 同じ盤面・同じ経路で召喚まで到達した',z(mon)==='mz'&&idle(),JSON.stringify({mon:z(mon),idle:idle()}));
ok('C negative control: 閉じる処理が無いと、開いたメインフェイズでも召喚の窓が開いたまま残る（これが直した欠陥）',
   twKind()==='summon',tw());
ok('C negative control: その結果「召喚に成功した時」のカードがメニューに出てしまう（発動すると断られる）',
   gadgetOffered(),JSON.stringify(timingCheck(CARD_SCRIPTS['グリーン・ガジェット'])));
`);

/* ===== D. 復旧経路は、閉じ手（POINT）を失った召喚・反転の窓を引き継がない ===== */
harness(COMMON+String.raw`
ok('D: 復旧経路の判定関数がある',typeof summonTimingWindowS03==='function','');
ok('D: 召喚・反転の窓だけを「引き継がない」と判定する',
   summonTimingWindowS03({kind:'summon'})===true&&summonTimingWindowS03({kind:'flip'})===true
   &&summonTimingWindowS03({kind:'summonFast'})===true&&summonTimingWindowS03({kind:'flipFast'})===true,'');
ok('D: バトル関係の窓は引き継ぐ（閉じ手がバトル処理側にあるため）',
   summonTimingWindowS03({kind:'battleStep'})===false&&summonTimingWindowS03({kind:'damageStep'})===false
   &&summonTimingWindowS03({kind:'attackDeclare'})===false&&summonTimingWindowS03(null)===false,'');
ok('D: 復旧経路（engine/1X の発動中断の復旧、engine/1ZZP の切れた Journal の復旧）の live コピーが、どちらもこの判定を通している',
   /summonTimingWindowS03/.test(String(recoverInterruptedActivationAfterLoadS03))
   && /summonTimingWindowS03/.test(String(recoverInterruptedResolutionAfterLoadS296)),
   JSON.stringify({u1x:/summonTimingWindowS03/.test(String(recoverInterruptedActivationAfterLoadS03)),
                   u1zzp:/summonTimingWindowS03/.test(String(recoverInterruptedResolutionAfterLoadS296))}));
`);
