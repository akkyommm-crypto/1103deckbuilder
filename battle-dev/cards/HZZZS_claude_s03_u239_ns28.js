/* S03-U239: NOT_STARTED cards (2011 texts) — マジカル・コンダクター, エクスプローシブ・マジシャン, 魔法族の結界, デモニック・モーター・Ω, レスキューロイド, レプティレス・スポーン.
   Spell Counters: kind '魔力' (v12 helpers, cards/97). The chosen number / the draw count are recorded with API.recordActivationCost (journaled). */

const COUNTER_S03U239 = '魔力';
function spellcasterDbS03U239(db){ return !!db && db.k==='m' && db.ra==='魔法使い'; }

/* ---- マジカル・コンダクター: ①このカードがモンスターゾーンに存在する限り、自分または相手が魔法カードを発動する度に、このカードに魔力カウンターを2つ置く。
   ②1ターンに1度、このカードの魔力カウンターを任意の数だけ取り除いて発動できる。取り除いた数と同じレベルの魔法使い族モンスター1体を、自分の手札・墓地から選んで特殊召喚する。
   (the number is chosen as the cost; the pool is built at resolution from the recorded number) ---- */
function conductorAnyS03U239(p){
  const hit = x=>spellcasterDbS03U239(x.db) && canEffectSpecialSummonS03(x.card, x.zone, 'マジカル・コンダクター');
  return [].concat(API.pileCards(p,'hand',hit), API.pileCards(p,'grave',hit));
}
function conductorPoolS03U239(p, lv){
  const hit = x=>spellcasterDbS03U239(x.db) && Number(x.db.lv)===lv && canEffectSpecialSummonS03(x.card, x.zone, 'マジカル・コンダクター');
  return [].concat(API.pileCards(p,'hand',hit), API.pileCards(p,'grave',hit));
}
API.registerChoiceHandler('s03u239.conductor-summon', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(!h || h.p!==args.player || ['hand','grave'].indexOf(h.zone)<0 || !hasMonsterZoneSpace(args.player)) return;
  if(!spellcasterDbS03U239(dbOf(h.card)) || Number(dbOf(h.card).lv)!==Number(args.lv)) return;
  API.specialSummon(args.player, h.zone, h.index, 'atk', 'マジカル・コンダクター');
});
defineUnifiedCardV4('マジカル・コンダクター', [{
  key:'spell-activated-two-counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && v12SpellBy(ctx,'any'); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.addCounter(h, COUNTER_S03U239, 2); },
  afterResolve(){}
},{
  key:'remove-counters-summon', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(v12SpellCounters(ctx.card)<1){ ctx.reason = '魔力カウンターが乗っていません'; return false; }
    if(!conductorAnyS03U239(ctx.player).length){ ctx.reason = '手札・墓地に特殊召喚できる魔法使い族モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    const h0 = locateCardAnyV4(ctx.card);
    const max = h0 && h0.zone==='mz' ? Math.min(12, API.countCounter(h0, COUNTER_S03U239)) : 0;
    if(!max){ done(false); return; }
    const cands = []; for(let k=1;k<=max;k++) cands.push({key:String(k), label:k+'個', value:k});
    API.requestChoice({player:ctx.player, kind:'declare', title:'マジカル・コンダクター：取り除く魔力カウンターの数', candidates:cands, min:1, max:1, cancelable:true,
      legacy:{onPick:(x)=>{
        const n = Math.max(1, Math.min(max, Number(x && x.value)||0));
        const h = locateCardAnyV4(ctx.card);
        if(!h || h.zone!=='mz' || API.countCounter(h, COUNTER_S03U239)<n){ done(false); return; }
        API.recordActivationCost(ctx, 'conductorLvS03U239', [], [], n);
        API.removeCounter(h, COUNTER_S03U239, n); done(true);
      }, onCancel:()=>done(false)}});
  },
  operation(ctx){
    const c = API.activationCosts(ctx, 'conductorLvS03U239')[0], n = c ? Number(c.amount)||0 : 0;
    if(n<1) return;
    const pool = conductorPoolS03U239(ctx.player, n);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.log('マジカル・コンダクター：レベル'+n+'の魔法使い族モンスターを特殊召喚できない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'マジカル・コンダクター：特殊召喚するレベル'+n+'の魔法使い族（手札・墓地）', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u239.conductor-summon', args:{player:ctx.player, lv:n}}, meta:{scriptName:'マジカル・コンダクター'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['remove-counters-summon']}, includesSpecialSummon:true,
     blocksIfNoSpecialSummon:ctx=>ctx.eventName!=='onActivateSuccess',
     passive:{ onActivateSuccess:ctx=>ctx.zone==='mz' && ctx.card.face==='up' && v12SpellBy(ctx,'any') }});

/* ---- エクスプローシブ・マジシャン (Synchro): このカードがフィールド上に表側表示で存在する場合、自分フィールド上の魔力カウンターを2つ取り除いて発動できる。
   相手フィールド上の魔法・罠カード1枚を選択して破壊する。 (no once-per-turn limit; the 2 counters may come from several cards on the field) ---- */
function explosiveHoldersS03U239(p){ return API.fieldCards({player:p, filter:x=>API.countCounter(x, COUNTER_S03U239)>0}); }
function explosiveTotalS03U239(p){ return explosiveHoldersS03U239(p).reduce((s,x)=>s+API.countCounter(x, COUNTER_S03U239), 0); }
function explosiveTargetsS03U239(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>(x.zone==='sz' || x.zone==='field') && (x.db.k==='s' || x.db.k==='t')}); }
function explosivePayS03U239(ctx, done){
  let left = 2;
  const step = ()=>{
    if(left<=0){ done(true); return; }
    const hs = explosiveHoldersS03U239(ctx.player);
    if(!hs.length){ done(false); return; }
    const take = (x, k)=>{ const r = locateCardAnyV4(x.card); if(!r){ done(false); return; } API.removeCounter(r, COUNTER_S03U239, k); left -= k; step(); };
    if(hs.length===1){ take(hs[0], Math.min(left, API.countCounter(hs[0], COUNTER_S03U239))); return; }
    API.selectCard('エクスプローシブ・マジシャン：魔力カウンターを1つ取り除くカード（あと'+left+'個）', hs, t=>{
      const r = resolveTarget(t), x = r && hs.find(y=>y.card===r.card);
      if(!x){ done(false); return; }
      take(x, 1);
    });
  };
  step();
}
defineUnifiedCardV4('エクスプローシブ・マジシャン', [{
  key:'remove-two-destroy-st', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.SZONE, targetSide:'opponent', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(explosiveTotalS03U239(ctx.player)<2){ ctx.reason = '自分フィールド上の魔力カウンターが2つありません'; return false; }
    if(!explosiveTargetsS03U239(ctx).length){ ctx.reason = '相手フィールド上に魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ explosivePayS03U239(ctx, done); },
  target(ctx, done){ API.selectCard('エクスプローシブ・マジシャン：破壊する相手の魔法・罠カード', explosiveTargetsS03U239(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.p!==ctx.opponent || (r.zone!=='sz' && r.zone!=='field')){ API.log('エクスプローシブ・マジシャン：対象が場にないため不発'); return; }
    API.destroy(r, 'エクスプローシブ・マジシャン');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], targets:true});

/* ---- 魔法族の結界 (Continuous Spell): ①フィールド上の表側表示の魔法使い族モンスターが破壊される度にこのカードに魔力カウンターを1つ置く(最大4つまで)。
   ②このカードと自分フィールド上の表側表示の魔法使い族モンスター1体を墓地へ送って発動できる。このカードに置かれていた魔力カウンターの数だけ、自分のデッキからカードをドローする。
   (the card activation only places it; the destroyed Spellcaster is read from graveInfo {from:'mz', byDestroy, face:'up'}) ---- */
function kekkaiModeS03U239(ctx){ return ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending; }
function kekkaiDestroyedS03U239(ctx){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || !spellcasterDbS03U239(dbOf(h.card))) return false;
  const g = h.card.graveInfo;
  return !!(g && g.byDestroy && g.from==='mz' && g.face==='up' && Number(g.turn)===Number(gameState.turn));
}
function kekkaiCasterS03U239(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && spellcasterDbS03U239(x.db)}); }
defineUnifiedCardV4('魔法族の結界', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !kekkaiModeS03U239(ctx); },
  operation(){},
  afterResolve(){}
},{
  key:'spellcaster-destroyed-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDestroy'], forced:true,
  condition(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && kekkaiDestroyedS03U239(ctx) && v12SpellCounters(ctx.card)<4; },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz' && API.countCounter(h, COUNTER_S03U239)<4) API.addCounter(h, COUNTER_S03U239, 1); },
  afterResolve(){}
},{
  key:'send-draw', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!kekkaiModeS03U239(ctx)){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(v12SpellCounters(ctx.card)<1){ ctx.reason = '魔力カウンターが置かれていません'; return false; }
    if(!kekkaiCasterS03U239(ctx).length){ ctx.reason = '自分フィールド上に表側表示の魔法使い族モンスターがいません'; return false; }
    if(API.me(ctx).deck.length<1){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
    if(!me || me.zone!=='sz'){ done(false); return; }
    const n = API.countCounter(me, COUNTER_S03U239), su = me.card.uid;
    API.selectCard('魔法族の結界：墓地へ送る魔法使い族モンスター', kekkaiCasterS03U239(ctx), t=>{
      const r = resolveTarget(t), s = findCardByUid(su);
      if(!r || r.zone!=='mz' || !s || s.zone!=='sz'){ done(false); return; }
      API.recordActivationCost(ctx, 'kekkaiDrawS03U239', [], [], n);
      API.sendToGrave(r, '魔法族の結界（コスト）');
      const s2 = findCardByUid(su); if(s2 && s2.zone==='sz') API.sendToGrave(s2, '魔法族の結界（コスト）');
      done(true);
    });
  },
  operation(ctx){
    const c = API.activationCosts(ctx, 'kekkaiDrawS03U239')[0], n = c ? Number(c.amount)||0 : 0;
    if(n>0) API.draw(ctx.player, n, '魔法族の結界');
  },
  afterResolve(){}
}], {type:'spell', priority:1, timing:['mainPhase'], fieldIgnition:true,
     passive:{ onDestroy:ctx=>ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && kekkaiDestroyedS03U239(ctx) && v12SpellCounters(ctx.card)<4 }});

/* ---- デモニック・モーター・Ω: ①1ターンに1度、自分のメインフェイズに発動できる。このカードの攻撃力はターン終了時まで1000アップする。
   ②このカードの①の効果を発動した場合、エンドフェイズに発動する。このカードを破壊する。③自分のエンドフェイズに発動する。自分フィールド上に「モータートークン」(機械族・地・星1・攻/守200)1体を攻撃表示で特殊召喚する。
   (①'s activation is recorded in a journaled card flag {turn}; ② and ③ are forced End Phase triggers) ---- */
function motorEndS03U239(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='end'; }
function motorBoostedS03U239(ctx){ const f = ctx.card && ctx.card.motorBoostS03U239; return !!f && Number(f.turn)===Number(gameState.turn); }
defineUnifiedCardV4('デモニック・モーター・Ω', [{
  key:'atk-up', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz'){ done(false); return; }
    API.setCardFlag(h, 'motorBoostS03U239', {turn:gameState.turn}, 'デモニック・モーター・Ω', {silent:true}); done(true);
  },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up') API.modAtk(h, 1000, 0, 'endPhase', 'デモニック・モーター・Ω'); },
  afterResolve(){}
},{
  key:'end-destroy-and-token', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return motorEndS03U239(ctx) && (motorBoostedS03U239(ctx) || gameState.activePlayer===ctx.player); },
  operation(ctx){
    /* ② (only if ① was activated) and ③ (own End Phase) trigger together; one v4 effect per event/range, so both are resolved here: destroy first, then the token */
    if(motorBoostedS03U239(ctx)){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.destroy(h, 'デモニック・モーター・Ω'); }
    if(gameState.activePlayer===ctx.player && hasMonsterZoneSpace(ctx.player))
      API.createToken(ctx.player, {name:'モータートークン', atk:200, def:200, lv:1, ra:'機械', at:'地', pos:'atk'}, 1);
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['atk-up']}, includesSpecialSummon:true,
     blocksIfNoSpecialSummon:ctx=>ctx.eventName==='onEndPhase',
     passive:{ onEndPhase:ctx=>motorEndS03U239(ctx) && (motorBoostedS03U239(ctx) || (gameState.activePlayer===ctx.player && hasMonsterZoneSpace(ctx.player))) }});

/* ---- レスキューロイド: このカードが自分フィールド上に表側表示で存在する限り、自分フィールド上の「ロイド」と名のついたモンスターが戦闘によって破壊され墓地へ送られた時、
   そのモンスターを手札に戻す事ができる。 (optional) ---- */
function loidDestroyedS03U239(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return null;
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.zone!=='grave' || h.p!==ctx.player || h.card===ctx.card) return null;
  const db = dbOf(h.card), g = h.card.graveInfo;
  if(!db || db.k!=='m' || !isCardInGroupV4(db, GROUP.ROID)) return null;   /* parent review: the 「ロイド」 group (setcode overlay), not a name substring */
  return (g && g.byDestroy && g.battle && g.from==='mz' && Number(g.turn)===Number(gameState.turn)) ? h : null;
}
defineUnifiedCardV4('レスキューロイド', [{
  key:'loid-battle-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDestroy'],
  condition(ctx){ return !!loidDestroyedS03U239(ctx); },
  operation(ctx){
    const h = loidDestroyedS03U239(ctx) || (function(){ const e = ctx.event || {}; const x = e.uid!=null ? findCardByUid(e.uid) : null; return (x && x.zone==='grave' && x.p===ctx.player) ? x : null; })();
    if(h && h.zone==='grave') API.returnToHand(h, 'レスキューロイド');
  },
  afterResolve(){}
}], {type:'monster', priority:1, dsTiming:'leave',
     passive:{ onBattleDestroy:ctx=>!!loidDestroyedS03U239(ctx) }});

/* ---- レプティレス・スポーン (Normal Spell): 自分の墓地に存在する「レプティレス」と名のついたモンスター1体をゲームから除外して発動できる。
   自分フィールド上に「レプティレストークン」(爬虫類族・地・星1・攻/守0)2体を特殊召喚する。 (cost: the banish; both tokens need a free zone; Defense Position) ---- */
function spawnGraveS03U239(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && isCardInGroupV4(x.db, GROUP.REPTILIANNE)); }
function freeZonesS03U239(p){ return ZONE_LIMITS.mz - (gameState.players[p].mz||[]).length; }
defineScript('レプティレス・スポーン', {
  type:'spell', priority:1, timing:['mainPhase'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!spawnGraveS03U239(ctx).length){ ctx.reason = '墓地に「レプティレス」モンスターがいません'; return false; }
    if(freeZonesS03U239(ctx.player)<2){ ctx.reason = 'モンスターゾーンが2つ空いていません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('レプティレス・スポーン：除外する墓地の「レプティレス」', spawnGraveS03U239(ctx), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
      API.banish(r, 'レプティレス・スポーン（コスト）'); done(true);
    });
  },
  resolve(ctx){
    if(freeZonesS03U239(ctx.player)<2){ API.log('レプティレス・スポーン：モンスターゾーンが足りない'); return; }
    API.createToken(ctx.player, {name:'レプティレストークン', atk:0, def:0, lv:1, ra:'爬虫類', at:'地', pos:'def'}, 2);
  },
  afterResolve(){}
});
