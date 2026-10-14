/* CODEX-C08 — generic field source that negates an activated monster effect.

   A face-up, non-negated monster script may declare:
     negateActivatedMonsterEffectS03(link, sourceCard, sourceDb, attribute)
   and return true. The source effect may have been activated in the hand, GY,
   or Monster Zone; this hook only concerns an activated monster effect, never a
   continuous effect. The chain link's activationPhase is authoritative for
   timing predicates even if resolution happens after the phase changes. */
function fieldActivatedMonsterEffectNegationS03(link, sourceCard){
  if(!link)return null;
  const sourceDb=sourceCard?dbOf(sourceCard):((link.cardId!=null&&CARD_DB[link.cardId])||null);
  if(!sourceDb||sourceDb.k!=='m')return null;
  let attribute=sourceDb.at;
  const loc=sourceCard&&locateCardAnyV4(sourceCard);
  if(loc&&loc.zone==='mz'&&sourceCard.face==='up'&&typeof currentAttributeV17==='function')attribute=currentAttributeV17(sourceCard);
  for(let p=0;p<2;p++){
    for(const card of gameState.players[p].mz||[]){
      if(!card||card.face!=='up'||card.activationPending||card.activationNegated)continue;
      if(typeof effectNegated==='function'&&effectNegated(card))continue;
      const sc=CARD_SCRIPTS[cardName(card)],fn=sc&&sc.negateActivatedMonsterEffectS03;
      if(typeof fn!=='function')continue;
      try{
        if(fn(link,sourceCard,sourceDb,attribute))return {source:card,reason:cardName(card)};
      }catch(e){}
    }
  }
  return null;
}
