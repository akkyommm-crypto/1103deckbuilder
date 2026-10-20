/* S03-U447: 挑発, 波動障壁, 城壁壊しの大槍, ツーマンセルバトル, 封神鏡 (stale ENGINE_GAP Traps / Spells, carddata texts).

   挑発                相手ターンのメインフェイズ1に自分フィールド上モンスター1体を選択して発動する。選択したモンスターがフィールド上に存在する限り、このターン相手がモンスターで攻撃を行う場合、選択したモンスターを攻撃対象に選択しなければならない。
   波動障壁            相手モンスターの攻撃宣言時、自分フィールド上に存在するシンクロモンスター1体をリリースして発動する。相手フィールド上に攻撃表示で存在するモンスターを全て守備表示にする。その後、攻撃宣言をしたモンスターの守備力分のダメージを相手ライフに与える。
   城壁壊しの大槍      （装備魔法）装備モンスターが裏側守備表示モンスターを攻撃する場合、装備モンスターの攻撃力は1500ポイントアップする。
   ツーマンセルバトル  （永続魔法）各プレイヤーは自分のターンのエンドフェイズ時に1度だけ、レベル4通常モンスター1体を手札から特殊召喚する事ができる。
   封神鏡              相手の手札を見る。スピリットモンスターが手札に存在する場合、スピリットモンスター1体を選択して墓地に捨てる。

   Notes
   - 挑発: Trap in the opponent's Main Phase 1; API.lockAttackTarget(selected) = the BATTLE_GRANT_V6 lock of 立ちはだかる強敵 (S03-U150: only that monster may be attacked, every Attack Position monster must attack it, the lock ends when the monster leaves the field).
   - 波動障壁: attack-declaration Trap (pendingAttack by the opponent), cost = a Synchro Monster of mine to the Graveyard; every Attack Position monster of the opponent becomes Defense Position (API.changePosition); then the declared attacker's current DEF is dealt to the opponent.
   - 城壁壊しの大槍: u312Define with a continuous ATK +1500 only while the equipped monster is the battle attacker and the target is face-down (or was flipped by this attack: gameState.battle.flipped).
   - ツーマンセルバトル: u422Act(false) activation + a forced onEndPhase trigger that asks the TURN player (ChoiceRequest, min 0) for a Level 4 Normal Monster of their hand; the choice is optional and made by whichever player's End Phase it is.
   - 封神鏡: the opponent's hand is revealed to both players (API.reveal), then I choose one Spirit monster of it to discard (ChoiceRequest) when any. */

/* ---- 挑発 ---- */
function u447Mine(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
defineScript('挑発', {
  type:'trap', priority:2, targets:true,
  condition(ctx){
    if(gameState.activePlayer!==ctx.opponent || gameState.phase!=='main1'){ ctx.reason = '相手ターンのメインフェイズ1に発動します'; return false; }
    if(!u447Mine(ctx.player).length){ ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('挑発：攻撃対象に選ばせるモンスター', u447Mine(ctx.player), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0]; if(t) API.lockAttackTarget(t); },
  afterResolve(){}
});

/* ---- 波動障壁 ---- */
function u447Synchro(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('シンクロ')>=0}); }
function u447Declared(ctx){ const a = gameState.pendingAttack; return !!a && a.player===ctx.opponent && a.attackerUid!=null; }
defineScript('波動障壁', {
  type:'trap', priority:2,
  condition(ctx){
    if(!u447Declared(ctx)){ ctx.reason = '相手モンスターの攻撃宣言時に発動します'; return false; }
    if(!u447Synchro(ctx.player).length){ ctx.reason = 'リリースするシンクロモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u447Synchro(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('波動障壁：リリースするシンクロモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '波動障壁（リリース）'); done(true);
    });
  },
  resolve(ctx){
    const a = gameState.pendingAttack, attacker = a && a.attackerUid!=null ? findCardByUid(a.attackerUid) : null;
    const def = attacker && attacker.zone==='mz' ? Math.max(0, curDEF(attacker.card)) : null;
    API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.card.pos==='atk'}).map(x=>ensureCardUid(gameState, x.card)).forEach(u=>{
      const h = findCardByUid(u); if(h && h.zone==='mz') API.changePosition(h, 'def', '波動障壁');
    });
    if(def!=null) API.damageLP(ctx.opponent, def, '波動障壁');
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return ctx.zone==='sz' && ctx.card.face==='down' && u447Declared(ctx) && u447Synchro(ctx.player).length>0; } }
});

/* ---- 城壁壊しの大槍 ---- */
u312Define('城壁壊しの大槍', {pred:x=>x.db.k==='m', continuous:{
  apply(card, self){
    if(!equippedS03(card, self)) return null;
    const b = gameState.battle; if(!b || b.atkUid==null || b.atkUid!==card.uid || b.targetUid==null) return null;
    const t = findCardByUid(b.targetUid); if(!t || t.zone!=='mz') return null;
    return (b.flipped || t.card.face==='down') ? {atk:1500} : null;
  } } });

/* ---- ツーマンセルバトル ---- */
function u447Lv4(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && Number(x.db.lv)===4 && (x.db.st||[]).indexOf('通常')>=0 && canEffectSpecialSummonS03(x.card, 'hand', 'ツーマンセルバトル')); }
API.registerChoiceHandler('s03u447.twoman', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.zone==='hand' && h.p===args.player && hasMonsterZoneSpace(args.player)) API.specialSummon(args.player, 'hand', h.index, 'atk', 'ツーマンセルバトル');
});
function u447TwoDue(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && gameState.phase==='end' && u447Lv4(gameState.activePlayer).length>0 && hasMonsterZoneSpace(gameState.activePlayer); }
defineUnifiedCardV4('ツーマンセルバトル', [u422Act(false), {
  key:'twoman', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u447TwoDue(ctx); },
  operation(ctx){
    const p = gameState.activePlayer, pool = u447Lv4(p); if(!pool.length || !hasMonsterZoneSpace(p)) return; pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'ツーマンセルバトル：特殊召喚するレベル4通常モンスター（召喚しない場合は選ばない）', candidates:pool, min:0, max:1, player:p, cancelable:false, resume:{handler:'s03u447.twoman', args:{player:p}}});
  },
  afterResolve(){}
}], {type:'spell', priority:1, forced:false, passive:{ onEndPhase(ctx){ return u447TwoDue(ctx); } } });

/* ---- 封神鏡 ---- */
API.registerChoiceHandler('s03u447.mirror', (answer, args)=>{
  const p = u441Picks(answer)[0], h = p && findCardByUid(p.card.uid);
  if(h && h.zone==='hand' && h.p===args.foe) API.discard(args.foe, h.index, '封神鏡');
});
defineScript('封神鏡', {
  type:'spell', priority:1,
  condition(ctx){ return true; },
  resolve(ctx){
    const hand = API.pileCards(ctx.opponent, 'hand'); if(hand.length) API.reveal({cards:hand, audience:'both', label:'封神鏡', until:'resolution'});
    const sp = API.pileCards(ctx.opponent, 'hand', x=>x.db.k==='m' && (x.db.st||[]).indexOf('スピリット')>=0); if(!sp.length) return; sp.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({kind:'card', title:'封神鏡：墓地に捨てる相手のスピリットモンスター', candidates:sp, min:1, max:1, player:ctx.player, cancelable:false, resume:{handler:'s03u447.mirror', args:{foe:ctx.opponent}}});
  },
  afterResolve(){}
});
