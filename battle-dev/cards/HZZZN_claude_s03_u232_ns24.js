/* S03-U232: NOT_STARTED cards (2011 texts) — 熟練の白魔導師, 熟練の黒魔術師, 魔導獣 ケルベロス, 闇紅の魔導師, 機皇兵グランエル・アイン, No.56 ゴールドラット.
   Spell Counters: the v12 helpers (cards/97) — a Spell activation by either player puts a counter on the card in the monster zone. */

/* ---- 熟練の白魔導師 / 熟練の黒魔術師: このカードがフィールド上に表側表示で存在する限り、自分または相手が魔法カードを発動する度に、このカードに魔力カウンターを1つ置く(最大3つまで)。
   また、魔力カウンターが3つ置かれているこのカードをリリースして発動できる。自分の手札・デッキ・墓地から「バスター・ブレイダー」(「ブラック・マジシャン」)1体を選んで特殊召喚する。 ---- */
function adeptPoolS03(p, target){
  const hit = x=>x.db.k==='m' && x.db.n===target && canEffectSpecialSummonS03(x.card, x.zone, '熟練の魔導師');
  return [].concat(API.pileCards(p,'hand',hit), API.pileCards(p,'deck',hit), API.pileCards(p,'grave',hit));
}
API.registerChoiceHandler('s03u232.adept-summon', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(!h || h.p!==args.player || ['hand','deck','grave'].indexOf(h.zone)<0 || !hasMonsterZoneSpace(args.player)) return;
  API.specialSummon(args.player, h.zone, h.index, 'atk', args.reason);
});
function defineAdeptS03(name, target){
  defineUnifiedCardV4(name, [{
    key:'spell-activated-add-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1,
    events:['onActivateSuccess'], forced:true,
    condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && v12SpellBy(ctx,'any') && v12SpellCounters(ctx.card)<3; },
    operation(ctx){ v12AddSpellCounter(ctx,3); },
    afterResolve(){}
  },{
    key:'release-special-summon', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
      if(ctx.card.cannotTribute){ ctx.reason = 'リリースできません'; return false; }
      if(v12SpellCounters(ctx.card)<3){ ctx.reason = '魔力カウンターが3つ置かれていません'; return false; }
      if(!adeptPoolS03(ctx.player, target).length){ ctx.reason = '手札・デッキ・墓地に「'+target+'」がいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone!=='mz' || API.countCounter(h,'魔力')<3){ done(false); return; }
      API.sendToGrave(h, name+'（リリース）'); done(true);
    },
    operation(ctx){
      const pool = adeptPoolS03(ctx.player, target);
      if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.requestChoice({player:ctx.player, kind:'card', title:name+'：特殊召喚する「'+target+'」（手札・デッキ・墓地）', candidates:pool, min:1, max:1, cancelable:false,
        resume:{handler:'s03u232.adept-summon', args:{player:ctx.player, reason:name}}, meta:{scriptName:name}});
    },
    afterResolve(){}
  }], {type:'monster', priority:1, timing:['mainPhase'], includesSpecialSummon:true,
       blocksIfNoSpecialSummon:ctx=>ctx.eventName!=='onActivateSuccess',
       passive:{ onActivateSuccess:ctx=>ctx.zone==='mz' && ctx.card.face==='up' && v12SpellBy(ctx,'any') && v12SpellCounters(ctx.card)<3 }});
}
defineAdeptS03('熟練の白魔導師', 'バスター・ブレイダー');
defineAdeptS03('熟練の黒魔術師', 'ブラック・マジシャン');

/* 「戦闘を行った」 = went through damage calculation this turn (card.battledTurnS03, stamped by the ATTACK action; API.battledThisPhase is already cleared when onBattlePhaseEnd fires) */
function cerberusBattledS03(card){ return !!card && card.battledTurnS03===gameState.turn; }

/* ---- 魔導獣 ケルベロス: ①モンスターゾーンに存在する場合、自分または相手が魔法カードを発動する度に、このカードに魔力カウンターを1つ置く。
   ②攻撃力は魔力カウンターの数×500アップする。③このカードが戦闘を行ったバトルフェイズ終了時にこのカードの魔力カウンターは全て取り除かれる。 ---- */
defineUnifiedCardV4('魔導獣 ケルベロス', [{
  key:'spell-activated-add-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1,
  events:['onActivateSuccess'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && v12SpellBy(ctx,'any'); },
  operation(ctx){ v12AddSpellCounter(ctx,null); },
  afterResolve(){}
},{
  key:'bp-end-remove-counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && cerberusBattledS03(ctx.card) && v12SpellCounters(ctx.card)>0; },
  operation(ctx){ const h = locateCardAnyV4(ctx.card), n = h ? API.countCounter(h,'魔力') : 0; if(h && n>0) API.removeCounter(h,'魔力',n); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true,
     continuous:{scope:'self', from:['mz'], apply(card, self){ if(card!==self || card.face!=='up') return null; const n = v12SpellCounters(card); return n ? {atk:n*500} : null; }},
     passive:{ onActivateSuccess:ctx=>ctx.zone==='mz' && v12SpellBy(ctx,'any'),
               onBattlePhaseEnd:ctx=>ctx.zone==='mz' && cerberusBattledS03(ctx.card) && v12SpellCounters(ctx.card)>0 }});

/* ---- 闇紅の魔導師: このカードが召喚に成功した時、このカードに魔力カウンターを2つ置く。このカードがフィールド上に表側表示で存在する限り、自分または相手が魔法カードを発動する度に、
   このカードに魔力カウンターを1つ置く。このカードに乗っている魔力カウンター1つにつき、このカードの攻撃力は300ポイントアップする。
   1ターンに1度、このカードに乗っている魔力カウンターを2つ取り除いて発動できる。相手の手札をランダムに1枚捨てる。 ---- */
defineUnifiedCardV4('闇紅の魔導師', [{
  key:'summon-add-two-counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.addCounter(h,'魔力',2); },
  afterResolve(){}
},{
  key:'spell-activated-add-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && v12SpellBy(ctx,'any'); },
  operation(ctx){ v12AddSpellCounter(ctx,null); },
  afterResolve(){}
},{
  key:'remove-two-random-discard', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(v12SpellCounters(ctx.card)<2){ ctx.reason = '魔力カウンターが2つ乗っていません'; return false; }
    return true;
  },
  cost(ctx, done){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || API.countCounter(h,'魔力')<2){ done(false); return; }
    API.removeCounter(h,'魔力',2); done(true);
  },
  operation(ctx){ v80DiscardRandom(ctx.opponent, 1, '闇紅の魔導師', ctx.player); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['remove-two-random-discard']},
     passive:{ onNormalSummon:ctx=>ctx.zone==='mz' && eventIsSelfS03(ctx),
               onActivateSuccess:ctx=>ctx.zone==='mz' && ctx.card.face==='up' && v12SpellBy(ctx,'any') },
     continuous:{scope:'self', from:['mz'], apply(card, self){ if(card!==self || card.face!=='up') return null; const n = v12SpellCounters(card); return n ? {atk:n*300} : null; }}});

/* ---- 機皇兵グランエル・アイン: このカードの攻撃力は、このカード以外のフィールド上に表側表示で存在する「機皇」と名のついたモンスターの数×100ポイントアップする。
   このカードが召喚に成功した時、相手フィールド上に表側表示で存在するモンスター1体を選択し、そのモンスターの攻撃力をエンドフェイズ時まで半分にする事ができる。 ---- */
function granelTargetsS03(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
defineScript('機皇兵グランエル・アイン', {
  type:'monster', priority:1, timing:['summon'], targets:true,
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon' || ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!granelTargetsS03(ctx).length){ ctx.reason = '相手フィールド上に表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('機皇兵グランエル・アイン：攻撃力を半分にする相手モンスター', granelTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='mz' || h.p!==ctx.opponent || h.card.face!=='up'){ API.log('機皇兵グランエル・アイン：対象が場にないため不発'); return; }
    v4RegisterStatModifier(h, {setAtk:Math.floor(Math.max(0, curATK(h.card))/2)}, {controller:ctx.player, code:'機皇兵グランエル・アイン half', targetCard:h.card, resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self || card.face!=='up') return null;
      let n = 0;
      [0,1].forEach(p=>(gameState.players[p].mz||[]).forEach(c=>{ if(c && c!==self && c.face==='up' && isCardInGroupV4(c, GROUP.MEKLORD)) n++; }));
      return n ? {atk:n*100} : null;
    } },
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && granelTargetsS03(ctx).length>0; } }
});

/* ---- No.56 ゴールドラット: レベル1モンスター×3 / 1ターンに1度、このカードのエクシーズ素材を1つ取り除いて発動できる。自分のデッキからカードを1枚ドローし、その後手札を1枚デッキに戻す。 ---- */
API.registerChoiceHandler('s03u232.rat-return', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(!h || h.p!==args.player || h.zone!=='hand') return;
  API.returnToDeck(h, false, 'No.56 ゴールドラット');
  API.shuffle(args.player);
});
defineUnifiedCardV4('No.56 ゴールドラット', [{
  key:'rat-draw-return', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!(ctx.card.xyz||[]).length){ ctx.reason = 'X素材がありません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  detachCostS03:{count:1, reason:'No.56 ゴールドラット（コスト）'},
  operation(ctx){
    API.draw(ctx.player, 1, 'No.56 ゴールドラット');
    const hand = API.pileCards(ctx.player,'hand');
    if(!hand.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'No.56 ゴールドラット：デッキに戻す手札', candidates:hand, min:1, max:1, cancelable:false,
      resume:{handler:'s03u232.rat-return', args:{player:ctx.player}}, meta:{scriptName:'No.56 ゴールドラット'}});
  },
  afterResolve(){}
}], {type:'xyz', priority:1, countLimit:1, timing:['mainPhase']});
