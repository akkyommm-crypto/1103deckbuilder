# Codex handoff — verified U479–U481 plus U482 candidate

Updated: 2026-10-30 JST. Base: `7f4b2dc9b1f86dc7bf1d6d653da8410d1ee3eb90`. Verified local U479–U481 commit: `06065e44038157595e64d04d8a75ca92ee92bf91` on `codex/battle-u479-p11`; it is a descendant of the clean Claude tip and has not been pushed.

## Verified U479–U481

- U479: central P1.1 effect-source propagation without inferring target count; Gusta uses the central targeting route; missing target flags fixed for 幻惑の巻物 and 異次元への隙間.
- U480: generic JSON-safe dynamic target-count contract and chain scalar; Kaiku `[1,2]`, Goldd `[0,2]`; the count chosen at activation remains authoritative after target loss.
- U481: Airman fixes only mode at activation and makes a required non-targeting Spell/Trap choice at resolution; Dustshoot reveals and makes its non-targeting monster choice at resolution. Both use registered Save/Load-safe handlers.

Dedicated results before their candidate gate: U479 13/0, U480 28/0, U481 23/0. U480 fails 21 assertions against the untouched pre-change artifact. U481 mutations detect optional-zero and accidental targeting. Exact commit `06065e44` passed its serial gate with **23959 PASS / 0 FAIL / GATE_EXIT=0**; log `C:\Users\81806\AppData\Local\Temp\1103_gate_20261029_065415.log`. Root and Acode artifacts were synchronized. It was not pushed because remote authorization was pending.

## U482 common engine fix

Prepared-chain resolution now hydrates both detached raw event-card clones and UID-only descriptors through `restoreEventRefsV27` at `preparedChainContext`, without mutating stored snapshots. Missing UIDs remain absent and same-name cards are never substituted.

The dedicated regression includes actual Normal Summon -> Bottomless activation -> production Save/Resume -> exact summoned UID banish -> Replay audit. The old boundary produces eight dedicated failures. Nearby U477/U481/U09/activation-event tests pass. U305 seed07 now follows the correct longer game (turn 26, journal 927); the existing Replay cadence and assertions remain, while only that measured child VM has a bounded 300-second budget. Standalone U305 passes UI-on/off identity and full Replay audit.

The final serial `finish-work.ps1 -NoPush` gate and U482 commit are pending. See `docs/S03_U482_REPORT.md`; replace this paragraph with the exact local commit/log after completion. Push remains unauthorized.

## Model routing and scope

Use Sol as implementation commander. Delegate only suitable bounded work to gpt-5.6-terra (medium), or mechanical work to Luna, with one writer at a time. Use Astra only when Sol cannot resolve a specific technical or ruling issue. The user prefers no routine intermediate PASS-count reports; report design decisions, failures/blockers, and final acceptance. These are Codex preferences and do not rewrite Claude's workflow/model rules. Token usage is unavailable (`null`).

No main integration or site publication is included. Do not run a heavy gate concurrently in the Claude tree. Review the final local U482 commit after its handoff is updated, then push only with explicit authorization and require `verify-battle` for that exact SHA.
