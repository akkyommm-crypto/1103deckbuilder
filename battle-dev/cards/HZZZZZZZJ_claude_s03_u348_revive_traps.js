/* S03-U348: four Continuous Traps that revive a monster and are linked to it (carddata texts; the pattern of リビングデッドの呼び声 / 閃光のイリュージョン).

   アマゾネスの意地    自分の墓地の「アマゾネス」1体を攻撃表示で特殊召喚する。そのモンスターは表示形式を変更できず、攻撃可能な場合には攻撃しなければならない。このカードがフィールドに存在しなくなった時そのモンスターを破壊する。そのモンスターが破壊された時このカードを破壊する。
   ウィキッド・リボーン 800LPを払い、自分の墓地のシンクロモンスター1体を選択して発動。表側攻撃表示で特殊召喚する。そのモンスターの効果は無効化され、このターン攻撃宣言できない。このカードが存在しなくなった時そのモンスターを破壊する。そのモンスターが破壊された時このカードを破壊する。
   コアの再練成        自分の墓地の「コアキメイル」1体を攻撃表示で特殊召喚する。自分のエンドフェイズ時にそのモンスターが破壊された時、このカードのコントローラーはそのモンスターの攻撃力分のダメージを受ける。このカードが存在しなくなった時そのモンスターを破壊する。そのモンスターが破壊された時このカードを破壊する。
   サイコ・チューン    自分の墓地のサイキック族1体を攻撃表示で特殊召喚する。そのモンスターはチューナーとして扱う。このカードが存在しなくなった時そのモンスターを破壊する。そのモンスターがフィールドから離れた時このカードを破壊する。このカードが墓地へ送られた時、そのモンスターのレベル×400ダメージを自分が受ける。

   Notes
   - u348Revive builds the activation (target in the Graveyard, optional cost, Special Summon in Attack Position, then API.linkOnLeave(revived, self, 'destroy') = the trap leaves → the monster is destroyed; the other direction is a watch + a forced trigger on the partner's onDestroy (「破壊された時」) or on any of onDestroy / onLeaveField / onSendToGrave / onRemove (サイコ・チューン: 「フィールドから離れた時」) that destroys the trap — a trigger, not a second link, because a link-made destruction queues no events (the trap's own 「墓地へ送られた時」 trigger would not fire).
   - サイコ・チューン' Level × 400: the revived monster's Level is kept in a persistent player flag (u348Psy) because the trap's own card flags end when it leaves the field. */

function u348Watches(card, uid){ return s03CothWatchesU89(card, uid); }
function u348Revive(name, o){
  const effects = [{
    key:'revive', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:2, events:['activate'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(o.cost && !o.cost.ok(ctx)){ ctx.reason = o.cost.reason; return false; }
      if(!o.pool(ctx.player).length){ ctx.reason = o.noTarget; return false; }
      return true;
    },
    cost(ctx, done){ if(o.cost){ o.cost.pay(ctx); } done(true); },
    target(ctx, done){ API.selectCard(name+'：蘇生するモンスター', o.pool(ctx.player), t=>done([t])); },
    operation(ctx){
      const picked = ctx.selectedTargets && ctx.selectedTargets[0], r = picked && resolveTarget(picked);
      if(!r || r.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
      const card = r.card; ensureCardUid(gameState, card);
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', name);
      const self = locateCardAnyV4(ctx.card), revived = locateCardAnyV4(card);
      if(!self || self.zone!=='sz' || !revived || revived.zone!=='mz') return;
      API.linkOnLeave(revived, self, 'destroy', name);
      API.linkOnLeave(self, revived, 'none', name);
      if(o.after) o.after(ctx, revived, self);
    },
    afterResolve(){}
  }];
  const passive = {};
  const leaveEvents = o.anyLeave ? ['onDestroy','onLeaveField','onSendToGrave','onRemove'] : ['onDestroy'];
  {
    effects.push({
      key:'destroy-self', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:leaveEvents, forced:true,
      condition(ctx){ const e = ctx.event||{}; return ctx.zone==='sz' && ctx.card.face==='up' && e.uid!=null && u348Watches(ctx.card, e.uid); },
      operation(ctx){
        const e = ctx.event||{};
        if(o.onPartnerDestroyed) o.onPartnerDestroyed(ctx, e.uid);
        const self = locateCardAnyV4(ctx.card); if(self && self.zone==='sz') API.destroy(self, name);
      },
      afterResolve(){}
    });
    leaveEvents.forEach(ev=>{ passive[ev] = ctx=>{ const e = ctx.event||{}; return ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && e.uid!=null && u348Watches(ctx.card, e.uid); }; });
  }
  if(o.extraEffects) o.extraEffects.forEach(x=>effects.push(x.effect));
  if(o.extraEffects) o.extraEffects.forEach(x=>Object.assign(passive, x.passive||{}));
  return defineUnifiedCardV4(name, effects, Object.assign({type:'trap', priority:2, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true, passive,
    continuous:Object.assign({scope:'self', from:['sz'], apply(){ return null; }}, o.continuous||{})}, o.meta||{}));
}

/* ---- アマゾネスの意地 ---- */
u348Revive('アマゾネスの意地', {
  noTarget:'墓地に「アマゾネス」モンスターがいません',
  pool:p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('アマゾネス')>=0),
  after:(ctx, revived)=>API.setCardFlag(revived, 'u348Amazon', true, 'アマゾネスの意地', {silent:true}),
  continuous:{ scope:'allMonsters',
    cannotChangePosition(card){ return !!card && card.u348Amazon===true && card.face==='up'; },
    mustAttack(card){ return !!card && card.u348Amazon===true && card.pos==='atk'; } }
});

/* ---- ウィキッド・リボーン ---- */
u348Revive('ウィキッド・リボーン', {
  noTarget:'墓地にシンクロモンスターがいません',
  cost:{ ok:ctx=>API.me(ctx).lp>=800, reason:'ライフポイントが足りません', pay:ctx=>API.payCost(ctx.player, 800) },
  pool:p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && (x.db.st||[]).indexOf('シンクロ')>=0),
  after:(ctx, revived, self)=>{
    API.negateEffectUntil(revived, 'permanent', 'ウィキッド・リボーン', self.card);
    const h = locateCardAnyV4(revived.card); if(h && h.zone==='mz') API.setCardFlag(h, 'cannotAttackTurn', gameState.turn, 'ウィキッド・リボーン', {silent:true});
  }
});

/* ---- コアの再練成 ---- */
u348Revive('コアの再練成', {
  noTarget:'墓地に「コアキメイル」モンスターがいません',
  pool:p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('コアキメイル')===0),
  onPartnerDestroyed:(ctx, uid)=>{
    if(gameState.phase!=='end' || gameState.activePlayer!==ctx.player) return;
    const h = findCardByUid(uid); const n = h ? Number(dbOf(h.card).atk)||0 : 0;
    if(n>0) API.damageLP(ctx.player, n, 'コアの再練成');
  }
});

/* ---- サイコ・チューン ---- */
function u348PsySent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  const mine = (e.uid!=null && e.uid===ctx.card.uid) || (Array.isArray(e.uids) && e.uids.indexOf(ctx.card.uid)>=0);
  return ctx.zone==='grave' && mine && !!g && (g.from==='sz') && Number(g.turn)===Number(gameState.turn);
}
u348Revive('サイコ・チューン', {
  anyLeave:true,
  noTarget:'墓地にサイキック族モンスターがいません',
  pool:p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='サイキック'),
  after:(ctx, revived, self)=>{
    API.setTuner(revived, true, 'permanent', 'サイコ・チューン');
    const cur = API.getFlag(ctx.player, 'u348Psy'); const arr = Array.isArray(cur) ? cur.filter(x=>x && x.trap!==self.card.uid) : [];
    arr.push({trap:ensureCardUid(gameState, self.card), lv:Number(dbOf(revived.card).lv)||0});
    API.setFlag(ctx.player, 'u348Psy', arr, false);
  },
  extraEffects:[{
    effect:{ key:'sent-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy','onFieldToGraveBatchS03'], forced:true,
      condition(ctx){ return u348PsySent(ctx); },
      operation(ctx){
        const arr = API.getFlag(ctx.player, 'u348Psy'); const i = Array.isArray(arr) ? arr.findIndex(x=>x && x.trap===ctx.card.uid) : -1;
        if(i<0) return;
        const n = arr[i].lv*400; API.setFlag(ctx.player, 'u348Psy', arr.filter((x,k)=>k!==i), false);
        if(n>0) API.damageLP(ctx.player, n, 'サイコ・チューン');
      },
      afterResolve(){} },
    passive:{ onSendToGrave(ctx){ return u348PsySent(ctx); }, onDestroy(ctx){ return u348PsySent(ctx); }, onFieldToGraveBatchS03(ctx){ return u348PsySent(ctx); } }
  }],
  meta:{activateFrom:['sz','grave']}
});
