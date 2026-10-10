/* Auto cycle 39 — 8枚。engine 変更なし。
     XXVIIIA 墓地へ送られた時に誘発する装備魔法
     XXVIIIB 戦闘破壊をきっかけに墓地から動く
     XXVIIIC 素材として墓地へ送られた時（cycle 19 の資産を使う）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e8MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function e8MyTurn(p){ return gameState.activePlayer === p; }
function e8MyEndPhase(p){ return gameState.phase === 'end' && e8MyTurn(p); }
/* フィールドから墓地へ送られたか */
function e8FromFieldToGrave(ctx, from){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!g || g.turn !== gameState.turn) return false;
  return from ? (g.from === from) : (g.from === 'mz' || g.from === 'sz');
}
/* 破壊されて墓地へ送られたか */
function e8DestroyedToGrave(ctx, from){
  if(!e8FromFieldToGrave(ctx, from)) return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy);
}
/* 装備先（領域を問わず uid で引く） */
function e8HostUid(card){
  if(card && card.equipTo && card.equipTo.uid != null) return card.equipTo.uid;
  const k = Number(card && card.e8HostUid);
  return Number.isFinite(k) ? k : null;
}
function e8HostHandle(card){
  const uid = e8HostUid(card);
  return (uid != null) ? findCardByUid(uid) : null;
}
/* 装備して装備先 uid を刻む */
function e8EquipAndMark(ctx, targetHandle, reason){
  const me = locateCardAnyV4(ctx.card);
  if(!targetHandle || targetHandle.zone !== 'mz' || !me || me.zone !== 'sz') return;
  ensureCardUid(gameState, targetHandle.card);
  const hostUid = targetHandle.card.uid;
  API.equipSpell(me, targetHandle, reason);
  const now = locateCardAnyV4(ctx.card);
  if(now && now.zone === 'sz') API.setCardFlag(now, 'e8HostUid', hostUid, reason);
}
/* 戦闘破壊の (破壊した側, 破壊された側) の組 */
function e8KillPairs(ctx){
  const b = ctx.battle || {};
  const pairs = [];
  if(b.destroyedDef && b.atkCard && b.defCard) pairs.push([b.atkCard, b.defCard]);
  if(b.destroyedAtk && b.defCard && b.atkCard) pairs.push([b.defCard, b.atkCard]);
  return pairs;
}

/* ---- 予約ハンドラ ---- */
API.registerScheduleHandler('e8.destroyUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.destroy(h, (args && args.reason) || '予約');
});

/* ===================== A. 墓地へ送られた時に誘発する装備魔法 ===================== */

/* 1. レプティレス・アンガー — 装備モンスターは爬虫類族になり、攻撃力は800アップする。
      このカードが破壊され墓地へ送られた時、相手フィールドの表側モンスター1体を選択し、
      そのモンスターの攻撃力は800ポイントダウンする */
function e8FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'up' });
}
defineScript('レプティレス・アンガー', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e8DestroyedToGrave(ctx, 'sz')){
        ctx.reason = '破壊され墓地へ送られた時に発動します'; return false; }
      if(!e8FoeFaceUp(ctx).length){
        ctx.reason = '相手フィールドに表側表示モンスターがいません'; return false; }
      return true;
    }
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){
      API.selectCard('レプティレス・アンガー：攻撃力を下げる相手モンスター',
        e8FoeFaceUp(ctx), t => done([t]));
      return;
    }
    API.selectCard('レプティレス・アンガー：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(ctx.zone === 'grave'){
      if(r && r.zone === 'mz')
        API.modAtk(r, -800, 0, 'permanent', 'レプティレス・アンガー');
      return;
    }
    e8EquipAndMark(ctx, r, 'レプティレス・アンガー');
    const host = e8HostHandle(ctx.card);
    if(host && host.zone === 'mz')
      API.setRace(host, '爬虫類', 'permanent', 'レプティレス・アンガー');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return e8DestroyedToGrave(ctx, 'sz') && e8FoeFaceUp(ctx).length > 0; } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:800 };
    }
  }
});

/* 2. 呪いのお札 — 装備モンスターが破壊される事によってこのカードが墓地へ送られた時、
      墓地へ送られた装備モンスターの元々の守備力分のダメージを
      装備モンスターのコントローラーに与える */
function e8HostDestroyed(ctx){
  if(!e8FromFieldToGrave(ctx, 'sz')) return null;
  const host = e8HostHandle(ctx.card);
  if(!host || host.zone !== 'grave') return null;
  const g = host.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return null;
  return host;
}
defineScript('呪いのお札', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e8HostDestroyed(ctx)){
        ctx.reason = '装備モンスターが破壊された事で墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){ done([]); return; }
    API.selectCard('呪いのお札：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const host = e8HostDestroyed(ctx);
      if(!host) return;
      /* 「元々の守備力」なので DB の値。コントローラーは墓地送り時の持ち主。 */
      const dmg = Number(dbOf(host.card).def) || 0;
      const g = host.card.graveInfo || {};
      const to = (g.byPlayer === 0 || g.byPlayer === 1) ? (host.p) : host.p;
      if(dmg > 0) API.damageLP(to, dmg);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    e8EquipAndMark(ctx, r, '呪いのお札');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return !!e8HostDestroyed(ctx); } }
});

/* 3. 悪魔のくちづけ — 装備モンスターの攻撃力は700アップする。
      このカードがフィールドから墓地へ送られた時、500ライフポイントを払って発動でき、
      このカードをデッキの一番上に戻す */
defineScript('悪魔のくちづけ', {
  type:'spell', priority:1, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e8FromFieldToGrave(ctx, 'sz')){
        ctx.reason = 'フィールドから墓地へ送られた時に発動します'; return false; }
      if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
      return true;
    }
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){ done([]); return; }
    API.selectCard('悪魔のくちづけ：装備するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  cost(ctx, done){
    if(ctx.zone !== 'grave'){ done(true); return; }
    API.payCost(ctx.player, 500);
    done(true);
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone === 'grave') API.returnToDeck(me, false, '悪魔のくちづけ');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    e8EquipAndMark(ctx, r, '悪魔のくちづけ');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return e8FromFieldToGrave(ctx, 'sz') && API.me(ctx).lp > 500; } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:700 };
    }
  }
});

/* 4. 下克上の首飾り — 通常モンスターにのみ装備可能。
      装備モンスターよりレベルの高いモンスターと戦闘を行う場合、
      装備モンスターの攻撃力はダメージ計算時のみレベルの差×500ポイントアップする。
      このカードが墓地へ送られた時、このカードをデッキの一番上に戻す事ができる */
function e8BattlePair(){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!atk || !def) return null;
  return { atk, def };
}
defineScript('下克上の首飾り', {
  type:'spell', priority:1, targets:true,
  activateFrom:['sz','grave'], timing:['mainPhase','free'],
  equipSpec:{ canEquip(h){
      return !!(h && h.db && h.db.k === 'm' && treatedAsNormal(h.card)); },
    label:'通常モンスターのみ' },
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!e8FromFieldToGrave(ctx, 'sz')){
        ctx.reason = '墓地へ送られた時に発動します'; return false; }
      return true;
    }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' && treatedAsNormal(x.card) }).length){
      ctx.reason = '装備できる通常モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'grave'){ done([]); return; }
    API.selectCard('下克上の首飾り：装備する通常モンスター',
      API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && treatedAsNormal(x.card) }), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone === 'grave') API.returnToDeck(me, false, '下克上の首飾り');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    e8EquipAndMark(ctx, r, '下克上の首飾り');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return e8FromFieldToGrave(ctx, 'sz'); } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      const pair = e8BattlePair();
      if(!pair) return null;
      const other = (pair.atk === card) ? pair.def : (pair.def === card ? pair.atk : null);
      if(!other) return null;
      /* apply の中では base 層で比べる（curLV を呼ぶと再入し得る）。 */
      const mine = Number(dbOf(card).lv) || 0;
      const theirs = Number(dbOf(other).lv) || 0;
      const gap = theirs - mine;
      return gap > 0 ? { atk:gap * 500 } : null;
    }
  }
});

/* ===================== B. 戦闘破壊をきっかけに墓地から動く ===================== */

/* 5. カース・サイキック — 自分フィールドの表側サイキック族が相手モンスターの攻撃によって
      破壊され墓地へ送られた時に発動できる。
      その時に攻撃を行った相手モンスター1体を破壊し、
      破壊された自分のサイキック族のレベル×300ダメージを相手に与える */
function e8PsychicKilledByAttack(ctx){
  for(const [killer, victim] of e8KillPairs(ctx)){
    if(dbOf(victim).ra !== 'サイキック') continue;
    const vh = locateCardAnyV4(victim);
    if(!vh || vh.zone !== 'grave' || vh.p !== ctx.player) continue;
    const kh = locateCardAnyV4(killer);
    if(!kh || kh.p !== ctx.opponent) continue;
    return { killer, victim };
  }
  return null;
}
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('カース・サイキック', {
  type:'trap', priority:2, dsTiming:'leave', activateFrom:['sz'], timing:['damageStep'],
  condition(ctx){
    if(!e8PsychicKilledByAttack(ctx)){
      ctx.reason = '自分のサイキック族が相手の攻撃で破壊された時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const hit = e8PsychicKilledByAttack(ctx);
    if(!hit) return;
    const kh = locateCardAnyV4(hit.killer);
    if(kh && kh.zone === 'mz') API.destroy(kh, 'カース・サイキック', ctx.player);
    const lv = Number(dbOf(hit.victim).lv) || 0;
    if(lv > 0) API.damageLP(ctx.opponent, lv * 300);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && !!e8PsychicKilledByAttack(ctx); } }
});

/* 6. 時の機械－タイム・マシーン — 自分または相手のモンスター1体が戦闘で破壊され
      墓地へ送られた時に発動できる。
      そのモンスターが破壊された時のコントローラーのフィールドに、
      同じ表示形式でそのモンスターを特殊召喚する */
function e8BattleDeadInGrave(ctx){
  for(const [, victim] of e8KillPairs(ctx)){
    const vh = locateCardAnyV4(victim);
    if(!vh || vh.zone !== 'grave') continue;
    const g = victim.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) continue;
    return vh;
  }
  return null;
}
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('時の機械－タイム・マシーン', {
  type:'trap', priority:2, dsTiming:'leave', activateFrom:['sz'], timing:['damageStep'],
  condition(ctx){
    const h = e8BattleDeadInGrave(ctx);
    if(!h){
      ctx.reason = 'モンスターが戦闘で破壊され墓地へ送られた時に発動します'; return false; }
    /* 破壊された時のコントローラーの場に戻すので、その側の空きを見る。 */
    const g = h.card.graveInfo || {};
    const to = (g.byPlayer === 0 || g.byPlayer === 1) ? h.p : h.p;
    if(!e8MzOpen(to)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const h = e8BattleDeadInGrave(ctx);
    if(!h) return;
    const g = h.card.graveInfo || {};
    const to = h.p;
    if(!e8MzOpen(to)) return;
    const pos = (g.pos === 'def') ? 'def' : 'atk';
    ensureCardUid(gameState, h.card);
    const uid = h.card.uid;
    API.specialSummon(to, 'grave', h.index, pos, '時の機械－タイム・マシーン', h.p);
    const back = (uid != null) ? findCardByUid(uid) : null;
    if(back && back.zone === 'mz' && g.face === 'down')
      API.flip(back, 'down', '時の機械－タイム・マシーン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const h = e8BattleDeadInGrave(ctx);
    return ctx.zone === 'sz' && !!h && e8MzOpen(h.p); } }
});

/* 7. 人造人間－サイコ・リターナー — 直接攻撃できる。
      このカードが墓地へ送られた時、自分の墓地の「人造人間－サイコ・ショッカー」1体を
      対象として発動でき、そのモンスターを特殊召喚する。
      この効果で特殊召喚したモンスターは自分エンドフェイズに破壊される */
function e8ShockerGrave(p){
  return API.pileCards(p, 'grave', x => x.db.n === '人造人間－サイコ・ショッカー');
}
defineScript('人造人間－サイコ・リターナー', {
  type:'monster', priority:1, canDirectAttack:true, targets:true,
  activateFrom:['grave'], timing:['free'],
  condition(ctx){
    if(!e8FromFieldToGrave(ctx)){
      ctx.reason = '墓地へ送られた時に発動します'; return false; }
    if(!e8ShockerGrave(ctx.player).length){
      ctx.reason = '墓地に「人造人間－サイコ・ショッカー」がいません'; return false; }
    if(!e8MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('人造人間－サイコ・リターナー：特殊召喚するモンスター',
      e8ShockerGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !e8MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk',
      '人造人間－サイコ・リターナー', r.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(now && now.zone === 'mz')
      API.schedule({ at:'endPhase', ownTurn:true, player:ctx.player,
        handler:'e8.destroyUid', source:ctx.card, note:'人造人間－サイコ・リターナー',
        args:{ uid:uid, reason:'人造人間－サイコ・リターナー' } });
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){
      return e8FromFieldToGrave(ctx) && e8ShockerGrave(ctx.player).length > 0
          && e8MzOpen(ctx.player); },
    onDestroy(ctx){
      return e8FromFieldToGrave(ctx) && e8ShockerGrave(ctx.player).length > 0
          && e8MzOpen(ctx.player); }
  }
});

/* ===================== C. 素材として墓地へ送られた時 ===================== */

/* 8. 二角獣レーム — このカードがシンクロ召喚の素材として墓地へ送られた場合、
      相手のデッキの上からカードを2枚墓地へ送る */
defineScript('二角獣レーム', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], timing:['free'],
  condition(ctx){
    if(!c8AsSynchroMaterial(ctx)){
      ctx.reason = 'シンクロ召喚の素材として墓地へ送られた場合に発動します'; return false; }
    if(!(gameState.players[ctx.opponent].deck || []).length){
      ctx.reason = '相手のデッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = Math.min(2, (gameState.players[ctx.opponent].deck || []).length);
    if(n > 0) API.millTop(ctx.opponent, n, '二角獣レーム');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return !!c8AsSynchroMaterial(ctx)
        && (gameState.players[ctx.opponent].deck || []).length > 0; } }
});
