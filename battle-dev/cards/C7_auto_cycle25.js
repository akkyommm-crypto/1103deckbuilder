/* Auto cycle 25 — 13枚。engine 変更なし。
     XIVA スタンバイフェイズへの予約（Scheduler v7）
     XIVB 除外して戻す・破壊して戻す（uid で追跡する予約）
     XIVC 装備による無効化・攻撃強制（continuous.negateEffect / mustAttack）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d4MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d4Foe(p){ return p === 0 ? 1 : 0; }
/* 自分のスタンバイフェイズか */
function d4MyStandby(p){
  return gameState.phase === 'standby' && gameState.activePlayer === p;
}
/* 相手のスタンバイフェイズか */
function d4FoeStandby(p){
  return gameState.phase === 'standby' && gameState.activePlayer === d4Foe(p);
}
/* uid のカードが指定領域にいれば handle を返す */
function d4At(uid, zone){
  if(uid == null) return null;
  const h = findCardByUid(uid);
  return (h && h.zone === zone) ? h : null;
}

/* ---- 予約ハンドラ（Scheduler v7） ---- */

/* 墓地の uid のカードを特殊召喚する */
API.registerScheduleHandler('d4.reviveUid', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const h = d4At(args && args.uid, 'grave');
  if(!h || !d4MzOpen(p)) return;
  API.specialSummon(p, 'grave', h.index, args && args.pos === 'def' ? 'def' : 'atk',
    (args && args.reason) || '予約', h.p);
});
/* 除外されている uid のカードをフィールドに戻す */
API.registerScheduleHandler('d4.returnBanishedUid', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const h = d4At(args && args.uid, 'banish');
  if(!h || !d4MzOpen(p)) return;
  API.specialSummon(p, 'banish', h.index, args && args.pos === 'def' ? 'def' : 'atk',
    (args && args.reason) || '予約', h.p);
});
/* 指定プレイヤーにダメージ */
API.registerScheduleHandler('d4.damage', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const n = Number(args && args.amount) || 0;
  if(n > 0) API.damageLP(p, n);
});
/* uid のモンスターの攻撃力を恒久的に上げる */
API.registerScheduleHandler('d4.pumpUid', (args) => {
  const h = d4At(args && args.uid, 'mz');
  if(!h) return;
  API.modAtk(h, Number(args && args.atk) || 0, 0, 'permanent',
    (args && args.label) || '予約');
});
/* トークンを出す */
API.registerScheduleHandler('d4.tokens', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const spec = args && args.spec;
  if(!spec) return;
  const n = Math.min(Number(args.n) || 1,
    Math.max(0, ZONE_LIMITS.mz - (gameState.players[p].mz || []).length));
  if(n > 0) API.createTokens(p, spec, n, null);
});
/* 1枚ドロー */
API.registerScheduleHandler('d4.draw', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  if(gameState.players[p].deck.length) API.draw(p, Number(args && args.n) || 1);
});

/* ===================== A. 予約で戻す・出す ===================== */

/* 1. D－HERO ダブルガイ — 特殊召喚できない。1度のバトルフェイズ中に2回攻撃できる。
      破壊され墓地へ送られた場合、次の自分のスタンバイフェイズにトークン2体を特殊召喚できる */
function d4DoubleGuyDead(ctx){
  if(ctx.zone !== 'grave') return false;
  /* S03-U146: only its own destruction (it also fired for any other card destroyed / sent to the GY this turn) */
  if(ctx.eventName && ctx.eventName !== 'onDestroy') return false;
  if(ctx.eventName === 'onDestroy' && !eventIsSelfS03(ctx)) return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('D－HERO ダブルガイ', {
  type:'monster', priority:1, cannotSpecialSummon:true, attackLimit:2,
  activateFrom:['grave'],
  condition(ctx){
    if(!d4DoubleGuyDead(ctx)){
      ctx.reason = '破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
      handler:'d4.tokens', source:ctx.card, note:'D－HERO ダブルガイ',
      args:{ player:ctx.player, n:2,
             spec:{ key:'ダブルガイ・トークン', name:'ダブルガイ・トークン',
                    atk:1000, def:1000, lv:4, ra:'戦士', at:'闇', pos:'atk' } } });
  },
  afterResolve(){},
  /* S03-U146: one destruction raises both onDestroy and onSendToGrave; listening to both activated it twice */
  passive:{
    onDestroy(ctx){ return d4DoubleGuyDead(ctx); }
  }
});

/* 2. グラッジ — 相手プレイヤーに直接攻撃できる。相手に戦闘ダメージを与えた場合、
      次の自分のスタンバイフェイズにこのカードの攻撃力は1000ポイントアップする */
defineScript('グラッジ', {
  type:'monster', priority:1, forced:true, canDirectAttack:true, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!a3DealtBattleDamage(ctx)){
      ctx.reason = '相手プレイヤーに戦闘ダメージを与えた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
      handler:'d4.pumpUid', source:ctx.card, note:'グラッジ',
      args:{ uid:me.card.uid, atk:1000, label:'グラッジ' } });
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return ctx.zone === 'mz' && !!a3DealtBattleDamage(ctx); } }
});

/* 3. おとぼけオポッサム — 自分のメインフェイズ、相手フィールドにこのカードより
      攻撃力の高い表側モンスターがいる場合、このカードを破壊できる。
      自分のスタンバイフェイズ、この効果で破壊されたこのカードを墓地から特殊召喚できる */
function d4OpossumBigger(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  const mine = curATK(me.card);
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'up' && curATK(x.card) > mine }).length > 0;
}
defineScript('おとぼけオポッサム', {
  type:'monster', priority:1, activateFrom:['mz','grave'], timing:['mainPhase','standby'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!d4MyStandby(ctx.player)){
        ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
      if(Number(ctx.card.d4OpossumSelfKill || 0) <= 0){
        ctx.reason = 'この効果で破壊された場合のみ特殊召喚できます'; return false; }
      if(!d4MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      return true;
    }
    if(gameState.phase !== 'main1' && gameState.phase !== 'main2'){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のターンに発動します'; return false; }
    if(!d4OpossumBigger(ctx)){
      ctx.reason = '相手フィールドに攻撃力の高いモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone === 'grave' && d4MzOpen(ctx.player))
        API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'おとぼけオポッサム', me.p);
      return;
    }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    /* 「この効果で破壊された」事を墓地でも読めるように、破壊の前に刻む。 */
    API.setCardFlag(me, 'd4OpossumSelfKill', gameState.turn, 'おとぼけオポッサム');
    API.destroy(me, 'おとぼけオポッサム', ctx.player);
  },
  afterResolve(){}
});

/* 4. サクリファイス・ロータス — 自分のエンドフェイズ、墓地にあり自分の魔法・罠が
      1枚も無い場合、表側攻撃表示で特殊召喚できる。
      表側で存在する場合、自分のスタンバイフェイズ毎にコントローラーは1000ダメージを受ける */
defineScript('サクリファイス・ロータス', {
  type:'monster', priority:1, forced:false, activateFrom:['grave','mz'],
  timing:['endPhase','standby'],
  condition(ctx){
    if(ctx.zone === 'mz'){
      if(!d4MyStandby(ctx.player)){
        ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
      if(ctx.card.face !== 'up'){ ctx.reason = '表側表示である必要があります'; return false; }
      return true;
    }
    if(gameState.phase !== 'end' || gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のエンドフェイズに発動します'; return false; }
    if((gameState.players[ctx.player].sz || []).length > 0){
      ctx.reason = '自分フィールドに魔法・罠カードが存在します'; return false; }
    if(!d4MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.zone === 'mz'){ API.damageLP(ctx.player, 1000); return; }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave' && d4MzOpen(ctx.player)
       && (gameState.players[ctx.player].sz || []).length === 0)
      API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'サクリファイス・ロータス', me.p);
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'mz' && ctx.card.face === 'up' && d4MyStandby(ctx.player); } }
});

/* 5. シンクロ・ガンナー — 1ターンに1度、自分のメインフェイズ1でのみ発動できる。
      自分フィールドの表側シンクロモンスター1体を除外して相手に600ダメージ。
      除外したモンスターは次の自分のスタンバイフェイズにフィールドに戻る */
function d4MySynchro(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('シンクロ') });
}
defineScript('シンクロ・ガンナー', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(gameState.phase !== 'main1' || gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のメインフェイズ1でのみ発動できます'; return false; }
    if(!d4MySynchro(ctx.player).length){
      ctx.reason = '自分フィールドに表側のシンクロモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('シンクロ・ガンナー：除外するシンクロモンスター',
      d4MySynchro(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid, pos = r.card.pos === 'def' ? 'def' : 'atk';
    API.banish(r, 'シンクロ・ガンナー');
    API.damageLP(ctx.opponent, 600);
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
      handler:'d4.returnBanishedUid', source:ctx.card, note:'シンクロ・ガンナー',
      args:{ player:ctx.player, uid:uid, pos:pos, reason:'シンクロ・ガンナー' } });
  },
  afterResolve(){}
});

/* 6. テレポンD.D. — 自分フィールドの表側表示のこのカードが除外された場合、
      デッキから攻撃力1500以下のサイキック族1体を除外できる。
      次の自分のスタンバイフェイズ、この効果で除外したモンスターを特殊召喚する */
function d4TelepoBanished(ctx){
  if(ctx.zone !== 'banish') return false;
  const e = ctx.event || {};
  return e.toZone === 'banish' && e.uid === ctx.card.uid;
}
function d4PsychicDeck(p){
  return API.pileCards(p, 'deck',
    x => x.db.k === 'm' && x.db.ra === 'サイキック' && Number(x.db.atk) <= 1500);
}
defineScript('テレポンD.D.', {
  type:'monster', priority:1, targets:true, activateFrom:['banish'],
  condition(ctx){
    if(!d4TelepoBanished(ctx)){
      ctx.reason = '表側表示のこのカードが除外された場合に発動します'; return false; }
    if(!d4PsychicDeck(ctx.player).length){
      ctx.reason = 'デッキに攻撃力1500以下のサイキック族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('テレポンD.D.：除外するサイキック族',
      d4PsychicDeck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'deck') return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.banish(r, 'テレポンD.D.');
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
      handler:'d4.returnBanishedUid', source:ctx.card, note:'テレポンD.D.',
      args:{ player:ctx.player, uid:uid, pos:'atk', reason:'テレポンD.D.' } });
  },
  afterResolve(){},
  passive:{ onLeaveField(ctx){
    return d4TelepoBanished(ctx) && d4PsychicDeck(ctx.player).length > 0; } }
});

/* 7. ダーク・ネフティス — 自分のメインフェイズ、墓地の闇属性が3体以上の場合、
      その内2体を除外してこのカードを手札から墓地へ送る。
      次の自分のスタンバイフェイズにこのカードを墓地から特殊召喚する。
      特殊召喚に成功した時、フィールドの魔法・罠カード1枚を選択して破壊する */
API.registerChoiceHandler('d4.nephthys', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const cards = (answer && answer.cards) || [];
  if(cards.length < 2) return;
  cards.slice(0, 2).forEach(t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, 'ダーク・ネフティス（コスト）');
  });
  const uid = args && args.uid;
  const me = d4At(uid, 'hand');
  if(!me) return;
  API.sendHandToGrave(p, me.index, 'ダーク・ネフティス');
  const now = d4At(uid, 'grave');
  if(!now) return;
  API.schedule({ at:'standbyPhase', ownTurn:true, player:p,
    handler:'d4.reviveUid', source:now.card, note:'ダーク・ネフティス',
    args:{ player:p, uid:uid, pos:'atk', reason:'ダーク・ネフティス' } });
});
function d4NephthysSummoned(ctx){
  const e = ctx.event || {};
  return ctx.zone === 'mz' && e.uid === ctx.card.uid;
}
function d4FieldSpellTraps(){
  return API.fieldCards({ zone:'sz' }).concat(API.fieldCards({ zone:'field' }));
}
defineScript('ダーク・ネフティス', {
  type:'monster', priority:1, targets:true, activateFrom:['hand','mz'],
  condition(ctx){
    if(ctx.zone === 'mz'){
      if(!d4NephthysSummoned(ctx)){
        ctx.reason = '特殊召喚に成功した時に発動します'; return false; }
      if(!d4FieldSpellTraps().length){
        ctx.reason = 'フィールドに魔法・罠カードがありません'; return false; }
      return true;
    }
    if(gameState.phase !== 'main1' && gameState.phase !== 'main2'){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のターンに発動します'; return false; }
    if(d3GraveByAttr(ctx.player, '闇').length < 3){
      ctx.reason = '墓地の闇属性モンスターが3体未満です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone !== 'mz'){ done([]); return; }
    API.selectCard('ダーク・ネフティス：破壊する魔法・罠カード',
      d4FieldSpellTraps(), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'mz'){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(r && (r.zone === 'sz' || r.zone === 'field'))
        API.destroy(r, 'ダーク・ネフティス', ctx.player);
      return;
    }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand') return;
    ensureCardUid(gameState, me.card);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:2, max:2,
      title:'ダーク・ネフティス：除外する墓地の闇属性モンスター2体',
      candidates: d3GraveByAttr(ctx.player, '闇'),
      resume:{ handler:'d4.nephthys', args:{ player:ctx.player, uid:me.card.uid } }
    });
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return d4NephthysSummoned(ctx) && d4FieldSpellTraps().length > 0; } }
});

/* 8. 異次元の精霊 — 自分フィールドの表側モンスター1体を除外して手札から特殊召喚できる。
      この方法で特殊召喚した場合、次のスタンバイフェイズにその除外したモンスターを戻す */
defineScript('異次元の精霊', {
  /* S03-U17: ①はチェーンを作らない特殊召喚手順（Wiki 10/11/17「召喚ルール効果」、10/11/15「除外はコストではなく手順」）。
     ②「次のスタンバイフェイズに除外したモンスターを戻す」は既存の予約 d4.returnBanishedUid で行う
     （裁定上はチェーンブロックを作る誘発効果。予約はチェーンを作らない近似として WORK_QUEUE に残す）。 */
  type:'monster', priority:1,
  summonProcedure:{from:'hand', positions:['atk','def'],
    condition(ctx){
      if(!API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }).length){
        ctx.reason = '除外する自分の表側表示モンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const pool = API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' });
      if(!pool.length){ done(false); return; }
      API.selectCard('異次元の精霊：除外する自分の表側表示モンスター', pool, t => {
        const r = t && resolveTarget(t);
        if(!r || r.zone !== 'mz'){ done(false); return; }
        ensureCardUid(gameState, r.card);
        ctx.procedureDataS03 = { uid:r.card.uid, pos:(r.card.pos === 'def' ? 'def' : 'atk') };
        API.banish(r, '異次元の精霊（特殊召喚）');
        done(true);
      });
    },
    afterSummonS03(h, data){
      if(!h || !data || data.uid == null) return;
      API.schedule({ at:'standbyPhase', turns:1, player:h.p,
        handler:'d4.returnBanishedUid', source:h.card, note:'異次元の精霊',
        args:{ player:h.p, uid:data.uid, pos:data.pos, reason:'異次元の精霊' } });
    }
  }
});

/* ===================== B. スタンバイフェイズの継続処理 ===================== */

/* 9. X－セイバー パシウル — 戦闘では破壊されない。
      相手のスタンバイフェイズに発動し、自分は1000ダメージを受ける。
      この効果は表側守備表示で存在する場合に発動と処理を行う */
defineScript('X－セイバー パシウル', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], timing:['standby'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(me.card.face !== 'up' || me.card.pos !== 'def'){
      ctx.reason = '表側守備表示で存在する場合に発動します'; return false; }
    if(!d4FoeStandby(ctx.player)){
      ctx.reason = '相手のスタンバイフェイズに発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.player, 1000); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    const me = locateCardAnyV4(ctx.card);
    return !!me && me.zone === 'mz' && me.card.face === 'up' && me.card.pos === 'def'
        && d4FoeStandby(ctx.player); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'X－セイバー パシウル', label:'X－セイバー パシウル',
      battle: (target, self) => target === self,
      effect: false
    }
  }
});

/* 10. ウェポンチェンジ — 1ターンに1度、自分のスタンバイフェイズに700払って発動できる。
       自分フィールドの戦士族か機械族1体の攻撃力と守備力を、
       次の相手のエンドフェイズ終了時まで入れ替える */
function d4WeaponTargets(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.ra === '戦士' || x.db.ra === '機械') });
}
defineScript('ウェポンチェンジ', {
  type:'spell', priority:1, countLimit:1, targets:true,
  activateFrom:['sz'], timing:['standby'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(!d4MyStandby(ctx.player)){
      ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    if(API.me(ctx).lp <= 700){ ctx.reason = '700ライフポイントを払えません'; return false; }
    if(!d4WeaponTargets(ctx.player).length){
      ctx.reason = '戦士族・機械族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 700); done(true); },
  selectTargets(ctx, done){
    API.selectCard('ウェポンチェンジ：攻守を入れ替えるモンスター',
      d4WeaponTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    /* S03-U151: 「次の相手のエンドフェイズ終了時まで入れ替える。このカードが破壊された時、その効果は無効になる」.
       Before: API.swapBaseStats(…, 'endTurn') ended the swap at the end of its own turn, and nothing ended it when this card
       was destroyed (the d4WeaponSwapTurn flag it wrote was read nowhere). Now the swap is this card's continuous effect on the
       marked monster: it applies while this card is face-up in the Spell & Trap Zone and until the end of the next turn (the
       opponent's, whose End Phase ends it). Destroyed (or otherwise gone) → the swap stops. */
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz') return;
    ensureCardUid(gameState, ctx.card);
    API.setCardFlag(r, 'd4WeaponSrcUid', ctx.card.uid, 'ウェポンチェンジ', {silent:true});
    API.setCardFlag(r, 'd4WeaponUntilTurn', gameState.turn + 1, 'ウェポンチェンジ');
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!card || !self || self.face !== 'up' || card.d4WeaponSrcUid !== self.uid) return null;
      if(!(gameState.turn <= (Number(card.d4WeaponUntilTurn) || 0))) return null;
      return {setBaseAtk:baseDefV14(card), setBaseDef:baseAtkV14(card)};
    } }
});

/* 11. 愚鈍の斧 — 装備モンスターの攻撃力は1000アップし、効果は無効化される。
       自分のスタンバイフェイズに、装備モンスターのコントローラーに500ダメージ */
defineScript('愚鈍の斧', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz'], timing:['mainPhase','standby'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!d4MyStandby(ctx.player)){
        ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
      if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
      return true;
    }
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('愚鈍の斧：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){
      const host = a8Equipped(ctx.card);
      const hh = host && locateCardAnyV4(host);
      if(hh) API.damageLP(hh.p, 500);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz') API.equipSpell(me, r, '愚鈍の斧');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && !!ctx.card.equipTo && d4MyStandby(ctx.player)
        && !!a8Equipped(ctx.card); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:1000 };
    },
    negateEffect(card, self){
      return !!(self.equipTo && self.equipTo.uid === card.uid);
    }
  }
});

/* 12. 疫病 — 戦士族・獣戦士族・魔法使い族にのみ装備可能。装備モンスターの攻撃力は0になる。
       自分のスタンバイフェイズ毎に、装備モンスターのコントローラーに500ダメージ */
function d4PlagueOk(db){
  return !!db && (db.ra === '戦士' || db.ra === '獣戦士' || db.ra === '魔法使い');
}
defineScript('疫病', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz'], timing:['mainPhase','standby'],
  equipSpec:{ canEquip(h){ return d4PlagueOk(h && h.db); },
              label:'戦士族・獣戦士族・魔法使い族のみ' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!d4MyStandby(ctx.player)){
        ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
      if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
      return true;
    }
    if(!API.fieldCards({ zone:'mz',
          filter:x => x.card.face === 'up' && d4PlagueOk(x.db) }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('疫病：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' && d4PlagueOk(x.db) }),
      t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){
      const host = a8Equipped(ctx.card);
      const hh = host && locateCardAnyV4(host);
      if(hh) API.damageLP(hh.p, 500);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz') API.equipSpell(me, r, '疫病');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && !!ctx.card.equipTo && d4MyStandby(ctx.player)
        && !!a8Equipped(ctx.card); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { setAtk:0 };
    }
  }
});

/* 13. バトルマニア — 相手ターンのスタンバイフェイズに発動できる。
       相手フィールドの表側モンスターは全て攻撃表示になり、
       このターン表示形式を変更できず、攻撃可能なモンスターは攻撃しなければならない */
defineScript('バトルマニア', {
  type:'trap', priority:2,
  condition(ctx){
    if(!d4FoeStandby(ctx.player)){
      ctx.reason = '相手ターンのスタンバイフェイズに発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz',
          filter:x => x.card.face === 'up' }).length){
      ctx.reason = '相手フィールドに表側表示モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' })
      .forEach(hh => { if(hh.card.pos !== 'atk') API.changePosition(hh, 'atk', 'バトルマニア'); });
    /* 効果はこのターン続くが、通常罠なのでカード自身は墓地へ行く。
       墓地ソース（System v29）として、発動したターンだけ継続効果を宣言する。 */
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'd4ManiaTurn', gameState.turn, 'バトルマニア');
  },
  afterResolve(){},
  continuous:{
    /* System v29 の墓地ソース宣言。発動ターンのみ有効なので、
       ターンが変われば自動的に何も返さなくなる。 */
    scope:'allMonsters', from:['sz','grave'],
    apply(){ return null; },
    mustAttack(card, self){
      if(Number(self.d4ManiaTurn || 0) !== gameState.turn) return false;
      const h = locateCardAnyV4(card);
      const sh = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz' || !sh) return false;
      return h.p !== sh.p && h.card.face === 'up';
    },
    cannotChangePosition(card, self){
      if(Number(self.d4ManiaTurn || 0) !== gameState.turn) return false;
      const h = locateCardAnyV4(card);
      const sh = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz' || !sh) return false;
      return h.p !== sh.p && h.card.face === 'up';
    }
  }
});
