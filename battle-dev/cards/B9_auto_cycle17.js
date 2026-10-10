/* Auto cycle 17 — 15枚。engine 変更なし。
     VIIA 手札コストによる除去
     VIIB 自己特殊召喚（条件付き）
     VIIC 相手モンスターへの継続的な制限
     VIID トークン生成
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function c6MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function c6FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
function c6FoeMonsters(ctx){ return API.fieldCards({ player:ctx.opponent, zone:'mz' }); }
/* 種族が一致する自分の場の表側モンスター */
function c6OwnRaceUp(p, races){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && races.indexOf(x.db.ra) >= 0 });
}
/* 自分の場に同名の表側表示が既にいるか */
function c6AlreadyFaceUp(ctx, name){
  return API.fieldCards({ zone:'mz',
    filter:x => x.card.face === 'up' && x.db.n === name && x.card !== ctx.card }).length > 0;
}

/* ===================== A. 手札コストによる除去 ===================== */

/* 1. コアラッコアラ — 手札から獣族1体を墓地へ送り、相手モンスター1体を破壊する */
defineScript('コアラッコアラ', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!c6FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!API.pileCards(ctx.player, 'hand', x => x.db.k === 'm' && x.db.ra === '獣').length){
      ctx.reason = '手札に獣族モンスターがいません'; return false; }
    if(!c6FoeMonsters(ctx).length){ ctx.reason = '破壊する相手モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('コアラッコアラ：墓地へ送る獣族',
      API.pileCards(ctx.player, 'hand', x => x.db.k === 'm' && x.db.ra === '獣'), a =>
      API.selectCard('コアラッコアラ：破壊する相手モンスター', c6FoeMonsters(ctx), b => done([a, b])));
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    const a = ts[0] && resolveTarget(ts[0]);
    if(!a || a.zone !== 'hand') return;
    const victim = ts[1] && resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.sendHandToGrave(ctx.player, a.index, 'コアラッコアラ');
    const v = victim && locateCardAnyV4(victim);
    if(v && v.zone === 'mz') API.destroy(v, 'コアラッコアラ', ctx.player);
  },
  afterResolve(){}
});

/* 2. ガード・ヘッジ — 自分のモンスターが戦闘を行うダメージ計算時、
      このカードを手札から墓地へ送り、そのモンスターはその戦闘では破壊されず、
      エンドフェイズ時まで攻撃力は半分になる */
function c6OwnInBattle(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return null;
  const a = (gameState.players[b.player].mz || [])[b.atkIdx];
  const d = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  for(const c of [a, d]){
    if(!c) continue;
    const h = locateCardAnyV4(c);
    if(h && h.zone === 'mz' && h.p === ctx.player) return c;
  }
  return null;
}
function c6HedgeGuarded(target){
  return Number(target && target.c6HedgeTurn || -1) === gameState.turn;
}
defineScript('ガード・ヘッジ', {
  type:'monster', priority:2, activateFrom:['hand'], dsTiming:'calc', damageStepOnly:true,
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!c6OwnInBattle(ctx)){ ctx.reason = '自分のモンスターが戦闘を行うダメージ計算時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'hand'){ API.sendHandToGrave(ctx.player, me.index, 'ガード・ヘッジ'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const t = c6OwnInBattle(ctx);
    const h = t && locateCardAnyV4(t);
    if(!h || h.zone !== 'mz') return;
    API.setCardFlag(h, 'c6HedgeTurn', gameState.turn, 'ガード・ヘッジ');
    API.modAtk(h, -Math.floor(curATK(h.card) / 2), 0, 'endTurn', 'ガード・ヘッジ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const me = locateCardAnyV4(ctx.card);
    return !!me && me.zone === 'hand' && !!c6OwnInBattle(ctx); } },
  continuous:{
    scope:'allMonsters', from:['grave'],
    apply(){ return null; },
    protectV21:{
      key:'ガード・ヘッジ', label:'ガード・ヘッジ',
      battle: (target) => c6HedgeGuarded(target)
    }
  }
});

/* 3. イージーチューニング — 墓地のチューナー1体を除外し、自分のモンスター1体の
      攻撃力をそのチューナーの攻撃力分アップする */
function c6TunerGrave(p){
  return API.pileCards(p, 'grave', x => x.db.k === 'm' && (x.db.st || []).includes('チューナー'));
}
defineScript('イージーチューニング', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!c6TunerGrave(ctx.player).length){ ctx.reason = '墓地にチューナーがいません'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz' }).length){
      ctx.reason = '自分フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('イージーチューニング：除外するチューナー', c6TunerGrave(ctx.player), a =>
      API.selectCard('イージーチューニング：攻撃力を上げるモンスター',
        API.fieldCards({ player:ctx.player, zone:'mz' }), b => done([a, b])));
  },
  resolve(ctx){
    const ts = ctx.selectedTargets || [];
    const a = ts[0] && resolveTarget(ts[0]);
    if(!a || a.zone !== 'grave') return;
    const up = Math.max(0, dbOf(a.card).atk || 0);
    const tgtCard = ts[1] && resolveTarget(ts[1]) && resolveTarget(ts[1]).card;
    API.banish(a, 'イージーチューニング');
    const b = tgtCard && locateCardAnyV4(tgtCard);
    if(b && b.zone === 'mz' && up > 0) API.modAtk(b, up, 0, 'permanent', 'イージーチューニング');
  },
  afterResolve(){}
});

/* ===================== B. 自己特殊召喚（条件付き） ===================== */

/* 4. キング・オブ・ビースト — 表側の「モジャ」1体をリリースして、
      手札または墓地からこのカードを特殊召喚する。表側表示で1体しか存在できない */
defineScript('キング・オブ・ビースト', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], activateFrom:['hand','grave'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave')){
      ctx.reason = '手札または墓地に存在する必要があります'; return false; }
    if(c6AlreadyFaceUp(ctx, 'キング・オブ・ビースト')){
      ctx.reason = '「キング・オブ・ビースト」は1体しか表側表示で存在できません'; return false; }
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.n === 'モジャ' }).length){
      ctx.reason = '表側表示の「モジャ」がいません'; return false; }
    if(!c6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('キング・オブ・ビースト：リリースする「モジャ」',
      API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.n === 'モジャ' }), t => done([t]));
  },
  cost(ctx, done){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'mz'){ API.sendToGrave(r, 'キング・オブ・ビースト'); done(true); }
    else done(false);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave') || !c6MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, me.zone, me.index, 'atk', 'キング・オブ・ビースト', me.p);
  },
  afterResolve(){}
});

/* 5. ガーディアン・オブ・オーダー — 自分フィールドに光属性が2体以上いる場合、
      手札からこのカードを特殊召喚できる。表側表示で1体しか存在できない */
defineScript('ガーディアン・オブ・オーダー', {
  type:'monster', priority:1, timing:['mainPhase'], activateFrom:['hand'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(c6AlreadyFaceUp(ctx, 'ガーディアン・オブ・オーダー')){
      ctx.reason = '「ガーディアン・オブ・オーダー」は1体しか表側表示で存在できません'; return false; }
    if(API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && x.db.at === '光' }).length < 2){
      ctx.reason = '自分フィールドに光属性モンスターが2体以上必要です'; return false; }
    if(!c6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand' || !c6MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', me.index, 'atk', 'ガーディアン・オブ・オーダー', me.p);
  },
  afterResolve(){}
});

/* 6. シャーク・サッカー — 自分フィールドに魚族・海竜族・水族が召喚・特殊召喚された時、
      手札からこのカードを特殊召喚できる。シンクロ素材にはできない */
function c6WaterSummoned(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.player) return false;
  return b2SummonedCards(e).some(c => {
    const h = locateCardAnyV4(c);
    if(!h || h.p !== ctx.player || h.zone !== 'mz') return false;
    const ra = dbOf(c).ra;
    return ra === '魚' || ra === '海竜' || ra === '水';
  });
}
defineScript('シャーク・サッカー', {
  type:'monster', priority:1, activateFrom:['hand'],
  cannotSynchroMaterial: true,
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand'){ ctx.reason = '手札に存在する必要があります'; return false; }
    if(!c6WaterSummoned(ctx)){
      ctx.reason = '自分フィールドに魚族・海竜族・水族が召喚・特殊召喚された時に発動します'; return false; }
    if(!c6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'hand' || !c6MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', me.index, 'atk', 'シャーク・サッカー', me.p);
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return c6WaterSummoned(ctx) && c6MzOpen(ctx.player); },
    onSpecialSummon(ctx){ return c6WaterSummoned(ctx) && c6MzOpen(ctx.player); }
  }
});

/* 7. ウイングトータス — 自分の表側の魚族・海竜族・水族がゲームから除外された時、
      手札または墓地からこのカードを特殊召喚できる */
function c6WaterBanished(ctx){
  const e = ctx.event || {};
  const cards = b2SummonedCards(e);
  return cards.some(c => {
    const h = locateCardAnyV4(c);
    if(!h || h.zone !== 'banish') return false;
    if(h.p !== ctx.player) return false;
    const ra = dbOf(c).ra;
    return ra === '魚' || ra === '海竜' || ra === '水';
  });
}
defineScript('ウイングトータス', {
  type:'monster', priority:1, activateFrom:['hand','grave'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave')){
      ctx.reason = '手札または墓地に存在する必要があります'; return false; }
    if(!c6WaterBanished(ctx)){
      ctx.reason = '自分の魚族・海竜族・水族が除外された時に発動します'; return false; }
    if(!c6MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || (me.zone !== 'hand' && me.zone !== 'grave') || !c6MzOpen(ctx.player)) return;
    API.specialSummon(ctx.player, me.zone, me.index, 'atk', 'ウイングトータス', me.p);
  },
  afterResolve(){},
  passive:{ onRemove(ctx){ return c6WaterBanished(ctx) && c6MzOpen(ctx.player); } }
});

/* ===================== C. 相手モンスターへの継続的な制限 ===================== */

/* 8. アンデット・スカル・デーモン — 表側で存在する限り、
      自分フィールドのアンデット族はカードの効果では破壊されない */
defineScript('アンデット・スカル・デーモン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    protectV21:{
      key:'アンデット・スカル・デーモン', label:'アンデット・スカル・デーモン',
      /* locateCard は {p,zone,index} だけを返し .card を持たない。
         カード本体が要る場合は locateCardAnyV4 を使う。 */
      effect: (target, self) => {
        const loc = locateCard(target), me = locateCardAnyV4(self);
        if(!loc || !me || me.zone !== 'mz' || loc.p !== me.p) return false;
        if(me.card.face !== 'up') return false;
        return dbOf(target).ra === 'アンデット';
      }
    }
  }
});

/* 9. 六芒星の呪縛 — 相手モンスター1体を選択。そのモンスターは攻撃できず
      表示形式も変更できない。そのモンスターが破壊された時、このカードを破壊する */
defineScript('六芒星の呪縛', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!c6FoeMonsters(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('六芒星の呪縛：ロックする相手モンスター', c6FoeMonsters(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.setCardFlag(r, 'c6HexLocked', true, '六芒星の呪縛');
    const me = locateCardAnyV4(ctx.card);
    /* 選択したモンスターが離れたらこのカードも破壊する */
    if(me) API.linkOnLeave(me, r, 'destroy', '六芒星の呪縛');
  },
  afterResolve(){},
  continuous:{
    scope:'allMonsters', from:['sz'],
    apply(){ return null; },
    cannotAttack(card){ return !!(card && card.c6HexLocked); },
    cannotChangePosition(card){ return !!(card && card.c6HexLocked); }
  }
});

/* 10. ビッグホーン・マンモス — 表側で存在する限り、相手のモンスターは
       召喚・反転召喚・特殊召喚したターンには攻撃できない */
defineScript('ビッグホーン・マンモス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '継続効果のみのカードです'; return false; },
  resolve(){},
  afterResolve(){},
  continuous:{
    scope:'oppMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(card, self){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
      /* card.summonedTurn は通常召喚・特殊召喚のどちらでも書かれる実在フィールド */
      return Number(card && card.summonedTurn) === gameState.turn;
    }
  }
});

/* 11. 無力の証明 — 自分フィールドにレベル7以上のモンスターが存在する場合に発動。
       相手フィールドのレベル5以下のモンスターを全て破壊する。
       発動するターン、自分フィールドのモンスターは攻撃できない */
defineScript('無力の証明', {
  type:'trap', priority:2,
  condition(ctx){
    if(!API.fieldCards({ player:ctx.player, zone:'mz',
        filter:x => x.card.face === 'up' && Number(x.db.lv || 0) >= 7 }).length){
      ctx.reason = '自分フィールドにレベル7以上のモンスターが必要です'; return false; }
    return true;
  },
  resolve(ctx){
    API.setFlag(ctx.player, 'c6ProofTurn', gameState.turn, true);
    const q = API.fieldCards({ player:ctx.opponent, zone:'mz',
      filter:x => Number(x.db.lv || 99) <= 5 }).map(x => x.card);
    q.forEach(c => {
      const h = locateCardAnyV4(c);
      if(h && h.zone === 'mz') API.destroy(h, '無力の証明', ctx.player);
    });
  },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['sz','grave'],
    apply(){ return null; },
    cannotAttack(card, self){
      const me = locateCard(self) || locateCardAnyV4(self);
      const loc = locateCard(card);
      if(!me || !loc || loc.p !== me.p) return false;
      const f = gameState.players[loc.p] && gameState.players[loc.p].temporaryFlags;
      return !!(f && Number(f.c6ProofTurn) === gameState.turn);
    }
  }
});

/* 12. デーモン・カオス・キング — 攻撃宣言時、相手フィールドの全てのモンスターの
       攻撃力・守備力をバトルフェイズ終了時まで入れ替える事ができる */
/* onAttackDeclare の payload は {player, atkIdx, target, name}
   （70_summon_procedures.js:744）。この時点で gameState.battle はまだ無いので
   event 側の atkIdx で「自分が攻撃宣言した」ことを判定する。 */
function c6DeclaredAttacker(ctx){
  const e = ctx.event || {};
  if(e.atkIdx == null || (e.player !== 0 && e.player !== 1)) return false;
  const a = (gameState.players[e.player].mz || [])[e.atkIdx];
  return a === ctx.card;
}
defineScript('デーモン・カオス・キング', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(!c6FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!c6DeclaredAttacker(ctx)){ ctx.reason = 'このカードの攻撃宣言時に発動します'; return false; }
    if(!c6FoeMonsters(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    c6FoeMonsters(ctx).map(x => x.card).forEach(c => {
      const h = locateCardAnyV4(c);
      if(!h || h.zone !== 'mz') return;
      const a = curATK(c), d = curDEF(c);
      API.setAtk(h, d, 'endBattlePhase', 'デーモン・カオス・キング');
      API.setDef(h, a, 'endBattlePhase', 'デーモン・カオス・キング');
    });
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){
    return c6FaceUpMz(ctx) && c6DeclaredAttacker(ctx) && c6FoeMonsters(ctx).length > 0; } }
});

/* ===================== D. トークン生成・コイントス ===================== */

/* 13. アリの増殖 — 自分の昆虫族1体をリリースし、「兵隊アリトークン」2体を特殊召喚する。
       このトークンは生け贄召喚のための生け贄にはできない */
defineScript('アリの増殖', {
  type:'spell', priority:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(!c6OwnRaceUp(ctx.player, ['昆虫']).length){
      ctx.reason = '自分フィールドに昆虫族モンスターがいません'; return false; }
    if((gameState.players[ctx.player].mz || []).length > ZONE_LIMITS.mz - 1){
      ctx.reason = 'モンスターゾーンに空きが足りません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('アリの増殖：リリースする昆虫族', c6OwnRaceUp(ctx.player, ['昆虫']), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    API.sendToGrave(r, 'アリの増殖');
    const before = (gameState.players[ctx.player].mz || []).length;
    API.createToken(ctx.player,
      { key:'兵隊アリトークン', name:'兵隊アリトークン',
        atk:500, def:1200, lv:4, ra:'昆虫', at:'地', pos:'atk' }, 2);
    /* 生け贄召喚のための生け贄にできない（既存の cannotTribute を使う） */
    const mz = gameState.players[ctx.player].mz || [];
    for(let i = before; i < mz.length; i++){
      const h = locateCardAnyV4(mz[i]);
      if(h) API.setCardFlag(h, 'cannotTribute', true, 'アリの増殖');
    }
  },
  afterResolve(){}
});

/* 14. ジュラック・スピノス — 戦闘で相手モンスターを破壊し墓地へ送った時、
       相手フィールドに「スピノストークン」1体を攻撃表示で特殊召喚する */
defineScript('ジュラック・スピノス', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(!a6DestroyedFoeInBattle(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!c6MzOpen(ctx.opponent)){ ctx.reason = '相手のモンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    API.createToken(ctx.opponent,
      { key:'スピノストークン', name:'スピノストークン',
        atk:300, def:0, lv:1, ra:'恐竜', at:'炎', pos:'atk' }, 1);
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return !!a6DestroyedFoeInBattle(ctx) && c6MzOpen(ctx.opponent); } }
});

/* 15. クルーエル — 戦闘によって破壊され墓地へ送られた時、相手モンスター1体を選択。
       コイントスを1回行い裏表を当てる。当たった場合、そのモンスターを破壊する */
API.registerChoiceHandler('c6.cruel', (answer, args) => {
  const p = (args && (args.player === 0 || args.player === 1)) ? args.player : 0;
  const call = a4PickedMode(answer);
  if(!call) return;
  const f = gameState.players[p] && gameState.players[p].temporaryFlags;
  const uid = f ? f.c6CruelTargetUid : null;
  /* replay 安全な duelRandomInt でコイントス */
  const face = (typeof duelRandomInt === 'function' ? duelRandomInt(2) : 0) === 0 ? 'heads' : 'tails';
  API.setFlag(p, 'c6CruelCoin', face, true);
  if(call !== face) return;
  if(uid == null) return;
  const h = findCardByUid(uid);
  if(h && h.zone === 'mz') API.destroy(h, 'クルーエル', p);
});
defineScript('クルーエル', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた場合に発動します'; return false; }
    if(!c6FoeMonsters(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('クルーエル：選択する相手モンスター', c6FoeMonsters(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    ensureCardUid(gameState, r.card);
    /* 対象 uid は Action 経由のフラグで渡す（choice の resume.args を後から
       書き換えると Journal に載らず replay で食い違うため）。 */
    API.setFlag(ctx.player, 'c6CruelTargetUid', r.card.uid, true);
    a4ModeChoice(ctx, 'クルーエル：コイントスの裏表を当てる', [
      { key:'heads', label:'表' },
      { key:'tails', label:'裏' }
    ], 'c6.cruel');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return a3SelfBattleDestroyed(ctx) && c6FoeMonsters(ctx).length > 0; } }
});
