/* =========================================================================
   1103環境の主要デッキ（テーマカード）
   ========================================================================= */

/* ---------- 代行天使 ---------- */
defineScript("神秘の代行者 アース", {
  type:"monster", priority:1, quickEffect:false,
  blocksIfNoDeckToHand:true,   // S03-U04: 任意の誘発。ライオウ適用中は発動できない
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason="フィールドで発動します"; return false; }
    const sanctuary = API.fieldCards({player:ctx.player, zone:'field'}).length>0
      && cardName(gameState.players[ctx.player].field)==='天空の聖域';
    const pool = sanctuary
      ? API.pileCards(ctx.player,'deck',x=>x.db.n==='マスター・ヒュペリオン')
      : API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('代行者')>=0 && x.db.n!=='神秘の代行者 アース');
    if(!pool.length){ ctx.reason = sanctuary?"デッキにマスター・ヒュペリオンがいません":"デッキに他の「代行者」がいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const fieldCard = gameState.players[ctx.player].field;
    const sanctuary = fieldCard && cardName(fieldCard)==='天空の聖域';
    const pool = sanctuary
      ? API.pileCards(ctx.player,'deck',x=>x.db.n==='マスター・ヒュペリオン')
      : API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('代行者')>=0 && x.db.n!=='神秘の代行者 アース');
    if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:sanctuary?"アース：ヒュペリオンをサーチ":"アース：手札に加える「代行者」",
      candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-search', args:{player:ctx.player, reason:'神秘の代行者 アース'}},
      meta:{scriptName:'神秘の代行者 アース'}});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz'; } }
});

defineScript("創造の代行者 ヴィーナス", {
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    if(API.me(ctx).lp<500){ ctx.reason="LPが500未満です"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    const pool = API.pileCards(ctx.player,'deck',x=>x.db.n==='神聖なる球体')
      .concat(handCandidates(ctx, x=>x.db.n==='神聖なる球体'));
    if(!pool.length){ ctx.reason="「神聖なる球体」がありません"; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 500); done(true); },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ・手札）から選ぶ（S03-U58パターン）。
       候補がデッキ・手札の両方にまたがるため、専用の登録ハンドラを使う（s03u58.deck-specialは
       デッキ限定）。 */
    const pool = API.pileCards(ctx.player,'deck',x=>x.db.n==='神聖なる球体')
      .concat(handCandidates(ctx, x=>x.db.n==='神聖なる球体'));
    if(!pool.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"ヴィーナス：特殊召喚する神聖なる球体",
      candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u63.venus-summon-sphere', args:{player:ctx.player}},
      meta:{scriptName:'創造の代行者 ヴィーナス'}});
  },
  afterResolve(){}
});
/* S03-U63: resolve() 内の解決時選択を受ける登録ハンドラ（デッキ・手札の両方から）。 */
API.registerChoiceHandler('s03u63.venus-summon-sphere', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || (h.zone!=='deck' && h.zone!=='hand')) return;
  API.specialSummon(args.player, h.zone, h.index, 'atk', "創造の代行者 ヴィーナス");
});

defineScript("マスター・ヒュペリオン", { targets:true, /* S03-U476: 「フィールド上に存在するカード1枚を選択して破壊する」は対象を取る。墓地の光・天使族を除外するコストの選択は cost 段階（U474）で対象耐性を掛けない */
  type:"monster", priority:1, countLimit:1, quickEffect:false,
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone==='hand'){
      const pool = API.pileCards(ctx.player,'grave',x=>String(x.db.n||'').indexOf('代行者')>=0)
        .concat(API.fieldCards({zone:'mz', player:ctx.player, filter:x=>String(x.db.n||'').indexOf('代行者')>=0}))
        .concat(handCandidates(ctx, x=>String(x.db.n||'').indexOf('代行者')>=0));
      if(!pool.length){ ctx.reason="除外する「代行者」がいません"; return false; }
      if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
      return true;
    }
    const g = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='天使' && x.db.at==='光');
    if(!g.length){ ctx.reason="墓地に光属性・天使族がいません"; return false; }
    if(!API.fieldCards().length){ ctx.reason="破壊する対象がありません"; return false; }
    return true;
  },
  cost(ctx, done){
    if(ctx.zone==='hand'){
      const pool = API.pileCards(ctx.player,'grave',x=>String(x.db.n||'').indexOf('代行者')>=0)
        .concat(API.fieldCards({zone:'mz', player:ctx.player, filter:x=>String(x.db.n||'').indexOf('代行者')>=0}))
        .concat(handCandidates(ctx, x=>String(x.db.n||'').indexOf('代行者')>=0));
      API.selectCard("ヒュペリオン：除外する「代行者」（コスト）", pool, t=>{ API.banish(t,"ヒュペリオン（コスト）"); done(true); });
      return;
    }
    const g = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.ra==='天使' && x.db.at==='光');
    API.selectCard("ヒュペリオン：除外する光・天使（コスト）", g, t=>{ API.banish(t,"ヒュペリオン（コスト）"); done(true); });
  },
  selectTargets(ctx, done){
    if(ctx.zone==='hand'){ done([]); return; }
    API.selectCard("ヒュペリオン：破壊するカード", API.fieldCards(), t=>done([t]));
  },
  resolve(ctx){
    if(ctx.zone==='hand'){
      API.specialSummon(ctx.player,'hand',ctx.index,'atk',"マスター・ヒュペリオン");
      return;
    }
    const t=ctx.selectedTargets[0]; if(t) API.destroy(t, "マスター・ヒュペリオン");
  },
  afterResolve(){}
});

/* S03-U62: 手札に加える選択は resolve() 内の legacy API.selectCard（保存・リロードを跨げない）から
   API.requestChoice + 登録済みハンドラへ移行（SaveLoad安全）。特殊召喚とログは選択より前に確定させる。 */
API.registerChoiceHandler('s03u62.christia-bounce', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const t = picks[0]; if(!t) return;
  const h = locateCardAnyV4(t.card);
  if(h && h.zone==='grave') act({type:"FX_BOUNCE", player:args.player, zone:'grave', index:h.index, reason:"大天使クリスティア"});
});
/* S03-U110: 2011年当時のテキスト（旧テキスト）:
     自分の墓地に存在する天使族モンスターが4体のみの場合、このカードは手札から特殊召喚する事ができる。
     この方法で特殊召喚に成功した時、自分の墓地に存在する天使族モンスター1体を選択して手札に加える。
     このカードがフィールド上に表側表示で存在する限り、お互いにモンスターを特殊召喚する事はできない。
     フィールド上に表側表示で存在するこのカードが墓地へ送られる場合、墓地へ送らずデッキの一番上に戻す。
   以前の実装は4点すべてに誤り・欠落があった:
   ① 手札からの特殊召喚を activateFrom:['hand'] の「効果の発動」として扱い、チェーンを組ませていた
     → チェーンに乗らない特殊召喚手順 summonProcedure へ（サイバー・ドラゴンと同じ）。
   ② 手札に加える処理を特殊召喚と同じ resolve() 内で任意（cancelable:true）・対象を取らずに行っていた
     → ①の方法での特殊召喚成功時の強制誘発（対象を取る）へ。
   ③ 「お互いに特殊召喚できない」はログを出すだけで、どこにも適用されていなかった
     → v46GlobalSpecialSummonRestrictionReason の表側モンスター双方向ロック（虚無魔人と同じ）へ。
   ④ デッキの一番上に戻る置換が無かった → leaveFieldToDeckTopS03（engine/00_state_actions.js の
     s03DeckTopInsteadOfGraveU110）を宣言。 */
function christiaFairyGraveS03U110(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m' && x.db.ra==='天使');
}
function christiaSummonConditionS03U110(ctx){
  if(ctx.zone!=='hand'){ ctx.reason="手札から特殊召喚します"; return false; }
  const n=christiaFairyGraveS03U110(ctx.player).length;
  if(n!==4){ ctx.reason=`自分の墓地の天使族モンスターが4体のみの場合に限ります（現在${n}体）`; return false; }
  return true;
}
defineScript("大天使クリスティア", {
  type:"monster", priority:1, forced:true, targets:true,
  leaveFieldToDeckTopS03:true,
  summonProcedure:{ from:'hand', positions:['atk','def'], condition:christiaSummonConditionS03U110 },
  condition(ctx){
    const ev=ctx.event||{};
    if(ctx.zone!=='mz' || ctx.eventName!=='onSpecialSummon' || ev.card!==ctx.card || ev.kind!=='procedure'){
      ctx.reason="このカードの方法で特殊召喚に成功した時に発動します"; return false;
    }
    if(!christiaFairyGraveS03U110(ctx.player).length){ ctx.reason="自分の墓地に天使族モンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx,done){
    API.selectCard("大天使クリスティア：手札に加える天使族モンスター（対象）", christiaFairyGraveS03U110(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t || !t.card) return;
    const h=locateCardAnyV4(t.card);
    if(!h || h.p!==ctx.player || h.zone!=='grave'){ API.log("大天使クリスティア：対象が墓地に存在しないため手札に加えられません"); return; }
    API.returnToHand({p:h.p, zone:'grave', index:h.index, card:t.card}, "大天使クリスティア");
  },
  afterResolve(){},
  passive:{
    onSpecialSummon(ctx){ const ev=ctx.event||{}; return ctx.zone==='mz' && ev.card===ctx.card && ev.kind==='procedure'; }
  }
});

/* ---------- 六武衆 ---------- */
/* 六武の門・六武衆の結束 は S03-U14 で cards/H3_claude_s03_bushido.js へ移した（召喚時の武士道カウンターと v49 の選択）。 */

/* ---------- 暗黒界 ---------- */
/* S03-U112: 暗黒界の「カードの効果によって手札から捨てられた場合、…する」は強制誘発（forced）。
   「相手のカードの効果によって捨てられた場合、さらに…」は、プレイヤーへの確認（自己申告）ではなく
   捨てた時に記録された discardInfo.byPlayer（darkWorldDiscard）で判定する。 */
defineScript("暗黒界の狩人 ブラウ", {
  type:"monster", priority:2, forced:true,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason="効果で捨てられた時に発動します"; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.player, 1);
    if(darkWorldDiscard(ctx)==='opponent') API.draw(ctx.player, 1);   /* S03-U112 */
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave'; } }
});

defineScript("暗黒界の武神 ゴルド", { targets:true, /* S03-U476: 対象を取る（WIKI-9F35337BF8BB 2007-01-13）。選択側は requestChoiceV49 の targeting:true で耐性済み。ここは解決時の発生源 srcS03.tg（対象を取らない効果では破壊されない）のための宣言 */
  type:"monster", priority:2, forced:true,   /* S03-U112 */
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason="効果で捨てられた時に発動します"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  /* S03-U125: 「相手フィールド上に存在するカードを2枚まで選択して破壊する事ができる」は対象を取る。対象（0〜2枚）は
     発動時に選ぶ（以前は解決時に選んでいた）。相手のカードの効果で捨てられた場合だけ。 */
  selectTargets(ctx, done){
    if(darkWorldDiscard(ctx)!=='opponent'){ done([]); return; }
    const foes = API.fieldCards({player:ctx.opponent, filter:x=>x.card});
    if(!foes.length){ done([]); return; }
    const ok = requestChoiceV49({kind:'card', title:"暗黒界の武神 ゴルド：破壊する相手のカード（2枚まで・選ばなくてもよい）",
      candidates:foes, min:0, max:Math.min(2, foes.length), targeting:true, cancelable:false,
      legacy:{ onPick:(first, all)=>done((all||[]).filter(Boolean)) }, meta:{scriptName:"暗黒界の武神 ゴルド"}});
    if(!ok) done([]);
  },
  resolve(ctx){
    const me = API.pileCards(ctx.player,'grave',x=>x.card===ctx.card)[0];
    if(me) API.specialSummon(ctx.player,'grave',me.index,'atk',"暗黒界の武神 ゴルド");
    /* S03-U112: 相手のカードの効果で捨てられた場合だけ、さらに相手のカードを2枚まで破壊できる（任意）。
       S03-U125: 発動時に選んだ対象のうち、まだ相手フィールドにあるものを破壊する。
       's03u62.gold-destroy-confirm' / 'gold-destroy-step' ハンドラは古いセーブの続き用に残す。 */
    if(darkWorldDiscard(ctx)==='opponent'){
      (ctx.selectedTargets||[]).forEach(t=>{ const r = resolveTarget(t); if(r && r.p===ctx.opponent) API.destroy(r, "暗黒界の武神 ゴルド"); });
    }
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave'; } }
});
/* S03-U62: resolve() 内の legacy API.confirm（はい/いいえ）と、その先の再帰的 legacy API.selectCard を
   SaveLoad安全な登録済みハンドラへ移行。 */
function goldDestroyStep(player, opponent, destroyedUids){
  const foes = API.fieldCards({player:opponent}).filter(x=>destroyedUids.indexOf(x.card.uid)<0);
  if(destroyedUids.length>=2 || !foes.length) return;
  API.requestChoice({player, kind:'card', title:`ゴルド：破壊する相手のカード（${destroyedUids.length+1}/2）`,
    candidates: foes, min:1, max:1, cancelable:true,
    resume:{handler:'s03u62.gold-destroy-step', args:{player, opponent, destroyedUids}},
    meta:{scriptName:"暗黒界の武神 ゴルド"}});
}
API.registerChoiceHandler('s03u62.gold-destroy-confirm', (answer, args) => {
  if(answer.cancelled || !(answer.cards[0] && answer.cards[0].value===true)) return;
  goldDestroyStep(args.player, args.opponent, args.destroyedUids);
});
API.registerChoiceHandler('s03u62.gold-destroy-step', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h) return;
  ensureCardUid(gameState, h.card);
  API.destroy(h, "暗黒界の武神 ゴルド");
  goldDestroyStep(args.player, args.opponent, args.destroyedUids.concat([h.card.uid]));
});

/* S03-U62: resolve() 内の2段階 legacy API.selectCard（自分が捨てる→相手が捨てる）を
   SaveLoad安全な登録済みハンドラへ移行。候補は各段階でその場のgameStateから作り直す。 */
function darkWorldTradeFoeHand(opponent){
  return gameState.players[opponent].hand.map((c,i)=>({p:opponent, zone:'hand', index:i, card:c, db:dbOf(c)}));
}
API.registerChoiceHandler('s03u62.dark-world-trade-mine', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone!=='hand') return;
  API.discard(args.player, h.index, "暗黒界の取引");
  const foe = darkWorldTradeFoeHand(args.opponent);
  if(foe.length){
    API.requestChoice({player:args.player, kind:'card', title:"暗黒界の取引：相手が捨てる手札",
      candidates: foe, min:1, max:1, cancelable:true,
      resume:{handler:'s03u62.dark-world-trade-foe', args:{player:args.player, opponent:args.opponent}},
      meta:{scriptName:"暗黒界の取引"}});
  }
});
API.registerChoiceHandler('s03u62.dark-world-trade-foe', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(!h || h.zone!=='hand') return;
  API.discard(args.opponent, h.index, "暗黒界の取引");
});
defineScript("暗黒界の取引", {
  onOtherSummon:true,           // 捨てられた場合の誘発を拾う
  timing:["summon","free"],     // 通常魔法なので任意のタイミング
  type:"spell", priority:1, quickEffect:false,
  condition(ctx){
    if(!API.me(ctx).deck.length){ ctx.reason="デッキが空です"; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(0,1); API.draw(1,1);
    // 自分から捨てる
    const mine = handCandidates(ctx);
    if(mine.length){
      API.requestChoice({player:ctx.player, kind:'card', title:"暗黒界の取引：自分が捨てる手札",
        candidates: mine, min:1, max:1, cancelable:true,
        resume:{handler:'s03u62.dark-world-trade-mine', args:{player:ctx.player, opponent:ctx.opponent}},
        meta:{scriptName:"暗黒界の取引"}});
    }
  }
});

/* ---------- ガジェット ---------- */
['グリーン・ガジェット','レッド・ガジェット','イエロー・ガジェット'].forEach((nm,i)=>{
  const next = ['レッド・ガジェット','イエロー・ガジェット','グリーン・ガジェット'][i];
  defineScript(nm, {
    type:"monster", priority:1, quickEffect:false,
    blocksIfNoDeckToHand:true,   // S03-U04: 「手札に加える事ができる」任意の誘発。ライオウ適用中は発動できない
    condition(ctx){
      if(ctx.zone!=='mz'){ ctx.reason="フィールドで発動します"; return false; }
      const t = API.pileCards(ctx.player,'deck',x=>x.db.n===next);
      if(!t.length){ ctx.reason=`デッキに「${next}」がいません`; return false; }
      return true;
    },
    resolve(ctx){
      const t = API.pileCards(ctx.player,'deck',x=>x.db.n===next);
      if(t.length) API.searchDeck(ctx.player, t[0].index, nm);
    },
    afterResolve(){},
    passive:{
      onNormalSummon(ctx){ return ctx.zone==='mz'; },
      onSpecialSummon(ctx){ return ctx.zone==='mz'; },
    }
  });
});

/* ---------- TG ---------- */
/* S03-U87: 共通② フィールドのこのカードが破壊されてこのターン墓地へ送られた場合、エンドフェイズに
   1度、デッキから自分以外の「TG」モンスター1体を手札に加えられる（TG ワーウルフ・TG ストライカー共通。
   ドル・ドラ [D2_auto_cycle30.js] の「破壊され墓地へ送られたターンのエンドフェイズ」と同じ
   graveInfo パターン）。ハンド発動の①とグレイブ発動の②は同じカード名の同じ defineScript の中で
   ctx.zone により分岐する（precedent: TG ワンダー・マジシャン）。「1ターンに1度」はこのカード個体の
   flag（v87TgSearchTurn）で管理し、①の countLimit とは独立させる — 同じ個体が今ターン①でSSされ、
   その後戦闘等で破壊されて同じターンの②も使う、という実際にありうる流れを誤ってブロックしないため。 */
function tgDestroyedThisTurnS03U87(ctx){
  if(ctx.zone!=='grave') return false;
  const g = ctx.card.graveInfo;
  if(!(g && g.byDestroy && g.from==='mz' && g.turn===gameState.turn)) return false;
  return ctx.card.v87TgSearchTurn !== gameState.turn;
}
function tgOtherPool(ctx){
  const self = cardName(ctx.card);
  return API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('TG')===0 && x.db.n!==self);
}
function tgGraveClause(ctx){
  if(!tgDestroyedThisTurnS03U87(ctx)){
    ctx.reason="破壊されてこのターン墓地へ送られた場合のエンドフェイズに発動します"; return false; }
  if(gameState.phase!=='end'){ ctx.reason="エンドフェイズに発動します"; return false; }
  if(!tgOtherPool(ctx).length){ ctx.reason="デッキに自分以外の「TG」モンスターがいません"; return false; }
  return true;
}
function tgGraveResolve(ctx, name){
  API.setCardFlag({card:ctx.card},'v87TgSearchTurn',gameState.turn,name,{silent:true});
  const t = tgOtherPool(ctx);
  if(!t.length) return;
  API.requestChoice({player:ctx.player, kind:'card', title:name+"：手札に加える「TG」モンスター",
    candidates:t, min:1, max:1, cancelable:false,
    resume:{handler:'s03u58.deck-search', args:{player:ctx.player, reason:name}},
    meta:{scriptName:name}});
}

/* S03-U87: ① 自分・相手いずれかのレベル4以下のモンスターが特殊召喚された場合（Xyz召喚によるランク4
   以下は「レベルを持たない」ため対象外）、手札のこのカードを特殊召喚できる。旧実装は
   API.me(ctx).ssHistory（自分の特殊召喚のみ・レベル無視）を見ていたため、相手の特殊召喚や
   レベル5以上の特殊召喚でも誤って発動可能だった（engine/00_state_actions.js の ssHistory
   push に lv/kind を追加し、両プレイヤー分をレベル・種別つきで判定する）。 */
function tgLv4SpecialSummonedThisTurnS03U87(){
  return [0,1].some(p=>((gameState.players[p]||{}).ssHistory||[]).some(e=>
    e.turn===gameState.turn && (e.lv||0)<=4 && e.kind!=='xyz'));
}
defineScript("TG ストライカー", {
  /* S03-U297: both effects are not Quick Effects (the hand Special Summon is a rule, the Graveyard effect is a trigger): Spell Speed 1 */
  type:"monster", priority:1,
  activateFrom:["hand","grave"],
  condition(ctx){
    if(ctx.zone==='grave') return tgGraveClause(ctx);
    if(ctx.zone!=='hand'){ ctx.reason="手札から特殊召喚します"; return false; }
    if(API.me(ctx).mz.length){ ctx.reason="自分フィールドにモンスターがいると発動できません"; return false; }
    if(!API.foe(ctx).mz.length){ ctx.reason="相手フィールドにモンスターがいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.zone==='grave') return tgGraveResolve(ctx,"TG ストライカー");
    API.specialSummon(ctx.player,'hand',ctx.index,'atk',"TG ストライカー");
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return ctx.zone==='grave' && tgDestroyedThisTurnS03U87(ctx) && tgOtherPool(ctx).length>0; } }
});

/* S03-U297 (Opus ruling): both effects of TG ワーウルフ are monster TRIGGER effects of Spell Speed 1 — the hand Special Summon triggers on the Special
   Summon of a Level 4 or lower monster (it is stacked in the SEGOC selection of that event, like ドッペル・ウォリアー ①), the End Phase search from the
   Graveyard triggers at the End Phase. They were registered as priority 2 (Spell Speed 2): the hand effect was offered as a Quick Effect for the rest of the
   turn after any Level 4 Special Summon, and the Graveyard effect refused (and was refused) against Spell Speed 1 peers in a SEGOC chain.
   The summon is judged from the event (the Special Summoned card), not from the turn history. */
function tgLv4SummonEventS03U297(ctx){
  const e = ctx.event || {};
  const list = (e.cards && e.cards.length) ? e.cards : (e.card ? [e.card] : []);
  if(!list.length && e.uid!=null){ const h = findCardByUid(e.uid); if(h && h.card) list.push(h.card); }
  return list.some(c=>c && c!==ctx.card && dbOf(c).k==='m' && curLV(c)<=4 && c.specialSummonKind!=='xyz' && e.kind!=='xyz');
}
defineScript("TG ワーウルフ", {
  type:"monster", priority:1, onOtherSummon:true,   /* S03-U297: reacts to the Special Summon of other monsters (either player) */
  activateFrom:["hand","grave"],
  condition(ctx){
    if(ctx.zone==='grave') return tgGraveClause(ctx);
    if(ctx.zone!=='hand'){ ctx.reason="手札から特殊召喚します"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    if(!tgLv4SummonEventS03U297(ctx)){
      ctx.reason="レベル4以下のモンスターが特殊召喚された時に発動します"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(ctx.zone==='grave') return tgGraveResolve(ctx,"TG ワーウルフ");
    API.specialSummon(ctx.player,'hand',ctx.index,'atk',"TG ワーウルフ");
  },
  afterResolve(){},
  passive:{
    onSpecialSummon(ctx){ return ctx.zone==='hand' && tgLv4SummonEventS03U297(ctx); },
    onEndPhase(ctx){ return ctx.zone==='grave' && tgDestroyedThisTurnS03U87(ctx) && tgOtherPool(ctx).length>0; }
  }
});

/* ---------- カラクリ ---------- */
defineScript("カラクリ商人 壱七七", {
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason="フィールドで発動します"; return false; }
    const t = API.pileCards(ctx.player,'deck',x=>String(x.db.n||'').indexOf('カラクリ')>=0);
    if(!t.length){ ctx.reason="デッキに「カラクリ」がいません"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const t = API.pileCards(ctx.player,'deck',x=>String(x.db.n||'').indexOf('カラクリ')>=0);
    if(!t.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"カラクリ商人：手札に加える「カラクリ」",
      candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-search', args:{player:ctx.player, reason:'カラクリ商人 壱七七'}},
      meta:{scriptName:'カラクリ商人 壱七七'}});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz'; } }
});

defineScript("カラクリ大将軍 無零怒", {
  auditNote:"①S召喚時のカラクリ特殊召喚・②表示形式変更時の1ターン1ドローを自動化",
  timing:["summon","free"],
  type:"synchro", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason="フィールドで発動します"; return false; }
    if(ctx.eventName==='onKarakuriPositionChange'){
      const ev=ctx.event||{};
      if(ev.player!==ctx.player || !ev.card || ev.card.face!=='up' || String(dbOf(ev.card).n||'').indexOf('カラクリ')<0){ctx.reason='自分の表側「カラクリ」の表示形式変更時です';return false;}
      if(ctx.card.v350BureidoDrawTurn===gameState.turn){ctx.reason='このターンは既にドロー効果を使用しています';return false;}
      return true;
    }
    const ev=ctx.event||{};
    if(ctx.eventName==='onSpecialSummon' && !(ev.card===ctx.card && ev.kind==='synchro')){ctx.reason='このカードのS召喚成功時です';return false;}
    const t=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&!x.db.ex&&String(x.db.n||'').indexOf('カラクリ')>=0);
    if(!t.length){ctx.reason="デッキに「カラクリ」モンスターがいません";return false;}
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ctx.reason="モンスターゾーンが一杯です";return false;}
    return true;
  },
  selectTargets(ctx,done){ done([]); },
  resolve(ctx){
    if(ctx.eventName==='onKarakuriPositionChange'){
      API.setCardFlag({card:ctx.card},'v350BureidoDrawTurn',gameState.turn,'カラクリ大将軍 無零怒',{silent:true}); API.draw(ctx.player,1); return;
    }
    /* S03-U63: 対象を取らない効果なので、解決時（現在のデッキ）から選ぶ（S03-U58パターン）。 */
    const t=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&!x.db.ex&&String(x.db.n||'').indexOf('カラクリ')>=0);
    if(!t.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:"無零怒：特殊召喚する「カラクリ」",
      candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-special', args:{player:ctx.player, pos:'def', reason:'カラクリ大将軍 無零怒'}},
      meta:{scriptName:'カラクリ大将軍 無零怒'}});
  },
  afterResolve(){},
  passive:{
    onSpecialSummon(ctx){const ev=ctx.event||{};return ctx.zone==='mz'&&ev.card===ctx.card&&ev.kind==='synchro';},
    onKarakuriPositionChange(ctx){const ev=ctx.event||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ev.player===ctx.player&&ev.card&&ev.card.face==='up'&&String(dbOf(ev.card).n||'').indexOf('カラクリ')>=0&&ctx.card.v350BureidoDrawTurn!==gameState.turn;}
  }
});

/* ---------- ジャンド ---------- */
defineScript("ジャンク・シンクロン", {
  includesSpecialSummon:true,
  blocksIfNoSpecialSummon:true,
  targets:true,                 // 対象を取る効果
  type:"monster", priority:1, quickEffect:false,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason="フィールドで発動します"; return false; }
    const t = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && (x.db.lv||9)<=2 && !x.db.ex);
    if(!t.length){ ctx.reason="墓地にレベル2以下のモンスターがいません"; return false; }
    if(API.me(ctx).mz.length>=ZONE_LIMITS.mz){ ctx.reason="モンスターゾーンが一杯です"; return false; }
    return true;
  },
  selectTargets(ctx, done){
    const t = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && (x.db.lv||9)<=2 && !x.db.ex);
    API.selectCard("ジャンク・シンクロン：蘇生するレベル2以下", t, x=>done([x]), "効果は無効になります");
  },
  resolve(ctx){
    const t=ctx.selectedTargets[0]; if(!t) return;
    API.specialSummon(ctx.player,'grave',t.index,'def',"ジャンク・シンクロン");
    const P = gameState.players[ctx.player];
    const ni = P.mz.length-1;
    if(ni>=0) act({type:"FX_NEGATE", player:ctx.player, zone:'mz', index:ni, reason:"ジャンク・シンクロン"});
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz'; } }
});

/* ---- ドッペル・ウォリアー ----
   ①:自分の墓地からモンスターが特殊召喚された時に発動できる。このカードを手札から特殊召喚する。
   ②:このカードがS素材として墓地へ送られた場合に発動できる。自分フィールドに「ドッペル・トークン」(戦士族・闇・星1・攻/守400)
     2体を攻撃表示で特殊召喚する。
   S03-U128: ①は未実装だった。②はどんな理由で墓地へ送られても（戦闘破壊でも）発動していた（S素材の確認なし）、
   モンスターゾーンが1つしか空いていなくても1体だけ出していた。v4 の2効果に分ける。 */
function doppelFromOwnGraveS03(ctx){
  const e = ctx.event || {};
  const cards = (e.cards && e.cards.length) ? e.cards : (e.card ? [e.card] : []);
  return cards.some(c=>c && c.specialSummonedFrom==='grave' && c.specialSummonedFromPlayer===ctx.player && c!==ctx.card);
}
function doppelSentAsSynchroMaterialS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='grave' || !ctx.card) return false;
  const self = (e.card && e.card===ctx.card) || (e.uid!=null && ctx.card.uid===e.uid);
  return !!(self && e.reason==='synchroMaterial');
}
defineUnifiedCardV4('ドッペル・ウォリアー',[{
  key:'hand-summon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onSpecialSummon'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = "手札から発動します"; return false; }
    if(!doppelFromOwnGraveS03(ctx)){ ctx.reason = "自分の墓地からモンスターが特殊召喚された時に発動できます"; return false; }
    if(API.me(ctx).mz.length >= ZONE_LIMITS.mz){ ctx.reason = "モンスターゾーンが一杯です"; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(h && h.zone==='hand' && h.p===ctx.player) API.specialSummon(ctx.player, 'hand', h.index, 'atk', "ドッペル・ウォリアー");
  },
  afterResolve(){}
},{
  key:'tokens', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(!doppelSentAsSynchroMaterialS03(ctx)){ ctx.reason = "S素材として墓地へ送られた場合に発動できます"; return false; }
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length < 2){ ctx.reason = "モンスターゾーンが2つ空いていません"; return false; }
    return true;
  },
  operation(ctx){
    if(ZONE_LIMITS.mz - API.me(ctx).mz.length < 2) return;
    API.createToken(ctx.player, {name:"ドッペル・トークン", atk:400, def:400, lv:1, ra:"戦士", at:"闇", pos:'atk'}, 2);
  },
  afterResolve(){}
}],{type:'monster', priority:1, activateFrom:['hand','grave'], onOtherSummon:true,   /* ① reacts to OTHER monsters' Special Summons */
  passive:{
    onSpecialSummon(ctx){ return ctx.zone==='hand' && doppelFromOwnGraveS03(ctx); },
    onSendToGrave(ctx){ return doppelSentAsSynchroMaterialS03(ctx); }
  }});

/* 回数制限の残りを短く表示する */
function clNote(p, name, card){
  const sc = CARD_SCRIPTS[name];
  if(!sc || !sc.countLimit) return "";
  const left = countLeft(p, name, sc, card);
  const jp = countLimitJp(sc);
  return left>0 ? `（${jp}／残り${left}）` : `（${jp}／使用済み）`;
}

function hasEffect(name){
  return !!(CARD_SCRIPTS[name] || CARD_EFFECT[name] || AUTO_EFFECT[name]);
}
/* 発動トリガ種別（召喚時 / 起動）。宣言テーブルのみ持つ */
function effectTrigger(name){
  const e = AUTO_EFFECT[name];
  return e ? e.trig : "ignition";
}
/* 効果を実行する。selfLoc={zone,index,keep} */
function runEffect(p, name, selfLoc){
  // ① カードスクリプト（Step11の正式基盤）を最優先
  if(CARD_SCRIPTS[name]){
    const loc = selfLoc||{};
    return runScript(name, p, loc.zone, loc.index, {keep:loc.keep});
  }
  // ② 旧・個別実装 ③ 宣言テーブル の順にフォールバック
  const fn = CARD_EFFECT[name];
  if(fn){ fn(p, selfLoc); return true; }
  const ent = AUTO_EFFECT[name];
  if(ent){ runAutoEffect(p, name, ent, selfLoc); return true; }
  return false;
}

/* =========================================================================
   【ライトロード】関連
   自分エンドフェイズのデッキ削りは強制効果なので endPhaseMill で宣言し、
   resolveEndPhaseMills() が確認なしで自動処理する。
   ========================================================================= */

/* ---- 削るだけのライトロード ---- */
[['ライトロード・パラディン ジェイン', 2],
 ['ライトロード・マジシャン ライラ',   3],
 ['ライトロード・モンク エイリン',     3],
 ['ライトロード・ドルイド オルクス',   2],
 ['ライトロード・スピリット シャイア', 2],
 ['ライトロード・ドラゴン グラゴニス', 3],
].forEach(([nm, n])=>{
  if(!CARD_SCRIPTS[nm]) defineScript(nm, { endPhaseMill:n });
});

/* ---- ライトロード・パラディン ジェイン ----
   相手モンスターに攻撃するダメージステップの間、攻撃力が300アップする。 */
CARD_SCRIPTS['ライトロード・パラディン ジェイン'].continuous = {
  scope:'self', from:['mz'],
  apply(target, self){
    const b = gameState.battle;
    if(!b || b.target === 'direct') return null;
    if((gameState.players[b.player].mz||[])[b.atkIdx] !== self) return null;
    return { atk:300 };
  }
};

/* ---- ライトロード・ドルイド オルクス ----
   「ライトロード」モンスターを魔法・罠・効果モンスターの効果の対象にできない。 */
CARD_SCRIPTS['ライトロード・ドルイド オルクス'].continuous = Object.assign(
  { scope:'allMonsters', from:['mz'], apply(){ return null; },
    immuneToTarget(target){
      return String(dbOf(target).n||'').indexOf('ライトロード') >= 0;
    } },
  {});

/* ---- ライトロード・スピリット シャイア ----
   攻撃力は、自分の墓地の「ライトロード」モンスターの種類×300アップする。 */
CARD_SCRIPTS['ライトロード・スピリット シャイア'].continuous = {
  scope:'self', from:['mz'],
  apply(target, self, info){
    const n = lightswornKinds(info.p);
    return n ? { atk:n*300 } : null;
  }
};
/* ---- ライトロード・ドラゴン グラゴニス（攻守とも上がる） ---- */
CARD_SCRIPTS['ライトロード・ドラゴン グラゴニス'].continuous = {
  scope:'self', from:['mz'],
  apply(target, self, info){
    const n = lightswornKinds(info.p);
    return n ? { atk:n*300, def:n*300 } : null;
  }
};
/* 自分の墓地の「ライトロード」モンスターの種類数 */
function lightswornKinds(p){
  const set = new Set();
  (gameState.players[p].grave||[]).forEach(c=>{
    const db = dbOf(c);
    if(db.k==='m' && String(db.n||'').indexOf('ライトロード')>=0) set.add(db.n);
  });
  return set.size;
}

/* ---- ライトロード・モンク エイリン ----
   守備表示モンスターを攻撃したダメージ計算前に、そのモンスターをデッキに戻す。 */
CARD_SCRIPTS['ライトロード・モンク エイリン'] = Object.assign(
  CARD_SCRIPTS['ライトロード・モンク エイリン'], {
  type:"monster", priority:1, dsTiming:"start", targets:false,
  condition(ctx){
    const b = gameState.battle;
    if(!b || b.target === 'direct'){ ctx.reason = "守備表示モンスターへの攻撃時に発動します"; return false; }
    if((gameState.players[b.player].mz||[])[b.atkIdx] !== ctx.card){
      ctx.reason = "このカードが攻撃する場合に発動します"; return false;
    }
    const def = (gameState.players[b.player===0?1:0].mz||[])[b.target];
    if(!def || def.pos !== 'def'){ ctx.reason = "攻撃対象が守備表示ではありません"; return false; }
    return true;
  },
  resolve(ctx){
    const b = gameState.battle;
    const fo = b.player===0?1:0;
    const def = (gameState.players[fo].mz||[])[b.target];
    if(!def){ API.log("攻撃対象が場にないため不発"); return; }
    API.returnToDeck({p:fo, zone:'mz', index:b.target, card:def}, false,
                     "ライトロード・モンク エイリン");
    endBattle();
  },
  afterResolve(){},
  passive:{
    onDamageStep(ctx){
      const b = gameState.battle;
      if(!b || b.target === 'direct') return false;
      if((gameState.players[b.player].mz||[])[b.atkIdx] !== ctx.card) return false;
      const def = (gameState.players[b.player===0?1:0].mz||[])[b.target];
      return !!(def && def.pos === 'def');
    }
  }
});

/* ---- ライトロード・マジシャン ライラ ----
   自分の表側攻撃表示のこのカードを守備表示にし、相手の魔法・罠1枚を破壊する。 */
CARD_SCRIPTS['ライトロード・マジシャン ライラ'] = Object.assign(
  CARD_SCRIPTS['ライトロード・マジシャン ライラ'], {
  timing:["mainPhase"], type:"monster", priority:1, targets:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up' || ctx.card.pos !== 'atk'){
      ctx.reason = "自分フィールドの表側攻撃表示で発動します"; return false;
    }
    if(!API.fieldCards({zone:'sz', player:ctx.opponent, filter:x=>x.card}).length){
      ctx.reason = "相手フィールドに魔法・罠カードがありません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("ライラ：破壊する相手の魔法・罠",
      API.fieldCards({zone:'sz', player:ctx.opponent, filter:x=>x.card}),
      t=>done([t]), "裏側のカードも選べます");
  },
  resolve(ctx){
    API.changePosition({p:ctx.player, zone:'mz', index:ctx.index, card:ctx.card},
                       'def', "ライラ（守備表示になる）");
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.destroy(t, "ライトロード・マジシャン ライラ");
  },
  afterResolve(){}
});

/* ---- ライトロード・サモナー ルミナス ----
   1ターンに1度、手札を1枚捨て、墓地のレベル4以下の「ライトロード」を特殊召喚する。 */
defineScript("ライトロード・サモナー ルミナス", {
  endPhaseMill:3,
  countLimit:1,
  timing:["mainPhase"],   /* S03-U190: an ignition effect — "free" let it be used in any phase / the opponent's turn */
  type:"monster", priority:1, targets:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){
      ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false;
    }
    if(!API.pileCards(ctx.player,'hand').length){ ctx.reason = "捨てる手札がありません"; return false; }
    if(!luminaTargets(ctx.player).length){
      ctx.reason = "墓地にレベル4以下の「ライトロード」がいません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.selectCard("ルミナス：コストで捨てる手札", API.pileCards(ctx.player,'hand'), x=>{
      API.discard(ctx.player, x.index, "ルミナス（コスト）", {byPlayer:ctx.player});
      done(true);
    });
  },
  selectTargets(ctx, done){
    API.selectCard("ルミナス：特殊召喚する「ライトロード」",
      luminaTargets(ctx.player), t=>done([t]), "レベル4以下");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が墓地にないため不発"); return; }
    API.specialSummon(ctx.player,'grave',t.index,'atk',"ライトロード・サモナー ルミナス");
  },
  afterResolve(){}
});
function luminaTargets(p){
  return API.pileCards(p,'grave',
    x=>x.db.k==='m' && String(x.db.n||'').indexOf('ライトロード')>=0 && (x.db.lv||9)<=4);
}

/* ---- ライトロード・ビースト ウォルフ ----
   S03-U190 (2011 text): 「このカードは通常召喚できず、カードの効果でのみ特殊召喚できる。このカードがデッキから墓地へ送られた時に発動する。
   このカードを墓地から特殊召喚する。」 A forced trigger of the card itself (onSendToGrave from the Deck — by an effect or a cost);
   before, it had no trigger event at all (a GY ignition-like condition). */
defineScript("ライトロード・ビースト ウォルフ", {
  type:"monster", priority:1, forced:true,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = "墓地で発動します"; return false; }
    const e = ctx.event || {};
    if(ctx.eventName !== 'onSendToGrave' || e.from !== 'deck' || !eventIsSelfS03(ctx)){
      ctx.reason = "デッキから墓地へ送られた時に発動します"; return false;
    }
    return true;
  },
  resolve(ctx){
    const me = ctx.card && ctx.card.uid != null ? findCardByUid(ctx.card.uid) : null;
    if(!me || me.zone !== 'grave'){ API.log("ウォルフ：墓地にいないため特殊召喚できない"); return; }
    if(!hasMonsterZoneSpace(ctx.player)){ API.log("ウォルフ：モンスターゾーンが空いていない"); return; }
    API.specialSummon(ctx.player,'grave',me.index,'atk',"ライトロード・ビースト ウォルフ");
  },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && (ctx.event||{}).from==='deck' && eventIsSelfS03(ctx); } }
});

/* ---- ライトロード・プリースト ジェニス ----
   S03-U190 (2011 text): 「「ライトロード」と名のついたカードの効果によって自分のデッキからカードが墓地へ送られたターンのエンドフェイズ時、
   相手ライフに500ポイントダメージを与え、自分は500ライフポイント回復する。」
   Before, it fired at every End Phase. Now (engine/1ZZE): at the End Phase of a turn in which a 「ライトロード」 card's effect milled the
   controller's Deck — including the 「ライトロード」 End Phase mills of that End Phase (they are applied after the onEndPhase triggers, so
   the mill event itself is a second entry during the End Phase); once per turn (jenisTurnS03). Forced. */
function jenisReadyS03(ctx){
  return ctx.zone==='mz' && ctx.card && ctx.card.face==='up' && gameState.phase==='end' && lswMilledThisTurnS03(ctx.player)
    && Number(ctx.card.jenisTurnS03) !== Number(gameState.turn);
}
defineScript("ライトロード・プリースト ジェニス", {
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(!jenisReadyS03(ctx)){ ctx.reason = "「ライトロード」の効果でデッキから墓地へ送られたターンのエンドフェイズ時に発動します"; return false; }
    return true;
  },
  resolve(ctx){
    const me = ctx.card && ctx.card.uid != null ? findCardByUid(ctx.card.uid) : null;
    if(me && me.zone==='mz') act({type:'FX_CARD_FLAG_V46', player:me.p, zone:'mz', index:me.index, flag:'jenisTurnS03', value:gameState.turn, reason:'ジェニス', silent:true});
    API.damageLP(ctx.opponent, 500, "ライトロード・プリースト ジェニス");
    API.recoverLP(ctx.player, 500, "ライトロード・プリースト ジェニス");
  },
  afterResolve(){},
  passive:{
    onEndPhase(ctx){ return jenisReadyS03(ctx); },
    onLightswornMillS03(ctx){ return (ctx.event||{}).player===ctx.player && jenisReadyS03(ctx); }
  }
});

/* ---- ライトロード・ウォリアー ガロス ----
   S03-U190 (2011 text): 「「ライトロード・ウォリアー ガロス」以外の自分フィールド上の「ライトロード」と名のついたモンスターの効果によって
   自分のデッキからカードが墓地へ送られた場合、自分のデッキの上からカードを2枚墓地へ送る。その後、この効果で墓地へ送られた「ライトロード」と
   名のついたモンスターの数だけデッキからカードをドローする。」
   Before, it had no trigger at all (an ignition-like condition). Now a forced trigger on engine/1ZZE's onLightswornMillS03: the source is a
   monster on the controller's field, not named ガロス; counted monsters are the ones this effect sent. */
function garosSourceOkS03(ctx){
  const e = ctx.event || {};
  if(e.player !== ctx.player || !e.src || e.src === 'ライトロード・ウォリアー ガロス') return false;
  const h = e.srcUid != null ? findCardByUid(e.srcUid) : null;
  return !!(h && h.zone==='mz' && h.p===ctx.player && dbOf(h.card).k==='m' && lswNamedS03(cardName(h.card)));
}
defineScript("ライトロード・ウォリアー ガロス", {
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false; }
    if(ctx.eventName !== 'onLightswornMillS03' || !garosSourceOkS03(ctx)){
      ctx.reason = "他の自分の「ライトロード」モンスターの効果でデッキから墓地へ送られた場合に発動します"; return false;
    }
    return true;
  },
  resolve(ctx){
    const P = gameState.players[ctx.player];
    const before = (P.grave||[]).length;
    API.millTop(ctx.player, 2, "ライトロード・ウォリアー ガロス");
    const added = (P.grave||[]).slice(before);
    const n = added.filter(c=>dbOf(c).k==='m' && lswNamedS03(dbOf(c).n)).length;
    if(n) API.draw(ctx.player, n, `ガロス（ライトロード${n}体）`);
    else API.log("ガロス：墓地へ送られた中に「ライトロード」モンスターがなかった");
  },
  afterResolve(){},
  passive:{ onLightswornMillS03(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && garosSourceOkS03(ctx); } }
});

/* ---- ライトロード・シーフ ライニャン ----
   リバース時、墓地の「ライトロード」1体をデッキに戻して1枚ドローする。 */
defineScript("ライトロード・シーフ ライニャン", {
  type:"monster", priority:1, targets:true,
  condition(ctx){
    if(!lyllaTargets(ctx.player).length){
      ctx.reason = "墓地に「ライトロード」モンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("ライニャン：デッキに戻す「ライトロード」",
      lyllaTargets(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が墓地にないため不発"); return; }
    /* S03-U190: 「デッキに戻し」 — shuffled (before, it went on top and the draw took it back) */
    const h = t.card && t.card.uid != null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone !== 'grave'){ API.log("ライニャン：対象が墓地にないため不発"); return; }
    API.returnToDeck(h, false, "ライトロード・シーフ ライニャン");
    API.shuffle(ctx.player);
    API.draw(ctx.player, 1, "ライトロード・シーフ ライニャン");
  },
  afterResolve(){},
  passive:{ onFlip(ctx){ return ctx.zone==='mz'; } }
});
function lyllaTargets(p){
  return API.pileCards(p,'grave',
    x=>x.db.k==='m' && String(x.db.n||'').indexOf('ライトロード')>=0);
}

/* ---- 裁きの龍 ----
   ① 1000LPを払い、このカード以外のフィールドのカードを全て破壊する。
   ② 自分エンドフェイズにデッキの上から4枚を墓地へ送る。 */
defineScript("裁きの龍", {
  endPhaseMill:4,
  timing:["mainPhase","free"],
  type:"monster", priority:1,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){
      ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false;
    }
    if(API.me(ctx).lp <= 1000){ ctx.reason = "1000より多いライフが必要です"; return false; }
    return true;
  },
  cost(ctx, done){ API.payCost(ctx.player, 1000, "裁きの龍"); done(true); },
  resolve(ctx){
    // 自身以外のフィールドのカードを全て破壊する
    const all = API.fieldCards({filter:x=>x.card && x.card !== ctx.card});
    all.slice().reverse().forEach(x=>API.destroy(x, "裁きの龍"));
  },
  afterResolve(){}
});

/* ---- 光の召集 ----
   自分の手札を全て捨て、その枚数だけ墓地から光属性モンスターを手札に加える。
   S03-U62: resolve() 内の再帰的 legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
function lightCallStep(player, left){
  if(left <= 0) return;
  const cands = API.pileCards(player,'grave',x=>x.db.k==='m' && x.db.at==='光');
  if(!cands.length){ API.log("墓地に光属性モンスターがいません"); return; }
  API.requestChoice({player, kind:'card', title:`光の召集：手札に加える光属性モンスター（残り${left}）`,
    candidates: cands, min:1, max:1, cancelable:false,   /* S03-U190: 「選んで手札に加える」 is mandatory (as many as possible) */
    resume:{handler:'s03u62.light-call-return', args:{player, left}},
    meta:{scriptName:"光の召集"}});
}
API.registerChoiceHandler('s03u62.light-call-return', (answer, args) => {
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  /* legacy の元動作を保つ：この段階をキャンセルしたら、残りの回数も含めて以降は加えない。 */
  if(!h) return;
  API.returnToHand(h, "光の召集");
  lightCallStep(args.player, args.left-1);
});
defineScript("光の召集", {
  type:"trap", priority:1,
  condition(ctx){
    if(!API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card).length){
      ctx.reason = "捨てる手札がありません"; return false;
    }
    return true;
  },
  resolve(ctx){
    const P = gameState.players[ctx.player];
    let n = 0;
    for(let i=(P.hand||[]).length-1; i>=0; i--){
      API.discard(ctx.player, i, "光の召集", {byPlayer:ctx.player}); n++;
    }
    lightCallStep(ctx.player, n);
  }
});

/* =========================================================================
   【TG】関連
   「破壊され墓地へ送られたターンのエンドフェイズ」のサーチは
   忘れやすいので、エンドフェイズに自動で候補として提示する。
   ========================================================================= */

/* 破壊されて墓地にある「TG」が、エンドフェイズにサーチできるか判定する共通処理。
   S03-U106: 現在はどのカードからも参照されない汎用テンプレート（makeTgEndSearch 用）だが、
   「エンドフェイズに」という名前に反して実際にはフェイズを一切判定していなかった
   （TG ラッシュ・ライノ／TG サイバー・マジシャンで実戦の実在バグとして発見・修正、
   tgGraveClause 参照）。将来このテンプレートを使う「TG」カードが出た時のために
   予防的に直しておく。 */
function tgEndSearchCondition(ctx){
  if(ctx.zone !== 'grave'){
    ctx.reason = "破壊され墓地へ送られたターンのエンドフェイズに発動します"; return false;
  }
  if(!destroyedThisTurn(ctx.card)){
    ctx.reason = "このターンに破壊され墓地へ送られた場合に発動できます"; return false;
  }
  if(gameState.phase !== 'end'){
    ctx.reason = "エンドフェイズに発動します"; return false;
  }
  if(!tgInDeck(ctx.player, dbOf(ctx.card).n).length){
    ctx.reason = "デッキに他の「TG」モンスターがいません"; return false;
  }
  return true;
}
function makeTgEndSearch(nm, extra){
  return Object.assign({
    type:"monster", priority:1,
    activateFrom:["grave"],
    condition: tgEndSearchCondition,
    selectTargets(ctx, done){
      API.selectCard(`${nm}：手札に加える「TG」`,
        tgInDeck(ctx.player, dbOf(ctx.card).n), t=>done([t]));
    },
    resolve(ctx){
      const t = ctx.selectedTargets[0];
      if(t) API.searchDeck(ctx.player, t.index, nm);
    },
    afterResolve(){},
    passive:{
      onEndPhase(ctx){ return ctx.zone==='grave' && destroyedThisTurn(ctx.card); }
    }
  }, extra||{});
}

/* ---- TG ジェット・ファルコン ----
   シンクロ召喚の素材として墓地へ送られた場合、相手に500ダメージを与える。 */
/* S03-U195: it had no trigger event (a GY ignition-like condition usable any time). Now a forced trigger when this card is sent to the GY
   as Synchro Material. */
defineScript("TG ジェット・ファルコン", {
  type:"monster", priority:1, forced:true,
  activateFrom:["grave"],
  condition(ctx){
    const e = ctx.event || {};
    if(ctx.zone !== 'grave' || ctx.eventName !== 'onSendToGrave' || e.reason !== 'synchroMaterial' || !eventIsSelfS03(ctx)){
      ctx.reason = "シンクロ召喚の素材として墓地へ送られた場合に発動します"; return false;
    }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 500, "TG ジェット・ファルコン"); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && (ctx.event||{}).reason==='synchroMaterial' && eventIsSelfS03(ctx); } }
});

/* ---- TG カタパルト・ドラゴン ----
   1ターンに1度、手札からレベル3以下の「TG」チューナー1体を特殊召喚できる。 */
defineScript("TG カタパルト・ドラゴン", {
  countLimit:1,
  timing:["mainPhase"],   /* S03-U195: an ignition effect ("free" allowed any phase / the opponent's turn) */
  type:"monster", priority:1,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){
      ctx.reason = "フィールドに表側表示で存在する場合に発動します"; return false;
    }
    if(!catapultTargets(ctx.player).length){
      ctx.reason = "手札にレベル3以下の「TG」チューナーがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("TG カタパルト・ドラゴン：特殊召喚する「TG」チューナー",
      catapultTargets(ctx.player), t=>done([t]), "レベル3以下");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t) return;
    const h = t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;   /* S03-U195: the chosen card (by uid), still in the hand */
    if(h && h.zone==='hand' && h.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player,'hand',h.index,'atk',"TG カタパルト・ドラゴン");
  },
  afterResolve(){}
});
function catapultTargets(p){
  return API.pileCards(p,'hand',
    x=>x.db.k==='m' && String(x.db.n||'').indexOf('TG')===0 &&
       (x.db.st||[]).indexOf('チューナー')>=0 && (x.db.lv||9)<=3);
}

/* ---- S03-U121: TG / Synchron Synchro cluster helpers ---- */
/* this card itself was just Synchro Summoned (the onSpecialSummon event is about this card, kind 'synchro') */
function s03SelfSynchroSummonedU121(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || !ctx.card || e.kind!=='synchro') return false;
  return (e.card && e.card===ctx.card) || (e.uid!=null && ctx.card.uid===e.uid);
}
/* ②「相手メインフェイズに発動できる。このカードを含む自分フィールドのモンスターをS素材としてS召喚する」 */
function s03QuickSynchroOkU121(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = "フィールドに表側表示で存在する必要があります"; return false; }
  if(gameState.activePlayer===ctx.player || !(gameState.phase==='main1'||gameState.phase==='main2')){ ctx.reason = "相手メインフェイズに発動できます"; return false; }
  if(typeof canEffectSynchroS03!=='function' || !canEffectSynchroS03(ctx.player, ensureCardUid(gameState, ctx.card))){ ctx.reason = "このカードを含むS素材でS召喚できるモンスターがいません"; return false; }
  return true;
}
function s03FieldSpellTrapsU121(){ return API.fieldCards({filter:x=>x.card && (x.zone==='sz'||x.zone==='field')}); }

/* ---- TG ワンダー・マジシャン ----
   ①:このカードがS召喚に成功した場合、フィールドの魔法・罠カード1枚を対象として発動する。そのカードを破壊する。
   ②:相手メインフェイズに発動できる。このカードを含む自分フィールドのモンスターを素材としてS召喚する。
   ③:フィールドのこのカードが破壊された場合に発動する。自分はデッキから1枚ドローする。
   S03-U121: ①は他のモンスターのS召喚にも反応していた（イベントのカードを見ていなかった）・任意扱いだった。②は未実装。
   ③は誘発になっておらず、破壊されたターンに墓地から手動で起動できるだけだった。eventName で分岐する。 */
defineScript("TG ワンダー・マジシャン", {
  type:"monster", priority:1, targets:true, quickEffect:true,
  /* ① / ③ are triggers; ② is a quick effect whose timing (the opponent's Main Phase) is checked in condition. Without an
     explicit timing, scriptTimings() would infer only 'summon' from the passive and refuse ②. */
  timing:['free'],
  condition(ctx){
    if(ctx.eventName==='onSpecialSummon'){
      if(!s03SelfSynchroSummonedU121(ctx)){ ctx.reason = "このカードがS召喚に成功した場合に発動します"; return false; }
      if(!s03FieldSpellTrapsU121().length){ ctx.reason = "フィールドに魔法・罠カードがありません"; return false; }
      return true;
    }
    if(ctx.eventName==='onDestroy'){
      if(!cardGunnerDestroyedFromFieldS03U113(ctx)){ ctx.reason = "フィールドのこのカードが破壊された場合に発動します"; return false; }
      if(!(API.me(ctx).deck||[]).length){ ctx.reason = "デッキが残っていません"; return false; }
      return true;
    }
    return s03QuickSynchroOkU121(ctx);
  },
  selectTargets(ctx, done){
    if(ctx.eventName!=='onSpecialSummon'){ done([]); return; }
    API.selectCard("TG ワンダー・マジシャン：破壊する魔法・罠", s03FieldSpellTrapsU121(), t=>done([t]));
  },
  resolve(ctx){
    if(ctx.eventName==='onDestroy'){ API.draw(ctx.player, 1, "TG ワンダー・マジシャン"); return; }
    if(ctx.eventName==='onSpecialSummon'){
      const t = ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(r) API.destroy(r, "TG ワンダー・マジシャン");
      return;
    }
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || h.card.face!=='up'){ API.log("TG ワンダー・マジシャン：このカードがフィールドに無いためS召喚できない"); return; }
    effectSynchroSummonS03(ctx.player, ensureCardUid(gameState, ctx.card), "TG ワンダー・マジシャン");
  },
  afterResolve(){},
  forcedForEventS03(eventName){ return eventName==='onSpecialSummon' || eventName==='onDestroy'; },
  passive:{
    onSpecialSummon(ctx){ return s03SelfSynchroSummonedU121(ctx); },
    onDestroy(ctx){ return cardGunnerDestroyedFromFieldS03U113(ctx); }
  }
});

/* ---- TG パワー・グラディエイター ----
   このカードが守備表示モンスターを攻撃した時、その守備力を攻撃力が超えていれば、その数値だけ戦闘ダメージを与える。
   フィールド上に存在するこのカードが破壊された時、自分のデッキからカードを1枚ドローする。
   S03-U121: 貫通が未実装。ドローは誘発になっておらず、墓地から手動で起動できるだけだった。 */
defineScript("TG パワー・グラディエイター", {
  type:"monster", priority:1, forced:true,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.eventName!=='onDestroy' || !cardGunnerDestroyedFromFieldS03U113(ctx)){
      ctx.reason = "フィールドで破壊された時に発動します"; return false;
    }
    if(!(API.me(ctx).deck||[]).length){ ctx.reason = "デッキが残っていません"; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){ API.draw(ctx.player, 1, "TG パワー・グラディエイター"); },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      if(info.atkCard!==info.self || !info.defCard || info.defCard.pos!=='def') return 0;
      return Math.max(0, curATK(info.atkCard)-curDEF(info.defCard));
    }
  },
  passive:{ onDestroy(ctx){ return cardGunnerDestroyedFromFieldS03U113(ctx); } }
});

/* =========================================================================
   【スキドレギアバレー】関連
   ========================================================================= */

/* ---- テラ・フォーミング ---- */
defineScript("テラ・フォーミング", {
  type:"spell", priority:1,
  blocksIfNoDeckToHand:true,    // S03-U01: ライオウ適用中は発動できない（KONAMI Q&A）
  condition(ctx){
    if(!fieldSpellsInDeck(ctx.player).length){
      ctx.reason = "デッキにフィールド魔法がありません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    done([]);
  },
  resolve(ctx){
    const lock=deckToHandLockReasonV32(ctx.player);
    if(lock){ logIt(gameState, `テラ・フォーミング：${lock}`); return; }
    const t = fieldSpellsInDeck(ctx.player);
    if(t.length) API.requestChoice({player:ctx.player, kind:'card', title:"テラ・フォーミング：手札に加えるフィールド魔法",
      candidates:t, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-search',args:{player:ctx.player,reason:'テラ・フォーミング'}}, meta:{scriptName:'テラ・フォーミング'}});
  }
});
function fieldSpellsInDeck(p){
  return API.pileCards(p,'deck',x=>x.db.k==='s' && x.db.sub==='フィールド');
}

/* ---- 墓守の司令官 ----
   手札から墓地へ捨てて、デッキから「王家の眠る谷－ネクロバレー」1枚を手札に加える。 */
defineScript("墓守の司令官", {
  type:"monster", priority:1,
  blocksIfNoDeckToHand:true,   // S03-U05: ライオウ適用中は発動できない
  activateFrom:["hand"],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = "手札から捨てて発動します"; return false; }
    if(!necrovalleyInDeck(ctx.player).length){
      ctx.reason = "デッキに「王家の眠る谷－ネクロバレー」がありません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.discard(ctx.player, ctx.index, "墓守の司令官（コスト）");
    done(true);
  },
  resolve(ctx){
    const t = necrovalleyInDeck(ctx.player);
    if(t.length) API.searchDeck(ctx.player, t[0].index, "墓守の司令官");
  },
  afterResolve(){}
});
function necrovalleyInDeck(p){
  return API.pileCards(p,'deck',x=>x.db.n==='王家の眠る谷－ネクロバレー');
}

/* ---- 王家の眠る谷－ネクロバレー ----
   ① フィールドの「墓守」モンスターの攻守が500アップする。
   ② 墓地のカードを除外できず、墓地のカードへ及ぶ効果は無効化され適用されない。 */
defineScript("王家の眠る谷－ネクロバレー", {
  continuous:{
    scope:'allMonsters', from:['field'],
    apply(target){
      return String(dbOf(target).n||'').indexOf('墓守') >= 0 ? {atk:500, def:500} : null;
    },
    graveLock(){ return true; }
  }
});

/* =========================================================================
   ネクロバレーの墓地ロック
   公式裁定にもとづき、次の2つを分けて判定する。

   ① お互いに墓地のカードを除外できない
      効果・コスト・召喚条件のいずれであっても除外できない。

   ② 「墓地のカードへ及ぶ効果」は無効化され、適用されない
      ここでいう「墓地のカードへ及ぶ効果」とは
        ・墓地に存在するカードが墓地から離れる効果（蘇生・サルベージ・デッキ戻し）
        ・墓地のカードの種族／属性を変更する効果
      を指す。**効果による処理のみ**が対象で、コストや召喚条件による
      墓地からの移動は（除外を除いて）無効化されない。

   無効化されないもの
      ・墓地のカードを参照するだけの効果
      ・種族／属性以外を変える効果（カード名扱い・通常モンスター扱いなど）
      ・効果を無効にするだけの効果
      ・墓地以外にも及ぶ効果の、墓地以外の部分（トリシューラの手札・場への除外など）

   ③ 【1103当時裁定】墓地で発動する効果は無効化されない
      「墓地のカードに及ぶ効果」とは、他の場所にあるカードが墓地のカードへ
      作用する効果を指す。墓地のカード自身が墓地で発動する効果は
      「墓地で発動する効果」であり、この制限を受けない。
        例）暗黒界の龍神 グラファ／暗黒界の尖兵 ベージ／暗黒界の武神 ゴルド／
            ゾンビキャリア／グローアップ・バルブ／マシンナーズ・フォートレス
      これは後年の裁定変更で「墓地から離れる効果」として扱われるようになったが、
      1103環境では当時の裁定に従い、墓地からの自己特殊召喚などができる。
      ※ ただし①の除外は別条項なので、墓地で発動する効果であっても
        墓地のカードを除外することはできない（馬頭鬼・スポーアなど）。
   ========================================================================= */

/* 1103当時裁定を使うか。false にすると現行裁定（墓地で発動する効果も止まる）になる。 */
const RULING_1103_GRAVE_ACTIVATION = true;

/* ネクロバレー等の墓地ロックが適用されているか */
function necrovalleyLocked(){
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.graveLock;
    if(typeof f !== 'function') return false;
    try{ return !!f(); }catch(e){ return false; }
  });
}

/* スクリプト処理のどの段階にいるか。コストと効果で扱いが変わる。 */
let SCRIPT_PHASE = null;      // 'cost' | 'resolve' | null
/* いま発動しているスクリプトがどのゾーンから発動したか。
   'grave' なら「墓地で発動する効果」として扱う。 */
let SCRIPT_ZONE = null;

/* 墓地のカードを動かせるか判定する。
   kind: 'banish'（除外）| 'leave'（蘇生・サルベージ・デッキ戻し）
   戻り値 true なら止められている。 */
/* S03-U131: DUEL のチェーン解決（resolveOnePreparedLinkV27）では SCRIPT_PHASE／SCRIPT_ZONE／ACTIVE_SCRIPT が設定されない
   （MANUAL の runScript だけが設定する）ため、ネクロバレーがあっても蘇生・サルベージ・デッキ戻しが止まらなかった
   （除外だけは止まっていた）。解決中のチェーンブロック RESOLVING_LINK_S03（S03-U22、解決中の選択の後も次のブロックの
   解決開始かチェーンの終了まで保持）を「効果の解決中」として同じ規則で判定する。 */
function graveMoveBlocked(zone, kind){
  if(zone !== 'grave') return false;
  if(!necrovalleyLocked()) return false;
  const linkS03 = (!ACTIVE_SCRIPT && typeof RESOLVING_LINK_S03!=='undefined') ? RESOLVING_LINK_S03 : null;
  const scriptS03 = ACTIVE_SCRIPT || (linkS03 && linkS03.name ? CARD_SCRIPTS[linkS03.name] : null);
  if(scriptS03 && scriptS03.ignoresNecrovalley) return false;
  // 除外はコスト・召喚条件でも不可
  if(kind === 'banish') return true;
  // それ以外は「効果による処理」のみ無効化される
  const resolving = SCRIPT_PHASE === 'resolve' || (!!linkS03 && SCRIPT_PHASE !== 'cost');
  if(!resolving) return false;
  // 1103当時裁定：墓地で発動する効果は「墓地のカードに及ぶ効果」ではない
  const fromZone = SCRIPT_PHASE === 'resolve' ? SCRIPT_ZONE : (linkS03 && linkS03.from);
  if(RULING_1103_GRAVE_ACTIVATION && fromZone === 'grave') return false;
  return true;
}

/* 止められたことを伝える */
function reportGraveLock(kind){
  const jp = kind === 'banish'
    ? "ネクロバレー：墓地のカードは除外できません"
    : "ネクロバレー：墓地のカードに及ぶ効果は適用されません";
  trace(jp, false);
  logIt(gameState, jp);
  showToast(jp);
}

/* ---- 禁じられた聖杯 ----
   フィールドの表側モンスター1体を対象。ターン終了時まで攻撃力400アップし、
   効果は無効化される。 */
defineScript("禁じられた聖杯", {
  type:"spell", priority:2, quickEffect:true, targets:true,
  condition(ctx){
    if(!API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'}).length){
      ctx.reason = "表側表示のモンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("禁じられた聖杯：対象のモンスター",
      API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up'}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t){ API.log("対象が場にないため不発"); return; }
    API.modAtk(t, 400, 0, 'endTurn', '禁じられた聖杯');
    API.setCardFlag({card:t.card},'negatedUntilTurn',gameState.turn,'禁じられた聖杯',{silent:true});
    API.log(`${labelOf(t.card)} の効果はターン終了時まで無効`);
  }
});

/* ---- 歯車街 ----
   ② 破壊され墓地へ送られた時、手札・デッキ・墓地から
      「アンティーク・ギア」モンスター1体を選んで特殊召喚する。 */
defineScript("歯車街", {
  auditNote:"②の特殊召喚のみ実装。リリース軽減は tributesNeeded 側で処理",
  type:"spell", priority:1,
  activateFrom:["grave"],
  condition(ctx){
    if(ctx.zone !== 'grave'){ ctx.reason = "破壊され墓地へ送られた時に発動します"; return false; }
    if(!gearTownTargets(ctx.player).length){
      ctx.reason = "「アンティーク・ギア」モンスターがいません"; return false;
    }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard("歯車街：特殊召喚する「アンティーク・ギア」",
      gearTownTargets(ctx.player), t=>done([t]), "手札・デッキ・墓地から選べます");
  },
  resolve(ctx){
    const t = ctx.selectedTargets[0];
    if(!t) return;
    API.specialSummon(ctx.player, t.zone, t.index, 'atk', "歯車街");
  },
  afterResolve(){}
});
/* 「アンティーク・ギア」＝カード名に「古代の機械」を含むモンスター */
function gearTownTargets(p){
  const hit = x => x.db.k==='m' && !x.db.ex && String(x.db.n||'').indexOf('古代の機械')>=0;
  return [].concat(
    API.pileCards(p,'hand',hit),
    API.pileCards(p,'deck',hit),
    API.pileCards(p,'grave',hit));
}

/* ---- 魔宮の賄賂 ----
   相手が魔法・罠カードを発動した時、その発動を無効にし破壊する。
   その後、相手はデッキから1枚ドローする。 */
/* S03-U192 (text): 「相手が魔法・罠カードを発動した時に発動できる。その発動を無効にし破壊する。相手はデッキから1枚ドローする。」 — a Counter
   Trap on the opponent's chain link (a card activation: link.cardActivationS03, not the effect of a face-up card). Before, it targeted any
   opponent Spell / Trap on the field at any time and "negated" that card. */
function bribeLinkS03(ctx){
  const e=ctx.event||{};
  if(e.player!==ctx.opponent || (e.kind!=='spell' && e.kind!=='trap')) return null;
  const l=(gameState.chain||[])[Number(e.chainLink)-1];
  return (l && l.cardActivationS03===true && l.player===ctx.opponent) ? l : null;
}
defineScript("魔宮の賄賂", {
  type:"trap", priority:3,
  condition(ctx){
    if(!bribeLinkS03(ctx)){ ctx.reason = "相手が魔法・罠カードを発動した時に発動します"; return false; }
    return true;
  },
  resolve(ctx){
    API.negateChainLink(ctx.event, 'activation', '魔宮の賄賂', true);
    API.draw(ctx.opponent, 1, "魔宮の賄賂（相手がドロー）");
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!bribeLinkS03(ctx); } }
});
declareActivationResponseS03(['魔宮の賄賂']);   /* a chain response to the activation (engine/1P), not a late trigger */

/* ---- サイバー・ドラゴン ----
   相手フィールドにモンスターが存在し、自分フィールドにモンスターが存在しない場合、
   手札から特殊召喚できる。これはチェーンに乗る効果発動ではなく特殊召喚手順として扱う。 */
function cyberDragonSummonCondition(ctx){
  if(ctx.zone !== 'hand'){ ctx.reason = "手札から特殊召喚します"; return false; }
  if((API.me(ctx).mz||[]).length){
    ctx.reason = "自分フィールドにモンスターが存在する場合は特殊召喚できません"; return false;
  }
  if(!(API.foe(ctx).mz||[]).length){
    ctx.reason = "相手フィールドにモンスターが存在しません"; return false;
  }
  return true;
}
defineScript("サイバー・ドラゴン", {
  type:"monster", priority:1,
  summonProcedure:{
    from:'hand', positions:['atk','def'], condition:cyberDragonSummonCondition
  },
  /* MANUAL/旧処理との互換用。DUELモードでは summonProcedure が優先される。 */
  timing:["free"],
  condition:cyberDragonSummonCondition,
  resolve(ctx){ API.specialSummon(ctx.player,'hand',ctx.index,'atk',"サイバー・ドラゴン"); },
  afterResolve(){}
});

/* ---- 王虎ワンフー ----
   攻撃力1400以下のモンスターが召喚・特殊召喚に成功した時、そのモンスターを破壊する。 */
/* S03-U193 (text): 「このカードがフィールド上に表側表示で存在する限り、攻撃力1400以下のモンスターが召喚・特殊召喚に成功した時、その攻撃力
   1400以下のモンスターを破壊する。」 — the summoned monster(s), not any monster with 1400 or less (before: a chosen target among every such
   monster on the field). Forced, not targeting. */
function wanghuSummonedS03(ctx){
  const e = ctx.event || {};
  const uids = Array.isArray(e.uids) ? e.uids.slice() : (e.uid != null ? [e.uid] : (e.card && e.card.uid != null ? [e.card.uid] : []));
  return uids.map(u=>findCardByUid(u)).filter(h=>h && h.zone==='mz' && h.card.face==='up' && h.card!==ctx.card && curATK(h.card)<=1400);
}
defineScript("王虎ワンフー", {
  onOtherSummon:true,           // どちらの召喚にも反応する
  type:"monster", priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || ctx.card.face !== 'up'){ ctx.reason = "フィールドに表側表示で存在する場合に適用されます"; return false; }
    if(!wanghuSummonedS03(ctx).length){ ctx.reason = "召喚・特殊召喚された攻撃力1400以下のモンスターがいません"; return false; }
    return true;
  },
  resolve(ctx){
    const me = findCardByUid(ctx.card.uid);
    if(!me || me.zone!=='mz' || me.card.face!=='up') return;
    wanghuSummonedS03(ctx).slice().reverse().forEach(h=>{ const now=findCardByUid(h.card.uid); if(now && now.zone==='mz') API.destroy(now, "王虎ワンフー"); });
  },
  afterResolve(){},
  passive:{
    onNormalSummon(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && wanghuSummonedS03(ctx).length>0; },
    onSpecialSummon(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && wanghuSummonedS03(ctx).length>0; }
  }
});
function wanghuTargets(){
  return API.fieldCards({zone:'mz',
    filter:x=>x.card && x.card.face==='up' &&
              String(x.db.n||'') !== '王虎ワンフー' && curATK(x.card) <= 1400});
}

/* ---- Sin サイバー・エンド・ドラゴン ----
   ② このカードがある限り、他の自分のモンスターは攻撃宣言できない。
   ③ フィールド魔法カードが表側表示で存在しない場合、このカードは破壊される。 */
defineScript("Sin サイバー・エンド・ドラゴン", {
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    cannotAttack(target, self){ return target !== self; }   // 他のモンスターは攻撃できない
  }
});
/* フィールド魔法がない「Sin」モンスターを列挙する（破壊が必要な状態） */
function sinNeedsField(){
  const anyField = gameState.players.some(P=>P.field && P.field.face==='up');
  if(anyField) return [];
  return API.fieldCards({zone:'mz',
    filter:x=>x.card && x.card.face==='up' && String(x.db.n||'').indexOf('Sin')===0});
}

/* ---- 古代の機械巨竜 ----
   ② このカードが攻撃する場合、相手はダメージステップ終了時まで
      魔法・罠カードを発動できない。 */
defineScript("古代の機械巨竜", {
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    lockOpponentSpells(target, self){
      const b = gameState.battle;
      if(!b) return false;
      return (gameState.players[b.player].mz||[])[b.atkIdx] === self;
    }
  }
});
/* 攻撃中の「古代の機械」により、相手が魔法・罠を発動できない状態か */
function antiqueGearLock(){
  return continuousSources().some(src=>{
    const f = src.sc.continuous && src.sc.continuous.lockOpponentSpells;
    if(typeof f !== 'function') return false;
    try{ return !!f(src.card, src.card); }catch(e){ return false; }
  });
}

/* ---- キメラテック・フォートレス・ドラゴン ----
   元々の攻撃力は、融合素材としたモンスターの数×1000になる。 */
defineScript("キメラテック・フォートレス・ドラゴン", {
  cannotFusionMaterialS03:true,   /* S03-U174: 「このカードは融合素材にできない」 (engine/1ZW) */
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self){
      const n = self.fusionMaterialCount || 0;
      return n ? { setBaseAtk:n*1000, setBaseDef:0 } : null;
    }
  }
});

/* ---- E・HERO エスクリダオ ----
   攻撃力は、自分の墓地の「E・HERO」モンスターの数×100アップする。 */
defineScript("E・HERO エスクリダオ", {
  continuous:{
    scope:'self', from:['mz'],
    apply(target, self, info){
      const n = (gameState.players[info.p].grave||[]).filter(
        c=>c && dbOf(c).k==='m' && String(dbOf(c).n||'').indexOf('E・HERO')>=0).length;
      return n ? { atk:n*100 } : null;
    }
  }
});

/* ---- 超融合 ----
   手札を1枚捨てて発動。自分・相手フィールドから融合素材を墓地へ送り、
   その融合モンスターをEXデッキから融合召喚する。 */
defineScript("超融合", {
  type:"spell", priority:2, quickEffect:true,
  condition(ctx){
    if(!API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card).length){
      ctx.reason = "捨てる手札がありません"; return false;
    }
    if(!superPolyOptions(ctx.player).length){
      ctx.reason = "素材が揃った融合モンスターがいません"; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.selectCard("超融合：コストで捨てる手札",
      API.pileCards(ctx.player,'hand',x=>x.card!==ctx.card), x=>{
        API.discard(ctx.player, x.index, "超融合（コスト）");
        done(true);
      });
  },
  /* S03-U124: 超融合は対象を取らない。融合モンスターと素材は解決時に選ぶ（以前は発動時に選び、素材は常に最初の組み合わせ
     combos[0]（最大5通りしか探さない）に固定されていた — 相手のモンスターを素材にする選択ができなかった）。 */
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    const opts = superPolyOptions(ctx.player);
    if(!opts.length){ API.log("超融合：融合召喚できるモンスターがいない"); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:"超融合：融合召喚する融合モンスター", candidates:opts.map(o=>o.ex),
      min:1, max:1, cancelable:false, resume:{handler:'s03u124.superpoly-ex', args:{player:ctx.player}}, meta:{scriptName:"超融合"}});
  }
});
/* 素材の組み合わせを uid で表す（解決時の選択・再検証用） */
function superPolyComboUidsS03(combo){ return combo.map(m=>ensureCardUid(gameState, m.card)); }
function superPolyComboLabelS03(p, combo){
  return combo.map(m=>`${cardName(m.card)}（${m.p===p?'自分':'相手'}）`).join(' ＋ ');
}
API.registerChoiceHandler('s03u124.superpoly-ex', (answer, args)=>{
  const picked = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  if(!picked) return;
  const exUid = ensureCardUid(gameState, picked.card);
  const opt = superPolyOptions(args.player).find(o=>ensureCardUid(gameState, o.ex.card)===exUid);
  if(!opt){ API.log("超融合：融合召喚できなくなった"); return; }
  const next = {player:args.player, exUid};
  if(opt.combos.length===1){ superPolyCommitS03(next, superPolyComboUidsS03(opt.combos[0])); return; }
  API.requestChoice({player:args.player, kind:'declare', title:`超融合：${cardName(picked.card)} の融合素材`,
    candidates:opt.combos.map((cb,k)=>({key:'m'+k, label:superPolyComboLabelS03(args.player, cb), value:superPolyComboUidsS03(cb).join(',')})),
    min:1, max:1, cancelable:false, resume:{handler:'s03u124.superpoly-mats', args:next}, meta:{scriptName:"超融合"}});
});
API.registerChoiceHandler('s03u124.superpoly-mats', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  const uids = String((c && c.value) || '').split(',').map(Number).filter(Number.isFinite);
  if(uids.length) superPolyCommitS03(args, uids);
});
/* 再検証（素材がまだフィールドにあり、その組み合わせが今も有効）してから素材を墓地へ送り、融合召喚する */
function superPolyCommitS03(args, uids){
  const p = args.player, P = gameState.players[p];
  const ex = findCardByUid(args.exUid);
  if(!ex || ex.p!==p || ex.zone!=='ex'){ API.log("超融合：融合モンスターがエクストラデッキにない"); return; }
  /* S03-U133: 融合召喚する表示形式（表側攻撃／表側守備）をプレイヤーが選ぶ（以前は常に攻撃表示） */
  if(args.pos!=='atk' && args.pos!=='def'){
    API.requestChoice({player:p, kind:'declare', title:`超融合：${cardName(ex.card)} の表示形式`, candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}],
      min:1, max:1, cancelable:false, resume:{handler:'s03u133.superpoly-pos', args:Object.assign({}, args, {mats:uids})}, meta:{scriptName:"超融合"}});
    return;
  }
  const opt = superPolyOptions(p).find(o=>ensureCardUid(gameState, o.ex.card)===args.exUid);
  const valid = opt && opt.combos.some(cb=>{ const u = superPolyComboUidsS03(cb); return u.length===uids.length && uids.every(x=>u.indexOf(x)>=0); });
  if(!valid){ API.log("超融合：選んだ融合素材がそろっていない"); return; }
  const n = uids.length;
  uids.map(u=>findCardByUid(u)).filter(Boolean)
    .sort((a,b)=> (b.p-a.p) || (b.index-a.index))
    .forEach(h=>API.sendToGrave(h, "超融合（素材）"));
  const now = findCardByUid(args.exUid);
  if(!now || now.zone!=='ex') return;
  API.specialSummon(p, 'ex', now.index, args.pos, "超融合", null, {summonKind:'fusion'});
  const put = findCardByUid(args.exUid);
  if(put && put.zone==='mz') API.setCardFlag(put, 'fusionMaterialCount', n, '超融合', {silent:true});   // キメラテックの元々の攻撃力に使う
}
API.registerChoiceHandler('s03u133.superpoly-pos', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  superPolyCommitS03(Object.assign({}, args, {pos:(c && c.value)==='def' ? 'def' : 'atk'}), args.mats || []);
});
/* 自分・相手フィールドの表側モンスターから融合できる組み合わせを探す */
function superPolyOptions(p){
  const P = gameState.players[p];
  const pool = [];
  API.fieldCards({zone:'mz', filter:x=>x.card && x.card.face==='up' && !cannotFusionMaterialS03(x.card)}).forEach(x=>{   /* S03-U174 */
    pool.push({i:pool.length, p:x.p, zone:'mz', index:x.index,
               card:x.card, db:x.db, lv:curLV(x.card)});
  });
  const out = [];
  (P.ex||[]).forEach((c,ei)=>{
    const db = dbOf(c);
    if((db.st||[]).indexOf('融合') < 0) return;
    const spec = parseMaterialSpec(db);
    if(!spec || !spec.slots) return;
    const combos = fusionCombosS03(pool, spec, db, 60);   /* S03-U124: was 5 — options beyond the 5th were never offered; S03-U134: with substitutes */
    if(combos.length) out.push({ex:{p, zone:'ex', index:ei, card:c, db}, combos});
  });
  return out;
}
