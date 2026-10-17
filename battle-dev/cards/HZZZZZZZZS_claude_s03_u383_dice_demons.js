/* S03-U383: six 2003 「デーモン」 monsters with the dice clause (carddata texts; the dice engine is engine/1ZZR, new in this unit).

   迅雷の魔王－スカル・デーモン  自分のスタンバイフェイズ毎に500LPを払う。相手のコントロールするカードの効果の対象になり、その処理を行う時にサイコロを1回振る。1・3・6が出た場合、その効果を無効にし破壊する。
   シャドウナイトデーモン      自分のスタンバイフェイズ毎に900LPを払う。（同様）3が出た場合、その効果を無効にし破壊する。このカードが相手プレイヤーに与えるダメージは半分になる。
   ダークビショップデーモン    自分のスタンバイフェイズ毎に500LPを払う。自分フィールド上の「デーモン」という名のついたモンスターカードが相手のコントロールするカードの効果の対象になり、その処理を行う時にサイコロを1回振る。1・3・6が出た場合、その効果を無効にし破壊する。
   デスルークデーモン          自分のスタンバイフェイズ毎に500LPを払う。（同様）3が出た場合、その効果を無効にし破壊する。自分フィールド上の「ジェノサイドキングデーモン」が破壊され墓地に送られた時、このカードを手札から墓地に送る事で、その「ジェノサイドキングデーモン」1体を特殊召喚する。
   インフェルノクインデーモン  自分のスタンバイフェイズ毎に500LPを払う。（同様）2・5が出た場合、その効果を無効にし破壊する。このカードがフィールド上に存在する限り、スタンバイフェイズ毎に「デーモン」という名のついたモンスターカード1体の攻撃力をエンドフェイズまで1000ポイントアップする。
   ヘルポーンデーモン          自分のスタンバイフェイズ毎に500LPを払う。（同様）3が出た場合、その効果を無効にし破壊する。このカードがフィールド上に存在する限り、相手は自分フィールド上に存在する同名カード以外の「デーモン」という名のついたモンスターカードを攻撃できない。

   Notes
   - ジェノサイドキングデーモン is not part of this unit (「デーモン」 summon restriction + the battle-victim negation). The upkeep is paid by a forced onStandbyPhase trigger of its own turn (payCost; not paid when the LP are short).
   - The dice: declareDiceDemonS03 (engine/1ZZR): the roll is made when a link that targets the demon (scope 'demons': any 「デーモン」 of its controller) is about to be processed.
   - シャドウナイトデーモン: continuous.battleDamage halves the battle damage the opponent takes in a battle of this card. ヘルポーン: continuous.cannotBeAttackTarget for the other 「デーモン」 (as 闇の侯爵ベリアル S03-U378). インフェルノクイン: a forced onStandbyPhase trigger of any Standby Phase chooses a face-up 「デーモン」 (+1000 ATK until the End Phase). */

function u383Demon(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('デーモン')>=0; }
function u383Upkeep(name, n){
  return { key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
    condition(ctx){ return u383Mine(ctx); },
    operation(ctx){ if(API.me(ctx).lp>=n) API.payCost(ctx.player, n); },
    afterResolve(){} };
}
function u383Mine(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
function u383Meta(extra){ return Object.assign({type:'monster', priority:1, forced:true, timing:['free'], passive:{ onStandbyPhase(ctx){ return u383Mine(ctx); } }}, extra||{}); }

/* ---- 迅雷の魔王－スカル・デーモン ---- */
declareDiceDemonS03('迅雷の魔王－スカル・デーモン', {faces:[1,3,6]});
defineUnifiedCardV4('迅雷の魔王－スカル・デーモン', [u383Upkeep('迅雷の魔王－スカル・デーモン', 500)], u383Meta());

/* ---- シャドウナイトデーモン ---- */
declareDiceDemonS03('シャドウナイトデーモン', {faces:[3]});
defineUnifiedCardV4('シャドウナイトデーモン', [u383Upkeep('シャドウナイトデーモン', 900)], u383Meta({
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    battleDamage(info){
      const self = info && info.self;
      if(!self || self.face!=='up' || (info.atkCard!==self && info.defCard!==self)) return info.amount;
      return info.to!==info.srcPlayer ? Math.floor(info.amount/2) : info.amount;
    } } }));

/* ---- ダークビショップデーモン ---- */
declareDiceDemonS03('ダークビショップデーモン', {faces:[1,3,6], scope:'demons'});
defineUnifiedCardV4('ダークビショップデーモン', [u383Upkeep('ダークビショップデーモン', 500)], u383Meta());

/* ---- デスルークデーモン ---- */
declareDiceDemonS03('デスルークデーモン', {faces:[3]});
function u383KingGone(ctx){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(ctx.zone!=='hand' || !h || h.zone!=='grave' || h.p!==ctx.player || dbOf(h.card).n!=='ジェノサイドキングデーモン') return null;
  const g = h.card.graveInfo;
  return (g && g.byDestroy && g.from==='mz' && Number(g.turn)===Number(gameState.turn)) ? h : null;
}
defineUnifiedCardV4('デスルークデーモン', [u383Upkeep('デスルークデーモン', 500), {
  key:'rescue', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ const h = u383KingGone(ctx); return !!h && hasMonsterZoneSpace(ctx.player) && canEffectSpecialSummonS03(h.card, 'grave', 'デスルークデーモン'); },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.sendHandToGrave(ctx.player, i, 'デスルークデーモン（コスト）'); done(true); },
  operation(ctx){
    const e = ctx.event || {}; const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
    if(h && h.zone==='grave' && h.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'デスルークデーモン');
  },
  afterResolve(){}
}], u383Meta({ forced:false, includesSpecialSummon:true, activateFrom:['mz','hand'],
  passive:{ onStandbyPhase(ctx){ return u383Mine(ctx); }, onSendToGrave(ctx){ return !!u383KingGone(ctx); }, onDestroy(ctx){ return !!u383KingGone(ctx); } } }));

/* ---- インフェルノクインデーモン ---- */
declareDiceDemonS03('インフェルノクインデーモン', {faces:[2,5]});
function u383QueenStandby(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby'; }
function u383FieldDemons(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && u383Demon(x.db)}); }
defineUnifiedCardV4('インフェルノクインデーモン', [{
  /* ONE forced trigger for both clauses: the engine offers a card's forced triggers of one event once per window, so the upkeep (own Standby Phase) and the boost (every Standby Phase) share it */
  key:'standby', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u383Mine(ctx) || (u383QueenStandby(ctx) && u383FieldDemons().length>0); },
  operation(ctx){
    if(ctx.player===gameState.activePlayer && API.me(ctx).lp>=500) API.payCost(ctx.player, 500);
    const pool = u383FieldDemons(); if(!pool.length) return;
    API.selectCard('インフェルノクインデーモン：攻撃力を1000アップする「デーモン」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='mz' && r.card.face==='up') v4RegisterStatModifier(r, {atk:1000}, {code:'インフェルノクインデーモン', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
    });
  },
  afterResolve(){}
}], u383Meta({ passive:{ onStandbyPhase(ctx){ return u383Mine(ctx) || (u383QueenStandby(ctx) && u383FieldDemons().length>0); } } }));

/* ---- ヘルポーンデーモン ---- */
declareDiceDemonS03('ヘルポーンデーモン', {faces:[3]});
defineUnifiedCardV4('ヘルポーンデーモン', [u383Upkeep('ヘルポーンデーモン', 500)], u383Meta({
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || !target || target.face!=='up' || dbOf(target).n===dbOf(self).n || !u383Demon(dbOf(target))) return false;
      const sh = findCardByUid(self.uid), th = findCardByUid(target.uid);
      return !!sh && !!th && sh.zone==='mz' && th.zone==='mz' && th.p===sh.p;
    } } }));
