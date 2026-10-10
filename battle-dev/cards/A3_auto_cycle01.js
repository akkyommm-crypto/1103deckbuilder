/* Auto cycle 01 — READY30 preflight のうち実装可能と確定した 27 枚。
   engine は一切変更しない。既存 primitive のみを組み合わせる。
     A 戦闘破壊され墓地へ送られた時 : onDamageStep(dsTiming 既定 'leave') + battle context
     B ダメージ計算前/行わず破壊     : dsTiming 'start' + endBattle()（エイリン先例）
     C 戦闘を行った時の除外          : dsTiming 'after'（破壊処理前なのでまだ場にいる）
     D 戦闘ダメージを与えた時        : onBattleDamage（v6 payload）
     E 継続 cannotAttack            : continuous.cannotAttack → cannotAttackNow → canDeclareAttackV48
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 「このカードが戦闘によって破壊され墓地へ送られた時」。
   BATTLE_CLEANUP 後の 'leave' で呼ばれるので、この時点で自分は墓地にいる。
   除外置換で墓地に行かなかった場合は誘発しない（zone を見る）。 */
function a3SelfBattleDestroyed(ctx){
  if(ctx.zone !== 'grave') return false;
  const b = ctx.battle || {};
  if(!((b.defCard === ctx.card && b.destroyedDef) || (b.atkCard === ctx.card && b.destroyedAtk))) return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn);
}
/* 戦闘の相手側モンスター（自分が攻撃側でも守備側でも取れる） */
function a3BattleOther(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card) return b.defCard || null;
  if(b.defCard === ctx.card) return b.atkCard || null;
  return null;
}
/* いま自分が攻撃宣言している側か（ダメージ計算前用） */
function a3IsAttacker(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return false;
  return (gameState.players[b.player].mz || [])[b.atkIdx] === ctx.card;
}
/* 攻撃対象のモンスター */
function a3AttackTarget(){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  return (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target] || null;
}
/* 戦闘中（ダメージ計算前）の相手側モンスター。攻撃側・守備側の双方に対応。 */
function a3LiveBattleOther(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(atk === ctx.card) return def || null;
  if(def === ctx.card) return atk || null;
  return null;
}
/* 場のカードを1枚ずつ引き直しながら破壊する（index ずれを避ける） */
function a3DestroyCards(cards, reason){
  (cards || []).slice().forEach(c => {
    if(!c) return;
    const h = locateCardAnyV4(c);
    if(h && (h.zone === 'mz' || h.zone === 'sz' || h.zone === 'field')) API.destroy(h, reason);
  });
}
/* ダメージ計算を行わずに戦闘相手を破壊する */
function a3DestroyBeforeDamage(card, reason){
  const h = card && locateCardAnyV4(card);
  if(!h || h.zone !== 'mz'){ API.log(reason + '：対象が場にないため不発'); return; }
  API.destroy(h, reason);
  endBattle();
}
/* 表側表示モンスター全体（両者） */
function a3AllFaceUpMonsters(){
  return API.fieldCards({ zone:'mz', filter:x => x.card && x.card.face === 'up' });
}
/* 属性統一系（水以外を全破壊 等）の共通実装 */
function a3AttributeSweep(name, attr){
  defineScript(name, {
    type:'monster', priority:1, forced:true, activateFrom:['grave'],
    condition(ctx){
      if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
      return true;
    },
    resolve(ctx){
      const doomed = a3AllFaceUpMonsters().filter(x => dbOf(x.card).at !== attr).map(x => x.card);
      a3DestroyCards(doomed, name);
    },
    afterResolve(){},
    passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
  });
}
/* 「ダメージ計算を行わず／ダメージ計算前に破壊する」共通実装。
   pick(ctx) が破壊すべき相手モンスターを返す（対象外なら null）。 */
function a3PreDamageDestroy(name, pick){
  defineScript(name, {
    type:'monster', priority:1, forced:true, dsTiming:'start', targets:false,
    condition(ctx){
      if(!pick(ctx)){ ctx.reason = 'この効果の条件を満たす戦闘ではありません'; return false; }
      return true;
    },
    resolve(ctx){ a3DestroyBeforeDamage(pick(ctx), name); },
    afterResolve(){},
    passive:{ onDamageStep(ctx){ return !!pick(ctx); } }
  });
}

/* ===================== A. 戦闘破壊され墓地へ送られた時 ===================== */

/* 1. 氷結界の番人ブリズド — デッキから1枚ドロー */
defineScript('氷結界の番人ブリズド', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 2. 迷走悪魔 — お互いに800ライフ回復 */
defineScript('迷走悪魔', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.recoverLP(ctx.player, 800); API.recoverLP(ctx.opponent, 800); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
});

/* 3. マイン・ゴーレム — 相手ライフに500ダメージ */
defineScript('マイン・ゴーレム', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
});

/* 4. ニュードリュア — フィールドのモンスター1体を破壊 */
defineScript('ニュードリュア', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!API.fieldCards({ zone:'mz' }).length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ニュードリュア：破壊するモンスター', API.fieldCards({ zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.destroy(r, 'ニュードリュア');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && API.fieldCards({ zone:'mz' }).length > 0; } }
});

/* 5. フレムベル・パウン — デッキから守備力200のモンスター1体を手札へ（任意） */
function a3PawnTargets(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && !x.db.ex && Number(x.db.def) === 200);
}
defineScript('フレムベル・パウン', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!a3PawnTargets(ctx.player).length){ ctx.reason = 'デッキに守備力200のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('フレムベル・パウン：手札に加える守備力200のモンスター', a3PawnTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.searchDeck(ctx.player, r.index, 'フレムベル・パウン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && a3PawnTargets(ctx.player).length > 0; } }
});

/* 6. モジャ — 自分の墓地のレベル4の獣族モンスター1体を手札へ（任意） */
function a3MojaTargets(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '獣' && Number(x.db.lv) === 4);
}
defineScript('モジャ', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!a3MojaTargets(ctx.player).length){ ctx.reason = '墓地にレベル4の獣族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('モジャ：手札に加えるレベル4の獣族', a3MojaTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, 'モジャ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && a3MojaTargets(ctx.player).length > 0; } }
});

/* 7-11. 属性統一系。表側表示の「その属性以外」を全て破壊する。 */
a3AttributeSweep('サイレントアビス', '水');
a3AttributeSweep('シャインスピリッツ', '光');
a3AttributeSweep('ダークネスソウル', '闇');
a3AttributeSweep('デスサイクロン', '風');
a3AttributeSweep('ヘルプロミネンス', '炎');

/* 12. A・ボム — 光属性モンスターとの戦闘で破壊された時、フィールドのカード2枚を破壊 */
function a3ABombFieldAll(){
  return API.fieldCards({ filter:x => x.zone === 'mz' || x.zone === 'sz' || x.zone === 'field' });
}
function a3ABombOk(ctx){
  if(!a3SelfBattleDestroyed(ctx)) return false;
  const other = a3BattleOther(ctx);
  return !!(other && dbOf(other).at === '光');
}
defineScript('A・ボム', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3ABombOk(ctx)){ ctx.reason = '光属性モンスターとの戦闘で破壊された場合に発動します'; return false; }
    if(a3ABombFieldAll().length < 2){ ctx.reason = 'フィールドのカードが2枚必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('A・ボム：破壊するカード（1枚目）', a3ABombFieldAll(), a =>
      API.selectCard('A・ボム：破壊するカード（2枚目）',
        a3ABombFieldAll().filter(x => x.card !== a.card), b => done([a, b])));
  },
  resolve(ctx){
    a3DestroyCards((ctx.selectedTargets || []).map(t => t.card), 'A・ボム');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3ABombOk(ctx) && a3ABombFieldAll().length >= 2; } }
});

/* 13. チェイス・スカッド — 守備表示モンスターが戦闘破壊された時、相手に500ダメージ。
   自分は場に残ったまま誘発する。守備表示だったかは v30 B3 の graveInfo.pos で見る。 */
function a3ChaseOk(ctx){
  if(ctx.zone !== 'mz' || ctx.card.face !== 'up') return false;
  const b = ctx.battle || {};
  const victims = [];
  if(b.destroyedDef && b.defCard) victims.push(b.defCard);
  if(b.destroyedAtk && b.atkCard) victims.push(b.atkCard);
  return victims.some(c => {
    const g = c && c.graveInfo;
    return !!(g && g.byDestroy && g.from === 'mz' && g.pos === 'def' && g.turn === gameState.turn);
  });
}
defineScript('チェイス・スカッド', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a3ChaseOk(ctx)){ ctx.reason = '守備表示モンスターが戦闘破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3ChaseOk(ctx); } }
});

/* ===================== B. ダメージ計算前 / 行わず破壊 ===================== */

/* 14. ドリルロイド — 守備表示モンスターを攻撃した場合、ダメージ計算前に破壊 */
a3PreDamageDestroy('ドリルロイド', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def') ? d : null;
});

/* 15. ズババナイト — 表側守備表示を攻撃した場合、ダメージ計算を行わず破壊 */
a3PreDamageDestroy('ズババナイト', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && d.face === 'up') ? d : null;
});

/* 16. 忍者マスター SASUKE — 表側守備表示を攻撃した場合、ダメージ計算を行わず破壊 */
a3PreDamageDestroy('忍者マスター SASUKE', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && d.face === 'up') ? d : null;
});

/* 17. ナノブレイカー — レベル3以下の表側表示モンスターを攻撃した場合 */
a3PreDamageDestroy('ナノブレイカー', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.face === 'up' && curLV(d) <= 3) ? d : null;
});

/* 18. 円盤闘士 — 守備力2000以上の守備表示モンスターを攻撃した場合 */
a3PreDamageDestroy('円盤闘士', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && curDEF(d) >= 2000) ? d : null;
});

/* 19. 一刀両断侍 — 裏側守備表示を攻撃した場合、裏側守備表示のまま破壊 */
a3PreDamageDestroy('一刀両断侍', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && d.face === 'down') ? d : null;
});

/* 20. A・O・J コアデストロイ — 光属性モンスターと戦闘を行う場合（攻撃側・守備側の双方） */
a3PreDamageDestroy('A・O・J コアデストロイ', ctx => {
  const o = a3LiveBattleOther(ctx);
  return (o && dbOf(o).at === '光') ? o : null;
});

/* 21. BF－空風のジン — 自身の攻撃力以下の守備力を持つ表側表示モンスターと戦闘を行う場合 */
a3PreDamageDestroy('BF－空風のジン', ctx => {
  const o = a3LiveBattleOther(ctx);
  return (o && o.face === 'up' && curDEF(o) <= curATK(ctx.card)) ? o : null;
});

/* ===================== C. 戦闘を行った時の除外 ===================== */
/* dsTiming 'after' はダメージ計算後・戦闘破壊処理前なので、
   破壊された側もまだモンスターゾーンにいる。そこで除外する。 */

/* 23. 異次元の戦士 — モンスターと戦闘を行った時、そのモンスターとこのカードを除外 */
defineScript('異次元の戦士', {
  type:'monster', priority:1, forced:true, dsTiming:'after', targets:false,
  condition(ctx){
    if(!a3BattleOther(ctx)){ ctx.reason = 'モンスターと戦闘を行った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a3BattleOther(ctx);
    const oh = o && locateCardAnyV4(o);
    if(oh && oh.zone === 'mz') API.banish(oh, '異次元の戦士');
    const sh = locateCardAnyV4(ctx.card);
    if(sh && sh.zone === 'mz') API.banish(sh, '異次元の戦士');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a3BattleOther(ctx); } }
});

/* 24. A・O・J アンノウン・クラッシャー — 光属性モンスターと戦闘を行った時、そのモンスターを除外 */
defineScript('A・O・J アンノウン・クラッシャー', {
  type:'monster', priority:1, forced:true, dsTiming:'after', targets:false,
  condition(ctx){
    const o = a3BattleOther(ctx);
    if(!(o && dbOf(o).at === '光')){ ctx.reason = '光属性モンスターと戦闘を行った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a3BattleOther(ctx);
    const oh = o && locateCardAnyV4(o);
    if(oh && oh.zone === 'mz') API.banish(oh, 'A・O・J アンノウン・クラッシャー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ const o = a3BattleOther(ctx); return !!(o && dbOf(o).at === '光'); } }
});

/* ===================== D. 戦闘ダメージを与えた時 ===================== */

/* このカードが相手ライフに戦闘ダメージを与えたか。
   攻撃側だけでなく、攻撃されて相手に反射ダメージを与えた場合も含む。 */
function a3DealtBattleDamage(ctx){
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = ctx.card && ctx.card.uid;
  if(uid == null) return false;
  return e.attackerUid === uid || e.defenderUid === uid;
}

/* 26. ブラッド・サッカー — 相手のデッキの上から1枚墓地へ */
defineScript('ブラッド・サッカー', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!API.foe(ctx).deck.length){ ctx.reason = '相手のデッキがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.millTop(ctx.opponent, 1, 'ブラッド・サッカー'); },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){ return a3DealtBattleDamage(ctx) && API.foe(ctx).deck.length > 0; } }
});

/* 27. 黒蠍盗掘団 — 相手がデッキから魔法カード1枚を選んで墓地へ送る。
   選ぶのは相手なので、相手private choice（v49 requestChoice）で処理する。
   自分のデッキ内容が相手へ漏れないよう、候補は相手のデッキだけを渡す。 */
API.registerChoiceHandler('a3.opponent-deck-spell', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'deck') API.sendToGrave(h, x.reason || '黒蠍盗掘団');
  });
  API.shuffle(x.player);
});
function a3ClifSpells(p){ return API.pileCards(p, 'deck', x => x.db.k === 's'); }
defineScript('黒蠍盗掘団', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!a3ClifSpells(ctx.opponent).length){ ctx.reason = '相手のデッキに魔法カードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = a3ClifSpells(ctx.opponent);
    if(!q.length) return;
    API.requestChoice({
      player: ctx.opponent, kind:'card', title:'黒蠍盗掘団：墓地へ送る魔法カード',
      candidates: q, min:1, max:1,
      resume:{ handler:'a3.opponent-deck-spell', args:{ player: ctx.opponent, reason:'黒蠍盗掘団' } }
    });
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){ return a3DealtBattleDamage(ctx) && a3ClifSpells(ctx.opponent).length > 0; } }
});

/* 28. ボルテック・コング — 自分の表側光属性モンスターの数だけ相手デッキトップを墓地へ */
function a3KongCount(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.at === '光' }).length;
}
defineScript('ボルテック・コング', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!a3KongCount(ctx.player)){ ctx.reason = '自分フィールドに表側の光属性モンスターがいません'; return false; }
    if(!API.foe(ctx).deck.length){ ctx.reason = '相手のデッキがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = Math.min(a3KongCount(ctx.player), API.foe(ctx).deck.length);
    if(n > 0) API.millTop(ctx.opponent, n, 'ボルテック・コング');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return a3DealtBattleDamage(ctx) && a3KongCount(ctx.player) > 0 && API.foe(ctx).deck.length > 0; } }
});

/* ===================== E. 継続効果による攻撃制限 ===================== */

/* 29. グラヴィティ・バインド－超重力の網－ — レベル4以上のモンスターは攻撃できない */
defineScript('グラヴィティ・バインド－超重力の網－', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(){ API.log('グラヴィティ・バインド－超重力の網－：レベル4以上のモンスターは攻撃できない'); },
  afterResolve(){},                 /* 永続罠なので場に残る */
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(target){ return curLV(target) >= 4; }
  }
});
