# S03-U341 — Equip Spells / Traps / Spells ×6

Base: `claude/work` `31dd4c5` (U340, gate 19378 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZC_claude_s03_u341_equips_traps.js`)
- 憎悪の棘 / 竜殺しの剣: `u312Define` equips (S03-U312 pattern) with a forced `onDamageStep` trigger from the Spell & Trap Zone. Both carry `timing:['free']` — without it the engine derived the activation timing from the passive `onDamageStep` and refused the hand activation outside the Damage Step ("このカードは「ダメージステップ中」に発動します"); `forced:true` must stay on the effect, not on the card meta (it would make the card's own activation forced). 憎悪の棘: `continuous.piercingDamage`, `protectV21` (battle) for the host's battle opponent, `modAtk -600/-600 'permanent'` on the attacked monster. 竜殺しの剣: the trigger schedules the destruction at `battlePhaseEnd`.
- 閃光のイリュージョン: the revival-and-link pattern of リビングデッドの呼び声 (`API.linkOnLeave` both ways, `s03CothWatchesU89` to recognise the partner) + a forced `onEndPhase` mill of two.
- 早すぎた復活: revive from the Graveyard, card flags on the monster; the used card lingers for 500 turns (`API.lingerS03`) as the source of `cannotAttack` (that turn) and `battleDamage` (the revived monster's opponent takes none).
- 能力吸収コア: counter trap reading the chain top (a monster of the opponent that has an effect); `negatePreviousChainLinkV2(name, true)`.
- 魔導書整理: Quick-Play Spell; `API.deckTop(3)` → the chooser orders them with successive `selectCard` → `API.orderToDeck(player, uids, false)`.
- Not part of this unit: バオウ (needs a battle-destroyed negator for an equipped monster of any name), ファイティング・スピリッツ (an optional destroy substitute granted by an Equip Spell), 閃光弾 (jump to the End Phase), 賢者の聖杯, the chain-count quick spells (連鎖爆撃 / 積み上げる幸福 / 奇跡の蘇生 / 一陣の風).

## Tests
- `tools/test_s03_u341_equips_traps.js` 34 / 0. Negative control on the previous build: 16 FAIL. Coverage TESTED 3092 → 3098, NOT_STARTED 758 → 752; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring notes: a 地縛神 is destroyed at once without a face-up Field Spell (put one on my field); `API.modAtk` in a test needs a handle (`findCardByUid`), and `modAtk` after `baselineA()` is fine (it is an Action); a Dragon that must survive the battle is given DEF with `modAtk(handle, 0, +1000)`.
