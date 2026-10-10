/* S03-U218: NOT_STARTED cards (2011 texts) — 陽動作戦, デーモンの雄叫び, エレキーパー, ブラック・サンダー, TG－SX1, エクシーズエフェクト.
   Engine: 陽動作戦's turn flag (temporaryFlags.noAttackFaceDownS03) is read by attackTargetForbiddenReasonS03 (engine/1ZU). */

/* ---- 陽動作戦: このターン、お互いは裏側表示モンスターを攻撃できない。 ---- */
defineScript('陽動作戦', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){ [0,1].forEach(p=>API.setFlag(p, 'noAttackFaceDownS03', gameState.turn, true)); API.log('陽動作戦：このターン、お互いは裏側表示モンスターを攻撃できない'); },
  afterResolve(){}
});

/* ---- デーモンの雄叫び: 500ライフポイントを払い発動する。自分の墓地から「デーモン」という名のついたモンスターカード1枚を自分のフィールド上に特殊召喚する。
   このモンスターは、いかなる場合にも生け贄にする事はできず、このターンのエンドフェイズに破壊される。 (cost: 500 LP; chosen at resolution) ---- */
function demonRoarPoolS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('デーモン')>=0 && canEffectSpecialSummonS03(x.card,'grave','デーモンの雄叫び')); }
defineScript('デーモンの雄叫び', {
  type:'trap', priority:2, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(API.me(ctx).lp<500){ ctx.reason = 'ライフポイントが足りません'; return false; }
    if(!demonRoarPoolS03(ctx).length){ ctx.reason = '墓地に「デーモン」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp<500){ done(false); return; } API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    const pool = demonRoarPoolS03(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('デーモンの雄叫び：特殊召喚する「デーモン」', pool, t=>{
      const h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(!h || h.zone!=='grave') return;
      if(API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'デーモンの雄叫び')===false) return;
      const now = findCardByUid(h.card.uid); if(!now || now.zone!=='mz') return;
      API.setCardFlag(now, 'cannotTribute', true, 'デーモンの雄叫び', {silent:true});
      v340ScheduleEndDestroy(now.card, ctx.player, 'デーモンの雄叫び');
    });
  },
  afterResolve(){}
});

/* ---- エレキーパー: 自分の墓地に存在するレベル4以下の「エレキ」と名のついたモンスター1体を選択して発動する。選択したモンスターを墓地から特殊召喚する。
   この効果で特殊召喚したモンスターは、このターンのエンドフェイズ時に破壊される。 ---- */
function elekeeperTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && Number(x.db.lv||99)<=4 && String(x.db.n||'').indexOf('エレキ')===0 && canEffectSpecialSummonS03(x.card,'grave','エレキーパー')); }
defineScript('エレキーパー', {
  type:'trap', priority:2, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!elekeeperTargetsS03(ctx).length){ ctx.reason = '墓地にレベル4以下の「エレキ」がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('エレキーパー：特殊召喚する「エレキ」', elekeeperTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    if(API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'エレキーパー')===false) return;
    const now = findCardByUid(h.card.uid); if(now && now.zone==='mz') v340ScheduleEndDestroy(now.card, ctx.player, 'エレキーパー');
  },
  afterResolve(){}
});

/* ---- ブラック・サンダー: 自分フィールド上に存在する「BF」と名のついたモンスターが戦闘によって破壊され墓地へ送られた時に発動する事ができる。
   相手フィールド上に存在するカード1枚につき、相手ライフに400ポイントダメージを与える。 ---- */
function blackThunderLossS03(ctx){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player || !isSetCardV4(dbOf(h.card), SETCODE.BLACKWING)) return false;
  const g = h.card.graveInfo;
  return !!(g && g.battle && g.byDestroy && g.from==='mz' && Number(g.turn)===Number(gameState.turn));
}
defineScript('ブラック・サンダー', {
  type:'trap', priority:2,
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !blackThunderLossS03(ctx)){ ctx.reason = '自分の「BF」が戦闘によって破壊され墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){ const n = API.fieldCards({player:ctx.opponent}).length; if(n>0) API.damageLP(ctx.opponent, n*400); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && blackThunderLossS03(ctx); } }
});

/* ---- TG－SX1: 自分フィールド上に存在する「TG」と名のついたモンスターが戦闘によって相手モンスターを破壊し墓地へ送った時に発動する事ができる。
   自分の墓地に存在する「TG」と名のついたシンクロモンスター1体を選択して特殊召喚する。 ---- */
function sx1BattleWinS03(ctx){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.opponent) return false;
  const b = [ctx.battle, (typeof battleContextV28==='function' ? battleContextV28() : null), gameState.lastBattle].find(x=>x && x.atkCard) || {};
  const other = (b.atkCard && b.atkCard.uid===h.card.uid) ? b.defCard : ((b.defCard && b.defCard.uid===h.card.uid) ? b.atkCard : null);
  if(!other) return false;
  const oh = findCardByUid(other.uid);
  return !!(oh && oh.zone==='mz' && oh.p===ctx.player && oh.card.face==='up' && isSetCardV4(dbOf(oh.card), SETCODE.TG));
}
function sx1TargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && (x.db.st||[]).indexOf('シンクロ')>=0 && isSetCardV4(x.db, SETCODE.TG) && canEffectSpecialSummonS03(x.card,'grave','TG－SX1')); }
defineScript('TG－SX1', {
  type:'trap', priority:2, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !sx1BattleWinS03(ctx)){ ctx.reason = '自分の「TG」が戦闘で相手モンスターを破壊し墓地へ送った時に発動します'; return false; }
    if(!sx1TargetsS03(ctx).length){ ctx.reason = '墓地に「TG」シンクロモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('TG－SX1：特殊召喚する「TG」シンクロモンスター', sx1TargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'TG－SX1'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && sx1BattleWinS03(ctx) && sx1TargetsS03(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- エクシーズエフェクト: 自分がエクシーズ召喚に成功した時、フィールド上のカード1枚を選択して発動できる。選択したカードを破壊する。 ---- */
function xyzEffectReadyS03(ctx){
  const e = ctx.event || {};
  if(e.player!==ctx.player || e.kind!=='xyz') return false;
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  return !!(h && h.zone==='mz' && h.p===ctx.player);
}
defineScript('エクシーズエフェクト', {
  type:'trap', priority:2, targets:true, onOtherSummon:true, destroysFieldV46:true,
  condition(ctx){
    if(ctx.eventName!=='onSpecialSummon' || !xyzEffectReadyS03(ctx)){ ctx.reason = '自分がエクシーズ召喚に成功した時に発動します'; return false; }
    if(!API.fieldCards({filter:x=>x.card!==ctx.card}).length){ ctx.reason = 'フィールドに破壊するカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('エクシーズエフェクト：破壊するカード', API.fieldCards({filter:x=>x.card!==ctx.card}), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], r = t && resolveTarget(t); if(r) API.destroy(r, 'エクシーズエフェクト'); },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return ctx.zone==='sz' && xyzEffectReadyS03(ctx); } }
});
