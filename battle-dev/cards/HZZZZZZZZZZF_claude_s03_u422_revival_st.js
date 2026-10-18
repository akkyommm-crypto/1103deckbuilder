/* S03-U422: 巻きすぎた発条, スクラップ・オイルゾーン, 増草剤, 血の沼地 (NOT_STARTED revival / lock Spell & Trap Cards, carddata texts).

   巻きすぎた発条      （通常魔法）自分の墓地に存在する「ゼンマイ」と名のついたモンスター1体を選択して発動する。選択したモンスターを表側守備表示で特殊召喚する。この効果で特殊召喚したモンスターの効果は無効化され、リリースできず、シンクロ素材とする事もできない。
   スクラップ・オイルゾーン  （永続魔法）自分の墓地に存在する「スクラップ」と名のついたモンスター1体を選択して発動する。選択したモンスターを墓地から特殊召喚する。この効果で特殊召喚したモンスターの効果は無効化される。このカードがフィールド上に存在しなくなった時、そのモンスターを破壊する。そのモンスターがフィールド上から離れた時このカードを破壊する。このカードを発動するターン、自分はバトルフェイズを行う事ができない。
   増草剤              （永続魔法）①：1ターンに1度、自分の墓地の植物族モンスター1体を対象として発動できる。その植物族モンスターを特殊召喚する。この効果でモンスターを特殊召喚するターン、自分は通常召喚できない。この効果で特殊召喚したモンスターがフィールドから離れた時にこのカードは破壊される。
   血の沼地            （永続罠）自分フィールド上にこのカード以外の魔法・罠カードが存在している場合、このカードを破壊する。このカードがフィールド上に存在する限り、魔法&罠カードゾーンにセットされたカードは発動できない。2回目の自分のスタンバイフェイズ時にこのカードを破壊する。

   Notes
   - A hand activation moves the card to the Spell & Trap Zone FACE-UP before the legality is judged: an ACTIVATE condition that refuses a face-up card in the zone makes the activation a plain placement without a chain link (S03-U415 デッキロック). u422Fresh refuses only a face-up resident that is not being activated (ctx.cardActivation is false), which also keeps a Continuous Spell's ignition effect selectable.
   - 巻きすぎた発条: Normal Spell; the revived Zenmai gets the permanent negation (API.negateEffectUntil), cannotTribute (no Release) and noSynchroMaterialS03.
   - スクラップ・オイルゾーン: permanent negation of the revived monster, the two links of API.linkOnLeave (this card leaves → the monster is destroyed; the monster leaves → this card is destroyed) and API.skipPhase(…, 'battle') for the turn.
   - 増草剤: a face-up ignition (once per turn, target Plant of the Graveyard, banSummonS03 normal for the turn) + linkOnLeave(this card, the Plant, 'destroy').
   - 血の沼地: activationLockS03 = a card activation from a Set card of the Spell & Trap Zone (either player); selfDestroyWhenS03 while another Spell / Trap Card of its controller exists; the ACTIVATE stamps u422End (my 2nd Standby Phase: +4 in my turn, +3 in the opponent's turn) and a forced Standby Phase trigger destroys it. */

/* a hand activation has already moved the card to the zone, face-up, when the legality is judged (opts.cardActivation → ctx.cardActivation); a face-up card that stayed on the field is not activated again */
function u422Fresh(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && !ctx.cardActivation); }
function u422Act(stamp){
  return { key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:stamp?2:1, events:['activate'],
    condition(ctx){ return u422Fresh(ctx); },
    operation(ctx){
      if(!stamp) return;
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
      API.setCardFlag(me, 'u422End', Number(gameState.turn) + (ctx.player===gameState.activePlayer ? 4 : 3), cardName(ctx.card), {silent:true});
    },
    afterResolve(){} };
}
function u422Link(ctx, uid, name){
  const self = locateCardAnyV4(ctx.card), mon = findCardByUid(uid);
  if(!self || self.zone!=='sz' || !mon || mon.zone!=='mz') return;
  API.linkOnLeave(mon, self, 'destroy', name);
  const mon2 = findCardByUid(uid); if(mon2) API.linkOnLeave(self, mon2, 'destroy', name);
}

/* ---- 巻きすぎた発条 ---- */
function u422Zenmai(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ゼンマイ')>=0 && canEffectSpecialSummonS03(x.card, 'grave', '巻きすぎた発条')); }
defineUnifiedCardV4('巻きすぎた発条', [{
  key:'revive', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u422Zenmai(ctx.player).length){ ctx.reason = '墓地に「ゼンマイ」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('巻きすぎた発条：特殊召喚する「ゼンマイ」モンスター', u422Zenmai(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(!t || t.zone!=='grave' || t.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, t.card);
    if(!API.specialSummon(ctx.player, 'grave', t.index, 'def', '巻きすぎた発条')) return;
    const h = findCardByUid(uid); if(!h || h.zone!=='mz') return;
    API.negateEffectUntil(h, 'permanent', '巻きすぎた発条', ctx.card);
    const h2 = findCardByUid(uid);
    API.setCardFlag(h2, 'cannotTribute', true, '巻きすぎた発条', {silent:true});
    API.setCardFlag(findCardByUid(uid), 'noSynchroMaterialS03', true, '巻きすぎた発条', {silent:true});
  }
}], {type:'spell', priority:1, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true});

/* ---- スクラップ・オイルゾーン ---- */
function u422Scrap(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('スクラップ')>=0 && canEffectSpecialSummonS03(x.card, 'grave', 'スクラップ・オイルゾーン')); }
defineUnifiedCardV4('スクラップ・オイルゾーン', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u422Fresh(ctx)) return false;
    if(!u422Scrap(ctx.player).length){ ctx.reason = '墓地に「スクラップ」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('スクラップ・オイルゾーン：特殊召喚する「スクラップ」モンスター', u422Scrap(ctx.player), t=>done([t])); },
  operation(ctx){
    API.skipPhase(ctx.player, 'battle', 0);
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(!t || t.zone!=='grave' || t.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, t.card);
    if(!API.specialSummon(ctx.player, 'grave', t.index, 'atk', 'スクラップ・オイルゾーン')) return;
    const h = findCardByUid(uid); if(!h || h.zone!=='mz') return;
    API.negateEffectUntil(h, 'permanent', 'スクラップ・オイルゾーン', ctx.card);
    u422Link(ctx, uid, 'スクラップ・オイルゾーン');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true});

/* ---- 増草剤 ---- */
function u422Plants(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='植物' && canEffectSpecialSummonS03(x.card, 'grave', '増草剤')); }
defineUnifiedCardV4('増草剤', [u422Act(false), {
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.card.activationPending || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに表側表示で存在する必要があります'; return false; }
    if(!u422Plants(ctx.player).length){ ctx.reason = '墓地に植物族モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('増草剤：特殊召喚する植物族モンスター', u422Plants(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(!t || t.zone!=='grave' || t.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, t.card);
    if(!API.specialSummon(ctx.player, 'grave', t.index, 'atk', '増草剤')) return;
    banSummonS03(ctx.player, gameState.turn, gameState.turn, ['normal'], {}, '増草剤');
    const self = locateCardAnyV4(ctx.card), mon = findCardByUid(uid);
    if(self && self.zone==='sz' && mon && mon.zone==='mz') API.linkOnLeave(self, mon, 'destroy', '増草剤');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, includesSpecialSummon:true, countLimit:{n:1, effects:['revive']}, activateFrom:['hand','sz']});

/* ---- 血の沼地 ---- */
function u422Other(c, p){
  const P = gameState.players[p];
  return [].concat(P.sz||[], P.field?[P.field]:[]).some(x=>x && x!==c);
}
defineUnifiedCardV4('血の沼地', [u422Act(true), {
  key:'expire', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby' && ctx.card.u422End!=null && Number(gameState.turn)>=Number(ctx.card.u422End); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.destroy(me, '血の沼地'); },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true,
  passive:{ onStandbyPhase(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby' && ctx.card.u422End!=null && Number(gameState.turn)>=Number(ctx.card.u422End); } },
  selfDestroyWhenS03:(card, p)=> u422Other(card, p) ? '血の沼地：自分フィールドにこのカード以外の魔法・罠カードが存在するため破壊' : false,
  activationLockS03:(i)=> !i.effectOnly && (i.db.k==='s' || i.db.k==='t') && (i.zone==='sz' || i.zone==='field') && !!i.card && i.card.face==='down' });
