# S03-U173 — optional destruction substitutes: pause and let the player choose

User decision (2026-09-26): an optional destruction substitute pauses the processing where it applies and the player chooses.
First four cards on one common mechanism; per-card automatic settings later.

## Cards

| Card | Text (2011) | Before | After |
|---|---|---|---|
| 真六武衆－シエン | ②:フィールドのこのカードが戦闘・効果で破壊される場合、代わりに自分フィールドの「六武衆」モンスター1体を破壊できる。 | PARTIAL (S03-U143 pin) | TESTED (System02 baseline) |
| 六武衆－ザンジ | …フィールド上に表側表示で存在するこのカードが破壊される場合、代わりにこのカード以外の自分フィールド上に表側表示で存在する「六武衆」と名のついたモンスター1体を破壊できる。 | PARTIAL (S03-U143 pin) | TESTED (System02 baseline) |
| 六武衆－ヤイチ | (same substitute sentence as ザンジ) | PARTIAL (S03-U143 pin) | TESTED (System02 baseline) |
| ガチガチガンテツ | フィールド上のこのカードが破壊される場合、代わりにこのカードのエクシーズ素材を1つ取り除く事ができる。 | IMPLEMENTED | TESTED |

The three 六武衆 return to their System02 baseline status, so they are no longer status changes against the baseline: their S03-U143
declarations moved to `restored_to_baseline` in `data/s03_status_changes.json` (the audit compares with the baseline only).
ガチガチガンテツ is declared IMPLEMENTED → TESTED. Declared changes: 252 → 250.

## Mechanism (engine/1ZV_destroy_substitute_s03.js)

- Declaration on the card script: `destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter}` (another own face-up
  monster, 六武衆 by `v350Six`) or `{kind:'detach', causes:[...]}` (one of its own Xyz materials). The protected card must be face-up in
  a Monster Zone with its effects not negated.
- **Effect destruction** — `API.destroy` / `API.destroyAll` while a chain link resolves in the DUEL processor: when a protected card with
  a usable substitute would be destroyed, the destruction is held. It and every later destruction of the same resolution are
  collected and turned into decisions when the resolution returns (`processSolveChainV27`) or after the resolution's own choice has
  been answered (`resumeAfterResolutionChoiceS03`). The held actions keep the resolving effect's provenance (P3 stamp, source stamp)
  baked in, so protections and 「破壊したプレイヤー」 are decided as before.
- **Battle destruction** — the damage step cleanup stage waits before `BATTLE_CLEANUP` and runs again after the decisions.
- **Simultaneous destruction** — candidates come from the board before anything moves; every card destroyed in the same event is
  excluded, and a card already chosen as a substitute cannot be chosen again for another protected card. Several protected cards are
  asked one after the other; all moves happen together after the last answer.
- **Decision** — one journaled registry choice per protected card (handler `s03u173.destroy-sub`, the whole job is JSON in
  `resume.args`), asked of the protected card's controller, **not cancelable**: 「身代わりを使う：「…」を破壊」 /
  「身代わりを使う：素材「…」を取り除く」 per candidate and 「使わずに破壊する」, asked even with one candidate.
- The substitute destruction is an effect destruction by the protected card's controller (source = the protected card) and cannot
  itself be substituted. The removed material goes to its owner's GY (not a destruction).
- New Action `DESTROY_SUB_S03 {site, picks}` (log; for battle it clears `battleDestroyed` of the protected cards and marks the battle
  decided). `FX_WIPE_ZONE` takes `spareUidsS03`.
- **Save / resume** — `restoreDestroySubWaitAfterLoadS03` rebuilds the processor wait (chain resolution or damage step cleanup).
  **Replay** — the answer and every resulting move are Actions.
- **UI** — the bottom sheet shows the protected card (「守るカード」) above the choices; each candidate row shows the card that would be
  lost. Tapping outside no longer closes a non-cancelable choice (engine/60 veil handler), so closing can never be taken as a decision.

## Limits (documented, FOLLOW_UP_GAPS)

Not intercepted: destructions made by a script's raw `act()` (not `API.destroy` / `destroyAll`), destruction as a cost, destruction
outside a chain link resolution, 「破壊し除外」. A script step that inspects the destroyed card right after `API.destroy` in the same
resolution sees the board before the decision. Per-card automatic settings (always / never) are left for later, as decided.

## Tests

`tools/test_s03_u173_destroy_substitute.js` 37/0 (real DUEL paths):
- A: 地割れ destroys ヤイチ → Player1 (the controller, not the player of 地割れ) is asked; one candidate still shows both choices; the
  choice cannot be cancelled; nothing moved; use → カゲキ destroyed (effect, by Player1), ヤイチ stays; the chain finishes; Replay.
- B: decline → ヤイチ destroyed, カゲキ stays. C: two candidates → the chosen second one is destroyed.
- D: 青眼の白龍 attacks シエン → asked before the cleanup; nothing moved; use → ザンジ destroyed, シエン stays, 500 damage; battle ends.
- E: no candidate → nothing asked, destroyed by battle.
- F: ブラック・ホール with ザンジ / カゲキ / ガンテツ (2 materials) → only ガンテツ asked (ザンジ's only 六武衆 is destroyed at the same time);
  the chosen second material removed; every other monster destroyed together.
- F2: two ガンテツ in one ブラック・ホール → asked one after the other, nothing moves until the last answer.
- A-resume / D-resume: saved while the decision is pending, resumed through `offerResumeDuel`; the processor wait is rebuilt and the
  final digest equals the uninterrupted run; Replay audited.
- H: the veil (outside tap) handler returns for a non-cancelable choice and never answers it.

Negative control on U172 (`dist/battle.html` + carddata): FAIL A + TypeError (no choice opens), H FAIL, no save snapshots.

`tools/test_s03_u143_audit_note_status.js`: シエン / ヤイチ / ザンジ moved from the pinned list to `UNLOCKED_U173` (no pin, the auditNote no
longer admits a missing part, the script declares the substitute) — same number of assertions.

## Gate

- `python tools/check.py` → `GATE_EXIT=0`, **14688 PASS / 0 FAIL** (= U172 14651 + 37 new, exactly), no Traceback / ReferenceError; the one
  caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): every existing test file has the same PASS count as U172; only the new test differs (+37).
- Coverage: TESTED 2289, IMPLEMENTED 84, GENERIC_OK 644, PARTIAL 142, ENGINE_GAP 601, NOT_STARTED 1236 (4996); audit: 250 declared
  status changes observed, 0 off-target.
