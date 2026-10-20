/* S03-U432: エレメント・ザウルス, エレメント・ドラゴン, ゴーレム, マンモス・ゾンビ, ブレイドナイト (stale ENGINE_GAP cards: continuous rules and battle follow-ups, carddata texts).

   エレメント・ザウルス  このモンスターはフィールド上に特定の属性を持つモンスターが存在する場合、以下の効果を得る。●炎属性：このカードの攻撃力は500ポイントアップする。●地属性：このカードが戦闘によって破壊した効果モンスターの効果は無効化される。
   エレメント・ドラゴン  ①：フィールドのモンスターの属性によって、このカードは以下の効果を得る。●炎属性：このカードの攻撃力は500アップする。●風属性：このカードが戦闘で相手モンスターを破壊した時に発動できる。このカードはもう1度だけ続けて攻撃できる。
   ゴーレム              このカードがフィールド上に表側表示で存在する限り、フィールド上に表側表示で存在する光属性モンスターの効果は無効化される。このカードが戦闘によって光属性モンスターを破壊した場合、もう1度だけ続けて攻撃する事ができる。
   マンモス・ゾンビ      自分の墓地にアンデット族モンスターが存在しない場合、このカードを破壊する。フィールド上に表側表示で存在するこのカードが破壊された場合、その時のコントローラーにこのカードの元々の攻撃力分のダメージを与える。
   ブレイドナイト        ①：自分の手札が1枚以下の場合、このカードの攻撃力は400アップする。②：自分フィールドにこのカード以外のモンスターが存在しない場合、このカードが戦闘で破壊したリバースモンスターの効果は無効化される。

   Notes
   - NEW engine (S03-U432, engine/00): declareNegateFromMzS03(name) lets a face-up MONSTER's continuous.negateEffect(target, self) negate other monsters (effectNegated only read the Spell & Trap / Field sources before) - ゴーレム: every face-up LIGHT monster.
   - Attribute presence = u264AnyFaceUpAttr (either field, current attribute). The battle negation reuses declareBattleDestroyedNegatorS03 (engine/1S) whose condition(destroyer, victim) gets both cards: ザウルス → a face-up EARTH monster on the field; ブレイドナイト → no other monster on the destroyer's field and the victim's text is a Flip effect (text begins with リバース / contains リバースした).
   - Extra attacks: forced onDamageStep (dsTiming 'after') + API.grantAdditionalAttack(card, 1) once per turn (card flag u432Again = the turn).
   - マンモス・ゾンビ: selfDestroyWhenS03 (no Undead in my Graveyard; an Undead card on my Graveyard stops it) and a forced Graveyard trigger on a destruction of the face-up card from the field: damage to the player who controlled it = its original ATK (1900). */

function u432Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free']}, extra);
}
function u432Fire(card, self){ return card===self && self.face==='up' && u264AnyFaceUpAttr('炎'); }

/* ---- エレメント・ザウルス ---- */
defineScript('エレメント・ザウルス', u432Passive({
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(card, self){ return u432Fire(card, self) ? {atk:500} : null; } } }));
declareBattleDestroyedNegatorS03('エレメント・ザウルス', {condition(){ return u264AnyFaceUpAttr('地'); }});

/* ---- エレメント・ドラゴン ---- */
function u432Again(ctx, attrOk){
  return ctx.zone==='mz' && ctx.card.face==='up' && a5IsAttackerCard(ctx.card) && !!a6DestroyedFoeInBattle(ctx) && Number(ctx.card.u432Again)!==Number(gameState.turn) && attrOk(a6DestroyedFoeInBattle(ctx));
}
function u432AgainEffect(name, attrOk){
  return { key:'again', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return u432Again(ctx, attrOk); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz'){ API.setCardFlag(me, 'u432Again', gameState.turn, name, {silent:true}); API.grantAdditionalAttack(me, 1, name); } },
    afterResolve(){} };
}
defineUnifiedCardV4('エレメント・ドラゴン', [{
  key:'wind-again', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u264AnyFaceUpAttr('風') && u432Again(ctx, ()=>true); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz'){ API.setCardFlag(me, 'u432Again', gameState.turn, 'エレメント・ドラゴン', {silent:true}); API.grantAdditionalAttack(me, 1, 'エレメント・ドラゴン'); } },
  afterResolve(){}
}], u432Passive({forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return u264AnyFaceUpAttr('風') && u432Again(ctx, ()=>true); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ return u432Fire(card, self) ? {atk:500} : null; } } }));

/* ---- ゴーレム ---- */
declareNegateFromMzS03('ゴーレム');
/* printed attribute only: negateEffect runs inside continuousSources(), and currentAttributeV17 re-enters continuousSources() (unbounded recursion) */
function u432Light(victim){ return dbOf(victim).at==='光'; }
defineUnifiedCardV4('ゴーレム', [u432AgainEffect('ゴーレム', u432Light)], u432Passive({forced:true, dsTiming:'after',
  passive:{ onDamageStep(ctx){ return u432Again(ctx, u432Light); } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    negateEffect(target, self){ return self.face==='up' && target!==self && target.face==='up' && dbOf(target).k==='m' && u432Light(target); } } }));

/* ---- マンモス・ゾンビ ---- */
function u432Mammoth(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && g.face==='up' && Number(g.turn)===Number(gameState.turn);
}
defineUnifiedCardV4('マンモス・ゾンビ', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u432Mammoth(ctx); },
  operation(ctx){ API.damageLP(ctx.player, Number(dbOf(ctx.card).atk)||0, 'マンモス・ゾンビ'); },
  afterResolve(){}
}], u432Passive({forced:true, activateFrom:['grave'], passive:{ onSendToGrave(ctx){ return u432Mammoth(ctx); } },
  selfDestroyWhenS03:(card, p)=> API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット').length ? false : 'マンモス・ゾンビ：墓地にアンデット族モンスターがいないため破壊' }));

/* ---- ブレイドナイト ---- */
function u432Flip(db){ return /^リバース|リバースした/.test(String((db && db.e) || '')); }
defineScript('ブレイドナイト', u432Passive({
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(card, self){
    if(card!==self || self.face!=='up') return null;
    const h = locateCardAnyV4(self); if(!h) return null;
    return gameState.players[h.p].hand.length<=1 ? {atk:400} : null;
  } } }));
declareBattleDestroyedNegatorS03('ブレイドナイト', {effectOnly:false, condition(destroyer, victim){
  const h = locateCardAnyV4(destroyer); if(!h) return false;
  return API.fieldCards({player:h.p, zone:'mz', filter:x=>x.card!==destroyer}).length===0 && u432Flip(dbOf(victim));
}});
