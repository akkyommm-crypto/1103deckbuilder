/* CODEX-C08 — コアキメイル・デビル.
   Official ruling: the upkeep is the established Koa'ki maintenance path; the
   continuous effect negates LIGHT/DARK monster effects activated during either
   Main Phase, including effects activated from the hand or GY. */
defineUnifiedCardV4('コアキメイル・デビル',[
  u321UpkeepEffect(db=>db.k==='m'&&db.ra==='悪魔')
],u321UpkeepMeta({
  negateActivatedMonsterEffectS03(link,sourceCard,sourceDb,attribute){
    return !!link&&['main1','main2'].includes(link.activationPhase)&&(attribute==='光'||attribute==='闇');
  }
}));
