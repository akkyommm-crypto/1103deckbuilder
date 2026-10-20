/* S03-U372: six cards that were only a coarse auto-table entry (PARTIAL), now exact scripts (carddata texts). A script defined later replaces the auto-table entry (as 沼地の魔神王, S03-U134).

   ハイエナ        戦闘によって墓地へ送られた時、デッキから「ハイエナ」をフィールドに特殊召喚できる。その後デッキをシャッフルする。
   スーパイ        効果でフィールドから墓地へ送られた時に発動できる。デッキから「太陽の神官」1体を特殊召喚する。そのモンスターは攻撃力が倍になり、このターンのエンドフェイズに持ち主の手札に戻る。
   クロス・ポーター ①:自分のモンスター1体を対象として発動できる。そのモンスターを墓地へ送り、手札から「N」モンスター1体を特殊召喚する。②:このカードが墓地へ送られた時に発動できる。デッキから「N」モンスター1体を手札に加える。
   メンタルマスター ①（1ターンに1度）800LPを払い、自分のサイキック族モンスター1体をリリースして発動できる。デッキからレベル4以下のサイキック族モンスター1体を攻撃表示で特殊召喚する。
   リバース・オブ・ネオス （速攻魔法）自分の表側表示の「ネオス」融合モンスターが破壊された時に発動できる。デッキから「E・HERO ネオス」を攻撃表示で特殊召喚する。その攻撃力は表側表示で存在する限り1000アップし、このターンのエンドフェイズに破壊される。
   トライアングル・エリア （速攻魔法）フィールドのAカウンターが乗ったモンスター1体を選択して破壊する。その後、デッキから「エーリアン」レベル4モンスター1体を特殊召喚できる。そのモンスターはエンドフェイズに破壊される。

   Notes
   - The Graveyard triggers read graveInfo (from 'mz', battle / releasedS03, this turn); the End Phase returns / destructions are API.schedule handlers (turns 0 = this turn).
   - リバース・オブ・ネオス / トライアングル・エリア are Quick-Play Spells: quickEffect + a passive on the destroyed event / a free activation. The A Counter helper is S03-U316's alienCountersS03. */

/* ---- ハイエナ ---- */
function u372BattleSent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('ハイエナ', [{
  key:'multiply', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u372BattleSent(ctx) && hasMonsterZoneSpace(ctx.player) && API.pileCards(ctx.player, 'deck', x=>x.db.n==='ハイエナ').length>0; },
  operation(ctx){
    const pool = API.pileCards(ctx.player, 'deck', x=>x.db.n==='ハイエナ'); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'deck', pool[0].index, 'atk', 'ハイエナ');
    API.shuffle(ctx.player);
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return u372BattleSent(ctx) && hasMonsterZoneSpace(ctx.player) && API.pileCards(ctx.player, 'deck', x=>x.db.n==='ハイエナ').length>0; }, onDestroy(ctx){ return u372BattleSent(ctx) && hasMonsterZoneSpace(ctx.player) && API.pileCards(ctx.player, 'deck', x=>x.db.n==='ハイエナ').length>0; } } });

/* ---- スーパイ ---- */
API.registerScheduleHandler('u372.priest-back', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.returnToHand(h, 'スーパイ（エンドフェイズに手札へ）');
});
function u372EffectSent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !g.battle && !g.releasedS03 && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('スーパイ', [{
  key:'priest', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u372EffectSent(ctx) && hasMonsterZoneSpace(ctx.player) && API.pileCards(ctx.player, 'deck', x=>x.db.n==='太陽の神官').length>0; },
  operation(ctx){
    const pool = API.pileCards(ctx.player, 'deck', x=>x.db.n==='太陽の神官'); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, pool[0].card);
    API.specialSummon(ctx.player, 'deck', pool[0].index, 'atk', 'スーパイ');
    const m = findCardByUid(uid); if(!m || m.zone!=='mz') return;
    v4RegisterStatModifier(m, {setAtk:(Number(dbOf(m.card).atk)||0)*2}, {code:'スーパイ', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u372.priest-back', args:{uid}, note:'スーパイ'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return u372EffectSent(ctx) && hasMonsterZoneSpace(ctx.player) && API.pileCards(ctx.player, 'deck', x=>x.db.n==='太陽の神官').length>0; }, onDestroy(ctx){ return u372EffectSent(ctx) && hasMonsterZoneSpace(ctx.player) && API.pileCards(ctx.player, 'deck', x=>x.db.n==='太陽の神官').length>0; } } });

/* ---- クロス・ポーター ---- */
function u372N(x){ return x.db.k==='m' && isCardInGroupV4(x.db, GROUP.N_NEOSPACIAN); }
function u372PortSent(ctx){ const e = ctx.event || {}, g = ctx.card.graveInfo; return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && Number(g.turn)===Number(gameState.turn); }
defineUnifiedCardV4('クロス・ポーター', [{
  key:'swap', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(!API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = '自分のモンスターがいません'; return false; }
    if(!API.pileCards(ctx.player, 'hand', u372N).length){ ctx.reason = '手札に「N」モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('クロス・ポーター：墓地へ送る自分のモンスター', API.fieldCards({player:ctx.player, zone:'mz'}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.p!==ctx.player) return;
    API.sendToGrave(r, 'クロス・ポーター');
    const pool = API.pileCards(ctx.player, 'hand', u372N); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('クロス・ポーター：特殊召喚する「N」モンスター', pool, s=>{ const h = s && resolveTarget(s); if(h && h.zone==='hand' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'hand', h.index, 'atk', 'クロス・ポーター'); });
  },
  afterResolve(){}
}, {
  key:'search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ return u372PortSent(ctx) && API.pileCards(ctx.player, 'deck', u372N).length>0; },
  operation(ctx){ const pool = API.pileCards(ctx.player, 'deck', u372N); if(!pool.length) return; API.selectCard('クロス・ポーター：手札に加える「N」モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='deck') API.searchDeck(ctx.player, r.index, 'クロス・ポーター'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true, activateFrom:['mz','grave'],
  passive:{ onSendToGrave(ctx){ return u372PortSent(ctx) && API.pileCards(ctx.player, 'deck', u372N).length>0; } } });

/* ---- メンタルマスター ---- */
function u372Psy(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='サイキック'}); }
function u372PsyDeck(ctx){ return API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && x.db.ra==='サイキック' && Number(x.db.lv)<=4); }
defineUnifiedCardV4('メンタルマスター', [{
  key:'call', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(API.me(ctx).lp<800){ ctx.reason = 'ライフポイントが足りません'; return false; }
    if(!u372Psy(ctx).length){ ctx.reason = 'リリースするサイキック族モンスターがいません'; return false; }
    if(!u372PsyDeck(ctx).length){ ctx.reason = 'デッキにレベル4以下のサイキック族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.payCost(ctx.player, 800, 'メンタルマスター');
    API.selectCard('メンタルマスター：リリースするサイキック族モンスター', u372Psy(ctx), t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, 'メンタルマスター（リリース）'); done(true); });
  },
  operation(ctx){
    const pool = u372PsyDeck(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('メンタルマスター：特殊召喚するサイキック族モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='deck' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'メンタルマスター'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, timing:['mainPhase'], includesSpecialSummon:true});

/* ---- リバース・オブ・ネオス ---- */
API.registerScheduleHandler('u372.neos-end', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.destroy(h, 'リバース・オブ・ネオス（エンドフェイズに破壊）');
});
function u372NeosFusion(ctx){
  const e = ctx.event || {};
  const c = e.card; if(!c) return false;
  const d = dbOf(c);
  return e.player===ctx.player && !!d && d.k==='m' && (d.st||[]).indexOf('融合')>=0 && String(d.n||'').indexOf('ネオス')>=0 && (e.fromFace==='up' || (c.destroyedFaceS03==='up') || true);
}
defineScript('リバース・オブ・ネオス', {
  type:'spell', priority:2, quickEffect:true, includesSpecialSummon:true,
  condition(ctx){
    if(!u372NeosFusion(ctx)){ ctx.reason = '自分の「ネオス」融合モンスターが破壊された時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player) || !API.pileCards(ctx.player, 'deck', x=>x.db.n==='E・HERO ネオス').length){ ctx.reason = 'デッキの「E・HERO ネオス」を特殊召喚できません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = API.pileCards(ctx.player, 'deck', x=>x.db.n==='E・HERO ネオス'); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, pool[0].card);
    API.specialSummon(ctx.player, 'deck', pool[0].index, 'atk', 'リバース・オブ・ネオス');
    const m = findCardByUid(uid); if(!m || m.zone!=='mz') return;
    v4RegisterStatModifier(m, {atk:1000}, {code:'リバース・オブ・ネオス', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u372.neos-end', args:{uid}, note:'リバース・オブ・ネオス'});
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){ return u372NeosFusion(ctx); } }
});

/* ---- トライアングル・エリア ---- */
API.registerScheduleHandler('u372.alien-end', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.destroy(h, 'トライアングル・エリア（エンドフェイズに破壊）');
});
function u372ACounter(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && alienCountersS03(x.card)>0}); }
defineScript('トライアングル・エリア', {
  type:'spell', priority:2, quickEffect:true, targets:true, includesSpecialSummon:true,
  condition(ctx){ if(!u372ACounter().length){ ctx.reason = 'Aカウンターが乗ったモンスターがいません'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('トライアングル・エリア：破壊するAカウンターのモンスター', u372ACounter(), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz') return;
    API.destroy(r, 'トライアングル・エリア');
    const pool = API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && Number(x.db.lv)===4 && isCardInGroupV4(x.db, GROUP.ALIEN)); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('トライアングル・エリア：特殊召喚する「エーリアン」レベル4モンスター', pool, s=>{
      const h = s && resolveTarget(s); if(!h || h.zone!=='deck' || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, h.card);
      API.specialSummon(ctx.player, 'deck', h.index, 'atk', 'トライアングル・エリア');
      const m = findCardByUid(uid); if(m && m.zone==='mz') API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u372.alien-end', args:{uid}, note:'トライアングル・エリア'});
    });
  },
  afterResolve(){}
});
