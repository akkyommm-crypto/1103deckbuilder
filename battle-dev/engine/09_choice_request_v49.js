/* =========================================================================
   System v4.9.0 — P1: ChoiceRequest / ChoiceAnswer
   -------------------------------------------------------------------------
   「解決時にプレイヤーが選ぶ」を Replay/Undo/Save 安全な一級市民にする。

   従来の問題:
     選択機構が PICK_ITEMS / TG_RESOLVE / FORCE_CB / CFM_YES / EVT_CANDS /
     REVEAL_ITEMS / DS_CANDS / PENDING_SUMMON_COMMIT と8系統に分裂し、
     いずれも「解決の続き」を関数クロージャとしてモジュールグローバルに置いていた。
     gameState の外に解決途中が存在するため、
       - 選択待ち中の Undo で盤面だけ巻き戻りクロージャが取り残される
       - 選択待ち中のオートセーブで解決が消える
       - 盤面差分の出ない選択（モード選択・任意効果の辞退）が Journal に残らず
         Replay が静かに分岐する
     という不具合があった。

   本プリミティブの原則:
     1. pendingChoice は完全に JSON 直列化可能。関数・DOM参照を一切持たない。
     2. 「解決の続き」は resumeToken（handler名 + JSON引数）で表現する。
        振る舞いはコード側のレジストリに置く。runtimeEffects と同じ設計。
     3. 回答は CHOICE_ANSWER_V49 Action として act() を通り Journal に載る。
     4. applyAction は純粋な状態遷移のまま保つ。継続の実行は applyAction の
        外（answerChoiceV49）で行う。Replay は記録済み Action を順に適用する
        だけなので継続を再実行してはならない（二重適用になる）。

   legacy 経路について:
     既存 API.selectCard(title,cands,onPick) の onPick はクロージャであり
     レジストリ化できない。互換のため残すが legacy として明示し、
     「P1移行済み（replay-safe）」には数えない。
     legacy 選択は保存・リロードを跨げないため、継続が失われた場合は
     状態を壊さず安全に中止する。
   ========================================================================= */

/* ---- 継続レジストリ（コード側。gameStateには入れない） ---------------- */
const CHOICE_HANDLERS_V49 = {};

/* handler: function(answer, args, ctx)
     answer = {keys:[...], cards:[{p,zone,index,uid,card}], cancelled:bool}
     args   = CHOICE_OPEN_V49 に載せた JSON 引数
   登録名は Replay を跨いで安定していなければならない。 */
function registerChoiceHandlerV49(name, fn){
  if(typeof name!=='string' || !name) throw new Error('registerChoiceHandlerV49: name required');
  if(typeof fn!=='function') throw new Error('registerChoiceHandlerV49: fn required');
  CHOICE_HANDLERS_V49[name]=fn;
  return name;
}

/* ---- legacy コールバック退避表（gameStateには入れない） ---------------
   cid をキーにする。保存・リロードは跨げない（＝legacyの限界）。

   寿命の注意: 回答時に即削除してはいけない。
   Undo で「選択待ちの状態」へ戻れるため、そのとき継続が必要になる。
   新しい選択を開くときに cid 以降を掃除し、上限で古い分を落とす。 */
let CHOICE_LEGACY_CB_V49 = new Map();
const CHOICE_LEGACY_CB_MAX_V49 = 16;
function pruneChoiceLegacyV49(newCid){
  /* Undo後に新しい選択を開いたら、未来側の退避は無効なので捨てる */
  for(const k of Array.from(CHOICE_LEGACY_CB_V49.keys())){ if(k>=newCid) CHOICE_LEGACY_CB_V49.delete(k); }
  while(CHOICE_LEGACY_CB_V49.size > CHOICE_LEGACY_CB_MAX_V49){
    const oldest=Math.min.apply(null, Array.from(CHOICE_LEGACY_CB_V49.keys()));
    CHOICE_LEGACY_CB_V49.delete(oldest);
  }
}

/* S03-U471: 「候補が足りず選択を発行できなかった」ことの明示的な合図（gameState の外。実行時だけ）。
   requestChoiceV49 が false を返しても、legacy の API.selectCard は戻り値を捨てるため、発動準備（engine/1ZZV）はこの合図を見て中止する。
   進むのは候補不足で断った時だけ。手動キャンセルや「コールバックが来ない」では進まない（区別するため）。 */
let CHOICE_INSUFFICIENT_SEQ_S03 = 0;
let CHOICE_INSUFFICIENT_LAST_S03 = null;

/* ---- 移行状況カウンタ（レポート用。ゲーム状態ではない） --------------- */
let CHOICE_STATS_V49 = {opened:0, migrated:0, legacy:0, answered:0, cancelled:0, lostContinuation:0};
function choiceStatsV49(){ return Object.assign({}, CHOICE_STATS_V49); }
function resetChoiceStatsV49(){ CHOICE_STATS_V49={opened:0,migrated:0,legacy:0,answered:0,cancelled:0,lostContinuation:0}; }

/* ---- 状態アクセサ ---------------------------------------------------- */
function ensureChoiceStateV49(gs){
  gs=gs||gameState; if(!gs) return;
  if(gs.pendingChoice===undefined) gs.pendingChoice=null;
  if(gs.choiceSeq===undefined) gs.choiceSeq=0;
}
function pendingChoiceV49(gs){
  gs=gs||gameState; if(!gs) return null;
  return gs.pendingChoice||null;
}
function choiceWaitingV49(gs){ return !!pendingChoiceV49(gs); }

/* 候補は uid で解決する。解決中に他カードが場を離れて添字がズレるため、
   index をそのまま信用してはいけない。

   重要: uid を持つ候補の uid 解決が失敗したら null を返す（stale）。
   同じ zone/index に別のカードが入っている可能性があるため、座標へ
   フォールバックしてはいけない。フォールバックすると
   「選んだはずのカード」ではない別カードに効果が当たる。 */
function choiceResolveCandidateV49(gs, cand){
  gs=gs||gameState;
  if(!cand) return null;
  if(cand.uid!=null){
    if(typeof findCardByUidInState!=='function') return null;
    const hit=findCardByUidInState(gs, cand.uid);
    if(!hit) return null;                 // stale: 選択時のカードはもう存在しない
    /* S03-U45 (C-S03-36): legacy selectCard のコールバックは API.pileCards 等と同じ {card, db} 形を前提にしている（x.db.n など）。
       db を付けないと DUEL で「Cannot read properties of undefined (reading 'n')」になり、デュエルが止まった。 */
    return {p:hit.p, zone:hit.zone, index:hit.index, uid:cand.uid, card:hit.card, db:(typeof dbOf==='function'&&hit.card)?dbOf(hit.card):undefined};
  }
  /* uid を持たない候補（プレイヤー選択・ゾーン選択・宣言など）のみ座標を使う */
  const P=gs.players[cand.p];
  const card=(P && cand.zone!=null && cand.index!=null && typeof zoneCard==='function')
    ? zoneCard(P, cand.zone, cand.index) : null;
  return {p:cand.p, zone:cand.zone, index:cand.index, uid:null, card, db:(typeof dbOf==='function'&&card)?dbOf(card):undefined};   /* S03-U45 */
}
function choiceCandidateByKeyV49(gs, key){
  const pc=pendingChoiceV49(gs); if(!pc) return null;
  return (pc.candidates||[]).find(c=>c.key===key)||null;
}

/* ---- 候補の正規化（純データ化） --------------------------------------
   入力は既存スクリプトが使う {p,zone,index,card} 形式を許容する。
   出力は JSON のみ。card 実体は保持しない。 */
function normalizeChoiceCandidatesV49(list, opts){
  opts=opts||{};
  const out=[];
  (list||[]).forEach((t,i)=>{
    if(t==null) return;
    const card = t.card || null;
    const uid  = (t.uid!=null) ? t.uid : (card && card.uid!=null ? card.uid : null);
    const hidden = !!(opts.revealed===false) ||
      (typeof isHiddenTarget==='function' && card ? !!isHiddenTarget(t) : false);
    let label = t.label;
    if(label==null){
      label = hidden ? '裏側のカード'
            : (card && typeof labelOf==='function' ? labelOf(card) : String(t.name||'選択肢'));
    }
    let sub = t.sub;
    if(sub==null && t.p!=null && t.zone!=null){
      sub = `${typeof nameOf==='function'?nameOf(t.p):('P'+t.p)}・${typeof zoneJp==='function'?zoneJp(t.zone):t.zone}`;
    }
    out.push({
      key: String(t.key!=null ? t.key : `c${i}`),
      label: String(label),
      sub: sub==null? '' : String(sub),
      hidden: !!hidden,
      uid: uid,
      p: t.p!=null ? t.p : null,
      zone: t.zone!=null ? t.zone : null,
      index: t.index!=null ? t.index : null,
      value: t.value!==undefined ? t.value : null
    });
  });
  return out;
}

/* ---- ChoiceRequest 発行 ----------------------------------------------
   spec = {
     player,                     // 選ぶプレイヤー（相手に選ばせる場合に指定）
     kind,                       // 'card'|'player'|'zone'|'yesno'|'declare'|'order'
     title, note,
     candidates,                 // [{p,zone,index,card}] または [{key,label,value}]
     min, max,                   // 選択枚数の下限・上限（既定 1/1）
     cancelable,                 // 途中でやめられるか
     targeting,                  // 対象を取る効果か（対象耐性フィルタの要否）
     revealed,                   // false で候補を伏せる（非公開情報）
     resume:{handler, args},     // ★移行済み経路。レジストリ登録名
     legacy:{onPick, onCancel},  // ★legacy経路。クロージャ（数えない）
     meta:{v4EffectKey, chainId, scriptName}
   }
   戻り値: true=選択待ちに入った / false=候補が無く発行しなかった          */
function requestChoiceV49(spec){
  ensureChoiceStateV49(gameState);
  spec=spec||{};

  const kind = spec.kind || 'card';
  /* S03-U474: 選択の「段階」— コストの選択は対象を取る選択ではない（対象耐性を掛けない）。
     明示の spec.selection が優先。無ければ、legacy 互換層（API.selectCard / confirm 等）だけが発動準備の段階（engine/1ZZW）を引き継ぐ。
     登録ハンドラ経路（resume）は自分で決める: コストには targeting:false（省略可）か selection:'cost'。 */
  const selection = (spec.selection!=null && typeof selectionKindS03==='function') ? selectionKindS03(spec.selection)
    : ((spec.legacy && typeof selectionPhaseS03==='function' && selectionPhaseS03()==='cost') ? 'cost' : 'effect');
  const targeting = selection==='cost' ? false : spec.targeting===true;
  const revealed  = spec.revealed!==false;

  /* 対象を取る効果は対象耐性を持つカードを候補から除く。
     既存 API.selectCard と同じ規則を中央に集約する。 */
  let raw = spec.candidates || [];
  if(targeting && typeof filterTargetable==='function' && kind==='card'){
    const before = raw.length;
    raw = filterTargetable(raw, (spec.targetingPlayer===0||spec.targetingPlayer===1) ? spec.targetingPlayer : spec.player);   /* S03-U130: 対象を取るプレイヤー */
    if(raw.length < before && typeof trace==='function'){
      trace(`対象耐性により ${before-raw.length}枚を除外`);
    }
  }

  /* 呼び出し側から素通しになる値は、正規化する前に JSON 安全性を確認する。
     JSON.stringify は関数を黙って捨てるため、round-trip の後では検出できない。 */
  if(spec.resume && spec.resume.args!==undefined){
    const s=choiceJsonSafetyV49(spec.resume.args,'resume.args');
    if(!s.ok) throw new Error(`requestChoiceV49: resume.args がJSON-safeではありません — ${s.why}`);
  }

  const candidates = normalizeChoiceCandidatesV49(raw, {revealed});
  const min = Math.max(0, Number(spec.min!=null?spec.min:1)||0);
  const max = Math.max(min, Number(spec.max!=null?spec.max:1)||min);

  /* 達成不可能な選択は発行しない。候補が min に満たなければ
     プレイヤーは決して回答できず、選択待ちのまま進行が止まる。 */
  if(candidates.length < min){
    CHOICE_INSUFFICIENT_SEQ_S03++;
    CHOICE_INSUFFICIENT_LAST_S03 = {seq:CHOICE_INSUFFICIENT_SEQ_S03, reason:'insufficient', candidates:candidates.length, min, title:String(spec.title||'')};
    if(typeof trace==='function') trace(`選択候補が不足しています（${candidates.length}/${min}）`, false);
    if(typeof showToast==='function') showToast('選択できるカードが足りません');
    return false;
  }

  const isLegacy = !!(spec.legacy && typeof spec.legacy.onPick==='function');
  const cid = (gameState.choiceSeq||0) + 1;

  const choice = {
    cid,
    player: spec.player!=null ? spec.player : gameState.activePlayer,
    kind,
    title: String(spec.title||'選択'),
    note: String(spec.note||''),
    min, max,
    cancelable: spec.cancelable!==false,
    targeting,
    selection,   /* S03-U474: 'cost' | 'effect'（'effect' は「コスト以外」の意。登録経路の P1.1 は段階で印を付けず targeting を選択ごとに明示するため、P1.1 のコスト選択も 'effect' と記録される — P1.1 の分類には使えない。決め手は targeting）。記録に残るので保存・再開・Undo/Redo・Replay を跨いでも選択後のコールバックが同じ分類になる */
    revealed,
    candidates,
    legacy: isLegacy,
    resume: isLegacy ? {mode:'legacy'}
                     : {mode:'registry',
                        handler: String((spec.resume&&spec.resume.handler)||''),
                        args: (spec.resume&&spec.resume.args) ? JSON.parse(JSON.stringify(spec.resume.args)) : {}},
    meta: {
      v4EffectKey: (spec.meta&&spec.meta.v4EffectKey)||null,
      chainId:     (spec.meta&&spec.meta.chainId)!=null?(spec.meta.chainId):null,
      scriptName:  (spec.meta&&spec.meta.scriptName)||null
    }
  };

  /* S03-U35 (C-S03-28): 発動の準備中に開いた legacy 選択は、発動前の Journal 位置を持つ（保存・再開時に発動を取り消すため）。 */
  if(isLegacy && typeof activationPrepMetaS03==='function'){ const prepS03=activationPrepMetaS03(); if(prepS03) choice.meta.activationPrepS03=prepS03; }
  /* S03-U41 (C-S03-33): チェーンの解決中に開いた選択（保存からの再開で続きを積み直すため） */
  if(typeof resolutionWaitMetaS03==='function'){ const rwS03=resolutionWaitMetaS03(); if(rwS03) choice.meta.resolutionWaitS03=rwS03; }

  if(!isLegacy && !CHOICE_HANDLERS_V49[choice.resume.handler]){
    throw new Error(`requestChoiceV49: 未登録の継続ハンドラ "${choice.resume.handler}"`);
  }

  /* 発行前の最終ガード。candidate.value は呼び出し側の値を素通しするため、
     ここで choice 全体が JSON-safe であることを保証する。
     JSON-safe でないまま CHOICE_OPEN_V49 を発行すると、
     Journal / digest / 保存データのいずれかが静かに壊れる。 */
  const safety=choiceJsonSafetyV49(choice,'choice');
  if(!safety.ok){
    throw new Error(`requestChoiceV49: choice がJSON-safeではありません — ${safety.why}`);
  }

  /* legacy クロージャは gameState ではなく側テーブルへ。 */
  pruneChoiceLegacyV49(cid);
  if(isLegacy){
    CHOICE_LEGACY_CB_V49.set(cid, {onPick:spec.legacy.onPick, onCancel:spec.legacy.onCancel||null});
  }

  CHOICE_STATS_V49.opened++;
  if(isLegacy) CHOICE_STATS_V49.legacy++; else CHOICE_STATS_V49.migrated++;

  act({type:'CHOICE_OPEN_V49', player:choice.player, choice});

  /* ルール層とUI層の唯一の接続点。UIが無い環境（node回帰テスト）では何もしない。 */
  if(typeof onChoiceRequestOpenedV49==='function'){
    onChoiceRequestOpenedV49(pendingChoiceV49(gameState));
  }
  return true;
}

/* ---- 回答の検証（applyAction と UI の両方から使う純関数） ------------- */
function validateChoiceAnswerV49(choice, keys){
  if(!choice) return {ok:false, why:'選択待ちではありません'};
  const list = Array.isArray(keys) ? keys : (keys==null? [] : [keys]);
  const uniq = Array.from(new Set(list.map(String)));
  if(uniq.length !== list.length) return {ok:false, why:'同じ候補を重複して選択しています'};
  if(uniq.length < choice.min) return {ok:false, why:`${choice.min}件以上選んでください`};
  if(uniq.length > choice.max) return {ok:false, why:`${choice.max}件までです`};
  const valid = new Set((choice.candidates||[]).map(c=>c.key));
  for(const k of uniq){ if(!valid.has(k)) return {ok:false, why:`候補にない選択です: ${k}`}; }
  return {ok:true, keys:uniq};
}

/* ---- 回答 ------------------------------------------------------------
   Action を通してから継続を実行する。順序が逆だと Journal に載る前に
   盤面が動き、Replay が壊れる。                                          */
function answerChoiceV49(keys){
  const gs=gameState;
  const pc=pendingChoiceV49(gs);
  if(!pc){ if(typeof showToast==='function') showToast('選択待ちではありません'); return false; }

  const v=validateChoiceAnswerV49(pc, keys);
  if(!v.ok){ if(typeof showToast==='function') showToast(v.why); return false; }

  /* 継続に渡す情報は Action 適用前に確定させる（適用後は pendingChoice が消える） */
  const cid=pc.cid, resume=pc.resume, isLegacy=pc.legacy;
  const picked=v.keys.map(k=>{
    const cand=(pc.candidates||[]).find(c=>c.key===k)||null;
    const res=choiceResolveCandidateV49(gs,cand);
    /* res===null は stale（選択時のカードが既に存在しない）。
       継続側が誤って別カードを掴まないよう、座標を持たせず stale を立てる。 */
    if(!res) return {key:k, label:cand?cand.label:'', value:cand?cand.value:null, stale:true};
    return Object.assign({key:k, label:cand?cand.label:'', value:cand?cand.value:null, stale:false}, res);
  });
  const args=(resume&&resume.args)?resume.args:{};
  const handler=(resume&&resume.handler)||'';

  const prepUidA = (pc.meta && pc.meta.activationPrepS03 && pc.meta.activationPrepS03.uid != null) ? pc.meta.activationPrepS03.uid : null;   /* S03-U471 */
  const selectionA = pc.selection;   /* S03-U474: 継続は記録の段階で実行する（Action 適用前に確定） */
  act({type:'CHOICE_ANSWER_V49', player:pc.player, cid, keys:v.keys});
  CHOICE_STATS_V49.answered++;

  dispatchChoiceContinuationV49({cid, isLegacy, handler, args, prepUid:prepUidA, selection:selectionA,
    answer:{keys:v.keys, cards:picked, cancelled:false}});
  return true;
}

/* ---- 中止 ------------------------------------------------------------ */
function cancelChoiceV49(){
  const gs=gameState;
  const pc=pendingChoiceV49(gs);
  if(!pc) return false;
  if(!pc.cancelable){ if(typeof showToast==='function') showToast('この選択は取り消せません'); return false; }

  const cid=pc.cid, resume=pc.resume, isLegacy=pc.legacy;
  const args=(resume&&resume.args)?resume.args:{};
  const handler=(resume&&resume.handler)||'';

  /* S03-U471: 発動の準備中に開いた選択のキャンセルかどうか（発動前の状態へ戻すため） */
  const prepUid = (pc.meta && pc.meta.activationPrepS03 && pc.meta.activationPrepS03.uid != null) ? pc.meta.activationPrepS03.uid : null;
  const selectionC = pc.selection;   /* S03-U474 */
  act({type:'CHOICE_CANCEL_V49', player:pc.player, cid});
  CHOICE_STATS_V49.cancelled++;

  dispatchChoiceContinuationV49({cid, isLegacy, handler, args, prepUid, selection:selectionC,
    answer:{keys:[], cards:[], cancelled:true}});
  return true;
}

/* ---- 継続のディスパッチ ----------------------------------------------
   ここは applyAction の外。Replay では呼ばれない（記録済みActionを
   順に適用するだけなので、継続を再実行すると二重適用になる）。          */
function dispatchChoiceContinuationV49(job){
  if(typeof closeSheet==='function') closeSheet();
  /* S03-U474: 継続（onPick / onCancel / 登録ハンドラ）は、開いた時の選択の段階で実行する。コストの選択の続き（2体目のリリース等）は
     コストのまま、効果の選択の続きは効果のまま。段階は継続の間だけ（終われば元に戻す）。 */
  const inSel = (fn)=> (typeof withSelectionPhaseS03==='function') ? withSelectionPhaseS03(job.selection==='cost'?'cost':null, fn) : fn();

  if(job.isLegacy){
    /* ここで削除しない。Undoで選択待ちへ戻ったとき再び必要になるため、
       掃除は次の選択を開くとき（pruneChoiceLegacyV49）に行う。 */
    const cb=CHOICE_LEGACY_CB_V49.get(job.cid);
    if(!cb){
      /* 保存・リロードを跨いだ legacy 選択。状態は壊さず安全に中止する。 */
      CHOICE_STATS_V49.lostContinuation++;
      if(typeof trace==='function') trace('legacy選択の継続が失われたため中止しました（P1未移行経路）', false);
      if(typeof logIt==='function') logIt(gameState, '選択の続きを復元できないため処理を中止しました（legacy経路）');
      if(typeof abortResolve==='function') abortResolve();
      return;
    }
    if(job.answer.cancelled){
      if(cb.onCancel) inSel(()=>cb.onCancel());
      /* S03-U471: 発動の準備中の選択をやめた（理由 'cancel'。候補不足とは別）— onCancel が先へ進めず、別の選択待ちも無ければ、発動前の状態へ戻す */
      if(job.prepUid != null && typeof prepTxLiveForS03==='function' && prepTxLiveForS03(job.prepUid) && !(gameState && gameState.pendingChoice)) prepTxAbortS03('cancel', job.prepUid);
      if(typeof settleActivationPrepS03==='function') settleActivationPrepS03(); if(typeof resumeAfterResolutionChoiceS03==='function') resumeAfterResolutionChoiceS03(); return;
    }
    /* 既存 onPick は候補1件を受け取る形。互換のため先頭を渡す。 */
    const sigS471 = (typeof choiceInsufficientSeqS03==='function') ? choiceInsufficientSeqS03() : 0;
    if(cb.onPick) inSel(()=>cb.onPick(job.answer.cards[0], job.answer.cards));
    /* S03-U471: 続きの段（コスト後の対象選択など）が候補不足で断られていれば、発動準備を中止する（明示の合図がある時だけ） */
    if(typeof prepTxCheckInsufficientS03==='function') prepTxCheckInsufficientS03(sigS471, job.prepUid);
    if(typeof settleActivationPrepS03==='function') settleActivationPrepS03();   /* S03-U35 */
    if(typeof resumeAfterResolutionChoiceS03==='function') resumeAfterResolutionChoiceS03();   /* S03-U41 */
    return;
  }

  const fn=CHOICE_HANDLERS_V49[job.handler];
  if(!fn){
    CHOICE_STATS_V49.lostContinuation++;
    if(typeof trace==='function') trace(`継続ハンドラ "${job.handler}" が見つかりません`, false);
    if(typeof abortResolve==='function') abortResolve();
    return;
  }
  inSel(()=>fn(job.answer, job.args, gameState));
  /* S03-U41 (C-S03-33): 効果解決中の選択だった場合、待っていたチェーン処理を再開する */
  if(typeof resumeAfterResolutionChoiceS03==='function') resumeAfterResolutionChoiceS03();
}

/* ---- 保存・リロード後の健全化 ----------------------------------------
   registry 経路は resume がデータなので復元できる。
   legacy 経路はクロージャが失われているため、UI に出す前に落とす。      */
function reconcileChoiceAfterLoadV49(gs){
  gs=gs||gameState;
  /* S03-U208 follow-up: the chain link that was resolving when the game was saved (engine/1R) */
  if(typeof RESOLVING_LINK_S03!=='undefined') RESOLVING_LINK_S03 = gs.resolvingLinkS03 ? JSON.parse(JSON.stringify(gs.resolvingLinkS03)) : null;
  ensureChoiceStateV49(gs);
  const pc=gs.pendingChoice;
  if(!pc) return;
  const recoverable = pc.resume && pc.resume.mode==='registry' && !!CHOICE_HANDLERS_V49[pc.resume.handler];
  if(recoverable) return;
  if(!CHOICE_LEGACY_CB_V49.has(pc.cid)){
    CHOICE_STATS_V49.lostContinuation++;
    /* S03-U296: the release is an Action, so the Replay Journal closes the choice the same way (an unclosed CHOICE_OPEN_V49 made the rebuilt state diverge) */
    if(gs===gameState && typeof commitAutomaticActionV44==='function' && !gs.__v41ReplayApplying && !gs.__v44ReplayPreview){
      commitAutomaticActionV44({type:'CHOICE_CANCEL_V49', player:pc.player, cid:pc.cid});
    }
    gs.pendingChoice=null;
    if(typeof logIt==='function') logIt(gs, '復元できない選択待ち（legacy経路）を解除しました');
  }
}

/* ---- JSON安全性検査（発行前ガードと自己診断の共通実体） ---------------
   関数 / undefined / Symbol / Map / Set / DOM / Promise / 循環 を検出する。
   candidate.value と resume.args は呼び出し側の値をそのまま通すため、
   ここを通さずに CHOICE_OPEN_V49 を発行してはいけない。 */
function choiceJsonSafetyV49(value, rootLabel){
  const bad=[]; const seen=new Set();
  (function walk(v,path,depth){
    if(bad.length>8) return;
    if(depth>12){ bad.push(`${path}: too deep`); return; }
    if(v===null) return;
    const t=typeof v;
    if(t==='function'){ bad.push(`${path}: function`); return; }
    if(t==='undefined'){ bad.push(`${path}: undefined`); return; }
    if(t==='symbol'){ bad.push(`${path}: symbol`); return; }
    if(t==='bigint'){ bad.push(`${path}: bigint`); return; }
    if(t==='number' && !Number.isFinite(v)){ bad.push(`${path}: ${String(v)}`); return; }
    if(t!=='object') return;
    if(seen.has(v)){ bad.push(`${path}: circular`); return; }
    seen.add(v);
    if(v instanceof Map || v instanceof Set){ bad.push(`${path}: ${v.constructor.name}`); return; }
    if(v.nodeType!=null || v.classList!=null){ bad.push(`${path}: DOM`); return; }
    if(typeof v.then==='function'){ bad.push(`${path}: thenable`); return; }
    if(Array.isArray(v)){ v.forEach((x,i)=>walk(x,`${path}[${i}]`,depth+1)); return; }
    const proto=Object.getPrototypeOf(v);
    if(proto!==Object.prototype && proto!==null){ bad.push(`${path}: non-plain object`); return; }
    Object.keys(v).forEach(k=>walk(v[k],`${path}.${k}`,depth+1));
  })(value, rootLabel||'value', 0);
  if(!bad.length){
    try{ JSON.parse(JSON.stringify(value)); }
    catch(e){ bad.push(`${rootLabel||'value'}: JSON roundtrip failed`); }
  }
  return {ok:bad.length===0, why:bad.join(', ')};
}

/* ---- 直列化検査（テストと自己診断で使う） -----------------------------
   pendingChoice に関数・DOM・Map等が混入していないことを機械的に保証する。 */
function assertChoiceSerializableV49(gs){
  gs=gs||gameState;
  const pc=gs.pendingChoice;
  if(pc==null) return {ok:true, why:''};
  return choiceJsonSafetyV49(pc, 'pendingChoice');
}

