# S03-VS1 Vertical Slice #1 Regression — Dragunity (provisional) vs 1103兎ラギア (Claude)

Base: `checkpoint_claude_s03_u11_exclusion_restriction_20260911.zip`, SHA256 `f2d7eac3b957595a4ba2b28d99f9bf7236f3f87316600140eb954bb63f45092a`.

## Purpose

- **What a representative-deck check is for.** The Master Prompt asks for one every 3 or so clean units, run on the real game path.
  - Slice #1 was first run as a probe after U07. It found three Requirements: F3 → U08 (journaled flags), F2 → U09 (offer legality) and F1 → U10 (card activation vs effect).
  - F5 → U11 came from U10's measurement.
- **This unit turns the slice into a permanent regression test,** now that those units are closed. It adds no engine change.

## The path (fixed deck order, no shuffle)

- **T1 (P1, Dragunity provisional 40 + EX):**
  - normal draw;
  - activate **竜の渓谷** as a card only (U10), then activate its effect from the field: discard ドラグニティ－ファランクス, add ドラグニティ－ドゥクス;
  - Normal Summon ドゥクス, whose trigger equips ファランクス from the GY;
  - ファランクス Special Summons itself;
  - Synchro Summon ドラグニティナイト－ヴァジュランダ, which equips ファランクス (ATK 1900);
  - set 奈落の落とし穴; End Phase.
- **T2 (P2, 1103兎ラギア sample):**
  - Normal Summon レスキューラビット; P1's 奈落 is **not offered** for 300 ATK (U09);
  - レスキューラビット banishes itself and Special Summons two セイバーザウルス (U08 journaled end-destroy marks);
  - P1's 奈落 **is offered** for 1900 ATK and banishes both.
- **T3 (P1):**
  - ヴァジュランダ sends its equip as cost and doubles to 3800;
  - direct attack takes P2 to 4200;
  - Main Phase 2; **Replay audit of the whole live journal**; save.
- **VM2:**
  - the saved state loads with a matching digest (ヴァジュランダ is still 3800);
  - End Phase, then turn 4 for P2, and ヴァジュランダ is back to 1900;
  - Replay audit.

## Findings during conversion

- **First run stopped in T1, caused by the test helper, not the engine.**
  - The helper `drive()` checked the SEGOC state before the pending choice.
  - After picking ドゥクス's trigger, its equip choice was pending, but the SEGOC group stays open until that choice is answered. So `drive()` kept reporting 'evt', and the loop re-picked the trigger.
  - Fixed: a pending choice is answered first.
  - The fixture list was also corrected from 38 to 40 cards.
- **No new engine stop.** The full path, the save / VM2 continuation and both Replay audits pass.

## Requirement closure record

- **Requirement.** Representative real-path regression for the Dragunity line against the sample opponent. This is a VALIDATION unit.
- **Root cause.** Not applicable; this unit adds no engine change.
- **Closure.** New `tools/test_s03_vs1_dragunity_slice.js`, wired into `tools/check.py`.
- **Consumers.** The regression gate.
- **Recovery.** None. Every card named in the test is TESTED or GENERIC_OK. The 兎ラギア list is built at runtime, and only its arranged top cards are named. There is no status change.
- **Remaining.** The deck is provisional, not legality-checked, and not a user deck.
- **Next slice.** A 六武衆 list, now that 六武の門 can be activated (U10). Also the candidate Requirement: chain-response reachability of face-up Continuous/Field effects.
- **Practical effect.** Any future change that breaks this real line (card activation, trigger offers, equips, Synchro, battle, SaveLoad or Replay) fails the gate.

## Changed files

- `tools/test_s03_vs1_dragunity_slice.js`: new.
- `tools/check.py`: wiring.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md` (unchanged content expected).

## Verification

- **`node tools/test_s03_vs1_dragunity_slice.js`:** EXIT 0, 21 PASS. VM1 Replay covered 132 actions and was OK; the VM2 continuation was OK.
- **Full gate:** `python tools/check.py` — EXIT 0, **11908 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_vs1_full_gate.log`).
- **Acode:** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `58b5eb3c5191c1ee8dafac97295c738d623093efadc71f3120b831a587851a17` (599 files).
