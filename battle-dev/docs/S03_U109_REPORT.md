# S03-U109 — 未来融合－フューチャー・フュージョン R1 slice (Codex WIP, completed and published by Claude)

## Origin
- Work started by Codex (2026-09-23) on the clean U108 base and saved as WIP at a user-requested stop point:
  `logs/S03_U109_WIP_FUTURE_FUSION_R1_SLICE_20260923.md`, patch `88bc84fd…`, changed-files zip `d5225ad3…`.
- Claude resumed it (2026-09-23) in a fresh tree: extracted U108 (`3719af88…`, hash verified), applied the WIP
  changed-files zip after verifying it reproduces the WIP patch line-for-line (96 changed lines, identical up to
  path normalisation), rebuilt `dist/battle.html` (SHA256 `559d841d…`, byte-identical to the WIP build).

## Requirement
User-prioritised old-spec (2011) 未来融合－フューチャー・フュージョン on the Dragunity route: unsupported 0,
material send, delayed 2nd-own-Standby summon, Replay coverage.

## Change (unchanged from the WIP)
- `engine/40_legal_script_engine.js`: `API.specialSummon(p, from, index, pos, reason, fromPlayer, opts)` —
  optional trailing `opts` merged into `FX_SPECIAL_SUMMON`; every existing call is unaffected.
- `cards/HF_claude_s03_u59_future_fusion.js`: the delayed F・G・D summon passes `{summonKind:'fusion'}`.
  Verified consumer: the reducer stores it as `card.specialSummonKind` / `ssHistory.kind`, which real
  scripts read (e.g. 融合失敗's `specialSummonKind==='fusion'` trigger) — a real state change, not a label.
- `tools/r1_duel_driver.js`: `futureFusion` diagnostics from the journal (play policy unchanged).
- New `tools/test_s03_u109_future_fusion_r1_slice.js` (fixed Dragunity vs rabbit, seed `0x52310006`),
  U59 test gains the Fusion-kind assertion; registered in `tools/check.py` and `CARD_TEST_FOCUS`.

## Verification (Claude, U109 tree)
- Focused/adjacent: U59 31/0, U109 7/0, U96 6/0, U97 11/0, U108 12/0.
- `python tools/script_coverage.py`: distribution unchanged (TESTED 2153, total 4996).
- `python tools/s03_status_audit.py`: 108 declared changes, off-target 0.
- Full Gate `python tools/check.py`: EXIT 0, 13439 PASS lines (U108 13431 + 8), 0 FAIL, no Traceback /
  ReferenceError. The single caught `TypeError` stack printed at the start of `test_auto_cycle32.js` is the
  existing noise recorded by Codex in U108.
- No card status change. Acode not regenerated (ordinary unit): `dist/battle_acode.html` in this checkpoint is
  still the U108 build.
