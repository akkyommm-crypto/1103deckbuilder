# S03-U354 — four chain-count cards

Base: `claude/work` `513e084` (U353, gate 19854 PASS / 0 FAIL). Sonnet 5.5, single writer; no engine change.

## Cards (`cards/HZZZZZZZP_claude_s03_u354_chain.js`)
- 「チェーンN以降」 = the chain already holds N-1 or more links (`gameState.chain.length >= N-1`); 「同一チェーン上に複数回同名カードの効果が発動している場合は発動できない」 = a name appears twice among `gameState.chain[].name`. Shared helper `u354ChainOk(ctx, n)` sets `ctx.reason`.
- 連鎖爆撃 (Quick-Play, chain 2+): the number of stacked links is stored at activation (cost step) in a card flag (`API.setCardFlag`, silent) — a plain property write would break the Replay digest — and the damage is that count x 400.
- 一陣の風 (Quick-Play, chain 3+): chooses a Spell/Trap card on the field at resolution and destroys it (not itself).
- 積み上げる幸福 (Trap, chain 4+): `API.draw(player, 2)`.
- 奇跡の蘇生 (Quick-Play, chain 4+): target = a monster in either Graveyard (`canEffectSpecialSummonS03`), `API.specialSummon(…, fromPlayer)` as 死者蘇生.
- Not part of this unit: サモンチェーン (3 Normal Summons: the summon-count rule), 虚無を呼ぶ呪文 (negating every earlier link at once).

## Tests
- `tools/test_s03_u354_chain.js` 17 / 0. Negative control on the previous build: 8 FAIL. Coverage TESTED 3172 → 3176, NOT_STARTED 678 → 674; `registration_names_missing_from_db` empty; audit 0 FAIL.
- Real chains are built with `duelActivateFromHand` (link 1) and `duelActivateResponseV2(p, zone, index)` from both players (links 2 to 4); `getChainResponsesV2(p)` shows the offer for set cards (a hand Quick-Play of the turn player is not listed there, but it can be activated).
