/* Auto cycle 16 — 16枚。engine 変更なし。
     VIA 1ターンに1度の起動効果（除外コスト・手札コスト）
     VIB コイントス／ランダム確認
     VIC 発動無効（特殊召喚モンスターの効果）
     VID 破壊をトリガーにしたサーチ・回収
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function c5MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function c5FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* 相手フィールドの表側表示モンスター */
function c5FoeFaceUp(ctx){
  return API.fieldCards({ player:ctx.opponent, zone:'mz', filter:x => x.card.face === 'up' });
}
/* 相手フィールドの魔法・罠 */
function c5FoeST(ctx){ return API.fieldCards({ player:ctx.opponent, zone:'sz' }); }

/* ===================== A. 1ターンに1度の起動効果 ===================== */

/* 1. カオスライダー グスタフ — 墓地の魔法を2枚まで除外し、除外1枚につき
      相手ターン終了時まで攻撃力300アップ（1ターンに1度） */
API.registerScheduleHandler('c5.gustaph', (entry) => {
  const uid = entry && entry.uid;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h) API.clearModsByLabel(h, 'カオスライダー グスタフ');
});
function c5SpellGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 's');
}
defineScript('カオスライダー グスタフ', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c5SpellGrave(ctx.player).length){ ctx.reason = '墓地に魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c5SpellGrave(ctx.player);
    API.selectCard('カオスライダー グスタフ：除外する魔法（1枚目）', q, a => {
      const rest = c5SpellGrave(ctx.player)
        .filter(x => !(x.p === a.p && x.zone === a.zone && x.index === a.index));
      if(!rest.length){ done([a]); return; }
      API.selectCard('カオスライダー グスタフ：除外する魔法（2枚目・任意）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    const rs = (ctx.selectedTargets || []).map(t => resolveTarget(t)).filter(r => r && r.zone === 'grave');
    if(!rs.length) return;
    rs.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, 'カオスライダー グスタフ'));
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    ensureCardUid(gameState, me.card);
    API.modAtk(me, rs.length * 300, 0, 'permanent', 'カオスライダー グスタフ');
    /* 「相手ターン終了時まで」は until の語彙に無いので、v7 スケジューラで解除を予約する */
    API.schedule({ at:'turnEnd', turns:(gameState.activePlayer === ctx.player ? 1 : 0),
                   player:ctx.player, handler:'c5.gustaph',
                   args:{ uid:me.card.uid }, source:{ card:ctx.card }, note:'カオスライダー グスタフ' });
  },
  afterResolve(){}
});

/* 2. シュレツダー — 手札から機械族1体を墓地へ送り、そのレベル以下の
      相手の表側表示モンスター1体を破壊する（1ターンに1度） */
function c5MachineHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.ra === '機械');
}
defineScript('シュレツダー', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c5MachineHand(ctx.player).length){ ctx.reason = '手札に機械族モンスターがいません'; return false; }
    if(!c5FoeFaceUp(ctx).length){ ctx.reason = '相手フィールドに表側表示モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('シュレツダー：墓地へ送る機械族', c5MachineHand(ctx.player), a => {
      const lv = Number(a.db.lv || 0);
      const q = c5FoeFaceUp(ctx).filter(x => Number(x.db.lv || 99) <= lv);
      if(!q.length){ done([a]); return; }
      API.selectCard('シュレツダー：破壊するモンスター', q, b => done([a, b]));
    });
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    const a = ts[0] && resolveTarget(ts[0]);
    if(!a || a.zone !== 'hand') return;
    const victim = ts[1] && resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.sendHandToGrave(ctx.player, a.index, 'シュレツダー');
    const v = victim && locateCardAnyV4(victim);
    if(v && v.zone === 'mz') API.destroy(v, 'シュレツダー', ctx.player);
  },
  afterResolve(){}
});

/* 3. ジャイロイド — 1ターンに1度だけ戦闘では破壊されない（ダメージ計算は適用する） */
function c5OncePerTurnBattleProof(name){
  defineScript(name, {
    type:'monster', priority:1,
    condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
    resolve(){},
    afterResolve(){},
    continuous:{
      scope:'self', from:['mz'],
      apply(){ return null; },
      protectV21:{
        key:name, label:name, perTurn:1,
        battle: (target, self) => target === self
      }
    }
  });
}
c5OncePerTurnBattleProof('ジャイロイド');

/* 4. レグルス — 墓地のフィールド魔法1枚を選択してデッキに戻す（1ターンに1度） */
function c5FieldSpellGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 's' && x.db.sub === 'フィールド');
}
defineScript('レグルス', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c5FieldSpellGrave(ctx.player).length){ ctx.reason = '墓地にフィールド魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('レグルス：デッキに戻すフィールド魔法', c5FieldSpellGrave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToDeck(r, false, 'レグルス');
  },
  afterResolve(){}
});

/* 5. バスター・マーセナリ — 手札または墓地の「バスター・モード」1枚をデッキに戻し、
      相手フィールドの魔法・罠1枚を破壊する（1ターンに1度） */
function c5BusterMode(p){
  const out = [];
  API.pileCards(p, 'hand', x => x.db.n === 'バスター・モード').forEach(x => out.push(x));
  API.pileCards(p, 'grave', x => x.db.n === 'バスター・モード').forEach(x => out.push(x));
  return out;
}
defineScript('バスター・マーセナリ', {
  type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c5BusterMode(ctx.player).length){ ctx.reason = '「バスター・モード」がありません'; return false; }
    if(!c5FoeST(ctx).length){ ctx.reason = '破壊する相手の魔法・罠がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('バスター・マーセナリ：デッキに戻す「バスター・モード」', c5BusterMode(ctx.player), a =>
      API.selectCard('バスター・マーセナリ：破壊する魔法・罠', c5FoeST(ctx), b => done([a, b])));
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    const a = ts[0] && resolveTarget(ts[0]);
    if(!a) return;
    const victim = ts[1] && resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.returnToDeck(a, false, 'バスター・マーセナリ');
    const v = victim && locateCardAnyV4(victim);
    if(v && v.zone === 'sz') API.destroy(v, 'バスター・マーセナリ', ctx.player);
  },
  afterResolve(){}
});

/* 6. イモータル・ルーラー — このカードをリリースし、
      墓地の「アンデットワールド」1枚を手札に加える。特殊召喚できない */
defineScript('イモータル・ルーラー', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], activateFrom:['mz'],
  cannotSpecialSummon:true,
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!API.pileCards(ctx.player, 'grave', x => x.db.n === 'アンデットワールド').length){
      ctx.reason = '墓地に「アンデットワールド」がありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('イモータル・ルーラー：手札に加える「アンデットワールド」',
      API.pileCards(ctx.player, 'grave', x => x.db.n === 'アンデットワールド'), t => done([t]));
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz'){ API.sendToGrave(me, 'イモータル・ルーラー'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, 'イモータル・ルーラー');
  },
  afterResolve(){}
});

/* 7. 神剣－フェニックスブレード — 戦士族にのみ装備可能、攻撃力300アップ。
      自分のメインフェイズに墓地の戦士族2体を除外して、このカードを墓地から手札に加える */
function c5WarriorGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '戦士');
}
defineScript('神剣－フェニックスブレード', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'], activateFrom:['grave'],
  equipSpec:{ canEquip(h){ return !!(h && h.db && h.db.ra === '戦士'); } },
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'grave'){ ctx.reason = '墓地に存在する必要があります'; return false; }
    if(c5WarriorGrave(ctx.player).length < 2){ ctx.reason = '墓地に戦士族モンスターが2体必要です'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c5WarriorGrave(ctx.player);
    API.selectCard('神剣－フェニックスブレード：除外する戦士族（1体目）', q, a => {
      const rest = c5WarriorGrave(ctx.player)
        .filter(x => !(x.p === a.p && x.zone === a.zone && x.index === a.index));
      API.selectCard('神剣－フェニックスブレード：除外する戦士族（2体目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    const rs = (ctx.selectedTargets || []).map(t => resolveTarget(t)).filter(r => r && r.zone === 'grave');
    if(rs.length < 2) return;
    rs.sort((a, b) => b.index - a.index).forEach(r => API.banish(r, '神剣－フェニックスブレード'));
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'grave') API.returnToHand(me, '神剣－フェニックスブレード');
  },
  afterResolve(){},
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz' || h.card.face !== 'up') return null;
      return { atk:300 };
    }
  }
});

/* ===================== B. コイントス／ランダム確認 ===================== */

/* 8. ガトリング・ドラゴン — コイントスを3回行い、表の数だけフィールドの
      モンスターを破壊する（1ターンに1度・自分のメインフェイズ） */
defineScript('ガトリング・ドラゴン', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    return true;
  },
  resolve(ctx){
    /* replay 安全な duelRandomInt で3回コイントスする */
    let heads = 0;
    for(let i = 0; i < 3; i++){
      if((typeof duelRandomInt === 'function' ? duelRandomInt(2) : 1) === 0) heads++;
    }
    API.setFlag(ctx.player, 'c5GatlingHeads', heads, true);
    if(heads <= 0) return;
    const q = API.fieldCards({ zone:'mz' }).map(x => x.card).slice(0, heads);
    q.forEach(c => {
      const h = locateCardAnyV4(c);
      if(h && h.zone === 'mz') API.destroy(h, 'ガトリング・ドラゴン', ctx.player);
    });
  },
  afterResolve(){}
});

/* 9. Ωメガネ — 1ターンに1度、相手の手札をランダムに1枚確認する。
      発動するターン、装備モンスターは攻撃できない（装備魔法） */
API.registerChoiceHandler('c5.omegane', () => { /* 確認するだけ。盤面は変えない。 */ });
defineScript('Ωメガネ', {
  type:'spell', priority:1, countLimit:1, timing:['mainPhase'], activateFrom:['sz'],
  equipSpec:{ canEquip(h){ return !!h; } },
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(!gameState.players[ctx.opponent].hand.length){
      ctx.reason = '相手の手札がありません'; return false; }
    return true;
  },
  resolve(ctx){
    const H = gameState.players[ctx.opponent].hand || [];
    if(!H.length) return;
    /* ランダムに1枚選び、その内容は発動プレイヤーだけが見る */
    const i = (typeof duelRandomInt === 'function') ? duelRandomInt(H.length) : 0;
    const me = locateCardAnyV4(ctx.card);
    if(me) API.setCardFlag(me, 'c5OmeganeTurn', gameState.turn, 'Ωメガネ');
    API.requestChoice({
      player: ctx.player, kind:'card', cancelable:false, min:1, max:1,
      title:'Ωメガネ：相手の手札からランダムに1枚 —「' + cardName(H[i]) + '」',
      candidates:[{ key:'ok', label:'確認した', value:'ok' }],
      resume:{ handler:'c5.omegane', args:{ player:ctx.player } }
    });
  },
  afterResolve(){},
  continuous:{
    scope:'equippedMonster', from:['sz'],
    apply(){ return null; },
    cannotAttack(card, self){
      const h = locateCardAnyV4(self);
      if(!h || h.zone !== 'sz') return false;
      const hostUid = h.card.equipTo && h.card.equipTo.uid;
      if(hostUid == null || card.uid !== hostUid) return false;
      return Number(h.card.c5OmeganeTurn || -1) === gameState.turn;
    }
  }
});

/* ===================== C. 発動無効 ===================== */

/* 10. ジャスティス・ブリンガー — 相手フィールドの特殊召喚したモンスターの効果が
       発動した時、その発動を無効にする（1ターンに1度） */
function c5FoeSpecialMonsterActivated(ctx){
  const e = ctx.event;
  if(!e || e.player !== ctx.opponent) return false;
  if(e.kind !== 'monster') return false;
  if(e.uid == null) return false;
  const h = findCardByUid(e.uid);
  return !!(h && h.zone === 'mz' && h.p === ctx.opponent && h.card.specialSummoned === true);
}
defineScript('ジャスティス・ブリンガー', {
  type:'monster', priority:2, countLimit:1, activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c5FoeSpecialMonsterActivated(ctx)){
      ctx.reason = '相手の特殊召喚したモンスターの効果が発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', 'ジャスティス・ブリンガー', false);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return c5FaceUpMz(ctx) && c5FoeSpecialMonsterActivated(ctx); } }
});

/* 11. ダーク・ホルス・ドラゴン — 相手のメインフェイズに魔法カードが発動した場合、
       墓地のレベル4の闇属性モンスター1体を特殊召喚できる（1ターンに1度） */
function c5DarkLv4Grave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.at === '闇' && Number(x.db.lv) === 4);
}
function c5FoeMainSpell(ctx){
  const e = ctx.event;
  if(!e || e.player !== ctx.opponent) return false;
  if(e.kind !== 'spell') return false;
  if(gameState.activePlayer !== ctx.opponent) return false;
  return gameState.phase === 'main1' || gameState.phase === 'main2';
}
defineScript('ダーク・ホルス・ドラゴン', {
  type:'monster', priority:2, targets:true, countLimit:1, activateFrom:['mz'],
  condition(ctx){
    if(!c5FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c5FoeMainSpell(ctx)){ ctx.reason = '相手のメインフェイズに魔法カードが発動した場合に発動します'; return false; }
    if(!c5DarkLv4Grave(ctx.player).length){ ctx.reason = '墓地にレベル4の闇属性モンスターがいません'; return false; }
    if(!c5MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ダーク・ホルス・ドラゴン：特殊召喚するレベル4の闇属性',
      c5DarkLv4Grave(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !c5MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ダーク・ホルス・ドラゴン', r.p);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){
    return c5FaceUpMz(ctx) && c5FoeMainSpell(ctx)
      && c5DarkLv4Grave(ctx.player).length > 0 && c5MzOpen(ctx.player); } }
});

/* 12. コート・オブ・ジャスティス — 自分フィールドにレベル1の天使族が存在する場合、
       手札から天使族1体を特殊召喚する（1ターンに1度） */
function c5Lv1Angel(ctx){
  return API.fieldCards({ player:ctx.player, zone:'mz',
    filter:x => x.card.face === 'up' && x.db.ra === '天使' && Number(x.db.lv) === 1 }).length > 0;
}
function c5AngelHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.ra === '天使');
}
defineScript('コート・オブ・ジャスティス', {
  type:'spell', priority:1, targets:true, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(!c5Lv1Angel(ctx)){ ctx.reason = '自分フィールドにレベル1の天使族モンスターが必要です'; return false; }
    if(!c5AngelHand(ctx.player).length){ ctx.reason = '手札に天使族モンスターがいません'; return false; }
    if(!c5MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('コート・オブ・ジャスティス：特殊召喚する天使族', c5AngelHand(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'hand' || !c5MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'コート・オブ・ジャスティス', r.p);
  },
  afterResolve(){}
});

/* ===================== D. 破壊をトリガーにしたサーチ・回収 ===================== */

/* 13. おジャマ・ブルー — 戦闘で破壊され墓地へ送られた時、
       デッキから「おジャマ」カード2枚を手札に加える */
function c5OjamaDeck(p){
  return API.pileCards(p, 'deck', x => isSetCardV4(x.db, SETCODE.OJAMA));
}
defineScript('おジャマ・ブルー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c5OjamaDeck(ctx.player).length){ ctx.reason = 'デッキに「おジャマ」カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c5OjamaDeck(ctx.player);
    API.selectCard('おジャマ・ブルー：手札に加える「おジャマ」（1枚目）', q, a => {
      const rest = c5OjamaDeck(ctx.player)
        .filter(x => !(x.p === a.p && x.zone === a.zone && x.index === a.index));
      if(!rest.length){ done([a]); return; }
      API.selectCard('おジャマ・ブルー：手札に加える「おジャマ」（2枚目）', rest, b => done([a, b]));
    });
  },
  resolve(ctx){
    const cards = (ctx.selectedTargets || []).map(t => resolveTarget(t))
      .filter(r => r && r.zone === 'deck').map(r => r.card);
    cards.forEach(c => {
      const h = locateCardAnyV4(c);
      if(h && h.zone === 'deck') API.returnToHand(h, 'おジャマ・ブルー');
    });
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c5OjamaDeck(ctx.player).length > 0; } }
});

/* 14. 大樹海 — 表側表示の昆虫族が破壊され墓地へ送られた時、
       そのコントローラーは同じレベルの昆虫族1体をデッキから手札に加えられる（フィールド魔法） */
function c5DestroyedInsect(ctx){
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  for(let i = log.length - 1; i >= 0; i--){
    const x = log[i];
    if(!x || x.turn !== gameState.turn || x.from !== 'mz') continue;
    if(x.face !== 'up') continue;
    if(x.victimPlayer !== ctx.player) continue;
    const h = x.uid != null ? findCardByUid(x.uid) : null;
    if(!h || h.zone !== 'grave') continue;
    if(dbOf(h.card).ra !== '昆虫') continue;
    return h.card;
  }
  return null;
}
defineScript('大樹海', {
  type:'spell', priority:1, targets:true, activateFrom:['field'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'field' || me.card.face !== 'up'){
      ctx.reason = 'フィールドゾーンに表側表示で存在する必要があります'; return false; }
    const victim = c5DestroyedInsect(ctx);
    if(!victim){ ctx.reason = '表側表示の昆虫族が破壊された場合に発動します'; return false; }
    const lv = Number(dbOf(victim).lv || 0);
    if(!API.pileCards(ctx.player, 'deck',
        x => x.db.k === 'm' && x.db.ra === '昆虫' && Number(x.db.lv) === lv).length){
      ctx.reason = '同じレベルの昆虫族モンスターがデッキにいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const victim = c5DestroyedInsect(ctx);
    const lv = victim ? Number(dbOf(victim).lv || 0) : 0;
    API.selectCard('大樹海：手札に加える昆虫族',
      API.pileCards(ctx.player, 'deck',
        x => x.db.k === 'm' && x.db.ra === '昆虫' && Number(x.db.lv) === lv),
      t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'deck') API.returnToHand(r, '大樹海');
  },
  afterResolve(){},
  passive:{
    onDestroy(ctx){ return !!c5DestroyedInsect(ctx); },
    onDamageStep(ctx){ return !!c5DestroyedInsect(ctx); }
  }
});

/* 15. スピリット・フォース — 相手ターンの戦闘ダメージ計算時、
       その戦闘の自分への戦闘ダメージを0にし、その後
       墓地の守備力1500以下の戦士族チューナー1体を手札に加えられる */
function c5WarriorTunerGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && x.db.ra === '戦士'
    && (x.db.st || []).includes('チューナー') && Number(x.db.def) <= 1500);
}
defineScript('スピリット・フォース', {
  type:'trap', priority:2, targets:true, dsTiming:'calc',
  condition(ctx){
    if(gameState.activePlayer !== ctx.opponent){
      ctx.reason = '相手ターンの戦闘ダメージ計算時に発動します'; return false; }
    if(!gameState.battle){ ctx.reason = '戦闘中ではありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const q = c5WarriorTunerGrave(ctx.player);
    if(!q.length){ done([]); return; }
    API.selectCard('スピリット・フォース：手札に加える戦士族チューナー', q, t => done([t]));
  },
  resolve(ctx){
    /* この戦闘で自分が受ける戦闘ダメージを0にする */
    API.setFlag(ctx.player, 'c5SpiritForceTurn', gameState.turn, true);
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'grave') API.returnToHand(r, 'スピリット・フォース');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'sz' && gameState.activePlayer === ctx.opponent && !!gameState.battle; } },
  continuous:{
    scope:'ownCards', from:['sz','grave'],
    apply(){ return null; },
    battleDamage(info){
      const p = info.srcPlayer;
      const f = gameState.players[p] && gameState.players[p].temporaryFlags;
      if(!(f && Number(f.c5SpiritForceTurn) === gameState.turn)) return info.amount;
      return info.to === p ? 0 : info.amount;
    }
  }
});

/* 16. パラレル・セレクト — 自分のシンクロモンスターが相手によって破壊され
       墓地へ送られた時、除外されている自分の魔法カード1枚を手札に加える */
function c5SynchroKilledByFoe(ctx){
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  const foe = ctx.opponent;
  for(let i = log.length - 1; i >= 0; i--){
    const x = log[i];
    if(!x || x.turn !== gameState.turn || x.from !== 'mz') continue;
    if(x.victimPlayer !== ctx.player) continue;
    if(!(x.battle || x.byPlayer === foe)) continue;
    const h = x.uid != null ? findCardByUid(x.uid) : null;
    if(!h || h.zone !== 'grave') continue;
    if(!(dbOf(h.card).st || []).includes('シンクロ')) continue;
    return h.card;
  }
  return null;
}
function c5BanishedSpell(p){
  return API.pileCards(p, 'banish', x => x.db.k === 's');
}
defineScript('パラレル・セレクト', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c5SynchroKilledByFoe(ctx)){
      ctx.reason = '自分のシンクロモンスターが相手によって破壊された場合に発動します'; return false; }
    if(!c5BanishedSpell(ctx.player).length){ ctx.reason = '除外されている自分の魔法カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('パラレル・セレクト：手札に加える魔法カード', c5BanishedSpell(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'banish') API.returnToHand(r, 'パラレル・セレクト');
  },
  afterResolve(){},
  passive:{
    onDestroy(ctx){
      return !!c5SynchroKilledByFoe(ctx) && c5BanishedSpell(ctx.player).length > 0; },
    onDamageStep(ctx){
      return !!c5SynchroKilledByFoe(ctx) && c5BanishedSpell(ctx.player).length > 0; }
  }
});
