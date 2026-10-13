# S03-U313 — Union Monsters: the common mechanism and the first nine (ドイツ, コイツ, 騎竜, 漆黒の闘龍, ゾンビタイガー, アーマー・ブレイカー, トライゴン, オイルメン, 六武衆の御霊代)

Base: `claude/work` `903d52c` (U312, gate 18477 PASS / 0 FAIL). Sonnet 5.5, single writer. Requirement: 25 Union Monsters (24 NOT_STARTED + マシンナーズ・ギアフレーム PARTIAL), none implemented. The monster-as-Equip engine (v46: `API.equipMonster` / `API.unequip`, アームズ・エイド) existed; the Union rules were missing.

## Mechanism — `declareUnionS03(name, spec)` (cards/HZZZZZZ_claude_s03_u313_union.js)
- Once per turn, either way (card flag `unionTurnS03`, as アームズ・エイド): equip itself from the Monster Zone to a valid host, or — in the Spell & Trap Zone — release the equip and Special Summon itself in face-up Attack Position (the text says 表側攻撃表示).
- The host is chosen on RESOLUTION (the classic text does not target); valid = a face-up monster of mine, not the Union, matching the card's host rule, and carrying no other Union (「1体のモンスターが装備できるユニオンは1枚まで」).
- Stat bonus (continuous from the Spell & Trap Zone) and the card's own effects only while equipped. Battle triggers of the equipped monster: the Damage Step `leave` record (the destroyed monster) and the battle damage event, as forced triggers of the Union card.
- The substitute: engine/1ZZB `equipSubstituteS03` gained the value `'battle'` (S03-U313: only a destruction by battle — BATTLE_CLEANUP passes `via='battle'`; `true` stays "every destruction"). Each card's own wording decides: 戦闘によって破壊される場合 (ドイツ, コイツ, 騎竜, 漆黒の闘龍, ゾンビタイガー, アーマー・ブレイカー) vs 破壊される場合 (トライゴン, オイルメン, 六武衆の御霊代).
- `timing:['free']` on these scripts: the timing is otherwise inferred from the passive hooks (an `onDamageStep` passive means "Damage Step only") and refused the Main Phase ignitions. (アームズ・エイド has the same passive without a `timing`; not changed here.)

## Cards
ドイツ (ソイツ +2500) · コイツ (アイツ +3000, piercing) · 騎竜 (ダークソード +900/+900; release the equipped card → the host attacks directly) · 漆黒の闘龍 (ダークソード +400/+400, piercing) · ゾンビタイガー (朽ち果てた武将 +500/+500, discard at random per battle kill) · アーマー・ブレイカー (Warrior, battle damage → destroy 1 card on the field) · トライゴン (Machine, battle kill → Special Summon a LIGHT Machine Lv≤4 from my GY) · オイルメン (Machine, battle kill → draw 1) · 六武衆の御霊代 (「六武衆」 +500/+500, battle kill → draw 1).

## Tests
- `tools/test_s03_u313_union.js` 90 / 0: for each of the nine — the effect offered in the Monster Zone, host choice (an invalid monster is not equipped), stats, once per turn, the release on the next (really passed) turn with the host's stats back; one Union per monster; the host rule (name / race / group, own monsters only); the substitute by battle and by effect, both modes; piercing; the Tribute direct attack; every battle-kill / battle-damage trigger; Replay audits. Negative control on the previous build: 45 FAIL. Related tests unchanged: `test_s03_u173` 37, `u183` 17, `u268` 8, `u311` 33, `u312` 41.
- Coverage: TESTED 2955 → 2964, NOT_STARTED 892 → 883; audit 0 off-target.
- Test notes: new turns are stepped through DRAW → standby → Main Phase (`requestProcessorV27(DRAW)`), because the processor does not jump from the draw phase; the turn counter is never edited after the baseline (the Replay would diverge).

## Not done (U314)
- The other Unions: ヴァイロン・テセラクト / ペンタクロ, バスター・ショットマン, デス・デンドル, 氷岩魔獣 / 灼岩魔獣, セコンド・ゴブリン / 守護霊アイリン (the host's position-change allowance), メタル化寄生生物－ルナタイト (immunity to the opponent's Spells), and the 「①」-wording Unions (W－ウィング・カタパルト, Y－ドラゴン・ヘッド, Z－メタル・キャタピラー, アーマード・サイバーン, マシンナーズ・ピースキーパー, 強化支援メカ・ヘビーウェポン; マシンナーズ・ギアフレーム PARTIAL), whose equip effect targets and whose substitute covers battle and effects.
