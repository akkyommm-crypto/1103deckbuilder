/* =========================================================================
   S03-U180 — 剣闘獣 (Gladiator Beast) common mechanism
   -------------------------------------------------------------------------
   2011 texts share three shapes:
   1. 「このカードが戦闘を行ったバトルフェイズ終了時にこのカードをデッキ（融合デッキ）に戻す事で、デッキから「X」以外の「剣闘獣」と名のついた
      モンスターN体を特殊召喚する」 — an optional trigger at the end of any Battle Phase in which this card battled; the return is the cost.
   2. 「このカードが「剣闘獣」と名のついたモンスターの効果によって特殊召喚に成功した時／場合、…」 — the summoned card carries
      gladiatorSummonedS03 (zone-local, set by FX_SPECIAL_SUMMON when a gladiator monster's effect summons it: action flag gladiatorS03).
   3. 「戦闘を行った」 = went through damage calculation this turn: card.battledTurnS03 (stamped by the ATTACK action on both monsters;
      zone-local).
   Summons from the Deck use journaled registry choices (card(s), then face-up Attack / Defense for each), so save / resume and Replay
   work; FX_SPECIAL_SUMMON from the Deck shuffles it.
   ========================================================================= */
/* 「剣闘獣」と名のついたカード: the P4 set code authority (SETCODE.GLADIATOR_BEAST), not a name prefix */
function isGladiatorCardDbS03(d){ return !!d && (typeof isSetCardV4==='function' ? isSetCardV4(d, SETCODE.GLADIATOR_BEAST) : String(d.n||'').indexOf('剣闘獣')>=0); }
function isGladiatorMonsterS03(card){ const d = card && dbOf(card); return !!(d && d.k==='m' && isGladiatorCardDbS03(d)); }
function gladiatorDeckPoolS03(p, exclude, reason){
  return API.pileCards(p, 'deck', x=>isGladiatorMonsterS03(x.card) && x.db.n!==exclude
    && (typeof canEffectSpecialSummonS03!=='function' || canEffectSpecialSummonS03(x.card, 'deck', reason)));
}
function gladiatorBattledS03(card){ return !!card && card.battledTurnS03===gameState.turn; }
function gladiatorSummonedS03(card){ return !!(card && card.gladiatorSummonedS03); }
function gladiatorSpecialLockedS03(p){
  const f = gameState.players[p].temporaryFlags;
  return !!(f && f.noSpecialSummon);
}

/* Open the summon: pick exactly `count` gladiator monsters from the Deck (none if fewer are available / not enough zones). */
function gladiatorSummonFromDeckS03(p, name, exclude, count){
  const pool = gladiatorDeckPoolS03(p, exclude, name);
  const room = ZONE_LIMITS.mz - gameState.players[p].mz.length;
  if(pool.length < count || room < count || gladiatorSpecialLockedS03(p)){
    API.shuffle(p);
    API.log(`${name}：特殊召喚できる「剣闘獣」がデッキに${count}体ない（デッキをシャッフル）`);
    return false;
  }
  return API.requestChoice({player:p, kind:'card', title:`${name}：特殊召喚する「剣闘獣」${count>1?`（${count}体）`:''}`,
    candidates:pool, min:count, max:count, cancelable:false,
    resume:{handler:'s03u180.glad-pick', args:{player:p, name}}, meta:{scriptName:name}});
}
function gladiatorNextPosS03(p, name, queue){
  while(queue.length){
    const h = findCardByUid(queue[0]);
    if(h && h.p===p && h.zone==='deck' && hasMonsterZoneSpace(p)) break;
    queue.shift();
  }
  if(!queue.length) return;
  API.requestChoice({player:p, kind:'declare', title:`${name}：${cardName(findCardByUid(queue[0]).card)} の表示形式`,
    candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}], min:1, max:1, cancelable:false,
    resume:{handler:'s03u180.glad-pos', args:{player:p, name, queue}}, meta:{scriptName:name}});
}
registerChoiceHandlerV49('s03u180.glad-pick', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const uids = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  gladiatorNextPosS03(args.player, args.name, uids);
});
registerChoiceHandlerV49('s03u180.glad-pos', (answer, args)=>{
  if(!args || !Array.isArray(args.queue) || !args.queue.length) return;
  const pick = answer && answer.cards && answer.cards[0];
  const pos = (pick && pick.value==='def') ? 'def' : 'atk';
  const queue = args.queue.slice();
  const h = findCardByUid(queue.shift());
  if(h && h.p===args.player && h.zone==='deck' && hasMonsterZoneSpace(args.player))
    API.specialSummon(args.player, 'deck', h.index, pos, args.name, null, {gladiatorS03:true});
  gladiatorNextPosS03(args.player, args.name, queue);
});

/* Shape 1 — the tag-out (v4 trigger effect). opts: {count:1, exclude:name, requireGladiatorSummoned:false, forcedStay:false} */
function gladiatorTagOutEffectS03(name, opts){
  const o = Object.assign({count:1, exclude:name}, opts||{});
  const roomAfter = (ctx)=>ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length + (o.stay ? 0 : 1);
  return {
    key:'tag-out', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.DECK, targetSide:'self',
    speed:1, events:['onBattlePhaseEnd'], forced:!!o.stay,
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up' || !gladiatorBattledS03(ctx.card)) return false;
      if(o.requireGladiatorSummoned && !gladiatorSummonedS03(ctx.card)) return false;
      if(gladiatorSpecialLockedS03(ctx.player)) return false;
      if(!o.stay && gladiatorDeckPoolS03(ctx.player, o.exclude, name).length < o.count) return false;
      return roomAfter(ctx) >= o.count;
    },
    cost: o.stay ? null : function(ctx, done){
      const h = findCardByUid(ensureCardUid(gameState, ctx.card));
      if(!h || h.zone!=='mz'){ done(false); return; }
      const owner = cardOwnerIndex(gameState, h.card, h.p);
      act({type:'FX_RETURN_DECK', player:h.p, zone:'mz', index:h.index, toBottom:false, reason:`${name}（コスト）`});
      const now = findCardByUid(h.card.uid);
      if(now && now.zone==='deck') act({type:'SHUFFLE', player:owner});
      done(!!now && (now.zone==='deck' || now.zone==='ex'));
    },
    operation(ctx){ gladiatorSummonFromDeckS03(ctx.player, name, o.exclude, o.count); },
    afterResolve(){}
  };
}
/* Shape 2 — 「剣闘獣」の効果によって特殊召喚に成功した時 (v4 trigger effect) */
function gladiatorOnSummonEffectS03(key, spec){
  return Object.assign({
    key, type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:!!spec.forced,
    condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gladiatorSummonedS03(ctx.card) && (!spec.cond || spec.cond(ctx)); },
    afterResolve(){}
  }, spec.effect);
}
/* the card-level passive for both events */
function gladiatorPassiveS03(effects){
  const has = ev=>effects.some(e=>(e.events||[]).indexOf(ev)>=0);
  const p = {};
  if(has('onBattlePhaseEnd')) p.onBattlePhaseEnd = ctx=>effects.some(e=>(e.events||[]).indexOf('onBattlePhaseEnd')>=0 && e.condition(ctx));
  if(has('onSpecialSummon')) p.onSpecialSummon = ctx=>effects.some(e=>(e.events||[]).indexOf('onSpecialSummon')>=0 && e.condition(ctx));
  return p;
}
function defineGladiatorS03(name, effects, meta){
  return defineUnifiedCardV4(name, effects, Object.assign({type:'monster', priority:1, passive:gladiatorPassiveS03(effects)}, meta||{}));
}
