/* S03-U221: NOT_STARTED cards (2011 texts) — 通行税, 真空イタチ, 白兵戦, 英雄変化－リフレクター・レイ, 女王の選択, 侵略の手段, 野生の咆哮.
   Engine: attackTaxS03 (engine/00 attackLpCostS03); temporaryFlags.noSpellTrapActivationS03 (engine/1ZD). */

/* ---- 通行税 (Continuous Spell): お互いのプレイヤーは500ライフポイントを払わなければ、攻撃宣言をする事ができない。 ---- */
defineScript('通行税', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  attackTaxS03:500
});

/* ---- 真空イタチ: リバース：このターン相手プレイヤーは魔法・罠カードを発動できない。 ---- */
defineUnifiedCardV4('真空イタチ',[{
  key:'flip-lock', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
  operation(ctx){ API.setFlag(ctx.opponent, 'noSpellTrapActivationS03', gameState.turn, true); API.log('真空イタチ：このターン、相手は魔法・罠カードを発動できない'); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, passive:{ onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }});

/* ---- 白兵戦: 自分が戦闘またはカードの効果によってダメージを受けた時に発動する事ができる。相手ライフに700ポイントダメージを与える。
   自分の墓地に「白兵戦」が存在する場合、さらにその枚数分だけ相手ライフに300ポイントダメージを与える。 ---- */
function closeCombatDamagedS03(ctx){ const e = ctx.event || {}; return e.player===ctx.player && Number(e.delta)<0 && (e.cause==='battle' || e.cause==='effect'); }
defineScript('白兵戦', {
  type:'trap', priority:2,
  condition(ctx){ if(ctx.eventName!=='onLPChange' || !closeCombatDamagedS03(ctx)){ ctx.reason = '自分が戦闘または効果によってダメージを受けた時に発動します'; return false; } return true; },
  resolve(ctx){ const n = (API.me(ctx).grave||[]).filter(c=>cardName(c)==='白兵戦').length; API.damageLP(ctx.opponent, 700 + 300*n); },
  afterResolve(){},
  passive:{ onLPChange(ctx){ return ctx.zone==='sz' && closeCombatDamagedS03(ctx); } }
});

/* ---- 英雄変化－リフレクター・レイ: 自分フィールド上に存在する「E・HERO」と名のついた融合モンスターが戦闘によって破壊され墓地へ送られた時に発動する事ができる。
   破壊された融合モンスターのレベル×300ポイントダメージを相手ライフに与える。 ---- */
function reflectorLossS03(ctx){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const d = dbOf(h.card), g = h.card.graveInfo;
  if(!isSetCardV4(d, SETCODE.ELEMENTAL_HERO) || (d.st||[]).indexOf('融合')<0) return null;
  return (g && g.battle && g.byDestroy && g.from==='mz' && Number(g.turn)===Number(gameState.turn)) ? h : null;
}
defineScript('英雄変化－リフレクター・レイ', {
  type:'trap', priority:2,
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !reflectorLossS03(ctx)){ ctx.reason = '自分の「E・HERO」融合モンスターが戦闘で破壊され墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){
    const h = reflectorLossS03(ctx) || (function(){ const e = ctx.event || {}; return e.uid!=null ? findCardByUid(e.uid) : null; })();
    if(!h) return;
    const lv = Number((h.card.graveInfo && h.card.graveInfo.lv) || dbOf(h.card).lv || 0);
    if(lv>0) API.damageLP(ctx.opponent, lv*300);
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && !!reflectorLossS03(ctx); } }
});

/* ---- 女王の選択: 自分フィールド上に存在する「アマゾネス」と名のついたモンスターが戦闘によって相手モンスターを破壊し墓地へ送った時に発動する事ができる。
   自分のデッキからレベル4以下の「アマゾネス」と名のついたモンスター1体を特殊召喚する。 ---- */
poolSpecS03('女王の選択', {action:'summon', pos:'faceUp', filter:{set:SETCODE.AMAZONESS, lvmax:4}});
function ownBattleWinS03(ctx, test){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.opponent) return null;
  const b = [ctx.battle, (typeof battleContextV28==='function' ? battleContextV28() : null), gameState.lastBattle].find(x=>x && x.atkCard) || {};
  const other = (b.atkCard && b.atkCard.uid===h.card.uid) ? b.defCard : ((b.defCard && b.defCard.uid===h.card.uid) ? b.atkCard : null);
  if(!other) return null;
  const oh = findCardByUid(other.uid);
  return (oh && oh.zone==='mz' && oh.p===ctx.player && oh.card.face==='up' && (!test || test(oh.card))) ? oh : null;
}
defineScript('女王の選択', {
  type:'trap', priority:2, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !ownBattleWinS03(ctx, c=>isSetCardV4(dbOf(c), SETCODE.AMAZONESS))){ ctx.reason = '自分の「アマゾネス」が戦闘で相手モンスターを破壊し墓地へ送った時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ askPoolS03(ctx, '女王の選択', '女王の選択：特殊召喚する「アマゾネス」'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && !!ownBattleWinS03(ctx, c=>isSetCardV4(dbOf(c), SETCODE.AMAZONESS)) && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- 侵略の手段: デッキから「インヴェルズ」と名のついたモンスター1体を墓地へ送り、自分フィールド上の「インヴェルズ」と名のついたモンスター1体を選択して発動できる。
   選択したモンスターの攻撃力はエンドフェイズ時まで800ポイントアップする。 (cost: the Deck send) ---- */
function invasionDeckS03(ctx){ return API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.INVELLZ)); }
function invasionTargetsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isSetCardV4(x.db, SETCODE.INVELLZ)}); }
defineScript('侵略の手段', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!invasionDeckS03(ctx).length){ ctx.reason = 'デッキに「インヴェルズ」モンスターがいません'; return false; }
    if(!invasionTargetsS03(ctx).length){ ctx.reason = '自分フィールドに「インヴェルズ」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('侵略の手段：墓地へ送る「インヴェルズ」（デッキ）', invasionDeckS03(ctx), t=>{ const c = t && t.card; const i = c ? API.me(ctx).deck.indexOf(c) : -1; if(i<0){ done(false); return; } API.mill(ctx.player, i, '侵略の手段（コスト）'); done(true); }); },
  selectTargets(ctx, done){ API.selectCard('侵略の手段：攻撃力を上げる「インヴェルズ」', invasionTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(h && h.zone==='mz' && h.card.face==='up') API.modAtk(h, 800, 0, 'endPhase', '侵略の手段'); },
  afterResolve(){}
});

/* ---- 野生の咆哮 (Continuous Trap): 自分フィールド上に存在するモンスターが戦闘によって相手モンスターを破壊し墓地へ送った時、自分フィールド上に表側表示で存在する
   獣族モンスター1体につき相手ライフに300ポイントダメージを与える。 (a forced effect of the face-up card) ---- */
function wildRoarReadyS03(ctx){ return ctx.zone==='sz' && !!ctx.card && ctx.card.face==='up' && !ctx.card.activationPending && !!ownBattleWinS03(ctx); }
defineScript('野生の咆哮', {
  type:'trap', priority:2, fieldIgnition:true, forced:true,
  condition(ctx){
    if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up') return true;                  /* the card activation */
    if(ctx.eventName!=='onBattleDestroy' || !wildRoarReadyS03(ctx)){ ctx.reason = '自分のモンスターが戦闘で相手モンスターを破壊し墓地へ送った時に適用されます'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.eventName!=='onBattleDestroy') return;
    const n = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && currentRaceV17(x.card)==='獣'}).length;
    if(n>0) API.damageLP(ctx.opponent, n*300);
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return wildRoarReadyS03(ctx); } }
});
