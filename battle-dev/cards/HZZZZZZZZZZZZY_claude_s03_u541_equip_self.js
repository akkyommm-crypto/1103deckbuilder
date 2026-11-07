/* S03-U541: 《シー・アーチャー》《The アトモスフィア》《地底のアラクネー》（1103対象の未実装カード。carddata のテキスト）。
   「モンスター1体を装備カード扱いとして自分に装備する」同じ仕組みの 3 枚をまとめて実装する。
   S03-U539/U540 の装備（sourceUidS03 の記録）と、S03-U173/U513 の任意の身代わり、S03-U144 の攻撃時の
   魔法・罠ロック、S03-U342 の特殊召喚手順に乗せる。エンジンへの追加は、任意の身代わりを**ホスト側**が
   申告できるようにした 1 点だけ（engine/1ZV の `equipHostSubstituteOptionalS03`。2 枚が使う）。

   シー・アーチャー（効果モンスター・星3・水・水・攻1200/守200）
     1ターンに1度、自分フィールド上のレベル3以下のモンスター1体を選択し、装備カード扱いとして
     このカードに1体のみ装備できる。
     この効果でモンスターを装備している場合、このカードの攻撃力は800ポイントアップする。
     また、フィールド上のこのカードが破壊される場合、代わりにこのカードの効果で装備したモンスターを破壊できる。

   The アトモスフィア（効果モンスター・星8・天使・光・攻1000/守800）
     このカードは通常召喚できない。
     自分フィールド上に存在するモンスター2体と自分の墓地に存在するモンスター1体をゲームから除外した場合に
     特殊召喚する事ができる。
     1ターンに1度、相手フィールド上に表側表示で存在するモンスターを装備カード扱いとしてこのカードに
     1体のみ装備する事ができる。
     このカードの攻撃力・守備力は、このカードの効果で装備したモンスターのそれぞれの数値分アップする。

   地底のアラクネー（シンクロ・効果モンスター・星6・昆虫・闇・攻2400/守1200）
     闇属性チューナー＋チューナー以外の昆虫族モンスター1体
     このカードが攻撃する場合、相手はダメージステップ終了時まで魔法・罠カードを発動する事ができない。
     1ターンに1度、相手フィールド上に表側表示で存在するモンスターを装備カード扱いとしてこのカードに
     1体のみ装備する事ができる。
     このカードが戦闘によって破壊される場合、代わりにこの効果で装備したモンスターを破壊する事ができる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-4C96ECDF55A6（09/10/27）シー・アーチャー: 装備するのは**起動効果**、自己強化と破壊代替は**永続効果**。
     WIKI-E678659CBF07（10/09/16）シー・アーチャー: このカードと装備したモンスターが他のカードの効果で
       **同時に破壊される場合は身代わりを使えない** → engine/1ZV の同時破壊の除外（excl）に乗る。
     WIKI-1577B0FF0555（09/09/26）身代わりで装備モンスターを破壊した場合、そのカードの「墓地へ送られた時」の
       効果は発動できる → 身代わりは破壊として墓地へ送る既存処理のまま。
     WIKI-674BE27C5926（09/09/26）チェーン2以降に発動した効果での破壊で身代わりにした場合は、
       そのカードの誘発効果はタイミングを逃す → 既存のチェーン処理のまま（未測定）。
     WIKI-124DEEBEADD2（09/09/26）装備カード扱いのモンスターは、別のカード名として扱う効果を適用しない。
     WIKI-0E0AAE2B8206（10/06/19）装備したモンスターが場を離れる時の各カードの効果はそのまま働く。
     WIKI-524DDFFDE4D5（09/12/28）アトモスフィア: 特殊召喚は**召喚ルール効果**、装備は**起動効果**、
       攻撃力上昇は**永続効果**。
     WIKI-8A1338EE7506（09/12/28）正規の手順で特殊召喚した後は墓地からでも特殊召喚できる
       → 「通常召喚できない」カードの蘇生制限（engine/1ZK の properlySummonedS03）に乗る。
     WIKI-7FAD37B22612（09/12/28）モンスタートークンを除外して特殊召喚できる → 素材にトークンを含める。
     WIKI-08C61FF2CB13（09/12/28）上昇するのは**カードに記載された（元々の）攻撃力**分。
     WIKI-8F834E1A7A8D（09/08/26）アラクネー: 魔法・罠の妨害は**永続効果**、装備は**起動効果**、
       身代わりは**永続効果**。
     WIKI-9E07F8028E49（09/08/26）アラクネーの装備は**対象を取る**。
     WIKI-CFB024C0A1AF（09/08/26）解決時にこのカードが表側表示で存在しない場合、選択された相手モンスターは
       装備できず**墓地へ送られる**。
     WIKI-4F18E5430766（09/08/29）既にこの効果で装備している場合、更に装備する効果は発動できない。
     《シー・アーチャー》の「レベル3以下」は裏側表示では判別できないため、《魅惑の女王 LV3》の
     WIKI-0B91280F9E07 と同じ扱いで表側表示に限定した（この 1 枚についての当時裁定は無いので未確定）。 */

/* 装備した（この効果の）モンスター: S03-U539 の共通処理 */
function u541EquippedS03(card, p){ return u539EquippedS03(card, p); }
/* 元々の数値の合計（WIKI-08C61FF2CB13） */
function u541PrintedStatsS03(card, p){
  const list = u541EquippedS03(card, p);
  let a = 0, d = 0;
  list.forEach(c=>{ const x = dbOf(c) || {}; a += Number(x.atk) || 0; d += Number(x.def) || 0; });
  return (a || d) ? {atk:a, def:d} : null;
}
function u541MainPhaseS03(ctx){
  return ctx.player === gameState.activePlayer && (gameState.phase === 'main1' || gameState.phase === 'main2');
}
/* 共通の発動条件（1ターンに1度・1体のみ・魔法＆罠ゾーンの空き・候補の有無） */
function u541CanEquipS03(ctx, pool){
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
  if(!u541MainPhaseS03(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
  if(Number(ctx.card.u541EquipTurnS03) === Number(gameState.turn)){ ctx.reason = 'この効果はこのターン使用しています'; return false; }
  /* WIKI-4F18E5430766: 既にこの効果で装備している場合は発動できない（1体のみ） */
  if(u541EquippedS03(ctx.card, ctx.player).length){ ctx.reason = 'この効果では1体しか装備できません'; return false; }
  if((API.me(ctx).sz || []).length >= ZONE_LIMITS.sz){ ctx.reason = '魔法＆罠ゾーンが一杯です'; return false; }
  if(!pool(ctx).length){ ctx.reason = '装備できるモンスターがいません'; return false; }
  return true;
}
function u541DoEquipS03(ctx, name, handle){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(!handle || handle.zone !== 'mz' || handle.card.uid == null) return false;
  if(u541EquippedS03(ctx.card, ctx.player).length) return false;
  API.equipMonster(ctx.player, handle, me, name, {sourceUidS03:ctx.card.uid});
  return true;
}

/* ---- シー・アーチャー ---- */
function u541ArcherPoolS03(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card !== ctx.card && x.card.face === 'up'
    && (Number(typeof curLV === 'function' ? curLV(x.card) : x.db.lv) || 99) <= 3});
}
defineUnifiedCardV4('シー・アーチャー', [{
  key:'equip-own', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){ return u541CanEquipS03(ctx, u541ArcherPoolS03); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.setCardFlag(me, 'u541EquipTurnS03', gameState.turn, 'シー・アーチャー（1ターンに1度）', {silent:true});
    const pool = u541ArcherPoolS03(ctx);
    if(!pool.length) return;
    API.selectCard('シー・アーチャー：装備する自分のレベル3以下のモンスター', pool, t=>{
      const r = t && resolveTarget(t);
      u541DoEquipS03(ctx, 'シー・アーチャー', r && r.card.uid != null ? findCardByUid(r.card.uid) : null);
    });
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, timing:['free'],
  /* WIKI-4C96ECDF55A6: 破壊代替は永続効果。「破壊される場合」なので戦闘でも効果でも使える（任意） */
  equipHostSubstituteOptionalS03:{causes:['battle','effect']},
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self || self.face !== 'up') return null;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return null;
      return u541EquippedS03(self, h.p).length ? {atk:800} : null;
    }
  }
});

/* ---- The アトモスフィア ---- */
function u541AtmoFoePoolS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face === 'up'});
}
function u541AtmoFieldS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz'}); }
function u541AtmoGraveS03(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k === 'm'); }
defineUnifiedCardV4('The アトモスフィア', [{
  key:'equip-foe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){ return u541CanEquipS03(ctx, u541AtmoFoePoolS03); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.setCardFlag(me, 'u541EquipTurnS03', gameState.turn, 'The アトモスフィア（1ターンに1度）', {silent:true});
    const pool = u541AtmoFoePoolS03(ctx);
    if(!pool.length) return;
    API.selectCard('The アトモスフィア：装備する相手モンスター', pool, t=>{
      const r = t && resolveTarget(t);
      u541DoEquipS03(ctx, 'The アトモスフィア', r && r.card.uid != null ? findCardByUid(r.card.uid) : null);
    });
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, timing:['free'],
  /* WIKI-524DDFFDE4D5: 特殊召喚は召喚ルール効果（S03-U342 の summonProcedure）。
     WIKI-7FAD37B22612: トークンも除外できる。 */
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u541AtmoFieldS03(ctx).length < 2){ ctx.reason = '自分フィールドのモンスターが2体必要です'; return false; }
      if(!u541AtmoGraveS03(ctx).length){ ctx.reason = '自分の墓地にモンスターがいません'; return false; }
      if(typeof graveMoveBlocked === 'function' && graveMoveBlocked('grave', 'banish')){ ctx.reason = '墓地のカードを除外できません'; return false; }
      return true;
    },
    cost(ctx, done){
      u342PickN('The アトモスフィア：除外する自分フィールドのモンスター', ctx, u541AtmoFieldS03, 2, h=>API.banish(h, 'The アトモスフィア（召喚条件）'), ok1=>{
        if(!ok1){ done(false); return; }
        u342PickN('The アトモスフィア：除外する自分の墓地のモンスター', ctx, u541AtmoGraveS03, 1, h=>API.banish(h, 'The アトモスフィア（召喚条件）'), done);
      });
    }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self || self.face !== 'up') return null;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return null;
      return u541PrintedStatsS03(self, h.p);     /* WIKI-08C61FF2CB13: 記載された（元々の）数値分 */
    }
  }
});

/* ---- 地底のアラクネー ---- */
declareAttackLockS03('地底のアラクネー');          /* S03-U144 / engine/1ZO */
defineUnifiedCardV4('地底のアラクネー', [{
  /* WIKI-9E07F8028E49: 装備は対象を取る */
  key:'equip-foe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return u541CanEquipS03(ctx, u541AtmoFoePoolS03); },
  target(ctx, done){
    API.selectCard('地底のアラクネー：装備する相手モンスター', u541AtmoFoePoolS03(ctx), t=>done([t]));
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const foe = (r && r.card && r.card.uid != null) ? findCardByUid(r.card.uid) : null;
    if(me && me.zone === 'mz') API.setCardFlag(me, 'u541EquipTurnS03', gameState.turn, '地底のアラクネー（1ターンに1度）', {silent:true});
    /* WIKI-CFB024C0A1AF: 解決時にこのカードが表側表示で存在しない場合、選択された相手モンスターは
       装備できず墓地へ送られる */
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      if(foe && foe.zone === 'mz'){
        API.log('地底のアラクネー：このカードがフィールドに表側表示で存在しないため、選択したモンスターを墓地へ送る');
        API.sendToGrave(foe, '地底のアラクネー');
      }
      return;
    }
    u541DoEquipS03(ctx, '地底のアラクネー', foe);
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, targets:true, timing:['free'],
  /* WIKI-8F834E1A7A8D: 身代わりは永続効果で、「戦闘によって破壊される場合」だけの任意 */
  equipHostSubstituteOptionalS03:{causes:['battle']},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } }
});
