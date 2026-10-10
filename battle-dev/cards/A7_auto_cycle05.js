/* Auto cycle 05 — 20枚。engine 変更なし。
     AA ドロー・除外・LP の単純処理
     AB リリースコスト系
     AC v30 B3 の「このターン破壊された」記録を使う回収系
     AD 装備魔法（v15）／永続の1ターンに1度
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* このターン戦闘で破壊されて「自分の」墓地にあるモンスター。
   v30 B3 の destroyedThisTurnV30（純JSON・ターン単位）から読む。 */
function a7DestroyedThisTurn(p, opt){
  const o = opt || {};
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  const out = [];
  log.forEach(x => {
    if(!x || x.turn !== gameState.turn) return;
    if(x.from !== 'mz') return;
    if(o.battleOnly && !x.battle) return;
    if(x.uid == null) return;
    const h = findCardByUid(x.uid);
    if(!h || h.zone !== 'grave') return;
    if(o.owner === 0 || o.owner === 1){ if(h.p !== o.owner) return; }
    if(dbOf(h.card).k !== 'm') return;
    if(out.indexOf(h.card) < 0) out.push(h.card);
  });
  return out;
}
/* 「攻撃力が?」のモンスター（DB では atk が -2） */
function a7IsQuestionAtk(db){ return Number(db && db.atk) === -2; }
/* 自分フィールドのこのカードをリリースする共通コスト */
function a7TributeSelf(ctx, done, label){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz'){ done(false); return; }
  API.sendToGrave(me, label);
  done(true);
}

/* ===================== AA. ドロー・除外・LP ===================== */

/* 1. カオス・グリード — 自分のカードが4枚以上除外されており、自分の墓地が空なら2ドロー */
defineScript('カオス・グリード', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(API.me(ctx).banish.length < 4){ ctx.reason = '自分のカードが4枚以上除外されている必要があります'; return false; }
    if(API.me(ctx).grave.length > 0){ ctx.reason = '自分の墓地にカードが存在しない必要があります'; return false; }
    if(API.me(ctx).deck.length < 2){ ctx.reason = 'デッキが2枚以上必要です'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){}
});

/* 2. 凡人の施し — 2ドローし、その後手札の通常モンスター1体を除外。
   手札に通常モンスターが無ければ手札を全て墓地へ送る。 */
function a7NormalInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && (x.db.st || []).includes('通常'));
}
defineScript('凡人の施し', {
  type:'trap', priority:2,
  condition(ctx){
    if(API.me(ctx).deck.length < 2){ ctx.reason = 'デッキが2枚以上必要です'; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 2);
    const q = a7NormalInHand(ctx.player);
    if(q.length){
      API.requestChoice({player:ctx.player, kind:'card', title:'凡人の施し：除外する通常モンスター',
        candidates: q, min:1, max:1, cancelable:true,
        resume:{handler:'s03u62.gift-of-mortal-banish', args:{player:ctx.player}},
        meta:{scriptName:'凡人の施し'}});
      return;
    }
    /* 通常モンスターが無い場合は手札を全て墓地へ */
    const hand = API.me(ctx).hand || [];
    for(let i = hand.length - 1; i >= 0; i--) API.sendHandToGrave(ctx.player, i, '凡人の施し');
  },
  afterResolve(){}
});
/* S03-U62: resolve() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.gift-of-mortal-banish', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='hand') API.banish(h, '凡人の施し');
});

/* 3. 軽量化 — 手札のレベル7以上を1体デッキに戻してシャッフルし、1ドロー。1ターンに1度。 */
function a7HeavyInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && Number(x.db.lv || 0) >= 7);
}
defineScript('軽量化', {
  type:'spell', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!a7HeavyInHand(ctx.player).length){ ctx.reason = '手札にレベル7以上のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('軽量化：デッキに戻すレベル7以上のモンスター', a7HeavyInHand(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    API.returnToDeck(r, false, '軽量化');
    API.shuffle(ctx.player);
    API.draw(ctx.player, 1);
  },
  afterResolve(){}
});

/* 4. ブライト・フューチャー — 除外されている自分のサイキック族2体を墓地に戻して1ドロー */
function a7BanishedPsychic(p){
  return API.pileCards(p, 'banish', x => x.db.k === 'm' && x.db.ra === 'サイキック');
}
defineScript('ブライト・フューチャー', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(a7BanishedPsychic(ctx.player).length < 2){ ctx.reason = '除外されている自分のサイキック族が2体必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = a7BanishedPsychic(ctx.player);
    API.selectCard('ブライト・フューチャー：墓地に戻すサイキック族（1体目）', q, a => {
      const rest = a7BanishedPsychic(ctx.player).filter(x => x.card !== a.card);
      API.selectCard('ブライト・フューチャー：墓地に戻すサイキック族（2体目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    (ctx.selectedTargets || []).forEach(t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'banish') API.sendToGrave(r, 'ブライト・フューチャー');
    });
    API.draw(ctx.player, 1);
  },
  afterResolve(){}
});

/* 5. フレイム・オーガ — 特殊召喚できない。召喚に成功した時1ドロー。 */
defineScript('フレイム・オーガ', {
  type:'monster', priority:1, forced:true, cannotSpecialSummon:true,
  condition(ctx){
    const e = ctx.event || {};
    if(!(e.card === ctx.card || e.uid === ctx.card.uid)){ ctx.reason = 'このカードの召喚時に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    const e = ctx.event || {};
    return (e.card === ctx.card || e.uid === ctx.card.uid) && API.me(ctx).deck.length > 0; } }
});

/* 6. 電動刃虫 — 戦闘を行った場合、ダメージステップ終了時に相手が1枚ドローする */
defineScript('電動刃虫', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const b = ctx.battle || {};
    if(!(b.atkCard === ctx.card || b.defCard === ctx.card)){ ctx.reason = 'このカードが戦闘を行った場合に発動します'; return false; }
    if(!API.foe(ctx).deck.length){ ctx.reason = '相手のデッキがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.opponent, 1); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    return (b.atkCard === ctx.card || b.defCard === ctx.card) && API.foe(ctx).deck.length > 0; } }
});

/* 7. 幸運の鉄斧（装備魔法） — ①装備モンスターの攻撃力+500
   ②相手の効果で破壊され墓地へ送られた場合、1枚ドローする（v30 B1 の byPlayer を使う） */
defineScript('幸運の鉄斧', {
  type:'spell', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.byDestroy && g.turn === gameState.turn)){ ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    if(g.byPlayer !== ctx.opponent){ ctx.reason = '相手の効果で破壊された場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onDestroy(ctx){
    const g = ctx.card.graveInfo;
    return ctx.zone === 'grave' && !!(g && g.byDestroy && g.turn === gameState.turn
      && g.byPlayer === ctx.opponent) && API.me(ctx).deck.length > 0; } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return { atk:500 }; } }
});

/* 8. カードエクスクルーダー — 相手の墓地のカード1枚を除外する。1ターンに1度。 */
defineScript('カードエクスクルーダー', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave').length){ ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('カードエクスクルーダー：除外する相手の墓地のカード',
      API.pileCards(ctx.opponent, 'grave'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, 'カードエクスクルーダー');
  },
  afterResolve(){}
});

/* ===================== AB. リリースコスト系 ===================== */

/* 9. 木遁封印式（永続罠） — 1ターンに1度、自分の表側地属性1体をリリースし、
   相手の墓地のカードを2枚まで除外する */
function a7OwnEarth(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.at === '地' });
}
API.registerChoiceHandler('a7.mokuton', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave') API.banish(h, '木遁封印式');
  });
});
defineScript('木遁封印式', {
  type:'trap', priority:2, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!a7OwnEarth(ctx).length){ ctx.reason = '自分フィールドに表側表示の地属性モンスターがいません'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave').length){ ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('木遁封印式（コスト）：リリースする地属性モンスター', a7OwnEarth(ctx), t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'mz'){ API.sendToGrave(r, '木遁封印式（コスト）'); done(true); }
      else done(false);
    });
  },
  resolve(ctx){
    const q = API.pileCards(ctx.opponent, 'grave');
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', title:'木遁封印式：除外する相手の墓地のカード（2枚まで）',
      candidates: q, min:0, max: Math.min(2, q.length),
      resume:{ handler:'a7.mokuton', args:{ player: ctx.player } }
    });
  },
  afterResolve(){}
});

/* 10. 慈悲深き修道女 — このカードをリリースして発動。このターン戦闘で破壊され
   自分の墓地へ送られたモンスター1体を手札に戻す。 */
defineScript('慈悲深き修道女', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player }).length){
      ctx.reason = 'このターン戦闘で破壊され墓地へ送られたモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ a7TributeSelf(ctx, done, '慈悲深き修道女（コスト）'); },
  selectTargets(ctx, done){
    const q = a7DestroyedThisTurn(ctx.player, { battleOnly:true, owner:ctx.player })
      .map(c => locateCardAnyV4(c)).filter(Boolean);
    API.selectCard('慈悲深き修道女：手札に戻すモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, '慈悲深き修道女');
  },
  afterResolve(){}
});

/* 11. リターンソウル — エンドフェイズ時に、このターン破壊され墓地にあるモンスターを
   3体まで持ち主のデッキに戻す */
API.registerChoiceHandler('a7.returnsoul', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave') API.returnToDeck(h, false, 'リターンソウル');
  });
  API.shuffle(0); API.shuffle(1);
});
function a7ReturnPool(){
  return a7DestroyedThisTurn(null, {}).map(c => locateCardAnyV4(c)).filter(Boolean);
}
defineScript('リターンソウル', {
  type:'trap', priority:2, timing:['endPhase'],
  condition(ctx){
    if(gameState.phase !== 'end'){ ctx.reason = 'エンドフェイズ時に発動します'; return false; }
    if(!a7ReturnPool().length){ ctx.reason = 'このターン破壊され墓地にあるモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = a7ReturnPool();
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', title:'リターンソウル：デッキに戻すモンスター（3体まで）',
      candidates: q, min:0, max: Math.min(3, q.length),
      resume:{ handler:'a7.returnsoul', args:{ player: ctx.player } }
    });
  },
  afterResolve(){}
});

/* 12. ミノケンサテュロス — 特殊召喚できない。このカードをリリースし、
   デッキから獣戦士族・レベル4の通常モンスター2体を特殊召喚する。 */
function a7Beast4Normal(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && !x.db.ex
    && x.db.ra === '獣戦士' && Number(x.db.lv) === 4 && (x.db.st || []).includes('通常'));
}
defineScript('ミノケンサテュロス', {
  type:'monster', priority:1, cannotSpecialSummon:true, includesSpecialSummon:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(a7Beast4Normal(ctx.player).length < 2){ ctx.reason = 'デッキに獣戦士族・レベル4の通常モンスターが2体必要です'; return false; }
    return true;
  },
  cost(ctx, done){ a7TributeSelf(ctx, done, 'ミノケンサテュロス（コスト）'); },
  resolve(ctx){
    for(let i = 0; i < 2; i++){
      const q = a7Beast4Normal(ctx.player);
      if(!q.length) break;
      if(API.me(ctx).mz.length >= ZONE_LIMITS.mz) break;
      const r = resolveTarget(q[0]);
      if(!r || r.zone !== 'deck') break;
      API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'ミノケンサテュロス', ctx.player);
    }
  },
  afterResolve(){}
});

/* 13. X－セイバー ウルズ — 戦闘で相手モンスターを破壊し墓地へ送った時、
   このカードをリリースして、破壊したカードを持ち主のデッキの一番上に戻す。 */
defineScript('X－セイバー ウルズ', {
  type:'monster', priority:1, dsTiming:'after',
  condition(ctx){
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    return true;
  },
  cost(ctx, done){ a7TributeSelf(ctx, done, 'X－セイバー ウルズ（コスト）'); },
  resolve(ctx){
    const v = a6DestroyedFoeInBattle(ctx);
    const h = v && locateCardAnyV4(v);
    if(h) API.returnToDeck(h, false, 'X－セイバー ウルズ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && !!a6DestroyedFoeInBattle(ctx); } }
});

/* ===================== AC. 戦闘・召喚イベント ===================== */

/* 14. インフェルニティ・デストロイヤー — 手札が0枚の場合、戦闘で相手モンスターを
   破壊し墓地へ送った時、相手ライフに1600ダメージ */
defineScript('インフェルニティ・デストロイヤー', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(API.me(ctx).hand.length !== 0){ ctx.reason = '自分の手札が0枚である必要があります'; return false; }
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 1600); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return API.me(ctx).hand.length === 0 && !!a6DestroyedFoeInBattle(ctx); } }
});

/* 15. カトブレパスと運命の魔女 — 相手がモンスターの特殊召喚に成功した時、
   自分の墓地の攻撃力が?のモンスター1体を除外して、その特殊召喚したモンスターを破壊する。 */
function a7QuestionGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && a7IsQuestionAtk(x.db));
}
function a7FoeSummoned(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.opponent) return [];
  return b2SummonedCards(e).filter(c => {
    const h = locateCardAnyV4(c);
    return !!(h && h.p === ctx.opponent && h.zone === 'mz');
  });
}
defineScript('カトブレパスと運命の魔女', {
  type:'monster', priority:1, targets:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!a7FoeSummoned(ctx).length){ ctx.reason = '相手がモンスターの特殊召喚に成功した場合に発動します'; return false; }
    if(!a7QuestionGrave(ctx.player).length){ ctx.reason = '墓地に攻撃力が?のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('カトブレパスと運命の魔女（コスト）：除外する攻撃力?のモンスター',
      a7QuestionGrave(ctx.player), t => {
        const r = resolveTarget(t);
        if(r && r.zone === 'grave'){ API.banish(r, 'カトブレパスと運命の魔女（コスト）'); done(true); }
        else done(false);
      });
  },
  selectTargets(ctx, done){
    const q = a7FoeSummoned(ctx).map(c => locateCardAnyV4(c)).filter(Boolean);
    API.selectCard('カトブレパスと運命の魔女：破壊する特殊召喚モンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.destroy(r, 'カトブレパスと運命の魔女');
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return ctx.zone === 'mz' && ctx.card.face === 'up'
      && a7FoeSummoned(ctx).length > 0 && a7QuestionGrave(ctx.player).length > 0; } }
});

/* 16. インフォーマー・スパイダー — フィールドのこのカードがカードの効果によって
   墓地へ送られた時、相手の守備表示モンスター1体のコントロールを得る */
function a7FoeDefense(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.pos === 'def' });
}
function a7SpiderOk(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  if(e.reason === 'battle') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('インフォーマー・スパイダー', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a7SpiderOk(ctx)){ ctx.reason = 'カードの効果でフィールドから墓地へ送られた場合に発動します'; return false; }
    if(!a7FoeDefense(ctx).length){ ctx.reason = '相手フィールドに守備表示モンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('インフォーマー・スパイダー：コントロールを得る守備表示モンスター',
      a7FoeDefense(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.changeControl(r, ctx.player, 'インフォーマー・スパイダー', 'permanent', { card:ctx.card });
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return a7SpiderOk(ctx) && a7FoeDefense(ctx).length > 0 && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 17. ADチェンジャー — 自分のメインフェイズに、墓地のこのカードを除外して
   フィールドのモンスター1体の表示形式を変更する */
defineScript('ADチェンジャー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'], timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地から発動します'; return false; }
    if(!API.fieldCards({ zone:'mz' }).length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ done(false); return; }
    API.banish(me, 'ADチェンジャー（コスト）');
    done(true);
  },
  selectTargets(ctx, done){
    API.selectCard('ADチェンジャー：表示形式を変更するモンスター', API.fieldCards({ zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    if(r.card.face === 'down'){ API.flip(r, 'up', 'ADチェンジャー'); API.changePosition(r, 'atk', 'ADチェンジャー'); }
    else API.changePosition(r, r.card.pos === 'atk' ? 'def' : 'atk', 'ADチェンジャー');
  },
  afterResolve(){}
});

/* ===================== AD. 永続・1ターンに1度 ===================== */

/* 18. クラッキング（永続魔法） — フィールドのモンスターがカードの効果によって
   墓地へ送られた時、その元々の持ち主に800ダメージ。1ターンに1度。 */
defineScript('クラッキング', {
  type:'spell', priority:1, forced:true, countLimit:1,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    const e = ctx.event || {};
    const c = e.card || (e.uid != null ? (findCardByUid(e.uid) || {}).card : null);
    if(!c || dbOf(c).k !== 'm'){ ctx.reason = 'モンスターが墓地へ送られた場合に発動します'; return false; }
    if(e.reason === 'battle'){ ctx.reason = 'カードの効果で墓地へ送られた場合に発動します'; return false; }
    const g = c.graveInfo;
    if(!(g && g.from === 'mz')){ ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const e = ctx.event || {};
    const c = e.card || (e.uid != null ? (findCardByUid(e.uid) || {}).card : null);
    if(!c) return;
    const owner = (c.owner === 0 || c.owner === 1) ? c.owner : ctx.opponent;
    API.damageLP(owner, 800);
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up') return false;
    const e = ctx.event || {};
    const c = e.card || (e.uid != null ? (findCardByUid(e.uid) || {}).card : null);
    if(!c || dbOf(c).k !== 'm' || e.reason === 'battle') return false;
    const g = c.graveInfo;
    return !!(g && g.from === 'mz'); } }
});

/* 19. ウォーターハザード（永続魔法） — 自分フィールドにモンスターが存在しない場合、
   手札からレベル4以下の水属性1体を特殊召喚できる。1ターンに1度。 */
function a7WaterInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && !x.db.ex
    && x.db.at === '水' && Number(x.db.lv || 99) <= 4);
}
defineScript('ウォーターハザード', {
  type:'spell', priority:1, countLimit:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(API.me(ctx).mz.length > 0){ ctx.reason = '自分フィールドにモンスターが存在しない必要があります'; return false; }
    if(!a7WaterInHand(ctx.player).length){ ctx.reason = '手札にレベル4以下の水属性モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ウォーターハザード：特殊召喚する水属性モンスター', a7WaterInHand(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'hand') API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'ウォーターハザード', ctx.player);
  },
  afterResolve(){}
});

/* 20. エレキャノン（永続罠） — フィールドにレベル4以下の雷族が召喚・特殊召喚された時、
   相手ライフに600ダメージ。1ターンに1度。 */
function a7ThunderSummoned(ctx){
  const e = ctx.event || {};
  return b2SummonedCards(e).some(c => {
    const db = dbOf(c);
    return db.k === 'm' && db.ra === '雷' && Number(db.lv || 99) <= 4;
  });
}
defineScript('エレキャノン', {
  type:'trap', priority:2, forced:true, countLimit:1,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!a7ThunderSummoned(ctx)){ ctx.reason = 'レベル4以下の雷族モンスターが召喚・特殊召喚された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 600); },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.zone === 'sz' && ctx.card.face === 'up' && a7ThunderSummoned(ctx); },
    onSpecialSummon(ctx){ return ctx.zone === 'sz' && ctx.card.face === 'up' && a7ThunderSummoned(ctx); }
  }
});
