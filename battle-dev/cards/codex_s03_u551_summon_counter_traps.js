/* Codex S03-U551: four Counter Traps on the existing summon-negation window.
   1103 carddata text. WIKI-BE54F41A867F (2008-04-25) / WIKI-B48061A5FA11
   (2008-07-25): one's own face-down Psychic / Plant may pay the release cost.
   WIKI-BB0B6F6D3ED2 (2008-09-23): Polinosis cannot negate a chain-starting
   Special Summon effect. A Spell/Trap CARD activation remains a separate legal case.
   Saber Hole / Champion's Vigilance: historical DB has no additional FAQ evidence.
   Tokens are Normal Monsters although the legacy treatedAsNormal helper omits them;
   include them explicitly for Champion while Troll separately excludes tokens.
   No onNormalSummon passive: this responds BEFORE success, via summonNegate. */
function u551SupportS03(ctx, kind){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>{
    const ps=gameState.pendingSummon;
    const gemini=ps && (ps.geminiS03===true || (ps.resumeS03&&ps.resumeS03.geminiS03===true));
    if(ps && !gemini && x.card.uid===ps.uid) return false;
    if(kind==='saber') return x.card.face==='up' && isCardInGroupV4(x.card,GROUP.XSABER);
    if(kind==='normal7') return x.card.face==='up' && (!!x.card.token || treatedAsNormal(x.card)) && !geminiActiveS03(x.card) && curLV(x.card)>=7;
    return !x.card.cannotTribute && (x.card.face==='up'?currentRaceV17(x.card):x.db.ra)===kind;
  }});
}
function u551CardActivationS03(){
  const top=(gameState.chain||[]).slice(-1)[0];
  const db=top && dbOfByChainV350(top);
  return !!(top && top.cardActivationS03===true && db && (db.k==='s'||db.k==='t'));
}
function u551CounterSpecS03(name,kind,spellTrap,release){
  const kinds=kind==='saber'||kind==='normal7'?['normal','flip','procedure','synchro','xyz']:['normal','procedure','synchro','xyz'];
  return {type:'counter',priority:3,onOtherSummon:true,
    summonNegate:{ownSummonS03:true,kinds},
    condition(ctx){
      if(!u551SupportS03(ctx,kind).length){ctx.reason='発動条件を満たす自分のモンスターがいません';return false;}
      if(gameState.pendingSummon && !(gameState.chain||[]).length) return kinds.includes(gameState.pendingSummon.kind);
      if(spellTrap && u551CardActivationS03()) return true;
      ctx.reason='召喚そのもの、または対応する魔法・罠カードの発動時に発動します';return false;
    },
    cost(ctx,done){
      const top=(gameState.chain||[]).slice(-1)[0];
      const response=!top && gameState.pendingSummon ? {kind:'summon',uid:gameState.pendingSummon.uid}
        : top ? {kind:'chain',chainId:top.chainId} : null;
      if(!response){done(false);return;}
      ctx.costCtxS03=Object.assign({},ctx.costCtxS03||{},{u551ResponseS03:response});
      if(!release){done(true);return;}
      const pool=u551SupportS03(ctx,kind);
      if(!pool.length){done(false);return;}
      API.selectCard(name+'：リリースするモンスター',pool,t=>{
        const h=t&&resolveTarget(t);if(!h||h.zone!=='mz'||h.p!==ctx.player){done(false);return;}
        API.sendToGrave(h,name+'（リリース）');done(true);
      });
    },
    resolve(ctx){
      const r=ctx.u551ResponseS03;
      if(r && r.kind==='summon'){if(gameState.pendingSummon && gameState.pendingSummon.uid===r.uid)summonNegatePendingV2(name);}
      else if(r && r.kind==='chain') API.negateChainLink(r.chainId,'activation',name,true);
    },
    afterResolve(){}
  };
}
defineScript('セイバー・ホール',u551CounterSpecS03('セイバー・ホール','saber',false,false));
defineScript('ブローニング・パワー',u551CounterSpecS03('ブローニング・パワー','サイキック',true,true));
defineScript('ポリノシス',u551CounterSpecS03('ポリノシス','植物',true,true));
defineScript('王者の看破',u551CounterSpecS03('王者の看破','normal7',true,false));
