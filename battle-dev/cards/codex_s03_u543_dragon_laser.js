/* S03-U543 ドラゴンレーザー.
 WIKI-C489CBC48C1D (2010-02-22): target an equipped Trigon at activation;
 sending it to the Graveyard is the EFFECT, never a cost. */
function u543TrigonS03(ctx){
  return API.fieldCards({player:ctx.player,zone:'sz',filter:x=>{
    if(x.card.face!=='up' || currentNameV17(x.card)!=='トライゴン') return false;
    const host=API.equippedMonster(x);
    return !!host && host.p===ctx.player && host.card.face==='up' && currentNameV17(host.card)==='デルタトライ';
  }});
}
defineUnifiedCardV4('ドラゴンレーザー',[{
  key:'send-equipped-wipe',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.HAND|LOCATION.SZONE,speed:2,events:['activate'],
  targetRange:LOCATION.SZONE,targetSide:'self',
  condition(ctx){ return u543TrigonS03(ctx).length>0 && API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0; },
  target(ctx,done){ API.selectCard('ドラゴンレーザー：デルタトライに装備されたトライゴン',u543TrigonS03(ctx),t=>done([t])); },
  operation(ctx){
    const t=ctx.selectedTargets && ctx.selectedTargets[0], eq=t && resolveTarget(t);
    if(!eq || !u543TrigonS03(ctx).some(x=>x.card===eq.card)) return;
    const uid=eq.card.uid;
    API.sendToGrave(eq,'ドラゴンレーザー');
    const sent=findCardByUid(uid);
    if(sent && sent.zone==='grave') API.destroyAll('mz',ctx.opponent,'ドラゴンレーザー');
  },afterResolve(){}
}],{type:'spell',priority:2,targets:true,destroysFieldV46:true});
