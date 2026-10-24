/* S03-U313: ユニオンモンスター (Union Monsters) — the common mechanism `declareUnionS03` and the first nine cards (carddata texts, classic wording).

   Common text of the classic Unions:
     1ターンに1度だけ自分のメインフェイズに装備カード扱いとして自分の「X」に装備、または装備を解除して表側攻撃表示で特殊召喚する事ができる。
     この効果で装備カード扱いになっている時のみ、装備モンスターの…(card effects).
     (1体のモンスターが装備できるユニオンは1枚まで。装備モンスターが［戦闘によって］破壊される場合は、代わりにこのカードを破壊する。)

   Mechanism (the monster-as-Equip engine v46: FX_MONSTER_EQUIP_V46 / API.equipMonster, API.unequip, the card sits in the Spell & Trap Zone with v46MonsterEquip / equipTo):
   - ONE effect per turn, either way (a card flag unionTurnS03 stamps the turn, as アームズ・エイド does): equip itself from the Monster Zone to a valid host, or — in the Spell & Trap Zone —
     release the equip and Special Summon itself in face-up Attack Position (the text says 表側攻撃表示).
   - The host is chosen on RESOLUTION (the classic text does not target). A valid host: a face-up monster of mine, not the Union itself, matching the card's host rule, and carrying no other
     Union (「1体のモンスターが装備できるユニオンは1枚まで」).
   - While equipped (only): the stat bonus (continuous from the Spell & Trap Zone) and the card's own effects, which read the equipped monster (equipTo).
   - The substitute: 「装備モンスターが［戦闘によって］破壊される場合は、代わりにこのカードを破壊する」 — mandatory, via engine/1ZZB equipSubstituteS03 (S03-U313: the value 'battle' = only the
     destruction by battle; true = every destruction). The wording of each card is read from its own text: 戦闘によって (ドイツ, コイツ, 騎竜, 漆黒の闘龍, ゾンビタイガー, アーマー・ブレイカー) / 破壊される場合 (the others).
   - Battle triggers of the equipped monster use the Damage Step 'leave' record (the destroyed monster of this battle) and the battle damage event; they are forced triggers of the Union card in
     the Spell & Trap Zone. 「装備モンスターが戦闘によって相手モンスターを破壊した場合／度に」 = every time. */

function unionHostS03(self){
  const to = self && self.equipTo; if(!to) return null;
  const h = findCardByUid(to.uid);
  return h && h.zone==='mz' ? h : null;
}
function unionCarriedS03(hostCard, except){
  if(!hostCard || !Array.isArray(hostCard.equippedBy)) return false;
  for(const P of gameState.players) for(const c of (P.sz||[])){
    if(!c || c===except || !c.v46MonsterEquip || c.equipUid==null || hostCard.equippedBy.indexOf(c.equipUid)<0) continue;
    const sc = CARD_SCRIPTS[cardName(c)]; if(sc && sc.unionS03===true) return true;
  }
  return false;
}
/* the monster destroyed by the equipped monster in the battle whose Damage Step is at its 'leave' step */
function unionKillS03(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='sz' || ctx.card.v46MonsterEquip!==true || ctx.step!=='leave') return null;
  const h = unionHostS03(ctx.card); if(!h) return null;
  if(b.atkCard===h.card && b.destroyedDef) return b.defCard;
  if(b.defCard===h.card && b.destroyedAtk) return b.atkCard;
  return null;
}
function unionDamageS03(ctx){
  const e = ctx.event || {}, h = unionHostS03(ctx.card);
  return ctx.zone==='sz' && ctx.card.v46MonsterEquip===true && !!h && Number(e.amount)>0 && e.player===ctx.opponent && (e.attackerUid===h.card.uid || e.defenderUid===h.card.uid);
}
const UNION_PASSIVE_KILL = ctx=>!!unionKillS03(ctx);
const UNION_PASSIVE_DAMAGE = ctx=>unionDamageS03(ctx);

/* spec: {host(x), atk, def, substitute:'battle'|'any', targeted:false, effects:[…], continuous:{…}, passive:{…}, script:{…}}; x = a field handle of the candidate host
   S03-U469: targeted:true — the 「①:」 wording 「自分フィールドの…1体を対象とし、このカードを装備カード扱いとしてそのモンスターに装備する」: the host is a TARGET chosen on activation (a chain link that records it);
   if the target is gone or no longer a valid host on resolution the equip does not happen. 「1ターンに1度…発動できる」 is spent by the ACTIVATION (the use flag is stamped in the cost),
   so a response that removes the host does not give a second use. The default (false) keeps the host choice on resolution of the classic wording (S03-U313). */
function declareUnionS03(name, spec){
  const S = Object.assign({atk:0, def:0, substitute:'battle', targeted:false, effects:[], continuous:{}, passive:{}, script:{}}, spec||{});
  const pool = ctx=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.k==='m' && !unionCarriedS03(x.card, ctx.card) && S.host(x)});
  const mainPhase = ()=>gameState.phase==='main1' || gameState.phase==='main2';
  const stampCost = (ctx, done)=>{ const h = locateCardAnyV4(ctx.card); if(h) API.setCardFlag(h, 'unionTurnS03', gameState.turn, name, {silent:true}); done(true); };
  const effects = [Object.assign({
    key:'union-equip', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'モンスターゾーンに表側表示で存在する必要があります'; return false; }
      if(ctx.player!==gameState.activePlayer || !mainPhase()){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
      if(Number(ctx.card.unionTurnS03)===gameState.turn){ ctx.reason = 'このターンは既に効果を使用しています'; return false; }
      if(gameState.players[ctx.player].sz.length>=ZONE_LIMITS.sz){ ctx.reason = '魔法・罠ゾーンが一杯です'; return false; }
      if(!pool(ctx).length){ ctx.reason = '装備できるモンスターがいません'; return false; }
      return true;
    },
    operation(ctx){
      const self = locateCardAnyV4(ctx.card);
      if(!self || self.zone!=='mz') return;
      const go = t=>{
        const h = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
        if(!h || h.zone!=='mz' || h.card.face!=='up' || !me || me.zone!=='mz' || unionCarriedS03(h.card, ctx.card)) return;
        if(S.targeted && (h.p!==ctx.player || !S.host(Object.assign({db:dbOf(h.card)}, h)))) return;   /* the target must still be an own, valid host on resolution */
        API.setCardFlag(me, 'unionTurnS03', gameState.turn, name, {silent:true});
        API.equipMonster(ctx.player, me, h, name);
      };
      if(S.targeted){ go(ctx.selectedTargets && ctx.selectedTargets[0]); return; }
      const c = pool(ctx);
      if(c.length===1){ go(c[0]); return; }
      API.selectCard(`${name}：装備するモンスター`, c, go);
    },
    afterResolve(){}
  }, S.targeted ? {
    targetRange:LOCATION.MZONE, targetSide:'self', cost:stampCost,
    target(ctx, done){ API.selectCard(`${name}：装備するモンスター`, pool(ctx), t=>done([t])); }
  } : {}), Object.assign({
    key:'union-release', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
    condition(ctx){
      const h = locateCardAnyV4(ctx.card);
      if(!h || h.p!==ctx.player || h.zone!=='sz' || ctx.card.v46MonsterEquip!==true){ ctx.reason = '装備カード扱いで存在する必要があります'; return false; }
      if(ctx.player!==gameState.activePlayer || !mainPhase()){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
      if(Number(ctx.card.unionTurnS03)===gameState.turn){ ctx.reason = 'このターンは既に効果を使用しています'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      const ss = v46SpecialSummonRestrictionReason(ctx.player, dbOf(ctx.card)); if(ss){ ctx.reason = ss; return false; }
      return true;
    },
    operation(ctx){
      const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='sz') return;
      API.setCardFlag(h, 'unionTurnS03', gameState.turn, name, {silent:true});
      API.unequip(h, name);
      const now = locateCardAnyV4(ctx.card);
      if(now && now.zone==='sz') API.specialSummon(ctx.player, 'sz', now.index, 'atk', name);
    },
    afterResolve(){}
  }, S.targeted ? {cost:stampCost} : {})].concat(S.effects);
  const cont = Object.assign({
    scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self || self.v46MonsterEquip!==true || !self.equipTo || card.uid==null || self.equipTo.uid!==card.uid) return null;
      return (S.atk||S.def) ? {atk:S.atk||0, def:S.def||0} : null;
    }
  }, S.continuous);
  return defineUnifiedCardV4(name, effects, Object.assign({
    type:'monster', priority:1, unionS03:true,
    /* timing 'free': the timing is otherwise inferred from the passive hooks (onDamageStep → Damage Step only) and would refuse the Main Phase ignitions; each effect checks its own phase */
    timing:['free'],
    equipSubstituteS03: S.substitute==='any' ? true : 'battle',
    continuous:cont, passive:S.passive
  }, S.targeted ? {targets:true} : {}, S.script));
}
const unionOwnRace = ra => (x=>x.db.ra===ra);
const unionNamed = nm => (x=>x.db.n===nm);

/* ---- ドイツ: 「ソイツ」, ATK +2500 ---- */
declareUnionS03('ドイツ', {host:unionNamed('ソイツ'), atk:2500, substitute:'battle'});

/* ---- コイツ: 「アイツ」, ATK +3000, piercing ---- */
declareUnionS03('コイツ', {host:unionNamed('アイツ'), atk:3000, substitute:'battle', continuous:{
  piercingDamage(info){
    const self = info.self, h = unionHostS03(self);
    if(!h || self.v46MonsterEquip!==true || info.atkCard!==h.card || !info.defCard || info.defCard.pos!=='def') return 0;
    return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
  } }});

/* ---- 漆黒の闘龍: 「闇魔界の戦士 ダークソード」, ATK / DEF +400, piercing ---- */
declareUnionS03('漆黒の闘龍', {host:unionNamed('闇魔界の戦士 ダークソード'), atk:400, def:400, substitute:'battle', continuous:{
  piercingDamage(info){
    const self = info.self, h = unionHostS03(self);
    if(!h || self.v46MonsterEquip!==true || info.atkCard!==h.card || !info.defCard || info.defCard.pos!=='def') return 0;
    return Math.max(0, curATK(info.atkCard) - curDEF(info.defCard));
  } }});

/* ---- 騎竜: 「闇魔界の戦士 ダークソード」, ATK / DEF +900; release the equipped card → the equipped monster attacks directly this turn ---- */
declareUnionS03('騎竜', {host:unionNamed('闇魔界の戦士 ダークソード'), atk:900, def:900, substitute:'battle', effects:[{
  key:'release-direct', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    const h = locateCardAnyV4(ctx.card), host = unionHostS03(ctx.card);
    if(!h || h.zone!=='sz' || ctx.card.v46MonsterEquip!==true || !host){ ctx.reason = '装備状態で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2' || gameState.phase==='battle')){ ctx.reason = '自分のターンに発動できます'; return false; }
    return true;
  },
  cost(ctx, done){
    const h = locateCardAnyV4(ctx.card), host = unionHostS03(ctx.card);
    if(!h || h.zone!=='sz' || !host){ done(false); return; }
    API.setCardFlag(h, 'unionHostUidS03', ensureCardUid(gameState, host.card), '騎竜', {silent:true});   /* the equip link is gone once the card is in the Graveyard */
    API.sendToGrave(h, '騎竜（リリース）'); done(true);
  },
  operation(ctx){
    /* the equipped monster was recorded on the card when the cost was paid (the Union card is already in the Graveyard) */
    const host = ctx.card.unionHostUidS03!=null ? findCardByUid(ctx.card.unionHostUidS03) : null;
    if(host && host.zone==='mz' && host.card.face==='up') API.grantDirectAttack(host);
  },
  afterResolve(){}
}]});

/* ---- ゾンビタイガー: 「朽ち果てた武将」, ATK / DEF +500; every time the equipped monster destroys a monster by battle the opponent discards 1 card at random ---- */
declareUnionS03('ゾンビタイガー', {host:unionNamed('朽ち果てた武将'), atk:500, def:500, substitute:'battle',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!unionKillS03(ctx); },
    operation(ctx){ if(API.foe(ctx).hand.length) v80DiscardRandom(ctx.opponent, 1, 'ゾンビタイガー', ctx.player); },
    afterResolve(){}
  }]});

/* ---- アーマー・ブレイカー: a Warrior, when the equipped monster inflicts battle damage on the opponent → destroy 1 card on the field ---- */
declareUnionS03('アーマー・ブレイカー', {host:unionOwnRace('戦士'), substitute:'battle',
  passive:{onBattleDamage:UNION_PASSIVE_DAMAGE},
  effects:[{
    key:'damage-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onBattleDamage'], forced:true,
    condition(ctx){ return unionDamageS03(ctx); },
    operation(ctx){
      const c = API.fieldCards({}).filter(x=>x.card!==ctx.card);
      if(!c.length) return;
      API.selectCard('アーマー・ブレイカー：破壊するカード', c, t=>{ const r = t && resolveTarget(t); if(r && (r.zone==='mz'||r.zone==='sz'||r.zone==='field')) API.destroy(r, 'アーマー・ブレイカー'); });
    },
    afterResolve(){}
  }]});

/* ---- トライゴン: a Machine, when the equipped monster destroys a monster by battle → Special Summon a LIGHT Machine of Level 4 or less from my Graveyard; every destruction is substituted ---- */
function unionTrigonPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='機械' && x.db.at==='光' && (x.db.lv||99)<=4 && canEffectSpecialSummonS03(x.card, 'grave', 'トライゴン')); }
declareUnionS03('トライゴン', {host:unionOwnRace('機械'), substitute:'any',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true, targetRange:LOCATION.GRAVE, targetSide:'self',
    condition(ctx){ return !!unionKillS03(ctx) && unionTrigonPool(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
    target(ctx, done){ API.selectCard('トライゴン：特殊召喚する機械族・光属性・レベル4以下のモンスター', unionTrigonPool(ctx), t=>done([t])); },
    operation(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'トライゴン', r.p);
    },
    afterResolve(){}
  }], script:{targets:true, includesSpecialSummon:true}});

/* ---- オイルメン: a Machine, when the equipped monster destroys a monster by battle → draw 1 card ---- */
declareUnionS03('オイルメン', {host:unionOwnRace('機械'), substitute:'any',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!unionKillS03(ctx); },
    operation(ctx){ API.draw(ctx.player, 1, 'オイルメン'); },
    afterResolve(){}
  }]});

/* ---- 六武衆の御霊代: a 「六武衆」, ATK / DEF +500; when the equipped monster destroys a monster by battle → draw 1 card ---- */
declareUnionS03('六武衆の御霊代', {host:x=>isCardInGroupV4(x.card, GROUP.SIX_SAMURAI_NAMED), atk:500, def:500, substitute:'any',
  passive:{onDamageStep:UNION_PASSIVE_KILL},
  effects:[{
    key:'kill-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return !!unionKillS03(ctx); },
    operation(ctx){ API.draw(ctx.player, 1, '六武衆の御霊代'); },
    afterResolve(){}
  }]});
