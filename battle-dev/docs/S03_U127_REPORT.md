# S03-U127 — "properly summoned first" rule + ダーク・アームド・ドラゴン (procedure; activation-time cost)

## Why
- No record of a proper summon existed: e.g. a ダーク・アームド・ドラゴン or 裁きの龍 sent to the GY by a mill, or any
  Synchro / Fusion / Xyz / Ritual Monster that reached the GY without ever being summoned, could be revived by 死者蘇生 etc.
  By rule a special-summon monster can be Special Summoned from the GY / banished zone only after it was properly summoned.
- ダーク・アームド・ドラゴン (bf) had no summon procedure: its special summon was an effect activated from the hand (a chain
  link, not negatable as a summon, respondable), and ①'s banish cost was paid at resolution (after responses; not paid if
  negated).

## Change
- `engine/1ZK_summon_only_s03.js`: `specialSummonMonsterKindS03(db)` (fusion / synchro / xyz / ritual / procedure =
  「このカードは通常召喚できない」), `properlySummonedReasonS03(card, summonKind, reason, from)` — only for Special Summons
  from the GY / banished zone: allowed with the card's own proper method (matching `summonKind`, or its own effect for a
  procedure-type Main Deck monster) or when `card.properlySummonedS03` is set; `sweepProperlySummonedS03` forgets the
  record when the card is in the hand / Deck / Extra Deck (run at the end of every applyAction — Replay-safe).
- Marking (reducer): `EX_SUMMON_COMMIT_V42`, `FX_EX_SUMMON` (fusion / synchro / xyz), `FX_RITUAL_SUMMON`,
  `FX_SPECIAL_SUMMON` with a matching `summonKind` (fusion by 超融合 / ミラクル・フュージョン / 未来融合, 'procedure' now written
  by the summon-procedure path) or a procedure-type monster summoning itself (カオス・ソーサラー, 裁きの龍 …).
- Enforcement: `API.specialSummon` (after the U126 「でしか」 check), with the message
  「…は正規の方法で特殊召喚されていないため、この効果では特殊召喚できません」.
- Hand / Deck / Extra Deck Special Summons by effects are unchanged (限定解除, シンクロ・チェンジ …); the 「召喚条件を無視して」 cards
  are not needed for GY/banished revival.
- `cards/00_generic_core.js` ダーク・アームド・ドラゴン: `summonProcedure` (exactly 3 DARK monsters in the GY; face-up ATK/DEF;
  goes through the summon window like サイバー・ドラゴン); ① `cost` banishes 1 DARK monster from the GY on activation,
  1 field card targeted, destroyed at resolution.

## Test — `tools/test_s03_u127_properly_summoned.js` 19/0 (real DUEL path, Replay-audited)
- A milled DAD → 死者蘇生 refused (message). B DAD by its procedure → recorded → destroyed (record kept in the GY) →
  revived. C a Synchro placed in the GY → refused; properly Synchro Summoned → destroyed → revived. D bounced to the hand →
  record gone → discarded → refused. E DAD's procedure opens the summon window (神の宣告 offered), ① pays the banish cost on
  activation, destroys the target at resolution.
- Negative control on U126: A–E fail.
- Test setups that placed Extra Deck monsters directly in the GY / on the field and then revived / returned them now mark
  those cards as properly summoned earlier (`test_auto_cycle25` シンクロ・ガンナー, `test_auto_cycle28` ロスト・スター・ディセント,
  U121 B, U123 B, U126 A) — assertions unchanged. Broad rescan (128 files: revive / special summon / fusion / ritual /
  procedure / banish-return tests): 0 FAIL after those setup updates.

## Status
- No status change (ダーク・アームド・ドラゴン already TESTED; focus registration added).
