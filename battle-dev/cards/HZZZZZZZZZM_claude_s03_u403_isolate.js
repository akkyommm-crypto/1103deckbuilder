/* S03-U403: 異次元隔離マシーン, コーリング・マジック (NOT_STARTED cards, carddata texts).

   異次元隔離マシーン  （永続魔法）自分と相手のフィールド上からモンスターを1体ずつ選択し、ゲームから除外する。このカードが破壊され墓地へ送られた時、除外したモンスターを同じ表示形式で元のフィールド上に戻す。
   コーリング・マジック  （通常魔法）相手がコントロールする魔法・罠カードの効果によってセットされたこのカードが破壊され墓地へ送られた時、デッキから速攻魔法カード1枚を選択してお互いに確認し自分フィールド上にセットする。

   Notes
   - 異次元隔離マシーン: a Continuous Spell's activation is a plain placement in this engine (S03-U386), so the banish is its field ignition, usable once after the placement (card flag u403Used) - a small documented deviation. It lets me choose a monster of mine and one of the opponent (selectCard twice), banishes both (API.banish) and records {pos, controller} per banished card in the player flag effectFlags.u403Isolated[machineUid] (the card flags of the machine are lost when it leaves the field); a forced Graveyard trigger after its DESTRUCTION (graveInfo.byDestroy, from the Spell & Trap Zone) Special Summons them back from the banished zone in the recorded Battle Position to their controllers (needs free zones).
   - コーリング・マジック: only the Graveyard trigger exists (the Spell has no ordinary use): graveInfo says it was Set (face 'down'), destroyed on the field this turn by the opponent (byPlayer) with a Spell / Trap card as the recorded source (srcUidS03); a Quick-Play Spell of the Deck is revealed (log) and Set face-down on my field (act MOVE deck -> Spell & Trap Zone, face down). */

/* ---- 異次元隔離マシーン ---- */
function u403Iso(p){ const f = API.getFlag(p, 'u403Isolated'); return (f && typeof f==='object' && !Array.isArray(f)) ? f : {}; }
function u403Side(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face!==undefined}); }
function u403Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
function u403Left(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='sz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn) && (u403Iso(ctx.player)[String(ctx.card.uid)]||[]).length>0;
}
defineUnifiedCardV4('異次元隔離マシーン', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'isolate', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u403Ready(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.card.u403Used){ ctx.reason = 'このカードの発動効果は使用済みです'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u403Side(ctx.player).length || !u403Side(ctx.opponent).length){ ctx.reason = 'お互いのフィールドにモンスターが必要です'; return false; }
    return true;
  },
  operation(ctx){
    const mu = ensureCardUid(gameState, ctx.card);
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='sz') API.setCardFlag(me, 'u403Used', true, '異次元隔離マシーン', {silent:true});
    API.selectCard('異次元隔離マシーン：除外する自分のモンスター', u403Side(ctx.player), t1=>{
      API.selectCard('異次元隔離マシーン：除外する相手のモンスター', u403Side(ctx.opponent), t2=>{
        const a = t1 && resolveTarget(t1), b = t2 && resolveTarget(t2);
        if(!a || !b || a.zone!=='mz' || b.zone!=='mz') return;
        const rec = [a, b].map(r=>({uid:ensureCardUid(gameState, r.card), p:r.p, pos:r.card.pos}));
        const cur = u403Iso(ctx.player), next = Object.assign({}, cur); next[String(mu)] = rec;
        API.setFlag(ctx.player, 'u403Isolated', next, false);
        [a, b].sort((x,y)=>y.index-x.index).forEach(r=>{ const hh = findCardByUid(r.card.uid); if(hh && hh.zone==='mz') API.banish(hh, '異次元隔離マシーン'); });
      });
    });
  },
  afterResolve(){}
}, {
  key:'return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u403Left(ctx); },
  operation(ctx){
    const key = String(ctx.card.uid), rec = u403Iso(ctx.player)[key] || [];
    rec.forEach(x=>{
      const h = findCardByUid(x.uid);
      if(h && h.zone==='banish' && hasMonsterZoneSpace(x.p)) API.specialSummon(x.p, 'banish', h.index, x.pos==='def' ? 'def' : 'atk', '異次元隔離マシーン', h.p, {ignoreSummonConditionS03:true});
    });
    const cur = Object.assign({}, u403Iso(ctx.player)); delete cur[key];
    API.setFlag(ctx.player, 'u403Isolated', cur, false);
  },
  afterResolve(){}
}], {type:'spell', priority:1, fieldIgnition:true, activateFrom:['sz','grave'],
  passive:{ onSendToGrave(ctx){ return u403Left(ctx); }, onDestroy(ctx){ return u403Left(ctx); } } });

/* ---- コーリング・マジック ---- */
function u403QuickPlays(p){ return API.pileCards(p, 'deck', x=>x.db.k==='s' && x.db.sub==='速攻'); }
function u403Called(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  if(ctx.zone!=='grave' || e.uid==null || e.uid!==ctx.card.uid || !g || g.from!=='sz' || !g.byDestroy || g.face!=='down' || Number(g.turn)!==Number(gameState.turn)) return false;
  if(g.byPlayer!==ctx.opponent) return false;
  const src = g.srcUidS03!=null ? findCardByUid(g.srcUidS03) : null;
  const sdb = src ? dbOf(src.card) : null;
  return !!sdb && (sdb.k==='s' || sdb.k==='t');
}
defineUnifiedCardV4('コーリング・マジック', [{
  key:'call', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
  condition(ctx){ return u403Called(ctx) && u403QuickPlays(ctx.player).length>0; },
  operation(ctx){
    const pool = u403QuickPlays(ctx.player); if(!pool.length) return;
    API.selectCard('コーリング・マジック：セットするデッキの速攻魔法', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='deck' || r.p!==ctx.player || gameState.players[ctx.player].sz.length>=ZONE_LIMITS.sz) return;
      API.log(`コーリング・マジック：「${r.card && cardName(r.card)}」をお互いに確認し、フィールドにセットした`);
      act({type:'MOVE', player:ctx.player, from:'deck', fromIndex:r.index, to:'sz', face:'down', pos:'atk'});
    });
  },
  afterResolve(){}
}], {type:'spell', priority:1, forced:true, activateFrom:['grave'],
  passive:{ onSendToGrave(ctx){ return u403Called(ctx) && u403QuickPlays(ctx.player).length>0; }, onDestroy(ctx){ return u403Called(ctx) && u403QuickPlays(ctx.player).length>0; } } });
