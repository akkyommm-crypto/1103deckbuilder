# S03-U323 — 「サイバー・ダーク」: エッジ, キール, ホーン (+ engine: host-declared equip substitute, mulFinalAtk)

Base: `claude/work` `680cbd9` (U322, gate 18861 PASS / 0 FAIL). Sonnet 5.5, single writer. All three NOT_STARTED.

## Engine changes
- `engine/1ZZB_equip_substitute_arms_s03.js` `equipSubstituteDestroyS03`: besides an Equip card that declares `equipSubstituteS03` itself, the HOST may declare `equipHostSubstituteS03: true | 'battle'`: the monster-equip it equipped itself (`equipTo.sourceUid` = the host, set by `API.equipFromGrave`) is destroyed instead of the host; face-up, not-negated host; battle only when 'battle'.
- `engine/00_state_actions.js` `collectContinuous` / `curStat`: a continuous modifier may return `mulFinalAtk` / `mulFinalDef` (a factor applied with floor to the value so far, in the final layer). Used for 「ダメージ計算時のみ攻撃力は半分」 (the `setAtk` of ガイア・プレート works from the printed value only).

## Cards (`cards/HZZZZZZK_claude_s03_u323_cyberdark.js`)
- All: forced Normal-Summon trigger that equips a Lv3- Dragon from the Graveyard (target, `API.equipFromGrave`), ATK + its printed ATK, ④ via `equipHostSubstituteS03:'battle'`.
- エッジ: `canDirectAttack`; ATK halved (mulFinalAtk 0.5) only at the calculation step of its own direct attack. キール: forced 300 damage after a battle kill. ホーン: piercing damage.

## Tests
- `tools/test_s03_u323_cyberdark.js` 24 / 0 (equip, ATK, battle substitute and its negatives, direct attack halving before / during / after, 300 damage, piercing; Replay audits). Negative control on the previous build: 14 FAIL. Coverage TESTED 3006 → 3009, NOT_STARTED 841 → 838; audit 0 off-target. Union / gladiator-arms tests unchanged.
- Authoring note: create fixture cards AFTER `fresh()` (resetA restarts the uid counter; a card made earlier can share a uid with a later one and `idx()` then finds the wrong card).
