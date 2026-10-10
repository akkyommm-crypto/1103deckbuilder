/* System v4.8 — replay-safe multi-attack cards. */
function v48SelfMz(ctx){const h=locateCardAnyV4(ctx.card);return h&&h.p===ctx.player&&h.zone==='mz'?h:null;}
function v48CanContinueAttack(ctx){const h=v48SelfMz(ctx);return !!(h&&ctx.card.face==='up'&&ctx.card.pos==='atk'&&!cannotAttackNow(ctx.card));}

defineUnifiedCardV4('ダイガスタ・フェニクス',[{
  key:'wind-double-attack',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;
    if(!(ctx.card.xyz||[]).length){ctx.reason='取り除けるX素材がありません';return false;}
    const pool=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&(x.db||dbOf(x.card)).at==='風'});
    if(!pool.length){ctx.reason='自分フィールドに表側表示の風属性モンスターがいません';return false;}return true;
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'ダイガスタ・フェニクス（コスト）',targets(ctx){return {title:'ダイガスタ・フェニクス：2回攻撃する風属性モンスター',candidates:API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&(x.db||dbOf(x.card)).at==='風'})};}},
  target(ctx,done){API.selectCard('ダイガスタ・フェニクス：2回攻撃する風属性モンスター',API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&(x.db||dbOf(x.card)).at==='風'}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(r&&r.p===ctx.player&&r.zone==='mz'&&r.card.face==='up'&&dbOf(r.card).at==='風')API.grantAdditionalAttack(r,1,'ダイガスタ・フェニクス',false);},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,targets:true,timing:['mainPhase']});

defineUnifiedCardV4('カチコチドラゴン',[{
  key:'consecutive-attack',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{},foe=b.defCard,h=foe&&locateCardAnyV4(foe);
    if(ctx.zone!=='mz'||ctx.step!=='leave'||b.atkCard!==ctx.card||!b.destroyedDef||!h||h.zone!=='grave'){ctx.reason='相手モンスターを戦闘で破壊して墓地へ送った時に発動します';return false;}
    if(!(ctx.card.xyz||[]).length){ctx.reason='取り除けるX素材がありません';return false;}
    if(!v48CanContinueAttack(ctx)){ctx.reason='このカードは続けて攻撃できません';return false;}return true;
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'カチコチドラゴン（コスト）'},
  operation(ctx){const h=v48SelfMz(ctx);if(!h||!v48CanContinueAttack(ctx))return;API.grantAdditionalAttack(h,1,'カチコチドラゴン',true);API.setFlag(ctx.player,'v48ConsecutiveAttackerUid',ensureCardUid(gameState,ctx.card),true);},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,dsTiming:'leave',passive:{onDamageStep(ctx){const b=ctx.battle||{},foe=b.defCard,h=foe&&locateCardAnyV4(foe);return ctx.zone==='mz'&&ctx.step==='leave'&&b.atkCard===ctx.card&&!!b.destroyedDef&&!!h&&h.zone==='grave'&&(ctx.card.xyz||[]).length>0&&v48CanContinueAttack(ctx);}}});
