# S03-U177 — 剣闘獣ヘラクレイノス, E・HERO ブラック・ネオス (a monster's linked negation)

## Engine (engine/1ZY_linked_negation_s03.js)
「このカードがフィールド上に表側表示で存在する限り、選択したモンスターの効果は無効化される」 from a monster: `effectNegated()` read only
Spell / Trap sources. Now a link of two zone-local marks set by Actions (target `negLinkS03` = source uid, source `negLinkTargetS03` =
target uid; both in ZONE_LOCAL_KEYS) negates the target while the source is a face-up monster, still linked, and not negated itself
(recursion-guarded). It is read by `effectNegated` and by the continuous sources (a negated monster's continuous effects stop).
`linkNegateTargetS03(src, target, reason)`, `linkedNegationTargetS03(src)`.

## Cards (NOT_STARTED → TESTED)
- 剣闘獣ヘラクレイノス: contact fusion (return to the Deck; the 「×2」 slot, S03-U174 parser fix); Quick Effect while face-up: discard 1 →
  negate a Spell / Trap card activation (a real card activation) and destroy it; no count limit; either player's activation.
- E・HERO ブラック・ネオス: contact fusion; select a face-up effect monster → negated while ブラック・ネオス stays face-up (one at a time);
  End Phase return.

## Tests
`tools/test_s03_u177_contact3.js` 12/0 (real DUEL paths, Replay-audited): A ヘラクレイノス contact (ラクエル + two 「剣闘獣」); B the
opponent's サイクロン negated and destroyed from the chain window, the set card stays, the discarded card in the GY; C not offered without
a hand card; D ブラック・ネオス: N・フレア・スカラベ 1300 → 500, second activation refused, 1300 again after the End Phase return; E under
スキルドレイン the source is negated, the link works again without it. Negative control on U175: no scripts.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14749 PASS / 0 FAIL** (= U176 14737 + 12 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U176.
- Coverage: TESTED 2301, ENGINE_GAP 601, NOT_STARTED 1225, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 142 (4996); audit 262 declared, 0 off-target.
