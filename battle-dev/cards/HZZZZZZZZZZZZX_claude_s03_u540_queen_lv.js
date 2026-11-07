/* S03-U540: 《魅惑の女王 LV3》《LV5》《LV7》（1103対象の未実装カード。carddata のテキスト）。
   S03-U539 の「相手モンスター1体を装備カード扱いで自分に装備し、戦闘破壊の身代わりにする」と、
   S03-U251/U255 の LV 連鎖の共通処理に乗せる単位。同じ仕組みの 3 枚をまとめて実装する。
   エンジンへの追加は無い。

   魅惑の女王 LV3（効果モンスター・星3・天使・光・攻500/守500）
     1ターンに1度だけ自分のメインフェイズ時に相手フィールド上のレベル3以下のモンスター1体を選択し、
     装備カード扱いとしてこのカードに装備する事ができる(この効果で装備できる装備カードは1枚まで)。
     このカードが戦闘によって破壊される場合、代わりに装備したモンスターを破壊する。
     自分ターンのスタンバイフェイズ時、この効果で装備カードを装備したこのカードを墓地に送る事で、
     「魅惑の女王 LV5」1体を手札またはデッキから特殊召喚する。
   魅惑の女王 LV5（星5・1000/1000）: 「魅惑の女王 LV3」の効果で特殊召喚した場合、レベル5以下を同様に装備。
     スタンバイフェイズに「魅惑の女王 LV7」へ。
   魅惑の女王 LV7（星7・1500/1500）: 「魅惑の女王 LV5」の効果で特殊召喚した場合、レベル制限なしで同様に装備。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-0B91280F9E07 レベル4以上の裏側表示モンスターは装備できない。装備できるのは
       「レベル3以下と判別できる**表側表示**モンスターのみ」→ 候補は相手フィールドの表側表示で、
       今のレベルが上限以下のものだけにする（S03-U539 のサクリファイスと違い裏側は選べない）。
     WIKI-BB36264715CC 《魅惑の女王 LV5》の効果で特殊召喚したこのカードを《月の書》で裏側守備表示にした
       場合、リバース（反転召喚）した後は吸収効果が使えなくなる
       → 「LV5 の効果で特殊召喚した」記録（summonSrcS03、S03-U238/U255）に加えて、
         反転召喚の記録（flipSummonedTurnS03、S03-U260）があれば発動できない。
     WIKI-7AF9516DB3A7（10/08/29）/ WIKI-CC23DF26FBE0 装備カード扱いになったモンスターは
       モンスターカードではない（《トロイボム》は発動できず、《洗脳解除》でもコントロールは戻らない）
       → 既存の装備カード扱い（v46MonsterEquip）のまま。

   LV7 のテキストにはレベルの制限が無いので裏側表示のモンスターも選べるはずだが、engine は
   カードがゾーンを移ると表側にする（S03-U528/U539 と同じ既知の限界）ため、この単位では
   3 枚とも表側表示のモンスターに限定している。LV7 についての当時裁定は見つからない（未確定）。 */

/* 装備できる相手モンスター（WIKI-0B91280F9E07: 表側表示で、レベルが上限以下と判別できるもの） */
function u540PoolS03(ctx, lvMax){
  return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face === 'up'
    && (lvMax == null || (Number(typeof curLV === 'function' ? curLV(x.card) : x.db.lv) || 99) <= lvMax)});
}
/* S03-U539 の共通処理: このカードの効果で装備したモンスター（equipTo.sourceUid が自身） */
function u540EquippedS03(card, p){ return u539EquippedS03(card, p); }
/* 「LV5 の効果で特殊召喚した場合」の状態（反転召喚すると失われる） */
function u540FromS03(card, from){
  if(from == null) return true;
  if(!lvSummonedByS03(card, from)) return false;
  return card.flipSummonedTurnS03 == null;   /* WIKI-BB36264715CC */
}
function u540EquipEffectS03(name, lvMax, from){
  return {
    key:'absorb', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    targetRange:LOCATION.MZONE, targetSide:'opponent',
    condition(ctx){
      if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
      if(ctx.player !== gameState.activePlayer || !(gameState.phase === 'main1' || gameState.phase === 'main2')){
        ctx.reason = '自分のメインフェイズに発動できます'; return false;
      }
      if(!u540FromS03(ctx.card, from)){ ctx.reason = `「${from}」の効果で特殊召喚した場合に使えます`; return false; }
      if(Number(ctx.card.u540AbsorbTurnS03) === Number(gameState.turn)){ ctx.reason = 'この効果はこのターン使用しています'; return false; }
      if(u540EquippedS03(ctx.card, ctx.player).length){ ctx.reason = 'この効果で装備できる装備カードは1枚までです'; return false; }
      if((API.me(ctx).sz || []).length >= ZONE_LIMITS.sz){ ctx.reason = '魔法＆罠ゾーンが一杯です'; return false; }
      if(!u540PoolS03(ctx, lvMax).length){
        ctx.reason = lvMax == null ? '相手フィールドに表側表示のモンスターがいません'
                                   : `相手フィールドにレベル${lvMax}以下の表側表示モンスターがいません`;
        return false;
      }
      return true;
    },
    target(ctx, done){
      API.selectCard(name + '：装備する相手モンスター', u540PoolS03(ctx, lvMax), t=>done([t]));
    },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      API.setCardFlag(me, 'u540AbsorbTurnS03', gameState.turn, name + '（1ターンに1度）', {silent:true});
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(!r || r.zone !== 'mz' || r.card.face !== 'up' || r.card.uid == null) return;
      if(u540EquippedS03(ctx.card, ctx.player).length) return;        /* 1枚まで */
      const foe = findCardByUid(r.card.uid);
      if(!foe || foe.zone !== 'mz') return;
      API.equipMonster(ctx.player, foe, me, name, {sourceUidS03:ctx.card.uid});
    },
    afterResolve(){}
  };
}
/* 自分ターンのスタンバイフェイズ時、この効果で装備したこのカードを墓地に送って次の LV を特殊召喚する */
function u540LvUpArmedS03(ctx, from){
  const me = lvFaceUpMzS03(ctx);
  if(!me || gameState.phase !== 'standby' || gameState.activePlayer !== me.p) return false;
  if(!u540FromS03(me.card, from)) return false;
  return u540EquippedS03(me.card, me.p).length > 0;
}
function u540DefineS03(name, lvMax, from, next){
  const effects = [u540EquipEffectS03(name, lvMax, from)];
  if(next) effects.push({
    key:'lv-up', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    condition(ctx){
      if(!u540LvUpArmedS03(ctx, from)){ ctx.reason = 'この効果で装備カードを装備している自分のスタンバイフェイズに発動します'; return false; }
      if(!lvUpTargetsS03(ctx.player, next).length){ ctx.reason = `「${next}」が手札・デッキにいません`; return false; }
      return true;
    },
    cost(ctx, done){ lvUpCostS03(ctx, done, name); },
    operation(ctx){ lvUpResolveS03(ctx, next, name); },
    afterResolve(){}
  });
  return defineUnifiedCardV4(name, effects, {
    type:'monster', priority:1, targets:true, timing:['free'],
    /* 戦闘によって破壊される場合、代わりに装備したモンスターを破壊する（engine/1ZZB、S03-U323/U539 と同じ） */
    equipHostSubstituteS03:'battle',
    passive:next ? {onStandbyPhase(ctx){ return u540LvUpArmedS03(ctx, from) && lvUpTargetsS03(ctx.player, next).length > 0; }} : {}
  });
}

u540DefineS03('魅惑の女王 LV3', 3, null, '魅惑の女王 LV5');
u540DefineS03('魅惑の女王 LV5', 5, '魅惑の女王 LV3', '魅惑の女王 LV7');
u540DefineS03('魅惑の女王 LV7', null, '魅惑の女王 LV5', null);
