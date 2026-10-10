/* Auto cycle 02 — 19枚。engine 変更なし。
     A 戦闘破壊され墓地へ送られた時   : cycle01 と同じ onDamageStep('leave') + battle context
     B ダメージ計算前/行わず破壊       : dsTiming 'start' + endBattle()
     D 戦闘ダメージを与えた時          : onBattleDamage（複数効果は v49 requestChoice で選択）
     F リバース効果                    : onFlip（P26 Control / v10 Position / 除外 を利用）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */
/* cycle01 の a3* ヘルパを再利用する（同じ build に含まれる）。 */

/* 「自分フィールドのモンスターが相手ライフに戦闘ダメージを与えた時」 */
function a4OwnMonsterDealtDamage(ctx){
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = (e.dealtBy === ctx.player)
    ? (e.attackerUid != null ? e.attackerUid : e.defenderUid)
    : null;
  if(uid == null) return false;
  const hit = findCardByUid(uid);
  return !!(hit && hit.p === ctx.player && hit.zone === 'mz');
}
/* リバース効果の共通ガード。onFlip は反転召喚・戦闘反転の双方で LIVE。 */
function a4Flipped(ctx){
  const e = ctx.event || {};
  return (e.card === ctx.card) || (e.uid != null && e.uid === ctx.card.uid);
}
/* 相手の墓地のカード */
function a4FoeGrave(ctx){ return API.pileCards(ctx.opponent, 'grave'); }

/* 2択の効果選択を相手に見せずに自分が選ぶ（v49 requestChoice） */
function a4ModeChoice(ctx, title, opts, handler){
  API.requestChoice({
    player: ctx.player, kind:'card', title: title,
    candidates: opts.map(o => ({ key:o.key, label:o.label, value:o.key })),
    min:1, max:1,
    resume:{ handler: handler, args:{ player: ctx.player, opponent: ctx.opponent } }
  });
}
function a4PickedMode(a){
  const c = (a && a.cards && a.cards[0]) || null;
  return c ? String(c.value != null ? c.value : c.key) : null;
}

/* ===================== A. 戦闘破壊され墓地へ送られた時 ===================== */

/* 1. レイジアース — 表側表示の地属性以外を全て破壊（cycle01 と同じ雛形） */
a3AttributeSweep('レイジアース', '地');

/* 2. 暴鬼 — お互いが500ポイントダメージを受ける */
defineScript('暴鬼', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.player, 500); API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
});

/* 3. 薄幸の美少女 — このターンのバトルフェイズを終了する */
defineScript('薄幸の美少女', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(){ if(typeof v350EndBattlePhase === 'function') v350EndBattlePhase(); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
});

/* 4. エレファン — 除外されている自分のレベル3以下の獣族・獣戦士族・鳥獣族1体を手札へ（任意） */
function a4ElephunTargets(p){
  return API.pileCards(p, 'banish', x => x.db.k === 'm'
    && ['獣', '獣戦士', '鳥獣'].indexOf(x.db.ra) >= 0
    && Number(x.db.lv || 99) <= 3);
}
defineScript('エレファン', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!a4ElephunTargets(ctx.player).length){ ctx.reason = '除外されている対象のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('エレファン：手札に加える除外モンスター', a4ElephunTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'banish') API.returnToHand(r, 'エレファン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && a4ElephunTargets(ctx.player).length > 0; } }
});

/* 5. スプリット・D・ローズ — 「D・ローズトークン」2体を特殊召喚（任意） */
defineScript('スプリット・D・ローズ', {
  type:'monster', priority:1, activateFrom:['grave'], includesSpecialSummon:true,
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz - 1){ ctx.reason = 'モンスターゾーンに2体分の空きが必要です'; return false; }
    return true;
  },
  resolve(ctx){
    API.createToken(ctx.player,
      { key:'D・ローズトークン', name:'D・ローズトークン', atk:1200, def:1200, lv:3, ra:'植物', at:'闇', pos:'atk' }, 2);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && API.me(ctx).mz.length < ZONE_LIMITS.mz - 1; } }
});

/* ===================== B. ダメージ計算前 / 行わず破壊 ===================== */

/* 6. カミソーリトカゲ — 自分の場に他の爬虫類族がいる間、裏側守備表示を破壊 */
a3PreDamageDestroy('カミソーリトカゲ', ctx => {
  const others = API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.db.ra === '爬虫類' });
  if(!others.length) return null;
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && d.face === 'down') ? d : null;
});

/* ===================== D. 戦闘ダメージを与えた時 ===================== */

/* 7. フレムベル・デビル — 自分の墓地の炎族の数×200ダメージ */
function a4FireCount(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '炎').length;
}
defineScript('フレムベル・デビル', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const n = a4FireCount(ctx.player);
    if(n > 0) API.damageLP(ctx.opponent, n * 200);
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){ return a3DealtBattleDamage(ctx); } }
});

/* 8. 押し売りゾンビ（永続罠） — 自分のモンスターが戦闘ダメージを与えた時、
   相手の墓地のカード1枚を持ち主のデッキの一番下へ戻す */
defineScript('押し売りゾンビ', {
  type:'trap', priority:2, forced:true, targets:true,
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!a4OwnMonsterDealtDamage(ctx)){ ctx.reason = '自分のモンスターが戦闘ダメージを与えた場合に発動します'; return false; }
    if(!a4FoeGrave(ctx).length){ ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('押し売りゾンビ：デッキの一番下に戻すカード', a4FoeGrave(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, true, '押し売りゾンビ');
  },
  afterResolve(){},          /* 永続罠なので場に残る */
  passive:{ onBattleDamage(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up'
      && a4OwnMonsterDealtDamage(ctx) && a4FoeGrave(ctx).length > 0; } }
});

/* 9. 首領・ザルーグ — ●ランダム手札破棄 / ●相手デッキトップ2枚を墓地へ */
API.registerChoiceHandler('a4.zaloog-mode', (a, x) => {
  const m = a4PickedMode(a);
  if(m === 'discard'){
    const H = gameState.players[x.opponent].hand || [];
    if(H.length) API.discard(x.opponent, duelRandomInt(H.length), '首領・ザルーグ', { byEffect:true, byPlayer:x.player });
  }else if(m === 'mill'){
    const n = Math.min(2, (gameState.players[x.opponent].deck || []).length);
    if(n > 0) API.millTop(x.opponent, n, '首領・ザルーグ');
  }
});
defineScript('首領・ザルーグ', {
  type:'monster', priority:1,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手ライフに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!API.foe(ctx).hand.length && !API.foe(ctx).deck.length){ ctx.reason = '相手の手札もデッキもありません'; return false; }
    return true;
  },
  resolve(ctx){
    const opts = [];
    if(API.foe(ctx).hand.length) opts.push({ key:'discard', label:'相手の手札をランダムに1枚捨てる' });
    if(API.foe(ctx).deck.length) opts.push({ key:'mill', label:'相手のデッキの上から2枚墓地へ送る' });
    if(!opts.length) return;
    a4ModeChoice(ctx, '首領・ザルーグ：効果を1つ選択', opts, 'a4.zaloog-mode');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return a3DealtBattleDamage(ctx) && (API.foe(ctx).hand.length > 0 || API.foe(ctx).deck.length > 0); } }
});

/* 10. 黒蠍－罠はずしのクリフ — ●魔法・罠1枚を破壊 / ●相手デッキトップ2枚を墓地へ */
function a4SpellTrapOnField(){
  return API.fieldCards({ filter:x => (x.zone === 'sz' || x.zone === 'field') });
}
API.registerChoiceHandler('a4.cliff-mode', (a, x) => {
  const m = a4PickedMode(a);
  if(m === 'destroy'){
    const q = a4SpellTrapOnField();
    if(q.length) API.selectCard('黒蠍－罠はずしのクリフ：破壊する魔法・罠', q, t => {
      const r = resolveTarget(t); if(r) API.destroy(r, '黒蠍－罠はずしのクリフ');
    });
  }else if(m === 'mill'){
    const n = Math.min(2, (gameState.players[x.opponent].deck || []).length);
    if(n > 0) API.millTop(x.opponent, n, '黒蠍－罠はずしのクリフ');
  }
});
defineScript('黒蠍－罠はずしのクリフ', {
  type:'monster', priority:1,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手プレイヤーに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!a4SpellTrapOnField().length && !API.foe(ctx).deck.length){ ctx.reason = '選べる効果がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const opts = [];
    if(a4SpellTrapOnField().length) opts.push({ key:'destroy', label:'フィールドの魔法・罠1枚を破壊する' });
    if(API.foe(ctx).deck.length) opts.push({ key:'mill', label:'相手のデッキの上から2枚墓地へ送る' });
    if(!opts.length) return;
    a4ModeChoice(ctx, '黒蠍－罠はずしのクリフ：効果を1つ選択', opts, 'a4.cliff-mode');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return a3DealtBattleDamage(ctx) && (a4SpellTrapOnField().length > 0 || API.foe(ctx).deck.length > 0); } }
});

/* 11. 黒蠍－強力のゴーグ — ●相手モンスター1体をデッキトップへ / ●相手デッキトップ1枚を墓地へ */
API.registerChoiceHandler('a4.gorg-mode', (a, x) => {
  const m = a4PickedMode(a);
  if(m === 'bounce'){
    const q = API.fieldCards({ player:x.opponent, zone:'mz' });
    if(q.length) API.selectCard('黒蠍－強力のゴーグ：デッキの一番上に戻すモンスター', q, t => {
      const r = resolveTarget(t); if(r) API.returnToDeck(r, false, '黒蠍－強力のゴーグ');
    });
  }else if(m === 'mill'){
    if((gameState.players[x.opponent].deck || []).length) API.millTop(x.opponent, 1, '黒蠍－強力のゴーグ');
  }
});
defineScript('黒蠍－強力のゴーグ', {
  type:'monster', priority:1,
  condition(ctx){
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手プレイヤーに戦闘ダメージを与えた場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length && !API.foe(ctx).deck.length){
      ctx.reason = '選べる効果がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const opts = [];
    if(API.fieldCards({ player:ctx.opponent, zone:'mz' }).length)
      opts.push({ key:'bounce', label:'相手モンスター1体を持ち主のデッキの一番上に戻す' });
    if(API.foe(ctx).deck.length) opts.push({ key:'mill', label:'相手のデッキの一番上を1枚墓地へ送る' });
    if(!opts.length) return;
    a4ModeChoice(ctx, '黒蠍－強力のゴーグ：効果を1つ選択', opts, 'a4.gorg-mode');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return a3DealtBattleDamage(ctx)
      && (API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0 || API.foe(ctx).deck.length > 0); } }
});

/* ===================== F. リバース効果 ===================== */

/* 12. ガード・ドッグ — このターン相手プレイヤーは特殊召喚できない */
defineScript('ガード・ドッグ', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.setFlag(ctx.opponent, 'noSpecialSummon', true, true); },
  afterResolve(){},
  passive:{ onFlip(ctx){ return a4Flipped(ctx); } }
});

/* 13. 朱い靴 — 表側表示モンスター1体の表示形式を変更する（裏側表示にはできない） */
function a4FaceUpMonsters(){
  return API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' });
}
defineScript('朱い靴', {
  type:'monster', priority:1, forced:true, targets:true,
  condition(ctx){
    if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
    if(!a4FaceUpMonsters().length){ ctx.reason = '表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('朱い靴：表示形式を変更するモンスター', a4FaceUpMonsters(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz' || r.card.face !== 'up') return;
    /* 裏側表示にはできないので、表側攻撃⇔表側守備の切り替えだけ行う。 */
    API.changePosition(r, r.card.pos === 'atk' ? 'def' : 'atk', '朱い靴');
  },
  afterResolve(){},
  passive:{ onFlip(ctx){ return a4Flipped(ctx) && a4FaceUpMonsters().length > 0; } }
});

/* 14. 混沌の呪術師 — 自分または相手の墓地からモンスター1枚を選択して除外 */
function a4AnyGraveMonsters(){
  return API.pileCards(0, 'grave', x => x.db.k === 'm')
    .concat(API.pileCards(1, 'grave', x => x.db.k === 'm'));
}
defineScript('混沌の呪術師', {
  type:'monster', priority:1, forced:true, targets:true,
  condition(ctx){
    if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
    if(!a4AnyGraveMonsters().length){ ctx.reason = '墓地にモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('混沌の呪術師：除外するモンスター', a4AnyGraveMonsters(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, '混沌の呪術師');
  },
  afterResolve(){},
  passive:{ onFlip(ctx){ return a4Flipped(ctx) && a4AnyGraveMonsters().length > 0; } }
});

/* 15/16. デーモン・テイマー／ドラゴン・ライダー —
   相手の表側表示の指定種族1体のコントロールをエンドフェイズまで得る。
   P26 の changeControl(until:'endPhase') を使う。 */
function a4RaceControlSteal(name, race){
  function pool(ctx){
    return API.fieldCards({ player:ctx.opponent, zone:'mz',
      filter:x => x.card.face === 'up' && x.db.ra === race });
  }
  defineScript(name, {
    type:'monster', priority:1, forced:true, targets:true,
    condition(ctx){
      if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
      if(!pool(ctx).length){ ctx.reason = '相手フィールドに表側表示の' + race + '族モンスターがいません'; return false; }
      if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    },
    selectTargets(ctx, done){
      API.selectCard(name + '：コントロールを得る' + race + '族', pool(ctx), t => done([t]));
    },
    resolve(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(!r || r.zone !== 'mz') return;
      API.changeControl(r, ctx.player, name, 'endPhase', { card:ctx.card });
    },
    afterResolve(){},
    passive:{ onFlip(ctx){
      return a4Flipped(ctx) && pool(ctx).length > 0 && API.me(ctx).mz.length < ZONE_LIMITS.mz; } }
  });
}
a4RaceControlSteal('デーモン・テイマー', '悪魔');
a4RaceControlSteal('ドラゴン・ライダー', 'ドラゴン');

/* 17. 王座の侵略者 — 相手モンスター1体とこのカードのコントロールを入れ替える。
   バトルフェイズには発動できない。 */
defineScript('王座の侵略者', {
  type:'monster', priority:1, forced:true, targets:true,
  condition(ctx){
    if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
    if(gameState.phase === 'battle'){ ctx.reason = 'バトルフェイズには発動できません'; return false; }
    if(!API.fieldCards({ player:ctx.opponent, zone:'mz' }).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('王座の侵略者：コントロールを入れ替えるモンスター',
      API.fieldCards({ player:ctx.opponent, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone !== 'mz' || !me || me.zone !== 'mz') return;
    API.swapControl(me, r, '王座の侵略者', { card:ctx.card });
  },
  afterResolve(){},
  passive:{ onFlip(ctx){
    return a4Flipped(ctx) && gameState.phase !== 'battle'
      && API.fieldCards({ player:ctx.opponent, zone:'mz' }).length > 0; } }
});

/* 18. ディメンション・ポッド — お互いのプレイヤーが、相手の墓地のカードを3枚まで除外できる。
   相手側の選択は相手自身に行わせる（hidden information を混ぜない）。 */
API.registerChoiceHandler('a4.dimpod-banish', (a, x) => {
  ((a && a.cards) || []).filter(t => t && !t.stale).forEach(t => {
    const h = t.uid == null ? null : findCardByUid(t.uid);
    if(h && h.zone === 'grave') API.banish(h, 'ディメンション・ポッド');
  });
  /* 相手側の選択へ続ける */
  if(x.next === 0 || x.next === 1){
    const q = API.pileCards(x.next === 0 ? 1 : 0, 'grave');
    if(q.length) API.requestChoice({
      player: x.next, kind:'card', title:'ディメンション・ポッド：除外する相手の墓地のカード',
      candidates: q, min:0, max: Math.min(3, q.length),
      resume:{ handler:'a4.dimpod-banish', args:{ next:null } }
    });
  }
});
defineScript('ディメンション・ポッド', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(!a4Flipped(ctx)){ ctx.reason = 'リバースした場合に発動します'; return false; }
    if(!API.pileCards(0, 'grave').length && !API.pileCards(1, 'grave').length){
      ctx.reason = 'お互いの墓地にカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    /* 自分が「相手の墓地」から選ぶ → その後、相手が「自分の墓地」から選ぶ */
    const mine = API.pileCards(ctx.opponent, 'grave');
    if(mine.length){
      API.requestChoice({
        player: ctx.player, kind:'card', title:'ディメンション・ポッド：除外する相手の墓地のカード',
        candidates: mine, min:0, max: Math.min(3, mine.length),
        resume:{ handler:'a4.dimpod-banish', args:{ next: ctx.opponent } }
      });
      return;
    }
    const theirs = API.pileCards(ctx.player, 'grave');
    if(theirs.length) API.requestChoice({
      player: ctx.opponent, kind:'card', title:'ディメンション・ポッド：除外する相手の墓地のカード',
      candidates: theirs, min:0, max: Math.min(3, theirs.length),
      resume:{ handler:'a4.dimpod-banish', args:{ next:null } }
    });
  },
  afterResolve(){},
  passive:{ onFlip(ctx){
    return a4Flipped(ctx)
      && (API.pileCards(0, 'grave').length > 0 || API.pileCards(1, 'grave').length > 0); } }
});

/* 19. ジャイアントウィルス — 500ダメージ＋デッキから同名を任意の数だけ表側攻撃表示で特殊召喚 */
function a4VirusInDeck(p){
  return API.pileCards(p, 'deck', x => x.db.n === 'ジャイアントウィルス');
}
defineScript('ジャイアントウィルス', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'], includesSpecialSummon:true,
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    API.damageLP(ctx.opponent, 500);
    const room = ZONE_LIMITS.mz - API.me(ctx).mz.length;
    const pool = a4VirusInDeck(ctx.player);
    const n = Math.min(room, pool.length);
    for(let i = 0; i < n; i++){
      const q = a4VirusInDeck(ctx.player);
      if(!q.length) break;
      const r = resolveTarget(q[0]);
      if(!r || r.zone !== 'deck') break;
      API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'ジャイアントウィルス', ctx.player);
    }
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx); } }
});
