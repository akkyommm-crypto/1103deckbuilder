/* S03-U302: 霞の谷のファルコン (2011 text) — the attack-declaration cost of returning another own card (engine/1ZZQ).
   ---- 霞の谷のファルコン: このカードは、このカード以外の自分フィールド上のカード1枚を手札に戻さなければ攻撃宣言できない。 ----
   Not an effect activation: a cost of each attack declaration (any other card on its controller's field: Monster, Spell & Trap or Field Zone,
   face-up or face-down). Without such a card it cannot declare an attack. While its effects are negated, no cost is needed. */
defineScript('霞の谷のファルコン', {
  type:'monster', priority:1,
  attackReturnCostS03:true,
  condition(ctx){ ctx.reason = '起動する効果はありません（攻撃宣言の時に他の自分のカード1枚を手札に戻します）'; return false; },
  resolve(){}, afterResolve(){}
});
