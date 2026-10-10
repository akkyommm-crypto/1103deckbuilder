/* S03-U216: NOT_STARTED cards (2011 texts) — 波動キャノン, 道連れ, 炎塵爆発, 猛吹雪. */

/* ---- 波動キャノン (Continuous Spell): 自分のメインフェイズ時、フィールド上に表側表示で存在するこのカードを墓地へ送る事で、このカードの発動後に経過した
   自分のスタンバイフェイズの数×1000ポイントダメージを相手ライフに与える。
   The card activation's resolution stamps its turn (waveTurnS03, onCardActivationResolvedS03); the ignition counts the controller's turns after it (each of them had a Standby Phase before this Main
   Phase), sends the card as the cost and records the count with the cost. ---- */
function waveStandbysS03(ctx){
  const T = Number(ctx.card && ctx.card.waveTurnS03), cur = Number(gameState.turn);
  if(!Number.isFinite(T)) return 0;
  let n = 0;
  for(let t=T+1; t<=cur; t++){
    const own = (gameState.activePlayer===ctx.player) ? ((cur - t) % 2 === 0) : ((cur - t) % 2 === 1);
    if(!own) continue;
    if(t===cur && ['draw','standby'].indexOf(gameState.phase)>=0) continue;
    n++;
  }
  return n;
}
function waveFireModeS03(ctx){ return ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending; }
defineScript('波動キャノン', {
  type:'spell', priority:1, timing:['mainPhase'], fieldIgnition:true,
  condition(ctx){
    if(!waveFireModeS03(ctx)) return true;                                   /* the card activation */
    if(gameState.activePlayer!==ctx.player || ['main1','main2'].indexOf(gameState.phase)<0){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    if(!waveFireModeS03(ctx)){ done(true); return; }
    const n = waveStandbysS03(ctx);
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!me || me.zone!=='sz'){ done(false); return; }
    API.recordActivationCost(ctx, 'waveStandbysS03', [], [], n);
    API.sendToGrave(me, '波動キャノン（コスト）'); done(true);
  },
  resolve(ctx){
    const c = API.activationCosts(ctx, 'waveStandbysS03')[0], n = c ? Number(c.amount)||0 : 0;
    if(n>0) API.damageLP(ctx.opponent, n*1000); else API.log('波動キャノン：経過したスタンバイフェイズはありません');
  },
  /* the card activation carries no effect (fieldIgnition); its resolution only records the turn on the card (engine/30 hook) */
  onCardActivationResolvedS03(ctx){
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
    if(me && me.zone==='sz') API.setCardFlag(me, 'waveTurnS03', gameState.turn, '波動キャノン', {silent:true});
  },
  afterResolve(){}
});

/* ---- 道連れ: フィールド上のモンスターが自分の墓地へ送られた時（戦闘で破壊され自分の墓地へ送られた時を含む）、フィールド上のモンスター1体を対象として発動できる。
   そのモンスターを破壊する。 ---- */
function companionSentS03(ctx){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player || dbOf(h.card).k!=='m') return false;
  const g = h.card.graveInfo;
  return !!(g && g.from==='mz' && Number(g.turn)===Number(gameState.turn));
}
defineScript('道連れ', {
  type:'trap', priority:2, targets:true, destroysFieldV46:true,
  condition(ctx){
    if(['onSendToGrave','onBattleDestroy','onDestroy'].indexOf(ctx.eventName)<0 || !companionSentS03(ctx)){ ctx.reason = 'フィールドのモンスターが自分の墓地へ送られた時に発動します'; return false; }
    if(!API.fieldCards({zone:'mz'}).length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('道連れ：破壊するモンスター', API.fieldCards({zone:'mz'}), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(h && h.zone==='mz') API.destroy(h, '道連れ'); },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return ctx.zone==='sz' && companionSentS03(ctx) && API.fieldCards({zone:'mz'}).length>0; },
    onBattleDestroy(ctx){ return ctx.zone==='sz' && companionSentS03(ctx) && API.fieldCards({zone:'mz'}).length>0; }
  }
});

/* ---- 炎塵爆発: 自分の墓地の「ラヴァル」と名のついたモンスターを全てゲームから除外して発動できる。このカードを発動するために除外したモンスターの数まで、
   フィールド上のカードを選んで破壊する。 (cost: banish them all; the number is recorded with the cost; the cards are chosen at resolution) ---- */
function blastLavalsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.LAVAL)); }
function blastFieldS03(ctx){ return API.fieldCards({filter:x=>!(x.card===ctx.card)}); }
registerChoiceHandlerV49('s03u216.dust-blast', (answer, args)=>{
  if(!answer || !args) return;
  (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid).forEach(u=>{ const h = findCardByUid(u); if(h && ['mz','sz','field'].indexOf(h.zone)>=0) API.destroy(h, '炎塵爆発'); });
});
defineScript('炎塵爆発', {
  type:'trap', priority:2, destroysFieldV46:true,
  condition(ctx){
    if(!blastLavalsS03(ctx).length){ ctx.reason = '墓地に「ラヴァル」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const all = blastLavalsS03(ctx).map(x=>x.card); if(!all.length){ done(false); return; }
    API.recordActivationCost(ctx, 'dustBlastS03', [], [], all.length);
    all.forEach(c=>{ const h = findCardByUid(c.uid); if(h && h.zone==='grave') API.banish(h, '炎塵爆発（コスト）'); });
    done(true);
  },
  resolve(ctx){
    const c = API.activationCosts(ctx, 'dustBlastS03')[0], n = c ? Number(c.amount)||0 : 0;
    const pool = blastFieldS03(ctx);
    if(!n || !pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:`炎塵爆発：破壊するカード（${Math.min(n, pool.length)}枚まで）`, candidates:pool, min:1, max:Math.min(n, pool.length), cancelable:false,
      resume:{handler:'s03u216.dust-blast', args:{player:ctx.player}}, meta:{scriptName:'炎塵爆発'}});
  },
  afterResolve(){}
});

/* ---- 猛吹雪: 相手のコントロールするカードの効果によって自分の罠カードが破壊され、フィールドから墓地に送られた時に発動する事ができる。
   フィールド上の魔法または罠カード1枚を破壊する。 (chosen at resolution) ---- */
function blizzardLossS03(ctx){
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player || h.card===ctx.card || dbOf(h.card).k!=='t') return false;
  const g = h.card.graveInfo;
  return !!(g && g.byDestroy && !g.battle && (g.from==='sz' || g.from==='field') && g.byPlayer===ctx.opponent && Number(g.turn)===Number(gameState.turn));
}
function blizzardPoolS03(ctx){ return API.fieldCards({filter:x=>(x.zone==='sz' || x.zone==='field') && x.card!==ctx.card}); }
defineScript('猛吹雪', {
  type:'trap', priority:2, destroysFieldV46:true,
  condition(ctx){
    if(['onDestroy','onSendToGrave'].indexOf(ctx.eventName)<0 || !blizzardLossS03(ctx)){ ctx.reason = '相手のカードの効果で自分の罠カードが破壊され墓地へ送られた時に発動します'; return false; }
    if(!blizzardPoolS03(ctx).length){ ctx.reason = 'フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  resolve(ctx){ const pool = blizzardPoolS03(ctx); if(!pool.length) return; API.selectCard('猛吹雪：破壊する魔法・罠カード', pool, t=>{ const r = resolveTarget(t); if(r) API.destroy(r, '猛吹雪'); }); },
  afterResolve(){},
  passive:{
    onDestroy(ctx){ return ctx.zone==='sz' && blizzardLossS03(ctx) && blizzardPoolS03(ctx).length>0; },
    onSendToGrave(ctx){ return ctx.zone==='sz' && blizzardLossS03(ctx) && blizzardPoolS03(ctx).length>0; }
  }
});
