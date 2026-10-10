/* S03-U212: NOT_STARTED cards (2011 texts) — ダーク・エルフ, BF－東雲のコチ, フレンドッグ, ヴォルカニック・リボルバー, ワーム・テンタクルス, 竜の尖兵, アテナ.
   Engine: attackLpCostS03 (engine/00 canDeclareAttackV48, paid by the attack declaration in engine/30); cannotSynchroMaterial may be a
   function (engine/20 materialCandidates). */

function evtCardS03(ctx){ const e = ctx.event || {}, u = e.uid!=null ? e.uid : (e.card && e.card.uid!=null ? e.card.uid : null); return u!=null ? findCardByUid(u) : null; }
function raceNowS03(c){ return (typeof currentRaceV17==='function') ? currentRaceV17(c) : dbOf(c).ra; }

/* ---- ダーク・エルフ: このカードは1000ライフポイント払わなければ攻撃できない。 ---- */
defineScript('ダーク・エルフ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  attackLpCostS03:1000
});

/* ---- BF－東雲のコチ: 特殊召喚されたこのカードはS素材にできない。 ---- */
defineScript('BF－東雲のコチ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  cannotSynchroMaterial:(card)=> !!card && card.specialSummoned===true
});

/* ---- フレンドッグ: このカードが戦闘によって破壊され墓地へ送られた時、自分の墓地から「E・HERO」と名のついたカード1枚と「融合」魔法カード1枚を手札に加える。
   (forced; each half is added when such a card exists) ---- */
function friendogHeroesS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && isSetCardV4(x.db, SETCODE.ELEMENTAL_HERO)); }
function friendogFusionsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.n==='融合'); }
function friendogLossS03(ctx){ const g = ctx.card && ctx.card.graveInfo; return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!(g && g.battle && g.byDestroy && Number(g.turn)===Number(gameState.turn)); }
defineScript('フレンドッグ', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], dsTiming:'leave',
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !friendogLossS03(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){
    const takeFusion = ()=>{ const f = friendogFusionsS03(ctx); if(!f.length) return;
      API.selectCard('フレンドッグ：手札に加える「融合」', f, t=>{ const r = resolveTarget(t); if(r && r.zone==='grave') API.returnToHand(r, 'フレンドッグ'); }); };
    const h = friendogHeroesS03(ctx);
    if(!h.length){ takeFusion(); return; }
    API.selectCard('フレンドッグ：手札に加える「E・HERO」', h, t=>{ const r = resolveTarget(t); if(r && r.zone==='grave') API.returnToHand(r, 'フレンドッグ'); takeFusion(); });
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return friendogLossS03(ctx) && (friendogHeroesS03(ctx).length>0 || friendogFusionsS03(ctx).length>0); } }
});

/* ---- ヴォルカニック・リボルバー: このカードが戦闘によって破壊され墓地へ送られた時、デッキから「ヴォルカニック」と名のついたモンスター1体を選んで
   デッキの一番上に置く事ができる。 ---- */
function revolverPoolS03(ctx){ return API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('ヴォルカニック')===0); }
defineScript('ヴォルカニック・リボルバー', {
  type:'monster', priority:1, activateFrom:['grave'], dsTiming:'leave',
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !friendogLossS03(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    if(!revolverPoolS03(ctx).length){ ctx.reason = 'デッキに「ヴォルカニック」モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = revolverPoolS03(ctx); if(!pool.length) return;
    /* the Deck is shuffled, then the chosen card is placed on top (the 翡翠の蟲笛 handler p20rev.opponent-topdeck, deckOwner = this player) */
    v49P1Open(ctx, {kind:'card', title:'ヴォルカニック・リボルバー：デッキの一番上に置く「ヴォルカニック」', candidates:pool, min:1, max:1},
      'p20rev.opponent-topdeck', {deckOwner:ctx.player, reason:'ヴォルカニック・リボルバー'}, false);
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return friendogLossS03(ctx) && revolverPoolS03(ctx).length>0; } }
});

/* ---- ワーム・テンタクルス: 1ターンに1度、自分の墓地の「ワーム」と名のついた爬虫類族モンスター1体をゲームから除外して発動できる。
   このターン、このカードは1度のバトルフェイズ中に2回攻撃する事ができる。 (cost: the banish) ---- */
function tentaclesCostsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='爬虫類' && isSetCardV4(x.db, SETCODE.WORM)); }
defineScript('ワーム・テンタクルス', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!tentaclesCostsS03(ctx).length){ ctx.reason = '墓地に「ワーム」爬虫類族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('ワーム・テンタクルス：除外する「ワーム」', tentaclesCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, 'ワーム・テンタクルス（コスト）'); done(true); }); },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.grantAdditionalAttack(me, 1, 'ワーム・テンタクルス'); },
  afterResolve(){}
});

/* ---- 竜の尖兵: ①:手札からドラゴン族モンスター1体を墓地へ送って発動できる。このカードの攻撃力は300アップする。
   ②:フィールドのこのカードが相手の効果で墓地へ送られた時、自分または相手の墓地のドラゴン族の通常モンスター1体を対象として発動できる。そのドラゴン族モンスターを特殊召喚する。 ---- */
function vanguardCostsS03(ctx){ return API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && x.db.ra==='ドラゴン'); }
function vanguardTargetsS03(ctx){ return [0,1].flatMap(p=>API.pileCards(p,'grave',x=>x.card!==ctx.card && x.db.k==='m' && x.db.ra==='ドラゴン' && (x.db.st||[]).indexOf('通常')>=0 && canEffectSpecialSummonS03(x.card,'grave','竜の尖兵'))); }
function vanguardSentByFoeS03(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!g && ['mz'].indexOf(g.from)>=0 && !g.battle && Number(g.turn)===Number(gameState.turn)
    && g.byPlayer===(ctx.player===0?1:0);
}
defineUnifiedCardV4('竜の尖兵',[{
  key:'boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!vanguardCostsS03(ctx).length){ ctx.reason = '手札にドラゴン族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('竜の尖兵：墓地へ送るドラゴン族', vanguardCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.sendToGrave(r, '竜の尖兵（コスト）'); done(true); }); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.modAtk(me, 300, 0, 'permanent', '竜の尖兵'); },
  afterResolve(){}
},{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!vanguardSentByFoeS03(ctx)){ ctx.reason = 'フィールドのこのカードが相手の効果で墓地へ送られた時に発動します'; return false; }
    if(!vanguardTargetsS03(ctx).length){ ctx.reason = '墓地にドラゴン族の通常モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('竜の尖兵：特殊召喚するドラゴン族の通常モンスター', vanguardTargetsS03(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', '竜の尖兵', h.p); },
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, activateFrom:['grave'], timing:['mainPhase'], includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return vanguardSentByFoeS03(ctx) && vanguardTargetsS03(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } }});

/* ---- アテナ: ①:1ターンに1度、「アテナ」以外の自分フィールドの表側表示の天使族モンスター1体を墓地へ送り、「アテナ」以外の自分の墓地の天使族モンスター1体を
   対象として発動できる。その天使族モンスターを特殊召喚する。
   ②:このカードが既にモンスターゾーンに存在する状態で、このカード以外の天使族モンスターが召喚・反転召喚・特殊召喚された場合に発動する。相手に600ダメージを与える。 ---- */
function athenaCostsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && raceNowS03(x.card)==='天使' && x.db.n!=='アテナ'}); }
function athenaTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='天使' && x.db.n!=='アテナ' && canEffectSpecialSummonS03(x.card,'grave','アテナ')); }
function athenaFairySummonedS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  const e = ctx.event || {};
  if(ctx.eventName==='onFlip' && e.flipSummon!==true) return false;
  const h = evtCardS03(ctx);
  if(!h || h.zone!=='mz' || h.card===ctx.card || h.card.face!=='up' || raceNowS03(h.card)!=='天使') return false;
  /* 「既にモンスターゾーンに存在する状態で」: アテナ was summoned before that monster (summon instances), or was never summoned this game */
  const a = ctx.card.summonProvenance, b = h.card.summonProvenance;
  return !(a && b && Number(a.summonInstance) >= Number(b.summonInstance));
}
defineUnifiedCardV4('アテナ',[{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!athenaCostsS03(ctx).length){ ctx.reason = '墓地へ送る天使族モンスターがいません'; return false; }
    if(!athenaTargetsS03(ctx).length){ ctx.reason = '墓地に「アテナ」以外の天使族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('アテナ：墓地へ送る天使族モンスター', athenaCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, 'アテナ（コスト）'); done(true); }); },
  target(ctx, done){ API.selectCard('アテナ：特殊召喚する天使族モンスター', athenaTargetsS03(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'アテナ'); },
  afterResolve(){}
},{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onSpecialSummon','onFlip'], forced:true,
  condition(ctx){ if(!athenaFairySummonedS03(ctx)){ ctx.reason = '他の天使族モンスターが召喚・反転召喚・特殊召喚された場合に発動します'; return false; } return true; },
  operation(ctx){ API.damageLP(ctx.opponent, 600); },
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, onOtherSummon:true, onOtherFlipS03:true, timing:['mainPhase'], includesSpecialSummon:true,
  passive:{ onNormalSummon(ctx){ return athenaFairySummonedS03(ctx); }, onSpecialSummon(ctx){ return athenaFairySummonedS03(ctx); }, onFlip(ctx){ return athenaFairySummonedS03(ctx); } }});
