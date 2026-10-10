/* S03-U166: D・ステープラン (2011):
   「このカードはこのカードの表示形式によって以下の効果を得る。
   ●攻撃表示:このカードがフィールド上に表側表示で存在する限り、相手は他のモンスターを攻撃対象に選択できない。このカードが戦闘によって
   破壊された場合、このカードを破壊したモンスターの攻撃力は300ポイントダウンする。
   ●守備表示:このカードは戦闘では破壊されない。このカードが攻撃された場合、そのダメージ計算後に相手フィールド上に表側攻撃表示で存在する
   モンスター1体を選択して守備表示にし、このカードの表示形式を攻撃表示にする。」
   - Attack Position: continuous cannotBeAttackTarget for its controller's other monsters (engine/1ZU); a forced trigger from the GY
     when destroyed by battle in Attack Position (graveInfo.pos) — the monster that destroyed it (the other side of that battle,
     gameState.lastBattle) loses 300 ATK (not a target).
   - Defense Position: protectV21 (battle); a forced trigger after damage calculation (dsTiming 'after') when it was attacked while in
     Defense Position (battle.defPosAtCalc): target a face-up Attack Position monster of the opponent → Defense Position, and this
     card → Attack Position. */
function staplerDestroyerS03(ctx){
  const lb = gameState.lastBattle;
  const me = ctx.card && ctx.card.uid;
  if(!lb || me==null) return null;
  const other = lb.attackerUidV6===me ? lb.defenderUidV6 : (lb.defenderUidV6===me ? lb.attackerUidV6 : null);
  if(other==null) return null;
  const h = findCardByUid(other);
  return (h && h.zone==='mz' && h.card.face==='up') ? h : null;
}
function staplerAttackedInDefS03(ctx){
  const b = ctx.battle || {}, gb = gameState.battle;   /* defPosAtCalc lives on the live battle (engine/30), not in battleContextV28 */
  return ctx.zone==='mz' && b.defCard===ctx.card && !!gb && gb.defPosAtCalc==='def';
}
function staplerOppAtkTargetsS03(ctx){
  return API.fieldCards({zone:'mz', player:ctx.opponent, filter:x=>x.card.face==='up' && x.card.pos==='atk'});
}
defineScript('D・ステープラン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz','grave'], dsTiming:'after',
  condition(ctx){
    if(ctx.zone==='grave'){
      const g = ctx.card.graveInfo;
      if(ctx.eventName!=='onBattleDestroy' || !eventIsSelfS03(ctx) || !g || g.pos!=='atk'){ ctx.reason = '攻撃表示のこのカードが戦闘で破壊された時に発動します'; return false; }
      if(!staplerDestroyerS03(ctx)){ ctx.reason = 'このカードを破壊したモンスターがフィールドにいません'; return false; }
      return true;
    }
    if(!staplerAttackedInDefS03(ctx)){ ctx.reason = '守備表示のこのカードが攻撃されたダメージ計算後に発動します'; return false; }
    if(!staplerOppAtkTargetsS03(ctx).length){ ctx.reason = '相手フィールドに表側攻撃表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone==='grave'){ done([]); return; }
    API.selectCard('D・ステープラン：守備表示にする相手の表側攻撃表示モンスター', staplerOppAtkTargetsS03(ctx), t=>done([t]));
  },
  resolve(ctx){
    if(ctx.zone==='grave'){
      const h = staplerDestroyerS03(ctx);
      if(!h){ API.log('D・ステープラン：破壊したモンスターがフィールドにいない'); return; }
      API.modAtk({p:h.p, zone:h.zone, index:h.index, card:h.card}, -300, 0, 'permanent', 'D・ステープラン');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.card.face==='up' && r.card.pos==='atk') API.changePosition(r, 'def', 'D・ステープラン');
    const me = locateCard(ctx.card);
    if(me && me.zone==='mz' && ctx.card.face==='up' && ctx.card.pos!=='atk') API.changePosition(me, 'atk', 'D・ステープラン');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return staplerAttackedInDefS03(ctx); },
    onBattleDestroy(ctx){ const g = ctx.card && ctx.card.graveInfo; return ctx.zone==='grave' && eventIsSelfS03(ctx) && !!g && g.pos==='atk'; }
  },
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target!==self && self.face==='up' && self.pos==='atk',
    protectV21:{ key:'D・ステープラン', label:'D・ステープラン', scope:'self',
      battle:(target, self)=> target===self && self.face==='up' && self.pos==='def' }
  }
});
