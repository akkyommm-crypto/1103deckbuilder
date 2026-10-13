/* S03-U332: five more 「スクラップ」 cards (carddata texts; 「スクラップ」 = v380IsScrap, name contains スクラップ; the "destroyed by a スクラップ card's effect" test is scrapDestroyedS03 of S03-U208).

   スクラップ・ゴブリン  (Tuner) フィールド上に表側守備表示で存在するこのカードが攻撃対象に選択された場合、バトルフェイズ終了時にこのカードを破壊する。このカードが「スクラップ」と名のついたカードの効果によって破壊され墓地へ送られた場合、
                        「スクラップ・ゴブリン」以外の自分の墓地の「スクラップ」モンスター1体を選択して手札に加える事ができる。また、このカードは戦闘では破壊されない。
   スクラップ・ソルジャー (Tuner) (the same clauses with 「スクラップ・ソルジャー」) このカードをシンクロ素材とする場合、「スクラップ」と名のついたモンスターのシンクロ召喚にしか使用できない。
   スクラップ・ゴーレム  1ターンに1度、自分の墓地のレベル4以下の「スクラップ」モンスター1体を選択し、自分または相手フィールド上に特殊召喚する事ができる。
   スクラップ・オルトロス (Tuner) 通常召喚できない。自分フィールドに「スクラップ」モンスターが存在する場合に特殊召喚できる。①:この方法で特殊召喚に成功した場合、自分フィールドの「スクラップ」モンスター1体を対象として発動する。その自分の「スクラップ」モンスターを破壊する。
                        ②:「スクラップ」カードの効果で破壊され墓地へ送られた場合、「スクラップ・オルトロス」以外の自分の墓地の「スクラップ」モンスター1体を対象として発動できる。そのモンスターを手札に加える。
   スクラップ・カウンター (Trap) フィールド上に守備表示で存在する「スクラップ」モンスターが攻撃された場合、そのダメージ計算時に発動できる。攻撃された「スクラップ」モンスターの守備力は2000ポイントアップし、バトルフェイズ終了時に破壊される。

   Notes
   - ゴブリン / ソルジャー: protectV21 (battle) for ゴブリン only (ソルジャー has no such clause); the Defense-Position destruction is stamped when the attack declaration targets the face-up Defense Position card (card flag u332Targeted = turn) and executed by a forced Battle Phase end trigger.
   - ゴーレム: the controller chooses my field or the opponent's field (a registry choice) when the target is chosen; the Special Summon from my Graveyard onto the opponent's field uses fromPlayer.
   - オルトロス: a hand Special Summon procedure (a face-up スクラップ monster of mine); the forced destruction (a target chosen on summon success, including itself) is only for that method (specialSummonKind 'procedure'); ② is the shared "destroyed by a スクラップ card" Graveyard trigger.
   - カウンター: a Trap that responds at the calculation step of an attack on my face-up Defense スクラップ monster (damageStepOnly, dsTiming 'calc'): DEF +2000 (permanent modifier) and a Battle Phase end schedule destroys it.
   - Left: スクラップ・オイルゾーン (Continuous Spell with the Battle Phase ban and linked destruction). */

function u332Scrap(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('スクラップ')>=0; }
function u332Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u332GraveOthers(ctx, exceptName){ return API.pileCards(ctx.player, 'grave', x=>x.card!==ctx.card && u332Scrap(x.db) && x.db.n!==exceptName); }
function u332RecoverEffect(name){
  return { key:'scrap-recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], targetRange:LOCATION.GRAVE, targetSide:'self',
    condition(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && scrapDestroyedS03(ctx) && u332GraveOthers(ctx, name).length>0; },
    target(ctx, done){ API.selectCard(name+'：手札に加える墓地の「スクラップ」', u332GraveOthers(ctx, name), t=>done([t])); },
    operation(ctx){
      const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player && u332Scrap(dbOf(r.card))) API.returnToHand(r, name);
    },
    afterResolve(){} };
}
function u332TargetedDef(ctx){
  const a = gameState.pendingAttack;
  return !!a && a.player===ctx.opponent && a.targetUid===ctx.card.uid && u332Up(ctx) && ctx.card.pos==='def';
}
function u332DefEffects(name){
  return [{
    key:'mark-targeted', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
    condition(ctx){ return u332TargetedDef(ctx); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u332Targeted', gameState.turn, name, {silent:true}); },
    afterResolve(){}
  }, {
    key:'bp-end-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
    condition(ctx){ return u332Up(ctx) && Number(ctx.card.u332Targeted)===Number(gameState.turn); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && Number(me.card.u332Targeted)===Number(gameState.turn)) API.destroy(me, name); },
    afterResolve(){}
  }];
}
function u332DefPassive(){
  return { onAttackDeclare(ctx){ return u332TargetedDef(ctx); }, onBattlePhaseEnd(ctx){ return u332Up(ctx) && Number(ctx.card.u332Targeted)===Number(gameState.turn); },
           onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && scrapDestroyedS03(ctx); } };
}

/* ---- ゴブリン ---- */
defineUnifiedCardV4('スクラップ・ゴブリン', u332DefEffects('スクラップ・ゴブリン').concat([u332RecoverEffect('スクラップ・ゴブリン')]),
  {type:'monster', priority:1, forced:true, targets:true, activateFrom:['mz','grave'], timing:['free'], passive:u332DefPassive(),
   continuous:{ scope:'self', from:['mz'], apply(){ return null; }, protectV21:{ key:'スクラップ・ゴブリン', label:'スクラップ・ゴブリン', scope:'self', effect:false, battle:true } }});

/* ---- ソルジャー ---- */
defineUnifiedCardV4('スクラップ・ソルジャー', u332DefEffects('スクラップ・ソルジャー').concat([u332RecoverEffect('スクラップ・ソルジャー')]),
  {type:'monster', priority:1, forced:true, targets:true, activateFrom:['mz','grave'], timing:['free'], passive:u332DefPassive(),
   synchroMaterialRestriction(info){ return u332Scrap(info && info.exDb); }});

/* ---- ゴーレム ---- */
function u332GolemPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>u332Scrap(x.db) && (x.db.lv||99)<=4); }
API.registerChoiceHandler('u332.golem-side', (answer, args)=>{
  const c = (answer && answer.cards || [])[0], toFoe = !!(c && c.value==='foe');
  const to = toFoe ? (args.player===0?1:0) : args.player;
  const h = args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='grave' || h.p!==args.player || !hasMonsterZoneSpace(to)) return;
  API.specialSummon(to, 'grave', h.index, 'atk', 'スクラップ・ゴーレム', args.player);
});
defineUnifiedCardV4('スクラップ・ゴーレム', [{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u332Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u332GolemPool(ctx).length){ ctx.reason = '墓地にレベル4以下の「スクラップ」がいません'; return false; }
    if(!hasMonsterZoneSpace(0) && !hasMonsterZoneSpace(1)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('スクラップ・ゴーレム：特殊召喚する墓地の「スクラップ」（レベル4以下）', u332GolemPool(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player) return;
    const u = r.card.uid != null ? r.card.uid : ensureCardUid(gameState, r.card);
    const opts = [];
    if(hasMonsterZoneSpace(ctx.player)) opts.push({key:'own', value:'own', label:'自分フィールド上に特殊召喚'});
    if(hasMonsterZoneSpace(ctx.opponent)) opts.push({key:'foe', value:'foe', label:'相手フィールド上に特殊召喚'});
    if(!opts.length) return;
    API.requestChoice({player:ctx.player, kind:'option', title:'スクラップ・ゴーレム：特殊召喚するフィールド', candidates:opts, min:1, max:1, cancelable:false,
      resume:{handler:'u332.golem-side', args:{player:ctx.player, uid:u}}, meta:{scriptName:'スクラップ・ゴーレム'}});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, includesSpecialSummon:true, countLimit:{n:1, effects:['revive']}});

/* ---- オルトロス ---- */
function u332OwnScrap(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && u332Scrap(x.db)}); }
defineUnifiedCardV4('スクラップ・オルトロス', [{
  key:'self-summon-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true, targetRange:LOCATION.MZONE, targetSide:'self',
  condition(ctx){ return u332Up(ctx) && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure' && u332OwnScrap(ctx).length>0; },
  target(ctx, done){ API.selectCard('スクラップ・オルトロス：破壊する自分の「スクラップ」', u332OwnScrap(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.player && u332Scrap(dbOf(r.card))) API.destroy(r, 'スクラップ・オルトロス'); },
  afterResolve(){}
}, u332RecoverEffect('スクラップ・オルトロス')], {type:'monster', priority:1, targets:true, activateFrom:['mz','grave'], cannotNormalSummon:true, timing:['free'], forced:true,
  passive:{ onSpecialSummon(ctx){ return u332Up(ctx) && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure' && u332OwnScrap(ctx).length>0; },
            onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && scrapDestroyedS03(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u332OwnScrap(ctx).length){ ctx.reason = '自分フィールドに「スクラップ」モンスターが必要です'; return false; } return true; },
    cost(ctx, done){ done(true); }
  }});

/* ---- カウンター (Trap) ---- */
function u332Defended(ctx){
  const b = gameState.battle;
  if(!b || b.step!=='calc' || b.target==='direct' || b.player===ctx.player) return null;
  const t = (gameState.players[ctx.player].mz||[])[b.target];
  return (t && t.face==='up' && t.pos==='def' && u332Scrap(dbOf(t))) ? t : null;
}
API.registerScheduleHandler('u332.counter-end', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.destroy(h, 'スクラップ・カウンター（バトルフェイズ終了時）');
});
defineScript('スクラップ・カウンター', {
  type:'trap', priority:2, damageStepOnly:true, dsTiming:'calc',
  condition(ctx){ if(!u332Defended(ctx)){ ctx.reason = '守備表示の「スクラップ」モンスターが攻撃された場合、そのダメージ計算時に発動します'; return false; } return true; },
  resolve(ctx){
    const t = u332Defended(ctx); if(!t) return;
    const h = locateCardAnyV4(t); if(!h || h.zone!=='mz') return;
    API.modAtk(h, 0, 2000, 'permanent', 'スクラップ・カウンター');
    API.schedule({at:'battlePhaseEnd', turns:0, player:ctx.player, handler:'u332.counter-end', args:{uid:t.uid!=null?t.uid:ensureCardUid(gameState,t)}, note:'スクラップ・カウンター'});
  },
  afterResolve(){}
});
