# S03-U404 - Dimension Fortress Weapon (次元要塞兵器), G.B. Hunter (G・B・ハンター), Reincarnation Cutoff (転生断絶)

Base: `claude/work` `a2565d3` (U403, gate 20838 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Cards (`cards/HZZZZZZZZZN_claude_s03_u404_decklock.js`)
- 次元要塞兵器, G・B・ハンター: scripts with the flags deckToGraveLockS03 / fieldReturnLockS03.
- 転生断絶: Continuous Trap (plain placement ACTIVATE) with graveToDeckBanishS03.

## Engine (small)
- `engine/1ZZU_deck_locks_s03.js` deckLockSourceS03 and the three predicates; `engine/00_state_actions.js`: FX_TO_GRAVE (deck), FX_MILL and FX_MILL_TOP refuse while deckToGraveLockedS03; FX_RETURN_DECK refuses field returns while fieldReturnLockedS03 and banishes a Graveyard card while graveToDeckBanishedS03.

## Tests
- `tools/test_s03_u404_decklock.js` 12 / 0. Negative control on the previous build (card file removed): 5 FAIL. Existing test changed: `tools/test_auto_cycle21.js` - the SKIP assertion "G・B・ハンター is not implemented" described the old build; it is replaced by "has a script with its consumer" (same assertion count; precedent 大熱波 S03-U384, ボーンクラッシャー S03-U397). Coverage TESTED 3359 -> 3362, NOT_STARTED 511 -> 508, PARTIAL 10 -> 10; `registration_names_missing_from_db` empty; audit 0 FAIL.
