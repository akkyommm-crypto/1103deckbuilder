/* S03-U237: NOT_STARTED cards (2011 texts) — 雲魔物－アシッド・クラウド, 雲魔物－キロスタス, 雲魔物－アルトス, 雲魔物－タービュランス, 雲魔物－ストーム・ドラゴン, 雲魔物－アイ・オブ・ザ・タイフーン.
   The 「雲魔物」 family shares one helper: 「このカードは戦闘によっては破壊されない。このカードが表側守備表示でフィールド上に存在する場合、このカードを破壊する。」
   = battleProof:true + selfDestroyWhenS03 (engine/1ZZF). Fog Counters are the kind 'フォッグ' (API.addCounter / removeCounter / counterUnits). */

const FOG_KIND_S03 = 'フォッグ';
function cloudianS03(db){ return !!db && isSetCardV4(db, SETCODE.CLOUDIAN); }
/* 「フィールド上に存在する「雲魔物」と名のついたモンスター」 — the face-up ones on both fields (a freshly summoned card is face-up, so it counts itself) */
function cloudianCountS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && cloudianS03(x.db)}).length; }
function fogOfS03(ctx){ const h = locateCardAnyV4(ctx.card); return (h && h.zone==='mz') ? API.countCounter(h, FOG_KIND_S03) : 0; }
function cloudianBaseS03(name){
  return {type:'monster', priority:1, battleProof:true,
    selfDestroyWhenS03:(card)=> (card.face==='up' && card.pos==='def') ? name+'：表側守備表示のため破壊' : false};
}
/* 「このカードの召喚に成功した時、フィールド上に存在する「雲魔物」と名のついたモンスターの数だけこのカードにフォッグカウンターを置く。」 (forced) */
function cloudianSummonFogS03(name){
  return {key:'summon-fog', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
    condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
    operation(ctx){
      const h = locateCardAnyV4(ctx.card), n = cloudianCountS03();
      if(h && h.zone==='mz' && n>0) API.addCounter(h, FOG_KIND_S03, n);
    },
    afterResolve(){}};
}
/* 「このカードに乗っているフォッグカウンターをN個取り除く事で」 (cost, from itself) */
function cloudianSelfFogCostS03(n){
  return ctx=>{
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(fogOfS03(ctx)<n){ ctx.reason = 'このカードに乗っているフォッグカウンターが'+n+'つありません'; return false; }
    return true;
  };
}
function cloudianPaySelfFogS03(n){
  return (ctx, done)=>{
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || API.countCounter(h, FOG_KIND_S03)<n){ done(false); return; }
    API.removeCounter(h, FOG_KIND_S03, n); done(true);
  };
}
function onFieldS03(h){ return !!h && ['mz','sz','field'].indexOf(h.zone)>=0; }

/* ---- 雲魔物－アシッド・クラウド: フォッグカウンターを2つ取り除く事で、フィールド上の魔法または罠カード1枚を破壊する。 ---- */
function acidPoolS03(){ return API.fieldCards({filter:x=>(x.zone==='sz' || x.zone==='field') && x.card}); }
API.registerChoiceHandler('s03u237.acid-destroy', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(h && (h.zone==='sz' || h.zone==='field')) API.destroy(h, '雲魔物－アシッド・クラウド', args.player);
});
defineUnifiedCardV4('雲魔物－アシッド・クラウド', [cloudianSummonFogS03('雲魔物－アシッド・クラウド'), {
  key:'remove-fog-destroy-st', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!cloudianSelfFogCostS03(2)(ctx)) return false;
    if(!acidPoolS03().length){ ctx.reason = 'フィールド上に魔法・罠カードがありません'; return false; }
    return true;
  },
  cost:cloudianPaySelfFogS03(2),
  operation(ctx){
    const pool = acidPoolS03(); if(!pool.length) return;
    v49P1Open(ctx, {kind:'card', title:'雲魔物－アシッド・クラウド：破壊する魔法・罠カード', candidates:pool, min:1, max:1},
      's03u237.acid-destroy', {player:ctx.player}, false);
  },
  afterResolve(){}
}], Object.assign(cloudianBaseS03('雲魔物－アシッド・クラウド'), {timing:['mainPhase']}));

/* ---- 雲魔物－キロスタス: フォッグカウンターを2つ取り除く事で、フィールド上のモンスター1体を破壊する。 ---- */
function kirostusPoolS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card}); }
API.registerChoiceHandler('s03u237.kirostus-destroy', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(h && h.zone==='mz') API.destroy(h, '雲魔物－キロスタス', args.player);
});
defineUnifiedCardV4('雲魔物－キロスタス', [cloudianSummonFogS03('雲魔物－キロスタス'), {
  key:'remove-fog-destroy-monster', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){ return cloudianSelfFogCostS03(2)(ctx); },
  cost:cloudianPaySelfFogS03(2),
  operation(ctx){
    const pool = kirostusPoolS03(); if(!pool.length) return;
    v49P1Open(ctx, {kind:'card', title:'雲魔物－キロスタス：破壊するモンスター', candidates:pool, min:1, max:1},
      's03u237.kirostus-destroy', {player:ctx.player}, false);
  },
  afterResolve(){}
}], Object.assign(cloudianBaseS03('雲魔物－キロスタス'), {timing:['mainPhase']}));

/* ---- 雲魔物－アルトス: フィールド上に存在するフォッグカウンターを3つ取り除く事で、相手の手札をランダムに1枚捨てる。
   (the 3 counters are the cost, chosen from any cards on the field — a single source or an exact total of 3 is paid without asking) ---- */
function paySpreadFogS03(ctx, n, name, done){
  const units = API.counterUnits(null, FOG_KIND_S03);
  if(units.length<n){ done(false); return; }
  const owners = new Set(units.map(u=>u.card.uid));
  if(owners.size<=1 || units.length===n){
    API.removeCounterSpread(units.slice(0,n).map(u=>ensureCardUid(gameState,u.card)), FOG_KIND_S03, name+'（コスト）'); done(true); return;
  }
  API.requestChoice({player:ctx.player, kind:'card', title:name+'：取り除くフォッグカウンター（'+n+'つ）', candidates:units, min:n, max:n, cancelable:true,
    legacy:{onPick:(first, all)=>{
      const uids = (all||[]).map(x=>x && x.card && x.card.uid).filter(u=>u!=null);
      if(uids.length!==n){ done(false); return; }
      API.removeCounterSpread(uids, FOG_KIND_S03, name+'（コスト）'); done(true);
    }, onCancel:()=>done(false)}});
}
defineUnifiedCardV4('雲魔物－アルトス', [cloudianSummonFogS03('雲魔物－アルトス'), {
  key:'remove-three-fog-discard', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(API.counterTotal(null, FOG_KIND_S03)<3){ ctx.reason = 'フィールド上のフォッグカウンターが3つありません'; return false; }
    return true;
  },
  cost(ctx, done){ paySpreadFogS03(ctx, 3, '雲魔物－アルトス', done); },
  operation(ctx){ v80DiscardRandom(ctx.opponent, 1, '雲魔物－アルトス', ctx.player); },
  afterResolve(){}
}], Object.assign(cloudianBaseS03('雲魔物－アルトス'), {timing:['mainPhase']}));

/* ---- 雲魔物－タービュランス: このカードに乗っているフォッグカウンターを1つ取り除く事で、自分のデッキまたはお互いの墓地から「雲魔物－スモークボール」1体を選んで特殊召喚する。 ---- */
function smokePoolS03(p){
  const hit = x=>x.db.k==='m' && x.db.n==='雲魔物－スモークボール' && canEffectSpecialSummonS03(x.card, x.zone, '雲魔物－タービュランス');
  return [].concat(API.pileCards(p,'deck',hit), API.pileCards(p,'grave',hit), API.pileCards(p===0?1:0,'grave',hit));
}
API.registerChoiceHandler('s03u237.turbulence-summon', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(!h || !(h.zone==='grave' || (h.zone==='deck' && h.p===args.player)) || !hasMonsterZoneSpace(args.player)) return;
  API.specialSummon(args.player, h.zone, h.index, 'atk', '雲魔物－タービュランス', h.p);
});
defineUnifiedCardV4('雲魔物－タービュランス', [cloudianSummonFogS03('雲魔物－タービュランス'), {
  key:'remove-fog-summon-smoke', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!cloudianSelfFogCostS03(1)(ctx)) return false;
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!smokePoolS03(ctx.player).length){ ctx.reason = 'デッキ・墓地に「雲魔物－スモークボール」がいません'; return false; }
    return true;
  },
  cost:cloudianPaySelfFogS03(1),
  operation(ctx){
    const pool = smokePoolS03(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    v49P1Open(ctx, {kind:'card', title:'雲魔物－タービュランス：特殊召喚する「雲魔物－スモークボール」（デッキ・お互いの墓地）', candidates:pool, min:1, max:1},
      's03u237.turbulence-summon', {player:ctx.player}, false);
  },
  afterResolve(){}
}], Object.assign(cloudianBaseS03('雲魔物－タービュランス'), {timing:['mainPhase'], includesSpecialSummon:true}));

/* ---- 雲魔物－ストーム・ドラゴン: このカードは通常召喚できない。自分の墓地の「雲魔物」と名のついたモンスター1体をゲームから除外して特殊召喚する。
   1ターンに1度だけ、フィールド上モンスター1体にフォッグカウンターを1つ置く事ができる。
   (「通常召喚できない」 is read from the text by the engine; the counter target is chosen on resolution — it does not target) ---- */
function stormGravePoolS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && cloudianS03(x.db)); }
function stormFieldPoolS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}); }
API.registerChoiceHandler('s03u237.storm-counter', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(h && h.zone==='mz') API.addCounter(h, FOG_KIND_S03, 1);
});
defineUnifiedCardV4('雲魔物－ストーム・ドラゴン', [{
  key:'place-fog', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!stormFieldPoolS03().length){ ctx.reason = 'フィールド上に表側表示のモンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = stormFieldPoolS03(); if(!pool.length) return;
    v49P1Open(ctx, {kind:'card', title:'雲魔物－ストーム・ドラゴン：フォッグカウンターを置くモンスター', candidates:pool, min:1, max:1},
      's03u237.storm-counter', {player:ctx.player}, false);
  },
  afterResolve(){}
}], Object.assign(cloudianBaseS03('雲魔物－ストーム・ドラゴン'), {timing:['mainPhase'], countLimit:{n:1, effects:['place-fog']},
  summonProcedure:{
    from:'hand', positions:['atk','def'],
    condition(ctx){
      if(!stormGravePoolS03(ctx).length){ ctx.reason = '墓地に「雲魔物」と名のついたモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      API.selectCard('雲魔物－ストーム・ドラゴン：除外する「雲魔物」', stormGravePoolS03(ctx), t=>{
        const r = resolveTarget(t), u = r && r.card && r.card.uid;
        const h = u!=null ? findCardByUid(u) : null;
        if(!h || h.zone!=='grave'){ done(false); return; }
        API.banish(h, '雲魔物－ストーム・ドラゴン（特殊召喚の手順）');
        const g = findCardByUid(u); done(!!g && g.zone==='banish');
      });
    }
  }}));

/* ---- 雲魔物－アイ・オブ・ザ・タイフーン: このカードの攻撃宣言時、「雲魔物」と名のついたカード以外の全ての表側表示モンスターの表示形式を変更する。 ---- */
function typhoonVictimsS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && !cloudianS03(x.db)}); }
function typhoonAttackingS03(ctx){ const a = gameState.pendingAttack; return ctx.zone==='mz' && !!a && a.attackerUid!=null && a.attackerUid===ctx.card.uid; }
defineUnifiedCardV4('雲魔物－アイ・オブ・ザ・タイフーン', [{
  key:'attack-change-positions', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return typhoonAttackingS03(ctx) && typhoonVictimsS03().length>0; },
  operation(ctx){
    typhoonVictimsS03().map(x=>x.card.uid).forEach(u=>{
      const h = findCardByUid(u);
      if(h && h.zone==='mz' && h.card.face==='up') API.changePosition(h, h.card.pos==='atk' ? 'def' : 'atk', '雲魔物－アイ・オブ・ザ・タイフーン');
    });
  },
  afterResolve(){}
}], cloudianBaseS03('雲魔物－アイ・オブ・ザ・タイフーン'));
