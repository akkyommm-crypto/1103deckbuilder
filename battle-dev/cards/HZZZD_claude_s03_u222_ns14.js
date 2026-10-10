/* S03-U222: NOT_STARTED cards (2011 texts) — 真紅眼の不死竜, ラヴァル・ウォリアー, ラヴァル炎樹海の妖女, 天界王 シナト, 対抗魔術, 闇の幻影. */

/* the opponent's monster that `ctx.card` destroyed by battle (the event card), wherever it went, or null */
function destroyedByThisS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card) return null;
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.card===ctx.card) return null;
  const b = [ctx.battle, (typeof battleContextV28==='function' ? battleContextV28() : null), gameState.lastBattle].find(x=>x && x.atkCard) || {};
  const mine = (b.atkCard && b.atkCard.uid===ctx.card.uid) || (b.defCard && b.defCard.uid===ctx.card.uid);
  const theirs = (b.atkCard && b.atkCard.uid===h.card.uid) || (b.defCard && b.defCard.uid===h.card.uid);
  return (mine && theirs) ? h : null;
}

/* ---- 真紅眼の不死竜: このカードはアンデット族モンスター1体をリリースして攻撃表示でアドバンス召喚できる。
   ①:このカードが戦闘でアンデット族モンスターを破壊し墓地へ送った時に発動できる。そのアンデット族モンスターを自分フィールドに特殊召喚する。 ---- */
function undeadDragonPreyS03(ctx){ const h = destroyedByThisS03(ctx); return (h && h.zone==='grave' && dbOf(h.card).ra==='アンデット' && canEffectSpecialSummonS03(h.card,'grave','真紅眼の不死竜')) ? h : null; }
defineScript('真紅眼の不死竜', {
  type:'monster', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true, dsTiming:'leave',
  normalSummonProcedure:{ includeStandard:true, methods:[{ id:'undeadDragon1', tributes:1, modes:['summon'], summonLabel:'アンデット族モンスター1体をリリースしてアドバンス召喚',
    materialFilter:(h)=> currentRaceV17(h.card)==='アンデット' }] },
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !undeadDragonPreyS03(ctx)){ ctx.reason = '戦闘でアンデット族モンスターを破壊し墓地へ送った時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ const h = undeadDragonPreyS03(ctx) || (function(){ const e = ctx.event || {}; const x = e.uid!=null ? findCardByUid(e.uid) : null; return (x && x.zone==='grave') ? x : null; })();
    if(h && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', '真紅眼の不死竜', h.p); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return !!undeadDragonPreyS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- ラヴァル・ウォリアー: このカードが戦闘によって相手モンスターを破壊した場合に自分の墓地の「ラヴァル」と名のついたモンスターが4種類以上の場合、
   その戦闘で破壊したモンスターの元々の攻撃力分のダメージを相手ライフに与える。 (forced) ---- */
function lavalKindsS03(p){ return new Set((gameState.players[p].grave||[]).filter(c=>c && dbOf(c).k==='m' && isSetCardV4(dbOf(c), SETCODE.LAVAL)).map(c=>cardName(c))).size; }
function lavalWarriorReadyS03(ctx){ const h = destroyedByThisS03(ctx); return (h && h.p===ctx.opponent && lavalKindsS03(ctx.player)>=4) ? h : null; }
defineScript('ラヴァル・ウォリアー', {
  type:'monster', priority:1, forced:true, dsTiming:'leave',
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !lavalWarriorReadyS03(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊し、墓地の「ラヴァル」が4種類以上の場合に発動します'; return false; } return true; },
  resolve(ctx){ const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null; if(!h) return; const a = Number(dbOf(h.card).atk)||0; if(a>0) API.damageLP(ctx.opponent, a); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return !!lavalWarriorReadyS03(ctx); } }
});

/* ---- ラヴァル炎樹海の妖女: このカードがフィールド上から墓地へ送られた時、自分フィールド上の全ての「ラヴァル」と名のついたモンスターの攻撃力はエンドフェイズ時まで、
   自分の墓地の「ラヴァル」と名のついたモンスターの数×200ポイントアップする。 (forced; counted at resolution) ---- */
function forestLadyReadyS03(ctx){ const g = ctx.card && ctx.card.graveInfo; return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!g && ['mz','sz','field'].indexOf(g.from)>=0 && Number(g.turn)===Number(gameState.turn); }
defineScript('ラヴァル炎樹海の妖女', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], dsTiming:'leave',
  condition(ctx){ if(ctx.eventName!=='onSendToGrave' || !forestLadyReadyS03(ctx)){ ctx.reason = 'フィールドから墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){
    const n = (API.me(ctx).grave||[]).filter(c=>c && dbOf(c).k==='m' && isSetCardV4(dbOf(c), SETCODE.LAVAL)).length;
    if(!n) return;
    API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isSetCardV4(x.db, SETCODE.LAVAL)}).map(x=>x.card)
      .forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='mz') API.modAtk(h, 200*n, 0, 'endPhase', 'ラヴァル炎樹海の妖女'); });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return forestLadyReadyS03(ctx); } }
});

/* ---- 天界王 シナト: このカードが相手の守備表示モンスターを戦闘によって破壊し墓地へ送った時、破壊したモンスターの元々の攻撃力分のダメージを相手ライフに与える。 (forced) ---- */
function shinatoPreyS03(ctx){ const h = destroyedByThisS03(ctx); return (h && h.zone==='grave' && h.p===ctx.opponent && h.card.graveInfo && h.card.graveInfo.pos==='def') ? h : null; }
defineScript('天界王 シナト', {
  type:'monster', priority:1, forced:true, dsTiming:'leave',
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !shinatoPreyS03(ctx)){ ctx.reason = '相手の守備表示モンスターを戦闘で破壊し墓地へ送った時に発動します'; return false; } return true; },
  resolve(ctx){ const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null; if(!h) return; const a = Number(dbOf(h.card).atk)||0; if(a>0) API.damageLP(ctx.opponent, a); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return !!shinatoPreyS03(ctx); } }
});

/* ---- 対抗魔術: 自分フィールド上に存在する魔力カウンターを2つ取り除いて発動する。魔法カードの発動を無効にし破壊する。 (cost: the counters, from one or more cards) ---- */
function spellCounterSourcesS03(p){ return API.fieldCards({player:p, filter:x=>((x.card.counters||{})['魔力']||0)>0}); }
function spellCounterTotalS03(p){ return spellCounterSourcesS03(p).reduce((s,x)=>s+((x.card.counters||{})['魔力']||0),0); }
defineScript('対抗魔術', {
  type:'trap', priority:3,
  condition(ctx){
    if(!counterTopCardLinkS03(ctx, (e)=>e.kind==='spell')){ ctx.reason = '魔法カードが発動した時に発動します'; return false; }
    if(spellCounterTotalS03(ctx.player)<2){ ctx.reason = '自分フィールドの魔力カウンターが2つありません'; return false; }
    return true;
  },
  cost(ctx, done){
    let need = 2;
    const next = ()=>{
      if(!need){ done(true); return; }
      const src = spellCounterSourcesS03(ctx.player); if(!src.length){ done(false); return; }
      const pay = s=>{ const r = resolveTarget(s); if(!r){ done(false); return; } const k = Math.min(need, (r.card.counters||{})['魔力']||0); API.removeCounter(r, '魔力', k); need -= k; next(); };
      if(src.length===1){ pay(src[0]); return; }
      API.selectCard('対抗魔術：魔力カウンターを取り除くカード', src, pay);
    };
    next();
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '対抗魔術', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!counterTopCardLinkS03(ctx, (e)=>e.kind==='spell') && spellCounterTotalS03(ctx.player)>=2; } }
});

/* ---- 闇の幻影: フィールド上に表側表示で存在する闇属性モンスターを対象にする効果モンスターの効果・魔法・罠カードの発動を無効にし破壊する。 ---- */
function darkIllusionLinkS03(ctx){
  const e = ctx.event || {};
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  if(!l) return null;
  if((e.kind==='spell' || e.kind==='trap') && l.cardActivationS03!==true) return null;
  if(e.kind!=='spell' && e.kind!=='trap' && e.kind!=='monster') return null;
  return linkTargetMonstersS03(l).some(h=>currentAttributeV17(h.card)==='闇') ? l : null;
}
defineScript('闇の幻影', {
  type:'trap', priority:3,
  condition(ctx){ if(!darkIllusionLinkS03(ctx)){ ctx.reason = '表側表示の闇属性モンスターを対象にする発動に対して発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '闇の幻影', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!darkIllusionLinkS03(ctx); } }
});
declareActivationResponseS03(['対抗魔術','闇の幻影']);
