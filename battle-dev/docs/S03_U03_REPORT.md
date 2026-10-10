# S03-U03 Recovery — Dragunity Synchro Line and Search-then-Hand (Claude)

Base: `checkpoint_claude_s03_u02_effect_count_20260911.zip`, SHA256 `98dc7cba67f10215b3c4705af170696184d16161745705d5efa540317c49a5c4`.

This is a dependent-recovery unit for requirements already closed at the foundation level:
- C-S03-02 PER_EFFECT_COUNT_LIMIT
- C-S03-01 DECK_TO_HAND_LOCK
- System01 GRAVE_EQUIP

It adds one card-side shared contract, C-S03-03 SEARCH_THEN_HAND. There are no engine changes.

## Requirement closure record

- **Requirement**
  - Deliver the Dragunity Synchro plays that the grave-equip, per-effect-limit and deck-to-hand-lock contracts exist to support.
  - Put the "1/turn: search, then discard or send one card from hand" pattern behind one contract that honours the lock in both steps.
- **Root cause**
  - CARD_WORK: the consumers had no scripts, or had a coarse auto-table entry. The contracts they need already existed.
  - VALIDATION_MISSING: no real Synchro-path evidence existed for these cards.
- **Closure**
  - **ヴァジュランダ**
    - Synchro-success grave-equip trigger (reuses `as01EquipEffect`).
    - 1/turn ignition: send one equip card as cost, then add current ATK until end of turn. Declared as `countLimit:{n:1,effects:['double']}`, so the trigger consumes nothing.
  - **バルーチャ**
    - Any-number grave-equip targets, capped by free S/T zones.
    - If a target leaves the GY in chain, the others still resolve. If zones are short at resolution, nothing is equipped.
    - +300 per equipped Dragunity card.
  - **C-S03-03** (`S03_SEARCH_THEN_HAND` table plus registry handlers `claudeS03.search-then-hand` / `-move`)
    - At resolution, a Deck choice leads to `API.searchDeck`. If the lock blocks the search, nothing further happens. Otherwise a hand choice follows, then a discard or a send to GY.
    - `blocksIfNoDeckToHand` prevents activation under the lock.
    - Handler args are JSON only, so the choice resumes after save/load.
- **Consumers**
  - ドラグニティナイト－ヴァジュランダ, ドラグニティナイト－バルーチャ, ドラグニティナイト－ガジャルグ (Dragunity).
  - ラヴァルバル・ドラグーン (Laval): the other-theme check of C-S03-03.
  - The Dragunity Synchro line Dux → Phalanx → Synchro.
- **Recovery**
  - ヴァジュランダ NOT_STARTED → TESTED.
  - バルーチャ NOT_STARTED → TESTED.
  - ガジャルグ PARTIAL (auto table) → TESTED.
  - ラヴァルバル・ドラグーン NOT_STARTED → TESTED.
  - Evidence is listed below.
- **Remaining dependents**
  - **② other dependency**
    - ドラグニティアームズ－ミスティル: its summon-procedure cost runs through a closure path (Q5).
    - ドラグニティアームズ－レヴァテイン: summon-procedure cost (banish an equipped monster), plus "sent to GY by the opponent's effect → Special Summon its equipped monster".
    - ドラグニティ－プリムス・ピルス: equip from the Deck to another monster (monster-as-equip cluster).
    - ヴァイロン・エプシロン: equip-card targeting protection.
    - ヴァイロン・オメガ: a Normal-Summoned filter for its destroy.
  - **Not path-tested**
    - バルーチャ's zone-shortage fizzle (2010-07-01). It is implemented, but no 1103-legal chain with TESTED helpers can shrink its controller's free zones before it resolves.
    - ヴァジュランダ using the opponent's equip card as cost (2010-06-17). It is allowed by the implementation but not path-tested.
  - **Not examined in this unit:** other C-S03-03-shaped cards (searched only by text pattern; none beyond the two consumers were found).
- **Practical effect**
  - The Dragunity line is now playable on a real path: Normal Summon Dux → equip Phalanx → Phalanx Special Summons itself → Synchro ヴァジュランダ → its equip trigger → ATK doubling. The doubling expires through the real End Phase and turn change.
  - ガジャルグ's search engine and バルーチャ's multi-equip now work under real play. ガジャルグ was previously a coarse auto-table entry without the lock ruling.
  - Laval players get ラヴァルバル・ドラグーン.

## Rulings used (2011-era wiki snapshots)

- **ヴァジュランダ**
  - Equip is a trigger; doubling is an ignition; it doubles current ATK, not original (09/09/07).
  - Sending an equip card is a cost (09/09/07).
  - The opponent's equip card on it may be used (10/06/17).
  - The doubled value is treated as fixed until end of turn, the same as リミッター解除's 「エンドフェイズまで数値は固定」.
- **バルーチャ**
  - Targets any number at activation (10/01/22), up to the free S/T zones (10/01/23).
  - Remaining targets still equip if one is banished (10/06/17).
  - No equip if zones are short at resolution (10/07/01).
- **ガジャルグ**
  - Search and discard happen in order (09/07/05).
  - Cannot be activated under ライオウ (09/07/05).
  - If ライオウ appears in chain, neither step happens (09/08/29).
  - Can be activated with no Dragon or Winged Beast in hand.
- **ラヴァルバル・ドラグーン:** if ライオウ applies at resolution, no search and no send (11/05/10).

## Changed files

- cards: `cards/H1_claude_s03_dragunity.js` (new)
- build: `build_manifest.json` (H1 is placed after H0 and before `40_auto_interpreter.js`, so ガジャルグ's auto-table entry is skipped)
- tests / audit: `tools/test_s03_u03_dragunity.js`, `tools/check.py`, `data/s03_status_changes.json` (+4 declared)
- generated: `data/script_coverage.json`, `data/s03_status_audit.json`, `docs/SCRIPT_COVERAGE.md`, `dist/battle.html`, `dist/battle_acode.html`

## Verification

- **`node tools/test_s03_u03_dragunity.js`:** EXIT 0, 57 PASS.
  - ヴァジュランダ
    - Real Dux → Phalanx → Synchro, with the material combo check.
    - The trigger's target filter excludes the Winged Beast.
    - The trigger consumes no count.
    - The cost choice resolves before the chain; ATK goes 1900 → 3800.
    - The count is used and there is no reuse.
    - Real End Phase plus turn change restores 1900.
    - With a Harpie Lady 1 aura: 2200 → 4400.
  - ガジャルグ
    - Resolution Deck choice: Lv4-or-lower Dragon or Winged Beast only.
    - Mandatory discard choice; FX_SEARCH before FX_DISCARD; 1/turn.
    - Illegal under ライオウ.
    - When the lock is restored by スキルドレイン destroyed by a chained サイクロン, neither step happens.
    - A pending Deck choice saved and continued in a second VM ends with the same digest.
  - バルーチャ
    - Synchro with a Dragon Tuner plus a Lv6 Winged Beast.
    - Multi-target choice (min 1, max 4, Winged Beast excluded); three equips; ATK 2900.
    - Partial resolution when エンジェル・リフト Special Summons one target in chain: ATK 2600.
  - ラヴァルバル・ドラグーン
    - FIRE Synchro; Laval-only search; send is FX_HAND_SEND_GRAVE, not a discard; 1/turn.
    - Illegal under ライオウ; the chain-restored lock skips both steps.
  - Replay audit on every scenario.
- U01 (56 PASS) and U02 (76 PASS) tests also pass on this build.
- **`python tools/check.py`:** EXIT 0, 11652 PASS / 0 FAIL (log `s03_u03_full_gate.log`).
- **`python tools/build_acode.py data/carddata.json`:** EXIT 0, cards=4996.
- **Coverage:** TESTED 2052 → 2056; NOT_STARTED 1307 → 1304; PARTIAL 182 → 181; IMPLEMENTED 195; ENGINE_GAP 616; GENERIC_OK 644. S03 audit: 7 declared changes, 0 off-target. Static registrations 2247 → 2251.
- **Gated source manifest SHA256** (excluding dist/ and *.log): `ecef7888bd8f62c832a92f03835beec2070aaf165602afe67495fffc1027e01b`.
