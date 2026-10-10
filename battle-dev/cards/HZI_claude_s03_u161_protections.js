/* S03-U161: monsters whose battle protection depends on a condition (read as unconditional from the text until S03-U158),
   implemented with their full 2011 texts. */

/* イレカエル (2011): 「自分フィールド上に存在するモンスター1体を生け贄に捧げる。自分のデッキから「ガエル」と名のついたモンスター1体を
   選択し、自分フィールド上に特殊召喚する。このカードがフィールド上に存在する限り、「ガエル」と名のついたモンスターは戦闘によっては
   破壊されない。」
   - Ignition effect; the Tribute is the cost (any own monster, this card included). The Deck is examined at resolution (no target)
     through the shared deck-trigger choice (engine/1ZT handler), 「特殊召喚する」 without a position → face-up, the player's choice.
   - 「ガエル」と名のついた = GROUP.GAERU (P4 overlay, S03-U161: 10 cards; イレカエル / サシカエル / 粋カエル are not members).
   - The protection applies to every 「ガエル」 monster on the field (both players) while this card is face-up (a face-down monster
     applies no continuous effect). */
const IREKAERU_SPEC_S03 = {action:'summon', from:['deck'], filter:{group:'GAERU'}};
/* a monster on the field belongs to a named group also when its name is treated as a member's (粋カエル 「フィールド上に表側表示で
   存在する限り『デスガエル』として扱う」): the canonical passcode (canonicalCardCodeV4) is checked as well */
function groupMemberNowS03(card, key){
  if(isCardInGroupV4(card, key)) return true;
  const can = (typeof canonicalCardCodeV4==='function') ? canonicalCardCodeV4(card) : 0;
  return !!can && can!==cardCodeOfV4(card) && isCardInGroupV4(can, key);
}
defineScript('イレカエル', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドの表側表示のこのカードの効果です'; return false; }
    if(!API.fieldCards({zone:'mz', player:ctx.player, filter:x=>!x.card.cannotTribute}).length){ ctx.reason = 'リリースできるモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('イレカエル：リリースする自分のモンスター', API.fieldCards({zone:'mz', player:ctx.player, filter:x=>!x.card.cannotTribute}), t=>{
      API.sendToGrave(t, 'イレカエル（リリース）'); done(true);
    });
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ API.log('イレカエル：モンスターゾーンが空いていない'); return; }
    const pool = deckTriggerPoolS03('イレカエル', IREKAERU_SPEC_S03, ctx.player);
    if(!pool.length){ API.shuffle(ctx.player); API.log('イレカエル：「ガエル」と名のついたモンスターがデッキに無い（デッキをシャッフル）'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'イレカエル：特殊召喚する「ガエル」', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'イレカエル', action:'summon', pos:'faceUp'}}, meta:{scriptName:'イレカエル'}});
  },
  afterResolve(){},
  includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'イレカエル', label:'イレカエル',
      battle:(target, self)=> self.face==='up' && groupMemberNowS03(target, GROUP.GAERU) }
  }
});

/* エレキーウィ (2011): 「このカードがフィールド上に表側表示で存在する限り、自分フィールド上に存在する「エレキ」と名のついたモンスターが
   攻撃する場合、攻撃モンスターは戦闘では破壊されない。」
   「エレキ」 = GROUP.WATT (P4 overlay, 24 cards, this card included). Only the attacking side: the battle-destruction check passes
   battleRole (engine/00 S03-U161). */
defineScript('エレキーウィ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'エレキーウィ', label:'エレキーウィ',
      battle:(target, self, pctx)=> self.face==='up' && !!pctx && pctx.battleRole==='attacker' && groupMemberNowS03(target, GROUP.WATT) }
  }
});

/* 万力魔神バイサー・デス (2011): 「①:このカードの召喚に成功した場合、相手フィールドのモンスター1体を対象として発動する。発動後、3回目の
   自分スタンバイフェイズに対象のモンスターを破壊する。②:このカードの①の効果の対象のモンスターがフィールドに存在している限り、このカードは
   戦闘では破壊されない。」
   - ① forced trigger on its Normal Summon, targeting at activation. At resolution the target gets the zone-local mark
     u161ViceMarkedBy = this card's uid and this card gets u161ViceTargetUid = the target's uid; the destruction is scheduled for the
     3rd own Standby Phase after activation (own turn T → turn T+6). It happens even if this card has left the field (the effect
     has resolved), but only to that same monster (the mark is zone-local).
   - ② while both still carry the link (neither has left the field since), this card is not destroyed by battle. */
function viceTargetOnFieldS03(self){
  if(!self || self.u161ViceTargetUid==null) return false;
  const h = findCardByUid(self.u161ViceTargetUid);
  return !!(h && h.zone==='mz' && h.card.u161ViceMarkedBy===self.uid);
}
defineScript('万力魔神バイサー・デス', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone!=='mz' || (ctx.eventName && ctx.eventName!=='onNormalSummon') || !eventIsSelfS03(ctx)){ ctx.reason = 'このカードの召喚に成功した時に発動します'; return false; }
    if(!API.fieldCards({zone:'mz', player:ctx.opponent}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('万力魔神バイサー・デス：対象にする相手モンスター', API.fieldCards({zone:'mz', player:ctx.opponent}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone!=='mz'){ API.log('万力魔神バイサー・デス：対象のモンスターがフィールドにいない'); return; }
    const me = locateCard(ctx.card);
    ensureCardUid(gameState, r.card); ensureCardUid(gameState, ctx.card);
    API.setCardFlag(r, 'u161ViceMarkedBy', ctx.card.uid, '万力魔神バイサー・デス', {silent:true});
    if(me && me.zone==='mz') API.setCardFlag(me, 'u161ViceTargetUid', r.card.uid, '万力魔神バイサー・デス', {silent:true});
    API.schedule({at:'standbyPhase', turns:(gameState.activePlayer===ctx.player?6:5), player:ctx.player, handler:'s03u161.vice-destroy',
      args:{uid:r.card.uid, by:ctx.card.uid, player:ctx.player}, note:'万力魔神バイサー・デス（3回目の自分スタンバイフェイズに破壊）'});
    API.log(`万力魔神バイサー・デス：${cardName(r.card)} は3回目の自分スタンバイフェイズに破壊される`);
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'万力魔神バイサー・デス', label:'万力魔神バイサー・デス',
      battle:(target, self)=> target===self && viceTargetOnFieldS03(self) }
  }
});
API.registerScheduleHandler('s03u161.vice-destroy', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='mz' || h.card.u161ViceMarkedBy!==args.by){ API.log('万力魔神バイサー・デス：対象のモンスターはもうフィールドにいない'); return; }
  API.destroy({p:h.p, zone:h.zone, index:h.index, card:h.card}, '万力魔神バイサー・デス', args.player);
});
