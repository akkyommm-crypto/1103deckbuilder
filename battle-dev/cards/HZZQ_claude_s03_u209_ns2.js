/* S03-U209: NOT_STARTED cards (2011 texts) — ウォール・シャドウ, カウンター・カウンター, エヴォルド・ゲフィロス, ガスタ・ファルコ, X－セイバー パロムロ,
   X－セイバー アクセル, ジャンクBOX, インフェルニティ・ブレイク, D－HERO ドレッドサーヴァント. Shared helpers: engine/1ZT, cards/HZZF / HZZH / HZZI. */

/* ---- ウォール・シャドウ: 「迷宮変化」の効果でしか特殊召喚できない。 — the restriction is the engine's (1ZK, from the text); the card has no other effect. ---- */
defineScript('ウォール・シャドウ', {type:'monster', priority:1});

/* ---- カウンター・カウンター: カウンター罠カードの発動を無効にし破壊する。 (a Counter Trap response to a Counter Trap activation; engine/1P) ---- */
function counterCounterLinkS03(ctx){
  const e = ctx.event || {};
  if(e.kind!=='trap' || e.sub!=='counter') return null;
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  return (l && l.cardActivationS03===true) ? l : null;
}
defineScript('カウンター・カウンター', {
  type:'trap', priority:3,
  condition(ctx){ if(!counterCounterLinkS03(ctx)){ ctx.reason = 'カウンター罠カードが発動した時に発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'カウンター・カウンター', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!counterCounterLinkS03(ctx); } }
});
declareActivationResponseS03(['カウンター・カウンター']);

/* ---- エヴォルド・ゲフィロス: このカードが戦闘によって破壊され墓地へ送られた時、自分の墓地に存在する「エヴォルダー」と名のついたモンスター1体を選択して
   特殊召喚する事ができる。 ---- */
function gephyrosTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && x.db.k==='m' && String(x.db.n||'').indexOf('エヴォルダー')>=0); }
defineScript('エヴォルド・ゲフィロス', {
  type:'monster', priority:1, activateFrom:['grave'], targets:true, dsTiming:'leave', blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || ctx.zone!=='grave' || !eventIsSelfS03(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    if(!gephyrosTargetsS03(ctx).length){ ctx.reason = '墓地に「エヴォルダー」がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('エヴォルド・ゲフィロス：特殊召喚する「エヴォルダー」', gephyrosTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'エヴォルド・ゲフィロス'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && gephyrosTargetsS03(ctx).length>0; } }
});

/* ---- ガスタ・ファルコ: フィールド上に表側表示で存在するこのカードが戦闘以外によって墓地へ送られた時、デッキから「ガスタ」と名のついたモンスター1体を裏側守備表示で
   特殊召喚できる。 ---- */
declareDeckTriggerS03('ガスタ・ファルコ', {when:'fieldToGrave', faceUp:true, action:'summon', optional:true, pos:'faceDownDef', filter:{set:SETCODE.GUSTO},
  extra(ctx){ const g = ctx.card && ctx.card.graveInfo; return (g && !g.battle) ? '' : '戦闘以外によって墓地へ送られた時に発動します'; }});

/* ---- X－セイバー パロムロ: このカードが墓地に存在し、自分フィールド上の「セイバー」と名のついたモンスターが戦闘によって破壊され墓地へ送られた時、
   500ライフポイントを払う事で、このカードを墓地から特殊召喚する。 ---- */
function saberBattleLossS03(ctx){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.zone!=='grave' || h.p!==ctx.player || h.card===ctx.card) return false;
  const g = h.card.graveInfo;
  return !!(g && g.battle && g.byDestroy && Number(g.turn)===Number(gameState.turn) && String(dbOf(h.card).n||'').indexOf('セイバー')>=0);
}
defineScript('X－セイバー パロムロ', {
  type:'monster', priority:1, activateFrom:['grave'], dsTiming:'leave', blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || ctx.zone!=='grave' || !saberBattleLossS03(ctx)){ ctx.reason = '自分の「セイバー」が戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    if(API.me(ctx).lp < 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){ const me = findCardByUid(ctx.card.uid); if(me && me.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'X－セイバー パロムロ'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='grave' && saberBattleLossS03(ctx) && API.me(ctx).lp>=500 && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- X－セイバー アクセル: このカードが自分フィールド上に表側表示で存在する限り、「セイバー」と名のついたモンスターが戦闘によって破壊され墓地へ送られた時、
   デッキからカードを1枚ドローする。 (forced; any 「セイバー」, either side) ---- */
function accelSaberLossS03(ctx){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.zone!=='grave') return false;
  const g = h.card.graveInfo;
  return !!(g && g.battle && g.byDestroy && Number(g.turn)===Number(gameState.turn) && String(dbOf(h.card).n||'').indexOf('セイバー')>=0);
}
defineScript('X－セイバー アクセル', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || ctx.zone!=='mz' || ctx.card.face!=='up' || !accelSaberLossS03(ctx)){ ctx.reason = '「セイバー」が戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1, 'X－セイバー アクセル'); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && accelSaberLossS03(ctx); } }
});

/* ---- ジャンクBOX: 自分の墓地からレベル4以下の「D」と名のついたモンスター1体を選択して特殊召喚する。この効果で特殊召喚したモンスターはこのターンの
   エンドフェイズ時に破壊される。 ---- */
function junkBoxTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && (x.db.lv||99)<=4 && /^D[・－]/.test(String(x.db.n||''))); }
defineScript('ジャンクBOX', {
  type:'spell', priority:1, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!junkBoxTargetsS03(ctx).length){ ctx.reason = '墓地にレベル4以下の「D」がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ジャンクBOX：特殊召喚する「D」', junkBoxTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    const u = h.card.uid;
    API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'ジャンクBOX');
    const now = findCardByUid(u); if(now && now.zone==='mz') v340ScheduleEndDestroy(now.card, ctx.player, 'ジャンクBOX（エンドフェイズに破壊）');
  }
});

/* ---- インフェルニティ・ブレイク: 自分の手札が0枚の場合に発動できる。自分の墓地の「インフェルニティ」と名のついたカード1枚を選択してゲームから除外し、相手フィールド上の
   カード1枚を選択して破壊する。 ---- */
function infBreakGraveS03(ctx){ return API.pileCards(ctx.player,'grave',x=>String(x.db.n||'').indexOf('インフェルニティ')>=0 && x.card!==ctx.card); }
defineScript('インフェルニティ・ブレイク', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(API.me(ctx).hand.length){ ctx.reason = '手札が0枚の場合に発動できます'; return false; }
    if(!infBreakGraveS03(ctx).length){ ctx.reason = '墓地に「インフェルニティ」カードがありません'; return false; }
    if(!API.fieldCards({player:ctx.opponent}).length){ ctx.reason = '相手フィールドにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('インフェルニティ・ブレイク：除外する「インフェルニティ」', infBreakGraveS03(ctx), a=>
    API.selectCard('インフェルニティ・ブレイク：破壊する相手のカード', API.fieldCards({player:ctx.opponent}), b=>done([a,b]))); },
  resolve(ctx){
    const by = t=>t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    const a = by(ctx.selectedTargets[0]), b = by(ctx.selectedTargets[1]);
    if(a && a.zone==='grave') API.banish(a, 'インフェルニティ・ブレイク');
    if(b && ['mz','sz','field'].indexOf(b.zone)>=0) API.destroy(b, 'インフェルニティ・ブレイク');
  }
});

/* ---- D－HERO ドレッドサーヴァント: このカードが召喚に成功した時、「幽獄の時計塔」に時計カウンターを1つ置く。このカードが戦闘によって破壊され墓地へ送られた時、
   自分フィールド上の魔法・罠カード1枚を破壊する事ができる。 ---- */
function dreadTowerS03(){ const out=[]; [0,1].forEach(p=>{ const f = gameState.players[p].field; if(f && f.face==='up' && cardName(f)==='幽獄の時計塔') out.push({p, zone:'field', index:0, card:f}); }); return out; }
function dreadOwnStS03(ctx){ return API.fieldCards({player:ctx.player, filter:x=>(x.zone==='sz'||x.zone==='field') && x.card}); }
defineScript('D－HERO ドレッドサーヴァント', {
  type:'monster', priority:1, activateFrom:['grave'], targets:true, dsTiming:'leave',
  forcedForEventS03(eventName){ return eventName==='onNormalSummon'; },
  condition(ctx){
    if(ctx.eventName==='onNormalSummon'){ if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; } if(!dreadTowerS03().length){ ctx.reason = '「幽獄の時計塔」がありません'; return false; } return true; }
    if(ctx.eventName==='onBattleDestroy'){ if(ctx.zone!=='grave' || !eventIsSelfS03(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動します'; return false; } if(!dreadOwnStS03(ctx).length){ ctx.reason = '自分フィールドに魔法・罠カードがありません'; return false; } return true; }
    ctx.reason = '召喚成功時、または戦闘破壊時に発動します'; return false;
  },
  selectTargets(ctx, done){
    if(ctx.eventName==='onNormalSummon'){ done([]); return; }
    API.selectCard('ドレッドサーヴァント：破壊する自分の魔法・罠', dreadOwnStS03(ctx), t=>done([t]));
  },
  resolve(ctx){
    if(ctx.eventName==='onNormalSummon'){ const t = dreadTowerS03()[0]; if(t) API.addCounter(t, '時計', 1); return; }
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && (h.zone==='sz'||h.zone==='field')) API.destroy(h, 'D－HERO ドレッドサーヴァント');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && dreadTowerS03().length>0; },
            onBattleDestroy(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && dreadOwnStS03(ctx).length>0; } }
});
