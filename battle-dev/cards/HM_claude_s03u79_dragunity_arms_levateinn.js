/* S03-U79 — ドラグニティアームズ－レヴァテイン (Dragunity main deck, NOT_STARTED, no flagged engine gap).
   Priority #7 (fixed major-deck audit). Real text (this project's own card database, printed 2010-06-19,
   within cutoff), Level 8 WIND Dragon Effect Monster:
   ①：このカードは自分フィールド上に表側表示で存在する「ドラグニティ」と名のついたカードを装備したモンスター
      1体をゲームから除外し、手札または墓地から特殊召喚する事ができる。
   ②：このカードが召喚・特殊召喚に成功した時、「ドラグニティアームズ－レヴァテイン」以外の自分の墓地に存在する
      ドラゴン族モンスター1体を選択し、装備カード扱いとしてこのカードに装備する事ができる。
   ③：このカードが相手のカードの効果によって墓地へ送られた時、装備カード扱いとしてこのカードに装備された
      モンスター1体を特殊召喚する事ができる。

   Every piece reuses existing primitives — no new engine capability needed:
   ① summonProcedure (engine/40_legal_script_engine.js / engine/70_summon_procedures.js), already supports
      an array of source zones (from:['hand','grave']), generically scanned for both zones (confirmed via
      pileDuelActionsV370). Cost: banish (API.banish) a real own face-up monster whose attached equip
      (equipsOnV15) includes a card in SETCODE.DRAGUNITY.
   ② The exact same "grave-equip" primitive already used by 3 other Dragunity Synchros in this codebase
      (cards/H1_claude_s03_dragunity.js, cards/F9_astra_system01.js: as01Pool/as01EquipChoice/
      API.equipFromGrave/graveEquipLegalV31, System v31 "Astra 01") — only the predicate differs (any
      Dragon-type monster, no Level/archetype restriction, excluding this card's own name by real text).
   ③ API.movedByOpponentEffect (precedent: 突風, cards/89_p11_activation_choice_recovery.js) for "sent to the
      GY by an opponent's card effect", plus a new card-local bookkeeping field (u79LevaEquipUid, NOT in
      ZONE_LOCAL_KEYS so it survives this card's own move to the GY — the same kind of instance-local flag
      already used pervasively in this codebase, e.g. v46StardustReturnTurn) recording which monster ② last
      equipped, since equippedBy/equipTo ARE in ZONE_LOCAL_KEYS and get wiped by reset() the moment this
      card itself leaves the field — read at ③'s own trigger time. */

function u79LevaDragon(x){ return x.db.k==='m' && x.db.ra==='ドラゴン' && x.db.n!=='ドラグニティアームズ－レヴァテイン'; }
function u79LevaPool(ctx){
  const self=locateCardAnyV4(ctx.card);
  return API.pileCards(ctx.player,'grave',x=>u79LevaDragon(x)&&graveEquipLegalV31(gameState,ctx.player,x,self));
}
function u79LevaDragunityHosts(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>x.card.face==='up'
    &&equipsOnV15(x.card,gameState).some(eq=>isSetCardV4(dbOf(eq.card),SETCODE.DRAGUNITY))});
}
function u79LevaSentByOpponent(ctx){
  const e=ctx.event||{};
  if(!ctx.card||e.uid!==ctx.card.uid||e.toZone!=='grave') return false;
  return API.movedByOpponentEffect(ctx.card,ctx.player);
}

defineUnifiedCardV4('ドラグニティアームズ－レヴァテイン',[
  {
    key:'equip-from-grave',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
    events:['onNormalSummon','onSpecialSummon'],categories:{destroy:false},
    condition(ctx){return as01Face(ctx)&&as01SelfEvent(ctx)&&u79LevaPool(ctx).length>0;},
    operation(ctx){
      const self=locateCardAnyV4(ctx.card),target=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
      if(!self||self.zone!=='mz'||self.card.face!=='up'||!target||target.zone!=='grave'
        ||target.p!==ctx.player||!u79LevaDragon({db:dbOf(target.card)})) return;
      if(API.equipFromGrave(ctx.player,target,self,cardName(ctx.card),ctx.card.uid,ctx.chainId))
        API.setCardFlag(self,'u79LevaEquipUid',target.card.uid,cardName(ctx.card),{silent:true});
    },
    afterResolve(){}
  },
  {
    key:'equip-monster-revive',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,
    events:['onLeaveField'],categories:{destroy:false},
    condition(ctx){
      if(!u79LevaSentByOpponent(ctx)) return false;
      if(ctx.card.u79LevaEquipUid==null) return false;
      const h=findCardByUid(ctx.card.u79LevaEquipUid);
      return !!(h&&h.zone==='grave'&&h.p===ctx.player&&hasMonsterZoneSpace(ctx.player));
    },
    operation(ctx){
      if(ctx.card.u79LevaEquipUid==null) return;
      const h=findCardByUid(ctx.card.u79LevaEquipUid);
      if(!h||h.zone!=='grave'||h.p!==ctx.player||!hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player,'grave',h.index,'atk','ドラグニティアームズ－レヴァテイン');
    },
    afterResolve(){}
  }
],{
  type:'monster',priority:1,targets:true,includesSpecialSummon:true,
  summonProcedure:{
    from:['hand','grave'],positions:['atk','def'],
    condition(ctx){return hasMonsterZoneSpace(ctx.player)&&u79LevaDragunityHosts(ctx.player).length>0;},
    cost(ctx,done){
      const pool=u79LevaDragunityHosts(ctx.player);
      if(!pool.length){done(false);return;}
      API.selectCard('ドラグニティアームズ－レヴァテイン：除外する「ドラグニティ」装備モンスター',pool,t=>{
        const r=resolveTarget(t);
        if(!r){done(false);return;}
        API.banish(r,'ドラグニティアームズ－レヴァテイン（特殊召喚手順）');
        done(true);
      });
    }
  },
  activationV11(ctx,d){
    if(d.v4EffectKey==='equip-monster-revive'||(d.v4EffectKey==null&&d.eventName==='onLeaveField')){
      p11cCommit(d,[],'equip-monster-revive');
      return;
    }
    p11cOpen(d,{title:d.name+'：墓地から装備するドラゴン族モンスター',candidates:u79LevaPool(ctx),targeting:true},
      'p11cards.commit-targets',{mode:'equip'});
  },
  passive:{
    onNormalSummon(ctx){return as01Face(ctx)&&as01SelfEvent(ctx)&&u79LevaPool(ctx).length>0;},
    onSpecialSummon(ctx){return as01Face(ctx)&&as01SelfEvent(ctx)&&u79LevaPool(ctx).length>0;},
    onLeaveField(ctx){
      if(!u79LevaSentByOpponent(ctx)) return false;
      if(ctx.card.u79LevaEquipUid==null) return false;
      const h=findCardByUid(ctx.card.u79LevaEquipUid);
      return !!(h&&h.zone==='grave'&&h.p===ctx.player&&hasMonsterZoneSpace(ctx.player));
    }
  }
});
