/* =========================================================================
   S03-U184 — 剣闘獣 stage 3 (engine/1ZZ): ダリウス, ラニスタ, 剣闘訓練所, ハンディキャップマッチ!, スレイブタイガー. Texts from carddata.
   ========================================================================= */
function u184GyGladiators(p, pred){ return API.pileCards(p,'grave',x=>x.db.k==='m' && isGladiatorCardDbS03(x.db) && (!pred || pred(x))); }
function u184AskPos(p, title, onPos){
  API.requestChoice({player:p, kind:'declare', title, candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}],
    min:1, max:1, cancelable:false, legacy:{onPick:(x)=>onPos(x && x.value==='def' ? 'def' : 'atk')}});
}

/* 剣闘獣ダリウス: ①:「剣闘獣」モンスターの効果で特殊召喚に成功した時、自分の墓地の「剣闘獣」モンスター1体を対象として発動できる。そのモンスターを
   効果を無効にして特殊召喚する。このカードがフィールドから離れた時にそのモンスターは持ち主のデッキに戻る。 ②: tag-out */
defineGladiatorS03('剣闘獣ダリウス', [gladiatorOnSummonEffectS03('revive', {forced:false,
  cond:ctx=>hasMonsterZoneSpace(ctx.player) && u184GyGladiators(ctx.player, x=>canEffectSpecialSummonS03(x.card,'grave','剣闘獣ダリウス')).length>0,
  effect:{
    targetRange:LOCATION.GRAVE, targetSide:'self',
    target(ctx, done){ API.selectCard('剣闘獣ダリウス：特殊召喚する墓地の「剣闘獣」', u184GyGladiators(ctx.player, x=>canEffectSpecialSummonS03(x.card,'grave','剣闘獣ダリウス')), t=>done([t])); },
    operation(ctx){
      const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      const me = findCardByUid(ensureCardUid(gameState, ctx.card));
      if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      u184AskPos(ctx.player, `剣闘獣ダリウス：${cardName(r.card)} の表示形式`, pos=>{
        const g = findCardByUid(uid); if(!g || g.zone!=='grave') return;
        API.specialSummon(ctx.player, 'grave', g.index, pos, '剣闘獣ダリウス', null, {gladiatorS03:true, negateOnSummonS03:true, negateSourceUidS03:ctx.card.uid});
        const now = findCardByUid(uid); if(!now || now.zone!=='mz') return;
        const src = findCardByUid(ctx.card.uid);
        if(src && src.zone==='mz') API.linkOnLeave(now, src, 'toDeck', '剣闘獣ダリウス');
        else { API.returnToDeck(now, false, '剣闘獣ダリウス'); API.shuffle(cardOwnerIndex(gameState, now.card, now.p)); }
      });
    }
  }}), gladiatorTagOutEffectS03('剣闘獣ダリウス')], {targets:true});

/* 剣闘獣ラニスタ: 「剣闘獣」…によって特殊召喚に成功した時、自分の墓地の「剣闘獣」モンスター1体を選択して発動する事ができる。選択したモンスターをゲーム
   から除外し、エンドフェイズ時までそのモンスターと同名カードとして扱う。 + tag-out */
defineGladiatorS03('剣闘獣ラニスタ', [gladiatorOnSummonEffectS03('copy-name', {forced:false,
  cond:ctx=>u184GyGladiators(ctx.player).length>0,
  effect:{
    targetRange:LOCATION.GRAVE, targetSide:'self',
    target(ctx, done){ API.selectCard('剣闘獣ラニスタ：除外する墓地の「剣闘獣」', u184GyGladiators(ctx.player), t=>done([t])); },
    operation(ctx){
      const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(!r || r.zone!=='grave') return;
      const nm = cardName(r.card);
      API.banish(r, '剣闘獣ラニスタ');
      const me = findCardByUid(ensureCardUid(gameState, ctx.card));
      if(me && me.zone==='mz' && me.card.face==='up') API.setCardName(me, nm, 'endPhase', '剣闘獣ラニスタ');
    }
  }}), gladiatorTagOutEffectS03('剣闘獣ラニスタ')], {targets:true});

/* 剣闘訓練所: デッキからレベル4以下の「剣闘獣」と名のついたモンスター1体を手札に加える。 */
function u184Lv4Gladiators(p){ return API.pileCards(p,'deck',x=>x.db.k==='m' && isGladiatorCardDbS03(x.db) && (x.db.lv||0)<=4); }
defineScript('剣闘訓練所', {
  type:'spell', priority:1, blocksIfNoDeckToHand:true,
  condition(ctx){ if(!u184Lv4Gladiators(ctx.player).length){ ctx.reason='デッキにレベル4以下の「剣闘獣」がいません'; return false; } return true; },
  resolve(ctx){
    const pool = u184Lv4Gladiators(ctx.player); if(!pool.length) return;
    API.selectCard('剣闘訓練所：手札に加える「剣闘獣」', pool, t=>{ const r = resolveTarget(t); if(r && r.zone==='deck') API.searchDeck(ctx.player, r.index, '剣闘訓練所'); });
  }
});

/* ハンディキャップマッチ!: 自分が「剣闘獣」と名のついたモンスターの特殊召喚に成功した時に発動する事ができる。自分の手札またはデッキから「剣闘獣」と名の
   ついたレベル4以下のモンスター1体を特殊召喚する。 (a trap: the summoned monster is not 「剣闘獣」の効果で特殊召喚) */
function u184HandicapPool(p){ return API.pileCards(p,'hand',x=>x.db.k==='m' && isGladiatorCardDbS03(x.db) && (x.db.lv||0)<=4 && canEffectSpecialSummonS03(x.card,'hand','ハンディキャップマッチ!'))
  .concat(API.pileCards(p,'deck',x=>x.db.k==='m' && isGladiatorCardDbS03(x.db) && (x.db.lv||0)<=4 && canEffectSpecialSummonS03(x.card,'deck','ハンディキャップマッチ!'))); }
function u184OwnGladiatorSummoned(ctx){
  const e = ctx.event || {}; const c = e.card;
  if(!c || e.player!==ctx.player) return false;
  const h = findCardByUid(ensureCardUid(gameState, c));
  return !!h && h.zone==='mz' && h.p===ctx.player && isGladiatorCardDbS03(dbOf(c));
}
defineScript('ハンディキャップマッチ!', {
  type:'trap', priority:2, onOtherSummon:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onSpecialSummon' || !u184OwnGladiatorSummoned(ctx)){ ctx.reason='自分が「剣闘獣」の特殊召喚に成功した時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player) || !u184HandicapPool(ctx.player).length){ ctx.reason='特殊召喚できる「剣闘獣」がいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u184HandicapPool(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('ハンディキャップマッチ!：特殊召喚する「剣闘獣」', pool, t=>{
      const r = resolveTarget(t); if(!r || (r.zone!=='hand' && r.zone!=='deck')) return;
      const uid = ensureCardUid(gameState, r.card);
      u184AskPos(ctx.player, `ハンディキャップマッチ!：${cardName(r.card)} の表示形式`, pos=>{
        const g = findCardByUid(uid); if(g && (g.zone==='hand' || g.zone==='deck') && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, g.zone, g.index, pos, 'ハンディキャップマッチ!');
      });
    });
  },
  passive:{onSpecialSummon(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && u184OwnGladiatorSummoned(ctx); }}
});

/* スレイブタイガー: ①:自分フィールドに「剣闘獣」モンスターが存在する場合、このカードは手札から特殊召喚できる。 ②:このカードをリリースし、自分フィールドの
   「剣闘獣」モンスター1体を対象として発動できる。その自分の「剣闘獣」モンスターを持ち主のデッキに戻し、デッキから「剣闘獣」モンスター1体を特殊召喚する。
   この効果で特殊召喚したモンスターは、「剣闘獣」モンスターの効果で特殊召喚した扱いとなる。 */
function u184OwnFaceUpGladiators(p, except){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card!==except && x.card.face==='up' && isGladiatorCardDbS03(x.db)}); }
defineScript('スレイブタイガー', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'],
  summonProcedure:{from:'hand', positions:['atk','def'], condition(ctx){
    if(!u184OwnFaceUpGladiators(ctx.player).length){ ctx.reason='自分フィールドに「剣闘獣」モンスターが必要です'; return false; }
    return true;
  }},
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
    if(!u184OwnFaceUpGladiators(ctx.player, ctx.card).length){ ctx.reason='自分フィールドに「剣闘獣」モンスターが必要です'; return false; }
    return true;
  },
  cost(ctx, done){ const me = findCardByUid(ensureCardUid(gameState, ctx.card)); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'スレイブタイガー（リリース）'); done(true); },
  selectTargets(ctx, done){ API.selectCard('スレイブタイガー：デッキに戻す「剣闘獣」', u184OwnFaceUpGladiators(ctx.player, ctx.card), t=>done([t])); },
  resolve(ctx){
    const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(!r || r.zone!=='mz' || r.p!==ctx.player) return;
    const owner = cardOwnerIndex(gameState, r.card, r.p);
    API.returnToDeck(r, false, 'スレイブタイガー'); API.shuffle(owner);
    gladiatorSummonFromDeckS03(ctx.player, 'スレイブタイガー', null, 1);
  }
});
