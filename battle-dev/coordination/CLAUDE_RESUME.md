# CLAUDE_RESUME — 再開の正本 (Claude)

- 2026-10-03: Codexが構成だけ整理。以下の進捗は整理前のClaude記録を保持しており、新たな完了を認定したものではない。
- Writer: Claude (active). One writer at a time. 再開時はCURRENT・実ログ・LATESTを照合する。
- Current clean checkpoint: `checkpoints/checkpoint_claude_s03_u302_u302_batch10_20261010.zip`, SHA256 `a155a07610dc86b0f7a34a5bfe9b9f910565a2f2035b9396a393e96bc4d2d040`, gate 18178 PASS lines / 0 FAIL (`GATE_EXIT=0`) — S03-U302–U302, published 2026-10-10.
- Gate: テスト直後のGATE_EXIT、FAIL/Traceback、対象hashを確認する。末尾echoのexit 0は証拠にしない。
- 整理前の全文・過去の完了履歴: `logs/history/CLAUDE_RESUME_before_quality_update_20261003_193906_edce7e95.md`。通常の再開では全読不要。
- 運用: 共有マスタープロンプト冒頭「TESTED判定と再開メモ」。目安80行・12KB、過去の完了履歴をここへ再転記しない。

## 現在 (current)

<!-- CURRENT:BEGIN -->
- GitHub migration (2026-10-10): the published U302 clean checkpoint was imported byte-for-byte into `battle-dev/`; root `battle.html` now mirrors its verified `dist/battle.html`. The old GitHub artifact was U287. The migration branch must pass a fresh baseline gate before it is proposed to `main`.
- Collaboration: Codex writes `codex/work`; Claude Code writes `claude/work`; `main` is PR-only. Separate Git worktrees are mandatory. Use repository-root `scripts/finish-work.ps1` for test -> commit -> push.
- Preservation note: U303 recorded no source change. The U304 scratch tree was not recovered; its idea (duels with the real UI code) was re-implemented as U305 and is not claimed to reproduce U304 numbers.
- Base (shared clean): S03-U302–U302 checkpoint `a155a076…` (18178 PASS / 0 FAIL), log `coordination/S03_U302_U302_BATCH10_PUBLICATION.md`.
- Batch10: U302 — 霞の谷のファルコン, the attack-declaration cost of returning another own card (engine/1ZZQ). The Pearl / Falcon / 禁じられた聖杯 report was not reproduced (U300, 720+ cases); the Falcon had no script before.
- Priority (user, 2026-10-09):
  - Major-deck duels run start → result without stopping, including save / resume and Replay.
  - Sonnet does normal work. One current tree: `1103_work/s03_u296`.
- Major-deck cards: 215/216 TESTED or GENERIC_OK. ドラゴエクィテス is left NOT_STARTED: effect copy is engine-core work.
- Disk: C: was full (0 bytes free) on 2026-10-10. The scratchpad copies were removed (about 550 MB free). Publishing no longer keeps a local ZIP copy.
- Pipeline scripts are backed up in `1103_work/_pipeline`.
- Open: an LP cost equal to the current LP (`lp > cost` vs U292 `lp >= cost`); 死霊の誘い.
- Open rulings: ゾーン・イーター / 異国の剣士, 終焉のカウントダウン, デルタ・アタッカー (PARTIAL), キャトルミューティレーション, インフェルニティ・デス・ドラゴン on a face-down monster.
- U303 (Sonnet, no change): 13 mirror matches x 4 seed sets = 52 duels clean (incl. save / resume every stop).
- Since the GitHub migration (Sonnet, 2026-10-10..12; one report per unit in `docs/S03_U3NN_REPORT.md`, full previous memo in `coordination/history/CLAUDE_RESUME_before_u312_20261012.md`): U305 `HARNESS_UI=1` real-UI duel sweeps (234 duels clean); U306 オネスト hand cost (responder loop); U307 Gem-Knight duals + P4 GEM / GEMKNIGHT; U308 four direct-attack grant cards + `gameState.battleKillsS03`; U309 / U310 all nine トゥーン monsters (+ `sp.freesZoneS03`); U311 six revival Equip Spells (+ link `banishIfDestroyed`); U312 seven restricted Equip Spells (+ P4 NINJA / VYLON, `equipAttackLockS03`); U313 / U314 Union Monsters: `declareUnionS03` + 15 classic Unions (+ `equipSubstituteS03:'battle'`); U315 three Equip Spells (+ P4 XSABER); U316 Alien A Counter penalty + four cards (+ P4 ALIEN); U317 the last four 六武衆; U318 ダイガスタ ×4 + ガスタの神官 ムスト; U319 five BF (ブリーズ, ガスト, アリゼ, エテジア, ヒレン); U320 six ナチュル (モスキート, ローズウィップ, レディバグ, フライトフライ, スタッグ, ホワイトオーク); U321 six コアキメイル (+ engine: a normal draw now drains the queued onDrawCard events); U322 three アルカナフォース (EMPRESS, TEMPERANCE, LIGHT RULER; + targeting negator unwraps wrapper entries); U323 three サイバー・ダーク (+ engine: equipHostSubstituteS03, mulFinalAtk/Def); U324 three 音響戦士; U325 six ラヴァル (+ engine: destroy substitute kind banishGrave); U326 three ワーム (ソリッド, プリンス, ミリディス); U327 氷結界の封魔団 / 風水師 + 墓守の監視者; U328 five 巨大戦艦; U329 紫炎の参謀 / 寄子 / エニシ + ヴォルカニック・ハンマー; U330 ヴァイロン ステラ / プリズム / ハプト; U331 five ゼンマイ; U332 five スクラップ (スクラップ・ゴーレム: ENGINE_GAP override removed); U333 six ジェネクス (A・ジェネクス・ケミストリ: ENGINE_GAP override removed); U334 nine E・HERO Fusion Monsters.; U335 five D－HERO (ダイハードガイ / ダガーガイ / ダッシュガイ / ドゥームガイ / ドグマガイ; the stale ダガーガイ ENGINE_GAP lifted). U336 five エレキ (ツネ / キャンセル / リギリス / リム / ンモグラ). U337 墓守の大神官 / 大筒持ち, マシンナーズ・カノン, 古代の機械合成獣 / 採掘機 (+ destroySubstituteS03 kind discardHand). U338 five ジェムナイト Fusion Monsters. U339 six enabler-backed cards (ブラック・マジシャンズ・ナイト / サイバー・バリア・ドラゴン / サイバー・レーザー・ドラゴン / ブラック・バック / 氷結界のロイヤル・ナイト / ヴァイロン・マター; fixes 騎士の称号' summon reason). U340 five Spell/Trap cards (ストライク・ショット / チェンジ・デステニー / ライト・バニッシュ / ヴィクティム・カウンター / ワンダー・クローバー). U341 two Equip Spells, two Traps, a Continuous Trap, a Quick-Play Spell (憎悪の棘 / 竜殺しの剣 / 閃光のイリュージョン / 早すぎた復活 / 能力吸収コア / 魔導書整理). U342 six Special-Summon-condition monsters (ゲート・ガーディアン / カード・ブレイカー / ギガストーン・オメガ / ジャイアントワーム / カゲトカゲ / シンクロ・マグネーター). U343 eight banish/send/release-condition monsters (デザート・ツイスター / フェンリル / デビルドーザー / メガロック・ドラゴン / モンタージュ・ドラゴン / マスターモンク / ヘリオス・デュオ / トリス; 原始太陽ヘリオス test-covered). U344 eleven spirit/dragon/magnet monsters (霊魂の護送船 / 神聖なる魂 / ガルーダ / アクエリア / 氷炎の双竜 / 電池メン－業務用 / 真紅眼の闇竜 / アナンタ / ハモン / バルキリオン / 虚栄の大猿). U345 seven defensive / battle-reactive monsters (デッド・ガードナー / カードブロッカー / シャトルロイド / ロックストーン・ウォリアー / 魔力吸収球体 / 傀儡虫 / クリボン). U346 seven high-Level restricted-summon monsters (邪神ドレッド・ルート / イレイザー / アバター / 堕天使ディザイア / 神鳥シムルグ / 黒の魔法神官 / 幻魔皇ラビエル). U347 eight monsters (フレムベル・デスガンナー / ネオフレムベル・シャーマン / 速攻の黒い忍者 / インヴェルズ・グレズ / マジオシャレオン / ボタニカル・ライオ / 幻影の妖精 / サモン・リアクター・AI). GATE LESSON: never `defineScript` a name that is not a DB card (a token name fails check.py 'coverage sees Unified/helper scripts'); use defineTokenSpecV11 + API.createTokens. U348 four revival Continuous Traps (アマゾネスの意地 / ウィキッド・リボーン / コアの再練成 / サイコ・チューン). LESSON: a link-made destruction (API.linkOnLeave 'destroy') queues no events — use a forced trigger on the partner's leave events when the destroyed card must trigger something. U349 four Trap/Spell cards (ヘル・ポリマー / 痛恨の訴え / 破壊輪 / 融合回収). Left: 調律師の陰謀 (destroyed → banished instead of the GY), 栄誉の贄 (token Advance-Summon exception), 賢者の聖杯, ジャイアント・ボマー・エアレイド (Set-card event). U350 seven monsters (雷魔神－サンガ / 風魔神－ヒューガ / 水魔神－スーガ / 盲信するゴブリン / 牙城のガーディアン / 精気を吸う骨の塔 / 火車). LESSON: a field monster reacting to ANOTHER monster's Special Summon needs `onOtherSummon:true` (summonTriggerApplies, engine/40) even for a forced trigger; the Damage Step calc window (クリボン pattern: dsTiming 'calc' + passive onDamageStep) serves 魔神 and hand responses (牙城). Left: 砂漠の守護者 (substitute for OTHER insects: engine kinds protect the card itself only), 瞬着ボマー / 精神寄生体 (face-down attacked → becomes an Equip), 星見鳥ラリス, 爆炎集合体 ガイヤ・ソウル (optional Fire tributes for ATK), 椿姫ティタニアル, 毒蛇王ヴェノミノン (needs ヴェノム・スワンプ immunity). U351 five monsters (X－セイバー ガラハド / オアシスの使者 / イービル・ソーン / C・リペアラー / C・コイル). LESSON: never name a test helper `act` (it replaces the engine global act() and duel actions silently do nothing); `countLimit` goes in the card META for Unified monsters. Left: インセクト女王, キラー・ラブカ, グラヴィティ・ベヒモス, G・B・ハンター, インヴェルズの魔細胞. U352 four monsters (フュージョニストキラー / マックス・ウォリアー / メンタルプロテクター / マジシャンズ・エイプ). Left: the six upkeep デーモン (dice negation when targeted), ワイト夫人 / ワイトメア. U353 three Continuous cards (平和の使者 / 闇の呪縛 / 拷問車輪). Left: the Equip-Trap cards (植物連鎖, 燃える闘志), 閃光弾, 窮鼠の進撃, and the rule-lock traps (融合禁止エリア, 王宮の鉄壁, 生贄封じの仮面). U354 four chain-count cards (連鎖爆撃 / 一陣の風 / 積み上げる幸福 / 奇跡の蘇生). LESSON: chains are testable with duelActivateFromHand + duelActivateResponseV2(p,zone,idx) from both players; state written during activation must use API.setCardFlag (a plain property write breaks the Replay digest). Left: サモンチェーン, 虚無を呼ぶ呪文. U355 four Counter Traps (透破抜き / 王家の呪い / 六尺瓊勾玉 / エンペラー・オーダー; the chain top link is read with linkHasCategoryV19 / linkTargetsV19). Left: ボム・ガード / デストラクション・ジャマー / 我が身を盾に (no "destroys monsters" category), スターライト・ロード, 封魔の呪印, 王者の看破. U356 four monsters (魔鏡導士リフレクト・バウンダー / 魔導アーマー エグゼ / 海底に潜む深海竜 / 静寂のサイコウィッチ). LESSON: in tests destroy through a real path (a battle) — a bare API.destroy from test code queues no events. Left: 邪悪な儀式, 邪狂神の使い, キラー・ラブカ, 聖獣セルケト. U357 three Ritual Spells (踊りによる誘発 / 亀の誓い / ハンバーガーのレシピ via registerRitualSpecV24 + v5DefineRitualSpell) and 大邪神 レシェフ. Left: 救世の儀式 / 破滅の儀式 / 宣告者の預言 (second Graveyard effects). U358 three Infernity cards (ZERO－MAX / インフェルニティ・ミラージュ / インフェルニティ・リフレクター) + engine rule noGraveSummonReasonS03 (「このカードは墓地からの特殊召喚はできない」, engine/1ZK + API.specialSummon). Left: ハンドレス・フェイク.
- Gate after U332: 19087 PASS (19061 + 27 − 1 pin removed from test_v850_batch36); coverage TESTED 3046 / NOT_STARTED 802 / ENGINE_GAP 471.
- Gate after U333: 19119 PASS; coverage TESTED 3052 / NOT_STARTED 797 / ENGINE_GAP 470.
- Gate after U334: 19149 PASS = 19119 + 30; coverage TESTED 3061 / NOT_STARTED 788 / ENGINE_GAP 470.
- Gate after U335: 19198 PASS = 19149 + 50 − 1 (the ダガーガイ gap pin removed from test_v840_batch35), GATE_EXIT=0, commit 1a3276f; coverage TESTED 3066 / NOT_STARTED 784 / ENGINE_GAP 469.
- Gate after U336: 19234 PASS = 19198 + 36, GATE_EXIT=0, commit 1e44531; coverage TESTED 3071 / NOT_STARTED 779 / ENGINE_GAP 469.
- Gate after U337: 19281 PASS = 19234 + 47, GATE_EXIT=0, commit be18865; coverage TESTED 3076 / NOT_STARTED 774 / ENGINE_GAP 469.
- Gate after U338: 19312 PASS = 19281 + 31, GATE_EXIT=0, commit 6ae7d5f; coverage TESTED 3081 / NOT_STARTED 769 / ENGINE_GAP 469.
- Gate after U339: 19346 PASS = 19312 + 34, GATE_EXIT=0, commit 66a6a31; coverage TESTED 3087 / NOT_STARTED 763 / ENGINE_GAP 469.
- Gate after U340: 19378 PASS = 19346 + 32, GATE_EXIT=0, commit 31dd4c5; coverage TESTED 3092 / NOT_STARTED 758 / ENGINE_GAP 469.
- Gate after U341: 19412 PASS = 19378 + 34, GATE_EXIT=0, commit 2b32494; coverage TESTED 3098 / NOT_STARTED 752 / ENGINE_GAP 469.
- Gate after U342: 19445 PASS = 19412 + 33, GATE_EXIT=0, commit c46a4b8; coverage TESTED 3104 / NOT_STARTED 746 / ENGINE_GAP 469.
- Gate after U343: 19497 PASS = 19445 + 52, GATE_EXIT=0, commit adad182; coverage TESTED 3112 / NOT_STARTED 738 / ENGINE_GAP 469.
- Gate after U344: 19567 PASS = 19497 + 70, GATE_EXIT=0, commit 2eef08b; coverage TESTED 3123 / NOT_STARTED 727 / ENGINE_GAP 469.
- Gate after U345: 19598 PASS = 19567 + 31, GATE_EXIT=0, commit b552963; coverage TESTED 3130 / NOT_STARTED 720 / ENGINE_GAP 469.
- Gate after U346: 19650 PASS = 19598 + 52, GATE_EXIT=0, commit 643eaa6; coverage TESTED 3137 / NOT_STARTED 713 / ENGINE_GAP 469.
- Gate after U347: 19695 PASS = 19650 + 45, GATE_EXIT=0, commit c6d24c0; coverage TESTED 3145 / NOT_STARTED 705 / ENGINE_GAP 469.
- Gate after U348: 19721 PASS = 19695 + 26, GATE_EXIT=0, commit 06fcb86; coverage TESTED 3149 / NOT_STARTED 701 / ENGINE_GAP 469.
- Gate after U349: 19740 PASS = 19721 + 19, GATE_EXIT=0, commit 0a5866c; coverage TESTED 3153 / NOT_STARTED 697 / ENGINE_GAP 469.
- Gate after U350: 19779 PASS = 19740 + 39, GATE_EXIT=0, commit f8ed348; coverage TESTED 3160 / NOT_STARTED 690 / ENGINE_GAP 469.
- Gate after U351: 19808 PASS = 19779 + 29, GATE_EXIT=0, commit 9c90cd6; coverage TESTED 3165 / NOT_STARTED 685 / ENGINE_GAP 469.
- Gate after U352: 19834 PASS = 19808 + 26, GATE_EXIT=0, commit 2b633b7; coverage TESTED 3169 / NOT_STARTED 681 / ENGINE_GAP 469.
- Gate after U353: 19854 PASS = 19834 + 20, GATE_EXIT=0, commit 513e084; coverage TESTED 3172 / NOT_STARTED 678 / ENGINE_GAP 469.
- Gate after U354: 19871 PASS = 19854 + 17, GATE_EXIT=0, commit 160f810; coverage TESTED 3176 / NOT_STARTED 674 / ENGINE_GAP 469.
- Gate after U355: 19887 PASS = 19871 + 16, GATE_EXIT=0, commit 8c09e1b; coverage TESTED 3180 / NOT_STARTED 670 / ENGINE_GAP 469.
- Gate after U356: 19905 PASS = 19887 + 18, GATE_EXIT=0, commit 83c1bf1; coverage TESTED 3184 / NOT_STARTED 666 / ENGINE_GAP 469.
- Gate after U357: 19930 PASS = 19905 + 25, GATE_EXIT=0, commit 350ea7c; coverage TESTED 3188 / NOT_STARTED 662 / ENGINE_GAP 469.
- Gate after U358 (expected): 19946 PASS = 19930 + 16; coverage TESTED 3191 / NOT_STARTED 659 / ENGINE_GAP 469.
- DISK TIP: each gate leaves ~5.4 MB `tmp*.js` files in %TEMP% (about 40 per gate); delete the ones of 5–6 MB after every gate or C: fills up.
- DISK: C: hit 0 bytes free on 2026-10-13. 38.7 GB is an old session task-output folder (`%TEMP%claudeC--Users-81806-OneDrive-…a897e0c6…	asks`, 2026-10-10) — NOT deleted, the user decides. Gate runs leave ~7 MB each in %TEMP% (gate log, tmp*.js). Workflow notes: `finish-work.ps1` needs `git checkout -- battle-dev/dist/battle.html` first if `dist` was rebuilt by hand; a card added to a hand after `baselineA()` breaks the Replay audit; unified Equip Spells are offered through `getLegalHandActions`.
- OPEN ENGINE ITEM (needs design, Opus): 「cannot be targeted」 — a central filter on target selection. Consumers (9): ヴァイロン・セグメント, ヴァイロン・エプシロン, オベリスクの巨神兵, ジュラック・タイタン, ターボ・ウォリアー, 救世の儀式, 機皇城, 氷結界の御庭番.
- Unions left (see `docs/S03_U314_REPORT.md`): セコンド・ゴブリン / 守護霊アイリン (position-change allowance), ルナタイト (Spell immunity of the equipped monster), and six 「①:」-wording Unions + ギアフレーム (RULING_UNRESOLVED: the 2011 wording is not confirmed). NEXT: `docs/S03_U316_REPORT.md` "Not done" (Alien: リベンジャー needs an own-field uniqueness rule, ガンギル the Tribute rule …), `docs/S03_U315_REPORT.md` (remaining Equip Spells: markers for 草薙剣 / コアバスター, optional substitutes, バオウ negator), other clusters from the NOT_STARTED survey (counters 46, ライフポイントを払 38, 儀式 15, coin / dice 11), fresh `HARNESS_UI=1` sweeps.
- U304 (Sonnet): sweeps with the real UI code running (`S/harness_ui.js`, `S/harness_ui2.js` browse mode): 338 duels clean, 0 UI exceptions, 0 soft findings. Only `tools/r1_duel_driver.js` changed (keeps the real showToast under `HARNESS_UI`); unpublished, goes into the next batch.
- ドラゴエクィテス effect copy: 124 `CARD_SCRIPTS[...]` lookup sites; it needs both its own and the copied script. Deferred as engine design work.
- Waiting on the user: C: disk space (about 0.5 GB free); the LP cost equal to the current LP (ruling); the auto-resume scheduled task (permission).
<!-- CURRENT:END -->

## User-reported bugs — status

- U114 (saved decks v2, Xyz material choice) and U121 (builder launch flow): **confirmed OK on device by the user (2026-09-26)** — RESOLVED.
- U172 (2026-09-26): Player2 could only start with the sample 兎ラギア — fixed; device copy `acode/battle_acode_s03_u172.html`, awaiting the user's check.
- Optional destruction substitutes: the user decided (2026-09-26) — pause at the destruction and let the player choose; S03-U173.

## Known deferred findings

- Pending engine gaps (not user decisions): The splendid VENUS (negation immunity), レベル・スティーラー ① (central cost/effect Tribute path), 霊滅術師 カイクウ ② (acting player of costs in the GY banish lock), スーパイ, 機皇城 ①, ハーピィ・クィーン (name alias), 超古深海王シーラカンス ②, スクラップ・ビースト (attack-target tracking), チェンジ・デステニー (permanent position lock).
- **TOP engine item (TESTED correctness):** about 485 TESTED cards have an effect / procedure Special Summon with no position in the text (the player may choose face-up Attack or Defense), but the scripts pass a fixed 'atk'. Candidate list: scratchpad `ss_position_candidates.txt` (to be copied into the tree's docs with the unit). `API.specialSummon` is synchronous and scripts act on the summoned card right after it, so this needs an engine design: a journaled position choice inside the summon. New cards use `specialSummonPositionsS03` (engine/1ZZK). Until then these cards carry a known deviation; `timing:['mainPhase']` does not check whose turn it is — checked 2026-10-04: not reachable in play (getLegalZoneActions offers field effects to the turn player only; chain responses need Spell Speed 2+), so no change
- Recurring engine needs from the ENGINE_GAP triage (class B): an extra Normal Summon key, a hand-size-limit modifier, a duel-win action, activating a Field Spell from the Deck, an effect-damage source filter, a flip-suppressing position change, missing setcodes. Follow-ups: real-path checks of 黒板消しの罠 / 地獄の扉越し銃 after the U267 LP fix; 銀幕の鏡壁 needs an ATK-halving layer.
- PROPOSAL (not changed, UX-visible): DUEL has priority POINTs only in the Battle Phase. At the end of Draw / Standby / Main / End Phase the non-turn player gets no window, so e.g. サイクロン or a set Trap in the opponent's End Phase is impossible unless something else starts a chain. A phase-end POINT (priority to the opponent; auto-pass when nothing is activatable) would fix it but adds a prompt when the opponent holds an activatable set card — ask the user before changing.
- ギガプラント (U122) / 超融合 (U124): effect Special Summons use Attack Position (API.specialSummon convention); a position choice would be more faithful.
- ガチガチガンテツ: optional destruction substitute needs a new capability (destruction decided in the reducer, no choice point).
- キメラテック・フォートレス・ドラゴン: no Extra Deck summon procedure → cannot be summoned in DUEL; needs an EX procedure path + multi-material selection; confirm the 2011 face-down-material ruling first.

- The U116 must-attack clause only prompts a confirmation when leaving the Battle Phase (existing `doPhase` design).

- Same-shape S/T-immunity cards needing another capability: トラファスフィア, 伝説のフィッシャーマン, サイレント・ソードマン LV5, サイレント・マジシャン LV8, 砂塵の結界, 暴君の威圧, 最後の進軍, 極神聖帝オーディン, 儀式魔人ディザーズ.

- 宝玉の契約 / 宝玉の祈り: setcode used as the 「宝玉獣」 named predicate (needs a P4 overlay group).
- グラファ / ゴルド: "選択して破壊" target chosen at resolution instead of on activation.

## Notes

- `python tools/script_coverage.py --json <path>` WRITES to `<path>` — only ever pass a scratch path.
- Publication: from U268 on, one shared checkpoint per batch of about 3 verified units; LATEST changes only when a checkpoint is published. Each unit keeps its own report (`docs/S03_UNNN_REPORT.md`) and measurement JSON.
