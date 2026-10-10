/* =========================================================================
   System v3.4.0: 1103 script expansion batch 2
   六武衆 / 代行天使周辺 / E・HERO
   ========================================================================= */

function v340Name(card){ return String(dbOf(card).n||''); }
function v340IsSix(card){ return !!card && typeof isSetCardV4==='function' ? isSetCardV4(card,SETCODE.SIX_SAMURAI) : (!!card && v340Name(card).indexOf('六武衆')>=0); }
function v340SixField(p, exclude, filter){
  return API.fieldCards({zone:'mz',player:p,filter:x=>x.card!==exclude && x.card.face==='up' && v340IsSix(x.card) && (!filter||filter(x))});
}
function v340SixDeck(p, filter){ return API.pileCards(p,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('六武衆')>=0 && (!filter||filter(x))); }
function v340Sanctuary(p){ const f=gameState.players[p].field; return !!(f && f.face==='up' && cardName(f)==='天空の聖域'); }
function v340LightFairyHand(p, exclude){ return API.pileCards(p,'hand',x=>x.card!==exclude && x.db.k==='m' && x.db.ra==='天使' && x.db.at==='光'); }
function v340FairyHand(p, exclude){ return API.pileCards(p,'hand',x=>x.card!==exclude && x.db.k==='m' && x.db.ra==='天使'); }
function v340ScheduleEndDestroy(card, player, label){
  if(!card) return;
  ensureCardUid(gameState,card);
  API.setCardFlag({card:card},'v340EndDestroyTurn',gameState.turn,label||'エンドフェイズに破壊',{silent:true});
  API.registerReserveEffect(player,label||'エンドフェイズに破壊','endPhase','',{kind:'destroyUids',uids:[card.uid],flagKey:'v340EndDestroyTurn'});
}

/* ============================== 六武衆 ============================== */

defineScript("真六武衆－キザン", {
  type:'monster', priority:1,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){
    if(!v340SixField(ctx.player,null,x=>x.db.n!=='真六武衆－キザン').length){ ctx.reason='同名以外の「六武衆」モンスターが必要です'; return false; }
    return true;
  }},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self) return null;
    return v340SixField(info.p,self).length>=2 ? {atk:300,def:300} : null;
  }}
});

defineScript("真六武衆－カゲキ", {
  type:'monster', priority:1,
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon'){ ctx.reason='このカードが召喚に成功した時に発動します'; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason='モンスターゾーンが一杯です'; return false; }
    const h=API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && String(x.db.n||'').indexOf('六武衆')>=0 && (x.db.lv||99)<=4);
    if(!h.length){ ctx.reason='手札にレベル4以下の「六武衆」がいません'; return false; }
    return true;
  },
  selectTargets(ctx,done){
    API.selectCard('真六武衆－カゲキ：特殊召喚する「六武衆」',API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0&&(x.db.lv||99)<=4),t=>done([t]));
  },
  resolve(ctx){ const t=ctx.selectedTargets[0]; if(!t)return; const h=API.pileCards(ctx.player,'hand',x=>x.card===t.card||x.db.n===t.db.n); if(h.length)API.specialSummon(ctx.player,'hand',h[0].index,'atk','真六武衆－カゲキ'); },
  afterResolve(){},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz';}},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){
    if(card!==self) return null;
    return v340SixField(info.p,self).length ? {atk:1500} : null;
  }}
});

defineScript("真六武衆－ミズホ", {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){
    if(!API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&x.db.n==='真六武衆－シナイ'}).length){ ctx.reason='自分フィールドに「真六武衆－シナイ」が必要です'; return false; }
    return true;
  }},
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer){ctx.reason='自分メインフェイズにフィールドで発動します';return false;}
    if(!v340SixField(ctx.player,ctx.card).length){ctx.reason='リリースする他の「六武衆」がいません';return false;}
    if(!API.fieldCards().length){ctx.reason='破壊するカードがありません';return false;}
    return true;
  },
  cost(ctx,done){ API.selectCard('真六武衆－ミズホ：リリースする他の「六武衆」',v340SixField(ctx.player,ctx.card),t=>{API.sendToGrave(t,'真六武衆－ミズホ（リリース）');done(true);}); },
  selectTargets(ctx,done){API.selectCard('真六武衆－ミズホ：破壊するカード',API.fieldCards(),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.destroy(t,'真六武衆－ミズホ');}, afterResolve(){}
});

defineScript("六武衆のご隠居", {
  type:'monster', priority:1,
  summonProcedure:{from:'hand',positions:['atk','def'],condition(ctx){
    if(API.me(ctx).mz.length){ctx.reason='自分フィールドにモンスターが存在しない場合に特殊召喚できます';return false;}
    if(!gameState.players[ctx.opponent].mz.length){ctx.reason='相手フィールドにモンスターが必要です';return false;}
    return true;
  }}
});

defineScript("六武衆の露払い", {
  type:'monster', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer){ctx.reason='自分メインフェイズに発動します';return false;}
    if(!v340SixField(ctx.player,ctx.card).length){ctx.reason='このカード以外の表側表示「六武衆」が必要です';return false;}
    if(!API.fieldCards({zone:'mz'}).length){ctx.reason='破壊するモンスターがいません';return false;}
    return true;
  },
  cost(ctx,done){
    const own=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v340IsSix(x.card)});
    API.selectCard('六武衆の露払い：リリースする「六武衆」',own,t=>{API.sendToGrave(t,'六武衆の露払い（リリース）');done(true);});
  },
  selectTargets(ctx,done){API.selectCard('六武衆の露払い：破壊するモンスター',API.fieldCards({zone:'mz'}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.destroy(t,'六武衆の露払い');},afterResolve(){}
});

defineScript("紫炎の狼煙", {
  type:'spell', priority:1, blocksIfNoDeckToHand:true, // S03-U01: ライオウ適用中は発動できない
  condition(ctx){if(!v340SixDeck(ctx.player,x=>(x.db.lv||99)<=3).length){ctx.reason='デッキにレベル3以下の「六武衆」がいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('紫炎の狼煙：手札に加える「六武衆」',v340SixDeck(ctx.player,x=>(x.db.lv||99)<=3),t=>done([t]),'レベル3以下');},
  resolve(ctx){const t=ctx.selectedTargets[0];if(!t)return;const d=v340SixDeck(ctx.player,x=>x.card===t.card||x.db.n===t.db.n);if(d.length)API.searchDeck(ctx.player,d[0].index,'紫炎の狼煙');}
});

defineScript("六武衆の荒行", {
  type:'quick-play', priority:2, targets:true,
  condition(ctx){
    const own=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v340IsSix(x.card)});
    const ok=own.some(t=>v340SixDeck(ctx.player,x=>x.db.n!==t.db.n&&(x.db.atk||0)===curATK(t.card)).length);
    if(!ok){ctx.reason='同じ攻撃力でカード名が異なる「六武衆」をデッキから出せる対象がいません';return false;}return true;
  },
  selectTargets(ctx,done){
    const own=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v340IsSix(x.card)})
      .filter(t=>v340SixDeck(ctx.player,x=>x.db.n!==t.db.n&&(x.db.atk||0)===curATK(t.card)).length);
    API.selectCard('六武衆の荒行：対象の「六武衆」',own,a=>{
      const pool=v340SixDeck(ctx.player,x=>x.db.n!==a.db.n&&(x.db.atk||0)===curATK(a.card));
      API.selectCard('六武衆の荒行：特殊召喚する「六武衆」',pool,b=>done([{mode:'asceticism',target:a,summon:b}]));
    });
  },
  resolve(ctx){
    const s=ctx.selectedTargets[0];if(!s)return;
    const a=resolveTarget(s.target); if(!a)return;
    /* S03-U45: デッキから出すモンスターは対象ではない。選んだカードが解決前にデッキを離れていたら（同じカードを選んだ2枚目の荒行が先に解決した等）、
       復元された選択は null になる。以前は s.summon.card で解決エラーになり、デュエルが止まった。
       その場合は、今のデッキから対象と攻撃力が同じでカード名が異なる「六武衆」を出す（無ければ出さない）。 */
    const chosenS03=s.summon&&s.summon.card?v340SixDeck(ctx.player,x=>x.card===s.summon.card):[];
    /* resolveTarget の戻り値は db を持たない形がある。対象の名前は dbOf(a.card) から取る */
    const aDbS03=dbOf(a.card)||{};
    const pool=chosenS03.length?chosenS03:v340SixDeck(ctx.player,x=>x.db.n!==aDbS03.n&&(x.db.atk||0)===curATK(a.card)); if(!pool.length)return;
    API.specialSummon(ctx.player,'deck',pool[0].index,'atk','六武衆の荒行');
    v340ScheduleEndDestroy(a.card,ctx.player,'六武衆の荒行：対象をエンドフェイズに破壊');
  }
});

defineScript("真六武衆－エニシ", {
  type:'monster', priority:2, quickEffect:true, countLimit:1, targets:true,
  condition(ctx){
    if(ctx.zone!=='mz'){ctx.reason='フィールドで発動します';return false;}
    if(!v340SixField(ctx.player,ctx.card).length){ctx.reason='このカード以外の「六武衆」が必要です';return false;}
    if(API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0).length<2){ctx.reason='墓地に除外する「六武衆」が2体必要です';return false;}
    if(!API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).length){ctx.reason='表側表示モンスターがいません';return false;}
    return true;
  },
  cost(ctx,done){
    const pool=()=>API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0);
    API.selectCard('真六武衆－エニシ：除外する1体目',pool(),a=>{
      API.selectCard('真六武衆－エニシ：除外する2体目',pool().filter(x=>x.card!==a.card),b=>{API.banish(a,'エニシ（コスト）');API.banish(b,'エニシ（コスト）');done(true);});
    });
  },
  selectTargets(ctx,done){API.selectCard('真六武衆－エニシ：手札へ戻す表側モンスター',API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.returnToHand(t,'真六武衆－エニシ');},afterResolve(){},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){if(card!==self)return null;return v340SixField(info.p,self).length>=2?{atk:500,def:500}:null;}}
});

defineScript("紫炎の足軽", {
  type:'monster', priority:1, dsTiming:'leave',
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy'||!(ctx.event&&ctx.event.card===ctx.card)){ctx.reason='このカードが戦闘で破壊され墓地へ送られた時に発動します';return false;}
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(!v340SixDeck(ctx.player,x=>(x.db.lv||99)<=3).length){ctx.reason='デッキにレベル3以下の「六武衆」がいません';return false;}
    return true;
  },
  selectTargets(ctx,done){API.selectCard('紫炎の足軽：特殊召喚する「六武衆」',v340SixDeck(ctx.player,x=>(x.db.lv||99)<=3),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t){const p=v340SixDeck(ctx.player,x=>x.card===t.card||x.db.n===t.db.n);if(p.length)API.specialSummon(ctx.player,'deck',p[0].index,'atk','紫炎の足軽');}},
  afterResolve(){},passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}}
});

defineScript("六武衆推参!", {
  type:'trap', priority:2, targets:true,
  condition(ctx){if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}if(!API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0).length){ctx.reason='墓地に「六武衆」がいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('六武衆推参!：特殊召喚する「六武衆」',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('六武衆')>=0),t=>done([t]));},
  resolve(ctx){
    const t=ctx.selectedTargets[0];if(!t)return;const pool=API.pileCards(ctx.player,'grave',x=>x.card===t.card||x.db.n===t.db.n);if(!pool.length)return;
    const card=pool[0].card;API.specialSummon(ctx.player,'grave',pool[0].index,'atk','六武衆推参!');
    const h=locateCard(card);if(h&&h.zone==='mz')v340ScheduleEndDestroy(card,ctx.player,'六武衆推参!：特殊召喚したモンスターを破壊');
  }
});

/* ========================== 代行天使周辺 ========================== */

defineScript("天空の宝札", {
  type:'spell', priority:1,
  condition(ctx){
    if(gameState.phase!=='main1'){ctx.reason='このターンBattle Phaseを行えないためMain Phase 1でのみ発動できます';return false;}
    if((API.me(ctx).ssHistory||[]).length){ctx.reason='このターン既に特殊召喚しています';return false;}
    if(API.me(ctx).deck.length<2){ctx.reason='デッキが2枚未満です';return false;}
    if(!v340LightFairyHand(ctx.player,ctx.card).length){ctx.reason='手札に除外する光属性・天使族がいません';return false;}
    return true;
  },
  cost(ctx,done){
    API.selectCard('天空の宝札：除外する光属性・天使族',v340LightFairyHand(ctx.player,ctx.card),t=>{
      API.banish(t,'天空の宝札（コスト）');
      API.setFlag(ctx.player,'noSpecialSummon',true,true);API.setFlag(ctx.player,'noBattlePhase',true,true);done(true);
    });
  },
  resolve(ctx){API.draw(ctx.player,2);}
});

defineScript("ヘカテリス", {
  type:'monster', priority:1, activateFrom:['hand'], timing:['mainPhase'], blocksIfNoDeckToHand:true, // S03-U05
  condition(ctx){if(ctx.zone!=='hand'){ctx.reason='手札から発動します';return false;}if(!API.pileCards(ctx.player,'deck',x=>x.db.n==='神の居城－ヴァルハラ').length){ctx.reason='デッキに「神の居城－ヴァルハラ」がありません';return false;}return true;},
  cost(ctx,done){API.discard(ctx.player,ctx.index,'ヘカテリス（コスト）');done(true);},
  resolve(ctx){const t=API.pileCards(ctx.player,'deck',x=>x.db.n==='神の居城－ヴァルハラ');if(t.length)API.searchDeck(ctx.player,t[0].index,'ヘカテリス');},afterResolve(){}
});

function v340HeraldCost(ctx,done,label){
  const angels=v340FairyHand(ctx.player,ctx.card);if(!angels.length){done(false);return;}
  API.selectCard(`${label}：一緒に墓地へ送る天使族`,angels,pick=>{
    const idxs=[pick.index,ctx.index].sort((a,b)=>b-a);idxs.forEach(i=>API.discard(ctx.player,i,`${label}（コスト）`));done(true);
  });
}
defineScript("緑光の宣告者", {
  type:'monster',priority:3,quickEffect:true,activateFrom:['hand'],
  condition(ctx){
    if(ctx.zone!=='hand'){ctx.reason='手札から発動します';return false;}const l=gameState.chain[gameState.chain.length-1];if(!l||l.player===ctx.player){ctx.reason='相手の魔法カードの発動にチェーンします';return false;}const d=CARD_DB[l.cardId]||{};if(d.k!=='s'){ctx.reason='直前のチェーンは魔法カードではありません';return false;}if(!v340FairyHand(ctx.player,ctx.card).length){ctx.reason='コストにする他の天使族がいません';return false;}return true;
  },
  cost(ctx,done){v340HeraldCost(ctx,done,'緑光の宣告者');},
  resolve(){negatePreviousChainLinkV2('緑光の宣告者',true,'activation');},afterResolve(){}
});
defineScript("紫光の宣告者", {
  type:'monster',priority:3,quickEffect:true,activateFrom:['hand'],
  condition(ctx){
    if(ctx.zone!=='hand'){ctx.reason='手札から発動します';return false;}const l=gameState.chain[gameState.chain.length-1];if(!l||l.player===ctx.player){ctx.reason='相手の罠カードの発動にチェーンします';return false;}const d=CARD_DB[l.cardId]||{};if(d.k!=='t'){ctx.reason='直前のチェーンは罠カードではありません';return false;}if(!v340FairyHand(ctx.player,ctx.card).length){ctx.reason='コストにする他の天使族がいません';return false;}return true;
  },
  cost(ctx,done){v340HeraldCost(ctx,done,'紫光の宣告者');},
  resolve(){negatePreviousChainLinkV2('紫光の宣告者',true,'activation');},afterResolve(){}
});

defineScript("コーリング・ノヴァ", {
  type:'monster',priority:1,dsTiming:'leave',
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy'||!(ctx.event&&ctx.event.card===ctx.card)){ctx.reason='戦闘で破壊され墓地へ送られた時に発動します';return false;}
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}
    const normal=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.ra==='天使'&&x.db.at==='光'&&(x.db.atk||0)<=1500);
    const parshath=v340Sanctuary(ctx.player)?API.pileCards(ctx.player,'deck',x=>x.db.n==='天空騎士パーシアス'):[];
    if(!normal.length&&!parshath.length){ctx.reason='特殊召喚できるモンスターがデッキにいません';return false;}return true;
  },
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.ra==='天使'&&x.db.at==='光'&&(x.db.atk||0)<=1500)
      .concat(v340Sanctuary(ctx.player)?API.pileCards(ctx.player,'deck',x=>x.db.n==='天空騎士パーシアス'):[]);
    const uniq=[];const seen=new Set();pool.forEach(x=>{if(!seen.has(x.card)){seen.add(x.card);uniq.push(x);}});
    if(!uniq.length)return;
    API.requestChoice({player:ctx.player,kind:'card',title:'コーリング・ノヴァ：特殊召喚するモンスター',
      candidates:uniq,min:1,max:1,cancelable:false,
      resume:{handler:'s03u58.deck-special',args:{player:ctx.player,pos:'atk',reason:'コーリング・ノヴァ'}},
      meta:{scriptName:'コーリング・ノヴァ'}});
  },afterResolve(){},
  passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}}
});

defineScript("裁きの代行者 サターン", {
  type:'monster',priority:1,timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.player!==gameState.activePlayer||gameState.phase!=='main1'){ctx.reason='自分のMain Phase 1にフィールドで発動します';return false;}
    if(!v340Sanctuary(ctx.player)){ctx.reason='自分フィールドに「天空の聖域」が必要です';return false;}
    if(API.me(ctx).lp<=API.foe(ctx).lp){ctx.reason='自分LPが相手LPを上回っている必要があります';return false;}return true;
  },
  cost(ctx,done){const loc=locateCard(ctx.card);if(!loc){done(false);return;}API.setFlag(ctx.player,'noBattlePhase',true,true);API.sendToGrave({p:loc.p,zone:loc.zone,index:loc.index,card:ctx.card},'裁きの代行者 サターン（リリース）');done(true);},
  resolve(ctx){const d=Math.max(0,API.me(ctx).lp-API.foe(ctx).lp);if(d)API.damageLP(ctx.opponent,d);},afterResolve(){}
});

/* ============================= E・HERO ============================= */
function v340Hero(card){return !!card&&v340Name(card).indexOf('HERO')>=0;}
defineScript("E・HERO オーシャン", {
  type:'monster',priority:1,countLimit:1,targets:true,
  condition(ctx){if(ctx.eventName!=='onStandbyPhase'||ctx.zone!=='mz'){ctx.reason='自分スタンバイフェイズにフィールドで発動します';return false;}const pool=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v340Hero(x.card)}).concat(API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('HERO')>=0));if(!pool.length){ctx.reason='フィールド・墓地に「HERO」がいません';return false;}return true;},
  selectTargets(ctx,done){const pool=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&v340Hero(x.card)}).concat(API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('HERO')>=0));API.selectCard('E・HERO オーシャン：手札へ戻す「HERO」',pool,t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t)API.returnToHand(t,'E・HERO オーシャン');},afterResolve(){},passive:{onStandbyPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;}}
});

/* S03-U04: 「デッキ・墓地から」選ぶ効果は、《ライオウ》適用中は墓地のカードだけを選べる
   （六武の門 R1103-SIXGATE-009、アームズ・ホール 08/06/15 と同じ扱い）。 */
function v340ForestmanFusion(p){
  const deck=deckToHandLockReasonV32(p)?[]:API.pileCards(p,'deck',x=>x.db.n==='融合');
  return deck.concat(API.pileCards(p,'grave',x=>x.db.n==='融合'));
}
defineScript("E・HERO フォレストマン", {
  type:'monster',priority:1,countLimit:1,
  condition(ctx){if(ctx.eventName!=='onStandbyPhase'||ctx.zone!=='mz'){ctx.reason='自分スタンバイフェイズにフィールドで発動します';return false;}const p=v340ForestmanFusion(ctx.player);if(!p.length){ctx.reason='デッキ・墓地に「融合」がありません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('E・HERO フォレストマン：手札に加える「融合」',v340ForestmanFusion(ctx.player),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(!t)return;if(t.zone==='deck')API.searchDeck(ctx.player,t.index,'E・HERO フォレストマン');else API.returnToHand(t,'E・HERO フォレストマン');},afterResolve(){},passive:{onStandbyPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer&&v340ForestmanFusion(ctx.player).length>0;}}
});

defineScript("E・HERO ボルテック", {
  type:'monster',priority:1,dsTiming:'after',targets:true,
  condition(ctx){const b=ctx.battle||gameState.lastBattle;if(!b||b.atkCard!==ctx.card||!(b.damage>0)||b.toPlayer!==ctx.opponent){ctx.reason='このカードが相手に戦闘ダメージを与えた時に発動します';return false;}if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason='モンスターゾーンが一杯です';return false;}if(!API.pileCards(ctx.player,'banish',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('E・HERO')===0).length){ctx.reason='除外されている自分の「E・HERO」がいません';return false;}return true;},
  selectTargets(ctx,done){API.selectCard('E・HERO ボルテック：特殊召喚する除外「E・HERO」',API.pileCards(ctx.player,'banish',x=>x.db.k==='m'&&String(x.db.n||'').indexOf('E・HERO')===0),t=>done([t]));},
  resolve(ctx){const t=ctx.selectedTargets[0];if(t){const p=API.pileCards(ctx.player,'banish',x=>x.card===t.card||x.db.n===t.db.n);if(p.length)API.specialSummon(ctx.player,'banish',p[0].index,'atk','E・HERO ボルテック');}},afterResolve(){},passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&b.atkCard===ctx.card&&(b.damage||0)>0&&b.toPlayer===ctx.opponent;}}
});

defineScript("E・HERO レディ・オブ・ファイア", {
  type:'monster',priority:1,forced:true,
  condition(ctx){if(ctx.eventName!=='onEndPhase'||ctx.zone!=='mz'||ctx.player!==gameState.activePlayer){ctx.reason='自分エンドフェイズにフィールドで発動します';return false;}return API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&String(x.db.n||'').indexOf('E・HERO')===0}).length>0;},
  resolve(ctx){const n=API.fieldCards({zone:'mz',player:ctx.player,filter:x=>x.card.face==='up'&&String(x.db.n||'').indexOf('E・HERO')===0}).length;if(n)API.damageLP(ctx.opponent,n*200);},afterResolve(){},passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;}}
});
