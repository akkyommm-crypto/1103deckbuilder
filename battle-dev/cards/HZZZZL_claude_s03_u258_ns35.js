/* S03-U258: NOT_STARTED cards (2011 texts) — パルキオンのうろこ, ナチュル・ナーブ, ナチュル・サンフラワー, 暗黒の眠りを誘うルシファー, ソードハンター,
   霞の谷の雷鳥, 地獄からの使い.
   Reuses: API.lingerS03 + continuous.from:['linger'] + forbidTrapActivation (S03-U257 / engine/1ZH), declareActivationResponseS03 (engine/1P) with
   passive.onActivateSuccess and API.negateChainLink (トラップ処理班 Aチーム, S03-U252), a forced selected-target trigger (竜殺者 shape) with the zone-local
   mark stLinkTargetS03 (engine ZONE_LOCAL_KEYS) read by continuous.cannotAttack, battleAttacksRecordV6 + graveInfo.battle + API.equipFromGrave (System v31)
   with continuous atk, a forced onLeaveField (toZone:'hand') trigger from the hand (ナーガ shape), cannotAttackTurn, and a System v23 normalSummonProcedure
   method with baseStats + continuous.setLevel (engine/1F).
   「ナチュル」 = SETCODE.NATURIA (monsters only here). All helper names carry the S258 suffix (unique across cards/ and engine/). */

function naturiaMonsterDbS258(db){ return !!db && db.k === 'm' && isSetCardV4(db, SETCODE.NATURIA); }

/* ---- パルキオンのうろこ (Normal Spell): 自分フィールド上に「ナチュル」と名のついたモンスターが表側表示で存在する場合のみ発動できる。このターン、相手は罠カードを発動できない。
   (the used card registers itself as a lingering source for this turn (API.lingerS03, S03-U257) with a turn stamp; no Graveyard-source continuous effect) ---- */
function parkionNaturiaUpS258(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && naturiaMonsterDbS258(x.db)}).length > 0;
}
defineScript('パルキオンのうろこ', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(!parkionNaturiaUpS258(ctx.player)){ ctx.reason = '自分フィールドに表側表示の「ナチュル」モンスターが存在しません'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u258ParkionTurn', gameState.turn, 'パルキオンのうろこ');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'パルキオンのうろこ');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['linger'], apply(){ return null; },
    forbidTrapActivation(card, self, p){
      if(!self || Number(self.u258ParkionTurn) !== Number(gameState.turn)) return false;
      const loc = locateCardAnyV4(self);
      return !!loc && (p === 0 || p === 1) && p !== loc.p;
    } }
});

/* ---- ナチュル・ナーブ / ナチュル・サンフラワー: …とき、自分フィールド上の「ナチュル」と名のついたモンスター1体とこのカードをリリースして発動できる。その発動を無効にし破壊する。
   (quick effect, engine/1P declared chain response; the other 「ナチュル」 must be face-up (a face-down monster has no name) and is a different card from this one;
    the cost releases both, this card face-up on the field) ---- */
function naturiaOthersS258(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card !== ctx.card && x.card.face==='up' && naturiaMonsterDbS258(x.db)});
}
function naturiaFaceUpMzS258(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function naturiaReleaseCostS258(ctx, done, label){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone!=='mz' || me.card.face!=='up'){ done(false); return; }
  API.selectCard(label + '：リリースする「ナチュル」', naturiaOthersS258(ctx), t=>{
    const h = t && t.card ? findCardByUid(ensureCardUid(gameState, t.card)) : null;
    if(!h || h.zone!=='mz' || h.p!==ctx.player){ done(false); return; }
    API.sendToGrave(h, label + '（リリース）');
    const me2 = locateCardAnyV4(ctx.card);
    if(!me2 || me2.zone!=='mz'){ done(false); return; }
    API.sendToGrave(me2, label + '（リリース）');
    done(true);
  });
}
function nerveEventOkS258(ctx){
  const e = ctx.event;
  return !!e && (e.kind==='spell' || e.kind==='trap') && e.player===ctx.opponent && naturiaOthersS258(ctx).length > 0;
}
defineScript('ナチュル・ナーブ', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'],
  condition(ctx){
    if(!naturiaFaceUpMzS258(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    if(!ctx.event || (ctx.event.kind!=='spell' && ctx.event.kind!=='trap') || ctx.event.player!==ctx.opponent){ ctx.reason = '相手が魔法・罠カードを発動した時に発動します'; return false; }
    if(!naturiaOthersS258(ctx).length){ ctx.reason = 'リリースする他の表側表示の「ナチュル」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ naturiaReleaseCostS258(ctx, done, 'ナチュル・ナーブ'); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ナチュル・ナーブ', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return naturiaFaceUpMzS258(ctx) && nerveEventOkS258(ctx); } }
});
function sunflowerEventOkS258(ctx){
  const e = ctx.event;
  return !!e && e.kind==='monster' && e.player===ctx.opponent && naturiaOthersS258(ctx).length > 0;
}
defineScript('ナチュル・サンフラワー', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'],
  condition(ctx){
    if(!naturiaFaceUpMzS258(ctx)){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    if(!ctx.event || ctx.event.kind!=='monster' || ctx.event.player!==ctx.opponent){ ctx.reason = '相手の効果モンスターの効果が発動した時に発動します'; return false; }
    if(!naturiaOthersS258(ctx).length){ ctx.reason = 'リリースする他の表側表示の「ナチュル」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ naturiaReleaseCostS258(ctx, done, 'ナチュル・サンフラワー'); },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ナチュル・サンフラワー', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return naturiaFaceUpMzS258(ctx) && sunflowerEventOkS258(ctx); } }
});
declareActivationResponseS03(['ナチュル・ナーブ', 'ナチュル・サンフラワー']);

/* ---- 暗黒の眠りを誘うルシファー: 召喚・反転召喚した時、相手のフィールド上モンスター1体を選択する。選択したモンスターはこのカードがフィールド上に表側表示で存在する限り、攻撃をする事ができない。
   (forced trigger with a selected target (竜殺者 shape); the link is the zone-local mark stLinkTargetS03 on this card (cleared when it leaves the field),
    journaled by API.setCardFlag; continuous.cannotAttack reads it only while this card is face-up in the Monster Zone. 召喚 = Normal Summon, not Special Summon) ---- */
function luciferFoesS258(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz'}); }
function luciferSelfEventS258(ctx){
  return !!ctx.event && ctx.event.card===ctx.card && ctx.card.face==='up' && (ctx.eventName!=='onFlip' || !!ctx.event.flipSummon);
}
defineUnifiedCardV4('暗黒の眠りを誘うルシファー', [{
  key:'summon-no-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'opponent', speed:1,
  events:['onNormalSummon', 'onFlip'],
  condition(ctx){
    if(!luciferSelfEventS258(ctx)){ ctx.reason = '召喚・反転召喚に成功した時に発動します'; return false; }
    if(!luciferFoesS258(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('暗黒の眠りを誘うルシファー：攻撃できなくする相手モンスター', luciferFoesS258(ctx), t=>done([t])); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(!me || me.zone!=='mz' || me.card.face!=='up' || !t || t.zone!=='mz' || t.p===me.p || t.card.uid==null) return;
    API.setCardFlag(me, 'stLinkTargetS03', t.card.uid, '暗黒の眠りを誘うルシファー', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true,
    passive:{
      onNormalSummon(ctx){ return luciferSelfEventS258(ctx) && luciferFoesS258(ctx).length > 0; },
      onFlip(ctx){ return luciferSelfEventS258(ctx) && luciferFoesS258(ctx).length > 0; }
    },
    continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
      cannotAttack(target, self){
        return !!target && !!self && self.face==='up' && self.stLinkTargetS03!=null && target.uid===self.stLinkTargetS03 && target!==self;
      } } });

/* ---- ソードハンター: このカードが戦闘によってモンスターを破壊したバトルフェイズ終了時、墓地に存在するそのモンスターを攻撃力200ポイントアップの装備カード扱いとしてこのカードに装備する。
   (forced trigger at the end of the Battle Phase; the destroyed monsters are read from the finished phase's attack record (battleAttacksRecordV6, S03-U236)
    with graveInfo.battle of this turn — a monster that was destroyed by an effect, or already left the Graveyard, is not equipped; as many as fit in the
    Spell & Trap Zone; ATK +200 per Equip Card equipped by this card) ---- */
function swordHunterVictimsS258(card){
  const uid = card && card.uid, out = [];
  if(uid == null) return out;
  battleAttacksRecordV6(gameState).forEach(x=>{
    if(!x) return;
    const v = x.attackerUid===uid ? x.defenderUid : (x.defenderUid===uid ? x.attackerUid : null);
    if(v==null || out.indexOf(v)>=0) return;
    const h = findCardByUid(v), g = h && h.card && h.card.graveInfo;
    if(h && h.zone==='grave' && dbOf(h.card).k==='m' && g && g.battle===true && Number(g.turn)===Number(gameState.turn)) out.push(v);
  });
  return out;
}
function swordHunterReadyS258(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  const host = locateCardAnyV4(ctx.card);
  if(!host || host.zone!=='mz') return false;
  return swordHunterVictimsS258(ctx.card).some(u=>{ const e = findCardByUid(u); return !!e && graveEquipLegalV31(gameState, ctx.player, e, host); });
}
defineUnifiedCardV4('ソードハンター', [{
  key:'bp-end-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'],
  condition(ctx){ if(!swordHunterReadyS258(ctx)){ ctx.reason = '戦闘で破壊したモンスターが墓地にいません'; return false; } return true; },
  operation(ctx){
    swordHunterVictimsS258(ctx.card).forEach(u=>{
      const host = locateCardAnyV4(ctx.card), eq = findCardByUid(u);
      if(host && host.zone==='mz' && host.card.face==='up' && eq && eq.zone==='grave')
        API.equipFromGrave(ctx.player, eq, host, 'ソードハンター', ctx.card.uid, ctx.chainId);
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true,
    passive:{ onBattlePhaseEnd(ctx){ return swordHunterReadyS258(ctx); } },
    continuous:{ scope:'self', from:['mz'],
      apply(card, self){
        if(card!==self || card.face!=='up') return null;
        const n = equipsOnV15(card, gameState).filter(x=>x.card.v46MonsterEquip===true && x.card.equipTo && x.card.equipTo.sourceUid===card.uid).length;
        return n ? {atk:200*n} : null;
      } } });

/* ---- 霞の谷の雷鳥: フィールド上に表側表示で存在するこのカードが手札に戻った時、このカードを自分フィールド上に特殊召喚する。この効果で特殊召喚したターン、このカードは攻撃できない。
   (forced trigger from the hand on onLeaveField (toZone 'hand'); special summoned in Attack Position — the text names no position and the engine offers no
    choice here; the turn's attack ban is the zone-local cannotAttackTurn stamp) ---- */
function raichouReturnedS258(ctx){
  const e = ctx.event || {};
  return eventIsSelfS03(ctx) && e.toZone==='hand' && e.fromZone==='mz' && e.fromFace==='up';
}
defineScript('霞の谷の雷鳥', {
  type:'monster', priority:1, forced:true, activateFrom:['hand'], blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.eventName!=='onLeaveField' || !raichouReturnedS258(ctx)){ ctx.reason = 'フィールドの表側表示から手札に戻った場合に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='hand' || h.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'hand', h.index, 'atk', '霞の谷の雷鳥');
    const m = locateCardAnyV4(ctx.card);
    if(m && m.zone==='mz') API.setCardFlag(m, 'cannotAttackTurn', gameState.turn, '霞の谷の雷鳥', {silent:true});
  },
  afterResolve(){},
  passive:{ onLeaveField(ctx){ return ctx.zone==='hand' && raichouReturnedS258(ctx); } }
});

/* ---- 地獄からの使い: このカードは特殊召喚できない。このカードはモンスター1体をリリースして召喚できる。この方法で召喚したこのカードのレベルは5になり、元々の攻撃力・守備力は半分になる。
   (System v23 normalSummonProcedure: a 1-Tribute Normal Summon method (the standard 2-Tribute Summon stays available); original ATK/DEF 2600/1800 → 1300/900
    through baseStats (lost face-down / negated, as the other methods); Level 5 through continuous.setLevel while it is face-up, un-negated and was summoned
    by that method (card.normalSummonMethod is zone-local). A Set is not a 「召喚」, so the method offers no Set) ---- */
defineScript('地獄からの使い', {
  type:'monster', priority:1, cannotSpecialSummon:true,
  normalSummonProcedure:{
    includeStandard:true,
    methods:[{id:'jigokuMsgS258', tributes:1, modes:['summon'],
      summonLabel:'1体リリースして召喚（レベル5・元々の攻撃力・守備力は半分）',
      baseStats:{atk:1300, def:900}, loseOnFaceDown:true, loseOnNegate:true}]
  },
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    setLevel(card, self){
      return (card===self && card.face==='up' && card.normalSummonMethod==='jigokuMsgS258' && !effectNegated(card)) ? 5 : null;
    } }
});
