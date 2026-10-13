/* S03-U319: five more 「BF」 (Blackwing) monsters (carddata texts; 「BF」 = setcode SETCODE.BLACKWING, as the earlier BF cards of S03-U254 / U257).

   BF－そよ風のブリーズ     このカードがカードの効果によって自分のデッキから手札に加わった場合、このカードを手札から特殊召喚できる。このカードをシンクロ素材とする場合、「BF」と名のついたモンスターのシンクロ召喚にしか使用できない。
   BF－逆風のガスト        自分フィールド上にカードが存在しない場合、このカードは手札から特殊召喚する事ができる。このカードがフィールド上に表側表示で存在する限り、相手モンスターが自分フィールド上に存在する「BF」と名のついた
                           モンスターを攻撃する場合、その攻撃モンスターはダメージステップの間攻撃力が300ポイントダウンする。
   BF－追い風のアリゼ      自分フィールド上に表側表示で存在する「BF」と名のついたモンスターが2体以上破壊されたターン、このカードは手札から特殊召喚する事ができる。このカードがシンクロ召喚の素材として墓地へ送られた場合、
                           自分は600ライフポイント回復する。
   BF－二の太刀のエテジア   自分フィールド上に存在する「BF」と名のついたモンスターが相手モンスターとの戦闘を行ったダメージステップ終了時にその相手モンスターがフィールド上に存在する場合、このカードを手札から墓地へ送って発動する事ができる。
                           相手ライフに1000ポイントダメージを与える。
   BF－天狗風のヒレン      このカードが墓地に存在し、相手モンスターの直接攻撃によって自分が2000ポイント以上の戦闘ダメージを受けた時、自分の墓地に存在する「BF」と名のついたレベル3以下のモンスター1体を選択して発動する。選択した
                           モンスターとこのカードを墓地から特殊召喚する。この効果で特殊召喚したモンスターの効果は無効化される。「BF－天狗風のヒレン」の効果はデュエル中に1度しか使用できない。

   Notes
   - ブリーズ: the Deck-to-hand event is the one of S03-U275 (onAddToHand, from:'deck'); the Special Summon position is the player's choice (S03-U278). The Synchro Material restriction is the card's synchroMaterialRestriction
     (engine/20): only a Synchro Monster that is itself a 「BF」 may be Synchro Summoned with it.
   - ガスト / アリゼ: Special Summon procedures from the hand (summonProcedure, as 氷結界の交霊師). ガスト: 「カードが存在しない」 = no card in my Monster / Spell & Trap / Field Zone. アリゼ: the destruction log of engine/1M
     (destroyedThisTurnV30: this turn, from the Monster Zone, face-up when destroyed, by either route) counts distinct 「BF」 monsters of mine, two or more.
   - ガスト' ATK reduction: a continuous modifier of the attacking opponent monster while the Damage Step is open and the monster it attacks is a 「BF」 of the card's controller.
   - エテジア: quick effect from the hand at the end of the Damage Step (dsTiming 'end'); the monster that battled the opponent's monster is a 「BF」 of mine (it may have been destroyed in that battle) and that opponent monster is still
     on the field. Cost: send this card from the hand to the Graveyard.
   - ヒレン: trigger from the Graveyard on the opponent's direct-attack battle damage (onBattleDamage, direct, amount ≥ 2000, dealt to me); the once per Duel is a player flag (all copies share it). Both monsters are summoned with the
     S03 negateOnSummonS03 option (effect negation, permanent). Not done in this unit: コガラシ (the lock after its Synchro Summon has no ruled duration), ボーラ, アウロラ. */

function u319Bf(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.BLACKWING); }
function u319Field(p){ const P = gameState.players[p]; return (P.mz||[]).filter(Boolean).length + (P.sz||[]).filter(Boolean).length + (P.field ? 1 : 0); }

/* ---- ブリーズ ---- */
function u319BreezeAdded(ctx){
  const e = ctx.event || {};
  if(e.from !== 'deck' || e.uid == null || !ctx.card || e.uid !== ctx.card.uid || e.player !== ctx.player) return false;
  const h = locateCardAnyV4(ctx.card);
  return !!h && h.zone === 'hand' && h.p === ctx.player;
}
defineUnifiedCardV4('BF－そよ風のブリーズ', [{
  key:'added-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onAddToHand'],
  condition(ctx){
    if(!u319BreezeAdded(ctx)){ ctx.reason = 'カードの効果で自分のデッキから手札に加わった時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    specialSummonPositionsS03(ctx.player, [{uid:ctx.card.uid, from:'hand'}], 'BF－そよ風のブリーズ');
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, activateFrom:['hand'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  passive:{ onAddToHand: ctx => u319BreezeAdded(ctx) },
  synchroMaterialRestriction(info){ return u319Bf(info && info.exDb); }
});

/* ---- ガスト ---- */
defineScript('BF－逆風のガスト', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u319Field(ctx.player) > 0){ ctx.reason = '自分フィールド上にカードが存在しない場合に特殊召喚できます'; return false; } return true; },
    cost(ctx, done){ done(true); }
  },
  continuous:{ scope:'allMonsters', from:['mz'],
    apply(card, self){
      if(!self || self.face!=='up' || !card || card.face!=='up' || !a5InDamageStep() || !a5IsAttackerCard(card)) return null;
      const s = locateCard(self), t = locateCard(card), other = a5BattleOtherOf(card), o = other ? locateCard(other) : null;
      if(!s || !t || !o || t.p===s.p || o.p!==s.p || o.zone!=='mz' || !u319Bf(dbOf(other))) return null;
      return {atk:-300};
    } }
});

/* ---- アリゼ ---- */
function u319BfDestroyed(p){
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  const seen = [];
  log.forEach(x=>{
    if(!x || x.turn !== gameState.turn || x.from !== 'mz' || x.face !== 'up' || x.victimPlayer !== p || x.uid == null) return;
    const h = findCardByUid(x.uid);
    if(h && u319Bf(dbOf(h.card)) && seen.indexOf(x.uid) < 0) seen.push(x.uid);
  });
  return seen.length;
}
function u319AlizeMaterial(ctx){ return ctx.zone==='grave' && (ctx.event||{}).reason==='synchroMaterial' && eventIsSelfS03(ctx); }
defineScript('BF－追い風のアリゼ', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.eventName!=='onSendToGrave' || !u319AlizeMaterial(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.recoverLP(ctx.player, 600, 'BF－追い風のアリゼ'); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return u319AlizeMaterial(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u319BfDestroyed(ctx.player) < 2){ ctx.reason = '「BF」が2体以上破壊されたターンに特殊召喚できます'; return false; } return true; },
    cost(ctx, done){ done(true); }
  }
});

/* ---- エテジア ---- */
function u319EtezyaFoe(ctx){
  const b = gameState.battle;
  if(!b || b.step !== 'end' || b.target === 'direct') return null;
  const aU = b.atkUid, dU = b.targetUid;
  if(aU == null || dU == null) return null;
  const a = findCardByUid(aU), d = findCardByUid(dU);
  if(!a || !d) return null;
  const mine = x=>x.p===ctx.player && u319Bf(dbOf(x.card)) && (x.zone==='mz' || x.zone==='grave');
  const foe = mine(a) ? d : (mine(d) ? a : null);
  return (foe && foe.p===ctx.opponent && foe.zone==='mz') ? foe : null;
}
defineScript('BF－二の太刀のエテジア', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], dsTiming:'end', damageStepOnly:true,
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!u319EtezyaFoe(ctx)){ ctx.reason = '自分の「BF」が相手モンスターと戦闘を行い、そのモンスターが残っているダメージステップ終了時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ a6HandCost(ctx, done, 'BF－二の太刀のエテジア'); },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000, 'BF－二の太刀のエテジア'); },
  afterResolve(){}
});

/* ---- ヒレン ---- */
function u319HillenGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.card!==ctx.card && u319Bf(x.db) && (x.db.lv||99)<=3); }
function u319HillenHit(ctx){
  const e = ctx.event || {};
  return ctx.zone==='grave' && e.player===ctx.player && e.direct===true && Number(e.amount)>=2000 && e.dealtBy===ctx.opponent && !API.getFlag(ctx.player, 'bfHillenUsedS03');
}
defineUnifiedCardV4('BF－天狗風のヒレン', [{
  key:'revive-pair', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattleDamage'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u319HillenHit(ctx)){ ctx.reason = '相手モンスターの直接攻撃で2000以上の戦闘ダメージを受けた時に発動します'; return false; }
    if(!u319HillenGrave(ctx).length){ ctx.reason = '墓地にレベル3以下の「BF」がいません'; return false; }
    if(gameState.players[ctx.player].mz.length + 2 > ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが2体分空いていません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('BF－天狗風のヒレン：特殊召喚する墓地の「BF」（レベル3以下）', u319HillenGrave(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !me || me.zone!=='grave') return;
    if(gameState.players[ctx.player].mz.length + 2 > ZONE_LIMITS.mz) return;
    API.setFlag(ctx.player, 'bfHillenUsedS03', true, false);
    const opts = {negateOnSummonS03:true, negateSourceUidS03:ctx.card.uid};
    const uidT = r.card.uid != null ? r.card.uid : ensureCardUid(gameState, r.card);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'BF－天狗風のヒレン', null, opts);
    const me2 = locateCardAnyV4(ctx.card);
    if(me2 && me2.zone==='grave') API.specialSummon(ctx.player, 'grave', me2.index, 'atk', 'BF－天狗風のヒレン', null, opts);
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['grave'], includesSpecialSummon:true,
  passive:{ onBattleDamage(ctx){ return u319HillenHit(ctx); } }});
