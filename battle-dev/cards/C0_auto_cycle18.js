/* Auto cycle 18 — 13枚。engine 変更なし。
     VIIIA 戦闘破壊をトリガーにしたドロー・展開
     VIIIB 連続攻撃・攻撃力上昇
     VIIIC 装備魔法
     VIIID コイントス
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function c7MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function c7FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* このカードが戦闘で破壊した相手モンスター（墓地にいる事まで確認する） */
function c7KilledFoe(ctx){
  const o = a6DestroyedFoeInBattle(ctx);
  if(!o) return null;
  const h = locateCardAnyV4(o);
  return (h && h.zone === 'grave') ? o : null;
}
/* 装備先のモンスター */
function c7EquipHost(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'sz') return null;
  const uid = me.card.equipTo && me.card.equipTo.uid;
  if(uid == null) return null;
  const h = findCardByUid(uid);
  return (h && h.zone === 'mz') ? h : null;
}

/* ===================== A. 戦闘破壊トリガー ===================== */

/* 1. ハイドロゲドン — 戦闘で相手モンスターを破壊し墓地へ送った時、
      デッキから「ハイドロゲドン」1体を特殊召喚する */
function c7DeckByName(p, name){
  return API.pileCards(p, 'deck', x => x.db.n === name);
}
/* S03-U23: 「戦闘で破壊し墓地へ送った時」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('ハイドロゲドン', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!c7KilledFoe(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    if(!c7DeckByName(ctx.player, 'ハイドロゲドン').length){
      ctx.reason = 'デッキに「ハイドロゲドン」がいません'; return false; }
    if(!c7MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ハイドロゲドン：特殊召喚する「ハイドロゲドン」',
      c7DeckByName(ctx.player, 'ハイドロゲドン'), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'deck' || !c7MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'ハイドロゲドン', r.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!c7KilledFoe(ctx) && c7DeckByName(ctx.player, 'ハイドロゲドン').length > 0
      && c7MzOpen(ctx.player); } }
});

/* 2. フレムベル・ヘルドッグ — 戦闘で相手モンスターを破壊し墓地へ送った時、
      デッキから自身以外の守備力200以下の炎属性1体を特殊召喚する */
function c7FlamvellTargets(p){
  return API.pileCards(p, 'deck', x => x.db.k === 'm' && x.db.at === '炎'
    && Number(x.db.def) <= 200 && x.db.n !== 'フレムベル・ヘルドッグ');
}
/* S03-U23: 「戦闘で破壊し墓地へ送った時」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('フレムベル・ヘルドッグ', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!c7KilledFoe(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    if(!c7FlamvellTargets(ctx.player).length){
      ctx.reason = 'デッキに守備力200以下の炎属性モンスターがいません'; return false; }
    if(!c7MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('フレムベル・ヘルドッグ：特殊召喚する炎属性',
      c7FlamvellTargets(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'deck' || !c7MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'フレムベル・ヘルドッグ', r.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!c7KilledFoe(ctx) && c7FlamvellTargets(ctx.player).length > 0
      && c7MzOpen(ctx.player); } }
});

/* 3. A・O・J リーサル・ウェポン — 戦闘で光属性を破壊し墓地へ送った時、1枚ドロー。
      さらにドローしたカードがレベル4以下の闇属性モンスターだった場合、
      相手に見せて特殊召喚できる */
function c7KilledLight(ctx){
  const o = c7KilledFoe(ctx);
  return (o && dbOf(o).at === '光') ? o : null;
}
/* S03-U23: 「戦闘で破壊し墓地へ送った時」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('A・O・J リーサル・ウェポン', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!c7KilledLight(ctx)){ ctx.reason = '戦闘で光属性モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const before = (gameState.players[ctx.player].hand || []).length;
    API.draw(ctx.player, 1);
    const hand = gameState.players[ctx.player].hand || [];
    if(hand.length !== before + 1) return;
    /* ドローしたカードは手札の末尾に入る。公開して特殊召喚できるかを見る。 */
    const drawn = hand[hand.length - 1];
    const d = dbOf(drawn);
    if(!(d.k === 'm' && d.at === '闇' && Number(d.lv || 99) <= 4)) return;
    if(!c7MzOpen(ctx.player)) return;
    const h = locateCardAnyV4(drawn);
    if(h && h.zone === 'hand')
      API.specialSummon(ctx.player, 'hand', h.index, 'atk', 'A・O・J リーサル・ウェポン', h.p);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!c7KilledLight(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 4. A・O・J フィールド・マーシャル — このカードの攻撃で裏側守備表示のモンスターを
      破壊し墓地へ送った時、デッキから1枚ドローする */
function c7KilledFaceDown(ctx){
  const o = c7KilledFoe(ctx);
  if(!o) return null;
  if(!a3IsAttacker(ctx)) return null;
  const g = o.graveInfo;
  /* 破壊時点の表裏・表示形式は v30 の graveInfo が持つ */
  return (g && g.face === 'down' && g.pos === 'def') ? o : null;
}
defineScript('A・O・J フィールド・マーシャル', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(!c7KilledFaceDown(ctx)){
      ctx.reason = 'このカードの攻撃で裏側守備表示のモンスターを破壊した場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!c7KilledFaceDown(ctx) && API.me(ctx).deck.length > 0; } }
});

/* 5. ライトニング・ウォリアー — 戦闘で相手モンスターを破壊し墓地へ送った時、
      相手の手札の枚数×300ポイントダメージを与える */
/* S03-U23: 「戦闘で破壊し墓地へ送った時」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('ライトニング・ウォリアー', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!c7KilledFoe(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const n = (gameState.players[ctx.opponent].hand || []).length;
    if(n > 0) API.damageLP(ctx.opponent, n * 300);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!c7KilledFoe(ctx); } }
});

/* 6. ブロッサム・ボンバー — 自分の植物族が戦闘で相手モンスターを破壊し墓地へ送った時、
      その破壊したモンスターの攻撃力分のダメージを与える */
function c7PlantKilled(ctx){
  const b = ctx.battle || {};
  const pairs = [];
  if(b.destroyedDef && b.atkCard && b.defCard) pairs.push([b.atkCard, b.defCard]);
  if(b.destroyedAtk && b.defCard && b.atkCard) pairs.push([b.defCard, b.atkCard]);
  for(const [killer, victim] of pairs){
    const kh = locateCardAnyV4(killer);
    if(!kh || kh.p !== ctx.player || kh.zone !== 'mz') continue;
    if(dbOf(killer).ra !== '植物') continue;
    const vh = locateCardAnyV4(victim);
    if(!vh || vh.zone !== 'grave') continue;
    return victim;
  }
  return null;
}
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('ブロッサム・ボンバー', {
  type:'trap', priority:2, dsTiming:'leave',
  condition(ctx){
    if(!c7PlantKilled(ctx)){
      ctx.reason = '自分の植物族が戦闘で相手モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const v = c7PlantKilled(ctx);
    if(v) API.damageLP(ctx.opponent, Math.max(0, dbOf(v).atk || 0));
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return ctx.zone === 'sz' && !!c7PlantKilled(ctx); } }
});

/* ===================== B. 連続攻撃・攻撃力上昇 ===================== */

/* 7. ヘル・ツイン・コップ — 戦闘で相手モンスターを破壊し墓地へ送った時、
      バトルフェイズ終了時まで攻撃力800アップし、もう1度だけ続けて攻撃できる */
/* S03-U23: 「戦闘で破壊し墓地へ送った時」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('ヘル・ツイン・コップ', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!c7KilledFoe(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.modAtk(me, 800, 0, 'endBattlePhase', 'ヘル・ツイン・コップ');
    API.grantAdditionalAttack(me, 1, 'ヘル・ツイン・コップ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!c7KilledFoe(ctx); } }
});

/* 8. ワーム・ウォーロード — 特殊召喚できない。戦闘で破壊した効果モンスターの効果は
      無効化される。相手モンスターを戦闘破壊した場合、もう1度だけ続けて攻撃できる */
/* S03-U23: 「戦闘で破壊し墓地へ送った時」は⑤（墓地へ送られた後）。条件が墓地を見るので dsTiming は 'leave'。 */
defineScript('ワーム・ウォーロード', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'leave',
  cannotSpecialSummon:true,
  condition(ctx){
    if(!c7KilledFoe(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊し墓地へ送った場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const o = c7KilledFoe(ctx);
    /* 破壊した相手が効果モンスターなら効果を無効化する */
    if(o && (dbOf(o).st || []).includes('効果')){
      const h = locateCardAnyV4(o);
      if(h) API.negate(h, 'ワーム・ウォーロード');
    }
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz') API.grantAdditionalAttack(me, 1, 'ワーム・ウォーロード');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!c7KilledFoe(ctx); } }
});

/* 9. ファイターズ・エイプ — 戦闘で相手モンスターを破壊した場合、攻撃力300アップ。
      自分のターンで攻撃を行っていない場合、その上昇値はそのターンのエンドフェイズに0に戻る */
API.registerScheduleHandler('c7.fightersApe', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(!h) return;
  /* 自分のターンで攻撃していれば上昇は残る */
  const bp = gameState.battlePhaseV6;
  const list = (bp && Array.isArray(bp.attacks)) ? bp.attacks : [];
  if(list.some(a => a && a.attackerUid === uid && a.player === h.p)) return;
  API.clearModsByLabel(h, 'ファイターズ・エイプ');
});
defineScript('ファイターズ・エイプ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.modAtk(me, 300, 0, 'permanent', 'ファイターズ・エイプ');
    /* 「自分のターンで攻撃を行っていない場合はエンドフェイズに戻る」を
       v7 スケジューラで確認する。攻撃の有無は発火時に battlePhaseV6 で判定する。 */
    API.schedule({ at:'endPhase', turns:0, player:ctx.player, handler:'c7.fightersApe',
                   args:{ uid:me.card.uid }, source:{ card:ctx.card }, note:'ファイターズ・エイプ' });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!a6DestroyedFoeInBattle(ctx); } }
});

/* ===================== C. 装備魔法・除外 ===================== */

/* 10. デーモンの斧 — 装備モンスターの攻撃力1000アップ。
       フィールドから墓地へ送られた時、自分のモンスター1体をリリースして
       このカードをデッキの一番上に戻す */
defineScript('デーモンの斧', {
  type:'spell', priority:1, targets:true, activateFrom:['grave'],
  equipSpec:{ canEquip(h){ return !!h; } },
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = '墓地から発動します'; return false; }
    const g = ctx.card.graveInfo;
    if(!(g && g.from === 'sz' && g.turn === gameState.turn)){
      ctx.reason = 'フィールドから墓地へ送られた場合に発動します'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){
      ctx.reason = 'リリースする自分のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('デーモンの斧：リリースするモンスター',
      API.fieldCards({ player:ctx.player, zone:'mz' }), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.sendToGrave(r, 'デーモンの斧');
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToDeck(me, false, 'デーモンの斧');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    const g = ctx.card.graveInfo;
    return ctx.zone === 'grave' && !!(g && g.from === 'sz' && g.turn === gameState.turn)
      && API.fieldCards({ player:ctx.player, zone:'mz' }).length > 0; } },
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return null;
      return { atk:1000 };
    }
  }
});

/* 11. エレキャッシュ — レベル3以下の雷族にのみ装備可能。
       装備モンスターの攻撃力800アップ、効果は無効化される。
       装備モンスターが相手ライフに戦闘ダメージを与えた時、1枚ドローする */
function c7CashDealtDamage(ctx){
  const host = c7EquipHost(ctx);
  if(!host) return false;
  const e = ctx.event || {};
  if(!(Number(e.amount) > 0)) return false;
  if(e.player !== ctx.opponent) return false;
  const uid = host.card.uid;
  return e.attackerUid === uid || e.defenderUid === uid;
}
defineScript('エレキャッシュ', {
  type:'spell', priority:1, activateFrom:['sz'],
  equipSpec:{ canEquip(h){
    return !!(h && h.db && h.db.ra === '雷' && Number(h.db.lv || 99) <= 3); } },
  condition(ctx){
    if(!c7CashDealtDamage(ctx)){ ctx.reason = '装備モンスターが戦闘ダメージを与えた時に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return ctx.zone === 'sz' && c7CashDealtDamage(ctx) && API.me(ctx).deck.length > 0; } },
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return null;
      return { atk:800 };
    },
    /* 装備モンスターの効果を無効化する（engine の負の永続効果を使う） */
    negateEffect(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return false;
      const uid = h.card.equipTo && h.card.equipTo.uid;
      return uid != null && card && card.uid === uid;
    }
  }
});

/* 12. サイバー・ウロボロス — このカードがゲームから除外された時、
       手札を1枚墓地へ送って1枚ドローする */
function c7SelfBanished(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'banish') return false;
  const e = ctx.event || {};
  return b2SummonedCards(e).indexOf(ctx.card) >= 0;
}
defineScript('サイバー・ウロボロス', {
  type:'monster', priority:1, targets:true, activateFrom:['banish'],
  condition(ctx){
    if(!c7SelfBanished(ctx)){ ctx.reason = 'このカードがゲームから除外された時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '墓地へ送る手札がありません'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('サイバー・ウロボロス：墓地へ送る手札',
      API.pileCards(ctx.player, 'hand', () => true), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand') return;
    API.sendHandToGrave(ctx.player, r.index, 'サイバー・ウロボロス');
    API.draw(ctx.player, 1);
  },
  afterResolve(){},
  passive:{ onRemove(ctx){
    return c7SelfBanished(ctx) && API.me(ctx).hand.length > 0 && API.me(ctx).deck.length > 0; } }
});

/* ===================== D. コイントス ===================== */

/* 13. デビル・コメディアン — コイントスを1回行い裏表を当てる。
       当たった場合、相手の墓地のカードを全て除外する。
       ハズレの場合、相手の墓地の枚数分だけ自分のデッキの上からカードを墓地へ送る */
API.registerChoiceHandler('c7.comedian', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const foe = p === 0 ? 1 : 0;
  const call = a4PickedMode(answer);
  if(!call) return;
  const face = (typeof duelRandomInt === 'function' ? duelRandomInt(2) : 0) === 0 ? 'heads' : 'tails';
  API.setFlag(p, 'c7ComedianCoin', face, true);
  const n = (gameState.players[foe].grave || []).length;
  if(call === face){
    /* 当たり：相手の墓地を全て除外する。index のずれを避けて後ろから処理する */
    const q = API.pileCards(foe, 'grave', () => true);
    q.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, 'デビル・コメディアン'));
    return;
  }
  /* ハズレ：相手の墓地の枚数分、自分のデッキの上から墓地へ送る */
  if(n > 0) API.millTop(p, Math.min(n, (gameState.players[p].deck || []).length), 'デビル・コメディアン');
});
defineScript('デビル・コメディアン', {
  type:'trap', priority:2,
  condition(ctx){
    if(!(gameState.players[ctx.opponent].grave || []).length){
      ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    a4ModeChoice(ctx, 'デビル・コメディアン：コイントスの裏表を当てる', [
      { key:'heads', label:'表' },
      { key:'tails', label:'裏' }
    ], 'c7.comedian');
  },
  afterResolve(){}
});
