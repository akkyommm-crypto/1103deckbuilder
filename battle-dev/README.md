# 1103 Duel ADS System — v4.8.0 / Codex Autobuild Ready

## S03 (Claude) — current unit: S03-U187
- Gate `python tools/check.py`: see `docs/S03_U187_REPORT.md` (deck-trigger engine: `docs/S03_U156_REPORT.md`). Card statuses (4996): TESTED 2351, IMPLEMENTED 73, GENERIC_OK 644,
  PARTIAL 121, ENGINE_GAP 599, NOT_STARTED 1208 (`data/script_coverage.json`; audit `tools/s03_status_audit.py`).
- Each unit has a report `docs/S03_Uxxx_REPORT.md`; status changes are declared in `data/s03_status_changes.json`.
- S03-U156 added the shared deck-trigger engine (`engine/1ZT_deck_trigger_s03.js`). Recruiters and searchers of the form
  「(戦闘によって破壊され｜フィールド上から)墓地へ送られた時、デッキから…」 are one line of data (`declareDeckTriggerS03`, cards/HZG).
  クリッター / 黒き森のウィッチ follow their 2011 texts: forced, no 「1ターンに1度」, no activation ban (both are later errata).
  S03-U157 moved the six attribute recruiters (キラー・トマト etc.) onto the same engine.
- S03-U158: battle protection is read from a card's text only for the unconditional 「このカードは戦闘では破壊されない」; every
  conditional / once-per-turn / protect-others protection must be declared (`protectV21`, `continuous.battleProof`, `sc.battleProof`).
- S03-U159: a Tribute Summon's Tributes and its summon success trigger together (one chain); the post-summon window follows.
- S03-U160: `battledTogetherS03(a,b)` (「このカードと戦闘を行ったモンスター」, recorded by the ATTACK action) and
  `continuous.cannotBeAttackTarget` (「相手は…を攻撃対象に選択できない」, engine/1ZU).
- S03-U161: P4 group GAERU (「ガエル」, authority P4-v6); `battleRole` ('attacker' / 'defender') in the v21 battle protection context.
- S03-U162: `sc.banishIfLeavesByOpponentEffectS03` — banished when it leaves the field by the opponent's card effect (P3 stamp on
  FX_TO_GRAVE / FX_WIPE_ZONE / FX_BOUNCE / FX_RETURN_DECK).
- S03-U163: Synchro / Xyz Summons check that the chosen materials are a legal set (`exMaterialsLegalS03`), whoever calls them.
- S03-U167: 「罠／魔法・罠カードの効果では破壊されない」 now applies in the real chain path (the v21 source kind comes from the
  action's source stamp); `declareDeckTriggerS03` takes `spec.continuous`.
- S03-U168: 「対象を取らない効果では破壊されない」 applies in the real chain path (the targeted uids are stamped on the action); the v21
  source-kind limit concerns effect destruction only.
- S03-U169: `declareDeckTriggerS03` spec.summonFlag / spec.toOpponent; GROUP.TOMABO (P4-v7); 「このターン…シンクロ素材にできない」 turn mark;
  script-level 「アドバンス召喚のためにはリリースできない」.
- S03-U170: the Battle Phase Start Step response window (POINT kind 'battleStart'); player-level 「このターン攻撃宣言できない」.
- S03-U171: player-level 「このターン、自分のモンスターは戦闘では破壊されない」 (read by battleProof); 和睦の使者.
- S03-U172 (user report): choosing Player2's saved deck leads to a start confirmation; the home screen shows both selected decks.
- S03-U173: optional destruction substitutes (`destroySubstituteS03`, engine/1ZV) — the processing pauses at the destruction and the
  protected card's controller chooses (journaled, not cancelable, save / resume); シエン / ザンジ / ヤイチ / ガチガチガンテツ.
- S03-U174: contact fusion (`declareContactFusionS03`, engine/1ZW) — the card's own procedure from the EX Deck, read from its text;
  `endPhaseReturnExEffectS03`; `cannotFusionMaterialS03`. グラン・ネオス / エアー・ネオス / フレア・ネオス / キメラテック.
- S03-U175 (user priority): contact fusion with a full Monster Zone when the material set includes an own monster.
- S03-U176: `destroyRandomHandCardS03` (random pick inside the Action, engine/1ZX), `noGraveSpecialSummonS03`; アクア / マリン・ネオス,
  XY / XZ / YZ / XYZ, VW－タイガー・カタパルト; contact 「デッキに戻す」 shuffles.
- S03-U177: a monster's linked negation (`linkNegateTargetS03`, engine/1ZY); 剣闘獣ヘラクレイノス, E・HERO ブラック・ネオス.
- S03-U178: VWXYZ－ドラゴン・カタパルトキャノン, 混沌幻魔アーミタイル.
- S03-U179: 「この効果によってエクストラデッキに戻った時」 (`epReturnedTriggerS03`); E・HERO ストーム・ネオス / マグマ・ネオス.
- S03-U180: 剣闘獣 common mechanism (`defineGladiatorS03`, tag-out, gladiator-summon mark, engine/1ZZ); 9 gladiators + セクトル.
- S03-U181: 剣闘獣 stage 2 (スパルティクス, アレクサンデル, サムニテ, オクタビウス, ゲオルディアス, ガイザレス); 「「X」以外の効果によって特殊召喚できない」.
- S03-U182: E・HERO グロー・ネオス / カオス・ネオス — every contact-fusion card of the 2011 pool is now implemented.
- S03-U183: 剣闘獣の闘器 ×4 (mandatory equip substitute `equipSubstituteS03`, return to hand), 剣闘獣の戦車, 剣闘獣の底力.
- S03-U184: 剣闘獣ダリウス / ラニスタ, 剣闘訓練所, ハンディキャップマッチ!, スレイブタイガー; v9 link 'toDeck'; summon with negated effects.
- S03-U185: `deckTriggerEffectV4S03`, 「リバースした」 record; メカウサー, サイバー・ラーバァ, 電池メン－ボタン型, ガスタ・サンボルト.
- S03-U186: first dedicated tests for 10 sample-deck cards; fixed 裁きの龍 / Sin サイバー・エンド summon procedures and 強制転移's position lock.
- S03-U187: 「Sin」 common mechanism (`declareSinS03`, engine/1ZZD); Sin 青眼 / 真紅眼 / レインボー / スターダスト.
- Follow-ups: `FOLLOW_UP_GAPS.md` (S03 section).

> v4.8.0 adds replay-safe per-card attack counts/allowances and native Unified Effects for ダイガスタ・フェニクス and カチコチドラゴン. Ordinary monsters remain limited to one attack.

> 4,996-card Codex automation support has been added without changing the v4.7.0 duel-engine baseline. Start with `START_HERE_CODEX_AUTOBUILD_JP.txt` and `CODEX_MASTER_PROMPT_4996.txt`. Coverage is tracked by `tools/script_coverage.py`; do not equate raw script count with correctness.

# 1103 Duel ADS System v4.7.0

Codex handoff checkpoint: practical Extra Deck expansion + replay-safe support primitives.

## v4.7.0 highlights
- Adds 15 Unified Effect cards focused on 1103-era Synchro/Xyz/HERO Extra Deck play.
- Adds cross-player monster-as-Equip targets and replay-safe unequip cleanup for Armory Arm.
- Adds serialized Special Summon provenance (`specialSummonedFrom` / `specialSummonKind`) for summon-trigger logic.
- Adds a generic delayed `flipUpAttackUids` reserve action used by Wind-Up Zenmaister.
- Adds controller-only Special Summon lock handling for Number 30: Acid Golem.
- Dedicated v4.7 tests plus the full regression suite are part of `tools/check.py`.
- `data/carddata.json` remains 4,996 cards; no v4.7 metadata edit was required.

## v4.7.0 Unified Effect batch (+15)
- Armory Arm
- Ancient Fairy Dragon (historical 1103 behavior)
- Iron Chain Dragon
- Wind-Up Zenmaister
- Submersible Carrier Aero Shark
- Number 30: Acid Golem of Destruction
- Number 20: Giga-Brilliant
- Number 34: Terror-Byte
- Thunder End Dragon
- Elemental HERO Great Tornado
- Elemental HERO Gaia
- Elemental HERO Nova Master
- Ally of Justice Light Gazer
- Avenging Knight Parshath
- Fabled Valkyrus

# 1103 Duel ADS System v4.4.0

Executable Replay Runner + activation-state replay hardening + new Unified Effect cards.

## v4.4.0 highlights
- Replay format 4 stores the captured initial state and can audit/replay Action Journal entries one by one.
- Replay preview supports step/back/end, exact live-state restore, and branching from a replay position.
- Replay uses `rngBefore` + exact `seq` + State Digest validation on every action.
- Count-limit consumption and continuous/field/equip `activationPending` are committed inside `CHAIN_ADD`; pending cleanup is part of `CHAIN_RESOLVE_TOP`.
- Card digest now validates internal gameplay state such as count limits, negation flags, attacked state, counters, modifiers and banish/grave metadata.
- Unified Effect additions: Penguin Soldier, Man-Eater Bug, Magician of Faith, Mask of Darkness, Naturia Beast and Naturia Landoise.

# 1103 ADS System v4.2.0

Current architecture phase: replay-safe state transitions + REMOVED-zone events + incremental Unified Effect migration.

- v4.0 architecture preserved: LOCATION / setcode / alias / RESET / Unified Effect.
- v4.1 deterministic RNG + external Action Journal + state digests are preserved.
- v4.2 actionizes EX summon prepare/commit/cancel and the summon-negation window itself.
- v4.2 adds central banish metadata/onRemove events and v4-native 《異次元の偵察機》《異次元の生還者》.
- Replay format is now v2 and includes pending summon / pending EX / deferred events in the state digest.
- Full replay playback UI remains disabled until more legacy direct-state paths are removed.

# 1103 Duel System v4.2.0

1103専用の独自デュエルエンジン。**遊ぶファイルと、AIが読む開発ソースを分離**します。

## ユーザーが使うもの
Acodeでは最終的に `dist/battle_acode.html` 1枚だけを開きます。
このAcode版はカードDBをHTMLへ内蔵するため、`file://` でもカードデータを読める設計です。

> 現在このプロジェクトZIPには元の完全カードDB本体が含まれていません。`data/carddata.json` またはカードデータ入り `data/index.html` を置けば、Acode完全版を生成できます。

```bash
python tools/build_acode.py data/carddata.json
```

## 開発版
```bash
python tools/build.py
python tools/check.py
```

出力: `dist/battle.html`

- `dist/battle.html` は生成物。直接編集しない。
- 共通ルールは `engine/`。
- カード固有処理は `cards/`。
- テストデッキは `data/80_test_decks.js`。
- バグ修正時は再現チェックを追加する。
- ADS/EDOProのコードやカードLuaはコピーしない。挙動・公式ルールを参考に独自実装する。

## Claude / ChatGPTへ渡す
巨大HTMLは渡さず、AIミニパックを作ります。

```bash
python tools/make_ai_pack.py --area chain --card "E・HERO エアーマン" --note "症状を書く"
```

詳細: `docs/AI_PACKS.md`


## v3.7.0

### カード自動化
- 《鬼ガエル》③を実装。自分モンスターを手札へ戻すコスト、通常召喚権と独立した「鬼ガエル以外のガエル」追加通常召喚権、消費処理まで自動化。
- 《トラゴエディア》③のコントロール奪取、④の墓地モンスターのレベルコピー＋End Phaseリセットを実装。①特殊召喚・②手札×600と合わせて主要4効果を自動化。
- 《マシンナーズ・フォートレス》①を実装。手札の機械族レベル合計8以上をコストにし、手札/墓地の両方から特殊召喚可能。自身をコストで捨てた場合も墓地から正しく特殊召喚する。
- 特殊召喚手順エンジンを `from:['hand','grave']` と非チェーン召喚コストに対応。
- End Phase予約処理にレベル復元予約を追加。

### ADS系UI / 操作性
- チェーンが0件ならチェーン表示領域を完全非表示。空の緑色バーを廃止。
- チェーン待機中は盤面上のチェーンリボンから1タップで `PASS`。
- 発動可能カードを青緑、召喚/攻撃などの合法アクションがあるカードを金色で視覚強調。
- 対象選択リストにカード画像を表示。裏側など非公開カードは画像を出さない。
- 下部ドックから `CHAIN 自動 / 常時 / 無視` を1タップで切替可能。
- DUELモードの墓地/除外/EX操作を「合法操作だけ」に制限。任意移動・まとめ移動はMANUAL/DEVだけに残す。
- DUELモードではデッキ内容を任意に覗けない。サーチ等の効果処理時だけ候補を表示。

### 検証
- Android/Acode実機スモークを 10 → 13シナリオへ拡張（鬼ガエル③、フォートレス①、トラゴ③を追加）。
- 総合チェック **177 PASS**。
- 明示カードスクリプト **240 unique**、内蔵カードDB **4,996枚**を維持。

## v3.5.1

自動回帰テスト: **129 PASS**。最初の5実機シナリオは主要フローをNode VMでも実行検証します。

- Android/Acode実機スモークがDEVELOPERの旧MANUAL経路を通っていた不具合を修正。
- スモーク開始時だけ自動でDUELモードへ切り替え、PASS/NG記録後に元モードへ戻す。
- テスト中は通常メニューに「📱 実機テスト結果へ」を表示。
- 《天空の宝札》後の《死者蘇生》確認を「解決時に失敗」ではなく「発動自体が不可」に修正。
- 特殊召喚のみを目的とする効果に `blocksIfNoSpecialSummon` を追加し、合法操作UIから不可能な発動を除外。
- 実機スモーク開始時に初動LEGAL ACTIONの事前診断（READY/SETUP NG）を追加。

## v3.5.0

- 明示カードスクリプトを 220 → 240 枚へ拡張。追加20枚は全て1103以前のカード。
- 「場を離れた場合に除外」を共通エンジン化し、《ゾンビキャリア》《バトルフェーダー》へ適用。
- 《魔法都市エンディミオン》の魔法解決後の魔力カウンター蓄積と、破壊カードからの魔力カウンター移送を共通化。
- 《カラクリ大将軍 無零怒》の表示形式変更時ドローをイベント駆動で自動化。
- 《真六武衆－シエン》《邪帝ガイウス》《風帝ライザー》《黄泉ガエル》《バトルフェーダー》《ブラック・ローズ・ドラゴン》など主要20枚を追加。
- Android / Acode向け実機スモークテストを9シナリオへ拡張。
- 自動回帰テストでは既存の召喚タイミング、X素材の持ち主墓地、EX帰還、ヴェーラー、v3.3/v3.4カード群を維持。

### v3.5.0で残る部分自動化

明示スクリプト240枚は「そのカードに専用処理が存在する」数であり、全効果100%実装を意味しません。特に以下は今後の優先対象です。

- 《真六武衆－シエン》・六武衆系の破壊代替。
- 《鬼ガエル》の追加通常召喚、《粋カエル》のS素材不可の完全な素材選択UI強制。
- 《トラゴエディア》のコントロール奪取・レベルコピー。
- 《ブラック・ローズ・ドラゴン》の植物族除外による第2効果。
- 《XX－セイバー ヒュンレイ》の最大3枚同時選択。
- 《マシンナーズ・ギアフレーム》のユニオン、《マシンナーズ・フォートレス》の自己特殊召喚・手札破壊。


## v3.4.0

- 明示カードスクリプトを 200 → 220 枚へ拡張。
- 六武衆10枚、代行天使周辺6枚、E・HERO4枚を追加。
- 「このターン特殊召喚できない」「Battle Phaseを行えない」を共通エンジンで強制。
- 特殊召喚失敗時に誤った召喚成功イベントを出さないよう修正。
- エンドフェイズの遅延破壊をUID＋リセットフラグで共通化。


## v3.3.0
- 明示的な `defineScript()` 対応を184枚から200枚へ拡張。
- 汎用: 《ならず者傭兵部隊》《D.D.アサイラント》。
- 墓守: 《墓守の偵察者》《墓守の末裔》《墓守の石版》《墓守の番兵》《墓守の呪術師》《墓守の長槍兵》。
- BF: 《BF－疾風のゲイル》《BF－黒槍のブラスト》《BF－月影のカルート》《BF－蒼炎のシュラ》《BF－極北のブリザード》《黒い旋風》。
- 罠: 《落とし穴》《天罰》。
- 共通エンジンに「守備表示への貫通ダメージ」を追加。長槍兵/ブラストをカード固有の戦闘計算ではなく共通処理で実装。
- `cannotSpecialSummon:true` を共通 `FX_SPECIAL_SUMMON` で強制する仕組みを追加し、《BF－極北のブリザード》を《死者蘇生》等でも特殊召喚できないよう保証。
- `tools/test_expansion_v330.js` を追加。対応200枚、貫通、特殊召喚禁止、ゲイル/カルート/シュラ/石版/天罰の重要宣言を回帰テスト。

## v3.2.1
- 召喚成功タイミングがMain Phase中に残り続け、レスキューラビット等の起動効果が発動できなくなる不具合を修正。
- 「召喚成功時の誘発」→「SS2以上のファストエフェクト確認」→「両者パス」→「オープン状態」を分離。
- 2011/3/19以降ルールどおり、召喚成功直後の応答窓では起動効果を禁止するが、その窓終了後は起動可能。
- v3.2以前の保存データ再開時に残っている古い召喚タイミングを自動破棄。
- `tools/test_summon_timing.js` を追加し、レスキューラビットの回帰テストを自動化。

## v3.2
- Acode用「カードDB内蔵単一HTML」ビルダーを追加。
- 通常ビルドは従来どおり分割ソースから生成。
- Claude/ChatGPT向けAIミニパック自動生成を追加。
- 起動時は埋め込みカードDBがあれば最優先で使用し、外部fetchを不要にできる。


## v3.2.2
- 《強制脱出装置》などのバウンス先を「現在のコントローラー」ではなくカードの持ち主で判定。
- 融合・シンクロ・エクシーズなど元々EXデッキのモンスターを手札へ戻す場合、持ち主のEXデッキへ戻す。
- EXモンスターをデッキへ戻す効果でもメインデッキへ混ぜず、持ち主のEXデッキへ戻す。
- 《死者蘇生》で相手墓地から蘇生したモンスターをバウンスした場合、元の持ち主の手札へ戻ることを回帰テストで確認。
- Xモンスターをバウンスした場合、X素材は各素材の持ち主の墓地へ送る既存処理を維持。
- MANUALの通常MOVEでも、EXモンスターを誤って手札/メインデッキへ戻さない補正を追加。

## v3.2.3
- 《異次元の女戦士》の誘発タイミングを「ダメージ計算後・墓地送り前」に修正。
- 効果無効中のモンスター効果は、発動自体は可能でもチェーン解決時に効果を適用しないよう共通エンジンを修正。
- ヴェーラー/聖杯等の個別無効は、フィールドで発動した時点の無効状態をチェーンリンクに保持する。
- 《エフェクト・ヴェーラー》を相手メインフェイズ限定、手札から墓地へ送る発動コスト、ターン終了時までの無効に修正。
- 効果無効中の任意誘発候補には「効果無効中（発動は可能）」と表示。
- `tools/test_effect_negation.js` を追加し、無効中の発動/解決、発動時無効スナップショット、女戦士のタイミングを回帰テスト。

## v3.6.1
- 《レスキューラビット》など1つの効果で複数体が同時特殊召喚されたイベントを《奈落の落とし穴》が正しく参照するよう修正。
- 《奈落の落とし穴》は対象を取らず、そのタイミングで召喚された表側・攻撃力1500以上のモンスターを解決時に全て再判定して破壊・除外する。
- 以前からフィールドにいた攻撃力1500以上のモンスターを巻き込まない。
- 解決時に攻撃力1500未満になったモンスターは破壊・除外しない。
- `FX_DESTROY_BANISH` / `API.destroyAndBanish()` を追加し、「破壊して除外」を単純な除外と区別。
- 実機スモークに「レスキューラビット2体SS → 奈落」を追加し、全10シナリオ化。
- `tools/test_bottomless_batch_v361.js` を追加。総合チェック 142 PASS。

## v3.6.0
- FIELD横長ミニカードを正式採用。
- 6フェイズレール、制約バッジ、安全なチェーンリボン、画像付き墓地/除外リストを追加。
- ブラック・ローズ・ドラゴン②、粋カエルS素材不可、XX－セイバー ヒュンレイ最大3枚を自動化。
- 299 legacy explicit scripts + 12 v4-native registrations = 311 runtime card scripts / embedded DB 4,996 cards.


## System v4.0 Architecture Phase

1103のカード追加を長期的に安定させるため、既存スクリプトを壊さずにADS/ocgcore系から「設計概念だけ」を独立実装した互換層を追加しました。

- `engine/05_ads_architecture_core.js` — LOCATION / setcode / alias / RESET
- `engine/45_unified_effect_v4.js` — Unified Effect (`condition -> cost -> target -> operation`)
- `cards/41_v4_native.js` — 新APIを使う実カード
- `tools/test_architecture_v400.js` — アーキテクチャ回帰
- `tools/test_v4_native_cards.js` — 新API実カード回帰

既存299枚は従来方式のまま動作し、新規カードから段階的にUnified Effectへ移行できます。

v4.1でAction Journalを導入し、v4.2ではEX召喚・召喚無効窓・プレイヤーフラグ等をAction化しました。完全Replay再生UIは、残る旧直接状態変更をさらに減らしてから有効化します。


## System v4.2 Replay / Removed Phase

- `EX_SUMMON_PREPARE_V42 / COMMIT / CANCEL` — S/X召喚試行をReplay可能なActionへ分割。
- `SUMMON_WINDOW_OPEN_V42 / NEGATE / CLOSE` — 召喚無効タイミングもAction化。
- `engine/07_zone_events_v42.js` — 除外遷移を一元検出し `banishInfo` と `onRemove` を生成。
- `cards/43_v42_native.js` — 《異次元の偵察機》《異次元の生還者》をUnified Effectで実装。
- `LOCATION.REMOVED` を含む全ゾーンからカード位置を取得可能。
- Replay format v2: `pendingSummon / pendingExV2 / deferredEvents` もDigestへ含める。
- `API.setFlag`、相手墓地からの《死者蘇生》、旧《貪欲な壺》の直接状態変更をAction経由へ移行。
