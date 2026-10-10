# S03-U174 — contact fusion (the card's own summon procedure from the EX Deck)

## Finding
21 EX monsters in the pool are summoned only by sending / returning / banishing the listed materials from the field
(「上記のカードを(デッキに戻した｜除外した｜墓地へ送った)場合のみ、EXデッキから特殊召喚できる(「融合」は必要としない)」).
In DUEL none of them could be summoned (the EX Deck sheet refused every Fusion Monster with 「融合召喚は融合魔法・カード効果の解決から
行います」), yet E・HERO グラン・ネオス was TESTED with only its bounce effect (no procedure, no End Phase return).

## Mechanism (engine/1ZW_contact_fusion_s03.js)
- `declareContactFusionS03(name, extra)` gives a script `summonProcedure` from `'ex'` built from the card's own text: line 1 = the
  materials (`parseMaterialSpec`), line 2 = the destination (デッキ / 除外 / 墓地) and the fields (自分 / 自分・相手).
- Rules (2011; yugioh-wiki コンタクト融合): a special summon by the card's own procedure — no chain block, the summon negation window,
  「正規の方法」, **not** a Fusion Summon. Face-down monsters may be used (revealed, logged). Fusion-substitute monsters cannot be used
  (the slots accept only the named cards). The materials move as the procedure's cost, before the summon; the player chooses the
  material set when there are several (opponent's / face-down materials marked).
- EX Deck sheet: a contact card shows 「融合（コンタクト融合：デッキに戻す／除外する／墓地へ送る）」 and runs the procedure; otherwise the
  reason (the material line).
- `endPhaseReturnExEffectS03(name)`: the forced End Phase trigger 「エンドフェイズ時、このカードはエクストラデッキに戻る」 (v4 effect entry).
- `cannotFusionMaterialS03` (script flag, 「このカードは融合素材にできない」): read by the fusion spells (engine/1ZL), 超融合 and contact fusion.
- FX_SPECIAL_SUMMON: a Fusion Monster special summoned by its own procedure (summonKind 'procedure', reason = its name) is recorded
  as properly summoned (before: only for 「通常召喚できない」 monsters).
- `parseMaterialSpec`: 「A＋B×2」 is A and two B (剣闘獣ヘラクレイノス was read as 「A＋B」 twice as a whole-line 「×2」).

## Cards
| Card | Before | After |
|---|---|---|
| E・HERO グラン・ネオス | TESTED (bounce only) | TESTED — procedure + forced End Phase return added; the 1-per-turn limit names the bounce effect only |
| E・HERO エアー・ネオス | NOT_STARTED | TESTED — procedure, ATK + LP difference, End Phase return |
| E・HERO フレア・ネオス | NOT_STARTED | TESTED — procedure, ATK +400 per Spell / Trap card on the field (set ones too), End Phase return |
| キメラテック・フォートレス・ドラゴン | IMPLEMENTED | TESTED — procedure from both fields to the GY, base ATK = 1000 × materials, cannot be a fusion material |

The other 17 contact cards (アクア / カオス / グロー / ストーム / ブラック / マグマ / マリン・ネオス, VWXYZ family, 剣闘獣 ×3, 混沌幻魔アーミタイル)
stay as they are: their other effects are not implemented, and giving them only the procedure would make them look complete.

## Tests
`tools/test_s03_u174_contact_fusion.js` 21/0 (real DUEL paths, Replay-audited):
- A: グラン・ネオス — the EX sheet offers it; ネオス + face-down グラン・モール return to the Deck (revealed); the summon negation window
  opened for the procedure, no chain block; properly summoned, not a Fusion Summon; bounce works; End Phase → back to the EX Deck.
- A2: without the Neo-Spacian the row is not legal and names the materials.
- B: エアー・ネオス at 3000 vs 8000 LP → 7500 ATK; End Phase return. C: フレア・ネオス in Defense Position with 3 Spell / Trap cards → 3700.
- D: キメラテック — every legal material set offered (opponent's / face-down marked); the 3-monster set → all to their owners' GYs, 3000 ATK.
- F: a キメラテック on the field is not a Machine material for another one; with another Machine it is legal.
- E: 剣闘獣ヘラクレイノス material spec = ラクエル + two 「剣闘獣」.
Negative control on U173: `contactProcRowS03` is not defined (no procedure).

`tools/test_auto_cycle66.js`: 「グラン・ネオス count: 1ターンに1度」 now checks `countLimit {n:1, effects:['bounce-opponent-monster']}` — the
card-wide `countLimit:1` would also have limited the End Phase return, which the text does not limit. Same number of assertions.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14709 PASS / 0 FAIL** (= U173 14688 + 21 new, exactly), no Traceback / ReferenceError; the
  caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): every existing test file has the same PASS count as U173; only the new test differs (+21).
- Coverage: TESTED 2292, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 142, ENGINE_GAP 601, NOT_STARTED 1234 (4996); audit 253 declared, 0 off-target.
