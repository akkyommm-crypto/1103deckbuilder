# S03-U348 — revival Continuous Traps ×4

Base: `claude/work` `c6d24c0` (U347, gate 19695 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZJ_claude_s03_u348_revive_traps.js`)
- `u348Revive(name, o)` builds the Continuous Trap: an ACTIVATE effect (target in the Graveyard, optional cost, `API.specialSummon … 'atk'`, `API.linkOnLeave(revived, self, 'destroy')` = the trap leaves → the monster is destroyed, `API.linkOnLeave(self, revived, 'none')` = the watch) plus a forced trigger on the partner's leave events that destroys the trap — `onDestroy` only (「破壊された時」) or `onDestroy / onLeaveField / onSendToGrave / onRemove` (`anyLeave`, 「フィールドから離れた時」).
- アマゾネスの意地: the revived monster gets a card flag read by the trap's continuous `cannotChangePosition` and `mustAttack`. ウィキッド・リボーン: 800 LP as the cost; `API.negateEffectUntil(…, 'permanent')` and the card flag `cannotAttackTurn` for that turn. コアの再練成: the partner-destroyed trigger also deals the monster's ATK to me when it happens in my own End Phase. サイコ・チューン: `API.setTuner`, and a Graveyard trigger on the trap (「墓地へ送られた時」, from the Spell & Trap Zone) dealing Level × 400 — the Level is kept in a persistent player flag `u348Psy` because card flags end when the trap leaves the field.
- Engine lesson (documented in CLAUDE_RESUME): a destruction made by `linkOnLeave(…, 'destroy')` queues no events, so the trap's own 「墓地へ送られた時」 trigger did not fire when the monster left first; the trap is therefore destroyed by a trigger (an event-dispatching `API.destroy`) in this unit.
- Not part of this unit: the one-shot event Traps (ヘル・ポリマー, 調律師の陰謀, 痛恨の訴え, 栄誉の贄, 破壊輪), 融合回収, 賢者の聖杯.

## Tests
- `tools/test_s03_u348_revive_traps.js` 26 / 0. Negative control on the previous build: 14 FAIL. Coverage TESTED 3145 → 3149, NOT_STARTED 705 → 701; `registration_names_missing_from_db` empty; audit 0 off-target. Pre-scan: no other test names these cards.
- Authoring notes: `toOppBattle()` passes through my own End Phase — an upkeep monster (コアキメイル) needs a 鋼核 in the hand for the test to isolate the battle case; a Synchro Monster fixture in the Graveyard needs `properlySummonedS03 = true`.
