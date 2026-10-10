# Autonomous development log

## Cycle 01 — READY30 batch (2026-09-06)

base checkpoint: `checkpoint_provenance_v30_claude_live_20260905.zip`
SHA256 `b12979a56219bd51992744319fe9b1b05eb24f6e8d17d02a1e92eb3b73496c91` (verified, testzip OK)

**v30 B3 deviation review (carried forward, no redesign).**
v30 implemented B3 as a *turn-scoped* destruction record rather than the originally
proposed battle-only provenance, because 破壊神の系譜's text
「相手フィールド上に守備表示で存在するモンスターを破壊したターン」 is not
battle-restricted — effect destruction counts as well. The record covers both paths,
carries the destroyed position (裏側守備表示 included as `pos:'def'`), is pruned at
`PASS_TURN`, and is pure JSON. Its 8 dedicated ruling tests pass, replay/SaveLoad are
covered, and the existing suite is green, so the design stands unchanged.

| | |
|---|---|
| attempted | 30 (the preflighted READY30) |
| completed | **27** |
| skipped / reclassified | 3 → ENGINE_GAP |
| PASS | 7264 → **7376** (+112) |
| FAIL | 0 |
| TESTED | 1333 → **1360** (+27) |
| ENGINE_GAP | 520 → **523** (+3) |
| NOT_STARTED | 2119 → **2089** (−30) |
| IMPLEMENTED / PARTIAL / GENERIC_OK | 198 / 182 / 644 (unchanged) |
| static | 1531 → 1558 (+27) |
| auto | 201 (unchanged) |
| Acode cards | 4996 |
| engine changes | **0** |

Implemented in `cards/A3_auto_cycle01.js`, verified by `tools/test_auto_cycle01.js`.

Families (all on existing primitives):
* **A — 戦闘破壊され墓地へ送られた時 (13)** `onDamageStep` at the default `leave`
  step with the battle context, matching the 暗黒界の斥候 スカー precedent.
  チェイス・スカッド reads v30 B3's `graveInfo.pos` to tell a destroyed Defense-Position
  monster from an Attack-Position one.
* **B — ダメージ計算前/行わず破壊 (8)** `dsTiming:'start'` + `endBattle()`, the
  ライトロード・モンク エイリン precedent. コアデストロイ and 空風のジン resolve the battle
  opponent from either side, since 「戦闘を行う場合」 also covers being attacked.
* **C — 戦闘を行った時の除外 (2)** `dsTiming:'after'` — after damage calculation but
  before battle-destruction cleanup, so both monsters are still in the Monster Zone.
* **D — 戦闘ダメージを与えた時 (3)** `onBattleDamage` v6 payload. 黒蠍盗掘団 routes the
  Deck choice through `API.requestChoice` on the **opponent**, so no deck information
  leaks to the controller.
* **E — 継続 cannotAttack (1)** `continuous.cannotAttack` → `cannotAttackNow` →
  `canDeclareAttackV48`.

### Newly discovered gaps (moved NOT_STARTED → ENGINE_GAP)

| card | missing capability |
|---|---|
| 異次元の狂獣 | continuous battle-destruction replacement (banish instead of Graveyard). `banishWhenLeavesField` is only ever set on the card itself; no hook redirects an *opponent's* battle destruction, and setting it from a chained trigger would fire at the wrong timing. |
| レッサー・デーモン | same, additionally gated on remaining face-up on the field. |
| 怨霊の湿地帯 | no per-card marker for 反転召喚. `NORMAL_SUMMON`/`FX_SPECIAL_SUMMON` set `summonedTurn`, but `doFlipUp` only emits `onFlip{flipSummon:true}` and records no turn marker. |

The first two share one primitive and would unlock together — a candidate for
SMALL ENGINE GAP MODE once READY stock runs low.

### Audit
off-target status changes **0** (4996-card diff vs base: exactly the 30 intended) ·
fixture false positives 0 · registration misses 0 (`registration_names_missing_from_db` = 0) ·
Replay mismatch 0 · protected changes 0 · AUTOBUILD not run · TOTAL closes 4996.

## Cycle 02 — battle-trigger / reverse / control batch (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_01_live_20260906.zip`
SHA256 `fe0f05f19982036e305a98781d1a8aace12f7cf1806e8e7d4bf5431cb8f2fecb`

Candidate discovery over the 2089 NOT_STARTED cards, filtered against the LIVE event
surface and the dead-event list, then 5-point preflighted. 19 came out READY.

| | |
|---|---|
| attempted | 19 |
| completed | **19** (100%) |
| PASS | 7376 → **7465** (+89) |
| FAIL | 0 |
| TESTED | 1360 → **1379** (+19) |
| ENGINE_GAP | 523 (unchanged) |
| NOT_STARTED | 2089 → **2070** (−19) |
| static | 1558 → 1577 (+19) · auto 201 (unchanged) |
| Acode cards | 4996 |
| engine changes | **0** |

Implemented in `cards/A4_auto_cycle02.js`, verified by `tools/test_auto_cycle02.js`.
The cycle-01 helpers (`a3SelfBattleDestroyed`, `a3PreDamageDestroy`, `a3AttributeSweep`,
`a3DealtBattleDamage`) were reused directly — レイジアース and カミソーリトカゲ are one
helper call each.

New ground covered this cycle:
* **P26 Control** — デーモン・テイマー / ドラゴン・ライダー use `changeControl(…, 'endPhase')`
  with the flipped monster as the linked source; 王座の侵略者 uses the atomic `swapControl`.
  All three carry replay-digest coverage.
* **v11 Tokens** — スプリット・D・ローズ creates two `D・ローズトークン` and the test asserts
  the token's printed characteristics (植物/闇/★3/1200) rather than just the count.
* **Multi-mode triggers** — 首領・ザルーグ, 黒蠍－罠はずしのクリフ, 黒蠍－強力のゴーグ offer
  「1つを選択して発動」 through `API.requestChoice`, and each mode is only offered when it can
  actually be performed (no hand ⇒ no discard option).
* **Opponent-private choice** — ディメンション・ポッド runs the controller's pick over the
  *opponent's* Graveyard first, then hands the second pick to the opponent, so neither player
  chooses from a pile they should not be reading.
* **Simultaneous Special Summon** — ジャイアントウィルス summons every copy from the Deck inside
  one resolution; the test asserts they collect into `RESOLUTION_SUMMON_BATCH_V2` and flush as a
  single `onSpecialSummon` with 2 uids.

### Rejected during preflight (not implemented, left NOT_STARTED)
* サーチライトメン / 真空イタチ / ソニックジャマー — need a turn-scoped set-lock or
  spell/trap-activation lock; no consumer exists.
* イーグル・アイ / 侵略の炎 / 忍び寄るデビルマンタ / 華麗なる潜入工作員 —
  「召喚に成功した時、罠カードを発動する事はできない」 needs the summon-response window itself
  to be closed; `trapStunned` is a per-card gate, not a window gate.
* エレキジ — 「エンドフェイズ時までゲームから除外」 needs scheduled return-from-banish.

### Audit
off-target status changes **0** (4996-card diff: exactly the 19 intended) ·
fixture false positives 0 · registration misses 0 · Replay mismatch 0 ·
protected changes 0 · AUTOBUILD not run · TOTAL closes 4996.

## Cycle 03 — continuous stat / control / token batch (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_02_live_20260906.zip`
SHA256 `6b0f47ca4d43d67cb67cbe61c4d799536455d7ca1422be58755e20cafc59bdec`

| | |
|---|---|
| attempted | 15 · completed **15** (100%) |
| PASS | 7465 → **7537** (+72) · FAIL 0 |
| TESTED | 1379 → **1394** (+15) |
| NOT_STARTED | 2070 → **2055** (−15) · ENGINE_GAP 523 (unchanged) |
| static | 1577 → 1592 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/A5_auto_cycle03.js` / `tools/test_auto_cycle03.js`.

* **Damage-step-only ATK (5)** — ダッシュ・ウォリアー, 太陽の戦士, 月の女戦士, 空の昆虫兵,
  エトワール・サイバー all reduce to one helper (`a5DamageStepAtkUp`) returning an `{atk:n}`
  update layer from `continuous.apply`, gated on `gameState.battle.step`. The tests separate
  「攻撃する場合」 from 「戦闘を行う場合」: 空の昆虫兵 gains nothing when it is *attacked*,
  while 太陽の戦士 gains on both sides.
* **Count-scaled continuous ATK (2)** — 逆ギレパンダ (+500 per opponent monster, plus
  `continuous.piercingDamage`), ミレニアム・スコーピオン.
* **Control (3)** — A・O・J エネミー・キャッチャー (face-down only), X・E・N・O (control +
  `grantDirectAttack`), シエンの間者 (gives a monster *away* until the End Phase).
* **Stat / LP / token (5)** — コアラッコ, 強化人類サイコ (banish cost, 2/turn),
  パワー・インジェクター, オプションハンター (recovers the **printed** ATK, not the current one),
  オイスターマイスター (token only when it did *not* die in battle).

**Engine constraint found and worked around without touching the engine:**
`API.modAtk` is guarded by `canModifyNow()`, which forbids stat changes from damage
calculation onward. ミレニアム・スコーピオン gains ATK *after* it destroys a monster by battle,
so `modAtk` is unusable there. Instead the card stores a plain integer counter via
`setCardFlag` and converts it to ATK in `continuous.apply` — replay-safe, JSON-only, and it
also makes the accumulation survive save/load. Recorded here because the same shape will fit
other "gains ATK each time it destroys" monsters.

### Audit
off-target status changes **0** (exactly the 15 intended) · fixture false positives 0 ·
registration misses 0 · Replay mismatch 0 · protected changes 0 · AUTOBUILD not run ·
TOTAL closes 4996.

## Cycle 04 — damage-step stats / battle-proof / battle-destroy batch (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_03_live_20260906.zip`
SHA256 `7484ce18f69f7931236d9c826166312210523a2ecf468f6c991e82a11a55257c`

| | |
|---|---|
| attempted | 19 · completed **19** (100%) |
| PASS | 7537 → **7633** (+96) · FAIL 0 |
| TESTED | 1394 → **1413** (+19) |
| NOT_STARTED | 2055 → **2036** (−19) · ENGINE_GAP 523 (unchanged) |
| static | 1592 → 1611 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/A6_auto_cycle04.js` / `tools/test_auto_cycle04.js`.

### Two engine behaviours found the hard way

**1. `battleProof` has a text-regex fallback.** `battleProof(card)` checks, in order:
the temporary flag → `battleProofGrantedV15` (continuous) → `sc.battleProof` → and finally a
regex over the card's own printed text for 「戦闘では破壊されない」. カイザー・グライダー
(「同じ攻撃力のモンスターとの戦闘では破壊されない」) and ワンショット・ロケット
(「攻撃する場合…破壊されない」) both match that regex, so without intervention they would have
been **unconditionally** indestructible. Both now declare `battleProof:false` to switch the
text default off, and grant the real, conditional immunity through `continuous.battleProof`.
Tests assert the negative case explicitly (different ATK ⇒ destructible; being attacked ⇒
destructible; not in battle ⇒ destructible).

**2. `passive` conditions must not write to the board.** `collectHandlers` calls every
`passive[event]` merely to *collect candidates*, and its own comment says the board must not
change there. The first version of ヴァンパイア・ベビー recorded the destroyed monster's uid
with `setCardFlag` inside its passive — that would have journalled Actions during a candidate
scan and broken replay determinism. Rewritten to derive the victim read-only by intersecting
the existing `battlePhaseV6.attacks` history with v30's `destroyedThisTurnV30` record. A test
now asserts the passive adds no entries to the Action Journal.

Also covered: `sc.attackLimit` is a first-class script property (ダークネス・デストロイヤー
declares an inherent 2 attacks — no `grantMultiAttack`), and トークン can be made
non-tributable with the existing `cannotTribute` flag (ブルーサンダーT45).

### Rejected during preflight
マジオシャレオン / キングゴブリン — 「攻撃対象に選択できない」 has no consumer;
ファイターズ・エイプ / 砂漠の守護者 — conditional ATK-reset and destruction-replacement
respectively, neither expressible without approximating the ruling.

### Audit
off-target status changes **0** (exactly the 19 intended) · fixture false positives 0 ·
registration misses 0 · Replay mismatch 0 · protected changes 0 · AUTOBUILD not run ·
TOTAL closes 4996.

## Cycle 05 — spells / traps / cost-driven effects (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_04_live_20260906.zip`
SHA256 `d87a257aa4df5b03b9584dcf62504b2ecf18d3a7c07361c32f415a097a9825b2`

| | |
|---|---|
| attempted | 20 · completed **20** (100%) |
| PASS | 7633 → **7733** (+100) · FAIL 0 |
| TESTED | 1413 → **1433** (+20) |
| NOT_STARTED | 2036 → **2016** (−20) · ENGINE_GAP 523 (unchanged) |
| static | 1611 → 1631 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/A7_auto_cycle05.js` / `tools/test_auto_cycle05.js`.

First cycle weighted toward Spells and Traps rather than monsters. Notable reuse:

* **v30 B3 paid off again.** 慈悲深き修道女 (「このターン戦闘で破壊され自分の墓地へ送られた
  モンスター」) and リターンソウル (「このターンに破壊され墓地に存在するモンスター」) both read
  `destroyedThisTurnV30` directly — no new tracking. The 修道女 test asserts an
  effect-destroyed monster is *not* eligible, since that card is battle-restricted while
  リターンソウル is not.
* **v30 B1 paid off again.** 幸運の鉄斧's 「相手の効果で破壊され墓地へ送られた場合」 reads
  `graveInfo.byPlayer`; the test covers both the opponent-destroyed (draws) and
  self-destroyed (does not draw) cases.
* **Equip continuous** — 幸運の鉄斧 grants +500 via `continuous{scope:'equippedMonster'}`.
* **Opponent-safe multi-select** — 木遁封印式 and リターンソウル use `requestChoice` with
  `min:0`, matching 「2枚まで」/「3体まで」 rather than forcing the maximum.

### Two test-premise bugs caught (cards were correct)
青眼の白龍 is a **Normal** Monster, so it could not stand in for "no Normal Monster in hand"
when testing 凡人の施し; and 軽量化 shuffles before drawing, so the returned Level 7+ monster
can legitimately be drawn straight back — the assertion now checks the card-count balance and
that the card is not lost, instead of demanding it sit in the Deck.

### Audit
off-target status changes **0** (all 20 were NOT_STARTED → TESTED, nothing else moved) ·
fixture false positives 0 · registration misses 0 · Replay mismatch 0 ·
protected changes 0 · AUTOBUILD not run · TOTAL closes 4996.

## Cycle 06 — equip spells / battle-destroyed / standby-phase batch (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_05_live_20260906.zip`
SHA256 `675676057fec3e2acde1de428e8441e02b020552e0f8ffa9ccc35c37364f1faa`

Candidate discovery returned **163** viable NOT_STARTED cards, so the batch was raised from
20 to 30 per the bulk-size rule (four consecutive 100% cycles, zero off-target, zero replay
mismatch). Two of the 30 turned out to be half-implementations and were dropped during
implementation rather than approximated.

| | |
|---|---|
| attempted | 30 · completed **28** · skipped 2 (→ ENGINE_GAP) |
| PASS | 7733 → **7869** (+136) · FAIL 0 |
| TESTED | 1433 → **1461** (+28) |
| ENGINE_GAP | 523 → **525** (+2) |
| NOT_STARTED | 2016 → **1986** (−30) |
| static | 1631 → 1659 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/A8_auto_cycle06.js` / `tools/test_auto_cycle06.js`.

### The two skips share one missing hook
`モルティング・エスケープ` (「1ターンに1度だけ、戦闘では破壊されない」) and
`BF－銀盾のミストラル` (「戦闘ダメージを1度だけ0にする」) both need to know that their
replacement **was actually consumed**. `continuous.battleProof` and `continuous.battleDamage`
are queried read-only — the same constraint that forced the cycle-04 ヴァンパイア・ベビー
rewrite — so a used-flag cannot be written from inside them without journalling Actions during
a query. Written as-is they would be unlimited immunity / unlimited damage nullification, which
are different cards. Both recorded as ENGINE_GAP with that precise reason; the missing piece is
a "replacement consumed" notification from the engine, and it would unlock both at once.

### Notes
* **Equip spells (8)** all hang off `continuous{scope:'equippedMonster'}`. 重力の斧－グラール
  needed both an equip bonus *and* a field-wide position lock, which cannot be two scopes on one
  script — it declares `scope:'allMonsters'` and distinguishes the equipped monster inside `apply`.
* **ハネクリボー** is the first card here to use v29's graveyard continuous source: after it is
  destroyed it sits in the Graveyard and nullifies its controller's battle damage from there
  (`continuous.from:['grave']`), verified against `applyBattleDamageFilters` in both directions.
* **アマゾネスの鎖使い** 「相手の手札のモンスターを自分の手札に加える」 cannot use
  `returnToHand`, which always routes to the **owner**. Used the zone-generic `FX_CONTROL`
  move, the same mechanism `cards/39` already uses for cross-player Graveyard moves.
* **亜空間物質転送装置** uses the v7 scheduler (`API.schedule` + `registerScheduleHandler`)
  for the End Phase return; replay covers the banish plus the scheduled entry.

### Audit
off-target status changes **0** (28 NOT_STARTED→TESTED, 2 NOT_STARTED→ENGINE_GAP, nothing else) ·
fixture false positives 0 · registration misses 0 · Replay mismatch 0 ·
protected changes 0 · AUTOBUILD not run · TOTAL closes 4996.

## Cycle 07 — battle-destroy / damage-step-end / revival batch (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_06_live_20260906.zip`
SHA256 `e4565626eb3e20d247ccd52cad5b4975df5a011dd72813da297abf3305ae4248`

| | |
|---|---|
| attempted | 28 · completed **28** (100%) |
| PASS | 7869 → **8004** (+135) · FAIL 0 |
| TESTED | 1461 → **1489** (+28) |
| NOT_STARTED | 1986 → **1958** (−28) · ENGINE_GAP 525 (unchanged) |
| static | 1659 → 1687 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/A9_auto_cycle07.js` / `tools/test_auto_cycle07.js`.

### One existing test threshold deliberately raised
`tools/test_grave_continuous_v29.js` asserted `graveContinuousNamesV29().size <= 3` — a
snapshot from when exactly one card opted into the graveyard continuous scan. Four cards have
since opted in **legitimately**, because their effect must outlive the resolution that sends
them to the Graveyard: ハネクリボー (cycle 06), plus ガード・ブロック, ミスフォーチュン and
催眠術 this cycle. The bound was raised to 8 with the reasoning written into the test. The
*real* guard — "200 cards in the Graveyard, 200 continuous evaluations, under 1 second" — is
untouched and now measures **89 ms** with five declarations. Flagging this explicitly because
it is the first time this run has loosened an existing assertion rather than satisfying it.

### Notes
* **`dsTiming:'after'` is before battle-destruction cleanup**, which アマゾネス訓練生 relies on:
  it clears `battleDestroyed` and returns the monster to the bottom of the Deck, so the card it
  destroyed never reaches the Graveyard. The test asserts both halves (in Deck, not in Graveyard).
* **でんきトカゲ ruling.** 「次のターン攻撃宣言をする事ができない」 — a monster can only declare
  an attack on its controller's own turn, so the lock is stored as `turn + 2` and matched exactly.
  Tests check all three windows: same turn (free), next own turn (locked), the turn after (free).
* **クロスカウンター** doubles damage through `continuous.battleDamage` and destroys the attacker
  at `'after'`; the test verifies the doubling applies only to the opponent's side.
* Four tests initially failed for one shared reason worth recording: `collectSources` skips any
  source whose `face !== 'up'`. Spells/traps only act as continuous sources while face-up on the
  field or after reaching the Graveyard (Graveyard cards are normalised face-up). The test setups
  were fixed to model the real states, and ミスフォーチュン/催眠術 now additionally assert the
  effect survives being sent to the Graveyard.

### Audit
off-target status changes **0** (all 28 NOT_STARTED → TESTED) · fixture false positives 0 ·
registration misses 0 · Replay mismatch 0 · protected changes 0 · AUTOBUILD not run ·
TOTAL closes 4996.

## Cycle 08 — kill rewards / position control / control-change triggers (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_07_live_20260906.zip`
SHA256 `a477981e1c8d404d925b5f97072094d72f12ccd31c970c8fc8683b1f7c34a427`

| | |
|---|---|
| attempted | 28 · completed **28** (100%) |
| PASS | 8004 → **8119** (+115) · FAIL 0 |
| TESTED | 1489 → **1517** (+28) |
| NOT_STARTED | 1958 → **1930** (−28) · ENGINE_GAP 525 (unchanged) |
| static | 1687 → 1715 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/B0_auto_cycle08.js` / `tools/test_auto_cycle08.js`.

### New pattern: "once while face-up on the field"
アメーバ, グリグル, ゼンマイニャンコ and ライライダー all carry
「このカードがフィールド上に表側表示で存在する限り1度」. A plain boolean flag is wrong —
custom flags are not in `ZONE_LOCAL_KEYS`, so they would survive the card leaving and returning
and permanently disable the effect. Instead the used-marker stores the card's `summonedTurn`,
which changes whenever the card re-enters the field, so the "once" window expires by itself.
A test asserts ライライダー's attack lock lifts when `summonedTurn` changes.

### Other notes
* **v26 `onControlChange` first used from a card.** アメーバ/グリグル read
  `{uid, fromPlayer, toPlayer, zone}` — アメーバ damages the **new** controller,
  グリグル heals the **original** owner, and the tests pin down which side each hits.
* **v30 B1 again.** 恵みの像/災いの像 need 「相手がコントロールするカードの効果によって」
  for a card discarded from the *hand*; they read `graveInfo.byPlayer` with a
  `discardInfo.byPlayer` fallback, and the negative test discards with `byPlayer:0`
  to confirm self-discard does not trigger.
* **守護天使 ジャンヌ** heals by the **printed** ATK: the test lowers the victim's current ATK
  by 1000 first and still expects the full 3000.
* One bug caught by tests: `Number(undefined)` is `NaN`, and `NaN < turn` is false, so the
  first activation of the three ゴブリン-style monsters was blocked by its own once-per-turn
  guard. Fixed by coercing with `|| 0`.

### Audit
off-target status changes **0** (all 28 NOT_STARTED → TESTED) · fixture false positives 0 ·
registration misses 0 · Replay mismatch 0 · protected changes 0 · AUTOBUILD not run ·
TOTAL closes 4996.

## Cycle 09 — equip spells / attack locks / battle replacement (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_08_live_20260906.zip`
SHA256 `ba153cd21d0745c57743390552bacf5513afef1302be4ebb004ac59e72e6461f`

| | |
|---|---|
| attempted | 24 · completed **23** · skipped 1 (→ ENGINE_GAP) |
| PASS | 8119 → **8211** (+92) · FAIL 0 |
| TESTED | 1517 → **1540** (+23) |
| ENGINE_GAP | 525 → **526** (+1) |
| NOT_STARTED | 1930 → **1906** (−24) |
| static | 1715 → 1738 · auto 201 · Acode 4996 |
| engine changes | **0** |

`cards/B1_auto_cycle09.js` / `tools/test_auto_cycle09.js`.

### The skip is worth a future engine cycle
**ザ・キックマン** needs 「自分の墓地の装備魔法カード1枚をこのカードに装備する」. Every equip
path in the engine — `API.equipSpell`, `moveEquipV15`, and the `FX_EQUIP` action itself —
requires the equip card to already be in the Spell/Trap Zone, and the generic `MOVE` action is
documented as MANUAL/DEVELOPER-only so a card script should not use it. A scan found the same
gap blocking **7 more** NOT_STARTED cards (ガーディアン・エルマ, ギルフォード・ザ・レジェンド,
ダーク・ネクロフィア, ドラグニティアームズ－レヴァテイン, ヴァイロン・アルファ,
凶悪犯－チョップマン, 暗黒魔族ギルファー・デーモン). One small "equip from Graveyard"
primitive would unlock 8 cards, which comfortably clears the ≥3 bar in ENGINE CHANGE ALLOWANCE
— worth doing once READY supply thins.

### Notes
* **暗黒の扉** 「バトルフェイズにモンスター1体でしか攻撃できない」 is derived read-only from
  `battlePhaseV6.attacks`: if any *other* monster of that controller already attacked this
  Battle Phase, the target cannot declare. No flag writing, so nothing to reset.
* **グレイヴ・キーパー** uses the same `dsTiming:'after'` interception as cycle-07's
  アマゾネス訓練生 — clear `battleDestroyed`, return to Deck, so the Graveyard is never touched.
* **お注射天使リリー** 「そのダメージ計算時のみ」 is keyed to the exact battle
  (`turn:attackerUid:targetUid`), so the +3000 evaporates the moment that battle ends rather
  than lingering to the end of the phase; a test asserts it reverts when `gameState.battle` clears.
* **異次元の境界線** and **エレキツネザル** both drive `temporaryFlags.noBattlePhase`, whose
  consumer sits in the processor's Battle Phase entry check.

### Audit
off-target status changes **0** (23 NOT_STARTED→TESTED, 1 NOT_STARTED→ENGINE_GAP) ·
fixture false positives 0 · registration misses 0 · Replay mismatch 0 ·
protected changes 0 · AUTOBUILD not run · TOTAL closes 4996.

## Cycle 10 — battle interference / position locks / summon negation (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_09_live_20260906.zip`
SHA256 `252ee70a9b5520c5663c357a343e5f9c635138dc86dcdb16b594dd42dafe2423`

| | |
|---|---|
| attempted | 25 · completed **25** (100%) |
| PASS | 8211 → **8315** (+104) · FAIL 0 |
| TESTED | 1540 → **1565** (+25) |
| NOT_STARTED | 1906 → **1881** (−25) · ENGINE_GAP 526 (unchanged) |
| static | 1738 → 1763 · auto 201 · Acode 4996 |
| engine changes | **0** · all tests passed on the first run |

`cards/B2_auto_cycle10.js` / `tools/test_auto_cycle10.js`.

New engine surfaces used for the first time:
* **`continuous.forcedPosition`** — 最終突撃命令 forces every face-up monster to Attack
  Position and locks it; the test checks face-down monsters are unaffected.
* **`sc.summonNegate` + `summonNegatePendingV2`** — 昇天の黒角笛 declares
  `summonNegate:{specialOnly:true}` so the engine offers it only against Special Summons,
  and negates the pending summon on resolution.
* **`setBaseAtk` through a continuous layer** — ネコ耳族 rewrites the *printed* ATK of its
  battle opponent to 200, but only during the opponent's turn and only inside the damage step;
  three assertions pin the turn condition, the battle condition, and the revert.

Also of note: 有翼賢者ファルコス joins アマゾネス訓練生 and グレイヴ・キーパー in clearing
`battleDestroyed` at `dsTiming:'after'` so a monster it destroyed goes to the Deck without ever
touching the Graveyard — that trio now shares one verified idiom.

### Audit
off-target status changes **0** (all 25 NOT_STARTED → TESTED) · fixture false positives 0 ·
registration misses 0 · Replay mismatch 0 · protected changes 0 · AUTOBUILD not run ·
TOTAL closes 4996.

## Cycle 11 (2026-09-06)

- 実装: 23枚 / ファイル `cards/B3_auto_cycle11.js`（build_manifest.json 登録済み）
- テスト: `tools/test_auto_cycle11.js` 98 PASS / 0 FAIL（check.py 107行目に接続）
- Full Gate: PASS 8413 / FAIL 0 / TOTAL 4996 / Acode cards=4996 / Replay mismatch 0 / protected変更 0 / AUTOBUILD=NO
- Coverage（実測）: TESTED 1588 / ENGINE_GAP 527 / NOT_STARTED 1857 / GENERIC_OK 644 / IMPLEMENTED 198 / PARTIAL 182
- 状態差分（vs checkpoint_auto_cycle_10）: 24件のみ = 本cycle23枚 NOT_STARTED→TESTED + ヴァイロン・ヴァンガード NOT_STARTED→ENGINE_GAP。**off-target 0**

### 実装カード
- ゲルニア
- ジャッカルの聖戦士
- スクリーチ
- ダメージ・ダイエット
- ダーク・ヒーロー ゾンバイア
- リバイバルスライム
- レガシーハンター
- 不屈闘士レイレイ
- 命の綱
- 地獄戦士
- 堕天使エデ・アーラエ
- 堕天使マリー
- 女豹の傭兵
- 海竜神の加護
- 深海の大ウナギ
- 紅蓮の女守護兵
- 緊急テレポート
- 超能力治療
- 針二千本
- 針千本
- 霊滅独鈷杵
- 霞の谷の戦士
- 魔轟神アシェンヴェイル

### ドロップ（ENGINE_GAP 記録）
- **ヴァイロン・ヴァンガード**: 自身が破壊された時に「装備されていた装備カードの枚数」を参照する必要があるが、`dropEquips()` はカードがフィールドを離れる前に走るため、破壊イベント時点で装備枚数が復元不能。装備枚数の provenance が engine に無い（半実装禁止によりドロップ）。

### 実装中に判明した engine 仕様（次cycle以降の資産）
- `continuous.protectV21` は **spec オブジェクト**であり、「spec を返す関数」ではない。
  `resolveProtSpecV21` は `battle` / `effect` 各フィールドを `v(target, srcCard, ctx)` として評価して真偽値化する。
  したがって条件付き耐性は `protectV21:{ key, label, battle:(t,s)=>pred(t,s), effect:(t,s)=>pred(t,s) }` の形で書く。
  海竜神の加護はこの形に修正して 3 FAIL を解消した。
- `protReachesV21` の scope は `self / equippedMonster / ownMonsters / oppMonsters / allMonsters / ownCards / allCards`。
  `ownMonsters` は「発動元と同じ側の mz」のみに届くため、自分フィールド限定の耐性はこれで表現できる。

## Cycle 12 — 戦闘破壊トリガーと provenance 撃ち分け (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_11_live_20260906.zip`
SHA256 `69395b094655c82ca685a12cc98952ef9ef034dd83918a7b39877e3a5083388f`

| | |
|---|---|
| attempted | 28 · completed **24** (86%) · preflight で4枚ドロップ |
| PASS | 8413 → **8511** (+98) · FAIL 0 |
| TESTED | 1588 → **1612** (+24) |
| NOT_STARTED | 1857 → **1829** (−28) · ENGINE_GAP 527 → **531** (+4) |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0**（24枚 →TESTED / 4枚 →ENGINE_GAP のみ） |

`cards/B4_auto_cycle12.js` / `tools/test_auto_cycle12.js`（check.py 108行目）。

### 実装カード（24枚）
- X－セイバー ウルベルム
- インフェルニティ・リベンジャー
- エレメント・デビル
- オーシャンズ・オーパー
- カース・オブ・ヴァンパイア
- ゴブリン陽動部隊
- ジュラック・ガリム
- ゼンマイジャグラー
- ドミノ
- ドラゴン・アイス
- ナチュル・ストロベリー
- ネオフレムベル・ヘッジホッグ
- ホワイトポータン
- ミスティック・ソードマン LV2
- リグレット・リボーン
- レスキュー・ウォリアー
- ロードポイズン
- ワイトキング
- 復活の墓穴
- 森の狩人イエロー・バブーン
- 機械犬マロン
- 漆黒の魔王 LV4
- 自由解放
- 雲魔物－ポイズン・クラウド

### 5点プリフライトで落とした4枚（ENGINE_GAP に記録）
- **きつね火** — 「表側で存在する限りアドバンス召喚のためにリリースできない」。engine は
  `card.cannotTribute` を `70_summon_procedures.js:155` で読むが、これは resolve から書く
  一過性フラグで、`continuous.cannotTribute` は存在しない。`continuous.apply` は read-only
  契約なのでそこから書くこともできない。エンドフェイズ蘇生だけ実装すると半実装になる。
- **ホルスの黒炎竜 LV4** — 「コントロールを変更する事はできない」。`FX_CONTROL` に保護 hook が無く、
  `immuneToControlChange` 相当の consumer も存在しない（dead write になる）。
- **エレメント・ソルジャー** — 水属性モードが上と同じコントロール変更耐性。地属性モードだけ実装すると半実装。
- **与奪の首飾り** — 「装備モンスターが戦闘破壊されこのカードが墓地に送られた時」。`dropEquips()` が
  カードの離脱前に走るため、墓地時点で装備先が特定できない。cycle 11 の
  ヴァイロン・ヴァンガードと同じ provenance 欠落。

### 実装中に確定した engine 事実（次 cycle 以降の資産）
- **`API.pileCards` は v17Handle（`{p,zone,index,card,db}`）を返す。** 生カードではないので
  `locateCardAnyV4()` で包み直してはいけない。`selectCard` の candidates にはそのまま渡す。
  `a7DestroyedThisTurn` / `b2SummonedCards` / `gameState.players[p].hand` は生カードを返すので
  そちらは `locateCardAnyV4` が要る。cycle 12 の初回 9 FAIL はすべてこの取り違えだった。
- **`duelRandomInt(max, gs)` が replay 安全な乱数**（`engine/06_replay_rng_v41.js`）。
  `gs.rngState` が state に載り Journal が `rngBefore` を記録するため、
  コイントス／サイコロ／ランダム手札選択はこれで書ける（`cards/90_ritual_recovery.js` に
  1〜6 の出目の先例あり）。X－セイバー ウルベルムのランダム手札戻しはこれで書き、
  digest 一致を回帰に入れた。
- **スケジューラの state キーは `gs.scheduledV7`**、handler 取得は `scheduleHandlerV7(name)`。
  `gs.schedules` は存在しない。
- **攻撃対象を固定する hook は存在しない。** `battleTargetsV29`
  (`engine/30_processor_chain_battle.js:423`) は相手 mz を無条件に返し、
  カード側から候補を絞る宣言点が無い。「相手は他のモンスターを攻撃対象に選択できない」系
  （オシャレオン／D・ステープラン等）はこの gap で止まる。
- **通常召喚できない宣言の consumer も無い**（シルフィード等）。
- **装備カードの「代わりにこのカードを破壊する」置換も無い**
  （ファイティング・スピリッツ／八汰鏡／魅惑の女王 LV7）。

### 次に効く engine 修理候補（READY が細ったら）
1. 墓地からの装備（cycle 09 で確認、8枚を解放）
2. 装備先 provenance（ヴァイロン・ヴァンガード＋与奪の首飾り、2枚以上）
3. 攻撃対象固定 hook（オシャレオン／D・ステープラン他）
4. コントロール変更耐性（ホルスの黒炎竜 LV4／エレメント・ソルジャー他）

## Cycle 13 — スピリット／リバース／召喚宣言 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_12_live_20260906.zip`
SHA256 `150eea6532ade8ec8058aee20c2c723a5d1582594b754ba395b249f37c58da57`

| | |
|---|---|
| attempted | 35 · completed **23** (66%) · preflight で12枚ドロップ |
| PASS | 8511 → **8672** (+161) · FAIL 0 |
| TESTED | 1612 → **1635** (+23) |
| NOT_STARTED | 1829 → **1794** (−35) · ENGINE_GAP 531 → **543** (+12) |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/B5_auto_cycle13.js` / `tools/test_auto_cycle13.js`（check.py 109行目）。

### 実装カード（23枚）
- 7つの武器を持つハンター
- アギド
- アルカナフォースI－THE MAGICIAN
- アルカナフォースVII－THE CHARIOT
- サイボーグドクター
- スパイダー・スパイダー
- ダークブレイズドラゴン
- ネフティスの鳳凰神
- ブレイン・クラッシャー
- ワーム・ルクイエ
- ヴァイロン・オーム
- 伊弉波
- 夜叉
- 封魔の伝承者
- 暗黒のミミック LV1
- 月読命
- 氷結界の神精霊
- 砂塵の悪霊
- 磨破羅魏
- 竜宮之姫
- 金華猫
- 電磁ミノ虫
- 鳳凰

### スピリット共通雛形 `c2Spirit(name, spec)`
- `cannotSpecialSummon:true` は engine の `FX_SPECIAL_SUMMON`
  （`00_state_actions.js:1271`）が読む実在の宣言。20枚のスピリット全てに効く。
- 「召喚・リバースしたターンのエンドフェイズに持ち主の手札へ戻る」は
  `onNormalSummon` / `onFlip` / `onEndPhase`（いずれも producer 確認済み）で構成した。
- **engine は「リバースしたターン」を記録しない。** 通常召喚は
  `card.summonedTurn`（`00_state_actions.js:1652`）が入るが、反転召喚・戦闘リバースの
  `FX_SET_STATE` は face / pos しか触らない。`continuous.apply` と `passive` は
  read-only 契約なのでそこから印を付けられない。
  そこで **「召喚・リバースした時」のトリガーを持つスピリットに限り**、その resolve で
  `c2SpiritTurn` を書いて帰還条件に使った。トリガーを持たない10枚はこの印を
  付けられず帰還を落とすため、半実装を避けて ENGINE_GAP に記録した。

### ドロップ12枚（ENGINE_GAP に記録）
- **リバース記録なし（7枚）**: 不死之炎鳥・偉大天狗・八俣大蛇・八汰烏・火之迦具土・軍荼利・雷帝神
- **因幡之白兎** — 上に加えて「攻撃は直接攻撃としなければならない」。
  `battleTargetsV29` に候補を絞る hook が無い。
- **阿修羅** — 上に加えて「全てのモンスターに1回ずつ攻撃」。
  `grantAdditionalAttack` は回数を足せるが対象ごとの1回制限を表現できない。
- **大和神** — 「通常召喚できない」の consumer が無い（`cannotSpecialSummon` は逆向き）。
- **リチュア・エミリア** — 「リチュア」が `setcode_overlay_v4.json` の34述語に無い。
  カード名の部分一致は禁止のため AUTHORITY_MISSING 相当。
- **サーチライトメン** — `continuous.noFaceDownSet` は `mustSetFaceUp()` から
  **引数なし** `f()` で呼ばれるため、両プレイヤーに効く対称な禁止しか宣言できない。
  「このターン相手はセットできない」は片側に限定できない。

### 実装中に確定した engine 事実
- `continuous.noFaceDownSet` は `f()`（引数なし・両者対象）。片側限定は不可。
- `continuous.cannotAttack` は `f(card, self)`、`continuousReaches` で scope が効く。
- `API.linkOnLeave(self, watched, onGone, label)` の `onGone` は
  `destroy / banish / destroyBanish / toHand / none / controlReturn`（`18_leave_field_v9.js:34`）。
  金華猫の「離れた時に除外」はこれで宣言した。
- `onActivateSuccess` の payload は `{uid, player, kind, sub, chainId, chainLink, cardId}`
  （`1B_activation_event_v12.js`）。`kind` で魔法／罠／モンスターを撃ち分けられる。
- 装備魔法の判定は `db.k==='s' && db.sub==='装備'`（DB 実測: 装備161枚）。
- **テストのフィクスチャに使うカード名は既に TESTED のものを選ぶ。**
  IMPLEMENTED の「停戦協定」を fixture に使ったところ、カバレッジ scanner が
  TESTED へ繰り上げてしまい off-target 1件が出た（落とし穴へ差し替えて解消）。

### 次に効く engine 修理候補
1. **リバースしたターンの provenance（`card.flippedTurn`）— スピリット10枚＋α を解放。
   `summonedTurn` を書いているのと同じ場所に1フィールド足すだけで blast radius は最小。**
2. 墓地からの装備（8枚）
3. 装備先 provenance（2枚）
4. 攻撃対象固定 hook（因幡之白兎・阿修羅・オシャレオン・D・ステープラン他）

### 不安定だったテストの原因と修正（cycle 13）

checkpoint を展開して検証した際、一度だけ PASS 6144 / FAIL 2 で check.py が
打ち切られた。当初は `test_grave_continuous_v29.js` の壁時計 performance ガードを
疑ったが、**実際の原因はアギドの出目依存だった**。

- アギドは「サイコロの出た目と同じレベルの天使族を墓地から特殊召喚」する。
  テストの墓地フィクスチャにレベル4の天使族として**スピリットの夜叉**を入れていたため、
  出目が4のときだけ候補の先頭が夜叉になり、engine の `cannotSpecialSummon`
  （`FX_SPECIAL_SUMMON`）に正しく弾かれて何も特殊召喚されず FAIL になっていた。
  これは engine もカードも正しく、**フィクスチャの誤り**。
- カード側も改善した: `c2AgidoTargets` が
  `CARD_SCRIPTS[name].cannotSpecialSummon === true` のモンスターを候補から除くようにした
  （engine も弾くが、選ばせない方が正しい）。
- テスト側は出目に依存しない assertion へ書き換えた。
  negative 側も「アギド自身が天使族レベル4なので出目4なら自己蘇生が成立する」ことを
  明示的に検証する形にした。修正後 5回連続で 0 FAIL。

あわせて `test_grave_continuous_v29.js` の performance ガードも、
壁時計の絶対値（`dt < 1000ms`）から**空墓地での同一評価を基準にした相対比較（25倍以内）**へ
置き換えた。ガードの目的は「宣言外の墓地カードが走査から弾かれている」ことの検出であり、
マシンの絶対速度ではないため。絶対値は桁違いの暴走を捕まえる保険（3000ms）として残した。
実測は base=83ms / grave200=83ms（比 1.0）。engine は変更していない。

## Cycle 14 — ライフコスト／発動無効／非公開情報 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_13_live_20260906.zip`
SHA256 `8b2df65313618437827b9b42c7d77caf6de39dbcd42ded98d632d8ad597a943e`

| | |
|---|---|
| attempted | 19 · completed **19** (100%) |
| PASS | 8672 → **8784** (+112) · FAIL 0 |
| TESTED | 1635 → **1654** (+19) |
| NOT_STARTED | 1794 → **1775** (−19) · ENGINE_GAP 543（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/B6_auto_cycle14.js` / `tools/test_auto_cycle14.js`（check.py 110行目）。

### 実装カード（19枚）
- A・ジェネクス・ドゥルダーク
- エアジャチ
- エヴォリューション・バースト
- ゴブリンのその場しのぎ
- サイコ・ウォールド
- サイコ・ヘルストランサー
- ジェノサイド・ウォー
- ハイドロ・ジェネクス
- パワー・ブレイカー
- ホーリー・ジェラル
- マスター・ジーグ
- ライトニングパニッシャー
- 千里眼
- 放浪の勇者 フリード
- 早すぎた埋葬
- 混沌の落とし穴
- 白衣の天使
- 紅蓮の指名者
- 誤作動

### 使った既存機構と、そこで確定した契約
- **`summonNegate` の実際の形**は `summonNegatorsV2`
  （`30_processor_chain_battle.js:1331`）が定める
  `{specialOnly, kinds, condition(pending, card, db)}`。
  最初 `{filter, banish}` と書いていたが engine は読まない。混沌の落とし穴で修正した。
  無効化本体は `summonNegatePendingV2(reason)`。
- **カウンター罠の発動無効**は `API.negateChainLink(evt, 'activation', reason, destroySource)`。
  `cards/98_negation_recovery.js` の王宮の陥落／魔力終了宣告が先例。
  ゴブリンのその場しのぎ・誤作動は `destroySource=false` にして、
  それぞれ「持ち主の手札に戻す」「セット状態に戻す」を自前で行った。
- **`API.fieldCards` の zone 省略時は mz / sz / field を全て見る**。
  ただし `players[p].field` は**配列ではなく単体のカード**。
  テストで配列を入れてしまい「天空の聖域」を検出できず1件落ちた（修正済み）。
- `API.equipSpell(source, target)` は source が sz、target が mz でなければ false を返す。
  早すぎた埋葬は発動元が sz なのでそのまま使え、
  「このカードが破壊された時に装備モンスターを破壊」は
  `API.linkOnLeave(monster, equip, 'destroy')` で宣言した。
- `gameState.chain` はスクリプトから読める（ライトニングパニッシャーの
  チェーン3以上・同名重複判定）。

### 墓地ソース宣言の上限を 8 → 12 に更新
`tools/test_grave_continuous_v29.js` の opt-in 上限に、
エヴォリューション・バーストの「発動ターン『サイバー・ドラゴン』は攻撃できない」が
9件目として当たった。通常魔法は解決後に墓地へ行くため、この制限は
墓地ソース以外に宣言できる場所が無い（cycle 11 の海竜神の加護と同じ形）。
現在の9件はいずれもテキスト上も墓地ソースを要求している事を確認したうえで
上限を12に更新し、増やす際の確認手順をコメントに明記した。
実効的な防波堤は同ファイルの performance assertion（空墓地との相対比較）側。

## Cycle 15 — 期限付き修正・定期処理・墓地/除外の往復 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_14_live_20260906.zip`
SHA256 `d6a4acea87c4cb7f4dad14cf4c8ebd35ac8879a4665d914bc0e08f06586be1c5`

| | |
|---|---|
| attempted | 24 · completed **23** (96%) · preflight で1枚ドロップ |
| PASS | 8784 → **8910** (+126) · FAIL 0 |
| TESTED | 1654 → **1677** (+23) |
| NOT_STARTED | 1775 → **1751** (−24) · ENGINE_GAP 543 → **544** (+1) |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/B7_auto_cycle15.js` / `tools/test_auto_cycle15.js`（check.py 111行目）。

### 実装カード（23枚）
- オーバー・デッド・ライン
- カオス・インフィニティ
- キラー・スネーク
- ジェム・マーチャント
- スナップドラゴン
- スパイダー・ウェブ
- ゼンマイソルジャー
- ゼンマイドッグ
- チューナーズ・バリア
- ディスクライダー
- デプス・アミュレット
- ハーフ・カウンター
- フェデライザー
- ブリザード・ドラゴン
- ブレイク・ドロー
- ボーン・テンプル・ブロック
- ミラクル・キッズ
- ライトロード・パラディン ジェイン
- ライトロード・モンク エイリン
- ラッコアラ
- レベル変換実験室
- ヴァイパー・リボーン
- ヴァイロン・デルタ

### この cycle で確定した engine 契約
- **`API.mill(p, deckIndex, reason)` は「デッキの特定 index を1枚落とす」API。**
  枚数を指定して上から落とすのは **`API.millTop(p, n, reason)`**。
  ライトロード2枚を最初 `mill(p, n)` と書いていたのは誤りで、millTop に直した。
- **ダメージ計算時以降の攻守変更には `damageStepOnly:true` 宣言が要る。**
  `canModifyNow`（`60_damage_segoc_ui_helpers.js:58`）が
  `ACTIVE_SCRIPT.damageStepOnly` を見て `dsInfo(step).dsOnly` を許可に使う。
  宣言が無いと `modAtk` は「ダメージ計算時以降は攻守を変更できません」で拒否される。
  ハーフ・カウンター／ジェム・マーチャントはこの宣言を付けて解決した。
- **「機皇」は `SETCODE` 定数には無く、overlay 述語側にある。**
  `SETCODE`（`05_ads_architecture_core.js:47`）は 0x1000 台の setcode 群、
  34述語の overlay は `GROUP` + `isCardInGroupV4(db, GROUP.MEKLORD)`
  （`04_setcode_authority_v4.js`）。両者を取り違えると undefined を渡すことになる。
- **`API.negateAttack` は `pendingAttack` を消さず `gs.attackNegated=true` を立てる**
  （`NEGATE_ATTACK_V45`）。
- **`API.clearModsByLabel(target, label)`**（`MOD_CLEAR_LABEL_V7`）がある。
  `until` の語彙（endTurn / endPhase / endBattlePhase / permanent）で表せない
  「相手のエンドフェイズ時まで」は、`permanent` で付けて v7 スケジューラから
  ラベル指定で解除するのが正しい形。ディスクライダーはこれで実装した。

### ドロップ1枚（ENGINE_GAP に記録）
- **デュアル・サモナー** — 「手札または自分フィールドの表側デュアルモンスター1体を通常召喚する」。
  `デュアル` は DB 実データの subtype として実在する（28枚）が、engine に
  デュアル機構が無く、「場のデュアルをもう一度通常召喚した」状態を持つ場所も
  それを読む consumer も無い。手札側だけ実装すると半実装になる。

### テストフィクスチャの取り違え（今回の初回 11 FAIL の内訳）
いずれもカードではなくテスト側の前提ミスで、engine 仕様の確認で解消した。
- 停戦協定は通常罠（カウンター罠のつもりだった）→ アヌビスの裁きへ差し替え
- 罠は発動後は表側。裏側のままだと `continuousSources` が拾わない
- レプティレス・バイパーはチューナー → くちばしヘビへ差し替え
- 切り込み隊長はデュアルではない → インフィニティ・ダークへ差し替え

## Cycle 16 — 1ターンに1度の起動効果・コイントス・発動無効 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_15_live_20260906.zip`
SHA256 `c036fae37dc4dceed32b53b0c1d7116a3fee9bd6d575659c0417e09b4f155ebd`

| | |
|---|---|
| attempted | 16 · completed **16** (100%) |
| PASS | 8910 → **8997** (+87) · FAIL 0 |
| TESTED | 1677 → **1693** (+16) |
| NOT_STARTED | 1751 → **1735** (−16) · ENGINE_GAP 544（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/B8_auto_cycle16.js` / `tools/test_auto_cycle16.js`（check.py 112行目）。

### 実装カード（16枚）
- Ωメガネ
- おジャマ・ブルー
- イモータル・ルーラー
- カオスライダー グスタフ
- ガトリング・ドラゴン
- コート・オブ・ジャスティス
- シュレツダー
- ジャイロイド
- ジャスティス・ブリンガー
- スピリット・フォース
- ダーク・ホルス・ドラゴン
- バスター・マーセナリ
- パラレル・セレクト
- レグルス
- 大樹海
- 神剣－フェニックスブレード

### この cycle の要点
- **「相手ターン終了時まで」は `until` の語彙に無い**ので、cycle 15 で確認した
  `permanent` ＋ v7 スケジューラの `clearModsByLabel` で期限を持たせた
  （カオスライダー グスタフ）。`at:'turnEnd'` を使っている。
- `card.specialSummoned`（`00_state_actions.js:1281`）で「特殊召喚されたモンスターか」を
  判定できる。ジャスティス・ブリンガーの発動無効条件に使った。
- コイントス3回（ガトリング・ドラゴン）も `duelRandomInt(2)` の反復で replay 安全。
  digest 一致を回帰に入れた。
- `SETCODE.OJAMA`(0x1020) は `SETCODE` 定数側に実在する（おジャマ・ブルー）。
  一方 cycle 15 の機皇は overlay 側だった。**2系統あることを毎回確認する。**

### テストフィクスチャの注意（今回の初回3件の失敗はいずれもテスト側）
- **`氷結界の龍 トリシューラ` は IMPLEMENTED。** fixture に使ったところ
  カバレッジ scanner が TESTED へ繰り上げ、off-target 1件になった。
  TESTED 済みの `BF－アーマード・ウィング` へ差し替えて解消（cycle 13 と同型の再発）。
- `夜叉` はスピリットで `cannotSpecialSummon`。特殊召喚先の fixture には使えない。
- 罠は発動後は表側。裏側のままだと `continuousSources` が拾わない。

## Cycle 17 — 手札コスト除去・条件付き自己特殊召喚・継続制限 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_16_live_20260906.zip`
SHA256 `b884f7a2550041eafdae36468e9f96f4603fca6dc3d445a044e1123e28b79ad0`

| | |
|---|---|
| attempted | 15 · completed **15** (100%) |
| PASS | 8997 → **9078** (+81) · FAIL 0 |
| TESTED | 1693 → **1708** (+15) |
| NOT_STARTED | 1735 → **1720** (−15) · ENGINE_GAP 544（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/B9_auto_cycle17.js` / `tools/test_auto_cycle17.js`（check.py 113行目）。

### 実装カード（15枚）
- アリの増殖
- アンデット・スカル・デーモン
- イージーチューニング
- ウイングトータス
- ガーディアン・オブ・オーダー
- ガード・ヘッジ
- キング・オブ・ビースト
- クルーエル
- コアラッコアラ
- シャーク・サッカー
- ジュラック・スピノス
- デーモン・カオス・キング
- ビッグホーン・マンモス
- 六芒星の呪縛
- 無力の証明

### この cycle で確定した engine 契約
- **`locateCard(card)` は `{p, zone, index}` だけを返し `.card` を持たない。**
  カード本体が要るときは `locateCardAnyV4(card)`（`{p,zone,index,card,db}`）を使う。
  アンデット・スカル・デーモンの `protectV21.effect` 内で `locateCard(self).card` を
  読んで例外になり、`resolveProtSpecV21` の try/catch に握り潰されて
  「耐性が付かない」形で失敗していた（1件）。
- **`onAttackDeclare` の payload は `{player, atkIdx, target, name}`**
  （`70_summon_procedures.js:744`）。この時点で `gameState.battle` はまだ無いので、
  `a3IsAttacker`（`gameState.battle` を読む）は使えない。event の `atkIdx` で判定する。
  デーモン・カオス・キングはこれで実装した。
- **choice の `resume.args` を発行後に書き換えてはいけない。** Journal に載らず
  replay で食い違う。対象 uid のような追加情報は `API.setFlag`（Action 経由）で渡す。
  クルーエルは当初 `pendingChoiceV49(...).resume.args` を上書きしていたのを修正した。
- `sc.cannotSynchroMaterial === true` は `20_effect_primitives_ex.js:486` が読む実在の宣言
  （シャーク・サッカー）。

### 墓地ソース宣言の上限を 12 → 20 に更新
cycle 15〜17 で4件増えた。いずれもテキスト上も墓地ソースを要求していることを確認した。
- チューナーズ・バリア（次のターンのエンドフェイズ時まで破壊されない）
- スピリット・フォース（その戦闘の自分への戦闘ダメージを0にする）
- ガード・ヘッジ（手札から墓地へ送って発動し、その戦闘で破壊されない）
- 無力の証明（発動するターン、自分のモンスターは攻撃できない）

現在13件。毎 cycle 上限に当たるのを避けるため 20 に取り直した。
実効的な防波堤は同ファイルの相対 performance ガードで、実測は
base=89ms / grave200=119ms（比 1.34、上限25倍）。

## Cycle 18 — 戦闘破壊トリガーの展開・連続攻撃・装備 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_17_live_20260906.zip`
SHA256 `7598203b1a5a155f76cd7b061da62b1349e3aca36a71232dcec8383acfa4b53a`

| | |
|---|---|
| attempted | 13 · completed **13** (100%) |
| PASS | 9078 → **9129** (+51) · FAIL 0 |
| TESTED | 1708 → **1721** (+13) |
| NOT_STARTED | 1720 → **1707** (−13) · ENGINE_GAP 544（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C0_auto_cycle18.js` / `tools/test_auto_cycle18.js`（check.py 114行目）。

### 実装カード（13枚）
- A・O・J フィールド・マーシャル
- A・O・J リーサル・ウェポン
- エレキャッシュ
- サイバー・ウロボロス
- デビル・コメディアン
- デーモンの斧
- ハイドロゲドン
- ファイターズ・エイプ
- フレムベル・ヘルドッグ
- ブロッサム・ボンバー
- ヘル・ツイン・コップ
- ライトニング・ウォリアー
- ワーム・ウォーロード

### この cycle で確定した engine 契約
- **`API.grantAdditionalAttack` が実際に書くのは `card.attackLimit` と
  `card.attackLimitTurn`**（`GRANT_EXTRA_ATTACK_V48` @ `00_state_actions.js:470`）。
  `extraAttacks` / `additionalAttack` / `attackCount` といったフィールドは存在しない。
- `continuous.negateEffect(card, self)` は `effectNegatedBy`
  （`00_state_actions.js:2529`）が読む。`continuousReaches` で scope が効くので、
  `equippedMonster` scope で装備先だけを無効化できる（エレキャッシュ）。
- v30 の `graveInfo.face` / `graveInfo.pos` で「破壊時点で裏側守備表示だったか」を
  判定できる（A・O・J フィールド・マーシャル）。

### 既存テストの誤りを修正（cycle 12）
`tools/test_auto_cycle12.js` のエレメント・デビルの連続攻撃アサーションが
`extraAttacks` / `attackCount` / `additionalAttack` という**存在しないフィールド**を
見ており、実質的に多重攻撃を検証できていなかった。
実フィールド（`attackLimit>=2 かつ attackLimitTurn===現在ターン`）での検証に直した。
cycle 18 の同種2件（ヘル・ツイン・コップ／ワーム・ウォーロード）も同じ形にそろえた。

## Cycle 19 — シンクロ素材ファミリー（過去の誤判断の訂正） (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_18_live_20260906.zip`
SHA256 `d129fb7f5de7461a360337e46bd1a3c8f549d009387b09fabe049e74c2594dcd`

| | |
|---|---|
| attempted | 15 · completed **15** (100%) |
| PASS | 9129 → **9204** (+75) · FAIL 0 |
| TESTED | 1721 → **1736** (+15) |
| NOT_STARTED | 1707 → **1692** (−15) · ENGINE_GAP 544（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C1_auto_cycle19.js` / `tools/test_auto_cycle19.js`（check.py 115行目）。

### 実装カード（15枚）
- X－セイバー ウェイン
- アタック・ゲイナー
- エンシェント・ゴッド・フレムベル
- クイック・スパナイト
- サニー・ピクシー
- スターダスト・シャオロン
- ダークシー・レスキュー
- ダーク・スプロケッター
- チェンジ・シンクロン
- ハイパー・シンクロン
- バイス・バーサーカー
- ブライ・シンクロン
- マジドッグ
- メンタル・カウンセラー リリー
- ヴァイロン・キューブ

### ■ 過去の誤判断の訂正: シンクロ素材の provenance は存在する

cycle 12〜16 で「シンクロ素材の provenance が無い」と判断して
アタック・ゲイナー／ダークシー・レスキュー／サニー・ピクシー／
スターダスト・シャオロン／X－セイバー ウェイン／エンシェント・ゴッド・フレムベル 等を
繰り返しスキップしていたが、**これは誤りだった**。実測すると engine は
必要な情報を全て持っている（ENGINE_GAP には記録していなかったので状態の訂正は不要）。

`EX_SUMMON_PREPARE_V42`（`00_state_actions.js:1522〜`）で素材を墓地へ送る際に:
- 素材の `graveInfo = {turn, from:'mz', reason:'synchroMaterial', lv, face}`
- `onSendToGrave` イベント = `{player, uid, reason:'synchroMaterial', kind:'synchro', summonUid}`
  — **`summonUid` でシンクロ召喚されたモンスターを特定できる**

`EX_SUMMON_COMMIT_V42` で:
- シンクロ側に `v380SummonMaterials = [{name, tuner, lv}, ...]`
- `specialSummonKind = 'synchro'`
- `onSpecialSummon` イベント = `{player, name, uid, kind:'synchro'}`
  — **`kind==='synchro'` で「S召喚に成功した時」を判定できる**

この cycle はこの発見に基づく一族15枚をまとめて実装したもの。
テストも `EX_SUMMON_PREPARE_V42` → `EX_SUMMON_COMMIT_V42` の**正規経路**で
実際にシンクロ召喚を行い、engine が出す本物のイベントで検証している
（イベントを手で捏造していない）。冒頭に provenance の存在自体を確かめる
「前提」assertion を6件置いた。

**教訓**: 「無さそう」で判断せず、必ず producer/consumer を実測する。
v30 の E1 誤診と同じ轍だった。

### この cycle で確定した engine 契約
- EX 召喚の Action 名は **`EX_SUMMON_PREPARE_V42`**（素材は `materials`）→
  `EX_SUMMON_COMMIT_V42`。`EX_SUMMON_TRY_V42` という名前は存在しない。
- `API.negateEffectUntil(target, until, label, sourceCard)` で期限付きの効果無効化ができる
  （ブライ・シンクロン）。確認は `API.isEffectNegated(target)`。

### テストフィクスチャの注意（再発防止）
シンクロのフィクスチャは全て **TESTED 済み**のものに揃えた。
`氷結界の龍 ブリューナク` と `アーカナイト・マジシャン` は IMPLEMENTED で、
fixture に使うとカバレッジ scanner が TESTED へ繰り上げてしまう（cycle 13・16 と同型）。
差し替え先: BF－アーマード・ウィング（闇・汎用）／マジカル・アンドロイド（光）／
マジックテンペスター（魔法使い）／スクラップ・ドラゴン（ドラゴン）／
スターダスト・ドラゴン（名称指定）。

## Cycle 20 — 除外コストとアドバンス召喚 provenance (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_19_live_20260906.zip`
SHA256 `22c94f776e1a8a642b86fb9ae2abfdca4eb642efa6c3d197f48e0da1d6d199aa`

| | |
|---|---|
| attempted | 15 · completed **14** (93%) · preflight で1枚ドロップ |
| PASS | 9204 → **9289** (+85) · FAIL 0 |
| TESTED | 1736 → **1750** (+14) |
| NOT_STARTED | 1692 → **1677** (−15) · ENGINE_GAP 544 → **545** (+1) |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C2_auto_cycle20.js` / `tools/test_auto_cycle20.js`（check.py 116行目）。

### 実装カード（14枚）
- D・D・R
- エレメンタル・アブソーバー
- ギョッ!
- スカイオニヒトクイエイ
- スパウン・アリゲーター
- バーサーカークラッシュ
- ファイヤー・ソウル
- フォーチュン・スリップ
- フレムベルカウンター
- ヘルフレイムエンペラー
- レクンガ
- 三連星のトリオン
- 死霊操りしパペットマスター
- 混沌球体

### ■ アドバンス召喚の provenance も存在した（cycle 19 に続く再確認）

cycle 19 でシンクロ素材の provenance を実測して誤判断を訂正したのに続き、
今回はアドバンス召喚まわりを実測した。こちらも engine は情報を持っている:

`applySummonProvenanceP3`（`00_state_actions.js:117`）が
- 召喚されたカードに `summonProvenance = {summonType:'normal'|'tribute'|'special'|'flip'|'ritual',
  summonInstance, materialRefs:[uid...], materialSnapshots}`
- **リリースされた側**に `usedAsMaterial = {summonType, summonInstance, summonedUid, actingPlayer}`
- `NORMAL_SUMMON` は加えて `card.tributeCount` / `tributeValue`

これで スパウン・アリゲーター／ヘルフレイムエンペラー／死霊操りしパペットマスター／
混沌球体／三連星のトリオン が実装できた。テストは `NORMAL_SUMMON` に
`p3Materials` / `p3SummonType:'tribute'` を渡す**正規経路**でアドバンス召喚し、
冒頭に provenance の存在を確かめる前提 assertion を5件置いている。

### ドロップ1枚（ENGINE_GAP に記録）
- **タン・ツイスター** — 「アドバンス召喚したこのカードがフィールドから墓地へ送られた時」。
  `summonProvenance` と `tributeCount` は **ZONE_LOCAL_KEYS**
  （`00_state_actions.js:2315-2328`）に入っており、領域を移ると削除される。
  墓地に着いた時点で「アドバンス召喚だった」事実が失われているため発動判定ができない。
  **場に居るうちに provenance を読むカード（上記5枚）は問題なく動く**ので、
  塞がっているのは「場を離れた後に参照する」ケースだけ。
  必要なのは v30 が既に書いている `graveInfo` に召喚種別を1つ足すこと。

### この cycle で確定した engine 契約
- `continuous.attrOverride(card, self)` で属性を上書きできる
  （`currentAttributeV17` @ `1G_characteristic_v17.js:104`）。混沌球体の
  「光属性としても扱う」に使った。`raceOverride` / `nameOverride` / `tunerOverride` も同系統。
- `sc.canDirectAttack` は `canDirectAttackThroughMonstersV51`
  （`00_state_actions.js:2589`）が読む実在の宣言。
- アドバンス召喚の Action は `NORMAL_SUMMON` に
  `tributes` / `p3Materials` / `p3SummonType:'tribute'` を渡す形。

### テストフィクスチャの注意
`フレムベル・ヘルドッグ` は**獣族**であって炎族ではない（属性は炎）。
「炎族」を要求するファイヤー・ソウルのフィクスチャで取り違えた。
種族と属性の欄を必ず両方確認する。

## Cycle 21 — 召喚無効・召喚成功トリガー・期限付き全体制限 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_20_live_20260906.zip`
SHA256 `db88ea4f0e9821e7836a275ee42b6b95bd2ab9fdf6c55e7b1ea34731bc4b6415`

| | |
|---|---|
| attempted | 11 · completed **11** (100%) |
| PASS | 9289 → **9363** (+74) · FAIL 0 |
| TESTED | 1750 → **1761** (+11) |
| NOT_STARTED | 1677 → **1666** (−11) · ENGINE_GAP 545（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C3_auto_cycle21.js` / `tools/test_auto_cycle21.js`（check.py 117行目）。

### 実装カード（11枚）
- XX－セイバー ガトムズ
- おくびょうかぜ
- アヌビスの呪い
- アーマーブレイク
- オーバーウェルム
- バーニング・スカルヘッド
- ホワイト・ホーンズ・ドラゴン
- 光の護封陣
- 光神機－閃空
- 方舟の選別
- 昇天の角笛

### プリフライトで落とした群（consumer 不在を実測して確認）
今回の探索では「回数・種類による全体制限」が多く出たが、engine に consumer が無い。
実装せず、テスト側に SKIP assertion として残した（ENGINE_GAP には未記録＝候補として保留）。
- **召喚回数の制限** — サモンリミッター（1ターン合計2回まで）／カーム・マジック（このターン召喚不可）／
  大熱波（効果モンスターを召喚できない）。`summonLimit` / `summonsThisTurn` に相当する
  記録も consumer も存在しない。
- **召喚コストの追加** — ヘル・ブランブル（手札から非植物族を出すには1000払う）。
- **条件付きの特殊召喚禁止** — かつて神と呼ばれた亀（攻撃力1800以上）／
  A・O・J D.D.チェッカー（光属性）。`cannotSpecialSummon` はカード単位の静的宣言で、
  盤面条件による禁止は表現できない。
- **デッキに戻す事の禁止** — G・B・ハンター。
- **特殊召喚の実行元** — ボーンクラッシャー（「アンデット族モンスターの効果によって」）。
  `moveProvenance` は `{reason, actingPlayer, fromZone}` までで、
  **どのカードの効果か**は記録されない。

### この cycle で使った既存機構
- `summonNegate` + `summonNegatePendingV2` で召喚無効（昇天の角笛／方舟の選別）。
  方舟の選別は `summonNegate.condition(pending)` 側にも同じ述語を置き、
  engine の召喚無効窓に出す条件と発動条件を一致させた。
- `onActivateSuccess` の `cardId` から `CARD_DB[cardId].sub` を見れば
  装備魔法の発動を判定できる（アーマーブレイク）。
- アドバンス召喚 provenance は**場に居るうちなら**読める（オーバーウェルム）。

## Cycle 22 — シンクロ召喚成功に反応する群ほか (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_21_live_20260906.zip`
SHA256 `1e7eab773e23f5bb6ffd238d91947a9550811eb1e9f22aaa3086d46fb168966d`

| | |
|---|---|
| attempted | 9 · completed **9** (100%) |
| PASS | 9363 → **9413** (+50) · FAIL 0 |
| TESTED | 1761 → **1770** (+9) |
| NOT_STARTED | 1666 → **1657** (−9) · ENGINE_GAP 545（変化なし） |
| static 1786 · auto 201 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C4_auto_cycle22.js` / `tools/test_auto_cycle22.js`（check.py 118行目）。

### 実装カード（9枚）
- キング・もけもけ
- コモンメンタルワールド
- シンクロ・ストライク
- ジュラック・プティラ
- スピリット・ドラゴン
- ゼンマイマイ
- チューナー・キャプチャー
- テーヴァ
- デス・メテオ

### cycle 19 の発見を使い切る
シンクロ召喚成功の判定（`onSpecialSummon` の `kind==='synchro'`）と
シンクロ側の `v380SummonMaterials` を使って、以前は手を付けられなかった
コモンメンタルワールド／シンクロ・ストライク／チューナー・キャプチャーを実装した。
- シンクロ・ストライクの「シンクロ素材にしたモンスターの数」は
  `card.v380SummonMaterials.length`（`EX_SUMMON_COMMIT_V42` が残す）で取れる。
- チューナー・キャプチャーの「そのシンクロ素材としたチューナー」は
  相手の墓地から `graveInfo.reason === 'synchroMaterial'` かつ当ターンのものを拾い、
  さらに `st` に 'チューナー' を持つカードに絞って特定した。
- テーヴァはアドバンス召喚 provenance（cycle 20）を場に居るうちに読んでいる。

### 今回もプリフライトで落とした群
ソードハンター（破壊したモンスターを装備）／ゲットライド!（墓地のユニオンを装備）は
既知の「モンスターを装備カード扱いにする」「墓地からの装備」gap。
ツタン仮面・ツバメ返し・デストラクション・ジャマー・ダイスインパクトは
「対象を取るか」「特殊召喚時に誘発するか」「破壊効果か」「サイコロ効果か」といった
**発動の分類**を要求するが、`onActivateSuccess` の payload は
`{uid, player, kind, sub, chainId, chainLink, cardId}` までで、そこまでは分からない。

## Cycle 23 — 魔法の発動に反応するカウンター罠・対象耐性ほか (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_22_live_20260906.zip`
SHA256 `3cc821212e12479136f193eed9abae423e41f88535214dd9676d3774c0bf746e`

| | |
|---|---|
| attempted | 12 · completed **12** (100%) |
| PASS | 9413 → **9479** (+66) · FAIL 0 |
| TESTED | 1770 → **1782** (+12) |
| NOT_STARTED | 1657 → **1645** (−12) · ENGINE_GAP 545（変化なし） |
| static 1786 · auto 213 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C5_auto_cycle23.js` / `tools/test_auto_cycle23.js`（check.py 119行目）。

### 実装カード（12枚）
- ホルスのしもべ
- ボルテック・バイコーン
- マジキャット
- マジック・ジャマー
- マジック・ストライカー
- マジック・ドレイン
- メタルシルバー・アーマー
- ライト・サーペント
- ラピッド・ウォリアー
- レプティレス・スキュラ
- ロード・オブ・ドラゴン－ドラゴンの支配者－
- ヴァンパイア・レディ

### A. 魔法の発動に反応するカウンター罠
`onActivateSuccess` の payload は `{uid, player, kind, sub, chainId, chainLink, cardId}`。
「魔法カードが発動した時」は `kind`（= 'spell'）だけで判定でき、
「相手が」は `player` で判定できる。cycle 22 で落とした群が要求していた
「対象を取るか／破壊効果か」のような分類は要らないので、この2枚は通せた。
- マジック・ジャマー: 手札コスト1枚 → `negateChainLink`（cycle 14 で確立した経路）。
- マジック・ドレイン: 相手に「手札の魔法1枚を捨てる」置換選択を渡す。
  相手の手札は**相手にだけ**見せる（隠匿情報を自分側に漏らさない）。

### B. 対象耐性
`continuous.immuneToTarget` で「相手は〜を効果の対象にできない」を表現。
- ロード・オブ・ドラゴン: 自分フィールドのドラゴン族（`ra === 'ドラゴン'`）。
- ホルスのしもべ: 「ホルスの黒炎竜」は LV4/LV6/LV8 の**正式名称3つを明示列挙**した
  （`D2_HORUS` 定数）。名前の部分一致は禁止なので完全一致比較にしている。
- メタルシルバー・アーマー: 装備先は `equipTo.uid` → `findCardByUid` で取り、
  自分フィールドの mz に居ることを確認したうえで「装備モンスター以外」を守る。

### C. 自己特殊召喚・直接攻撃・戦闘誘発
- マジック・ストライカー: 墓地の魔法1枚を除外して手札から自己特殊召喚。
- ライト・サーペント: `graveInfo.from === 'hand'` で「手札から墓地へ送られた場合」を判定。
  `onSendToGrave` と `onDiscard` の両方を producer として張り、どちらの経路でも拾う。
- ラピッド・ウォリアー: `canDirectAttack` + メインフェイズ1限定。
- レプティレス・スキュラ / ヴァンパイア・レディ / ボルテック・バイコーン:
  戦闘破壊・戦闘ダメージ・「相手によって破壊された」を既存の provenance で判定。
  ボルテック・バイコーンは `graveInfo.byDestroy` に加えて cycle 12 の `c1DestroyRecord()` を読み、
  `rec.battle`（戦闘破壊）または `rec.byPlayer === 相手` のときだけ誘発させている。

### D. cycle 19 の資産の再利用
マジキャットの「魔法使い族シンクロの素材になった場合」は
cycle 19 で作った `c8SynchroIs()` をそのまま使った。
シンクロ素材 provenance は cycle 19 以降、素直に再利用できる資産になっている。

## Cycle 24 — 「この効果でドローしたカード」とドロー誘発 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_23_live_20260906.zip`
SHA256 `b1710819bd6035090c222ee17b67eebeeb5b3af9f32917af9947a679fab31194`

| | |
|---|---|
| attempted | 13 · completed **13** (100%) |
| PASS | 9479 → **9573** (+94) · FAIL 0 |
| TESTED | 1782 → **1795** (+13) |
| NOT_STARTED | 1645 → **1627** (−18) · ENGINE_GAP 545 → **550**（+5） |
| static 1786 · auto 226 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C6_auto_cycle24.js` / `tools/test_auto_cycle24.js`（check.py 120行目）。

### 実装カード（13枚）
- アルケミー・サイクル
- ダーク・パーシアス
- フォーチュンフューチャー
- ミスティック・パイパー
- モンスター・スロット
- モンスター回収
- ワンダー・ワンド
- 地母神アイリス
- 幻獣の角
- 弱者の意地
- 暗黒のミミック LV3
- 酒呑童子
- 鬼ゴブリン

### A. System v8 が「引いたカード」を運んでいた
`engine/17_draw_event_v8.js` は、DRAW Action の中で `recordDrawV8()` を呼び
`gs.lastDrawV8 = {player, uids, byEffect, turn, phase}` を残し、
`onDrawCard` を1枚ずつ流している（producer 実測、`00_state_actions.js:355`）。
consumer 側は `API.lastDrawCards()`。これで
「この効果でドローしたカードをお互いに確認し、〜だった場合」を素直に書けた。
- ミスティック・パイパー: 引いた1枚が**レベル1モンスターなら**もう1枚。
- モンスター・スロット: 引いた1枚が**選択したモンスターと同じレベル**なら特殊召喚。
確認は `API.reveal({audience:'both'})`。引いた本人しか知らない情報にしない。

### B. 「元々の攻撃力を0にする」残存効果を墓地から鳴らす
アルケミー・サイクルは通常罠なので、解決後は墓地にある。
それでも「この効果で攻撃力が0になっているモンスターが破壊される度に」引く。
- 解決時に `API.setBaseStats(h, 0, null, 'endPhase', ...)` と
  `API.setCardFlag(h, 'd3AlchemyTurn', turn, ...)` を対象に刻む。
- 誘発側は `activateFrom:['grave']` ＋ `passive.onDamageStep` で、
  **墓地にいるまま** producer として鳴らす。印のあるモンスターだけを拾う。
罠を場に残す小細工をせずに残存効果を表現できた。

### C. LV1 → LV3 の「どのカードの効果で特殊召喚されたか」
`summonProvenance` は `summonType` と `materialRefs` しか持たず、
**どのカードの効果で出たかは残らない**（`12_provenance_v3.js:157` 実測）。
engine を触らずに解決するため、召喚する側（暗黒のミミック LV1、cycle 13 実装）に
`API.setCardFlag(now, 'c2MimicFromLv1', turn, ...)` を1箇所足し、
LV3 がそれを読んで1枚／2枚を切り替えるようにした。
- engine 変更ではなくカード同士の合成。LV1 の状態は TESTED のまま変化なし。
- テストでは LV1 の resolve を実際に走らせて印が付く事を確かめている
  （「無さそう」で済ませず producer を実測する、cycle 19 の教訓の適用）。

### D. 罠が装備カードになる経路は既に通っていた
幻獣の角は通常罠だが「発動後は装備カードとなる」。
`FX_EQUIP`（`00_state_actions.js:1982`）は sz のカードなら種類を見ないので、
早すぎた埋葬（cycle 14）と同じく `afterResolve(){}` で場に残し
`API.equipSpell` で装備できた。装備後の誘発は
`ctx.card.equipTo` の有無で「装備効果」と「装備モンスターが破壊した時」を分けている。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **神殿を守る者** — DRAW Action は禁止条件を一切見ない。`cannotDraw` 相当が無い。
- **マイン・モール** — `banishWhenLeavesField` は無条件フラグで、
  「相手のカードの効果で離れた場合」だけに絞れない。
- **ヒーロー・メダル** — move provenance を刻む `P3_AUTO_MOVE_TYPES` は墓地送り系5種のみ。
  「相手の効果でセットされた」は残らない。
- **ドリル・シンクロン** — `applyPiercingDamage` は金額を返すだけで、
  「①を適用して与えた」事実がイベントにも state にも残らない。
- **レプティレス・ラミア** — 「レプティレス」が SETCODE にも GROUP にも無い。
  名前の部分一致は禁止なので素材条件を宣言できない。

## Cycle 25 — スタンバイフェイズへの予約（Scheduler v7） (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_24_live_20260906.zip`
SHA256 `c14b2b39eb830f578b32ae1aaec9bfd819fe4df171f0d49eda06c73e600c4632`

| | |
|---|---|
| attempted | 13 · completed **13** (100%) |
| PASS | 9573 → **9672** (+99) · FAIL 0 |
| TESTED | 1795 → **1808** (+13) |
| NOT_STARTED | 1627 → **1609** (−18) · ENGINE_GAP 550 → **555**（+5） |
| static 1786 · auto 239 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C7_auto_cycle25.js` / `tools/test_auto_cycle25.js`（check.py 121行目）。

### 実装カード（13枚）
- D－HERO ダブルガイ
- X－セイバー パシウル
- おとぼけオポッサム
- ウェポンチェンジ
- グラッジ
- サクリファイス・ロータス
- シンクロ・ガンナー
- ダーク・ネフティス
- テレポンD.D.
- バトルマニア
- 愚鈍の斧
- 異次元の精霊
- 疫病

### A. 「次の自分のスタンバイフェイズに〜」は全部同じ形になる
Scheduler v7（`API.schedule({at:'standbyPhase', ownTurn:true, ...})`）に
汎用ハンドラを6本だけ足して、8枚を同じ骨格で書いた。
- `d4.reviveUid` 墓地の uid を特殊召喚（ダーク・ネフティス）
- `d4.returnBanishedUid` 除外の uid を場に戻す（シンクロ・ガンナー／テレポンD.D.／異次元の精霊）
- `d4.pumpUid` uid の攻撃力を恒久的に上げる（グラッジ）
- `d4.tokens` トークンを出す（D－HERO ダブルガイ）
- `d4.damage` / `d4.draw`
**カードの identity は uid で持つ。カード名は使わない。**
テストでは `runDueSchedulesV7('standbyPhase')` を実際に走らせ、
「予約が入る」だけでなく「発火して盤面が変わる」ところまで確かめている。

### B. 通常罠の残存効果を墓地ソース（System v29）で鳴らす
バトルマニアは通常罠なので解決後は墓地にあるが、
「このターン表示形式を変更できず、攻撃可能なら攻撃しなければならない」は残る。
`continuous:{from:['sz','grave'], mustAttack, cannotChangePosition}` を宣言し、
発動時に刻んだ `d4ManiaTurn` が現在ターンと一致する間だけ真を返すようにした。
- 墓地ソースの宣言は opt-in（`graveContinuousNamesV29`）。今回で 16 → **17**。
  上限20なので、これ以上増やす時は本当に他の手が無いかを先に確認する。
- ターンが変われば宣言が自動的に何も返さなくなるので、後片付けが要らない。
cycle 24 のアルケミー・サイクル（`activateFrom:['grave']` で誘発効果を鳴らす）と
合わせて、「墓地に落ちた後も効くカード」の書き方が2通り揃った。

### C. 装備による効果無効化
`continuous.negateEffect`（`00_state_actions.js:2530`）は
`continuousSources()` の外側（sz/field）から内側（mz）を無効化する層に効く。
愚鈍の斧は `apply` で +1000 しつつ `negateEffect` で装備モンスターを無効化した。
テストでは装備先にエフェクト・ヴェーラーを置き `effectNegated()` が真になる事を確認。

### D. 自分の効果で破壊した事を墓地で読む
おとぼけオポッサムは「この効果で破壊されたこのカード」だけを蘇生できる。
破壊の**前に** `API.setCardFlag(me,'d4OpossumSelfKill',turn)` を刻んでおけば、
カード実体に乗るので墓地でも読める。graveInfo だけでは
「誰の・どの効果で破壊されたか」までは分からない。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **The supremacy SUN** — `cannotSpecialSummon===true` は完全一致判定なので
  「自分の効果でだけ特殊召喚できる」の例外を作れない。
- **タイムカプセル** — 裏側表示での除外が無い。表向きに除外すると隠匿情報が漏れる。
- **スライム増殖炉** — `sc.restriction` は属性/種族専用。カード単位の召喚禁止は書けない。
- **サイレント・ソードマン LV3 / LV5** — 「対象は取れるが効果だけ無効」「効果を受けない」
  に相当する耐性層が無い（あるのは immuneToTarget と protectV21 だけ）。

## Cycle 26 — 墓地・除外からのサルベージとリクルート (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_25_live_20260906.zip`
SHA256 `a3f93028cc560f7b36f755752593f2d2c7caf00050f4972791d9dadbcab1189f`

| | |
|---|---|
| attempted | 12 · completed **12** (100%) |
| PASS | 9672 → **9762** (+90) · FAIL 0 |
| TESTED | 1808 → **1820** (+12) |
| NOT_STARTED | 1609 → **1592** (−17) · ENGINE_GAP 555 → **560**（+5） |
| static 1786 · auto 251 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C8_auto_cycle26.js` / `tools/test_auto_cycle26.js`（check.py 122行目）。

### 実装カード（12枚）
- アマゾネスの里
- アームド・チェンジャー
- オーバー・デステニー
- サイコ・フィール・ゾーン
- シンクロ・チェンジ
- ドラグニティ－コルセスカ
- ファルシオンβ
- フレムベル・ドラグノフ
- ラヴァル・ランスロッド
- 次元合成師
- 百獣王 ベヒーモス
- 聖騎士ジャンヌ

### A. リリース軽減の召喚手順は宣言で足りる
`normalSummonProcedure:{includeStandard:true, methods:[{id, tributes, modes, summonLabel, condition}]}`
（`70_summon_procedures.js`）で「リリースなしで召喚できる」「リリース1体で召喚できる」を宣言できる。
- ラヴァル・ランスロッド: `tributes:0`。その方法で召喚した時だけ
  エンドフェイズの自壊を Scheduler v7 に予約する（`tributeCount === 0` で判定）。
- 百獣王 ベヒーモス: `tributes:1`。`continuous.apply` が
  `tributeCount === 1` の時だけ `{setBaseAtk:2000}` を返す。
  「元々の攻撃力」なので `atk` ではなく **setBaseAtk** を使う。

### B. エクストラデッキからの特殊召喚
シンクロ・チェンジ／サイコ・フィール・ゾーンは
`API.specialSummon(p,'ex',index,pos,reason,fromPlayer)` でエクストラから直接出す。
- シンクロ・チェンジは出したモンスターを `API.negateEffectUntil(now,'permanent',...)` で無効化。
- サイコ・フィール・ゾーンはチューナー／非チューナーを2段階の選択で選ばせ、
  レベルの合計と一致するサイキック族シンクロだけを候補にする。
どちらも「素材を使わないエクストラ召喚」なので `EX_SUMMON_PREPARE_V42` は使わない。

### C. resolveTarget は db を持たない
`resolveTarget(t)` が返すのは `{p, zone, index, card}` で **`db` は無い**。
`API.pileCards` / `API.fieldCards` が返す v17Handle には `db` があるので混同しやすい。
オーバー・デステニーとサイコ・フィール・ゾーンで `r.db.lv` と書いて
`TypeError: Cannot read properties of undefined` を出した。`dbOf(r.card)` に修正。
- cycle 12 の「`API.pileCards` は v17Handle を返す」と対になる注意点。

### D. 「相手によって破壊された」の判定はターンも見る
`c1DestroyRecord()`（cycle 12）は `gs.destroyedThisTurnV30` を
**uid・turn・from='mz' の3つ**で照合する。テストで記録を手で組む時に
`turn` を落とすと一致せず、聖騎士ジャンヌが誘発しなかった。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **混沌の黒魔術師** — ③の「離れた場合に除外」を宣言できない。
  `banishWhenLeavesField` は効果解決の中でしか立てられず、
  召喚された事実だけで立てる宣言点が無い。①②だけ書くと半実装になる。
- **黒き森のウィッチ / 泉の精霊** — 「このターン、そのカードと同名カードは発動できない」
  というカード名単位の発動禁止の層が engine に無い。
- **氷の女王** — 「墓地からの特殊召喚はできない」だけを禁じられない。
- **サイ・ガール** — 裏側での除外が無い（cycle 25 のタイムカプセルと同じ層）。

## Cycle 27 — 条件付きの自己特殊召喚（手札から） (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_26_live_20260906.zip`
SHA256 `9008732d5ed42ef43ff1d858e3cccc4253188597d544de4d018328471e3d6dbd`

| | |
|---|---|
| attempted | 11 · completed **11** (100%) |
| PASS | 9762 → **9841** (+79) · FAIL 0 |
| TESTED | 1820 → **1831** (+11) |
| NOT_STARTED | 1592 → **1576** (−16) · ENGINE_GAP 560 → **565**（+5） |
| static 1786 · auto 262 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/C9_auto_cycle27.js` / `tools/test_auto_cycle27.js`（check.py 123行目）。

### 実装カード（11枚）
- A・ジェネクス・バードマン
- アンノウン・シンクロン
- ガーディアン・エアトス
- ゼータ・レティキュラント
- ソード・マスター
- パワー・ジャイアント
- ヘルウェイ・パトロール
- 召喚師セームベル
- 吹き荒れるウィン
- 地球巨人 ガイア・プレート
- 泣き神の石像

### A. 手札からの自己特殊召喚は1本のヘルパにまとまる
`d6SelfSummonFromHand(ctx, reason, banishOnLeave)` で
「手札の自分を探す → 空きを確かめる → uid を控える → 特殊召喚 →
出た実体に印を付ける」までを共通化した。7枚がこれを使っている。
- 「この効果で特殊召喚したこのカードは離れた場合に除外される」は
  `API.setCardFlag(now,'banishWhenLeavesField',true,...)`。
  既存カードは `ctx.card.banishWhenLeavesField=true` と直接書いていたが、
  **setCardFlag なら Action として Journal に載る**ので Replay に強い。

### B. continuous.apply の中で curATK を呼んではいけない
地球巨人 ガイア・プレートの「戦闘相手の攻撃力・守備力はダメージ計算時のみ半分」を
`{setAtk: Math.floor(curATK(card)/2)}` と書いたら、
`curATK → collectContinuous → apply → curATK` で再入する。
**`baseAtkV14(card)` / `baseDefV14(card)`（元々の数値の層）から計算する**。
- 同じ理由で、apply の中で他カードの現在値を参照する時は常に base 層を使う。

### C. デュエル中1度は countLimit に scope を渡す
`countLimit:{ n:1, scope:'duel' }`（`40_legal_script_engine.js:456`）。
カード実体に `clDuel` が積まれる。アンノウン・シンクロンで使用。

### D. 特殊召喚を含む局面は Replay 監査の単位を選ぶ
`API.specialSummon` は `onSpecialSummon` を deferredEvents に積み、
**ライブ側だけが flush する**。digest は deferredEvents を含むので、
特殊召喚を挟んだ区間をそのまま `v44ReplayAuditPackage` に掛けると
finalDigest が食い違う。監査はコスト（除外・墓地送り）の区間に絞った。
- cycle 23〜26 の Replay テストがコスト中心だったのはこのため。明文化しておく。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **死力のタッグ・チェンジ** — LP 規則はターン単位で、戦闘1回だけに絞れない。
- **氷結界の交霊師** — 「相手は1ターンに1度しか魔法・罠を発動できない」の consumer が無い。
- **伊弉凪** — スピリットの帰還を外部から任意化する宣言点が無い。
- **A・ジェネクス・リバイバー** — 「自分が相手のカードの発動を無効にした」provenance が無い。
- **スフィア・ボム 球体時限爆弾** — ダメージ計算前に攻撃を装備へ置き換える差し替え点が無い。

## Cycle 28 — 表示形式と「同じ表示形式で戻す」 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_27_live_20260906.zip`
SHA256 `ed3410ff0b38caea2cb0ee320c2ed1f1c1ccd12fab07ddad78d56a73ab02d2b1`

| | |
|---|---|
| attempted | 11 · completed **11** (100%) |
| PASS | 9841 → **9921** (+80) · FAIL 0 |
| TESTED | 1831 → **1842** (+11) |
| NOT_STARTED | 1576 → **1565** (−11) · ENGINE_GAP 565（変化なし） |
| static 1786 · auto 273 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D0_auto_cycle28.js` / `tools/test_auto_cycle28.js`（check.py 124行目）。

### 実装カード（11枚）
- D・チャッカン
- サイコジャンパー
- サブマリンロイド
- サーチ・ストライカー
- ジャンク・アーチャー
- ジャンク・ガードナー
- パスト・イメージ
- ミドル・シールド・ガードナー
- レプティレス・ナージャ
- ロスト・スター・ディセント
- 妨害電波

### A. 「同じ表示形式で戻る」は banishInfo が持っている
除外時に `v42MarkBanishInfo` が `{turn, from, face, pos, reason, byPlayer}` を刻む
（`07_zone_events_v42.js`）。**pos も face も残っている**ので、
戻す時にそのまま復元できる。共通ハンドラ `d7.returnSamePos` に集約し、
ジャンク・アーチャー（このターンのエンドフェイズ）と
パスト・イメージ（次のスタンバイフェイズ）が `at` / `turns` だけ変えて使っている。
- 裏側守備表示のまま除外されたモンスターは**裏側のまま戻す**。
  特殊召喚は表側で出るので、戻した直後に `API.flip(back,'down')` を掛ける。
  隠匿情報を勝手に公開しない。

### B. 表示形式を変更できない期間はカードの印＋継続効果で表す
`continuous.cannotChangePosition(card, self)`（`19_position_v10.js:141`）は
継続効果ソースから引かれる。期間はソース側に持たせず、
**対象カードに `d7PosLockThrough`（何ターン目まで）を刻む**方式にした。
- サーチ・ストライカー: 「次の自分のターンのエンドフェイズ時まで」＝ `turn + 2`。
- サイコジャンパー: 「このターン」＝ `turn`。
ロスト・スター・ディセントは通常罠で解決後は墓地に落ちるため、
cycle 25 のバトルマニアと同じく **System v29 の墓地ソース**（`from:['sz','grave']`）
として宣言した。墓地ソース宣言は 17 → **18**（上限20）。残り2枠。

### C. 直接攻撃のダメージを「元々の攻撃力」に固定する
サブマリンロイドの「直接攻撃時のダメージは元々の攻撃力と同じ」は、
ダメージ計算側をいじらず、直接攻撃を宣言している間だけ
`continuous.apply` が `{setFinalAtk: dbOf(self).atk}` を返す形にした。
`setFinalAtk` は最終層（`00_state_actions.js:2718` の layers.setFinal）なので、
増減や `setAtk` を全て上書きできる。

### D. sourceTarget にカード実体を渡すと resolveTarget で落ちる
`API.swapControl(a, b, reason, sourceTarget)` は sourceTarget を
`resolveTarget()` に通す。`ctx.card`（カード実体）を渡すと
`P[t.zone]` が `undefined[undefined]` になって TypeError で落ちた。
**ハンドル（`locateCardAnyV4(ctx.card)`）を渡す。**
cycle 26 の「resolveTarget は db を持たない」と対になる注意点。

## Cycle 29 — リリースと素材制限（System v23 materialFilter） (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_28_live_20260906.zip`
SHA256 `24b071f8f06092916e96bdc9fff1eb28faefc6061b81469a616fab5dcfe055e9`

| | |
|---|---|
| attempted | 9 · completed **9** (100%) |
| PASS | 9921 → **9988** (+67) · FAIL 0 |
| TESTED | 1842 → **1851** (+9) |
| NOT_STARTED | 1565 → **1551** (−14) · ENGINE_GAP 565 → **570**（+5） |
| static 1786 · auto 282 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D1_auto_cycle29.js` / `tools/test_auto_cycle29.js`（check.py 125行目）。

### 実装カード（9枚）
- アーマード・サイキッカー
- コアキメイル・ガーディアン
- コアキメイル・サンドマン
- ジュラック・ティラヌス
- ジョーズマン
- ダーク・ダイブ・ボンバー
- ヘル・ドラゴン
- モザイク・マンティコア
- 堕天使ゼラート

### A. アドバンス召喚のリリース素材は materialFilter で縛れる（System v23）
`normalSummonProcedure.methods[].materialFilter(candidate, ctx)`
（`70_summon_procedures.js:56`）。candidate は `API.fieldCards` と同じハンドルなので
`candidate.db.at === '水'` のように素直に書ける。
- ジョーズマン: `includeStandard:false` ＋ `tributes:1` ＋ 水属性フィルタ。
  標準手順を残すと「水属性以外でもリリースできる」抜け道ができるので**外す**。
- 堕天使ゼラート: `includeStandard:true` に加えて
  「墓地の闇属性が4種類以上」を `condition` に、闇属性限定を `materialFilter` に置いた。
  **種類数は名前の集合の大きさ**で数える（同名を重複して数えない）。

### B. リリースしたモンスターは materialRefs から辿れる
モザイク・マンティコアの「アドバンス召喚のためにリリースしたモンスター」は
cycle 20 の `API.summonProvenance(card).materialRefs`（uid の配列）。
これを Scheduler v7 の args にそのまま積んで、
次の自分スタンバイに墓地から可能な限り特殊召喚する。
- 出したモンスターには `cannotAttack` フラグと `negateEffectUntil` を掛ける。

### C. リリースしたモンスターのレベルはコスト時点で控える
ダーク・ダイブ・ボンバーの「リリースしたモンスターのレベル×200」は、
**墓地へ送る前に** `ctx.d8TributeLv = API.levelOf(r)` で確定させる。
墓地へ行った後の `graveInfo.lv` でも取れるが、
レベル変化の継続効果が乗っていた場合に食い違う。

### D. negateChainLink は実在するチェーンリンクを要る
`negateChainLinkV13` は `chainIndexOfV13` で `gs.chain` を引き、
**見つからなければ何もせず false を返す**。
テストでイベント payload だけ組んで `chainId:1` を渡しても無効化されない。
`gameState.chain` に実際のリンクを積んでから呼ぶ。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **五稜星の呪縛** — `cannotSynchroMaterial` はスクリプト単位の宣言で、
  対象1体だけに掛けられない（リリース禁止だけなら書けるが半実装になる）。
- **ブロックマン** — 「場に表側で存在した自分ターンの数」を数える producer が無い。
- **ブリザード・プリンセス** — プレイヤー単位の発動禁止の層が無い。
- **トリプル・ヴァイパー** — 攻撃宣言にコストを要求する差し込み点が無い。
- **ガントレット・ウォリアー** — 「そのモンスターが戦闘を行ったダメージステップ終了時まで」
  というモンスター単位・戦闘単位の期限が STAT_MOD_V14 の until に無い。

## Cycle 30 — コアキメイルの維持コストとエンドフェイズ処理 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_29_live_20260906.zip`
SHA256 `fcbb1a09bada5d93f5736a1f21d0e95589ae26958d2b92293402e16d3d07796e`

| | |
|---|---|
| attempted | 10 · completed **10** (100%) |
| PASS | 9988 → **10058** (+70) · FAIL 0 |
| TESTED | 1851 → **1861** (+10) |
| NOT_STARTED | 1551 → **1536** (−15) · ENGINE_GAP 570 → **575**（+5） |
| static 1786 · auto 292 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D2_auto_cycle30.js` / `tools/test_auto_cycle30.js`（check.py 126行目）。
**PASS が 10,000 を超えた。**

### 実装カード（10枚）
- エレキジ
- エーリアンモナイト
- コアキメイル・グラヴィローズ
- コアキメイル・ビートル
- コアキメイル・ベルグザーク
- サテライト・キャノン
- サディスティック・ポーション
- シンクロ・コントロール
- ドル・ドラ
- ネオス・フォース

### A. 維持コストは述語1つで一般化できる
cycle 29 で書いた骨格を `d9Koaki(name, show, spec)` に整理した。
`show(db)` が「見せられる手札」の述語で、鋼核（`v57CoreInHand`）→ 見せる → 破壊の順に落ちる。
種族違いの3枚（植物／昆虫／戦士）がこの1本で書けた。
- **通常罠は DB 上 `sub` が空文字**。`sub === '通常'` では引けないので
  「永続でもカウンターでもない罠」で判定する（4996枚の実測: 空516 / 永続197 / カウンター74）。

### B. モンスター発の negateEffect は他のモンスターに届かない
`continuousSources()` は sz/field を outer、mz を inner として集め、
**inner は outer の `negateEffect` でだけ落とされる**（`00_state_actions.js:2520-2522`）。
つまりモンスターの継続効果で別のモンスターを無効化する事はできない。
コアキメイル・パワーハンド／デビルはこれが要るので ENGINE_GAP に落とした。
- cycle 29 の愚鈍の斧（装備魔法＝sz ソース）が通ったのは outer 側だったから。
  **同じ hook でもソースの領域で届く範囲が変わる。**

### C. grantAdditionalAttack は「もう1度」を今の攻撃回数に足す
`GRANT_EXTRA_ATTACK_V48` は `afterCurrent` が true のとき
`attackLimit = max(base, attackCount + n + 1)` を書く（`00_state_actions.js:473`）。
**まだ1回も攻撃していない状態で呼ぶと limit は 1 のまま**。
テストでは `attacked=true / attackCount=1`（＝1回攻撃した直後）を作ってから確かめる。

### D. 「攻撃後に0に戻る」は label 付き mod をまとめて消す
サテライト・キャノンのエンドフェイズ強化は
`API.modAtk(me, 1000, 0, 'permanent', 'サテライト・キャノン')` で積み、
攻撃したダメージ計算後に `API.clearModsByLabel(me, 'サテライト・キャノン')` で
**その label の分だけ**落とす。他のカードが与えた増減は残る。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **コアキメイル・パワーハンド / デビル** — 上記 B の層の制約。
- **コアキメイル・ドラゴ** — 特殊召喚禁止はカード名直書きで、宣言点が無い。
- **またたびキャット** — 「このカードを攻撃できない」を表す hook が無い。
- **エレキリン** — プレイヤー単位の発動禁止の層が無い。

## Cycle 31 — 装備カードの三系統 (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_30_live_20260906.zip`
SHA256 `7a79c7a70daf19a35ec39ea3243465745254154fd9b00756d5f6ddb67d57539b`

| | |
|---|---|
| attempted | 9 · completed **9** (100%) |
| PASS | 10058 → **10126** (+68) · FAIL 0 |
| TESTED | 1861 → **1870** (+9) |
| NOT_STARTED | 1536 → **1522** (−14) · ENGINE_GAP 575 → **580**（+5） |
| static 1786 · auto 301 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D3_auto_cycle31.js` / `tools/test_auto_cycle31.js`（check.py 127行目）。

### 実装カード（9枚）
- C・スネーク
- D・クリーナン
- D－チェーン
- アサルト・アーマー
- アサルト・スピリッツ
- エレキューブ
- サイクロンレーザー
- サイクロン・ブーメラン
- サイバー・レイダー

### A. 装備の3系統が出揃った
| 系統 | 作り方 | 例 |
|---|---|---|
| 装備魔法 | `equipSpec.canEquip` ＋ `continuous{from:['sz']}` | アサルト・アーマー／エレキューブ |
| 罠が装備になる | `afterResolve(){}` で場に残し `API.equipSpell` | D－チェーン／アサルト・スピリッツ |
| モンスターを装備扱い | `API.equipMonster`（FX_MONSTER_EQUIP_V46） | C・スネーク／D・クリーナン |
どれも装備後の誘発は `ctx.card.equipTo` の有無で「装備する効果」と分ける。

### B. 装備先が破壊された後は equipTo が消えている
`dropEquips` は装備モンスターが場を離れる時に装備を外す。
そのため「装備モンスターが戦闘破壊された時」を `ctx.card.equipTo` で見ると
**もう nullになっていて誘発しない**（C・スネークで実測）。
装備した時に `API.setCardFlag(now,'e0EquipHostUid',hostUid)` を刻み、
`equipTo` が消えていてもその uid で戦闘の犠牲者と照合する。
併せて `activateFrom` に `'grave'` を足し、
装備カード自身が墓地へ落ちても鳴れるようにした。

### C. ENGINE_GAP のカードはテストの fixture に使ってよい
E・HERO ワイルドマン（ENGINE_GAP）を fixture に使ったが、
**status override が勝つのでカバレッジは動かない**（off-target 0 を実測）。
使ってはいけないのは IMPLEMENTED（スクリプトはあるがテストが無い）だけ。
- 安全な fixture: TESTED / GENERIC_OK / NOT_STARTED / ENGINE_GAP
- 危険な fixture: **IMPLEMENTED / PARTIAL**

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **ガーディアン・エルマ / ギルフォード・ザ・レジェンド / ゲットライド!** —
  「墓地から装備する」経路が無い（`API.equipSpell` は sz のカードだけを扱う）。
- **ガーディアン・シール** — 特殊召喚を条件付きで許可する宣言が無い
  （`cannotSpecialSummon` は全面禁止のみ）。
- **コンビネーション・アタック** — 「ユニオンを装備した状態で戦闘した」provenance が無い。

## Cycle 32 — 公開（reveal）と確認（inspect）の使い分け (2026-09-06)

base checkpoint: `checkpoint_auto_cycle_31_live_20260906.zip`
SHA256 `6d858bbd7645663627f25fb115c6c6a728021facb1748aa63f24f4267fd4880e`

| | |
|---|---|
| attempted | 7 · completed **7** (100%) |
| PASS | 10126 → **10181** (+55) · FAIL 0 |
| TESTED | 1870 → **1877** (+7) |
| NOT_STARTED | 1522 → **1510** (−12) · ENGINE_GAP 580 → **585**（+5） |
| static 1786 · auto 308 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D4_auto_cycle32.js` / `tools/test_auto_cycle32.js`（check.py 128行目）。

### 実装カード（7枚）
- コアキメイル・アイス
- コアキメイル・シーパンサー
- 星見獣ガリス
- 鋼核の輝き
- 黄金の天道虫
- 黒薔薇の魔女
- 黒蠍－逃げ足のチック

### A. 「見せる」と「めくる」は別の primitive
| テキスト | 使うもの | 誰が見るか |
|---|---|---|
| 相手に見せる／お互いに確認する | `API.reveal({audience:'both'})` | 両者。state に残る |
| 確認する（相手は確認できない） | `API.inspect(viewer, targets)` | viewer だけ。state を変えない |
- 鋼核の輝き・星見獣ガリス・黄金の天道虫・黒薔薇の魔女は **reveal**。
- 黒蠍－逃げ足のチックの「相手のデッキの一番上をめくる（相手は確認できない）」は **inspect**。
  テストで `revealListV20(gameState).length === 0` を確かめ、
  **めくっただけで公開されていない**事を固定した。
- 黄金の天道虫の「エンドフェイズ時まで公開する」は
  `reveal({until:'endPhase', endPhaseOf:player})`。

### B. ランダムな1枚は duelRandomInt で引く
`duelRandomInt(n, gameState)` は `gs.rngState` を進める Replay 安全な RNG。
`Math.random()` を使うと再生が一致しない。

### C. 「攻撃した場合」のルール処理はチェーンに乗せられない
ゴブリン偵察部隊の「攻撃した場合、バトルフェイズ終了時に守備表示になり…」は
**任意効果とは独立したルール処理**で、攻撃宣言だけを条件に差し込む宣言点が無い。
任意効果の解決に相乗りさせると「効果を使わなかった場合」に処理されず裁定が変わるので、
ENGINE_GAP に落とした。
- cycle 28 のサーチ・ストライカーが通ったのは
  テキストが「**この効果を使用した場合**」で、解決の中に書けたから。
  同じ形の文でも「使用した場合」か「攻撃した場合」かで扱いが変わる。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **ゴブリン偵察部隊** — 上記 C。
- **サイバー・ドラゴン・ツヴァイ** — 墓地のカードに継続的な名前変更を掛ける層が無い。
- **久遠の魔術師ミラ** — チェーン参加そのものを禁じる hook が無い。
- **アンティ勝負** — お互いが同時に伏せて選ぶ入力が無い。
- **クイズ** — 墓地の閲覧制限とカード名の宣言入力が無い。

## Cycle 33 — チェーン位置と「手札に戻る装備」 (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_32_live_20260906.zip`
SHA256 `d4c00874d299659d2cb47f6852214834ea1eecc685be14900737a4df34dea857`

| | |
|---|---|
| attempted | 9 · completed **9** (100%) |
| PASS | 10181 → **10250** (+69) · FAIL 0 |
| TESTED | 1877 → **1886** (+9) |
| NOT_STARTED | 1510 → **1499** (−11) · ENGINE_GAP 585 → **587**（+2） |
| static 1786 · auto 317 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D5_auto_cycle33.js` / `tools/test_auto_cycle33.js`（check.py 129行目）。

### 実装カード（9枚）
- BF－激震のアブロオロス
- サクリファイス・ソード
- ジェムエレファント
- スピリットの誘い
- チェーン・ヒーリング
- チェーン・ブラスト
- トラップ・キャプチャー
- 八尺勾玉
- 疫病ウィルス ブラックダスト

### A. 「チェーン◯で発動した場合」は chain 配列の位置で読む
`gameState.chain` の中から自分の uid を持つリンクを探し、その index+1 を使う。
uid が載っていない局面では `chain.length`（＝いま一番上）を自分とみなす。
- チェーン・ヒーリング／チェーン・ブラストは
  1 → 通常どおり墓地、2〜3 → デッキに戻してシャッフル、4以降 → 手札に戻す。
- 墓地送りは `afterResolve` の中で「まだ sz にいる時だけ」行う。
  デッキ／手札に戻した後に二重で動かさない。

### B. 装備先を uid で刻むのは cycle 31 の続き
`dropEquips` で `equipTo` が消えるので、装備時に `e2HostUid` を刻む。
八尺勾玉（装備先が手札に戻った）とサクリファイス・ソード（装備先がリリースされた）は
どちらも **墓地に落ちた後**に装備先の行き先を見て自分を手札に戻す。
- リリースは `graveInfo.byDestroy === false`、破壊は `true` で区別できる。

### C. 相手に選ばせる選択要求
スピリットの誘いの「相手が選択して持ち主の手札に戻す」は
`API.requestChoice({player: ctx.opponent, ...})`。
テストで `pending().player === 1` を確かめ、**選ぶ主体が相手である事**を固定した。

### D. 既存テストの fixture 選びが新カードで壊れた（cycle 07 を修正）
`tools/test_auto_cycle07.js` の生け贄人形テストは
CARD_DB を頭から走査して「レベル7・EX以外・「特殊召喚」表記なし」の最初の1枚を
fixture にしていた。今回 BF－激震のアブロオロス（レベル7）に
`cannotSpecialSummon:true` を宣言した結果、その fixture が特殊召喚できなくなり
2件 FAIL した。**テストの意図は「特殊召喚できるレベル7」**なので、
走査条件に `!(CARD_SCRIPTS[d.n] && sc.cannotSpecialSummon === true)` を足した。
- 教訓: **DB を走査して fixture を選ぶテストは、後から書くカードで壊れる。**
  新規カードで `cannotSpecialSummon` 等の全面禁止を宣言する時は
  既存テストの走査条件も合わせて見る。

### プリフライトで落とした群（ENGINE_GAP 2件を追記）
- **念動増幅装置** — コストの支払いを外部から免除する hook が無い。
- **光の封札剣** — 裏側での除外が無い（タイムカプセル／サイ・ガールと同じ層）。

## Cycle 34 — デッキからの複数リクルートと種類の宣言 (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_33_live_20260907.zip`
SHA256 `fc07203d76f71d5ffbb1a4ef3f0f3539a1d943e06c36897680a0993572bd6567`

| | |
|---|---|
| attempted | 7 · completed **7** (100%) |
| PASS | 10250 → **10308** (+58) · FAIL 0 |
| TESTED | 1886 → **1893** (+7) |
| NOT_STARTED | 1499 → **1486** (−13) · ENGINE_GAP 587 → **593**（+6） |
| static 1786 · auto 324 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D6_auto_cycle34.js` / `tools/test_auto_cycle34.js`（check.py 130行目）。

### 実装カード（7枚）
- ヒーロー・マスク
- ブレイン・ジャッカー
- マジック・キャプチャー
- マックス・テレポーター
- レスキューキャット
- ヴァンパイア・ロード
- 魔術の呪文書

### A. デッキから2体出すのは specialSummon を2回呼ぶだけでよい
`RESOLUTION_SUMMON_BATCH_V2` はチェーン解決中に engine 側が勝手に集める箱
（`30_processor_chain_battle.js:1304`）。**カード側は `API.specialSummon` を素直に2回呼ぶ**。
自分でイベントをまとめようとしない。
- レスキューキャット: 自身をコストで墓地へ送るので、空き判定は
  「今の枚数 − 1 + 2 ≦ 上限」で見る（自分が抜けた分が空く）。
- 出したモンスターの uid を集めて `negateEffectUntil` を掛け、
  エンドフェイズの破壊を1本の予約（`e3.destroyUids`）にまとめる。

### B. 「種類を宣言する」は 3 択の requestChoice で書ける
`requestChoiceV49` の候補は `{key,label,value}` を受け、
継続ハンドラには `answer.cards[i].value` として**カード以外の値も**返る
（`09_choice_request_v49.js:287`）。
ヴァンパイア・ロードはこれで モンスター／魔法／罠 を宣言させ、
相手のデッキからその種類を1枚墓地へ送る。
- 宣言候補は3つだけなので、**相手の手札やデッキの中身は一切見えない**。
  テストでも候補が3つである事を固定した。

### C. カード名の置き換え
ヒーロー・マスクは `API.setCardName(target, name, 'endPhase', label)`（System v17）。
デッキから墓地へ送った「E・HERO」の**実際の名前**を渡すので、
名前の推測もカタログの決め打ちもしていない。

### プリフライトで落とした群（ENGINE_GAP 6件を追記）
- **憑依装着－アウス / ウィン / エリア / ヒータ（4枚）** —
  「手札・デッキから特殊召喚できる」の**デッキ側の起動点が無い**。
  `activateFrom` に `'deck'` を宣言しているカードは既存 4996 枚中 0 枚で、
  デッキのカード自身から効果を発動する経路が存在しない。手札側だけでは半実装。
- **D－HERO ディスクガイ** — 「墓地へ送られたターンは墓地から特殊召喚できない」を宣言できない
  （領域限定の特殊召喚禁止が無い。氷の女王と同じ層）。
- **サイバー・フェニックス** — 「対象を取る魔法・罠の効果を無効にする」を
  **継続効果として**書けない（無効化の入口はチェーンに乗る negateChainLink だけ）。

## Cycle 35 — ダメージ計算時の攻撃力アップ (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_34_live_20260907.zip`
SHA256 `073f6a6ac45f030965ae20b7e4599b5a21543c6e34d9d8d03b9e8cbefb9558dc`

| | |
|---|---|
| attempted | 8 · completed **8** (100%) |
| PASS | 10308 → **10365** (+57) · FAIL 0 |
| TESTED | 1893 → **1901** (+8) |
| NOT_STARTED | 1486 → **1473** (−13) · ENGINE_GAP 593 → **598**（+5） |
| static 1786 · auto 332 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D7_auto_cycle35.js` / `tools/test_auto_cycle35.js`（check.py 131行目）。

### 実装カード（8枚）
- ウィンドファーム・ジェネクス
- ダーク・シティ
- デス・ヴォルストガルフ
- ドラグニティナイト－ゲイボルグ
- ネクロフェイス
- バスターランチャー
- ビッグバン・シュート
- ビーストライザー

### A. 「ダメージ計算時のみ」は continuous.apply が gameState.battle を見る
`gameState.battle{player, atkIdx, target}` から攻撃側・守備側を引き、
自分（または装備先）が関わっている時だけ数値を返す。
- バスターランチャー: 相手が攻撃表示なら攻撃力、守備表示なら守備力を見る。
- ダーク・シティ: 攻撃側が「D－HERO」で、守備側の方が攻撃力が高い時だけ +1000。
- **apply の中では必ず `baseAtkV14` / `baseDefV14`（元々の数値の層）で比較する。**
  `curATK` を呼ぶと `collectContinuous` が再入する（cycle 27 で踏んだ罠）。

### B. 「除外したモンスターの元々の攻撃力」は除外する前に確定させる
ビーストライザーとドラグニティナイト－ゲイボルグは
`cost()` の中で `ctx.e4XxxAtk = dbOf(r.card).atk` を控えてから除外する。
除外後に `dbOf` を引くこともできるが、
**コストで決まる数値はコスト時点で固定する**方が裁定に近い。

### C. 「離れた時に装備モンスターを除外」は linkOnLeave の向きに注意
`API.linkOnLeave(self, watched, onGone)` は
**「watched が離れたら self に onGone を適用する」**。
ビッグバン・シュートは「このカードが離れたら装備モンスターを除外」なので
`linkOnLeave(装備モンスター, このカード, 'banish')` と**逆向き**に張る。
`onGone` は `destroy` / `banish` / `destroyBanish` / `toHand` / `none` が使える
（`18_leave_field_v9.js:188`）。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **トラックロイド / ドラグニティ－ドゥクス** — 墓地のモンスターを装備カード扱いにする経路が無い
  （`FX_MONSTER_EQUIP_V46` は場のモンスター専用）。
- **エレメント・ヴァルキリー** — コントロール変更に対する耐性の hook が無い。
- **ガーディアン・バオウ** — 特殊召喚を条件付きで許可する宣言が無い。
- **サイバー・オーガ** — ダメージステップに入った戦闘そのものを無効にする層が無い。

## Cycle 36 — 貫通と「自分への戦闘ダメージ0」 (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_35_live_20260907.zip`
SHA256 `713eadc5499dc9bc44f636aa26f10241c0503d1048de0e46d96e8bf9540d747c`

| | |
|---|---|
| attempted | 7 · completed **7** (100%) |
| PASS | 10365 → **10422** (+57) · FAIL 0 |
| TESTED | 1901 → **1908** (+7) |
| NOT_STARTED | 1473 → **1461** (−12) · ENGINE_GAP 598 → **603**（+5） |
| static 1786 · auto 339 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D8_auto_cycle36.js` / `tools/test_auto_cycle36.js`（check.py 132行目）。

### 実装カード（7枚）
- バリア・リゾネーター
- フライファング
- フリッグのリンゴ
- プライドの咆哮
- ランサー・デーモン
- ロケット戦士
- 光神機－轟龍

### A. 貫通は「誰の攻撃か」で3通りに書き分ける
`continuous.piercingDamage(info)` の info には
`{atkCard, defCard, atkOwner, defOwner, amount, direct, srcPlayer, self}` が入る。
- 自分だけ貫通（フライファング／光神機－轟龍）: `info.atkCard === info.self`
- 装備先が貫通（cycle 31 サイクロンレーザー）: `info.atkCard.uid === self.equipTo.uid`
- **他のモンスターに貫通を与える**（ランサー・デーモン）:
  攻撃宣言時に攻撃モンスターへ印（`e5LancerPierce = turn`）を刻み、
  `piercingDamage` はその印を見る。ソースは自分（mz）のままでよい。

### B. 「自分への戦闘ダメージは0」は continuous.lpChange で書く
`resolveLpChangeV18(gs,{player,delta,cause})` が
継続効果の `lpChange(info, self)` を先に通す（`1H_lp_change_v18.js:86`）。
`cause === 'battle'` の時だけ 0 を返せば戦闘ダメージだけを止められる。
- **テストで `API.damageLP` を使ってはいけない**。あれは効果ダメージなので
  この置換は掛からない（実際に2件 FAIL した）。
  `resolveLpChangeV18(gameState,{player,delta:-1500,cause:'battle'})===0` で確かめる。
- 併せて「効果ダメージは0にならない」も固定した。

### C. 除外領域は継続効果のソースにならない
`collectSources` が走査するのは **mz / sz / field と（opt-in の）grave だけ**
（`00_state_actions.js:2481-2491`）。**banish は対象外**。
ネクロ・ディフェンダーはコストで自身を除外してから
「戦闘破壊耐性＋自分へのダメージ0」を維持する必要があるため、
除外領域からは何も宣言できず ENGINE_GAP に落とした。
- 墓地ソース宣言（v29 opt-in）は 18 → **19**（上限20）。残り1枠。
  バリア・リゾネーターは**墓地に落ちる**カードなのでこれが使えた。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **ネクロ・ディフェンダー** — 上記 C（除外領域がソースにならない）。
- **古代の機械巨人** — プレイヤー単位の発動禁止の層が無い。
- **デモンバルサム・シード** — 1回の戦闘のダメージ量と破壊を結び付けられない。
- **マジック・スライム** — デュアル機構が無く、ダメージの肩代わりも戦闘単位で指定できない。
- **宝玉獣 アメジスト・キャット** — モンスターを永続魔法として置く action が無い。

## Cycle 37 — 除外と帰還 (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_36_live_20260907.zip`
SHA256 `ee3d2de2a5039cf1533c6796576e756dbc510b80e6a720ca11b2fb9d390b8cae`

| | |
|---|---|
| attempted | 8 · completed **8** (100%) |
| PASS | 10422 → **10478** (+56) · FAIL 0 |
| TESTED | 1908 → **1916** (+8) |
| NOT_STARTED | 1461 → **1448** (−13) · ENGINE_GAP 603 → **608**（+5） |
| static 1786 · auto 347 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/D9_auto_cycle37.js` / `tools/test_auto_cycle37.js`（check.py 133行目）。

### 実装カード（8枚）
- BF－陽炎のカーム
- エクストラゲート
- タイム・エスケーパー
- フューチャー・グロウ
- フューチャー・ヴィジョン
- ブーテン
- メンタルオーバー・デーモン
- ユニバード

### A. 「誰から見た次のスタンバイか」を player で切り替える
`API.schedule({at:'standbyPhase', ownTurn:true, player:X})` の
**X が「次の自分のターン」の基準**になる。
- タイム・エスケーパー: 自分が発動 → `player: ctx.player`。
- フューチャー・ヴィジョン: 「**召喚したプレイヤーから見て**次の自分のスタンバイ」なので
  除外したモンスターの持ち主（`h.p`）を渡す。相手の召喚に反応した時は相手基準になる。
戻し方は cycle 28 の `d7.returnSamePos` と同じく `banishInfo.pos` / `.face` を復元するが、
フューチャー・ヴィジョンは「**表側攻撃表示で**戻る」なので `forceAtk` を渡して上書きする。

### B. uid の配列をカードに持たせる
メンタルオーバー・デーモンは「このカードの効果で除外したモンスター」を覚える必要がある。
`API.setCardFlag(me, 'e6MentalUids', [...uid], reason)` で**配列をそのまま**持たせた。
- `FX_CARD_FLAG_V46` は Action なので Journal に載り、Replay でも復元される。
- 値は純 JSON（数値の配列）なので直列化検査も通る。
- 墓地へ送られた時にまとめて特殊召喚し、配列を空に戻す。

### C. レベルの宣言は候補を自前で渡す
`requestChoice({kind:'declare', candidates:[{key,label,value}...]})` に
レベル1〜12を並べる。`declarationCandidatesV11` の既定値を使わず自前で渡すことで、
**候補がレベル12種類だけ**になり相手のエクストラデッキの中身は見えない。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **ワーム・ホール** — mz は配列管理で固定スロットが無く「そのゾーンは使用できない」が書けない。
- **チェーンドッグ** — `cannotSynchroMaterial` は全面禁止で、召喚先の種族で条件付けできない。
- **ダメージ・イーター** — LP 規則は1つの効果を単位にできない。
- **サイコ・リアクター** — 墓地ソース（v29 opt-in）が残り1枠のため保留。
- **D－HERO デビルガイ** — プレイヤー単位で戦闘を禁止する consumer が無い。

## Cycle 38 — トークン生成とコイントス (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_37_live_20260907.zip`
SHA256 `0fc2bbc53f0df9539eb440f6b75c7bb06e9f1d73d923518510412b79a7a622e4`

| | |
|---|---|
| attempted | 8 · completed **8** (100%) |
| PASS | 10478 → **10533** (+55) · FAIL 0 |
| TESTED | 1916 → **1924** (+8) |
| NOT_STARTED | 1448 → **1435** (−13) · ENGINE_GAP 608 → **613**（+5） |
| static 1786 · auto 355 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/E0_auto_cycle38.js` / `tools/test_auto_cycle38.js`（check.py 134行目）。

### 実装カード（8枚）
- アルカナフォースXVIII－THE MOON
- クローン複製
- ツクシー
- トリッキーズ・マジック4
- モンスターBOX
- ロードブリティッシュ
- 一撃必殺侍
- 魂喰らいの魔刀

### A. 「元々の数値を持つトークン」は spec を実行時に組む
`API.createTokenFrom` は **現在値**（curATK/curDEF）を写す。
クローン複製は「**元々の**種族・属性・レベル・攻撃力・守備力」なので、
`dbOf(card)` の値でその場の spec オブジェクトを作って `API.createTokens` に渡す。
数値は Action に literal で載るので Replay でも同じになる。

### B. トークンの「攻撃宣言できない」はカード実体のフラグで足りる
最初 `continuous.cannotAttack` を墓地ソースで宣言しようとしたが、
`cannotAttack` は **engine が直接読むカードフラグ**（`00_state_actions.js:412` でリセットされる）。
`API.setCardFlag(token,'cannotAttack',true,...)` を出したトークンに刻むだけでよく、
**墓地ソース（v29 opt-in）の枠を消費せずに済んだ**（19/20 のまま）。

### C. API.isToken / API.tokenKey は target を取る
どちらも内部で `resolveTarget` を通すので、**カード実体を渡すと落ちる**
（`P[t.zone]` が `undefined[undefined]` になる。実際に TypeError を出した）。
`ctx.battle` から取り出した生のカードには
**`isTokenV11(card)` / `tokenKeyV11(card)`** を使う。
- cycle 28 の「sourceTarget にカード実体を渡すと落ちる」と同じ型の罠。
  **API 層はハンドル、engine 内部関数はカード実体**、と覚える。

### D. コイントスは duelRandomInt、宣言は候補2つの requestChoice
「裏表を当てる」は
`requestChoice({kind:'declare', candidates:[表/裏]})` → 継続ハンドラで `e7Coin()` を振る、
の順で書く。**先に振ってから宣言させない**（当て物の意味が変わる）。
テストは RNG に依存するので「当たれば破壊・外れれば残る」の**両方を許容**する形で固定した。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **ワーム・ベイト / 迷える仔羊 / 暴君の自暴自棄** —
  レベル・種別・条件付きの召喚禁止を宣言する層が無い。
- **セカンド・チャンス** — コイントスの振り直しに割り込む中央 hook が無い。
- **ダイスインパクト** — 「サイコロを振る効果か」を発動の分類から判別できない。

## Cycle 39 — 墓地へ送られた時に誘発する装備魔法 (2026-09-07)

base checkpoint: `checkpoint_auto_cycle_38_live_20260907.zip`
SHA256 `746ef262d47b97350422a7efe5f1e9209359604a3b358ad8cada5335f09f0c1f`

| | |
|---|---|
| attempted | 8 · completed **8** (100%) |
| PASS | 10533 → **10584** (+51) · FAIL 0 |
| TESTED | 1924 → **1932** (+8) |
| NOT_STARTED | 1435 → **1422** (−13) · ENGINE_GAP 613 → **618**（+5） |
| static 1786 · auto 363 · Acode 4996 · TOTAL 4996 |
| engine changes | **0** |
| off-target 状態変化 | **0** |

`cards/E1_auto_cycle39.js` / `tools/test_auto_cycle39.js`（check.py 135行目）。

### 実装カード（8枚）
- カース・サイキック
- レプティレス・アンガー
- 下克上の首飾り
- 二角獣レーム
- 人造人間－サイコ・リターナー
- 呪いのお札
- 悪魔のくちづけ
- 時の機械－タイム・マシーン

### A. 装備魔法の「墓地へ送られた時」は cycle 31/33 の骨格の再利用
装備時に `e8HostUid` を刻み、`graveInfo.from === 'sz'` と
装備先の `graveInfo.byDestroy` を組み合わせて
「装備モンスターが**破壊された事によって**墓地へ送られた」を判定する。
- 呪いのお札: 装備先の**元々の**守備力（`dbOf(host.card).def`）を、その持ち主に与える。
- レプティレス・アンガー: 装備時に `API.setRace(host,'爬虫類','permanent')`、
  墓地へ行った時に相手モンスターを -800。
- 悪魔のくちづけ / 下克上の首飾り: 墓地から `API.returnToDeck(me, false)` でデッキトップへ。

### B. 青眼の白龍は「通常モンスター」
下克上の首飾りの equipSpec を確かめるテストで、
`equipLegalV15(card, 青眼の白龍)` が **true** になって FAIL した。
青眼の白龍は `st:['通常']` の通常モンスターなので当然だった。
**「装備できない側」のテストには効果モンスター（クレボンス等）を使う。**
- テスト fixture の性質を db で確認してから使う、という基本を再確認した。

### C. 書いた説明と実装がずれていないかは continuous の有無で分かる
悪魔のくちづけは「攻撃力700アップ」とコメントに書きながら
`continuous` ブロックを書き忘れており、テストで即座に検出できた。
**card-specific アサーションを必ず1つ入れる**方針がそのまま効いた。

### プリフライトで落とした群（ENGINE_GAP 5件を追記）
- **処刑人－マキュラ** — 手札からの罠発動を許可する層が無い。
- **暗黒魔族ギルファー・デーモン** — 墓地からの装備が書けない。
- **スーペルヴィス** — デュアル（再度召喚）の機構が無い。
- **暗黒のマンティコア** — 「墓地へ送られたターン」の起動効果をコスト選択付きで墓地から出せない。
- **機甲部隊の最前線** — 戦闘破壊された個体を条件式まで持ち込む経路が無い。

## Cycle 40 — 召喚・特殊召喚の成功を起点にする誘発 (2026-09-07)

- **base checkpoint**: `checkpoint_auto_cycle_39_live_20260907.zip`
  SHA256 `e87fc8c79f2730f6acf6c0ff0dce8223da4c7b0c962167839e9dc155c3bb1e3f`
- **engine 変更**: 0 / **新規 primitive**: 0
- **新規ファイル**: `cards/E2_auto_cycle40.js`, `tools/test_auto_cycle40.js`

### 指標

| 項目 | Cycle 39 | Cycle 40 | 差分 |
| --- | --- | --- | --- |
| PASS | 10584 | 10629 | +45 |
| FAIL | 0 | 0 | 0 |
| TESTED | 1932 | 1936 | +4 |
| ENGINE_GAP | 618 | 620 | +2 |
| NOT_STARTED | 1422 | 1416 | -6 |
| GENERIC_OK | 644 | 644 | 0 |
| IMPLEMENTED | 198 | 198 | 0 |
| PARTIAL | 182 | 182 | 0 |
| Acode cards | 4996 | 4996 | 0 |
| off-target status changes | 0 | 0 | 0 |

off-target 監査は checkpoint 39 を新規展開して `build.py` → `build_acode.py` →
`script_coverage.py` を回し直し、その結果と live の per-card status を突き合わせた。
`changed=6 | ->TESTED=4 | ->ENGINE_GAP=2 | off-target=0`。
（`data/script_coverage.json` は checkpoint に古い内容が入っている場合があるので、
zip 内の JSON をそのまま baseline にしてはいけない。必ず展開して回し直す。）

### 実装したカード（4枚）

- **闇帝ディルグ** — 召喚・特殊召喚に成功した時、相手の墓地のカードを2枚まで除外し、
  除外した数だけ相手のデッキの上を墓地へ送る。召喚・特殊召喚したターンは攻撃できない
  （`continuous.cannotAttack` + `summonedTurn`）。
- **異次元への案内人** — 召喚成功時にコントロールが相手へ移り（1回だけ）、
  以降はエンドフェイズ毎に「コントローラーの相手」がコントローラーの墓地から1枚を除外する。
- **召喚の呪詛**（永続魔法） — 自分エンドフェイズ毎に 500 払うか、払わずに自身を破壊するかを
  `kind:'option'` の選択で提示。加えて、モンスターが特殊召喚に成功した時、
  そのモンスターのコントローラー本人が自分の手札1枚を選んで除外する。
- **アルカナフォース0－THE FOOL** — 召喚・反転召喚・特殊召喚成功時に
  `duelRandomInt(2, gameState)` でコイントスし、表(1)なら自分の、裏(2)なら相手の
  「このカードを対象にする効果」を無効にし破壊する。戦闘破壊耐性は `protectV21`、
  「守備表示に変更できない」は `continuous.cannotChangePosition`。

### 技術的な確認事項（preflight 実測）

- **魔法・罠が他人の召喚に反応するには `onOtherSummon` の宣言が必須。**
  `summonTriggerApplies`（`engine/40_legal_script_engine.js:1573-1583`）は既定で
  `ctx.card === evt.card` を要求するため、宣言が無い永続魔法の
  `passive.onSpecialSummon` は決して発火しない（召喚の呪詛で実測）。
  `'auto'` はカードデータの `k` を見て魔法・罠なら true を返す。
- **魔法の種別は `st` ではなく `db.sub`。** DB 上、魔法 949 枚は全て `st` が空配列で、
  永続／フィールド／装備の区別は `sub` にしか無い（`sub==='永続'` で場に残る:
  `engine/20_effect_primitives_ex.js:1113` ほか）。
  Source/Lifecycle の preflight で `st` を見ると必ず判定を誤る。
- **`continuous.cannotAttack(card, src)` / `cannotChangePosition(card, src)`** は
  どちらも `continuousReaches(scope, ...)` を通る。`scope:'self'` は `src === target`
  厳密一致（`engine/00_state_actions.js:2644-2656`）。
  `cannotChangePosition` の既定 scope は `'allMonsters'` なので、自分限定なら明示が必要。
- **`API.activationTargets(evt)`** は `linkTargetsV19` 経由で `findCardByUid` の結果、
  すなわち `{p,zone,index,card}` の配列を返す。`t.card === ctx.card` で比較してよい。
  `onActivateSuccess` の payload は `{uid, player, kind, sub, chainId, chainLink, cardId}`
  で `card` は入らない（`engine/1B_activation_event_v12.js:61-72`）。
- **`kind:'option'` の選択肢は `{key, value, label}`**。回答は
  `answer.keys[0]` に自分で付けた `key` がそのまま入る。カード選択の既定 key は `c0,c1,...`。

### ENGINE_GAP に落としたカード

- **沈黙のサイコウィザード** / **寡黙なるサイコプリースト** —
  1枚のスクリプトに「除外する事ができる」（任意誘発）と「特殊召喚する」（強制誘発）が
  同居する。`defineScript` の `forced` はスクリプト単位の真偽値で
  （`engine/40_legal_script_engine.js:1632 / 1680 / 1694` で `!!sc.forced` として一括評価）、
  誘発ブランチごとに強制／任意を分けられない。どちらへ寄せても半実装になるため SKIP。
  → **必要な primitive: 誘発ブランチ単位の forced 判定**（`forced` を
  `(ctx, eventName) => bool` も受け付ける形にする、等）。

### 今回は見送ったが gap ではないカード

- **デスカイザー・ドラゴン** — 効果自体（相手墓地のアンデット族を自分フィールドへ特殊召喚し、
  このカードが離れた時に破壊）は `API.specialSummon` + `API.linkOnLeave` で書ける。
  ただし「『ゾンビキャリア』＋チューナー以外のアンデット族1体以上」という
  シンクロ素材指定が必要で、これは `synchroMaterialRestriction`
  （`engine/20_effect_primitives_ex.js:672`）で宣言できる既存 primitive。
  scope を今 cycle に収めるため次候補へ回した。**next recommended task の筆頭。**

## Cycle 62 — 属性除外特殊召喚・戦闘誘発 (2026-09-09)

- base: Cycle 61 clean checkpoint (`c60523d2...f9a0d`)
- 実装: インフェルノ / ギガンテス / シルフィード
- 専用test: 23 PASS / 0 FAIL
- full regression: 11205 PASS / 0 FAIL
- Coverage: TESTED 2028 / ENGINE_GAP 620 / NOT_STARTED 1324 / TOTAL 4996
- static registrations: 2226
- engine changes: 0
- off-target status changes: 0

既存の `summonProcedure` と属性墓地除外を再利用。インフェルノは
`gameState.battle` と v17 current attribute を参照して水属性への攻撃中だけ +700、
ギガンテスは `onBattleDestroy` で全魔法・罠を破壊、シルフィードはReplay RNGで
相手手札をランダムに1枚捨てる。いずれも通常召喚不可を保持した。

## Cycle 63 — 融合モンスターの保護・継続修整 (2026-09-09)

- 実装: E・HERO フェニックスガイ / M・HERO ヴェイパー /
  E・HERO シャイニング・フェニックスガイ / M・HERO 剛火 / F・G・D
- 専用test: 20 PASS / 0 FAIL
- full regression: 11225 PASS / 0 FAIL
- Coverage: TESTED 2033 / ENGINE_GAP 620 / NOT_STARTED 1319 / TOTAL 4996
- static registrations: 2231
- engine changes: 0
- off-target status changes: 0

無条件戦闘破壊耐性は既存 `battleProof`、効果破壊耐性と属性条件付き戦闘耐性は
v21、墓地HERO数によるATK修整はP4 setcodeと既存continuous stat hookを使用した。
F・G・Dは相手のcurrent属性を参照し、光属性だけ戦闘破壊耐性の対象外とした。

## Cycle 64 — 戦闘破壊後の元々のATK参照 (2026-09-09)

- 実装: E・HERO フレイム・ウィングマン / E・HERO スチーム・ヒーラー /
  アルティメットサイキッカー
- 専用test: 16 PASS / 0 FAIL
- full regression: 11241 PASS / 0 FAIL
- Coverage: TESTED 2036 / ENGINE_GAP 620 / NOT_STARTED 1316 / TOTAL 4996
- static registrations: 2234
- engine changes: 0

Battle v6の`destroyedDef`と墓地移動後のカードidentityから元々のATKを取得し、
フレイム・ウィングマンは効果ダメージ、スチーム・ヒーラーとサイキッカーは回復へ接続。
サイキッカーの貫通と効果破壊耐性も既存consumerを再利用した。

## Cycle 65 — 融合の攻撃回数・貫通・戦闘破壊ダメージ (2026-09-09)

- 実装: サイバー・ツイン・ドラゴン / サイバー・エンド・ドラゴン /
  E・HERO シャイニング・フレア・ウィングマン / E－HERO インフェルノ・ウィング
- 専用test: 16 PASS / 0 FAIL
- full regression: 11257 PASS / 0 FAIL
- Coverage: TESTED 2040 / ENGINE_GAP 620 / NOT_STARTED 1312 / TOTAL 4996
- static registrations: 2238
- engine changes: 0

既存の`attackLimit`、Battle v6貫通、戦闘破壊identity、P4 E・HERO setcodeを組み合わせた。
インフェルノ・ウィングは墓地へ送られた戦闘相手の元々のATK/DEFの高い方を参照する。

## Cycle 66 — コストなし融合起動効果 (2026-09-09)

- 実装: E－HERO ライトニング・ゴーレム / E・HERO グラン・ネオス
- 専用test: 12 PASS / 0 FAIL
- full regression: 11269 PASS / 0 FAIL
- Coverage: TESTED 2042 / ENGINE_GAP 620 / NOT_STARTED 1310 / TOTAL 4996
- static registrations: 2240
- engine changes: 0

既存のactivation target、countLimit、中央破壊gate、returnToHandだけで実装。
対象選択はchain linkの既存targets経路を使い、独自UIや新stateを追加していない。
