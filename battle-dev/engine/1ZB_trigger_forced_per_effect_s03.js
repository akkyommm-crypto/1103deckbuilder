/* =========================================================================
   S03-U44 — 効果ごとの強制誘発（v4 unified card の effect.forced）
   -------------------------------------------------------------------------
   同時誘発（SEGOC）の順位・強制群の判定はスクリプト全体の sc.forced だけを見ていた。
   defineUnifiedCardV4([...]) の中で effect に forced:true を書いたカード（効果ごとに強制／任意が違うカード）は、
   強制誘発なのに任意として並び、スキップもできた。
   ■ 候補ごとに、その発動イベントで選ばれる v4 effect の forced を使う。v4 でない・選べない場合は従来どおり sc.forced。
   新しい gameState キーや Action は作らない。
   ========================================================================= */
function triggerCandidateForcedS03(c){
  if(!c) return false;
  const sc = (typeof CARD_SCRIPTS !== 'undefined') ? CARD_SCRIPTS[c.name] : null;
  if(!sc) return false;
  if(sc.v4Unified && typeof nativeEffectsV4 === 'function' && typeof v4SelectEffectForContext === 'function'){
    const effects = nativeEffectsV4(c.name) || [];
    if(effects.some(e => e && e.forced === true)){
      const base = c.ctx || {};
      const probe = Object.assign({}, base, {eventName: c.eventName || base.eventName, event: c.event || base.event, v4EffectKey: null});
      let e = null;
      try{ e = v4SelectEffectForContext(c.name, probe); }catch(err){ e = null; }
      if(e) return e.forced === true || !!sc.forced;
    }
  }
  /* S03-U116: 非v4スクリプトでも、発動イベントごとに強制／任意が違うカード（カラクリ兵 弐参六 等）は forcedForEventS03 で決める */
  if(typeof sc.forcedForEventS03 === 'function'){
    /* S03-U120: 2つ目の引数に候補の ctx（同じイベントでも状態で強制／任意が変わる No.39 希望皇ホープ②） */
    try{ return !!sc.forcedForEventS03(c.eventName || (c.ctx && c.ctx.eventName) || null, c.ctx || null); }catch(err){}
  }
  return !!sc.forced;
}
