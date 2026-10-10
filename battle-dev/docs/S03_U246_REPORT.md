# S03-U246 — 「憑依装着」 (ENGINE_GAP 4)

## Workflow
- opus-only: a re-examination of an ENGINE_GAP reason.
- Done while the Sonnet subagent worked on U245, then rebased onto U245.

## Finding
- The four cards were ENGINE_GAP with the reason 「手札・デッキから特殊召喚できる」の**デッキ側の起動点が無い** (cycle 34).
- The engine has had that entry point since v370:
  - `pileDuelActionsV370` (engine/70) offers 「特殊召喚」 for a Deck card whose `summonProcedure.from` includes `'deck'`;
  - `strictSummonProcedureLegality`, `runSummonProcedure` and `finishSummonProcedure` take the zone.
- No engine change was needed. The ENGINE_GAP overrides are removed.

## Cards → TESTED (2011 texts) — cards/HZZZZ_claude_s03_u246_possessed.js
アウス, ウィン, エリア and ヒータ share one helper:
- ① `summonProcedure {from:['hand','deck'], positions atk/def}`. Cost: send 1 face-up 「X霊使いY」 and 1 **other** face-up monster of that Attribute (current Attribute) to the GY. A Deck summon shuffles the Deck.
- ② 「①の方法で特殊召喚したこのカードが守備表示モンスターを攻撃した場合…貫通」: continuous `piercingDamage` while `card.specialSummonKind==='procedure'`. That value is zone-local and written by the procedure's `FX_SPECIAL_SUMMON`.

## Tests
`tools/test_s03_u246_possessed.js` passes 14/0, on real DUEL paths and Replay-audited.
- The Deck card's pile menu offers 「特殊召喚」.
- アウス summoned from the Deck, and its costs go to the GY.
- Piercing for 1650 against a Defense ワイト.
- A Normal Summoned ヒータ does not pierce.
- With only the 霊使い itself as an Attribute monster, the procedure is refused.
- From the hand in Defense Position.
- ウィン from the Deck and エリア from the hand, each with its own 霊使い and Attribute monster.

Other checks:
- Negative control on U245 (the rebased base): 11 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16347 PASS / 0 FAIL** (= U245 16333 + 14 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U245.
- Coverage: TESTED 2740, ENGINE_GAP 581, NOT_STARTED 999, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 700 declared, 0 off-target.
