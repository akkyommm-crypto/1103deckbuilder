# S03-U118 — field Trap negation model (王宮のお触れ / トラップ・スタン / 人造人間－サイコ・ショッカー)

## Why
Next qty=2 card トラップ・スタン. Measured on U117:
1. A Trap already on the chain was **not negated** when it resolved after トラップ・スタン / 王宮のお触れ had started
   applying (砂塵の大竜巻 chain 1, トラップ・スタン chain 2 → 砂塵 still destroyed its target). `trapNegated` /
   `trapStunned` were read only by the activation legality check, the response list and two restriction helpers.
2. Continuous effects of negated Traps **kept applying**: グラヴィティ・バインド under サイコ・ショッカー / トラップ・スタン,
   スキルドレイン under 王宮のお触れ (`continuousSources` / `effectNegated` never filtered negated Trap sources).
3. Activating a Trap under 王宮のお触れ / トラップ・スタン was **refused** ("この罠カードの効果は現在無効です"). By rule only
   the effect of a field Trap is negated: the activation is legal, its cost is paid, and it is negated when it resolves.
4. 人造人間－サイコ・ショッカー was ENGINE_GAP ("Needs central continuous Trap activation prohibition and Trap-effect
   negation enforced across legality, Chain construction, resolution, UI, AI, save and replay").

## Model (`engine/1ZH_trap_negation_s03.js`)
- Negation: continuous `negateTrap(card, self)` (王宮のお触れ, サイコ・ショッカー) or the トラップ・スタン turn flag, for
  Trap cards in the Spell & Trap Zone.
  - Resolution: `resolveOnePreparedLinkV27` treats a Trap link from the Spell & Trap Zone whose card is negated at that
    moment as effect-negated (log 「フィールドの罠カードの効果が無効化されている」).
  - Continuous: `continuousSources` drops negated Trap sources (`trapSourcesFilterS03`: first the トラップ・スタン flag
    and Spell/Trap negators, then non-negated monster negators such as サイコ・ショッカー); `effectNegated` and the
    クリスティア replacement check use the same filtered set. No recursion (negateTrap functions are called directly).
  - スキルドレイン that already applies negates サイコ・ショッカー, so サイコ・ショッカー does not negate it.
- Prohibition: continuous `forbidTrapActivation(card, self, p)` (サイコ・ショッカー only), checked in
  `strictScriptLegalityV2` (all activation paths, UI legal actions) and the chain-response list.
- `cards/HN_claude_s03_u118_jinzo.js`: サイコ・ショッカー = negateTrap + forbidTrapActivation.

## Test — `tools/test_s03_u118_trap_negation.js` 32/0 (real DUEL path, Replay-audited)
- A トラップ・スタン chained to 砂塵の大竜巻 → 砂塵 negated, target survives, reason logged.
- B 王宮のお触れ chained to 砂塵の大竜巻 → the same; お触れ stays face-up.
- C order: 砂塵 chained after トラップ・スタン resolves first → not negated.
- D under 王宮のお触れ / after トラップ・スタン: サンダー・ブレイク is legal, its discard cost is paid, its effect negated.
- E サイコ・ショッカー: neither player can activate a Trap (reason), a forced attempt does nothing; an already-applying
  スキルドレイン negates it; face-down it does nothing.
- F サイコ・ショッカー revived by リビングデッドの呼び声 in response → the サンダー・ブレイク below resolves negated.
- G continuous: グラヴィティ・バインド negated by サイコ・ショッカー (it attacks directly for 2400); スキルドレイン
  negated by 王宮のお触れ (control without it); トラップ・スタン turns グラヴィティ・バインド off for that turn only.
- Negative control on the U117 build: A, B, D, E, F, G fail (C passes on both, as it should).
- Related tests re-run on the U118 build (19 files naming these cards / helpers): 0 FAIL.
- `test_v660_batch18.js`: サイコ・ショッカー moved from its ENGINE_GAP list to `trapNegationUnlockedU118` (repository
  convention, as in U115).

## Status
- トラップ・スタン, 王宮のお触れ IMPLEMENTED → TESTED; 人造人間－サイコ・ショッカー ENGINE_GAP → TESTED (override removed).
- TESTED 2167 → 2170, IMPLEMENTED 119 → 117, ENGINE_GAP 610 → 609.

## Not changed / deferred
- Two 王宮のお触れ negate each other (both stop applying); not verified against a ruling.
- トラップ・スタン excludes every card named トラップ・スタン (text: "このカード以外"); a second one is not negated (same
  effect, no practical difference).
- Trap monsters (in the Monster Zone) are not treated as field Trap cards here.
