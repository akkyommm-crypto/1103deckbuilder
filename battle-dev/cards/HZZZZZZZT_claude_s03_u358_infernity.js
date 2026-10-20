/* S03-U358: three Infernity cards (carddata texts).

   ZERO－MAX              自分の手札が0枚の場合、自分の墓地の「インフェルニティ」モンスター1体を選択して発動できる。特殊召喚し、そのモンスターより攻撃力が低いフィールドの表側表示モンスターを全て破壊する。このカードを発動するターン、自分はバトルフェイズを行えない。
   インフェルニティ・ミラージュ  このカードは墓地からの特殊召喚はできない。自分の手札が0枚の場合、このカードをリリースし、自分の墓地の「インフェルニティ」モンスター2体を選択して発動できる。選択したモンスターを特殊召喚する。
   インフェルニティ・リフレクター 自分フィールドの「インフェルニティ」モンスターが戦闘によって破壊され墓地へ送られた時、手札を全て捨てて発動できる。そのモンスター1体を墓地から特殊召喚し、相手に1000ダメージ。

   Notes
   - ZERO－MAX: 「手札が0枚」 is checked on the hand without the Spell itself (it leaves the hand on activation); the Battle Phase ban is the turn-temporary player flag noBattlePhase (read by battlePhaseForbiddenV340).
   - ミラージュ: 「墓地からの特殊召喚はできない」 is a new engine rule read from the card text (engine/1ZK noGraveSummonReasonS03, enforced by API.specialSummon and canEffectSpecialSummonS03).
   - リフレクター: the trap watches the Graveyard events (onSendToGrave) of a monster destroyed by battle this turn (graveInfo.battle). */

function u358Inf(x){ return String(x.db.n||'').indexOf('インフェルニティ')>=0 && x.db.k==='m'; }
function u358HandEmpty(ctx){ return API.me(ctx).hand.filter(c=>c!==ctx.card).length===0; }

/* ---- ZERO－MAX ---- */
function u358ZeroPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>u358Inf(x) && canEffectSpecialSummonS03(x.card, 'grave', 'ZERO－MAX')); }
defineScript('ZERO－MAX', {
  type:'spell', priority:1, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(!u358HandEmpty(ctx)){ ctx.reason = '手札が0枚の場合に発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u358ZeroPool(ctx).length){ ctx.reason = '墓地に「インフェルニティ」モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ZERO－MAX：特殊召喚する「インフェルニティ」', u358ZeroPool(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    API.setFlag(ctx.player, 'noBattlePhase', true, true);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ZERO－MAX');
    const me = findCardByUid(uid); if(!me || me.zone!=='mz') return;
    const atk = curATK(me.card);
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.card.uid!==uid && curATK(x.card)<atk}).forEach(x=>{
      const h = findCardByUid(x.card.uid); if(h && h.zone==='mz') API.destroy(h, 'ZERO－MAX');
    });
  },
  afterResolve(){}
});

/* ---- インフェルニティ・ミラージュ ---- */
function u358MiragePool(ctx){ return API.pileCards(ctx.player, 'grave', x=>u358Inf(x) && x.card!==ctx.card && x.db.n!=='インフェルニティ・ミラージュ'); }
defineUnifiedCardV4('インフェルニティ・ミラージュ', [{
  key:'revive2', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(API.me(ctx).hand.length){ ctx.reason = '手札が0枚の場合に発動できます'; return false; }
    if(u358MiragePool(ctx).length<2){ ctx.reason = '墓地に「インフェルニティ」モンスターが2体いません'; return false; }
    if(ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length + 1 < 2){ ctx.reason = 'モンスターゾーンが足りません'; return false; }
    return true;
  },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz'){ done(false); return; } API.sendToGrave(h, 'インフェルニティ・ミラージュ（リリース）'); done(true); },
  target(ctx, done){
    API.selectCard('インフェルニティ・ミラージュ：1体目', u358MiragePool(ctx), a=>
      API.selectCard('インフェルニティ・ミラージュ：2体目', u358MiragePool(ctx).filter(x=>x.card!==(a && (a.card || a))), b=>done([a, b])));
  },
  operation(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{
      const r = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
      if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'インフェルニティ・ミラージュ');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, includesSpecialSummon:true, timing:['mainPhase']});

/* ---- インフェルニティ・リフレクター ---- */
function u358Dead(ctx){
  const e = ctx.event || {};
  const uid = e.uid!=null ? e.uid : (Array.isArray(e.uids) && e.uids.length===1 ? e.uids[0] : null);
  if(uid==null) return null;
  const h = findCardByUid(uid); if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const g = h.card.graveInfo, d = dbOf(h.card);
  if(!g || g.from!=='mz' || !g.battle || Number(g.turn)!==Number(gameState.turn) || !d || d.k!=='m' || String(d.n||'').indexOf('インフェルニティ')<0) return null;
  return h;
}
defineScript('インフェルニティ・リフレクター', {
  type:'trap', priority:2, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(!u358Dead(ctx)){ ctx.reason = '自分の「インフェルニティ」モンスターが戦闘で破壊され墓地へ送られた時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const hand = API.me(ctx).hand;
    for(let i=hand.length-1;i>=0;i--) API.discard(ctx.player, i, 'インフェルニティ・リフレクター（コスト）', {byEffect:false});
    done(true);
  },
  resolve(ctx){
    const h = u358Dead(ctx); if(!h || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'インフェルニティ・リフレクター');
    API.damageLP(ctx.opponent, 1000, 'インフェルニティ・リフレクター');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && !!u358Dead(ctx); } }
});
