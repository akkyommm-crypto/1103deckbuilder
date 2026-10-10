# S03-U187 — 「Sin」 common mechanism

## Finding (U186 follow-up)
The 「Sin」 monsters had no summon procedure (Sin 青眼の白龍 / 真紅眼の黒竜 / レインボー・ドラゴン / スターダスト・ドラゴン — PARTIAL; Sin サイバー・エンド
was patched in U186): none could be summoned in DUEL, and 「Sin」 uniqueness was not enforced for effect summons.

## Mechanism (engine/1ZZD_sin_s03.js)
`declareSinS03(name, {banish, from, script})`: the summon procedure (banish the named card from the EX Deck / Deck / hand; the player picks
the copy when several zones are allowed), ② other own monsters cannot attack; ① uniqueness in the procedure, `canEffectSpecialSummonS03`
and `API.specialSummon` (a standing rule — also when summon conditions are ignored); ③ remains engine-wide (enforceSinUpkeep).
Sin スターダスト・ドラゴン ②: `sinFieldProtectedS03` in the FX_TO_GRAVE / FX_WIPE_ZONE reducers. tools/script_coverage.py recognises
`declareSinS03`.

## Cards (PARTIAL → TESTED)
Sin 青眼の白龍, Sin 真紅眼の黒竜, Sin レインボー・ドラゴン, Sin スターダスト・ドラゴン (Sin サイバー・エンド・ドラゴン moved onto the mechanism, stays TESTED).

## Tests
`tools/test_s03_u187_sin.js` 13/0 (real DUEL paths, Replay-audited). Negative control on U180: 12 FAIL.

## Left
Sin パラドクス・ドラゴン (Synchro; Sin World dependency), Sin トゥルース・ドラゴン (its own summon effect), Sin パラレルギア (ENGINE_GAP).

## Pre-scan follow-up (found while scanning U190)
`tools/test_s03_u135_auto_table_filters.js` A counts the live identity-filter entries of AUTO_DECK_TABLE (floor 80). U185 moved
サイバー・ラーバァ / 電池メン－ボタン型 / メカウサー to `deckTriggerEffectV4S03`, which did not register its spec in `DECK_TRIGGER_S03`
(`declareDeckTriggerS03` does), so the check no longer saw them. This unit's Sin migration then took the count from 82 to 78.
Fix (engine/1ZT): `deckTriggerEffectV4S03` registers its spec too, so the check sees them again (81). The assertion is unchanged.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14909 PASS / 0 FAIL** (= U186 14896 + 13 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U186.
- Coverage: TESTED 2351, ENGINE_GAP 599, NOT_STARTED 1208, IMPLEMENTED 73, GENERIC_OK 644, PARTIAL 121 (4996); audit 312 declared, 0 off-target.
