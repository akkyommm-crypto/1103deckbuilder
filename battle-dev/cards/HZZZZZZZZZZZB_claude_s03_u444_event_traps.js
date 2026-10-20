/* S03-U444: スパイダー・エッグ, スリップ・サモン, パイナップル爆弾, ヘル・ブラスト, ブロークン・ブロッカー (stale ENGINE_GAP Traps, carddata texts).

   スパイダー・エッグ    相手が直接攻撃を宣言した時、自分の墓地に昆虫族モンスターが3体以上存在する場合に発動する事ができる。そのモンスターの攻撃を無効にし、自分フィールド上に「スパイダー・トークン」(昆虫族・地・星1・攻/守100)3体を攻撃表示で特殊召喚する。
   スリップ・サモン      相手がモンスターの召喚・反転召喚・特殊召喚に成功した時に発動する事ができる。手札からレベル4以下のモンスター1体を表側守備表示で特殊召喚する。この効果で特殊召喚したモンスターはエンドフェイズ時に持ち主の手札に戻る。
   パイナップル爆弾      自分がモンスターの召喚に成功した時に発動する事ができる。相手フィールド上のモンスターの数が自分のコントロールするモンスターの数より多い場合、同じ数になるように相手のカードを破壊する。破壊するカードは相手が選択する。
   ヘル・ブラスト        自分フィールド上に表側表示で存在するモンスターが破壊され墓地へ送られた時に発動する事ができる。フィールド上の攻撃力が一番低い表側表示モンスター1体を破壊し、お互いにその攻撃力の半分のダメージを受ける。
   ブロークン・ブロッカー  自分フィールド上に存在する攻撃力よりも守備力の高い守備表示モンスターが、戦闘によって破壊された場合に発動する事ができる。そのモンスターと同名モンスターを2体まで自分のデッキから表側守備表示で特殊召喚する。

   Notes
   - スパイダー・エッグ: passive onAttackDeclare on a Set card, gameState.pendingAttack by the opponent with targetUid null (direct); API.negateAttack + 3 tokens in Attack Position (defineTokenSpecV11).
   - スリップ・サモン: onOtherSummon:true trap (激流葬 pattern) reacting to a summon of the OPPONENT's monster; the hand Level 4 or lower monster is Special Summoned face-up Defense and returns at the End Phase (S03-U441 handler s03u441.fake-hero-return).
   - パイナップル爆弾: onNormalSummon of my monster; the opponent chooses n cards (ChoiceRequest, player = the opponent) of their field (Monster / Spell & Trap / Field Zone), n = their monsters - my monsters.
   - ヘル・ブラスト / ブロークン・ブロッカー: passive onSendToGrave on a Set trap (the destroyed monster read through its graveInfo this turn: from 'mz', byDestroy / battle, face-up). ヘル・ブラスト: the lowest-ATK face-up monster (ties: my choice) is destroyed and both players take half its ATK. ブロークン・ブロッカー: the DEF > ATK Defense Position monster destroyed by battle (graveInfo.pos 'def'), up to 2 same-name copies from the Deck in face-up Defense Position. */

/* ---- スパイダー・エッグ ---- */
defineTokenSpecV11('スパイダー・トークン', {atk:100, def:100, lv:1, ra:'昆虫', at:'地', pos:'atk'});
function u444DirectDeclared(ctx){ const a = gameState.pendingAttack; return !!a && a.player===ctx.opponent && a.targetUid==null; }   /* pendingAttack has no target index: a direct attack has targetUid null */
defineScript('スパイダー・エッグ', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u444DirectDeclared(ctx)){ ctx.reason = '相手が直接攻撃を宣言した時に発動します'; return false; }
    if(API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='昆虫').length<3){ ctx.reason = '墓地に昆虫族モンスターが3体以上必要です'; return false; }
    return true;
  },
  resolve(ctx){ API.negateAttack('スパイダー・エッグ'); API.createTokens(ctx.player, 'スパイダー・トークン', 3); },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && u444DirectDeclared(ctx) && API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='昆虫').length>=3; } }
});

/* ---- スリップ・サモン ---- */
function u444FoeSummoned(ctx){
  const ev = ctx.event || {}, cards = Array.isArray(ev.cards) ? ev.cards : (ev.card ? [ev.card] : []);
  return cards.filter(card=>{ const h = locateCard(card); return h && h.p===ctx.opponent && h.zone==='mz' && card.face==='up'; });
}
function u444Small(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && Number(x.db.lv)<=4 && canEffectSpecialSummonS03(x.card, 'hand', 'スリップ・サモン')); }
defineScript('スリップ・サモン', {
  onOtherSummon:true, type:'trap', priority:2,
  condition(ctx){
    if(!u444FoeSummoned(ctx).length){ ctx.reason = '相手のモンスターが召喚・反転召喚・特殊召喚に成功した時に発動します'; return false; }
    if(!u444Small(ctx.player).length || !hasMonsterZoneSpace(ctx.player)){ ctx.reason = '特殊召喚できるレベル4以下のモンスターが手札にいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = u444Small(ctx.player); if(!pool.length) return;
    API.selectCard('スリップ・サモン：特殊召喚するレベル4以下のモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      if(!API.specialSummon(ctx.player, 'hand', r.index, 'def', 'スリップ・サモン')) return;
      const h = findCardByUid(uid); if(!h || h.zone!=='mz') return;
      API.setCardFlag(h, 'u441Fake', gameState.turn, 'スリップ・サモン', {silent:true});
      API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'s03u441.fake-hero-return', args:{uid, turn:gameState.turn}, note:'スリップ・サモン'});
    });
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && u444FoeSummoned(ctx).length>0; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && u444FoeSummoned(ctx).length>0; },
    onFlip(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && !!(ctx.event && ctx.event.flipSummon) && u444FoeSummoned(ctx).length>0; }
  }
});

/* ---- パイナップル爆弾 ---- */
function u444OwnSummoned(ctx){
  const ev = ctx.event || {}, cards = Array.isArray(ev.cards) ? ev.cards : (ev.card ? [ev.card] : []);
  return cards.some(card=>{ const h = locateCard(card); return h && h.p===ctx.player && h.zone==='mz' && card.face==='up'; });
}
function u444Excess(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz'}).length - API.fieldCards({player:ctx.player, zone:'mz'}).length; }
function u444FoeField(p){ return API.fieldCards({player:p, zone:'mz'}).concat(API.fieldCards({player:p, zone:'sz'}), API.fieldCards({player:p, zone:'field'})); }
API.registerChoiceHandler('s03u444.pine', (answer, args)=>{
  u441Picks(answer).map(x=>x.card.uid).forEach(u=>{ const h = findCardByUid(u); if(h && h.p===args.foe && (h.zone==='mz' || h.zone==='sz' || h.zone==='field')) API.destroy(h, 'パイナップル爆弾'); });
});
defineScript('パイナップル爆弾', {
  onOtherSummon:true, type:'trap', priority:2,
  condition(ctx){
    if(!u444OwnSummoned(ctx)){ ctx.reason = '自分のモンスターの召喚に成功した時に発動します'; return false; }
    if(u444Excess(ctx)<=0){ ctx.reason = '相手のモンスターの数が自分より多くありません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = u444Excess(ctx); if(n<=0) return;
    const pool = u444FoeField(ctx.opponent); pool.forEach(x=>ensureCardUid(gameState, x.card));
    const k = Math.min(n, pool.length); if(!k) return;
    API.requestChoice({kind:'card', title:'パイナップル爆弾：破壊する自分のカードを'+k+'枚選ぶ', candidates:pool, min:k, max:k, player:ctx.opponent, cancelable:false, resume:{handler:'s03u444.pine', args:{foe:ctx.opponent}}});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz' && u444OwnSummoned(ctx) && u444Excess(ctx)>0; } }
});

/* ---- ヘル・ブラスト ---- */
function u444Fell(ctx){
  const ev = ctx.event || {}; if(ev.uid==null) return null;
  const h = findCardByUid(ev.uid); if(!h || h.zone!=='grave' || h.p!==ctx.player) return null;
  const g = h.card.graveInfo; if(!g || g.from!=='mz' || !g.byDestroy || g.face!=='up' || Number(g.turn)!==Number(gameState.turn) || dbOf(h.card).k!=='m') return null;
  return h;
}
defineScript('ヘル・ブラスト', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u444Fell(ctx)){ ctx.reason = '自分の表側表示のモンスターが破壊され墓地へ送られた時に発動します'; return false; }
    if(!API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const up = API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); if(!up.length) return;
    const min = Math.min.apply(null, up.map(x=>curATK(x.card))), low = up.filter(x=>curATK(x.card)===min);
    const fire = x=>{ const atk = curATK(x.card), uid = ensureCardUid(gameState, x.card); const h = findCardByUid(uid); if(h && h.zone==='mz') API.destroy(h, 'ヘル・ブラスト'); const d = Math.floor(Math.max(0, atk)/2); API.damageLP(0, d, 'ヘル・ブラスト'); API.damageLP(1, d, 'ヘル・ブラスト'); };
    if(low.length===1) fire(low[0]); else API.selectCard('ヘル・ブラスト：破壊する攻撃力が一番低いモンスター', low, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz') fire(r); });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && !!u444Fell(ctx); } }
});

/* ---- ブロークン・ブロッカー ---- */
function u444Blocker(ctx){
  const h = u444Fell(ctx); if(!h) return null;
  const g = h.card.graveInfo, d = dbOf(h.card);
  return (g.battle && g.pos==='def' && Number(d.def)>Number(d.atk)) ? h : null;
}
defineScript('ブロークン・ブロッカー', {
  type:'trap', priority:2,
  condition(ctx){
    const h = u444Blocker(ctx);
    if(!h){ ctx.reason = '攻撃力より守備力の高い守備表示の自分のモンスターが戦闘で破壊された時に発動します'; return false; }
    if(!API.pileCards(ctx.player, 'deck', x=>x.db.n===dbOf(h.card).n).length || !hasMonsterZoneSpace(ctx.player)){ ctx.reason = '特殊召喚できる同名モンスターがデッキにいません'; return false; }
    return true;
  },
  resolve(ctx){
    const h = u444Blocker(ctx); if(!h) return;
    const nm = dbOf(h.card).n, uids = API.pileCards(ctx.player, 'deck', x=>x.db.n===nm).map(x=>ensureCardUid(gameState, x.card)).slice(0, 2);
    uids.forEach(u=>{ if(!hasMonsterZoneSpace(ctx.player)) return; const d = findCardByUid(u); if(d && d.zone==='deck') API.specialSummon(ctx.player, 'deck', d.index, 'def', 'ブロークン・ブロッカー'); });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && !!u444Blocker(ctx); } }
});
