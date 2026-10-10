# S03-U248 — Trap Monsters (ENGINE_GAP 2, NOT_STARTED 2)

## Workflow
- opus-only: a new engine primitive.
- Found while re-checking ENGINE_GAP reasons: there are 9 trap-monster cards and the engine had no trap-monster support.
- This unit adds the primitive and 4 cards. The remaining cards need more:
  - コピー・ナイト: a copied name and Level;
  - サイバー・シャドー・ガードナー: ATK / DEF 「?」;
  - カース / ソウル・オブ・スタチュー: their interplay;
  - 機械王－B.C.3000: a summon lock that excludes itself.

## Engine
- **engine/1ZZI_trap_monster_s03.js (new): `trapMonsterActivateS03(name, spec)`.**
  - The card activation resolves by special summoning the Trap itself from the Spell & Trap Zone (journaled `FX_SPECIAL_SUMMON`).
  - It carries `asMonsterDbS03`: a JSON copy of the Trap's data with `k:'m'`, Level, ATK / DEF, Race, Attribute and Normal / Effect.
  - The activation is refused without a free Monster Zone or under a special-summon lock. If the card is still in the Spell & Trap Zone at resolution, it goes to the GY.
  - `isTrapCardS03(card)` gives the printed kind, for 「罠カードとしても扱う」.
  - `trapMonsterSummonedS03(card)` covers 「このカードの効果で特殊召喚した」.
- **engine/20 `dbOf`** returns `card.asMonsterDbS03` when present, as it already does a token's data. So stats, Race, Attribute, Level, battle, material checks and Replay see a monster.
- **engine/00:**
  - `asMonsterDbS03` / `trapMonsterS03` are zone-local, so a Trap Monster that leaves the field is a Trap card again.
  - `FX_SPECIAL_SUMMON` stores the data when summoning from the Spell & Trap Zone.
  - `reset()` records `leftAsTrapMonsterS03 {turn, self}`, so 「このカードの効果で特殊召喚したこのカードが…破壊された場合」 can be read in the GY.
- Documented limit: while it is a monster, scripts that read `dbOf(card).k` see 'm'. 「罠カードとしても扱う」 holds only for scripts that ask `isTrapCardS03`, like the placed 宝玉獣 of S03-U240.

## Cards → TESTED (2011 texts) — cards/HZZZZB_claude_s03_u248_trap_monsters.js

| Card | Was | Monster | Notes |
|---|---|---|---|
| アポピスの化神 | ENGINE_GAP (override removed) | Normal, Reptile / EARTH / 4 / 1600 / 1800 | activated only in a Main Phase |
| メタル・リフレクト・スライム | NOT_STARTED | Effect, Aqua / WATER / 10 / 0 / 3000, Defense | cannot attack |
| 死霊ゾーマ | NOT_STARTED | Effect, Zombie / DARK / 4 / 1800 / 500, Defense | destroyed by battle → the destroyer's ATK as damage |
| 機動砦 ストロング・ホールド | ENGINE_GAP (override removed) | Effect, Machine / EARTH / 4 / 0 / 2000, Defense | +3000 ATK with the three Gadgets |

## Existing tests adjusted (status records; no behavior assertion changed)
- `tools/test_v680_batch20.js` (アポピスの化神) and `test_v830_batch34.js` (ストロング・ホールド) listed them as precise ENGINE_GAP.
- Each moves to a 「Trap Monster unlocked」 check. The counts (48 / 42) are unchanged.

## Tests
`tools/test_s03_u248_trap_monsters.js` passes 16/0, on real DUEL paths and Replay-audited.
- アポピス:
  - its stats, Race, Attribute and Level as a monster, while still a Trap card;
  - destroyed → a Trap card in the GY;
  - refused in the Battle Phase and with no free Monster Zone.
- スライム: Defense 3000, Level 10, cannot attack.
- ゾーマ: destroyed by 青眼 → 3000; destroyed by ブラック・ホール → none.
- ストロング・ホールド: 3000 with the three Gadgets, 0 with one.

Other checks:
- Negative control on U247: 13 FAIL.
- `dbOf` and `reset()` are central, so this unit's pre-scan runs the full suite against the previous unit before the gate.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16375 PASS / 0 FAIL** (= U247 16359 + 16 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U247.
- Coverage: TESTED 2748, ENGINE_GAP 575, NOT_STARTED 997, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 708 declared, 0 off-target.
