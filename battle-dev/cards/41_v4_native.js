/* =========================================================================
   System v4.0 — Native Unified Effect cards
   -------------------------------------------------------------------------
   These cards are authored against the v4 Effect object API instead of the
   legacy condition/selectTargets/resolve object shape.  They intentionally
   exercise setcode, LOCATION, RESET and the activation timeline:
     condition -> cost -> target -> operation.
   ========================================================================= */

function v4nFaceUpSet(p, code, zone){
  return API.fieldCards({
    player:p,
    zone:zone||'mz',
    filter:x=>x.card && x.card.face==='up' && isSetCardV4(x.db,code)
  });
}
function v4nSelectExactly(title,cands,n,done){
  const pool=[].concat(cands||[]), picked=[];
  function next(){
    if(picked.length>=n){ done(picked); return; }
    const left=pool.filter(x=>!picked.some(y=>y.card===x.card));
    if(left.length < (n-picked.length)){ done([]); return; }
    API.selectCard(`${title}（${picked.length+1}/${n}）`,left,t=>{picked.push(t);next();});
  }
  next();
}
function v4nSpecialSummonFromEitherGrave(p,t,reason){
  const r=resolveTarget(t); if(!r||r.zone!=='grave') return false;
  if(r.p!==p) API.changeControl(r,p,reason||'墓地から特殊召喚');
  const h=resolveTarget({card:t.card});
  if(!h||h.p!==p||h.zone!=='grave') return false;
  API.specialSummon(p,'grave',h.index,'atk',reason||'墓地から特殊召喚');
  return true;
}

/* ---- 黄金の歯車装置箱 ----
   Target 1 face-up Karakuri; ATK +500 / DEF +1500 until End Phase.
   The modifier is owned by the target's current field stay, not by the Quick-
   Play Spell after it goes to GY, so RESET_LEAVE watches the target only. */
defineUnifiedCardV4('黄金の歯車装置箱', [{
  key:'boost',
  type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.HAND|LOCATION.SZONE,
  targetRange:LOCATION.MZONE,
  targetSide:'both',
  speed:2,
  events:['activate'],
  condition(ctx){
    const c=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.KARAKURI)});
    if(!c.length){ctx.reason='表側表示の「カラクリ」モンスターがいません';return false;}
    return true;
  },
  target(ctx,done){
    const c=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&isSetCardV4(x.db,SETCODE.KARAKURI)});
    API.selectCard('黄金の歯車装置箱：対象のカラクリ',c,t=>done([t]));
  },
  operation(ctx){
    const t=ctx.selectedTargets[0]; if(!resolveTarget(t)) return;
    v4RegisterStatModifier(t,{atk:500,def:1500},{
      code:'黄金の歯車装置箱',
      resetMask:RESET.END|RESET.LEAVE
    });
  }
}],{type:'spell',priority:2,quickEffect:true,targets:true});

/* ---- 六武衆の理 ----
   Cost is paid before target selection. Therefore the Six Samurai sent as the
   cost is already in GY and can legally become the target of the same card. */
defineUnifiedCardV4('六武衆の理', [{
  key:'revive',
  type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.HAND|LOCATION.SZONE,
  targetRange:LOCATION.GRAVE,
  targetSide:'both',
  speed:2,
  events:['activate'],
  condition(ctx){
    if(gameState.players[ctx.player].temporaryFlags&&gameState.players[ctx.player].temporaryFlags.noSpecialSummon){ctx.reason='このターンは特殊召喚できません';return false;}
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    const cost=v4nFaceUpSet(ctx.player,SETCODE.SIX_SAMURAI,'mz');
    if(!cost.length){ctx.reason='墓地へ送る表側表示の「六武衆」がいません';return false;}
    return true;
  },
  cost(ctx,done){
    const c=v4nFaceUpSet(ctx.player,SETCODE.SIX_SAMURAI,'mz');
    API.selectCard('六武衆の理：墓地へ送る六武衆（コスト）',c,t=>{
      const r=resolveTarget(t); if(!r){done(false);return;}
      API.sendToGrave(r,'六武衆の理（コスト）');
      done(true);
    });
  },
  target(ctx,done){
    const c=[0,1].flatMap(p=>API.pileCards(p,'grave',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.SIX_SAMURAI)));
    if(!c.length){done([]);return;}
    API.selectCard('六武衆の理：特殊召喚する六武衆',c,t=>done([t]));
  },
  operation(ctx){
    const t=ctx.selectedTargets[0];
    if(!t||!resolveTarget(t)) return;
    v4nSpecialSummonFromEitherGrave(ctx.player,t,'六武衆の理');
  }
}],{type:'spell',priority:2,quickEffect:true,targets:true,blocksIfNoSpecialSummon:true,includesSpecialSummon:true});

/* ---- XX－セイバー レイジグラ ---- */
defineUnifiedCardV4('XX－セイバー レイジグラ', [{
  key:'recover',
  type:EFFECT_TYPE.TRIGGER,
  range:LOCATION.MZONE,
  targetRange:LOCATION.GRAVE,
  targetSide:'self',
  speed:1,
  events:['onNormalSummon','onSpecialSummon'],
  condition(ctx){
    if(ctx.zone!=='mz'){ctx.reason='召喚・特殊召喚成功時に発動します';return false;}
    const c=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.X_SABER));
    if(!c.length){ctx.reason='墓地に「X－セイバー」モンスターがいません';return false;}
    return true;
  },
  target(ctx,done){
    const c=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&isSetCardV4(x.db,SETCODE.X_SABER));
    API.selectCard('XX－セイバー レイジグラ：手札に戻すX－セイバー',c,t=>done([t]));
  },
  operation(ctx){
    const t=ctx.selectedTargets[0]; if(resolveTarget(t)) API.returnToHand(t,'XX－セイバー レイジグラ');
  }
}],{
  type:'monster',priority:1,targets:true,
  passive:{
    onNormalSummon(ctx){return ctx.zone==='mz';},
    onSpecialSummon(ctx){return ctx.zone==='mz';}
  }
});

/* ---- セイバー・スラッシュ ----
   At activation, lock exactly N face-up cards, where N is the number of the
   controller's face-up Attack Position X-Saber monsters. */
defineUnifiedCardV4('セイバー・スラッシュ', [{
  key:'slash',
  type:EFFECT_TYPE.ACTIVATE,
  range:LOCATION.HAND|LOCATION.SZONE,
  targetRange:LOCATION.ONFIELD,
  targetSide:'both',
  speed:1,
  events:['activate'],
  condition(ctx){
    const n=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&isSetCardV4(x.db,SETCODE.X_SABER)}).length;
    if(n<1){ctx.reason='自分フィールドに表側攻撃表示の「X－セイバー」がいません';return false;}
    const face=API.fieldCards({filter:x=>x.card.face==='up'});
    if(face.length<n){ctx.reason='選択できる表側表示カードが足りません';return false;}
    return true;
  },
  target(ctx,done){
    const n=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&isSetCardV4(x.db,SETCODE.X_SABER)}).length;
    v4nSelectExactly('セイバー・スラッシュ：破壊する表側表示カード',API.fieldCards({filter:x=>x.card.face==='up'}),n,done);
  },
  operation(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{if(resolveTarget(t))API.destroy(t,'セイバー・スラッシュ');});
  }
}],{type:'spell',priority:1,targets:true});
