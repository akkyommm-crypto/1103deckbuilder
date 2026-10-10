/* Auto cycle 27 — 11枚。engine 変更なし。
     XVIA 条件付きの自己特殊召喚（手札から）
     XVIB 手札のモンスターを出す・戻す
     XVIC ダメージ計算時だけの数値変化・ダメージ0（continuous.lpChange）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d6MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d6Foe(p){ return p === 0 ? 1 : 0; }
function d6MainPhase(p){
  return (gameState.phase === 'main1' || gameState.phase === 'main2')
      && gameState.activePlayer === p;
}
/* 手札からこのカードを特殊召喚する（共通の後始末込み） */
function d6SelfSummonFromHand(ctx, reason, banishOnLeave){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'hand' || !d6MzOpen(ctx.player)) return null;
  ensureCardUid(gameState, me.card);
  const uid = me.card.uid;
  API.specialSummon(ctx.player, 'hand', me.index, 'atk', reason, me.p);
  const now = (uid != null) ? findCardByUid(uid) : null;
  if(now && now.zone === 'mz' && banishOnLeave)
    API.setCardFlag(now, 'banishWhenLeavesField', true, reason);
  return now;
}
/* 自分の墓地のチューナー */
function d6GraveTuners(p){
  return API.pileCards(p, 'grave',
    x => x.db.k === 'm' && (x.db.st || []).includes('チューナー'));
}
/* いま戦闘しているのがこのカードか（ダメージ計算時の数値変化用） */
function d6InBattle(self){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return false;
  const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
  const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  return atk === self || def === self;
}

/* ===================== A. 条件付きの自己特殊召喚 ===================== */

/* 1. A・ジェネクス・バードマン — 自分フィールドの表側モンスター1体を持ち主の手札に戻して
      手札から特殊召喚できる。風属性を戻した場合は攻撃力が500アップする。
      この効果で特殊召喚したこのカードはフィールドから離れた場合に除外される */
defineScript('A・ジェネクス・バードマン', {
  type:'monster', priority:1, targets:true, activateFrom:['hand'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' }).length){
      ctx.reason = '手札に戻す自分の表側表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('A・ジェネクス・バードマン：手札に戻すモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const wasWind = dbOf(r.card).at === '風';
    API.returnToHand(r, 'A・ジェネクス・バードマン');
    const now = d6SelfSummonFromHand(ctx, 'A・ジェネクス・バードマン', true);
    if(now && wasWind) API.modAtk(now, 500, 0, 'permanent', 'A・ジェネクス・バードマン');
  },
  afterResolve(){}
});

/* 2. アンノウン・シンクロン — 相手フィールドにモンスターが存在し、
      自分フィールドにモンスターが存在しない場合、手札から特殊召喚できる。
      この方法による特殊召喚はデュエル中に1度だけ */
defineScript('アンノウン・シンクロン', {
  type:'monster', priority:1, countLimit:{ n:1, scope:'duel' },
  activateFrom:['hand'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if((gameState.players[ctx.player].mz || []).length > 0){
      ctx.reason = '自分フィールドにモンスターが存在しない場合に発動します'; return false; }
    if(!(gameState.players[ctx.opponent].mz || []).length){
      ctx.reason = '相手フィールドにモンスターが存在する場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){ d6SelfSummonFromHand(ctx, 'アンノウン・シンクロン', false); },
  afterResolve(){}
});

/* 3. 泣き神の石像 — 自分の墓地のチューナー1体を除外して発動し、手札から特殊召喚する */
defineScript('泣き神の石像', {
  type:'monster', priority:1, targets:true, activateFrom:['hand'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!d6GraveTuners(ctx.player).length){
      ctx.reason = '墓地にチューナーがいません'; return false; }
    if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('泣き神の石像（コスト）：除外するチューナー',
      d6GraveTuners(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave'){ API.banish(r, '泣き神の石像（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){ d6SelfSummonFromHand(ctx, '泣き神の石像', false); },
  afterResolve(){}
});

/* 4. ガーディアン・エアトス — ①自分の墓地にモンスターが存在しない場合、
      手札から特殊召喚できる。②装備された自分の装備魔法1枚を墓地へ送り、
      相手の墓地のモンスターを3体まで除外する。攻撃力はその数×500アップする */
function d6MyEquipsOn(card, p){
  return API.equipsOn(locateCardAnyV4(card))
    .filter(h => h && h.p === p && h.db && h.db.k === 's');
}
API.registerChoiceHandler('d6.airtos', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const cards = (answer && answer.cards) || [];
  let n = 0;
  cards.forEach(t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'grave'){ API.banish(r, 'ガーディアン・エアトス'); n++; }
  });
  const self = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(n > 0 && self && self.zone === 'mz')
    API.modAtk(self, n * 500, 0, 'endTurn', 'ガーディアン・エアトス');
});
defineScript('ガーディアン・エアトス', {
  type:'monster', priority:1, activateFrom:['hand','mz'], timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone === 'mz'){
      if(!d6MyEquipsOn(ctx.card, ctx.player).length){
        ctx.reason = 'このカードに装備された自分の装備魔法がありません'; return false; }
      if(!API.pileCards(ctx.opponent, 'grave', x => x.db.k === 'm').length){
        ctx.reason = '相手の墓地にモンスターがいません'; return false; }
      return true;
    }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(API.pileCards(ctx.player, 'grave', x => x.db.k === 'm').length){
      ctx.reason = '自分の墓地にモンスターが存在しない場合に発動します'; return false; }
    if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.zone !== 'mz'){ done(true); return; }
    const q = d6MyEquipsOn(ctx.card, ctx.player);
    if(!q.length){ done(false); return; }
    API.selectCard('ガーディアン・エアトス（コスト）：墓地へ送る装備魔法', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'sz'){
        API.sendToGrave(r, 'ガーディアン・エアトス（コスト）'); done(true);
      } else done(false);
    });
  },
  resolve(ctx){
    if(ctx.zone !== 'mz'){ d6SelfSummonFromHand(ctx, 'ガーディアン・エアトス', false); return; }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:true, min:0, max:3,
      title:'ガーディアン・エアトス：除外する相手の墓地のモンスター（3体まで）',
      candidates: API.pileCards(ctx.opponent, 'grave', x => x.db.k === 'm'),
      resume:{ handler:'d6.airtos', args:{ player:ctx.player, uid:me.card.uid } }
    });
  },
  afterResolve(){}
});

/* 5. 地球巨人 ガイア・プレート — 自分の墓地の岩石族2体を除外して手札から特殊召喚できる。
      自分のスタンバイフェイズ毎に墓地の岩石族1体を除外する（できなければ墓地へ送る）。
      このカードと戦闘を行う相手モンスターの攻撃力・守備力はダメージ計算時のみ半分になる */
function d6RockGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '岩石');
}
API.registerChoiceHandler('d6.gaiaPlate', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const cards = (answer && answer.cards) || [];
  if(cards.length < 2) return;
  cards.slice(0, 2).forEach(t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'grave') API.banish(r, '地球巨人 ガイア・プレート（コスト）');
  });
  const me = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(!me || me.zone !== 'hand') return;
  if((gameState.players[p].mz || []).length >= ZONE_LIMITS.mz) return;
  API.specialSummon(p, 'hand', me.index, 'atk', '地球巨人 ガイア・プレート', me.p);
});
defineScript('地球巨人 ガイア・プレート', {
  type:'monster', priority:1, forced:false,
  activateFrom:['hand','mz'], timing:['mainPhase','standby'],
  condition(ctx){
    if(ctx.zone === 'mz'){
      if(!(gameState.phase === 'standby' && gameState.activePlayer === ctx.player)){
        ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
      return true;
    }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(d6RockGrave(ctx.player).length < 2){
      ctx.reason = '墓地に岩石族モンスターが2体いません'; return false; }
    if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.zone === 'mz'){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      const q = d6RockGrave(ctx.player);
      if(q.length) API.banish(q[0], '地球巨人 ガイア・プレート');
      else API.sendToGrave(me, '地球巨人 ガイア・プレート');
      return;
    }
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand') return;
    ensureCardUid(gameState, me.card);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:2, max:2,
      title:'地球巨人 ガイア・プレート（コスト）：除外する岩石族2体',
      candidates: d6RockGrave(ctx.player),
      resume:{ handler:'d6.gaiaPlate', args:{ player:ctx.player, uid:me.card.uid } }
    });
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){
    return ctx.zone === 'mz' && gameState.activePlayer === ctx.player; } },
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(card, self){
      if(card === self) return null;
      if(!d6InBattle(self)) return null;
      const b = gameState.battle;
      const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
      const def = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
      const other = (atk === self) ? def : (def === self ? atk : null);
      if(other !== card) return null;
      /* ダメージ計算時のみ半分。apply の中で curATK を呼ぶと
         collectContinuous が再入するので、元々の数値（v14 base）から出す。 */
      return { setAtk:Math.floor(baseAtkV14(card) / 2),
               setDef:Math.floor(baseDefV14(card) / 2) };
    }
  }
});

/* 6. ヘルウェイ・パトロール — ①戦闘でモンスターを破壊し墓地へ送った場合、
      そのモンスターの元々のレベル×100ダメージを相手に与える。
      ②墓地のこのカードを除外して発動でき、手札から攻撃力2000以下の悪魔族1体を特殊召喚する */
function d6DemonInHand(p){
  return API.pileCards(p, 'hand',
    x => x.db.k === 'm' && x.db.ra === '悪魔' && Number(x.db.atk) <= 2000);
}
defineScript('ヘルウェイ・パトロール', {
  type:'monster', priority:1, forced:false, targets:true, dsTiming:'after',
  activateFrom:['mz','grave'], timing:['mainPhase','damageStep'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!d6MainPhase(ctx.player)){
        ctx.reason = '自分のメインフェイズに発動します'; return false; }
      if(!d6DemonInHand(ctx.player).length){
        ctx.reason = '手札に攻撃力2000以下の悪魔族がいません'; return false; }
      if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      return true;
    }
    if(!d5SelfKilled(ctx)){
      ctx.reason = '戦闘でモンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone !== 'grave'){ done([]); return; }
    API.selectCard('ヘルウェイ・パトロール：特殊召喚する悪魔族',
      d6DemonInHand(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    if(ctx.zone !== 'grave'){ done(true); return; }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave'){ API.banish(me, 'ヘルウェイ・パトロール（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    if(ctx.zone !== 'grave'){
      const victim = d5SelfKilled(ctx);
      if(!victim) return;
      const lv = Number(dbOf(victim).lv) || 0;
      if(lv > 0) API.damageLP(ctx.opponent, lv * 100);
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'hand' && d6MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'ヘルウェイ・パトロール', r.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'mz' && !!d5SelfKilled(ctx); } }
});

/* ===================== B. 手札のモンスターを出す ===================== */

/* 7. 召喚師セームベル — 自分のメインフェイズ、このカードと同じレベルのモンスター1体を
      手札から特殊召喚できる。表側で存在する限り1度しか使えない */
function d6SameLevelHand(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return [];
  const lv = Number(API.levelOf(me));
  return API.pileCards(ctx.player, 'hand',
    x => x.db.k === 'm' && Number(x.db.lv) === lv);
}
defineScript('召喚師セームベル', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d6MainPhase(ctx.player)){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    /* 「フィールドに表側で存在する限り1度」＝そのカード実体に印を残す。 */
    if(Number(me.card.d6SembleUsed || 0) > 0){
      ctx.reason = 'このカードは既にこの効果を使用しています'; return false; }
    if(!d6SameLevelHand(ctx).length){
      ctx.reason = '同じレベルのモンスターが手札にいません'; return false; }
    if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('召喚師セームベル：特殊召喚する同じレベルのモンスター',
      d6SameLevelHand(ctx), t => done([t]));
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.setCardFlag(me, 'd6SembleUsed', 1, '召喚師セームベル');
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'hand' && d6MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'hand', r.index, 'atk', '召喚師セームベル', r.p);
  },
  afterResolve(){}
});

/* 8. 吹き荒れるウィン — このカード以外の自分フィールドの風属性1体をリリースし、
      手札から風属性モンスター1体を特殊召喚する。1ターンに1度。
      特殊召喚したモンスターは「吹き荒れるウィン」が場を離れた場合に破壊される */
function d6WindTribute(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.card.face === 'up' && x.db.at === '風' });
}
function d6WindInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.at === '風');
}
defineScript('吹き荒れるウィン', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d6WindTribute(ctx).length){
      ctx.reason = 'リリースできる他の風属性モンスターがいません'; return false; }
    if(!d6WindInHand(ctx.player).length){
      ctx.reason = '手札に風属性モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('吹き荒れるウィン（コスト）：リリースする風属性',
      d6WindTribute(ctx), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, '吹き荒れるウィン（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const q = d6WindInHand(ctx.player);
    if(!q.length || !d6MzOpen(ctx.player)) return;
    const pick = q[0];
    ensureCardUid(gameState, pick.card);
    const uid = pick.card.uid;
    API.specialSummon(ctx.player, 'hand', pick.index, 'atk', '吹き荒れるウィン', pick.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    const me = locateCardAnyV4(ctx.card);
    /* 「吹き荒れるウィン」が離れたら、出したモンスターを破壊する。 */
    if(now && now.zone === 'mz' && me) API.linkOnLeave(now, me, 'destroy', '吹き荒れるウィン');
  },
  afterResolve(){}
});

/* 9. ゼータ・レティキュラント — ①墓地に存在し、相手フィールドのモンスターが除外される度に
      「イーバトークン」1体を自分フィールドに特殊召喚する。
      ②自分フィールドの「イーバトークン」1体をリリースし、手札から特殊召喚できる */
defineTokenSpecV11('イーバトークン',
  { name:'イーバトークン', atk:500, def:500, lv:2, ra:'悪魔', at:'闇', pos:'atk' });
function d6FoeMonsterBanished(ctx){
  const e = ctx.event || {};
  const cards = b2SummonedCards(e);
  return cards.some(c => {
    if(dbOf(c).k !== 'm') return false;
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'banish') return false;
    /* 「相手フィールドのモンスター」が除外された場合 */
    return e.fromPlayer === ctx.opponent && e.fromZone === 'mz';
  });
}
function d6EvaTokens(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => API.isToken(x) && API.tokenKey(x) === 'イーバトークン' });
}
defineScript('ゼータ・レティキュラント', {
  type:'monster', priority:1, forced:true, activateFrom:['grave','hand'],
  timing:['free','mainPhase'],
  condition(ctx){
    if(ctx.zone === 'hand'){
      if(!d6EvaTokens(ctx.player).length){
        ctx.reason = '自分フィールドに「イーバトークン」がいません'; return false; }
      return true;
    }
    if(!d6FoeMonsterBanished(ctx)){
      ctx.reason = '相手フィールドのモンスターが除外された場合に発動します'; return false; }
    if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.zone !== 'hand'){ done(true); return; }
    const q = d6EvaTokens(ctx.player);
    if(!q.length){ done(false); return; }
    API.sendToGrave(q[0], 'ゼータ・レティキュラント（コスト）');
    done(true);
  },
  resolve(ctx){
    if(ctx.zone === 'hand'){ d6SelfSummonFromHand(ctx, 'ゼータ・レティキュラント', false); return; }
    if(!d6MzOpen(ctx.player)) return;
    API.createTokens(ctx.player, 'イーバトークン', 1, null);
  },
  afterResolve(){},
  passive:{ onRemove(ctx){
    return ctx.zone === 'grave' && d6FoeMonsterBanished(ctx) && d6MzOpen(ctx.player); } }
});

/* ===================== C. ダメージ計算時の数値・ダメージ0 ===================== */

/* 10. パワー・ジャイアント — 手札のレベル4以下のモンスター1体を墓地へ送って
       手札から特殊召喚できる。その場合、墓地へ送ったモンスターのレベルの数だけ
       このカードのレベルを下げる。戦闘を行う場合、そのダメージステップ終了時まで
       自分が受ける効果ダメージは0になる */
function d6LowHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && Number(x.db.lv) <= 4);
}
/* S03-U17: 手順で墓地へ送れるのは、手札にある現在レベル4以下のモンスター（このカード以外）。 */
function d6ProcedureFodder(ctx){
  return API.pileCards(ctx.player, 'hand', x => x.db.k === 'm' && x.card !== ctx.card && curLV(x.card) <= 4);
}
defineScript('パワー・ジャイアント', {
  /* S03-U17: 「手札のレベル4以下のモンスター1体を墓地へ送り、手札から特殊召喚する事ができる」はチェーンを作らない特殊召喚手順
     （Wiki 11/08/12：この特殊召喚はインヴェルズ・ローチで無効にできる）。
     下げるレベルは墓地へ送ったモンスターの墓地でのレベル（元々のレベル）。表側表示で存在する限り下がったまま（10/07/18）。 */
  type:'monster', priority:1,
  summonProcedure:{from:'hand', positions:['atk','def'],
    condition(ctx){
      if(!d6ProcedureFodder(ctx).length){ ctx.reason = '手札にレベル4以下のモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const pool = d6ProcedureFodder(ctx);
      if(!pool.length){ done(false); return; }
      API.selectCard('パワー・ジャイアント：墓地へ送るレベル4以下のモンスター', pool, t => {
        const r = t && resolveTarget(t);
        if(!r || r.zone !== 'hand'){ done(false); return; }
        ctx.procedureDataS03 = { sentLv: Number(dbOf(r.card).lv) || 0 };
        API.sendHandToGrave(ctx.player, r.index, 'パワー・ジャイアント（特殊召喚）');
        done(true);
      });
    },
    afterSummonS03(h, data){
      const down = Number(data && data.sentLv) || 0;
      if(h && down > 0) API.modLevel(h, -down, 'permanent', 'パワー・ジャイアント');
    }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    lpChange(info, self){
      if(info.player !== (locateCardAnyV4(self) || {}).p) return null;
      if(info.cause !== 'effect') return null;
      if(!d6InBattle(self)) return null;
      return info.delta < 0 ? 0 : null;
    }
  }
});

/* 11. ソード・マスター — 自分の戦士族の攻撃で相手モンスターが破壊されなかった
       ダメージステップ終了時、手札から特殊召喚できる。
       守備表示モンスターを攻撃した時、守備力を攻撃力が超えていれば貫通する */
function d6WarriorFailedAttack(ctx){
  const b = ctx.battle || {};
  if(!b.atkCard || !b.defCard) return false;
  if(b.destroyedDef) return false;
  const kh = locateCardAnyV4(b.atkCard);
  if(!kh || kh.p !== ctx.player || kh.zone !== 'mz') return false;
  return dbOf(b.atkCard).ra === '戦士';
}
defineScript('ソード・マスター', {
  type:'monster', priority:1, dsTiming:'after', activateFrom:['hand'], timing:['damageStep'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!d6WarriorFailedAttack(ctx)){
      ctx.reason = '自分の戦士族の攻撃で相手モンスターが破壊されなかった時に発動します';
      return false; }
    if(!d6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){ d6SelfSummonFromHand(ctx, 'ソード・マスター', false); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'hand' && d6WarriorFailedAttack(ctx) && d6MzOpen(ctx.player); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    piercingDamage(info){
      return (info && info.atkCard && info.atkCard === info.self)
        ? Math.max(0, Number(info.amount) || 0) : 0;
    }
  }
});
