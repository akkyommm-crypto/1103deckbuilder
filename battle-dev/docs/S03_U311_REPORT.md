# S03-U311 — revival Equip Spells: 継承の印, 戦線復活の代償, 自律行動ユニット, 契約の履行, 再融合, D・リペアユニット

Base: `claude/work` `b378ce7` (U310, gate 18403 PASS / 0 FAIL). Sonnet 5.5, single writer. Requirement: Equip Spells that Special Summon a monster and equip themselves to it, with a link between the two ("離れた時／破壊された時 → 装備モンスターを破壊／除外"). The pattern existed (早すぎた埋葬, `API.specialSummon` + `API.equipSpell` + `API.linkOnLeave`); all six were NOT_STARTED.

## Change (`cards/HZZZZZX_claude_s03_u311_revive_equips.js`, helper `u311Define`)
- Cost first, then the target: 戦線復活の代償 sends a face-up Normal Monster of mine from the field (it may be the target itself); D・リペアユニット sends a 「D」 monster from the hand (idem); 自律行動ユニット / 契約の履行 / 再融合 pay LP (project convention: more LP than the cost).
- 継承の印: 3 same-name monsters in my GY; 戦線復活の代償: a monster in either GY; 自律行動ユニット: the opponent's GY, into my field in Attack Position (stated in the text); 契約の履行 / 再融合: a Ritual / Fusion Monster of my GY, only one that was properly summoned (engine/1ZK, existing rule).
- A Special Summon position the text does not give is chosen by the player after the effect (engine/1ZZK, existing); the equip is attached at once.
- Links: 継承の印 `destroyIfDestroyed`; 戦線復活の代償 / 自律行動ユニット / D・リペアユニット `destroy` (any departure); 契約の履行 / 再融合 `banishIfDestroyed` (new, engine/18: the Equip Spell was destroyed → the monster is banished; any other departure just ends the link). D・リペアユニット: continuous `cannotChangePosition` for the equipped monster. 「D」 = names starting with D・ / D－.

## Tests
- `tools/test_s03_u311_revive_equips.js` 33 / 0 (activation, cost, target, equip, destruction of the Equip Spell with サイクロン, refusals — 2 of a kind, no Normal Monster, LP, never properly summoned, no 「D」 — and Replay audits); negative control on the previous build: 23 FAIL. Coverage TESTED 2942 → 2948, NOT_STARTED 905 → 899; audit 0 off-target.
- Test note: a card added to a hand after `baselineA()` is not in the Replay, so the test puts the サイクロン in the hand before the baseline (a direct state edit after the baseline made the audit diverge — a test-fixture problem, not an engine one).
