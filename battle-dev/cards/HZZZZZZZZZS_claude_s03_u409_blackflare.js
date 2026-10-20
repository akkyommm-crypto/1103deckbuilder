/* S03-U409: エクスプロード・ウィング・ドラゴン, カオス・ゴッデス－混沌の女神－, 黒炎の騎士－ブラック・フレア・ナイト－, 幻影の騎士－ミラージュ・ナイト－ (NOT_STARTED cards, carddata texts).

   エクスプロード・ウィング・ドラゴン  このカードの攻撃力以下の攻撃力を持つ、フィールド上に表側表示で存在するモンスターとこのカードが戦闘を行う場合、ダメージ計算を行わずそのモンスターを破壊し、その攻撃力分のダメージを相手ライフに与える事ができる。
   カオス・ゴッデス－混沌の女神－  1ターンに1度、手札から光属性モンスター1体を墓地へ送り、自分の墓地のレベル5以上の闇属性モンスター1体を選択して発動できる。選択したモンスターを特殊召喚する。この効果で特殊召喚したモンスターはシンクロ素材にできない。
   黒炎の騎士－ブラック・フレア・ナイト－  戦闘によって発生したこのカードのコントローラーへのダメージは0になる。このカードが戦闘によって破壊され墓地へ送られた時、自分のデッキまたは手札から「幻影の騎士－ミラージュ・ナイト－」を1体特殊召喚する。
   幻影の騎士－ミラージュ・ナイト－  このカードは「黒炎の騎士－ブラック・フレア・ナイト－」の効果でのみ特殊召喚が可能。ダメージ計算時、このカードの攻撃力に相手モンスターの元々の攻撃力を加える。戦闘を行ったターンのエンドフェイズ時に、このカードをゲームから除外する。

   Notes
   - エクスプロード: optional onDamageStep trigger (dsTiming 'start') with the battle partner from a5BattleOtherOf; a3DestroyBeforeDamage (no calculation) + damageLP of its ATK.
   - カオス・ゴッデス: once-per-turn ignition; the revived monster gets the NEW zone-local mark noSynchroMaterialS03 (engine/20 materialCandidates, whitelisted in engine/00) so it can never be Synchro material while it stays.
   - 黒炎の騎士: continuous.battleDamage zero for its controller in its own battles; Graveyard trigger after a battle destruction (graveInfo.battle) Special Summoning ミラージュ・ナイト from the Deck / hand (reason = its own name, which the 「の効果でのみ」 text rule of engine/1ZK accepts).
   - ミラージュ・ナイト: continuous apply in the damage step (+ the partner's printed ATK, a5InDamageStep / a5BattleOtherOf); a forced onDamageStep (leave) stamp u409Battled and a forced End Phase banish. */

/* ---- エクスプロード・ウィング・ドラゴン ---- */
function u409Partner(ctx){
  if(ctx.zone!=='mz' || ctx.card.face!=='up') return null;
  const o = a5BattleOtherOf(ctx.card);
  if(!o || o.face!=='up' || curATK(o) > curATK(ctx.card)) return null;
  const h = locateCardAnyV4(o); return (h && h.zone==='mz') ? o : null;
}
defineUnifiedCardV4('エクスプロード・ウィング・ドラゴン', [{
  key:'explode', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'],
  condition(ctx){ return !!u409Partner(ctx); },
  operation(ctx){
    const o = u409Partner(ctx); if(!o) return;
    const n = Math.max(0, curATK(o));
    a3DestroyBeforeDamage(o, 'エクスプロード・ウィング・ドラゴン');
    API.damageLP(ctx.opponent, n, 'エクスプロード・ウィング・ドラゴン');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], dsTiming:'start', passive:{ onDamageStep(ctx){ return !!u409Partner(ctx); } } });

/* ---- カオス・ゴッデス ---- */
function u409LightHand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.at==='光'); }
function u409DarkGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='闇' && Number(x.db.lv)>=5 && canEffectSpecialSummonS03(x.card, 'grave', 'カオス・ゴッデス－混沌の女神－')); }
defineUnifiedCardV4('カオス・ゴッデス－混沌の女神－', [{
  key:'chaos', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u409LightHand(ctx).length){ ctx.reason = '手札に光属性モンスターがいません'; return false; }
    if(!u409DarkGrave(ctx).length){ ctx.reason = '墓地にレベル5以上の闇属性モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u409LightHand(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('カオス・ゴッデス：墓地へ送る手札の光属性モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, 'カオス・ゴッデス－混沌の女神－（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('カオス・ゴッデス：特殊召喚するレベル5以上の闇属性モンスター', u409DarkGrave(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    if(!API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'カオス・ゴッデス－混沌の女神－')) return;
    const h = findCardByUid(uid); if(h && h.zone==='mz') API.setCardFlag(h, 'noSynchroMaterialS03', true, 'カオス・ゴッデス－混沌の女神－', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['chaos']}, timing:['free'] });

/* ---- 黒炎の騎士－ブラック・フレア・ナイト－ ---- */
function u409Fallen(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && ((e.uid!=null && e.uid===ctx.card.uid) || e.card===ctx.card) && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn);
}
function u409Mirage(p){
  return API.pileCards(p, 'hand', x=>x.db.n==='幻影の騎士－ミラージュ・ナイト－').map(x=>({zone:'hand', x}))
    .concat(API.pileCards(p, 'deck', x=>x.db.n==='幻影の騎士－ミラージュ・ナイト－').map(x=>({zone:'deck', x})));
}
defineUnifiedCardV4('黒炎の騎士－ブラック・フレア・ナイト－', [{
  key:'mirage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u409Fallen(ctx) && u409Mirage(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const f = u409Mirage(ctx.player)[0]; if(!f || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, f.zone, f.x.index, 'atk', '黒炎の騎士－ブラック・フレア・ナイト－');
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'],
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    battleDamage(info){
      const s = info && info.self; if(!s || s.face!=='up') return info.amount;
      const h = findCardByUid(s.uid); if(!h || h.p!==info.to) return info.amount;
      return (info.atkCard===s || info.defCard===s) ? 0 : info.amount;
    } },
  passive:{ onSendToGrave(ctx){ return u409Fallen(ctx) && u409Mirage(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); }, onDestroy(ctx){ return u409Fallen(ctx) && u409Mirage(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } } });

/* ---- 幻影の騎士－ミラージュ・ナイト－ ---- */
function u409Battled(ctx){ const b = ctx.battle || {}; return ctx.zone==='mz' && ctx.card.face==='up' && ctx.step==='leave' && (b.atkCard===ctx.card || b.defCard===ctx.card); }
function u409Stamped(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && Number(ctx.card.u409Battled)===Number(gameState.turn); }
defineUnifiedCardV4('幻影の騎士－ミラージュ・ナイト－', [{
  key:'stamp', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u409Battled(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u409Battled', gameState.turn, '幻影の騎士－ミラージュ・ナイト－', {silent:true}); },
  afterResolve(){}
}, {
  key:'vanish', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u409Stamped(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.banish(me, '幻影の騎士－ミラージュ・ナイト－'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self || !self || self.face!=='up' || !a5InDamageStep()) return null;
      const o = a5BattleOtherOf(self); if(!o) return null;
      const n = Number(dbOf(o).atk)||0; return n>0 ? {atk:n} : null;
    } },
  passive:{ onDamageStep(ctx){ return u409Battled(ctx); }, onEndPhase(ctx){ return u409Stamped(ctx); } } });
