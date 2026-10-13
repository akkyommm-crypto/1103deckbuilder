/* S03-U316: 「エーリアン」 monsters with the A Counter penalty (carddata texts): エーリアン・ウォリアー, エーリアン・グレイ, エーリアン・テレパス, エーリアン・キッズ.

   Common clause (ウォリアー / グレイ / テレパス): このカードがフィールド上に表側表示で存在する限り、Aカウンターが乗ったモンスターは、「エーリアン」と名のついたモンスターと戦闘を行う場合、
     ダメージ計算時のみAカウンター1つにつき攻撃力・守備力が300ポイントダウンする。   (キッズ: 「…戦闘する場合、Aカウンター1つにつき攻撃力と守備力が300ポイントダウンする」)
   ウォリアー  このカードが戦闘によって破壊され墓地へ送られた時、このカードを破壊したモンスターにAカウンターを2つ置く。
   グレイ      リバース:相手フィールド上に表側表示で存在するモンスター1体を選択し、Aカウンターを1つ置く。また、リバースしたこのカードが戦闘によって破壊され墓地へ送られた時、デッキからカードを1枚ドローする。
   テレパス    1ターンに1度、相手フィールド上のモンスターに乗っているAカウンターを1つ取り除いて発動できる。フィールド上の魔法・罠カード1枚を選択して破壊する。
   キッズ      このカードが自分フィールド上に表側表示で存在する限り、相手フィールド上にモンスターが特殊召喚される度に、その時に特殊召喚されたモンスターにAカウンターを1つ置く。

   Notes
   - 「エーリアン」と名のついた = P4 GROUP.ALIEN (names containing エーリアン, P4-v11); the setcode 0x102e is a larger set (宇宙獣ガンギル, 円盤ムスキー …) and is NOT used.
   - The penalty is a continuous modifier of the Alien card: a monster with A Counters that is in the battle whose other battler is an 「エーリアン」, while the Damage Step is open (a5InDamageStep); the
     キッズ wording has no 「ダメージ計算時のみ」, applied here from the start of the battle (the same window; the difference is only visible to effects activated inside the Damage Step). Every face-up copy of
     these cards applies its own penalty (they add up, as separate effects).
   - A Counters are placed with API.addCounter (the 1103 rule: the text of the placing card lets it put them on any monster; エーリアン cards do so on face-up monsters).
   - グレイ: 「リバースしたこのカード」 = the card flag aliGrayFlippedS03 set by its own Flip trigger; a Gray that was Normal / Special Summoned face-up and is then destroyed in battle draws nothing.
   - Left for a later unit: エーリアン・リベンジャー (「自分フィールド上に1体しか表側表示で存在できない」 — the engine's uniqueness rule is field-wide), 宇宙獣ガンギル (the one-Tribute Summon rule),
     エーリアン・スカル (procedure onto the opponent's field), エーリアン・ヒュプノ / 洗脳光線 (control for as long as counters remain), エーリアン・マザー / ブレイン / 宇宙砦ゴルガー. */

function alienCountersS03(card){ return (card && card.counters && Number(card.counters['A'])) || 0; }
function alienPenaltyS03(target, self, damageCalcOnly){
  const n = alienCountersS03(target);
  if(!n || !target || target.face!=='up') return null;
  if(!gameState.battle) return null;
  if(damageCalcOnly && !a5InDamageStep()) return null;
  const other = a5BattleOtherOf(target);
  if(!other || !isCardInGroupV4(other, GROUP.ALIEN)) return null;
  return {atk:-300*n, def:-300*n};
}
function alienContinuousS03(damageCalcOnly, extra){
  return Object.assign({ scope:'allMonsters', from:['mz'], apply(target, self){ return alienPenaltyS03(target, self, damageCalcOnly); } }, extra||{});
}
function alienFoeMonstersS03(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }

/* ---- エーリアン・ウォリアー: destroyed by battle and sent to the Graveyard → 2 A Counters on the monster that destroyed it ---- */
function alienDestroyerS03(ctx){
  /* the monster that destroyed this card in the battle just fought (gameState.lastBattle records both battlers) */
  const lb = gameState.lastBattle, uid = ctx.card && ctx.card.uid;
  if(!lb || uid==null) return null;
  const other = lb.attackerUidV6===uid ? lb.defenderUidV6 : (lb.defenderUidV6===uid ? lb.attackerUidV6 : null);
  const h = other!=null ? findCardByUid(other) : null;
  return (h && h.zone==='mz' && h.card.face==='up') ? h : null;
}
defineUnifiedCardV4('エーリアン・ウォリアー', [{
  key:'destroyed-counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattleDestroy'], forced:true,
  condition(ctx){ return ctx.zone==='grave' && (typeof eventIsSelfS03!=='function' || eventIsSelfS03(ctx)) && !!alienDestroyerS03(ctx); },
  operation(ctx){ const h = alienDestroyerS03(ctx); if(h) API.addCounter(h, 'A', 2); },
  afterResolve(){}
}], {type:'monster', priority:1, activateFrom:['grave'], timing:['free'],
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='grave' && (typeof eventIsSelfS03!=='function' || eventIsSelfS03(ctx)) && !!alienDestroyerS03(ctx); } },
  continuous:alienContinuousS03(true)});

/* ---- エーリアン・グレイ: Flip → 1 A Counter; once flipped and destroyed in battle → draw 1 ---- */
function alienGrayDrawS03(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && (typeof eventIsSelfS03!=='function' || eventIsSelfS03(ctx)) && ctx.card.aliGrayFlippedS03===true && !!g && g.face==='up';
}
defineUnifiedCardV4('エーリアン・グレイ', [{
  key:'flip-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true, targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return ctx.zone==='mz' && (typeof eventIsSelfS03!=='function' || eventIsSelfS03(ctx)) && alienFoeMonstersS03(ctx).length>0; },
  target(ctx, done){ API.selectCard('エーリアン・グレイ：Aカウンターを置くモンスター', alienFoeMonstersS03(ctx), t=>done([t])); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(me) API.setCardFlag(me, 'aliGrayFlippedS03', true, 'エーリアン・グレイ', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up') API.addCounter(r, 'A', 1);
  },
  afterResolve(){}
}, {
  key:'flipped-destroyed-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattleDestroy'], forced:true,
  condition(ctx){ return alienGrayDrawS03(ctx) && (API.me(ctx).deck||[]).length>0; },
  operation(ctx){ API.draw(ctx.player, 1, 'エーリアン・グレイ'); },
  afterResolve(){}
}], {type:'monster', priority:1, activateFrom:['grave'], timing:['free'], targets:true,
  passive:{ onBattleDestroy(ctx){ return alienGrayDrawS03(ctx); } },
  continuous:alienContinuousS03(true)});

/* ---- エーリアン・テレパス: once per turn, remove 1 A Counter from an opponent monster → destroy 1 Spell / Trap card on the field ---- */
function alienTelepathCountersS03(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>alienCountersS03(x.card)>0}); }
function alienStFieldS03(ctx){ return API.fieldCards({}).filter(x=>(x.zone==='sz' || x.zone==='field')); }
defineUnifiedCardV4('エーリアン・テレパス', [{
  key:'counter-destroy-st', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.ONFIELD, targetSide:'both',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(Number(ctx.card.aliTelepathTurnS03)===gameState.turn){ ctx.reason = '1ターンに1度です'; return false; }
    if(!alienTelepathCountersS03(ctx).length){ ctx.reason = '相手フィールド上のモンスターにAカウンターが乗っていません'; return false; }
    if(!alienStFieldS03(ctx).length){ ctx.reason = 'フィールド上に魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const c = alienTelepathCountersS03(ctx);
    const go = t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='mz' || !me || alienCountersS03(r.card)<1){ done(false); return; }
      API.setCardFlag(me, 'aliTelepathTurnS03', gameState.turn, 'エーリアン・テレパス', {silent:true});
      API.removeCounter(r, 'A', 1); done(true);
    };
    if(c.length===1){ go(c[0]); return; }
    API.selectCard('エーリアン・テレパス：Aカウンターを取り除くモンスター', c, go);
  },
  target(ctx, done){ API.selectCard('エーリアン・テレパス：破壊する魔法・罠カード', alienStFieldS03(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && (r.zone==='sz' || r.zone==='field')) API.destroy(r, 'エーリアン・テレパス');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, continuous:alienContinuousS03(true)});

/* ---- エーリアン・キッズ: every monster Special Summoned on the opponent's field gets 1 A Counter; the penalty (no 「ダメージ計算時のみ」) ---- */
function alienKidsSummonedS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up') return null;
  const h = e.card ? locateCardAnyV4(e.card) : (e.uid!=null ? findCardByUid(e.uid) : null);
  return (h && h.zone==='mz' && h.p===ctx.opponent && h.card.face==='up') ? h : null;   /* the field it was summoned onto, whoever summoned it */
}
defineUnifiedCardV4('エーリアン・キッズ', [{
  key:'foe-special-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return !!alienKidsSummonedS03(ctx); },
  operation(ctx){ const h = alienKidsSummonedS03(ctx); if(h) API.addCounter(h, 'A', 1); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], onOtherSummon:true,   /* reacts to other monsters being summoned (engine/40 summonTriggerApplies) */
  passive:{ onSpecialSummon(ctx){ return !!alienKidsSummonedS03(ctx); } },
  continuous:alienContinuousS03(false)});
