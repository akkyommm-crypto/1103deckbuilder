# S03-U490 — ハーネスの取りこぼしは「ハーネスの欠陥」か「実行・集計方法の問題」か

S03-U489 の報告に書いた「ハーネスのブロックが落ちても PASS 総数でしか検知できない」という説明の切り分け。

**結論は 2 つに分かれた。**

1. `tools/astra_harness.js` を使う **506 本**については説明が誤りだった。例外は終了コードで検知できる。
   S03-U489 の取りこぼしは**実行・集計方法の問題**（終了コードを見ていなかった）。
2. ただし `astra_harness` を使わず**自前で VM を回している 179 本**を調べると、
   うち **27 本**（`test_auto_cycle13`〜`40`）は catch が例外を握りつぶし、
   **判定を何件か記録したあとに落ちると終了コード 0 のまま**になっていた。これは**ランナー自体の欠陥**。
   しかも `test_auto_cycle32` が実際にこれで落ち続けていて、**10 件の判定が一度も実行されていなかった**。
   （ゲートログの `TypeError` 1 件は「既知」として扱われてきたが、既知の正体はこれだった。）

終了コードに本当に出ない class（例外を出さずに判定数が減る）も別に存在する。3 つすべてに対処した。

## 1. 切り分け（小さい再現）

`tools/astra_harness.js` は 1 ファイルの中で `harness(body)` を複数回呼び、各呼び出しが独立した VM で走る。
S03-U489 で落ちたのと同じ形（ブロック内の `const` が runtime のグローバル `undo` と衝突し、
そのブロックがコンパイル時の `SyntaxError` で丸ごと落ちる）を 3 ブロックの再現ファイルで作って実測した。

| 再現 | 標準出力 | `FAIL` | 終了コード |
|---|---|---|---|
| 真ん中のブロックが例外で落ちる | `PASS` 3 件（本来より少ない） | **0 件** | **2** |
| 例外を出さず `ok()` の呼び出しだけ減る（`if(false){ ok(…) }`） | `PASS` 2 件（本来より少ない） | 0 件 | **0** |

- 例外側: `astra_harness:37` の `catch(e){console.error(e.stack||e);process.exitCode=2;}` と、
  同 44 行の `if(!R.length||…)process.exitCode=2;` の二重で **2** になる。
  さらに `check.py` の `subprocess.run(...)` は **718 件すべて `check=True`** なので、
  `CalledProcessError 2` でゲート自体が落ちる（Python の Traceback もログに出る）。
  **つまりハーネスの欠陥ではない。**
- S03-U489 で取りこぼした実際の原因は**実行・集計方法**だった。開発中にテストを直接起動して
  PASS / FAIL 行だけを読み、終了コードを見ていなかった。`node tools/test_x.js | grep -c PASS` のように
  パイプに通すと `$?` は `grep` 側の値になるので、`2` は見えない。
  （この報告を書いている最中にも、`python tools/gate_verify.py … | tail` で同じ取り違えが再現した。）

## 1-b. 自前で VM を回しているテスト（ここは本当にランナーの欠陥だった）

`tools/test*.js` のうち **179 本**は `astra_harness` ではなく自前の `vm.runInNewContext` を持つ。
「判定を何件か記録したあとに例外が出たら非 0 で終わるか」で分類した（静的分類を、VM 実行直後に
例外を注入する実測で較正した）。

| 分類 | 件数 | 例外を注入したときの終了コード |
|---|---|---|
| A: `try` で囲んでいない（例外が伝播する） | 1（`auto_cycle55`） | **1**（検知できる） |
| B: catch が終了コードを立てる | 151 | **2**（検知できる） |
| **C: catch が握りつぶす** | **27**（`auto_cycle13`〜`40`） | **0**（検知できない） |

C の形はすべて同一で、`catch(e){console.error(e.stack||e);}` のあと
`if(RR.some(x=>!x.ok)||!RR.length)process.exit(2);` で終わっている。
`!RR.length` は「1 件目の判定より前に落ちた場合」しか拾わないので、途中で落ちると
**部分的な PASS 列だけが出て終了コード 0** になる。27 本すべての catch に `process.exitCode=2;` を入れた。

### 実際に落ちていた 1 本（`test_auto_cycle32`）

27 本を順に走らせたところ、`test_auto_cycle32` だけが非 0 になった。
原因は**テスト側の陳腐化**で、エンジンやカードの欠陥ではない。

- S03-U62 で《黒蠍－逃げ足のチック》の `resolve()` が `API.confirm` から
  `API.requestChoice`（「はい／いいえ」）へ移行した
- テストは移行前のまま、最初に出る **yesno** の候補を `resolveTarget()` に渡していた。
  yesno の候補は `p` / `zone` / `index` が `null` なので
  `TypeError: Cannot read properties of undefined (reading 'null')` で落ちていた

修正は、yesno に「はい」を答えてから uid でカードを選ぶ正しい手順に直した。
2 つめの場面（デッキトップをめくる側）も、黒蠍自身がフィールドに残っているため
「フィールドにカードが無い」前提は実戦では作れないので、「いいえ」を答えてその分岐に入るよう直した。

| | 判定数 |
|---|---|
| 修正前に実行されていた件数 | 45 |
| ファイルに書かれていた件数 | 55（**10 件が一度も実行されていなかった**） |
| 本単位で足した判定 | +4（yesno の提示、戻す対象が 1 枚だけ、一番上に戻っている、ほか） |
| 修正後 | **59** |

既存の判定文・期待値は緩めていない。消えた判定はなく、2 件の判定文を
実際に駆動している内容に合わせて書き直した（`gate_verify.py` のラベル比較に出る）。

## 2. 本当に終了コードに出ない class

「ブロックが例外を出さずに `ok()` の呼び出し数だけ減る」場合（条件分岐で素通りする、早期に `return` せず
`if` を抜ける、前提が揃わず判定群を飛ばす等）は、`R` が空でなく全件 `ok` なので終了コードは **0**、
`FAIL` も出ず、`PASS` が減るだけになる。**これは PASS ラベルの消失でしか分からない。**
S03-U489 で起きたのはこの class ではないが、class 自体は実在する。

## 3. 実装（3 点）

### (c) 自前ランナー 27 本の catch（1-b）

`catch(e){console.error(e.stack||e);process.exitCode=2;}` にした。
`test_auto_cycle32` のテスト側の陳腐化も直した（1-b）。


### (a) `astra_harness` の opt-in な判定数宣言

```js
harness(body, {expect: 12})
```

宣言と `ok()` の件数が合わなければ `FAIL astra_harness expected assertions :: expect=… got=…` を出して
終了コード 2 にする。

- **opt-in**（第 2 引数を渡さない既存 506 ファイルの挙動は変わらない）。
  受け取り側は `typeof opts.expect==='number'` のみを見るので、第 2 引数に別の値を渡す呼び出しがあっても影響しない
- **一致した場合に `PASS` 行を増やさない**。既存の PASS 総数の基準（24515）を動かさないため

### (b) `tools/gate_verify.py` — ゲートログの検査を機械的にする

```bash
python tools/gate_verify.py <gate.log> --prev <prev_gate.log> --expect-new 24 [--allow-removed N]
```

いままで手でやっていた確認を 1 コマンドにした。検査項目:

- `GATE_EXIT=` 行があり 0 であること（無ければ落ちる = 末尾 echo を忘れたログを通さない）
- 行頭 `FAIL` が 0 件（見つかれば先頭 20 件を表示）
- `Traceback (most recent call last)` / `ReferenceError` / `SyntaxError` が 0 件
- `TypeError` が許容数以内（既定 1 = `test_auto_cycle42` 系の既知分）
- 最終行が `PASS no duplicate top-level function declarations` であること（途中で止まったログを通さない）
- `PASS` 総数、および **`--prev` に対する PASS ラベルの増減**。
  ラベルは ` :: ` / ` — ` 以降と数字を落として正規化してから多重集合で比較する。
  **消失が 1 件でもあれば落ち、消えたラベルを名指しする**（`--allow-removed N` で明示的に許可する）

既存ログで較正済み。`gate_u488.log → gate_u489.log` は `+19 / −0`、`gate_u487.log → gate_u488.log` は
`+35 / −10`（U486 試験の A・C 入替）で、どちらも手計算と一致した。消えた 10 件は実際に入替えた判定名だった。
Windows のリダイレクトで作られたゲートログは cp932 なので、UTF-8 → cp932 の順で復号する。

## 4. 試験

`tools/test_s03_u490_harness_exit_and_gate_aggregation.js`（**29 PASS / 0 FAIL**）。
`tools/check.py` に配線、`tools/script_coverage.py` の `NON_CARD_TEST_FILES` に登録（カードを触らない）。
一時ディレクトリに再現ファイルを書いて `node` / `python` を起動し、終了コードと出力を判定する。

- **A（例外 class は終了コードで拾える）**: 落ちたブロックは標準出力では見分けがつかない（PASS 3 / FAIL 0）が
  終了コードは 2、理由は標準エラーに出る、`check=True` の起動では `CalledProcessError 2` になる。
  `astra_harness` の 2 箇所の `process.exitCode=2` と、`check.py` の `subprocess.run` 全件 `check=True` を静的に固定
- **B（素通り class と対処）**: 同じ素通りが宣言なしでは終了コード 0 / FAIL 0 / PASS だけ減ること、
  `{expect:3}` を付けると終了コード 2 と `FAIL` 行になること。
  **negative control**: 宣言が実数と一致していれば何も起きない（誤検知しない）、かつ `PASS` 行が増えない
- **C（`gate_verify.py`）**: 正常ログは通る／`GATE_EXIT` が 0 でない・`FAIL` 行がある・`Traceback` がある・
  最終行が違う・`GATE_EXIT` 行が無い、のそれぞれで落ちる／**前回ログから消えた PASS ラベルを名指しして落ち、
  `--allow-removed` で許可すれば通る**／`::` 以降と数字の違いだけでは別ラベルと見なさない／
  宣言した純増と合わなければ落ちる／cp932 のログも読める（UTF-8 として不正であることも併せて確認）
- **D（自前ランナーの監査）**: `tools/test*.js` を走査して、自前で VM を回す 179 本すべてが
  「判定を記録したあとの例外」でも非 0 で終わることを**監査ピン**として固定（内訳 A=1 / B=178 / C=0）。
  さらに**実測**で、VM 実行直後に例外を注入した `test_auto_cycle32` が非 0 で終わること、
  同テストが選択候補を `resolveTarget` に渡していないこと、例外を出さず 59 件まで完走することを確認

テストの `detail` は `gate_verify.py` の出力をそのまま載せることがあるため、必ず 1 行に畳んでいる。
畳まないと `FAIL lines           0` や `PASS total           3` という行がゲートログに現れて集計を壊す
（実際に 1 度そうなった）。

### 全体ゲート

後述の「5. 計測」に記載。`astra_harness.js` は 506 ファイルが読む共有物なので、全体ゲートを 1 回走らせて確認した。

## 5. 計測

| 項目 | 値 |
|---|---|
| ゲート | `GATE_EXIT=0`、`^FAIL` 0、Traceback 0、ReferenceError 0、SyntaxError 0、**TypeError 0** |
| PASS 総数 | **24560** = 24515（U489 時点）+ 30（本単位の新規試験）+ 14（`test_auto_cycle32` の回復 10 と追加 4）+ 1（U488 試験に裁定の固定を 1 件追加） |
| PASS ラベル増減 | +45 / −0（`tools/gate_verify.py` による） |

**`TypeError` が 0 件になった。** これまで「既知」として許容してきた 1 件の正体は
`test_auto_cycle32` の握りつぶされた例外（1-b）だったので、基点の既知事項が 1 つ消えた。
消えた PASS ラベルが 0 件なのは、`test_auto_cycle32` で書き直した 2 件の判定文が、
どちらも**修正前は実行されていなかった**（＝前回ログに現れていなかった）ためである。

### 自分の試験でゲートの検査を壊しかけた

最初の版は、判定文に `SyntaxError` と書き、`gate_verify.py` の出力を `detail` にそのまま載せていた。
そのため**この試験の PASS 行のせいで**ゲートログの `SyntaxError` が 2 件、`ReferenceError` が 1 件、
`TypeError` が 2 件になり、検査語が 0 件にならなくなった（`gate_verify.py` がそれを検出した）。
`detail` を 1 行に畳むときに検査語を日本語へ置換し、判定文からも検査語を外した。
この試験自身の出力に検査語が無いことを、最後の判定で固定している。

## 6. 以後の運用

区切りごとに次を使う。手で PASS 総数を数えるより、消えたラベルを取り逃がさない。

```bash
python tools/check.py > <scratch>/gate_uNNN.log 2>&1; rc=$?; echo "GATE_EXIT=$rc" >> <scratch>/gate_uNNN.log
python tools/gate_verify.py <scratch>/gate_uNNN.log --prev <scratch>/gate_uNNN-1.log --expect-new <新規判定数>
```

新規テストを書くときは `harness(body,{expect:N})` を付ける（本単位以降の新規テストに適用する。
既存 506 ファイルへの一括付与は、判定数を数え直す作業自体が誤りを入れうるので行わない）。

## 7. あわせて片付けたこと（ユーザー指示の 3 番）

### 《降霊の儀式》とネクロバレー — 当時裁定で**解決**

S03-U488 / U489 が未解決として残していた「墓地ロックを迂回してよいか」は、裁定 DB に直接の裁定があった。

> `WIKI-4B70999040AF`（2011-05-03 取得）
> Q: 「発動は制限されない」というテキストですが、《王家の眠る谷－ネクロバレー》によって効果は無効になりますか？
> A: **いいえ。効果も無効にはなりません。**

カードのテキストは発動しか書いていないが、効果も無効にならない。
したがって既存の設計判断（API の墓地ロックを迂回して蘇生を成立させる）は**正しい**。
コードの挙動は変えず、根拠を `auditNote` に残し、`test_s03_u488` に裁定 ID の固定を 1 件追加した。

### uid を持たない直接発火イベント — 優先度は低いまま

`emitEvent(...)` の直接呼び出しは **15 箇所**、うちカードを載せているのは **7 箇所**
（`engine/40:1637`、`engine/60:256`、`engine/70:241` / `:291`、`cards/20:716`、`cards/40:718`、`runtime/50:1031`）。
実害は「再開後に `EVT_V2_STATE.evt.card` が複製になる」ことだけで、
読む側が同一性で比べていないので現時点では盤面に出ない（S03-U483 4-c）。
再現にも「直接発火の誘発の選択窓が開いている最中に保存する」という狭い条件が必要。
直し方は `startEventChainV2` で `evt.card` を uid に正規化する 1 箇所で済むので、
「タイミングを逃す」の段階導入（`docs/S03_MISSED_TIMING_DESIGN.md`）の後に回す。

## 8. 次の共通エンジン課題（ユーザー指示の 2 番）

「タイミングを逃す」の設計を `docs/S03_MISSED_TIMING_DESIGN.md` に書いた。
当時裁定 **123 件**の抽出は `docs/S03_MISSED_TIMING_RULINGS.md`。
実装は S03-U491 以降で段階的に行う（最初の段階は宣言 0 件なので挙動は変わらない）。

## 9. 未解決

1. `{expect:N}` は opt-in なので、既存テストの素通りは引き続き `gate_verify.py` のラベル比較でしか拾えない
2. `tools/check_quick.py`（`finish-work.ps1 -AsyncGate` が使う軽量ゲート）には PASS 総数の基準が無いため、
   ラベル比較は全体ゲートのログに対してしか使えない
3. `test_auto_cycle32` の《黒蠍－逃げ足のチック》で、カードの分岐
   `if(canBounce) … else if(canPeek) …` の後者（フィールドにカードが無い場合）は、
   黒蠍自身がフィールドに残るため**実戦では到達しない**。カード側の分岐として残すか落とすかは未判断
