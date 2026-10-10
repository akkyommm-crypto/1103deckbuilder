/* Existing-engine Class A recovery — sub-batch 5.
   Card scripts only: P1/P1.1, P4, v6, v14, v15, v17 and v20. */

function ca5CommitOne(answer,args){
  const q=p11cCards(answer);
  if(answer.cancelled||q.length!==1)return p11cAbort(args.activation);
  p11cCommit(args.activation,q,args.mode||null);
}
function ca5ArmoryPick(answer,args){
  const q=p11cCards(answer);
  if(answer.cancelled||q.length!==1)return;
  const h=findCardByUid(q[0].uid);
  if(h&&h.p===args.player&&h.zone==='deck'&&dbOf(h.card).k==='s'&&dbOf(h.card).sub==='装備')
    API.mill(args.player,h.index,'武器庫荒らし');
}

API.registerChoiceHandler('classa5.commit-one',ca5CommitOne);
API.registerChoiceHandler('classa5.armory-pick',ca5ArmoryPick);

/* 装備モンスターが相手へ与える戦闘ダメージを1000に置換する。 */
defineUnifiedCardV4('心眼の鉾',[],{type:'spell',subtype:'装備',priority:1,
  equipSpec:{canEquip(h){return h.zone==='mz'&&h.card.face==='up';}},
  continuous:{scope:'equippedMonster',from:['sz'],apply(){return null;},battleDamage(info){
    const self=info.self,to=self&&self.equipTo;
    if(!to||info.to===info.srcPlayer||Number(info.amount)<=0)return info.amount;
    return ((info.atkCard&&info.atkCard.uid===to.uid)||(info.defCard&&info.defCard.uid===to.uid))?1000:info.amount;
  }}});

defineUnifiedCardV4('黄金色の竹光',[{
  key:'draw-two-with-bamboo-equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).deck.length>=2&&API.fieldCards({player:ctx.player,zone:'sz',filter:x=>
    x.card.face==='up'&&x.db.k==='s'&&x.db.sub==='装備'&&isCardInGroupV4(x.db,GROUP.BAMBOO_SWORD)}).length>0;},
  operation(ctx){API.draw(ctx.player,2);},afterResolve(){}
}],{type:'spell',priority:1});

defineUnifiedCardV4('サンライト・ユニコーン',[{
  key:'reveal-top-equip',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return ctx.card.face==='up'&&API.me(ctx).deck.length>0;},
  operation(ctx){
    const top=API.deckTop(ctx.player,1)[0];if(!top)return;
    API.reveal({player:ctx.player,audience:'both',cards:[top],label:'サンライト・ユニコーン',until:'resolution'});
    const h=findCardByUid(top.card.uid);if(!h||h.zone!=='deck')return;
    const d=dbOf(h.card);
    if(d.k==='s'&&d.sub==='装備')API.deckToHand(ctx.player,h.index,'サンライト・ユニコーン');
    else API.orderToDeck(ctx.player,[top.card.uid],true,'サンライト・ユニコーン');
  },afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});

defineUnifiedCardV4('D・ビデオン',[],{type:'monster',priority:1,
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self||self.face!=='up')return null;
    const h=locateCardAnyV4(self),n=h?API.equipCount(h):0;
    return self.pos==='atk'?{atk:n*800}:{def:n*800};
  }}});

defineUnifiedCardV4('ヴァイロン・チャージャー',[],{type:'monster',priority:1,
  continuous:{scope:'ownMonsters',from:['mz'],apply(card,self){
    if(!self||self.face!=='up'||card.face!=='up'||currentAttributeV17(card)!=='光')return null;
    const h=locateCardAnyV4(self);return {atk:(h?API.equipCount(h):0)*300};
  }}});

defineUnifiedCardV4('武器庫荒らし',[{
  key:'opponent-sends-equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return API.pileCards(ctx.opponent,'deck',x=>x.db.k==='s'&&x.db.sub==='装備').length>0;},
  operation(ctx){
    const q=API.pileCards(ctx.opponent,'deck',x=>x.db.k==='s'&&x.db.sub==='装備');if(!q.length)return;
    API.requestChoice({player:ctx.opponent,kind:'card',title:'武器庫荒らし：墓地へ送る装備魔法',candidates:q,min:1,max:1,
      cancelable:false,resume:{handler:'classa5.armory-pick',args:{player:ctx.opponent}},meta:{scriptName:'武器庫荒らし'}});
  },afterResolve(){}
}],{type:'trap',priority:2});

defineScript('レプティレス・バイパー',{type:'monster',priority:1,targets:true,
  condition(ctx){return ctx.eventName==='onNormalSummon'&&ctx.zone==='mz'&&ctx.event&&ctx.event.card===ctx.card
    &&hasMonsterZoneSpace(ctx.player)&&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&curATK(x.card)===0}).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'レプティレス・バイパー：コントロールを得る攻撃力0のモンスター',
    candidates:API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&curATK(x.card)===0}),targeting:true,min:1,max:1},
    'classa5.commit-one',{});},
  resolve(ctx){const h=ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]);
    if(h&&h.p===ctx.opponent&&h.zone==='mz'&&hasMonsterZoneSpace(ctx.player))API.changeControl(h,ctx.player,'レプティレス・バイパー');},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz'&&ctx.event&&ctx.event.card===ctx.card;}}});

defineUnifiedCardV4('ドラグニティ－ファランクス',[{
  key:'self-summon-from-equip',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return ctx.card.v46MonsterEquip===true&&!!ctx.card.equipTo&&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){const h=locateCardAnyV4(ctx.card);if(!h||h.zone!=='sz'||!API.detachEquip(h,'ドラグニティ－ファランクス'))return;
    const now=locateCardAnyV4(ctx.card);if(now&&now.zone==='sz'&&hasMonsterZoneSpace(ctx.player))API.specialSummon(ctx.player,'sz',now.index,'atk','ドラグニティ－ファランクス');},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true});
