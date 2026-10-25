# S03-U473 — 《次元幽閉》を対象を取る罠にする（targets:true）＋ 記録2件の訂正

基点: `claude/work` `044993cf`（U472。push 済み、origin と一致）。基点ゲート: **22817 PASS / 0 FAIL / GATE_EXIT=0**（U472 の直列実測）。ユーザー指示により同一ゲートは繰り返さず、変更ごとに専用・近接テスト、最後に直列ゲートを1回だけ実行。単一ライター、`claude/work` のみ。共有エンジンは触っていない（カードスクリプトのみ）。

## 根拠（正直に）
- カード文（`data/carddata.json` の `e`）: 「相手モンスターの攻撃宣言時、**攻撃モンスター1体を選択して**発動できる。選択した攻撃モンスターをゲームから除外する。」
- **裁定アーカイブ（`wiki-rulings.js`）に 次元幽閉 自身のエントリは 0 件**（`cards` 欄で検索）。「対象を取る」という扱いの根拠は、1103 当時の文言「選択して」と、このプロジェクトの既存の運用（「選択して」の効果を `targets:true` と宣言する）だけで、**「対象を取る」と明言した裁定があるわけではない**。
- 次元幽閉 を名指しするのは他カードのページの質問のみ（6件）。うち WIKI-AD6B9A8D471E（《安全地帯》, `answerDate` 2011-07-07）「次元幽閉 にチェーンして安全地帯を発動。攻撃モンスターは除外されますか？ → 除外されます。」は挙動の整合に使った（下の G）。WIKI-89BB9D36443F（《強制終了》, 2009-10-23）「次元幽閉 にチェーンしてバトルフェイズが終了した場合、除外は処理されない」は未検証（今回の範囲外、下記）。

## 欠陥
`cards/00_generic_core.js` の 次元幽閉 は `type:"trap", priority:2` だけで `targets:true` が無かった。`API.selectCard` は `targeting=false` と導き、`filterTargetable`（対象耐性）が**一度も掛からなかった**。実測（基点ビルド）: ホルスのしもべ下のホルスの黒炎竜 LV4 の攻撃・オベリスクの巨神兵の攻撃のどちらでも応答窓に 次元幽閉 が提示され、発動できた（耐性が効いていない）。

さらに、基点の候補は「`attacked` が立っているモンスター全て」だった。同じターンに先に攻撃した別のモンスターがいると、**今攻撃しているのではないモンスターが選べて除外された**（基点の測定: 候補 `[ライオウ, サイバー・ドラゴン]` で先頭のライオウが除外された）。攻撃モンスターが対象耐性で守られている場合も、別のモンスターへ切り替わってしまう。

## 変更（`cards/00_generic_core.js`、1枚）
1. `targets:true` を宣言。
2. 候補を「現在の攻撃モンスター」（`gameState.pendingAttack.attackerUid`）だけに絞る（`s03DimensionalCandidates`）。特定できない時だけ従来の「`attacked` 優先」にフォールバック。
3. `condition` で `API.targetableCardsS03(候補, ctx.player)` を見て、**対象にできる攻撃モンスターがいなければ発動を断る**（U470 と同じ形。次元幽閉 は主要デッキ5本に入っている）。応答窓にも出ない。これは依頼の最小要件（`targets:true`）を超えた追加だが、U470 の運用と同じで、無ければ「窓で提示 → 発動開始 → U471 の中止で戻る」という見かけ上不自然な動きになる。U471 の中止は多重の保険として残り、旧い生の `condition` を VM 内で再現して固定している（E）。

他に、U472 の記録訂正に伴うコメントのみの変更（下記）が `cards/C5_auto_cycle23.js`・`tools/test_s03_u471_prep_tx.js`・`tools/test_s03_u472_multi_target_armor.js` にある（挙動・assertion は無変更）。

## 検証した4つの面（`tools/test_s03_u473_dimensional_prison_targeting.js`、77 PASS / 0 FAIL）
1. **対象の確定（A）**: 発動で開く選択は `targeting===true`・候補は攻撃モンスター1体だけ。選択後、チェーンに 次元幽閉 のリンク1つ、`linkTargetUidsS03` が攻撃モンスターの uid。リンクは JSON 往復後も同じ対象参照を持つ。解決の `FX_BANISH` は発生源 `srcS03.tg = [攻撃モンスターの uid]`（「対象を取らない効果では…」の判定に使われる発生源）。基点では `uids: []`・`srcS03` に `tg` 無し（FAIL で確認）。
2. **耐性判定（B, C, D）**: ホルスのしもべ（P0 の場）下のホルスの黒炎竜 LV4 の攻撃 — `targetableCardsS03` が P1 に対して候補を落とす（P0 自身には落とさない＝相手限定）、応答窓が開かず 次元幽閉 は提示されない、罠は伏せたまま、攻撃は通常どおり進む（ワイトが破壊される）。**対照**: ホルスのしもべ無し → 選べて除外される（B control）、しもべが P1 側にあっても P0 のホルスは守られない（B2）。オベリスクの巨神兵の攻撃も同様（C）。先に攻撃済みのライオウがいても、守られた攻撃モンスターから切り替わらず発動できない（D）。耐性が無ければ候補は現在の攻撃モンスターだけ（D control。先に攻撃済みのライオウは除外されない）。
3. **正常発動（A）**: 攻撃宣言 → 窓で 次元幽閉 を提示 → 発動 → 対象選択 → 解決で攻撃モンスターが除外（`0:banish`）、罠は墓地、ワイトは無傷、LP 変化なし、`pendingAttack` が消え `ATTACK_PENDING_CLEAR_S03`、戦闘ダメージ／破壊なし。
4. **Replay / Save-Load**: 全シナリオ（A, B, B control, B2, C, D, D control, E, F, G, SL1–SL3）で Replay audit が全 digest と最終 digest を再現。Save/Load は実際の保存・再開の道（`saveDuel` → 新 VM → `offerResumeDuel`）: SL1 チェーン上（対象確定済み）で保存 → 再開後に解決し除外・`tg` が載る・最終 digest が無中断の VM1 と一致。SL2 保護された攻撃モンスターの攻撃宣言前に保存 → 再開後も提示されない（耐性は再開後の状態から再計算）。SL3 攻撃宣言の窓を開いたまま保存 → 再開後も窓から発動でき、最終 digest 一致。（`tools/test_s03_u04_lock_recovery.js` の 2VM と同じ方式の VM 往復だが、窓の途中の保存は U296 の `offerResumeDuel` が必要なので、ロード手順は U470 の簡易版ではなくそれを使った。簡易ロードでは窓の続きが消え `pendingAttack` が残るため。）

追加の固定:
- **E（U471 の中止）**: 旧い生の `condition`（VM 内だけ。復元を確認）では窓に提示され、発動すると候補が空 → `PREP_TX_BEGIN_S03` → `PREP_TX_ABORT_S03:insufficient`、選択もチェーンも残らず、罠は**伏せたまま魔法・罠ゾーンへ戻る**、攻撃モンスターは無傷で攻撃は保留のまま、「選択できるカードが足りません」を表示。基点では選択が開いたまま・罠が表で残る（FAIL で確認）。
- **F（連鎖）**: 次元幽閉 にチェーンして 強制脱出装置 が同じ攻撃モンスターを手札に戻した場合、次元幽閉 は手札のカードを除外せず（攻撃モンスターは手札に残る）、エラーなく攻撃が終わる。
- **G（裁定整合）**: 次元幽閉 にチェーンして 安全地帯（攻撃モンスターに「効果の対象にならない」を付ける）を発動しても、攻撃モンスターは除外される（WIKI-AD6B9A8D471E 2011-07-07「除外されます」）。対象耐性は選択時に見て、解決時の不発にはしない。基点でも通る対照（`targets:true` 後も壊れていない確認）。

## 既存の期待値・digest への影響
- 既存の assertion は**弱めず・削除せず・skip せず**、変更もしていない。次元幽閉 を発動する既存テスト `test_s03_u40_attack_declaration_window.js`（18 PASS）・`test_s03_u156_deck_triggers.js`（84 PASS）は無変更で通る。直列ゲートで全 0 FAIL。
- Replay digest: 既存の Replay を含むテストは全て変更なしで通った（直列ゲート 0 FAIL）。対象の保存形は元から `serializeChainSelectionV2`（`targets:true` の有無によらない）で、基点でもチェーンリンクの `targets` は記録されていた。`targets:true` が足すのは `filterTargetable`（対象耐性）と、解決時の発生源 `srcS03.tg`。既存の assertion が digest の固定値に依存して落ちた例は無い。
- 通常の主要デッキ決闘への影響（次元幽閉 は5デッキに入る）: 直列ゲートの決闘系テストは全て通った。

## テスト件数
- 新規 `tools/test_s03_u473_dimensional_prison_targeting.js`: **77 PASS / 0 FAIL**（`tools/check.py` と `tools/script_coverage.py` の `CARD_TEST_FOCUS`（次元幽閉）へ接続）。
- 専用・近接（無変更）: U470 176 / U471 209 / U472 103 / `test_s03_u04_lock_recovery.js` 39 / U40 18 / U156 84 / U468 67 / U459 15 / U456 28 / U457 111 — 全て 0 FAIL。

## Negative control（`cards/00_generic_core.js` の 次元幽閉 だけを戻して再ビルド）
- 全部戻す: 60 PASS / **17 FAIL**（クラッシュなし。ビルド hash `6857149d…`）。落ちるのは 対象の確定（A の 4 件）・耐性（B, C, D 各1件＋ D control 2 件）・中止（E の 4 件）・SL1×3・SL2×1。
- 切り分け: `targets:true` だけ外す 11 FAIL ／ condition の見張りだけ外す 4 FAIL ／ 候補の絞り込みだけ外す 3 FAIL。
- 復元後のビルド hash が最終ビルド（`dist/battle.html` ファイルの SHA256 先頭 `b704ac80c02a4862`…）とバイト一致。

## ゲート
直列 `python tools/check.py`（ログ `C:/Users/81806/AppData/Local/Temp/claude/C--Users-81806-OneDrive-----------/a2787d3c-5bb7-41cd-bf08-fef9602963a3/scratchpad/gate_u473.log`、1回だけ）: **GATE_EXIT=0 / 22894 PASS / 0 FAIL（行頭・大小文字区別 `^FAIL`）/ Traceback 0・ReferenceError 0**、末尾 `PASS no duplicate top-level function declarations`。`TypeError` 1 件は `test_auto_cycle32.js` の既知（基点ゲートにも記録）。
算術: 22894 = 基点 22817 + 新規 77。
注意: ゲート開始後、`test_s03_u473_*.js` が `check.py` の順で走る前に G（4 assertion）を追加した。ゲートが走らせたのは 77 件版（ログに SL3 まで含む）。ゲート後に変更したのは docs と、負の対照の復元後に再ビルドしたもの（hash 一致）だけで、ゲート対象のコードと同一。

## カバレッジ（前 → 後）
`data/script_coverage.json`: TESTED 3588 / GENERIC_OK 644 / NOT_STARTED 405 / ENGINE_GAP 346 / PARTIAL 10 / IMPLEMENTED 3 → **同じ**。次元幽閉 は以前から TESTED（U40）。新テストが `tests` 欄に加わった（行番号の更新もある）。

## 記録の訂正（同じコミット）
**(a) U472 の裁定記録の文言**: メタルシルバー・アーマーの複数対象の例外は墓地を対象にする効果にも適用される。根拠はアーカイブの回答文 `WIKI-32A7C5F81B06`（`answerDate` 2009-06-18、元ページ 《メタルシルバー・アーマー》）が「複数のカードを対象にする効果」と述べ、場所を限っていないこと。例が《ゴッドバードアタック》であることは墓地を除く理由にしない。「ユーザー独自裁定」「ユーザー判断による拡張」「墓地についての個別回答あり」の枠は外し、**「裁定の一般的な回答文に基づく Codex の採用解釈」**として記録した（墓地のケース専用の回答は無い）。実装は無変更（貪欲な壺 / 諸刃の活人剣術 / TGX3－DX2 を含む）。訂正した場所: `docs/S03_U472_REPORT.md`、`docs/RULING_UNRESOLVED_AUDIT.md`、`coordination/CLAUDE_RESUME.md`、コメントのみ `cards/C5_auto_cycle23.js`・`tools/test_s03_u472_multi_target_armor.js`・`tools/test_s03_u471_prep_tx.js`。U470 / U471 の報告の「ユーザー判断が必要」は当時の状態の記録なので残した。

**(b) `finish-work.ps1` の "FAIL lines: N" 誤検出**（UTF-16 のせいではない）:
- `scripts/finish-work.ps1:160` は `Select-String -Pattern '\bFAIL\b'` で数える。PowerShell ではこれは**大文字小文字を区別せず、行のどこにでも**一致する。
- `1103_quick_gate_20261025_013023.log`（`%TEMP%`、UTF-16 LE）の唯一の一致は**153行目の PASS 行**で、ラベルの散文「… the other 14 **fail** a legality check after placement …」の小文字 `fail`。行頭の FAIL は 0、PASS 328、`GATE_EXIT=0`（本単位で再確認: 一致1・`^FAIL` 0・PASS 328）。
- よって原因は「PASS ラベルの散文に対する大文字小文字を区別しない部分一致」で、エンコーディングの問題ではない。確認は行頭・大小文字区別（`grep -c '^FAIL'`）で行い、ログ本体を信頼する。
- 別件（見た目のみ）: このログは UTF-16 だが、日本語が文字化け（`D繝ｻD繝ｻR` 等）で書かれており読めない。
- `scripts/finish-work.ps1` は本単位では**変更していない**。

## Not done / 次
- `scripts/finish-work.ps1` の提案修正（依頼どおり未実施）: `Select-String -CaseSensitive -Pattern '^FAIL\b'`（PASS も `'^PASS\b'` に揃える）。
- WIKI-89BB9D36443F（強制終了: 次元幽閉 にチェーンしてバトルフェイズが終了した場合、除外は処理されない）は今回検証していない（バトルフェイズ終了と除外の相互作用。別単位で測定する）。
- ユーザー指示の後続単位（着手していない。記録のみ）: コスト選択／効果対象の分離（共有エンジン。`API.selectCard` が `targets:true` のコスト選択にも対象耐性を掛ける問題）／`v70SelectExactly` 同型欠陥の調査（`cards/` の23行）／残り約51枚の `targets:true` 候補の監査／中央版 A／`condition` が生のプールを見る約119枚の免疫カード／MANUAL モードの準備／切り詰め Journal のロード。
- ユーザー裁定で挙動維持の RULING_UNRESOLVED 項目は変更なし（氷結界の御庭番の「氷結界」判定 / ターボ・ウォリアーのXyz除外・攻撃対象の付け替え / 機皇城の発動場所 / 救世の儀式の離脱・復帰 / 同姓同名同盟条約の解決時の4体以上・1体以下）。

## 変更ファイル
`cards/00_generic_core.js`（次元幽閉）／`tools/test_s03_u473_dimensional_prison_targeting.js`（新規）／`tools/check.py`・`tools/script_coverage.py`（接続）／`data/script_coverage.json`／`dist/battle.html`・`dist/battle_acode.html`・ルート `battle.html`／コメントのみ `cards/C5_auto_cycle23.js`・`tools/test_s03_u471_prep_tx.js`・`tools/test_s03_u472_multi_target_armor.js`／`docs/S03_U473_REPORT.md`・`docs/S03_U472_REPORT.md`・`docs/RULING_UNRESOLVED_AUDIT.md`・`coordination/CLAUDE_RESUME.md`。消費は取得できないため測定 JSON は作っていない（null）。
