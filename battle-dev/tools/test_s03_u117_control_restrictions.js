/* S03-U117: "攻撃宣言できず、リリースできない" is 精神操作's own restriction, not a property of every temporary control
   change. Measured on U116: FX_CONTROL(until:'endPhase') set cannotAttack + cannotTribute for 心変わり, 洗脳－ブレインコントロール,
   X・E・N・O (whose text even grants a direct attack), シンクロ・コントロール, etc. Real DUEL path, Replay-audited. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function ctl(c){const h=findCardByUid(c.uid);return h?h.p:null;}
function names(p,zn){return (gameState.players[p][zn]||[]).map(nm);}
function pc(){return pendingChoiceV49(gameState);}
let PREFER=[];
function drive(){for(let i=0;i<400;i++){
  if(pc()){const q=pc();let j=-1;for(const u of PREFER){j=q.candidates.findIndex(x=>x.uid===u);if(j>=0)break;}__choicePickV49(j>=0?j:0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
/* P0 activates spell <n> from the hand targeting <foe> (on P1's field) */
function take(n,foeName,extraHand){
  resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
  const foe=mk(foeName,1,'up');
  gameState.players[0].hand=[mk(n,0)].concat((extraHand||[]).map(x=>mk(x,0)));gameState.players[1].mz=[foe];
  baselineA();
  PREFER=[ensureCardUid(gameState,foe)];
  duelActivateFromHand(0);drive();PREFER=[];
  return foe;
}
function toBattle(){doPhase('battle');drive();}
`;

/* ===== A. 心変わり: the taken monster can attack and can be Tributed ===== */
harness(COMMON+String.raw`
let foe=take('心変わり','ジェネティック・ワーウルフ');
ok('A 心変わり: control taken',ctl(foe)===0&&z(foe)==='mz',JSON.stringify({ctl:ctl(foe),z:z(foe)}));
ok('A 心変わり: no attack / tribute restriction',!foe.cannotAttack&&!foe.cannotTribute&&canDeclareAttackV48(foe),JSON.stringify({a:foe.cannotAttack,t:foe.cannotTribute}));
ok('A 心変わり: the taken monster is a Tribute candidate',tributeCandidates(0).some(x=>x.card===foe));
audit('A');
/* Tribute Summon with it (real summon path) */
foe=take('心変わり','ジェネティック・ワーウルフ',['ホルスの黒炎竜 LV6']);
PREFER=[ensureCardUid(gameState,foe)];
doNormalSummon(gameState.players[0].hand.findIndex(c=>nm(c)==='ホルスの黒炎竜 LV6'),'atk');drive();PREFER=[];
ok('A 心変わり: Tribute Summon using the taken monster → it goes to its owner\'s GY',names(0,'mz').includes('ホルスの黒炎竜 LV6')&&z(foe)==='grave'&&findCardByUid(foe.uid).p===1,JSON.stringify({mz:names(0,'mz'),foe:z(foe)}));
audit('A tribute');
/* attack with it */
foe=take('心変わり','ジェネティック・ワーウルフ');toBattle();
const lp=gameState.players[1].lp;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(foe),target:'direct'});drive();
ok('A 心変わり: it attacks directly (2000 damage)',gameState.players[1].lp===lp-2000,JSON.stringify({lp:gameState.players[1].lp,log:gameState.log.slice(-3).map(String)}));
audit('A attack');
for(let i=0;i<6&&!(ctl(foe)===1);i++){ doPhaseNext(); drive(); }
ok('A 心変わり: returned to its owner at the End Phase',ctl(foe)===1&&z(foe)==='mz',JSON.stringify({ctl:ctl(foe),phase:gameState.phase}));
audit('A return');
`);

/* ===== B. 洗脳－ブレインコントロール / X・E・N・O-granted direct attack ===== */
harness(COMMON+String.raw`
let foe=take('洗脳－ブレインコントロール','ジェネティック・ワーウルフ');
ok('B 洗脳: control taken, 800 LP paid, no restriction, 洗脳 in the GY',ctl(foe)===0&&gameState.players[0].lp===7200&&names(0,'grave').includes('洗脳－ブレインコントロール')&&!foe.cannotAttack&&!foe.cannotTribute,JSON.stringify({ctl:ctl(foe),lp:gameState.players[0].lp,a:foe.cannotAttack,t:foe.cannotTribute}));
audit('B brain');
/* the FX_CONTROL written by API.changeControl carries restrictS03 explicitly */
const fx=v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='FX_CONTROL');
ok('B: the journaled FX_CONTROL records restrictS03 = none',fx.length===1&&fx[0].restrictS03&&fx[0].restrictS03.noAttack===false&&fx[0].restrictS03.noTribute===false,JSON.stringify(fx));
`);

/* ===== C. 精神操作 keeps its own restriction; flags gone after the End Phase return ===== */
harness(COMMON+String.raw`
let foe=take('精神操作','ジェネティック・ワーウルフ');
ok('C 精神操作: control taken with its restriction (cannot declare an attack, cannot be Tributed)',ctl(foe)===0&&foe.cannotAttack===true&&foe.cannotTribute===true&&!canDeclareAttackV48(foe)&&!tributeCandidates(0).some(x=>x.card===foe),JSON.stringify({ctl:ctl(foe),a:foe.cannotAttack,t:foe.cannotTribute}));
const fx=v41ReplayPackage(gameState).actions.map(x=>x&&x.action).filter(a=>a&&a.type==='FX_CONTROL');
ok('C: journaled restrictS03 = {noAttack, noTribute}',fx.length===1&&fx[0].restrictS03&&fx[0].restrictS03.noAttack===true&&fx[0].restrictS03.noTribute===true,JSON.stringify(fx));
audit('C');
/* End Phase → back to P1, restriction removed */
for(let i=0;i<6&&!(ctl(foe)===1);i++){ doPhaseNext(); drive(); }
ok('C 精神操作: returned at the End Phase, flags cleared',ctl(foe)===1&&!foe.cannotAttack&&!foe.cannotTribute,JSON.stringify({ctl:ctl(foe),phase:gameState.phase,turn:gameState.turn,a:foe.cannotAttack}));
audit('C return');
`);

/* ===== D. Replay compatibility: a legacy FX_CONTROL without restrictS03 keeps the old (restricted) meaning ===== */
harness(COMMON+String.raw`
resetA();const foe=mk('ワイト',1,'up');gameState.players[1].mz=[foe];
const g=JSON.parse(JSON.stringify(gameState));
applyAction(g,{type:'FX_CONTROL',player:1,zone:'mz',index:0,toPlayer:0,reason:'旧Journal',until:'endPhase'});
ok('D legacy FX_CONTROL (no restrictS03): both restrictions, as before',g.players[0].mz[0].cannotAttack===true&&g.players[0].mz[0].cannotTribute===true);
const g2=JSON.parse(JSON.stringify(gameState));
applyAction(g2,{type:'FX_CONTROL',player:1,zone:'mz',index:0,toPlayer:0,reason:'心変わり',until:'endPhase',restrictS03:{noAttack:false,noTribute:false}});
ok('D FX_CONTROL with restrictS03 none: no restriction',!g2.players[0].mz[0].cannotAttack&&!g2.players[0].mz[0].cannotTribute);
`);

/* ===== E. X・E・N・O: the monster it takes may attack directly this turn (its text) — the blanket cannotAttack made that impossible ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const xeno=mk('X・E・N・O',0,'down');xeno.pos='def';xeno.setTurn=4;gameState.players[0].mz=[xeno];
const foe=mk('ジェネティック・ワーウルフ',1,'up'),wall=mk('ビッグ・シールド・ガードナー',1,'up');wall.pos='def';gameState.players[1].mz=[foe,wall];
baselineA();
PREFER=[ensureCardUid(gameState,foe)];
doFlipUp(0,'mz',0,'atk');drive();PREFER=[];
ok('E X・E・N・O: Flip → control of the chosen monster taken, no attack restriction',ctl(foe)===0&&!foe.cannotAttack&&canDeclareAttackV48(foe),JSON.stringify({ctl:ctl(foe),a:foe.cannotAttack}));
toBattle();
const lp=gameState.players[1].lp;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:gameState.players[0].mz.indexOf(foe),target:'direct'});drive();
ok('E X・E・N・O: the taken monster attacks directly past ビッグ・シールド・ガードナー (2000 damage)',gameState.players[1].lp===lp-2000,JSON.stringify({lp:gameState.players[1].lp}));
audit('E');
for(let i=0;i<6&&!(ctl(foe)===1);i++){ doPhaseNext(); drive(); }
ok('E X・E・N・O: returned to its owner at the End Phase',ctl(foe)===1&&z(foe)==='mz',JSON.stringify({ctl:ctl(foe),phase:gameState.phase}));
audit('E return');
`);

/* ===== F. The underlying attack bug: a permitted direct attack while the opponent controls monsters always opened a
   battle replay (attackReplayNeededV28 ignored the permission) — no "can attack directly" monster ever got through in DUEL ===== */
harness(COMMON+String.raw`
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
const m=mk('ラージマウス',0,'up');gameState.players[0].mz=[m];const w=mk('ワイト',1,'up');gameState.players[1].mz=[w];
baselineA();toBattle();
const lp=gameState.players[1].lp;

requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('F ラージマウス: attacks directly past ワイト (its 300 ATK as damage), no replay',gameState.players[1].lp===lp-300&&!TOASTS.some(t=>t.includes('リプレイ')),JSON.stringify({lp:gameState.players[1].lp,t:TOASTS}));
audit('F');
/* negative: a monster without the permission cannot declare a direct attack while the opponent has monsters */
resetA();gameState.activePlayer=0;gameState.turn=5;gameState.phase='main1';
gameState.players[0].mz=[mk('ジェネティック・ワーウルフ',0,'up')];gameState.players[1].mz=[mk('ワイト',1,'up')];
baselineA();toBattle();TOASTS.length=0;
requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});drive();
ok('F negative: no permission → the direct attack is refused, no damage',gameState.players[1].lp===8000&&TOASTS.some(t=>t.includes('直接攻撃できません')),JSON.stringify({lp:gameState.players[1].lp,t:TOASTS}));
`);
