/* S03-U331: five 「ゼンマイ」 monsters (carddata texts; 「ゼンマイ」 = a monster whose name contains ゼンマイ). Each effect "can be used only once while the card is face-up on the field": the card flag u331Used (zone-local, so it resets when the card leaves the field).

   ゼンマイウォリアー  自分フィールド上に表側表示で存在する「ゼンマイ」モンスター1体を選択して発動する事ができる。エンドフェイズ時まで選択したモンスター1体のレベルを1つ上げ、攻撃力を600ポイントアップする。
   ゼンマイナイト      自分フィールド上に表側表示で存在する「ゼンマイ」モンスターが攻撃対象に選択された時、そのモンスターの攻撃を無効にする事ができる。
   ゼンマイハンター    自分のメインフェイズ時、「ゼンマイハンター」以外の自分フィールド上に表側表示で存在する「ゼンマイ」モンスター1体をリリースして発動する事ができる。相手の手札をランダムに1枚墓地へ送る。
   ゼンマイバット      自分のメインフェイズ時に発動する事ができる。自分フィールド上に表側攻撃表示で存在するこのカードを表側守備表示に変更し、自分の墓地の「ゼンマイ」モンスター1体を選択して手札に加える。
   ゼンマイマジシャン  「ゼンマイマジシャン」以外の「ゼンマイ」モンスターの効果が発動した場合、自分のデッキからレベル4以下の「ゼンマイ」モンスター1体を表側守備表示で特殊召喚する事ができる。

   Notes
   - The 「once」 flag is set when the effect is activated (cost step) — a negated / disrupted activation still uses it (the text limits the use). The random hand card is the replay-safe duelRandomInt.
   - ナイト: an optional trigger at the attack declaration (as ナチュル・スティンクバグ); the target is any face-up 「ゼンマイ」 of mine, itself included.
   - マジシャン: an optional trigger after the activation of another 「ゼンマイ」 monster's effect (either player's monster; the card must be face-up); the summoned monster is face-up Defense.
   - ゼンマイマニュファクチャ (a Continuous Spell) is not part of this unit. */

function u331Zen(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('ゼンマイ')>=0; }
function u331Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u331Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u331OwnZen(ctx, except){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==except && x.card.face==='up' && u331Zen(x.db)}); }
function u331MarkUsed(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u331Used', true, '', {silent:true}); }
function u331Free(ctx){ return ctx.card.u331Used!==true; }
function u331Ignition(name, key, condition, extra){
  return Object.assign({ key, type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    condition(ctx){
      if(!u331Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
      if(!u331Free(ctx)){ ctx.reason = 'この効果はこのカードがフィールド上に表側表示で存在する限り1度しか使用できません'; return false; }
      return condition(ctx);
    },
    afterResolve(){} }, extra);
}

/* ---- ウォリアー ---- */
defineUnifiedCardV4('ゼンマイウォリアー', [u331Ignition('ゼンマイウォリアー', 'boost', ctx=>{
  if(!u331OwnZen(ctx).length){ ctx.reason = '表側表示の「ゼンマイ」がいません'; return false; } return true;
}, {
  targetRange:LOCATION.MZONE, targetSide:'self',
  cost(ctx, done){ u331MarkUsed(ctx); done(true); },
  target(ctx, done){ API.selectCard('ゼンマイウォリアー：レベルと攻撃力を上げる「ゼンマイ」', u331OwnZen(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.player && r.card.face==='up'){ API.modLevel(r, 1, 'endTurn', 'ゼンマイウォリアー'); API.modAtk(r, 600, 0, 'endTurn', 'ゼンマイウォリアー'); }
  }
})], {type:'monster', priority:1, targets:true});

/* ---- ナイト ---- */
function u331Attacked(ctx){
  const a = gameState.pendingAttack, t = a && a.targetUid!=null ? findCardByUid(a.targetUid) : null;
  return !!(a && a.player===ctx.opponent && t && t.zone==='mz' && t.p===ctx.player && t.card.face==='up' && u331Zen(dbOf(t.card)));
}
defineUnifiedCardV4('ゼンマイナイト', [{
  key:'negate-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ return u331Up(ctx) && u331Free(ctx) && u331Attacked(ctx); },
  cost(ctx, done){ u331MarkUsed(ctx); done(true); },
  operation(){ API.negateAttack('ゼンマイナイト'); },
  afterResolve(){}
}], {type:'monster', priority:2, passive:{ onAttackDeclare(ctx){ return u331Up(ctx) && u331Free(ctx) && u331Attacked(ctx); } }});

/* ---- ハンター ---- */
defineUnifiedCardV4('ゼンマイハンター', [u331Ignition('ゼンマイハンター', 'release-discard', ctx=>{
  if(!u331Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
  if(!u331OwnZen(ctx, ctx.card).filter(x=>x.db.n!=='ゼンマイハンター').length){ ctx.reason = 'リリースする他の表側表示の「ゼンマイ」がいません'; return false; }
  if(!(gameState.players[ctx.opponent].hand||[]).length){ ctx.reason = '相手の手札がありません'; return false; }
  return true;
}, {
  cost(ctx, done){
    const pool = u331OwnZen(ctx, ctx.card).filter(x=>x.db.n!=='ゼンマイハンター');
    API.selectCard('ゼンマイハンター：リリースする「ゼンマイ」', pool, t=>{
      const r = t && resolveTarget(t);
      if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'ゼンマイハンター（リリース）'); u331MarkUsed(ctx); done(true);
    });
  },
  operation(ctx){
    const h = gameState.players[ctx.opponent].hand||[]; if(!h.length) return;
    API.sendHandToGrave(ctx.opponent, duelRandomInt(h.length, gameState), 'ゼンマイハンター');
  }
})], {type:'monster', priority:1});

/* ---- バット ---- */
function u331GraveZen(ctx){ return API.pileCards(ctx.player, 'grave', x=>u331Zen(x.db)); }
defineUnifiedCardV4('ゼンマイバット', [u331Ignition('ゼンマイバット', 'to-defense-recover', ctx=>{
  if(!u331Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
  if(ctx.card.pos!=='atk'){ ctx.reason = '表側攻撃表示で存在する必要があります'; return false; }
  if(!u331GraveZen(ctx).length){ ctx.reason = '墓地に「ゼンマイ」モンスターがいません'; return false; }
  return true;
}, {
  targetRange:LOCATION.GRAVE, targetSide:'self',
  cost(ctx, done){ u331MarkUsed(ctx); done(true); },
  target(ctx, done){ API.selectCard('ゼンマイバット：手札に加える墓地の「ゼンマイ」', u331GraveZen(ctx), t=>done([t])); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up' && me.card.pos==='atk') API.changePosition(me, 'def', 'ゼンマイバット');
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && u331Zen(dbOf(r.card))) API.returnToHand(r, 'ゼンマイバット');
  }
})], {type:'monster', priority:1, targets:true});

/* ---- マジシャン ---- */
function u331DeckLow(p){ return API.pileCards(p, 'deck', x=>u331Zen(x.db) && (x.db.lv||99)<=4); }
function u331ZenEffect(ctx){
  const e = ctx.event;
  if(!e || e.kind!=='monster' || e.cardId==null) return false;
  const db = CARD_DB[e.cardId];
  return u331Zen(db) && db.n!=='ゼンマイマジシャン';
}
defineUnifiedCardV4('ゼンマイマジシャン', [{
  key:'summon-zen', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'],
  condition(ctx){ return u331Up(ctx) && u331Free(ctx) && u331ZenEffect(ctx) && u331DeckLow(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); },
  cost(ctx, done){ u331MarkUsed(ctx); done(true); },
  operation(ctx){
    const pool = u331DeckLow(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('ゼンマイマジシャン：特殊召喚する「ゼンマイ」（レベル4以下）', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && hasMonsterZoneSpace(ctx.player)){ API.specialSummon(ctx.player, 'deck', r.index, 'def', 'ゼンマイマジシャン'); API.shuffle(ctx.player); }
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, includesSpecialSummon:true, timing:['free'],
  passive:{ onActivateSuccess(ctx){ return u331Up(ctx) && u331Free(ctx) && u331ZenEffect(ctx) && u331DeckLow(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } }});
