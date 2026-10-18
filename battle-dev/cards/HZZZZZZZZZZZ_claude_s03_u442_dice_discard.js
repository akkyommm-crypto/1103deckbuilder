/* S03-U442: デンジャラスマシン TYPE－6, グラディアル・チェンジ, 暗黒の謀略, バッド・エンド・クイーン・ドラゴン (stale ENGINE_GAP / NOT_STARTED cards, carddata texts).

   デンジャラスマシン TYPE－6   （永続魔法）自分のスタンバイフェイズ毎にサイコロを1回振る。出た目の効果を適用する。1・自分は手札を1枚捨てる。2・相手は手札を1枚捨てる。3・自分はカードを1枚ドローする。4・相手はカードを1枚ドローする。5・相手フィールド上モンスター1体を破壊する。6・このカードを破壊する。
   グラディアル・チェンジ        （罠）自分フィールド上に「剣闘獣」と名のついたモンスターが特殊召喚された時に発動する事ができる。相手は手札を1枚選択して捨てる。
   暗黒の謀略                    （罠）お互いのプレイヤーは手札を2枚選択して捨て、デッキからカードを2枚ドローする。相手は手札を1枚捨ててこのカードの効果を無効にする事ができる。
   バッド・エンド・クイーン・ドラゴン  このカードは通常召喚できない。自分フィールド上の永続魔法カードが3枚以上の場合に特殊召喚できる。このカードの攻撃によって相手ライフに戦闘ダメージを与えた時、相手は手札を1枚選んで墓地へ送り、自分はデッキからカードを1枚ドローする。また、このカードがフィールド上から墓地へ送られていた場合、自分のスタンバイフェイズ時に、自分フィールド上に表側表示で存在する永続魔法カード1枚を墓地へ送る事で、このカードを墓地から特殊召喚する。

   Notes
   - Opponent hand choices: the U441 ChoiceRequest pattern (u441Open / u441DiscardPicks, S03-U441); here u442Open also allows min 0 (暗黒の謀略: the opponent may decline to discard).
   - TYPE－6: u422Act(false) activation + a forced onStandbyPhase of my own Standby Phase; the die is duelRandomInt(6) + 1 (replay RNG); 1 = my discard (my choice), 2 = the opponent's discard (their choice), 5 = I choose the monster.
   - グラディアル・チェンジ: onOtherSummon:true trap (passive onSpecialSummon on a Set card); the SS monsters of the event must be mine and named 「剣闘獣」.
   - 暗黒の謀略: at the resolution the opponent is first asked whether to discard 1 hand card to negate (min 0); otherwise I choose 2, then the opponent chooses 2, all discarded, both draw 2.
   - バッド・エンド・クイーン・ドラゴン: cannotNormalSummon + summonProcedure from the hand (3+ Continuous Spells of mine, face-up or Set); a forced onBattleDamage (v6SelfDealt, to the opponent): the opponent chooses a hand card for the Graveyard, I draw 1; the Standby Phase revival from the Graveyard (graveInfo.from 'mz') costs a face-up Continuous Spell of mine. */

function u442Open(player, title, min, max, handler, args){
  const cands = API.pileCards(player, 'hand'); cands.forEach(x=>ensureCardUid(gameState, x.card));
  if(!cands.length) return false;
  return API.requestChoice({kind:'card', title, candidates:cands, min, max, player, cancelable:false, resume:{handler, args}});
}
function u442Toss(n){ return (typeof duelRandomInt==='function' ? duelRandomInt(n) : 0); }

/* ---- デンジャラスマシン TYPE－6 ---- */
API.registerChoiceHandler('s03u442.dm-discard', (answer, args)=>{ u441DiscardPicks(answer, args.player, 'デンジャラスマシン TYPE－6'); });
API.registerChoiceHandler('s03u442.dm-destroy', (answer, args)=>{
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.destroy(h, 'デンジャラスマシン TYPE－6'); });
});
function u442Due(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('デンジャラスマシン TYPE－6', [u422Act(false), {
  key:'dice', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u442Due(ctx); },
  operation(ctx){
    const d = u442Toss(6) + 1; API.log('デンジャラスマシン TYPE－6：サイコロの目 '+d);
    if(d===1) u442Open(ctx.player, 'デンジャラスマシン TYPE－6：捨てる手札を1枚選ぶ', 1, 1, 's03u442.dm-discard', {player:ctx.player});
    else if(d===2) u442Open(ctx.opponent, 'デンジャラスマシン TYPE－6：捨てる手札を1枚選ぶ', 1, 1, 's03u442.dm-discard', {player:ctx.opponent});
    else if(d===3) API.draw(ctx.player, 1, 'デンジャラスマシン TYPE－6');
    else if(d===4) API.draw(ctx.opponent, 1, 'デンジャラスマシン TYPE－6');
    else if(d===5){
      const pool = API.fieldCards({player:ctx.opponent, zone:'mz'}); if(!pool.length) return;
      pool.forEach(x=>ensureCardUid(gameState, x.card));
      API.requestChoice({kind:'card', title:'デンジャラスマシン TYPE－6：破壊する相手のモンスター', candidates:pool, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u442.dm-destroy', args:{player:ctx.player}}});
    }else{ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.destroy(me, 'デンジャラスマシン TYPE－6'); }
  },
  afterResolve(){}
}], {type:'spell', priority:1, forced:false, passive:{ onStandbyPhase(ctx){ return u442Due(ctx); } } });

/* ---- グラディアル・チェンジ ---- */
function u442Gladiators(ctx){
  const ev = ctx.event || {}, cards = Array.isArray(ev.cards) ? ev.cards : (ev.card ? [ev.card] : []);
  return cards.filter(card=>{ const h = locateCard(card); return h && h.p===ctx.player && h.zone==='mz' && String(dbOf(card).n||'').indexOf('剣闘獣')>=0; });
}
API.registerChoiceHandler('s03u442.gc-discard', (answer, args)=>{ u441DiscardPicks(answer, args.player, 'グラディアル・チェンジ'); });
defineScript('グラディアル・チェンジ', {
  onOtherSummon:true, type:'trap', priority:2,
  condition(ctx){ if(!u442Gladiators(ctx).length){ ctx.reason = '自分フィールドに「剣闘獣」が特殊召喚された時に発動します'; return false; } return true; },
  resolve(ctx){ u442Open(ctx.opponent, 'グラディアル・チェンジ：捨てる手札を1枚選ぶ', 1, 1, 's03u442.gc-discard', {player:ctx.opponent}); },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && u442Gladiators(ctx).length>0; } }
});

/* ---- 暗黒の謀略 ---- */
API.registerChoiceHandler('s03u442.plot-veto', (answer, args)=>{
  const picks = u441Picks(answer);
  if(picks.length){ u441DiscardPicks(answer, args.foe, '暗黒の謀略（無効）'); API.log('暗黒の謀略：相手が手札を捨てて効果を無効にした'); return; }
  if(!u442Open(args.me, '暗黒の謀略：捨てる手札を2枚選ぶ', 2, 2, 's03u442.plot-me', args)) u442Open(args.foe, '暗黒の謀略：捨てる手札を2枚選ぶ', 2, 2, 's03u442.plot-foe', args);
});
API.registerChoiceHandler('s03u442.plot-me', (answer, args)=>{
  u441DiscardPicks(answer, args.me, '暗黒の謀略');
  if(!u442Open(args.foe, '暗黒の謀略：捨てる手札を2枚選ぶ', 2, 2, 's03u442.plot-foe', args)){ API.draw(args.me, 2, '暗黒の謀略'); API.draw(args.foe, 2, '暗黒の謀略'); }
});
API.registerChoiceHandler('s03u442.plot-foe', (answer, args)=>{
  u441DiscardPicks(answer, args.foe, '暗黒の謀略');
  API.draw(args.me, 2, '暗黒の謀略'); API.draw(args.foe, 2, '暗黒の謀略');
});
defineScript('暗黒の謀略', {
  type:'trap', priority:2,
  condition(ctx){
    if(API.pileCards(ctx.player, 'hand').length<2 || API.pileCards(ctx.opponent, 'hand').length<2){ ctx.reason = 'お互いの手札が2枚以上必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const args = {me:ctx.player, foe:ctx.opponent};
    if(!u442Open(ctx.opponent, '暗黒の謀略：手札を1枚捨てて効果を無効にしますか（捨てない場合は選ばない）', 0, 1, 's03u442.plot-veto', args)){
      if(!u442Open(ctx.player, '暗黒の謀略：捨てる手札を2枚選ぶ', 2, 2, 's03u442.plot-me', args)){ API.draw(ctx.player, 2, '暗黒の謀略'); API.draw(ctx.opponent, 2, '暗黒の謀略'); }
    }
  },
  afterResolve(){}
});

/* ---- バッド・エンド・クイーン・ドラゴン ---- */
function u442Conts(p){ return API.fieldCards({player:p, zone:'sz', filter:x=>x.db.k==='s' && x.db.sub==='永続'}); }
function u442ContsUp(p){ return u442Conts(p).filter(x=>x.card.face==='up'); }
API.registerChoiceHandler('s03u442.bq-discard', (answer, args)=>{ u441DiscardPicks(answer, args.foe, 'バッド・エンド・クイーン・ドラゴン'); API.draw(args.me, 1, 'バッド・エンド・クイーン・ドラゴン'); });
function u442Bq(ctx){ return typeof v6SelfDealt==='function' && v6SelfDealt(ctx) && !!ctx.event && ctx.event.player===ctx.opponent && ctx.zone==='mz' && ctx.card.face==='up'; }
function u442BqRevive(ctx){
  const g = ctx.card.graveInfo;
  return ctx.zone==='grave' && ctx.player===gameState.activePlayer && gameState.phase==='standby' && !!g && g.from==='mz' && u442ContsUp(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player);
}
defineUnifiedCardV4('バッド・エンド・クイーン・ドラゴン', [{
  key:'discard-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return u442Bq(ctx); },
  operation(ctx){
    const args = {me:ctx.player, foe:ctx.opponent};
    if(!u442Open(ctx.opponent, 'バッド・エンド・クイーン・ドラゴン：墓地へ送る手札を1枚選ぶ', 1, 1, 's03u442.bq-discard', args)) API.draw(ctx.player, 1, 'バッド・エンド・クイーン・ドラゴン');
  },
  afterResolve(){}
},{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onStandbyPhase'],
  condition(ctx){ return u442BqRevive(ctx); },
  cost(ctx, done){
    const pool = u442ContsUp(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('バッド・エンド・クイーン・ドラゴン：墓地へ送る永続魔法カード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='sz'){ done(false); return; }
      API.sendToGrave(r, 'バッド・エンド・クイーン・ドラゴン（コスト）'); done(true);
    });
  },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'バッド・エンド・クイーン・ドラゴン'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], cannotNormalSummon:true, includesSpecialSummon:true, activateFrom:['mz','grave'],
  passive:{ onBattleDamage(ctx){ return u442Bq(ctx); }, onStandbyPhase(ctx){ return u442BqRevive(ctx); } },
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u442Conts(ctx.player).filter(x=>x.card.face==='up').length<3){ ctx.reason = '自分フィールド上の永続魔法カードが3枚以上必要です'; return false; } return true; },
    cost(ctx, done){ done(true); } } });
