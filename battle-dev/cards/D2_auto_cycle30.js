/* Auto cycle 30 — 10枚。engine 変更なし。
     XIXA コアキメイルの維持コスト（cycle 29 の骨格を述語で一般化）
     XIXB エンドフェイズに戻す・破壊する（Scheduler v7）
     XIXC 効果ダメージに反応する装備（onLPChange）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d9MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d9MyTurn(p){ return gameState.activePlayer === p; }
function d9FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
function d9MyEndPhase(p){ return gameState.phase === 'end' && d9MyTurn(p); }
function d9LightOrDark(db){ return !!db && (db.at === '光' || db.at === '闇'); }

/* ---- 予約ハンドラ ---- */
API.registerScheduleHandler('d9.destroyUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.destroy(h, (args && args.reason) || '予約');
});
API.registerScheduleHandler('d9.returnBanishedUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(!h || h.zone !== 'banish') return;
  if((gameState.players[h.p].mz || []).length >= ZONE_LIMITS.mz) return;
  const b = h.card.banishInfo || {};
  API.specialSummon(h.p, 'banish', h.index, b.pos === 'def' ? 'def' : 'atk',
    (args && args.reason) || '予約', h.p);
});
API.registerScheduleHandler('d9.toDeckUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && (h.zone === 'sz' || h.zone === 'mz'))
    API.returnToDeck(h, false, (args && args.reason) || '予約');
});
API.registerScheduleHandler('d9.clearLabelUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h) API.clearModsByLabel(h, (args && args.label) || '効果');
});

/* ===================== A. コアキメイルの維持コスト ===================== */

/* 維持コストの一般形。鋼核を墓地へ送るか、show(db) を満たす手札1枚を見せる。
   どちらも行えなければこのカードを破壊する。 */
function d9KoakiUpkeep(ctx, show){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return;
  const cores = v57CoreInHand(ctx.player);
  if(cores.length){
    const r = resolveTarget(cores[0]);
    if(r && r.zone === 'hand'){
      API.sendHandToGrave(ctx.player, r.index, 'コアキメイルの維持コスト');
      return;
    }
  }
  const q = API.pileCards(ctx.player, 'hand', x => show(x.db));
  if(q.length){
    API.reveal({ cards:[q[0]], audience:'both', label:'コアキメイルの維持コスト',
                 until:'resolution' });
    return;
  }
  const again = locateCardAnyV4(ctx.card);
  if(again && again.zone === 'mz') API.destroy(again, 'コアキメイルの維持コスト');
}
/* 維持コストだけを持つコアキメイル（追加効果は spec 側で足す） */
function d9Koaki(name, show, spec){
  const base = {
    type:'monster', priority:1, activateFrom:['mz'], timing:['endPhase'],
    condition(ctx){
      if(!d9FaceUpMz(ctx)){
        ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
      if(!d9MyEndPhase(ctx.player)){
        ctx.reason = '自分のエンドフェイズに維持コストを処理します'; return false; }
      return true;
    },
    resolve(ctx){ d9KoakiUpkeep(ctx, show); },
    afterResolve(){},
    passive:{ onEndPhase(ctx){ return d9FaceUpMz(ctx) && d9MyEndPhase(ctx.player); } }
  };
  defineScript(name, Object.assign(base, spec || {}));
}

/* 1. コアキメイル・グラヴィローズ — 維持コスト（植物族）。
      自分のスタンバイフェイズに1度だけ、デッキからレベル3以下のモンスター1体を墓地へ送れる */
function d9LowDeck(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && Number(x.db.lv) <= 3);
}
d9Koaki('コアキメイル・グラヴィローズ', db => db.k === 'm' && db.ra === '植物', {
  countLimit:1, targets:true, timing:['endPhase','standby'],
  condition(ctx){
    if(!d9FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(d9MyEndPhase(ctx.player)) return true;
    if(gameState.phase !== 'standby' || !d9MyTurn(ctx.player)){
      ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    if(!d9LowDeck(ctx.player).length){
      ctx.reason = 'デッキにレベル3以下のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(d9MyEndPhase(ctx.player)){ done([]); return; }
    API.selectCard('コアキメイル・グラヴィローズ：墓地へ送るレベル3以下のモンスター',
      d9LowDeck(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(d9MyEndPhase(ctx.player)){
      d9KoakiUpkeep(ctx, db => db.k === 'm' && db.ra === '植物'); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.mill(ctx.player, r.index, 'コアキメイル・グラヴィローズ');
  },
  passive:{ onEndPhase(ctx){ return d9FaceUpMz(ctx) && d9MyEndPhase(ctx.player); } }
});

/* 2. コアキメイル・ビートル — 維持コスト（昆虫族）。
      光属性または闇属性モンスターが表側攻撃表示で特殊召喚に成功した時、
      そのモンスターを守備表示にする */
function d9BeetleTarget(ctx){
  const e = ctx.event || {};
  const cards = b2SummonedCards(e);
  for(const c of cards){
    if(!d9LightOrDark(dbOf(c))) continue;
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'mz') continue;
    if(h.card.face !== 'up' || h.card.pos !== 'atk') continue;
    return h;
  }
  return null;
}
d9Koaki('コアキメイル・ビートル', db => db.k === 'm' && db.ra === '昆虫', {
  forced:true, timing:['endPhase','free'],
  condition(ctx){
    if(!d9FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(d9MyEndPhase(ctx.player)) return true;
    if(!d9BeetleTarget(ctx)){
      ctx.reason = '光・闇属性モンスターが表側攻撃表示で特殊召喚された時に発動します';
      return false; }
    return true;
  },
  resolve(ctx){
    if(d9MyEndPhase(ctx.player)){
      d9KoakiUpkeep(ctx, db => db.k === 'm' && db.ra === '昆虫'); return; }
    const h = d9BeetleTarget(ctx);
    if(h) API.changePosition(h, 'def', 'コアキメイル・ビートル');
  },
  passive:{
    onEndPhase(ctx){ return d9FaceUpMz(ctx) && d9MyEndPhase(ctx.player); },
    onSpecialSummon(ctx){ return d9FaceUpMz(ctx) && !!d9BeetleTarget(ctx); }
  }
});

/* 3. コアキメイル・ベルグザーク — 維持コスト（戦士族）。
      戦闘で相手モンスターを破壊した場合、もう1度だけ続けて攻撃できる */
function d9SelfKilled(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
d9Koaki('コアキメイル・ベルグザーク', db => db.k === 'm' && db.ra === '戦士', {
  forced:true, dsTiming:'after', timing:['endPhase','damageStep'],
  condition(ctx){
    if(!d9FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(d9MyEndPhase(ctx.player)) return true;
    if(!d9SelfKilled(ctx)){
      ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    if(d9MyEndPhase(ctx.player)){
      d9KoakiUpkeep(ctx, db => db.k === 'm' && db.ra === '戦士'); return; }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.grantAdditionalAttack(me, 1, 'コアキメイル・ベルグザーク', true);
  },
  passive:{
    onEndPhase(ctx){ return d9FaceUpMz(ctx) && d9MyEndPhase(ctx.player); },
    onDamageStep(ctx){ return d9FaceUpMz(ctx) && !!d9SelfKilled(ctx); }
  }
});

/* ===================== B. エンドフェイズの処理 ===================== */

/* 4. ドル・ドラ — フィールドのこのカードが破壊され墓地へ送られたターンのエンドフェイズに
      墓地から特殊召喚できる。攻撃力・守備力は1000になる。デュエル中に1度 */
function d9Destroyed(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('ドル・ドラ', {
  type:'monster', priority:1, countLimit:{ n:1, scope:'duel' },
  activateFrom:['grave'], timing:['endPhase'],
  condition(ctx){
    if(!d9Destroyed(ctx)){
      ctx.reason = '破壊され墓地へ送られたターンのエンドフェイズに発動します'; return false; }
    if(gameState.phase !== 'end'){
      ctx.reason = 'エンドフェイズに発動します'; return false; }
    if(!d9MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave' || !d9MzOpen(ctx.player)) return;
    ensureCardUid(gameState, me.card);
    const uid = me.card.uid;
    API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'ドル・ドラ', me.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(!now || now.zone !== 'mz') return;
    API.setAtk(now, 1000, 'permanent', 'ドル・ドラ');
    API.setDef(now, 1000, 'permanent', 'ドル・ドラ');
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return d9Destroyed(ctx) && d9MzOpen(ctx.player); } }
});

/* 5. サテライト・キャノン — レベル7以下のモンスターとの戦闘では破壊されない。
      自分のエンドフェイズ毎に攻撃力は1000ポイントアップする。
      この効果でアップした攻撃力は、このカードが攻撃したダメージ計算後に0に戻る */
defineScript('サテライト・キャノン', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  activateFrom:['mz'], timing:['endPhase','damageStep'],
  condition(ctx){
    if(!d9FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const b = ctx.battle || {};
    if(b.atkCard === ctx.card) return true;
    if(!d9MyEndPhase(ctx.player)){
      ctx.reason = '自分のエンドフェイズ、または攻撃したダメージ計算後に処理します';
      return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    const b = ctx.battle || {};
    if(b.atkCard === ctx.card){
      API.clearModsByLabel(me, 'サテライト・キャノン');
      return;
    }
    API.modAtk(me, 1000, 0, 'permanent', 'サテライト・キャノン');
  },
  afterResolve(){},
  passive:{
    onEndPhase(ctx){ return d9FaceUpMz(ctx) && d9MyEndPhase(ctx.player); },
    onDamageStep(ctx){
      const b = ctx.battle || {};
      return d9FaceUpMz(ctx) && b.atkCard === ctx.card; }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'サテライト・キャノン', label:'サテライト・キャノン',
      battle:(target, self) => {
        if(target !== self) return false;
        const b = gameState.battle;
        if(!b || b.target === 'direct') return false;
        const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
        const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
        const other = (atk === self) ? def : (def === self ? atk : null);
        return !!other && Number(dbOf(other).lv) <= 7;
      },
      effect:false
    }
  }
});

/* 6. エレキジ — 相手プレイヤーに直接攻撃できる。
      直接攻撃によって相手ライフに戦闘ダメージを与えた時、
      フィールドの表側モンスター1体をこのターンのエンドフェイズ時まで除外する */
defineScript('エレキジ', {
  type:'monster', priority:1, canDirectAttack:true, targets:true,
  activateFrom:['mz'], timing:['damageStep','free'],
  condition(ctx){
    if(!d9FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const e = ctx.event || {};
    if(!(Number(e.amount) > 0 && e.player === ctx.opponent && e.direct === true
         && e.attackerUid === ctx.card.uid)){
      ctx.reason = '直接攻撃で相手に戦闘ダメージを与えた時に発動します'; return false; }
    if(!API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('エレキジ：エンドフェイズまで除外するモンスター',
      API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.banish(r, 'エレキジ');
    API.schedule({ at:'endPhase', turns:0, player:ctx.player,
      handler:'d9.returnBanishedUid', source:ctx.card, note:'エレキジ',
      args:{ uid:uid, reason:'エレキジ' } });
  },
  afterResolve(){},
  passive:{ onDirectBattleDamage(ctx){
    const e = ctx.event || {};
    return d9FaceUpMz(ctx) && Number(e.amount) > 0 && e.player === ctx.opponent
        && e.direct === true && e.attackerUid === ctx.card.uid
        && API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' }).length > 0; } }
});

/* 7. エーリアンモナイト — 召喚に成功した時、自分の墓地のレベル4以下の
      「エーリアン」モンスター1体を特殊召喚できる。
      この効果で特殊召喚したモンスターはエンドフェイズに破壊される */
function d9AlienGrave(p){
  return API.pileCards(p, 'grave',
    x => x.db.k === 'm' && Number(x.db.lv) <= 4 && isSetCardV4(x.db, SETCODE.ALIEN));
}
defineScript('エーリアンモナイト', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  condition(ctx){
    if(!(ctx.event && ctx.event.card === ctx.card)){
      ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!d9AlienGrave(ctx.player).length){
      ctx.reason = '墓地にレベル4以下の「エーリアン」がいません'; return false; }
    if(!d9MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('エーリアンモナイト：特殊召喚する「エーリアン」',
      d9AlienGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !d9MzOpen(ctx.player)) return;
    ensureCardUid(gameState, r.card);
    const uid = r.card.uid;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'エーリアンモナイト', r.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(now && now.zone === 'mz')
      API.schedule({ at:'endPhase', turns:0, player:ctx.player,
        handler:'d9.destroyUid', source:ctx.card, note:'エーリアンモナイト',
        args:{ uid:uid, reason:'エーリアンモナイト' } });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
        && d9AlienGrave(ctx.player).length > 0 && d9MzOpen(ctx.player); } }
});

/* 8. ネオス・フォース — 「E・HERO ネオス」にのみ装備可能。装備モンスターの攻撃力は800アップ。
      装備モンスターが戦闘でモンスターを破壊し墓地へ送った時、
      破壊したモンスターの元々の攻撃力分のダメージを相手ライフに与える。
      エンドフェイズ時、フィールドのこのカードはデッキに戻る */
defineScript('ネオス・フォース', {
  type:'spell', priority:1, forced:true, targets:true,
  activateFrom:['sz'], timing:['mainPhase','damageStep','endPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.n === 'E・HERO ネオス'); },
              label:'「E・HERO ネオス」のみ' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(d9MyEndPhase(ctx.player)) return true;
      if(!b1EquippedKilled(ctx)){
        ctx.reason = '装備モンスターが戦闘でモンスターを破壊した時に発動します'; return false; }
      return true;
    }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' && x.db.n === 'E・HERO ネオス' }).length){
      ctx.reason = '「E・HERO ネオス」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('ネオス・フォース：装備する「E・HERO ネオス」',
      API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.n === 'E・HERO ネオス' }), t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){
      if(d9MyEndPhase(ctx.player)){
        const me = locateCardAnyV4(ctx.card);
        if(me && me.zone === 'sz') API.returnToDeck(me, false, 'ネオス・フォース');
        return;
      }
      const victim = b1EquippedKilled(ctx);
      if(victim) API.damageLP(ctx.opponent, Number(dbOf(victim).atk) || 0);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'ネオス・フォース');
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      return ctx.zone === 'sz' && !!ctx.card.equipTo && !!b1EquippedKilled(ctx); },
    onEndPhase(ctx){
      return ctx.zone === 'sz' && !!ctx.card.equipTo && d9MyEndPhase(ctx.player); }
  },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:800 };
    }
  }
});

/* 9. サディスティック・ポーション — 発動後は装備カードとなり自分のモンスター1体に装備する。
       このカードのコントローラーがカードの効果で相手にダメージを与えた場合、
       そのターンのエンドフェイズ時まで装備モンスターの攻撃力は1000アップする */
function d9DealtEffectDamage(ctx){
  const e = ctx.event || {};
  if(e.cause !== 'effect') return false;
  if(e.player !== ctx.opponent) return false;
  if(!(Number(e.delta) < 0)) return false;
  return e.byPlayer === ctx.player || e.byPlayer == null;
}
defineScript('サディスティック・ポーション', {
  type:'trap', priority:2, forced:true, targets:true, activateFrom:['sz'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
      if(!d9DealtEffectDamage(ctx)){
        ctx.reason = 'カードの効果で相手にダメージを与えた場合に発動します'; return false; }
      return true;
    }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できる自分のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('サディスティック・ポーション：装備するモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }),
      t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){
      const host = a8Equipped(ctx.card);
      const hh = host && locateCardAnyV4(host);
      if(hh && hh.zone === 'mz')
        API.modAtk(hh, 1000, 0, 'endTurn', 'サディスティック・ポーション');
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'サディスティック・ポーション');
  },
  afterResolve(){},
  passive:{ onLPChange(ctx){
    return ctx.zone === 'sz' && !!ctx.card.equipTo
        && !!a8Equipped(ctx.card) && d9DealtEffectDamage(ctx); } }
});

/* 10. シンクロ・コントロール — 自分フィールド及び自分の墓地にシンクロモンスターが
       存在しない場合のみ発動できる。1000ライフを払い、相手フィールドの表側
       シンクロモンスター1体のコントロールを自分のエンドフェイズ時まで得る */
function d9NoSynchroMine(p){
  const onField = API.fieldCards({ player:p, zone:'mz',
    filter:x => (x.db.st || []).includes('シンクロ') }).length;
  const inGrave = API.pileCards(p, 'grave',
    x => x.db.k === 'm' && (x.db.st || []).includes('シンクロ')).length;
  return onField === 0 && inGrave === 0;
}
function d9FoeSynchro(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('シンクロ') });
}
defineScript('シンクロ・コントロール', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!d9NoSynchroMine(ctx.player)){
      ctx.reason = '自分フィールド・墓地にシンクロモンスターが存在しない場合のみ発動できます';
      return false; }
    if(API.me(ctx).lp <= 1000){ ctx.reason = '1000ライフポイントを払えません'; return false; }
    if(!d9FoeSynchro(ctx).length){
      ctx.reason = '相手フィールドに表側表示のシンクロモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000); done(true); },
  selectTargets(ctx, done){
    API.selectCard('シンクロ・コントロール：コントロールを得るシンクロモンスター',
      d9FoeSynchro(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.changeControl(r, ctx.player, 'シンクロ・コントロール', 'endPhase',
      locateCardAnyV4(ctx.card));
  },
  afterResolve(){}
});
