# S03-U281 — ENGINE_GAP re-check 6: エヴォルダー・ディプロドクス, 反撃の毒牙, 古代の機械爆弾, 黒蠍団召集, 連鎖旋風, シャーク・ザ・クルー (6 cards)

## Workflow (mixed, v3 batch3)
- A Sonnet subagent (`claude-sonnet-5-5`, effort not set: delegated from a session outside the tree) owned the unit from the brief: cards, tests, status records, declarations, audit, pre-scan and gate. The parent publishes.
- No engine change. Existing mechanisms only: P4 groups (`GROUP.EVOLTILE` / `VENOM` / `ANCIENT_GEAR` / `BLACK_SCORPION`, `groupMemberNowS03`), `summonSrcS03` (S03-U238), the attack-declaration event group + `API.negateAttack` + `endBattlePhaseByEffectS03` (S03-U152), `API.addCounter`, the P1.1 multi-target activation (`activationV11`), the effect-destruction event (`onDestroy`) and `API.movedByOpponentEffect` (move provenance), `declareDeckTriggerS03` (S03-U156) and `specialSummonPositionsS03` (S03-U278).
- One structural point (for review): the three 「エヴォルド」 summoners (オドケリス / ウェストロ / ゲフィロス) call `API.specialSummon` with their own name as the reason but never passed `summonSrcS03`, so the record that ディプロドクス reads did not exist. Their scripts are in other files, so the new card file wraps `API.specialSummon` once: when the reason is the name of a `GROUP.EVOLTILE` monster and the caller gave no source, `opts.summonSrcS03` is added (it travels in the journaled FX_SPECIAL_SUMMON action; Replay audited). If the parent prefers the three scripts to pass the option themselves, the wrapper can be dropped.

## Cards → TESTED (2011 texts) — cards/HZZZZZI_claude_s03_u281_gap6.js
- **エヴォルダー・ディプロドクス:** forced trigger of its own Special Summon success when `card.summonSrcS03` is a 「エヴォルド」 monster this turn; target 1 Spell/Trap of the opponent (S/T Zones or Field Zone, face-up or Set) at activation → destroy; with no target it does not activate.
- **反撃の毒牙:** Trap, offered when the opponent's attack targets the activator's face-up 「ヴェノム」; negates the attack, ends the Battle Phase, then 1 Venom Counter on the attacker if it is still on the field.
- **古代の機械爆弾:** target 1 own face-up 「アンティーク・ギア」 at activation; destroy it and, only if it left the field, half its original ATK (rounded down) as effect damage.
- **黒蠍団召集:** needs a face-up 首領・ザルーグ; at resolution the player chooses which 「黒蠍」 monsters of the hand (0 or more, one per name, within the free zones) to Special Summon together; positions are asked.
- **連鎖旋風:** Trap on the `onDestroy` event of an effect destruction (not battle); 2 Spell/Trap targets of either field (never itself) chosen at activation → destroyed.
- **シャーク・ザ・クルー:** optional deck trigger when it left the field face-up destroyed by an opponent's card effect (move provenance); 1-2 WATER Lv ≤ 4 monsters from the Deck, within the free zones, positions asked.

## Rulings / judgement points
- 黒蠍団召集: 「できる」 → the player may summon none, some or all (Opus ruling in the brief).
- 反撃の毒牙: if the declared attack is no longer pending or its attacker left the field at resolution, nothing is done (the later parts depend on the attack being negated).
- 古代の機械爆弾: "destroyed" is read from the card having left the Monster Zone after `API.destroy` (a destruction substitute that keeps it on the field gives no damage).

## Existing tests adjusted (status records; no behavior assertion changed)
Each moved name is now an "unlocked" check (`!ov[n]`) with `/* S03-U281: implemented and tested; kept as a record */`; every count is unchanged:
- `test_v640_batch16` (エヴォルダー・ディプロドクス, 連鎖旋風), `test_v690_batch21` (反撃の毒牙), `test_v670_batch19` (古代の機械爆弾), `test_v680_batch20` (黒蠍団召集), `test_v650_batch17` (シャーク・ザ・クルー).

## Tests
`tools/test_s03_u281_gap6.js` passes 65/0, on real DUEL paths (Normal Summon, Flip, attack declaration, chain windows, resolution-time choices) and Replay-audited.
- Every card has at least one negative (wrong summon source / no target; non-Venom, direct and face-down attack targets; non-Gear, face-down and opponent's Gear, target bounced; Zarg face-down / opponent's / no scorpion in hand; battle destruction, too few Spell/Traps; battle, own-effect and face-down destruction of the Shark).

Negative control on U280: 39 FAIL.

## Opus review
- The 6 cards are accepted as TESTED, each with its basis above.
- The Sonnet part wrapped `API.specialSummon` from the card file to give the 「エヴォルド」 summons a source. That is replaced by an engine default:
  - When a caller gives no `summonSrcS03`, `API.specialSummon` (engine/40) records the card whose chain link is resolving.
  - It is journaled in `FX_SPECIAL_SUMMON`.
  - The wrapper is removed.
- Pre-scan + gate re-run by the parent after the change.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **17556 PASS / 0 FAIL** (= U280 17491 + 65 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U280.
- Coverage: TESTED 2888, ENGINE_GAP 503, NOT_STARTED 928, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 850 declared, 0 off-target.
- Published in the batched checkpoint S03-U280–U283.
