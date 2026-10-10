/* S03-U140: シューティング・クェーサー・ドラゴン (PARTIAL: an AUTO_DECK_TABLE "recruit ignition"; fixed Debris list x1)
   Sモンスターのチューナー＋チューナー以外のSモンスター2体以上 / このカードはS召喚でしか特殊召喚できない。（U126）
   ①:このカードは、そのS素材としたモンスターの内、チューナー以外のモンスターの数まで1度のバトルフェイズ中に攻撃できる。
   ②:1ターンに1度、魔法・罠・モンスターの効果が発動した時に発動できる。その発動を無効にし破壊する。
   ③:表側表示のこのカードがフィールドから離れた時に発動できる。EXデッキから「シューティング・スター・ドラゴン」1体を特殊召喚する。
   - ①: attackLimit from the Synchro material snapshot (v380SummonMaterials, recorded at its Synchro Summon);
   - ②: an activation response (declared in ACTIVATION_RESPONSE_S03 — answers the top chain link), countLimit on this effect only
     (in the card options: countLimit:{n:1, effects:['negate']});
   - ③: optional trigger on onLeaveField (face-up from the monster zone), wherever the card went (GY, banished, Extra Deck …). */
function quasarNonTunerMaterialsS03(card){
  const m = card && card.v380SummonMaterials;
  return Array.isArray(m) ? m.filter(x=>x && !x.tuner).length : 0;
}
function quasarLeftFaceUpS03(ctx){
  const e = ctx.event || {};
  return !!(ctx.card && e.uid!=null && e.uid===ctx.card.uid && e.fromZone==='mz' && e.fromFace==='up');
}
function quasarStarInExS03(p){ return API.pileCards(p, 'ex', x=>x.db.n==='シューティング・スター・ドラゴン'); }
defineUnifiedCardV4('シューティング・クェーサー・ドラゴン',[{
  key:'negate', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドで発動します'; return false; }
    const e = ctx.event;
    if(!e || !(e.kind==='spell' || e.kind==='trap' || e.kind==='monster')){ ctx.reason = '魔法・罠・モンスターの効果が発動した時に発動できます'; return false; }
    return true;
  },
  operation(ctx){ API.negateChainLink(ctx.event, 'activation', 'シューティング・クェーサー・ドラゴン', true); },
  afterResolve(){}
},{
  key:'star', type:EFFECT_TYPE.TRIGGER, range:LOCATION.ALL, speed:1, events:['onLeaveField'],
  condition(ctx){
    if(!quasarLeftFaceUpS03(ctx)){ ctx.reason = '表側表示のこのカードがフィールドから離れた時に発動できます'; return false; }
    if(!quasarStarInExS03(ctx.player).length){ ctx.reason = 'EXデッキに「シューティング・スター・ドラゴン」がありません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  operation(ctx){
    const t = quasarStarInExS03(ctx.player);
    if(t.length && API.me(ctx).mz.length < ZONE_LIMITS.mz) API.specialSummon(ctx.player, 'ex', t[0].index, 'atk', 'シューティング・クェーサー・ドラゴン');
  },
  afterResolve(){}
}],{type:'synchro', priority:1, quickEffect:true, countLimit:{n:1, effects:['negate']}, activateFrom:['mz','grave','banish','hand','ex','deck'], includesSpecialSummon:true,
  attackLimit(card){ return Math.max(1, quasarNonTunerMaterialsS03(card)); },
  passive:{
    onActivateSuccess(ctx){ return ctx.zone==='mz' && !!ctx.event; },
    onLeaveField(ctx){ return quasarLeftFaceUpS03(ctx); }
  }});
declareActivationResponseS03(['シューティング・クェーサー・ドラゴン']);
