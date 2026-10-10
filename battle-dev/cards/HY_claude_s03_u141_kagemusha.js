/* S03-U141: 六武衆の影武者 (ENGINE_GAP; fixed Six Samurai list x3)
   自分フィールド上に表側表示で存在する「六武衆」と名のついたモンスター1体が魔法・罠・効果モンスターの効果の対象になった時、
   その効果の対象をフィールド上に表側表示で存在するこのカードに移し替える事ができる。
   - a chain response to the activation that targets (declared in ACTIVATION_RESPONSE_S03: it answers the top chain link);
   - that link must come from a Spell, a Trap or a monster effect and target exactly one card: a face-up 「六武衆」 monster
     (P4 group SIX_SAMURAI_NAMED) its controller controls, other than this card;
   - at resolution, if the link is still on the chain, still targets that monster and this card is still face-up on the
     field, the link's targets become this card (CHAIN_RETARGET_S03, journaled). */
function kagemushaTargetLinkS03(ctx){
  const e = ctx.event;
  if(!e || e.chainId==null || !(e.kind==='spell' || e.kind==='trap' || e.kind==='monster')) return null;
  const link = (gameState.chain||[]).find(l=>l && l.chainId===e.chainId);
  if(!link || link.negated || !link.targets) return null;
  const restored = deserializeChainSelectionV2(link.targets);
  const list = (Array.isArray(restored) ? restored : [restored]).filter(Boolean);
  if(list.length !== 1) return null;
  const h = list[0] && list[0].card ? locateCardAnyV4(list[0].card) : null;
  if(!h || h.zone!=='mz' || h.p!==ctx.player || !h.card || h.card.face!=='up' || h.card===ctx.card) return null;
  if(!isCardInGroupV4(h.card, GROUP.SIX_SAMURAI_NAMED)) return null;
  return {link, target:h};
}
defineScript('六武衆の影武者', {
  type:'monster', priority:2, quickEffect:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動できます'; return false; }
    if(!kagemushaTargetLinkS03(ctx)){ ctx.reason = '自分の表側表示の「六武衆」1体が効果の対象になった時に発動できます'; return false; }
    return true;
  },
  resolve(ctx){
    const hit = kagemushaTargetLinkS03(ctx);
    const me = locateCardAnyV4(ctx.card);
    if(!hit || !me || me.zone!=='mz' || me.card.face!=='up'){ API.log('六武衆の影武者：対象を移し替えられない'); return; }
    act({type:'CHAIN_RETARGET_S03', chainId:hit.link.chainId, targets:serializeChainSelectionV2([me]), reason:'六武衆の影武者'});
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='mz' && !!kagemushaTargetLinkS03(ctx); } }
});
declareActivationResponseS03(['六武衆の影武者']);
