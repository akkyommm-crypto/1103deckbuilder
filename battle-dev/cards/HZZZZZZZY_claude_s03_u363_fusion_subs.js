/* S03-U363: four Fusion Material substitute monsters (carddata texts).

   イリュージョン・シープ / 心眼の女神 / 沼地の魔獣王 / 破壊神 ヴァサーゴ
       このカードを融合素材モンスター1体の代わりにする事ができる。その際、他の融合素材モンスターは正規のものでなければならない。

   Notes
   - The rule is read from the card text by the fusion engine (S03-U134, engine/1ZL fusionSubstituteCardS03 / fusionCombosS03) for every 融合-type Spell; nothing is scripted per card. The cards only need a registration (a permanent-effect monster: no activation of its own) so that coverage sees them as scripts. */
function u363Passive(name){
  return { type:'monster', priority:1,
    condition(ctx){ ctx.reason = '永続効果のみのカードです（融合素材の代用は融合召喚の処理で行います）'; return false; },
    resolve(){}, afterResolve(){} };
}
defineScript('イリュージョン・シープ', u363Passive('イリュージョン・シープ'));
defineScript('心眼の女神', u363Passive('心眼の女神'));
defineScript('沼地の魔獣王', u363Passive('沼地の魔獣王'));
defineScript('破壊神 ヴァサーゴ', u363Passive('破壊神 ヴァサーゴ'));
