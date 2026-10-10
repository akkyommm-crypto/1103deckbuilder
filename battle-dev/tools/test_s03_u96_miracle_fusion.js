/* S03-U96: ミラクル・フュージョン (Miracle Fusion) — priority #7's IMPLEMENTED-tier audit picked this up
   next after S03-U94/U95 (qty=3, hero main deck). Real text (confirmed via Yugipedia): "Fusion Summon 1
   'Elemental HERO' Fusion Monster from your Extra Deck, by banishing Fusion Materials mentioned on it from
   your field or GY." Already correctly implemented (cards/30_themes_b.js) as a self-contained real Fusion
   Summon (no dependency on the still-unimplemented generic Polymerization-from-hand mechanic, per the
   S03-U82 finding — this card reuses the same parseMaterialSpec/findMaterialCombos primitives already
   proven by Synchro/Xyz material matching), banishing the real matched materials from the real field/GY and
   really Special Summoning the chosen "E・HERO" Fusion Monster from the real Extra Deck. This unit only
   adds the missing dedicated real-DUEL-path test, promoting it to TESTED. No code change to the card
   itself. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';}
function drive(){for(let i=0;i<600;i++){
  if(pendingChoiceV49(gameState))return 'choice';
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';}
  return 'loop';}
function zoneOf(uid){const h=findCardByUid(uid);return h?h.zone:null;}
function pickByName(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
`;

/* ===== A. Real activation: real materials (1 real HERO-named monster on the field, 1 real WATER monster in
   the Graveyard) satisfy E・HERO アブソルートZero's real material spec; both are really banished, and the
   real Fusion Monster is really Special Summoned from the real Extra Deck. ===== */
harness(COMMON+String.raw`
fresh();
const mf=mk('ミラクル・フュージョン',0);
gameState.players[0].hand=[mf];
const hero=mk('E・HERO エアーマン',0,'up');
gameState.players[0].mz=[hero];
const water=mk('アンモ・ナイト',0);
gameState.players[0].grave=[water];
const azero=mk('E・HERO アブソルートZero',0);
gameState.players[0].ex=[azero];
baselineA();
duelActivateFromZone(0,'hand',0);
if(pendingChoiceV49(gameState)) pickByName('E・HERO アブソルートZero');
/* S03-U126: the Fusion Monster and the materials are now chosen at resolution (they used to be fixed at activation) —
   answer those questions and continue. The assertions below are unchanged. */
for(let k=0;k<8;k++){ if(drive()==='choice'){ const t=(pendingChoiceV49(gameState)||{}).title||''; if(/融合モンスター/.test(t)) pickByName('E・HERO アブソルートZero'); else __choicePickV49(0); continue; } break; }
ok('A: E・HERO アブソルートZero is really Fusion Summoned from the real Extra Deck',
  gameState.players[0].mz.some(c=>nm(c)==='E・HERO アブソルートZero')&&!gameState.players[0].ex.length,
  JSON.stringify({mz:gameState.players[0].mz.map(nm),ex:gameState.players[0].ex.map(nm)}));
ok('A: both real materials (the real HERO-named field monster and the real WATER Graveyard monster) are really banished',
  gameState.players[0].banish.some(c=>nm(c)==='E・HERO エアーマン')&&gameState.players[0].banish.some(c=>nm(c)==='アンモ・ナイト')
  &&!gameState.players[0].mz.some(c=>nm(c)==='E・HERO エアーマン')&&!gameState.players[0].grave.some(c=>nm(c)==='アンモ・ナイト'),
  JSON.stringify({banish:gameState.players[0].banish.map(nm),mz:gameState.players[0].mz.map(nm),grave:gameState.players[0].grave.map(nm)}));
ok('A: ミラクル・フュージョン itself resolves to the real grave',
  gameState.players[0].grave.some(c=>nm(c)==='ミラクル・フュージョン'),JSON.stringify(gameState.players[0].grave.map(nm)));
audit('A');
`);

/* ===== B. Negative control: with no matching material combination available for any "E・HERO" Fusion
   Monster in the real Extra Deck (a HERO-named monster present, but no real WATER monster anywhere), the
   card is correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();
const mf=mk('ミラクル・フュージョン',0);
gameState.players[0].hand=[mf];
const hero=mk('E・HERO エアーマン',0,'up');
gameState.players[0].mz=[hero];
const azero=mk('E・HERO アブソルートZero',0);
gameState.players[0].ex=[azero];
baselineA();
ok('B: illegal with no real material combination available (no WATER monster anywhere)',
  !strictScriptLegalityV2('ミラクル・フュージョン',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('ミラクル・フュージョン',0,'hand',0,{})));
`);

/* ===== C. Negative control: a Fusion Monster in the Extra Deck that is NOT named "E・HERO" (even if it
   happens to have a satisfiable material spec) is correctly excluded from the real candidates. ===== */
harness(COMMON+String.raw`
fresh();
const mf=mk('ミラクル・フュージョン',0);
gameState.players[0].hand=[mf];
const hero=mk('E・HERO エアーマン',0,'up');
const water=mk('アンモ・ナイト',0,'up');
gameState.players[0].mz=[hero,water];
baselineA();
ok('C: illegal when the real Extra Deck has no "E・HERO" Fusion Monster at all',
  !strictScriptLegalityV2('ミラクル・フュージョン',0,'hand',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('ミラクル・フュージョン',0,'hand',0,{})));
`);
