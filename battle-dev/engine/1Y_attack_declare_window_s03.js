/* =========================================================================
   S03-U40 — C-S03-31 ATTACK_DECLARATION_RESPONSE_WINDOW 攻撃宣言時の応答
   -------------------------------------------------------------------------
   DUEL の攻撃宣言時の窓（processor POINT kind:'attackDeclare'）では、応答の合法性を攻撃宣言イベントなしで判定していたため、
   events:['onAttackDeclare'] の v4 カードや ctx.eventName を見るスクリプト（攻撃の無力化・ドレインシールド など）が
   相手の攻撃宣言に一度も出なかった（R1 計測：37枚中31枚が出ない）。
   ■ getChainResponsesV2 / prepareDuelActivation は、通常の判定で不可なら、攻撃中（pendingAttack）の窓に限り
     eventName:'onAttackDeclare' と攻撃の情報（攻撃側・攻撃モンスター・対象）で判定し直す。通ればそのイベントで発動する。
     通常の判定で合法なカード（強制脱出装置など）は従来どおり。新しい gameState キーは作らない。
   ========================================================================= */
function attackDeclareWindowS03(){
  const a = gameState && gameState.pendingAttack; if(!a) return null;
  /* processPointV27 は応答の有無を processorCurrent の間に調べ、無ければ待たずにパスする。UI 待ち（processorWaiting）と両方を見る */
  for(const w of [gameState.processorWaiting, gameState.processorCurrent]){
    if(w && w.type === PROCESSOR_V27.POINT && (w.payload || {}).kind === 'attackDeclare') return a;
  }
  return null;
}
function attackDeclareResponseOptsS03(name, opts){
  const a = attackDeclareWindowS03(); if(!a) return null;
  if(opts && opts.eventName === 'onAttackDeclare') return null;
  const ah = a.attackerUid != null ? findCardByUid(a.attackerUid) : null;
  const th = a.targetUid != null ? findCardByUid(a.targetUid) : null;
  const event = {player:a.player, atkIdx:ah ? ah.index : null, attackerUid:a.attackerUid, targetUid:a.targetUid,
    target:(a.targetUid == null) ? 'direct' : (th ? th.index : null), name:a.name};
  return Object.assign({}, opts || {}, {event, eventName:'onAttackDeclare'});
}
