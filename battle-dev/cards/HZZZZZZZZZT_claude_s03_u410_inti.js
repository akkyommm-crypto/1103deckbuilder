/* S03-U410: 太陽龍インティ, 月影龍クイラ, スピード・キング☆スカル・フレイム (NOT_STARTED cards, carddata texts).

   太陽龍インティ  ①:このカードが戦闘で破壊され墓地へ送られた場合に発動する。このカードを破壊したモンスターを破壊し、その攻撃力の半分のダメージを相手に与える。②:フィールドのこのカードが破壊された次のターンのスタンバイフェイズに、自分の墓地の「月影龍クイラ」1体を対象として発動できる。そのモンスターを特殊召喚する。
   月影龍クイラ    ①:このカードが攻撃対象に選択された場合に発動する。攻撃モンスターの攻撃力の半分だけ自分のLPを回復する。②:フィールドのこのカードが破壊された場合、自分の墓地の「太陽龍インティ」1体を対象として発動できる。そのモンスターを特殊召喚する。
   スピード・キング☆スカル・フレイム  このカードは通常召喚できない。自分の墓地に存在する「スカル・フレイム」1体をゲームから除外した場合に特殊召喚する事ができる。1ターンに1度、自分の墓地に存在する「バーニング・スカルヘッド」の数×400ポイントダメージを相手ライフに与える事ができる。また、このカードがフィールド上から墓地へ送られた時、自分の墓地に存在する「スカル・フレイム」1体を特殊召喚する事ができる。

   Notes
   - インティ ① and ② are ONE forced Graveyard effect (a card's forced triggers on the same event are offered once per window): the battle destruction part (a3SelfBattleDestroyed / a3BattleOther as 黄泉へ渡る船) destroys the destroyer and deals half its ATK; the second part (destroyed on the field by any cause) schedules the Standby Phase of the next turn, whose handler Special Summons a 月影龍クイラ of my Graveyard.
   - クイラ ①: forced onAttackDeclare at itself (recoverLP half of the attacker's ATK); ② optional Graveyard trigger after a destruction on the field reviving the Inti of the Graveyard.
   - スピード・キング: cannotNormalSummon; summonProcedure from the hand with the banish of a スカル・フレイム of my Graveyard as the cost; once-per-turn ignition for 400 x the バーニング・スカルヘッド in my Graveyard; optional Graveyard trigger when sent from the field to the Graveyard: revive スカル・フレイム. */

/* ---- 太陽龍インティ ---- */
API.registerScheduleHandler('u410.inti-quila', (args)=>{
  const p = args && args.player; if(p!==0 && p!==1) return;
  const pool = API.pileCards(p, 'grave', x=>x.db.n==='月影龍クイラ' && canEffectSpecialSummonS03(x.card, 'grave', '太陽龍インティ'));
  if(!pool.length || !hasMonsterZoneSpace(p)) return;
  API.specialSummon(p, 'grave', pool[0].index, 'atk', '太陽龍インティ');
});
function u410Gone(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && ((e.uid!=null && e.uid===ctx.card.uid) || e.card===ctx.card) && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn);
}
function u410GoneInfo(card){ const g = card && card.graveInfo; return !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn); }
function u410IntiBattle(ctx){ return a3SelfBattleDestroyed(ctx) && !!a3BattleOther(ctx); }
defineUnifiedCardV4('太陽龍インティ', [{
  key:'sunfall', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDamageStep','onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u410IntiBattle(ctx) || u410Gone(ctx); },
  operation(ctx){
    if(a3SelfBattleDestroyed(ctx)){
      const o = a3BattleOther(ctx), h = o && locateCardAnyV4(o);
      if(h && h.zone==='mz'){ const half = Math.floor(Math.max(0, curATK(o))/2); API.destroy(h, '太陽龍インティ'); API.damageLP(ctx.opponent, half, '太陽龍インティ'); }
    }
    if(ctx.zone==='grave' && u410GoneInfo(ctx.card) && Number(ctx.card.u410Scheduled)!==Number(gameState.turn)){
      const me = locateCardAnyV4(ctx.card); if(me) API.setCardFlag(me, 'u410Scheduled', gameState.turn, '太陽龍インティ', {silent:true});
      const nextP = (gameState.activePlayer===ctx.player) ? ctx.opponent : ctx.player;
      API.schedule({at:'standbyPhase', turns:1, player:nextP, handler:'u410.inti-quila', args:{player:ctx.player}, note:'太陽龍インティ'});
    }
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'],
  passive:{ onDamageStep(ctx){ return u410IntiBattle(ctx); }, onSendToGrave(ctx){ return u410Gone(ctx); }, onDestroy(ctx){ return u410Gone(ctx); } } });

/* ---- 月影龍クイラ ---- */
function u410Targeted(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && ctx.card.face==='up' && !!a && a.player===ctx.opponent && a.targetUid!=null && a.targetUid===ctx.card.uid;
}
function u410Inti(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.n==='太陽龍インティ' && canEffectSpecialSummonS03(x.card, 'grave', '月影龍クイラ')); }
defineUnifiedCardV4('月影龍クイラ', [{
  key:'heal', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return u410Targeted(ctx); },
  operation(ctx){
    const a = gameState.pendingAttack, h = a && findCardByUid(a.attackerUid);
    if(h) API.recoverLP(ctx.player, Math.floor(Math.max(0, curATK(h.card))/2));
  },
  afterResolve(){}
}, {
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u410Gone(ctx) && u410Inti(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  target(ctx, done){ API.selectCard('月影龍クイラ：特殊召喚する「太陽龍インティ」', u410Inti(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '月影龍クイラ');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['free'], activateFrom:['mz','grave'],
  passive:{ onAttackDeclare(ctx){ return u410Targeted(ctx); },
    onSendToGrave(ctx){ return u410Gone(ctx) && u410Inti(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
    onDestroy(ctx){ return u410Gone(ctx) && u410Inti(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } } });

/* ---- スピード・キング☆スカル・フレイム ---- */
function u410Flames(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.n==='スカル・フレイム'); }
function u410Heads(p){ return API.pileCards(p, 'grave', x=>x.db.n==='バーニング・スカルヘッド').length; }
function u410Sent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && ((e.uid!=null && e.uid===ctx.card.uid) || e.card===ctx.card) && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
function u410SkullPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.n==='スカル・フレイム' && canEffectSpecialSummonS03(x.card, 'grave', 'スピード・キング☆スカル・フレイム')); }
defineUnifiedCardV4('スピード・キング☆スカル・フレイム', [{
  key:'burn', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u410Heads(ctx.player)){ ctx.reason = '墓地に「バーニング・スカルヘッド」がいません'; return false; }
    return true;
  },
  operation(ctx){ API.damageLP(ctx.opponent, 400*u410Heads(ctx.player), 'スピード・キング☆スカル・フレイム'); },
  afterResolve(){}
}, {
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u410Sent(ctx) && u410SkullPool(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  target(ctx, done){ API.selectCard('スピード・キング☆スカル・フレイム：特殊召喚する「スカル・フレイム」', u410SkullPool(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'スピード・キング☆スカル・フレイム');
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, countLimit:{n:1, effects:['burn']}, targets:true, timing:['free'], activateFrom:['mz','grave'],
  summonProcedure:{
    from:['hand'], positions:['atk'],
    condition(ctx){ if(!u410Flames(ctx).length){ ctx.reason = '墓地に「スカル・フレイム」がいません'; return false; } return true; },
    cost(ctx, done){
      API.selectCard('スピード・キング☆スカル・フレイム：除外する「スカル・フレイム」', u410Flames(ctx), t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
        API.banish(r, 'スピード・キング☆スカル・フレイム（特殊召喚の手順）'); done(true);
      });
    }
  },
  passive:{ onSendToGrave(ctx){ return u410Sent(ctx) && u410SkullPool(ctx).length>0 && hasMonsterZoneSpace(ctx.player); }, onDestroy(ctx){ return u410Sent(ctx) && u410SkullPool(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } } });
