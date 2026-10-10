/* =========================================================================
   デッキ操作カードの一括定義
   index.html のソロモードで使っている宣言テーブルをそのまま取り込み、
   defineScript に変換する。既に手書きのスクリプトがあるカードは上書きしない。

     op   : recruit（デッキから特殊召喚）/ search（手札に加える）/ mill（墓地へ送る）
     trig : ignition（起動効果）/ summon（召喚・特殊召喚に成功した時）
     f    : 検索条件
       arch    カード名に含まれる文字列
       tk      'm' モンスター / 's' 魔法 / 't' 罠
       lv / lvmin / lvmax   レベル
       at / ra              属性・種族
       atkmax / defmax      攻撃力・守備力の上限
       tuner   チューナー限定
       normal  通常モンスター限定
       exclude この名前は候補から除く
   ========================================================================= */
const AUTO_DECK_TABLE = {
  "C・チッキー":{op:"recruit",trig:"ignition",f:{cardCode:54959865}},
  "C・ドルフィーナ":{op:"recruit",trig:"ignition",f:{cardCode:17955766}},
  "C・パンテール":{op:"recruit",trig:"ignition",f:{cardCode:43237273}},
  "C・ピニー":{op:"recruit",trig:"ignition",f:{cardCode:17732278}},
  "C・モーグ":{op:"recruit",trig:"ignition",f:{cardCode:80344569}},
  "C・ラーバ":{op:"recruit",trig:"ignition",f:{cardCode:89621922}},
  "D・バリア":{op:"search",trig:"ignition",f:{group:GROUP.D_MORPHTRONIC}},
  "D・リモコン":{op:"search",trig:"ignition",f:{group:GROUP.D_MORPHTRONIC,tk:"m"}},
  "E・HERO キャプテン・ゴールド":{op:"search",trig:"ignition",f:{cardCode:63035430}},
  "RAI－MEI":{op:"search",trig:"ignition",f:{lvmax:2,at:"光",tk:"m"}},
  "Sin スターダスト・ドラゴン":{op:"recruit",trig:"ignition",f:{cardCode:44508094}},
  "Sin レインボー・ドラゴン":{op:"recruit",trig:"ignition",f:{cardCode:79856792}},
  "Sin 真紅眼の黒竜":{op:"recruit",trig:"ignition",f:{cardCode:74677422}},
  "Sin 青眼の白龍":{op:"recruit",trig:"ignition",f:{cardCode:89631139}},
  "UFOタートル":{op:"recruit",trig:"ignition",f:{at:"炎",atkmax:1500,tk:"m"}},
  "W星雲隕石":{op:"recruit",trig:"ignition",f:{lvmin:7,at:"光",ra:"爬虫類",tk:"m"}},
  "XX－セイバー エマーズブレイド":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"X－セイバー",tk:"m"}},
  "XX－セイバー ガルセム":{op:"search",trig:"ignition",f:{arch:"X－セイバー",tk:"m"}},
  "おジャマジック":{op:"search",trig:"ignition",f:{cardCode:12482652}},
  "アタック・リフレクター・ユニット":{op:"recruit",trig:"ignition",f:{cardCode:68774379}},
  "アトランティスの戦士":{op:"search",trig:"ignition",f:{cardCode:295517}},
  "アーケイン・ファイロ":{op:"search",trig:"ignition",f:{cardCode:80280737}},
  "アームド・ドラゴン LV3":{op:"recruit",trig:"ignition",f:{cardCode:46384672}},
  "イエロー・ガジェット":{op:"search",trig:"summon",f:{cardCode:41172955}},
  "インフェルニティ・インフェルノ":{op:"mill",trig:"ignition",f:{arch:"インフェルニティ"}},
  "インヴェルズを呼ぶ者":{op:"recruit",trig:"summon",f:{lvmax:4,arch:"インヴェルズ",tk:"m"}},
  "ウェポンサモナー":{op:"search",trig:"ignition",f:{arch:"ガーディアン"}},
  "カバリスト":{op:"search",trig:"ignition",f:{ra:"サイキック",tk:"m"}},
  "カラクリ兵 弐参六":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"カラクリ",tk:"m"}},
  "ガスタ・イグル":{op:"recruit",trig:"ignition",f:{lvmax:4,group:GROUP.GUSTO,tuner:true,tk:"m"}},
  "ガスタ・ガルド":{op:"recruit",trig:"ignition",f:{lvmax:2,group:GROUP.GUSTO,tk:"m"}},
  "ガスタ・サンボルト":{op:"recruit",trig:"ignition",f:{at:"風",ra:"サイキック",defmax:1500,tk:"m"}},
  "ガスタ・スクイレル":{op:"recruit",trig:"ignition",f:{lvmin:5,group:GROUP.GUSTO,tk:"m"}},
  "キラーザウルス":{op:"search",trig:"ignition",f:{cardCode:10080320}},
  "キラー・トマト":{op:"recruit",trig:"ignition",f:{at:"闇",atkmax:1500,tk:"m"}},
  "キングス・ナイト":{op:"recruit",trig:"summon",f:{cardCode:90876561}},
  "キーマウス":{op:"search",trig:"ignition",f:{lvmax:3,ra:"獣",tk:"m"}},
  "クロス・ポーター":{op:"search",trig:"ignition",f:{group:GROUP.N_NEOSPACIAN,tk:"m"}},
  "グリズリーマザー":{op:"recruit",trig:"ignition",f:{at:"水",atkmax:1500,tk:"m"}},
  "グリーン・ガジェット":{op:"search",trig:"summon",f:{cardCode:86445415}},
  "コアキメイル・ロック":{op:"search",trig:"ignition",f:{lvmax:4,cardCode:36623431,tk:"m"}},
  "コア転送ユニット":{op:"search",trig:"ignition",f:{cardCode:36623431}},
  "コンバート・コンタクト":{op:"mill",trig:"ignition",f:{group:GROUP.N_NEOSPACIAN}},
  "コーリング・ノヴァ":{op:"recruit",trig:"ignition",f:{at:"光",ra:"天使",atkmax:1500,tk:"m"}},
  "コール・リゾネーター":{op:"search",trig:"ignition",f:{group:GROUP.RESONATOR,tk:"m"}},
  "ゴキポン":{op:"search",trig:"ignition",f:{ra:"昆虫",atkmax:1500,tk:"m"}},
  "サイバー・ラーバァ":{op:"recruit",trig:"ignition",f:{cardCode:35050257}},
  "シャインエンジェル":{op:"recruit",trig:"ignition",f:{at:"光",atkmax:1500,tk:"m"}},
  "シャドウ・リチュア":{op:"search",trig:"ignition",f:{arch:"リチュア",tk:"s"}},
  "シューティング・クェーサー・ドラゴン":{op:"recruit",trig:"ignition",f:{cardCode:24696097}},
  "シンクロ・フュージョニスト":{op:"search",trig:"ignition",f:{cardCode:24094653,tk:"s"}},
  "ジェイドナイト":{op:"search",trig:"ignition",f:{lv:4,at:"光",ra:"機械",tk:"m"}},
  "ジェネクス・ウンディーネ":{op:"search",trig:"summon",f:{cardCode:68505803}},
  "ジェネクス・サーチャー":{op:"recruit",trig:"ignition",f:{group:GROUP.GENEX,atkmax:1500,tk:"m"}},
  "ジェネクス・ニュートロン":{op:"search",trig:"ignition",f:{ra:"機械",tuner:true}},
  "ジェネクス・パワー・プランナー":{op:"search",trig:"summon",f:{lv:3,group:GROUP.GENEX,tk:"m"}},
  "ジェネクス・ブラスト":{op:"search",trig:"summon",f:{at:"闇",group:GROUP.GENEX,tk:"m"}},
  "ジェネラルデーモン":{op:"search",trig:"ignition",f:{cardCode:94585852}},
  "ジェムタートル":{op:"search",trig:"ignition",f:{cardCode:1264319}},
  "ジェムナイト・アレキサンド":{op:"recruit",trig:"ignition",f:{arch:"ジェムナイト",normal:true,tk:"m"}},
  "ジェムレシス":{op:"search",trig:"summon",f:{arch:"ジェムナイト",tk:"m"}},
  "ジュラック・ヴェロー":{op:"recruit",trig:"ignition",f:{arch:"ジュラック",atkmax:1700,tk:"m"}},
  "スカル・ナイト":{op:"recruit",trig:"ignition",f:{cardCode:15653824}},
  "スクラップ・エリア":{op:"search",trig:"ignition",f:{arch:"スクラップ",tuner:true}},
  "スクラップ・シャーク":{op:"mill",trig:"ignition",f:{arch:"スクラップ",tk:"m"}},
  "スクラップ・ハンター":{op:"mill",trig:"ignition",f:{tuner:true}},
  "スクラップ・リサイクラー":{op:"mill",trig:"summon",f:{ra:"機械",tk:"m"}},
  "スネーク・ホイッスル":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"爬虫類",tk:"m"}},
  "スモール・ピース・ゴーレム":{op:"recruit",trig:"summon",f:{cardCode:58843503}},
  "スレイブタイガー":{op:"recruit",trig:"ignition",f:{arch:"剣闘獣",tk:"m"}},
  "スレイブ・エイプ":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"剣闘獣",tk:"m"}},
  "スーパイ":{op:"recruit",trig:"ignition",f:{cardCode:42280216}},
  "ダニポン":{op:"search",trig:"ignition",f:{ra:"昆虫",defmax:1000,tk:"m"}},
  "ダーク・ジェネラル フリード":{op:"search",trig:"ignition",f:{lv:4,at:"闇",tk:"m"}},
  "デステニー・シグナル":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"D－HERO",tk:"m"}},
  "デスハムスター":{op:"recruit",trig:"ignition",f:{cardCode:6104968}},
  "デュアル・ソルジャー":{op:"recruit",trig:"ignition",f:{lvmax:4,cardCode:68366996,tk:"m"}},
  "デーモンとの駆け引き":{op:"recruit",trig:"ignition",f:{cardCode:85605684}},
  "トゥルース・リインフォース":{op:"recruit",trig:"ignition",f:{lvmax:2,ra:"戦士",tk:"m"}},
  "トゥーンのもくじ":{op:"search",trig:"ignition",f:{arch:"トゥーン"}},
  "トライアングル・エリア":{op:"recruit",trig:"ignition",f:{arch:"エーリアン",tk:"m"}},
  "トライクラー":{op:"recruit",trig:"ignition",f:{cardCode:83392426}},
  "ドラグニティナイト－ガジャルグ":{op:"search",trig:"ignition",f:{lvmax:4,ra:"ドラゴン",tk:"m"}},
  "ドラグニティ－トリブル":{op:"mill",trig:"summon",f:{lvmax:3,ra:"ドラゴン",tk:"m"}},
  "ドラゴニック・タクティクス":{op:"recruit",trig:"ignition",f:{lv:8,ra:"ドラゴン",tk:"m"}},
  "ドラゴンフライ":{op:"recruit",trig:"ignition",f:{at:"風",atkmax:1500,tk:"m"}},
  "ドレッド・ドラゴン":{op:"search",trig:"ignition",f:{lvmax:3,ra:"ドラゴン",tk:"m"}},
  "ナチュル・クリフ":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"ナチュル",tk:"m"}},
  "ナーガ":{op:"recruit",trig:"ignition",f:{lvmax:3,tk:"m"}},
  "ネフティスの導き手":{op:"recruit",trig:"ignition",f:{cardCode:61441708}},
  "ハイエナ":{op:"recruit",trig:"ignition",f:{cardCode:22873798}},
  "ハンディキャップマッチ!":{op:"recruit",trig:"summon",f:{lvmax:4,arch:"剣闘獣",tk:"m"}},
  "ハーピィ・クィーン":{op:"search",trig:"ignition",f:{cardCode:75782277}},
  "バイオファルコン":{op:"search",trig:"ignition",f:{ra:"機械",atkmax:1000,tk:"m"}},
  "バイオレット・ウィッチ":{op:"search",trig:"ignition",f:{ra:"植物",defmax:1500,tk:"m"}},
  "バスター・ビースト":{op:"search",trig:"ignition",f:{cardCode:80280737}},
  "バフォメット":{op:"search",trig:"summon",f:{cardCode:5818798}},
  "バード・フェイス":{op:"search",trig:"ignition",f:{canonical:76812113}},
  "パンダボーグ":{op:"recruit",trig:"ignition",f:{lv:4,ra:"サイキック",tk:"m"}},
  "ヒーローアライブ":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"E・HERO",tk:"m"}},
  "ヒーロー・キッズ":{op:"recruit",trig:"summon",f:{cardCode:32679370}},
  "ヒーロー・シグナル":{op:"recruit",trig:"ignition",f:{lvmax:4,arch:"E・HERO",tk:"m"}},
  "ビーストライカー":{op:"recruit",trig:"ignition",f:{cardCode:94878265}},
  "ピラミッド・タートル":{op:"recruit",trig:"ignition",f:{ra:"アンデット",defmax:2000,tk:"m"}},
  "フェザー・ウィンド・アタック":{op:"search",trig:"ignition",f:{arch:"BF",tk:"m"}},
  "フォーチュンレディ・ライティー":{op:"recruit",trig:"ignition",f:{arch:"フォーチュンレディ",tk:"m"}},
  "ブルーメンブラット":{op:"recruit",trig:"ignition",f:{cardCode:51085303}},
  "ヘカテリス":{op:"search",trig:"ignition",f:{cardCode:1353770}},
  "ヘル・セキュリティ":{op:"recruit",trig:"ignition",f:{ra:"悪魔",tk:"m"}},
  "ベビケラサウルス":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"恐竜",tk:"m"}},
  "ボスラッシュ":{op:"recruit",trig:"ignition",f:{arch:"巨大戦艦",tk:"m"}},
  "ボタニティ・ガール":{op:"search",trig:"ignition",f:{ra:"植物",defmax:1000,tk:"m"}},
  "マクロコスモス":{op:"recruit",trig:"ignition",f:{cardCode:54493213}},
  "マシンナーズ・ギアフレーム":{op:"search",trig:"summon",f:{arch:"マシンナーズ",exclude:"マシンナーズ・ギアフレーム",tk:"m"}},
  "マシンナーズ・ディフェンダー":{op:"search",trig:"ignition",f:{cardCode:22666164}},
  "ミッド・ピース・ゴーレム":{op:"recruit",trig:"summon",f:{cardCode:22754505}},
  "メカウサー":{op:"recruit",trig:"ignition",f:{cardCode:10110717}},
  "メンタルマスター":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"サイキック",tk:"m"}},
  "ユーフォロイド":{op:"recruit",trig:"ignition",f:{ra:"機械",atkmax:1500,tk:"m"}},
  "ラヴァル炎火山の侍女":{op:"mill",trig:"ignition",f:{arch:"ラヴァル",tk:"m"}},
  "リチュア・アビス":{op:"search",trig:"summon",f:{cardCode:67111213,defmax:1000,tk:"m"}},
  "リチュア・エリアル":{op:"search",trig:"ignition",f:{arch:"リチュア",tk:"m"}},
  "リバース・オブ・ネオス":{op:"recruit",trig:"ignition",f:{cardCode:89943723}},
  "レアル・ジェネクス・クラッシャー":{op:"search",trig:"summon",f:{lv:4,arch:"レアル・ジェネクス",tk:"m"}},
  "レアル・ジェネクス・ターボ":{op:"search",trig:"summon",f:{lv:1,group:GROUP.GENEX,tk:"m"}},
  "レアル・ジェネクス・マグナ":{op:"search",trig:"summon",f:{lv:2,arch:"レアル・ジェネクス",tk:"m"}},
  "レッド・ガジェット":{op:"search",trig:"summon",f:{cardCode:13839120}},
  "レプティレス・ガードナー":{op:"search",trig:"ignition",f:{group:GROUP.REPTILIANNE,tk:"m"}},
  "ロード・ウォリアー":{op:"recruit",trig:"ignition",f:{lvmax:2,ra:"戦士",tk:"m"}},
  "ワンハンドレッド・アイ・ドラゴン":{op:"search",trig:"ignition",f:{group:GROUP.EARTHBOUND,tk:"m"}},
  "ワーム・カルタロス":{op:"search",trig:"ignition",f:{lvmax:4,ra:"爬虫類",group:GROUP.WORM,tk:"m"}},
  "ワーム・ゼクス":{op:"mill",trig:"summon",f:{ra:"爬虫類",group:GROUP.WORM,tk:"m"}},
  "ヴァイロン・エレメント":{op:"recruit",trig:"ignition",f:{arch:"ヴァイロン",tuner:true}},
  "ヴァイロン・マテリアル":{op:"search",trig:"ignition",f:{arch:"ヴァイロン",tk:"s"}},
  "ヴィークラー":{op:"recruit",trig:"ignition",f:{cardCode:57308711}},
  "ヴォルカニック・バレット":{op:"search",trig:"ignition",f:{cardCode:33365932}},
  "万華鏡－華麗なる分身－":{op:"recruit",trig:"ignition",f:{canonical:76812113}},
  "人海戦術":{op:"recruit",trig:"ignition",f:{lvmax:2,normal:true,tk:"m"}},
  "仮面竜":{op:"recruit",trig:"ignition",f:{ra:"ドラゴン",atkmax:1500,tk:"m"}},
  "伝説の白石":{op:"search",trig:"ignition",f:{cardCode:89631139}},
  "儀式の準備":{op:"search",trig:"ignition",f:{lvmax:7,tk:"m"}},
  "充電池メン":{op:"recruit",trig:"summon",f:{arch:"電池メン",exclude:"充電池メン",tk:"m"}},
  "六武ノ書":{op:"recruit",trig:"ignition",f:{cardCode:63176202}},
  "共鳴虫":{op:"recruit",trig:"ignition",f:{ra:"昆虫",atkmax:1500,tk:"m"}},
  "円盤ムスキー":{op:"search",trig:"ignition",f:{arch:"エーリアン"}},
  "冥界の使者":{op:"search",trig:"ignition",f:{lvmax:3,normal:true,tk:"m"}},
  "剣闘獣アレクサンデル":{op:"recruit",trig:"ignition",f:{arch:"剣闘獣",exclude:"剣闘獣アレクサンデル",tk:"m"}},
  "剣闘獣エクイテ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣エクイテ",tk:"m"}},
  "剣闘獣ダリウス":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ダリウス",tk:"m"}},
  "剣闘獣ティゲル":{op:"search",trig:"summon",f:{arch:"剣闘獣",tk:"m"}},
  "剣闘獣ディカエリィ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ディカエリィ",tk:"m"}},
  "剣闘獣ベストロウリィ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ベストロウリィ",tk:"m"}},
  "剣闘獣ホプロムス":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ホプロムス",tk:"m"}},
  "剣闘獣ムルミロ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ムルミロ",tk:"m"}},
  "剣闘獣ラクエル":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ラクエル",tk:"m"}},
  "剣闘獣ラニスタ":{op:"recruit",trig:"summon",f:{arch:"剣闘獣",exclude:"剣闘獣ラニスタ",tk:"m"}},
  "剣闘訓練所":{op:"search",trig:"ignition",f:{lvmax:4,arch:"剣闘獣",tk:"m"}},
  "召喚師のスキル":{op:"search",trig:"ignition",f:{lvmin:5,normal:true,tk:"m"}},
  "堕天使アスモディウス":{op:"mill",trig:"ignition",f:{ra:"天使",tk:"m"}},
  "墓守の偵察者":{op:"recruit",trig:"ignition",f:{arch:"墓守の",atkmax:1500,tk:"m"}},
  "大神官デ・ザード":{op:"recruit",trig:"ignition",f:{cardCode:39711336}},
  "宝玉の導き":{op:"recruit",trig:"ignition",f:{arch:"宝玉獣",tk:"m"}},
  "巨大ネズミ":{op:"recruit",trig:"ignition",f:{at:"地",atkmax:1500,tk:"m"}},
  "幻影の魔術士":{op:"recruit",trig:"ignition",f:{arch:"HERO",atkmax:1000,tk:"m"}},
  "悪魂邪苦止":{op:"search",trig:"ignition",f:{cardCode:10456559}},
  "拘束解除":{op:"recruit",trig:"ignition",f:{cardCode:57046845}},
  "極星宝ドラウプニル":{op:"search",trig:"ignition",f:{arch:"極星宝"}},
  "機皇兵スキエル・アイン":{op:"recruit",trig:"ignition",f:{group:GROUP.MEKLORD_ARMY,tk:"m"}},
  "機皇城":{op:"search",trig:"ignition",f:{arch:"機皇帝",tk:"m"}},
  "死の花－ネクロ・フルール":{op:"recruit",trig:"ignition",f:{cardCode:36405256}},
  "氷結界の決起隊":{op:"search",trig:"ignition",f:{group:GROUP.ICE_BARRIER,tk:"m"}},
  "氷結界の紋章":{op:"search",trig:"ignition",f:{group:GROUP.ICE_BARRIER,tk:"m"}},
  "沼地の魔神王":{op:"search",trig:"ignition",f:{cardCode:24094653}},
  "深海のディーヴァ":{op:"recruit",trig:"summon",f:{lvmax:3,ra:"海竜",tk:"m"}},
  "無敗将軍 フリード":{op:"search",trig:"ignition",f:{lvmax:4,ra:"戦士",tk:"m"}},
  "白竜の聖騎士":{op:"recruit",trig:"ignition",f:{cardCode:89631139}},
  "督戦官コヴィントン":{op:"recruit",trig:"ignition",f:{cardCode:58054262}},
  "神の桎梏グレイプニル":{op:"search",trig:"ignition",f:{arch:"極星",tk:"m"}},
  "精神統一":{op:"search",trig:"ignition",f:{cardCode:7512044}},
  "素早いビッグハムスター":{op:"recruit",trig:"ignition",f:{lvmax:3,ra:"獣",tk:"m"}},
  "素早いマンタ":{op:"recruit",trig:"ignition",f:{cardCode:46384403}},
  "素早いモモンガ":{op:"recruit",trig:"ignition",f:{cardCode:22567609}},
  "紫炎の狼煙":{op:"search",trig:"ignition",f:{lvmax:3,group:GROUP.SIX_SAMURAI_NAMED,tk:"m"}},
  "紫炎の足軽":{op:"recruit",trig:"ignition",f:{lvmax:3,group:GROUP.SIX_SAMURAI_NAMED,tk:"m"}},
  "緊急鋼核処分":{op:"mill",trig:"ignition",f:{cardCode:36623431}},
  "荒野の女戦士":{op:"recruit",trig:"ignition",f:{at:"地",ra:"戦士",atkmax:1500,tk:"m"}},
  "蛇神降臨":{op:"recruit",trig:"ignition",f:{cardCode:8062132}},
  "融合賢者":{op:"search",trig:"ignition",f:{cardCode:24094653,tk:"s"}},
  "見習い魔術師":{op:"recruit",trig:"summon",f:{lvmax:2,ra:"魔法使い",tk:"m"}},
  "賢者の宝石":{op:"recruit",trig:"ignition",f:{cardCode:46986414}},
  "超古深海王シーラカンス":{op:"recruit",trig:"ignition",f:{lvmax:4,ra:"魚",tk:"m"}},
  "軍隊竜":{op:"recruit",trig:"ignition",f:{cardCode:55013285}},
  "迷宮変化":{op:"recruit",trig:"ignition",f:{cardCode:63162310}},
  "闇・道化師のペーテン":{op:"recruit",trig:"ignition",f:{cardCode:52624755}},
  "電池メン－ボタン型":{op:"recruit",trig:"ignition",f:{lvmax:4,cardCode:56839613,tk:"m"}},
  "霞の谷の神風":{op:"recruit",trig:"ignition",f:{lvmax:4,at:"風",tk:"m"}},
  "魔力掌握":{op:"search",trig:"ignition",f:{cardCode:75014062}},
  "魔法の歯車":{op:"recruit",trig:"ignition",f:{cardCode:83104731}},
  "魔轟神グリムロ":{op:"search",trig:"ignition",f:{group:GROUP.FABLED,exclude:"魔轟神グリムロ",tk:"m"}},
  "魔轟神獣ペガラサス":{op:"mill",trig:"ignition",f:{group:GROUP.FABLED,tk:"m"}},
  "黒魔術のカーテン":{op:"recruit",trig:"ignition",f:{cardCode:46986414}}
};

/* 条件にあてはまるデッキ内のカードを集める */
function autoDeckMatches(p, f){
  return API.pileCards(p, 'deck', x=>{
    const db = x.db;
    /* S03-U135: the table's identity / predicate filters were never applied, so e.g. 沼地の魔神王 (cardCode 融合), D・バリア
       (group D) or バード・フェイス (canonical ハーピィ・レディ) could take ANY card from the Deck.
       cardCode … that passcode (or a card treated as it, canonicalCardCodeV4); canonical … canonicalCardCodeV4;
       group … the P4 SetcodeAuthority predicate isCardInGroupV4 (passcode-based, never the name). */
    if(f.cardCode != null && cardCodeOfV4(x.card) !== Number(f.cardCode) && canonicalCardCodeV4(x.card) !== Number(f.cardCode)) return false;
    if(f.canonical != null && canonicalCardCodeV4(x.card) !== Number(f.canonical)) return false;
    if(f.group   && !isCardInGroupV4(x.card, f.group)) return false;
    if(f.tk      && db.k !== f.tk) return false;
    if(f.arch    && String(db.n||'').indexOf(f.arch) < 0) return false;
    if(f.exclude && db.n === f.exclude) return false;
    if(f.at      && db.at !== f.at) return false;
    if(f.ra      && db.ra !== f.ra) return false;
    if(f.lv    != null && (db.lv||0) !== f.lv) return false;
    if(f.lvmin != null && (db.lv||0) <  f.lvmin) return false;
    if(f.lvmax != null && (db.lv||0) >  f.lvmax) return false;
    if(f.atkmax!= null && (db.atk||0) > f.atkmax) return false;
    if(f.defmax!= null && (db.def||0) > f.defmax) return false;
    if(f.tuner   && (db.st||[]).indexOf('チューナー') < 0) return false;
    if(f.normal  && (db.st||[]).indexOf('通常') < 0) return false;
    // 特殊召喚するならEXデッキのモンスターは対象外
    return true;
  });
}

const AUTO_OP_JP = { recruit:'特殊召喚する', search:'手札に加える', mill:'墓地へ送る' };

/* 1エントリを defineScript に変換する */
function defineAutoDeckScript(nm, ent){
  const f = ent.f || {};
  const jp = AUTO_OP_JP[ent.op] || '選ぶ';
  const cands = p => {
    const list = autoDeckMatches(p, f);
    return ent.op === 'recruit' ? list.filter(x=>!x.db.ex) : list;
  };
  defineScript(nm, {
    autoDeck: true,                       // このテーブル由来であることの目印
    timing: ent.trig === 'summon' ? ['summon'] : ['mainPhase','free'],
    type: 'auto', priority: 1,
    condition(ctx){
      if(!cands(ctx.player).length){
        ctx.reason = `デッキに条件を満たすカードがありません`;
        return false;
      }
      return true;
    },
    selectTargets(ctx, done){
      API.selectCard(`${nm}：${jp}カード`, cands(ctx.player), t=>done([t]),
        autoDeckHint(f));
    },
    resolve(ctx){
      const t = ctx.selectedTargets[0];
      if(!t){ API.log('デッキに候補がないため不発'); return; }
      if(ent.op === 'search'){ API.searchDeck(ctx.player, t.index, nm); return; }
      if(ent.op === 'mill'){
        API.sendToGrave({p:ctx.player, zone:'deck', index:t.index, card:t.card}, nm);
        return;
      }
      API.specialSummon(ctx.player, 'deck', t.index, 'atk', nm);
    },
    afterResolve(){},
    /* 魔法・罠が召喚に反応する場合は、自分ではなく他のモンスターの召喚が起点。
       ハンディキャップマッチ！のようなカードがこれにあたる。 */
    onOtherSummon: ent.trig === 'summon' ? 'auto' : undefined,
    passive: ent.trig === 'summon'
      ? { onNormalSummon(ctx){ return ctx.zone!=='deck'; },
          onSpecialSummon(ctx){ return ctx.zone!=='deck'; } }
      : undefined,
  });
}

/* 選択画面に出す条件の説明 */
function autoDeckHint(f){
  const bits = [];
  if(f.arch)   bits.push(`「${f.arch}」を含む`);
  if(f.tk === 'm') bits.push('モンスター');
  if(f.tk === 's') bits.push('魔法');
  if(f.tk === 't') bits.push('罠');
  if(f.at)     bits.push(`${f.at}属性`);
  if(f.ra)     bits.push(`${f.ra}族`);
  if(f.lv    != null) bits.push(`レベル${f.lv}`);
  if(f.lvmin != null) bits.push(`レベル${f.lvmin}以上`);
  if(f.lvmax != null) bits.push(`レベル${f.lvmax}以下`);
  if(f.atkmax!= null) bits.push(`攻撃力${f.atkmax}以下`);
  if(f.defmax!= null) bits.push(`守備力${f.defmax}以下`);
  if(f.tuner)  bits.push('チューナー');
  if(f.normal) bits.push('通常モンスター');
  return bits.join('・');
}

/* テーブルを流し込む。手書きのスクリプトがあるカードは触らない。 */
Object.keys(AUTO_DECK_TABLE).forEach(nm=>{
  if(CARD_SCRIPTS[nm]) return;
  defineAutoDeckScript(nm, AUTO_DECK_TABLE[nm]);
});

/* =========================================================================
   効果テキストの自動解釈
   スクリプトが無いカードでも、効果テキストから「何をするか」を読み取り、
   候補を絞り込んだ状態で手動処理に流す。完全自動化ではなく、
   白紙のパレットではなく「下ごしらえ済みの選択肢」を出すのが狙い。

   解析の流れ
     1. テキストを句点・読点で節に分ける
     2. 各節から動詞（破壊する・特殊召喚する等）を見つける
     3. 動詞の手前から対象（誰の・どのゾーンの・何を・何枚）を読み取る
   ========================================================================= */

/* --- 対象の指定を読み取る --- */
function parseTargetSpec(phrase){
  const t = String(phrase||'');
  const q = {};

  // 誰の
  if(/お互いの|お互いに/.test(t))      q.player = 'both';
  else if(/相手(フィールド|の墓地|の手札|のデッキ|の除外)/.test(t)) q.player = 'opponent';
  else if(/自分(フィールド|の墓地|の手札|のデッキ|の除外)/.test(t)) q.player = 'self';
  else if(/相手/.test(t))              q.player = 'opponent';
  else if(/自分/.test(t))              q.player = 'self';

  // どのゾーン
  if(/墓地/.test(t))                   q.zone = 'grave';
  else if(/手札/.test(t))              q.zone = 'hand';
  else if(/デッキ/.test(t))            q.zone = 'deck';
  else if(/除外され|ゲームから除外されている/.test(t)) q.zone = 'banish';
  else if(/フィールド/.test(t))        q.zone = 'field';

  // 何を
  if(/魔法・罠カード|魔法・罠/.test(t))      q.kind = 'st';
  else if(/魔法カード/.test(t))              q.kind = 's';
  else if(/罠カード/.test(t))                q.kind = 't';
  else if(/モンスター/.test(t))              q.kind = 'm';
  else if(/カード/.test(t))                  q.kind = 'any';

  // 表示形式
  if(/表側表示/.test(t))               q.face = 'up';
  else if(/裏側表示|裏側守備表示/.test(t)) q.face = 'down';
  if(/攻撃表示/.test(t))               q.pos = 'atk';
  else if(/守備表示/.test(t))          q.pos = 'def';

  // 属性・種族・レベル・攻守
  let m;
  for(const a of MAT_ATTRS){ if(t.indexOf(a+'属性') >= 0){ q.attr = a; break; } }
  for(const r of MAT_RACES){ if(t.indexOf(r+'族') >= 0){ q.race = r; break; } }
  if((m = t.match(/レベル\s*(\d+)\s*以上/)))      q.lvMin = +m[1];
  else if((m = t.match(/レベル\s*(\d+)\s*以下/))) q.lvMax = +m[1];
  else if((m = t.match(/レベル\s*(\d+)/)))        { q.lvMin = +m[1]; q.lvMax = +m[1]; }
  if((m = t.match(/攻撃力\s*(\d+)\s*以下/)))      q.atkMax = +m[1];
  if((m = t.match(/守備力\s*(\d+)\s*以下/)))      q.defMax = +m[1];
  if((m = t.match(/「([^」]+)」と名のついた/)))    q.nameIncludes = m[1];

  // 何枚
  if(/全て|すべて/.test(t)) q.count = 'all';
  else if((m = t.match(/(\d+)\s*[体枚]まで/)))  { q.count = +m[1]; q.upTo = true; }
  else if((m = t.match(/(\d+)\s*[体枚]/)))      q.count = +m[1];
  else q.count = 1;

  return q;
}

/* --- 動詞の対応表。長い表現から順に照合する --- */
const EFFECT_VERBS = [
  { re:/ゲームから除外する|除外する/,            op:'banish',        jp:'除外する' },
  { re:/持ち主の手札に戻す|手札に戻す/,          op:'bounce',        jp:'手札に戻す' },
  { re:/デッキに戻す/,                           op:'toDeck',        jp:'デッキに戻す' },
  { re:/墓地へ送る|墓地に送る/,                  op:'toGrave',       jp:'墓地へ送る' },
  { re:/特殊召喚(する|できる)/,                  op:'specialSummon', jp:'特殊召喚する' },
  { re:/手札に加える/,                           op:'search',        jp:'手札に加える' },
  { re:/破壊する|破壊できる/,                    op:'destroy',       jp:'破壊する' },
  { re:/発動を無効にし|効果を無効に|無効にする/, op:'negate',        jp:'無効にする' },
  { re:/コントロールを(得る|移す|入れ替える)/,   op:'control',       jp:'コントロールを移す' },
  { re:/裏側守備表示にする/,                     op:'faceDown',      jp:'裏側守備表示にする' },
  { re:/表示形式を変更する/,                     op:'togglePos',     jp:'表示形式を変更する' },
  { re:/ドローする|ドローできる/,                op:'draw',          jp:'ドローする' },
  { re:/ダメージを与える/,                       op:'damage',        jp:'ダメージを与える' },
  { re:/ライフポイントを回復する|回復する/,      op:'recover',       jp:'ライフを回復する' },
  { re:/手札を?(\d+)?枚?捨て/,                   op:'discard',       jp:'手札を捨てる' },
  { re:/ポイントアップ/,                         op:'atkUp',         jp:'攻撃力アップ' },
  { re:/ポイントダウン/,                         op:'atkDown',       jp:'攻撃力ダウン' },
];

/* --- 効果テキストを手順に分解する --- */
const EFFECT_STEP_CACHE = new Map();
function parseEffectSteps(text){
  const key = String(text||'');
  if(EFFECT_STEP_CACHE.has(key)) return EFFECT_STEP_CACHE.get(key);
  const steps = [];
  // ①②の番号と改行を句切りにし、さらに「。」で節に分ける
  const clauses = key.replace(/[①-⑳]:?/g, '\n')
                     .split(/[\n。]/)
                     .map(x=>x.trim()).filter(Boolean);
  clauses.forEach(cl=>{
    // 「〜できない」「〜されない」は禁止表現なので手順にしない
    if(/できない|されない|扱わない/.test(cl)) return;
    for(const v of EFFECT_VERBS){
      const m = cl.match(v.re);
      if(!m) continue;
      const before = cl.slice(0, m.index);
      const step = { op:v.op, jp:v.jp, raw:cl, target:parseTargetSpec(before) };
      // 捨てる対象は必ず手札。動詞の手前に「手札」が来ないので補う。
      if(v.op === 'discard'){ step.target.zone = 'hand'; step.target.kind = step.target.kind || 'any'; }
      // ドローする枚数はゾーン指定ではない
      if(v.op === 'draw'){ step.target.zone = null; }
      // 数値を伴う効果は値を拾う
      let nm;
      if((nm = cl.match(/(\d+)\s*ポイント/)))     step.value = +nm[1];
      else if((nm = cl.match(/(\d+)\s*枚ドロー/))) step.value = +nm[1];
      else if(v.op === 'draw'){
        const dn = cl.match(/デッキから(\d+)枚|(\d+)枚ドロー/);
        step.value = dn ? +(dn[1]||dn[2]) : 1;
      }
      steps.push(step);
      break;                       // 1つの節からは1つの手順だけ取る
    }
  });
  EFFECT_STEP_CACHE.set(key, steps);
  return steps;
}

/* --- 解析した対象指定から、実際の候補を集める --- */
function autoTextCandidates(selfP, spec){
  const foe = selfP===0?1:0;
  const players = spec.player === 'both' ? [0,1]
                : spec.player === 'opponent' ? [foe]
                : spec.player === 'self' ? [selfP]
                : [0,1];                       // 指定が無ければ両方から選べる
  const zones = spec.zone === 'grave' ? ['grave']
              : spec.zone === 'hand'  ? ['hand']
              : spec.zone === 'deck'  ? ['deck']
              : spec.zone === 'banish'? ['banish']
              : spec.kind === 'm'     ? ['mz']
              : spec.kind === 'st' || spec.kind === 's' || spec.kind === 't' ? ['sz','field']
              : ['mz','sz','field'];
  const out = [];
  players.forEach(p=>{
    const P = gameState.players[p];
    zones.forEach(z=>{
      const arr = (z === 'field') ? (P.field ? [P.field] : []) : (P[z] || []);
      arr.forEach((c,i)=>{
        if(!c) return;
        if(!autoTextMatches(c, spec)) return;
        out.push({p, zone:z, index:(z==='field'?0:i), card:c, db:dbOf(c)});
      });
    });
  });
  return out;
}
function autoTextMatches(card, q){
  const db = dbOf(card);
  if(q.kind === 'm'  && db.k !== 'm') return false;
  if(q.kind === 's'  && db.k !== 's') return false;
  if(q.kind === 't'  && db.k !== 't') return false;
  if(q.kind === 'st' && db.k === 'm') return false;
  if(q.face && card.face !== q.face) return false;
  if(q.pos  && card.pos  !== q.pos)  return false;
  if(q.attr && db.at !== q.attr) return false;
  if(q.race && db.ra !== q.race) return false;
  if(q.lvMin != null && curLV(card) < q.lvMin) return false;
  if(q.lvMax != null && curLV(card) > q.lvMax) return false;
  if(q.atkMax != null && (db.atk||0) > q.atkMax) return false;
  if(q.defMax != null && (db.def||0) > q.defMax) return false;
  if(q.nameIncludes && String(db.n||'').indexOf(q.nameIncludes) < 0) return false;
  return true;
}

/* --- 手順の説明文を組み立てる --- */
function autoStepLabel(step){
  const q = step.target || {};
  const bits = [];
  if(q.player === 'opponent') bits.push('相手の');
  else if(q.player === 'self') bits.push('自分の');
  else if(q.player === 'both') bits.push('お互いの');
  const zjp = {grave:'墓地', hand:'手札', deck:'デッキ', banish:'除外ゾーン', field:'フィールド'}[q.zone];
  if(zjp) bits.push(zjp + 'の');
  if(q.attr) bits.push(q.attr + '属性');
  if(q.race) bits.push(q.race + '族');
  if(q.nameIncludes) bits.push(`「${q.nameIncludes}」`);
  const kjp = {m:'モンスター', s:'魔法カード', t:'罠カード', st:'魔法・罠カード', any:'カード'}[q.kind];
  if(kjp) bits.push(kjp);
  if(q.count === 'all') bits.push('全て');
  else if(q.count > 1) bits.push(`${q.count}枚`);
  return bits.join('') + 'を' + step.jp;
}


/* =========================================================================
   解析した手順を実行する
   1手順ずつ、絞り込んだ候補を出して処理する。
   解析が不完全でも、白紙のパレットよりは確実に早い。
   ========================================================================= */
let AUTO_TEXT_CTX = null;

function runAutoText(name, p, zone, index){
  const P = gameState.players[p];
  const card = zoneCard(P, zone, index);
  const db = card ? dbOf(card) : (CARD_DB[findCardIndex(name)] || {});
  const steps = parseEffectSteps(db.e || '');
  if(!steps.length){
    showToast("効果テキストから手順を読み取れませんでした");
    openPrimitives(p, zone, index, name);
    return;
  }
  AUTO_TEXT_CTX = {name, p, zone, index, card, steps, done:steps.map(()=>false)};
  renderAutoText();
}

function renderAutoText(){
  const c = AUTO_TEXT_CTX;
  if(!c){ closeSheet(); return; }
  const rows = c.steps.map((st,i)=>{
    const n = autoTextCandidates(c.p, st.target).length;
    const need = ['draw','damage','recover','discard'].indexOf(st.op) < 0;
    const dis = c.done[i] ? ' warn' : '';
    const sub = c.done[i] ? '処理済み'
              : need ? `候補 ${n}件`
              : (st.value ? `${st.value}` : '');
    return `<div class="act pick-row${dis}" onclick="autoTextStep(${i})">
        <span class="pk-nm">${autoStepLabel(st)}</span>
        <span class="pk-sub">${sub}</span>
      </div>`;
  }).join("");
  sheet.innerHTML = `<div class="grip"></div>
    <h3 style="margin-bottom:4px">${c.name}</h3>
    <div class="meta" style="margin-bottom:10px">
      効果テキストから読み取った手順です。上から順に処理してください。<br>
      読み取りは完全ではないので、違う場合は「手動で効果処理」をお使いください。</div>
    <div class="pick-list">${rows}</div>
    <div class="act-grid" style="margin-top:10px">
      <div class="act" onclick="closeSheet();openPrimitives(${c.p},'${c.zone}',${c.index},${jsStr(c.name)})">手動で効果処理…</div>
    </div>
    <button class="close" onclick="AUTO_TEXT_CTX=null;closeSheet()">閉じる</button>`;
  veil.classList.add("on");
}

/* 1手順を処理する */
function autoTextStep(i){
  const c = AUTO_TEXT_CTX; if(!c) return;
  const st = c.steps[i];
  const finish = ()=>{ c.done[i] = true; render(); renderAutoText(); };

  // 対象を取らない効果（ライフ・ドロー・手札の枚数指定）
  if(st.op === 'draw'){    API.draw(c.p, st.value || 1, c.name); finish(); return; }
  if(st.op === 'damage'){  API.damageLP(c.p===0?1:0, st.value || 0, c.name); finish(); return; }
  if(st.op === 'recover'){ API.recoverLP(c.p, st.value || 0, c.name); finish(); return; }

  const cands = autoTextCandidates(c.p, st.target);
  if(!cands.length){ showToast("条件に合うカードがありません"); return; }

  const count = (st.target.count === 'all') ? cands.length : (st.target.count || 1);
  const chosen = [];
  const pick = ()=>{
    const left = cands.filter(x=>chosen.indexOf(x.card) < 0)
                      .filter(x=>!!resolveTarget(x));
    if(chosen.length >= count || !left.length){
      chosen.forEach(cd=>applyAutoStep(c, st, cd));
      finish(); return;
    }
    API.selectCard(`${c.name}：${autoStepLabel(st)}（${chosen.length+1}/${count}）`,
      left, x=>{ chosen.push(x.card); pick(); },
      st.target.upTo ? "選ばない場合は閉じてください" : "");
  };
  pick();
}

/* 手順1つを1枚のカードに適用する */
function applyAutoStep(c, st, target){
  const t = {card:target};
  switch(st.op){
    case 'destroy':        API.destroy(t, c.name); break;
    case 'banish':         API.banish(t, c.name); break;
    case 'bounce':         API.returnToHand(t, c.name); break;
    case 'toDeck':         API.returnToDeck(t, false, c.name); break;
    case 'toGrave':        API.sendToGrave(t, c.name); break;
    case 'negate':         API.negate(t, c.name); break;
    case 'faceDown':
      act({type:"FX_SET_STATE", player:target.p, zone:'mz',
           index:(gameState.players[target.p].mz||[]).indexOf(target),
           face:'down', pos:'def', reason:c.name});
      break;
    case 'togglePos':      togglePosition(t, c.name); break;
    case 'control': {
      const loc = locateCard(target);
      if(loc) API.changeControl(t, loc.p===0?1:0, c.name);
      break;
    }
    case 'discard': {
      const loc = locateCard(target) ||
        (function(){ for(let p=0;p<2;p++){ const i=(gameState.players[p].hand||[]).indexOf(target);
          if(i>=0) return {p, zone:'hand', index:i}; } return null; })();
      if(loc) API.discard(loc.p, loc.index, c.name, {byPlayer:c.p});
      break;
    }
    case 'specialSummon': {
      const loc = (function(){
        for(let p=0;p<2;p++){ for(const z of ['grave','hand','deck','banish','ex']){
          const i=(gameState.players[p][z]||[]).indexOf(target);
          if(i>=0) return {p, zone:z, index:i}; } } return null; })();
      if(loc) API.specialSummon(c.p, loc.zone, loc.index, 'atk', c.name);
      break;
    }
    case 'search': {
      const i = (gameState.players[c.p].deck||[]).indexOf(target);
      if(i>=0) API.searchDeck(c.p, i, c.name);
      break;
    }
    case 'atkUp':   API.modAtk(t,  (st.value||0), 0, 'endTurn', c.name); break;
    case 'atkDown': API.modAtk(t, -(st.value||0), 0, 'endTurn', c.name); break;
  }
}

/* 召喚成功時に誘発する効果を自動で提示する */

/* =========================================================================
   割り込み確認
   召喚・魔法罠の発動など「相手が反応できる場面」で、
   相手が撃てる伏せを持っていれば確認を出す。
   （激流葬・奈落・神の宣告などを撃ち逃さないため）
   ========================================================================= */
let ASK_CHAIN = true;               // メニューでON/OFFできる
function askChain(triggerLabel, onContinue){
  const rp = reactingPlayer();
  const n  = ASK_CHAIN ? reactableCards(rp).length : 0;
  if(!n){ if(onContinue) onContinue(); return; }
  PENDING_CONTINUE = onContinue || null;
  if(typeof notePromptOpenS03==='function') notePromptOpenS03();   /* S03-U37 */
  setTimeout(()=>{
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:4px">${triggerLabel}</h3>
      <div class="meta" style="margin-bottom:10px">
        <b style="color:var(--trap)">${nameOf(rp)}</b> は発動できるカードを ${n}枚 持っています。<br>
        チェーンしますか？</div>
      <div class="act-grid wide">
        <div class="act" style="background:var(--trap);color:#120a1f;border-color:var(--trap)"
             onclick="closeSheet();openReact()">${nameOf(rp)}が発動する</div>
        <div class="act" onclick="chainPassed()">チェーンしない（このまま処理）</div>
      </div>
      <div class="meta" style="margin-top:8px;font-size:10px">
        毎回聞かれるのが煩わしい場合は、メニューから確認をオフにできます。</div>`;
    veil.classList.add("on");
  }, 50);
}
let PENDING_CONTINUE = null;
function chainPassed(){
  const cb = PENDING_CONTINUE; PENDING_CONTINUE = null;
  if(typeof notePromptClosedS03==='function') notePromptClosedS03();   /* S03-U37 */
  closeSheet();
  if(cb) cb();
}
function toggleAskChain(){
  ASK_CHAIN = !ASK_CHAIN;
  showToast(ASK_CHAIN ? "チェーン確認：オン" : "チェーン確認：オフ");
  closeSheet();
}

/* EXデッキからの召喚。
   DUELではシンクロ/エクシーズを「素材処理→召喚無効窓→召喚成功」に分離する。
   融合はカード効果による召喚なのでDUELのEX一覧から直接は行わない。 */
/* v4.2: pending EX state lives inside gameState and every state transition uses act(). */
function __pendingExCommitV2(){
  if(!gameState.pendingExV2) return;
  act({type:'EX_SUMMON_COMMIT_V42',player:gameState.pendingExV2.player});
  flushDeferredEventsV2();
}
function __pendingExCancelV2(){
  if(!gameState.pendingExV2) return;
  act({type:'EX_SUMMON_CANCEL_V42',player:gameState.pendingExV2.player});
  flushDeferredEventsV2();
}
function beginExSummonV2(p,exIndex,materials,kind,pos){
  const P=gameState.players[p], ex=P.ex[exIndex]; if(!ex) return;
  if(kind!=='synchro'&&kind!=='xyz'){ showToast('DUELモードの融合召喚はカード効果から行ってください'); return; }
  const sr=(typeof v46SpecialSummonRestrictionReason==='function')?v46SpecialSummonRestrictionReason(p,dbOf(ex)):'';
  if(sr){ showToast(sr); return; }
  /* S03-U139: 「お互いにシンクロ召喚をする事ができない」（天刑王 ブラック・ハイランダー） */
  const slS03=(kind==='synchro'&&typeof synchroSummonLockReasonS03==='function')?synchroSummonLockReasonS03(p):'';
  if(slS03){ showToast(slS03); return; }
  if(P.mz.length-materials.length>=ZONE_LIMITS.mz){ showToast('モンスターゾーンが足りません'); return; }
  /* S03-U163: the given materials must be a legal set (engine/20 exMaterialsLegalS03) */
  if(typeof exMaterialsLegalS03==='function' && !exMaterialsLegalS03(p, dbOf(ex), materials)){ showToast('素材の条件を満たしていません'); return; }
  ensureCardUid(gameState,ex);
  act({type:'EX_SUMMON_PREPARE_V42',player:p,exIndex,materials:materials.slice(),kind,pos:pos||'atk'});
  const q=gameState.pendingExV2; if(!q) return;
  beginSummonWindowV2({player:p,name:cardName(q.exCard),kind,label:kind==='synchro'?'シンクロ召喚':'エクシーズ召喚',uid:q.exCard.uid,commit:'__pendingExCommitV2',cancel:'__pendingExCancelV2'});
  render();
}

function doExSummon(p, exIndex, materials, kind, pos){
  const nm = (dbOf((gameState.players[p].ex||[])[exIndex])||{}).n || "";
  closeSheet();
  if(PLAY_MODE===PLAY_MODES.DUEL && (kind==='synchro'||kind==='xyz')){ beginExSummonV2(p,exIndex,materials,kind,pos); return; }
  act({type:"FX_EX_SUMMON", player:p, exIndex, materials, kind, pos});
  const summoned = lastSummonedCard(p);
  EVT_AFTER = ()=>{ offerSummonTrigger(p, nm); offerReactAfter(p===0?1:0); };
  if(!emitEvent("onSpecialSummon", {player:p, name:nm, card:summoned, kind})){
    EVT_AFTER = null;
    askChain(`${nm} の${kind==='synchro'?'シンクロ':kind==='xyz'?'エクシーズ':'融合'}召喚`,
      ()=>{ offerSummonTrigger(p, nm); offerReactAfter(p===0?1:0); });
  }
}

function offerSummonTrigger(p, cardName_){
  // スクリプト実装済みなら、召喚時トリガーを持つ場合だけ提示する（宣言テーブルより優先）
  const sc = CARD_SCRIPTS[cardName_];
  if(sc){
    const hasSummonTrigger = sc.passive && (sc.passive.onNormalSummon || sc.passive.onSpecialSummon);
    if(!hasSummonTrigger) return;
  } else {
    const ent = AUTO_EFFECT[cardName_];
    if(!ent || ent.trig!=="summon") return;
  }
  // 召喚したモンスターの場の位置を特定して渡す（zoneが無いと条件判定で弾かれる）
  const P = gameState.players[p];
  const mzIdx = P.mz.findIndex(c=>c && cardName(c)===cardName_);
  if(mzIdx < 0) return;
  setTimeout(()=>{
    sheet.innerHTML = `<div class="grip"></div>
      <h3 style="margin-bottom:6px">${cardName_} の効果</h3>
      <div class="meta" style="margin-bottom:12px">召喚に成功しました。効果を発動しますか？</div>
      <div class="act-grid wide">
        <div class="act" style="background:var(--gold);color:var(--gold-ink);border-color:var(--gold-hi)"
             onclick="closeSheet();runEffect(${p},${jsStr(cardName_)},{zone:'mz',index:${mzIdx},keep:true})">効果を発動する</div>
        <div class="act" onclick="closeSheet()">発動しない</div>
      </div>`;
    veil.classList.add("on");
  }, 80);
}

