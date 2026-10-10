# LATEST

## GitHub migration state (2026-10-10)

- GitHub source branch: the branch containing this file, initially `integration/github-migration`; accepted releases are merged to `main` only after CI and review.
- Development tree: `battle-dev/` in `https://github.com/akkyommm-crypto/1103deckbuilder`.
- Public artifact: repository-root `battle.html`, synchronized with `battle-dev/dist/battle.html`.
- Imported clean source remains the U302 checkpoint recorded below. U303 was a no-change validation note; the unpublished U304 driver change was not present in the clean checkpoint and has not been claimed or reconstructed.
- Legacy OneDrive paths below are provenance and recovery references. New Codex/Claude handoff uses Git branches, pull requests, and `coordination/CLAUDE_RESUME.md`.

Current clean checkpoint:

- file: `checkpoint_claude_s03_u302_u302_batch10_20261010.zip`
- location: `1103_SHARED\checkpoints\checkpoint_claude_s03_u302_u302_batch10_20261010.zip`
- created: 2026-10-10 JST (writer: Claude; batched checkpoint U302–U302)
- SHA256: `a155a07610dc86b0f7a34a5bfe9b9f910565a2f2035b9396a393e96bc4d2d040`
- size: 10,006,284 bytes
- file count: 1526
- integrity: OK (`ZipFile.testzip()`; shared copy SHA / size / entry count match the local file)
- previous clean: `checkpoint_claude_s03_u298_u299_batch9_20261010.zip` (SHA256 `477303a11c1fead3601eb878fa51f2276991cf242b6046e3f403439937c78e65`) - U301
- handoff: `coordination/CLAUDE_RESUME.md`
- latest unit log: `coordination/S03_U302_U302_BATCH10_PUBLICATION.md`

## Gate

- command: `python tools/check.py` - EXIT 0
- PASS lines: 18178
- FAIL: 0
- log search: no `FAIL`, `Traceback`, or `ReferenceError` (one caught `TypeError` stack from `test_auto_cycle32.js` = existing recorded noise)
- `dist/battle.html` SHA256: `b2f2a21b1080ee682c12656fdad4bc311d6299b600b134b888e1ffdc351ed6e7` (U302 build)
- `dist/battle_acode.html` SHA256: `bcc7f2a9090141ed90d8777459a3076b6775a9158b8fb72b40f797e7af3f9dbe` (U302 build, regenerated after the gate; inside the ZIP)
- source manifest SHA256: `4f8c5e7119f899cb0458086b2de4f4e98fd5f2ce9abf92fa4e885467cd653874` (1523 files)

## Coverage

- TESTED: 2927
- ENGINE_GAP: 472
- NOT_STARTED: 920
- IMPLEMENTED: 3
- GENERIC_OK: 644
- PARTIAL: 30
- TOTAL: 4996
- Declared status changes observed: 889
- Off-target changes: 0

## User-reported bugs — status
- U114 (2 user bugs + saved-deck selection, 3 feature requests) and U121 (builder launch flow): **confirmed OK on device by the user (2026-09-26)**.
- U172 (user report 2026-09-26: Player2 could only start with the sample 兎ラギア): fixed; please check on device with `acode/battle_acode_s03_u291.html` (latest build, includes the fix).
- U173 (your decision: optional destruction substitutes pause and ask): done; please check the substitute sheet on device with `acode/battle_acode_s03_u291.html`.

## Latest change (U302–U302, one checkpoint) - 霞の谷のファルコン attack-declaration cost

- S03-U302: 霞の谷のファルコン: the attack-declaration cost of returning another own card.
- Device HTML: dist/battle_acode.html in the ZIP.

## Previous change (U298–U299, one checkpoint) - wider duel exploration and hand-trigger offers

- S03-U298: Wider real-duel exploration: save / resume at every stop, 150-turn cap, a Flip trigger of a monster that left the field.
- S03-U299: Hand-activated trigger audit of the 13 major decks.
- Device HTML: dist/battle_acode.html in the ZIP.
