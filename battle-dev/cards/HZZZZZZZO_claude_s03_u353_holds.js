/* S03-U353: a Continuous Spell and two Continuous Traps that hold down a monster (carddata texts).

   平和の使者  （永続魔法）フィールドの表側表示の攻撃力1500以上のモンスターは攻撃宣言できない。コントローラーは自分のスタンバイフェイズ毎に100LPを払う。または払わずにこのカードを破壊する。
   闇の呪縛    （永続罠）相手フィールドの表側表示モンスター1体を対象として発動できる。そのモンスターの攻撃力は700ダウンし、攻撃できず、表示形式の変更もできない。そのモンスターがフィールドから離れた時このカードは破壊される。
   拷問車輪    （永続罠）相手フィールドのモンスター1体を対象として発動できる。そのモンスターは攻撃できず、表示形式の変更もできない。そのモンスターが離れた時このカードは破壊される。自分のスタンバイフェイズに相手に500ダメージ（対象がモンスターゾーンに存在する場合のみ）。

   Notes
   - The bound monster carries a card flag (the trap's uid): the trap's continuous source (from the Spell & Trap Zone, so it ends with the trap) reads the flag for the ATK drop / attack / position locks; API.linkOnLeave(trap, monster, 'destroy') destroys the trap when the monster leaves.
   - 平和の使者 / 拷問車輪: forced onStandbyPhase triggers on my own Standby Phase (payCost 100, else destroy / 500 damage while the target is on the field). */

function u353Bound(card, self){ return !!card && !!self && card.u353Bind!=null && card.u353Bind===self.uid && card.face==='up'; }
function u353Bind(name, o){
  const effects = [{
    key:'bind', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:2, events:['activate'],
    condition(ctx){
      if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
      return true;
    },
    target(ctx, done){ API.selectCard(name+'：対象にする相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t])); },
    operation(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      const self = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='mz' || r.p!==ctx.opponent || !self || self.zone!=='sz') return;
      const uid = ensureCardUid(gameState, ctx.card);
      API.setCardFlag(r, 'u353Bind', uid, name, {silent:true});
      const m = findCardByUid(r.card.uid), s2 = locateCardAnyV4(ctx.card);
      if(m && m.zone==='mz' && s2 && s2.zone==='sz') API.linkOnLeave(s2, m, 'destroy', name);
      if(o.onBound) o.onBound(ctx, m);
    },
    afterResolve(){}
  }].concat(o.effects||[]);
  return defineUnifiedCardV4(name, effects, Object.assign({type:'trap', priority:2, targets:true, passive:o.passive||{},
    continuous:{ scope:'allMonsters', from:['sz'],
      apply(card, self){ return (o.atk && u353Bound(card, self)) ? {atk:o.atk} : null; },
      cannotAttack(card, self){ return u353Bound(card, self); },
      cannotChangePosition(card, self){ return u353Bound(card, self); } } }, o.meta||{}));
}

/* ---- 闇の呪縛 ---- */
u353Bind('闇の呪縛', {atk:-700});

/* ---- 拷問車輪 ---- */
function u353WheelMine(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
function u353WheelTarget(ctx){
  const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.u353Bind===ctx.card.uid});
  return pool.length ? pool[0] : null;
}
u353Bind('拷問車輪', {
  effects:[{
    key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
    condition(ctx){ return u353WheelMine(ctx) && !!u353WheelTarget(ctx); },
    operation(ctx){ if(u353WheelTarget(ctx)) API.damageLP(ctx.opponent, 500, '拷問車輪'); },
    afterResolve(){}
  }],
  passive:{ onStandbyPhase(ctx){ return u353WheelMine(ctx) && !!u353WheelTarget(ctx); } }
});

/* ---- 平和の使者 ---- */
function u353PeaceMine(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('平和の使者', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'], operation(){}, afterResolve(){}
}, {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u353PeaceMine(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    if(API.me(ctx).lp>=100){ API.payCost(ctx.player, 100); return; }
    API.destroy(me, '平和の使者');
  },
  afterResolve(){}
}], {
  type:'spell', priority:1, forced:true,
  passive:{ onStandbyPhase(ctx){ return u353PeaceMine(ctx); } },
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    cannotAttack(card, self){ return !!card && !!self && self.face==='up' && card.face==='up' && curATK(card)>=1500; } }
});
