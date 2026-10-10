/* S03-U287: 魔轟神ルリー, 魔轟神獣キャシー (2011 texts) — written by the Sonnet unit S03-U285; parked there until the hand-size discards drained their events (engine/30, this unit). */
/* ---- 魔轟神ルリー: このカードが手札から墓地へ捨てられた時、このカードを墓地から特殊召喚する。 ----
   Forced, any discard from the hand (cost, effect, hand-size rule). The text gives no position: API.specialSummon 'atk' lets the engine ask the summoning player (S03-U278). */
function ruriDiscardedS285(ctx){
  if(!ctx.card || ctx.zone!=='grave' || !eventIsSelfS03(ctx)) return false;
  const g = ctx.card.graveInfo;
  return !!g && g.from==='hand' && Number(g.turn)===Number(gameState.turn);
}
defineScript('魔轟神ルリー', {
  type:'monster', priority:1, activateFrom:['grave'], forced:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onDiscardAnyS03' || !ruriDiscardedS285(ctx)){ ctx.reason = '手札から捨てられた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const me = findCardByUid(ctx.card.uid);
    if(!me || me.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', me.index, 'atk', '魔轟神ルリー');
  },
  afterResolve(){},
  passive:{ onDiscardAnyS03(ctx){ return ruriDiscardedS285(ctx) && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- 魔轟神獣キャシー: このカードが手札から墓地へ捨てられた時、フィールド上に表側表示で存在するカード1枚を選択して破壊する。 ----
   Forced, any discard from the hand. The target (one face-up card on either field: Monster, Spell & Trap or Field Zone) is chosen at activation; with no face-up card it does not
   activate. Resolution: the card is destroyed if it is still on the field. */
function cassyPoolS285(){ return API.fieldCards({filter:x=>!!x.card && x.card.face==='up'}); }
function cassyReadyS285(ctx){ return ruriDiscardedS285(ctx) && cassyPoolS285().length>0; }
defineScript('魔轟神獣キャシー', {
  type:'monster', priority:1, activateFrom:['grave'], forced:true, targets:true, destroysFieldV46:true,
  condition(ctx){
    if(ctx.eventName!=='onDiscardAnyS03' || !ruriDiscardedS285(ctx)){ ctx.reason = '手札から捨てられた時に発動します'; return false; }
    if(!cassyPoolS285().length){ ctx.reason = 'フィールド上に表側表示のカードがありません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'魔轟神獣キャシー：破壊する表側表示のカード', candidates:cassyPoolS285(), min:1, max:1, targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t ? resolveTarget(t) : null;
    if(!r || ['mz','sz','field'].indexOf(r.zone)<0){ API.log('魔轟神獣キャシー：対象が場にないため不発'); return; }
    API.destroy(r, '魔轟神獣キャシー');
  },
  afterResolve(){},
  passive:{ onDiscardAnyS03(ctx){ return cassyReadyS285(ctx); } }
});

