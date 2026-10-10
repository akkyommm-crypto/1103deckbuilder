# Codex handoff — v4.7.0

## Baseline
This folder is a clean v4.7.0 development checkpoint for the 1103 Duel ADS System.

- Full regression: **508 PASS / 0 FAIL**
- Card DB: **4,996**
- Legacy scripts: **299 unique**
- Unified Effects: **57 unique**
- Explicit scripted names: **356**
- Replay format: **v4**
- User build: `dist/battle_acode.html`

Run first:

```bash
python tools/check.py
```

Do not begin new work if the baseline does not pass.

## What v4.7 added
`cards/47_v47_native.js` adds 15 cards:

1. アームズ・エイド
2. エンシェント・フェアリー・ドラゴン
3. C・ドラゴン
4. 発条機甲ゼンマイスター
5. 潜航母艦エアロ・シャーク
6. No.30 破滅のアシッド・ゴーレム
7. No.20 蟻岩土ブリリアント
8. No.34 電算機獣テラ・バイト
9. サンダーエンド・ドラゴン
10. E・HERO Great TORNADO
11. E・HERO ガイア
12. E・HERO ノヴァマスター
13. A・O・J ライト・ゲイザー
14. 神聖騎士パーシアス
15. 魔轟神ヴァルキュルス

Common support added in v4.7:
- `specialSummonedFrom` / `specialSummonKind` provenance.
- cross-player monster-as-Equip target support.
- `API.unequip()` + cleanup.
- `flipUpAttackUids` End Phase reserve action.
- controller-only Acid Golem Special Summon lock.

## Deliberate accuracy decisions
### Ancient Fairy Dragon
The project is strict 1103. The v4.7 implementation intentionally follows the historical pre-errata behavior: after destroying Field Zone cards and recovering 1000 LP, it may add a Field Spell without the later "different name" restriction.

### Number 10: Illumiknight
Not included in v4.7 on purpose. Its hand card is sent during effect resolution and is not an activation target/cost. Current Unified Effect resolution is synchronous; do not fake it by choosing the hand card as a target at activation. Add a correct resolution-time selection primitive first if implementing it.

### Fusion summon triggers
v4.7 records summon provenance, and the HERO effects can identify a Fusion summon when the summon path reports `specialSummonedFrom='ex'` and `specialSummonKind='fusion'`. A fully first-class Fusion Summon processor is still future work.

## Known architectural gaps worth fixing next
1. **Multi-attack accounting** — current battle flow mostly uses boolean `card.attacked`; this blocks clean implementation of ダイガスタ・フェニクス, カチコチドラゴン, Shooting Star Dragon, etc.
2. **Resolution-time non-targeting choices** — needed for No.10 and other effects whose choice is made on resolution.
3. **Generic effect-destruction immunity/replacement** — needed for 始祖の守護者ティラス and similar effects without card-name checks in destruction actions.
4. **Grave-send replacement routing** — Macro Cosmos / Dimensional Fissure class effects should be a common destination replacement layer.
5. **Effect category metadata** — destruction-negation cards should not rely on card-name heuristics. Add declarative categories (e.g. "would destroy field cards") usable by Stardust/Starlight Road-style logic.
6. **First-class Fusion Summon pipeline** — material selection/provenance/summon-negation/timing should reach the same replay-safe quality as Synchro/Xyz.
7. **Generic activation prohibition by card type** — needed for Shock Master / Royal Decree-like broader locks without hand-written activation checks everywhere.

## Files to study before a new rule
- Battle / Damage Step: `engine/30_processor_chain_battle.js`, `engine/00_state_actions.js`
- Legality/API: `engine/40_legal_script_engine.js`
- Unified Effect: `engine/45_unified_effect_v4.js`
- Replay/state: `engine/06_replay_rng_v41.js`, `engine/08_replay_runner_v44.js`
- Recent examples: `cards/45_v45_native.js`, `cards/46_v46_native.js`, `cards/47_v47_native.js`
- Dedicated regression style: `tools/test_v470_native_cards.js`

## Do not do these
- Do not edit `dist/battle.html` or `dist/battle_acode.html` directly.
- Do not paste/copy Project Ignis/EDOPro Lua or ocgcore code.
- Do not mutate gameplay state outside the action/API path just to make a test pass.
- Do not change `carddata.json` for every new script; only metadata corrections belong there.
- Do not silently use modern errata when it changes 1103 behavior.
