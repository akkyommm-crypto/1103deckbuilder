/* S03-U359: four position-dependent 「D」 monsters (carddata texts; the pattern of D・ラジオン — an effect set chosen by the card's own position).

   D・スコープン   ●攻撃表示:1ターンに1度、手札から「D」レベル4モンスター1体を特殊召喚できる（エンドフェイズ時に破壊）。●守備表示:表側表示で存在する限り、このカードのレベルは4になる。
   D・マグネンU    ●攻撃表示:相手フィールドに表側表示のモンスターが存在する場合、このカードは攻撃力が一番高いモンスターしか攻撃対象に選択できない。●守備表示:表側表示で存在する限り、相手は他のモンスターを攻撃対象に選択できない。
   D・マグネンI    ●攻撃表示:自分の他のモンスターが表側攻撃表示で2体存在する場合、1ターンに1度、そのターンのエンドフェイズ時まで攻撃力をそのモンスターの攻撃力の合計分アップできる。この効果を発動するターン他のモンスターは攻撃できない。●守備表示:表側表示で存在する限り、自分のモンスターは攻撃できない。
   D・キャメラン   ●攻撃表示:戦闘によって破壊された時、手札・墓地から「D・キャメラン」以外のレベル4以下の「D」1体を選んで特殊召喚できる。●守備表示:表側表示で存在する限り、お互いに「D」モンスターをカードの効果の対象にできない。

   Notes
   - 「D」 = SETCODE.MORPHTRONIC (isSetCardV4). The position is read from the card (card.pos) in each continuous hook / condition.
   - D・マグネンU (attack part): continuous.cannotBeAttackedByS03(target, attacker, self) with cannotBeAttackTargetBothS03 (the restriction is on the owner's own attacks).
   - D・マグネンI: the ATK sum is a stat modifier until the End Phase; "other monsters cannot attack this turn" = a turn-stamped card flag read by a continuous cannotAttack.
   - D・スコープン: the summoned D is destroyed in the End Phase (v340ScheduleEndDestroy). */

function u359D(db){ return !!db && isSetCardV4(db, SETCODE.MORPHTRONIC); }
function u359Mine(self){ const h = findCardByUid(self.uid); return h && h.zone==='mz' ? h : null; }

/* ---- D・スコープン ---- */
defineUnifiedCardV4('D・スコープン', [{
  key:'call', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.card.pos!=='atk'){ ctx.reason = '表側攻撃表示の時に発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && u359D(x.db) && Number(x.db.lv)===4).length){ ctx.reason = '手札に「D」のレベル4モンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && u359D(x.db) && Number(x.db.lv)===4); if(!pool.length) return;
    API.selectCard('D・スコープン：特殊召喚する「D」レベル4モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'D・スコープン');
      const now = findCardByUid(uid); if(now && now.zone==='mz') v340ScheduleEndDestroy(now.card, ctx.player, 'D・スコープン（エンドフェイズに破壊）');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, timing:['mainPhase'], includesSpecialSummon:true,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, setLevel(card, self){ return (card===self && self.face==='up' && self.pos==='def') ? 4 : null; } } });

/* ---- D・マグネンU ---- */
defineUnifiedCardV4('D・マグネンU', [], {type:'monster', priority:1,
  continuous:{ scope:'allMonsters', from:['mz'], cannotBeAttackTargetBothS03:true,
    apply(){ return null; },
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || self.pos!=='def' || !target || target===self) return false;
      const sh = u359Mine(self), th = findCardByUid(target.uid);
      return !!sh && !!th && th.zone==='mz' && th.p===sh.p;
    },
    cannotBeAttackedByS03(target, attacker, self){
      if(!self || attacker!==self || self.face!=='up' || self.pos!=='atk' || !target) return false;
      const sh = u359Mine(self), th = findCardByUid(target.uid); if(!sh || !th || th.zone!=='mz' || th.p===sh.p) return false;
      const foes = API.fieldCards({player:th.p, zone:'mz', filter:x=>x.card.face==='up'}); if(!foes.length) return false;
      const top = foes.reduce((m,x)=>Math.max(m, curATK(x.card)), -1);
      return !(target.face==='up' && curATK(target)===top);
    } } });

/* ---- D・マグネンI ---- */
function u359IOthers(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.card.pos==='atk'}); }
defineUnifiedCardV4('D・マグネンI', [{
  key:'absorb', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.card.pos!=='atk'){ ctx.reason = '表側攻撃表示の時に発動できます'; return false; }
    if(u359IOthers(ctx).length!==2){ ctx.reason = '自分の他のモンスターが表側攻撃表示でちょうど2体必要です'; return false; }
    return true;
  },
  operation(ctx){
    const others = u359IOthers(ctx), me = locateCardAnyV4(ctx.card); if(others.length!==2 || !me || me.zone!=='mz') return;
    const sum = others.reduce((s,x)=>s+curATK(x.card), 0);
    v4RegisterStatModifier(me, {atk:sum}, {code:'D・マグネンI', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    API.setCardFlag(me, 'u359NoOthersTurn', gameState.turn, 'D・マグネンI', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(card, self){
      if(!card || !self || self.face!=='up') return false;
      const sh = u359Mine(self), ch = findCardByUid(card.uid); if(!sh || !ch || ch.p!==sh.p) return false;
      if(self.pos==='def') return true;
      return card!==self && Number(self.u359NoOthersTurn)===Number(gameState.turn);
    } } });

/* ---- D・キャメラン ---- */
function u359CamSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && g.pos==='atk' && g.face==='up' && Number(g.turn)===Number(gameState.turn);
}
function u359CamPool(ctx){
  return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.n!=='D・キャメラン' && u359D(x.db) && Number(x.db.lv)<=4)
    .concat(API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.card!==ctx.card && x.db.n!=='D・キャメラン' && u359D(x.db) && Number(x.db.lv)<=4));
}
defineUnifiedCardV4('D・キャメラン', [{
  key:'recruit', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u359CamSent(ctx) && hasMonsterZoneSpace(ctx.player) && u359CamPool(ctx).length>0; },
  operation(ctx){
    const pool = u359CamPool(ctx); if(!pool.length) return;
    API.selectCard('D・キャメラン：特殊召喚する「D」', pool, t=>{
      const r = t && resolveTarget(t); if(!r || (r.zone!=='hand' && r.zone!=='grave') || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, r.zone, r.index, 'atk', 'D・キャメラン');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return u359CamSent(ctx) && hasMonsterZoneSpace(ctx.player) && u359CamPool(ctx).length>0; }, onDestroy(ctx){ return u359CamSent(ctx) && hasMonsterZoneSpace(ctx.player) && u359CamPool(ctx).length>0; } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    immuneToTarget(target, self){ return !!self && self.face==='up' && self.pos==='def' && !!target && u359D(dbOf(target)); } } });
