# S03-U482 — prepared-chain event identity restoration

Base: verified local commit `06065e44038157595e64d04d8a75ca92ee92bf91` on `codex/battle-u479-p11`. U482 fixes the common resolution boundary where a prepared chain event may contain either a detached Save/Load clone (`event.card`) or only its serialized `uid`/`uids` identity.

## Change

- `preparedChainContext` now passes a fresh `restoreEventRefsV27(link.event)` view to the resolving script. Raw clone and UID-only descriptors therefore resolve against the exact current live card(s).
- The stored chain link remains JSON-safe and is never mutated by hydration. Primitive event-time provenance remains intact.
- A missing UID remains absent/null and never falls back to a same-name card.
- No card scripts or historical event snapshots were rewritten; the existing engine restoration helper is reused at the final common boundary.

## Regression evidence

- `tools/test_s03_u482_chain_event_refs.js` is wired into `tools/check.py`. It covers detached raw events, UID-only prepared events, exact UID with a same-name survivor, missing UID, two different event-card operations, a real Airman trigger, and snapshot non-mutation.
- The actual DUEL path Normal Summon -> `奈落の落とし穴` activation -> production `saveDuel`/`offerResumeDuel` -> chain resolution banishes only the summoned same-name monster and passes a full Replay digest audit.
- Reverting only the resolution hydration makes the dedicated test fail eight assertions (clone identity, UID-only hydration, missing-subject handling, Airman context, and real Bottomless resolution). Restoring the fix returns it to exit 0.
- Nearby compatibility exits 0: U477 Dark World Save/Load identity, U481 Airman/Dustshoot resolution choices, U09 trigger-offer legality, and activation-event v12.
- Coverage remains `TESTED 3589 / ENGINE_GAP 346 / GENERIC_OK 644 / IMPLEMENTED 2 / PARTIAL 10 / NOT_STARTED 405`; U482 repairs shared engine behavior rather than promoting unaudited cards.

## U305 long-duel diagnosis

The fixed seed `0x52310007` previously ended at turn 12 with 434 journal entries because the detached Bottomless event silently did nothing. Correct identity restoration makes Bottomless resolve, legally changes the game, and ends at turn 26 with 927 entries. A 300-second diagnostic completed both UI-on and UI-off runs with the same state and Replay result; this is a long duel, not a loop or recursive stall.

The driver retains its existing intermediate Replay cadence and final all-entry digest audit. The suite-wide VM default remains 120 seconds. Only this measured U305 child case receives a bounded 300-second VM budget; its seed, save/resume at every stop, UI-on/off comparison, and all assertions are unchanged. The formal standalone U305 run completed in 342915 ms with Replay `{ok:true,count:927}` in both runs and no UI exception. Truncated journals cannot pass because U305 still requires `replay.ok===true`.

## Artifacts and final gate

- Canonical build before the final gate: `dist/battle.html` SHA-256 `97a80b3f6f5542f3930a29d899426be352c635bec9f9fc0cbce49ba77461fa88`.
- Acode build before the final gate: SHA-256 `7b24b6d7362ebf58692b591a7935d0ba18336f54bad48cfc08df79f33e99a3c3`.
- The final serial `finish-work.ps1 -NoPush` gate is pending. Replace this line with the exact log, verdict, and local commit after it completes.

No push, main integration, or site publication is part of this unit.
