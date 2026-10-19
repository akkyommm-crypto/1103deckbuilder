/* S03-U451: 浅すぎた墓穴, 赤鬼, エア・サーキュレーター, ダーク・リペアラー, 暗黒界の魔神 レイン (stale ENGINE_GAP cards, carddata texts).

   浅すぎた墓穴            お互いのプレイヤーはそれぞれの墓地のモンスター1体を選択し、それぞれのフィールド上に裏側守備表示でセットする。
   赤鬼                    このカードが召喚に成功した時、自分の手札を任意の枚数墓地に送る事で、その枚数分だけフィールド上のカードを持ち主の手札に戻す。
   エア・サーキュレーター  ①:このカードが召喚に成功した時に発動できる。手札を2枚デッキに戻してシャッフルする。その後、自分はデッキから2枚ドローする。
                           ②:このカードが破壊された場合に発動する。自分はデッキから1枚ドローする。
   ダーク・リペアラー      このカードが自分フィールド上から墓地へ送られた時、自分のデッキの一番上のカードを確認してデッキの一番上または一番下に戻す。
   暗黒界の魔神 レイン     このカードが相手のカードの効果によって手札から墓地へ捨てられた場合、このカードを墓地から特殊召喚する。この効果で特殊召喚に成功した時、相手フィールド上の全てのモンスターまたは全ての魔法・罠カードを破壊する。

   Notes
   - 浅すぎた墓穴: the activating player chooses first, then the other player (ChoiceRequest with player = that player, replay-safe); both monsters are then Special Summoned face-down Defense Position to their own fields ({faceDown:true}); activatable when at least one player has a monster in the Graveyard.
   - 赤鬼: the hand cards sent are chosen at the resolution (「事で」= effect processing, not a cost): ChoiceRequest min 0 / max hand size, then the same number of cards on the field (both fields, itself included) are chosen and returned to their owners' hands.
   - エア・サーキュレーター: ① optional Normal Summon trigger (two hand cards ChoiceRequest → Deck, shuffle, draw 2); ② forced trigger from the Graveyard when destroyed (graveInfo.byDestroy, from the field): draw 1.
   - ダーク・リペアラー: forced trigger from the Graveyard when sent from my Monster Zone (any reason); the top card is looked at by its controller only (the choice label) and stays on top or goes to the bottom (DECK_ORDER_V20).
   - 暗黒界の魔神 レイン: forced Graveyard trigger on a discard from the hand by the OPPONENT's effect (darkWorldDiscard === 'opponent'); the second effect is a forced trigger on that Special Summon (a card flag set right after the summon) with a 'declare' choice: all opponent monsters or all opponent Spell & Trap Cards (field zone included). */

/* ---- 浅すぎた墓穴 ---- */
function u451GraveMons(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m'); }
function u451PitSet(p, uid){
  const h = uid!=null ? findCardByUid(uid) : null;
  if(!h || h.zone!=='grave' || h.p!==p || !hasMonsterZoneSpace(p) || !canEffectSpecialSummonS03(h.card, 'grave', '浅すぎた墓穴')) return;
  API.specialSummon(p, 'grave', h.index, 'def', '浅すぎた墓穴', null, {faceDown:true});
}
function u451PitAsk(p, handler, args){
  const pool = u451GraveMons(p); if(!pool.length || !hasMonsterZoneSpace(p)) return false;
  pool.forEach(x=>ensureCardUid(gameState, x.card));
  return API.requestChoice({kind:'card', title:'浅すぎた墓穴：裏側守備表示でセットする墓地のモンスター', candidates:pool, min:1, max:1, player:p, cancelable:false, resume:{handler, args}});
}
API.registerChoiceHandler('s03u451.pit-1', (answer, args)=>{
  const p = u441Picks(answer)[0], a = Object.assign({}, args, {u1: p ? p.card.uid : null});
  if(!u451PitAsk(args.second, 's03u451.pit-2', a)){ u451PitSet(args.first, a.u1); }
});
API.registerChoiceHandler('s03u451.pit-2', (answer, args)=>{
  const p = u441Picks(answer)[0];
  u451PitSet(args.first, args.u1); u451PitSet(args.second, p ? p.card.uid : null);
});
defineScript('浅すぎた墓穴', {
  type:'spell', priority:1,
  condition(ctx){
    const ok = [0,1].some(p=>u451GraveMons(p).length && hasMonsterZoneSpace(p));
    if(!ok){ ctx.reason = '墓地にモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const first = ctx.player, second = ctx.opponent, args = {first, second};
    if(!u451PitAsk(first, 's03u451.pit-1', args)){
      if(!u451PitAsk(second, 's03u451.pit-2', Object.assign({}, args, {u1:null}))) return;
    }
  },
  afterResolve(){}
});

/* ---- 赤鬼 ---- */
function u451Field(){ return [0,1].reduce((a,p)=>a.concat(API.fieldCards({player:p, zone:'mz'}), API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})), []); }
API.registerChoiceHandler('s03u451.aka-2', (answer, args)=>{
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && (h.zone==='mz' || h.zone==='sz' || h.zone==='field')) API.returnToHand(h, '赤鬼'); });
});
API.registerChoiceHandler('s03u451.aka-1', (answer, args)=>{
  const picks = u441Picks(answer).map(x=>x.card.uid); let n = 0;
  picks.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='hand' && h.p===args.player){ API.sendHandToGrave(h.p, h.index, '赤鬼'); n++; } });
  if(!n) return;
  const pool = u451Field(); if(!pool.length) return;
  pool.forEach(x=>ensureCardUid(gameState, x.card));
  const k = Math.min(n, pool.length);
  API.requestChoice({kind:'card', title:'赤鬼：持ち主の手札に戻すフィールド上のカード（'+k+'枚）', candidates:pool, min:k, max:k, player:args.player, cancelable:false, resume:{handler:'s03u451.aka-2', args:{}}});
});
defineScript('赤鬼', {
  type:'monster', priority:1,
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon'){ ctx.reason = 'このカードが召喚に成功した時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const hand = API.pileCards(ctx.player, 'hand'); if(!hand.length) return;
    hand.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'赤鬼：墓地に送る手札（任意の枚数）', candidates:hand, min:0, max:hand.length, player:ctx.player, cancelable:false, resume:{handler:'s03u451.aka-1', args:{player:ctx.player}}});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && API.me(ctx).hand.length>0; } }
});

/* ---- エア・サーキュレーター ---- */
API.registerChoiceHandler('s03u451.air', (answer, args)=>{
  const picks = u441Picks(answer).map(x=>x.card.uid); let n = 0;
  picks.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='hand' && h.p===args.player){ act({type:'FX_RETURN_DECK', player:h.p, zone:'hand', index:h.index, toBottom:false, reason:'エア・サーキュレーター'}); n++; } });
  API.shuffle(args.player);
  if(n===2) API.draw(args.player, 2, 'エア・サーキュレーター');
});
function u451AirDestroyed(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('エア・サーキュレーター', [{
  key:'summon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'],
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon'){ ctx.reason = 'このカードが召喚に成功した時に発動します'; return false; }
    if(API.me(ctx).hand.length<2){ ctx.reason = '手札が2枚必要です'; return false; }
    return true;
  },
  operation(ctx){
    const hand = API.pileCards(ctx.player, 'hand'); if(hand.length<2) return;
    hand.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'エア・サーキュレーター：デッキに戻す手札（2枚）', candidates:hand, min:2, max:2, player:ctx.player, cancelable:false, resume:{handler:'s03u451.air', args:{player:ctx.player}}});
  },
  afterResolve(){}
}, {
  key:'destroyed', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDestroy'], forced:true,
  condition(ctx){ if(!u451AirDestroyed(ctx)){ ctx.reason = 'このカードが破壊された場合に発動します'; return false; } return true; },
  operation(ctx){ API.draw(ctx.player, 1, 'エア・サーキュレーター'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['grave'],
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && API.me(ctx).hand.length>=2; }, onDestroy(ctx){ return u451AirDestroyed(ctx); } } });

/* ---- ダーク・リペアラー ---- */
API.registerChoiceHandler('s03u451.repair', (answer, args)=>{
  const p = (answer && answer.cards || [])[0];
  if(!p || p.value!=='bottom') return;
  const d = gameState.players[args.player].deck; if(!d.length) return;
  act({type:'DECK_ORDER_V20', player:args.player, uids:[ensureCardUid(gameState, d[0])], toBottom:true, reason:'ダーク・リペアラー'});
});
function u451Repairer(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('ダーク・リペアラー', [{
  key:'look', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ if(!u451Repairer(ctx)){ ctx.reason = '自分フィールド上から墓地へ送られた時に発動します'; return false; } return gameState.players[ctx.player].deck.length>0; },
  operation(ctx){
    const d = gameState.players[ctx.player].deck; if(!d.length) return;
    const nm = cardName(d[0]);
    API.requestChoice({kind:'declare', title:'ダーク・リペアラー：デッキの一番上は「'+nm+'」', candidates:[{key:'top', label:'デッキの一番上に戻す（そのまま）', value:'top'}, {key:'bottom', label:'デッキの一番下に戻す', value:'bottom'}], min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u451.repair', args:{player:ctx.player}}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['grave'],
  passive:{ onSendToGrave(ctx){ return u451Repairer(ctx) && gameState.players[ctx.player].deck.length>0; } } });

/* ---- 暗黒界の魔神 レイン ---- */
API.registerChoiceHandler('s03u451.rain', (answer, args)=>{
  const p = (answer && answer.cards || [])[0], mode = p && p.value;
  const pool = mode==='mons' ? API.fieldCards({player:args.foe, zone:'mz'}) : mode==='st' ? API.fieldCards({player:args.foe, zone:'sz'}).concat(API.fieldCards({player:args.foe, zone:'field'})) : [];
  pool.map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{ const h = findCardByUid(u); if(h) API.destroy(h, '暗黒界の魔神 レイン'); });
});
function u451RainSummoned(ctx){
  const e = ctx.event || {};
  return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card) && Number(ctx.card.u451Rain)===Number(gameState.turn);
}
defineUnifiedCardV4('暗黒界の魔神 レイン', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDiscard'], forced:true,
  condition(ctx){
    if(darkWorldDiscard(ctx)!=='opponent'){ ctx.reason = '相手のカードの効果で手札から捨てられた時に発動します'; return false; }
    return ctx.zone==='grave' && hasMonsterZoneSpace(ctx.player);
  },
  operation(ctx){
    const uid = ensureCardUid(gameState, ctx.card), h = findCardByUid(uid);
    if(!h || h.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    if(!API.specialSummon(ctx.player, 'grave', h.index, 'atk', '暗黒界の魔神 レイン')) return;
    const s = findCardByUid(uid); if(s && s.zone==='mz') API.setCardFlag(s, 'u451Rain', gameState.turn, '暗黒界の魔神 レイン', {silent:true});
  },
  afterResolve(){}
}, {
  key:'destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ if(!u451RainSummoned(ctx)){ ctx.reason = 'この効果で特殊召喚に成功した時に発動します'; return false; } return true; },
  operation(ctx){
    API.setCardFlag({card:ctx.card}, 'u451Rain', 0, '暗黒界の魔神 レイン', {silent:true});
    const c = [];
    if(API.fieldCards({player:ctx.opponent, zone:'mz'}).length) c.push({key:'mons', label:'相手フィールド上の全てのモンスターを破壊', value:'mons'});
    if(API.fieldCards({player:ctx.opponent, zone:'sz'}).length || API.fieldCards({player:ctx.opponent, zone:'field'}).length) c.push({key:'st', label:'相手フィールド上の全ての魔法・罠カードを破壊', value:'st'});
    if(!c.length) return;
    API.requestChoice({kind:'declare', title:'暗黒界の魔神 レイン：破壊する対象を選択', candidates:c, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u451.rain', args:{foe:ctx.opponent}}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['grave'], forced:true,
  passive:{ onDiscard(ctx){ return darkWorldDiscard(ctx)==='opponent' && hasMonsterZoneSpace(ctx.player); }, onSpecialSummon(ctx){ return u451RainSummoned(ctx); } } });
