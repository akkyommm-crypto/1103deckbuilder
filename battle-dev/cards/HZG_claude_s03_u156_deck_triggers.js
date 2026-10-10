/* S03-U156: recruiters / searchers on the shared deck-trigger engine (engine/1ZT declareDeckTriggerS03).
   Each card only declares its 2011 text as data. These replace the coarse AUTO_DECK_TABLE entries (cards/40), which were
   trig:"ignition" — effects activated from the GY at will — and the individual scripts named below.
   Texts are the 2011 ones; where the project carddata holds a modern text, the difference is noted. */

/* ===== A. 「このカードが戦闘によって破壊され墓地へ送られた時、デッキから…特殊召喚」 ===== */
/* 仮面竜: …攻撃力1500以下のドラゴン族モンスター1体を自分フィールド上に特殊召喚する事ができる。 (position unspecified → face-up, player's choice) */
declareDeckTriggerS03('仮面竜', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', filter:{ra:'ドラゴン', atkmax:1500}});
/* 荒野の女戦士: …攻撃力1500以下の戦士族・地属性モンスター1体を自分フィールド上に表側攻撃表示で特殊召喚する事ができる。 */
declareDeckTriggerS03('荒野の女戦士', {when:'battleToGrave', action:'summon', optional:true, pos:'atk', filter:{ra:'戦士', at:'地', atkmax:1500}});
/* ユーフォロイド: …攻撃力1500以下の機械族モンスター1体を表側攻撃表示で特殊召喚する事ができる。その後デッキをシャッフルする。 */
declareDeckTriggerS03('ユーフォロイド', {when:'battleToGrave', action:'summon', optional:true, pos:'atk', filter:{ra:'機械', atkmax:1500}});
/* ジェネクス・サーチャー: …攻撃力1500以下の「ジェネクス」と名のついたモンスター1体を表側攻撃表示で特殊召喚できる。 */
declareDeckTriggerS03('ジェネクス・サーチャー', {when:'battleToGrave', action:'summon', optional:true, pos:'atk', filter:{group:GROUP.GENEX, atkmax:1500}});
/* 軍隊竜: …自分のデッキから「軍隊竜」1体を特殊召喚する。 (forced) */
declareDeckTriggerS03('軍隊竜', {when:'battleToGrave', action:'summon', optional:false, pos:'faceUp', filter:{name:'軍隊竜'}});
/* ヘル・セキュリティ: …デッキから悪魔族・レベル1モンスター1体を特殊召喚する。 (forced) */
declareDeckTriggerS03('ヘル・セキュリティ', {when:'battleToGrave', action:'summon', optional:false, pos:'faceUp', filter:{ra:'悪魔', lv:1}});
/* スレイブ・エイプ: …「剣闘獣」と名のついたレベル4以下のモンスター1体を自分フィールド上に特殊召喚する事ができる。 */
declareDeckTriggerS03('スレイブ・エイプ', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', filter:{set:SETCODE.GLADIATOR_BEAST, lvmax:4}});
/* トライクラー / ヴィークラー: …自分の手札またはデッキから「ヴィークラー」/「アンサイクラー」1体を自分フィールド上に特殊召喚する事ができる。 */
declareDeckTriggerS03('トライクラー', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', from:['hand','deck'], filter:{name:'ヴィークラー'}});
declareDeckTriggerS03('ヴィークラー', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', from:['hand','deck'], filter:{name:'アンサイクラー'}});
/* 幻影の魔術士: …攻撃力1000以下の「HERO」と名のついたモンスター1体を表側守備表示で特殊召喚する事ができる。 */
declareDeckTriggerS03('幻影の魔術士', {when:'battleToGrave', action:'summon', optional:true, pos:'def', filter:{set:SETCODE.HERO, atkmax:1000}});
/* ガスタ・イグル: …デッキからチューナー以外のレベル4以下の「ガスタ」と名のついたモンスター1体を特殊召喚できる。 */
declareDeckTriggerS03('ガスタ・イグル', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', filter:{group:GROUP.GUSTO, lvmax:4, tuner:false}});
/* パンダボーグ: …800ライフポイントを払って発動できる。デッキからレベル4のサイキック族モンスター1体を特殊召喚する。 */
declareDeckTriggerS03('パンダボーグ', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', lpCost:800, filter:{ra:'サイキック', lv:4}});
/* 素早いモモンガ: …自分は1000ライフポイント回復する。さらにデッキから「素早いモモンガ」を任意の数だけ裏側守備表示で特殊召喚できる。
   The recovery is forced; the summon part is optional within the resolution (0 or more). */
declareDeckTriggerS03('素早いモモンガ', {when:'battleToGrave', action:'summon', optional:false, pos:'faceDownDef', max:99, minPick:0, filter:{name:'素早いモモンガ'},
  summonNeedsZone:false, before(ctx){ API.recoverLP(ctx.player, 1000); }});

/* ===== B. 「このカードが戦闘によって破壊され墓地へ送られた時、デッキから…を手札に加える」 ===== */
declareDeckTriggerS03('RAI－MEI', {when:'battleToGrave', action:'search', optional:true, filter:{at:'光', lvmax:2}});
/* カバリスト: …800ライフポイントを払う事で自分のデッキからサイキック族モンスター1体を手札に加える。 (pay to activate) */
declareDeckTriggerS03('カバリスト', {when:'battleToGrave', action:'search', optional:true, lpCost:800, filter:{ra:'サイキック'}});
declareDeckTriggerS03('キーマウス', {when:'battleToGrave', action:'search', optional:true, filter:{ra:'獣', lvmax:3}});
declareDeckTriggerS03('ゴキポン', {when:'battleToGrave', action:'search', optional:true, filter:{ra:'昆虫', atkmax:1500}});
declareDeckTriggerS03('ダニポン', {when:'battleToGrave', action:'search', optional:true, filter:{ra:'昆虫', defmax:1000}});
/* ドレッド・ドラゴン: …デッキからレベル3以下のドラゴン族モンスター1体を手札に加える事ができる。 */
declareDeckTriggerS03('ドレッド・ドラゴン', {when:'battleToGrave', action:'search', optional:true, filter:{ra:'ドラゴン', lvmax:3}});
/* バイオレット・ウィッチ: …守備力1500以下の植物族モンスター1体を手札に加える。 (forced) */
declareDeckTriggerS03('バイオレット・ウィッチ', {when:'battleToGrave', action:'search', optional:false, filter:{ra:'植物', defmax:1500}});
declareDeckTriggerS03('バード・フェイス', {when:'battleToGrave', action:'search', optional:true, filter:{name:'ハーピィ・レディ'}});
/* 悪魂邪苦止: 「自分フィールド上に存在するこのカードが」戦闘によって破壊され墓地へ送られた時… — it must have been under its owner's control
   (a battle-destroyed card records graveInfo.byPlayer = the opponent of its controller). */
declareDeckTriggerS03('悪魂邪苦止', {when:'battleToGrave', action:'search', optional:true, filter:{name:'悪魂邪苦止'},
  extra(ctx){ const g = ctx.card && ctx.card.graveInfo; return (g && g.byPlayer===ctx.player) ? '自分フィールド上で戦闘によって破壊された時に発動します' : ''; }});
/* 暗黒界の斥候 スカー: …自分のデッキからレベル4以下の「暗黒界」と名のついたモンスター1体を手札に加える。 (forced) */
declareDeckTriggerS03('暗黒界の斥候 スカー', {when:'battleToGrave', action:'search', optional:false, filter:{set:SETCODE.DARK_WORLD, lvmax:4}});

/* ===== C. 「このカードがフィールド上から墓地へ送られた時、デッキから…を手札に加える」 =====
   クリッター / 黒き森のウィッチ, 2011 text: 「このカードがフィールド上から墓地へ送られた時、自分のデッキから攻撃力(守備力)1500以下のモンスター
   1体を手札に加える。」 — forced, no 「1ターンに1度」, no 「このターン…発動できない」 (both came with the later errata that the project
   carddata text shows). Any route from the field to the GY: battle, effect destruction, Tribute, Synchro material, cost … */
declareDeckTriggerS03('クリッター', {when:'fieldToGrave', action:'search', optional:false, filter:{atkmax:1500}});
declareDeckTriggerS03('黒き森のウィッチ', {when:'fieldToGrave', action:'search', optional:false, filter:{defmax:1500}});
declareDeckTriggerS03('ボタニティ・ガール', {when:'fieldToGrave', action:'search', optional:true, filter:{ra:'植物', defmax:1000}});

/* ===== D. 「このカードがフィールド上から墓地へ送られた時、デッキから…特殊召喚」 ===== */
declareDeckTriggerS03('ガスタ・ガルド', {when:'fieldToGrave', action:'summon', optional:true, pos:'faceUp', filter:{group:GROUP.GUSTO, lvmax:2}});
declareDeckTriggerS03('ナチュル・クリフ', {when:'fieldToGrave', action:'summon', optional:true, pos:'atk', filter:{set:SETCODE.NATURIA, lvmax:4}});
