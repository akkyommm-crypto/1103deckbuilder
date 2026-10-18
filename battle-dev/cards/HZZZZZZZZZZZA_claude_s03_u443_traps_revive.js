/* S03-U443: オーバーリミット, 儀水鏡の幻影術, ガスタへの祈り, スカーレッド・カーペット (stale ENGINE_GAP Traps, carddata texts).

   オーバーリミット        500ライフポイントを払う。このターン戦闘で破壊された攻撃力1000以下の通常モンスターを、可能な限り自分フィールド上に特殊召喚する。
   儀水鏡の幻影術          手札から「リチュア」と名のついた儀式モンスター1体を特殊召喚する。この効果で特殊召喚した儀式モンスターは攻撃できず、エンドフェイズ時に持ち主の手札に戻る。
   ガスタへの祈り          自分の墓地の「ガスタ」と名のついたモンスター2体を選択し、その2体をデッキに加えてシャッフルする。その後、自分の墓地の「ガスタ」と名のついたモンスター1体を選択して特殊召喚する。
   スカーレッド・カーペット ①：フィールドにドラゴン族Sモンスターが存在する場合、自分の墓地の「リゾネーター」モンスターを2体まで対象として発動できる。そのモンスターを特殊召喚する。

   Notes
   - オーバーリミット: LP 500 is the cost (API.payCost); the pool = Normal Monsters (printed ATK 1000 or less) of EITHER Graveyard whose graveInfo says destroyed by battle this turn (graveInfo.battle, from 'mz', turn); as many as the free Monster Zones allow are Special Summoned to my field in Attack Position (API.specialSummon from the owner's Graveyard).
   - 儀水鏡の幻影術: the Ritual 「リチュア」 monster of the hand gets card.cannotAttack and the End Phase return of S03-U441 (handler s03u441.fake-hero-return, flag u441Fake).
   - ガスタへの祈り: ChoiceRequest of 2 Graveyard 「ガスタ」 monsters -> FX_RETURN_DECK + shuffle, then a second ChoiceRequest of 1 remaining 「ガスタ」 -> Special Summon (so 3 are needed).
   - スカーレッド・カーペット: needs a face-up Dragon Synchro Monster on either field; the 1-2 「リゾネーター」 monsters of my Graveyard are chosen at the resolution (ChoiceRequest min 1 max 2) and Special Summoned while Monster Zones are free. */

/* ---- オーバーリミット ---- */
function u443Fallen(){
  const out = [];
  [0,1].forEach(p=>{ (gameState.players[p].grave||[]).forEach(c=>{ const g = c && c.graveInfo;
    if(g && g.battle && g.from==='mz' && Number(g.turn)===Number(gameState.turn) && !c.token && dbOf(c).k==='m' && (dbOf(c).st||[]).indexOf('通常')>=0 && Number(dbOf(c).atk)<=1000 && Number(dbOf(c).atk)>=0) out.push(c); }); });
  return out;
}
defineScript('オーバーリミット', {
  type:'trap', priority:2,
  condition(ctx){
    if(API.me(ctx).lp<=500){ ctx.reason = 'LPが足りません'; return false; }
    if(!u443Fallen().length){ ctx.reason = 'このターン戦闘で破壊された攻撃力1000以下の通常モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500, 'オーバーリミット'); done(true); },
  resolve(ctx){
    u443Fallen().map(c=>ensureCardUid(gameState, c)).forEach(u=>{
      if(!hasMonsterZoneSpace(ctx.player)) return;
      const h = findCardByUid(u); if(h && h.zone==='grave') API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'オーバーリミット', h.p);
    });
  },
  afterResolve(){}
});

/* ---- 儀水鏡の幻影術 ---- */
function u443Ritual(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && (x.db.st||[]).indexOf('儀式')>=0 && String(x.db.n||'').indexOf('リチュア')>=0 && canEffectSpecialSummonS03(x.card, 'hand', '儀水鏡の幻影術')); }
defineScript('儀水鏡の幻影術', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u443Ritual(ctx.player).length){ ctx.reason = '手札に「リチュア」の儀式モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u443Ritual(ctx.player); if(!pool.length) return;
    API.selectCard('儀水鏡の幻影術：特殊召喚する「リチュア」儀式モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      if(!API.specialSummon(ctx.player, 'hand', r.index, 'atk', '儀水鏡の幻影術')) return;
      const h = findCardByUid(uid); if(!h || h.zone!=='mz') return;
      API.setCardFlag(h, 'cannotAttack', true, '儀水鏡の幻影術', {silent:true});
      API.setCardFlag(h, 'u441Fake', gameState.turn, '儀水鏡の幻影術', {silent:true});
      API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u441.fake-hero-return', args:{uid, turn:gameState.turn}, note:'儀水鏡の幻影術'});
    });
  },
  afterResolve(){}
});

/* ---- ガスタへの祈り ---- */
function u443Gusta(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('ガスタ')>=0); }
API.registerChoiceHandler('s03u443.prayer-1', (answer, args)=>{
  const picks = u441Picks(answer).map(x=>x.card.uid);
  if(picks.length!==2) return;
  picks.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===args.player) act({type:'FX_RETURN_DECK', player:h.p, zone:'grave', index:h.index, toBottom:false, reason:'ガスタへの祈り'}); });
  API.shuffle(args.player);
  const pool = u443Gusta(args.player); pool.forEach(x=>ensureCardUid(gameState, x.card));
  if(pool.length && hasMonsterZoneSpace(args.player))
    API.requestChoice({kind:'card', title:'ガスタへの祈り：特殊召喚する「ガスタ」', candidates:pool, min:1, max:1, player:args.player, cancelable:false, resume:{handler:'s03u443.prayer-2', args}});
});
API.registerChoiceHandler('s03u443.prayer-2', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.zone==='grave' && h.p===args.player && hasMonsterZoneSpace(args.player)) API.specialSummon(args.player, 'grave', h.index, 'atk', 'ガスタへの祈り');
});
defineScript('ガスタへの祈り', {
  type:'trap', priority:2,
  condition(ctx){ if(u443Gusta(ctx.player).length<3){ ctx.reason = '墓地に「ガスタ」モンスターが3体以上必要です'; return false; } return true; },
  resolve(ctx){
    const pool = u443Gusta(ctx.player); if(pool.length<3) return; pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'ガスタへの祈り：デッキに戻す「ガスタ」を2体選ぶ', candidates:pool, min:2, max:2, player:ctx.player, cancelable:false, resume:{handler:'s03u443.prayer-1', args:{player:ctx.player}}});
  },
  afterResolve(){}
});

/* ---- スカーレッド・カーペット ---- */
function u443DragonSynchro(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='ドラゴン' && (x.db.st||[]).indexOf('シンクロ')>=0}); }
function u443Resonators(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('リゾネーター')>=0 && canEffectSpecialSummonS03(x.card, 'grave', 'スカーレッド・カーペット')); }
API.registerChoiceHandler('s03u443.carpet', (answer, args)=>{
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===args.player && hasMonsterZoneSpace(args.player)) API.specialSummon(args.player, 'grave', h.index, 'atk', 'スカーレッド・カーペット'); });
});
defineScript('スカーレッド・カーペット', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u443DragonSynchro().length){ ctx.reason = 'フィールドにドラゴン族シンクロモンスターがいません'; return false; }
    if(!u443Resonators(ctx.player).length){ ctx.reason = '墓地に「リゾネーター」モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u443Resonators(ctx.player); if(!pool.length) return; pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'スカーレッド・カーペット：特殊召喚する「リゾネーター」（2体まで）', candidates:pool, min:1, max:Math.min(2, pool.length), player:ctx.player, cancelable:false, resume:{handler:'s03u443.carpet', args:{player:ctx.player}}});
  },
  afterResolve(){}
});
