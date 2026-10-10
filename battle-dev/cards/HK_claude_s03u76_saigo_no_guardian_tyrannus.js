/* S03-U76: 始祖の守護者ティラス, an ENGINE_GAP Xyz monster in the Worm major deck. Found via priority #7
   (re-auditing the ENGINE_GAP candidates flagged in an earlier priority #7 pass, alongside 六武衆の影武者).
   Real text (this project's own card database, printed 2011-04-16 — within the 2011-08-31 cutoff):
   "Level 5 monster x2 [Xyz]. This card's effects are not applied if it has no Xyz Materials. This card cannot
   be destroyed by card effects. At the end of the Battle Phase in which this card battled, select 1 card your
   opponent controls and destroy it. Remove 1 Xyz Material from this card during each of your End Phases."
   LIGHT/Angel/Xyz/Effect, Rank 5, ATK 2600/DEF 1700.
   The gap-audit note flagging this card ("Needs generic effect-destruction immunity/replacement support")
   is STALE: `engine/1K_destruction_protection_v21.js` (System v21, `sc.protectV21`) already provides exactly
   this generic capability — it was evidently built sometime after that gap note was written, and no later
   pass had re-audited this specific card against it. `protectV21.effect` accepts a function, letting the
   "no Xyz Materials -> no effects" gate apply directly to the destruction-immunity clause itself, matching
   this codebase's own established v21 precedent (cards/9G_destruction_protection_recovery.js).
   The "at the end of the Battle Phase in which this card battled" trigger reuses the existing
   API.battledThisPhase() primitive (precedent: ビッグ・ジョーズ／ステルスロイド, cards/91_battle_recovery.js),
   and the per-End-Phase material removal uses requestDetachMaterialS03 (S03-U114: the controller chooses the material). No new engine
   capability was needed at all. Xyz materials on a real field card live on `card.xyz` (an array, set by the
   real FX_EX_SUMMON/FX_DETACH action handlers in engine/00_state_actions.js) — NOT `card.materials`, a
   different field that エクシーズエナジー (cards/56_v56_autobuild_batch08.js) incorrectly checks instead,
   found incidentally while researching this card and flagged separately (spawn_task) since fixing it is out
   of this unit's scope. */
function s03u76HasMaterials(card){
  return !!(card && Array.isArray(card.xyz) && card.xyz.length>0);
}
defineUnifiedCardV4('始祖の守護者ティラス',[
  {
    key:'destroy-at-bp-end', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'],
    condition(ctx){
      return s03u76HasMaterials(ctx.card) && API.battledThisPhase(ctx.card)
        && API.fieldCards({player:ctx.opponent}).length>0;
    },
    target(ctx,done){
      API.selectCard('始祖の守護者ティラス：破壊する相手フィールドのカード',
        API.fieldCards({player:ctx.opponent}), t=>done([t]));
    },
    operation(ctx){
      const t=ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(t) API.destroy(t,'始祖の守護者ティラス');
    },
    afterResolve(){}
  },
  {
    key:'detach-at-end-phase', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'],
    condition(ctx){
      return gameState.activePlayer===ctx.player && s03u76HasMaterials(ctx.card);
    },
    operation(ctx){
      const h=locateCardAnyV4(ctx.card);
      /* S03-U114: 取り除く素材はコントローラーが選ぶ（素材が1つなら自動） */
      if(h){ ensureCardUid(gameState, h.card); requestDetachMaterialS03({player:h.p, holderUid:h.card.uid, count:1, reason:'始祖の守護者ティラス', cancelable:false}); }
    },
    afterResolve(){}
  }
],{
  type:'monster', priority:1, forced:true, targets:true, destroysFieldV46:true,
  protectV21:{effect:(target)=>s03u76HasMaterials(target), label:'始祖の守護者ティラス'},
  passive:{
    onBattlePhaseEnd(ctx){ return s03u76HasMaterials(ctx.card) && API.battledThisPhase(ctx.card); },
    onEndPhase(ctx){ return gameState.activePlayer===ctx.player && s03u76HasMaterials(ctx.card); }
  }
});
