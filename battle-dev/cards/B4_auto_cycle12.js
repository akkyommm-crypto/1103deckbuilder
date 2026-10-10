/* Auto cycle 12 — 24枚。engine 変更なし。
     IIA 戦闘破壊をトリガーにする蘇生・回収・バーン
     IIB 「戦闘破壊」と「効果破壊」を v30 provenance で撃ち分ける
     IIC 自分モンスターの戦闘破壊に反応する魔法・罠
     IID 継続効果（貫通／戦闘ダメージ0／属性連動／破壊耐性）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* このカードの、今ターンのフィールドからの破壊記録（v30）。
   戦闘破壊と効果破壊を区別するために使う。 */
function c1DestroyRecord(card){
  if(!card) return null;
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  const uid = card.uid;
  if(uid == null) return null;
  for(let i = log.length - 1; i >= 0; i--){
    const x = log[i];
    if(x && x.uid === uid && x.turn === gameState.turn && x.from === 'mz') return x;
  }
  return null;
}
/* フィールドのこのカードが「戦闘以外で」破壊され墓地へ送られたか */
function c1EffectDestroyedGrave(ctx){
  if(ctx.zone !== 'grave') return false;
  /* S03-U145: the onDestroy event must be about this card (with several cards destroyed at once it fired once per card) */
  if(ctx.eventName === 'onDestroy' && typeof eventIsSelfS03 === 'function' && !eventIsSelfS03(ctx)) return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
  const rec = c1DestroyRecord(ctx.card);
  return !!rec && !rec.battle;
}
/* このカードを戦闘で破壊したモンスター（まだ場に居る場合のみ返す） */
function c1Destroyer(ctx){
  if(!a3SelfBattleDestroyed(ctx)) return null;
  const o = a3BattleOther(ctx);
  const h = o && locateCardAnyV4(o);
  return (h && h.zone === 'mz') ? o : null;
}
/* 自分の墓地のモンスターを条件で拾う */
function c1GraveMonsters(p, f){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && (!f || f(x.db, x.card)));
}
/* 「自分フィールドのモンスターがこのターン戦闘破壊されて墓地にいる」もの */
function c1OwnBattleDestroyed(p){
  return a7DestroyedThisTurn(p, { battleOnly:true, owner:p });
}
/* 相手フィールドのモンスターがこのターン戦闘破壊されて墓地にいるか */
function c1FoeBattleDestroyed(p){
  return a7DestroyedThisTurn(p, { battleOnly:true, owner:(p === 0 ? 1 : 0) });
}
/* 空いているモンスターゾーンがあるか */
function c1MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
/* フィールドに表側の指定属性モンスターがいるか */
function c1ElementOnField(attr){
  return API.fieldCards({ zone:'mz', filter:x => {
    if(!x || !x.card || x.card.face !== 'up') return false;
    const at = (typeof currentAttributeV17 === 'function') ? currentAttributeV17(x.card) : ((x.db || dbOf(x.card)).at || '');
    return at === attr;
  }}).length > 0;
}

/* ===================== A. 戦闘破壊され墓地へ送られた時 ===================== */

/* 1. ロードポイズン — 墓地の「ロードポイズン」以外の植物族1体を特殊召喚 */
defineScript('ロードポイズン', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    if(!c1GraveMonsters(ctx.player, d => d.ra === '植物' && d.n !== 'ロードポイズン').length){
      ctx.reason = '墓地に「ロードポイズン」以外の植物族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c1GraveMonsters(ctx.player, d => d.ra === '植物' && d.n !== 'ロードポイズン');
    API.selectCard('ロードポイズン：特殊召喚する植物族', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c1MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ロードポイズン', r.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c1MzOpen(ctx.player)
      && c1GraveMonsters(ctx.player, d => d.ra === '植物' && d.n !== 'ロードポイズン').length > 0; } }
});

/* 2. 機械犬マロン — 戦闘破壊ならお互いに1000、戦闘以外の破壊なら相手だけに1000 */
defineScript('機械犬マロン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!(a3SelfBattleDestroyed(ctx) || c1EffectDestroyedGrave(ctx))){
      ctx.reason = 'フィールドで破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    if(a3SelfBattleDestroyed(ctx)){
      /* 戦闘破壊：お互いのライフに1000 */
      API.damageLP(ctx.player, 1000);
      API.damageLP(ctx.opponent, 1000);
    }else{
      /* 戦闘以外の破壊：相手ライフにだけ1000 */
      API.damageLP(ctx.opponent, 1000);
    }
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); },
    onDestroy(ctx){ return c1EffectDestroyedGrave(ctx); }
  }
});

/* 3. 雲魔物－ポイズン・クラウド — 破壊したモンスターを破壊し、相手に800 */
defineScript('雲魔物－ポイズン・クラウド', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.face === 'up')){ ctx.reason = '表側表示で存在した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const o = c1Destroyer(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.destroy(h, '雲魔物－ポイズン・クラウド', ctx.player);
    API.damageLP(ctx.opponent, 800);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const g = ctx.card.graveInfo;
    return a3SelfBattleDestroyed(ctx) && !!(g && g.face === 'up'); } }
});

/* 4. ネオフレムベル・ヘッジホッグ — 戦闘破壊なら相手の墓地を1枚除外、
      効果破壊なら自分の墓地から守備力200以下の炎属性を回収 */
defineScript('ネオフレムベル・ヘッジホッグ', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(a3SelfBattleDestroyed(ctx)){
      if(!API.pileCards(ctx.opponent, 'grave', () => true).length){
        ctx.reason = '相手の墓地にカードがありません'; return false; }
      return true;
    }
    if(c1EffectDestroyedGrave(ctx)){
      if(!c1GraveMonsters(ctx.player, d => d.at === '炎' && Number(d.def) <= 200
                                        && d.n !== 'ネオフレムベル・ヘッジホッグ').length){
        ctx.reason = '墓地に守備力200以下の炎属性モンスターがいません'; return false; }
      return true;
    }
    ctx.reason = 'フィールドで破壊された場合に発動します'; return false;
  },
  selectTargets(ctx, done){
    if(a3SelfBattleDestroyed(ctx)){
      const q = API.pileCards(ctx.opponent, 'grave', () => true);
      API.selectCard('ネオフレムベル・ヘッジホッグ：除外する相手の墓地のカード', q, t => done([t]));
      return;
    }
    const q = c1GraveMonsters(ctx.player, d => d.at === '炎' && Number(d.def) <= 200
                                            && d.n !== 'ネオフレムベル・ヘッジホッグ');
    API.selectCard('ネオフレムベル・ヘッジホッグ：手札に加える炎属性', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    if(r.p === ctx.opponent) API.banish(r, 'ネオフレムベル・ヘッジホッグ');
    else API.returnToHand(r, 'ネオフレムベル・ヘッジホッグ');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      return a3SelfBattleDestroyed(ctx)
        && API.pileCards(ctx.opponent, 'grave', () => true).length > 0; },
    onDestroy(ctx){
      return c1EffectDestroyedGrave(ctx)
        && c1GraveMonsters(ctx.player, d => d.at === '炎' && Number(d.def) <= 200
                                         && d.n !== 'ネオフレムベル・ヘッジホッグ').length > 0; }
  }
});

/* 5. ワイトキング — 元々の攻撃力は墓地の「ワイトキング」「ワイト」の数×1000。
      戦闘破壊された時、墓地のそれを1体除外して自身を特殊召喚できる */
function c1WightPile(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm'
    && (x.db.n === 'ワイトキング' || x.db.n === 'ワイト'));
}
defineScript('ワイトキング', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    const q = c1WightPile(ctx.player).filter(x => x.card !== ctx.card);
    if(!q.length){ ctx.reason = '墓地に除外できる「ワイトキング」「ワイト」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c1WightPile(ctx.player).filter(x => x.card !== ctx.card);
    API.selectCard('ワイトキング：除外するモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave') return;
    API.banish(r, 'ワイトキング');
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave' && c1MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'ワイトキング', me.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c1MzOpen(ctx.player)
      && c1WightPile(ctx.player).filter(x => x.card !== ctx.card).length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self, info){
      if(card !== self || card.face !== 'up') return null;
      return { setBaseAtk: c1WightPile(info.p).length * 1000 };
    }
  }
});

/* 6. ホワイトポータン — 自分の場にチューナーが表側で居れば戦闘破壊されない。
      自分の表側チューナーが戦闘破壊され墓地へ送られた時、相手に500 */
function c1OwnFaceUpTuner(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('チューナー') });
}
function c1PortanShield(target, self){
  const loc = locateCard(target), me = locateCard(self) || locateCardAnyV4(self);
  if(!loc || !me || loc.p !== me.p) return false;
  if(target !== self) return false;
  return c1OwnFaceUpTuner(loc.p).length > 0;
}
defineScript('ホワイトポータン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!c1TunerDiedNow(ctx)){ ctx.reason = '自分の表側チューナーが戦闘破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return c1TunerDiedNow(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    /* v21 の protect 宣言は「各フィールドが述語」のオブジェクト。 */
    protectV21:{
      key:'ホワイトポータン', label:'ホワイトポータン',
      battle: (target, self) => c1PortanShield(target, self)
    }
  }
});
/* このダメージステップで、自分の表側チューナーが戦闘破壊され墓地へ送られたか */
function c1TunerDiedNow(ctx){
  const b = ctx.battle || {};
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  const cands = [];
  if(b.destroyedAtk && b.atkCard) cands.push(b.atkCard);
  if(b.destroyedDef && b.defCard) cands.push(b.defCard);
  return cands.some(c => {
    const g = c.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
    if(g.face !== 'up') return false;
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'grave' || h.p !== me.p) return false;
    return (dbOf(c).st || []).includes('チューナー');
  });
}

/* 7. 森の狩人イエロー・バブーン — 自分の獣族が戦闘破壊された時、
      墓地の獣族2体を除外して手札から自身を特殊召喚 */
function c1BeastGrave(p){ return c1GraveMonsters(p, d => d.ra === '獣'); }
function c1BabooOk(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'hand') return false;
  const b = ctx.battle || {};
  const dead = [];
  if(b.destroyedAtk && b.atkCard) dead.push(b.atkCard);
  if(b.destroyedDef && b.defCard) dead.push(b.defCard);
  return dead.some(c => {
    const g = c.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
    const h = locateCardAnyV4(c);
    return !!h && h.zone === 'grave' && h.p === me.p && dbOf(c).ra === '獣';
  });
}
defineScript('森の狩人イエロー・バブーン', {
  type:'monster', priority:1, targets:true, activateFrom:['hand'],
  condition(ctx){
    if(!c1BabooOk(ctx)){ ctx.reason = '自分の獣族が戦闘によって破壊された場合に発動します'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    if(c1BeastGrave(ctx.player).length < 2){ ctx.reason = '墓地に獣族モンスターが2体必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c1BeastGrave(ctx.player);
    API.selectCard('森の狩人イエロー・バブーン：除外する獣族2体', q, t => {
      const rest = c1BeastGrave(ctx.player)
        .filter(x => x && !(x.p === t.p && x.zone === t.zone && x.index === t.index));
      API.selectCard('森の狩人イエロー・バブーン：除外する獣族（2体目）', rest, u => done([t, u]));
    });
  },
  resolve(ctx){
    const ts = (ctx.selectedTargets || []).map(t => resolveTarget(t)).filter(r => r && r.zone === 'grave');
    if(ts.length < 2) return;
    /* index のずれを避けるため、後ろの index から除外する */
    ts.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, '森の狩人イエロー・バブーン'));
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'hand' && c1MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'hand', me.index, 'atk', '森の狩人イエロー・バブーン', me.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return c1BabooOk(ctx) && c1MzOpen(ctx.player) && c1BeastGrave(ctx.player).length >= 2; } }
});

/* 9. カース・オブ・ヴァンパイア — 戦闘破壊された時に500払い、次のターンの
      スタンバイフェイズに墓地から特殊召喚。その特殊召喚に成功した時、攻撃力500アップ */
API.registerScheduleHandler('c1.curseVampire', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(!h || h.zone !== 'grave' || !c1MzOpen(p)) return;
  API.specialSummon(p, 'grave', h.index, 'atk', 'カース・オブ・ヴァンパイア', h.p);
  const now = findCardByUid(uid);
  if(now && now.zone === 'mz') API.setCardFlag(now, 'c1CurseRebornTurn', gameState.turn, 'カース・オブ・ヴァンパイア');
});
function c1CurseReborn(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(Number(me.card.c1CurseRebornTurn || -1) !== gameState.turn) return false;
  return Number(me.card.c1CurseBoostTurn || -1) !== gameState.turn;
}
defineScript('カース・オブ・ヴァンパイア', {
  type:'monster', priority:1, activateFrom:['grave','mz'],
  condition(ctx){
    if(c1CurseReborn(ctx)) return true;
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(c1CurseReborn(ctx)){ done(true); return; }
    API.payCost(ctx.player, 500); done(true);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me) return;
    if(me.zone === 'mz'){
      /* この効果で特殊召喚に成功した時：攻撃力を500アップ */
      API.setCardFlag(me, 'c1CurseBoostTurn', gameState.turn, 'カース・オブ・ヴァンパイア');
      API.modAtk(me, 500, 0, 'permanent', 'カース・オブ・ヴァンパイア');
      return;
    }
    if(me.zone !== 'grave') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player, handler:'c1.curseVampire',
                   args:{ uid:me.card.uid, player:ctx.player }, source:{ card:ctx.card },
                   note:'カース・オブ・ヴァンパイア' });
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && API.me(ctx).lp > 500; },
    onSpecialSummon(ctx){ return c1CurseReborn(ctx); }
  }
});

/* 10. インフェルニティ・リベンジャー — 手札0枚で自分の他のモンスターが
       相手モンスターとの戦闘で破壊された時、墓地から自身を特殊召喚し、
       破壊されたモンスターの元々のレベルと同じレベルになる */
function c1RevengerVictim(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'grave') return null;
  if((gameState.players[me.p].hand || []).length !== 0) return null;
  const b = ctx.battle || {};
  const cands = [];
  if(b.destroyedAtk && b.atkCard) cands.push(b.atkCard);
  if(b.destroyedDef && b.defCard) cands.push(b.defCard);
  for(const c of cands){
    if(c === ctx.card) continue;
    if(dbOf(c).n === 'インフェルニティ・リベンジャー') continue;
    const g = c.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) continue;
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'grave' || h.p !== me.p) continue;
    /* 相手モンスターとの戦闘であること（直接攻撃・相打ちでない一方通行は問わない） */
    if(!(b.atkCard && b.defCard)) continue;
    return c;
  }
  return null;
}
defineScript('インフェルニティ・リベンジャー', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!c1RevengerVictim(ctx)){ ctx.reason = '手札0枚で自分の他のモンスターが戦闘破壊された場合に発動します'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const victim = c1RevengerVictim(ctx);
    const lv = victim ? Number(dbOf(victim).lv || 0) : 0;
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave' || !c1MzOpen(ctx.player)) return;
    ensureCardUid(gameState, me.card);
    const uid = me.card.uid;
    API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'インフェルニティ・リベンジャー', me.p);
    const now = findCardByUid(uid);
    if(now && now.zone === 'mz' && lv > 0) API.setLevel(now, lv, 'permanent', 'インフェルニティ・リベンジャー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!c1RevengerVictim(ctx) && c1MzOpen(ctx.player); } }
});

/* 11. ジュラック・ガリム — 戦闘破壊された時に発動。相手は手札を1枚捨てて無効にできる。
       捨てなかった場合、このカードを破壊したモンスターを破壊する */
API.registerChoiceHandler('c1.garim', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const foe = p === 0 ? 1 : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  if(picked){
    /* 相手が手札を1枚捨てた：効果は無効 */
    const h = resolveTarget(picked);
    if(h && h.zone === 'hand')
      API.discard(foe, h.index, 'ジュラック・ガリム', { byEffect:true, byPlayer:foe });
    return;
  }
  const uid = args && args.killerUid;
  if(uid == null) return;
  const k = findCardByUid(uid);
  if(k && k.zone === 'mz') API.destroy(k, 'ジュラック・ガリム', p);
});
defineScript('ジュラック・ガリム', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const o = c1Destroyer(ctx);
    if(o) ensureCardUid(gameState, o);
    const hand = API.pileCards(ctx.opponent, 'hand', () => true);
    API.requestChoice({
      player: ctx.opponent, kind:'card', cancelable:false, min:0, max:1,
      title:'ジュラック・ガリム：手札を1枚捨てて効果を無効にできます',
      candidates: hand,
      resume:{ handler:'c1.garim', args:{ player:ctx.player, killerUid:(o ? o.uid : null) } }
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
});

/* 12. 漆黒の魔王 LV4 — 戦闘で破壊した相手モンスターの効果を無効化。
       モンスターを戦闘破壊した次の自分ターンのスタンバイフェイズに、
       このカードを墓地へ送って「漆黒の魔王 LV6」を手札／デッキから特殊召喚できる */
function c1DarkLordArmed(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(gameState.phase !== 'standby' || gameState.activePlayer !== me.p) return false;
  const t = Number(me.card.c1DarkLordKillTurn || -1);
  return t > 0 && t < gameState.turn;
}
function c1LvUpTargets(p, name){
  const out = [];
  API.pileCards(p, 'hand', x => x.db.n === name).forEach(c => out.push(c));
  API.pileCards(p, 'deck', x => x.db.n === name).forEach(c => out.push(c));
  return out;
}
defineScript('漆黒の魔王 LV4', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(c1DarkLordArmed(ctx)){
      if(!c1LvUpTargets(ctx.player, '漆黒の魔王 LV6').length){
        ctx.reason = '「漆黒の魔王 LV6」が手札・デッキにいません'; return false; }
      return true;
    }
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = 'この効果の条件を満たす戦闘ではありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c1DarkLordArmed(ctx)){
      const q = c1LvUpTargets(ctx.player, '漆黒の魔王 LV6');
      const pick = q.length ? q[0] : null;
      API.sendToGrave(me, '漆黒の魔王 LV4');
      const r = pick && locateCardAnyV4(pick.card);
      if(r && (r.zone === 'hand' || r.zone === 'deck') && c1MzOpen(ctx.player))
        API.specialSummon(ctx.player, r.zone, r.index, 'atk', '漆黒の魔王 LV4', r.p, {summonSrcS03:'漆黒の魔王 LV4'});   /* S03-U255: 漆黒の魔王 LV6 reads it */
      return;
    }
    const o = a6DestroyedFoeInBattle(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.negate(h, '漆黒の魔王 LV4');
    API.setCardFlag(me, 'c1DarkLordKillTurn', gameState.turn, '漆黒の魔王 LV4');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return !!a6DestroyedFoeInBattle(ctx); },
    onStandbyPhase(ctx){ return c1DarkLordArmed(ctx) && c1LvUpTargets(ctx.player, '漆黒の魔王 LV6').length > 0; }
  }
});

/* 14. ミスティック・ソードマン LV2 — 裏側守備表示を攻撃した場合、
       ダメージ計算を行わず裏側守備表示のまま破壊する。
       モンスターを戦闘破壊したターンのエンドフェイズに LV4 へ */
function c1MysticFaceDownTarget(ctx){
  if(!a3IsAttacker(ctx)) return null;
  const t = a3AttackTarget();
  if(!t || t.face !== 'down' || t.pos !== 'def') return null;
  return t;
}
function c1MysticArmed(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  if(gameState.phase !== 'end') return false;
  return Number(me.card.c1MysticKillTurn || -1) === gameState.turn;
}
defineScript('ミスティック・ソードマン LV2', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'start',
  condition(ctx){
    if(c1MysticArmed(ctx)){
      if(!c1LvUpTargets(ctx.player, 'ミスティック・ソードマン LV4').length){
        ctx.reason = '「ミスティック・ソードマン LV4」が手札・デッキにいません'; return false; }
      return true;
    }
    if(!c1MysticFaceDownTarget(ctx)){ ctx.reason = '裏側守備表示のモンスターを攻撃した場合に適用します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(c1MysticArmed(ctx)){
      const q = c1LvUpTargets(ctx.player, 'ミスティック・ソードマン LV4');
      const pick = q.length ? q[0] : null;
      API.sendToGrave(me, 'ミスティック・ソードマン LV2');
      const r = pick && locateCardAnyV4(pick.card);
      if(r && (r.zone === 'hand' || r.zone === 'deck') && c1MzOpen(ctx.player))
        API.specialSummon(ctx.player, r.zone, r.index, 'atk', 'ミスティック・ソードマン LV2', r.p);
      return;
    }
    const t = c1MysticFaceDownTarget(ctx);
    if(t){
      a3DestroyBeforeDamage(t, 'ミスティック・ソードマン LV2');
      API.setCardFlag(me, 'c1MysticKillTurn', gameState.turn, 'ミスティック・ソードマン LV2');
    }
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return !!c1MysticFaceDownTarget(ctx); },
    onEndPhase(ctx){ return c1MysticArmed(ctx) && c1LvUpTargets(ctx.player, 'ミスティック・ソードマン LV4').length > 0; }
  }
});

/* 15. レスキュー・ウォリアー — このカードの戦闘による自分への戦闘ダメージは0。
       戦闘破壊された場合、相手フィールドの「元々の持ち主が自分」のモンスター1体を得る */
defineScript('レスキュー・ウォリアー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊された場合に発動します'; return false; }
    if(!c1RescueTargets(ctx).length){ ctx.reason = '相手フィールドに元々の持ち主が自分のモンスターがいません'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('レスキュー・ウォリアー：コントロールを得るモンスター', c1RescueTargets(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz' || !c1MzOpen(ctx.player)) return;
    API.changeControl(r, ctx.player, 'レスキュー・ウォリアー', 'permanent', { card:ctx.card });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c1MzOpen(ctx.player) && c1RescueTargets(ctx).length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    battleDamage(info){
      /* このカードが関わる戦闘で、自分が受けるダメージだけ0にする */
      const self = info.self;
      if(info.atkCard !== self && info.defCard !== self) return info.amount;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return info.amount;
      return info.to === h.p ? 0 : info.amount;
    }
  }
});
function c1RescueTargets(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'up' && x.card.owner === ctx.player });
}

/* 16. オーシャンズ・オーパー — 守備表示モンスターへの貫通。
       戦闘破壊された場合、デッキから決まった2種のどちらか1体を手札に加える */
function c1OperTargets(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm'
    && (x.db.n === 'サウザンド・アイズ・フィッシュ' || x.db.n === 'マザー・ブレイン'));
}
defineScript('オーシャンズ・オーパー', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊された場合に発動します'; return false; }
    if(!c1OperTargets(ctx.player).length){ ctx.reason = 'デッキに該当するモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c1OperTargets(ctx.player);
    API.selectCard('オーシャンズ・オーパー：手札に加えるモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.returnToHand(r, 'オーシャンズ・オーパー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c1OperTargets(ctx.player).length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      const self = info.self;
      if(info.atkCard !== self) return 0;
      const d = info.defCard;
      if(!d || d.pos !== 'def') return 0;
      return Math.max(0, curATK(self) - curDEF(d));
    }
  }
});

/* 18. エレメント・デビル — 地属性なら破壊した効果モンスターを無効化、
       風属性ならもう一度だけ続けて攻撃できる */
defineScript('エレメント・デビル', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    if(!o){ ctx.reason = 'この効果の条件を満たす戦闘ではありません'; return false; }
    const negate = c1ElementOnField('地') && (dbOf(o).st || []).includes('効果');
    const again  = c1ElementOnField('風');
    if(!negate && !again){ ctx.reason = 'フィールドに地属性／風属性モンスターが必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    if(!o) return;
    if(c1ElementOnField('地') && (dbOf(o).st || []).includes('効果')){
      const h = locateCardAnyV4(o);
      if(h && h.zone === 'mz') API.negate(h, 'エレメント・デビル');
    }
    if(c1ElementOnField('風')){
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone === 'mz') API.grantAdditionalAttack(me, 1, 'エレメント・デビル');
    }
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a6DestroyedFoeInBattle(ctx);
    if(!o) return false;
    return (c1ElementOnField('地') && (dbOf(o).st || []).includes('効果')) || c1ElementOnField('風'); } }
});

/* ===================== B. 自分モンスターの戦闘破壊に反応する魔法・罠 ===================== */

/* 19. ドミノ — 相手のモンスターが戦闘破壊された時、自分のモンスター1体を墓地へ送り、
       相手のモンスター1体を破壊する（永続魔法） */
defineScript('ドミノ', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'],
  condition(ctx){
    if(!c1FoeBattleDestroyed(ctx.player).length){
      ctx.reason = '相手のモンスターが戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){
      ctx.reason = '墓地へ送る自分のモンスターがいません'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){
      ctx.reason = '破壊する相手のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ドミノ：墓地へ送る自分のモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), a =>
      API.selectCard('ドミノ：破壊する相手のモンスター',
        API.fieldCards({ player:ctx.opponent, zone:'mz' }), b => done([a, b])));
  },
  resolve(ctx){
    const a = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    const b = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[1]);
    if(!a || a.zone !== 'mz') return;
    API.sendToGrave(a, 'ドミノ');
    const nb = b && locateCardAnyV4(b.card);
    if(nb && nb.zone === 'mz') API.destroy(nb, 'ドミノ', ctx.player);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return c1FoeBattleDestroyed(ctx.player).length > 0
      && API.fieldCards({ player:ctx.player, zone:'mz' }).length > 0
      && API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0; } }
});

/* 20. リグレット・リボーン — 自分のモンスターが戦闘破壊された時、
       そのモンスターを表側守備表示で特殊召喚する。自分のエンドフェイズに破壊される */
API.registerScheduleHandler('c1.regret', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.destroy(h, 'リグレット・リボーン', entry.player);
});
defineScript('リグレット・リボーン', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c1OwnBattleDestroyed(ctx.player).length){
      ctx.reason = '自分のモンスターが戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c1OwnBattleDestroyed(ctx.player).map(c => locateCardAnyV4(c)).filter(Boolean);
    API.selectCard('リグレット・リボーン：特殊召喚するモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c1MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'def', 'リグレット・リボーン', r.p);
    const now = findCardByUid(uid);
    if(now && now.zone === 'mz')
      API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c1.regret',
                     args:{ uid:uid, player:ctx.player }, source:{ card:ctx.card }, note:'リグレット・リボーン' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return c1OwnBattleDestroyed(ctx.player).length > 0 && c1MzOpen(ctx.player); } }
});

/* 21. 自由解放 — 自分のモンスターが戦闘破壊された時、
       フィールドの表側表示モンスター2体を持ち主のデッキに戻す */
function c1FaceUpAll(){
  return API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' });
}
defineScript('自由解放', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c1OwnBattleDestroyed(ctx.player).length){
      ctx.reason = '自分のモンスターが戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(c1FaceUpAll().length < 2){ ctx.reason = '表側表示のモンスターが2体必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('自由解放：デッキに戻すモンスター（1体目）', c1FaceUpAll(), a => {
      const rest = c1FaceUpAll().filter(x => !(x.p === a.p && x.zone === a.zone && x.index === a.index));
      API.selectCard('自由解放：デッキに戻すモンスター（2体目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    const rs = (ctx.selectedTargets || []).map(t => resolveTarget(t))
      .map(r => r && locateCardAnyV4(r.card)).filter(r => r && r.zone === 'mz');
    rs.forEach(r => {
      const now = locateCardAnyV4(r.card);
      if(now && now.zone === 'mz') API.returnToDeck(now, false, '自由解放');
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return c1OwnBattleDestroyed(ctx.player).length > 0 && c1FaceUpAll().length >= 2; } }
});

/* 22. 復活の墓穴 — 自分のモンスターが戦闘破壊された時、
       お互いが自分の墓地からモンスター1体を守備表示で特殊召喚する。
       この効果で特殊召喚したモンスターは表示形式を変更できない */
defineScript('復活の墓穴', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c1OwnBattleDestroyed(ctx.player).length){
      ctx.reason = '自分のモンスターが戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c1GraveMonsters(ctx.player).length && !c1GraveMonsters(ctx.opponent).length){
      ctx.reason = 'お互いの墓地にモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const mine = c1GraveMonsters(ctx.player);
    const foes = c1GraveMonsters(ctx.opponent);
    const pickFoe = (a) => {
      if(!foes.length){ done(a ? [a] : []); return; }
      API.selectCard('復活の墓穴：相手が特殊召喚するモンスター', foes, b => done(a ? [a, b] : [b]));
    };
    if(!mine.length){ pickFoe(null); return; }
    API.selectCard('復活の墓穴：自分が特殊召喚するモンスター', mine, a => pickFoe(a));
  },
  resolve(ctx){
    (ctx.selectedTargets || []).forEach(t => {
      const r = t && resolveTarget(t);
      if(!r || r.zone !== 'grave') return;
      if(!c1MzOpen(r.p)) return;
      ensureCardUid(gameState, r.card);
      const uid = r.card.uid;
      API.specialSummon(r.p, 'grave', r.index, 'def', '復活の墓穴', r.p);
      const now = findCardByUid(uid);
      if(now && now.zone === 'mz') API.setCardFlag(now, 'c1GraveHoleLock', true, '復活の墓穴');
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return c1OwnBattleDestroyed(ctx.player).length > 0
      && (c1GraveMonsters(ctx.player).length > 0 || c1GraveMonsters(ctx.opponent).length > 0); } },
  continuous:{
    scope:'allMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotChangePosition(card){ return !!(card && card.c1GraveHoleLock); }
  }
});


/* ===================== C. 戦闘・召喚に反応するその他 ===================== */

/* 20. ゼンマイジャグラー — 相手モンスターと戦闘を行った場合、
       その相手モンスターをダメージ計算後に破壊できる。
       この効果は表側表示で存在する限り1度しか使用できない */
defineScript('ゼンマイジャグラー', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(b0FieldOnceUsed(ctx.card, 'c1JugglerUsed')){ ctx.reason = 'この効果は既に使用しています'; return false; }
    const o = a3BattleOther(ctx);
    if(!o){ ctx.reason = '相手モンスターと戦闘を行った場合に発動します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '破壊する相手モンスターがフィールドにいません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me) b0MarkFieldOnce(me, 'c1JugglerUsed', 'ゼンマイジャグラー');
    const o = a3BattleOther(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.destroy(h, 'ゼンマイジャグラー', ctx.player);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up') return false;
    if(b0FieldOnceUsed(ctx.card, 'c1JugglerUsed')) return false;
    const o = a3BattleOther(ctx);
    const h = o && locateCardAnyV4(o);
    return !!(h && h.zone === 'mz'); } }
});

/* 21. ゴブリン陽動部隊 — 相手ライフに戦闘ダメージを与えた時にドローできる。
       攻撃した場合、バトルフェイズ終了時に守備表示になり、
       次の自分のターンのエンドフェイズ時まで表示形式を変更できない */
function c1GoblinAttacked(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
  const bp = gameState.battlePhaseV6;
  const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
  return list.some(a => a && a.attackerUid === me.card.uid);
}
defineScript('ゴブリン陽動部隊', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(a3DealtBattleDamage(ctx)){
      if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
      return true;
    }
    if(c1GoblinAttacked(ctx) && gameState.phase === 'battle') return true;
    ctx.reason = '戦闘ダメージを与えた時、または攻撃したバトルフェイズ終了時に発動します';
    return false;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(a3DealtBattleDamage(ctx)){ API.draw(ctx.player, 1); return; }
    /* バトルフェイズ終了時：守備表示にし、次の自分ターンのエンドフェイズまで固定 */
    API.changePosition(me, 'def', 'ゴブリン陽動部隊');
    const now = locateCardAnyV4(ctx.card);
    if(now) API.setCardFlag(now, 'c1GoblinLockUntil', gameState.turn + 2, 'ゴブリン陽動部隊');
  },
  afterResolve(){},
  passive:{
    onBattleDamage(ctx){
      return ctx.zone === 'mz' && ctx.card.face === 'up'
        && a3DealtBattleDamage(ctx) && API.me(ctx).deck.length > 0; },
    onBattlePhaseEnd(ctx){
      return ctx.zone === 'mz' && ctx.card.face === 'up' && c1GoblinAttacked(ctx); }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(card, self){
      if(card !== self) return false;
      const t = Number(card.c1GoblinLockUntil || 0);
      return t > 0 && gameState.turn < t;
    }
  }
});

/* 22. ナチュル・ストロベリー — 相手がモンスターの召喚・特殊召喚に成功した時、
       そのモンスター1体を選択し、このカードの攻撃力をレベル×100アップ（1ターンに1度） */
function c1FoeSummonedNow(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.opponent) return [];
  return b2SummonedCards(e).map(c => locateCardAnyV4(c))
    .filter(h => h && h.p === ctx.opponent && h.zone === 'mz' && h.db.k === 'm');
}
defineScript('ナチュル・ストロベリー', {
  type:'monster', priority:1, targets:true, countLimit:1, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c1FoeSummonedNow(ctx).length){ ctx.reason = '相手がモンスターの召喚・特殊召喚に成功した場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ナチュル・ストロベリー：選択する相手モンスター', c1FoeSummonedNow(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r) return;
    const lv = Math.max(0, Number(dbOf(r.card).lv || 0));
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz' && lv > 0)
      API.modAtk(me, lv * 100, 0, 'endTurn', 'ナチュル・ストロベリー');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return ctx.zone === 'mz' && ctx.card.face === 'up' && c1FoeSummonedNow(ctx).length > 0; },
    onSpecialSummon(ctx){
      return ctx.zone === 'mz' && ctx.card.face === 'up' && c1FoeSummonedNow(ctx).length > 0; }
  }
});

/* 23. X－セイバー ウルベルム — 相手の手札が4枚以上の場合、このカードが
       相手ライフに戦闘ダメージを与えた時、相手の手札をランダムに1枚
       持ち主のデッキの一番上に戻す */
defineScript('X－セイバー ウルベルム', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if((gameState.players[ctx.opponent].hand || []).length < 4){
      ctx.reason = '相手の手札が4枚以上必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const H = gameState.players[ctx.opponent].hand || [];
    if(H.length < 4) return;
    /* 手札はランダムに選ぶ。中身は見ないので相手の非公開情報は漏れない。 */
    const i = (typeof duelRandomInt === 'function') ? duelRandomInt(H.length) : 0;
    const h = locateCardAnyV4(H[i]);
    if(h && h.zone === 'hand') API.returnToDeck(h, false, 'X－セイバー ウルベルム');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return ctx.zone === 'mz' && ctx.card.face === 'up' && a3DealtBattleDamage(ctx)
      && (gameState.players[ctx.opponent].hand || []).length >= 4; } }
});

/* 24. ドラゴン・アイス — 相手がモンスターの特殊召喚に成功した時、手札を1枚捨てて
       手札または墓地からこのカードを特殊召喚する。
       「ドラゴン・アイス」は表側表示で1枚しか存在できない */
function c1DragonIceOnField(){
  return API.fieldCards({ zone:'mz',
    filter:x => x.card.face === 'up' && x.db.n === 'ドラゴン・アイス' }).length > 0;
}
function c1FoeSpecialSummoned(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.opponent) return false;
  return b2SummonedCards(e).some(c => {
    const h = locateCardAnyV4(c);
    return !!(h && h.p === ctx.opponent && h.zone === 'mz');
  });
}
defineScript('ドラゴン・アイス', {
  type:'monster', priority:1, activateFrom:['hand','grave'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave')){
      ctx.reason = '手札または墓地に存在する必要があります'; return false; }
    if(!c1FoeSpecialSummoned(ctx)){ ctx.reason = '相手がモンスターの特殊召喚に成功した場合に発動します'; return false; }
    if(c1DragonIceOnField()){ ctx.reason = '「ドラゴン・アイス」は表側表示で1枚しか存在できません'; return false; }
    if(!c1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    const hand = gameState.players[ctx.player].hand || [];
    const need = (me.zone === 'hand') ? 2 : 1;
    if(hand.length < need){ ctx.reason = 'コストとして捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    const cands = API.pileCards(ctx.player, 'hand', x => !(me && me.zone === 'hand' && x.card === me.card));
    if(!cands.length){ done(false); return; }
    API.selectCard('ドラゴン・アイス：捨てる手札', cands, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'ドラゴン・アイス', { byEffect:true, byPlayer:ctx.player });
        done(true);
      }else done(false);
    });
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave')) return;
    if(c1DragonIceOnField() || !c1MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, me.zone, me.index, 'atk', 'ドラゴン・アイス', me.p);
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave')) return false;
    const hand = gameState.players[ctx.player].hand || [];
    const need = (me.zone === 'hand') ? 2 : 1;
    return c1FoeSpecialSummoned(ctx) && !c1DragonIceOnField()
      && c1MzOpen(ctx.player) && hand.length >= need; } }
});
