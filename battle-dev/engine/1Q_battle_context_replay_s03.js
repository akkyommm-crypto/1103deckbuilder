/* =========================================================================
   S03-U21 — 戦闘状況（gameState.battle）を ATTACK の Replay で再現する
   -------------------------------------------------------------------------
   ダメージステップの戦闘状況 gameState.battle は startBattle / ダメージステップ処理が Action の外で設定する。
   ATTACK の reducer（③ダメージ計算）の中では、継続効果が gameState.battle を読む
   （ダメージステップ中の攻撃力変化：ダッシュ・ウォリアー、エトワール・サイバー、ネコ耳族 など、
     戦闘ダメージの増減：battleDamage / piercingDamage）。
   ライブでは値があるが、Replay では ATTACK だけが再生されるので値が無く、攻撃力・ダメージが変わって digest が一致しなかった。
   ■ 対処
     1. ATTACK を発行する時に、その時点の戦闘状況を JSON のスナップショットとして Action に持たせる（battleCtxS03）。
     2. reducer の実行中だけ、gs.battle が無い場合（Replay）に限りスナップショットを置き、終わったら元に戻す。
        ライブでは gs.battle が既にあるので何もしない。gameState.battle は digest に含まれない。
   スナップショットは数値・文字列・真偽値・null と、それらの配列だけを写す。カード実体の flippedCard は uid で持ち、
   置く時に uid から引き直す。フィールドを持たない既存の Replay パッケージは従来どおり。
   ========================================================================= */
function battleContextSnapshotS03(b){
  if(!b || typeof b !== 'object') return null;
  const prim = v => v === null || typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v));
  const out = {};
  Object.keys(b).forEach(k=>{
    const v = b[k];
    if(k === 'flippedCard'){ out.flippedCardUidS03 = (v && v.uid != null) ? v.uid : null; return; }
    if(prim(v)) out[k] = v;
    else if(Array.isArray(v) && v.every(prim)) out[k] = v.slice();
  });
  return out;
}
function installBattleContextS03(gs, a){
  if(!gs || !a || a.type !== 'ATTACK' || !a.battleCtxS03 || gs.battle) return null;
  const token = {had: Object.prototype.hasOwnProperty.call(gs, 'battle'), prev: gs.battle};
  const b = JSON.parse(JSON.stringify(a.battleCtxS03));
  if(b.flippedCardUidS03 != null && typeof findCardByUid === 'function'){
    const h = findCardByUid(b.flippedCardUidS03);
    b.flippedCard = h ? h.card : null;
  }else if(!('flippedCard' in b)) b.flippedCard = null;
  delete b.flippedCardUidS03;
  gs.battle = b;
  return token;
}
function restoreBattleContextS03(gs, token){
  if(!gs || !token) return;
  if(token.had) gs.battle = token.prev; else delete gs.battle;
}
