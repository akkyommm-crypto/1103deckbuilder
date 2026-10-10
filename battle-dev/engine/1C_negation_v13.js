/* =========================================================================
   System v13 — Negation primitive（効果無効の期間管理とチェーンリンク指定）
   -------------------------------------------------------------------------
   「この効果で特殊召喚したモンスターの効果は無効化される」
   「ターン終了時まで〜の効果を無効にする」
   「その発動と効果を無効にし破壊する」を共通化する。

   ■ 4つの無効化を混同しない
     1. activation negation … チェーンリンクの「発動」を無効にする
        既存: CHAIN_NEGATE_LINK mode:'activation'
     2. effect negation … チェーンリンクの「効果」だけを無効にする
        既存: CHAIN_NEGATE_LINK mode:'effect'
     3. card effect disabled … 場のカードが持つ効果そのものを無効にする
        既存: card.negated（恒久）/ card.negatedUntilTurn（そのターン）/
              continuous.negateEffect（永続効果ソースによる無効化）
     4. summon negation … 召喚そのものの無効
        既存: SUMMON_WINDOW_NEGATE_V42。ここでは一切触らない。

   既に存在するので**作り直さない**もの:
     CHAIN_NEGATE_LINK / negatePreviousChainLinkV2 / effectNegated /
     effectNegatedBy / continuous.negateEffect / trapNegated /
     FX_NEGATE / SUMMON_WINDOW_NEGATE_V42 / v12 の発動イベントと chainId

   足りないので足すもの:
     A. 期間つきの「このカードの効果を無効にする」を Action として置く。
        既存 card.negatedUntilTurn はカードスクリプトが gameState を
        直接書き換えていて Journal に載らない（Replay で再現できない）。
        v13 は Action にして、期間も endTurn / permanent を選べるようにする。
     B. チェーンリンクを chainId で指定して無効にする。
        既存 negatePreviousChainLinkV2 は「直前のリンク」しか選べず、
        v12 の発動イベントが持つ chainId を活かせない。

   ■ Replay 安全性
     - state は純JSON。identity は uid と chainId。
     - 期間はターンの絶対値で持ち、判定は「今のターンと比べるだけ」の
       純関数。期限切れの掃除 Action を出さないので Undo とずれない。
     - 場を離れたら消える（ZONE_LOCAL_KEYS）。
   ========================================================================= */

const NEG_UNTIL_V13 = Object.freeze(['endTurn','permanent']);

/* ---- カード単位の効果無効 ------------------------------------------------ */
/* card.negV13 = {until:'endTurn'|'permanent', turn:<設定時のターン>,
                  label:string, sourceUid:number|null}                     */
function negationStateV13(card){
  const s = card && card.negV13;
  if(!s || typeof s !== 'object') return null;
  if(NEG_UNTIL_V13.indexOf(s.until) < 0) return null;
  return s;
}
/* v13 によって今この瞬間に無効化されているか */
function negatedByV13(card, gs){
  const s = negationStateV13(card);
  if(!s) return false;
  if(s.until === 'permanent') return true;
  gs = gs || gameState;
  return Number(s.turn) === Number(gs.turn);
}
function makeNegationV13(until, label, sourceUid, turn){
  return {
    until: (NEG_UNTIL_V13.indexOf(until) >= 0) ? until : 'endTurn',
    turn: Number(turn) || 0,
    label: String(label || '効果の無効化'),
    sourceUid: (sourceUid != null) ? Number(sourceUid) : null,
  };
}

/* ---- チェーンリンクの指定 ------------------------------------------------ */
/* chainId から現在の添字を引く。既に解決済みなら -1。 */
function chainIndexOfV13(gs, chainId){
  gs = gs || gameState;
  if(chainId == null || !Array.isArray(gs.chain)) return -1;
  for(let i=0;i<gs.chain.length;i++){
    if(gs.chain[i] && gs.chain[i].chainId === chainId) return i;
  }
  return -1;
}
/* v12 の発動イベント（または chainId）から、そのリンクを無効にする。
   mode は 'activation'（発動を無効）か 'effect'（効果だけ無効）。
   destroySource が true なら発動元も破壊する（既存の作法に合わせる）。 */
function negateChainLinkV13(evtOrId, mode, reason, destroySource){
  const chainId = (evtOrId && typeof evtOrId === 'object') ? evtOrId.chainId : evtOrId;
  const i = chainIndexOfV13(gameState, chainId);
  if(i < 0) return false;
  const link = gameState.chain[i];
  act({type:'CHAIN_NEGATE_LINK', index:i, chainId,
       reason: reason || '無効', mode: (mode === 'effect') ? 'effect' : 'activation'});
  if(destroySource === true && link && link.uid != null){
    const h = findCardByUid(link.uid);
    if(h && (h.zone === 'sz' || h.zone === 'field' || h.zone === 'mz')){
      act({type:'FX_TO_GRAVE', player:h.p, zone:h.zone, index:h.index,
           reason: reason || '発動を無効', byDestroy:true});
    }
  }
  return true;
}
/* そのチェーンリンクが既に無効化されているか */
function chainLinkNegatedV13(gs, chainId){
  const i = chainIndexOfV13(gs || gameState, chainId);
  if(i < 0) return false;
  const link = (gs || gameState).chain[i];
  return !!(link && link.negated);
}

/* ---- カードへ無効化を置く / 外す ----------------------------------------- */
function applyNegationV13(target, until, label, sourceCard){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  let sourceUid = null;
  if(sourceCard){
    if(typeof ensureCardUid === 'function') ensureCardUid(gameState, sourceCard);
    sourceUid = (sourceCard.uid != null) ? sourceCard.uid : null;
  }
  act({type:'NEGATE_CARD_V13', player:r.p, zone:r.zone, index:r.index,
       until:(NEG_UNTIL_V13.indexOf(until) >= 0) ? until : 'endTurn',
       label:label || '効果の無効化', sourceUid});
  return true;
}
function clearNegationV13(target){
  const r = (typeof resolveTarget === 'function') ? resolveTarget(target) : null;
  if(!r) return false;
  act({type:'NEGATE_CARD_V13', player:r.p, zone:r.zone, index:r.index, clear:true});
  return true;
}

/* ---- 直列化の検査（テスト用） ------------------------------------------- */
function assertNegationStateSerializableV13(gs){
  gs = gs || gameState;
  const scan = (card)=>{
    const s = card && card.negV13;
    if(s == null) return null;
    if(typeof s !== 'object') return 'negV13 が object でない';
    for(const k of Object.keys(s)){
      const v = s[k];
      if(v != null && typeof v !== 'number' && typeof v !== 'string'){
        return 'negV13.' + k + ' が JSON 化できない';
      }
    }
    try{ JSON.parse(JSON.stringify(s)); }catch(e){ return 'negV13 が JSON 化できない'; }
    return null;
  };
  for(let p=0;p<2;p++){
    const P = gs.players && gs.players[p]; if(!P) continue;
    for(const z of ['mz','sz','grave','hand','banish','deck','ex']){
      for(const c of (P[z]||[])){ const e = scan(c); if(e) return e; }
    }
    if(P.field){ const e = scan(P.field); if(e) return e; }
  }
  return null;
}
