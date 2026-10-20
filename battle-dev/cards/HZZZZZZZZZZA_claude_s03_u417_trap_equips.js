/* S03-U417: 植物連鎖, 燃える闘志, 身剣一体, イービル・ブラスト (NOT_STARTED Trap Cards that become Equip Cards, carddata texts).

   植物連鎖        発動後このカードは攻撃力500ポイントアップの装備カードとなり、自分フィールド上の植物族モンスター1体に装備する。装備カードとなったこのカードがカードの効果によって破壊された場合、自分の墓地の植物族モンスター1体を選択して特殊召喚できる。
   燃える闘志      発動後このカードは装備カードとなり、自分フィールド上に表側表示で存在するモンスター1体に装備する。元々の攻撃力よりも攻撃力が高いモンスターが相手フィールド上に存在する場合、装備モンスターの攻撃力はダメージステップの間、元々の攻撃力の倍になる。
   身剣一体        自分フィールド上のモンスターが、「X－セイバー」と名のついたモンスター1体のみの場合に発動できる。発動後このカードは攻撃力800ポイントアップの装備カードとなり、そのモンスター1体に装備する。装備モンスターが戦闘によって相手モンスターを破壊した場合、デッキからカードを1枚ドローする。
   イービル・ブラスト  相手フィールド上にモンスターが特殊召喚された時に発動する事ができる。発動後このカードは攻撃力500ポイントアップの装備カードとなり、そのモンスターに装備する。相手のスタンバイフェイズ毎に500ポイントダメージを相手ライフに与える。

   Notes
   - u417TrapEquip: the ACTIVATE effect of a Normal Trap (speed 2, from the Set card) that chooses the host and calls API.equipSpell (as ヒーロー・ヘイロー, S03-U264); the stat comes from continuous.apply with equippedS03.
   - 植物連鎖: an optional Graveyard trigger when it was sent to the Graveyard from the Spell & Trap Zone THIS turn by a destruction that is not a battle / rule / substitute one (graveInfo.byDestroy, no battle / rule); the chosen Plant of my Graveyard is Special Summoned.
   - 燃える闘志: continuous apply on the host: in a battle that involves the host (any step but the attack declaration) and while a face-up opponent's monster has an ATK above the host's printed ATK, setFinalAtk = 2 x the printed ATK (a reentrancy guard keeps two copies from recursing through curATK).
   - 身剣一体: ACTIVATE condition = exactly one monster on my field and it is a face-up 「X－セイバー」 monster; the draw is a forced onDamageStep trigger (dsTiming 'after') reusing c4EquippedKilled (ブレイク・ドロー).
   - イービル・ブラスト: ACTIVATE on the opponent's Special Summon (onSpecialSummon, the summoned monster is the host, equipped under the opponent's control); a forced trigger deals 500 damage to the opponent in each of THEIR Standby Phases while the card is equipped. */

function u417Foe(ctx){ return ctx.player===0 ? 1 : 0; }
function u417TrapEquip(name, o){
  return {
    key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:o.side||'self', speed:2, events:o.events||['activate'],
    condition(ctx){
      const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz' && ctx.card.face==='up' && ctx.card.equipTo) return false;
      if(typeof o.when==='function' && !o.when(ctx)){ if(!ctx.reason) ctx.reason = o.reason || '発動条件を満たしていません'; return false; }
      return o.hosts(ctx).length>0;
    },
    target(ctx, done){
      const pool = o.hosts(ctx);
      if(o.auto){ done(pool.slice(0,1)); return; }
      API.selectCard(`${name}：装備するモンスター`, pool, t=>done([t]));
    },
    operation(ctx){
      const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(s && s.zone==='sz' && t && t.zone==='mz' && t.card.face==='up' && o.hosts(ctx).some(x=>x.card===t.card)) API.equipSpell(s, t, name);
    },
    afterResolve(){}
  };
}
function u417Stat(n){ return {scope:'allMonsters', from:['sz'], apply(card, self){ return equippedS03(card, self) ? {atk:n} : null; }}; }
function u417Meta(extra, cont){ return Object.assign({type:'trap', priority:2, targets:true, activateFrom:['sz'], continuous:cont}, extra||{}); }

/* ---- 植物連鎖 ---- */
function u417Plants(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='植物' && canEffectSpecialSummonS03(x.card, 'grave', '植物連鎖')); }
function u417ChainSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='sz' && Number(g.turn)===Number(gameState.turn)
    && !!g.byDestroy && !g.battle && !g.rule && !g.selfRuleS03 && !g.equipSubstituteS03;
}
defineUnifiedCardV4('植物連鎖', [
  u417TrapEquip('植物連鎖', {hosts:ctx=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='植物'}), reason:'自分フィールドに表側表示の植物族モンスターがいません'}),
  {
    key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], targetRange:LOCATION.GRAVE, targetSide:'self',
    condition(ctx){ return u417ChainSent(ctx) && u417Plants(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); },
    operation(ctx){
      const pool = u417Plants(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.selectCard('植物連鎖：特殊召喚する植物族モンスター', pool, t=>{
        const r = t && resolveTarget(t);
        if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', '植物連鎖');
      });
    },
    afterResolve(){}
  }
], u417Meta({activateFrom:['sz','grave'], includesSpecialSummon:true, passive:{ onSendToGrave(ctx){ return u417ChainSent(ctx) && u417Plants(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } }}, u417Stat(500)));

/* ---- 燃える闘志 ---- */
let U417_BUSY = false;
function u417Burn(card, self){
  if(!equippedS03(card, self) || U417_BUSY) return null;
  const b = gameState.battle; if(!b || !b.step || b.step==='attackDeclare') return null;
  const mine = (gameState.players[b.player].mz || [])[b.atkIdx];
  const theirs = b.target==='direct' ? null : (gameState.players[b.player===0?1:0].mz || [])[b.target];
  if(card!==mine && card!==theirs) return null;
  const h = locateCardAnyV4(card); if(!h || h.zone!=='mz') return null;
  const orig = Number(dbOf(card).atk) || 0;
  U417_BUSY = true;
  try{
    const higher = API.fieldCards({player:h.p===0?1:0, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && curATK(x.card) > orig});
    return higher.length ? {setFinalAtk: orig*2} : null;
  }finally{ U417_BUSY = false; }
}
defineUnifiedCardV4('燃える闘志', [
  u417TrapEquip('燃える闘志', {hosts:ctx=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}), reason:'自分フィールドに表側表示のモンスターがいません'})
], u417Meta({}, {scope:'allMonsters', from:['sz'], apply:u417Burn}));

/* ---- 身剣一体 ---- */
function u417XSaber(p){ const l = API.fieldCards({player:p, zone:'mz'}); return (l.length===1 && l[0].card.face==='up' && String(l[0].db.n||'').indexOf('X－セイバー')>=0) ? l : []; }
defineUnifiedCardV4('身剣一体', [
  u417TrapEquip('身剣一体', {hosts:ctx=>u417XSaber(ctx.player), when:ctx=>u417XSaber(ctx.player).length===1, reason:'自分フィールドのモンスターが「X－セイバー」モンスター1体のみの時に発動できます', auto:true}),
  {
    key:'draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return c4EquippedKilled(ctx); },
    operation(ctx){ if(API.me(ctx).deck.length) API.draw(ctx.player, 1); },
    afterResolve(){}
  }
], u417Meta({forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return c4EquippedKilled(ctx); } }}, u417Stat(800)));

/* ---- イービル・ブラスト ---- */
function u417Summoned(ctx){
  const e = ctx.event || {}; if(e.player!==ctx.opponent) return null;
  const c = e.card || (e.uid!=null ? (findCardByUid(e.uid)||{}).card : null);
  const h = c && locateCardAnyV4(c);
  return (h && h.zone==='mz' && h.p===ctx.opponent && h.card.face==='up') ? h : null;
}
defineUnifiedCardV4('イービル・ブラスト', [
  u417TrapEquip('イービル・ブラスト', {events:['onSpecialSummon'], side:'opponent', auto:true,
    hosts:ctx=>{ const h = u417Summoned(ctx); return h ? [h] : []; }, when:ctx=>!!u417Summoned(ctx), reason:'相手フィールドにモンスターが特殊召喚された時に発動できます'}),
  {
    key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
    condition(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && !!ctx.card.equipTo && ctx.opponent===gameState.activePlayer && gameState.phase==='standby'; },
    operation(ctx){ API.damageLP(ctx.opponent, 500, 'イービル・ブラスト'); },
    afterResolve(){}
  }
], u417Meta({forced:true, onOtherSummon:true, includesSpecialSummon:false, passive:{ onSpecialSummon(ctx){ return ctx.zone==='sz' && !ctx.card.equipTo && !!u417Summoned(ctx); }, onStandbyPhase(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && !!ctx.card.equipTo && ctx.opponent===gameState.activePlayer && gameState.phase==='standby'; } }}, u417Stat(500)));
