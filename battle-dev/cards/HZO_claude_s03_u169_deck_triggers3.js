/* S03-U169: more recruiters on the shared deck-trigger engine (engine/1ZT; spec.summonFlag / spec.toOpponent, S03-U169). */

/* ナチュル・チェリー (2011): 「このカードが相手によってフィールド上から墓地へ送られた場合、自分のデッキから「ナチュル・チェリー」を2体まで
   裏側守備表示で特殊召喚する事ができる。」
   「相手によって」: destroyed by battle with an opponent's monster, or sent / destroyed by an effect of the opponent — the battle
   record graveInfo.byPlayer, or the move provenance (P3 stamp) of an effect. */
function sentByOpponentS03(card, me){
  const opp = me===0 ? 1 : 0;
  const g = card && card.graveInfo, m = card && card.moveProvenance;
  if(g && g.byPlayer===opp) return true;
  return !!(m && m.reason==='effect' && m.actingPlayer===opp);
}
declareDeckTriggerS03('ナチュル・チェリー', {when:'fieldToGrave', action:'summon', optional:true, pos:'faceDownDef', max:2, filter:{name:'ナチュル・チェリー'},
  extra(ctx){ return sentByOpponentS03(ctx.card, ctx.player) ? '' : '相手によってフィールドから墓地へ送られた時に発動できます'; }});

/* プチトマボー (2011): 「このカードが戦闘によって破壊され墓地へ送られた時、デッキから「トマボー」と名のついたモンスターを2体まで特殊召喚できる。
   このターン、この効果で特殊召喚したモンスターはシンクロ素材にできない。」 (「トマボー」 = GROUP.TOMABO, P4-v7) */
declareDeckTriggerS03('プチトマボー', {when:'battleToGrave', action:'summon', optional:true, pos:'atk', max:2, filter:{group:'TOMABO'},
  summonFlag:{key:'noSynchroMaterialTurnS03'}});

/* 素早いムササビ (2011): 「このカードが戦闘によって破壊され墓地へ送られた時、相手ライフに500ポイントダメージを与える。さらに自分のデッキから
   「素早いムササビ」を任意の数だけ相手フィールド上に表側攻撃表示で特殊召喚する事ができる。このカードはアドバンス召喚のためにはリリースできない。」
   Forced (the damage); the Special Summon to the opponent's field is optional within the resolution (0 or more). */
declareDeckTriggerS03('素早いムササビ', {when:'battleToGrave', action:'summon', optional:false, pos:'atk', max:99, minPick:0, toOpponent:true,
  summonNeedsZone:false, filter:{name:'素早いムササビ'},
  before(ctx){ API.damageLP(ctx.opponent, 500); },
  script:{ noAdvanceTributeS03:true }});
