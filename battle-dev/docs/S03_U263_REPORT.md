# S03-U263 — Activation-time declarations that never committed: DNA移植手術, DNA改造手術, 幻惑の巻物

## Workflow
- opus-only. This is a behaviour fix with no status change: the three cards stay TESTED, now backed by a real-path test.
- Found during the S03-U261 review. A P1.1 declaration (`API.declare` with `activation:d`) whose resume is `null` records the declaration but never commits the activation: no CHAIN_ADD, so the card never resolves.
- These three cards (cards/9C) did exactly that. Their tests (`test_characteristic_cards`, batch14 / batch24) set the declaration with `API.persistDeclaration` directly and never activated the card.
- Found by searching cards/ for every activation-time declaration; the other users already pass `p11cards.declare-commit`.

## Fix — cards/9C_characteristic_recovery.js
- **DNA移植手術 / DNA改造手術:** the declaration resumes with `p11cards.declare-commit`, so the activation commits and resolves, and the declaration is persisted on the card.
- **幻惑の巻物 (Equip Spell):**
  - It also never chose a monster to equip.
  - Now, at activation: declare the Attribute (journaled) → choose a face-up monster (`p11cOpen` → `p11cards.commit-targets`).
  - At resolution: equip it (`API.equipSpell`) and persist the declaration.
  - It cannot be activated without a face-up monster.

## Tests
`tools/test_s03_u263_declare_commit.js` passes 8/0, on real DUEL paths and Replay-audited.
- A: DNA移植手術 is activated from a Set, 光 is declared, the chain resolves and the declaration is persisted; both players' monsters become LIGHT.
- B: DNA改造手術, declaring ドラゴン: both monsters become Dragon.
- C: 幻惑の巻物 from the hand, declaring 炎 and choosing the second ワイト: only that one becomes FIRE.
- C2: not legal without a face-up monster.

Negative control on U262: 5 FAIL. One assertion was strengthened after the first control, which showed "chain empty" holds trivially when nothing was ever chained.

The existing tests of these cards and all tests touching declarations still pass.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16825 PASS / 0 FAIL** (= U262 16817 + 8 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U262.
- Coverage: TESTED 2817, ENGINE_GAP 561, NOT_STARTED 942, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 778 declared, 0 off-target.
