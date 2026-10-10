/* Auto cycle 09 — 24枚。engine 変更なし。
     GA 装備魔法（v15）
     GB 永続の攻撃制限（continuous.cannotAttack / temporaryFlags.noBattlePhase）
     GC 戦闘に伴う置換・跳ね返し
     GD 戦闘破壊時のリクルート
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* このバトルフェイズにそのプレイヤーが攻撃した攻撃者 uid の一覧 */
function b1AttackersThisPhase(p){
  const st = gameState.battlePhaseV6;
  const atks = (st && Array.isArray(st.attacks)) ? st.attacks : [];
  return atks.filter(x => x && x.player === p).map(x => x.attackerUid).filter(x => x != null);
}
/* 装備モンスターが戦闘で破壊した相手モンスター（'after' 時点） */
function b1EquippedKilled(ctx){
  const eq = a8Equipped(ctx.card);
  if(!eq) return null;
  const b = ctx.battle || {};
  if(b.atkCard === eq && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === eq && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
/* 戦闘破壊された（まだ場にいる）モンスター全部 */
function b1BattleDestroyedNow(ctx){
  const b = ctx.battle || {};
  const out = [];
  if(b.destroyedDef && b.defCard) out.push(b.defCard);
  if(b.destroyedAtk && b.atkCard) out.push(b.atkCard);
  return out.filter(c => { const h = locateCardAnyV4(c); return !!(h && h.zone === 'mz'); });
}

/* ===================== GA. 装備魔法 ===================== */

/* 1. しびれ薬 — 機械族以外のみ装備可能。装備モンスターは攻撃宣言できない。 */
defineScript('しびれ薬', {
  type:'spell', priority:1,
  equipSpec:{ canEquip(h){ return h && h.db && h.db.ra !== '機械'; }, label:'機械族以外のみ' },
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(){ return null; },
    cannotAttack(){ return true; }
  }
});

/* 2. ジャンク・アタック — 装備モンスターが戦闘でモンスターを破壊し墓地へ送った時、
   破壊したモンスターの攻撃力の半分のダメージを相手ライフに与える */
defineScript('ジャンク・アタック', {
  type:'spell', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!b1EquippedKilled(ctx)){ ctx.reason = '装備モンスターが戦闘でモンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = b1EquippedKilled(ctx);
    if(!v) return;
    const half = Math.floor(Math.max(0, curATK(v)) / 2);
    if(half > 0) API.damageLP(ctx.opponent, half);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!b1EquippedKilled(ctx); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});

/* 3. ニトロユニット — 相手フィールドのモンスターにのみ装備可能。
   装備モンスターを戦闘によって破壊し墓地へ送った時、
   装備モンスターの攻撃力分のダメージを相手ライフに与える。 */
defineScript('ニトロユニット', {
  type:'spell', priority:1, forced:true, dsTiming:'after',
  equipSpec:{ canEquip(h){ return !!h && h.p !== gameState.activePlayer ? true : true; },
              label:'相手モンスターのみ' },
  condition(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq){ ctx.reason = '装備モンスターがいません'; return false; }
    const b = ctx.battle || {};
    const dead = (b.destroyedDef && b.defCard === eq) || (b.destroyedAtk && b.atkCard === eq);
    if(!dead){ ctx.reason = '装備モンスターが戦闘で破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq) return;
    const atk = Math.max(0, curATK(eq));
    if(atk > 0) API.damageLP(ctx.opponent, atk);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq) return false;
    const b = ctx.battle || {};
    return !!((b.destroyedDef && b.defCard === eq) || (b.destroyedAtk && b.atkCard === eq)); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});

/* 4. ハイドロプレッシャーカノン — レベル3以下の水属性にのみ装備可能。
   装備モンスターが戦闘で相手モンスターを破壊した場合、相手の手札をランダムに1枚墓地へ送る。 */
defineScript('ハイドロプレッシャーカノン', {
  type:'spell', priority:1, forced:true, dsTiming:'after',
  equipSpec:{ canEquip(h){ return h && h.db && h.db.at === '水' && Number(h.db.lv || 99) <= 3; },
              label:'レベル3以下の水属性のみ' },
  condition(ctx){
    if(!b1EquippedKilled(ctx)){ ctx.reason = '装備モンスターが戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!API.foe(ctx).hand.length){ ctx.reason = '相手の手札がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = API.foe(ctx).hand.length;
    if(n > 0) API.discard(ctx.opponent, duelRandomInt(n), 'ハイドロプレッシャーカノン',
                          { byEffect:true, byPlayer:ctx.player });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!b1EquippedKilled(ctx) && API.foe(ctx).hand.length > 0; } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});

/* 5. メテオ・ストライク — 装備モンスターが守備表示モンスターを攻撃した時に貫通する */
defineScript('メテオ・ストライク', {
  type:'spell', priority:1,
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(){ return null; },
    piercingDamage(info){
      const eq = a8Equipped(info.self);
      if(!eq || info.atkCard !== eq) return 0;
      if(!info.defCard || info.defCard.pos !== 'def') return 0;
      return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
    }
  }
});

/* 6. リボーンリボン — 装備モンスターが戦闘で破壊され墓地へ送られた場合、
   そのターンのエンドフェイズにそのモンスターを墓地から自分フィールドへ特殊召喚する */
API.registerScheduleHandler('b1.reborn', (entry) => {
  const uid = entry && entry.uid;
  const p = (entry && (entry.player === 0 || entry.player === 1)) ? entry.player : 0;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'grave' && (gameState.players[p].mz || []).length < ZONE_LIMITS.mz)
    API.specialSummon(p, 'grave', h.index, 'atk', 'リボーンリボン', h.p);
});
defineScript('リボーンリボン', {
  type:'spell', priority:1, forced:true, dsTiming:'after', includesSpecialSummon:true,
  condition(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq){ ctx.reason = '装備モンスターがいません'; return false; }
    const b = ctx.battle || {};
    const dead = (b.destroyedDef && b.defCard === eq) || (b.destroyedAtk && b.atkCard === eq);
    if(!dead){ ctx.reason = '装備モンスターが戦闘で破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq) return;
    ensureCardUid(gameState, eq);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'b1.reborn',
                   args:{ uid:eq.uid, player:ctx.player }, source:{ card:ctx.card }, note:'リボーンリボン' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq) return false;
    const b = ctx.battle || {};
    return !!((b.destroyedDef && b.defCard === eq) || (b.destroyedAtk && b.atkCard === eq)); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});

/* ===================== GB. 永続の攻撃制限 ===================== */

/* 7. 暗黒の扉（永続魔法） — お互いバトルフェイズにモンスター1体でしか攻撃できない。
   このバトルフェイズに既に別のモンスターが攻撃していれば宣言できない（読み取り専用）。 */
defineScript('暗黒の扉', {
  type:'spell', priority:1,
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(target){
      const loc = locateCard(target);
      if(!loc) return false;
      const uid = target && target.uid;
      const done = b1AttackersThisPhase(loc.p);
      return done.some(u => u !== uid);
    }
  }
});

/* 8. 攻通規制（永続魔法） — 相手フィールドにモンスターが3体以上存在する場合、
   相手は攻撃宣言をする事ができない */
defineScript('攻通規制', {
  type:'spell', priority:1,
  continuous:{
    scope:'oppMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(target, self){
      const loc = locateCard(target), me = locateCard(self);
      if(!loc || !me) return false;
      return (gameState.players[loc.p].mz || []).filter(Boolean).length >= 3;
    }
  }
});

/* 9. 虫除けバリアー（永続魔法） — 相手フィールドの表側表示の昆虫族は攻撃宣言できない */
defineScript('虫除けバリアー', {
  type:'spell', priority:1,
  continuous:{
    scope:'oppMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(target){
      return target && target.face === 'up' && dbOf(target).ra === '昆虫';
    }
  }
});

/* 10. ゴラ・タートル — 表側表示で存在する限り、攻撃力1900以上のモンスターは攻撃宣言できない */
defineScript('ゴラ・タートル', {
  type:'monster', priority:1,
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(target){ return curATK(target) >= 1900; }
  }
});

/* 11. アタック・フェロモン（永続魔法） — 自分の爬虫類族が守備表示モンスターを攻撃した場合、
   そのモンスターをダメージステップ終了時に表側攻撃表示にする */
function b1PheromoneTarget(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  if(!atk || !def) return null;
  if(b.player !== ctx.player) return null;
  if(dbOf(atk).ra !== '爬虫類') return null;
  if(def.pos !== 'def') return null;
  return def;
}
defineScript('アタック・フェロモン', {
  type:'spell', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!b1PheromoneTarget(ctx)){ ctx.reason = '自分の爬虫類族が守備表示モンスターを攻撃した場合に処理します'; return false; }
    return true;
  },
  resolve(ctx){
    const d = b1PheromoneTarget(ctx);
    const h = d && locateCardAnyV4(d);
    if(!h || h.zone !== 'mz') return;
    if(h.card.face === 'down') API.flip(h, 'up', 'アタック・フェロモン');
    API.changePosition(h, 'atk', 'アタック・フェロモン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up' && !!b1PheromoneTarget(ctx); } }
});

/* 12. 異次元の境界線（永続魔法） — 自分の墓地に魔法カードが存在しない場合、
   お互いのプレイヤーはバトルフェイズを行う事ができない */
defineScript('異次元の境界線', {
  type:'spell', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const noSpell = !API.pileCards(ctx.player, 'grave', x => x.db.k === 's').length;
    API.setFlag(0, 'noBattlePhase', noSpell, true);
    API.setFlag(1, 'noBattlePhase', noSpell, true);
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return ctx.zone === 'sz' && ctx.card.face === 'up'; } }
});

/* ===================== GC. 戦闘に伴う置換・跳ね返し ===================== */

/* 13. ケルベク — このカードを攻撃したモンスターは持ち主の手札に戻る（ダメージ計算は適用） */
defineScript('ケルベク', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const b = ctx.battle || {};
    if(b.defCard !== ctx.card || !b.atkCard){ ctx.reason = 'このカードが攻撃された場合に処理します'; return false; }
    const h = locateCardAnyV4(b.atkCard);
    if(!h || h.zone !== 'mz'){ ctx.reason = '攻撃モンスターが場にいません'; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || {};
    const h = b.atkCard && locateCardAnyV4(b.atkCard);
    if(h && h.zone === 'mz') API.returnToHand(h, 'ケルベク');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    if(b.defCard !== ctx.card || !b.atkCard) return false;
    const h = locateCardAnyV4(b.atkCard);
    return !!(h && h.zone === 'mz'); } }
});

/* 14. カラクリ蜘蛛 — このカードの攻撃を受けたモンスターが闇属性だった場合、
   そのモンスターを破壊する（ダメージ計算は適用する） */
defineScript('カラクリ蜘蛛', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const b = ctx.battle || {};
    if(b.atkCard !== ctx.card || !b.defCard){ ctx.reason = 'このカードが攻撃した場合に処理します'; return false; }
    if(dbOf(b.defCard).at !== '闇'){ ctx.reason = '攻撃を受けたモンスターが闇属性ではありません'; return false; }
    const h = locateCardAnyV4(b.defCard);
    if(!h || h.zone !== 'mz'){ ctx.reason = '対象が場にいません'; return false; }
    return true;
  },
  resolve(ctx){
    const b = ctx.battle || {};
    const h = b.defCard && locateCardAnyV4(b.defCard);
    if(h && h.zone === 'mz') API.destroy(h, 'カラクリ蜘蛛');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    if(b.atkCard !== ctx.card || !b.defCard) return false;
    if(dbOf(b.defCard).at !== '闇') return false;
    const h = locateCardAnyV4(b.defCard);
    return !!(h && h.zone === 'mz'); } }
});

/* 15. グレイヴ・キーパー — 表側表示で存在する限り、戦闘によって破壊されたモンスターは
   墓地へ行かず持ち主のデッキに戻りシャッフルされる。
   'after' は BATTLE_CLEANUP より前なので、ここでデッキへ戻せば墓地を経由しない。 */
defineScript('グレイヴ・キーパー', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!b1BattleDestroyedNow(ctx).length){ ctx.reason = '戦闘で破壊されたモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    b1BattleDestroyedNow(ctx).forEach(c => {
      const h = locateCardAnyV4(c);
      if(!h || h.zone !== 'mz') return;
      delete h.card.battleDestroyed;
      API.returnToDeck(h, false, 'グレイヴ・キーパー');
    });
    API.shuffle(0); API.shuffle(1);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'mz' && ctx.card.face === 'up' && b1BattleDestroyedNow(ctx).length > 0; } }
});

/* 16. ケルドウ — 戦闘によって破壊され墓地へ送られた時、
   相手の墓地からカードを2枚選択して相手のデッキに加えてシャッフルする */
defineScript('ケルドウ', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(API.pileCards(ctx.opponent, 'grave').length < 2){ ctx.reason = '相手の墓地にカードが2枚必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = API.pileCards(ctx.opponent, 'grave');
    API.selectCard('ケルドウ：デッキに戻す相手の墓地のカード（1枚目）', q, a => {
      const rest = API.pileCards(ctx.opponent, 'grave').filter(x => x.card !== a.card);
      API.selectCard('ケルドウ：デッキに戻す相手の墓地のカード（2枚目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    (ctx.selectedTargets || []).forEach(t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'grave') API.returnToDeck(r, false, 'ケルドウ');
    });
    API.shuffle(ctx.opponent);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && API.pileCards(ctx.opponent, 'grave').length >= 2; } }
});

/* 17. エレキツネザル — 相手によって破壊された場合、
   次の相手ターン、相手はバトルフェイズを行う事ができない */
function b1FoxDestroyed(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
  return g.byPlayer === ctx.opponent;
}
defineScript('エレキツネザル', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!b1FoxDestroyed(ctx)){ ctx.reason = '相手によって破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.setFlag(ctx.opponent, 'noBattlePhase', true, true); },
  afterResolve(){},
  passive:{ onDestroy(ctx){ return b1FoxDestroyed(ctx); } }
});

/* 18. シールド・ウォリアー — 戦闘ダメージ計算時、墓地のこのカードを除外して発動できる。
   自分フィールドのモンスターはその戦闘では破壊されない。 */
defineScript('シールド・ウォリアー', {
  type:'monster', priority:2, dsTiming:'calc', activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地から発動します'; return false; }
    if(!gameState.battle){ ctx.reason = '戦闘のダメージ計算時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ done(false); return; }
    API.banish(me, 'シールド・ウォリアー（コスト）');
    done(true);
  },
  resolve(ctx){
    API.fieldCards({ player:ctx.player, zone:'mz' }).forEach(x => {
      const r = resolveTarget(x);
      if(r && r.zone === 'mz') API.setCardFlag(r, 'battleProof', true, 'シールド・ウォリアー');
    });
  },
  afterResolve(){}
});

/* ===================== GD. 戦闘破壊時のリクルート ===================== */

/* 19. カオスエンドマスター — 戦闘で相手モンスターを破壊し墓地へ送った時、
   デッキからレベル5以上で攻撃力1600以下のモンスター1体を特殊召喚できる */
function b1ChaosTargets(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && !x.db.ex
    && Number(x.db.lv || 0) >= 5 && Number(x.db.atk || 0) <= 1600);
}
defineScript('カオスエンドマスター', {
  type:'monster', priority:1, targets:true, dsTiming:'after', includesSpecialSummon:true,
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(!b1ChaosTargets(ctx.player).length){ ctx.reason = 'デッキに対象のモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('カオスエンドマスター：特殊召喚するモンスター', b1ChaosTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'カオスエンドマスター', ctx.player);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!a9KilledFoe(ctx) && b1ChaosTargets(ctx.player).length > 0
      && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 20. ガスタ・コドル — 戦闘で相手モンスターを破壊し墓地へ送った時、
   デッキから守備力1500以下のサイキック族・風属性モンスター1体を特殊召喚できる */
function b1GustoTargets(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && !x.db.ex
    && x.db.ra === 'サイキック' && x.db.at === '風' && Number(x.db.def || 9999) <= 1500);
}
defineScript('ガスタ・コドル', {
  type:'monster', priority:1, targets:true, dsTiming:'after', includesSpecialSummon:true,
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊した場合に発動します'; return false; }
    if(!b1GustoTargets(ctx.player).length){ ctx.reason = 'デッキに対象のモンスターがいません'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ガスタ・コドル：特殊召喚するモンスター', b1GustoTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'ガスタ・コドル', ctx.player);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!a9KilledFoe(ctx) && b1GustoTargets(ctx.player).length > 0
      && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 21. サンドモス — 裏側守備表示のこのカードが戦闘以外によって破壊され墓地へ送られた時、
   元々の攻撃力と守備力を入れ替えて自分フィールドに特殊召喚する */
function b1SandmothOk(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  if(e.reason === 'battle') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.face === 'down' && g.turn === gameState.turn);
}
defineScript('サンドモス', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], includesSpecialSummon:true,
  condition(ctx){
    if(!b1SandmothOk(ctx)){ ctx.reason = '裏側守備表示のこのカードが戦闘以外で破壊された場合に発動します'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave') return;
    const card = me.card;
    API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'サンドモス', me.p);
    const now = locateCardAnyV4(card);
    if(!now || now.zone !== 'mz') return;
    /* 元々の攻撃力と守備力を入れ替える（v14 の基準値レイヤーを使う） */
    const db = dbOf(card);
    API.setAtk(now, Number(db.def) || 0, 'permanent', 'サンドモス');
    API.setDef(now, Number(db.atk) || 0, 'permanent', 'サンドモス');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return b1SandmothOk(ctx) && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
});

/* 22. ザ・キックマン は SKIP（ENGINE_GAP）。
   「自分の墓地の装備魔法カード1枚をこのカードに装備する」には墓地→魔法＆罠ゾーンへ
   置いてから装備する経路が要る。API.equipSpell / moveEquipV15 / FX_EQUIP はいずれも
   装備元が sz にある事を前提にしており、墓地から装備する道が無い。
   手動 MOVE は MANUAL/DEVELOPER 用と engine 側に明記されているのでカードからは使わない。
   同じ不足で他に6枚（ガーディアン・エルマ／ギルフォード・ザ・レジェンド／
   ダーク・ネクロフィア／ドラグニティアームズ－レヴァテイン／ヴァイロン・アルファ／
   凶悪犯－チョップマン／暗黒魔族ギルファー・デーモン）が止まっている。 */

/* 23. グランド・スパイダー — 自分フィールドに表側守備表示で存在する場合、
   相手がモンスターの召喚・特殊召喚に成功した時、そのモンスターを守備表示にできる */
function b1SpiderTargets(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.opponent) return [];
  return b2SummonedCards(e).filter(c => {
    const h = locateCardAnyV4(c);
    return !!(h && h.p === ctx.opponent && h.zone === 'mz') && c.pos !== 'def';
  });
}
defineScript('グランド・スパイダー', {
  type:'monster', priority:1, targets:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up' || ctx.card.pos !== 'def'){
      ctx.reason = '表側守備表示で存在する必要があります'; return false; }
    if(!b1SpiderTargets(ctx).length){ ctx.reason = '相手が召喚・特殊召喚した場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('グランド・スパイダー：守備表示にするモンスター',
      b1SpiderTargets(ctx).map(c => locateCardAnyV4(c)).filter(Boolean), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.changePosition(r, 'def', 'グランド・スパイダー');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return CARD_SCRIPTS['グランド・スパイダー'].condition(ctx); },
    onSpecialSummon(ctx){ return CARD_SCRIPTS['グランド・スパイダー'].condition(ctx); }
  }
});

/* 24. お注射天使リリー — このカードが戦闘を行うダメージ計算時に1度、2000LPを払って発動できる。
   このカードの攻撃力はそのダメージ計算時のみ3000アップする。
   「そのダメージ計算時のみ」なので、いま解決している戦闘の uid と一致する間だけ適用する。 */
function b1LilyActive(card){
  const b = gameState.battle;
  if(!b) return false;
  const k = card && card.b1LilyBattle;
  if(k == null) return false;
  const cur = String(gameState.turn) + ':' + String(b.atkUid) + ':' + String(b.targetUid);
  return k === cur;
}
defineScript('お注射天使リリー', {
  type:'monster', priority:2, dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!a5BattleOtherOf(ctx.card) && !(gameState.battle && gameState.battle.target === 'direct')){
      ctx.reason = 'このカードが戦闘を行う場合に発動します'; return false; }
    if(API.me(ctx).lp <= 2000){ ctx.reason = '2000ライフポイントを払えません'; return false; }
    if(b1LilyActive(ctx.card)){ ctx.reason = 'このダメージ計算では既に発動しています'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 2000); done(true); },
  resolve(ctx){
    const b = gameState.battle;
    if(!b) return;
    const me = locateCardAnyV4(ctx.card);
    const key = String(gameState.turn) + ':' + String(b.atkUid) + ':' + String(b.targetUid);
    if(me) API.setCardFlag(me, 'b1LilyBattle', key, 'お注射天使リリー');
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      if(target !== self) return null;
      return b1LilyActive(self) ? { atk:3000 } : null;
    }
  }
});
