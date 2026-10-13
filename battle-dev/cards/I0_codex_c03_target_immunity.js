/* CODEX-C03 — first consumer of source/controller-aware target immunity.

   氷結界の御庭番:
   While face-up, Ice Barrier monsters I control cannot be targeted by the
   opponent's Effect Monster effects. Face-down monsters have no public name. */
defineScript('氷結界の御庭番', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason='永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['mz'], apply(){ return null; },
    immuneToTarget(card, self, effectInfo){
      if(!card || card.face!=='up' || !isCardInGroupV4(dbOf(card), GROUP.ICE_BARRIER)) return false;
      const me=locateCardAnyV4(self);
      if(!me || me.zone!=='mz' || self.face!=='up') return false;
      return targetEffectMatchesS03(effectInfo, {opponentOf:me.p, effectMonster:true});
    }
  }
});
