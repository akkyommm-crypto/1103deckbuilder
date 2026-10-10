# 検証と引き継ぎ

現在の作業ツリーの必須検証が優先。以下は必須ゲートを減らす指示ではない。

- ローカル修正中：実際のDUEL経路の専用テスト、固定乱数・Replay、関連する既存テスト。ルール上の期待結果を確認し、失敗テストの削除や都合のよい期待値変更で通さない。
- ユニット完了：前ビルドでの対照確認、CARD_TEST_FOCUS、状態変更宣言、カバレッジ・監査、規定の全体ゲート。
- 公開前：コードとテストを固定し、検証対象ソース・成果物・ログを対応づける。同じツリーのdistを他のビルドで上書きしない。Acode生成・配布・公開のタイミングは現在の規約に従う。
- ゲート合格後にコードを変えた場合、その結果を新コードの合格として転用しない。日時だけで「同じ版」と判断しない。

## 全文ログはファイルへ、モデルには短い集計

既存の検証ランナーがあれば使う。新しいランナーを導入しなくても、標準出力・標準エラーをログへ保存すればよい。
終了コードはテストプロセス直後に変数へ保存する。後続のechoや集計コマンドの成功をゲート成功として扱わない。

PowerShellの例（作業ツリー内、ログ名は毎回一意にする）：

```powershell
python tools/check.py *> gate_unique.log
$battleGateExit = $LASTEXITCODE
Add-Content -LiteralPath gate_unique.log -Value "GATE_EXIT=$battleGateExit"
# この後のコマンドの終了コードではなく battleGateExit を判定する。
```

Bashの例：

```bash
if python tools/check.py > gate_unique.log 2>&1; then battle_gate_exit=0; else battle_gate_exit=$?; fi
printf '\nGATE_EXIT=%s\n' "$battle_gate_exit" >> gate_unique.log
```

保存後、`scripts/brief.py --root <作業ツリー> --log <ログのパス>` で要約する。
PASS数だけでは合格にしない。終了コード、FAIL、例外、ソースとの対応を確認する。
捕捉済みの既知例外がある場合は、同じ基点での根拠を示して区別する。単に例外文字列を消さない。

報告は「何を直したか／どの版で何を検証したか／未確認は何か」。
自動テスト合格、カードのTESTED分類、全効果実装、実機確認を混同しない。

## このプロジェクトの実運用（2026-10-02統合）

上の汎用手順に対し、1103 S03単位では次の順で行う（実体はメインセッションの作業用スクリプト）。

1. 単位ツリー `1103_work\s03_uNNN` を前単位からコピーし、カード・専用テスト・報告（`docs/S03_UNNN_REPORT.md`、GATE_PLACEHOLDER）を作る。
2. 前単位のビルドで専用テストを実行し、FAILになることを確認する（negative control）。
3. `data/s03_status_changes.json` に宣言し、`tools/check.py` へ専用テストを前単位の次に登録する。
4. build → `script_coverage.py` → `s03_status_audit.py` → 事前スキャン（全テストを前単位と比較）。
   - NONZERO / FAILFILE があればゲートを走らせない。
   - 差分は新規テストの1行だけであること。
5. `python tools/check.py > L 2>&1` → `GATE_EXIT=` を追記する。
   - 判定の条件：
     - `GATE_EXIT=0`；
     - FAIL 0；
     - Traceback / ReferenceError 0；
     - TypeError は `test_auto_cycle32.js` 冒頭の記録済み1件のみ；
     - PASS が前単位＋新規ちょうど。
6. 公開（checkpoint ZIP、LATEST、単位ログ、acode）はメインセッションだけが行う。

## ワークフローv3＋checkpoint集約（S03-U270から）
- 通常単位は上の1〜5をSonnet（battle-implementer）が指定ツリーで順に担当する。事前スキャン＋ゲートは scratchpad の `chain.sh N` で1回だけ実行し、親は同じツリーで重複起動しない。
- 6の公開はメインだけが行い、通常は検証済みの約3単位をまとめて1つのcheckpointにする（`publish_batch.py FROM TO`）。各単位の報告・測定JSONは単位ごとに残す。
