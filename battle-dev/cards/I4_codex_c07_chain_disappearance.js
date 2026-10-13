/* CODEX-C07 — 連鎖除外.
   The old ENGINE_GAP pin predated summon-batch events, canonical-name identity,
   and deterministic hidden-pile actions. The effect makes no choice in hidden
   information: every matching hand/Deck card is banished automatically. */
function c07ChainDisappearanceCards(ctx){
  const ev=ctx.event||{};
  const cards=Array.isArray(ev.cards)?ev.cards:(ev.card?[ev.card]:[]);
  return cards.map(card=>{
    const h=locateCardAnyV4(card);
    return (h&&h.zone==='mz'&&card.face==='up'&&curATK(card)<=1000)
      ? {p:h.p,zone:h.zone,index:h.index,card,db:dbOf(card)} : null;
  }).filter(Boolean);
}

defineScript('連鎖除外',{
  type:'trap',priority:2,targets:false,onOtherSummon:true,onOtherFlipS03:true,
  condition(ctx){
    if(!c07ChainDisappearanceCards(ctx).length){
      ctx.reason='このタイミングで召喚された表側表示・攻撃力1000以下のモンスターがいません';
      return false;
    }
    return true;
  },
  resolve(ctx){
    const names=[];
    /* The official ruling rechecks face-up status and current ATK on resolution. */
    c07ChainDisappearanceCards(ctx).slice().forEach(t=>{
      const h=locateCardAnyV4(t.card);
      if(!h||h.zone!=='mz'||h.card.face!=='up'||curATK(h.card)>1000)return;
      const printed=dbOf(h.card);
      API.banish(h,'連鎖除外（召喚されたモンスター）');
      const after=locateCardAnyV4(t.card);
      if(after&&after.zone==='banish'&&!names.some(d=>sameCanonicalCardV4(d,printed)))names.push(printed);
    });
    if(!names.length)return;
    const p=ctx.opponent,P=gameState.players[p];
    for(let i=P.hand.length-1;i>=0;i--){
      const c=P.hand[i];
      if(names.some(d=>sameCanonicalCardV4(dbOf(c),d)))API.banish({p,zone:'hand',index:i,card:c},'連鎖除外（手札の同名カード）');
    }
    for(let i=P.deck.length-1;i>=0;i--){
      const c=P.deck[i];
      if(names.some(d=>sameCanonicalCardV4(dbOf(c),d)))API.banish({p,zone:'deck',index:i,card:c},'連鎖除外（デッキの同名カード）');
    }
    API.shuffle(p);
  },
  passive:{
    onNormalSummon(ctx){return ctx.zone==='sz'&&ctx.card.face==='down'&&c07ChainDisappearanceCards(ctx).length>0;},
    onSpecialSummon(ctx){return ctx.zone==='sz'&&ctx.card.face==='down'&&c07ChainDisappearanceCards(ctx).length>0;},
    onFlip(ctx){return ctx.zone==='sz'&&ctx.card.face==='down'&&c07ChainDisappearanceCards(ctx).length>0;}
  }
});
