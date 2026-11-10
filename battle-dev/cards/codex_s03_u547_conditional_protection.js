/* S03-U547: three conditional protections through existing protectV21.
 Archive (including questions): 地獄の番熊 / スネーク・チョーク 0 entries;
 era-specific additional evidence absent, special rulings remain unconfirmed.
 クダベ: WIKI-91EB7B5E8EC1 (2010-01-22) 0 cards = continuous protection,
 3+ cards = End Phase trigger; WIKI-12C64889B7C3 (same date) reducing the hand
 after activation does NOT stop its destruction. */
defineScript('地獄の番熊',u426Passive({
  continuous:{scope:'ownCards',from:['mz'],apply(){return null;},
    protectV21:{key:'u547.pandemonium',label:'地獄の番熊',opponentOnly:true,
      effect(target){return currentNameV17(target)==='万魔殿－悪魔の巣窟－';}}}
}));
defineScript('スネーク・チョーク',{
  type:'trap',priority:2,condition(ctx){return ctx.zone==='sz';},resolve(){},afterResolve(){},
  continuous:{scope:'oppMonsters',from:['sz'],apply(){return null;},
    protectV21:{key:'u547.snake',label:'スネーク・チョーク',
      battle(target,self,ctx){return target.face==='up' && target.pos==='atk' && curATK(target)===0
        && !!ctx.opponentCard && isCardInGroupV4(ctx.opponentCard,GROUP.REPTILIANNE);}}}
});
function u547KudabbiHandS03(card){
  const h=locateCardAnyV4(card);return h && h.zone==='mz' ? gameState.players[h.p].hand.length : -1;
}
defineUnifiedCardV4('魔轟神獣クダベ',[{
  key:'end-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onEndPhase'],forced:true,
  condition(ctx){return ctx.zone==='mz' && ctx.card.face==='up' && u547KudabbiHandS03(ctx.card)>=3;},
  operation(ctx){const h=locateCardAnyV4(ctx.card);if(h && h.zone==='mz')API.destroy(h,'魔轟神獣クダベ');},
  afterResolve(){}
}],{type:'monster',priority:1,timing:['free'],
  continuous:{scope:'self',from:['mz'],apply(){return null;},
    protectV21:{key:'u547.kudabbi',label:'魔轟神獣クダベ',
      battle(target,self){return target===self && u547KudabbiHandS03(self)===0;},
      effect(target,self){return target===self && u547KudabbiHandS03(self)===0;}}}
});
