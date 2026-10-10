# CODEX-C01 — Exodia special-win resolution boundary

`specialWinCheckS03` previously ran after every Action.  A chain effect that drew a fifth Exodia piece and then moved one away could therefore end the duel mid-resolution; a two-player draw effect could award the first processed player before the other draw.

Each real `SOLVE_CHAIN` link now opens a journaled `SPECIAL_WIN_DEFER_S03` boundary immediately before `CHAIN_RESOLVE_TOP`.  The boundary remains in serializable game state through the link's registry choices, deferred destruction substitute choices, and Special Summon position choices.  It closes before the queued Adjust and next lower link.  Normal draws and searches remain immediate.  The replay digest includes the in-progress boundary.

The processor now also stops its current drain when an Action reaches any terminal duel result.  This prevents a lower link already queued in the same pump from changing the completed hand.  The defer actions use the automatic-action journal path: they remain Replay-visible but do not create false Undo checkpoints.

Evidence: the supplied U279 reproduction was a negative control on U287 (2 expected failures), then passed after the repair.  `tools/test_codex_c01_special_win.js` covers normal draw, search, Dark World Dealings discard/retain, Card Destruction simultaneous completion, Jar of Greed CL2 winning before Mind Crush CL1 can discard, and resolution-choice SaveLoad with Replay audit.  The contemporary 2011 secondary ruling testimony and current official FAQ were supplied by the parent review; the implementation follows the stated per-link boundary.

No card scripts, status classifications, owner/controller routing, deck-out, or LP rules changed.

## Final validation

- Base: published U287, ZIP SHA256 `ecc16f8445f869654049e76379255c642b9a51fa8c8ac2f6a2f24a3ed8aadac4`.
- Final dedicated test: 18 PASS / 0 FAIL. Same test on unchanged U287: 11 PASS / 7 expected FAIL, exit 2, no crash.
- Per-test pre-scan: 507 files, 17,641 PASS, all exit 0. All 506 existing test counts equal U287; only the new C01 file adds 18.
- Full `python tools/check.py`: **17,732 PASS / 0 FAIL, GATE_EXIT=0** (U287 17,714 + 18).
- Traceback / ReferenceError: 0. One caught TypeError from `test_auto_cycle32.js`, matching the baseline's documented noise.
- Acode generated with the 4,996-card DB. Frozen sources and generated battle hash unchanged during final verification.
- Coverage classifications unchanged: TESTED 2,902; ENGINE_GAP 496; NOT_STARTED 921; IMPLEMENTED 3; GENERIC_OK 644; PARTIAL 30. No card-status promotions; no new CARD_TEST_FOCUS/status declaration is needed for this engine repair. Generated coverage only adds references to the new test.
- Replay audits pass; SaveLoad verification uses JSON serialization and production recovery helpers in the Node harness. Browser/device interaction is not newly verified.

## Review and rework

Terra medium implemented the code and regression tests; Astra reviewed the changes and ran final validation. Earlier gate attempts exposed false Undo checkpoints and an internal-action classification in U10. The former was fixed using the automatic journal path; the latter only adds SPECIAL_WIN_DEFER_S03 to U10's existing non-effect bookkeeping filter, without removing gameplay assertions. An additional upper-chain regression caught the processor continuing after a terminal result; the pump now stops. Earlier PowerShell logs corrupted UTF-8 and merged PASS lines; they are not acceptance evidence. Final logs capture process output directly as bytes.

Usage telemetry is unavailable; no measured token-saving claim is made. This is a standalone U287-based checkpoint, not a merge of Claude's unfinished U288–U290. In particular, U290 also edits engine/00_state_actions.js and engine/30_processor_chain_battle.js; merge by hunk and rerun validation on the integrated tree.

Ruling evidence: the [2011 secondary testimony](https://detail.chiebukuro.yahoo.co.jp/qa/question_detail/q1065531100) is contemporary but not an official source. The [current official FAQ](https://www.db.yugioh-card.com/yugiohdb/faq_search.action?fid=11354&ope=5&request_locale=ja) supports draw-then-discard completion timing but is dated after the project's historical cutoff; it is corroboration, not historical authority by itself.
