/* S03-U364: four monsters (carddata texts) and a new destroy-substitute kind (counter).

   デス・モスキート  召喚・特殊召喚に成功した時、カウンターを2つ置く。カウンター1つにつき攻撃力500アップ。戦闘によって破壊される場合、代わりにカウンターを1つ取り除く。
   メタル・シューター 召喚に成功した時、カウンターを2つ置く。カウンター1つにつき攻撃力800アップ。他のカードの効果によって破壊される場合、代わりにカウンターを1つ取り除く。
   コンボファイター  表側表示で存在する時に自分ターンのメインフェイズ1でチェーンが発生した場合、このターンのみ1度のバトルフェイズ中に2回攻撃できる。
   コンボマスター    （同じ。コンボファイターと同じ効果）

   Notes
   - The substitute is destroySubstituteS03:{kind:'counter', counter:'カウンター', causes:[…], mandatory:true} (engine/1ZV, S03-U364): the protected card's own counter is removed instead of the destruction; because the text is mandatory the choice is made automatically when it is the only substitute.
   - Counters: API.addCounter / countCounter; the ATK is a continuous modifier of the counter count.
   - コンボ: a forced trigger on onActivateSuccess in my Main Phase 1 stamps a card flag with the turn; attackLimit(card) (as 重装武者－ベン・ケイ) returns 2 for that turn. */

/* ---- デス・モスキート / メタル・シューター ---- */
function u364Counters(card){ const h = card && findCardByUid(card.uid); return (h && h.zone==='mz') ? API.countCounter(h, 'カウンター') : 0; }
function u364Summoned(ctx, kinds){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
  if(Array.isArray(e.cards) ? e.cards.indexOf(ctx.card)>=0 : (e.card===ctx.card)) return kinds.indexOf(ctx.eventName)>=0;
  return false;
}
function u364Counter(name, perCounter, onKinds, subCause){
  defineUnifiedCardV4(name, [{
    key:'counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:onKinds, forced:true,
    condition(ctx){ return u364Summoned(ctx, onKinds); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.addCounter(me, 'カウンター', 2); },
    afterResolve(){}
  }], {type:'monster', priority:1, forced:true, timing:['free'],
    passive:onKinds.reduce((o,k)=>{ o[k] = ctx=>u364Summoned(ctx, onKinds); return o; }, {}),
    destroySubstituteS03:{kind:'counter', counter:'カウンター', causes:subCause, mandatory:true},
    continuous:{ scope:'self', from:['mz'], apply(card, self){ const n = u364Counters(self); return (card===self && self.face==='up' && n>0) ? {atk:perCounter*n} : null; } } });
}
u364Counter('デス・モスキート', 500, ['onNormalSummon','onSpecialSummon'], ['battle']);
u364Counter('メタル・シューター', 800, ['onNormalSummon'], ['effect']);

/* ---- コンボファイター / コンボマスター ---- */
function u364ComboChain(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.activePlayer===ctx.player && gameState.phase==='main1' && Number(ctx.card.u364ComboTurn)!==Number(gameState.turn); }
function u364Combo(name){
  defineUnifiedCardV4(name, [{
    key:'combo', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'], forced:true,
    condition(ctx){ return u364ComboChain(ctx); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u364ComboTurn', gameState.turn, name, {silent:true}); },
    afterResolve(){}
  }], {type:'monster', priority:1, forced:true, timing:['free'], onOtherSummon:true,
    passive:{ onActivateSuccess(ctx){ return u364ComboChain(ctx); } },
    attackLimit(card){ return Number(card.u364ComboTurn)===Number(gameState.turn) ? 2 : 1; } });
}
u364Combo('コンボファイター');
u364Combo('コンボマスター');
