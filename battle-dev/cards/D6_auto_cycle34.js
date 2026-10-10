/* Auto cycle 34 — 7枚。engine 変更なし。
     XXIIIA デッキからの複数リクルート（RESOLUTION_SUMMON_BATCH_V2 に乗せる）
     XXIIIB 種類の宣言（System v11 declare）
     XXIIIC 手札に戻す・名前を変える・装備で回復する
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e3MzOpen(p, n){
  return (gameState.players[p].mz || []).length + (Number(n) || 1) <= ZONE_LIMITS.mz;
}
function e3MyTurn(p){ return gameState.activePlayer === p; }
function e3MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e3MyTurn(p);
}
function e3FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
function e3MyEndPhase(p){ return gameState.phase === 'end' && e3MyTurn(p); }
/* 破壊され墓地へ送られたか（相手の効果による破壊に限る場合は byFoe=true） */
function e3DestroyedByFoe(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
  const rec = c1DestroyRecord(ctx.card);
  if(!rec) return false;
  return !rec.battle && rec.byPlayer === (ctx.player === 0 ? 1 : 0);
}
/* デッキから1体を特殊召喚し、出た実体の uid を返す */
function e3SummonFromDeck(p, handle, reason){
  if(!handle || handle.zone !== 'deck') return null;
  ensureCardUid(gameState, handle.card);
  const uid = handle.card.uid;
  API.specialSummon(p, 'deck', handle.index, 'atk', reason, handle.p);
  const now = (uid != null) ? findCardByUid(uid) : null;
  return (now && now.zone === 'mz') ? uid : null;
}

/* ---- 予約ハンドラ ---- */
API.registerScheduleHandler('e3.destroyUids', (args) => {
  const uids = Array.isArray(args && args.uids) ? args.uids : [];
  uids.forEach(u => {
    const h = findCardByUid(u);
    if(h && h.zone === 'mz') API.destroy(h, (args && args.reason) || '予約');
  });
});
API.registerScheduleHandler('e3.reviveUid', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(!h || h.zone !== 'grave' || !e3MzOpen(p)) return;
  API.specialSummon(p, 'grave', h.index, 'atk', (args && args.reason) || '予約', h.p);
});

/* ===================== A. デッキからの複数リクルート ===================== */

/* 1. レスキューキャット — 1ターンに1度。フィールドのこのカードを墓地へ送って発動でき、
      デッキからレベル3以下の獣族2体を特殊召喚する。
      この効果で特殊召喚したモンスターの効果は無効化され、エンドフェイズに破壊される */
function e3LowBeastDeck(p){
  return API.pileCards(p, 'deck',
    x => x.db.k === 'm' && x.db.ra === '獣' && Number(x.db.lv) <= 3);
}
defineScript('レスキューキャット', {
  type:'monster', priority:1, countLimit:1, nameLimit:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(e3LowBeastDeck(ctx.player).length < 2){
      ctx.reason = 'デッキにレベル3以下の獣族が2体いません'; return false; }
    /* 自身を墓地へ送るので、その分の空きは戻る。2体分の空きを見る。 */
    if((gameState.players[ctx.player].mz || []).length - 1 + 2 > ZONE_LIMITS.mz){
      ctx.reason = 'モンスターゾーンに2体分の空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz'){ API.sendToGrave(me, 'レスキューキャット（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const uids = [];
    for(let i = 0; i < 2; i++){
      const q = e3LowBeastDeck(ctx.player);
      if(!q.length || !e3MzOpen(ctx.player)) break;
      const u = e3SummonFromDeck(ctx.player, q[0], 'レスキューキャット');
      if(u != null) uids.push(u);
    }
    uids.forEach(u => {
      const h = findCardByUid(u);
      if(h && h.zone === 'mz') API.negateEffectUntil(h, 'permanent', 'レスキューキャット', ctx.card);
    });
    if(uids.length)
      API.schedule({ at:'endPhase', turns:0, player:ctx.player,
        handler:'e3.destroyUids', source:ctx.card, note:'レスキューキャット',
        args:{ uids:uids, reason:'レスキューキャット' } });
  },
  afterResolve(){}
});

/* 2. マックス・テレポーター — 特殊召喚できない。
      2000ライフポイントを払う事で、デッキからレベル3のサイキック族2体を特殊召喚する。
      この効果はフィールドに表側表示で存在する限り1度しか使用できない */
function e3Lv3PsychicDeck(p){
  return API.pileCards(p, 'deck',
    x => x.db.k === 'm' && x.db.ra === 'サイキック' && Number(x.db.lv) === 3);
}
defineScript('マックス・テレポーター', {
  type:'monster', priority:1, cannotSpecialSummon:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e3MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(Number(me.card.e3MaxUsed || 0) > 0){
      ctx.reason = 'このカードは既にこの効果を使用しています'; return false; }
    if(API.me(ctx).lp <= 2000){ ctx.reason = '2000ライフポイントを払えません'; return false; }
    if(e3Lv3PsychicDeck(ctx.player).length < 2){
      ctx.reason = 'デッキにレベル3のサイキック族が2体いません'; return false; }
    if(!e3MzOpen(ctx.player, 2)){
      ctx.reason = 'モンスターゾーンに2体分の空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 2000); done(true); },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.setCardFlag(me, 'e3MaxUsed', 1, 'マックス・テレポーター');
    for(let i = 0; i < 2; i++){
      const q = e3Lv3PsychicDeck(ctx.player);
      if(!q.length || !e3MzOpen(ctx.player)) break;
      e3SummonFromDeck(ctx.player, q[0], 'マックス・テレポーター');
    }
  },
  afterResolve(){}
});

/* ===================== B. 種類の宣言 ===================== */

/* 3. ヴァンパイア・ロード — 相手ライフに戦闘ダメージを与えた時、
      カードの種類（モンスター・魔法・罠）を宣言する。
      相手は宣言された種類のカード1枚をデッキから墓地へ送る。
      また、相手のカードの効果によって破壊され墓地へ送られた場合、
      次の自分のスタンバイフェイズにこのカードを墓地から特殊召喚する */
const E3_KIND_OF = { 'モンスター':'m', '魔法':'s', '罠':'t' };
API.registerChoiceHandler('e3.vampireLord', (answer, args) => {
  const foe = (args && (args.opponent === 0 || args.opponent === 1)) ? args.opponent : 1;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const kind = picked ? E3_KIND_OF[String(picked.value)] : null;
  if(!kind) return;
  const q = API.pileCards(foe, 'deck', x => x.db.k === kind);
  if(!q.length){ API.log('ヴァンパイア・ロード：宣言した種類のカードがデッキにありません'); return; }
  API.mill(foe, q[0].index, 'ヴァンパイア・ロード');
});
function e3DealtBattleDamage(ctx){
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = ctx.card && ctx.card.uid;
  if(uid == null) return false;
  return e.attackerUid === uid || e.defenderUid === uid;
}
defineScript('ヴァンパイア・ロード', {
  type:'monster', priority:1, forced:true,
  activateFrom:['mz','grave'], timing:['damageStep','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e3DestroyedByFoe(ctx)){
        ctx.reason = '相手のカードの効果で破壊され墓地へ送られた場合に発動します'; return false; }
      return true;
    }
    if(!e3FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e3DealtBattleDamage(ctx)){
      ctx.reason = '相手ライフに戦闘ダメージを与えた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'grave') return;
      ensureCardUid(gameState, me.card);
      API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
        handler:'e3.reviveUid', source:ctx.card, note:'ヴァンパイア・ロード',
        args:{ player:ctx.player, uid:me.card.uid, reason:'ヴァンパイア・ロード' } });
      return;
    }
    /* 宣言はコントローラーが行う。相手はその種類をデッキから墓地へ送る。 */
    API.requestChoice({
      player: ctx.player, kind:'declare', cancelable:false, min:1, max:1,
      title:'ヴァンパイア・ロード：カードの種類を宣言',
      candidates:[{key:'m', label:'モンスター', value:'モンスター'},
                  {key:'s', label:'魔法',       value:'魔法'},
                  {key:'t', label:'罠',         value:'罠'}],
      resume:{ handler:'e3.vampireLord', args:{ opponent:ctx.opponent } }
    });
  },
  afterResolve(){},
  passive:{
    onBattleDamage(ctx){ return e3FaceUpMz(ctx) && e3DealtBattleDamage(ctx); },
    onSendToGrave(ctx){ return e3DestroyedByFoe(ctx); },
    onDestroy(ctx){ return e3DestroyedByFoe(ctx); }
  }
});

/* ===================== C. チェーン発動・名前・装備 ===================== */

/* 4. マジック・キャプチャー — 自分が魔法カードを発動した時、手札を1枚捨ててチェーン発動する。
      チェーン発動した魔法カードが墓地へ送られた時、そのカードを手札に戻す */
function e3MySpellActivation(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'spell') return false;
  if(e.player !== ctx.player) return false;
  if(e.uid != null && ctx.card && e.uid === ctx.card.uid) return false;
  return true;
}
function e3WatchedInGrave(ctx){
  const uid = Number(ctx.card && ctx.card.e3WatchUid);
  if(!Number.isFinite(uid) || uid < 0) return null;
  const h = findCardByUid(uid);
  return (h && h.zone === 'grave') ? h : null;
}
defineScript('マジック・キャプチャー', {
  type:'trap', priority:3, activateFrom:['sz','grave'], timing:['chain','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e3WatchedInGrave(ctx)){
        ctx.reason = 'チェーン発動した魔法カードが墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(!e3MySpellActivation(ctx)){
      ctx.reason = '自分が魔法カードを発動した時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.zone === 'grave'){ done(true); return; }
    const q = API.pileCards(ctx.player, 'hand');
    if(!q.length){ done(false); return; }
    API.selectCard('マジック・キャプチャー（コスト）：捨てる手札', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'マジック・キャプチャー（コスト）',
          { byEffect:true, byPlayer:ctx.player });
        done(true);
      } else done(false);
    });
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const h = e3WatchedInGrave(ctx);
      if(h) API.returnToHand(h, 'マジック・キャプチャー');
      const me = locateCardAnyV4(ctx.card);
      if(me) API.setCardFlag(me, 'e3WatchUid', -1, 'マジック・キャプチャー');
      return;
    }
    const e = ctx.event || {};
    const me = locateCardAnyV4(ctx.card);
    if(me && e.uid != null)
      API.setCardFlag(me, 'e3WatchUid', Number(e.uid), 'マジック・キャプチャー');
  },
  afterResolve(){},
  passive:{
    onActivateSuccess(ctx){
      return ctx.zone === 'sz' && e3MySpellActivation(ctx) && API.me(ctx).hand.length > 0; },
    onSendToGrave(ctx){ return ctx.zone === 'grave' && !!e3WatchedInGrave(ctx); }
  }
});

/* 5. ヒーロー・マスク — 自分フィールドの表側表示モンスター1体を対象として発動できる。
      デッキから「E・HERO」モンスター1体を墓地へ送り、
      対象のモンスターはエンドフェイズまで、その墓地へ送ったモンスターと同名カードとして扱う */
function e3HeroDeck(p){
  return API.pileCards(p, 'deck',
    x => x.db.k === 'm' && isSetCardV4(x.db, SETCODE.ELEMENTAL_HERO));
}
defineScript('ヒーロー・マスク', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' }).length){
      ctx.reason = '自分フィールドに表側表示モンスターがいません'; return false; }
    if(!e3HeroDeck(ctx.player).length){
      ctx.reason = 'デッキに「E・HERO」モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヒーロー・マスク：対象にする自分のモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const q = e3HeroDeck(ctx.player);
    if(!q.length) return;
    const name = q[0].db.n;
    API.mill(ctx.player, q[0].index, 'ヒーロー・マスク');
    API.setCardName(r, name, 'endPhase', 'ヒーロー・マスク');
  },
  afterResolve(){}
});

/* 6. 魔術の呪文書 — 「ブラック・マジシャン」「ブラック・マジシャン・ガール」にのみ装備可能。
      装備モンスターの攻撃力は700ポイントアップする。
      このカードがフィールドから墓地へ送られた時、1000ライフポイント回復する */
const E3_MAGICIAN_NAMES = ['ブラック・マジシャン', 'ブラック・マジシャン・ガール'];
function e3MagicianOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && E3_MAGICIAN_NAMES.indexOf(x.db.n) >= 0 });
}
function e3FromFieldToGrave(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'sz' && g.turn === gameState.turn);
}
defineScript('魔術の呪文書', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && E3_MAGICIAN_NAMES.indexOf(h.db.n) >= 0); },
              label:'「ブラック・マジシャン」「ブラック・マジシャン・ガール」のみ' },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e3FromFieldToGrave(ctx)){
        ctx.reason = 'フィールドから墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(!e3MagicianOnField(ctx.player).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){ done([]); return; }
    API.selectCard('魔術の呪文書：装備するモンスター',
      e3MagicianOnField(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){ API.recoverLP(ctx.player, 1000); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, '魔術の呪文書');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return e3FromFieldToGrave(ctx); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:700 };
    }
  }
});

/* 7. ブレイン・ジャッカー — リバース：このカードは装備カード扱いとなり、
      相手フィールドのモンスターに装備する。装備したモンスターのコントロールを得る。
      相手のスタンバイフェイズ毎に、相手は500ライフポイント回復する */
function e3FoeMonsters(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz' });
}
defineScript('ブレイン・ジャッカー', {
  type:'monster', priority:1, forced:true, targets:true,
  activateFrom:['mz','sz'], timing:['flip','standby','free'],
  condition(ctx){
    if(ctx.zone === 'sz'){
      if(!ctx.card.equipTo){ ctx.reason = '装備していません'; return false; }
      if(!(gameState.phase === 'standby' && gameState.activePlayer === ctx.opponent)){
        ctx.reason = '相手のスタンバイフェイズに処理します'; return false; }
      return true;
    }
    if(!(ctx.event && ctx.event.card === ctx.card)){
      ctx.reason = 'リバースした時に発動します'; return false; }
    if(!e3FoeMonsters(ctx).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'sz'){ done([]); return; }
    API.selectCard('ブレイン・ジャッカー：装備する相手モンスター',
      e3FoeMonsters(ctx), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'sz'){ API.recoverLP(ctx.opponent, 500); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone !== 'mz' || !me || me.zone !== 'mz') return;
    ensureCardUid(gameState, r.card);
    const hostUid = r.card.uid;
    API.equipMonster(ctx.player, me, r, 'ブレイン・ジャッカー');
    const eq = locateCardAnyV4(ctx.card);
    if(eq && eq.zone === 'sz')
      API.setCardFlag(eq, 'e3HostUid', hostUid, 'ブレイン・ジャッカー');
    const host = findCardByUid(hostUid);
    if(host && host.zone === 'mz'){
      API.changeControl(host, ctx.player, 'ブレイン・ジャッカー', null, eq || me);
      /* このカードが場を離れたらコントロールは元に戻る。 */
      const back = findCardByUid(hostUid);
      const src = locateCardAnyV4(ctx.card);
      if(back && src) API.linkControlReturn(back, src, { onFaceDown:true });
    }
  },
  afterResolve(){},
  passive:{
    onFlip(ctx){
      return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
          && e3FoeMonsters(ctx).length > 0; },
    onStandbyPhase(ctx){
      return ctx.zone === 'sz' && !!ctx.card.equipTo
          && gameState.activePlayer === ctx.opponent; }
  }
});
