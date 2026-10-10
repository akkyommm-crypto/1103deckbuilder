# S03-U156 — shared deck-trigger engine: recruiters, battle-destroyed searchers, クリッター / 黒き森のウィッチ (2011 texts)

## Starting point (U155, audited from the code, not from plans)
Start: `checkpoint_claude_s03_u155_control_reminders_20260925.zip` `721d4719…`, 14364 PASS / 0 FAIL;
TESTED 2238, IMPLEMENTED 86, GENERIC_OK 644, PARTIAL 174, ENGINE_GAP 607, NOT_STARTED 1247 (4996).

Recruiters / searchers existed in four independent forms:

| Form | Cards | State at U155 |
|---|---|---|
| `v41DefineAttributeRecruiter` (`cards/42_v41_native.js`) | the 6 attribute recruiters (巨大ネズミ, etc.) | TESTED. Real battle trigger. The Deck monster is chosen **at activation** (`targets:true`), and activation is blocked when no candidate exists. |
| `u52BattleRecruitScript` + individual scripts | ジュラック・ヴェロー, カラクリ兵 弐参六, XX－セイバー エマーズブレイド, コーリング・ノヴァ, ピラミッド・タートル, 紫炎の足軽, ジャイアントウィルス, 極星獣タングニョースト, おジャマ・ブルー, コアキメイル・ロック, フレムベル×2 | TESTED, real triggers — left as they are. |
| `AUTO_DECK_TABLE` (`cards/40_auto_interpreter.js`) | about 29 cards (仮面竜, 荒野の女戦士, ゴキポン, ボタニティ・ガール …) | PARTIAL. Declared `trig:"ignition"`: **an effect activated from the GY at will**, with no battle-destruction or field condition. |
| individual scripts | クリッター (TESTED), ゴブリンゾンビ (TESTED), 暗黒界の斥候 スカー (IMPLEMENTED) | See below. |

Errors against the 1103 texts:

- **クリッター**: `countLimit:1` and the log 「このターン、加えたカードとその同名カードは発動できない」 (both later errata). It was optional (the 2011 text is forced). Its `passive.onSendToGrave` fired for **any card sent to the GY from anywhere**. The effect could be activated from the GY at will (ignition). Activation was blocked with no candidate.
- **ゴブリンゾンビ**: ② had the same any-card `onSendToGrave` passive.
- **黒き森のウィッチ**: ENGINE_GAP only because the project text carries the later errata clause.
- **暗黒界の斥候 スカー**: the Deck card was chosen at activation, and the forced effect could not be activated with no candidate.
- **Engine**: the battle cleanup queued each destroyed monster's `onLeaveField`, but nothing drained it until a later chain or phase. So 「フィールド上から墓地へ送られた時」 missed battle destruction entirely.
- **Engine**: cards that left the field together, e.g. two Tributes, were drained as separate events, each with its own chain. The second trigger was only checked after the first chain had resolved.

## Engine (common first)
- **`engine/1ZT_deck_trigger_s03.js`**: `declareDeckTriggerS03(name, spec)`. The card side only declares its 2011 text:
  - `when` — `battleToGrave` (onBattleDestroy of this card) or `fieldToGrave` (onLeaveField of this card, from mz/sz/field to the GY; every route);
  - `faceUp`;
  - `action` — `summon` / `search`;
  - `from` — `['deck']` or `['hand','deck']`;
  - `filter` — atkmax/min, defmax/min, lv, lvmax/min, at, ra, name / notName (canonical identity: ハーピィ・レディ1 counts as ハーピィ・レディ), group, set, `tuner:false`;
  - `pos` — atk / def / faceDownDef / faceUp (the player chooses);
  - `optional`, `max`, `minPick` (0 for 「任意の数だけ」), `lpCost`, `extra`, `before`.

  Behaviour:
  - Regular path: trigger → activation → chain → resolution. The Deck is examined **at resolution** through the existing journaled choice UI. Only matching cards are shown. A forced effect's choice cannot be cancelled; an optional trigger can be declined in its SEGOC group.
  - No candidate: the effect resolves doing nothing more, and the Deck is shuffled.
  - Search uses `FX_SEARCH`, summon uses `FX_SPECIAL_SUMMON`; both shuffle the Deck.
  - Summon effects need a free zone to be activated; a zone full at resolution means nothing is summoned. An SS lock blocks activation (v4.4.0 rule).
  - A ライオウ-type lock blocks an optional search's activation. A forced search activates and adds nothing (v32 rule).
  - Summon conditions apply (`canEffectSpecialSummonS03`).
- **`engine/30` battle cleanup**: the destroyed monsters' `onLeaveField` events are taken out of the deferred queue by a new action, `EVENT_TAKE_S03` (`engine/00`; replay-safe). They are dispatched in the same simultaneous batch as onBattleDestroy / onDestroy / onSendToGrave.
- **`engine/30` `processDrainEventsV27`**: a head run of leave-field events (onDestroy / onSendToGrave / onRemove / onLeaveField) covering two or more cards is one `EVENT_BATCH`, i.e. one SEGOC. A single card keeps the old path.

## Cards
`cards/HZG_claude_s03_u156_deck_triggers.js` holds 28 declarations; each is one line of data plus its 2011 text as a comment.
- **A. battle-destroyed recruiters**: 仮面竜, 荒野の女戦士, ユーフォロイド, ジェネクス・サーチャー, 軍隊竜, ヘル・セキュリティ, スレイブ・エイプ, トライクラー, ヴィークラー, 幻影の魔術士, ガスタ・イグル, パンダボーグ, 素早いモモンガ.
- **B. battle-destroyed searchers**: RAI－MEI, カバリスト, キーマウス, ゴキポン, ダニポン, ドレッド・ドラゴン, バイオレット・ウィッチ, バード・フェイス, 悪魂邪苦止, 暗黒界の斥候 スカー.
- **C. field→GY searchers**: クリッター, 黒き森のウィッチ (forced; no 1ターンに1度; no activation ban), ボタニティ・ガール.
- **D. field→GY recruiters**: ガスタ・ガルド, ナチュル・クリフ.

Removed old code:
- クリッター's old script (`cards/00_generic_core.js`) and スカー's (`cards/20_control_counter.js`) were removed, not overridden, so each name is defined once.
- ゴブリンゾンビ: both effects are forced. ② uses the same field→GY self event (`deckTriggerHappenedS03`).
- The ENGINE_GAP override for 黒き森のウィッチ was removed from `data/script_status_overrides.json`.

## Tests
`tools/test_s03_u156_deck_triggers.js`: **83/0**, real DUEL paths, fixed seed, Replay-audited.

A. クリッター by battle:
- forced trigger;
- only ATK ≤ 1500 offered (1500 yes; 1600, a Spell and 2500 no);
- not cancelable, exactly 1;
- FX_SEARCH with Deck shuffle;
- the battle goes on;
- no countLimit and no 「発動できない」.

Filter edges: ATK/DEF 1500 pass, 1501 fail; Extra Deck monsters and non-monsters are excluded.

B. ブラック・ホール destroys two クリッター and 黒き森のウィッチ:
- one simultaneous chain of three forced triggers;
- all resolve (no once-per-turn);
- ウィッチ offers DEF 1500, not DEF 1600.

C / D. Tribute for サイバー・ドラゴン, and Synchro material for ゴヨウ・ガーディアン: both trigger and search.

E. Non-routes and removed behaviour — none of these trigger:
- hand → GY (手札抹殺);
- Deck → GY (おろかな埋葬);
- banished (次元幽閉);
- returned to the hand (強制脱出装置);
- ゴブリンゾンビ in the GY when another monster is destroyed.

Also, ゴキポン, 仮面竜 and クリッター in the GY are no longer ignition effects.

F. 仮面竜:
- optional trigger;
- only ATK ≤ 1500 Dragons;
- the face-up position is the player's choice;
- declined → nothing is summoned;
- no candidate → activated, resolves, Deck shuffled;
- under 大天使クリスティア → not offered.

G:
- 荒野の女戦士: EARTH Warrior ≤ 1500, Attack Position.
- 素早いモモンガ: forced, +1000 LP, choice with min 0, face-down Defense ×2.
- スカー with no candidate: activated, resolves.

H. ガスタ・ガルド and ナチュル・クリフ Tributed together:
- both trigger in one chain;
- the later link fills the last zone;
- the earlier link finds the zones full.

I. Table-driven: every other declared battle-destroyed card.
- Destroyed by an attack, it offers exactly the one matching Deck card: not a near miss of the same Type, not ワイト.
- Result in the declared position or hand; LP cost paid.
- Also: トライクラー's hand copy; 悪魂邪苦止 under the opponent's control does not search.

J. ガスタ・ガルド / ナチュル・クリフ / ボタニティ・ガール destroyed by ブラック・ホール.

**Negative control on U155** (`dist/battle.html` + this test): 26 FAIL and 2 errors (section I fails: the engine does not exist).

Existing tests updated to the 1103 behaviour (none deleted; every per-file PASS count equals U155):
- `test_s03_u02` used クリッター as its card-wide countLimit trigger; it now uses ブレイン・クラッシャー, whose 2011 text has 「1ターンに1度」.
- `test_s03_u63` A and `test_s03_u64` C activated クリッター / ゴブリンゾンビ from the GY at will. They now use the real trigger (battle destruction).
- `test_s03_u135`:
  - A counts the migrated entries through the engine pool, with the same leak / lost checks;
  - B2 drives バード・フェイス through battle destruction.
- `test_s03_u44` B identifies アキュリス's leave-field candidate inside the new simultaneous batch. The rank / forced assertion is unchanged.
- `test_s03_u01` (ライオウ + クリッター) and `test_s03_u25` (漆黒の魔王 LV4 + クリッター) pass again through the engine fix; their assertions are unchanged.

## Status (27 changes, all declared in `data/s03_status_changes.json`)
- PARTIAL → TESTED (25): 仮面竜, 荒野の女戦士, ユーフォロイド, ジェネクス・サーチャー, 軍隊竜, ヘル・セキュリティ, スレイブ・エイプ, トライクラー, ヴィークラー, 幻影の魔術士, ガスタ・イグル, パンダボーグ, 素早いモモンガ, RAI－MEI, カバリスト, キーマウス, ゴキポン, ダニポン, ドレッド・ドラゴン, バイオレット・ウィッチ, バード・フェイス, 悪魂邪苦止, ボタニティ・ガール, ガスタ・ガルド, ナチュル・クリフ.
- IMPLEMENTED → TESTED: 暗黒界の斥候 スカー. ENGINE_GAP → TESTED: 黒き森のウィッチ (ENGINE_GAP resolved: the reason was a later-errata clause).
- クリッター and ゴブリンゾンビ stay TESTED, now for their 2011 texts.
- Totals: TESTED 2238 → 2265, PARTIAL 174 → 149, IMPLEMENTED 86 → 85, ENGINE_GAP 607 → 606, GENERIC_OK 644, NOT_STARTED 1247 (4996).

## Not in this unit (next)
- The 6 attribute recruiters (`v41DefineAttributeRecruiter`) still choose at activation and block with no candidate. Migrate them onto engine/1ZT (resolution-time choice, activatable with no candidate) — S03-U157.
- Other AUTO-table recruiters / searchers need effects the table does not describe, so they are not declared here: サイバー・ラーバァ, メカウサー, プチトマボー, 素早いムササビ, ガスタ・サンボルト, 電池メン－ボタン型, オシャレオン, ジェイドナイト, バイオファルコン, スーパイ, ナチュル・チェリー, ジェムナイト, 機皇兵スキエル・アイン.
- Simultaneity: after a Tribute Summon, onNormalSummon is still a separate SEGOC after the Tributes' leave-field batch. Generalising the drain batch to every simultaneous event kind is an engine topic.
