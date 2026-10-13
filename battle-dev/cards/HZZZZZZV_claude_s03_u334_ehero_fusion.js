/* S03-U334: nine 「E・HERO」 Fusion Monsters (carddata texts). Fusion Summons come from 「融合」 (S03-U130); the effects:

   サンダー・ジャイアント   自分の手札を1枚捨てる事で、フィールド上に表側表示で存在する元々の攻撃力がこのカードの攻撃力よりも低いモンスター1体を選択して破壊する。この効果は1ターンに1度だけ自分のメインフェイズに使用する事ができる。
   ジ・アース               ①:このカード以外の自分フィールドの表側表示の「E・HERO」モンスター1体をリリースして発動できる。このカードの攻撃力はターン終了時まで、リリースしたモンスターの攻撃力分アップする。
   セイラーマン             自分の魔法&罠カードゾーンにカードがセットされている場合、このカードは相手プレイヤーに直接攻撃をする事ができる。
   ダーク・ブライトマン     このカードが守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ相手ライフに戦闘ダメージを与える。また、このカードは攻撃した場合、ダメージステップ終了時に守備表示になる。このカードが破壊された時、
                            相手フィールド上のモンスター1体を選択して破壊する。
   ネクロイド・シャーマン   ①:このカードが特殊召喚に成功した場合、相手フィールドのモンスター1体を対象として発動する。その相手モンスターを破壊する。その後、相手の墓地からモンスター1体を選び、相手フィールドに特殊召喚する。
   プラズマヴァイスマン     自分のメインフェイズ時に、手札を1枚捨てて発動できる。相手フィールド上に攻撃表示で存在するモンスター1体を選択して破壊する。また、このカードが守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ相手ライフに戦闘ダメージを与える。
   マッドボールマン         (no effect text)
   ワイルド・ウィングマン   手札を1枚捨てる事で、フィールド上の魔法・罠カード1枚を破壊する。
   フレイム・ブラスト       水属性モンスターと戦闘を行う場合、ダメージステップの間このカードの攻撃力は1000ポイントアップする。

   Notes
   - サンダー・ジャイアント: 「元々の攻撃力」 = the printed ATK of the target compared with this card's current ATK; the discard is the cost; the target is chosen at activation. ワイルド・ウィングマン has no once-per-turn clause.
   - ダーク・ブライトマン: piercing (as ヴァイロン・コンポーネント); the Defense Position at the end of the Damage Step is a forced trigger (dsTiming 'end') when it was the attacker; the destruction trigger is a forced Graveyard trigger when it was destroyed on the field (target chosen at activation).
   - セイラーマン: canDirectAttack while a face-down card is in the Spell & Trap Zone. ネクロイド: the Special Summon trigger of the Fusion Summon (target); the opponent's Graveyard monster is chosen by its controller... here by the Fusion Monster's controller (「相手の墓地からモンスター1体を選び」) and Special Summoned onto the opponent's field.
   - Left: ランパートガンナー (a Defense Position monster attacking directly), ネオス・ナイト / ゴッド・ネオス / エリクシーラー (material provenance and Attribute identity), プラズマ / ダーク・ガイア etc. needing ダーク・フュージョン. */

function u334Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u334Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u334HandCost(label){
  return function(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length){ done(false); return; }
    API.selectCard(label+'：捨てる手札', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, label+'（コスト）'); done(true);
    });
  };
}
function u334Pierce(info){
  const self = info.self;
  if(!self || self.face!=='up' || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
  return Math.max(0, curATK(self) - curDEF(info.defCard));
}

/* ---- サンダー・ジャイアント ---- */
function u334Weaker(ctx){ return API.fieldCards({zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && Number(dbOf(x.card).atk)<curATK(ctx.card)}); }
defineUnifiedCardV4('E・HERO サンダー・ジャイアント', [{
  key:'discard-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'both',
  condition(ctx){
    if(!u334Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u334Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u334Weaker(ctx).length){ ctx.reason = '元々の攻撃力がこのカードの攻撃力より低い表側表示モンスターがいません'; return false; }
    return true;
  },
  cost:u334HandCost('E・HERO サンダー・ジャイアント'),
  target(ctx, done){ API.selectCard('E・HERO サンダー・ジャイアント：破壊するモンスター', u334Weaker(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.card.face==='up') API.destroy(r, 'E・HERO サンダー・ジャイアント'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['discard-destroy']}});

/* ---- ジ・アース ---- */
function u334Others(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && String(x.db.n||'').indexOf('E・HERO')===0}); }
defineUnifiedCardV4('E・HERO ジ・アース', [{
  key:'release-boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u334Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u334Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u334Others(ctx).length){ ctx.reason = 'リリースする他の表側表示の「E・HERO」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('E・HERO ジ・アース：リリースする「E・HERO」', u334Others(ctx), t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='mz' || !me || me.zone!=='mz'){ done(false); return; }
      API.setCardFlag(me, 'u334EarthAtk', curATK(r.card), 'E・HERO ジ・アース', {silent:true});   /* the Attack of the released monster, read before it leaves */
      API.sendToGrave(r, 'E・HERO ジ・アース（リリース）'); done(true);
    });
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const n = Number(me.card.u334EarthAtk) || 0;
    if(n>0) API.modAtk(me, n, 0, 'endTurn', 'E・HERO ジ・アース');
  },
  afterResolve(){}
}], {type:'monster', priority:1});

/* ---- セイラーマン ---- */
defineScript('E・HERO セイラーマン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  canDirectAttack(card, loc){
    if(!card || card.face!=='up' || !loc || loc.zone!=='mz' || (typeof effectNegated==='function' && effectNegated(card))) return false;
    return (gameState.players[loc.p].sz||[]).some(c=>c && c.face==='down');
  }
});

/* ---- ダーク・ブライトマン ---- */
function u334Attacked(ctx){ const b = gameState.battle; return !!b && u334Up(ctx) && b.target!=='direct' && b.battled===true && ctx.card.uid===b.atkUid; }
function u334DestroyedHere(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn) && !!g.byDestroy && API.fieldCards({player:ctx.opponent, zone:'mz'}).length>0;
}
defineUnifiedCardV4('E・HERO ダーク・ブライトマン', [{
  key:'to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u334Attacked(ctx) && ctx.card.pos==='atk'; },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up' && me.card.pos==='atk') API.changePosition(me, 'def', 'E・HERO ダーク・ブライトマン'); },
  afterResolve(){}
}, {
  key:'destroyed-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true, targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return u334DestroyedHere(ctx); },
  target(ctx, done){ API.selectCard('E・HERO ダーク・ブライトマン：破壊する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz'}), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent) API.destroy(r, 'E・HERO ダーク・ブライトマン'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true, timing:['free'], dsTiming:'end', activateFrom:['mz','grave'],
  passive:{ onDamageStep(ctx){ return u334Attacked(ctx) && ctx.card.pos==='atk'; }, onSendToGrave(ctx){ return u334DestroyedHere(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, piercingDamage:u334Pierce }});

/* ---- ネクロイド・シャーマン ---- */
registerDestroyAfterS03('u334.necroid-revive', (args)=>{
  if(!destroyedSinceS03(args.mark, [args.uid]).length) return;   /* 「その後」: only when the monster was really destroyed */
  const pool = API.pileCards(args.opp, 'grave', x=>x.db.k==='m');
  if(!pool.length || !hasMonsterZoneSpace(args.opp)) return;
  API.selectCard('E・HERO ネクロイド・シャーマン：相手フィールドに特殊召喚する相手の墓地のモンスター', pool, t2=>{
    const g = t2 && resolveTarget(t2);
    if(g && g.zone==='grave' && g.p===args.opp && hasMonsterZoneSpace(args.opp)) API.specialSummon(args.opp, 'grave', g.index, 'atk', 'E・HERO ネクロイド・シャーマン', args.opp);
  });
});
function u334SelfSummon(ctx){ return u334Up(ctx) && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx); }
defineUnifiedCardV4('E・HERO ネクロイド・シャーマン', [{
  key:'summon-destroy-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true, targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return u334SelfSummon(ctx) && API.fieldCards({player:ctx.opponent, zone:'mz'}).length>0; },
  target(ctx, done){ API.selectCard('E・HERO ネクロイド・シャーマン：破壊する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz'}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent) return;
    const mark = destroyMarkS03(), uid = r.card.uid != null ? r.card.uid : ensureCardUid(gameState, r.card);
    API.destroy(r, 'E・HERO ネクロイド・シャーマン');
    API.afterDestroyS03('u334.necroid-revive', {mark, uid, opp:ctx.opponent});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true, includesSpecialSummon:true, timing:['free'], passive:{ onSpecialSummon(ctx){ return u334SelfSummon(ctx) && API.fieldCards({player:ctx.opponent, zone:'mz'}).length>0; } }});

/* ---- プラズマヴァイスマン ---- */
function u334FoeAtk(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}); }
defineUnifiedCardV4('E・HERO プラズマヴァイスマン', [{
  key:'discard-destroy-atk', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(!u334Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u334Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u334FoeAtk(ctx).length){ ctx.reason = '相手フィールド上に攻撃表示のモンスターがいません'; return false; }
    return true;
  },
  cost:u334HandCost('E・HERO プラズマヴァイスマン'),
  target(ctx, done){ API.selectCard('E・HERO プラズマヴァイスマン：破壊する攻撃表示の相手モンスター', u334FoeAtk(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.pos==='atk') API.destroy(r, 'E・HERO プラズマヴァイスマン'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, continuous:{ scope:'self', from:['mz'], apply(){ return null; }, piercingDamage:u334Pierce }});

/* ---- マッドボールマン (no effect) ---- */
defineScript('E・HERO マッドボールマン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '効果を持たないカードです'; return false; },
  resolve(){}, afterResolve(){}
});

/* ---- ワイルド・ウィングマン ---- */
defineUnifiedCardV4('E・HERO ワイルド・ウィングマン', [{
  key:'discard-destroy-st', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.ONFIELD, targetSide:'both',
  condition(ctx){
    if(!u334Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u334Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!API.fieldCards({}).some(x=>x.zone==='sz' || x.zone==='field')){ ctx.reason = 'フィールド上に魔法・罠カードがありません'; return false; }
    return true;
  },
  cost:u334HandCost('E・HERO ワイルド・ウィングマン'),
  target(ctx, done){ API.selectCard('E・HERO ワイルド・ウィングマン：破壊する魔法・罠カード', API.fieldCards({}).filter(x=>x.zone==='sz' || x.zone==='field'), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && (r.zone==='sz' || r.zone==='field')) API.destroy(r, 'E・HERO ワイルド・ウィングマン'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true});

/* ---- フレイム・ブラスト ---- */
defineScript('E・HERO フレイム・ブラスト', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self || self.face!=='up' || !a5InDamageStep()) return null;
      const o = a5BattleOtherOf(self);
      return (o && o.face==='up' && currentAttributeV17(o)==='水') ? {atk:1000} : null;
    } }
});
