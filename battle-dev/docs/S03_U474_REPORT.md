# S03-U474 — コストの選択と効果の対象の選択を共有エンジンで分ける

基点: `claude/work` `c8aa65c6`（U473。push 済み、origin と一致）。基点ゲート: **22894 PASS / 0 FAIL / GATE_EXIT=0**（U473 の直列実測）。ユーザー指示により同一ゲートは繰り返さず、変更ごとに専用・近接テストと既存 Node テストの総当たりで確かめ、最後に直列ゲートを1回だけ実行した。単一ライター、`claude/work` のみ。

**状態: 既存テスト期待値の変更が1ファイル（`test_s03_u471_prep_tx.js` の2枚・10 assertion）必要になったため、ワークフロー v3 の規定どおり停止して Opus 判断を仰ぎ、2026-10-25 に Opus が提案パッチを承認した（別案は採らない）。承認の根拠: 「テストを通すための緩和」ではなく「前提が誤っていた観測の是正」。ワーム・キングは assertion の中身を1つも変えず board C でコストを回答してから同じ「候補不足 → 発動前へ戻す」を確かめる形で被覆は失われない。ダーク・アームド・ドラゴンの旧期待は本単位が直した欠陥の産物で、同カードは「フィールドのカード1枚」を対象に取り、アーマーが守るのは装備モンスター以外のモンスターでコントローラー側を相手から守るものなので、同カード自身も魔法・罠も候補から外れず、コストが払える盤面では候補不足が原理的に起こり得ない（存在し得ない事象を主張する assertion は除外が正しい）。裏返しは本単位のテスト §O が固定。P1.1 に段階の印を付けない判断も承認済み。** 下の「既存テストが動いたもの」に、assertion・旧期待が誤りだった理由・1103 の根拠・パッチ・測定を書いた。

## 依頼（ユーザー）
コストのリリース・捨てるカードの選択には効果の対象耐性を適用しない。共有エンジンで「コストを選ぶ処理」と「効果の対象を選ぶ処理」を区別する。ただしリリース禁止などコスト自体の制約は維持する。選択後のコールバックでも区別が維持される設計にする。

## 裁定の探索（正直に）
`1103_rulings_complete_v8_154.zip` → `wiki-rulings.js`（version 8.154.0、10870 件）を、「コスト／リリース／捨てる／墓地へ送る／除外」と「対象にならない／対象にできない／対象にされない／耐性」の組み合わせで検索した。
- **「コストの選択に効果の対象耐性が掛かるか」を直接答えた裁定は無い（アーカイブは沈黙）。** 「対象にならない」系の語を含む回答は 9 件あるが、いずれもコストの話ではない（攻撃対象・復活対象・墓地の対象 等）。メタルシルバー・アーマー（WIKI-32A7C5F81B06 / WIKI-6B27D6D86996、`answerDate` 2009-06-18）、ホルスのしもべ（WIKI-55D203877F99、2010-05-20）、デュアルスパーク（WIKI-A06692FF9169、2010-12-16）の回答も、効果の対象の話だけ。「調整中」の回答でコストと対象を扱うものは 0 件。
- 隣接する裁定（コストと対象が別の段階であることを示す。採用の根拠はこれと一般則）:
  - WIKI-590BE854FBC4（ゴッドバードアタック、`answerDate` 2009-08-12）: 手順は「鳥獣族モンスターをリリースした後に対象となるカードを選択する」。リリースした時点で装備カードもなくなり対象が2枚選べなければ、そもそも発動できない。→ リリース（コスト）が先、対象の選択が後で、別の手順。
  - WIKI-0C9B551C19FA（トラファスフィア、2010-08-06）: ゴッドバードアタックのコストにできる。WIKI-EA6382122EA8（2008-06-25）: 裏側表示の鳥獣族もリリースできる（コストは対象を取る選択ではない）。
  - WIKI-71892D071477（アテナ、2008-01-05）/ WIKI-8B0A6E2F1B51（ゾンビ・マスター、2007-08-29）/ WIKI-A1C78768C7AC（ルミナス、2008-02-26）/ WIKI-F8EAF51796EB（寡黙なるサイコプリースト、2011-02-11）/ WIKI-8CA9D6BFF4BF（創世竜、2011-07-24）: コストで墓地へ送ったカードを、その後の効果の対象に選べる。→ コストとして使うことと「対象に取られる」ことは別の事象。
- **裁定の位置づけ: アーカイブは沈黙しており、採用の根拠は「コストは対象ではない」という一般則だけ。上に挙げた隣接裁定は補強であって直接の根拠ではない。** **採用は「コストは対象ではない」という一般則に基づく**（カード文は「リリースして、…を選択して発動」で、リリース・捨てるは選択の対象ではなく発動のためのコスト）。上の裁定は一般則と矛盾しない補強であり、「耐性はコストに掛からない」と明言した裁定ではない。U457（ヴァイロン・エプシロンのコストを `targeting:false` で開く）も同じ解釈を既に採っていた。

## 欠陥
`API.selectCard`（legacy 互換層、約1444箇所から呼ばれる）は対象耐性の要否 `targeting` を**スクリプト全体**の `targets:true`（`ACTIVE_SCRIPT` または発動準備中の `ACTIVATION_PREP_S03` のスクリプト）から推定する。スクリプト単位の印なので、同じスクリプトの「コストの選択」と「効果の対象の選択」を区別できず、`targets:true` のカードではコスト（リリース・捨てる・墓地から除外 等）の候補にまで `filterTargetable` が掛かった。
- 記録された症状: デュアルスパークがメタルシルバー・アーマーの下でコスト候補が空になる（`選択できるカードが足りません`）／ゴッドバードアタックが、他の耐性で守られた鳥獣族をリリースできない。
- 規模（**訂正**）: 依頼文の「496枚・126ファイル」は Opus 自身の計測誤りで、定義直後の固定長ウィンドウを走査したため隣接する別定義の `cost` 本体を誤って数えていた。**正しいのは本単位の再計測**: `targets:true` のスクリプト 1042 本、うち `cost()` の本文が直接 `selectCard`/`requestChoice` を呼ぶもの 41 本 ＋ COST_SELECTION_FIRST 宣言 21 本（ヘルパー経由のコストは含まない下限）。「496枚を修正した」ではない。
- 実影響（実測、「496枚を直した」ではない。プローブを入れたビルドで既存 Node テスト 694 本を総当たり）: `targets:true` のカードのコスト選択が **73 枚**で実際に開いた。そのうち旧フィルタが候補を減らしたのは **2 枚だけ**（ワーム・キング 1→0、ダーク・アームド・ドラゴン 3→0。どちらも S03-U471 の再現用ピン）。タイトルを全件見て、コストでない選択（本当の対象）が混ざっていないことを確かめた（95 種のタイトル、全部「捨てる手札／リリース／除外／墓地へ送る／デッキに戻す／取り除く」のコスト）。

## 設計（実装したもの）
カード名を見ない。共通エンジンの1か所。

1. **選択の段階（実行時、gameState の外）**: `engine/1ZZW_cost_selection_phase_s03.js` — `SELECTION_PHASE_S03`（`'cost'` か `null`）、`withSelectionPhaseS03(phase, fn)`（try/finally で必ず戻す）、`runCostPhaseS03(run, onDone)`（コストを払う区間を `'cost'` にし、払い終えた継続 `done` は段階 `null` で包む）、`selectionKindS03(v)`（`'cost'` だけがコスト、`'effect'`/`'target'`/未指定は効果）。
2. **発動準備が印を付ける**（`engine/30` `prepareDuelActivation`）: 通常経路の `sc.cost`、COST_SELECTION_FIRST 経路の `selectTargets`（＝コストにするカードの選択）と `cost`。コストを払い終えた継続（`done`）で外すので、その先の `chooseTargets` の対象選択は従来どおり。中止・失敗・例外でも try/finally で残らない。
3. **選択の記録に種別を持つ**（`engine/09` `requestChoiceV49`）: `pendingChoice.selection:'cost'|'effect'` を `targeting` と並べて置く（JSON。Journal の `CHOICE_OPEN_V49` に載り、保存・再開・Undo/Redo・Replay を跨ぐ）。`'cost'` の選択は `targeting` を `false` にし、`filterTargetable` を掛けない。`filterTargetable` を呼ぶのは相変わらず `requestChoiceV49` の1か所だけ。
4. **選択後のコールバックでも区別が維持される**（`dispatchChoiceContinuationV49`）: 継続（legacy の `onPick`/`onCancel`、登録ハンドラ）は、**記録の `selection` で段階を復元してから**実行する。コストの1つ目の選択の `onPick` の中で開く2つ目の選択・確認（`confirm`）もコストのまま、効果の選択の続きは効果のまま。呼び出しスタックではなく記録から復元するので、保存→再開しても同じ（2-VM で確認）。古い保存（`selection` なし）は効果扱い＝従来どおり。
5. **`API.selectCard` の 5 番目の引数** `{selection:'cost'|'effect'}`: 明示は自動の段階より優先。

### 将来のカードがコストの選択と示す方法（優先順）
| 状況 | 方法 |
|---|---|
| `cost(ctx,done)` の中で `API.selectCard`（約1444箇所の標準形） | **何もしない**。発動準備が自動で `'cost'` にする（`targets:true` でも耐性を掛けない） |
| COST_SELECTION_FIRST（`declareCostSelectionFirstS03`）の `selectTargets` | **何もしない**（既定でコストの選択）。その中に**本当の対象**（例: 装備するモンスター）がある分岐は `API.selectCard(title, cands, onPick, undefined, {selection:'effect'})` と明示（アサルト・スピリッツ・D・クリーナンで適用済み） |
| 登録ハンドラ経路（`API.requestChoice` / `p11cOpen`、P1.1） | 登録経路は自分の種別を述べる: コストは `targeting` を書かない（または `selection:'cost'`）、対象は `targeting:true`。`selection:'cost'` は誤って `targeting:true` と書いても耐性を掛けない。登録経路は周囲の段階を**引き継がない** |
| 発動準備の外・`cost` の外でコストを選ぶ | `API.selectCard(…, {selection:'cost'})` または `API.requestChoice({selection:'cost', …})` |
| `cost` の本体の中の本当の対象 | `{selection:'effect'}`（`'target'` は別名） |

コスト自体の制約（リリースできない `cannotTribute`・属性/種族/タイプの指定・素材にできない 等）は、これまでどおり**候補を作る側の述語**にあり、触っていない。

### P1.1（`activationV11`）について（正直に）
依頼は「P1.1 の経路にも印を付ける」だったが、**P1.1 は段階で印を付けず、選択ごとの宣言のまま**にした。理由: P1.1 は登録ハンドラ経路で、対象耐性は選択ごとの `targeting`（明示）だけで決まる。`activationV11` は1回の呼び出しの中でコストの選択も対象の選択も開くため、呼び出し全体を `'cost'` で囲むことはできず（最初の選択が対象の補充要員を誤ってコスト扱いにする）、そもそも**P1.1 にはこの欠陥が無い**。実測: ハンドラ名に `cost` を含む `p11cOpen`（35 箇所）はどれも `targeting:true` を宣言していない（テストの S1 で固定。将来のカードが `targeting:true` を書くと FAIL）。実カードでも確認: ジェム・エンハンス（P1.1: コストのリリース → 蘇生対象）は、神の威光で守られたジェムナイトをコストに選べ、続く対象選択は効果の選択（`targeting:true`）— 保存→再開しても同じ（G3）。**P1.1 のコスト選択の記録 `selection` は `'effect'` と表示されるが、`'effect'` は「コスト以外」の意味であり、P1.1 の分類には使えない（決め手は選択ごとの `targeting`）。** 誤解を招くので `engine/09`（`selection` の行）と `engine/1ZZW` の冒頭コメントにも明記した。挙動は変えていない。ハンドラ名で自動的に `'cost'` と判定する案は、名前に依存する脆い規則なので採らなかった。

## 7 つの固定した挙動（`tools/test_s03_u474_cost_selection_phase.js`、122 PASS / 0 FAIL）
1. **デュアルスパーク × メタルシルバー・アーマー（A）**: コスト候補は空にならず（P1 のデュアルモンスター、アーマーで守られている）、リリースして払え、対象選択（アーマーの装備モンスターだけ）→ チェーン → 解決（装備モンスターを破壊、1ドロー）。Replay 監査。
2. **ゴッドバードアタック（B）**: 神の威光で守られた鳥獣族をコストにでき（旧: 候補から外れた）、効果の対象は U472 の複数対象の規則のまま（アーマー単独で守られたモンスターは対象にできるが、神の威光で守られたライオウは対象にできない）。
3. **効果の対象は同じスクリプトの中で相変わらず絞られる（漏れない）**: A（ライオウ・クリッターが対象から外れる）、B（神の威光のライオウが外れる）、D（サシカエルの「ガエル」）、F（D・クリーナンの装備する相手モンスター／アサルト・スピリッツの装備するモンスター）、N（合成: コスト2段の後の対象）。
4. **コスト自体の制約は維持（D・E）**: サシカエル — リリースできない水族（`cannotTribute`）と水族でないモンスターはコスト候補に出ない一方、対象耐性で守られた水族は出る。泣き神の石像 — チューナーでないモンスターは出ない一方、アーマーで守られた墓地のチューナーは出る。なお「捨てられないカード」のためのエンジンの仕組みはこのコードベースに無い（検索、手札は `filterTargetable` の対象外）— 実カードで固定できる捨てる制約は無いので、制約の例はリリース（`cannotTribute`）と属性/種族/タイプの述語で示した。
5. **COST_SELECTION_FIRST 経路（E・F）**: 泣き神の石像の `selectTargets` が選ぶコストの墓地チューナーは絞られない（旧: アーマーで空）。`selectTargets` の中の本当の対象（D・クリーナンの守備表示、アサルト・スピリッツ）は `{selection:'effect'}` で効果の選択に戻り、守られたカードは候補から外れる。
6. **保存→再開（G、2-VM）**: 登録ハンドラ経路の選択（コスト／効果の2種）の最中に保存し、VM2 で再開 → 記録の `selection`・`targeting`・候補が同じ。再開後の継続が開く次の legacy 選択（準備中のスクリプトが `targets:true` という前提）と、その継続の中で開く選択まで、保存なしの実行と**完全に同じ分類**（`JSON.stringify` 一致）。実カード ジェム・エンハンス（P1.1）のコスト選択の最中に保存 → 再開 → コスト → 対象（`selection:'effect'`, `targeting:true`）→ 解決（G3）。legacy 選択は保存を跨げない（S03-U35 が発動を取り消す。U471 で固定済み）ので、この面は登録経路。
7. **U471 のトランザクションは生きている（H）**: サシカエル × アーマー — コストは払え（B をリリース）、本当の対象（墓地の「ガエル」がアーマーで守られる）が尽きると、`選択できるカードが足りません`、チェーンなし、B は場に戻り、状態は発動前の digest と一致、Journal の末尾は `PREP_TX_ABORT_S03:insufficient` を1回だけ。

追加で固定したもの: 段階の道具（入れ子・例外でも戻る）、`API.selectCard`/`requestChoice` の明示指定（M a〜j）、コスト2段・間に確認を挟む合成スクリプトの継続の分類（N）、Journal の `CHOICE_OPEN_V49` に `selection` が載ること（J）、旧 S03-U471 のダーク・アームド・ドラゴン／ワーム・キング × アーマーの**裏返し**（O: 発動は断られず、コスト → 装備モンスターを対象に → 解決）、静的な確認（S1: P1.1 のコスト選択に `targeting:true` が無い 35 箇所、S2: `filterTargetable` は1か所／印を付ける箇所は2経路だけ）。

## 既存テストが動いたもの（Opus 判断が必要 — 未変更）
Node テスト 694 本（`check.py` の全 Node テストから、実行が長く負荷に弱い `test_s03_u305_ui_harness.js` だけを除く）を最終エンジンで総当たりした結果、**動いたのは `tools/test_s03_u471_prep_tx.js` の 10 assertion（2 枚 × 5）だけ**。他の 693 本は 0 FAIL。

| assertion（§15「MON9」のループ） | カード | 旧結果 → 新結果 |
|---|---|---|
| `…: the effect is offered and ends with 「選択できるカードが足りません」` | ダーク・アームド・ドラゴン / ワーム・キング（board A） | 旧: トーストで終わる → 新: コストの選択が開いて待つ |
| `…: preparation flags clear (…)` | 同 | 旧: クリア → 新: 準備中（選択待ち） |
| `…: priority unchanged (…)` | 同 | 旧: 不変 → 新: `pc:true` だけ変わる（選択待ち） |
| `…: nothing changed at all — the state digest equals the pre-activation digest` | 同 | 旧: 一致 → 新: 準備の途中なので不一致 |
| `…: trying again gives the same refusal and the state digest is still the pre-activation digest` | 同 | 同上 |

**旧期待が誤っていた理由**: この2枚が board A（メタルシルバー・アーマーの下）で「選択できるカードが足りません」で終わったのは、コスト（ダーク・アームド・ドラゴン: 墓地の闇属性モンスター1体の除外、ワーム・キング: 「ワーム」爬虫類族1体のリリース）の候補にまで対象耐性が掛かり、アーマーが守る P1 の墓地・場のモンスターがコスト候補から消えたため（本単位が直す欠陥そのもの）。実測（最終エンジン）: コストの選択が開き（`selection:'cost'`, `targeting:false`）、続く対象選択は装備モンスターとアーマーだけ（効果の選択、絞られたまま）、解決で装備モンスターが破壊される — 正しい動き。
**1103 の根拠**: `data/carddata.json` のワーム・キングは「自分フィールド上の「ワーム」と名のついた爬虫類族モンスター1体をリリースする事で、相手フィールド上のカード1枚を選択して破壊する」（旧表記）。ダーク・アームド・ドラゴンは現行表記の「自分の墓地から闇属性モンスター1体を除外し、フィールドのカード1枚を対象として発動できる」（S03-U127 のスクリプトコメントも同文。**2011 年当時の原文の言い回しはこの DB に無く、未確認**。ただし「除外がコスト、対象はフィールドのカードだけ」という構造は旧表記でも同じ）。どちらも、除外・リリースはコストで、選択するのはフィールド上のカードだけ。メタルシルバー・アーマー（WIKI-6B27D6D86996 等）は**対象を取る効果**の発動を制限するもので、コストの支払いは制限しない。裁定は直接の記述が無く（上の「裁定の探索」）、一般則での採用。

**提案パッチ（未適用）**: `C:/Users/81806/AppData/Local/Temp/claude/C--Users-81806-OneDrive-----------/a2787d3c-5bb7-41cd-bf08-fef9602963a3/scratchpad/u471_pins474.patch`（`tools/test_s03_u471_prep_tx.js` のみ。提案を当てた全文は同ディレクトリの `u471_proposed.js`）。
- **ワーム・キング**: 盤面を board C（お互いのオベリスクの巨神兵だけ＝本当の対象が尽きる盤面）に変え、コストの選択を回答してから同じ assertion を通す。assertion の中身（トースト・準備フラグ・優先権・digest・再操作性・再試行）は**一つも緩めず**、コストが払えた上で対象選択が尽きたとき発動前へ戻る、という U471 の本来の意図を保つ。
- **ダーク・アームド・ドラゴン**: 一覧から外す。コストが払える盤面では、対象（フィールドのカード）に自分自身が含まれるため候補不足にならず、この assertion 群を再現できる盤面が無い。裏返し（アーマーの下で発動でき、解決する）は本単位のテスト（O）が固定する。
- 測定: 提案を当てた `test_s03_u471_prep_tx.js` は **202 PASS / 0 FAIL**（209 から −7 ＝ ダーク・アームド・ドラゴンの 7 assertion）。
- 別案（Opus が選ぶ）: ダーク・アームド・ドラゴンを残すなら、コストを回答させ、さらに対象も回答させて解決まで見る形に書き換える（ただしそれは「候補不足で戻る」の再現ではなくなる）。

## 検証
- 専用: `tools/test_s03_u474_cost_selection_phase.js` — **122 PASS / 0 FAIL**。`tools/check.py` と `tools/script_coverage.py`（`CARD_TEST_FOCUS`）に接続。TESTED として数えるのは、コストの選択 → 効果の対象 → 解決 → Replay 監査まで通したカード（デュアルスパーク・ゴッドバードアタック・サシカエル・泣き神の石像・ジェム・エンハンス・ダーク・アームド・ドラゴン・ワーム・キング）。D・クリーナン／アサルト・スピリッツは分類の固定（対象選択で中止）だけで、TESTED には数えない。
- 近接（最終ビルド）: `test_s03_u470_condition_targetable` 176 / `test_s03_u472_multi_target_armor` 103 / `test_s03_u473_dimensional_prison_targeting` 77 / `test_s03_u468_target_scope` 67 / `test_s03_u04_lock_recovery` 39 / `test_s03_u135_auto_table_filters` 12 / `test_s03_u16_cost_selection_first` 18 / `test_s03_u111_god_bird_attack` 27 / `test_s03_u456_target_source` 28 / `test_s03_u457_target_consumers` 111 / `test_s03_u459_opponent_targeting` 15 — すべて 0 FAIL。`test_s03_u471_prep_tx` は上の 199 PASS / 10 FAIL（未変更）。
- 総当たり: 上のとおり 694 本、22777 PASS 行（u305 を除く）、FAIL は u471 の 10 行だけ。Traceback/ReferenceError なし。
- **負の対照**: エンジン変更だけ（`engine/09`・`engine/30`・`engine/40`・`build_manifest.json` の 1ZZW 行）を基点へ戻して再ビルド（hash `a4ad0508…`＝基点のエンジン＋カード編集 D3 のみ。D3 の編集は旧エンジンでも無害）→ 専用テストは **31 PASS / 47 FAIL**（16 節のうち 7 節が例外で中断した分も、その節の FAIL 1 件として数える。ビルドは落ちない）。落ちるのは、段階の道具、A・B・D・E・H のコスト候補と記録、F の記録、N、M の記録と明示指定、J、G の保存・再開、O、静的 S2。落ちずに残るのは、効果の対象が絞られる（漏れない）側のピン（旧エンジンでもそうだった）。復元後のビルド hash が最終ビルド（`dist/battle.html` の SHA256 `70406a88b3b92323…`）とバイト一致。ログ: `scratchpad/u474_negative_control.out`。
- Replay 監査: A・B・D・E・H・F・N・O・J・G3 の主要シナリオすべてで、全 digest と最終状態の再現を確認。

## ゲート
直列 `python tools/check.py` を**1回だけ**、`test_s03_u471_prep_tx.js` に**提案パッチを当てた scratch コピー**（それ以外はこのツリーと同一）で実行（U472 と同じ扱い。承認前なので、ツリー本体の u471 は未変更）。ログ: `C:/Users/81806/AppData/Local/Temp/claude/C--Users-81806-OneDrive-----------/a2787d3c-5bb7-41cd-bf08-fef9602963a3/scratchpad/gate474/gate.log`（`battle-dev/L` へは出していない）。
- **GATE_EXIT=0 / 23009 PASS / 0 FAIL**（行頭・大小文字区別 `^FAIL` = 0、Traceback/ReferenceError = 0）、最終行 `PASS no duplicate top-level function declarations`。所要約 34 分。`test_s03_u305_ui_harness.js` を含め全 Node テストが直列で通った。
- **算術**: 23009 = 基点 22894 + 新規 122（`test_s03_u474_cost_selection_phase.js`）− 7（提案パッチが外すダーク・アームド・ドラゴンの 7 assertion）。提案を別の形に変えれば u471 の件数は変わり、合計もその分だけ変わる（ゲートの再実行は不要な差でも、算術は書き直す）。
- （承認前の記録）ツリー本体で提案パッチを当てずにゲートを走らせると `test_s03_u471_prep_tx.js` の 10 FAIL で止まる（総当たりで確認済み）。
- ゲート後に変えたもの: docs（本書・`CLAUDE_RESUME.md`）と、承認時に求められた**コメントのみ**の追記（`engine/09`・`engine/1ZZW`・u471 テスト内の承認注記。コード・挙動は不変）。そのため最終ビルドの `dist/battle.html` SHA256 は `dc0fa7802d8e24e770dce0f85c01440518d222ad26e3c935a11c82d748a98406`（ゲート対象ビルドとはコメントだけの差。ゲートは Opus 指示により再実行しない）。以下はゲート対象ビルドの記録: エンジン・カード・テストは scratch コピーと同一（`dist/battle.html` SHA256 `70406a88b3b9232304230d16e267c85c9deba07de905dfeb2cc54af68fb9a17a`、ルート `battle.html` と一致、`battle_acode.html` は `build_acode.py` 済み）。

## カバレッジ（前 → 後）
`data/script_coverage.json`: TESTED 3588 / GENERIC_OK 644 / NOT_STARTED 405 / ENGINE_GAP 346 / PARTIAL 10 / IMPLEMENTED 3 → **同じ**（対象カードは以前から TESTED。新テストが `tests` 欄に加わった）。

## Not done / 次
- `test_s03_u471_prep_tx.js` の上記ピンは Opus 承認のうえパッチを適用済み（202 PASS / 0 FAIL）。
- MANUAL モード（`runScript`）は未変更: そこでは `ACTIVE_SCRIPT` が立ち、`SCRIPT_PHASE='cost'`（`cards/10_themes_a.js`）がコストの区間を既に示している。同じ欠陥があるはずなので、`SCRIPT_PHASE==='cost'` を `selectCard` が見るようにするのが自然な後続（今回は範囲外）。
- COST_SELECTION_FIRST に宣言されていないが、`selectTargets` の中でコストを選ぶ旧形式のスクリプトは、今も対象耐性が掛かる（宣言表 `cards/H4_claude_s03_cost_selection.js` に載せれば直る。範囲外）。
- `v70SelectExactly` 同型の欠陥の調査、残りの `targets:true` 候補、中央の方式 A、`condition` が生のプールを読む約119枚の耐性カード、次元幽閉 × 強制終了（WIKI-89BB9D36443F）は範囲外のまま。
- P1.1 のコスト選択の記録 `selection` は `'effect'`（コスト以外の意味）。ラベルを揃えたい場合は 35 箇所の `p11cOpen` に `selection:'cost'` を足す（挙動は変わらない。見た目のみ）。
- ユーザー裁定で挙動維持の RULING_UNRESOLVED 項目（氷結界の御庭番の「氷結界」判定／ターボ・ウォリアーのXyz除外・攻撃対象の付け替え／機皇城の発動場所／救世の儀式の離脱・復帰／同姓同名同盟条約の解決時4+/≤1）は変更なし。
- アーマー自身（魔法カード）はアーマーが守る対象ではないので、テストの A では対象候補にアーマーも出る（期待に反映済み。最初の草稿はアーマーを数え漏れていて FAIL した — 新テストの誤りの修正であり、既存の期待ではない）。

## 変更ファイル
`engine/1ZZW_cost_selection_phase_s03.js`（新規）／`engine/09_choice_request_v49.js`・`engine/30_processor_chain_battle.js`・`engine/40_legal_script_engine.js`（段階）／`cards/D3_auto_cycle31.js`（アサルト・スピリッツ・D・クリーナンの本当の対象を `{selection:'effect'}` に）／`build_manifest.json`／`tools/test_s03_u474_cost_selection_phase.js`（新規）／`tools/check.py`・`tools/script_coverage.py`（接続）／`data/script_coverage.json`／`AGENTS.md`（S03 規約に 1 項目）／`dist/battle.html`・`dist/battle_acode.html`・ルート `battle.html`／`docs/S03_U474_REPORT.md`／`coordination/CLAUDE_RESUME.md`。`tools/test_s03_u471_prep_tx.js`（Opus 承認の提案パッチ）。
