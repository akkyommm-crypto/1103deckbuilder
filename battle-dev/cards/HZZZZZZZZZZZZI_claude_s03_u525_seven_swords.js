/* S03-U525: セブン・ソード・ウォリアー（1103対象の未実装カード。carddata のテキスト）。

   セブン・ソード・ウォリアー（シンクロ・星7・戦士・光・攻2300/守1300）
     チューナー＋チューナー以外のモンスター1体以上
     1ターンに1度、このカードに装備カードが装備された時、相手ライフに800ポイントダメージを与える。
     また、1ターンに1度、このカードに装備された装備カード1枚を墓地へ送る事ができる。
     このカードに装備された装備カードが墓地へ送られた時、相手フィールド上に表側表示で存在する
     モンスター1体を選択して破壊する事ができる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-8464A3FDCE00（11/03/31）装備カードを墓地へ送るのは**コストではなく効果処理**。
     WIKI-95A7FDC55945（10/08/04）その効果は装備カード 1 枚を**対象に取る**。
     WIKI-0C7EF51B9782（10/08/04）《Ｄ・Ｄ・Ｒ》で特殊召喚した場合もダメージの効果は発動する
       → 「装備された時」は装備イベント（System v15 の onEquipAttached）で見る。
     WIKI-3745358F4C59（10/10/20）《サイクロン》で装備カードが破壊され墓地へ送られた場合も破壊効果は発動する
       → 墓地へ送られた**理由は問わない**。
     WIKI-E310EA381AD3（10/08/04）破壊効果に 1 ターンの回数制限は無い。
     WIKI-3BCFDB9634BD（10/08/05）装備カードが 2 枚同時に墓地へ送られた場合でも、効果は 1 回だけ
       → 同じ処理番号（engine/1ZZX の stepS03）では 1 回だけ発動する。
     WIKI-183FF13CF89F（10/08/04）**このカードが破壊された**事で装備魔法が墓地へ送られた場合は発動しない／
     WIKI-CE43322EF830（10/08/04）《月の書》《亜空間物質転送装置》をこのカードに使った事で
       装備魔法が墓地へ送られた場合も発動しない
       → 墓地へ送られた時点で、このカードがモンスターゾーンに**表側表示で残っている**事を条件にする。
     WIKI-02EA6A6B7D43（10/08/04）装備魔法の発動にチェーンして破壊された場合は「装備されていない扱い」で発動しない
       → 装備された記録（onEquipAttached）が無いカードは対象外。
     WIKI-B9E9BA076A83 / WIKI-0A2622D59E41（10/08/04）《鎖付きブーメラン》《スフィア・ボム 球体時限爆弾》
       のようなモンスターの装備カードも墓地へ送れるし、破壊効果も発動する／
     WIKI-00F9E5A7766A（10/08/04）**相手が**このカードに装備した装備カードも対象になる
       → 装備カードの種類と持ち主を問わない。
     WIKI-345FEED6370D（10/08/26）ダメージステップ中に墓地へ送られた場合も発動する。
     WIKI-D9DF855BA1F8（10/08/04）《黒いペンダント》を自身の効果で送った場合、ペンダントの効果と
       「同時に発動する扱い」なのでタイミングを逃さない（この実装では両方が同じ処理で誘発する）。

   「装備された時」「装備が外れた時」はどちらも System v15 の装備イベントで見るので、記録を自分で持つ必要がない。
   1ターンに1度の 2 つの効果だけ、使ったターンをこのカードのゾーン限定の印に残す（場を離れると消える）。 */

function u525EquipAttachedToMeS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up' || ctx.card.uid == null) return null;
  if(e.uid !== ctx.card.uid) return null;
  return API.equipCardOfEvent(e);
}
/* 「このカードに装備された装備カードが墓地へ送られた時」は、装備が外れたイベント（System v15 の
   onEquipDetached、装備モンスターの uid を持つ）で見る。記録を自分で持つ必要がない:
   このカードが破壊された・裏側になった場合は、その時点でこのカードがモンスターゾーンに表側で
   残っていないので誘発しない（WIKI-183FF13CF89F / WIKI-CE43322EF830）。
   装備されずに破壊された装備魔法は外れるイベントも起きない（WIKI-02EA6A6B7D43）。 */
/* 今このカードに装備されている装備カード（種類・持ち主は問わない） */
function u525EquippedCardsS03(ctx){
  const me = ctx.card;
  if(!me || me.uid == null) return [];
  const out = [];
  for(let p = 0; p < 2; p++){
    (gameState.players[p].sz || []).forEach((c, i)=>{
      if(!c || !c.equipTo || c.equipTo.uid !== me.uid) return;
      out.push({p:p, zone:'sz', index:i, card:c, db:dbOf(c)});
    });
  }
  return out;
}
function u525TurnUsedS03(card, key){ return Number(card && card[key]) === Number(gameState.turn); }
/* 墓地へ送られた装備カードが「このカードに装備されていたもの」か */
function u525SentEquipS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up' || ctx.card.uid == null) return null;
  if(e.uid !== ctx.card.uid) return null;                 /* 装備モンスターがこのカードだったもの */
  if(e.equipUid == null || e.cardUid == null) return null;
  /* 墓地へ送られた場合だけ（手札やデッキに戻った場合は違う）。
     equipUid は装備ごとの番号でカードの uid とは別物なので、
     行き先は cardUid（装備カード自身の uid、engine/1E）で読む。 */
  const h = findCardByUid(e.cardUid);
  if(!h || h.zone !== 'grave') return null;
  /* WIKI-3BCFDB9634BD: 同時に墓地へ送られた場合は 1 回だけ。
     「同時」は装備イベントの grpS03（engine/1Eの equipDetachGroupS03）で読む。 */
  const grp = (e.grpS03 != null) ? String(e.grpS03) : null;
  if(grp != null && String(ctx.card.u525DestroyGrpS03) === grp) return null;
  return {uid:e.equipUid, grp:grp};
}
function u525FoeMonstersS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face === 'up'});
}

defineUnifiedCardV4('セブン・ソード・ウォリアー', [{
  /* 1ターンに1度、このカードに装備カードが装備された時、相手ライフに800ポイントダメージを与える */
  key:'equip-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEquipAttached'], forced:true,
  condition(ctx){
    if(u525TurnUsedS03(ctx.card, 'u525BurnTurnS03')) return false;
    return !!u525EquipAttachedToMeS03(ctx);
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.setCardFlag(me, 'u525BurnTurnS03', gameState.turn, 'セブン・ソード・ウォリアー（1ターンに1度）', {silent:true});
    API.damageLP(ctx.opponent, 800, 'セブン・ソード・ウォリアー');
  },
  afterResolve(){}
}, {
  /* 1ターンに1度、このカードに装備された装備カード1枚を墓地へ送る事ができる（対象を取る・効果処理で送る） */
  key:'send-equip', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  targetRange:LOCATION.ONFIELD, targetSide:'both',
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(u525TurnUsedS03(ctx.card, 'u525SendTurnS03')){ ctx.reason = 'このターンは既に使用しています'; return false; }
    if(!u525EquippedCardsS03(ctx).length){ ctx.reason = 'このカードに装備された装備カードがありません'; return false; }
    return true;
  },
  /* WIKI-95A7FDC55945（10/08/04）: 装備カード 1 枚を対象に取る。 */
  target(ctx, done){
    API.selectCard('セブン・ソード・ウォリアー：墓地へ送る装備カード', u525EquippedCardsS03(ctx), t=>done([t]));
  },
  /* WIKI-8464A3FDCE00（11/03/31）: コストではなく効果処理で送る。 */
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.setCardFlag(me, 'u525SendTurnS03', gameState.turn, 'セブン・ソード・ウォリアー（1ターンに1度）', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone !== 'sz') return;
    API.sendToGrave(r, 'セブン・ソード・ウォリアー');
  },
  afterResolve(){}
}, {
  /* このカードに装備された装備カードが墓地へ送られた時、相手の表側表示モンスター1体を選択して破壊する */
  key:'equip-to-grave-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEquipDetached'],
  targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(!u525SentEquipS03(ctx)) return false;
    if(!u525FoeMonstersS03(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){
    API.selectCard('セブン・ソード・ウォリアー：破壊する相手モンスター', u525FoeMonstersS03(ctx), t=>done([t]));
  },
  operation(ctx){
    const info = u525SentEquipS03(ctx);
    const me = locateCardAnyV4(ctx.card);
    if(info && info.grp != null && me && me.zone === 'mz')
      API.setCardFlag(me, 'u525DestroyGrpS03', info.grp, 'セブン・ソード・ウォリアー（同時は1回）', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone === 'mz' && r.card.face === 'up') API.destroy(r, 'セブン・ソード・ウォリアー');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['free'],
  passive:{
    onEquipAttached(ctx){ return !!u525EquipAttachedToMeS03(ctx) && !u525TurnUsedS03(ctx.card, 'u525BurnTurnS03'); },
    onEquipDetached(ctx){ return !!u525SentEquipS03(ctx) && u525FoeMonstersS03(ctx).length > 0; }
  }});
