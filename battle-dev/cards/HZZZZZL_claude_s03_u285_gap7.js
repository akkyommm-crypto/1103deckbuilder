/* S03-U285: ENGINE_GAP re-check 7 (2011 texts) — イビー, A・O・J サイクロン・クリエイター, 絶対魔法禁止区域, マーダーサーカス.
   Parked (no script): 魔轟神ルリー and 魔轟神獣キャシー — the hand-size rule discard (engine/1ZZJ) queues onDiscardAnyS03 but the TURN processor never drains it, so the trigger is lost.
   No engine change. Reuses: onDiscardAnyS03 (engine/00 FX_DISCARD, S03-U196: every discard from the hand, a cost, an effect or the hand-size rule) with discardInfo /
   moveProvenance (S03-U162 / P3: the acting player of an effect discard is stamped from the resolving link), onPositionChange (engine/19, a Flip Summon, a manual change or an
   effect), the P1.1 activation-time target (activationV11 + p11cOpen / 'p11cards.commit-targets'), API.specialSummon (the position question is asked by engine/1ZZK, S03-U278),
   continuous.grantUnaffectedS03 (engine/1ZG, S03-U249; the source kind 's' of the stamped effect source, S03-U115 / U280), isTunerNowV17, the ChoiceRequest primitive with a
   registered resume handler. All helper names carry the S285 suffix. */

/* ---- イビー: このカードが相手のカードの効果によって手札から墓地へ捨てられた時、相手ライフに1000ポイントダメージを与える。 ----
   Forced. Only a discard from the hand by an effect of an opponent card: a cost (discardInfo null / provenance 'cost') and the hand-size rule (discardInfo null) do not count, and
   neither does an effect of its own controller. The acting player is the controller of the resolving effect (moveProvenance.actingPlayer, stamped by the engine). */
function ibiiDiscardedByFoeS285(ctx){
  if(!ctx.card || ctx.zone!=='grave' || !eventIsSelfS03(ctx)) return false;
  const g = ctx.card.graveInfo, di = ctx.card.discardInfo, mp = ctx.card.moveProvenance;
  if(!g || g.from!=='hand' || Number(g.turn)!==Number(gameState.turn) || !di || di.byEffect!==true) return false;
  const foe = ctx.player===0 ? 1 : 0;
  if(mp && mp.actingPlayer!=null) return mp.reason==='effect' && mp.actingPlayer===foe;
  return di.byPlayer===foe;
}
defineScript('イビー', {
  type:'monster', priority:1, activateFrom:['grave'], forced:true,
  condition(ctx){
    if(ctx.eventName!=='onDiscardAnyS03' || !ibiiDiscardedByFoeS285(ctx)){ ctx.reason = '相手のカードの効果で手札から捨てられた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.player===0 ? 1 : 0, 1000); },
  afterResolve(){},
  passive:{ onDiscardAnyS03(ctx){ return ibiiDiscardedByFoeS285(ctx); } }
});

/* ---- A・O・J サイクロン・クリエイター: 1ターンに1度、手札を1枚捨てて発動できる。フィールド上のチューナーの数だけ、フィールド上の魔法・罠カードを選んで持ち主の手札に戻す。 ----
   Ignition, once per turn (own Main Phase), cost: discard 1 (a cost discard: onDiscardAnyS03 fires, byEffect false). Ruling (Opus): not activatable without a face-up Tuner or without a
   Spell / Trap card on the field. Nothing is targeted: at resolution the face-up Tuners on both fields are counted (itself included), that many Spell / Trap cards (face-up or
   face-down, Field Zones too; fewer if fewer exist) are chosen by the activating player and returned to their owners' hands. */
function cycloneTunersS285(){ return API.fieldCards({zone:'mz', filter:x=>!!x.card && x.card.face==='up' && isTunerNowV17(x.card)}); }
function cycloneSTS285(){ return API.fieldCards({filter:x=>!!x.card && (x.zone==='sz' || x.zone==='field') && (x.db.k==='s' || x.db.k==='t')}); }
function cycloneReturnS285(uids, name){
  /* simultaneous return: locate each card by its uid just before it moves (indexes shift) */
  (uids||[]).forEach(u=>{
    const h = (u!=null) ? findCardByUid(u) : null;
    if(!h || ['sz','field'].indexOf(h.zone)<0) return;
    API.returnToHand(h, name);
  });
}
defineScript('A・O・J サイクロン・クリエイター', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer){ ctx.reason = '自分のターンにのみ発動できます'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!cycloneTunersS285().length){ ctx.reason = 'フィールド上に表側表示のチューナーがいません'; return false; }
    if(!cycloneSTS285().length){ ctx.reason = 'フィールド上に魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('A・O・J サイクロン・クリエイター：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{
      const r = resolveTarget(t);
      if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'A・O・J サイクロン・クリエイター（コスト）', {byEffect:false}); done(true);
    });
  },
  resolve(ctx){
    const name = 'A・O・J サイクロン・クリエイター';
    const n = cycloneTunersS285().length, pool = cycloneSTS285();
    if(!n || !pool.length){ API.log(name+'：チューナーまたは魔法・罠カードがないため不発'); return; }
    if(n>=pool.length){ cycloneReturnS285(pool.map(x=>x.card.uid), name); return; }
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:ctx.player, kind:'card', title:`${name}：持ち主の手札に戻す魔法・罠カード（${n}枚）`, candidates:pool, min:n, max:n, cancelable:false,
      resume:{handler:'s03u285.cyclone-return', args:{player:ctx.player}}, meta:{scriptName:name}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u285.cyclone-return', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const picked = (a.cards || []).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  cycloneReturnS285(picked, 'A・O・J サイクロン・クリエイター');
});

/* ---- 絶対魔法禁止区域 (Continuous Spell): フィールド上に表側表示で存在する全ての効果モンスター以外のモンスターは魔法の効果を受けない。 ----
   While it is face-up in the Spell & Trap Zone, every face-up non-Effect Monster on the field (both sides; Tokens and Normal / Fusion / Synchro / Xyz / Ritual without an
   effect) is unaffected by Spell card effects: chain-link effects (stamped source kind 's') and continuous Spell layers alike (engine/1ZG). Trap and monster effects still apply. */
function nonEffectMonsterS285(card){
  const d = dbOf(card);
  return !!d && d.k==='m' && (d.st||[]).indexOf('効果')<0;
}
defineScript('絶対魔法禁止区域', {
  type:'spell', priority:1,
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['sz'], apply(){ return null; },
    grantUnaffectedS03(card, src, self){
      if(!card || !self || self.face!=='up' || self.activationPending || !src || src.k!=='s') return false;
      const me = findCardByUid(self.uid), h = findCardByUid(card.uid);
      if(!me || me.zone!=='sz' || !h || h.zone!=='mz' || card.face!=='up') return false;
      return nonEffectMonsterS285(card);
    }}
});

/* ---- マーダーサーカス: フィールド上に守備表示で存在するこのカードが表側攻撃表示になった時、相手フィールド上に存在するモンスター1体を選択して持ち主の手札に戻す。 ----
   Forced trigger of onPositionChange: from Defense Position (face-up or face-down) to face-up Attack Position — a manual change, a Flip Summon or an effect; a Special Summon
   position choice is not a change (S03-U278). The target (one monster on the opponent's field, face-down ones too) is chosen at activation; with none it does not activate. */
function circusTurnedAtkS285(ctx){
  const e = ctx.event || {};
  return !!ctx.card && ctx.zone==='mz' && eventIsSelfS03(ctx) && e.fromPos==='def' && e.toFace==='up' && e.toPos==='atk';
}
function circusPoolS285(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>!!x.card}); }
defineScript('マーダーサーカス', {
  type:'monster', priority:1, forced:true, targets:true,
  condition(ctx){
    if(ctx.eventName!=='onPositionChange' || !circusTurnedAtkS285(ctx)){ ctx.reason = '守備表示から表側攻撃表示になった時に発動します'; return false; }
    if(!circusPoolS285(ctx).length){ ctx.reason = '相手フィールド上にモンスターがいません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'マーダーサーカス：手札に戻す相手モンスター', candidates:circusPoolS285(ctx), min:1, max:1, targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t ? resolveTarget(t) : null;
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent){ API.log('マーダーサーカス：対象が相手フィールドにないため不発'); return; }
    API.returnToHand(r, 'マーダーサーカス');
  },
  afterResolve(){},
  passive:{ onPositionChange(ctx){ return circusTurnedAtkS285(ctx) && circusPoolS285(ctx).length>0; } }
});
