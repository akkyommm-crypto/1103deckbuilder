/* Auto cycle 14 — 19枚。engine 変更なし。
     IVA ライフコスト／回復
     IVB 発動無効（カウンター罠・召喚無効）
     IVC 起動効果による破壊
     IVD 非公開情報の確認（相手には見せない）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 空きモンスターゾーンがあるか */
function c3MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
/* 自分フィールドの表側表示モンスターを種族で拾う */
function c3OwnRace(p, race){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === race });
}
/* 相手が発動した魔法／罠か（98_negation_recovery の v13OpponentActivated と同じ判定） */
function c3FoeActivated(ctx, kind){
  const e = ctx.event;
  if(!e || e.player !== ctx.opponent) return false;
  if(kind === 'spell') return API.isSpellActivation(e);
  if(kind === 'trap')  return API.isTrapActivation(e);
  return false;
}
/* 発動を無効にしたチェーンリンクの発動元カード */
function c3ChainSource(evt){
  const uid = evt && evt.uid;
  if(uid == null) return null;
  return findCardByUid(uid);
}
/* このカードがフィールドを離れる直前に、装備していたモンスターを覚えておく用 */
function c3EquipHost(card){
  const uid = card && card.c3EquipHost;
  return (uid == null) ? null : findCardByUid(uid);
}

/* ===================== A. ライフコスト／回復 ===================== */

/* 1. サイコ・ヘルストランサー — 1ターンに1度、墓地のサイキック族1体を除外して1200回復 */
defineScript('サイコ・ヘルストランサー', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x => x.db.k === 'm' && x.db.ra === 'サイキック').length){
      ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('サイコ・ヘルストランサー：除外するサイキック族',
      API.pileCards(ctx.player, 'grave', x => x.db.k === 'm' && x.db.ra === 'サイキック'),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    API.banish(r, 'サイコ・ヘルストランサー');
    API.recoverLP(ctx.player, 1200);
  },
  afterResolve(){}
});

/* 2. ハイドロ・ジェネクス — 戦闘で相手モンスターを破壊し墓地へ送った時、
      破壊したモンスターの攻撃力分だけ回復する */
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('ハイドロ・ジェネクス', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    if(!o){ ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'grave'){ ctx.reason = '破壊したモンスターが墓地にいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    if(o) API.recoverLP(ctx.player, Math.max(0, dbOf(o).atk || 0));
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    const h = o && locateCardAnyV4(o);
    return !!(h && h.zone === 'grave'); } }
});

/* 3. ホーリー・ジェラル — 「天空の聖域」がフィールドに存在する場合、
      戦闘破壊以外の方法で墓地へ送られた時、1000ライフポイント回復する */
function c3SanctuaryOnField(){
  return API.fieldCards({ filter:x => x.card.face === 'up' && dbOf(x.card).n === '天空の聖域' }).length > 0;
}
function c3GeralToGrave(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.from === 'mz' && g.turn === gameState.turn)) return false;
  /* 「戦闘によって破壊される以外の方法」— v30 の破壊記録で戦闘破壊を除外する */
  const rec = c1DestroyRecord(ctx.card);
  return !(rec && rec.battle);
}
defineScript('ホーリー・ジェラル', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!c3SanctuaryOnField()){ ctx.reason = 'フィールドに「天空の聖域」が必要です'; return false; }
    if(!c3GeralToGrave(ctx)){ ctx.reason = '戦闘破壊以外で墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.recoverLP(ctx.player, 1000); },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return c3SanctuaryOnField() && c3GeralToGrave(ctx); },
    onDestroy(ctx){ return c3SanctuaryOnField() && c3GeralToGrave(ctx); }
  }
});

/* 4. マスター・ジーグ — 1000払い、自分の表側サイキック族の数だけ相手モンスターを破壊（1ターンに1度） */
defineScript('マスター・ジーグ', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(API.me(ctx).lp <= 1000){ ctx.reason = '1000ライフポイントを払えません'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '破壊する相手モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  resolve(ctx){
    const n = c3OwnRace(ctx.player, 'サイキック').length;
    if(n <= 0) return;
    const foes = API.fieldCards({ player:ctx.opponent, zone:'mz' }).map(x => x.card).slice(0, n);
    foes.forEach(c => {
      const h = locateCardAnyV4(c);
      if(h && h.zone === 'mz') API.destroy(h, 'マスター・ジーグ', ctx.player);
    });
  },
  afterResolve(){}
});

/* 5. 白衣の天使 — 自分がダメージを受けた時に発動。1000回復し、
      墓地の「白衣の天使」の数×500をさらに回復する */
function c3TookDamage(ctx){
  const e = ctx.event || {};
  if(Number(e.delta) < 0 && e.player === ctx.player) return true;
  /* 戦闘ダメージ経路 */
  return e.player === ctx.player && Number(e.amount) > 0;
}
defineScript('白衣の天使', {
  type:'trap', priority:2,
  condition(ctx){
    if(!c3TookDamage(ctx)){ ctx.reason = '自分がダメージを受けた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const extra = API.pileCards(ctx.player, 'grave', x => x.db.n === '白衣の天使').length;
    API.recoverLP(ctx.player, 1000 + extra * 500);
  },
  afterResolve(){},
  passive:{
    onLPChange(ctx){ return ctx.zone === 'sz' && c3TookDamage(ctx); },
    onBattleDamage(ctx){ return ctx.zone === 'sz' && c3TookDamage(ctx); }
  }
});

/* 6. サイコ・ウォールド — 800払い、自分の表側サイキック族1体は
      1度のバトルフェイズ中に2回攻撃できる。発動ターンこのカードは攻撃できない */
defineScript('サイコ・ウォールド', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(API.me(ctx).lp <= 800){ ctx.reason = '800ライフポイントを払えません'; return false; }
    if(!c3OwnRace(ctx.player, 'サイキック').length){
      ctx.reason = '自分フィールドにサイキック族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 800); done(true); },
  selectTargets(ctx, done){
    API.selectCard('サイコ・ウォールド：2回攻撃するサイキック族',
      c3OwnRace(ctx.player, 'サイキック'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.grantAdditionalAttack(r, 1, 'サイコ・ウォールド');
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.setCardFlag(me, 'c3WalledNoAttackTurn', gameState.turn, 'サイコ・ウォールド');
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotAttack(card, self){
      return card === self && Number(card.c3WalledNoAttackTurn || -1) === gameState.turn;
    }
  }
});

/* 召喚しようとしているモンスターの DB。pendingSummon は uid か name を持つ。 */
function c3PendingDb(pending){
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

/* ===================== B. 発動無効 ===================== */

/* 7. ゴブリンのその場しのぎ — 500払い、魔法カードの発動を無効にし持ち主の手札に戻す */
defineScript('ゴブリンのその場しのぎ', {
  type:'trap', priority:3,
  condition(ctx){
    if(!c3FoeActivated(ctx, 'spell')){ ctx.reason = '相手が魔法カードを発動した時に発動します'; return false; }
    if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', 'ゴブリンのその場しのぎ', false);
    const h = c3ChainSource(ctx.event);
    if(h && (h.zone === 'sz' || h.zone === 'hand')) API.returnToHand(h, 'ゴブリンのその場しのぎ');
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && c3FoeActivated(ctx, 'spell') && API.me(ctx).lp > 500; } }
});

/* 8. 誤作動 — 500払い、罠カードの発動を無効にし、そのカードを元に戻す */
defineScript('誤作動', {
  type:'trap', priority:3,
  condition(ctx){
    if(!c3FoeActivated(ctx, 'trap')){ ctx.reason = '相手が罠カードを発動した時に発動します'; return false; }
    if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', '誤作動', false);
    /* 「元に戻す」＝ セットされた状態に戻す */
    const h = c3ChainSource(ctx.event);
    if(h && h.zone === 'sz') API.flip(h, 'down', '誤作動');
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && c3FoeActivated(ctx, 'trap') && API.me(ctx).lp > 500; } }
});

/* 9. 混沌の落とし穴 — 2000払い、光属性または闇属性モンスターの
      召喚・反転召喚・特殊召喚を無効にしゲームから除外する */
defineScript('混沌の落とし穴', {
  type:'trap', priority:2,
  /* summonNegate の契約は summonNegatorsV2（30_processor_chain_battle.js:1331）が定める。
     {specialOnly, kinds, condition(pending, card, db)} を engine が読む。 */
  summonNegate:{
    condition(pending){
      const d = c3PendingDb(pending);
      return !!(d && d.k === 'm' && (d.at === '光' || d.at === '闇'));
    }
  },
  condition(ctx){
    const pend = gameState.pendingSummon;
    if(!pend){ ctx.reason = 'モンスターの召喚に対して発動します'; return false; }
    const d = c3PendingDb(pend);
    if(!(d && d.k === 'm' && (d.at === '光' || d.at === '闇'))){
      ctx.reason = '光属性または闇属性モンスターの召喚に対して発動します'; return false; }
    if(API.me(ctx).lp <= 2000){ ctx.reason = '2000ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 2000); done(true); },
  resolve(ctx){
    const pend = gameState.pendingSummon;
    const uid = pend && pend.uid;
    summonNegatePendingV2('混沌の落とし穴');
    const h = (uid != null) ? findCardByUid(uid) : null;
    if(h && h.zone !== 'banish') API.banish(h, '混沌の落とし穴');
  },
  afterResolve(){}
});

/* ===================== C. 起動効果による破壊 ===================== */

/* 10. A・ジェネクス・ドゥルダーク — 1ターンに1度、このカードと同じ属性の
       相手の表側攻撃表示モンスター1体を破壊する。発動ターンこのカードは攻撃できない */
function c3SameAttrFoeAtk(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me) return [];
  const at = dbOf(me.card).at;
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'up' && x.card.pos === 'atk' && x.db.at === at });
}
defineScript('A・ジェネクス・ドゥルダーク', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c3SameAttrFoeAtk(ctx).length){
      ctx.reason = '同じ属性の相手の表側攻撃表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('A・ジェネクス・ドゥルダーク：破壊するモンスター', c3SameAttrFoeAtk(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.destroy(r, 'A・ジェネクス・ドゥルダーク', ctx.player);
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.setCardFlag(me, 'c3DulldarkNoAttackTurn', gameState.turn, 'A・ジェネクス・ドゥルダーク');
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotAttack(card, self){
      return card === self && Number(card.c3DulldarkNoAttackTurn || -1) === gameState.turn;
    }
  }
});

/* 11. エアジャチ — 1ターンに1度、手札から魚族・海竜族・水族1体を除外して
       相手の表側表示カード1枚を破壊する。その後このカードを
       次の自分のスタンバイフェイズ時までゲームから除外する */
API.registerScheduleHandler('c3.airjachi', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'banish' && c3MzOpen(p))
    API.specialSummon(p, 'banish', h.index, 'atk', 'エアジャチ', h.p);
});
function c3AirjachiCost(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm'
    && (x.db.ra === '魚' || x.db.ra === '海竜' || x.db.ra === '水'));
}
function c3FoeFaceUpCards(ctx){
  return API.fieldCards({ player:ctx.opponent, filter:x => x.card.face === 'up' });
}
defineScript('エアジャチ', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c3AirjachiCost(ctx.player).length){
      ctx.reason = '手札に魚族・海竜族・水族モンスターがいません'; return false; }
    if(!c3FoeFaceUpCards(ctx).length){
      ctx.reason = '破壊する相手の表側表示カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('エアジャチ：除外する手札', c3AirjachiCost(ctx.player), a =>
      API.selectCard('エアジャチ：破壊する相手のカード', c3FoeFaceUpCards(ctx), b => done([a, b])));
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    if(ts.length < 2) return;
    const a = resolveTarget(ts[0]);
    if(!a || a.zone !== 'hand') return;
    const bCard = resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.banish(a, 'エアジャチ');
    const b = bCard && locateCardAnyV4(bCard);
    if(b && (b.zone === 'mz' || b.zone === 'sz' || b.zone === 'field'))
      API.destroy(b, 'エアジャチ', ctx.player);
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    const uid = me.card.uid;
    API.banish(me, 'エアジャチ');
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'c3.airjachi',
                   args:{ uid:uid, player:ctx.player }, source:{ card:ctx.card }, note:'エアジャチ' });
  },
  afterResolve(){}
});

/* 12. パワー・ブレイカー — 相手モンスターの攻撃、または相手の効果によって
       破壊され墓地へ送られた時、相手の表側表示の魔法・罠1枚を破壊する。
       攻撃した場合、ダメージステップ終了時に守備表示になる */
function c3BreakerKilledByFoe(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
  const rec = c1DestroyRecord(ctx.card);
  if(!rec) return false;
  /* 戦闘破壊なら相手の攻撃による破壊、効果破壊なら byPlayer が相手 */
  if(rec.battle) return true;
  return rec.byPlayer === (ctx.player === 0 ? 1 : 0);
}
function c3FoeFaceUpST(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'sz', filter:x => x.card.face === 'up' });
}
defineScript('パワー・ブレイカー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave','mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz' && gameState.phase === 'battle'){
      const bp = gameState.battlePhaseV6;
      const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
      if(list.some(a => a && a.attackerUid === me.card.uid) && me.card.pos !== 'def') return true;
    }
    if(!c3BreakerKilledByFoe(ctx)){
      ctx.reason = '相手の攻撃または相手の効果で破壊された場合に発動します'; return false; }
    if(!c3FoeFaceUpST(ctx).length){
      ctx.reason = '破壊する相手の表側表示の魔法・罠がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c3FoeFaceUpST(ctx);
    if(!q.length){ done([]); return; }
    API.selectCard('パワー・ブレイカー：破壊する魔法・罠', q, t => done([t]));
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz'){
      API.changePosition(me, 'def', 'パワー・ブレイカー');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'sz') API.destroy(r, 'パワー・ブレイカー', ctx.player);
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return c3BreakerKilledByFoe(ctx) && c3FoeFaceUpST(ctx).length > 0; },
    onDestroy(ctx){ return c3BreakerKilledByFoe(ctx) && c3FoeFaceUpST(ctx).length > 0; },
    onBattlePhaseEnd(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz' || me.card.pos === 'def') return false;
      const bp = gameState.battlePhaseV6;
      const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
      return list.some(a => a && a.attackerUid === me.card.uid); }
  }
});

/* 13. 放浪の勇者 フリード — 1ターンに1度、墓地の光属性2体を除外して
       このカードの攻撃力より高い攻撃力を持つモンスター1体を破壊する */
function c3LightGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === '光');
}
function c3HigherAtk(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me) return [];
  const mine = curATK(me.card);
  return API.fieldCards({ zone:'mz',
    filter:x => x.card.face === 'up' && curATK(x.card) > mine });
}
defineScript('放浪の勇者 フリード', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(c3LightGrave(ctx.player).length < 2){ ctx.reason = '墓地に光属性モンスターが2体必要です'; return false; }
    if(!c3HigherAtk(ctx).length){ ctx.reason = 'このカードより攻撃力の高いモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c3LightGrave(ctx.player);
    API.selectCard('放浪の勇者 フリード：除外する光属性（1体目）', q, a => {
      const rest = c3LightGrave(ctx.player)
        .filter(x => !(x.p === a.p && x.zone === a.zone && x.index === a.index));
      API.selectCard('放浪の勇者 フリード：除外する光属性（2体目）', rest, b =>
        API.selectCard('放浪の勇者 フリード：破壊するモンスター', c3HigherAtk(ctx), c => done([a, b, c])));
    });
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    if(ts.length < 3) return;
    const cost = [resolveTarget(ts[0]), resolveTarget(ts[1])].filter(r => r && r.zone === 'grave');
    if(cost.length < 2) return;
    const victim = resolveTarget(ts[2]) && resolveTarget(ts[2]).card;
    cost.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, '放浪の勇者 フリード'));
    const v = victim && locateCardAnyV4(victim);
    if(v && v.zone === 'mz') API.destroy(v, '放浪の勇者 フリード', ctx.player);
  },
  afterResolve(){}
});

/* 14. ライトニングパニッシャー — チェーンが3つ以上積まれた場合に発動。
       相手フィールドのカード1枚を破壊する。
       同一チェーン上に複数回同名カードの効果が発動している場合は発動できない */
function c3ChainDepth(){ return Array.isArray(gameState.chain) ? gameState.chain.length : 0; }
function c3DuplicateNameInChain(){
  const seen = Object.create(null);
  const chain = Array.isArray(gameState.chain) ? gameState.chain : [];
  for(const link of chain){
    const n = link && (link.name || (link.cardId != null && CARD_DB[link.cardId] && CARD_DB[link.cardId].n));
    if(!n) continue;
    if(seen[n]) return true;
    seen[n] = true;
  }
  return false;
}
defineScript('ライトニングパニッシャー', {
  type:'monster', priority:2, targets:true, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(c3ChainDepth() < 3){ ctx.reason = 'チェーンが3つ以上積まれている必要があります'; return false; }
    if(c3DuplicateNameInChain()){
      ctx.reason = '同一チェーン上に同名カードの効果が複数回発動しています'; return false; }
    if(!API.fieldCards({ player:ctx.opponent }).length){
      ctx.reason = '破壊する相手のカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ライトニングパニッシャー：破壊する相手のカード',
      API.fieldCards({ player:ctx.opponent }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, 'ライトニングパニッシャー', ctx.player);
  },
  afterResolve(){}
});

/* 15. エヴォリューション・バースト — 自分フィールドに「サイバー・ドラゴン」が
       存在する場合に発動できる。相手フィールドのカード1枚を破壊する。
       発動するターン「サイバー・ドラゴン」は攻撃できない */
function c3CyberDragons(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.n === 'サイバー・ドラゴン' });
}
defineScript('エヴォリューション・バースト', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!c3CyberDragons(ctx.player).length){
      ctx.reason = '自分フィールドに「サイバー・ドラゴン」が必要です'; return false; }
    if(!API.fieldCards({ player:ctx.opponent }).length){
      ctx.reason = '破壊する相手のカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('エヴォリューション・バースト：破壊する相手のカード',
      API.fieldCards({ player:ctx.opponent }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, 'エヴォリューション・バースト', ctx.player);
    /* このターン「サイバー・ドラゴン」は攻撃できない */
    API.setFlag(ctx.player, 'c3EvoBurstTurn', gameState.turn, true);
  },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotAttack(card, self){
      if(dbOf(card).n !== 'サイバー・ドラゴン') return false;
      const h = locateCard(card);
      if(!h) return false;
      const f = gameState.players[h.p] && gameState.players[h.p].temporaryFlags;
      return !!(f && Number(f.c3EvoBurstTurn) === gameState.turn);
    }
  }
});

/* 16. ジェノサイド・ウォー — メインフェイズ1でのみ発動できる。
       このターン戦闘によってダメージ計算をしたモンスターは、エンドステップ時に全て破壊される */
/* このターン戦闘を行ったモンスターの uid（battlePhaseV6.attacks は読み取り専用の履歴） */
function c3BattledUids(){
  const bp = gameState.battlePhaseV6;
  const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
  const out = [];
  list.forEach(a => {
    if(!a) return;
    if(a.attackerUid != null && out.indexOf(a.attackerUid) < 0) out.push(a.attackerUid);
    if(a.defenderUid != null && out.indexOf(a.defenderUid) < 0) out.push(a.defenderUid);
  });
  return out;
}
/* 対象は「予約した時点」ではなく「エンドフェイズに発火した時点」で確定する。
   発動はメインフェイズ1で、戦闘はその後に起きるため。 */
API.registerScheduleHandler('c3.genocideWar', (entry) => {
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  c3BattledUids().forEach(u => {
    const h = findCardByUid(u);
    if(h && h.zone === 'mz') API.destroy(h, 'ジェノサイド・ウォー', p);
  });
});
defineScript('ジェノサイド・ウォー', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(gameState.phase !== 'main1'){ ctx.reason = 'メインフェイズ1でのみ発動できます'; return false; }
    return true;
  },
  resolve(ctx){
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c3.genocideWar',
                   args:{ player:ctx.player }, source:{ card:ctx.card }, note:'ジェノサイド・ウォー' });
  },
  afterResolve(){}
});

/* 17. 早すぎた埋葬 — 800払い、墓地のモンスター1体を表側攻撃表示で特殊召喚し、
       このカードを装備する。このカードが破壊された時、装備モンスターを破壊する */
defineScript('早すぎた埋葬', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  equipSpec:{ canEquip(){ return true; } },
  condition(ctx){
    if(API.me(ctx).lp <= 800){ ctx.reason = '800ライフポイントを払えません'; return false; }
    if(!c3MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x => x.db.k === 'm').length){
      ctx.reason = '墓地にモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 800); done(true); },
  selectTargets(ctx, done){
    API.selectCard('早すぎた埋葬：特殊召喚するモンスター',
      API.pileCards(ctx.player, 'grave', x => x.db.k === 'm'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c3MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '早すぎた埋葬', r.p);
    const now = findCardByUid(uid);
    const me = locateCardAnyV4(ctx.card);
    if(now && now.zone === 'mz' && me){
      API.equipSpell(me, now, '早すぎた埋葬');
      const eq = locateCardAnyV4(ctx.card);
      if(eq) API.setCardFlag(eq, 'c3EquipHost', uid, '早すぎた埋葬');
      /* このカードが離れたら装備モンスターを破壊する */
      API.linkOnLeave(now, eq || me, 'destroy', '早すぎた埋葬');
    }
  },
  afterResolve(){}
});

/* ===================== D. 非公開情報の確認 ===================== */

/* 18. 千里眼 — 1ターンに1度、自分のスタンバイフェイズに100払い、
       相手デッキの一番上を確認して元に戻す。相手はそのカードを確認できない */
API.registerChoiceHandler('c3.senrigan', () => { /* 確認するだけ。盤面は変えない。 */ });
defineScript('千里眼', {
  type:'spell', priority:1, countLimit:1, activateFrom:['sz'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(gameState.phase !== 'standby' || gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    if(API.me(ctx).lp <= 100){ ctx.reason = '100ライフポイントを払えません'; return false; }
    if(!gameState.players[ctx.opponent].deck.length){
      ctx.reason = '相手のデッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 100); done(true); },
  resolve(ctx){
    const top = gameState.players[ctx.opponent].deck[0];
    if(!top) return;
    /* 確認するのは発動プレイヤーだけ。相手には内容を渡さない。 */
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'千里眼：相手デッキの一番上は「' + cardName(top) + '」',
      candidates:[{ key:'ok', label:'確認した（そのまま戻す）', value:'ok' }],
      resume:{ handler:'c3.senrigan', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up'
      && gameState.activePlayer === ctx.player && API.me(ctx).lp > 100
      && gameState.players[ctx.opponent].deck.length > 0; } }
});

/* 19. 紅蓮の指名者 — 2000払い、手札を全て相手に見せて発動。
       相手の手札を確認してカード1枚を選択し、
       次の相手のエンドフェイズ時まで、そのカードをゲームから除外する */
API.registerScheduleHandler('c3.gurenReturn', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'banish') API.returnToHand(h, '紅蓮の指名者');
});
API.registerChoiceHandler('c3.guren', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  if(!picked) return;
  const r = resolveTarget(picked);
  if(!r || r.zone !== 'hand') return;
  ensureCardUid(gameState, r.card);
  const uid = r.card.uid;
  API.banish(r, '紅蓮の指名者');
  API.schedule({ at:'endPhase', turns:(gameState.activePlayer === p ? 1 : 0),
                 player:p, handler:'c3.gurenReturn',
                 args:{ uid:uid }, note:'紅蓮の指名者' });
});
defineScript('紅蓮の指名者', {
  type:'trap', priority:2,
  condition(ctx){
    if(API.me(ctx).lp <= 2000){ ctx.reason = '2000ライフポイントを払えません'; return false; }
    if(!gameState.players[ctx.opponent].hand.length){
      ctx.reason = '相手の手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 2000); done(true); },
  resolve(ctx){
    /* 自分の手札は相手に見せる（公開情報になる）。相手の手札はこちらだけが確認する。 */
    API.setFlag(ctx.player, 'c3GurenRevealTurn', gameState.turn, true);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'紅蓮の指名者：相手の手札から1枚を選択',
      candidates: API.pileCards(ctx.opponent, 'hand', () => true),
      resume:{ handler:'c3.guren', args:{ player:ctx.player } }
    });
  },
  afterResolve(){}
});
