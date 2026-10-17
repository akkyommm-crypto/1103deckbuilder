/* S03-U367: three Continuous Traps and a Field Spell (carddata texts).

   忍法 空蝉の術     （永続罠）自分の「忍者」モンスター1体を選択して発動する。このカードがフィールドに存在する限り、選択したモンスターは戦闘では破壊されない（ダメージ計算は適用する）。
   コア・ブラスト    （永続罠）自分のスタンバイフェイズに1度だけ、相手のモンスターの数が自分より多い場合、自分のモンスターの数と同じ数になるように相手のカードを破壊できる。自分フィールドに「コアキメイル」モンスターが表側表示で存在する場合のみ発動できる。
   スターゲート      （永続罠）相手モンスターが戦闘を行った場合、そのダメージステップ終了時にゲートカウンターを1つ置く。自分のメインフェイズにこのカードを墓地へ送る事で、カウンターの数以下のレベルのモンスター1体を手札から特殊召喚する。
   クローザー・フォレスト （フィールド魔法）自分の墓地のモンスター1体につき、自分の獣族モンスターの攻撃力は100アップする。このカードがフィールドに存在する限り、フィールド魔法カードを発動できない。このカードが破壊されたターン、フィールド魔法カードを発動できない。

   Notes
   - 空蝉の術: the selected monster carries the trap's uid in a card flag; continuous.battleProof (as 剣闘獣の闘器マニカ) reads it; the trap ending ends the protection.
   - コア・ブラスト: 「相手のカードを破壊」 is read as the opponent's MONSTERS (the count to equalise is the monster count); the controller chooses which are destroyed. Once per Standby Phase (a card flag with the turn).
   - スターゲート: forced Damage Step 'end' trigger puts a ゲート counter on the trap (API.addCounter) when a battle involving an opposing monster ended.
   - クローザー・フォレスト: activationLockS03 (engine/1ZD) for Field Spells while it is face-up, and again for the rest of the turn it was destroyed (API.lingerS03 from its destroyed trigger). */

/* ---- 忍法 空蝉の術 ---- */
function u367Ninja(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && String(x.db.n||'').indexOf('忍者')>=0}); }
defineUnifiedCardV4('忍法 空蝉の術', [{
  key:'guard', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){ if(!u367Ninja(ctx).length){ ctx.reason = '自分フィールドに「忍者」モンスターがいません'; return false; } return true; },
  target(ctx, done){ API.selectCard('忍法 空蝉の術：戦闘で破壊されなくなる「忍者」', u367Ninja(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.player && r.card.face==='up') API.setCardFlag(r, 'u367Guard', ensureCardUid(gameState, ctx.card), '忍法 空蝉の術', {silent:true});
  },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true,
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; }, battleProof(card, self){ return !!card && !!self && self.face==='up' && card.u367Guard!=null && card.u367Guard===self.uid && card.face==='up'; } } });

/* ---- コア・ブラスト ---- */
function u367BlastSide(ctx){
  const mine = API.fieldCards({player:ctx.player, zone:'mz'}).length, foes = API.fieldCards({player:ctx.opponent, zone:'mz'}).length;
  return {mine, foes};
}
function u367BlastNow(ctx){
  if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || gameState.phase!=='standby') return false;
  if(Number(ctx.card.u367BlastTurn)===Number(gameState.turn)) return false;
  if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && String(x.db.n||'').indexOf('コアキメイル')===0}).length) return false;
  const s = u367BlastSide(ctx); return s.foes>s.mine;
}
defineUnifiedCardV4('コア・ブラスト', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'], operation(){}, afterResolve(){}
}, {
  key:'blast', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'],
  condition(ctx){ return u367BlastNow(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u367BlastTurn', gameState.turn, 'コア・ブラスト', {silent:true});
    const s = u367BlastSide(ctx); let n = s.foes - s.mine;
    const step = ()=>{
      const pool = API.fieldCards({player:ctx.opponent, zone:'mz'});
      if(n<=0 || !pool.length) return;
      API.selectCard('コア・ブラスト：破壊する相手モンスター（残り'+n+'）', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent) API.destroy(r, 'コア・ブラスト'); n--; step(); });
    };
    step();
  },
  afterResolve(){}
}], {type:'trap', priority:2, passive:{ onStandbyPhase(ctx){ return u367BlastNow(ctx); } } });

/* ---- スターゲート ---- */
function u367GateBattle(ctx){
  const b = ctx.battle || gameState.battle;
  if(ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.step!=='end' || !b || b.battled!==true) return false;
  const isFoe = c=>{ if(!c) return false; const h = findCardByUid(c.uid); return !!h && h.p===ctx.opponent; };
  return isFoe(b.atkCard) || isFoe(b.defCard);
}
function u367GateMine(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
defineUnifiedCardV4('スターゲート', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); },   /* a face-up Continuous Trap is not activated again (the ignition below is its effect) */
  operation(){}, afterResolve(){}
}, {
  key:'count', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u367GateBattle(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.addCounter(me, 'ゲート', 1); },
  afterResolve(){}
}, {
  key:'summon', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, targetRange:LOCATION.HAND, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(!u367GateMine(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    const n = API.countCounter(locateCardAnyV4(ctx.card), 'ゲート');
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && Number(x.db.lv)<=n && n>0).length){ ctx.reason = 'ゲートカウンター以下のレベルのモンスターが手札にいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz'){ done(false); return; }
    API.setFlag(ctx.player, 'u367GateN', API.countCounter(me, 'ゲート'), true);
    const me2 = locateCardAnyV4(ctx.card); API.sendToGrave(me2, 'スターゲート（コスト）'); done(true);
  },
  operation(ctx){
    const n = Number(API.getFlag(ctx.player, 'u367GateN'))||0;
    const pool = API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && Number(x.db.lv)<=n); if(!pool.length) return;
    API.selectCard('スターゲート：特殊召喚する手札のモンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='hand' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'スターゲート'); });
  },
  afterResolve(){}
}], {type:'trap', priority:2, includesSpecialSummon:true, fieldIgnition:true, dsTiming:'end', activateFrom:['sz','grave'],
  passive:{ onDamageStep(ctx){ return u367GateBattle(ctx); } } });

/* ---- クローザー・フォレスト ---- */
function u367FieldSpell(i){ return !!i.db && i.db.k==='s' && i.db.sub==='フィールド'; }
defineUnifiedCardV4('クローザー・フォレスト', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.FIELD, speed:1, events:['activate'], operation(){}, afterResolve(){}
}, {
  key:'destroyed-lock', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDestroy','onSendToGrave'], forced:true,
  condition(ctx){ const e = ctx.event || {}, g = ctx.card.graveInfo; return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='field' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me) API.lingerS03(ctx.player, me, 'クローザー・フォレスト'); },
  afterResolve(){}
}], {type:'spell', priority:1, forced:true, activateFrom:['field','grave'],
  passive:{ onDestroy(ctx){ const e = ctx.event || {}, g = ctx.card.graveInfo; return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='field' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn); } },
  activationLockS03:(i)=> u367FieldSpell(i),
  continuous:{ scope:'allMonsters', from:['field'],
    apply(card, self){
      if(!self || self.face!=='up' || !card || card.face!=='up' || dbOf(card).ra!=='獣') return null;
      const sh = findCardByUid(self.uid), ch = findCardByUid(card.uid); if(!sh || !ch || ch.zone!=='mz' || ch.p!==sh.p) return null;
      const n = API.pileCards(sh.p, 'grave', x=>x.db.k==='m').length;
      return n>0 ? {atk:100*n} : null;
    } } });
