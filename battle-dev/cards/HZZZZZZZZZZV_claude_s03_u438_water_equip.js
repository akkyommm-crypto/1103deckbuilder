/* S03-U438: アームズ・シーハンター, バブル・ショット (NOT_STARTED cards, carddata texts).

   アームズ・シーハンター  自分フィールド上にこのカード以外の水属性モンスターが存在する場合、このカードと戦闘を行った効果モンスターの効果をダメージ計算後に無効化する。また、フィールド上に表側表示で存在するこのカードが破壊される場合、代わりに自分フィールド上に表側表示で存在するレベル3以下の水属性モンスター1体を破壊できる。
   バブル・ショット        「E・HERO バブルマン」にのみ装備可能。装備モンスターの攻撃力は800ポイントアップする。装備モンスターが戦闘で破壊される場合、代わりにこのカードを破壊し、装備モンスターのコントローラーへの戦闘ダメージを0にする。

   Notes
   - シーハンター: a forced onDamageStep (dsTiming 'after') negates the battle partner (an effect monster) until the end of the turn (API.negateEffectUntil) while another face-up WATER monster is on my field - it covers a Flip effect that resolves after the damage calculation; the substitute is destroySubstituteS03 kind destroyOwn (S03-U173, engine/1ZV: the controller chooses at the destruction) over my other face-up Level 3 or lower WATER monsters.
   - バブル・ショット: u312Define (equip only to 「E・HERO バブルマン」, +800 ATK), equipSubstituteS03:'battle' (engine/1ZZB) and continuous.battleDamage: the damage to the host's controller is 0 when both battlers are in Attack Position (the host loses the battle = it would have been destroyed). */

/* ---- アームズ・シーハンター ---- */
declareNegateFromMzS03('アームズ・シーハンター');
function u438Water(p, self){ return (gameState.players[p].mz||[]).some(c=>c && c!==self && c.face==='up' && dbOf(c).k==='m' && dbOf(c).at==='水'); }
function u438Partner(ctx){
  const b = ctx.battle || {}; if(ctx.zone!=='mz' || ctx.card.face!=='up') return null;
  const o = b.atkCard===ctx.card ? b.defCard : (b.defCard===ctx.card ? b.atkCard : null);
  if(!o || o===ctx.card || dbOf(o).k!=='m' || (dbOf(o).st||[]).indexOf('効果')<0) return null;
  return u438Water(ctx.player, ctx.card) ? o : null;
}
defineUnifiedCardV4('アームズ・シーハンター', [{
  key:'negate', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u438Partner(ctx); },
  operation(ctx){ const o = u438Partner(ctx); const h = o && locateCardAnyV4(o); if(h && (h.zone==='mz')) API.negateEffectUntil(h, 'endTurn', 'アームズ・シーハンター', ctx.card); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u438Partner(ctx); } },
  /* a Flip effect chain resolves after the damage calculation but is built before this trigger - the mz negation layer (engine/00, U432) reaches it */
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    negateEffect(target, self){
      const b = gameState.battle; if(!b || !b.resolved || self.face!=='up' || target===self || dbOf(target).k!=='m' || (dbOf(target).st||[]).indexOf('効果')<0) return false;
      if(self.uid==null || target.uid==null) return false;
      const pair = (b.atkUid===self.uid && b.targetUid===target.uid) || (b.targetUid===self.uid && b.atkUid===target.uid); if(!pair) return false;
      const h = locateCardAnyV4(self); return !!h && u438Water(h.p, self);
    } },
  destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter:c=>c && c.face==='up' && dbOf(c).k==='m' && dbOf(c).at==='水' && Number(dbOf(c).lv)<=3 && dbOf(c).n!=='アームズ・シーハンター'} });

/* ---- バブル・ショット ---- */
u312Define('バブル・ショット', {pred:x=>x.db.n==='E・HERO バブルマン', stat:{atk:800}, meta:{equipSubstituteS03:'battle'},
  continuous:{ battleDamage(info){
    const self = info.self, hosts = [info.atkCard, info.defCard].filter(c=>c && typeof equippedS03==='function' && equippedS03(c, self));
    if(!hosts.length) return null;
    const host = hosts[0], other = host===info.atkCard ? info.defCard : info.atkCard, h = locateCardAnyV4(host);
    if(!h || !other || info.to!==h.p) return null;
    return (host.pos==='atk' && other.pos==='atk') ? 0 : null;
  } } });
