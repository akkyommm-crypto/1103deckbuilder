/* S03-U52 AUTO_DECK_TABLE "ignition" cards that must be triggers — replaces the coarse table entries (cards/40) by name.
   Found by a DUEL probe after R1 (【Jurrac】 vs 1103兎ラギア, seed 0x52310705 first 1, turn 20: ジュラック・ヴェロー used from the field in Main Phase):
   the table turned "recruit / search" entries with trig:"ignition" into Main Phase effects with no zone and no event, so a face-up copy
   could Special Summon / search from the Deck at will. Among Astra's fixed lists this affected three cards.
   2011 sources (yugioh-wiki): 《ジュラック・ヴェロー》 age 33 (2011-08-20; trigger effect, FAQ 08/12/06); 《カラクリ兵 弐参六》 age 12 (2011-08-04;
   trigger effect); 《ワーム・カルタロス》 age 13 (2009-11-06, the last revision before 2011-09; flip effect).
   Not covered here (recorded): カラクリ兵 弐参六's must-attack and "attack target → defense position" effects. */

/* 攻撃表示でフィールドに存在していた時に戦闘で破壊されたか（攻撃したモンスターは攻撃表示、攻撃対象はダメージ計算時の表示形式） */
function u52WasFaceUpAttackInBattle(card){
  const b = (typeof battleContextV28==='function') ? battleContextV28() : (gameState.lastBattle||{});
  if(!b || !card) return false;
  if(b.atkCard === card) return true;
  if(b.defCard === card){
    const pos = gameState.battle ? gameState.battle.defPosAtCalc : null;
    return pos === 'atk';
  }
  return false;
}
function u52DeckPool(p, group, filter){
  return API.pileCards(p, 'deck', x => x.db.k==='m' && !x.db.ex && isSetCardV4(x.db, group) && (!filter || filter(x)));
}
function u52BattleRecruitScript(name, pool, pos, extraCondition){
  defineScript(name, {
    type:'monster', priority:1, dsTiming:'leave', includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
    condition(ctx){
      if(ctx.eventName!=='onBattleDestroy' || ctx.zone!=='grave' || !(ctx.event && ctx.event.card===ctx.card)){ ctx.reason='このカードが戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
      if(extraCondition && !extraCondition(ctx)) return false;
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason='モンスターゾーンが一杯です'; return false; }
      if(!pool(ctx.player).length){ ctx.reason='デッキに特殊召喚できるモンスターがいません'; return false; }
      return true;
    },
    selectTargets(ctx, done){ API.selectCard(name+'：特殊召喚するモンスター', pool(ctx.player), t=>done([t])); },
    resolve(ctx){
      const t = (ctx.selectedTargets||[])[0]; if(!t) return;
      if(!hasMonsterZoneSpace(ctx.player)) return;
      const now = pool(ctx.player).filter(x => x.card===t.card);
      if(now.length) API.specialSummon(ctx.player, 'deck', now[0].index, pos, name);
    },
    afterResolve(){},
    passive:{ onBattleDestroy(ctx){ return ctx.zone==='grave' && !!ctx.event && ctx.event.card===ctx.card; } }
  });
}

/* ジュラック・ヴェロー：自分フィールド上に表側攻撃表示で存在するこのカードが戦闘によって破壊され墓地へ送られた時、
   デッキから攻撃力1700以下の「ジュラック」と名のついたモンスター1体を特殊召喚できる。 */
u52BattleRecruitScript('ジュラック・ヴェロー',
  p => u52DeckPool(p, SETCODE.JURRAC, x => (Number(x.db.atk)||0) <= 1700),
  'atk',
  ctx => { if(u52WasFaceUpAttackInBattle(ctx.card)) return true; ctx.reason='表側攻撃表示で戦闘によって破壊された場合のみ発動できます'; return false; });

/* カラクリ兵 弐参六：このカードが戦闘によって破壊され墓地へ送られた時、自分のデッキからレベル4以下の「カラクリ」と名のついたモンスター1体を
   表側攻撃表示で特殊召喚する事ができる。 */
u52BattleRecruitScript('カラクリ兵 弐参六',
  p => u52DeckPool(p, SETCODE.KARAKURI, x => (Number(x.db.lv)||99) <= 4),
  'atk', null);

/* ワーム・カルタロス：リバース：自分のデッキからレベル4以下の「ワーム」と名のついた爬虫類族モンスター1体を手札に加える。
   S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
function u52WormSearchPool(p){ return u52DeckPool(p, SETCODE.WORM, x => (Number(x.db.lv)||99) <= 4 && x.db.ra==='爬虫類'); }
API.registerChoiceHandler('s03u62.worm-cartaros-search', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const t = picks[0]; if(!t) return;
  const now = u52WormSearchPool(args.player).filter(x=>x.card===t.card);
  if(now.length) API.searchDeck(args.player, now[0].index, 'ワーム・カルタロス');
});
defineUnifiedCardV4('ワーム・カルタロス', [{
  key:'flip-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ return v44FlipSelfCondition(ctx); },
  operation(ctx){
    const pool = u52WormSearchPool(ctx.player);
    if(!pool.length){ API.log('ワーム・カルタロス：デッキに対象がないため手札に加えない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'ワーム・カルタロス：手札に加える「ワーム」',
      candidates: pool, min:1, max:1, cancelable:true,
      resume:{handler:'s03u62.worm-cartaros-search', args:{player:ctx.player}},
      meta:{scriptName:'ワーム・カルタロス'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }});
