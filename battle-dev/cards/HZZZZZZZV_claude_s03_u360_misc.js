/* S03-U360: four monsters with battle-time ATK, a forced target, a banish-for-search and a three-mode banisher (carddata texts).

   サイバー・オーガ・2   このカードが攻撃を行う時、攻撃対象モンスターの攻撃力の半分の数値だけこのカードの攻撃力をアップする。
   E・HERO ブルーメ      通常召喚できない。「ブルーメンブラット」の効果でのみ特殊召喚できる。相手は「E・HERO ブルーメ」しか攻撃対象に選択できない。相手プレイヤーに戦闘ダメージを与える度に、攻撃力は200アップし守備力は200ダウンする。
   E・HERO フラッシュ    戦闘によって破壊され墓地へ送られた時、自分の墓地からこのカードと「E・HERO」モンスター3種類を除外する事で、墓地の通常魔法カード1枚を手札に加える。
   サイバー・ヴァリー    以下から1つを選択して発動できる。●攻撃対象に選択された時、このカードを除外して発動できる。デッキから1枚ドローし、バトルフェイズを終了する。●メインフェイズ時、このカードと自分の表側表示モンスター1体を選択して除外し、その後デッキから2枚ドローする。●メインフェイズ時、墓地のカード1枚を選択して発動できる。このカードと手札1枚を除外し、その後選択したカードをデッキの一番上に戻す。

   Notes
   - オーガ・2: continuous ATK read from gameState.battle while it attacks (+ half of the target's current ATK).
   - ブルーメ: 「ブルーメンブラット」 only is parsed from the card text (summonOnlyByS03); cannotBeAttackTarget on the controller's other monsters; the battle-damage counter is a card flag (count) read by the continuous ATK / DEF.
   - フラッシュ: Graveyard trigger after a battle destruction; the cost banishes itself and three differently named E・HERO monsters.
   - ヴァリー: three separate effects; the draws use API.draw and the first mode ends the Battle Phase with API.endBattlePhase. */

/* ---- サイバー・オーガ・2 ---- */
defineUnifiedCardV4('サイバー・オーガ・2', [], {type:'monster', priority:1,
  continuous:{ scope:'self', from:['mz'], apply(card, self){
    if(card!==self || self.face!=='up') return null;
    const b = gameState.battle; if(!b || b.target==='direct' || b.targetUid==null) return null;
    if((gameState.players[b.player].mz||[])[b.atkIdx]!==self) return null;
    const t = findCardByUid(b.targetUid); if(!t || t.zone!=='mz') return null;
    return {atk:Math.floor(Math.max(0, curATK(t.card))/2)};
  } } });

/* ---- E・HERO ブルーメ ---- */
function u360BlumeHit(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a3DealtBattleDamage(ctx); }
defineUnifiedCardV4('E・HERO ブルーメ', [{
  key:'grow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return u360BlumeHit(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u360Blume', (Number(ctx.card.u360Blume)||0)+1, 'E・HERO ブルーメ', {silent:true}); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, timing:['free'],
  passive:{ onBattleDamage(ctx){ return u360BlumeHit(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'],
    apply(card, self){ if(card!==self || self.face!=='up') return null; const n = Number(self.u360Blume)||0; return n ? {atk:200*n, def:-200*n} : null; },
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || !target || target===self) return false;
      const sh = findCardByUid(self.uid), th = findCardByUid(target.uid);
      return !!sh && !!th && th.zone==='mz' && th.p===sh.p;
    } } });

/* ---- E・HERO フラッシュ ---- */
function u360FlashSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.battle && Number(g.turn)===Number(gameState.turn);
}
function u360FlashHeroes(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.card!==ctx.card && String(x.db.n||'').indexOf('E・HERO')===0); }
function u360FlashSpells(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='s' && !(x.db.st||[]).length); }
function u360FlashNames(list){ const s = {}; list.forEach(x=>{ s[x.db.n] = 1; }); return Object.keys(s); }
defineUnifiedCardV4('E・HERO フラッシュ', [{
  key:'retrieve', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u360FlashSent(ctx) && u360FlashNames(u360FlashHeroes(ctx)).length>=3 && u360FlashSpells(ctx).length>0; },
  cost(ctx, done){
    const picked = [];
    const step = ()=>{
      if(picked.length>=3){
        picked.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave') API.banish(h, 'E・HERO フラッシュ（コスト）'); });
        const me = locateCardAnyV4(ctx.card); if(me && me.zone==='grave') API.banish(me, 'E・HERO フラッシュ（コスト）');
        done(true); return;
      }
      const have = picked.map(u=>{ const h = findCardByUid(u); return h ? dbOf(h.card).n : null; });
      const pool = u360FlashHeroes(ctx).filter(x=>have.indexOf(x.db.n)<0 && picked.indexOf(x.card.uid)<0);
      if(!pool.length){ done(false); return; }
      API.selectCard('E・HERO フラッシュ：除外する「E・HERO」（'+(picked.length+1)+'/3種類目）', pool, t=>{ const r = t && resolveTarget(t); if(!r){ done(false); return; } picked.push(ensureCardUid(gameState, r.card)); step(); });
    };
    step();
  },
  operation(ctx){
    const pool = u360FlashSpells(ctx); if(!pool.length) return;
    API.selectCard('E・HERO フラッシュ：手札に加える通常魔法', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player) API.returnToHand(r, 'E・HERO フラッシュ'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'],
  passive:{ onSendToGrave(ctx){ return u360FlashSent(ctx) && u360FlashNames(u360FlashHeroes(ctx)).length>=3 && u360FlashSpells(ctx).length>0; }, onDestroy(ctx){ return u360FlashSent(ctx) && u360FlashNames(u360FlashHeroes(ctx)).length>=3 && u360FlashSpells(ctx).length>0; } } });

/* ---- サイバー・ヴァリー ---- */
function u360ValleyTargeted(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && ctx.card.face==='up' && !!a && a.player===ctx.opponent && a.targetUid!=null && a.targetUid===ctx.card.uid;
}
function u360ValleyMain(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u360ValleyFriends(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up'}); }
defineUnifiedCardV4('サイバー・ヴァリー', [{
  key:'dodge', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ return u360ValleyTargeted(ctx) && API.me(ctx).deck.length>0; },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.banish(me, 'サイバー・ヴァリー（コスト）'); done(true); },
  operation(ctx){ API.draw(ctx.player, 1); API.endBattlePhase('サイバー・ヴァリー'); },
  afterResolve(){}
}, {
  key:'swap', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u360ValleyMain(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u360ValleyFriends(ctx).length){ ctx.reason = '除外する自分の表側表示モンスターがいません'; return false; }
    if(API.me(ctx).deck.length<2){ ctx.reason = 'デッキのカードが足りません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('サイバー・ヴァリー：一緒に除外する自分のモンスター', u360ValleyFriends(ctx), t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card); if(!r || r.zone!=='mz' || !me || me.zone!=='mz'){ done(false); return; }
      API.banish(r, 'サイバー・ヴァリー（コスト）'); const me2 = locateCardAnyV4(ctx.card); if(me2 && me2.zone==='mz') API.banish(me2, 'サイバー・ヴァリー（コスト）');
      done(true);
    });
  },
  operation(ctx){ API.draw(ctx.player, 2); },
  afterResolve(){}
}, {
  key:'recycle', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u360ValleyMain(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.me(ctx).hand.length){ ctx.reason = '手札がありません'; return false; }
    if(!API.pileCards(ctx.player, 'grave', ()=>true).length){ ctx.reason = '墓地にカードがありません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('サイバー・ヴァリー：デッキの一番上に戻す墓地のカード', API.pileCards(ctx.player, 'grave', ()=>true), t=>done([t])); },
  cost(ctx, done){
    API.selectCard('サイバー・ヴァリー：一緒に除外する手札', API.pileCards(ctx.player, 'hand', ()=>true), t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card); if(!r || r.zone!=='hand' || !me || me.zone!=='mz'){ done(false); return; }
      API.banish(r, 'サイバー・ヴァリー（コスト）'); const me2 = locateCardAnyV4(ctx.card); if(me2 && me2.zone==='mz') API.banish(me2, 'サイバー・ヴァリー（コスト）');
      done(true);
    });
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player) API.returnToDeck(r, false, 'サイバー・ヴァリー');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, timing:['mainPhase'], passive:{ onAttackDeclare(ctx){ return u360ValleyTargeted(ctx) && API.me(ctx).deck.length>0; } } });
