/* S03-U245: 寡黙なるサイコプリースト, 沈黙のサイコウィザード (the two ENGINE_GAP cards — one script holding an optional and a forced trigger; since S03-U44 every v4 effect has its own `forced`),
   疾風!凶殺陣, 風雲カラクリ城, 底なし流砂, 化石発掘 (2011 texts).
   Reuses: per-effect forced triggers (engine/1ZB), API.setCardFlag (journaled FX_CARD_FLAG_V46), API.linkOnLeave ('destroy' / 'destroyIfDestroyed', engine/18),
   the stLinkTargetS03 / stLinkByS03 marks + continuous negateEffect (デモンズ・チェーン, cards/20), graveInfo {from, face, byDestroy, turn}, onDamageStep with dsTiming 'end',
   GROUP.SIX_SAMURAI_NAMED (「六武衆」と名のついた: 紫炎 cards are not in it, 真六武衆 are) and SETCODE.KARAKURI (monsters only: it also tags the Spell 黄金の歯車装置箱).

   Record of the banished monsters (サイコプリースト / サイコウィザード): the key psyBanishedS03U245 on the card itself (an array of uids, journaled with API.setCardFlag).
   It is NOT in ZONE_LOCAL_KEYS, so it survives the card's trip field → GY and the 「フィールド上から墓地へ送られた時」 trigger can still read it. It is cleared when that trigger resolves.
   Known limit: if the card leaves the field any other way (bounce, banish, ...) the record stays on the card until its next trigger.
   Rulings:
   - Both specially summon in Attack Position (engine convention, 死者蘇生 etc.).
   - サイコプリースト: 「反転召喚」 = onFlip with flipSummon (a flip by battle does not count). Its ② is an ignition effect (own Main Phase, once per turn); the cost is sending a hand card to the GY
     (not a discard); the Psychic target is chosen after the cost, so the card just sent may be that target (the condition accepts a Psychic in the hand too).
   - サイコウィザード: only the Normal Summon (not a Special Summon / Flip Summon) triggers the banish; a new Normal Summon starts a new record.
   - 疾風!凶殺陣: a forced trigger at the end of the damage step of a battle (a monster battled a monster — a direct attack is no battle) in which a 「六武衆」 monster of the player took part (it counts even
     if that monster was destroyed); every 「六武衆」 monster on the player's field at that time gets +300 until the End Phase; several battles stack.
   - 底なし流砂: every opponent End Phase (the "once" is per End Phase); all face-up monsters tied for the highest ATK on the field (both sides) are destroyed (the text has no 「1体」, so a tie destroys them all).
     The hand-size check of the own Standby Phase is made when the trigger is put on the chain.
   - 化石発掘: cost = discard 1; the Dinosaur is targeted after the cost; negation uses the same link marks as デモンズ・チェーン. */

const PSY_KEY_S03U245 = 'psyBanishedS03U245';
function isPsychicDbS03U245(db){ return !!db && db.k==='m' && db.ra==='サイキック'; }
function psychicsInGraveS03U245(p){ return API.pileCards(p, 'grave', x=>isPsychicDbS03U245(x.db)); }
/* the recorded monsters still banished (own side) */
function psyBanishedPoolS03U245(card, p){
  const uids = Array.isArray(card && card[PSY_KEY_S03U245]) ? card[PSY_KEY_S03U245] : [];
  return uids.map(u=>findCardByUid(u)).filter(h=>h && h.zone==='banish' && h.p===p && h.card.face!=='down');
}
function psyRecordS03U245(card, uids, name){
  const h = locateCardAnyV4(card);
  if(!h) return;
  API.setCardFlag(h, PSY_KEY_S03U245, uids && uids.length ? uids.slice() : null, name, {silent:true});
}
/* 「フィールド上から墓地へ送られた時」: this card itself, sent from the monster zone this turn */
function psySentFromFieldS03U245(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
function psyBanishOp(name, append){
  return function(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !isPsychicDbS03U245(dbOf(r.card))){ API.log(name+'：対象が墓地にないため不発'); return; }
    const uid = ensureCardUid(gameState, r.card);
    API.banish(r, name);
    const now = findCardByUid(uid);
    if(!now || now.zone!=='banish') return;
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz') return;
    const prev = append && Array.isArray(me.card[PSY_KEY_S03U245]) ? me.card[PSY_KEY_S03U245] : [];
    psyRecordS03U245(me.card, prev.concat([uid]), name);
  };
}
function psyRevivePool(ctx, name){
  return psyBanishedPoolS03U245(ctx.card, ctx.player).filter(h=>canEffectSpecialSummonS03(h.card, 'banish', name));
}

/* ---- 寡黙なるサイコプリースト ---- */
function priestFlipOrSummonS03U245(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || !eventIsSelfS03(ctx)) return false;
  return ctx.eventName==='onNormalSummon' || (ctx.eventName==='onFlip' && !!(ctx.event && ctx.event.flipSummon));
}
defineUnifiedCardV4('寡黙なるサイコプリースト', [{
  key:'to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onFlip'], forced:true,
  condition(ctx){ return priestFlipOrSummonS03U245(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up' && h.card.pos==='atk') API.changePosition(h, 'def', '寡黙なるサイコプリースト'); },
  afterResolve(){}
},{
  key:'banish-psychic', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    const hand = API.pileCards(ctx.player, 'hand');
    if(!hand.length){ ctx.reason = '墓地へ送る手札がありません'; return false; }
    if(!psychicsInGraveS03U245(ctx.player).length && !hand.some(x=>isPsychicDbS03U245(x.db))){ ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('寡黙なるサイコプリースト：墓地へ送る手札', API.pileCards(ctx.player, 'hand'), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, '寡黙なるサイコプリースト（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('寡黙なるサイコプリースト：除外するサイキック族', psychicsInGraveS03U245(ctx.player), t=>done([t])); },
  operation: psyBanishOp('寡黙なるサイコプリースト', true),
  afterResolve(){}
},{
  key:'revive-banished', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, targetRange:LOCATION.REMOVED, targetSide:'self', speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){
    if(!psySentFromFieldS03U245(ctx)){ ctx.reason = 'フィールド上から墓地へ送られた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!psyRevivePool(ctx, '寡黙なるサイコプリースト').length){ ctx.reason = 'このカードの効果で除外したモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('寡黙なるサイコプリースト：特殊召喚する除外モンスター', psyRevivePool(ctx, '寡黙なるサイコプリースト'), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const mine = psyBanishedPoolS03U245(ctx.card, ctx.player);
    if(r && r.zone==='banish' && mine.some(h=>h.card===r.card) && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'banish', r.index, 'atk', '寡黙なるサイコプリースト');
    psyRecordS03U245(ctx.card, null, '寡黙なるサイコプリースト');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['grave'], timing:['mainPhase'],
     countLimit:{n:1, effects:['banish-psychic']}, includesSpecialSummon:true,
     blocksIfNoSpecialSummon:ctx=>ctx.eventName==='onSendToGrave',
     passive:{
       onNormalSummon:ctx=>priestFlipOrSummonS03U245(ctx),
       onFlip:ctx=>priestFlipOrSummonS03U245(ctx),
       onSendToGrave:ctx=>psySentFromFieldS03U245(ctx) && hasMonsterZoneSpace(ctx.player) && psyRevivePool(ctx, '寡黙なるサイコプリースト').length>0 }});

/* ---- 沈黙のサイコウィザード ---- */
function wizardSummonedS03U245(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && eventIsSelfS03(ctx) && ctx.eventName==='onNormalSummon'; }
defineUnifiedCardV4('沈黙のサイコウィザード', [{
  key:'summon-banish', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['onNormalSummon'],
  condition(ctx){
    if(!wizardSummonedS03U245(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!psychicsInGraveS03U245(ctx.player).length){ ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('沈黙のサイコウィザード：除外するサイキック族', psychicsInGraveS03U245(ctx.player), t=>done([t])); },
  operation: psyBanishOp('沈黙のサイコウィザード', false),
  afterResolve(){}
},{
  key:'revive-banished', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){
    if(!psySentFromFieldS03U245(ctx)){ ctx.reason = 'フィールド上から墓地へ送られた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!psyRevivePool(ctx, '沈黙のサイコウィザード').length){ ctx.reason = 'このカードの効果で除外したモンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    /* "the monster banished by its effect": one per Normal Summon, so normally exactly one; each is summoned while a zone is free */
    psyRevivePool(ctx, '沈黙のサイコウィザード').forEach(x=>{
      const h = findCardByUid(x.card.uid);
      if(h && h.zone==='banish' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'banish', h.index, 'atk', '沈黙のサイコウィザード');
    });
    psyRecordS03U245(ctx.card, null, '沈黙のサイコウィザード');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['grave'], includesSpecialSummon:true,
     blocksIfNoSpecialSummon:ctx=>ctx.eventName==='onSendToGrave',
     passive:{
       onNormalSummon:ctx=>wizardSummonedS03U245(ctx) && psychicsInGraveS03U245(ctx.player).length>0,
       onSendToGrave:ctx=>psySentFromFieldS03U245(ctx) && hasMonsterZoneSpace(ctx.player) && psyRevivePool(ctx, '沈黙のサイコウィザード').length>0 }});

/* ---- 疾風!凶殺陣 (Continuous Trap): 自分フィールド上の「六武衆」と名のついたモンスターが戦闘を行った場合、このターンのエンドフェイズ時まで自分フィールド上の「六武衆」と名のついたモンスターの攻撃力は300ポイントアップする。 ---- */
function sixNamedMonsterDbS03U245(db){ return !!db && db.k==='m' && isCardInGroupV4(db, GROUP.SIX_SAMURAI_NAMED); }
function sixBattledS03U245(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || ctx.card.activationPending) return false;
  const b = ctx.battle || {};
  if(!b.atkCard || !b.defCard) return false;   /* a direct attack is no battle */
  const mine = b.atkOwner===ctx.player ? b.atkCard : (b.defOwner===ctx.player ? b.defCard : null);
  return !!mine && sixNamedMonsterDbS03U245(dbOf(mine));
}
function sixPoolS03U245(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && sixNamedMonsterDbS03U245(x.db)}); }
defineUnifiedCardV4('疾風!凶殺陣', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'battle-atk-up', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return ctx.step==='end' && sixBattledS03U245(ctx); },
  operation(ctx){ sixPoolS03U245(ctx.player).forEach(h=>API.modAtk(h, 300, 0, 'endPhase', '疾風!凶殺陣')); },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, dsTiming:'end', timing:['free'],
     passive:{ onDamageStep:ctx=>ctx.step==='end' && sixBattledS03U245(ctx) }});

/* ---- 風雲カラクリ城 (Field Spell) ---- */
function castleAttackS03U245(ctx){
  if(ctx.zone!=='field' || !ctx.card || ctx.card.face!=='up' || ctx.card.activationPending) return null;
  const a = gameState.pendingAttack;
  if(!a || a.player!==ctx.player || a.targetUid==null || a.attackerUid==null) return null;
  const at = findCardByUid(a.attackerUid), df = findCardByUid(a.targetUid);
  if(!at || at.zone!=='mz' || at.p!==ctx.player || at.card.face!=='up' || at.db.k!=='m' || !isSetCardV4(at.db, SETCODE.KARAKURI)) return null;
  if(!df || df.zone!=='mz' || df.p!==ctx.opponent || df.card.face!=='up') return null;
  return df;
}
function castleDestroyedS03U245(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!g && g.byDestroy===true && g.from==='field' && g.face==='up' && Number(g.turn)===Number(gameState.turn);
}
function castlePoolS03U245(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.KARAKURI) && Number(x.db.lv)>=4 && canEffectSpecialSummonS03(x.card, 'grave', '風雲カラクリ城'));
}
defineUnifiedCardV4('風雲カラクリ城', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.FIELD, speed:1, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'attack-change-position', type:EFFECT_TYPE.TRIGGER, range:LOCATION.FIELD, speed:1, events:['onAttackDeclare'],
  condition(ctx){ if(!castleAttackS03U245(ctx)){ ctx.reason = '自分の表側表示の「カラクリ」が相手の表側表示モンスターを攻撃対象に選択した時に発動します'; return false; } return true; },
  operation(ctx){
    const df = castleAttackS03U245(Object.assign({}, ctx, {zone:'field', card:ctx.card}));
    if(df) API.changePosition(df, df.card.pos==='atk' ? 'def' : 'atk', '風雲カラクリ城');
  },
  afterResolve(){}
},{
  key:'destroyed-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!castleDestroyedS03U245(ctx)){ ctx.reason = '表側表示のこのカードが破壊され墓地へ送られた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!castlePoolS03U245(ctx).length){ ctx.reason = '墓地にレベル4以上の「カラクリ」モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('風雲カラクリ城：特殊召喚するレベル4以上の「カラクリ」', castlePoolS03U245(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && h.p===ctx.player && hasMonsterZoneSpace(ctx.player) && isSetCardV4(dbOf(h.card), SETCODE.KARAKURI) && Number(dbOf(h.card).lv)>=4)
      API.specialSummon(ctx.player, 'grave', h.index, 'atk', '風雲カラクリ城');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, activateFrom:['hand','field','grave'], includesSpecialSummon:true,
     blocksIfNoSpecialSummon:ctx=>ctx.eventName==='onSendToGrave',
     passive:{
       onAttackDeclare:ctx=>!!castleAttackS03U245(ctx),
       onSendToGrave:ctx=>castleDestroyedS03U245(ctx) && hasMonsterZoneSpace(ctx.player) && castlePoolS03U245(ctx).length>0 },
     continuous:{scope:'self', from:['field'], apply(){ return null; }}});

/* ---- 底なし流砂 (Continuous Trap) ---- */
function sandReadyS03U245(ctx){ return ctx.zone==='sz' && !!ctx.card && ctx.card.face==='up' && !ctx.card.activationPending; }
function sandTopS03U245(){
  const ms = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'});
  if(!ms.length) return [];
  const top = Math.max.apply(null, ms.map(x=>curATK(x.card)));
  return ms.filter(x=>curATK(x.card)===top);
}
function sandEndS03U245(ctx){ return sandReadyS03U245(ctx) && gameState.phase==='end' && gameState.activePlayer===ctx.opponent && sandTopS03U245().length>0; }
function sandStandbyS03U245(ctx){ return sandReadyS03U245(ctx) && gameState.phase==='standby' && gameState.activePlayer===ctx.player && API.me(ctx).hand.length<=4; }
defineUnifiedCardV4('底なし流砂', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'opponent-end-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return sandEndS03U245(ctx); },
  operation(){ sandTopS03U245().forEach(x=>API.destroy(x, '底なし流砂')); },
  afterResolve(){}
},{
  key:'standby-self-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return sandStandbyS03U245(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz') API.destroy(h, '底なし流砂'); },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, destroysFieldV46:true,
     passive:{ onEndPhase:ctx=>sandEndS03U245(ctx), onStandbyPhase:ctx=>sandStandbyS03U245(ctx) }});

/* ---- 化石発掘 (Continuous Trap) ---- */
function fossilDinoDbS03U245(db){ return !!db && db.k==='m' && db.ra==='恐竜'; }
function fossilPoolS03U245(p){ return API.pileCards(p, 'grave', x=>fossilDinoDbS03U245(x.db) && canEffectSpecialSummonS03(x.card, 'grave', '化石発掘')); }
function fossilLinked(target, self){ return !!(target && self && self.face==='up' && self.stLinkTargetS03!=null && self.stLinkTargetS03===target.uid && target.stLinkByS03===self.uid); }
defineUnifiedCardV4('化石発掘', [{
  key:'revive-dinosaur', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    const hand = API.pileCards(ctx.player, 'hand');
    if(!hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!fossilPoolS03U245(ctx.player).length && !hand.some(x=>fossilDinoDbS03U245(x.db))){ ctx.reason = '墓地に恐竜族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('化石発掘：捨てる手札', API.pileCards(ctx.player, 'hand'), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '化石発掘（コスト）', {byEffect:false}); done(true);
    });
  },
  target(ctx, done){ API.selectCard('化石発掘：特殊召喚する恐竜族', fossilPoolS03U245(ctx.player), t=>done([t])); },
  operation(ctx){
    const picked = ctx.selectedTargets && ctx.selectedTargets[0], r = picked && resolveTarget(picked);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !fossilDinoDbS03U245(dbOf(r.card)) || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '化石発掘');
    const self = locateCardAnyV4(ctx.card), mon = findCardByUid(uid);
    if(!self || self.zone!=='sz' || !mon || mon.zone!=='mz') return;
    ensureCardUid(gameState, self.card);
    API.setCardFlag(self, 'stLinkTargetS03', mon.card.uid, '化石発掘', {silent:true});
    const mon2 = findCardByUid(uid);
    API.setCardFlag(mon2, 'stLinkByS03', self.card.uid, '化石発掘', {silent:true});
    API.linkOnLeave(mon2, self, 'destroy', '化石発掘');                    /* this card leaves the field → that monster is destroyed */
    API.linkOnLeave(self, mon2, 'destroyIfDestroyed', '化石発掘');         /* that monster is destroyed → this card is destroyed */
  },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
     continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; }, negateEffect(target, self){ return fossilLinked(target, self); }}});
