/* S03-U10 (C-S03-07) CARD_ACTIVATION_VS_EFFECT — declaration table.
   These Continuous/Field Spells and Continuous Traps have no requirement on activating the card itself:
   their text only describes effects that apply or are activated while the card is face-up on the field
   (continuous effects, 「〜度に」 triggers, 「1ターンに1度…できる」 ignition effects, costs such as 「〜する事で」).
   Activating them from the hand or from a face-down set is a card activation only (see cardActivationOnlyV32):
   the effect's condition, count limit, cost and targets are not used, and resolving it applies no effect.
   Rulings (2011 wiki snapshots): 《竜の渓谷》10/07/04, 《神の居城－ヴァルハラ》, 《コア転送ユニット》《擬似空間》10/09/23 —
   the effect cannot be activated at the same time as the card.
   Measured before this unit (U09 build, empty board): every card below could not be activated as a card at all,
   and where the effect condition happened to hold the card activation ran the effect.
   Classification: text review of the 135 refused scripted Continuous/Field S/T (scratchpad u10_classify.js + hand review).
   Not declared (the card activation itself has a requirement, current legality kept):
     target/selection — リビングデッドの呼び声, デモンズ・チェーン, 正統なる血統, 蘇りし魂, ブレインハザード, 奇跡の光臨, 闇次元の解放,
       化石岩の解放, 携帯型バッテリー, エンジェル・リフト, 魂の共有－コモンソウル, グレイモヤ不発弾, 鉄壁の布陣, ミニチュアライズ,
       六芒星の呪縛, 罅割れゆく斧;
     cost — 光の護封壁, ヒステリック・パーティー, 超栄養太陽, 忍法 変化の術, フューチャー・グロウ, エレメンタル・アブソーバー;
     declaration — DNA移植手術, DNA改造手術, 夜霧のスナイパー;
     activation condition / timing — ゴブリンの小役人, 便乗, ボスラッシュ, デプス・アミュレット;
     optional activation-time effect (needs its own handling) — マクロコスモス.
     activation-time setup (needs a model change) — 光のピラミッド (its ACTIVATE operation links the Sphinxes present at activation;
       the leave-field effect should look at the field when the card leaves).
   Legacy scripts that already declare fieldIgnition:true are covered by the helper as well and are listed here for completeness. */
declareCardActivationFreeV32([
  /* legacy fieldIgnition (already flagged) */
  '血の代償','六武の門','六武衆の結束','暗黒界の門','カラクリ解体新書','神の居城－ヴァルハラ',
  /* legacy scripts: on-field ignition / trigger / continuous effects only */
  '竜の渓谷','歯車街','黒い旋風','軽量化','木遁封印式','クラッキング','ウォーターハザード','エレキャノン','水遁封印式','死霊の巣',
  'カードトレーダー','リサイクル','ドラゴン族・封印の壺','不死式冥界砲','天空の泉','墓荒らしの報い','アタック・フェロモン','追い剥ぎゾンビ',
  'ドミノ','千里眼','スパイダー・ウェブ','コート・オブ・ジャスティス','大樹海','コモンメンタルワールド','弱者の意地','ウェポンチェンジ',
  'アマゾネスの里','スピリットの誘い','ダーク・シティ','ビーストライザー','フューチャー・ヴィジョン','モンスターBOX','召喚の呪詛',
  '急転直下','押し売りゾンビ','コア転送ユニット','ヴァイロン・エレメント','人海戦術','機皇城','霞の谷の神風',
  /* unified cards without an ACTIVATE effect */
  'つまずき','カウンターマシンガンパンチ','マスドライバー','冥界の宝札','前線基地','零式魔導粉砕機','アイスバーン','サイバー・サモン・ブラスター',
  'ダーク・キュア','「A」細胞増殖装置','一族の結束','生還の宝札','雲魔物のスコール','魂吸収','ジェムフラッシュエナジー','悪夢の迷宮',
  '太陽の祭壇','アポート','ミイラの呼び声','黒蛇病','押し売りゴブリン','炎熱旋風壁','門前払い','エクトプラズマー','エレキュア',
  'ポイズン・ファング','デスカウンター','ウィルスメール','メサイアの蟻地獄','凡骨の意地','漆黒のトバリ','神速の具足','神の恵み',
  '魔法吸収','暗黒の呪縛','連鎖炸薬','バベル・タワー','人造天使','士気高揚','サイキックブレイク','アイヴィ・シャックル','うごめく影',
  '「A」細胞培養装置','古代遺跡コードA','サンダー・ボトル','追い剥ぎゴブリン','エレメントの泉','棺桶売り','アマゾネスの闘志','エレキャッスル',
  /* unified cards whose ACTIVATE effect has no activation-time effect in the card text (checked separately) */
  '聖域の歌声','強制終了','ディフェンド・スライム','D・ゲイザー','ライトロード・バリア','アストラルバリア','トゥーン・ディフェンス',
  '怒れるもけもけ',
]);
