/* S03-U292: ENGINE_GAP re-check 9 (2011 texts) — ライト・オブ・デストラクション, 強制接収, 怒れる類人猿, 機動砦のギア・ゴーレム, モロコシーナ, コダロス, 地縛神の復活, 再機動.
   No engine change. Reuses: the grouped Deck-to-GY / discard events (engine/1ZZN onMillBatchS03 / onDiscardBatchS03, S03-U290), forced Spell / Trap triggers,
   selfDestroyWhenS03 (engine/1ZZF) + continuous.mustAttack, API.grantDirectAttack (turn-stamped), API.createToken (the position question is asked by engine/1ZZK, S03-U289),
   the P1.1 activation-time targets (activationV11 + p11cOpen / 'p11cards.commit-targets') with the cost paid inside activationV11, the ChoiceRequest primitive with registered
   resume handlers. All top-level names carry the S292 suffix. */

/* ---- ライト・オブ・デストラクション (Continuous Trap): 相手の効果によって相手のデッキからカードが墓地へ送られた時、相手のデッキの上からカードを3枚墓地へ送る。 ----
   Forced, once per group of cards sent together from the opponent's Deck by an effect of the opponent (the group's acting players include the opponent and its reasons include
   'effect': a cost, the controller's own effect, or the controller's Deck does not count). At resolution the top 3 cards of the opponent's Deck (fewer if the Deck is smaller) are sent
   to the GY by this card's effect — its acting player is the controller, so it does not trigger itself again. Not while this card itself is being activated (S03-U295 cardBeingActivatedS03: a second trigger in the same chain is allowed). */
function lightDestructionReadyS292(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || cardBeingActivatedS03(ctx.card)) return false;
  const e = ctx.event || {};
  return ctx.eventName==='onMillBatchS03' && e.player===ctx.opponent && Number(e.count)>0 && eventSummaryByEffectS03(e)
    && Array.isArray(e.actingPlayers) && e.actingPlayers.indexOf(ctx.opponent)>=0;
}
defineUnifiedCardV4('ライト・オブ・デストラクション', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(){ return true; }, operation(){}, afterResolve(){}
},{
  key:'foe-mill-mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onMillBatchS03'], forced:true,
  condition(ctx){ return lightDestructionReadyS292(ctx); },
  operation(ctx){ API.millTop(ctx.opponent, 3, 'ライト・オブ・デストラクション'); },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, timing:['free'],
     passive:{ onMillBatchS03:ctx=>lightDestructionReadyS292(ctx) }});

/* ---- 強制接収 (Continuous Trap): 自分が手札を捨てた時に発動する事ができる。その後自分が手札を捨てる度に、相手は同じ枚数分手札を選択して捨てる。 ----
   Activation: only while its Set card can respond to the group of cards its controller discarded (onDiscardBatchS03, any cause); it is a card activation, so the discard that allowed it
   is not counted again. Once face-up (resolved), every later group of its controller's discards (cost, effect or the hand-size rule) is a forced trigger: the opponent chooses that
   many cards from their own hand (the choice is answered by the opponent) and discards them, or their whole hand if they have fewer. */
function requisitionActivateS292(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='down') return false;
  const e = ctx.event || {};
  return ctx.eventName==='onDiscardBatchS03' && e.player===ctx.player && Number(e.count)>0;
}
function requisitionReadyS292(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || cardBeingActivatedS03(ctx.card)) return false;
  const e = ctx.event || {};
  return ctx.eventName==='onDiscardBatchS03' && e.player===ctx.player && Number(e.count)>0;
}
function requisitionDiscardS292(foe, by, uids){
  uids.forEach(u=>{
    const h = findCardByUid(u);
    if(!h || h.p!==foe || h.zone!=='hand') return;
    API.discard(foe, h.index, '強制接収', {byPlayer:by});
  });
}
API.registerChoiceHandler('s03u292.requisition', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  requisitionDiscardS292(x.foe, x.by, (a.cards || []).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid));
});
defineUnifiedCardV4('強制接収', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['onDiscardBatchS03'],
  condition(ctx){ return requisitionActivateS292(ctx); }, operation(){}, afterResolve(){}
},{
  key:'discard-mirror', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDiscardBatchS03'], forced:true,
  condition(ctx){ return requisitionReadyS292(ctx); },
  operation(ctx){
    const n = Math.max(0, Number((ctx.event || {}).count) || 0), foe = ctx.opponent;
    const pool = API.pileCards(foe, 'hand');
    if(!n || !pool.length) return;
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    if(pool.length<=n){ requisitionDiscardS292(foe, ctx.player, pool.map(x=>x.card.uid)); return; }
    API.requestChoice({player:foe, kind:'card', title:`強制接収：捨てる手札を${n}枚選択`, candidates:pool, min:n, max:n, cancelable:false,
      resume:{handler:'s03u292.requisition', args:{foe, by:ctx.player}}, meta:{scriptName:'強制接収'}});
  },
  afterResolve(){}
}], {type:'trap', subtype:'永続', priority:2, timing:['free'],
     passive:{ onDiscardBatchS03:ctx=>requisitionActivateS292(ctx) || requisitionReadyS292(ctx) }});

/* ---- 怒れる類人猿: このカードが表側守備表示でフィールド上に存在する場合、このカードを破壊する。このカードのコントローラーは、このカードが攻撃可能な状態であれば必ず攻撃しなければならない。 ----
   Destroyed by the rule check while it is face-up in Defense Position (selfDestroyWhenS03). The must-attack clause is the existing continuous.mustAttack (the Battle Phase is not left
   without confirmation while it can still attack — pendingMustAttack, the same model as the TESTED カラクリ cards). */
defineScript('怒れる類人猿', {
  type:'monster', priority:1,
  selfDestroyWhenS03:(card)=> !!card && card.face==='up' && card.pos==='def' ? '怒れる類人猿：表側守備表示で存在するため破壊' : false,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, mustAttack(){ return true; } }
});

/* ---- 機動砦のギア・ゴーレム: メインフェイズ1でのみ発動する事ができる。800ライフポイントを払う。このターンこのカードは相手プレイヤーに直接攻撃をする事ができる。 ----
   Ignition, its controller's Main Phase 1 only; cost 800 LP. Resolution: while it is face-up on the field it may attack directly this turn (a turn-stamped permission that lives on the
   card in the zone, so it ends when the card leaves the field). */
defineScript('機動砦のギア・ゴーレム', {
  type:'monster', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || gameState.phase!=='main1'){ ctx.reason = '自分のメインフェイズ1でのみ発動できます'; return false; }
    if(API.me(ctx).lp<800){ ctx.reason = '800ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp<800){ done(false); return; } API.payCost(ctx.player, 800, '機動砦のギア・ゴーレム'); done(true); },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz' || me.card.face!=='up'){ API.log('機動砦のギア・ゴーレム：フィールドに表側表示で存在しないため直接攻撃できない'); return; }
    API.grantDirectAttack(me);
  },
  afterResolve(){}
});

/* ---- モロコシーナ: 1ターンに1度、自分のメインフェイズ2で500ライフポイントを払って発動する事ができる。自分フィールド上に「つぶコーントークン」(植物族・地・星1・攻/守0)1体を特殊召喚する。 ----
   Ignition, once per turn, its controller's Main Phase 2; cost 500 LP; needs a free Monster Zone. The Token's position is asked by the engine (the text gives none, S03-U289). */
defineScript('モロコシーナ', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || gameState.phase!=='main2'){ ctx.reason = '自分のメインフェイズ2に発動します'; return false; }
    if(API.me(ctx).lp<500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp<500){ done(false); return; } API.payCost(ctx.player, 500, 'モロコシーナ'); done(true); },
  resolve(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ API.log('モロコシーナ：モンスターゾーンが空いていないためトークンを特殊召喚できない'); return; }
    API.createToken(ctx.player, {name:'つぶコーントークン', atk:0, def:0, lv:1, ra:'植物', at:'地', pos:'def'}, 1);
  },
  afterResolve(){}
});

/* ---- コダロス: 自分フィールド上に表側表示で存在する「海」を墓地へ送って発動できる。相手フィールド上のカードを2枚まで選択して墓地へ送る。 ----
   Ignition, its controller's Main Phase; cost: send the face-up 「海」 in its controller's Field Zone to the GY (paid at activation). The targets (1 or 2 cards on the opponent's field:
   Monster, Spell & Trap or Field Zone, face-up or face-down) are chosen at activation. Resolution: those still on the opponent's field are sent to the GY. */
function kodarosSeaS292(p){
  const ref = dbOf({id:findCardIndex('海')});
  const f = gameState.players[p].field;
  return (f && f.face==='up' && sameCanonicalCardV4(f, ref)) ? f : null;
}
function kodarosPoolS292(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>!!x.card}); }
defineScript('コダロス', {
  type:'monster', priority:1, timing:['mainPhase'], targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!kodarosSeaS292(ctx.player)){ ctx.reason = '自分フィールド上に表側表示の「海」が存在しません'; return false; }
    if(!kodarosPoolS292(ctx).length){ ctx.reason = '相手フィールド上にカードが存在しません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    const sea = kodarosSeaS292(ctx.player);
    if(!sea){ p11cAbort(d); return; }
    ensureCardUid(gameState, sea);
    API.recordActivationCost(ctx, 'sea', [{card:sea}], [], 1);
    const h = findCardByUid(sea.uid);
    if(h && h.zone==='field') API.sendToGrave(h, 'コダロス（コスト）');
    const pool = kodarosPoolS292(ctx);
    if(!pool.length){ p11cAbort(d); return; }
    p11cOpen(d, {title:'コダロス：墓地へ送る相手フィールド上のカード（2枚まで）', candidates:pool, min:1, max:Math.min(2, pool.length), targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    let n = 0;
    (ctx.selectedTargets || []).slice(0, 2).forEach(t=>{
      const r = resolveTarget(t);
      if(!r || r.p!==ctx.opponent || ['mz','sz','field'].indexOf(r.zone)<0) return;
      API.sendToGrave(r, 'コダロス'); n++;
    });
    if(!n) API.log('コダロス：対象が相手フィールドに存在しないため不発');
  },
  afterResolve(){}
});

/* ---- 地縛神の復活 (Spell): 手札を1枚捨てて発動する。自分の墓地に存在する「地縛神」と名のついたモンスター1体とフィールド魔法カード1枚を選択して手札に加える。 ----
   Cost: discard 1 card (chosen at activation; only a card that leaves both targets available is offered — the discarded card itself is in the GY when the targets are chosen).
   The targets (one 「地縛神」 monster and one Field Spell in your GY) are chosen at activation. Resolution: those still in your GY are added to your hand. */
function revivalMonsterOkS292(x){ return !!x.db && x.db.k==='m' && isCardInGroupV4(x.db, GROUP.EARTHBOUND); }
function revivalFieldOkS292(x){ return !!x.db && x.db.k==='s' && x.db.sub==='フィールド'; }
function revivalGraveS292(p, pred){ return API.pileCards(p, 'grave', x=>x.card.face!=='down' && pred(x)); }
function revivalHandPoolS292(ctx){
  const hasM = revivalGraveS292(ctx.player, revivalMonsterOkS292).length>0, hasF = revivalGraveS292(ctx.player, revivalFieldOkS292).length>0;
  return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card && (hasM || revivalMonsterOkS292(x)) && (hasF || revivalFieldOkS292(x)));
}
API.registerChoiceHandler('s03u292.revival-cost', (a, x)=>{
  if(!x || !a) return;
  if(a.cancelled) return p11cAbort(x.activation);
  const q = p11cCards(a);
  if(!q.length) return p11cAbort(x.activation);
  p11cRecordMove(x.activation, a, 'discard', 'discard', []);
  const mons = revivalGraveS292(x.activation.player, revivalMonsterOkS292);
  if(!mons.length) return p11cAbort(x.activation);
  p11cOpen(x.activation, {title:'地縛神の復活：手札に加える「地縛神」モンスター', candidates:mons, targeting:true, cancelable:false}, 's03u292.revival-field', {});
});
API.registerChoiceHandler('s03u292.revival-field', (a, x)=>{
  if(!x || !a) return;
  if(a.cancelled) return p11cAbort(x.activation);
  const fields = revivalGraveS292(x.activation.player, revivalFieldOkS292);
  if(!fields.length) return p11cAbort(x.activation);
  p11cOpen(x.activation, {title:'地縛神の復活：手札に加えるフィールド魔法カード', candidates:fields, targeting:true, cancelable:false}, 's03u292.revival-commit', {first:p11cCards(a).map(t=>t.uid)});
});
API.registerChoiceHandler('s03u292.revival-commit', (a, x)=>{
  if(!x || !a) return;
  if(a.cancelled) return p11cAbort(x.activation);
  p11cCommit(x.activation, p11cByUid(x.first).concat(p11cCards(a)));
});
defineScript('地縛神の復活', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!revivalHandPoolS292(ctx).length){ ctx.reason = '捨てる手札、または墓地の「地縛神」モンスターとフィールド魔法カードが足りません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    const pool = revivalHandPoolS292(ctx);
    if(!pool.length){ p11cAbort(d); return; }
    p11cOpen(d, {title:'地縛神の復活：捨てる手札', candidates:pool, cancelable:false}, 's03u292.revival-cost', {});
  },
  resolve(ctx){
    let n = 0;
    (ctx.selectedTargets || []).forEach(t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='grave' || r.p!==ctx.player) return;
      API.returnToHand(r, '地縛神の復活'); n++;
    });
    if(!n) API.log('地縛神の復活：対象が墓地に存在しないため不発');
  },
  afterResolve(){}
});

/* ---- 再機動 (Spell): 自分の手札から「機皇」と名のついたモンスター1体をデッキに戻して発動する。自分の墓地に存在する「機皇」と名のついたカード1枚を選択して手札に加える。 ----
   Cost: return 1 「機皇」 monster from your hand to the Deck (chosen at activation, then the Deck is shuffled). The target (one 「機皇」 card in your GY) is chosen at activation.
   Resolution: it is added to your hand if it is still in your GY. */
function rebootHandPoolS292(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card && x.db.k==='m' && isCardInGroupV4(x.db, GROUP.MEKLORD)); }
function rebootGravePoolS292(p){ return API.pileCards(p, 'grave', x=>x.card.face!=='down' && isCardInGroupV4(x.db, GROUP.MEKLORD)); }
API.registerChoiceHandler('s03u292.reboot-cost', (a, x)=>{
  if(!x || !a) return;
  if(a.cancelled) return p11cAbort(x.activation);
  const q = p11cCards(a), d = x.activation, p = d.player;
  const h = q.length ? p11cHit(q[0].uid) : null;
  if(!h || h.zone!=='hand' || h.p!==p) return p11cAbort(d);
  API.recordActivationCost(p11cCtx(p), 'deck-return', q.slice(0, 1), [], 1);
  API.returnToDeck(h, false, '再機動（コスト）');
  API.shuffle(p);
  const pool = rebootGravePoolS292(p);
  if(!pool.length) return p11cAbort(d);
  p11cOpen(d, {title:'再機動：手札に加える「機皇」カード', candidates:pool, targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
});
defineScript('再機動', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!rebootHandPoolS292(ctx).length){ ctx.reason = '手札に「機皇」モンスターがいません'; return false; }
    if(!rebootGravePoolS292(ctx.player).length){ ctx.reason = '墓地に「機皇」カードがありません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    const pool = rebootHandPoolS292(ctx);
    if(!pool.length){ p11cAbort(d); return; }
    p11cOpen(d, {title:'再機動：デッキに戻す手札の「機皇」モンスター', candidates:pool, cancelable:false}, 's03u292.reboot-cost', {});
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t ? resolveTarget(t) : null;
    if(!r || r.zone!=='grave' || r.p!==ctx.player){ API.log('再機動：対象が墓地に存在しないため不発'); return; }
    API.returnToHand(r, '再機動');
  },
  afterResolve(){}
});
