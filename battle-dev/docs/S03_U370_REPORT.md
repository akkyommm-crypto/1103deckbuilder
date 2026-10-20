# S03-U370 — three cards that react to or use a Ritual Summon

Base: `claude/work` `4409689` (U369, gate 20169 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change (uses the Ritual Summon success event of S03-U369).

## Cards (`cards/HZZZZZZZZF_claude_s03_u370_ritual_react.js`)
- 昇華する魂 (Continuous Spell): a trigger on `onSpecialSummon` (declared `onOtherSummon:true`) for a Ritual Summon (`specialSummonKind==='ritual'`) of my monster; the released monsters are my Graveyard monsters for which `usedAsMaterialForSummonV3(material, summoned, 'ritual')` holds (engine/12 provenance); once per turn (card flag); `API.returnToHand`. The ACTIVATE effect is guarded (not already face-up in the zone), as スターゲート.
- 宣告者の預言 (Ritual Spell): `registerRitualSpecV24(…, {levelMode:'exact', level:6})`; the Graveyard clause is a trigger on the Ritual Summon of 神光の宣告者 with a banish-self cost that returns one released monster to the hand (神光の宣告者 can only be Ritual Summoned by this Spell, so the summon needs no further check).
- 神光の宣告者: a quick monster effect (as 緑光の宣告者): the top chain link belongs to the opponent, an Angel of the hand is discarded as the cost, `negatePreviousChainLinkV2(…, true, 'activation')`.
- Not part of this unit: 破滅の儀式 / 救世の儀式 (their second effects), 儀式魔人 monsters (Ritual material from the Graveyard / Deck).

## Tests
- `tools/test_s03_u370_ritual_react.js` 12 / 0. Negative control on the previous build: 7 FAIL. Coverage TESTED 3234 → 3237, NOT_STARTED 616 → 613; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Authoring lesson: the Graveyard trigger of 宣告者の預言 fires by itself after its own Ritual Summon (it is in the Graveyard then), so the test checks the result (one released monster back in hand), not a missing trigger.
