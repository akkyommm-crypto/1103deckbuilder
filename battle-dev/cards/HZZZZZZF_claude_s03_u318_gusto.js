/* S03-U318: 「ガスタ」 (Gusto) — the four ダイガスタ Synchro Monsters and ガスタの神官 ムスト (carddata texts; 「ガスタ」 = GROUP.GUSTO, setcode-exact).

   ダイガスタ・ファルコス   このカードがシンクロ召喚に成功した時、フィールド上の全ての「ガスタ」と名のついたモンスターの攻撃力は600ポイントアップする。
   ダイガスタ・スフィアード このカードがシンクロ召喚に成功した時、自分の墓地の「ガスタ」と名のついたカード1枚を選択して手札に加える事ができる。このカードがフィールド上に表側表示で存在する限り、自分フィールド上の
                           「ガスタ」と名のついたモンスターの戦闘によって発生する自分への戦闘ダメージは代わりに相手が受ける。また、このカードは戦闘では破壊されない。
   ダイガスタ・ガルドス     1ターンに1度、自分の墓地の「ガスタ」と名のついたモンスター2体をデッキに戻して発動できる。相手フィールド上に表側表示で存在するモンスター1体を選択して破壊する。
   ダイガスタ・イグルス     1ターンに1度、自分のエンドフェイズ時に自分の墓地の風属性モンスター1体をゲームから除外して発動できる。相手フィールド上にセットされたカード1枚を選択して破壊する。
   ガスタの神官 ムスト     1ターンに1度、自分のメインフェイズ時に発動できる。自分の墓地の「ガスタ」と名のついたモンスター1体を選択してデッキに戻し、フィールド上に表側表示で存在するモンスター1体を選択してその効果を
                           エンドフェイズ時まで無効にする。

   Notes
   - 「シンクロ召喚に成功した時」 = s03SelfSynchroSummonedU121 (the Synchro Summon event of this card). ファルコス: a permanent ATK modifier on every face-up 「ガスタ」 monster (either player's) on the field at that time.
   - スフィアード: the battle damage that would hit its controller is redirected to the opponent when the battle involves one of the controller's face-up 「ガスタ」 monsters (continuous.battleDamageRedirect); not destroyed by
     battle (declared with protectV21 as well as read from the text, so it does not depend on the sentence position).
   - ガルドス: the two 「ガスタ」 monsters returned from the Graveyard are the cost (the Deck is shuffled); the destroyed monster is a target chosen after the cost. イグルス: an optional End Phase trigger, cost = banish a WIND
     monster of my Graveyard, target = a face-down card (Set monster / Spell / Trap) on the opponent's field.
   - ムスト: the effect negation until the End Phase is the turn-stamped flag negatedUntilTurn. */

function u318Gusto(x){ return !!x && x.card && isCardInGroupV4(x.card, GROUP.GUSTO); }
function u318Synchro(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && s03SelfSynchroSummonedU121(ctx); }

/* ---- ダイガスタ・ファルコス ---- */
defineUnifiedCardV4('ダイガスタ・ファルコス', [{
  key:'synchro-boost', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u318Synchro(ctx); },
  operation(ctx){
    API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && u318Gusto(x)}).forEach(h=>API.modAtk(h, 600, 0, 'permanent', 'ダイガスタ・ファルコス'));
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], passive:{ onSpecialSummon(ctx){ return u318Synchro(ctx); } }});

/* ---- ダイガスタ・スフィアード ---- */
function u318GraveGusto(ctx){ return API.pileCards(ctx.player, 'grave', x=>u318Gusto(x)); }
defineUnifiedCardV4('ダイガスタ・スフィアード', [{
  key:'synchro-recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){ return u318Synchro(ctx) && u318GraveGusto(ctx).length>0; },
  target(ctx, done){ API.selectCard('ダイガスタ・スフィアード：手札に加える墓地の「ガスタ」', u318GraveGusto(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && u318Gusto(r)) API.returnToHand(r, 'ダイガスタ・スフィアード');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], targets:true, passive:{ onSpecialSummon(ctx){ return u318Synchro(ctx) && u318GraveGusto(ctx).length>0; } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    battleDamageRedirect(info){
      const self = info.self, src = info.srcPlayer;
      if(!self || self.face!=='up' || info.to!==src || !(Number(info.amount)>0)) return null;
      const mine = c=>{ if(!c || c.face!=='up') return false; const h = locateCard(c); return !!h && h.p===src && h.zone==='mz' && isCardInGroupV4(c, GROUP.GUSTO); };
      return (mine(info.atkCard) || mine(info.defCard)) ? (src===0 ? 1 : 0) : null;
    },
    protectV21:{ key:'ダイガスタ・スフィアード', label:'ダイガスタ・スフィアード', scope:'self', effect:false, battle:true } }});

/* ---- ダイガスタ・ガルドス ---- */
defineUnifiedCardV4('ダイガスタ・ガルドス', [{
  key:'return-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(u318GraveGusto(ctx).filter(x=>x.db.k==='m').length<2){ ctx.reason = '墓地に「ガスタ」モンスターが2体必要です'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = '相手フィールド上に表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = ()=>u318GraveGusto(ctx).filter(x=>x.db.k==='m');
    API.selectCard('ダイガスタ・ガルドス：デッキに戻す墓地の「ガスタ」モンスター（1/2）', pool(), t1=>{
      const a = t1 && resolveTarget(t1);
      if(!a || a.zone!=='grave'){ done(false); return; }
      API.selectCard('ダイガスタ・ガルドス：デッキに戻す墓地の「ガスタ」モンスター（2/2）', pool().filter(x=>x.card!==a.card), t2=>{
        const b = t2 && resolveTarget(t2);
        if(!b || b.zone!=='grave'){ done(false); return; }
        const ca = a.card, cb = b.card;
        API.returnToDeck(a, false, 'ダイガスタ・ガルドス（コスト）');
        const hb = locateCardAnyV4(cb); if(hb && hb.zone==='grave') API.returnToDeck(hb, false, 'ダイガスタ・ガルドス（コスト）');
        API.shuffle(ctx.player);
        done(true);
      });
    });
  },
  target(ctx, done){ API.selectCard('ダイガスタ・ガルドス：破壊する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent) API.destroy(r, 'ダイガスタ・ガルドス'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['return-destroy']}});

/* ---- ダイガスタ・イグルス ---- */
function u318WindGrave(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='風'); }
function u318FoeSet(ctx){ return API.fieldCards({player:ctx.opponent}).filter(x=>x.card.face==='down'); }
defineUnifiedCardV4('ダイガスタ・イグルス', [{
  key:'endphase-destroy-set', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){
    return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='end' && u318WindGrave(ctx).length>0 && u318FoeSet(ctx).length>0;
  },
  cost(ctx, done){
    API.selectCard('ダイガスタ・イグルス：除外する墓地の風属性モンスター', u318WindGrave(ctx), t=>{
      const r = t && resolveTarget(t);
      if(!r || r.zone!=='grave'){ done(false); return; }
      API.banish(r, 'ダイガスタ・イグルス（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('ダイガスタ・イグルス：破壊する相手のセットされたカード', u318FoeSet(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.p===ctx.opponent && r.card.face==='down') API.destroy(r, 'ダイガスタ・イグルス'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], targets:true, countLimit:{n:1, effects:['endphase-destroy-set']},
  passive:{ onEndPhase(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && gameState.phase==='end' && u318WindGrave(ctx).length>0 && u318FoeSet(ctx).length>0; } }});

/* ---- ガスタの神官 ムスト ---- */
function u318MustoMonsters(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u318Gusto(x)); }
function u318MustoFoes(ctx){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.card!==ctx.card}); }
defineUnifiedCardV4('ガスタの神官 ムスト', [{
  key:'return-negate', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.ALL, targetSide:'both',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || !(gameState.phase==='main1' || gameState.phase==='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u318MustoMonsters(ctx).length){ ctx.reason = '墓地に「ガスタ」モンスターがいません'; return false; }
    if(!u318MustoFoes(ctx).length){ ctx.reason = '効果を無効にできる表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){
    API.selectCard('ガスタの神官 ムスト：デッキに戻す墓地の「ガスタ」モンスター', u318MustoMonsters(ctx), a=>{
      API.selectCard('ガスタの神官 ムスト：効果を無効にするモンスター', u318MustoFoes(ctx), b=>done([a, b]));
    });
  },
  operation(ctx){
    const ta = ctx.selectedTargets && ctx.selectedTargets[0], tb = ctx.selectedTargets && ctx.selectedTargets[1];
    const a = ta && resolveTarget(ta), b = tb && resolveTarget(tb);
    if(a && a.zone==='grave' && a.p===ctx.player){ API.returnToDeck(a, false, 'ガスタの神官 ムスト'); API.shuffle(ctx.player); }
    const b2 = b && locateCardAnyV4(b.card);
    if(b2 && b2.zone==='mz' && b2.card.face==='up') API.setCardFlag(b2, 'negatedUntilTurn', gameState.turn, 'ガスタの神官 ムスト');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['return-negate']}});
