/* S03-U279: 封印されしエクゾディア (2011 text) — このカードと「封印されし者の右腕」「封印されし者の左腕」「封印されし者の右足」「封印されし者の左足」が
   手札に全て揃った時、自分はデュエルに勝利する。 Engine (this unit): specialWinS03 checked after every Action (engine/1ZZL). */
defineScript('封印されしエクゾディア', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '手札に5枚が揃うと勝利します（発動する効果ではありません）'; return false; },
  resolve(){}, afterResolve(){},
  specialWinS03:{ hand:['封印されしエクゾディア','封印されし者の右腕','封印されし者の左腕','封印されし者の右足','封印されし者の左足'], label:'封印されしエクゾディア（5枚が手札に揃った）' }
});
