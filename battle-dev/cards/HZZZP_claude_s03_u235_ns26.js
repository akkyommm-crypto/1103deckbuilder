/* S03-U235: NOT_STARTED cards (2011 texts) — E・HERO アイスエッジ, ラヴァル・ガンナー, リチュア・ノエリア, 真六武衆－シナイ, 魔轟神獣ガナシア. */

/* ---- E・HERO アイスエッジ: 1ターンに1度、自分のメインフェイズ1で手札を1枚捨てて発動する。このターンこのカードは相手プレイヤーに直接攻撃する事ができる。
   また、このカードが直接攻撃によって相手ライフに戦闘ダメージを与えた時、相手の魔法&罠カードゾーンにセットされたカード1枚を破壊する事ができる。
   (the grant is API.grantDirectAttack — a journaled, turn-stamped permission; the destruction is optional and chosen on resolution) ---- */
function iceEdgeSetCardsS03(ctx){ return API.fieldCards({player:ctx.opponent, zone:'sz', filter:x=>x.card && x.card.face==='down'}); }
API.registerChoiceHandler('s03u235.iceedge-destroy', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const h = picked && picked.card && picked.card.uid!=null ? findCardByUid(picked.card.uid) : null;
  if(h && h.p===args.foe && h.zone==='sz' && h.card.face==='down') API.destroy(h, 'E・HERO アイスエッジ');
});
defineUnifiedCardV4('E・HERO アイスエッジ', [{
  key:'discard-direct-attack', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || gameState.phase!=='main1'){ ctx.reason = '自分のメインフェイズ1に発動します'; return false; }
    if(!API.pileCards(ctx.player,'hand').length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('E・HERO アイスエッジ：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'E・HERO アイスエッジ（コスト）', {byEffect:false}); done(true);
    });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.grantDirectAttack(me); },
  afterResolve(){}
},{
  key:'direct-damage-destroy-set', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDirectBattleDamage'],
  condition(ctx){ return ctx.zone==='mz' && v6SelfDealt(ctx) && iceEdgeSetCardsS03(ctx).length>0; },
  operation(ctx){
    const pool = iceEdgeSetCardsS03(ctx); if(!pool.length) return;
    v49P1Open(ctx, {kind:'card', title:'E・HERO アイスエッジ：破壊する相手のセットカード', candidates:pool, min:1, max:1},
      's03u235.iceedge-destroy', {foe:ctx.opponent}, false);
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['discard-direct-attack']},
     passive:{ onDirectBattleDamage:ctx=>ctx.zone==='mz' && v6SelfDealt(ctx) && iceEdgeSetCardsS03(ctx).length>0 }});

/* ---- ラヴァル・ガンナー: このカードが召喚に成功した時、自分の墓地に「ラヴァル・ガンナー」以外の「ラヴァル」と名のついたモンスターが存在する場合、デッキの上からカードを5枚まで
   墓地へ送って発動できる。このカードの攻撃力は、この効果を発動するために墓地へ送った「ラヴァル」と名のついたモンスターの数×200ポイントアップする。
   (the number of cards is chosen as the cost, 1–5; the count of 「ラヴァル」 monsters among them is kept in a journaled card flag until the effect resolves) ---- */
function gunnerGraveS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.n!=='ラヴァル・ガンナー' && isSetCardV4(x.db, SETCODE.LAVAL)); }
function gunnerMillS03(ctx, n){
  const P = gameState.players[ctx.player], top = (P.deck||[]).slice(0, n);
  const lava = top.filter(c=>dbOf(c).k==='m' && isSetCardV4(dbOf(c), SETCODE.LAVAL)).length;
  API.millTop(ctx.player, n, 'ラヴァル・ガンナー（コスト）');
  const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'gunnerLavalS03', lava, 'ラヴァル・ガンナー', {silent:true});
}
defineScript('ラヴァル・ガンナー', {
  type:'monster', priority:1, timing:['summon'],
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon' || ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!gunnerGraveS03(ctx).length){ ctx.reason = '墓地に他の「ラヴァル」モンスターがいません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const max = Math.min(5, API.me(ctx).deck.length);
    if(!max){ done(false); return; }
    const cands = [1,2,3,4,5].slice(0,max).map(k=>({key:String(k), label:k+'枚', value:k}));
    API.requestChoice({player:ctx.player, kind:'declare', title:'ラヴァル・ガンナー：デッキの上から墓地へ送る枚数（5枚まで）', candidates:cands, min:1, max:1, cancelable:true,
      legacy:{onPick:(x)=>{ const n = Math.max(1, Math.min(max, Number(x && x.value)||0)); gunnerMillS03(ctx, n); done(true); }, onCancel:()=>done(false)}});
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    const n = Number(me.card.gunnerLavalS03)||0;
    API.setCardFlag(me, 'gunnerLavalS03', 0, 'ラヴァル・ガンナー', {silent:true});
    if(n>0 && me.zone==='mz' && me.card.face==='up')
      v4RegisterStatModifier(me, {atk:n*200}, {controller:ctx.player, code:'ラヴァル・ガンナー +200×'+n, targetCard:me.card, resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && gunnerGraveS03(ctx).length>0 && API.me(ctx).deck.length>0; } }
});

/* ---- リチュア・ノエリア: このカードが召喚に成功した時、自分のデッキの上からカードを5枚めくる事ができる。めくったカードの中に儀式魔法カードまたは「リチュア」と名のついた
   モンスターカードがあった場合、それらのカードを全て墓地へ送る。残りのカードは好きな順番でデッキの一番下に戻す。
   (the order of the rest is the player's choice — a P1 ordered selection; the first picked ends up highest of the returned cards) ---- */
API.registerChoiceHandler('s03u235.noeria-order', (answer, args)=>{
  API.orderToDeck(args.player, v49P1ChoiceCards(answer).map(x=>x.card && x.card.uid).filter(u=>u!=null), true, args.reason);
});
defineScript('リチュア・ノエリア', {
  type:'monster', priority:1, timing:['summon'],
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon' || ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const top = API.deckTop(ctx.player, 5); if(!top.length) return;
    API.reveal({player:ctx.player, audience:'both', cards:top, label:'リチュア・ノエリア', until:'resolution'});
    const hit = c=>{ const d = dbOf(c); return (d.k==='s' && d.sub==='儀式') || (d.k==='m' && isSetCardV4(d, SETCODE.GISHKI)); };
    const uids = top.map(t=>t.card.uid), rest = [];
    uids.forEach(u=>{
      const h = findCardByUid(u); if(!h || h.zone!=='deck' || h.p!==ctx.player) return;
      if(hit(h.card)) API.mill(ctx.player, h.index, 'リチュア・ノエリア'); else rest.push(u);
    });
    const cards = rest.map(u=>findCardByUid(u)).filter(h=>h && h.zone==='deck');
    if(cards.length<2){ if(cards.length) API.orderToDeck(ctx.player, rest, true, 'リチュア・ノエリア'); return; }
    v49P1Open(ctx, {kind:'card', title:'リチュア・ノエリア：デッキの一番下に戻す順番', candidates:cards, min:cards.length, max:cards.length},
      's03u235.noeria-order', {player:ctx.player, reason:'リチュア・ノエリア'}, false);
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && API.me(ctx).deck.length>0; } }
});

/* ---- 真六武衆－シナイ: 自分フィールド上に「真六武衆－ミズホ」が表側表示で存在する場合、このカードは手札から特殊召喚する事ができる。
   フィールド上に存在するこのカードがリリースされた場合、自分の墓地に存在する「真六武衆－シナイ」以外の「六武衆」と名のついたモンスター1体を選択して手札に加える。
   (「リリースされた」 = sent from the monster zone to the GY this turn, neither destroyed nor by battle nor as Fusion / Synchro / Xyz material) ---- */
function shinaiReleasedS03(ctx){
  if(ctx.zone!=='grave' || !eventIsSelfS03(ctx)) return false;
  /* S03-U235 (parent review): the engine marks releases (graveInfo.releasedS03: Tribute / Ritual Summon, release costs); a non-release send to
     the GY by an effect is not 「リリースされた」. */
  const g = ctx.card.graveInfo;
  return !!g && g.releasedS03===true && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
function shinaiTargetsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.n!=='真六武衆－シナイ' && String(x.db.n||'').indexOf('六武衆')>=0); }
defineScript('真六武衆－シナイ', {
  type:'monster', priority:1, activateFrom:['grave'], targets:true, forced:true,
  summonProcedure:{from:'hand', positions:['atk','def'], condition(ctx){
    if(!API.fieldCards({zone:'mz', player:ctx.player, filter:x=>x.card.face==='up' && x.db.n==='真六武衆－ミズホ'}).length){ ctx.reason = '自分フィールドに「真六武衆－ミズホ」が必要です'; return false; }
    return true;
  }},
  condition(ctx){
    if(!shinaiReleasedS03(ctx)){ ctx.reason = 'フィールド上でリリースされた場合に発動します'; return false; }
    if(!shinaiTargetsS03(ctx).length){ ctx.reason = '墓地に他の「六武衆」モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('真六武衆－シナイ：手札に加える「六武衆」', shinaiTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave') API.returnToHand(h, '真六武衆－シナイ');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return shinaiReleasedS03(ctx) && shinaiTargetsS03(ctx).length>0; } }
});

/* ---- 魔轟神獣ガナシア: このカードが手札から墓地へ捨てられた時、このカードを墓地から特殊召喚する。この効果で特殊召喚したこのカードの攻撃力は200ポイントアップし、
   フィールド上から離れた場合ゲームから除外される。 (forced; 「ペガラサス」 pattern; the +200 is a stat modifier that ends when it leaves the field) ---- */
defineScript('魔轟神獣ガナシア', {
  type:'monster', priority:1, activateFrom:['grave'], forced:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onDiscardAnyS03' || ctx.zone!=='grave' || !eventIsSelfS03(ctx)){ ctx.reason = '手札から捨てられた時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const me = findCardByUid(ctx.card.uid);
    if(!me || me.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
    if(API.specialSummon(ctx.player, 'grave', me.index, 'atk', '魔轟神獣ガナシア')===false) return;
    const now = findCardByUid(ctx.card.uid);
    if(!now || now.zone!=='mz') return;
    API.setCardFlag(now, 'banishWhenLeavesField', true, '魔轟神獣ガナシア', {silent:true});
    v4RegisterStatModifier(now, {atk:200}, {controller:ctx.player, code:'魔轟神獣ガナシア +200', targetCard:now.card, resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){},
  passive:{ onDiscardAnyS03(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
});
