/* =========================================================================
   S03-U18 — 「カードが発動した時に、その発動を無効にする」応答（カウンター罠など）
   -------------------------------------------------------------------------
   一部のスクリプトは、発動した相手のカードを onActivateSuccess の誘発イベント（ctx.event）で知り、
   condition と resolve の両方で ctx.event を読む。しかし、
     ・チェーン応答の合法性（getChainResponsesV2 / duelActivateResponseV2 → prepareDuelActivation）は
       イベントを渡さないので、発動を無効にしたい相手の発動がチェーンに乗っている間は常に不合法だった。
     ・遅延イベント onActivateSuccess はチェーンが解決した後に SEGOC で提示されるので、
       無効にする発動が既に解決した後で発動でき、何も無効にできないままコストだけ払っていた。
   ■ 宣言されたスクリプトだけ（cards/H5_claude_s03_activation_response.js）
     1. チェーン応答の合法性判定と発動準備に、応答先＝チェーンの一番上のリンクの発動イベント
        （makeActivationEventV12）を ctx.event として渡す。CHAIN_ADD がそのイベントを保持し、解決時の ctx.event になる。
     2. onActivateSuccess の誘発候補（collectHandlers）には出さない。
   チェーンが無い時はイベントを作らない（応答する発動が無いので不合法のまま）。
   ========================================================================= */
const ACTIVATION_RESPONSE_S03 = new Set();
function declareActivationResponseS03(names){ (names||[]).forEach(n=>ACTIVATION_RESPONSE_S03.add(n)); }
function activationResponseDeclaredS03(name){ return ACTIVATION_RESPONSE_S03.has(name); }
/* 応答先（チェーンの一番上）の発動イベント */
function topActivationEventS03(gs){
  gs = gs || gameState;
  const ch = Array.isArray(gs.chain) ? gs.chain : [];
  if(!ch.length || typeof makeActivationEventV12!=='function') return null;
  return makeActivationEventV12(gs, ch[ch.length-1]);
}
/* 宣言されたスクリプトの応答用 opts。既に onActivateSuccess のイベントを持っていればそのまま使う。 */
function activationResponseOptsS03(name, opts){
  if(!activationResponseDeclaredS03(name)) return opts || {};
  if(opts && opts.event && opts.eventName==='onActivateSuccess') return opts;
  const ev = topActivationEventS03(gameState);
  if(!ev) return opts || {};
  return Object.assign({}, opts || {}, {event:ev, eventName:'onActivateSuccess'});
}

/* S03-U19: 発動への応答ではない（対象にされた時の自動的な無効化など）が onActivateSuccess の誘発として書かれ、
   S03-U19 で対象の読み取りが直ったために遅れて誘発してしまうスクリプトは、正しく実装するまで誘発として出さない。 */
const ACTIVATION_LATE_TRIGGER_SUPPRESSED_S03 = new Set();
function declareActivationLateTriggerSuppressedS03(names){ (names||[]).forEach(n=>ACTIVATION_LATE_TRIGGER_SUPPRESSED_S03.add(n)); }
function activationLateTriggerSuppressedS03(name){
  return ACTIVATION_RESPONSE_S03.has(name) || ACTIVATION_LATE_TRIGGER_SUPPRESSED_S03.has(name);
}

/* S03-U97: 「このカードの発動に対して、お互いにカードの効果を発動できない」宣言（超融合など）。
   チェーンの一番上のリンクがこの宣言名の間、getChainResponsesV2 は応答候補を一切出さない。
   そのリンクが解決されチェーンから外れれば（通常のSOLVE_CHAIN）、以降の発動には影響しない
   ―― 実際のカードテキストの「その発動に対して」の範囲と一致する。 */
const CHAIN_RESPONSE_LOCKED_S03 = new Set();
function declareChainResponseLockedS03(names){ (names||[]).forEach(n=>CHAIN_RESPONSE_LOCKED_S03.add(n)); }
function chainResponseLockedS03(){
  const ch = gameState.chain;
  if(!Array.isArray(ch) || !ch.length) return false;
  const top = ch[ch.length-1];
  return CHAIN_RESPONSE_LOCKED_S03.has(top.name);
}

/* S03-U262: forced chain responses — 「…が発動した時、このカードをリリースして発動する。」 (死霊騎士デスカリバー・ナイト): a declared response whose
   text is forced. When the player holding priority in a chain window has such a response available against the top link, passing
   activates it instead (chainPassV2 / openChainPriorityV2), through the normal duelActivateResponseV2 path (cost, CHAIN_ADD — journaled).
   Each (link, card) pair is tried once (FORCED_TRIED_S03: a WeakMap keyed by the chain link object — outside the game state, and not confused by
   chain ids / uids that restart after a reset, Undo or Load; a failed preparation cannot loop). */
const FORCED_RESPONSE_S03 = new Set();
const FORCED_TRIED_S03 = new WeakMap();
function declareForcedActivationResponseS03(names){ (names||[]).forEach(n=>{ FORCED_RESPONSE_S03.add(n); ACTIVATION_RESPONSE_S03.add(n); }); }
function forcedResponseForS03(p){
  if(!FORCED_RESPONSE_S03.size || typeof getChainResponsesV2!=='function') return null;
  const ch = gameState.chain; if(!Array.isArray(ch) || !ch.length) return null;
  const top = ch[ch.length-1];
  const list = getChainResponsesV2(p) || [];
  const tried = FORCED_TRIED_S03.get(top) || new Set();
  const hit = list.find(r=>r && r.db && FORCED_RESPONSE_S03.has(r.db.n) && r.card && !tried.has(r.card.uid));
  if(!hit) return null;
  tried.add(hit.card.uid); FORCED_TRIED_S03.set(top, tried);
  return hit;
}
