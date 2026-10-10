/* Auto cycle 45 — existing-engine stat / battle trigger pickups.
   Engine changes: none. New primitive: none. */

/* LP差分ぶんATKが増減。戦闘破壊で墓地へ送られた時、1000LPを払って自己蘇生できる。 */
defineUnifiedCardV4('エンシェント・ホーリー・ワイバーン',[{
  key:'battle-revive',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onBattleDestroy'],
  condition(ctx){
    return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card&&API.me(ctx).lp>1000&&hasMonsterZoneSpace(ctx.player);
  },
  cost(ctx,done){API.payCost(ctx.player,1000);done(true);},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h&&h.zone==='grave'&&hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player,'grave',h.index,'atk','エンシェント・ホーリー・ワイバーン');
  },afterResolve(){}
}],{
  type:'synchro',priority:1,activateFrom:['grave'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card&&API.me(ctx).lp>1000&&hasMonsterZoneSpace(ctx.player);}},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self||card.face!=='up') return null;
    const h=locateCardAnyV4(self), p=h?h.p:(info&&info.p);
    if(p==null) return null;
    const diff=(gameState.players[p].lp||0)-(gameState.players[1-p].lp||0);
    return diff?{atk:diff}:null;
  }}
});

/* エレキを攻撃したモンスターを、ダメージ計算後にこのカードが残る限りATK-1000。 */
defineUnifiedCardV4('エレキャッスル',[{
  key:'watt-attacker-down',type:EFFECT_TYPE.TRIGGER,range:LOCATION.FIELD,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{};
    return ctx.zone==='field'&&ctx.card.face==='up'&&ctx.step==='after'&&b.atkCard&&b.defCard
      &&isCardInGroupV4(dbOf(b.defCard),GROUP.WATT)&&!!locateCardAnyV4(b.atkCard);
  },
  operation(ctx){
    const b=ctx.battle||{}, h=locateCardAnyV4(b.atkCard);
    if(h) v4RegisterStatModifier(h,{atk:-1000},{code:'エレキャッスル',sourceCard:ctx.card,targetCard:h.card,resetMask:RESET.LEAVE|RESET.FACE_DOWN|RESET.DISABLE});
  },afterResolve(){}
}],{
  type:'spell',priority:1,forced:true,
  passive:{onDamageStep(ctx){
    const b=ctx.battle||{};
    return ctx.zone==='field'&&ctx.card.face==='up'&&ctx.step==='after'&&b.atkCard&&b.defCard
      &&isCardInGroupV4(dbOf(b.defCard),GROUP.WATT);
  }},
  continuous:{scope:'self',from:['field'],apply(){return null;}}
});
