/* S03-U374: three more PARTIAL auto-table entries replaced by exact scripts (carddata texts).

   D・バリア            自分フィールド上に表側表示で存在する「D」と名のついたモンスターを破壊する魔法・罠カードの発動を無効にし破壊する。さらに自分のデッキから「D」と名のついたカード1枚を手札に加える。
   D・リモコン          このカードの表示形式によって以下の効果を得る。●攻撃表示:1ターンに1度、自分の墓地の「D」と名のついたモンスター1体を選択してゲームから除外し、デッキからそのモンスターと同じレベルを持つ「D」と名のついたモンスター1体を手札に加える。●守備表示:1ターンに1度、手札の「D」と名のついたモンスター1体を墓地へ送り、自分の墓地からそのモンスターと同じレベルを持つ他の「D」と名のついたモンスター1体を選んで手札に加える。
   超古深海王シーラカンス ①:1ターンに1度、手札を1枚捨てて発動できる。デッキからレベル4以下の魚族モンスターを可能な限り特殊召喚する。この効果で特殊召喚したモンスターは攻撃宣言できず、効果は無効化される。②:フィールドのこのカードを対象とする魔法・罠・モンスターの効果が発動した時、このカード以外の自分フィールドの魚族モンスター1体をリリースして発動できる。その効果を無効にし破壊する。

   Notes
   - 「D」 = SETCODE.MORPHTRONIC (isSetCardV4), as S03-U359.
   - D・バリア: the Spell / Trap must be the opponent's, destroy cards by the engine's own category (linkHasCategoryV19 'destroy'), and hit one of MY face-up 「D」 monsters: with targets, one of them is such a monster; without targets
     (ブラック・ホール-type), the card text names monsters and I control a face-up 「D」 monster. Effects that destroy only Spells / Traps are refused. The search adds one 「D」 card (any kind) from the Deck.
   - D・リモコン: each mode has its own once-per-turn mark (turn-stamped card flags), because the text gives the two Positions separate 「1ターンに1度」.
   - 超古深海王シーラカンス ①: every Level 4 or lower Fish that fits the free Monster Zones is Special Summoned in Attack Position; each carries the engine's permanent zone-local card.cannotAttack mark (cannotAttackNow) and a permanent negation.
     ②: the quick response on onActivateSuccess when the activation's chain link targets this card (as ラヴァル・ステライド, S03-U325); the cost is releasing another face-up own Fish. */

function u374D(db){ return !!db && isSetCardV4(db, SETCODE.MORPHTRONIC); }
function u374Top(){ return gameState.chain && gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null; }
function u374TopDb(top){ const i = top ? findCardIndex(top.name) : -1; return i>=0 ? CARD_DB[i] : null; }

/* ---- D・バリア ---- */
function u374BarrierHit(ctx){
  const top = u374Top(), db = u374TopDb(top);
  if(!top || !db || top.player!==ctx.opponent || (db.k!=='s' && db.k!=='t')) return false;
  if(typeof linkHasCategoryV19!=='function' || !linkHasCategoryV19(gameState, top, 'destroy')) return false;
  const mine = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && u374D(x.db)});
  if(!mine.length) return false;
  const ts = typeof linkTargetsV19==='function' ? linkTargetsV19(gameState, top) : [];
  if(ts.length) return ts.some(h=>h.zone==='mz' && h.p===ctx.player && h.card.face==='up' && u374D(dbOf(h.card)));
  return /モンスター[^。]*破壊/.test(String(db.e||''));
}
function u374BarrierPool(p){ return API.pileCards(p, 'deck', x=>u374D(x.db)); }
defineScript('D・バリア', {
  type:'counter', priority:3,
  condition(ctx){ if(!u374BarrierHit(ctx)){ ctx.reason = '自分の表側表示の「D」モンスターを破壊する魔法・罠カードの発動時に発動します'; return false; } return true; },
  resolve(ctx){
    negatePreviousChainLinkV2('D・バリア', true);
    const pool = u374BarrierPool(ctx.player); if(!pool.length){ API.shuffle(ctx.player); return; }
    API.selectCard('D・バリア：手札に加える「D」カード', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='deck' && r.p===ctx.player) API.searchDeck(ctx.player, r.index, 'D・バリア'); });
  },
  afterResolve(){}
});

/* ---- D・リモコン ---- */
function u374Used(card, key){ return Number(card[key])===Number(gameState.turn); }
function u374Mark(ctx, key){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, key, gameState.turn, 'D・リモコン', {silent:true}); }
function u374RemoteAtkGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u374D(x.db) && u374RemoteAtkDeck(ctx.player, x.db.lv).length>0); }
function u374RemoteAtkDeck(p, lv){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && u374D(x.db) && Number(x.db.lv)===Number(lv)); }
function u374RemoteDefHand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && u374D(x.db) && u374RemoteDefGrave(ctx.player, x.db.lv, null).length>0); }
function u374RemoteDefGrave(p, lv, exceptCard){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && u374D(x.db) && Number(x.db.lv)===Number(lv) && x.card!==exceptCard); }
defineUnifiedCardV4('D・リモコン', [{
  key:'attack-mode', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.card.pos!=='atk'){ ctx.reason = '表側攻撃表示の時に発動できます'; return false; }
    if(u374Used(ctx.card, 'u374RemoteAtkTurn')){ ctx.reason = '攻撃表示の効果は1ターンに1度です'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u374RemoteAtkGrave(ctx).length){ ctx.reason = '除外できる「D」モンスターと、同じレベルの「D」モンスターがデッキにいる必要があります'; return false; }
    return true;
  },
  cost(ctx, done){ u374Mark(ctx, 'u374RemoteAtkTurn'); done(true); },
  target(ctx, done){ API.selectCard('D・リモコン：ゲームから除外する墓地の「D」モンスター', u374RemoteAtkGrave(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || u342Bad()) return;
    const lv = Number(dbOf(r.card).lv); API.banish(r, 'D・リモコン');
    const pool = u374RemoteAtkDeck(ctx.player, lv); if(!pool.length){ API.shuffle(ctx.player); return; }
    API.selectCard('D・リモコン：手札に加える同じレベルの「D」モンスター', pool, t2=>{ const r2 = t2 && resolveTarget(t2); if(r2 && r2.zone==='deck' && r2.p===ctx.player) API.searchDeck(ctx.player, r2.index, 'D・リモコン'); });
  },
  afterResolve(){}
}, {
  key:'defense-mode', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up' || ctx.card.pos!=='def'){ ctx.reason = '表側守備表示の時に発動できます'; return false; }
    if(u374Used(ctx.card, 'u374RemoteDefTurn')){ ctx.reason = '守備表示の効果は1ターンに1度です'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u374RemoteDefHand(ctx).length){ ctx.reason = '墓地へ送れる「D」モンスターと、同じレベルの他の「D」モンスターが墓地にいる必要があります'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('D・リモコン：墓地へ送る手札の「D」モンスター', u374RemoteDefHand(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      const lv = Number(dbOf(r.card).lv), sent = ensureCardUid(gameState, r.card), me = locateCardAnyV4(ctx.card);
      if(me && me.zone==='mz'){ API.setCardFlag(me, 'u374RemoteLv', lv, 'D・リモコン', {silent:true}); API.setCardFlag(me, 'u374RemoteSent', sent, 'D・リモコン', {silent:true}); }
      API.discard(ctx.player, r.index, 'D・リモコン（コスト）', {byEffect:false}); u374Mark(ctx, 'u374RemoteDefTurn'); done(true);
    });
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card), lv = me ? me.card.u374RemoteLv : null, sent = me ? me.card.u374RemoteSent : null;
    if(lv==null) return;
    const pool = API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u374D(x.db) && Number(x.db.lv)===Number(lv) && x.card.uid!==sent); if(!pool.length) return;
    API.selectCard('D・リモコン：手札に加える同じレベルの「D」モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, 'D・リモコン'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase']});

/* ---- 超古深海王シーラカンス ---- */
function u374Fish(db){ return !!db && db.k==='m' && db.ra==='魚' && Number(db.lv)<=4; }
function u374CoelaPool(ctx){ return API.pileCards(ctx.player, 'deck', x=>u374Fish(x.db) && canEffectSpecialSummonS03(x.card, 'deck', '超古深海王シーラカンス')); }
function u374CoelaUp(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; }
function u374CoelaFish(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.ra==='魚'}); }
function u374Targeted(ctx){
  const e = ctx.event;
  if(!e || e.chainId==null || typeof chainLinkTargetsV11!=='function') return false;
  const uids = [];
  chainLinkTargetsV11(e.chainId).forEach(x=>[x, x && x.t].forEach(y=>{ if(!y) return; const u = y.uid!=null ? y.uid : (y.card ? y.card.uid : null); if(u!=null) uids.push(u); }));
  return ctx.card.uid!=null && uids.indexOf(ctx.card.uid)>=0;
}
defineUnifiedCardV4('超古深海王シーラカンス', [{
  key:'summon-fish', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u374CoelaUp(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u374CoelaPool(ctx).length){ ctx.reason = 'デッキにレベル4以下の魚族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('超古深海王シーラカンス：捨てる手札', API.pileCards(ctx.player, 'hand', ()=>true), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '超古深海王シーラカンス（コスト）', {byEffect:false}); done(true);
    });
  },
  operation(ctx){
    for(let guard=0; guard<10 && hasMonsterZoneSpace(ctx.player); guard++){
      const pool = u374CoelaPool(ctx); if(!pool.length) break;
      const r = pool[0], uid = ensureCardUid(gameState, r.card);
      API.specialSummon(ctx.player, 'deck', r.index, 'atk', '超古深海王シーラカンス');
      const m = findCardByUid(uid); if(!m || m.zone!=='mz') continue;
      API.setCardFlag(m, 'cannotAttack', true, '超古深海王シーラカンス', {silent:true});
      API.negateEffectUntil(m, 'permanent', '超古深海王シーラカンス', ctx.card);
    }
    API.shuffle(ctx.player);
  },
  afterResolve(){}
}, {
  key:'protect', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['onActivateSuccess'],
  condition(ctx){
    if(!u374CoelaUp(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    if(!u374Targeted(ctx)){ ctx.reason = 'このカードを対象とするカードの効果が発動した時に発動します'; return false; }
    if(!u374CoelaFish(ctx).length){ ctx.reason = 'リリースできる他の魚族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('超古深海王シーラカンス：リリースする魚族モンスター', u374CoelaFish(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '超古深海王シーラカンス（リリース）'); done(true);
    });
  },
  operation(ctx){ const e = ctx.event; if(e && e.chainId!=null) API.negateChainLink(e.chainId, 'activation', '超古深海王シーラカンス', true); },
  afterResolve(){}
}], {type:'monster', priority:2, targets:true, timing:['free','chain','mainPhase'], activateFrom:['mz'], includesSpecialSummon:true,
  countLimit:{n:1, effects:['summon-fish']},
  passive:{ onActivateSuccess(ctx){ return u374CoelaUp(ctx) && u374Targeted(ctx) && u374CoelaFish(ctx).length>0; } } });
declareActivationResponseS03(['超古深海王シーラカンス']);
