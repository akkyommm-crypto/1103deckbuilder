/* S03-U50 冥府の使者ゴーズ — only when damaged, token / burn from the damage (real-duel illegal step).
   Found by R1 on Astra's fixed lists (【HERO】 vs 1103兎ラギア): it was activated from the hand in Main Phase with no damage taken (7 times in 14 duels),
   and the legacy script took the token's ATK/DEF from a prompt.
   2011 source: yugioh-wiki 《冥府の使者ゴーズ》 age 37 (2011-05-28): a trigger from the hand when you take damage from a card the opponent controls
   while your field has no card; battle damage (only a direct attack leaves your field empty) → a token with ATK/DEF equal to the damage;
   effect damage at chain link 1 → the same damage to the opponent; chain link 2 or later misses the timing.
   Cards named here: 冥府の使者ゴーズ (IMPLEMENTED → TESTED, declared); ファイヤー・ボール (TESTED); ワイト (GENERIC_OK). */
const harness=require('./astra_harness');
harness(String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const x=findCardByUid(c.uid);return x?x.zone:null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;TOASTS.length=0;globalThis.__TAKE=null;}
const SEEN=[];
function settle(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState)){__choicePickV49(0);continue;}
  if(EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];g.forEach(c=>SEEN.push(c.name));
    const k=g.findIndex(c=>c.name===globalThis.__TAKE);if(k>=0)eventPickV2(k);else eventSkipGroupV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;
  if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  return 'idle';}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest including the final one',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
function tokens(p){return gameState.players[p].mz.filter(c=>c&&c.token);}

/* ===== A. no damage: it cannot be activated from the hand (the real-duel illegal step) ===== */
fresh();
{
  const gorz=mk('冥府の使者ゴーズ',0);gameState.players[0].hand=[gorz];
  baselineA();
  const ids=getLegalHandActions(0,0).map(a=>a.id);
  const L=strictScriptLegalityV2('冥府の使者ゴーズ',0,'hand',0,{});
  ok('A: with an empty field and no damage, the hand offers no activation and legality refuses',!ids.includes('handEffect')&&!L.ok,JSON.stringify({ids,L}));
}

/* ===== B. a direct attack → Special Summon from the hand, then a token with ATK/DEF = the battle damage ===== */
fresh();
{
  const wight=mk('ワイト',0);gameState.players[0].mz=[wight];
  const gorz=mk('冥府の使者ゴーズ',1);gameState.players[1].hand=[gorz];
  gameState.phase='battle';gameState.activePlayer=0;
  baselineA();
  globalThis.__TAKE='冥府の使者ゴーズ';
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});
  settle();
  const tk=tokens(1);
  ok('B: player 1 took 300 and 冥府の使者ゴーズ was offered and Special Summoned from the hand',gameState.players[1].lp===7700&&zoneOf(gorz)==='mz',
    JSON.stringify({lp:gameState.players[1].lp,gorz:zoneOf(gorz),seen:SEEN.slice(-6),toasts:TOASTS.slice(-3)}));
  ok('B: a token with ATK/DEF 300 (the battle damage) is Special Summoned',tk.length===1&&curATK(tk[0])===300&&curDEF(tk[0])===300,
    JSON.stringify(tk.map(c=>({n:cardName(c),atk:curATK(c),def:curDEF(c)}))));
  audit('B');
}

/* ===== C. a card on your field: not offered ===== */
fresh();
{
  const wight=mk('ワイト',0);gameState.players[0].mz=[wight];
  const gorz=mk('冥府の使者ゴーズ',1);gameState.players[1].hand=[gorz];
  const fb=mk('ファイヤー・ボール',1,'down');fb.setTurn=4;gameState.players[1].sz=[fb];
  gameState.phase='battle';gameState.activePlayer=0;
  baselineA();
  SEEN.length=0;globalThis.__TAKE='冥府の使者ゴーズ';
  requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:0,target:'direct'});
  settle();
  ok('C: with a set card on player 1\'s field, 冥府の使者ゴーズ is not offered and stays in the hand',!SEEN.includes('冥府の使者ゴーズ')&&zoneOf(gorz)==='hand'&&gameState.players[1].lp===7700,
    JSON.stringify({seen:SEEN,gorz:zoneOf(gorz),lp:gameState.players[1].lp}));
}

/* ===== D. effect damage from the opponent at chain link 1 → Special Summon, then the same damage to the opponent ===== */
fresh();
{
  const fb=mk('ファイヤー・ボール',0);gameState.players[0].hand=[fb];
  const gorz=mk('冥府の使者ゴーズ',1);gameState.players[1].hand=[gorz];
  baselineA();
  SEEN.length=0;globalThis.__TAKE='冥府の使者ゴーズ';
  duelActivateFromHand(0);
  settle();
  const lpAct=(v41ReplayPackage(gameState).actions||[]).map(x=>x&&x.action).filter(a=>a&&a.type==='LP'&&a.player===1);
  ok('D: the effect-damage LP action records the source player, card and chain link 1',lpAct.some(a=>a.byPlayer===0&&a.sourceUid===fb.uid&&a.chainLinkOneS03===true),JSON.stringify(lpAct));
  ok('D: player 1 took 500; 冥府の使者ゴーズ was Special Summoned; player 0 took the same 500 back',gameState.players[1].lp===7500&&zoneOf(gorz)==='mz'&&gameState.players[0].lp===7500&&tokens(1).length===0,
    JSON.stringify({lp:[gameState.players[0].lp,gameState.players[1].lp],gorz:zoneOf(gorz),seen:SEEN.slice(-6)}));
  audit('D');
}

/* ===== E. its own burn does not re-trigger a second copy in the controller's hand (the opponent's own damage is not from the opponent) ===== */
fresh();
{
  const fb=mk('ファイヤー・ボール',1);gameState.players[1].hand=[fb];gameState.activePlayer=1;
  const gorz=mk('冥府の使者ゴーズ',1);gameState.players[1].hand.push(gorz);
  baselineA();
  SEEN.length=0;globalThis.__TAKE='冥府の使者ゴーズ';
  duelActivateFromHand(0);
  settle();
  ok('E: damage player 1 deals to player 0 does not offer player 1\'s own 冥府の使者ゴーズ',!SEEN.includes('冥府の使者ゴーズ')&&zoneOf(gorz)==='hand'&&gameState.players[0].lp===7500,
    JSON.stringify({seen:SEEN,gorz:zoneOf(gorz),lp:[gameState.players[0].lp,gameState.players[1].lp]}));
}
`);
