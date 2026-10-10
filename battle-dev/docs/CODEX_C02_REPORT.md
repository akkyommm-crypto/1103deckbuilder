# CODEX-C02 — six ENGINE_GAP cards

This batch implements and behavior-tests またたびキャット, H－ヒートハート, HERO’S ボンド, ロスト, いたずら好きな双子悪魔, and 風林火山 on the accepted U287 + CODEX-C01 base. It does not integrate the unfinished Claude U288–U290 work.

またたびキャット now applies a targeted DEF-0 modifier through the End Phase, observes its per-card once-per-turn limit, and prevents attacks on itself only while another face-up Beast is controlled and its effect is active. H－ヒートハート gives one chosen face-up monster +500 ATK and turn-wide piercing; the narrow shared `pierceBattleS03` reader now treats a missing defender UID as a turn-wide grant while preserving U233's defender-stamped one-battle behavior.

HERO’S ボンド checks for a face-up HERO on either field, two eligible Level 4-or-lower Elemental HERO monsters in its controller's hand, two free Monster Zones, and the central Special Summon restrictions. Its continuation resolves each selected UID again after the first summon changes hand indexes. Both summons stay in the chain resolver's simultaneous summon batch and retain the existing summon-position queue. ロスト targets any card in the opponent's GY, loses its target normally, and is unavailable in the Damage Step.

いたずら好きな双子悪魔 uses the journaled `API.payCost` path for 1000 LP, randomly discards the first opposing card, then opens an opponent-controlled saved choice for the second. It remains legal against a one-card hand. 風林火山 checks the four face-up attributes only at activation and chooses its mode at resolution; its Spell/Trap wipe includes the Field Zone, and it remains resolvable if an attribute leaves after activation.

The focused test has 40 PASS / 0 FAIL. Every positive activation uses the DUEL pipeline and each card has Replay coverage. The unchanged CODEX-C01 baseline produces 14 expected behavioral failures, 26 incidental fixture/negative passes, exit 2, and no crash when the same test is run from the isolated `evidence/c02_negative_control` harness. The negative copy is byte-equivalent in test behavior; its harness changes only the root path to the unchanged CODEX-C01 tree. Nearby regressions pass: U233 26/0, U278 11/0, and U135 12/0. Astra01, Astra02, and S03 status audits also pass.

Coverage moves exactly six cards from ENGINE_GAP to TESTED: TESTED 2,908 and ENGINE_GAP 490; every other status count is unchanged. Historical v500, v550, v750, v840, and v890 assertions retain their original assertion counts while treating the relevant card as unlocked.

Primary-source review supplied by the parent used the official card database entries for [またたびキャット](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=6243&ope=2&request_locale=ja), [H－ヒートハート](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=6671&ope=2&request_locale=ja), [HERO’S ボンド](https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=6785&ope=2&request_locale=ja), いたずら好きな双子悪魔 (cid 4901), ロスト (cid 5397), and 風林火山 (cid 6222). The current FAQ pages corroborate target, cost, simultaneous discard, Damage Step, Field Zone, and resolution-choice details; their later dates are corroboration rather than standalone proof of the 2011 rulings. The local database's pre-cutoff print texts supply the historical card text.

Planning and an earlier Terra attempt left partial tests and two concrete draft defects: HERO’S ボンド cached shifting hand indexes, and いたずら好きな双子悪魔 called a nonexistent LP helper. The completed batch reuses the established UID re-resolution, simultaneous summon batching, saved choices, and `API.payCost` paths.

Root owns the final per-test scan, full gate, Acode build, packaging, and publication. Usage telemetry was unavailable and is recorded as null.

## Final batch gate

Final full gate: 17772 PASS / 0 FAIL / GATE_EXIT=0 (= C01 17,732 + 40). All 507 existing Node-file counts match C01; the only new file is the dedicated C02 regression. UTF-8 output was captured directly. Traceback/ReferenceError: 0; one caught TypeError from test_auto_cycle32.js is the documented unchanged baseline noise. Acode generated with 4,996-card DB. Source hashes were frozen and checked through verification. Device UI is not newly verified.

This cumulative checkpoint includes C01 plus C02 on U287. Claude U288–U290 remain unmerged. The included patch is cumulative against published U287, not against C01.
