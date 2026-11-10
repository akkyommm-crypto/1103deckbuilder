# S03-U548 墓地の罠・魔法2枚

実装前coverageでリミッター・ブレイク/Z－ONEはいずれもENGINE_GAP・明示登録なしを確認。既存の自分の墓地到達イベント、候補filter、位置選択SS/対象回収を利用しengine変更なし。手札送りは既存sendHandToGrave、場/デッキ送りはsendToGraveを正しい用途で使用する。
裁定DBは質問本文含め全件読了。Limiter5件: WIKI-E6938D59A2A8 (2010-02-20)、WIKI-AEA00A774890 (2010-09-13)、WIKI-13A9970A6EB9 (2008-10-19)、WIKI-BBCC410DBB6D (2009-11-05)、WIKI-607AD34AAFE3 (2010-07-05)。墓地効果はお触れ/ショッカーで無効にされず、自分の3ゾーンからだけSS。Z－ONE2件: WIKI-32079ACBCD89 (2011-02-24)対象を取る、WIKI-A25E392FB7EB (2011-05-04)チェーン2破壊でも後で強制誘発。
専用20 PASS / FAIL0、最終negative control 7 FAIL、Replay一致。前ビルドnegative control/Replayを実施。要対応701→699、TESTED3651→3653。全体ゲートはU550最終状態で原則1回。
未対応・未確定: Damage計算中の墓地送りは未測定。Z－ONEのチェーン2破壊は測定済み。現行エラッタの名称ターン制限は追加しない。main/サイト公開・実機確認は未実施。

事前母集団確認: 既存カード集合を列挙するテスト/既知pins/近接/旧gap5本/専用の計32本を実行。U548の墓地passive2枚増に合わせU501/U505の数え方・parserは維持して期待数のみ更新（onSendToGrave184、候補321、句259、G時114/場合64、時の組157）。U501 26 PASS/U505 24 PASSで再確認。召喚母集団とU472は変更なし。古い文書の当時件数は保持。

全体ゲートはこの3単位最終状態で計1回、36.796分。26200 PASS / FAIL0、Traceback・ReferenceError・SyntaxError・TypeError 0、GATE_EXIT=0。前回26147+53と一致、ラベル追加58/除去5（旧gapの5件を解禁済み期待へ置換し判定数維持）。gate_verify.pyでGATE_VERIFY OK。ログはscratch/gate_u548_u550_20261110.log。
コードと生成物はゲートで検証した状態を保持する。完了操作はfinish-work.ps1 -AsyncGateによるquick確認・Acode生成・commit・通常pushで行い、その成否とSHAを最終報告で照合する。新SHAのGitHub全体CI成功前は公開しない。
