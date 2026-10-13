# S03-U317 — the four remaining 「六武衆」: イロウ, カモン, ニサシ, ヤリザ

Base: `claude/work` `f74293e` (U316, gate 18670 PASS / 0 FAIL). Sonnet 5.5, single writer. A major-deck theme (the Six Samurai); the other members were already TESTED. All four were NOT_STARTED; no engine change.

## Change (`cards/HZZZZZZE_claude_s03_u317_six2.js`; helpers `v350Six` / `v350SixOwn` of cards/37)
- イロウ: with another 「六武衆」 on my field, attacking a Set (face-down Defense) monster destroys it without damage calculation (`a3DestroyBeforeDamage`, as ミスティック・ソードマン LV2).
- カモン: with another 「六武衆」, once per turn destroy 1 face-up Spell / Trap card on the field (targeted); it cannot declare an attack that turn (`cannotAttackTurn`).
- ニサシ: attacks twice per Battle Phase while another 「六武衆」 is on my field (`attackLimit`).
- ヤリザ: attacks directly while another 「六武衆」 is on my field (`canDirectAttack`).
- All four: the optional substitute (`destroySubstituteS03` kind `destroyOwn`, S03-U173) — the controller may destroy another face-up 「六武衆」 instead.

## Tests
- `tools/test_s03_u317_six2.js` 24 / 0 (each effect with and without another 六武衆; the controls; the substitute prompt answered with ザンジ for all four; Replay audits). Negative control on the previous build: 11 FAIL. Coverage TESTED 2977 → 2981, NOT_STARTED 870 → 866; audit 0 off-target.

## Environment note (recorded)
- C: reached 0 bytes free during this unit (`ENOSPC` while writing a test file; the empty file was rewritten and every touched file re-verified). 38.7 GB of it is the task-output folder of an earlier Claude session (`%TEMP%\claude\C--Users-81806-OneDrive-…\a897e0c6…\tasks`, last written 2026-10-10) — not touched; the user has to decide. This session freed 158 MB of its own scratch (old gate logs, the tools' `tmp*.js`, scratch copies).
