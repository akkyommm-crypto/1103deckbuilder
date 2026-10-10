/* S03-U269: ENGINE_GAP re-check (2011 texts) — 四次元の墓, 補充要員, 救急救命, 光神化, 裏ガエル, 魔轟神ガルバス, ガルドスの羽根ペン, トライワイトゾーン.
   No engine change. Reuses: activationV11 + the p11cards.* handlers of cards/89 (targets / cost chosen at activation, JSON descriptor, save-safe),
   API.requestChoice + registered handlers for choices made at resolution (「選んで」 / no 「選択して」), graveInfo {turn, byDestroy, battle} (救急救命),
   API.modAtk + API.schedule({at:'endPhase'}) + a card flag (光神化), the position API (裏ガエル), GROUP.GAERU (S03-U161), canEffectSpecialSummonS03.
   Rulings (see the unit report): the special summons let the player choose face-up Attack or Defense (S03-U271, engine/1ZZK); 魔轟神ガルバス can target face-up monsters only. */

/* 「LV」を持つモンスター: a monster whose name ends with ' LV' + digits (no setcode for the series). */
function lvMonsterDbS269(db){ return !!db && db.k==='m' && /\sLV\d+$/.test(String(db.n||'')); }
function gravePoolS269(p, pred){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && pred(x)); }
function pickedUidsS269(a){ return (a && a.cards || []).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid); }
function hasEffectTypeS269(db){ return !!db && (db.st||[]).indexOf('効果')>=0; }
function isNormalDbS269(db){ return !!db && (db.st||[]).indexOf('通常')>=0; }

/* ---- 四次元の墓: 自分の墓地に存在する「LV」を持つモンスター2体を、自分のデッキに加えてシャッフルする。 (no 「選択して」: chosen on resolution) ---- */
function lvGravePoolS269(p){ return gravePoolS269(p, x=>lvMonsterDbS269(x.db)); }
defineScript('四次元の墓', {
  type:'spell', priority:1,
  condition(ctx){
    if(lvGravePoolS269(ctx.player).length < 2){ ctx.reason = '墓地に「LV」を持つモンスターが2体以上必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = lvGravePoolS269(ctx.player);
    if(pool.length < 2){ API.log('四次元の墓：墓地の「LV」を持つモンスターが2体に満たないため不発'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'四次元の墓：デッキに加える「LV」を持つモンスター（2体）', candidates:pool, min:2, max:2, cancelable:false,
      resume:{handler:'s03u269.four-dim-grave', args:{player:ctx.player}}, meta:{scriptName:'四次元の墓'}});
  }
});
API.registerChoiceHandler('s03u269.four-dim-grave', (a, x)=>{
  if(!x) return;
  let n = 0;
  pickedUidsS269(a).slice(0,2).forEach(u=>{
    const h = findCardByUid(u);
    if(h && h.p===x.player && h.zone==='grave' && lvMonsterDbS269(h.db || dbOf(h.card))){ API.returnToDeck(h, false, '四次元の墓'); n++; }
  });
  if(n) API.shuffle(x.player);
});

/* ---- 補充要員: 自分の墓地にモンスターが5体以上存在する場合に発動する事ができる。自分の墓地に存在する効果モンスター以外の攻撃力1500以下のモンスターを3体まで選択して手札に加える。 ---- */
function reserveGravePoolS269(p){ return gravePoolS269(p, x=>!hasEffectTypeS269(x.db) && (x.db.atk||0) <= 1500); }
defineScript('補充要員', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(gravePoolS269(ctx.player, ()=>true).length < 5){ ctx.reason = '墓地にモンスターが5体以上必要です'; return false; }
    if(!reserveGravePoolS269(ctx.player).length){ ctx.reason = '墓地に効果モンスター以外の攻撃力1500以下のモンスターがいません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    const pool = reserveGravePoolS269(ctx.player);
    p11cOpen(d, {title:'補充要員：手札に加えるモンスター（3体まで）', candidates:pool, min:1, max:Math.min(3, pool.length), targeting:true}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{
      const r = resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player && r.card.face!=='down' && dbOf(r.card).k==='m') API.returnToHand(r, '補充要員');
    });
  }
});

/* ---- 救急救命: メインフェイズ2でのみ発動する事ができる。このターンにカードの効果によって破壊され墓地へ送られたレベル4のモンスター1体を、自分の墓地から特殊召喚する。 ----
   graveInfo {turn, byDestroy, battle}: destroyed by a card effect this turn (a battle destruction has battle:true). Chosen on resolution (no 「選択して」). */
function rescuePoolS269(p){
  return gravePoolS269(p, x=>{
    const g = x.card.graveInfo;
    return Number(x.db.lv)===4 && !!g && g.byDestroy===true && g.battle!==true && Number(g.turn)===Number(gameState.turn)
      && canEffectSpecialSummonS03(x.card, 'grave', '救急救命');
  });
}
function rescueSummonS269(p, uid){
  const h = uid!=null ? findCardByUid(uid) : null;
  if(!h || h.p!==p || h.zone!=='grave' || !hasMonsterZoneSpace(p)) return;
  specialSummonPositionsS03(p, [{uid, from:'grave'}], '救急救命');   /* S03-U271: face-up Attack or Defense (engine/1ZZK) */
}
defineScript('救急救命', {
  type:'spell', priority:1, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(gameState.phase!=='main2'){ ctx.reason = 'メインフェイズ2でのみ発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!rescuePoolS269(ctx.player).length){ ctx.reason = 'このターンにカードの効果で破壊され墓地へ送られたレベル4のモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = rescuePoolS269(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.log('救急救命：特殊召喚できるモンスターがいない'); return; }
    if(pool.length===1){ rescueSummonS269(ctx.player, pool[0].card.uid); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'救急救命：特殊召喚するレベル4のモンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u269.rescue', args:{player:ctx.player}}, meta:{scriptName:'救急救命'}});
  }
});
API.registerChoiceHandler('s03u269.rescue', (a, x)=>{
  const u = pickedUidsS269(a)[0];
  if(x && u!=null) rescueSummonS269(x.player, u);
});

/* ---- 光神化 (速攻魔法): ①:手札から天使族モンスター1体を特殊召喚する。この効果で特殊召喚したモンスターの攻撃力は半分になり、エンドフェイズに破壊される。 ----
   The summoned monster is stamped with a card flag (this turn); its ATK gets a modifier of −(half of its ATK at that time) while it stays on the field;
   an End Phase schedule destroys it (only if it is still on the field and still carries the stamp of that turn). */
function lightGodPoolS269(p){
  return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.db.ra==='天使' && canEffectSpecialSummonS03(x.card, 'hand', '光神化'));
}
function lightGodSummonS269(p, uid){
  const h = uid!=null ? findCardByUid(uid) : null;
  if(!h || h.p!==p || h.zone!=='hand' || !hasMonsterZoneSpace(p)) return;
  specialSummonPositionsS03(p, [{uid, from:'hand'}], '光神化', 's03u269.light-god-after');   /* S03-U271: face-up Attack or Defense (engine/1ZZK) */
}
registerSsPositionAfterS03('s03u269.light-god-after', (p, uids)=>{
  const uid = uids[0];
  const now = uid!=null ? findCardByUid(uid) : null;
  if(!now || now.zone!=='mz' || now.p!==p) return;
  API.setCardFlag(now, 'lightGodTurnS269', gameState.turn, '光神化', {silent:true});
  const cur = API.curAtk(now);
  if(cur > 0) API.modAtk(now, -Math.floor(cur/2), 0, 'leave', '光神化');
  API.schedule({at:'endPhase', turns:0, player:p, handler:'s03u269.light-god-end', args:{uid, turn:gameState.turn}, note:'光神化'});
});
API.registerScheduleHandler('s03u269.light-god-end', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz' && Number(h.card.lightGodTurnS269)===Number(args.turn)) API.destroy(h, '光神化（エンドフェイズ）');
});
defineScript('光神化', {
  type:'quick-play', priority:2, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!lightGodPoolS269(ctx.player).length){ ctx.reason = '手札に特殊召喚できる天使族モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = lightGodPoolS269(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.log('光神化：特殊召喚できる天使族モンスターがいない'); return; }
    if(pool.length===1){ lightGodSummonS269(ctx.player, pool[0].card.uid); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'光神化：特殊召喚する天使族モンスター（手札）', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u269.light-god', args:{player:ctx.player}}, meta:{scriptName:'光神化'}});
  }
});
API.registerChoiceHandler('s03u269.light-god', (a, x)=>{
  const u = pickedUidsS269(a)[0];
  if(x && u!=null) lightGodSummonS269(x.player, u);
});

/* ---- 裏ガエル: このカードは1ターンに1度だけ裏側守備表示にする事ができる。このカードがリバースした時、自分フィールド上の「ガエル」と名のついたモンスターの数まで、
   相手フィールド上のモンスターを選んで持ち主の手札に戻す事ができる。 ---- (the flip effect is optional; the choice is made on resolution; N = face-up 「ガエル」 you control at resolution) */
function selfSetS269(ctx){
  const h = locateCardAnyV4(ctx.card);
  if(h){ API.changePosition(h, 'def', '裏ガエル'); const r = locateCardAnyV4(ctx.card); if(r) API.flip(r, 'down', '裏ガエル'); }
}
function frogCountS269(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && groupMemberNowS03(x.card, GROUP.GAERU)}).length;
}
function frogFlipSelfS269(ctx){ return !!(ctx.event && (ctx.event.card===ctx.card || (ctx.event.uid!=null && ctx.card && ctx.event.uid===ctx.card.uid))); }
defineUnifiedCardV4('裏ガエル', [{
  key:'self-set', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer; },
  operation(ctx){ selfSetS269(ctx); },
  afterResolve(){}
},{
  key:'flip-bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['onFlip'],
  condition(ctx){ return ctx.zone==='mz' && frogFlipSelfS269(ctx) && API.fieldCards({player:ctx.opponent, zone:'mz'}).length>0; },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz'});
    const n = Math.min(frogCountS269(ctx.player), pool.length);
    if(!pool.length || n<1){ API.log('裏ガエル：手札に戻せる相手モンスターがいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:`裏ガエル：手札に戻す相手モンスター（${n}体まで）`, candidates:pool, min:1, max:n, cancelable:false,
      resume:{handler:'s03u269.frog-bounce', args:{player:ctx.player}}, meta:{scriptName:'裏ガエル'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['self-set']}, timing:['mainPhase'],
  passive:{onFlip:ctx=>frogFlipSelfS269(ctx)}});
API.registerChoiceHandler('s03u269.frog-bounce', (a, x)=>{
  if(!x) return;
  pickedUidsS269(a).forEach(u=>{
    const h = findCardByUid(u);
    if(h && h.p===(x.player===0?1:0) && h.zone==='mz') API.returnToHand(h, '裏ガエル');
  });
});

/* ---- 魔轟神ガルバス: 手札を1枚墓地へ捨てて発動できる。このカードの攻撃力以下の守備力を持つ、相手フィールド上のモンスター1体を選択して破壊する。 ----
   Cost (discard, so the 「魔轟神」 discard triggers fire) first, then the target. Only FACE-UP opponent monsters are offered (a face-down monster's DEF is hidden). */
function garbusFoePoolS269(player, selfCard){
  const atk = selfCard ? curATK(selfCard) : 0;
  return API.fieldCards({player:1-player, zone:'mz', filter:x=>x.card.face==='up' && curDEF(x.card) <= atk});
}
defineScript('魔轟神ガルバス', {
  type:'monster', priority:1, timing:['mainPhase'], targets:true, destroysFieldV46:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!garbusFoePoolS269(ctx.player, ctx.card).length){ ctx.reason = 'このカードの攻撃力以下の守備力を持つ相手モンスターがいません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'魔轟神ガルバス：捨てる手札', candidates:API.pileCards(ctx.player, 'hand')}, 's03u269.garbus-cost', {});
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p!==ctx.player) API.destroy(r, '魔轟神ガルバス', ctx.player);
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u269.garbus-cost', (a, x)=>{
  if(a.cancelled) return p11cAbort(x.activation);
  const d = x.activation, me = p11cHit(d.uid);
  p11cRecordMove(d, a, 'discard', 'discard');
  const pool = me ? garbusFoePoolS269(d.player, me.card) : [];
  if(!pool.length) return p11cAbort(d);
  p11cOpen(d, {title:'魔轟神ガルバス：破壊する相手モンスター', candidates:pool, targeting:true}, 'p11cards.commit-targets', {});
});

/* ---- ガルドスの羽根ペン: 自分の墓地に存在する風属性モンスター2体を選択してデッキに戻し、フィールド上に存在するカード1枚を選択して持ち主の手札に戻す。 ----
   Targets: 2 WIND monsters in your Graveyard, then 1 other card on the field (the spell cannot target itself). Resolution: the legal part(s) are applied. */
function featherGravePoolS269(p){ return gravePoolS269(p, x=>x.db.at==='風'); }
function featherFieldPoolS269(selfUid, selfCard){ return API.fieldCards({filter:x=>x.card!==selfCard && (selfUid==null || x.card.uid!==selfUid)}); }
defineScript('ガルドスの羽根ペン', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(featherGravePoolS269(ctx.player).length < 2){ ctx.reason = '墓地に風属性モンスターが2体以上必要です'; return false; }
    if(!featherFieldPoolS269(ctx.card.uid, ctx.card).length){ ctx.reason = 'フィールドに他のカードがありません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'ガルドスの羽根ペン：デッキに戻す風属性モンスター（2体）', candidates:featherGravePoolS269(ctx.player), min:2, max:2, targeting:true}, 's03u269.feather-first', {});
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    let n = 0;
    ts.slice(0,2).forEach(t=>{
      const r = resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player && dbOf(r.card).k==='m' && dbOf(r.card).at==='風'){ API.returnToDeck(r, false, 'ガルドスの羽根ペン'); n++; }
    });
    if(n) API.shuffle(ctx.player);
    const f = ts[2] ? resolveTarget(ts[2]) : null;
    if(f && (f.zone==='mz' || f.zone==='sz' || f.zone==='field') && f.card!==ctx.card) API.returnToHand(f, 'ガルドスの羽根ペン');
  }
});
API.registerChoiceHandler('s03u269.feather-first', (a, x)=>{
  if(a.cancelled) return p11cAbort(x.activation);
  const d = x.activation, pool = featherFieldPoolS269(d.uid, null);
  if(!pool.length) return p11cAbort(d);
  p11cOpen(d, {title:'ガルドスの羽根ペン：手札に戻すフィールド上のカード', candidates:pool, targeting:true}, 'p11cards.lava-commit', {first:pickedUidsS269(a)});
});

/* ---- トライワイトゾーン: 自分の墓地に存在するレベル2以下の通常モンスター3体を選択して発動する。選択したモンスターを墓地から特殊召喚する。 ----
   Needs 3 free Monster Zones at activation. Resolution: all-or-nothing for the targets still legal (if fewer zones are free than legal targets, none are summoned). */
function twilightPoolS269(p){
  return gravePoolS269(p, x=>isNormalDbS269(x.db) && Number(x.db.lv)>=1 && Number(x.db.lv)<=2 && canEffectSpecialSummonS03(x.card, 'grave', 'トライワイトゾーン'));
}
defineScript('トライワイトゾーン', {
  type:'spell', priority:1, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length < 3){ ctx.reason = 'モンスターゾーンに3つ以上の空きが必要です'; return false; }
    if(twilightPoolS269(ctx.player).length < 3){ ctx.reason = '墓地にレベル2以下の通常モンスターが3体以上必要です'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'トライワイトゾーン：特殊召喚するレベル2以下の通常モンスター（3体）', candidates:twilightPoolS269(ctx.player), min:3, max:3, targeting:true}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    const valid = (ctx.selectedTargets||[]).map(t=>resolveTarget(t)).filter(r=>r && r.zone==='grave' && r.p===ctx.player && isNormalDbS269(dbOf(r.card)) && Number(dbOf(r.card).lv)<=2);
    if(!valid.length) return;
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length < valid.length){ API.log('トライワイトゾーン：モンスターゾーンの空きが足りないため特殊召喚できない'); return; }
    /* S03-U271: each in face-up Attack or Defense, chosen before the three are summoned together (engine/1ZZK) */
    specialSummonPositionsS03(ctx.player, valid.map(r=>({uid:r.card.uid, from:'grave'})), 'トライワイトゾーン');
  }
});
