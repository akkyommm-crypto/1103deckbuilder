# S03-U383 — the dice 「デーモン」 monsters (new engine module)

Base: `claude/work` `e5ddedf` (U382, gate 20455 PASS / 0 FAIL). Sonnet 5.5, single writer. ENGINE CHANGE: one new module and one hook line.

## Engine
- `engine/1ZZR_dice_demon_s03.js`: `declareDiceDemonS03(name, {faces, scope})` and `applyDiceDemonResolveS03(link)`. 「このカードが相手のコントロールするカードの効果の対象になり、その処理を行う時にサイコロを1回振る」: the die (`duelRandomInt(6)+1`, the replay RNG) is rolled when the chain link that targets the demon is about to be processed — in `engine/30_processor_chain_battle.js`, SOLVE_CHAIN, one line before `CHAIN_RESOLVE_TOP`. Targets are read like the other targeting hooks (`link.targets`, `deserializeChainSelectionV2`); only a link controlled by the other player counts; on a listed face the link is negated as an effect and its source is destroyed (`negateChainLinkV13(chainId, 'effect', …, true)`); scope `'demons'` (ダークビショップデーモン) covers the other face-up 「デーモン」 of its controller.
- The roll is not made when the demon has left the field (the earlier S03-U28 hook at CHAIN_ADD time would have rolled anyway), and nothing is added to the state except the RNG and the negation Action.

## Cards (`cards/HZZZZZZZZS_claude_s03_u383_dice_demons.js`)
- Upkeep: a forced onStandbyPhase trigger of the own turn pays the LP (500 / 900); not paid when the LP are short (the cards have no destroy clause).
- スカル・デーモン (1/3/6), シャドウナイトデーモン (3; `continuous.battleDamage` halves the damage the opponent takes in its battles), ダークビショップデーモン (1/3/6, scope demons), デスルークデーモン (3; a hand trigger on the destruction of ジェノサイドキングデーモン sends itself to the Graveyard as the cost and Special Summons it), インフェルノクインデーモン (2/5; ONE forced Standby trigger carries the upkeep and the +1000 ATK boost, because the engine offers a card's forced triggers of one event once per window), ヘルポーンデーモン (3; `cannotBeAttackTarget` for the other-named 「デーモン」).
- Not done: ジェノサイドキングデーモン (「デーモン」 required for Summon / Flip Summon, battle victim effect negation).

## Tests
- `tools/test_s03_u383_dice_demons.js` 20 / 0 (the face of the die is chosen with `seedFor(face)`; Replay audits pass). Negative control on the previous build: 3 FAIL before the script aborts (no `DICE_DEMON_S03`). Coverage TESTED 3286 → 3292, NOT_STARTED 578 → 572; `registration_names_missing_from_db` empty; audit 0 FAIL.
