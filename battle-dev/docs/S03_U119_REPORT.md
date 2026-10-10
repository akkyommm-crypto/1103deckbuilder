# S03-U119 — デュアル (Gemini): もう1度召喚 as a Normal Summon + 6 Gemini monsters

## Why
Fresh cross-reference of the 13 major deck lists against U118 coverage: E・HERO アナザー・ネオス (hero x3) was
NOT_STARTED. The engine had only the `dualUp` flag (set by フォース・リリース) and `treatedAsNormal()`; a player could
not Gemini Summon at all. Of the 26 Gemini monsters in the 2011 pool, 24 were NOT_STARTED and マジック・スライム was
ENGINE_GAP ("デュアル（再度召喚で効果を得る）の機構が無い").

## Capability (`engine/1ZI_gemini_s03.js`)
- Legal zone action **もう1度召喚（デュアル）** for a face-up Gemini monster in the player's own Monster Zone that is not
  yet Gemini-Summoned: own Main Phase, Normal Summon still available, no summon lock, nothing in progress.
- It is a Normal Summon: `NORMAL_SUMMON_ATTEMPT` uses the turn's Normal Summon, then the normal summon window opens
  (`kind:'normal'`, `geminiS03:true`) — every negator that answers a Normal Summon answers it (神の宣告, 神の警告, …).
  - commit → journaled `GEMINI_SUMMON_S03` (dualUp, summonedTurn) + `onNormalSummon {geminiS03}` (奈落の落とし穴 etc.).
  - negated → the monster is destroyed (`FX_TO_GRAVE byDestroy`).
  - `runSummonWindowResumeS03` dispatches `geminiS03` windows (SaveLoad / Undo resume keep working).
- `dualUp` is zone-local (already in ZONE_LOCAL_KEYS) and now also cleared when the card is turned face-down.
- `geminiActiveS03(card)` = Gemini + dualUp + face-up in a Monster Zone.

## Cards (`cards/HO_claude_s03_u119_gemini.js`)
`defineGeminiS03(name, spec)` gates condition, passive trigger checks, continuous hooks and attackLimit on
`geminiActiveS03`. While not Gemini-Summoned (or in the GY) the card is a Normal Monster with no effect.
- E・HERO アナザー・ネオス — name treated as 「E・HERO ネオス」 in the Monster Zone (continuous `nameOverride`).
- チューンド・マジシャン — treated as a Tuner (`tunerOverride`).
- 灼熱王パイロン — once per turn, Main Phase: 1000 damage.
- ヘルカイザー・ドラゴン — two attacks per Battle Phase.
- デュアル・ランサー — piercing damage.
- 幸運の笛吹き — destroys an opponent's monster by battle and sends it to the GY → draw 1 (mandatory).

## Test — `tools/test_s03_u119_gemini.js` 34/0 (real DUEL path, Replay-audited)
- A アナザー・ネオス: offered as a legal action; after it: dualUp, Normal Summon used, Effect Monster, name
  E・HERO ネオス, summoned this turn, no second one; SaveLoad keeps it; face-down loses it.
- B refused after a Normal Summon, in the Battle Phase, while face-down; not offered for a non-Gemini monster.
- C 神の宣告 in the summon window → the monster is destroyed, 4000 LP paid, the Normal Summon stays used.
- D 奈落の落とし穴 reacts to the successful もう1度召喚 and banishes it.
- E パイロン (refused before; 1000 damage after; once per turn), ヘルカイザー (1 → 2 attacks), チューンド (Tuner).
- F デュアル・ランサー piercing 1600 only after; 幸運の笛吹き draws only after (real attacks).
- Negative control on the U118 build: every section fails (the capability does not exist there).
- Related tests re-run (デュアルスパーク, ヒーロー・ブラスト, destruction protection, scheduler, summon timing, U111, U117,
  U118): 0 FAIL.

## Status
- 6 cards NOT_STARTED → TESTED. TESTED 2170 → 2176, NOT_STARTED 1284 → 1278.
- Remaining Gemini cards (18) now only need their own effects; マジック・スライム still needs battle-damage redirection.

## First gate
- FAILED at `test_s03_u08_journaled_flags.js` (lint: "card scripts write no card-state field directly"): the wrapper's
  spec variable `s.attackLimit = …` matched the card-state pattern (`attackLimit` is also a card field). Not card state —
  renamed the spec object to `desc` (the lint's accepted spec name). No behavior change; Gemini test 34/0 again.

## Gate
- Second run: `python tools/check.py` — `GATE_EXIT=0`, 13782 PASS lines, 0 FAIL, no Traceback (one caught `TypeError`
  stack from `test_auto_cycle32.js` = recorded noise); last line "PASS no duplicate top-level function declarations".
- `dist/battle.html` SHA256 `bb01acd7f4b9532af0a65a20dcd4b51a38237f9c2cf5ab3b575568ff0f74c06a`; Acode not regenerated
  (`dist/battle_acode.html` `c0bfdbba…`).
- Coverage: TESTED 2176, IMPLEMENTED 117, ENGINE_GAP 609, GENERIC_OK 644, PARTIAL 172, NOT_STARTED 1278 (4996);
  131 declared status changes, 0 off-target.
