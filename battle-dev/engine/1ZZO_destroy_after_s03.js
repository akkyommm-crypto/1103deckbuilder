/* =========================================================================
   S03-U294 — 「破壊した数」「破壊した場合」: what the effect actually destroyed, after the substitute decisions
   -------------------------------------------------------------------------
   Two defects in the scripts that use the result of their own destruction:
   - Counting the cards before (or without checking) the destruction: a card that is not destroyed (「カードの効果では破壊されない」, a
     substitute) was counted (グリフォンの羽根帚, サンダー・クラッシュ …).
   - An optional destruction substitute (engine/1ZV, S03-U173) defers every destruction of the resolution until its controller has decided;
     a script step right after API.destroy saw the board before the decision (documented limit of S03-U173).
   API:
   - destroyMarkS03()                    → a mark (the length of this turn's destruction log, engine/1M destroyedThisTurnV30).
   - destroyedSinceS03(mark, uids?)      → the uids destroyed since the mark (optionally only those in `uids`), in order, no duplicates.
     The log has every destruction (effect, mass destruction, battle; a 宝玉獣 placed instead of the GY is destroyed too).
   - API.afterDestroyS03(handler, args)  → runs the registered continuation `handler(args)` once the destructions of this resolution are done:
     now when none is deferred, or after the substitute decisions and the deferred destructions (inside the same chain link: the link's
     source / P3 player are restored). args is plain JSON (it is kept in the decision's saved job).
   - registerDestroyAfterS03(name, fn)   → fn(args) registered at load (like the choice handlers).
   ========================================================================= */
const DESTROY_AFTER_HANDLERS_S03 = {};
function registerDestroyAfterS03(name, fn){ DESTROY_AFTER_HANDLERS_S03[name] = fn; }
function destroyMarkS03(gs){
  gs = gs || gameState;
  return (typeof ensureDestroyLogV30 === 'function') ? ensureDestroyLogV30(gs).length : 0;
}
function destroyedSinceS03(mark, uids, gs){
  gs = gs || gameState;
  const log = (typeof ensureDestroyLogV30 === 'function') ? ensureDestroyLogV30(gs) : [];
  const want = Array.isArray(uids) ? uids.map(Number) : null;
  const out = [];
  log.slice(Math.max(0, Number(mark) || 0)).forEach(e=>{
    if(!e || e.uid == null || Number(e.turn) !== Number(gs.turn)) return;
    const u = Number(e.uid);
    if(want && want.indexOf(u) < 0) return;
    if(out.indexOf(u) < 0) out.push(u);
  });
  return out;
}
function destroyAfterS03(handler, args){
  const entry = {h:String(handler), args:JSON.parse(JSON.stringify(args || {})),
    player:(typeof P3_EFFECT_CONTEXT !== 'undefined' && P3_EFFECT_CONTEXT) ? P3_EFFECT_CONTEXT.player : null};
  if(typeof DESTROY_SUB_BATCH_S03 !== 'undefined' && DESTROY_SUB_BATCH_S03){
    (DESTROY_SUB_BATCH_S03.after || (DESTROY_SUB_BATCH_S03.after = [])).push(entry);
    if(typeof trace === 'function') trace(`破壊の結果を使う処理：身代わりの選択の後に実行（${entry.h}）`);
    return false;
  }
  runDestroyAfterS03(entry);
  return true;
}
function runDestroyAfterS03(entry){
  const fn = entry && DESTROY_AFTER_HANDLERS_S03[entry.h];
  if(typeof fn !== 'function') return;
  /* deferred run: the resolution's P3 player (the move provenance of what the continuation does) */
  const hadCtx = (typeof P3_EFFECT_CONTEXT !== 'undefined') ? P3_EFFECT_CONTEXT : null;
  if(!hadCtx && (entry.player === 0 || entry.player === 1) && typeof p3BeginEffectContextV3 === 'function') p3BeginEffectContextV3(entry.player);
  try{ fn(JSON.parse(JSON.stringify(entry.args || {}))); }
  finally{ if(!hadCtx && typeof p3EndEffectContextV3 === 'function') p3EndEffectContextV3(); }
}
/* API.afterDestroyS03 / destroyMarkS03 / destroyedSinceS03 are on the API object (engine/40). */
/* shared continuation: 「(X を)破壊し、破壊した場合 / 破壊したモンスターの…分 LP を増減する」 — args {mark, uids, to, n, op:'damage'|'recover', min}
   (n is fixed before the destruction: the destroyed card's last known value; min = how many of uids must be destroyed, default 1) */
registerDestroyAfterS03('s03u294.if-destroyed-lp', a=>{
  const got = destroyedSinceS03(a.mark, a.uids).length;
  if(got < Math.max(1, Number(a.min) || 1) || !(Number(a.n) > 0)) return;
  if(a.op === 'recover') API.recoverLP(a.to, Number(a.n)); else API.damageLP(a.to, Number(a.n));
});
