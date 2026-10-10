/* S03-U26 DAMAGE_STEP_END_AFTER_DESTRUCTION
   Requirement: the end of the damage step (⑥ ダメージステップ終了時) still takes place after damage calculation when a monster destroyed
   in the battle has already been sent to the GY (⑤), so 「ダメージステップ終了時」 effects of the monster that attacked apply.
   Before the fix: entering ⑥ re-synchronised the battle and ended the damage step when a combatant was no longer in the Monster Zone —
   always the case after a battle destruction — so 電動刃虫, アックス・ドラゴニュート, スピア・ドラゴン and
   アマゾネスの賢者 never applied their effect after destroying a monster. The pre-calculation rule (a combatant leaving before damage
   calculation ends the battle) is unchanged.
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
let SEEN=[];
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
/* P1 attacks P2's first monster; build() runs after the reset. */
function battle(build){fresh();SEEN=[];const b=build();gameState.activePlayer=0;gameState.phase='battle';
  if(!gameState.players[1].deck.length)gameState.players[1].deck=[mk('ワイト',1,'down'),mk('ワイト',1,'down')];
  baselineA();b.hand1=gameState.players[1].hand.length;
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:0});settle();return b;}
function vsWight(name){return ()=>{const m=mk(name,0),w=mk('ワイト',1);gameState.players[0].mz=[m];gameState.players[1].mz=[w];return {m,w};};}

/* ===== 電動刃虫 ===== */
let B=battle(vsWight('電動刃虫'));
audit('電動刃虫');
ok('電動刃虫 destroys ワイト: at the end of the damage step the opponent draws 1',zoneOf(B.w)==='grave'&&SEEN.includes('電動刃虫')&&gameState.players[1].hand.length===B.hand1+1,JSON.stringify({hand1:gameState.players[1].hand.length,seen:SEEN}));

/* ===== アックス・ドラゴニュート / スピア・ドラゴン: Defense Position after attacking =====
   (パワー・ブレイカー has the same text but its script applies the change at the end of the Battle Phase; that is a separate script
    timing item, not part of this engine closure.) */
for(const name of ['アックス・ドラゴニュート','スピア・ドラゴン']){
  B=battle(vsWight(name));
  audit(name);
  ok(name+' destroys ワイト: at the end of the damage step it changes to Defense Position',zoneOf(B.w)==='grave'&&zoneOf(B.m)==='mz'&&B.m.pos==='def',JSON.stringify({pos:B.m.pos,seen:SEEN}));
}

/* ===== アマゾネスの賢者: destroys 1 opponent Spell/Trap after attacking ===== */
B=battle(()=>{const m=mk('アマゾネスの賢者',0),w=mk('ワイト',1),st=mk('サイクロン',1,'down');st.setTurn=gameState.turn-1;gameState.players[0].mz=[m];gameState.players[1].mz=[w];gameState.players[1].sz=[st];return {m,w,st};});
audit('アマゾネスの賢者');
ok('アマゾネスの賢者 destroys ワイト: at the end of the damage step it destroys P2’s set サイクロン',zoneOf(B.w)==='grave'&&zoneOf(B.st)==='grave',JSON.stringify({st:zoneOf(B.st),seen:SEEN}));

/* ===== control: no destruction, defender-side end-of-damage-step effect keeps working ===== */
B=battle(()=>{const a=mk('ワイト',0),g=mk('ゴロゴル',1,'up','def');gameState.players[0].mz=[a];gameState.players[1].mz=[g];return {a,g};});
audit('control ゴロゴル');
ok('control: ワイト attacks the Defense Position ゴロゴル; at the end of the damage step ワイト is turned face-down Defense Position',zoneOf(B.a)==='mz'&&B.a.face==='down'&&B.a.pos==='def',JSON.stringify({face:B.a.face,pos:B.a.pos}));
ok('control: the battle phase continues normally after the damage step (no battle left open)',!gameState.battle&&!gameState.pendingAttack,JSON.stringify({battle:gameState.battle}));
`);
