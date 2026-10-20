/* S03-U356: five monsters with counters, delayed returns and self-destruction (carddata texts).

   魔鏡導士リフレクト・バウンダー  表側攻撃表示のこのカードが相手モンスターに攻撃された場合、ダメージ計算前に攻撃モンスターの攻撃力分のダメージを相手に与え、ダメージ計算後にこのカードを破壊する。
   魔導アーマー エグゼ            召喚・反転召喚・特殊召喚したターンには攻撃できない。お互いのスタンバイフェイズ毎に、自分フィールドの魔力カウンターを1個取り除く。取り除かない場合はこのカードを破壊する。
   海底に潜む深海竜              お互いのスタンバイフェイズ毎にオーシャンカウンターを1つ置く。フィールドから離れた時、カウンター1つにつき自分フィールドの魚族・海竜族モンスターの攻撃力はエンドフェイズ時まで200アップ。
   静寂のサイコウィッチ          フィールドで破壊され墓地へ送られた時、デッキから攻撃力2000以下のサイキック族1体をゲームから除外できる。次のスタンバイフェイズ時、そのモンスターを特殊召喚する。
   邪悪な儀式（魔法）            スタンバイフェイズにのみ発動できる。フィールドの全てのモンスターの表示形式を入れ替える。発動ターン、モンスターの表示形式は変更できない。

   Notes
   - リフレクト・バウンダー: a forced trigger on onAttackDeclare aimed at it (the damage is the attacker's current ATK) + a forced Damage Step 'end' trigger that destroys it.
   - エグゼ: continuous cannotAttack on itself for the turn it was summoned (card.summonedTurn); a forced trigger on every Standby Phase removes one 魔力 counter of its controller (API.removeCounter) or destroys it.
   - 深海竜: the count is parked in a persistent player flag keyed by the card's uid (the card's own counters are cleared when it leaves, as サイコ・チューン in S03-U348); the leave trigger is on onLeaveField.
   - サイコウィッチ: the same destroyed-to-the-Graveyard test as デッド・ガードナー (graveInfo.byDestroy); the return is a schedule (engine/16 'standbyPhase') for the next Standby Phase of either player. */

/* ---- 魔鏡導士リフレクト・バウンダー ---- */
function u356BounderHit(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && ctx.card.face==='up' && ctx.card.pos==='atk' && !!a && a.player===ctx.opponent && a.targetUid!=null && a.targetUid===ctx.card.uid;
}
function u356BounderEnd(ctx){
  const b = gameState.battle;
  return ctx.zone==='mz' && ctx.card.face==='up' && ctx.card.pos==='atk' && ctx.step==='end' && !!b && b.target!=='direct' && b.targetUid===ctx.card.uid && b.battled===true;
}
defineUnifiedCardV4('魔鏡導士リフレクト・バウンダー', [{
  key:'reflect', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return u356BounderHit(ctx); },
  operation(ctx){
    const a = gameState.pendingAttack, at = a && a.attackerUid!=null ? findCardByUid(a.attackerUid) : null;
    const n = at && at.zone==='mz' ? curATK(at.card) : 0;
    if(n>0) API.damageLP(ctx.opponent, n, '魔鏡導士リフレクト・バウンダー');
  },
  afterResolve(){}
}, {
  key:'self-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u356BounderEnd(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.destroy(me, '魔鏡導士リフレクト・バウンダー'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, dsTiming:'end',
  passive:{ onAttackDeclare(ctx){ return u356BounderHit(ctx); }, onDamageStep(ctx){ return u356BounderEnd(ctx); } } });

/* ---- 魔導アーマー エグゼ ---- */
function u356ExeStandby(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby'; }
function u356Counters(p){ return API.fieldCards({player:p, zone:'mz'}).concat(API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})).filter(x=>API.countCounter(x, '魔力')>0); }
defineUnifiedCardV4('魔導アーマー エグゼ', [{
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u356ExeStandby(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const pool = u356Counters(ctx.player);
    if(!pool.length){ API.destroy(me, '魔導アーマー エグゼ'); return; }
    const take = r=>{ if(r) API.removeCounter(r, '魔力', 1); };
    if(pool.length===1) take(pool[0]);
    else API.selectCard('魔導アーマー エグゼ：魔力カウンターを取り除くカード', pool, t=>take(t && resolveTarget(t)));
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onStandbyPhase(ctx){ return u356ExeStandby(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, cannotAttack(card, self){ return card===self && Number(card.summonedTurn)===Number(gameState.turn); } } });

/* ---- 海底に潜む深海竜 ---- */
function u356OceanFlag(p){ const v = API.getFlag(p, 'u356Ocean'); return Array.isArray(v) ? v : []; }
function u356OceanGet(p, uid){ const e = u356OceanFlag(p).find(x=>x && x.uid===uid); return e ? Number(e.n)||0 : 0; }
function u356OceanSet(p, uid, n){ const arr = u356OceanFlag(p).filter(x=>x && x.uid!==uid); if(n>0) arr.push({uid, n}); API.setFlag(p, 'u356Ocean', arr, false); }
function u356OceanLeft(ctx){
  const e = ctx.event || {};
  return e.uid!=null && e.uid===ctx.card.uid && u356OceanGet(ctx.player, ctx.card.uid)>0;
}
defineUnifiedCardV4('海底に潜む深海竜', [{
  key:'ocean', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby'; },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    API.addCounter(me, 'オーシャン', 1);
    const uid = ensureCardUid(gameState, ctx.card); u356OceanSet(ctx.player, uid, u356OceanGet(ctx.player, uid)+1);
  },
  afterResolve(){}
}, {
  key:'left', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onLeaveField','onSendToGrave','onDestroy','onRemove'], forced:true,
  condition(ctx){ return u356OceanLeft(ctx); },
  operation(ctx){
    const uid = ctx.card.uid, n = u356OceanGet(ctx.player, uid); u356OceanSet(ctx.player, uid, 0);
    if(n<=0) return;
    API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && (x.db.ra==='魚' || x.db.ra==='海竜')}).forEach(x=>{
      v4RegisterStatModifier(x, {atk:200*n}, {code:'海底に潜む深海竜', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['mz','grave'],
  passive:{ onStandbyPhase(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby'; },
    onLeaveField(ctx){ return u356OceanLeft(ctx); }, onSendToGrave(ctx){ return u356OceanLeft(ctx); }, onDestroy(ctx){ return u356OceanLeft(ctx); }, onRemove(ctx){ return u356OceanLeft(ctx); } } });

/* ---- 静寂のサイコウィッチ ---- */
API.registerScheduleHandler('u356.witch-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='banish' || h.p!==args.player || !hasMonsterZoneSpace(args.player)) return;
  API.specialSummon(args.player, 'banish', h.index, 'atk', '静寂のサイコウィッチ');
});
function u356WitchSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn);
}
function u356WitchPool(ctx){ return API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && x.db.ra==='サイキック' && Number(x.db.atk)<=2000); }
defineUnifiedCardV4('静寂のサイコウィッチ', [{
  key:'banish', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u356WitchSent(ctx) && u356WitchPool(ctx).length>0; },
  operation(ctx){
    const pool = u356WitchPool(ctx); if(!pool.length) return;
    API.selectCard('静寂のサイコウィッチ：除外するサイキック族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='deck') return;
      const uid = ensureCardUid(gameState, r.card);
      API.banish(r, '静寂のサイコウィッチ');
      const b = findCardByUid(uid);
      if(b && b.zone==='banish') API.schedule({at:'standbyPhase', turns:1, player:(gameState.activePlayer===ctx.player?ctx.opponent:ctx.player), handler:'u356.witch-return', args:{uid, player:ctx.player}, note:'静寂のサイコウィッチ'});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return u356WitchSent(ctx) && u356WitchPool(ctx).length>0; }, onDestroy(ctx){ return u356WitchSent(ctx) && u356WitchPool(ctx).length>0; } } });
