# S03-U09 C-S03-06 TRIGGER_OFFER_LEGALITY (Claude)

Base: `checkpoint_claude_s03_u08_journaled_flags_20260911.zip`, SHA256 `473509f2ba6b6438a5d937cfe38a32c7cb82876c08d1430bcc8651df86c851ef`.

## How it was found

- **Vertical slice #1** (Dragunity provisional vs 1103兎ラギア, real path). P2 Normal Summoned レスキューラビット (ATK 300), and P1's set 奈落の落とし穴 was offered in the SEGOC sheet.
  - Picking it only showed 「このタイミングで召喚された攻撃力1500以上の相手モンスターがいません」.
  - The event stayed open until the optional group was skipped.
- **Code read.** Forced groups (rank < 2) cannot be skipped (`eventSkipGroupV2` returns for rank < 2). So an illegal *forced* offer stalls the duel.

## Measurement before the fix (U08 build)

- **Real path:**
  - The opponent's set 奈落 was offered for a 300-ATK Normal Summon; strict legality was false, and the event stayed open after the pick.
  - P2's face-down 聖なる魔術師 was flipped by an attack with no Spell in its GY:
    - the forced trigger was offered;
    - the pick was refused (「墓地に魔法カードがありません」);
    - the skip did nothing, and the event stayed open. **Hard stall.**
  - 闇霊使いダルク flipped by an EARTH attacker behaved the same (「相手フィールドに闇属性モンスターがいません」).
- **Synthetic scan** (self summon/flip triggers on a minimal board, the offer filters versus `strictScriptLegalityV2`):
  - 433 tried; 120 offered but illegal (34 forced, 86 optional).
  - 66 of the rows carry only the generic unified reason 「この場所・タイミングで発動できる効果がありません」. They are likely artifacts of the synthetic event: 竜殺者 was not offered on the real path even before the fix.

## Requirement closure record

- **Requirement:** in DUEL mode, SEGOC offers a trigger only if it can be activated now, with the same legality as when the player picks it: condition, count limit, locks, trap negation.
  - Rules basis: an effect that cannot be activated (for example, no target) is not activated. A mandatory effect with no target does not stop the game.
- **Root cause:** INTEGRATION_MISSING.
  - `collectHandlers` filtered offers only with `passive[event](ctx)`, summon/flip applicability, the count limit and the deck lock (U04).
  - The script's activation `condition` was checked only when the player picked (`eventPickV2` → `prepareDuelActivation`).
- **Closure**
  - In DUEL mode, `collectHandlers` also requires `strictScriptLegalityV2(name, p, zone, index, …)` with the same options `eventPickV2` uses: `event`, `eventName`, `battle`, `step`, `battleOpponent`, `ignoreTiming:true`.
  - It also passes `cardOverride` and `logicalZone:'mz'` for flip-as-field.
  - MANUAL mode is unchanged.
- **Consumers:** every SEGOC offer in DUEL mode (summon, flip, battle, phase and other event triggers, for both players).
- **Recovery (cluster)**
  - The generic filter covers every trigger whose passive check is broader than its activation condition. Examples from the scan:
    - forced: 聖なる魔術師, 闇の仮面, 光/地/水/火/闇/風霊使い, 墓守の偵察者, 墓守の番兵, 深淵の暗殺者, ジェネクス・ウンディーネ;
    - optional: 終末の騎士, グリーン/レッド/イエロー・ガジェット, 神秘の代行者 アース, ジャンク・シンクロン, BF－極北のブリザード, 真六武衆－カゲキ, 鬼ガエル, and others;
    - opponent-summon traps such as 奈落の落とし穴.
  - **No status change.**
- **Dependent classification**
  - ① covered:
    - all offered-but-illegal triggers, generically;
    - real-path regression on 奈落の落とし穴 (not offered / offered and resolved), 聖なる魔術師 (no target → not offered, no stall; with a target → offered and resolved), 闇霊使いダルク (no target → not offered, no stall).
  - ② none known.
  - ③ none.
  - **Not yet examined:**
    - The 66 generic-reason rows are covered by the filter, but I have not confirmed each one individually on a real path.
    - Chain-response offers (`getChainResponsesV2`) are a separate path, outside this Requirement.
- **Checked and consistent with 2011 rulings (no change).** In the engine, a flip trigger caused by battle is offered in the damage step while the flipped monster is still on the field, before it is sent to the GY. 2011 wiki snapshots agree:
  - 深淵の暗殺者 (11/08/12): it activates right after that processing, before the monster is sent to the GY;
  - レプティレス・スキュラ (09/10/21): destruction is confirmed, then the flip effect happens before sending to the GY;
  - メタモルポット: damage calculation comes before the flip effect's processing.
- **Practical effect**
  - A duel can no longer freeze on a mandatory trigger that has no legal activation.
  - Players are no longer shown traps and effects they cannot activate. This also affects what the opponent sees: an illegal set trap is no longer offered.

## Changed files

- `engine/40_legal_script_engine.js` (`collectHandlers` DUEL offer legality)
- `tools/test_s03_u09_offer_legality.js` (new), wired into `tools/check.py`
- generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`

`dist/*.html` were not edited by hand.

## Verification

- **`node tools/test_s03_u09_offer_legality.js`:** EXIT 0, 18 PASS.
  - 奈落 is not offered for a 300-ATK Normal Summon: no refused pick, and the summon window closes. Replay OK.
  - 奈落 is still offered for a 2000-ATK Normal Summon, activates and banishes it. Replay OK.
  - Forced 聖なる魔術師 with no Spell in its GY is not offered. The battle finishes and the turn advances to Main Phase 2. Replay OK.
  - With a Spell in its GY, it is offered, its choice lists the Spell, the Spell is added, and the battle then destroys it. Replay OK.
  - Forced 闇霊使いダルク with no DARK monster is not offered, and the turn advances. Replay OK.
- **Real-path probe** (scratchpad `u09_real.js`), before and after the fix: both stall cases are gone, and the positive control is unchanged.
- **Vertical slice probe re-run on the U09 build:**
  - T1–T3: 奈落 still banishes both Special Summoned セイバーザウルス.
  - The VM1 Replay audit is OK (129 actions); the VM2 continuation and turn 4 are OK.
- **Earlier dedicated tests on the U09 build:** U01–U08 = 56 / 76 / 57 / 38 / 46 / 21 / 32 / 34 PASS.
- **Full gate:** `python tools/check.py` — EXIT 0, **11841 PASS / 0 FAIL**; S03 audit off-target status changes = 0 (`s03_u09_full_gate.log`).
- **Acode:** `python tools/build_acode.py data/carddata.json` EXIT 0.

## Coverage

- Unchanged: TESTED 2064 / ENGINE_GAP 616 / NOT_STARTED 1304 / IMPLEMENTED 187 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2251.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `57ce2efc792ab85a02bd27ecf519f146549f46c7118333bb2cbfbc378e9fb428` (592 files).
