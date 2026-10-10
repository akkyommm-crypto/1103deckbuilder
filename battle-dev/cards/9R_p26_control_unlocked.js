/* P26 Control primitive で解禁されたカード。
   engine は一切触らない。P26-A onControlChange / P26-B linkControlReturn /
   P26-C swapControl と、既存の P1 ChoiceRequest・P4 setcode・v22 Counter・
   v17 Characteristic だけで書く。

   独自の control duration は作らない。「表側表示で存在する間」は
   linkControlReturn の onFaceDown:true で表す（v9 の生存リンクに乗る）。
   コントロールの入れ替えは必ず swapControl 1 Action で行い、
   FX_CONTROL を 2 回撃つ書き方はしない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v26At(card){ return locateCardAnyV4(card); }
/* リバース効果の共通条件。自分自身が表側でモンスターゾーンにいること。 */
function v26FlipSelf(ctx){
  const h = v26At(ctx.card);
  return !!h && h.zone === 'mz' && h.card.face === 'up';
}
/* 相手フィールドの表側モンスターのうち、現在の属性が attr のもの。
   印刷された属性ではなく v17 の現在値で判定する。 */
function v26FoeAttrMonsters(foe, attr){
  return API.fieldCards({player:foe, zone:'mz',
    filter:x => x.card.face === 'up' && API.attrOf(x) === attr});
}
/* 手札を handle の形で並べる（デッキの一番下へ戻すコスト用） */
function v26HandCards(p){
  return gameState.players[p].hand.map((c,i) => ({p, zone:'hand', index:i, card:c, db:dbOf(c)}));
}
/* 自分フィールドの表側「ガスタ」モンスター（P4 authority。名前の部分一致は使わない） */
function v26OwnGusto(p){
  return API.fieldCards({player:p, zone:'mz',
    filter:x => x.card.face === 'up' && isSetCardV4(x.db, SETCODE.GUSTO)});
}
/* 相手フィールドの A カウンターが乗ったモンスター（v22） */
function v26FoeWithACounter(foe){
  return API.fieldCards({player:foe, zone:'mz',
    filter:x => API.countCounter(x, 'A') > 0});
}

/* =====================================================================
   1-6. 霊使い 6枚
   「①:このカードがリバースした場合、相手フィールドの◯属性モンスター1体を
     対象として発動する。このモンスターが表側表示で存在する間、
     そのモンスターのコントロールを得る。」

   「このモンスター」= 霊使い自身。よって
     ・霊使いがフィールドを離れた
     ・霊使いが裏側になった
   のどちらでもコントロールは戻る（P26-B の onFaceDown:true）。
   戻り先は linkControlReturn の既定（元の持ち主）に任せる。
   ===================================================================== */
function v26SpiritCaster(name, attr){
  defineUnifiedCardV4(name,[{
    key:'flip-take-control', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
    targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1, events:['onFlip'],
    condition(ctx){
      if(!v26FlipSelf(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
      if(!v26FoeAttrMonsters(ctx.opponent, attr).length){
        ctx.reason = '相手フィールドに' + attr + '属性モンスターがいません'; return false; }
      return true;},
    target(ctx,done){
      API.selectCard(name + '：コントロールを得る' + attr + '属性モンスター',
        v26FoeAttrMonsters(ctx.opponent, attr), t => done([t]));},
    operation(ctx){
      const me0 = v26At(ctx.card);
      if(!me0 || me0.zone !== 'mz' || me0.card.face !== 'up') return;
      const t = ctx.selectedTargets && ctx.selectedTargets[0];
      const h = t && resolveTarget(t);
      if(!h || h.zone !== 'mz' || h.p === ctx.player) return;
      /* 移動後に uid で捕まえ直すため、先に uid を確定させる */
      const uid = ensureCardUid(gameState, h.card);
      API.changeControl(h, ctx.player, name, null, me0);
      const moved = (uid != null) ? findCardByUid(uid) : null;
      const me = v26At(ctx.card);
      /* コントロールを得られなかった（ゾーンが一杯）場合は lease を張らない */
      if(!moved || moved.p !== ctx.player || moved.zone !== 'mz') return;
      if(!me || me.zone !== 'mz') return;
      API.linkControlReturn(moved, me, {onFaceDown:true, label:name + '：コントロールの返却'});},
    afterResolve(){}
  }],{type:'monster', priority:1, targets:true, forced:true,
      passive:{onFlip(ctx){ return ctx.zone === 'mz'; }}});
}
v26SpiritCaster('光霊使いライナ','光');
v26SpiritCaster('地霊使いアウス','地');
v26SpiritCaster('水霊使いエリア','水');
v26SpiritCaster('火霊使いヒータ','炎');
v26SpiritCaster('闇霊使いダルク','闇');
v26SpiritCaster('風霊使いウィン','風');

/* =====================================================================
   7. くノ一ウォリアー
   「フィールド上に表側表示で存在するこのカードのコントロールが移った時、
     コントローラーは手札をランダムに1枚捨てる。」
   P26-A の onControlChange をそのまま使う。自分自身の移動だけを拾う。
   「コントローラー」= 移った先の新しいコントローラー。
   ===================================================================== */
function v26KunoichiHit(ctx){
  const e = ctx.event || {};
  const h = v26At(ctx.card);
  if(!h || h.zone !== 'mz' || h.card.face !== 'up') return false;
  if(e.uid == null) return false;
  const moved = findCardByUid(e.uid);
  if(!moved || moved.card !== ctx.card) return false;
  return (e.toPlayer === 0 || e.toPlayer === 1);
}
defineUnifiedCardV4('くノ一ウォリアー',[{
  key:'control-change-random-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onControlChange'],
  condition(ctx){
    if(!v26KunoichiHit(ctx)) return false;
    return gameState.players[ctx.event.toPlayer].hand.length > 0;},
  operation(ctx){
    const to = ctx.event && ctx.event.toPlayer;
    if(to !== 0 && to !== 1) return;
    v80DiscardRandom(to, 1, 'くノ一ウォリアー', to);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onControlChange(ctx){ return ctx.zone === 'mz' && v26KunoichiHit(ctx); }}});

/* =====================================================================
   8. ダミー・ゴーレム
   「リバース:相手はコントロールしているモンスター1体を選択する。
     選択したモンスターとこのカードのコントロールを入れ替える。」
   選ぶのは相手なので ChoiceRequest の player を相手にする。
   入れ替えは P26-C の 1 Action（両方のゾーンが一杯でも成立する）。
   ===================================================================== */
API.registerChoiceHandler('p26ctl.golem-swap',(answer,args)=>{
  const picked = v49P1ChoiceCards(answer)[0];
  const golem = (args.golemUid != null) ? findCardByUid(args.golemUid) : null;
  const other = (picked && picked.card) ? locateCardAnyV4(picked.card) : null;
  if(golem && other && golem.zone === 'mz' && other.zone === 'mz' && golem.p !== other.p)
    API.swapControl(golem, other, args.reason, golem);
});
defineUnifiedCardV4('ダミー・ゴーレム',[{
  key:'flip-opponent-swap', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){
    if(!v26FlipSelf(ctx)) return false;
    return API.fieldCards({player:ctx.opponent, zone:'mz'}).length > 0;},
  operation(ctx){
    const me = v26At(ctx.card);
    if(!me || me.zone !== 'mz') return;
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz'});
    if(!pool.length) return;
    v49P1Open(ctx,{kind:'card', player:ctx.opponent,
      title:'ダミー・ゴーレム：コントロールを入れ替えるモンスター',
      candidates:pool, min:1, max:1},
      'p26ctl.golem-swap',
      {golemUid:ensureCardUid(gameState, ctx.card), reason:'ダミー・ゴーレム'}, false);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onFlip(ctx){ return ctx.zone === 'mz'; }}});

/* =====================================================================
   9. 亜空間ジャンプ装置（通常罠）
   「自分フィールド上モンスター1体と、相手フィールド上のAカウンターが乗った
     モンスター1体のコントロールを入れ替える。」
   A カウンターの判定は v22 の countCounter。入れ替えは P26-C。
   ===================================================================== */
defineUnifiedCardV4('亜空間ジャンプ装置',[{
  key:'swap-with-a-counter', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){
    if(!API.fieldCards({player:ctx.player, zone:'mz'}).length){
      ctx.reason = '自分フィールドにモンスターがいません'; return false; }
    if(!v26FoeWithACounter(ctx.opponent).length){
      ctx.reason = '相手フィールドにAカウンターの乗ったモンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('亜空間ジャンプ装置：入れ替える自分のモンスター',
      API.fieldCards({player:ctx.player, zone:'mz'}), mine => {
        API.selectCard('亜空間ジャンプ装置：Aカウンターの乗った相手モンスター',
          v26FoeWithACounter(ctx.opponent), foe => done([mine, foe]));});},
  operation(ctx){
    const ts = ctx.selectedTargets || [];
    const a = ts[0] && resolveTarget(ts[0]);
    const b = ts[1] && resolveTarget(ts[1]);
    if(!a || !b || a.zone !== 'mz' || b.zone !== 'mz' || a.p === b.p) return;
    /* 解決時にも A カウンターが必要 */
    if(API.countCounter(b, 'A') <= 0) return;
    const me = v26At(ctx.card);
    API.swapControl(a, b, '亜空間ジャンプ装置', me || null);},
  afterResolve(){}
}],{type:'trap', priority:2, targets:true});

/* =====================================================================
   10. ガスタの疾風 リーズ
   「1ターンに1度、手札を1枚デッキの一番下に戻し、相手フィールド上の
     モンスター1体と自分フィールド上の「ガスタ」と名のついたモンスター1体を
     選択して発動できる。選択したモンスターのコントロールを入れ替える。」
   コスト（手札→デッキの一番下）→ 対象選択 → 入れ替え、の順で処理する。
   「ガスタ」は P4 の GUSTO authority。名前の部分一致は使わない。
   ===================================================================== */
defineUnifiedCardV4('ガスタの疾風 リーズ',[{
  key:'bottom-deck-then-swap', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){
    const h = v26At(ctx.card);
    if(!h || h.zone !== 'mz' || h.card.face !== 'up'){
      ctx.reason = '表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(ctx.card.v26LeezeTurn === gameState.turn){
      ctx.reason = 'このターンは既に使用しています'; return false; }
    if(!gameState.players[ctx.player].hand.length){
      ctx.reason = 'デッキの一番下へ戻す手札がありません'; return false; }
    if(!v26OwnGusto(ctx.player).length){
      ctx.reason = '自分フィールドに「ガスタ」モンスターがいません'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){
      ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;},
  cost(ctx,done){
    const hand = v26HandCards(ctx.player);
    if(!hand.length){ done(false); return; }
    API.selectCard('ガスタの疾風 リーズ：デッキの一番下へ戻す手札', hand, t => {
      const h = resolveTarget(t);
      if(!h || h.zone !== 'hand'){ done(false); return; }
      const me = v26At(ctx.card);
      if(me) API.setCardFlag(me, 'v26LeezeTurn', gameState.turn, 'ガスタの疾風 リーズ');
      API.returnToDeck(h, true, 'ガスタの疾風 リーズ（コスト）');
      done(true);});},
  target(ctx,done){
    API.selectCard('ガスタの疾風 リーズ：入れ替える相手モンスター',
      API.fieldCards({player:ctx.opponent, zone:'mz'}), foe => {
        API.selectCard('ガスタの疾風 リーズ：入れ替える自分の「ガスタ」モンスター',
          v26OwnGusto(ctx.player), mine => done([foe, mine]));});},
  operation(ctx){
    const ts = ctx.selectedTargets || [];
    const foe = ts[0] && resolveTarget(ts[0]);
    const mine = ts[1] && resolveTarget(ts[1]);
    if(!foe || !mine || foe.zone !== 'mz' || mine.zone !== 'mz' || foe.p === mine.p) return;
    const me = v26At(ctx.card);
    API.swapControl(mine, foe, 'ガスタの疾風 リーズ', me || null);},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, timing:['mainPhase']});

/* =====================================================================
   反目の従者 は今回対象外。ENGINE_GAP のまま残す。
   誘発（onControlChange + 装備先 uid + 元々の攻撃力）は P26 で書けるが、
   「装備モンスターのコントロールが移った時に装備カードをどう扱うか」が
   engine に無い。FX_CONTROL / CONTROL_SWAP_V26 は装備を落とさないため、
   1103 の裁定（装備カードは墓地へ）とズレたまま半分だけ実装することになる。
   ===================================================================== */
