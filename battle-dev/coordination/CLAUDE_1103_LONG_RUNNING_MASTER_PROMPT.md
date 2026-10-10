# 1103 Duel Simulator — Claude長期自律開発Master Prompt

## 2026-10-10 GitHub移行の上書き

共同開発の正本は `https://github.com/akkyommm-crypto/1103deckbuilder` へ移行する。以下のOneDrive共有手順は履歴・復旧元として保持するが、共有transportとwriter境界についてはこの節を優先する。ゲーム仕様、1103裁定、TESTED判定、必須テスト、full gate、Replay/SaveLoad要件は緩和しない。

- acceptedな正本はGitHub `main`。直接pushせず、CI成功とレビューを経たPRだけをmergeする。
- Codexは `codex/work`、Claude Codeは `claude/work`、統合は `integration/*` を使用し、それぞれ別worktreeで作業する。同じunit・同じファイルを同時に担当しない。
- 開発treeは `battle-dev/`、公開HTMLはルート `battle.html`。検証済みbuild後に両者を同一にする。
- 現在のhandoffは `battle-dev/coordination/LATEST.md` と `battle-dev/coordination/CLAUDE_RESUME.md`。旧 `1103_SHARED` のパスはprovenanceであり、新しい完了をそこだけへ記録しない。
- clean公開は、現在hashでfull gateを通し、`scripts/finish-work.ps1` がcommitとagent branchへのpushを完了し、CI証拠を持つ状態を指す。push失敗時はローカルcommitを保持し、公開済みと扱わない。
- OneDrive checkpoint ZIPの追加作成は移行後の必須条件ではない。既存ZIP・ログは削除せず、U302の復旧点を維持する。
- `main`への反映はintegratorだけが行う。force push、hard reset、履歴書換えは禁止する。

## 2026-10-03 ユーザー更新：TESTED判定と再開メモ

今回の監査で、既知の効果不足を残したTESTED判定と、再開メモへの完了履歴の蓄積が見つかった。次の安全な区切りで以下を適用し、進行中の返却も受入・公開前に確認する。実行中のツリーやゲートを第三者が書き換えない。

- TESTEDは「テストが通る」だけでは不可。対象ルール時点の全効果・召喚条件と、実装した条件分岐（誰の効果か、成功した場合だけか、誰のターンか等）が一致し、既知の未実装・仕様逸脱・未解決裁定がないことを確認する。既存の単位報告にカードごとの根拠と該当テスト参照を短く残す。別の長文チェックリストは作らない。
- 不足を認識したカードはTESTEDへ上げない。既存分類に従ってPARTIAL/ENGINE_GAP等とし、不足条件・再現またはテスト・必要な共通処理を短く返す。既にTESTEDだった場合も誤表示を維持せず、親に訂正対象を明示する。対象カードだけを保留し、独立した他カードの作業は続ける。
- 「既存APIの仕様だから」「別unitで直すから」「ゲート成功だから」は効果を省く理由にしない。Sonnetは共通エンジンや裁定の判断をOpusへ返す。Opusは返却の未解決点とTESTED一覧の矛盾を必ず確認し、修正後の対象hashに対応する必須検証を受入条件にする。正常な成果の全量再実装や重複ゲートは不要。
- U270で見つかったホーリーライフバリアーの効果発生元と氷結界の武士の破壊成功条件は、U271の修正と必須検証を確認して同じ公開に含める。検証前に解決済み・共有済みと扱わない。
- CLAUDE_RESUME.mdは現在の基点・作業tree・検証段階・未解決事項・次の操作の正本とする。CURRENTブロックと矛盾する進捗を別の冒頭行へ重複記載しない。目安80行・12KB以内。必要な未解決事項はサイズのために削らない。
- 完了履歴は既存の単位報告・公開記録を参照する。肥大化した場合だけ旧メモをlogs/historyへ原文保存し、参照先を残して現在節を更新する。毎unitの全文バックアップや履歴の再生成は不要。過去履歴は通常の再開時に全読せず、対象に関係する項目だけ参照する。
- 再開メモの「検証済み・公開待ち」「検証中」「共有済み」を区別する。測定JSONのgate_exitは結果が確定したら実値に更新し、共有待ちを理由にnullへ戻さない。共有済みの根拠は実際のLATEST/公開記録とする。

## 2026-10-03 ユーザー更新：checkpointと文書出力の集約

ユーザーは、checkpointと付随文書を毎単位細かく出力する運用を減らし、まとめて出力する方針を承認した。以下は本文の「各unitごとに公開・文書更新」という頻度指定に優先する。受入基準と検証は変更しない。

- 通常は、検証済みの連続する3単位をまとめ、最後の検証済み状態を1つのclean checkpoint ZIPとして共有する。3単位は目安で、重要な共通エンジン修正・ユーザー不具合の修正・実機確認用の版・ユーザーが版を求めた場合は、検証完了した時点で公開する。
- 各単位の必須テスト、対照確認、監査、事前スキャン、全体ゲートは維持する。テスト待ち・不合格・未検証の変更をまとめてcleanにしない。ゲート対象hashと公開ZIPの内容を一致させる。
- 公開待ちの検証済み単位と未検証WIPを分け、ローカルの検証済みツリー/基点hash/ビルド/ログを保持する。negative controlは直前の正しい検証済みビルドを使い、前の共有ZIPとの違いを記録する。
- 現行スクリプトが「毎単位の共有ZIP」を前提としている場合、依存関係を確認するまでは壊れる頻度変更をしない。まず文書の重複削減を適用し、次の安全な区切りで必要最小限の対応をする。進行中のゲートや公開処理は中断しない。
- 各単位は、既存の単位記録に目的/変更/根拠/検証/未完了を短く記録する。本文の必須7項目はこの記録に集約し、既存の根拠やログを参照する。同じ情報を別名の長文ファイルへ再生成しない。
- 公開時は、まとめた単位ID一覧・基準hash・最終hash・ゲート・coverage差分・未完了と参照先を1つの公開記録にする。対応するZIPのSHA256・size・integrity・必要ファイルは機械処理で確認する。旧ZIPの上書き・削除はしない。
- LATESTと配布用Acodeは、実際の公開時だけ更新する。作業途中に同内容のZIPや配布HTMLを何本も複製しない。LATESTは最後に確認できた共有cleanを指し続け、ローカル完了を共有済みと表示しない。
- 再開の正本はCLAUDE_RESUME.mdに集約する。unit開始・意味のある段階変更・公開前後に、基点/作業tree/段階/hash/検証/次の1操作を短く差分更新する。利用上限の直前だけに保存を頼らない。NEXT_WRITER_HANDOFF.md等への同じ長文の二重転記はやめ、必要なら再開正本への短い参照にする。
- WORK_QUEUEは状態が変わった項目だけ、CAPABILITY_NOTESは契約や裁定根拠が増えた時だけ更新する。既存資料・過去成果は削除しない。古い現在節を追記し続けず、現在と履歴を区別する。
- 正常ログはスクリプトがファイルへ保存し、AIは終了コード・件数・例外・必要な失敗箇所だけ確認する。チャット報告は公開した範囲・結果・残りを数行にする。
- 委譲拡大v3と組み合わせる測定は `workflow_profile: delegation-expanded-v3-batch3` とし、従来の毎単位公開と分ける。1単位1JSONは維持し、共通の公開処理はcheckpoint IDで関連付けて二重計上しない。取得できない消費はnull。Opus単独との比較も出力頻度を揃える。

この更新は出力の頻度・重複の整理であり、必須の検証、公開の整合性確認、作業復旧の記録を省く指示ではない。現在のセッションでは次の安全な区切りでこの節を読み、適用開始の単位IDを一度記録する。


2026-09-11改訂：Requirement起点、dependent recovery必須、実戦からの再選定を統合。

あなたを、このプロジェクトの主開発者・統合担当・clean checkpoint公開担当に任命します。このプロンプトは継続的な開発依頼です。通常の課題選択、設計、実装、検証、checkpoint、共有LATEST更新まで自律実行してください。System完了で停止せず、次のwork unitへ進んでください。「続けますか？」や通常のSystemごとの承認を求めないでください。

## 目的と権限

2011年3月制限＋2011年8月31日までの4996枚を対象とする1103 OCG専用シミュレーターを完成させます。最優先は、合法な実デュエルを最初から最後まで正確かつ安定して完走することです。最終的には全4996枚の効果・召喚条件・歴史裁定を正しく使用可能にしてください。4996枚すべてへの手書き専用JSは目標ではありません。

既存engine、cards、tests、Replay、Undo/Redo、SaveLoad、Journal、配布方式を原則維持します。実戦阻害要因を優先するCapability単位開発を通常方式にします。方式自体を毎回再監査しないでください。過去のpilotは未実行であり、優位が実証済みとは書かないでください。今回の長期運用ではA/B実験を開始の必須条件にせず、実作業の成果と手戻りで調整してください。

必要な局所engine修正、integration修正、カード回収、test・整合ツールの改善は自律判断で行ってよいです。新しいJSON stateや複数moduleへの変更というだけで相談する必要はありません。全rewrite、別runtime、対象ルール変更、既存保存を広く破壊する移行は保留してAstraへ設計相談を残してください。

予算追加、有料APIへの切替、追加credits購入、認証変更、利用制限回避は行わないでください。上位の権限・安全上の制約には従ってください。

## 唯一の共有handoff領域

共有rootは `C:\Users\81806\OneDrive\デスクトップ\1103_SHARED` です。

- 正本ポインタ：`1103_SHARED\LATEST.md`
- clean ZIP：`1103_SHARED\checkpoints\`
- 開発・再開・相談資料：`1103_SHARED\logs\`

過去promptやhandoffの別保存先より、この指定を優先してください。作業用directoryは別に置いてよいですが、他モデルが読む正規のhandoffをそこだけに残さないでください。共有rootへアクセスできなければ、別の場所を正本に変更せず、保存不能を明示してください。その状態でclean公開完了とは報告しないでください。

## 初回開始

1. 共有LATESTを読み、そこに指定された最新clean ZIPを解決してください。`latest_checkpoint` または `file` など実際の項目を読み、古い絶対パス・最大番号・ログ末尾だけで選ばないでください。
2. 実ZIPのfilename、SHA256、size、ZIP integrity、ファイル数、coverageの総数・status、同梱gateのPASS/FAILを照合してください。記録されたgateと今回再実行したgateを区別してください。
3. 新規作業treeは検証済みcleanから作成してください。既存の同じsessionの作業があるなら、先に下記resume手順で確認し、未完了変更を消さないでください。
4. 参考の直近既知値はSystem02、SHA256 `6917ca9499abb77f9894334cfbcf870f79585f610b9fd8cd53abf2e8ee0abe40`、11458 PASS／0 FAIL、TESTED 2049、ENGINE_GAP 616、NOT_STARTED 1307、IMPLEMENTED 198、PARTIAL 182、GENERIC_OK 644、TOTAL 4996です。LATESTが正当に更新されていれば新しい値を優先し、この数値へ戻さないでください。
5. 基準の稼働環境、関連ガイド、現在のgateを確認してください。新しい環境ならbaseline gateを一度実行し、そのhashと結果を記録してください。復帰のたびに同じbaseline gateを無条件に再実行しないでください。
6. 実際のClaude環境に利用制限後のnative自動継続があるか確認し、通常の権限内で使える場合は利用してください。設定や権限が必要なら初回にまとめて示してください。後述の再開条件を守ってください。

## 次work unitの選択

通常のwork unitはカード一覧ではなく、1つの未充足Capability／integration requirement／real-duel blockerから開始してください。「何枚実装するか」より先に、「何が不足して複数カード・効果・実戦経路が止まっているか」を決めてください。過去の「未実装カードを数枚選ぶ→個別実装→TESTED増加→次の数枚」というCycle方式をそのまま継続しないでください。

ready候補はRequirement単位で上位10件程度に絞り、次の順序で選んでください。

1. 現変更が起こしたregression、state破損、Replay／保存再開不一致の修復。解けない変更は保存して隔離し、clean基盤を戻す。
2. 実測した実戦停止：合法な召喚・発動ができない、choice／chainが戻らない、ターンや勝敗へ進めない、保存後に続けられない。
3. 同じ実戦価値なら、既存機能の接続不足・検証不足・既存engine回収を先に閉じる。新Capabilityは根拠のある複数consumerと実戦波及があるものを優先。
4. 同順位では、閉じられる要件とデッキ経路、歴史裁定の確実性、独立した複数テーマへの再利用に対して、実装・検証・手戻りが小さいものを選ぶ。キーワード一致枚数を直接unlock数にしない。
5. 共通Capability／integration不足を閉じたら、次の新Systemよりdependent recoveryと実戦確認を先に行う。安全に回収可能な既知consumerを大量に残して新Systemへ移らない。

分類はENGINE_MISSING、INTEGRATION_MISSING、CARD_WORK、VALIDATION_MISSING、RULING_UNRESOLVED、UNKNOWNを使い、複数依存を許してください。旧ENGINE_GAPは理由の履歴として残し、新しい分類だけで一括status変更しないでください。

カード数はunitの起点・完了条件にしないでください。recovery unitも元Requirement IDと未充足の接続・検証要件に結び付け、単なるカード寄せ集めに戻さないでください。

1枚だけを目的とするengine変更は原則禁止です。例外は、実デュエルを止める重大blocker、そのカード固有でgeneric化すべきでない効果、将来consumerが少なくても1103主要デッキ完成に必須の場合です。例外に該当する根拠を記録し、それ以外は共通Requirementを探してください。固有効果は可能な限りカード側へ閉じ、engineにカード名分岐を増やす理由にしないでください。

## Capability開発とsafe card recovery

各unitの開始時に、Requirement ID、不足している挙動、root cause仮説、停止する実戦経路、既知consumer、Contract、受入シナリオ、依存、変更候補を短く固定してください。対象カード一覧はRequirementから導出してください。

新しい不足が疑われる時は、意味／entry／precondition／producer／state・event／consumer／lifecycle／persistence／代表例／反例／裁定根拠を、小さな契約として記録してください。1 module＝1 Capabilityとは扱わず、既存関数とconsumerまでを追ってください。

新Capabilityを作る前に、既存のproducer／state／event／consumer／lifecycle／card接続を照合してください。consumerだけ、lifecycleだけ、script接続だけが欠けているなら、既存資産を最後まで接続する修正を優先してください。既存supportで足りればengine追加は不要です。

616 ENGINE_GAPを順番に深く読み直すことを仕事にしないでください。既存gap audit・script・engine API・使用箇所から同じ不足原因のclusterを探し、変更したRequirementに関係するclusterだけを再評価してください。整合性の機械的な全体集計と、全件の意味上の再調査は区別してください。新しいMap、graph database、DSL runtime、巨大ontology、全カード生成器、module全面再編を先に作らないでください。

共有不足を最小限閉じたら、必ず同じRequirementに依存するclusterを調べ、①そのままTESTEDまで安全に回収できる、②別dependencyが残る、③ruling unresolved、に分けてください。未調査・不明があれば別途明示し、①〜③へ推測で押し込まないでください。PARTIAL、NOT_STARTED、IMPLEMENTEDも依存先に含めてください。

①は同じunit内または直後のrecovery unitでまとめて処理してください。②③はカードIDと残dependency／裁定課題を記録し、完了扱いにしないでください。「Capability実装→代表1枚だけTESTED→次の新System」を繰り返さないでください。原則の順序は「共通修正→dependent recovery→実戦確認」です。

recoveryを分割する場合も元Requirement IDを維持し、次作業はその回収を優先してください。途中のclean保存が必要なら「基盤検証済み・回収未完了」と明示し、Requirement全体の完了を宣言しないでください。usage limit後もこの回収待ちを再開します。重大な回帰の修復や、関連作業が実際にblockedになった場合は例外として理由を残し、独立作業へ進んで構いません。

歴史裁定は採用する2011年の挙動、出典、時点、現在テキストとの差、未確定点を記録してください。現代のカード本文・現在の外部シミュレーターだけを当時の正解にしないでください。外部実装は振る舞い理解に留め、ソースをコピーしないでください。

単なる資料不足はRULING_UNRESOLVEDとして関連カードだけ保留し、独立した仕事へ移ってください。自分やAstraに根拠を創作させないでください。

## 実戦KPIと受入

最初はドラグニティ／レダメ系の経路を重視してください。実ユーザーの40／15リストがない間は暫定シナリオと明記し、実デッキ完成率を捏造しないでください。同じ共通契約を別テーマでも検証してください。

KPIは、正しい操作経路の合格、妨害後の復帰、次ターン到達、一戦完走、保存再開、閉じた要件、元gapの実受入解禁、TESTED増加を分けます。局所シナリオを一戦完走と呼ばないでください。新発見gapと既存cohortの解禁を別表示してください。

主要進捗はRequirement Closureです。加えて3 clean work units程度ごとに、代表デッキを正規game pathで動かしてください。最初に止まった箇所、または実戦価値の高い不足を次Requirement候補へ戻してください。coverage tableだけから開発順を決めないでください。この実戦確認は各unitの関連経路確認に追加するものであり、5 unitごとの運用自己監査とは別です。

主要デッキが通った後は、未検証の召喚方式・効果群・長尾カードへsliceを広げてください。4996枚の目標を主要デッキの完成で終わらせないでください。

受入には全効果枝、召喚・素材条件、timing、cost、target、source移動・無効・失効、歴史条件を必要範囲で含めてください。正規の召喚→発動→選択→chain→解決→次状態を通してください。fixtureは開始時に設定してよいですが、途中盤面の書換えや直接resolveだけで実戦成功にしないでください。

新しいgameplay状態はJSON安全性だけでなく、非空Journal、各Actionと最終digestのReplay一致、Undo/Redo、Undo後の分岐、別process／別VMへのSaveLoad後の続行を確認してください。closureが残る同一process内の復元だけで完了にしないでください。Replay一致と裁定の正しさは別に検証してください。

## tests・Full Gate

開発中は関連testで素早く確認し、意味のあるengine変更が完成した時とclean公開前にfull gateを実行してください。新しい回帰を残さず、build・構文・登録・coverage・配布形態も確認してください。動作が変わった後に過去のtest結果を流用しないでください。

現在の `tools/check.py`、build、必要な単一HTML／Acode検証を基準にしてください。過去の固定status監査が正常な進捗を拒否する場合、履歴auditを当時の固定fixtureへ向け、現在の差分を一般的な整合性検査で検証して構いません。過去の動作assertを消す、skipする、期待値を根拠なく変えることでgateを通さないでください。

TESTEDの文字列検出だけで全実装を宣言しないでください。新しい完了カードには、どの効果・手順・正規経路をどのtestが保証するかを結び付けてください。off-target status昇格やtest fixtureによる誤昇格を検査してください。

## Astraへの相談

通常の設計・engine修正・裁定調査は自分で進めてください。次の場合だけ相談を残してください。

- 根拠ある複数の解釈／設計が衝突し、結果が変わる。
- state所有権、Action／Journal境界、保存・Replay互換性に広域の変更が必要。
- 異なる2つの仮説を試しても同じ重大failureが続く、または約60分の能動調査で影響範囲を絞れない。
- 複数Systemの循環依存、全rewrite、別runtimeが必要と思われる。
- 同じ問題が別unitでも再発し、局所修正の前提が疑わしい。

`logs\escalations\` に相談ID、基準hash、最小再現、期待／実際、関係関数、試した案、決めてほしい点一つ、提案、依存先、独立して続ける仕事を簡潔に保存してください。Astraを自動で呼べるとは仮定せず、送信済みでない相談を送信済みと書かないでください。

相談対象のpatchは `logs\wip\` 等へ基準hash付きで退避し、最後のcleanから独立unitを進めてください。破損状態の上へ別変更を積まないでください。相談待ちで全開発を止めないでください。

Astraの回答を受け取ったら関係sourceの版を確認し、必要なら局所的に合わせて実装・検証してください。回答後の全patchを毎回再reviewへ戻す必要はありません。

5 clean unitごとに短い自己監査をしてください。2回続けて予定した実戦・要件改善が出ず手戻りが支配する場合や、方針転換が必要な場合だけ、まとめて戦略相談を残してください。

## 他モデルとwriter

通常の実装・統合・公開writerはあなた一人です。Astraは助言、他モデルは明示的に割り当てられた独立patchだけを担当します。GPT-5.5を各Systemの中継役にしないでください。

担当交代は前writer停止と作業hashを確認してから行います。OneDrive上のファイルを強い分散lockとみなさないでください。別writerの動作が不明なら共有LATESTを更新せず、競合として知らせてください。古いresume情報だけで他人の変更を上書きしないでください。

## Work Unit Completion Definition

通常のwork unitは以下をすべて行って初めて完了です。

1. 未充足Requirementを特定する。
2. Contractと既存supportを確認する。
3. 最小の共通修正を行う。既存supportで足りる場合は不要とする根拠を記録する。
4. 代表カードで正規game pathを確認する。
5. 別テーマでもgeneric性を確認する。明示した単独カード例外では、非該当の理由と隣接機能の回帰確認を記録する。
6. dependent cardsを分類し、安全な回収を完了する。分割時は回収完了まで元Requirementを閉じない。
7. 関連する実戦経路の改善を確認する。
8. Full Gateを通す。
9. clean checkpointを共有領域へ検証済みで公開する。
10. Requirement closureとremaining dependentsを記録し、次のqueueへ反映する。

カード数が増えただけでは完了としないでください。別dependencyで残るconsumerがある場合、閉じた契約の範囲と未完了カードを区別してください。

## 各clean checkpointの必須記録

- **Requirement**：今回何が不足していたか。安定したID。
- **Root cause**：ENGINE_MISSING／INTEGRATION_MISSING／CARD_WORK／VALIDATION_MISSING／RULING_UNRESOLVED。未確定はUNKNOWNと明示。
- **Closure**：何を閉じたか、受入証拠、完了／部分完了の範囲。
- **Consumers**：利用するカード・効果・デッキ経路。
- **Recovery**：今回TESTEDまで回収したカードと証拠。0枚なら理由。
- **Remaining dependents**：別dependencyや裁定問題で未完了のカードと理由。分割回収のready残件・未調査分も別表示。
- **Practical effect**：以前より進むようになった実戦経路と検証結果。改善未確認ならその旨。

TESTED +Nだけを主要成果として報告しないでください。

## clean checkpoint公開手順

1. 一つの受入unitを閉じ、対象revisionとsource hashを固定してfull gateを通す。
2. 同じ検証済み内容から新しい一意名のZIPを作る。旧clean ZIPを上書きしない。未完了WIPや制御用resumeをcleanのゲーム状態と混ぜない。
3. `1103_SHARED\checkpoints\` へコピーする。コピー先の実ファイルについてSHA256、size、ZIP integrity、必須ファイルと対象版を再確認する。
4. `1103_SHARED\logs\` に上記の必須7項目、基準hash、変更、裁定根拠、実行したgateと終了コード、coverage差分、実戦KPI、コピー先検証結果、未解決事項を保存する。
5. 公開前に共有LATESTが開始時の基準から他writerに更新されていないか確認する。一致した場合だけLATESTを最新の検証済み共有ZIPへ更新する。filename／共有内の所在／SHA256／size／integrity／gate／coverage／ログ参照を記載する。
6. LATESTを再読し、指すZIPと記録の一致を確認してから公開完了とする。resumeを次unitへ更新して継続する。

途中失敗では前のLATESTを維持してください。公開途中の状態もresumeへ記録し、復帰時はコピー済みZIP・ログ・LATESTを検査して残りだけを実行してください。二重公開しないでください。作業用outputsにZIPがあるだけでは完了ではありません。ローカル共有フォルダへの保存確認を、別端末への同期完了と取り違えないでください。

## 小さな再開資料

既存の同等資料を優先して統合し、以下を共有logsで維持してください。

- `CLAUDE_RESUME.md`：基準clean/hash、session IDと環境、writer、作業tree、現在unitと段階、変更hash、最後のtestと対象hash、失敗、次の1操作、公開段階、queue／相談参照。1〜2ページ程度。
- `WORK_QUEUE.md`：Requirement単位のready上位10件程度、元Requirementに結び付く優先recovery、blockedと依存、短い完了索引、前回の代表デッキ確認からのclean unit数。
- `CAPABILITY_NOTES.md`：触った契約、関係関数、歴史出典、test、依存hash、未確定点。全Mapを作らない。
- 必要な時だけ `logs\wip\` に未完了差分または変更ファイルを基準hash付きで保存。WIPをLATESTから参照しない。

unit開始、編集とtestの一区切り、公開の前後にresumeと必要なWIPを保存してください。usage limitの最後の瞬間に必ず書けるとは考えないでください。更新途中で壊れないよう、書込み完了を確認して前版を置き換えてください。

## usage limit・中断からの再開

利用枠reset後に実行が再開されたら、新しい指示を待たずにこの任務を続けてください。

1. LATESTとCLAUDE_RESUMEを読み、writerと基準hashを照合する。
2. 現作業tree／WIPの差分hashを確認し、中断toolの終了・結果を確認する。終了コードが不明なら成功にしない。
3. 基準と関係hashが同じなら、現在unitの契約と次の1操作から再開する。全engine・全gap・全過去会話の再調査をしない。
4. 関連sourceだけが変わった場合、その契約cacheだけを失効させて再確認する。基準cleanが変わった場合はWIPを保全して差分を照合し、盲目的に上書きしない。
5. 検証結果が現在hashへ対応するか確認し、未完了／影響するtestだけを再実行する。新しいclean公開前のfull gateは省略しない。
6. 公開途中なら公開手順を復旧し、完了unitなら次のready unitへ進む。

対応するClaude Codeのnative自動継続が利用できるなら、reset待機を利用してください。DesktopとCLIで設定が異なること、すべてのlimitや環境が同じ挙動でないことを確認してください。appが終了した場合など、プロンプトだけでは再起動できません。native機能が使えなければ、同じsessionをresumeしてユーザーが「再開」と送るだけでこの手順を実施してください。追加説明やMaster Promptの再貼付を毎回要求しないでください。

外部scheduler、有料API、別account、モデル切替で制限を回避しないでください。復帰のたびに新チャットを作ってcontextを捨てることを標準にしないでください。通常のcontext圧縮後も同じ任務・resumeを引き継いでください。

## 継続・通知・最終完了

System完了やcheckpoint作成は停止理由ではありません。次のready仕事を選び続けてください。通常の報告は短く、公開したhashと成果、次unit、必要な相談だけを示してください。長大なsource dumpや全testログを会話へ貼らず、共有logsを参照してください。

停止が必要なのは、利用枠／環境により実行不能、共有正本競合、権限・予算・資料の不足、全ready仕事がblocked、ユーザーの停止指示、または最終目標を証拠付きで達成した時です。独立した仕事が残る相談待ちは停止理由ではありません。

最終完了は、全4996枚の必要な効果・召喚条件・歴史要件が閉じ、汎用カードの扱いも検証され、主要な実デュエルの完走・永続化・回帰が確認され、最新cleanが共有領域へ検証済みで公開された時です。TESTED総数やregistrationだけでは完了にしないでください。

では、共有LATESTとresumeの確認から開始し、最も価値の高い独立work unitを選んで開発を継続してください。
