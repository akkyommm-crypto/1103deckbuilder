/* S03-U323: the three 「サイバー・ダーク」 monsters of the carddata (サイバー・ダーク・エッジ / ・キール / ・ホーン).

   ①:このカードが召喚に成功した場合、自分の墓地のレベル3以下のドラゴン族モンスター1体を対象として発動する。そのドラゴン族モンスターを装備カード扱いとしてこのカードに装備する。
   ②:このカードの攻撃力は、このカードの効果で装備したモンスターの元々の攻撃力分アップする。
   ③:エッジ  このカードは直接攻撃できる。その場合、このカードの攻撃力はダメージ計算時のみ半分になる。
      キール  このカードが戦闘で相手モンスターを破壊した場合に発動する。相手に300ダメージを与える。
      ホーン  このカードが守備表示モンスターを攻撃した場合、その守備力を攻撃力が超えた分だけ戦闘ダメージを与える。
   ④:このカードが戦闘で破壊される場合、代わりにこのカードの効果で装備したモンスターを破壊する。

   Notes
   - ① is mandatory (「発動する」) and targets: a Normal Summon of the card (not a Flip Summon / Special Summon); the Dragon is equipped through API.equipFromGrave (System v31) as a monster-equip whose equipTo.sourceUid is this card.
   - ②: the sum of the printed ATK of the monsters equipped by this card itself. ④: engine/1ZZB equipHostSubstituteS03:'battle' — mandatory; the equipped monster of this card is destroyed (sent to its owner's Graveyard) and this card stays.
   - エッジ③: the ATK halving is the new final-layer factor mulFinalAtk of curStat (S03-U323), applied only in the Damage Step's calculation while this card attacks directly.
   - キール③: forced trigger after the battle kill (the Damage Step 'after' window). ホーン③: piercingDamage as ヴァイロン・コンポーネント / コアキメイル・ヴァラファール. */

function u323Own(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u323Equipped(card){
  return equipsOnV15(card, gameState).filter(x=>x.card.v46MonsterEquip===true && x.card.equipTo && x.card.equipTo.sourceUid===card.uid);
}
function u323EquipBonus(card){
  return u323Equipped(card).reduce((n,x)=>n+(Number(dbOf(x.card).atk)||0), 0);
}
function u323GravePool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='ドラゴン' && (x.db.lv||99)<=3); }
function u323Summoned(ctx){ return u323Own(ctx) && !!ctx.event && ctx.event.card===ctx.card; }
function u323EquipEffect(label){
  return { key:'summon-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true, targetRange:LOCATION.GRAVE, targetSide:'self',
    condition(ctx){ return u323Summoned(ctx) && u323GravePool(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
    target(ctx, done){ API.selectCard(label+'：装備する墓地のドラゴン族（レベル3以下）', u323GravePool(ctx), t=>done([t])); },
    operation(ctx){
      const host = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && ctx.selectedTargets[0], eq = t && resolveTarget(t);
      if(!host || host.zone!=='mz' || host.card.face!=='up' || !eq || eq.zone!=='grave' || eq.p!==ctx.player) return;
      API.equipFromGrave(ctx.player, eq, host, label, ctx.card.uid, ctx.chainId);
    },
    afterResolve(){} };
}
function u323Meta(extra){
  return Object.assign({type:'monster', priority:1, forced:true, targets:true, timing:['free'], equipHostSubstituteS03:'battle',
    passive:{ onNormalSummon(ctx){ return u323Summoned(ctx) && u323GravePool(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; } },
    continuous:{ scope:'self', from:['mz'], apply(card, self){ return (card===self && self.face==='up') ? (u323EquipBonus(self) ? {atk:u323EquipBonus(self)} : null) : null; } }
  }, extra||{});
}
function u323Killed(ctx){
  const b = ctx.battle || {};
  if(b.atkCard===ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard===ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}

/* ---- エッジ ---- */
defineUnifiedCardV4('サイバー・ダーク・エッジ', [u323EquipEffect('サイバー・ダーク・エッジ')], u323Meta({
  canDirectAttack(card, loc){ return !!card && card.face==='up' && !!loc && loc.zone==='mz' && !(typeof effectNegated==='function' && effectNegated(card)); },
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self || self.face!=='up') return null;
      const r = {};
      const bonus = u323EquipBonus(self); if(bonus) r.atk = bonus;
      const b = gameState.battle;
      if(b && b.step==='calc' && b.target==='direct' && a5IsAttackerCard(self)) r.mulFinalAtk = 0.5;
      return (r.atk || r.mulFinalAtk) ? r : null;
    } }
}));

/* ---- キール ---- */
defineUnifiedCardV4('サイバー・ダーク・キール', [u323EquipEffect('サイバー・ダーク・キール'), {
  key:'kill-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u323Own(ctx) && !!u323Killed(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 300, 'サイバー・ダーク・キール'); },
  afterResolve(){}
}], u323Meta({dsTiming:'after',
  passive:{ onNormalSummon(ctx){ return u323Summoned(ctx) && u323GravePool(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
            onDamageStep(ctx){ return u323Own(ctx) && !!u323Killed(ctx); } }}));

/* ---- ホーン ---- */
defineUnifiedCardV4('サイバー・ダーク・ホーン', [u323EquipEffect('サイバー・ダーク・ホーン')], u323Meta({
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){ return (card===self && self.face==='up' && u323EquipBonus(self)) ? {atk:u323EquipBonus(self)} : null; },
    piercingDamage(info){
      const self = info.self;
      if(!self || self.face!=='up' || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0, curATK(self) - curDEF(info.defCard));
    } }
}));
