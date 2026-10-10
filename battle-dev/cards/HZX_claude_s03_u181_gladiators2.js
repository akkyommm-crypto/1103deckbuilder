/* =========================================================================
   S03-U181 — 剣闘獣 stage 2 on the common mechanism (engine/1ZZ). 2011 texts.
   ========================================================================= */
function u181BattleKill(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.step!=='leave') return null;
  let victim = null;
  if(b.atkCard===ctx.card && b.destroyedDef) victim = b.defCard;
  else if(b.defCard===ctx.card && b.destroyedAtk) victim = b.atkCard;
  if(!victim) return null;
  const h = findCardByUid(ensureCardUid(gameState, victim));
  return (h && h.zone==='grave') ? {h, card:victim} : null;
}

/* 剣闘獣スパルティクス: 「剣闘獣ホプロムス」以外の効果によって特殊召喚できない (engine/1ZK). 特殊召喚に成功した時、デッキから「闘器」と名のついた
   装備魔法カード1枚を手札に加える。 + tag-out */
function u181ArmsPool(p){ return API.pileCards(p,'deck',x=>x.db.k==='s' && x.db.sub==='装備' && String(x.db.n||'').indexOf('闘器')>=0); }
defineGladiatorS03('剣闘獣スパルティクス', [{
  key:'arms-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.DECK, targetSide:'self', speed:1,
  events:['onSpecialSummon'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && u181ArmsPool(ctx.player).length>0; },
  operation(ctx){
    const pool = u181ArmsPool(ctx.player); if(!pool.length) return;
    API.selectCard('剣闘獣スパルティクス：手札に加える「闘器」装備魔法', pool, t=>{ const r=resolveTarget(t); if(r && r.zone==='deck') API.searchDeck(ctx.player, r.index, '剣闘獣スパルティクス'); });
  },
  afterResolve(){}
}, gladiatorTagOutEffectS03('剣闘獣スパルティクス')]);

/* 剣闘獣アレクサンデル: 「剣闘獣ディカエリィ」以外の効果によって特殊召喚できない. 特殊召喚されたこのカードは自分フィールド上に表側表示で存在する限り、
   魔法の効果を受けない。 + tag-out */
defineGladiatorS03('剣闘獣アレクサンデル', [gladiatorTagOutEffectS03('剣闘獣アレクサンデル')], {
  unaffectedByS03(card, src){
    if(!src || src.k!=='s' || !card.specialSummoned || card.face!=='up') return false;
    const h = findCardByUid(card.uid); return !!(h && h.zone==='mz');
  }
});

/* 剣闘獣サムニテ: 「剣闘獣」…によって特殊召喚に成功した場合、このカードが戦闘によって相手モンスターを破壊し墓地へ送った時、デッキから「剣闘獣」と
   名のついたカード1枚を手札に加える事ができる。 + tag-out */
function u181SamniteOk(ctx){ const k = u181BattleKill(ctx); return !!k && k.h.p===ctx.opponent && gladiatorSummonedS03(ctx.card); }
defineGladiatorS03('剣闘獣サムニテ', [{
  key:'battle-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.DECK, targetSide:'self', speed:1,
  events:['onDamageStep'],
  condition(ctx){ return u181SamniteOk(ctx) && API.pileCards(ctx.player,'deck',x=>isGladiatorCardDbS03(x.db)).length>0; },
  operation(ctx){
    const pool = API.pileCards(ctx.player,'deck',x=>isGladiatorCardDbS03(x.db)); if(!pool.length) return;
    API.selectCard('剣闘獣サムニテ：手札に加える「剣闘獣」カード', pool, t=>{ const r=resolveTarget(t); if(r && r.zone==='deck') API.searchDeck(ctx.player, r.index, '剣闘獣サムニテ'); });
  },
  afterResolve(){}
}, gladiatorTagOutEffectS03('剣闘獣サムニテ')], {dsTiming:'leave', blocksIfNoDeckToHand:true,
  passive:{
    onDamageStep(ctx){ return u181SamniteOk(ctx); },
    onBattlePhaseEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gladiatorBattledS03(ctx.card); }
  }});

/* 剣闘獣オクタビウス: 「剣闘獣」…によって特殊召喚に成功した時、魔法&罠カードゾーンにセットされたカード1枚を破壊する。 / このカードが戦闘を行った
   自分のバトルフェイズ終了時に、手札を1枚捨てるかこのカードをデッキに戻す。 (both forced) */
function u181SetCards(){ return API.fieldCards({zone:'sz', filter:x=>x.card.face==='down'}); }
function u181OctaviusBack(ctx){
  const h = findCardByUid(ctx.card.uid);
  if(!h || h.zone!=='mz') return;
  const o = cardOwnerIndex(gameState, h.card, h.p);
  API.returnToDeck(h, false, '剣闘獣オクタビウス');
  API.shuffle(o);
}
defineGladiatorS03('剣闘獣オクタビウス', [gladiatorOnSummonEffectS03('destroy-set', {forced:true,
  cond:()=>u181SetCards().length>0,
  effect:{ targetRange:LOCATION.SZONE, targetSide:'both',
    operation(ctx){
      const pool = u181SetCards(); if(!pool.length) return;
      API.selectCard('剣闘獣オクタビウス：破壊するセットされたカード', pool, t=>{ const r=resolveTarget(t); if(r && r.zone==='sz' && r.card.face==='down') API.destroy(r, '剣闘獣オクタビウス'); });
    } }}),
{
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gladiatorBattledS03(ctx.card) && gameState.activePlayer===ctx.player; },
  operation(ctx){
    if(!API.me(ctx).hand.length){ u181OctaviusBack(ctx); return; }
    API.requestChoice({player:ctx.player, kind:'declare', title:'剣闘獣オクタビウス：手札を1枚捨てるか、このカードをデッキに戻す',
      candidates:[{key:'discard', label:'手札を1枚捨てる', value:'discard'},{key:'return', label:'このカードをデッキに戻す', value:'return'}],
      min:1, max:1, cancelable:false,
      legacy:{onPick:(x)=>{
        if(x && x.value==='discard') API.selectCard('剣闘獣オクタビウス：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{ const r=resolveTarget(t); if(r) API.discard(ctx.player, r.index, '剣闘獣オクタビウス', {byEffect:true, byPlayer:ctx.player}); });
        else u181OctaviusBack(ctx);
      }}});
  },
  afterResolve(){}
}]);

/* 剣闘獣ゲオルディアス: 「剣闘獣スパルティクス」＋「剣闘獣」 / contact. このカードが戦闘によってモンスターを破壊し墓地へ送った時、破壊したモンスターの
   守備力分のダメージを相手ライフに与える。 / 戦闘を行ったバトルフェイズ終了時にこのカードを融合デッキに戻す事で、デッキから「剣闘獣スパルティクス」以外の
   「剣闘獣」2体を自分フィールド上に特殊召喚する。 (the damage uses the destroyed monster's printed DEF) */
defineGladiatorS03('剣闘獣ゲオルディアス', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u181BattleKill(ctx); },
  operation(ctx){ const k = u181BattleKill(ctx) || {}; const d = k.card ? (dbOf(k.card).def||0) : 0; if(d>0) API.damageLP(ctx.opponent, d, '剣闘獣ゲオルディアス'); },
  afterResolve(){}
}, gladiatorTagOutEffectS03('剣闘獣ゲオルディアス', {count:2, exclude:'剣闘獣スパルティクス'})], {type:'fusion', dsTiming:'leave',
  passive:{
    onDamageStep(ctx){ return !!u181BattleKill(ctx); },
    onBattlePhaseEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gladiatorBattledS03(ctx.card); }
  }});
declareContactFusionS03('剣闘獣ゲオルディアス');

/* 剣闘獣ガイザレス: 「剣闘獣ベストロウリィ」＋「剣闘獣」 / contact. ①:特殊召喚に成功した時、フィールドのカードを2枚まで対象として発動できる。
   破壊する。 ②:戦闘を行ったバトルフェイズ終了時にこのカードを持ち主のEXデッキに戻して発動できる。デッキから「剣闘獣ベストロウリィ」以外の「剣闘獣」
   2体を特殊召喚する。 */
defineGladiatorS03('剣闘獣ガイザレス', [{
  key:'destroy-two', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1,
  events:['onSpecialSummon'],
  condition(ctx){ return ctx.zone==='mz' && API.fieldCards({filter:x=>x.card!==ctx.card}).length>0; },
  target(ctx, done){
    const cands = API.fieldCards({filter:x=>x.card!==ctx.card});
    const ok = requestChoiceV49({kind:'card', title:'剣闘獣ガイザレス：破壊するカード（2枚まで）', candidates:cands, min:1, max:2,
      targeting:true, targetingPlayer:ctx.player, cancelable:true, player:ctx.player,
      legacy:{onPick:(first, all)=>done((all||[first]).filter(x=>x && !x.stale)), onCancel:()=>done([])}});
    if(!ok) done([]);
  },
  operation(ctx){ (ctx.selectedTargets||[]).map(t=>resolveTarget(t)).filter(Boolean).forEach(r=>API.destroy(r, '剣闘獣ガイザレス')); },
  afterResolve(){}
}, gladiatorTagOutEffectS03('剣闘獣ガイザレス', {count:2, exclude:'剣闘獣ベストロウリィ'})], {type:'fusion', targets:true});
declareContactFusionS03('剣闘獣ガイザレス');
