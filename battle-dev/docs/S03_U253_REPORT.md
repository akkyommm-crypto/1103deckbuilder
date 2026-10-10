# S03-U253 — Per-turn activation record, 「通常召喚できない。「X」の効果で特殊召喚できる」, 「お互いに」 attack-target restriction

## Workflow
- opus-only, engine work. It picks up the three cards that the Sonnet units U250 and U252 returned because they needed an engine change:
  - ナチュル・スパイダーファング;
  - ハーピィ・レディ三姉妹;
  - マシンナーズ・スナイパー.
- Built on U251 while U252 ran, then rebased onto U252 (`rebase_unit.py`).

## Engine
- **Per-turn activation record (engine/1B).** `v12EmitActivation`, which runs inside the CHAIN_ADD reducer, writes `gs.players[p].temporaryFlags.activatedKindsS03[kind] = true`, with kind = spell / trap / monster.
  - temporaryFlags is cleared at every turn start, so the record covers "this turn".
  - It is written by a reducer, so Replay reproduces it.
  - Before, only `gs.lastActivationV12` (the latest single activation) existed.
- **Summon condition (engine/1ZK).** 「このカードは通常召喚できない。「X」の効果で特殊召喚できる／する事ができる」 (without のみ／しか) is now parsed as "only by X's effect".
  - Like 「でのみ」 (S03-U251), it is relaxed once the card was properly summoned (蘇生制限).
  - X also counts as the proper method (`properSummonSourcesS03`), so the U127 record is set.
  - Cards: ハーピィ・レディ三姉妹, and 不死王リッチー (still PARTIAL for its other effects; its summon by 大神官デ・ザード is unchanged).
- **Both-players attack-target restriction (engine/1ZU).**
  - `attackTargetForbiddenReasonS03` skipped every source whose controller is the attacking player, which is 「相手は」.
  - A card can now declare `continuous.cannotBeAttackTargetBothS03` for 「お互いに…攻撃できない」.

## Cards → TESTED (2011 texts) — cards/HZZZZG_claude_s03_u253_activation_log.js
- **ナチュル・スパイダーファング:** it cannot declare an attack unless the opponent activated a Spell / Trap / monster effect this turn.
- **ハーピィ・レディ三姉妹:** it has no effect besides its summon condition: only 「万華鏡－華麗なる分身－」 summons it.
- **マシンナーズ・スナイパー:** while it is in the Monster Zone, neither player can attack a face-up 「マシンナーズ」 monster (SETCODE.MACHINA, exact for monsters) other than 「マシンナーズ・スナイパー」.

Rulings chosen:
- An activation counts even if it is later negated: the activation happened.
- A face-down monster has no name, so the Sniper does not restrict it.

## Tests
`tools/test_s03_u253_activation_log.js` passes 21/0, on real DUEL paths and Replay-audited.
- A:
  - no attack before the opponent activates;
  - the opponent activates 強欲な瓶 at the attack-declaration point of another monster (`pointActivateV27`), and then スパイダーファング attacks.
- A2: its controller's own 強欲な壺 does not count.
- A3: the record is gone at the next turn.
- B:
  - no Normal Summon, and another effect cannot summon it from the hand;
  - the real 万華鏡 summons it from the Deck (properly summoned);
  - ブラック・ホール, then 死者蘇生 revives it.
- C / C2 / C3:
  - its own controller cannot attack the opponent's マシンナーズ・ソルジャー but can attack ワイト;
  - the opponent cannot attack its ソルジャー but can attack the Sniper;
  - control case without the Sniper.

Negative control on U252: 11 FAIL. C2 passes on the old build as expected: the opponent was already restricted, so only the controller's side is new.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16527 PASS / 0 FAIL** (= U252 16506 + 21 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U252.
- Coverage: TESTED 2769, ENGINE_GAP 569, NOT_STARTED 981, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 730 declared, 0 off-target.
