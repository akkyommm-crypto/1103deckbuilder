/* S03-U424: D・ライトン, エクストラ・ヴェーラー, ライフ・ストリーム・ドラゴン, ブラックフェザー・ドラゴン (NOT_STARTED cards that replace effect damage, carddata texts; the LP rule layer of S03 v18).

   D・ライトン          （チューナー）このカードはこのカードの表示形式によって以下の効果を得る。●攻撃表示：このカードがフィールド上に表側表示で存在する限り、相手のカードの効果によって発生する自分への効果ダメージは代わりに相手が受ける。●守備表示：このカードが戦闘によって破壊され墓地へ送られた時、このターン戦闘によって発生する自分への戦闘ダメージは0になる。
   エクストラ・ヴェーラー  相手がモンスターを特殊召喚した時、手札からこのカードを特殊召喚する事ができる。この効果で特殊召喚したターン、相手のカードの効果によって発生する自分への効果ダメージは代わりに相手が受ける。
   ライフ・ストリーム・ドラゴン  （シンクロ・チューナー）チューナー＋「パワー・ツール・ドラゴン」。このカードがシンクロ召喚に成功した時、自分のライフポイントを4000にする事ができる。このカードがフィールド上に表側表示で存在する限り、自分が受ける効果ダメージは0になる。また、フィールド上に表側表示で存在するこのカードが破壊される場合、代わりに自分の墓地に存在する装備魔法カード1枚をゲームから除外する事ができる。
   ブラックフェザー・ドラゴン  （シンクロ）①：自分が効果ダメージを受ける場合、代わりにこのカードに黒羽カウンターを1つ置く。②：このカードの攻撃力は、このカードの黒羽カウンターの数×700ダウンする。③：1ターンに1度、このカードの黒羽カウンターを全て取り除き、相手フィールドの表側表示モンスター1体を対象として発動できる。その相手モンスターの攻撃力は取り除いた黒羽カウンターの数×700ダウンし、ダウンした数値分のダメージを相手に与える。

   Notes
   - NEW engine (S03-U424): continuous.lpChange may return {delta, redirectTo} (engine/1H resolveLpChangeV18 copies redirectTo to the LP action: the amount is dealt to the other player); destroySubstituteS03 {kind:'banishGrave', anyKind:true} may banish a non-monster Graveyard card (engine/1ZV).
   - 「相手のカードの効果によって発生する」 = the LP action's byPlayer (the player of the resolving chain link) is the opponent of the protected player.
   - ライトン: continuous lpChange while face-up in Attack Position (redirect to the opponent); a forced Graveyard trigger for the Defense Position (graveInfo.battle && pos 'def') adds the LP rule {cause 'battle', 'prevent'} for the turn.
   - ヴェーラー: optional onSpecialSummon hand trigger on the OPPONENT's Special Summon (onOtherSummon) → API.specialSummon + API.addLpRule({cause 'effect', mode 'redirect', toPlayer opponent, originPlayer opponent, turns 0}).
   - ライフ・ストリーム: optional onSpecialSummon trigger of its own Synchro Summon (specialSummonKind 'synchro') sets my LP to 4000 (an LP action with no cause); continuous lpChange → 0 for effect damage to me; the Equip Spell banish substitute (anyKind).
   - ブラックフェザー: continuous lpChange puts a 「黒羽」 counter on the card (self.counters) and returns 0; continuous apply ATK −700 per counter; the once-per-turn ignition removes all counters, lowers a face-up opponent monster by 700 x n (v4RegisterStatModifier) and deals the lowered amount. */

function u424Foe(p){ return p===0 ? 1 : 0; }
function u424Burn(info, self, who){   /* effect damage dealt to the controller of `self` by a card of the OTHER player */
  const loc = locateCardAnyV4(self); if(!loc || loc.zone!=='mz' || self.face!=='up') return null;
  if(info.cause!=='effect' || !(info.delta<0) || info.player!==loc.p) return null;
  return loc;
}

/* ---- D・ライトン ---- */
defineUnifiedCardV4('D・ライトン', [{
  key:'def-guard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){
    const e = ctx.event || {}, g = ctx.card.graveInfo;
    return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && g.face==='up' && g.pos==='def' && Number(g.turn)===Number(gameState.turn);
  },
  operation(ctx){ API.addLpRule({player:ctx.player, cause:'battle', mode:'prevent', turns:0, label:'D・ライトン'}); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'],
  passive:{ onSendToGrave(ctx){ const e = ctx.event || {}, g = ctx.card.graveInfo; return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && g.face==='up' && g.pos==='def' && Number(g.turn)===Number(gameState.turn); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    lpChange(info, self){
      const loc = u424Burn(info, self); if(!loc || self.pos!=='atk' || info.byPlayer!==u424Foe(loc.p)) return null;
      return {delta:info.delta, redirectTo:u424Foe(loc.p)};
    } } });

/* ---- エクストラ・ヴェーラー ---- */
function u424Veiler(ctx){ const e = ctx.event || {}; return ctx.zone==='hand' && e.player===ctx.opponent; }
defineUnifiedCardV4('エクストラ・ヴェーラー', [{
  key:'hand-ss', type:EFFECT_TYPE.TRIGGER, range:LOCATION.HAND, speed:1, events:['onSpecialSummon'],
  condition(ctx){
    if(!u424Veiler(ctx)){ ctx.reason = '相手がモンスターを特殊召喚した時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='hand' || me.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    if(API.specialSummon(ctx.player, 'hand', me.index, 'atk', 'エクストラ・ヴェーラー'))
      API.addLpRule({player:ctx.player, cause:'effect', mode:'redirect', toPlayer:ctx.opponent, originPlayer:ctx.opponent, turns:0, label:'エクストラ・ヴェーラー'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['hand'], onOtherSummon:true, includesSpecialSummon:true,
  passive:{ onSpecialSummon(ctx){ return u424Veiler(ctx) && hasMonsterZoneSpace(ctx.player); } } });

/* ---- ライフ・ストリーム・ドラゴン ---- */
function u424OwnSynchro(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card) && ctx.card.specialSummonKind==='synchro'; }
defineUnifiedCardV4('ライフ・ストリーム・ドラゴン', [{
  key:'lp4000', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ if(!u424OwnSynchro(ctx)){ ctx.reason = 'シンクロ召喚に成功した時に発動します'; return false; } return true; },
  operation(ctx){ const lp = API.me(ctx).lp; if(lp!==4000) act({type:'LP', player:ctx.player, delta:4000-lp}); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onSpecialSummon(ctx){ return u424OwnSynchro(ctx); } },
  destroySubstituteS03:{kind:'banishGrave', anyKind:true, causes:['battle','effect'], filter:c=>dbOf(c).k==='s' && dbOf(c).sub==='装備'},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    lpChange(info, self){ return u424Burn(info, self) ? 0 : null; } } });

/* ---- ブラックフェザー・ドラゴン ---- */
function u424Feathers(card){ return (card && card.counters && Number(card.counters['黒羽'])) || 0; }
defineUnifiedCardV4('ブラックフェザー・ドラゴン', [{
  key:'feather-bolt', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u424Feathers(ctx.card)){ ctx.reason = '黒羽カウンターが乗っていません'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card); if(!me || !u424Feathers(me.card)){ done(false); return; }
    const n = u424Feathers(me.card);
    API.setCardFlag(me, 'u424Taken', n, 'ブラックフェザー・ドラゴン', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); API.removeCounter(me2, '黒羽', n); done(true);
  },
  target(ctx, done){ API.selectCard('ブラックフェザー・ドラゴン：攻撃力を下げる相手の表側表示モンスター', API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(!t || t.zone!=='mz' || t.card.face!=='up') return;
    const me = locateCardAnyV4(ctx.card), n = Number(me && me.card.u424Taken) || 0, before = curATK(t.card);
    v4RegisterStatModifier(t, {atk:-700*n}, {code:'ブラックフェザー・ドラゴン', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
    const lowered = Math.max(0, before - Math.max(0, curATK(t.card)));
    if(lowered>0) API.damageLP(ctx.opponent, lowered, 'ブラックフェザー・ドラゴン');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], countLimit:{n:1, effects:['feather-bolt']}, targets:true,
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){ return (card===self && self.face==='up' && u424Feathers(self)>0) ? {atk:-700*u424Feathers(self)} : null; },
    lpChange(info, self){
      if(!u424Burn(info, self)) return null;
      self.counters = Object.assign({}, self.counters || {}, {'黒羽': u424Feathers(self) + 1});
      return 0;
    } } });
