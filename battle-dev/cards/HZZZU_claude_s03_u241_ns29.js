/* S03-U241: NOT_STARTED cards (2011 texts) — 宝玉の双璧, ジェムナイト・エメラル, ドラゴニック・ガード, インフェルニティガン, ナチュラル・ディザスター, ヒーロー逆襲.
   Reuses: placeAsSpellS03 / askCrystalPlaceS03 (S03-U240), addLpRuleV18 (battle damage 0), graveInfo.srcUidS03 (S03-U208), canEffectSpecialSummonS03 (U127 proper-summon rules),
   duelRandomInt (the Replay-safe RNG, as v80DiscardRandom). Groups come from the setcode authority (SETCODE.*), never from name substrings. */

const COUNTER_S03U241 = 'ドラゴニック';
function infernityDbS03(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.INFERNITY); }
function hasNormalS03(db){ return !!db && (db.st||[]).indexOf('通常')>=0; }
function sentBattleLossS03(ctx){   /* the monster of this event, now in the GY of ctx.player, destroyed by battle this turn */
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const g = h.card.graveInfo;
  return (g && g.byDestroy && g.battle && g.from==='mz' && Number(g.turn)===Number(gameState.turn)) ? h : null;
}

/* ---- 宝玉の双璧 (Trap): 自分フィールド上に存在する「宝玉獣」と名のついたモンスターが戦闘によって破壊され墓地へ送られた時に発動する事ができる。
   デッキから「宝玉獣」と名のついたモンスター1体を永続魔法カード扱いとして自分の魔法&罠カードゾーンに表側表示で置く。このターン、自分が受ける戦闘ダメージは0になる。
   (a 宝玉獣 its controller placed instead of sending to the GY was never 「墓地へ送られた」: it is in the Spell & Trap Zone, not the GY, so this does not apply) ---- */
function crystalWallLossS03(ctx){ const h = sentBattleLossS03(ctx); return (h && crystalBeastDbS03(dbOf(h.card))) ? h : null; }
defineScript('宝玉の双璧', {
  type:'trap', priority:2,
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !crystalWallLossS03(ctx)){ ctx.reason = '自分の「宝玉獣」が戦闘で破壊され墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){
    askCrystalPlaceS03(ctx, ['deck'], '宝玉の双璧', 1);
    addLpRuleV18({player:ctx.player, cause:'battle', mode:'prevent', turns:0, label:'宝玉の双璧'});
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && !!crystalWallLossS03(ctx); } }
});

/* ---- ジェムナイト・エメラル: ①:自分フィールドの表側表示の通常モンスター1体とこのカードを除外し、自分の墓地の「ジェムナイト」融合モンスター1体を対象として発動できる。
   そのモンスターを特殊召喚する。 (the banish is the cost; the two monsters leave first, so a free zone always exists; a Fusion Monster that was never properly summoned is not offered — U127) ---- */
function emeralNormalsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && !x.card.token && x.card.face==='up' && x.db.k==='m' && hasNormalS03(x.db)}); }
function emeralTargetsS03(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.GEM_KNIGHT) && (x.db.st||[]).indexOf('融合')>=0
    && canEffectSpecialSummonS03(x.card, 'grave', 'ジェムナイト・エメラル'));
}
defineUnifiedCardV4('ジェムナイト・エメラル', [{
  key:'banish-revive-fusion', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!emeralNormalsS03(ctx).length){ ctx.reason = '自分フィールドに表側表示の通常モンスターがいません'; return false; }
    if(!emeralTargetsS03(ctx).length){ ctx.reason = '墓地に特殊召喚できる「ジェムナイト」融合モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const su = ctx.card && ctx.card.uid;
    API.selectCard('ジェムナイト・エメラル：除外する通常モンスター', emeralNormalsS03(ctx), t=>{
      const r = resolveTarget(t), s = su!=null ? findCardByUid(su) : null;
      if(!r || r.zone!=='mz' || !s || s.zone!=='mz'){ done(false); return; }
      API.banish(r, 'ジェムナイト・エメラル（コスト）');
      const s2 = findCardByUid(su); if(s2 && s2.zone==='mz') API.banish(s2, 'ジェムナイト・エメラル（コスト）');
      done(true);
    });
  },
  target(ctx, done){ API.selectCard('ジェムナイト・エメラル：特殊召喚する「ジェムナイト」融合モンスター', emeralTargetsS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && h.p===ctx.player && hasMonsterZoneSpace(ctx.player) && canEffectSpecialSummonS03(h.card, 'grave', 'ジェムナイト・エメラル'))
      API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'ジェムナイト・エメラル');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true});

/* ---- ドラゴニック・ガード: モンスターが通常召喚される度に、このカードにドラゴニックカウンターを1つ置く。
   また、フィールド上に表側表示で存在するこのカードを墓地へ送る事で、このカードに乗っているドラゴニックカウンターの数以下のレベルを持つドラゴン族モンスター1体を自分のデッキから特殊召喚する。
   (either player's Normal Summon, this card's own too; the counter number is recorded with the cost — the card is already in the GY when it resolves) ---- */
function dragonicPoolS03(p, n){
  return API.pileCards(p, 'deck', x=>x.db.k==='m' && x.db.ra==='ドラゴン' && Number(x.db.lv)<=n && canEffectSpecialSummonS03(x.card, 'deck', 'ドラゴニック・ガード'));
}
function dragonicCountS03(card){ const h = locateCardAnyV4(card); return (h && h.zone==='mz') ? API.countCounter(h, COUNTER_S03U241) : 0; }
API.registerChoiceHandler('s03u241.dragonic-summon', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(!h || h.p!==args.player || h.zone!=='deck' || !hasMonsterZoneSpace(args.player)) return;
  const db = dbOf(h.card);
  if(!db || db.k!=='m' || db.ra!=='ドラゴン' || Number(db.lv)>Number(args.n) || !canEffectSpecialSummonS03(h.card, 'deck', 'ドラゴニック・ガード')) return;
  API.specialSummon(args.player, 'deck', h.index, 'atk', 'ドラゴニック・ガード');
});
defineUnifiedCardV4('ドラゴニック・ガード', [{
  key:'normal-summon-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up') API.addCounter(h, COUNTER_S03U241, 1); },
  afterResolve(){}
},{
  key:'send-summon-dragon', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.DECK, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    const n = dragonicCountS03(ctx.card);
    if(n<1){ ctx.reason = 'ドラゴニックカウンターが乗っていません'; return false; }
    if(!dragonicPoolS03(ctx.player, n).length){ ctx.reason = 'デッキにカウンターの数以下のレベルのドラゴン族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || h.card.face!=='up'){ done(false); return; }
    API.recordActivationCost(ctx, 'dragonicLvS03U241', [], [], API.countCounter(h, COUNTER_S03U241));
    API.sendToGrave(h, 'ドラゴニック・ガード（コスト）'); done(true);
  },
  operation(ctx){
    const c = API.activationCosts(ctx, 'dragonicLvS03U241')[0], n = c ? Number(c.amount)||0 : 0;
    const pool = n>0 ? dragonicPoolS03(ctx.player, n) : [];
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.log('ドラゴニック・ガード：特殊召喚できるドラゴン族モンスターがいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'ドラゴニック・ガード：特殊召喚するドラゴン族（レベル'+n+'以下）', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u241.dragonic-summon', args:{player:ctx.player, n}}, meta:{scriptName:'ドラゴニック・ガード'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], includesSpecialSummon:true, onOtherSummon:true,   /* reacts to every Normal Summon, not only its own */
     blocksIfNoSpecialSummon:ctx=>ctx.eventName!=='onNormalSummon',
     passive:{ onNormalSummon:ctx=>ctx.zone==='mz' && ctx.card.face==='up' }});

/* ---- インフェルニティガン (Continuous Spell): ①:1ターンに1度、自分メインフェイズに発動できる。手札から「インフェルニティ」モンスター1体を墓地へ送る。
   ②:魔法&罠ゾーンの表側表示のこのカードを墓地へ送り、自分の墓地の「インフェルニティ」モンスターを2体まで対象として発動できる。そのモンスターを特殊召喚する。
   この効果は自分の手札が0枚の場合に発動と処理ができる。 (the card activation only places it; ① is not a cost-based effect: the monster is chosen on resolution) ---- */
function gunModeS03(ctx){ return ctx.zone==='sz' && !!ctx.card && ctx.card.face==='up' && !ctx.card.activationPending; }
function gunHandS03(ctx){ return API.pileCards(ctx.player, 'hand', x=>infernityDbS03(x.db)); }
function gunGraveS03(ctx){ return API.pileCards(ctx.player, 'grave', x=>infernityDbS03(x.db) && canEffectSpecialSummonS03(x.card, 'grave', 'インフェルニティガン')); }
function gunRoomS03(p){ return ZONE_LIMITS.mz - (gameState.players[p].mz||[]).length; }
API.registerChoiceHandler('s03u241.gun-send', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(h && h.p===args.player && h.zone==='hand' && infernityDbS03(dbOf(h.card))) API.sendHandToGrave(args.player, h.index, args.reason);
});
defineUnifiedCardV4('インフェルニティガン', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !gunModeS03(ctx); },
  operation(){},
  afterResolve(){}
},{
  key:'send-hand', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!gunModeS03(ctx)){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!gunHandS03(ctx).length){ ctx.reason = '手札に「インフェルニティ」モンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = gunHandS03(ctx); if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'インフェルニティガン：墓地へ送る手札の「インフェルニティ」モンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u241.gun-send', args:{player:ctx.player, reason:'インフェルニティガン'}}, meta:{scriptName:'インフェルニティガン'}});
  },
  afterResolve(){}
},{
  key:'send-self-revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(!gunModeS03(ctx)){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(API.me(ctx).hand.length>0){ ctx.reason = '自分の手札が0枚の場合に発動できます'; return false; }
    if(typeof v46GlobalSpecialSummonRestrictionReason==='function'){ const r = v46GlobalSpecialSummonRestrictionReason(ctx.player); if(r){ ctx.reason = r; return false; } }
    if(!gunGraveS03(ctx).length){ ctx.reason = '墓地に特殊召喚できる「インフェルニティ」モンスターがいません'; return false; }
    if(gunRoomS03(ctx.player)<1){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
    if(!me || me.zone!=='sz'){ done(false); return; }
    API.sendToGrave(me, 'インフェルニティガン（コスト）'); done(true);
  },
  target(ctx, done){
    const pool = gunGraveS03(ctx), n = Math.min(2, pool.length, gunRoomS03(ctx.player));
    v380SelectUpTo('インフェルニティガン：特殊召喚する「インフェルニティ」モンスター（2体まで）', pool, n, ts=>done(ts));
  },
  operation(ctx){
    if(API.me(ctx).hand.length>0){ API.log('インフェルニティガン：手札が0枚ではないため処理できない'); return; }   /* 「手札が0枚の場合に発動と処理ができる」 */
    (ctx.selectedTargets||[]).forEach(t=>{
      const h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
      if(h && h.zone==='grave' && h.p===ctx.player && infernityDbS03(dbOf(h.card)) && hasMonsterZoneSpace(ctx.player) && canEffectSpecialSummonS03(h.card, 'grave', 'インフェルニティガン'))
        API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'インフェルニティガン');
    });
  },
  afterResolve(){}
}], {type:'spell', priority:1, timing:['mainPhase'], fieldIgnition:true, targets:true, includesSpecialSummon:true, countLimit:{n:1, effects:['send-hand']}});

/* ---- ナチュラル・ディザスター (Continuous Trap): 「雲魔物」と名のついたモンスターの効果によって、相手のコントロールするカードが破壊され墓地へ送られる度に、相手ライフに500ポイントダメージを与える。
   (a forced effect of the face-up card; the effect source is graveInfo.srcUidS03 — S03-U208 — and the card must have been destroyed, not battle-destroyed) ---- */
function disasterHitS03(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || ctx.card.activationPending) return false;
  const e = ctx.event || {};
  if(e.player!==ctx.opponent) return false;          /* the card was controlled by the opponent */
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave') return false;
  const g = h.card.graveInfo;
  if(!(g && g.byDestroy && !g.battle && Number(g.turn)===Number(gameState.turn) && g.srcUidS03!=null)) return false;
  const s = findCardByUid(g.srcUidS03);
  return !!(s && dbOf(s.card).k==='m' && isSetCardV4(dbOf(s.card), SETCODE.CLOUDIAN));
}
defineScript('ナチュラル・ディザスター', {
  type:'trap', priority:2, fieldIgnition:true, forced:true,
  condition(ctx){
    if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up') return true;                  /* the card activation */
    if(ctx.eventName!=='onSendToGrave' || !disasterHitS03(ctx)){ ctx.reason = '「雲魔物」の効果で相手のカードが破壊され墓地へ送られた時に適用されます'; return false; }
    return true;
  },
  resolve(ctx){ if(ctx.eventName==='onSendToGrave') API.damageLP(ctx.opponent, 500, 'ナチュラル・ディザスター'); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return disasterHitS03(ctx); } }
});

/* ---- ヒーロー逆襲 (Trap): 自分フィールド上に存在する「E・HERO」と名のついたモンスターが戦闘によって破壊された時に発動する事ができる。
   自分の手札から相手はカード1枚をランダムに選択する。それが「E・HERO」と名のついたモンスターカードだった場合、相手フィールド上のモンスター1体を破壊し、
   選択したカードを自分フィールド上に特殊召喚する。 (the random pick uses the Replay-safe RNG on resolution; the destroyed monster is chosen by the activating player, no target) ---- */
function heroRevengeLossS03(ctx){ const h = sentBattleLossS03(ctx); return (h && isSetCardV4(dbOf(h.card), SETCODE.ELEMENTAL_HERO)) ? h : null; }
API.registerChoiceHandler('s03u241.hero-revenge', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const t = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  const hero = findCardByUid(args.heroUid);
  if(!t || t.zone!=='mz' || t.p===args.player || !hero || hero.zone!=='hand' || hero.p!==args.player) return;
  API.destroy(t, args.reason, args.player);
  const h2 = findCardByUid(args.heroUid);
  if(h2 && h2.zone==='hand' && h2.p===args.player && hasMonsterZoneSpace(args.player) && canEffectSpecialSummonS03(h2.card, 'hand', args.reason))
    API.specialSummon(args.player, 'hand', h2.index, 'atk', args.reason);
});
defineScript('ヒーロー逆襲', {
  type:'trap', priority:2, includesSpecialSummon:true,
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !heroRevengeLossS03(ctx)){ ctx.reason = '自分の「E・HERO」が戦闘で破壊された時に発動します'; return false; } return true; },
  resolve(ctx){
    const hand = API.me(ctx).hand;
    if(!hand.length){ API.log('ヒーロー逆襲：手札がない'); return; }
    const pick = hand[duelRandomInt(hand.length)];
    if(!pick || pick.uid==null) return;
    API.log('ヒーロー逆襲：ランダムに選択された手札は ' + cardName(pick));
    const db = dbOf(pick);
    if(!db || db.k!=='m' || !isSetCardV4(db, SETCODE.ELEMENTAL_HERO)) return;
    const foes = API.fieldCards({player:ctx.opponent, zone:'mz'});
    if(!foes.length){ API.log('ヒーロー逆襲：相手フィールド上にモンスターがいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'ヒーロー逆襲：破壊する相手モンスター', candidates:foes, min:1, max:1, cancelable:false,
      resume:{handler:'s03u241.hero-revenge', args:{player:ctx.player, heroUid:pick.uid, reason:'ヒーロー逆襲'}}, meta:{scriptName:'ヒーロー逆襲'}});
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && !!heroRevengeLossS03(ctx); } }
});
