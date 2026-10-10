/* S03-U210: NOT_STARTED cards (2011 texts) — D－フォーチュン, 無視加護, ジュラック・ヘレラ, ガスタの賢者 ウィンダール, スクラップ・ワーム.
   Engine: the Battle Phase exit destroys a face-up monster whose script declares destroyAfterAttackS03 and that attacked (engine/30). */

/* ---- D－フォーチュン: 相手が直接攻撃を宣言した時に発動する事ができる。自分の墓地に存在する「D－HERO」と名のついたモンスター1体をゲームから除外する事で、
   バトルフェイズを終了する。 (cost: the banish) ---- */
function dFortuneGraveS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('D－HERO')===0); }
defineScript('D－フォーチュン', {
  type:'trap', priority:2,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(!a || a.player!==ctx.opponent || a.targetUid!=null){ ctx.reason = '相手が直接攻撃を宣言した時に発動します'; return false; }
    if(!dFortuneGraveS03(ctx).length){ ctx.reason = '墓地に「D－HERO」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('D－フォーチュン：除外する「D－HERO」', dFortuneGraveS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, 'D－フォーチュン（コスト）'); done(true); }); },
  resolve(ctx){ endBattlePhaseByEffectS03('D－フォーチュン'); },
  passive:{ onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone==='sz' && ctx.card.face==='down' && !!a && a.player===ctx.opponent && a.targetUid==null; } }
});

/* ---- 無視加護 (Continuous Spell): 相手モンスターの攻撃宣言時、自分の墓地の昆虫族モンスター1体をゲームから除外する事で、その攻撃を無効にする。
   The face-up card's effect, offered in the attack-declaration event group (cost: the banish). ---- */
function ignoreInsectsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='昆虫'); }
defineScript('無視加護', {
  type:'spell', priority:2, fieldIgnition:true,
  condition(ctx){
    const a = gameState.pendingAttack;
    if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = '表側表示で存在する場合に発動します'; return false; }
    if(!a || a.player!==ctx.opponent){ ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    if(!ignoreInsectsS03(ctx).length){ ctx.reason = '墓地に昆虫族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('無視加護：除外する昆虫族', ignoreInsectsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, '無視加護（コスト）'); done(true); }); },
  resolve(ctx){ API.negateAttack('無視加護'); },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ const a = gameState.pendingAttack; return ctx.zone==='sz' && ctx.card.face==='up' && !!a && a.player===ctx.opponent && ignoreInsectsS03(ctx).length>0; } }
});

/* ---- ジュラック・ヘレラ: 「ジュラック・ヘレラ」以外の自分フィールド上に守備表示で存在する「ジュラック」と名のついたモンスターが戦闘によって破壊され墓地へ送られた時、
   このカードを手札または墓地から特殊召喚できる。 ---- */
function helleraLossS03(ctx){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.zone!=='grave' || h.p!==ctx.player || h.card===ctx.card) return false;
  const g = h.card.graveInfo, n = String(dbOf(h.card).n||'');
  return !!(g && g.battle && g.byDestroy && g.pos==='def' && Number(g.turn)===Number(gameState.turn) && n.indexOf('ジュラック')===0 && n!=='ジュラック・ヘレラ');
}
defineScript('ジュラック・ヘレラ', {
  type:'monster', priority:1, activateFrom:['hand','grave'], dsTiming:'leave', blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || ['hand','grave'].indexOf(ctx.zone)<0 || !helleraLossS03(ctx)){ ctx.reason = '守備表示の「ジュラック」が戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ const me = findCardByUid(ensureCardUid(gameState, ctx.card)); if(me && (me.zone==='hand'||me.zone==='grave') && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, me.zone, me.index, 'atk', 'ジュラック・ヘレラ'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return (ctx.zone==='hand'||ctx.zone==='grave') && helleraLossS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- ガスタの賢者 ウィンダール: このカードが戦闘によってモンスターを破壊し墓地へ送った時、自分の墓地からレベル3以下の「ガスタ」と名のついたモンスター1体を選択し、
   表側守備表示で特殊召喚できる。 ---- */
function windaarTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && (x.db.lv||99)<=3 && isSetCardV4(x.db, SETCODE.GUSTO)); }
function windaarDestroyedS03(ctx){
  const e = ctx.event || {}, b = ctx.battle || (typeof battleContextV28==='function' ? battleContextV28() : null) || gameState.lastBattle || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  return !!(ctx.zone==='mz' && h && h.zone==='grave' && h.card!==ctx.card && ((b.atkCard===ctx.card && b.defCard && b.defCard.uid===h.card.uid) || (b.defCard===ctx.card && b.atkCard && b.atkCard.uid===h.card.uid)));
}
defineScript('ガスタの賢者 ウィンダール', {
  type:'monster', priority:1, targets:true, dsTiming:'leave', onOtherSummon:false, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !windaarDestroyedS03(ctx)){ ctx.reason = '戦闘によってモンスターを破壊し墓地へ送った時に発動します'; return false; }
    if(!windaarTargetsS03(ctx).length){ ctx.reason = '墓地にレベル3以下の「ガスタ」がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ガスタの賢者 ウィンダール：特殊召喚する「ガスタ」', windaarTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'def', 'ガスタの賢者 ウィンダール'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return windaarDestroyedS03(ctx) && windaarTargetsS03(ctx).length>0; } }
});

/* ---- スクラップ・ワーム: このカードは相手プレイヤーに直接攻撃する事ができる。このカードは攻撃した場合、バトルフェイズ終了時に破壊される。
   このカードが「スクラップ」と名のついたカードの効果によって破壊され墓地へ送られた場合、「スクラップ・ワーム」以外の自分の墓地に存在する「スクラップ」と名のついた
   モンスター1体を選択して手札に加える事ができる。 — the same GY retrieval as スクラップ・コング (graveInfo.srcUidS03). ---- */
function wormTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && x.db.k==='m' && v380IsScrap(x.card) && x.db.n!=='スクラップ・ワーム'); }
defineScript('スクラップ・ワーム', {
  type:'monster', priority:1, activateFrom:['grave'], targets:true, canDirectAttack:true, destroyAfterAttackS03:true,
  condition(ctx){
    if(ctx.eventName!=='onSendToGrave' || ctx.zone!=='grave' || !eventIsSelfS03(ctx) || !scrapDestroyedS03(ctx)){ ctx.reason = '「スクラップ」の効果で破壊され墓地へ送られた場合に発動します'; return false; }
    if(!wormTargetsS03(ctx).length){ ctx.reason = '墓地に他の「スクラップ」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('スクラップ・ワーム：手札に加える「スクラップ」', wormTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(h && h.zone==='grave') API.returnToHand(h, 'スクラップ・ワーム'); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && scrapDestroyedS03(ctx) && wormTargetsS03(ctx).length>0; } }
});
