/* S03-U320: six more 「ナチュル」 monsters (carddata texts; 「ナチュル」 = SETCODE.NATURIA, monsters; helper names carry the u320 prefix).

   ナチュル・モスキート     自分フィールド上にこのカード以外の「ナチュル」と名のついたモンスターが表側表示で存在する限り、相手はこのカードを攻撃対象に選択する事はできない。このカード以外の自分フィールド上に表側表示で存在する
                           「ナチュル」と名のついたモンスターの戦闘によって発生する自分への戦闘ダメージは、代わりに相手が受ける。
   ナチュル・ローズウィップ  このカードがフィールド上に表側表示で存在する限り、相手は1ターンに1度しか魔法・罠カードを発動できない。
   ナチュル・レディバグ     自分が「ナチュル」と名のついたモンスターのシンクロ召喚に成功した時、このカードを墓地から特殊召喚できる。また、自分のメインフェイズ時にこのカードをリリースし、自分フィールド上の「ナチュル」と
                           名のついたモンスター1体を選択して発動できる。選択したモンスターの攻撃力はエンドフェイズ時まで1000ポイントアップする。
   ナチュル・フライトフライ  このカードがフィールド上に表側表示で存在する限り、相手フィールド上のモンスターの攻撃力・守備力は、自分フィールド上の「ナチュル」と名のついたモンスターの数×300ポイントダウンする。また、1ターンに1度、
                           相手フィールド上の守備力が0のモンスター1体を選択し、エンドフェイズ時までコントロールを得る事ができる。
   ナチュル・スタッグ       このカードが攻撃を行うバトルステップ時及びダメージステップ時に相手が魔法・罠・効果モンスターの効果を発動した時、自分の墓地に存在する「ナチュル」と名のついたモンスター1体を選択して発動する事ができる。
                           選択したモンスターを墓地から特殊召喚する。この効果は1ターンに1度しか使用できない。
   ナチュル・ホワイトオーク  このカードが相手のカードの効果の対象になった時、フィールド上のこのカードを墓地へ送って発動できる。デッキからレベル4以下の「ナチュル」と名のついたモンスター2体を特殊召喚する。この効果で特殊召喚した
                           モンスターは攻撃宣言できず、自分のエンドフェイズ時に破壊される。

   Notes
   - モスキート: continuous cannotBeAttackTarget (while another face-up 「ナチュル」 of mine exists) and battleDamageRedirect (as ダイガスタ・スフィアード of S03-U318: the battle involves a face-up other 「ナチュル」 of the card's controller).
   - ローズウィップ: activationLockS03 reading the per-turn record of card activations (engine/1B activatedKindsS03.spellCard / trapCard), as 氷結界の交霊師 (S03-U260).
   - レディバグ: the Graveyard trigger reads the Synchro Summon event (kind 'synchro', the summoned monster is a face-up 「ナチュル」 of mine); the ignition effect releases itself (cost) and the ATK gain is an end-of-turn modifier.
   - フライトフライ: continuous modifier of the opponent's face-up monsters (n = my face-up 「ナチュル」, itself included); the control change is API.changeControl with until:'endPhase' (it may attack). A monster whose DEF is 0 counts the reduction.
   - スタッグ / ホワイトオーク: declared activation responses (engine/1P, as ナチュル・ナーブ of S03-U258). スタッグ: the activation is the opponent's and happens while this card is the attacker (a battle or a declared attack); once per turn by a card flag.
     ホワイトオーク: the activation's chain link has this card among its targets (chainLinkTargetsV11). Both summoned monsters get the permanent cannotAttack flag and an End Phase schedule for the controller's own next End Phase.
   - Not in this unit: ナチュル・エクストリオ, ナチュルの森 (「発動を無効にした場合」 has no event yet). */

function u320Naturia(db){ return !!db && db.k==='m' && isSetCardV4(db, SETCODE.NATURIA); }
function u320OwnNaturia(p, except){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card!==except && x.card.face==='up' && u320Naturia(x.db)}); }

/* ---- モスキート ---- */
defineScript('ナチュル・モスキート', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){
      if(!self || target!==self || self.face!=='up') return false;
      const h = locateCard(self);
      return !!h && u320OwnNaturia(h.p, self).length>0;
    },
    battleDamageRedirect(info){
      const self = info.self, src = info.srcPlayer;
      if(!self || self.face!=='up' || info.to!==src || !(Number(info.amount)>0)) return null;
      const mine = c=>{ if(!c || c===self || c.face!=='up') return false; const h = locateCard(c); return !!h && h.p===src && h.zone==='mz' && u320Naturia(dbOf(c)); };
      return (mine(info.atkCard) || mine(info.defCard)) ? (src===0 ? 1 : 0) : null;
    } }
});

/* ---- ローズウィップ ---- */
defineScript('ナチュル・ローズウィップ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=>{
    if((i.db.k!=='s' && i.db.k!=='t') || i.p===i.srcPlayer || !i.src || i.src.face!=='up') return false;
    const h = findCardByUid(i.src.uid); if(!h || h.zone!=='mz') return false;
    const tf = gameState.players[i.p] && gameState.players[i.p].temporaryFlags, r = (tf && tf.activatedKindsS03) || {};
    return !!(r.spellCard || r.trapCard);
  }
});

/* ---- レディバグ ---- */
function u320SynchroByMe(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='grave' || e.kind!=='synchro') return false;
  const h = e.card ? locateCardAnyV4(e.card) : (e.uid!=null ? findCardByUid(e.uid) : null);
  return !!h && h.zone==='mz' && h.p===ctx.player && h.card.face==='up' && u320Naturia(dbOf(h.card));
}
defineUnifiedCardV4('ナチュル・レディバグ', [{
  key:'synchro-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSpecialSummon'],
  condition(ctx){
    if(!u320SynchroByMe(ctx)){ ctx.reason = '自分が「ナチュル」のシンクロ召喚に成功した時に発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='grave' || h.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', h.index, 'atk', 'ナチュル・レディバグ');
  },
  afterResolve(){}
}, {
  key:'release-boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u320OwnNaturia(ctx.player, ctx.card).length){ ctx.reason = '自分フィールド上に他の表側表示の「ナチュル」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'ナチュル・レディバグ（リリース）'); done(true); },
  target(ctx, done){ API.selectCard('ナチュル・レディバグ：攻撃力を上げる「ナチュル」', u320OwnNaturia(ctx.player, ctx.card), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.player && r.card.face==='up') API.modAtk(r, 1000, 0, 'endTurn', 'ナチュル・レディバグ');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['mz','grave'], includesSpecialSummon:true, onOtherSummon:true,
  passive:{ onSpecialSummon(ctx){ return u320SynchroByMe(ctx); } }});

/* ---- フライトフライ ---- */
function u320Lowered(p){ return API.fieldCards({player:p===0?1:0, zone:'mz', filter:x=>x.card.face==='up' && curDEF(x.card)<=0}); }
defineUnifiedCardV4('ナチュル・フライトフライ', [{
  key:'steal-def0', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u320Lowered(ctx.player).length){ ctx.reason = '相手フィールド上に守備力0の表側表示モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('ナチュル・フライトフライ：コントロールを得る守備力0のモンスター', u320Lowered(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.opponent && curDEF(r.card)<=0 && hasMonsterZoneSpace(ctx.player)) API.changeControl(r, ctx.player, 'ナチュル・フライトフライ', 'endPhase', {card:ctx.card});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['steal-def0']},
  continuous:{ scope:'oppMonsters', from:['mz'],
    apply(card, self){
      if(!self || self.face!=='up' || !card || card.face!=='up') return null;
      const h = locateCard(self); if(!h) return null;
      const n = u320OwnNaturia(h.p).length;
      return n ? {atk:-300*n, def:-300*n} : null;
    } }});

/* ---- スタッグ ---- */
function u320Attacking(card){
  const b = gameState.battle, a = gameState.pendingAttack;
  if(b && (gameState.players[b.player].mz||[])[b.atkIdx]===card) return true;
  return !!(a && a.attackerUid!=null && card && card.uid===a.attackerUid);
}
function u320StagGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>u320Naturia(x.db)); }
defineScript('ナチュル・スタッグ', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'], targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    const e = ctx.event;
    if(!e || e.player!==ctx.opponent || (e.kind!=='spell' && e.kind!=='trap' && e.kind!=='monster')){ ctx.reason = '相手が魔法・罠・効果モンスターの効果を発動した時に発動します'; return false; }
    if(!u320Attacking(ctx.card)){ ctx.reason = 'このカードが攻撃を行うバトルステップ・ダメージステップ中に発動します'; return false; }
    if(Number(ctx.card.stagTurnU320)===gameState.turn){ ctx.reason = '1ターンに1度です'; return false; }
    if(!u320StagGrave(ctx).length){ ctx.reason = '墓地に「ナチュル」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ナチュル・スタッグ：特殊召喚する墓地の「ナチュル」', u320StagGrave(ctx), t=>done([t])); },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(me) API.setCardFlag(me, 'stagTurnU320', gameState.turn, 'ナチュル・スタッグ', {silent:true}); done(true); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ナチュル・スタッグ');
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && !!ctx.event && ctx.event.player===ctx.opponent && u320Attacking(ctx.card) && u320StagGrave(ctx).length>0; } }
});

/* ---- ホワイトオーク ---- */
function u320OakTargeted(ctx){
  const e = ctx.event;
  if(!e || e.player!==ctx.opponent || e.chainId==null || typeof chainLinkTargetsV11!=='function') return false;
  const uids = [];   /* an entry is a handle or a card-specific wrapper ({mode, t:handle}) */
  chainLinkTargetsV11(e.chainId).forEach(x=>[x, x && x.t].forEach(y=>{ if(!y) return; const u = y.uid!=null ? y.uid : (y.card ? y.card.uid : null); if(u!=null) uids.push(u); }));
  return ctx.card.uid!=null && uids.indexOf(ctx.card.uid)>=0;
}
function u320OakPool(p){ return API.pileCards(p, 'deck', x=>u320Naturia(x.db) && (x.db.lv||99)<=4); }
function u320OakFree(p){ return gameState.players[p].mz.length - 1 + 2 <= ZONE_LIMITS.mz; }
defineScript('ナチュル・ホワイトオーク', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'], includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = '表側表示でモンスターゾーンに存在する場合に発動します'; return false; }
    if(!u320OakTargeted(ctx)){ ctx.reason = '相手のカードの効果の対象になった時に発動します'; return false; }
    if(u320OakPool(ctx.player).length<2){ ctx.reason = 'デッキにレベル4以下の「ナチュル」が2体必要です'; return false; }
    if(!u320OakFree(ctx.player)){ ctx.reason = 'モンスターゾーンに2体分の空きが必要です'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, 'ナチュル・ホワイトオーク（コスト）'); done(true); },
  resolve(ctx){
    if(!u320OakFree(ctx.player) && gameState.players[ctx.player].mz.length + 2 > ZONE_LIMITS.mz) return;
    const summon = (n, left)=>{
      if(n>=2) { API.shuffle(ctx.player); return; }
      const pool = u320OakPool(ctx.player).filter(x=>left.indexOf(x.card.uid)<0);
      if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
      API.selectCard(`ナチュル・ホワイトオーク：特殊召喚する「ナチュル」（${n+1}/2）`, pool, t=>{
        const r = t && resolveTarget(t);
        if(r && r.zone==='deck' && hasMonsterZoneSpace(ctx.player)){
          const u = r.card.uid != null ? r.card.uid : ensureCardUid(gameState, r.card);
          API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'ナチュル・ホワイトオーク');
          const now = findCardByUid(u);
          if(now && now.zone==='mz'){
            API.setCardFlag(now, 'cannotAttack', true, 'ナチュル・ホワイトオーク', {silent:true});
            API.schedule({at:'endPhase', turns:(gameState.activePlayer===ctx.player?0:1), player:ctx.player, handler:'u320.oak-end', args:{uid:u}, note:'ナチュル・ホワイトオーク'});
          }
        }
        summon(n+1, left.concat(r && r.card.uid!=null ? [r.card.uid] : []));
      });
    };
    summon(0, []);
  },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && u320OakTargeted(ctx) && u320OakPool(ctx.player).length>=2; } }
});
API.registerScheduleHandler('u320.oak-end', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz') API.destroy(h, 'ナチュル・ホワイトオーク（エンドフェイズ）');
});
declareActivationResponseS03(['ナチュル・スタッグ', 'ナチュル・ホワイトオーク']);
