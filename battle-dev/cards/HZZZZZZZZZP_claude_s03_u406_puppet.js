/* S03-U406: 地獄の傀儡魔人, 魔人 ダーク・バルター, 不退の荒武者 (NOT_STARTED cards, carddata texts).

   地獄の傀儡魔人  1ターンに1度、手札を1枚捨てる事で、相手フィールド上に表側表示で存在する全てのレベル3以下のモンスターのコントロールをエンドフェイズ時まで得る。この効果でコントロールを得たモンスターは効果を発動する事ができず、リリースやシンクロ素材とする事もできない。
   魔人 ダーク・バルター  通常魔法カードが発動した時、1000ライフポイントを払う事でその効果を無効にする。また、このカードが戦闘で破壊した効果モンスターの効果は無効化される。
   不退の荒武者  このカードの攻撃力よりも高い攻撃力を持つモンスターから攻撃を受けた場合、このカードはその戦闘では破壊されず、戦闘を行った相手モンスターをダメージ計算後に破壊する。

   Notes
   - 傀儡魔人: once-per-turn ignition with a hand discard cost; API.changeControl(…, 'endPhase', null, {noTribute:true}) for every face-up Level 3 or lower monster of the opponent that fits my free zones (control returns at the End Phase, S03-U117 / U352); API.negateEffectUntil(…, 'endTurn') (no effects) and the noSynchroMaterialTurnS03 stamp.
   - ダーク・バルター: optional quick effect (like シューティング・クェーサー・ドラゴン, S03-U140) on the activation of a Normal Spell (DB sub empty), cost 1000 LP, API.negateChainLink(ctx.event, 'effect') (the activation stands, the effect is negated); the battle clause is declareBattleDestroyedNegatorS03 (S03-U336).
   - 荒武者: protectV21 {battle(target, src, ctx)} when it is the defender (ctx.battleRole) and the attacker's ATK is higher; a forced onDamageStep trigger (ctx.step 'leave', ctx.battle) destroys the attacker after the damage calculation. */

/* ---- 地獄の傀儡魔人 ---- */
function u406Foes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && Number(curLV(x.card))<=3}); }
defineUnifiedCardV4('地獄の傀儡魔人', [{
  key:'puppet', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(!u406Foes(ctx).length){ ctx.reason = '相手フィールドにレベル3以下の表側表示モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length){ done(false); return; }
    API.selectCard('地獄の傀儡魔人：捨てる手札', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '地獄の傀儡魔人（コスト）'); done(true);
    });
  },
  operation(ctx){
    const uids = u406Foes(ctx).map(x=>ensureCardUid(gameState, x.card));
    const me = locateCardAnyV4(ctx.card);
    uids.forEach(u=>{
      if(!hasMonsterZoneSpace(ctx.player)) return;
      const h = findCardByUid(u); if(!h || h.zone!=='mz' || h.p!==ctx.opponent) return;
      API.changeControl(h, ctx.player, '地獄の傀儡魔人', 'endPhase', me || null, {noTribute:true});
      const h2 = findCardByUid(u);
      if(h2 && h2.zone==='mz' && h2.p===ctx.player){
        API.negateEffectUntil(h2, 'endTurn', '地獄の傀儡魔人', ctx.card);
        const h3 = findCardByUid(u); if(h3) API.setCardFlag(h3, 'noSynchroMaterialTurnS03', gameState.turn, '地獄の傀儡魔人', {silent:true});
      }
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['puppet']}, timing:['free'] });

/* ---- 魔人 ダーク・バルター ---- */
declareBattleDestroyedNegatorS03('魔人 ダーク・バルター', {});
function u406NormalSpell(ctx){
  const e = ctx.event || {};
  if(e.kind!=='spell') return false;
  const i = e.cardId!=null ? e.cardId : (e.name ? findCardIndex(e.name) : -1);
  const db = i>=0 ? CARD_DB[i] : null;
  return !!db && db.k==='s' && !db.sub;
}
function u406Balter(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && API.me(ctx).lp>=1000 && u406NormalSpell(ctx); }
defineUnifiedCardV4('魔人 ダーク・バルター', [{
  key:'jam', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['onActivateSuccess'],
  condition(ctx){ return u406Balter(ctx); },
  cost(ctx, done){ if(API.me(ctx).lp<1000){ done(false); return; } API.payCost(ctx.player, 1000, '魔人 ダーク・バルター'); done(true); },
  operation(ctx){ API.negateChainLink(ctx.event, 'effect', '魔人 ダーク・バルター', false); },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, timing:['free','chain'], activateFrom:['mz'], passive:{ onActivateSuccess(ctx){ return u406Balter(ctx); } } });
declareActivationResponseS03(['魔人 ダーク・バルター']);

/* ---- 不退の荒武者 ---- */
function u406Retreat(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.step!=='leave' || b.defCard!==ctx.card || !b.atkCard) return null;
  return curATK(b.atkCard) > curATK(ctx.card) ? b.atkCard : null;
}
defineUnifiedCardV4('不退の荒武者', [{
  key:'smite', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u406Retreat(ctx); },
  operation(ctx){ const a = u406Retreat(ctx); if(!a) return; const h = locateCardAnyV4(a); if(h && h.zone==='mz') API.destroy(h, '不退の荒武者'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  protectV21:{ key:'u406.retreat', label:'不退の荒武者', battle:(target, src, ctx)=> !!ctx && ctx.battleRole==='defender' && !!ctx.opponentCard && curATK(ctx.opponentCard) > curATK(target) },
  passive:{ onDamageStep(ctx){ return !!u406Retreat(ctx); } } });
