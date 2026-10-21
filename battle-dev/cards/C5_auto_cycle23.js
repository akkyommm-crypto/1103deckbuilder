/* Auto cycle 23 — 12枚。engine 変更なし。
     XIIA 魔法の発動に反応するカウンター罠
     XIIB 対象耐性（continuous.immuneToTarget）
     XIIC 自己特殊召喚・直接攻撃
     XIID 装備魔法
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d2MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d2FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* S03-U459: 「相手は～対象にできない」は対象を選ぶ効果のプレイヤーを判定する。
   filterTargetable() が CODEX-C03 の effectInfo を第3引数で渡す。 */
function d2OpponentTargets(self, effectInfo){
  const me = locateCardAnyV4(self), by = effectInfo && effectInfo.player;
  return !!me && (by===0 || by===1) && by!==me.p;
}
/* 相手が魔法カードを発動したか */
function d2FoeSpell(ctx){
  const e = ctx.event;
  return !!(e && e.player === ctx.opponent && e.kind === 'spell');
}
/* 自分の墓地の魔法カード */
function d2SpellGrave(p){ return API.pileCards(p, 'grave', x => x.db.k === 's'); }

/* ===================== A. 魔法の発動に反応するカウンター罠 ===================== */

/* 1. マジック・ジャマー — 魔法カードが発動した時、手札を1枚捨てて発動できる。
      その発動を無効にし破壊する */
defineScript('マジック・ジャマー', {
  type:'trap', priority:3,
  condition(ctx){
    if(!d2FoeSpell(ctx)){ ctx.reason = '魔法カードが発動した時に発動します'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const hand = API.pileCards(ctx.player, 'hand', () => true);
    if(!hand.length){ done(false); return; }
    API.selectCard('マジック・ジャマー：捨てる手札', hand, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.discard(ctx.player, r.index, 'マジック・ジャマー', { byEffect:true, byPlayer:ctx.player });
        done(true);
      }else done(false);
    });
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'マジック・ジャマー', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return ctx.zone === 'sz' && d2FoeSpell(ctx) && API.me(ctx).hand.length > 0; } }
});

/* 2. マジック・ドレイン — 相手が魔法カードを発動した時に発動できる。
      相手は手札から魔法カード1枚を捨ててこの効果を無効にできる。
      捨てなかった場合、相手の魔法カードの発動を無効にし破壊する */
API.registerChoiceHandler('d2.magicDrain', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const foe = p === 0 ? 1 : 0;
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  if(picked){
    /* 相手が魔法カードを捨てた：この効果は無効 */
    const r = resolveTarget(picked);
    if(r && r.zone === 'hand')
      API.discard(foe, r.index, 'マジック・ドレイン', { byEffect:true, byPlayer:foe });
    return;
  }
  const chainId = args && args.chainId;
  if(chainId == null) return;
  API.negateChainLink(chainId, 'activation', 'マジック・ドレイン', true);
});
defineScript('マジック・ドレイン', {
  type:'trap', priority:3,
  condition(ctx){
    if(!d2FoeSpell(ctx)){ ctx.reason = '相手が魔法カードを発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const e = ctx.event || {};
    /* 相手に「手札の魔法カードを捨てるか」を選ばせる。捨てる中身はこちらから見ない。 */
    const spells = API.pileCards(ctx.opponent, 'hand', x => x.db.k === 's');
    API.requestChoice({
      player: ctx.opponent, kind:'card', cancelable:false, min:0, max:1,
      title:'マジック・ドレイン：手札の魔法カード1枚を捨てて無効にできます',
      candidates: spells,
      resume:{ handler:'d2.magicDrain', args:{ player:ctx.player, chainId:(e.chainId != null ? e.chainId : null) } }
    });
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone === 'sz' && d2FoeSpell(ctx); } }
});

/* ===================== B. 対象耐性 ===================== */

/* 3. ロード・オブ・ドラゴン－ドラゴンの支配者－ — モンスターゾーンに存在する限り、
      お互いはフィールドのドラゴン族モンスターを効果の対象にできない */
defineScript('ロード・オブ・ドラゴン－ドラゴンの支配者－', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    immuneToTarget(card, self){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'mz') return false;
      return dbOf(card).ra === 'ドラゴン';
    }
  }
});

/* 4. ホルスのしもべ — 表側表示で存在する限り、相手は「ホルスの黒炎竜」（全レベル）を
      魔法・罠・モンスターの効果の対象にできない */
const D2_HORUS = ['ホルスの黒炎竜 LV4','ホルスの黒炎竜 LV6','ホルスの黒炎竜 LV8'];
defineScript('ホルスのしもべ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['mz'],
    apply(){ return null; },
    immuneToTarget(card, self, effectInfo){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
      /* 名前は「全てのレベルを含む」ので3枚を明示列挙する（部分一致はしない） */
      return D2_HORUS.indexOf(dbOf(card).n) >= 0 && d2OpponentTargets(self, effectInfo);
    }
  }
});

/* 5. メタルシルバー・アーマー — 装備モンスターが自分フィールドに存在する限り、
      相手は装備モンスター以外のモンスターを効果の対象にできない（装備魔法） */
defineScript('メタルシルバー・アーマー', {
  type:'spell', priority:1,
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.k === 'm'); } },
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    immuneToTarget(card, self, effectInfo){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'sz' || me.card.face !== 'up') return false;
      const hostUid = me.card.equipTo && me.card.equipTo.uid;
      if(hostUid == null) return false;
      const host = findCardByUid(hostUid);
      if(!host || host.zone !== 'mz' || host.p !== me.p) return false;
      /* 装備モンスター以外を守る */
      return card.uid !== hostUid && d2OpponentTargets(self, effectInfo);
    }
  }
});

/* ===================== C. 自己特殊召喚・直接攻撃 ===================== */

/* 6. マジック・ストライカー — 自分の墓地の魔法1枚を除外して手札から特殊召喚できる。
      直接攻撃できる。このカードの戦闘で発生する自分への戦闘ダメージは0になる */
defineScript('マジック・ストライカー', {
  /* S03-U17: ①「自分の墓地の魔法カード1枚を除外し、手札から特殊召喚できる」はチェーンを作らない特殊召喚手順。
     除外は手順の一部で、発動する効果ではない（S03-U16 で調査：効果として書かれていたため実際のデュエルでは使えなかった）。 */
  type:'monster', priority:1,
  canDirectAttack:true,
  summonProcedure:{from:'hand', positions:['atk','def'],
    condition(ctx){
      if(!d2SpellGrave(ctx.player).length){ ctx.reason = '墓地に魔法カードがありません'; return false; }
      return true;
    },
    cost(ctx, done){
      const pool = d2SpellGrave(ctx.player);
      if(!pool.length){ done(false); return; }
      API.selectCard('マジック・ストライカー：除外する魔法カード', pool, t => {
        const r = t && resolveTarget(t);
        if(!r || r.zone !== 'grave'){ done(false); return; }
        API.banish(r, 'マジック・ストライカー（特殊召喚）');
        done(true);
      });
    }
  },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    battleDamage(info){
      const self = info.self;
      if(info.atkCard !== self && info.defCard !== self) return info.amount;
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'mz') return info.amount;
      return info.to === h.p ? 0 : info.amount;
    }
  }
});

/* 7. ライト・サーペント — 手札から墓地へ送られた場合、墓地から特殊召喚できる。
      シンクロ素材にはできない */
function d2FromHandToGrave(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.from === 'hand' && g.turn === gameState.turn);
}
defineScript('ライト・サーペント', {
  type:'monster', priority:1, activateFrom:['grave'],
  cannotSynchroMaterial: true,
  condition(ctx){
    if(!d2FromHandToGrave(ctx)){ ctx.reason = '手札から墓地へ送られた場合に発動します'; return false; }
    if(!d2MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave' || !d2MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'ライト・サーペント', me.p);
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){ return d2FromHandToGrave(ctx) && d2MzOpen(ctx.player); },
    onDiscard(ctx){ return d2FromHandToGrave(ctx) && d2MzOpen(ctx.player); }
  }
});

/* 8. ラピッド・ウォリアー — メインフェイズ1でのみ発動できる。
      このターンこのカードは直接攻撃できる。
      発動するターン、このカード以外のモンスターは攻撃できない */
defineScript('ラピッド・ウォリアー', {
  type:'monster', priority:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!d2FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(gameState.phase !== 'main1'){ ctx.reason = 'メインフェイズ1でのみ発動できます'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.setCardFlag(me, 'd2RapidTurn', gameState.turn, 'ラピッド・ウォリアー');
  },
  afterResolve(){},
  /* このターン直接攻撃できる（宣言中だけ true を返す） */
  canDirectAttack(card){
    return Number(card && card.d2RapidTurn || -1) === gameState.turn;
  },
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(card, self){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'mz') return false;
      if(Number(me.card.d2RapidTurn || -1) !== gameState.turn) return false;
      /* 発動したターンはこのカード以外は攻撃できない */
      return card !== self;
    }
  }
});

/* 9. レプティレス・スキュラ — 戦闘で攻撃力0のモンスターを破壊した場合、
      そのモンスターを墓地から自分フィールドに表側守備表示で特殊召喚できる。
      この効果で特殊召喚したモンスターの効果は無効化される */
function d2KilledZeroAtk(ctx){
  const o = a6DestroyedFoeInBattle(ctx);
  if(!o) return null;
  if(Math.max(0, dbOf(o).atk || 0) !== 0) return null;
  const h = locateCardAnyV4(o);
  return (h && h.zone === 'grave') ? o : null;
}
/* S03-U24 (C-S03-20): 条件が墓地（戦闘で破壊され墓地へ送られたモンスター／墓地の資源）を見るので、⑤（墓地へ送られた後）の dsTiming 'leave'。 */
defineScript('レプティレス・スキュラ', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'leave',
  condition(ctx){
    if(!d2KilledZeroAtk(ctx)){
      ctx.reason = '戦闘で攻撃力0のモンスターを破壊した場合に発動します'; return false; }
    if(!d2MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const o = d2KilledZeroAtk(ctx);
    const h = o && locateCardAnyV4(o);
    if(!h || h.zone !== 'grave' || !d2MzOpen(ctx.player)) return;
    ensureCardUid(gameState, h.card);
    const uid = h.card.uid;
    API.specialSummon(ctx.player, 'grave', h.index, 'def', 'レプティレス・スキュラ', h.p);
    const now = findCardByUid(uid);
    if(now && now.zone === 'mz') API.negate(now, 'レプティレス・スキュラ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!d2KilledZeroAtk(ctx) && d2MzOpen(ctx.player); } }
});

/* 10. ヴァンパイア・レディ — 相手プレイヤーに戦闘ダメージを与える度に、
       カードの種類を宣言する。相手はデッキからその種類のカード1枚を墓地へ送る */
API.registerChoiceHandler('d2.vampireLady', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const foe = p === 0 ? 1 : 0;
  const kind = a4PickedMode(answer);
  if(!kind) return;
  API.setFlag(p, 'd2VampireKind', String(kind), true);
  const q = API.pileCards(foe, 'deck', x => x.db.k === kind);
  if(!q.length) return;
  /* 相手が自分のデッキから選んで墓地へ送る */
  API.requestChoice({
    player: foe, kind:'card', cancelable:false, min:1, max:1,
    title:'ヴァンパイア・レディ：宣言された種類のカード1枚を墓地へ送る',
    candidates: q,
    resume:{ handler:'d2.vampireLadySend', args:{ player:foe } }
  });
});
API.registerChoiceHandler('d2.vampireLadySend', (answer, args) => {
  const picked = (answer && answer.cards && answer.cards[0]) || null;
  if(!picked) return;
  const r = resolveTarget(picked);
  if(r && r.zone === 'deck') API.sendToGrave(r, 'ヴァンパイア・レディ');
});
defineScript('ヴァンパイア・レディ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!d2FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!a3DealtBattleDamage(ctx)){ ctx.reason = '相手プレイヤーに戦闘ダメージを与えた時に発動します'; return false; }
    if(!(gameState.players[ctx.opponent].deck || []).length){
      ctx.reason = '相手のデッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){
    a4ModeChoice(ctx, 'ヴァンパイア・レディ：カードの種類を宣言', [
      { key:'m', label:'モンスター' },
      { key:'s', label:'魔法' },
      { key:'t', label:'罠' }
    ], 'd2.vampireLady');
  },
  afterResolve(){},
  passive:{ onBattleDamage(ctx){
    return d2FaceUpMz(ctx) && a3DealtBattleDamage(ctx)
      && (gameState.players[ctx.opponent].deck || []).length > 0; } }
});

/* 11. ボルテック・バイコーン — 相手によって破壊された場合、
       お互いのプレイヤーはデッキの上からカードを7枚墓地へ送る */
function d2KilledByFoe(ctx){
  if(ctx.zone !== 'grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from === 'mz' && g.turn === gameState.turn)) return false;
  const rec = c1DestroyRecord(ctx.card);
  if(!rec) return false;
  return rec.battle || rec.byPlayer === (ctx.player === 0 ? 1 : 0);
}
defineScript('ボルテック・バイコーン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!d2KilledByFoe(ctx)){ ctx.reason = '相手によって破壊された場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    [ctx.player, ctx.opponent].forEach(p => {
      const n = Math.min(7, (gameState.players[p].deck || []).length);
      if(n > 0) API.millTop(p, n, 'ボルテック・バイコーン');
    });
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){ return d2KilledByFoe(ctx); },
    onDestroy(ctx){ return d2KilledByFoe(ctx); }
  }
});

/* 12. マジキャット — 魔法使い族モンスターのシンクロ召喚に使用され墓地へ送られた場合、
       自分の墓地の魔法カード1枚をデッキの一番上に戻せる */
defineScript('マジキャット', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, d => d.ra === '魔法使い')){
      ctx.reason = '魔法使い族のシンクロモンスターの素材になった場合に発動します'; return false; }
    if(!d2SpellGrave(ctx.player).length){ ctx.reason = '墓地に魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('マジキャット：デッキの一番上に戻す魔法', d2SpellGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, false, 'マジキャット');
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){
    return !!c8SynchroIs(ctx, d => d.ra === '魔法使い') && d2SpellGrave(ctx.player).length > 0; } }
});
