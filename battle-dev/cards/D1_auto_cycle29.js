/* Auto cycle 29 — 9枚。engine 変更なし。
     XVIIIA リリースをコストにする効果
     XVIIIB アドバンス召喚の素材制限（System v23 materialFilter）
     XVIIIC コアキメイルの維持コスト
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d8MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d8MyTurn(p){ return gameState.activePlayer === p; }
function d8FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
function d8MyMonsters(p){ return API.fieldCards({ player:p, zone:'mz' }); }
/* 自分の墓地の指定属性 */
function d8GraveByAttr(p, attr){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === attr);
}
/* このカードが戦闘で相手モンスターを破壊したか */
function d8SelfKilled(ctx){
  const b = ctx.battle || {};
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
/* 破壊され墓地へ送られたか */
function d8Destroyed(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn);
}

/* ---- 予約ハンドラ ---- */
API.registerScheduleHandler('d8.destroyUid', (args) => {
  const h = (args && args.uid != null) ? findCardByUid(args.uid) : null;
  if(h && h.zone === 'mz') API.destroy(h, (args && args.reason) || '予約');
});
/* アドバンス召喚のリリース素材を墓地から可能な限り特殊召喚する */
API.registerScheduleHandler('d8.manticoreRevive', (args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const uids = Array.isArray(args && args.uids) ? args.uids : [];
  uids.forEach(u => {
    if(!d8MzOpen(p)) return;
    const h = findCardByUid(u);
    if(!h || h.zone !== 'grave') return;
    API.specialSummon(p, 'grave', h.index, 'atk', 'モザイク・マンティコア', h.p);
    const now = findCardByUid(u);
    if(now && now.zone === 'mz'){
      API.setCardFlag(now, 'cannotAttack', true, 'モザイク・マンティコア');
      API.negateEffectUntil(now, 'permanent', 'モザイク・マンティコア', null);
    }
  });
});

/* ===================== A. リリースをコストにする効果 ===================== */

/* 1. ジュラック・ティラヌス — 自分のメインフェイズ、このカード以外の自分の恐竜族1体を
      リリースして発動でき、攻撃力が500アップする。
      また、戦闘で相手モンスターを破壊し墓地へ送った時、攻撃力が300アップする */
function d8OtherDino(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card !== ctx.card && x.db.ra === '恐竜' });
}
defineScript('ジュラック・ティラヌス', {
  type:'monster', priority:1, targets:true, dsTiming:'after',
  activateFrom:['mz'], timing:['mainPhase','damageStep'],
  condition(ctx){
    if(!d8FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(d8SelfKilled(ctx)) return true;
    if(!d8MyTurn(ctx.player) || (gameState.phase !== 'main1' && gameState.phase !== 'main2')){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!d8OtherDino(ctx).length){
      ctx.reason = 'リリースできる他の恐竜族がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(d8SelfKilled(ctx)){ done([]); return; }
    API.selectCard('ジュラック・ティラヌス（コスト）：リリースする恐竜族',
      d8OtherDino(ctx), t => done([t]));
  },
  cost(ctx, done){
    if(d8SelfKilled(ctx)){ done(true); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, 'ジュラック・ティラヌス（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.modAtk(me, d8SelfKilled(ctx) ? 300 : 500, 0, 'permanent', 'ジュラック・ティラヌス');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return d8FaceUpMz(ctx) && !!d8SelfKilled(ctx); } }
});

/* 2. ダーク・ダイブ・ボンバー — 1ターンに1度、自分メインフェイズ1に
      自分フィールドのモンスター1体をリリースして発動でき、
      リリースしたモンスターのレベル×200ダメージを相手に与える */
defineScript('ダーク・ダイブ・ボンバー', {
  type:'monster', priority:1, countLimit:1, nameLimit:true, targets:true,
  activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    if(!d8FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(gameState.phase !== 'main1' || !d8MyTurn(ctx.player)){
      ctx.reason = '自分のメインフェイズ1に発動します'; return false; }
    if(!d8MyMonsters(ctx.player).length){
      ctx.reason = 'リリースするモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ダーク・ダイブ・ボンバー（コスト）：リリースするモンスター',
      d8MyMonsters(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz'){ done(false); return; }
    /* リリースしたモンスターのレベルは、墓地へ送る前に確定させる。 */
    ctx.d8TributeLv = Number(API.levelOf(r)) || 0;
    API.sendToGrave(r, 'ダーク・ダイブ・ボンバー（コスト）');
    done(true);
  },
  resolve(ctx){
    const lv = Number(ctx.d8TributeLv) || 0;
    if(lv > 0) API.damageLP(ctx.opponent, lv * 200);
  },
  afterResolve(){}
});

/* 3. ヘル・ドラゴン — ①攻撃したターンのエンドフェイズにこのカードを破壊する。
      ②フィールドのこのカードが破壊され墓地へ送られた時、
      自分フィールドのモンスター1体をリリースして墓地から特殊召喚できる */
defineScript('ヘル・ドラゴン', {
  type:'monster', priority:1, forced:false, targets:true,
  activateFrom:['mz','grave'], timing:['endPhase','free'],
  condition(ctx){
    if(ctx.zone === 'grave'){
      if(!d8Destroyed(ctx)){
        ctx.reason = '破壊され墓地へ送られた時に発動します'; return false; }
      if(!d8MyMonsters(ctx.player).length){
        ctx.reason = 'リリースするモンスターがいません'; return false; }
      if(!d8MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      return true;
    }
    if(gameState.phase !== 'end' || !d8MyTurn(ctx.player)){
      ctx.reason = '自分のエンドフェイズに処理します'; return false; }
    if(!ctx.card.attacked){
      ctx.reason = '攻撃したターンのエンドフェイズに処理します'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    if(ctx.zone !== 'grave'){ done([]); return; }
    API.selectCard('ヘル・ドラゴン（コスト）：リリースするモンスター',
      d8MyMonsters(ctx.player), t => done([t]));
  },
  cost(ctx, done){
    if(ctx.zone !== 'grave'){ done(true); return; }
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, 'ヘル・ドラゴン（コスト）'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me) return;
    if(ctx.zone !== 'mz'){
      if(me.zone === 'grave' && d8MzOpen(ctx.player))
        API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'ヘル・ドラゴン', me.p);
      return;
    }
    if(me.zone === 'mz') API.destroy(me, 'ヘル・ドラゴン', ctx.player);
  },
  afterResolve(){},
  passive:{
    onEndPhase(ctx){
      return ctx.zone === 'mz' && d8MyTurn(ctx.player) && !!ctx.card.attacked; },
    onSendToGrave(ctx){ return d8Destroyed(ctx)
      && d8MyMonsters(ctx.player).length > 0 && d8MzOpen(ctx.player); },
    onDestroy(ctx){ return d8Destroyed(ctx)
      && d8MyMonsters(ctx.player).length > 0 && d8MzOpen(ctx.player); }
  }
});

/* 4. アーマード・サイキッカー — 自分フィールドにサイキック族が表側で存在する場合、
      リリースなしで召喚できる。戦闘で相手モンスターを破壊した場合、
      破壊したモンスターの攻撃力の半分のダメージを受け、
      さらにその数値以下の攻撃力のモンスター1体を自分の墓地から特殊召喚できる */
function d8PsychicOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === 'サイキック' });
}
defineScript('アーマード・サイキッカー', {
  type:'monster', priority:1, forced:true, targets:true, dsTiming:'after',
  activateFrom:['mz'], timing:['damageStep'],
  normalSummonProcedure:{ includeStandard:true, methods:[
    { id:'armoredPsychic0', tributes:0, modes:['summon'],
      summonLabel:'自分のサイキック族がいるためリリースなしで召喚',
      condition({player}){ return d8PsychicOnField(player).length > 0; } }
  ]},
  condition(ctx){
    if(!d8FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d8SelfKilled(ctx)){
      ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const victim = d8SelfKilled(ctx);
    const half = Math.floor(Math.max(0, curATK(victim)) / 2);
    const q = API.pileCards(ctx.player, 'grave',
      x => x.db.k === 'm' && Number(x.db.atk) <= half);
    if(!q.length){ done([]); return; }
    API.selectCard('アーマード・サイキッカー：特殊召喚するモンスター', q, t => done([t]));
  },
  resolve(ctx){
    const victim = d8SelfKilled(ctx);
    if(!victim) return;
    const half = Math.floor(Math.max(0, curATK(victim)) / 2);
    if(half > 0) API.damageLP(ctx.player, half);
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave' && Number(dbOf(r.card).atk) <= half && d8MzOpen(ctx.player))
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'アーマード・サイキッカー', r.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return d8FaceUpMz(ctx) && !!d8SelfKilled(ctx); } }
});

/* ===================== B. アドバンス召喚の素材制限 ===================== */

/* 5. ジョーズマン — 特殊召喚できない。アドバンス召喚する場合、
      リリースするモンスターは水属性でなければならない。
      攻撃力は、このカード以外の自分の表側水属性1体につき300アップする */
defineScript('ジョーズマン', {
  type:'monster', priority:1, cannotSpecialSummon:true,
  normalSummonProcedure:{ includeStandard:false, methods:[
    { id:'jawsman1', tributes:1, modes:['summon','set'],
      summonLabel:'水属性1体をリリースしてアドバンス召喚',
      setLabel:'水属性1体をリリースしてセット',
      materialFilter(candidate){
        return !!(candidate && candidate.db && candidate.db.at === '水');
      } }
  ]},
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self){
      if(card !== self) return null;
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'mz') return null;
      const n = API.fieldCards({ player:me.p, zone:'mz',
        filter:x => x.card !== self && x.card.face === 'up' && x.db.at === '水' }).length;
      return n ? { atk:n * 300 } : null;
    }
  }
});

/* 6. モザイク・マンティコア — アドバンス召喚に成功した場合、
      次の自分ターンのスタンバイフェイズに、
      アドバンス召喚のためにリリースしたモンスターを墓地から可能な限り特殊召喚する。
      この効果で特殊召喚したモンスターは攻撃宣言できず、効果は無効化される */
function d8ManticoreSummoned(ctx){
  if(ctx.zone !== 'mz') return false;
  if(!(ctx.event && ctx.event.card === ctx.card)) return false;
  return c9AdvanceSummoned(ctx.card);
}
defineScript('モザイク・マンティコア', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!d8ManticoreSummoned(ctx)){
      ctx.reason = 'アドバンス召喚に成功した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const prov = API.summonProvenance(ctx.card) || {};
    const uids = Array.isArray(prov.materialRefs) ? prov.materialRefs.slice() : [];
    if(!uids.length) return;
    API.schedule({ at:'standbyPhase', ownTurn:true, player:ctx.player,
      handler:'d8.manticoreRevive', source:ctx.card, note:'モザイク・マンティコア',
      args:{ player:ctx.player, uids:uids } });
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return d8ManticoreSummoned(ctx); } }
});

/* 7. 堕天使ゼラート — 自分の墓地に闇属性が4種類以上存在する場合、
      闇属性1体をリリースしてアドバンス召喚できる。
      ①手札から闇属性1体を墓地へ送って発動でき、相手フィールドのモンスターを全て破壊する。
      ②①を発動したターンのエンドフェイズにこのカードを破壊する */
function d8DarkKindsInGrave(p){
  const seen = {};
  d8GraveByAttr(p, '闇').forEach(x => { seen[x.db.n] = true; });
  return Object.keys(seen).length;
}
function d8DarkInHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.at === '闇');
}
defineScript('堕天使ゼラート', {
  type:'monster', priority:1, activateFrom:['mz'], timing:['mainPhase'],
  normalSummonProcedure:{ includeStandard:true, methods:[
    { id:'zerato1', tributes:1, modes:['summon','set'],
      summonLabel:'墓地の闇属性4種類以上：闇属性1体をリリースしてアドバンス召喚',
      setLabel:'墓地の闇属性4種類以上：闇属性1体をリリースしてセット',
      condition({player}){ return d8DarkKindsInGrave(player) >= 4; },
      materialFilter(candidate){
        return !!(candidate && candidate.db && candidate.db.at === '闇');
      } }
  ]},
  condition(ctx){
    if(!d8FaceUpMz(ctx)){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!d8MyTurn(ctx.player) || (gameState.phase !== 'main1' && gameState.phase !== 'main2')){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!d8DarkInHand(ctx.player).length){
      ctx.reason = '手札に闇属性モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = d8DarkInHand(ctx.player);
    if(!q.length){ done(false); return; }
    API.selectCard('堕天使ゼラート（コスト）：墓地へ送る闇属性', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.sendHandToGrave(ctx.player, r.index, '堕天使ゼラート（コスト）'); done(true);
      } else done(false);
    });
  },
  resolve(ctx){
    API.fieldCards({ player:ctx.opponent, zone:'mz' }).slice().forEach(hh => {
      const now = locateCardAnyV4(hh.card);
      if(now && now.zone === 'mz') API.destroy(now, '堕天使ゼラート', ctx.player);
    });
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.schedule({ at:'endPhase', turns:0, player:ctx.player,
      handler:'d8.destroyUid', source:ctx.card, note:'堕天使ゼラート',
      args:{ uid:me.card.uid, reason:'堕天使ゼラート' } });
  },
  afterResolve(){}
});

/* ===================== C. コアキメイルの維持コスト ===================== */

/* 維持コスト：自分のエンドフェイズ毎に、手札から「コアキメイルの鋼核」1枚を墓地へ送るか、
   手札の指定種族モンスター1体を相手に見せる。どちらも行わなければこのカードを破壊する。 */
function d8KoakiUpkeep(ctx, race){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return;
  const cores = v57CoreInHand(ctx.player);
  if(cores.length){
    const r = resolveTarget(cores[0]);
    if(r && r.zone === 'hand'){
      API.sendHandToGrave(ctx.player, r.index, 'コアキメイルの維持コスト');
      return;
    }
  }
  const show = API.pileCards(ctx.player, 'hand',
    x => x.db.k === 'm' && x.db.ra === race);
  if(show.length){
    API.reveal({ cards:[show[0]], audience:'both', label:'コアキメイルの維持コスト',
                 until:'resolution' });
    return;
  }
  const again = locateCardAnyV4(ctx.card);
  if(again && again.zone === 'mz') API.destroy(again, 'コアキメイルの維持コスト');
}
/* 「効果モンスターの効果が発動した時」「相手の罠カードが発動した時」の判定 */
function d8ActivationIs(ctx, kind, foeOnly){
  const e = ctx.event || {};
  if(e.kind !== kind) return false;
  if(foeOnly && e.player !== ctx.opponent) return false;
  if(e.uid != null && ctx.card && e.uid === ctx.card.uid) return false;
  return true;
}
function d8KoakiNegator(name, race, kind, foeOnly, why){
  defineScript(name, {
    type:'monster', priority:3, activateFrom:['mz'], timing:['endPhase','chain'],
    condition(ctx){
      if(!d8FaceUpMz(ctx)){
        ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
      if(gameState.phase === 'end' && d8MyTurn(ctx.player)) return true;
      if(!d8ActivationIs(ctx, kind, foeOnly)){ ctx.reason = why; return false; }
      return true;
    },
    cost(ctx, done){
      if(gameState.phase === 'end' && d8MyTurn(ctx.player)){ done(true); return; }
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone === 'mz'){ API.sendToGrave(me, name + '（コスト）'); done(true); }
      else done(false);
    },
    resolve(ctx){
      if(gameState.phase === 'end' && d8MyTurn(ctx.player)){ d8KoakiUpkeep(ctx, race); return; }
      const e = ctx.event || {};
      if(e.chainId != null) API.negateChainLink(e.chainId, 'activation', name, true);
    },
    afterResolve(){},
    passive:{
      onEndPhase(ctx){ return d8FaceUpMz(ctx) && d8MyTurn(ctx.player); },
      onActivateSuccess(ctx){ return d8FaceUpMz(ctx) && d8ActivationIs(ctx, kind, foeOnly); }
    }
  });
}

/* 8. コアキメイル・ガーディアン — 効果モンスターの効果が発動した時、
      このカードをリリースしてその発動を無効にし破壊する */
d8KoakiNegator('コアキメイル・ガーディアン', '岩石', 'monster', false,
  '効果モンスターの効果が発動した時に発動します');

/* 9. コアキメイル・サンドマン — 相手の罠カードが発動した時、
      このカードをリリースしてその発動を無効にし破壊する */
d8KoakiNegator('コアキメイル・サンドマン', '岩石', 'trap', true,
  '相手の罠カードが発動した時に発動します');
