/* U549 精霊術師 ドリアード: existing Ritual + multi-Attribute primitives.
 WIKI-3C92BFBE2E22: continuous, face-up field only. WIKI-390DDB452DEC (2008-07-19)
 and WIKI-96FC45C770AA (2007-11-07): face-down / banished identity is LIGHT only.
 WIKI-A2CF6AF01BCB (2009-07-21): DNA attribute override replaces all Attributes.
 WIKI-D2C0C8A834B7 / WIKI-82CAF53C9483 / WIKI-E31E562661B6 are interaction
 evidence; their questions and answers were also read in the archive. */
defineScript('精霊術師 ドリアード',u426Passive({
  continuous:{scope:'self',from:['mz'],apply(){return null;},
    additionalAttributes(card,self){
      if(card!==self || card.face!=='up')return [];
      if(continuousCharV17(card,'attrOverride')!=null || charModValueV17(card,'attr')!=null)return [];
      return ['風','水','炎','地'];
    }}
}));
