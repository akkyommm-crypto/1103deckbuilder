/* S03-U530: テュアラティン（1103対象の未実装カード。carddata のテキスト）。

   テュアラティン（効果・星8・天使・光・攻2800/守2500）
     相手のバトルフェイズ時に発動する事ができる。
     バトルフェイズ開始時に自分フィールド上にモンスターが2体以上存在し、それらのモンスターが
     1度のバトルフェイズ中に戦闘によって全て破壊され墓地へ送られた時、このカードを手札から特殊召喚する事ができる。
     この効果で特殊召喚に成功した時、属性を1つ宣言し、フィールド上に表側表示で存在する宣言した属性の
     モンスターを全て破壊する。
     その後、このカードがフィールド上に表側表示で存在する限り、相手は宣言された属性のモンスターを
     召喚・特殊召喚する事ができない。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-6262167F5175 2 体の場合、2 体目が破壊されたダメージステップ内に特殊召喚できる /
     WIKI-4CDE65C5B0A5 3 体の場合は最後の 1 体が破壊された後
       → 「バトルフェイズ開始時に居たモンスターが全て戦闘で破壊され墓地にある」事を誘発の条件にする
       （engine/00 の SET_PHASE が取るバトルフェイズ開始時の記録 gs.bpStartS03 を読む）。
     WIKI-323A76C20CAD 「戦闘で破壊され墓地に送られる」に反するモンスターが 1 体でもいたら特殊召喚できない
       → 記録した uid のすべてが「戦闘で破壊された記録（gs.battleKillsS03）」にあり、かつ今墓地にある事を見る。
     WIKI-ED7E3C19B11C（09/12/13）バトルフェイズ開始時に手札に存在しない場合は、その後に手札へ加わっても
       特殊召喚できない → 開始時の手札の記録を見る。
     WIKI-11583ED612D9 宣言した属性にこのカード自身が含まれる場合、自分も破壊される。
     WIKI-F2CBC0269F5E（08/12/26）神属性も宣言できる。
     WIKI-4DCA769F6F52（10/05/07）召喚封印の効果はコントロールを奪われた場合、その時のコントローラーから見た
       「相手」に適用される → 封印は「このカードのコントローラーの相手」に対して働く。
     WIKI-51F3EEE1E826 同時に誘発する他の効果（《シャインエンジェル》）とは好きな順番でチェーンを組める
       → 通常の誘発として積む（engine の SEGOC のまま）。 */

const U530_ATTRS_S03 = Object.freeze(['闇', '光', '地', '水', '炎', '風', '神']);

/* バトルフェイズ開始時に居た自分のモンスターが「全て」戦闘で破壊され墓地にあるか */
function u530AllBattleKilledS03(p){
  const rec = (typeof gameState !== 'undefined' && gameState) ? gameState.bpStartS03 : null;
  if(!rec || Number(rec.turn) !== Number(gameState.turn)) return false;
  const uids = (rec.mz && rec.mz[p]) || [];
  if(uids.length < 2) return false;
  /* 「戦闘によって破壊され墓地へ送られた」は破壊の記録（engine/1M の destroyedThisTurnV30、
     battle:true）で見る。battleKillsS03 は「破壊した側」の記録なので使わない。 */
  const log = Array.isArray(gameState.destroyedThisTurnV30) ? gameState.destroyedThisTurnV30 : [];
  return uids.every(u=>{
    const hit = log.some(x=>x && x.battle === true && x.uid === u && Number(x.turn) === Number(gameState.turn));
    if(!hit) return false;                          /* 戦闘で破壊された記録が無い */
    const h = findCardByUid(u);
    return !!h && h.zone === 'grave';               /* 今、墓地にある */
  });
}
/* WIKI-ED7E3C19B11C: バトルフェイズ開始時に手札に存在したか */
function u530InHandAtBpStartS03(ctx){
  const rec = (typeof gameState !== 'undefined' && gameState) ? gameState.bpStartS03 : null;
  if(!rec || Number(rec.turn) !== Number(gameState.turn)) return false;
  const uids = (rec.hand && rec.hand[ctx.player]) || [];
  return !!ctx.card && ctx.card.uid != null && uids.indexOf(ctx.card.uid) >= 0;
}
function u530SummonedByOwnEffectS03(ctx){
  const e = ctx.event || {};
  const self = e.card === ctx.card || (Array.isArray(e.cards) && e.cards.indexOf(ctx.card) >= 0)
               || (e.uid != null && ctx.card && e.uid === ctx.card.uid);
  return !!self && ctx.zone === 'mz' && !!ctx.card && !!ctx.card.u530PendingS03;
}

/* 宣言 → 宣言した属性のモンスターを全て破壊 → 封印の印を残す */
API.registerChoiceHandler('s03u530.declare-attr', (answer, args)=>{
  const picked = (answer && answer.cards || [])[0];
  const attr = picked ? String(picked.value) : '';
  const me = (args && args.sourceUid != null) ? findCardByUid(args.sourceUid) : null;
  if(attr){
    /* 封印はこのカードが表側で残っている限り（自分も破壊される場合は印ごと消える）。 */
    if(me && me.zone === 'mz'){
      API.setCardFlag(me, 'u530LockAttrS03', attr, 'テュアラティン（宣言した属性）', {silent:true});
      API.setCardFlag(me, 'u530PendingS03', null, 'テュアラティン', {silent:true});
    }
    API.log(`テュアラティン：${attr}属性を宣言`);
    /* WIKI-11583ED612D9: 自分自身も宣言した属性なら破壊される。 */
    const pool = API.fieldCards({zone:'mz', filter:x=>x.card.face === 'up'
      && (typeof hasAttributeV17 === 'function' ? hasAttributeV17(x.card, attr) : String(x.db.at || '') === attr)});
    pool.slice().forEach(t=>{
      const h = (t.card && t.card.uid != null) ? findCardByUid(t.card.uid) : null;
      if(h && h.zone === 'mz') API.destroy(h, 'テュアラティン');
    });
  }
  v49P1FinishSource(args);
});

defineUnifiedCardV4('テュアラティン', [{
  /* 相手のバトルフェイズ中、開始時に居た自分のモンスターが全て戦闘で破壊された時、手札から特殊召喚する */
  key:'hand-special', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onBattleDestroy'],
  condition(ctx){
    if(ctx.zone !== 'hand'){ ctx.reason = '手札から発動します'; return false; }
    if(gameState.phase !== 'battle' || gameState.activePlayer !== ctx.opponent){
      ctx.reason = '相手のバトルフェイズ中に発動します'; return false;
    }
    if(!u530InHandAtBpStartS03(ctx)){ ctx.reason = 'バトルフェイズ開始時に手札に存在しませんでした'; return false; }
    if(!u530AllBattleKilledS03(ctx.player)){
      ctx.reason = 'バトルフェイズ開始時の自分のモンスターが全て戦闘で破壊されていません'; return false;
    }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'hand' || h.p !== ctx.player) return;
    if(!hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', h.index, 'atk', 'テュアラティン');
    const now = locateCardAnyV4(ctx.card);
    /* 「この効果で特殊召喚に成功した時」の印（場を離れると消える） */
    if(now && now.zone === 'mz') API.setCardFlag(now, 'u530PendingS03', gameState.turn, 'テュアラティン', {silent:true});
  },
  afterResolve(){}
}, {
  /* この効果で特殊召喚に成功した時、属性を1つ宣言し、その属性のモンスターを全て破壊する */
  key:'declare-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u530SummonedByOwnEffectS03(ctx); },
  operation(ctx){
    /* WIKI-F2CBC0269F5E（08/12/26）: 神属性も宣言できる。 */
    v49P1Open(ctx, {kind:'declare', title:'テュアラティン：属性を宣言',
      candidates:U530_ATTRS_S03.map((v, i)=>({key:'a' + i, label:v, value:v})), min:1, max:1},
      's03u530.declare-attr', {reason:'テュアラティン'}, true);
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, activateFrom:['hand'], includesSpecialSummon:true,
  blocksIfNoSpecialSummon(ctx){ return !!ctx && ctx.zone === 'hand'; },
  /* その後、このカードが表側表示で存在する限り、相手は宣言された属性のモンスターを召喚・特殊召喚できない
     （WIKI-4DCA769F6F52 10/05/07: コントロールを奪われた場合はその時のコントローラーから見た相手）。 */
  summonLockS03(i){
    if(!i || !i.src || i.src.face !== 'up') return false;
    const attr = i.src.u530LockAttrS03;
    if(!attr) return false;
    if(i.p === i.srcPlayer) return false;
    if(i.kind !== 'normal' && i.kind !== 'special') return false;
    return String((i.db && i.db.at) || '') === String(attr);
  },
  passive:{
    onBattleDestroy(ctx){
      return ctx.zone === 'hand' && gameState.phase === 'battle'
        && gameState.activePlayer === ctx.opponent
        && u530InHandAtBpStartS03(ctx) && u530AllBattleKilledS03(ctx.player);
    },
    onSpecialSummon(ctx){ return u530SummonedByOwnEffectS03(ctx); }
  }
});
