/* S03-U352: four monsters with battle / upkeep / control effects (carddata texts).

   フュージョニストキラー  このカードと戦闘を行う融合モンスターの攻撃力は、ダメージステップの間0となる。
   マックス・ウォリアー    相手モンスターに攻撃する場合、ダメージステップの間攻撃力400アップ。戦闘で相手モンスターを破壊した場合、次の自分のスタンバイフェイズ時までこのカードのレベルは2になり、元々の攻撃力・守備力は半分になる。
   メンタルプロテクター    自分のスタンバイフェイズ毎に500LPを払う。払えない場合破壊する。表側表示で存在する限り、サイキック族以外の攻撃力2000以下のモンスターは攻撃宣言できない。
   マジシャンズ・エイプ    特殊召喚できない。表側攻撃表示の場合、1ターンに1度、手札のモンスター1体を墓地へ送り、相手の表側守備表示モンスター1体を選択して発動できる。エンドフェイズまでコントロールを得る。そのモンスターはこのターン表示形式を変更できない。

   Notes
   - フュージョニストキラー / マックス・ウォリアー: continuous hooks read gameState.battle (atkIdx / targetUid), the same pattern as ライトロード・パラディン ジェイン; the Max Warrior shrink is a card flag with an expiry turn read by continuous setLevel / setBaseAtk / setBaseDef (the destruction trigger is the dsTiming 'leave' + gearKilledFoeS03 pattern).
   - メンタルプロテクター: forced onStandbyPhase trigger (payCost 500, else destroy), continuous cannotAttack on every monster.
   - マジシャンズ・エイプ: cannotSpecialSummon meta, ignition with a hand-discard cost, API.changeControl(…, 'endPhase'), a card flag + continuous cannotChangePosition for the position lock. */

function u352BattlePair(){
  const b = gameState.battle; if(!b || b.target==='direct' || b.targetUid==null) return null;
  const P = gameState.players[b.player]; const a = P && (P.mz||[])[b.atkIdx]; const t = findCardByUid(b.targetUid);
  return (a && t && t.zone==='mz') ? {atk:a, def:t.card} : null;
}
function u352Fought(card, self){ const p = u352BattlePair(); return !!p && ((p.atk===card && p.def===self) || (p.def===card && p.atk===self)); }

/* ---- フュージョニストキラー ---- */
defineUnifiedCardV4('フュージョニストキラー', [], {
  type:'monster', priority:1,
  continuous:{ scope:'allMonsters', from:['mz'],
    apply(card, self){
      if(!card || card===self || card.face!=='up' || self.face!=='up') return null;
      const d = dbOf(card); if(!d || (d.st||[]).indexOf('融合')<0) return null;
      return u352Fought(card, self) ? {setFinalAtk:0} : null;
    } }
});

/* ---- マックス・ウォリアー ---- */
function u352MaxShrunk(card){ return card && card.u352MaxUntil!=null && Number(gameState.turn) < Number(card.u352MaxUntil); }
defineUnifiedCardV4('マックス・ウォリアー', [{
  key:'shrink', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return gearKilledFoeS03(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const mine = gameState.activePlayer===me.p;
    API.setCardFlag(me, 'u352MaxUntil', Number(gameState.turn) + (mine ? 2 : 1), 'マックス・ウォリアー', {silent:true});
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, dsTiming:'leave',
  passive:{ onDamageStep(ctx){ return gearKilledFoeS03(ctx); } },
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self || self.face!=='up') return null;
      const o = {};
      if(u352MaxShrunk(self)){ o.setBaseAtk = Math.floor((Number(dbOf(self).atk)||0)/2); o.setBaseDef = Math.floor((Number(dbOf(self).def)||0)/2); }
      const b = gameState.battle;
      if(b && b.target!=='direct' && (gameState.players[b.player].mz||[])[b.atkIdx]===self) o.atk = 400;
      return Object.keys(o).length ? o : null;
    },
    setLevel(card, self){ return (card===self && u352MaxShrunk(self)) ? 2 : null; } }
});

/* ---- メンタルプロテクター ---- */
function u352MentalMine(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
defineUnifiedCardV4('メンタルプロテクター', [{
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u352MentalMine(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    if(API.me(ctx).lp>=500){ API.payCost(ctx.player, 500); return; }
    API.destroy(me, 'メンタルプロテクター');
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onStandbyPhase(ctx){ return u352MentalMine(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(card, self){
      if(!card || !self || self.face!=='up' || card.face!=='up') return false;
      if(currentRaceV17(card)==='サイキック') return false;
      return curATK(card)<=2000;
    } }
});

/* ---- マジシャンズ・エイプ ---- */
function u352ApeFoes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='def'}); }
function u352ApeHand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m'); }
defineUnifiedCardV4('マジシャンズ・エイプ', [{
  key:'steal', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.card.pos!=='atk'){ ctx.reason = '表側攻撃表示の時に発動できます'; return false; }
    if(!u352ApeHand(ctx).length){ ctx.reason = '手札にモンスターがいません'; return false; }
    if(!u352ApeFoes(ctx).length){ ctx.reason = '相手フィールドに表側守備表示のモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('マジシャンズ・エイプ：墓地へ送る手札のモンスター', u352ApeHand(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'マジシャンズ・エイプ（コスト）', {byEffect:false}); done(true);
    });
  },
  target(ctx, done){ API.selectCard('マジシャンズ・エイプ：コントロールを得る表側守備表示のモンスター', u352ApeFoes(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent || r.card.face!=='up' || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    API.changeControl(r, ctx.player, 'マジシャンズ・エイプ', 'endPhase');
    const h = findCardByUid(uid); if(h && h.zone==='mz') API.setCardFlag(h, 'u352ApeTurn', gameState.turn, 'マジシャンズ・エイプ', {silent:true});
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'], cannotSpecialSummon:true,
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; }, cannotChangePosition(card){ return !!card && Number(card.u352ApeTurn)===Number(gameState.turn); } }
});
