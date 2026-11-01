/* S03-U457: CODEX-C03（出所を見る対象耐性）の残りの消費者 — ヴァイロン・エプシロン, ターボ・ウォリアー, 救世の儀式 (NOT_STARTED cards, carddata texts).

   ヴァイロン・エプシロン  光属性チューナー＋チューナー以外のモンスター1体以上 このカードに装備された装備カードは、カードの効果の対象にならない。また、1ターンに1度、このカードに装備された装備カード1枚を墓地へ送って発動できる。相手フィールド上のモンスター1体を選択して破壊する。
   ターボ・ウォリアー      「ターボ・シンクロン」＋チューナー以外のモンスター1体以上 レベル6以上のシンクロモンスターを攻撃対象としたこのカードの攻撃宣言時、攻撃対象モンスターの攻撃力をダメージステップ終了時まで半分にする。フィールド上のこのカードはレベル6以下の効果モンスターの効果の対象にならない。
   救世の儀式              「救世の美神ノースウェムコ」の降臨に必要。自分の手札・フィールド上から、レベルの合計が7以上になるようにモンスターをリリースしなければならない。また、自分のメインフェイズ時に墓地のこのカードをゲームから除外し、自分フィールド上の儀式モンスター1体を選択して発動できる。このターン選択した自分の儀式モンスターはカードの効果の対象にならない。

   Notes
   - NEW engine scope (engine/00 continuousReaches): continuous.scope 'equippedCards' reaches only the equip cards (Spell & Trap Zone) that are equipped to the source monster (the reverse of v15 'equippedMonster'). Consumer: エプシロン.
   - エプシロン: immuneToTarget protects the equipped cards from every card effect (either player; not a targeting-player condition). The cost (send an equipped card to the Graveyard) is NOT a target, so its choice is opened with targeting:false (P1.1 activationV11, as ドラグニティナイト－ヴァジュランダ) - otherwise the card's own targeting filter would refuse the immune equip cards - and the destruction target (an opposing monster) is chosen after the cost with targeting:true, filtered with the real effect source.
   - ターボ・ウォリアー: immuneToTarget(card, self, effectInfo) uses targetEffectMatchesS03 {cardTypes:['m'], effectMonster:true, maxLevel:6} - activation preparation, chain resolution and direct runScript all see the source. (The old text fallback of targetImmune made the card immune to EVERY effect: its text matches /このカードは…効果の対象にならない/.) 「レベル6以下」 excludes Xyz Monsters (they have no Level).
     The ATK halving is a forced trigger at the attack declaration (the declared target must be a face-up Level 6 or higher Synchro Monster): it records the amount lost (card flag u457Half on the target = {by, turn, loss}, rounded up) and the continuous apply takes it away only while that very attack (pendingAttack / battle) is in progress, i.e. until the end of the Damage Step.
   - 救世の儀式: registerRitualSpecV24 (atLeast 7) + the shared ritual pipeline; the Graveyard clause is an ignition from the Graveyard (cost: banish itself; target: a face-up Ritual Monster of mine). The banished Spell stays as a lingering source for the turn (API.lingerS03, continuous.from:['linger'], S03-U257) carrying {uid, turn} of the selected monster, which is immune to every card effect's targeting that turn. */

function u457Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
/* 対象を選ぶ効果の出所を明示して filterTargetable にかける（発動条件の判定・候補の事前絞り込み用） */
function u457Targetable(cands, player, src){
  return filterTargetable(cands, player, targetEffectSourceS03(player, src));
}

/* ---- ヴァイロン・エプシロン ---- */
function u457EquipsOf(card){
  const uid = card && card.uid;
  return uid==null ? [] : API.fieldCards({zone:'sz', filter:x=>!!x.card.equipTo && x.card.equipTo.uid===uid});
}
function u457EpsFoes(player, card){
  return u457Targetable(API.fieldCards({player:1-player, zone:'mz'}), player, {uid:card.uid, name:'ヴァイロン・エプシロン'});
}
API.registerChoiceHandler('u457.eps-cost', (answer, args)=>{
  const d = args.activation, picked = p11cCards(answer)[0], eq = picked && p11cHit(picked.uid), self = p11cHit(d.uid);
  if(answer.cancelled || !eq || !self || eq.zone!=='sz' || !eq.card.equipTo || eq.card.equipTo.uid!==self.card.uid) return p11cAbort(d);
  const foes = u457EpsFoes(d.player, self.card);
  if(!foes.length) return p11cAbort(d);
  API.recordActivationCost(p11cCtx(d.player), 'send', [eq], [], 1);
  API.sendToGrave(eq, d.name+'（コスト）');
  p11cOpen(d, {title:d.name+'：破壊する相手モンスター', candidates:foes, targeting:true}, 'p11cards.commit-targets', {mode:'destroy'});
});
defineUnifiedCardV4('ヴァイロン・エプシロン', [{
  key:'destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u457Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u457EquipsOf(ctx.card).length){ ctx.reason = 'このカードに装備された装備カードがありません'; return false; }
    if(!u457EpsFoes(ctx.player, ctx.card).length){ ctx.reason = '対象にできる相手モンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.opponent) API.destroy(r, 'ヴァイロン・エプシロン');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, destroysFieldV46:true, timing:['mainPhase'], countLimit:{n:1, effects:['destroy']},
  activationV11(ctx, d){
    p11cOpen(d, {title:d.name+'：墓地へ送る装備カード', candidates:u457EquipsOf(ctx.card), targeting:false}, 'u457.eps-cost', {});
  },
  continuous:{ scope:'equippedCards', from:['mz'], apply(){ return null; },
    immuneToTarget(card, self){ return !!self && self.face==='up' && !!card && !!card.equipTo && card.equipTo.uid===self.uid; } } });

/* ---- ターボ・ウォリアー ---- */
function u457TurboTarget(ctx){
  const a = gameState.pendingAttack;
  if(!a || a.attackerUid!==ctx.card.uid || a.targetUid==null) return null;
  const h = findCardByUid(a.targetUid);
  if(!h || h.zone!=='mz' || h.p!==ctx.opponent || h.card.face!=='up') return null;
  const db = dbOf(h.card);
  return (db.k==='m' && (db.st||[]).indexOf('シンクロ')>=0 && curLV(h.card)>=6) ? h : null;
}
function u457TurboHalved(card, self){
  const f = card && card.u457Half;
  if(!f || !self || self.face!=='up' || f.by!==self.uid || Number(f.turn)!==Number(gameState.turn)) return 0;
  const a = gameState.pendingAttack, b = gameState.battle;
  const live = (a && a.attackerUid===self.uid && a.targetUid===card.uid) || (b && b.atkUid===self.uid && b.targetUid===card.uid);
  return live ? Number(f.loss)||0 : 0;
}
defineUnifiedCardV4('ターボ・ウォリアー', [{
  key:'halve', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!u457TurboTarget(ctx); },
  operation(ctx){
    const h = u457TurboTarget(ctx); if(!h) return;
    const n = curATK(h.card), half = Math.ceil(n/2);
    API.setCardFlag(h, 'u457Half', {by:ctx.card.uid, turn:gameState.turn, loss:n-half}, 'ターボ・ウォリアー', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onAttackDeclare(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!u457TurboTarget(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'],
    apply(card, self){ const n = u457TurboHalved(card, self); return n>0 ? {atk:-n} : null; },
    immuneToTarget(card, self, effectInfo){
      if(card!==self || self.face!=='up') return false;
      const src = u378SrcOf(effectInfo);
      return !!src && targetEffectMatchesS03(src, {cardTypes:['m'], effectMonster:true, maxLevel:6}) && (src.db.st||[]).indexOf('エクシーズ')<0;
    } } });

/* ---- 救世の儀式 ---- */
registerRitualSpecV24('救世の儀式', {monsters:['救世の美神ノースウェムコ'], level:7, levelMode:'atLeast'});
function u457Rituals(player, card){
  return u457Targetable(API.fieldCards({player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('儀式')>=0}),
    player, {uid:card.uid, name:'救世の儀式'});
}
defineUnifiedCardV4('救世の儀式', [{
  key:'ritual-summon', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return API.ritualCanActivate(ctx.player, '救世の儀式'); },
  operation(ctx){ API.ritualSummon(ctx, '救世の儀式'); },
  afterResolve(){}
}, {
  key:'guard', type:EFFECT_TYPE.IGNITION, range:LOCATION.GRAVE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!u457Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u457Rituals(ctx.player, ctx.card).length){ ctx.reason = '対象にできる自分の儀式モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave'){ done(false); return; } API.banish(me, '救世の儀式（コスト）'); done(true); },
  target(ctx, done){ API.selectCard('救世の儀式：対象にならなくする自分の儀式モンスター', u457Rituals(ctx.player, ctx.card), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || r.p!==ctx.player || r.card.face!=='up' || !me) return;
    API.setCardFlag(me, 'u457Guard', {uid:r.card.uid, turn:gameState.turn}, '救世の儀式', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, '救世の儀式');
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, includesSpecialSummon:true, activateFrom:['sz','hand','grave'],
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    immuneToTarget(card, self){
      const g = self && self.u457Guard;
      return !!g && Number(g.turn)===Number(gameState.turn) && !!card && g.uid===card.uid;
    } } });
