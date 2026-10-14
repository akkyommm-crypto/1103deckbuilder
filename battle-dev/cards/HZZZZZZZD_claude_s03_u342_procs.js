/* S03-U342: six monsters with a Special Summon condition (carddata texts).

   ゲート・ガーディアン   通常召喚できない。自分フィールドの「雷魔神－サンガ」「風魔神－ヒューガ」「水魔神－スーガ」をそれぞれ1体ずつリリースした場合に特殊召喚できる。
   カード・ブレイカー     通常召喚できない。自分の魔法&罠カードゾーンのカード1枚を墓地へ送った場合に表側攻撃表示で特殊召喚できる。
   ギガストーン・オメガ   通常召喚できない。自分の墓地の地属性モンスター2体をゲームから除外した場合に特殊召喚できる。自分フィールドに表側表示で存在するこのカードがカードの効果によって墓地へ送られた時、相手フィールドの魔法・罠カードを全て破壊する。
   ジャイアントワーム     通常召喚できない。自分の墓地の昆虫族モンスター1体をゲームから除外した場合のみ特殊召喚できる。相手ライフに戦闘ダメージを与えた時、相手のデッキの上からカードを1枚墓地へ送る。
   カゲトカゲ             通常召喚できない。自分がレベル4モンスターの召喚に成功した時、手札から特殊召喚できる。シンクロ素材にできない。
   シンクロ・マグネーター 通常召喚できない。自分がシンクロモンスターのシンクロ召喚に成功した時、手札から特殊召喚できる。

   Notes
   - The first four are hand Special Summon procedures (summonProcedure): the cost releases / sends / banishes the named cards (a banish from the Graveyard is refused while ネクロバレー applies: graveMoveBlocked). カード・ブレイカー comes out face-up Attack only.
   - ギガストーン・オメガ: a Graveyard trigger on onFieldToGraveBatchS03 for this card sent from a Monster Zone face-up by a card effect (not by battle, not released, not as Synchro material).
   - カゲトカゲ / シンクロ・マグネーター: optional hand triggers in the pattern of サイバー・ダイナソー; カゲトカゲ declares cannotSynchroMaterial. */

function u342Bad(){ return typeof graveMoveBlocked==='function' && graveMoveBlocked('grave','banish'); }
/* pick n cards one by one from pool(ctx) and apply act(handle) to each; done(false) when the pool runs short */
function u342PickN(label, ctx, poolFn, n, apply, done){
  const chosen = [];
  const step = ()=>{
    if(chosen.length>=n){ chosen.forEach(u=>{ const h = findCardByUid(u); if(h) apply(h); }); done(true); return; }
    const pool = poolFn(ctx).filter(x=>chosen.indexOf(x.card.uid)<0);
    if(!pool.length){ done(false); return; }
    API.selectCard(label+'（'+(chosen.length+1)+'/'+n+'）', pool, t=>{
      const r = t && resolveTarget(t); if(!r){ done(false); return; }
      chosen.push(r.card.uid!=null ? r.card.uid : ensureCardUid(gameState, r.card)); step();
    });
  };
  step();
}

/* ---- ゲート・ガーディアン ---- */
const U342_GATE = ['雷魔神－サンガ','風魔神－ヒューガ','水魔神－スーガ'];
function u342GateField(ctx, name){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===name}); }
defineScript('ゲート・ガーディアン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      const miss = U342_GATE.filter(n=>!u342GateField(ctx, n).length);
      if(miss.length){ ctx.reason = '「'+miss[0]+'」が自分フィールドにいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const uids = U342_GATE.map(n=>{ const l = u342GateField(ctx, n); return l.length ? l[0].card.uid : null; });
      if(uids.some(u=>u==null)){ done(false); return; }
      uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, 'ゲート・ガーディアン（リリース）'); });
      done(true);
    }
  }
});

/* ---- カード・ブレイカー ---- */
function u342MyST(ctx){ return API.fieldCards({player:ctx.player, zone:'sz'}); }
defineScript('カード・ブレイカー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  summonProcedure:{
    from:['hand'], positions:['atk'],
    condition(ctx){ if(!u342MyST(ctx).length){ ctx.reason = '自分の魔法&罠カードゾーンにカードがありません'; return false; } return true; },
    cost(ctx, done){
      API.selectCard('カード・ブレイカー：墓地へ送る魔法・罠ゾーンのカード', u342MyST(ctx), t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='sz'){ done(false); return; }
        API.sendToGrave(r, 'カード・ブレイカー（特殊召喚の手順）'); done(true);
      });
    }
  }
});

/* ---- ギガストーン・オメガ ---- */
function u342Earth(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='地'); }
function u342EffectSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && ctx.eventName==='onFieldToGraveBatchS03' && Array.isArray(e.items) && !!ctx.card && e.items.some(x=>x && x.uid===ctx.card.uid)
    && !!g && g.from==='mz' && g.face==='up' && !g.battle && !g.releasedS03 && g.reason!=='synchroMaterial' && Number(g.turn)===Number(gameState.turn);
}
function u342FoeST(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>x.zone==='sz' || x.zone==='field'}); }
defineUnifiedCardV4('ギガストーン・オメガ', [{
  key:'effect-sent-wipe', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onFieldToGraveBatchS03'], forced:true,
  condition(ctx){ return u342EffectSent(ctx) && u342FoeST(ctx).length>0; },
  operation(ctx){ u342FoeST(ctx).slice().forEach(h=>{ const r = resolveTarget(h); if(r && ['sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'ギガストーン・オメガ'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, timing:['free'], activateFrom:['grave'],
  passive:{ onFieldToGraveBatchS03(ctx){ return u342EffectSent(ctx) && u342FoeST(ctx).length>0; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(u342Earth(ctx).length<2){ ctx.reason = '墓地に地属性モンスターが2体必要です'; return false; }
      return true;
    },
    cost(ctx, done){ u342PickN('ギガストーン・オメガ：除外する墓地の地属性モンスター', ctx, u342Earth, 2, h=>API.banish(h, 'ギガストーン・オメガ（特殊召喚の手順）'), done); }
  }});

/* ---- ジャイアントワーム ---- */
function u342Insect(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='昆虫'); }
function u342WormHit(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && e.attackerUid!=null && e.attackerUid===ctx.card.uid && e.player===ctx.opponent && Number(e.amount)>0 && API.pileCards(ctx.opponent,'deck').length>0; }
defineUnifiedCardV4('ジャイアントワーム', [{
  key:'hit-mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return u342WormHit(ctx); },
  operation(ctx){ API.millTop(ctx.opponent, 1, 'ジャイアントワーム'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, timing:['free'], passive:{ onBattleDamage(ctx){ return u342WormHit(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(!u342Insect(ctx).length){ ctx.reason = '墓地に昆虫族モンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){ u342PickN('ジャイアントワーム：除外する墓地の昆虫族モンスター', ctx, u342Insect, 1, h=>API.banish(h, 'ジャイアントワーム（特殊召喚の手順）'), done); }
  }});

/* ---- カゲトカゲ / シンクロ・マグネーター ---- */
function u342SummonedLv4(ctx){
  const e = ctx.event || {}, c = e.card, h = c ? locateCardAnyV4(c) : null;
  return ctx.zone==='hand' && !!h && h.zone==='mz' && h.p===ctx.player && c!==ctx.card && Number(dbOf(c).lv)===4 && hasMonsterZoneSpace(ctx.player);
}
function u342SynchroSummoned(ctx){
  const e = ctx.event || {}, c = e.card, h = c ? locateCardAnyV4(c) : null;
  return ctx.zone==='hand' && !!h && h.zone==='mz' && h.p===ctx.player && c!==ctx.card && c.specialSummonKind==='synchro' && hasMonsterZoneSpace(ctx.player);
}
function u342HandSS(name, evt, cond, meta){
  return defineUnifiedCardV4(name, [{
    key:'hand-summon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:[evt],
    condition(ctx){ return cond(ctx); },
    operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='hand' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', h.index, 'atk', name); },
    afterResolve(){}
  }], Object.assign({type:'monster', priority:1, activateFrom:['hand'], includesSpecialSummon:true, blocksIfNoSpecialSummon:true, onOtherSummon:true, cannotNormalSummon:true,
    passive:{ [evt](ctx){ return ctx.zone==='hand'; } }}, meta||{}));
}
u342HandSS('カゲトカゲ', 'onNormalSummon', u342SummonedLv4, {cannotSynchroMaterial:true});
u342HandSS('シンクロ・マグネーター', 'onSpecialSummon', u342SynchroSummoned);
