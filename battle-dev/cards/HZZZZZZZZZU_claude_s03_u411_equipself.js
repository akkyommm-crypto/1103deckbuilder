/* S03-U411: 瞬着ボマー, 精神寄生体, 手錠龍 (NOT_STARTED cards, carddata texts).

   瞬着ボマー   裏側守備表示のこのカードを相手モンスターが攻撃した場合、ダメージ計算を行わずこのカードは攻撃モンスターの装備カードになる。次の相手ターンのスタンバイフェイズ時、その装備モンスターを破壊する。
   精神寄生体   フィールド上に裏側守備表示で存在するこのカードが相手モンスターに攻撃された場合、そのダメージ計算前にこのカードは攻撃モンスターの装備カードになる。相手のスタンバイフェイズ毎に、このカードの装備モンスターの攻撃力の半分の数値分、自分のライフポイントを回復する。
   手錠龍       このカードが相手モンスターの攻撃によって破壊され墓地へ送られた時、このカードを装備カード扱いとしてそのモンスターに装備する事ができる。装備モンスターの攻撃力は1800ポイントダウンする。装備モンスターが破壊される事によってこのカードが墓地へ送られた時、このカードを自分フィールド上に特殊召喚する事ができる。

   Notes
   - ボマー / 寄生体: forced onDamageStep trigger at the start of the damage step (dsTiming 'before' = step ②, where the attacked face-down monster has been flipped; ctx.battle.defCard === itself and battle.flipped = it was face-down); API.equipMonster(me, itself, attacker) puts it into MY Spell & Trap Zone as an Equip card of the opponent's attacker (S03-U326 cross-side shape). The Standby Phase effects are forced triggers of the Equip in the Spell & Trap Zone in the OPPONENT's Standby Phase (the equip stamp keeps the Bomber from firing in the turn it equipped).
   - 手錠龍: optional Graveyard trigger after a battle destruction (a3SelfBattleDestroyed / a3BattleOther): API.equipFromGrave onto the attacker; the ATK -1800 is a continuous apply of the Equip; when it is sent to the Graveyard because its host was destroyed (graveInfo.rule 'equip' and the host in the Graveyard with byDestroy) it can Special Summon itself. */

/* ---- common ---- */
function u411Defender(ctx){
  const b = ctx.battle || {};
  const gb = gameState.battle;   /* the ctx.battle copy has no 'flipped' key: read the live battle */
  return ctx.zone==='mz' && ctx.card.face==='up' && b.defCard===ctx.card && !!(gb && gb.flipped) && !!b.atkCard;
}
function u411Host(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.v46MonsterEquip!==true || !ctx.card.equipTo) return null;
  const h = findCardByUid(ctx.card.equipTo.uid); return (h && h.zone==='mz') ? h : null;
}
function u411Equip(name){
  return {
    key:'equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return u411Defender(ctx) && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
    operation(ctx){
      const b = ctx.battle || {}, me = locateCardAnyV4(ctx.card), host = b.atkCard && locateCardAnyV4(b.atkCard);
      if(!me || me.zone!=='mz' || !host || host.zone!=='mz') return;
      if(API.equipMonster(ctx.player, me, host, name)){
        const eq = findCardByUid(ensureCardUid(gameState, ctx.card)); if(eq) API.setCardFlag(eq, 'u411Turn', gameState.turn, name, {silent:true});
      }
    },
    afterResolve(){}
  };
}

/* ---- 瞬着ボマー ---- */
function u411Boom(ctx){ return gameState.phase==='standby' && ctx.player!==gameState.activePlayer && !!u411Host(ctx) && Number(ctx.card.u411Turn)!==Number(gameState.turn); }
defineUnifiedCardV4('瞬着ボマー', [u411Equip('瞬着ボマー'), {
  key:'boom', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u411Boom(ctx); },
  operation(ctx){ const h = u411Host(ctx); if(h) API.destroy(h, '瞬着ボマー'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['mz','sz'], dsTiming:'before',
  passive:{ onDamageStep(ctx){ return u411Defender(ctx) && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; }, onStandbyPhase(ctx){ return u411Boom(ctx); } } });

/* ---- 精神寄生体 ---- */
function u411Leech(ctx){ return gameState.phase==='standby' && ctx.player!==gameState.activePlayer && !!u411Host(ctx); }
defineUnifiedCardV4('精神寄生体', [u411Equip('精神寄生体'), {
  key:'leech', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u411Leech(ctx); },
  operation(ctx){ const h = u411Host(ctx); if(h) API.recoverLP(ctx.player, Math.floor(Math.max(0, curATK(h.card))/2)); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['mz','sz'], dsTiming:'before',
  passive:{ onDamageStep(ctx){ return u411Defender(ctx) && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; }, onStandbyPhase(ctx){ return u411Leech(ctx); } } });

/* ---- 手錠龍 ---- */
function u411Cuffed(ctx){ return a3SelfBattleDestroyed(ctx) && !!a3BattleOther(ctx) && ctx.card.graveInfo && ctx.card.graveInfo.from==='mz'; }
function u411HostGone(ctx){
  const g = ctx.card.graveInfo, e = ctx.event || {};
  if(ctx.zone!=='grave' || !g || g.rule!=='equip' || Number(g.turn)!==Number(gameState.turn) || !((e.uid!=null && e.uid===ctx.card.uid) || e.card===ctx.card)) return false;
  /* the equip link is cleared when the Equip card goes to the Graveyard: the host uid was recorded in the player flag u411Cuff when it was equipped */
  const map = API.getFlag(ctx.player, 'u411Cuff'), hu = map && typeof map==='object' ? map[String(ctx.card.uid)] : null, h = hu!=null ? findCardByUid(hu) : null;
  return !!h && h.zone==='grave' && !!(h.card.graveInfo && h.card.graveInfo.byDestroy);
}
defineUnifiedCardV4('手錠龍', [{
  key:'cuff', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDamageStep'],
  condition(ctx){ return u411Cuffed(ctx) && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
  operation(ctx){
    const o = a3BattleOther(ctx), host = o && locateCardAnyV4(o), me = locateCardAnyV4(ctx.card);
    if(host && host.zone==='mz' && me && me.zone==='grave'){
      const hu = ensureCardUid(gameState, host.card), eu = ensureCardUid(gameState, ctx.card);
      if(API.equipFromGrave(ctx.player, me, host, '手錠龍')){ const cur = API.getFlag(ctx.player, 'u411Cuff'), next = Object.assign({}, (cur && typeof cur==='object') ? cur : {}); next[String(eu)] = hu; API.setFlag(ctx.player, 'u411Cuff', next, false); }
    }
  },
  afterResolve(){}
}, {
  key:'return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ return u411HostGone(ctx) && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', me.index, 'atk', '手錠龍'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['mz','grave','sz'],
  continuous:{ scope:'allMonsters', from:['sz'], apply(card, self){ return (self && self.v46MonsterEquip===true && self.equipTo && card && self.equipTo.uid===card.uid) ? {atk:-1800} : null; } },
  passive:{ onDamageStep(ctx){ return u411Cuffed(ctx) && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; }, onSendToGrave(ctx){ return u411HostGone(ctx) && hasMonsterZoneSpace(ctx.player); } } });
