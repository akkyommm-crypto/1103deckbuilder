# S03-U135 — AUTO_DECK_TABLE identity filters (cardCode / group / canonical) + コアキメイル・ロック

## Why
Found in U134: 沼地の魔神王's auto-table ② offered ワイト although its entry says `cardCode:24094653` (融合).
`autoDeckMatches` (`cards/40_auto_interpreter.js`) handled the other filters (tk, arch, exclude, at, ra, levels, stats,
tuner, normal) but never applied three of them:
- `cardCode` — 76 entries;
- `group` — 23 entries, the P4 SetcodeAuthority predicate;
- `canonical` — 2 entries.

So 87 live auto-table cards — e.g. C・チッキー, Sin 青眼の白龍, D・リモコン, ガスタ・ガルド, バード・フェイス, 氷結界の紋章,
紫炎の足軽, 魔轟神グリムロ — could search / recruit / mill ANY card in the Deck.

## Change
- `autoDeckMatches` applies the three filters with the existing helpers:
  - `cardCode`: the passcode (`cardCodeOfV4`), or a card treated as it (`canonicalCardCodeV4`);
  - `canonical`: `canonicalCardCodeV4` (for example ハーピィ・レディ1 counts as ハーピィ・レディ);
  - `group`: `isCardInGroupV4(card, group)`, which is passcode-based as the P4 authority requires (never by name).
- コアキメイル・ロック's entry could not express its text, 「コアキメイルの鋼核」1枚**または**レベル4以下の「コアキメイル」
  monster, as a battle-destroyed trigger. It had been an ignition effect usable any time in the Main Phase. With the filter
  applied it matched nothing, because 鋼核 is a Spell.
  - New `cards/HT_claude_s03_u135_auto_table_fixes.js`: a card-specific trigger (`a3SelfBattleDestroyed` +
    `onDamageStep`, SaveLoad-safe handler `s03u135.koaki-lock-search`) replaces the auto-table definition.
  - The file is added to `build_manifest.json`.
- The other auto-table cards stay PARTIAL: their triggers and costs are still coarse. Only the "any card" leak is fixed.

## Test — `tools/test_s03_u135_auto_table_filters.js` 12/0 (real DUEL path for B / C, Replay-audited)
- A (property): every live identity-filter entry (87). The Deck holds ワイト + サンダー・ボルト + up to 4 cards that satisfy the
  entry's full filter.
  - No entry offers ワイト / サンダー・ボルト.
  - Every entry still finds its named card or group member.
- B:
  - D・リモコン on the field offers only the D monster (D・キャメラン) and adds it.
  - バード・フェイス offers only ハーピィ・レディ1 (not ハーピィ・ガール / ワイト).
- C: コアキメイル・ロック.
  - It is illegal as an ignition in the Main Phase.
  - Destroyed by ゴブリン突撃部隊's attack, it offers 鋼核 and the Lv4 コアキメイル・ドラゴ, but not ワイト or the Lv7
    ルークロード. 鋼核 is added.
- Negative control on U134: A (the leak list), B and C fail.
- Pre-scan of all 354 gate tests (parallel): 0 FAIL.

## Status
- コアキメイル・ロック PARTIAL → TESTED (focus registered). TESTED 2202 → 2203, PARTIAL 171 → 170.
