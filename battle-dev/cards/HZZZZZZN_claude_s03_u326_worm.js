/* S03-U326: three more 「ワーム」 monsters (carddata texts; 「ワーム」 Reptiles = SETCODE.WORM + race 爬虫類, as ワーム・テンタクルス / ワーム・イーロキン).

   ワーム・ソリッド    このカードの守備力は、自分の墓地の「ワーム」と名のついた爬虫類族モンスターの数×100ポイントアップする。また、このカードが攻撃され、相手プレイヤーが戦闘ダメージを受けた場合、
                       そのダメージステップ終了時に相手フィールド上の魔法・罠カード1枚を選択して破壊する。
   ワーム・プリンス    このカードが戦闘によって相手モンスターを破壊した場合、デッキから「ワーム」と名のついた爬虫類族モンスター1体を手札に加える事ができる。エンドフェイズ時、自分フィールド上にこのカード以外の
                       「ワーム」と名のついた爬虫類族モンスターが存在しない場合、このカードを破壊する。
   ワーム・ミリディス  リバース:このカードを装備カード扱いとして相手モンスター1体に装備できる。お互いのスタンバイフェイズ毎に、装備モンスターのコントローラーに400ポイントダメージを与える。

   Notes
   - ソリッド: the DEF rise is a continuous modifier over the controller's Graveyard; the battle damage to the attacker is read from the onBattleDamage event (the attacker is the damaged player, this card the defender) and stamped on the card for the turn;
     the destruction is a targeted forced effect in the Damage Step's end window (dsTiming 'end') that needs a Spell / Trap card of the opponent.
   - プリンス: optional search after a battle kill (Damage Step 'after' window); the End Phase destruction is checked at every End Phase (either player's), faced-up Worm Reptiles only.
   - ミリディス: the optional Flip trigger moves the card itself to the Spell & Trap Zone as an Equip Card of a face-up opponent monster (API.equipMonster, the monster-equip of S03 v46); the Standby Phase effect is a forced trigger from the Spell & Trap Zone in both players'
     Standby Phases and hits the CURRENT controller of the equipped monster. */

function u326Worm(db){ return !!db && db.k==='m' && db.ra==='爬虫類' && isSetCardV4(db, SETCODE.WORM); }
function u326Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }

/* ---- ソリッド ---- */
function u326Dealt(ctx){
  const e = ctx.event || {};
  return u326Up(ctx) && e.defenderUid!=null && e.defenderUid===ctx.card.uid && e.player===ctx.opponent && Number(e.amount)>0;
}
function u326FoeSt(ctx){ return API.fieldCards({player:ctx.opponent}).filter(x=>x.zone==='sz' || x.zone==='field'); }
function u326SolidReady(ctx){ return u326Up(ctx) && Number(ctx.card.u326SolidTurn)===Number(gameState.turn) && u326FoeSt(ctx).length>0; }
defineUnifiedCardV4('ワーム・ソリッド', [{
  key:'mark', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return u326Dealt(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u326SolidTurn', gameState.turn, 'ワーム・ソリッド', {silent:true}); },
  afterResolve(){}
}, {
  key:'destroy-st', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true, targetRange:LOCATION.ONFIELD, targetSide:'opponent',
  condition(ctx){ return u326SolidReady(ctx); },
  target(ctx, done){ API.selectCard('ワーム・ソリッド：破壊する相手の魔法・罠カード', u326FoeSt(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u326SolidTurn', -1, 'ワーム・ソリッド', {silent:true});
    if(r && r.p===ctx.opponent && (r.zone==='sz' || r.zone==='field')) API.destroy(r, 'ワーム・ソリッド');
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true, timing:['free'], dsTiming:'end',
  passive:{ onBattleDamage(ctx){ return u326Dealt(ctx); }, onDamageStep(ctx){ return u326SolidReady(ctx); } },
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){
      if(card!==self || self.face!=='up') return null;
      const h = locateCard(self); if(!h) return null;
      const n = API.pileCards(h.p, 'grave', x=>u326Worm(x.db)).length;
      return n ? {def:100*n} : null;
    } }});

/* ---- プリンス ---- */
function u326Killed(ctx){
  const b = ctx.battle || {};
  if(b.atkCard===ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard===ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
function u326DeckWorms(p){ return API.pileCards(p, 'deck', x=>u326Worm(x.db)); }
function u326Alone(ctx){
  return !API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && u326Worm(x.db)}).length;
}
defineUnifiedCardV4('ワーム・プリンス', [{
  key:'kill-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'],
  condition(ctx){ return u326Up(ctx) && !!u326Killed(ctx) && u326DeckWorms(ctx.player).length>0; },
  operation(ctx){
    const pool = u326DeckWorms(ctx.player); if(!pool.length) return;
    API.selectCard('ワーム・プリンス：手札に加える「ワーム」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && r.p===ctx.player && u326Worm(dbOf(r.card))){ API.searchDeck(ctx.player, r.index, 'ワーム・プリンス'); API.shuffle(ctx.player); }
    });
  },
  afterResolve(){}
}, {
  key:'end-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u326Up(ctx) && gameState.phase==='end' && u326Alone(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up' && u326Alone(ctx)) API.destroy(me, 'ワーム・プリンス'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], dsTiming:'after',
  passive:{ onDamageStep(ctx){ return u326Up(ctx) && !!u326Killed(ctx) && u326DeckWorms(ctx.player).length>0; },
            onEndPhase(ctx){ return u326Up(ctx) && gameState.phase==='end' && u326Alone(ctx); } }});

/* ---- ミリディス ---- */
function u326FoeUp(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
function u326Flipped(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && ctx.card.face==='up'; }
function u326Equipped(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.v46MonsterEquip!==true || !ctx.card.equipTo) return null;
  const h = findCardByUid(ctx.card.equipTo.uid);
  return (h && h.zone==='mz') ? h : null;
}
defineUnifiedCardV4('ワーム・ミリディス', [{
  key:'flip-equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return u326Flipped(ctx) && u326FoeUp(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
  operation(ctx){
    const pool = u326FoeUp(ctx); if(!pool.length) return;
    API.selectCard('ワーム・ミリディス：装備する相手モンスター', pool, t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up' && me && me.zone==='mz') API.equipMonster(ctx.player, me, r, 'ワーム・ミリディス');
    });
  },
  afterResolve(){}
}, {
  key:'standby-damage', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return gameState.phase==='standby' && !!u326Equipped(ctx); },
  operation(ctx){ const h = u326Equipped(ctx); if(h) API.damageLP(h.p, 400, 'ワーム・ミリディス'); },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['mz','sz'], targets:true,
  passive:{ onFlip(ctx){ return u326Flipped(ctx) && u326FoeUp(ctx).length>0 && gameState.players[ctx.player].sz.length<ZONE_LIMITS.sz; },
            onStandbyPhase(ctx){ return gameState.phase==='standby' && !!u326Equipped(ctx); } }});
