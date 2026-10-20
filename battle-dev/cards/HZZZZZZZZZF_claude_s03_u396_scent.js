/* S03-U396: 魔封じの芳香, 氷結界の破術師, 八つ手サソリ, A・O・J リバース・ブレイク (NOT_STARTED cards, carddata texts).

   魔封じの芳香        （永続罠）このカードがフィールド上に存在する限り、お互いに魔法カードはセットしなければ発動できず、セットしたプレイヤーから見て次の自分ターンが来るまで発動できない。
   氷結界の破術師      自分フィールド上にこのカード以外の「氷結界」と名のついたモンスターが存在する限り、お互いに魔法カードはセットしなければ発動できず、セットしたプレイヤーから見て次の自分のターンが来るまで発動できない。
   八つ手サソリ        このカードは1ターンに1度だけ裏側守備表示にする事ができる。裏側守備表示の相手モンスターを攻撃対象にした場合、このカードの攻撃力はダメージ計算時のみ2400ポイントになる。
   A・O・J リバース・ブレイク  フィールド上に光属性モンスターが存在する場合、このカードを破壊する。このカードが裏側守備表示のモンスターを攻撃した場合、ダメージ計算を行わず裏側守備表示のままそのモンスターを破壊する。

   Notes
   - 魔封じの芳香 / 氷結界の破術師: activationLockS03 (engine/1ZD, S03-U217): a Spell Card cannot be activated from the hand, nor from the Field Zone / Spell & Trap Zone unless it is face-down and was Set at least two turns ago (Set in my turn T -> activation from turn T+2 on, for either player; a Set card is placed in its owner's turn).
   - 八つ手サソリ: once-per-turn ignition (FX_SET_STATE face-down Defense Position) as 不死王リッチー (S03-U395); the damage-step ATK of 2400 reads gameState.battle.flipped (the attacked monster was face-down and flipped for the damage calculation) and the attacker uid.
   - リバース・ブレイク: selfDestroyWhenS03 while a face-up LIGHT monster is on the field; the face-down destruction is a3PreDamageDestroy as エレキンモグラ (S03-U336). */

/* ---- 魔法カードの発動制限（魔封じの芳香 / 氷結界の破術師） ---- */
function u396SpellLock(i){
  if(i.db.k!=='s') return false;
  if(i.zone==='hand') return true;
  const c = i.card;
  if(!c || c.face!=='down') return true;
  return !(Number(gameState.turn) >= Number(c.setTurn||0) + 2);
}
defineUnifiedCardV4('魔封じの芳香', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}], {type:'trap', priority:2, activationLockS03:(i)=> u396SpellLock(i) });

defineScript('氷結界の破術師', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> {
    const others = API.fieldCards({player:i.srcPlayer, zone:'mz', filter:x=>x.card!==i.src && x.card.face==='up' && String(x.db.n||'').indexOf('氷結界')>=0});
    return others.length>0 && u396SpellLock(i);
  }
});

/* ---- 八つ手サソリ ---- */
defineUnifiedCardV4('八つ手サソリ', [{
  key:'set', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz' || h.card.face!=='up') return;
    act({type:'FX_SET_STATE', player:h.p, zone:h.zone, index:h.index, face:'down', pos:'def', reason:'八つ手サソリ'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['set']}, timing:['free'],
  continuous:{ scope:'self', from:['mz'],
    apply(target, self){
      if(target!==self || !self || self.face!=='up' || !a5InDamageStep()) return null;
      const b = gameState.battle;
      if(!b || !b.flipped || b.atkUid!==self.uid) return null;
      const d = 2400 - (Number(dbOf(self).atk)||0);
      return d!==0 ? {atk:d} : null;
    } } });

/* ---- A・O・J リバース・ブレイク ---- */
a3PreDamageDestroy('A・O・J リバース・ブレイク', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && d.face === 'down') ? d : null;
});
CARD_SCRIPTS['A・O・J リバース・ブレイク'].selfDestroyWhenS03 = (card)=> [0,1].some(q=>(gameState.players[q].mz||[]).some(c=>c && c.face==='up' && dbOf(c).at==='光')) ? 'A・O・J リバース・ブレイク：光属性モンスターが存在するため破壊' : false;
