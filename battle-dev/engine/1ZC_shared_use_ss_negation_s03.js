/* S03-U46 (C-S03-37) SHARED_USE_AND_SPECIAL_SUMMON_EFFECT_LINK
   1. 「この効果は相手プレイヤーも使用する事ができる」（《王宮の弾圧》）: a face-up card on the opponent's field that declares
      sharedUseS03:true is offered to the responding player in chain responses and in the summon-negation window.
      The candidate carries ownerS03 (the zone owner); the activation paths pass it to prepareDuelActivation as zoneOwnerS03,
      and CHAIN_ADD records zoneOwnerS03 only when it differs from the activating player (existing digests unchanged).
      The activating player pays the cost and owns the chain link (2011 wiki 《王宮の弾圧》 age 42: FAQ 09/03/15 — the player who
      uses it pays 800; the text lets either player use the effect).
   2. SPECIAL_SUMMON_EFFECT_LINK: one reader for 「モンスターを特殊召喚する効果を含む…が発動した時」 (《神の警告》《王宮の弾圧》).
      A link qualifies when it is not a card activation only (U10) and its script declares includesSpecialSummon (true, or a
      function of the link for cards whose other effects do not Special Summon), or the declaration table below says so
      (the table wins over the script flag). 2011 wiki 《王宮の弾圧》 age 42: effects of a card that Special Summons, other than
      the Special Summon effect, cannot be answered (09/04/15); for Continuous / Field Spells only the effect activation that
      Special Summons can be answered, not the card activation (09/07/06). */
const SPECIAL_SUMMON_EFFECT_DECL_S03 = new Map();
function declareSpecialSummonEffectS03(entries){
  Object.keys(entries||{}).forEach(n=>SPECIAL_SUMMON_EFFECT_DECL_S03.set(n, entries[n]));
}
function specialSummonEffectLinkS03(link, opts){
  if(!link || !link.name || link.cardActivationOnly) return false;
  /* S03-U47: 《神の警告》 answers card activations of Spells / Traps but not their effect activations (2011 wiki age 35: 10/04/17, 11/01/05) */
  if(opts && opts.excludeSpellTrapEffect && link.cardActivationS03!==true){
    const d = (typeof dbOfByChainV350==='function') ? dbOfByChainV350(link) : null;
    if(d && (d.k==='s' || d.k==='t')) return false;
  }
  let decl = SPECIAL_SUMMON_EFFECT_DECL_S03.has(link.name) ? SPECIAL_SUMMON_EFFECT_DECL_S03.get(link.name)
           : (CARD_SCRIPTS[link.name] ? CARD_SCRIPTS[link.name].includesSpecialSummon : undefined);
  if(typeof decl === 'function'){ try{ return !!decl(link); }catch(e){ return false; } }
  return decl === true;
}
function inDamageStepS03(){
  return !!(gameState && (gameState.battle || (gameState.timingWindow && gameState.timingWindow.kind==='damageStep')));
}
/* chain responses: the opponent's face-up shared-use cards (legality with the responding player as the user) */
function sharedUseResponseCandidatesS03(p){
  const op = p===0?1:0, O = gameState.players[op], out = [];
  if(!O || !Array.isArray(O.sz)) return out;
  const top = chainTopSpeed();
  O.sz.forEach((c,i)=>{
    if(!c || c.face!=='up') return;
    const db = dbOf(c), nm = db.n||'', sc = CARD_SCRIPTS[nm];
    if(!sc || sc.sharedUseS03!==true || typeof sc.resolve!=='function') return;
    const ss = scriptSpellSpeed(sc,db); if(ss<top || ss<2) return;
    const base = (typeof activationResponseOptsS03==='function') ? activationResponseOptsS03(nm,{}) : {};
    const L = strictScriptLegalityV2(nm,p,'sz',i,Object.assign({},base,{cardOverride:c}));
    if(L.ok) out.push({p,zone:'sz',index:i,card:c,db,ss,ownerS03:op});
  });
  return out;
}
/* summon-negation window: the summoning player's face-up shared-use negators, used by the other player */
function sharedUseSummonNegatorsS03(pending){
  const out = [];
  if(!pending || (pending.player!==0 && pending.player!==1)) return out;
  const rp = pending.player===0?1:0, O = gameState.players[pending.player];
  (O.sz||[]).forEach((c,i)=>{
    if(!c || c.face!=='up') return;
    const db = dbOf(c), sc = CARD_SCRIPTS[db.n];
    if(!sc || sc.sharedUseS03!==true || !sc.summonNegate) return;
    const sn = sc.summonNegate;
    if(sn.specialOnly && pending.kind==='normal') return;
    if(sn.kinds && !sn.kinds.includes(pending.kind)) return;
    const L = strictScriptLegalityV2(db.n,rp,'sz',i,{ignoreTiming:true,cardOverride:c});
    if(L.ok) out.push({p:rp,zone:'sz',index:i,card:c,db,ss:scriptSpellSpeed(sc,db),ownerS03:pending.player});
  });
  return out;
}
