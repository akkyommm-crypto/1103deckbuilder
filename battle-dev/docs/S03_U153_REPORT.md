# S03-U153 — クリボー / ネクロ・ガードナー / 打ち出の小槌: effects carried out (were manual notes)

## Why
- A scan of every script in effect for `API.registerPendingEffect` (the "please do it by hand" note that 速攻のかかし used before
  U152) found three more. 冥府の使者ゴーズ's old one is overridden by its U50 script.

  | Card | Status | Before |
  |---|---|---|
  | クリボー | TESTED | Not a quick effect, so never offered in DUEL. Any battle, the discard after resolution, and the note 「受けたLPを戻してください」 (the battle damage was not prevented). Its "tests" only use it as a plain monster body (test_activation_cards, test_token_cards …). |
  | ネクロ・ガードナー | IMPLEMENTED | The note 「攻撃を止めてバトルを続行してください」; banished after resolution; the attack was not negated. |
  | 打ち出の小槌 | IMPLEMENTED | A note; also needed at least one other hand card, although 「任意の数」 includes 0. |

## Change
- New `cards/HZF_claude_s03_u153_manual_notes.js`. Its definitions replace the old ones in `cards/00_generic_core.js`.
  - クリボー:
    - a hand quick effect at the damage calculation (`dsTiming:'calc'`, `damageStepOnly`) of an opponent monster's attack;
    - the discard is the cost (`a6HandCost`);
    - the resolution marks the card with this battle's attacker and this turn;
    - a continuous `battleDamage` hook, working from the GY / banished zone, makes its controller's battle damage 0 for that battle
      only.
  - ネクロ・ガードナー:
    - a GY quick effect in the opponent's turn, not in the Damage Step; banishing itself is the cost;
    - during an attack: `API.negateAttack`;
    - otherwise: the banished card is marked for this turn, and the next attack that opponent declares this turn is negated at its
      declaration. `pendingAttackNegatorsS03` (engine/1ZS) is called by `processAttackV27` right after `ATTACK_DECLARE_V48`; it uses
      journaled `NEGATE_ATTACK_V45` and removes the mark.
  - 打ち出の小槌:
    - a choice of 0 up to all hand cards;
    - the chosen cards are returned to the Deck, the Deck is shuffled, and the same number of cards is drawn.

- The three old definitions are removed from `cards/00_generic_core.js`, leaving a pointer comment. They are not kept as
  overridden duplicates: `test_expansion_v340.js` / `test_expansion_v350.js` require every script name to be defined once. The
  first pre-scan caught this, with both files stopping at 0 PASS.

## Test — `tools/test_s03_u153_manual_notes.js` 11/0 (real DUEL path, Replay-audited)
- A クリボー:
  - offered in the damage calculation window of a direct attack; discarded; 2500 → 0;
  - the next direct attack (2300) deals damage.
- B ネクロ・ガードナー at the attack declaration: banished, the attack is negated (ワイト survives), and the second attack destroys
  ワイト.
- B2 ネクロ・ガードナー in the Battle Step window after a first attack (no attack pending): banished; the next direct attack (2500)
  is negated at its declaration.
- C 打ち出の小槌: 2 of 3 hand cards chosen → 2 returned to the Deck, 2 drawn, デーモンの召喚 stays; hand 3, Deck 4.
- Negative control on U152 (`dist/battle.html` + this test): 6 FAIL, 0 errors.
- Tests using クリボー as a plain monster keep their counts (test_activation_cards, auto_cycle06 / 20, test_battle_cards,
  test_token_cards, v500 batch02, u146).

## Found (recorded)
- The engine opens no response window for the non-turn player when the Battle Phase starts (no Start Step window). It goes
  straight to the turn player's attacker selection. So a card such as ネクロ・ガードナー can be used outside an attack only in the
  Battle Step window after an attack, not at the start of the Battle Phase.

## Status
- IMPLEMENTED → TESTED: ネクロ・ガードナー, 打ち出の小槌. クリボー stays TESTED, now for its real effect.
- TESTED 2231 → 2233, IMPLEMENTED 93 → 91.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14337 PASS lines (= U152 14326 + 11 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 372 gate tests (parallel, second run after removing the duplicate definitions): every exit code 0, 0 FAIL; per-file
  PASS / Error counts equal to U152 except the new test.
- `dist/battle.html` SHA256 `b51e0cba349b0783fe94ee5f2707a6037e0d17442094b627936a1b5c3b7cd929` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `401c6e65dfd0055a91aa1da8c73761e622ab43332a0cfc8076e81653e8f1ecfd`.
- Coverage: TESTED 2233, IMPLEMENTED 91, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 200 declared status
  changes, 0 off-target.
