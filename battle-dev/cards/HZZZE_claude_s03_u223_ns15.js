/* S03-U223: NOT_STARTED cards (2011 texts) — 畳返し, ツバメ返し, 黒光りするG, 黒蠍－棘のミーネ, スケイルモース. */

/* ---- 畳返し / ツバメ返し (Counter Traps): 召喚（ツバメ返し：特殊召喚）成功時に発動する効果モンスターの効果の発動を無効にし破壊する。 ---- */
function summonTriggerLinkS03(ctx, eventName){
  const e = ctx.event || {};
  if(e.kind!=='monster') return null;
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  return (l && l.eventName===eventName) ? l : null;
}
defineScript('畳返し', {
  type:'trap', priority:3,
  condition(ctx){ if(!summonTriggerLinkS03(ctx, 'onNormalSummon')){ ctx.reason = '召喚成功時に発動した効果モンスターの効果に対して発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '畳返し', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!summonTriggerLinkS03(ctx, 'onNormalSummon'); } }
});
defineScript('ツバメ返し', {
  type:'trap', priority:3,
  condition(ctx){ if(!summonTriggerLinkS03(ctx, 'onSpecialSummon')){ ctx.reason = '特殊召喚成功時に発動した効果モンスターの効果に対して発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ツバメ返し', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!summonTriggerLinkS03(ctx, 'onSpecialSummon'); } }
});
declareActivationResponseS03(['畳返し','ツバメ返し']);

/* ---- 黒光りするG: 相手フィールド上にシンクロモンスター1体のみが特殊召喚された時、墓地のこのカードをゲームから除外して発動できる。そのシンクロモンスターを選択して
   破壊する。この効果は相手ターンでも発動できる。 (cost: banish itself) ---- */
function shinyGTargetS03(ctx){
  if(ctx.zone!=='grave') return null;
  const e = ctx.event || {};
  if(e.player!==ctx.opponent) return null;
  if(Array.isArray(e.uids) && e.uids.length!==1) return null;
  const h = e.uid!=null ? findCardByUid(e.uid) : (Array.isArray(e.uids) && e.uids.length===1 ? findCardByUid(e.uids[0]) : null);
  return (h && h.zone==='mz' && h.p===ctx.opponent && (dbOf(h.card).st||[]).indexOf('シンクロ')>=0) ? h : null;
}
defineScript('黒光りするG', {
  type:'monster', priority:1, activateFrom:['grave'], onOtherSummon:true, targets:true, destroysFieldV46:true,
  condition(ctx){ if(ctx.eventName!=='onSpecialSummon' || !shinyGTargetS03(ctx)){ ctx.reason = '相手がシンクロモンスター1体のみを特殊召喚した時に発動します'; return false; } return true; },
  cost(ctx, done){ const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!me || me.zone!=='grave'){ done(false); return; } API.banish(me, '黒光りするG（コスト）'); done(true); },
  selectTargets(ctx, done){ const h = shinyGTargetS03(ctx); done(h ? [h] : []); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null; if(h && h.zone==='mz') API.destroy(h, '黒光りするG'); },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return !!shinyGTargetS03(ctx); } }
});

/* ---- 黒蠍－棘のミーネ: このカードが相手プレイヤーに戦闘ダメージを与えた時、次の効果から1つを選択して発動する事ができる。
   ●「黒蠍」という名のついたカードを自分のデッキから1枚手札に加える。 ●「黒蠍」という名のついたカードを自分の墓地から1枚手札に加える。 ---- */
function scorpDeckS03(ctx){ return API.pileCards(ctx.player,'deck',x=>String(x.db.n||'').indexOf('黒蠍')>=0); }
function scorpGraveS03(ctx){ return API.pileCards(ctx.player,'grave',x=>String(x.db.n||'').indexOf('黒蠍')>=0); }
function meeneTakeS03(p, mode){
  const ctx = {player:p};
  const pool = mode==='grave' ? scorpGraveS03(ctx) : scorpDeckS03(ctx);
  if(!pool.length){ if(mode!=='grave') API.shuffle(p); return; }
  API.selectCard('黒蠍－棘のミーネ：手札に加える「黒蠍」', pool, t=>{ const r = resolveTarget(t); if(!r) return;
    if(r.zone==='deck') API.searchDeck(p, r.index, '黒蠍－棘のミーネ'); else if(r.zone==='grave') API.returnToHand(r, '黒蠍－棘のミーネ'); });
}
defineScript('黒蠍－棘のミーネ', {
  type:'monster', priority:1,
  condition(ctx){
    if(ctx.zone!=='mz' || !a3DealtBattleDamage(ctx)){ ctx.reason = '相手に戦闘ダメージを与えた時に発動します'; return false; }
    if(!scorpDeckS03(ctx).length && !scorpGraveS03(ctx).length){ ctx.reason = 'デッキ・墓地に「黒蠍」カードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const opts = [];
    if(scorpDeckS03(ctx).length) opts.push({key:'deck', label:'デッキから「黒蠍」を手札に加える'});
    if(scorpGraveS03(ctx).length) opts.push({key:'grave', label:'墓地から「黒蠍」を手札に加える'});
    if(!opts.length) return;
    if(opts.length===1){ meeneTakeS03(ctx.player, opts[0].key); return; }
    API.requestChoice({player:ctx.player, kind:'declare', title:'黒蠍－棘のミーネ：効果を選択', candidates:opts.map(o=>Object.assign({value:o.key}, o)), min:1, max:1, cancelable:false,
      legacy:{onPick:(x)=>meeneTakeS03(ctx.player, x && x.value==='grave' ? 'grave' : 'deck')}});
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){ return ctx.zone==='mz' && a3DealtBattleDamage(ctx) && (scorpDeckS03(ctx).length>0 || scorpGraveS03(ctx).length>0); } }
});

/* ---- スケイルモース: このカードがフィールド上に表側表示で存在する限り、お互いのプレイヤーは1ターンに1度しかモンスターを特殊召喚する事ができない。
   (a player who has already special summoned this turn — P.ssHistory — is locked; engine/40 specialSummonLockS03) ---- */
defineScript('スケイルモース', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db, p)=> (gameState.players[p].ssHistory||[]).some(x=>x && Number(x.turn)===Number(gameState.turn))
});
