# S03-U40 C-S03-31 ATTACK_DECLARATION_RESPONSE_WINDOW (Claude)

Base: `checkpoint_claude_s03_u39_attack_state_journal_20260913.zip`, SHA256 `76aa2467c6e27af2c0971e725e7ed25b7ebb4b0262f8f5f6c3dac727ee31dfca`.

## How it was found (R1 responder mode)

- In R1 responder mode (the provisional Dragunity / レダメ list vs 1103兎ラギア, DUEL, normal path), seed `0x52310007` offered the **attacking** player its own 聖なるバリア －ミラーフォース－ at its own attack. The card text reads 「相手モンスターの攻撃宣言時」, so this is illegal.
- The measurement (`logs/S03_MEASURE_ATTACK_DECLARATION_WINDOW_20260913.md`) placed each of 37 attack-declaration cards on a fixed board:
  - the attacker was offered ミラーフォース / 次元幽閉 (and 速攻のかかし had the same condition shape);
  - only 6 of 37 were offered to the defender (攻撃の無力化, ドレインシールド, … never).

## Measurement before the fix

- `tools/test_s03_u40_attack_declaration_window.js` on the U39 tree: **12 PASS / 6 FAIL**.

## Requirement closure record

- **Requirement.** At the attack-declaration window the defender can activate cards whose text allows 「（相手）モンスターの攻撃宣言時」, and the attacking player cannot use a 「相手モンスターの攻撃宣言時」 card against its own attack.
- **Root causes (INTEGRATION_MISSING).**
  1. `getChainResponsesV2` / `prepareDuelActivation` checked legality without the attack-declaration event. `v4EffectEventOk` defaults the event to `'activate'`, so v4 cards with `events:['onAttackDeclare']` never matched. Legacy conditions for ミラーフォース / 次元幽閉 / 速攻のかかし did not check who attacks.
  2. `processPointV27` counts responses while the POINT is `processorCurrent`. With no response it passes without pausing. A window check that only looked at `processorWaiting` therefore never applied, and the window closed on its own.
- **Closure.**
  - **New `engine/1Y_attack_declare_window_s03.js`** (manifest after 1X):
    - `attackDeclareWindowS03()`: `pendingAttack` exists and the attack-declaration POINT is the waiting or current unit;
    - `attackDeclareResponseOptsS03(name, opts)`: `eventName:'onAttackDeclare'` + `event {player, atkIdx, attackerUid, targetUid, target, name}`.
  - **`engine/30_processor_chain_battle.js`:** `getChainResponsesV2` and `prepareDuelActivation` recheck a refused response with those opts; when legal the activation runs with that event. Responses already legal are unchanged. No new gameState key, no new Action.
  - **`cards/00_generic_core.js`:** 聖なるバリア －ミラーフォース－, 次元幽閉, 速攻のかかし require an opponent's attack in progress (`pendingAttack.player === ctx.opponent`).
  - **`data/s03_status_changes.json`:** ミラーフォース, 次元幽閉 IMPLEMENTED → TESTED (text-based: 「相手モンスターの攻撃宣言時」; driven on the DUEL path with Replay).
- **Test** (`tools/test_s03_u40_attack_declaration_window.js`, after U39 in `tools/check.py`):
  - A: 攻撃の無力化 offered to the defender; the attack is negated; Replay ok;
  - B: ドレインシールド offered; the attack is negated and the defender gains LP; Replay ok;
  - C / D: ミラーフォース / 次元幽閉 are not offered to the attacker at its own attack (a defender control card keeps the window paused), are offered to the defender and resolve; Replay ok;
  - E: control, 強制脱出装置 at the attack declaration unchanged; Replay ok;
  - F: ミラーフォース is refused with no attack declared.
  - **After: 18 PASS / 0 FAIL.**

## 37-card probe after the fix

- Defender offered: **6 → 15**. The attacker is offered only cards whose text allows either player's attack (No.39 希望皇ホープ, 虚栄巨影) or a legal card activation (モンスターBOX).
- **Remaining 22, classified:**
  - *Correct or board-dependent:*
    - own-attack effects: 墓守の暗殺者, デーモン・カオス・キング, ランサー・デーモン, ヴァイロン・ソルジャー;
    - direct attack only: バトルフェーダー (offered on a direct attack);
    - hand needed: ヒーロー見参, デプス・アミュレット (offered when the hand is not empty);
    - card conditions unmet on the probe board: スーパーチャージ, コアキメイルの障壁, 細胞爆破ウイルス, 生贄の抱く爆弾, 邪悪なるバリア －ダーク・フォース－, 閃光のバリア －シャイニング・フォース－, ナチュル・バタフライ;
    - trigger, not a POINT response: インターセプト・デーモン.
  - *Real gaps → next unit C-S03-32 ATTACK_DECLARATION_INFO (INTEGRATION_MISSING):*
    - 魔法の筒 reads `gameState.battle` (not set until the damage step);
    - ディメンション・ウォール, 地縛霊の誘い, 立ちはだかる強敵 use `API.battleContext()` (`gameState.battle`);
    - BF－バックフラッシュ, フォーチュン・スリップ read `pendingAttack.target`, absent from the shape (unchanged since U38, so not a U39 regression);
    - 速攻のかかし has no `quickEffect` and is never offered from the hand.

## Regressions

- `tools/test_s03_u39_attack_state_journal.js` and `tools/test_s03_r1_duel_completion.js` (4 real duels, 2 responder) green on the same build.
- s03 status audit: 24 declared changes observed, 0 off-target.

## Gate

- `python tools/check.py` — EXIT 0, **12546 PASS / 0 FAIL** (log `s03_u40_full_gate.log`).
- `python tools/build_acode.py data/carddata.json` — EXIT 0.
- Coverage: TESTED 2073 / ENGINE_GAP 614 / NOT_STARTED 1303 / IMPLEMENTED 183 / PARTIAL 179 / GENERIC_OK 644 (TOTAL 4996).

## Source hash

- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `eaeecc6645ea2cc3b4e67258c9d8becea60580725467adb6f1ce18139a414a36` (694 files).

## Not changed / deferred

- MANUAL `doAttack` direct `attackNegated`; load-time `pendingAttack` clear (C-S03-30 ②).
- Early Deck picks, legacy choices in `resolve`, MANUAL-recovery ②, DESTROY_SUBSTITUTION (Astra consult).
