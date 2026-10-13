# S03-U314 — Union Monsters, part 2: ヴァイロン・テセラクト, ヴァイロン・ペンタクロ, バスター・ショットマン, デス・デンドル, 氷岩魔獣, 灼岩魔獣

Base: `claude/work` `bc71424` (U313, gate 18567 PASS / 0 FAIL). Sonnet 5.5, single writer. On `declareUnionS03` (S03-U313); no engine change. All six were NOT_STARTED.

## Cards (`cards/HZZZZZZB_claude_s03_u314_union2.js`)
- ヴァイロン・テセラクト: host a 「ヴァイロン」 monster; battle kill → optional, targeted: a Level 4 or lower 「ヴァイロン」 from my GY is Special Summoned. Substitute: every destruction.
- ヴァイロン・ペンタクロ: same host; battle kill → optional, targeted: destroy 1 card on the opponent's field. Substitute: every destruction.
- バスター・ショットマン: any monster of mine, ATK / DEF −500; battle kill → every face-up monster of the destroyed monster's Race on the field is destroyed (either player's, the equipped monster included). Substitute: every destruction.
- デス・デンドル: host ブラッド・オーキス; every battle kill → a 魔草トークン (Plant / EARTH / Lv1 / 800/800, `API.createToken`). Substitute: by battle only.
- 氷岩魔獣 / 灼岩魔獣: hosts of each other; the equipped monster inflicts battle damage on the opponent → destroy 1 face-down / face-up Spell or Trap card on the field (Field Zone included); the card is chosen on resolution. Substitute: by battle only.

## Tests
- `tools/test_s03_u314_union2.js` 58 / 0: each card's equip / stats / once per turn / release on a really passed turn; the substitute scope (effect destruction: substituted for the 'any' cards, not for the 'battle' ones); every battle trigger; Replay audits. Negative control on the previous build: 27 FAIL. Coverage TESTED 2964 → 2970, NOT_STARTED 883 → 877; audit 0 off-target.
- Coverage-tool note: `tools/script_coverage.py` finds helper-based registrations only through helpers discovered inside the same file; a wrapper around `declareUnionS03` placed in a later file is not seen. The two rock beasts are therefore declared with literal `declareUnionS03('…')` calls and a plain factory for the shared effect.

## Not done / recorded
- セコンド・ゴブリン, 守護霊アイリン: 「装備モンスターの表示形式を1ターンに1度だけ変更する事ができる」 — the host (ジャイアント・オーク / 不屈闘士レイレイ) has its own position lock that this grants an allowance against; needs a per-turn override of `cannotChangePosition`.
- メタル化寄生生物－ルナタイト: 「装備モンスターは相手がコントロールする魔法の効果を受けなくなる」 — needs the Spell-immunity layer for an equipped monster (S03-U115 covers the card itself).
- RULING_UNRESOLVED (6 cards): W－ウィング・カタパルト, Y－ドラゴン・ヘッド, Z－メタル・キャタピラー, アーマード・サイバーン, マシンナーズ・ピースキーパー, 強化支援メカ・ヘビーウェポン (and マシンナーズ・ギアフレーム, PARTIAL) — the project carddata holds the modern 「①:」 wording (substitute for battle AND effect, 「特殊召喚する」 with no position, targeting equip); the 2011 classic wording and its substitute scope could not be confirmed, so they are not promoted.
