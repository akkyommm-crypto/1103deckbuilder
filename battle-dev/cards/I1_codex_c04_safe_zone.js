/* CODEX-C04 — 安全地帯.
   One face-up Attack Position monster is targeted at activation. While this
   Continuous Trap and its linked monster remain face-up on the field, the
   monster has the printed target/destruction protections and direct-attack
   restriction. Existing v9 links provide both leave-field destruction rules. */
function safeZoneCandidatesS03(){
  return API.fieldCards({zone:'mz',filter:x=>x.card&&x.card.face==='up'&&x.card.pos==='atk'});
}

function safeZoneLinkedMonsterS03(target,self){
  if(!target||!self||target.uid==null) return false;
  const src=locateCardAnyV4(self), dst=locateCardAnyV4(target);
  if(!src||src.zone!=='sz'||self.face!=='up'||!dst||dst.zone!=='mz'||target.face!=='up') return false;
  const st=linkStateV9(self);
  return !!(st&&Array.isArray(st.watch)&&st.watch.some(w=>w&&Number(w.uid)===Number(target.uid)));
}

defineScript('安全地帯', {
  targets:true,
  type:'continuous-trap', priority:2,
  condition(ctx){
    if(!safeZoneCandidatesS03().length){ctx.reason='表側攻撃表示モンスターがいません';return false;}
    return true;
  },
  selectTargets(ctx,done){
    API.selectCard('安全地帯：表側攻撃表示モンスター',safeZoneCandidatesS03(),t=>done([t]));
  },
  resolve(ctx){
    const picked=ctx.selectedTargets&&ctx.selectedTargets[0];
    const target=picked&&picked.card&&findCardByUid(picked.card.uid);
    const self=locateCardAnyV4(ctx.card);
    if(!target||target.zone!=='mz'||target.card.face!=='up'||target.card.pos!=='atk'||!self||self.zone!=='sz'){
      API.log('安全地帯：対象が存在しないため効果なし');
      return;
    }
    API.linkMutual(self,target,{aOnGone:'destroy',bOnGone:'destroy',label:'安全地帯'});
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters',from:['sz'],apply(){return null;},
    immuneToTarget(card,self,effectInfo){
      if(!safeZoneLinkedMonsterS03(card,self)) return false;
      const src=locateCardAnyV4(self);
      return !!src&&targetEffectMatchesS03(effectInfo,{opponentOf:src.p});
    },
    cannotDirectAttack(card,self){return safeZoneLinkedMonsterS03(card,self);},
    protectV21:{
      scope:'allMonsters',key:'safe-zone',label:'安全地帯',
      battle:(target,self)=>safeZoneLinkedMonsterS03(target,self),
      effect:(target,self,ctx)=>{
        if(!safeZoneLinkedMonsterS03(target,self)) return false;
        const src=locateCardAnyV4(self);
        return !!src&&!!ctx&&(ctx.byPlayer===0||ctx.byPlayer===1)&&ctx.byPlayer!==src.p;
      }
    }
  }
});
