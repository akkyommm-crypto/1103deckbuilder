/* S03-U388: four NOT_STARTED monsters (carddata texts).

   雲魔物－羊雲            このカードが戦闘によって破壊され墓地へ送られた時、自分フィールド上に「雲魔物トークン」(天使族・水・星1・攻/守0)を2体守備表示で特殊召喚する。このトークンは「雲魔物」と名のついたカード以外の生け贄召喚のための生け贄にはできない。
   ジュラック・スタウリコ     このカードが戦闘によって破壊された場合、自分フィールド上に「ジュラックトークン」(恐竜族・炎・星1・攻/守0)2体を守備表示で特殊召喚する。このトークンは「ジュラック」と名のついたモンスター以外のアドバンス召喚のためのリリースにはできない。
   ドラグニティ－ピルム       このカードが召喚に成功した時に発動できる。手札から「ドラグニティ」と名のついた鳥獣族モンスター1体を特殊召喚し、さらにこのカードを装備カード扱いとして装備する。このカードが装備カード扱いとして装備されている場合、装備モンスターは相手プレイヤーに直接攻撃できる。この時、装備モンスターが相手ライフに与える戦闘ダメージは半分になる。
   ドラグニティアームズ－ミスティル  このカードは自分フィールド上に表側表示で存在する「ドラグニティ」と名のついたモンスター1体を墓地へ送り、手札から特殊召喚する事ができる。このカードが手札から召喚・特殊召喚に成功した時、自分の墓地に存在する「ドラグニティ」と名のついたドラゴン族モンスター1体を選択し、装備カード扱いとしてこのカードに装備する事ができる。

   Notes
   - Tokens: the new token flag advanceTributeOnlyForS03 (engine/00 TOKEN_CREATE, engine/40 createToken, engine/70 tributeCandidates, S03-U388): the token can be Tributed only for the Advance Summon of a monster whose name contains the given text
     (「雲魔物」 / 「ジュラック」), generalising noAdvanceTributeNonDarkS03 (S03-U188).
   - 羊雲 / スタウリコ: Graveyard triggers after a battle destruction (graveInfo.battle); the tokens are created for the free zones (at most 2).
   - ピルム: optional Normal Summon trigger: a 「ドラグニティ」 Winged Beast of the hand is Special Summoned, then API.equipMonster equips the Pilum itself (S03-U43 pattern). While it is an Equip card, continuous.grantsDirectAttack and a battleDamage halving
     (a direct attack of the equipped monster) apply.
   - ミスティル: summonProcedure from the hand with a face-up 「ドラグニティ」 sent to the Graveyard as the cost; after it was Normal / Special Summoned from the hand an optional equip from the Graveyard (API.equipFromGrave, helpers of S03 astra system 01: as01Pool / as01EquipOperation). */

/* ---- tokens ---- */
defineTokenSpecV11('雲魔物トークン', {atk:0, def:0, lv:1, ra:'天使', at:'水', pos:'def'});
defineTokenSpecV11('ジュラックトークン', {atk:0, def:0, lv:1, ra:'恐竜', at:'炎', pos:'def'});
function u388BattleGone(ctx){
  const e = ctx.event || {}, g = ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn);
}
function u388Room2(p){ return ZONE_LIMITS.mz - gameState.players[p].mz.length >= 2; }
function u388TokenMaker(name, token, only){
  defineUnifiedCardV4(name, [{
    key:'tokens', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'], forced:true,
    condition(ctx){ return u388BattleGone(ctx) && u388Room2(ctx.player); },
    operation(ctx){
      if(!u388Room2(ctx.player)) return;   /* two Tokens need two free Monster Zones */
      API.createToken(ctx.player, {name:token.name, atk:0, def:0, lv:1, ra:token.ra, at:token.at, pos:'def', advanceTributeOnlyForS03:only}, 2);
    },
    afterResolve(){}
  }], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'],
    passive:{ onSendToGrave(ctx){ return u388BattleGone(ctx) && u388Room2(ctx.player); }, onDestroy(ctx){ return u388BattleGone(ctx) && u388Room2(ctx.player); } } });
}
u388TokenMaker('雲魔物－羊雲', {name:'雲魔物トークン', ra:'天使', at:'水'}, '雲魔物');
u388TokenMaker('ジュラック・スタウリコ', {name:'ジュラックトークン', ra:'恐竜', at:'炎'}, 'ジュラック');

/* ---- ドラグニティ－ピルム ---- */
function u388WingedDragunity(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.ra==='鳥獣' && isSetCardV4(x.db, SETCODE.DRAGUNITY) && canEffectSpecialSummonS03(x.card, 'hand', 'ドラグニティ－ピルム')); }
function u388PilumEquipped(card, self){ return !!self && !!card && !!self.v46MonsterEquip && !!self.equipTo && self.equipTo.uid===card.uid; }
defineUnifiedCardV4('ドラグニティ－ピルム', [{
  key:'summon-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'],
  condition(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card) && hasMonsterZoneSpace(ctx.player) && u388WingedDragunity(ctx).length>0; },
  operation(ctx){
    const pool = u388WingedDragunity(ctx); if(!pool.length) return;
    API.selectCard('ドラグニティ－ピルム：特殊召喚する手札の「ドラグニティ」鳥獣族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      API.specialSummon(ctx.player, 'hand', r.index, 'atk', 'ドラグニティ－ピルム');
      const host = findCardByUid(uid), self = locateCardAnyV4(ctx.card);
      if(host && host.zone==='mz' && self && self.zone==='mz' && self.card.face==='up') API.equipMonster(ctx.player, self, host, 'ドラグニティ－ピルム');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onNormalSummon(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card) && hasMonsterZoneSpace(ctx.player) && u388WingedDragunity(ctx).length>0; } },
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    grantsDirectAttack(card, self){ return u388PilumEquipped(card, self); },
    battleDamage(info){
      const self = info && info.self, host = info && (info.atkCard) ;
      if(!self || !host || !u388PilumEquipped(host, self) || info.to===info.srcPlayer) return info.amount;
      return info.defCard ? info.amount : Math.floor(info.amount/2);
    } } });

/* ---- ドラグニティアームズ－ミスティル ---- */
function u388DragunityField(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && isSetCardV4(x.db, SETCODE.DRAGUNITY)}); }
function u388Dragon(x){ return x.db.k==='m' && x.db.ra==='ドラゴン' && isSetCardV4(x.db, SETCODE.DRAGUNITY); }
defineUnifiedCardV4('ドラグニティアームズ－ミスティル', [{
  key:'equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['onNormalSummon','onSpecialSummon'],
  condition(ctx){
    const e = ctx.event || {};
    if(!as01Face(ctx) || !(e.uid===ctx.card.uid || e.card===ctx.card)) return false;
    if(ctx.eventName!=='onNormalSummon' && ctx.card.specialSummonedFrom!=='hand') return false;
    return as01Pool(ctx, u388Dragon).length>0;
  },
  target(ctx, done){ API.selectCard('ドラグニティアームズ－ミスティル：装備するドラゴン族「ドラグニティ」', as01Pool(ctx, u388Dragon), t=>done([t])); },
  operation(ctx){ as01EquipOperation(ctx, u388Dragon); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['free'], includesSpecialSummon:true,
  passive:{ onNormalSummon(ctx){ return as01Face(ctx) && as01SelfEvent(ctx) && as01Pool(ctx, u388Dragon).length>0; },
            onSpecialSummon(ctx){ return as01Face(ctx) && as01SelfEvent(ctx) && ctx.card.specialSummonedFrom==='hand' && as01Pool(ctx, u388Dragon).length>0; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u388DragunityField(ctx).length){ ctx.reason = '自分フィールドに表側表示の「ドラグニティ」モンスターがいません'; return false; } return true; },
    cost(ctx, done){
      API.selectCard('ドラグニティアームズ－ミスティル：墓地へ送る「ドラグニティ」モンスター', u388DragunityField(ctx), t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
        API.sendToGrave(r, 'ドラグニティアームズ－ミスティル（特殊召喚の手順）'); done(true);
      });
    }
  }});
