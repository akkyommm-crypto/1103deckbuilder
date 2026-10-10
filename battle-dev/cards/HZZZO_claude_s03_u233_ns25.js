/* S03-U233: NOT_STARTED cards (2011 texts) — 異次元グランド, 黒いペンダント, 魔界の足枷, 明鏡止水の心, 機皇兵ワイゼル・アイン.
   Engine: a turn-stamped grave → banish flag (engine/1ZZG, temporaryFlags.graveToBanishTurnS03); a one-battle piercing stamp on the attacker
   (engine/00 applyPiercingDamage, card.pierceBattleS03). */

/* ---- 異次元グランド (Normal Trap): このターン、墓地へ送られるモンスターは墓地へは行かず除外される。 ---- */
defineScript('異次元グランド', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){ API.setFlag(ctx.player, 'graveToBanishTurnS03', {turn:gameState.turn, by:'異次元グランド'}, true); },
  afterResolve(){}
});

/* shared: equip to a face-up monster (either side) */
function equipFaceUpS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}); }
function equipActivateS03(name){
  return {
    key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
    condition(){ return equipFaceUpS03().length>0; },
    target(ctx, done){ API.selectCard(`${name}：装備するモンスター`, equipFaceUpS03(), t=>done([t])); },
    operation(ctx){
      const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(s && t && t.zone==='mz' && t.card.face==='up') API.equipSpell(s, t, name);
    },
    afterResolve(){}
  };
}
function equippedS03(card, self){ return !!(self && self.equipTo && card && self.equipTo.uid===card.uid); }
function equipHostS03(self){ const h = self && self.equipTo ? findCardByUid(self.equipTo.uid) : null; return h && h.zone==='mz' ? h : null; }

/* ---- 黒いペンダント: ①:装備モンスターの攻撃力は500アップする。②:このカードがフィールドから墓地へ送られた場合に発動する。相手に500ダメージを与える。 ---- */
function pendantSentS03(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && (g.from==='sz' || g.from==='field') && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('黒いペンダント', [equipActivateS03('黒いペンダント'), {
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return pendantSentS03(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 500, '黒いペンダント'); },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, activateFrom:['hand','sz','grave'],
    passive:{onSendToGrave(ctx){ return pendantSentS03(ctx); }},
    continuous:{scope:'allMonsters', from:['sz'], apply(card, self){ return equippedS03(card, self) ? {atk:500} : null; }}});

/* ---- 魔界の足枷: 装備モンスターは攻撃する事ができず、攻撃力・守備力は100になる。また、自分のスタンバイフェイズ毎に、装備モンスターのコントローラーに
   500ポイントダメージを与える。 (forced, the Spell's controller's Standby Phase) ---- */
function fettersReadyS03(ctx){
  return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && gameState.phase==='standby' && gameState.activePlayer===ctx.player
    && !!equipHostS03(ctx.card);
}
defineUnifiedCardV4('魔界の足枷', [equipActivateS03('魔界の足枷'), {
  key:'standby-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return fettersReadyS03(ctx); },
  operation(ctx){ const h = equipHostS03(locateCardAnyV4(ctx.card) ? locateCardAnyV4(ctx.card).card : ctx.card); if(h) API.damageLP(h.p, 500, '魔界の足枷'); },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true,
    passive:{onStandbyPhase(ctx){ return fettersReadyS03(ctx); }},
    continuous:{scope:'allMonsters', from:['sz'],
      apply(card, self){ return equippedS03(card, self) ? {setAtk:100, setDef:100} : null; },
      cannotAttack(card, self){ return equippedS03(card, self); }}});

/* ---- 明鏡止水の心: 装備モンスターは、戦闘及び装備モンスターを対象とするカードの効果では破壊されない。装備モンスターの攻撃力が1300以上の場合、
   このカードを破壊する。 ---- */
defineUnifiedCardV4('明鏡止水の心', [equipActivateS03('明鏡止水の心')], {type:'spell', priority:1, targets:true,
  continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; },
    protectV21:{scope:'equippedMonster', battle:true, effect:(t, s, ctx)=>!!(ctx && ctx.targeting), label:'明鏡止水の心'}},
  selfDestroyWhenS03:(card)=>{ const h = equipHostS03(card); return h && curATK(h.card)>=1300 ? '明鏡止水の心：装備モンスターの攻撃力が1300以上のため破壊' : false; }});

/* ---- 機皇兵ワイゼル・アイン: ①:このカードの攻撃力は、このカード以外のフィールドの「機皇」モンスターの数×100アップする。
   ②:1ターンに1度、このカード以外の自分の「機皇」モンスターが守備表示モンスターに攻撃宣言した時に発動できる。その戦闘でその自分のモンスターが
   守備表示モンスターを攻撃した場合、その守備力を攻撃力が超えた分だけ相手に戦闘ダメージを与える。 ---- */
function meklordS03(c){ return !!c && c.face==='up' && String(cardName(c)).indexOf('機皇')>=0; }
function wiselReadyS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return null;
  const a = gameState.pendingAttack; if(!a || a.player!==ctx.player || a.targetUid==null) return null;
  const at = findCardByUid(a.attackerUid), df = findCardByUid(a.targetUid);
  if(!at || at.zone!=='mz' || at.card===ctx.card || !meklordS03(at.card)) return null;
  if(!df || df.zone!=='mz' || df.card.pos!=='def') return null;
  return {at, df};
}
defineScript('機皇兵ワイゼル・アイン', {
  type:'monster', priority:1, countLimit:1,
  condition(ctx){ if(!wiselReadyS03(ctx)){ ctx.reason = '自分の他の「機皇」が守備表示モンスターに攻撃宣言した時に発動できます'; return false; } return true; },
  resolve(ctx){
    const a = gameState.pendingAttack; if(!a || a.targetUid==null) return;
    const at = findCardByUid(a.attackerUid); if(!at || at.zone!=='mz') return;
    API.setCardFlag(at, 'pierceBattleS03', {turn:gameState.turn, target:a.targetUid}, '機皇兵ワイゼル・アイン', {silent:true});
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return !!wiselReadyS03(ctx); } },
  continuous:{scope:'self', apply(card){
    const n = [0,1].flatMap(q=>(gameState.players[q].mz||[]).filter(c=>c && c!==card && meklordS03(c))).length;
    return n ? {atk:100*n} : null; }}
});
