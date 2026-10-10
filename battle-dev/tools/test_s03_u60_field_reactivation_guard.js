/* S03-U60 field-reactivation guard (follow-up to S03-U59's own per-card fix).
   Requirement: getLegalZoneActions() offered "⚡ 効果を発動" (duelActivateFromZone) for ANY face-up card
   with a scripted resolve(), with no distinction between a genuine repeatable field ignition effect and a
   one-shot Continuous/Field/Equip Spell whose resolve() is only the "on activation" effect. U59 found and
   fixed this for 未来融合－フューチャー・フュージョン with a dedicated per-card flag (see
   cards/HF_claude_s03_u59_future_fusion.js) because zone/eventName/activationPending cannot tell "about to
   activate from hand" apart from "already resolved and sitting on the field" — both reach sc.condition()
   with the same logical zone.

   Audit (script_coverage.json, kind==='spell', subtype in 永続/フィールド/装備, status TESTED|GENERIC_OK — 195
   cards as of this unit) found the same shape reproduces for real, non-fieldIgnition Continuous/Field/Equip
   Spells across the codebase — most visibly the whole v70Equip/v71DynamicEquip autobuild helper family
   (engine/40_legal_script_engine.js:getLegalZoneActions offered "re-equip to a different monster" on an
   already-resolved Equip Spell, actually moving the ATK/DEF bonus for free — confirmed below with
   エルフの光). Fix: reuse hasFieldActivatableEffect() (S03-U13/U46, engine/20_effect_primitives_ex.js),
   the exact same gate reactableCards() already applies for the opponent's response window, inside
   getLegalZoneActions()'s existing face-up-card branch — scoped to db.k==='s' (spells; the audited class).
   This required NO new Capability: hasFieldActivatableEffect already correctly distinguishes the genuine
   field-repeatable cases (fieldIgnition / CARD_ACTIVATION_FREE_V32-declared legacy cards, and V4 cards with
   a real IGNITION/QUICK-type effect) from the one-shot ones, and was simply never consulted here before. */
const harness=require('./astra_harness');
const COMMON=String.raw`
const TOASTS=[];showToast=m=>TOASTS.push(String(m));
ASK_CHAIN=false;
function nm(c){return c?cardName(c):null;}
function zoneOf(c){const h=findCardByUid(c.uid);return h&&h.zone;}
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

/* ===== A. real bug, confirmed and fixed: エルフの光 (v70Equip helper family — 26 TESTED cards share this
   template) can no longer be re-activated from the field to move its ATK/DEF bonus to a different monster
   for free once already equipped. ===== */
harness(COMMON+String.raw`
fresh();
const bey1=mk('青眼の白龍',0),bey2=mk('青眼の白龍',0);
const elf=mk('エルフの光',0);
gameState.players[0].mz=[bey1,bey2];
gameState.players[0].hand=[elf];
baselineA();
duelActivateFromHand(0);
drive();
if(pendingChoiceV49(gameState)){pickUid(bey1.uid);drive();}
ok('A setup: エルフの光 resolves and equips to bey1 (real ATK boost applied)',
  zoneOf(elf)==='sz'&&elf.equipTo&&elf.equipTo.uid===bey1.uid&&curATK(bey1)===3400,
  JSON.stringify({zone:zoneOf(elf),equipTo:elf.equipTo&&elf.equipTo.uid,atk1:curATK(bey1),atk2:curATK(bey2)}));
const szIdx=gameState.players[0].sz.findIndex(c=>c.uid===elf.uid);
const actions=getLegalZoneActions(0,'sz',szIdx).map(a=>a.id);
const L=strictScriptLegality('エルフの光',0,'sz',szIdx);
ok('A: once resolved/equipped, エルフの光 is never offered as a re-activatable effect from the field',
  !actions.includes('effect'),JSON.stringify({actions,L}));
/* Even if a caller bypassed the (now hidden) button and forced duelActivateFromZone directly, the
   legality gate itself must refuse it — the button hiding is a UI consequence of the same gate, not a
   separate, weaker check. */
duelActivateFromZone(0,'sz',szIdx);
drive();
if(pendingChoiceV49(gameState)) pickUid(bey2.uid), drive();
ok('A: a direct call is also refused — the equip never moves to bey2, bey1 keeps its bonus',
  elf.equipTo&&elf.equipTo.uid===bey1.uid&&curATK(bey1)===3400&&curATK(bey2)===3000,
  JSON.stringify({equipTo:elf.equipTo&&elf.equipTo.uid,atk1:curATK(bey1),atk2:curATK(bey2)}));
audit('A equip field-reactivation blocked');
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);
  ok(label+': Replay audit reproduces every digest',pkg.actions.length>0&&a.ok,JSON.stringify(a).slice(0,220));}
`);

/* ===== B. harmless-but-noisy case: terrain Field Spells (v50Field helper family — 山/森/荒野/草原/湿地草原/海/闇
   etc.) had an empty operation(), so the old bug never corrupted state, but still offered a dead button.
   Confirm it is gone (UI/AI-driver hygiene — an R1 AI driver could otherwise "waste" a turn on it). ===== */
harness(COMMON+String.raw`
fresh();
const yama=mk('山',0);
gameState.players[0].hand=[yama];
baselineA();
duelActivateFromHand(0);
drive();
ok('B setup: 山 resolves and sits as the Field Spell',zoneOf(yama)==='field');
ok('B: no bogus ⚡ 効果を発動 button once resolved (operation() was always a no-op; hygiene only)',
  !getLegalZoneActions(0,'field',0).some(a=>a.id==='effect'),
  JSON.stringify(getLegalZoneActions(0,'field',0).map(a=>a.id)));
`);

/* ===== C/D. regression: real field-repeatable ignition effects must keep working exactly as before —
   one legacy CARD_ACTIVATION_FREE_V32-declared 永続魔法 (カードトレーダー) and one V4-native フィールド魔法
   with an explicit EFFECT_TYPE.IGNITION effect (機動要塞フォルテシモ). ===== */
harness(COMMON+String.raw`
fresh();
const ct=mk('カードトレーダー',0);
const filler=mk('ワイト',0);
gameState.players[0].hand=[ct,filler];
gameState.players[0].deck=Array.from({length:10},()=>mk('ワイト',0));
baselineA();
duelActivateFromHand(0);
drive();
const szIdx=gameState.players[0].sz.findIndex(c=>c.uid===ct.uid);
ok('C: カードトレーダー (legacy, declared CARD_ACTIVATION_FREE_V32 field-ignition) still offers ⚡ 効果を発動 from the field',
  szIdx>=0&&getLegalZoneActions(0,'sz',szIdx).some(a=>a.id==='effect'),
  JSON.stringify({szIdx,actions:szIdx>=0?getLegalZoneActions(0,'sz',szIdx).map(a=>a.id):null}));
`);
harness(COMMON+String.raw`
fresh();
const ff=mk('機動要塞フォルテシモ',0);
gameState.players[0].hand=[ff];
baselineA();
duelActivateFromHand(0);
drive();
ok('D: 機動要塞フォルテシモ (V4-native, explicit EFFECT_TYPE.IGNITION effect) still offers ⚡ 効果を発動 as the Field Spell',
  !!gameState.players[0].field&&getLegalZoneActions(0,'field',0).some(a=>a.id==='effect'),
  JSON.stringify({field:nm(gameState.players[0].field),actions:gameState.players[0].field?getLegalZoneActions(0,'field',0).map(a=>a.id):null}));
`);

/* ===== E. gate-level regression: スパークガン is a 装備 Spell with a genuine repeatable
   EFFECT_TYPE.IGNITION effect (Spark Blaster-style position-change ability) — confirms the new guard does
   not apply a blanket "equip is always one-shot" rule, only hasFieldActivatableEffect()'s existing,
   already-tested per-effect-type classification. ===== */
harness(COMMON+String.raw`
fresh();
const sg=mk('スパークガン',0);
gameState.players[0].sz=[sg];
baselineA();
ok('E: スパークガン (equip Spell with a genuine field IGNITION effect) is NOT blanket-blocked by the U60 guard',
  hasFieldActivatableEffect(sg),'');
`);
