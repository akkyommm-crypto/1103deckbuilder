/* S03-U330: three 「ヴァイロン」 monsters that turn into Equip Cards (carddata texts; 「ヴァイロン」 = GROUP.VYLON): ステラ, プリズム, ハプト.

   ヴァイロン・ステラ   このカードがモンスターカードゾーン上から墓地へ送られた場合、500ライフポイントを払う事で、このカードを装備カード扱いとして自分フィールド上のモンスター1体に装備する。このカードが装備カード扱いとして
                       装備されている場合、装備モンスターと戦闘を行った相手モンスターを、そのダメージステップ終了時に破壊する。
   ヴァイロン・プリズム このカードがモンスターカードゾーン上から墓地へ送られた場合、500ライフポイントを払って発動できる。このカードを装備カード扱いとして自分フィールド上のモンスター1体に装備する。このカードが装備カード扱いとして
                       装備されている場合、装備モンスターが戦闘を行うダメージステップの間、その攻撃力は1000ポイントアップする。
   ヴァイロン・ハプト   1ターンに1度、自分フィールド上の装備カード扱いの「ヴァイロン」と名のついたモンスターカード1枚を選択し、表側守備表示で特殊召喚できる。この効果で特殊召喚したモンスターは、フィールド上から離れた場合ゲームから除外される。

   Notes
   - 「モンスターカードゾーン上から墓地へ送られた場合」: graveInfo.from 'mz' this turn; the 500 LP is the cost (not payable below 500 LP); the host is chosen at resolution among my face-up monsters and the card is equipped from the Graveyard with API.equipFromGrave (System v31:
     a monster-equip, equipTo.sourceUid = this card). Stella's 500 LP clause is a forced-looking 「払う事で」 effect, offered as an optional trigger (it costs LP).
   - ステラ: forced trigger at the end of the Damage Step (dsTiming 'end') from the Spell & Trap Zone when the host battled a monster that is still on the field. プリズム: continuous modifier of the host while a Damage Step with it is open.
   - ハプト: ignition once per turn: an own monster-equip of a 「ヴァイロン」 is unequipped and Special Summoned face-up Defense (it keeps no equip link), flagged banishWhenLeavesField (as ガナシア).
   - Left: ヴァイロン・テトラ (an optional destruction substitute granted by an Equip Card), スフィア (②'s cost sends the card away before its target is chosen), ポリトープ (multiple targets at activation), ヴァンガード (the equip count at the destruction), the Synchro Monsters / Spells. */

function u330Vylon(c){ return !!c && isCardInGroupV4(c, GROUP.VYLON); }
function u330SentFromField(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && Number(g.turn)===Number(gameState.turn);
}
function u330Hosts(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
function u330EquipEffect(label){
  return { key:'to-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'],
    condition(ctx){
      if(!u330SentFromField(ctx)){ ctx.reason = 'モンスターゾーンから墓地へ送られた場合に発動します'; return false; }
      if(API.me(ctx).lp<500){ ctx.reason = 'ライフポイントが足りません'; return false; }
      if(!u330Hosts(ctx).length){ ctx.reason = '装備する自分のモンスターがいません'; return false; }
      if(gameState.players[ctx.player].sz.length>=ZONE_LIMITS.sz){ ctx.reason = '魔法・罠ゾーンが一杯です'; return false; }
      return true;
    },
    cost(ctx, done){ if(API.me(ctx).lp<500){ done(false); return; } API.payCost(ctx.player, 500, label); done(true); },
    operation(ctx){
      const pool = u330Hosts(ctx); if(!pool.length) return;
      API.selectCard(label+'：装備する自分のモンスター', pool, t=>{
        const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
        if(r && r.zone==='mz' && r.p===ctx.player && r.card.face==='up' && me && me.zone==='grave') API.equipFromGrave(ctx.player, me, r, label, ctx.card.uid, ctx.chainId);
      });
    },
    afterResolve(){} };
}
function u330EquipPassive(){ return { onSendToGrave(ctx){ return u330SentFromField(ctx) && API.me(ctx).lp>=500 && u330Hosts(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; } }; }
function u330Host(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.v46MonsterEquip!==true || !ctx.card.equipTo) return null;
  const h = findCardByUid(ctx.card.equipTo.uid);
  return (h && h.zone==='mz') ? h : null;
}

/* ---- ステラ ---- */
function u330StellaFoe(ctx){
  const host = u330Host(ctx), b = gameState.battle;
  if(!host || !b || b.target==='direct' || b.battled!==true) return null;
  const other = b.atkUid===host.card.uid ? b.targetUid : (b.targetUid===host.card.uid ? b.atkUid : null);
  const f = other!=null ? findCardByUid(other) : null;
  return (f && f.zone==='mz') ? f : null;
}
defineUnifiedCardV4('ヴァイロン・ステラ', [u330EquipEffect('ヴァイロン・ステラ'), {
  key:'destroy-battler', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u330StellaFoe(ctx); },
  operation(ctx){ const f = u330StellaFoe(ctx); if(f) API.destroy(f, 'ヴァイロン・ステラ'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], dsTiming:'end', activateFrom:['mz','grave','sz'],
  passive:Object.assign(u330EquipPassive(), { onDamageStep(ctx){ return !!u330StellaFoe(ctx); } })});

/* ---- プリズム ---- */
defineUnifiedCardV4('ヴァイロン・プリズム', [u330EquipEffect('ヴァイロン・プリズム')], {type:'monster', priority:1, timing:['free'], activateFrom:['mz','grave','sz'],
  passive:u330EquipPassive(),
  continuous:{ scope:'allMonsters', from:['sz'],
    apply(card, self){
      if(!self || self.v46MonsterEquip!==true || !self.equipTo || card.uid==null || self.equipTo.uid!==card.uid) return null;
      const b = gameState.battle;
      if(!b || !a5InDamageStep() || (b.atkUid!==card.uid && b.targetUid!==card.uid)) return null;
      return {atk:1000};
    } }});

/* ---- ハプト ---- */
function u330EquippedVylons(ctx){ return API.fieldCards({player:ctx.player, zone:'sz', filter:x=>x.card.v46MonsterEquip===true && x.db.k==='m' && u330Vylon(x.card)}); }
defineUnifiedCardV4('ヴァイロン・ハプト', [{
  key:'summon-equipped', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.SZONE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u330EquippedVylons(ctx).length){ ctx.reason = '装備カード扱いの「ヴァイロン」モンスターがありません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('ヴァイロン・ハプト：特殊召喚する装備カード扱いの「ヴァイロン」', u330EquippedVylons(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='sz' || r.p!==ctx.player || r.card.v46MonsterEquip!==true || !hasMonsterZoneSpace(ctx.player)) return;
    const u = r.card.uid != null ? r.card.uid : ensureCardUid(gameState, r.card);
    API.unequip(r, 'ヴァイロン・ハプト');
    const now = findCardByUid(u);
    if(!now || now.zone!=='sz') return;
    API.specialSummon(ctx.player, 'sz', now.index, 'def', 'ヴァイロン・ハプト');
    const m = findCardByUid(u);
    if(m && m.zone==='mz') API.setCardFlag(m, 'banishWhenLeavesField', true, 'ヴァイロン・ハプト', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, includesSpecialSummon:true, countLimit:{n:1, effects:['summon-equipped']}});
