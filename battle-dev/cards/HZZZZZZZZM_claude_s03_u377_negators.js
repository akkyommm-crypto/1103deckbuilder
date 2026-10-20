/* S03-U377: five negation cards for activations that destroy monsters / burn / target (carddata texts).

   我が身を盾に            （速攻魔法）1500ライフポイントを払って発動する。相手が発動した「フィールド上のモンスターを破壊する効果」を持つカードの発動を無効にし破壊する。
   デストラクション・ジャマー （カウンター罠）手札を1枚捨てて発動できる。「フィールド上のモンスターを破壊する効果」を持つ効果モンスターの効果・魔法・罠カードの発動を無効にし破壊する。
   ボム・ガード            （罠）「自分フィールド上に存在するモンスター1体を破壊する効果」を持つカードが発動した時に発動する事ができる。その発動を無効にし破壊する。さらに相手ライフに500ポイントダメージを与える。
   ライフ・コーディネイター  相手が「ライフポイントにダメージを与える効果」を持つカードを発動した時、手札からこのカードを捨てる事でその発動を無効にし破壊する。
   椿姫ティタニアル        ①:フィールドのカードを対象とする魔法・罠・モンスターの効果が発動した時、自分フィールドの表側表示の植物族モンスター1体をリリースして発動できる。その発動を無効にし破壊する。

   Notes
   - The chain link's effect category comes from the engine (linkHasCategoryV19: destroy / damage, declared or read from the card text). 「モンスターを破壊する効果」 is the category destroy together with a monster as the object:
     the link has a target that is a monster on the field, or (no target) the card text names monsters in its destruction sentence (u377DestroysMonsters). Effects that destroy only Spells / Traps are therefore refused.
   - Hand responses and field quick effects are offered through onActivateSuccess + declareActivationResponseS03 (as 墓守の監視者 S03-U327 / ラヴァル・ステライド S03-U325); the negation is API.negateChainLink(chainId, 'activation', reason, true) (negate and destroy).
   - The Spell / Trap responses read the chain top link (u377Top) like S03-U355. */

function u377Top(){ return gameState.chain && gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null; }
function u377LinkDb(link){ if(!link) return null; if(link.cardId!=null && CARD_DB[link.cardId]) return CARD_DB[link.cardId]; const i = findCardIndex(link.name); return i>=0 ? CARD_DB[i] : null; }
/* does this chain link destroy monsters on the field? side: a player whose monster must be hit (or null: any monster) */
function u377DestroysMonsters(link, side){
  const db = u377LinkDb(link); if(!db) return false;
  if(typeof linkHasCategoryV19!=='function' || !linkHasCategoryV19(gameState, link, 'destroy')) return false;
  const ts = typeof linkTargetsV19==='function' ? linkTargetsV19(gameState, link) : [];
  if(ts.length){
    const hit = ts.filter(h=>h.zone==='mz' && (side==null || h.p===side));
    return hit.length>0;
  }
  if(side!=null && !API.fieldCards({player:side, zone:'mz', filter:x=>true}).length) return false;
  return /モンスター[^。]*破壊/.test(String(db.e||''));
}
function u377Damages(link){ return !!link && typeof linkHasCategoryV19==='function' && linkHasCategoryV19(gameState, link, 'damage'); }
function u377Targets(link){
  const ts = typeof linkTargetsV19==='function' ? linkTargetsV19(gameState, link) : [];
  return ts.some(h=>h.zone==='mz' || h.zone==='sz' || h.zone==='field');
}
function u377EventLink(ctx){
  const e = ctx.event; if(!e || e.chainId==null || !Array.isArray(gameState.chain)) return null;
  return gameState.chain.find(l=>l && l.chainId===e.chainId) || null;
}

/* ---- 我が身を盾に ---- */
defineScript('我が身を盾に', {
  type:'spell', priority:3, targets:false,
  condition(ctx){
    const top = u377Top();
    if(API.me(ctx).lp<1500){ ctx.reason = 'ライフポイントが足りません'; return false; }
    if(!top || top.player!==ctx.opponent || !u377DestroysMonsters(top, null)){ ctx.reason = '相手が「フィールド上のモンスターを破壊する効果」を持つカードを発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp<1500){ done(false); return; } API.payCost(ctx.player, 1500); done(true); },
  resolve(){ negatePreviousChainLinkV2('我が身を盾に', true); },
  afterResolve(){}
});

/* ---- デストラクション・ジャマー ---- */
defineScript('デストラクション・ジャマー', {
  type:'counter', priority:3, targets:false,
  condition(ctx){
    const top = u377Top();
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(!top || !u377DestroysMonsters(top, null)){ ctx.reason = '「フィールド上のモンスターを破壊する効果」を持つカードの発動時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('デストラクション・ジャマー：捨てる手札', API.pileCards(ctx.player, 'hand', ()=>true), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'デストラクション・ジャマー（コスト）', {byEffect:false}); done(true);
    });
  },
  resolve(){ negatePreviousChainLinkV2('デストラクション・ジャマー', true); },
  afterResolve(){}
});

/* ---- ボム・ガード ---- */
defineScript('ボム・ガード', {
  type:'trap', priority:3, targets:false,
  condition(ctx){
    const top = u377Top();
    if(!top || !u377DestroysMonsters(top, ctx.player)){ ctx.reason = '自分のモンスターを破壊する効果を持つカードが発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ negatePreviousChainLinkV2('ボム・ガード', true); API.damageLP(ctx.opponent, 500, 'ボム・ガード'); },
  afterResolve(){}
});

/* ---- ライフ・コーディネイター ---- */
function u377CoordHit(ctx){
  const e = ctx.event, l = u377EventLink(ctx);
  return ctx.zone==='hand' && !!e && e.player===ctx.opponent && !!l && u377Damages(l);
}
defineUnifiedCardV4('ライフ・コーディネイター', [{
  key:'negate-burn', type:EFFECT_TYPE.QUICK, range:LOCATION.HAND, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(!u377CoordHit(ctx)){ ctx.reason = '相手が「ライフポイントにダメージを与える効果」を持つカードを発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.sendHandToGrave(ctx.player, i, 'ライフ・コーディネイター（コスト）'); done(true); },
  operation(ctx){ const e = ctx.event; if(e && e.chainId!=null) API.negateChainLink(e.chainId, 'activation', 'ライフ・コーディネイター', true); },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], timing:['free','chain'],
  passive:{ onActivateSuccess(ctx){ return u377CoordHit(ctx); } }});
declareActivationResponseS03(['ライフ・コーディネイター']);

/* ---- 椿姫ティタニアル ---- */
function u377Plants(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.ra==='植物'}); }
function u377TitaniaHit(ctx){
  const l = u377EventLink(ctx);
  return ctx.zone==='mz' && ctx.card.face==='up' && !!l && u377Targets(l) && u377Plants(ctx).length>0;
}
function u377TitaniaOwn(ctx){
  const l = u377EventLink(ctx);
  return ctx.zone==='mz' && ctx.card.face==='up' && !!l && u377Targets(l);
}
defineUnifiedCardV4('椿姫ティタニアル', [{
  key:'negate-target', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(!u377TitaniaOwn(ctx)){ ctx.reason = 'フィールドのカードを対象とする効果が発動した時に発動します'; return false; }
    if(!u377Plants(ctx).length){ ctx.reason = 'リリースできる他の植物族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('椿姫ティタニアル：リリースする植物族モンスター', u377Plants(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '椿姫ティタニアル（リリース）'); done(true);
    });
  },
  operation(ctx){ const e = ctx.event; if(e && e.chainId!=null) API.negateChainLink(e.chainId, 'activation', '椿姫ティタニアル', true); },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, activateFrom:['mz'], timing:['free','chain'],
  passive:{ onActivateSuccess(ctx){ return u377TitaniaHit(ctx); } }});
declareActivationResponseS03(['椿姫ティタニアル']);
