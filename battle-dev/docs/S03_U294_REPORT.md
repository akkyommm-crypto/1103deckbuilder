# S03-U294 — 「破壊した数」「破壊した場合」: what the effect actually destroyed, after the substitute decisions

## Workflow
- opus-only engine unit (workflow v3). Profile `delegation-expanded-v3-batch3`.
- Built on S03-U293 (rebased onto the Sonnet unit S03-U292 before the gate).
- An open engine item (recorded since S03-U284): a destruction count read right after `API.destroy` can miss a destruction deferred by an optional substitute (S03-U173 limit).
- A scan of the scripts that use the result of their own destruction found more defects in TESTED cards:
  - Counts taken before the destruction: a card that is not destroyed (「カードの効果では破壊されない」) was counted. Affected: サンダー・クラッシュ, グリフォンの羽根帚, 地縛神 Aslla piscu, 天刑王 ブラック・ハイランダー.
  - 光帝クライス counted only cards found in the GY, so a destroyed 宝玉獣 placed in the Spell & Trap Zone did not count.
  - インフェルニティ・デス・ドラゴン used the printed ATK instead of the destroyed monster's ATK on the field.

## Engine — engine/1ZZO (new), engine/1ZV, engine/40 API
- `API.destroyMarkS03()` / `API.destroyedSinceS03(mark, uids)`: the uids destroyed since the mark, read from this turn's destruction log (engine/1M).
  - The log holds every destruction (effect, mass destruction, battle).
  - A 宝玉獣 placed instead of the GY counts as destroyed.
- `API.afterDestroyS03(handler, args)` with `registerDestroyAfterS03(name, fn)`:
  - It runs the continuation now when nothing is deferred.
  - Otherwise it runs after the substitute decisions and the deferred destructions, in the same chain link, with the resolution's P3 player restored.
  - The continuation is part of the saved decision job (JSON), so a save made during the decision resumes it.
- Shared continuation `s03u294.if-destroyed-lp`: 「破壊し、破壊したモンスターの…分」 damage or LP gain, only if the card was destroyed.

## Scripts converted (all keep their existing tests passing)
- サンダー・クラッシュ, グリフォンの羽根帚, デストラクト・ポーション.
- 大波小波 (S03-U288), 地縛神の咆哮, インフェルニティ・デス・ドラゴン (now uses the ATK on the field).
- ワンショット・キャノン, A・ジェネクス・ボルキャノン, 光帝クライス, 天刑王 ブラック・ハイランダー, 地縛神 Aslla piscu, 壺魔人.

Open ruling: インフェルニティ・デス・ドラゴン on a face-down monster deals 0 damage, unchanged; whether it should use the printed ATK is not confirmed for 2011.

## Tests
`tools/test_s03_u294_destroy_after.js` passes 13/0, Replay-audited.

| Case | Situation | Result |
|---|---|---|
| T1 | サンダー・クラッシュ with M・HERO ヴェイパー | 300 (was 600) |
| T2 | グリフォンの羽根帚, 2 cards | 1000 |
| W1 | 大波小波 with a 宝玉獣 エメラルド・タートル placement decision and ヴェイパー | The continuation waits in the saved job; 1 destroyed → 1 summoned |
| W2 | Placement declined | Same count |
| W3 | Only ヴェイパー | No summon |
| K1 | 光帝クライス destroys a 宝玉獣 placed in the Spell & Trap Zone | The opponent draws 1 |

The existing tests of every converted script pass unchanged: v500, v620, v670, auto_cycle56, U139, U189, U230, U241, U243, U284, U288 and v460.

Negative control on U293: 5 FAIL (no crash).

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **18053 PASS / 0 FAIL** (= U293 18040 + 13 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U293.
- Coverage: TESTED 2926, ENGINE_GAP 472, NOT_STARTED 921, IMPLEMENTED 3, GENERIC_OK 644, PARTIAL 30 (4996); audit 888 declared, 0 off-target.
- Published in the batched checkpoint S03-U292–U295.
