/* S03-U224: NOT_STARTED → TESTED — オーロラ・アンギラス, サボウ・クローザー, ゴーレム・ドラゴン, デコイロイド, 女王親衛隊, 共同戦線, 借カラクリ整備蔵, 地縛波,
   フェザー・ウィンド, バスター・カウンター. Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function z(c){const hh=findCardByUid(c.uid);return hh?hh.zone:null;}
function C(c){return findCardByUid(c.uid).card;}
function pc(){return pendingChoiceV49(gameState);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0x5331a5e5;
  for(let p=0;p<2;p++) gameState.players[p].deck=Array.from({length:6},()=>mk('ワイト',p));}
let PREFER=[],TRIG=[];
function step(){const q=pc();if(q){let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function toWindow(){for(let i=0;i<200;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length)return true;
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return false;}return false;}
function offered(p,c){return (getChainResponsesV2(p)||[]).some(r=>r.card===C(c));}
function ssr(p,name){return v46SpecialSummonRestrictionReason(p,dbOf(mk(name,p)));}
function forb(p,c){return !!attackTargetForbiddenReasonS03(p,C(c));}
/* the opponent (player 1) activates 威嚇する咆哮 in its own turn; player 0 answers with the Counter Trap at sz[0] when offered */
function roarAnswered(ct){ const ir=mk('威嚇する咆哮',1,'down');ir.setTurn=4;gameState.players[1].sz=[ir];gameState.activePlayer=1;baselineA();
  duelActivateFromZone(1,'sz',0);const w=toWindow();const off=w&&offered(0,ct);if(off)duelActivateResponseV2(0,'sz',0);drive();
  return {off, negated: z(ir)==='grave' && !(gameState.players[0].temporaryFlags||{}).noAttackDeclareS03}; }

/* ===== A: オーロラ・アンギラス — neither player can special summon; another monster Normal Summoned destroys it ===== */
fresh();
let ag=mk('オーロラ・アンギラス',1,'up'),wt=mk('ワイト',0);gameState.players[1].mz=[ag];gameState.players[0].hand=[wt];baselineA();
ok('A: both players are locked',!!ssr(0,'ワイト')&&!!ssr(1,'ワイト'));
doNormalSummon(0,'atk');drive();
ok('A: ワイト Normal Summoned → アンギラス destroyed',z(wt)==='mz'&&z(ag)==='grave');
audit('A');

/* ===== B: サボウ・クローザー — while another face-up Plant is on the field, neither player can special summon ===== */
fresh();
let sb=mk('サボウ・クローザー',0,'up');gameState.players[0].mz=[sb];gameState.players[1].mz=[mk('E・HERO クノスペ',1,'up')];baselineA();
ok('B: with the opponent\'s face-up Plant — both locked',!!ssr(0,'ワイト')&&!!ssr(1,'ワイト'));
fresh();
sb=mk('サボウ・クローザー',0,'up');gameState.players[0].mz=[sb];baselineA();
ok('B2: no other Plant — not locked; itself cannot be special summoned',ssr(0,'ワイト')===''&&(function(){const g=mk('サボウ・クローザー',0);gameState.players[0].grave=[g];return canEffectSpecialSummonS03(g,'grave','死者蘇生')===false;})());

/* ===== C / D / E: attack-target restrictions ===== */
fresh();
let gd=mk('ゴーレム・ドラゴン',0,'up'),be=mk('青眼の白龍',0,'up');wt=mk('ワイト',0,'up');gameState.players[0].mz=[gd,be,wt];baselineA();
ok('C: ゴーレム・ドラゴン — the other face-up Dragon protected; itself and ワイト not',forb(1,be)&&!forb(1,gd)&&!forb(1,wt));
fresh();
let dr=mk('デコイロイド',0,'up');wt=mk('ワイト',0,'up');let fd=mk('ワイト',0,'down','def');gameState.players[0].mz=[dr,wt,fd];baselineA();
ok('D: デコイロイド — the other face-up monster protected; デコイロイド and the face-down one not',forb(1,wt)&&!forb(1,dr)&&!forb(1,fd));
fresh();
let qg=mk('女王親衛隊',0,'up'),qn=mk('魅惑の女王 LV3',0,'up');wt=mk('ワイト',0,'up');gameState.players[0].mz=[qg,qn,wt];baselineA();
ok('E: 女王親衛隊 — 魅惑の女王 LV3 protected; ワイト not',forb(1,qn)&&!forb(1,wt));
fresh();
qg=mk('女王親衛隊',0,'up');qn=mk('魅惑の女王 LV3',0,'up');let at=mk('青眼の白龍',1,'up');gameState.players[0].mz=[qg,qn];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:1});drive();
ok('E: the attack on 魅惑の女王 is refused',z(qn)==='mz');

/* ===== F – J: Counter Traps with a field condition (the opponent's 威嚇する咆哮) ===== */
fresh();
let jf=mk('共同戦線',0,'down');jf.setTurn=4;gameState.players[0].sz=[jf];gameState.players[0].mz=[mk('セイバーザウルス',0,'up'),mk('ワーム・ゼクス',0,'up')];
let r=roarAnswered(jf);
ok('F: 共同戦線 (two Level 4) — offered, 威嚇する咆哮 negated',r.off&&r.negated,JSON.stringify(r));
audit('F');
fresh();
jf=mk('共同戦線',0,'down');jf.setTurn=4;gameState.players[0].sz=[jf];gameState.players[0].mz=[mk('セイバーザウルス',0,'up'),mk('ワイト',0,'up')];
r=roarAnswered(jf);
ok('F2: different Levels — not offered',!r.off);
fresh();
let kk=mk('借カラクリ整備蔵',0,'down');kk.setTurn=4;gameState.players[0].sz=[kk];gameState.players[0].mz=[mk('カラクリ兵 弐参六',0,'up','def')];
r=roarAnswered(kk);
ok('G: 借カラクリ整備蔵 (a face-up Defense 「カラクリ」) — negated',r.off&&r.negated);
fresh();
kk=mk('借カラクリ整備蔵',0,'down');kk.setTurn=4;gameState.players[0].sz=[kk];gameState.players[0].mz=[mk('カラクリ兵 弐参六',0,'up','atk')];
r=roarAnswered(kk);
ok('G2: the 「カラクリ」 in Attack Position — not offered',!r.off);
fresh();
let eb=mk('地縛波',0,'down');eb.setTurn=4;gameState.players[0].sz=[eb];gameState.players[0].field=mk('天空の聖域',0,'up');gameState.players[0].mz=[mk('地縛神 Ccapac Apu',0,'up')];
r=roarAnswered(eb);
ok('H: 地縛波 (a 「地縛神」) — negated',r.off&&r.negated,JSON.stringify(r));
fresh();
let fw=mk('フェザー・ウィンド',0,'down');fw.setTurn=4;gameState.players[0].sz=[fw];gameState.players[0].mz=[mk('E・HERO フェザーマン',0,'up')];
r=roarAnswered(fw);
ok('I: フェザー・ウィンド (face-up フェザーマン) — negated',r.off&&r.negated);
fresh();
fw=mk('フェザー・ウィンド',0,'down');fw.setTurn=4;gameState.players[0].sz=[fw];gameState.players[0].mz=[mk('E・HERO フェザーマン',0,'down','def')];
r=roarAnswered(fw);
ok('I2: フェザーマン face-down — not offered',!r.off);
fresh();
let bc=mk('バスター・カウンター',0,'down');bc.setTurn=4;gameState.players[0].sz=[bc];gameState.players[0].mz=[mk('スターダスト・ドラゴン／バスター',0,'up')];
r=roarAnswered(bc);
ok('J: バスター・カウンター (a 「／バスター」) — negated',r.off&&r.negated);
audit('J');
fresh();
bc=mk('バスター・カウンター',0,'down');bc.setTurn=4;gameState.players[0].sz=[bc];gameState.players[0].mz=[mk('スターダスト・ドラゴン',0,'up')];
r=roarAnswered(bc);
ok('J2: no 「／バスター」 — not offered',!r.off);
`);
