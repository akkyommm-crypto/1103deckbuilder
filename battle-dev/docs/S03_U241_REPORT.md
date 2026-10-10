# S03-U241 — NOT_STARTED 29

## Workflow (mixed, fresh Sonnet subagent)
- Opus chose the cards and wrote the brief. 宝玉の双璧 uses the S03-U240 placement API.
- A fresh Sonnet subagent wrote the card script and the test: 61/0 on its first hand-back, with no engine change.
- The main session reviewed it (setcodes / `crystalBeastDbS03`, no name substrings) and did the negative control, the declarations, this report and the gate.
- Measured: subagent 243,372 tokens, 69 tool uses, 631 s; rework 0.
- The subagent also reported an engine gap: direct-attack battle damage skipped the v18 LP rules (「戦闘ダメージは0」), while monster-vs-monster damage applied them.
  - It left `engine/` untouched, as briefed, and tested 宝玉の双璧's damage-0 part with a monster battle.
  - The same gap was found independently in S03-U242, which fixes it.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZU_claude_s03_u241_ns29.js

| Card | Effect |
|---|---|
| 宝玉の双璧 | own 宝玉獣 destroyed by battle and sent to the GY → place a 宝玉獣 from the Deck; its battle damage this turn becomes 0 |
| ジェムナイト・エメラル | banish a face-up own Normal Monster and itself (cost) → revive a 「ジェムナイト」 Fusion Monster (only one properly summoned before) |
| ドラゴニック・ガード | +1 counter per Normal Summon by either player; send it (cost) → a Dragon of Level ≤ counters from the Deck |
| インフェルニティガン | ① a 「インフェルニティ」 from the hand to the GY; ② with 0 cards in hand, send it → revive up to 2 「インフェルニティ」 |
| ナチュラル・ディザスター | each opponent card destroyed by a 「雲魔物」 monster's effect and sent to the GY → 500 damage |
| ヒーロー逆襲 | own E・HERO destroyed by battle → the opponent picks a random hand card; an E・HERO monster → destroy an opponent monster and special summon it |

Rulings chosen and reviewed:
- 双璧 / 逆襲 can be activated without a Deck 宝玉獣 or with an empty hand.
- ドラゴニック・ガード counts its own Normal Summon.
- 逆襲 does nothing if the opponent has no monster.
- ディザスター reads the event's controller.
- Mass destruction that does not stamp `srcUidS03` does not count.

## Tests
`tools/test_s03_u241_ns29.js` passes 61/0, on real DUEL paths. Scenarios with actions are Replay-audited; 7 legality-only checks have no audit.
- 双璧, including the "placed, not sent to the GY" negative.
- エメラル's revivable and non-revivable Fusions. The proper-summon state is set directly, not through a real Fusion Summon.
- ガード's counters and Level limit.
- ガン ① and ②, plus ② refused with cards in hand.
- ディザスター with キロスタス and アシッド・クラウド, and its four negatives.
- 逆襲 with a 1-card hand, for determinism.

Not reachable on a real path: ガン ② resolving with a non-empty hand.

Other checks:
- `test_s03_u240`, `u237` and `u135` still pass.
- Negative control on U240: 25 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16124 PASS / 0 FAIL** (= U240 16063 + 61 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U240.
- Coverage: TESTED 2713, ENGINE_GAP 595, NOT_STARTED 1012, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 673 declared, 0 off-target.
