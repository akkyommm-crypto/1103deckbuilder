# S03-U204 — PARTIAL coarse auto-table entries 7 (Tribute-cost recruiters, field-dependent searchers)

## Finding
Ten PARTIAL cards had only coarse AUTO_DECK_TABLE entries (cards/40), without their costs, conditions or self-destruction.

## Cards (PARTIAL → TESTED) — cards/HZZL_claude_s03_u204_partial7.js
- `defineReleaseRecruitS03`: Spell / Trap cards whose cost is Tributing the named monster(s) (before CHAIN_ADD).
  - アタック・リフレクター・ユニット: サイバー・ドラゴン → サイバー・バリア・ドラゴン.
  - ブルーメンブラット: E・HERO クノスペ → E・HERO ブルーメ.
  - 拘束解除: 鉄の騎士 ギア・フリード → 剣聖－ネイキッド・ギア・フリード.
  - ドラゴニック・タクティクス: 2 Dragons → a Level 8 Dragon.
  - 六武ノ書: 2 face-up 「六武衆」 → 大将軍 紫炎.
  - The summoned monsters with 「「X」の効果でのみ特殊召喚できる」 pass the pool's `canEffectSpecialSummonS03` check only for X. The test also
    shows that 死者蘇生 cannot revive ブルーメ.
- ジェムナイト・アレキサンド: an ignition effect; cost: Tribute this card; a 「ジェムナイト」 Normal Monster from the Deck.
- キングス・ナイト: an optional trigger on its own Normal Summon while クィーンズ・ナイト is on the field; ジャックス・ナイト.
- 万華鏡－華麗なる分身－: needs a face-up ハーピィ・レディ; ハーピィ・レディ or ハーピィ・レディ三姉妹 from the hand or the Deck.
- E・HERO キャプテン・ゴールド / ジェネラルデーモン: discard-self searches for their Field Spell, and `destroyWithoutFieldS03`
  (engine/1ZZF): destroyed without it.

## Tests
`tools/test_s03_u204_partial7.js` 28/0 (real DUEL paths, Replay-audited). Negative control on U203: 15 FAIL.

## Follow-up (found by `tools/test_s03_u135` before the gate)
万華鏡's pool spec first registered an empty filter and narrowed it afterwards, so the auto-table identity check saw it offer unrelated
cards. The engine/1ZT filter gains `names` (one of several named cards), and the spec is now exact:
`{names:['ハーピィ・レディ','ハーピィ・レディ三姉妹']}`.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **15323 PASS / 0 FAIL** (= U203 15295 + 28 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U203.
- Coverage: TESTED 2493, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 49 (4996); audit 454 declared, 0 off-target.
