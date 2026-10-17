/* S03-U407: ジュラック・タイタン, サンダー・ユニコーン, 破壊竜ガンドラ (NOT_STARTED cards, carddata texts).

   ジュラック・タイタン  このカードは特殊召喚できない。このカードはフィールド上に表側表示で存在する限り、罠・効果モンスターの効果の対象にならない。また、1ターンに1度、自分の墓地の攻撃力1700以下の「ジュラック」と名のついたモンスター1体をゲームから除外して発動できる。このカードの攻撃力はエンドフェイズ時まで1000ポイントアップする。
   サンダー・ユニコーン  1ターンに1度、自分のメインフェイズ時に相手フィールド上に表側表示で存在するモンスター1体を選択して発動する事ができる。選択したモンスターの攻撃力はエンドフェイズ時まで、自分フィールド上に存在するモンスターの数×500ポイントダウンする。この効果を発動するターン、このカード以外のモンスターは攻撃する事ができない。
   破壊竜ガンドラ  このカードは特殊召喚できない。①:LPを半分払って発動できる。このカード以外のフィールドのカードを全て破壊し除外する。このカードの攻撃力は、この効果で破壊したカードの数×300アップする。②:このカードを召喚・反転召喚したターンのエンドフェイズに発動する。このカードを墓地へ送る。

   Notes
   - タイタン: cannotSpecialSummon + continuous.immuneToTarget with the effect source from ACTIVATION_PREP_S03 (u378Source, S03-U378/U381): a Trap or an Effect Monster cannot target it; the ignition banishes a 「ジュラック」 (ATK 1700 or less) of the Graveyard (cost) for +1000 ATK until the End Phase (v4RegisterStatModifier).
   - ユニコーン: once-per-turn ignition lowering the chosen monster by 500 x my monster count until the End Phase; a card stamp (u407Turn) + continuous cannotAttack on my other monsters.
   - ガンドラ: LP halved as the cost; every other card of the field (monsters, Spell & Trap Zones, Field Zones) is destroyed and the destroyed ones are banished from the Graveyard; ATK + 300 each (modifier until it leaves the field); a forced End Phase trigger sends it to the Graveyard in the turn it was Summoned / Flip Summoned (summonedTurn / flipSummonedTurnS03). */

/* ---- ジュラック・タイタン ---- */
function u407Main(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u407Jurrac(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ジュラック')>=0 && Number(x.db.atk)<=1700); }
defineUnifiedCardV4('ジュラック・タイタン', [{
  key:'boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u407Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u407Jurrac(ctx).length){ ctx.reason = '墓地に攻撃力1700以下の「ジュラック」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u407Jurrac(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ジュラック・タイタン：除外する「ジュラック」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
      API.banish(r, 'ジュラック・タイタン（コスト）'); done(true);
    });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') v4RegisterStatModifier(me, {atk:1000}, {code:'ジュラック・タイタン', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN}); },
  afterResolve(){}
}], {type:'monster', priority:1, cannotSpecialSummon:true, countLimit:{n:1, effects:['boost']}, timing:['free'],
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    immuneToTarget(card, self){
      if(card!==self || self.face!=='up') return false;
      const src = u378Source();
      return !!src && (src.db.k==='t' || (src.db.k==='m' && (src.db.st||[]).indexOf('効果')>=0));
    } } });

/* ---- サンダー・ユニコーン ---- */
function u407Foes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
defineUnifiedCardV4('サンダー・ユニコーン', [{
  key:'weaken', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(!u407Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u407Foes(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('サンダー・ユニコーン：攻撃力を下げる相手モンスター', u407Foes(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u407Turn', gameState.turn, 'サンダー・ユニコーン', {silent:true});
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent || r.card.face!=='up') return;
    const n = API.fieldCards({player:ctx.player, zone:'mz'}).length;
    v4RegisterStatModifier(r, {atk:-500*n}, {code:'サンダー・ユニコーン', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['weaken']}, timing:['free'],
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(target, self){ return !!self && self.face==='up' && Number(self.u407Turn)===Number(gameState.turn) && target!==self; } } });

/* ---- 破壊竜ガンドラ ---- */
function u407Others(ctx){
  return API.fieldCards({zone:'mz', filter:x=>x.card!==ctx.card}).concat(API.fieldCards({zone:'sz'}), API.fieldCards({zone:'field'}));
}
function u407GandraEnd(ctx){
  const c = ctx.card;
  return ctx.zone==='mz' && c.face==='up' && (Number(c.summonedTurn)===Number(gameState.turn) || Number(c.flipSummonedTurnS03)===Number(gameState.turn)) && c.specialSummoned!==true;
}
defineUnifiedCardV4('破壊竜ガンドラ', [{
  key:'purge', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u407Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(API.me(ctx).lp<2){ ctx.reason = 'ライフポイントが足りません'; return false; }
    if(!u407Others(ctx).length){ ctx.reason = '他にフィールドのカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ const lpNow = API.me(ctx).lp; API.payCost(ctx.player, Math.ceil(lpNow/2), '破壊竜ガンドラ'); done(true); },
  operation(ctx){
    const targets = u407Others(ctx).map(x=>ensureCardUid(gameState, x.card));
    targets.slice().reverse().forEach(u=>{ const h = findCardByUid(u); if(h && (h.zone==='mz' || h.zone==='sz' || h.zone==='field')) API.destroy(h, '破壊竜ガンドラ'); });
    let n = 0;
    targets.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave'){ n++; API.banish(h, '破壊竜ガンドラ'); } });
    const me = locateCardAnyV4(ctx.card);
    if(n>0 && me && me.zone==='mz' && me.card.face==='up') v4RegisterStatModifier(me, {atk:300*n}, {code:'破壊竜ガンドラ', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}, {
  key:'end', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u407GandraEnd(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.sendToGrave(me, '破壊竜ガンドラ'); },
  afterResolve(){}
}], {type:'monster', priority:1, cannotSpecialSummon:true, timing:['free'], passive:{ onEndPhase(ctx){ return u407GandraEnd(ctx); } } });
