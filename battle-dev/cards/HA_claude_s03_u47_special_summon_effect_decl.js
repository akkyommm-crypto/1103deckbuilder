/* S03-U47 (C-S03-37 dependent recovery) SPECIAL_SUMMON_EFFECT declarations for the scripted cards of Astra's 13 fixed lists.
   U46 made 《神の警告》 and 《王宮の弾圧》 answer a chain link only through specialSummonEffectLinkS03; a card whose activated effect
   Special Summons but whose script did not declare it could not be answered at all.
   Found by a read-only scan of logs/1103_MAJOR_DECKS_v1 (61 cards with a Special Summon sentence, 42 unseen) and classified by card text
   and script structure (probe of the loaded scripts: v4 effect keys, legacy trigger events, whether the resolution Special Summons).
   2011 sources: yugioh-wiki 《神の警告》 age 35 (2011-08-03) — only activations whose effect includes a Special Summon are answered
   (10/04/17); 《王宮の弾圧》 age 42 (2011-08-28) — an effect of a Special Summon card other than its Special Summon effect is not
   answered (09/04/15); token Special Summons are answered (《ブラック・ガーデン》《スケープ・ゴート》).
   Not declared (recorded in the unit report): 《冥府の使者ゴーズ》 (its own Special Summon is chain-less and answered at the summon
   timing, age 35 note), 《暗黒界の術師 スノウ》 and 《暗黒界の龍神 グラファ》 (a Special Summon only in some cases or a summon-rule
   Special Summon; no 2011 ruling found for their activations). Unscripted cards cannot form a chain link and are not declared. */
declareSpecialSummonEffectS03({
  /* several activated effects: only the one that Special Summons */
  'スターダスト・ドラゴン': link=>link.v4EffectKey==='end-return',        // ② End Phase: Special Summon itself (① negates, no Special Summon)
  'アームズ・エイド': link=>link.v4EffectKey==='unequip-self',             // unequip and Special Summon (equip / burn do not)
  'カラクリ大将軍 無零怒': link=>link.eventName==='onSpecialSummon',       // ① on Synchro Summon (② draw on position change does not)
  'カラクリ将軍 無零': link=>link.eventName==='onSpecialSummon',           // on Synchro Summon (the position change does not)
  'TG ワーウルフ': link=>link.eventName!=='onEndPhase',                    // ① from the hand (② End Phase search does not)
  /* the only activated effect Special Summons */
  'BF－極北のブリザード': true,
  'BF－精鋭のゼピュロス': true,
  'BF－蒼炎のシュラ': true,
  'BF－大旆のヴァーユ': true,
  'カラクリ忍者 九壱九': true,
  'ジュラック・グアイバ': true,
  'スケープ・ゴート': true,
  'スポーア': true,
  'ダンディライオン': true,
  'デブリ・ドラゴン': true,
  'ドッペル・ウォリアー': true,     // ① from the hand and ② tokens both Special Summon
  'ハイドロゲドン': true,
  'ローンファイア・ブロッサム': true,
  'ワン・フォー・ワン': true,
  '暗黒界の尖兵 ベージ': true,
  '創造の代行者 ヴィーナス': true,
  '墓守の偵察者': true,
});
