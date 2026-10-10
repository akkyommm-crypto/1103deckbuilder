# S03-U249 — 「…の効果を受けない」 (ENGINE_GAP 3)

## Workflow
- opus-only: a re-check of ENGINE_GAP reasons ("Needs … immunity to … Trap effects").
- S03-U115's unaffected capability (engine/1ZG) already covers a card's own immunity:
  - actions stamped with their effect source are skipped for an unaffected card;
  - continuous Spell / Trap sources skip it too.
- What was missing was one card granting immunity to others.

## Engine
- engine/1ZG `s03UnaffectedByU115` also asks the face-up continuous sources: `continuous.grantUnaffectedS03(card, src, self)`.
- A re-entrancy guard is needed, because `continuousSources()` can itself ask about negation / immunity.

## Cards → TESTED (2011 texts; ENGINE_GAP overrides removed) — cards/HZZZZC_claude_s03_u249_unaffected.js
- 天下人 紫炎: 「このカードは罠の効果を受けない」 (`unaffectedByS03`: source kind 't').
- トラファスフィア:
  - Tribute Summon / Set only by releasing a Winged Beast. This is the System v23 `normalSummonProcedure` method with a `materialFilter` on the current Race; the standard method is excluded.
  - Face-up in the Monster Zone, it is unaffected by Trap effects.
- 暴君の威圧 (Continuous Trap):
  - release 1 monster (cost);
  - while it is face-up, face-up monsters whose original owner is its controller are unaffected by other Trap cards' effects (`grantUnaffectedS03`).

Left for later: ポールポジション. Its 「攻撃力が一番高いモンスター」 needs the current ATK inside the immunity check, which feeds back into the ATK computation.

## Existing tests adjusted (status records; no behavior assertion changed)
- `tools/test_v520_batch04.js` (天下人 紫炎), `test_v650_batch17.js` (トラファスフィア) and `test_v690_batch21.js` (暴君の威圧) listed them as precise ENGINE_GAP.
- Each moves to an 「Unaffected capability unlocked」 check. The counts (45 / 48 / 47) are unchanged.

## Tests
`tools/test_s03_u249_unaffected.js` passes 11/0, on real DUEL paths and Replay-audited.
- 聖なるバリア －ミラーフォース－ is activated in the real attack window:
  - 紫炎 stays while ワイト is destroyed;
  - ブラック・ホール still destroys 紫炎.
- トラファスフィア:
  - its only Tribute candidate is ハーピィ・レディ, not ワイト;
  - it is Tribute Summoned with it;
  - it survives ミラーフォース.
- 暴君の威圧: the release cost; its owner's 青眼 and ギル・ガース both survive ミラーフォース.

Other checks:
- Negative control on U248: 5 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16386 PASS / 0 FAIL** (= U248 16375 + 11 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U248.
- Coverage: TESTED 2751, ENGINE_GAP 572, NOT_STARTED 997, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 711 declared, 0 off-target.
