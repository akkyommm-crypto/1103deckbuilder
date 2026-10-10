/* Auto cycle 36 — 7枚。engine 変更なし。
     XXVA 貫通（continuous.piercingDamage）を自分に／他のモンスターに与える
     XXVB 戦闘破壊耐性＋自分への戦闘ダメージ0（protectV21 + continuous.lpChange）
     XXVC ダメージ計算時だけの攻撃力アップ・戦闘ダメージからの回復
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function e5MyTurn(p){ return gameState.activePlayer === p; }
function e5MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2') && e5MyTurn(p);
}
function e5FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* いま戦闘している2体。戦闘中でなければ null。 */
function e5BattlePair(){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!atk || !def) return null;
  return { atk, def };
}
function e5BattleOther(self){
  const p = e5BattlePair();
  if(!p) return null;
  if(p.atk === self) return p.def;
  if(p.def === self) return p.atk;
  return null;
}
/* このターン有効な印か（turn を格納する印を共通で読む） */
function e5MarkedThisTurn(card, key){
  const t = Number(card && card[key] || 0);
  return t > 0 && t === gameState.turn;
}
/* 指定ターンまで有効な印か */
function e5MarkedThrough(card, key){
  const t = Number(card && card[key] || 0);
  return t > 0 && gameState.turn <= t;
}

/* ---- 予約ハンドラ ---- */
API.registerScheduleHandler('e5.returnBanishedUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(!h || h.zone !== 'banish') return;
  if((gameState.players[h.p].mz || []).length >= ZONE_LIMITS.mz) return;
  const b = h.card.banishInfo || {};
  API.specialSummon(h.p, 'banish', h.index, b.pos === 'def' ? 'def' : 'atk',
    (args && args.reason) || '予約', h.p);
});
API.registerScheduleHandler('e5.toGraveUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.sendToGrave(h, (args && args.reason) || '予約');
});

/* ===================== A. 貫通 ===================== */

/* 1. フライファング — 守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば
      その数値だけ相手ライフに戦闘ダメージを与える。
      相手ライフに戦闘ダメージを与えたバトルフェイズ終了時、
      このカードを次の自分のスタンバイフェイズ時までゲームから除外する */
function e5DealtBattleDamage(ctx){
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = ctx.card && ctx.card.uid;
  if(uid == null) return false;
  return e.attackerUid === uid || e.defenderUid === uid;
}
defineScript('フライファング', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  timing:['damageStep','free'],
  condition(ctx){
    if(!e5FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(gameState.phase === 'battle' && e5MarkedThisTurn(ctx.card, 'e5FlyDealt')) return true;
    if(!e5DealtBattleDamage(ctx)){
      ctx.reason = '相手ライフに戦闘ダメージを与えた時に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    if(e5MarkedThisTurn(ctx.card, 'e5FlyDealt')){
      /* バトルフェイズ終了時：次の自分のスタンバイフェイズまで除外する。 */
      ensureCardUid(gameState, me.card);
      const uid = me.card.uid;
      API.banish(me, 'フライファング');
      API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
        handler:'e5.returnBanishedUid', source:ctx.card, note:'フライファング',
        args:{ uid:uid, reason:'フライファング' } });
      return;
    }
    /* 戦闘ダメージを与えた事を印として残し、バトルフェイズ終了時に処理する。 */
    API.setCardFlag(me, 'e5FlyDealt', gameState.turn, 'フライファング');
  },
  afterResolve(){},
  passive:{
    onBattleDamage(ctx){ return e5FaceUpMz(ctx) && e5DealtBattleDamage(ctx); },
    onBattlePhaseEnd(ctx){
      return e5FaceUpMz(ctx) && e5MarkedThisTurn(ctx.card, 'e5FlyDealt'); }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      return (info && info.atkCard && info.atkCard === info.self)
        ? Math.max(0, Number(info.amount) || 0) : 0;
    }
  }
});

/* 2. 光神機－轟龍 — 生け贄1体で召喚できる。
      この方法で召喚した場合、エンドフェイズ時に墓地へ送られる。
      守備表示モンスターを攻撃した時、その守備力を攻撃力が越えていれば
      その数値だけ相手ライフに戦闘ダメージを与える */
defineScript('光神機－轟龍', {
  type:'monster', priority:1, activateFrom:['mz'],
  normalSummonProcedure:{ includeStandard:true, methods:[
    { id:'gorgyra1', tributes:1, modes:['summon'],
      summonLabel:'リリース1体で召喚（エンドフェイズに墓地へ送られる）',
      condition(){ return true; } }
  ]},
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn){
      ctx.reason = '召喚した直後に処理します'; return false; }
    /* リリース1体で召喚した場合だけ自壊する。 */
    if(Number(ctx.card.tributeCount || 0) !== 1){
      ctx.reason = 'リリース1体で召喚した場合のみ処理します'; return false; }
    if(API.schedules('e5.toGraveUid').length){
      ctx.reason = '既に予約されています'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player,
      handler:'e5.toGraveUid', source:ctx.card, note:'光神機－轟龍',
      args:{ uid:me.card.uid, reason:'光神機－轟龍' } });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
        && Number(ctx.card.tributeCount || 0) === 1
        && !API.schedules('e5.toGraveUid').length; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      return (info && info.atkCard && info.atkCard === info.self)
        ? Math.max(0, Number(info.amount) || 0) : 0;
    }
  }
});

/* 3. ランサー・デーモン — 相手フィールドの守備表示モンスターを攻撃対象とした
      自分のモンスターの攻撃宣言時に発動でき、そのモンスターが守備表示モンスターを
      攻撃した場合、その守備力を攻撃力が超えていればその数値だけ戦闘ダメージを与える。
      1ターンに1度 */
function e5AttackingDefender(ctx){
  const b = gameState.battle || gameState.pendingAttack;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!atk || !def) return null;
  if(b.player !== ctx.player) return null;      /* 自分のモンスターの攻撃宣言時 */
  if(def.pos !== 'def') return null;
  return atk;
}
defineScript('ランサー・デーモン', {
  type:'monster', priority:2, countLimit:1, activateFrom:['mz'],
  timing:['attackDeclare','free'],
  condition(ctx){
    if(!e5FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e5AttackingDefender(ctx)){
      ctx.reason = '守備表示モンスターへの攻撃宣言時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const atk = e5AttackingDefender(ctx);
    const h = atk && locateCardAnyV4(atk);
    if(h && h.zone === 'mz')
      API.setCardFlag(h, 'e5LancerPierce', gameState.turn, 'ランサー・デーモン');
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){
    return e5FaceUpMz(ctx) && !!e5AttackingDefender(ctx); } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      const atk = info && info.atkCard;
      if(!atk || !e5MarkedThisTurn(atk, 'e5LancerPierce')) return 0;
      return Math.max(0, Number(info.amount) || 0);
    }
  }
});

/* ===================== B. 戦闘破壊耐性＋自分への戦闘ダメージ0 ===================== */

/* 印の付いたモンスターが関わる戦闘で、自分が受ける戦闘ダメージを0にする共通処理。 */
function e5ShieldedInBattle(p, key, through){
  const pair = e5BattlePair();
  if(!pair) return false;
  const check = (c) => {
    const h = locateCardAnyV4(c);
    if(!h || h.p !== p) return false;
    return through ? e5MarkedThrough(c, key) : e5MarkedThisTurn(c, key);
  };
  return check(pair.atk) || check(pair.def);
}

/* 4. バリア・リゾネーター — 手札から墓地へ送り、自分フィールドの表側チューナー1体を
      選択して発動する。そのモンスターはこのターン戦闘では破壊されず、
      そのモンスターの戦闘によって発生する自分への戦闘ダメージは0になる */
function e5MyTuners(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && API.isTunerNow(x) });
}
defineScript('バリア・リゾネーター', {
  type:'monster', priority:2, targets:true, activateFrom:['hand'], timing:['free'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!e5MyTuners(ctx.player).length){
      ctx.reason = '自分フィールドに表側表示のチューナーがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('バリア・リゾネーター：選択するチューナー',
      e5MyTuners(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'hand'){
      API.sendHandToGrave(ctx.player, me.index, 'バリア・リゾネーター（コスト）'); done(true);
    } else done(false);
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz')
      API.setCardFlag(r, 'e5BarrierTurn', gameState.turn, 'バリア・リゾネーター');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['grave'],
    apply(){ return null; },
    protectV21:{
      key:'バリア・リゾネーター', label:'バリア・リゾネーター',
      battle:(target) => e5MarkedThisTurn(target, 'e5BarrierTurn'),
      effect:false, scope:'allMonsters'
    },
    lpChange(info, self){
      const h = locateCardAnyV4(self);
      if(!h || info.player !== h.p) return null;
      if(info.cause !== 'battle') return null;
      if(!e5ShieldedInBattle(h.p, 'e5BarrierTurn', false)) return null;
      return info.delta < 0 ? 0 : null;
    }
  }
});

/* 5. ロケット戦士 — ①自分バトルフェイズ中、このカードは戦闘では破壊されず、
      このカードの戦闘で発生する自分への戦闘ダメージは0になる。
      ②モンスターに攻撃したダメージ計算後に発動する。
        攻撃対象モンスターの攻撃力はターン終了時まで500ダウンする */
function e5RocketAttacked(ctx){
  const b = ctx.battle || {};
  if(b.atkCard !== ctx.card) return null;
  return b.defCard || null;
}
defineScript('ロケット戦士', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){
    if(!e5FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!e5RocketAttacked(ctx)){
      ctx.reason = 'モンスターに攻撃したダメージ計算後に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const victim = e5RocketAttacked(ctx);
    const h = victim && locateCardAnyV4(victim);
    if(h && h.zone === 'mz') API.modAtk(h, -500, 0, 'endTurn', 'ロケット戦士');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return e5FaceUpMz(ctx) && !!e5RocketAttacked(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'ロケット戦士', label:'ロケット戦士',
      battle:(target, self) => {
        if(target !== self) return false;
        const h = locateCardAnyV4(self);
        return !!(h && gameState.phase === 'battle' && gameState.activePlayer === h.p);
      },
      effect:false
    },
    lpChange(info, self){
      const h = locateCardAnyV4(self);
      if(!h || info.player !== h.p) return null;
      if(info.cause !== 'battle') return null;
      if(gameState.phase !== 'battle' || gameState.activePlayer !== h.p) return null;
      if(!e5BattleOther(self)) return null;
      return info.delta < 0 ? 0 : null;
    }
  }
});

/* ===================== C. ダメージ計算時の増減・回復 ===================== */

/* 6. プライドの咆哮 — 戦闘ダメージ計算時、自分のモンスターの攻撃力が
      相手モンスターより低い場合、その攻撃力の差分のライフポイントを払って発動する。
      ダメージ計算時のみ、自分のモンスターの攻撃力は
      相手モンスターとの攻撃力の差の数値＋300ポイントアップする */
function e5PrideGap(ctx){
  const pair = e5BattlePair();
  if(!pair) return null;
  const mineIsAtk = (locateCardAnyV4(pair.atk) || {}).p === ctx.player;
  const mine = mineIsAtk ? pair.atk : pair.def;
  const foe  = mineIsAtk ? pair.def : pair.atk;
  const mh = locateCardAnyV4(mine);
  if(!mh || mh.p !== ctx.player) return null;
  const gap = baseAtkV14(foe) - baseAtkV14(mine);
  return gap > 0 ? { mine, foe, gap } : null;
}
defineScript('プライドの咆哮', {
  type:'trap', priority:2, dsTiming:'calc', damageStepOnly:true, activateFrom:['sz'],
  condition(ctx){
    const g = e5PrideGap(ctx);
    if(!g){
      ctx.reason = '自分のモンスターの攻撃力が低いダメージ計算時に発動します'; return false; }
    if(API.me(ctx).lp <= g.gap){
      ctx.reason = '攻撃力の差分のライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){
    const g = e5PrideGap(ctx);
    if(!g){ done(false); return; }
    ctx.e5PrideGap = g.gap;
    API.payCost(ctx.player, g.gap);
    done(true);
  },
  resolve(ctx){
    const g = e5PrideGap(ctx);
    const gap = Number(ctx.e5PrideGap) || (g ? g.gap : 0);
    const mine = g ? g.mine : null;
    const h = mine && locateCardAnyV4(mine);
    if(h && h.zone === 'mz' && gap > 0)
      API.modAtk(h, gap + 300, 0, 'endBattlePhase', 'プライドの咆哮');
  },
  afterResolve(){}
});

/* 7. フリッグのリンゴ — 自分フィールドにモンスターが存在せず、
      自分が戦闘ダメージを受けた時に発動できる。
      受けたダメージの数値分だけ自分のライフを回復し、
      「邪精トークン」1体を特殊召喚する。
      このトークンの攻撃力・守備力は、この効果で回復した数値と同じになる */
defineTokenSpecV11('邪精トークン',
  { name:'邪精トークン', atk:0, def:0, lv:1, ra:'悪魔', at:'闇', pos:'atk' });
function e5TookBattleDamage(ctx){
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return 0;
  if(e.player !== ctx.player) return 0;
  return Number(e.amount) || 0;
}
defineScript('フリッグのリンゴ', {
  type:'trap', priority:2, activateFrom:['sz'], timing:['damageStep','free'],
  condition(ctx){
    const n = e5TookBattleDamage(ctx);
    if(!(n > 0)){
      ctx.reason = '自分が戦闘ダメージを受けた時に発動します'; return false; }
    if((gameState.players[ctx.player].mz || []).length > 0){
      ctx.reason = '自分フィールドにモンスターが存在しない場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const n = e5TookBattleDamage(ctx);
    if(!(n > 0)) return;
    API.recoverLP(ctx.player, n);
    if((gameState.players[ctx.player].mz || []).length >= ZONE_LIMITS.mz) return;
    /* 攻守は回復した数値と同じ。数値はこの時点で確定させて literal で渡す。 */
    API.createTokens(ctx.player,
      { key:'邪精トークン', name:'邪精トークン', atk:n, def:n, lv:1,
        ra:'悪魔', at:'闇', pos:'atk' }, 1, null);
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return e5TookBattleDamage(ctx) > 0
        && (gameState.players[ctx.player].mz || []).length === 0; } }
});
