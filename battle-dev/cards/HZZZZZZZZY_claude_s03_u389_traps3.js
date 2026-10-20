/* S03-U389: three NOT_STARTED cards (carddata texts).

   死神の巡遊      （永続罠）相手ターンのスタンバイフェイズ時にコイントスを1回行い以下の効果を適用する。●表:相手はエンドフェイズ時まで召喚・反転召喚する事ができない。●裏:自分は次の自分のターン召喚・反転召喚する事ができない。
   神の威光        （永続罠）自分フィールド上に表側表示で存在する「極神」と名のついたモンスター1体を選択して発動する。このカードがフィールド上に存在する限り、お互いのプレイヤーは選択したモンスターをカードの効果の対象にする事はできない。発動後2回目の自分のスタンバイフェイズ時にこのカードを墓地へ送る。
   ミラクル・フリッパー  「ミラクル・フリッパー」が自分フィールド上に存在する場合、このカードは召喚・反転召喚・特殊召喚できない。このカードがフィールド上に表側表示で存在する限り、相手は他の表側表示のモンスターを攻撃対象に選択できない。このカードが戦闘によって破壊された場合、このカードを相手フィールド上に特殊召喚する。このカードが魔法・罠の効果によって破壊された場合、相手フィールド上のモンスター1体を破壊する。

   Notes
   - 死神の巡遊: a forced trigger of the opponent's Standby Phase; the coin is duelRandomInt(2) (0 = 表): 表 -> banSummonS03 on the opponent for this turn (Normal / Flip Summon); 裏 -> on me for my next turn.
   - 神の威光: the chosen monster's uid is a card flag of the Trap (and the turn it was activated); continuous.immuneToTarget protects it from every source (both players); a forced Standby Phase trigger sends the Trap to the Graveyard at my 2nd Standby Phase after the activation.
   - ミラクル・フリッパー: summonConditionS03 (no other 「ミラクル・フリッパー」 of mine for the three summon kinds), continuous.cannotBeAttackTargetBothS03 for the other monsters of its controller, a Graveyard trigger after a battle destruction (Special Summons it on the opponent's field)
     and one after a Spell / Trap destruction (destroys an opposing monster). */

/* ---- 死神の巡遊 ---- */
function u389Standby(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && ctx.player!==gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('死神の巡遊', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'toss', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u389Standby(ctx); },
  operation(ctx){
    const heads = (typeof duelRandomInt==='function' ? duelRandomInt(2) : 0) === 0;
    API.log(`死神の巡遊：コイントス ${heads ? '表' : '裏'}`);
    if(heads) banSummonS03(ctx.opponent, gameState.turn, gameState.turn, ['normal','flip'], {}, '死神の巡遊');
    else banSummonS03(ctx.player, gameState.turn+1, gameState.turn+1, ['normal','flip'], {}, '死神の巡遊');
  },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, passive:{ onStandbyPhase(ctx){ return u389Standby(ctx); } } });

/* ---- 神の威光 ---- */
function u389Divines(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && String(x.db.n||'').indexOf('極神')>=0}); }
function u389GodReady(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
defineUnifiedCardV4('神の威光', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){
    if(u389GodReady(ctx)) return false;
    if(!u389Divines(ctx).length){ ctx.reason = '自分フィールドに表側表示の「極神」モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('神の威光：対象にならなくする「極神」モンスター', u389Divines(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || !me || me.zone!=='sz') return;
    API.setCardFlag(me, 'u389Guarded', ensureCardUid(gameState, r.card), '神の威光', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u389Start', gameState.turn, '神の威光', {silent:true});
  },
  afterResolve(){}
}, {
  key:'expire', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u389GodReady(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby' && ctx.card.u389Start!=null && Number(gameState.turn)>=Number(ctx.card.u389Start)+2; },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.sendToGrave(me, '神の威光'); },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, forced:true,
  passive:{ onStandbyPhase(ctx){ return u389GodReady(ctx) && ctx.player===gameState.activePlayer && gameState.phase==='standby' && ctx.card.u389Start!=null && Number(gameState.turn)>=Number(ctx.card.u389Start)+2; } },
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    immuneToTarget(card, self){ return !!self && self.face==='up' && self.u389Guarded!=null && card.uid===self.u389Guarded; } } });

/* ---- ミラクル・フリッパー ---- */
function u389Flipper(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
function u389FlipperBattle(ctx){ const g = ctx.card.graveInfo; return u389Flipper(ctx) && !!g.battle && hasMonsterZoneSpace(ctx.opponent); }
function u389FlipperEffect(ctx){ const g = ctx.card.graveInfo; return u389Flipper(ctx) && !!g.byDestroy && !g.battle && g.srcUidS03!=null && (function(){ const s = findCardByUid(g.srcUidS03); return !!s && (dbOf(s.card).k==='s' || dbOf(s.card).k==='t'); })() && API.fieldCards({player:ctx.opponent, zone:'mz', filter:()=>true}).length>0; }
defineUnifiedCardV4('ミラクル・フリッパー', [{
  key:'to-foe', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u389FlipperBattle(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.opponent)) API.specialSummon(ctx.opponent, 'grave', h.index, 'atk', 'ミラクル・フリッパー', ctx.player); },
  afterResolve(){}
}, {
  key:'destroy-foe', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u389FlipperEffect(ctx); },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:()=>true}); if(!pool.length) return;
    API.selectCard('ミラクル・フリッパー：破壊する相手モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz') API.destroy(r, 'ミラクル・フリッパー'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'], includesSpecialSummon:true,
  summonConditionS03:(p, db, kind)=> (gameState.players[p].mz||[]).some(c=>c && dbOf(c).n==='ミラクル・フリッパー') ? '自分フィールドに「ミラクル・フリッパー」が存在するため召喚・特殊召喚できません' : '',
  passive:{ onSendToGrave(ctx){ return u389FlipperBattle(ctx) || u389FlipperEffect(ctx); }, onDestroy(ctx){ return u389FlipperBattle(ctx) || u389FlipperEffect(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; }, cannotBeAttackTargetBothS03:true,
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || !target || target===self || target.face!=='up') return false;
      const sh = findCardByUid(self.uid), th = findCardByUid(target.uid);
      return !!sh && !!th && sh.zone==='mz' && th.zone==='mz' && th.p===sh.p;
    } } });
