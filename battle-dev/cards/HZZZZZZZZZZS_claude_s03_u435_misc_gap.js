/* S03-U435: ニュート, 創世竜, 同族感電ウィルス, ゼロ・ガードナー, レッサー・デーモン (stale ENGINE_GAP cards, carddata texts).

   ニュート              ①：このカードがリバースした場合に発動する。このカードの攻撃力・守備力は500アップする。②：このカードがモンスターとの戦闘で破壊された場合に発動する。そのモンスターの攻撃力・守備力を500ダウンする。
   創世竜                1ターンに1度、手札からドラゴン族モンスター1体を墓地へ送る事で、自分の墓地のドラゴン族モンスター1体を選択して手札に加える。このカードがフィールド上から墓地へ送られた時、自分の墓地のドラゴン族モンスターを全てデッキに戻す事ができる。
   同族感電ウィルス      1ターンに1度、手札のモンスター1体をゲームから除外して発動する事ができる。この効果を発動するためにゲームから除外したモンスターと同じ種族の、フィールド上に表側表示で存在するモンスターを全て破壊する。
   ゼロ・ガードナー      このカードをリリースして発動する。このターン自分のモンスターは戦闘では破壊されず、相手モンスターとの戦闘によって発生する自分への戦闘ダメージは0になる。この効果は相手ターンでも発動する事ができる。
   レッサー・デーモン    このカードがフィールド上に表側表示で存在する限り、このカードが戦闘によって破壊したモンスターは墓地へは行かずゲームから除外される。

   Notes
   - ニュート: forced onFlip (+500 / +500 permanent, API.addBaseStats) and a forced Graveyard trigger on a battle destruction by a monster (graveInfo.battle; the slayer is read from gameState.lastBattle, it must still be on the field) that lowers the slayer's ATK / DEF by 500 (permanent).
   - 創世竜: ignition once per turn (cost = a hand Dragon to the Graveyard, then any Dragon of the Graveyard - the discarded one included - to the hand) + an optional Graveyard trigger on a field-to-Graveyard move returning every Dragon of the Graveyard to the Deck (FX_RETURN_DECK) and shuffling.
   - ウィルス: ignition once per turn; the cost banishes a hand monster and stores its race in a card flag; every face-up monster of that race on either field is destroyed.
   - ゼロ・ガードナー: Quick Effect (free) from the Monster Zone, cost = the card itself to the Graveyard (Release); like 和睦の使者: noBattleDestroyS03 flag + an LP rule preventing battle damage this turn (the text limits the damage to battles with opponent monsters - every battle damage of mine this turn is 0, which is the same for the duel).
   - レッサー・デーモン: script battleVictimBanishS03 (engine/00, U255): the victim of its battle destruction is banished instead of going to the Graveyard. */

function u435Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }

/* ---- ニュート ---- */
function u435NewtSlayer(ctx){
  const g = ctx.card.graveInfo, e = ctx.event || {};
  if(ctx.zone!=='grave' || e.uid==null || e.uid!==ctx.card.uid || !g || g.from!=='mz' || !g.battle || Number(g.turn)!==Number(gameState.turn)) return null;
  const b = gameState.lastBattle; if(!b) return null;
  const uid = b.defenderUidV6===ctx.card.uid ? b.attackerUidV6 : (b.attackerUidV6===ctx.card.uid ? b.defenderUidV6 : null);
  if(uid==null) return null;
  const h = findCardByUid(uid); return (h && h.zone==='mz') ? h : null;
}
function u435Flipped(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card); }
defineUnifiedCardV4('ニュート', [{
  key:'flip-up', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ return u435Flipped(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.addBaseStats(h, 500, 500, 'permanent', 'ニュート'); },
  afterResolve(){}
},{
  key:'slayer-down', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return !!u435NewtSlayer(ctx); },
  operation(ctx){ const h = u435NewtSlayer(ctx); if(h) API.addBaseStats(h, -500, -500, 'permanent', 'ニュート'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, activateFrom:['mz','grave'],
  passive:{ onFlip(ctx){ return u435Flipped(ctx); }, onSendToGrave(ctx){ return !!u435NewtSlayer(ctx); } } });

/* ---- 創世竜 ---- */
function u435HandDragons(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.db.ra==='ドラゴン'); }
function u435GraveDragons(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='ドラゴン'); }
function u435Genesis(ctx){
  const g = ctx.card.graveInfo, e = ctx.event || {};
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('創世竜', [{
  key:'recycle', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1,
  condition(ctx){ if(!u435Up(ctx)){ return false; } if(!u435HandDragons(ctx.player).length){ ctx.reason = '手札にドラゴン族モンスターがいません'; return false; } return true; },
  cost(ctx, done){
    const pool = u435HandDragons(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('創世竜：墓地へ送るドラゴン族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, '創世竜（コスト）'); done(true);
    });
  },
  operation(ctx){
    const pool = u435GraveDragons(ctx.player); if(!pool.length) return;
    API.selectCard('創世竜：手札に加える墓地のドラゴン族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, '創世竜');
    });
  },
  afterResolve(){}
},{
  key:'shuffle-back', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ return u435Genesis(ctx) && u435GraveDragons(ctx.player).length>0; },
  operation(ctx){
    u435GraveDragons(ctx.player).map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{
      const r = findCardByUid(u); if(r && r.zone==='grave') act({type:'FX_RETURN_DECK', player:r.p, zone:'grave', index:r.index, toBottom:false, reason:'創世竜'});
    });
    API.shuffle(ctx.player);
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], countLimit:{n:1, effects:['recycle']}, activateFrom:['mz','grave'],
  passive:{ onSendToGrave(ctx){ return u435Genesis(ctx) && u435GraveDragons(ctx.player).length>0; } } });

/* ---- 同族感電ウィルス ---- */
defineUnifiedCardV4('同族感電ウィルス', [{
  key:'virus', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1,
  condition(ctx){ if(!u435Up(ctx)) return false; if(!API.pileCards(ctx.player, 'hand', x=>x.db.k==='m').length){ ctx.reason = '手札にモンスターがいません'; return false; } return true; },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand', x=>x.db.k==='m'); if(!pool.length){ done(false); return; }
    API.selectCard('同族感電ウィルス：ゲームから除外する手札のモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player){ done(false); return; }
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; }
      API.setCardFlag(me, 'u435Race', dbOf(r.card).ra, '同族感電ウィルス', {silent:true});
      API.banish(r, '同族感電ウィルス（コスト）'); done(true);
    });
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); const race = me && me.card ? me.card.u435Race : null; if(!race) return;
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra===race}).map(x=>x.card.uid!=null?x.card.uid:ensureCardUid(gameState,x.card)).forEach(u=>{
      const h = findCardByUid(u); if(h && h.zone==='mz') API.destroy(h, '同族感電ウィルス');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], countLimit:{n:1, effects:['virus']}, activateFrom:['mz']});

/* ---- ゼロ・ガードナー ---- */
defineScript('ゼロ・ガードナー', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'], timing:['free','chain'],
  condition(ctx){ if(!u435Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; } return true; },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'ゼロ・ガードナー（リリース）'); done(true); },
  resolve(ctx){
    API.setFlag(ctx.player, 'noBattleDestroyS03', gameState.turn, true);
    addLpRuleV18({player:ctx.player, cause:'battle', mode:'prevent', turns:0, label:'ゼロ・ガードナー'});
    API.log('ゼロ・ガードナー：このターン、自分のモンスターは戦闘では破壊されず、戦闘ダメージは0になる');
  },
  afterResolve(){} });

/* ---- レッサー・デーモン ---- */
defineScript('レッサー・デーモン', {
  type:'monster', priority:1, timing:['free'],
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  battleVictimBanishS03(){ return true; } });
