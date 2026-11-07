/* S03-U535: ドリル・ウォリアー（1103対象の未実装カード。carddata のテキスト）。

   ドリル・ウォリアー（シンクロ・効果・星6・戦士・地・攻2400/守2000）
     「ドリル・シンクロン」＋チューナー以外のモンスター1体以上
     ①1ターンに1度、自分のメインフェイズ時に発動できる。このカードの攻撃力を半分にし、
       このターンこのカードは相手プレイヤーに直接攻撃できる。
     ②1ターンに1度、自分のメインフェイズ時に発動できる。手札を1枚捨ててこのカードをゲームから除外する。
       次の自分のスタンバイフェイズ時、この効果で除外したこのカードを自分フィールド上に特殊召喚する。
       その後、自分の墓地からレベル2以下のモンスター1体を選択して手札に加える事ができる。

   当時の裁定（この実装の根拠。推測ではない）
     WIKI-82A9719F4D3B（09/11/14）効果分類: ①と②は起動効果、「自身を特殊召喚しモンスターを手札に加える」は
       **1 つの誘発効果** → 除外されたこのカードのスタンバイフェイズの強制の誘発効果 1 つにする。
     WIKI-0F67AE89F61B（09/11/14）半分になった攻撃力は、裏側になる・場を離れる等が無ければそのまま
       → 場を離れるまで続く増減（until 'leave'）。
     WIKI-46DB70970EAE（09/12/02）直接攻撃できるようになるだけで、モンスターへの攻撃も選べる
       → 共通の直接攻撃の許可（engine/15 の BATTLE_GRANT_V6 'direct'）を与えるだけにする。
     WIKI-BB138075AD8E（09/11/14）手札を捨てるのは**効果処理**（コストではない）/
     WIKI-48764DEEA4C6（10/06/10）捨てるのと除外は同時 → 同じ処理の中で続けて行う。
     WIKI-0BCABB21D0F1（09/11/26）解決時に手札が 0 枚なら除外の効果は適用されない。
     WIKI-22D4985AF8EC（10/06/10）《王宮の鉄壁》等で除外できない場合も、手札を捨てる処理は適用される
       → 先に捨て、除外の可否は engine の判定に任せ、失敗しても捨てを戻さない。
     WIKI-2D89CC05617A（10/06/10）捨てたカードの効果はタイミングを逃さない → 共通の捨てる処理のまま。
     WIKI-C96B7B51137A（09/11/14）特殊召喚と回収は 1 つの効果処理（《奈落の落とし穴》等はタイミングを逃す）。
     WIKI-C8833988CC5F（09/11/14）特殊召喚できなかった場合は回収できない → 同じ処理の中で順に判定する。
     WIKI-B2BC6877BD8D（10/06/16）回収は**対象を取らない** → 解決時に選ぶ（targets は宣言しない）。
     WIKI-A01D4C51D176（11/06/24）この効果で特殊召喚された後は《シンクロキャンセル》で素材を出せない
       → シンクロ素材の記録と《シンクロキャンセル》自体が未実装なので、報告書の未対応に書いた。 */

function u535UsedS03(card, key){ return Number(card && card[key]) === Number(gameState.turn); }
function u535GraveLowS03(p){
  return API.pileCards(p, 'grave', x=>x.db.k === 'm' && (x.db.lv || 99) <= 2);
}

/* 回収（対象を取らない。解決の中で選ぶ） */
API.registerChoiceHandler('s03u535.salvage', (answer, args)=>{
  const picked = (answer && !answer.cancelled) ? v49P1ChoiceCards(answer)[0] : null;
  const h = picked && locateCardAnyV4(picked.card);
  if(h && h.zone === 'grave' && h.p === args.player) API.returnToHand(h, 'ドリル・ウォリアー');
  v49P1FinishSource(args);
});

defineUnifiedCardV4('ドリル・ウォリアー', [{
  /* ①攻撃力を半分にして、このターン直接攻撃できる */
  key:'half-direct', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(u535UsedS03(ctx.card, 'u535HalfTurnS03')){ ctx.reason = 'この効果はこのターン使用しています'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.setCardFlag(me, 'u535HalfTurnS03', gameState.turn, 'ドリル・ウォリアー（1ターンに1度）', {silent:true});
    /* WIKI-0F67AE89F61B: 場を離れるまで半分のまま */
    const cur = API.curAtk(me);
    const cut = Math.floor(Number(cur) / 2);
    if(cut > 0) API.modAtk(me, -cut, 0, 'leave', 'ドリル・ウォリアー（攻撃力半分）');
    /* WIKI-46DB70970EAE: 直接攻撃できるようになるだけ（必ず直接攻撃する必要はない） */
    API.grantDirectAttack(me);
    API.log('ドリル・ウォリアー：攻撃力を半分にし、このターン直接攻撃できる');
  },
  afterResolve(){}
}, {
  /* ②手札を1枚捨ててこのカードを除外する */
  key:'banish-self', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone !== 'mz' || !ctx.card || ctx.card.face !== 'up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(u535UsedS03(ctx.card, 'u535BanishTurnS03')){ ctx.reason = 'この効果はこのターン使用しています'; return false; }
    if(!(API.me(ctx).hand || []).length){ ctx.reason = '捨てる手札がありません'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz') return;
    API.setCardFlag(me, 'u535BanishTurnS03', gameState.turn, 'ドリル・ウォリアー（1ターンに1度）', {silent:true});
    const hand = (API.me(ctx).hand || []).map((c, i)=>({p:ctx.player, zone:'hand', index:i, card:c, db:dbOf(c)}));
    /* WIKI-0BCABB21D0F1: 解決時に手札が 0 枚なら除外の効果は適用されない */
    if(!hand.length){ API.log('ドリル・ウォリアー：捨てる手札が無いため除外しない'); return; }
    /* WIKI-BB138075AD8E / WIKI-48764DEEA4C6: 捨てるのは効果処理で、除外と同時 */
    API.selectCard('ドリル・ウォリアー：捨てる手札', hand, h=>{
      API.discard(ctx.player, h.index, 'ドリル・ウォリアー');
      const now = locateCardAnyV4(ctx.card);
      if(!now || now.zone !== 'mz') return;
      /* WIKI-22D4985AF8EC: 除外できない場合でも捨てる処理は適用済み（戻さない） */
      API.banish(now, 'ドリル・ウォリアー');
      const after = locateCardAnyV4(ctx.card);
      if(after && after.zone === 'banish')
        API.setCardFlag(after, 'u535AwayS03', gameState.turn, 'ドリル・ウォリアー（この効果で除外）', {silent:true});
    });
  },
  afterResolve(){}
}, {
  /* 次の自分のスタンバイフェイズ時、この効果で除外したこのカードを特殊召喚し、その後レベル2以下を回収する
     （WIKI-C96B7B51137A: ここまでが 1 つの効果処理） */
  key:'standby-return', type:EFFECT_TYPE.TRIGGER, range:LOCATION.REMOVED, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){
    if(ctx.zone !== 'banish'){ ctx.reason = '除外されている時の効果です'; return false; }
    if(ctx.player !== gameState.activePlayer){ ctx.reason = '自分のスタンバイフェイズに発動します'; return false; }
    if(ctx.card.u535AwayS03 == null){ ctx.reason = 'この効果で除外されたカードではありません'; return false; }
    if(Number(ctx.card.u535AwayS03) === Number(gameState.turn)){ ctx.reason = '次の自分のスタンバイフェイズに発動します'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone !== 'banish' || h.p !== ctx.player) return;
    if(!hasMonsterZoneSpace(ctx.player)){ API.log('ドリル・ウォリアー：モンスターゾーンに空きが無いため特殊召喚できない'); return; }
    const ok = API.specialSummon(ctx.player, 'banish', h.index, 'atk', 'ドリル・ウォリアー');
    const now = locateCardAnyV4(ctx.card);
    /* WIKI-C8833988CC5F: 特殊召喚できなかった場合は回収できない */
    if(!now || now.zone !== 'mz'){ API.log('ドリル・ウォリアー：特殊召喚できなかったため回収しない'); return; }
    const pool = u535GraveLowS03(ctx.player);
    if(!pool.length) return;
    /* WIKI-B2BC6877BD8D: 対象を取らない（解決時に選ぶ。「できる」なので取らない選択も可） */
    v49P1Open(ctx, {kind:'card', title:'ドリル・ウォリアー：手札に加えるレベル2以下のモンスター',
      candidates:pool, min:1, max:1, cancelable:true}, 's03u535.salvage', {}, true);
  },
  afterResolve(){}
}], {
  type:'monster', priority:1, timing:['mainPhase'],
  passive:{
    onStandbyPhase(ctx){
      return ctx.zone === 'banish' && ctx.player === gameState.activePlayer
        && ctx.card.u535AwayS03 != null && Number(ctx.card.u535AwayS03) !== Number(gameState.turn);
    }
  }
});
