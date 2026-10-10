# S03-U235 — NOT_STARTED 26

## Workflow (mixed, second Sonnet unit)
- Opus wrote the brief and resumed the U232 Sonnet subagent with it, so the subagent kept its context.
- Sonnet wrote the card script and the test: 18/0 on its first run, with no engine change.
- The main session reviewed the code.
  - It replaced シナイ's release detection with an engine marker (below) and added a negative case.
  - It ran the negative control, the declarations, the report and the gate.
- Measured: subagent 258,571 tokens (resumed run, so the count includes the prior context), 34 tool uses, 279 s. Subagent rework 0; parent-side correction 1 (シナイ).

## Engine (parent review)
`engine/00` now records 「リリースされた」 as `graveInfo.releasedS03` for:
- a Tribute Summon's release (`p3.reason 'tribute'`);
- release costs, i.e. a non-destroy FX_TO_GRAVE whose reason follows the scripts' convention 「…（リリース）」 / 「生け贄」 (81 + 5 scripts);
- a Ritual Summon's releases. These previously had no `graveInfo` at all.

Before this, シナイ treated any non-destroy send from the monster zone as a release. That would have triggered on a plain effect send to the GY.

## Cards (NOT_STARTED → TESTED; new scripts, 2011 texts) — cards/HZZZP_claude_s03_u235_ns26.js
- E・HERO アイスエッジ:
  - once per turn, Main Phase 1 only, discard 1 (cost) → it can attack directly this turn;
  - on direct battle damage, it may destroy 1 Set card in the opponent's Spell & Trap Zone.
- ラヴァル・ガンナー:
  - on Normal Summon, with another 「ラヴァル」 monster in the GY: send 1–5 cards from the top of the Deck (the count is chosen);
  - ATK +200 per 「ラヴァル」 monster sent.
- リチュア・ノエリア:
  - on Normal Summon, reveal the top 5: Ritual Spells and 「リチュア」 monsters go to the GY;
  - the rest go to the bottom of the Deck in the chosen order.
- 真六武衆－シナイ:
  - special summon from the hand while a face-up 真六武衆－ミズホ is on its controller's field;
  - when it is released from the field → a 「六武衆」 monster in the GY other than シナイ goes to the hand.
- 魔轟神獣ガナシア:
  - discarded from the hand → special summon itself from the GY;
  - that copy gets ATK +200 and is banished when it leaves the field.

## Tests
`tools/test_s03_u235_ns26.js` passes 20/0, on real DUEL paths and Replay-audited.
- アイスエッジ's discard brings ガナシア back at 1800, and its second use is refused.
- アイスエッジ direct-attacks past 青眼 and destroys the chosen Set card.
- ガナシア is banished after a battle.
- アイスエッジ cannot use its effect in Main Phase 2.
- ガンナー: 1600 with 2 「ラヴァル」; no trigger without another 「ラヴァル」.
- ノエリア's milling and the order of the cards returned to the bottom.
- シナイ:
  - summoned with ミズホ;
  - released by ミズホ's real cost → ザンジ to the hand, and the other シナイ / ワイト are not offered;
  - refused without ミズホ;
  - destroyed by ブラック・ホール → no trigger (parent-added).

Not tested: ガナシア sent from the hand to the GY other than by a discard (no simple real path).

Other checks:
- `test_ritual_*`, `test_expansion_v340`, `test_s03_u105`, `u135`, `u157`, `u159`, `u68`, `u84`, and the Six Samurai slices still pass.
- Negative control on U234: 10 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15911 PASS / 0 FAIL** (= U234 15891 + 20 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U234.
- Coverage: TESTED 2680, ENGINE_GAP 598, NOT_STARTED 1041, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 640 declared, 0 off-target.
