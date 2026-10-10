# 次に実装する共通primitive — ENGINE_GAP 847件 ゼロベース再分析

live 基準: 2932 PASS / 0 FAIL、TESTED 905 / IMPLEMENTED 198 / GENERIC_OK 644 /
PARTIAL 182 / **ENGINE_GAP 847** / NOT_STARTED 2220、合計 4996、Acode 4996。
P1 / P1.1 / P3 / P4 統合済み。

## 1. 分類方法

判定はカードテキストを主軸にし、旧 reason のラベルは補助にとどめた。
**P1 / P1.1 / P3 / P4 で解消済みのラベル（resolution-time Choice / activation-time Choice /
target selection / declaration / activation cost / provenance）は全件からラベルごと除去**し、
古い reason だけで重複カウントしないようにした。

ラベル数分布: 1個 510 / 2個 205 / 3個 97 / 4個 31 / 5個以上 4。

## 2. primitive別 依存件数（multi-label・重複あり）

| primitive | 件数 | primitive | 件数 |
|---|---:|---|---:|
| Battle | 233 | Ritual | 44 |
| ContinuousRule | 219 | summon procedure | 43 |
| （その他・未分類） | 207 | Damage / LP | 40 |
| Delayed / timing / scheduling | 171 | hidden information | 38 |
| negation | 74 | equip metadata | 34 |
| draw / effect-draw event | 52 | atomic deck operation / shuffle | 30 |
| EffectCategory / ChainSource | 48 | Modifier | 25 |
| counter metadata | 46 | leave-field / generic event | 21 |
| | | special summon provenance | 20 |
| | | activation window / response timing | 11 |

## 3. A / B / C と手動監査後の正味A

機械判定の上位3（Battle 75 / ContinuousRule 62 / Delayed 32）に加え、小型候補4種も全件監査した。
**計 211枚を1枚ずつカードテキストと現行APIで確認**している。bulk reclassify はしていない。

| primitive | 機械A | **正味A** | 除外（既存で書ける） | 降格（他primitive必要） | B |
|---|---:|---:|---:|---:|---:|
| **Battle** | 75 | **44** | 12 | 19 | 79 |
| **ContinuousRule** | 62 | **19** | 7 | 36 | 81 |
| **Ritual** | 20 | **19** | 1 | 0 | 17 |
| **Delayed** | 32 | **16** | 8 | 8 | 59 |
| draw / effect-draw event | 17 | **6** | 4 | 7 | 25 |
| EffectCategory / ChainSource | 12 | **5** | 0 | 7 | 9 |
| leave-field event | 3 | **2** | 0 | 1 | 10 |
| special summon provenance | 3 | **2** | 1 | 0 | 5 |

除外の実例:
ジュラック・イグアノン / マスクド・チョッパー（`onBattleDestroy` 既存）、
ダブルアタック / ヒーローハート / ミョルニルの魔槌（`grantAdditionalAttack` 既存）、
ハ・デスの使い魔 / ハーピィの狩場（continuous stat layer 既存）、
悪魔への貢物（`specialSummoned` 既存）、パイナップル爆弾 / レア・ヴァリュー / 武器庫荒らし（P1 で書ける）、
大騒動（P3 で書ける）、第六感（P1.1 で書ける）、マンジュ・ゴッド（既存メタデータで書ける）。

**旧順位は覆った。** ContinuousRule は機械62に対し正味19（降格36件は EffectCategory /
型変換 / 追加召喚権など別primitive依存）。Ritual は機械20 → 正味19 で**降格ゼロ**の唯一の候補。

## 4. 比較

| | Battle | ContinuousRule | Ritual | Delayed |
|---|---:|---:|---:|---:|
| 正味A | **44** | 19 | 19 | 16 |
| B | 79 | **81** | 17 | 59 |
| 実装規模 | 大 | 大 | **小** | 中 |
| state追加量 | 3 | 多 | **1〜2** | 2 |
| Replay/Undo/SaveLoadリスク | **高** | 中〜高 | **低** | 中 |
| P1/P1.1/P3/P4 再利用度 | 中 | 低 | **高** | 高 |
| 既存engineへの侵襲度 | 高 | **最高** | **低** | 低〜中 |
| コストあたり回収効率 | 中 | **最低** | **最高** | 高 |
| 下流レバレッジ | **最大** | 大 | 小（儀式に閉じる） | 大 |

- **Battle** はゼロからの新subsystemではない。`pendingAttack` / `onAttackDeclare` /
  `onBattleDestroy` / `onDamageStep` / `grantAdditionalAttack` / `negateAttack` は既に稼働しており、
  欠けているのは①貫通を含むダメージ計算層 ②ダメージの置換・倍化・反転 ③直接攻撃許可と攻撃対象の変更
  ④戦闘ダメージ量を運ぶイベント ⑤バトルフェイズ制御 — 既存パイプラインへの追加層である。
  ただしダメージステップは既存テストが最も多い区間で、回帰リスクは候補中で最大。
- **Ritual** は19枚のうち16枚が「レベル合計N以上になるようリリース」の同一形状で、
  1つの汎用実装で吸収できる。降格ゼロ・侵襲度最低・Replayリスク最低。
  ただし波及先が儀式に閉じており下流レバレッジは小さい。
- **ContinuousRule** は B 81 が全候補中最大だが、正味A は Battle の半分以下で侵襲度は最大。
  単独では効率が悪く、Delayed の後に回すべき。
- **Delayed** は ContinuousRule の降格分の多くが期間管理を必要とするため、**ContinuousRule の前提**。
  P1 の resumeToken パターンをそのまま使え、新規モジュール1本で済む。

## 5. 実装後の予想 Coverage

| 実装 | ENGINE_GAP | TESTED |
|---|---:|---:|
| （現在） | 847 | 905 |
| Battle のみ | 803 | 949 |
| Ritual のみ | 828 | 924 |
| Delayed のみ | 831 | 921 |
| ContinuousRule のみ | 828 | 924 |

## 6. 推奨する実装順序

**Ritual → Battle → Delayed → ContinuousRule → EffectCategory/ChainSource → draw event →
leave-field / special summon provenance 第2弾**

小型4種（draw 6 / EffectCategory 5 / leave-field 2 / special summon provenance 2 = 計15）は
単独では薄いが、ContinuousRule と Delayed の降格分に繰り返し現れるため、
**ContinuousRule 着手時に同時実装**するのが効率的。

分析時点の第1位は絶対件数と下流レバレッジで Battle だったが、
**コストあたりの回収効率では Ritual が全候補中で最高**であり、降格ゼロ・低リスクで
確実に19枚を回収できる。プロジェクト判断として Ritual を先に実装する。

## 7. Battle A候補 全44件（次に着手する分）

- **貫通(5)** E・HERO エッジマン / セイバー・ビートル / バイトロン / ランサー・ドラゴニュート / ランス・リンドブルム
- **貫通付与(1)** H－ヒートハート
- **直接攻撃許可(8)** BF－鉄鎖のフェーン / エレキングコブラ / エレキー / ディスカバード・アタック /
  威圧する魔眼 / 機動砦のギア・ゴーレム / 財宝への隠し通路 / デルタ・アタッカー
- **攻撃対象の変更・強制(5)** アストラルバリア / ディフェンド・スライム / トゥーン・ディフェンス /
  地縛霊の誘い / 絶体絶命
- **ダメージ置換・倍化・反転(6)** アステカの石像 / ディメンション・ウォール / 断層地帯 /
  軍隊ピラニア / ダメージ・ワクチンΩMAX / ダメージ・コンデンサー
- **戦闘ダメージ量イベント(5)** エレキュア / エレキンギョ / セベクの祝福 / ポイズン・ファング / 記憶破壊者
- **攻撃者・被攻撃者の参照(6)** ジャイアントマミー / デス・カンガルー / デスカウンター /
  原子ホタル / 念導力 / ワーム・ノーブル
- **攻撃宣言への介入(4)** 反撃準備 / 地雷蜘蛛 / 波動障壁 / 闘争本能
- **攻撃回数・バトルフェイズ制御(4)** ジュラック・モノロフ / ライノタウルス / ハーフorストップ / 闇の芸術家

## 8. Battle 実装時の想定 state / API（着手時の出発点）

```
gs.battle.context = {attackerUid, targetUid|null, declaredTargetUid,
                     piercing, damageReplace:[{to,mul}],
                     snapshots:{attacker,target}}   // P3 の snapshotCardV3 を流用
card.battlePermission = {directAttackTurn, extraAttacks, attackTargetLockUid}
gs.battle.phaseControl = {skipTurn, repeatCount}
```

```
API.grantDirectAttack / grantPiercing / redirectAttack / replaceBattleDamage /
battleContext / onBattleDamage / lockAttackTarget / battlePhase
```

リスク緩和: PHASE A を「貫通＋ダメージ置換」だけに絞って全回帰 → PASS後に攻撃許可 →
対象変更 → フェイズ制御、と4段に割ること。`card.battlePermission` は必ず
`ZONE_LOCAL_KEYS` へ入れる（P3 で古い情報の残留を実際に踏んだため）。

