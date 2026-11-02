/* S03-U498: 解決中に行われた通常召喚に対する「召喚そのものの無効」の窓。
   設計は docs/S03_MISSED_TIMING_DESIGN.md の (D)（S03-U497 で処理順を実測して確定した）。
   当時裁定 WIKI-2CF23AA42E79（**回答日 2011-08-25**、掲載ページ《血の代償》。本文は
   docs/S03_MISSED_TIMING_RULINGS.md の S03-U497 節）:
     「この効果による通常召喚に対し《神の宣告》や《キックバック》・《昇天の角笛》などの召喚を無効にする
       カードを発動できますか？」
     →「チェーン１で行われているならば、発動可能です。
        チェーン２以上で行われ、召喚の後に別の処理がある場合はタイミングを逃す事になり発動できません。」

   S03-U497 で実測した事実の上に立っている:
     ・既存の SUMMON_WINDOW_*（normal / flip / procedure / synchro・xyz の 5 か所）はすべて UI 操作が起点で、
       chain 0・procStepS03 0 で開く。だからそこへ処理番号の比較を入れても一度も成立しない（死んだコード）。
     ・食い違いは逆向きで、**解決中に行われる召喚には窓が 1 つも開かない**。チェーン1 の《血の代償》は
       当時できる《神の宣告》等の発動を潰していた。チェーン2 は窓が無いために結果だけ一致していた。
     ・チェーン1 とチェーン2 を分ける道具は (A) の処理番号（engine/1ZZX）。召喚時→チェーン終了時が 2→2 と 2→5。

   この単位の作り（設計 (D) の案 (b)）:
     1. 召喚は解決中にそのまま行う（公開済みの経路を動かさない）。窓を開ける対象は、その召喚が積んだ
        onNormalSummon に**呼び出し元が印を付けたものだけ**にする（許可リスト。印の無い召喚は従来どおり
        窓が開かない ＝ 列挙の漏れは「何もしない」側に落ちる）。
     2. 窓は遅延イベントの排出（processDrainEventsV27）で、その召喚成功のイベントを出す**前**に開く。
        ここが「召喚成功より前・激流葬や奈落より前」の位置で、チェーン終了時の CHAIN_AFTER_V2 や
        eventChainResumeV11 の続きを飛ばさずに済む唯一の位置である。
     3. 「召喚の後に別の処理がある場合」は (A) の番号で判定する。印に刻まれた番号（召喚した時点）と
        排出時点の番号が同じなら窓を開き、違えば開かない（＝従来挙動。タイミングを逃す）。
        R4 と同じ比較で、missedTimingDropS03（engine/1ZZX）が召喚成功の応答に使っているものと同じ。
     4. 無効になったときは、積んである召喚成功のイベントを落とし、モンスターを場から取り除く。
        **近似**である（召喚から窓までの間だけ永続効果が適用される）。設計 (D) に記録してある。
        取り除きは MOVE（既存の kind 'normal' の取り消しと同じ作法）で、破壊でも「フィールドから墓地へ」でもない:
        召喚は成立していないので「破壊された時」「フィールドから離れた時」は発動しない。

   窓を開く・閉じる Action（SUMMON_WINDOW_* と EVENT_SUMMON_NEG_WINDOW_S03）は (A) の許可リストに無いので
   処理番号を進めない。だから窓を通した後も召喚成功の応答（《奈落の落とし穴》等）は従来どおり逃さない。 */

/* 窓を開ける対象として印が付いた遅延イベントか。印は呼び出し元（カードスクリプト）が付ける。 */
function summonNegWindowItemS03(it){
  return !!(it && it.eventName === 'onNormalSummon' && it.evt
            && it.evt.summonNegWindowS03 === true && it.evt.uid != null);
}
/* これから処理する組（leaveBatchRunS03 がまとめた分）の中の対象を返す。
   番号が動いていれば「召喚の後に別の処理がある」ので null（従来挙動）。 */
function summonNegWindowDueS03(q, n){
  if(!Array.isArray(q) || !q.length) return null;
  const now = (typeof gameState !== 'undefined' && gameState) ? (gameState.procStepS03 | 0) : 0;
  const len = Math.max(1, Math.min(n | 0 || 1, q.length));
  for(let i = 0; i < len; i++){
    if(!summonNegWindowItemS03(q[i])) continue;
    return ((q[i].evt.stepS03 | 0) === now) ? q[i] : null;
  }
  return null;
}
/* 窓を開いたら true。processDrainEventsV27 はそのとき PROC_V27_WAIT で止まる。 */
function summonNegWindowOpenS03(q, n){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return false;
  if(!gameState || gameState.pendingSummon || gameState.pendingChoice) return false;
  if((gameState.chain || []).length) return false;
  if(typeof ADS_CHAIN_MODE !== 'undefined' && typeof ADS_CHAIN_MODES !== 'undefined'
     && ADS_CHAIN_MODE === ADS_CHAIN_MODES.IGNORE) return false;
  const it = summonNegWindowDueS03(q, n);
  if(!it) return false;
  const hit = findCardByUid(it.evt.uid);
  if(!hit || hit.zone !== 'mz') return false;                       /* 召喚したモンスターがもう場に無い */
  const pending = {player:it.evt.player, name:it.evt.name || cardName(hit.card), kind:'normal',
    label:'通常召喚', uid:it.evt.uid, resolvedSummonS03:true,
    commit:'__pendingSummonCommit', cancel:'__pendingSummonCancel',
    resumeS03:{uid:it.evt.uid, resolvedS03:true}};
  /* 候補の有無を先に見る。召喚無効のカードがどちらの場にも無ければ、Action を 1 つも残さずに帰る
     （公開済みの経路の圧倒的な多数はここで終わる ＝ Journal も digest も変わらない）。 */
  if(!summonNegWindowAnyCandidateS03()) return false;
  /* ここからは既存の beginSummonWindowV2 と同じ順にする。候補の列挙は pendingSummon が
     立っていることが前提である（実測：《神の宣告》の condition は pendingSummon が無いと
     「召喚、または魔法・置カードの発動に対して発動します」で弾く）。
     発動できるものが 1 つもなければその場で閉じ、排出をそのまま続ける（従来挙動）。 */
  commitAutomaticActionV44({type:'EVENT_SUMMON_NEG_WINDOW_S03', op:'offered', uid:pending.uid});
  commitAutomaticActionV44({type:'SUMMON_WINDOW_OPEN_V42', pending});
  const list = summonNegatorsV2(gameState.pendingSummon || pending);
  if(!list.length){ commitAutomaticActionV44({type:'SUMMON_WINDOW_CLOSE_V42', result:'commit'}); return false; }
  showSummonWindowSheetV2(pending, list);
  return true;
}
/* 召喚無効を持つカードがどちらかの場にあるかだけを見る軽い前検査。
   盤面を変えないし、共有使用（S03-U46 の sharedUseSummonNegatorsS03）を見落とさないように両方の場を数える。 */
function summonNegWindowAnyCandidateS03(){
  const hasNeg = c=>{
    if(!c) return false;
    const db = (typeof dbOf==='function') ? dbOf(c) : null, sc = db ? CARD_SCRIPTS[db.n] : null;
    return !!(sc && sc.summonNegate);
  };
  for(let p = 0; p < 2; p++){
    const P = gameState.players[p]; if(!P) continue;
    if((P.sz || []).some(hasNeg)) return true;
    if((P.mz || []).some(hasNeg)) return true;
  }
  return false;
}
/* 窓が閉じた後の続き（engine/40 の runSummonWindowResumeS03 から、resumeS03.resolvedS03 の時だけ）。 */
function summonNegWindowResumeS03(ps, result){
  const uid = ps && ps.resumeS03 && ps.resumeS03.uid;
  if(uid == null) return false;
  if(result !== 'commit'){
    act({type:'EVENT_SUMMON_NEG_WINDOW_S03', op:'drop', uid});
    const hit = findCardByUid(uid);
    if(hit && hit.zone === 'mz'){
      /* S03-U277: 「召喚を無効にし、そのモンスターを持ち主の手札に戻す」（キックバック） */
      if(ps.negateToHandS03) act({type:'FX_BOUNCE', player:hit.p, zone:hit.zone, index:hit.index, reason:'召喚を無効にし手札に戻す'});
      else act({type:'MOVE', player:hit.p, from:hit.zone, fromIndex:hit.index, to:'grave'});
    }
  }
  summonNegWindowProcessorResumeS03();
  return true;
}
/* 窓のために止めた遅延イベントの排出を続ける。続きの DRAIN_EVENTS は窓を開く前に積んである。 */
function summonNegWindowProcessorResumeS03(){
  const w = gameState && gameState.processorWaiting;
  if(!(gameState.processorPaused && w && w.type === PROCESSOR_V27.DRAIN_EVENTS)) return false;
  processorResumeV27();
  pumpProcessorV27();   /* processorResumeV27 の setTimeout だけに任せず、他の窓と同じく同期的に続ける */
  return true;
}
