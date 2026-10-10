# S03-U114 — reopened U108 user bugs: saved decks (builder storage v2) + card-effect Xyz material choice

Status: **fixed in code, verified on the real UI path in the browser — NOT marked RESOLVED.** Both stay OPEN until the
user confirms on their device (per the user's instruction; U108's tests had given false confidence).

Base: clean U113 (`f928f338…`).

## 1. Saved decks — DUEL did not read the deck builder's current storage

User report (reproduced on device): `data/80_test_decks.js` only read `deck1103:` (legacy). The builder (v90) stores decks
at `deck1103v2:<internal id>`; U108's fixtures never contained a v2 key.

Builder contract (read from the builder itself: `Documents/Codex/2026-09-23/new-chat/outputs/index.html`, SHA256
`d4a2f9fe9d943590609e6c7f56d408bb7814445c5382dfbdcce0260d7d7b2979`, lines 2115–2204):
`LEGACY_DECK_PREFIX='deck1103:'`, `DECK_V2_PREFIX='deck1103v2:'`, `DECK_MIGRATION_KEY='deck1103v2:migrated'`;
record `{id, name, cards:[{n,q}], side:[{n,q}], candidates, memo, date}`; legacy → v2 migration is non-destructive with
`id = legacyDeckId(name)` (FNV-1a, `legacy_<base36>`); `work1103:current` holds the deck being edited.

Fix (`data/80_test_decks.js`, `engine/00_state_actions.js`):
- v2 is canonical; the migration marker is never a deck; each row keeps `id`, `name`, `cards`, `side`, `date`.
- legacy `deck1103:` and the older collection keys stay readable (backward compatible); `work1103:current` stays.
- dedupe legacy vs v2: a legacy record is dropped when a v2 record has the same builder id (`legacyDeckIdS03` =
  the builder's `legacyDeckId`) or the same normalized signature (name + sorted cards + side, no sourceKey). v2 records
  are never deduped against each other → same-name decks with different ids are both listed.
- selection by stable key (`loadSavedById('v2:<id>')`, legacy `'legacy:<id>'`, id-less legacy `'src:<key>#<hash>'`),
  not by array index; names are HTML-escaped. `SET_NEXT_DECK` now also records `deckId` and `side`.

Tests: `tools/test_s03_u114_saved_decks_v2.js` 21/0 — every record is written by the builder's own storage code
(verbatim extract: `tools/fixtures/deckbuilder_v90_storage.js`, source path + SHA recorded). T1 v2-only; T2 marker;
T3 legacy-only → builder migration → one row (v2 wins) → edited v2 still one row; T4 same name / different ids;
T5 builder `saveDeck` + `listDecks` ids == DUEL ids, reversed storage order, P1/P2 selection by id, explicit start.
Negative control on the U113 build: v2-only storage lists **nothing** (the device symptom), T3–T5 fail.

## 2. Xyz material detach — card effects always removed the first material

User report (reproduced on device): `API.detachMaterial(p, mzIndex, reason)` sent `FX_DETACH` without a material, and
`FX_DETACH` used index 0. U108 only fixed the manual `openXyzDetachPick` UI.

Fix — generic capability `engine/1ZF_xyz_detach_choice_s03.js`:
- `requestDetachMaterialS03({player, holderUid|mzIndex, count, reason, cancelable, cont, contArgs, cancelCont})`
  (also `API.requestDetachMaterial`): P1 ChoiceRequest, declare-kind candidates keyed by material UID, `min=max=count`
  (an answer with the wrong count is refused), automatic only when exactly `count` materials exist. Continuations are
  registered names + JSON args → a save inside the choice resumes.
- `detachCostS03:{count, reason, holders?, after?, targets?}` on a script or v4 effect; `prepareDuelActivation` runs it
  as a P1.1 prepared activation (JSON descriptor → holder choice if several → material choice → registered target
  choice → `commitPreparedActivationV11`); cancelling aborts before anything moves. `runScript` (non-DUEL) uses the
  same declaration with closure continuations.
- `FX_DETACH {materialUid}`: one action per material, owner's GY; an unknown UID now detaches nothing (no silent
  fallback to index 0). `API.detachMaterial` accepts `opts.materialUid`.
- The old per-card `cost()` bodies that detached the first material were deleted. So that code calling a script's or
  v4 effect's `cost()` directly still behaves correctly, `defineScript` and `createEffectV4` (before the freeze) give a
  script/effect that declares `detachCostS03` without its own `cost` a delegating `cost` that runs the same choice.
  (Found by the first U114 Full Gate, which failed in `test_v450_native_cards.js`; the pre-gate scan had been run before
  the dead-cost removal — re-scanned afterwards.)

Consumer audit (every `API.detachMaterial` / `FX_DETACH` user):

| card | kind | classification |
|---|---|---|
| No.39 希望皇ホープ, インヴェルズ・ローチ | cost 1 | choice (detachCostS03) |
| エヴォルカイザー・ラギア | cost 2 | choice of 2 (detachCostS03 count 2) |
| No.11 ビッグ・アイ | cost 1 + card target | choice + registered target |
| No.16 ショック・ルーラー | cost 1 + declaration | choice + registered declaration |
| 虚空海竜リヴァイエール, ヴァイロン・ディシグマ, ダイガスタ・フェニクス, 発条機甲ゼンマイスター, No.34 テラ・バイト | cost 1 + target | choice + registered target (ディシグマ's once-per-turn flag in `after`) |
| グレンザウルス, イビリチュア・メロウガイスト, カチコチドラゴン, No.17 リバイス, No.20 ブリリアント, 潜航母艦エアロ・シャーク, サンダーエンド・ドラゴン, No.10 イルミネーター | cost 1 | choice |
| エクシーズエナジー, 皇の波動 | cost 1 from one of your Xyz monsters | holder choice + material choice |
| No.30 アシッド・ゴーレム (Standby), 始祖の守護者ティラス (End Phase) | mandatory detach during resolution | controller's choice, not cancelable |
| スペース・サイクロン | detach during resolution from the targeted Xyz | activating player's choice |
| 鬼神の連撃 | cost: detach ALL materials | automatic is correct (no choice exists) |
| manual field UI (`openXyzDetachPick`) | 1 material | automatic; 2+ already chose (U108) |

Tests: `tools/test_s03_u114_xyz_detach_choice.js` 51/0 on the real DUEL path —
A ホープ (opponent attack declaration → effect → choose 2nd → only it leaves → attack negated), A2 cancel aborts,
B ローチ (summon window), C ラギア (2 of 3; 1-of-2 answer refused), D ownership (opponent-owned material → owner GY;
Big Eye's registered target step), E Replay (chosen UIDs journaled; audits clean), F SaveLoad (save inside the Ragia
choice → reload in a fresh context → same candidates / count → answer → continues), G single material auto / unknown
UID, H 13 more consumers live, I スペース・サイクロン, J static guard (no first-material call left except 鬼神の連撃).
Negative control on the U113 build: A–G fail (ホープ removed ガガガマジシャン with no prompt).
Existing tests updated because they pinned the defect: U51 ショック・ルーラー (now answers the material prompt),
U76 ティラス (chooses the 2nd material and asserts which one left), v490 batch01 (source check of the new primitive),
v480 native cards (フェニクス / カチコチ: checked the literal old `detachMaterial` call → now check the declaration),
destruction_protection_cards (皇の波動 with 2 materials: now asserts the prompt, then answers it).

## 3. Acceptance on the real UI (browser pane, same origin http://127.0.0.1:8765, U114 `dist/battle.html` + the user's
builder `index.html`)
Note: this run used the U114 build before the `cost()` delegation above was added (`dist/battle.html` `dfe3800f…`).
The delegation only changes direct `cost()` calls, not the activation pipeline or the deck list driven here; the
dedicated tests (saved decks 21/0, Xyz detach 51/0) cover both paths again on the final build.
- Saved decks: in the builder UI, built and saved「E2E検証P1デッキ」(Main 5 / EX 1) and, via ⋮ →「＋ 新規デッキ」,
  「E2E検証P2デッキ」(Main 6) → localStorage held only `deck1103v2:deck_feab2144-…`, `deck1103v2:deck_d4268d01-…`,
  `deck1103v2:migrated` (no legacy key — the device scenario) → builder「デュエル」→ DUEL「デッキを読み込む」listed both
  (no marker row) → Player1 tapped P1 deck (`deckId` kept, Main 5 / EX 1, field untouched) → Player2 tab → P2 deck →
  ≡ →「選択デッキで新規デュエル」→ duel started with both decks (P1 5-card hand + EX ホープ; P2 5 of 6).
  The builder's「新規デッキ」uses a native `confirm()`, which the pane cannot click; it was answered OK by overriding
  `window.confirm` (test automation only).
- Xyz: board fixture (P1 サイバー・ドラゴン; P2 ホープ with ガガガマジシャン + ゴブリンドバーグ); attack declared → the
  real attack-declaration sheet offered ホープ → tapped → sheet「取り除くX素材を選択してください / プレイヤー II が選択」
  listed both, nothing detached yet → tapped ゴブリンドバーグ → C1 ホープ built, ガガガマジシャン still material,
  ゴブリンドバーグ in P2 GY → passes → attack negated (no battle, LP 8000/8000, both monsters on field).

## Gate
- First Full Gate: `GATE_EXIT=1` — `tools/test_v450_native_cards.js` (direct `cost()` calls after the per-card detach
  costs were removed). Fixed (delegating `cost()`), all related tests re-scanned.
- Second Full Gate: `GATE_EXIT=0`, 13630 PASS lines (U113 13552 + new/updated assertions), 0 FAIL, no Traceback /
  ReferenceError; the single caught `TypeError` stack at the start of `test_auto_cycle32.js` is the recorded noise.
- Coverage unchanged (no card status change); audit 116 declared, 0 off-target.
- Acode regenerated for the user's device check: `dist/battle_acode.html` `c0bfdbba…` (contains both fixes).
