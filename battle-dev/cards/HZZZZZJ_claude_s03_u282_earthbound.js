/* S03-U282: 「地縛神」 common clauses (engine/1ZZM earthboundCommonS03 + uniqueness) — 地縛神 Ccapac Apu (reference), 地縛大神官 (2011 texts).
   The other six 地縛神 use earthboundCommonS03 too (their own effects are separate work). */

/* ---- 地縛神 Ccapac Apu: …(common clauses)… また、このカードが戦闘によって相手モンスターを破壊した場合、破壊したモンスターの元々の攻撃力分のダメージを
   相手ライフに与える。 ---- (forced; the destroyed monster's printed ATK; it attacks or is attacked) */
function capacApuKillS282(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || ctx.step!=='leave') return null;
  const foe = (b.atkCard===ctx.card) ? (b.destroyedDef ? b.defCard : null) : ((b.defCard===ctx.card) ? (b.destroyedAtk ? b.atkCard : null) : null);
  if(!foe) return null;
  const h = locateCardAnyV4(foe);
  return (h && h.zone==='grave') ? foe : null;
}
defineUnifiedCardV4('地縛神 Ccapac Apu', [{
  key:'battle-kill-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'],
  condition(ctx){ return !!capacApuKillS282(ctx); },
  operation(ctx){ const foe = capacApuKillS282(ctx) || ((ctx.battle||{}).atkCard===ctx.card ? (ctx.battle||{}).defCard : (ctx.battle||{}).atkCard);
    const n = foe ? Math.max(0, Number(dbOf(foe).atk)||0) : 0; if(n) API.damageLP(ctx.opponent, n); },
  afterResolve(){}
}], earthboundCommonS03({type:'monster', priority:1, forced:true, dsTiming:'leave', passive:{ onDamageStep: ctx=>!!capacApuKillS282(ctx) }}));

/* ---- 地縛大神官: このカードがフィールド上に表側表示で存在する限り、「地縛神」と名のついたモンスターは自身の効果では破壊されない。 ---- */
defineScript('地縛大神官', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    noSelfEffectDestroyS03:(card)=> !!card && typeof groupMemberNowS03==='function' && groupMemberNowS03(card, GROUP.EARTHBOUND) }
});
