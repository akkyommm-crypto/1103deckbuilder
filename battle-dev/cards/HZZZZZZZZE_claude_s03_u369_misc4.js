/* S03-U369: two monsters, a Spell and a Trap (carddata texts).

   地獄詩人ヘルポエマー  墓地からの特殊召喚はできない。戦闘で破壊されたこのカードが墓地に存在する場合、相手バトルフェイズ終了時に発動する。相手の手札をランダムに1枚選んで捨てる。
   闇晦ましの城        リバース:フィールドの表側表示のアンデット族モンスター全ての攻撃力・守備力は200アップ。表側表示で存在する限り、自分のスタンバイフェイズ毎にさらに200ずつアップ。この効果は自分の4回目のスタンバイフェイズまで続く。
   レベル調整          相手はカードを2枚ドローする。自分の墓地の「LV」モンスター1体を、召喚条件を無視して特殊召喚する。このモンスターはこのターン攻撃できず、効果を発動及び適用できない。
   リチュアルバスター  自分または相手が儀式召喚に成功した時に発動できる。次の自分ターンのスタンバイフェイズまで、相手は魔法・罠カードの発動及びその効果の発動ができない。

   Notes
   - ヘルポエマー: the engine rule 「墓地からの特殊召喚はできない」 (S03-U358) already applies; the Graveyard trigger is limited to the turn it was destroyed by battle, in the opponent's Battle Phase End (graveInfo.battle, byPlayer); the random discard uses duelRandomInt.
   - 闇晦ましの城: Flip trigger + a Standby trigger counted in a card flag; each step is a stat modifier on every face-up Undead monster on the field at that moment (v4RegisterStatModifier, until it leaves or is turned face-down).
   - レベル調整: the Special Summon ignores the summon conditions (opts.ignoreSummonConditionS03); the monster's effect is negated (API.negateEffectUntil, permanent) and it cannot attack (cannotAttackTurn).
   - リチュアルバスター: the lock is a lingering source (API.lingerS03 until the opponent's turn ends) with activationLockS03 / locksStEffectsS03 (engine/1ZD) for the opponent. */

/* ---- 地獄詩人ヘルポエマー ---- */
function u369PoetReady(ctx){
  const g = ctx.card.graveInfo;
  return ctx.zone==='grave' && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn) && gameState.activePlayer===ctx.opponent && gameState.players[ctx.opponent].hand.length>0;
}
defineUnifiedCardV4('地獄詩人ヘルポエマー', [{
  key:'discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){ return u369PoetReady(ctx); },
  operation(ctx){
    const n = gameState.players[ctx.opponent].hand.length; if(!n) return;
    const i = (typeof duelRandomInt==='function') ? duelRandomInt(n) : 0;
    API.discard(ctx.opponent, i, '地獄詩人ヘルポエマー', {byEffect:true, byPlayer:ctx.player});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'], passive:{ onBattlePhaseEnd(ctx){ return u369PoetReady(ctx); } } });

/* ---- 闇晦ましの城 ---- */
function u369Undead(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='アンデット'}); }
function u369Boost(){ u369Undead().forEach(x=>v4RegisterStatModifier(x, {atk:200, def:200}, {code:'闇晦ましの城', resetMask:RESET.LEAVE|RESET.FACE_DOWN})); }
function u369CastleStandby(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='standby' && Number(ctx.card.u369Steps)<4 && Number(ctx.card.u369Steps)>=0; }
defineUnifiedCardV4('闇晦ましの城', [{
  key:'flip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u369Steps', 0, '闇晦ましの城', {silent:true}); u369Boost(); },
  afterResolve(){}
}, {
  key:'standby', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u369CastleStandby(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u369Steps', (Number(ctx.card.u369Steps)||0)+1, '闇晦ましの城', {silent:true}); u369Boost(); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); }, onStandbyPhase(ctx){ return u369CastleStandby(ctx); } } });

/* ---- レベル調整 ---- */
function u369LV(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && /LV\d/.test(String(x.db.n||''))); }
defineScript('レベル調整', {
  type:'spell', priority:1, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(!u369LV(ctx.player).length){ ctx.reason = '墓地に「LV」を持つモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  resolve(ctx){
    API.draw(ctx.opponent, 2);
    const pool = u369LV(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('レベル調整：特殊召喚する「LV」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave' || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'レベル調整', r.p, {ignoreSummonConditionS03:true});
      const m = findCardByUid(uid); if(!m || m.zone!=='mz') return;
      API.negateEffectUntil(m, 'permanent', 'レベル調整', ctx.card);
      const m2 = findCardByUid(uid); if(m2 && m2.zone==='mz') API.setCardFlag(m2, 'cannotAttackTurn', gameState.turn, 'レベル調整', {silent:true});
    });
  },
  afterResolve(){}
});

/* ---- リチュアルバスター ---- */
function u369Ritual(ctx){
  const e = ctx.event || {};
  const cards = Array.isArray(e.cards) ? e.cards : (e.card ? [e.card] : []);
  return ctx.zone==='sz' && ctx.card.face==='down' && cards.some(c=>c && c.specialSummonKind==='ritual');
}
defineScript('リチュアルバスター', {
  type:'trap', priority:2, onOtherSummon:true, targets:false,
  condition(ctx){ if(!u369Ritual(ctx)){ ctx.reason = '儀式召喚に成功した時に発動します'; return false; } return true; },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me) API.lingerS03(ctx.player, me, 'リチュアルバスター', gameState.turn + (gameState.activePlayer===ctx.player ? 1 : 0)); },
  afterResolve(){},
  locksStEffectsS03:true,
  activationLockS03:(i)=> (i.db.k==='s' || i.db.k==='t') && i.p!==i.srcPlayer,
  passive:{ onSpecialSummon(ctx){ return u369Ritual(ctx); } }
});
