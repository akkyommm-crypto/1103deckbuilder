/* Auto cycle 06 — 30枚。engine 変更なし。
     CA 装備魔法（v15 continuous / equippedMonster スコープ）
     CB 戦闘破壊され墓地へ送られた時（v29 grave continuous も使う）
     CC 除外・破壊・ドローの単発効果
     CD スタンバイ／エンドフェイズの継続処理（v7 scheduler）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

/* 装備モンスター（この装備カードから見て） */
function a8Equipped(card){
  const t = card && card.equipTo;
  if(!t || t.uid == null) return null;
  const h = findCardByUid(t.uid);
  return (h && h.zone === 'mz') ? h.card : null;
}
/* 単純な装備ボーナスを1枚で宣言する */
function a8EquipStat(name, stat, opt){
  defineScript(name, Object.assign({
    type:'spell', priority:1,
    continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return stat; } }
  }, opt || {}));
}
/* このカードが「フィールドから墓地へ送られた」か */
function a8LeftFieldToGrave(ctx){
  if(ctx.zone !== 'grave') return false;
  const e = ctx.event || {};
  if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))) return false;
  const g = ctx.card.graveInfo;
  return !!(g && ['mz','sz','field'].indexOf(g.from) >= 0 && g.turn === gameState.turn);
}
/* 自分のこのカードが戦闘で破壊され墓地へ送られたか（cycle01 の判定を再利用） */
function a8SelfBattleDestroyed(ctx){ return a3SelfBattleDestroyed(ctx); }

/* ===================== CA. 装備魔法 ===================== */

/* 1. 一角獣のホーン — 攻守+700。フィールドから墓地へ送られた場合、デッキの一番上に戻す。 */
defineScript('一角獣のホーン', {
  type:'spell', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8LeftFieldToGrave(ctx)){ ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToDeck(me, false, '一角獣のホーン');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return a8LeftFieldToGrave(ctx); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return { atk:700, def:700 }; } }
});

/* 2. ダグラの剣 — 天使族のみ装備可能。攻撃力+500。装備モンスターが相手プレイヤーに
   戦闘ダメージを与えた時、その数値分ライフを回復する。 */
defineScript('ダグラの剣', {
  type:'spell', priority:1, forced:true,
  equipSpec:{ canEquip(h){ return h && h.db && h.db.ra === '天使'; }, label:'天使族のみ' },
  condition(ctx){
    const e = ctx.event || {};
    const eq = a8Equipped(ctx.card);
    if(!eq){ ctx.reason = '装備モンスターがいません'; return false; }
    if(!(Number(e.amount) > 0) || e.player !== ctx.opponent){ ctx.reason = '装備モンスターが相手に戦闘ダメージを与えた場合に発動します'; return false; }
    const uid = eq.uid;
    if(!(e.attackerUid === uid || e.defenderUid === uid)){ ctx.reason = '装備モンスターの戦闘ダメージではありません'; return false; }
    return true;
  },
  resolve(ctx){
    const e = ctx.event || {};
    const n = Math.max(0, Number(e.amount) || 0);
    if(n > 0) API.recoverLP(ctx.player, n);
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    const e = ctx.event || {};
    const eq = a8Equipped(ctx.card);
    if(!eq || !(Number(e.amount) > 0) || e.player !== ctx.opponent) return false;
    return e.attackerUid === eq.uid || e.defenderUid === eq.uid; } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return { atk:500 }; } }
});

/* 3. 光の角 — 守備力+800。フィールドから墓地へ送られた時、500払えばデッキの一番上に戻る。 */
defineScript('光の角', {
  type:'spell', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!a8LeftFieldToGrave(ctx)){ ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).lp <= 500){ ctx.reason = '500ライフポイントを払えません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToDeck(me, false, '光の角');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return a8LeftFieldToGrave(ctx) && API.me(ctx).lp > 500; } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return { def:800 }; } }
});

/* 4. 重力の斧－グラール — 攻撃力+500。存在する限り相手フィールドのモンスターは
   表示形式を変更できない。装備ボーナスと相手全体へのロックを1つの継続効果で宣言するため、
   scope は allMonsters にし、装備モンスターかどうかは apply の中で見る。 */
defineScript('重力の斧－グラール', {
  type:'spell', priority:1,
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(target, self){
      const eq = a8Equipped(self);
      return (eq && target === eq) ? { atk:500 } : null;
    },
    cannotChangePosition(target, self){
      const loc = locateCard(target), me = locateCard(self);
      if(!loc || !me) return false;
      return loc.p !== me.p;              /* 相手フィールドのモンスターだけ固定する */
    }
  }
});

/* 5. 蝶の短剣－エルマ — 攻撃力+300。装備されているこのカードが破壊されて墓地へ送られた時、
   手札に戻す事ができる。 */
defineScript('蝶の短剣－エルマ', {
  type:'spell', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!a8LeftFieldToGrave(ctx)){ ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.byDestroy)){ ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToHand(me, '蝶の短剣－エルマ');
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){
    const g = ctx.card.graveInfo;
    return a8LeftFieldToGrave(ctx) && !!(g && g.byDestroy); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return { atk:300 }; } }
});

/* 6. ドーピング — 攻撃力+700。自分のスタンバイフェイズ毎に装備モンスターの攻撃力は200ダウン。
   累積分はこのカードに整数で持たせる（Replay/SaveLoad 安全）。 */
function a8DopingDown(card){ return Math.max(0, Number(card && card.a8DopingN) || 0) * 200; }
defineScript('ドーピング', {
  type:'spell', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = '魔法＆罠ゾーンに存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'a8DopingN', (Number(ctx.card.a8DopingN) || 0) + 1, 'ドーピング');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'sz' && gameState.activePlayer === ctx.player && !!a8Equipped(ctx.card); } },
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(target, self){ return { atk:700 - a8DopingDown(self) }; }
  }
});

/* 7. モルティング・エスケープ は SKIP（ENGINE_GAP）。
   「装備モンスターは1ターンに1度だけ、戦闘では破壊されない」は、耐性を実際に
   使った事を記録しないと2回目以降を通せない。battleProof は候補判定と同じく
   読み取り専用で呼ばれるため、そこから使用済みフラグを書くと Action Journal を
   汚す（cycle04 のヴァンパイア・ベビーと同じ問題）。
   必要なのは「破壊置換を1回消費した」事を engine 側が通知する hook。 */

/* 8. パワー・ピカクス — 1ターンに1度、装備モンスターのレベル以下のレベルを持つ
   相手の墓地のモンスター1体を除外し、エンドフェイズ時まで装備モンスターの攻撃力+500。 */
function a8PicaxTargets(ctx){
  const eq = a8Equipped(ctx.card);
  if(!eq) return [];
  const lv = curLV(eq);
  return API.pileCards(ctx.opponent, 'grave',
    x => x.db.k === 'm' && Number(x.db.lv || 99) <= lv);
}
defineScript('パワー・ピカクス', {
  type:'spell', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
    if(!a8PicaxTargets(ctx).length){ ctx.reason = '相手の墓地に対象のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('パワー・ピカクス：除外する相手の墓地のモンスター', a8PicaxTargets(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, 'パワー・ピカクス');
    const eq = a8Equipped(ctx.card);
    const h = eq && locateCardAnyV4(eq);
    if(h && h.zone === 'mz') API.modAtk(h, 500, 0, 'endPhase', 'パワー・ピカクス');
  },
  afterResolve(){}
});

/* 9. ライトイレイザー — 光属性・戦士族のみ装備可能。装備モンスターと戦闘を行ったモンスターを
   ダメージステップ終了時に除外する。 */
defineScript('ライトイレイザー', {
  type:'spell', priority:1, forced:true, dsTiming:'end',
  equipSpec:{ canEquip(h){ return h && h.db && h.db.at === '光' && h.db.ra === '戦士'; },
              label:'光属性・戦士族のみ' },
  condition(ctx){
    const eq = a8Equipped(ctx.card);
    if(!eq){ ctx.reason = '装備モンスターがいません'; return false; }
    if(!a5BattleOtherOf(eq)){ ctx.reason = '装備モンスターが戦闘を行った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const eq = a8Equipped(ctx.card);
    const o = eq && a5BattleOtherOf(eq);
    const h = o && locateCardAnyV4(o);
    if(h) API.banish(h, 'ライトイレイザー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const eq = a8Equipped(ctx.card);
    return !!(eq && a5BattleOtherOf(eq)); } },
  continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }
});

/* ===================== CB. 戦闘破壊され墓地へ送られた時 ===================== */

/* 10. グレイブ・スクワーマー — 戦闘破壊された場合、フィールドのカード1枚を破壊する */
function a8AnyFieldCard(){
  return API.fieldCards({ filter:x => x.zone === 'mz' || x.zone === 'sz' || x.zone === 'field' });
}
defineScript('グレイブ・スクワーマー', {
  type:'monster', priority:1, forced:true, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(!a8AnyFieldCard().length){ ctx.reason = 'フィールドにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('グレイブ・スクワーマー：破壊するカード', a8AnyFieldCard(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.destroy(r, 'グレイブ・スクワーマー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a8SelfBattleDestroyed(ctx) && a8AnyFieldCard().length > 0; } }
});

/* 11/12. ハネクリボー／BF－銀盾のミストラル — 破壊され墓地へ送られた場合、
   このターン自分が受ける戦闘ダメージを0にする（ミストラルは1度だけ）。
   墓地に残ったこのカードを継続効果のソースにする（v29 grave continuous）。 */
function a8ShieldTurn(card){ return Number(card && card.a8ShieldTurn) || 0; }
function a8DefineBattleShield(name){
  defineScript(name, {
    type:'monster', priority:1, forced:true, activateFrom:['grave'],
    condition(ctx){
      if(ctx.zone !== 'grave'){ ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
      const g = ctx.card.graveInfo;
      if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)){
        ctx.reason = '破壊されて墓地へ送られた場合に発動します'; return false; }
      if(a8ShieldTurn(ctx.card) === gameState.turn){ ctx.reason = 'このターンは既に適用しています'; return false; }
      return true;
    },
    resolve(ctx){
      const me = locateCardAnyV4(ctx.card);
      if(me) API.setCardFlag(me, 'a8ShieldTurn', gameState.turn, name);
    },
    afterResolve(){},
    passive:{ onDestroy(ctx){
      const g = ctx.card.graveInfo;
      /* S03-U146: eventIsSelfS03 — only its own destruction */
      return ctx.zone === 'grave' && eventIsSelfS03(ctx) && !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)
        && a8ShieldTurn(ctx.card) !== gameState.turn; } },
    continuous:{
      scope:'self', from:['grave'],
      apply(){ return null; },
      battleDamage(info){
        const self = info.self;
        if(a8ShieldTurn(self) !== gameState.turn) return info.amount;
        const loc = locateCard(self) || locateCardAnyV4(self);
        const mine = loc ? loc.p : null;
        if(mine == null || info.to !== mine) return info.amount;
        return 0;
      }
    }
  });
}
a8DefineBattleShield('ハネクリボー');
/* BF－銀盾のミストラル は SKIP（ENGINE_GAP）。
   「戦闘ダメージを1度だけ0にする」の“1度”を数えるには、continuous.battleDamage が
   実際に適用された事を記録する必要があるが、この hook も読み取り専用で呼ばれる。 */

/* 13. オキシゲドン — 炎族モンスターとの戦闘で破壊され墓地へ送られた場合、お互いが800ダメージ */
defineScript('オキシゲドン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    const o = a3BattleOther(ctx);
    if(!(o && dbOf(o).ra === '炎')){ ctx.reason = '炎族モンスターとの戦闘である必要があります'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.player, 800); API.damageLP(ctx.opponent, 800); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(!a8SelfBattleDestroyed(ctx)) return false;
    const o = a3BattleOther(ctx);
    return !!(o && dbOf(o).ra === '炎'); } }
});

/* 14. マッド・リローダー — 戦闘破壊された場合、手札を2枚墓地へ送り2枚ドローする。
   S03-U62: 元の実装は同期forループ内で legacy API.selectCard を2回呼んでいたが、selectCard は非同期
   （選択待ちを開いてすぐ戻る）のため、2回目の呼び出しが1回目の選択待ちを黙って上書きし、実際には
   1枚しか捨てられず、しかもドローは（どちらの選択にも応答する前に）先に走っていた。
   SaveLoad安全化のため choice を2段階の逐次リクエストへ書き直すのに合わせて、この事故的な重複呼び出し
   も解消し、捨てる→捨てる→ドローの順で実行する（カードテキスト通りの順序）。 */
function a8MadReloaderStep(player, doneCount){
  if(doneCount >= 2){ API.draw(player, 2, 'マッド・リローダー'); return; }
  const q = API.pileCards(player, 'hand');
  if(!q.length){ API.draw(player, 2, 'マッド・リローダー'); return; }
  /* forced:true な誘発効果なので、捨てる手札の選択自体は取り消せない（宣言不要の強制効果）。 */
  API.requestChoice({player, kind:'card', title:'マッド・リローダー：墓地へ送る手札',
    candidates: q, min:1, max:1, cancelable:false,
    resume:{handler:'s03u62.mad-reloader-discard', args:{player, doneCount}},
    meta:{scriptName:'マッド・リローダー'}});
}
API.registerChoiceHandler('s03u62.mad-reloader-discard', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone!=='hand') return;
  API.sendHandToGrave(args.player, h.index, 'マッド・リローダー');
  a8MadReloaderStep(args.player, args.doneCount+1);
});
defineScript('マッド・リローダー', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).hand.length < 2){ ctx.reason = '手札が2枚必要です'; return false; }
    if(API.me(ctx).deck.length < 2){ ctx.reason = 'デッキが2枚必要です'; return false; }
    return true;
  },
  resolve(ctx){
    a8MadReloaderStep(ctx.player, 0);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a8SelfBattleDestroyed(ctx) && API.me(ctx).hand.length >= 2 && API.me(ctx).deck.length >= 2; } }
});

/* 15. ダブル・プロテクター — 戦闘破壊された時、相手の表側モンスター1体の攻撃力を
   エンドフェイズ時まで半分にする（任意） */
function a8FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' });
}
defineScript('ダブル・プロテクター', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(!a8FoeFaceUp(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ダブル・プロテクター：攻撃力を半分にするモンスター', a8FoeFaceUp(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const now = curATK(r.card);
    API.setAtk(r, Math.floor(now / 2), 'endPhase', 'ダブル・プロテクター');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a8SelfBattleDestroyed(ctx) && a8FoeFaceUp(ctx).length > 0; } }
});

/* 16. ファミリア・ナイト — 戦闘破壊された場合、お互いが手札からレベル4を特殊召喚できる */
function a8Level4Hand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && !x.db.ex && Number(x.db.lv) === 4);
}
API.registerChoiceHandler('a8.familiar', (a, x) => {
  const t = ((a && a.cards) || []).filter(y => y && !y.stale)[0];
  if(t){
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'hand' && (gameState.players[x.player].mz || []).length < ZONE_LIMITS.mz)
      API.specialSummon(x.player, 'hand', h.index, 'atk', 'ファミリア・ナイト', x.player);
  }
  if(x.next === 0 || x.next === 1){
    const q = a8Level4Hand(x.next);
    if(q.length) API.requestChoice({
      player:x.next, kind:'card', title:'ファミリア・ナイト：特殊召喚するレベル4モンスター',
      candidates:q, min:0, max:1, resume:{ handler:'a8.familiar', args:{ player:x.next, next:null } }
    });
  }
});
defineScript('ファミリア・ナイト', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], includesSpecialSummon:true,
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(!a8Level4Hand(ctx.player).length && !a8Level4Hand(ctx.opponent).length){
      ctx.reason = 'お互いの手札にレベル4モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const mine = a8Level4Hand(ctx.player);
    if(mine.length){
      API.requestChoice({
        player:ctx.player, kind:'card', title:'ファミリア・ナイト：特殊召喚するレベル4モンスター',
        candidates:mine, min:0, max:1,
        resume:{ handler:'a8.familiar', args:{ player:ctx.player, next:ctx.opponent } }
      });
      return;
    }
    const theirs = a8Level4Hand(ctx.opponent);
    if(theirs.length) API.requestChoice({
      player:ctx.opponent, kind:'card', title:'ファミリア・ナイト：特殊召喚するレベル4モンスター',
      candidates:theirs, min:0, max:1,
      resume:{ handler:'a8.familiar', args:{ player:ctx.opponent, next:null } }
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a8SelfBattleDestroyed(ctx)
      && (a8Level4Hand(ctx.player).length > 0 || a8Level4Hand(ctx.opponent).length > 0); } }
});

/* 17. ボマー・ドラゴン — ①このカードの攻撃で発生するお互いの戦闘ダメージは0
   ②戦闘で破壊され墓地へ送られた場合、このカードを破壊したモンスターを破壊する */
defineScript('ボマー・ドラゴン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    const o = a3BattleOther(ctx);
    if(!o){ ctx.reason = 'このカードを破壊したモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a3BattleOther(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz') API.destroy(h, 'ボマー・ドラゴン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a8SelfBattleDestroyed(ctx) && !!a3BattleOther(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    /* このカードが攻撃した戦闘で生じるダメージは、どちらのプレイヤー分でも0 */
    battleDamage(info){
      const self = info.self;
      /* S03-U20: 攻撃側はダメージ情報の atkCard で判定する。gameState.battle は Action の外で設定されるため、
         ATTACK の reducer 内で読むと Replay では値が異なる（atkCard の無い直接呼び出しだけ従来の判定）。 */
      const attacker = info.atkCard ? info.atkCard === self : a5IsAttackerCard(self);
      return attacker ? 0 : info.amount;
    }
  }
});

/* 18. スピッド・バード — 戦闘破壊された時、自分の墓地のレベル2を2体特殊召喚できる。
   その特殊召喚したモンスターの効果は無効化される。 */
function a8Level2Grave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && !x.db.ex && Number(x.db.lv) === 2);
}
defineScript('スピッド・バード', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'], includesSpecialSummon:true,
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(a8Level2Grave(ctx.player).length < 2){ ctx.reason = '墓地にレベル2モンスターが2体必要です'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz - 1){ ctx.reason = 'モンスターゾーンに2体分の空きが必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = a8Level2Grave(ctx.player);
    API.selectCard('スピッド・バード：特殊召喚するレベル2（1体目）', q, a => {
      const rest = a8Level2Grave(ctx.player).filter(x => x.card !== a.card);
      API.selectCard('スピッド・バード：特殊召喚するレベル2（2体目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    (ctx.selectedTargets || []).forEach(t => {
      const r = resolveTarget(t);
      if(!r || r.zone !== 'grave') return;
      const card = r.card;
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'スピッド・バード', r.p);
      const now = locateCardAnyV4(card);
      if(now && now.zone === 'mz') API.negate(now, 'スピッド・バード');
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a8SelfBattleDestroyed(ctx) && a8Level2Grave(ctx.player).length >= 2
      && API.me(ctx).mz.length < ZONE_LIMITS.mz - 1; } }
});

/* ===================== CC. 除外・破壊・ドロー ===================== */

/* 19. アマゾネスの鎖使い — 戦闘破壊された時、1500払って相手の手札からモンスター1体を得る */
defineScript('アマゾネスの鎖使い', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a8SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘で破壊され墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).lp <= 1500){ ctx.reason = '1500ライフポイントを払えません'; return false; }
    if(!API.pileCards(ctx.opponent, 'hand', x => x.db.k === 'm').length){
      ctx.reason = '相手の手札にモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1500); done(true); },
  selectTargets(ctx, done){
    API.selectCard('アマゾネスの鎖使い：手札に加える相手のモンスター',
      API.pileCards(ctx.opponent, 'hand', x => x.db.k === 'm'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    /* 「自分の手札に加える」＝ 相手の手札から自分の手札へ移す。
       returnToHand は持ち主の手札へ戻すので使えない。
       cards/39 が墓地間の移動で使っているのと同じ FX_CONTROL の
       ゾーン汎用な移動を使う。 */
    act({ type:'FX_CONTROL', player:r.p, zone:'hand', index:r.index,
          toPlayer:ctx.player, reason:'アマゾネスの鎖使い' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a8SelfBattleDestroyed(ctx) && API.me(ctx).lp > 1500
      && API.pileCards(ctx.opponent, 'hand', x => x.db.k === 'm').length > 0; } }
});

/* 20. ナイトエンド・ソーサラー — 特殊召喚に成功した時、相手の墓地のカードを2枚まで除外する */
API.registerChoiceHandler('a8.nightend', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave') API.banish(h, 'ナイトエンド・ソーサラー');
  });
});
defineScript('ナイトエンド・ソーサラー', {
  type:'monster', priority:1,
  condition(ctx){
    const e = ctx.event || {};
    if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))){
      ctx.reason = 'このカードの特殊召喚時に発動します'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave').length){ ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = API.pileCards(ctx.opponent, 'grave');
    if(!q.length) return;
    API.requestChoice({
      player:ctx.player, kind:'card', title:'ナイトエンド・ソーサラー：除外する相手の墓地のカード（2枚まで）',
      candidates:q, min:0, max:Math.min(2, q.length),
      resume:{ handler:'a8.nightend', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    const e = ctx.event || {};
    const hit = (e.card === ctx.card) || (e.uid != null && e.uid === ctx.card.uid)
      || (Array.isArray(e.cards) && e.cards.indexOf(ctx.card) >= 0)
      || (Array.isArray(e.uids) && e.uids.indexOf(ctx.card.uid) >= 0);
    return hit && API.pileCards(ctx.opponent, 'grave').length > 0; } }
});

/* 21. 闇王プロメティス — 召喚に成功した場合、自分の墓地の闇属性を任意の数だけ除外し、
   ターン終了時までこのカードの攻撃力を除外した数×400アップする */
API.registerChoiceHandler('a8.prometheus', (a, x) => {
  const picked = ((a && a.cards) || []).filter(t => t && !t.stale);
  let n = 0;
  picked.forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave'){ API.banish(h, '闇王プロメティス'); n++; }
  });
  if(n > 0 && x.uid != null){
    const me = findCardByUid(x.uid);
    if(me && me.zone === 'mz') API.modAtk(me, n * 400, 0, 'endTurn', '闇王プロメティス');
  }
});
function a8DarkGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === '闇');
}
defineScript('闇王プロメティス', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    const e = ctx.event || {};
    if(!(e.card === ctx.card || (e.uid != null && e.uid === ctx.card.uid))){
      ctx.reason = 'このカードの召喚時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const q = a8DarkGrave(ctx.player);
    if(!q.length) return;
    API.requestChoice({
      player:ctx.player, kind:'card', title:'闇王プロメティス：除外する闇属性モンスター（任意の数）',
      candidates:q, min:0, max:q.length,
      resume:{ handler:'a8.prometheus', args:{ player:ctx.player, uid:ensureCardUid(gameState, ctx.card) } }
    });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    const e = ctx.event || {};
    return (e.card === ctx.card) || (e.uid != null && e.uid === ctx.card.uid); } }
});

/* 22. ライヤー・ワイヤー — 墓地の昆虫族1体を除外し、相手モンスター1体を破壊する */
function a8InsectGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '昆虫');
}
defineScript('ライヤー・ワイヤー', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!a8InsectGrave(ctx.player).length){ ctx.reason = '墓地に昆虫族モンスターがいません'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ライヤー・ワイヤー（コスト）：除外する昆虫族', a8InsectGrave(ctx.player), t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'grave'){ API.banish(r, 'ライヤー・ワイヤー（コスト）'); done(true); }
      else done(false);
    });
  },
  selectTargets(ctx, done){
    API.selectCard('ライヤー・ワイヤー：破壊する相手モンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz') API.destroy(r, 'ライヤー・ワイヤー');
  },
  afterResolve(){}
});

/* 23. 水遁封印式（永続罠） — 1ターンに1度、手札の水属性1体を墓地へ送り、
   相手の墓地のカード1枚を除外する */
function a8WaterHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.at === '水');
}
defineScript('水遁封印式', {
  type:'trap', priority:2, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!a8WaterHand(ctx.player).length){ ctx.reason = '手札に水属性モンスターがいません'; return false; }
    if(!API.pileCards(ctx.opponent, 'grave').length){ ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('水遁封印式（コスト）：墓地へ送る水属性モンスター', a8WaterHand(ctx.player), t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){ API.sendHandToGrave(ctx.player, r.index, '水遁封印式（コスト）'); done(true); }
      else done(false);
    });
  },
  selectTargets(ctx, done){
    API.selectCard('水遁封印式：除外する相手の墓地のカード',
      API.pileCards(ctx.opponent, 'grave'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, '水遁封印式');
  },
  afterResolve(){}
});

/* 24. 死霊の巣（永続罠） — 自分の墓地のモンスターを任意の枚数除外し、
   その枚数と同じレベルを持つ表側表示モンスター1体を破壊する */
API.registerChoiceHandler('a8.nest', (a, x) => {
  const picked = ((a && a.cards) || []).filter(t => t && !t.stale);
  let n = 0;
  picked.forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave'){ API.banish(h, '死霊の巣'); n++; }
  });
  if(n <= 0) return;
  const q = API.fieldCards({ zone:'mz', filter:y => y.card.face === 'up' && curLV(y.card) === n });
  if(!q.length){ API.log('死霊の巣：レベル' + n + 'の表側表示モンスターがいません'); return; }
  API.selectCard('死霊の巣：破壊するレベル' + n + 'のモンスター', q, t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'mz') API.destroy(r, '死霊の巣');
  });
});
defineScript('死霊の巣', {
  type:'trap', priority:2, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x => x.db.k === 'm').length){
      ctx.reason = '墓地にモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = API.pileCards(ctx.player, 'grave', x => x.db.k === 'm');
    if(!q.length) return;
    API.requestChoice({
      player:ctx.player, kind:'card', title:'死霊の巣：除外する墓地のモンスター（任意の枚数）',
      candidates:q, min:0, max:q.length,
      resume:{ handler:'a8.nest', args:{ player:ctx.player } }
    });
  },
  afterResolve(){}
});

/* 25. 亜空間物質転送装置 — 自分の表側表示モンスター1体をエンドフェイズまで除外する */
API.registerScheduleHandler('a8.subspaceReturn', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  const p = (entry.player === 0 || entry.player === 1) ? entry.player : 0;
  if(h && h.zone === 'banish' && (gameState.players[p].mz || []).length < ZONE_LIMITS.mz)
    API.specialSummon(p, 'banish', h.index, entry.pos || 'atk', '亜空間物質転送装置', h.p);
});
defineScript('亜空間物質転送装置', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('亜空間物質転送装置：除外する自分のモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const card = r.card, pos = card.pos || 'atk';
    ensureCardUid(gameState, card);
    API.banish(r, '亜空間物質転送装置');
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'a8.subspaceReturn',
                   args:{ uid:card.uid, player:ctx.player, pos:pos }, source:{ card:ctx.card },
                   note:'亜空間物質転送装置' });
  },
  afterResolve(){}
});

/* 26. サイコ・トリガー — 自分のライフが相手より下の場合、墓地のサイキック2体を除外して2ドロー */
defineScript('サイコ・トリガー', {
  type:'trap', priority:2,
  condition(ctx){
    if(API.me(ctx).lp >= API.foe(ctx).lp){ ctx.reason = '自分のライフが相手より下である必要があります'; return false; }
    if(a6PsychicGrave(ctx.player).length < 2){ ctx.reason = '墓地にサイキック族が2体必要です'; return false; }
    if(API.me(ctx).deck.length < 2){ ctx.reason = 'デッキが2枚必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = a6PsychicGrave(ctx.player);
    API.selectCard('サイコ・トリガー（コスト）：除外するサイキック族（1体目）', q, a => {
      const ra = resolveTarget(a);
      if(ra && ra.zone === 'grave') API.banish(ra, 'サイコ・トリガー（コスト）');
      const rest = a6PsychicGrave(ctx.player);
      if(!rest.length){ done(false); return; }
      API.selectCard('サイコ・トリガー（コスト）：除外するサイキック族（2体目）', rest, b => {
        const rb = resolveTarget(b);
        if(rb && rb.zone === 'grave') API.banish(rb, 'サイコ・トリガー（コスト）');
        done(true);
      });
    });
  },
  resolve(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){}
});

/* ===================== CD. スタンバイ／エンドフェイズ ===================== */

/* 27. ダークゼブラ — 自分のスタンバイフェイズ時、自分のモンスターがこのカードのみの場合
   守備表示になり、そのターン表示形式を変更できない */
defineScript('ダークゼブラ', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    const mine = API.me(ctx).mz || [];
    if(!(mine.length === 1 && mine[0] === ctx.card)){ ctx.reason = '自分のモンスターがこのカードのみである必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.changePosition(me, 'def', 'ダークゼブラ');
    API.setCardFlag(me, 'a8ZebraLockTurn', gameState.turn, 'ダークゼブラ');
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    if(ctx.zone !== 'mz' || gameState.activePlayer !== ctx.player) return false;
    const mine = API.me(ctx).mz || [];
    return mine.length === 1 && mine[0] === ctx.card; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    cannotChangePosition(target, self){
      const me = self || target;
      return Number(me && me.a8ZebraLockTurn) === gameState.turn;
    }
  }
});

/* 28. マタンゴ — 自分のスタンバイフェイズ毎にコントローラーへ300ダメージ。
   自分のエンドフェイズに500払えばコントロールを相手に移す。 */
defineScript('マタンゴ', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.player, 300); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'mz' && gameState.activePlayer === ctx.player; } }
});

/* 29. カードトレーダー（永続魔法） — 自分のスタンバイフェイズ時に手札を1枚デッキに戻し、
   1枚ドローする。1ターンに1度。 */
defineScript('カードトレーダー', {
  type:'spell', priority:1, countLimit:1, targets:true, timing:['standbyPhase','mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('カードトレーダー：デッキに戻す手札', API.pileCards(ctx.player, 'hand'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    API.returnToDeck(r, false, 'カードトレーダー');
    API.shuffle(ctx.player);
    API.draw(ctx.player, 1);
  },
  afterResolve(){}
});

/* 30. リサイクル（永続魔法） — 自分ターンのスタンバイフェイズ時に300払い、
   自分の墓地のモンスター以外のカード1枚をデッキの一番下に戻す。 */
function a8NonMonsterGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k !== 'm');
}
defineScript('リサイクル', {
  type:'spell', priority:1, targets:true, timing:['standbyPhase','mainPhase'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(gameState.activePlayer !== ctx.player){ ctx.reason = '自分のターンに発動します'; return false; }
    if(API.me(ctx).lp <= 300){ ctx.reason = '300ライフポイントを払えません'; return false; }
    if(!a8NonMonsterGrave(ctx.player).length){ ctx.reason = '墓地にモンスター以外のカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 300); done(true); },
  selectTargets(ctx, done){
    API.selectCard('リサイクル：デッキの一番下に戻すカード', a8NonMonsterGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, true, 'リサイクル');
  },
  afterResolve(){}
});
