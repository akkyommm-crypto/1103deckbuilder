# S03-U363 — four Fusion Material substitute monsters

Base: `claude/work` `86553ee` (U362, gate 20034 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZY_claude_s03_u363_fusion_subs.js`)
- イリュージョン・シープ / 心眼の女神 / 沼地の魔獣王 / 破壊神 ヴァサーゴ: 「このカードを融合素材モンスター1体の代わりにする事ができる。その際、他の融合素材モンスターは正規のものでなければならない」. The rule is already read from the card text by the fusion engine (S03-U134: `fusionSubstituteCardS03` / `fusionCombosS03`, every 融合-type Spell); the cards only need a registration — four literal `defineScript` calls of a permanent-effect monster (the coverage tool finds registrations by the literal card name; a loop over a name array is not seen).
- Not part of this unit: 融合呪印生物－光 / 地 / 闇 (their second effect — releasing a whole material set and Special Summoning a Fusion Monster of that attribute from the Extra Deck — is a separate fusion-style procedure).

## Tests
- `tools/test_s03_u363_fusion_subs.js` 20 / 0 (four substitutes x: offered and summoned with Replay audit; refused with a non-material; refused with two substitutes). Negative control: the engine rule already existed, so the previous build also gives 0 FAIL — what changes is the registration (coverage TESTED 3208 → 3212, NOT_STARTED 642 → 638; `registration_names_missing_from_db` empty; audit 0 FAIL).
