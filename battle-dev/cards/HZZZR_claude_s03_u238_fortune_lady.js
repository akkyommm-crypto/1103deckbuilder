/* S03-U238: 「フォーチュンレディ」 (2011 texts) — アーシー (ENGINE_GAP), ウインディー, ウォーテリー, ダルキー, ファイリー (NOT_STARTED),
   ライティー (PARTIAL: the AUTO table's coarse recruit is replaced).
   Engine: onLevelUpS03 (engine/00 noteLevelUpS03), card.leftFieldByEffectS03 (engine/00 noteLeftFieldByEffectS03),
   card.summonSrcS03 (FX_SPECIAL_SUMMON opts.summonSrcS03).
   Common: 「このカードの攻撃力・守備力は、このカードのレベル×N」 = a continuous setBaseAtk / setBaseDef from the current Level;
   「自分のスタンバイフェイズ時、このカードのレベルを1つ上げる(最大レベル12まで)」 = a forced trigger (LEVEL_MOD_V16, permanent while on the field). */

function fortuneLadyDbS03(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.FORTUNE_LADY); }
function fortuneLadyS03(c){ return !!c && c.face==='up' && fortuneLadyDbS03(dbOf(c)); }
function fortuneLadiesOnFieldS03(p){ return (gameState.players[p].mz||[]).filter(fortuneLadyS03); }
function fortuneStandbyS03(name){
  return {key:'standby-level-up', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
    condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby' && gameState.activePlayer===ctx.player && curLV(ctx.card)<12; },
    operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up' && curLV(h.card)<12) API.modLevel(h, 1, 'permanent', name); },
    afterResolve(){}};
}
/* special summons a 「フォーチュンレディ」 by this card's effect: the summoned card remembers it (ファイリー) */
function fortuneSummonS03(p, h, pos, name){ return API.specialSummon(p, h.zone, h.index, pos||'atk', name, h.p, {summonSrcS03:name}); }
function defineFortuneLadyS03(name, mult, extra, meta){
  defineUnifiedCardV4(name, [fortuneStandbyS03(name)].concat(extra||[]), Object.assign({type:'monster', priority:1,
    continuous:{scope:'self', from:['mz'], apply(card, self){
      if(card!==self || card.face!=='up') return null;
      const v = curLV(card)*mult; return {setBaseAtk:v, setBaseDef:v}; }}}, meta||{}));
}

/* ---- フォーチュンレディ・アーシー (×400): このカードのレベルが上がった時、相手ライフに400ポイントダメージを与える。 (forced) ---- */
defineFortuneLadyS03('フォーチュンレディ・アーシー', 400, [{
  key:'level-up-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onLevelUpS03'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && eventIsSelfS03(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 400, 'フォーチュンレディ・アーシー'); },
  afterResolve(){}
}]);

/* ---- フォーチュンレディ・ウインディー (×300): このカードが召喚に成功した時、自分フィールド上の「フォーチュンレディ」と名のついたモンスターの数だけ、
   相手フィールド上の魔法・罠カードを選んで破壊できる。 (optional; chosen at resolution, not targeting) ---- */
function windyPoolS03(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>(x.zone==='sz' || x.zone==='field') && (x.db.k==='s' || x.db.k==='t')}); }
API.registerChoiceHandler('s03u238.windy-destroy', (answer, args)=>{
  v49P1ChoiceCards(answer).forEach(pk=>{ const h = pk && pk.card && pk.card.uid!=null ? findCardByUid(pk.card.uid) : null;
    if(h && h.p===args.opponent && (h.zone==='sz' || h.zone==='field')) API.destroy(h, 'フォーチュンレディ・ウインディー'); });
});
defineFortuneLadyS03('フォーチュンレディ・ウインディー', 300, [{
  key:'summon-destroy-st', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'],
  condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && fortuneLadiesOnFieldS03(ctx.player).length>0 && windyPoolS03(ctx).length>0; },
  operation(ctx){
    const pool = windyPoolS03(ctx), n = Math.min(fortuneLadiesOnFieldS03(ctx.player).length, pool.length);
    if(!n) return;
    API.requestChoice({player:ctx.player, kind:'card', title:`フォーチュンレディ・ウインディー：破壊する魔法・罠カード（${n}枚まで）`, candidates:pool, min:1, max:n,
      cancelable:false, resume:{handler:'s03u238.windy-destroy', args:{player:ctx.player, opponent:ctx.opponent}}, meta:{scriptName:'フォーチュンレディ・ウインディー'}});
  },
  afterResolve(){}
}]);

/* ---- フォーチュンレディ・ウォーテリー (×300): ③自分フィールドに「フォーチュンレディ・ウォーテリー」以外の「フォーチュンレディ」モンスターが存在し、
   このカードが特殊召喚に成功した場合に発動する。自分はデッキから2枚ドローする。 (forced) ---- */
defineFortuneLadyS03('フォーチュンレディ・ウォーテリー', 300, [{
  key:'special-summon-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx)
    && fortuneLadiesOnFieldS03(ctx.player).some(c=>cardName(c)!=='フォーチュンレディ・ウォーテリー'); },
  operation(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){}
}]);

/* ---- フォーチュンレディ・ダルキー (×400): このカードが自分フィールド上に表側表示で存在する限り、自分フィールド上の「フォーチュンレディ」と名のついた
   モンスターが戦闘によって相手モンスターを破壊し墓地へ送った時、自分の墓地の「フォーチュンレディ」と名のついたモンスター1体を選択して特殊召喚できる。 ---- */
function darkyBattleS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return null;
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.zone!=='grave' || h.card===ctx.card) return null;
  const b = [ctx.battle, (typeof battleContextV28==='function' ? battleContextV28() : null), gameState.lastBattle].find(x=>x && x.atkCard) || {};
  const other = (b.atkCard && b.atkCard.uid===h.card.uid) ? b.defCard : ((b.defCard && b.defCard.uid===h.card.uid) ? b.atkCard : null);
  if(!other || other.uid==null) return null;
  const o = findCardByUid(other.uid);
  if(!o || o.p!==ctx.player || h.p===ctx.player || !fortuneLadyDbS03(dbOf(o.card))) return null;
  return h;
}
function darkyTargetsS03(ctx){ return API.pileCards(ctx.player, 'grave', x=>fortuneLadyDbS03(x.db) && canEffectSpecialSummonS03(x.card, 'grave', 'フォーチュンレディ・ダルキー')); }
defineFortuneLadyS03('フォーチュンレディ・ダルキー', 400, [{
  key:'battle-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['onBattleDestroy'],
  condition(ctx){ return !!darkyBattleS03(ctx) && darkyTargetsS03(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  target(ctx, done){ API.selectCard('フォーチュンレディ・ダルキー：特殊召喚する「フォーチュンレディ」', darkyTargetsS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && h.p===ctx.player && hasMonsterZoneSpace(ctx.player)) fortuneSummonS03(ctx.player, h, 'atk', 'フォーチュンレディ・ダルキー');
  },
  afterResolve(){}
}], {targets:true});

/* ---- フォーチュンレディ・ファイリー (×200): このカードが「フォーチュンレディ」と名のついたカードの効果によって表側攻撃表示で特殊召喚に成功した時、
   相手フィールド上に表側表示で存在するモンスター1体を選択して破壊し、破壊したモンスターの攻撃力分のダメージを相手ライフに与える。 (forced) ---- */
function fireyTargetsS03(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
defineFortuneLadyS03('フォーチュンレディ・ファイリー', 200, [{
  key:'fortune-summoned-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1,
  events:['onSpecialSummon'], forced:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !eventIsSelfS03(ctx) || ctx.card.face!=='up' || ctx.card.pos!=='atk') return false;
    const s = ctx.card.summonSrcS03;
    return !!s && Number(s.turn)===Number(gameState.turn) && String(s.name).indexOf('フォーチュンレディ')===0 && fireyTargetsS03(ctx).length>0;
  },
  target(ctx, done){ API.selectCard('フォーチュンレディ・ファイリー：破壊する相手モンスター', fireyTargetsS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='mz' || h.p!==ctx.opponent || h.card.face!=='up') return;
    const atk = curATK(h.card);
    API.destroy(h, 'フォーチュンレディ・ファイリー');
    const g = findCardByUid(h.card.uid);
    if(g && g.zone!=='mz' && atk>0) API.damageLP(ctx.opponent, atk, 'フォーチュンレディ・ファイリー');
  },
  afterResolve(){}
}], {targets:true});

/* ---- フォーチュンレディ・ライティー (×200): ③表側表示のこのカードが効果でフィールドから離れた時に発動できる。
   デッキから「フォーチュンレディ」モンスター1体を特殊召喚する。 (optional) ---- */
function lightyLeftS03(ctx){
  const e = ctx.event || {};
  if(e.uid==null || !ctx.card || e.uid!==ctx.card.uid || e.fromZone!=='mz' || e.fromFace!=='up') return false;
  const s = ctx.card.leftFieldByEffectS03;
  return !!s && Number(s.turn)===Number(gameState.turn) && s.from==='mz';
}
poolSpecS03('フォーチュンレディ・ライティー', {from:['deck'], action:'summon', pos:'faceUp', filter:{set:SETCODE.FORTUNE_LADY}});   /* replaces the AUTO table's coarse recruit */
function lightyPoolS03(ctx){ return API.pileCards(ctx.player, 'deck', x=>fortuneLadyDbS03(x.db) && canEffectSpecialSummonS03(x.card, 'deck', 'フォーチュンレディ・ライティー')); }
API.registerChoiceHandler('s03u238.lighty-summon', (answer, args)=>{
  const pk = v49P1ChoiceCards(answer)[0], h = pk && pk.card && pk.card.uid!=null ? findCardByUid(pk.card.uid) : null;
  if(!h || h.p!==args.player || h.zone!=='deck' || !hasMonsterZoneSpace(args.player)) return;
  fortuneSummonS03(args.player, h, 'atk', 'フォーチュンレディ・ライティー');
});
defineFortuneLadyS03('フォーチュンレディ・ライティー', 200, [{
  key:'left-by-effect-recruit', type:EFFECT_TYPE.TRIGGER, range:LOCATION.ALL, speed:1, events:['onLeaveField'],
  condition(ctx){ return lightyLeftS03(ctx) && lightyPoolS03(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const pool = lightyPoolS03(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'フォーチュンレディ・ライティー：デッキから特殊召喚する「フォーチュンレディ」', candidates:pool, min:1, max:1,
      cancelable:false, resume:{handler:'s03u238.lighty-summon', args:{player:ctx.player}}, meta:{scriptName:'フォーチュンレディ・ライティー'}});
  },
  afterResolve(){}
}], {activateFrom:['mz','grave','banish','hand','deck','ex'], includesSpecialSummon:true});
