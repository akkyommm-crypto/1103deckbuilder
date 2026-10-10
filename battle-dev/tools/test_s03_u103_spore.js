/* S03-U103: スポーア (Spore) — found via the S03-U102 follow-up investigation into the "custom ctx property
   lost between cost() and resolve()" bug class (flagged as top priority in that unit's report/handoff). A
   precise scan (cost()-body ctx writes intersected with resolve()-body ctx reads, excluding the known
   preserved ctx fields) narrowed ~51 superficially-matching files down to 12 genuine candidates; cross-
   referencing those 12 against all 13 `data/r1_lists/major_decks_v1_*.txt` found exactly one real-duel-
   reachable hit: スポーア (qty in the debris main deck).

   Real text (confirmed via Yugipedia): "If this card is in your GY: You can banish 1 other Plant monster
   from your GY; Special Summon this card, and if you do, increase its Level by the Level of that banished
   monster. You can only use this effect of 'Spore' once per Duel." (WIND/Plant/Tuner/Effect, Level 1, ATK
   400/DEF 800.)

   The GY-recursion Special Summon was already correctly implemented in cards/30_themes_b.js. But building
   the real DUEL-path test surfaced TWO real, previously-undiscovered bugs:

   1. cost() captured the banished monster's real Level into a custom ctx.sporeLv property, and resolve()
      read it back the same way — the exact same bug shape as S03-U102's カラクリ解体新書: in the real
      activation pipeline, resolve() receives an independently reconstructed ctx, so ctx.sporeLv was always
      undefined by resolve() time, and the real Level increase never applied (confirmed empirically:
      banishing a real Level-3 Plant monster left スポーア's own real Level at 1, not the real 4 it should
      become). Fixed with the same pattern as U102: persist the captured Level onto the real card object
      itself via API.setCardFlag (survives cost() intact, unlike ctx; not zone-local, so it also survives the
      real grave->mz Special Summon move), read back in resolve() via ctx.card's own field.

   2. The real text explicitly names the card in its restriction ("You can only use this effect of 'Spore'
      once per Duel") — per this engine's own documented 1103-ruling convention
      (RULING_1103_PER_CARD_LIMIT, engine/40_legal_script_engine.js, with カード名で明示されたカードは
      nameLimit:true で名称単位に数える, precedent: レスキューラビット), a name-explicit restriction like this
      must be tracked per PLAYER across all copies (nameLimit:true), not per physical card instance (the
      engine's own default). countLimit:{n:1,scope:'duel'} alone was declared without nameLimit:true, so with
      2+ real copies in the real Graveyard, each could independently use the effect once — a real,
      previously-undiscovered rules violation (3 real copies could combine for 3 real Level-boosted
      Special Summons in one real Duel instead of the correct 1). Fixed by adding nameLimit:true.

   No engine change; single-card fix (both bugs). Promotes スポーア IMPLEMENTED->TESTED. */
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
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,240));}
function pickByName(match){
  const pc=pendingChoiceV49(gameState);
  const i=pc.candidates.findIndex(x=>{const h=x.uid!=null&&findCardByUid(x.uid);return h&&nm(h.card)===match;});
  __choicePickV49(i>=0?i:0);
}
`;

/* ===== A. Real activation: a real other Plant monster (ローンファイア・ブロッサム, real Level 3) is really
   banished from the real Graveyard as the cost; スポーア (real base Level 1) is really Special Summoned from
   the real Graveyard, and its real current Level really becomes 1+3=4 (the fixed bug — previously always
   stayed at 1 regardless of the banished monster's Level). ===== */
harness(COMMON+String.raw`
fresh();
const spore=mk('スポーア',0);
const fodder=mk('ローンファイア・ブロッサム',0);
gameState.players[0].grave=[spore,fodder];
baselineA();
duelActivateFromZone(0,'grave',0);
if(pendingChoiceV49(gameState)) __choicePickV49(0);
drive();
ok('A: the real other Plant monster is really banished as the real cost',
  gameState.players[0].banish.some(c=>nm(c)==='ローンファイア・ブロッサム')&&!gameState.players[0].grave.some(c=>nm(c)==='ローンファイア・ブロッサム'),
  JSON.stringify({banish:gameState.players[0].banish.map(nm),grave:gameState.players[0].grave.map(nm)}));
const summoned=gameState.players[0].mz.find(c=>nm(c)==='スポーア');
ok('A: スポーア is really Special Summoned from the real Graveyard in real Attack Position',
  !!summoned&&summoned.pos==='atk'&&!gameState.players[0].grave.some(c=>nm(c)==='スポーア'),
  JSON.stringify({mz:gameState.players[0].mz.map(c=>[nm(c),c.pos]),grave:gameState.players[0].grave.map(nm)}));
ok('A: its real current Level really becomes 1 (base) + 3 (the banished monsters real Level) = 4',
  typeof curLV==='function'&&curLV(summoned)===4,
  JSON.stringify({lvMod:summoned&&summoned.lvMod,curLv:typeof curLV==='function'?curLV(summoned):null}));
audit('A');
`);

/* ===== B. Real negative control: with no real OTHER Plant monster in the real Graveyard, activation is
   correctly illegal. ===== */
harness(COMMON+String.raw`
fresh();
const spore=mk('スポーア',0);
gameState.players[0].grave=[spore,mk('青眼の白龍',0)];
baselineA();
ok('B: illegal with no real other Plant monster in the real Graveyard',
  !strictScriptLegalityV2('スポーア',0,'grave',0,{}).ok,
  JSON.stringify(strictScriptLegalityV2('スポーア',0,'grave',0,{})));
`);

/* ===== C. Real once-per-duel limit: after really using the effect once, a SECOND real copy of スポーア in
   the real Graveyard correctly cannot use the same effect again this Duel (the limit is per real DUEL, not
   per card instance). ===== */
harness(COMMON+String.raw`
fresh();
const spore1=mk('スポーア',0), spore2=mk('スポーア',0);
const fodder1=mk('ローンファイア・ブロッサム',0), fodder2=mk('きのこマン',0); // both real Plant monsters
gameState.players[0].grave=[spore1,spore2,fodder1,fodder2];
baselineA();
duelActivateFromZone(0,'grave',0);
if(pendingChoiceV49(gameState)) pickByName('ローンファイア・ブロッサム');
drive();
const remainingIdx=gameState.players[0].grave.findIndex(c=>nm(c)==='スポーア');
ok('C: after really using the real once-per-duel effect, the real second スポーア copy in the real Graveyard is correctly illegal too',
  remainingIdx>=0&&!strictScriptLegalityV2('スポーア',0,'grave',remainingIdx,{}).ok,
  JSON.stringify({remainingIdx,leg:strictScriptLegalityV2('スポーア',0,'grave',remainingIdx,{})}));
audit('C');
`);
