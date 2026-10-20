/* S03-U365: 天魔神 ノーレラス / エンライズ (banish-from-Graveyard procedures) and 怨念の魂 業火 (carddata texts).

   天魔神 ノーレラス  通常召喚できない。墓地の光属性・天使族1体と闇属性・悪魔族3体を除外した場合のみ特殊召喚できる。1000LPを払う事で、お互いの手札とフィールドのカードを全て墓地へ送り、自分のデッキからカードを1枚ドローする。
   天魔神 エンライズ  通常召喚できない。墓地の光属性・天使族3体と闇属性・悪魔族1体を除外した場合のみ特殊召喚できる。フィールドの表側表示モンスター1体を除外できる。この効果を発動する場合、このターンこのカードは攻撃できない。1ターンに1度。
   怨念の魂 業火      ①手札から特殊召喚できる（自分フィールドに炎属性モンスターが存在する場合）。②その方法で特殊召喚に成功した場合、自分の炎属性モンスター1体を対象として発動し、破壊する。③他の自分の炎属性モンスター1体をリリースして発動できる。攻撃力はターン終了時まで500アップ。④自分スタンバイフェイズに「火の玉トークン」（炎族・炎・星1・攻/守100）1体を守備表示で特殊召喚する。

   Notes
   - The procedures follow S03-U343 (u342Bad = ネクロバレー check, u342PickN = pick N Graveyard cards and banish them).
   - ノーレラス: payCost 1000, then every hand card and every field card of both players goes to the Graveyard (API.sendHandToGrave / API.sendToGrave), then I draw 1. エンライズ: the target is banished and a card flag (cannotAttackTurn) forbids its attack that turn.
   - 業火: the second effect is a forced trigger on its own procedure summon (specialSummonKind 'procedure'); ④ creates a 火の玉トークン (defineTokenSpecV11 + API.createTokens). */

function u365Bad(){ return u342Bad(); }
function u365LightAngel(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='光' && x.db.ra==='天使'); }
function u365DarkFiend(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='闇' && x.db.ra==='悪魔'); }
function u365Proc(label, nLight, nDark){
  return {
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u365Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(u365LightAngel(ctx).length<nLight || u365DarkFiend(ctx).length<nDark){ ctx.reason = '墓地に光属性・天使族'+nLight+'体と闇属性・悪魔族'+nDark+'体が必要です'; return false; }
      return true;
    },
    cost(ctx, done){
      u342PickN(label+'：除外する光属性・天使族', ctx, u365LightAngel, nLight, h=>API.banish(h, label+'（特殊召喚の手順）'), ok=>{
        if(!ok){ done(false); return; }
        u342PickN(label+'：除外する闇属性・悪魔族', ctx, u365DarkFiend, nDark, h=>API.banish(h, label+'（特殊召喚の手順）'), done);
      });
    }
  };
}

/* ---- 天魔神 ノーレラス ---- */
defineUnifiedCardV4('天魔神 ノーレラス', [{
  key:'wipe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(API.me(ctx).lp<1000){ ctx.reason = 'ライフポイントが足りません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000, '天魔神 ノーレラス'); done(true); },
  operation(ctx){
    [0,1].forEach(p=>{
      const hand = gameState.players[p].hand;
      for(let i=hand.length-1;i>=0;i--) API.sendHandToGrave(p, i, '天魔神 ノーレラス');
      API.fieldCards({player:p}).slice().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && ['mz','sz','field'].indexOf(h.zone)>=0) API.sendToGrave(h, '天魔神 ノーレラス'); });
    });
    API.draw(ctx.player, 1);
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, timing:['mainPhase'], summonProcedure:u365Proc('天魔神 ノーレラス', 1, 3)});

/* ---- 天魔神 エンライズ ---- */
function u365Foes(ctx){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.card!==ctx.card}); }
defineUnifiedCardV4('天魔神 エンライズ', [{
  key:'banish', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(u365Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    if(!u365Foes(ctx).length){ ctx.reason = '除外する他の表側表示モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('天魔神 エンライズ：除外するモンスター', u365Foes(ctx), t=>done([t])); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, '天魔神 エンライズ', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.card.face==='up') API.banish(r, '天魔神 エンライズ');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:1, cannotNormalSummon:true, timing:['mainPhase'], summonProcedure:u365Proc('天魔神 エンライズ', 3, 1)});

/* ---- 怨念の魂 業火 ---- */
defineTokenSpecV11('火の玉トークン', {atk:100, def:100, lv:1, ra:'炎', at:'炎', pos:'def'});
function u365Fire(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.at==='炎'}); }
function u365GouSummoned(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure'; }
function u365GouStandby(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby' && hasMonsterZoneSpace(ctx.player); }
defineUnifiedCardV4('怨念の魂 業火', [{
  key:'self-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u365GouSummoned(ctx) && u365Fire(ctx).length>0; },
  operation(ctx){
    const pool = u365Fire(ctx); if(!pool.length) return;
    API.selectCard('怨念の魂 業火：破壊する自分の炎属性モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.player) API.destroy(r, '怨念の魂 業火'); });
  },
  afterResolve(){}
}, {
  key:'power', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){ if(ctx.zone!=='mz' || ctx.card.face!=='up') return false; if(!u365Fire(ctx).length){ ctx.reason = 'リリースする他の炎属性モンスターがいません'; return false; } return true; },
  cost(ctx, done){
    API.selectCard('怨念の魂 業火：リリースする炎属性モンスター', u365Fire(ctx), t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, '怨念の魂 業火（リリース）'); done(true); });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') v4RegisterStatModifier(me, {atk:500}, {code:'怨念の魂 業火', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN}); },
  afterResolve(){}
}, {
  key:'token', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u365GouStandby(ctx); },
  operation(ctx){ API.createTokens(ctx.player, '火の玉トークン', 1); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['mainPhase'], includesSpecialSummon:true,
  passive:{ onSpecialSummon(ctx){ return u365GouSummoned(ctx) && u365Fire(ctx).length>0; }, onStandbyPhase(ctx){ return u365GouStandby(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(!u365Fire(ctx).length){ ctx.reason = '自分フィールドに炎属性モンスターが必要です'; return false; }
      return true;
    }
  } });
