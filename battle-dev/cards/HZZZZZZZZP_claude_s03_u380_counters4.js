/* S03-U380: four NOT_STARTED cards with counters / graveyard recursion (carddata texts).

   創世神              自分の墓地からモンスターを1体選択する。手札を1枚墓地に送り、選択したモンスター1体を特殊召喚する。この効果は1ターンに1度しか使用できない。このカードは墓地からの特殊召喚はできない。
   魂を喰らう者 バズー  1ターンに1度、自分の墓地に存在するモンスターを3体までゲームから除外して発動する事ができる。このカードの攻撃力は相手のエンドフェイズ時まで、除外したモンスター1体につき300ポイントアップする。
   マシン・デベロッパー （永続魔法）このカードがフィールド上に存在する限り、フィールド上の機械族モンスターの攻撃力は200ポイントアップする。フィールド上の機械族モンスターが戦闘またはカードの効果によって破壊される度に、このカードにジャンクカウンターを2つ置く。また、ジャンクカウンターが乗っているこのカードを墓地へ送って発動できる。このカードに乗っていたジャンクカウンターの数以下のレベルを持つ機械族モンスター1体を自分の墓地から選択して特殊召喚する。
   世界樹              （永続魔法）フィールド上の植物族モンスターが破壊される度に、このカードにフラワーカウンターを1つ置く。また、このカードに乗っているフラワーカウンターを任意の個数取り除いて以下の効果を発動できる。●1つ:フィールド上の植物族モンスター1体を選択し、その攻撃力・守備力をエンドフェイズ時まで400ポイントアップする。●2つ:フィールド上のカード1枚を選択して破壊する。●3つ:自分の墓地の植物族モンスター1体を選択して特殊召喚する。

   Notes
   - マシン・デベロッパー / 世界樹: the counters follow 魔法族の結界 (S03-U239) — a forced onDestroy trigger of the face-up Continuous Spell reading the destroyed monsters in the Graveyards (graveInfo byDestroy, from 'mz', face 'up') — but count every not-yet-counted monster at once (the engine offers one trigger per window when two monsters die together); each monster places its counters (2 / 1).
     世界樹's three options are one ignition effect: the cost asks (yes / no, highest usable option first) how many counters to remove; the number is kept in a player flag for the target and the operation.
   - マシン・デベロッパー's number of counters is kept in a player flag when the card is sent to the Graveyard as the cost (the counters leave with it).
   - バズー: the cost banishes 1 to 3 Graveyard monsters (free multi-pick); +300 each as a stat modifier that resets at the end of the opponent's turn (RESET.OPPO_TURN).
   - 創世神: the discard is the cost, the target is chosen at activation; 「墓地からの特殊召喚はできない」 is the engine rule of S03-U358. */

/* ---- 創世神 ---- */
function u380GenesisPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && canEffectSpecialSummonS03(x.card, 'grave', '創世神')); }
defineUnifiedCardV4('創世神', [{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u380GenesisPool(ctx).length){ ctx.reason = '墓地に特殊召喚できるモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('創世神：墓地へ送る手札', API.pileCards(ctx.player, 'hand', ()=>true), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '創世神（コスト）', {byEffect:false}); done(true);
    });
  },
  target(ctx, done){ API.selectCard('創世神：特殊召喚する墓地のモンスター', u380GenesisPool(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', '創世神');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], includesSpecialSummon:true});

/* ---- 魂を喰らう者 バズー ---- */
function u380BazuPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m'); }
defineUnifiedCardV4('魂を喰らう者 バズー', [{
  key:'devour', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u380BazuPool(ctx).length){ ctx.reason = '墓地にモンスターがいません'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u380BazuPool(ctx);
    v46PickAnyAtLeastOne('魂を喰らう者 バズー：ゲームから除外する墓地のモンスター', pool, Math.min(3, pool.length), picked=>{
      if(!picked.length){ done(false); return; }
      API.setFlag(ctx.player, 'u380BazuN', picked.length, true);
      picked.slice().sort((a,b)=>b.index-a.index).forEach(t=>{ const h = findCardByUid(ensureCardUid(gameState, t.card)); if(h && h.zone==='grave') API.banish(h, '魂を喰らう者 バズー（コスト）'); });
      done(true);
    });
  },
  operation(ctx){
    const n = Math.min(3, Number(API.getFlag(ctx.player, 'u380BazuN'))||0); if(n<=0) return;
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz' || me.card.face!=='up') return;
    v4RegisterStatModifier(me, {atk:300*n}, {code:'魂を喰らう者 バズー', resetMask:RESET.OPPO_TURN|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, timing:['mainPhase']});

/* ---- 永続魔法のカウンター共通: monsters destroyed on the field since this card was activated ----
   The engine offers a card's forced trigger once per window even when two monsters are destroyed at the same time (ブラック・ホール), so the trigger
   counts every not-yet-counted destroyed monster of both Graveyards (graveInfo byDestroy / from mz / face up / this turn); the counted uids are
   kept in a zone-local card flag {turn, uids}. The activation itself marks the monsters destroyed earlier in the turn as already seen. */
function u380Seen(card){ const s = card && card.u380Seen; return (s && Number(s.turn)===Number(gameState.turn) && Array.isArray(s.uids)) ? s.uids : []; }
function u380Fresh(card, pred){
  const seen = u380Seen(card), out = [];
  [0,1].forEach(p=>API.pileCards(p, 'grave', x=>{
    const g = x.card.graveInfo;
    return x.db.k==='m' && pred(x.db) && !!g && g.byDestroy && g.from==='mz' && g.face==='up' && Number(g.turn)===Number(gameState.turn) && seen.indexOf(ensureCardUid(gameState, x.card))<0;
  }).forEach(x=>out.push(x)));
  return out;
}
function u380Mark(ctx, list){
  const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
  API.setCardFlag(me, 'u380Seen', {turn:gameState.turn, uids:u380Seen(me.card).concat(list.map(x=>x.card.uid))}, '', {silent:true});
}
function u380Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }

/* ---- マシン・デベロッパー ---- */
const U380_JUNK = 'ジャンク';
function u380Machine(db){ return !!db && db.ra==='機械'; }
function u380JunkN(card){ return Number((card.counters||{})[U380_JUNK])||0; }
defineUnifiedCardV4('マシン・デベロッパー', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !u380Ready(ctx); }, operation(ctx){ u380Mark(ctx, u380Fresh(ctx.card, u380Machine)); }, afterResolve(){}
}, {
  key:'machine-destroyed', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDestroy'], forced:true,
  condition(ctx){ return u380Ready(ctx) && u380Fresh(ctx.card, u380Machine).length>0; },
  operation(ctx){ const list = u380Fresh(ctx.card, u380Machine), h = locateCardAnyV4(ctx.card); if(!list.length || !h || h.zone!=='sz') return; u380Mark(ctx, list); API.addCounter(locateCardAnyV4(ctx.card), U380_JUNK, 2*list.length); },
  afterResolve(){}
}, {
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(!u380Ready(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    const n = u380JunkN(ctx.card);
    if(n<1){ ctx.reason = 'ジャンクカウンターが乗っていません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u380Machine(x.db) && Number(x.db.lv)<=n && canEffectSpecialSummonS03(x.card, 'grave', 'マシン・デベロッパー')).length){ ctx.reason = 'ジャンクカウンターの数以下のレベルの機械族モンスターが墓地にいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz'){ done(false); return; }
    API.setFlag(ctx.player, 'u380JunkSent', u380JunkN(me.card), true);
    const me2 = locateCardAnyV4(ctx.card); API.sendToGrave(me2, 'マシン・デベロッパー（コスト）'); done(true);
  },
  target(ctx, done){
    const n = Number(API.getFlag(ctx.player, 'u380JunkSent'))||u380JunkN(ctx.card);
    API.selectCard('マシン・デベロッパー：特殊召喚する機械族モンスター', API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u380Machine(x.db) && Number(x.db.lv)<=n && canEffectSpecialSummonS03(x.card, 'grave', 'マシン・デベロッパー')), t=>done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'マシン・デベロッパー');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, includesSpecialSummon:true, fieldIgnition:true, activateFrom:['sz'],
  continuous:{ scope:'allMonsters', from:['sz'], apply(card, self){ return (self && self.face==='up' && card && card.face==='up' && u380Machine(dbOf(card))) ? {atk:200} : null; } } });

/* ---- 世界樹 ---- */
const U380_FLOWER = 'フラワー';
function u380Plant(db){ return !!db && db.ra==='植物'; }
function u380FlowerN(card){ return Number((card.counters||{})[U380_FLOWER])||0; }
function u380TreePlants(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && u380Plant(x.db)}); }
function u380TreeGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u380Plant(x.db) && canEffectSpecialSummonS03(x.card, 'grave', '世界樹')); }
/* which of the three options (counters to remove) can be used now */
function u380TreeOptions(ctx){
  const n = u380FlowerN(ctx.card), out = [];
  if(n>=3 && hasMonsterZoneSpace(ctx.player) && u380TreeGrave(ctx).length) out.push(3);
  if(n>=2 && API.fieldCards({}).length) out.push(2);
  if(n>=1 && u380TreePlants().length) out.push(1);
  return out;
}
const U380_TREE_TEXT = {1:'1つ取り除く：植物族モンスター1体の攻撃力・守備力を400アップ', 2:'2つ取り除く：フィールドのカード1枚を破壊', 3:'3つ取り除く：墓地の植物族モンスター1体を特殊召喚'};
defineUnifiedCardV4('世界樹', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !u380Ready(ctx); }, operation(ctx){ u380Mark(ctx, u380Fresh(ctx.card, u380Plant)); }, afterResolve(){}
}, {
  key:'plant-destroyed', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDestroy'], forced:true,
  condition(ctx){ return u380Ready(ctx) && u380Fresh(ctx.card, u380Plant).length>0; },
  operation(ctx){ const list = u380Fresh(ctx.card, u380Plant), h = locateCardAnyV4(ctx.card); if(!list.length || !h || h.zone!=='sz') return; u380Mark(ctx, list); API.addCounter(locateCardAnyV4(ctx.card), U380_FLOWER, list.length); },
  afterResolve(){}
}, {
  key:'spend', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){
    if(!u380Ready(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u380TreeOptions(ctx).length){ ctx.reason = '使える効果がありません（フラワーカウンターの数と対象を確認してください）'; return false; }
    return true;
  },
  cost(ctx, done){
    const opts = u380TreeOptions(ctx);
    const ask = i=>{
      if(i>=opts.length){ done(false); return; }
      const n = opts[i];
      API.confirm('世界樹', U380_TREE_TEXT[n]+'（この効果を発動しますか？）', ()=>{
        const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='sz' || u380FlowerN(h.card)<n){ done(false); return; }
        API.removeCounter(h, U380_FLOWER, n); API.setFlag(ctx.player, 'u380TreeN', n, true); done(true);
      }, ()=>ask(i+1));
    };
    ask(0);
  },
  target(ctx, done){
    const n = Number(API.getFlag(ctx.player, 'u380TreeN'))||0;
    if(n===1) API.selectCard('世界樹：攻撃力・守備力をアップする植物族モンスター', u380TreePlants(), t=>done([t]));
    else if(n===2) API.selectCard('世界樹：破壊するフィールドのカード', API.fieldCards({}), t=>done([t]));
    else API.selectCard('世界樹：特殊召喚する墓地の植物族モンスター', u380TreeGrave(ctx), t=>done([t]));
  },
  operation(ctx){
    const n = Number(API.getFlag(ctx.player, 'u380TreeN'))||0;
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(!r) return;
    if(n===1 && r.zone==='mz' && r.card.face==='up') v4RegisterStatModifier(r, {atk:400, def:400}, {code:'世界樹', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    else if(n===2 && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, '世界樹');
    else if(n===3 && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', '世界樹');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, includesSpecialSummon:true, fieldIgnition:true, activateFrom:['sz']});
