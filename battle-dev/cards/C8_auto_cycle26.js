/* Auto cycle 26 — 12枚。engine 変更なし。
     XVA 墓地・除外からのサルベージ
     XVB デッキ／エクストラからのリクルート
     XVC リリース軽減の召喚手順（normalSummonProcedure）
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d5MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
/* 自分の墓地／除外／デッキ／エクストラの絞り込み */
function d5Pile(p, zone, f){ return API.pileCards(p, zone, f); }
/* このカードが戦闘で相手モンスターを破壊したか（破壊された側を返す） */
function d5SelfKilled(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
/* 相手によって破壊され墓地へ送られたか */
function d5KilledByFoe(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
  const rec = c1DestroyRecord(ctx.card);
  if(!rec) return false;
  return rec.battle || rec.byPlayer === (ctx.player === 0 ? 1 : 0);
}
/* 破壊され墓地へ送られたか（誰が破壊したかは問わない） */
function d5Destroyed(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn);
}
/* 装備カード扱いで自分に装備されているモンスターの装備先 */
function d5EquipHost(card){
  const t = card && card.equipTo;
  if(!t || t.uid == null) return null;
  const h = findCardByUid(t.uid);
  return (h && h.zone === 'mz') ? h : null;
}

/* ===================== A. 墓地・除外からのサルベージ ===================== */

/* 1. フレムベル・ドラグノフ — 戦闘破壊され墓地へ送られた時、相手に500ダメージ。
      墓地のこのカードと自分フィールドの表側炎属性1体を除外して発動でき、
      デッキから「フレムベル・ドラグノフ」1体を手札に加える */
function d5FireOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.at === '炎' });
}
function d5DragunovInDeck(p){
  return d5Pile(p, 'deck', x => x.db.n === 'フレムベル・ドラグノフ');
}
defineScript('フレムベル・ドラグノフ', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone !== 'grave'){
      ctx.reason = '墓地で発動します'; return false; }
    /* 戦闘破壊された直後の誘発（ダメージ）か、墓地からの起動効果か */
    const b = ctx.battle || {};
    const battleDead = (b.defCard === ctx.card && b.destroyedDef)
                    || (b.atkCard === ctx.card && b.destroyedAtk);
    if(battleDead) return true;
    if(!d5FireOnField(ctx.player).length){
      ctx.reason = '除外する自分の表側炎属性モンスターがいません'; return false; }
    if(!d5DragunovInDeck(ctx.player).length){
      ctx.reason = 'デッキに「フレムベル・ドラグノフ」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const b = ctx.battle || {};
    if((b.defCard === ctx.card && b.destroyedDef)
       || (b.atkCard === ctx.card && b.destroyedAtk)){ done([]); return; }
    API.selectCard('フレムベル・ドラグノフ（コスト）：除外する炎属性モンスター',
      d5FireOnField(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const b = ctx.battle || {};
    if((b.defCard === ctx.card && b.destroyedDef)
       || (b.atkCard === ctx.card && b.destroyedAtk)){
      API.damageLP(ctx.opponent, 500); return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone !== 'mz' || !me || me.zone !== 'grave') return;
    API.banish(r, 'フレムベル・ドラグノフ（コスト）');
    const again = locateCardAnyV4(ctx.card);
    if(again && again.zone === 'grave') API.banish(again, 'フレムベル・ドラグノフ（コスト）');
    const q = d5DragunovInDeck(ctx.player);
    if(q.length) API.deckToHand(ctx.player, q[0].index, 'フレムベル・ドラグノフ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(ctx.zone !== 'grave') return false;
    const b = ctx.battle || {};
    return (b.defCard === ctx.card && b.destroyedDef)
        || (b.atkCard === ctx.card && b.destroyedAtk); } }
});

/* 2. 聖騎士ジャンヌ — ①このカードが攻撃するダメージステップの間、攻撃力は300ダウン。
      ②相手によって破壊され墓地へ送られた場合、手札を1枚墓地へ送り、
      自分の墓地のレベル4以下の戦士族1体を手札に加える */
function d5LowWarriorGrave(p){
  return d5Pile(p, 'grave', x => x.db.k === 'm' && x.db.ra === '戦士' && Number(x.db.lv) <= 4);
}
defineScript('聖騎士ジャンヌ', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!d5KilledByFoe(ctx)){
      ctx.reason = '相手によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '墓地へ送る手札がありません'; return false; }
    if(!d5LowWarriorGrave(ctx.player).length){
      ctx.reason = '墓地にレベル4以下の戦士族がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = API.pileCards(ctx.player, 'hand');
    if(!q.length){ done(false); return; }
    API.selectCard('聖騎士ジャンヌ（コスト）：墓地へ送る手札', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.sendHandToGrave(ctx.player, r.index, '聖騎士ジャンヌ（コスト）'); done(true);
      } else done(false);
    });
  },
  selectTargets(ctx, done){
    API.selectCard('聖騎士ジャンヌ：手札に加える戦士族',
      d5LowWarriorGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, '聖騎士ジャンヌ');
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return d5KilledByFoe(ctx)
      && API.me(ctx).hand.length > 0 && d5LowWarriorGrave(ctx.player).length > 0; },
    onDestroy(ctx){ return d5KilledByFoe(ctx)
      && API.me(ctx).hand.length > 0 && d5LowWarriorGrave(ctx.player).length > 0; }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self) return null;
      const b = gameState.battle;
      if(!b || b.target === 'direct') return null;
      const atk = (gameState.players[b.player].mz || [])[b.atkIdx];
      return atk === self ? { atk:-300 } : null;
    }
  }
});

/* 3. 次元合成師 — ①1ターンに1度、自分メインフェイズにデッキの一番上を除外し、
      このカードの攻撃力をターン終了時まで500アップする。
      ②破壊され墓地へ送られた時、除外されている自分のモンスター1体を手札に加える */
function d5MyBanishedMonsters(p){
  return d5Pile(p, 'banish', x => x.db.k === 'm');
}
defineScript('次元合成師', {
  type:'monster', priority:1, countLimit:1, targets:true,
  activateFrom:['mz','grave'], timing:['mainPhase','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!d5Destroyed(ctx)){
        ctx.reason = '破壊され墓地へ送られた時に発動します'; return false; }
      if(!d5MyBanishedMonsters(ctx.player).length){
        ctx.reason = '除外されている自分のモンスターがいません'; return false; }
      return true;
    }
    if(gameState.phase !== 'main1' && gameState.phase !== 'main2'){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(gameState.activePlayer !== ctx.player){
      ctx.reason = '自分のターンに発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone !== 'grave'){ done([]); return; }
    API.selectCard('次元合成師：手札に加える除外されたモンスター',
      d5MyBanishedMonsters(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'grave'){
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const r = t && resolveTarget(t);
      if(r && r.zone === 'banish') API.returnToHand(r, '次元合成師');
      return;
    }
    const top = d5Pile(ctx.player, 'deck')[0];
    if(top) API.banish(top, '次元合成師');
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.modAtk(me, 500, 0, 'endTurn', '次元合成師');
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return ctx.zone === 'grave' && d5Destroyed(ctx)
      && d5MyBanishedMonsters(ctx.player).length > 0; },
    onDestroy(ctx){ return ctx.zone === 'grave' && d5Destroyed(ctx)
      && d5MyBanishedMonsters(ctx.player).length > 0; }
  }
});

/* 4. ラヴァル・ランスロッド — リリースなしで召喚できる。
      その方法で召喚した場合、エンドフェイズ時に墓地へ送られる。
      フィールドのこのカードが破壊され墓地へ送られた時、
      除外されている自分の炎属性モンスター1体を手札に加える */
function d5MyBanishedFire(p){
  return d5Pile(p, 'banish', x => x.db.k === 'm' && x.db.at === '炎');
}
API.registerScheduleHandler('d5.lavalSelfSend', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.sendToGrave(h, 'ラヴァル・ランスロッド');
});
defineScript('ラヴァル・ランスロッド', {
  type:'monster', priority:1, targets:true, activateFrom:['mz','grave'],
  normalSummonProcedure:{ includeStandard:true, methods:[
    { id:'lavalLancelord0', tributes:0, modes:['summon'],
      summonLabel:'リリースなしで召喚（エンドフェイズに墓地へ送られる）',
      condition(){ return true; } }
  ]},
  condition(ctx){
    if(ctx.zone === 'mz'){
      /* リリースなしで召喚された直後にエンドフェイズの自壊を予約する */
      if(Number(ctx.card.summonedTurn) !== gameState.turn){
        ctx.reason = '召喚した直後に処理します'; return false; }
      if(Number(ctx.card.tributeCount || 0) > 0){
        ctx.reason = 'リリースなしで召喚した場合のみ処理します'; return false; }
      if(API.schedules('d5.lavalSelfSend').length){
        ctx.reason = '既に予約されています'; return false; }
      return true;
    }
    if(!d5Destroyed(ctx)){
      ctx.reason = '破壊され墓地へ送られた時に発動します'; return false; }
    if(!d5MyBanishedFire(ctx.player).length){
      ctx.reason = '除外されている自分の炎属性モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone === 'mz'){ done([]); return; }
    API.selectCard('ラヴァル・ランスロッド：手札に加える除外された炎属性',
      d5MyBanishedFire(ctx.player), t => done([t]));
  },
  resolve(ctx){
    if(ctx.zone === 'mz'){
      const me = locateCardAnyV4(ctx.card);
      if(!me || me.zone !== 'mz') return;
      ensureCardUid(gameState, me.card);
      API.schedule({ at:'endPhase', turns:0, player:ctx.player,
        handler:'d5.lavalSelfSend', source:ctx.card, note:'ラヴァル・ランスロッド',
        args:{ uid:me.card.uid } });
      return;
    }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'banish') API.returnToHand(r, 'ラヴァル・ランスロッド');
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){
      return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
          && Number(ctx.card.tributeCount || 0) === 0
          && !API.schedules('d5.lavalSelfSend').length; },
    onSendToGrave(ctx){ return ctx.zone === 'grave' && d5Destroyed(ctx)
      && d5MyBanishedFire(ctx.player).length > 0; },
    onDestroy(ctx){ return ctx.zone === 'grave' && d5Destroyed(ctx)
      && d5MyBanishedFire(ctx.player).length > 0; }
  }
});

/* 5. ドラグニティ－コルセスカ — 装備カード扱いでこのカードを装備している
      モンスターが戦闘で相手モンスターを破壊した時、種族・属性が装備モンスターと
      同じレベル4以下のモンスター1体をデッキから手札に加える */
function d5CorsescaHostKilled(ctx){
  const host = d5EquipHost(ctx.card);
  if(!host) return null;
  const b = ctx.battle || {};
  if(b.atkCard === host.card && b.destroyedDef && b.defCard) return host;
  if(b.defCard === host.card && b.destroyedAtk && b.atkCard) return host;
  return null;
}
function d5CorsescaSearchable(p, host){
  if(!host) return [];
  const ra = host.db.ra, at = host.db.at;
  return d5Pile(p, 'deck',
    x => x.db.k === 'm' && x.db.ra === ra && x.db.at === at && Number(x.db.lv) <= 4);
}
defineScript('ドラグニティ－コルセスカ', {
  type:'monster', priority:1, targets:true, activateFrom:['sz'],
  blocksIfNoDeckToHand:true,   // S03-U04: 任意の誘発。ライオウ適用中は発動できない
  condition(ctx){
    const host = d5CorsescaHostKilled(ctx);
    if(!host){
      ctx.reason = '装備先が戦闘で相手モンスターを破壊した時に発動します'; return false; }
    if(!d5CorsescaSearchable(ctx.player, host).length){
      ctx.reason = '同じ種族・属性のレベル4以下のモンスターがデッキにいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const host = d5CorsescaHostKilled(ctx);
    API.selectCard('ドラグニティ－コルセスカ：手札に加えるモンスター',
      d5CorsescaSearchable(ctx.player, host), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.deckToHand(ctx.player, r.index, 'ドラグニティ－コルセスカ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const host = d5CorsescaHostKilled(ctx);
    return !!host && d5CorsescaSearchable(ctx.player, host).length > 0; } }
});

/* 6. アームド・チェンジャー — 手札から装備魔法カード1枚を墓地へ送って発動する装備魔法。
      装備モンスターが戦闘でモンスターを破壊した場合、
      墓地から装備モンスターの攻撃力以下のモンスター1体を手札に加えられる */
function d5EquipSpellsInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 's' && x.db.sub === '装備');
}
defineScript('アームド・チェンジャー', {
  type:'spell', priority:1, targets:true, activateFrom:['sz'], timing:['mainPhase','damageStep'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){
    if(ctx.card.equipTo){
      const host = a8Equipped(ctx.card);
      if(!host){ ctx.reason = '装備モンスターがいません'; return false; }
      if(!b1EquippedKilled(ctx)){
        ctx.reason = '装備モンスターが戦闘でモンスターを破壊した場合に発動します'; return false; }
      if(!d5Pile(ctx.player, 'grave',
            x => x.db.k === 'm' && Number(x.db.atk) <= curATK(host)).length){
        ctx.reason = '装備モンスターの攻撃力以下のモンスターが墓地にいません'; return false; }
      return true;
    }
    if(!d5EquipSpellsInHand(ctx.player).length){
      ctx.reason = '手札に装備魔法カードがありません'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
          filter:x => x.card.face === 'up' }).length){
      ctx.reason = '装備できる自分のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.card.equipTo){ done(true); return; }
    const q = d5EquipSpellsInHand(ctx.player);
    if(!q.length){ done(false); return; }
    API.selectCard('アームド・チェンジャー（コスト）：墓地へ送る装備魔法', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.sendHandToGrave(ctx.player, r.index, 'アームド・チェンジャー（コスト）'); done(true);
      } else done(false);
    });
  },
  selectTargets(ctx, done){
    if(ctx.card.equipTo){
      const host = a8Equipped(ctx.card);
      API.selectCard('アームド・チェンジャー：手札に加えるモンスター',
        d5Pile(ctx.player, 'grave',
          x => x.db.k === 'm' && Number(x.db.atk) <= curATK(host)), t => done([t]));
      return;
    }
    API.selectCard('アームド・チェンジャー：装備するモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz', filter:x => x.card.face === 'up' }),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(ctx.card.equipTo){
      if(r && r.zone === 'grave') API.returnToHand(r, 'アームド・チェンジャー');
      return;
    }
    const me = locateCardAnyV4(ctx.card);
    if(r && r.zone === 'mz' && me && me.zone === 'sz')
      API.equipSpell(me, r, 'アームド・チェンジャー');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    if(ctx.zone !== 'sz' || !ctx.card.equipTo) return false;
    const host = a8Equipped(ctx.card);
    return !!host && !!b1EquippedKilled(ctx)
        && d5Pile(ctx.player, 'grave',
             x => x.db.k === 'm' && Number(x.db.atk) <= curATK(host)).length > 0; } }
});

/* ===================== B. デッキ／エクストラからのリクルート ===================== */

/* 7. オーバー・デステニー — 自分の墓地の「D－HERO」1体を対象に発動。
      そのレベルの半分以下のレベルの「D－HERO」1体をデッキから特殊召喚する。
      特殊召喚したモンスターはこのターンのエンドフェイズに破壊される */
API.registerScheduleHandler('d5.destroyUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.destroy(h, (args && args.reason) || '予約');
});
function d5DestinyGrave(p){
  return d5Pile(p, 'grave', x => x.db.k === 'm' && isSetCardV4(x.db, SETCODE.DESTINY_HERO));
}
function d5DestinyDeck(p, maxLv){
  return d5Pile(p, 'deck',
    x => x.db.k === 'm' && isSetCardV4(x.db, SETCODE.DESTINY_HERO) && Number(x.db.lv) <= maxLv);
}
defineScript('オーバー・デステニー', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!d5MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    const q = d5DestinyGrave(ctx.player)
      .filter(x => d5DestinyDeck(ctx.player, Math.floor(Number(x.db.lv) / 2)).length);
    if(!q.length){
      ctx.reason = '対象にできる「D－HERO」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = d5DestinyGrave(ctx.player)
      .filter(x => d5DestinyDeck(ctx.player, Math.floor(Number(x.db.lv) / 2)).length);
    API.selectCard('オーバー・デステニー：対象にする墓地の「D－HERO」', q, t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !d5MzOpen(ctx.player)) return;
    const maxLv = Math.floor(Number(dbOf(r.card).lv) / 2);
    const q = d5DestinyDeck(ctx.player, maxLv);
    if(!q.length) return;
    const pick = q[0];
    ensureCardUid(gameState, pick.card);
    const uid = pick.card.uid;
    API.specialSummon(ctx.player, 'deck', pick.index, 'atk', 'オーバー・デステニー', pick.p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(now && now.zone === 'mz')
      API.schedule({ at:'endPhase', turns:0, player:ctx.player,
        handler:'d5.destroyUid', source:ctx.card, note:'オーバー・デステニー',
        args:{ uid:uid, reason:'オーバー・デステニー' } });
  },
  afterResolve(){}
});

/* 8. アマゾネスの里 — フィールド魔法。
      ①フィールドの「アマゾネス」モンスターの攻撃力は200アップする。
      ②1ターンに1度、「アマゾネス」モンスターが戦闘・効果で破壊され墓地へ送られた時、
        その元々のレベル以下のレベルを持つ「アマゾネス」1体をデッキから特殊召喚する */
function d5AmazonKilled(ctx){
  for(const [, victim] of d3KillPairs(ctx)){
    if(!isSetCardV4(dbOf(victim), SETCODE.AMAZONESS)) continue;
    const vh = locateCardAnyV4(victim);
    if(!vh || vh.zone !== 'grave') continue;
    return victim;
  }
  return null;
}
function d5AmazonDeck(p, maxLv){
  return d5Pile(p, 'deck',
    x => x.db.k === 'm' && isSetCardV4(x.db, SETCODE.AMAZONESS) && Number(x.db.lv) <= maxLv);
}
defineScript('アマゾネスの里', {
  type:'spell', priority:1, countLimit:1, activateFrom:['field'],
  condition(ctx){
    if(ctx.zone !== 'field' || ctx.card.face !== 'up'){
      ctx.reason = 'フィールドゾーンに表側表示で存在する必要があります'; return false; }
    const victim = d5AmazonKilled(ctx);
    if(!victim){
      ctx.reason = '「アマゾネス」モンスターが破壊され墓地へ送られた時に発動します'; return false; }
    if(!d5MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    if(!d5AmazonDeck(ctx.player, Number(dbOf(victim).lv)).length){
      ctx.reason = 'デッキに条件を満たす「アマゾネス」がいません'; return false; }
    return true;
  },
  resolve(ctx){
    const victim = d5AmazonKilled(ctx);
    if(!victim || !d5MzOpen(ctx.player)) return;
    const q = d5AmazonDeck(ctx.player, Number(dbOf(victim).lv));
    if(!q.length) return;
    API.specialSummon(ctx.player, 'deck', q[0].index, 'atk', 'アマゾネスの里', q[0].p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'field' && ctx.card.face === 'up' && !!d5AmazonKilled(ctx)
        && d5MzOpen(ctx.player); } },
  continuous:{
    scope:'allMonsters', from:['field'],
    apply(card){
      return isSetCardV4(dbOf(card), SETCODE.AMAZONESS) ? { atk:200 } : null;
    }
  }
});

/* 9. ファルシオンβ — 戦闘で相手モンスターを破壊した場合、以下から1つを選択して発動。
       ●デッキから機械族・光属性・攻撃力1200以下のモンスター1体を墓地へ送る
       ●自分の墓地から機械族・光属性・攻撃力1200以下のモンスター1体を特殊召喚する */
function d5FalchionPool(p, zone){
  return d5Pile(p, zone,
    x => x.db.k === 'm' && x.db.ra === '機械' && x.db.at === '光' && Number(x.db.atk) <= 1200);
}
/* S03-U62: resolve() 内の legacy API.confirm を SaveLoad安全な登録済みハンドラへ移行。
   ミル/蘇生本体の選択自体は既に requestChoice('d5.falchion') 経由で SaveLoad安全。 */
API.registerChoiceHandler('s03u62.falchion-confirm', (answer, args) => {
  const yes = !answer.cancelled && answer.cards[0] && answer.cards[0].value === true;
  const mode = yes ? 'mill' : 'revive';
  const title = yes ? 'ファルシオンβ：墓地へ送る機械族・光属性' : 'ファルシオンβ：特殊召喚する機械族・光属性';
  const pool = d5FalchionPool(args.player, yes ? 'deck' : 'grave');
  if(!pool.length) return;
  API.requestChoice({player:args.player, kind:'card', cancelable:false, min:1, max:1,
    title, candidates: pool,
    resume:{handler:'d5.falchion', args:{player:args.player, mode}}});
});
API.registerChoiceHandler('d5.falchion', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(!r) return;
  if(args && args.mode === 'mill'){
    if(r.zone === 'deck') API.mill(p, r.index, 'ファルシオンβ');
    return;
  }
  if(r.zone === 'grave' && d5MzOpen(p))
    API.specialSummon(p, 'grave', r.index, 'atk', 'ファルシオンβ', r.p);
});
defineScript('ファルシオンβ', {
  type:'monster', priority:1, forced:true, dsTiming:'after', activateFrom:['mz'],
  condition(ctx){
    if(!d5SelfKilled(ctx)){
      ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!d5FalchionPool(ctx.player, 'deck').length
       && !(d5FalchionPool(ctx.player, 'grave').length && d5MzOpen(ctx.player))){
      ctx.reason = '選択できる効果がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const canMill = d5FalchionPool(ctx.player, 'deck').length > 0;
    const canRevive = d5FalchionPool(ctx.player, 'grave').length > 0 && d5MzOpen(ctx.player);
    const doMill = () => API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'ファルシオンβ：墓地へ送る機械族・光属性',
      candidates: d5FalchionPool(ctx.player, 'deck'),
      resume:{ handler:'d5.falchion', args:{ player:ctx.player, mode:'mill' } }
    });
    const doRevive = () => API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'ファルシオンβ：特殊召喚する機械族・光属性',
      candidates: d5FalchionPool(ctx.player, 'grave'),
      resume:{ handler:'d5.falchion', args:{ player:ctx.player, mode:'revive' } }
    });
    if(canMill && canRevive){
      API.requestChoice({player:ctx.player, kind:'yesno', title:'ファルシオンβ',
        note:'デッキから墓地へ送りますか？（いいえ＝墓地から特殊召喚する）',
        candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
        min:1, max:1, cancelable:false,
        resume:{handler:'s03u62.falchion-confirm', args:{player:ctx.player}},
        meta:{scriptName:'ファルシオンβ'}});
      return;
    }
    if(canMill) doMill(); else if(canRevive) doRevive();
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'mz' && !!d5SelfKilled(ctx)
        && (d5FalchionPool(ctx.player, 'deck').length > 0
            || (d5FalchionPool(ctx.player, 'grave').length > 0 && d5MzOpen(ctx.player))); } }
});

/* 10. シンクロ・チェンジ — 自分フィールドの表側シンクロモンスター1体を除外して発動。
       そのモンスターと同じレベルのシンクロモンスター1体をエクストラデッキから特殊召喚する。
       この効果で特殊召喚した効果モンスターの効果は無効化される */
function d5MySynchroField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('シンクロ') });
}
function d5SynchroInEx(p, lv){
  return d5Pile(p, 'ex',
    x => x.db.k === 'm' && (x.db.st || []).includes('シンクロ') && Number(x.db.lv) === lv);
}
defineScript('シンクロ・チェンジ', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    const q = d5MySynchroField(ctx.player)
      .filter(x => d5SynchroInEx(ctx.player, Number(API.levelOf(x))).length);
    if(!q.length){
      ctx.reason = '同じレベルのシンクロモンスターがエクストラデッキにいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = d5MySynchroField(ctx.player)
      .filter(x => d5SynchroInEx(ctx.player, Number(API.levelOf(x))).length);
    API.selectCard('シンクロ・チェンジ（コスト）：除外するシンクロモンスター', q, t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz'){ done(false); return; }
    ctx.d5SyncLv = Number(API.levelOf(r));
    API.banish(r, 'シンクロ・チェンジ（コスト）');
    done(true);
  },
  resolve(ctx){
    const lv = Number(ctx.d5SyncLv);
    if(!Number.isFinite(lv) || !d5MzOpen(ctx.player)) return;
    const q = d5SynchroInEx(ctx.player, lv);
    if(!q.length) return;
    ensureCardUid(gameState, q[0].card);
    const uid = q[0].card.uid;
    API.specialSummon(ctx.player, 'ex', q[0].index, 'atk', 'シンクロ・チェンジ', q[0].p);
    const now = (uid != null) ? findCardByUid(uid) : null;
    if(now && now.zone === 'mz')
      API.negateEffectUntil(now, 'permanent', 'シンクロ・チェンジ', ctx.card);
  },
  afterResolve(){}
});

/* 11. サイコ・フィール・ゾーン — 除外されている自分のサイキック族のチューナー1体と
       チューナー以外のサイキック族1体を墓地に戻し、そのレベルの合計と同じレベルの
       サイキック族シンクロモンスター1体をエクストラデッキから表側守備表示で特殊召喚する */
function d5BanishedPsychic(p, tuner){
  return d5Pile(p, 'banish', x => x.db.k === 'm' && x.db.ra === 'サイキック'
    && ((x.db.st || []).includes('チューナー') === !!tuner));
}
function d5PsychicSynchroEx(p, lv){
  return d5Pile(p, 'ex', x => x.db.k === 'm' && x.db.ra === 'サイキック'
    && (x.db.st || []).includes('シンクロ') && Number(x.db.lv) === lv);
}
API.registerChoiceHandler('d5.psychicZone', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  const r = picked && resolveTarget(picked);
  if(!r || r.zone !== 'banish') return;
  const lvSum = (Number(args && args.tunerLv) || 0) + Number(dbOf(r.card).lv || 0);
  const tuner = (args && args.tunerUid != null) ? findCardByUid(args.tunerUid) : null;
  if(tuner && tuner.zone === 'banish') API.sendToGrave(tuner, 'サイコ・フィール・ゾーン');
  const again = resolveTarget(picked);
  if(again && again.zone === 'banish') API.sendToGrave(again, 'サイコ・フィール・ゾーン');
  if(!d5MzOpen(p)) return;
  const q = d5PsychicSynchroEx(p, lvSum);
  if(q.length) API.specialSummon(p, 'ex', q[0].index, 'def', 'サイコ・フィール・ゾーン', q[0].p);
});
defineScript('サイコ・フィール・ゾーン', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!d5BanishedPsychic(ctx.player, true).length){
      ctx.reason = '除外されている自分のサイキック族チューナーがいません'; return false; }
    if(!d5BanishedPsychic(ctx.player, false).length){
      ctx.reason = '除外されているチューナー以外のサイキック族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('サイコ・フィール・ゾーン：墓地に戻すサイキック族チューナー',
      d5BanishedPsychic(ctx.player, true), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'banish') return;
    ensureCardUid(gameState, r.card);
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'サイコ・フィール・ゾーン：墓地に戻すチューナー以外のサイキック族',
      candidates: d5BanishedPsychic(ctx.player, false),
      resume:{ handler:'d5.psychicZone',
               args:{ player:ctx.player, tunerUid:r.card.uid,
                      tunerLv:Number(dbOf(r.card).lv) || 0 } }
    });
  },
  afterResolve(){}
});

/* ===================== C. リリース軽減の召喚手順 ===================== */

/* 12. 百獣王 ベヒーモス — リリース1体で通常召喚できる。
       その場合、このカードの元々の攻撃力は2000になる。
       アドバンス召喚に成功した時、リリースした数だけ自分の墓地の獣族を手札に戻せる */
function d5BeastGrave(p){
  return d5Pile(p, 'grave', x => x.db.k === 'm' && x.db.ra === '獣');
}
API.registerChoiceHandler('d5.behemoth', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  ((answer && answer.cards) || []).forEach(t => {
    const r = resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, '百獣王 ベヒーモス');
  });
});
defineScript('百獣王 ベヒーモス', {
  type:'monster', priority:1, activateFrom:['mz'],
  normalSummonProcedure:{ includeStandard:true, methods:[
    { id:'behemoth1', tributes:1, modes:['summon','set'],
      summonLabel:'リリース1体で召喚（元々の攻撃力は2000になる）',
      condition(){ return true; } }
  ]},
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!c9AdvanceSummoned(ctx.card)){
      ctx.reason = 'アドバンス召喚に成功した時に発動します'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn){
      ctx.reason = 'アドバンス召喚に成功した時に発動します'; return false; }
    if(!d5BeastGrave(ctx.player).length){
      ctx.reason = '墓地に獣族モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const n = Math.min(Number(ctx.card.tributeCount || 0), d5BeastGrave(ctx.player).length);
    if(n <= 0) return;
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:true, min:0, max:n,
      title:'百獣王 ベヒーモス：手札に戻す墓地の獣族（最大' + n + '体）',
      candidates: d5BeastGrave(ctx.player),
      resume:{ handler:'d5.behemoth', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    return ctx.zone === 'mz' && !!(ctx.event && ctx.event.card === ctx.card)
        && c9AdvanceSummoned(ctx.card) && d5BeastGrave(ctx.player).length > 0; } },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self) return null;
      /* リリース1体で召喚した場合だけ、元々の攻撃力が2000になる。 */
      return Number(self.tributeCount || 0) === 1 ? { setBaseAtk:2000 } : null;
    }
  }
});
