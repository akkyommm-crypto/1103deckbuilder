/* =========================================================================
   S03-U14 — 召喚・特殊召喚される度に置くカウンター（チェーンを作らない）
   -------------------------------------------------------------------------
   「『六武衆』モンスターが召喚・特殊召喚される度に、このカードに武士道カウンターをN個置く」
   を共通化する。カード側は summonCounterS03:{kind, n, group, label} を宣言する。

   ■ いつ置くか
     召喚成功イベント（onNormalSummon / onSpecialSummon）を予約する時点。
     DUEL の予約は必ず Action の中（EVENT_QUEUE_V31 の reducer、または他の Action の reducer 内の予約）で
     行われるので、置く処理も同じ Action に含まれ、Journal / Replay / Undo がそのまま再現する。
     誘発効果ではないので、チェーンにも SEGOC の候補にも載らない。ダメージステップ中の召喚でも置く
     （R1103-SIXGATE-001、R1103-SIXUNITED-001/003）。
   ■ いくつ置くか
     1回の召喚・特殊召喚ごとに N 個。複数体が同時に特殊召喚されても、その1回の出来事に対して N 個だけ置く
     （R1103-SIXGATE-002）。表側表示の各カードにそれぞれ置く（R1103-SIXGATE-003）。
   ■ 数えないもの
     裏側表示のモンスター、モンスターゾーンに残っていないモンスター、置く側自身。
   ■ 置く側
     表側表示で魔法＆罠ゾーン／フィールドゾーンにあり、効果が無効になっておらず、
     「カードの発動」がチェーン上で解決待ちでないカード。
   ■ 上限
     counterMaxV22 の宣言を placeCounterUnitsV22 が守る。新しい state は作らない（card.counters のみ）。
   DUEL 以外のモードは従来どおり（置かない）。
   ========================================================================= */
function summonCounterSummonedS03(gs, item){
  const e = (item && item.evt) || {};
  const uids = Array.isArray(e.uids) ? e.uids : (e.uid != null ? [e.uid] : []);
  const out = [];
  uids.forEach(u=>{
    const h = findCardByUidInState(gs, u);
    if(h && h.card && h.zone==='mz' && h.card.face==='up' && out.every(x=>x.card!==h.card)) out.push(h);
  });
  return out;
}
function summonCounterObserverActiveS03(gs, card){
  if(!card || card.face!=='up' || card.activationNegated) return false;
  /* 「カードの発動」が解決待ちの間は、まだ効果が適用されていない。 */
  if(card.activationPending && (gs.chain||[]).some(l=>l && l.uid===card.uid && l.cardActivationOnly)) return false;
  if(typeof effectNegated==='function' && effectNegated(card)) return false;
  return true;
}
function applySummonCountersS03(gs, item){
  gs = gs || gameState;
  if(!item || (item.eventName!=='onNormalSummon' && item.eventName!=='onSpecialSummon')) return 0;
  if(typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return 0;
  const summoned = summonCounterSummonedS03(gs, item);
  if(!summoned.length) return 0;
  let placed = 0;
  for(let p=0; p<2; p++){
    const P = gs.players[p];
    const observers = (P.sz||[]).slice(); if(P.field) observers.push(P.field);
    observers.forEach(c=>{
      const sc = c && CARD_SCRIPTS[cardName(c)], def = sc && sc.summonCounterS03;
      if(!def || !summonCounterObserverActiveS03(gs, c)) return;
      if(!summoned.some(h=>h.card!==c && (!def.group || isCardInGroupV4(h.card, def.group)))) return;
      const uid = ensureCardUid(gs, c), units = [];
      for(let i=0; i<(Number(def.n)||1); i++) units.push(uid);
      placed += placeCounterUnitsV22(gs, units, def.kind,
        `${cardName(c)}（「${def.label||def.group}」の召喚・特殊召喚）`);
    });
  }
  return placed;
}
