/* S03-U416: 救世竜 セイヴァー・ドラゴン, レアル・ジェネクス・オラクル, ミンゲイドラゴン, 不死武士 (NOT_STARTED cards, carddata texts).

   救世竜 セイヴァー・ドラゴン  このカードをシンクロ素材とする場合、「セイヴァー」と名のついたモンスターのシンクロ召喚にしか使用できない。
   レアル・ジェネクス・オラクル  このカードが「ジェネクス」と名のついたモンスターの効果によって自分のデッキから手札に加わった場合、このカードを手札から特殊召喚できる。このカードをシンクロ素材とする場合、「ジェネクス」と名のついたモンスターのシンクロ召喚にしか使用できない。
   ミンゲイドラゴン            ドラゴン族モンスターをアドバンス召喚する場合、このカードは2体分のリリースとする事ができる。自分のスタンバイフェイズ時にこのカードが墓地に存在し、自分フィールド上にモンスターが存在しない場合、このカードを表側攻撃表示で特殊召喚する事ができる。この効果は自分の墓地にドラゴン族以外のモンスターが存在する場合には発動できない。この効果で特殊召喚したこのカードは、フィールド上から離れた場合ゲームから除外される。
   不死武士                    自分のスタンバイフェイズ時にこのカードが墓地に存在し、自分フィールド上にモンスターが存在しない場合、このカードを墓地から特殊召喚できる。この効果は自分の墓地に戦士族以外のモンスターが存在する場合には発動できない。このカードは戦士族モンスターのアドバンス召喚以外のためにはリリースできない。

   Notes
   - セイヴァー・ドラゴン / オラクル: synchroMaterialRestriction (engine/20 materialCandidates; the exDb name must contain 「セイヴァー」 / 「ジェネクス」). オラクル's hand effect mirrors BF－そよ風のブリーズ: an optional onAddToHand trigger from the hand when the event came from the Deck and the event reason (the name of the searching card) contains 「ジェネクス」.
   - ミンゲイドラゴン: meta tributeValue {value:2, target:{ra:'ドラゴン'}} (engine/70 tributeValueOptions); the Graveyard effect is an optional Standby Phase trigger of the controller: no monster on my field, every monster of my Graveyard a Dragon; the summoned card gets banishWhenLeavesField.
   - 不死武士: the same Graveyard effect (every monster of my Graveyard a Warrior; no banish) + noAdvanceTributeS03 function form (U414): it can be Tributed only for the Advance Summon of a Warrior. */

function u416Name(info){ return String((info && info.exDb && info.exDb.n) || ''); }
function u416Passive(name, extra){
  return Object.assign({type:'monster', priority:1, timing:['free'],
    condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){}}, extra || {});
}

/* ---- 救世竜 セイヴァー・ドラゴン ---- */
defineScript('救世竜 セイヴァー・ドラゴン', u416Passive('救世竜 セイヴァー・ドラゴン', {
  synchroMaterialRestriction(info){ return u416Name(info).indexOf('セイヴァー') >= 0; }
}));

/* ---- レアル・ジェネクス・オラクル ---- */
function u416OracleAdded(ctx){
  const e = ctx.event || {};
  if(e.from !== 'deck' || e.uid == null || !ctx.card || e.uid !== ctx.card.uid || e.player !== ctx.player) return false;
  if(String(e.reason || '').indexOf('ジェネクス') < 0) return false;
  const h = locateCardAnyV4(ctx.card);
  return !!h && h.zone === 'hand' && h.p === ctx.player;
}
defineUnifiedCardV4('レアル・ジェネクス・オラクル', [{
  key:'added-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onAddToHand'],
  condition(ctx){
    if(!u416OracleAdded(ctx)){ ctx.reason = '「ジェネクス」モンスターの効果で自分のデッキから手札に加わった時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    specialSummonPositionsS03(ctx.player, [{uid:ctx.card.uid, from:'hand'}], 'レアル・ジェネクス・オラクル');
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, activateFrom:['hand'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  passive:{ onAddToHand: ctx => u416OracleAdded(ctx) },
  synchroMaterialRestriction(info){ return u416Name(info).indexOf('ジェネクス') >= 0; }
});

/* ---- Graveyard revival at my Standby Phase (ミンゲイドラゴン / 不死武士) ---- */
function u416Revive(ctx, race){
  if(ctx.zone !== 'grave' || ctx.player !== gameState.activePlayer || gameState.phase !== 'standby') return false;
  if(API.fieldCards({player:ctx.player, zone:'mz'}).length) return false;
  if(!hasMonsterZoneSpace(ctx.player)) return false;
  if(API.pileCards(ctx.player, 'grave', x=>x.db.k === 'm' && x.db.ra !== race).length) return false;
  return typeof canEffectSpecialSummonS03 !== 'function' || canEffectSpecialSummonS03(ctx.card, 'grave', cardName(ctx.card));
}
function u416ReviveEffect(name, race, banishOnLeave){
  return {
    key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onStandbyPhase'],
    condition(ctx){
      if(!u416Revive(ctx, race)){ ctx.reason = `自分のスタンバイフェイズに、自分フィールドにモンスターがなく、墓地に${race}族以外のモンスターがいない時に発動できます`; return false; }
      return true;
    },
    operation(ctx){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.zone !== 'grave' || !u416Revive(ctx, race)) return;
      if(!API.specialSummon(ctx.player, 'grave', h.index, 'atk', name)) return;
      if(banishOnLeave){ const m = locateCardAnyV4(ctx.card); if(m && m.zone === 'mz') API.setCardFlag(m, 'banishWhenLeavesField', true, name, {silent:true}); }
    },
    afterResolve(){}
  };
}

/* ---- ミンゲイドラゴン ---- */
defineUnifiedCardV4('ミンゲイドラゴン', [u416ReviveEffect('ミンゲイドラゴン', 'ドラゴン', true)], {
  type:'monster', priority:1, activateFrom:['grave'], includesSpecialSummon:true, timing:['free'],
  tributeValue:{value:2, target:{ra:'ドラゴン'}},
  passive:{ onStandbyPhase: ctx => u416Revive(ctx, 'ドラゴン') } });

/* ---- 不死武士 ---- */
defineUnifiedCardV4('不死武士', [u416ReviveEffect('不死武士', '戦士', false)], {
  type:'monster', priority:1, activateFrom:['grave'], includesSpecialSummon:true, timing:['free'],
  noAdvanceTributeS03:(card, db)=> !(db && db.k === 'm' && db.ra === '戦士'),
  passive:{ onStandbyPhase: ctx => u416Revive(ctx, '戦士') } });
