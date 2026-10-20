/* S03-U425: モノケロース, 紅蓮地帯を飛ぶ鷹, 共鳴破, トラパート (NOT_STARTED cards that react to Synchro Summon materials, carddata texts).

   モノケロース        このカードは通常召喚できない。手札の魔法カード1枚をゲームから除外した場合に特殊召喚する事ができる。このカードと獣族チューナーを素材としたシンクロ召喚に成功した時、そのシンクロ召喚の素材とした獣族チューナー1体を墓地から特殊召喚する事ができる。
   紅蓮地帯を飛ぶ鷹    （チューナー）このカードがシンクロモンスターのシンクロ召喚に使用され墓地へ送られた場合に自分の墓地の「ラヴァル」と名のついたモンスターが3種類以上の場合、このカードを墓地から特殊召喚できる。この効果で特殊召喚したこのカードは、フィールド上から離れた場合ゲームから除外される。
   共鳴破              （永続罠）このカードがフィールド上に存在する限り、「リゾネーター」と名のついたモンスターがシンクロ素材として墓地へ送られる度に、相手フィールド上に存在するカード1枚を選択して破壊する。このカードは発動後2回目の自分のエンドフェイズ時に破壊される。
   トラパート          （チューナー）このカードをシンクロ素材としたシンクロモンスターが攻撃する場合、相手はダメージステップ終了時まで罠カードを発動できない。このカードをシンクロ素材とする場合、戦士族モンスターのシンクロ召喚にしか使用できない。

   Notes
   - The Synchro Summon reducer (EX_SUMMON_PREPARE_V42) sends the materials to the Graveyard with graveInfo.reason 'synchroMaterial' and an onSendToGrave event {reason:'synchroMaterial', kind:'synchro', summonUid}; the Synchro Monster gets v380SummonMaterials [{name, tuner, lv, at}] when it arrives (EX_SUMMON_COMMIT_V42) with its onSpecialSummon event {kind:'synchro'}.
   - 鷹: GY trigger on its own material event; ≥3 different 「ラヴァル」 monster names in my Graveyard; the revived card gets banishWhenLeavesField.
   - モノケロース: GY trigger (onOtherSummon) on the onSpecialSummon event of a Synchro Monster of mine whose v380SummonMaterials name モノケロース and a Beast Tuner; the Beast Tuner (by name) of the Graveyard is Special Summoned.
   - 共鳴破: a forced trigger of the face-up Trap on each material event whose card name contains 「リゾネーター」 (either player's Synchro Summon): the controller destroys a chosen card of the opponent's field; the ACTIVATE stamps u425End (my 2nd End Phase: +2 in my turn, +3 in the opponent's turn).
   - トラパート: synchroMaterialRestriction (exDb.ra 戦士) + the new script flag synchroMatTrapLockS03 read by engine/1ZD monsterActivationLockReasonS03: while a Synchro Monster whose v380SummonMaterials names such a card attacks (battle step other than 'end'), the opponent cannot activate Trap Cards. */

function u425Mat(ctx){ const e = ctx.event || {}; return ctx.zone==='grave' && e.reason==='synchroMaterial' && eventIsSelfS03(ctx); }

/* ---- 紅蓮地帯を飛ぶ鷹 ---- */
function u425LavalKinds(p){
  const seen = [];
  API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ラヴァル')>=0).forEach(x=>{ if(seen.indexOf(x.db.n)<0) seen.push(x.db.n); });
  return seen.length;
}
defineUnifiedCardV4('紅蓮地帯を飛ぶ鷹', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!u425Mat(ctx)){ ctx.reason = 'シンクロ素材として墓地へ送られた場合に発動します'; return false; }
    if(u425LavalKinds(ctx.player)<3){ ctx.reason = '墓地の「ラヴァル」モンスターが3種類未満です'; return false; }
    return hasMonsterZoneSpace(ctx.player);
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave' || !hasMonsterZoneSpace(ctx.player) || u425LavalKinds(ctx.player)<3) return;
    if(API.specialSummon(ctx.player, 'grave', me.index, 'atk', '紅蓮地帯を飛ぶ鷹')){ const m = locateCardAnyV4(ctx.card); if(m && m.zone==='mz') API.setCardFlag(m, 'banishWhenLeavesField', true, '紅蓮地帯を飛ぶ鷹', {silent:true}); }
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['grave'], includesSpecialSummon:true, passive:{ onSendToGrave(ctx){ return u425Mat(ctx) && u425LavalKinds(ctx.player)>=3 && hasMonsterZoneSpace(ctx.player); } } });

/* ---- モノケロース ---- */
function u425BeastTuners(ctx){
  const e = ctx.event || {}; if(e.kind!=='synchro' || e.player!==ctx.player) return [];
  const h = e.uid!=null ? findCardByUid(e.uid) : null; if(!h || h.zone!=='mz') return [];
  const mats = h.card.v380SummonMaterials || [];
  if(!mats.some(m=>m.name==='モノケロース')) return [];
  const names = mats.filter(m=>m.tuner && m.name!=='モノケロース').map(m=>m.name).filter(n=>{ const d = dbOf({id:findCardIndex(n)}); return d && d.ra==='獣'; });
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && names.indexOf(x.db.n)>=0 && canEffectSpecialSummonS03(x.card, 'grave', 'モノケロース'));
}
defineUnifiedCardV4('モノケロース', [{
  key:'tuner-back', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSpecialSummon'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='grave' || !u425BeastTuners(ctx).length){ ctx.reason = '自分と獣族チューナーを素材としたシンクロ召喚に成功した時に発動します'; return false; }
    return hasMonsterZoneSpace(ctx.player);
  },
  operation(ctx){
    const pool = u425BeastTuners(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('モノケロース：特殊召喚する素材の獣族チューナー', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'モノケロース');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['grave'], onOtherSummon:true, includesSpecialSummon:true, cannotNormalSummon:true,
  passive:{ onSpecialSummon(ctx){ return ctx.zone==='grave' && u425BeastTuners(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } },
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!API.pileCards(ctx.player, 'hand', x=>x.db.k==='s' && x.card!==ctx.card).length){ ctx.reason = '手札に魔法カードがありません'; return false; } return true; },
    cost(ctx, done){
      const pool = API.pileCards(ctx.player, 'hand', x=>x.db.k==='s' && x.card!==ctx.card); if(!pool.length){ done(false); return; }
      API.selectCard('モノケロース：除外する手札の魔法カード', pool, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player){ done(false); return; }
        API.banish(r, 'モノケロース（特殊召喚の手順）'); done(true);
      });
    } } });

/* ---- 共鳴破 ---- */
function u425ResoSent(ctx){
  const e = ctx.event || {}; if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.card.activationPending || e.reason!=='synchroMaterial' || e.uid==null) return false;
  const h = findCardByUid(e.uid); return !!h && String(cardName(h.card)).indexOf('リゾネーター')>=0;
}
function u425FoeCards(ctx){
  return [].concat(API.fieldCards({player:ctx.opponent, zone:'mz'}), API.fieldCards({player:ctx.opponent, zone:'sz'}), API.fieldCards({player:ctx.opponent, zone:'field'}));
}
function u425Due(ctx){ return u415Up(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='end' && ctx.card.u425End!=null && Number(gameState.turn)>=Number(ctx.card.u425End); }
defineUnifiedCardV4('共鳴破', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return u422Fresh(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u425End', Number(gameState.turn) + (ctx.player===gameState.activePlayer ? 2 : 3), '共鳴破', {silent:true}); },
  afterResolve(){}
}, {
  key:'bolt', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onSendToGrave'], forced:true, targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return u425ResoSent(ctx) && u425FoeCards(ctx).length>0; },
  operation(ctx){
    const pool = u425FoeCards(ctx); if(!pool.length) return;
    API.selectCard('共鳴破：破壊する相手フィールドのカード', pool, t=>{ const r = t && resolveTarget(t); if(r && r.p===ctx.opponent) API.destroy(r, '共鳴破'); });
  },
  afterResolve(){}
}, {
  key:'expire', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u425Due(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.destroy(me, '共鳴破'); },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, targets:true,
  passive:{ onSendToGrave(ctx){ return u425ResoSent(ctx) && u425FoeCards(ctx).length>0; }, onEndPhase(ctx){ return u425Due(ctx); } } });

/* ---- トラパート ---- */
defineScript('トラパート', u419Passive({
  synchroMatTrapLockS03:true,
  synchroMaterialRestriction(info){ return !!(info && info.exDb && info.exDb.ra==='戦士'); } }));
