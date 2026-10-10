# S03-U139 — 天刑王 ブラック・ハイランダー (Synchro Summon lock + equip breaking)

## Why
天刑王 ブラック・ハイランダー (fixed Dark list x1) was NOT_STARTED. Its lock, 「お互いにシンクロ召喚をする事ができない」, matters in
real duels: it stops every Synchro deck while it is face-up.

## Change
- New `engine/1ZN_synchro_lock_s03.js`:
  - `declareSynchroSummonLockS03(name)` and `synchroSummonLockReasonS03(p)`. The lock applies while a declared card is
    face-up on either field and its effects are not negated.
  - The lock is on the Synchro Summon itself, so other Special Summons of Synchro Monsters (死者蘇生 …) stay legal.
  - Checked where a Synchro Summon starts:
    - the Extra Deck sheet row (`engine/20_effect_primitives_ex.js`);
    - `beginExSummonV2` (`cards/40_auto_interpreter.js`, with a message);
    - the effect-Synchro options (`engine/1ZJ_effect_synchro_s03.js`).
- New `cards/HW_claude_s03_u139_highlander.js`:
  - declares the lock;
  - a v4 ignition, once per turn, with explicit timing `mainPhase`. It targets 1 face-up opponent monster that has an Equip
    Card, destroys every Equip Card on it at resolution, and inflicts 400 × the number actually destroyed.
- Both files are added to `build_manifest.json`.

## Test — `tools/test_s03_u139_black_highlander.js` 13/0 (real DUEL path, Replay-audited)
- A:
  - The opponent's face-up Highlander blocks player 0's Synchro Summon of TG ハイパー・ライブラリアン (with a message), and
    the effect-Synchro options are empty.
  - A face-down Highlander does not lock, and the Synchro Summon succeeds.
  - 死者蘇生 on スターダスト・ドラゴン still works under the lock.
- B:
  - 2 Equip Cards equipped through `FX_EQUIP` to the opponent's ゴブリン突撃部隊 are both destroyed, dealing 800 damage.
  - The effect is then illegal (once per turn), and it is illegal with no equipped opponent monster.
- Negative control on U138: 3 FAIL. The card had no script; the "illegal" checks pass trivially there.
- Pre-scan of all 358 gate tests (parallel): 0 FAIL.

## Status
- 天刑王 ブラック・ハイランダー NOT_STARTED → TESTED (focus registered). TESTED 2215 → 2216, NOT_STARTED 1264 → 1263.
