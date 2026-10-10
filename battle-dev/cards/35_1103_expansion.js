/* =========================================================================
   System v3.3.0: 1103 script expansion batch 1
   汎用 / 墓守 / BF / 汎用罠
   ========================================================================= */

function isFaceUpNameContains(card, needle){
  return !!(card && card.face==='up' && String(dbOf(card).n||'').indexOf(needle)>=0);
}
function bfDeckTargets(p, filter){
  return API.pileCards(p,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('BF－')===0 && (!filter || filter(x)));
}
function ownBattlingBF(ctx){
  const b = ctx.battle || battleContextV28();
  if(!b) return [];
  const out=[];
  if(b.atkOwner===ctx.player && b.atkCard && isFaceUpNameContains(b.atkCard,'BF－')){
    const loc=locateCard(b.atkCard); if(loc) out.push({p:loc.p,zone:loc.zone,index:loc.index,card:b.atkCard,db:dbOf(b.atkCard)});
  }
  if(b.defOwner===ctx.player && b.defCard && isFaceUpNameContains(b.defCard,'BF－')){
    const loc=locateCard(b.defCard); if(loc) out.push({p:loc.p,zone:loc.zone,index:loc.index,card:b.defCard,db:dbOf(b.defCard)});
  }
  return out;
}

/* ---- ならず者傭兵部隊 ---- */
defineScript("ならず者傭兵部隊", {
  type:"monster", priority:1, targets:true, timing:["mainPhase"],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.player!==gameState.activePlayer){ ctx.reason='自分のメインフェイズにフィールドで発動します'; return false; }
    if(!API.fieldCards({zone:'mz'}).length){ ctx.reason='破壊するモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const loc=locateCard(ctx.card);
    if(!loc){ done(false); return; }
    API.sendToGrave({p:loc.p,zone:loc.zone,index:loc.index,card:ctx.card},'ならず者傭兵部隊（リリース）');
    done(true);
  },
  selectTargets(ctx, done){
    API.selectCard('ならず者傭兵部隊：破壊するモンスター', API.fieldCards({zone:'mz'}), t=>done([t]));
  },
  resolve(ctx){ const t=ctx.selectedTargets[0]; if(t) API.destroy(t,'ならず者傭兵部隊'); },
  afterResolve(){}
});

/* ---- D.D.アサイラント ---- */
defineScript("D.D.アサイラント", {
  type:"monster", priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    const b=ctx.battle||gameState.lastBattle; if(!b){ ctx.reason='戦闘後に発動します'; return false; }
    const atk=(b.atkCard===ctx.card || (b.atkOwner===ctx.player && b.atkName===cardName(ctx.card)));
    const def=(b.defCard===ctx.card || (b.defOwner===ctx.player && b.defName===cardName(ctx.card)));
    if(!(atk||def)){ ctx.reason='このカードが戦闘を行っていません'; return false; }
    if(!((atk&&b.destroyedAtk)||(def&&b.destroyedDef))){ ctx.reason='このカードが戦闘で破壊された時に発動します'; return false; }
    return !!(atk?b.defCard:b.atkCard);
  },
  resolve(ctx){
    const b=ctx.battle||gameState.lastBattle; if(!b) return;
    const atk=(b.atkCard===ctx.card || (b.atkOwner===ctx.player && b.atkName===cardName(ctx.card)));
    const foe=atk?b.defCard:b.atkCard;
    if(foe){ const loc=locateCard(foe); if(loc) API.banish({p:loc.p,zone:loc.zone,index:loc.index,card:foe},'D.D.アサイラント'); }
    const me=locateCard(ctx.card); if(me) API.banish({p:me.p,zone:me.zone,index:me.index,card:ctx.card},'D.D.アサイラント');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b=ctx.battle||{};
      const atk=(b.atkCard===ctx.card || (b.atkOwner===ctx.player && b.atkName===cardName(ctx.card)));
      const def=(b.defCard===ctx.card || (b.defOwner===ctx.player && b.defName===cardName(ctx.card)));
      return (atk&&!!b.destroyedAtk)||(def&&!!b.destroyedDef);
    }
  }
});

/* =========================================================================
   墓守
   ========================================================================= */
function gravekeeperDeck(p, filter){
  return API.pileCards(p,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('墓守の')===0 && (!filter||filter(x)));
}
function gravekeeperField(p, exclude){
  return API.fieldCards({zone:'mz',player:p,filter:x=>x.card!==exclude && x.card.face==='up' && String(x.db.n||'').indexOf('墓守の')===0});
}

/* ---- 墓守の偵察者 ---- */
defineScript("墓守の偵察者", {
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason='モンスターゾーンが一杯です'; return false; }
    if(!gravekeeperDeck(ctx.player,x=>(x.db.atk||0)<=1500).length){ ctx.reason='攻撃力1500以下の「墓守」がデッキにいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('墓守の偵察者：特殊召喚する「墓守」',gravekeeperDeck(ctx.player,x=>(x.db.atk||0)<=1500),t=>done([t]),'攻撃力1500以下');
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    const now=gravekeeperDeck(ctx.player,x=>x.card===t.card || x.db.n===t.db.n);
    if(now.length) API.specialSummon(ctx.player,'deck',now[0].index,'atk','墓守の偵察者');
  },
  afterResolve(){},
  passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }
});

/* ---- 墓守の末裔 ---- */
defineScript("墓守の末裔", {
  type:"monster", priority:1, targets:true, timing:["mainPhase"],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.player!==gameState.activePlayer){ ctx.reason='自分のメインフェイズに発動します'; return false; }
    if(!gravekeeperField(ctx.player,ctx.card).length){ ctx.reason='リリースできる他の「墓守」がいません'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason='相手フィールドにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('墓守の末裔：リリースする他の「墓守」',gravekeeperField(ctx.player,ctx.card),t=>{
      API.sendToGrave(t,'墓守の末裔（リリース）'); done(true);
    });
  },
  selectTargets(ctx, done){ API.selectCard('墓守の末裔：破壊する相手カード',API.fieldCards({player:ctx.opponent}),t=>done([t])); },
  resolve(ctx){ const t=ctx.selectedTargets[0]; if(t) API.destroy(t,'墓守の末裔'); },
  afterResolve(){}
});

/* ---- 墓守の石版 ---- */
defineScript("墓守の石版", {
  type:"spell", priority:1, ignoresNecrovalley:true,
  condition(ctx){
    if(API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('墓守の')===0).length<2){
      ctx.reason='墓地に「墓守」モンスターが2体以上必要です'; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    const pool=()=>API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('墓守の')===0);
    API.selectCard('墓守の石版：1体目',pool(),a=>{
      API.selectCard('墓守の石版：2体目',pool().filter(x=>x.card!==a.card),b=>done([a,b]));
    });
  },
  resolve(ctx){ (ctx.selectedTargets||[]).forEach(t=>API.returnToHand(t,'墓守の石版')); }
});

/* ---- 墓守の番兵 ---- */
defineScript("墓守の番兵", {
  type:"monster", priority:1, forced:true, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz',player:ctx.opponent}).length){ ctx.reason='相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('墓守の番兵：手札へ戻す相手モンスター',API.fieldCards({zone:'mz',player:ctx.opponent}),t=>done([t])); },
  resolve(ctx){ const t=ctx.selectedTargets[0]; if(t) API.returnToHand(t,'墓守の番兵'); },
  afterResolve(){},
  passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }
});

/* ---- 墓守の呪術師 ---- */
defineScript("墓守の呪術師", {
  type:"monster", priority:1, forced:true,
  condition(){ return true; },
  resolve(ctx){ API.damageLP(ctx.opponent,500); API.log('墓守の呪術師：500ダメージ'); },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz'; },
    onSpecialSummon(ctx){ return ctx.zone==='mz'; },
    onFlip(ctx){ return ctx.zone==='mz'; }
  }
});

/* ---- 墓守の長槍兵（貫通） ---- */
defineScript("墓守の長槍兵", {
  type:"monster", priority:1,
  continuous:{
    scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard!==info.self || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
    }
  }
});

/* =========================================================================
   BF
   ========================================================================= */
function otherFaceUpBF(p, self){
  return API.fieldCards({zone:'mz',player:p,filter:x=>x.card!==self && isFaceUpNameContains(x.card,'BF－')});
}
function bfSelfSummonCondition(ctx){
  if(ctx.zone!=='hand'){ ctx.reason='手札から特殊召喚します'; return false; }
  if(!otherFaceUpBF(ctx.player,ctx.card).length){ ctx.reason='自分フィールドに同名以外の「BF」モンスターが必要です'; return false; }
  return true;
}

/* ---- BF－疾風のゲイル ---- */
defineScript("BF－疾風のゲイル", {
  type:"monster", priority:1, countLimit:1, targets:true,
  summonProcedure:{from:'hand',positions:['atk','def'],condition:bfSelfSummonCondition},
  timing:["mainPhase"],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.player!==gameState.activePlayer){ ctx.reason='自分のメインフェイズに発動します'; return false; }
    if(!API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'}).length){ ctx.reason='相手の表側表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('BF－疾風のゲイル：攻守を半分にする相手モンスター',API.fieldCards({zone:'mz',player:ctx.opponent,filter:x=>x.card.face==='up'}),t=>done([t])); },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    const a=API.curAtk(t), d=API.curDef(t);
    API.modAtk(t,Math.floor(a/2)-a,Math.floor(d/2)-d,'permanent','BF－疾風のゲイル');
  },
  afterResolve(){}
});

/* ---- BF－黒槍のブラスト ---- */
defineScript("BF－黒槍のブラスト", {
  type:"monster", priority:1,
  summonProcedure:{from:'hand',positions:['atk','def'],condition:bfSelfSummonCondition},
  continuous:{
    scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard!==info.self || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
    }
  }
});

/* ---- BF－月影のカルート ---- */
defineScript("BF－月影のカルート", {
  type:"monster", priority:2, quickEffect:true, activateFrom:['hand'], damageStepLegal:true,
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason='手札から発動します'; return false; }
    if(!gameState.battle || !ownBattlingBF(ctx).length){ ctx.reason='自分の「BF」モンスターが戦闘を行っていません'; return false; }
    return true;
  },
  cost(ctx, done){ API.discard(ctx.player,ctx.index,'BF－月影のカルート（コスト）'); done(true); },
  selectTargets(ctx, done){
    const a=ownBattlingBF(ctx); if(a.length===1){ done([a[0]]); return; }
    API.selectCard('BF－月影のカルート：攻撃力を上げる「BF」',a,t=>done([t]));
  },
  resolve(ctx){ const t=ctx.selectedTargets[0]; if(t) API.modAtk(t,1400,0,'endTurn','BF－月影のカルート'); },
  afterResolve(){}
});

/* ---- BF－蒼炎のシュラ ---- */
defineScript("BF－蒼炎のシュラ", {
  type:"monster", priority:1, dsTiming:'leave',
  condition(ctx){
    const b=ctx.battle||gameState.lastBattle;
    if(!b || b.atkCard!==ctx.card || !b.destroyedDef){ ctx.reason='このカードが戦闘で相手モンスターを破壊し墓地へ送った時に発動します'; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason='モンスターゾーンが一杯です'; return false; }
    if(!bfDeckTargets(ctx.player,x=>(x.db.atk||0)<=1500).length){ ctx.reason='攻撃力1500以下の「BF」がデッキにいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('BF－蒼炎のシュラ：特殊召喚する「BF」',bfDeckTargets(ctx.player,x=>(x.db.atk||0)<=1500),t=>done([t]),'攻撃力1500以下'); },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    const again=bfDeckTargets(ctx.player,x=>x.card===t.card || x.db.n===t.db.n); if(!again.length) return;
    API.specialSummon(ctx.player,'deck',again[0].index,'atk','BF－蒼炎のシュラ');
    const c=gameState.players[ctx.player].mz[gameState.players[ctx.player].mz.length-1];
    if(c) API.negate({p:ctx.player,zone:'mz',index:gameState.players[ctx.player].mz.length-1,card:c},'BF－蒼炎のシュラ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ const b=ctx.battle||{}; return ctx.zone==='mz' && b.atkCard===ctx.card && !!b.destroyedDef; } }
});

/* ---- 黒い旋風 ---- */
defineScript("黒い旋風", {
  onOtherSummon:true, type:'continuous-spell', priority:1,
  continuous:{scope:'self',from:['sz'],apply(){return null;}},
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon') return true; // カード自身の発動
    const s=ctx.event&&ctx.event.card;
    if(!s || ctx.event.player!==ctx.player || !isFaceUpNameContains(s,'BF－')){ ctx.reason='自分が「BF」モンスターを召喚した時に発動します'; return false; }
    const atk=curATK(s);
    if(!bfDeckTargets(ctx.player,x=>(x.db.atk||0)<atk).length){ ctx.reason='召喚した「BF」より攻撃力が低い「BF」がデッキにいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.eventName!=='onNormalSummon'){ done([]); return; }
    const s=ctx.event&&ctx.event.card, atk=s?curATK(s):0;
    API.selectCard('黒い旋風：手札に加える「BF」',bfDeckTargets(ctx.player,x=>(x.db.atk||0)<atk),t=>done([t]),`攻撃力 ${atk} 未満`);
  },
  resolve(ctx){
    if(ctx.eventName!=='onNormalSummon') return;
    const t=ctx.selectedTargets[0]; if(t) API.searchDeck(ctx.player,t.index,'黒い旋風');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      const s=ctx.event&&ctx.event.card;
      return ctx.zone==='sz' && ctx.card.face==='up' && !!s && ctx.event.player===ctx.player && isFaceUpNameContains(s,'BF－');
    }
  }
});

/* =========================================================================
   汎用罠
   ========================================================================= */
/* ---- 落とし穴 ---- */
defineScript("落とし穴", {
  onOtherSummon:true, type:'trap', priority:2, targets:true,
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon' && ctx.eventName!=='onFlip'){ ctx.reason='相手の召喚・反転召喚成功時に発動します'; return false; }
    if(ctx.eventName==='onFlip' && !(ctx.event&&ctx.event.flipSummon)){ ctx.reason='リバースではなく反転召喚成功時にのみ発動できます'; return false; }
    const s=ctx.event&&ctx.event.card;
    if(!s || ctx.event.player!==ctx.opponent || curATK(s)<1000){ ctx.reason='相手が攻撃力1000以上のモンスターを召喚・反転召喚した時に発動します'; return false; }
    return !!locateCard(s);
  },
  selectTargets(ctx, done){
    const s=ctx.event&&ctx.event.card, loc=s&&locateCard(s); if(!loc){ done([]); return; }
    done([{p:loc.p,zone:loc.zone,index:loc.index,card:s,db:dbOf(s)}]);
  },
  resolve(ctx){ const t=ctx.selectedTargets[0]; if(t) API.destroy(t,'落とし穴'); },
  passive:{
    onNormalSummon(ctx){ const s=ctx.event&&ctx.event.card; return ctx.zone==='sz' && ctx.card.face==='down' && !!s && ctx.event.player===ctx.opponent && curATK(s)>=1000; },
    onFlip(ctx){ const s=ctx.event&&ctx.event.card; return ctx.zone==='sz' && ctx.card.face==='down' && !!s && !!ctx.event.flipSummon && ctx.event.player===ctx.opponent && curATK(s)>=1000; }
  }
});

/* ---- 天罰 ---- */
defineScript("天罰", {
  type:'counter', priority:3,
  condition(ctx){
    if(!gameState.chain.length){ ctx.reason='効果モンスターの効果の発動にチェーンして発動します'; return false; }
    const l=gameState.chain[gameState.chain.length-1], d=CARD_DB[l.cardId]||{};
    if(d.k!=='m'){ ctx.reason='直前のチェーンはモンスター効果ではありません'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason='捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const hand=API.me(ctx).hand.map((c,i)=>({p:ctx.player,zone:'hand',index:i,card:c,db:dbOf(c)}));
    API.selectCard('天罰：捨てる手札',hand,t=>{ API.discard(ctx.player,t.index,'天罰（コスト）'); done(true); });
  },
  resolve(){ if(negatePreviousChainLinkV2('天罰',true,'activation')) API.log('天罰：効果モンスターの効果の発動を無効にし破壊'); }
});

/* ---- BF－極北のブリザード ---- */
defineScript("BF－極北のブリザード", {
  type:"monster", priority:1, targets:true, cannotSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon'){ ctx.reason='このカードが召喚に成功した時に発動します'; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason='モンスターゾーンが一杯です'; return false; }
    const t=API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('BF－')===0 && (x.db.lv||99)<=4);
    if(!t.length){ ctx.reason='墓地にレベル4以下の「BF」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const t=API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('BF－')===0 && (x.db.lv||99)<=4);
    API.selectCard('BF－極北のブリザード：特殊召喚する「BF」',t,x=>done([x]),'レベル4以下・守備表示');
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    const now=API.pileCards(ctx.player,'grave',x=>x.card===t.card || x.db.n===t.db.n);
    if(now.length) API.specialSummon(ctx.player,'grave',now[0].index,'def','BF－極北のブリザード');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz'; } }
});
