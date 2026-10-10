# S03-U180 — 剣闘獣 (Gladiator Beast) common mechanism, stage 1

## Finding
The 剣闘獣 monsters were AUTO_DECK_TABLE entries of the wrong shape (「召喚時にデッキから剣闘獣を特殊召喚」) — PARTIAL — or had no script;
their core, the Battle Phase end tag-out, did not exist. 剣闘獣セクトル (TESTED since cycle 91) summoned automatically (the first two
Deck cards, Attack Position) and ignored 「「剣闘獣」…によって特殊召喚したこのカード」.

## Mechanism (engine/1ZZ_gladiator_s03.js)
- 「戦闘を行った」: `battledTurnS03` stamped on both monsters by the ATTACK action (damage calculation; zone-local).
- 「「剣闘獣」…の効果によって特殊召喚」: `gladiatorSummonedS03`, set by FX_SPECIAL_SUMMON when the action carries `gladiatorS03` (every
  summon by the mechanism); zone-local.
- `gladiatorTagOutEffectS03(name, {count, exclude, stay, requireGladiatorSummoned})`: optional trigger at the end of a Battle Phase in
  which the card battled; cost = return it to the Deck (shuffled); resolution = the player picks exactly N 「剣闘獣」 monsters (other
  than the named one) and a position for each (journaled registry choices), summoned with the gladiator mark.
- `gladiatorOnSummonEffectS03(key, spec)`: trigger 「剣闘獣の効果で特殊召喚に成功した時」. `defineGladiatorS03(name, effects, meta)`.
- 「剣闘獣」と名のついたカード = the P4 set code (SETCODE.GLADIATOR_BEAST), not a name prefix.
- tools/script_coverage.py recognises `defineGladiatorS03` as a registration.

## Cards (→ TESTED)
ラクエル (base ATK 2100), ホプロムス (base DEF 2400), ディカエリィ (2 attacks), エクイテ (GY 「剣闘獣」 card → hand), ムルミロ (destroy a
face-up monster), レティアリィ (optional: banish from the opponent's GY), ベストロウリィ (destroy a Spell / Trap), トラケス (return → draw 1;
ENGINE_GAP pin removed), ティゲル (cannot be a fusion material; discard a 「剣闘獣」 → search). 剣闘獣セクトル rewritten on the mechanism (stays
TESTED): only when gladiator-summoned, player's choice of monsters and positions.

## Test changes (the old assertion contradicted the 2011 text)
- `tools/test_battle_cards.js` 剣闘獣セクトル: an unmarked セクトル no longer triggers (new negative assertion); the positive case marks it
  gladiator-summoned and answers the choices.
- `tools/test_v920_batch43.js`: 剣闘獣トラケス moved from the ENGINE_GAP review list to `gladiatorUnlockedU180` (no override).

## Tests
`tools/test_s03_u180_gladiators.js` 20/0 (real DUEL paths, Replay-audited): A ラクエル tag-out → ホプロムス (Defense, DEF 2400);
B only the monster that battled is offered, ラクエル brought by ホプロムス has ATK 2100, ディカエリィ attack limit 2 / 1; C a monster destroyed
in the battle cannot tag out, ムルミロ / ベストロウリィ / エクイテ / レティアリィ on-summon effects; D トラケス draw; E ティゲル not a contact
material, discard → search. Negative control on U176: 10 FAIL.

## Left (stage 2)
剣闘獣ガイザレス / ゲオルディアス (EX tag-out of 2), スパルティクス / アレクサンデル (summon-only-by restrictions, 闘器 search, spell immunity),
サムニテ, ダリウス (revive with leave link), オクタビウス (Battle Phase end discard or return), ラニスタ (name copy). The remaining wrong
AUTO_DECK_TABLE entries (アレクサンデル, ダリウス, ラニスタ) stay PARTIAL until then.

## Gate
- `python tools/check.py` → `GATE_EXIT=0`, **14790 PASS / 0 FAIL** (= U179 14769 + 21 new, exactly), no Traceback / ReferenceError; the caught `TypeError` stack at the start of `test_auto_cycle32.js` is the existing recorded noise.
- Pre-scan (after all data changes): only the new test differs from U179.
- Coverage: TESTED 2314, ENGINE_GAP 600, NOT_STARTED 1220, IMPLEMENTED 83, GENERIC_OK 644, PARTIAL 135 (4996); audit 275 declared, 0 off-target.
