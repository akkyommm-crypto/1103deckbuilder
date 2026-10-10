/* S03-U25: 「このカードが戦闘で（によって）破壊した（相手／効果）モンスターの効果は無効化される」を宣言する。
   仕組みは engine/1S_battle_destroyed_negation_s03.js。
   2011 wiki：ワーム・ウォーロードのこの効果は永続効果（相打ちでは無効にできない）。
   漆黒の魔王 LV4 の本文は「相手モンスター」だが、効果を持たないモンスターには無効にする効果が無いので effectOnly のまま扱う。 */
declareBattleDestroyedNegatorS03('漆黒の魔王 LV4', {});
declareBattleDestroyedNegatorS03('ワーム・ウォーロード', {});
/* エレメント・デビル：フィールドに地属性モンスターが存在する場合だけ（解決時に判定）。 */
declareBattleDestroyedNegatorS03('エレメント・デビル', {
  condition(){
    for(let p=0;p<2;p++){
      const P = gameState.players[p];
      if((P.mz||[]).some(c => c && c.face === 'up' && (typeof currentAttributeV17==='function' ? currentAttributeV17(c) : dbOf(c).at) === '地')) return true;
    }
    return false;
  }
});
