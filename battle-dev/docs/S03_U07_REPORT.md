# S03-U07 C-S03-04 RESOLVED_SPELL_TO_GY (Claude)

Base: `checkpoint_claude_s03_u06_rabbit_opponent_ui_20260911.zip`, SHA256 `565066f9543124aed0f6b620ef4e50f6bb90be61020d3973b4d6dfb5d9c8083a`.

## Requirement closure record

- **Requirement:** a Normal/Quick-Play Spell or Normal/Counter Trap that resolves as a chain link is sent to the GY once its resolution finishes. This follows the basic rule; it is not a card-specific ruling.
  - Exceptions:
    - cards whose own text keeps them on the field (「このカードは発動後、フィールドに残り続け」);
    - cards that became Equip Cards;
    - cards that moved or set themselves during resolution (for example くず鉄のかかし).
- **Root cause:** INTEGRATION_MISSING.
  - In `afterPreparedResolve` (`engine/30_processor_chain_battle.js`), any script with `sc.afterResolve` skipped the default `selfToGrave`.
  - The unified adapter (`defineUnifiedCardV4`) always defines `afterResolve` and calls the effect's `afterResolve`, which is usually empty.
  - So unified spells and traps stayed face-up in the S/T zone after resolving.
  - TESTED status did not cover this: the tests asserted the effect, not the card's final location.
- **Closure**
  - New `settleResolvedSpellTrapV32(link, ctx, sc)`, run after any script `afterResolve` or the default `selfToGrave`.
  - It sends the resolving card to the GY with the journaled action `FX_SELF_TO_GRAVE` only when all of these hold:
    - the chain link has no `keep`;
    - the card is a Spell or Trap;
    - the script does not declare `remainsOnFieldAfterResolve`;
    - the card (same uid) is still in `sz` or `field`, face-up, and not equipped (`equipTo`).
  - Continuous, Field and Equip cards keep their existing `link.keep` path and are untouched.
  - The new flag `remainsOnFieldAfterResolve:true` is set on 光の護封剣.
- **Consumers:** every chain resolution of an activated Spell or Trap card, both unified and legacy.
- **Recovery (cluster)**
  - Heuristic scan: **309** unified non-Continuous/Field/Equip Spells and Traps declare an empty effect `afterResolve(){}` and never move themselves. All are TESTED and all were affected.
  - A further 40 finish through their choice handlers and were already correct.
  - The 108 legacy Normal/Quick/Trap scripts already went to the GY. The new step is a no-op for them because the card is no longer in `sz`.
  - No status change: these cards were already TESTED, and U07 adds a location regression test on top.
- **Dependent classification**
  - ① covered: the 309 unified cards above. The representative regression covers 調和の宝札, トレード・イン, 太陽の書, アドバンスドロー, 押収, 強引な番兵, 化石調査 (unified spells); 援軍 (unified Normal Trap); and 心変わり (legacy spell).
  - ② other dependency:
    - 大進化薬 (ENGINE_GAP, no script) also stays on the field by its text.
    - It needs `remainsOnFieldAfterResolve:true` when it is scripted. Its other gaps are the activation tribute cost and the opponent-turn destroy schedule.
  - ③ ruling unresolved: none. A scan of carddata finds only these two non-Continuous Spells/Traps with 「発動後…フィールドに残り」 text.
  - Guards that keep behaviour correct:
    - self-setting traps stay face-down;
    - equip-becomers carry `equipTo`;
    - trap monsters are in `mz`;
    - self-banishers and self-returners are no longer in `sz`.
- **Practical effect**
  - S/T zones no longer clog after ordinary spells and traps, and the GY count is right for GY-count cards and tribute/banish costs.
  - Wrong targets are removed: a resolved card can no longer be picked by サイクロン-style removal.
  - 調和の宝札 in the Dragunity plan now leaves the zone, which unblocks vertical slice #1.

## Changed files

- `engine/30_processor_chain_battle.js` (`afterPreparedResolve` → `settleResolvedSpellTrapV32`)
- `cards/00_generic_core.js` (光の護封剣 `remainsOnFieldAfterResolve:true`)
- `tools/test_s03_u07_spell_to_grave.js` (new), wired into `tools/check.py`
- `tools/test_s03_u05_search_flags.js` (the temporary 化石調査 location exemption from U05 is removed; it now asserts GY)
- generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`

`dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u07_spell_to_grave.js`:** EXIT 0, 32 PASS. For each card:
  - it is legal in the fixture, resolves through the real chain, and its effect happens;
  - it ends in the GY, not in `sz`;
  - the Replay is non-empty and consistent.
  - 光の護封剣 stays face-up on the field. The Equip Spell 団結の力 stays equipped.
- **Earlier dedicated tests on the U07 build:** U01–U06 = 56 / 76 / 57 / 38 / 46 / 21 PASS.
- **Full gate:** `python tools/check.py` EXIT 0, **11789 PASS / 0 FAIL** (`s03_u07_full_gate.log`). S03 audit: off-target status changes = 0.
- **Acode:** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage (unchanged)

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
