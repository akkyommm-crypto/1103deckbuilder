# CODEX-C11 — Continuous Trap chain candidates

Base: uncommitted CODEX-C10 on `codex/phase-priority`. The existing C10 work was preserved and its focused tests were rerun.

## Reported symptom

In the same response window, `強制脱出装置` was available but `スキルドレイン` was absent.

## Cause and fix

- The response-list builder rejected every script without a one-shot `resolve()` function, although the shared legality engine already supports Spell/Trap scripts whose behavior is purely `continuous`.
- `スキルドレイン` was exactly that shape, so it was removed before legality was evaluated.
- Continuous Spell/Trap card activations are now admitted to the response list and then pass through the normal Spell Speed, set-turn, activation-lock, and card-specific legality checks.
- `スキルドレイン` now declares its real activation contract: more than 1000 LP is required, 1000 LP is paid as a cost, and the activation has a no-op resolution before its continuous negation applies.

## Validation

- Negative control on the pre-fix generated build offered only `強制脱出装置`; direct activation also paid no LP.
- `tools/test_codex_c11_continuous_trap_chain.js` checks both cards in one response window, chain-link creation, the 1000 LP cost, resolved continuous negation, the exactly-1000-LP negative case, a continuous-only script without `resolve()`, and Replay digest equality.
- Nearby Safe Zone, Trap negation, continuous-card activation Replay, attack-declaration window, and CODEX-C10 phase-priority suites pass.
- The full repository gate is run before commit.
