/* S03-U215: NOT_STARTED cards (2011 texts) — 華麗なる潜入工作員, 智天使ハーヴェスト, 氷結界の虎将 ガンターラ, 灼熱工の巨匠カエン, 摩天楼2－ヒーローシティ,
   インヴェルズ・ギラファ. */

/* ---- 華麗なる潜入工作員: このカードが召喚に成功した時、罠カードを発動する事はできない。 (engine/1ZD, S03-U213) ---- */
defineScript('華麗なる潜入工作員', Object.assign({}, SUMMON_NO_TRAP_SCRIPT_S03));

/* ---- 智天使ハーヴェスト: このカードが戦闘によって破壊され墓地へ送られた時、自分の墓地に存在するカウンター罠カード1枚を選択して手札に加える事ができる。 ---- */
function harvestTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='t' && x.db.sub==='カウンター'); }
function battleLossToGraveS03(ctx){ const g = ctx.card && ctx.card.graveInfo; return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!(g && g.battle && g.byDestroy && Number(g.turn)===Number(gameState.turn)); }
defineScript('智天使ハーヴェスト', {
  type:'monster', priority:1, activateFrom:['grave'], dsTiming:'leave', targets:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !battleLossToGraveS03(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    if(!harvestTargetsS03(ctx).length){ ctx.reason = '墓地にカウンター罠がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('智天使ハーヴェスト：手札に加えるカウンター罠', harvestTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(h && h.zone==='grave') API.returnToHand(h, '智天使ハーヴェスト'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return battleLossToGraveS03(ctx) && harvestTargetsS03(ctx).length>0; } }
});

/* ---- 氷結界の虎将 ガンターラ: 1ターンに1度、自分のエンドフェイズ時に発動できる。自分の墓地から「氷結界の虎将 ガンターラ」以外の「氷結界」と名のついたモンスター1体を
   選択して特殊召喚する。 ---- */
function gantalaTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.ICE_BARRIER) && x.db.n!=='氷結界の虎将 ガンターラ' && canEffectSpecialSummonS03(x.card,'grave','氷結界の虎将 ガンターラ')); }
function gantalaReadyS03(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='end' && gameState.activePlayer===ctx.player; }
defineScript('氷結界の虎将 ガンターラ', {
  type:'monster', priority:1, countLimit:1, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!gantalaReadyS03(ctx)){ ctx.reason = '自分のエンドフェイズに発動します'; return false; }
    if(!gantalaTargetsS03(ctx).length){ ctx.reason = '墓地に他の「氷結界」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('氷結界の虎将 ガンターラ：特殊召喚する「氷結界」', gantalaTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', '氷結界の虎将 ガンターラ'); },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return gantalaReadyS03(ctx) && gantalaTargetsS03(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- 灼熱工の巨匠カエン: 自分のメインフェイズ時、墓地のこのカードをゲームから除外して発動できる。自分フィールド上の全ての「ラヴァル」と名のついたモンスターの
   攻撃力は400ポイントアップする。 (cost: the banish; the monsters face-up at resolution) ---- */
function kaenLavalsS03(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && isSetCardV4(x.db, SETCODE.LAVAL)}); }
defineScript('灼熱工の巨匠カエン', {
  type:'monster', priority:1, timing:['mainPhase'], activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!kaenLavalsS03(ctx.player).length){ ctx.reason = '自分フィールドに「ラヴァル」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!me || me.zone!=='grave'){ done(false); return; } API.banish(me, '灼熱工の巨匠カエン（コスト）'); done(true); },
  resolve(ctx){ kaenLavalsS03(ctx.player).map(x=>x.card).forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='mz' && h.card.face==='up') API.modAtk(h, 400, 0, 'permanent', '灼熱工の巨匠カエン'); }); },
  afterResolve(){}
});

/* ---- 摩天楼2－ヒーローシティ (Field Spell): 1ターンに1度、自分のメインフェイズ時に、戦闘によって破壊され自分の墓地へ送られた「E・HERO」と名のついたモンスター1体を
   選択して発動できる。選択したモンスターを墓地から特殊召喚する。 ---- */
function heroCityTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.ELEMENTAL_HERO) && !!(x.card.graveInfo && x.card.graveInfo.battle && x.card.graveInfo.byDestroy) && canEffectSpecialSummonS03(x.card,'grave','摩天楼2－ヒーローシティ')); }
defineScript('摩天楼2－ヒーローシティ', {
  type:'spell', priority:1, timing:['mainPhase'], fieldIgnition:true, countLimit:1, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='field' || !ctx.card || ctx.card.face!=='up'){ return true; }   /* the card activation itself (placing the Field Spell) */
    if(!heroCityTargetsS03(ctx).length){ ctx.reason = '戦闘で破壊され墓地へ送られた「E・HERO」がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ if(ctx.zone!=='field' || ctx.card.face!=='up'){ done([]); return; } API.selectCard('摩天楼2－ヒーローシティ：特殊召喚する「E・HERO」', heroCityTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', '摩天楼2－ヒーローシティ'); },
  afterResolve(){}
});

/* ---- インヴェルズ・ギラファ: このカードは「インヴェルズ」と名のついたモンスター1体をリリースして表側攻撃表示でアドバンス召喚できる。
   「インヴェルズ」と名のついたモンスターをリリースしてこのカードのアドバンス召喚に成功した時、相手フィールド上のカード1枚を選択して発動できる。
   選択した相手のカードを墓地へ送り、自分は1000ライフポイント回復する。 ---- */
function giraffaReadyS03(ctx){
  if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)) return false;
  const sp = ctx.card.summonProvenance;
  if(!sp || sp.summonType!=='tribute') return false;
  return (sp.materialRefs||[]).some(u=>{ const h = findCardByUid(u); return !!h && isSetCardV4(dbOf(h.card), SETCODE.INVELLZ); });
}
defineScript('インヴェルズ・ギラファ', {
  type:'monster', priority:1, targets:true,
  normalSummonProcedure:{ includeStandard:true, methods:[{ id:'giraffa1', tributes:1, modes:['summon'], summonLabel:'「インヴェルズ」1体をリリースしてアドバンス召喚',
    materialFilter:(h)=> isSetCardV4(h.db, SETCODE.INVELLZ) }] },
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon' || !giraffaReadyS03(ctx)){ ctx.reason = '「インヴェルズ」をリリースしてアドバンス召喚に成功した時に発動します'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason = '相手フィールドにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('インヴェルズ・ギラファ：墓地へ送る相手のカード', API.fieldCards({player:ctx.opponent}), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], r = t && resolveTarget(t); if(!r || r.p!==ctx.opponent){ API.log('インヴェルズ・ギラファ：対象が場にないため不発'); return; } API.sendToGrave(r, 'インヴェルズ・ギラファ'); API.recoverLP(ctx.player, 1000); },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return giraffaReadyS03(ctx) && API.fieldCards({player:ctx.opponent}).length>0; } }
});
