/* Auto cycle 32 — 7枚。engine 変更なし。
     XXIA 公開（reveal）と確認（inspect）の使い分け（System v20）
     XXIB 「鋼核」を見せて使う群
     XXIC ランダムな1枚の確認（duelRandomInt）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e1MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function e1MyTurn(p){ return gameState.activePlayer === p; }
function e1MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e1MyTurn(p);
}
function e1FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
function e1MyEndPhase(p){ return gameState.phase === 'end' && e1MyTurn(p); }
/* 「コアキメイルの鋼核」を手札から1枚墓地へ送る（送れたら true） */
function e1SendCore(p, reason){
  const q = v57CoreInHand(p);
  if(!q.length) return false;
  const r = resolveTarget(q[0]);
  if(!r || r.zone !== 'hand') return false;
  API.sendHandToGrave(p, r.index, reason);
  return true;
}
/* 公開（両者に見せる） */
function e1Reveal(handles, label, until){
  if(!handles || !handles.length) return;
  API.reveal({ cards:handles, audience:'both', label:label, until:until || 'resolution' });
}

/* ===================== A. コアキメイルの維持コストと追加効果 ===================== */

/* 1. コアキメイル・アイス — 維持コスト（永続魔法を見せる）。
      自分のメインフェイズに手札を1枚墓地へ送って発動でき、
      フィールドの特殊召喚されたモンスター1体を選択して破壊する */
function e1SpecialSummoned(){
  return API.fieldCards({ zone:'mz',
    filter:x => x.card.specialSummoned === true || x.card.specialSummonedFrom != null });
}
d9Koaki('コアキメイル・アイス', db => db.k === 's' && db.sub === '永続', {
  targets:true, timing:['endPhase','mainPhase'],
  condition(ctx){
    if(!e1FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e1MyEndPhase(ctx.player)) return true;
    if(!e1MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '墓地へ送る手札がありません'; return false; }
    if(!e1SpecialSummoned().length){
      ctx.reason = 'フィールドに特殊召喚されたモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(e1MyEndPhase(ctx.player)){ done(true); return; }
    const q = API.pileCards(ctx.player, 'hand');
    if(!q.length){ done(false); return; }
    API.selectCard('コアキメイル・アイス（コスト）：墓地へ送る手札', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.sendHandToGrave(ctx.player, r.index, 'コアキメイル・アイス（コスト）'); done(true);
      } else done(false);
    });
  },
  selectTargets(ctx, done){
    if(e1MyEndPhase(ctx.player)){ done([]); return; }
    API.selectCard('コアキメイル・アイス：破壊する特殊召喚されたモンスター',
      e1SpecialSummoned(), t => done([t]));
  },
  resolve(ctx){
    if(e1MyEndPhase(ctx.player)){
      d9KoakiUpkeep(ctx, db => db.k === 's' && db.sub === '永続'); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.destroy(r, 'コアキメイル・アイス', ctx.player);
  },
  passive:{ onEndPhase(ctx){ return e1FaceUpMz(ctx) && e1MyEndPhase(ctx.player); } }
});

/* 2. コアキメイル・シーパンサー — 維持コスト（水属性モンスターを見せる）。
      1ターンに1度、手札から「コアキメイルの鋼核」1枚を墓地へ送る事で、
      自分の墓地の魔法カード1枚を選択しデッキの一番上に戻す */
function e1SpellGrave(p){ return API.pileCards(p, 'grave', x => x.db.k === 's'); }
d9Koaki('コアキメイル・シーパンサー', db => db.k === 'm' && db.at === '水', {
  countLimit:1, targets:true, timing:['endPhase','mainPhase'],
  condition(ctx){
    if(!e1FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e1MyEndPhase(ctx.player)) return true;
    if(!e1MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!v57CoreInHand(ctx.player).length){
      ctx.reason = '手札に「コアキメイルの鋼核」がありません'; return false; }
    if(!e1SpellGrave(ctx.player).length){
      ctx.reason = '墓地に魔法カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(e1MyEndPhase(ctx.player)){ done(true); return; }
    done(e1SendCore(ctx.player, 'コアキメイル・シーパンサー（コスト）'));
  },
  selectTargets(ctx, done){
    if(e1MyEndPhase(ctx.player)){ done([]); return; }
    API.selectCard('コアキメイル・シーパンサー：デッキの一番上に戻す魔法カード',
      e1SpellGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(e1MyEndPhase(ctx.player)){
      d9KoakiUpkeep(ctx, db => db.k === 'm' && db.at === '水'); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, false, 'コアキメイル・シーパンサー');
  },
  passive:{ onEndPhase(ctx){ return e1FaceUpMz(ctx) && e1MyEndPhase(ctx.player); } }
});

/* 3. 鋼核の輝き — 手札の「コアキメイルの鋼核」1枚を相手に見せて発動する。
      相手の魔法・罠カードの発動を無効にし破壊する */
function e1FoeSpellTrapActivation(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'spell' && e.kind !== 'trap') return false;
  return e.player === ctx.opponent;
}
defineScript('鋼核の輝き', {
  type:'trap', priority:3, activateFrom:['sz'], timing:['chain'],
  condition(ctx){
    if(!e1FoeSpellTrapActivation(ctx)){
      ctx.reason = '相手の魔法・罠カードの発動時に発動します'; return false; }
    if(!v57CoreInHand(ctx.player).length){
      ctx.reason = '手札に「コアキメイルの鋼核」がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    /* 見せるだけで、墓地へは送らない。 */
    const q = v57CoreInHand(ctx.player);
    if(!q.length){ done(false); return; }
    e1Reveal([q[0]], '鋼核の輝き');
    done(true);
  },
  resolve(ctx){
    const e = ctx.event || {};
    if(e.chainId != null)
      API.negateChainLink(e.chainId, 'activation', '鋼核の輝き', true);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && e1FoeSpellTrapActivation(ctx)
        && v57CoreInHand(ctx.player).length > 0; } }
});

/* ===================== B. 手札のカードを見せて使う ===================== */

/* 4. 黄金の天道虫 — 1ターンに1度、自分のスタンバイフェイズに手札のこのカードを
      相手に見せて発動でき、500ライフポイント回復する。
      この効果を使用した場合、エンドフェイズ時まで手札のこのカードを公開する */
defineScript('黄金の天道虫', {
  type:'monster', priority:1, countLimit:1, activateFrom:['hand'], timing:['standby'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(gameState.phase !== 'standby' || !e1MyTurn(ctx.player)){
      ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand') return;
    /* エンドフェイズ時まで公開し続ける（until:'endPhase'）。 */
    API.reveal({ cards:[me], audience:'both', label:'黄金の天道虫',
                 until:'endPhase', endPhaseOf:ctx.player });
    API.recoverLP(ctx.player, 500);
  },
  afterResolve(){}
});

/* 5. 星見獣ガリス — 手札のこのカードを相手に見せて発動する。
      自分のデッキの一番上を墓地へ送り、それがモンスターだった場合、
      そのレベル×200ダメージを相手に与えてこのカードを特殊召喚する。
      モンスター以外だった場合、このカードを破壊する */
defineScript('星見獣ガリス', {
  type:'monster', priority:1, activateFrom:['hand'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ done(false); return; }
    e1Reveal([me], '星見獣ガリス');
    done(true);
  },
  resolve(ctx){
    const top = API.pileCards(ctx.player, 'deck')[0];
    if(!top) return;
    const isMonster = top.db.k === 'm';
    const lv = Number(top.db.lv) || 0;
    API.mill(ctx.player, top.index, '星見獣ガリス');
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand') return;
    if(isMonster){
      if(lv > 0) API.damageLP(ctx.opponent, lv * 200);
      if(e1MzOpen(ctx.player))
        API.specialSummon(ctx.player, 'hand', me.index, 'atk', '星見獣ガリス', me.p);
      return;
    }
    /* モンスター以外なら手札のこのカードは破壊される（墓地へ送られる） */
    API.sendHandToGrave(ctx.player, me.index, '星見獣ガリス');
  },
  afterResolve(){}
});

/* 6. 黒薔薇の魔女 — 特殊召喚できない。
      自分フィールドに他のカードが存在せず、このカードが召喚に成功した場合、
      デッキから1枚ドローしお互いに確認する。
      それがモンスター以外だった場合、そのカードは墓地へ送られこのカードは破壊される */
function e1NoOtherOwnCards(ctx){
  const P = gameState.players[ctx.player];
  const mz = (P.mz || []).filter(c => c && c !== ctx.card).length;
  const sz = (P.sz || []).length;
  const fd = P.field ? 1 : 0;
  return mz === 0 && sz === 0 && fd === 0;
}
defineScript('黒薔薇の魔女', {
  type:'monster', priority:1, forced:true, cannotSpecialSummon:true, activateFrom:['mz'],
  condition(ctx){
    if(!(ctx.event && ctx.event.card === ctx.card)){
      ctx.reason = '召喚に成功した場合に発動します'; return false; }
    if(!e1NoOtherOwnCards(ctx)){
      ctx.reason = '自分フィールドに他のカードが存在しない場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 1);
    const drawn = (typeof API.lastDrawCards === 'function') ? API.lastDrawCards() : [];
    const h = (drawn || []).filter(x => x && x.zone === 'hand')[0];
    if(!h) return;
    e1Reveal([h], '黒薔薇の魔女');
    if(h.db.k === 'm') return;
    const now = locateCardAnyV4(h.card);
    if(now && now.zone === 'hand')
      API.sendHandToGrave(ctx.player, now.index, '黒薔薇の魔女');
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.destroy(me, '黒薔薇の魔女', ctx.player);
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
        && e1NoOtherOwnCards(ctx) && API.me(ctx).deck.length > 0; } }
});

/* ===================== C. 相手だけが知らない情報 ===================== */

/* 7. 黒蠍－逃げ足のチック — 相手プレイヤーに戦闘ダメージを与えた時、
      次から1つを選択して発動できる。
      ●フィールドのカード1枚を持ち主の手札に戻す
      ●相手のデッキの一番上を1枚めくる（相手は確認できない）。
        そのカードをデッキの一番上か一番下かを選んで戻す */
API.registerChoiceHandler('e1.chick', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(!r) return;
  if(args && args.mode === 'bounce'){
    if(r.zone === 'mz' || r.zone === 'sz' || r.zone === 'field')
      API.returnToHand(r, '黒蠍－逃げ足のチック');
    return;
  }
  /* めくったカードをデッキの一番上／一番下に戻す。 */
  if(r.zone === 'deck') API.returnToDeck(r, !!(args && args.toBottom), '黒蠍－逃げ足のチック');
});
function e1DealtBattleDamage(ctx){
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = ctx.card && ctx.card.uid;
  if(uid == null) return false;
  return e.attackerUid === uid || e.defenderUid === uid;
}
defineScript('黒蠍－逃げ足のチック', {
  type:'monster', priority:1, activateFrom:['mz'], timing:['damageStep','free'],
  condition(ctx){
    if(!e1FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e1DealtBattleDamage(ctx)){
      ctx.reason = '相手プレイヤーに戦闘ダメージを与えた時に発動します'; return false; }
    const anyCard = API.fieldCards({ zone:'mz' }).length
                  + API.fieldCards({ zone:'sz' }).length;
    if(!anyCard && !gameState.players[ctx.opponent].deck.length){
      ctx.reason = '選択できる効果がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const field = API.fieldCards({ zone:'mz' }).concat(API.fieldCards({ zone:'sz' }));
    const canBounce = field.length > 0;
    const canPeek = gameState.players[ctx.opponent].deck.length > 0;
    if(canBounce && canPeek){
      API.requestChoice({player:ctx.player, kind:'yesno', title:'黒蠍－逃げ足のチック',
        note:'フィールドのカード1枚を手札に戻しますか？（いいえ＝相手のデッキトップをめくる）',
        candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
        min:1, max:1, cancelable:false,
        resume:{handler:'s03u62.chick-top-confirm', args:{player:ctx.player, opponent:ctx.opponent}},
        meta:{scriptName:'黒蠍－逃げ足のチック'}});
      return;
    }
    if(canBounce) e1ChickDoBounce(ctx.player); else if(canPeek) e1ChickDoPeek(ctx.player, ctx.opponent);
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return e1FaceUpMz(ctx) && e1DealtBattleDamage(ctx); } }
});
/* S03-U62: resolve() 内の legacy API.confirm（2箇所）を SaveLoad安全な登録済みハンドラへ移行。
   doBounce/doPeek を defineScript の外へ出し、resolve() 本体と新しいハンドラの両方から使う。 */
function e1ChickDoBounce(player){
  const field = API.fieldCards({ zone:'mz' }).concat(API.fieldCards({ zone:'sz' }));
  if(!field.length) return;
  API.requestChoice({player, kind:'card', cancelable:false, min:1, max:1,
    title:'黒蠍－逃げ足のチック：持ち主の手札に戻すカード',
    candidates: field,
    resume:{ handler:'e1.chick', args:{ player, mode:'bounce' } }});
}
function e1ChickDoPeek(player, opponent){
  const top = API.pileCards(opponent, 'deck')[0];
  if(!top) return;
  /* めくるのは自分だけ。相手には見せない（inspect は state を変えない）。 */
  API.inspect(player, [top], '黒蠍－逃げ足のチック');
  ensureCardUid(gameState, top.card);
  API.requestChoice({player, kind:'yesno', title:'黒蠍－逃げ足のチック',
    note:'めくったカードをデッキの一番上に戻しますか？（いいえ＝一番下）',
    candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
    min:1, max:1, cancelable:false,
    resume:{handler:'s03u62.chick-peek-confirm', args:{player, topUid:top.card.uid}},
    meta:{scriptName:'黒蠍－逃げ足のチック'}});
}
API.registerChoiceHandler('s03u62.chick-top-confirm', (answer, args) => {
  const yes = !answer.cancelled && answer.cards[0] && answer.cards[0].value === true;
  if(yes) e1ChickDoBounce(args.player); else e1ChickDoPeek(args.player, args.opponent);
});
API.registerChoiceHandler('s03u62.chick-peek-confirm', (answer, args) => {
  const toBottom = !(!answer.cancelled && answer.cards[0] && answer.cards[0].value === true);
  const topH = args.topUid != null ? findCardByUid(args.topUid) : null;
  if(!topH || topH.zone !== 'deck') return;
  API.requestChoice({player:args.player, kind:'card', cancelable:false, min:1, max:1,
    title: toBottom ? '黒蠍－逃げ足のチック：デッキの一番下に戻す' : '黒蠍－逃げ足のチック：デッキの一番上に戻す',
    candidates:[topH],
    resume:{ handler:'e1.chick', args:{ player:args.player, mode:'peek', toBottom } }});
});
