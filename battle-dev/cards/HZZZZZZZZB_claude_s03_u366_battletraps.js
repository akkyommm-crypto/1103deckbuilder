/* S03-U366: four battle Traps (carddata texts).

   ファイヤー・ウォール  （永続罠）相手が直接攻撃を宣言した時、自分の墓地の炎族モンスター1体を除外する事で、その攻撃を無効にする。自分のスタンバイフェイズ毎に500LPを払う。払わなければ破壊する。
   吠え猛る大地        （永続罠）自分の獣族モンスターが守備表示モンスターを攻撃した時、守備力を攻撃力が超えていれば、その数値だけ相手に戦闘ダメージを与える。この効果で戦闘ダメージを与えた時、相手の表側表示モンスター1体の攻撃力・守備力を500ダウンする。
   援護射撃            （罠）相手モンスターが自分のモンスターを攻撃する場合、ダメージステップ時に発動できる。攻撃を受けた自分モンスターの攻撃力は、自分の他の表側表示モンスター1体の攻撃力分アップする。
   奇跡の軌跡          （罠）自分の表側攻撃表示モンスター1体を選択して発動する。相手はデッキから1枚ドローする。このターンのエンドフェイズ時まで、そのモンスターの攻撃力は1000アップし、1度のバトルフェイズ中に2回までモンスターに攻撃できる。そのモンスターが戦闘を行う場合、相手が受ける戦闘ダメージは0になる。

   Notes
   - ファイヤー・ウォール: speed-2 trigger on onAttackDeclare (a direct attack aimed at me), a Graveyard banish as the cost; a forced Standby trigger pays 500 or destroys it (the 平和の使者 pattern). The activation is a no-op Continuous Trap activation.
   - 吠え猛る大地: continuous.piercingDamage for the controller's Beast monsters (as 憎悪の棘, S03-U341) + a forced onBattleDamage trigger: the Beast attacked a Defense Position monster and the pierce dealt damage.
   - 援護射撃: the Damage Step 'calc' window (クリボン pattern, S03-U345): v4RegisterStatModifier on the attacked monster.
   - 奇跡の軌跡: the used trap lingers (API.lingerS03) as a continuous source of grantsAttackLimit and battleDamage, exactly as ワンダー・クローバー / 早すぎた復活. */

/* ---- ファイヤー・ウォール ---- */
function u366DirectOnMe(ctx){ const a = gameState.pendingAttack; return !!a && a.player===ctx.opponent && a.targetUid==null; }
function u366Pyro(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='炎'); }
function u366WallMine(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('ファイヤー・ウォール', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'], operation(){}, afterResolve(){}
}, {
  key:'negate', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && u366DirectOnMe(ctx) && u366Pyro(ctx).length>0 && !u342Bad(); },
  cost(ctx, done){
    API.selectCard('ファイヤー・ウォール：除外する炎族モンスター', u366Pyro(ctx), t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, 'ファイヤー・ウォール（コスト）'); done(true); });
  },
  operation(){ API.negateAttack('ファイヤー・ウォール'); },
  afterResolve(){}
}, {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u366WallMine(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return; if(API.me(ctx).lp>=500){ API.payCost(ctx.player, 500); return; } API.destroy(me, 'ファイヤー・ウォール'); },
  afterResolve(){}
}], {type:'trap', priority:2,
  passive:{ onAttackDeclare(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && u366DirectOnMe(ctx) && u366Pyro(ctx).length>0 && !u342Bad(); }, onStandbyPhase(ctx){ return u366WallMine(ctx); } } });

/* ---- 吠え猛る大地 ---- */
function u366BeastPierce(info){
  const self = info.self, a = info.atkCard, d = info.defCard;
  if(!self || self.face!=='up' || !a || !d || d.pos!=='def') return 0;
  const sh = findCardByUid(self.uid), ah = findCardByUid(a.uid);
  if(!sh || !ah || sh.p!==ah.p || dbOf(a).ra!=='獣') return 0;
  return Math.max(0, curATK(a) - curDEF(d));
}
function u366RoarHit(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='sz' || ctx.card.face!=='up' || !(Number(e.amount)>0) || e.player!==ctx.opponent) return null;
  const a = e.attackerUid!=null ? findCardByUid(e.attackerUid) : null;
  const d = e.defenderUid!=null ? findCardByUid(e.defenderUid) : null;
  if(!a || a.zone!=='mz' || a.p!==ctx.player || dbOf(a.card).ra!=='獣' || !d) return null;
  const wasDef = d.zone==='grave' ? (d.card.graveInfo && d.card.graveInfo.pos==='def') : (d.card.pos==='def');
  return wasDef ? a : null;
}
defineUnifiedCardV4('吠え猛る大地', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'], operation(){}, afterResolve(){}
}, {
  key:'weaken', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return !!u366RoarHit(ctx) && API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}).length>0; },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); if(!pool.length) return;
    API.selectCard('吠え猛る大地：攻撃力・守備力を500ダウンする相手モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up') v4RegisterStatModifier(r, {atk:-500, def:-500}, {code:'吠え猛る大地', resetMask:RESET.LEAVE|RESET.FACE_DOWN}); });
  },
  afterResolve(){}
}], {type:'trap', priority:1, forced:true,
  passive:{ onBattleDamage(ctx){ return !!u366RoarHit(ctx); } },
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; }, piercingDamage(info){ return u366BeastPierce(info); } } });

/* ---- 援護射撃 ---- */
function u366SupportTarget(ctx){
  const b = gameState.battle;
  if(!b || b.target==='direct' || b.targetUid==null || b.atkUid==null) return null;
  const t = findCardByUid(b.targetUid), a = findCardByUid(b.atkUid);
  return (t && a && t.zone==='mz' && t.p===ctx.player && t.card.face==='up' && a.zone==='mz' && a.p===ctx.opponent) ? t : null;
}
defineScript('援護射撃', {
  type:'trap', priority:2, dsTiming:'calc', timing:['damageStep'], targets:false,
  condition(ctx){
    const t = u366SupportTarget(ctx);
    if(!t){ ctx.reason = '相手モンスターが自分のモンスターを攻撃するダメージステップに発動します'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.card.uid!==t.card.uid}).length){ ctx.reason = '自分の他の表側表示モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const t = u366SupportTarget(ctx); if(!t) return;
    const pool = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.card.uid!==t.card.uid}); if(!pool.length) return;
    API.selectCard('援護射撃：攻撃力を加える自分のモンスター', pool, s=>{
      const r = s && resolveTarget(s), tt = u366SupportTarget(ctx);
      if(r && r.zone==='mz' && tt) v4RegisterStatModifier(tt, {atk:curATK(r.card)}, {code:'援護射撃', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!u366SupportTarget(ctx); } }
});

/* ---- 奇跡の軌跡 ---- */
function u366Mine(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}); }
defineScript('奇跡の軌跡', {
  type:'trap', priority:2, targets:true,
  condition(ctx){ if(!u366Mine(ctx).length){ ctx.reason = '自分の表側攻撃表示モンスターがいません'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('奇跡の軌跡：選択する自分のモンスター', u366Mine(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || r.p!==ctx.player || !me) return;
    API.draw(ctx.opponent, 1);
    const uid = ensureCardUid(gameState, r.card);
    v4RegisterStatModifier(r, {atk:1000}, {code:'奇跡の軌跡', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    API.setCardFlag(me, 'u366MiracleUid', uid, '奇跡の軌跡', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u366MiracleTurn', gameState.turn, '奇跡の軌跡', {silent:true});
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, '奇跡の軌跡');
  },
  afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['linger'], apply(){ return null; },
    grantsAttackLimit(card, self){ return (self && Number(self.u366MiracleTurn)===Number(gameState.turn) && card.uid===self.u366MiracleUid) ? 2 : null; },
    battleDamage(info){
      const s = info && info.self; if(!s || Number(s.u366MiracleTurn)!==Number(gameState.turn)) return info.amount;
      const a = info.atkCard, d = info.defCard;
      const mine = (a && a.uid===s.u366MiracleUid) ? a : ((d && d.uid===s.u366MiracleUid) ? d : null);
      if(!mine) return info.amount;
      const h = findCardByUid(mine.uid); if(!h) return info.amount;
      return info.to!==h.p ? 0 : info.amount;
    } } });
