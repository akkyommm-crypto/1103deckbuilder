# S03-U02 Per-Effect Count Limit (Claude)

Base: `checkpoint_claude_s03_u01_raioh_lock_20260911.zip`, SHA256 `04a7b2f390f865e6dfdbe3ae8e9ae495cdc7448cb7630f994b546de602ef18a2`.

## Requirement closure record

- **Requirement:** a 「1ターンに1度」 limit that the card text puts on one effect must not be used up by that card's other effects.
  - Concretely: a Flip Summon trigger must leave 「このカードは1ターンに1度だけ裏側守備表示にする事ができる」 available.
- **Root cause:** INTEGRATION_MISSING.
  - Per-card counters (`clTurn/clN`), the CHAIN_ADD count payload and the per-effect `v4EffectKey` already existed.
  - `countLimit` could not be tied to an effect, so every activation of the card, triggers included, checked and used up the same counter.
- **Measured before the fix** (U01 build): Flip Summon ステルスバード → its burn trigger resolves → self-set is refused with 「1ターンに1度までです」.
- **Closure:**
  - `countLimit:{n, scope, effects:[v4EffectKey...]}`.
    - `countLimitAppliesV32` decides whether an activation's effect key is covered.
    - `countLimitEffectKeyV32` resolves the effect key of an activation.
  - `countLeft` / `countConsume` / `countConsumePayloadV44` take that key.
  - The key is passed at V2 and legacy legality, in both CHAIN_ADD payload sites, and in legacy `runScript`.
  - Without `effects`, behaviour is unchanged (card-wide).
- **Consumers:**
  - Flip-trigger monsters with a self-set ignition: イナゴの軍勢, ガーディアン・スタチュー, スカラベの大群, ステルスバード, デス・ラクーダ, メデューサ・ワーム, 守護者スフィンクス, 番兵ゴーレム.
  - グレート・スピリット.
  - Future: ヴァジュランダ (Synchro trigger plus a 1/turn ignition).
- **Recovery:** all 9 consumers now declare the effect-scoped limit and pass real-path tests. They were already TESTED, so coverage counts do not change. The earlier TESTED status did not cover this path.
- **Remaining dependents:**
  - Legacy `defineScript` cards still use a card-wide limit and need conversion (CARD_WORK, WORK_QUEUE Q11):
    - カラクリ将軍 無零 (IMPLEMENTED): the Synchro trigger would use up the 1/turn ignition.
    - ミドル・シールド・ガードナー (TESTED): the negation would use up the self-set.
  - Checked and not affected: メンタルオーバー・デーモン and 次元合成師, whose second trigger runs from the GY. `clTurn/clN` are zone-local keys cleared on leaving the field.
  - Single-limited-effect cards with a card-wide limit that is already correct: クラッキング, エレキャノン, アースクエイク・ジャイアント, A・ジェネクス・クラッシャー, 不死式冥界砲, ナチュル・ストロベリー, スナップドラゴン, ダーク・ホルス・ドラゴン, ランサー・デーモン, アマゾネスの里.
  - Next consumer: ヴァジュランダ (U03).
- **Practical effect:**
  - The Flip Summon → trigger → set face-down again loop works in the same turn for the 9 cards.
  - Declining an optional flip trigger also leaves self-set legal, because the summon window closes (probed).
  - This unblocks the ヴァジュランダ ATK-doubling ignition after its Synchro equip trigger.

## Historical basis

- Card text limits only the position change.
- A 2011 wiki Q&A on ステルスバード presupposes returning it face-down by its own effect on the turn it was Flip Summoned.
- ヴァジュランダ (09/09/07 wiki): the equip is a trigger; the ATK doubling is an ignition whose cost sends an equip card.

## Changed files

- engine: `engine/40_legal_script_engine.js`, `engine/30_processor_chain_battle.js`
- cards: `cards/64_v64_autobuild_batch16.js`, `cards/65_v65_autobuild_batch17.js`, `cards/66_v66_autobuild_batch18.js`, `cards/67_v67_autobuild_batch19.js`, `cards/99_stat_modifier_recovery.js`
- tests: `tools/test_s03_u02_effect_count.js`, `tools/check.py`
- generated: `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`, `dist/battle.html`, `dist/battle_acode.html`

## Verification

- **`node tools/test_s03_u02_effect_count.js`:** EXIT 0, 76 PASS. For each of the 9 cards it runs a real Flip Summon, the trigger (target choices included), then self-set through the chain. It checks the CHAIN_ADD count payloads (trigger none, self-set consumed), the used-up count, and a Replay audit. It also covers:
  - a face-up self-set whose limit still applies;
  - the card-wide regression, where the クリッター trigger still consumes;
  - Undo back to before the self-set, then Redo, with a matching digest;
  - a save after the flip trigger continued in a second VM, where self-set is legal and consumes.
- **`node tools/test_s03_u01_raioh_lock.js`:** still EXIT 0 (56 PASS).
- **`python tools/check.py`:** EXIT 0, 11595 PASS / 0 FAIL (log `s03_u02_full_gate.log`).
- **`python tools/build_acode.py data/carddata.json`:** EXIT 0, cards=4996.
- **Coverage** is unchanged from U01: TESTED 2052, ENGINE_GAP 616, NOT_STARTED 1307, IMPLEMENTED 195, PARTIAL 182, GENERIC_OK 644. S03 audit: 3 declared changes (from U01), off-target 0.
- **Gated source manifest SHA256** (excluding dist/ and *.log): `a95666d5d5e3beaaec9251994cdfbd0ff3d350f9c9317a75e654996683133746`.
