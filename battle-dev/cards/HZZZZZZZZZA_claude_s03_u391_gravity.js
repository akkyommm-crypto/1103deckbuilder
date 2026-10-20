/* S03-U391: three NOT_STARTED cards (carddata texts).

   重力崩壊            （カウンター罠）自分フィールド上に表側表示で存在するシンクロモンスター1体を墓地へ送って発動する。相手モンスターの召喚・反転召喚・特殊召喚を無効にし破壊する。このターンのエンドフェイズ時まで相手はモンスターを召喚・反転召喚・特殊召喚する事はできない。
   賢者の聖杯          （通常魔法）自分フィールド上にモンスターが存在しない場合、相手の墓地に存在するモンスター1体を選択して発動する事ができる。選択したモンスターを自分フィールド上に特殊召喚する。このターンのエンドフェイズ時、この効果で特殊召喚したモンスターのコントロールを相手に移す。また、この効果で特殊召喚したモンスターはリリースできず、シンクロ素材にできない。
   スクリーン・オブ・レッド（永続罠）このカードのコントローラーは自分エンドフェイズ時に1000LPを払う。払えない場合このカードを破壊する。①このカードが魔法&罠ゾーンに存在する限り、相手モンスターは攻撃宣言できない。②自分の墓地のレベル1チューナー1体を対象として発動できる。このカードを破壊し、そのモンスターを特殊召喚する。この効果はフィールドに「レッド・デーモンズ・ドラゴン」が存在する場合に発動と処理ができる。

   Notes
   - 重力崩壊 answers the summon-negation window and the Special Summon effect link like ライト・バニッシュ (S03-U340); the cost sends the Synchro Monster to the Graveyard; the opponent's summon ban is banSummonS03 (engine/1ZZS, S03-U384) for the rest of this turn (Normal, Flip and Special Summon).
   - 賢者の聖杯: the monster is Special Summoned from the opponent's Graveyard to my field; cannotTribute (zone-local, cleared at the turn change) + noSynchroMaterialTurnS03; the End Phase hand-back is a scheduled changeControl.
   - スクリーン・オブ・レッド: the End Phase upkeep is a forced onEndPhase trigger of its controller; ① is a continuous cannotAttack on the opponent's monsters; ② is a field ignition of the face-up card (the activation itself is a plain placement). */

/* ---- 重力崩壊 ---- */
function u391Synchro(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('シンクロ')>=0}); }
defineScript('重力崩壊', {
  onOtherSummon:true,
  summonNegate:{kinds:['normal','flip','procedure','synchro','xyz']},
  type:'counter', priority:3,
  condition(ctx){
    if(!u391Synchro(ctx).length){ ctx.reason = '自分フィールドに表側表示のシンクロモンスターがいません'; return false; }
    const ps = gameState.pendingSummon;
    if(ps){ if(ps.player===ctx.player){ ctx.reason = '相手モンスターの召喚・特殊召喚にのみ発動できます'; return false; } return true; }
    if(gameState.chain.length){
      const top = gameState.chain[gameState.chain.length-1], tsc = CARD_SCRIPTS[top.name];
      if(top.player===ctx.opponent && (typeof specialSummonEffectLinkS03==='function' ? specialSummonEffectLinkS03(top,{excludeSpellTrapEffect:true}) : (tsc && tsc.includesSpecialSummon===true))) return true;
    }
    ctx.reason = '相手モンスターの召喚・反転召喚・特殊召喚時にのみ発動できます'; return false;
  },
  cost(ctx, done){
    const pool = u391Synchro(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('重力崩壊：墓地へ送るシンクロモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '重力崩壊（コスト）'); done(true);
    });
  },
  resolve(ctx){
    if(gameState.pendingSummon) summonNegatePendingV2('重力崩壊');
    else negatePreviousChainLinkV2('重力崩壊', true);
    banSummonS03(ctx.opponent, gameState.turn, gameState.turn, ['normal','flip','special'], {}, '重力崩壊');
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; }
  }
});

/* ---- 賢者の聖杯 ---- */
API.registerScheduleHandler('u391.grail-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='mz' || h.p!==args.me || Number(h.card.u391GrailTurn)!==Number(args.turn)) return;
  API.changeControl(h, args.opp, '賢者の聖杯');
});
function u391GrailPool(ctx){ return API.pileCards(ctx.opponent, 'grave', x=>x.db.k==='m' && canEffectSpecialSummonS03(x.card, 'grave', '賢者の聖杯')); }
defineScript('賢者の聖杯', {
  type:'spell', priority:1, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(API.fieldCards({player:ctx.player, zone:'mz', filter:()=>true}).length){ ctx.reason = '自分フィールドにモンスターが存在します'; return false; }
    if(!u391GrailPool(ctx).length){ ctx.reason = '相手の墓地に特殊召喚できるモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('賢者の聖杯：特殊召喚する相手の墓地のモンスター', u391GrailPool(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.opponent || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    if(!API.specialSummon(ctx.player, 'grave', r.index, 'atk', '賢者の聖杯', r.p)) return;
    const h = findCardByUid(uid); if(!h || h.zone!=='mz' || h.p!==ctx.player) return;
    API.setCardFlag(h, 'u391GrailTurn', gameState.turn, '賢者の聖杯', {silent:true});
    const h2 = findCardByUid(uid); if(h2) API.setCardFlag(h2, 'cannotTribute', true, '賢者の聖杯', {silent:true});
    const h3 = findCardByUid(uid); if(h3) API.setCardFlag(h3, 'noSynchroMaterialTurnS03', gameState.turn, '賢者の聖杯', {silent:true});
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u391.grail-return', args:{uid, me:ctx.player, opp:ctx.opponent, turn:gameState.turn}, note:'賢者の聖杯'});
  },
  afterResolve(){}
});

/* ---- スクリーン・オブ・レッド ---- */
function u391Ready(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending; }
function u391RedDragon(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='レッド・デーモンズ・ドラゴン'}).length>0; }
function u391Tuners(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && Number(x.db.lv)===1 && (x.db.st||[]).indexOf('チューナー')>=0 && canEffectSpecialSummonS03(x.card, 'grave', 'スクリーン・オブ・レッド')); }
defineUnifiedCardV4('スクリーン・オブ・レッド', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'upkeep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u391Ready(ctx) && ctx.player===gameState.activePlayer; },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='sz') return;
    if(API.me(ctx).lp>=1000){ API.payCost(ctx.player, 1000, 'スクリーン・オブ・レッド'); return; }
    API.destroy(me, 'スクリーン・オブ・レッド');
  },
  afterResolve(){}
}, {
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u391Ready(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u391RedDragon()){ ctx.reason = 'フィールドに「レッド・デーモンズ・ドラゴン」が存在しません'; return false; }
    if(!u391Tuners(ctx).length){ ctx.reason = '墓地に特殊召喚できるレベル1のチューナーがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('スクリーン・オブ・レッド：特殊召喚するレベル1のチューナー', u391Tuners(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !me || me.zone!=='sz' || !u391RedDragon() || !hasMonsterZoneSpace(ctx.player)) return;
    const uid = ensureCardUid(gameState, r.card);
    API.destroy(me, 'スクリーン・オブ・レッド');
    const g = findCardByUid(uid); if(g && g.zone==='grave' && g.p===ctx.player) API.specialSummon(ctx.player, 'grave', g.index, 'atk', 'スクリーン・オブ・レッド');
  },
  afterResolve(){}
}], {type:'trap', priority:2, targets:true, fieldIgnition:true, activateFrom:['sz'], forced:true,
  passive:{ onEndPhase(ctx){ return u391Ready(ctx) && ctx.player===gameState.activePlayer; } },
  continuous:{ scope:'oppMonsters', from:['sz'], apply(){ return null; },
    cannotAttack(target, self){ return !!self && self.face==='up' && !self.activationPending; } } });
