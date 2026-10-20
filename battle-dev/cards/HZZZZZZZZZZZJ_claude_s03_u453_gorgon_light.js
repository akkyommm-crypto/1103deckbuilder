/* S03-U453: ゴーゴンの眼, 裁きの光, 連鎖除外 (stale ENGINE_GAP Traps, carddata texts).

   ゴーゴンの眼  エンドフェイズ終了時まで、フィールド上に存在する守備表示モンスターの効果は無効化される。
   裁きの光      ①:フィールドに「天空の聖域」が存在する場合に手札から光属性モンスター1体を墓地へ捨てて発動できる。以下の効果から1つを選んで適用する。
                 ●相手の手札を確認し、その中からカード1枚を選んで墓地へ送る。 ●相手フィールドのカード1枚を選んで墓地へ送る。
   連鎖除外      攻撃力1000以下のモンスターが召喚・反転召喚・特殊召喚に成功した時に発動できる。その攻撃力1000以下のモンスターをゲームから除外し、さらに除外したカードと同名カードを相手の手札・デッキから全て除外する。

   Notes
   - ゴーゴンの眼: the used Trap registers itself as a lingering source for this turn (API.lingerS03, S03-U257) with a turn-stamped card flag; continuous.negateEffect (scope 'allMonsters') is true for monsters in Defense Position, read when an effect is activated / applied, so a monster that is turned to Attack Position later is not negated and one negated at its activation stays negated (ruling 10/08/16 follows the position at the activation).
   - 裁きの光: cost = discard one LIGHT monster of the hand (API.discard, not an effect discard); resolution = a 'declare' ChoiceRequest for the mode, then a ChoiceRequest over the opponent's hand (all shown to me) or the opponent's field cards; the chosen card is SENT to the Graveyard (not destroyed).
   - 連鎖除外: onOtherSummon Trap (Normal / Flip / Special Summon events); the summoned face-up monster with ATK 1000 or less is banished (a ChoiceRequest when several were summoned at once) and every card with the same name in the opponent's hand and Deck is banished. */

/* ---- ゴーゴンの眼 ---- */
defineScript('ゴーゴンの眼', {
  type:'trap', priority:2,
  condition(ctx){ return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u453GorgonTurn', gameState.turn, 'ゴーゴンの眼');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'ゴーゴンの眼');
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    negateEffect(card, self){
      return !!self && !!card && Number(self.u453GorgonTurn)===Number(gameState.turn) && card.pos==='def';
    } }
});

/* ---- 裁きの光 ---- */
function u453Sanctuary(){ return [0,1].some(p=>API.fieldCards({player:p, zone:'field', filter:x=>x.card.face==='up' && x.db.n==='天空の聖域'}).length>0); }
function u453LightHand(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.db.at==='光'); }
function u453FoeField(p){ return API.fieldCards({player:p, zone:'mz'}).concat(API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})); }
API.registerChoiceHandler('s03u453.light-send', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.p===args.foe && (h.zone==='hand' || h.zone==='mz' || h.zone==='sz' || h.zone==='field')){
    if(h.zone==='hand') API.sendHandToGrave(h.p, h.index, '裁きの光'); else API.sendToGrave(h, '裁きの光');
  }
});
API.registerChoiceHandler('s03u453.light-mode', (answer, args)=>{
  const p = (answer && answer.cards || [])[0], mode = p && p.value;
  const pool = mode==='hand' ? API.pileCards(args.foe, 'hand') : mode==='field' ? u453FoeField(args.foe) : [];
  if(!pool.length) return;
  pool.forEach(x=>ensureCardUid(gameState, x.card));
  API.requestChoice({kind:'card', title:mode==='hand' ? '裁きの光：墓地へ送る相手の手札' : '裁きの光：墓地へ送る相手フィールドのカード', candidates:pool, min:1, max:1, player:args.me, cancelable:false, resume:{handler:'s03u453.light-send', args:{foe:args.foe}}});
});
defineScript('裁きの光', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u453Sanctuary()){ ctx.reason = 'フィールドに「天空の聖域」が存在しません'; return false; }
    if(!u453LightHand(ctx.player).length){ ctx.reason = '手札に光属性モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u453LightHand(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('裁きの光：捨てる光属性モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '裁きの光', {byEffect:false}); done(true);
    });
  },
  resolve(ctx){
    const c = [];
    if(gameState.players[ctx.opponent].hand.length) c.push({key:'hand', label:'相手の手札を確認し、カード1枚を墓地へ送る', value:'hand'});
    if(u453FoeField(ctx.opponent).length) c.push({key:'field', label:'相手フィールドのカード1枚を墓地へ送る', value:'field'});
    if(!c.length) return;
    API.requestChoice({kind:'declare', title:'裁きの光：効果を1つ選択', candidates:c, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u453.light-mode', args:{foe:ctx.opponent, me:ctx.player}}});
  },
  afterResolve(){}
});

/* ---- 連鎖除外 ---- */
function u453Summoned(ctx){
  const ev = ctx.event || {};
  const cards = Array.isArray(ev.cards) ? ev.cards : (ev.card ? [ev.card] : []);
  return cards.map(card=>{ const h = locateCard(card); return (h && h.zone==='mz') ? {p:h.p, zone:h.zone, index:h.index, card, db:dbOf(card)} : null; })
    .filter(x=>x && x.card.face==='up' && curATK(x.card)<=1000);
}
function u453Banish(ctx, uid){
  const h = findCardByUid(uid); if(!h || h.zone!=='mz' || h.card.face!=='up' || curATK(h.card)>1000) return;
  const nm = dbOf(h.card).n; if(!nm) return;
  API.banish(h, '連鎖除外');
  const same = x=>x.db.n===nm;
  API.pileCards(ctx.opponent, 'hand', same).concat(API.pileCards(ctx.opponent, 'deck', same)).map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{ const t = findCardByUid(u); if(t) API.banish(t, '連鎖除外'); });
}
API.registerChoiceHandler('s03u453.chain', (answer, args)=>{
  const p = u441Picks(answer)[0]; if(!p) return;
  u453Banish({opponent:args.foe}, p.card.uid);
});
defineScript('連鎖除外', {
  type:'trap', priority:2, onOtherSummon:true,
  condition(ctx){ if(!u453Summoned(ctx).length){ ctx.reason = '攻撃力1000以下のモンスターが召喚・反転召喚・特殊召喚に成功した時に発動します'; return false; } return true; },
  resolve(ctx){
    const t = u453Summoned(ctx); if(!t.length) return;
    if(t.length===1){ u453Banish(ctx, ensureCardUid(gameState, t[0].card)); return; }
    t.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'連鎖除外：除外する攻撃力1000以下のモンスター', candidates:t, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u453.chain', args:{foe:ctx.opponent}}});
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onFlip(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && !!(ctx.event && ctx.event.flipSummon); }
  }
});
