/* =========================================================================
   S03-U392 — Spell / Trap Set ban for a turn range (大寒波)
   effectFlags.setBanS03 = [{from, to, label}] on a player (written with API.setFlag(p, 'setBanS03', list, false));
   SET_ST refuses while gs.turn is inside a range of the player. Pure function of the state (Replay-safe).
   ========================================================================= */
function setBannedS03(gs, P){
  const l = P && P.effectFlags && P.effectFlags.setBanS03;
  if(Array.isArray(l) && l.some(b=>b && Number(b.from) <= Number(gs.turn) && Number(gs.turn) <= Number(b.to))) return true;
  /* S03-U529: 永続効果による禁止（「相手はカードをセットできない」、ダーク・シムルグ ④）。 */
  const p = setBanPlayerIndexS03(gs, P);
  return (p === 0 || p === 1) ? !!setBanSourceS03(gs, p) : false;
}
/* player オブジェクトから index を引く（既存の呼び出し側を変えないため）。 */
function setBanPlayerIndexS03(gs, P){
  if(!gs || !Array.isArray(gs.players) || !P) return null;
  for(let i = 0; i < 2; i++) if(gs.players[i] === P) return i;
  return null;
}
/* p（セットしようとする側）のセットを禁じている相手の表側表示カード。
   スクリプトの setBanOpponentS03 宣言を持つカードだけが対象（宣言が無ければ何も変わらない）。
   効果が無効になっているカードは数えない。 */
function setBanSourceS03(gs, p){
  gs = gs || ((typeof gameState !== 'undefined') ? gameState : null);
  if(!gs || typeof CARD_SCRIPTS === 'undefined') return null;
  for(let q = 0; q < 2; q++){
    if(q === p) continue;
    const Q = gs.players[q]; if(!Q) continue;
    const zones = [].concat(Q.mz || [], Q.sz || [], Q.field ? [Q.field] : []);
    for(const c of zones){
      if(!c || c.face !== 'up') continue;
      const sc = CARD_SCRIPTS[cardName(c)];
      if(!sc || sc.setBanOpponentS03 !== true) continue;
      if(typeof effectNegated === 'function' && effectNegated(c)) continue;
      return {player:q, uid:(c.uid != null) ? c.uid : null, name:cardName(c)};
    }
  }
  return null;
}
