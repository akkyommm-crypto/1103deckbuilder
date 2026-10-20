/* S03-U382: four NOT_STARTED cards (carddata texts).

   摩天楼 －スカイスクレイパー－ （フィールド魔法）①:「E・HERO」モンスターの攻撃力は、その攻撃力より高い攻撃力を持つモンスターに攻撃するダメージ計算時のみ1000アップする。
   極星宝グングニル           （罠）自分フィールド上に表側表示で存在する「極神」または「極星」と名のついたモンスター1体をゲームから除外し、フィールド上に存在するカード1枚を選択して発動する。選択したカードを破壊する。発動後2回目の自分のエンドフェイズ時に、この効果を発動するためにゲームから除外したモンスターを表側攻撃表示でフィールド上に戻す。
   紅蓮魔闘士                 ①:このカードは、自分の墓地の通常モンスターが3体の場合、その内の2体を除外し、手札から特殊召喚できる。②:1ターンに1度、自分の墓地のレベル4以下の通常モンスター1体を対象として発動できる。そのモンスターを特殊召喚する。
   樹海の射手                 このカードは通常召喚できない。自分の墓地に通常モンスターが2体以上存在する場合のみ特殊召喚する事ができる。このカードをリリースする事で、自分のデッキからデュアルモンスター1体を手札に加える。

   Notes
   - 摩天楼: continuous.apply on the Field Spell reads the damage step (a5InDamageStep / a5IsAttackerCard / a5BattleOtherOf, cards/A5): only the ATTACKING 「E・HERO」 (SETCODE.ELEMENTAL_HERO) whose current ATK (read without this bonus: a re-entrancy guard) is lower than the defender's ATK gets +1000.
   - 極星宝グングニル: cost = banish the own 極神 / 極星 monster (its uid goes to a scheduled End Phase handler); the 2nd End Phase of the controller is turns 2 (activated in the own turn) or 3 (activated in the opponent's turn); the monster returns face-up in Attack Position (API.specialSummon from the banish zone).
   - 紅蓮魔闘士 / 樹海の射手: summonProcedure from the hand (S03-U343 / u342PickN, 「通常モンスター」 = the Normal Monster type); 樹海の射手 cannotNormalSummon and its release effect is the cost (sent to the Graveyard); duals are read from the Monster type list (デュアル). */

/* ---- 摩天楼 ---- */
let U382_SKY_BUSY = false;
defineUnifiedCardV4('摩天楼 －スカイスクレイパー－', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.FIELD, speed:1, events:['activate'], operation(){}, afterResolve(){}
}], {type:'spell', priority:1,
  continuous:{ scope:'allMonsters', from:['field'],
    apply(card, self){
      if(U382_SKY_BUSY || !self || self.face!=='up' || !card || card.face!=='up' || !a5InDamageStep() || !a5IsAttackerCard(card)) return null;
      if(!isSetCardV4(dbOf(card), SETCODE.ELEMENTAL_HERO)) return null;
      const other = a5BattleOtherOf(card); if(!other) return null;
      U382_SKY_BUSY = true;
      let mine = 0, theirs = 0;
      try{ mine = curATK(card); theirs = curATK(other); }finally{ U382_SKY_BUSY = false; }
      return theirs > mine ? {atk:1000} : null;
    } } });

/* ---- 極星宝グングニル ---- */
API.registerScheduleHandler('u382.gungnir-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='banish' || h.p!==args.player || !hasMonsterZoneSpace(args.player)) return;
  API.specialSummon(args.player, 'banish', h.index, 'atk', '極星宝グングニル');
});
function u382Nordic(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && (String(x.db.n||'').indexOf('極神')>=0 || String(x.db.n||'').indexOf('極星')>=0)}); }
defineScript('極星宝グングニル', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!u382Nordic(ctx).length){ ctx.reason = '自分フィールドに表側表示の「極神」「極星」モンスターがいません'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    if(!API.fieldCards({}).length){ ctx.reason = 'フィールドにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('極星宝グングニル：ゲームから除外する「極神」「極星」モンスター', u382Nordic(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      const uid = ensureCardUid(gameState, r.card);
      API.banish(r, '極星宝グングニル（コスト）');
      const turns = gameState.activePlayer===ctx.player ? 2 : 3;
      API.schedule({at:'endPhase', turns, player:ctx.player, handler:'u382.gungnir-return', args:{uid, player:ctx.player}, note:'極星宝グングニル'});
      done(true);
    });
  },
  selectTargets(ctx, done){ API.selectCard('極星宝グングニル：破壊するフィールドのカード', API.fieldCards({}), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, '極星宝グングニル');
  },
  afterResolve(){}
});

/* ---- 紅蓮魔闘士 ---- */
function u382Normals(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && (x.db.st||[]).indexOf('通常')>=0); }
function u382Low(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && (x.db.st||[]).indexOf('通常')>=0 && Number(x.db.lv)<=4 && canEffectSpecialSummonS03(x.card, 'grave', '紅蓮魔闘士')); }
defineUnifiedCardV4('紅蓮魔闘士', [{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u382Low(ctx).length){ ctx.reason = '墓地にレベル4以下の通常モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('紅蓮魔闘士：特殊召喚する通常モンスター', u382Low(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', '紅蓮魔闘士');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['revive']}, timing:['mainPhase'], includesSpecialSummon:true,
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(u382Normals(ctx).length!==3){ ctx.reason = '自分の墓地の通常モンスターがちょうど3体の場合に特殊召喚できます'; return false; }
      return true;
    },
    cost(ctx, done){ u342PickN('紅蓮魔闘士：除外する墓地の通常モンスター', ctx, u382Normals, 2, h=>API.banish(h, '紅蓮魔闘士（特殊召喚の手順）'), done); }
  }});

/* ---- 樹海の射手 ---- */
function u382Duals(ctx){ return API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && (x.db.st||[]).indexOf('デュアル')>=0); }
defineUnifiedCardV4('樹海の射手', [{
  key:'search-dual', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u382Duals(ctx).length){ ctx.reason = 'デッキにデュアルモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, '樹海の射手（リリース）'); done(true); },
  operation(ctx){
    const pool = u382Duals(ctx); if(!pool.length){ API.shuffle(ctx.player); return; }
    API.selectCard('樹海の射手：手札に加えるデュアルモンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='deck' && r.p===ctx.player) API.searchDeck(ctx.player, r.index, '樹海の射手'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, timing:['mainPhase'],
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u382Normals(ctx).length<2){ ctx.reason = '自分の墓地に通常モンスターが2体以上必要です'; return false; }
      return true;
    },
    cost(ctx, done){ done(true); }
  }});
