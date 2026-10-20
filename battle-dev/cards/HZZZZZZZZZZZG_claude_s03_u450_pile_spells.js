/* S03-U450: 魔の試着部屋, ヴォルカニック・チャージ, 次元融合, ブレンD, バブル・クラッシュ (stale ENGINE_GAP Spells / Traps, carddata texts).

   魔の試着部屋          800ライフポイントを払う。自分のデッキの上からカードを4枚めくり、その中のレベル3以下の通常モンスターを自分フィールド上に特殊召喚する。それ以外のカードはデッキに戻してシャッフルする。
   ヴォルカニック・チャージ （罠）自分の墓地に存在する「ヴォルカニック」と名のついたモンスターカードを3枚までデッキに戻す。
   次元融合              2000ライフポイントを払う。お互いに除外されたモンスターをそれぞれのフィールド上に可能な限り特殊召喚する。
   ブレンD               （罠）自分フィールド上に「D」と名のついたモンスターが2体以上表側表示で存在する場合、相手フィールド上に存在するカードを2枚選択して発動する。相手はその中から1枚を選択し、相手が選択したカード1枚を破壊する。
   バブル・クラッシュ    （罠）手札・フィールド上のカードの合計が6枚以上あるプレイヤーは、その合計が5枚になるようにカードを墓地へ送る。

   Notes
   - 魔の試着部屋: API.payCost 800; the top 4 cards of the Deck (API.pileCards order) are revealed to both players (API.reveal), every Level 3 or lower Normal Monster among them is Special Summoned while Monster Zones are free, then the Deck is shuffled.
   - ヴォルカニック・チャージ: a ChoiceRequest (min 1, max 3) over the 「ヴォルカニック」 monsters of my Graveyard; they go to the Deck (FX_RETURN_DECK) and the Deck is shuffled.
   - 次元融合: API.payCost 2000; for each player the banished monsters of that player are Special Summoned to that player's own field in Attack Position while Monster Zones are free.
   - ブレンD: two opponent cards (Monster / Spell & Trap / Field Zone) are chosen one after another at the activation (targeting, selectTargets); at the resolution the OPPONENT chooses which of the two is destroyed (ChoiceRequest with player = the opponent). 「D」 = GROUP.D_MORPHTRONIC (exact list, as in S03-U254).
   - バブル・クラッシュ: each player with 6+ cards in hand and field chooses (n - 5) of those cards (ChoiceRequest, the turn player first) and sends them to the Graveyard; activatable when at least one player has 6+. */

/* ---- 魔の試着部屋 ---- */
defineScript('魔の試着部屋', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).lp<=800){ ctx.reason = 'LPが足りません'; return false; }
    if(!gameState.players[ctx.player].deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 800, '魔の試着部屋'); done(true); },
  resolve(ctx){
    const top = API.pileCards(ctx.player, 'deck').slice(0, 4); if(!top.length) return;
    API.reveal({cards:top, audience:'both', label:'魔の試着部屋', until:'resolution'});
    top.map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{
      const h = findCardByUid(u); if(!h || h.zone!=='deck' || !hasMonsterZoneSpace(ctx.player)) return;
      const d = dbOf(h.card);
      if(d.k==='m' && Number(d.lv)<=3 && (d.st||[]).indexOf('通常')>=0 && canEffectSpecialSummonS03(h.card, 'deck', '魔の試着部屋')) API.specialSummon(ctx.player, 'deck', h.index, 'atk', '魔の試着部屋');
    });
    API.shuffle(ctx.player);
  },
  afterResolve(){}
});

/* ---- ヴォルカニック・チャージ ---- */
function u450Volcanic(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ヴォルカニック')>=0); }
API.registerChoiceHandler('s03u450.volcanic', (answer, args)=>{
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===args.player) act({type:'FX_RETURN_DECK', player:h.p, zone:'grave', index:h.index, toBottom:false, reason:'ヴォルカニック・チャージ'}); });
  API.shuffle(args.player);
});
defineScript('ヴォルカニック・チャージ', {
  type:'trap', priority:2,
  condition(ctx){ if(!u450Volcanic(ctx.player).length){ ctx.reason = '墓地に「ヴォルカニック」モンスターがいません'; return false; } return true; },
  resolve(ctx){
    const pool = u450Volcanic(ctx.player); if(!pool.length) return; pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'ヴォルカニック・チャージ：デッキに戻す「ヴォルカニック」（3枚まで）', candidates:pool, min:1, max:Math.min(3, pool.length), player:ctx.player, cancelable:false, resume:{handler:'s03u450.volcanic', args:{player:ctx.player}}});
  },
  afterResolve(){}
});

/* ---- 次元融合 ---- */
defineScript('次元融合', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).lp<=2000){ ctx.reason = 'LPが足りません'; return false; }
    if(![0,1].some(p=>API.pileCards(p, 'banish', x=>x.db.k==='m').length)){ ctx.reason = '除外されているモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 2000, '次元融合'); done(true); },
  resolve(ctx){
    [ctx.player, ctx.opponent].forEach(p=>{
      API.pileCards(p, 'banish', x=>x.db.k==='m').map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{
        if(!hasMonsterZoneSpace(p)) return;
        const h = findCardByUid(u); if(h && h.zone==='banish' && h.p===p && canEffectSpecialSummonS03(h.card, 'banish', '次元融合')) API.specialSummon(p, 'banish', h.index, 'atk', '次元融合');
      });
    });
  },
  afterResolve(){}
});

/* ---- ブレンD ---- */
function u450D(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && isCardInGroupV4(x.db,GROUP.D_MORPHTRONIC)}); }
function u450FoeCards(p){ return API.fieldCards({player:p, zone:'mz'}).concat(API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})); }
API.registerChoiceHandler('s03u450.blend', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.p===args.foe && (h.zone==='mz' || h.zone==='sz' || h.zone==='field')) API.destroy(h, 'ブレンD');
});
defineScript('ブレンD', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(u450D(ctx.player).length<2){ ctx.reason = '自分フィールドに表側表示の「D」モンスターが2体以上必要です'; return false; }
    if(u450FoeCards(ctx.opponent).length<2){ ctx.reason = '相手フィールドにカードが2枚以上必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ブレンD：相手のカード（1枚目）', u450FoeCards(ctx.opponent), t1=>{
      const r1 = t1 && resolveTarget(t1); if(!r1){ done([]); return; }
      API.selectCard('ブレンD：相手のカード（2枚目）', u450FoeCards(ctx.opponent).filter(x=>x.card!==r1.card), t2=>done([t1, t2]));
    });
  },
  resolve(ctx){
    const cards = (ctx.selectedTargets || []).map(t=>resolveTarget(t)).filter(r=>r && (r.zone==='mz' || r.zone==='sz' || r.zone==='field') && r.p===ctx.opponent);
    if(!cards.length) return; cards.forEach(x=>ensureCardUid(gameState, x.card));
    if(cards.length===1){ API.destroy(cards[0], 'ブレンD'); return; }
    API.requestChoice({kind:'card', title:'ブレンD：破壊される自分のカードを1枚選ぶ', candidates:cards, min:1, max:1, player:ctx.opponent, cancelable:false, resume:{handler:'s03u450.blend', args:{foe:ctx.opponent}}});
  },
  afterResolve(){}
});

/* ---- バブル・クラッシュ ---- */
function u450Own(p){ return API.pileCards(p, 'hand').concat(API.fieldCards({player:p, zone:'mz'}), API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})); }
function u450Open(p, handler, args){
  const all = u450Own(p), n = all.length - 5; if(n<=0) return false;
  all.forEach(x=>ensureCardUid(gameState, x.card));
  return API.requestChoice({kind:'card', title:'バブル・クラッシュ：墓地へ送るカードを'+n+'枚選ぶ', candidates:all, min:n, max:n, player:p, cancelable:false, resume:{handler, args}});
}
function u450SendPicks(answer, p){
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{
    const h = findCardByUid(u); if(!h || h.p!==p) return;
    if(h.zone==='hand') API.sendHandToGrave(p, h.index, 'バブル・クラッシュ'); else API.sendToGrave(h, 'バブル・クラッシュ');
  });
}
API.registerChoiceHandler('s03u450.crush-1', (answer, args)=>{ u450SendPicks(answer, args.first); u450Open(args.second, 's03u450.crush-2', args); });
API.registerChoiceHandler('s03u450.crush-2', (answer, args)=>{ u450SendPicks(answer, args.second); });
defineScript('バブル・クラッシュ', {
  type:'trap', priority:2,
  condition(ctx){ if(u450Own(0).length<6 && u450Own(1).length<6){ ctx.reason = '手札とフィールドのカードの合計が6枚以上のプレイヤーがいません'; return false; } return true; },
  resolve(ctx){
    const first = gameState.activePlayer, second = first===0 ? 1 : 0, args = {first, second};
    if(!u450Open(first, 's03u450.crush-1', args)) u450Open(second, 's03u450.crush-2', args);
  },
  afterResolve(){}
});
