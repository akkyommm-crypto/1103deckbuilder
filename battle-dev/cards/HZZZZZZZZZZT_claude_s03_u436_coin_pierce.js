/* S03-U436: ドリル・シンクロン, アルカナフォースIV－THE EMPEROR, 伝説の賭博師, 混沌の黒魔術師 (stale ENGINE_GAP cards, carddata texts).

   ドリル・シンクロン        ①：このカードがモンスターゾーンに存在する限り、自分の戦士族モンスターが守備表示モンスターを攻撃した場合、その守備力を攻撃力が超えた分だけ相手に戦闘ダメージを与える。②：1ターンに1度、①の効果を適用して相手に戦闘ダメージを与えた時に発動できる。自分はデッキから1枚ドローする。
   アルカナフォースIV       このカードが召喚・反転召喚・特殊召喚に成功した時、コイントスを1回行い以下の効果を得る。●表：自分フィールド上に表側表示で存在する「アルカナフォース」と名のついたモンスターの攻撃力は500ポイントアップする。●裏：…500ポイントダウンする。
   伝説の賭博師              コイントスを3回行う。3回とも表：相手フィールド上モンスターを全て破壊する。2回表：相手の手札をランダムに1枚捨てる。1回表：自分フィールド上に存在するカード1枚を破壊する。3回とも裏：自分の手札を全て捨てる。この効果は1ターンに1度だけ自分のメインフェイズに使用する事ができる。
   混沌の黒魔術師            このカード名の①の効果は1ターンに1度しか使用できない。①：召喚・特殊召喚に成功したターンのエンドフェイズに、自分の墓地の魔法カード1枚を対象として発動できる。そのカードを手札に加える。②：このカードが戦闘で相手モンスターを破壊したダメージ計算後に発動する。その相手モンスターを除外する。③：表側表示のこのカードはフィールドから離れた場合に除外される。

   Notes
   - ドリル: continuous.piercingDamage(info) (engine/00 applyPiercingDamage) for a Warrior of the source's controller attacking a Defense Position monster; the draw is an optional onBattleDamage (event.dealtBy me, not direct, attacker a Warrior, defender in Defense Position - on the field or in the Graveyard graveInfo) once per turn (card flag u436Draw).
   - アルカナフォースIV: the coin toss is duelRandomInt (replay RNG) on summon / flip, stored in the card flag c2ArcanaCoin (as the other Arcana Force cards, B5); continuous scope 'ownMonsters' gives every face-up 「アルカナフォース」 of mine +500 / -500 ATK.
   - 賭博師: ignition once per turn in my Main Phase; three duelRandomInt tosses; 3 heads destroy the opponent's monsters, 2 heads discard a random opponent hand card, 1 head destroys a chosen card of my Monster / Spell & Trap Zone, 0 heads discards my whole hand.
   - 混沌の黒魔術師: forced arrival trigger records the turn and sets card.banishWhenLeavesField (③, v350BanishWhenLeavesField); the End Phase of that turn an optional trigger adds a Spell of my Graveyard to the hand (name once per turn); ② = battleVictimBanishS03 (the victim is banished instead of going to the Graveyard). */

/* ---- ドリル・シンクロン ---- */
function u436DrillPos(e){
  const h = e && e.defenderUid!=null ? findCardByUid(e.defenderUid) : null; if(!h || !h.card) return null;
  return h.zone==='mz' ? h.card.pos : (h.card.graveInfo ? h.card.graveInfo.pos : null);
}
function u436Drill(ctx){
  const e = ctx.event; if(ctx.zone!=='mz' || ctx.card.face!=='up' || !e || e.direct || e.dealtBy!==ctx.player || e.player!==ctx.opponent) return false;
  if(Number(ctx.card.u436Draw)===Number(gameState.turn)) return false;
  const a = e.attackerUid!=null ? findCardByUid(e.attackerUid) : null;
  return !!a && !!a.card && dbOf(a.card).ra==='戦士' && u436DrillPos(e)==='def';
}
defineUnifiedCardV4('ドリル・シンクロン', [{
  key:'draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'],
  condition(ctx){ return u436Drill(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return; API.setCardFlag(me, 'u436Draw', gameState.turn, 'ドリル・シンクロン', {silent:true}); API.draw(ctx.player, 1); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], passive:{ onBattleDamage(ctx){ return u436Drill(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    piercingDamage(info){
      const a = info && info.atkCard, d = info && info.defCard, me = info && info.self;
      if(!a || !d || !me || me.face!=='up' || d.pos!=='def' || dbOf(a).ra!=='戦士') return 0;
      const h = locateCardAnyV4(a); if(!h || h.p!==info.srcPlayer) return 0;
      return Math.max(0, Number(info.amount)||0);
    } } });

/* ---- アルカナフォースIV－THE EMPEROR ---- */
function u436Toss(){ return (typeof duelRandomInt==='function' ? duelRandomInt(2) : 0) === 0; }
defineScript('アルカナフォースIV－THE EMPEROR', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz'){ ctx.reason = 'モンスターゾーンに存在する必要があります'; return false; }
    if(!c2SummonedOrFlipped(ctx)){ ctx.reason = '召喚・反転召喚・特殊召喚に成功した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    API.setCardFlag(me, 'c2ArcanaCoin', u436Toss() ? 'heads' : 'tails', 'アルカナフォースIV－THE EMPEROR');
  },
  afterResolve(){},
  passive:{ onNormalSummon(ctx){ return c2SummonedOrFlipped(ctx); }, onFlip(ctx){ return c2SummonedOrFlipped(ctx); }, onSpecialSummon(ctx){ return c2SummonedOrFlipped(ctx); } },
  continuous:{ scope:'ownMonsters', from:['mz'],
    apply(card, self){
      if(self.face!=='up' || card.face!=='up' || dbOf(card).k!=='m' || String(dbOf(card).n||'').indexOf('アルカナフォース')<0) return null;
      if(self.c2ArcanaCoin==='heads') return {atk:500};
      if(self.c2ArcanaCoin==='tails') return {atk:-500};
      return null;
    } } });

/* ---- 伝説の賭博師 ---- */
defineUnifiedCardV4('伝説の賭博師', [{
  key:'gamble', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1,
  condition(ctx){ if(ctx.zone!=='mz' || ctx.card.face!=='up') return false; return true; },
  operation(ctx){
    let heads = 0; for(let i=0; i<3; i++) if(u436Toss()) heads++;
    API.log('伝説の賭博師：コイントス 表'+heads+'回');
    if(heads===3){
      API.fieldCards({player:ctx.opponent, zone:'mz'}).map(x=>x.card.uid!=null?x.card.uid:ensureCardUid(gameState,x.card)).forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.destroy(h, '伝説の賭博師'); });
    }else if(heads===2){
      const hand = gameState.players[ctx.opponent].hand; if(hand.length) API.discard(ctx.opponent, duelRandomInt(hand.length), '伝説の賭博師');
    }else if(heads===1){
      const pool = API.fieldCards({player:ctx.player, zone:'mz'}).concat(API.fieldCards({player:ctx.player, zone:'sz'})); if(!pool.length) return;
      API.selectCard('伝説の賭博師：破壊する自分のカード', pool, t=>{ const r = t && resolveTarget(t); if(r && r.p===ctx.player && (r.zone==='mz' || r.zone==='sz')) API.destroy(r, '伝説の賭博師'); });
    }else{
      while(gameState.players[ctx.player].hand.length) API.discard(ctx.player, 0, '伝説の賭博師');
    }
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], countLimit:{n:1, effects:['gamble']}, activateFrom:['mz']});

/* ---- 混沌の黒魔術師 ---- */
function u436Arrive(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); }
function u436GraveSpells(p){ return API.pileCards(p, 'grave', x=>x.db.k==='s'); }
function u436ChaosEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && Number(ctx.card.u436Arrive)===Number(gameState.turn) && u436GraveSpells(ctx.player).length>0; }
defineUnifiedCardV4('混沌の黒魔術師', [{
  key:'arrive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onSpecialSummon'], forced:true,
  condition(ctx){ return u436Arrive(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return; API.setCardFlag(me, 'banishWhenLeavesField', true, '混沌の黒魔術師', {silent:true}); API.setCardFlag(me, 'u436Arrive', gameState.turn, '混沌の黒魔術師', {silent:true}); },
  afterResolve(){}
},{
  key:'retrieve', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'],
  condition(ctx){ return u436ChaosEnd(ctx); },
  operation(ctx){
    const pool = u436GraveSpells(ctx.player); if(!pool.length) return;
    API.selectCard('混沌の黒魔術師：手札に加える墓地の魔法カード', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, '混沌の黒魔術師'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], countLimit:{n:1, effects:['retrieve']},
  passive:{ onNormalSummon(ctx){ return u436Arrive(ctx); }, onSpecialSummon(ctx){ return u436Arrive(ctx); }, onEndPhase(ctx){ return u436ChaosEnd(ctx); } },
  battleVictimBanishS03(){ return true; } });
