# S03-U358 — three Infernity cards and the "cannot be Special Summoned from the Graveyard" rule

Base: `claude/work` `350ea7c` (U357, gate 19930 PASS / 0 FAIL). Sonnet 5.5, single writer.

## Engine change (small, text-driven)
- `engine/1ZK_summon_only_s03.js`: new `noGraveSummonReasonS03(card, from)` — a card whose text says 「このカードは墓地からの特殊召喚はできない」 cannot be Special Summoned from the Graveyard by an effect; `canEffectSpecialSummonS03` returns false for it (candidate lists) and `engine/40_legal_script_engine.js` `API.specialSummon` refuses it (3 lines, honours `ignoreSummonConditionS03`). Affects インフェルニティ・ミラージュ now and ハ・デス / 地獄詩人ヘルポエマー when they are implemented.

## Cards (`cards/HZZZZZZZT_claude_s03_u358_infernity.js`)
- ZERO－MAX: 「手札が0枚」 is checked on the hand without the Spell itself; target = an Infernity monster in my Graveyard; resolution Special Summons it, then destroys every face-up monster (both fields) with lower ATK than it; the Battle Phase ban is the turn-temporary player flag `noBattlePhase` (read by `battlePhaseForbiddenV340`).
- インフェルニティ・ミラージュ: ignition, empty hand, release itself (cost), two Infernity targets (not Mirage itself) Special Summoned.
- インフェルニティ・リフレクター: passive `onSendToGrave`; the dead monster is read from the event uid (`graveInfo.battle`, from the Monster Zone, this turn, name contains 「インフェルニティ」); cost = discard the whole hand; resolve = Special Summon it and 1000 damage.
- Not part of this unit: ハンドレス・フェイク (face-down banish of the whole hand until my next Standby Phase needs a banished-to-hand return).

## Tests
- `tools/test_s03_u358_infernity.js` 16 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3188 → 3191, NOT_STARTED 662 → 659; `registration_names_missing_from_db` empty; audit 0 FAIL.
