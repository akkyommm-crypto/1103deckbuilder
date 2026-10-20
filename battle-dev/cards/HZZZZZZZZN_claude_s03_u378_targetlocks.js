/* S03-U378: three NOT_STARTED cards that restrict targeting / attacks (carddata texts).

   ヴァイロン・セグメント  （装備魔法）「ヴァイロン」と名のついたモンスターにのみ装備可能。装備モンスターは相手の罠・効果モンスターの効果の対象にならない。フィールド上に表側表示で存在するこのカードが墓地へ送られた場合、デッキから「ヴァイロン」と名のついた魔法カード1枚を手札に加える事ができる。
   闇の侯爵ベリアル        このカードがフィールド上に表側表示で存在する限り、相手は「闇の侯爵ベリアル」以外の自分フィールド上に表側表示で存在するモンスターを攻撃対象に選択できず、魔法・罠カードの効果の対象にする事もできない。
   滅びの爆裂疾風弾        （通常魔法）このカードを発動するターン、自分の「青眼の白龍」は攻撃できない。①:自分フィールドに「青眼の白龍」が存在する場合に発動できる。相手フィールドのモンスターを全て破壊する。

   Notes
   - Targeting immunity by the SOURCE of the effect (ヴァイロン・セグメント / ベリアル): the card whose activation is being prepared is ACTIVATION_PREP_S03.uid (S03-U336 reads its player the same way); the source kind is read from its carddata row
     (Trap, or an Effect Monster for the Segment; Spell / Trap for ベリアル) and only the opponent of the protected monster's controller is blocked.
   - ベリアル' attack part: continuous.cannotBeAttackTarget (as 魔知ガエル S03-U371), every other face-up monster of its controller is protected.
   - 滅びの爆裂疾風弾: the used Spell registers itself as a lingering source (API.lingerS03 + continuous.from:['linger'], S03-U257) with a turn stamp; continuous.cannotAttack stops every 「青眼の白龍」 of its controller for that turn, also one Special Summoned afterwards. */

/* ---- the card that is being activated (its effect is the one that targets) ---- */
function u378Source(){
  const prep = (typeof ACTIVATION_PREP_S03!=='undefined' && ACTIVATION_PREP_S03 && ACTIVATION_PREP_S03.uid!=null) ? ACTIVATION_PREP_S03 : null;
  if(!prep) return null;
  const h = findCardByUid(prep.uid); if(!h) return null;
  return {db:dbOf(h.card), player:(prep.player===0||prep.player===1) ? prep.player : h.p};
}

/* ---- ヴァイロン・セグメント ---- */
u312Define('ヴァイロン・セグメント', {pred:u312IsVylon, effects:[u312VylonSearchEffect('ヴァイロン・セグメント')], meta:u312VylonMeta(),
  continuous:{ immuneToTarget(card, self){
    if(!equippedS03(card, self)) return false;
    const host = locateCardAnyV4(card), src = u378Source(); if(!host || !src || src.player===host.p) return false;
    return src.db.k==='t' || (src.db.k==='m' && (src.db.st||[]).indexOf('効果')>=0);
  } } });

/* ---- 闇の侯爵ベリアル ---- */
function u378Mine(self, target){
  if(!self || self.face!=='up' || !target || target===self || target.face!=='up') return false;
  const sh = findCardByUid(self.uid), th = findCardByUid(target.uid);
  return !!sh && !!th && sh.zone==='mz' && th.zone==='mz' && th.p===sh.p;
}
defineUnifiedCardV4('闇の侯爵ベリアル', [], {type:'monster', priority:1,
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){ return u378Mine(self, target); },
    immuneToTarget(card, self){
      if(!u378Mine(self, card)) return false;
      const host = findCardByUid(self.uid), src = u378Source(); if(!host || !src || src.player===host.p) return false;
      return src.db.k==='s' || src.db.k==='t';
    } } });

/* ---- 滅びの爆裂疾風弾 ---- */
function u378BlueEyes(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='青眼の白龍'}); }
defineScript('滅びの爆裂疾風弾', {
  type:'spell', priority:1, targets:false,
  condition(ctx){ if(!u378BlueEyes(ctx.player).length){ ctx.reason = '自分フィールドに「青眼の白龍」が存在しません'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me){ API.setCardFlag(me, 'u378BanTurn', gameState.turn, '滅びの爆裂疾風弾', {silent:true}); const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, '滅びの爆裂疾風弾'); }
    API.fieldCards({player:ctx.opponent, zone:'mz', filter:()=>true}).slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && h.zone==='mz') API.destroy(h, '滅びの爆裂疾風弾'); });
  },
  afterResolve(){},
  continuous:{ scope:'allMonsters', from:['linger'], apply(){ return null; },
    cannotAttack(card, self){
      if(!self || Number(self.u378BanTurn)!==Number(gameState.turn) || !card || dbOf(card).n!=='青眼の白龍') return false;
      const sh = locateCardAnyV4(self), ch = locateCard(card);
      return !!sh && !!ch && ch.p===sh.p;
    } }
});
