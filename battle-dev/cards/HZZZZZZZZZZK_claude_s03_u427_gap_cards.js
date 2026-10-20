/* S03-U427: マスクド・チョッパー, 原子ホタル, タイム・イーター, ビッグ・ワン・ウォリアー, 魔轟神獣チャワ, コロボックリ, マツボックル (ENGINE_GAP cards that the later engine work made writable, carddata texts).

   マスクド・チョッパー  このカードが戦闘によって相手モンスターを破壊した場合、相手ライフに2000ポイントダメージを与える。
   原子ホタル            フィールド上に表側表示で存在するこのカードを戦闘で破壊したプレイヤーは、1000ポイントダメージを受ける。
   タイム・イーター      このカードが戦闘によって相手モンスターを破壊した場合、次の相手ターンのメインフェイズ1をスキップする。
   ビッグ・ワン・ウォリアー  自分のメインフェイズ時、このカード以外の手札のレベル1モンスター1体を墓地へ送って発動する事ができる。このカードを手札から特殊召喚する。
   魔轟神獣チャワ        自分のメインフェイズ時に発動できる。手札から「魔轟神」と名のついたモンスター1体を捨て、このカードを手札から特殊召喚する。
   コロボックリ          自分のメインフェイズ時に発動する事ができる。手札から「マツボックル」1体を墓地へ送り、このカードを手札から特殊召喚する。
   マツボックル          このカードが「コロボックリ」の効果によって墓地へ送られた場合、このカードを墓地から特殊召喚する事ができる。

   Notes
   - The ENGINE_GAP overrides of all seven cards were removed (unlock.py) and the tests that listed them as gaps now record them as unlocked.
   - チョッパー / タイム・イーター: forced onDamageStep (dsTiming 'after') with a6DestroyedFoeInBattle(ctx); 2000 damage / API.skipPhase(opponent, 'main1', 1 | 2: the opponent's next turn).
   - 原子ホタル: forced Graveyard trigger: graveInfo.battle && from 'mz' && face 'up' → 1000 damage to the opponent (the controller of the destroying monster).
   - ビッグ・ワン / チャワ / コロボックリ: IGNITION from the hand (handEffect) in my Main Phase: the cost discards / sends the named other hand card, the operation Special Summons itself. マツボックル: the player flag u427Korobo holds the uid sent by コロボックリ's cost; its optional Graveyard trigger on its own send reads and clears it. */

function u427Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free']}, extra);
}
function u427Kill(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a6DestroyedFoeInBattle(ctx); }

/* ---- マスクド・チョッパー ---- */
defineUnifiedCardV4('マスクド・チョッパー', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u427Kill(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 2000, 'マスクド・チョッパー'); },
  afterResolve(){}
}], u427Passive({forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u427Kill(ctx); } }}));

/* ---- タイム・イーター ---- */
defineUnifiedCardV4('タイム・イーター', [{
  key:'skip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u427Kill(ctx); },
  operation(ctx){ API.skipPhase(ctx.opponent, 'main1', gameState.activePlayer===ctx.opponent ? 2 : 1); },
  afterResolve(){}
}], u427Passive({forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u427Kill(ctx); } }}));

/* ---- 原子ホタル ---- */
function u427Fly(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && g.face==='up' && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('原子ホタル', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u427Fly(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 1000, '原子ホタル'); },
  afterResolve(){}
}], u427Passive({forced:true, activateFrom:['grave'], passive:{ onSendToGrave(ctx){ return u427Fly(ctx); } }}));

/* ---- hand Special Summons with a discard / send cost ---- */
function u427HandSelf(name, pool, label, costKind){
  return {
    key:'hand-ss', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND, speed:1, events:['activate'],
    condition(ctx){
      if(ctx.zone!=='hand'){ ctx.reason = '手札で発動します'; return false; }
      if(!(ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'))){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
      if(!pool(ctx).length){ ctx.reason = '手札に対象のモンスターがいません'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
      return true;
    },
    cost(ctx, done){
      const cand = pool(ctx); if(!cand.length){ done(false); return; }
      API.selectCard(label, cand, t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player){ done(false); return; }
        const uid = ensureCardUid(gameState, r.card);
        if(costKind==='send') API.setFlag(ctx.player, 'u427Korobo', uid, false);
        if(costKind==='send') API.sendHandToGrave(ctx.player, r.index, name+'（コスト）'); else API.discard(ctx.player, r.index, name+'（コスト）', {byEffect:false});
        done(true);
      });
    },
    operation(ctx){
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='hand' || me.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'hand', me.index, 'atk', name);
    },
    afterResolve(){}
  };
}
defineUnifiedCardV4('ビッグ・ワン・ウォリアー', [u427HandSelf('ビッグ・ワン・ウォリアー', ctx=>API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && Number(x.db.lv)===1 && x.card!==ctx.card), 'ビッグ・ワン・ウォリアー：墓地へ送る手札のレベル1モンスター', 'send')],
  u427Passive({activateFrom:['hand'], includesSpecialSummon:true}));
defineUnifiedCardV4('魔轟神獣チャワ', [u427HandSelf('魔轟神獣チャワ', ctx=>API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && String(x.db.n||'').indexOf('魔轟神')>=0 && x.card!==ctx.card), '魔轟神獣チャワ：捨てる手札の「魔轟神」モンスター', 'discard')],
  u427Passive({activateFrom:['hand'], includesSpecialSummon:true}));
defineUnifiedCardV4('コロボックリ', [u427HandSelf('コロボックリ', ctx=>API.pileCards(ctx.player, 'hand', x=>x.db.n==='マツボックル'), 'コロボックリ：墓地へ送る手札の「マツボックル」', 'send')],
  u427Passive({activateFrom:['hand'], includesSpecialSummon:true}));

/* ---- マツボックル ---- */
function u427Mats(ctx){
  const e = ctx.event || {};
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && API.getFlag(ctx.player, 'u427Korobo')===ctx.card.uid;
}
defineUnifiedCardV4('マツボックル', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
  condition(ctx){ if(!u427Mats(ctx)){ ctx.reason = '「コロボックリ」の効果によって墓地へ送られた場合に発動します'; return false; } return hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    API.setFlag(ctx.player, 'u427Korobo', null, false);
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', me.index, 'atk', 'マツボックル');
  },
  afterResolve(){}
}], u427Passive({activateFrom:['grave'], includesSpecialSummon:true, passive:{ onSendToGrave(ctx){ return u427Mats(ctx) && hasMonsterZoneSpace(ctx.player); } }}));
