/* =========================================================================
   S03-U180 — 剣闘獣 (Gladiator Beast) monsters on the common mechanism (engine/1ZZ). 2011 texts.
   ========================================================================= */
function u180GyCards(ctx, pred){ return API.pileCards(ctx.player, 'grave', x=>pred(x)); }

/* 剣闘獣ラクエル: 「剣闘獣」の効果で特殊召喚に成功した場合、元々の攻撃力は2100になる。 + tag-out */
defineGladiatorS03('剣闘獣ラクエル', [gladiatorTagOutEffectS03('剣闘獣ラクエル')], {
  continuous:{scope:'self', from:['mz'], apply(target, self){ return gladiatorSummonedS03(self) ? {setBaseAtk:2100} : null; }}
});
/* 剣闘獣ホプロムス: …元々の守備力は2400になる。 + tag-out */
defineGladiatorS03('剣闘獣ホプロムス', [gladiatorTagOutEffectS03('剣闘獣ホプロムス')], {
  continuous:{scope:'self', from:['mz'], apply(target, self){ return gladiatorSummonedS03(self) ? {setBaseDef:2400} : null; }}
});
/* 剣闘獣ディカエリィ: …1度のバトルフェイズ中に2回攻撃をする事ができる。 + tag-out */
defineGladiatorS03('剣闘獣ディカエリィ', [gladiatorTagOutEffectS03('剣闘獣ディカエリィ')], {
  attackLimit(card){ return gladiatorSummonedS03(card) ? 2 : 1; }
});
/* 剣闘獣エクイテ: …特殊召喚に成功した時、自分の墓地の「剣闘獣」と名のついたカード1枚を選択して手札に加える。 + tag-out */
defineGladiatorS03('剣闘獣エクイテ', [gladiatorOnSummonEffectS03('gy-to-hand', {forced:true,
  cond:ctx=>u180GyCards(ctx, x=>isGladiatorCardDbS03(x.db)).length>0,
  effect:{
    targetRange:LOCATION.GRAVE, targetSide:'self',
    target(ctx, done){ API.selectCard('剣闘獣エクイテ：手札に加える「剣闘獣」カード', u180GyCards(ctx, x=>isGladiatorCardDbS03(x.db)), t=>done([t])); },
    operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, '剣闘獣エクイテ'); }
  }}), gladiatorTagOutEffectS03('剣闘獣エクイテ')], {targets:true});
/* 剣闘獣ムルミロ: …特殊召喚に成功した時、フィールド上に表側表示で存在するモンスター1体を選択して破壊する。 + tag-out */
defineGladiatorS03('剣闘獣ムルミロ', [gladiatorOnSummonEffectS03('destroy-monster', {forced:true,
  cond:()=>API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length>0,
  effect:{
    targetRange:LOCATION.MZONE, targetSide:'both',
    target(ctx, done){ API.selectCard('剣闘獣ムルミロ：破壊する表側表示モンスター', API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t])); },
    operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && r.zone==='mz' && r.card.face==='up') API.destroy(r, '剣闘獣ムルミロ'); }
  }}), gladiatorTagOutEffectS03('剣闘獣ムルミロ')], {targets:true});
/* 剣闘獣レティアリィ: …特殊召喚に成功した時、相手の墓地のカード1枚を選択して除外できる。 + tag-out */
defineGladiatorS03('剣闘獣レティアリィ', [gladiatorOnSummonEffectS03('banish-gy', {forced:false,
  cond:ctx=>API.pileCards(ctx.opponent, 'grave').length>0,
  effect:{
    targetRange:LOCATION.GRAVE, targetSide:'opponent',
    target(ctx, done){ API.selectCard('剣闘獣レティアリィ：除外する相手の墓地のカード', API.pileCards(ctx.opponent, 'grave'), t=>done([t])); },
    operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && r.zone==='grave' && r.p===ctx.opponent) API.banish(r, '剣闘獣レティアリィ'); }
  }}), gladiatorTagOutEffectS03('剣闘獣レティアリィ')], {targets:true});
/* 剣闘獣ベストロウリィ: ①:「剣闘獣」モンスターの効果で特殊召喚に成功した場合、フィールドの魔法・罠カード1枚を対象として発動する。破壊する。
   ②: tag-out */
defineGladiatorS03('剣闘獣ベストロウリィ', [gladiatorOnSummonEffectS03('destroy-st', {forced:true,
  cond:()=>API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).length>0,
  effect:{
    targetRange:LOCATION.ONFIELD, targetSide:'both',
    target(ctx, done){ API.selectCard('剣闘獣ベストロウリィ：破壊する魔法・罠カード', API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}), t=>done([t])); },
    operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && (r.zone==='sz'||r.zone==='field')) API.destroy(r, '剣闘獣ベストロウリィ'); }
  }}), gladiatorTagOutEffectS03('剣闘獣ベストロウリィ')], {targets:true});
/* 剣闘獣セクトル: 「剣闘獣」…によって特殊召喚したこのカードが戦闘を行ったバトルフェイズ終了時、デッキから「剣闘獣セクトル」以外の「剣闘獣」2体を
   特殊召喚する。 (forced, no cost — it stays) */
defineGladiatorS03('剣闘獣セクトル', [gladiatorTagOutEffectS03('剣闘獣セクトル', {count:2, stay:true, requireGladiatorSummoned:true})]);
/* 剣闘獣トラケス: 「剣闘獣」…によって特殊召喚に成功した場合、戦闘を行ったバトルフェイズ終了時にこのカードをデッキに戻す事で、デッキから1枚ドロー。 */
(function(){
  const e = gladiatorTagOutEffectS03('剣闘獣トラケス', {requireGladiatorSummoned:true});
  e.key = 'return-draw'; e.targetRange = LOCATION.DECK;
  const baseCond = e.condition;
  e.condition = function(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || !gladiatorBattledS03(ctx.card) || !gladiatorSummonedS03(ctx.card)) return false;
    return API.me(ctx).deck.length>0;
  };
  e.operation = function(ctx){ API.draw(ctx.player, 1); };
  defineGladiatorS03('剣闘獣トラケス', [e]);
})();
/* 剣闘獣ティゲル: このカードは融合素材モンスターとして使用する事はできない。 / 「剣闘獣」…特殊召喚に成功した時、手札から「剣闘獣」と名のついた
   カード1枚を捨てる事で、デッキから「剣闘獣」と名のついたモンスター1体を手札に加える。 */
defineGladiatorS03('剣闘獣ティゲル', [gladiatorOnSummonEffectS03('discard-search', {forced:false,
  cond:ctx=>API.pileCards(ctx.player,'hand',x=>isGladiatorCardDbS03(x.db)).length>0 && API.pileCards(ctx.player,'deck',x=>isGladiatorMonsterS03(x.card)).length>0,
  effect:{
    targetRange:LOCATION.DECK, targetSide:'self',
    cost(ctx, done){ API.selectCard('剣闘獣ティゲル：捨てる「剣闘獣」カード', API.pileCards(ctx.player,'hand',x=>isGladiatorCardDbS03(x.db)), t=>{ const r=resolveTarget(t); if(!r){done(false);return;} API.discard(ctx.player, r.index, '剣闘獣ティゲル（コスト）', {byEffect:false}); done(true); }); },
    operation(ctx){
      const pool = API.pileCards(ctx.player,'deck',x=>isGladiatorMonsterS03(x.card));
      if(!pool.length) return;
      API.selectCard('剣闘獣ティゲル：手札に加える「剣闘獣」モンスター', pool, t=>{ const r=resolveTarget(t); if(r && r.zone==='deck') API.searchDeck(ctx.player, r.index, '剣闘獣ティゲル'); });
    }
  }})], {cannotFusionMaterialS03:true, blocksIfNoDeckToHand:true});
