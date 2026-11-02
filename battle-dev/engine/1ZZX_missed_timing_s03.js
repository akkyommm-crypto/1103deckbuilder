/* S03-U491 / S03-U492 / S03-U493 / S03-U494 / S03-U495 / S03-U496: 「タイミングを逃す」の共通機構。
   設計と当時裁定の根拠は docs/S03_MISSED_TIMING_DESIGN.md（裁定の抽出は docs/S03_MISSED_TIMING_RULINGS.md、123 件）。

   当時裁定から読み取れる規則:
     R1 強制誘発は逃さない（手段を問わない）              — 《D・バリア》09/09/27 ほか
     R2 任意誘発（「〜した時…できる」）は、条件が満たされた後に別の処理があると逃す — 《光神テテュス》08/05/29 ほか
     R3 チェーン2以上で条件が満たされ、残りのリンクの解決が続く場合は逃す — 《落とし穴》（WIKI-2B88D7C8D921、回答日なし）
     R4 判定軸は「最後に行われた処理か」。同時に行われた処理は互いを逃させない — 《魔轟神獣ノズチ》09/10/13 ほか
     R5 例外カードは任意でも逃さない                      — 《ダーク・スプロケッター》08/04/19 ほか
     R6 当時「調整中」のものがある                        — 《カオスポッド》11/08/03（RULING_UNRESOLVED）
     R7 「〜した**場合**」の任意効果は逃さない。「〜した**時**」だけが逃す。テキストの文言で分かれる
        — 《ゴブリンドバーグ》WIKI-9FC5B41EDCF4（11/04/17）とその裏返し WIKI-0B439F71B94A（11/04/18）
     R8 「リバースした時」のリバース効果は逃さない。進行中の処理が終わってから発動する
        — 《カオス・インフィニティ》WIKI-B2BFD8FD6AFC（11/03/03）、《ニードル・ボール》WIKI-624AAB0A922F（08/03/06）、
          《裏ガエル》WIKI-8CD28D6D58FD（10/04/13）。S03-U494 で確認し、flipSummonReverse 種別を無効にした
     R9 「召喚」は「表側攻撃表示または表側守備表示での通常召喚」だけを指す。反転召喚・特殊召喚は含まない
        — 《魔導戦士 ブレイカー》WIKI-BC4886A97EED（取得 2011-08-30）。S03-U494 で文言をイベントごとに読む根拠
     R10 チェーンブロックを作らない効果は「発動」ではないので、タイミングを逃すこともない
        — 《運命のドラ》WIKI-FB3F368EA14D（09/12/08）「ダメージを与える効果はチェーンブロックを作りますか？」→「いいえ、作りません」、
          《ドラグニティアームズ－レヴァテイン》WIKI-6C6CE6145A4A／《－ミスティル》WIKI-5E8A1950B9D5（10/06/19、召喚ルール効果）。
          S03-U495 で確認

   S03-U496 で**公開できる範囲**を確定した。(B-2)(B-3) の「文言＋配線」で決まる候補のうち、
   当時の根拠で**任意性・発動条件・例外**を確認できた効果だけを落とす許可リスト (B-5) を足した。
   確認できていないものは落とさない ＝ S03-U491 以前の挙動を維持する（**未対応**。
   「逃さないという裁定が確定した」のではない）。実測で落とす組は 290 → 65 になった。

   機構は 4 つ:
     (A) gameState.procStepS03 — 「行われた処理」の通し番号。
     (B) 判定の対象 — 宣言（カードごと）と、配線と文言の両方で決まる種別。
     (B-5) 公開範囲の許可リスト — 当時の根拠で確認できた（カード, イベント, 効果）だけを落とす。
     (C) filterMissedTimingS03 — 判定は collectHandlers（engine/40）の 1 箇所だけで行う。

   S03-U492 で (A) を拒否リストから許可リストに反転した（列挙の漏れが「誤って逃す」側に落ちていた）。
   S03-U493 で次の 2 点を直した。どちらも実経路で再現してから直してある:
     (1) 「起きたか」の印がログ 1 行に依存していた。盤面の署名が各ゾーンの**枚数とライフ**しか見ていないため、
         表示形式・攻守・レベル・カウンターだけが変わる処理は logIt が書かれたかどうかでしか分からず、
         FX_SET_STATE の表示形式・レベル変更のように型ごと許可リストの条件から外れているものは**数え落ちていた**。
         実測（WIKI-9FC5B41EDCF4、回答日 2011-04-17）: 《ゴブリンドバーグ》を通常召喚し、その誘発で
         手札から《E・HERO エアーマン》を特殊召喚してから自身が守備表示になる場合、当時裁定では
         エアーマンの召喚誘発（と相手の《奈落の落とし穴》）はタイミングを逃すが、
         守備表示にする FX_SET_STATE（pos だけ）が番号を進めないため**両方とも発動できていた**。
         → 署名をカード 1 枚ごとの状態（表示形式・攻守修整・レベル・カウンター・装備・素材・無効）まで広げ、
           ログの印は**完全に外した**（logIt への呼び出しも消した）。
     (2) 種別が「エンジンの配線」だけで決まっていたため、召喚成功のイベントで拾われた任意の候補を
         すべて逃させていた。実測（候補 518 件を全件監査）: 強制 255 / 逃す 218 / 「場合」15 /
         召喚無効 6 / 文言が読み取れない 24。**「場合」15 件と文言の読み取れない 24 件は逃さない**ので、
         配線だけの判定はこの 39 件を誤って落としていた（FREE モードでは召喚無効の 6 件も）。
         逆に、旧「リバース:」表記ではなく「反転召喚に成功した時」と書かれた 4 枚
         （《スカラベの大群》《メデューサ・ワーム》《ガーディアン・スタチュー》《イナゴの軍勢》）は
         onFlip でしか拾われないため、文言を見るだけでは逃し損ねる。反転召喚も召喚として扱う。
         → 種別に当時テキストの「時」／「場合」の判定を足し、肯定的に「時」と読めるものだけを落とす。

   S03-U494 は文言分類の**時代混在**を確認し、根拠の取れた食い違いだけを直した。
     (1) 文言を 1 枚単位ではなく**効果ごと・イベントごと**に読む（R9）。
         S03-U493 の正規表現は「特殊召喚に成功した時」の中の「召喚に成功した時」に当たり、
         「S召喚」（当時は「シンクロ召喚」）も「召喚」と読んでいた。
     (2) flipSummonReverse 種別を**無効にした**（R8）。S03-U493 はこの種別を当時の根拠なしに有効にしていた。
     (3) スクリプトが任意として登録しているが当時裁定が「強制」と明言している 6 枚を (B-1) で宣言した（R1）。
   確認できなかったものは設計書 3(B-4) と 5-a に**未確定**として残してある。
   「場合」と読めるカードの文言が当時は「時」だった例も見つかっているが（《茫漠の死者》WIKI-A9967954DFF2 11/03/19、
   《E・HERO ガイア》WIKI-3798ED89CB2C 08/09/23）、いずれも強制誘発なので R1 で逃さず、結果は変わらない。 */

/* =========================================================================
   (A) 処理番号
   ========================================================================= */

/* (A-1) 「処理」として数える Action。値が関数ならその Action に対して真を返したときだけ数える。
   ここに無い Action は番号を進めない（＝逃さない ＝ S03-U491 以前の挙動）。迷ったものは入れない。
   除いてあるもののうち、意図を明記しておくべきもの:
     - CHAIN_* / CHOICE_* / EVENT_* / PREP_TX_* / SUMMON_WINDOW_* … チェーンの積み下ろし・選択の提示・
       遅延イベントの出入り・発動準備。処理ではない
     - SPECIAL_WIN_DEFER_S03 / CHECK_DECKOUT / DUEL_LOSER_S03 … 勝敗の確認
     - SET_PHASE / SET_PRIORITY / PASS_TURN / PHASE_SKIP_V7 … 進行
     - V4_EFFECT_* / SCHEDULE_* / LINGER_ADD_S03 / EFFECT_COUNT_CONSUME_V44 / RESERVE_ADD / FX_CARD_FLAG_V46
       … 登録と計上
     - MOD_CLEAR / COUNTER_CLEAR / LINK_CLEAR_V9 / PROT_CLEAR_V21 … 掃除（STAT_MOD_V14 等の clear も同じ）
     - ATTACK_DECLARE_V48 … 攻撃宣言は処理ではない（ダメージ計算の ATTACK は数える）
     - **FX_SELF_TO_GRAVE は数えない（S03-U506 で外した）** … 発動した魔法・罠が解決後に墓地へ送られる
       ルール上の行為で、効果の処理ではない。発行しているのは engine/20 afterEffect・engine/30
       afterPreparedResolve・engine/40 afterResolve・engine/70・engine/1U（発動を無効にされた分）の
       5 か所で、**すべてそのカード自身の後片付け**である（S03-U506 で全件確認）。
       当時裁定もこれを処理に数えていない: `WIKI-1B4D52FCA757`（**回答日 2010-08-11**）は
       《グリフォンの羽根帚》（通常魔法）で《歯車街》を破壊した場合に逃す理由を
       「破壊後に**回復の処理**が挟まるので」と説明しており、魔法が墓地へ行くこと自体は挙げていない。
       `WIKI-25B0FF09EA0C`（**回答日 2009-02-22**）も「効果はカードが破壊されたというタイミングで
       終了するため…発動する事ができます」と答えている。
       召喚成功の種別では影響が無かった（解決中の特殊召喚成功は flushResolutionSummonBatchV2 が
       リンクの解決の最後に刻むため）。破壊の種別を入れた S03-U506 で初めて実経路に出た。
     - SHUFFLE / DECK_ORDER_V20 / FACEDOWN_SHUFFLE_V20 … ルール上の行為。
       《連鎖除外》WIKI-3178D0C2D874（10/07/03）「シャッフルは効果処理に含まれません」
     - SS_POS_S03 … 特殊召喚の表示形式の選択（召喚そのものの一部） */
const MISSED_TIMING_PROCESSING_S03 = new Map([
  /* 召喚 */
  ['NORMAL_SUMMON', true], ['FX_SPECIAL_SUMMON', true], ['FX_EX_SUMMON', true], ['EX_SUMMON_COMMIT_V42', true],
  ['FX_RITUAL_SUMMON', true], ['GEMINI_SUMMON_S03', true], ['TOKEN_CREATE', true], ['SET_MONSTER', true], ['SET_ST', true],
  /* カードの移動・除去 */
  ['MOVE', true], ['FX_TO_GRAVE', true], ['FX_BANISH', true], ['FX_DESTROY_BANISH', true],
  ['FX_BOUNCE', true], ['FX_RETURN_DECK', true], ['FX_DISCARD', true], ['FX_HAND_SEND_GRAVE', true],
  ['FX_HAND_TO_TOP', true], ['FX_MILL', true], ['FX_MILL_TOP', true], ['FX_SEARCH', true], ['FX_DECK_TO_HAND', true],
  ['FX_WIPE_ZONE', true], ['DESTROY_SUB_S03', true], ['HAND_DESTROY_RANDOM_S03', true], ['FX_PLACE_SPELL_S03', true],
  /* 装備・エクシーズ素材 */
  ['FX_EQUIP', true], ['FX_EQUIP_FROM_GRAVE_V31', true], ['FX_MONSTER_EQUIP_V46', true], ['FX_UNEQUIP', true],
  ['FX_OVERLAY', true], ['FX_DETACH', true],
  /* 盤面の状態。FX_SET_STATE は「セットされたカードを発動する時の表返し」だけ除く（下記） */
  ['FLIP', true], ['TOGGLE_POS', true],
  ['FX_SET_STATE', a => !missedTimingActivationFlipS03(a)],
  ['FX_CONTROL', true], ['CONTROL_SWAP_V26', true], ['CONTROL_RETURN', true], ['CONTROL_RETURN_ONE_V26', true],
  ['FX_NEGATE', true], ['NEGATE_CARD_V13', true], ['NEGATE_ATTACK_V45', true],
  /* 数値とカウンター。clear は掃除なので数えない */
  ['LP', true], ['DRAW', true], ['MOD_ADD', true], ['MOD_SET', true],
  ['STAT_MOD_V14', a => !a.clear], ['LEVEL_MOD_V16', a => !a.clear], ['CHAR_MOD_V17', a => !a.clear],
  ['COUNTER_ADD', true], ['COUNTER_REMOVE', true], ['COUNTER_SPREAD_PLACE_V22', true], ['COUNTER_SPREAD_REMOVE_V22', true],
  /* 戦闘 */
  ['ATTACK', true], ['BATTLE_CLEANUP', true],
]);
/* セットされたカードを発動する時の表返し。engine の 3 箇所だけが reason:'発動' で発行する
   （engine/20 の発動、engine/30 のチェーン応答、engine/70 の手動発動）。
   「発動」は処理ではないので数えない。効果で表側にする場合（v10FlipEffect / ダメージ計算前のリバース）は数える。
   この 3 箇所はテストで固定している（tools/test_s03_u493_*.js の A）。 */
function missedTimingActivationFlipS03(a){
  return !!(a && a.face === 'up' && a.pos == null && a.reason === '発動' && !a.flipSummon && !a.v10FlipEffect);
}
function missedTimingIsProcessingS03(a){
  if(!a || !a.type) return false;
  const v = MISSED_TIMING_PROCESSING_S03.get(a.type);
  if(v === true) return true;
  if(typeof v === 'function'){ try{ return !!v(a); }catch(e){ return false; } }
  return false;
}

/* (A-2) 「本当に何か起きたか」の印。次のどちらかがあれば起きたものとする。
     1. 盤面の署名が変わった
     2. 条件が満たされた遅延イベントが積まれた
   どちらも無ければ空振り（対象がもう場に無い、ゾーンが一杯、セットが禁止されている、
   カウンターの上限に達している等）なので番号を進めない。
   署名も回数も**差分だけ**を見るので状態には入れず、保存・digest にも出ない。

   S03-U492 は 3 番目の印として logIt の有無を見ていた。これは
     - 許可リストの一部の reducer が「適用できなかった理由」をログに書いて何もせずに終わる
       （`モンスターゾーンが一杯です`、カウンターの `これ以上…置けない` 等）ため、
       空振りを処理と数えて**誤って逃させる**
     - 逆に、ログを書かない処理は数え落ちる
   という二重の弱さがあり、S03-U493 で外した。許可リストの Action が成功したときは必ず
   署名か遅延イベントのどちらかが動く（下の署名がそのために 1 枚ごとの状態まで見ている）。 */

/* 盤面の署名。1 回の applyAction の前後でしか比べない軽い値。
   mz / sz / field は 1 枚ごとの状態まで、他のゾーンは枚数だけを見る。
   **数えるのは許可リストの reducer が「効果として」書く欄だけ**にする。
   どの Action でも走る帳簿（procedureBaseStats の整理、攻撃済みフラグ、継続効果の再計算）を
   入れると、空振りの Action まで「起きた」と判定して誤って逃させるため入れない。 */
function missedTimingCardSigS03(n, c){
  if(!c) return (n * 31 + 1) | 0;
  n = (n * 31 + (c.uid | 0)) | 0;
  n = (n * 31 + (c.face === 'down' ? 2 : 1)) | 0;
  n = (n * 31 + (c.pos === 'def' ? 2 : 1)) | 0;
  n = (n * 31 + (c.lvMod | 0)) | 0;
  n = (n * 31 + ((c.mods && c.mods.length) | 0)) | 0;
  n = (n * 31 + ((c.statModsV14 && c.statModsV14.length) | 0)) | 0;
  n = (n * 31 + ((c.lvModsV16 && c.lvModsV16.length) | 0)) | 0;
  n = (n * 31 + ((c.charV17 && c.charV17.length) | 0)) | 0;
  n = (n * 31 + ((c.xyz && c.xyz.length) | 0)) | 0;
  n = (n * 31 + ((c.equippedBy && c.equippedBy.length) | 0)) | 0;
  n = (n * 31 + (c.equipTo ? (((c.equipTo.p | 0) * 1024) + (c.equipTo.uid | 0)) : 0)) | 0;
  n = (n * 31 + (c.negated ? 2 : 1) + (c.negV13 ? 4 : 0)) | 0;
  n = (n * 31 + (c.dualUp ? 2 : 1)) | 0;
  if(c.counters) Object.keys(c.counters).sort().forEach(k=>{
    for(let i = 0; i < k.length; i++) n = (n * 31 + k.charCodeAt(i)) | 0;
    n = (n * 31 + (c.counters[k] | 0)) | 0;
  });
  return n;
}
function missedTimingSigS03(gs){
  let n = 0;
  if(!gs || !gs.players) return n;
  for(let p = 0; p < 2; p++){
    const P = gs.players[p];
    if(!P) continue;
    ['hand','grave','banish','deck','ex'].forEach(k=>{ n = (n * 31 + ((P[k] && P[k].length) | 0)) | 0; });
    ['mz','sz'].forEach(k=>{
      const arr = P[k] || [];
      n = (n * 31 + arr.length) | 0;
      for(let i = 0; i < arr.length; i++) n = missedTimingCardSigS03(n, arr[i]);
    });
    n = missedTimingCardSigS03((n * 31 + (P.field ? 1 : 0)) | 0, P.field);
    n = (n * 31 + (P.lp | 0)) | 0;
  }
  n = (n * 31 + (gs.attackNegated ? 2 : 1)) | 0;
  return n;
}
let MISSED_TIMING_QUEUED_S03 = 0;
let MISSED_TIMING_FLIGHT_S03 = null;
function noteMissedTimingQueueS03(){ MISSED_TIMING_QUEUED_S03++; }

/* 最上位の applyAction から呼ぶ（engine/00）。Journal 再生でも同じ Action 列・同じ reducer を通るので同じ値に再構成される。 */
function missedTimingBeginS03(gs, a){
  if(!gs || !missedTimingIsProcessingS03(a)) return null;
  const f = {queued:MISSED_TIMING_QUEUED_S03, sig:missedTimingSigS03(gs), prev:MISSED_TIMING_FLIGHT_S03};
  MISSED_TIMING_FLIGHT_S03 = f;
  return f;
}
function missedTimingEndS03(gs, f, applied){
  if(!f) return;
  MISSED_TIMING_FLIGHT_S03 = f.prev || null;
  if(!applied) return;                                                        /* 適用が例外で終わった */
  const happened = missedTimingSigS03(gs) !== f.sig || MISSED_TIMING_QUEUED_S03 !== f.queued;
  if(!happened) return;                                                       /* 空振り */
  gs.procStepS03 = (gs.procStepS03 | 0) + 1;
}
/* 遅延イベントに刻む番号。処理の最中に積まれたイベントは、その処理が数え上げられた後の番号を持つ
   （その処理が空振りに終われば番号は増えないが、イベントを積んだこと自体が「起きた」印なので増える）。 */
function missedTimingStampS03(gs){
  return (((gs && gs.procStepS03) | 0) + (MISSED_TIMING_FLIGHT_S03 ? 1 : 0));
}

/* =========================================================================
   (B) 判定の対象
   ========================================================================= */

/* (B-1) カードごとの宣言。'miss' = タイミングを逃す、'never' = 逃さない。
   宣言の無いカードは下の種別だけで決まる。各件に当時裁定の ID を必ず添える。
   **R1（強制誘発は逃さない）の宣言（S03-U494）**: スクリプトは任意として登録しているが、
   当時裁定が「強制」「必ず発動」「その場合でも発動しチェーンブロックが作られる」と明言しているカード。
   強制／任意はスクリプト側の値（engine/1ZB の triggerCandidateForcedS03）で決まるので、
   ここでは missedTimingDropS03 の判定だけを戻す（SEGOC の順位や強制群の扱いは変えない）。
   裁定の本文は docs/S03_MISSED_TIMING_RULINGS.md の「S03-U494 で追加参照した当時裁定」節。
   R5（任意でも例外的に逃さないカード）の宣言は**いまも 0 件**。
   《ダーク・スプロケッター》08/04/19・《ファラオの化身》09/05/15・《アーケイン・ファイロ》08/11/21 の
   3 件はいずれも墓地送りを条件とする誘発で、召喚成功の候補には入っていない（S03-U493 で全件照合）。 */
const MISSED_TIMING_DECL_S03 = {
  /* 10/08/05「はい、このカードが召喚に成功した時に強制的に発動します」 */
  'リチュア・チェイン':       {mode:'never', ruling:'WIKI-07D76F683452', reason:'R1 強制'},
  /* 10/10/09「その場合でも発動しチェーンブロック自体は作られます」／「必ず…選択して発動する必要があります」 */
  '炎帝近衛兵':               {mode:'never', ruling:'WIKI-8639442A7B6A', reason:'R1 強制'},
  /* 09/04/09「チェーン２以上のタイミングで手札から特殊召喚されたとき…」→「強制効果のため、発動します」 */
  'バーニング・スカルヘッド':  {mode:'never', ruling:'WIKI-A47B4CA77987', reason:'R1 強制（本機構と同じ場面）'},
  /* 10/09/18「その場合でも効果は発動しチェーンブロックが作られます」 */
  'サイコ・エンペラー':       {mode:'never', ruling:'WIKI-55066C00ED04', reason:'R1 強制'},
  /* 「リバースした場合に必ず発動する誘発効果」（独立検証層、回答日なし） */
  'スノーマンイーター':       {mode:'never', ruling:'R1103-SNOWMAN-002', reason:'R1 強制'},
  /* 11/03/03「タイミングを逃さず効果を発動できますか？」→「はい、…効果処理終了後にリバース効果が発動し」 */
  '素早いビッグハムスター':    {mode:'never', ruling:'WIKI-B2BFD8FD6AFC', reason:'リバース効果は逃さない'},
  /* R10（S03-U495）。09/12/08「ダメージを与える効果はチェーンブロックを作りますか？」→「いいえ、作りません」。
     発動ではないので逃すこともない。なおこのカードは通常罠で、解決後は墓地へ送られるため、
     スクリプトが持つ魔法・罠ゾーンからの誘発効果は実経路では発火しない（S03-U495 で実測）。
     分類だけを当時裁定に合わせるもので、実経路の挙動は変わらない。 */
  '運命のドラ':               {mode:'never', ruling:'WIKI-FB3F368EA14D', reason:'R10 チェーンブロックを作らない'},
};
function missedTimingModeS03(name){
  const d = MISSED_TIMING_DECL_S03[name];
  return (d && d.mode) || null;
}

/* (B-2) 当時テキストの「時」と「場合」を、**効果ごと・イベントごと**に読む（S03-U494 で作り直した）。
   S03-U493 は 1 枚のテキスト全体を 1 つの「召喚句」と 1 つの「リバース句」にまとめていた。これは 2 つ誤る。
     - **召喚・特殊召喚・反転召喚を区別しない。** 正規表現の選択肢が「召喚」から並んでいるため
       「特殊召喚に成功した時」の中の「召喚に成功した時」に当たり、特殊召喚の句しか持たないカードを
       通常召喚・反転召喚のイベントでも落としていた（実測: 《アルカナフォースEX－THE LIGHT RULER》）。
       当時裁定 `WIKI-BC4886A97EED`（《魔導戦士 ブレイカー》、取得 2011-08-30）は
       「「召喚」とは、「表側攻撃表示または表側守備表示での通常召喚」を指します」と明示し、
       反転召喚・特殊召喚では魔力カウンターの誘発は発動しないと答えている。
     - **1 枚のテキストで一括判定していた。** 関係の無い効果の「場合」で判定が変わる。
   そこで句の直前に並ぶ召喚語を**長い語から**読み取り（「S召喚」の略記と「生け贄召喚」「アドバンス召喚」も含む）、
   語ごとに N（通常召喚）／ S（特殊召喚）／ F（反転召喚）／ R（リバース）へ割り当て、
   判定するイベントに対応する種類の句だけを見る。同じ種類に「時」と「場合」が混在すれば曖昧なので
   **逃さない**。読み取れないものも逃さない（＝ S03-U491 以前の挙動）。

   テキスト層が時代混在であることは実測できる（S03-U494、候補 518 件のテキスト）:
     - 「S召喚」17 箇所 — 2011 当時は「シンクロ召喚」と書かれていた略記。
       S03-U493 の正規表現はこれを「召喚」と読み、シンクロ召喚の句を通常召喚のイベントに結び付けていた
     - 「生け贄召喚」6 箇所と「アドバンス召喚」32 箇所が同じ層に共存（用語の変更は 2010-03）
   食い違いの向きと、どこまでが当時裁定で裏付けられているかは設計書 3(B-2) と 3(B-4) に書いてある。 */
/* S03-U506: 破壊・墓地送りの語を足した（設計書 (F)）。
   語ごとに D（破壊）／B（戦闘で破壊）／G（墓地へ送られた）／GF（フィールドから墓地へ送られた）／
   X（除外）／T（リリース）へ割り当てる。**召喚語の割り当ては 1 文字も変えていない**ので、
   N/S/F/R の読み取りは S03-U494 以降と同じである（tools/test_s03_u506_* の negative control で
   全 4996 枚の件数が同じことを固定している）。 */
const MISSED_TIMING_SUMMON_WORDS_S03 = [
  ['エクシーズ召喚','S'], ['シンクロ召喚','S'], ['アドバンス召喚','N'], ['生け贄召喚','N'],
  ['反転召喚','F'], ['特殊召喚','S'], ['融合召喚','S'], ['儀式召喚','S'], ['通常召喚','N'],
  ['S召喚','S'], ['Ｓ召喚','S'], ['X召喚','S'], ['Ｘ召喚','S'], ['召喚','N'], ['リバース','R'],
  /* S03-U506 */
  ['戦闘で破壊','B'], ['破壊','D'], ['フィールドから墓地へ送','GF'], ['墓地へ送','G'],
  ['除外','X'], ['リリース','T'],
].sort((a,b)=>b[0].length-a[0].length);
/* S03-U506: 「られた」を足した。これが無いと「墓地へ送られた時」に 1 件も当たらない（S03-U505 で実測）。
   「召喚された時」等は今までどおり「された」の方で当たるので、召喚句の読み取りは変わらない。 */
const MISSED_TIMING_TERM_S03 = /(?:に成功した|された|られた|した)(時|場合)/g;
const MISSED_TIMING_TEXT_CACHE_S03 = new Map();
/* 句の直前の「<召喚語>（・<召喚語>）*」を後ろから読む。長い語を先に当てるので
   「特殊召喚」が「召喚」として読まれることはない。 */
function missedTimingWordsBeforeS03(text, pos){
  const out = [];
  let i = pos;
  for(;;){
    let hit = null;
    for(let k = 0; k < MISSED_TIMING_SUMMON_WORDS_S03.length; k++){
      const w = MISSED_TIMING_SUMMON_WORDS_S03[k][0];
      if(i - w.length >= 0 && text.substr(i - w.length, w.length) === w){ hit = MISSED_TIMING_SUMMON_WORDS_S03[k]; break; }
    }
    if(!hit) break;
    out.push(hit[1]);
    i -= hit[0].length;
    if(i - 1 >= 0 && text.charAt(i - 1) === '・'){ i -= 1; continue; }
    break;
  }
  return out;
}
function missedTimingClausesS03(text){
  const out = [];
  let m;
  MISSED_TIMING_TERM_S03.lastIndex = 0;
  while((m = MISSED_TIMING_TERM_S03.exec(text))){
    const cls = missedTimingWordsBeforeS03(text, m.index);
    if(cls.length) out.push({cls, kind:m[1]});
  }
  return out;
}
function missedTimingTextClausesS03(name){
  if(MISSED_TIMING_TEXT_CACHE_S03.has(name)) return MISSED_TIMING_TEXT_CACHE_S03.get(name);
  let text = '';
  try{
    const i = (typeof findCardIndex === 'function') ? findCardIndex(name) : -1;
    if(i >= 0 && typeof CARD_DB !== 'undefined' && CARD_DB[i]) text = String(CARD_DB[i].e || '');
  }catch(e){ text = ''; }
  const v = missedTimingClausesS03(text);
  MISSED_TIMING_TEXT_CACHE_S03.set(name, v);
  return v;
}
/* cls: 'N' 通常召喚 / 'S' 特殊召喚 / 'F' 反転召喚 / 'R' リバース。'toki' / 'baai' / null を返す。 */
function missedTimingClauseKindS03(name, cls){
  let toki = 0, baai = 0;
  missedTimingTextClausesS03(name).forEach(c=>{
    if(c.cls.indexOf(cls) < 0) return;
    if(c.kind === '時') toki++; else baai++;
  });
  if(baai) return 'baai';
  return toki ? 'toki' : null;
}
/* 監査・テスト用のまとめ。 */
function missedTimingTextKindS03(name){
  return {n:missedTimingClauseKindS03(name,'N'), s:missedTimingClauseKindS03(name,'S'),
          f:missedTimingClauseKindS03(name,'F'), r:missedTimingClauseKindS03(name,'R')};
}

/* (B-3) 種別。エンジンがその候補をどの経路で拾ったか（配線）と、(B-2) の**そのイベントに対応する句**の
   両方を満たすものだけ。
   summonSuccess:      「召喚／特殊召喚／反転召喚に成功した時」が発動条件になっている発動。
     - 召喚されたモンスター自身の召喚誘発（《E・HERO エアーマン》等）
     - 相手の召喚に反応する罠（《落とし穴》《奈落の落とし穴》《激流葬》等、engine/40 の onOtherSummon）
     - 反転召喚も召喚なので、「反転召喚に成功した時」と書かれた誘発は onFlip で拾われてもここに入る
   flipSummonReverse:  **S03-U494 で無効にした。** 「リバースした時」のリバース効果は、当時裁定では
     進行中の処理が終わってから発動し、タイミングを逃さない。
       `WIKI-B2BFD8FD6AFC`（回答日 2011-03-03、《カオス・インフィニティ》）
         「この効果により《素早いビッグハムスター》をリバースした場合、タイミングを逃さず効果を発動できますか？」
         →「はい、このカードの効果処理終了後にリバース効果が発動し…」
         （同じ回答日の `WIKI-7C5A73CB9786` は、同じカードで**攻撃表示にした**場合は逃すと答えている。
           つまりリバース効果だけが別扱いである）
       `WIKI-624AAB0A922F`（回答日 2008-03-06、《ニードル・ボール》）
         「チェーン２以降で発動されたカードの効果によってこのカードがリバースした場合…」
         →「一連の効果処理後、このカードのリバース効果が発動します。」
       `WIKI-8CD28D6D58FD`（回答日 2010-04-13、《裏ガエル》）
         破壊の処理の後にリバース効果が発動する
     S03-U493 はこの種別を有効にしていたが、当時の根拠を確認していなかった。
   ここで落とすのは**この発動だけ**で、通常の優先権・応答機会（召喚成功後の POINT 窓 summonFast /
   getChainResponsesV2）には触らない。一般のクイックエフェクトはチェーン終了後に今までどおり発動できる。
   召喚そのものの無効（《神の宣告》《昇天の角笛》《キックバック》《神の警告》《重力崩壊》《エレキャンセル》
   《ライト・バニッシュ》＝ sc.summonNegate / SUMMON_WINDOW_*、WIKI-2CF23AA42E79、回答日 2011-08-25）は
   召喚成功より前の別タイミングなので、この種別には入らない（下で明示的に外す）。
   S03-U497 でその窓の処理順を実測した（設計書 1-c / (D) / 5-e。**挙動は変えていない**）:
     ・窓を開くのは 5 か所・4 種別（normal / flip / procedure / synchro・xyz）だけで、すべて UI 操作が起点。
       実測した 4 種別はすべて chain 0・procStepS03 0・解決中のリンク無しで開く。
       → **既存の SUMMON_WINDOW_* へこの処理番号の比較を入れても一度も成立しない（死んだコードになる）。**
     ・食い違いは逆向きで、解決中に行われる召喚には窓が 1 つも開かない。チェーン1 の《血の代償》は
       当時できる《神の宣告》等の発動を潰しており、チェーン2 は窓が無いために結果だけ一致している。
     ・チェーン1 とチェーン2 を分ける道具はこの処理番号だった（召喚時→チェーン終了時が 2→2 と 2→5）。
       CHAIN_RESOLVE_TOP は解決前にリンクを外すので、gameState.chain.length では分けられない。
   S03-U498 でその窓を入れた（engine/1ZZY。設計書 (D) の「S03-U498 で入れた形」・5-f）:
     ・入れた場所は processChainEndV30 ではなく遅延イベントの排出（processDrainEventsV27）の先頭。
       召喚成功のイベントを出す直前 ＝ 当時裁定の言う「激流葬・奈落より前」の位置である。
     ・対象は**印の付いた onNormalSummon だけ**（許可リスト。いまは《血の代償》1 件）。
     ・「召喚の後に別の処理があるか」の判定に使うのはこの処理番号で、
       比較は missedTimingDropS03 の R4 と同じ（イベントの stepS03 と現在の procStepS03）。
     ・窓を開く・閉じる Action（SUMMON_WINDOW_* と EVENT_SUMMON_NEG_WINDOW_S03）は
       下の許可リストに入っていないので、窓を通しても召喚成功の応答は逃さない。 */
const MISSED_TIMING_EVENT_CLASS_S03 = {onNormalSummon:'N', onSpecialSummon:'S'};
/* S03-U506: 破壊が条件の誘発（設計書 (F)、5-a 項目 4）。
   土台の当時裁定 `WIKI-378544C74049`（**回答日 2008-05-30**、《砂塵の大竜巻》）:
     「破壊が条件の任意効果はタイミングを逃すことになります。」
   「時」と「場合」で分かれることも当時裁定が明言している
     `WIKI-17DDC86F4023`（**回答日 2009-05-14**、《古代の機械究極巨人》）:
     「『破壊された時』ではなく『破壊された場合』なので、タイミングを逃さず発動します。」
   **配線とテキストを合わせる（R9 と同じ作法）。** onDestroy で拾われた候補は「破壊された時」の句だけを見る。
   「墓地へ送られた時」と書かれたカード（例：《森の番人グリーン・バブーン》）は、配線が onDestroy でも
   句が G なのでここでは落とさない。墓地送りの種別は別単位（S03-U505 の (F) 5 の約束）。
   `onLeaveField` は入れない。S03-U501 / U502 で見たとおり盤面の差分から検出されるルール処理で、別の軸である。 */
const MISSED_TIMING_DESTROY_CLASS_S03 = {onDestroy:'D'};
const MISSED_TIMING_CLASSES_S03 = { summonSuccess: true, flipSummonReverse: false, destroyed: true };
function missedTimingSummonNegatorS03(name){
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[name] : null;
  return !!(sc && sc.summonNegate);
}
function missedTimingClassS03(cand, evt){
  const ev = cand && cand.eventName;
  if(!ev) return null;
  const cls = MISSED_TIMING_EVENT_CLASS_S03[ev];
  if(cls) return (MISSED_TIMING_CLASSES_S03.summonSuccess
                  && missedTimingClauseKindS03(cand.name, cls) === 'toki') ? 'summonSuccess' : null;
  /* S03-U506: 破壊が条件の誘発。落とすのは (B-5) の許可リストに入った組だけ（下の missedTimingDropS03）。 */
  const dcls = MISSED_TIMING_DESTROY_CLASS_S03[ev];
  if(dcls) return (MISSED_TIMING_CLASSES_S03.destroyed
                   && missedTimingClauseKindS03(cand.name, dcls) === 'toki') ? 'destroyed' : null;
  if(ev === 'onFlip' && evt && evt.flipSummon){
    if(MISSED_TIMING_CLASSES_S03.summonSuccess && missedTimingClauseKindS03(cand.name, 'F') === 'toki') return 'summonSuccess';
    if(MISSED_TIMING_CLASSES_S03.flipSummonReverse && missedTimingClauseKindS03(cand.name, 'R') === 'toki') return 'flipSummonReverse';
  }
  return null;
}

/* =========================================================================
   (B-5) 公開範囲の許可リスト（S03-U496）
   -------------------------------------------------------------------------
   ここまでの (B-2)(B-3) は「現行テキストの文言 ＋ 配線」で落とす候補を決めていた。
   S03-U494 / U495 の照合で、その 290 組のうち**当時の根拠で裏付けられているのは一部だけ**だと
   分かった（設計書 3(B-4)）。S03-U496 で、**当時の根拠から該当効果の
     ・任意性（発動しない選択ができる／テキストが「できる」）
     ・発動条件（「〜に成功した時」であること）
     ・例外が無いこと（強制でない・召喚無効でない・調整中でない・R5/R10 の宣言が無い）
   の 3 つを確認できた効果だけ**を落とすようにした。ここに無いものは落とさない ＝
   S03-U491 以前の挙動を維持する（**未対応**であって「逃さないという裁定が確定した」のではない）。

   根拠の取り方は 2 通り（設計書 3(B-5)）。
     basis:'A' … そのカード自身の誘発について、当時裁定が「タイミングを逃す」と答えている。
                 各件、他のカードの話ではないことを読んで確認した（設計書 3(B-5) の表）。
     basis:'B' … 当時裁定がそのカードのページで「〜に成功した時」の句を引用していて（発動条件の裏付け）、
                 当時テキストのその文が「できる」と書いている（任意性）。あとは一般則 R2 が結論を出す。
   `rulings` は docs/S03_MISSED_TIMING_RULINGS.md で引ける ID。

   **効果単位で管理する（条件3）。** 1 つのイベントに複数の効果が配線されているカードでは、
   イベント別の文言だけでは効果別の判定にならない。実測では該当は 1 枚
   （《アルカナフォースIII－THE EMPRESS》の onNormalSummon に coin / heads-summon / tails-discard の
   3 効果）で、この表には入れていない。表に `keys` が無いまま複数効果のイベントに当たった場合は
   **落とさない**（下の missedTimingConfirmedS03）。 */
const MISSED_TIMING_CONFIRMED_S03 = {
  'E・HERO エアーマン': {ev:['onNormalSummon','onSpecialSummon'], basis:'A', rulings:['WIKI-9FC5B41EDCF4']},
  'インフェルニティ・デーモン': {ev:['onSpecialSummon'], basis:'A', rulings:['R1103-ZEROMAX-001']},
  'ブラック・ローズ・ドラゴン': {ev:['onSpecialSummon'], basis:'A', rulings:['R1103-BLACKROSE-001']},
  '奈落の落とし穴': {ev:['onNormalSummon','onSpecialSummon'], basis:'A', rulings:['R1103-ZEROMAX-001','WIKI-755A88381599','WIKI-97539AE7CAEB']},
  '宝玉獣 ルビー・カーバンクル': {ev:['onSpecialSummon'], basis:'A', rulings:['WIKI-5BD9F5131D7A']},
  '氷結界の龍 トリシューラ': {ev:['onSpecialSummon'], basis:'A', rulings:['R1103-TRISHULA-006']},
  '激流葬': {ev:['onNormalSummon','onSpecialSummon','onFlip'], basis:'A', rulings:['WIKI-755A88381599','WIKI-27787161C101','WIKI-C96B7B51137A','WIKI-16EDA76D080F']},
  '真六武衆－カゲキ': {ev:['onNormalSummon'], basis:'A', rulings:['R1103-KAGEKI-002']},
  '神秘の代行者 アース': {ev:['onNormalSummon'], basis:'A', rulings:['R1103-EARTH-003']},
  '落とし穴': {ev:['onNormalSummon','onFlip'], basis:'A', rulings:['WIKI-2B88D7C8D921']},
  /* S03-U506: 破壊が条件の誘発の 1 件目（設計書 (F)）。当時裁定 `WIKI-9E5470176D20`（**回答日 2009-08-07**、
     掲載ページ《おとり人形》）:「チェーン１で《おとり人形》（対象：《スネーク・ホイッスル》）、チェーン２に
     《毒蛇の供物》とした場合、《スネーク・ホイッスル》は発動しますか？」→「タイミングを逃すので発動できず、
     破壊されます。(09/08/07)」 テキストは「…破壊された時…特殊召喚する事ができる」で任意（basis 'A'）。 */
  'スネーク・ホイッスル': {ev:['onDestroy'], basis:'A', rulings:['WIKI-9E5470176D20']},
  'A・ジェネクス・クラッシャー': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-1E460C04E744','WIKI-82BC8592D762','WIKI-061FA82001DA']},
  'BF－孤高のシルバー・ウィンド': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-8D02D567BDEB']},
  'D・ゲイザー': {ev:['onNormalSummon','onSpecialSummon','onFlip'], basis:'B', rulings:['WIKI-89B19EADA7EE']},
  'TG ワーウルフ': {ev:['onSpecialSummon'], basis:'B', rulings:['R1103-WIKI-5FD0B0F1A7EC']},
  'インヴェルズを呼ぶ者': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-417C721F9B8F']},
  'エクシーズエフェクト': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-8E12516F1457']},
  'クローン複製': {ev:['onNormalSummon','onFlip'], basis:'B', rulings:['WIKI-07639B656426']},
  'シャーク・サッカー': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-F65B5B1BE56F']},
  'ジェネクス・ブラスト': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-CAC710BB74BA']},
  'スクラップ・リサイクラー': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-56D271302649','WIKI-6BBA86A8C47A']},
  'スモール・ピース・ゴーレム': {ev:['onNormalSummon','onSpecialSummon','onFlip'], basis:'B', rulings:['WIKI-79A766CB34DA']},
  'タイガードラゴン': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-2DD4383939C4']},
  'ダーク・ヴァージャー': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-3CB8D1670125']},
  'デイブレーカー': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-35B5BBB59999']},
  'デュアル・スコーピオン': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-691198079BD1']},
  'ドラグニティアームズ－ミスティル': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-801BC64C418F']},
  'ドラグニティアームズ－レヴァテイン': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-DCFE72A5C864']},
  'ナイトエンド・ソーサラー': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-BF2E5D26EE20']},
  'ハウリング・ウォリアー': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-84732F017528']},
  'ボーンクラッシャー': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-1D67894EBEFE']},
  'マシンナーズ・ギアフレーム': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-60C6623A51E4']},
  'ミッド・ピース・ゴーレム': {ev:['onNormalSummon','onSpecialSummon','onFlip'], basis:'B', rulings:['WIKI-8B4DE3F47681']},
  'モノケロース': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-28E4311D4D99','WIKI-E157C606DF0C']},
  'レアル・ジェネクス・コーディネイター': {ev:['onNormalSummon','onSpecialSummon'], basis:'B', rulings:['WIKI-CA09F4A979CB']},
  '剣闘獣ガイザレス': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-BF90C54E0677']},
  '呪言の鏡': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-C34C86036BEB']},
  '地獄の暴走召喚': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-9DB8B5C3F65C','WIKI-9ED30FF89FA1']},
  '堕天使スペルビア': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-DF8ADFE063E3']},
  '氷帝メビウス': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-ADB1B7204F9D']},
  '混沌球体': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-CD5D0C7084F2']},
  '超古代恐獣': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-AC20CE005CCC','WIKI-197BDBD53F8A']},
  '連鎖除外': {ev:['onNormalSummon','onSpecialSummon','onFlip'], basis:'B', rulings:['WIKI-1DFDB9272A1C']},
  '黒い旋風': {ev:['onNormalSummon'], basis:'B', rulings:['WIKI-F4FF83E89B73','WIKI-2FB70307151E']},
  '黒光りするG': {ev:['onSpecialSummon'], basis:'B', rulings:['WIKI-842E00439518']},
};
/* その候補がどの v4 効果か。collectHandlers の条件判定で ctx.v4EffectKey が決まっているのでそれを使う。
   決められない場合は null を返し、複数効果のイベントでは落とさない側に倒す。 */
function missedTimingEffectKeyS03(cand){
  const ctx = cand && cand.ctx;
  if(ctx && ctx.v4EffectKey) return ctx.v4EffectKey;
  if(!cand || typeof nativeEffectsV4 !== 'function' || typeof v4SelectEffectForContext !== 'function') return null;
  try{
    const probe = Object.assign({}, ctx || {},
      {eventName:cand.eventName, event:cand.event || (ctx && ctx.event), v4EffectKey:null});
    const e = v4SelectEffectForContext(cand.name, probe);
    return (e && e.key) || null;
  }catch(err){ return null; }
}
function missedTimingEffectCountS03(name, ev){
  if(typeof nativeEffectsV4 !== 'function') return 0;
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[name] : null;
  if(!sc || !sc.v4Unified) return 0;
  let n = 0;
  try{
    (nativeEffectsV4(name) || []).forEach(e=>{
      if(e && Array.isArray(e.events) && e.events.indexOf(ev) >= 0) n++;
    });
  }catch(err){ return 0; }
  return n;
}
function missedTimingConfirmedS03(cand, evt){
  const d = cand ? MISSED_TIMING_CONFIRMED_S03[cand.name] : null;
  if(!d) return false;
  const ev = cand.eventName;
  if(!ev || d.ev.indexOf(ev) < 0) return false;
  /* 効果単位。イベントに複数の効果があるなら、表が効果を名指ししていて、
     かつその候補の効果がそれに一致したときだけ落とす。 */
  if(missedTimingEffectCountS03(cand.name, ev) > 1){
    const keys = d.keys && d.keys[ev];
    if(!keys || !keys.length) return false;
    const key = missedTimingEffectKeyS03(cand);
    if(!key || keys.indexOf(key) < 0) return false;
  }
  return true;
}

/* 診断用。digest にも保存にも入れない（collectHandlers は盤面を変えてはいけないため gameState には書かない）。 */
let MISSED_TIMING_DROPS_S03 = [];
function resetMissedTimingDropsS03(){ MISSED_TIMING_DROPS_S03 = []; }

/* =========================================================================
   (C) 判定
   ========================================================================= */
function missedTimingDropS03(cand, evt){
  if(!cand || !evt) return false;
  /* 刻みの無いイベント（emitEvent の直接呼び出しなど）と、古い保存データは判定しない */
  if(evt.stepS03 == null) return false;
  /* R4: 条件が満たされた処理のままなら、まだ「最後に行われた処理」である */
  if(((typeof gameState !== 'undefined' && gameState ? gameState.procStepS03 : 0) | 0) === (evt.stepS03 | 0)) return false;
  /* R5: 明示的な例外カードは逃さない */
  const mode = missedTimingModeS03(cand.name);
  if(mode === 'never') return false;
  /* R1: 強制誘発は逃さない */
  if(typeof triggerCandidateForcedS03 === 'function' && triggerCandidateForcedS03(cand)) return false;
  /* 召喚無効は召喚成功より前の別タイミング（本機構の対象外） */
  if(missedTimingSummonNegatorS03(cand.name)) return false;
  /* 宣言で明示的に逃すとしたカードは種別も許可リストも問わない（いまは 0 件） */
  if(mode === 'miss') return true;
  /* S03-U496: 当時の根拠で確認できた（カード, イベント, 効果）だけを落とす。
     許可リストに無いものは落とさない ＝ S03-U491 以前の挙動（未対応） */
  if(!missedTimingConfirmedS03(cand, evt)) return false;
  /* R2 / R7: 配線と文言の両方を満たす発動だけを落とす */
  return !!missedTimingClassS03(cand, evt);
}
function filterMissedTimingS03(cands, evt){
  if(!Array.isArray(cands) || !cands.length) return cands;
  const kept = [];
  cands.forEach(c=>{
    if(missedTimingDropS03(c, evt)){
      MISSED_TIMING_DROPS_S03.push({name:c.name, p:c.p, eventName:c.eventName,
        stepS03:evt.stepS03, nowS03:(typeof gameState!=='undefined'&&gameState)?(gameState.procStepS03|0):0});
      return;
    }
    kept.push(c);
  });
  return kept;
}
