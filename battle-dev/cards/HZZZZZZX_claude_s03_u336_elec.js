/* S03-U336: five 「エレキ」 cards (carddata texts).

   エレキツネ      このカードが相手によって破壊された場合、そのターン相手はモンスターの特殊召喚及び魔法・罠・効果モンスターの効果を発動する事ができない。
   エレキャンセル  （カウンター罠）手札から「エレキ」と名のついたモンスター1体を捨てて発動する。相手モンスターの召喚・特殊召喚を無効にし破壊する。
   エレキリギリス  このカードがフィールド上に表側表示で存在する限り、相手は表側表示で存在する他の「エレキ」と名のついたモンスターを攻撃対象に選択できず、カードの効果の対象にする事もできない。
   エレキリム      「エレキ」と名のついたチューナー＋チューナー以外の雷族モンスター1体以上 / 直接攻撃できる。直接攻撃によって相手ライフに戦闘ダメージを与えた時、自分のデッキからカードを1枚選択してゲームから除外する。発動後2回目の自分のスタンバイフェイズ時にそのカードを手札に加える。
   エレキンモグラ  1度のバトルフェイズ中に2回攻撃できる。裏側守備表示のモンスターを攻撃した場合、ダメージ計算を行わず裏側守備表示のままそのモンスターを破壊できる。

   Notes
   - エレキツネ copies the pattern of エレキリン (S03-U260): a Graveyard trigger stamps the card, lingers it (lingerS03) and activationLockS03 + locksStEffectsS03 lock the opponent's Spell / Trap / monster effect activations for the turn; the Special Summon ban is the turn-temporary player flag noSpecialSummon.
   - エレキャンセル answers the summon-negation window and a chain link containing an opponent's Special Summon, like 神の警告 (cost: a discarded 「エレキ」 monster instead of 2000 LP).
   - エレキリギリス: continuous.cannotBeAttackTarget (scope ownMonsters) and continuous.immuneToTarget limited to the opponent as the targeting player (my own effects may still target).
   - エレキリム: its direct attack is continuous.grantsDirectAttack; the banished Deck card returns to the hand at my 2nd Standby Phase after the activation (schedule turns:4, as D－HERO デビルガイ).
   - エレキンモグラ: a3PreDamageDestroy (S03-U? A3 cycle: the face-down Defense Position monster is destroyed before damage calculation) + attackLimit 2. */

function u336Elec(db){ return !!db && String(db.n||'').indexOf('エレキ')>=0; }
function u336TargetingPlayer(){
  if(typeof ACTIVATION_PREP_S03!=='undefined' && ACTIVATION_PREP_S03 && ACTIVATION_PREP_S03.player!=null) return ACTIVATION_PREP_S03.player;
  if(typeof P3_EFFECT_CONTEXT!=='undefined' && P3_EFFECT_CONTEXT && P3_EFFECT_CONTEXT.player!=null) return P3_EFFECT_CONTEXT.player;
  return null;
}

/* ---- エレキツネ ---- */
function u336FoxDestroyed(ctx){
  if(ctx.zone!=='grave') return false;
  const g = ctx.card.graveInfo;
  return !!(g && g.byDestroy && g.from==='mz' && Number(g.turn)===Number(gameState.turn) && g.byPlayer===ctx.opponent);
}
defineScript('エレキツネ', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){ if(!u336FoxDestroyed(ctx)){ ctx.reason = '相手によって破壊された場合に発動します'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me){
      API.setCardFlag(me, 'u336FoxTurn', gameState.turn, 'エレキツネ', {silent:true});
      const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'エレキツネ');
    }
    API.setFlag(ctx.opponent, 'noSpecialSummon', true, true);
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){ return u336FoxDestroyed(ctx); } },
  locksStEffectsS03:true,
  activationLockS03:(i)=> i.p!==i.srcPlayer && Number(i.src.u336FoxTurn)===Number(gameState.turn)
});

/* ---- エレキャンセル ---- */
function u336Hand(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && u336Elec(x.db)); }
defineScript('エレキャンセル', {
  onOtherSummon:true,
  summonNegate:{kinds:['normal','flip','procedure','synchro','xyz']},
  type:'counter', priority:3,
  condition(ctx){
    if(!u336Hand(ctx).length){ ctx.reason = '手札に「エレキ」と名のついたモンスターがいません'; return false; }
    const ps = gameState.pendingSummon;
    if(ps){ if(ps.player===ctx.player){ ctx.reason = '相手モンスターの召喚・特殊召喚にのみ発動できます'; return false; } return true; }
    if(gameState.chain.length){
      const top = gameState.chain[gameState.chain.length-1], tsc = CARD_SCRIPTS[top.name];
      if(top.player===ctx.opponent && (typeof specialSummonEffectLinkS03==='function' ? specialSummonEffectLinkS03(top,{excludeSpellTrapEffect:true}) : (tsc && tsc.includesSpecialSummon===true))) return true;
    }
    ctx.reason = '相手の召喚・特殊召喚時にのみ発動できます'; return false;
  },
  cost(ctx, done){
    const pool = u336Hand(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('エレキャンセル：捨てる手札の「エレキ」モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'エレキャンセル（コスト）'); done(true);
    });
  },
  resolve(ctx){
    if(gameState.pendingSummon) summonNegatePendingV2('エレキャンセル');
    else negatePreviousChainLinkV2('エレキャンセル', true);
  },
  passive:{
    onNormalSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; },
    onSpecialSummon(ctx){ return ctx.card.face==='down' && ctx.zone==='sz'; }
  }
});

/* ---- エレキリギリス ---- */
function u336Grass(card, self){
  if(!self || self.face!=='up' || !card || card===self || card.face!=='up') return false;
  const me = locateCardAnyV4(self); if(!me || me.zone!=='mz') return false;
  return u336Elec(dbOf(card)) && dbOf(card).k==='m';
}
defineScript('エレキリギリス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){ return u336Grass(target, self); },
    immuneToTarget(card, self){
      if(!u336Grass(card, self)) return false;
      const me = locateCardAnyV4(self), tp = u336TargetingPlayer();
      return !(tp!=null && me && tp===me.p);   /* 「相手は」: my own effects may still target */
    } }
});

/* ---- エレキリム ---- */
API.registerScheduleHandler('u336.elekirim-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='banish' || h.p!==args.player) return;
  act({type:'MOVE', player:h.p, from:'banish', fromIndex:h.index, to:'hand', face:'up'});
  API.log('エレキリム：除外していたカードを手札に加えた');
});
function u336RimHit(ctx){
  const e = ctx.event;
  return !!e && e.direct && e.attackerUid!=null && ctx.card && e.attackerUid===ctx.card.uid && e.player===ctx.opponent && ctx.zone==='mz' && ctx.card.face==='up'
    && API.pileCards(ctx.player, 'deck').length>0;
}
defineScript('エレキリム', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){ if(!u336RimHit(ctx)){ ctx.reason = '直接攻撃で戦闘ダメージを与えた時に発動します'; return false; } return true; },
  resolve(ctx){
    const pool = API.pileCards(ctx.player, 'deck'); if(!pool.length) return;
    API.selectCard('エレキリム：除外するデッキのカード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='deck' || r.p!==ctx.player) return;
      const uid = ensureCardUid(gameState, r.card);
      API.banish(r, 'エレキリム');
      const b = findCardByUid(uid);
      if(b && b.zone==='banish') API.schedule({at:'standbyPhase', turns:4, player:ctx.player, handler:'u336.elekirim-return', args:{uid, player:ctx.player}, note:'エレキリム'});
    });
  },
  afterResolve(){},
  passive:{ onDirectBattleDamage(ctx){ return u336RimHit(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, grantsDirectAttack(card, self){ return card===self; } }
});

/* ---- エレキンモグラ ---- */
a3PreDamageDestroy('エレキンモグラ', ctx => {
  if(!a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos === 'def' && d.face === 'down') ? d : null;
});
CARD_SCRIPTS['エレキンモグラ'].attackLimit = 2;
