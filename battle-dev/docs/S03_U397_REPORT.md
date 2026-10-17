# S03-U397 - Black Cat Bringing Misfortune (不幸を告げる黒猫), Bone Crusher (ボーンクラッシャー), Sergeant Electro (エレクトロ軍曹)

Base: `claude/work` `795d2fe` (U396, gate 20741 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZZZG_claude_s03_u397_cat.js`)
- 不幸を告げる黒猫: forced onFlip trigger; the chosen Trap goes on top of the Deck via the registry handler p20rev.opponent-topdeck (S03-U212), or into the hand (API.searchDeck) when 王家の眠る谷－ネクロバレー is face-up on the field.
- ボーンクラッシャー: optional onSpecialSummon trigger on itself (revived from the Graveyard by an Undead monster's effect, read from card.summonSrcS03 of S03-U238) destroying one Spell / Trap of the opponent; a forced End Phase trigger destroys it in the turn it was Special Summoned.
- エレクトロ軍曹: once-per-turn ignition targeting a Set Spell / Trap of the opponent; the uid is added to a zone-local card flag and activationLockS03 forbids that Set card's activation while the monster is face-up.

## Existing test changed (reason)
- `tools/test_auto_cycle21.js`: the SKIP assertion "ボーンクラッシャー is not implemented" described the old build; it is replaced by "has a script with its consumer" (same assertion count; precedent 大熱波 S03-U384).

## Tests
- `tools/test_s03_u397_cat.js` 17 / 0. Negative control on the previous build (card file removed): 7 FAIL. Coverage TESTED 3336 -> 3339, NOT_STARTED 534 -> 531; `registration_names_missing_from_db` empty; audit 0 FAIL.
