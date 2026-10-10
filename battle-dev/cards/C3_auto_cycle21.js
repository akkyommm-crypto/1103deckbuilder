/* Auto cycle 21 — 11枚。engine 変更なし。
     XA 召喚の無効（カウンター罠）
     XB 召喚・特殊召喚成功トリガー
     XC 期限付きの全体制限
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d0MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d0FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* 召喚しようとしているモンスターの DB */
function d0PendingDb(pending){
  if(!pending) return null;
  if(pending.uid != null){
    const h = findCardByUid(pending.uid);
    if(h) return dbOf(h.card);
  }
  if(pending.name != null && typeof findCardIndex === 'function'){
    const i = findCardIndex(pending.name);
    if(i >= 0) return CARD_DB[i];
  }
  return null;
}
/* このカードが召喚・特殊召喚に成功したイベントか */
function d0SelfSummoned(ctx){
  const e = ctx.event || {};
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(e.uid != null && me.card.uid === e.uid) return true;
  return b2SummonedCards(e).indexOf(ctx.card) >= 0;
}

/* ===================== A. 召喚の無効（カウンター罠） ===================== */

/* 1. 昇天の角笛 — 自分のモンスター1体をリリースして発動。
      モンスターの召喚・反転召喚・特殊召喚を無効にし破壊する */
defineScript('昇天の角笛', {
  type:'trap', priority:3, targets:true,
  summonNegate:{ condition(){ return true; } },
  condition(ctx){
    if(!gameState.pendingSummon){ ctx.reason = 'モンスターの召喚に対して発動します'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){
      ctx.reason = 'リリースする自分のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('昇天の角笛：リリースするモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, '昇天の角笛'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const pend = gameState.pendingSummon;
    const uid = pend && pend.uid;
    summonNegatePendingV2('昇天の角笛');
    const h = (uid != null) ? findCardByUid(uid) : null;
    if(h && h.zone !== 'grave') API.destroy(h, '昇天の角笛', ctx.player);
  },
  afterResolve(){}
});

/* 2. 方舟の選別 — 1000ライフを払って発動。フィールドに同じ種族のモンスターが
      存在するモンスターの召喚・反転召喚・特殊召喚を無効にし、そのモンスターを破壊する */
function d0SameRaceOnField(pending){
  const d = d0PendingDb(pending);
  if(!d || d.k !== 'm' || !d.ra) return false;
  const uid = pending && pending.uid;
  return API.fieldCards({ zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === d.ra
             && !(uid != null && x.card.uid === uid) }).length > 0;
}
defineScript('方舟の選別', {
  type:'trap', priority:3,
  summonNegate:{ condition(pending){ return d0SameRaceOnField(pending); } },
  condition(ctx){
    const pend = gameState.pendingSummon;
    if(!pend){ ctx.reason = 'モンスターの召喚に対して発動します'; return false; }
    if(!d0SameRaceOnField(pend)){
      ctx.reason = 'フィールドに同じ種族のモンスターが存在する必要があります'; return false; }
    if(API.me(ctx).lp <= 1000){ ctx.reason = '1000ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  resolve(ctx){
    const pend = gameState.pendingSummon;
    const uid = pend && pend.uid;
    summonNegatePendingV2('方舟の選別');
    const h = (uid != null) ? findCardByUid(uid) : null;
    if(h && h.zone !== 'grave') API.destroy(h, '方舟の選別', ctx.player);
  },
  afterResolve(){}
});

/* 3. アーマーブレイク — 装備魔法カードの発動を無効にし、それを破壊する */
function d0FoeEquipActivated(ctx){
  const e = ctx.event;
  if(!e || e.player !== ctx.opponent) return false;
  if(e.kind !== 'spell') return false;
  if(e.cardId == null) return false;
  const db = CARD_DB[e.cardId];
  return !!(db && db.sub === '装備');
}
defineScript('アーマーブレイク', {
  type:'trap', priority:3,
  condition(ctx){
    if(!d0FoeEquipActivated(ctx)){ ctx.reason = '装備魔法カードが発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'アーマーブレイク', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && d0FoeEquipActivated(ctx); } }
});

/* 4. オーバーウェルム — 自分フィールドにレベル7以上のアドバンス召喚したモンスターが
      表側表示で存在する場合に発動。罠カードまたは効果モンスターの効果の発動を無効にし破壊する */
function d0HasAdvancedLv7(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card.face === 'up' && Number(x.db.lv || 0) >= 7
             && (x.card.summonProvenance && x.card.summonProvenance.summonType === 'tribute'
                 || Number(x.card.tributeCount || 0) > 0) }).length > 0;
}
function d0FoeTrapOrMonsterEffect(ctx){
  const e = ctx.event;
  if(!e || e.player !== ctx.opponent) return false;
  return e.kind === 'trap' || e.kind === 'monster';
}
defineScript('オーバーウェルム', {
  type:'trap', priority:3,
  condition(ctx){
    if(!d0FoeTrapOrMonsterEffect(ctx)){
      ctx.reason = '罠カードまたは効果モンスターの効果が発動した時に発動します'; return false; }
    if(!d0HasAdvancedLv7(ctx)){
      ctx.reason = '自分フィールドにレベル7以上のアドバンス召喚したモンスターが必要です'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'オーバーウェルム', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && d0FoeTrapOrMonsterEffect(ctx) && d0HasAdvancedLv7(ctx); } }
});

/* ===================== B. 召喚・特殊召喚成功トリガー ===================== */

/* 5. ホワイト・ホーンズ・ドラゴン — 召喚・特殊召喚に成功した場合、
      相手の墓地の魔法カードを5枚まで対象に発動。除外し、その数×300攻撃力アップ */
API.registerChoiceHandler('d0.whiteHorns', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const uid = args && args.uid;
  const picked = (answer && answer.cards ? answer.cards : []);
  const rs = picked.map(x => resolveTarget(x)).filter(r => r && r.zone === 'grave');
  if(!rs.length) return;
  rs.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, 'ホワイト・ホーンズ・ドラゴン'));
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz')
    API.modAtk(h, rs.length * 300, 0, 'permanent', 'ホワイト・ホーンズ・ドラゴン');
});
function d0FoeSpellGrave(ctx){
  return API.pileCards(ctx.opponent, 'grave', x => x.db.k === 's');
}
defineScript('ホワイト・ホーンズ・ドラゴン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!d0SelfSummoned(ctx)){ ctx.reason = '召喚・特殊召喚に成功した場合に発動します'; return false; }
    if(!d0FoeSpellGrave(ctx).length){ ctx.reason = '相手の墓地に魔法カードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    const max = Math.min(5, d0FoeSpellGrave(ctx).length);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:max,
      title:'ホワイト・ホーンズ・ドラゴン：除外する相手の墓地の魔法（最大' + max + '枚）',
      candidates: d0FoeSpellGrave(ctx),
      resume:{ handler:'d0.whiteHorns', args:{ player:ctx.player, uid:me.card.uid } }
    });
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return d0SelfSummoned(ctx) && d0FoeSpellGrave(ctx).length > 0; },
    onSpecialSummon(ctx){ return d0SelfSummoned(ctx) && d0FoeSpellGrave(ctx).length > 0; }
  }
});

/* 6. バーニング・スカルヘッド — 手札から特殊召喚に成功した時、相手ライフに1000ダメージ。
      また、表側表示のこのカードを除外して、除外されている「スカル・フレイム」1体を墓地に戻す */
function d0SkullHeadFromHand(ctx){
  if(!d0SelfSummoned(ctx)) return false;
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.card.specialSummonedFrom === 'hand');
}
function d0BanishedSkullFlame(p){
  return API.pileCards(p, 'banish', x => x.db.n === 'スカル・フレイム');
}
defineScript('バーニング・スカルヘッド', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(d0SkullHeadFromHand(ctx)) return true;
    /* 起動効果：自身を除外して「スカル・フレイム」を墓地に戻す */
    if(!d0FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d0BanishedSkullFlame(ctx.player).length){
      ctx.reason = '除外されている「スカル・フレイム」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(d0SkullHeadFromHand(ctx)){ done([]); return; }
    API.selectCard('バーニング・スカルヘッド：墓地に戻す「スカル・フレイム」',
      d0BanishedSkullFlame(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(d0SkullHeadFromHand(ctx)){ API.damageLP(ctx.opponent, 1000); return; }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    API.banish(me, 'バーニング・スカルヘッド');
    const now = r && locateCardAnyV4(r.card);
    if(now && now.zone === 'banish') API.sendToGrave(now, 'バーニング・スカルヘッド');
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return d0SkullHeadFromHand(ctx); } }
});

/* 7. 光神機－閃空 — 直接攻撃で戦闘ダメージを与えた時1枚ドロー。
      召喚・反転召喚・特殊召喚したターンのエンドフェイズ時に墓地へ送られる */
function d0SenkuDrew(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0) || e.player !== ctx.opponent) return false;
  return e.attackerUid === me.card.uid && e.defenderUid == null;
}
function d0SenkuEndDue(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(gameState.phase !== 'end') return false;
  return Number(me.card.summonedTurn) === gameState.turn;
}
defineScript('光神機－閃空', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(d0SenkuDrew(ctx)){
      if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
      return true;
    }
    if(d0SenkuEndDue(ctx)) return true;
    ctx.reason = '直接攻撃で戦闘ダメージを与えた時、または召喚したターンのエンドフェイズに発動します';
    return false;
  },
  resolve(ctx){
    if(d0SenkuDrew(ctx)){ API.draw(ctx.player, 1); return; }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.sendToGrave(me, '光神機－閃空');
  },
  afterResolve(){},
  passive:{
    onDirectBattleDamage(ctx){ return d0SenkuDrew(ctx) && API.me(ctx).deck.length > 0; },
    onBattleDamage(ctx){ return d0SenkuDrew(ctx) && API.me(ctx).deck.length > 0; },
    onEndPhase(ctx){ return d0SenkuEndDue(ctx); }
  }
});

/* 8. XX－セイバー ガトムズ — 自分の「X－セイバー」1体をリリースして発動。
      相手の手札をランダムに1枚捨てる */
function d0XSabers(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && isSetCardV4(x.db, SETCODE.X_SABER) });
}
defineScript('XX－セイバー ガトムズ', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!d0FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d0XSabers(ctx.player).length){ ctx.reason = '自分フィールドに「X－セイバー」モンスターがいません'; return false; }
    if(!(gameState.players[ctx.opponent].hand || []).length){
      ctx.reason = '相手の手札がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('XX－セイバー ガトムズ：リリースする「X－セイバー」', d0XSabers(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, 'XX－セイバー ガトムズ'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const H = gameState.players[ctx.opponent].hand || [];
    if(!H.length) return;
    /* ランダムに選ぶので相手の非公開情報は覗かない */
    const i = (typeof duelRandomInt === 'function') ? duelRandomInt(H.length) : 0;
    API.discard(ctx.opponent, i, 'XX－セイバー ガトムズ', { byEffect:true, byPlayer:ctx.player });
  },
  afterResolve(){}
});

/* ===================== C. 期限付きの全体制限 ===================== */

/* 9. 光の護封陣 — 種族を1つ宣言して発動。宣言した種族のモンスターは
      召喚・反転召喚・特殊召喚されたターンに攻撃宣言できない */
const D0_RACES = ['戦士','魔法使い','天使','悪魔','アンデット','機械','水','炎','岩石',
                  '鳥獣','植物','昆虫','雷','ドラゴン','獣','獣戦士','恐竜','魚',
                  '海竜','爬虫類','サイキック','幻神獣'];
API.registerChoiceHandler('d0.holyBarrier', (answer, args) => {
  const uid = args && args.uid;
  const race = a4PickedMode(answer);
  if(uid == null || !race) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'sz') API.setCardFlag(h, 'd0HolyRace', String(race), '光の護封陣');
});
defineScript('光の護封陣', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'sz') return;
    ensureCardUid(gameState, me.card);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'光の護封陣：種族を1つ宣言',
      candidates: D0_RACES.map(r => ({ key:r, label:r, value:r })),
      resume:{ handler:'d0.holyBarrier', args:{ uid:me.card.uid } }
    });
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return false;
      const race = h.card.d0HolyRace;
      if(!race || dbOf(card).ra !== race) return false;
      return Number(card && card.summonedTurn) === gameState.turn;
    }
  }
});

/* 10. アヌビスの呪い — フィールドの表側表示の効果モンスターは全て守備表示になる。
       発動ターン、それらの元々の守備力は0になり、表示形式の変更ができない */
defineScript('アヌビスの呪い', {
  type:'trap', priority:2,
  condition(ctx){
    if(!API.fieldCards({ zone:'mz',
        filter:x => x.card.face === 'up' && (x.db.st || []).includes('効果') }).length){
      ctx.reason = 'フィールドに表側表示の効果モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    API.setFlag(ctx.player, 'd0AnubisTurn', gameState.turn, true);
    API.fieldCards({ zone:'mz',
      filter:x => x.card.face === 'up' && (x.db.st || []).includes('効果') })
      .map(x => x.card).forEach(c => {
        const h = locateCardAnyV4(c);
        if(!h || h.zone !== 'mz') return;
        API.changePosition(h, 'def', 'アヌビスの呪い');
        const now = locateCardAnyV4(c);
        if(now && now.zone === 'mz') API.setCardFlag(now, 'd0AnubisTurnCard', gameState.turn, 'アヌビスの呪い');
      });
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz','grave'],
    apply(card, self){
      if(Number(card && card.d0AnubisTurnCard || -1) !== gameState.turn) return null;
      if(card.face !== 'up') return null;
      /* 発動ターンだけ元々の守備力を0にする */
      return { setBaseDef:0 };
    },
    cannotChangePosition(card){
      return Number(card && card.d0AnubisTurnCard || -1) === gameState.turn;
    }
  }
});

/* 11. おくびょうかぜ — 次の相手ターンのエンドフェイズまで、
       フィールドにセットされた魔法・罠カードを破壊する事はできない */
defineScript('おくびょうかぜ', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(ctx){
    API.setFlag(ctx.player, 'd0TimidWindUntil', gameState.turn + 1, true);
  },
  afterResolve(){},
  continuous:{
    scope:'allCards', from:['sz','grave'],
    apply(){ return null; },
    protectV21:{
      key:'おくびょうかぜ', label:'おくびょうかぜ',
      /* セットされた（裏側の）魔法・罠だけを守る。戦闘・効果いずれの破壊も対象外にする */
      battle: (target, self) => d0TimidWindGuards(target, self),
      effect: (target, self) => d0TimidWindGuards(target, self)
    }
  }
});
function d0TimidWindGuards(target, self){
  const loc = locateCard(target), me = locateCardAnyV4(self);
  if(!loc || !me) return false;
  if(loc.zone !== 'sz' || target.face !== 'down') return false;
  const f = gameState.players[me.p] && gameState.players[me.p].temporaryFlags;
  const until = f ? Number(f.d0TimidWindUntil || 0) : 0;
  return until > 0 && gameState.turn <= until;
}
