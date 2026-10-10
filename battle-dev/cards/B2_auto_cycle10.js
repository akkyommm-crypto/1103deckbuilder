/* Auto cycle 10 — 25枚。engine 変更なし。
     HA 戦闘したモンスターへの干渉（dsTiming 'end' / 'after'）
     HB 継続の表示形式固定（continuous.forcedPosition / cannotChangePosition）
     HC 召喚無効（sc.summonNegate）・フェイズ操作（v7 skipPhase）
     HD 墓地／デッキ操作
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 「このカードと戦闘を行った相手が種族 X ならダメージステップ終了時に破壊」 */
function b2DestroyBattledRace(name, races){
  defineScript(name, {
    type:'monster', priority:1, forced:true, dsTiming:'end',
    condition(ctx){
      const o = a9BattleFoe(ctx);
      if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
      if(races.indexOf(dbOf(o).ra) < 0){ ctx.reason = '対象の種族ではありません'; return false; }
      const h = locateCardAnyV4(o);
      if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
      return true;
    },
    resolve(ctx){
      const o = a9BattleFoe(ctx);
      const h = o && locateCardAnyV4(o);
      if(h && h.zone === 'mz') API.destroy(h, name);
    },
    afterResolve(){},
    passive:{ onDamageStep(ctx){
      const o = a9BattleFoe(ctx);
      if(!o || races.indexOf(dbOf(o).ra) < 0) return false;
      const h = locateCardAnyV4(o);
      return !!(h && h.zone === 'mz'); } }
  });
}
/* 自分のこのカードが「相手によって」フィールドから墓地へ送られたか */
function b2SentByFoe(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.from === 'mz' && g.turn === gameState.turn)) return false;
  return g.byPlayer === ctx.opponent;
}

/* ===================== HA. 戦闘したモンスターへの干渉 ===================== */

/* 1. 幻影の壁 — このカードを攻撃したモンスターは持ち主の手札に戻る（ダメージ計算は適用） */
defineScript('幻影の壁', {
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
    if(h && h.zone === 'mz') API.returnToHand(h, '幻影の壁');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const b = ctx.battle || {};
    if(b.defCard !== ctx.card || !b.atkCard) return false;
    const h = locateCardAnyV4(b.atkCard);
    return !!(h && h.zone === 'mz'); } }
});

/* 2. ハイパーハンマーヘッド — このモンスターとの戦闘で破壊されなかった相手モンスターは、
   ダメージステップ終了時に持ち主の手札に戻る */
function b2HammerSurvivor(ctx){
  const b = ctx.battle || {};
  let o = null;
  if(b.atkCard === ctx.card && b.defCard && !b.destroyedDef) o = b.defCard;
  else if(b.defCard === ctx.card && b.atkCard && !b.destroyedAtk) o = b.atkCard;
  if(!o) return null;
  const h = locateCardAnyV4(o);
  return (h && h.zone === 'mz') ? o : null;
}
defineScript('ハイパーハンマーヘッド', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    if(!b2HammerSurvivor(ctx)){ ctx.reason = '戦闘で破壊されなかった相手モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = b2HammerSurvivor(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.returnToHand(h, 'ハイパーハンマーヘッド');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!b2HammerSurvivor(ctx); } }
});

/* 3. 伝説の柔術家 — 守備表示で存在するこのカードと戦闘を行ったモンスターは、
   ダメージステップ終了時に持ち主のデッキの一番上に戻る */
defineScript('伝説の柔術家', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.pos !== 'def'){ ctx.reason = '守備表示で存在する必要があります'; return false; }
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.returnToDeck(h, false, '伝説の柔術家');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(ctx.zone !== 'mz' || ctx.card.pos !== 'def') return false;
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz'); } }
});

/* 4/5. 龍骨鬼／月風魔 — 戦闘した相手が指定種族ならダメージステップ終了時に破壊する */
b2DestroyBattledRace('龍骨鬼', ['戦士', '魔法使い']);
b2DestroyBattledRace('月風魔', ['悪魔', 'アンデット']);

/* 6. 黄泉へ渡る船 — 戦闘で破壊され墓地へ送られた場合、このカードを破壊したモンスターを破壊する */
defineScript('黄泉へ渡る船', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    const o = a3BattleOther(ctx);
    if(!o){ ctx.reason = 'このカードを破壊したモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a3BattleOther(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.destroy(h, '黄泉へ渡る船');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && !!a3BattleOther(ctx); } }
});

/* 7. 有翼賢者ファルコス — 戦闘によって破壊し墓地へ送った表側攻撃表示の相手モンスターを、
   相手のデッキの一番上に戻す事ができる。
   'after' は破壊処理前なので、まだ場にいる相手をそのままデッキへ戻す。 */
function b2FalcosVictim(ctx){
  const v = a9KilledFoe(ctx);
  if(!v) return null;
  if(!(v.face === 'up' && v.pos === 'atk')) return null;
  const h = locateCardAnyV4(v);
  return (h && h.zone === 'mz') ? v : null;
}
defineScript('有翼賢者ファルコス', {
  type:'monster', priority:1, dsTiming:'after',
  condition(ctx){
    if(!b2FalcosVictim(ctx)){ ctx.reason = '表側攻撃表示の相手モンスターを戦闘破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = b2FalcosVictim(ctx);
    const h = v && locateCardAnyV4(v);
    if(!h || h.zone !== 'mz') return;
    delete h.card.battleDestroyed;
    API.returnToDeck(h, false, '有翼賢者ファルコス');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!b2FalcosVictim(ctx); } }
});

/* 8. ロイヤルナイツ — 戦闘破壊したモンスターの守備力分だけライフを回復する */
defineScript('ロイヤルナイツ', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!a9KilledFoe(ctx)){ ctx.reason = '戦闘によってモンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = a9KilledFoe(ctx);
    if(!v) return;
    const def = Math.max(0, curDEF(v) || 0);
    if(def > 0) API.recoverLP(ctx.player, def);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a9KilledFoe(ctx); } }
});

/* 9. ネコ耳族 — 相手ターン時のみ、このカードと戦闘する相手モンスターの
   元々の攻撃力はダメージステップ時に200になる */
defineScript('ネコ耳族', {
  type:'monster', priority:1,
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(target, self){
      if(target === self) return null;
      if(gameState.activePlayer === undefined) return null;
      const loc = locateCard(self);
      if(!loc || gameState.activePlayer === loc.p) return null;   /* 相手ターンのみ */
      if(!a5InDamageStep()) return null;
      if(a5BattleOtherOf(self) !== target) return null;
      return { setBaseAtk:200 };
    }
  }
});

/* 10. レプティレス・ゴルゴーン — このカードが攻撃を行ったダメージ計算後、
   戦闘を行ったモンスターは攻撃力が0になり、表示形式を変更できない */
defineScript('レプティレス・ゴルゴーン', {
  type:'monster', priority:1, forced:true, dsTiming:'after',
  condition(ctx){
    if(!a9SelfAttacked(ctx)){ ctx.reason = 'このカードが攻撃した場合に処理します'; return false; }
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = '戦闘した相手がいません'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    if(b0FieldOnceUsed(o, 'b2GorgonLock')){ ctx.reason = '既に適用しています'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(!h || h.zone !== 'mz') return;
    API.setAtk(h, 0, 'permanent', 'レプティレス・ゴルゴーン');
    b0MarkFieldOnce(h, 'b2GorgonLock', 'レプティレス・ゴルゴーン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(!a9SelfAttacked(ctx)) return false;
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz') && !b0FieldOnceUsed(o, 'b2GorgonLock'); } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(target){ return b0FieldOnceUsed(target, 'b2GorgonLock'); }
  }
});

/* ===================== HB. 継続の表示形式固定 ===================== */

/* 11. 最終突撃命令（永続罠） — フィールドの表側表示モンスターは攻撃表示になり、
   表示形式を変更できない */
defineScript('最終突撃命令', {
  type:'trap', priority:2,
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    forcedPosition(card){ return (card && card.face === 'up') ? 'atk' : null; },
    cannotChangePosition(target){ return !!(target && target.face === 'up'); }
  }
});

/* 12. 砂漠の裁き（永続罠） — 表側表示になったモンスターの表示形式は変更できない */
defineScript('砂漠の裁き', {
  type:'trap', priority:2,
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotChangePosition(target){ return !!(target && target.face === 'up'); }
  }
});

/* 13. 細菌感染（装備魔法） — 機械族以外のみ装備可能。
   自分のスタンバイフェイズ毎に装備モンスターの攻撃力は300ダウンする。 */
function b2InfectionDown(card){ return Math.max(0, Number(card && card.b2InfectN) || 0) * 300; }
defineScript('細菌感染', {
  type:'spell', priority:1, forced:true,
  equipSpec:{ canEquip(h){ return h && h.db && h.db.ra !== '機械'; }, label:'機械族以外のみ' },
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = '魔法＆罠ゾーンに存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'b2InfectN', (Number(ctx.card.b2InfectN) || 0) + 1, '細菌感染');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && gameState.activePlayer === ctx.player && !!a8Equipped(ctx.card); } },
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(target, self){
      const n = b2InfectionDown(self);
      return n > 0 ? { atk:-n } : null;
    }
  }
});

/* ===================== HC. 召喚無効・フェイズ操作 ===================== */

/* 14. 昇天の黒角笛（カウンター罠） — 相手モンスター1体の特殊召喚を無効にし破壊する */
defineScript('昇天の黒角笛', {
  type:'trap', priority:3,
  summonNegate:{ specialOnly:true },
  condition(ctx){
    const pending = gameState.pendingSummon;
    if(!pending){ ctx.reason = '召喚時にのみ発動できます'; return false; }
    if(pending.player === ctx.player){ ctx.reason = '相手の特殊召喚にのみ発動できます'; return false; }
    return true;
  },
  resolve(){ if(gameState.pendingSummon) summonNegatePendingV2('昇天の黒角笛'); },
  afterResolve(){}
});

/* 15. 覇者の一括 — 相手スタンバイフェイズに発動できる。
   発動ターン、相手はバトルフェイズを行う事ができない。 */
defineScript('覇者の一括', {
  type:'trap', priority:2,
  condition(ctx){
    if(gameState.activePlayer === ctx.player){ ctx.reason = '相手のスタンバイフェイズに発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.setFlag(ctx.opponent, 'noBattlePhase', true, true); },
  afterResolve(){}
});

/* 16. 体力増強剤スーパーZ — 自分が2000以上の戦闘ダメージを受ける場合、
   そのダメージ計算時に発動できる。自分は4000ライフ回復する。 */
defineScript('体力増強剤スーパーZ', {
  type:'trap', priority:2, dsTiming:'calc',
  condition(ctx){
    const b = gameState.battle;
    if(!b){ ctx.reason = '戦闘のダメージ計算時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.recoverLP(ctx.player, 4000); },
  afterResolve(){}
});

/* 17. ヘル・テンペスト — 3000ポイント以上の戦闘ダメージを受けた時に発動できる。
   お互いのデッキと墓地のモンスターを全てゲームから除外する。 */
defineScript('ヘル・テンペスト', {
  type:'spell', priority:2,
  condition(ctx){
    const e = ctx.event || {};
    if(!(Number(e.amount) >= 3000) || e.player !== ctx.player){
      ctx.reason = '3000以上の戦闘ダメージを受けた場合に発動します'; return false; }
    return true;
  },
  resolve(){
    [0,1].forEach(p => {
      ['deck','grave'].forEach(z => {
        let guard = 0;
        while(guard++ < 200){
          const q = API.pileCards(p, z, x => x.db.k === 'm');
          if(!q.length) break;
          const r = resolveTarget(q[0]);
          if(!r) break;
          API.banish(r, 'ヘル・テンペスト');
        }
      });
    });
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    const e = ctx.event || {};
    return Number(e.amount) >= 3000 && e.player === ctx.player; } }
});

/* 18. 大落とし穴 — 同時に2体以上のモンスターが特殊召喚に成功した時に発動できる。
   フィールドのモンスターを全て破壊する。
   「同時に」は RESOLUTION_SUMMON_BATCH_V2 がまとめた1イベントで数える。 */
function b2MassSummon(ctx){
  const e = ctx.event || {};
  return b2SummonedCards(e).length >= 2;
}
defineScript('大落とし穴', {
  type:'trap', priority:2,
  condition(ctx){
    if(!b2MassSummon(ctx)){ ctx.reason = '同時に2体以上が特殊召喚された場合に発動します'; return false; }
    return true;
  },
  resolve(){
    API.fieldCards({ zone:'mz' }).slice().forEach(x => {
      const r = resolveTarget(x);
      if(r && r.zone === 'mz') API.destroy(r, '大落とし穴');
    });
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return b2MassSummon(ctx); } }
});

/* ===================== HD. 墓地／デッキ操作 ===================== */

/* 19. 白夜の女王 — 特殊召喚できない。1ターンに1度、
   フィールドにセットされたカード1枚を破壊する事ができる。 */
function b2SetCards(){
  return API.fieldCards({ filter:x => (x.zone === 'sz' || x.zone === 'mz') && x.card.face === 'down' });
}
defineScript('白夜の女王', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  cannotSpecialSummon:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!b2SetCards().length){ ctx.reason = 'セットされたカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('白夜の女王：破壊するセットされたカード', b2SetCards(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, '白夜の女王');
  },
  afterResolve(){}
});

/* 20. 破戒僧 ランシン — 相手によってフィールドから墓地へ送られた時、
   相手の墓地のモンスター1体を選択してゲームから除外する */
defineScript('破戒僧 ランシン', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!b2SentByFoe(ctx)){ ctx.reason = '相手によってフィールドから墓地へ送られた場合に発動します'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave', x => x.db.k === 'm').length){
      ctx.reason = '相手の墓地にモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('破戒僧 ランシン：除外する相手の墓地のモンスター',
      API.pileCards(ctx.opponent, 'grave', x => x.db.k === 'm'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, '破戒僧 ランシン');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return b2SentByFoe(ctx)
      && API.pileCards(ctx.opponent, 'grave', x => x.db.k === 'm').length > 0; } }
});

/* 21. 暗黒プテラ — 戦闘によって破壊される以外の方法でフィールドから墓地へ送られた時、
   持ち主の手札に戻る */
function b2PteraOk(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  if(e.reason === 'battle') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('暗黒プテラ', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!b2PteraOk(ctx)){ ctx.reason = '戦闘以外でフィールドから墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToHand(me, '暗黒プテラ');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return b2PteraOk(ctx); } }
});

/* 22. ディープ・ダイバー — 戦闘によって破壊され墓地へ送られたバトルフェイズ終了時、
   デッキからモンスター1体を選んでデッキの一番上に置く */
defineScript('ディープ・ダイバー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地から発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)){
      ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(!API.pileCards(ctx.player, 'deck', x => x.db.k === 'm').length){
      ctx.reason = 'デッキにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ディープ・ダイバー：デッキの一番上に置くモンスター',
      API.pileCards(ctx.player, 'deck', x => x.db.k === 'm'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'deck') return;
    /* デッキ内で一番上へ動かす（引き抜いて戻す） */
    const card = r.card;
    API.returnToDeck(r, false, 'ディープ・ダイバー');
  },
  afterResolve(){},
  passive:{ onBattlePhaseEnd(ctx){
    if(ctx.zone !== 'grave') return false;
    const g = ctx.card.graveInfo;
    return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)
      && API.pileCards(ctx.player, 'deck', x => x.db.k === 'm').length > 0; } }
});

/* 23. ピクシーナイト — 戦闘によって墓地へ送られた時、
   自分の墓地の魔法カード1枚を相手が選択し、そのカードを自分のデッキの一番上に置く */
API.registerChoiceHandler('b2.pixie', (a, x) => {
  const t = ((a && a.cards) || []).filter(y => y && !y.stale)[0];
  if(!t) return;
  const h = t.uid == null ? null : findCardByUid(t.uid);
  if(h && h.zone === 'grave') API.returnToDeck(h, false, 'ピクシーナイト');
});
defineScript('ピクシーナイト', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって墓地へ送られた場合に発動します'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x => x.db.k === 's').length){
      ctx.reason = '自分の墓地に魔法カードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = API.pileCards(ctx.player, 'grave', x => x.db.k === 's');
    if(!q.length) return;
    /* 選ぶのは相手なので相手側の選択にする */
    API.requestChoice({
      player: ctx.opponent, kind:'card', title:'ピクシーナイト：デッキの一番上に置く魔法カード',
      candidates:q, min:1, max:1,
      resume:{ handler:'b2.pixie', args:{ player: ctx.player } }
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx)
      && API.pileCards(ctx.player, 'grave', x => x.db.k === 's').length > 0; } }
});

/* 24. ヌビアガード — 相手プレイヤーに戦闘ダメージを与えた場合、
   自分の墓地の永続魔法カード1枚をデッキの一番上に戻す事ができる */
function b2ContinuousGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 's' && x.db.sub === '永続');
}
defineScript('ヌビアガード', {
  type:'monster', priority:1, targets:true,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!b2ContinuousGrave(ctx.player).length){ ctx.reason = '墓地に永続魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ヌビアガード：デッキの一番上に戻す永続魔法', b2ContinuousGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, false, 'ヌビアガード');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return a3DealtBattleDamage(ctx) && b2ContinuousGrave(ctx.player).length > 0; } }
});

/* 25. 追い剥ぎゾンビ（永続罠） — 自分フィールドのモンスターが相手プレイヤーに
   戦闘ダメージを与える度に、相手はデッキの一番上のカードを1枚墓地へ送る */
defineScript('追い剥ぎゾンビ', {
  type:'trap', priority:2, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!a4OwnMonsterDealtDamage(ctx)){ ctx.reason = '自分のモンスターが戦闘ダメージを与えた場合に発動します'; return false; }
    if(!API.foe(ctx).deck.length){ ctx.reason = '相手のデッキがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.millTop(ctx.opponent, 1, '追い剥ぎゾンビ'); },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up'
      && a4OwnMonsterDealtDamage(ctx) && API.foe(ctx).deck.length > 0; } }
});
