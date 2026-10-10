/* S03-U50 《冥府の使者ゴーズ》 — replaces the legacy script (cards/00), which could be activated from the hand whenever the field was empty
   (R1 【HERO】 vs 兎ラギア: in Main Phase with no damage taken) and took the token's ATK/DEF from a prompt.
   Text: 自分フィールド上にカードが存在しない場合、相手がコントロールするカードによってダメージを受けた時、このカードを手札から特殊召喚する事ができる。
         この方法で特殊召喚に成功した時、受けたダメージの種類により以下の効果を発動する。
         ●戦闘ダメージの場合、自分フィールド上に「冥府の使者カイエントークン」（天使族・光・星７・攻／守？）を１体特殊召喚する。
           このトークンの攻撃力・守備力は、この時受けた戦闘ダメージと同じ数値になる。
         ●カードの効果によるダメージの場合、受けたダメージと同じダメージを相手ライフに与える。
   2011 source: yugioh-wiki 《冥府の使者ゴーズ》 age 37 (2011-05-28).
   - Its own Special Summon is a trigger effect from the hand; the follow-up is a trigger when that Special Summon succeeds.
   - Your field (the field zone included) must have no card when you take the damage. A monster destroyed by the same battle is still on the
     field when the damage is taken, so battle damage only counts from a direct attack.
   - Effect damage counts only from chain link 1 (a later link misses the timing); it also works in the Damage Step (10/12/20).
   - Only one copy is Special Summoned; the burn back is the damage that triggered it.
   Design choices without a ruling found: ゴーズ and the token are Special Summoned in attack position (the player may choose defense in the OCG).
   Engine contract (S03-U50): effect-damage LP actions made while a chain link resolves carry byPlayer / sourceUid and chainLinkOneS03 (link 1). */
function gorzFieldEmptyS03(p){
  const P = gameState.players[p];
  return !P.mz.length && !P.sz.length && !P.field;
}
function gorzDamageInfoS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone !== 'hand') return null;
  if(ctx.eventName === 'onBattleDamage'){
    if(e.player !== ctx.player || e.direct !== true || e.dealtBy !== ctx.opponent || !(Number(e.amount) > 0)) return null;
    return {type:'battle', amount:Number(e.amount)};
  }
  if(ctx.eventName === 'onLPChange'){
    if(e.cause !== 'effect' || e.player !== ctx.player || !(Number(e.delta) < 0) || e.byPlayer !== ctx.opponent || e.chainLinkOneS03 !== true) return null;
    return {type:'effect', amount:-Number(e.delta)};
  }
  return null;
}
function gorzSummonedByOwnEffectS03(ctx){
  const e = ctx.event || {};
  const self = e.card === ctx.card || (Array.isArray(e.cards) && e.cards.indexOf(ctx.card) >= 0);
  return ctx.zone === 'mz' && !!(ctx.card && ctx.card.gorzDamageS03) && self;
}
defineUnifiedCardV4('冥府の使者ゴーズ', [
  {
    key:'hand-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onBattleDamage','onLPChange'],
    condition(ctx){
      if(!gorzDamageInfoS03(ctx)){ ctx.reason='相手がコントロールするカードによってダメージを受けた時に手札から発動します'; return false; }
      if(!gorzFieldEmptyS03(ctx.player)){ ctx.reason='自分フィールド上にカードが存在しません場合のみです'; return false; }
      if(API.me(ctx).lp <= 0 || !hasMonsterZoneSpace(ctx.player)) return false;
      return true;
    },
    operation(ctx){
      const info = gorzDamageInfoS03(ctx), h = locateCardAnyV4(ctx.card);
      if(!info || !h || h.zone !== 'hand' || h.p !== ctx.player) return;
      if(!gorzFieldEmptyS03(ctx.player)) return;   // 同時に誘発した2枚目：先に特殊召喚された1枚がいる
      API.specialSummon(ctx.player, 'hand', h.index, 'atk', '冥府の使者ゴーズ');
      const now = locateCardAnyV4(ctx.card);
      if(now && now.zone === 'mz') API.setCardFlag({card:ctx.card}, 'gorzDamageS03', {type:info.type, amount:info.amount}, '冥府の使者ゴーズ', {silent:true});
    },
    afterResolve(){}
  },
  {
    key:'summoned', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
    condition(ctx){ return gorzSummonedByOwnEffectS03(ctx); },
    operation(ctx){
      const f = (ctx.card && ctx.card.gorzDamageS03) || {};
      if(f.type === 'battle'){
        if(hasMonsterZoneSpace(ctx.player))
          API.createToken(ctx.player, {name:'冥府の使者カイエントークン', atk:f.amount, def:f.amount, lv:7, ra:'天使', at:'光', pos:'atk'}, 1);
      }else if(f.type === 'effect'){
        API.damageLP(ctx.opponent, f.amount);
      }
    },
    afterResolve(){}
  }
], {
  type:'monster', priority:1, activateFrom:['hand'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  passive:{
    onBattleDamage: ctx => !!gorzDamageInfoS03(ctx),
    onLPChange: ctx => !!gorzDamageInfoS03(ctx),
    onSpecialSummon: ctx => gorzSummonedByOwnEffectS03(ctx)
  }
});
