/* S03-U431: マザー・スパイダー, 薔薇の妖精, ローズ・バード, 戦士ラーズ, ダーク・ヴァージャー, ホープ・オブ・フィフス (stale ENGINE_GAP cards, carddata texts).

   マザー・スパイダー    自分の墓地に存在するモンスターが昆虫族のみの場合、このカードは相手フィールド上に表側守備表示で存在するモンスター2体を墓地へ送り、手札から特殊召喚する事ができる。
   薔薇の妖精            このカードが魔法・罠・効果モンスターの効果によって自分のデッキから手札に加わった場合、このカードを自分フィールド上に特殊召喚する事ができる。
   ローズ・バード        自分フィールド上に表側攻撃表示で存在するこのカードが相手モンスターの攻撃によって破壊され墓地へ送られた時、デッキから植物族チューナー2体を表側守備表示で特殊召喚できる。
   戦士ラーズ            このカードが召喚・特殊召喚に成功した時、自分のデッキから「戦士ラーズ」以外のレベル4以下の戦士族モンスター1体を選択し、デッキの一番上に置く。
   ダーク・ヴァージャー  自分フィールド上に植物族のチューナーが召喚された時、このカードを墓地から攻撃表示で特殊召喚する事ができる。
   ホープ・オブ・フィフス  （通常魔法）自分の墓地の「E・HERO」と名のついたカード5枚を選択し、デッキに加えてシャッフルする。その後、デッキからカードを2枚ドローする。このカードの発動時に自分の手札・フィールド上に他のカードが存在しない場合はカードを3枚ドローする。

   Notes
   - マザー・スパイダー: summonProcedure from the hand; the cost sends two face-up Defense Position opponent monsters to the Graveyard (u342PickN); the condition: no non-Insect monster in my Graveyard. 薔薇の妖精: optional hand trigger on onAddToHand from the Deck (as BF－そよ風のブリーズ). ローズ・バード: optional Graveyard trigger on a battle destruction of the face-up Attack Position card (graveInfo battle / pos 'atk'): two Plant Tuners of the Deck in Defense Position. 戦士ラーズ: the Deck card is put on top with FX_RETURN_DECK zone 'deck' (no shuffle). ダーク・ヴァージャー: Graveyard trigger on my Normal Summon of a Plant Tuner (onOtherSummon).
   - ホープ・オブ・フィフス: 5 chosen E・HERO cards return to the Deck (Fusion Monsters to the Extra Deck, FX_RETURN_DECK), the Deck is shuffled, I draw 2 - or 3 when no other card was in my hand or on my field at the activation (the other cards are counted before the cost). */

function u431Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free']}, extra);
}

/* ---- マザー・スパイダー ---- */
function u431FoeDef(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='def' && x.db.k==='m'}); }
defineScript('マザー・スパイダー', u431Passive({
  condition(ctx){ ctx.reason = '特殊召喚の手順のみのカードです'; return false; }, resolve(){}, afterResolve(){}, includesSpecialSummon:true,
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra!=='昆虫').length){ ctx.reason = '墓地に昆虫族以外のモンスターがいます'; return false; }
      if(u431FoeDef(ctx).length<2){ ctx.reason = '相手フィールドに表側守備表示のモンスターが2体いません'; return false; }
      return true;
    },
    cost(ctx, done){ u342PickN('マザー・スパイダー：墓地へ送る相手の表側守備表示モンスター', ctx, u431FoeDef, 2, h=>API.sendToGrave(h, 'マザー・スパイダー（特殊召喚の手順）'), done); } } }));

/* ---- 薔薇の妖精 ---- */
function u431FairyAdded(ctx){
  const e = ctx.event || {};
  if(e.from !== 'deck' || e.uid == null || !ctx.card || e.uid !== ctx.card.uid || e.player !== ctx.player) return false;
  const h = locateCardAnyV4(ctx.card);
  return !!h && h.zone === 'hand' && h.p === ctx.player;
}
defineUnifiedCardV4('薔薇の妖精', [{
  key:'added-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onAddToHand'],
  condition(ctx){
    if(!u431FairyAdded(ctx)){ ctx.reason = 'デッキから手札に加わった時に発動します'; return false; }
    return hasMonsterZoneSpace(ctx.player);
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='hand' || h.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    specialSummonPositionsS03(ctx.player, [{uid:ctx.card.uid, from:'hand'}], '薔薇の妖精');
  },
  afterResolve(){}
}], u431Passive({activateFrom:['hand'], includesSpecialSummon:true, blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; }, passive:{ onAddToHand: ctx => u431FairyAdded(ctx) }}));

/* ---- ローズ・バード ---- */
function u431BirdSent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && !!g.byDestroy && g.face==='up' && g.pos==='atk' && Number(g.turn)===Number(gameState.turn);
}
function u431PlantTuners(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && x.db.ra==='植物' && (x.db.st||[]).indexOf('チューナー')>=0 && canEffectSpecialSummonS03(x.card, 'deck', 'ローズ・バード')); }
function u431FreeMz(p){ return Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length); }
defineUnifiedCardV4('ローズ・バード', [{
  key:'tuners', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!u431BirdSent(ctx)){ ctx.reason = '表側攻撃表示で相手モンスターの攻撃によって破壊された時に発動します'; return false; }
    return u431PlantTuners(ctx.player).length>=2 && u431FreeMz(ctx.player)>=2;
  },
  operation(ctx){
    if(u431PlantTuners(ctx.player).length<2 || u431FreeMz(ctx.player)<2) return;
    u342PickN('ローズ・バード：特殊召喚する植物族チューナー', ctx, c=>u431PlantTuners(c.player), 2, h=>{ if(hasMonsterZoneSpace(h.p)) API.specialSummon(h.p, 'deck', h.index, 'def', 'ローズ・バード'); }, ()=>{});
  },
  afterResolve(){}
}], u431Passive({activateFrom:['grave'], includesSpecialSummon:true, passive:{ onSendToGrave(ctx){ return u431BirdSent(ctx) && u431PlantTuners(ctx.player).length>=2 && u431FreeMz(ctx.player)>=2; } }}));

/* ---- 戦士ラーズ ---- */
function u431RazSummoned(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); }
function u431Warriors(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && x.db.ra==='戦士' && Number(x.db.lv)<=4 && x.db.n!=='戦士ラーズ'); }
defineUnifiedCardV4('戦士ラーズ', [{
  key:'top', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onSpecialSummon'], forced:true,
  condition(ctx){ return u431RazSummoned(ctx) && u431Warriors(ctx.player).length>0; },
  operation(ctx){
    const pool = u431Warriors(ctx.player); if(!pool.length) return;
    API.selectCard('戦士ラーズ：デッキの一番上に置くレベル4以下の戦士族モンスター', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && r.p===ctx.player) act({type:'FX_RETURN_DECK', player:r.p, zone:'deck', index:r.index, toBottom:false, reason:'戦士ラーズ'});
    });
  },
  afterResolve(){}
}], u431Passive({forced:true, passive:{ onNormalSummon(ctx){ return u431RazSummoned(ctx) && u431Warriors(ctx.player).length>0; }, onSpecialSummon(ctx){ return u431RazSummoned(ctx) && u431Warriors(ctx.player).length>0; } }}));

/* ---- ダーク・ヴァージャー ---- */
function u431Plant(ctx){
  const e = ctx.event || {}; if(ctx.zone!=='grave' || e.player!==ctx.player) return false;
  const c = e.card || (e.uid!=null ? (findCardByUid(e.uid)||{}).card : null);
  return !!c && c!==ctx.card && dbOf(c).k==='m' && dbOf(c).ra==='植物' && (dbOf(c).st||[]).indexOf('チューナー')>=0;
}
defineUnifiedCardV4('ダーク・ヴァージャー', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onNormalSummon'],
  condition(ctx){ if(!u431Plant(ctx)){ ctx.reason = '自分フィールドに植物族のチューナーが召喚された時に発動します'; return false; } return hasMonsterZoneSpace(ctx.player); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'ダーク・ヴァージャー'); },
  afterResolve(){}
}], u431Passive({activateFrom:['grave'], onOtherSummon:true, includesSpecialSummon:true, passive:{ onNormalSummon(ctx){ return u431Plant(ctx) && hasMonsterZoneSpace(ctx.player); } }}));

/* ---- ホープ・オブ・フィフス ---- */
function u431EHeroGrave(p){ return API.pileCards(p, 'grave', x=>String(x.db.n||'').indexOf('E・HERO')>=0); }
function u431OthersCount(ctx){
  const P = gameState.players[ctx.player];
  return P.hand.filter(c=>c!==ctx.card).length + P.mz.length + P.sz.filter(c=>c && c!==ctx.card).length + (P.field?1:0);
}
defineUnifiedCardV4('ホープ・オブ・フィフス', [{
  key:'five', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ if(u431EHeroGrave(ctx.player).length<5){ ctx.reason = '墓地の「E・HERO」と名のついたカードが5枚未満です'; return false; } return true; },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(me) API.setCardFlag(me, 'u431Three', u431OthersCount(ctx)===0 ? 1 : 0, 'ホープ・オブ・フィフス', {silent:true}); done(true); },
  target(ctx, done){
    const chosen = [];
    const step = ()=>{
      if(chosen.length>=5){ done(chosen.slice()); return; }
      const pool = u431EHeroGrave(ctx.player).filter(x=>!chosen.some(y=>y.card===x.card));
      if(!pool.length){ done([]); return; }
      API.selectCard(`ホープ・オブ・フィフス：デッキに加える「E・HERO」（${chosen.length+1}/5）`, pool, t=>{ chosen.push(t); step(); });
    };
    step();
  },
  operation(ctx){
    const sel = ctx.selectedTargets || [], uids = sel.map(t=>{ const r = t && resolveTarget(t); return r ? ensureCardUid(gameState, r.card) : null; }).filter(u=>u!=null);
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave' && h.p===ctx.player) act({type:'FX_RETURN_DECK', player:h.p, zone:'grave', index:h.index, toBottom:false, reason:'ホープ・オブ・フィフス'}); });
    API.shuffle(ctx.player);
    const me = findCardByUid(ensureCardUid(gameState, ctx.card));
    API.draw(ctx.player, (me && me.card.u431Three===1) ? 3 : 2);
  }
}], {type:'spell', priority:1, targets:true});
