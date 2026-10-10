/* S03-U207: PARTIAL cards completed (2011 texts): スカル・フレイム (the hand Special Summon — its Draw Phase replacement was S03-U65),
   コア転送ユニット, 霞の谷の神風, 迷宮変化. Pools / choices: engine/1ZT + cards/HZZF helpers. */

/* ---- スカル・フレイム: 1ターンに1度、手札から「バーニング・スカルヘッド」1体を特殊召喚する事ができる。この効果を発動するターン、自分はバトルフェイズを
   行う事ができない。 — added to the S03-U65 script (its draw-replacement path is kept: ctx.drawReplacementS03). Main Phase 1 only (in Main
   Phase 2 the Battle Phase has been conducted); the Battle Phase lock is part of the activation (temporaryFlags.noBattlePhase). ---- */
(function(){
  const sc = CARD_SCRIPTS['スカル・フレイム'];
  const drawCond = sc.condition, drawResolve = sc.resolve;
  const heads = p=>API.pileCards(p,'hand',x=>x.db.n==='バーニング・スカルヘッド');
  /* the draw-replacement path: the activation context (ctx.drawReplacementS03) or, at resolution, the chain link */
  const isDraw = ctx=>!!(ctx && (ctx.drawReplacementS03 || (ctx.chainLink && ctx.chainLink.drawReplacementS03)));
  sc.condition = function(ctx){
    if(isDraw(ctx)) return drawCond.call(this, ctx);
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = '表側表示でフィールドに存在する必要があります'; return false; }
    if(gameState.activePlayer!==ctx.player || gameState.phase!=='main1'){ ctx.reason = '自分のメインフェイズ1に発動します（バトルフェイズを行ったターンは発動できません）'; return false; }
    const f = API.me(ctx).temporaryFlags || {};
    if(f.skullFlameSummonS03){ ctx.reason = '1ターンに1度です'; return false; }
    if(!heads(ctx.player).length){ ctx.reason = '手札に「バーニング・スカルヘッド」がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  };
  sc.cost = function(ctx, done){
    if(isDraw(ctx)){ done(true); return; }
    API.setFlag(ctx.player, 'skullFlameSummonS03', true, true);
    API.setFlag(ctx.player, 'noBattlePhase', true, true);
    done(true);
  };
  sc.resolve = function(ctx){
    if(isDraw(ctx)){ drawResolve.call(this, ctx); return; }
    const pool = heads(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'スカル・フレイム：特殊召喚する「バーニング・スカルヘッド」', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'スカル・フレイム', action:'summon', pos:'faceUp'}}, meta:{scriptName:'スカル・フレイム'}});
  };
})();

/* ---- コア転送ユニット (Continuous Spell): 1ターンに1度、手札を1枚捨てる事で、自分のデッキから「コアキメイルの鋼核」1枚を手札に加える。 ---- */
poolSpecS03('コア転送ユニット', {action:'search', filter:{name:'コアキメイルの鋼核', anyCard:true}});
defineScript('コア転送ユニット', {
  type:'spell', priority:1, fieldIgnition:true, countLimit:1, blocksIfNoDeckToHand:true,
  condition(ctx){
    if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = '表側表示で存在する場合に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!poolS03('コア転送ユニット', ctx.player).length){ ctx.reason = 'デッキに「コアキメイルの鋼核」がありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('コア転送ユニット：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
    API.discard(ctx.player, r.index, 'コア転送ユニット（コスト）', {byEffect:false}); done(true); }); },
  resolve(ctx){ askPoolS03(ctx, 'コア転送ユニット', 'コア転送ユニット：手札に加える「コアキメイルの鋼核」'); },
  afterResolve(){}
});

/* ---- 霞の谷の神風 (Field Spell): 自分フィールド上に表側表示で存在する風属性モンスターが手札に戻った場合、自分のデッキからレベル4以下の風属性モンスター1体を
   特殊召喚する事ができる。この効果は1ターンに1度しか使用できない。 ---- */
poolSpecS03('霞の谷の神風', {action:'summon', pos:'faceUp', filter:{at:'風', lvmax:4}});
function mistValleyReturnS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='field' || !ctx.card || ctx.card.face!=='up') return false;
  if(e.toZone!=='hand' || e.fromZone!=='mz' || e.fromFace!=='up' || e.player!==ctx.player) return false;
  const h = e.uid!=null ? findCardByUid(e.uid) : null;
  return !!(h && dbOf(h.card).at==='風');
}
defineScript('霞の谷の神風', {
  type:'spell', priority:1, countLimit:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onLeaveField' || !mistValleyReturnS03(ctx)){ ctx.reason = '自分の表側表示の風属性モンスターが手札に戻った場合に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){ askPoolS03(ctx, '霞の谷の神風', '霞の谷の神風：特殊召喚するレベル4以下の風属性モンスター'); },
  afterResolve(){},
  passive:{ onLeaveField(ctx){ return mistValleyReturnS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
});

/* ---- 迷宮変化 (Equip Spell): 「迷宮壁－ラビリンス・ウォール－」に装備する。「迷宮壁－ラビリンス・ウォール－」と装備したこのカードを生け贄に捧げる事で、
   デッキから「ウォール・シャドウ」を特殊召喚する。 ---- */
poolSpecS03('迷宮変化', {action:'summon', pos:'faceUp', filter:{name:'ウォール・シャドウ'}});
function labyrinthWallsS03(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='迷宮壁－ラビリンス・ウォール－'}); }
defineUnifiedCardV4('迷宮変化', [{
  key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
  /* the card activation only (from the hand or set) — a face-up equipped 迷宮変化 uses the second effect */
  condition(ctx){ if(ctx && ctx.card && ctx.card.equipTo) return false; return labyrinthWallsS03().length>0; },
  target(ctx, done){ API.selectCard('迷宮変化：装備する「迷宮壁－ラビリンス・ウォール－」', labyrinthWallsS03(), t=>done([t])); },
  operation(ctx){ const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(s && t && t.card.face==='up') API.equipSpell(s, t, '迷宮変化'); },
  afterResolve(){}
},{
  key:'shadow', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    const s = ctx.card; if(!s || s.face!=='up' || !s.equipTo) return false;
    const w = findCardByUid(s.equipTo.uid);
    return !!(w && w.zone==='mz' && w.p===ctx.player && dbOf(w.card).n==='迷宮壁－ラビリンス・ウォール－' && poolS03('迷宮変化', ctx.player).length);
  },
  cost(ctx, done){
    const s = findCardByUid(ensureCardUid(gameState, ctx.card)), w = s && s.card.equipTo ? findCardByUid(s.card.equipTo.uid) : null;
    if(!s || !w){ done(false); return; }
    const su = s.card.uid, wu = w.card.uid;
    API.sendToGrave(findCardByUid(wu), '迷宮変化（生け贄）');
    const s2 = findCardByUid(su); if(s2 && s2.zone==='sz') API.sendToGrave(s2, '迷宮変化（生け贄）');
    done(true);
  },
  operation(ctx){ askPoolS03(ctx, '迷宮変化', '迷宮変化：特殊召喚する「ウォール・シャドウ」'); },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, fieldIgnition:true});
