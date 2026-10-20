/* S03-U350: seven battle-reactive / static monsters (carddata texts).

   雷魔神－サンガ / 風魔神－ヒューガ / 水魔神－スーガ
                      相手のターンに攻撃された場合、そのダメージ計算時に発動できる。その攻撃モンスター1体の攻撃力を0にする。この効果はこのカードが表側表示で存在する限り1度しか使用できない。
   盲信するゴブリン   表側表示でフィールドに存在する限り、コントロールを変更できない。
   牙城のガーディアン 自分の守備表示モンスターが攻撃された場合、そのダメージステップ時にこのカードを手札から墓地へ送る事で、その戦闘を行う自分のモンスターの守備力はエンドフェイズ時まで1500アップする。
   精気を吸う骨の塔   自分フィールドにこのカード以外のアンデット族モンスターが存在する場合、このカードを攻撃できない。アンデット族モンスターが特殊召喚に成功する度に、相手のデッキの上からカードを2枚墓地へ送る。
   火車               通常召喚できない。自分フィールドのアンデット族モンスターが2体以上の場合のみ特殊召喚できる。特殊召喚に成功した場合に発動する。このカード以外のフィールドのモンスターを全て持ち主のデッキに戻す。元々の種族がアンデット族の表側表示モンスターがデッキに戻った場合、このカードの攻撃力はそのモンスターの数×1000になる。

   Notes
   - The three 魔神 and 牙城のガーディアン use the Damage Step "calc" window exactly as クリボン (S03-U345): a monster script (dsTiming 'calc', timing damageStep) with a passive onDamageStep hook.
     The 魔神 once-only use is a card flag (zone-local: a new face-up stay starts again); the ATK 0 is a stat modifier on the attacker that lasts while it is face-up on the field.
   - 盲信するゴブリン: controlLockS03 (engine/00, S03-U251). 精気を吸う骨の塔: continuous cannotBeAttackTarget on itself + a forced onSpecialSummon trigger (one mill of 2 per Undead monster summoned).
   - 火車: hand procedure (cannotNormalSummon + summonProcedure with a field condition); a forced self onSpecialSummon trigger returns every other monster (both fields) to the owner's Deck and records the count of the face-up original-Undead ones in a card flag read by the continuous ATK. */

/* ---- 魔神 ×3 ---- */
function u350Attacked(ctx){
  const b = gameState.battle;
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && !!b && b.target!=='direct' && b.targetUid===ctx.card.uid && b.atkUid!=null && gameState.activePlayer===ctx.opponent;
}
function u350Majin(name){
  defineScript(name, {
    type:'monster', priority:2, dsTiming:'calc', activateFrom:['mz'], timing:['damageStep'],
    condition(ctx){
      if(!u350Attacked(ctx)){ ctx.reason = '相手のターンに攻撃されたダメージ計算時に発動します'; return false; }
      if(ctx.card.u350Used){ ctx.reason = 'この効果は表側表示で存在する限り1度しか使用できません'; return false; }
      return true;
    },
    resolve(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone==='mz') API.setCardFlag(me, 'u350Used', true, name, {silent:true});
      const b = gameState.battle, a = b && b.atkUid!=null ? findCardByUid(b.atkUid) : null;
      if(a && a.zone==='mz' && a.card.face==='up') v4RegisterStatModifier(a, {setAtk:0}, {code:name, resetMask:RESET.LEAVE|RESET.FACE_DOWN});
    },
    afterResolve(){},
    passive:{ onDamageStep(ctx){ return u350Attacked(ctx) && !ctx.card.u350Used; } }
  });
}
u350Majin('雷魔神－サンガ');
u350Majin('風魔神－ヒューガ');
u350Majin('水魔神－スーガ');

/* ---- 盲信するゴブリン ---- */
defineUnifiedCardV4('盲信するゴブリン', [], {
  type:'monster', priority:1,
  controlLockS03(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz' && card.face==='up'; }
});

/* ---- 牙城のガーディアン ---- */
function u350DefAttacked(ctx){
  const b = gameState.battle;
  if(!b || b.target==='direct' || b.targetUid==null || b.atkUid==null) return false;
  const t = findCardByUid(b.targetUid);
  return !!t && t.zone==='mz' && t.p===ctx.player && t.card.pos==='def' && t.card.face==='up';
}
defineScript('牙城のガーディアン', {
  type:'monster', priority:2, dsTiming:'calc', activateFrom:['hand'], timing:['damageStep'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!u350DefAttacked(ctx)){ ctx.reason = '自分の守備表示モンスターが攻撃された場合のダメージステップに発動します'; return false; }
    return true;
  },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.discard(ctx.player, i, '牙城のガーディアン（コスト）', {byEffect:false}); done(true); },
  resolve(ctx){
    const b = gameState.battle, t = b && b.targetUid!=null ? findCardByUid(b.targetUid) : null;
    if(t && t.zone==='mz' && t.card.face==='up') v4RegisterStatModifier(t, {def:1500}, {code:'牙城のガーディアン', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone==='hand' && u350DefAttacked(ctx); } }
});

/* ---- 精気を吸う骨の塔 ---- */
function u350TowerSummoned(ctx){
  const e = ctx.event || {};
  const cards = Array.isArray(e.cards) ? e.cards : (e.card ? [e.card] : []);
  return cards.filter(c=>{ const h = locateCard(c); return !!h && h.zone==='mz' && c.face==='up' && currentRaceV17(c)==='アンデット'; }).length;
}
defineUnifiedCardV4('精気を吸う骨の塔', [{
  key:'mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && u350TowerSummoned(ctx)>0; },
  operation(ctx){ const n = u350TowerSummoned(ctx); for(let i=0;i<n;i++) API.millTop(ctx.opponent, 2, '精気を吸う骨の塔'); },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true, timing:['free'], onOtherSummon:true,
  passive:{ onSpecialSummon(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && u350TowerSummoned(ctx)>0; } },
  continuous:{ scope:'allMonsters', from:['mz'],
    cannotBeAttackTarget(target, self){
      if(target!==self || self.face!=='up') return false;
      const h = findCardByUid(self.uid); if(!h || h.zone!=='mz') return false;
      return API.fieldCards({player:h.p, zone:'mz', filter:x=>x.card!==self && x.card.face==='up' && currentRaceV17(x.card)==='アンデット'}).length>0;
    } }
});

/* ---- 火車 ---- */
function u350KashaReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx); }
defineUnifiedCardV4('火車', [{
  key:'sweep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u350KashaReady(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const uid = ensureCardUid(gameState, ctx.card);
    const pool = API.fieldCards({zone:'mz'}).filter(x=>x.card.uid!==uid);
    let n = 0;
    pool.forEach(x=>{ if(x.card.face==='up' && dbOf(x.card).k==='m' && dbOf(x.card).ra==='アンデット') n++; });
    pool.forEach(x=>{ const h = findCardByUid(x.card.uid); if(h && h.zone==='mz') API.returnToDeck(h, false, '火車'); });
    [0,1].forEach(p=>{ if(pool.some(x=>x.p===p)) API.shuffle(p); });
    const h2 = locateCardAnyV4(ctx.card); if(h2 && h2.zone==='mz') API.setCardFlag(h2, 'u350KashaN', n, '火車', {silent:true});
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'],
  passive:{ onSpecialSummon(ctx){ return u350KashaReady(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up' || self.u350KashaN==null) return null; return {setAtk:(Number(self.u350KashaN)||0)*1000}; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      const n = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && currentRaceV17(x.card)==='アンデット'}).length;
      if(n<2){ ctx.reason = '自分フィールドにアンデット族モンスターが2体以上必要です'; return false; }
      return true;
    }
  }
});
