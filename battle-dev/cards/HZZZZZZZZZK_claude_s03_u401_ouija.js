/* S03-U401: ウィジャ盤, 死のメッセージ「E」「A」「T」「H」 (NOT_STARTED cards, carddata texts).

   ウィジャ盤        （永続罠）このカードと「死のメッセージ」カード4種類が自分フィールドに揃った時、自分はデュエルに勝利する。①:相手エンドフェイズにこの効果を発動する。手札・デッキから、「死のメッセージ」カード1枚を「E」「A」「T」「H」の順番で自分の魔法&罠ゾーンに出す。②:自分フィールドの「ウィジャ盤」または「死のメッセージ」カードがフィールドから離れた時に自分フィールドの「ウィジャ盤」及び「死のメッセージ」カードは全て墓地へ送られる。
   死のメッセージ「E」「A」「T」「H」  （永続魔法）このカードは「ウィジャ盤」の効果でしかフィールドに出す事ができない。

   Notes
   - Same shape as the First Sarcophagus (S03-U400): the stage (how many messages were placed) is effectFlags.u401Stage; a forced onEndPhase trigger of the OPPONENT's turn places the next letter (E, A, T, H) from the hand / Deck face-up into the Spell & Trap Zone (act MOVE); selfDestroyWhenS03 (engine/1ZZF) sends every remaining card when a required one is missing.
   - The win is the new field form of engine/1ZZL: specialWinS03:{field:[names]} — the owner wins when every named card stands face-up in the Spell & Trap Zone (checked after every Action like the hand form). Every card is registered with its literal name. */

const U401_LETTERS = ['死のメッセージ「E」','死のメッセージ「A」','死のメッセージ「T」','死のメッセージ「H」'];
function u401Stage(p){ return Number(API.getFlag(p, 'u401Stage'))||0; }
function u401OnField(p, name){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.card.face==='up' && x.db.n===name}); }
function u401Broken(p){
  const S = u401Stage(p); if(S<0) return false;
  if(!u401OnField(p, 'ウィジャ盤').length && (S>0 || U401_LETTERS.some(n=>u401OnField(p, n).length))) return true;
  for(let i=0;i<S;i++) if(!u401OnField(p, U401_LETTERS[i]).length) return true;
  return false;
}
function u401SelfDestroy(card, p){ return u401Broken(p) ? 'ウィジャ盤：「ウィジャ盤」または「死のメッセージ」がフィールドから離れたため全て墓地へ送られる' : false; }
const U401_MESSAGE_BODY = {
  type:'spell', priority:1,
  condition(ctx){ ctx.reason = '「ウィジャ盤」の効果でしかフィールドに出す事ができません'; return false; },
  resolve(){}, afterResolve(){},
  selfDestroyWhenS03:u401SelfDestroy
};
defineScript('死のメッセージ「E」', Object.assign({}, U401_MESSAGE_BODY));
defineScript('死のメッセージ「A」', Object.assign({}, U401_MESSAGE_BODY));
defineScript('死のメッセージ「T」', Object.assign({}, U401_MESSAGE_BODY));
defineScript('死のメッセージ「H」', Object.assign({}, U401_MESSAGE_BODY));
function u401EndTurnOpp(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && ctx.player!==gameState.activePlayer; }
function u401Find(p, name){
  return API.pileCards(p, 'hand', x=>x.db.n===name).map(x=>({zone:'hand', x})).concat(API.pileCards(p, 'deck', x=>x.db.n===name).map(x=>({zone:'deck', x})));
}
defineUnifiedCardV4('ウィジャ盤', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); },
  operation(ctx){ API.setFlag(ctx.player, 'u401Stage', 0, false); }, afterResolve(){}
}, {
  key:'message', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u401EndTurnOpp(ctx) && u401Stage(ctx.player)<4; },
  operation(ctx){
    const p = ctx.player, S = u401Stage(p); if(S>=4) return;
    const f = u401Find(p, U401_LETTERS[S])[0]; if(!f || gameState.players[p].sz.length>=ZONE_LIMITS.sz) return;
    act({type:'MOVE', player:p, from:f.zone, fromIndex:f.x.index, to:'sz', face:'up', pos:'atk'});
    API.setFlag(p, 'u401Stage', S+1, false);
  },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, selfDestroyWhenS03:u401SelfDestroy,
  specialWinS03:{ field:['ウィジャ盤'].concat(U401_LETTERS), label:'ウィジャ盤' },
  passive:{ onEndPhase(ctx){ return u401EndTurnOpp(ctx) && u401Stage(ctx.player)<4; } } });
CARD_SCRIPTS['ウィジャ盤'].selfDestroyWhenS03 = u401SelfDestroy;
CARD_SCRIPTS['ウィジャ盤'].specialWinS03 = { field:['ウィジャ盤'].concat(U401_LETTERS), label:'ウィジャ盤' };
