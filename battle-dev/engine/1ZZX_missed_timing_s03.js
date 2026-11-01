/* S03-U491 / S03-U492 / S03-U493: 「タイミングを逃す」の共通機構。
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

   機構は 3 つ:
     (A) gameState.procStepS03 — 「行われた処理」の通し番号。
     (B) 判定の対象 — 宣言（カードごと）と、配線と文言の両方で決まる種別。
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
         → 種別に当時テキストの「時」／「場合」の判定を足し、肯定的に「時」と読めるものだけを落とす。 */

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
     - SHUFFLE / DECK_ORDER_V20 / FACEDOWN_SHUFFLE_V20 … ルール上の行為。
       《連鎖除外》WIKI-3178D0C2D874（10/07/03）「シャッフルは効果処理に含まれません」
     - SS_POS_S03 … 特殊召喚の表示形式の選択（召喚そのものの一部） */
const MISSED_TIMING_PROCESSING_S03 = new Map([
  /* 召喚 */
  ['NORMAL_SUMMON', true], ['FX_SPECIAL_SUMMON', true], ['FX_EX_SUMMON', true], ['EX_SUMMON_COMMIT_V42', true],
  ['FX_RITUAL_SUMMON', true], ['GEMINI_SUMMON_S03', true], ['TOKEN_CREATE', true], ['SET_MONSTER', true], ['SET_ST', true],
  /* カードの移動・除去 */
  ['MOVE', true], ['FX_TO_GRAVE', true], ['FX_SELF_TO_GRAVE', true], ['FX_BANISH', true], ['FX_DESTROY_BANISH', true],
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

/* (B-1) カードごとの宣言。'miss' = タイミングを逃す、'never' = 逃さない（R5 の例外カード）。
   宣言の無いカードは下の種別だけで決まる。各件に当時裁定の ID を必ず添える。
   当時裁定 123 件と候補 518 件を照合した範囲では、召喚成功を条件とする発動の個別例外（R5）は見つかっていない。
   《ダーク・スプロケッター》08/04/19・《ファラオの化身》09/05/15・《アーケイン・ファイロ》08/11/21 の
   3 件はいずれも墓地送りを条件とする誘発で、召喚成功の候補には入っていない（S03-U493 で全件照合）。 */
const MISSED_TIMING_DECL_S03 = {
  /* 例: 'カード名': {mode:'never', ruling:'WIKI-...'} */
};
function missedTimingModeS03(name){
  const d = MISSED_TIMING_DECL_S03[name];
  return (d && d.mode) || null;
}

/* (B-2) 当時テキストの「時」と「場合」。R7 の判定。
   「〜に成功した時」「〜された時」「〜した時」＝ 時（逃す）、「〜した場合」＝ 場合（逃さない）。
   1 枚のテキストに両方あれば（効果が複数ある等）曖昧なので**逃さない**側に寄せる。
   文言が読み取れないものも逃さない。これは S03-U491 以前の挙動と同じなので、読み落としは安全な側に落ちる。

   テキストからの判定を使う理由と限界:
     - S03-U492 は「配線だけで決める（テキストは使わない）」としていたが、S03-U493 で候補 518 件を
       全件監査したところ、配線だけでは「場合」15 件・文言の無いもの 3 件・リバース効果 28 件を
       誤って落としていた。「時」「場合」の区別は当時裁定そのものの判定軸なので、文言を見ないと分けられない。
     - data/carddata.json のテキストは現行表記のものが混ざっている（①: 表記）。
       2011-11 以降のテキスト改訂は「時」→「場合」の方向が多いため、食い違いは
       「当時は時 → 現行は場合 → 逃さない（安全な側）」に落ちやすい。
       逆向き（当時は場合 → 現行は時）は誤って逃させるので、見つかれば上の宣言表で上書きする。
     - 監査の内訳はテストで件数ごと固定してあるので、テキストが変われば必ずゲートに出る。 */
const MISSED_TIMING_SUMMON_CLAUSE_S03 =
  /(?:召喚|反転召喚|特殊召喚|融合召喚|儀式召喚|シンクロ召喚|エクシーズ召喚)(?:・(?:召喚|反転召喚|特殊召喚|融合召喚|儀式召喚|シンクロ召喚|エクシーズ召喚))*(?:に成功した|された|した)(時|場合)/g;
const MISSED_TIMING_FLIP_CLAUSE_S03 = /リバースした(時|場合)/g;
const MISSED_TIMING_TEXT_CACHE_S03 = new Map();
function missedTimingClauseKindS03(text, re){
  let toki = 0, baai = 0, m;
  re.lastIndex = 0;
  while((m = re.exec(text))){ if(m[1] === '時') toki++; else baai++; }
  if(baai) return 'baai';
  return toki ? 'toki' : null;
}
function missedTimingTextKindS03(name){
  if(MISSED_TIMING_TEXT_CACHE_S03.has(name)) return MISSED_TIMING_TEXT_CACHE_S03.get(name);
  let text = '';
  try{
    const i = (typeof findCardIndex === 'function') ? findCardIndex(name) : -1;
    if(i >= 0 && typeof CARD_DB !== 'undefined' && CARD_DB[i]) text = String(CARD_DB[i].e || '');
  }catch(e){ text = ''; }
  const v = {summon: missedTimingClauseKindS03(text, MISSED_TIMING_SUMMON_CLAUSE_S03),
             flip:   missedTimingClauseKindS03(text, MISSED_TIMING_FLIP_CLAUSE_S03)};
  MISSED_TIMING_TEXT_CACHE_S03.set(name, v);
  return v;
}

/* (B-3) 種別。エンジンがその候補をどの経路で拾ったか（配線）と、上の文言の両方を満たすものだけ。
   summonSuccess:      「召喚・特殊召喚に成功した時」が発動条件になっている発動。
     - 召喚されたモンスター自身の召喚誘発（《E・HERO エアーマン》等）
     - 相手の召喚に反応する罠（《落とし穴》《奈落の落とし穴》《激流葬》等、engine/40 の onOtherSummon）
   flipSummonReverse:  反転召喚で条件が満たされた「リバースした時」の発動。
     リバース効果の条件は「リバースした時」で、反転召喚に限らない。ここで見るのは
     反転召喚（evt.flipSummon）で満たされた場合だけで、効果で表側にされた場合は未対応。
   ここで落とすのは**この発動だけ**で、通常の優先権・応答機会（召喚成功後の POINT 窓 summonFast /
   getChainResponsesV2）には触らない。一般のクイックエフェクトはチェーン終了後に今までどおり発動できる。
   召喚そのものの無効（《神の宣告》《昇天の角笛》《キックバック》《神の警告》《重力崩壊》《エレキャンセル》
   《ライト・バニッシュ》＝ sc.summonNegate / SUMMON_WINDOW_*、WIKI-2CF23AA42E79、回答日 2011-08-25）は
   召喚成功より前の別タイミングなので、この種別には入らない（下で明示的に外す）。 */
const MISSED_TIMING_CLASSES_S03 = { summonSuccess: true, flipSummonReverse: true };
function missedTimingSummonNegatorS03(name){
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[name] : null;
  return !!(sc && sc.summonNegate);
}
function missedTimingClassS03(cand, evt){
  const ev = cand && cand.eventName;
  if(!ev) return null;
  const kind = missedTimingTextKindS03(cand.name);
  if(MISSED_TIMING_CLASSES_S03.summonSuccess && (ev === 'onNormalSummon' || ev === 'onSpecialSummon'))
    return kind.summon === 'toki' ? 'summonSuccess' : null;
  if(ev === 'onFlip' && evt && evt.flipSummon){
    /* 反転召喛も召喛なので、「反転召喛に成功した時」と書かれた誘発（《スカラベの大群》等）は
       onFlip で拾われても summonSuccess として扱う。「リバースした時」だけのリバース効果は別種別。 */
    if(MISSED_TIMING_CLASSES_S03.summonSuccess && kind.summon === 'toki') return 'summonSuccess';
    if(MISSED_TIMING_CLASSES_S03.flipSummonReverse && kind.flip === 'toki') return 'flipSummonReverse';
    return null;
  }
  return null;
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
  /* R2 / R7: 宣言されたカード、または配線と文言の両方を満たす発動だけを落とす */
  if(mode === 'miss') return true;
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
