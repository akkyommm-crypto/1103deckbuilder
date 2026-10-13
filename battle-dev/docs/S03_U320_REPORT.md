# S03-U320 — 「ナチュル」: モスキート, ローズウィップ, レディバグ, フライトフライ, スタッグ, ホワイトオーク

Base: `claude/work` `bbc3e67` (U319, gate 18764 PASS / 0 FAIL). Sonnet 5.5, single writer. All six NOT_STARTED; no engine change.

## Change (`cards/HZZZZZZH_claude_s03_u320_naturia.js`)
- モスキート: cannotBeAttackTarget while another face-up 「ナチュル」 of mine exists; battleDamageRedirect for battles of the other 「ナチュル」.
- ローズウィップ: activationLockS03 over the per-turn Spell / Trap card activation record (one Spell/Trap activation per turn for the opponent).
- レディバグ: Graveyard trigger on my Synchro Summon of a 「ナチュル」 (event kind `synchro`, needs `onOtherSummon`); ignition: release itself, +1000 ATK to another 「ナチュル」 until the End Phase.
- フライトフライ: continuous −300 ATK/DEF per 「ナチュル」 of mine on the opponent's monsters; once per turn take control of a DEF 0 monster until the End Phase (`API.changeControl … 'endPhase'`).
- スタッグ: declared activation response (engine/1P) while it is attacking: Special Summon a 「ナチュル」 from my Graveyard, once per turn.
- ホワイトオーク: declared activation response when the opponent's chain link targets it (targets read from `chainLinkTargetsV11`; entries may be wrappers `{mode, t}`): itself to the Graveyard, two Lv4- 「ナチュル」 from the Deck, permanent `cannotAttack`, destroyed at my own next End Phase (`API.schedule`).
- Left: ナチュル・エクストリオ (fusion + negation), ナチュルの森 (「発動を無効にした場合」 has no event).

## Tests
- `tools/test_s03_u320_naturia.js` 36 / 0 (real attack-target lists, battle damage, Synchro Summon, activation windows, attack-declare chain; negatives per card; Replay audits). Negative control on the previous build: 16 FAIL. Coverage TESTED 2991 → 2997, NOT_STARTED 856 → 850; audit 0 off-target.
- Test authoring notes: エネミーコントローラー: answer 'yes' = position change (the target is the opponent's monster); keep `PREFER` set until `windows()` has answered the target choice; エッグプラント as a Synchro material adds a Graveyard 「ナチュル」 to the hand (use ビーンズ).
