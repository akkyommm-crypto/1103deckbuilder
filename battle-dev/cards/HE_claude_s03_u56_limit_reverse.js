/* S03-U56: リミット・リバース
   DUEL fixed-list Debris routes were clean except this set continuous trap was
   still offered as activateSetManual. Keep the implementation on existing
   primitives: v4 activation, API.specialSummon, v9 mutual leave links, and
   v10 position-change events. */

function s03LimitReverseTargets(player){
  return API.pileCards(player,'grave',x=>x.db.k==='m'&&Number(x.db.atk)<=1000);
}
function s03LimitReverseWatches(card, uid){
  const st=API.linkState(card);
  return !!(st&&Array.isArray(st.watch)&&st.watch.some(w=>w&&w.uid===uid));
}

defineUnifiedCardV4('リミット・リバース',[{
  key:'revive-small-atk',
  type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.SZONE,
  targetRange:LOCATION.GRAVE,
  targetSide:'self',
  speed:2,
  events:['activate'],
  condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(!s03LimitReverseTargets(ctx.player).length){
      ctx.reason='墓地に攻撃力1000以下のモンスターがいません'; return false;
    }
    /* S03-U470: 墓地のモンスターが全て対象耐性（メタルシルバー・アーマー）で候補から外れる時は、発動の前に断る */
    if(!API.targetableCardsS03(s03LimitReverseTargets(ctx.player), ctx.player).length){
      ctx.reason='墓地に効果の対象にできる攻撃力1000以下のモンスターがいません'; return false;
    }
    return true;
  },
  target(ctx,done){
    API.selectCard('リミット・リバース：特殊召喚する攻撃力1000以下のモンスター',
      s03LimitReverseTargets(ctx.player),t=>done([t]));
  },
  operation(ctx){
    const picked=ctx.selectedTargets&&ctx.selectedTargets[0];
    const r=picked&&resolveTarget(picked);
    if(!r||r.zone!=='grave'||!hasMonsterZoneSpace(ctx.player)) return;
    const targetCard=r.card;
    ensureCardUid(gameState,targetCard);
    API.specialSummon(ctx.player,'grave',r.index,'atk','リミット・リバース');
    const self=locateCardAnyV4(ctx.card);
    const revived=locateCardAnyV4(targetCard);
    if(!self||self.zone!=='sz'||!revived||revived.zone!=='mz') return;
    API.linkMutual(self,revived,{label:'リミット・リバース'});
  },
  afterResolve(){}
},{
  key:'destroy-on-defense',
  type:EFFECT_TYPE.TRIGGER,
  range:LOCATION.SZONE,
  speed:1,
  events:['onPositionChange'],
  forced:true,
  condition(ctx){
    const e=ctx.event||{};
    return ctx.zone==='sz'&&ctx.card&&ctx.card.face==='up'
      &&e.uid!=null&&e.toPos==='def'&&s03LimitReverseWatches(ctx.card,e.uid);
  },
  operation(ctx){
    const e=ctx.event||{};
    const target=e.uid!=null?findCardByUid(e.uid):null;
    if(target&&target.zone==='mz') API.destroy(target,'リミット・リバース');
    const self=locateCardAnyV4(ctx.card);
    if(self&&self.zone==='sz') API.destroy(self,'リミット・リバース');
  },
  afterResolve(){}
}],{
  type:'trap',
  priority:2,
  targets:true,
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  passive:{onPositionChange:ctx=>{
    const e=ctx.event||{};
    return !!(ctx.zone==='sz'&&ctx.card&&ctx.card.face==='up'
      &&e.uid!=null&&e.toPos==='def'&&s03LimitReverseWatches(ctx.card,e.uid));
  }},
  continuous:{scope:'self',from:['sz'],apply(){return null;}}
});
