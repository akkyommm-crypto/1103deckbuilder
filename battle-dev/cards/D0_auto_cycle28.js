/* Auto cycle 28 — 11枚。engine 変更なし。
     XVIIA 除外して「同じ表示形式で」戻す（banishInfo.pos + Scheduler v7）
     XVIIB 表示形式の変更と変更禁止（Position v10）
     XVIIC 表示形式によって効果が変わるカード
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d7MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d7MyTurn(p){ return gameState.activePlayer === p; }
function d7FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* 相手フィールドの表側モンスター */
function d7FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' });
}
/* 除外したカードを「同じ表示形式で」相手フィールドへ戻す */
API.registerScheduleHandler('d7.returnSamePos', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(!h || h.zone !== 'banish') return;
  const to = (args && (args.toPlayer === 0 || args.toPlayer === 1)) ? args.toPlayer : h.p;
  if((gameState.players[to].mz || []).length >= ZONE_LIMITS.mz) return;
  const b = h.card.banishInfo || {};
  const pos = (b.pos === 'def') ? 'def' : 'atk';
  API.specialSummon(to, 'banish', h.index, pos, (args && args.reason) || '予約', h.p);
  /* 裏側だったものは裏側のまま戻す */
  const back = findCardByUid(args.uid);
  if(back && back.zone === 'mz' && b.face === 'down')
    API.flip(back, 'down', (args && args.reason) || '予約');
});
/* 除外して戻す予約を張る共通処理 */
function d7BanishAndSchedule(ctx, target, at, turns, reason){
  const r = target && resolveTarget(target);
  if(!r || r.zone !== 'mz') return null;
  ensureCardUid(gameState, r.card);
  const uid = r.card.uid, owner = r.p;
  API.banish(r, reason);
  API.schedule({ at:at, turns:turns, player:ctx.player,
    handler:'d7.returnSamePos', source:ctx.card, note:reason,
    args:{ uid:uid, toPlayer:owner, reason:reason } });
  return uid;
}
/* このターン表示形式を変更できない印（continuous.cannotChangePosition から読む） */
function d7PosLocked(card, throughTurn){
  const t = Number(card && card.d7PosLockThrough || 0);
  return t > 0 && gameState.turn <= t;
}

/* ===================== A. 除外して同じ表示形式で戻す ===================== */

/* 1. ジャンク・アーチャー — 1ターンに1度、相手フィールドのモンスター1体を選択して
      ゲームから除外する。この効果で除外したモンスターは
      このターンのエンドフェイズ時に同じ表示形式で相手フィールドに戻る */
defineScript('ジャンク・アーチャー', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    if(!d7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ジャンク・アーチャー：除外する相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    d7BanishAndSchedule(ctx, ctx.selectedTargets && ctx.selectedTargets[0],
      'endPhase', 0, 'ジャンク・アーチャー');
  },
  afterResolve(){}
});

/* 2. パスト・イメージ — 自分フィールドにサイキック族が表側で存在する場合、
      相手フィールドのモンスター1体を選択して除外する。
      除外したモンスターは次のスタンバイフェイズに同じ表示形式で戻る */
function d7MyPsychic(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === 'サイキック' });
}
defineScript('パスト・イメージ', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!d7MyPsychic(ctx.player).length){
      ctx.reason = '自分フィールドに表側表示のサイキック族がいません'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('パスト・イメージ：除外する相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    d7BanishAndSchedule(ctx, ctx.selectedTargets && ctx.selectedTargets[0],
      'standbyPhase', 1, 'パスト・イメージ');
  },
  afterResolve(){}
});

/* ===================== B. 表示形式の変更 ===================== */

/* 3. ジャンク・ガードナー — 1ターンに1度、相手フィールドのモンスター1体の
      表示形式を変更できる（相手ターンでも発動できる）。
      また、フィールドから墓地へ送られた場合、フィールドのモンスター1体の
      表示形式を変更できる */
function d7SentFromField(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
function d7FlipTargets(ctx){
  return (ctx.zone === 'grave')
    ? API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' })
    : d7FoeFaceUp(ctx);
}
defineScript('ジャンク・ガードナー', {
  type:'monster', priority:2, countLimit:1, targets:true,
  activateFrom:['mz','grave'], timing:['free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!d7SentFromField(ctx)){
        ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
      if(!d7FlipTargets(ctx).length){
        ctx.reason = '表示形式を変更できるモンスターがいません'; return false; }
      return true;
    }
    if(!d7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d7FlipTargets(ctx).length){
      ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ジャンク・ガードナー：表示形式を変更するモンスター',
      d7FlipTargets(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz' || r.card.face !== 'up') return;
    API.changePosition(r, r.card.pos === 'atk' ? 'def' : 'atk', 'ジャンク・ガードナー');
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return d7SentFromField(ctx) && d7FlipTargets(ctx).length > 0; },
    onDestroy(ctx){ return d7SentFromField(ctx) && d7FlipTargets(ctx).length > 0; }
  }
});

/* 4. サーチ・ストライカー — 裏側守備表示のモンスターを攻撃した場合、
      ダメージ計算を行わず裏側守備表示のままそのモンスターを破壊できる。
      使用した場合、バトルフェイズ終了時に守備表示になり、
      次の自分のターンのエンドフェイズ時まで表示形式を変更できない */
API.registerScheduleHandler('d7.toDefenseUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz' && h.card.face === 'up' && h.card.pos !== 'def')
    API.changePosition(h, 'def', (args && args.reason) || '予約');
});
function d7AttackingFaceDown(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  if(atk !== ctx.card) return null;
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!def || def.face !== 'down') return null;
  return def;
}
defineScript('サーチ・ストライカー', {
  type:'monster', priority:1, dsTiming:'start', activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){
    if(!d7AttackingFaceDown(ctx)){
      ctx.reason = '裏側守備表示のモンスターを攻撃した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const victim = d7AttackingFaceDown(ctx);
    if(!victim) return;
    const vh = locateCardAnyV4(victim);
    if(vh && vh.zone === 'mz') API.destroy(vh, 'サーチ・ストライカー', ctx.player);
    endBattle();
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    /* 次の自分のターンのエンドフェイズ時まで表示形式を変更できない */
    API.setCardFlag(me, 'd7PosLockThrough', gameState.turn + 2, 'サーチ・ストライカー');
    API.schedule({ at:'battlePhaseEnd', turns:0, player:ctx.player,
      handler:'d7.toDefenseUid', source:ctx.card, note:'サーチ・ストライカー',
      args:{ uid:me.card.uid, reason:'サーチ・ストライカー' } });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && !!d7AttackingFaceDown(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(card, self){ return card === self && d7PosLocked(self); }
  }
});

/* 5. サブマリンロイド — 相手プレイヤーに直接攻撃できる。
      その時の戦闘ダメージは元々の攻撃力と同じ数値になる。
      戦闘を行ったダメージステップ終了時、このカードを守備表示にできる */
defineScript('サブマリンロイド', {
  type:'monster', priority:1, canDirectAttack:true, dsTiming:'after',
  activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){
    if(!d7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const b = ctx.battle || {};
    if(b.atkCard !== ctx.card && b.defCard !== ctx.card){
      ctx.reason = '戦闘を行ったダメージステップ終了時に発動します'; return false; }
    const me = locateCardAnyV4(ctx.card);
    if(me.card.pos === 'def'){ ctx.reason = '既に守備表示です'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.changePosition(me, 'def', 'サブマリンロイド');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(!d7FaceUpMz(ctx)) return false;
    const b = ctx.battle || {};
    const me = locateCardAnyV4(ctx.card);
    return (b.atkCard === ctx.card || b.defCard === ctx.card) && me.card.pos !== 'def'; } },
  continuous:{
    scope:'self', from:['mz'],
    /* 直接攻撃で与える戦闘ダメージは「元々の攻撃力」と同じ数値になる。
       ダメージ量は攻撃力から算出されるので、直接攻撃を宣言している間だけ
       最終攻撃力を元々の数値に固定する（setFinalAtk 層）。 */
    apply(card, self){
      if(card !== self) return null;
      const b = gameState.battle;
      if(!b || b.target !== 'direct') return null;
      const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
      if(atk !== self) return null;
      return { setFinalAtk: Number(dbOf(self).atk) || 0 };
    }
  }
});

/* 6. レプティレス・ナージャ — ①戦闘では破壊されない。
      ②モンスターと戦闘を行ったバトルフェイズ終了時、そのモンスターの攻撃力を0にする。
      ③守備表示で存在する場合、自分エンドフェイズに表側攻撃表示にする */
function d7NajaFought(ctx){
  const st = gameState.battlePhaseV6;
  const list = (st && Array.isArray(st.attacks)) ? st.attacks : [];
  const uid = ctx.card && ctx.card.uid;
  if(uid == null) return null;
  for(let i = list.length - 1; i >= 0; i--){
    const a = list[i];
    if(!a) continue;
    if(a.attackerUid === uid && a.targetUid != null){
      const h = findCardByUid(a.targetUid);
      if(h && h.zone === 'mz') return h;
    }
    if(a.targetUid === uid && a.attackerUid != null){
      const h = findCardByUid(a.attackerUid);
      if(h && h.zone === 'mz') return h;
    }
  }
  return null;
}
defineScript('レプティレス・ナージャ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  timing:['free','endPhase'],
  condition(ctx){
    if(!d7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const me = locateCardAnyV4(ctx.card);
    if(gameState.phase === 'end' && d7MyTurn(ctx.player) && me.card.pos === 'def') return true;
    if(gameState.phase === 'battle' && d7NajaFought(ctx)) return true;
    ctx.reason = '戦闘を行ったバトルフェイズ終了時、または守備表示の自分エンドフェイズに発動します';
    return false;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(gameState.phase === 'end' && d7MyTurn(ctx.player) && me.card.pos === 'def'){
      API.changePosition(me, 'atk', 'レプティレス・ナージャ'); return;
    }
    const other = d7NajaFought(ctx);
    if(other && other.zone === 'mz')
      API.setAtk(other, 0, 'permanent', 'レプティレス・ナージャ');
  },
  afterResolve(){},
  passive:{
    onBattlePhaseEnd(ctx){ return d7FaceUpMz(ctx) && !!d7NajaFought(ctx); },
    onEndPhase(ctx){
      const me = locateCardAnyV4(ctx.card);
      return d7FaceUpMz(ctx) && d7MyTurn(ctx.player) && me.card.pos === 'def'; }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'レプティレス・ナージャ', label:'レプティレス・ナージャ',
      battle:(target, self) => target === self, effect:false
    }
  }
});

/* 7. ミドル・シールド・ガードナー — 1ターンに1度だけ裏側守備表示にできる。
      裏側表示のこのカードを対象とする魔法カードの発動を無効にする。
      その時このカードは表側守備表示になる */
function d7TargetedByFoeSpell(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'spell') return false;
  if(e.player !== ctx.opponent) return false;
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz' || me.card.face !== 'down') return false;
  const targets = API.activationTargets(e) || [];
  return targets.some(t => t && t.card === ctx.card);
}
defineScript('ミドル・シールド・ガードナー', {
  type:'monster', priority:3, countLimit:1, activateFrom:['mz'],
  timing:['mainPhase','chain'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(d7TargetedByFoeSpell(ctx)) return true;
    if(me.card.face !== 'up'){ ctx.reason = '表側表示である必要があります'; return false; }
    if(!d7MyTurn(ctx.player) || (gameState.phase !== 'main1' && gameState.phase !== 'main2')){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(me.card.face === 'down'){
      const e = ctx.event || {};
      if(e.chainId != null)
        API.negateChainLink(e.chainId, 'activation', 'ミドル・シールド・ガードナー', false);
      API.flip(me, 'up', 'ミドル・シールド・ガードナー');
      const again = locateCardAnyV4(ctx.card);
      if(again && again.zone === 'mz') API.changePosition(again, 'def', 'ミドル・シールド・ガードナー');
      return;
    }
    API.changePosition(me, 'def', 'ミドル・シールド・ガードナー');
    const again = locateCardAnyV4(ctx.card);
    if(again && again.zone === 'mz') API.flip(again, 'down', 'ミドル・シールド・ガードナー');
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return d7TargetedByFoeSpell(ctx); } }
});

/* 8. 妨害電波 — フィールドにシンクロモンスターが表側攻撃表示で存在する場合に発動できる。
      フィールドのシンクロモンスターを全て表側守備表示にする。
      このターンのエンドフェイズ時にフィールドのシンクロモンスターを全てエクストラに戻す */
function d7SynchroOnField(faceUpAtkOnly){
  return API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up'
    && (x.db.st || []).includes('シンクロ')
    && (!faceUpAtkOnly || x.card.pos === 'atk') });
}
API.registerScheduleHandler('d7.synchroToEx', () => {
  d7SynchroOnField(false).slice().forEach(hh => {
    const now = locateCardAnyV4(hh.card);
    if(now && now.zone === 'mz') API.returnToDeck(now, false, '妨害電波');
  });
});
defineScript('妨害電波', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(!d7SynchroOnField(true).length){
      ctx.reason = '表側攻撃表示のシンクロモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    d7SynchroOnField(false).forEach(hh => {
      const now = locateCardAnyV4(hh.card);
      if(now && now.zone === 'mz' && now.card.pos !== 'def')
        API.changePosition(now, 'def', '妨害電波');
    });
    API.schedule({ at:'endPhase', turns:0, player:ctx.player,
      handler:'d7.synchroToEx', source:ctx.card, note:'妨害電波', args:{} });
  },
  afterResolve(){}
});

/* 9. ロスト・スター・ディセント — 自分の墓地のSモンスター1体を対象に発動できる。
      レベルを1つ下げ、守備力を0にして守備表示で特殊召喚する。
      この効果で特殊召喚したモンスターの効果は無効化され、表示形式を変更できない */
function d7SynchroGrave(p){
  return API.pileCards(p, 'grave',
    x => x.db.k === 'm' && (x.db.st || []).includes('シンクロ'));
}
defineScript('ロスト・スター・ディセント', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!d7SynchroGrave(ctx.player).length){
      ctx.reason = '墓地にSモンスターがいません'; return false; }
    if(!d7MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ロスト・スター・ディセント：特殊召喚するSモンスター',
      d7SynchroGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !d7MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'def', 'ロスト・スター・ディセント', r.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(!now || now.zone !== 'mz') return;
    API.modLevel(now, -1, 'permanent', 'ロスト・スター・ディセント');
    API.setDef(now, 0, 'permanent', 'ロスト・スター・ディセント');
    API.negateEffectUntil(now, 'permanent', 'ロスト・スター・ディセント', ctx.card);
    /* 表示形式を変更できない印。墓地に落ちたこのカードが継続効果で読む。 */
    API.setCardFlag(now, 'd7LostStarUid', 1, 'ロスト・スター・ディセント');
  },
  afterResolve(){},
  continuous:{
    /* System v29 の墓地ソース宣言。通常罠なので解決後は墓地にある。 */
    scope:'allMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotChangePosition(card){ return Number(card && card.d7LostStarUid || 0) > 0; }
  }
});

/* ===================== C. 表示形式で変わる効果 ===================== */

/* 10. サイコジャンパー — 1000ライフを払い、相手フィールドの表側モンスター1体と
       「サイコジャンパー」以外の自分の表側サイキック族1体のコントロールを入れ替える。
       選択された相手モンスターはこのターン表示形式を変更できない。1ターンに1度 */
function d7MyOtherPsychic(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.card.face === 'up' && x.db.ra === 'サイキック' });
}
defineScript('サイコジャンパー', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    if(!d7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(API.me(ctx).lp <= 1000){ ctx.reason = '1000ライフポイントを払えません'; return false; }
    if(!d7FoeFaceUp(ctx).length){
      ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    if(!d7MyOtherPsychic(ctx).length){
      ctx.reason = '「サイコジャンパー」以外の自分の表側サイキック族がいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  selectTargets(ctx, done){
    API.selectCard('サイコジャンパー：入れ替える相手モンスター', d7FoeFaceUp(ctx), a =>
      API.selectCard('サイコジャンパー：入れ替える自分のサイキック族',
        d7MyOtherPsychic(ctx), b => done([a, b])));
  },
  resolve(ctx){
    const a = ctx.selectedTargets && ctx.selectedTargets[0];
    const b = ctx.selectedTargets && ctx.selectedTargets[1];
    const ra = a && resolveTarget(a), rb = b && resolveTarget(b);
    if(!ra || !rb || ra.zone !== 'mz' || rb.zone !== 'mz') return;
    /* sourceTarget は resolveTarget に通されるので、カード実体ではなくハンドルを渡す。 */
    API.swapControl(ra, rb, 'サイコジャンパー', locateCardAnyV4(ctx.card));
    const now = locateCardAnyV4(ra.card);
    if(now && now.zone === 'mz')
      API.setCardFlag(now, 'd7PosLockThrough', gameState.turn, 'サイコジャンパー');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(card){ return d7PosLocked(card); }
  }
});

/* 11. D・チャッカン — 表示形式によって以下の効果を得る。
       ●攻撃表示: 自分フィールドのモンスター1体をリリースして相手に600ダメージ（1ターンに1度）
       ●守備表示: 相手に300ダメージ（1ターンに1度） */
defineScript('D・チャッカン', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    if(!d7FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d7MyTurn(ctx.player)){ ctx.reason = '自分のターンに発動します'; return false; }
    const me = locateCardAnyV4(ctx.card);
    if(me.card.pos === 'def') return true;
    if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){
      ctx.reason = 'リリースするモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.card.pos === 'def'){ done([]); return; }
    API.selectCard('D・チャッカン（コスト）：リリースするモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.card.pos === 'def'){ done(true); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, 'D・チャッカン（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    /* コストで自身をリリースした場合は墓地にいる。表示形式はコスト時点で決まる。 */
    const me = locateCardAnyV4(ctx.card);
    const wasDef = !!(me && me.zone === 'mz' && me.card.pos === 'def');
    API.damageLP(ctx.opponent, wasDef ? 300 : 600);
  },
  afterResolve(){}
});
