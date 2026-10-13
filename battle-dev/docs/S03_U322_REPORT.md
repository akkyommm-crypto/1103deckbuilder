# S03-U322 — 「アルカナフォース」: III－THE EMPRESS, XIV－TEMPERANCE, EX－THE LIGHT RULER (+ engine: targeting negator unwraps entries)

Base: `claude/work` `04bd979` (U321, gate 18838 PASS / 0 FAIL). Sonnet 5.5, single writer. All three NOT_STARTED.

## Engine change (`engine/1T_targeting_negation_s03.js`)
- `applyTargetingNegatorsS03` read each chain-link target as a handle; a card whose selection is a wrapper (`{mode, t:handle}`, エネミーコントローラー) was never seen. The entries are unwrapped (a plain handle is unchanged); the existing FOOL / ミドル・シールド・ガードナー tests are unchanged (u28, u32, vs7).

## Cards (`cards/HZZZZZZJ_claude_s03_u322_arcana.js`; coin = `duelRandomInt(2)`, flag `u322Coin`)
- EMPRESS: heads → each opponent Normal Summon success: optional Special Summon of an 「アルカナフォース」 from my hand; tails → forced discard of a chosen hand card.
- TEMPERANCE: coin heads halves my battle damage, tails the opponent's (floor); the hand effect at the damage calculation (quick effect, lingering pattern of S03-U257) zeroes the damage of that battle only.
- LIGHT RULER: hand procedure (send 3 of my monsters); heads → battle kill → add a Graveyard card; tails → targeting negator (negate + destroy the source) and −1000 ATK per negation.
- Left: DARK RULER, VI－THE LOVERS, XXI－THE WORLD, アルカナ ナイトジョーカー (documented in the card file).

## Tests
- `tools/test_s03_u322_arcana.js` 23 / 0. The coin is replay-safe, so each side is reached by searching seeds (`seed = base + s·7919`; consecutive seeds give the same low bit of the generator); the winning run is asserted and Replay-audited. Negative control on the previous build: crashes at the first assertion (the cards have no scripts). Coverage TESTED 3003 → 3006, NOT_STARTED 844 → 841; audit 0 off-target.
- Authoring notes: `doNormalSummon(i, pos)` takes the hand index of the active player; set every fixture before `baselineA()` (a later edit breaks the Replay audit).
