/* S03-U61 Continuous Trap field-reactivation guard (extends S03-U60's Spell fix to Traps).
   Requirement (measured per the fixed U60-completion fallback order: same bug class in an unaudited area):
   script_coverage.json kind==='trap', subtype==='永続' (Continuous Trap), status TESTED|GENERIC_OK — 80 cards.
   Audited with hasFieldActivatableEffect() (the same S03-U13/U46 primitive U60 reused for Spells): 9 are
   genuine field-repeatable (already correctly declared via fieldIgnition/onFieldEffectS03/
   CARD_ACTIVATION_FREE_V32/a real V4 IGNITION-type effect); 66 share U59/U60's one-shot shape and were
   completely unguarded, because U60's fieldReactivationBlockedS03U60() was scoped to db.k==='s' only.
   Confirmed a real, state-corrupting bug on the real DUEL path: リミット・リバース
   (cards/HE_claude_s03_u56_limit_reverse.js) could illegally re-Special-Summon a *second* GY monster for
   free by re-clicking it once already resolved and sitting face-up on the field. Fixed by extending
   fieldReactivationBlockedS03U60()'s scope to db.k==='t' && db.sub==='永続' (engine/40_legal_script_engine.js)
   — no new call-site changes needed: a Continuous Trap's first activation always goes through
   duelActivateFromZone too (Set face-down -> activated later from that same zone; there is no
   duelActivateFromHand path for a normal Trap activation), so the existing card.face!=='up' exclusion
   already correctly left first activations untouched. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
function mzNames(p){return gameState.players[p].mz.map(nm);}
function fresh(){
  resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;TOASTS.length=0;
  gameState.activePlayer=0;gameState.phase='main1';
}
function drive(){
  for(let i=0;i<600;i++){
    if(pendingChoiceV49(gameState)) return 'choice';
    if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){eventSkipGroupV2();continue;}
    if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
    if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
    if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
    if(gameState.pendingSummon){commitPendingSummonV2();continue;}
    return 'idle';
  }
  return 'loop';
}
function pickUid(uid){
  const q=pendingChoiceV49(gameState);
  if(!q) return false;
  const i=q.candidates.findIndex(c=>c.uid===uid);
  if(i<0) return false;
  __choicePickV49(i);
  return true;
}
`;

/* ===== A. real bug, confirmed and fixed: リミット・リバース can no longer illegally re-Special-Summon a
   second GY monster once it has already resolved and is sitting face-up on the field. ===== */
harness(COMMON+String.raw`
fresh();
const lr=mk('リミット・リバース',0,'down');
lr.setTurn=gameState.turn-1;
const g1=mk('ワイト',0),g2=mk('ワイト',0);
gameState.players[0].sz=[lr];
gameState.players[0].grave=[g1,g2];
baselineA();
duelActivateFromZone(0,'sz',0);
drive();
pickUid(g1.uid);
drive();
ok('A setup: リミット・リバース Special Summons g1 from the GY for real (first activation, from a face-down Set)',
  zoneOf(g1)==='mz'&&zoneOf(g2)==='grave'&&zoneOf(lr)==='sz',
  JSON.stringify({mz:mzNames(0),g1:zoneOf(g1),g2:zoneOf(g2)}));
const szIdx=gameState.players[0].sz.findIndex(c=>c.uid===lr.uid);
const actions=getLegalZoneActions(0,'sz',szIdx).map(a=>a.id);
ok('A: once resolved and face-up, リミット・リバース is never offered as a re-activatable effect from the field',
  !actions.includes('effect'),JSON.stringify(actions));
duelActivateFromZone(0,'sz',szIdx);
drive();
if(pendingChoiceV49(gameState)) pickUid(g2.uid), drive();
ok('A: a direct call is also refused — g2 stays safely in the GY, no illegal second Special Summon',
  zoneOf(g2)==='grave'&&gameState.players[0].mz.length===1,
  JSON.stringify({mz:mzNames(0),g2:zoneOf(g2)}));
const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
ok('A: Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));
`);

/* ===== B. regression: 強制終了 (a genuine field-repeatable Continuous Trap — its ACTIVATE effect is
   declared in CARD_ACTIVATION_FREE_V32) still offers and correctly executes its effect once already
   sitting face-up on the field (not merely on its first activation). ===== */
harness(COMMON+String.raw`
fresh();
const sk=mk('強制終了',0,'up');
const filler=mk('ワイト',0);
gameState.players[0].sz=[sk];
gameState.players[0].mz=[filler];
gameState.phase='battle';
gameState.battle={player:0,cleaned:true};
baselineA();
const szIdx=gameState.players[0].sz.findIndex(c=>c.uid===sk.uid);
ok('B: 強制終了 (declared CARD_ACTIVATION_FREE_V32, already face-up) still offers ⚡ 効果を発動 during the Battle Phase',
  getLegalZoneActions(0,'sz',szIdx).some(a=>a.id==='effect'),
  JSON.stringify(getLegalZoneActions(0,'sz',szIdx).map(a=>a.id)));
duelActivateFromZone(0,'sz',szIdx);
drive();
if(pendingChoiceV49(gameState)){ pickUid(filler.uid); drive(); }
ok('B: activating it for real still ends the current battle (genuine repeatable effect keeps working; endBattle() clears gameState.battle)',
  gameState.battle===null&&zoneOf(filler)==='grave',JSON.stringify({battle:gameState.battle,filler:zoneOf(filler)}));
`);

/* ===== C. gate-level regression: a sample of the other declared field-repeatable Continuous Traps are not
   blanket-blocked just because they are traps. ===== */
harness(COMMON+String.raw`
fresh();
['王宮の弾圧','零式魔導粉砕機','死霊の巣','木遁封印式','水遁封印式'].forEach(nmC=>{
  const c=mk(nmC,0,'up');
  gameState.players[0].sz=[c];
  ok('C: '+nmC+' (declared field-repeatable Continuous Trap) is NOT blanket-blocked by the U61 guard',
    hasFieldActivatableEffect(c),'');
});
`);
