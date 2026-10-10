# S03-U282 — 「地縛神」 common clauses (only one face-up, no Field Spell → destroyed, not an attack target, direct attack): 地縛神 Ccapac Apu, 地縛大神官

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- The class-B triage had 地縛大神官 needing "a destruction-source filter"; the 地縛神 monsters themselves were all NOT_STARTED.
- This unit builds the common 地縛神 part and one reference member. The other six members' own effects are normal work for Sonnet units.

## Engine — engine/1ZZM_earthbound_s03.js (new) + engine/40, 19, 1ZZF
- **Face-up uniqueness:**
  - A script with `uniqueFaceUpS03: GROUP.X` cannot be Normal / Flip / Special Summoned face-up while another face-up member of that group is on either field (`uniqueFaceUpReasonS03` in `v46FaceUpSummonRestrictionReason`). A Set is still allowed.
  - A member turned face-up by an effect while another is face-up is flagged by the position detector (engine/19) and destroyed by the field-dependent enforcement (engine/1ZZF), as a journaled automatic action.
- **`earthboundCommonS03(def)`** adds the shared clauses to a 地縛神 script:
  - `uniqueFaceUpS03: GROUP.EARTHBOUND`;
  - destroyed by its own effect when no face-up Field Spell exists on either field;
  - the opponent cannot choose it as an attack target;
  - `canDirectAttack`.
- **`continuous.noSelfEffectDestroyS03(card)`** on a face-up source: that card's own 「…の場合このカードを破壊する」 does not destroy it (checked in engine/1ZZF).

## Cards → TESTED (2011 texts) — cards/HZZZZZJ_claude_s03_u282_earthbound.js
- **地縛神 Ccapac Apu:**
  - the common clauses;
  - when it destroys an opponent monster by battle (attacking or attacked), damage equal to that monster's original ATK (forced).
- **地縛大神官:** while it is face-up, 「地縛神」 monsters are not destroyed by their own effects.

## Tests
`tools/test_s03_u282_earthbound.js` passes 16/0, on real DUEL paths and Replay-audited.
- U1: a second 地縛神 cannot be Normal Summoned while one is face-up on either side, but can be Set. With none face-up it can be.
- U2: no Flip Summon while another is face-up. Turned face-up by 太陽の書, it is destroyed.
- F1–F3: the Field Spell destroyed by サイクロン → it is destroyed. With 地縛大神官 it stays. The opponent's Field Spell counts.
- A1–A3:
  - the opponent cannot attack it;
  - it attacks directly past a monster;
  - it destroys ジェネティック・ワーウルフ for 1000 battle damage plus 2000.

Negative control on U279 (engine/40, 19, 1ZZF and the manifest of U279): 8 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17572 PASS / 0 FAIL** (= U281 17556 + 16 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U281.
- Coverage: TESTED 2890, ENGINE_GAP 502, NOT_STARTED 927, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 852 declared, 0 off-target.
- Published in the batched checkpoint S03-U280–U283.
