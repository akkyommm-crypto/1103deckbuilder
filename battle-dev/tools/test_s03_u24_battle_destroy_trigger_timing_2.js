/* S03-U24 BATTLE_DESTROY_TRIGGER_TIMING (2): C-S03-20 extension
   Requirement: battle-destruction effects whose condition reads the GY — the monster destroyed in battle and sent there, or a GY
   resource — are offered at damage step ⑤, after the destroyed monster has been sent to the GY, and resolve as their text says.
   Before the fix: eight more scripts declared dsTiming 'after' (④) with such a condition, so they were never offered in a real duel:
   ハイドロ・ジェネクス, ブレイン・クラッシャー, レプティレス・スキュラ, スパイダー・スパイダー, ダーク・パーシアス (monsters) and
   ブロッサム・ボンバー, カース・サイキック, 時の機械－タイム・マシーン (set traps).
   Found by the scan after S03-U23; each was measured on the real path as scripted and with dsTiming 'leave'.
   Every card named here is TESTED or GENERIC_OK. */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;}
let TRAP=null, TRAP_OFFERED=false;
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(EVT_V2_STATE)return 'evt';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){
    /* if P1's set trap is listed as a chain response here, activate it (these traps are in fact offered as damage-step trigger events, taken by settle()) */
    if(TRAP&&!TRAP_OFFERED){const hit=getChainResponsesV2(0).find(x=>x.db.n===TRAP);
      if(hit){TRAP_OFFERED=true;duelActivateResponseV2(0,'sz',gameState.players[0].sz.findIndex(c=>nm(c)===TRAP));continue;}}
    pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
let SEEN=[];
function settle(){for(let k=0;k<30;k++){const r=drive();if(r==='evt'){EVT_V2_STATE.groups.flat().forEach(c=>SEEN.push(c.name));const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank];if(g&&g.length)eventPickV2(0);else eventSkipGroupV2();continue;}if(r==='choice'){__choicePickV49(0);continue;}return r;}return 'loop';}
function zoneOf(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,300));return pkg;}
function chained(pkg,name){return pkg.actions.map(x=>x&&x.action).some(x=>x&&x.type==='CHAIN_ADD'&&x.name===name);}
/* the set trap was activated: from the chain-response list, or (as the engine offers these) as a damage-step trigger event */
function trapActivated(){const pkg=v41ReplayPackage(gameState);return !!TRAP&&(TRAP_OFFERED||SEEN.includes(TRAP)||chained(pkg,TRAP));}
function setTrap(n){const t=mk(n,0,'down');t.setTurn=gameState.turn-1;return t;}
/* build() runs after the reset; the attacker attacks the other player's first monster. */
function battle(attacker,build,trap){fresh();SEEN=[];TRAP=trap||null;TRAP_OFFERED=false;const b=build();gameState.activePlayer=attacker;gameState.phase='battle';baselineA();
  b.lp=[gameState.players[0].lp,gameState.players[1].lp];
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:attacker,atkIdx:0,target:0});settle();
  b.delta=[gameState.players[0].lp-b.lp[0],gameState.players[1].lp-b.lp[1]];return b;}
function mzNames(p){return gameState.players[p].mz.map(nm);}

/* ===== ハイドロ・ジェネクス: gains LP equal to the destroyed monster's ATK ===== */
let B=battle(0,()=>{const hg=mk('ハイドロ・ジェネクス',0),w=mk('ワイト',1);gameState.players[0].mz=[hg];gameState.players[1].mz=[w];return {hg,w};});
let pkg=audit('ハイドロ・ジェネクス');
ok('ハイドロ・ジェネクス destroys ワイト and sends it to the GY: its trigger is chained and P1 gains 300',zoneOf(B.w)==='grave'&&chained(pkg,'ハイドロ・ジェネクス')&&B.delta[0]===300,JSON.stringify({delta:B.delta,seen:SEEN}));

/* ===== ブレイン・クラッシャー: schedules the Special Summon of the destroyed monster at the End Phase ===== */
B=battle(0,()=>{const bc=mk('ブレイン・クラッシャー',0),w=mk('ワイト',1);gameState.players[0].mz=[bc];gameState.players[1].mz=[w];return {bc,w};});
audit('ブレイン・クラッシャー');
ok('ブレイン・クラッシャー destroys ワイト: its effect is offered and schedules the End Phase Special Summon',zoneOf(B.w)==='grave'&&SEEN.includes('ブレイン・クラッシャー')&&(gameState.scheduledV7||[]).length===1,JSON.stringify({sched:gameState.scheduledV7,seen:SEEN}));

/* ===== レプティレス・スキュラ: Special Summons the destroyed ATK-0 monster in face-up Defense Position ===== */
B=battle(0,()=>{const rs=mk('レプティレス・スキュラ',0),rocket=mk('ワンショット・ロケット',1);gameState.players[0].mz=[rs];gameState.players[1].mz=[rocket];return {rs,rocket};});
audit('レプティレス・スキュラ');
ok('レプティレス・スキュラ destroys the ATK-0 ワンショット・ロケット: it is Special Summoned to P1’s field in face-up Defense Position',
  zoneOf(B.rocket)==='mz'&&gameState.players[0].mz.includes(B.rocket)&&B.rocket.face==='up'&&B.rocket.pos==='def',JSON.stringify({mz:[mzNames(0),mzNames(1)],pos:B.rocket.pos,seen:SEEN}));

/* ===== スパイダー・スパイダー: destroys a Defense Position monster → Special Summons a Level 4 or lower insect from its GY ===== */
B=battle(0,()=>{const sp=mk('スパイダー・スパイダー',0),w=mk('ワイト',1,'up','def'),mino=mk('電磁ミノ虫',0);gameState.players[0].mz=[sp];gameState.players[1].mz=[w];gameState.players[0].grave=[mino];return {sp,w,mino};});
audit('スパイダー・スパイダー');
ok('スパイダー・スパイダー destroys the Defense Position ワイト: it Special Summons 電磁ミノ虫 from its GY',zoneOf(B.w)==='grave'&&zoneOf(B.mino)==='mz',JSON.stringify({mz:mzNames(0),seen:SEEN}));

/* ===== ダーク・パーシアス: banish a DARK monster from its GY → draw 1 ===== */
B=battle(0,()=>{const dp=mk('ダーク・パーシアス',0),w=mk('ワイト',1),gw=mk('ワイト',0);gameState.players[0].mz=[dp];gameState.players[1].mz=[w];gameState.players[0].grave=[gw];gameState.players[0].deck=[mk('ワイト',0,'down'),mk('ワイト',0,'down')];return {dp,w,gw};});
audit('ダーク・パーシアス');
ok('ダーク・パーシアス destroys ワイト: it banishes the DARK ワイト from its GY and draws 1',zoneOf(B.w)==='grave'&&zoneOf(B.gw)==='banish'&&gameState.players[0].hand.length===1&&gameState.players[0].deck.length===1,JSON.stringify({gw:zoneOf(B.gw),hand:gameState.players[0].hand.length,seen:SEEN}));

/* ===== ブロッサム・ボンバー (set trap): P1's plant destroys a monster → damage equal to its ATK... of the destroyed monster ===== */
B=battle(0,()=>{const plant=mk('ジェリービーンズマン',0),w=mk('ワイト',1);gameState.players[0].mz=[plant];gameState.players[1].mz=[w];gameState.players[0].sz=[setTrap('ブロッサム・ボンバー')];return {plant,w};},'ブロッサム・ボンバー');
pkg=audit('ブロッサム・ボンバー');
ok('ブロッサム・ボンバー: after the plant ジェリービーンズマン destroys ワイト, P1 activates it; P2 takes 1450 battle damage plus the destroyed ワイト’s ATK (300): 1750',
  trapActivated()&&chained(pkg,'ブロッサム・ボンバー')&&zoneOf(B.w)==='grave'&&B.delta[1]===-1750&&gameState.players[0].grave.some(c=>nm(c)==='ブロッサム・ボンバー'),
  JSON.stringify({offered:trapActivated(),delta:B.delta,g0:gameState.players[0].grave.map(nm)}));

/* ===== カース・サイキック (set trap): P1's Psychic destroyed by an attack → destroy the attacker, damage = Level × 300 ===== */
B=battle(1,()=>{const wolf=mk('ジェネティック・ワーウルフ',1),kreb=mk('クレボンス',0);gameState.players[1].mz=[wolf];gameState.players[0].mz=[kreb];gameState.players[0].sz=[setTrap('カース・サイキック')];return {wolf,kreb};},'カース・サイキック');
audit('カース・サイキック');
ok('カース・サイキック: ジェネティック・ワーウルフ destroys P1’s クレボンス (Level 2); P1 activates it, the attacker is destroyed and P2 takes 600',
  trapActivated()&&zoneOf(B.kreb)==='grave'&&zoneOf(B.wolf)==='grave'&&B.delta[1]===-600,JSON.stringify({offered:trapActivated(),delta:B.delta,wolf:zoneOf(B.wolf)}));

/* ===== 時の機械－タイム・マシーン (set trap): a monster destroyed by battle returns in the same position ===== */
B=battle(1,()=>{const wolf=mk('ジェネティック・ワーウルフ',1),w=mk('ワイト',0);gameState.players[1].mz=[wolf];gameState.players[0].mz=[w];gameState.players[0].sz=[setTrap('時の機械－タイム・マシーン')];return {wolf,w};},'時の機械－タイム・マシーン');
audit('時の機械－タイム・マシーン');
ok('時の機械－タイム・マシーン: ワイト destroyed by ジェネティック・ワーウルフ returns to P1’s field in Attack Position',
  trapActivated()&&zoneOf(B.w)==='mz'&&gameState.players[0].mz.includes(B.w)&&B.w.pos==='atk'&&B.delta[0]===-1700,JSON.stringify({offered:trapActivated(),w:zoneOf(B.w),pos:B.w.pos,delta:B.delta}));

/* ===== control: a damage-step trigger declared at ④ that does not need the GY keeps working ===== */
B=battle(0,()=>{const dbd=mk('ダークブレイズドラゴン',0),w=mk('ワイト',1);gameState.players[0].mz=[dbd];gameState.players[1].mz=[w];return {dbd,w};});
audit('control ダークブレイズドラゴン');
ok('control: ダークブレイズドラゴン destroys ワイト: 900 battle damage + 300 (the destroyed monster’s original ATK)',zoneOf(B.w)==='grave'&&B.delta[1]===-1200,JSON.stringify({delta:B.delta}));
`);
