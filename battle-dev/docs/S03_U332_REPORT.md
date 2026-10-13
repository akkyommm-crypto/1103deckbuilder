# S03-U332 — 「スクラップ」: ゴブリン, ソルジャー, ゴーレム, オルトロス, カウンター

Base: `claude/work` `774706d` (U331, gate 19061 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change (スクラップ・オイルゾーン left).

## Cards (`cards/HZZZZZZT_claude_s03_u332_scrap.js`)
- ゴブリン / ソルジャー: forced stamp at `onAttackDeclare` when the face-up Defense Position card is the target (`u332Targeted` = turn) and a forced `onBattlePhaseEnd` destruction; the optional Graveyard trigger after a 「スクラップ」 card's effect destroyed them (`scrapDestroyedS03`) adds another Scrap monster; ゴブリン: `protectV21` battle; ソルジャー: `synchroMaterialRestriction` (only Scrap Synchro Monsters).
- ゴーレム: ignition once per turn, target a Lv4- Scrap of my Graveyard, a registry choice of the field (own / opponent's) at resolution, `API.specialSummon(to, 'grave', index, 'atk', …, fromPlayer)`. **Status:** it carried a recorded ENGINE_GAP in `data/script_status_overrides.json` (「activation target plus a serializable choice of which player's Monster Zone receives it」); both pieces exist now, so the override entry was removed and the declaration is `ENGINE_GAP → TESTED`.
- オルトロス: no Normal Summon (`cannotNormalSummon`), hand procedure needing a face-up Scrap of mine; the forced destruction of a chosen own Scrap (itself allowed) only when `specialSummonKind==='procedure'`; the shared recovery trigger.
- カウンター (Trap): `damageStepOnly`, `dsTiming:'calc'`, my face-up Defense Position Scrap is the attacked monster; DEF +2000 (permanent modifier) and a `battlePhaseEnd` schedule destroys it.

## Tests
- `tools/test_s03_u332_scrap.js` 27 / 0 (Defense Position destruction and its negative, recovery after オルトロス / not after ブラック・ホール, Synchro Material restriction, both fields for the revive, the procedure incl. targeting itself, the Trap at the calculation step and the Battle Phase end; Replay audits). Negative control on the previous build: 13 FAIL. Coverage TESTED 3041 → 3046, NOT_STARTED 806 → 802, ENGINE_GAP 472 → 471; audit 0 off-target.
- Existing tests touched (expectations kept, fixtures / pins adapted): `test_s03_u194_spells_traps.js` F used スクラップ・ゴブリン as the Scrap card to destroy — with ゴブリン now having its optional recovery trigger a driver that always activates recovers the milled ビースト, so the fixture is スクラップ・ハンター (same assertion); `test_v850_batch36.js` pinned スクラップ・ゴーレム in its recorded-gap list — removed (the gap is lifted, see above).
- Authoring note: スクラップ・サーチャー revives itself from the Graveyard when another スクラップ is destroyed — do not use it as Graveyard fodder in such tests.
