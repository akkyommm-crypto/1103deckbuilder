/* =========================================================================
   S03-U182 — E・HERO グロー・ネオス / E・HERO カオス・ネオス (contact fusion, engine/1ZW). 2011 texts.
   グロー・ネオス: エンドフェイズ時にこのカードは融合デッキに戻る。 / 相手フィールド上に表側表示で存在するカード1枚を破壊し、そのカードの種類により
     このカードは以下の効果を得る。この効果は1ターンに1度だけ自分のメインフェイズ1に使用する事ができる。 ●モンスターカード:このターン、このカード
     は戦闘を行えない。 ●魔法カード:このカードは相手プレイヤーに直接攻撃する事ができる。 ●罠カード:このカードは守備表示になる。
     (The text does not say 選択 / 対象: the card is chosen when the effect resolves.)
   カオス・ネオス: エンドフェイズ時にこのカードを融合デッキに戻し、フィールド上に存在する全ての表側表示モンスターをセットした状態にする。 /
     コイントスを3回行い、表が出た回数によって以下の処理を行う。この効果は1ターンに1度だけ自分のメインフェイズ1に使用する事ができる。
     ●3回:相手フィールド上に存在する全てのモンスターを破壊する。 ●2回:このターン相手フィールド上に表側表示で存在する効果モンスターは全て効果が
     無効化される。 ●1回:自分フィールド上に存在する全てのモンスターを持ち主の手札に戻す。
   ========================================================================= */
function u182Main1(ctx){
  if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason='フィールドで表側表示の時に発動します'; return false; }
  if(gameState.phase!=='main1' || gameState.activePlayer!==ctx.player){ ctx.reason='自分のメインフェイズ1に使用します'; return false; }
  return true;
}
defineUnifiedCardV4('E・HERO グロー・ネオス',[{
  key:'glow', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'opponent', speed:1, events:['activate'],
  condition(ctx){
    if(!u182Main1(ctx)) return false;
    if(!API.fieldCards({player:ctx.opponent, filter:x=>x.card.face==='up'}).length){ ctx.reason='相手フィールドに表側表示のカードがありません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.opponent, filter:x=>x.card.face==='up'});
    if(!pool.length) return;
    API.selectCard('E・HERO グロー・ネオス：破壊する相手の表側表示のカード', pool, t=>{
      const r = resolveTarget(t); if(!r || r.p!==ctx.opponent || r.card.face!=='up') return;
      const kind = dbOf(r.card).k;
      API.destroy(r, 'E・HERO グロー・ネオス');
      if(findCardByUid(r.card.uid) && findCardByUid(r.card.uid).zone===r.zone) return;   /* not destroyed: nothing gained */
      const me = findCardByUid(ensureCardUid(gameState, ctx.card));
      if(!me || me.zone!=='mz') return;
      if(kind==='m') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, 'E・HERO グロー・ネオス');
      else if(kind==='s') API.grantDirectAttack(me);
      else if(kind==='t' && me.card.pos!=='def') API.changePosition(me, 'def', 'E・HERO グロー・ネオス');
    });
  },
  afterResolve(){}
}, endPhaseReturnExEffectS03('E・HERO グロー・ネオス')],{
  type:'fusion', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['glow']},
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}
});
declareContactFusionS03('E・HERO グロー・ネオス');

defineUnifiedCardV4('E・HERO カオス・ネオス',[{
  key:'coins', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){ return u182Main1(ctx); },
  operation(ctx){
    const toss = [duelRandomInt(2), duelRandomInt(2), duelRandomInt(2)], heads = toss.filter(x=>x===0).length;
    API.log(`E・HERO カオス・ネオス：コイントス ${toss.map(x=>x===0?'表':'裏').join('・')}（表${heads}回）`);
    if(heads===3) API.destroyAll('mz', ctx.opponent, 'E・HERO カオス・ネオス');
    else if(heads===2) API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && (x.db.st||[]).indexOf('効果')>=0})
      .forEach(x=>applyNegationV13(x, 'endTurn', 'E・HERO カオス・ネオス', ctx.card));
    else if(heads===1) API.fieldCards({player:ctx.player, zone:'mz'}).map(x=>ensureCardUid(gameState, x.card))
      .forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.returnToHand(h, 'E・HERO カオス・ネオス'); });
  },
  afterResolve(){}
},{
  key:'ep-return-set', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'both',
  speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; },
  operation(ctx){
    const h = findCardByUid(ensureCardUid(gameState, ctx.card));
    if(h && h.zone==='mz') act({type:'FX_RETURN_DECK', player:h.p, zone:'mz', index:h.index, toBottom:false, reason:'E・HERO カオス・ネオス（エンドフェイズ）', epReturnS03:true});
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && !x.card.token}).map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{
      const t = findCardByUid(u); if(t && t.zone==='mz' && t.card.face==='up')
        act({type:'FX_SET_STATE', player:t.p, zone:'mz', index:t.index, face:'down', pos:'def', reason:'E・HERO カオス・ネオス'});
    });
  },
  afterResolve(){}
}],{
  type:'fusion', priority:1, timing:['mainPhase'], countLimit:{n:1, effects:['coins']},
  passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}
});
declareContactFusionS03('E・HERO カオス・ネオス');
