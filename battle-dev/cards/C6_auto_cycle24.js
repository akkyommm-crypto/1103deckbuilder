/* Auto cycle 24 — 13枚。engine 変更なし。
     XIIIA 「この効果でドローしたカード」（System v8 lastDrawCards + v20 reveal）
     XIIIB 戦闘破壊をきっかけにしたドロー
     XIIIC 除外・チェーン・装備を条件にしたドロー
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d3MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }

/* 戦闘破壊の (破壊した側, 破壊された側) の組。c7PlantKilled と同じ読み方。 */
function d3KillPairs(ctx){
  const b = ctx.battle || {};
  const pairs = [];
  if(b.destroyedDef && b.atkCard && b.defCard) pairs.push([b.atkCard, b.defCard]);
  if(b.destroyedAtk && b.defCard && b.atkCard) pairs.push([b.defCard, b.atkCard]);
  return pairs;
}
/* 自分フィールドの killer（test で絞る）が相手モンスターを戦闘破壊し
   墓地へ送ったか。戻り値は破壊された側のカード。 */
function d3MyKillToGrave(ctx, test){
  for(const [killer, victim] of d3KillPairs(ctx)){
    const kh = locateCardAnyV4(killer);
    if(!kh || kh.p !== ctx.player || kh.zone !== 'mz') continue;
    if(typeof test === 'function' && !test(killer, kh)) continue;
    const vh = locateCardAnyV4(victim);
    if(!vh || vh.zone !== 'grave' || vh.p === ctx.player) continue;
    return victim;
  }
  return null;
}
/* 自分の墓地の指定属性モンスター */
function d3GraveByAttr(p, attr){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === attr);
}
/* 場のカードのレベル（取得できない場合は 99 を返して条件から外す） */
function d3LevelOf(card){
  const h = card && locateCardAnyV4(card);
  if(!h) return 99;
  const lv = Number(API.levelOf(h));
  return Number.isFinite(lv) ? lv : 99;
}
/* 自分の墓地の指定種族モンスター */
function d3GraveByRace(p, race){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === race);
}
/* 「この効果でドローしたカード」（System v8）。手札に残っているものだけ。 */
function d3JustDrawn(){
  const list = (typeof API.lastDrawCards === 'function') ? API.lastDrawCards() : [];
  return (list || []).filter(h => h && h.zone === 'hand');
}
/* 引いたカードをお互いに確認する。公開情報になるので audience は両者。 */
function d3RevealDrawn(handles, label){
  if(!handles || !handles.length) return;
  API.reveal({ cards:handles, audience:'both', label:label, until:'resolution' });
}

/* ===================== A. 戦闘破壊をきっかけにしたドロー ===================== */

/* 1. ダーク・パーシアス — 戦闘で相手モンスターを破壊した場合、自分の墓地の
      闇属性1体を除外する事で1枚ドローする。
      攻撃力は自分の墓地の闇属性の数×100アップする */
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('ダーク・パーシアス', {
  type:'monster', priority:1, forced:false, dsTiming:'leave', targets:true,
  condition(ctx){
    if(!d3MyKillToGrave(ctx, k => k === ctx.card)){
      ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!d3GraveByAttr(ctx.player, '闇').length){
      ctx.reason = '墓地に闇属性モンスターがいません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ダーク・パーシアス（コスト）：除外する闇属性モンスター',
      d3GraveByAttr(ctx.player, '闇'), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave'){ API.banish(r, 'ダーク・パーシアス（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!d3MyKillToGrave(ctx, k => k === ctx.card)
        && d3GraveByAttr(ctx.player, '闇').length > 0
        && API.me(ctx).deck.length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self) return null;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return null;
      const n = d3GraveByAttr(h.p, '闇').length;
      return n ? { atk:n * 100 } : null;
    }
  }
});

/* 2. 幻獣の角 — 発動後は攻撃力800アップの装備カードとなり、自分の
      獣族・獣戦士族1体に装備する。装備モンスターが戦闘で相手モンスターを
      破壊し墓地へ送った時、1枚ドローする */
function d3HornTargets(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.ra === '獣' || x.db.ra === '獣戦士') });
}
defineScript('幻獣の角', {
  type:'trap', priority:2, targets:true, activateFrom:['sz'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && (h.db.ra === '獣' || h.db.ra === '獣戦士')); },
              label:'獣族・獣戦士族のみ' },
  condition(ctx){
    /* 既に装備カードになっている場合は「装備モンスターが破壊した時」の誘発。 */
    if(ctx.card.equipTo){
      if(!b1EquippedKilled(ctx)){
        ctx.reason = '装備モンスターが戦闘で相手モンスターを破壊した時に発動します'; return false; }
      if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
      return true;
    }
    if(!d3HornTargets(ctx.player).length){
      ctx.reason = '装備できる獣族・獣戦士族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('幻獣の角：装備するモンスター', d3HornTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.card.equipTo){ API.draw(ctx.player, 1); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz') API.equipSpell(me, r, '幻獣の角');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && !!ctx.card.equipTo && !!b1EquippedKilled(ctx)
        && API.me(ctx).deck.length > 0; } },
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:800 };
    }
  }
});

/* 3. 弱者の意地 — 永続魔法。自分の手札が0枚の場合、自分フィールドの
      レベル2以下のモンスターが戦闘で相手モンスターを破壊し墓地へ送った時、
      2枚ドローする */
defineScript('弱者の意地', {
  type:'spell', priority:1, activateFrom:['sz'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(API.me(ctx).hand.length !== 0){ ctx.reason = '自分の手札が0枚の場合に発動します'; return false; }
    if(!d3MyKillToGrave(ctx, k => d3LevelOf(k) <= 2)){
      ctx.reason = 'レベル2以下のモンスターが戦闘で相手モンスターを破壊した時に発動します';
      return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up'
        && API.me(ctx).hand.length === 0
        && !!d3MyKillToGrave(ctx, k => d3LevelOf(k) <= 2)
        && API.me(ctx).deck.length > 0; } }
});

/* 4. 暗黒のミミック LV3 — 戦闘によって墓地に送られた場合、コントローラーは
      1枚ドローする。「暗黒のミミック LV1」の効果で特殊召喚されていた場合は2枚 */
function d3MimicBattleDead(ctx){
  if(ctx.zone !== 'grave') return false;
  const b = ctx.battle || {};
  if(!((b.defCard === ctx.card && b.destroyedDef) || (b.atkCard === ctx.card && b.destroyedAtk)))
    return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'mz' && g.turn === gameState.turn);
}
defineScript('暗黒のミミック LV3', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!d3MimicBattleDead(ctx)){
      ctx.reason = '戦闘によって墓地へ送られた場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    /* LV1 の効果で特殊召喚されていたか。LV1 側が召喚時に刻む印を読む。 */
    const byLv1 = Number(ctx.card.c2MimicFromLv1 || 0) > 0;
    API.draw(ctx.player, byLv1 ? 2 : 1);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return d3MimicBattleDead(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 5. アルケミー・サイクル — 発動ターンのエンドフェイズ時まで、自分フィールドの
      表側モンスター全ての元々の攻撃力を0にする。この効果で元々の攻撃力が0に
      なっているモンスターが戦闘で破壊され墓地へ送られる度に1枚ドローする */
function d3AlchemyVictim(ctx){
  for(const [, victim] of d3KillPairs(ctx)){
    if(Number(victim.d3AlchemyTurn || 0) !== gameState.turn) continue;
    const vh = locateCardAnyV4(victim);
    if(!vh || vh.zone !== 'grave') continue;
    return victim;
  }
  return null;
}
defineScript('アルケミー・サイクル', {
  type:'trap', priority:2, activateFrom:['grave'],
  condition(ctx){
    /* 墓地からは「破壊されるたびに引く」残存効果としてだけ誘発する。 */
    if(ctx.zone === 'grave'){
      if(!d3AlchemyVictim(ctx)){
        ctx.reason = '元々の攻撃力を0にしたモンスターが戦闘破壊された時に発動します'; return false; }
      if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
      return true;
    }
    if(!API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }).length){
      ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){ API.draw(ctx.player, 1); return; }
    API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' })
      .forEach(h => {
        API.setBaseStats(h, 0, null, 'endPhase', 'アルケミー・サイクル');
        API.setCardFlag(h, 'd3AlchemyTurn', gameState.turn, 'アルケミー・サイクル');
      });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'grave' && !!d3AlchemyVictim(ctx) && API.me(ctx).deck.length > 0; } }
});

/* ===================== B. 引いたカードを確認する ===================== */

/* 6. ミスティック・パイパー — このカードをリリースして発動。1枚ドローし、
      引いたカードをお互いに確認する。レベル1モンスターならもう1枚ドローする */
defineScript('ミスティック・パイパー', {
  type:'monster', priority:1, countLimit:1, nameLimit:true, activateFrom:['mz'],
  timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz'){ API.sendToGrave(me, 'ミスティック・パイパー（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    API.draw(ctx.player, 1);
    const drawn = d3JustDrawn();
    d3RevealDrawn(drawn, 'ミスティック・パイパー');
    const h = drawn[0];
    if(!h) return;
    if(h.db.k === 'm' && Number(h.db.lv) === 1 && API.me(ctx).deck.length)
      API.draw(ctx.player, 1);
  },
  afterResolve(){}
});

/* 7. モンスター・スロット — 自分フィールドの表側モンスター1体を選択し、
      同じレベルの自分の墓地のモンスター1体を除外する。その後1枚ドローし
      お互いに確認する。同じレベルのモンスターだった場合は特殊召喚する */
API.registerChoiceHandler('d3.monsterSlot', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const lv = Number(args && args.lv) || 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(!r || r.zone !== 'grave') return;
  API.banish(r, 'モンスター・スロット');
  if(!gameState.players[p].deck.length) return;
  API.draw(p, 1);
  const drawn = d3JustDrawn();
  d3RevealDrawn(drawn, 'モンスター・スロット');
  const h = drawn[0];
  if(!h || h.db.k !== 'm' || Number(h.db.lv) !== lv) return;
  if(!d3MzOpen(p)) return;
  const now = locateCardAnyV4(h.card);
  if(now && now.zone === 'hand')
    API.specialSummon(p, 'hand', now.index, 'atk', 'モンスター・スロット', now.p);
});
function d3SlotPairs(p){
  const out = [];
  API.fieldCards({ player:p, zone:'mz', filter:x => x.card.face === 'up' }).forEach(m => {
    const lv = Number(API.levelOf(m));
    if(API.pileCards(p, 'grave', x => x.db.k === 'm' && Number(x.db.lv) === lv).length)
      out.push(m);
  });
  return out;
}
defineScript('モンスター・スロット', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!d3SlotPairs(ctx.player).length){
      ctx.reason = '同じレベルのモンスターが墓地にいる自分のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('モンスター・スロット：選択するモンスター', d3SlotPairs(ctx.player),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const lv = Number(API.levelOf(r));
    const q = API.pileCards(ctx.player, 'grave', x => x.db.k === 'm' && Number(x.db.lv) === lv);
    if(!q.length) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'モンスター・スロット：除外する同じレベルのモンスター',
      candidates: q,
      resume:{ handler:'d3.monsterSlot', args:{ player:ctx.player, lv:lv } }
    });
  },
  afterResolve(){}
});

/* ===================== C. 除外・チェーン・装備からのドロー ===================== */

/* 8. フォーチュンフューチャー — 除外されている自分の「フォーチュンレディ」1体を
      対象に発動。そのモンスターを墓地に戻し、2枚ドローする */
function d3FortuneBanished(p){
  return API.pileCards(p, 'banish',
    x => x.db.k === 'm' && isSetCardV4(x.db, SETCODE.FORTUNE_LADY));
}
defineScript('フォーチュンフューチャー', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!d3FortuneBanished(ctx.player).length){
      ctx.reason = '除外されている自分の「フォーチュンレディ」モンスターがいません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('フォーチュンフューチャー：墓地に戻す「フォーチュンレディ」',
      d3FortuneBanished(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'banish') return;
    API.sendToGrave(r, 'フォーチュンフューチャー');
    API.draw(ctx.player, 2);
  },
  afterResolve(){}
});

/* 9. 地母神アイリス — チェーンが3つ積まれた場合、1枚ドローする。
      同一チェーン上に複数回同名カードの効果が発動されている場合は発動できない */
function d3ChainRootId(){
  const ch = gameState.chain || [];
  return ch.length ? ch[0].chainId : null;
}
function d3ChainHasDuplicateName(){
  const seen = {};
  for(const l of (gameState.chain || [])){
    const n = l && l.name;
    if(n == null) continue;
    if(seen[n]) return true;
    seen[n] = true;
  }
  return false;
}
function d3IrisReady(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
  if((gameState.chain || []).length < 3) return false;
  if(d3ChainHasDuplicateName()) return false;
  const root = d3ChainRootId();
  if(root == null) return false;
  /* 同じチェーンで二重に誘発しない */
  return Number(ctx.card.d3IrisChain || -1) !== Number(root);
}
defineScript('地母神アイリス', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!d3IrisReady(ctx)){
      ctx.reason = 'チェーンが3つ積まれた場合に発動します（同名の重複があると発動できません）';
      return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    const root = d3ChainRootId();
    if(me && root != null) API.setCardFlag(me, 'd3IrisChain', Number(root), '地母神アイリス');
    API.draw(ctx.player, 1);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'mz' && d3IrisReady(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 10. ワンダー・ワンド — 魔法使い族にのみ装備可能。装備モンスターの攻撃力は500アップ。
       装備モンスターとこのカードを墓地へ送って発動でき、2枚ドローする */
defineScript('ワンダー・ワンド', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.ra === '魔法使い'); },
              label:'魔法使い族のみ' },
  condition(ctx){
    if(ctx.card.equipTo){
      if(!a8Equipped(ctx.card)){ ctx.reason = '装備モンスターがいません'; return false; }
      if(API.me(ctx).deck.length < 2){ ctx.reason = 'デッキが2枚未満です'; return false; }
      return true;
    }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' && x.db.ra === '魔法使い' }).length){
      ctx.reason = '装備できる魔法使い族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){ done([]); return; }
    API.selectCard('ワンダー・ワンド：装備する魔法使い族',
      API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.ra === '魔法使い' }), t => done([t]));
  },
  cost(ctx, done){
    if(!ctx.card.equipTo){ done(true); return; }
    const host = a8Equipped(ctx.card);
    const hh = host && locateCardAnyV4(host);
    const me = locateCardAnyV4(ctx.card);
    if(!hh || hh.zone !== 'mz' || !me || me.zone !== 'sz'){ done(false); return; }
    API.sendToGrave(hh, 'ワンダー・ワンド（コスト）');
    const again = locateCardAnyV4(ctx.card);
    if(again && again.zone === 'sz') API.sendToGrave(again, 'ワンダー・ワンド（コスト）');
    done(true);
  },
  resolve(ctx){
    /* まだ場に表側で残っていて装備していない＝①の装備効果。
       ②はコストで自身も墓地へ送られているので、ここには来ない。 */
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'sz' && !me.card.equipTo){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(r && r.zone === 'mz') API.equipSpell(me, r, 'ワンダー・ワンド');
      return;
    }
    API.draw(ctx.player, 2);
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self.equipTo || self.equipTo.uid !== card.uid) return null;
      return { atk:500 };
    }
  }
});

/* 11. モンスター回収 — 元々の持ち主が自分となる自分フィールドのモンスター1体を
       選択して発動。選択したモンスターと自分の手札を全てデッキに戻してシャッフルし、
       元の手札の枚数分ドローする。持ち主が相手のカードが手札にある場合は発動できない */
function d3MyOwnMonsters(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.owner == null || x.card.owner === p });
}
function d3HandHasForeign(p){
  return API.pileCards(p, 'hand').some(x => x.card.owner != null && x.card.owner !== p);
}
defineScript('モンスター回収', {
  type:'spell', priority:2, targets:true,
  condition(ctx){
    if(d3HandHasForeign(ctx.player)){
      ctx.reason = '元々の持ち主が相手となるカードが手札にあります'; return false; }
    if(!d3MyOwnMonsters(ctx.player).length){
      ctx.reason = '元々の持ち主が自分となるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('モンスター回収：デッキに戻すモンスター', d3MyOwnMonsters(ctx.player),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    const n = API.me(ctx).hand.length;      /* 元の手札の枚数 */
    API.returnToDeck(r, false, 'モンスター回収');
    /* 手札は毎回先頭を引き直して戻す（index ずれを避ける） */
    let guard = 0;
    while(API.me(ctx).hand.length && guard++ < 60){
      const h = API.pileCards(ctx.player, 'hand')[0];
      if(!h) break;
      API.returnToDeck(h, false, 'モンスター回収');
    }
    API.shuffle(ctx.player);
    if(n > 0) API.draw(ctx.player, n);
  },
  afterResolve(){}
});

/* 12. 酒呑童子 — 1ターンに1度、以下から1つを選んで発動できる。
       ●自分の墓地のアンデット族2体を除外して1枚ドローする
       ●除外されている自分のアンデット族1体を対象にデッキの一番上に戻す */
API.registerChoiceHandler('d3.shuten', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const cards = (answer && answer.cards) || [];
  if(args && args.mode === 'banish'){
    if(cards.length < 2) return;
    cards.slice(0, 2).forEach(t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'grave') API.banish(r, '酒呑童子（コスト）');
    });
    if(gameState.players[p].deck.length) API.draw(p, 1);
    return;
  }
  const r = cards.length ? resolveTarget(cards[0]) : null;
  if(r && r.zone === 'banish') API.returnToDeck(r, false, '酒呑童子');
});
function d3ShutenBanishable(p){ return d3GraveByRace(p, 'アンデット'); }
function d3ShutenReturnable(p){
  return API.pileCards(p, 'banish', x => x.db.k === 'm' && x.db.ra === 'アンデット');
}
defineScript('酒呑童子', {
  type:'monster', priority:1, countLimit:1, activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    const a = d3ShutenBanishable(ctx.player).length >= 2 && API.me(ctx).deck.length > 0;
    const b = d3ShutenReturnable(ctx.player).length > 0;
    if(!a && !b){ ctx.reason = 'どちらの効果も選べません'; return false; }
    return true;
  },
  resolve(ctx){
    const a = d3ShutenBanishable(ctx.player).length >= 2 && API.me(ctx).deck.length > 0;
    const b = d3ShutenReturnable(ctx.player).length > 0;
    const doBanish = () => API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:2, max:2,
      title:'酒呑童子：除外するアンデット族2体',
      candidates: d3ShutenBanishable(ctx.player),
      resume:{ handler:'d3.shuten', args:{ player:ctx.player, mode:'banish' } }
    });
    const doReturn = () => API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'酒呑童子：デッキの一番上に戻すアンデット族',
      candidates: d3ShutenReturnable(ctx.player),
      resume:{ handler:'d3.shuten', args:{ player:ctx.player, mode:'return' } }
    });
    if(a && b){
      API.requestChoice({player:ctx.player, kind:'yesno', title:'酒呑童子',
        note:'墓地のアンデット族2体を除外して1枚ドローしますか？（いいえ＝除外されたアンデット族をデッキの一番上に戻す）',
        candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
        min:1, max:1, cancelable:false,
        resume:{handler:'s03u62.shuten-doji-confirm', args:{player:ctx.player}},
        meta:{scriptName:'酒呑童子'}});
      return;
    }
    if(a) doBanish(); else if(b) doReturn();
  },
  afterResolve(){}
});
/* S03-U62: resolve() 内の legacy API.confirm を SaveLoad安全な登録済みハンドラへ移行。
   除外/戻す本体の選択自体は既に requestChoice('d3.shuten') 経由で SaveLoad安全。 */
API.registerChoiceHandler('s03u62.shuten-doji-confirm', (answer, args) => {
  const yes = !answer.cancelled && answer.cards[0] && answer.cards[0].value === true;
  if(yes){
    API.requestChoice({player:args.player, kind:'card', cancelable:false, min:2, max:2,
      title:'酒呑童子：除外するアンデット族2体',
      candidates: d3ShutenBanishable(args.player),
      resume:{handler:'d3.shuten', args:{player:args.player, mode:'banish'}}});
  } else {
    API.requestChoice({player:args.player, kind:'card', cancelable:false, min:1, max:1,
      title:'酒呑童子：デッキの一番上に戻すアンデット族',
      candidates: d3ShutenReturnable(args.player),
      resume:{handler:'d3.shuten', args:{player:args.player, mode:'return'}}});
  }
});

/* 13. 鬼ゴブリン — 自分のエンドフェイズ時に手札から通常モンスター1枚を
       デッキの一番下に戻す事で1枚ドローできる。1ターンに1度 */
function d3NormalInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && treatedAsNormal(x.card));
}
defineScript('鬼ゴブリン', {
  type:'monster', priority:1, countLimit:1, activateFrom:['mz'], timing:['endPhase'],
  targets:true,
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(gameState.phase !== 'end' || gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のエンドフェイズ時に発動します'; return false; }
    if(!d3NormalInHand(ctx.player).length){
      ctx.reason = '手札に通常モンスターがいません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('鬼ゴブリン（コスト）：デッキの一番下に戻す通常モンスター',
      d3NormalInHand(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'hand'){ API.returnToDeck(r, true, '鬼ゴブリン（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){}
});
