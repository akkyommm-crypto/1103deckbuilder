/* S03-U338: five 「ジェムナイト」 Fusion Monsters (carddata texts). Fusion Summons come from 「融合」 (S03-U130); the effects:

   アクアマリナ     ①:攻撃した場合、バトルフェイズ終了時に守備表示になる。②:フィールドから墓地へ送られた場合、相手フィールドのカード1枚を対象として発動する。そのカードを持ち主の手札に戻す。
   アメジス         ①:フィールドから墓地へ送られた場合に発動する。フィールドにセットされた魔法・罠カードを全て持ち主の手札に戻す。
   パーズ           ①:1度のバトルフェイズ中に2回攻撃できる。②:戦闘でモンスターを破壊し墓地へ送った場合に発動する。そのモンスターの元々の攻撃力分のダメージを相手に与える。
   プリズムオーラ   ①:1ターンに1度、手札から「ジェムナイト」カード1枚を墓地へ送り、フィールドの表側表示のカード1枚を対象として発動できる。そのカードを破壊する。
   ルビーズ         ①:1ターンに1度、このカード以外の自分フィールドの表側表示の「ジェム」モンスター1体をリリースして発動できる。このカードの攻撃力はターン終了時まで、リリースしたモンスターの攻撃力分アップする。②:守備表示モンスターを攻撃した場合、その守備力を攻撃力が超えた分だけ戦闘ダメージを与える。

   Notes
   - 「フィールドから墓地へ送られた」: a Graveyard trigger on onFieldToGraveBatchS03 whose items contain this card (any cause: destruction, release, battle).
   - アクアマリナ' Defense Position: a forced onBattlePhaseEnd trigger when it attacked this turn (as D－HERO ダッシュガイ, S03-U335). パーズ: attackLimit 2 + the dsTiming 'leave' battle-kill reading of 古代の機械巨竜 (S03-U144); the damage is the destroyed monster's printed ATK.
   - プリズムオーラ: the send from the hand is the cost (not a discard); ルビーズ: the released monster's ATK is read before it leaves (card flag), piercing = continuous.piercingDamage. */

function u338Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u338Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u338Pierce(info){
  const self = info.self;
  if(!self || self.face!=='up' || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
  return Math.max(0, curATK(self) - curDEF(info.defCard));
}
function u338Left(ctx){
  const e = ctx.event || {};
  return ctx.zone==='grave' && ctx.eventName==='onFieldToGraveBatchS03' && Array.isArray(e.items) && !!ctx.card && e.items.some(x=>x && x.uid===ctx.card.uid);
}
function u338Attacked(ctx){ return u338Up(ctx) && typeof attackCountV48==='function' && attackCountV48(ctx.card)>0; }

/* ---- アクアマリナ ---- */
function u338FoeCards(ctx){ return API.fieldCards({player:ctx.opponent}); }
defineUnifiedCardV4('ジェムナイト・アクアマリナ', [{
  key:'bp-end-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){ return u338Attacked(ctx) && ctx.card.pos==='atk'; },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up' && me.card.pos==='atk') API.changePosition(me, 'def', 'ジェムナイト・アクアマリナ'); },
  afterResolve(){}
}, {
  key:'left-bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onFieldToGraveBatchS03'], forced:true,
  condition(ctx){ return u338Left(ctx) && u338FoeCards(ctx).length>0; },
  target(ctx, done){ API.selectCard('ジェムナイト・アクアマリナ：手札に戻す相手のカード', u338FoeCards(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.p===ctx.opponent && ['mz','sz','field'].indexOf(r.zone)>=0) API.returnToHand(r, 'ジェムナイト・アクアマリナ'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true, timing:['free'], activateFrom:['mz','grave'],
  passive:{ onBattlePhaseEnd(ctx){ return u338Attacked(ctx) && ctx.card.pos==='atk'; }, onFieldToGraveBatchS03(ctx){ return u338Left(ctx) && u338FoeCards(ctx).length>0; } }});

/* ---- アメジス ---- */
function u338SetCards(){ return API.fieldCards({filter:x=>(x.zone==='sz' || x.zone==='field') && x.card.face==='down'}); }
defineUnifiedCardV4('ジェムナイト・アメジス', [{
  key:'left-return-sets', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onFieldToGraveBatchS03'], forced:true,
  condition(ctx){ return u338Left(ctx) && u338SetCards().length>0; },
  operation(){ u338SetCards().slice().forEach(h=>{ const r = resolveTarget(h); if(r && (r.zone==='sz' || r.zone==='field') && r.card.face==='down') API.returnToHand(r, 'ジェムナイト・アメジス'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'], passive:{ onFieldToGraveBatchS03(ctx){ return u338Left(ctx) && u338SetCards().length>0; } }});

/* ---- パーズ ---- */
function u338BattleKill(ctx){
  const b = ctx.battle || {};
  if(ctx.zone!=='mz' || ctx.step!=='leave') return null;
  return b.atkCard===ctx.card ? (b.destroyedDef ? b.defCard : null) : b.defCard===ctx.card ? (b.destroyedAtk ? b.atkCard : null) : null;
}
defineUnifiedCardV4('ジェムナイト・パーズ', [{
  key:'battle-kill-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u338BattleKill(ctx); },
  operation(ctx){ const k = u338BattleKill(ctx); const n = k ? Number(dbOf(k).atk)||0 : 0; if(n>0) API.damageLP(ctx.opponent, n, 'ジェムナイト・パーズ'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, dsTiming:'leave', timing:['free'], passive:{ onDamageStep(ctx){ return !!u338BattleKill(ctx); } }});
CARD_SCRIPTS['ジェムナイト・パーズ'].attackLimit = 2;

/* ---- プリズムオーラ ---- */
function u338HandGk(ctx){ return API.pileCards(ctx.player, 'hand', x=>isCardInGroupV4(x.db, GROUP.GEMKNIGHT)); }
function u338FaceUpAll(){ return API.fieldCards({filter:x=>x.card.face==='up'}); }
defineUnifiedCardV4('ジェムナイト・プリズムオーラ', [{
  key:'send-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'both',
  condition(ctx){
    if(!u338Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u338Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u338HandGk(ctx).length){ ctx.reason = '手札に「ジェムナイト」カードがありません'; return false; }
    if(!u338FaceUpAll().length){ ctx.reason = 'フィールドに表側表示のカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u338HandGk(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ジェムナイト・プリズムオーラ：墓地へ送る手札の「ジェムナイト」カード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, r.index, 'ジェムナイト・プリズムオーラ（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('ジェムナイト・プリズムオーラ：破壊する表側表示のカード', u338FaceUpAll(), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && ['mz','sz','field'].indexOf(r.zone)>=0 && r.card.face==='up') API.destroy(r, 'ジェムナイト・プリズムオーラ'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['send-destroy']}});

/* ---- ルビーズ ---- */
function u338GemOthers(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.k==='m' && isCardInGroupV4(x.db, GROUP.GEM)}); }
defineUnifiedCardV4('ジェムナイト・ルビーズ', [{
  key:'release-boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u338Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u338Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u338GemOthers(ctx).length){ ctx.reason = 'リリースする他の表側表示の「ジェム」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ジェムナイト・ルビーズ：リリースする「ジェム」モンスター', u338GemOthers(ctx), t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='mz' || !me || me.zone!=='mz'){ done(false); return; }
      API.setCardFlag(me, 'u338RubyAtk', curATK(r.card), 'ジェムナイト・ルビーズ', {silent:true});
      API.sendToGrave(r, 'ジェムナイト・ルビーズ（リリース）'); done(true);
    });
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const n = Number(me.card.u338RubyAtk) || 0;
    if(n>0) API.modAtk(me, n, 0, 'endTurn', 'ジェムナイト・ルビーズ');
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['release-boost']},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, piercingDamage:u338Pierce }});
