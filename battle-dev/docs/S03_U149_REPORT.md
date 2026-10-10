# S03-U149 — 「相手フィールド上の全てのモンスターに1回ずつ攻撃できる」 as a real continuous rule

## Why
- ジュラック・モノロフ and 神機王ウル are TESTED, but in a real duel **neither could attack a second time**.
  - Their ability was a forced trigger at the start of the Battle Phase (`cards/91` `v6DefineMultiAttacker`) that wrote the
    `BATTLE_GRANT_V6` 'multi' permission.
  - No code reads that permission, so `attackLimitV48` stayed 1 and the second attack was refused ("このモンスターは攻撃宣言
    できません").
  - The grant also went through the chain as an activated effect, although the ability is continuous.
  - Their test (`test_battle_cards.js` `multiAttackCase`) only checked the flag, never a second attack.
- ヴァリュアブル・アーマー (Gemini) and E・HERO ワイルドジャギーマン were NOT_STARTED for lack of this rule.
- 阿修羅 (ENGINE_GAP: also needs the "flipped this turn" record and the Spirit return) and バーサーク・デッド・ドラゴン (ENGINE_GAP:
  depends on the PARTIAL デーモンとの駆け引き) are left for later.

## Change
- New `engine/1ZQ_attack_all_s03.js`: a script declares `attackAllMonstersS03: true` or a function of the card (for Gemini).
  The old 'multi' grant also still counts. While the card is face-up in the Monster Zone and its effects are not negated:
  - it may attack each opponent monster it has not attacked this turn;
  - it may attack directly only under the normal rule (no opponent monster) and only as its first attack;
  - it cannot attack a monster twice, nor attack directly after attacking.
- Record: `card.attackAllS03 = {turn, uids}` (zone-local). It is written by the `ATTACK_DECLARE_V48` and
  `ATTACK_PENDING_RETARGET_S03` reducers, only for such cards, so the Journal of every other attack is unchanged.
- It is wired into:
  - `canDeclareAttackV48` (engine/00);
  - the attack request check;
  - the target list (`battleTargetsV29`);
  - the battle-replay target pick (engine/30).
- `cards/91` `v6DefineMultiAttacker` now defines the continuous rule (ジュラック・モノロフ, 神機王ウル keeps its "0 battle damage"
  rule). There is no trigger any more.
- New `cards/HZE_claude_s03_u149_attack_all.js`:
  - ヴァリュアブル・アーマー: the rule while Gemini Summoned;
  - E・HERO ワイルドジャギーマン: the rule; its "Fusion Summon only" is already enforced by U126.
- `tools/test_battle_cards.js` `multiAttackCase` checked the removed trigger. It now checks the rule itself, 3 checks per card as
  before: the rule is active; after one attack, only the other monster can be attacked; after all are attacked, no more attacks.
  The file keeps 170/170.

## Test — `tools/test_s03_u149_attack_all.js` 18/0 (real DUEL path, Replay-audited)
- A ジュラック・モノロフ:
  - entering the Battle Phase activates nothing;
  - it attacks ビッグ・シールド・ガードナー, which survives; attacking it again is refused;
  - it then attacks ワイト (1200 damage); afterwards no more attacks;
  - with no opponent monster: one direct attack, then no second.
- B 神機王ウル: destroys two ワイト with two attacks; the opponent takes 0 battle damage.
- C ヴァリュアブル・アーマー: as a Normal Monster one attack only; Gemini Summoned it attacks both monsters.
- D E・HERO ワイルドジャギーマン: attacks all three monsters (3 × 2300), then nothing more.
- Negative control on U148 (`dist/battle.html` + this test): 7 FAIL, 0 errors.
  - On U148 the grant was put on the chain.
  - The second attack was refused with "このモンスターは攻撃宣言できません".

## Not in this unit (recorded)
- In a battle replay, the originally declared target is still counted as attacked.
- 阿修羅, バーサーク・デッド・ドラゴン (see Why).

## Status
- NOT_STARTED → TESTED: ヴァリュアブル・アーマー, E・HERO ワイルドジャギーマン.
- ジュラック・モノロフ and 神機王ウル stay TESTED; their ability now actually works and is tested in real attacks.
- TESTED 2228 → 2230, NOT_STARTED 1249 → 1247.

## Gate
- `python tools/check.py` — `GATE_EXIT=0`, 14300 PASS lines (= U148 14282 + 18 new, exactly), 0 FAIL, no Traceback / ReferenceError
  (one caught `TypeError` stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- Pre-scan of all 368 gate tests (parallel): every exit code 0, 0 FAIL; per-file PASS / Error counts equal to U148 except the new test
  (test_battle_cards 170 → 170 after its rewrite).
- `dist/battle.html` SHA256 `1a7d4e8e1d8964b3a78832d40054143856aae7e9de9e6884a14b76716ea48695` (build output identical to the gate build);
  Acode regenerated after the gate: `dist/battle_acode.html` `24f58f01970f9bbc9f539b69e8bc03343a303a8e26c1a832b23ab715894db37e`.
- Coverage: TESTED 2230, IMPLEMENTED 94, ENGINE_GAP 607, GENERIC_OK 644, PARTIAL 174, NOT_STARTED 1247 (4996); 197 declared status
  changes, 0 off-target.
