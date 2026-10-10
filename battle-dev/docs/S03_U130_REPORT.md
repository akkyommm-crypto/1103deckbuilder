# S03-U130 — 融合 (Polymerization) + ダーク・フュージョン on a Fusion-Spell procedure; target immunity in DUEL activation

## Why
- 融合 was NOT_STARTED. In DUEL mode the Extra Deck sheet refuses a direct Fusion Summon (「融合召喚は融合魔法・カード効果の解決から
  行います」), so no Fusion Monster could be Fusion Summoned with 融合 at all. That blocks every Fusion deck. ダーク・フュージョン
  (NOT_STARTED) is the only legal way to summon the E－HERO Fusion Monsters (「「ダーク・フュージョン」の効果でのみ特殊召喚できる」).
- Found while testing ダーク・フュージョン's protection: in DUEL activation, legacy `targets:true` scripts that pick with
  `API.selectCard` (月の書 and many more) ignored target immunity entirely. `selectCard` decided "targeting" from
  `ACTIVE_SCRIPT`, which is only set on the MANUAL `runScript` path and is null while `prepareDuelActivation` runs. So the
  opponent's 月の書 could choose オベリスクの巨神兵 (「このカードは効果の対象にならない」), and continuous `immuneToTarget`
  protections were bypassed too.

## Change
- New `engine/1ZL_fusion_spell_s03.js`:
  - `fusionSpellOptionsS03(p, spell, {race})`: Fusion Monsters in the Extra Deck that can be summoned with materials from
    the hand / own field (face-up or face-down monsters). Parsed with `parseMaterialSpec` / `findMaterialCombos`, keeping only
    combinations that leave a zone free.
  - Monsters are excluded when their own text names other cards as the only summoning effects (U127
    `properSummonSourcesS03`), when a 「〜召喚でしか」 condition of another kind applies (U126), or when a Special Summon lock
    is on (v46).
  - At resolution the player chooses the Fusion Monster, then the materials (only when several combinations exist), then
    face-up ATK / DEF. Handlers: `s03u130.fusion-ex` / `-mats` / `-pos`.
  - `fusionSpellCommitS03` re-validates, sends the materials to the GY (hand: FX_HAND_SEND_GRAVE, field: sendToGrave), marks
    them `fusionMaterialS03` (zone-local; for 融合回収 / 物資調達員 later), and Special Summons with `summonKind:'fusion'` (so
    the monster is properly summoned, U127). ダーク・フュージョン also sets `oppTargetImmuneTurnS03` = this turn.
- `cards/HS_claude_s03_u130_fusion.js`: 融合 and ダーク・フュージョン (悪魔族 only). Neither targets; both declare
  `includesSpecialSummon` / `blocksIfNoSpecialSummon`.
- `engine/00_state_actions.js`:
  - `filterTargetable(cands, byPlayer)` also drops cards with `oppTargetImmuneTurnS03` that the other player targets this
    turn.
  - The two new flags are in `ZONE_LOCAL_KEYS`.
- `engine/09_choice_request_v49.js` passes the targeting player: `spec.targetingPlayer`, else `spec.player`.
- `engine/40_legal_script_engine.js` `API.selectCard`: "targeting" is also true when the card whose activation is being
  prepared (`ACTIVATION_PREP_S03`) has `targets:true`. The targeting player is the one preparing that activation, else the
  current effect controller.

## Test — `tools/test_s03_u130_polymerization.js` 24/0 (real DUEL path, Replay-audited)
- A: 融合 with フェザーマン + バーストレディ in the hand.
  - Only フレイム・ウィングマン is offered; インフェルノ・ウィング needs ダーク・フュージョン.
  - It is Fusion Summoned in DEF (summonKind fusion, properly summoned), and the materials go to the GY marked as Fusion
    Materials.
- B: face-down field クレイマン + field / hand バーストレディ.
  - Both Fusion Monsters are offered, and ランパートガンナー has 2 combinations, so there is a material choice.
  - The chosen field materials go to the GY, and the hand one stays.
  - Illegal with 5 monsters on the field and the materials in the hand, under a Special Summon lock, or with materials
    missing.
- C: ダーク・フュージョン.
  - Only the 悪魔族 インフェルノ・ウィング is offered, and it is Fusion Summoned.
  - The opponent's set 月の書 cannot choose it this turn, while its controller still can. The protection is gone next turn.
- D: the opponent's set 月の書 cannot choose オベリスクの巨神兵 (printed immunity), so it hits the other monster.
- Negative control on U129: A–D fail (14 FAIL).
- Pre-scan of all 349 gate tests on the U130 build (parallel): 0 FAIL.

## Not in this unit (recorded)
- Fusion Material substitutes (「融合素材モンスター1体の代わりにできる」) are not recognised.
- Fusion Monsters whose material line cannot be parsed (`permissive` spec) are not offered.
- Tokens are not used as materials.
- ミラクル・フュージョン / 超融合 still summon in ATK (no position choice).
- The 「…でのみ特殊召喚できる」 wording (48 cards) is not enforced for other effects (U127 follow-up).

## Status
- 融合 NOT_STARTED → TESTED, ダーク・フュージョン NOT_STARTED → TESTED (focus registered).
- TESTED 2195 → 2197, NOT_STARTED 1271 → 1269.
