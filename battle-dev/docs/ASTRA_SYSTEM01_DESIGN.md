# System v31 / Astra 01 — Grave-to-Equip

Baseline probe: `tools/probe_astra01_baseline.js`, original output retained in `docs/ASTRA01_BASELINE_PROBE.txt`.
Three real requirements (Dux, The Kick Man, Truckroid) cannot pass either existing equip API from grave.
Existing v46 field conversion succeeds, but emits no equip event. After control transfer, `equipTo.p` is stale and the public host query returns null. After host face-down, the equipment incorrectly stays in sz. These were measured before changes.

## Minimal extension

- Add `API.equipFromGrave(player, equipment, host, reason, sourceUid, chainId)` and one UID-addressed movement Action `FX_EQUIP_FROM_GRAVE_V31`. The resolving context supplies chainId explicitly; the already-popped chain top is not guessed.
- Reuse `equipUid`, `equipTo {p,uid,sourceUid?}`, `equippedBy`, `v46MonsterEquip`, v15 equip legality/scope and existing JSON journal/digest. The optional sourceUid distinguishes the effect that created an attachment. No second equipment registry or card-name-specific state.
- Accept only a monster or Equip Spell in a graveyard; host must be face-up mz and equipment must satisfy its existing equipSpec. Validate source player, all UIDs and destination capacity before removing anything. Equip placement is not Spell activation and is not a Special Summon.
- Card selection/trigger/cost belongs to cards. The action validates the structural move; card-specific target eligibility is rechecked by each resolving script.
- Retain owner, set controller to the equipment player, clear old zone-local state; link both ends and emit a JSON attachment event with uid/equipUid, player, targetPlayer, owner, controller, fromPlayer, from, sourceUid, byPlayer, reason, turn, chainId. No fabricated summonType: this is not a summon.
- Fix link lifecycle at the same action boundary: follow host UID across control transfer, discard orphan/face-down-host equipment by rule, remove reverse references after equipment leaves, and clear equipment-only fields on zone departure. Queries remain read-only. Negating a source suspends its continuous effect without deleting the attachment.
- Reuse current public grave/field information only. No access to private decks/hands and no hidden-zone representation change.

## Validation / limits

Engine-only tests precede card recovery and Full Gate. Verify atomically rejected moves, wrong source/target zone, full sz, stale UID, EquipSpec rejection, cross-owner routing, control/face-down/removal/unequip/revive, source negation, JSON SaveLoad, Undo/Redo, every journal entry digest and Replay audit.

Do not count Levatin, Get Ride!, Brandistock or Gilfer as unlocked from placement alone. Their additional procedure/Union/attack-consumer/optional-when timing requirements need independent evidence. Historical test files remain unchanged.

## Real-path integration amendments

The initial engine-only Full Gate passed before recovery. The real normal-summon path then exposed two pre-existing integration gaps that blocked the five selected cards:

1. P1.1 commit did not invoke the legacy SEGOC `afterPrepared` callback. `eventSelectionV11` now retains UID-only group/candidate data in the existing choice descriptor. `eventChainResumeV11` retains the processor continuation when CHAIN_ADD commits; EVENT_RESUME_V11 clears it at chain end. Registry handlers and processor dispatch own continuation; no function is serialized. Save/reload tests clear all legacy callbacks and event-builder globals before resuming.
2. Queue insertion outside applyAction and processor queue removal changed the digest without a journal entry. EVENT_QUEUE_V31 / EVENT_DEQUEUE_V31 now record these transitions using the existing automatic-action path, which adds no Undo snapshot. Events emitted inside applyAction remain part of their parent action; an exception-safe depth guard prevents nested journaling. Replay applies actions without rerunning card scripts.

The added continuation field is included in the digest only when nonempty, preserving previous empty-state digests. System01 tests audit every retained journal entry plus final digest, including a deliberately corrupted sourceUid.

## Recovery scope, frozen by user

- Dux: own normal summon, legal grave Dragon/Dragunity/level condition, optional target choice, equip and continuous field-card count. Source control transfer during the chain does not change the activating player's equipment zone.
- The Kick Man: own Special Summon, legal Equip Spell, attachment without a Spell activation.
- Truckroid: mandatory, **non-targeting** battle absorption; no activation on mutual destruction; full S/T zone still produces the mandatory effect and prevents only placement. The consumed monster UID is event data, not a target. ATK gain is limited to cards attached by this source.
- Chopman: Flip Summon only, excluding battle flips.
- Legionnaire: normal-summon attachment and separate ignition send-cost/face-up opponent target/destruction branch; no invented once-per-turn limit. Branch categories separate equip from destroy.

Historical Cycle09's old absence assertion is retained under the old-engine branch and a transition assertion is added for Astra01. The byte-exact original file is also retained as `docs/history/test_auto_cycle09_cycle66.js.txt`. No unrelated historical test is weakened. `tools/astra_gap_audit.py` is a Cycle66-only baseline analysis tool; its 620-card assertion intentionally rejects later coverage. Do not rerun it against System01 coverage.

Final validation and scope audit are recorded in `docs/ASTRA_SYSTEM01_REPORT.md`. Remaining items are in `FOLLOW_UP_GAPS.md`; none is registered or promoted by this checkpoint.
