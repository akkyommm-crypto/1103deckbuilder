/* S03-U75: preventive fix for the same bug class S03-U74 found and fixed in battleProof()
   (engine/00_state_actions.js) — found via priority #6 (same bug class, unaudited area) after U74's own
   battleProof() fix. Audited every other name-keyed cache in the engine (TARGET_IMMUNE_CACHE,
   BATTLE_PROOF_CACHE already fixed, MAT_SPEC_CACHE, ACT_ZONE_CACHE, FIELD_ACT_CACHE) for the exact same
   architectural shape: a dynamic continuous.* check that can return false for the CURRENT state, followed by
   an unconditional fallback to a per-card-NAME cache populated by a blind regex match against the card's raw
   OCG text (which, for a *conditional* clause, still contains the trigger phrase unconditionally as part of
   describing the condition).
   Found the exact same shape in `targetImmune()` (TARGET_IMMUNE_CACHE): if a card's own script ever declares
   `continuous.immuneToTarget` as a function and that function returns false for the current state, the
   function fell through past that authoritative dynamic answer into the same cache/regex-poisoning trap.
   No currently-declared card in this codebase happens to combine a self-scoped conditional
   continuous.immuneToTarget with matching raw text (the three/four existing declarations are all
   scope:'allMonsters', protecting OTHER cards, not themselves) — so this was not yet a LIVE bug the way
   battleProof's was, but it is the identical latent trap, fixed here preventively before any future card hits
   it. MAT_SPEC_CACHE / ACT_ZONE_CACHE / FIELD_ACT_CACHE were audited and confirmed NOT vulnerable: none of
   them ever fall through to their cache while a script exists (hasFieldActivatableEffect, in particular,
   always returns from inside its own `if(sc){...}` branch), so they have no analogous live-state-dependent
   poisoning path.
   This test exercises the real, production targetImmune() function directly (not a synthetic reimplementation
   of the check) against a directly-poisoned cache entry, since no real declared card in this codebase
   currently has the vulnerable shape to exercise it against organically. */
const harness=require('./astra_harness');
harness(String.raw`
resetA();
/* Directly poison the cache the way a blind regex match against a conditional clause's raw text would —
   simulating the exact scenario S03-U74 found live for battleProof() (a card's own text unconditionally
   contains the trigger phrase even though the clause itself is conditional). */
TARGET_IMMUNE_CACHE.set('カラクリ守衛 参壱参', true);
const saizan=mk('カラクリ守衛 参壱参',0);
/* Temporarily declare a self-scoped, conditional continuous.immuneToTarget on this real, already-TESTED
   card's own script object, purely to exercise targetImmune()'s real dispatch path (this is not a real
   implementation of any actual immuneToTarget clause on this card — カラクリ守衛 参壱参's own real text has
   no such clause; this is a synthetic regression fixture for this engine fix only). */
CARD_SCRIPTS['カラクリ守衛 参壱参'].continuous.immuneToTarget = function(card){ return false; };
gameState.players[0].mz=[saizan];
baselineA();
ok('S03-U75: targetImmune() trusts a real self-declared continuous.immuneToTarget dynamic answer (false) instead of the poisoned per-name cache (which was set to true, simulating the exact scenario the shared battleProof() bug exhibited for real)',
  targetImmune(saizan)===false,
  JSON.stringify({cached:TARGET_IMMUNE_CACHE.get('カラクリ守衛 参壱参'),real:targetImmune(saizan)}));
`);
