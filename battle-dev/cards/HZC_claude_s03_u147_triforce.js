/* S03-U147: A・ジェネクス・トライフォース (NOT_STARTED; the last card on the attack-time lock, engine/1ZO)
   「ジェネクス」と名のついたチューナー＋チューナー以外のモンスター1体以上
   このカードのシンクロ素材としたチューナー以外のモンスターの属性によって、このカードは以下の効果を得る。
   ●地属性:このカードが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動できない。
   ●炎属性:このカードが戦闘によってモンスターを破壊した場合、そのモンスターの元々の攻撃力分のダメージを相手ライフに与える。
   ●光属性:1ターンに1度、自分の墓地の光属性モンスター1体を選択して、裏側守備表示で特殊召喚できる。
   - The attributes come from v380SummonMaterials[].at, recorded at the Synchro Summon since U147 (engine/00; the attribute the
     material had when it was used, like its level). A snapshot written before U147 has no `at`: the material's printed attribute is
     used then. Any one non-Tuner material of that attribute gives the effect; several attributes give several effects.
   - 炎: a forced trigger when it destroys a monster by battle (after the destroyed monster is sent to the GY); the damage is that
     monster's printed ("元々の") ATK.
   - 光: an ignition effect, once per turn, targeting 1 LIGHT monster in its controller's GY that this effect can Special Summon. */
function triforceAttrsS03(card){
  const mats = (card && Array.isArray(card.v380SummonMaterials)) ? card.v380SummonMaterials : [];
  return mats.filter(m=>m && !m.tuner).map(m=>{
    if(m.at) return m.at;
    const d = CARD_DB.find(x=>x && x.n===m.name);
    return d ? d.at : null;
  }).filter(Boolean);
}
function triforceHasS03(card, attr){ return triforceAttrsS03(card).indexOf(attr) >= 0; }
declareAttackLockS03('A・ジェネクス・トライフォース', { active(card){ return triforceHasS03(card, '地'); } });
function triforceKilledS03(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.step!=='leave' || !ctx.card || ctx.card.face!=='up') return null;
  if(b.atkCard===ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard===ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
function triforceLightPoolS03(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='光' && canEffectSpecialSummonS03(x.card, 'grave', 'A・ジェネクス・トライフォース'));
}
defineUnifiedCardV4('A・ジェネクス・トライフォース',[{
  key:'fire', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return triforceHasS03(ctx.card, '炎') && !!triforceKilledS03(ctx); },
  operation(ctx){
    const foe = triforceKilledS03(ctx);
    const n = foe ? Math.max(0, Number(dbOf(foe).atk)||0) : 0;
    if(n) API.damageLP(ctx.opponent, n);
  },
  afterResolve(){}
},{
  key:'light', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!triforceHasS03(ctx.card, '光')){ ctx.reason = '光属性モンスターをシンクロ素材としていません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!triforceLightPoolS03(ctx).length){ ctx.reason = '墓地に特殊召喚できる光属性モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('A・ジェネクス・トライフォース：裏側守備表示で特殊召喚する光属性モンスター', triforceLightPoolS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.p!==ctx.player || r.zone!=='grave' || dbOf(r.card).at!=='光') return;
    API.specialSummon(ctx.player, 'grave', r.index, 'def', 'A・ジェネクス・トライフォース', null, {faceDown:true});
  },
  afterResolve(){}
}],{type:'synchro', priority:1, targets:true, dsTiming:'leave', timing:['mainPhase'], includesSpecialSummon:true,
  countLimit:{n:1, effects:['light']},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } },
  passive:{ onDamageStep(ctx){ return triforceHasS03(ctx.card, '炎') && !!triforceKilledS03(ctx); } }});
