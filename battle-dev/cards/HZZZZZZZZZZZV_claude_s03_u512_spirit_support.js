/* =========================================================================
   S03-U512 — スピリット支援の未実装 3 枚（カード実装）
   -------------------------------------------------------------------------
   《八汰鏡》（NOT_STARTED・装備魔法）
     スピリットモンスターにのみ装備可能。
     装備モンスターはエンドフェイズ時に手札に戻る効果を発動しなくてもよい。
     装備モンスターが戦闘によって破壊される場合、代わりにこのカードを破壊する。
   《伊弉凪》（ENGINE_GAP・効果モンスター 星6 天使/風 2200/1000）
     このカードは手札のスピリットモンスター1体をゲームから除外し、手札から特殊召喚する事ができる。
     このカードが自分フィールド上に表側表示で存在する限り、自分フィールド上に存在する
     スピリットモンスターはエンドフェイズ時に手札に戻る効果を発動しなくてもよい。
   《霊子エネルギー固定装置》（NOT_STARTED・永続魔法）
     このカードがフィールド上に存在する限り、スピリットモンスターはフィールド上に残り続ける。
     自分のエンドフェイズ時に手札を1枚捨てる。捨てなければ、このカードを破壊する。
     また、このカードがフィールド上から離れた時、フィールド上に存在する表側表示の
     スピリットモンスターは全て持ち主の手札に戻る。

   3 枚はどれも「スピリットのエンドフェイズの手札戻り」に関わるので、共通処理を 2 つだけ足した
   （S03-U244 の `spiritReturnEffectS03` / `spiritReturnDueS03` から読む）:
     spiritStayS03(card)          … その戻りが**起きない**（《霊子エネルギー固定装置》）
     spiritReturnOptionalS03(ctx) … その戻りが**任意になる**（《八汰鏡》《伊弉凪》）
   任意化は誘発の強制／任意そのものを変えるので、engine/1ZB の `triggerCandidateForcedS03` に
   v4 effect の `forcedWhenS03` を見る枝を足した（申告の無い effect は 1 つも挙動が変わらない）。
   ========================================================================= */

/* db からスピリットか判定する。S03-U244 の defineSpiritS03 で定義された 7 枚だけでなく、
   カードデータの種別（st に「スピリット」）で判定する（装備可能条件はテキストどおり）。 */
function u512IsSpiritDbS03(db){
  return !!db && db.k === 'm' && Array.isArray(db.st) && db.st.indexOf('スピリット') >= 0;
}
function u512IsSpiritCardS03(card){ return !!card && u512IsSpiritDbS03(dbOf(card)); }

/* 《霊子エネルギー固定装置》が表側表示で魔法・罠ゾーンにあるか（どちらのプレイヤーのものでも、
   テキストは「スピリットモンスターはフィールド上に残り続ける」なので全体に効く）。 */
function u512FixerOnFieldS03(){
  for(let p = 0; p < (gameState.players || []).length; p++){
    const sz = gameState.players[p].sz || [];
    for(let i = 0; i < sz.length; i++){
      const c = sz[i];
      if(c && c.face === 'up' && cardName(c) === '霊子エネルギー固定装置'
         && !(typeof effectNegated === 'function' && effectNegated(c))) return true;
    }
  }
  return false;
}
/* S03-U512: スピリットの「エンドフェイズ時に手札に戻る」が起きないか。 */
function spiritStayS03(card){
  if(!u512IsSpiritCardS03(card)) return false;
  return u512FixerOnFieldS03();
}
/* S03-U512: その戻りが任意になるか（《八汰鏡》を装備している／自分の場に《伊弉凪》がいる）。 */
function spiritReturnOptionalS03(ctx){
  if(!ctx || !ctx.card) return false;
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  /* 《伊弉凪》: 自分フィールド上に表側表示で存在する限り、自分のスピリットの戻りは任意 */
  const mz = gameState.players[me.p].mz || [];
  for(let i = 0; i < mz.length; i++){
    const c = mz[i];
    if(c && c.face === 'up' && cardName(c) === '伊弉凪'
       && !(typeof effectNegated === 'function' && effectNegated(c))) return true;
  }
  /* 《八汰鏡》: 装備モンスター自身の戻りだけが任意 */
  const eqs = Array.isArray(me.card.equippedBy) ? me.card.equippedBy : [];
  if(eqs.length){
    for(let p = 0; p < (gameState.players || []).length; p++){
      const sz = gameState.players[p].sz || [];
      for(let i = 0; i < sz.length; i++){
        const eq = sz[i];
        if(!eq || eq.face !== 'up' || eq.equipUid == null) continue;
        if(eqs.indexOf(eq.equipUid) < 0) continue;
        if(cardName(eq) !== '八汰鏡') continue;
        if(typeof effectNegated === 'function' && effectNegated(eq)) continue;
        return true;
      }
    }
  }
  return false;
}

/* ---- 八汰鏡 ----
   装備先はスピリットのみ（u412Define の pred）。戦闘破壊の身代わりは S03-U183 の
   equipSubstituteS03:'battle'（強制・戦闘破壊のみ）。戻りの任意化は上の共通処理が読む。 */
u412Define('八汰鏡', {
  pred: x => u512IsSpiritDbS03(x && x.db),
  own: true,
  meta: { activateFrom:['hand','sz'], equipSubstituteS03:'battle' }
});

/* ---- 伊弉凪 ----
   手札のスピリット1体を除外して手札から特殊召喚する（召喚手順）。
   「〜する事ができる」なので正規の特殊召喚手順（S03-U127 の proper summon）。 */
function u512HandSpiritsS03(ctx){
  return API.pileCards(ctx.player, 'hand', x => u512IsSpiritDbS03(x.db) && x.card !== ctx.card);
}
defineUnifiedCardV4('伊弉凪', [], {
  type:'monster', priority:1,
  summonProcedure:{
    from:['hand'],
    positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(!u512HandSpiritsS03(ctx).length){
        ctx.reason = '手札に除外するスピリットモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const q = u512HandSpiritsS03(ctx);
      if(!q.length){ done(false); return; }
      API.selectCard('伊弉凪：除外する手札のスピリットモンスター', q, t => {
        const r = t && resolveTarget(t);
        if(!r || r.zone !== 'hand'){ done(false); return; }
        API.banish(r, '伊弉凪（特殊召喚手順）');
        done(true);
      });
    },
    execute(ctx){
      const zone = ctx.zone || 'hand';
      const pile = gameState.players[ctx.player][zone] || [];
      const i = pile.indexOf(ctx.card);
      if(i < 0) return;
      const pos = (ctx.position === 'def' || ctx.pos === 'def') ? 'def' : 'atk';
      API.specialSummon(ctx.player, zone, i, pos, '伊弉凪');
    }
  }
});

/* ---- 霊子エネルギー固定装置 ----
   ①残り続ける（上の spiritStayS03）
   ②自分のエンドフェイズに手札を1枚捨てる。捨てなければ自壊（強制誘発。捨てる／捨てないを選ぶ）
   ③このカードがフィールドから離れた時、表側表示のスピリットを全て持ち主の手札に戻す（強制誘発） */
function u512FixerFedThisTurnS03(card){
  return Number(card && card.u512FedTurnS03) === Number(gameState.turn);
}
function u512FixerUpkeepDueS03(ctx){
  return ctx.zone === 'sz' && ctx.card.face === 'up'
      && gameState.phase === 'end' && ctx.player === gameState.activePlayer
      && !u512FixerFedThisTurnS03(ctx.card);
}
function u512FaceUpSpiritsOnFieldS03(){
  const out = [];
  for(let p = 0; p < (gameState.players || []).length; p++){
    const mz = gameState.players[p].mz || [];
    for(let i = 0; i < mz.length; i++){
      const c = mz[i];
      if(c && c.face === 'up' && u512IsSpiritCardS03(c)) out.push({p:p, zone:'mz', index:i, card:c});
    }
  }
  return out;
}
function u512FixerLeftFieldS03(ctx){
  if(!eventIsSelfS03(ctx)) return false;
  const h = locateCardAnyV4(ctx.card);
  return !h || h.zone !== 'sz';
}
API.registerChoiceHandler('u512.fixer-feed', (answer, args) => {
  const uid = args && args.uid;
  const h = (uid != null) ? findCardByUid(uid) : null;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(h && h.zone === 'sz') API.setCardFlag(h, 'u512FedTurnS03', gameState.turn, '霊子エネルギー固定装置', {silent:true});
  if(r && r.zone === 'hand'){
    API.discard(r.p, r.index, '霊子エネルギー固定装置（手札を1枚捨てる）');
    return;
  }
  /* 捨てなかった（候補が無い・やめた）→ このカードを破壊する */
  const now = (uid != null) ? findCardByUid(uid) : null;
  if(now && now.zone === 'sz') API.destroy(now, '霊子エネルギー固定装置（捨てなかった）');
});
defineScript('霊子エネルギー固定装置', {
  type:'spell', priority:1, forced:true, activateFrom:['hand','sz','grave'],
  timing:['free'],
  condition(ctx){
    if(u512FixerUpkeepDueS03(ctx)) return true;
    if(u512FixerLeftFieldS03(ctx) && u512FaceUpSpiritsOnFieldS03().length) return true;
    ctx.reason = '自分のエンドフェイズ、またはこのカードがフィールドから離れた時に発動します';
    return false;
  },
  resolve(ctx){
    if(u512FixerUpkeepDueS03(ctx)){
      const me = locateCardAnyV4(ctx.card);
      const uid = ctx.card && ctx.card.uid;
      const hand = API.pileCards(ctx.player, 'hand');
      if(!hand.length){
        if(me) API.setCardFlag(me, 'u512FedTurnS03', gameState.turn, '霊子エネルギー固定装置', {silent:true});
        const now = locateCardAnyV4(ctx.card);
        if(now && now.zone === 'sz') API.destroy(now, '霊子エネルギー固定装置（捨てる手札が無い）');
        return;
      }
      API.requestChoice({
        player: ctx.player, kind:'card', cancelable:true, min:1, max:1,
        title:'霊子エネルギー固定装置：捨てる手札（捨てなければこのカードを破壊）',
        note:'捨てない場合は閉じてください',
        candidates: hand,
        resume:{ handler:'u512.fixer-feed', args:{ uid: uid } }
      });
      return;
    }
    /* フィールドから離れた時：表側表示のスピリットを全て持ち主の手札へ */
    u512FaceUpSpiritsOnFieldS03().slice().reverse().forEach(t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'mz') API.returnToHand(r, '霊子エネルギー固定装置');
    });
  },
  afterResolve(){},
  passive:{
    onEndPhase(ctx){ return u512FixerUpkeepDueS03(ctx); },
    onLeaveField(ctx){
      return u512FixerLeftFieldS03(ctx) && u512FaceUpSpiritsOnFieldS03().length > 0; }
  }
});
