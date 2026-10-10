# S03-U27 C-S03-23 SEGOC_SPELL_TRAP_ORDER (Claude)

Base: `checkpoint_claude_s03_u26_damage_step_end_after_destruction_20260912.zip`, SHA256 `6ab1eda92e1141fc8ba1df7236c379d86a1dd3c030ebefce167665bade05f783`.

## How it was found

- **Vertical slice #6 (VS6 draft, U26 build).** P1 had 漆黒の魔王 LV4 and a set 時の機械－タイム・マシーン; P2 had 紫炎の足軽 (VS3's 真六武衆 list).
  - T3: LV4 destroyed 紫炎の足軽.
  - At ⑤, P1's 時の機械 went on the chain first.
  - Picking P2's optional 紫炎の足軽 trigger was then refused 「スペルスピードが足りません（SS1 / チェーン上 SS2）」, and the same candidate was offered again forever. The battle never closed.
- **Source measurement.**
  - `collectHandlers` scans the Spell & Trap Zone as well. `startEventChainV2` ranked every candidate with `segocRank(forced, player)` into four groups (TP forced, non-TP forced, TP optional, non-TP optional), whatever the card type. So P1's trap (rank 2) preceded P2's monster trigger (rank 3).
  - `eventPickV2` calls `prepareDuelActivation`, which refuses a link whose spell speed is below the chain top and leaves the candidate in the group.
- **Ruling sources (2011 wiki).**
  - 時の機械－タイム・マシーン: 「発動タイミングは、戦闘破壊が決定しモンスターがフィールドを離れ墓地に送られた直後です。その際に誘発する誘発効果がある場合、それにチェーンしての発動となります」.
  - 奈落の落とし穴 / 激流葬: 「その効果の発動に対し、このカードをチェーンして発動する」形.
  - 落とし穴 vs 氷帝メビウス: 「チェーン１に《氷帝メビウス》の破壊効果…チェーン２に《落とし穴》」.
  - Trap cards that activate "when" the same event happens are chained after the trigger effects.

## Measurement before the fix (U26 build)

The U27 test on the U26 build gave **6 PASS / 4 FAIL**:
- fail: the endless re-offer, the chain order, the resolution, and the group order;
- pass: the VS6 board with the trap declined, the trap-alone control, and all Replay audits.

## Requirement closure record

- **Requirement.** For one event, all simultaneous trigger effects are chained first in SEGOC order. Spell/Trap cards that 「〜した時に発動できる」 are offered after them, turn player first. A Spell Speed 1 trigger is never blocked by a trap chained before it.
- **Root cause (ORDERING).** Spell/Trap cards were ranked inside the trigger-effect groups.
- **Closure.**
  - **`engine/40_legal_script_engine.js` `startEventChainV2`:** Spell/Trap candidates get rank 4 (turn player) / 5 (non-turn player) and are never treated as forced. Groups are 0–5.
  - **`processEventGroupV2`:** iterates `st.groups.length` instead of 4.
  - Monster trigger ranks 0–3 are unchanged.
- **Consumers.**
  - Every set trap offered through the event groups: 時の機械－タイム・マシーン, ブロッサム・ボンバー, カース・サイキック (S03-U24), and others with a passive event handler.
  - Every opponent trigger that happens at the same time.
- **Recovery.** No status change. Duels no longer stall in this situation.
- **Dependent classification.**
  - **① Covered by the real-path test (each with a Replay audit):**
    - ジェネティック・ワーウルフ destroys 紫炎の足軽 while P1 has 時の機械 set: no loop; 紫炎の足軽 is link 1 and 時の機械 link 2. 時の機械 returns 紫炎の足軽, then its effect Special Summons 六武衆の露払い.
    - VS6 board with 時の機械 declined: no loop; U25's negation holds; the trap stays set; it is offered in a later group.
    - Control: 時の機械 alone returns P1's destroyed monster.
  - **② Remaining.**
    - A refused pick still leaves the candidate in its group. With traps ranked last this is not reachable for Spell Speed 1 triggers; other refusal causes remain possible.
    - Spell/Trap cards are still offered through the event UI rather than the chain-response window (same result for ordering).
  - **③** None.
- **Practical effect.** A player's set 「…時」 trap no longer stops the opponent from using a trigger caused by the same event; the chain is built in the ruling order.

## Changed files

- `engine/40_legal_script_engine.js`: event group ranking and iteration.
- `tools/test_s03_u27_segoc_spell_trap_order.js`: new; wired into `tools/check.py` after U26.
- Generated: `dist/battle.html`, `dist/battle_acode.html`, `data/script_coverage.json`, `docs/SCRIPT_COVERAGE.md`.

The edit was applied by a guarded transform (exactly-once patterns; `--dry` first; scratchpad `u27_transform.py`). `dist/*.html` were not edited by hand. Every card named in the test is TESTED or GENERIC_OK.

## Verification

- **`node tools/test_s03_u27_segoc_spell_trap_order.js`.** EXIT 0, 10 PASS. On the U26 build: 6 PASS / 4 FAIL.
  - Regression suites on the same build: U09 (18), U10 (33), U14 (50), U18 (15), U23 (16), U24 (18), U25 (13), U26 (11), VS1 (21), VS2 (16), VS3 (22), VS4 (25), VS5 (16), `test_auto_cycle18` (51), `39` (51): all EXIT 0.
- **Full gate.** `python tools/check.py`: EXIT 0, **12257 PASS / 0 FAIL** (U26's 12247 + U27 10). The S03, Astra01 and Astra02 audits report 0 off-target status changes (`s03_u27_full_gate.log`).
- **Acode.** `python tools/build_acode.py data/carddata.json`: EXIT 0, cards=4996.

## Coverage

- Unchanged: TESTED 2068 / ENGINE_GAP 615 / NOT_STARTED 1303 / IMPLEMENTED 185 / PARTIAL 181 / GENERIC_OK 644 / TOTAL 4996. Static registrations: 2253.
- Gated source manifest SHA256 (excluding dist/ and *.log, this report set aside): `9bf4773441517010c0e74cd68b59adc0a17238362fdaee1ae5ad2d682d17eb6a` (649 files).
