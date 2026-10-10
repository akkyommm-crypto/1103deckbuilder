/* S03-U256: LV monsters 3 (2011 texts) — ミスティック・ソードマン LV4 / LV6, サイレント・マジシャン LV4, 進化する翼, ハネクリボー LV10.
   Engine (this unit): FX_TO_GRAVE deckTopInsteadS03 (engine/00) — 「破壊したモンスターを墓地へ送らず、相手のデッキの一番上に置く」.
   Reuses: the LV-up helpers of S03-U251 (lvUpTargetsS03 / lvUpCostS03 / lvUpResolveS03 with summonSrcS03), the destroy-before-damage of
   ミスティック・ソードマン LV2 (a3IsAttacker / a3AttackTarget / a3DestroyBeforeDamage, cards/A3 + B4), System v23 normal summon methods,
   the 「…の効果でのみ特殊召喚」 condition (engine/1ZK, S03-U251), counters (engine/1L counterMaxV22). */

/* ===================== ミスティック・ソードマン ===================== */
/* 「このカードを通常召喚する場合、裏側守備表示でしか出せない」 — the only Normal Summon method is a Set (System v23 methods, modes ['set']) */
function mysticSetOnlyS03(tributes){
  return {includeStandard:false, methods:[{id:'setOnly', tributes, modes:['set'],
    setLabel: tributes ? `${tributes}体リリースしてセット` : 'セット'}]};
}
/* 「裏側守備表示のモンスターを攻撃した場合、ダメージ計算を行わず裏側守備表示のままそのモンスターを破壊する」 (as LV2: start of the Damage Step) */
function mysticFaceDownTargetS03(ctx){
  if(!a3IsAttacker(ctx)) return null;
  const t = a3AttackTarget();
  return (t && t.face==='down' && t.pos==='def') ? t : null;
}
/* 「このカードがモンスターを戦闘によって破壊したターン」: a battle kill (engine battleKillTurnS03) or a face-down kill by the effect above (mysticKillTurnS03, as LV2) */
function mysticKilledThisTurnS03(card){
  return !!card && (Number(card.battleKillTurnS03 || -1)===gameState.turn || Number(card.mysticKillTurnS03 || -1)===gameState.turn);
}
function mysticLv4ArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  return !!me && gameState.phase==='end' && mysticKilledThisTurnS03(me.card);
}
/* LV4: …このカードがモンスターを戦闘によって破壊したターンのエンドフェイズ時、このカードを墓地に送る事で「ミスティック・ソードマン LV6」1体を手札またはデッキから特殊召喚する。 */
defineScript('ミスティック・ソードマン LV4', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'start',
  normalSummonProcedure:mysticSetOnlyS03(0),
  condition(ctx){
    if(mysticLv4ArmedS03(ctx)){
      if(!lvUpTargetsS03(ctx.player, 'ミスティック・ソードマン LV6').length){ ctx.reason = '「ミスティック・ソードマン LV6」が手札・デッキにいません'; return false; }
      return true;
    }
    if(!mysticFaceDownTargetS03(ctx)){ ctx.reason = '裏側守備表示のモンスターを攻撃した場合に適用します'; return false; }
    return true;
  },
  cost(ctx, done){ if(mysticLv4ArmedS03(ctx)) lvUpCostS03(ctx, done, 'ミスティック・ソードマン LV4'); else done(true); },
  resolve(ctx){
    if(gameState.phase==='end'){ lvUpResolveS03(ctx, 'ミスティック・ソードマン LV6', 'ミスティック・ソードマン LV4'); return; }
    const me = locateCardAnyV4(ctx.card), t = mysticFaceDownTargetS03(ctx);
    if(!me || me.zone!=='mz' || !t) return;
    a3DestroyBeforeDamage(t, 'ミスティック・ソードマン LV4');
    API.setCardFlag(me, 'mysticKillTurnS03', gameState.turn, 'ミスティック・ソードマン LV4');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return !!mysticFaceDownTargetS03(ctx); },
    onEndPhase(ctx){ return mysticLv4ArmedS03(ctx) && lvUpTargetsS03(ctx.player, 'ミスティック・ソードマン LV6').length > 0; }
  }
});
/* LV6: …裏側守備表示のまま破壊する。この効果で破壊したモンスターを墓地へ送らず、相手のデッキの一番上に置く事ができる。 */
registerChoiceHandlerV49('s03u256.mystic6-top', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const key = (answer.keys && answer.keys[0]) || 'grave';
  const h = args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='mz' || h.card.face!=='down') return;
  const fx = {type:'FX_TO_GRAVE', player:h.p, zone:'mz', index:h.index, reason:'ミスティック・ソードマン LV6', byDestroy:true, byPlayer:args.player};
  if(key==='top') fx.deckTopInsteadS03 = true;
  act(fx);
  if(typeof endBattle==='function') endBattle();
});
defineScript('ミスティック・ソードマン LV6', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'start',
  normalSummonProcedure:mysticSetOnlyS03(1),
  condition(ctx){ if(!mysticFaceDownTargetS03(ctx)){ ctx.reason = '裏側守備表示のモンスターを攻撃した場合に適用します'; return false; } return true; },
  resolve(ctx){
    const t = mysticFaceDownTargetS03(ctx), h = t && locateCardAnyV4(t);
    if(!h || h.zone!=='mz') return;
    API.requestChoice({player:ctx.player, kind:'option', cancelable:false, min:1, max:1, title:'ミスティック・ソードマン LV6：破壊したモンスター',
      candidates:[{key:'top', value:'top', label:'墓地へ送らず、相手のデッキの一番上に置く'}, {key:'grave', value:'grave', label:'墓地へ送る'}],
      resume:{handler:'s03u256.mystic6-top', args:{player:ctx.player, uid:ensureCardUid(gameState, h.card)}}, meta:{scriptName:'ミスティック・ソードマン LV6'}});
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!mysticFaceDownTargetS03(ctx); } }
});

/* ===================== サイレント・マジシャン LV4 ===================== */
/* ①: 相手がカードをドローする度に、このカードに魔力カウンターを1つ置く（最大5つまで）。 (one per card drawn — onDrawCard; forced, like the other 「…する度に」 cards)
   ②: このカードの攻撃力は、このカードの魔力カウンターの数×500アップする。
   ③: 5つ目の魔力カウンターが置かれた次の自分ターンのスタンバイフェイズに、魔力カウンターが5つ置かれているこのカードを墓地へ送って発動できる。
       手札・デッキから「サイレント・マジシャン LV8」1体を特殊召喚する。 */
function silentMagCountersS03(card){ return (card && card.counters && Number(card.counters['魔力'])) || 0; }
function silentMagLvUpArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  if(!me || gameState.phase!=='standby' || gameState.activePlayer!==me.p || silentMagCountersS03(me.card) < 5) return false;
  const t = Number(me.card.silentMagFifthTurnS03 || -1);
  return t > 0 && t < gameState.turn && gameState.turn <= t + 2;   // the next own turn
}
defineUnifiedCardV4('サイレント・マジシャン LV4', [{
  key:'counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDrawCard'], forced:true,
  condition(ctx){
    const me = lvFaceUpMzS03(ctx);
    return !!me && !!ctx.event && ctx.event.player===ctx.opponent && silentMagCountersS03(me.card) < 5;
  },
  operation(ctx){
    const me = lvFaceUpMzS03(ctx); if(!me || silentMagCountersS03(me.card) >= 5) return;
    API.addCounter(me, '魔力', 1);
    const me2 = lvFaceUpMzS03(ctx);
    if(me2 && silentMagCountersS03(me2.card) >= 5) API.setCardFlag(me2, 'silentMagFifthTurnS03', gameState.turn, 'サイレント・マジシャン LV4');
  },
  afterResolve(){}
}, {
  key:'lvup', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'],
  condition(ctx){
    if(!silentMagLvUpArmedS03(ctx)){ ctx.reason = '5つ目の魔力カウンターが置かれた次の自分スタンバイフェイズに発動できます'; return false; }
    if(!lvUpTargetsS03(ctx.player, 'サイレント・マジシャン LV8').length){ ctx.reason = '「サイレント・マジシャン LV8」が手札・デッキにいません'; return false; }
    return true;
  },
  cost(ctx, done){ lvUpCostS03(ctx, done, 'サイレント・マジシャン LV4'); },
  operation(ctx){ lvUpResolveS03(ctx, 'サイレント・マジシャン LV8', 'サイレント・マジシャン LV4'); },
  afterResolve(){}
}], {type:'monster', priority:1, counterMaxV22:{'魔力':5},
    passive:{
      onDrawCard(ctx){ const me = lvFaceUpMzS03(ctx); return !!me && !!ctx.event && ctx.event.player===ctx.opponent && silentMagCountersS03(me.card) < 5; },
      onStandbyPhase(ctx){ return silentMagLvUpArmedS03(ctx) && lvUpTargetsS03(ctx.player, 'サイレント・マジシャン LV8').length > 0; }
    },
    continuous:{scope:'self', from:['mz'], apply(card, self){ return (card===self && self.face==='up') ? {atk:500 * silentMagCountersS03(self)} : null; }}});

/* ===================== ハネクリボー ===================== */
/* 進化する翼 (Quick-Play Spell): 自分フィールド上に存在する「ハネクリボー」1体と手札2枚を墓地に送る（cost）。「ハネクリボー LV10」1体を手札またはデッキから特殊召喚する。 */
function wingedKuribohOnFieldS03(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='ハネクリボー'}); }
function evolvingWingsHandS03(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card); }
defineScript('進化する翼', {
  type:'spell', priority:2,
  condition(ctx){
    if(!wingedKuribohOnFieldS03(ctx.player).length){ ctx.reason = '自分フィールドに「ハネクリボー」が必要です'; return false; }
    if(evolvingWingsHandS03(ctx).length < 2){ ctx.reason = '手札が2枚必要です'; return false; }
    if(!lvUpTargetsS03(ctx.player, 'ハネクリボー LV10').length){ ctx.reason = '「ハネクリボー LV10」が手札・デッキにいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('進化する翼：墓地へ送る「ハネクリボー」', wingedKuribohOnFieldS03(ctx.player), t=>{
      const k = t && resolveTarget(t), ku = k && k.card && k.card.uid;
      if(ku==null){ done(false); return; }
      const first = [];
      const pickHand = ()=>{
        const pool = evolvingWingsHandS03(ctx).filter(x=>first.indexOf(x.card.uid)<0 && !(lvUpTargetsS03(ctx.player,'ハネクリボー LV10').length===1 && API.pileCards(ctx.player,'deck',y=>y.db.n==='ハネクリボー LV10').length===0 && x.db.n==='ハネクリボー LV10'));
        if(first.length >= 2 || !pool.length){
          if(first.length < 2){ done(false); return; }
          const hk = findCardByUid(ku); if(!hk || hk.zone!=='mz'){ done(false); return; }
          API.sendToGrave(hk, '進化する翼（コスト）');
          first.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='hand') API.sendHandToGrave(ctx.player, h.index, '進化する翼（コスト）'); });
          done(true); return;
        }
        API.selectCard(`進化する翼：墓地へ送る手札（${first.length+1}/2）`, pool, x=>{ const h = x && locateCardAnyV4(x.card || x); if(h) first.push(h.card.uid); pickHand(); });
      };
      pickHand();
    });
  },
  resolve(ctx){ lvUpResolveS03(ctx, 'ハネクリボー LV10', '進化する翼'); },
  afterResolve(){}
});
/* ハネクリボー LV10: 通常召喚できない。「進化する翼」の効果でのみ特殊召喚する事ができる（engine/1ZK）。
   自分フィールド上に表側表示で存在するこのカードを生け贄に捧げる事で、相手フィールド上の攻撃表示モンスターを全て破壊し、破壊したモンスターの元々の攻撃力の合計分の
   ダメージを相手ライフに与える。この効果は相手バトルフェイズ中のみ発動する事ができる。 (quick effect; the damage counts the monsters actually destroyed) */
function kuribohLv10TargetsS03(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}); }
defineScript('ハネクリボー LV10', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'],
  condition(ctx){
    if(!lvFaceUpMzS03(ctx)){ ctx.reason = '自分フィールドに表側表示で存在する必要があります'; return false; }
    if(gameState.phase!=='battle' || gameState.activePlayer!==ctx.opponent){ ctx.reason = '相手バトルフェイズ中のみ発動できます'; return false; }
    if(!kuribohLv10TargetsS03(ctx.opponent).length){ ctx.reason = '相手フィールドに攻撃表示モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = lvFaceUpMzS03(ctx); if(!me){ done(false); return; }
    API.sendToGrave(me, 'ハネクリボー LV10（リリース）'); done(true);
  },
  resolve(ctx){
    const list = kuribohLv10TargetsS03(ctx.opponent).map(x=>({uid:x.card.uid, atk:Number(dbOf(x.card).atk) > 0 ? Number(dbOf(x.card).atk) : 0}));
    list.forEach(x=>{ const h = findCardByUid(x.uid); if(h && h.zone==='mz') API.destroy(h, 'ハネクリボー LV10', ctx.player); });
    const total = list.filter(x=>{ const h = findCardByUid(x.uid); return !h || h.zone!=='mz'; }).reduce((s,x)=>s + x.atk, 0);
    if(total > 0) API.damageLP(ctx.opponent, total, 'ハネクリボー LV10');
  },
  afterResolve(){}
});
