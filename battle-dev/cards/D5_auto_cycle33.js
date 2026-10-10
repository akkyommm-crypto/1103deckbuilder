/* Auto cycle 33 — 9枚。engine 変更なし。
     XXIIA チェーンの何番目で発動したかで挙動が変わる
     XXIIB 手札に戻る装備カード
     XXIIC 手札に戻す・戻る事に反応する
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e2MyTurn(p){ return gameState.activePlayer === p; }
function e2MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e2MyTurn(p);
}
function e2FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* このカードがチェーンの何番目のリンクか（1始まり。見つからなければ 0） */
function e2MyChainLink(ctx){
  const ch = gameState.chain || [];
  const uid = ctx.card && ctx.card.uid;
  for(let i = 0; i < ch.length; i++){
    const l = ch[i];
    if(!l) continue;
    if(uid != null && l.uid === uid) return i + 1;
  }
  /* uid が載っていない場合は、いま一番上のリンクを自分とみなす */
  return ch.length;
}
/* 装備先（領域を問わず uid で引く） */
function e2HostUid(card){
  if(card && card.equipTo && card.equipTo.uid != null) return card.equipTo.uid;
  const k = Number(card && card.e2HostUid);
  return Number.isFinite(k) ? k : null;
}
function e2HostHandle(card){
  const uid = e2HostUid(card);
  return (uid != null) ? findCardByUid(uid) : null;
}
/* 装備カードを装備しつつ、装備先 uid を刻む */
function e2EquipAndMark(ctx, targetHandle, reason){
  const me = locateCardAnyV4(ctx.card);
  if(!targetHandle || targetHandle.zone !== 'mz' || !me || me.zone !== 'sz') return;
  ensureCardUid(gameState, targetHandle.card);
  const hostUid = targetHandle.card.uid;
  API.equipSpell(me, targetHandle, reason);
  const now = locateCardAnyV4(ctx.card);
  if(now && now.zone === 'sz') API.setCardFlag(now, 'e2HostUid', hostUid, reason);
}
/* 自分の墓地にあるこのカードを手札に戻す */
function e2SelfToHand(ctx, reason){
  const me = locateCardAnyV4(ctx.card);
  if(me && me.zone === 'grave') API.returnToHand(me, reason);
}

/* ===================== A. チェーンの位置で変わる ===================== */

/* 1. チェーン・ヒーリング — 自分は500ライフポイント回復する。
      チェーン2またはチェーン3で発動した場合、このカードをデッキに加えてシャッフルする。
      チェーン4以降に発動した場合、このカードを手札に戻す */
defineScript('チェーン・ヒーリング', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){
    API.recoverLP(ctx.player, 500);
    const n = e2MyChainLink(ctx);
    const me = locateCardAnyV4(ctx.card);
    if(!me) return;
    if(n >= 4){ API.returnToHand(me, 'チェーン・ヒーリング'); return; }
    if(n === 2 || n === 3){
      API.returnToDeck(me, false, 'チェーン・ヒーリング');
      API.shuffle(ctx.player);
    }
    /* チェーン1なら通常どおり墓地へ（afterResolve の既定に任せる） */
  },
  afterResolve(ctx){
    /* チェーン2以降で場を離れている場合は何もしない。 */
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'sz') API.sendToGrave(me, 'チェーン・ヒーリング');
  }
});

/* 2. チェーン・ブラスト — 相手ライフに500ポイントダメージを与える。
      チェーン2またはチェーン3で発動した場合、墓地へ送らずデッキに戻す。
      チェーン4以降に発動した場合、手札に戻す */
defineScript('チェーン・ブラスト', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){
    API.damageLP(ctx.opponent, 500);
    const n = e2MyChainLink(ctx);
    const me = locateCardAnyV4(ctx.card);
    if(!me) return;
    if(n >= 4){ API.returnToHand(me, 'チェーン・ブラスト'); return; }
    if(n === 2 || n === 3){
      API.returnToDeck(me, false, 'チェーン・ブラスト');
      API.shuffle(ctx.player);
    }
  },
  afterResolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'sz') API.sendToGrave(me, 'チェーン・ブラスト');
  }
});

/* ===================== B. 手札に戻る装備カード ===================== */

/* 3. 八尺勾玉 — スピリットモンスターにのみ装備可能。
      装備モンスターが戦闘で相手モンスターを破壊し墓地へ送った時、
      破壊したモンスターの元々の攻撃力分だけライフを回復する。
      装備モンスターが手札に戻る事によってこのカードが墓地へ送られた時、
      このカードを手札に戻す */
function e2IsSpirit(db){ return !!db && Array.isArray(db.st) && db.st.includes('スピリット'); }
function e2SpiritOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && e2IsSpirit(x.db) });
}
/* 装備先が手札に戻った事によって墓地へ送られたか */
function e2BackByHostBounce(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.from === 'sz' && g.turn === gameState.turn)) return false;
  const host = e2HostHandle(ctx.card);
  return !!(host && host.zone === 'hand');
}
defineScript('八尺勾玉', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','damageStep','free'],
  equipSpec:{ canEquip(h){ return e2IsSpirit(h && h.db); }, label:'スピリットモンスターのみ' },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e2BackByHostBounce(ctx)){
        ctx.reason = '装備モンスターが手札に戻った事で墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(ctx.card.equipTo){
      if(!b1EquippedKilled(ctx)){
        ctx.reason = '装備モンスターが戦闘で相手モンスターを破壊した時に発動します'; return false; }
      return true;
    }
    if(!e2SpiritOnField(ctx.player).length){
      ctx.reason = '装備できるスピリットモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave' || ctx.card.equipTo){ done([]); return; }
    API.selectCard('八尺勾玉：装備するスピリットモンスター',
      e2SpiritOnField(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){ e2SelfToHand(ctx, '八尺勾玉'); return; }
    if(ctx.card.equipTo){
      const victim = b1EquippedKilled(ctx);
      if(victim) API.recoverLP(ctx.player, Number(dbOf(victim).atk) || 0);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    e2EquipAndMark(ctx, r, '八尺勾玉');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      return ctx.zone === 'sz' && !!ctx.card.equipTo && !!b1EquippedKilled(ctx); },
    onSendToGrave(ctx){ return e2BackByHostBounce(ctx); }
  },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; }
  }
});

/* 4. サクリファイス・ソード — 闇属性モンスターのみ装備可能。
      装備モンスターの攻撃力は400ポイントアップする。
      装備モンスターが生け贄に捧げられる事によってこのカードが墓地に送られた場合、
      このカードを手札に戻す */
function e2BackByHostTribute(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.from === 'sz' && g.turn === gameState.turn)) return false;
  const host = e2HostHandle(ctx.card);
  if(!host || host.zone !== 'grave') return false;
  /* 生け贄（リリース）は「破壊ではない墓地送り」として記録される。 */
  const hg = host.card.graveInfo;
  return !!(hg && hg.from === 'mz' && hg.byDestroy === false && hg.turn === gameState.turn);
}
defineScript('サクリファイス・ソード', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.at === '闇'); }, label:'闇属性のみ' },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e2BackByHostTribute(ctx)){
        ctx.reason = '装備モンスターがリリースされた事で墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' && x.db.at === '闇' }).length){
      ctx.reason = '装備できる闇属性モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){ done([]); return; }
    API.selectCard('サクリファイス・ソード：装備する闇属性モンスター',
      API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.at === '闇' }), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){ e2SelfToHand(ctx, 'サクリファイス・ソード'); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    e2EquipAndMark(ctx, r, 'サクリファイス・ソード');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return e2BackByHostTribute(ctx); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:400 };
    }
  }
});

/* 5. 疫病ウィルス ブラックダスト — 装備モンスターは攻撃をする事ができない。
      その装備モンスターのコントローラーの2回目のエンドフェイズ時、装備モンスターを破壊する。
      この効果で装備モンスターを破壊した場合、このカードを持ち主の手札に戻す */
API.registerScheduleHandler('e2.blackDust', (args) => {
  const host = (args && args.hostUid != null) ? findCardByUid(args.hostUid) : null;
  const self = (args && args.selfUid != null) ? findCardByUid(args.selfUid) : null;
  if(host && host.zone === 'mz'){
    API.destroy(host, '疫病ウィルス ブラックダスト');
    const again = (args.selfUid != null) ? findCardByUid(args.selfUid) : null;
    if(again && (again.zone === 'sz' || again.zone === 'grave'))
      API.returnToHand(again, '疫病ウィルス ブラックダスト');
    return;
  }
  if(self && self.zone === 'sz') API.log('疫病ウィルス ブラックダスト：装備モンスターがいません');
});
defineScript('疫病ウィルス ブラックダスト', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.card.equipTo){ ctx.reason = '既に装備しています'; return false; }
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('疫病ウィルス ブラックダスト：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    e2EquipAndMark(ctx, r, '疫病ウィルス ブラックダスト');
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz') return;
    ensureCardUid(gameState, me.card);
    /* 「装備モンスターのコントローラーの2回目のエンドフェイズ」＝
       そのプレイヤーのエンドフェイズを2回数えた先。 */
    API.schedule({ at:'endPhase', ownTurn:true, player:r.p,
      handler:'e2.blackDust', source:ctx.card, note:'疫病ウィルス ブラックダスト',
      turns:2,
      args:{ hostUid:r.card.uid, selfUid:me.card.uid } });
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(card, self){
      return !!(self.equipTo && self.equipTo.uid === card.uid);
    }
  }
});

/* ===================== C. 手札に戻す・戻る事に反応する ===================== */

/* 6. ジェムエレファント — 自分のメインフェイズに、表側表示のこのカードを手札に戻せる。
      戦闘を行うダメージ計算時に1度だけ、手札から通常モンスター1体を墓地へ送って発動でき、
      このカードの守備力はそのダメージ計算時のみ1000ポイントアップする */
function e2NormalInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && treatedAsNormal(x.card));
}
function e2InBattle(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return false;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  return atk === ctx.card || def === ctx.card;
}
defineScript('ジェムエレファント', {
  type:'monster', priority:1, countLimit:1, targets:true,
  dsTiming:'calc', damageStepOnly:true,
  activateFrom:['mz'], timing:['mainPhase','damageStep'],
  condition(ctx){
    if(!e2FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e2InBattle(ctx)){
      if(!e2NormalInHand(ctx.player).length){
        ctx.reason = '手札に通常モンスターがいません'; return false; }
      return true;
    }
    if(!e2MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズ、または戦闘のダメージ計算時に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(!e2InBattle(ctx)){ done([]); return; }
    API.selectCard('ジェムエレファント（コスト）：墓地へ送る通常モンスター',
      e2NormalInHand(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    if(!e2InBattle(ctx)){ done(true); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'hand'){
      API.sendHandToGrave(ctx.player, r.index, 'ジェムエレファント（コスト）'); done(true);
    } else done(false);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(e2InBattle(ctx)){
      API.modAtk(me, 0, 1000, 'endBattlePhase', 'ジェムエレファント');
      return;
    }
    API.returnToHand(me, 'ジェムエレファント');
  },
  afterResolve(){}
});

/* 7. BF－激震のアブロオロス — 特殊召喚できない。
      1ターンに1度、メインフェイズ1にこのカードの攻撃力を1000ダウンし、
      相手の魔法＆罠ゾーンのカードを全て持ち主の手札に戻す事ができる。
      このカードと戦闘を行ったモンスターは、その戦闘で破壊されず
      ダメージ計算後に持ち主の手札に戻る */
function e2BattlePartner(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card) return b.defCard || null;
  if(b.defCard === ctx.card) return b.atkCard || null;
  return null;
}
defineScript('BF－激震のアブロオロス', {
  type:'monster', priority:1, countLimit:1, cannotSpecialSummon:true, forced:false,
  dsTiming:'after', activateFrom:['mz'], timing:['mainPhase','damageStep'],
  condition(ctx){
    if(!e2FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(e2BattlePartner(ctx)) return true;
    if(gameState.phase !== 'main1' || !e2MyTurn(ctx.player)){
      ctx.reason = 'メインフェイズ1に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'sz' }).length){
      ctx.reason = '相手の魔法＆罠ゾーンにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const partner = e2BattlePartner(ctx);
    if(partner){
      const h = locateCardAnyV4(partner);
      if(h && h.zone === 'mz') API.returnToHand(h, 'BF－激震のアブロオロス');
      return;
    }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.modAtk(me, -1000, 0, 'permanent', 'BF－激震のアブロオロス');
    API.fieldCards({ player:ctx.opponent, zone:'sz' }).slice().forEach(hh => {
      const now = locateCardAnyV4(hh.card);
      if(now && now.zone === 'sz') API.returnToHand(now, 'BF－激震のアブロオロス');
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return e2FaceUpMz(ctx) && !!e2BattlePartner(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'BF－激震のアブロオロス', label:'BF－激震のアブロオロス',
      /* 戦闘した相手モンスターを守る（このカード自身ではない）。 */
      battle:(target, self) => {
        const b = gameState.battle;
        if(!b || b.target === 'direct') return false;
        const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
        const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
        if(atk === self) return target === def;
        if(def === self) return target === atk;
        return false;
      },
      effect:false,
      scope:'allMonsters'
    }
  }
});

/* 8. トラップ・キャプチャー — 自分が罠カードを発動した時、手札を1枚捨ててチェーン発動する。
      チェーン発動した罠カードが墓地へ送られた時、そのカードを手札に戻す */
function e2MyTrapActivation(ctx){
  const e = ctx.event || {};
  if(e.kind !== 'trap') return false;
  if(e.player !== ctx.player) return false;
  if(e.uid != null && ctx.card && e.uid === ctx.card.uid) return false;
  return true;
}
function e2WatchedInGrave(ctx){
  const uid = Number(ctx.card && ctx.card.e2WatchUid);
  if(!Number.isFinite(uid)) return null;
  const h = findCardByUid(uid);
  return (h && h.zone === 'grave') ? h : null;
}
defineScript('トラップ・キャプチャー', {
  type:'trap', priority:3, activateFrom:['sz','grave'], timing:['chain','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e2WatchedInGrave(ctx)){
        ctx.reason = 'チェーン発動した罠カードが墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(!e2MyTrapActivation(ctx)){
      ctx.reason = '自分が罠カードを発動した時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.zone === 'grave'){ done(true); return; }
    const q = API.pileCards(ctx.player, 'hand');
    if(!q.length){ done(false); return; }
    API.selectCard('トラップ・キャプチャー（コスト）：捨てる手札', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'トラップ・キャプチャー（コスト）',
          { byEffect:true, byPlayer:ctx.player });
        done(true);
      } else done(false);
    });
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const h = e2WatchedInGrave(ctx);
      if(h) API.returnToHand(h, 'トラップ・キャプチャー');
      const me = locateCardAnyV4(ctx.card);
      if(me) API.setCardFlag(me, 'e2WatchUid', -1, 'トラップ・キャプチャー');
      return;
    }
    const e = ctx.event || {};
    const me = locateCardAnyV4(ctx.card);
    if(me && e.uid != null) API.setCardFlag(me, 'e2WatchUid', Number(e.uid), 'トラップ・キャプチャー');
  },
  afterResolve(){},
  passive:{
    onActivateSuccess(ctx){
      return ctx.zone === 'sz' && e2MyTrapActivation(ctx) && API.me(ctx).hand.length > 0; },
    onSendToGrave(ctx){ return ctx.zone === 'grave' && !!e2WatchedInGrave(ctx); }
  }
});

/* 9. スピリットの誘い — 自分のスタンバイフェイズ毎に500ライフポイントを払う。
      払わない場合はこのカードを破壊する。
      フィールドの表側スピリットモンスターが自分の手札に戻った時、
      相手フィールドのモンスター1体を相手が選択して持ち主の手札に戻す */
API.registerChoiceHandler('e2.spiritLure', (answer) => {
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(r && r.zone === 'mz') API.returnToHand(r, 'スピリットの誘い');
});
function e2SpiritReturned(ctx){
  const e = ctx.event || {};
  if(e.toZone !== 'hand') return false;
  const c = (typeof API.leavingCardOf === 'function') ? API.leavingCardOf(e) : null;
  const card = c ? (c.card || c) : null;
  if(!card || !e2IsSpirit(dbOf(card))) return false;
  const h = locateCardAnyV4(card);
  return !!(h && h.zone === 'hand' && h.p === ctx.player);
}
defineScript('スピリットの誘い', {
  type:'trap', priority:2, forced:false, activateFrom:['sz'],
  timing:['standby','free'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(gameState.phase === 'standby' && e2MyTurn(ctx.player)) return true;
    if(!e2SpiritReturned(ctx)){
      ctx.reason = 'スピリットモンスターが手札に戻った時に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    if(gameState.phase === 'standby' && e2MyTurn(ctx.player)){
      const me = locateCardAnyV4(ctx.card);
      if(API.me(ctx).lp > 500){ API.payCost(ctx.player, 500); return; }
      if(me && me.zone === 'sz') API.destroy(me, 'スピリットの誘い', ctx.player);
      return;
    }
    const q = API.fieldCards({ player:ctx.opponent, zone:'mz' });
    if(!q.length) return;
    /* 選ぶのは相手。相手に選択要求を出す。 */
    API.requestChoice({
      player: ctx.opponent, kind:'card', cancelable:false, min:1, max:1,
      title:'スピリットの誘い：手札に戻す自分のモンスターを選ぶ',
      candidates: q,
      resume:{ handler:'e2.spiritLure', args:{ player:ctx.opponent } }
    });
  },
  afterResolve(){},
  passive:{
    onStandbyPhase(ctx){
      return ctx.zone === 'sz' && ctx.card.face === 'up' && e2MyTurn(ctx.player); },
    onLeaveField(ctx){
      return ctx.zone === 'sz' && ctx.card.face === 'up' && e2SpiritReturned(ctx)
          && API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0; }
  }
});
