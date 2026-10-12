/* S03-U309: トゥーン monsters, part 1 — the four that need no Special Summon procedure (carddata texts; the common clauses are written once, `toonCommonS03`).

   Common clauses (carddata, the four of this unit):
     ① このカードは召喚・反転召喚・特殊召喚したターンには攻撃する事ができない。
     ② 自分フィールド上に「トゥーン・ワールド」が存在し、相手フィールド上にトゥーンモンスターが存在しない場合、このカードは相手プレイヤーに直接攻撃する事ができる。
     ③ フィールド上の「トゥーン・ワールド」が破壊された時、このカードを破壊する。
   Card effects: トゥーン・キャノン・ソルジャー 自分フィールド上のモンスター1体をリリースする事で、相手ライフに500ポイントダメージを与える。
                 トゥーン・ゴブリン突撃部隊   攻撃した場合、バトルフェイズ終了時に守備表示になり、次の自分のターンのエンドフェイズ時まで表示形式を変更できない。
                 トゥーン・ヂェミナイ・エルフ このカードが相手に戦闘ダメージを与えた時、相手の手札をランダムに1枚選んで捨てる。
                 トゥーン・仮面魔道士         このカードが相手ライフに戦闘ダメージを与えた時、自分のデッキからカードを1枚ドローする。

   Notes
   - 「トゥーンモンスター」 = a face-up monster whose Type line carries トゥーン (carddata st). Face-down monsters are not Toon monsters.
   - ① is read from card.summonedTurn (Normal / Special Summon) and card.flipSummonedTurnS03 (Flip Summon, S03-U260), both of this turn.
   - ② is the script's canDirectAttack (engine/00 canDirectAttackThroughMonstersV51); not given to a negated card.
   - ③ is a forced trigger on onDestroy of トゥーン・ワールド wherever it is (「フィールド上の」, either player); each Toon monster destroys itself on its own trigger.
   - トゥーン・キャノン・ソルジャー: an ignition effect (no once-per-turn clause), cost: release a monster you control (it may release itself), 500 effect damage.
   - トゥーン・ゴブリン突撃部隊: the ゴブリン突撃部隊 pattern of cards/B0 (flag b0DefLockUntil, cannotChangePosition). */

function toonDbS03(db){ return !!db && db.k==='m' && (db.st||[]).indexOf('トゥーン')>=0; }
function toonFoeToonsS03(p){ return (gameState.players[p===0?1:0].mz||[]).filter(c=>c && c.face==='up' && toonDbS03(dbOf(c))); }
function toonWorldOwnS03(p){ return (gameState.players[p].sz||[]).some(c=>c && c.face==='up' && cardName(c)==='トゥーン・ワールド'); }
function toonSummonTurnBanS03(card, special){
  const t = gameState.turn;
  return Number(card.summonedTurn)===t && (!special || card.specialSummoned===true) || (!special && Number(card.flipSummonedTurnS03)===t);
}
function toonWorldDestroyedS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || e.uid==null) return false;
  const h = findCardByUid(e.uid);
  return !!h && cardName(h.card)==='トゥーン・ワールド';
}
function toonWorldEffectS03(name){
  return {
    key:'toon-world-destroyed', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDestroy'], forced:true,
    condition(ctx){ return toonWorldDestroyedS03(ctx); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.destroy(me, name); },
    afterResolve(){}
  };
}
/* opts: {special:true → the ban is for Special Summons only (part 2), directWorld:true → ② needs the controller's トゥーン・ワールド}.
   extra: {continuous:{…}, passive:{…}, …script fields} merged over the common ones. */
function toonCommonS03(opts, extra){
  const o = Object.assign({special:false, directWorld:true}, opts||{});
  const x = extra || {};
  const cont = Object.assign({
    scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(card, self){ return card===self && toonSummonTurnBanS03(card, o.special); }
  }, x.continuous || {});
  const passive = Object.assign({ onDestroy(ctx){ return toonWorldDestroyedS03(ctx); } }, x.passive || {});
  const d = Object.assign({
    type:'monster', priority:1,
    canDirectAttack(card, loc){
      if(!card || card.face!=='up' || !loc || loc.zone!=='mz') return false;
      if(typeof effectNegated==='function' && effectNegated(card)) return false;
      if(o.directWorld && !toonWorldOwnS03(loc.p)) return false;
      return toonFoeToonsS03(loc.p).length===0;
    }
  }, x);
  d.continuous = cont; d.passive = passive;
  return d;
}

/* ---- トゥーン・キャノン・ソルジャー ---- */
defineUnifiedCardV4('トゥーン・キャノン・ソルジャー', [toonWorldEffectS03('トゥーン・キャノン・ソルジャー'), {
  key:'release-burn', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer){ ctx.reason = '自分のターンにのみ発動できます'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}).length){ ctx.reason = 'リリースできるモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('トゥーン・キャノン・ソルジャー：リリースするモンスター', API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}), t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'トゥーン・キャノン・ソルジャー（リリース）'); done(true);
    });
  },
  operation(ctx){ API.damageLP(ctx.opponent, 500); },
  afterResolve(){}
}], toonCommonS03({}, {timing:['mainPhase']}));

/* ---- トゥーン・ゴブリン突撃部隊 ---- */
defineUnifiedCardV4('トゥーン・ゴブリン突撃部隊', [toonWorldEffectS03('トゥーン・ゴブリン突撃部隊'), {
  key:'attack-then-defend', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){
    return ctx.zone==='mz' && !!ctx.card.attacked && ctx.card.face==='up' && (Number(ctx.card.b0DefLockUntil)||0) < gameState.turn;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz') return;
    API.changePosition(me, 'def', 'トゥーン・ゴブリン突撃部隊');
    API.setCardFlag(me, 'b0DefLockUntil', gameState.turn + 2, 'トゥーン・ゴブリン突撃部隊');
  },
  afterResolve(){}
}], toonCommonS03({}, {
  passive:{ onBattlePhaseEnd(ctx){ return ctx.zone==='mz' && !!ctx.card.attacked && ctx.card.face==='up' && (Number(ctx.card.b0DefLockUntil)||0) < gameState.turn; } },
  continuous:{ cannotChangePosition(target, self){ const me = self || target; return gameState.turn <= (Number(me && me.b0DefLockUntil)||0); } }
}));

/* ---- トゥーン・ヂェミナイ・エルフ ---- */
defineUnifiedCardV4('トゥーン・ヂェミナイ・エルフ', [toonWorldEffectS03('トゥーン・ヂェミナイ・エルフ'), {
  key:'damage-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a3DealtBattleDamage(ctx); },
  operation(ctx){ if(API.foe(ctx).hand.length) v80DiscardRandom(ctx.opponent, 1, 'トゥーン・ヂェミナイ・エルフ', ctx.player); },
  afterResolve(){}
}], toonCommonS03({}, { passive:{ onBattleDamage(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a3DealtBattleDamage(ctx); } } }));

/* ---- トゥーン・仮面魔道士 ---- */
defineUnifiedCardV4('トゥーン・仮面魔道士', [toonWorldEffectS03('トゥーン・仮面魔道士'), {
  key:'damage-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a3DealtBattleDamage(ctx); },
  operation(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){}
}], toonCommonS03({}, { passive:{ onBattleDamage(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a3DealtBattleDamage(ctx); } } }));
