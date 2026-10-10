/* S03-U261: NOT_STARTED cards (2011 texts) — 罰ゲーム!, 一族の掟, ヴェノム・スネーク, ヴェノム・ボア, 旋風剣, 古代の機械掌.
   Engine unchanged. Reuses: the turn-stamped skipDrawTurnS03 player flag read by the draw processor (engine/30, S03-U244) and noSpellTrapActivationS03
   (engine/1ZD, S03-U221), the option-choice + registered handler shape (凶暴化の仮面), API.declare / persistDeclaration (DNA改造手術, journaled DECLARE_V11),
   continuous.cannotAttack (engine/00), the equip-spell shape with dsTiming:'end' (ライトイレイザー, cards/A8), API.addCounter (ヴェノム・サーペント),
   cannotAttackTurn via API.setCardFlag (フェアリー・アーチャー), SETCODE.DESTINY_HERO (exactly the 16 monsters named 「D－HERO」), GROUP.ANCIENT_GEAR (monsters only).
   Not in this unit: ヒーロー・ヘイロー — its restriction depends on the ATTACKER's ATK, and engine/1ZU attackTargetForbiddenReasonS03(attackingPlayer, target)
   (and its three call sites in engine/30) do not carry the attacker; it needs an engine change, so it is left NOT_STARTED. */

/* ---- 罰ゲーム! (Normal Trap): 相手の手札が4枚の時、次の効果から1つを選択して発動する。
   ●相手は次のドローフェイズにカードをドローできない。 ●このターン相手は魔法・罠カードを発動できない。
   (the option is chosen at activation (declaration) and applied at resolution; the hand count is checked at activation) ---- */
function penaltyApplyS261(key, opp){
  if(key==='nost'){
    API.setFlag(opp, 'noSpellTrapActivationS03', gameState.turn, true);
    API.log('罰ゲーム!：このターン、相手は魔法・罠カードを発動できない');
    return;
  }
  /* the opponent's next Draw Phase: this turn is theirs → two turns on (the Draw Phase of this turn has passed), else the very next turn */
  const t = (gameState.activePlayer===opp) ? gameState.turn+2 : gameState.turn+1;
  API.setFlag(opp, 'skipDrawTurnS03', t, false);
  API.setFlag(opp, 'skipDrawByS03', '罰ゲーム!', false);
  API.log('罰ゲーム!：相手は次のドローフェイズにカードをドローできない');
}
defineScript('罰ゲーム!', {
  type:'trap', priority:2,
  condition(ctx){
    if((gameState.players[ctx.opponent].hand||[]).length!==4){ ctx.reason = '相手の手札が4枚の時に発動します'; return false; }
    return true;
  },
  /* S03-U261 (parent correction): 「次の効果から1つを選択して発動する」 — the option is chosen at activation (journaled declaration), applied at resolution */
  activationV11(ctx, d){
    requestDeclarationV11(ctx, 'mode', {title:'罰ゲーム!：発動する効果', activation:d, cancelable:false,
      values:[{key:'nodraw', value:'nodraw', label:'相手は次のドローフェイズにカードをドローできない'},
              {key:'nost', value:'nost', label:'このターン相手は魔法・罠カードを発動できない'}]}, {handler:'p11cards.declare-commit', args:{}}, null);
  },
  resolve(ctx){ const v = API.declared(ctx, 'mode'); if(v) penaltyApplyS261(String(v), ctx.opponent); },
  afterResolve(){}
});

/* ---- 一族の掟 (Continuous Trap): 発動時に1種類の種族を宣言する。その種族のモンスターは攻撃宣言ができない。
   自分のスタンバイフェイズ毎にモンスター1体を生け贄に捧げなければこのカードを破壊する。
   (the Type is declared at activation and kept on the card (requestDeclarationV11 with the card as the persistence target); only face-up monsters have a Type; the upkeep is a forced trigger at the
   controller's Standby Phase: the controller chooses a monster to release (any monster he / she controls) or has this card destroyed) ---- */
function clanDeclaredS261(card){ const v = card ? API.persistentDeclaration(card, 'race') : null; return v ? String(v) : ''; }
function clanUpkeepReadyS261(ctx){
  return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && !!clanDeclaredS261(ctx.card)
    && gameState.phase==='standby' && gameState.activePlayer===ctx.player;
}
registerChoiceHandlerV49('s03u261.clan-declared', (answer, args)=>{
  const d = args && args.declaration, uid = args && args.uid;
  const h = uid!=null ? findCardByUid(uid) : null;
  if(h && h.zone==='sz' && d && d.value!=null) API.persistDeclaration(h, 'race', String(d.value));
});
registerChoiceHandlerV49('s03u261.clan-upkeep', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const key = (answer.keys && answer.keys[0]) || 'destroy';
  if(key.indexOf('rel')===0){
    const h = findCardByUid(Number(key.slice(3)));
    if(h && h.zone==='mz' && h.p===args.player){ API.sendToGrave(h, '一族の掟（リリース）'); return; }
  }
  const me = args.uid!=null ? findCardByUid(args.uid) : null;
  if(me && me.zone==='sz') API.destroy(me, '一族の掟', args.player);
});
defineScript('一族の掟', {
  type:'trap', priority:2,
  condition(ctx){
    if(ctx.card && ctx.card.face==='up' && !ctx.card.activationPending && clanDeclaredS261(ctx.card)){
      if(!clanUpkeepReadyS261(ctx)){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; }
    }
    return true;
  },
  /* S03-U261 (parent correction): 「発動時に1種類の種族を宣言する」 — declared at activation; the upkeep trigger activates without a declaration */
  activationV11(ctx, d){
    if(clanDeclaredS261(ctx.card) || ctx.eventName==='onStandbyPhase') return commitPreparedActivationV11(d, {targets:[], v4EffectKey:null});
    requestDeclarationV11(ctx, 'race', {title:'一族の掟：種族を宣言', activation:d, cancelable:false}, {handler:'p11cards.declare-commit', args:{}}, ctx.card);
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    if(ctx.eventName==='onStandbyPhase' && clanDeclaredS261(me.card)){
      if(!clanUpkeepReadyS261(ctx)) return;
      const ms = API.fieldCards({player:ctx.player, zone:'mz'});
      if(!ms.length){ API.destroy(me, '一族の掟', ctx.player); return; }
      API.requestChoice({player:ctx.player, kind:'option', cancelable:false, min:1, max:1, title:'一族の掟：維持コスト',
        candidates:ms.map(m=>({key:'rel'+ensureCardUid(gameState, m.card), value:'rel'+m.card.uid, label:`モンスター1体をリリースする（${m.index+1}番目：${m.card.face==='up' ? cardName(m.card) : '裏側表示'}）`}))
          .concat([{key:'destroy', value:'destroy', label:'リリースせずにこのカードを破壊する'}]),
        resume:{handler:'s03u261.clan-upkeep', args:{player:ctx.player, uid:ensureCardUid(gameState, me.card)}}, meta:{scriptName:'一族の掟'}});
      return;
    }
    /* the card activation: the Type was declared at activation (activationV11) */
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return clanUpkeepReadyS261(ctx); } },
  continuous:{ scope:'allMonsters', from:['sz'], apply(){ return null; },
    cannotAttack(card, self){
      if(!self || self.face!=='up' || self.activationPending || !card || card.face!=='up') return false;
      const r = clanDeclaredS261(self);
      return !!r && currentRaceV17(card)===r;
    } }
});

/* ---- ヴェノム・スネーク / ヴェノム・ボア: 1ターンに1度だけ、相手フィールド上モンスター1体にヴェノムカウンターを1つ（ボアは2つ）置く事ができる。
   この効果を使用したターンこのモンスターは攻撃宣言をする事ができない。
   (the target is chosen at activation, any monster of the opponent — the text does not say face-up, as ヴェノム・サーペント; the attack ban is the zone-local
   cannotAttackTurn stamp written at the cost, like フェアリー・アーチャー; it cannot be activated after the monster has attacked this turn) ---- */
function venomFoesS261(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz'}); }
function defineVenomS261(name, n){
  defineScript(name, {
    type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true,
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
      if((typeof attackCountV48==='function' ? attackCountV48(ctx.card) : 0) > 0){ ctx.reason = 'このターン既に攻撃しています'; return false; }
      if(!venomFoesS261(ctx).length){ ctx.reason = '相手フィールド上にモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const me = locateCardAnyV4(ctx.card);
      if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, name, {silent:true});
      done(true);
    },
    selectTargets(ctx, done){ API.selectCard(`${name}：ヴェノムカウンターを置くモンスター`, venomFoesS261(ctx), t=>done([t])); },
    resolve(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(r && r.zone==='mz' && r.p===ctx.opponent) API.addCounter(r, 'ヴェノム', n);
    },
    afterResolve(){}
  });
}
defineVenomS261('ヴェノム・スネーク', 1);
defineVenomS261('ヴェノム・ボア', 2);

/* shared: the Equip Spell's activation (equip to a face-up monster that passes hostOk; the legal hosts are also declared in equipSpec) */
function equipHostsS261(hostOk){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && hostOk(x.db || dbOf(x.card))}); }
function equipActivateS261(name, hostOk, label){
  return {
    key:'equip', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
    condition(){ return equipHostsS261(hostOk).length>0; },
    target(ctx, done){ API.selectCard(`${name}：装備する${label}`, equipHostsS261(hostOk), t=>done([t])); },
    operation(ctx){
      const s = locateCardAnyV4(ctx.card), t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
      if(s && t && t.zone==='mz' && t.card.face==='up' && hostOk(dbOf(t.card))) API.equipSpell(s, t, name);
    },
    afterResolve(){}
  };
}

/* ---- 旋風剣 (Equip Spell): 「D－HERO」と名のついたモンスターにのみ装備可能。装備モンスターが攻撃を行ったダメージステップ終了時、
   フィールド上の魔法・罠カード1枚を選択して破壊する。
   (forced at the end of the Damage Step; the chosen card may be any Spell / Trap on the field (either side, face-down too, this card included); also after a direct
   attack; if the equipped monster was destroyed in the battle this card is gone and nothing happens) ---- */
function dHeroDbS261(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.DESTINY_HERO); }
function whirlTargetsS261(){ return API.fieldCards({filter:x=>x.zone==='sz' || x.zone==='field'}); }
function whirlReadyS261(ctx){
  const eq = a8Equipped(ctx.card);
  return !!eq && ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && a5IsAttackerCard(eq) && whirlTargetsS261().length>0;
}
defineUnifiedCardV4('旋風剣', [equipActivateS261('旋風剣', dHeroDbS261, '「D－HERO」'), {
  key:'whirl', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return whirlReadyS261(ctx); },
  operation(ctx){
    if(!a8Equipped(ctx.card)) return;
    const pool = whirlTargetsS261(); if(!pool.length) return;
    API.selectCard('旋風剣：破壊する魔法・罠カード', pool, t=>{
      const r = resolveTarget(t);
      if(r && (r.zone==='sz' || r.zone==='field')) API.destroy(r, '旋風剣', ctx.player);
    });
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, forced:true, dsTiming:'end', timing:['mainPhase','damageStep'],
    equipSpec:{ canEquip(h){ return dHeroDbS261(h.db || dbOf(h.card)); }, label:'「D－HERO」のみ' },
    passive:{ onDamageStep(ctx){ return whirlReadyS261(ctx); } },
    continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }});

/* ---- 古代の機械掌 (Equip Spell): 「アンティーク・ギア」と名のついたモンスターにのみ装備可能。装備モンスターと戦闘を行ったモンスターを、
   そのダメージステップ終了時に破壊する。 (forced; as ライトイレイザー) ---- */
function ancientGearDbS261(db){ return !!db && db.k==='m' && isCardInGroupV4(db, GROUP.ANCIENT_GEAR); }
function ancientHandFoeS261(ctx){
  const eq = a8Equipped(ctx.card);
  if(!eq || ctx.zone!=='sz' || ctx.card.face!=='up' || ctx.card.activationPending) return null;
  const o = a5BattleOtherOf(eq), h = o && locateCardAnyV4(o);
  return (h && h.zone==='mz') ? o : null;
}
defineUnifiedCardV4('古代の機械掌', [equipActivateS261('古代の機械掌', ancientGearDbS261, '「アンティーク・ギア」'), {
  key:'palm', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!ancientHandFoeS261(ctx); },
  operation(ctx){
    const o = ancientHandFoeS261(ctx), h = o && locateCardAnyV4(o);
    if(h && h.zone==='mz') API.destroy(h, '古代の機械掌', ctx.player);
  },
  afterResolve(){}
}], {type:'spell', priority:1, targets:true, forced:true, dsTiming:'end', timing:['mainPhase','damageStep'],
    equipSpec:{ canEquip(h){ return ancientGearDbS261(h.db || dbOf(h.card)); }, label:'「アンティーク・ギア」のみ' },
    passive:{ onDamageStep(ctx){ return !!ancientHandFoeS261(ctx); } },
    continuous:{ scope:'equippedMonster', from:['sz'], apply(){ return null; } }});
