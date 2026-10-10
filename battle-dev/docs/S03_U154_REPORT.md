# S03-U154 — 光の護封剣 / リミッター解除 (reminders) and 名推理 / マインドクラッシュ (browser prompt) carried out

## Why
A scan of every script in effect for things the player had to do by hand, as a follow-up to U153's `API.registerPendingEffect`:

| Card | Status | Before |
|---|---|---|
| 光の護封剣 | TESTED | 「相手ターンで数えて3ターン後の相手エンドフェイズに破壊される」 was a kind-less `RESERVE_ADD`, i.e. a reminder. The card stayed forever. |
| リミッター解除 | IMPLEMENTED | 「このターンのエンドフェイズに破壊される」 was a kind-less reminder. |
| 名推理 | IMPLEMENTED | The opponent's level came from a browser `prompt()`. It is not journaled, so Replay could not reproduce it. 「通常召喚可能なモンスター」 also counted Ritual and 「通常召喚できない」 monsters. |
| マインドクラッシュ | IMPLEMENTED | The card name came from a browser `prompt()` at resolution, and the controller chose its discard although the text says 「ランダムに1枚選んで捨てる」. |

Kind-less reserves are shown to the player as reminders; only reserves with a `kind` (`destroyUids` …) are carried out by
`resolveReservedEffectsV30`.

## Change (in place in `cards/00_generic_core.js`; one definition per name)
- 光の護封剣:
  - the resolution marks the card (`u154SwordsTurn`, zone-local);
  - it schedules `s03u154.swords-destroy` for the End Phase of turn T+5 (`API.schedule`, `turns:5` when activated in its
    controller's turn T, i.e. the opponent's 3rd turn);
  - the handler destroys it only if it is still on the field with the same mark.
- リミッター解除: each doubled Machine is marked (`u154LimiterTurn`, zone-local) and the automated `destroyUids` reserve destroys it in
  the End Phase.
- 名推理: a journaled choice for the **opponent** (levels 1–12) with the resume handler `s03u154.meisuiri`. 「通常召喚可能」 excludes
  Extra Deck, Ritual and 「このカードは通常召喚できない」 monsters.
- マインドクラッシュ:
  - the name is declared at activation (`activationV11` + `API.declare(ctx,'cardName',…)`, the 異次元の指名者 pattern);
  - resolution discards every copy in the opponent's hand, or else one random card from the controller's hand (`duelRandomInt`).
- `engine/00_state_actions.js` `ZONE_LOCAL_KEYS`: `u154SwordsTurn`, `u154LimiterTurn`.

## Test — `tools/test_s03_u154_reminders_prompts.js` 17/0 (real DUEL path: activations, choices, phases and turns; Replay-audited)
- A 光の護封剣:
  - it stays on the field and the face-down monster is turned face-up;
  - in the opponent's turn its monster cannot attack;
  - still there at turn 9, after the opponent's 1st and 2nd End Phases;
  - destroyed at the opponent's 3rd End Phase (turn 10).
- B リミッター解除: サイバー・ドラゴン 4200 while ワイト stays 300; in the End Phase サイバー・ドラゴン is destroyed and ワイト stays.
- C 名推理:
  - the choice is asked of player II;
  - declared 4 = Lv4 → both revealed cards to the GY;
  - declared 1 → the monster is Special Summoned and サイクロン goes to the GY.
- D マインドクラッシュ:
  - ワイト declared → the opponent discards both ワイト;
  - not in their hand → one random card of the controller is discarded, without a choice.
- Negative control on U153 (`dist/battle.html` + this test): 6 FAIL, 0 errors. C's first case passes on U153 only because the
  harness's `prompt()` stub returns the default "4".
- The existing tests of these cards keep their counts (test_s03_u07, v450_native_cards, negation_v13, u93).

## Status
- IMPLEMENTED → TESTED: リミッター解除, 名推理, マインドクラッシュ. 光の護封剣 stays TESTED, now for its full text.
- TESTED 2233 → 2236, IMPLEMENTED 91 → 88.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14354 PASS lines (= U153 14337 + 17 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 373 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U153 except the new test.
- `dist/battle.html` SHA256 `a89f27f3cb2c026330b46b6d4d84f481981e5f4d41869cefa5f244693f0a188e` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `4c5b121e4c4821371ff11aa8531dc8cb0d5a4413f6a91235762200d68f86a658`.
- Coverage: TESTED 2236, IMPLEMENTED 88, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 203 declared status
  changes, 0 off-target.
