/* Auto cycle 04 — 19枚。engine 変更なし。
     T ダメージステップ攻守変化 : continuous.apply（cycle03 の a5DamageStepAtkUp を拡張）
     U 戦闘破壊耐性             : continuous.battleProof
     V 貫通                     : continuous.piercingDamage
     W 直接攻撃                 : canDirectAttack + onBattlePhaseEnd
     Y 戦闘破壊時の追加処理     : dsTiming 'after' / onBattlePhaseEnd
     Z 手札コスト系             : v16 LevelModifier / 除外 / LP回復
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* ダメージステップ限定の自己攻守変化。gain(self) は {atk,def} か数値（atkのみ）を返す。 */
function a6DamageStepStat(name, gain, extra){
  defineScript(name, Object.assign({
    type:'monster', priority:1,
    continuous:{
      scope:'self', from:['mz'],
      apply(target, self){
        if(target !== self) return null;
        if(!a5InDamageStep()) return null;
        const g = gain(self);
        if(g == null) return null;
        if(typeof g === 'number') return g !== 0 ? { atk:g } : null;
        if(!g.atk && !g.def) return null;
        return { atk:g.atk || 0, def:g.def || 0 };
      }
    }
  }, extra || {}));
}
/* 自分が戦闘で相手モンスターを破壊したか（dsTiming 'after' 時点ではまだ場にいる） */
function a6DestroyedFoeInBattle(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
/* 「このカードを手札から墓地へ送って発動する」共通コスト */
function a6HandCost(ctx, done, label){
  const P = API.me(ctx);
  const i = (P.hand || []).indexOf(ctx.card);
  if(i < 0){ done(false); return; }
  API.sendHandToGrave(ctx.player, i, label);
  done(true);
}

/* ===================== T. ダメージステップ攻守変化 ===================== */

/* 1. A・O・J ガラドホルグ — 光属性と戦闘を行う場合 +200 */
a6DamageStepStat('A・O・J ガラドホルグ', self => {
  const o = a5BattleOtherOf(self);
  return (o && dbOf(o).at === '光') ? 200 : 0;
});

/* 2. A・O・J ルドラ — 光属性と戦闘を行う場合 +700 */
a6DamageStepStat('A・O・J ルドラ', self => {
  const o = a5BattleOtherOf(self);
  return (o && dbOf(o).at === '光') ? 700 : 0;
});

/* 3. スチームロイド — 攻撃する場合 +500 / 攻撃される場合 -500 */
a6DamageStepStat('スチームロイド', self => {
  const o = a5BattleOtherOf(self);
  if(!o) return 0;                       /* 直接攻撃では変化しない */
  return a5IsAttackerCard(self) ? 500 : -500;
});

/* 4. 暗黒ヴェロキ — 攻撃する場合 +400 / 攻撃された場合 -400 */
a6DamageStepStat('暗黒ヴェロキ', self => {
  const o = a5BattleOtherOf(self);
  if(!o) return 0;
  return a5IsAttackerCard(self) ? 400 : -400;
});

/* 5. サイファー・スカウター — 戦士族と戦闘を行うダメージ計算時のみ 攻守+2000 */
a6DamageStepStat('サイファー・スカウター', self => {
  const o = a5BattleOtherOf(self);
  return (o && dbOf(o).ra === '戦士') ? { atk:2000, def:2000 } : null;
});

/* 6. ダークネス・デストロイヤー — 特殊召喚できない／貫通／1度のバトルフェイズ中に2回攻撃 */
defineScript('ダークネス・デストロイヤー', {
  type:'monster', priority:1,
  cannotSpecialSummon:true,
  attackLimit:2,
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard !== info.self || !info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    }
  }
});

/* ===================== U. 戦闘破壊耐性 ===================== */

/* 7. カイザー・グライダー — ①同じ攻撃力との戦闘では破壊されない
   ②破壊され墓地へ送られた場合、フィールドのモンスター1体を持ち主の手札へ戻す */
defineScript('カイザー・グライダー', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  /* テキスト既定の「戦闘では破壊されない」判定を切り、条件付きの continuous だけを効かせる。 */
  battleProof:false,
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)){
      ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    if(!API.fieldCards({ zone:'mz' }).length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('カイザー・グライダー：手札に戻すモンスター', API.fieldCards({ zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.returnToHand(r, 'カイザー・グライダー');
  },
  afterResolve(){},
  passive:{
    onDestroy(ctx){
      const g = ctx.card.graveInfo;
      return ctx.zone === 'grave' && !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)
        && API.fieldCards({ zone:'mz' }).length > 0;
    }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    /* 同じ攻撃力のモンスターとの戦闘では破壊されない */
    battleProof(target, self){
      const me = self || target;
      const o = a5BattleOtherOf(me);
      return !!(o && curATK(o) === curATK(me));
    }
  }
});

/* 8. ワンショット・ロケット — 攻撃する場合その戦闘では破壊されない。
   攻撃を行ったダメージ計算後、攻撃対象モンスターの攻撃力の半分を相手ライフへ。 */
defineScript('ワンショット・ロケット', {
  type:'monster', priority:1, forced:true, dsTiming:'after', targets:false,
  /* 同上。攻撃している時だけ耐性を持つ。 */
  battleProof:false,
  condition(ctx){
    const b = ctx.battle || {};
    if(!(b.atkCard === ctx.card && b.defCard)){ ctx.reason = 'このカードが攻撃した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || {};
    if(!b.defCard) return;
    const half = Math.floor(Math.max(0, curATK(b.defCard)) / 2);
    if(half > 0) API.damageLP(ctx.opponent, half);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    return !!(b.atkCard === ctx.card && b.defCard); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    battleProof(target, self){
      const me = self || target;
      return a5IsAttackerCard(me);
    }
  }
});

/* ===================== W. 直接攻撃 ===================== */

/* 9. ゴブリン暗殺部隊 — 直接攻撃できる。攻撃した場合バトルフェイズ終了時に守備表示になり、
   次の自分のターン終了時まで表示形式を変更できない。 */
defineScript('ゴブリン暗殺部隊', {
  type:'monster', priority:1, forced:true,
  canDirectAttack:true,
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!ctx.card.attacked){ ctx.reason = '攻撃した場合に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.changePosition(me, 'def', 'ゴブリン暗殺部隊');
    /* 「次の自分のターン終了時まで」＝ 現在ターン＋2（相手ターンを挟む）まで固定する。 */
    API.setCardFlag(me, 'a6GoblinLockUntil', gameState.turn + 2, 'ゴブリン暗殺部隊');
  },
  afterResolve(){},
  passive:{ onBattlePhaseEnd(ctx){
    return ctx.zone === 'mz' && !!ctx.card.attacked; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(target, self){
      const me = self || target;
      const until = Number(me && me.a6GoblinLockUntil) || 0;
      return gameState.turn <= until;
    }
  }
});

/* ===================== Y. 戦闘破壊時の追加処理 ===================== */

/* 10. 聖導騎士イシュザーク — 戦闘によって破壊したモンスターを除外する */
defineScript('聖導騎士イシュザーク', {
  type:'monster', priority:1, forced:true, dsTiming:'after', targets:false,
  condition(ctx){
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘によってモンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = a6DestroyedFoeInBattle(ctx);
    const h = v && locateCardAnyV4(v);
    if(h && h.zone === 'mz') API.banish(h, '聖導騎士イシュザーク');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a6DestroyedFoeInBattle(ctx); } }
});

/* 11. ブルーサンダーT45 — 相手モンスターを戦闘破壊した場合「サンダーオプショントークン」1体。
   そのトークンはアドバンス召喚のためにリリースできない。 */
defineScript('ブルーサンダーT45', {
  type:'monster', priority:1, forced:true, dsTiming:'after', includesSpecialSummon:true,
  condition(ctx){
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    API.createToken(ctx.player,
      { key:'サンダーオプショントークン', name:'サンダーオプショントークン',
        atk:1500, def:1500, lv:4, ra:'機械', at:'光', pos:'atk' }, 1);
    /* アドバンス召喚のためのリリースを禁じる（既存の cannotTribute を使う）。 */
    const mz = API.me(ctx).mz || [];
    const t = mz[mz.length - 1];
    if(t){
      const h = locateCardAnyV4(t);
      if(h) API.setCardFlag(h, 'cannotTribute', true, 'ブルーサンダーT45');
    }
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!a6DestroyedFoeInBattle(ctx) && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 12. ファイナルサイコオーガ — 相手モンスターを戦闘破壊した場合、800払って
   墓地のサイキック族1体を手札に加える（任意） */
function a6PsychicGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === 'サイキック');
}
defineScript('ファイナルサイコオーガ', {
  type:'monster', priority:1, dsTiming:'after', targets:true,
  condition(ctx){
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(API.me(ctx).lp <= 800){ ctx.reason = '800ライフポイントを払えません'; return false; }
    if(!a6PsychicGrave(ctx.player).length){ ctx.reason = '墓地にサイキック族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 800); done(true); },
  selectTargets(ctx, done){
    API.selectCard('ファイナルサイコオーガ：手札に加えるサイキック族', a6PsychicGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, 'ファイナルサイコオーガ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!a6DestroyedFoeInBattle(ctx) && API.me(ctx).lp > 800 && a6PsychicGrave(ctx.player).length > 0; } }
});

/* 13. ヴァンパイア・ベビー — 戦闘で破壊したモンスターを、バトルフェイズ終了時に
   墓地から自分フィールドへ特殊召喚できる（任意）。
   collectHandlers は候補判定中に盤面を変えてはいけないので、passive では何も書かない。
   「このカードが戦闘破壊した相手」は、既存の battlePhaseV6.attacks（このバトルフェイズの
   攻撃履歴）と v30 の destroyedThisTurnV30（戦闘破壊の記録）を突き合わせて読み取る。 */
function a6BabyVictims(ctx){
  const st = gameState.battlePhaseV6;
  const atks = (st && Array.isArray(st.attacks)) ? st.attacks : [];
  const myUid = ctx.card && ctx.card.uid;
  if(myUid == null) return [];
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  const out = [];
  atks.forEach(a => {
    if(!a) return;
    let other = null;
    if(a.attackerUid === myUid) other = a.defenderUid;
    else if(a.defenderUid === myUid) other = a.attackerUid;
    if(other == null) return;
    const killed = log.some(x => x && x.battle && x.uid === other
      && x.turn === gameState.turn && x.from === 'mz');
    if(!killed) return;
    const h = findCardByUid(other);
    if(h && h.zone === 'grave' && out.indexOf(h.card) < 0) out.push(h.card);
  });
  return out;
}
defineScript('ヴァンパイア・ベビー', {
  type:'monster', priority:1, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(!a6BabyVictims(ctx).length){ ctx.reason = '戦闘で破壊したモンスターが墓地にいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヴァンパイア・ベビー：特殊召喚するモンスター',
      a6BabyVictims(ctx).map(c => locateCardAnyV4(c)).filter(Boolean), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ヴァンパイア・ベビー', r.p);
  },
  afterResolve(){},
  passive:{ onBattlePhaseEnd(ctx){
    return a6BabyVictims(ctx).length > 0 && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* ===================== X. 数に応じた継続攻守 ===================== */

/* 14. 超熱血球児 — 他の炎属性1体につき攻撃力+1000。
   他の炎属性モンスターが墓地へ送られる度に相手へ500ダメージ。 */
defineScript('超熱血球児', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    const e = ctx.event || {};
    const c = e.card || (e.uid != null ? (findCardByUid(e.uid) || {}).card : null);
    if(!c || c === ctx.card){ ctx.reason = 'このカード以外の炎属性モンスターが墓地へ送られた場合に発動します'; return false; }
    if(dbOf(c).k !== 'm' || dbOf(c).at !== '炎'){ ctx.reason = '炎属性モンスターではありません'; return false; }
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    const e = ctx.event || {};
    const c = e.card || (e.uid != null ? (findCardByUid(e.uid) || {}).card : null);
    return !!(c && c !== ctx.card && dbOf(c).k === 'm' && dbOf(c).at === '炎'
      && ctx.zone === 'mz' && ctx.card.face === 'up'); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      const n = API.fieldCards({ zone:'mz',
        filter:x => x.card !== self && x.card.face === 'up' && x.db.at === '炎' }).length;
      return n > 0 ? { atk:1000 * n } : null;
    }
  }
});

/* 15. 終焉の精霊 — 攻撃力・守備力は除外されている闇属性モンスターの数×300 になる。
   破壊され墓地へ送られた時、除外されている闇属性モンスターを全て墓地へ戻す。 */
function a6BanishedDark(){
  return API.pileCards(0, 'banish', x => x.db.k === 'm' && x.db.at === '闇')
    .concat(API.pileCards(1, 'banish', x => x.db.k === 'm' && x.db.at === '闇'));
}
defineScript('終焉の精霊', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)){
      ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    if(!a6BanishedDark().length){ ctx.reason = '除外されている闇属性モンスターがいません'; return false; }
    return true;
  },
  resolve(){
    a6BanishedDark().slice().forEach(x => {
      const r = resolveTarget(x);
      if(r && r.zone === 'banish') API.sendToGrave(r, '終焉の精霊');
    });
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){
    const g = ctx.card.graveInfo;
    return ctx.zone === 'grave' && !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)
      && a6BanishedDark().length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      const n = a6BanishedDark().length;
      return { setAtk:300 * n, setDef:300 * n };
    }
  }
});

/* ===================== Z. 手札コスト系 ===================== */

/* 16/17. 寂々虫／騒々虫 — 手札から墓地へ送って、モンスター1体のレベルを
   エンドフェイズ時まで1つ下げる／上げる */
function a6LevelShifter(name, delta){
  defineScript(name, {
    type:'monster', priority:1, targets:true, activateFrom:['hand'], timing:['mainPhase'],
    condition(ctx){
      if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
      if(!API.fieldCards({ zone:'mz' }).length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){ a6HandCost(ctx, done, name + '（コスト）'); },
    selectTargets(ctx, done){
      API.selectCard(name + '：レベルを変えるモンスター', API.fieldCards({ zone:'mz' }), t => done([t]));
    },
    resolve(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(r && r.zone === 'mz') API.modLevel(r, delta, 'endPhase', name);
    },
    afterResolve(){}
  });
}
a6LevelShifter('寂々虫', -1);
a6LevelShifter('騒々虫', 1);

/* 18. A・O・J サイクルリーダー — 手札から捨てて、相手の墓地の光属性を2体まで除外。
   相手ターンでも発動できる。 */
function a6FoeLightGrave(ctx){
  return API.pileCards(ctx.opponent, 'grave', x => x.db.k === 'm' && x.db.at === '光');
}
defineScript('A・O・J サイクルリーダー', {
  type:'monster', priority:2, targets:true, activateFrom:['hand'],
  timing:['mainPhase','battlePhase','opponentTurn'],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!a6FoeLightGrave(ctx).length){ ctx.reason = '相手の墓地に光属性モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const P = API.me(ctx);
    const i = (P.hand || []).indexOf(ctx.card);
    if(i < 0){ done(false); return; }
    API.discard(ctx.player, i, 'A・O・J サイクルリーダー（コスト）', { byEffect:true, byPlayer:ctx.player });
    done(true);
  },
  selectTargets(ctx, done){
    const q = a6FoeLightGrave(ctx);
    API.selectCard('A・O・J サイクルリーダー：除外する光属性（1枚目）', q, a => {
      const rest = a6FoeLightGrave(ctx).filter(x => x.card !== a.card);
      if(!rest.length){ done([a]); return; }
      API.selectCard('A・O・J サイクルリーダー：除外する光属性（2枚目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    (ctx.selectedTargets || []).slice().forEach(t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'grave') API.banish(r, 'A・O・J サイクルリーダー');
    });
  },
  afterResolve(){}
});

/* 19. 生存本能 — 墓地の恐竜族を任意の枚数除外し、1体につき400ライフ回復 */
API.registerChoiceHandler('a6.survival', (a, x) => {
  const picked = ((a && a.cards) || []).filter(t => t && !t.stale);
  let n = 0;
  picked.forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave'){ API.banish(h, '生存本能'); n++; }
  });
  if(n > 0) API.recoverLP(x.player, n * 400);
});
function a6DinoGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '恐竜');
}
defineScript('生存本能', {
  type:'trap', priority:2,
  condition(ctx){
    if(!a6DinoGrave(ctx.player).length){ ctx.reason = '墓地に恐竜族モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = a6DinoGrave(ctx.player);
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', title:'生存本能：除外する恐竜族（任意の枚数）',
      candidates: q, min:0, max:q.length,
      resume:{ handler:'a6.survival', args:{ player: ctx.player } }
    });
  },
  afterResolve(){}
});
