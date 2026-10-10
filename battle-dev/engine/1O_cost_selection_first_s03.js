/* =========================================================================
   S03-U16 — コストにするカードを selectTargets で選ぶ旧形式スクリプト
   -------------------------------------------------------------------------
   一部の旧形式スクリプトは selectTargets で「コストにするカード」（リリース・除外・手札から捨てる等）を選び、
   cost の中で ctx.selectedTargets を読む。prepareDuelActivation は cost を selectTargets より先に呼ぶので、
   実際のデュエルでは cost が空の選択を読んで「コストを払えません」になり、発動できなかった。
   またコスト中に ctx へ控えた値（除外したモンスターの元々の攻撃力など）は、解決時に作り直される ctx へ届かなかった。

   ■ 宣言されたスクリプトだけ（cards/H4_claude_s03_cost_selection.js）
     1. 先に selectTargets を呼んで選ぶ
     2. cost を払う
     3. コストで場所が変わったカードは対象から外す（コストとして使われたカードは対象ではない）
     4. コスト中に ctx へ新しく書かれた JSON の基本値を CHAIN_ADD の costCtxS03 に載せ、解決時の ctx へ戻す
   ルール順序（コスト → 対象）そのものは変えない。コストにするカードの「選択」を先に行うだけで、
   本当の対象（コストで動かないカード）はコストの後もそのまま残る。
   ========================================================================= */
const COST_SELECTION_FIRST_S03 = new Set();
function declareCostSelectionFirstS03(names){ (names||[]).forEach(n=>COST_SELECTION_FIRST_S03.add(n)); }
function costSelectionFirstS03(name, sc){
  return !!sc && COST_SELECTION_FIRST_S03.has(name)
    && typeof sc.selectTargets==='function' && typeof sc.cost==='function' && typeof sc.activationV11!=='function';
}
/* cost の直前：ctx にあるキーと、選ばれたカードの場所を控える */
function costSelectionBeforeS03(ctx){
  const keys = new Set(Object.keys(ctx));
  const places = (ctx.selectedTargets||[]).map(t=>{
    const r = (typeof resolveTarget==='function') ? resolveTarget(t) : null;
    const c = r && r.card;
    if(!c) return null;
    ensureCardUid(gameState, c);
    return {uid:c.uid, zone:r.zone};
  });
  return {keys, places};
}
/* cost の直後：動いたカードを対象から外し、コスト中に書かれた値を costCtxS03 にまとめる */
function costSelectionAfterS03(ctx, before){
  const sel = ctx.selectedTargets || [];
  ctx.selectedTargets = sel.filter((t,i)=>{
    const pl = before.places[i];
    if(!pl) return true;
    const now = findCardByUid(pl.uid);
    return !!now && now.zone===pl.zone;
  });
  const extras = {};
  Object.keys(ctx).forEach(k=>{
    if(before.keys.has(k)) return;
    const v = ctx[k];
    if(v===null || typeof v==='number' || typeof v==='string' || typeof v==='boolean') extras[k] = v;
  });
  if(Object.keys(extras).length) ctx.costCtxS03 = extras;
}
