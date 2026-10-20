/* S03-U414: インヴェルズの魔細胞, インヴェルズの斥候, 深緑の魔弓使い, 蒼血鬼 (NOT_STARTED cards, carddata texts).

   インヴェルズの魔細胞  自分フィールド上にモンスターが存在しない場合、このカードは手札から特殊召喚できる。このカードは「インヴェルズ」と名のついたモンスターのアドバンス召喚以外のためにはリリースできず、シンクロ素材にもできない。
   インヴェルズの斥候    自分フィールド上に魔法・罠カードが存在しない場合、自分のメインフェイズ1の開始時にのみ発動できる。このカードを墓地から特殊召喚する。この効果を発動するターン、自分はモンスターを特殊召喚できない。このカードは「インヴェルズ」と名のついたモンスターのアドバンス召喚以外のためにはリリースできず、シンクロ素材にもできない。
   深緑の魔弓使い       自分フィールド上に植物族モンスターが存在する場合、このカードを攻撃する事はできない。自分フィールド上の植物族モンスター1体を生け贄に捧げる度に、フィールド上に存在する魔法・罠カード1枚を破壊する。
   蒼血鬼               このカードは召喚・反転召喚に成功した時、守備表示になる。1ターンに1度、自分フィールド上に存在するエクシーズ素材を1つ取り除く事で、自分の墓地に存在するレベル4のアンデット族モンスター1体を選択して特殊召喚する。

   Notes
   - Inverz: noAdvanceTributeS03 in its function form now receives the summoned monster's db as a 2nd argument (engine/70 tributeCandidates, S03-U414): the cell can be Tributed only for the Advance Summon of a 「インヴェルズ」 monster; cannotSynchroMaterial:true; the cell's hand Special Summon is a summonProcedure (no monsters on my field), the scout's is a Graveyard ignition (my Main Phase 1 start - u384MainStart -, no Spell / Trap Card on my field) followed by banSummonS03 special for the rest of the turn.
   - 魔弓使い: continuous cannotBeAttackTarget on itself while a Plant of mine stands; an unlimited ignition with the Release of a Plant as the cost destroying a Spell / Trap Card of the field.
   - 蒼血鬼: forced Summon / Flip Summon trigger to Defense Position; once-per-turn ignition: an Xyz Material of a monster of mine is detached (cost, detachCost) and a Level 4 Undead of the Graveyard is Special Summoned. */

/* ---- インヴェルズ ---- */
function u414Inverz(card, db){ return !!db && String(db.n||'').indexOf('インヴェルズ')>=0; }
defineScript('インヴェルズの魔細胞', {type:'monster', priority:1, noAdvanceTributeS03:(card, db)=>!u414Inverz(card, db), cannotSynchroMaterial:true, timing:['free'],
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = '自分フィールドにモンスターが存在します'; return false; } return true; }
  } });
function u414NoST(p){ return !API.fieldCards({player:p, zone:'sz'}).length && !API.fieldCards({player:p, zone:'field'}).length; }
defineUnifiedCardV4('インヴェルズの斥候', [{
  key:'scout', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!u384MainStart(ctx)){ ctx.reason = '自分のメインフェイズ1の開始時にのみ発動できます'; return false; }
    if(!u414NoST(ctx.player)){ ctx.reason = '自分フィールドに魔法・罠カードが存在します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave') return;
    if(API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'インヴェルズの斥候')) banSummonS03(ctx.player, gameState.turn, gameState.turn, ['special'], {}, 'インヴェルズの斥候');
  },
  afterResolve(){}
}], {type:'monster', priority:1, noAdvanceTributeS03:(card, db)=>!u414Inverz(card, db), cannotSynchroMaterial:true, includesSpecialSummon:true, activateFrom:['grave'], timing:['free'] });

/* ---- 深緑の魔弓使い ---- */
function u414Plants(p, except){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card!==except && x.card.face==='up' && x.db.k==='m' && x.db.ra==='植物'}); }
function u414AllST(){ return API.fieldCards({zone:'sz'}).concat(API.fieldCards({zone:'field'})); }
defineUnifiedCardV4('深緑の魔弓使い', [{
  key:'snipe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u414Plants(ctx.player).length){ ctx.reason = '自分フィールドに植物族モンスターがいません'; return false; }
    if(!u414AllST().length){ ctx.reason = 'フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('深緑の魔弓使い：生け贄に捧げる植物族モンスター', u414Plants(ctx.player), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '深緑の魔弓使い（生け贄）'); done(true);
    });
  },
  operation(ctx){
    const pool = u414AllST(); if(!pool.length) return;
    API.selectCard('深緑の魔弓使い：破壊する魔法・罠カード', pool, t=>{ const r = t && resolveTarget(t); if(r && (r.zone==='sz' || r.zone==='field')) API.destroy(r, '深緑の魔弓使い'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'],
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){
      if(target!==self || !self || self.face!=='up') return false;
      const h = locateCardAnyV4(self); return !!h && u414Plants(h.p, self).length>0;
    } } });

/* ---- 蒼血鬼 ---- */
function u414Xyz(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>Array.isArray(x.card.xyz) && x.card.xyz.length>0}); }
function u414Undead4(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット' && Number(x.db.lv)===4 && canEffectSpecialSummonS03(x.card, 'grave', '蒼血鬼')); }
function u414Summoned(ctx, flip){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || !(e.uid===ctx.card.uid || e.card===ctx.card) || ctx.card.pos==='def') return false;
  return !flip || !!e.flipSummon;
}
function u414Defend(key, ev, flip){
  return { key, type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:[ev], forced:true,
    condition(ctx){ return u414Summoned(ctx, flip); },
    operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up' && h.card.pos!=='def') act({type:'FX_SET_STATE', player:h.p, zone:h.zone, index:h.index, pos:'def', reason:'蒼血鬼'}); },
    afterResolve(){} };
}
defineUnifiedCardV4('蒼血鬼', [u414Defend('defend', 'onNormalSummon', false), u414Defend('defend-flip', 'onFlip', true), {
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u414Xyz(ctx.player).length){ ctx.reason = '取り除けるエクシーズ素材がありません'; return false; }
    if(!u414Undead4(ctx.player).length){ ctx.reason = '墓地にレベル4のアンデット族モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  detachCostS03:{count:1, reason:'蒼血鬼（コスト）', holders:ctx=>u414Xyz(ctx.player)},   /* S03-U114: the controller chooses the material (any Xyz monster of mine) */
  operation(ctx){
    const pool = u414Undead4(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('蒼血鬼：特殊召喚するレベル4のアンデット族モンスター', pool, t=>{
      const r = t && resolveTarget(t);
      if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', '蒼血鬼');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['revive']}, timing:['free'],
  passive:{ onNormalSummon(ctx){ return u414Summoned(ctx, false); }, onFlip(ctx){ return u414Summoned(ctx, true); } } });
