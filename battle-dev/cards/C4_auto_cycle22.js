/* Auto cycle 22 — 9枚。engine 変更なし。
     XIA シンクロ召喚成功に反応するカード（cycle 19 で確定した provenance を使う）
     XIB 戦闘・バトルステップの一時強化
     XIC その他
   カード登録の第1引数は必ず文字列リテラル。 */

/* ============================ 共通ヘルパ ============================ */

function d1MzOpen(p){ return (gameState.players[p].mz || []).length < ZONE_LIMITS.mz; }
function d1FaceUpMz(ctx){
  const me = locateCardAnyV4(ctx.card);
  return !!(me && me.zone === 'mz' && me.card.face === 'up');
}
/* シンクロ召喚が成功したイベントか。player を指定すると召喚したプレイヤーを絞る。 */
function d1SynchroSummoned(ctx, player){
  const e = ctx.event || {};
  if(e.kind !== 'synchro' || e.uid == null) return null;
  if(player === 0 || player === 1){ if(e.player !== player) return null; }
  const h = findCardByUid(e.uid);
  return (h && h.zone === 'mz') ? h : null;
}
/* このターン、そのプレイヤーの墓地に「シンクロ素材として送られた」カード */
function d1SynchroMaterialsInGrave(p){
  return API.pileCards(p, 'grave', x => {
    const g = x.card.graveInfo;
    return !!(g && g.reason === 'synchroMaterial' && g.turn === gameState.turn);
  });
}

/* ===================== A. シンクロ召喚成功に反応する ===================== */

/* 1. コモンメンタルワールド — 自分がシンクロ召喚に成功する度に、相手ライフに500ダメージ */
defineScript('コモンメンタルワールド', {
  type:'spell', priority:1, forced:true, activateFrom:['sz'],
  condition(ctx){
    if(ctx.zone !== 'sz' || ctx.card.face !== 'up'){
      ctx.reason = '表側表示で魔法・罠ゾーンに存在する必要があります'; return false; }
    if(!d1SynchroSummoned(ctx, ctx.player)){
      ctx.reason = '自分がシンクロ召喚に成功した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return ctx.zone === 'sz' && ctx.card.face === 'up' && !!d1SynchroSummoned(ctx, ctx.player); } }
});

/* 2. シンクロ・ストライク — シンクロ召喚したモンスター1体の攻撃力は
      エンドフェイズ時まで、シンクロ素材にしたモンスターの数×500アップする */
function d1SynchroOnField(p){
  return API.fieldCards({ player:p, zone:'mz',
    filter:x => x.card.face === 'up' && (x.db.st || []).includes('シンクロ')
             && Array.isArray(x.card.v380SummonMaterials) });
}
defineScript('シンクロ・ストライク', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!d1SynchroOnField(ctx.player).length){
      ctx.reason = 'シンクロ召喚したモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('シンクロ・ストライク：攻撃力を上げるシンクロモンスター',
      d1SynchroOnField(ctx.player), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz') return;
    /* 素材の数は EX_SUMMON_COMMIT_V42 が残す v380SummonMaterials から取る */
    const n = Array.isArray(r.card.v380SummonMaterials) ? r.card.v380SummonMaterials.length : 0;
    if(n > 0) API.modAtk(r, n * 500, 0, 'endTurn', 'シンクロ・ストライク');
  },
  afterResolve(){}
});

/* 3. チューナー・キャプチャー — 相手がシンクロ召喚に成功した時に発動できる。
      そのシンクロ素材としたチューナー1体を相手の墓地から自分フィールドに特殊召喚する */
function d1FoeTunerMaterials(ctx){
  return d1SynchroMaterialsInGrave(ctx.opponent)
    .filter(x => x.db.k === 'm' && (x.db.st || []).includes('チューナー'));
}
defineScript('チューナー・キャプチャー', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(!d1SynchroSummoned(ctx, ctx.opponent)){
      ctx.reason = '相手がシンクロ召喚に成功した時に発動します'; return false; }
    if(!d1FoeTunerMaterials(ctx).length){
      ctx.reason = 'シンクロ素材にしたチューナーが相手の墓地にいません'; return false; }
    if(!d1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('チューナー・キャプチャー：特殊召喚するチューナー',
      d1FoeTunerMaterials(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone !== 'grave' || !d1MzOpen(ctx.player)) return;
    /* 相手の墓地から「自分フィールドへ」なので、召喚先は自分。 */
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'チューナー・キャプチャー', r.p);
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){
    return ctx.zone === 'sz' && !!d1SynchroSummoned(ctx, ctx.opponent)
      && d1FoeTunerMaterials(ctx).length > 0 && d1MzOpen(ctx.player); } }
});

/* ===================== B. 戦闘・バトルステップの一時強化 ===================== */

/* 4. スピリット・ドラゴン — このカードが戦闘を行う自分のバトルステップ時、
      手札からドラゴン族1体を墓地へ捨てて発動できる。
      バトルフェイズ終了時まで攻撃力・守備力が1000アップする */
function d1SpiritInBattle(ctx){
  const b = gameState.battle;
  if(!b || b.target === 'direct') return false;
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return false;
  const a = (gameState.players[b.player].mz || [])[b.atkIdx];
  const d = (gameState.players[b.player === 0 ? 1 : 0].mz || [])[b.target];
  return a === ctx.card || d === ctx.card;
}
function d1DragonHand(p){
  return API.pileCards(p, 'hand', x => x.db.k === 'm' && x.db.ra === 'ドラゴン');
}
defineScript('スピリット・ドラゴン', {
  type:'monster', priority:2, activateFrom:['mz'], dsTiming:'start',
  condition(ctx){
    if(!d1SpiritInBattle(ctx)){ ctx.reason = 'このカードが戦闘を行うバトルステップに発動します'; return false; }
    if(!d1DragonHand(ctx.player).length){ ctx.reason = '手札にドラゴン族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const q = d1DragonHand(ctx.player);
    if(!q.length){ done(false); return; }
    API.selectCard('スピリット・ドラゴン：墓地へ捨てるドラゴン族', q, t => {
      const r = resolveTarget(t);
      if(r && r.zone === 'hand'){
        API.sendHandToGrave(ctx.player, r.index, 'スピリット・ドラゴン'); done(true);
      }else done(false);
    });
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz')
      API.modAtk(me, 1000, 1000, 'endBattlePhase', 'スピリット・ドラゴン');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    return d1SpiritInBattle(ctx) && d1DragonHand(ctx.player).length > 0; } }
});

/* 5. ジュラック・プティラ — このカードが攻撃されたダメージ計算後、
      攻撃モンスターを持ち主の手札に戻す。
      このカードの守備力は、この効果で手札に戻したモンスターのレベル×100アップする */
function d1PetitAttacker(ctx){
  const b = ctx.battle || {};
  if(b.defCard !== ctx.card || !b.atkCard) return null;
  const h = locateCardAnyV4(b.atkCard);
  return (h && h.zone === 'mz') ? b.atkCard : null;
}
defineScript('ジュラック・プティラ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(!d1PetitAttacker(ctx)){ ctx.reason = 'このカードが攻撃されたダメージ計算後に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const atkr = d1PetitAttacker(ctx);
    const h = atkr && locateCardAnyV4(atkr);
    if(!h || h.zone !== 'mz') return;
    const lv = Math.max(0, Number(curLV(atkr)) || 0);
    API.returnToHand(h, 'ジュラック・プティラ');
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone === 'mz' && lv > 0)
      API.modAtk(me, 0, lv * 100, 'permanent', 'ジュラック・プティラ');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!d1PetitAttacker(ctx); } }
});

/* ===================== C. その他 ===================== */

/* 6. キング・もけもけ — このカードがフィールドから離れた時、
      自分の墓地の「もけもけ」を可能な限り特殊召喚できる */
function d1MokeMoke(p){
  return API.pileCards(p, 'grave', x => x.db.n === 'もけもけ');
}
defineScript('キング・もけもけ', {
  type:'monster', priority:1, activateFrom:['grave','banish'],
  condition(ctx){
    const g = ctx.card.graveInfo;
    const left = !!(g && g.from === 'mz' && g.turn === gameState.turn);
    if(!left){ ctx.reason = 'フィールドから離れた時に発動します'; return false; }
    if(!d1MokeMoke(ctx.player).length){ ctx.reason = '墓地に「もけもけ」がいません'; return false; }
    if(!d1MzOpen(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    /* 「可能な限り」なので、空きがある限り順に特殊召喚する。
       index のずれを避けるため、毎回取り直す。 */
    let guard = ZONE_LIMITS.mz;
    while(guard-- > 0 && d1MzOpen(ctx.player)){
      const q = d1MokeMoke(ctx.player);
      if(!q.length) break;
      const r = q[0];
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'キング・もけもけ', r.p);
    }
  },
  afterResolve(){},
  passive:{
    onSendToGrave(ctx){
      const g = ctx.card.graveInfo;
      return !!(g && g.from === 'mz' && g.turn === gameState.turn)
        && d1MokeMoke(ctx.player).length > 0 && d1MzOpen(ctx.player); },
    onDestroy(ctx){
      const g = ctx.card.graveInfo;
      return !!(g && g.from === 'mz' && g.turn === gameState.turn)
        && d1MokeMoke(ctx.player).length > 0 && d1MzOpen(ctx.player); }
  }
});

/* 7. ゼンマイマイ — 自分のメインフェイズ時、フィールドにセットされたカード1枚を
      持ち主の手札に戻せる。表側表示で存在する限り1度しか使用できない */
function d1SetCards(){
  return API.fieldCards({ filter:x => x.card.face === 'down' });
}
defineScript('ゼンマイマイ', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], activateFrom:['mz'],
  condition(ctx){
    if(!d1FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(b0FieldOnceUsed(ctx.card, 'd1MaimaiUsed')){ ctx.reason = 'この効果は既に使用しています'; return false; }
    if(!d1SetCards().length){ ctx.reason = 'セットされたカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ゼンマイマイ：手札に戻すセットカード', d1SetCards(), t => done([t]));
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me) b0MarkFieldOnce(me, 'd1MaimaiUsed', 'ゼンマイマイ');
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r) API.returnToHand(r, 'ゼンマイマイ');
  },
  afterResolve(){}
});

/* 8. テーヴァ — アドバンス召喚に成功した場合に発動。
      次の相手ターン、相手は攻撃宣言できない */
defineScript('テーヴァ', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    if(!d1FaceUpMz(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(Number(ctx.card.summonedTurn) !== gameState.turn){
      ctx.reason = 'アドバンス召喚に成功した場合に発動します'; return false; }
    const p = ctx.card.summonProvenance;
    const adv = (p && p.summonType === 'tribute') || Number(ctx.card.tributeCount || 0) > 0;
    if(!adv){ ctx.reason = 'アドバンス召喚でなければ発動できません'; return false; }
    return true;
  },
  resolve(ctx){
    /* 次の相手ターンを絶対ターン番号で押さえる */
    API.setFlag(ctx.player, 'd1TevaLockTurn', gameState.turn + 1, true);
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){
    if(!d1FaceUpMz(ctx)) return false;
    if(Number(ctx.card.summonedTurn) !== gameState.turn) return false;
    const p = ctx.card.summonProvenance;
    return (p && p.summonType === 'tribute') || Number(ctx.card.tributeCount || 0) > 0; } },
  continuous:{
    scope:'oppMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(card, self){
      const me = locateCardAnyV4(self);
      if(!me || me.zone !== 'mz' || me.card.face !== 'up') return false;
      const f = gameState.players[me.p] && gameState.players[me.p].temporaryFlags;
      return !!(f && Number(f.d1TevaLockTurn) === gameState.turn);
    }
  }
});

/* 9. デス・メテオ — 相手ライフに1000ダメージ。
      相手ライフが3000以下の場合このカードは発動できない */
defineScript('デス・メテオ', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(API.foe(ctx).lp <= 3000){
      ctx.reason = '相手ライフが3000ポイント以下では発動できません'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000); },
  afterResolve(){}
});
