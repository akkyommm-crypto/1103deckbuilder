/* S03-U408: バスター・モード and six 「/バスター」 monsters (carddata texts).

   バスター・モード  （通常魔法）①:自分フィールドのSモンスター1体をリリースして発動できる。そのモンスターのカード名が含まれる「/バスター」モンスター1体をデッキから攻撃表示で特殊召喚する。
   レッド・デーモンズ・ドラゴン／バスター  通常召喚できない。「バスター・モード」の効果でのみ特殊召喚できる。このカードが攻撃した場合、ダメージ計算後にこのカード以外のフィールド上のモンスターを全て破壊する。また、フィールド上のこのカードが破壊された時、自分の墓地の「レッド・デーモンズ・ドラゴン」1体を選択して特殊召喚できる。
   ハイパーサイコガンナー／バスター  通常召喚できない。「バスター・モード」の効果でのみ特殊召喚できる。このカードが相手モンスターと戦闘を行ったダメージステップ終了時、その相手モンスターの守備力分のダメージを相手ライフに与え、その攻撃力分だけ自分のライフポイントを回復する。また、フィールド上のこのカードが破壊された時、自分の墓地の「ハイパーサイコガンナー」1体を選択して特殊召喚できる。
   アーカナイト・マジシャン／バスター  通常召喚できない。「バスター・モード」の効果でのみ特殊召喚できる。特殊召喚に成功した時、魔力カウンターを2つ置く。攻撃力は魔力カウンターの数×1000アップ。魔力カウンターを2つ取り除く事で、相手フィールド上のカードを全て破壊する。また、破壊された時、自分の墓地の「アーカナイト・マジシャン」1体を特殊召喚できる。
   ギガンテック・ファイター／バスター  通常召喚できない。「バスター・モード」の効果でのみ特殊召喚できる。フィールド上に表側表示で存在する限り、全ての相手モンスターの攻撃力は、自分の墓地の戦士族モンスターの数×100ダウン。特殊召喚に成功した時、デッキから戦士族モンスターを2体まで墓地へ送る事ができる。また、破壊された時、自分の墓地の「ギガンテック・ファイター」1体を特殊召喚できる。
   スターダスト・ドラゴン／バスター  通常召喚できない。「バスター・モード」の効果及びこのカードの効果でのみ特殊召喚できる。魔法・罠・効果モンスターの効果が発動した時、このカードをリリースする事でその発動を無効にし破壊する。この効果を適用したターンのエンドフェイズ時、リリースされ墓地に存在するこのカードを特殊召喚できる。また、破壊された時、自分の墓地の「スターダスト・ドラゴン」1体を特殊召喚できる。
   デスカイザー・ドラゴン／バスター  通常召喚できない。「バスター・モード」の効果でのみ特殊召喚できる。特殊召喚に成功した時、自分・相手の墓地からアンデット族モンスターを任意の数だけ自分フィールド上に特殊召喚する。この効果で特殊召喚したモンスターの効果は無効化され、このターンのエンドフェイズ時に破壊される。また、破壊された時、自分の墓地の「デスカイザー・ドラゴン」1体を特殊召喚できる。

   Notes
   - バスター・モード: the identity metadata is the NAME (the Deck monster is named 「<released Synchro name>／バスター」); the released Synchro is the cost (sendToGrave); the Deck selection is a plain selectCard (the Replay journals the answer).
   - Every Buster: cannotNormalSummon; the 「でのみ特殊召喚」 clause is the text rule of engine/1ZK (the reason is バスター・モード); the revival after being destroyed on the field is an optional Graveyard trigger (graveInfo.byDestroy, from 'mz', this turn) choosing the base monster of the Graveyard.
   - RDD: onDamageStep step 'leave' with it as the attacker; HPG: step 'leave', the battle partner's DEF to the opponent and ATK to my LP; アーカナイト: counters API (魔力), continuous +1000 ATK per counter, ignition removing 2; ギガンテック: continuous oppMonsters ATK -100 x Warriors in my Graveyard, Deck Warriors to the Graveyard on its Special Summon; スターダスト: the QUICK negation and End Phase return of スターダスト・ドラゴン (v46 helpers); デスカイザー: Undead of both Graveyards, negated (negateEffectUntil permanent) and destroyed at the End Phase (scheduled). */

/* ---- common ---- */
const U408_PASSIVE_GONE = ()=>({});
function u408Gone(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && ((e.uid!=null && e.uid===ctx.card.uid) || e.card===ctx.card) && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn);   /* the mass-destruction event carries card, not uid */
}
function u408BaseGrave(ctx, base){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.n===base && canEffectSpecialSummonS03(x.card, 'grave', ctx.card && cardName(ctx.card))); }
function u408ReviveEffect(base){
  return {
    key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], targetRange:LOCATION.GRAVE, targetSide:'self',
    condition(ctx){ return u408Gone(ctx) && u408BaseGrave(ctx, base).length>0 && hasMonsterZoneSpace(ctx.player); },
    target(ctx, done){ API.selectCard(`${cardName(ctx.card)}：特殊召喚する「${base}」`, u408BaseGrave(ctx, base), t=>done([t])); },
    operation(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', cardName(ctx.card));
    },
    afterResolve(){}
  };
}
function u408Meta(base, extra){
  const ex = extra || {}, pas = Object.assign({}, ex.passive || {});
  const goneP = ctx=>u408Gone(ctx) && u408BaseGrave(ctx, base).length>0 && hasMonsterZoneSpace(ctx.player);
  pas.onSendToGrave = goneP; pas.onDestroy = goneP;
  return Object.assign({type:'monster', priority:1, cannotNormalSummon:true, targets:true, timing:['free'], activateFrom:['mz','grave']}, ex, {passive:pas});
}
function u408Self(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); }

/* ---- バスター・モード ---- */
function u408Synchros(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('シンクロ')>=0
    && API.pileCards(ctx.player, 'deck', y=>y.db.n===x.db.n+'／バスター').length>0});
}
defineScript('バスター・モード', {
  type:'spell', priority:1, includesSpecialSummon:true,
  condition(ctx){
    if(!u408Synchros(ctx).length){ ctx.reason = 'デッキに対応する「/バスター」モンスターがいるSモンスターが自分フィールドにいません'; return false; }
    if(API.me(ctx).mz.length<1 && false) return false;
    return true;
  },
  cost(ctx, done){
    const pool = u408Synchros(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('バスター・モード：リリースするSモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.setFlag(ctx.player, 'u408BusterName', dbOf(r.card).n+'／バスター', true);
      API.sendToGrave(r, 'バスター・モード（リリース）'); done(true);
    });
  },
  resolve(ctx){
    const nm = API.getFlag(ctx.player, 'u408BusterName'); if(!nm || !hasMonsterZoneSpace(ctx.player)) return;
    const pool = API.pileCards(ctx.player, 'deck', y=>y.db.n===nm && canEffectSpecialSummonS03(y.card, 'deck', 'バスター・モード'));
    if(!pool.length) return;
    API.selectCard('バスター・モード：特殊召喚する「/バスター」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='deck' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'バスター・モード');
    });
  },
  afterResolve(){}
});

/* ---- レッド・デーモンズ・ドラゴン／バスター ---- */
function u408Sweeper(ctx){ const b = ctx.battle || {}; return ctx.zone==='mz' && ctx.card.face==='up' && ctx.step==='leave' && b.atkCard===ctx.card; }
defineUnifiedCardV4('レッド・デーモンズ・ドラゴン／バスター', [{
  key:'sweep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u408Sweeper(ctx); },
  operation(ctx){ API.fieldCards({zone:'mz', filter:x=>x.card!==ctx.card}).slice().reverse().forEach(t=>API.destroy(t, 'レッド・デーモンズ・ドラゴン／バスター')); },
  afterResolve(){}
}, u408ReviveEffect('レッド・デーモンズ・ドラゴン')], u408Meta('レッド・デーモンズ・ドラゴン', {forced:true, passive:{ onDamageStep(ctx){ return u408Sweeper(ctx); } }}));

/* ---- ハイパーサイコガンナー／バスター ---- */
function u408Partner(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.step!=='leave') return null;
  if(b.atkCard===ctx.card) return b.defCard || null;
  if(b.defCard===ctx.card) return b.atkCard || null;
  return null;
}
defineUnifiedCardV4('ハイパーサイコガンナー／バスター', [{
  key:'drain', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u408Partner(ctx); },
  operation(ctx){
    const o = u408Partner(ctx); if(!o) return;
    API.damageLP(ctx.opponent, Math.max(0, curDEF(o)), 'ハイパーサイコガンナー／バスター');
    API.recoverLP(ctx.player, Math.max(0, curATK(o)));
  },
  afterResolve(){}
}, u408ReviveEffect('ハイパーサイコガンナー')], u408Meta('ハイパーサイコガンナー', {forced:true, passive:{ onDamageStep(ctx){ return !!u408Partner(ctx); } }}));

/* ---- アーカナイト・マジシャン／バスター ---- */
function u408FoeCards(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz'}).concat(API.fieldCards({player:ctx.opponent, zone:'sz'}), API.fieldCards({player:ctx.opponent, zone:'field'})); }
function u408Counters(card){ const h = locateCardAnyV4(card); return h ? Number(API.countCounter(h, '魔力'))||0 : 0; }
defineUnifiedCardV4('アーカナイト・マジシャン／バスター', [{
  key:'counters', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u408Self(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.addCounter(me, '魔力', 2); },
  afterResolve(){}
}, {
  key:'blast', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(u408Counters(ctx.card)<2){ ctx.reason = '魔力カウンターが2つ必要です'; return false; }
    if(!u408FoeCards(ctx).length){ ctx.reason = '相手フィールドにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || u408Counters(ctx.card)<2){ done(false); return; } API.removeCounter(me, '魔力', 2); done(true); },
  operation(ctx){ u408FoeCards(ctx).slice().reverse().forEach(t=>API.destroy(t, 'アーカナイト・マジシャン／バスター')); },
  afterResolve(){}
}, u408ReviveEffect('アーカナイト・マジシャン')], u408Meta('アーカナイト・マジシャン', {forced:true,
  continuous:{ scope:'self', from:['mz'], apply(card, self){ return (card===self && self.face==='up') ? {atk:1000*u408Counters(self)} : null; } },
  passive:{ onSpecialSummon(ctx){ return u408Self(ctx); } }}));

/* ---- ギガンテック・ファイター／バスター ---- */
function u408Warriors(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='戦士').length; }
defineUnifiedCardV4('ギガンテック・ファイター／バスター', [{
  key:'mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ return u408Self(ctx) && API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && x.db.ra==='戦士').length>0; },
  operation(ctx){
    const pool = API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && x.db.ra==='戦士'); if(!pool.length) return;
    v46PickAnyAtLeastOne('ギガンテック・ファイター／バスター：墓地へ送る戦士族モンスター（2体まで）', pool, 2, picked=>{
      picked.map(t=>ensureCardUid(gameState, t.card)).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='deck') API.sendToGrave(h, 'ギガンテック・ファイター／バスター'); });
    });
  },
  afterResolve(){}
}, u408ReviveEffect('ギガンテック・ファイター')], u408Meta('ギガンテック・ファイター', {
  continuous:{ scope:'oppMonsters', from:['mz'], apply(card, self){
    if(!self || self.face!=='up') return null;
    const h = locateCardAnyV4(self); if(!h) return null;
    const n = u408Warriors(h.p); return n>0 ? {atk:-100*n} : null; } },
  passive:{ onSpecialSummon(ctx){ return u408Self(ctx) && API.pileCards(ctx.player, 'deck', x=>x.db.k==='m' && x.db.ra==='戦士').length>0; } }}));

/* ---- スターダスト・ドラゴン／バスター ---- */
defineUnifiedCardV4('スターダスト・ドラゴン／バスター', [{
  key:'negate-any', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const top = v46TopChain(); if(!top || top.uid===ctx.card.uid){ ctx.reason = '魔法・罠・効果モンスターの効果の発動に直接チェーンします'; return false; }
    return true;
  },
  cost(ctx, done){ const h = v46SelfMz(ctx); if(!h){ done(false); return; } API.sendToGrave(h, 'スターダスト・ドラゴン／バスター（リリース）'); done(true); },
  operation(ctx){
    if(!negatePreviousChainLinkV2('スターダスト・ドラゴン／バスター', true, 'activation')) return;
    const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='grave') return;
    API.setCardFlag(h, 'v46StardustReturnTurn', gameState.turn, 'スターダスト・ドラゴン／バスター');
    v4RegisterRuntimeEffect({owner:ctx.player, controller:ctx.player, code:'stardust-return-v46', kind:'stardustReturnV46', sourceCard:ctx.card, resetMask:RESET.END});
  },
  afterResolve(){}
}, {
  key:'end-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onEndPhase'],
  condition(ctx){
    if(ctx.zone!=='grave' || ctx.card.v46StardustReturnTurn!==gameState.turn || !v46StardustReturnEffect(ctx.card)){ ctx.reason = 'このターン自身の効果のためにリリースされたこのカードが墓地に存在する必要があります'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='grave') return; API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'スターダスト・ドラゴン／バスター'); },
  afterResolve(){}
}, u408ReviveEffect('スターダスト・ドラゴン')], u408Meta('スターダスト・ドラゴン', {priority:2, quickEffect:true, includesSpecialSummon:true,
  passive:{ onEndPhase(ctx){ return ctx.zone==='grave' && ctx.card.v46StardustReturnTurn===gameState.turn && !!v46StardustReturnEffect(ctx.card); } }}));
declareActivationResponseS03(['スターダスト・ドラゴン／バスター']);

/* ---- デスカイザー・ドラゴン／バスター ---- */
API.registerScheduleHandler('u408.deathkaiser-destroy', (args)=>{
  (args && args.uids || []).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz' && Number(h.card.u408KaiserTurn)===Number(args.turn)) API.destroy(h, 'デスカイザー・ドラゴン／バスター'); });
});
function u408Undead(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット' && canEffectSpecialSummonS03(x.card, 'grave', 'デスカイザー・ドラゴン／バスター'))
    .concat(API.pileCards(ctx.opponent, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット' && canEffectSpecialSummonS03(x.card, 'grave', 'デスカイザー・ドラゴン／バスター')));
}
defineUnifiedCardV4('デスカイザー・ドラゴン／バスター', [{
  key:'raise', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ return u408Self(ctx) && u408Undead(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const pool = u408Undead(ctx); if(!pool.length) return;
    const room = ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length;
    v46PickAnyAtLeastOne('デスカイザー・ドラゴン／バスター：特殊召喚するアンデット族モンスター', pool, Math.max(1, room), picked=>{
      const uids = [];
      picked.map(t=>ensureCardUid(gameState, t.card)).forEach(u=>{
        const h = findCardByUid(u); if(!h || h.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
        if(API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'デスカイザー・ドラゴン／バスター', h.p)) uids.push(u);
      });
      uids.forEach(u=>{
        const h = findCardByUid(u); if(!h || h.zone!=='mz') return;
        API.setCardFlag(h, 'u408KaiserTurn', gameState.turn, 'デスカイザー・ドラゴン／バスター', {silent:true});
        const h2 = findCardByUid(u); if(h2) API.negateEffectUntil(h2, 'permanent', 'デスカイザー・ドラゴン／バスター', ctx.card);
      });
      if(uids.length) API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u408.deathkaiser-destroy', args:{uids, turn:gameState.turn}, note:'デスカイザー・ドラゴン／バスター'});
    });
  },
  afterResolve(){}
}, u408ReviveEffect('デスカイザー・ドラゴン')], u408Meta('デスカイザー・ドラゴン', {
  passive:{ onSpecialSummon(ctx){ return u408Self(ctx) && u408Undead(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } }}));
