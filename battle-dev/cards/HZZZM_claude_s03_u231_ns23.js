/* S03-U231: NOT_STARTED cards (2011 texts) — プロミネンス・ドラゴン, エクストリオの牙, 呪術抹消, 神聖なる森, ネクロ・リンカー, サシカエル, ウィクトーリア. */

/* ---- プロミネンス・ドラゴン: 自分フィールド上にこのカード以外の炎族モンスターが存在する場合、このカードを攻撃する事はできない。
   自分のターンのエンドフェイズ時、このカードは相手ライフに500ポイントダメージを与える。 (forced) ---- */
function promReadyS03(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='end' && gameState.activePlayer===ctx.player; }
defineScript('プロミネンス・ドラゴン', {
  type:'monster', priority:1, forced:true,
  condition(ctx){ if(!promReadyS03(ctx)){ ctx.reason = '自分のエンドフェイズに発動します'; return false; } return true; },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target===self && self.face==='up' && (function(){ const loc = locateCard(self); return !!loc && (gameState.players[loc.p].mz||[]).some(c=>c && c!==self && c.face==='up' && currentRaceV17(c)==='炎'); })() },
  passive:{ onEndPhase(ctx){ return promReadyS03(ctx); } }
});

/* ---- エクストリオの牙 (Counter Trap): 自分フィールド上に「ナチュル」と名のついたモンスターが表側表示で存在する場合に発動する事ができる。
   相手が発動した魔法・罠カードの発動を無効にし破壊する。その後、自分の手札を1枚墓地へ送る。 ---- */
function naturiaUpS03(ctx){ return (gameState.players[ctx.player].mz||[]).some(c=>c && c.face==='up' && isSetCardV4(dbOf(c), SETCODE.NATURIA)); }
function extrioLinkS03(ctx){ return counterTopCardLinkS03(ctx, e=>(e.kind==='spell' || e.kind==='trap') && e.player===ctx.opponent); }
defineScript('エクストリオの牙', {
  type:'trap', priority:3,
  condition(ctx){
    if(!extrioLinkS03(ctx)){ ctx.reason = '相手が魔法・罠カードを発動した時に発動します'; return false; }
    if(!naturiaUpS03(ctx)){ ctx.reason = '表側表示の「ナチュル」がいません'; return false; }
    return true;
  },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', 'エクストリオの牙', true);
    const hand = API.pileCards(ctx.player,'hand'); if(!hand.length) return;
    API.selectCard('エクストリオの牙：墓地へ送る手札', hand, t=>{ const r = resolveTarget(t); if(r && r.zone==='hand') API.sendHandToGrave(ctx.player, r.index, 'エクストリオの牙'); });
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!extrioLinkS03(ctx) && naturiaUpS03(ctx); } }
});

/* ---- 呪術抹消 (Counter Trap): 手札からカードを2枚捨てる。魔法カードの発動を無効にし、それを破壊する。さらに相手の手札とデッキを確認し、
   破壊した魔法カードと同名のカードがあった場合全て墓地へ送る。 (cost: the 2 discards) ---- */
function curseLinkS03(ctx){ return counterTopCardLinkS03(ctx, e=>e.kind==='spell'); }
defineScript('呪術抹消', {
  type:'trap', priority:3,
  condition(ctx){
    if(!curseLinkS03(ctx)){ ctx.reason = '魔法カードが発動した時に発動します'; return false; }
    if(API.me(ctx).hand.filter(c=>c!==ctx.card).length<2){ ctx.reason = '捨てる手札が2枚ありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pick = (k)=>{
      if(!k){ done(true); return; }
      API.selectCard('呪術抹消：捨てる手札（残り'+k+'枚）', API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, '呪術抹消（コスト）', {byEffect:false}); pick(k-1); });
    };
    pick(2);
  },
  resolve(ctx){
    const e = ctx.event || {}, l = (gameState.chain||[])[Number(e.chainLink)-1];
    const name = (e.cardId!=null && CARD_DB[e.cardId]) ? CARD_DB[e.cardId].n : (l && l.name);
    const foe = (e.player===0 || e.player===1) ? e.player : ctx.opponent;
    API.negateChainLink(ctx.event, 'activation', '呪術抹消', true);
    if(!name) return;
    const P = gameState.players[foe];
    for(let i=(P.hand||[]).length-1;i>=0;i--){ if(cardName(P.hand[i])===name) API.sendHandToGrave(foe, i, '呪術抹消'); }
    for(let i=(P.deck||[]).length-1;i>=0;i--){ if(cardName(P.deck[i])===name) API.mill(foe, i, '呪術抹消'); }
    API.log(`呪術抹消：相手の手札とデッキを確認した（${name}）`);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!curseLinkS03(ctx) && API.me(ctx).hand.length>=2; } }
});

/* ---- 神聖なる森 (Continuous Spell): 自分フィールド上の植物族・獣族・獣戦士族モンスターは、1ターンに1度だけ戦闘では破壊されない。この効果は1ターンに1度しか適用できない。
   (protectV21, counted on the source: one use per turn across the monsters) ---- */
defineScript('神聖なる森', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['sz'], apply(){ return null; },
    protectV21:{ key:'神聖なる森', label:'神聖なる森', scope:'ownMonsters', perTurn:1, perTurnScope:'source',
      battle:(target)=> !!target && target.face==='up' && ['植物','獣','獣戦士'].indexOf(currentRaceV17(target))>=0 } }
});

/* ---- ネクロ・リンカー: このカードをリリースし、自分の墓地に存在する「シンクロン」と名のついたチューナー1体を選択して発動する。選択したモンスターを特殊召喚する。
   この効果で特殊召喚したモンスターは、このターンシンクロ素材とする事はできない。 (cost: the release) ---- */
function linkerTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && (x.db.st||[]).indexOf('チューナー')>=0 && isSetCardV4(x.db, SETCODE.SYNCHRON) && canEffectSpecialSummonS03(x.card,'grave','ネクロ・リンカー')); }
defineScript('ネクロ・リンカー', {
  type:'monster', priority:1, timing:['mainPhase'], targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!linkerTargetsS03(ctx).length){ ctx.reason = '墓地に「シンクロン」チューナーがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'ネクロ・リンカー（リリース）'); done(true); },
  selectTargets(ctx, done){ API.selectCard('ネクロ・リンカー：特殊召喚する「シンクロン」', linkerTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return; const u = h.card.uid;
    if(API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'ネクロ・リンカー')===false) return;
    const now = findCardByUid(u); if(now && now.zone==='mz') API.setCardFlag(now, 'noSynchroMaterialTurnS03', gameState.turn, 'ネクロ・リンカー', {silent:true});
  },
  afterResolve(){}
});

/* ---- サシカエル: 自分フィールド上に存在する水族モンスター1体をリリースし、自分の墓地に存在する「ガエル」と名のついたモンスター1体を選択して発動する。
   選択したモンスターを墓地から特殊召喚する。この効果は1ターンに1度しか使用できない。 (cost: the release, itself possible) ---- */
function sashiCostsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && !x.card.cannotTribute && currentRaceV17(x.card)==='水'}); }
function sashiTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && String(x.db.n||'').indexOf('ガエル')>=0 && canEffectSpecialSummonS03(x.card,'grave','サシカエル')); }
defineScript('サシカエル', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!sashiCostsS03(ctx).length){ ctx.reason = 'リリースする水族モンスターがいません'; return false; }
    if(!sashiTargetsS03(ctx).length){ ctx.reason = '墓地に「ガエル」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('サシカエル：リリースする水族モンスター', sashiCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, 'サシカエル（リリース）'); done(true); }); },
  selectTargets(ctx, done){ API.selectCard('サシカエル：特殊召喚する「ガエル」', sashiTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'サシカエル'); },
  afterResolve(){}
});

/* ---- ウィクトーリア: 1ターンに1度、相手の墓地に存在するドラゴン族モンスター1体を選択して自分フィールド上に特殊召喚する事ができる。
   このカードがフィールド上に表側表示で存在する限り、相手は表側表示で存在する他の天使族モンスターを攻撃対象に選択する事はできない。 ---- */
function victoriaTargetsS03(ctx){ return API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m' && x.db.ra==='ドラゴン' && canEffectSpecialSummonS03(x.card,'grave','ウィクトーリア')); }
defineScript('ウィクトーリア', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!victoriaTargetsS03(ctx).length){ ctx.reason = '相手の墓地にドラゴン族がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ウィクトーリア：特殊召喚するドラゴン族', victoriaTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'ウィクトーリア', h.p); },
  afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target!==self && self.face==='up' && target.face==='up' && currentRaceV17(target)==='天使' }
});
declareActivationResponseS03(['エクストリオの牙','呪術抹消']);
