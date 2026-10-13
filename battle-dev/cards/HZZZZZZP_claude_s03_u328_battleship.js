/* S03-U328: the five 「巨大戦艦」 (carddata texts). Common clauses:

   このカードは戦闘によっては破壊されない。戦闘を行った場合、ダメージステップ終了時にこのカードのカウンターを1つ取り除く。カウンターのない状態で戦闘を行った場合、ダメージステップ終了時にこのカードを破壊する。
   (召喚時 / 特殊召喚に成功した時にカウンターを置く: ビッグ・コア 3 / クリスタル・コア 3 / テトラン 3 / カバード・コア 2 / ビッグ・コアMk－II 3 (特殊召喚))

   巨大戦艦 カバード・コア   戦闘を行った場合、ダメージステップ終了時にコイントスで裏表を当てる。ハズレの場合、カードのカウンターを1つ取り除く。(…カウンターのない状態で戦闘を行った場合はこのカードを破壊する。)
   巨大戦艦 クリスタル・コア 1ターンに1度だけ自分のメインフェイズに、相手フィールド上の表側攻撃表示モンスター1体を表側守備表示にする事ができる。
   巨大戦艦 テトラン         このカードのカウンターを1つ取り除く事で、フィールド上の魔法・罠カード1枚を破壊する。この効果は1ターンに1度しか使用できない。
   巨大戦艦 ビッグ・コアMk－II 自分フィールド上にモンスターが存在しない場合、このカードはリリースなしで召喚する事ができる。

   Notes
   - The counter is the plain 「カウンター」 (API.addCounter). 「召喚時」 = Normal Summon success (Flip Summon / Special Summon do not place them; Mk－II's are placed on Special Summon success only — a Normal Summoned Mk－II has none).
   - 「戦闘を行った」: a battle with a monster (not a direct attack) read at the Damage Step's end window (dsTiming 'end'); the counter count is read at that time: with a counter → one is removed, without → it is destroyed. It cannot be destroyed by battle (protectV21).
   - カバード・コア: the controller calls Heads or Tails (a registry choice) and the replay-safe coin decides; a wrong call removes a counter. Without a counter it is destroyed (no toss).
   - テトラン: the cost removes a counter (once per turn; the target is any face-up or Set Spell / Trap on the field, chosen at activation). */

const U328_CTR = 'カウンター';
function u328Ctr(card){ return (card && card.counters && Number(card.counters[U328_CTR])) || 0; }
function u328Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u328Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u328Battled(ctx){
  const b = gameState.battle;
  return !!b && b.target!=='direct' && b.battled===true && ctx.card && (b.atkUid===ctx.card.uid || b.targetUid===ctx.card.uid);
}
function u328Placed(ctx, n, special){
  if(!u328Up(ctx) || !ctx.event || ctx.event.card!==ctx.card) return false;
  return special ? ctx.eventName==='onSpecialSummon' : ctx.eventName==='onNormalSummon';
}
function u328CounterEffect(n, special){
  return { key:'place-counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:[special?'onSpecialSummon':'onNormalSummon'], forced:true,
    condition(ctx){ return u328Placed(ctx, n, special); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.addCounter(me, U328_CTR, n); },
    afterResolve(){} };
}
function u328BattleEffect(coin){
  return { key:'battle-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return u328Up(ctx) && u328Battled(ctx); },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
      if(u328Ctr(me.card)<=0){ API.destroy(me, cardName(ctx.card)+'（カウンターなし）'); return; }
      if(!coin){ API.removeCounter(me, U328_CTR, 1); return; }
      API.requestChoice({player:ctx.player, kind:'option', title:'巨大戦艦 カバード・コア：コイントスの裏表を当てる', candidates:[{key:'heads', value:'heads', label:'表'}, {key:'tails', value:'tails', label:'裏'}],
        min:1, max:1, cancelable:false, resume:{handler:'u328.coin-call', args:{player:ctx.player, uid:ctx.card.uid}}, meta:{scriptName:'巨大戦艦 カバード・コア'}});
    },
    afterResolve(){} };
}
API.registerChoiceHandler('u328.coin-call', (answer, args)=>{
  const c = (answer && answer.cards || [])[0], call = (c && c.value==='tails') ? 'tails' : 'heads';
  const heads = duelRandomInt(2, gameState)===0;
  API.log('巨大戦艦 カバード・コア：コイントスは'+(heads?'表':'裏')+'（宣言：'+(call==='heads'?'表':'裏')+'）');
  if((heads?'heads':'tails')===call) return;
  const me = args.uid!=null ? findCardByUid(args.uid) : null;
  if(me && me.zone==='mz') API.removeCounter(me, U328_CTR, 1);
});
function u328Meta(extra){
  return Object.assign({type:'monster', priority:1, forced:true, timing:['free'], dsTiming:'end',
    passive:{ onDamageStep(ctx){ return u328Up(ctx) && u328Battled(ctx); } },
    continuous:{ scope:'self', from:['mz'], apply(){ return null; }, protectV21:{ key:'巨大戦艦', label:'巨大戦艦', scope:'self', effect:false, battle:true } }
  }, extra||{});
}
function u328Define(name, n, special, coin, more, meta){
  const effects = [u328CounterEffect(n, special), u328BattleEffect(coin)].concat(more||[]);
  const m = u328Meta(meta);
  m.passive = Object.assign({}, m.passive, special ? { onSpecialSummon(ctx){ return u328Placed(ctx, n, true); } } : { onNormalSummon(ctx){ return u328Placed(ctx, n, false); } });
  return defineUnifiedCardV4(name, effects, m);
}

u328Define('巨大戦艦 ビッグ・コア', 3, false, false);
u328Define('巨大戦艦 カバード・コア', 2, false, true);

/* ---- クリスタル・コア ---- */
u328Define('巨大戦艦 クリスタル・コア', 3, false, false, [{
  key:'to-defense', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u328Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u328Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}).length){ ctx.reason = '相手フィールド上に表側攻撃表示のモンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}); if(!pool.length) return;
    API.selectCard('巨大戦艦 クリスタル・コア：守備表示にする相手モンスター', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up' && r.card.pos==='atk') API.changePosition(r, 'def', '巨大戦艦 クリスタル・コア');
    });
  },
  afterResolve(){}
}], {countLimit:{n:1, effects:['to-defense']}});

/* ---- テトラン ---- */
function u328St(){ return API.fieldCards({}).filter(x=>x.zone==='sz' || x.zone==='field'); }
u328Define('巨大戦艦 テトラン', 3, false, false, [{
  key:'remove-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.ONFIELD, targetSide:'both',
  condition(ctx){
    if(!u328Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(u328Ctr(ctx.card)<1){ ctx.reason = 'カウンターが乗っていません'; return false; }
    if(!u328St().length){ ctx.reason = 'フィールド上に魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz' || u328Ctr(me.card)<1){ done(false); return; } API.removeCounter(me, U328_CTR, 1); done(true); },
  target(ctx, done){ API.selectCard('巨大戦艦 テトラン：破壊する魔法・罠カード', u328St(), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && (r.zone==='sz' || r.zone==='field')) API.destroy(r, '巨大戦艦 テトラン'); },
  afterResolve(){}
}], {targets:true, countLimit:{n:1, effects:['remove-destroy']}});

/* ---- ビッグ・コアMk－II ---- */
u328Define('巨大戦艦 ビッグ・コアMk－II', 3, true, false, [], {
  normalSummonProcedure:{ includeStandard:true, methods:[{id:'bigcoreMk2', tributes:0, modes:['summon'], summonLabel:'リリースなしで召喚（自分フィールドにモンスターがいない場合）',
    condition({player}){ return !(gameState.players[player].mz||[]).filter(Boolean).length; } }]}
});
