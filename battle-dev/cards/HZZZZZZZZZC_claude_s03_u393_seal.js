/* S03-U393: 封魔の呪印, 暴君の暴言, 暗黒界の書物 (NOT_STARTED cards, carddata texts).

   封魔の呪印    （カウンター罠）手札から魔法カードを1枚捨てる。魔法カードの発動と効果を無効にし、それを破壊する。相手はこのデュエル中、この効果で破壊された魔法カード及び同名カードを発動する事ができない。
   暴君の暴言    （永続罠）自分フィールド上に存在するモンスター2体をリリースして発動する。このカードがフィールド上に存在する限り、お互いに手札及びフィールド上で発動する効果モンスターの効果を発動できない。
   暗黒界の書物  （永続魔法）自分のエンドフェイズ時に手札枚数制限によって手札を墓地に捨てた場合、その中にモンスターカードが含まれていれば1体のみ自分フィールド上に特殊召喚する事ができる。

   Notes
   - 封魔の呪印 copies ヴィクティム・カウンター (S03-U340): onActivateSuccess of a Spell of the opponent; the cost discards a Spell of my hand; the destroyed Spell's name goes into effectFlags.activationBanNamesS03 of the opponent (engine/1ZD reads it for every card activation of that name, duel-long).
   - 暴言: the cost releases two of my monsters (sent to the Graveyard); activationLockS03 for monster effects activated in the hand or on the field while the card stands face-up in the Spell & Trap Zone (engine/1ZD, S03-U217 / U259).
   - 暗黒界の書物: engine/1ZZJ calls handLimitDiscardS03(player, uids, card) of every face-up Spell / Trap / Field card after the hand-limit discard; the optional Special Summon of ONE discarded monster is asked with a confirm and a card choice. */

/* ---- 封魔の呪印 ---- */
function u393Spells(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='s'); }
function u393FoeSpell(ctx){
  if(typeof d2FoeSpell==='function' && d2FoeSpell(ctx)) return true;
  const top = gameState.chain && gameState.chain[gameState.chain.length-1];
  if(!top || top.player!==ctx.opponent) return false;
  const db = CARD_DB[findCardIndex(top.name)];
  return !!db && db.k==='s';
}
defineScript('封魔の呪印', {
  type:'trap', priority:3,
  condition(ctx){
    if(!u393FoeSpell(ctx)){ ctx.reason = '相手が魔法カードを発動した時に発動します'; return false; }
    if(!u393Spells(ctx).length){ ctx.reason = '手札に魔法カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u393Spells(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('封魔の呪印：捨てる手札の魔法カード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '封魔の呪印（コスト）'); done(true);
    });
  },
  resolve(ctx){
    const e = ctx.event, top = gameState.chain && gameState.chain[gameState.chain.length-1];
    let nm = null;
    if(e && e.cardId!=null && CARD_DB[e.cardId]) nm = CARD_DB[e.cardId].n;
    else if(e && e.name) nm = e.name;
    else if(top && top.player===ctx.opponent) nm = top.name;
    if(e && e.kind==='spell') API.negateChainLink(e, 'activation', '封魔の呪印', true); else negatePreviousChainLinkV2('封魔の呪印', true);
    if(!nm) return;
    const cur = API.getFlag(ctx.opponent, 'activationBanNamesS03');
    const list = Array.isArray(cur) ? cur.slice() : [];
    if(list.indexOf(nm)<0) list.push(nm);
    API.setFlag(ctx.opponent, 'activationBanNamesS03', list, false);
    API.log(`封魔の呪印：相手は「${nm}」を発動できなくなった`);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && u393FoeSpell(ctx) && u393Spells(ctx).length>0; } }
});

/* ---- 暴君の暴言 ---- */
function u393Mine(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:()=>true}); }
function u393Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
defineUnifiedCardV4('暴君の暴言', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){
    const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz' && ctx.card.face==='up') return false;
    if(u393Mine(ctx).length<2){ ctx.reason = '自分フィールドにモンスターが2体以上必要です'; return false; }
    return true;
  },
  cost(ctx, done){ u342PickN('暴君の暴言：リリースするモンスター', ctx, u393Mine, 2, h=>API.sendToGrave(h, '暴君の暴言（リリース）'), done); },
  operation(){}, afterResolve(){}
}], {type:'trap', priority:2,
  activationLockS03:(i)=> i.db.k==='m' && (i.zone==='hand' || i.zone==='mz') });

/* ---- 暗黒界の書物 ---- */
function u393Pool(p, uids){
  return (uids||[]).map(u=>findCardByUid(u)).filter(h=>h && h.zone==='grave' && h.p===p && dbOf(h.card).k==='m' && canEffectSpecialSummonS03(h.card, 'grave', '暗黒界の書物')).map(h=>({card:h.card, db:dbOf(h.card), index:h.index, p:h.p, zone:'grave'}));
}
defineScript('暗黒界の書物', {
  type:'spell', priority:1,
  condition(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; } return true; },
  resolve(){}, afterResolve(){},
  handLimitDiscardS03:(p, uids, card)=>{
    if(!hasMonsterZoneSpace(p)) return;
    const pool = u393Pool(p, uids); if(!pool.length) return;
    API.confirm('暗黒界の書物', '手札制限で捨てたモンスターを1体特殊召喚しますか？', ()=>{
      const pool2 = u393Pool(p, uids); if(!pool2.length || !hasMonsterZoneSpace(p)) return;
      API.selectCard('暗黒界の書物：特殊召喚するモンスター', pool2, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='grave' || r.p!==p || !hasMonsterZoneSpace(p)) return;
        API.specialSummon(p, 'grave', r.index, 'atk', '暗黒界の書物');
      });
    }, ()=>{});
  }
});
