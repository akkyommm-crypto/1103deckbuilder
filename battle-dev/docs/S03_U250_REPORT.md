# S03-U250 — NOT_STARTED 4 (凶暴化の仮面, マシュマロンのメガネ, ライトロード・レイピア, ジュラック・デイノ)

## Workflow (mixed, fresh Sonnet subagent)
- A fresh Sonnet subagent ran `brief250.md` with six candidate cards. It finished four with 33/0 on its first hand-back, with no engine change.
- It stopped on the other two, as the brief asked, and reported why:
  - ナチュル・スパイダーファング: the engine keeps no per-turn record of the opponent's activations. Only `gameState.lastActivationV12`, the latest one, exists.
  - ハーピィ・レディ三姉妹: its 2011 text says 「…の効果で特殊召喚できる」 without 「のみ」, which engine/1ZK does not parse.
  - Both stay NOT_STARTED. No status changes for them.
- The main session reviewed the code, then did the declarations, the check.py registration, this report and the gate.
- Measured: subagent 231,841 tokens, 83 tool uses, 591 s. No parent-side corrections.

## Cards → TESTED (2011 texts) — cards/HZZZZD_claude_s03_u250_ns32.js

| Card | Effect |
|---|---|
| 凶暴化の仮面 | Equip Spell: ATK +1000 / DEF −1000. At its controller's Standby Phase, pay 1000 LP or destroy it (forced; an option choice). |
| マシュマロンのメガネ | Continuous Spell: while you control a face-up 「マシュマロン」, the opponent can target only 「マシュマロン」 for attacks (`continuous.cannotBeAttackTarget`). |
| ライトロード・レイピア | Equip Spell for 「ライトロード」 monsters only, ATK +700. When sent from the Deck to the GY, it may equip itself from the GY to an own 「ライトロード」. |
| ジュラック・デイノ | At the End Phase of a turn it destroyed a monster by battle, once: release 1 「ジュラック」 (cost) → draw 2. |

Reused pieces:
- `equipActivateS03` (S03-U233);
- the 召喚の呪詛 maintenance-cost choice;
- engine/1ZU attack-target restriction;
- `API.equipFromGrave`;
- SETCODE.LIGHTSWORN / SETCODE.JURRAC. Both were checked to be exact for monsters.

Rulings chosen and reviewed:
- 凶暴化の仮面: with 1000 LP or less it is destroyed, like the other maintenance costs (paying is never allowed to reach 0).
- マシュマロンのメガネ: only a face-up 「マシュマロン」 exists by name. A face-down one does not turn the effect on. Direct attacks are not affected.
- ライトロード・レイピア: the host is chosen at resolution; it is not targeted.
- ジュラック・デイノ: it may release itself, and it works on either player's turn (it can destroy the attacker while defending).

Known limit: ジュラック・デイノ records its battle kill with a forced Damage Step mark (`deinoKillTurnS03`, a journaled card flag). This is replaced in S03-U251 by the engine record `battleKillTurnS03`.

## Tests
`tools/test_s03_u250_ns32.js` passes 33/0, on real DUEL paths and Replay-audited. Covered:
- the pay and destroy paths, the opponent's Standby Phase, and the 1000 LP case;
- the attack-target restriction with and without 「マシュマロン」;
- the real End Phase mill of ライトロード・パラディン ジェイン, with a full Spell & Trap Zone, a hand discard, and a non-ライトロード host;
- kills while attacking and defending; a direct attack and mutual destruction (no draw).

Negative control on U249: 15 FAIL. The script was removed from the manifest; the negatives and audits still pass.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16419 PASS / 0 FAIL** (= U249 16386 + 33 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U249.
- Coverage: TESTED 2755, ENGINE_GAP 572, NOT_STARTED 993, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 29 (4996); audit 715 declared, 0 off-target.
