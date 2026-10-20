/* S03-U398: 聖なるあかり, 召喚僧サモンプリースト, デコイドラゴン (NOT_STARTED cards, carddata texts).

   聖なるあかり        このカードは闇属性モンスターとの戦闘では破壊されず、その戦闘によって発生する自分への戦闘ダメージは0になる。また、このカードがフィールド上に表側表示で存在する限り、闇属性モンスターは攻撃宣言できず、お互いに闇属性モンスターを召喚・特殊召喚できない。
   召喚僧サモンプリースト  ①:このカードが召喚・反転召喚に成功した場合に発動する。このカードを守備表示にする。②:このカードがモンスターゾーンに存在する限り、このカードはリリースできない。③:1ターンに1度、手札から魔法カード1枚を捨てて発動できる。デッキからレベル4モンスター1体を特殊召喚する。この効果で特殊召喚したモンスターはこのターン攻撃できない。
   デコイドラゴン      ①:このカードが攻撃対象に選択された場合、自分の墓地のレベル7以上のドラゴン族モンスター1体を対象として発動する。そのモンスターを特殊召喚し、攻撃対象をそのモンスターに移し替えてダメージ計算を行う。

   Notes
   - あかり: protectV21 {battle(target, src, ctx)} reads ctx.opponentCard (DARK partner); continuous.battleDamage zeroes the damage to its controller from such a battle; continuous cannotAttack on every DARK monster; summonLockS03 for Normal and Special Summons of DARK monsters of both players (Flip Summon is not 「召喚」).
   - サモンプリースト: forced onNormalSummon / Flip Summon trigger (FX_SET_STATE pos def); ② is the existing noAdvanceTributeS03 key (Tribute for an Advance Summon) - a Release as an effect cost is not intercepted (documented limit); ③ once-per-turn ignition with a Spell discard cost, the summoned monster gets the cannotAttackTurn stamp.
   - デコイドラゴン: optional trigger on the opponent's attack declaration at itself (u345SelfTargeted of S03-U345) + API.redirectAttack({targetUid}) as 宝玉獣 アンバー・マンモス (S03-U240). */

/* ---- 聖なるあかり ---- */
function u398Dark(card){ return !!card && dbOf(card).at==='闇'; }
defineScript('聖なるあかり', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  protectV21:{ key:'u398.akari', label:'聖なるあかり', battle:(target, src, ctx)=> !!ctx && u398Dark(ctx.opponentCard) },
  summonLockS03:(i)=> i.db.at==='闇' && (i.kind==='normal' || i.kind==='special'),
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(target, self){ return !!self && self.face==='up' && u398Dark(target); },
    battleDamage(info){
      const s = info && info.self; if(!s || s.face!=='up') return info.amount;
      const h = findCardByUid(s.uid); if(!h || h.p!==info.to) return info.amount;
      const other = info.atkCard===s ? info.defCard : (info.defCard===s ? info.atkCard : null);
      return (other && u398Dark(other)) ? 0 : info.amount;
    } }
});

/* ---- 召喚僧サモンプリースト ---- */
function u398PriestSummoned(ctx, flip){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || !(e.uid===ctx.card.uid || e.card===ctx.card)) return false;
  if(flip && !e.flipSummon) return false;
  return ctx.card.pos!=='def';
}
function u398Defend(key, ev, flip){
  return {
    key, type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:[ev], forced:true,
    condition(ctx){ return u398PriestSummoned(ctx, flip); },
    operation(ctx){
      const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz' || h.card.face!=='up' || h.card.pos==='def') return;
      act({type:'FX_SET_STATE', player:h.p, zone:h.zone, index:h.index, pos:'def', reason:'召喚僧サモンプリースト'});
    },
    afterResolve(){}
  };
}
function u398Spells(p){ return API.pileCards(p, 'hand', x=>x.db.k==='s'); }
function u398Lv4(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && Number(x.db.lv)===4 && canEffectSpecialSummonS03(x.card, 'deck', '召喚僧サモンプリースト')); }
defineUnifiedCardV4('召喚僧サモンプリースト', [u398Defend('defend', 'onNormalSummon', false), u398Defend('defend-flip', 'onFlip', true), {
  key:'call', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u398Spells(ctx.player).length){ ctx.reason = '手札に魔法カードがありません'; return false; }
    if(!u398Lv4(ctx.player).length){ ctx.reason = 'デッキに特殊召喚できるレベル4モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u398Spells(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('召喚僧サモンプリースト：捨てる手札の魔法カード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, '召喚僧サモンプリースト（コスト）'); done(true);
    });
  },
  operation(ctx){
    const pool = u398Lv4(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('召喚僧サモンプリースト：特殊召喚するレベル4モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='deck' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      if(!API.specialSummon(ctx.player, 'deck', r.index, 'atk', '召喚僧サモンプリースト')) return;
      const h = findCardByUid(uid); if(h && h.zone==='mz') API.setCardFlag(h, 'cannotAttackTurn', gameState.turn, '召喚僧サモンプリースト', {silent:true});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, noAdvanceTributeS03:true, countLimit:{n:1, effects:['call']}, timing:['free'],
  passive:{ onNormalSummon(ctx){ return u398PriestSummoned(ctx, false); }, onFlip(ctx){ return u398PriestSummoned(ctx, true); } } });

/* ---- デコイドラゴン ---- */
function u398DecoyTargeted(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && !!a && a.player===ctx.opponent && a.targetUid!=null && a.targetUid===ctx.card.uid;
}
function u398Dragons(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='ドラゴン' && Number(x.db.lv)>=7 && canEffectSpecialSummonS03(x.card, 'grave', 'デコイドラゴン')); }
defineUnifiedCardV4('デコイドラゴン', [{
  key:'decoy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u398DecoyTargeted(ctx) && u398Dragons(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); },
  target(ctx, done){ API.selectCard('デコイドラゴン：特殊召喚するレベル7以上のドラゴン族モンスター', u398Dragons(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    if(!API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'デコイドラゴン')) return;
    const h = findCardByUid(uid); if(h && h.zone==='mz') API.redirectAttack({targetUid:uid});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['free'],
  passive:{ onAttackDeclare(ctx){ return u398DecoyTargeted(ctx) && u398Dragons(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } } });
