/* S03-U491 / S03-U492: 「タイミングを逃す」の共通機構。設計と当時裁定の根拠は docs/S03_MISSED_TIMING_DESIGN.md
   （裁定の抽出は docs/S03_MISSED_TIMING_RULINGS.md、123 件）。

   当時裁定から読み取れる規則:
     R1 強制誘発は逃さない（手段を問わない）              — 《D・バリア》09/09/27 ほか
     R2 任意誘発（「〜した時…できる」）は、条件が満たされた後に別の処理があると逃す — 《光神テテュス》08/05/29 ほか
     R3 チェーン2以上で条件が満たされ、残りのリンクの解決が続く場合は逃す — 《落とし穴》（WIKI-2B88D7C8D921、回答日なし）
     R4 判定軸は「最後に行われた処理か」。同時に行われた処理は互いを逃させない — 《魔轟神獣ノズチ》09/10/13 ほか
     R5 例外カードは任意でも逃さない                      — 《ダーク・スプロケッター》08/04/19 ほか
     R6 当時「調整中」のものがある                        — 《カオスポッド》11/08/03（RULING_UNRESOLVED）

   機構は 3 つ:
     (A) gameState.procStepS03 — 「行われた処理」の通し番号。
     (B) 判定の対象 — 宣言（カードごと）と、構造で決まる種別（いまは「召喚成功を条件とする発動」1 種）。
     (C) filterMissedTimingS03 — 判定は collectHandlers（engine/40）の 1 箇所だけで行う。

   S03-U492 で (A) を作り直した。S03-U491 は「帳簿の Action を列挙して除外し、それ以外で番号を進める」
   拒否リストだったが、これは**列挙の漏れが「誤って逃す」側に落ちる**（進めてしまう → 刻みと現在値が
   食い違う → 誘発が落ちる）。実測でその欠陥が出た: 《血の代償》がチェーン1で通常召喚した場合
   （当時裁定では《落とし穴》を発動できる）でも、召喚と遅延イベントの取り出しの間に
   SPECIAL_WIN_DEFER_S03 が 1 回走り、番号が 3 → 4 とずれていた。
   そこで許可リストに反転した。**表に無い Action は番号を進めない ＝ 逃さない ＝ 現状維持**なので、
   漏れは安全な側に落ちる。さらに「適用が例外で終わった」「何も起きなかった」場合も進めない。 */

/* (A-1) 「処理」として数える Action。値が関数ならその Action に対して真を返したときだけ数える。
   ここに無い Action は番号を進めない（＝逃さない）。迷ったものは入れない。
   除いてあるもののうち、意図を明記しておくべきもの:
     - CHAIN_* / CHOICE_* / EVENT_* / PREP_TX_* / SUMMON_WINDOW_* … チェーンの積み下ろし・選択の提示・
       遅延イベントの出入り・発動準備。処理ではない
     - SPECIAL_WIN_DEFER_S03 / CHECK_DECKOUT / DUEL_LOSER_S03 … 勝敗の確認
     - SET_PHASE / SET_PRIORITY / PASS_TURN / PHASE_SKIP_V7 … 進行
     - V4_EFFECT_* / SCHEDULE_* / LINGER_ADD_S03 / EFFECT_COUNT_CONSUME_V44 … 登録と計上
     - MOD_CLEAR / COUNTER_CLEAR / LINK_CLEAR_V9 / PROT_CLEAR_V21 … 掃除
     - ATTACK_DECLARE_V48 … 攻撃宣言は処理ではない（ダメージ計算の ATTACK は数える）
     - SHUFFLE / DECK_ORDER_V20 / FACEDOWN_SHUFFLE_V20 … 同じ効果の処理の一部として走ることが多く、
       これを別の処理と数えると誤って逃させる
     - FX_SET_STATE の「表にする」… セット状態のカードを発動する時の表返し（engine/1X）。
       発動は処理ではないので数えない。裏にする／反転召喚だけ数える */
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
  /* 盤面の状態 */
  ['FLIP', true], ['TOGGLE_POS', true],
  ['FX_SET_STATE', a => a.face === 'down' || a.flipSummon === true],
  ['FX_CONTROL', true], ['CONTROL_SWAP_V26', true], ['CONTROL_RETURN', true], ['CONTROL_RETURN_ONE_V26', true],
  ['FX_NEGATE', true], ['NEGATE_CARD_V13', true], ['NEGATE_ATTACK_V45', true],
  /* 数値とカウンター */
  ['LP', true], ['DRAW', true], ['MOD_ADD', true], ['MOD_SET', true], ['STAT_MOD_V14', true],
  ['LEVEL_MOD_V16', true], ['CHAR_MOD_V17', true],
  ['COUNTER_ADD', true], ['COUNTER_REMOVE', true], ['COUNTER_SPREAD_PLACE_V22', true], ['COUNTER_SPREAD_REMOVE_V22', true],
  /* 戦闘 */
  ['ATTACK', true], ['BATTLE_CLEANUP', true],
]);
function missedTimingIsProcessingS03(a){
  if(!a || !a.type) return false;
  const v = MISSED_TIMING_PROCESSING_S03.get(a.type);
  if(v === true) return true;
  if(typeof v === 'function'){ try{ return !!v(a); }catch(e){ return false; } }
  return false;
}

/* (A-2) 「本当に何か起きたか」の印。次のどれかがあれば起きたものとする。
     1. 盤面の署名（各ゾーンの枚数とライフ）が変わった
     2. 条件が満たされた遅延イベントが積まれた
     3. logIt が書かれた（ただし下の「断りをログに書く」Action は除く）
   どれも無ければ空振り（対象がもう場に無い、ゾーンが一杯、セットが禁止されている等）なので番号を進めない。
   署名も回数も**差分だけ**を見るので状態には入れず、保存・digest にも出ない。

   3 の除外が必要な理由: 許可リストの一部の reducer は「適用できなかった理由」をログに書いて
   何もせずに終わる（`モンスターゾーンが一杯です` 等）。その場合もログは 1 行増えるので、
   ログだけを印にすると**空振りを処理と数えてしまい、誤って逃させる**。
   これらは成功時に必ずカードかライフが動くので、署名（1）だけで足りる。
   この一覧は engine のソースから機械的に監査している（tools/test_s03_u492_missed_timing_summon_success.js の A）。 */
const MISSED_TIMING_REFUSAL_LOG_S03 = new Set([
  'NORMAL_SUMMON', 'SET_MONSTER', 'SET_ST', 'TOKEN_CREATE',
  'FX_SPECIAL_SUMMON', 'FX_EX_SUMMON', 'FX_RITUAL_SUMMON',
  'FX_OVERLAY', 'FX_DETACH', 'FX_MONSTER_EQUIP_V46',
]);
/* 盤面の署名。枚数とライフだけの軽い値で、1 回の applyAction の前後でしか比べない。 */
function missedTimingSigS03(gs){
  let n = 0;
  if(!gs || !gs.players) return n;
  for(let p = 0; p < 2; p++){
    const P = gs.players[p];
    if(!P) continue;
    ['mz','sz','hand','grave','banish','deck','ex'].forEach(k=>{ n = (n * 31 + ((P[k] && P[k].length) | 0)) | 0; });
    n = (n * 31 + (P.field ? 1 : 0)) | 0;
    n = (n * 31 + (P.lp | 0)) | 0;
  }
  return n;
}
let MISSED_TIMING_LOGS_S03 = 0;
let MISSED_TIMING_QUEUED_S03 = 0;
let MISSED_TIMING_FLIGHT_S03 = null;
function noteMissedTimingLogS03(){ MISSED_TIMING_LOGS_S03++; }
function noteMissedTimingQueueS03(){ MISSED_TIMING_QUEUED_S03++; }

/* 最上位の applyAction から呼ぶ（engine/00）。Journal 再生でも同じ Action 列・同じ reducer を通るので同じ値に再構成される。 */
function missedTimingBeginS03(gs, a){
  if(!gs || !missedTimingIsProcessingS03(a)) return null;
  const f = {logs:MISSED_TIMING_LOGS_S03, queued:MISSED_TIMING_QUEUED_S03, sig:missedTimingSigS03(gs),
             logsCount:!MISSED_TIMING_REFUSAL_LOG_S03.has(a.type), prev:MISSED_TIMING_FLIGHT_S03};
  MISSED_TIMING_FLIGHT_S03 = f;
  return f;
}
function missedTimingEndS03(gs, f, applied){
  if(!f) return;
  MISSED_TIMING_FLIGHT_S03 = f.prev || null;
  if(!applied) return;                                                        /* 適用が例外で終わった */
  const happened = missedTimingSigS03(gs) !== f.sig
    || MISSED_TIMING_QUEUED_S03 !== f.queued
    || (f.logsCount && MISSED_TIMING_LOGS_S03 !== f.logs);
  if(!happened) return;                                                       /* 空振り */
  gs.procStepS03 = (gs.procStepS03 | 0) + 1;
}
/* 遅延イベントに刻む番号。処理の最中に積まれたイベントは、その処理が数え上げられた後の番号を持つ
   （その処理が空振りに終われば番号は増えないが、イベントを積んだこと自体が「起きた」印なので増える）。 */
function missedTimingStampS03(gs){
  return (((gs && gs.procStepS03) | 0) + (MISSED_TIMING_FLIGHT_S03 ? 1 : 0));
}

/* (B-1) カードごとの宣言。'miss' = 時の任意効果としてタイミングを逃す、'never' = 逃さない（R5 の例外カード）。
   宣言の無いカードは下の種別だけで決まる。各件に当時裁定の ID を必ず添える。
   カードテキストからの自動推定は行わない（DB のテキストは時代が混在しており、推定の誤りが静かに対局を変える）。 */
const MISSED_TIMING_DECL_S03 = {
  /* 例: '血の代償': {mode:'never', ruling:'...'} — 《血の代償》自身は誘発効果ではないので宣言しない */
};
function missedTimingModeS03(name){
  const d = MISSED_TIMING_DECL_S03[name];
  return (d && d.mode) || null;
}

/* (B-2) 構造で決まる種別。カードのテキストではなく、エンジンがその候補をどの経路で拾ったかで決める。
   summonSuccess: 「召喚・反転召喚・特殊召喚に成功した時」が発動条件になっている発動。
     - 召喚されたモンスター自身の召喚誘発（《E・HERO エアーマン》等）
     - 相手の召喚に反応する罠（《落とし穴》《奈落の落とし穴》《激流葬》等、engine/40 の onOtherSummon）
     どちらも collectHandlers が召喚成功のイベントで拾った候補なので、
     「召喚成功を条件とする発動」であることがエンジンの配線から確定する。
   ここで落とすのは**この発動だけ**で、通常の優先権・応答機会（召喚成功後の POINT 窓 summonFast /
   getChainResponsesV2）には触らない。一般のクイックエフェクトはチェーン終了後に今までどおり発動できる。
   召喚そのものの無効（《神の宣告》《昇天の角笛》《キックバック》＝ SUMMON_WINDOW_*、WIKI-2CF23AA42E79、
   回答日 2011-08-25）は召喚成功より前の別タイミングなので、この種別には入らない。 */
const MISSED_TIMING_CLASSES_S03 = { summonSuccess: true };
function missedTimingSummonSuccessS03(cand, evt){
  const ev = cand && cand.eventName;
  if(ev === 'onNormalSummon' || ev === 'onSpecialSummon') return true;
  /* 反転召喚の成功だけ。単にリバースしただけ（《月の書》等）は召喚ではない */
  if(ev === 'onFlip') return !!(evt && evt.flipSummon);
  return false;
}
function missedTimingClassS03(cand, evt){
  if(MISSED_TIMING_CLASSES_S03.summonSuccess && missedTimingSummonSuccessS03(cand, evt)) return 'summonSuccess';
  return null;
}

/* 診断用。digest にも保存にも入れない（collectHandlers は盤面を変えてはいけないため gameState には書かない）。 */
let MISSED_TIMING_DROPS_S03 = [];
function resetMissedTimingDropsS03(){ MISSED_TIMING_DROPS_S03 = []; }

/* (C) 誘発候補 1 件が、タイミングを逃しているか。 */
function missedTimingDropS03(cand, evt){
  if(!cand || !evt) return false;
  /* 刻みの無いイベント（emitEvent の直接呼び出しなど）と、古い保存データは判定しない */
  if(evt.stepS03 == null) return false;
  /* R4: 条件が満たされた処理のままなら、まだ「最後に行われた処理」である */
  if(((typeof gameState !== 'undefined' && gameState ? gameState.procStepS03 : 0) | 0) === (evt.stepS03 | 0)) return false;
  /* R5: 明示的な例外カードは逃さない */
  const mode = missedTimingModeS03(cand.name);
  if(mode === 'never') return false;
  /* R2: 宣言されたカード、または種別に当てはまる発動だけを判定する */
  if(mode !== 'miss' && !missedTimingClassS03(cand, evt)) return false;
  /* R1: 強制誘発は逃さない */
  if(typeof triggerCandidateForcedS03 === 'function' && triggerCandidateForcedS03(cand)) return false;
  return true;
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
