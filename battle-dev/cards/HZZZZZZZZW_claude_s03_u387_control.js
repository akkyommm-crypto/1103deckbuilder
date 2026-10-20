/* S03-U387: three NOT_STARTED Traps (carddata texts).

   洗脳光線    （永続罠）相手フィールド上のAカウンターが乗ったモンスター1体を選択してコントロールを得る。自分のエンドフェイズ毎に、選択したモンスターのAカウンターを1つ取り除く。そのモンスターのAカウンターが全て取り除かれるかそのモンスターが破壊された場合、このカードを破壊する。
   集団催眠    （永続罠）自分フィールド上に「エーリアン」と名のついたモンスターが存在する時に発動する事ができる。相手フィールド上に存在するAカウンターが乗ったモンスターを3体まで選択しコントロールを得る。このカードは発動ターンのエンドフェイズ時に破壊される。
   破邪の刻印  （永続罠）相手のスタンバイフェイズ時に1度だけ、フィールド上に表側表示で存在するカード1枚を選択する。選択されたカードの効果はそのターン中無効になる。このカードのコントローラーは自分のスタンバイフェイズ毎に500ライフポイントを払う。または、500ライフポイント払わずにこのカードを破壊する。

   Notes
   - コントロール: API.changeControl + API.linkControlReturn (the monster goes back when the Trap leaves the field); 洗脳光線 also API.linkOnLeave(trap → monster, 'destroy'): the Trap is destroyed when the monster leaves.
   - Aカウンター: alienCountersS03 (S03-U316). 洗脳光線: the End Phase trigger of the Trap removes 1 A Counter from the controlled monster (its uid kept in a card flag) and destroys the Trap at 0; 集団催眠: the End Phase trigger destroys it in the turn it was activated (flag turn stamp).
   - 破邪の刻印: an optional trigger of the opponent's Standby Phase (API.negateEffectUntil … 'endTurn'); the upkeep is a forced trigger of my Standby Phase with a yes / no (pay 500 or destroy the Trap; destroyed when the LP are short). */

function u387Alien(card){ return alienCountersS03(card)>0; }
function u387Foes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>u387Alien(x.card)}); }
function u387Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }

/* ---- 洗脳光線 ---- */
defineUnifiedCardV4('洗脳光線', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:2, events:['activate'],
  condition(ctx){
    if(u387Ready(ctx)) return false;
    if(!u387Foes(ctx).length){ ctx.reason = '相手フィールドにAカウンターが乗ったモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('洗脳光線：コントロールを得るAカウンターが乗った相手モンスター', u387Foes(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent || !me || me.zone!=='sz' || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    API.changeControl(r, ctx.player, '洗脳光線');
    const now = findCardByUid(uid); if(!now || now.zone!=='mz' || now.p!==ctx.player) return;
    API.linkControlReturn(now, me, {onFaceDown:false, label:'洗脳光線'});
    API.linkOnLeave(locateCardAnyV4(ctx.card), findCardByUid(uid), 'destroy', '洗脳光線');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u387Beamed', uid, '洗脳光線', {silent:true});
  },
  afterResolve(){}
}, {
  key:'tick', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u387Ready(ctx) && ctx.player===gameState.activePlayer && ctx.card.u387Beamed!=null; },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    const m = findCardByUid(me.card.u387Beamed);
    if(!m || m.zone!=='mz'){ API.destroy(me, '洗脳光線'); return; }
    if(alienCountersS03(m.card)>0) API.removeCounter(m, 'A', 1);
    const m2 = findCardByUid(me.card.u387Beamed);
    if(!m2 || m2.zone!=='mz' || alienCountersS03(m2.card)<=0){ const me2 = locateCardAnyV4(ctx.card); if(me2 && me2.zone==='sz') API.destroy(me2, '洗脳光線'); }
  },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, forced:true, passive:{ onEndPhase(ctx){ return u387Ready(ctx) && ctx.player===gameState.activePlayer && ctx.card.u387Beamed!=null; } } });

/* ---- 集団催眠 ---- */
defineUnifiedCardV4('集団催眠', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:2, events:['activate'],
  condition(ctx){
    if(u387Ready(ctx)) return false;
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && String(x.db.n||'').indexOf('エーリアン')>=0}).length){ ctx.reason = '自分フィールドに「エーリアン」モンスターがいません'; return false; }
    if(!u387Foes(ctx).length){ ctx.reason = '相手フィールドにAカウンターが乗ったモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  target(ctx, done){
    const room = Math.max(1, Math.min(3, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length));
    v46PickAnyAtLeastOne('集団催眠：コントロールを得るAカウンターが乗った相手モンスター', u387Foes(ctx), room, picked=>done(picked));
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    API.setCardFlag(me, 'u387Hypno', gameState.turn, '集団催眠', {silent:true});
    (ctx.selectedTargets||[]).forEach(t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.opponent || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      API.changeControl(r, ctx.player, '集団催眠');
      const now = findCardByUid(uid), trap = locateCardAnyV4(ctx.card);
      if(now && now.zone==='mz' && now.p===ctx.player && trap && trap.zone==='sz') API.linkControlReturn(now, trap, {onFaceDown:false, label:'集団催眠'});
    });
  },
  afterResolve(){}
}, {
  key:'end', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u387Ready(ctx) && Number(ctx.card.u387Hypno)===Number(gameState.turn); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.destroy(me, '集団催眠'); },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, forced:true, passive:{ onEndPhase(ctx){ return u387Ready(ctx) && Number(ctx.card.u387Hypno)===Number(gameState.turn); } } });

/* ---- 破邪の刻印 ---- */
function u387SealTurn(ctx){ return u387Ready(ctx) && ctx.player!==gameState.activePlayer && gameState.phase==='standby' && Number(ctx.card.u387Used)!==Number(gameState.turn) && API.fieldCards({}).filter(x=>x.card.face==='up' && x.card!==ctx.card).length>0; }
function u387SealUpkeep(ctx){ return u387Ready(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('破邪の刻印', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !u387Ready(ctx); }, operation(){}, afterResolve(){}
}, {
  key:'seal', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'],
  condition(ctx){ return u387SealTurn(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u387Used', gameState.turn, '破邪の刻印', {silent:true});
    const pool = API.fieldCards({}).filter(x=>x.card.face==='up' && x.card!==ctx.card); if(!pool.length) return;
    API.selectCard('破邪の刻印：効果を無効にする表側表示のカード', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.card.face==='up') API.negateEffectUntil(r, 'endTurn', '破邪の刻印', ctx.card);
    });
  },
  afterResolve(){}
}, {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u387SealUpkeep(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    if(API.me(ctx).lp<500){ API.destroy(me, '破邪の刻印'); return; }
    API.confirm('破邪の刻印', '500ライフポイントを払いますか？（払わない場合、このカードを破壊します）', ()=>API.payCost(ctx.player, 500), ()=>{ const m2 = locateCardAnyV4(ctx.card); if(m2 && m2.zone==='sz') API.destroy(m2, '破邪の刻印'); });
  },
  afterResolve(){}
}], {type:'trap', priority:2, passive:{ onStandbyPhase(ctx){ return u387SealTurn(ctx) || u387SealUpkeep(ctx); } } });
