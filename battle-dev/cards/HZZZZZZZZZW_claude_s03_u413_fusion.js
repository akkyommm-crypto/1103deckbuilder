/* S03-U413: 輝石融合, パーティカル・フュージョン, 融合禁止エリア (NOT_STARTED cards, carddata texts).

   輝石融合        （通常罠）自分の手札・フィールド上から、融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、「ジェムナイト」と名のついたその融合モンスター1体を融合召喚扱いとしてエクストラデッキから特殊召喚する。
   パーティカル・フュージョン  （通常魔法）自分フィールド上から、融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、「ジェムナイト」と名のついたその融合モンスター1体を融合召喚扱いとしてエクストラデッキから特殊召喚する。この効果で融合召喚に成功した時、墓地のこのカードをゲームから除外し、その融合召喚に使用した「ジェムナイト」と名のついた融合素材モンスター1体を選択して発動する。その融合モンスターの攻撃力はエンドフェイズ時まで、選択したモンスターの攻撃力分アップする。
   融合禁止エリア  （永続罠）お互いのプレイヤーは融合召喚をする事ができない。

   Notes
   - Both Fusion cards are profiles of the Fusion-Spell subsystem (engine/1ZL, S03-U130/U133): 輝石融合 = {hand, field, grave, ジェムナイト}; パーティカル = {field only, grave, ジェムナイト, after 'particleFusion' which stamps the summoned monster with u413Particle = turn}. 輝石融合 is a Normal Trap (its own script; the activation of a Set trap).
   - パーティカル ②: an optional Graveyard trigger on a Special Summon of a monster stamped by it: cost = banish itself; the chosen 「ジェムナイト」 material (zone-local mark fusionMaterialS03 in the Graveyard) gives its ATK to the Fusion Monster until the End Phase.
   - 融合禁止エリア: script flag fusionSummonBanS03 read by engine/1ZZU deckLockSourceS03: API.specialSummon (summonKind 'fusion') is refused and fusionSpellOptionsS03 returns nothing (so the Fusion Spells are not even activatable). */

FUSION_SPELL_PROFILES_S03['輝石融合'] = {zones:['hand','mz'], dispose:'grave', exNameIncludes:'ジェムナイト'};
FUSION_SPELL_PROFILES_S03['パーティカル・フュージョン'] = {zones:['mz'], dispose:'grave', exNameIncludes:'ジェムナイト', after:'particleFusion'};
FUSION_SPELL_AFTER_S03.particleFusion = (put, spell)=>{ API.setCardFlag(put, 'u413Particle', gameState.turn, spell, {silent:true}); };

/* ---- 輝石融合 ---- */
defineScript('輝石融合', {
  type:'trap', priority:2, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(!fusionSpellOptionsS03(ctx.player, '輝石融合').length){ ctx.reason = '融合召喚できる「ジェムナイト」融合モンスターと融合素材がそろっていません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ fusionSpellResolveS03(ctx, '輝石融合'); }
});

/* ---- パーティカル・フュージョン ---- */
function u413Mats(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ジェムナイト')>=0 && !!x.card.fusionMaterialS03); }
function u413Fused(ctx){
  const e = ctx.event || {}, fh = e.uid!=null ? findCardByUid(e.uid) : (e.card ? findCardByUid(e.card.uid) : null), c = fh && fh.card;
  return ctx.zone==='grave' && !!c && Number(c.u413Particle)===Number(gameState.turn) && u413Mats(ctx.player).length>0;
}
defineUnifiedCardV4('パーティカル・フュージョン', [{
  key:'fusion', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!fusionSpellOptionsS03(ctx.player, 'パーティカル・フュージョン').length){ ctx.reason = '融合召喚できる「ジェムナイト」融合モンスターと、フィールドの融合素材がそろっていません'; return false; }
    return true;
  },
  operation(ctx){ fusionSpellResolveS03(ctx, 'パーティカル・フュージョン'); },
  afterResolve(){}
}, {
  key:'boost', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSpecialSummon'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u413Fused(ctx); },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave'){ done(false); return; } API.banish(me, 'パーティカル・フュージョン（コスト）'); done(true); },
  target(ctx, done){ API.selectCard('パーティカル・フュージョン：攻撃力を加える「ジェムナイト」融合素材', u413Mats(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const ev = ctx.event || {}, fm = ev.uid!=null ? findCardByUid(ev.uid) : (ev.card ? findCardByUid(ev.card.uid) : null);
    if(r && fm && fm.zone==='mz' && fm.card.face==='up') v4RegisterStatModifier(fm, {atk:Number(dbOf(r.card).atk)||0}, {code:'パーティカル・フュージョン', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'spell', priority:1, includesSpecialSummon:true, targets:true, onOtherSummon:true, activateFrom:['sz','grave'],
  passive:{ onSpecialSummon(ctx){ return u413Fused(ctx); } } });

/* ---- 融合禁止エリア ---- */
defineUnifiedCardV4('融合禁止エリア', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}], {type:'trap', priority:2 });
CARD_SCRIPTS['融合禁止エリア'].fusionSummonBanS03 = true;
