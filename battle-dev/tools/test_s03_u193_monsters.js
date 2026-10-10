/* S03-U193: monsters — E・HERO バブルマン, コマンド・ナイト, マシュマロン, 王虎ワンフー, チューニング・サポーター, エレクトリック・ワーム (fixed),
   ジャンク・ウォリアー, パペット・プラント, トラップ・イーター (scripts unchanged, now tested). Real DUEL paths, Replay-audited.
   Other cards named here are TESTED / GENERIC_OK. */
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
let PREFER=[],TRIG=[],SEEN=[];
function step(){const q=pc();if(q){SEEN.push(q.title||'');let j=-1,k=-1;for(k=0;k<PREFER.length;k++){const u=PREFER[k];j=q.candidates.findIndex(x=>x.uid===u||x.key===u);if(j>=0)break;}if(j>=0)PREFER.splice(k,1);__choicePickV49(j>=0?j:0);return true;}return false;}
function drive(){for(let i=0;i<600;i++){
  if(step())continue;
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const st=EVT_V2_STATE,g=st.groups[st.rank]||[];if(g.length){TRIG.push(g.map(c=>c.name).join('+'));eventPickV2(0);}else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting; if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function phase(to){requestProcessorV27(PROCESSOR_V27.PHASE,{to});drive();}
function hi(p,c){return gameState.players[p].hand.indexOf(C(c));}

/* ===== A: バブルマン — ① from the hand when it is the only card (a procedure, no chain); ② alone on the field: draw 2 ===== */
fresh();
let bm=mk('E・HERO バブルマン',0);gameState.players[0].hand=[bm];baselineA();TRIG.length=0;
ok('A: ① legal with the hand = this card only',strictSummonProcedureLegality('E・HERO バブルマン',0,'hand',0).ok===true);
finishSummonProcedure('E・HERO バブルマン',0,'hand',0,'atk');drive();
ok('A: special summoned; ② drew 2 (nothing else in the hand / on the field)',z(bm)==='mz'&&gameState.players[0].hand.length===2&&TRIG.some(t=>/バブルマン/.test(t)),JSON.stringify({h:gameState.players[0].hand.length,TRIG}));
audit('A');
fresh();
bm=mk('E・HERO バブルマン',0);gameState.players[0].hand=[bm,mk('ワイト',0)];baselineA();
ok('A2: ① not legal with another card in the hand',strictSummonProcedureLegality('E・HERO バブルマン',0,'hand',0).ok===false);
fresh();
bm=mk('E・HERO バブルマン',0);gameState.players[0].hand=[bm];gameState.players[0].field=mk('ウォーターワールド',0,'up');baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('A3: Normal Summoned with a Field Spell on the field — no draw',z(bm)==='mz'&&gameState.players[0].hand.length===0&&!TRIG.some(t=>/バブルマン/.test(t)),JSON.stringify(TRIG));
audit('A3');
fresh();
bm=mk('E・HERO バブルマン',0,'down','def');bm.setTurn=4;gameState.players[0].mz=[bm];baselineA();TRIG.length=0;
doFlipUp(0,'mz',0,'atk');drive();
ok('A4: Flip Summoned alone — ② drew 2',z(bm)==='mz'&&gameState.players[0].hand.length===2&&TRIG.some(t=>/バブルマン/.test(t)),JSON.stringify({h:gameState.players[0].hand.length,TRIG}));
audit('A4');

/* ===== B: コマンド・ナイト — own Warriors +400 (itself too); not an attack target while another own monster exists ===== */
fresh();
let kn=mk('コマンド・ナイト',0,'up'),cap=mk('切り込み隊長',0,'up'),wt=mk('ワイト',0,'up');gameState.players[0].mz=[kn,cap,wt];baselineA();
ok('B: コマンド・ナイト 1600, 切り込み隊長 1600, ワイト 300',curATK(C(kn))===1600&&curATK(C(cap))===1600&&curATK(C(wt))===300,JSON.stringify([curATK(C(kn)),curATK(C(cap)),curATK(C(wt))]));
ok('B: with other own monsters, the opponent cannot choose it as an attack target',!!attackTargetForbiddenReasonS03(1,C(kn))&&!attackTargetForbiddenReasonS03(1,C(wt)));
fresh();
kn=mk('コマンド・ナイト',0,'up');gameState.players[0].mz=[kn];baselineA();
ok('B2: alone — it can be attacked',!attackTargetForbiddenReasonS03(1,C(kn)));

/* ===== C: マシュマロン — face-down and attacked: not destroyed, the attacker's controller takes 1000; face-up: no 1000 ===== */
fresh();
let mm=mk('マシュマロン',0,'down','def');mm.setTurn=4;let at=mk('ギガンテス',1,'up');gameState.players[0].mz=[mm];gameState.players[1].mz=[at];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C: flipped by the attack, not destroyed; the attacker’s controller 7000',z(mm)==='mz'&&gameState.players[1].lp===7000&&gameState.players[0].lp===8000,JSON.stringify([gameState.players[0].lp,gameState.players[1].lp]));
audit('C');
fresh();
mm=mk('マシュマロン',0,'up','atk');at=mk('ギガンテス',1,'up');gameState.players[0].mz=[mm];gameState.players[1].mz=[at];
gameState.activePlayer=1;gameState.phase='battle';baselineA();
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:1,atkIdx:0,target:0});drive();
ok('C2: face-up when attacked — not destroyed, the controller takes 1600 battle damage, no 1000 to the attacker',z(mm)==='mz'&&gameState.players[1].lp===8000&&gameState.players[0].lp===6400,JSON.stringify([gameState.players[0].lp,gameState.players[1].lp]));
audit('C2');

/* ===== D: 王虎ワンフー — the summoned monster with 1400 or less is destroyed (either side's summon); others stay ===== */
fresh();
let wf=mk('王虎ワンフー',0,'up'),old=mk('ワイト',1,'up'),nw=mk('ワイト',0),big=mk('ブラッド・ヴォルス',0);
gameState.players[0].mz=[wf];gameState.players[1].mz=[old];gameState.players[0].hand=[nw,big];baselineA();SEEN=[];
doNormalSummon(hi(0,nw),'atk');drive();
ok('D: the summoned ワイト destroyed; the opponent’s ワイト already on the field stays',z(nw)==='grave'&&z(old)==='mz'&&z(wf)==='mz');
ok('D: not targeting — no choice of a monster is offered',!SEEN.some(t=>/ワンフー/.test(t)),JSON.stringify(SEEN));
audit('D');
fresh();
wf=mk('王虎ワンフー',0,'up');big=mk('ブラッド・ヴォルス',0);gameState.players[0].mz=[wf];gameState.players[0].hand=[big];baselineA();TRIG.length=0;
doNormalSummon(0,'atk');drive();
ok('D2: ブラッド・ヴォルス (1900) summoned — stays, no trigger',z(big)==='mz'&&!TRIG.some(t=>/ワンフー/.test(t)));
audit('D2');

/* ===== E: ジャンク・ウォリアー with チューニング・サポーター (as Level 2): Synchro Summoned, ATK + own Level 2 or lower; サポーター draws 1 ===== */
fresh();
let jw=mk('ジャンク・ウォリアー',0),js=mk('ジャンク・シンクロン',0,'up'),ts=mk('チューニング・サポーター',0,'up'),wl=mk('ワイト',0,'up');
gameState.players[0].ex=[jw];gameState.players[0].mz=[js,ts,wl];baselineA();
const hE=gameState.players[0].hand.length;
const iJ=gameState.players[0].mz.indexOf(C(js)),iT=gameState.players[0].mz.indexOf(C(ts));
const cb=exCombos(0,dbOf(jw)).combos.find(c=>c.materials.length===2&&c.materials.includes(iJ)&&c.materials.includes(iT));
if(cb)beginExSummonV2(0,0,cb.materials,'synchro','atk');drive();
ok('E: Synchro Summoned with ジャンク・シンクロン (3) + チューニング・サポーター (as 2)',!!cb&&z(jw)==='mz'&&z(js)==='grave'&&z(ts)==='grave');
ok('E: チューニング・サポーター drew 1',gameState.players[0].hand.length===hE+1);
ok('E: ジャンク・ウォリアー 2300 + ワイト 300 = 2600',curATK(C(jw))===2600,String(curATK(C(jw))));
audit('E');

/* ===== F: エレクトリック・ワーム / パペット・プラント — discard, control until the End Phase; ignition (own Main Phase only) ===== */
fresh();
let ew=mk('エレクトリック・ワーム',0),dr=mk('ブラッド・ヴォルス',1,'up'),mach=mk('サイバー・ドラゴン',1,'up');gameState.players[0].hand=[ew];gameState.players[1].mz=[dr,mach];baselineA();
PREFER=[mach.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F: ワーム discarded; サイバー・ドラゴン (Machine) controlled',z(ew)==='grave'&&findCardByUid(mach.uid).p===0);
phase('battle');phase('main2');phase('end');requestProcessorV27(PROCESSOR_V27.TURN,{});drive();
ok('F: returned at the End Phase',findCardByUid(mach.uid).p===1);
audit('F');
fresh();
ew=mk('エレクトリック・ワーム',0);mach=mk('サイバー・ドラゴン',1,'up');gameState.players[0].hand=[ew];gameState.players[1].mz=[mach];gameState.activePlayer=1;baselineA();
ok('F2: ワーム is not activatable in the opponent’s turn (ignition)',strictScriptLegalityV2('エレクトリック・ワーム',0,'hand',0,{}).ok===false);
fresh();
let pp=mk('パペット・プラント',0),wr=mk('切り込み隊長',1,'up');gameState.players[0].hand=[pp];gameState.players[1].mz=[wr];baselineA();
PREFER=[wr.uid];duelActivateFromHand(0);drive();PREFER=[];
ok('F3: パペット・プラント discarded; the Warrior 切り込み隊長 controlled',z(pp)==='grave'&&findCardByUid(wr.uid).p===0);
audit('F3');

/* ===== G: トラップ・イーター — special summoned by sending an opponent face-up Trap to the GY ===== */
fresh();
let te=mk('トラップ・イーター',0),tr=mk('グラヴィティ・バインド－超重力の網－',1,'up');gameState.players[0].hand=[te];gameState.players[1].sz=[tr];baselineA();
ok('G: not Normal Summonable',!getLegalHandActions(0,0).some(a=>a.id==='normalSummon'||a.id==='setMonster'));
ok('G: procedure legal',strictSummonProcedureLegality('トラップ・イーター',0,'hand',0).ok===true);
finishSummonProcedure('トラップ・イーター',0,'hand',0,'atk');drive();
ok('G: the opponent’s trap to the GY; トラップ・イーター special summoned',z(tr)==='grave'&&z(te)==='mz');
audit('G');
`);
