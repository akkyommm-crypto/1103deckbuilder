/* S03-U462: インヴェルズの門番 (2011 text / ruling).
   A live source records a qualifying face-up Invellz Advance Summon. All
   copies share one additional Normal Summon/Set for the turn; the source may
   itself be Tributed while carrying out that additional action. */
defineScript('インヴェルズの門番', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason='永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ extraNormalS03:{
    sharedKey:'invellzGatekeeper',
    allowSet:true,
    qualifiesOnNormalSummon(card){
      return !!card && Number(card.tributeCount||0)>0 && isSetCardV4(dbOf(card),SETCODE.INVELLZ);
    },
    active(db,player,source){ return Number(source.extraNormalS03Turn)===Number(gameState.turn); },
    filter(db){ return !!db && db.k==='m'; }
  } }
});
