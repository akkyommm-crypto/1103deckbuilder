# S03-U484 — 非 P1.1 の召喚・反転誘発を保存すると、召喚成功後の応答窓が消える

出所: `docs/S03_U483_REPORT.md` の 4-b（U483 が再現まで行い、共有エンジンの設計判断なので実装を保留した項目）。
ユーザー判断により、保存・再開で応答窓が消える問題を最優先として実装した。

## 1. 症状と実害

相手の召喚に対してクイックエフェクトで応答する機会（「召喚成功後のクイックエフェクト確認」= POINT `summonFast` / `flipFast`）が、
**セーブして再開した場合だけ失われる**。

決定的な再現（本単位の試験がそのまま回す）:

1. 自分が 《E・HERO エアーマン》 を通常召喚する（相手の場には対象になるモンスターと、前のターンに伏せた 《月の書》 がある）
2. 召喚誘発がチェーンに乗った所でセーブする
3. 新しい VM で再開して解決まで進める
4. **保存なしなら相手の応答窓が 1 回開く。再開した側では 0 回。**

最終 digest は一致するので、盤面が壊れるわけではない。失われるのは**相手の応答機会**で、
ランダム方策の試合では分岐し、実際の対戦では「セーブ再開した側だけ 1 回応答できない」という不公平になる。

## 2. 原因

チェーン終了後の継続は、`EVT_V2_STATE.after` という**クロージャ**に入る（`engine/40_legal_script_engine.js` の `startEventChainV2` が `EVT_AFTER` を引き取る）。
クロージャは当然セーブできないので、新しい VM では消える。

P1.1 の発動経路（`commitPreparedActivationV11`、`engine/30_processor_chain_battle.js`）は、同じ継続を CHAIN_ADD の `eventResumeV11` にも載せており、
reducer が `gameState.eventChainResumeV11` へ書くので保存・再開を跨げる。`processChainEndV30` はこの状態があればクロージャより優先する。

**非 P1.1 の `finishPrepare` の CHAIN_ADD はこれを載せていなかった。** そのため継続はクロージャだけに残り、保存で消えていた。

該当範囲（実行時走査）: 召喚・反転誘発の `passive`（`onNormalSummon` / `onSpecialSummon` / `onFlip`）を持つスクリプト **518 本**のうち、
P1.1 宣言ありは **22 本**だけで、**残り 496 本がこの欠陥の対象**だった。

## 3. 直し方（U483 の提案から変えた点）

U483 の提案は「`finishPrepare` の CHAIN_ADD に `opts.eventSelectionV11.resume` を足す」だった。これだけでは**危険な前提**が残る。

`eventSelectionDescriptorV11`（`engine/1O_activation_event_continuation_v11.js`）は `resume` を
**待機中のプロセッサ unit の payload から再導出**していた。`EVT_AFTER` に入っているクロージャが別の場所で作られたもの
（`engine/70_summon_procedures.js` の 240 / 290 / 813、`flushDeferredEventsV2`）だった場合、
データの継続とクロージャが食い違い、**別物の継続に差し替わる**。
`processChainEndV30` はデータがあればクロージャを捨てるので、差し替えは黙って起きる。

そこで、**継続を設定したその場所で、同じ継続の JSON 版も作る**ようにした。

| # | ファイル | 変更 |
|---|---|---|
| 1 | `engine/30_processor_chain_battle.js` | `EVT_RESUME_DATA_V484` を宣言し、`processEventV27` と `processEventBatchV28` が `EVT_AFTER` を作るその場所で `{processor:true,postPoint}` を一緒に記録する |
| 2 | `engine/40_legal_script_engine.js` | `startEventChainV2` が `EVT_V2_STATE.resumeData` へ引き取り、`EVT_AFTER` と同じように消費する |
| 3 | `engine/1O_activation_event_continuation_v11.js` | `eventSelectionDescriptorV11` は再導出をやめ、記録された `st.resumeData` を読む。`restoreEventSelectionV11` は復元した窓にも `resumeData` を持たせる（復元後に選んだ分の継続が落ちないように） |
| 4 | `engine/30_processor_chain_battle.js` | 非 P1.1 の `finishPrepare` の CHAIN_ADD も `eventResumeV11` を載せる（`resume` がある時だけ。無い経路の Journal は今までどおり） |

これで「データの継続 = 実際に捕まえたクロージャ」が**構造的に**保証され、推測が消える。
現状の DUEL モードでは `EVT_AFTER` を作るのは `processEventV27` と `processEventBatchV28` の 2 箇所だけで
（他は `PLAY_MODE!==DUEL` の経路か、プロセッサを通らない `flushDeferredEventsV2`）、
その 2 箇所のクロージャは `resumeEventProcessorV11({processor:true,postPoint})` と**完全に同じ**であることを確認した。
3 はその監査結果に依存しない形にするための変更でもある。

### Journal と Replay digest への影響（申告）

非 P1.1 の召喚・反転誘発のチェーンでは、CHAIN_ADD からチェーン終了までの間 `gameState.eventChainResumeV11` が存在するようになる。
`engine/06_replay_rng_v41.js` は状態 digest に `ECR` を含めるので、**その区間の digest は変わる**。
Replay 監査はパッケージから作り直すので整合しており（本単位の試験でも全件 PASS）、
影響は「この変更より前に保存した Replay の、その区間の digest が一致しなくなる」ことに限られる。
`EVENT_RESUME_V11` Action が非 P1.1 の流れにも現れるようになる点も同じ性質の変更。

## 4. 試験

`tools/test_s03_u484_summon_trigger_resume.js`（**56 PASS / 0 FAIL**）。`tools/check.py` と `tools/script_coverage.py` に配線済み。

- **配線の固定**: `EVT_RESUME_DATA_V484` を設定するのは 2 箇所だけ / `eventSelectionDescriptorV11` が `processorWaiting` を見ない / `prepareDuelActivation` が `eventResumeV11` を載せる
- **母集団の固定**: 518 本・P1.1 22 本・非 P1.1 496 本（分類が静かに変わったら FAIL する）
- **実経路の突き合わせ**: 4 枚を保存なしで通した結果と、「誘発リンクがチェーンに乗った所で保存 → 新しい VM → 再開 → 解決」の結果を、
  **作られた窓の並び・実際に開いた窓の並び・最終 digest・Replay 監査**で比較
  - `E・HERO エアーマン`（`onNormalSummon`、EVENT）
  - `魔導戦士 ブレイカー`（`onNormalSummon`、EVENT）
  - `スノーマンイーター`（`onFlip`、EVENT → `flipFast`）
  - `終末の騎士`（`死者蘇生` による特殊召喚 → EVENT_BATCH の `postPointS03`）
- 窓が**実際に開く**盤面にしてある（相手に前のターンに伏せた 《月の書》 を置く）。応答できるカードが無いと POINT 窓は開かずに閉じるため、
  これが無いと保存あり/なしの両方で 0 回になり、試験が素通りする
- 継続が**一度だけ**使われて消えること（窓が二重に開かないこと）も固定

### Negative control

再開直後に復元された継続（`gameState.eventChainResumeV11`）を消すと、4 枚すべてで窓が**作られず・開かない** — これが修正前の挙動。
修正の効果がこの状態に由来することを示している。

## 5. 未解決（この単位では触っていない）

1. **《暗黒界の龍神 グラファ》の手札確認**（次単位）。ユーザー裁定は①:
   - 対象がいなくても強制誘発はチェーンに載せる — 現状維持。根拠は**他カードの当時 FAQ からの採用判断**
     （WIKI-AA425BA7DAF5 NEPTUNE 2009-12-29、WIKI-6C057DCC8B74 ヴァンダルギオン 2005-03-14）
   - 対象消失などで破壊できなかった後の**手札確認は行わない** — 根拠は**グラファ自身の FAQ**（WIKI-9A95D36090C4、2011-06-18）
   - 根拠の性質が違うので、報告でも区別して記録する
2. **`gameState.timingWindow` の不一致**（U483 の 4-a）。保存なし側にも不要な窓が残っているため、
   「古い召喚窓をそのまま保存する」のは不適切。正しいタイミングで閉じ、再開後も一致させる必要がある
3. `emitEvent` の直接発火で uid を持たないイベント（`onKarakuriPositionChange`）は再開後も複製のまま。読む側が同一性で比べないので現在は無害（U483 の 4-c）
