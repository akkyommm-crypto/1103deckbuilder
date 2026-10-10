/* S03-U242: 「宝玉獣」 2 (2011 texts) — 宝玉の樹, 究極宝玉神 レインボー・ドラゴン, 宝玉の氾濫 (ENGINE_GAP), レインボー・ライフ.
   Engine: onPlacedAsSpellS03 (engine/1ZZH, both placement paths), LP rule mode damageToRecover (engine/1H). Uses the S03-U240 helpers
   (crystalBeastDbS03, askCrystalPlaceS03, placeAsSpellS03). */

/* ---- 宝玉の樹 (Continuous Spell): ①「宝玉獣」モンスターが魔法&罠ゾーンに置かれる度に、このカードにジェムカウンターを1つ置く。
   ②ジェムカウンターが置かれているこのカードを墓地へ送って発動できる。置かれていたジェムカウンターの数だけ、デッキから「宝玉獣」モンスターを
   永続魔法カード扱いとして自分の魔法&罠ゾーンに表側表示で置く。 ---- */
const GEM_COUNTER_S03 = 'ジェム';
function gemTreeModeS03(ctx){ return ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending; }
function gemPlacedS03(ctx){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null;
  return !!h && h.zone==='sz' && h.card!==ctx.card && crystalBeastDbS03(dbOf(h.card));
}
defineUnifiedCardV4('宝玉の樹', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ return !gemTreeModeS03(ctx); },
  operation(){}, afterResolve(){}
},{
  key:'gem-counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onPlacedAsSpellS03'], forced:true,
  condition(ctx){ return gemTreeModeS03(ctx) && gemPlacedS03(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='sz') API.addCounter(h, GEM_COUNTER_S03, 1); },
  afterResolve(){}
},{
  key:'send-place', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!gemTreeModeS03(ctx)){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    const h = locateCardAnyV4(ctx.card);
    if(!h || API.countCounter(h, GEM_COUNTER_S03)<1){ ctx.reason = 'ジェムカウンターが置かれていません'; return false; }
    if(!crystalPlacePoolS03(ctx.player, ['deck']).length){ ctx.reason = 'デッキに「宝玉獣」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='sz'){ done(false); return; }
    const n = API.countCounter(h, GEM_COUNTER_S03);
    if(n<1){ done(false); return; }
    API.recordActivationCost(ctx, 'gemTreeS03', [], [], n);
    API.sendToGrave(h, '宝玉の樹（コスト）');
    done(true);
  },
  operation(ctx){
    const c = API.activationCosts(ctx, 'gemTreeS03')[0], n = c ? Number(c.amount)||0 : 0;
    if(n>0) askCrystalPlaceS03(ctx, ['deck'], '宝玉の樹', n);
  },
  afterResolve(){}
}], {type:'spell', priority:1, timing:['mainPhase'], fieldIgnition:true});

/* ---- 究極宝玉神 レインボー・ドラゴン: 通常召喚できない。自分のフィールド・墓地に「宝玉獣」カードが7種類存在する場合のみ特殊召喚できる。
   このカードが特殊召喚したターン、このカードの①②の効果は発動できない。
   ①自分フィールドの表側表示の「宝玉獣」モンスターを全て墓地へ送って発動できる。攻撃力は墓地へ送ったモンスターの数×1000アップする。相手ターンでも発動できる。
   ②自分の墓地から「宝玉獣」モンスターを全て除外して発動できる。フィールドのカードを全て持ち主のデッキに戻す。
   ① is a quick effect, ② an ignition. When both can be activated (own Main Phase, open state) the mode is asked at the cost and recorded. ---- */
function rainbowKindsS03(p){
  const P = gameState.players[p], names = new Set();
  [].concat(P.mz||[], P.sz||[]).forEach(c=>{ if(c && c.face==='up' && crystalBeastDbS03(dbOf(c))) names.add(cardName(c)); });
  (P.grave||[]).forEach(c=>{ if(c && crystalBeastDbS03(dbOf(c))) names.add(cardName(c)); });
  return names.size;
}
function rainbowFieldBeastsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && crystalBeastDbS03(x.db)}); }
function rainbowGraveBeastsS03(ctx){ return API.pileCards(ctx.player, 'grave', x=>crystalBeastDbS03(x.db)); }
function rainbowModesS03(ctx){
  const out = [];
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return out;
  if(Number(ctx.card.summonedTurn)===Number(gameState.turn) && ctx.card.specialSummoned) return out;   /* the turn it was special summoned */
  if(rainbowFieldBeastsS03(ctx).length) out.push(1);
  const open = gameState.activePlayer===ctx.player && (gameState.phase==='main1' || gameState.phase==='main2') && !(gameState.chain||[]).length;
  if(open && rainbowGraveBeastsS03(ctx).length) out.push(2);
  return out;
}
function rainbowPayS03(ctx, mode, done){
  API.recordActivationCost(ctx, 'rainbowModeS03', [], [], mode);
  if(mode===1){
    const list = rainbowFieldBeastsS03(ctx).map(x=>x.card.uid);
    API.recordActivationCost(ctx, 'rainbowCountS03', [], [], list.length);
    list.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, '究極宝玉神 レインボー・ドラゴン（コスト）'); });
  }else{
    rainbowGraveBeastsS03(ctx).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave') API.banish(h, '究極宝玉神 レインボー・ドラゴン（コスト）'); });
  }
  done(true);
}
defineScript('究極宝玉神 レインボー・ドラゴン', {
  type:'monster', priority:2, quickEffect:true,
  summonProcedure:{
    from:'hand', positions:['atk','def'],
    condition(ctx){ if(rainbowKindsS03(ctx.player)<7){ ctx.reason = '自分のフィールド・墓地に「宝玉獣」カードが7種類必要です'; return false; } return true; },
    cost(ctx, done){ done(true); }
  },
  condition(ctx){
    if(!rainbowModesS03(ctx).length){ ctx.reason = '発動できる効果がありません（特殊召喚したターン、または送る・除外する「宝玉獣」がありません）'; return false; }
    return true;
  },
  cost(ctx, done){
    const modes = rainbowModesS03(ctx);
    if(!modes.length){ done(false); return; }
    if(modes.length===1){ rainbowPayS03(ctx, modes[0], done); return; }
    API.requestChoice({player:ctx.player, kind:'declare', title:'究極宝玉神 レインボー・ドラゴン：発動する効果', min:1, max:1, cancelable:true,
      candidates:[{key:'m1', label:'①「宝玉獣」を全て墓地へ送り、攻撃力アップ', value:1}, {key:'m2', label:'②墓地の「宝玉獣」を全て除外し、フィールドのカードを全てデッキに戻す', value:2}],
      legacy:{onPick:(x)=>rainbowPayS03(ctx, Number(x && x.value)===2 ? 2 : 1, done), onCancel:()=>done(false)}});
  },
  resolve(ctx){
    const m = API.activationCosts(ctx, 'rainbowModeS03')[0], mode = m ? Number(m.amount) : 1;
    if(mode===1){
      const c = API.activationCosts(ctx, 'rainbowCountS03')[0], n = c ? Number(c.amount)||0 : 0;
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone==='mz' && me.card.face==='up' && n>0)
        v4RegisterStatModifier(me, {atk:n*1000}, {controller:ctx.player, code:'究極宝玉神 レインボー・ドラゴン', targetCard:me.card, resetMask:RESET.LEAVE|RESET.FACE_DOWN});
      return;
    }
    const all = API.fieldCards({}).map(x=>x.card.uid);
    const touched = new Set();
    all.forEach(u=>{ const h = findCardByUid(u); if(h && ['mz','sz','field'].indexOf(h.zone)>=0){ touched.add(cardOwnerIndex(gameState, h.card, h.p)); API.returnToDeck(h, false, '究極宝玉神 レインボー・ドラゴン'); } });
    touched.forEach(p=>API.shuffle(p));
  },
  afterResolve(){}
});

/* ---- 宝玉の氾濫: 自分の魔法&罠カードゾーンの「宝玉獣」と名のついたカード4枚を墓地へ送って発動できる。フィールド上のカードを全て墓地へ送る。
   さらにこの効果によって墓地へ送った相手フィールド上のカードの数まで、自分の墓地の「宝玉獣」と名のついたモンスターを可能な限り特殊召喚する。 ---- */
function floodStBeastsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'sz', filter:x=>x.card!==ctx.card && x.card.face==='up' && crystalBeastDbS03(x.db)}); }
API.registerChoiceHandler('s03u242.flood-summon', (answer, args)=>{
  v49P1ChoiceCards(answer).forEach(pk=>{
    const h = pk && pk.card && pk.card.uid!=null ? findCardByUid(pk.card.uid) : null;
    if(h && h.zone==='grave' && h.p===args.player && hasMonsterZoneSpace(args.player)) API.specialSummon(args.player, 'grave', h.index, 'atk', '宝玉の氾濫');
  });
});
defineScript('宝玉の氾濫', {
  type:'spell', priority:1, includesSpecialSummon:true,
  condition(ctx){ if(floodStBeastsS03(ctx).length<4){ ctx.reason = '魔法＆罠ゾーンに「宝玉獣」カードが4枚必要です'; return false; } return true; },
  cost(ctx, done){
    v380SelectExactly('宝玉の氾濫：墓地へ送る「宝玉獣」', floodStBeastsS03(ctx), 4, sel=>{
      const us = sel.map(t=>t && t.card && t.card.uid).filter(u=>u!=null);
      if(us.length!==4){ done(false); return; }
      us.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='sz') API.sendToGrave(h, '宝玉の氾濫（コスト）'); });
      done(true);
    });
  },
  resolve(ctx){
    const me = ctx.card;
    const all = API.fieldCards({}).filter(x=>x.card!==me).map(x=>({u:x.card.uid, opp:x.p===ctx.opponent}));
    let oppSent = 0;
    all.forEach(x=>{
      const h = findCardByUid(x.u); if(!h || ['mz','sz','field'].indexOf(h.zone)<0) return;
      API.sendToGrave(h, '宝玉の氾濫');
      const g = findCardByUid(x.u);
      if(x.opp && g && g.zone==='grave') oppSent++;
    });
    const pool = API.pileCards(ctx.player, 'grave', x=>crystalBeastDbS03(x.db) && canEffectSpecialSummonS03(x.card, 'grave', '宝玉の氾濫'));
    const room = ZONE_LIMITS.mz - (gameState.players[ctx.player].mz||[]).length;
    const n = Math.min(oppSent, pool.length, room);
    if(n<=0) return;
    API.requestChoice({player:ctx.player, kind:'card', title:`宝玉の氾濫：特殊召喚する「宝玉獣」（${n}体）`, candidates:pool, min:n, max:n, cancelable:false,
      resume:{handler:'s03u242.flood-summon', args:{player:ctx.player}}, meta:{scriptName:'宝玉の氾濫'}});
  },
  afterResolve(){}
});

/* ---- レインボー・ライフ (Trap): 手札を1枚捨てて発動できる。このターンのエンドフェイズ時まで、自分は戦闘及びカードの効果によってダメージを受ける代わりに、
   その数値分だけライフポイントを回復する。 ---- */
defineScript('レインボー・ライフ', {
  type:'trap', priority:2,
  condition(ctx){ if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; } return true; },
  cost(ctx, done){ API.selectCard('レインボー・ライフ：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, 'レインボー・ライフ（コスト）'); done(true); }); },
  resolve(ctx){
    addLpRuleV18({player:ctx.player, cause:'battle', mode:'damageToRecover', turns:0, label:'レインボー・ライフ'});
    addLpRuleV18({player:ctx.player, cause:'effect', mode:'damageToRecover', turns:0, label:'レインボー・ライフ'});
  },
  afterResolve(){}
});
