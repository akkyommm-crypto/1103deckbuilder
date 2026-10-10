# S03-U260 — Outdated ENGINE_GAP reasons: ブリザード・プリンセス, エレキリン, エレメント・ヴァルキリー, 氷結界の交霊師, 怨霊の湿地帯

## Workflow
- opus-only. I re-checked the ENGINE_GAP reasons against the capabilities added since S03-U217:
  - activation locks;
  - lingering sources;
  - the control lock;
  - the per-turn activation record.
- These five reasons no longer hold, or need only a small engine addition.
- Built on U259 before its rebase, then rebased onto the rebased U259 (`rebase_unit.py`, PREV = the kept pre-rebase U259).

## Engine
- **engine/1B:** the per-turn activation record (S03-U253) also records card activations of Spells / Traps (`activatedKindsS03.spellCard` / `trapCard`, from `link.cardActivationS03`). Used for 「1ターンに1度しか魔法・罠カードを発動できない」.
- **engine/00:** a Flip Summon (`FX_SET_STATE flipSummon`) writes `card.flipSummonedTurnS03` (zone-local).
- **engine/1ZD:** a lock source with `locksStEffectsS03:true` also locks the effects of face-up Spells / Traps; the other sources lock card activations only, as before. Used by エレキリン's 「魔法・罠・効果モンスターの効果を発動する事ができない」.

## Cards → TESTED (2011 texts; ENGINE_GAP overrides removed) — cards/HZZZZN_claude_s03_u260_unlocks.js
- **ブリザード・プリンセス:**
  - It can be Tribute Summoned in Attack Position with 1 Spellcaster (System v23 materialFilter), besides the standard 2 Tributes.
  - On the turn it was Normal Summoned, while it is face-up, the opponent cannot activate Spell / Trap cards (as フォトン・ケルベロス).
- **エレキリン:**
  - It can attack directly.
  - After dealing battle damage by a direct attack (forced), the opponent cannot activate Spell / Trap cards or effects, or monster effects, for the rest of the turn (lingering source).
- **エレメント・ヴァルキリー:** with a FIRE monster on the field +500 ATK; with a WATER monster its control cannot change.
- **氷結界の交霊師:**
  - Special summon from the hand when the opponent has 4+ more cards on the field.
  - While it is face-up, the opponent can activate only one Spell / Trap card per turn. Card activations earlier in the turn count.
- **怨霊の湿地帯:** monsters Normal / Flip / Special Summoned this turn cannot attack.

## Tests
`tools/test_s03_u260_unlocks.js` passes 22/0, on real DUEL paths and with the activation legality. Replay-audited.
- A: method candidates; the real Spellcaster Tribute Summon (method picked through `openPick`); lock this turn, none next turn.
- B: direct attack past monsters for 1200; locks on Trap and monster effect; none next turn.
- C: ATK with / without a FIRE monster; 心変わり with / without a WATER monster.
- D: the 4-card procedure (legal / not legal); the opponent's first and second Spell.
- E: Normal Summon and Flip Summon (`doFlipUp`) under the swamp, plus a control.

Negative control on U259: 10 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16737 PASS / 0 FAIL** (= U259 16715 + 22 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U259.
- Coverage: TESTED 2810, ENGINE_GAP 561, NOT_STARTED 948, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 771 declared, 0 off-target.
