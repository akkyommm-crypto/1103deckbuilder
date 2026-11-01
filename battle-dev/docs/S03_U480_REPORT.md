# S03-U480 — variable target cardinality for カイクウ / ゴルド

Base: `7f4b2dc9`; candidate branch: `codex/battle-u479-p11`. This unit adopts the project interpretation approved for 1103: the number actually chosen at activation controls Metal Silver Armor. One target remains restricted; two targets receive the multi-target exception. Losing a target afterward does not change the declared count.

## Change

- Added the generic static contract `targetCountRange:[min,max]` and scalar `targetCount` normalization/validation. Zero is accepted only for an explicitly optional range whose lower bound is zero; it cannot override fixed declarations such as 貪欲な壺's five targets.
- Dynamic counts are chosen before target filtering, then the target request uses `min === max === chosen count`. The chosen scalar is validated against the script range and the selected-target length before `CHAIN_ADD`.
- `CHAIN_ADD`, the stored chain link, and `RESOLVING_LINK_S03` carry only the JSON-safe scalar count. Resolution therefore keeps the original count even if targets leave the expected zone.
- カイクウ declares `[1,2]`; ゴルド declares `[0,2]`. Neither hardcodes `targetCount:2`. ゴルド's zero option remains genuine.
- The first dedicated run exposed a real integration defect: passing raw explicit effect metadata omitted the targeting player, so Metal Silver Armor did not restrict a one-target choice. Both card paths now normalize their per-effect source with `targetEffectSourceS03(player, ...)` before requesting targets.

## Validation

- Canonical bundled-Python `tools/build.py`: exit 0; restored U480 artifact SHA-256 `bd843b80f1028937e633cfdf91f08cad1ed943f8046a5deca975d93d052aec9a`.
- New wired `tools/test_s03_u480_variable_target_count.js`: exit 0, 28 PASS / 0 FAIL. Real Kaiku and Goldd activations cover counts 0/1/2, exact target selection, Armor restriction/exception, insufficient abort, unrelated Obelisk immunity, target loss after activation, actual save/resume, Replay, JSON scalar persistence, and wrong count/selection rejection.
- Nearby compatibility: U472 104/0, U476 168/0, U125 16/0, U477 284/0, and U112 exit 0. The two older Dark World UI drivers now explicitly traverse the declared-count choice; U477 also pins restoration of the registered exact-count target choice. All exit 0.
- Negative mutations: changing Kaiku's range from `[1,2]` to `[2,2]` gives U472 exit 1 / 1 FAIL. Adding an unexpected `[1,1]` declaration to 強制脱出装置 gives U472 exit 1 / 1 FAIL. Both were restored; U472 returned to 104/0 and the artifact returned to the hash above.
- Pre-behavior negative control: replacing only `dist/battle.html` with the untouched `7f4b2dc9` artifact (on-disk SHA-256 `d02af24d51d9660e1da3c3f9c598a75465140bd6be61b05912bca6475734eca3`) makes the current dedicated test exit 1 with 21 FAIL / 7 PASS. This directly detects the absent variable-count behavior, not merely a declaration-table mutation. A canonical rebuild restored builder content SHA-256 `c7519483d6ce562c7e4a428afe8719532fa4661a4a79977cd2fb2d35952c38a4` (Windows on-disk SHA-256 `e4fca453f2dbb1f9bd7fb3cc6abeca29b27c59a1ad0a4410a8615b365505ad0d`), and U480 returned to 28/0.

## Batch completion contract

- U480 is committed only through the U479-U481 `finish-work.ps1` path, which creates the candidate commit after the serial full gate exits 0. Exact PASS count and pushed SHA are reported by that command; GitHub Actions remains required for the exact SHA before integration or publication.
