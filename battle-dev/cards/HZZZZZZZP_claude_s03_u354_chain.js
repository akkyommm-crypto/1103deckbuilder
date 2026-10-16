/* S03-U354: four chain-count cards (carddata texts).

   連鎖爆撃       （速攻魔法）チェーン2以降に発動できる。このカードの発動時に積まれているチェーンの数×400ダメージを相手に与える。同一チェーン上に複数回同名カードの効果が発動している場合、発動できない。
   一陣の風       （速攻魔法）チェーン3以降に発動できる。フィールドの魔法または罠カード1枚を破壊する。同一チェーン上に複数回同名カードの効果が発動している場合、発動できない。
   積み上げる幸福 （罠）チェーン4以降に発動できる。デッキからカードを2枚ドローする。同一チェーン上に複数回同名カードの効果が発動している場合、発動できない。
   奇跡の蘇生     （速攻魔法）チェーン4以降に発動できる。自分または相手の墓地のモンスター1体を選択し、自分フィールドに特殊召喚する。同一チェーン上に複数回同名カードの効果が発動している場合、発動できない。

   Notes
   - 「チェーンN以降」 = this card would be link N or later: the chain already holds N-1 or more links when it is activated (gameState.chain.length >= N-1). 「同一チェーン上に複数回同名カードの効果が発動している」 = any name appears twice among the links (gameState.chain[].name).
   - 連鎖爆撃: the damage counts the links stacked when it was activated, so the count is taken at activation (cost step) and stored on the card. */

function u354ChainOk(ctx, n){
  const ch = gameState.chain || [];
  if(ch.length < n-1){ ctx.reason = 'チェーン'+n+'以降に発動できます'; return false; }
  const seen = {};
  for(let i=0;i<ch.length;i++){ const nm = ch[i] && ch[i].name; if(nm==null) continue; if(seen[nm]){ ctx.reason = '同一チェーン上に複数回同名カードの効果が発動しています'; return false; } seen[nm] = 1; }
  return true;
}

/* ---- 連鎖爆撃 ---- */
defineScript('連鎖爆撃', {
  type:'spell', priority:2, quickEffect:true,
  condition(ctx){ return u354ChainOk(ctx, 2); },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(h) API.setCardFlag(h, 'u354Links', (gameState.chain||[]).length, '連鎖爆撃', {silent:true}); done(true); },
  resolve(ctx){ const n = Number(ctx.card.u354Links)||0; if(n>0) API.damageLP(ctx.opponent, n*400, '連鎖爆撃'); },
  afterResolve(){}
});

/* ---- 一陣の風 ---- */
defineScript('一陣の風', {
  type:'spell', priority:2, quickEffect:true,
  condition(ctx){
    if(!u354ChainOk(ctx, 3)) return false;
    if(!API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).length){ ctx.reason = 'フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).filter(x=>x.card!==ctx.card); if(!pool.length) return;
    API.selectCard('一陣の風：破壊するフィールドの魔法・罠カード', pool, t=>{ const r = t && resolveTarget(t); if(r && (r.zone==='sz'||r.zone==='field')) API.destroy(r, '一陣の風'); });
  },
  afterResolve(){}
});

/* ---- 積み上げる幸福 ---- */
defineScript('積み上げる幸福', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u354ChainOk(ctx, 4)) return false;
    if(API.me(ctx).deck.length<2){ ctx.reason = 'デッキのカードが足りません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){}
});

/* ---- 奇跡の蘇生 ---- */
function u354Graves(ctx){ return [ctx.player, ctx.opponent].flatMap(p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && canEffectSpecialSummonS03(x.card, 'grave', '奇跡の蘇生'))); }
defineScript('奇跡の蘇生', {
  type:'spell', priority:2, quickEffect:true, targets:true, includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(!u354ChainOk(ctx, 4)) return false;
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u354Graves(ctx).length){ ctx.reason = '墓地にモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('奇跡の蘇生：特殊召喚する墓地のモンスター', u354Graves(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '奇跡の蘇生', r.p);
  },
  afterResolve(){}
});
