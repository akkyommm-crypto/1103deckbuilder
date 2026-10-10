# S03-U165 — デュアル・ソルジャー / 幻獣サンダーペガス / E・HERO テンペスター

## Why
Three more monsters whose battle protection is conditional. Until S03-U158 the text fallback made them always battle-indestructible.
- **デュアル・ソルジャー** was a coarse AUTO-table entry: an ignition recruit from the field at will, with no Gemini gating.
- **幻獣サンダーペガス** and **E・HERO テンペスター** had no script.

## Cards (`cards/HZL_claude_s03_u165_protections3.js`)
- **デュアル・ソルジャー** (defineGeminiS03):
  - `protectV21` once per turn, only while Gemini-Summoned. `defineGeminiS03` does not wrap object declarations, so the predicate checks `geminiActiveS03`.
  - An optional trigger after damage calculation (dsTiming 'after') of a battle it took part in. It Special Summons a Lv4-or-lower Gemini from the Deck, not デュアル・ソルジャー. The Deck is examined at resolution through the shared engine/1ZT choice (face-up, the player's choice).
- **幻獣サンダーペガス**:
  - A GY quick effect in the attack-declaration window of an opponent's attack (engine/1Y).
  - Cost: banish itself. Target: a face-up 「幻獣」 it controls (GROUP.PHANTOM_BEAST).
  - It grants a v21 battle protection until the end of the turn.
- **E・HERO テンペスター**:
  - Ignition. Cost: send another card on its controller's field to the GY. Target: a monster on its field (itself allowed); each activation adds one monster.
  - Zone-local links on both sides (`u165TempesterBy`, `u165TempesterUids`). While it is face-up, linked own monsters are protected from battle destruction (`protectV21`).
  - 「融合召喚でしか特殊召喚できない」 comes from engine/1ZK.

## Test — `tools/test_s03_u165_protections3.js` 14/0 (real DUEL path; Replay-audited)
- **A デュアル・ソルジャー**:
  - Gemini Summoned (`doGeminiSummonS03`), it attacks ゴブリン突撃部隊 and survives.
  - Only デュアル・ランサー is offered (not デュアル・ソルジャー, not the Lv5 ヴァリュアブル・アーマー) and it is Special Summoned.
  - Without the Gemini Summon it is destroyed and nothing triggers.
- **B 幻獣サンダーペガス**:
  - Offered at 青眼の白龍's attack declaration and banished.
  - 幻獣王ガゼル is not destroyed by that attack, nor by a 2nd attack that turn.
- **C E・HERO テンペスター**:
  - ワイト is sent as the cost and ゴブリン突撃部隊 is linked; the next turn it survives 青眼の白龍 (700 damage taken).
  - Once テンペスター is destroyed by サンダー・ボルト, the monster is destroyed.
- **Negative control on U164**: 7 FAIL. Pre-scan: every other gate test file is unchanged.

## Status
- PARTIAL → TESTED: デュアル・ソルジャー.
- NOT_STARTED → TESTED: 幻獣サンダーペガス, E・HERO テンペスター.
- Totals: TESTED 2275, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 148, ENGINE_GAP 603, NOT_STARTED 1241.
