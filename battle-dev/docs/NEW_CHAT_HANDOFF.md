# 1103 Duel Simulator — New Chat / Codex Handoff (Cycle 40 時点)

> このファイルは **週間利用制限に備えた引き継ぎ用**です。
> Autonomous Loop は Cycle 40 の Full Gate 通過・checkpoint 作成まで完了しています。
> Cycle 40 完了後、ユーザー指示により **safe wrap-up mode** に入り、次 cycle は開始していません。

---

## 1. 正本（authoritative checkpoint）

| 項目 | 値 |
|---|---|
| ファイル名 | `checkpoint_auto_cycle_40_live_20260907.zip` |
| 絶対パス（作業コピー） | `C:\Users\81806\Documents\Codex\2026-08-28\files-mentioned-by-the-user-1103\work\checkpoint_auto_cycle_40_live_20260907.zip` |
| 絶対パス（共有） | `C:\Users\81806\OneDrive\デスクトップ\1103_SHARED\checkpoints\checkpoint_auto_cycle_40_live_20260907.zip` |
| SHA256 | **`1103_SHARED/LATEST.md` を参照**（この handoff は checkpoint 本体に同梱されるため、zip 自身のハッシュをここへ書けない。確定値は `1103_SHARED/LATEST.md` と `1103_SHARED/NEW_CHAT_HANDOFF.md` が持つ。前 cycle の正本 `checkpoint_auto_cycle_39_live_20260907.zip` は `e87fc8c79f2730f6acf6c0ff0dce8223da4c7b0c962167839e9dc155c3bb1e3f`） |
| サイズ / ファイル数 | `1103_SHARED/LATEST.md` を参照 |
| integrity | `zipfile.testzip()` = None（破損なし） |
| 検証方法 | **新規ディレクトリへ展開 → `tools/build.py` → `tools/build_acode.py` → `tools/check.py` → `tools/script_coverage.py` を完走**して同一数値を再現済み |

**この checkpoint だけが正本です。**
制限直前の未完成 work tree を正本にしてはいけません。
`work/_auto` の現在の中身は checkpoint 40 と一致していますが、
疑わしい場合は **checkpoint 40 を展開したものを正とする**こと。



### Cycle 01 起点の正本（歴史的記録）
`checkpoint_provenance_v30_claude_live_20260905.zip`
SHA256 `b12979a56219bd51992744319fe9b1b05eb24f6e8d17d02a1e92eb3b73496c91`
→ Cycle 1 以降 Full Gate を通した checkpoint が 40 本あるため、**現在の正本は上記の Cycle 40**。

---

## 2. Gate の実測値（Cycle 40）

| Gate 項目 | 実測 | 判定 |
|---|---|---|
| PASS / FAIL | **10629 / 0** | OK |
| TOTAL | **4996** | OK |
| Acode cards | **4996**（`build_acode.py` 出力 `cards=4996`） | OK |
| off-target 状態変化 | **0**（checkpoint 39 を再展開・再ビルドして比較。changed=6 / →TESTED=4 / →ENGINE_GAP=2 / off-target=0） | OK |
| fixture false positive | **0** | OK |
| registration miss | **0**（registration 系 1688 アサーション全 PASS） | OK |
| Replay mismatch | **0**（digest 不一致検出器そのものの PASS を除く） | OK |
| AUTOBUILD | **NO**（自動生成に頼らず手書き） | OK |
| engine changes | **0**（Cycle 01〜40 を通じて 0 件） | OK |

### カバレッジ内訳（`data/script_coverage.json`）

| status | 枚数 |
|---|---|
| TESTED | **1936** |
| ENGINE_GAP | **620** |
| NOT_STARTED | **1416** |
| GENERIC_OK | 644 |
| IMPLEMENTED | 198 |
| PARTIAL | 182 |
| **合計** | **4996** |

- **登録スクリプト総数: 975**（gate の「スクリプト名に重複なし — total=975」と一致）
  - auto（Autonomous Loop が追加した `cards/*_auto_cycle*.js` 40ファイル）: **532**
  - static（それ以外の `cards/*.js`）: **443**
  - 数え方: `grep -c "^defineScript(" cards/*.js`。Cycle 39 までの handoff に載っていた「static 1786 / auto 363」はこの定義では再現できなかったため、再現可能な定義へ置き換えた。

---

## 3. 完了している engine primitive（カード側から使えるもの）

engine は Cycle 01〜39 を通じて **一切変更していません**。
以下は「既にあり、カードスクリプトから組み合わせて使える」ことを実測済みの機構です。

| System | 使いどころ | 主な入口 |
|---|---|---|
| v3 provenance | 召喚・移動の出自 | `API.summonProvenance` / `moveProvenance` / `usedAsMaterial` / `graveInfo` |
| v4 SETCODE / GROUP | カテゴリ判定（**名前の部分一致は禁止**） | `isSetCardV4(db, SETCODE.X)` / `isCardInGroupV4` |
| v6 Battle | 戦闘の文脈 | `ctx.battle{atkCard,defCard,destroyedAtk,destroyedDef}` / `onBattleDamage` / `onDirectBattleDamage`（`evt.direct`） |
| v7 Scheduler | 「次の◯フェイズに」 | `API.schedule({at,turns/ownTurn,player,handler,args})` / `registerScheduleHandler` |
| v8 Draw | 「この効果でドローしたカード」 | `API.lastDrawCards()` / `onDrawCard` |
| v9 LeaveField | 行き先を問わない離脱 | `onLeaveField`（`evt.toZone`） |
| v10 Position | 表示形式 | `API.changePosition` / `continuous.cannotChangePosition` / `forcedPosition` |
| v11 Token | トークン | `defineTokenSpecV11` / `API.createTokens` / `isToken` / `tokenKey` |
| v12 Activation | 発動の分類 | `onActivateSuccess{uid,player,kind,sub,chainId,chainLink}`（kind: spell/trap/monster） |
| v13 Negation | 無効化 | `API.negateChainLink(chainId, mode, reason, destroySource)` / `negateEffectUntil` |
| v14 StatModifier | 攻守 | `modAtk` / `setAtk` / `setBaseStats` / `swapBaseStats` / `clearModsByLabel`（until: endPhase / endTurn / endBattlePhase / permanent） |
| v15 Equip | 装備 | `equipSpec.canEquip` / `API.equipSpell` / `equipMonster` / `moveEquip` / `equipsOn` |
| v17 CharMod | 種族・属性・名前 | `setRace` / `setAttribute` / `setCardName` / `setTuner` |
| v18 LpChange | LP の置換 | `continuous.lpChange` / `API.addLpRule({mode:'prevent'/'half'/...})` |
| v19 EffectCategory | 対象の参照 | `API.activationTargets(evt)` |
| v20 Reveal / Inspect | 公開と確認 | `API.reveal({audience:'both',until})` / `API.inspect(viewer, targets)` |
| v21 Protection | 破壊耐性 | `continuous.protectV21{key,label,battle,effect,perTurn,scope}` |
| v23 MaterialFilter | リリース素材制限 | `normalSummonProcedure.methods[].materialFilter(candidate, ctx)` |
| v26 Control | コントロール | `API.changeControl(..., 'endPhase', src)` / `swapControl` / `linkControlReturn` |
| v29 GraveContinuous | 墓地をソースにする継続効果 | `continuous.from` に `'grave'` を含める（**opt-in / 現在 19 枚・上限 20。残り1枠**） |
| v41/v44 Replay | 再生監査 | `v41ReplayPackage` / `v44ReplayAuditPackage` / `duelRandomInt(max, gs)` |
| v46 MonsterEquip | モンスターを装備カード扱い | `API.equipMonster` (`FX_MONSTER_EQUIP_V46`) |
| v48 Attack | 追加攻撃 | `API.grantAdditionalAttack(t,n,reason,afterCurrent)`（**`grantMultiAttack` は使用禁止**） |
| 召喚手順 | 妥協召喚・リリース軽減 | `normalSummonProcedure{includeStandard, methods:[{id,tributes,modes,condition,materialFilter,baseStats}]}` |

---

## 4. Cycle 24〜40 で新たに判明した主要な engine gap

これらは **カード側では書けない**と実測で確認したものです（`data/script_status_overrides.json` に理由付きで記録済み）。

### A. 「〜できない」を宣言する層が無い（最も多い）
- **プレイヤー単位の発動禁止**：「相手は魔法・罠を発動できない」「1ターンに1度しか発動できない」
  → 氷結界の交霊師 / ブリザード・プリンセス / エレキリン
- **カード名単位の発動禁止**：「このターン、そのカードと同名カードは発動できない」
  → 黒き森のウィッチ / 泉の精霊
- **条件付きの特殊召喚禁止・許可**：`cannotSpecialSummon` は全面禁止のみ
  → The supremacy SUN（自分の効果でだけ可）/ 氷の女王（墓地からだけ不可）/ ガーディアン・シール（条件付き許可）
- **特定カードを攻撃対象から外す**（`cannotBeAttacked` 相当）→ またたびキャット
- **属性指定の特殊召喚禁止**：`v46GlobalSpecialSummonRestrictionReason` はカード名直書き → コアキメイル・ドラゴ

### B. 耐性・無効化の層が足りない
- **「効果を受けない」「対象は取れるが効果だけ無効」**：あるのは `immuneToTarget` と `protectV21`(破壊)だけ
  → サイレント・ソードマン LV3 / LV5
- **モンスター発の `negateEffect` は他のモンスターに届かない**
  （`continuousSources` は outer=sz/field が inner=mz を無効化する片方向）
  → コアキメイル・パワーハンド / コアキメイル・デビル
- **チェーン参加そのものの禁止** → 久遠の魔術師ミラ

### C. 情報の裏表
- **裏側表示での除外が無い**（表向き除外だと隠匿情報が漏れる）
  → タイムカプセル / サイ・ガール / 光の封札剣
- **墓地の閲覧制限・カード名の宣言入力が無い** → クイズ
- **お互いが同時に伏せて選ぶ入力が無い** → アンティ勝負

### D. provenance / 記録の不足
- **「どのカードの効果で特殊召喚されたか」**（`summonProvenance` は summonType と materialRefs のみ）
  → 暗黒のミミック LV3 は **LV1 側に印を刻む**カード同士の合成で回避した（cycle 24）
- **「相手のカードの効果でセットされた」** → ヒーロー・メダル
- **「自分が相手のカードの発動を無効にした」** → A・ジェネクス・リバイバー
- **貫通ダメージを与えた事実**（`applyPiercingDamage` は金額を返すだけ）→ ドリル・シンクロン
- **ユニオンを装備した状態で戦闘した事実** → コンビネーション・アタック
- **場に表側で存在したターン数** → ブロックマン

### E. 経路が無い
- **墓地から装備する** → ガーディアン・エルマ / ギルフォード・ザ・レジェンド / ゲットライド!
- **攻撃宣言にコストを要求する** → トリプル・ヴァイパー
- **「攻撃した場合」をチェーンに乗せずにルール処理する** → ゴブリン偵察部隊
- **コストの支払いを外部から免除する** → 念動増幅装置
- **戦闘1回だけを単位にした LP 規則 / 期限** → 死力のタッグ・チェンジ / ガントレット・ウォリアー
- **墓地のカードへの継続的な名前変更** → サイバー・ドラゴン・ツヴァイ
- **`cannotSynchroMaterial` はスクリプト単位**（カード実体に立てられない）→ 五稜星の呪縛

### F. 誘発ブランチ単位の forced 判定が無い（Cycle 40 で判明）
- `defineScript` の `forced` は**スクリプト単位の真偽値**で、
  `engine/40_legal_script_engine.js:1632 / 1680 / 1694` がいずれも `!!sc.forced` で一括評価する。
- そのため **1枚の中に「〜できる」（任意誘発）と「〜する」（強制誘発）が同居するカード**を
  正しく書けない。どちらへ寄せても半実装になる。
- 該当（Cycle 40 で ENGINE_GAP 化）: **沈黙のサイコウィザード** / **寡黙なるサイコプリースト**
- 必要な形: `forced` が `(ctx, eventName) => bool` も受け付け、
  SEGOC の rank 判定（`segocRank`）と発動強制判定の双方が同じ関数を通ること。

---

## 5. 候補探索（discovery）と preflight の現況

- **NOT_STARTED は 1416 枚**。候補はまだ十分にある。
- 探索は `data/carddata.json` × `data/script_coverage.json` を突き合わせ、
  status が NOT_STARTED のものをテキスト正規表現で絞る方式。
- **1 cycle あたり 4〜13 枚**が安定した実装量。テキストが長いカードほど gap を踏みやすい。
- **preflight は必ず `data/carddata.json` の `e`（実テキスト）を読んでから行う。**
  Cycle 40 では記憶ベースの下書き 7 枚のうち 3 枚が実テキストと食い違い、
  preflight で 4 枚へ絞り込んだ（詳細は `docs/AUTO_DEVELOPMENT_LOG.md` の Cycle 40）。

### 次に狙える鉱脈（preflight 済み・未着手）
| テーマ | 見込み | 備考 |
|---|---|---|
| 残りのコアキメイル群 | ○ | `d9Koaki(name, show, spec)` に述語を渡すだけ。ただし「他モンスターの効果無効」を持つ個体は gap |
| 「デッキから特殊召喚」リクルーター | ○ | cycle 26 で経路確立済み |
| ワーム群 | △ | ワーム・ゼクスが **PARTIAL** なので fixture に使えない。先にゼクスを TESTED にする必要あり |
| スピリット群の残り | △ | ENGINE_GAP が多い（cycle 13 で大量に落としている） |

### fixture の安全性ルール（cycle 31 で実測確認）
- **安全**：TESTED / GENERIC_OK / NOT_STARTED / **ENGINE_GAP**（status override が勝つので動かない）
- **危険**：**IMPLEMENTED / PARTIAL**（テストに出すと TESTED へ昇格して off-target 違反になる）

---

## 6. 次に推奨するタスク（再開時の最初の一手）

1. **checkpoint 40 を新規ディレクトリへ展開して Gate を1回通し、数値が一致することを確認する**
   （`PASS 10629 / FAIL 0 / TESTED 1936 / ENGINE_GAP 620 / NOT_STARTED 1416 / TOTAL 4996`）。
   ここが一致しない環境では**何も書き始めない**。
2. **Cycle 41 は「デスカイザー・ドラゴン」から始めるのが最短。**
   Cycle 40 の preflight で効果部分は既存 primitive
   （`API.specialSummon` + `API.linkOnLeave`）で書けることを確認済み。
   残作業はシンクロ素材指定「『ゾンビキャリア』＋チューナー以外のアンデット族1体以上」を
   `synchroMaterialRestriction`（`engine/20_effect_primitives_ex.js:672`）で宣言すること。
   同じ形で書けるシンクロモンスターがまとめて拾えるはず。
3. Cycle 40 の候補探索（`pool13.py "召喚に成功した時"`）で残っている未着手候補:
   アルカナフォースXXI－THE WORLD / エンペラー・オーダー / 凶悪犯－チョップマン /
   宝玉獣 ルビー・カーバンクル / 氷結界に住む魔酔虫 / 異星の最終戦士 / 絶対防御将軍。
   ただし下記は既知 gap を踏むので preflight で落ちる見込み:
   異星の最終戦士・召喚の呪詛系の「召喚できない」宣言層、氷結界に住む魔酔虫のゾーン単位封鎖、
   凶悪犯－チョップマン／宝玉獣の「墓地から装備」「モンスターを永続魔法として扱う」。
4. engine gap を埋めたい場合は **通常 cycle とは別枠**で、
   ユーザーの明示指示のもとに 1 System ずつ設計すること（通常 cycle では engine 変更禁止）。
   優先度が高いのは **A の「〜できない」層**（該当カードが最も多い）。
   次点で **誘発ブランチ単位の forced 判定**（Cycle 40 で新たに判明。下記 4-F）。

---

## 7. Autonomous Loop の運用ルール（そのまま維持すること）

1. **正確性 > 実装枚数。** 書けないカードは SKIP して ENGINE_GAP に理由を記録する。**半実装禁止。**
2. **通常 cycle では engine 変更禁止・新規 primitive 追加禁止。**
   `engine/` は共有ルール、`cards/` は既存 primitive の組み合わせ。**カード専用の engine ハックは禁止。**
3. **5点プリフライト**を通ったものだけ READY にする。
   ①権威（実 SETCODE / canonical / 種族 / 属性。**カード名の部分一致は禁止**）
   ②Event Producer が実在するか（実測する）
   ③Consumer が存在するか（dead write を作らない）
   ④Source / Lifecycle
   ⑤payload のフィールドが実際に埋まっているか（**推測で undefined を使わない**）
4. **「コードを見て無さそう」だけで engine 修正しない。** 必ず producer/consumer を実測する
   （cycle 19 のシンクロ素材 provenance 誤診が実例）。
5. **カード登録の第1引数は必ず文字列リテラル。** `forEach`/`map`/`for...of` での登録は禁止。
   `helper('カード名', ...)` の形は可（カバレッジ走査が追える）。
6. **テストは positive + negative + ruling edge + カード固有アサーション**を必ず含める。
   Replay digest 検査も入れる。`grantMultiAttack` は使わない。
   複数召喚は `RESOLUTION_SUMMON_BATCH_V2`。**隠匿情報を相手に漏らさない。**
7. **passive / continuous は read-only。** 書き込みは `resolve` / `cost` / schedule handler / choice handler だけ。
8. **Gate**：FAIL=0 / TOTAL=4996 / Acode 4996 / off-target 0 / fixture false positive 0 /
   registration miss 0 / Replay mismatch 0 / AUTOBUILD=NO。
9. **Gate クリーンごとに checkpoint** を `checkpoint_auto_cycle_XX_live_YYYYMMDD.zip` で作り、
   SHA256 / testzip / **新規展開しての再実行**まで確認して正本を差し替える。
   **Gate を通った checkpoint は常に1本以上残す。**
10. checkpoint 作成スクリプトは **出力ファイル名を引数で受け、既存ファイルがあれば上書きせず中断**すること
    （cycle 23 で cycle 22 の zip を上書きした事故があり、共有フォルダの正本から復旧した）。
11. 通常 cycle 中は「次どうしますか？」と聞かない／「ここで止めます」と言わない。
    **停止するのはユーザーが safe wrap-up を指示した時だけ。**

---

## 8. 同時編集の禁止（重要）

> **Claude と Codex は同じ live tree（`work/_auto`）を同時に編集しないこと。**

- 作業コピー：`C:\Users\81806\Documents\Codex\2026-08-28\files-mentioned-by-the-user-1103\work\_auto`
- どちらか一方だけが `work/_auto` を編集する。もう一方は
  **checkpoint zip を別ディレクトリへ展開して読む**か、`1103_SHARED` の内容を参照するだけにする。
- 引き継ぐ時は必ず「最新の Gate 済み checkpoint」を起点にする。
  途中の work tree を相手に渡さない。
- 共有フォルダ `C:\Users\81806\OneDrive\デスクトップ\1103_SHARED` は
  **Claude 側からの一方向コピー**で維持している（原本の削除・改変はしていない）。
  Codex 側が書き戻す場合は、先にこのルールを合意し直すこと。

---

## 9. 主要ファイルの場所

| 種別 | パス（`work/_auto` 相対） |
|---|---|
| ビルド | `tools/build.py` → `dist/battle.html` |
| Acode | `tools/build_acode.py data/carddata.json` |
| Full Gate | `tools/check.py` |
| カバレッジ | `tools/script_coverage.py` → `data/script_coverage.json` |
| 連結順 | `build_manifest.json`（**新規カードファイルは必ず登録する**） |
| status 上書き | `data/script_status_overrides.json`（ENGINE_GAP と理由） |
| 開発ログ | `docs/AUTO_DEVELOPMENT_LOG.md`（Cycle 12〜39 の詳細） |
| 自動追加カード | `cards/A3_auto_cycle01.js` 〜 `cards/E2_auto_cycle40.js` |
| 自動追加テスト | `tools/test_auto_cycle01.js` 〜 `tools/test_auto_cycle40.js`（`tools/check.py` に順次接続） |

---

## 10. これまでの進捗（Cycle 12〜40 抜粋）

| cycle | PASS | 実装 | この cycle の要点 |
|---|---|---|---|
| 12 | 8463 | 24 | 破壊記録 v30 / `c1DestroyRecord` |
| 19 | 9146 | 15 | **シンクロ素材 provenance は存在した**（誤診の訂正） |
| 20 | 9289 | 14 | アドバンス召喚 provenance |
| 23 | 9479 | 12 | `onActivateSuccess` の kind/player / `immuneToTarget` |
| 24 | 9573 | 13 | System v8 lastDrawCards / 墓地からの残存効果 |
| 25 | 9672 | 13 | Scheduler v7 standbyPhase / 墓地ソース v29 |
| 26 | 9762 | 12 | normalSummonProcedure / エクストラからの特殊召喚 |
| 27 | 9841 | 11 | 手札からの自己特殊召喚 / `continuous.lpChange` |
| 28 | 9921 | 11 | `banishInfo.pos` で同じ表示形式に戻す / 表示形式ロック |
| 29 | 9988 | 9 | materialFilter によるリリース素材制限 |
| 30 | 10058 | 10 | コアキメイル維持コストの一般化 / label 単位の mod 消去 |
| 31 | 10126 | 9 | 装備の3系統 / 装備先 uid を刻んで追跡 |
| 32 | 10181 | 7 | reveal と inspect の使い分け / duelRandomInt |
| 33 | 10250 | 9 | チェーン位置での分岐 / 手札に戻る装備 |
| 34 | 10308 | 7 | デッキからの複数リクルート / 種類の宣言 |
| 35 | 10365 | 8 | ダメージ計算時の攻撃力アップ / linkOnLeave の向き |
| 36 | 10422 | 7 | 貫通の3通り / continuous.lpChange で戦闘ダメージ0 |
| 37 | 10478 | 8 | 除外と帰還 / uid 配列をカードに持たせる |
| 38 | 10533 | 8 | トークン生成 / コイントスと当て物 |
| 39 | 10584 | 8 | 墓地へ送られた時に誘発する装備魔法 |
| **40** | **10629** | **4** | 召喚成功トリガ / 魔法・罠は `onOtherSummon` 必須 / 魔法種別は `db.sub` |

累計：Cycle 11 開始時 PASS 8413 → **10629**、TESTED 1588 → **1936**、NOT_STARTED 1857 → **1416**。
**engine 変更 0 件・off-target 状態変化 0 件を全 cycle で維持。**
