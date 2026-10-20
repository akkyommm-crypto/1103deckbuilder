/* S03-U428: グリード・グラード, バルーン・リザード, ブリザード・ウォリアー, ジュラック・イグアノン, コカローチ・ナイト, インフェルニティ・ナイト (stale ENGINE_GAP cards, carddata texts; the destruction provenance of S03 v30 / graveInfo).

   グリード・グラード      （速攻魔法）自分が相手フィールド上に表側表示で存在するシンクロモンスターを戦闘またはカードの効果によって破壊したターンに発動する事ができる。自分のデッキからカードを2枚ドローする。
   バルーン・リザード      自分のスタンバイフェイズ毎にこのカードにカウンターを1個乗せる。このカードを破壊したカードのコントローラーにカウンターの数×400ポイントダメージを与える。
   ブリザード・ウォリアー  このカードが戦闘によって相手モンスターを破壊した場合、相手のデッキの一番上のカードを確認してデッキの一番上または一番下に戻す。
   ジュラック・イグアノン  このカードが戦闘によって相手モンスターを破壊した場合、相手フィールド上にセットされたカード1枚を選択して持ち主の手札に戻す事ができる。
   コカローチ・ナイト      このカードが墓地へ送られた時、このカードはデッキの一番上に戻る。
   インフェルニティ・ナイト  フィールド上に存在するこのカードが破壊され墓地へ送られた時、手札を2枚捨てる事でこのカードを墓地から特殊召喚する。

   Notes
   - グリード・グラード: gameState.destroyedThisTurnV30 (turn, byPlayer, victimPlayer, from, face, uid; S03 v30 B3) names the destroyed card by uid; the card (wherever it is now) must be a Synchro Monster.
   - バルーン・リザード: a forced Standby Phase trigger adds a 「カウンター」; the count is mirrored in the card flag u428Cnt (the real counters are gone once the card is in the Graveyard); the Graveyard trigger deals count x 400 to graveInfo.byPlayer (the controller of the destroying effect / the battle opponent).
   - ブリザード・ウォリアー: the reveal is an API.confirm showing the opponent's top card to the controller (the 「いいえ」 answer moves it to the bottom with FX_RETURN_DECK zone 'deck' toBottom) - the information is shown to the controller only in the confirm text.
   - ジュラック・イグアノン / ブリザード・ウォリアー: a6DestroyedFoeInBattle (forced / optional onDamageStep, dsTiming 'after').
   - コカローチ・ナイト: forced Graveyard trigger on its own send → API.returnToDeck(…, false) (top). インフェルニティ・ナイト: optional Graveyard trigger on its destruction from the field (graveInfo.from 'mz' && byDestroy): the cost discards 2 hand cards (u342PickN), then it is Special Summoned. */

function u428Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free']}, extra);
}
function u428Kill(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a6DestroyedFoeInBattle(ctx); }

/* ---- グリード・グラード ---- */
function u428SynchroKilled(p){
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  return log.some(x=>{
    if(!x || x.turn!==gameState.turn || x.byPlayer!==p || x.victimPlayer!==(p===0?1:0) || x.from!=='mz' || x.face!=='up' || x.uid==null) return false;
    const h = findCardByUid(x.uid);
    return !!h && (dbOf(h.card).st || []).indexOf('シンクロ')>=0;
  });
}
defineUnifiedCardV4('グリード・グラード', [{
  key:'draw2', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){
    if(!u428SynchroKilled(ctx.player)){ ctx.reason = 'このターン、相手の表側表示のシンクロモンスターを破壊していません'; return false; }
    if(API.me(ctx).deck.length<2){ ctx.reason = 'デッキが2枚未満です'; return false; }
    return true;
  },
  operation(ctx){ API.draw(ctx.player, 2); }
}], {type:'spell', priority:2});

/* ---- バルーン・リザード ---- */
function u428Count(card){ return (card && card.counters && Number(card.counters['カウンター'])) || 0; }
function u428Standby(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
function u428Boom(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn) && Number(ctx.card.u428Cnt)>0;
}
defineUnifiedCardV4('バルーン・リザード', [{
  key:'tick', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u428Standby(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    API.addCounter(me, 'カウンター', 1);
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u428Cnt', u428Count(me2.card), 'バルーン・リザード', {silent:true});
  },
  afterResolve(){}
}, {
  key:'boom', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u428Boom(ctx); },
  operation(ctx){
    const g = ctx.card.graveInfo, to = (g.byPlayer===0 || g.byPlayer===1) ? g.byPlayer : ctx.opponent;
    API.damageLP(to, 400*Number(ctx.card.u428Cnt), 'バルーン・リザード');
  },
  afterResolve(){}
}], u428Passive({forced:true, activateFrom:['grave'],
  passive:{ onStandbyPhase(ctx){ return u428Standby(ctx); }, onSendToGrave(ctx){ return u428Boom(ctx); } } }));

/* ---- ブリザード・ウォリアー ---- */
defineUnifiedCardV4('ブリザード・ウォリアー', [{
  key:'peek', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u428Kill(ctx) && gameState.players[ctx.opponent].deck.length>0; },
  operation(ctx){
    const D = gameState.players[ctx.opponent].deck; if(!D.length) return;
    const top = D[0], nm = cardName(top), uid = ensureCardUid(gameState, top);
    API.confirm('ブリザード・ウォリアー', `相手のデッキの一番上のカード：「${nm}」\
デッキの一番上に戻しますか？（いいえ＝一番下に戻す）`, ()=>{}, ()=>{
      const D2 = gameState.players[ctx.opponent].deck;
      if(D2.length && D2[0].uid===uid) act({type:'FX_RETURN_DECK', player:ctx.opponent, zone:'deck', index:0, toBottom:true, reason:'ブリザード・ウォリアー'});
    });
  },
  afterResolve(){}
}], u428Passive({forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u428Kill(ctx) && gameState.players[ctx.opponent].deck.length>0; } }}));

/* ---- ジュラック・イグアノン ---- */
function u428FoeSets(ctx){ return API.fieldCards({player:ctx.opponent, zone:'sz', filter:x=>x.card.face==='down'}); }
defineUnifiedCardV4('ジュラック・イグアノン', [{
  key:'bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], targetRange:LOCATION.SZONE, targetSide:'opponent',
  condition(ctx){ return !!u428Kill(ctx) && u428FoeSets(ctx).length>0; },
  operation(ctx){
    const pool = u428FoeSets(ctx); if(!pool.length) return;
    API.selectCard('ジュラック・イグアノン：手札に戻す相手のセットされたカード', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='sz' && r.p===ctx.opponent) API.returnToHand(r, 'ジュラック・イグアノン'); });
  },
  afterResolve(){}
}], u428Passive({dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u428Kill(ctx) && u428FoeSets(ctx).length>0; } }}));

/* ---- コカローチ・ナイト ---- */
function u428Roach(ctx){ const e = ctx.event || {}; return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid; }
defineUnifiedCardV4('コカローチ・ナイト', [{
  key:'back', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u428Roach(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave') API.returnToDeck(me, false, 'コカローチ・ナイト'); },
  afterResolve(){}
}], u428Passive({forced:true, activateFrom:['grave'], passive:{ onSendToGrave(ctx){ return u428Roach(ctx); } }}));

/* ---- インフェルニティ・ナイト ---- */
function u428Inf(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('インフェルニティ・ナイト', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!u428Inf(ctx)){ ctx.reason = 'フィールドで破壊され墓地へ送られた時に発動します'; return false; }
    if(gameState.players[ctx.player].hand.length<2){ ctx.reason = '手札が2枚未満です'; return false; }
    return hasMonsterZoneSpace(ctx.player);
  },
  cost(ctx, done){ u342PickN('インフェルニティ・ナイト：捨てる手札', ctx, c=>API.pileCards(c.player, 'hand'), 2, h=>API.discard(h.p, h.index, 'インフェルニティ・ナイト（コスト）', {byEffect:false}), done); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'インフェルニティ・ナイト'); },
  afterResolve(){}
}], u428Passive({activateFrom:['grave'], includesSpecialSummon:true, passive:{ onSendToGrave(ctx){ return u428Inf(ctx) && gameState.players[ctx.player].hand.length>=2 && hasMonsterZoneSpace(ctx.player); } }}));
