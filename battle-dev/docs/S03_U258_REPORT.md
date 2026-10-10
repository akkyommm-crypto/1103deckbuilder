# S03-U258 — NOT_STARTED 7 (パルキオンのうろこ, ナチュル・ナーブ, ナチュル・サンフラワー, 暗黒の眠りを誘うルシファー, ソードハンター, 霞の谷の雷鳥, 地獄からの使い)

## Workflow (mixed, fresh Sonnet subagent)
- A fresh Sonnet subagent ran `brief258.md` and finished all seven cards: 53/0 on its first hand-back, with no engine change. Its negative control gave 21 FAIL and no crash.
- The brief now carries the lessons of U254:
  - unique top-level helper names (all suffixed and checked);
  - no new GY-source continuous effects: パルキオンのうろこ uses the S03-U257 lingering source;
  - report any forced-as-optional effect (none).
- `test_grave_continuous_v29`, `test_s03_u210_ns3`, `test_s03_u257_linger` and `test_s03_u252_ns33` stay at 0 FAIL.
- The main session reviewed the code and rulings and did the declarations, this report and the gate.
  - ルシファー stores its link in the zone-local key `stLinkTargetS03`. That key is only ever read by each card's own script through `self` (デモンズ・チェーン, 化石発掘), so sharing it is safe.
- Measured: subagent 237,806 tokens, 77 tool uses, 628 s. No parent-side correction.

## Cards → TESTED (2011 texts) — cards/HZZZZL_claude_s03_u258_ns35.js

| Card | Effect / reuse |
|---|---|
| パルキオンのうろこ | with a face-up 「ナチュル」: the opponent cannot activate Trap cards this turn (lingering source + `forbidTrapActivation`) |
| ナチュル・ナーブ | the opponent's Spell / Trap activation: release another 「ナチュル」 + itself → negate and destroy (declared chain response) |
| ナチュル・サンフラワー | the same against the opponent's monster effect |
| 暗黒の眠りを誘うルシファー | Normal / Flip Summon (forced): the selected opponent monster cannot attack while it is face-up |
| ソードハンター | end of a Battle Phase in which it destroyed monsters by battle: equip them from the GY, +200 ATK each |
| 霞の谷の雷鳥 | returned from the field to the hand face-up: special summon it (forced); it cannot attack that turn |
| 地獄からの使い | cannot be Special Summoned; 1-Tribute Summon as Level 5 with original ATK / DEF halved (System v23 `baseStats` + `continuous.setLevel`) |

Rulings chosen and reviewed:
- ルシファー may select any opponent monster, including a face-down one.
- ソードハンター equips as many as fit in the Spell & Trap Zone.
- 雷鳥 comes back in Attack Position.
- 地獄からの使い has no 1-Tribute Set, because the text says 「召喚」.

## Tests
`tools/test_s03_u258_ns35.js` passes 53/0, on real DUEL paths and Replay-audited.

Negative control on U257: 21 FAIL.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **16693 PASS / 0 FAIL** (= U257 16640 + 53 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U257.
- Coverage: TESTED 2798, ENGINE_GAP 566, NOT_STARTED 955, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 759 declared, 0 off-target.
