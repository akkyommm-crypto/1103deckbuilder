/* S03-U240: 「宝玉獣」 (2011 texts) — アメジスト・キャット (ENGINE_GAP), アンバー・マンモス, エメラルド・タートル, コバルト・イーグル, サファイア・ペガサス,
   トパーズ・タイガー, ルビー・カーバンクル (NOT_STARTED), 宝玉の恵み (ENGINE_GAP), 宝玉の解放 (NOT_STARTED).
   Engine: engine/1ZZH (crystalPlaceS03: destroyed in the Monster Zone → placed as a Continuous Spell, decided through the S03-U173 flow;
   placeAsSpellS03 for 「…を永続魔法カード扱いとして…置く」). */

/* 「宝玉獣」と名のついたモンスター. The project setcode CRYSTAL_BEAST (0x1021) also covers 究極宝玉神 and the 「宝玉の…」 Spells / Traps and the overlay has no
   宝玉獣 group, so the name is the authority here (「…と名のついた」). */
function crystalBeastDbS03(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('宝玉獣')>=0; }
function crystalBeastS03(c){ return !!c && crystalBeastDbS03(dbOf(c)); }
const CRYSTAL_PLACE_S03 = {};                       /* 「このカードがモンスターカードゾーン上で破壊された場合、…置く事ができる」 */
const CRYSTAL_PLACE_FACEUP_S03 = {faceUpOnly:true}; /* 「表側表示のこのカードがモンスターゾーンで破壊された場合、…」 */
/* candidates for 「…を選び、永続魔法カード扱いとして自分の魔法&罠ゾーンに表側表示で置く」 */
function crystalPlacePoolS03(p, zones){
  return [].concat(...zones.map(z=>API.pileCards(p, z, x=>crystalBeastDbS03(x.db))));
}
API.registerChoiceHandler('s03u240.place-spell', (answer, args)=>{
  v49P1ChoiceCards(answer).forEach(pk=>{
    const h = pk && pk.card && pk.card.uid!=null ? findCardByUid(pk.card.uid) : null;
    if(h && h.p===args.player && ['hand','deck','grave'].indexOf(h.zone)>=0) placeAsSpellS03(args.player, h.zone, h.index, args.reason);
  });
});
function askCrystalPlaceS03(ctx, zones, reason, max){
  const pool = crystalPlacePoolS03(ctx.player, zones);
  const room = ZONE_LIMITS.sz - (gameState.players[ctx.player].sz||[]).length;
  const n = Math.min(max||1, pool.length, room);
  if(n<=0) return;
  API.requestChoice({player:ctx.player, kind:'card', title:`${reason}：永続魔法カード扱いとして置く「宝玉獣」${n>1?`（${n}体まで）`:''}`, candidates:pool, min:1, max:n,
    cancelable:false, resume:{handler:'s03u240.place-spell', args:{player:ctx.player, reason}}, meta:{scriptName:reason}});
}

/* ---- アメジスト・キャット: このカードは相手プレイヤーに直接攻撃できる。この時、このカードが相手ライフに与える戦闘ダメージは半分になる。 ---- */
defineScript('宝玉獣 アメジスト・キャット', {
  type:'monster', priority:1, canDirectAttack:true, crystalPlaceS03:CRYSTAL_PLACE_S03,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    /* only a direct attack made while monsters were there uses this card's own permission; halve the direct battle damage it deals */
    battleDamage(info){ return (info && info.direct && info.atkCard && info.atkCard===info.self && info.self.face==='up') ? Math.floor(info.amount/2) : info.amount; }}
});

/* ---- アンバー・マンモス: 自分フィールド上の「宝玉獣」と名のついたモンスターが攻撃対象に選択された時、このカードに攻撃対象を変更できる。 ---- */
function amberReadyS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  const a = gameState.pendingAttack; if(!a || a.player!==ctx.opponent || a.targetUid==null || a.targetUid===ctx.card.uid) return false;
  const t = findCardByUid(a.targetUid);
  return !!t && t.zone==='mz' && t.p===ctx.player && t.card.face==='up' && crystalBeastS03(t.card);
}
defineScript('宝玉獣 アンバー・マンモス', {
  type:'monster', priority:1, crystalPlaceS03:CRYSTAL_PLACE_S03,
  condition(ctx){ if(!amberReadyS03(ctx)){ ctx.reason = '自分の「宝玉獣」が攻撃対象に選択された時に発動できます'; return false; } return true; },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.redirectAttack({targetUid:ensureCardUid(gameState, me.card)}); },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return amberReadyS03(ctx); } }
});

/* ---- エメラルド・タートル: 1ターンに1度、このターン攻撃を行った自分フィールド上のモンスター1体を選択して発動できる。選択した自分のモンスターを守備表示にする。 ---- */
function emeraldTargetsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk' && Number(x.card.attackCount)>0}); }
defineScript('宝玉獣 エメラルド・タートル', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true, crystalPlaceS03:CRYSTAL_PLACE_S03,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!emeraldTargetsS03(ctx).length){ ctx.reason = 'このターン攻撃を行った攻撃表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('宝玉獣 エメラルド・タートル：守備表示にするモンスター', emeraldTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='mz' && h.p===ctx.player && h.card.face==='up' && h.card.pos==='atk') API.changePosition(h, 'def', '宝玉獣 エメラルド・タートル');
  },
  afterResolve(){}
});

/* ---- コバルト・イーグル: 1ターンに1度、自分のメインフェイズ時に発動できる。自分フィールド上の「宝玉獣」と名のついたカード1枚を選択して持ち主のデッキの一番上に戻す。 ---- */
function cobaltTargetsS03(ctx){ return API.fieldCards({player:ctx.player, filter:x=>(x.zone==='mz' || x.zone==='sz') && x.card.face==='up' && crystalBeastDbS03(x.db)}); }
defineScript('宝玉獣 コバルト・イーグル', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true, crystalPlaceS03:CRYSTAL_PLACE_S03,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!cobaltTargetsS03(ctx).length){ ctx.reason = '自分フィールドに「宝玉獣」と名のついたカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('宝玉獣 コバルト・イーグル：デッキの一番上に戻す「宝玉獣」', cobaltTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && (h.zone==='mz' || h.zone==='sz') && h.p===ctx.player) API.returnToDeck(h, false, '宝玉獣 コバルト・イーグル');
  },
  afterResolve(){}
});

/* ---- サファイア・ペガサス: ①召喚・反転召喚・特殊召喚に成功した時に発動できる。自分の手札・デッキ・墓地から「宝玉獣」モンスター1体を選び、
   永続魔法カード扱いとして自分の魔法&罠ゾーンに表側表示で置く。 ---- */
function pegasusReadyS03(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && crystalPlacePoolS03(ctx.player, ['hand','deck','grave']).length>0 && stZoneFreeS03(gameState, ctx.player); }
defineScript('宝玉獣 サファイア・ペガサス', {
  type:'monster', priority:1, crystalPlaceS03:CRYSTAL_PLACE_FACEUP_S03,
  condition(ctx){ if(!pegasusReadyS03(ctx)){ ctx.reason = '召喚・反転召喚・特殊召喚に成功した時に発動できます'; return false; } return true; },
  resolve(ctx){ askCrystalPlaceS03(ctx, ['hand','deck','grave'], '宝玉獣 サファイア・ペガサス', 1); },
  afterResolve(){},
  passive:{ onNormalSummon:pegasusReadyS03, onFlip:pegasusReadyS03, onSpecialSummon:pegasusReadyS03 }
});

/* ---- トパーズ・タイガー: このカードは相手モンスターに攻撃する場合、ダメージステップの間、攻撃力が400ポイントアップする。 ---- */
defineScript('宝玉獣 トパーズ・タイガー', {
  type:'monster', priority:1, crystalPlaceS03:CRYSTAL_PLACE_S03,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{scope:'self', from:['mz'], apply(card, self){
    if(card!==self || card.face!=='up') return null;
    const b = gameState.battle;   /* present only during the damage step (engine/60 startBattle) */
    return (b && b.atkUid!=null && b.atkUid===card.uid && b.targetUid!=null) ? {atk:400} : null; }}
});

/* ---- ルビー・カーバンクル: ①特殊召喚に成功した時に発動できる。自分の魔法&罠ゾーンの「宝玉獣」モンスターカードを可能な限り特殊召喚する。 ---- */
function rubyPoolS03(p){ return (gameState.players[p].sz||[]).filter(c=>c && c.face==='up' && crystalBeastS03(c) && canEffectSpecialSummonS03(c, 'sz', '宝玉獣 ルビー・カーバンクル')); }
function rubyReadyS03(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && rubyPoolS03(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); }
defineScript('宝玉獣 ルビー・カーバンクル', {
  type:'monster', priority:1, includesSpecialSummon:true, crystalPlaceS03:CRYSTAL_PLACE_FACEUP_S03,
  condition(ctx){ if(!rubyReadyS03(ctx)){ ctx.reason = '特殊召喚に成功した時、魔法＆罠ゾーンに「宝玉獣」がいる場合に発動できます'; return false; } return true; },
  resolve(ctx){
    /* 「可能な限り」: every one that fits, in zone order */
    rubyPoolS03(ctx.player).map(c=>c.uid).forEach(u=>{
      if(!hasMonsterZoneSpace(ctx.player)) return;
      const h = findCardByUid(u); if(h && h.zone==='sz') API.specialSummon(ctx.player, 'sz', h.index, 'atk', '宝玉獣 ルビー・カーバンクル');
    });
  },
  afterResolve(){},
  passive:{ onSpecialSummon:rubyReadyS03 }
});

/* ---- 宝玉の恵み: 自分の墓地の「宝玉獣」と名のついたモンスターを2体まで選択して発動できる。選択したモンスターを永続魔法カード扱いとして自分の魔法&罠カードゾーンに
   表側表示で置く。 (targets up to 2; this Spell's own zone is freed when it resolves, so the room is counted without it) ---- */
function blessingTargetsS03(ctx){ return API.pileCards(ctx.player, 'grave', x=>crystalBeastDbS03(x.db)); }
function blessingRoomS03(ctx){ const sz = gameState.players[ctx.player].sz||[]; return ZONE_LIMITS.sz - sz.filter(c=>c && c!==ctx.card).length; }
defineScript('宝玉の恵み', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!blessingTargetsS03(ctx).length){ ctx.reason = '墓地に「宝玉獣」がいません'; return false; }
    if(blessingRoomS03(ctx)<1){ ctx.reason = '魔法＆罠ゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const pool = blessingTargetsS03(ctx), n = Math.min(2, pool.length, Math.max(1, blessingRoomS03(ctx)));
    v380SelectUpTo('宝玉の恵み：魔法＆罠ゾーンに置く「宝玉獣」（2体まで）', pool, n, ts=>done(ts));
  },
  resolve(ctx){
    (ctx.selectedTargets||[]).forEach(t=>{
      const h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
      if(h && h.zone==='grave' && h.p===ctx.player) placeAsSpellS03(ctx.player, 'grave', h.index, '宝玉の恵み');
    });
  },
  afterResolve(){}
});

/* ---- 宝玉の解放: 「宝玉獣」モンスターにのみ装備可能。①装備モンスターの攻撃力は800アップする。②このカードがフィールドから墓地へ送られた時に発動できる。
   デッキから「宝玉獣」モンスター1体を永続魔法カード扱いとして自分の魔法&罠ゾーンに表側表示で置く。 ---- */
function liberationHostsS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && crystalBeastDbS03(x.db)}); }
function liberationSentS03(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && (g.from==='sz' || g.from==='field') && Number(g.turn)===Number(gameState.turn)
    && crystalPlacePoolS03(ctx.player, ['deck']).length>0 && stZoneFreeS03(gameState, ctx.player);
}
defineUnifiedCardV4('宝玉の解放', [{
  key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
  condition(){ return liberationHostsS03().length>0; },
  target(ctx, done){ API.selectCard('宝玉の解放：装備する「宝玉獣」', liberationHostsS03(), t=>done([t])); },
  operation(ctx){
    const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(s && t && t.zone==='mz' && t.card.face==='up' && crystalBeastS03(t.card)) API.equipSpell(s, t, '宝玉の解放');
  },
  afterResolve(){}
},{
  key:'place-from-deck', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ return liberationSentS03(ctx); },
  operation(ctx){ askCrystalPlaceS03(ctx, ['deck'], '宝玉の解放', 1); },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, activateFrom:['hand','sz','grave'],
    continuous:{scope:'allMonsters', from:['sz'], apply(card, self){ return (self && self.equipTo && card && self.equipTo.uid===card.uid) ? {atk:800} : null; }}});
