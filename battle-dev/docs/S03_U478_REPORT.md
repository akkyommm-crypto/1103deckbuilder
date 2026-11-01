# S03-U478 — 固定 2 枚を対象にする 3 枚（墓守の石版 / 無欲な壺 / ガスタのつむじ風）の宣言（targets:true + targetCount:2）

基点: `claude/work` `df749a6e`（U477、push 済み、origin と一致）。**基点ゲートは自分で測定**: クリーンツリーで直列 `python tools/check.py` を 1 回 → **23734 PASS / 0 FAIL / GATE_EXIT=0**（`^FAIL` 0、Traceback・ReferenceError 0、末尾 `PASS no duplicate top-level function declarations`、ビルド hash `cfe31ef8…`）。U477 の記録（23734）と一致。ログ: `scratchpad/gate_u478_base.log`。単一ライター、`claude/work` のみ。**共有エンジンの変更なし**（`cards/` の宣言のみ）。

**公開の扱い**: このコミットは、GitHub Actions `verify-battle` が成功するまで integration / 公開の対象にならない。マージは提案しない。

## 1. 各カードの対象枚数（`data/carddata.json` の `e` を自分で確認）と裁定
| カード | `e`（要旨） | 対象枚数 | 裁定（`wiki-rulings.js`） |
|---|---|---|---|
| 墓守の石版 | 「自分の墓地の『墓守の』と名のついたモンスター2体を選択して手札に加える」 | **2** | **WIKI-75BD27DD876A**（answerDate 2009-11-26）Q「墓地の墓守のと名のついたモンスター２体を対象を取りますか？」A「はい、対象を取ります。」 |
| 無欲な壺 | 「自分または相手の墓地に存在するカードを合計2枚選択し、持ち主のデッキに戻す」 | **合計 2** | **WIKI-E963579D7337**（2009-11-26）A「対象を取る効果ですので、発動時になります。」 |
| ガスタのつむじ風 | 「自分の墓地の『ガスタ』と名のついたモンスター2体を選択してデッキに戻す。その後、デッキから守備力1000以下の『ガスタ』1体を特殊召喚する」 | **2**（特殊召喚するカードは選択して対象にしない） | 「対象を取る」と明言した個別回答は無い。**WIKI-A7D8467EA203**（2011-04-27）が「効果解決時に対象に選択した墓地のモンスター」と述べる。根拠は文言（「選択して」）と 1103 の運用。 |

メタルシルバー・アーマーの複数対象の例外は「裁定の一般的な回答文に基づく Codex の採用解釈」（`WIKI-32A7C5F81B06`、2009-06-18、S03-U472）。回答文は対象の場所を限らないので墓地を対象にする複数対象にも当てる。「ユーザー独自裁定」の枠は使っていない。

## 2. 変更（`cards/` の宣言のみ）
- `cards/35_1103_expansion.js` 墓守の石版: `targets:true, targetCount:2`。
- `cards/H8D_claude_s03u68_activation_negated_release_secondary.js` 無欲な壺: `targets:true, targetCount:2`。
- `cards/89_p11_activation_choice_recovery.js` ガスタのつむじ風: `targets:true, targetCount:2` ＋ 選択候補の絞り込み（下記）。

### ガスタのつむじ風（P1.1 / `activationV11`）で違ったこと
他の 2 枚（レガシー `selectTargets`）では宣言だけで完結した。つむじ風は **宣言だけでは足りない**: `prepareDuelActivation` は `activationV11` を呼ぶ前に `endActivationPrepS03()` で発動準備の控えを外す（`engine/30_processor_chain_battle.js:1514`）ので、`requestChoice` の `targeting:true` が呼ぶ `filterTargetable` は**効果の発生源の名前を知らず**（渡るのはプレイヤーだけ、`engine/09_choice_request_v49.js:186`）、`targetCount` が見えない。測定: `targets:true,targetCount:2` ＋ `targeting:true` だけではアーマー下で選択が開かず `PREP_TX_ABORT:p11-abort`（アーマーが単体扱いで制限）。
対応（カード側、エンジン無変更）: 候補を、このスクリプト自身が宣言した効果ソース（`targetEffectSourceS03(ctx.player,{name:'ガスタのつむじ風'})` の明示 effectInfo）で `filterTargetable` に通してから開く。同じ `filterTargetable` なので他の対象耐性は全て効く。選択の `targeting` は立てない（立てるとエンジンが名前なしで再度絞って例外が消える）。選択は 1 回の min2/max2（石版・無欲な壺は 1 枚ずつ 2 回）。中止の理由も違う（P1.1 は `PREP_TX_ABORT:p11-abort`、レガシーは `:insufficient`）。
**エンジン側のより素直な解（Opus 判断・未実施）**: `requestChoiceV49` が `spec.meta.scriptName`（`p11cOpen` が全 P1.1 箇所で渡している）から effectInfo の名前を作って `filterTargetable` に渡す。P1.1 の対象選択 31 箇所全体に効く共有エンジンの変更なので触っていない。採用されたらこのカード側の絞り込みは冗長になる（害はない）。U476 が挙げた `targeting:true` 欠落の残り 2 か所（幻惑の巻物・異次元への隙間）も未着手。

## 3. 検証した面（`tools/test_s03_u478_two_target_cards.js`、**156 PASS / 0 FAIL**）
3 枚それぞれ、アーマー無し（ctl）とアーマー下（msa: 装備モンスター サイバー・ドラゴン、墓地の全モンスターが保護される）で実際の発動を駆動:
1. **対象の確定**: チェーンリンクに選んだ 2 枚が uid で記録（`linkTargetUidsS03`、`link.targets` 2 件）、保存形式を復元すると**実カードそのもの**（複製ではない、`rawLive`）、JSON 往復でも同じ uid、解決の発生源 `srcS03.tg` にも載る。
2. **耐性判定**: msa では保護された墓地のモンスターが**候補に出る**（複数対象の例外）。対照: 他の対象耐性の発生源（このテスト内だけで、ホルスのしもべ のスクリプトに墓地向け `immuneToTargetOffField` を一時的に足す合成。実カードで墓地の対象耐性を持つのはアーマーだけ）が 1 枚を保護 → その 1 枚は選べず他は選べる／全モンスター保護 → 準備が U471 の取り消しで戻り、カードは手札／魔法罠ゾーンに戻る。`filterTargetable` に宣言どおりの effectInfo と単体の effectInfo（強制脱出装置）を渡す比較で、宣言の有無が分かれ目になることも固定。
3. **正常発動**: 発動 → 対象選択 → 解決が最後まで通り、**選んだ実カード（uid）が動く**: 石版＝2 体が手札へ、他の墓守は墓地のまま／無欲な壺＝それぞれ**持ち主の**デッキへ（P1 の墓守の番兵→P1、P0 のゴブリン突撃部隊→P0）、サイクロンとワイトは墓地のまま、壺は**除外**／つむじ風＝2 体がデッキへ→ウィンダ（DEF400）が守備表示で特殊召喚、未選択のガスタは墓地のまま。
4. **Replay 監査**: 全シナリオで全 digest と最終 digest を再現。**Save/Load**（`saveDuel` → 新 VM → `offerResumeDuel`）: ctl・msa × 3 枚で、チェーン上（対象確定済み）で保存 → 再開後もリンクの対象 uid・`srcS03.tg` が同じ → 解決 → 追跡した全カードの位置／表示形式／表裏と最終 digest が無中断の VM1 と一致。
5. **U475 の相互作用（必須）**: `targets:true` で選択がチェーンに載っても複製にならないことを、復元が実カードと同一性で一致すること（`rawLive`）と、解決時に選んだ uid のカードが実際に動くことで 3 枚とも確認。**選択の返り値の修正は不要だった**（石版・無欲な壺は候補エントリをそのまま返す、つむじ風は uid で動かす）。
6. **単体対象の対照**: 強制脱出装置はアーマー下で候補が装備モンスターだけ（`targetCount` null、`targetsMultiple` false）、リビングデッドの呼び声（墓地・単体）は引き続き発動前に断られる。例外は漏れていない。
7. **裁定の回帰ピン**（この単位の宣言が挙動を変えていないこと）: WIKI-A195DBDAF3D1（石版 2009-12-23「残りの１体を手札に加えます」）— 選んだ 1 枚が解決時に無くなっても残りは手札へ。WIKI-A7D8467EA203（つむじ風 2011-04-27「２枚とも、もしくは１枚しか存在しない場合、デッキに戻す処理を行わず、特殊召喚もできません」）— 1 枚だけなら何も戻らず特殊召喚もされない。どちらも測定で既存挙動と一致（修正不要）。

## 4. U472 のピン（`test_s03_u472_multi_target_armor.js`）— ユーザー承認の対応範囲の拡張
旧: 「`targetCount` を宣言するスクリプトは丁度この 5 枚」（名前の集合）。新: **名前→対象数の対応表を丸ごと比べる**（貪欲な壺 5 / 諸刃の活人剣術 2 / 毒蛇の供物 3 / TGX3－DX2 3 / ゴッドバードアタック 2 / 墓守の石版 2 / 無欲な壺 2 / ガスタのつむじ風 2）。件数 8 ＋ 名前の集合 ＋ 各カードの数が全て一致しなければ FAIL。ユーザーの条件「件数だけでなく、対象カード名と対象数の一致を検証するガードを維持」を満たす。**これはユーザーが承認した対応範囲の拡張であり、テストの緩和ではない。この承認は Opus が S03-U478 に引き継いだ。**（テストのコメントにも同じ記載。）
ガードの実効性（実測）: 石版の `targetCount` を 3 に変える → FAIL 1／意図しないカード（次元幽閉）に `targetCount:2` を足す → FAIL 1。どちらも復元して再ビルド済み。

## 5. 他の既存テストの変更（要確認）: `test_s03_u476_selection_targets.js` の audit pin のみ
U476 の audit pin は「保留 3 枚（石版・無欲な壺・カイクウ）が意図的に未宣言（targets も targetCount も無い）／候補 39」を固定していた。本単位で 2 枚が宣言を得て候補から外れるのは機械的な帰結なので、**同じ厳しさのまま**更新した（変更はこの pin の 3 assertion のみ。他の assertion は無変更）:
- 「stale が無い」: `DEFER_MULTI` を `['霊滅術師 カイクウ']` に縮め、石版・無欲な壺は `DECLARED_U478` へ（`classified` から外れる）。
- 「残りは 39 = 33 + 3 + 3」→「**37** = 33 non-targeting + 1（カイクウ、可変枚数で保留）+ 3 open」。件数は厳密一致のまま。
- 「保留 3 枚は未宣言」→「**カイクウだけ**が未宣言（targets も targetCount も無い）」＋ 新規「石版・無欲な壺は候補でなく、`targets:true` かつ `targetCount===2`」（assertion 1 件増）。
未知のカードが増減すれば引き続き FAIL する（走査の導出は無変更）。件数: U476 167 → **168**。これ以外の既存の期待値は弱めず・削除せず・skip せず。

## 6. テスト件数・近接
- 新規 U478: **156 PASS / 0 FAIL**（`check.py` と `script_coverage.py` の `CARD_TEST_FOCUS`（3 枚）へ接続。フィクスチャは TESTED を得ない）。
- 近接（全て 0 FAIL）: U472 103（件数変わらず、ピンのみ更新）／U476 168／U135 12／p11_activation_cards 80／expansion_v330 10／u131_necrovalley 8／u68 23／U470 176／U471 202／U473 77／U474 122／U475 274／U477 284／U468 67／U456 28／U457 111／U459 15／u04_lock_recovery 39。

## 7. Negative control（宣言だけを戻して再ビルド）
- **A: 3 ファイルの変更を全部戻す**（ビルド hash は基点と同じ `cfe31ef8…`）: U478 **93 PASS / 63 FAIL**、U472 ガード 1 FAIL、U476 pin 3 FAIL。
- **B: 宣言だけ戻す**（つむじ風の絞り込みは残す）: U478 85 PASS / **71 FAIL**、U472 1 FAIL、U476 3 FAIL。
- **C: `targets:true` だけ残し `targetCount` を外す**（U476 が懸念した「アーマーが誤って単体扱いで制限する」状態）: U478 96 PASS / **60 FAIL**（msa の候補・チェーン・解決・Save/Load が落ちる）、U472 1 FAIL。
- 復元後の再ビルド hash `c375c6a2…` は変更後ビルドと一致（`scratchpad/nc478/final_buildhash.txt`）。

## 8. ゲート
直列 `python tools/check.py`（変更・配線後の実ツリーで 1 回、他は何も走らせず。ログ `scratchpad/gate_u478_final.log`）: **GATE_EXIT=0 / 23891 PASS / 0 FAIL（`^FAIL`）/ Traceback・ReferenceError 0**、末尾 `PASS no duplicate top-level function declarations`。`TypeError` 1 件は `test_auto_cycle32.js` の既知（基点ゲートにも 1 件）。
算術: **23891 = 実測した基点 23734 + 新規 156 + U476 pin の増分 1**（U472 は件数不変）。

## 9. カバレッジ（前 → 後）
`script_coverage.py`: TESTED 3588 / GENERIC_OK 644 / NOT_STARTED 405 / ENGINE_GAP 346 / PARTIAL 10 / IMPLEMENTED 3 → **同じ**（3 枚は以前から TESTED。`tests` 欄にこのテストが加わる）。`s03_status_audit.py` PASS。

## 10. Not done / 次
- **単位 3**: 霊滅術師 カイクウ／暗黒界の武神 ゴルド — 対象枚数が可変（発動時に決まる）。採用方針: 1 体ならアーマーが制限、2 体なら例外、発動後に減っても単体には戻らない。固定の `targetCount:2` ではなく実際に選んだ数に従う。
- **単位 4**: E・HERO エアーマン／ダスト・シュート — 選択を解決時（非対象）へ。
- 範囲外で未着手: 約 70 本の `event.card` 同一性比較（エンジンの正規化は Opus 判断）、グラファの手札公開（WIKI-9A95D36090C4）と `done([])`、道 C、中央版 A、生の対象プールを読む約 119 枚の免疫カードの `condition`、MANUAL モードの `runScript` コスト、切り詰め Journal、WIKI-89BB9D36443F。ユーザー裁定で挙動維持の項目（氷結界の御庭番／ターボ・ウォリアー／機皇城／救世の儀式／同姓同名同盟条約）は変更なし。
- P1.1 の効果ソース名（上記）と、`targeting:true` 欠落の残り 2 か所（幻惑の巻物・異次元への隙間）。

## 変更ファイル
`cards/35_1103_expansion.js`・`cards/H8D_claude_s03u68_activation_negated_release_secondary.js`・`cards/89_p11_activation_choice_recovery.js`／`tools/test_s03_u478_two_target_cards.js`（新規）・`tools/test_s03_u472_multi_target_armor.js`（ピン）・`tools/test_s03_u476_selection_targets.js`（audit pin）・`tools/check.py`・`tools/script_coverage.py`／`data/script_coverage.json`／`dist/battle.html`・ルート `battle.html`（ビルド）／`docs/S03_U478_REPORT.md`／`coordination/CLAUDE_RESUME.md`。
