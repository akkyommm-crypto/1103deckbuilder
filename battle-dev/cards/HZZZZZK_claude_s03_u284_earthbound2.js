/* S03-U284: 「地縛神」 (second batch, 2011 texts) — 地縛神 Aslla piscu, 地縛神 Ccarayhua, 地縛神 Uru, 地縛神 Wiraqocha Rasca.
   Each script passes through earthboundCommonS03 (engine/1ZZM, S03-U282): only one face-up 「地縛神」, destroyed without a face-up Field Spell, not an attack target, direct attack.
   Parked (no script): 地縛神 Chacu Challhua (a continuous "the opponent cannot conduct the Battle Phase while this card is face-up in Defense Position" needs a hook in
   battlePhaseForbiddenV340, engine/30), 地縛神 Cusillu (the battle-destruction substitute is a release, a new destroySubstituteS03 kind, plus the LP halving).
   Reuses: onLeaveField / onDestroy events with the move provenance (moveProvenance, graveInfo), API.destroy / destroyAll, API.changeControl until endPhase,
   the P1.1 multi-target activation (activationV11 + p11cOpen / 'p11cards.commit-targets', S03-U269), API.returnToDeck, duelRandomInt, API.modAtk 'permanent'.
   All helper names carry the S284 suffix. */

/* ---- 地縛神 Aslla piscu: …また、フィールド上に表側表示で存在するこのカードが、このカードの効果以外の方法でフィールド上から離れた時、相手フィールド上に表側表示で存在する
   モンスターを全て破壊し、破壊したモンスターの数×800ポイントダメージを相手ライフに与える。 ----
   Forced. The only departure that is excluded is its own destruction by the no-Field-Spell clause (a rule destruction: no move provenance, not battle, and no face-up
   Field Spell on the field). Every other way (battle, other effects, bounce, banish, Deck, a Tribute) counts. The opponent is the controller it left. */
function asllaLeftS284(ctx){
  const e = ctx.event || {};
  if(!ctx.card || e.uid==null || e.uid!==ctx.card.uid || e.fromZone!=='mz' || e.fromFace!=='up') return false;
  const g = ctx.card.graveInfo, mp = ctx.card.moveProvenance;
  /* Opus review: its own no-Field-Spell destruction is recorded by the engine (graveInfo.selfRuleS03 'self', engine/1ZZF); a uniqueness-rule destruction ('unique') is another way */
  if(ctx.zone==='grave' && g && g.selfRuleS03==='self' && Number(g.turn)===Number(gameState.turn)) return false;
  return true;
}
defineUnifiedCardV4('地縛神 Aslla piscu', [{
  key:'left-field-wipe-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.ALL, speed:1, events:['onLeaveField'], forced:true,
  condition(ctx){ return asllaLeftS284(ctx); },
  operation(ctx){
    const e = ctx.event || {};
    const ctrl = (e.player===0 || e.player===1) ? e.player : ctx.player, foe = ctrl===0 ? 1 : 0;
    const list = API.fieldCards({player:foe, zone:'mz', filter:x=>x.card.face==='up'}).map(x=>x.card), mark = API.destroyMarkS03(), uids = list.map(c=>ensureCardUid(gameState, c));
    list.forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='mz' && h.p===foe) API.destroy(h, '地縛神 Aslla piscu'); });
    /* S03-U294: 800 per monster actually destroyed, after any substitute decision (engine/1ZZO) */
    API.afterDestroyS03('s03u294.aslla', {mark, uids, to:foe});
  },
  afterResolve(){}
}], earthboundCommonS03({type:'monster', priority:1, activateFrom:['hand','grave','banish','deck'],
  passive:{ onLeaveField: ctx=>asllaLeftS284(ctx) }}));

/* ---- 地縛神 Ccarayhua: …また、このカードがこのカード以外の効果によって破壊された時、フィールド上のカードを全て破壊する。 ----
   Forced. Destroyed (graveInfo.byDestroy, not battle) by an effect (moveProvenance.reason 'effect') whose source is not this card; the no-Field-Spell and the
   uniqueness rules leave no move provenance and do not count. Face-up or face-down. Destroys every card on both fields (Monster, Spell & Trap, Field Zones). */
function ccaraDestroyedS284(ctx){
  if(!ctx.card || ctx.zone!=='grave' || !eventIsSelfS03(ctx)) return false;
  const g = ctx.card.graveInfo, mp = ctx.card.moveProvenance;
  if(!g || g.byDestroy!==true || g.battle===true || g.from!=='mz' || Number(g.turn)!==Number(gameState.turn)) return false;
  if(!mp || mp.reason!=='effect') return false;
  return g.srcUidS03==null || g.srcUidS03!==ctx.card.uid;
}
defineUnifiedCardV4('地縛神 Ccarayhua', [{
  key:'destroyed-wipe-field', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDestroy'], forced:true,
  condition(ctx){ return ccaraDestroyedS284(ctx); },
  operation(){ ['mz','sz','field'].forEach(z=>API.destroyAll(z, null, '地縛神 Ccarayhua')); },
  afterResolve(){}
}], earthboundCommonS03({type:'monster', priority:1, activateFrom:['grave'],
  passive:{ onDestroy: ctx=>ccaraDestroyedS284(ctx) }}));

/* ---- 地縛神 Uru: …また、1ターンに1度、このカード以外の自分フィールド上のモンスター1体をリリースする事で、相手フィールド上に表側表示で存在するモンスター1体を選択し、
   エンドフェイズ時までコントロールを得る。 ----
   Ignition (own Main Phase), once per turn. Cost: release another monster you control. Target (chosen at activation, after the cost): 1 face-up opponent monster; its control is
   taken until the End Phase (API.changeControl until 'endPhase'). */
function uruReleasablesS284(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && !x.card.cannotTribute}); }
function uruTargetsS284(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
defineUnifiedCardV4('地縛神 Uru', [{
  key:'release-take-control', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer){ ctx.reason = '自分のターンにのみ発動できます'; return false; }
    if(!uruReleasablesS284(ctx).length){ ctx.reason = 'リリースするモンスターがいません'; return false; }
    if(!uruTargetsS284(ctx).length){ ctx.reason = '相手フィールド上に表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('地縛神 Uru：リリースするモンスター', uruReleasablesS284(ctx), t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '地縛神 Uru（リリース）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('地縛神 Uru：コントロールを得る相手モンスター', uruTargetsS284(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t ? resolveTarget(t) : null;
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent || r.card.face!=='up'){ API.log('地縛神 Uru：対象が場にないため不発'); return; }
    API.changeControl(r, ctx.player, '地縛神 Uru', 'endPhase', {card:ctx.card});
  },
  afterResolve(){}
}], earthboundCommonS03({type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true}));

/* ---- 地縛神 Wiraqocha Rasca: ②:このカードが召喚に成功した場合、相手の手札の数までこのカード以外の自分フィールドのカードを対象として発動する(最大3枚まで)。そのカードを持ち主のデッキに戻す。
   その後、戻した数だけ相手の手札をランダムに選んで捨て、このカードの攻撃力は捨てた数×1000アップする。 ----
   Forced trigger on its Normal / Tribute Summon. Targets (chosen at activation, ruling: at least 1): 1 to min(3, the opponent's hand) other cards on your field (Monster,
   Spell & Trap, Field Zones). Resolution: each target still on the field returns to its owner's Deck (shuffled); then the opponent discards that many cards from the hand at
   random (journaled RNG); this card gains 1000 ATK per card discarded (permanent mod, until it leaves the field). With no target or an empty opponent hand it does not activate. */
function wiraPoolS284(ctx){ return API.fieldCards({player:ctx.player, filter:x=>x.card!==ctx.card}); }
function wiraMaxS284(ctx){ return Math.min(3, (gameState.players[ctx.opponent].hand||[]).length, wiraPoolS284(ctx).length); }
function wiraReadyS284(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && wiraMaxS284(ctx)>=1; }
defineScript('地縛神 Wiraqocha Rasca', earthboundCommonS03({
  type:'monster', priority:1, forced:true, targets:true, timing:['summon'],
  condition(ctx){
    if(ctx.eventName!=='onNormalSummon' || ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
    if(!(gameState.players[ctx.opponent].hand||[]).length){ ctx.reason = '相手の手札がありません'; return false; }
    if(!wiraPoolS284(ctx).length){ ctx.reason = 'このカード以外の自分フィールドのカードがありません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    const pool = wiraPoolS284(ctx);
    p11cOpen(d, {title:'地縛神 Wiraqocha Rasca：デッキに戻す自分フィールドのカード（相手の手札の数まで・最大3枚）', candidates:pool, min:1, max:wiraMaxS284(ctx), targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    const name = '地縛神 Wiraqocha Rasca';
    const picked = (ctx.selectedTargets||[]).map(t=>resolveTarget(t)).filter(r=>r && r.p===ctx.player && ['mz','sz','field'].indexOf(r.zone)>=0);
    if(!picked.length){ API.log(name+'：対象が場にないため不発'); return; }
    const cards = picked.map(r=>r.card), owners = [];
    cards.forEach(c=>{ const h = locateCardAnyV4(c); if(!h || ['mz','sz','field'].indexOf(h.zone)<0) return; const o = (c.owner===0||c.owner===1) ? c.owner : h.p; if(owners.indexOf(o)<0) owners.push(o); API.returnToDeck(h, false, name); });
    owners.forEach(o=>API.shuffle(o));
    const returned = cards.filter(c=>{ const h = locateCardAnyV4(c); return !h || h.zone==='deck' || h.zone==='ex'; }).length;
    if(!returned) return;
    let discarded = 0;
    for(let k=0;k<returned;k++){
      const before = gameState.players[ctx.opponent].hand.length;
      if(!before) break;
      API.discard(ctx.opponent, duelRandomInt(before), name, {byEffect:true, byPlayer:ctx.player});
      if(gameState.players[ctx.opponent].hand.length<before) discarded++; else break;
    }
    const me = locateCardAnyV4(ctx.card);
    if(discarded>0 && me && me.zone==='mz' && me.card.face==='up') API.modAtk(me, discarded*1000, 0, 'permanent', name);
  },
  afterResolve(){},
  passive:{ onNormalSummon: ctx=>wiraReadyS284(ctx) }
}));
registerDestroyAfterS03('s03u294.aslla', a=>{ const n = API.destroyedSinceS03(a.mark, a.uids).length; if(n>0) API.damageLP(a.to, n*800); });
