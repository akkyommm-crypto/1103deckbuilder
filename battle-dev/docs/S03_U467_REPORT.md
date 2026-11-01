# S03-U467 — 二重の落とし穴

## Result

- Promoted `二重の落とし穴` from `ENGINE_GAP` to `TESTED`.
- Battle cleanup now preserves whether a destroyed Gemini monster was treated as Gemini Summoned before Equip/field continuous sources are removed.
- The Set Trap responds through the real `onSendToGrave` event and chain path, then destroys every opponent monster.

## Verification

- Positive: `超合魔獣ラプテノス` dynamically grants the state to `灼熱王パイロン`; battle destruction opens and resolves `二重の落とし穴`.
- Negative: a Gemini without the granted/second-summoned state does not trigger it.
- Negative: effect destruction does not trigger it.
- Replay audit must reproduce the final digest.

Dedicated test: `tools/test_s03_u467_double_trap_hole.js`.
