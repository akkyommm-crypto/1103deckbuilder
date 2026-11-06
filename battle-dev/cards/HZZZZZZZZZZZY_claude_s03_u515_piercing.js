/* =========================================================================
   S03-U515 — 貫通ダメージを持つ未実装カード（カード実装）
   -------------------------------------------------------------------------
   《螺旋槍殺》（NOT_STARTED・永続魔法）
     ①:自分の「暗黒騎士ガイア」「疾風の暗黒騎士ガイア」「竜騎士ガイア」が守備表示モンスターを
       攻撃した場合、その守備力を攻撃力が超えた分だけ相手に戦闘ダメージを与える。
     ②:このカードの①の効果の適用によって「竜騎士ガイア」が相手に戦闘ダメージを与えた場合に発動する。
       自分はデッキから2枚ドローし、その後手札を1枚選んで捨てる。
   《天空勇士ネオパーシアス》（NOT_STARTED・星7 天使/光 2300/2000）
     ①:このカードは自分フィールドの「天空騎士パーシアス」1体をリリースして手札から特殊召喚できる。
     ②:フィールドに「天空の聖域」が存在し、自分のLPが相手より多い場合、
       このカードの攻撃力・守備力はその差の数値分アップする。
     ③:このカードが守備表示モンスターを攻撃した場合、その守備力を攻撃力が超えた分だけ戦闘ダメージを与える。
     ④:このカードが相手に戦闘ダメージを与えた場合に発動する。自分はデッキから1枚ドローする。

   新しい共通処理は足していない。使うのは既存の仕組みだけ:
     - 貫通ダメージ `continuous.piercingDamage(info)`（System v3.3.0、engine/00）
     - 継続効果の `continuous.apply`（攻守の増減）
     - 特殊召喚手順 `summonProcedure`（リリースをコストにする形）
     - 戦闘ダメージの誘発 `onBattleDamage`（a3DealtBattleDamage と同じ読み方）
   ========================================================================= */

/* ---- 螺旋槍殺 ---- */
function u515GaiaNameS03(card){
  const n = card ? cardName(card) : '';
  return n === '暗黒騎士ガイア' || n === '疾風の暗黒騎士ガイア' || n === '竜騎士ガイア';
}
function u515SpiralSelfS03(ctx){
  return ctx.zone === 'sz' && ctx.card && ctx.card.face === 'up'
    && !(typeof effectNegated === 'function' && effectNegated(ctx.card));
}
/* ②: ①の貫通で《竜騎士ガイア》が相手に戦闘ダメージを与えた場合。
   守備表示のモンスターとの戦闘で相手プレイヤーがダメージを受けるのは貫通のときだけなので、
   「守備表示の相手モンスターと戦闘し、相手が戦闘ダメージを受けた」ことで①の適用を見る
   （他の貫通源が同時にある場合は区別できない。報告書に近似として記録）。 */
function u515SpiralDrawDueS03(ctx){
  if(!u515SpiralSelfS03(ctx)) return false;
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  if(e.direct) return false;
  const atk = (e.attackerUid != null) ? findCardByUid(e.attackerUid) : null;
  if(!atk || atk.p !== ctx.player || cardName(atk.card) !== '竜騎士ガイア') return false;
  const b = ctx.battle || {};
  const def = b.defCard || ((e.defenderUid != null) ? (findCardByUid(e.defenderUid) || {}).card : null);
  return !!def && def.pos === 'def';
}
API.registerChoiceHandler('u515.spiral-discard', (answer, args) => {
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(r && r.zone === 'hand') API.discard(r.p, r.index, '螺旋槍殺（手札を1枚捨てる）');
});
defineScript('螺旋槍殺', {
  type:'spell', priority:1, forced:true, activateFrom:['sz'], timing:['free'],
  condition(ctx){
    if(!u515SpiralDrawDueS03(ctx)){
      ctx.reason = '①の貫通で「竜騎士ガイア」が戦闘ダメージを与えた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 2, '螺旋槍殺');
    const hand = API.pileCards(ctx.player, 'hand');
    if(!hand.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'螺旋槍殺：捨てる手札',
      candidates: hand,
      resume:{ handler:'u515.spiral-discard', args:{player:ctx.player} }
    });
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){ return u515SpiralDrawDueS03(ctx); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    /* ①: 自分の 3 枚のガイアが守備表示モンスターを攻撃した場合の貫通 */
    piercingDamage(info){
      const self = info.self;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || self.face !== 'up') return 0;
      const atk = info.atkCard;
      if(!atk || !u515GaiaNameS03(atk)) return 0;
      const ah = locateCardAnyV4(atk);
      if(!ah || ah.p !== h.p) return 0;
      if(!info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(atk) - curDEF(info.defCard));
    }
  }
});

/* ---- 天空勇士ネオパーシアス ---- */
function u515SanctuaryOnFieldS03(){
  for(let p = 0; p < (gameState.players || []).length; p++){
    const f = gameState.players[p].field;
    if(f && f.face === 'up' && cardName(f) === '天空の聖域') return true;
  }
  return false;
}
function u515PerseusFodderS03(p){
  return API.fieldCards({player:p, zone:'mz',
    filter:x => x.card && x.card.face === 'up' && cardName(x.card) === '天空騎士パーシアス'});
}
defineUnifiedCardV4('天空勇士ネオパーシアス', [{
  key:'draw-on-battle-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1,
  events:['onBattleDamage'], forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz') return false;
    return a3DealtBattleDamage(ctx) && API.pileCards(ctx.player, 'deck').length > 0;
  },
  operation(ctx){ API.draw(ctx.player, 1, '天空勇士ネオパーシアス'); },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true,
  summonProcedure:{
    from:['hand'],
    positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(!u515PerseusFodderS03(ctx.player).length){
        ctx.reason = '自分フィールドに「天空騎士パーシアス」がいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const q = u515PerseusFodderS03(ctx.player);
      if(!q.length){ done(false); return; }
      API.selectCard('天空勇士ネオパーシアス：リリースする「天空騎士パーシアス」', q, t => {
        const r = t && resolveTarget(t);
        if(!r || r.zone !== 'mz'){ done(false); return; }
        API.sendToGrave(r, '天空勇士ネオパーシアス（リリース）');
        done(true);
      });
    },
    execute(ctx){
      const zone = ctx.zone || 'hand';
      const pile = gameState.players[ctx.player][zone] || [];
      const i = pile.indexOf(ctx.card);
      if(i < 0) return;
      const pos = (ctx.position === 'def' || ctx.pos === 'def') ? 'def' : 'atk';
      API.specialSummon(ctx.player, zone, i, pos, '天空勇士ネオパーシアス');
    }
  },
  continuous:{
    scope:'self', from:['mz'],
    /* ②: 「天空の聖域」があり、自分の LP が相手より多い場合、その差だけ攻撃力・守備力アップ */
    apply(card, self){
      if(card !== self) return null;
      if(!u515SanctuaryOnFieldS03()) return null;
      const h = locateCardAnyV4(self);
      if(!h) return null;
      const foe = (h.p === 0) ? 1 : 0;
      const d = Number(gameState.players[h.p].lp) - Number(gameState.players[foe].lp);
      return (d > 0) ? {atk:d, def:d} : null;
    },
    /* ③: 守備表示モンスターを攻撃した場合の貫通 */
    piercingDamage(info){
      const self = info.self;
      if(info.atkCard !== self || !info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(self) - curDEF(info.defCard));
    }
  },
  passive:{ onBattleDamage(ctx){ return ctx.zone === 'mz' && a3DealtBattleDamage(ctx); } }
});
