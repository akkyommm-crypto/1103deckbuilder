/* S03-U395: two PARTIAL entries -> exact scripts (carddata texts).

   堕天使アスモディウス  このカードはデッキ・墓地からの特殊召喚はできない。①:1ターンに1度、自分メインフェイズに発動できる。デッキから天使族モンスター1体を墓地へ送る。②:自分フィールドのこのカードが破壊され墓地へ送られた場合に発動する。自分フィールドに「アスモトークン」(天使族・闇・星5・攻1800/守1300)1体と、「ディウストークン」(天使族・闇・星3・攻/守1200)1体を特殊召喚する。「アスモトークン」は効果では破壊されない。「ディウストークン」は戦闘では破壊されない。
   不死王リッチー        このカードは通常召喚できない。「大神官デ・ザード」の効果で特殊召喚する事ができる。このカードは1ターンに1度だけ裏側守備表示にする事ができる。このカードがリバースした時、自分の墓地に存在するアンデット族モンスター1体を選択して特殊召喚する事ができる。また、フィールド上に表側表示で存在するこのカードを対象とする魔法・罠カードが発動した時、その発動を無効にし破壊する。

   Notes
   - アスモディウス: the Deck / Graveyard Special Summon ban is a standing rule read from the card text (engine/1ZK noGraveSummonReasonS03, now also for the Deck and for 「デッキ・墓地」); ① is a once-per-turn ignition; ② is a forced Graveyard trigger after a destruction on the field (graveInfo.byDestroy, from 'mz', this turn) and needs two free Monster Zones; the Tokens are protected by API.grantProtection {until:'permanent'} (Asmo: effects, Dius: battle).
   - リッチー: the once-per-turn Set is an ignition effect (FX_SET_STATE face-down Defense); the Flip effect is an optional onFlip trigger choosing an Undead of my Graveyard. The Spell / Trap targeting negation and cannotNormalSummon stay as in S03-U66 / U67 (declareTargetingNegatorS03 in H8C). */

/* ---- アスモディウス ---- */
defineTokenSpecV11('アスモトークン', {atk:1800, def:1300, lv:5, ra:'天使', at:'闇', pos:'atk'});
defineTokenSpecV11('ディウストークン', {atk:1200, def:1200, lv:3, ra:'天使', at:'闇', pos:'atk'});
function u395AsmoGone(ctx){
  const g = ctx.card.graveInfo, e = ctx.event || {};
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn);
}
function u395Room2(p){ return ZONE_LIMITS.mz - gameState.players[p].mz.length >= 2; }
function u395Angels(ctx){ return API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && x.db.ra==='天使'); }
defineUnifiedCardV4('堕天使アスモディウス', [{
  key:'mill', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u395Angels(ctx).length){ ctx.reason = 'デッキに天使族モンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = u395Angels(ctx); if(!pool.length) return;
    API.selectCard('堕天使アスモディウス：墓地へ送る天使族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='deck' && r.p===ctx.player) API.sendToGrave(r, '堕天使アスモディウス');
    });
  },
  afterResolve(){}
}, {
  key:'tokens', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u395AsmoGone(ctx) && u395Room2(ctx.player); },
  operation(ctx){
    if(!u395Room2(ctx.player)) return;
    const before = gameState.players[ctx.player].mz.length;
    API.createToken(ctx.player, {name:'アスモトークン', atk:1800, def:1300, lv:5, ra:'天使', at:'闇', pos:'atk'}, 1);
    API.createToken(ctx.player, {name:'ディウストークン', atk:1200, def:1200, lv:3, ra:'天使', at:'闇', pos:'atk'}, 1);
    gameState.players[ctx.player].mz.slice(before).forEach(c=>{
      const h = findCardByUid(ensureCardUid(gameState, c)); if(!h) return;
      if(cardName(c)==='アスモトークン') API.grantProtection(h, {key:'u395.asmo', label:'アスモトークン', effect:true, until:'permanent'});
      else if(cardName(c)==='ディウストークン') API.grantProtection(h, {key:'u395.dius', label:'ディウストークン', battle:true, until:'permanent'});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['mill']}, timing:['free'], activateFrom:['grave'],
  passive:{ onSendToGrave(ctx){ return u395AsmoGone(ctx) && u395Room2(ctx.player); }, onDestroy(ctx){ return u395AsmoGone(ctx) && u395Room2(ctx.player); } } });

/* ---- 不死王リッチー ---- */
function u395Undead(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット' && canEffectSpecialSummonS03(x.card, 'grave', '不死王リッチー')); }
defineUnifiedCardV4('不死王リッチー', [{
  key:'set', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz' || h.card.face!=='up') return;
    act({type:'FX_SET_STATE', player:h.p, zone:h.zone, index:h.index, face:'down', pos:'def', reason:'不死王リッチー'});
  },
  afterResolve(){}
}, {
  key:'flip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card) && hasMonsterZoneSpace(ctx.player) && u395Undead(ctx).length>0; },
  target(ctx, done){ API.selectCard('不死王リッチー：特殊召喚するアンデット族モンスター', u395Undead(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '不死王リッチー');
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, countLimit:{n:1, effects:['set']}, targets:true, timing:['free'],
  passive:{ onFlip(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card) && hasMonsterZoneSpace(ctx.player) && u395Undead(ctx).length>0; } } });
