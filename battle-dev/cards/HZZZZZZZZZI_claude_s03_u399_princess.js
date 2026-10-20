/* S03-U399: 王女の試練, 魔法の国の王女－ピケル, 魔法の国の王女－クラン (NOT_STARTED cards, carddata texts).

   王女の試練            （装備魔法）「白魔導士ピケル」「黒魔導師クラン」にのみ装備可能。装備モンスターの攻撃力は800ポイントアップする。装備モンスターがレベル5以上のモンスターを戦闘によって破壊したターン、装備モンスターとこのカードを生け贄に捧げる事で、「白魔導士ピケル」は「魔法の国の王女－ピケル」を、「黒魔導師クラン」は「魔法の国の王女－クラン」を手札またはデッキから1体特殊召喚する。
   魔法の国の王女－ピケル  このカードは通常召喚できない。このカードは「王女の試練」の効果でのみ特殊召喚する事ができる。自分のスタンバイフェイズ時、自分フィールド上に存在するモンスターの数×800ライフポイント回復する。
   魔法の国の王女－クラン  このカードは通常召喚できない。このカードは「王女の試練」の効果でのみ特殊召喚する事ができる。自分のスタンバイフェイズ時、相手フィールド上に存在するモンスターの数×600ポイントダメージを相手ライフに与える。

   Notes
   - 王女の試練: u312Define (S03-U312) for the Equip Spell (own host only, ATK +800); a forced onDamageStep trigger in the Spell & Trap Zone (the Union shape of S03-U313: ctx.step 'leave', ctx.battle.destroyedDef / destroyedAtk) stamps the card with the turn when the equipped monster destroyed a Level 5 or higher monster; the ignition (stamp = this turn) has the Release of the host and of itself as the cost and Special Summons the Princess matching the host's name from the hand or the Deck.
   - Princesses: cannotNormalSummon; the 「でのみ特殊召喚」 clause is the text rule of engine/1ZK (the reason must be 王女の試練); the Standby Phase triggers copy 白魔導士ピケル / 黒魔導師クラン (the counts include the Princess herself). */

/* ---- 王女の試練 ---- */
const U399_PAIR = {'白魔導士ピケル':'魔法の国の王女－ピケル', '黒魔導師クラン':'魔法の国の王女－クラン'};
function u399Host(ctx){
  const e = ctx.card && ctx.card.equipTo, h = e && e.uid!=null ? findCardByUid(e.uid) : null;
  return (h && h.zone==='mz' && h.card.face==='up') ? h : null;
}
function u399Kill(ctx){
  const b = ctx.battle || {}, h = u399Host(ctx);
  if(!h || ctx.zone!=='sz' || ctx.step!=='leave') return null;
  let v = null;
  if(b.atkCard===h.card && b.destroyedDef) v = b.defCard; else if(b.defCard===h.card && b.destroyedAtk) v = b.atkCard;
  return (v && Number(dbOf(v).lv)>=5) ? v : null;
}
function u399Princess(ctx){
  const h = u399Host(ctx); if(!h) return [];
  const want = U399_PAIR[dbOf(h.card).n]; if(!want) return [];
  return API.pileCards(ctx.player, 'hand', x=>x.db.n===want && canEffectSpecialSummonS03(x.card, 'hand', '王女の試練'))
    .concat(API.pileCards(ctx.player, 'deck', x=>x.db.n===want && canEffectSpecialSummonS03(x.card, 'deck', '王女の試練')));
}
const U399_PRED = x=>!!U399_PAIR[x.db.n];
const U399_EQUIP = Object.assign(u312EquipEffect('王女の試練', U399_PRED, true), {
  /* a card already standing equipped in the Spell & Trap Zone must not be offered the equip activation again (S03-U390: a hand card is judged in 'sz' too, so ask where it really is) */
  condition(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz' && ctx.card.face==='up' && ctx.card.equipTo) return false; return u312Hosts(ctx, U399_PRED, true).length>0; }
});
defineUnifiedCardV4('王女の試練', [U399_EQUIP, {
  key:'mark', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u399Kill(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u399KillTurn', gameState.turn, '王女の試練', {silent:true}); },
  afterResolve(){}
}, {
  key:'princess', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.card.activationPending){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u399Host(ctx)){ ctx.reason = '装備モンスターがいません'; return false; }
    if(Number(ctx.card.u399KillTurn)!==Number(gameState.turn)){ ctx.reason = '装備モンスターがレベル5以上のモンスターを戦闘で破壊したターンにのみ発動できます'; return false; }
    if(!u399Princess(ctx).length){ ctx.reason = '手札・デッキに対応する「魔法の国の王女」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const h = u399Host(ctx), me = locateCardAnyV4(ctx.card); if(!h || !me){ done(false); return; }
    const pool = u399Princess(ctx);
    API.setFlag(ctx.player, 'u399Princess', ensureCardUid(gameState, pool[0].card), true);
    API.sendToGrave(h, '王女の試練（生け贄）');
    const me2 = locateCardAnyV4(ctx.card); if(me2 && me2.zone==='sz') API.sendToGrave(me2, '王女の試練（生け贄）');
    done(true);
  },
  operation(ctx){
    const uid = API.getFlag(ctx.player, 'u399Princess'); const t = uid!=null ? findCardByUid(uid) : null;
    if(!t || (t.zone!=='hand' && t.zone!=='deck') || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, t.zone, t.index, 'atk', '王女の試練');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, activateFrom:['sz'],
  continuous:{ scope:'allMonsters', from:['sz'], apply(card, self){ return equippedS03(card, self) ? {atk:800} : null; } },
  passive:{ onDamageStep(ctx){ return !!u399Kill(ctx); } } });

/* ---- 魔法の国の王女 ---- */
function u399StandbyMine(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer; }
defineUnifiedCardV4('魔法の国の王女－ピケル', [{
  key:'standby-heal', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u399StandbyMine(ctx); },
  operation(ctx){ API.recoverLP(ctx.player, API.fieldCards({player:ctx.player, zone:'mz'}).length*800); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, passive:{ onStandbyPhase(ctx){ return u399StandbyMine(ctx); } } });
defineUnifiedCardV4('魔法の国の王女－クラン', [{
  key:'standby-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u399StandbyMine(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, API.fieldCards({player:ctx.opponent, zone:'mz'}).length*600, '魔法の国の王女－クラン'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, passive:{ onStandbyPhase(ctx){ return u399StandbyMine(ctx); } } });
