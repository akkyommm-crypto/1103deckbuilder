/* S03-U546 竜宮の白タウナギ.
 WIKI-F7EA5A07CF4B / WIKI-CCF9A02413F8 (2009-09-19): this is a rule,
 not a monster effect, and Skill Drain does not negate it.
 Existing synchroMaterialRestriction is evaluated for every candidate set,
 including the beginExSummonV2 legality guard; no parallel summon path. */
defineScript('竜宮の白タウナギ',u426Passive({
  synchroMaterialRestriction(info){
    return !!info && Array.isArray(info.set) && info.set.every(x=>{
      const card=x.card || x.c;
      return card===info.source || (card && info.source && card.uid===info.source.uid)
        || (card ? currentRaceV17(card) : x.db && x.db.ra)==='魚';
    });
  }
}));
