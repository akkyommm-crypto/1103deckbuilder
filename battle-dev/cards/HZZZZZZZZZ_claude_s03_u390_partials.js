/* S03-U390: four PARTIAL auto-table entries replaced by exact scripts (carddata texts).

   白竜の聖騎士    「白竜降臨」により降臨。フィールドか手札から、レベルが4以上になるようカードを生け贄に捧げなければならない。このカードが裏側守備表示のモンスターを攻撃した場合、ダメージ計算を行わず裏側守備表示のままそのモンスターを破壊する。また、このカードを生け贄に捧げる事で手札またはデッキから「青眼の白龍」1体を特殊召喚する事ができる。(そのターン「青眼の白龍」は攻撃できない。)
   魔法の歯車      （通常魔法）①:自分フィールドの表側表示の「アンティーク・ギア」カード3枚を墓地へ送って発動できる。手札及びデッキからそれぞれ1体まで、「古代の機械巨人」を召喚条件を無視して特殊召喚する。その後、自分フィールドに「古代の機械巨人」以外のモンスターが存在する場合、そのモンスターを全て破壊する。この効果の発動後、自分のターンで数えて2ターンの間、自分は通常召喚できない。
   人海戦術        （永続罠）各ターンのエンドフェイズ時、そのターンで戦闘によって破壊された自分のレベル2以下の通常モンスターの数だけ、デッキからレベル2以下の通常モンスターを選択して自分フィールド上に特殊召喚する。その後デッキをシャッフルする。
   ボスラッシュ    （永続魔法）自分が通常召喚していないターンにこのカードを発動できる。①:このカードが魔法&罠ゾーンに存在する限り、自分は通常召喚できない。②:自分フィールドの表側表示の「巨大戦艦」モンスターが破壊され墓地へ送られた場合、そのターンのエンドフェイズに発動できる。デッキから「巨大戦艦」モンスター1体を特殊召喚する。

   Notes
   - 白竜の聖騎士: the Ritual Summon is 白竜降臨 (v5DefineRitualSpell, already scripted); the face-down attack clause reuses a3PreDamageDestroy's pieces (a3IsAttacker / a3AttackTarget / a3DestroyBeforeDamage, dsTiming 'start'); the release effect is an ignition whose cost sends the Knight to the Graveyard, then a 青眼の白龍 of the hand / Deck is
     Special Summoned with a card flag cannotAttackTurn.
   - 魔法の歯車: the cost sends three face-up 「アンティーク・ギア」 cards (GROUP.ANCIENT_GEAR, any zone of my field) to the Graveyard; at most one 古代の機械巨人 from the hand and one from the Deck are Special Summoned ignoring the conditions (opts.ignoreSummonConditionS03), my other monsters are destroyed, then banSummonS03 (engine/1ZZS)
     forbids my Normal Summons for my turns this turn and the next two (turns t .. t+2).
   - 人海戦術: a forced End Phase trigger of the Continuous Trap (every turn, either player's) counts my Level 2 or lower Normal Monsters destroyed by battle this turn (graveInfo.battle / lv / turn) and Special Summons as many Level 2 or lower Normal Monsters from the Deck (as many as the zones allow), then shuffles.
   - ボスラッシュ: activation needs an unused Normal Summon (P.normalSummonUsed); summonLockS03 forbids my Normal Summons while it is face-up; a forced End Phase trigger offers (optional, yes / no) a 「巨大戦艦」 of the Deck after one of mine was destroyed this turn. */

/* ---- 白竜の聖騎士 ---- */
function u390KnightFacedown(ctx){
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || !a3IsAttacker(ctx)) return null;
  const d = a3AttackTarget();
  return (d && d.pos==='def' && d.face==='down') ? d : null;
}
function u390BlueEyes(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.db.n==='青眼の白龍' && canEffectSpecialSummonS03(x.card, 'hand', '白竜の聖騎士')).concat(API.pileCards(ctx.player, 'deck', x=>x.db.n==='青眼の白龍' && canEffectSpecialSummonS03(x.card, 'deck', '白竜の聖騎士'))); }
defineUnifiedCardV4('白竜の聖騎士', [{
  key:'pierce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u390KnightFacedown(ctx); },
  operation(ctx){ const d = u390KnightFacedown(ctx); if(d) a3DestroyBeforeDamage(d, '白竜の聖騎士'); },
  afterResolve(){}
}, {
  key:'release', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u390BlueEyes(ctx).length){ ctx.reason = '手札・デッキに「青眼の白龍」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, '白竜の聖騎士（生け贄）'); done(true); },
  operation(ctx){
    const pool = u390BlueEyes(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('白竜の聖騎士：特殊召喚する「青眼の白龍」', pool, t=>{
      const r = t && resolveTarget(t); if(!r || (r.zone!=='hand' && r.zone!=='deck') || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      API.specialSummon(ctx.player, r.zone, r.index, 'atk', '白竜の聖騎士');
      const b = findCardByUid(uid); if(b && b.zone==='mz') API.setCardFlag(b, 'cannotAttackTurn', gameState.turn, '白竜の聖騎士', {silent:true});
      if(r.zone==='deck') API.shuffle(ctx.player);
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, dsTiming:'start', timing:['mainPhase'], includesSpecialSummon:true,
  passive:{ onDamageStep(ctx){ return !!u390KnightFacedown(ctx); } } });

/* ---- 魔法の歯車 ---- */
function u390Gears(ctx){
  const out = [];
  API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isCardInGroupV4(x.card, GROUP.ANCIENT_GEAR)}).forEach(x=>out.push(x));
  API.fieldCards({player:ctx.player, zone:'sz', filter:x=>x.card.face==='up' && isCardInGroupV4(x.card, GROUP.ANCIENT_GEAR) && x.card!==ctx.card}).forEach(x=>out.push(x));
  API.fieldCards({player:ctx.player, zone:'field', filter:x=>x.card.face==='up' && isCardInGroupV4(x.card, GROUP.ANCIENT_GEAR)}).forEach(x=>out.push(x));
  return out;
}
function u390Giants(p, zone){ return API.pileCards(p, zone, x=>x.db.n==='古代の機械巨人'); }
defineScript('魔法の歯車', {
  type:'spell', priority:1, targets:false, includesSpecialSummon:true,
  condition(ctx){
    if(u390Gears(ctx).length<3){ ctx.reason = '自分フィールドに表側表示の「アンティーク・ギア」カードが3枚必要です'; return false; }
    if(!u390Giants(ctx.player,'hand').length && !u390Giants(ctx.player,'deck').length){ ctx.reason = '手札・デッキに「古代の機械巨人」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    u342PickN('魔法の歯車：墓地へ送る「アンティーク・ギア」カード', ctx, u390Gears, 3, h=>API.sendToGrave(h, '魔法の歯車（コスト）'), done);
  },
  resolve(ctx){
    const keep = [];
    ['hand','deck'].forEach(z=>{
      const g = u390Giants(ctx.player, z)[0];
      if(g && hasMonsterZoneSpace(ctx.player)){
        const uid = ensureCardUid(gameState, g.card), h = findCardByUid(uid);
        if(h && h.zone===z){ API.specialSummon(ctx.player, z, h.index, 'atk', '魔法の歯車', null, {ignoreSummonConditionS03:true}); keep.push(uid); }
      }
    });
    API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.db.n!=='古代の機械巨人'}).slice().reverse().forEach(x=>{ const h = findCardByUid(ensureCardUid(gameState, x.card)); if(h && h.zone==='mz') API.destroy(h, '魔法の歯車'); });
    API.shuffle(ctx.player);
    banSummonS03(ctx.player, gameState.turn, gameState.turn+2, ['normal'], {}, '魔法の歯車');
  },
  afterResolve(){}
});

/* ---- 人海戦術 ---- */
function u390Swarm(ctx){
  const out = [];
  API.pileCards(ctx.player, 'grave', x=>{
    const g = x.card.graveInfo;
    return x.db.k==='m' && (x.db.st||[]).indexOf('通常')>=0 && !!g && g.battle && g.from==='mz' && Number(g.turn)===Number(gameState.turn) && Number(g.lv)<=2;
  }).forEach(x=>out.push(x));
  return out;
}
function u390SwarmPool(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && (x.db.st||[]).indexOf('通常')>=0 && Number(x.db.lv)<=2); }
function u390SwarmEnd(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && u390Swarm(ctx).length>0 && u390SwarmPool(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); }
defineUnifiedCardV4('人海戦術', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ return !(ctx.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}, {
  key:'swarm', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u390SwarmEnd(ctx); },
  operation(ctx){
    let n = u390Swarm(ctx).length;
    const step = ()=>{
      const pool = u390SwarmPool(ctx.player);
      if(n<=0 || !pool.length || !hasMonsterZoneSpace(ctx.player)){ API.shuffle(ctx.player); return; }
      API.selectCard('人海戦術：特殊召喚するレベル2以下の通常モンスター（残り'+n+'体）', pool, t=>{
        const r = t && resolveTarget(t);
        if(r && r.zone==='deck' && hasMonsterZoneSpace(ctx.player)){ API.specialSummon(ctx.player, 'deck', r.index, 'atk', '人海戦術'); n--; }
        else n = 0;
        step();
      });
    };
    step();
  },
  afterResolve(){}
}], {type:'trap', priority:2, forced:true, includesSpecialSummon:true, passive:{ onEndPhase(ctx){ return u390SwarmEnd(ctx); } } });

/* ---- ボスラッシュ ---- */
/* the card really stands face-up in the Spell & Trap Zone (a card activated from the hand is judged in the logical zone 'sz' with its hand face: that is not "already on the field") */
function u390Placed(ctx){ const h = locateCardAnyV4(ctx.card); return !!h && h.zone==='sz' && ctx.card.face==='up'; }
function u390Battleships(ctx){
  return API.pileCards(ctx.player, 'grave', x=>{
    const g = x.card.graveInfo;
    return x.db.k==='m' && String(x.db.n||'').indexOf('巨大戦艦')>=0 && !!g && g.byDestroy && g.from==='mz' && g.face==='up' && Number(g.turn)===Number(gameState.turn);
  });
}
function u390ShipPool(p){ return API.pileCards(p, 'deck', x=>x.db.k==='m' && String(x.db.n||'').indexOf('巨大戦艦')>=0); }
function u390BossEnd(ctx){ return ctx.zone==='sz' && ctx.card.face==='up' && !ctx.card.activationPending && u390Battleships(ctx).length>0 && u390ShipPool(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); }
defineUnifiedCardV4('ボスラッシュ', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:1, events:['activate'],
  condition(ctx){
    if(u390Placed(ctx)) return false;
    if(gameState.players[ctx.player].normalSummonUsed){ ctx.reason = 'このターンに通常召喚しているため発動できません'; return false; }
    return true;
  }, operation(){}, afterResolve(){}
}, {
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE, speed:1, events:['onEndPhase'],
  condition(ctx){ return u390BossEnd(ctx); },
  operation(ctx){
    const pool = u390ShipPool(ctx.player); if(!pool.length) return;
    API.selectCard('ボスラッシュ：特殊召喚する「巨大戦艦」モンスター', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && hasMonsterZoneSpace(ctx.player)){ API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'ボスラッシュ'); API.shuffle(ctx.player); }
    });
  },
  afterResolve(){}
}], {type:'spell', priority:1, includesSpecialSummon:true, passive:{ onEndPhase(ctx){ return u390BossEnd(ctx); } },
  summonLockS03:(i)=> i.kind==='normal' && i.p===i.srcPlayer });
