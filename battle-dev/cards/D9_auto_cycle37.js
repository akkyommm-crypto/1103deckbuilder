/* Auto cycle 37 — 8枚。engine 変更なし。
     XXVIA 除外して次のスタンバイに戻す（banishInfo + Scheduler v7）
     XXVIB 除外したモンスターの数値を後から使う
     XXVIC レベルの宣言（System v11 declare の候補を自前で渡す）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e6MzOpen(p, n){
  return (gameState.players[p].mz || []).length + (Number(n) || 1) <= ZONE_LIMITS.mz;
}
function e6MyTurn(p){ return gameState.activePlayer === p; }
function e6MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e6MyTurn(p);
}
function e6FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* 除外して uid を返す（元々のレベル・表示形式は呼び出し側で控える） */
function e6BanishAndUid(handle, reason){
  if(!handle || handle.zone !== 'mz') return null;
  ensureCardUid(gameState, handle.card);
  const uid = handle.card.uid;
  API.banish(handle, reason);
  return uid;
}

/* ---- 予約ハンドラ ---- */
/* 除外されている uid を、除外時と同じ表示形式でフィールドに戻す */
API.registerScheduleHandler('e6.returnSamePos', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(!h || h.zone !== 'banish') return;
  const to = (args && (args.toPlayer === 0 || args.toPlayer === 1)) ? args.toPlayer : h.p;
  if((gameState.players[to].mz || []).length >= ZONE_LIMITS.mz) return;
  const b = h.card.banishInfo || {};
  const pos = (args && args.forceAtk) ? 'atk' : ((b.pos === 'def') ? 'def' : 'atk');
  API.specialSummon(to, 'banish', h.index, pos, (args && args.reason) || '予約', h.p);
  if(!(args && args.forceAtk)){
    const back = findCardByUid(args.uid);
    if(back && back.zone === 'mz' && b.face === 'down')
      API.flip(back, 'down', (args && args.reason) || '予約');
  }
});
/* uid のカードを除外する */
API.registerScheduleHandler('e6.banishUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.banish(h, (args && args.reason) || '予約');
});

/* ===================== A. 除外して次のスタンバイに戻す ===================== */

/* 1. タイム・エスケーパー — このカードを手札から捨て、自分フィールドの表側サイキック族1体を
      選択して発動する。選択したモンスターを次の自分のスタンバイフェイズ時まで除外する。
      この効果は相手ターンでも発動できる */
function e6MyPsychic(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === 'サイキック' });
}
defineScript('タイム・エスケーパー', {
  type:'monster', priority:2, targets:true, activateFrom:['hand'], timing:['free'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!e6MyPsychic(ctx.player).length){
      ctx.reason = '自分フィールドに表側表示のサイキック族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('タイム・エスケーパー：除外するサイキック族',
      e6MyPsychic(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'hand'){
      API.discard(ctx.player, me.index, 'タイム・エスケーパー（コスト）',
        { byEffect:true, byPlayer:ctx.player });
      done(true);
    } else done(false);
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const uid = e6BanishAndUid(r, 'タイム・エスケーパー');
    if(uid == null) return;
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
      handler:'e6.returnSamePos', source:ctx.card, note:'タイム・エスケーパー',
      args:{ uid:uid, toPlayer:ctx.player, reason:'タイム・エスケーパー' } });
  },
  afterResolve(){}
});

/* 2. フューチャー・ヴィジョン — このカードがフィールドに存在する限り、
      自分または相手がモンスターの召喚に成功した時、そのモンスターを除外する。
      召喚したプレイヤーから見て次の自分のスタンバイフェイズ時、
      この効果で除外したモンスターを表側攻撃表示でフィールドに戻す */
function e6JustNormalSummoned(ctx){
  const e = ctx.event || {};
  const cards = b2SummonedCards(e);
  for(const c of cards){
    const h = locateCardAnyV4(c);
    if(h && h.zone === 'mz') return h;
  }
  return null;
}
defineScript('フューチャー・ヴィジョン', {
  type:'spell', priority:1, forced:true, activateFrom:['field'], timing:['free'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'field' || me.card.face !== 'up'){
      ctx.reason = 'フィールドゾーンに表側表示で存在する必要があります'; return false; }
    if(!e6JustNormalSummoned(ctx)){
      ctx.reason = 'モンスターの召喚に成功した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const h = e6JustNormalSummoned(ctx);
    if(!h) return;
    const owner = h.p;
    const uid = e6BanishAndUid(h, 'フューチャー・ヴィジョン');
    if(uid == null) return;
    /* 「召喚したプレイヤーから見て次の自分のスタンバイフェイズ」 */
    API.schedule({ at:'standbyPhase', ownTurn:true, player:owner,
      handler:'e6.returnSamePos', source:ctx.card, note:'フューチャー・ヴィジョン',
      args:{ uid:uid, toPlayer:owner, forceAtk:true, reason:'フューチャー・ヴィジョン' } });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    const me = locateCardAnyV4(ctx.card);
    return !!me && me.zone === 'field' && me.card.face === 'up'
        && !!e6JustNormalSummoned(ctx); } }
});

/* 3. BF－陽炎のカーム — 相手のバトルフェイズ、自分フィールドにモンスターが存在しない場合、
      墓地のこのカードを除外して発動できる。
      自分の墓地のシンクロモンスター1体を選択して特殊召喚する。
      この効果で特殊召喚したモンスターはバトルフェイズ終了時に除外される */
function e6SynchroGrave(p){
  return API.pileCards(p, 'grave',
    x => x.db.k === 'm' && (x.db.st || []).includes('シンクロ'));
}
defineScript('BF－陽炎のカーム', {
  type:'monster', priority:2, targets:true, activateFrom:['grave'], timing:['free'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ ctx.reason = '墓地に存在する必要があります'; return false; }
    if(!(gameState.phase === 'battle' && gameState.activePlayer === ctx.opponent)){
      ctx.reason = '相手のバトルフェイズに発動します'; return false; }
    if((gameState.players[ctx.player].mz || []).length > 0){
      ctx.reason = '自分フィールドにモンスターが存在しない場合に発動します'; return false; }
    if(!e6SynchroGrave(ctx.player).length){
      ctx.reason = '墓地にシンクロモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('BF－陽炎のカーム：特殊召喚するシンクロモンスター',
      e6SynchroGrave(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave'){ API.banish(me, 'BF－陽炎のカーム（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !e6MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'BF－陽炎のカーム', r.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(now && now.zone === 'mz')
      API.schedule({ at:'battlePhaseEnd', turns:0, player:ctx.player,
        handler:'e6.banishUid', source:ctx.card, note:'BF－陽炎のカーム',
        args:{ uid:uid, reason:'BF－陽炎のカーム' } });
  },
  afterResolve(){}
});

/* ===================== B. 除外したモンスターの数値を後から使う ===================== */

/* 4. フューチャー・グロウ — 自分の墓地のサイキック族1体を除外して発動する。
      このカードがフィールドに存在する限り、自分フィールドの表側サイキック族の攻撃力は、
      発動のために除外したモンスターのレベル×200ポイントアップする */
function e6PsychicGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === 'サイキック');
}
defineScript('フューチャー・グロウ', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  condition(ctx){
    if(!e6PsychicGrave(ctx.player).length){
      ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('フューチャー・グロウ（コスト）：除外するサイキック族',
      e6PsychicGrave(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave'){ done(false); return; }
    /* 「除外したモンスターのレベル」は除外する前に確定させる。 */
    ctx.e6GrowLv = Number(dbOf(r.card).lv) || 0;
    API.banish(r, 'フューチャー・グロウ（コスト）');
    done(true);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    const lv = Number(ctx.e6GrowLv) || 0;
    if(me && me.zone === 'sz')
      API.setCardFlag(me, 'e6GrowLv', lv, 'フューチャー・グロウ');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return null;
      const lv = Number(self.e6GrowLv || 0);
      if(lv <= 0) return null;
      const ch = locateCardAnyV4(card);
      if(!ch || ch.p !== h.p || ch.zone !== 'mz' || ch.card.face !== 'up') return null;
      if(dbOf(card).ra !== 'サイキック') return null;
      return { atk:lv * 200 };
    }
  }
});

/* 5. ブーテン — 自分のメインフェイズ、墓地のこのカードを除外し、
      自分フィールドのレベル4以下の天使族・光属性1体を選択して発動できる。
      選択したモンスターは表側表示で存在する限りチューナーとして扱う */
function e6LowFairyLight(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === '天使' && x.db.at === '光'
             && Number(x.db.lv) <= 4 });
}
defineScript('ブーテン', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ ctx.reason = '墓地に存在する必要があります'; return false; }
    if(!e6MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!e6LowFairyLight(ctx.player).length){
      ctx.reason = 'レベル4以下の天使族・光属性がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ブーテン：チューナーとして扱うモンスター',
      e6LowFairyLight(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave'){ API.banish(me, 'ブーテン（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    /* 「表側表示で存在する限り」＝場を離れる／裏側になるまで。permanent で持たせる。 */
    if(r && r.zone === 'mz') API.setTuner(r, true, 'permanent', 'ブーテン');
  },
  afterResolve(){}
});

/* 6. ユニバード — 自分フィールドの表側モンスター1体とこのカードを除外し、
      その元々のレベルを合計した数以下のレベルを持つシンクロモンスター1体を
      自分の墓地から選択して特殊召喚する */
function e6MyFaceUpOther(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.card.face === 'up' });
}
API.registerChoiceHandler('e6.unibird', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(!r || r.zone !== 'grave') return;
  if((gameState.players[p].mz || []).length >= ZONE_LIMITS.mz) return;
  API.specialSummon(p, 'grave', r.index, 'atk', 'ユニバード', r.p);
});
defineScript('ユニバード', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    if(!e6FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e6MyFaceUpOther(ctx).length){
      ctx.reason = '除外する他の表側表示モンスターがいません'; return false; }
    if(!e6SynchroGrave(ctx.player).length){
      ctx.reason = '墓地にシンクロモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ユニバード（コスト）：一緒に除外するモンスター',
      e6MyFaceUpOther(ctx), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone !== 'mz' || !me || me.zone !== 'mz'){ done(false); return; }
    /* 「元々のレベル」は除外する前に合計する。 */
    ctx.e6LvSum = (Number(dbOf(r.card).lv) || 0) + (Number(dbOf(me.card).lv) || 0);
    API.banish(r, 'ユニバード（コスト）');
    const again = locateCardAnyV4(ctx.card);
    if(again && again.zone === 'mz') API.banish(again, 'ユニバード（コスト）');
    done(true);
  },
  resolve(ctx){
    const max = Number(ctx.e6LvSum) || 0;
    if(max <= 0) return;
    const q = e6SynchroGrave(ctx.player).filter(x => Number(x.db.lv) <= max);
    if(!q.length || !e6MzOpen(ctx.player)) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'ユニバード：特殊召喚するシンクロモンスター（レベル' + max + '以下）',
      candidates: q,
      resume:{ handler:'e6.unibird', args:{ player:ctx.player } }
    });
  },
  afterResolve(){}
});

/* 7. メンタルオーバー・デーモン — 1ターンに1度、自分の墓地のサイキック族1体を
      選択して除外できる。このカードがフィールドから墓地へ送られた時、
      このカードの効果で除外したモンスターを可能な限り自分フィールドに特殊召喚する */
function e6MentalBanked(card){
  const v = card && card.e6MentalUids;
  return Array.isArray(v) ? v.slice() : [];
}
function e6SentFromField(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('メンタルオーバー・デーモン', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz','grave'], timing:['mainPhase','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e6SentFromField(ctx)){
        ctx.reason = 'フィールドから墓地へ送られた時に発動します'; return false; }
      if(!e6MentalBanked(ctx.card).length){
        ctx.reason = 'この効果で除外したモンスターがいません'; return false; }
      return true;
    }
    if(!e6FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e6MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!e6PsychicGrave(ctx.player).length){
      ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){ done([]); return; }
    API.selectCard('メンタルオーバー・デーモン：除外するサイキック族',
      e6PsychicGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const uids = e6MentalBanked(ctx.card);
      uids.forEach(u => {
        if(!e6MzOpen(ctx.player)) return;
        const h = findCardByUid(u);
        if(!h || h.zone !== 'banish') return;
        API.specialSummon(ctx.player, 'banish', h.index, 'atk',
          'メンタルオーバー・デーモン', h.p);
      });
      const me = locateCardAnyV4(ctx.card);
      if(me) API.setCardFlag(me, 'e6MentalUids', [], 'メンタルオーバー・デーモン');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.banish(r, 'メンタルオーバー・デーモン');
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'e6MentalUids',
      e6MentalBanked(ctx.card).concat([uid]), 'メンタルオーバー・デーモン');
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){
      return e6SentFromField(ctx) && e6MentalBanked(ctx.card).length > 0; },
    onDestroy(ctx){
      return e6SentFromField(ctx) && e6MentalBanked(ctx.card).length > 0; }
  }
});

/* ===================== C. レベルの宣言 ===================== */

/* 8. エクストラゲート — 1から12までの任意のレベルを宣言して発動する。
      相手はエクストラデッキの宣言されたレベルを持つモンスター1体を除外する。
      宣言したレベルのモンスターが相手のエクストラデッキに無かった場合、
      自分の手札を1枚選択して捨てる */
API.registerChoiceHandler('e6.extraGate', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const foe = p === 0 ? 1 : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const lv = picked ? Number(picked.value) : 0;
  if(!(lv >= 1 && lv <= 12)) return;
  const q = API.pileCards(foe, 'ex', x => x.db.k === 'm' && Number(x.db.lv) === lv);
  if(q.length){ API.banish(q[0], 'エクストラゲート'); return; }
  /* 無かった場合は自分が手札を1枚捨てる。 */
  const hand = API.pileCards(p, 'hand');
  if(!hand.length){ API.log('エクストラゲート：捨てる手札がありません'); return; }
  API.selectCard('エクストラゲート：捨てる手札', hand, t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'hand')
      API.discard(p, r.index, 'エクストラゲート', { byEffect:true, byPlayer:p });
  });
});
defineScript('エクストラゲート', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(ctx){
    const cands = [];
    for(let i = 1; i <= 12; i++)
      cands.push({ key:'lv' + i, label:'レベル' + i, value:i });
    API.requestChoice({
      player: ctx.player, kind:'declare', cancelable:false, min:1, max:1,
      title:'エクストラゲート：レベルを宣言',
      candidates: cands,
      resume:{ handler:'e6.extraGate', args:{ player:ctx.player } }
    });
  },
  afterResolve(){}
});
