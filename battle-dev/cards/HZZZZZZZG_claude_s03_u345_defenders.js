/* S03-U345: seven defensive / battle-reactive monsters (carddata texts).

   デッド・ガードナー   自分フィールドの表側表示モンスターが攻撃対象に選択された時、このカードに攻撃対象を変更できる。破壊され墓地へ送られた時、相手フィールドの表側表示モンスター1体の攻撃力はエンドフェイズ時まで1000ダウン。
   カードブロッカー     召喚・反転召喚・特殊召喚に成功した時、守備表示になる。自分フィールドの表側表示モンスターが攻撃対象に選択された時、このカードに攻撃対象を変更できる。このカードが攻撃対象になった時、デッキの上から3枚まで墓地へ送る事ができ、1枚につきエンドフェイズ時まで守備力500アップ。
   シャトルロイド       攻撃対象に選択された時、ゲームから除外できる。その場合、次の自分のスタンバイフェイズに自分フィールドに特殊召喚され、その時相手に1000ダメージ。
   ロックストーン・ウォリアー  このカードの戦闘によって発生する自分への戦闘ダメージは0。このカードの攻撃によって戦闘で破壊され墓地へ送られた時、「ロックストーン・トークン」（岩石族・地・星1・攻/守0）2体を特殊召喚する。このトークンはアドバンス召喚のためにはリリースできない。
   魔力吸収球体         相手が魔法カードを発動した時、表側表示のこのカードをリリースする事でその発動を無効にし破壊する。相手ターンにのみ発動できる。
   傀儡虫               手札から墓地へ捨て、相手フィールドの悪魔族・アンデット族モンスター1体を対象として発動できる。そのモンスターのコントロールをエンドフェイズまで得る。
   クリボン             攻撃対象になったダメージ計算時に発動できる。その戦闘で自分が受ける戦闘ダメージは0になり、攻撃モンスターの攻撃力分だけ相手のLPを回復し、このカードを手札に戻す。

   Notes
   - The attack redirect is API.redirectAttack({targetUid}) as in 宝玉獣 アンバー・マンモス (S03-U240): an optional trigger on onAttackDeclare while the attack targets another of my face-up monsters.
   - シャトルロイド: the banish is the effect (optional trigger on the attack declaration aimed at it); the return is scheduled (engine/16, my next Standby Phase) and is a Special Summon from the banished zone.
   - クリボン: the used card returns to the hand and lingers (API.lingerS03) as the source of battleDamage for that battle; ロックストーン・ウォリアー: a continuous battleDamage hook on itself. */

function u345MyTargeted(ctx){
  const a = gameState.pendingAttack;
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || !a || a.player!==ctx.opponent || a.targetUid==null || a.targetUid===ctx.card.uid) return false;
  const t = findCardByUid(a.targetUid);
  return !!t && t.zone==='mz' && t.p===ctx.player && t.card.face==='up';
}
function u345SelfTargeted(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && !!a && a.player===ctx.opponent && a.targetUid!=null && a.targetUid===ctx.card.uid;
}
function u345Redirect(name){
  return { key:'redirect', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'],
    condition(ctx){ return u345MyTargeted(ctx); },
    operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.redirectAttack({targetUid:ensureCardUid(gameState, me.card)}); },
    afterResolve(){} };
}

/* ---- デッド・ガードナー ---- */
function u345DeadSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn) && API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}).length>0;
}
defineUnifiedCardV4('デッド・ガードナー', [u345Redirect('デッド・ガードナー'), {
  key:'destroyed-shrink', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u345DeadSent(ctx); },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); if(!pool.length) return;
    API.selectCard('デッド・ガードナー：攻撃力を1000ダウンさせる相手モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent) API.modAtk(r, -1000, 0, 'endTurn', 'デッド・ガードナー'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], activateFrom:['mz','grave'],
  passive:{ onAttackDeclare(ctx){ return u345MyTargeted(ctx); }, onSendToGrave(ctx){ return u345DeadSent(ctx); } } });

/* ---- カードブロッカー ---- */
function u345BlockerSummon(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && ctx.card.pos==='atk' && eventIsSelfS03(ctx); }
function u345BlockerMill(ctx){ return u345SelfTargeted(ctx) && API.me(ctx).deck.length>0; }
defineUnifiedCardV4('カードブロッカー', [{
  key:'to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onFlip','onSpecialSummon'], forced:true,
  condition(ctx){ return u345BlockerSummon(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up' && me.card.pos==='atk') API.changePosition(me, 'def', 'カードブロッカー'); },
  afterResolve(){}
}, u345Redirect('カードブロッカー'), {
  key:'mill-boost', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'],
  condition(ctx){ return u345BlockerMill(ctx); },
  operation(ctx){
    const max = Math.min(3, API.me(ctx).deck.length); if(max<=0) return;
    const cands = []; for(let i=1;i<=max;i++) cands.push({key:String(i), label:'デッキの上から'+i+'枚を墓地へ送る（守備力+'+(500*i)+'）'}); cands.push({key:'0', label:'送らない'});
    API.selectCard('カードブロッカー：デッキの上から墓地へ送る枚数', cands, t=>{
      const n = t ? Number(t.key) : 0; if(!(n>0)) return;
      API.millTop(ctx.player, n, 'カードブロッカー');
      const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.modAtk(me, 0, 500*n, 'endTurn', 'カードブロッカー');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'],
  passive:{ onNormalSummon(ctx){ return u345BlockerSummon(ctx); }, onFlip(ctx){ return u345BlockerSummon(ctx); }, onSpecialSummon(ctx){ return u345BlockerSummon(ctx); },
    onAttackDeclare(ctx){ return u345MyTargeted(ctx) || u345BlockerMill(ctx); } } });

/* ---- シャトルロイド ---- */
API.registerScheduleHandler('u345.shuttle-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='banish' || h.p!==args.player || !hasMonsterZoneSpace(args.player)) return;
  API.specialSummon(args.player, 'banish', h.index, 'atk', 'シャトルロイド');
  API.damageLP(args.player===0?1:0, 1000, 'シャトルロイド');
});
defineUnifiedCardV4('シャトルロイド', [{
  key:'banish-self', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'],
  condition(ctx){ return u345SelfTargeted(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const uid = ensureCardUid(gameState, me.card);
    API.banish(me, 'シャトルロイド');
    const b = findCardByUid(uid);
    if(b && b.zone==='banish') API.schedule({at:'standbyPhase', turns:(gameState.activePlayer===ctx.player?2:1), player:ctx.player, handler:'u345.shuttle-return', args:{uid, player:ctx.player}, note:'シャトルロイド'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true, passive:{ onAttackDeclare(ctx){ return u345SelfTargeted(ctx); } } });

/* ---- ロックストーン・ウォリアー ---- */
function u345RockSent(ctx){
  const b = ctx.battle || {};
  return ctx.zone==='grave' && a3SelfBattleDestroyed(ctx) && !!b.atkCard && b.atkCard===ctx.card && hasMonsterZoneSpace(ctx.player);
}
defineUnifiedCardV4('ロックストーン・ウォリアー', [{
  key:'attack-destroyed-tokens', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u345RockSent(ctx); },
  operation(ctx){
    const n = Math.min(2, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length); if(n<=0) return;
    API.createToken(ctx.player, {name:'ロックストーン・トークン', atk:0, def:0, lv:1, ra:'岩石', at:'地', pos:'def', noAdvanceTributeS03:true}, n);
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['mz','grave'], includesSpecialSummon:true,
  passive:{ onDamageStep(ctx){ return u345RockSent(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    battleDamage(info){
      const s = info && info.self; if(!s || s.face!=='up' || (info.atkCard!==s && info.defCard!==s)) return info.amount;
      const loc = locateCard(s); return (loc && info.to===loc.p) ? 0 : info.amount;
    } } });

/* ---- 魔力吸収球体 ---- */
function u345FoeSpell(ctx){
  const top = gameState.chain && gameState.chain[gameState.chain.length-1];
  if(!top || top.player!==ctx.opponent) return false;
  const db = CARD_DB[findCardIndex(top.name)];
  return !!db && db.k==='s';
}
defineUnifiedCardV4('魔力吸収球体', [{
  key:'release-negate-spell', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(gameState.activePlayer!==ctx.opponent){ ctx.reason = '相手ターンにのみ発動できます'; return false; }
    if(!u345FoeSpell(ctx)){ ctx.reason = '相手が魔法カードを発動した時に発動します'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, '魔力吸収球体（リリース）'); done(true); },
  operation(){ negatePreviousChainLinkV2('魔力吸収球体', true); },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, timing:['free','chain']});

/* ---- 傀儡虫 ---- */
function u345Foes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && (x.db.ra==='悪魔' || x.db.ra==='アンデット')}); }
defineUnifiedCardV4('傀儡虫', [{
  key:'discard-take-control', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u345Foes(ctx).length){ ctx.reason = '相手フィールドに表側表示の悪魔族・アンデット族モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.discard(ctx.player, i, '傀儡虫（コスト）'); done(true); },
  target(ctx, done){ API.selectCard('傀儡虫：コントロールを得る相手の悪魔族・アンデット族モンスター', u345Foes(ctx), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent && r.card.face==='up') API.changeControl(r, ctx.player, '傀儡虫', 'endPhase'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['hand']});

/* ---- クリボン ---- */
function u345KuribonTarget(ctx){
  const b = gameState.battle;
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && !!b && b.target!=='direct' && b.targetUid===ctx.card.uid && b.atkUid!=null;
}
defineScript('クリボン', {
  type:'monster', priority:2, dsTiming:'calc', activateFrom:['mz'], timing:['damageStep'],
  condition(ctx){ if(!u345KuribonTarget(ctx)){ ctx.reason = '攻撃対象になったダメージ計算時に発動します'; return false; } return true; },
  resolve(ctx){
    const b = gameState.battle, a = b && b.atkUid!=null ? findCardByUid(b.atkUid) : null;
    const atk = a && a.zone==='mz' ? curATK(a.card) : 0;
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    if(atk>0) API.recoverLP(ctx.opponent, atk, 'クリボン');
    API.returnToHand(me, 'クリボン');
    const h = locateCardAnyV4(ctx.card);
    if(h && h.zone==='hand'){
      API.setCardFlag(h, 'u345KuribonTurn', gameState.turn, 'クリボン', {silent:true});
      const h2 = locateCardAnyV4(ctx.card); if(h2) API.lingerS03(ctx.player, h2, 'クリボン');
    }
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['linger'], apply(){ return null; },
    battleDamage(info){
      const s = info && info.self; if(!s || Number(s.u345KuribonTurn)!==Number(gameState.turn)) return info.amount;
      const h = findCardByUid(s.uid); if(!h) return info.amount;
      return info.to===h.p ? 0 : info.amount;
    } },
  passive:{ onDamageStep(ctx){ return u345KuribonTarget(ctx); } }
});
