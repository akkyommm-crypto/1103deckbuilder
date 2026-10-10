/* =========================================================================
   S03-U179 — E・HERO ストーム・ネオス / E・HERO マグマ・ネオス (contact fusion, engine/1ZW).
   ストーム・ネオス: 1ターンに1度、自分のメインフェイズ時にフィールド上の魔法・罠カードを全て破壊できる。 / エンドフェイズ時、エクストラデッキに
     戻る。 / この効果によってこのカードがエクストラデッキに戻った時、フィールド上のカードを全て持ち主のデッキに戻す。
   マグマ・ネオス: 攻撃力は、フィールド上のカードの数×400ポイントアップする。 / エンドフェイズ時、エクストラデッキに戻る。 / この効果によって
     このカードがエクストラデッキに戻った時、フィールド上のカードを全て持ち主の手札に戻す。
   The follow-up is a separate forced trigger of the card in the EX Deck (epReturnedTriggerS03), as in the 2011 rulings / ocgcore.
   ========================================================================= */
function u179FieldCards(){ return API.fieldCards({}); }
function u179AfterReturnEffect(name, dest){
  return {
    key:'after-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.EXTRA, targetRange:LOCATION.ONFIELD, targetSide:'both',
    speed:1, events:['onLeaveField'], forced:true,
    condition(ctx){ return epReturnedTriggerS03(ctx); },
    operation(){
      const uids = u179FieldCards().map(x=>ensureCardUid(gameState, x.card));
      const decks = [];
      uids.forEach(u=>{
        const h = findCardByUid(u); if(!h || ['mz','sz','field'].indexOf(h.zone)<0) return;
        if(dest==='deck'){ const owner = cardOwnerIndex(gameState, h.card, h.p); if(decks.indexOf(owner)<0) decks.push(owner); API.returnToDeck(h, false, name); }
        else API.returnToHand(h, name);
      });
      decks.forEach(q=>act({type:'SHUFFLE', player:q}));
    },
    afterResolve(){}
  };
}
defineUnifiedCardV4('E・HERO ストーム・ネオス',[{
  key:'st-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'both',
  speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
    if(!API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).length){ ctx.reason='フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  operation(){ API.destroyAll('sz', null, 'E・HERO ストーム・ネオス'); API.destroyAll('field', null, 'E・HERO ストーム・ネオス'); },
  afterResolve(){}
}, endPhaseReturnExEffectS03('E・HERO ストーム・ネオス'), u179AfterReturnEffect('E・HERO ストーム・ネオス','deck')],{
  type:'fusion', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['st-destroy']}, activateFrom:['mz','ex'],
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}, onLeaveField(ctx){ return epReturnedTriggerS03(ctx); }}
});
declareContactFusionS03('E・HERO ストーム・ネオス');

defineUnifiedCardV4('E・HERO マグマ・ネオス',[endPhaseReturnExEffectS03('E・HERO マグマ・ネオス'), u179AfterReturnEffect('E・HERO マグマ・ネオス','hand')],{
  type:'fusion', priority:1, activateFrom:['mz','ex'],
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}, onLeaveField(ctx){ return epReturnedTriggerS03(ctx); }},
  continuous:{scope:'self', from:['mz'], apply(){ const n=u179FieldCards().length; return n ? {atk:n*400} : null; }}
});
declareContactFusionS03('E・HERO マグマ・ネオス');
