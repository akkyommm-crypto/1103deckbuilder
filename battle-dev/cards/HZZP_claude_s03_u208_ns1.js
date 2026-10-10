/* S03-U208: NOT_STARTED cards (2011 texts) — ラヴァルの炎車回し, ナチュル・マロン, スクラップ・コング, 貫ガエル.
   Pools / choices: engine/1ZT + cards/HZZF / HZZI helpers. Engine: FX_TO_GRAVE records the effect source (graveInfo.srcUidS03). */

/* ---- ラヴァルの炎車回し: このカードが戦闘によって破壊され墓地へ送られた時、デッキから「ラヴァル」と名のついたモンスター2体を墓地へ送る事ができる。 ---- */
registerChoiceHandlerV49('s03u208.mill-many', (answer, args)=>{
  if(!answer || !args) return;
  (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='deck' && h.p===args.player) API.mill(args.player, h.index, args.reason); });
});
defineScript('ラヴァルの炎車回し', {
  type:'monster', priority:1, activateFrom:['grave'], dsTiming:'leave',
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || ctx.zone!=='grave' || !eventIsSelfS03(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
    if(API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.LAVAL)).length < 2){ ctx.reason = 'デッキに「ラヴァル」モンスターが2体必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.LAVAL));
    const k = Math.min(2, pool.length); if(!k) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'ラヴァルの炎車回し：墓地へ送る「ラヴァル」（2体）', candidates:pool, min:k, max:k, cancelable:false,
      resume:{handler:'s03u208.mill-many', args:{player:ctx.player, reason:'ラヴァルの炎車回し'}}, meta:{scriptName:'ラヴァルの炎車回し'}});
  },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx); } }
});

/* ---- ナチュル・マロン: このカードが召喚に成功した時、自分のデッキから「ナチュル」と名のついたモンスター1体を墓地へ送る事ができる。また、1ターンに1度、
   自分の墓地に存在する「ナチュル」と名のついたモンスター2体を選択してデッキに戻し、自分のデッキからカードを1枚ドローする事ができる。 ---- */
poolSpecS03('ナチュル・マロン', {action:'mill', filter:{set:SETCODE.NATURIA}});
function marronGraveS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.NATURIA)); }
defineScript('ナチュル・マロン', {
  type:'monster', priority:1, timing:['summon','mainPhase'], targets:true,
  condition(ctx){
    if(ctx.eventName==='onNormalSummon'){ if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; } return true; }
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || gameState.activePlayer!==ctx.player || ['main1','main2'].indexOf(gameState.phase)<0){ ctx.reason = '自分メインフェイズに発動します'; return false; }
    if(Number(ctx.card.marronTurnS03)===Number(gameState.turn)){ ctx.reason = '1ターンに1度です'; return false; }
    if(marronGraveS03(ctx).length<2){ ctx.reason = '墓地に「ナチュル」モンスターが2体必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.eventName==='onNormalSummon'){ done([]); return; }
    v380SelectExactly('ナチュル・マロン：デッキに戻す「ナチュル」（2体）', marronGraveS03(ctx), 2, sel=>{
      const me = findCardByUid(ctx.card.uid); if(me && me.zone==='mz') API.setCardFlag(me, 'marronTurnS03', gameState.turn, 'ナチュル・マロン', {silent:true});
      done(sel);
    });
  },
  resolve(ctx){
    if(ctx.eventName==='onNormalSummon'){ askMillS03(ctx, 'ナチュル・マロン', 'ナチュル・マロン：墓地へ送る「ナチュル」'); return; }
    const hs = (ctx.selectedTargets||[]).map(t=>t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null).filter(h=>h && h.zone==='grave');
    if(hs.length<2){ API.log('ナチュル・マロン：対象が揃っていないため不発'); return; }
    hs.forEach(h=>{ const n = findCardByUid(h.card.uid); if(n && n.zone==='grave') API.returnToDeck(n, false, 'ナチュル・マロン'); });
    API.shuffle(ctx.player);
    API.draw(ctx.player, 1, 'ナチュル・マロン');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }
});

/* ---- スクラップ・コング: このカードが召喚に成功した時、このカードを破壊する。このカードが「スクラップ」と名のついたカードの効果によって破壊され墓地へ送られた
   場合、「スクラップ・コング」以外の自分の墓地に存在する「スクラップ」と名のついたモンスター1体を選択して手札に加える事ができる。 ---- */
function scrapDestroyedS03(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  if(!(g && g.byDestroy && !g.battle && Number(g.turn)===Number(gameState.turn) && g.srcUidS03!=null)) return false;
  const s = findCardByUid(g.srcUidS03);
  return !!(s && String(dbOf(s.card).n||'').indexOf('スクラップ')>=0);
}
function kongTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && x.db.k==='m' && v380IsScrap(x.card) && x.db.n!=='スクラップ・コング'); }
defineScript('スクラップ・コング', {
  type:'monster', priority:1, activateFrom:['grave'], targets:true,
  forcedForEventS03(eventName){ return eventName==='onNormalSummon'; },
  condition(ctx){
    if(ctx.eventName==='onNormalSummon'){ if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; } return true; }
    if(ctx.eventName==='onSendToGrave'){
      if(ctx.zone!=='grave' || !eventIsSelfS03(ctx) || !scrapDestroyedS03(ctx)){ ctx.reason = '「スクラップ」の効果で破壊され墓地へ送られた場合に発動します'; return false; }
      if(!kongTargetsS03(ctx).length){ ctx.reason = '墓地に他の「スクラップ」モンスターがいません'; return false; }
      return true;
    }
    ctx.reason = '召喚成功時、または「スクラップ」の効果で破壊された場合に発動します'; return false;
  },
  selectTargets(ctx, done){
    if(ctx.eventName==='onNormalSummon'){ done([]); return; }
    API.selectCard('スクラップ・コング：手札に加える「スクラップ」', kongTargetsS03(ctx), t=>done([t]));
  },
  resolve(ctx){
    if(ctx.eventName==='onNormalSummon'){ const me = findCardByUid(ctx.card.uid); if(me && me.zone==='mz') API.destroy(me, 'スクラップ・コング'); return; }
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave') API.returnToHand(h, 'スクラップ・コング');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
            onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && scrapDestroyedS03(ctx) && kongTargetsS03(ctx).length>0; } }
});

/* ---- 貫ガエル: このカードは相手プレイヤーに直接攻撃できる。このカードが直接攻撃によって相手ライフに戦闘ダメージを与えた時、自分フィールド上に「貫ガエル」以外の
   「ガエル」と名のついたモンスターが存在する場合、相手フィールド上の魔法・罠カード1枚を選択して破壊できる。 ---- */
function nukiOtherFrogS03(ctx){ return API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card!==ctx.card && x.card.face==='up' && String(x.db.n||'').indexOf('ガエル')>=0 && x.db.n!=='貫ガエル'}).length>0; }
function nukiTargetsS03(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>(x.zone==='sz'||x.zone==='field') && x.card}); }
defineScript('貫ガエル', {
  type:'monster', priority:1, canDirectAttack:true, targets:true,
  condition(ctx){
    const e = ctx.event || {};
    if(ctx.eventName!=='onDirectBattleDamage' || ctx.zone!=='mz' || e.attackerUid!==ctx.card.uid){ ctx.reason = '直接攻撃で戦闘ダメージを与えた時に発動します'; return false; }
    if(!nukiOtherFrogS03(ctx)){ ctx.reason = '他の「ガエル」が必要です'; return false; }
    if(!nukiTargetsS03(ctx).length){ ctx.reason = '相手フィールドに魔法・罠がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('貫ガエル：破壊する相手の魔法・罠', nukiTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(h && (h.zone==='sz'||h.zone==='field')) API.destroy(h, '貫ガエル'); },
  afterResolve(){},
  passive:{ onDirectBattleDamage(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && e.attackerUid===ctx.card.uid && nukiOtherFrogS03(ctx) && nukiTargetsS03(ctx).length>0; } }
});
