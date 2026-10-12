# S03-U316 — エーリアン: the A Counter penalty and four cards (ウォリアー, グレイ, テレパス, キッズ)

Base: `claude/work` `a7e866c` (U315, gate 18645 PASS / 0 FAIL). Sonnet 5.5, single writer. All four were NOT_STARTED; the counter capability (System v22) and the A Counter placement existed.

## Change
- P4 authority P4-v10 → P4-v11: `GROUP.ALIEN` (「エーリアン」と名のついた = names containing エーリアン, 16 cards). The setcode 0x102e (26 cards) is a larger set (宇宙獣ガンギル, 円盤ムスキー, …), so it is not used. Counts: predicate 42, authority 581, overlay 435, membership 603 (`test_p4_setcode_authority.js` pins updated).
- `cards/HZZZZZZD_claude_s03_u316_alien.js`: the common clause (「Aカウンターが乗ったモンスターは、「エーリアン」と名のついたモンスターと戦闘を行う場合、ダメージ計算時のみAカウンター1つにつき攻撃力・守備力が300ポイントダウンする」) as a continuous modifier of the face-up Alien card: a monster with A Counters whose battle opponent is a GROUP.ALIEN monster, while the Damage Step is open. Each face-up copy applies its own penalty (they add up).
  - ウォリアー: destroyed by battle → 2 A Counters on the destroyer (read from `gameState.lastBattle`).
  - グレイ: Flip → 1 A Counter on a chosen opponent monster (targeted); once flipped (card flag) and destroyed by battle → draw 1.
  - テレパス: once per turn, cost: remove 1 A Counter from an opponent monster; destroy 1 Spell / Trap card on the field (target after the cost).
  - キッズ: every monster Special Summoned onto the opponent's field gets 1 A Counter (forced trigger; `onOtherSummon:true`, because monster scripts otherwise react only to their own summon); its penalty has no 「ダメージ計算時のみ」 and is applied from the start of the battle (the same window).

## Tests
- `tools/test_s03_u316_alien.js` 25 / 0 (the penalty for all four cards, the control without counters, only against an 「エーリアン」, only inside a battle; each card's effect; Replay audits). Negative control on the previous build: 11 FAIL. `test_p4_setcode_authority` 103 / 0. Coverage TESTED 2973 → 2977, NOT_STARTED 874 → 870; audit 0 off-target.

## Not done / recorded
- エーリアン・リベンジャー (「自分フィールド上に1体しか表側表示で存在できない」: the engine's uniqueness rule, `uniqueFaceUpS03`, is field-wide and message-fixed to 地縛神), 宇宙獣ガンギル (the one-Tribute rule for opponent-owned Tributes), エーリアン・スカル (procedure onto the opponent's field), エーリアン・ヒュプノ / 洗脳光線 (control while counters remain), エーリアン・マザー / ブレイン, 宇宙砦ゴルガー. A pre-existing helper, `v22IsAlien`, uses the setcode (a superset) for 「エーリアン」; not touched here.
