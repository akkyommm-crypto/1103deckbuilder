/* S03-U355: four Counter Traps that read the top chain link (carddata texts).

   透破抜き          手札・墓地でモンスターの効果が発動した時に発動できる。その発動を無効にし除外する。
   王家の呪い        フィールドの魔法・罠カード1枚のみを対象として、そのカードを破壊する魔法・罠カードが発動した時に発動できる。その発動を無効にし破壊する。
   六尺瓊勾玉        自分フィールドに「六武衆」モンスターが存在し、カードを破壊するモンスターの効果・魔法・罠カードを相手が発動した時に発動できる。その発動を無効にし破壊する。
   エンペラー・オーダー  モンスターが召喚に成功した時に発動するモンスターの効果が発動した時に発動できる。その発動を無効にする。その後、発動を無効にされたプレイヤーはデッキから1枚ドローする。

   Notes
   - The chain link (gameState.chain top) carries name / player / from (the zone it was activated from) / eventName / targets; the effect category 「破壊」 is the engine's own (linkHasCategoryV19(gameState, link, 'destroy')) and the targets are read with linkTargetsV19.
   - negatePreviousChainLinkV2(reason, destroySource): 透破抜き negates without destroying and banishes the monster itself; 六尺瓊勾玉 / 王家の呪い negate and destroy the source; エンペラー・オーダー negates only and the owner of the negated link draws. */

function u355Top(){ return gameState.chain && gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null; }
function u355TopDb(top){ const i = top ? findCardIndex(top.name) : -1; return i>=0 ? CARD_DB[i] : null; }

/* ---- 透破抜き ---- */
defineScript('透破抜き', {
  type:'counter', priority:3,
  condition(ctx){
    const top = u355Top(), db = u355TopDb(top);
    if(!top || !db || db.k!=='m' || (top.from!=='hand' && top.from!=='grave')){ ctx.reason = '手札・墓地でモンスターの効果が発動した時に発動できます'; return false; }
    return true;
  },
  resolve(){
    const top = u355Top(); if(!top) return;
    const uid = top.uid;
    negatePreviousChainLinkV2('透破抜き', false);
    const h = uid!=null ? findCardByUid(uid) : null;
    if(h && (h.zone==='hand' || h.zone==='grave')) API.banish(h, '透破抜き');
  },
  afterResolve(){}
});

/* ---- 王家の呪い ---- */
function u355SingleSTTarget(top){
  if(!top) return false;
  const db = u355TopDb(top);
  if(!db || (db.k!=='s' && db.k!=='t')) return false;
  if(typeof linkHasCategoryV19!=='function' || !linkHasCategoryV19(gameState, top, 'destroy')) return false;
  const ts = typeof linkTargetsV19==='function' ? linkTargetsV19(gameState, top) : [];
  return ts.length===1 && (ts[0].zone==='sz' || ts[0].zone==='field');
}
defineScript('王家の呪い', {
  type:'counter', priority:3,
  condition(ctx){ if(!u355SingleSTTarget(u355Top())){ ctx.reason = 'フィールドの魔法・罠カード1枚のみを対象に破壊する魔法・罠カードの発動時に発動できます'; return false; } return true; },
  resolve(){ negatePreviousChainLinkV2('王家の呪い', true); },
  afterResolve(){}
});

/* ---- 六尺瓊勾玉 ---- */
defineScript('六尺瓊勾玉', {
  type:'counter', priority:3,
  condition(ctx){
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && String(x.db.n||'').indexOf('六武衆')>=0}).length){ ctx.reason = '自分フィールドに「六武衆」モンスターがいません'; return false; }
    const top = u355Top();
    if(!top || top.player!==ctx.opponent || typeof linkHasCategoryV19!=='function' || !linkHasCategoryV19(gameState, top, 'destroy')){ ctx.reason = 'カードを破壊する相手の効果の発動時に発動できます'; return false; }
    return true;
  },
  resolve(){ negatePreviousChainLinkV2('六尺瓊勾玉', true); },
  afterResolve(){}
});

/* ---- エンペラー・オーダー ---- */
defineScript('エンペラー・オーダー', {
  type:'counter', priority:3,
  condition(ctx){
    const top = u355Top(), db = u355TopDb(top);
    if(!top || !db || db.k!=='m' || top.eventName!=='onNormalSummon'){ ctx.reason = 'モンスターが召喚に成功した時に発動するモンスターの効果の発動時に発動できます'; return false; }
    return true;
  },
  resolve(){
    const top = u355Top(); if(!top) return;
    const p = top.player;
    negatePreviousChainLinkV2('エンペラー・オーダー', false);
    API.draw(p, 1);
  },
  afterResolve(){}
});
