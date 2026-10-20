/* S03-U361: three Alien cards and 昇霊術師 ジョウゲン (carddata texts; the A Counter helpers of S03-U316 — alienContinuousS03 / alienCountersS03).

   エーリアン・マザー     戦闘によってAカウンターが乗ったモンスターを破壊し墓地へ送った場合、そのバトルフェイズ終了時に発動する。破壊したそのモンスターを自分フィールドに特殊召喚する。このカードがフィールドから離れた場合、そのモンスターを全て破壊する。（+ Aカウンターのペナルティ）
   異界空間－Aゾーン      相手モンスターが自分フィールドの「エーリアン」モンスターと戦闘する場合、相手モンスターの攻撃力・守備力はダメージ計算時のみ300ダウンする。
   エーリアン・ブレイン   自分フィールドの爬虫類族モンスターが相手モンスターの攻撃によって破壊され墓地に送られた時に発動できる。その時に攻撃を行った相手モンスターのコントロールを得て、そのモンスターを爬虫類族として扱う。
   昇霊術師 ジョウゲン    手札をランダムに1枚墓地へ捨てて発動できる。フィールドの特殊召喚されたモンスターを全て破壊する。このカードが表側表示で存在する限り、お互いにモンスターを特殊召喚できない。

   Notes
   - マザー: the victim is read in the Damage Step 'leave' window (gearKilledFoeS03) while its A Counters are still on it; the revival is an API.schedule at 'battlePhaseEnd'; linkOnLeave(monster, Mother, 'destroy') destroys it when Mother leaves.
   - ブレイン: the attacker comes from gameState.lastBattle (attackerUidV6 / defenderUidV6); API.changeControl (permanent) + API.setRace(…, '爬虫類', 'permanent') (zone-local: it ends when the monster leaves).
   - ジョウゲン: card.specialSummoned is the engine's own record; the lock is the script hook specialSummonLockS03 (as A・O・J D.D.チェッカー). */

/* ---- エーリアン・マザー ---- */
API.registerScheduleHandler('u361.mother-revive', (args)=>{
  const g = args && args.uid!=null ? findCardByUid(args.uid) : null;
  const m = args && args.mother!=null ? findCardByUid(args.mother) : null;
  if(!g || g.zone!=='grave' || !m || m.zone!=='mz' || m.p!==args.player || !hasMonsterZoneSpace(args.player)) return;
  const uid = args.uid;
  API.specialSummon(args.player, 'grave', g.index, 'atk', 'エーリアン・マザー', g.p);
  const now = findCardByUid(uid), mm = findCardByUid(args.mother);
  if(now && now.zone==='mz' && mm && mm.zone==='mz') API.linkOnLeave(now, mm, 'destroy', 'エーリアン・マザー');
});
/* the victim's A Counters are gone once it has left the field, so the battle is marked when it is declared (Mother attacking or being attacked) */
function u361MotherOther(ctx){
  const a = gameState.pendingAttack; if(!a || ctx.zone!=='mz' || ctx.card.face!=='up' || a.targetUid==null || a.attackerUid==null) return null;
  const me = ctx.card.uid;
  const other = a.attackerUid===me ? a.targetUid : (a.targetUid===me ? a.attackerUid : null);
  const h = other!=null ? findCardByUid(other) : null;
  return (h && h.zone==='mz' && h.card.face==='up' && alienCountersS03(h.card)>0) ? h : null;
}
function u361MotherKill(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.step!=='leave' || ctx.card.face!=='up' || ctx.card.u361Marked==null) return null;
  const victim = b.atkCard===ctx.card ? (b.destroyedDef && b.defCard) : b.defCard===ctx.card ? (b.destroyedAtk && b.atkCard) : null;
  return (victim && victim.uid===ctx.card.u361Marked) ? victim : null;
}
defineUnifiedCardV4('エーリアン・マザー', [{
  key:'mark', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return !!u361MotherOther(ctx); },
  operation(ctx){ const o = u361MotherOther(ctx), me = locateCardAnyV4(ctx.card); if(o && me) API.setCardFlag(me, 'u361Marked', ensureCardUid(gameState, o.card), 'エーリアン・マザー', {silent:true}); },
  afterResolve(){}
}, {
  key:'plan', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u361MotherKill(ctx); },
  operation(ctx){
    const v = u361MotherKill(ctx); const me = locateCardAnyV4(ctx.card); if(!v || !me) return;
    const uid = ensureCardUid(gameState, v);
    API.schedule({at:'battlePhaseEnd', turns:0, player:ctx.player, handler:'u361.mother-revive', args:{uid, mother:ensureCardUid(gameState, ctx.card), player:ctx.player}, note:'エーリアン・マザー'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, dsTiming:'leave', timing:['free'],
  passive:{ onAttackDeclare(ctx){ return !!u361MotherOther(ctx); }, onDamageStep(ctx){ return !!u361MotherKill(ctx); } },
  continuous:alienContinuousS03(true)});

/* ---- 異界空間－Aゾーン ---- */
defineUnifiedCardV4('異界空間－Aゾーン', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.FIELD, speed:1, events:['activate'], operation(){}, afterResolve(){}
}], {type:'spell', priority:1,
  continuous:{ scope:'allMonsters', from:['field'],
    apply(card, self){
      if(!self || self.face!=='up' || !card || card.face!=='up' || !gameState.battle || !a5InDamageStep()) return null;
      const sh = findCardByUid(self.uid), ch = findCardByUid(card.uid), other = a5BattleOtherOf(card);
      if(!sh || !ch || ch.zone!=='mz' || ch.p===sh.p || !other) return null;
      const oh = findCardByUid(other.uid);
      if(!oh || oh.zone!=='mz' || oh.p!==sh.p || other.face!=='up' || !isCardInGroupV4(other, GROUP.ALIEN)) return null;
      return {atk:-300, def:-300};
    } } });

/* ---- エーリアン・ブレイン ---- */
function u361BrainVictim(ctx){
  const e = ctx.event || {};
  const uid = e.uid!=null ? e.uid : (Array.isArray(e.uids) && e.uids.length===1 ? e.uids[0] : null);
  if(uid==null) return null;
  const h = findCardByUid(uid); if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const g = h.card.graveInfo, d = dbOf(h.card);
  if(!g || g.from!=='mz' || !g.battle || Number(g.turn)!==Number(gameState.turn) || !d || d.ra!=='爬虫類') return null;
  const lb = gameState.lastBattle; if(!lb) return null;
  const aggr = lb.attackerUidV6!=null ? findCardByUid(lb.attackerUidV6) : null;
  return (aggr && aggr.zone==='mz' && aggr.p===ctx.opponent && lb.defenderUidV6===uid && aggr.card.face==='up') ? aggr : null;
}
defineScript('エーリアン・ブレイン', {
  type:'trap', priority:2, targets:false,
  condition(ctx){ if(!u361BrainVictim(ctx)){ ctx.reason = '自分の爬虫類族モンスターが相手モンスターの攻撃で破壊され墓地へ送られた時に発動します'; return false; } return true; },
  resolve(ctx){
    const a = u361BrainVictim(ctx); if(!a || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = a.card.uid;
    API.changeControl(a, ctx.player, 'エーリアン・ブレイン');
    const now = findCardByUid(uid); if(now && now.zone==='mz') API.setRace(now, '爬虫類', 'permanent', 'エーリアン・ブレイン');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && !!u361BrainVictim(ctx); } }
});

/* ---- 昇霊術師 ジョウゲン ---- */
function u361SpecialSummoned(){ return API.fieldCards({zone:'mz', filter:x=>x.card.specialSummoned===true}); }
defineUnifiedCardV4('昇霊術師 ジョウゲン', [{
  key:'purge', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(!u361SpecialSummoned().length){ ctx.reason = 'フィールドに特殊召喚されたモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const n = API.me(ctx).hand.length; if(!n){ done(false); return; }
    const i = (typeof duelRandomInt==='function') ? duelRandomInt(n) : 0;
    API.discard(ctx.player, i, '昇霊術師 ジョウゲン（コスト）', {byEffect:false}); done(true);
  },
  operation(ctx){ u361SpecialSummoned().forEach(x=>{ const h = findCardByUid(x.card.uid); if(h && h.zone==='mz') API.destroy(h, '昇霊術師 ジョウゲン'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'],
  specialSummonLockS03:(db)=> !!db && db.k==='m' });
