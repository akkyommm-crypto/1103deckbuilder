# Codex Current Autobuild Task

Read `AGENTS.md` and `docs/CODEX_AUTOBUILD.md` before editing.

Current coverage counts: `{'ENGINE_GAP': 862, 'GENERIC_OK': 644, 'IMPLEMENTED': 198, 'NOT_STARTED': 2119, 'PARTIAL': 182, 'TESTED': 991}`.

Implement/review this batch of **30** candidates:

1. 混沌球体 (code=82693042, kind=monster, static complexity=6)
2. 無視加護 (code=22991179, kind=spell, static complexity=7)
3. 疫病狼 (code=55696885, kind=monster, static complexity=6)
4. 百獣王 ベヒーモス (code=22996376, kind=monster, static complexity=6)
5. 竜操術 (code=99659159, kind=spell, static complexity=7)
6. 紫炎の道場 (code=47436247, kind=spell, static complexity=7)
7. 細菌感染 (code=24668830, kind=spell, static complexity=7)
8. 終わりの始まり (code=73680966, kind=spell, static complexity=7)
9. 蒼血鬼 (code=7953868, kind=monster, static complexity=6)
10. 薄幸の乙女 (code=27618634, kind=monster, static complexity=6)
11. 貫ガエル (code=56052205, kind=monster, static complexity=6)
12. 超古代恐獣 (code=6849042, kind=monster, static complexity=6)
13. 超熱血球児 (code=67934141, kind=monster, static complexity=6)
14. 逆ギレパンダ (code=9817927, kind=monster, static complexity=6)
15. 進化の繭 (code=40240595, kind=monster, static complexity=6)
16. 選ばれし者 (code=21888494, kind=spell, static complexity=7)
17. 闇紅の魔導師 (code=45462639, kind=monster, static complexity=6)
18. 雲魔物－アイ・オブ・ザ・タイフーン (code=57610714, kind=monster, static complexity=6)
19. 霊子エネルギー固定装置 (code=99173029, kind=spell, static complexity=7)
20. 魂の解放 (code=5758500, kind=spell, static complexity=7)
21. 魂喰らいの魔刀 (code=5371656, kind=spell, static complexity=7)
22. 魔天使ローズ・ソーサラー (code=49674183, kind=monster, static complexity=6)
23. 魔法族の結界 (code=17896384, kind=spell, static complexity=7)
24. 魔轟神ミーズトージ (code=8316661, kind=monster, static complexity=6)
25. アグレッシブ・クラウディアン (code=23639291, kind=trap, static complexity=7)
26. アヌビスの裁き (code=55256016, kind=trap, static complexity=7)
27. カース・サイキック (code=16678947, kind=trap, static complexity=7)
28. ギブ&テイク (code=55465441, kind=trap, static complexity=7)
29. クローン複製 (code=86871614, kind=trap, static complexity=7)
30. ゲットライド! (code=91597389, kind=trap, static complexity=7)

Rules for each candidate:
- Verify historical 1103 behavior before implementation. Modern `carddata.json` text may reflect later errata.
- Inspect analogous local scripts and prefer common engine primitives over card-name engine patches.
- ADS/EDOPro/Project Ignis may be consulted for behavior/timing concepts only; never copy source code.
- If behavior cannot be represented accurately, mark `ENGINE_GAP` in `data/script_status_overrides.json` with a precise missing primitive and continue to the next card.
- Do not mark a coarse `AUTO_DECK_TABLE` entry complete until it is replaced/reviewed accurately.
- Add focused tests. A card is not complete merely because a script registration exists.

Batch completion sequence:
1. Run focused tests while developing.
2. Run `python tools/check.py`.
3. Run `python tools/build_acode.py data/carddata.json`.
4. Run `python tools/autobuild_cycle.py --size 40` to refresh coverage and prepare the next batch.
5. Record a checkpoint changelog/test report. If git is available, commit the checkpoint.
6. Continue with the newly generated `docs/CODEX_CURRENT_TASK.md` unless an unrecoverable environment failure occurs.

Never trade correctness for a higher coverage number.
