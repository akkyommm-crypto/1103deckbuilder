/* S03-U97: 超融合 (Super Polymerization) — priority #7's IMPLEMENTED-tier audit, continuing after U96. A fresh
   cross-reference (script_coverage.py redirected to a scratch path, cross-referenced against all 13
   data/r1_lists/major_decks_v1_*.txt files restricted to status==='IMPLEMENTED') found 9 previously-unnoticed
   qty=3 main-deck candidates that a stale U96 note had incorrectly called "exhausted" — 超融合 is the first
   (hero main deck). Real text (confirmed via Yugipedia, target era 2008-2011, well before the later "negate
   its effects" errata): "Discard 1 card; Fusion Summon 1 Fusion Monster from your Extra Deck, using monsters
   from either field. Neither player can activate cards or effects in response to this card's activation."
   The existing implementation (cards/10_themes_a.js) already correctly implements the discard cost and the
   "either field" material search (superPolyOptions, reusing the proven parseMaterialSpec/findMaterialCombos
   primitives, matching S03-U96's ミラクル・フュージョン finding that self-contained Fusion Summon cards do not
   depend on the still-unimplemented generic Polymerization-from-hand mechanic, S03-U82). But the hard chain
   lock — "neither player can activate cards or effects in response to this card's activation" — was entirely
   missing: no such restriction existed anywhere in condition/cost/selectTargets/resolve, and no generic
   "cannot be responded to" primitive existed anywhere in engine/ (confirmed by grepping the whole engine/
   directory for noResponse/cannotChain/chainBan/chainLock-style names — none existed). Fixed generically:
   engine/1P_activation_response_s03.js gains a CHAIN_RESPONSE_LOCKED_S03 declaration set (declareChainResponse
   LockedS03/chainResponseLockedS03), and engine/30_processor_chain_battle.js's getChainResponsesV2 — the
   single shared function behind both the chain-priority window (openChainPriorityV2) and the quick-effect
   POINT window (pointResponsesV27) — returns no candidates at all while the top of the chain is a declared
   name. This is fully generic (any future card with the same real clause just needs one declaration) and
   self-limiting (only suppresses responses while the locking card is literally on top of the chain; once it
   resolves and leaves the chain, later independent activations are unaffected). 超融合 is declared in
   cards/H5_claude_s03_activation_response.js. Promotes 超融合 IMPLEMENTED->TESTED. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<300;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}return 'loop';}
function chainNames(){return gameState.chain.map(l=>l.name);}
function responses(p){return getChainResponsesV2(p).map(x=>x.db.n);}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,260));}
`;

/* ===== A. Real activation: 超融合 discards a real hand card, really Fusion Summons E・HERO アブソルートZero
   from the real Extra Deck using real materials from BOTH fields ("either field"), and — the actual bug fix
   under test — while 超融合 sits on top of the real chain, NEITHER player has any real chain response
   available (getChainResponsesV2 returns none for either player), even though P1 has a real, otherwise-legal
   マジック・ジャマー (Magic Jammer, negates a Spell Card's activation) set and ready with a real discardable
   hand card for its cost. ===== */
harness(COMMON+String.raw`
fresh();
const sp=mk('超融合',0), fodder=mk('青眼の白龍',0);
gameState.players[0].hand=[sp,fodder];
const hero=mk('E・HERO エアーマン',0,'up');
gameState.players[0].mz=[hero];
const water=mk('アンモ・ナイト',1,'up');
gameState.players[1].mz=[water];
const azero=mk('E・HERO アブソルートZero',0);
gameState.players[0].ex=[azero];
gameState.players[1].sz=[mk('マジック・ジャマー',1,'down')];
gameState.players[1].hand=[mk('死者蘇生',1)];
baselineA();
duelActivateFromHand(0);
while(pendingChoiceV49(gameState)) __choicePickV49(0);
ok('A: 超融合 really joins the real chain (both real materials, one from each real field, satisfy E・HERO アブソルートZero)',
  chainNames().join()==='超融合',JSON.stringify(chainNames()));
ok('A: with 超融合 on top of the real chain, P1 has NO real chain response at all (not even the real, otherwise-legal set マジック・ジャマー)',
  responses(1).length===0,JSON.stringify(responses(1)));
ok('A: P0 likewise has no real chain response while 超融合 is on top',
  responses(0).length===0,JSON.stringify(responses(0)));
/* S03-U124: the Fusion Monster and the materials are now chosen at resolution (they used to be fixed at activation) —
   answer those questions (single option here) and continue. The assertions below are unchanged. */
for(let k=0;k<8;k++){ if(drive()==='choice'){ __choicePickV49(0); continue; } break; }
ok('A: E・HERO アブソルートZero is really Fusion Summoned from the real Extra Deck (regression: material logic unaffected by the chain-lock fix)',
  gameState.players[0].mz.some(c=>nm(c)==='E・HERO アブソルートZero')&&!gameState.players[0].ex.length,
  JSON.stringify({mz:gameState.players[0].mz.map(nm),ex:gameState.players[0].ex.map(nm)}));
ok('A: both real materials (one from each real field) are really sent to the real grave',
  gameState.players[0].grave.some(c=>nm(c)==='E・HERO エアーマン')&&gameState.players[1].grave.some(c=>nm(c)==='アンモ・ナイト'),
  JSON.stringify({p0grave:gameState.players[0].grave.map(nm),p1grave:gameState.players[1].grave.map(nm)}));
ok('A: the real discard cost (青眼の白龍) and 超融合 itself really resolve to the real grave; P1’s real マジック・ジャマー never activated (still set)',
  gameState.players[0].grave.some(c=>nm(c)==='青眼の白龍')&&gameState.players[0].grave.some(c=>nm(c)==='超融合')
  &&!gameState.players[0].hand.length&&gameState.players[1].sz.some(c=>c&&nm(c)==='マジック・ジャマー'&&c.face==='down'),
  JSON.stringify({p0grave:gameState.players[0].grave.map(nm),p1sz:gameState.players[1].sz.map(c=>c&&[nm(c),c.face])}));
ok('A: the real chain is empty after resolution (no leftover chain-lock state)',
  !gameState.chain.length,JSON.stringify(chainNames()));
audit('A');
`);

/* ===== B. Contrast / proof the exclusion is specific to 超融合's own lock: the SAME set マジック・ジャマー IS a
   real legal chain response to an ordinary real opponent Spell activation (サイクロン) that carries no
   chain-lock declaration. ===== */
harness(COMMON+String.raw`
fresh();
gameState.activePlayer=1;
const dummy=mk('強欲な壺',0,'down');
gameState.players[0].sz=[mk('マジック・ジャマー',0,'down'),dummy];
gameState.players[0].hand=[mk('青眼の白龍',0)];
gameState.players[1].hand=[mk('サイクロン',1)];
baselineA();
duelActivateFromHand(0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
ok('B: サイクロン really joins the real chain, targeting the real set 強欲な壺',
  chainNames().join()==='サイクロン',JSON.stringify(chainNames()));
ok('B: unlike 超融合, P0’s real set マジック・ジャマー IS offered as a real chain response to this ordinary real Spell activation',
  responses(0).includes('マジック・ジャマー'),JSON.stringify(responses(0)));
`);

/* ===== C. Negative control: with no real satisfiable material combination for any Fusion Monster in the real
   Extra Deck (materials present on only one field, none on the other, insufficient for E・HERO アブソルート
   Zero's spec), 超融合 is correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();
const sp=mk('超融合',0), fodder=mk('青眼の白龍',0);
gameState.players[0].hand=[sp,fodder];
const hero=mk('E・HERO エアーマン',0,'up');
gameState.players[0].mz=[hero];
const azero=mk('E・HERO アブソルートZero',0);
gameState.players[0].ex=[azero];
baselineA();
ok('C: illegal with no real satisfiable material combination (no WATER monster on either real field)',
  !strictScriptLegalityV2('超融合',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('超融合',0,'hand',0,{})));
`);
