/* =========================================================================
   S03-U177 — contact fusion (engine/1ZW) with the whole texts.
   剣闘獣ヘラクレイノス: 「剣闘獣ラクエル」＋「剣闘獣」と名のついたモンスター×2 / デッキに戻した場合のみ… / このカードがフィールド上に表側表示で
     存在する限り、手札を1枚捨てる事で、魔法・罠カードの発動を無効にし破壊する。 (either player's Spell / Trap card activation; no limit)
   E・HERO ブラック・ネオス: フィールド上の効果モンスター1体を選択して発動できる。このカードがフィールド上に表側表示で存在する限り、選択した
     モンスターの効果は無効化される(この効果で選択できるモンスターは1体まで)。 / エンドフェイズ時、このカードはエクストラデッキに戻る。
   ========================================================================= */
defineScript('剣闘獣ヘラクレイノス', {
  type:'fusion', priority:2, quickEffect:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
    const top = gameState.chain.length ? gameState.chain[gameState.chain.length-1] : null;
    const d = top ? (CARD_DB[top.cardId]||{}) : {};
    if(!top || (d.k!=='s' && d.k!=='t') || top.cardActivationS03!==true){ ctx.reason='魔法・罠カードの発動にチェーンします'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason='捨てる手札がありません'; return false; }
    return true;
  },
  cost: u176DiscardCost('剣闘獣ヘラクレイノス'),
  resolve(){ negatePreviousChainLinkV2('剣闘獣ヘラクレイノス', true, 'activation'); }, afterResolve(){}
});
declareContactFusionS03('剣闘獣ヘラクレイノス');

function u177EffectMonster(x){ return x.zone==='mz' && x.card.face==='up' && (x.db.st||[]).indexOf('効果')>=0; }
defineUnifiedCardV4('E・HERO ブラック・ネオス',[{
  key:'link-negate', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'both',
  speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
    if(linkedNegationTargetS03(ctx.card)!=null){ ctx.reason='既に選択したモンスターの効果を無効化しています（1体まで）'; return false; }
    if(!API.fieldCards({zone:'mz', filter:x=>u177EffectMonster(x) && x.card!==ctx.card}).length){ ctx.reason='フィールドに表側表示の効果モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('E・HERO ブラック・ネオス：効果を無効にする効果モンスター', API.fieldCards({zone:'mz', filter:x=>u177EffectMonster(x) && x.card!==ctx.card}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    const me = findCardByUid(ensureCardUid(gameState, ctx.card));
    if(!t || !me || me.zone!=='mz' || me.card.face!=='up' || t.card.face!=='up') return;
    linkNegateTargetS03(me.card, t, 'E・HERO ブラック・ネオス');
  },
  afterResolve(){}
}, endPhaseReturnExEffectS03('E・HERO ブラック・ネオス')],{
  type:'fusion', priority:1, timing:['mainPhase'], targets:true,
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}
});
declareContactFusionS03('E・HERO ブラック・ネオス');
