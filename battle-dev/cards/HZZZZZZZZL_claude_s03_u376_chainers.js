/* S03-U376: four NOT_STARTED cards (carddata texts).

   獣人アレス        このカードがフィールド上に表側表示で存在する限り、チェーンが発生する度にこのカードの攻撃力は500ポイントアップする。
   連爆魔人          魔法・罠カードがチェーンする場合、相手ライフに500ポイントダメージを与える。
   紅蓮の炎壁        （速攻魔法）自分の墓地の「ラヴァル」と名のついたモンスターを任意の枚数ゲームから除外して発動できる。このカードを発動するために除外したモンスターの数だけ自分フィールド上に「ラヴァルトークン」(炎族・炎・星1・攻/守0)を守備表示で特殊召喚する。
   地獄の暴走召喚    （速攻魔法）①:相手フィールドに表側表示モンスターが存在し、自分フィールドに攻撃力1500以下のモンスター1体のみが特殊召喚された時に発動できる。その特殊召喚したモンスターの同名モンスターを自分の手札・デッキ・墓地から可能な限り攻撃表示で特殊召喚し、相手は自身のフィールドの表側表示モンスター1体を選び、そのモンスターの同名モンスターを自身の手札・デッキ・墓地から可能な限り特殊召喚する。

   Notes
   - 「チェーンが発生する度」/「チェーンする場合」: the activation event (onActivateSuccess, engine/1B) carries chainLink: 1 = a chain begins, 2+ = a card is chained. アレス: chainLink 1 (+500 as a permanent stat modifier until it leaves / is turned face-down).
     連爆魔人: chainLink >= 2 and the activated card is a Spell / Trap (kind s / t) -> 500 damage to the opponent of 連爆魔人's controller.
   - 紅蓮の炎壁: the cost is a free multi-pick (v46PickAnyAtLeastOne) of 「ラヴァル」 monsters (u325Laval) in the Graveyard, up to the free Monster Zones; the number is kept in a player flag for the resolution; tokens by API.createToken.
   - 地獄の暴走召喚: the activation reads the Special Summon event (exactly one card, mine, face-up Attack, ATK <= 1500; the opponent controls a face-up monster). My copies come from hand / Deck / Graveyard in Attack Position while there is space; the opponent then chooses
     one of their face-up monsters in a choice of their own and Special Summons its same-name monsters (Attack Position). */

/* ---- 獣人アレス ---- */
/* the activation event stays readable while later events are processed: each chain link is handled once per card (a zone-local flag holds the last handled chain id / link) */
function u376Fresh(ctx, key){ const e = ctx.event; return !!e && ctx.card[key]!==String(e.chainId)+':'+String(e.chainLink); }
function u376Mark(ctx, key){ const e = ctx.event, me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && e) API.setCardFlag(me, key, String(e.chainId)+':'+String(e.chainLink), '', {silent:true}); }
function u376ChainBegins(ctx){ const e = ctx.event; return ctx.zone==='mz' && ctx.card.face==='up' && !!e && Number(e.chainLink)===1 && e.name!=='獣人アレス' && u376Fresh(ctx, 'u376AresSeen'); }   /* 獣人アレス' own trigger is only the engine's carrier for a continuous effect: it must not start another chain count (an endless loop otherwise) */
defineUnifiedCardV4('獣人アレス', [{
  key:'grow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'], forced:true,
  condition(ctx){ return u376ChainBegins(ctx); },
  operation(ctx){ u376Mark(ctx, 'u376AresSeen'); const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') v4RegisterStatModifier(me, {atk:500}, {code:'獣人アレス', resetMask:RESET.LEAVE|RESET.FACE_DOWN}); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], passive:{ onActivateSuccess(ctx){ return u376ChainBegins(ctx); } } });

/* ---- 連爆魔人 ---- */
function u376Chained(ctx){ const e = ctx.event; return ctx.zone==='mz' && ctx.card.face==='up' && !!e && Number(e.chainLink)>=2 && (e.kind==='spell' || e.kind==='trap') && u376Fresh(ctx, 'u376BurnSeen'); }
defineUnifiedCardV4('連爆魔人', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onActivateSuccess'], forced:true,
  condition(ctx){ return u376Chained(ctx); },
  operation(ctx){ u376Mark(ctx, 'u376BurnSeen'); API.damageLP(ctx.opponent, 500, '連爆魔人'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], passive:{ onActivateSuccess(ctx){ return u376Chained(ctx); } } });

/* ---- 紅蓮の炎壁 ---- */
defineTokenSpecV11('ラヴァルトークン', {atk:0, def:0, lv:1, ra:'炎', at:'炎', pos:'def'});
function u376Laval(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && u325Laval(x.db)); }
function u376Room(p){ return Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length); }
defineScript('紅蓮の炎壁', {
  type:'spell', priority:2, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため除外できません'; return false; }
    if(!u376Laval(ctx.player).length){ ctx.reason = '墓地に「ラヴァル」モンスターがいません'; return false; }
    if(!u376Room(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u376Laval(ctx.player), max = Math.min(pool.length, u376Room(ctx.player));
    v46PickAnyAtLeastOne('紅蓮の炎壁：ゲームから除外する「ラヴァル」モンスター', pool, max, picked=>{
      if(!picked.length){ done(false); return; }
      API.setFlag(ctx.player, 'u376FlameN', picked.length, true);
      picked.slice().sort((a,b)=>b.index-a.index).forEach(t=>{ const h = findCardByUid(ensureCardUid(gameState, t.card)); if(h && h.zone==='grave') API.banish(h, '紅蓮の炎壁（コスト）'); });
      done(true);
    });
  },
  resolve(ctx){
    const n = Math.min(Number(API.getFlag(ctx.player, 'u376FlameN'))||0, u376Room(ctx.player)); if(n<=0) return;
    API.createToken(ctx.player, {name:'ラヴァルトークン', atk:0, def:0, lv:1, ra:'炎', at:'炎', pos:'def'}, n);
  },
  afterResolve(){}
});

/* ---- 地獄の暴走召喚 ---- */
function u376Summoned(ctx){
  const e = ctx.event || {};
  const cards = Array.isArray(e.cards) ? e.cards : (e.card ? [e.card] : []);
  if(cards.length!==1) return null;
  const c = cards[0], h = c ? findCardByUid(ensureCardUid(gameState, c)) : null;
  if(!h || h.zone!=='mz' || h.p!==ctx.player || h.card.face!=='up' || h.card.pos!=='atk' || curATK(h.card)>1500) return null;
  return h;
}
function u376FoeUp(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
function u376Copies(p, name, reason){
  const out = [];
  ['hand','deck','grave'].forEach(z=>API.pileCards(p, z, x=>x.db.k==='m' && x.db.n===name && canEffectSpecialSummonS03(x.card, z, reason)).forEach(x=>out.push({zone:z, uid:ensureCardUid(gameState, x.card)})));
  return out;
}
function u376Fill(p, name, reason){
  const list = u376Copies(p, name, reason);
  list.forEach(c=>{
    if(!hasMonsterZoneSpace(p)) return;
    const h = findCardByUid(c.uid); if(!h || h.p!==p || (h.zone!=='hand' && h.zone!=='deck' && h.zone!=='grave')) return;
    API.specialSummon(p, h.zone, h.index, 'atk', reason);
  });
  API.shuffle(p);
}
API.registerChoiceHandler('u376.reckless-foe', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const pick = (a.cards || []).find(y=>y && !y.stale && y.uid!=null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.zone!=='mz' || h.p!==x.opponent) return;
  u376Fill(x.opponent, dbOf(h.card).n, '地獄の暴走召喚');
});
defineScript('地獄の暴走召喚', {
  type:'spell', priority:2, onOtherSummon:true, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(!u376Summoned(ctx)){ ctx.reason = '自分フィールドに攻撃力1500以下のモンスター1体のみが特殊召喚された時に発動します'; return false; }
    if(!u376FoeUp(ctx).length){ ctx.reason = '相手フィールドに表側表示モンスターが存在しません'; return false; }
    return true;
  },
  resolve(ctx){
    const h = u376Summoned(ctx);
    const name = h ? dbOf(h.card).n : (ctx.event && (ctx.event.card || (ctx.event.cards||[])[0]) ? dbOf(ctx.event.card || ctx.event.cards[0]).n : null);
    if(name) u376Fill(ctx.player, name, '地獄の暴走召喚');
    const foes = u376FoeUp(ctx); if(!foes.length) return;
    foes.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:ctx.opponent, kind:'card', title:'地獄の暴走召喚：同名モンスターを特殊召喚する自身の表側表示モンスター', candidates:foes, min:1, max:1, cancelable:false,
      resume:{handler:'u376.reckless-foe', args:{player:ctx.player, opponent:ctx.opponent}}, meta:{scriptName:'地獄の暴走召喚'}});
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return !!u376Summoned(ctx) && u376FoeUp(ctx).length>0; } }
});
