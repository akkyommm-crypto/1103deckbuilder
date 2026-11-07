/* =========================================================================
   S03-U526 — 「カウンター罠で相手のカードの発動を無効にした」事の記録と、その後の窓
   -------------------------------------------------------------------------
   《冥王竜ヴァンダルギオン》《裁きを下す者－ボルテニス》は「カウンター罠で無効にした／
   カウンター罠の発動に成功した」事を条件に手札から出る。これまで engine はチェーンリンクに
   「無効にされた」印（negated / activationNegated、engine/00 の CHAIN_NEGATE_LINK）だけを置き、
   **誰が何を無効にしたか**を残していなかったので、この条件を読めなかった
   （《裁きを下す者－ボルテニス》の ENGINE_GAP 記載「Counter Trap success provenance」）。

   ■ 記録（gs.counterNegateS03）
     CHAIN_NEGATE_LINK の Action が「無効にした側はカウンター罠か」（byCounterS03）を持ち、
     発動無効（activationNegated）の時だけ 1 件積む:
       {byPlayer, byName, ofPlayer, kind:'m'|'s'|'t', name}
     kind と ofPlayer は無効にされたリンクと状態から読む。Action の payload と状態だけで決まるので
     Replay・保存・再開でも同じ値になる。
   ■ 窓（onCounterNegateS03）
     WIKI-9220FED3DC74 / WIKI-ECEE2A503FDB（09/05/15）「カウンター罠を含む一連のチェーン処理が
     終了した後」に発動でき、いかなる場合でもタイミングを逃さない。
     そのため processChainEndV30（チェーンが空になった後・DRAIN_EVENTS の前）で 1 回だけ積む。
     記録を消すのも Action（COUNTER_NEGATE_CLEAR_S03）なので Replay で同じ順になる。
   ■ 数えないもの
     WIKI-19F58D392DF1（05/03/04）《神の宣告》で召喚・反転召喚・特殊召喚を無効にした場合は条件を
     満たさない → 召喚無効の経路は CHAIN_NEGATE_LINK を通らないので、ここには入らない。
   ========================================================================= */
/* 解決中のカードがカウンター罠なら、その出所を返す（engine/1C の negateChainLinkV13 から呼ぶ）。 */
function counterNegateSourceS03(){
  const r = (typeof RESOLVING_LINK_S03 !== 'undefined') ? RESOLVING_LINK_S03 : null;
  if(!r || r.uid == null) return null;
  const h = (typeof findCardByUid === 'function') ? findCardByUid(r.uid) : null;
  const db = h ? dbOf(h.card) : null;
  if(!db || db.k !== 't' || db.sub !== 'カウンター') return null;
  const p = (r.player === 0 || r.player === 1) ? r.player : (h ? h.p : null);
  if(p !== 0 && p !== 1) return null;
  return {name:r.name || null, uid:r.uid, player:p};
}
function counterNegateNoteS03(gs, rec){
  if(!gs || !rec) return;
  const st = gs.counterNegateS03 || (gs.counterNegateS03 = {items:[]});
  if(!Array.isArray(st.items)) st.items = [];
  st.items.push(rec);
}
function counterNegatePendingS03(gs){
  const st = (gs || gameState || {}).counterNegateS03;
  return (st && Array.isArray(st.items)) ? st.items : [];
}
/* チェーン処理の終了時に 1 回だけ積む。 */
function counterNegateFlushS03(gs){
  gs = gs || ((typeof gameState !== 'undefined') ? gameState : null);
  if(!gs) return false;
  const items = counterNegatePendingS03(gs);
  if(!items.length) return false;
  const copy = items.map(x=>Object.assign({}, x));
  if(typeof commitAutomaticActionV44 === 'function') commitAutomaticActionV44({type:'COUNTER_NEGATE_CLEAR_S03'});
  else delete gs.counterNegateS03;
  if(typeof queueDeferredEventV2 === 'function'
     && typeof PLAY_MODE !== 'undefined' && PLAY_MODE === PLAY_MODES.DUEL){
    queueDeferredEventV2('onCounterNegateS03', {itemsS03:copy});
    return true;
  }
  return false;
}
/* その player が「自分のカウンター罠で、相手がコントロールするカードの発動を無効にした」種類。 */
function counterNegateKindsForS03(evt, player){
  const items = (evt && Array.isArray(evt.itemsS03)) ? evt.itemsS03 : [];
  const out = [];
  items.forEach(it=>{
    if(!it || it.byPlayer !== player) return;
    if(it.ofPlayer === player) return;   /* 自分のカードも同時に無効にした場合は調整中（WIKI-35B05E7A1570） */
    if(it.kind !== 'm' && it.kind !== 's' && it.kind !== 't') return;
    if(out.indexOf(it.kind) < 0) out.push(it.kind);
  });
  return out;
}
