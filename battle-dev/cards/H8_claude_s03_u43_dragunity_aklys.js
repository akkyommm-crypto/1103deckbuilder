/* =========================================================================
   S03-U43 — ドラグニティ－アキュリス (R1-v1: Astra's fixed lists 1103_MAJOR_DECKS_v1)
   -------------------------------------------------------------------------
   Found on the real-duel path: in 48 fixed-list duels this card was Normal Summoned 28 times and its effects never happened
   (NOT_STARTED, no script), so it played as a vanilla monster.
   2011 text: 「このカードが召喚に成功した時、手札から「ドラグニティ」と名のついたモンスター1体を特殊召喚し、このカードを
   装備カード扱いとして装備する事ができる。モンスターに装備されているこのカードが墓地へ送られた時、フィールド上に存在する
   カード1枚を選択して破壊する。」
   2011 rulings (yugioh-wiki 《ドラグニティ－アキュリス》 age 85, 2011-08-21):
   - both are Trigger Effects; the equip follows the Special Summon, not simultaneously (10/06/19);
   - the destroy effect targets 1 card (10/06/19);
   - it does not activate if the equipped monster left the field first (the equip is then sent by rule) (10/08/20),
     nor when the monster becomes Xyz Material (11/08/20); it activates when destroyed together with the monster (10/09/11).
   Engine assets only (no engine change): v4 triggers, P1 resolution choice (U41 waits for it), API.specialSummon,
   API.equipMonster (FX_MONSTER_EQUIP_V46), P1.1 activation targeting (p11cOpen / p11cards.commit-targets),
   onLeaveField (fromZone 'sz'), graveInfo.rule 'equip' for equips sent by rule (engine/1N sendOrphanEquipV31).
   ========================================================================= */
function u43AklysDragunityHand(p){
  return API.pileCards(p,'hand',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.DRAGUNITY));
}
function u43AklysSentWhileEquipped(ctx){
  const e=ctx.event||{};
  if(!ctx.card||e.uid!==ctx.card.uid||e.fromZone!=='sz'||e.toZone!=='grave') return false;
  if(dbOf(ctx.card).k!=='m') return false;
  /* 装備モンスターが先に場を離れ、ルールで墓地へ送られた場合は発動しない（10/08/20, 11/08/20） */
  const gi=ctx.card.graveInfo||{};
  return gi.rule!=='equip';
}
API.registerChoiceHandler('u43.aklys-special',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(!h||h.p!==args.player||h.zone!=='hand'||!hasMonsterZoneSpace(args.player)) return;
  ensureCardUid(gameState,h.card);
  const uid=h.card.uid;
  API.specialSummon(args.player,'hand',h.index,'atk','ドラグニティ－アキュリス');
  const host=findCardByUid(uid);
  const self=args.selfUid!=null?findCardByUid(args.selfUid):null;
  /* 特殊召喚した後で装備する。このカードが場に表側表示で残っていなければ装備はできない */
  if(host&&host.zone==='mz'&&self&&self.zone==='mz'&&self.p===args.player&&self.card.face==='up')
    API.equipMonster(args.player,self,host,'ドラグニティ－アキュリス');
});
defineUnifiedCardV4('ドラグニティ－アキュリス',[
  {
    key:'summon-special-equip',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onNormalSummon'],
    condition(ctx){
      const e=ctx.event||{};
      if(!(e.uid===ctx.card.uid||e.card===ctx.card)) return false;
      return hasMonsterZoneSpace(ctx.player)&&u43AklysDragunityHand(ctx.player).length>0;
    },
    operation(ctx){
      const cands=u43AklysDragunityHand(ctx.player);
      if(!cands.length||!hasMonsterZoneSpace(ctx.player)) return;
      ensureCardUid(gameState,ctx.card);
      v49P1Open(ctx,{kind:'card',title:'ドラグニティ－アキュリス：特殊召喚する「ドラグニティ」モンスター',candidates:cands,min:1,max:1},
        'u43.aklys-special',{selfUid:ctx.card.uid},false);
    },
    afterResolve(){}
  },
  {
    key:'sent-while-equipped-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,targetRange:LOCATION.ONFIELD,targetSide:'both',
    speed:1,events:['onLeaveField'],forced:true,
    condition(ctx){ return u43AklysSentWhileEquipped(ctx)&&API.fieldCards({}).length>0; },
    operation(ctx){
      const t=ctx.selectedTargets&&ctx.selectedTargets[0], h=t&&resolveTarget(t);
      if(h&&['mz','sz','field'].includes(h.zone)) API.destroy(h,'ドラグニティ－アキュリス');
    },
    afterResolve(){}
  }
],{type:'monster',priority:1,targets:true,includesSpecialSummon:true,
  activationV11(ctx,d){
    /* 誘発の発動時、記述子の v4EffectKey はまだ決まっていない（null）。どの効果かは発動イベントで決める */
    const destroyS03=d.v4EffectKey==='sent-while-equipped-destroy'||(d.v4EffectKey==null&&d.eventName==='onLeaveField');
    if(!destroyS03){ p11cCommit(d,[],d.v4EffectKey||null); return; }
    p11cOpen(d,{title:'ドラグニティ－アキュリス：破壊するフィールドのカード',candidates:API.fieldCards({}),targeting:true,cancelable:false},
      'p11cards.commit-targets',{mode:'sent-while-equipped-destroy'});
  },
  passive:{
    onNormalSummon(ctx){ const e=ctx.event||{}; return (e.uid===ctx.card.uid||e.card===ctx.card)&&hasMonsterZoneSpace(ctx.player)&&u43AklysDragunityHand(ctx.player).length>0; },
    onLeaveField(ctx){ return u43AklysSentWhileEquipped(ctx)&&API.fieldCards({}).length>0; }
  }
});
