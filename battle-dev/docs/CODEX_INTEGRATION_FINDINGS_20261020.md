# Opus 調査メモ — CI並列ゲート / U449統合状況 / Codex競合（2026-10-20）

作業ツリーは Sonnet が U455 を書いているため、本メモは scratchpad に置く。
統合 unit の際にこのまま `battle-dev/docs/` へ取り込める内容。

---

## ③ CI並列化（従来の逐次ゲートとの一致検証）

### 現状の構成（commit `491dcfc` / cherry-pick 元 `1567101`）
`.github/workflows/battle-ci.yml` は **逐次 `tools/check.py` を置き換えて**
`python tools/check_parallel.py --workers 4` を実行する（直前に
`tools/test_check_parallel.py` のセルフテストを追加）。つまり並列ゲートは
「非ブロッキングの追加ジョブ」ではなく、**CI の正本ゲートそのもの**になっている。

### 仕組み
`check_parallel.py` は `subprocess.run` を差し替えて `runpy` で `check.py` を実行する。
Node コマンドだけをキューに溜め、`CompletedProcess(returncode=0)` を即座に返す。
全 Python 処理が終わったあとに Node を ThreadPool（既定 4 並列）で走らせ、
**元のコマンド順に出力を再生**する。各 Node には専用 `TEMP`/`TMP`/`R1_OUT` を与えて
R1 系テストの固定ファイル名の競合を防いでいる。

### 設計上、逐次と必ず異なる点（実行前に判明した差分）
1. **fail-fast が失われる。** `check.py` は `subprocess.run(..., check=True)` で
   最初の失敗 Node テストで `CalledProcessError` を投げて止まる。並列版は偽の
   returncode 0 を返すため **check.py は全 Python 処理を完走し、全 Node テストも走る**。
   失敗はラッパが最後に `PARALLEL_NODE_ERROR` として報告する。
   → 逐次ログは「最初の失敗で打ち切り」、並列ログは「全件」。PASS 行数が一致するのは
   **全テスト成功時に限る**。
2. **出力順が変わる。** Python 由来の PASS 行が全部先に出て、Node 出力が後から再生される。
   `check.py` 末尾のインライン判定（`PASS no duplicate top-level function declarations`）も
   Python 側なので **先に出る**。
   → **既存のゲート検証ルール「最終行が `PASS no duplicate top-level function declarations`」が
   並列ゲートでは成立しない。** 並列ゲートの最終行は `PARALLEL_NODE_DONE commands=N errors=0 seconds=…`。
   CI を並列に切り替えたまま同じ検証手順を使うと、この条件で誤判定する。
   → 対応案: 検証条件を「`PARALLEL_NODE_DONE … errors=0` が存在し、かつ
   `PASS no duplicate top-level function declarations` がログ中に存在」へ置き換える。
3. ツリー内へ書き込む Node テストがあれば、`TEMP`/`R1_OUT` 隔離だけでは競合し得る
   （`dist/`・`data/` への書き込み）。一致検証の実測で出なければ実害なしと判断してよい。

### 実測（完了）
専用 worktree `worktrees/parity`（detached `491dcfc`）を切って、同一ツリーで
`tools/check.py` と `tools/check_parallel.py --workers 4` を順に実行中。
セルフテスト `test_check_parallel.py` は 2/2 PASS、`build.py` の
`dist/battle.html` SHA256 = `b19b58f7f2a6efd53fc8d29dab2260462e5afeeae8c948443d7547d0714713e4`。
判定は **PASS/FAIL 行の多重集合（ソート後）の一致**で行う（順序差は仕様差なので除外）。
ログ: `scratchpad/parity/seq.log`, `scratchpad/parity/par.log`, `scratchpad/parity/run.log`。

**結果: 一致（parity 確認）。**

| | 逐次 `check.py` | 並列 `check_parallel.py --workers 4` |
|---|---|---|
| PASS | **21922** | **21922** |
| FAIL | 0 | 0 |
| Traceback / ReferenceError | 0 / 0 | 0 / 0 |
| GATE_EXIT | 0 | 0 |
| 所要時間 | 10:18:40 → 11:02:32（約43.9分） | 11:02:32 → 11:14:26（約11.9分、Node部 713.2秒 / 679コマンド） |
| 最終行 | `PASS no duplicate top-level function declarations` | `PARALLEL_NODE_DONE commands=679 errors=0 seconds=713.2` |

- **判定は完全一致**: PASS/FAIL 行を判定名で正規化して突き合わせた結果、差分は 336 行だが
  いずれも**ラベル自体に毎回変わる値が埋まっている行**のみ（Replay の `finalDigest`、および
  E3 performance の ms）。差分行に `"ok":false` は **0 件**。
- digest 差は**並列化由来ではない**ことを実証した: `tools/test_draw_event_cards.js` を
  逐次で2回続けて実行すると `eee8e5fc` → `7931ad0c` と毎回変わる。
  各テストの主張は「live 実行が出した digest を Replay が再現する」という自己整合であり、
  絶対値は初期デッキ順に依存して実行毎に変わる。**テストは有効、値の比較は無意味。**
- **約3.7倍の高速化**（43.9分 → 11.9分）。
- ツリーへの書き込みを行う Node テストは 2 本のみ（`r1_duel_driver.js` と
  `test_s03_u109_future_fusion_r1_slice.js`）で、どちらも `R1_OUT` / `os.tmpdir()` 配下＝
  並列版がコマンド毎に隔離する領域。よって **4並列でのファイル競合は無い**。

### 残る対応事項（③の結論）
1. 一致は取れたので、CI を並列ゲートにしたままで良い。
2. ただし**ゲート検証手順を並列版向けに更新する必要がある**:
   「最終行が `PASS no duplicate top-level function declarations`」は成立しないため、
   「`PARALLEL_NODE_DONE … errors=0` が存在し、かつ
   `PASS no duplicate top-level function declarations` がログ中に存在し、
   PASS 総数が期待値と一致」へ置き換える。
3. fail-fast が失われる点は仕様差として受け入れる（全件走るぶん情報は増える）。
   ただし **unit 単位の検証は逐次 `check.py` を使う**ほうが既存ルールと整合する。
   CI は並列、ローカルの unit 検証は逐次、という住み分けを明記しておく。

---

## ④ U449 の修正が統合候補に含まれるか → **含まれていない**

U449 = commit `e7b1fae`「ChatGPT audit — 破壊輪 2011テキスト / 連鎖爆撃のチェーン数 /
サイバネティック・ヒドゥン・テクノロジーを永続罠へ / 皆既日蝕の書は検証のみ」。

| ブランチ | U449 | U454 | check_parallel | simulHoldS03 (U449 engine) |
|---|---|---|---|---|
| `main` | なし | なし | なし | なし |
| `integration/github-migration` | なし | なし | なし | なし |
| `integration/battle-c12-publication` | なし | なし | なし | なし |
| `claude/work` | あり | あり | あり | あり |

- `main` の HEAD は `cf2c538 "Add files via upload"` で、**GitHub移行すら未マージ**。
- `integration/battle-c12-publication` は Codex C10–C12 時代の古い公開候補で、
  claude/work との merge-base は `0a5866c`（U349 相当）。
- つまり **U449 の修正（破壊輪・連鎖爆撃を含む）はどの統合候補にも入っておらず、
  `claude/work` にのみ存在する。** 公開するには claude/work を統合候補にする必要がある。
- U449 は engine にも触っている: `00_state_actions.js` の LP Action に
  `simulHoldS03` / `simulFinalS03`（両者同時ダメージを1括りにし、両者0なら引き分け）、
  `40_legal_script_engine.js` の `API.damageLP(p, amount, reason, opts)`。

---

## ⑤ Codex 側の未統合成果との競合

### 分岐状況（`main` を基準とした先行コミット数 / claude/work との merge-base）
| ブランチ | main より先行 | claude/work との merge-base | 変更ファイル | claude/work と重なるファイル |
|---|---|---|---|---|
| `claude/work` | 155 | – | 503 | – |
| `integration/github-migration` | 4 | `6ca1e97`（= 自身のHEAD。claude/work が完全に含む） | – | – |
| `codex/gate-pipeline` | 152 | `bc6b513`（U451） | – | – |
| `codex/invellz-gatekeeper` | 73 | `0a5866c` | 88 | 23 |
| `codex/flip-suppress-position` | 73 | `0a5866c` | 89 | 22 |
| `codex/rabbit-laggia` | 71 | `0a5866c` | 84 | 21 |
| `codex/phase-priority` | 64 | `0a5866c` | 71 | 20 |
| `codex/deck-priority-1` | 62 | `0a5866c` | 55 | 20 |
| `codex/safe-zone` | 57 | `0a5866c` | 27 | 16 |
| `codex/engine-target-immunity` | 56 | `0a5866c` | 22 | 15 |
| `integration/battle-c12-publication` | 69 | `0a5866c` | 75 | 21 |

`integration/github-migration` は claude/work に完全に含まれる（merge-base が自身の HEAD）。
Codex の 7 本の feature ブランチは全て `0a5866c`（U349 相当）から分岐しており、
その後 claude/work は 155 コミット進んでいる。

### 競合ファイルの性質（全8本で共通に重なるもの）
- **手書きコア（真の競合）**: `engine/00_state_actions.js`, `engine/30_processor_chain_battle.js`,
  `engine/40_legal_script_engine.js`, `engine/1K_destruction_protection_v21.js`,
  `engine/20_effect_primitives_ex.js`, `engine/1ZK_summon_only_s03.js`,
  `engine/70_summon_procedures.js`, `tools/check.py`, `tools/script_coverage.py`,
  `build_manifest.json`, 一部の旧テスト（`test_v670_batch19.js` 等）
- **生成物（マージしてはいけない。再生成すべきもの）**: `battle.html`, `dist/battle.html`,
  `dist/battle_acode.html`, `data/script_coverage.json`, `data/s03_status_audit.json`,
  `docs/SCRIPT_COVERAGE.md`
- **追記型レジストリ（キー単位で統合）**: `data/script_status_overrides.json`,
  `data/s03_status_changes.json`

→ **推奨**: ブランチ全体を merge せず、Codex の feature コミットを claude/work へ
**cherry-pick** し、生成物は必ず再生成する（`build.py` → `build_acode.py` →
`script_coverage.py` → status audit）。claude/work が上位集合なので方向はこの一方向でよい。

### 実測した cherry-pick 競合（`git merge-tree` によるインメモリ検証）
`codex/engine-target-immunity` の本体 `ce361fa`（CODEX-C03）を claude/work へ
cherry-pick した場合の競合は **8パスのみ**で、その内訳は

- 生成物 7 件（`build_manifest.json`, `data/s03_status_audit.json`,
  `data/s03_status_changes.json`, `data/script_coverage.json`, `dist/battle.html`,
  `dist/battle_acode.html`, `docs/SCRIPT_COVERAGE.md`, `battle.html`）
- 手書き 1 件（`tools/test_v670_batch19.js`）

**engine ソース 4 ファイルは全て自動マージ可能**（`00_state_actions.js`,
`40_legal_script_engine.js`, `30_processor_chain_battle.js`, `12_provenance_v3.js`）。
CODEX-C03 の engine 差分は後方互換の追加のみ（`immuneToTarget` の第3引数 `effectInfo`、
`filterTargetable` の第3引数、`p3BeginEffectContextV3(player, source, sourceName)` の
引数追加、新規 `engine/1ZZR_target_source_s03.js`、`API.targetableCardsS03`）。

### 二重実装の競合: 《氷結界の御庭番》
**claude/work の U439 と Codex の CODEX-C03 が同じカードを別方式で実装している。**

| | claude/work U439 | CODEX-C03 |
|---|---|---|
| 効果ソース取得 | `u378Source()`（**カードファイル** `cards/HZZZZZZZZN_…u378_targetlocks.js` 内に定義） | `targetEffectSourceS03()`（**engine** `1ZZR_target_source_s03.js`） |
| 対応範囲 | 発動準備（`ACTIVATION_PREP_S03`）のみ | 発動準備・チェーン解決・直接 `runScript` を正規化 |
| 「氷結界」判定 | `dbOf(card).n` の部分文字列 | `isCardInGroupV4(dbOf(card), GROUP.ICE_BARRIER)` |
| engine 変更 | なし | あり（後方互換の追加） |

そのまま cherry-pick すると `defineScript('氷結界の御庭番')` が二重登録になりゲートで落ちる。

---

## 付随して実測で判明した**既存バグ**（上記より重要）

`u378Source()` は `ACTIVATION_PREP_S03` がある間だけ効果ソースを返す。
`engine/30_processor_chain_battle.js:1464` が「チェーンに乗った」時点で
`endActivationPrepS03()` を呼ぶため、**解決時に対象を選ぶ経路では効果ソースが null になり、
対象耐性が黙って無効化される。**

実測プローブ（`scratchpad/probe_target_source.js`、`worktrees/parity` の
`dist/battle.html` に対して実行。ツリーは改変していない）:

```
PASS A 発動準備中: u378Source() が相手の効果モンスターを返す :: {"player":1,"k":"m","n":"7つの武器を持つハンター"}
PASS A 発動準備中: 氷結界モンスターが対象候補から除外される（耐性が効く） :: kept=0
PASS B 解決時: u378Source() が null になる（効果ソースを失う） :: null
PASS B 解決時: 氷結界モンスターが対象候補に残ってしまう＝耐性が効かない :: kept=1
PASS 参考: targetEffectSourceS03 はこのツリーに存在しない（CODEX-C03 未統合） :: undefined
```

影響するカード（`u378Source()` を使う全て）:
- **氷結界の御庭番**（U439）
- **ヴァイロン・セグメント**（U378）
- **闇の侯爵ベリアル**（U378）

到達可能性: `resolve` / `operation` の中で選択を開く箇所は **348 / 193ファイル**あり、
解決時の選択は主流パターン。CLAUDE_RESUME も グラファ / ゴルド を
「選択して破壊の対象を発動時でなく解決時に選ぶ」形として記録している。
よって机上の穴ではなく、実際に踏める。

---

## 推奨する次の手（統合 unit の設計）

1. **CODEX-C03 の engine 部分だけを claude/work へ cherry-pick する。**
   採る: `engine/1ZZR_target_source_s03.js`、engine 4ファイルの差分、
   `build_manifest.json` への登録、`tools/test_codex_c03_target_immunity.js`、
   `tools/check.py` / `script_coverage.py` への接続。
   **採らない**: `cards/I0_codex_c03_target_immunity.js`（御庭番の二重実装になる）。
2. **`u378Source()` を engine の `targetEffectSourceS03()` へ寄せる。**
   これが上記バグの修正本体。カードファイルに置かれた共有ヘルパを engine へ移すことで
   「engine = 共有ルール / cards = カードスクリプト」の分離にも戻る。
   3枚（御庭番・セグメント・ベリアル）の `immuneToTarget` を第3引数 `effectInfo` 版へ移植し、
   **解決時に耐性が効くことを回帰テストで固定する**（上記プローブをテスト化すればよい）。
3. 《氷結界の御庭番》の「氷結界」判定を部分文字列から `GROUP.ICE_BARRIER` へ寄せるか、
   名前変更（`currentNameV17`）を考慮するかを決める。テキストは
   「『氷結界』と名のついた」なので名前一致自体は正しいが、
   名前を書き換えられた場合の扱いは裁定確認が必要。
4. 残る 8 consumer（ヴァイロン・エプシロン, オベリスクの巨神兵, ジュラック・タイタン,
   ターボ・ウォリアー, 救世の儀式, 機皇城 …）は、この primitive の上で通常 unit として実装できる。
   **CLAUDE_RESUME の「OPEN ENGINE ITEM: cannot be targeted」は新規設計不要** — 統合で解決する。
5. CI のゲート検証条件を並列ゲート向けに更新する（上記③-2）。
6. 統合後に Replay 監査・セーブ再開・`HARNESS_UI=1` のスイープを回す（ユーザー指示⑤の後半）。

---

## 統合ドライラン（`worktrees/parity` で実測、claude/work は未改変）

推奨手順が本当に通るかを、自分の捨てツリーで実行して確かめた。

### 手順と結果
1. `git checkout ce361fa -- battle-dev/engine/1ZZR_target_source_s03.js`（新規・競合なし）
2. engine 4ファイルの差分を `git apply --3way` →
   **4ファイルすべて "Applied patch cleanly"**。`merge-tree` の予測どおり engine は無競合。
3. `build_manifest.json` に `engine/1ZZR_target_source_s03.js` のみ登録
   （**`cards/I0_codex_c03_target_immunity.js` は登録しない** = 御庭番の二重登録を回避）
4. `build.py` 再生成 → 段階Aプローブ

**段階A（engine のみ / カード未移植）**
```
PASS engine: targetEffectSourceS03 が存在する :: function
PASS engine: targetEffectMatchesS03 が存在する :: function
PASS engine: API.targetableCardsS03 が存在する :: function
PASS 発動準備中: 氷結界モンスターは対象に取れない :: kept=0
PASS 解決時: engine の targetEffectSourceS03 は効果ソースを復元できる
     :: {"player":1,"name":"7つの武器を持つハンター","uid":3,…,"isEffectMonster":true}
FAIL 解決時: 氷結界モンスターは対象に取れない :: kept=1
PASS negative control: 自分の効果なら対象に取れる :: kept=1
```
→ **engine を入れただけでは直らない。** engine は解決時にソースを復元できているのに、
カード側が `u378Source()` を見ているため依然 null 扱いになる。カード移植が必須。

**段階B（カードを effectInfo 版へ移植）**
`cards/HZZZZZZZZZZW_claude_s03_u439_garden_rock.js` の `immuneToTarget` を
`immuneToTarget(card, self, effectInfo)` にし、ソース取得を
`effectInfo || targetEffectSourceS03() || u378Source()` の順に変更
（`src.cardType` / `src.isEffectMonster` を優先し、無ければ `src.db` から従来判定へフォールバック）。

```
PASS 発動準備中: 氷結界モンスターは対象に取れない :: kept=0
PASS 解決時: 氷結界モンスターは対象に取れない（修正後の期待挙動） :: kept=0
PASS negative control: 自分の効果なら対象に取れる :: kept=1
```
→ **修正成立。** 過剰適用もしていない。

### 関連既存テスト（移植後も全て PASS）
| テスト | 結果 |
|---|---|
| `test_s03_u439_garden_rock.js` | 17 / 0 |
| `test_s03_u378_targetlocks.js` | 16 / 0 |
| `test_s03_u336_elec.js` | 36 / 0 |
| `test_s03_u130_polymerization.js` | 24 / 0 |
| `test_v670_batch19.js` | 48 / 0 |

### 残り（統合 unit でやること）
- **ヴァイロン・セグメント / 闇の侯爵ベリアル も同じ移植が必要**（同じ `u378Source()` を使うので
  同一のバグを抱えている。形は御庭番と同一なので機械的に適用できる）。
- 最終的には `u378Source()` 自体を engine の `targetEffectSourceS03()` へ寄せて
  カードファイルから共有ヘルパを消す（engine = 共有ルール / cards = カードスクリプト の分離）。
- 上記プローブを正式な回帰テストに落として、**解決時の耐性**を固定する。
- Codex の `tools/test_codex_c03_target_immunity.js` は Codex 版カードを前提にしているので、
  そのままでは使えない。採るなら Claude 版カードに合わせて書き換えるか、自作テストに置き換える。
- 生成物（`dist/`・`battle.html`・coverage・status audit・`SCRIPT_COVERAGE.md`）は
  **マージせず再生成**する。

---

## ドライラン 第2段: 2つの案を比較し、**effectInfo 版を採用**した

engine の `targetEffectSourceS03()` が `db` も含めて返すため、
**`u378Source()` 自体を engine へ委譲する案**（単一箇所修正）も成立する。実際に試して動いた。
ただし最終的には採用しなかった。理由は下記「採否」。

```js
function u378Source(){
  /* CODEX-C03: 対象選択は「発動準備」「チェーン解決」「直接 runScript」の3経路で起きる。
     engine の targetEffectSourceS03() がその3つを正規化する。
     以前はここが ACTIVATION_PREP_S03 しか見ておらず、解決時に耐性が黙って無効化されていた
     （engine/30_processor_chain_battle.js:1464 が「チェーンに乗った」時点で prep を破棄する）。
     返り値は従来どおり {db, player, …} なので呼び出し側の述語は変更不要。 */
  if(typeof targetEffectSourceS03==='function'){
    const s = targetEffectSourceS03();
    if(s && s.player!=null && s.db) return s;   /* player が null の時は従来経路へ */
  }
  …従来の ACTIVATION_PREP_S03 経路（フォールバック）…
}
```

### 採否: この案は**採用しない**
`filterTargetable()` は `effectInfo` を**1回だけ**正規化して
`immuneToTarget(card, self, effectInfo)` の第3引数で渡してくる。
`u378Source()` の中で `targetEffectSourceS03()` を呼ぶと、
**候補 × 継続効果ソースの組み合わせごとに正規化をやり直す**ことになり、
primitive が用意した受け渡しを無駄にする。
そのため採用したのは **カード側で `effectInfo` を受け取る版**（下記 U456 の実装）。

なお両案の実行時間は交互計測で区別できなかった（重い duel で委譲版 47/46秒、
engine のみ 45/49秒、duel 結果はいずれも `turn:12 journal:424` で同一）。
よってこれは**性能ではなく設計の選択**である。
（計測を単発で行うと同時実行中のゲートの負荷を拾って 76〜82秒まで伸びる。
 比較は必ず交互に取ること。）

`targetEffectSourceS03()` の探索順は
`ACTIVATION_PREP_S03` → `RESOLVING_LINK_S03` → `P3_EFFECT_CONTEXT` → `ACTIVE_SCRIPT` で、
**解決時は `RESOLVING_LINK_S03` が拾う**。見つからない時は `player:null` を返すので、
`player!=null && db` のガードを入れて従来経路へ落とす（旧 `u378Source` は null を返していたため、
ガード無しだと `src.db.k` で TypeError になる）。

### 3枚すべての実測（修正後）
| カード | 発動準備中 | **解決時** | negative control |
|---|---|---|---|
| 氷結界の御庭番 | kept=0 ✅ | **kept=0 ✅** | 自分の効果 kept=1 ✅ / 相手でも効果モンスター以外 kept=1 ✅ |
| ヴァイロン・セグメント | kept=0 ✅ | **kept=0 ✅** | 非装備モンスター kept=1 ✅ / 自分の効果 kept=1 ✅ |
| 闇の侯爵ベリアル | kept=0 ✅ | **kept=0 ✅** | ベリアル自身 kept=1 ✅ / 自分の効果 kept=1 ✅ |

セグメントは装備状態を作る必要があるため、`tools/test_s03_u378_targetlocks.js` を複製して
その `segField(true)` / `equipped()` ヘルパを使って検証した（複製は削除済み、19/0）。
プローブ本体は `scratchpad/probe_three_cards.js` と `scratchpad/probe_c03_stage.js`。

### 統合 unit での最小差分（確定版）
1. `engine/1ZZR_target_source_s03.js` を `ce361fa` から取得（新規・競合なし）
2. engine 4ファイルの差分を `git apply --3way`（**全て clean に適用されることを実測済み**）
3. `build_manifest.json` に **engine/1ZZR のみ**登録（Codex のカードは登録しない）
4. カード側は `immuneToTarget(card, self, effectInfo)` にして
   `u378SrcOf(effectInfo)`（= `effectInfo` 優先、無ければ従来の `u378Source()`）を使う。
   対象は `u378_targetlocks.js` の2枚と `u439_garden_rock.js` の1枚。`u378Source()` 本体は無改変。
5. 解決時の耐性を固定する回帰テストを追加（上記プローブをテスト化。3枚 × prep/解決/negative）
6. 生成物を再生成（`build.py` → `build_acode.py` → `script_coverage.py` → status audit）
7. フルゲート（逐次 `check.py`）で `21922 + 新規アサーション数` を確認

### 無回帰の確認
- engine のみ適用（カード未修正）でフルゲート: **PASS 21922 / FAIL 0 / Traceback 0 /
  ReferenceError 0 / `PASS no duplicate top-level function declarations` あり /
  `PARALLEL_NODE_DONE commands=679 errors=0` / GATE_EXIT=0**、Acode `cards=4996`。
  → CODEX-C03 の engine 追加は 21922 アサーション全体に対して無回帰。
- 単一箇所修正版のフルゲート: PASS 21915 / FAIL 1。唯一の FAIL は
  `test_s03_u305_ui_harness.js` の `Error: Script execution timed out after 120000ms`
  （`tools/astra_harness.js` の `vm.runInNewContext(..., {timeout:120000})`）。
  **これは変更由来ではない**: 同テストは単体では 16/0 で通り、
  その duel は単独 ~46秒に対して上限が 120秒という元々薄い余裕しかない。
  並列ゲートの実負荷（各ワーカーがさらに子プロセスを生む）で上限を超え得る。
  手動で同じ duel を4並列にしても 75秒で落ちなかったので、競合の内訳はゲート全体の負荷による。
  → **既存の脆さ**として記録する。対処案: ハーネスの VM 上限を引数化する、
  重い実 duel テストを直列枠で走らせる、ワーカー数を下げる。

## 最終: S03-U456 として統合済み
commit `8fb6d34`（基点 `6e454b4`）。
新規テスト `tools/test_s03_u456_target_source.js` 28 / 0、
カード側修正のみ戻した negative control は 6 FAIL / 22 PASS。
フルゲート（逐次）**21972 PASS = 21944 + 28**、FAIL 0、GATE_EXIT=0、
末尾行 `PASS no duplicate top-level function declarations`。カバレッジ変化なし。
