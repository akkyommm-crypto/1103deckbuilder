# S03-U477 — 暗黒界の「効果で捨てられた」誘発の Save/Load（`darkWorldDiscard` の同一性比較を uid へ）

基点: `claude/work` `b4b8f058`（U476、origin と一致）。測定した基点ゲート（直列、クリーンツリー、並行負荷なし）: **23450 PASS / 0 FAIL / GATE_EXIT=0**（U476 の記録 23450 と 一致）。共有エンジンの変更なし（`cards/20_control_counter.js` のみ）。単一ライター、`claude/work` のみ。

**公開ゲート（ユーザー指示）: このコミットは GitHub Actions `verify-battle` が成功するまで integration / 公開の対象外。**

## 修正前の測定（クリーンツリーで再現）
`darkWorldDiscard(ctx)`（`cards/20_control_counter.js:393`）は捨てられたカードを `ev.card !== ctx.card`（オブジェクト同一性）で判定していた。チェーンに載るリンクの `event` は発動準備が受け取った `opts.event` そのもの（`engine/30_processor_chain_battle.js:1475` `event:(opts&&opts.event)||null`）で、生のカード（`card` オブジェクト）を持つ。`saveDuel` → 新 VM → `offerResumeDuel` で JSON を経由するとこの `card` は**複製**になり、解決時（`engine/30:1731` `extra.event=link.event`）の `ctx.card`（実カード）と同一性で一致しないので `null`（誘発しない扱い）を返す。`event.uid` は両方にあるのに、同一性の比較が先に落としていた。

実測（再開後の解決。無中断の VM1 と比べる）:

| ケース | 無中断（正） | 再開後（修正前） |
|---|---|---|
| グラファ・相手の効果（手札抹殺） | 対象（ゴブリン突撃部隊）破壊／グラファは墓地／手札確認 1 回 | **グラファが墓地から蘇生（0:mz）、対象は無傷（1:mz）、手札確認なし** |
| グラファ・自分の効果（暗黒界の門） | 対象破壊／グラファは墓地 | **グラファが蘇生、対象は無傷** |
| ゴルド・相手の効果 | 蘇生 + 対象 2 体破壊 | 蘇生のみ、**2 体とも無傷** |
| ブラウ・相手の効果 | 2 枚ドロー（手札 3） | **1 枚だけ（手札 2）** |
| シルバ・相手の効果 | 蘇生 + 相手が手札 2 枚をデッキの下へ（相手手札 0） | 蘇生のみ、**相手手札 2 のまま** |
| スノウ・相手の効果 | サーチ + 相手墓地のモンスターを蘇生 | サーチのみ、**蘇生の選択が開かない** |
| 同名の別個体が墓地にある（相手の効果） | 新しく捨てられた個体の「破壊」の枝 | **捨てられた個体が蘇生、対象は無傷** |
| 同名 2 枚を同時に捨てる | 2 本とも破壊の枝 | **1 本目が蘇生に落ちる**（2 本目は新しいイベントなので正しい） |

自分の効果で捨てた時のゴルド／ブラウ／シルバ／スノウは、そもそも「さらに…」が無いので結果が変わらない（`darkWorldDiscard` の直接評価だけが `null` になる）。ここまで 8 ケース × 2 面。Save なしでは全て正しい。**修正前の新テスト: 236 PASS / 48 FAIL**（スノウの別件 1 を含む）。

## 修正
1. **`darkWorldEventIsSelf(ctx)`（新規）と `darkWorldDiscard` の置換**（`cards/20_control_counter.js`）: 識別を uid で行う。
   - **両側に uid がある時だけ** uid を比べる（`evUid = ev.uid ?? ev.card.uid`、`ctx.card.uid`）。`undefined === undefined` を一致にしない。
   - **uid がどちらかに無い時の扱い（意図した選択）**: 「全く同じオブジェクト」(`ev.card === ctx.card`) の時だけ一致、それ以外は**不一致（`null`）**。推測で一致にしない。uid の無い複製（保存で複製になった uid 無しのカード）は認識されず `null` になるが、これは直接構成した場合だけで、実際の道では起きない（下）。
   - カードを名指ししないイベント（`card` も `uid` も無い）は比べない（従来どおり）。
   - 修正前に既にあった「uid が両方にあれば不一致なら null」(U54) は同じ結果。**新たに厳しくなる点**: 修正前は「イベントが uid を持ち、`ctx.card` が uid 無し」だと uid の比較が飛ばされて**誘発してしまった**（uid の無い同名カードが墓地にあるとイベントごとに誘発）。修正後は誘発しない。
2. **uid が実際の道で必ず付くことの確認**（`ensureCardUid` をイベント作成側に足す必要は無かった）: イベント作成の `queueDeferredEventV2`（`engine/30:1782` `safe.uid=ensureCardUid(gameState,safe.card)`）、チェーンのイベントの `safeActivationEventV11`（`engine/30:1351`）、発動準備の `preparedActivationDescriptorV11`（`engine/30:1360` `uid:ensureCardUid(gameState,card)`）がいずれも uid を付ける。新テストの「実際の道」ケースで、uid の無いカードを `API.discard` で捨てるとイベントに uid が付き、そのカードだけが誘発することを確認した。
3. **スノウ（別件・同じ関数の隣、Save/Load とは無関係の既存不具合）**: 「相手の効果で捨てられた場合、相手の墓地のモンスター 1 体を特殊召喚」のハンドラ `s03u62.snow-revive` が `API.specialSummon` に `fromPlayer`（`h.p`）を渡しておらず、**自分の墓地の同じ位置のカード**を特殊召喚していた（Save なしの実測: 相手の墓地のワイトキングを選んだのに、墓地にいたスノウ自身が自分の場に守備表示で出た）。`死者蘇生` などと同じ 6 番目の引数 `h.p` を足した（1 引数）。スノウの相手の効果の枝を「カード文どおり」と固定するのに必要だったため同じ単位で直した。下の Negative control で独立に確認。

## 5 つの検証面（各々 Save なし／Save/Load 後。結果は uid で確認）
`tools/test_s03_u477_dark_world_resume.js`（**284 PASS / 0 FAIL**）。盤面は実際の発動の道（暗黒界の門／手札抹殺／鳳翼の爆風）を最後まで駆動し、リンクが解決待ちでチェーンにある状態で `saveDuel` → 新 VM → `offerResumeDuel` → 解決。再開後の全追跡カードの位置／表示形式／表裏・両者の手札枚数・最終 digest が無中断の VM1 と一致することも確認。カード文は `data/carddata.json` の `e`。
1. **自分の効果で捨てた**（暗黒界の門、5 枚）: グラファ＝対象を破壊しグラファは墓地のまま（蘇生ではない・手札確認なし）、ゴルド／シルバ＝蘇生のみ（破壊・手札戻しなし）、ブラウ＝1 枚だけ引く（手札 3）、スノウ＝サーチのみ（相手の墓地は動かない）。
2. **相手の効果で捨てられた**（手札抹殺、5 枚）: グラファ＝対象破壊 + 手札確認が 1 回 + 確認したモンスターを特殊召喚（WIKI-C5DA3921E6E2 / WIKI-86483581427B 2011-06-18）、ゴルド＝蘇生 + 2 体破壊、ブラウ＝2 枚ドロー、シルバ＝蘇生 + 相手が手札 2 枚を戻す、スノウ＝サーチ + 相手の墓地のモンスターが自分の場に表側守備表示（WIKI-06FA0560F6DB / WIKI-456860D51870）。
3. **コストとして捨てた**（鳳翼の爆風: 「手札を1枚捨て、相手のカード1枚を対象として発動」。`cost()` が `{byEffect:false}` で捨てる）: グラファは誘発せず（リンクが 1 本も載らない）、墓地のまま、`discardInfo` が空、`darkWorldDiscard` は null。根拠 **WIKI-0D346E547FFE**（backupDate 2011-07-15、answerDate なし、対象カード＝暗黒界の武神 ゴルド、《ダブルアタック》で捨てるのはコスト扱いなので効果は発動しません）。U474 の分離も確認: 捨てる手札の選択は `selection:'cost'`・`targeting:false`、続く相手カードの選択は `targeting:true`。
4. **同名の別個体**（グラファ 2 枚）: (a) 同名の別の 1 枚がすでに墓地にある（`discardInfo` が残っている）状態で、新しい 1 枚が相手の効果で捨てられる。リンクは新しい個体の 1 本だけ（古い個体は誘発せず蘇生もしない）、イベントの uid は新しい個体、`darkWorldDiscard` は新しい個体を `'opponent'`・古い個体を `null`。再開後は読み込んだ `event.card` が複製（`!== 実カード`）であることを確認した上で同じ結果。名前・id・名前ベースの比較ではこの区別ができない（決め手）。(b) 同名 2 枚を同じ手札抹殺で同時に捨てる: 2 本のリンクがそれぞれの個体の uid を持ち、両方が破壊の枝で解決（再開後も）。
5. **uid が無いカード**（直接構成。実際の道では上記のとおり必ず付く）: MU 1～7 — uid の無い同名 2 枚は互いに一致しない／同じオブジェクトは自分自身と一致する／uid の無い複製は一致しない（実際の道では起きない）／イベントが uid を持つのにカードが無い、またはその逆は不一致／両方にある uid は複製でも一致し、異なる uid は不一致／カードを名指ししないイベントは従来どおり。実際の道: uid の無いカードを `API.discard` で捨てるとイベントに uid が付き、そのカードだけが誘発する。墓地の uid の無い同名カードは誘発しない（修正前は誘発した）。

**U471 の準備トランザクション**（グラファ自分／相手・ゴルド相手で保存点を 2 つ追加）: (i) 誘発の提示窓で保存 → 再開 → 窓が復元され digest が保存時と一致、(ii) 発動準備の途中（対象選択が開いている）で保存 → 再開で U471/S03-U35 の経路どおり「発動を取り消し」て発動前へ戻し（トースト、`prepTxS03` なし、選択なし）、**誘発は失われず再提示されて無中断の結果と同じ**になる。いずれも修正前から同じ結果（変更前後で不変）。
Replay 監査: 全ケース（Save なし／Save/Load 後）で全 digest と最終 digest を再現。

## 既存の期待値
既存の assertion は弱めず・削除せず・skip せず・変更なし。近接テスト 20 本（暗黒界／同じ道／U471／U474／U476 ほか）は基点と修正後で同じ件数・0 FAIL: codex_c01_special_win 18 / s03_u112_gateway_dark_world 32 / s03_u115_forbidden_lance_immunity 28 / s03_u125_dark_world_targets 15 / s03_u129_scapegoat_foolish_lure 18 / s03_u156_deck_triggers 84 / s03_u265_ns37 61 / s03_u280_gap5 67 / s03_u393_seal 20 / s03_u451_mixed_gap 30 / s03_u475_v70_select_exactly 274 / s03_u476_selection_targets 167 / s03_u54_dark_world_discard_event 15 / s03_u62_legacy_choice_migration 23 / v800_batch31 64 / v920_batch43 30 / s03_u04_lock_recovery 39 / s03_u471_prep_tx 202 / s03_u474_cost_selection_phase 122 / s03_u472_multi_target_armor 103（`near_base` と `near_fix` を比べて完全に一致、全て 0 FAIL）。U476 が「欠陥を期待値にしない」と再開後の解決を固定しなかったゴルド／グラファの箇所は、本単位のテストが正しい結果で固定した（U476 の assertion は変更していない）。

## テスト件数と Negative control
- 新規 `tools/test_s03_u477_dark_world_resume.js`: **284 PASS / 0 FAIL**（`tools/check.py` と `tools/script_coverage.py` の `CARD_TEST_FOCUS`（暗黒界 5 枚）へ接続。フィクスチャ（ワイト・ゴブリン突撃部隊・ギガンテス・手札抹殺・鳳翼の爆風 等）は TESTED を得ない）。
- **Negative control**（`cards/20_control_counter.js` だけを戻して再ビルド）:
  - 全部戻す: ビルド hash は基点と同じ `fec587a2…`。**236 PASS / 48 FAIL**（クラッシュなし）。FAIL の内訳: 再開後に `darkWorldDiscard` が null（グラファ／ゴルド／ブラウ／シルバ／スノウ × 自分・相手の読込リンク）、グラファが蘇生して対象が無傷（上の表の具体的な誤結果）、ゴルド／ブラウ／シルバ／スノウの「さらに…」の消失、同名の別個体、MU 4・6・実際の道、スノウの別件 2。
  - `darkWorldDiscard` の修正だけを戻す（スノウの修正は残す）: **238 PASS / 46 FAIL**。
  - スノウの修正だけを戻す: **280 PASS / 4 FAIL**（スノウ・相手の効果の Save なし／Save/Load の特殊召喚と位置）。
  - 復元して再ビルド → ビルド hash `cfe31ef8…`（修正後）に戻り、ツリーの `dist/battle.html` の SHA256 が一致。

## ゲート
直列 `python tools/check.py`、変更・配線後の実ツリーで 1 回（ログ `scratchpad/gate_u477_final.log`）: **GATE_EXIT=0 / 23734 PASS / 0 FAIL（`^FAIL`）/ Traceback・ReferenceError 0**、末尾 `PASS no duplicate top-level function declarations`。`TypeError` 1 件は `test_auto_cycle32.js` の既知（基点にも同数）。
算術: **23734 = 実測した基点 23450 + 新規 284**（他テストの件数は無変更）。
基点ゲート（ログ `scratchpad/gate_u477_base.log`、クリーンツリー、直列）: 23450 PASS / 0 FAIL / GATE_EXIT=0。**注記**: 最初の基点ゲートは、別の確認（近接テストと R1 掃引の並行実行）で CPU を取り合った状態で動かしたため `test_s03_u305_ui_harness.js` の `r1_duel_driver 0x52310007` が失敗して GATE_EXIT=1 になった（`gate_u477_base_contended_FAILED.log`）。同テスト単独では 16 PASS / 0 FAIL。並行負荷を止めて基点ゲートを最初からやり直し、上の 23450 を得た。**ゲート中に他の処理を走らせると失敗する**。
コミット時は `finish-work.ps1 -AsyncGate`（フォーカステストの quick gate）を使い、同一コードの full gate の繰り返しを避けた。

## カバレッジ（前 → 後）
`script_coverage.py`（ゲート内の更新後の `data/script_coverage.json`）: TESTED 3588 / GENERIC_OK 644 / NOT_STARTED 405 / ENGINE_GAP 346 / PARTIAL 10 / IMPLEMENTED 3 → **同じ**（暗黒界 5 枚は以前から TESTED。`tests` 欄にこのテストが加わる。フィクスチャは加わらない）。状態の変化 0 件。

## 補足: 実戦に近い確認（R1 暗黒界ミラー、保存・再開を全停止点で。固定していない参考測定）
`R1_DECKS=dark,dark R1_RESPOND=1 R1_SAVELOAD=1 node tools/r1_duel_driver.js <seed> 0 80`（修正前の scratch ビルド／修正後）。全 3 シード × 修正前後で、決着・Replay 監査 ok・blocker なし:
- 0x52311003: 修正前 turn 6（132 停止点、undo 22）／修正後 turn 10（201、undo 28）。0x47700001: 修正前 turn 9／修正後 turn 13。0x52311006: 修正前 turn 5（110 停止点）／修正後 turn 10（291 停止点、undo 72）。ゲームの経過は修正前後で異なる（保存・再開で誘発の枝が変わる／スノウの別件修正）。
- 0x52311006 の修正後 `every=1` は 120 秒の VM 制限（`tools/astra_harness.js`）を超える（停止点が多く、save/load と digest が重い。CPU 実測で時間の大半は `v41HashText` / `v41JournalClone`）。scratch コピーで制限だけ 1500 秒に上げると 3 分 53 秒で完走（blocker なし、Replay ok）。無限ループではない。`R1_SAVELOAD_EVERY=6` は同シードで 120 秒以内に完走し、保存なしの試合と同じ結果（turn 7、LP [2800,0]）。
- 保存なし（`R1_SAVELOAD=0`）の 0x52311006: 修正前 journal 553／修正後 581（同じ turn 7・LP [2800,0]）。スノウの別件修正だけを戻した scratch では 553 に戻る → 実戦の暗黒界ミラーでスノウの別件が実際に起きている。

## 見つけたが直さなかったもの（共有エンジン／別単位）
1. **link.event が生のカードを保存し、保存で複製になる設計そのもの**（`engine/30:1475`）。本単位は `darkWorldDiscard` だけを uid へ（`cards/` 内）。同じ形のカードが他にもあるか、静的な目安: 解決時（`resolve` / `operation` / `afterResolve`）の本文に `event.card` / `ev.card` / `e.card` を含み比較演算子もあるスクリプトが **70 本**（王虎ワンフー、死のマジック・ボックス、デュアルスパーク、… 一覧は実行時の `CARD_SCRIPTS` を走査して再現可能）。個別には検証していない（比較が解決の分岐に効くかは不明）。選択肢: (a) 1 枚ずつ uid へ（`cards/`）、(b) エンジンでリンクのイベントを `safeActivationEventV11`（`card` を落として `uid` と `name` を残す）に揃える — 共有エンジンの判断なので触っていない。
2. **グラファの「対象が既に無い時は手札確認しない」**（WIKI-9A95D36090C4 2011-06-18）: 実装は対象の有無に関わらず手札確認を行う。今回は触っていない（Save/Load と無関係）。
3. グラファで対象にできるカードが全て保護されている時（測定はグラファのみ）、`selectTargets` が失敗を `done([])` で握りつぶすため U471 の取り消しは働かず、対象 0 のまま発動する（U476 の他の 4 枚とは違う）。ルール上の正しさは別途判断が要るので期待値にしていない。

## Not done / 次（範囲外、着手していない）
2) 墓守の石版／無欲な壺／ガスタのつむじ風 — 固定 2 対象の宣言（U472 のピンを 5 → 8 本へ、カード名と対象数の見張りを維持）。
3) 霊滅術師 カイクウ／暗黒界の武神 ゴルド — 可変対象数（発動時に決まる）。
4) E・HERO エアーマン／ダスト・シュート — カード選択を解決時（非対象）へ。
範囲外: 道 C（約 100 本）、P1.1 の `commit-targets` 3 か所、中央版 A、約 119 枚の免疫 `condition`、MANUAL モードの `runScript` のコスト、切り詰め Journal の読込、`WIKI-89BB9D36443F`。ユーザー裁定で挙動維持の RULING_UNRESOLVED（氷結界の御庭番／ターボ・ウォリアー／機皇城／救世の儀式／同姓同名同盟条約）は変更なし。

## 変更ファイル
`cards/20_control_counter.js`／`tools/test_s03_u477_dark_world_resume.js`（新規）／`tools/check.py`・`tools/script_coverage.py`（接続）／`data/script_coverage.json`／`dist/battle.html`・`dist/battle_acode.html`・ルート `battle.html`（ビルド）／`docs/S03_U477_REPORT.md`／`coordination/CLAUDE_RESUME.md`。消費は取得できないため測定 JSON は作っていない（null）。
