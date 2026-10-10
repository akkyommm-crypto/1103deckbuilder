/* S03-U66: C-S03-24 extension — ダーク・ジェネラル フリード「自分フィールド上に表側表示で存在する闇属性
   モンスターを対象にする魔法カードの効果を無効にし破壊する」を完成させる。
   S03-U33 が実装した draw-replacement (cards/H9) はそのまま。既存の declareTargetingNegatorS03（S03-U32、
   無敗将軍 フリードと同じ「このカード自身が対象の時」）は自分自身が対象になったケースをそのまま使い、
   新設の declareTargetingProtectorS03（engine/1ZE_targeting_protection_s03.js、S03-U66）で「自分の他の
   表側表示・闇属性モンスターが対象になったケース」を追加する。どちらも同じ negateChainLinkV13 を使い、
   mode:'effect'・破壊ありという永続効果の種別は無敗将軍 フリードの2011 wiki(10/06/11)裁定と同じ扱い。 */

declareTargetingNegatorS03('ダーク・ジェネラル フリード', {
  applies({srcDb, negator}){
    if(!srcDb || srcDb.k !== 's') return null;               /* 魔法カードの効果だけ */
    const c = negator && negator.card;
    if(!c || c.face !== 'up') return null;                   /* 表側表示で存在する限り */
    return {mode:'effect', destroySource:true, reason:'ダーク・ジェネラル フリード'};
  }
});

declareTargetingProtectorS03('ダーク・ジェネラル フリード', {
  applies({srcDb, protector, target}){
    if(!srcDb || srcDb.k !== 's') return null;                /* 魔法カードの効果だけ */
    const pc = protector && protector.card;
    if(!pc || pc.face !== 'up') return null;                  /* 自分がフィールド上に表側表示で存在する限り */
    const tc = target && target.card;
    if(!tc || tc.face !== 'up') return null;                  /* 対象が表側表示の闇属性モンスターの時 */
    if((dbOf(tc) || {}).at !== '闇') return null;
    return {mode:'effect', destroySource:true, reason:'ダーク・ジェネラル フリード'};
  }
});
