/* S03-U32: 対象にされた時に自動で働く無効化（永続効果）の追加宣言。仕組みは engine/1T_targeting_negation_s03.js。

   無敗将軍 フリード 「このカードがフィールド上に表側表示で存在する限り、このカードを対象にする魔法カードの効果を無効にし破壊する。」
     2011 wiki(10/06/11)：魔法カードの効果を無効にする効果の種別は永続効果。罠・モンスターの効果は無効にしない。
     このカードのもう一つの効果（ドローフェイズの通常ドローの代わりにレベル4以下の戦士族1体を手札に加える）は
     cards/40_auto_interpreter.js の AUTO_DECK_TABLE のままなので、状態は PARTIAL を維持する。

   カオス・マジシャン 「このカード1枚を対象にするモンスターの効果を無効にする。」
     2011 wiki(08/05/31、氷結界の龍 ブリューナク)：1枚だけ捨ててこのカードのみが対象なら無効にする。
     2枚以上を同時に対象にした場合は「このカード1枚だけ」ではないので適用せず、効果は通常どおり処理する。
     破壊はしない。テキストはこの効果だけなので、発動できる効果は持たない。 */

/* 表側表示のこのカードだけが対象か（S03-U32 で engine/1T が復号済みの対象一覧を渡す） */
function s03OnlyThisTargetU32(targets, negator){
  if(!Array.isArray(targets) || targets.length !== 1) return false;
  const t = targets[0];
  return !!(t && t.card && negator && negator.card && t.card === negator.card);
}

declareTargetingNegatorS03('無敗将軍 フリード', {
  applies({srcDb, negator}){
    if(!srcDb || srcDb.k !== 's') return null;              /* 魔法カードの効果だけ */
    const c = negator && negator.card;
    if(!c || c.face !== 'up') return null;                  /* 表側表示で存在する限り */
    return {mode:'effect', destroySource:true, reason:'無敗将軍 フリード'};
  }
});

declareTargetingNegatorS03('カオス・マジシャン', {
  applies({srcDb, negator, targets}){
    if(!srcDb || srcDb.k !== 'm') return null;              /* モンスターの効果だけ */
    const c = negator && negator.card;
    if(!c || c.face !== 'up') return null;
    if(!s03OnlyThisTargetU32(targets, negator)) return null; /* このカード1枚だけが対象の時 */
    return {mode:'effect', destroySource:false, reason:'カオス・マジシャン'};
  }
});

/* カオス・マジシャン はこの永続効果だけを持つ（発動する効果は無い）。
   六武院（S03-U14）と同じ作法で、登録を置いたうえで発動を断る。 */
defineScript('カオス・マジシャン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = 'カオス・マジシャンには発動する効果がありません'; return false; },
  afterResolve(){}
});
