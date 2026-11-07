/* S03-U538: 「サイバー・ダーク」の残り 2 枚（1103対象の未実装カード。carddata のテキスト）。
   S03-U323（3 体の「サイバー・ダーク」）と S03-U130/U132 の融合魔法の共通処理に乗せる単位。
   同じ仕組みのカードをまとめて実装する。エンジンへの追加は融合魔法のプロファイルに素材の
   「持ち主のデッキに戻す」処理（dispose:'deck'）を足しただけ。

   鎧黒竜－サイバー・ダーク・ドラゴン（融合・効果モンスター・星8・機械・闇・攻1000/守1000）
     「サイバー・ダーク・ホーン」＋「サイバー・ダーク・エッジ」＋「サイバー・ダーク・キール」
     このカードは融合召喚でしか特殊召喚できない。
     ①:このカードが特殊召喚に成功した場合、自分の墓地のドラゴン族モンスター1体を対象として発動する。
       そのドラゴン族モンスターを装備カード扱いとしてこのカードに装備する。
     ②:このカードの攻撃力は、このカードの効果で装備したモンスターの元々の攻撃力分、
       及び自分の墓地のモンスターの数×100アップする。
     ③:このカードが戦闘で破壊される場合、代わりに装備したそのモンスターを破壊する。

   サイバーダーク・インパクト!（通常魔法）
     ①:自分の手札・フィールド・墓地から、「サイバー・ダーク・ホーン」「サイバー・ダーク・エッジ」
       「サイバー・ダーク・キール」を1枚ずつ持ち主のデッキに戻し、
       「鎧黒竜－サイバー・ダーク・ドラゴン」1体をEXデッキから融合召喚する。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-BE7F854239D0（10/01/21）他の「サイバー・ダーク」が装備していたドラゴン族装備カードを
       《力の集約》でこのカードに移し替えた場合、装備はされるが**攻撃力は上がらない**
       → ②は「このカードの効果で装備した」ものだけを数える（S03-U323 と同じ equipTo.sourceUid の判定）。
     WIKI-B96A2A7A27A1（08/12/12）このカードで装備した《レッド・デーモンズ・ドラゴン／バスター》が
       破壊された時、《レッド・デーモンズ・ドラゴン》を墓地から特殊召喚できる
       → 装備カード扱いのモンスターが破壊されて墓地へ行く経路は共通処理のまま（engine/1ZZB）。
     WIKI-6B70CD8BA572（07/06/28）一度もフィールドに召喚されていないカードが、このカードに装備されている
       時に墓地へ送られた場合、特殊召喚できるようになる → 同じく共通処理のまま。
     WIKI-BED6B9FEA833（10/08/14）《サクリファイス》やこのカードの効果で装備カード扱いになっていた
       モンスターが墓地へ送られたターンからのスタンバイフェイズに蘇生効果を使える → 同じく共通処理のまま。
     WIKI-8B83F58E64B5（09/02/20）/ WIKI-60A8E4781EE0（08/09/13）《ドラゴン・アイス》が
       フィールドに存在する場合、2 体目をこのカードの効果で装備する事はできない（装備カード扱いでも同じ）
       → 《ドラゴン・アイス》は未実装なので報告書の未対応に書いた。
     WIKI-C6723DC2A561 《沼地の魔神王》などの融合素材代用モンスターをデッキに戻す事はできない
       → 共通処理は代用モンスターを一切扱わない（S03-U130 からの既知の範囲）。
     WIKI-C9215D98E674 《チェーン・マテリアル》でデッキのモンスターを融合素材には使えない
       → 素材の候補は手札・フィールド・墓地だけ（プロファイルの zones）。
     WIKI-FED15B34D67A 手札やフィールドで裏側守備表示の素材をデッキに戻す場合は相手に確認させる
       → engine/1ZL の dispose:'deck' で、戻す前に API.reveal で公開する。 */

function u538Equipped(card){
  return equipsOnV15(card, gameState).filter(x=>x.card.v46MonsterEquip === true
    && x.card.equipTo && x.card.equipTo.sourceUid === card.uid);
}
/* WIKI-BE7F854239D0: 「このカードの効果で装備した」ものだけを数える */
function u538EquipBonus(card){
  return u538Equipped(card).reduce((n, x)=>n + (Number(dbOf(x.card).atk) || 0), 0);
}
function u538GraveMonsters(p){
  return ((gameState.players[p] || {}).grave || []).filter(c=>c && (dbOf(c) || {}).k === 'm').length;
}
function u538GravePool(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k === 'm'
    && (typeof currentRaceV17 === 'function' ? currentRaceV17(x.card) : x.db.ra) === 'ドラゴン');
}
function u538Summoned(ctx){
  return ctx.zone === 'mz' && !!ctx.card && ctx.card.face === 'up' && !!ctx.event && ctx.event.card === ctx.card;
}
function u538CanEquip(ctx){
  return u538Summoned(ctx) && u538GravePool(ctx).length > 0
    && gameState.players[ctx.player].sz.length < ZONE_LIMITS.sz;
}

defineUnifiedCardV4('鎧黒竜－サイバー・ダーク・ドラゴン', [{
  key:'summon-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  forced:true, targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u538CanEquip(ctx); },
  target(ctx, done){
    API.selectCard('鎧黒竜－サイバー・ダーク・ドラゴン：装備する墓地のドラゴン族', u538GravePool(ctx), t=>done([t]));
  },
  operation(ctx){
    const host = locateCardAnyV4(ctx.card);
    const t = ctx.selectedTargets && ctx.selectedTargets[0], eq = t && resolveTarget(t);
    if(!host || host.zone !== 'mz' || host.card.face !== 'up') return;
    if(!eq || eq.zone !== 'grave' || eq.p !== ctx.player) return;
    API.equipFromGrave(ctx.player, eq, host, '鎧黒竜－サイバー・ダーク・ドラゴン', ctx.card.uid, ctx.chainId);
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true, targets:true, timing:['free'],
  equipHostSubstituteS03:'battle',            /* ③ engine/1ZZB（S03-U323 と同じ共通処理） */
  passive:{ onSpecialSummon(ctx){ return u538CanEquip(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self || self.face !== 'up') return null;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return null;
      const up = u538EquipBonus(self) + u538GraveMonsters(h.p) * 100;
      return up ? {atk:up} : null;
    }
  }
});

/* ---- サイバーダーク・インパクト! ----
   融合魔法の共通処理（engine/1ZL のプロファイル。素材は手札・フィールド・墓地から持ち主のデッキへ戻す） */
defineFusionSpellS03('サイバーダーク・インパクト!',
  '「サイバー・ダーク・ホーン」「サイバー・ダーク・エッジ」「サイバー・ダーク・キール」が手札・フィールド・墓地にそろっていません');
