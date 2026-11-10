/* S03-U545: フルール・シンクロン / ヴァイロン・キューブ.
 Existing c8AsSynchroMaterial provenance, non-targeting resolution choices,
 specialSummonPositionsS03 and API.searchDeck; no engine additions.
 Cube: WIKI-A21BBF75DDF4 (2010-06-20): normal/chain-2 Synchro material does not miss timing.
 Fleur: historical archive search including question text has 0 matches (era-specific evidence absent). */
function u545HandSmallS03(ctx){
  return API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && Number(curLV(x.card))<=2
    && canEffectSpecialSummonS03(x.card,'hand','フルール・シンクロン')
    && !v46SpecialSummonRestrictionReason(ctx.player,x.db));
}
function u545CubeMaterialS03(ctx){
  const material=c8AsSynchroMaterial(ctx);
  return !!material && !!material.synchro && hasAttributeV17(material.synchro.card,'光');
}
function u545EquipDeckS03(ctx){ return API.pileCards(ctx.player,'deck',x=>x.db.k==='s' && x.db.sub==='装備'); }
defineUnifiedCardV4('フルール・シンクロン',[{
  key:'material-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],
  condition(ctx){ return !!c8AsSynchroMaterial(ctx) && hasMonsterZoneSpace(ctx.player) && u545HandSmallS03(ctx).length>0; },
  operation(ctx){
    const pool=u545HandSmallS03(ctx);if(!pool.length || !hasMonsterZoneSpace(ctx.player))return;
    API.selectCard('フルール・シンクロン：手札から特殊召喚するレベル2以下',pool,t=>{
      const h=t && resolveTarget(t);
      if(h && h.zone==='hand' && h.p===ctx.player && u545HandSmallS03(ctx).some(x=>x.card===h.card))
        specialSummonPositionsS03(ctx.player,[{uid:h.card.uid,from:'hand'}],'フルール・シンクロン');
    });
  },afterResolve(){}
}],{type:'monster',priority:1,timing:['free'],activateFrom:['grave'],includesSpecialSummon:true});
defineUnifiedCardV4('ヴァイロン・キューブ',[{
  key:'material-search',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onSendToGrave'],
  condition(ctx){ return u545CubeMaterialS03(ctx) && !deckToHandLockReasonV32(ctx.player) && u545EquipDeckS03(ctx).length>0; },
  operation(ctx){
    if(deckToHandLockReasonV32(ctx.player))return;
    const pool=u545EquipDeckS03(ctx);if(!pool.length)return;
    API.selectCard('ヴァイロン・キューブ：手札に加える装備魔法',pool,t=>{
      const h=t && resolveTarget(t);
      if(h && h.p===ctx.player && h.zone==='deck' && !deckToHandLockReasonV32(ctx.player)) API.searchDeck(ctx.player,h.index,'ヴァイロン・キューブ');
    });
  },afterResolve(){}
}],{type:'monster',priority:1,timing:['free'],activateFrom:['grave']});
