# S03-U299 — Hand-activated trigger audit of the 13 major decks

## Workflow
- Sonnet battle-implementer, user priority of 2026-10-09 (duel completion). Tree s03_u296, the single current tree, after S03-U298.

## Audit (cards of data/r1_lists/major_decks_v1_*.txt that activate from the hand in response to an event; real-flow probes)
| card | offered | result |
|---|---|---|
| TG ワーウルフ ① | no (neither SEGOC nor POINT; only a later main-phase activation) | fixed: optional trigger |
| オネスト | no (not a Quick Effect for the response windows; condition accepted any LIGHT monster) | fixed |
| ドッペル・ウォリアー ① | yes (SEGOC, onSpecialSummon) | - |
| 冥府の使者ゴーズ | yes (SEGOC, onBattleDamage; effect damage covered by test_s03_u50) | - |
| トラゴエディア ① | yes (SEGOC batch after the damage) | - |
| バトルフェーダー | yes (POINT attackDeclare) | - |
| BF－月影のカルート | yes (POINT damageStep) | - |
| エフェクト・ヴェーラー | yes (chain response) | - |
| 朱光の宣告者 | yes (chain response; test_s03_u91 real flow) | - |
| 暗黒界の龍神 グラファ / 術師 スノウ / 尖兵 ベージ / 狩人 ブラウ | yes (SEGOC onDiscard; each effect resolves) | - |
Special Summon procedures from the hand (クリスティア, ブラスト, ゲイル, 師範, キザン, ご隠居, サイバー・ドラゴン, TG ストライカー, ヒュペリオン, ダークネスメタル, レヴァテイン) are rules, not trigger effects.

## Causes fixed
1. TG ワーウルフ's hand effect was a non-trigger (judged from the turn history, no event passive for the hand). Opus ruling: optional trigger at the Special Summon of a Level 4 or lower monster only. `cards/10_themes_a.js`: the condition uses `tgLv4SummonEventS03U297(ctx)` (the Special Summoned card of the event) and `passive.onSpecialSummon` for the hand. Test `test_s03_u299_tg_werewolf_hand_trigger` (A: API summon, B: the opponent's real ワン・フォー・ワン, C: Level 8 / Rank 4 Xyz / full Monster Zone not offered, D: declined, not legal later, E: no summon). Negative control on the old code: 7 FAIL.
2. オネスト lacked `quickEffect:true`, so no Damage Step window of a real duel offered it, and its condition accepted any LIGHT monster in any battle. `cards/00_generic_core.js`: quickEffect, needs a LIGHT monster of the activator in the battle (`honestBattlersS299`), and only the battling pair is targeted. Test `test_s03_u299_honest_damage_step` (A: offered in the Damage Step, resolves, ATK + opposing ATK; B: not offered without a LIGHT battler; C: only in Damage Step windows). Negative control (quickEffect removed): 4 FAIL.

## Existing tests changed (Opus ruling, check counts unchanged)
- `test_s03_u87_tg_warwolf_striker.js` assertion A: checks the SEGOC offer instead of the later activation (16 PASS before and after).
- `test_s03_u297_tg_werewolf_speed.js` B (not in the ruling; same cause: it activated the hand effect later with the legality check): now takes the offer from the SEGOC selection of the Special Summon, same intent (the link is Spell Speed 1, it resolves). Count unchanged.

## Sweep
- All 78 pairs, `R1_POLICY=random`, long harness (900 s), new seed set: 78 / 78 clean (Replay matched). Save / resume every 3 stops (`R1_SAVELOAD_EVERY=3`), another new seed set: 78 / 78 clean (8,088 round trips, Replay matched).

## Open
- None.

## Gate
`python tools/check.py`: GATE_EXIT=0, 18165 PASS / 0 FAIL (U298 gate 18144 + 21 new). Pre-scan DIFF: only the two new tests (honest 7, werewolf 14); test_s03_u87 (16) and test_s03_u297_tg_werewolf_speed counts unchanged. Source hash (build.py, without L): 32dbf2b12d5d91ded35aa0120103c1dc2ac39ac673331cdc3ff22088c80e271a. Gate log: scratchpad L299_gate.txt.
