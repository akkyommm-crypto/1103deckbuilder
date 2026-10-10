# S03-U292 — 8 cards (ライト・オブ・デストラクション, 強制接収, 怒れる類人猿, 機動砦のギア・ゴーレム, モロコシーナ, コダロス, 地縛神の復活, 再機動)

## Workflow (mixed, Sonnet battle-implementer, workflow v3)
- A Sonnet subagent ran `brief292.md` for the whole unit: implementation, test, negative control, declarations, status-record updates, pre-scan and gate.
- No engine change: everything reuses existing primitives.

## Cards → TESTED (2011 texts) — cards/HZZZZZQ_claude_s03_u292_gap9.js
- **ライト・オブ・デストラクション:** forced trigger on `onMillBatchS03` (engine/1ZZN) for the opponent's Deck, sent by an effect of the opponent; mills the top 3 of that Deck as its own effect (it does not trigger itself).
- **強制接収:** the Set card is activated in the `onDiscardBatchS03` window of its controller (any cause); once face-up, each later discard group of its controller is a forced trigger: the opponent chooses the same number from their hand (a choice answered by the opponent), or discards the whole hand if smaller.
- **怒れる類人猿:** `selfDestroyWhenS03` while face-up in Defense Position; `continuous.mustAttack` (the existing must-attack model: the Battle Phase is not left without confirmation).
- **機動砦のギア・ゴーレム:** ignition, own Main Phase 1, pay 800 LP; `API.grantDirectAttack` for this turn (it lives on the card in the zone, so it ends when the card leaves).
- **モロコシーナ:** ignition, once per turn, own Main Phase 2, pay 500 LP, needs a free Monster Zone; creates a 「つぶコーントークン」; the engine asks the position (S03-U289).
- **コダロス:** cost: the face-up 「海」 in the Field Zone; 1 or 2 cards of the opponent field chosen at activation; those still there are sent to the GY.
- **地縛神の復活:** discard cost chosen at activation (only a card that leaves both targets is offered; the discarded card can itself be a target); a 「地縛神」 monster and a Field Spell in the GY chosen at activation; those still in the GY are added.
- **再機動:** cost: return a 「機皇」 monster from the hand to the Deck and shuffle; a 「機皇」 card in the GY chosen at activation; added if still there.

## Existing tests adjusted (status records; no behavior assertion changed)
Each moved name goes from the precise ENGINE_GAP list to an "unlocked" check (`!ov[n]`); every check count is unchanged:
`test_v540_batch06` (強制接収), `test_v660_batch18` (モロコシーナ), `test_v670_batch19` (怒れる類人猿, 機動砦のギア・ゴーレム), `test_v740_batch26` (ライト・オブ・デストラクション), `test_v760_batch28` (コダロス), `test_v780_batch30` (地縛神の復活, 再機動).

## Tests
`tools/test_s03_u292_gap9.js`: real DUEL paths (card activations, event windows, chain responses, attacks, phase and turn changes, the hand-size rule), choices answered by the player they belong to, Replay-audited per scenario.

Negative control on U291: 64 FAIL (no crash).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18014 PASS / 0 FAIL** (= U291 17914 + 100 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U291.
- Coverage: TESTED 2924, ENGINE_GAP 474, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 886 declared, 0 off-target.
- Published in the batched checkpoint S03-U292–U295.
