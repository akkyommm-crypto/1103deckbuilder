/* =========================================================================
   S03-U185 — cards that combine a Deck trigger (engine/1ZT) with other effects. Texts from carddata (2011).
   Their AUTO_DECK_TABLE entries were 「起動効果でデッキから特殊召喚」 — wrong for all four (PARTIAL).
   ========================================================================= */
/* メカウサー: このカードが戦闘によって破壊され墓地へ送られた時、自分のデッキから「メカウサー」1体を自分フィールド上に裏側守備表示で特殊召喚する事が
   できる。 / このカードがリバースした時、フィールド上に存在するカード1枚を選択し、そのコントローラーに500ポイントダメージを与える。 */
(function(){
  const dt = deckTriggerEffectV4S03('メカウサー', {when:'battleToGrave', action:'summon', optional:true, pos:'faceDownDef', filter:{name:'メカウサー'}});
  defineUnifiedCardV4('メカウサー', [dt.effect, {
    key:'flip-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1,
    events:['onFlip'], forced:true,
    condition(ctx){ return API.fieldCards({}).length>0; },
    target(ctx, done){ API.selectCard('メカウサー：選択するカード（そのコントローラーに500ダメージ）', API.fieldCards({}), t=>done([t])); },
    operation(ctx){ const r = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(r && ['mz','sz','field'].indexOf(r.zone)>=0) API.damageLP(r.p, 500, 'メカウサー'); },
    afterResolve(){}
  }], {type:'monster', priority:1, targets:true, activateFrom:['mz','grave'],
    passive:{onBattleDestroy(ctx){ return dt.passive(ctx); }, onFlip(ctx){ return ctx.zone==='mz'; }}});
})();

/* サイバー・ラーバァ: ①:このカードが攻撃対象に選択された場合に発動する。このターン、自分が受ける全ての戦闘ダメージは0になる。
   ②:このカードが戦闘で破壊され墓地へ送られた時に発動できる。デッキから「サイバー・ラーバァ」1体を特殊召喚する。 */
(function(){
  const dt = deckTriggerEffectV4S03('サイバー・ラーバァ', {when:'battleToGrave', action:'summon', optional:true, pos:'faceUp', filter:{name:'サイバー・ラーバァ'}});
  const targeted = ctx=>{ const a = gameState.pendingAttack; return ctx.zone==='mz' && !!a && a.targetUid!=null && a.targetUid===ctx.card.uid; };
  defineUnifiedCardV4('サイバー・ラーバァ', [{
    key:'no-battle-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
    condition(ctx){ return targeted(ctx); },
    operation(ctx){ addLpRuleV18({player:ctx.player, cause:'battle', mode:'prevent', turns:0, label:'サイバー・ラーバァ'}); },
    afterResolve(){}
  }, dt.effect], {type:'monster', priority:1, activateFrom:['mz','grave'],
    passive:{onAttackDeclare(ctx){ return targeted(ctx); }, onBattleDestroy(ctx){ return dt.passive(ctx); }}});
})();

/* 電池メン－ボタン型: リバース:デッキから「電池メン－ボタン型」以外のレベル4以下の「電池メン」と名のついたモンスター1体を特殊召喚する。
   また、リバースしたこのカードが戦闘によって破壊され墓地へ送られた時、デッキからカードを1枚ドローする。 */
function u185ButtonPool(p){ return API.pileCards(p,'deck',x=>x.db.k==='m' && String(x.db.n||'').indexOf('電池メン')>=0 && x.db.n!=='電池メン－ボタン型' && (x.db.lv||0)<=4
  && canEffectSpecialSummonS03(x.card,'deck','電池メン－ボタン型')); }
defineUnifiedCardV4('電池メン－ボタン型', [{
  key:'flip-recruit', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.DECK, targetSide:'self', speed:1,
  events:['onFlip'], forced:true,
  condition(ctx){ return ctx.zone==='mz'; },
  operation(ctx){
    const pool = u185ButtonPool(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'電池メン－ボタン型：特殊召喚する「電池メン」', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'電池メン－ボタン型', action:'summon', pos:'faceUp'}}, meta:{scriptName:'電池メン－ボタン型'}});
  },
  afterResolve(){}
},{
  key:'draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattleDestroy'], forced:true,
  condition(ctx){ return ctx.zone==='grave' && (typeof eventIsSelfS03!=='function' || eventIsSelfS03(ctx)) && ctx.card.graveInfo && ctx.card.graveInfo.reversedS03===true; },
  operation(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){}
}], {type:'monster', priority:1, activateFrom:['mz','grave'], includesSpecialSummon:true,
  passive:{onFlip(ctx){ return ctx.zone==='mz'; },
           onBattleDestroy(ctx){ return ctx.zone==='grave' && (typeof eventIsSelfS03!=='function' || eventIsSelfS03(ctx)) && !!(ctx.card.graveInfo && ctx.card.graveInfo.reversedS03===true); }}});

/* ガスタ・サンボルト: このカードが戦闘によって破壊され墓地へ送られた場合、そのバトルフェイズ終了時に自分の墓地の「ガスタ」と名のついたモンスター1体を
   ゲームから除外して発動できる。デッキから守備力1500以下のサイキック族・風属性モンスター1体を特殊召喚する。 */
function u185GustaCost(ctx){ return API.pileCards(ctx.player,'grave',x=>x.card!==ctx.card && x.db.k==='m' && String(x.db.n||'').indexOf('ガスタ')>=0); }
function u185GustaPool(p){ return API.pileCards(p,'deck',x=>x.db.k==='m' && x.db.ra==='サイキック' && x.db.at==='風' && (x.db.def||0)<=1500 && canEffectSpecialSummonS03(x.card,'deck','ガスタ・サンボルト')); }
function u185GustaReady(ctx){
  const g = ctx.card.graveInfo;
  return ctx.zone==='grave' && !!g && g.battle===true && g.turn===gameState.turn && u185GustaCost(ctx).length>0 && u185GustaPool(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player);
}
defineUnifiedCardV4('ガスタ・サンボルト', [{
  key:'bp-end-recruit', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, targetRange:LOCATION.DECK, targetSide:'self', speed:1,
  events:['onBattlePhaseEnd'],
  condition(ctx){ return u185GustaReady(ctx); },
  cost(ctx, done){ API.selectCard('ガスタ・サンボルト：除外する墓地の「ガスタ」', u185GustaCost(ctx), t=>{ const r = resolveTarget(t); if(!r){ done(false); return; } API.banish(r, 'ガスタ・サンボルト（コスト）'); done(true); }); },
  operation(ctx){
    const pool = u185GustaPool(ctx.player);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'ガスタ・サンボルト：特殊召喚するモンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'ガスタ・サンボルト', action:'summon', pos:'faceUp'}}, meta:{scriptName:'ガスタ・サンボルト'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, activateFrom:['grave'], includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  passive:{onBattlePhaseEnd(ctx){ return u185GustaReady(ctx); }}});
