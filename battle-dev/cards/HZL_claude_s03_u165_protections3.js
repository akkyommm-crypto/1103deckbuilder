/* S03-U165: more monsters whose battle protection is conditional (read as unconditional from the text until S03-U158),
   with their full 2011 texts. */

/* デュアル・ソルジャー (2011, Gemini): 「…再度召喚する事で、このカードは効果モンスター扱いとなり以下の効果を得る。
   ●このカードは1ターンに1度だけ、戦闘では破壊されない。このカードが戦闘を行う場合、そのダメージ計算後に自分のデッキから
   「デュアル・ソルジャー」以外のレベル4以下のデュアルモンスター1体を自分フィールド上に特殊召喚する事ができる。」
   - defineGeminiS03 gates the condition / passive; protectV21 is an object (not wrapped), so its predicate checks geminiActiveS03.
   - The Special Summon: optional trigger after damage calculation (dsTiming 'after') of a battle this card took part in; the Deck
     is examined at resolution (shared engine/1ZT choice, 「特殊召喚する」 without a position → face-up, the player's choice). */
function dualSoldierPoolS03(p){
  return API.pileCards(p, 'deck', x=>x.db && x.db.k==='m' && !x.db.ex && isGeminiS03(x.card) && Number(x.db.lv||0)<=4
    && x.db.n!=='デュアル・ソルジャー' && canEffectSpecialSummonS03(x.card, 'deck', 'デュアル・ソルジャー'));
}
function dualSoldierBattledS03(ctx){
  const b = ctx.battle || {};
  return ctx.zone==='mz' && (b.atkCard===ctx.card || b.defCard===ctx.card);
}
defineGeminiS03('デュアル・ソルジャー', {
  type:'monster', priority:1, activateFrom:['mz'], dsTiming:'after',
  condition(ctx){
    if(!dualSoldierBattledS03(ctx)){ ctx.reason = 'このカードが戦闘を行ったダメージ計算後に発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ done([]); },
  resolve(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ API.log('デュアル・ソルジャー：モンスターゾーンが空いていない'); return; }
    const pool = dualSoldierPoolS03(ctx.player);
    if(!pool.length){ API.shuffle(ctx.player); API.log('デュアル・ソルジャー：条件を満たすデュアルモンスターがデッキに無い（デッキをシャッフル）'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'デュアル・ソルジャー：特殊召喚するデュアルモンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name:'デュアル・ソルジャー', action:'summon', pos:'faceUp'}}, meta:{scriptName:'デュアル・ソルジャー'}});
  },
  afterResolve(){},
  includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  passive:{ onDamageStep(ctx){ return dualSoldierBattledS03(ctx); } },
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'デュアル・ソルジャー', label:'デュアル・ソルジャー', perTurn:1, battle:(target, self)=> target===self && geminiActiveS03(self) }
  }
});

/* 幻獣サンダーペガス (2011): 「相手モンスターの攻撃宣言時、墓地のこのカードをゲームから除外し、自分フィールド上の「幻獣」と名のついた
   モンスター1体を選択して発動できる。このターン、選択した自分のモンスターは戦闘では破壊されない。」
   - Quick effect from the GY in the attack-declaration window of an opponent's attack (engine/1Y); cost: banish itself; target: a
     face-up 「幻獣」 monster it controls (GROUP.PHANTOM_BEAST). Resolution: a System v21 protection grant until the end of the turn. */
function thunderPegasusWindowS03(ctx){
  if(ctx.eventName==='onAttackDeclare'){ const e = ctx.event || {}; return e.player===ctx.opponent; }
  const a = (typeof attackDeclareWindowS03==='function') ? attackDeclareWindowS03() : null;
  return !!(a && a.player===ctx.opponent);
}
function phantomBeastsS03(p){
  return API.fieldCards({zone:'mz', player:p, filter:x=>x.card.face==='up' && isCardInGroupV4(x.card, GROUP.PHANTOM_BEAST)});
}
defineScript('幻獣サンダーペガス', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['grave'], targets:true,
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地で発動します'; return false; }
    if(!thunderPegasusWindowS03(ctx)){ ctx.reason = '相手モンスターの攻撃宣言時に発動できます'; return false; }
    if(!phantomBeastsS03(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「幻獣」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='grave'){ done(false); return; }
    API.banish(me, '幻獣サンダーペガス（コスト）'); done(true);
  },
  selectTargets(ctx, done){
    API.selectCard('幻獣サンダーペガス：戦闘では破壊されなくする「幻獣」モンスター', phantomBeastsS03(ctx.player), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.p!==ctx.player || r.card.face!=='up'){ API.log('幻獣サンダーペガス：対象のモンスターがいない'); return; }
    API.grantProtection(r, {key:'幻獣サンダーペガス', label:'幻獣サンダーペガス', battle:true, until:'endTurn', turn:gameState.turn});
  },
  afterResolve(){}
});

/* E・HERO テンペスター (2011): 「…このモンスターは融合召喚でしか特殊召喚できない。このカード以外の自分フィールド上のカード1枚を墓地に
   送り、自分フィールド上のモンスター1体を選択する。このカードがフィールド上に表側表示で存在する限り、選択したモンスターは戦闘によっては
   破壊されない。（ダメージ計算は適用する）」
   - Ignition effect (Main Phase); cost: send another card on its controller's field to the GY; target: a monster on its
     controller's field (this card included). No once-per-turn: each activation selects one more monster.
   - The link is zone-local on both sides: the target gets u165TempesterBy = this card's uid, this card lists the target's uid in
     u165TempesterUids. While this card is face-up, a linked monster is not destroyed by battle (protectV21, own monsters).
   - 「融合召喚でしか特殊召喚できない」 is read from the text by engine/1ZK. */
defineScript('E・HERO テンペスター', {
  type:'monster', priority:1, activateFrom:['mz'], targets:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドの表側表示のこのカードの効果です'; return false; }
    const me = API.me(ctx);
    const others = me.mz.filter(c=>c && c!==ctx.card).length + me.sz.length + (me.field?1:0);
    if(!others){ ctx.reason = '墓地へ送る他の自分のカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = API.me(ctx), list = [];
    me.mz.forEach((c,i)=>{ if(c && c!==ctx.card) list.push(v17Handle(ctx.player,'mz',i,c)); });
    me.sz.forEach((c,i)=>{ if(c) list.push(v17Handle(ctx.player,'sz',i,c)); });
    if(me.field) list.push(v17Handle(ctx.player,'field',0,me.field));
    API.selectCard('E・HERO テンペスター：墓地へ送るこのカード以外の自分のカード', list, t=>{ API.sendToGrave(t, 'E・HERO テンペスター（コスト）'); done(true); });
  },
  selectTargets(ctx, done){
    API.selectCard('E・HERO テンペスター：戦闘では破壊されなくする自分のモンスター', API.fieldCards({zone:'mz', player:ctx.player}), t=>done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    const me = locateCard(ctx.card);
    if(!r || r.zone!=='mz' || r.p!==ctx.player || !me || me.zone!=='mz'){ API.log('E・HERO テンペスター：対象のモンスターがいない'); return; }
    ensureCardUid(gameState, r.card); ensureCardUid(gameState, ctx.card);
    API.setCardFlag(r, 'u165TempesterBy', ctx.card.uid, 'E・HERO テンペスター', {silent:true});
    const list = (Array.isArray(ctx.card.u165TempesterUids) ? ctx.card.u165TempesterUids : []).concat([r.card.uid]);
    API.setCardFlag(me, 'u165TempesterUids', list, 'E・HERO テンペスター', {silent:true});
    API.log(`E・HERO テンペスター：${cardName(r.card)} は戦闘では破壊されない`);
  },
  afterResolve(){},
  continuous:{
    scope:'ownMonsters', from:['mz'],
    apply(){ return null; },
    protectV21:{ key:'E・HERO テンペスター', label:'E・HERO テンペスター',
      battle:(target, self)=> self.face==='up' && target.u165TempesterBy===self.uid && Array.isArray(self.u165TempesterUids) && self.u165TempesterUids.indexOf(target.uid)>=0 }
  }
});
