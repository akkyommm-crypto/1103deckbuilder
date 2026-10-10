/* =========================================================================
   S03-U248 — Trap Monsters 「このカードは発動後、(通常／効果)モンスター(種族・属性・星N・攻X/守Y)となり、モンスターゾーンに特殊召喚する。
   このカードは罠カードとしても扱う。」
   -------------------------------------------------------------------------
   - The card activation resolves by special summoning the Trap itself from the Spell & Trap Zone (FX_SPECIAL_SUMMON from 'sz', journaled)
     with its printed monster data: the action carries asMonsterDbS03 (a plain JSON copy of the Trap's db with k:'m', lv, atk, def, ra, at,
     st:['通常'|'効果']); the reducer stores it on the card (zone-local) and dbOf (engine/20) returns it, as it does a token's db. So stats,
     Race, Attribute, Level, battle, material checks and Replay see a monster. When it leaves the field the key is stripped and it is a
     Trap card again (in the GY / hand / Deck).
   - 「罠カードとしても扱う」: isTrapCardS03(card) — the printed card kind (CARD_DB) — for scripts that ask about Trap cards. Scripts that read
     dbOf(card).k see 'm' while it is a monster (documented limit, like the placed 宝玉獣 of S03-U240).
   - 「このカードの効果で特殊召喚した」: card.specialSummonKind is 'effect' and card.trapMonsterS03 marks the summon by its own activation.
   ========================================================================= */
function isTrapCardS03(card){ return !!card && ((typeof CARD_DB!=='undefined' && CARD_DB[card.id]) || {}).k==='t'; }
function trapMonsterDbS03(card, spec){
  const base = (typeof CARD_DB!=='undefined' && CARD_DB[card.id]) || {};
  return {n:base.n, c:base.c, d:base.d, e:base.e, setcode:base.setcode, alias:base.alias,
          k:'m', lv:spec.lv, atk:spec.atk, def:spec.def, ra:spec.ra, at:spec.at, st:[spec.kind==='normal'?'通常':'効果'],
          trapMonsterS03:true, printedKindS03:'t'};
}
/* the ACTIVATE effect of a Trap Monster: spec = {lv, atk, def, ra, at, kind:'normal'|'effect', pos:'atk'|'def', condition?(ctx)} */
function trapMonsterActivateS03(name, spec){
  return {
    key:'trap-monster', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
    condition(ctx){
      if(ctx.card && ctx.card.face==='up' && !ctx.card.activationPending) return false;   /* a face-up one (resolved) has no activation */
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      if(gameState.players[ctx.player].temporaryFlags && gameState.players[ctx.player].temporaryFlags.noSpecialSummon){ ctx.reason = 'このターンは特殊召喚できません'; return false; }
      return typeof spec.condition==='function' ? spec.condition(ctx)!==false : true;
    },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone!=='sz' || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'sz', me.index, spec.pos||'atk', name, ctx.player, {asMonsterDbS03:trapMonsterDbS03(me.card, spec), ignoreSummonConditionS03:true});
      const now = locateCardAnyV4(ctx.card);
      if(now && now.zone==='mz') API.setCardFlag(now, 'trapMonsterS03', {turn:gameState.turn}, name, {silent:true});
    },
    /* summoned → nothing to do; still in the Spell & Trap Zone (no room at resolution) → to the GY like any resolved Trap */
    afterResolve(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz') selfToGrave(ctx); }
  };
}
/* a monster summoned by its own Trap activation (「このカードの効果で特殊召喚した」) */
function trapMonsterSummonedS03(card){ return !!card && !!card.trapMonsterS03 && !!card.asMonsterDbS03; }
