/* S03-U528: トランスフォーム・スフィア（1103対象の未実装カード。carddata のテキスト）。

   トランスフォーム・スフィア（効果・星3・鳥獣・風・攻100/守100）
     1ターンに1度、相手フィールド上に表側守備表示で存在するモンスター1体を選択して発動する事ができる。
     手札を1枚捨て、選択した相手モンスターを装備カード扱いとしてこのカードに1体のみ装備する。
     このカードの攻撃力は、このカードの効果で装備したモンスターの攻撃力分アップする。
     このカードは攻撃した場合、バトルフェイズ終了時に守備表示になる。
     エンドフェイズ時、このカードの効果で装備したモンスターを相手フィールド上に表側守備表示で特殊召喚する。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-2EF617C51571（09/12/28）効果分類: 装備する効果は**起動効果**、自己強化と表示形式変更は**永続効果**、
       特殊召喚する効果は**誘発効果**。
     WIKI-FDFA38E9B4B6（10/01/09）手札を捨てるのは**効果処理**（コストではない）。
     WIKI-B19BA75E212C（10/01/09）効果解決時に手札が 0 枚で捨てられない場合、装備する効果は適用されない。
     WIKI-78672B59DAAC（10/08/16）手札を捨てるのと装備するのは**同時**。
     WIKI-C3A441FCF1AA（10/01/27）選択したモンスターが解決時に《月の書》等で裏側表示になっていた場合でも
       裏側表示のまま装備カードになる。その場合このカードの攻撃力はアップせず、エンドフェイズには
       表側守備表示で特殊召喚される。
     WIKI-9C33229AACA2（09/12/28）《溶岩魔神ラヴァ・ゴーレム》のような特殊召喚モンスターは、蘇生制限を
       満たしていれば特殊召喚され、満たしていなければ墓地へ送られる。
     WIKI-C4CD12F0F66F（09/12/28）正規の方法でも墓地から特殊召喚できないモンスター・特殊召喚できない
       モンスターは、特殊召喚されずに墓地へ送られる。
     WIKI-995438DB1F1C（10/08/16）《フェルグラントドラゴン》は墓地から特殊召喚されていた場合のみ
       特殊召喚され、それ以外は墓地へ送られる。
     WIKI-BCC222AD1322（10/01/27）《フォッシル・ダイナ パキケファロ》等で特殊召喚できない場合、
       特殊召喚する効果は発動するが、特殊召喚されずに墓地へ送られる（装備されたままにはならない）。
     WIKI-CF2792307CF3（10/01/25）トークンは特殊召喚できないのでフィールドから消滅する。
     WIKI-25181714FCFA（10/08/28）この効果でトークンが消滅する場合は**破壊扱いではない**のでダメージは出ない。
     WIKI-5C12010DECA5（09/12/29）特殊召喚する位置を決めるのはこのカードのコントローラー（engine に
       ゾーンの選択は無い。報告書の未対応に書いた）。
     WIKI-D5DC083B1E5A（10/01/25）トークンを装備した場合はトークンを特殊召喚したカードに記載された数値分
       アップする（engine はトークン作成時の数値を持つので、記載が無いトークンでは一致しない。未対応）。
     WIKI-2561E30DBB57（10/01/25）《死霊ゾーマ》を装備した場合は攻撃力 1800 アップし、エンドフェイズには
       特殊召喚できないので墓地へ送られる（罠モンスターの数値は装備カードになると engine では失われる。未対応）。 */

/* このカードの効果で装備しているモンスター（engine/00 の v46MonsterEquip を持つ装備カード） */
function u528EquippedS03(ctx){
  const me = ctx.card;
  if(!me || me.uid == null) return [];
  return v46EquippedMonsterCards(me, ctx.player);
}
function u528EquippedHandleS03(ctx){
  const c = u528EquippedS03(ctx)[0];
  if(!c || c.uid == null) return null;
  return findCardByUid(c.uid);
}
/* 装備したモンスターの攻撃力（裏側表示なら 0 — WIKI-C3A441FCF1AA） */
function u528EquipAtkS03(card, p){
  const list = v46EquippedMonsterCards(card, p);
  let sum = 0;
  list.forEach(c=>{
    if(!c || c.face !== 'up') return;
    /* WIKI-C3A441FCF1AA（10/01/27）: 裏側表示のまま装備されたモンスターでは攻撃力がアップしない。
       engine はゾーンを移るとカードを表側にするので、装備した時点で裏側だった印を見る。 */
    if(c.u528FaceDownS03 != null) return;
    const d = dbOf(c);
    const atk = (d && d.atk != null) ? Number(d.atk) : 0;
    if(Number.isFinite(atk) && atk > 0) sum += atk;
  });
  return sum;
}
function u528FoeDefMonstersS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz',
    filter:x=>x.card.face === 'up' && x.card.pos === 'def'});
}

defineUnifiedCardV4('トランスフォーム・スフィア', [{
  /* WIKI-2EF617C51571: 装備する効果は起動効果。1ターンに1度。 */
  key:'equip-foe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(Number(ctx.card.u528EquipTurnS03) === Number(gameState.turn)){ ctx.reason = 'このターンは既に使用しています'; return false; }
    if(u528EquippedS03(ctx).length){ ctx.reason = 'このカードには既にモンスターが装備されています（1体のみ）'; return false; }
    if(!u528FoeDefMonstersS03(ctx).length){ ctx.reason = '相手フィールドに表側守備表示のモンスターがいません'; return false; }
    if((API.me(ctx).sz || []).length >= ZONE_LIMITS.sz){ ctx.reason = '魔法＆罠ゾーンが一杯です'; return false; }
    /* WIKI-FDFA38E9B4B6 / WIKI-B19BA75E212C: 手札を捨てるのは効果処理。発動時に手札が無ければ発動もできない。 */
    if(!(API.me(ctx).hand || []).length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  target(ctx, done){
    API.selectCard('トランスフォーム・スフィア：装備する相手モンスター', u528FoeDefMonstersS03(ctx), t=>done([t]));
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.setCardFlag(me, 'u528EquipTurnS03', gameState.turn, 'トランスフォーム・スフィア（1ターンに1度）', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    /* WIKI-B19BA75E212C: 解決時に手札が 0 枚なら装備する効果は適用されない。 */
    const hand = (API.me(ctx).hand || []).map((c, i)=>({p:ctx.player, zone:'hand', index:i, card:c, db:dbOf(c)}));
    if(!hand.length){ API.log('トランスフォーム・スフィア：捨てる手札が無いため装備できない'); return; }
    /* WIKI-78672B59DAAC: 手札を捨てるのと装備するのは同時（同じ処理の中で行う）。 */
    API.selectCard('トランスフォーム・スフィア：捨てる手札', hand, h=>{
      API.discard(ctx.player, h.index, 'トランスフォーム・スフィア');
      const now = locateCardAnyV4(ctx.card), foe = (r.card && r.card.uid != null) ? findCardByUid(r.card.uid) : null;
      if(!now || now.zone !== 'mz' || !foe || foe.zone !== 'mz') return;
      /* WIKI-C3A441FCF1AA: 裏側表示になっていてもそのまま装備カードになる。
         その場合は攻撃力がアップしないので、装備した時点の表裏を印に残す。 */
      const wasDownS528 = (foe.card.face === 'down');
      API.equipMonster(ctx.player, foe, now, 'トランスフォーム・スフィア');
      if(wasDownS528 && foe.card.uid != null){
        const eqS528 = findCardByUid(foe.card.uid);
        if(eqS528 && eqS528.zone === 'sz')
          API.setCardFlag(eqS528, 'u528FaceDownS03', gameState.turn,
                          'トランスフォーム・スフィア（裏側のまま装備）', {silent:true});
      }
    });
  },
  afterResolve(){}
}, {
  /* このカードは攻撃した場合、バトルフェイズ終了時に守備表示になる（engine では
     《ゴブリン突撃部隊》と同じ扱い＝強制の誘発。分類の差は報告書に書いた）。 */
  key:'to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){
    return ctx.zone === 'mz' && !!ctx.card && ctx.card.face === 'up'
      && !!ctx.card.attacked && ctx.card.pos !== 'def';
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.changePosition(me, 'def', 'トランスフォーム・スフィア');
  },
  afterResolve(){}
}, {
  /* WIKI-2EF617C51571: 特殊召喚する効果は誘発効果（エンドフェイズ）。 */
  key:'end-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return ctx.zone === 'mz' && !!u528EquippedHandleS03(ctx); },
  operation(ctx){
    const h = u528EquippedHandleS03(ctx);
    if(!h || h.zone !== 'sz') return;
    const card = h.card;
    /* WIKI-9C33229AACA2 / WIKI-C4CD12F0F66F / WIKI-995438DB1F1C / WIKI-BCC222AD1322:
       特殊召喚できない場合は墓地へ送る（装備されたままにはしない）。
       WIKI-CF2792307CF3 / WIKI-25181714FCFA: トークンは消滅し、破壊扱いではないのでダメージは出ない。 */
    /* 蘇生制限（WIKI-9C33229AACA2 09/12/28）は墓地からの特殊召喚と同じ判定になるので、
       装備ゾーンからでも明示的に見る（engine の properlySummonedReasonS03 は from が
       grave / banish の時だけ見るため）。 */
    const properBlocked = (typeof properlySummonedReasonS03 === 'function')
      && !!properlySummonedReasonS03(card, null, 'トランスフォーム・スフィア', 'grave');
    const can = !properBlocked && ((typeof canEffectSpecialSummonS03 === 'function')
      ? canEffectSpecialSummonS03(card, 'sz', 'トランスフォーム・スフィア') : true);
    if(can && hasMonsterZoneSpace(ctx.opponent)
       && API.specialSummon(ctx.opponent, 'sz', h.index, 'def', 'トランスフォーム・スフィア', ctx.player)) return;
    const again = (card && card.uid != null) ? findCardByUid(card.uid) : null;
    if(again && again.zone === 'sz') API.sendToGrave(again, 'トランスフォーム・スフィア');
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, targets:true, timing:['mainPhase'],
  /* WIKI-2EF617C51571: 自己強化は永続効果。装備したモンスターの攻撃力分アップする。 */
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self, info){
      if(card !== self) return null;
      const up = u528EquipAtkS03(self, info.p);
      return up > 0 ? {atk:up} : null;
    }
  },
  passive:{
    onBattlePhaseEnd(ctx){
      return ctx.zone === 'mz' && !!ctx.card && ctx.card.face === 'up'
        && !!ctx.card.attacked && ctx.card.pos !== 'def';
    },
    onEndPhase(ctx){ return ctx.zone === 'mz' && !!u528EquippedHandleS03(ctx); }
  }
});
