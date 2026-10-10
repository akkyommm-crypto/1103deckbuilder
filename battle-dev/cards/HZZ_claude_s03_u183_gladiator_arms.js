/* =========================================================================
   S03-U183 — 剣闘獣の闘器 equip spells (engine/1ZZB) + 剣闘獣の戦車 / 剣闘獣の底力. 2011 texts.
   Common 闘器 text: 「剣闘獣」と名のついたモンスターにのみ装備可能。 / 装備モンスターが自分フィールド上からデッキに戻る事によってこのカードが
   墓地へ送られた時、このカードを手札に戻す。 (the return is a forced trigger of the card in the GY)
   ========================================================================= */
function u183GladiatorFaceUp(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && isGladiatorCardDbS03(x.db)}); }
function u183Equipped(card, self){ return !!(self && self.equipTo && card && self.equipTo.uid===card.uid); }
function u183ArmsEffects(name){
  return [{
    key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
    condition(){ return u183GladiatorFaceUp().length>0; },
    target(ctx, done){ API.selectCard(`${name}：装備する「剣闘獣」モンスター`, u183GladiatorFaceUp(), t=>done([t])); },
    operation(ctx){
      const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(s && t && t.card.face==='up' && isGladiatorCardDbS03(dbOf(t.card))) API.equipSpell(s, t, name);
    },
    afterResolve(){}
  },{
    key:'back-to-hand', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1,
    events:['onSendToGrave'], forced:true,
    condition(ctx){ return armsReturnTriggerS03(ctx); },
    operation(ctx){ const h = findCardByUid(ensureCardUid(gameState, ctx.card)); if(h && h.zone==='grave') API.returnToHand(h, name); },
    afterResolve(){}
  }];
}
function u183DefineArms(name, meta){
  defineUnifiedCardV4(name, u183ArmsEffects(name), Object.assign({type:'spell', priority:1, targets:true, activateFrom:['hand','sz','grave'],
    passive:{onSendToGrave(ctx){ return armsReturnTriggerS03(ctx); }}}, meta||{}));
}
/* グラディウス: 装備モンスターの攻撃力は300ポイントアップする。 */
u183DefineArms('剣闘獣の闘器グラディウス', {continuous:{scope:'allMonsters', from:['sz'], apply(card, self){ return u183Equipped(card, self) ? {atk:300} : null; }}});
/* マニカ: 装備モンスターは戦闘では破壊されない。 */
u183DefineArms('剣闘獣の闘器マニカ', {continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; }, battleProof(card, self){ return u183Equipped(card, self); }}});
/* デーモンズシールド: 装備モンスターが破壊される場合、代わりにこのカードを破壊する。 (mandatory, engine/1ZZB) */
u183DefineArms('剣闘獣の闘器デーモンズシールド', {equipSubstituteS03:true});
/* ハルバード: 装備モンスターが攻撃を行ったダメージステップ終了時、フィールド上の魔法または罠カード1枚を破壊する。 (forced; chosen at resolution) */
(function(){
  const name = '剣闘獣の闘器ハルバード';
  const eff = u183ArmsEffects(name);
  const attacked = ctx=>{
    const b = ctx.battle || {};
    return ctx.zone==='sz' && ctx.card.face==='up' && ctx.step==='end' && !!ctx.card.equipTo && !!b.atkCard && b.atkCard.uid===ctx.card.equipTo.uid;
  };
  const stPool = ()=>API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'});
  eff.push({
    key:'halberd', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1,
    events:['onDamageStep'], forced:true,
    condition(ctx){ return attacked(ctx) && stPool().length>0; },
    operation(ctx){
      const pool = stPool(); if(!pool.length) return;
      API.selectCard('剣闘獣の闘器ハルバード：破壊する魔法・罠カード', pool, t=>{ const r = resolveTarget(t); if(r && (r.zone==='sz'||r.zone==='field')) API.destroy(r, name); });
    },
    afterResolve(){}
  });
  defineUnifiedCardV4('剣闘獣の闘器ハルバード', eff, {type:'spell', priority:1, targets:true, activateFrom:['hand','sz','grave'], dsTiming:'end',
    passive:{onSendToGrave(ctx){ return armsReturnTriggerS03(ctx); }, onDamageStep(ctx){ return attacked(ctx) && stPool().length>0; }}});
})();

/* 剣闘獣の戦車 (Counter Trap): ①:自分フィールドに「剣闘獣」モンスターが存在し、モンスターの効果が発動した時に発動できる。その発動を無効にし破壊する。 */
defineScript('剣闘獣の戦車', {
  type:'counter', priority:3,
  condition(ctx){
    const top = gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null;
    const d = top ? (CARD_DB[top.cardId]||{}) : {};
    if(!top || d.k!=='m'){ ctx.reason='モンスターの効果の発動にチェーンします'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isGladiatorCardDbS03(x.db)}).length){ ctx.reason='自分フィールドに「剣闘獣」モンスターが必要です'; return false; }
    return true;
  },
  resolve(){ negatePreviousChainLinkV2('剣闘獣の戦車', true, 'activation'); }
});

/* 剣闘獣の底力 (Quick-Play): 自分フィールド上の「剣闘獣」モンスター1体を選択し、攻撃力をエンドフェイズ時まで500アップ。 / 墓地に存在する場合、
   自分のメインフェイズ時にこのカード以外の自分の墓地の「剣闘獣」と名のついたカード2枚をデッキに戻す事で、墓地のこのカードを手札に戻す。 */
function u183OwnGladiators(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && isGladiatorCardDbS03(x.db)}); }
defineUnifiedCardV4('剣闘獣の底力', [{
  key:'boost', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){ return u183OwnGladiators(ctx.player).length>0; },
  target(ctx, done){ API.selectCard('剣闘獣の底力：攻撃力を上げる「剣闘獣」', u183OwnGladiators(ctx.player), t=>done([t])); },
  operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && r.zone==='mz' && r.card.face==='up') API.modAtk(r, 500, 0, 'endTurn', '剣闘獣の底力'); },
  afterResolve(){}
},{
  key:'recycle', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason='墓地で使用します'; return false; }
    return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && isGladiatorCardDbS03(x.db)).length>=2;
  },
  cost(ctx, done){
    const pick = (n, taken)=>{
      if(n===0){ done(true); return; }
      const pool = API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && isGladiatorCardDbS03(x.db) && taken.indexOf(x.card.uid)<0);
      if(!pool.length){ done(false); return; }
      API.selectCard(`剣闘獣の底力：デッキに戻す「剣闘獣」カード（残り${n}枚）`, pool, t=>{ const r = resolveTarget(t); if(!r){ done(false); return; } taken.push(r.card.uid); API.returnToDeck(r, false, '剣闘獣の底力（コスト）'); pick(n-1, taken); });
    };
    pick(2, []);
  },
  operation(ctx){ const h = findCardByUid(ensureCardUid(gameState, ctx.card)); if(h && h.zone==='grave'){ API.shuffle(ctx.player); API.returnToHand(h, '剣闘獣の底力'); } },
  afterResolve(){}
}], {type:'spell', priority:2, quickEffect:true, targets:true, activateFrom:['hand','sz','grave'], countLimit:null});
