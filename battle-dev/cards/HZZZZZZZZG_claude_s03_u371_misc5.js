/* S03-U371: four monsters (carddata texts).

   魔知ガエル        フィールドに表側表示で存在する限りカード名は「デスガエル」として扱う。表側表示で存在する限り、相手は他のモンスターを攻撃対象に選択できない。フィールドから墓地へ送られた時、デッキ・墓地から「魔知ガエル」以外の「ガエル」モンスター1体を手札に加える事ができる。
   赤蟻アスカトル    戦闘で破壊され墓地へ送られた時、自分の墓地のレベル5モンスター1体を対象として発動できる。そのモンスターを特殊召喚する。効果は無効化され、このターンのエンドフェイズに墓地へ送られる。
   神竜アクアバザル  自分の他の表側表示の水属性モンスター1体をリリースし、自分の墓地の永続魔法またはフィールド魔法1枚を選択して発動する。そのカードを墓地からデッキの一番上に戻す。1ターンに1度。
   英知の代行者 マーキュリー  相手のエンドフェイズ時に、表側表示で存在し自分の手札が0枚だった場合、次の自分のスタンバイフェイズ時に発動する。デッキから1枚ドローする。

   Notes
   - 魔知ガエル: continuous.nameOverride (scope self, S03-U343 pattern) + cannotBeAttackTarget (as 深緑の... D・マグネンU's defence clause); the Graveyard trigger is limited to the turn it left the Monster Zone (graveInfo.from 'mz').
   - アスカトル: the revived Level 5 monster is negated (API.negateEffectUntil permanent) and sent to the Graveyard by an End Phase schedule (handler u371.ant-bury).
   - アクアバザル: cost = release (send to the Graveyard) another face-up WATER monster; API.returnToDeck(…, false) puts the card on top.
   - マーキュリー: forced onEndPhase trigger in the opponent's turn records the condition in an End-of-turn schedule for my next Standby Phase (handler u371.mercury-draw). */

/* ---- 魔知ガエル ---- */
function u371ToadLeft(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
function u371ToadPool(ctx){
  const pred = x=>x.db.k==='m' && x.db.n!=='魔知ガエル' && String(x.db.n||'').indexOf('ガエル')>=0;
  return API.pileCards(ctx.player, 'deck', pred).concat(API.pileCards(ctx.player, 'grave', pred));
}
defineUnifiedCardV4('魔知ガエル', [{
  key:'search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u371ToadLeft(ctx) && u371ToadPool(ctx).length>0; },
  operation(ctx){
    const pool = u371ToadPool(ctx); if(!pool.length) return;
    API.selectCard('魔知ガエル：手札に加える「ガエル」', pool, t=>{
      const r = t && resolveTarget(t); if(!r) return;
      if(r.zone==='deck') API.searchDeck(ctx.player, r.index, '魔知ガエル');
      else if(r.zone==='grave') API.returnToHand(r, '魔知ガエル');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'],
  passive:{ onSendToGrave(ctx){ return u371ToadLeft(ctx) && u371ToadPool(ctx).length>0; }, onDestroy(ctx){ return u371ToadLeft(ctx) && u371ToadPool(ctx).length>0; } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    nameOverride(card, self){ return (card===self && self.face==='up') ? 'デスガエル' : null; },
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || !target || target===self) return false;
      const sh = findCardByUid(self.uid), th = findCardByUid(target.uid);
      return !!sh && !!th && th.zone==='mz' && th.p===sh.p;
    } } });

/* ---- 赤蟻アスカトル ---- */
API.registerScheduleHandler('u371.ant-bury', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.sendToGrave(h, '赤蟻アスカトル（エンドフェイズに墓地へ）');
});
function u371AntSent(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn);
}
function u371AntPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && Number(x.db.lv)===5 && x.card!==ctx.card && canEffectSpecialSummonS03(x.card, 'grave', '赤蟻アスカトル')); }
defineUnifiedCardV4('赤蟻アスカトル', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u371AntSent(ctx) && hasMonsterZoneSpace(ctx.player) && u371AntPool(ctx).length>0; },
  operation(ctx){
    const pool = u371AntPool(ctx); if(!pool.length) return;
    API.selectCard('赤蟻アスカトル：特殊召喚するレベル5モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', '赤蟻アスカトル');
      const m = findCardByUid(uid); if(!m || m.zone!=='mz') return;
      API.negateEffectUntil(m, 'permanent', '赤蟻アスカトル', ctx.card);
      API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u371.ant-bury', args:{uid}, note:'赤蟻アスカトル'});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], targets:true, includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return u371AntSent(ctx) && hasMonsterZoneSpace(ctx.player) && u371AntPool(ctx).length>0; }, onDestroy(ctx){ return u371AntSent(ctx) && hasMonsterZoneSpace(ctx.player) && u371AntPool(ctx).length>0; } } });

/* ---- 神竜アクアバザル ---- */
function u371Water(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.at==='水'}); }
function u371Cont(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='s' && (x.db.sub==='永続' || x.db.sub==='フィールド')); }
defineUnifiedCardV4('神竜アクアバザル', [{
  key:'recycle', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(!u371Water(ctx).length){ ctx.reason = 'リリースする他の水属性モンスターがいません'; return false; }
    if(!u371Cont(ctx).length){ ctx.reason = '墓地に永続魔法・フィールド魔法がありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('神竜アクアバザル：リリースする水属性モンスター', u371Water(ctx), t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, '神竜アクアバザル（リリース）'); done(true); });
  },
  target(ctx, done){ API.selectCard('神竜アクアバザル：デッキの一番上に戻すカード', u371Cont(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToDeck(r, false, '神竜アクアバザル'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase']});

/* ---- 英知の代行者 マーキュリー ---- */
API.registerScheduleHandler('u371.mercury-draw', (args)=>{
  const p = args && (args.player===0 || args.player===1) ? args.player : null;
  if(p!=null && gameState.players[p].deck.length>0) API.draw(p, 1);
});
function u371MercuryEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player!==gameState.activePlayer && API.me(ctx).hand.length===0; }
defineUnifiedCardV4('英知の代行者 マーキュリー', [{
  key:'plan', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u371MercuryEnd(ctx); },
  operation(ctx){ API.schedule({at:'standbyPhase', turns:1, player:ctx.player, handler:'u371.mercury-draw', args:{player:ctx.player}, note:'英知の代行者 マーキュリー'}); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], passive:{ onEndPhase(ctx){ return u371MercuryEnd(ctx); } } });
