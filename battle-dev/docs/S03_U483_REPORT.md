# S03-U483 — `event.card` 同一性の残存範囲の測定（U482 がどこまで閉じたか）と、その閉鎖の固定

基点: `claude/work` `6fe48e88`（Codex の検証済み U479–U482 `df27bfdf` + 文書のみ）。基準ゲートは Codex の U482 最終直列ゲート **23979 PASS / 0 line-leading FAIL / GATE_EXIT=0**。`6fe48e88` は文書だけを足したコミットで、ユーザー指示（検証済みの同一コードで全体ゲートを繰り返さない）により**基準は再測定していない**。単一ライター、`claude/work` のみ、push なし。

## 結論（この単位が通った経路と理由）

- **経路 1（閉鎖の固定）を通った。** U482 の共通修正で、event のカードの同一性比較は DUEL の経路でほぼ閉じていた。再現できる残存（保存・再開で誤った結果になる経路）は**見つからなかった**。測定の証拠と、静かに戻らないための回帰テスト（`tools/test_s03_u483_event_identity_closure.js`、361 PASS）を足した。エンジン・カードの変更はない。
- **経路 2（グラファ）は再現したが、修正を保留した。** グラファの `done([])` で「対象 0 のまま発動する」ことは再現できた。しかし 1103 の裁定が前提（対象が無ければ発動しないのが正しい）と**衝突**する（下の 5）。裁定の判断はユーザーのものなので、実装・テスト一式を scratch に残して返す。リポジトリには入れていない。

## 1. 母集団の導出方法と、訂正した数（U477 の「約 70」を置き換える）

**方法**（正規表現でファイルの文面を走査せず、実行時の関数本体で行った。U476 と同じ流儀）:
1. ビルドした `dist/battle.html` を harness で読み、`CARD_SCRIPTS` の全エントリの入れ子の関数（深さ 4）と、`EFFECT_REGISTRY_V4`（統一効果 v4）の全効果の関数を集めた: **25,418 関数**（`CARD_SCRIPTS` 3,601 本 / v4 効果を持つ 1,726 カード）。グローバル関数 4,326 本の `toString` も集め、スクリプト関数から呼ぶグローバル補助関数を**推移的に**解く（`darkWorldDiscard`・`c2SummonedOrFlipped` のように補助関数の中で比べるものを漏らさない）。
2. 各関数の本体で「event のカード」（`ctx.event.card`、`const ev = ctx.event` / 引数 `ev|evt|event|e` 経由、`const c = ev.card` の別名）を **同一性で比べている**もの（`===` `!==` `==` `!=`、`indexOf` `lastIndexOf` `includes`）を数えた。
3. 役割（passive / condition / 解決段階 = resolve・operation・afterResolve）で分けた。

**訂正した数**:

| 区分 | 本数 |
|---|---|
| event のカードを同一性で比べる処理に（直接または補助関数経由で）届くスクリプト（全役割） | **447**（うち自身の関数本体に比較があるもの 135） |
| そのうち passive / condition だけで比べるもの | **428**（condition+passive 332 / passive のみ 75 / condition のみ 21） |
| **解決段階**（resolve / operation / afterResolve）に届くもの | **19** → 同一性だけで比べる真の **17 本** + 誤検出 2 本（カラクリ将軍 無零: 比べているのはカードで event ではない / 死霊ゾーマ: `eventIsSelfS03` が uid も比べる） |
| 解決段階が event のカードを**読むだけ**（`API.destroy(ev.card)` 等。比較ではない）でこの 17 本と別のもの | 21 本 |

U477 の「約 70 本」は、解決段階の本文に `event.card` と比較演算子が同居するものを数えた静的な目安で、実態と食い違っていた（解決段階の真の同一性比較は 17 本、passive / condition 側が 428 本で、後者は U482 より前から生きたカードを受け取る経路）。

解決段階の 17 本（全て固定済み）: 夜叉 / 月読命 / 砂塵の悪霊 / 鳳凰 / 竜宮之姫 / 磨破羅魏 / 伊弉波 / 金華猫 / 氷結界の神精霊 / 封魔の伝承者 / アルカナフォース I・VII・XVIII・0 / 異次元への案内人 / 暗黒のミミック LV1 / ワーム・ルクイエ（`c2SummonedOrFlipped` / `e7MoonJustSummoned` / `e9SelfSummoned` を共有するスピリット等の「自分が召喚・反転した」判定）。

## 2. 経路の区分: U482 が届く所・届かない所（実測）

スクリプトに event を渡す入口を全て洗った。`makeContext` の呼び出し 17 箇所と、`emitEvent` の直接呼び出し 9 箇所（試験で件数を固定）。

| 経路 | スクリプトが受け取る event のカード | 根拠 |
|---|---|---|
| passive / 誘発の収集（`collectHandlers`） | 生きたカード | イベントは `deferredEvents`（uid）を通り、`processEventV27` / `processEventBatchV28` / `flushDeferredEventsV2` が `restoreEventRefsV27` で復元してから渡す |
| condition（選択時の合法性確認 `strictScriptLegalityV2`）・誘発選択の窓の再開 | 生きたカード | `restoreEventSelectionV11` が `restoreEventRefsV27(c.event)` で復元（試験の NC2 で確認: 外すと窓の候補が複製になる） |
| resolve / afterResolve（チェーンのリンク） | 生きたカード | U482（`preparedChainContext`）。外すと 17 本全てが誤った結果（NC1） |
| 登録済みの選択継続（419）・スケジューラ継続（109）・X素材コスト仕様（`detachCostS03` の 14 関数） | event を読まない | 全て 0 件（引数は JSON の uid）。`ctxFromPreparedDescS03` が渡す uid だけの event を読む仕様も無い |
| 応答（`activationResponseOptsS03`）の `onActivateSuccess` | uid だけ（設計）。card を持たない | 読むスクリプト（朱光の宣告者・盗賊の七つ道具・六武衆の影武者）は `kind` / `uid` / `chainId` を読み、event のカードを比べない |
| `event` に uid が無い直接発火（`emitEvent("onKarakuriPositionChange", {player, card})`、メインフェイズの手動の表示形式変更） | 保存後は**複製のまま**（U482 は uid が無いと戻せない） | 実際に駆動して確認（下）。読むスクリプト（カラクリ大将軍 無零怒）は event.card の表裏・名前だけを見て同一性では比べず、保存あり/なしの結果は同一。**潜在**: 将来ここで同一性比較を書くと誤る |

**実際の経路の駆動（計装）**: スクリプトの `condition` / `cost` / `selectTargets` / `resolve` / `afterResolve` / `passive.*` / v4 効果の全関数を包み、第 1 引数の `ctx.event` のカードが生きたカードか（uid で引いた実体と同一か）を呼び出しごとに記録した。R1 の実戦ドライバ（`r1_duel_driver`、ランダム方策、応答あり）を **12 試合（暗黒界・HERO・六武・カラクリ・ワーム・エージェント・デブリ・BF・ジュラック・TG・ドラグニティ・ウサギの組合せ）、保存・再開を全停止点（選択・チェーン・誘発窓・POINT・召喚窓・フェイズ）で**行って走らせた。

- 計装呼び出し 18,484 回（保存・再開 4,770 点: 誘発窓 104・チェーン 283 を含む）: **`CARD-DETACHED` / `CARDS-DETACHED` は 0**。出たのは (a) 応答経路の uid だけの event（上の表、設計）、(b) 場に存在しない uid（トークン・EXデッキへ戻ったカード）のみ。
- **計装の感度の対照**: 同じ計装で U482 の復元だけを外すと、4 試合で解決・後処理に 30 回（resolve 16 + afterResolve 14）の `CARD-DETACHED` が出た。

**保存あり/なしの差分試験**: 同じ試合を保存・再開なしと、選択以外の全停止点で保存・再開ありで走らせ比較（8 組、決着ターン・LP・Journal 件数）。6 組は**完全一致**（暗黒界ミラー含む）。2 組は食い違ったが、原因はいずれも event の同一性ではなかった（4 の a・b）。

**保存データの中の他のカード参照**: 4 試合の全保存点で `gameState` の `players` の外にあるカードのオブジェクトを走査した。`chain[].event.card`（U482）のほかは `battle.flippedCard`（engine/1Q が uid で保存し復元）、`pendingExV2.exCard / materialCards`（そのカードの唯一の写し）。`lastBattle` は `relinkLastBattleAfterLoadS296` が uid で繋ぎ直す。新しい同一性の暴露は無い。

## 3. 再現した（U482 より前の）誤った結果

U482 の復元だけを外して同じ 17 本を実際の経路（通常召喚 / 反転召喚 → 誘発 → チェーン → 保存 → 新 VM → 再開 → 解決）で駆動すると、**17 本全て**が誤った結果になる（試験の NC1: 77 件 + event.cards の 2 件が FAIL）。解決は「自分が召喚・反転した」枝ではなく別の枝に落ち、何も起こらない: スピリットの目印 `c2SpiritTurn` が付かない・夜叉が相手の伏せカードを戻さない・ミミックがドローしない・ムーン / フールのコイントスが行われない・案内人のコントロールが移らない・封魔の伝承者の属性宣言が開かない。最終 digest は無中断の結果と異なる。これは U482 が閉じた範囲そのもので、今回の再現ではなく**閉鎖の証拠**である。

U482 の修正を入れた現在のツリーでは、17 本全てについて、(i) 保存なし (ii) チェーン上で保存 → 新 VM で再開 のいずれも、受け取る event のカードは生きたカード（`resolve` / `afterResolve`）、同名の別個体（先から場にいる同名カード）は目印を持たず、全ての追跡カードの位置と最終 digest が無中断の結果と一致し、Replay 監査が通る。さらに 夜叉 / 異次元への案内人 / 暗黒のミミック LV1 は**誘発選択の窓が開いている時**の保存・再開（窓が同じ候補だけで開き直り、候補の event のカードが生きたカード）も確認した。

## 4. 見つけたが直さなかったもの（event の同一性ではない。共有エンジンの設計判断なのでユーザーへ）

a. **`gameState.timingWindow`（`{kind:'summon', turn, action}`）が保存・再開で失われる。** 保存なしでは、特殊召喚で開いた「召喚」の窓がそのターン中ずっと残り、メインフェイズのメニューが「召喚成功時」の効果（例: グリーン・ガジェット）を出す（発動を試みると 1103 のルールで断られる）。再開後は窓が無く出ない。`R1` の 1 組（tg_gadget × tg_skill、seed `0x52311015`、ターン 7）で `getLegalZoneActions` の結果が `["effect"]` と `[]` に分かれることを直接計測した（`strictScriptLegality` の理由は `timingCheck`）。結果は無害（断られる操作が出るか出ないか）だが、ランダム方策の試合が分岐する。`timingWindow` は Journal に載らない設計（engine/1X・1ZZP）。
b. **非 P1.1 の召喚誘発のリンクがチェーンにある状態で保存すると、召喚成功後の `summonFast` POINT 窓が失われる。** 再現手順（決定的）: 相手に伏せた 王宮の弾圧、自分がカラクリ商人 壱七七（または E・HERO エアーマン）を通常召喚 → 誘発が積まれたチェーンで保存 → 新 VM（`EVT_AFTER` / `CHAIN_AFTER_V2` を消す）で再開 → 解決。保存なしでは POINT `summonFast` が 1 回開くが、再開後は 0 回（2 本とも）。原因の見立て: P1.1 の `commitPreparedActivationV11` は CHAIN_ADD に `eventResumeV11`（`desc.eventSelectionV11.resume`）を載せるが、非 P1.1 の `finishPrepare` の CHAIN_ADD は載せないので、`gameState.eventChainResumeV11` が無く、チェーン終了後の継続（`postPoint`）がクロージャ（`st.after`）だけに残って保存で消える。直し方の候補は `finishPrepare` の CHAIN_ADD に `eventResumeV11:opts.eventSelectionV11&&opts.eventSelectionV11.resume` を足すこと（Journal の CHAIN_ADD と `EVENT_RESUME_V11` の形が変わる共有エンジンの変更なので**実装していない**）。`R1` の 1 組（karakuri × worm、`0x52311012`、ターン 21）で観測し、上の最小再現で確認した。
c. `emitEvent` の直接発火で uid を持たない `onKarakuriPositionChange`（2 の表）: 潜在。読む側は同一性で比べないので現在は無害。

## 5. グラファの `done([])`（経路 2）— 再現と、保留した理由

**再現**（実際の経路: 相手が 手札抹殺 を発動、グラファが捨てられる。`tools/test_s03_u476_selection_targets.js` の盤面）:

| 盤面 | 現在の結果（計測） |
|---|---|
| 相手の場に 対象にできるモンスターが 1 体 | 誘発が積まれ、対象を選び、破壊、手札確認 1 回（正常） |
| 相手の場が 対象耐性（オベリスクの巨神兵）だけ | **誘発がチェーンに積まれ（`CHAIN_ADD`）、対象 0 のまま解決し、手札確認（`GRAPHA_PEEK_S03`）が行われる。** トースト「選択できるカードが足りません」は出るが、`PREP_TX_ABORT_S03` は無い（`requestChoiceV49` の断りを `selectTargets` が `done([])` で握りつぶす） |
| 相手の場にカードが無い | 同上（`!foes.length` の早期 `done([])`） |

**試した修正 A**（断りを握りつぶさない）: `done([])` を呼ばないと U471 の `PREP_TX_ABORT_S03:insufficient` で発動前へ戻るが、グラファは**強制**の誘発で窓から外せず、同じ誘発を選び直しては戻る**無限ループ**になる（計測: 900 反復で `PREP_TX_BEGIN/ABORT` の繰り返しとトースト連発）。単独では直しにならない。
**試した修正 B**（`condition` が先に断る: 対象にできる相手のカードが無ければ誘発を出さない。U470 の `condition` の流儀）: ループせず、チェーンにも載らず、手札確認も行わない。実装とテスト（46 件）まで作った。パッチは下に付す。

**保留した理由（裁定の衝突）**: 修正 B は「対象が無ければ発動しない」を前提にしているが、1103 の裁定は強制の誘発について**逆**を述べる。
- **WIKI-AA425BA7DAF5**（《The tyrant NEPTUNE》、answerDate 2009-12-29）: 強制の誘発は、対象に選ぶモンスターが存在しない場合でも発動し、チェーンブロックが作られる、という趣旨の回答。
- **WIKI-6C057DCC8B74**（《冥王竜ヴァンダルギオン》、answerDate 2005-03-14）: 特殊召喚成功時の誘発に対象が存在しない場合は、発動しないのではなく、発動して不発になる、という回答。

これに従えば、グラファの強制誘発は対象が無くても**発動してチェーンブロックができ、何も破壊せずに解決する**（現在の「チェーンに載る」挙動は裁定どおり）。現在の挙動で誤っているのは「その後に手札確認まで行う」点で、**WIKI-9A95D36090C4**（answerDate 2011-06-18; 対象が処理時に消えて破壊できなかった場合、手札をランダムに確認する処理は行われない、という回答）に反する可能性が高い。これはユーザーが範囲外と指定した項目（対象が消えた時の手札確認）と同じ根の問題で、本単位では触っていない。

さらに修正 B は既存の 2 本の期待値を変える: `test_s03_u54_dark_world_discard_event.js` の「B: グラファが自分の効果の捨てで誘発として出る」と `test_s03_u477_dark_world_resume.js` の「MU real path」は、相手の場にカードが無い盤面でグラファが**出る**ことを期待している（修正 B では出ない）。期待値の変更・削除は私の判断ではないので、どちらも変更していない（現ツリーで両方 PASS）。

**ユーザーに判断してほしいこと**: (1) 強制の対象誘発で対象が無い時は「発動してブロックが作られ、不発」（NEPTUNE / ヴァンダルギオン）を 1103 の正とし、グラファは現状維持 + 手札確認だけを直す（WIKI-9A95D36090C4 の項目として）— 修正 B は採用しない。(2) 現行の公式の扱い（対象が無ければ発動しない）を採り、修正 B と 2 本の fixture 変更（相手の場に対象を 1 体置く。assertion 自体は変えない）を許可する。いずれも本単位ではコードに入れていない。

修正 B の核心（scratch に全体を保存）:
```js
function graphaTargetsS03(ctx){
  const foes = API.fieldCards({player:ctx.opponent, filter:x=>x.card});
  return filterTargetable(foes, ctx.player, targetEffectSourceS03(ctx.player, {uid:ctx.card && ctx.card.uid, name:"暗黒界の龍神 グラファ"}));
}
// condition: if(darkWorldDiscard(ctx)){ if(!graphaTargetsS03(ctx).length){ ctx.reason="効果の対象にできる相手のカードがありません"; return false; } return true; }
// selectTargets: requestChoiceV49(...) の戻り値で done([]) を呼ばない（condition が先に断る）
```

## 6. 変更

- `tools/test_s03_u483_event_identity_closure.js`（新規、361 PASS）: 母集団の走査の固定（解決段階 17 + 分類済み 2、新しい本が入ると FAIL）／登録済み継続・スケジューラ・X素材コスト仕様が event を読まないことの固定／`makeContext` と `emitEvent` の呼び出し箇所の固定（ソースを読む）／17 本の実経路駆動（保存なし・チェーン上で保存・新 VM で再開・同名の別個体・各段階が受け取るカードの生死・Replay 監査）／誘発選択の窓での保存（3 本）／`event.cards` の復元と、無いカードを同名で代用しないこと／uid の無い直接発火（無零怒）の保存・再開。
- `tools/check.py`・`tools/script_coverage.py`（配線、`CARD_TEST_FOCUS` に実際に駆動した 18 枚）。`data/script_coverage.json` はゲートの再生成。`docs/S03_U483_REPORT.md`・`coordination/CLAUDE_RESUME.md`。
- エンジン・カードの変更なし（`dist/battle.html` の SHA256 は基点と同じ `08d98f1c…`）。

## 7. 検証

- 新規試験: **361 PASS**（0 FAIL）。近接試験（グラファ・暗黒界・U471・U481・U482・U04）は基点と同じ件数で 0 FAIL: `test_s03_u477_dark_world_resume` 284 / `test_s03_u482_chain_event_refs` 20 / `test_s03_u481_resolution_non_target` 23 / `test_s03_u471_prep_tx` 202 / `test_s03_u04_lock_recovery` 39 / `test_s03_u476_selection_targets` 168 / `test_s03_u125_dark_world_targets` 16 / `test_s03_u112_gateway_dark_world` 32 / `test_s03_u115_forbidden_lance_immunity` 28 / `test_s03_u54_dark_world_discard_event` 15。
- **Negative control**（エンジンの変更は無いので、試験が固定している U482 の修正を一時的に外した。ビルドし直し、試験を走らせ、元に戻して SHA256 `08d98f1c9cb7a326aef07efafecf75c4d570c245db5d19be98ec56132cf0c05a` に戻ったことを確認）:
  - NC1: `preparedChainContext` の `restoreEventRefsV27(storedEvent)` を外す → **79 FAIL / 282 PASS**（17 本全ての「チェーン上で保存」の枝 + `event.cards`）。
  - NC2: `restoreEventSelectionV11` の `restoreEventRefsV27(c.event)` を外す → **6 FAIL / 355 PASS**（誘発選択の窓の再開: 夜叉・案内人・ミミック）。
- **直列の全体ゲート（1 回、変更・配線後の実ツリー、他の処理は並走させていない）**: `python tools/build.py` → `python tools/check.py`（finish-work.ps1 と同じ同梱の python / node）。**GATE_EXIT=0 / 24340 PASS / 0 FAIL（`^FAIL`）/ Traceback 0 / ReferenceError 0**、最後の PASS 行は `PASS no duplicate top-level function declarations`。`TypeError` 1 件は `test_auto_cycle32.js:342` の既知（基点にもある）。所要 37 分。ビルドの SHA256 は基点と同じ `08d98f1c…`（ゲート前後で不変）。
  - **算術: 24340 = 基点 23979 + 新規 361。** 他のテストの件数は変わっていない。
  - ログ: scratch の `gate_u483_final.log`（リポジトリには入れない）。
  - コミットは同一コードで全体ゲートを繰り返さないため `finish-work.ps1 -NoPush -AsyncGate`（フォーカス試験 = 新規試験のクイックゲート。U477 と同じ扱い）。push・main への統合・公開はしていない。
- カバレッジ（前 → 後）: `script_coverage.py` の集計は **TESTED 3589 / GENERIC_OK 644 / NOT_STARTED 405 / ENGINE_GAP 346 / PARTIAL 10 / IMPLEMENTED 2 → 同じ**（状態の変化 0 件）。18 枚の `tests` 欄にこの試験が加わっただけ。フィクスチャ（ゴブリン突撃部隊・ブラック・ホール・カラクリ兵 弐参六 等）は TESTED を得ていない。

## 8. Not done / 次

- グラファの裁定の判断（5）。判断が出るまでコードに触っていない。
- 4 の a（`timingWindow`）・b（非 P1.1 の `summonFast` POINT 窓）: 共有エンジンの保存・再開の設計。b は修正案あり。
- 個別には駆動していない: 解決段階で event のカードを**読むだけ**の 21 本（夜霧のスナイパー / クラッキング / 地獄の暴走召喚 / つまずき / ねずみ取り / 呪言の鏡 / 粘着テープの家 / アイスバーン / オートマチック・レーザー / ダーク・キュア / 粘着落とし穴 / レアル・クルセイダー / 深黒の落とし穴 / ナチュル・マンティス / D・ゲイザー / メサイアの蟻地獄 / 宝札雲 / サイキックブレイク / 宣告者の預言 / デスルークデーモン / パーティカル・フュージョン）。同じ境界を通り、U482 の試験（ねずみ取り・つまずき・奈落の落とし穴・エアーマン）と上の計装で生きたカードが渡ることは確認したが、カードごとの結果は固定していない。
- 範囲外として記録済み（着手していない）: 道 C（解決時の選択 約 100 本）・中央版 A・免疫 `condition` が素のプールを読む約 119 枚・MANUAL モードの `runScript` のコスト段階とコスト選択宣言表に無いスクリプト・切り詰め Journal の読込・`WIKI-89BB9D36443F`・グラファの手札確認（`WIKI-9A95D36090C4`）・U475 が読みだけで分類した 6 件のコストフック。ユーザー裁定で挙動維持のもの（氷結界の御庭番 / ターボ・ウォリアー / 機皇城 / 救世の儀式 / 同姓同名同盟条約）は変更なし。
