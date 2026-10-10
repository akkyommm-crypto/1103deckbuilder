/* S03-U21 BATTLE_CONTEXT_REPLAY
   Requirement: a battle whose damage calculation depends on the damage-step battle context replays to the same result.
   Continuous effects evaluated inside the ATTACK reducer read gameState.battle: damage-step ATK changes (ダッシュ・ウォリアー
   「攻撃する場合、ダメージステップの間」, エトワール・サイバー 「直接攻撃する場合、ダメージステップの間」, ネコ耳族 「相手ターン時のみ、
   ダメージステップ時」). That context is set outside Actions, so Replay ran ATTACK without it.
   Before the fix: live results were correct, but the Replay audit failed at the ATTACK action (digest mismatch).
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function settle(){for(let k=0;k<16;k++){const r=drive();if(r==='evt'){if(EVT_V2_STATE.rank>=2)eventSkipGroupV2();else eventPickV2(0);continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function attack(p,atkIdx,target){requestProcessorV27(PROCESSOR_V27.ATTACK,{player:p,atkIdx,target});settle();}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
/* build(): called after the reset; returns {mine, theirs, ...named cards} */
function board(active,build){fresh();const b=build();gameState.players[0].mz=b.mine;gameState.players[1].mz=b.theirs;gameState.activePlayer=active;gameState.phase='battle';baselineA();return b;}

/* ===== ダッシュ・ウォリアー attacks ===== */
let B=board(0,()=>{const dash=mk('ダッシュ・ウォリアー',0),wight=mk('ワイト',1);return {mine:[dash],theirs:[wight],dash,wight};});
attack(0,0,0);
ok('ダッシュ・ウォリアー attacks ワイト: ATK 1800 in the damage step, 1500 damage; ワイト is destroyed',zoneOf(B.wight)==='grave'&&gameState.players[1].lp===6500&&curATK(B.dash)===600&&!gameState.battle,JSON.stringify({lp:gameState.players[1].lp,atk:curATK(B.dash),battle:gameState.battle}));
let pkg=audit('ダッシュ・ウォリアー');
const atkActs=pkg.actions.map(x=>x&&(x.action||x)).filter(x=>x&&x.type==='ATTACK');   /* package entries wrap the action: {seq, action, digest, ...} */
ok('the journaled ATTACK carries the damage-calculation battle context',atkActs.length===1&&!!atkActs[0].battleCtxS03&&atkActs[0].battleCtxS03.step==='calc'&&atkActs[0].battleCtxS03.atkUid===B.dash.uid&&atkActs[0].battleCtxS03.targetUid===B.wight.uid,JSON.stringify(atkActs));

/* ===== エトワール・サイバー attacks directly ===== */
B=board(0,()=>({mine:[mk('エトワール・サイバー',0)],theirs:[]}));
attack(0,0,'direct');
ok('エトワール・サイバー attacks directly: 1700 damage',gameState.players[1].lp===6300,JSON.stringify({lp:gameState.players[1].lp}));
audit('エトワール・サイバー');

/* ===== ネコ耳族 is attacked on the opponent's turn ===== */
B=board(1,()=>{const neko=mk('ネコ耳族',0),wolf=mk('ジェネティック・ワーウルフ',1);return {mine:[neko],theirs:[wolf],neko,wolf};});
attack(1,0,0);
ok('ネコ耳族 attacked by ジェネティック・ワーウルフ on the opponent’s turn: the attacker’s original ATK is 200, both are destroyed, no damage',zoneOf(B.neko)==='grave'&&zoneOf(B.wolf)==='grave'&&gameState.players[0].lp===8000&&gameState.players[1].lp===8000,JSON.stringify({neko:zoneOf(B.neko),wolf:zoneOf(B.wolf),lp:[gameState.players[0].lp,gameState.players[1].lp]}));
audit('ネコ耳族');

/* ===== two attacks in one Battle Phase: the context of the first does not leak into the second ===== */
B=board(0,()=>{const dash=mk('ダッシュ・ウォリアー',0),etoile=mk('エトワール・サイバー',0),wight=mk('ワイト',1);return {mine:[dash,etoile],theirs:[wight],wight};});
attack(0,0,0);
attack(0,1,'direct');
ok('two attacks: ダッシュ・ウォリアー 1500 to ワイト’s controller, then エトワール・サイバー 1700 directly',zoneOf(B.wight)==='grave'&&gameState.players[1].lp===8000-1500-1700,JSON.stringify({lp:gameState.players[1].lp}));
audit('two attacks');

/* ===== control: a battle without damage-step context ===== */
board(0,()=>({mine:[mk('ジェネティック・ワーウルフ',0)],theirs:[mk('ワイト',1)]}));
attack(0,0,0);
ok('control: ジェネティック・ワーウルフ attacks ワイト for 1700',gameState.players[1].lp===6300);
audit('control');
`);
