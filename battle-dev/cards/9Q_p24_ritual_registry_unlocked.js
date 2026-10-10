/* P24 RITUAL_SPEC external registry で解禁された儀式魔法。
   engine/14_ritual_v5.js は一切触らない。RITUAL_SPEC_V5 本体も編集しない。
   cards 側から registerRitualSpecV24 / registerRitualPredicateV24 で登録するだけ。

   発動処理は既存の v5DefineRitualSpell（cards/90_ritual_recovery.js）を再利用する。
   儀式召喚の素材選択・レベル計算・provenance は全て既存 v5 の経路に任せる。 */

/* ---- 述語の登録 ---------------------------------------------------------
   「闇属性の儀式モンスター」のような、カード名を列挙しない条件はここへ。
   ritualAllowsMonsterV5 は DB 行を渡してくるので、印刷された属性で判定する
   （既存の RITUA 述語が isSetCardV4(cardDb,...) を使っているのと同じ作法）。 */
registerRitualPredicateV24('DARK_RITUAL_V24', function(cardDb){
  return !!cardDb && cardDb.at === '闇';
});

/* ---- spec の登録 --------------------------------------------------------
   「レベルの合計がN以上になるように」          → levelMode:'atLeast'
   「儀式召喚するモンスターと同じレベルになるように」→ levelMode:'exact', level:null */
registerRitualSpecV24('イリュージョンの儀式',
  {monsters:['サクリファイス'],                     level:1, levelMode:'atLeast'});
registerRitualSpecV24('カオスの儀式',
  {monsters:['カオス・ソルジャー'],                 level:8, levelMode:'atLeast'});
registerRitualSpecV24('ガルマソードの誓い',
  {monsters:['ガルマソード'],                       level:7, levelMode:'atLeast'});
registerRitualSpecV24('仮面魔獣の儀式',
  {monsters:['仮面魔獣マスクド・ヘルレイザー'],      level:8, levelMode:'atLeast'});
/* 個別の儀式モンスター名を列挙せず、述語で「闇属性の儀式モンスター」を表す。 */
registerRitualSpecV24('奈落との契約',
  {pred:'DARK_RITUAL_V24',                          level:null, levelMode:'exact'});

/* ---- カードとしての登録 --------------------------------------------------
   既存19枚とまったく同じ定型。専用の儀式処理は書かない。 */
v5DefineRitualSpell('イリュージョンの儀式');
v5DefineRitualSpell('カオスの儀式');
v5DefineRitualSpell('ガルマソードの誓い');
v5DefineRitualSpell('仮面魔獣の儀式');
v5DefineRitualSpell('奈落との契約');

/* 高等儀式術（デッキの通常モンスターが素材）と
   リチュアに伝わりし禁断の秘術（相手フィールドも素材・攻撃力半減・バトルフェイズ不可）は
   ritualMaterialCandidatesV5 の素材ソース拡張が別途必要なので ENGINE_GAP のまま残す。 */
