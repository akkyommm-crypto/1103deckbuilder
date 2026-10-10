# S03-U261 — NOT_STARTED 6 (罰ゲーム!, 一族の掟, ヴェノム・スネーク, ヴェノム・ボア, 旋風剣, 古代の機械掌)

## Workflow (mixed, fresh Sonnet subagent)
- A fresh Sonnet subagent ran `brief261.md` and finished six of seven cards: 73/0, with no engine change. Its negative control gave 41 FAIL and no crash.
- It stopped on ヒーロー・ヘイロー, as the brief asked: 「相手の攻撃力1900以上のモンスターは装備モンスターを攻撃できない」 depends on the attacker, and engine/1ZU / 1ZR carry no attacker. The card stays NOT_STARTED, left for an engine unit.
- **Parent corrections (rulings), from the review:**
  - 罰ゲーム! chose its option at resolution. 「次の効果から1つを選択して発動する」 is chosen at activation, so it is now a journaled declaration (kind `mode`) in `activationV11`, applied at resolution.
  - 一族の掟 declared its Type at resolution. 「発動時に1種類の種族を宣言する」 is now declared at activation, kept on the card (`requestDeclarationV11` with the card as the persistence target). Its Standby upkeep trigger skips the declaration.
  - Both use the `p11cards.declare-commit` resume, because a declaration with a null resume never commits the activation.
- The test still passes 73/0 after the corrections.
- Found while doing this: DNA移植手術 and 幻惑の巻物 (cards/9C) declare with a null resume, so their DUEL activation may never commit. Their test sets the declaration directly. This is a follow-up for S03-U263.
- Measured: subagent 222,671 tokens, 87 tool uses, 632 s. Parent-side correction 1 (two rulings).

## Cards → TESTED (2011 texts) — cards/HZZZZO_claude_s03_u261_ns36.js

| Card | Effect / reuse |
|---|---|
| 罰ゲーム! | opponent's hand exactly 4. Option chosen at activation: they skip the draw of their next Draw Phase (`skipDrawTurnS03`), or cannot activate Spell / Trap cards this turn (`noSpellTrapActivationS03`) |
| 一族の掟 | Type declared at activation; monsters of that Type cannot attack; Standby upkeep: release 1 monster or destroy it (forced) |
| ヴェノム・スネーク / ヴェノム・ボア | once per turn, 1 / 2 Venom Counters on an opponent monster; it cannot attack that turn |
| 旋風剣 | 「D－HERO」 only (SETCODE.DESTINY_HERO, exact); after the equipped monster attacks, destroy a targeted Spell / Trap (forced) |
| 古代の機械掌 | 「アンティーク・ギア」 monsters only; at the end of the Damage Step, destroy the monster that battled the equipped monster (forced) |

Rulings chosen and reviewed:
- The Venom cards may target any opponent monster, as the text has no 「表側表示」.
- The Equip Spells are unified cards with `timing:['mainPhase','damageStep']`, so they can be activated from the hand.

## Tests
`tools/test_s03_u261_ns36.js` passes 73/0, on real DUEL paths and Replay-audited.

Negative control on U260: 41 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16810 PASS / 0 FAIL** (= U260 16737 + 73 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U260.
- Coverage: TESTED 2816, ENGINE_GAP 561, NOT_STARTED 942, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 777 declared, 0 off-target.
