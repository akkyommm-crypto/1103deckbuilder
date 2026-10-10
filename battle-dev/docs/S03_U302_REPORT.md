# S03-U302 — 霞の谷のファルコン: the attack-declaration cost of returning another own card

## Workflow
- opus-only engine unit. The Sonnet unit S03-U301 stopped and reported it as engine-core work: no attack cost with a player choice existed.
- Tree s03_u296, the single current tree.
- Context: the user-reported item 「ジェムナイト・パール vs 霞の谷のファルコン with 禁じられた聖杯」 was not reproduced in S03-U300 (720+ cases). The Falcon itself had no script and played as a vanilla monster.

## Engine — engine/1ZZQ (new), engine/00, engine/30, engine/70
- A script declares `attackReturnCostS03:true`.
- `canDeclareAttackV48` refuses such a card while no other own card is on the field (Monster / Spell & Trap / Field Zone). The check is skipped once the cost of this declaration is paid (`costPaidS03` in the ATTACK payload).
- Every UI attack request (`battlePickTargetV29`, `battleDirectV29`, `doAttack`) goes through `requestAttackS03`:
  - it opens a registry choice of the other own cards, cancelable (no attack, the attack is not used up);
  - the answer returns the card to its owner's hand and requests the attack by uid, since returning a monster shifts the indices.
- Save / resume during the choice works: it is a registry choice with JSON args.

## Card (cards/HZZZZZS)
- 霞の谷のファルコン: NOT_STARTED → TESTED.

## Not done
- 波動竜騎士 ドラゴエクィテス stays NOT_STARTED. 「同名カードとして扱い、同じ効果を得る」 needs scripts to be looked up by more than one name at every `CARD_SCRIPTS[cardName(c)]` site: engine-core work. It is rare in the major decks and does not stop duels.

## Tests
`tools/test_s03_u302_falcon_attack_cost.js` passes 13 / 0, Replay-audited.

| Case | Situation | Result |
|---|---|---|
| F1 | Attack a monster | The cost choice lists the 2 other own cards (not the Falcon); a set Trap is returned; ワイト is destroyed |
| F2 | The Falcon alone | It cannot attack |
| F3 | The cost choice is cancelled | No attack; it can still attack |
| F4 | Direct attack | Its own ワイト is returned; 2000 damage |
| F5 | Save / resume during the cost choice | The monster to its left is returned; the attack lands |

Negative control (the cost hook disabled): 8 FAIL, no crash.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18178 PASS / 0 FAIL** (= U301 18165 + 13 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U301.
- Coverage: TESTED 2927, ENGINE_GAP 472, NOT_STARTED 920, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 889 declared, 0 off-target.
- Published in the batched checkpoint S03-U302–U302.
