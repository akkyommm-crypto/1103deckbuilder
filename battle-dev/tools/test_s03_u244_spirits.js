/* S03-U244: スピリットモンスター — 不死之炎鳥, 偉大天狗, 八俣大蛇, 八汰烏, 火之迦具土, 軍荼利, 雷帝神. Engine: flippedTurnS03, draw-phase skip / discard flags.
   Real DUEL paths, Replay-audited. Other cards named here are TESTED / GENERIC_OK. */
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
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function lp(p){return gameState.players[p].lp;}
function turn(){requestProcessorV27(PROCESSOR_V27.TURN);drive();}
function hand(p){return gameState.players[p].hand.length;}

/* ===== A: Normal Summon → its End Phase: back to the owner's hand; no chain link at the summon ===== */
fresh();
let yt=mk('八汰烏',0);gameState.players[0].hand=[yt];baselineA();
doNormalSummon(0,'atk');drive();
const trigA=TRIG.slice();
ok('A: summoned; no trigger at the summon',z(yt)==='mz'&&trigA.length===0,JSON.stringify({yt:z(yt),trigA}));
phase('end');
ok('A: its End Phase → back to the hand',z(yt)==='hand',JSON.stringify({yt:z(yt),TRIG}));
audit('A');

/* ===== A2: flipped face-up by an attack in the opponent's turn → that turn's End Phase: back to the hand ===== */
fresh();
let fs=mk('雷帝神',0,'down','def'),at=mk('青眼の白龍',1,'up');
gameState.players[0].mz=[fs];gameState.players[1].mz=[at];gameState.activePlayer=1;gameState.phase='battle';baselineA();
let ra=mk('軍荼利',1,'up');
ok('A2: the face-down card has no summon / flip turn',C(fs).summonedTurn==null&&C(fs).flippedTurnS03==null);
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A2: flipped by the attack (DEF 1600 < 3000 → destroyed)',z(fs)==='grave');
fresh();
fs=mk('雷帝神',0,'down','def');let we=mk('ワイト',1,'up');
gameState.players[0].mz=[fs];gameState.players[1].mz=[we];gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('A2: flipped by ワイト\'s attack and survives (face-up, flippedTurnS03 = this turn)',z(fs)==='mz'&&C(fs).face==='up'&&C(fs).flippedTurnS03===gameState.turn,JSON.stringify({fs:z(fs),face:C(fs).face,ft:C(fs).flippedTurnS03}));
phase('main2');phase('end');
ok('A2: the opponent\'s End Phase (the turn it was flipped) → back to its owner\'s hand',z(fs)==='hand',JSON.stringify({fs:z(fs)}));
audit('A2');

/* ===== A3: cannot be special summoned (死者蘇生 cannot choose it) ===== */
fresh();
let gs1=mk('偉大天狗',0),rv=mk('死者蘇生',0);gameState.players[0].grave=[gs1];gameState.players[0].hand=[rv];baselineA();
const lgA3=strictScriptLegalityV2('死者蘇生',0,'hand',0,{});
ok('A3: 死者蘇生 cannot be activated with only a Spirit in the GY',lgA3.ok===false&&!canEffectSpecialSummonS03(C(gs1),'grave','死者蘇生'),JSON.stringify(lgA3));

/* ===== B: 八汰烏 — battle damage → the opponent's next Draw Phase is skipped ===== */
fresh();
yt=mk('八汰烏',0,'up');yt.summonedTurn=5;gameState.players[0].mz=[yt];gameState.phase='battle';
for(let i=0;i<4;i++)gameState.players[1].deck.push(mk('ワイト',1));baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('B: 200 battle damage',lp(1)===7800);
phase('main2');phase('end');
const hB=hand(1);turn();requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
ok('B: the opponent\'s Draw Phase skipped — the normal draw is not made',gameState.activePlayer===1&&hand(1)===hB&&gameState.drawnThisTurn===true,JSON.stringify({hB,h:hand(1)}));
audit('B');

/* ===== B0 (control): without 八汰烏 the opponent's normal draw is made ===== */
fresh();
gameState.phase='main2';for(let i=0;i<4;i++)gameState.players[1].deck.push(mk('ワイト',1));baselineA();
phase('end');turn();requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
ok('B0: control — the normal draw adds 1 card',hand(1)===1,JSON.stringify({h:hand(1)}));

/* ===== C: 偉大天狗 — battle damage → the opponent's next Battle Phase is skipped ===== */
fresh();
let tg=mk('偉大天狗',0,'up');tg.summonedTurn=5;gameState.players[0].mz=[tg];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
phase('main2');phase('end');turn();phase('standby');phase('main1');phase('battle');
ok('C: 1900 damage; the opponent cannot enter its next Battle Phase',lp(1)===6100&&gameState.activePlayer===1&&gameState.phase!=='battle',JSON.stringify({lp1:lp(1),ph:gameState.phase}));
audit('C');

/* ===== D: 八俣大蛇 — battle damage → draw until 5 cards ===== */
fresh();
let ym=mk('八俣大蛇',0,'up');ym.summonedTurn=5;gameState.players[0].mz=[ym];gameState.players[0].hand=[mk('ワイト',0)];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('D: 2600 damage; hand 1 → 5',lp(1)===5400&&hand(0)===5,JSON.stringify({lp1:lp(1),h:hand(0)}));
audit('D');

/* ===== E: 不死之炎鳥 — battle damage → recover the same amount ===== */
fresh();
let fb=mk('不死之炎鳥',0,'up');fb.summonedTurn=5;gameState.players[0].mz=[fb];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('E: 1200 damage → its controller +1200',lp(1)===6800&&lp(0)===9200,JSON.stringify({lp0:lp(0),lp1:lp(1)}));
audit('E');

/* ===== F: 火之迦具土 — battle damage → at the next turn's Draw Phase, before the draw, the opponent discards its whole hand ===== */
fresh();
let kg=mk('火之迦具土',0,'up');kg.summonedTurn=5;gameState.players[0].mz=[kg];gameState.players[1].hand=[mk('ワイト',1),mk('ワイト',1)];gameState.phase='battle';
for(let i=0;i<3;i++)gameState.players[1].deck.push(mk('ワイト',1));baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
phase('main2');phase('end');turn();requestProcessorV27(PROCESSOR_V27.DRAW,{player:1});drive();
ok('F: 2800 damage; the opponent\'s 2 hand cards discarded before its draw → hand = the 1 drawn card',lp(1)===5200&&hand(1)===1&&gameState.players[1].grave.length===2,JSON.stringify({lp1:lp(1),h:hand(1),g:gameState.players[1].grave.length}));
audit('F');

/* ===== G: 軍荼利 — battling a Synchro Monster: no damage calculation; both back to their owners' hands ===== */
fresh();
let gd=mk('軍荼利',0,'up');gd.summonedTurn=5;let sy=mk('大地の騎士ガイアナイト',1,'up');
gameState.players[0].mz=[gd];gameState.players[1].mz=[sy];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});drive();
ok('G: attacking ガイアナイト (Synchro) — both returned, no damage',z(gd)==='hand'&&z(sy)==='ex'||z(sy)==='hand',JSON.stringify({gd:z(gd),sy:z(sy),lp0:lp(0),lp1:lp(1)}));
ok('G: no battle damage',lp(0)===8000&&lp(1)===8000);
audit('G');

/* ===== H: 雷帝神 — the battle damage it deals is halved ===== */
fresh();
let rt=mk('雷帝神',0,'up');rt.summonedTurn=5;gameState.players[0].mz=[rt];gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('H: direct attack 2000 → 1000',lp(1)===7000,JSON.stringify({lp1:lp(1)}));
audit('H');
`);
