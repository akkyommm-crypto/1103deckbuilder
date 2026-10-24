# S03-U469 — ユニオン（U314 の残り）: 強化支援メカ・ヘビーウェポンのみ実装、他6枚は SKIP / RULING_UNRESOLVED

基点: `claude/work` `ca15a07e`（U468）。Sonnet 5.5、単一ライター。ユーザー指示: **2011年のアーカイブで確認できた側面（身代わりの範囲・装備解除の特殊召喚の表示形式）だけを実装し、文言や範囲が確認できないカードは変更せず SKIP / RULING_UNRESOLVED として記録する。** アーカイブは裁定であってカードテキストではないので、文言を推測しない。

## 基点の実測
クリーンな基点（`git archive ca15a07e` のコピー、直列 `python tools/check.py`）: **22278 PASS / 0 FAIL / 0 Traceback・ReferenceError / `GATE_EXIT=0`**（`TypeError` 1件は `test_auto_cycle32.js` の記録済みの1件）、末尾 `PASS no duplicate top-level function declarations`。依頼文の 22278 と一致。ログ: scratchpad `gate469_base.log`。

## 結論（先に）
1. **実装したのは強化支援メカ・ヘビーウェポン 1枚だけ**。身代わりの範囲・対象を取る装備・表側攻撃表示での特殊召喚・同時破壊の扱いが、いずれも**このカード自身の裁定**で確認できた。
2. **W－ウィング・カタパルト / Y－ドラゴン・ヘッド / Z－メタル・キャタピラー / アーマード・サイバーン / マシンナーズ・ピースキーパー は身代わりの範囲がアーカイブに無い**（Y は戦闘破壊のみ）ので SKIP（NOT_STARTED → `ENGINE_GAP`、理由と ruling id は `data/script_status_overrides.json`）。**マシンナーズ・ギアフレーム**は PARTIAL のまま、理由に未確認の側面を追記。
3. 共有エンジンは変更していない。`declareUnionS03`（`cards/` の U313 ヘルパー）に **opt-in の `targeted:true`** を追加した（既定 false で既存14枚は不変）。レビュー対象として明記する。

## 各カードの判断

### 実装: 強化支援メカ・ヘビーウェポン（`cards/HZZZZZZZZZZZU_claude_s03_u469_heavy_weapon.js`）
carddata の「①:」原文を根拠にし、各要素は wiki-rulings.js（1103時点のアーカイブ）でこのカード自身について確認:
| 側面 | 実装 | 根拠（answerDate / id） |
|---|---|---|
| 身代わり=戦闘破壊も効果破壊も | `substitute:'any'`（`equipSubstituteS03:true`） | 《ゲットライド!》で装備し《奈落の落とし穴》の破壊除外を身代わりで防げる 2008-09-05 `WIKI-0D89609E8794`／《リミッター解除》で破壊される場合は代わりに破壊される 2011-08-27 `WIKI-D032A4FED8D2`／「戦闘破壊・効果破壊どちらの場合でも身代わりになることはできません」（サイバー・フェニックスで無効な場合）2010-11-08 `WIKI-BFA4797D19E1` |
| 装備は対象を取る起動効果 | `targeted:true`（発動時にホストを対象に取る） | 「可能です」（起動効果）2008-07-15 `WIKI-86A8AFF69A68`／「機械族を対象にする装備魔法カードとなっている」2010-11-08 `WIKI-003014546AD2` |
| 解除は表側攻撃表示で特殊召喚 | `declareUnionS03` の解除は `'atk'` | 「装備を解除して表側攻撃表示で特殊召喚する事ができます」2009-01-20 `WIKI-8294B5F99F4B` / `WIKI-3694902B2D8A` |
| 装備モンスターと同時に破壊される場合、装備モンスターは場に残る | 既存の `FX_WIPE_ZONE` / `FX_TO_GRAVE` の身代わり判定 | 2010-12-11 `WIKI-A171EBB2ACB6`／2011-05-25 `WIKI-3ACC61A3F03B` |
| 機械族のみ・+500/+500・1ターンに1度 | `host:x=>x.db.ra==='機械'`、`atk:500, def:500`、`unionTurnS03` | carddata |

`targeted:true` の設計: 装備効果は対象を取るので、チェーンブロックにホストを記録し（相手が応答できる）、解決時にホストが場から離れていたら装備しない。**1ターンに1度の使用済みフラグは発動コストで立てる**（応答でホストが除かれても2回目は使えない）。解除側も同じフラグをコストで立てる。

### SKIP（実装しない）— 未確認の側面
| カード | 現状 | 未確認の側面と、アーカイブの検索結果 |
|---|---|---|
| W－ウィング・カタパルト | NOT_STARTED → ENGINE_GAP | 身代わりの範囲。名前を含むのは2件のみ（VW－タイガー・カタパルトの素材 `WIKI-18EF8248DFA3` 日付なし／`WIKI-9155BFEA5769` 2011-04-02）。身代わりには触れない |
| Y－ドラゴン・ヘッド | NOT_STARTED → ENGINE_GAP | **戦闘破壊の身代わりのみ**確認（2009-06-26 `WIKI-862001316DAA`）。効果破壊は無い。他の2件はXYZ－ドラゴン・キャノン（`WIKI-E64CB3FAF064`、`WIKI-9066E3EF4316`、日付なし） |
| Z－メタル・キャタピラー | NOT_STARTED → ENGINE_GAP | 身代わりの範囲。3件（`WIKI-E64CB3FAF064`、`WIKI-9066E3EF4316` 日付なし、2008-08-15 `WIKI-20596CB2591D`＝装備中は機械族扱いでない。素材の話で身代わりではない） |
| アーマード・サイバーン | NOT_STARTED → ENGINE_GAP | 身代わりの範囲。4件（2007-12-07 `WIKI-CC03EDE0F237` ATKダウンは効果／2007-12-07 `WIKI-B252DFAD3E7F` 装備が外れるとATKが戻る／2009-03-10 `WIKI-99A162E398AD`／2009-03-11 `WIKI-E30BAF458CDE`）。第2効果の裁定はあるが第1効果の範囲が無いので半実装になる |
| マシンナーズ・ピースキーパー | NOT_STARTED → ENGINE_GAP | 身代わりの範囲。**サーチは確認済み**（身代わりで破壊された時も発動できる 2009-12-12 `WIKI-6ED1EFEB7216`、他 `WIKI-75FD5B3A88FE` / `WIKI-C534E16E5B12` / `WIKI-4ADF43DFB3D7` / `WIKI-D84CDD5FC726`）だが、範囲が無くサーチだけでは半実装 |
| マシンナーズ・ギアフレーム | PARTIAL のまま（理由追記） | 身代わりの範囲。5件（`WIKI-60C6623A51E4` 2009-12-12 は分類のみ、`WIKI-34494D1483AA` 2011-01-12、`WIKI-58131B61C126` 2011-08-20、`WIKI-D3C5FD8E763E` 2010-09-09、`WIKI-BAF80DDE013C` 2010-07-12）。召喚時サーチは `cards/37_1103_expansion_v350.js:353` で実装済みで変更なし |

どのカードでも、ヘビーウェポンの範囲（戦闘・効果）を他カードへ流用しない。carddata の「戦闘・効果で破壊される場合」は現代の表記であり、2011年の文言はアーカイブから読めない。

## テスト
- `tools/test_s03_u469_heavy_weapon.js` **51 PASS / 0 FAIL**（実際のDUEL経路）: 登録（範囲 true・既存ユニオンの範囲は不変）、装備=対象（候補は自分の表側の機械族のみ、ユニオン装備済み・裏側・相手・自分自身・非機械族は候補外、チェーンブロックにtargetsが1件）、+500/+500、1ターンに1度、翌ターンの解除=表側攻撃表示、ホスト条件、応答（強制脱出装置）でホストが消えると他の機械族へ付け替えず不発・使用済み、対照（応答なし）、身代わり（戦闘／効果 FX_TO_GRAVE／実際の サンダー・ブレイク／リミッター解除＋エンドフェイズ／最終戦争の同時破壊）、破壊ではない墓地送りは身代わりにならない対照、Replay監査、2VMのSave/Load（S1 装備リンクがチェーン上＋対象記録、S2 装備済みで相手の戦闘直前）。
- 近接: `test_s03_u313_union.js` 90 PASS / `test_s03_u314_union2.js` 58 PASS（Unionの仕組み、いずれも0 FAIL）、`test_s03_u312_limited_equips` 41、`test_s03_u183_gladiator_arms` 17、`test_s03_u47_special_summon_effect_decl` 15、`test_v470_native_cards` 41、`test_s03_u135_auto_table_filters` 12、`test_s03_u176_contact2` 20、`test_s03_u468_target_scope` 67 — すべて 0 FAIL。
- **対照（negative control）**: 新規テストを前の基点ビルド（`ca15a07e`、スクラッチコピー）で実行 → **28 FAIL**（23 PASS は未実装でも成り立つ対照・Replay監査）。さらに2本の変異で各アサーションが独立に効くことを確認: ヘビーウェポンを `targeted:false` にすると **7 FAIL**（対象・チェーンブロック・応答・Save/Load）、`substitute:'battle'` にすると **6 FAIL**（効果破壊・サンダー・ブレイク・リミッター解除・最終戦争・登録）。作業ツリー自体は変更せず、スクラッチのコピーで行ったので復元は不要（作業ツリーのビルドhashは対照の前後で同一: `06e8410d99ef7d323c1541a5e3e35fd2e92bd15227c558a184c244b06a6d0503`）。

## カバレッジ（前 → 後）
TESTED 3587 → **3588**、NOT_STARTED 411 → **405**、ENGINE_GAP 341 → **346**、PARTIAL 10（不変）、IMPLEMENTED 3、GENERIC_OK 644。監査: 宣言した状態変更 1554 件、off-target 0。

## ゲート
直列 `python tools/check.py`（`check_parallel.py` は使っていない）を作業ツリーで実行: **22329 PASS / 0 FAIL / 0 Traceback / 0 ReferenceError / `GATE_EXIT=0`**、`TypeError` は基点と同じ1件（`test_auto_cycle32.js`、ログ14299行目）、末尾 `PASS no duplicate top-level function declarations`。**算術: 22329 = 基点の実測 22278 + 新規テスト 51。** ログ: scratchpad `gate469_final.log`（基点は `gate469_base.log`）。ビルドhash（この版）`06e8410d99ef7d323c1541a5e3e35fd2e92bd15227c558a184c244b06a6d0503`。コミット時の `scripts/finish-work.ps1` も同じ直列ゲートを再実行する（その結果は最終報告に記載）。

## RULING_UNRESOLVED
- 今回の SKIP 6枚（上表）: 各カードの身代わりの範囲（戦闘のみ／戦闘・効果）。
- 新たに記録した「調整中」（当時の公式が未確定。挙動は変更しない。日付付きの確定的な所見）: トラックロイドがユニオンを装備した時の攻撃力加算 2011-04-10 `WIKI-7707DB988C54`／DNA改造手術で機械族を指定した状態でヘビーウェポンを装備したクリボーに機雷化 2011-06-19 `WIKI-3294CDEAE344`／ユニオン等で破壊を免れたＡカウンターの無いモンスター 2010-12-29 `WIKI-9370CAD9B3C9`／ヴァイロン・テトラ 2010-12-09 `WIKI-F8F385B6D5DE` と漆黒の名馬 2010-12-11 `WIKI-DF8102D4C740` が「対象を取る効果で装備モンスターと同時に破壊される場合」（ヘビーウェポンだけ「装備モンスターは場に残る」と回答済み）。
- ユーザーが直接裁定した5件は現行の挙動を維持（変更なし）: 氷結界の御庭番の「氷結界」判定／ターボ・ウォリアーのエクシーズ除外と攻撃対象の付け替え／機皇城の発動場所／救世の儀式の「離れて戻った」場合／同姓同名同盟条約の解決時 4体以上・1体以下。

## Not done / next
- ユニオンを装備魔法として扱う側（《マジック・キャンセラー》で身代わりできない 2008-06-30 `WIKI-DAA61EF04921`、《サイバー・フェニックス》で装備・解除・身代わりが無効 2010-11-08 `WIKI-003014546AD2` / `WIKI-BFA4797D19E1`）は、全ユニオン共通で未対応のまま（U468 と同じ。`engine/1ZH_trap_negation_s03.js:62` の `spellFieldEffectNegatedS03` が `dbOf(card).k!=='s'` を除外するため `v46MonsterEquip` のユニオンが対象外。サイバー・フェニックスは ENGINE_GAP）。共有エンジンの変更になるので本ユニットでは触らない。
- マジック・ガードナー（装備したユニオンが破壊される代わりにカウンターを取り除く 2010-05-21 `WIKI-37F290AB97D9`）、メタル・シューター（2011-01-12 `WIKI-9605A6BBD9AA`）、移り気な仕立屋でユニオンを別の機械族へ（2010-04-09 `WIKI-659A6B8F4E93`）、力の集約（2010-07-12 `WIKI-BAF80DDE013C`）は本ユニットで検証していない（置換効果の相互作用は別ユニット）。
- 6枚の SKIP は、範囲の裁定が見つかったら `declareUnionS03('…', {host, atk, def, substitute, targeted:true})` の1行で足りる（ピースキーパーは追加で破壊時サーチ、サイバーンは第2効果、ギアフレームは召喚時サーチ済み）。
- 変更ファイル: `cards/HZZZZZZZZZZZU_claude_s03_u469_heavy_weapon.js`（新規）、`cards/HZZZZZZ_claude_s03_u313_union.js`（opt-in `targeted`）、`tools/test_s03_u469_heavy_weapon.js`（新規）、`tools/check.py`、`tools/script_coverage.py`、`build_manifest.json`、`data/s03_status_changes.json`、`data/script_status_overrides.json`、`docs/RULING_UNRESOLVED_AUDIT.md`、本書、`measurements/s03_u469.json`、`coordination/CLAUDE_RESUME.md`、再生成物（`dist/*`、`battle.html`、`data/script_coverage.json`、`data/s03_status_audit.json`、`docs/SCRIPT_COVERAGE.md`）。
