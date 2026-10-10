# S03-U69 registerScheduleHandler callback-signature bug (Claude)

Base: shared LATEST `checkpoint_claude_s03_u68_activation_negated_release_secondary_20260918.zip` (Claude, U68).

## Why this unit

Fixed fallback order after U68: priority #1 (the same bug class just confirmed in the prior unit, in an
unaudited area). While debugging オーバー・レンチ's own End Phase return in S03-U68, a `registerScheduleHandler`
callback-signature bug was found and fixed for that one card, then a systematic grep found the identical shape
in ~30 other registrations left unaudited.

## Root cause

`runDueSchedulesV7` (`engine/16_scheduler_v7.js`) invokes each registered handler as
`fn(Object.assign({}, e.args || {}), e)` — the **first** parameter is already the unwrapped `args` object; the
**second** is the full schedule entry. 34 registrations across 12 `cards/*.js` files were shaped
`(entry) => { ...entry.args.X... }`: since the real first parameter (bound to `entry`) is already the
unwrapped args, `entry.args` is always `undefined`. Every guard like `if(uid == null) return;` then silently
returns — no exception (caught nowhere, since none is thrown), no journal entry, no visible symptom other than
"the scheduled effect just never happens." This is a genuinely undetectable-by-playtesting class of bug:
the card's OTHER effects (its trigger condition, its immediate cost/resolve) all worked normally; only the
*delayed* half silently vanished.

## Scope

A static scan (parsing every `registerScheduleHandler(name, callback)` call and inspecting the callback body
for `entry.args` references) found exactly **34 buggy registrations across 12 files**:
`cards/A8_auto_cycle06.js` (1), `A9_auto_cycle07.js` (3), `B1_auto_cycle09.js` (1), `B3_auto_cycle11.js` (3),
`B4_auto_cycle12.js` (2), `B5_auto_cycle13.js` (5), `B6_auto_cycle14.js` (3), `B7_auto_cycle15.js` (10),
`B8_auto_cycle16.js` (1), `C0_auto_cycle18.js` (1), `C1_auto_cycle19.js` (1), `C2_auto_cycle20.js` (4).
38 other registrations elsewhere in the codebase (`cards/92_scheduler_recovery.js` and every file from
`C7_auto_cycle25.js` onward, plus S03-U59's and this session's own U68 handlers) already used the correct
`(args) => { args.X }` shape — this bug was specific to an earlier authoring convention that predates the
correct one.

## Fix

Two mechanical passes across all 12 files:

1. `entry.args.X` → `entry.X` (the parameter itself is already the unwrapped args; strip the redundant
   indirection). Kept the existing parameter name `entry` in every file to keep the diff minimal — renaming to
   `args` was not necessary for correctness.
2. The now-meaningless guard clause `entry && entry.args && X` → `entry && X` (this was left over from the
   same misunderstanding; after step 1's rename `entry.args` on its own — with no `.` following it — was still
   present as a bare truthy check, and with `entry` now correctly bound to the args object directly, that
   check is always falsy and would have masked step 1's own fix).

Both passes were applied via a scripted, whole-file-scoped find/replace (not manual per-file editing), then
every resulting diff was reviewed line-by-line against the pre-change backup to confirm no unintended change
landed anywhere.

## Pre-existing test fallout (a second, related discovery)

Re-running the 12 corresponding pre-existing test files after the card-code fix surfaced **8 files with new
failures** (`test_auto_cycle12/13/14/15/16/18/19/20.js`, 20 individual assertions) — not regressions from the
fix, but a **second bug of the same shape** that had been masking the first: these test files called the
affected handlers directly with `scheduleHandlerV7(name)(entry)` (passing the **full schedule entry** as the
sole argument) rather than going through the real `runDueSchedulesV7` production call path. Under the old,
buggy handler code (`(entry) => entry.args.X`), this test-side convention happened to line up — the test's
`entry` argument really did have a `.args` property, since the test passed the *entry itself*, not the
unwrapped args. Two wrongs cancelled out: the handler's own bug and the test's non-production calling
convention matched each other, so the tests passed without ever exercising how the card is actually invoked in
a real duel. Fixed all 22 call sites (`scheduleHandlerV7(name)(entry)` → `scheduleHandlerV7(name)(entry.args||{}, entry)`),
matching `runDueSchedulesV7`'s real signature. All 8 files still pass after the update — confirming the
underlying card *logic* was already correct in every case; only the parameter-unwrapping plumbing (in both the
cards and the tests that called them) was broken.

## Dedicated test

`node tools/test_s03_u69_schedule_handler_args_bugfix.js` — 9 assertions, all pass, real DUEL path throughout
for two representative fixed cards from different files and different schedule timings:

- **ファイターズ・エイプ** (`cards/C0_auto_cycle18.js`, `endPhase`, `turns:0`): a real battle destruction (a
  real `PROCESSOR_V27.ATTACK`) raises its ATK by 300 and creates a real `endPhase` schedule entry (previously
  silently never created — well, created but never *fired*); a real, fully journaled
  `PROCESSOR_V27.PHASE` transition to End Phase fires it for real, resetting the ATK back down since the
  monster did not attack again that turn. Closed with a clean Replay audit.
- **カース・オブ・ヴァンパイア** (`cards/B4_auto_cycle12.js`, `standbyPhase`, its own next turn): a real battle
  destruction (this time as the defender, against 青眼の白龍) pays 500 LP plus the real 1000 battle damage and
  creates a real `standbyPhase` schedule entry; firing it through the real `runDueSchedulesV7` production call
  path (not a direct handler call) Special Summons it from the GY for real.

## Regression sweep

Re-ran all 16 potentially-affected test files (the 12 directly touched, plus 4 others that already used the
correct scheduler-handler calling convention as a sanity check they remain unaffected):
`test_auto_cycle06/07/09/11/12/13/14/15/16/18/19/20/48/53.js`, `test_lp_change_cards.js`,
`test_stat_modifier_cards.js` — all pass, 0 FAIL across every file.

## Gate

- `python tools/check.py` — EXIT 0, **13079 PASS / 0 FAIL**, no `Traceback`, no `ReferenceError`, no
  duplicate top-level function declarations (log `s03_u69_full_gate.log`).
- `python tools/s03_status_audit.py` — EXIT 0: 70 declared status changes (unchanged from U68 — no new
  promotions; every affected card was already TESTED via its own pre-existing test file, now actually
  exercising the real invocation path instead of a masked-by-two-bugs shortcut).
- Coverage: unchanged (TESTED 2115).
- Acode build skipped for this unit per current instruction (generate only at release or on explicit
  request).

## Real-duel measurement

None of the ~30 affected cards are on any `1103_MAJOR_DECKS_v1` fixed list, so no R1 sweep applies; the
dedicated test's two full real-path examples (each closed with a Replay audit where the shortcut used allowed
one) plus the 8 updated pre-existing test files (now correctly exercising all ~30 affected cards' scheduled
effects) are this unit's evidence.

## Source hash

Gated source manifest SHA256 (excluding `dist/`, `*.log`, checkpoint zips, this report set aside):
`77cfe994e20369c8f9d7996a864f6e52486ac6b5233b4248c50700cc631d5f9c` (783 files).

## Remaining

- None specific to this bug class — the static scan confirmed all 34 buggy registrations found are now fixed,
  and the 38 already-correct registrations elsewhere were re-confirmed by the same scan to be sound.
- Per the fixed fallback order, continuing directly into the next Requirement.
