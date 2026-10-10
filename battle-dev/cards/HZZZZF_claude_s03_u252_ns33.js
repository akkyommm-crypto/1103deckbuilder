/* S03-U252: NOT_STARTED cards (2011 texts) — 不意打ち又佐, サイレント・マジシャン LV8, トラップ処理班 Aチーム, 死霊騎士デスカリバー・ナイト, 神罰,
   ガリトラップ－ピクシーの輪－.
   Reuses: attackLimit (cards/81 ベン・ケイ), controlLockS03 (engine/00, S03-U251), unaffectedByS03 (engine/1ZG), the summon-only condition parsed
   from the text (engine/1ZK), declareActivationResponseS03 (engine/1P) with passive.onActivateSuccess, API.negateChainLink,
   continuous.cannotBeAttackTarget (engine/1ZU).
   Not in this unit: マシンナーズ・スナイパー — 「お互いに…攻撃できない」 applies to the Sniper controller's own attacks too, but engine/1ZU
   attackTargetForbiddenReasonS03 skips a source whose controller is the attacking player (`src.p===attackingPlayer`), so the controller could still attack
   the opponent's 「マシンナーズ」 monsters. Needs an engine change (a both-players flag on cannotBeAttackTarget); 「マシンナーズ」 = SETCODE 4104 matches
   exactly the 8 named monsters. */

/* ---- 不意打ち又佐: 1度のバトルフェイズ中に2回攻撃できる。表側表示でフィールド上に存在する限り、コントロールを変更できない。 ---- */
defineScript('不意打ち又佐', {
  type:'monster', priority:1, attackLimit:2,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  controlLockS03(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz'; }
});

/* ---- サイレント・マジシャン LV8: 通常召喚できない。「サイレント・マジシャン LV4」の効果でのみ特殊召喚できる (engine/1ZK, from the text)。
   ①: このカードは相手の魔法カードの効果を受けない。 ---- */
defineScript('サイレント・マジシャン LV8', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  unaffectedByS03(card, src){
    if(!src || src.k!=='s' || !card) return false;
    const s = findCardByUid(src.uid), me = findCardByUid(card.uid);
    return !!(s && me && s.p!==me.p);
  }
});

/* ---- 共通: フィールドの表側のこのカードをリリース (cost) して、チェーン上のカードの発動を無効にし破壊する ---- */
function releaseNegateCostS03(ctx, done, label){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone!=='mz' || me.card.face!=='up'){ done(false); return; }
  API.sendToGrave(me, label + '（リリース）');
  done(true);
}
function faceUpMzS03(ctx){
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up';
}

/* ---- トラップ処理班 Aチーム: この効果は相手ターンでも使用できる。相手が罠カードを発動した時、表側表示のこのカードをリリースして、
   その罠カードの発動を無効にし破壊する (quick effect; engine/1P declared chain response) ---- */
function trapTeamFoeTrapS03(ctx){
  const e = ctx.event;
  return !!e && e.kind==='trap' && e.player===ctx.opponent;
}
defineScript('トラップ処理班 Aチーム', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'],
  condition(ctx){
    if(!faceUpMzS03(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    if(!trapTeamFoeTrapS03(ctx)){ ctx.reason = '相手が罠カードを発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ releaseNegateCostS03(ctx, done, 'トラップ処理班 Aチーム'); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'トラップ処理班 Aチーム', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return faceUpMzS03(ctx) && trapTeamFoeTrapS03(ctx); } }
});

/* ---- 死霊騎士デスカリバー・ナイト: 特殊召喚できない。①: モンスターの効果が発動した時、このカードをリリースして発動する。その発動を無効にし破壊する。
   (either player's monster effect, including its controller's own; the text says 「発動する」, but engine/1P offers declared chain responses
   as optional — implemented optional) ---- */
defineScript('死霊騎士デスカリバー・ナイト', {
  type:'monster', priority:2, quickEffect:true, cannotSpecialSummon:true, activateFrom:['mz'],
  condition(ctx){
    if(!faceUpMzS03(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    const e = ctx.event;
    if(!e || e.kind!=='monster'){ ctx.reason = 'モンスターの効果が発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ releaseNegateCostS03(ctx, done, '死霊騎士デスカリバー・ナイト'); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '死霊騎士デスカリバー・ナイト', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return faceUpMzS03(ctx) && !!ctx.event && ctx.event.kind==='monster'; } }
});

/* ---- 神罰 (Counter Trap): フィールドに「天空の聖域」が存在し、モンスターの効果・魔法・罠カードが発動した時に発動できる。その発動を無効にし破壊する。
   (「天空の聖域」: a face-up copy in either Field Zone; any player's activation) ---- */
function sanctuaryOnFieldS03(){
  return API.fieldCards({zone:'field', filter:x=>x.card.face==='up' && x.db.n==='天空の聖域'}).length > 0;
}
defineScript('神罰', {
  type:'trap', priority:3,
  condition(ctx){
    if(!sanctuaryOnFieldS03()){ ctx.reason = 'フィールドに「天空の聖域」が存在しません'; return false; }
    const e = ctx.event;
    if(!e || (e.kind!=='monster' && e.kind!=='spell' && e.kind!=='trap')){ ctx.reason = 'モンスターの効果・魔法・罠カードが発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', '神罰', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && sanctuaryOnFieldS03() && !!ctx.event && !!ctx.event.kind; } }
});
declareActivationResponseS03(['トラップ処理班 Aチーム', '死霊騎士デスカリバー・ナイト', '神罰']);

/* ---- ガリトラップ－ピクシーの輪－ (Continuous Trap): 自分フィールド上にモンスターが表側攻撃表示で2体以上存在する場合、相手は攻撃力の一番低いモンスターを
   攻撃対象に選択できない。
   (rulings chosen: 「攻撃力の一番低いモンスター」 = the face-up monster(s) of its controller with the lowest current ATK, in any position; on a tie all of them
   are protected; a face-down monster has no ATK and is not protected, nor counted in the lowest; direct attacks are not attack targets) ---- */
defineScript('ガリトラップ－ピクシーの輪－', {
  type:'trap', priority:1,
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['sz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=>{
      if(!self || self.face!=='up' || !target || target.face!=='up') return false;
      const loc = locateCard(target); if(!loc || loc.zone!=='mz') return false;
      const mz = (gameState.players[loc.p].mz||[]).filter(c=>c && c.face==='up');
      if(mz.filter(c=>c.pos==='atk').length < 2) return false;
      const lowest = Math.min.apply(null, mz.map(c=>curATK(c)));
      return curATK(target) === lowest;
    } }
});
