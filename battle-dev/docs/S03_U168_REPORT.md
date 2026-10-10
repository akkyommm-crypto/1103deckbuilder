# S03-U168 — 「対象を取らない効果では破壊されない」 in the real chain path

## Why
S03-U167 found that the v21 effect-destruction context read the resolving link from the top of `gs.chain`, which is empty while that link resolves. The source kind was fixed there. The targeting check, `destroyerTargetingV21`, had the same problem: in the real path every effect counted as non-targeting. So 深海王デビルシャーク and 異次元竜 トワイライトゾーンドラゴン were also protected from targeting effects such as 死者への手向け.

Also, 異次元竜 トワイライトゾーンドラゴン's declaration had `sourceKind:null`, meaning any source including monster effects. Its text says 「対象を指定しない**魔法・罠カード**の効果」.

## Change
- **engine/1R** `beginLinkResolutionS03`: the resolving link record carries `targetUids`, the uids it targets. It is filled only for a targeting script (`targets:true`), the same rule as the target-immunity check.
- **engine/1ZG** source stamp: `a.srcS03.tg` = those uids, only when non-empty. It is written when the action is committed and replayed with it.
- **engine/1K**:
  - `effectDestroyCtxV21(gs, a, card)`: targeting = the destroying effect targeted **this** card (`a.srcS03.tg` contains its uid). engine/00 passes the card for FX_TO_GRAVE and per card for FX_WIPE_ZONE.
  - `protectionRecordV21`: the source-kind limit applies to effect destruction only. The pre-scan showed that with トワイライトゾーンドラゴン's corrected `['s','t']`, its battle protection, which lives in the same record, was lost because the limit also filtered battles.
- **cards/9G**: 異次元竜 トワイライトゾーンドラゴン `sourceKind:['s','t']`.

## Test — `tools/test_s03_u168_non_targeting.js` 10/0 (real DUEL path; Replay-audited)
- **A 深海王デビルシャーク**: the 1st サンダー・ボルト (non-targeting) does not destroy it (ワイト is destroyed); the 2nd that turn does (once per turn).
- **B**: 死者への手向け targeting 深海王デビルシャーク destroys it.
- **C 異次元竜 トワイライトゾーンドラゴン**: two サンダー・ボルト do not destroy it; 死者への手向け targeting it does.
- **D**: トワイライトゾーンドラゴン is not destroyed by ギガンテス (1900) but is by 青眼の白龍 — the battle protection is kept.
- **Negative control on U167**: 2 FAIL (B / C: targeting was invisible).
- `test_destruction_protection_cards.js` 111/111 after the effect-only source-kind rule.

## Status
No status change: both cards were TESTED and now behave as their texts say in the real path. Totals: TESTED 2280, IMPLEMENTED 85, GENERIC_OK 644, PARTIAL 145, ENGINE_GAP 603, NOT_STARTED 1239.
