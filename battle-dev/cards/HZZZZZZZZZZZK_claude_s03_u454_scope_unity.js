/* S03-U454: 古代の遠眼鏡, コザッキーの研究成果, 電磁シールド, 同姓同名同盟条約, 成功確率0%, 友情 YU－JYO (stale ENGINE_GAP Spells / Traps, carddata texts).

   古代の遠眼鏡          相手のデッキのカードを、上から5枚まで見ることができる。その後カードを元通りにする。
   コザッキーの研究成果  （罠）自分のデッキのカードを上から3枚確認し、そのカードを好きな順番に入れ替えてデッキの上に戻す。
   電磁シールド          （永続魔法）自分フィールド上に表側守備表示で存在するレベル3以下の雷族モンスターは戦闘では破壊されない。自分フィールド上にモンスターが表側攻撃表示で存在する場合、このカードを破壊する。
   同姓同名同盟条約      （罠）自分フィールド上にトークン以外の同名モンスターが表側表示で2体以上存在する場合に発動できる。2体:相手フィールド上の魔法・罠カード1枚を破壊する。3体:相手フィールド上の魔法・罠カードを全て破壊する。
   成功確率0%            （罠）相手の融合デッキから融合モンスター2体をランダムに墓地に送る。
   友情 YU－JYO          ①:相手プレイヤーに握手を申し込む。相手が握手に応じた場合、お互いのLPは、お互いのLPを合計した数値の半分になる。自分の手札に「結束 UNITY」がある場合、そのカードを相手に見せる事ができる。その場合、お互いは握手をして、このカードの効果を適用する。

   Notes
   - 古代の遠眼鏡: the controller sees the names in a 'declare' ChoiceRequest (one OK candidate whose label lists the top cards); nothing moves.
   - コザッキーの研究成果: the top three cards are picked one after another by the controller (ChoiceRequest, the last one is automatic) and put back with DECK_ORDER_V20 (the first picked ends up on top).
   - 電磁シールド: continuous.battleProof (scope 'ownMonsters', from the Spell & Trap Zone) for face-up Defense Position Level 3 or lower Thunder monsters; selfDestroyWhenS03 while a face-up Attack Position monster of mine exists (also at the activation, like the other S03 Continuous Spells).
   - 同姓同名同盟条約: the largest group of face-up non-Token monsters with one name decides (2 → one opponent Spell / Trap chosen at the resolution, 3 or more → all of them; the opponent's Field Zone counts as a Spell Card).
   - 成功確率0%: two random Fusion Monsters of the opponent's Extra Deck (duelRandomInt) are sent to the Graveyard; fewer than two → all.
   - 友情 YU－JYO: LP are set (LP Action without a cause) to half of the sum; the opponent answers a 'declare' ChoiceRequest (shake hands or not); a 「結束 UNITY」 in my hand can be shown instead, which needs no answer. */

/* ---- 古代の遠眼鏡 ---- */
API.registerChoiceHandler('s03u454.scope', ()=>{});
defineScript('古代の遠眼鏡', {
  type:'spell', priority:1,
  condition(ctx){ if(!gameState.players[ctx.opponent].deck.length){ ctx.reason = '相手のデッキにカードがありません'; return false; } return true; },
  resolve(ctx){
    const top = gameState.players[ctx.opponent].deck.slice(0, 5); if(!top.length) return;
    const label = top.map((c, i)=>(i+1)+'：'+cardName(c)).join(' / ');
    API.requestChoice({kind:'declare', title:'古代の遠眼鏡：相手のデッキの上から'+top.length+'枚', candidates:[{key:'ok', label, value:'ok'}], min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u454.scope', args:{}}});
  },
  afterResolve(){}
});

/* ---- コザッキーの研究成果 ---- */
function u454KozAsk(p, pool, picked){
  const left = pool.filter(u=>picked.indexOf(u)<0);
  if(left.length<=1){
    const order = picked.concat(left);
    act({type:'DECK_ORDER_V20', player:p, uids:order, toBottom:false, reason:'コザッキーの研究成果'});
    return;
  }
  const cards = API.pileCards(p, 'deck').filter(x=>left.indexOf(x.card.uid)>=0);
  cards.forEach(x=>ensureCardUid(gameState, x.card));
  API.requestChoice({kind:'card', title:'コザッキーの研究成果：デッキの上から'+(picked.length+1)+'枚目にするカード', candidates:cards, min:1, max:1, player:p, cancelable:false, resume:{handler:'s03u454.koz', args:{player:p, pool, picked}}});
}
API.registerChoiceHandler('s03u454.koz', (answer, args)=>{
  const p = u441Picks(answer)[0]; if(!p) return;
  u454KozAsk(args.player, args.pool, args.picked.concat([p.card.uid]));
});
defineScript('コザッキーの研究成果', {
  type:'trap', priority:2,
  condition(ctx){ if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; } return true; },
  resolve(ctx){
    const top = API.me(ctx).deck.slice(0, 3); if(!top.length) return;
    const pool = top.map(c=>ensureCardUid(gameState, c));
    u454KozAsk(ctx.player, pool, []);
  },
  afterResolve(){}
});

/* ---- 電磁シールド ---- */
function u454Guarded(card){ const d = dbOf(card); return !!d && d.k==='m' && card.face==='up' && card.pos==='def' && d.ra==='雷' && Number(d.lv)<=3; }
defineUnifiedCardV4('電磁シールド', [u422Act(false)], {
  type:'spell', priority:1,
  selfDestroyWhenS03:(card, p)=> API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk' && x.db.k==='m'}).length ? '電磁シールド：自分フィールドに表側攻撃表示のモンスターが存在するため破壊' : false,
  continuous:{ scope:'ownMonsters', from:['sz'], apply(){ return null; },
    battleProof(card, self){ return !!self && self.face==='up' && u454Guarded(card); } } });

/* ---- 同姓同名同盟条約 ---- */
function u454Group(p){
  const cnt = {};
  API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && !x.card.token}).forEach(x=>{ cnt[x.db.n] = (cnt[x.db.n]||0) + 1; });
  return Object.keys(cnt).reduce((m, k)=>Math.max(m, cnt[k]), 0);
}
function u454FoeSt(p){ return API.fieldCards({player:p, zone:'sz'}).concat(API.fieldCards({player:p, zone:'field'})); }
API.registerChoiceHandler('s03u454.treaty', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.p===args.foe && (h.zone==='sz' || h.zone==='field')) API.destroy(h, '同姓同名同盟条約');
});
defineScript('同姓同名同盟条約', {
  type:'trap', priority:2,
  condition(ctx){ if(u454Group(ctx.player)<2){ ctx.reason = '自分フィールドにトークン以外の同名の表側表示モンスターが2体以上必要です'; return false; } return true; },
  resolve(ctx){
    const n = u454Group(ctx.player), pool = u454FoeSt(ctx.opponent); if(n<2 || !pool.length) return;
    if(n>=3){ pool.map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{ const h = findCardByUid(u); if(h) API.destroy(h, '同姓同名同盟条約'); }); return; }
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'同姓同名同盟条約：破壊する相手の魔法・罠カード', candidates:pool, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u454.treaty', args:{foe:ctx.opponent}}});
  },
  afterResolve(){}
});

/* ---- 成功確率0% ---- */
defineScript('成功確率0%', {
  type:'trap', priority:2,
  condition(ctx){ return true; },
  resolve(ctx){
    for(let i=0; i<2; i++){
      const ex = (gameState.players[ctx.opponent].ex || []); if(!ex.length) return;
      const k = duelRandomInt(ex.length), c = ex[k];
      const h = findCardByUid(ensureCardUid(gameState, c)); if(h) API.sendToGrave(h, '成功確率0%');
    }
  },
  afterResolve(){}
});

/* ---- 友情 YU－JYO ---- */
function u454Apply(){
  const l0 = gameState.players[0].lp, l1 = gameState.players[1].lp, half = Math.ceil((l0 + l1) / 2);
  [0, 1].forEach(p=>{ const d = half - gameState.players[p].lp; if(d) act({type:'LP', player:p, delta:d}); });
}
API.registerChoiceHandler('s03u454.yujyo-foe', (answer)=>{
  const p = (answer && answer.cards || [])[0]; if(p && p.value==='yes') u454Apply();
});
function u454AskFoe(me, foe){
  API.requestChoice({kind:'declare', title:'友情 YU－JYO：握手に応じますか（お互いのLPを合計の半分にする）', candidates:[{key:'yes', label:'握手に応じる', value:'yes'}, {key:'no', label:'応じない', value:'no'}], min:1, max:1, player:foe, cancelable:false, resume:{handler:'s03u454.yujyo-foe', args:{}}});
}
API.registerChoiceHandler('s03u454.yujyo-me', (answer, args)=>{
  const p = (answer && answer.cards || [])[0];
  if(p && p.value==='unity') u454Apply(); else u454AskFoe(args.me, args.foe);
});
defineScript('友情 YU－JYO', {
  type:'spell', priority:1,
  condition(ctx){ return true; },
  resolve(ctx){
    if(API.pileCards(ctx.player, 'hand', x=>x.db.n==='結束 UNITY').length){
      API.requestChoice({kind:'declare', title:'友情 YU－JYO：「結束 UNITY」を見せますか', candidates:[{key:'unity', label:'「結束 UNITY」を見せて握手させる', value:'unity'}, {key:'ask', label:'相手に握手を申し込む', value:'ask'}], min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u454.yujyo-me', args:{me:ctx.player, foe:ctx.opponent}}});
      return;
    }
    u454AskFoe(ctx.player, ctx.opponent);
  },
  afterResolve(){}
});
