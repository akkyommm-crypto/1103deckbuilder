/* S03-U423: フィールドバリア, 宮廷のしきたり, 安全地帯 (NOT_STARTED Continuous Spell / Traps that protect cards, carddata texts).

   フィールドバリア  （永続魔法）このカードがフィールド上に存在する限り、お互いにフィールド魔法カードを破壊できず、フィールド魔法カードの発動もできない。「フィールドバリア」は自分フィールド上に1枚しか表側表示で存在できない。
   宮廷のしきたり    （永続罠）①：「宮廷のしきたり」は自分フィールドに1枚しか表側表示で存在できない。②：このカードが魔法&罠ゾーンに存在する限り、「宮廷のしきたり」以外のお互いのフィールドの表側表示の永続罠カードは戦闘・効果では破壊されない。
   安全地帯          （永続罠）フィールドの表側攻撃表示モンスター1体を対象としてこのカードを発動できる。①：このカードが魔法&罠ゾーンに存在する限り、その表側表示モンスターは、相手の効果の対象にならず、戦闘及び相手の効果では破壊されず、相手に直接攻撃できない。このカードがフィールドから離れた時にそのモンスターは破壊される。そのモンスターがフィールドから離れた時にこのカードは破壊される。

   Notes
   - Destruction immunity of Spell / Trap Cards = continuous.protectV21 with scope 'allCards' and an effect / battle function over the protected card (engine/1K applyDestructionProtectionV21 already guards FX_TO_GRAVE and FX_WIPE_ZONE for mz / sz / field cards).
   - フィールドバリア: protectV21 for every Field Spell (either field); activationLockS03 refuses the card activation of a Field Spell (hand or Set); a second face-up copy of mine (a later slot) is destroyed by selfDestroyWhenS03 (the "1枚しか表側表示で存在できない" rule; the one in the LATER Spell & Trap slot goes).
   - 宮廷のしきたり: protectV21 effect + battle for every face-up Continuous Trap but 「宮廷のしきたり」; the same one-copy rule.
   - 安全地帯: the ACTIVATE chooses a face-up Attack Position monster of either field; the host uid is the card flag u423Host; continuous (scope allMonsters) = immuneToTarget against the OPPONENT's effects (u378Source), protectV21 (battle and the opponent's effects) and cannotDirectAttack, and the two linkOnLeave destroy links. */

function u423Dup(name){
  return (card, p)=>{
    const P = gameState.players[p], i = P.sz.indexOf(card);
    return (i>=0 && P.sz.some((c, j)=>j<i && c && c.face==='up' && cardName(c)===name)) ? `${name}：自分フィールドに既に表側表示で存在するため破壊` : false;
  };
}

/* ---- フィールドバリア ---- */
defineUnifiedCardV4('フィールドバリア', [u422Act(false)], {
  type:'spell', priority:1,
  selfDestroyWhenS03:u423Dup('フィールドバリア'),
  activationLockS03:(i)=> !i.effectOnly && i.db.k==='s' && i.db.sub==='フィールド',
  continuous:{ scope:'allCards', from:['sz'], apply(){ return null; },
    protectV21:{ key:'u423.barrier', effect:(t)=> dbOf(t).k==='s' && dbOf(t).sub==='フィールド', label:'フィールドバリア' } } });

/* ---- 宮廷のしきたり ---- */
function u423ContTrap(t){ const d = dbOf(t); return d.k==='t' && d.sub==='永続' && t.face==='up' && d.n!=='宮廷のしきたり'; }
defineUnifiedCardV4('宮廷のしきたり', [u422Act(false)], {
  type:'trap', priority:2,
  selfDestroyWhenS03:u423Dup('宮廷のしきたり'),
  continuous:{ scope:'allCards', from:['sz'], apply(){ return null; },
    protectV21:{ key:'u423.court', effect:u423ContTrap, battle:u423ContTrap, label:'宮廷のしきたり' } } });

/* ---- 安全地帯 ---- */
function u423Hosts(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk' && x.db.k==='m'}); }
function u423Shield(t, src){ return !!src && src.face==='up' && src.u423Host!=null && src.u423Host===t.uid; }
defineUnifiedCardV4('安全地帯', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:2, events:['activate'],
  condition(ctx){
    if(!u422Fresh(ctx)) return false;
    if(!u423Hosts().length){ ctx.reason = 'フィールドに表側攻撃表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('安全地帯：守る表側攻撃表示のモンスター', u423Hosts(), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]), me = locateCardAnyV4(ctx.card);
    if(!t || t.zone!=='mz' || t.card.face!=='up' || t.card.pos!=='atk' || !me || me.zone!=='sz') return;
    const uid = ensureCardUid(gameState, t.card);
    API.setCardFlag(me, 'u423Host', uid, '安全地帯', {silent:true});
    const self = locateCardAnyV4(ctx.card), mon = findCardByUid(uid);
    if(!self || !mon) return;
    API.linkOnLeave(mon, self, 'destroy', '安全地帯');
    const mon2 = findCardByUid(uid); if(mon2) API.linkOnLeave(self, mon2, 'destroy', '安全地帯');
  },
  afterResolve(){}
}], {
  type:'trap', priority:2, targets:true,
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    immuneToTarget(card, self){
      if(!u423Shield(card, self)) return false;
      const s = u378Source(), h = locateCardAnyV4(card);
      return !!s && !!h && s.player!==h.p;
    },
    protectV21:{ key:'u423.safe', battle:(t, src)=>u423Shield(t, src), effect:(t, src)=>u423Shield(t, src), opponentOnly:true, label:'安全地帯' },
    cannotDirectAttack(card, self){ return u423Shield(card, self); } } });
