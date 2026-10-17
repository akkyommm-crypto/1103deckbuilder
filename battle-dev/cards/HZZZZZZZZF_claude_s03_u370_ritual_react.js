/* S03-U370: three cards that react to or use a Ritual Summon (carddata texts; the Ritual Summon success event of S03-U369).

   昇華する魂      （永続魔法）儀式モンスターが儀式召喚に成功した時、その儀式召喚でリリースした自分の墓地のモンスター1体を選択して手札に加える事ができる。1ターンに1度。
   宣告者の預言    （儀式魔法）「神光の宣告者」の降臨に必要。自分の手札・フィールドから、レベルの合計が6になるようにモンスターをリリースしなければならない。このカードの効果によって「神光の宣告者」が儀式召喚に成功した時、自分の墓地のこのカードを除外する事で、その儀式召喚のためにリリースしたモンスター1体を選択し、墓地から手札に戻す。
   神光の宣告者    （儀式）「宣告者の預言」により降臨。相手がモンスターの効果・魔法・罠カードを発動した時、手札から天使族モンスター1体を墓地へ送って発動できる。その発動を無効にし破壊する。

   Notes
   - The materials of a Ritual Summon are read with usedAsMaterialForSummonV3(material, summoned, 'ritual') (engine/12 provenance): the released monsters that are now in my Graveyard.
   - 宣告者の預言: registerRitualSpecV24 (levelMode 'exact', 6) + v5DefineRitualSpell; the Graveyard clause is a Graveyard trigger on the success event of 神光の宣告者 (神光の宣告者 can only be Ritual Summoned by this Spell).
   - 神光の宣告者: a quick monster effect (priority 3, as 緑光の宣告者) answering any opponent activation. */

/* ---- 昇華する魂 ---- */
function u370RitualMats(ctx){
  const e = ctx.event || {};
  const cards = Array.isArray(e.cards) ? e.cards : (e.card ? [e.card] : []);
  const out = [];
  cards.forEach(c=>{
    const h = c ? findCardByUid(ensureCardUid(gameState, c)) : null;
    if(!h || h.zone!=='mz' || h.p!==ctx.player || c.specialSummonKind!=='ritual') return;
    API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && usedAsMaterialForSummonV3(x.card, c, 'ritual')).forEach(x=>out.push(x));
  });
  return out;
}
function u370SoulReady(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && Number(ctx.card.u370SoulTurn)!==Number(gameState.turn) && u370RitualMats(ctx).length>0; }
defineUnifiedCardV4('昇華する魂', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'retrieve', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ return u370SoulReady(ctx); },
  operation(ctx){
    const pool = u370RitualMats(ctx); if(!pool.length) return;
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u370SoulTurn', gameState.turn, '昇華する魂', {silent:true});
    API.selectCard('昇華する魂：手札に加える儀式召喚でリリースしたモンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, '昇華する魂'); });
  },
  afterResolve(){}
}], {type:'spell', priority:1, onOtherSummon:true, passive:{ onSpecialSummon(ctx){ return u370SoulReady(ctx); } } });

/* ---- 宣告者の預言 ---- */
registerRitualSpecV24('宣告者の預言', {monsters:['神光の宣告者'], level:6, levelMode:'exact'});
function u370ProphecyReady(ctx){
  const e = ctx.event || {};
  const cards = Array.isArray(e.cards) ? e.cards : (e.card ? [e.card] : []);
  const c = cards.find(x=>x && x.specialSummonKind==='ritual' && dbOf(x).n==='神光の宣告者');
  if(ctx.zone!=='grave' || !c) return null;
  const h = findCardByUid(ensureCardUid(gameState, c)); if(!h || h.zone!=='mz' || h.p!==ctx.player) return null;
  return c;
}
defineUnifiedCardV4('宣告者の預言', [{
  key:'ritual-summon', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return API.ritualCanActivate(ctx.player, '宣告者の預言'); },
  operation(ctx){ API.ritualSummon(ctx, '宣告者の預言'); },
  afterResolve(){}
}, {
  key:'return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ const c = u370ProphecyReady(ctx); return !!c && API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && usedAsMaterialForSummonV3(x.card, c, 'ritual')).length>0 && !u342Bad(); },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave'){ done(false); return; } API.banish(me, '宣告者の預言（コスト）'); done(true); },
  operation(ctx){
    const c = u370ProphecyReady({zone:'grave', card:ctx.card, event:ctx.event, player:ctx.player}) || (ctx.event && (ctx.event.card || (ctx.event.cards||[])[0]));
    const pool = API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && c && usedAsMaterialForSummonV3(x.card, c, 'ritual')); if(!pool.length) return;
    API.selectCard('宣告者の預言：手札に戻すリリースしたモンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, '宣告者の預言'); });
  },
  afterResolve(){}
}], {type:'spell', priority:1, includesSpecialSummon:true, onOtherSummon:true, activateFrom:['sz','hand','grave'], passive:{ onSpecialSummon(ctx){ const c = u370ProphecyReady(ctx); return !!c && API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && usedAsMaterialForSummonV3(x.card, c, 'ritual')).length>0; } } });

/* ---- 神光の宣告者 ---- */
function u370Angels(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.ra==='天使'); }
defineScript('神光の宣告者', {
  type:'monster', priority:3, quickEffect:true, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    const l = gameState.chain[gameState.chain.length-1];
    if(!l || l.player===ctx.player){ ctx.reason = '相手の発動にチェーンします'; return false; }
    if(!u370Angels(ctx).length){ ctx.reason = '手札に天使族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('神光の宣告者：墓地へ送る天使族', u370Angels(ctx), t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, '神光の宣告者（コスト）', {byEffect:false}); done(true); });
  },
  resolve(){ negatePreviousChainLinkV2('神光の宣告者', true, 'activation'); },
  afterResolve(){}
});
