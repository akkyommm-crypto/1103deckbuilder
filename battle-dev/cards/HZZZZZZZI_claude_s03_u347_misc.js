/* S03-U347: eight monsters (carddata texts).

   フレムベル・デスガンナー  特殊召喚できない。自分フィールドの「フレムベル」1体をリリースした場合のみ召喚できる。1ターンに1度、自分の墓地の守備力200のモンスター1体を除外する事で、除外したモンスターの攻撃力分のダメージを相手に与える。
   ネオフレムベル・シャーマン 自分の墓地に「フレムベル」が3体以上存在し、このカードが戦闘によって相手モンスターを破壊した場合、相手の墓地のカード1枚を選択して除外する。この効果の発動時に相手の墓地に魔法カードが存在しない場合、さらに相手に500ダメージ。
   速攻の黒い忍者        このカード名の効果は1ターンに1度。①:自分の墓地から闇属性2体を除外して発動できる。表側表示のこのカードをエンドフェイズまで除外する。この効果は相手ターンでも発動できる。
   インヴェルズ・グレズ    特殊召喚できない。通常召喚する場合、自分フィールドの「インヴェルズ」3体をリリースして召喚しなければならない。1ターンに1度、LPを半分払う事で、このカード以外のフィールドのカードを全て破壊する。
   マジオシャレオン        相手フィールドに魔法・罠カードが存在する限り、相手はこのカードを攻撃対象に選択できない。守備表示モンスターを攻撃した時、守備力を攻撃力が超えていればその数値だけ戦闘ダメージ。
   ボタニカル・ライオ      自分フィールドの表側表示の植物族1体につき攻撃力300アップ。表側表示で存在する限りコントロールを変更できない。
   幻影の妖精              相手モンスターから攻撃を受けた場合、他の自分のモンスター1体が攻撃を受けた事にし、ダメージ計算を行う。
   サモン・リアクター・AI  表側表示で存在する限り、相手フィールドにモンスターが召喚・反転召喚・特殊召喚された時、相手に800ダメージ（1ターンに1度）。この効果を使用したターンのバトルフェイズ、相手モンスター1体の攻撃を無効にできる。自分フィールドの、このカードと「トラップ・リアクター・RR」「マジック・リアクター・AID」をそれぞれ1体ずつ墓地へ送る事で、手札・デッキ・墓地から「ジャイアント・ボマー・エアレイド」1体を特殊召喚する。

   Notes
   - Not part of this unit: ジャイアント・ボマー・エアレイド (its second effect needs a Set-card event the engine does not dispatch). */

function u347Flam(h){ return h.db.k==='m' && String(h.db.n||'').indexOf('フレムベル')>=0; }
function u347Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }

/* ---- フレムベル・デスガンナー ---- */
function u347Def200(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && Number(x.db.def)===200); }
defineUnifiedCardV4('フレムベル・デスガンナー', [{
  key:'banish-burn', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u347Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
    if(!u347Def200(ctx).length){ ctx.reason = '墓地に守備力200のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('フレムベル・デスガンナー：除外する墓地の守備力200のモンスター', u347Def200(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
      API.setCardFlag(locateCardAnyV4(ctx.card), 'u347GunnerAtk', Number(dbOf(r.card).atk)||0, 'フレムベル・デスガンナー', {silent:true});
      API.banish(r, 'フレムベル・デスガンナー（コスト）'); done(true);
    });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); const n = me ? Number(me.card.u347GunnerAtk)||0 : 0; if(n>0) API.damageLP(ctx.opponent, n, 'フレムベル・デスガンナー'); },
  afterResolve(){}
}], {type:'monster', priority:1, cannotSpecialSummon:true, countLimit:{n:1, effects:['banish-burn']},
  normalSummonProcedure:{ includeStandard:false, methods:[{ id:'flam1', tributes:1, modes:['summon'], summonLabel:'「フレムベル」1体をリリースして召喚', materialFilter:u347Flam }] } });

/* ---- ネオフレムベル・シャーマン ---- */
function u347Shaman(ctx){
  const n = API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('フレムベル')>=0).length;
  return n>=3 && !u342Bad() && gearKilledFoeS03(ctx) && API.pileCards(ctx.opponent, 'grave').length>0;
}
defineUnifiedCardV4('ネオフレムベル・シャーマン', [{
  key:'kill-banish', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return u347Shaman(ctx); },
  operation(ctx){
    const pool = API.pileCards(ctx.opponent, 'grave'); if(!pool.length) return;
    const noSpell = !pool.some(x=>x.db.k==='s');
    API.selectCard('ネオフレムベル・シャーマン：除外する相手の墓地のカード', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave' || r.p!==ctx.opponent) return;
      API.banish(r, 'ネオフレムベル・シャーマン');
      if(noSpell) API.damageLP(ctx.opponent, 500, 'ネオフレムベル・シャーマン');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, dsTiming:'leave', timing:['free'], passive:{ onDamageStep(ctx){ return u347Shaman(ctx); } } });

/* ---- 速攻の黒い忍者 ---- */
API.registerScheduleHandler('u347.ninja-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='banish' || h.p!==args.player) return;
  if(gameState.players[h.p].mz.length>=ZONE_LIMITS.mz){ act({type:'MOVE', player:h.p, from:'banish', fromIndex:h.index, to:'grave', face:'up'}); return; }
  act({type:'MOVE', player:h.p, from:'banish', fromIndex:h.index, to:'mz', face:'up', pos:args.pos||'atk'});
});
function u347Dark(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='闇'); }
defineUnifiedCardV4('速攻の黒い忍者', [{
  key:'banish-self', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
    if(u347Dark(ctx).length<2){ ctx.reason = '墓地に闇属性モンスターが2体必要です'; return false; }
    return true;
  },
  cost(ctx, done){ u342PickN('速攻の黒い忍者：除外する墓地の闇属性モンスター', ctx, u347Dark, 2, h=>API.banish(h, '速攻の黒い忍者（コスト）'), done); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz' || me.card.face!=='up') return;
    const uid = ensureCardUid(gameState, me.card), pos = me.card.pos;
    API.banish(me, '速攻の黒い忍者');
    const b = findCardByUid(uid);
    if(b && b.zone==='banish') API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u347.ninja-return', args:{uid, player:ctx.player, pos}, note:'速攻の黒い忍者'});
  },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, timing:['free'], countLimit:{n:1, effects:['banish-self']} });

/* ---- インヴェルズ・グレズ ---- */
function u347Others(ctx){ return API.fieldCards({}).filter(x=>x.card!==ctx.card); }
defineUnifiedCardV4('インヴェルズ・グレズ', [{
  key:'half-lp-wipe', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u347Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(API.me(ctx).lp<2){ ctx.reason = 'ライフポイントが足りません'; return false; }
    if(!u347Others(ctx).length){ ctx.reason = '他のカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){ const lp = API.me(ctx).lp; API.payCost(ctx.player, Math.floor(lp/2)); done(true); },
  operation(ctx){ u347Others(ctx).slice().forEach(h=>{ const r = resolveTarget(h); if(r && r.card!==ctx.card && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'インヴェルズ・グレズ'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, cannotSpecialSummon:true, destroysFieldV46:true, countLimit:{n:1, effects:['half-lp-wipe']},
  normalSummonProcedure:{ includeStandard:false, methods:[{ id:'invase3', tributes:3, modes:['summon'], summonLabel:'「インヴェルズ」3体をリリースして召喚', materialFilter:(h)=> h.db.k==='m' && String(h.db.n||'').indexOf('インヴェルズ')>=0 }] } });

/* ---- マジオシャレオン ---- */
function u347Pierce(info){
  const self = info.self;
  if(!self || self.face!=='up' || info.atkCard!==self || !info.defCard || info.defCard.pos!=='def') return 0;
  return Math.max(0, curATK(self) - curDEF(info.defCard));
}
defineScript('マジオシャレオン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || target!==self) return false;
      const loc = locateCard(self); if(!loc) return false;
      return API.fieldCards({player:loc.p===0?1:0}).some(x=>x.zone==='sz' || x.zone==='field');
    },
    piercingDamage:u347Pierce }
});

/* ---- ボタニカル・ライオ ---- */
defineScript('ボタニカル・ライオ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  controlLockS03(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz' && h.card.face==='up'; },
  continuous:{ scope:'self', from:['mz'], apply(card, self, info){
    if(card!==self || self.face!=='up') return null;
    const n = API.fieldCards({player:info.p, zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='植物'}).length;
    return n ? {atk:n*300} : null;
  } }
});

/* ---- 幻影の妖精 ---- */
function u347FairyReady(ctx){
  const a = gameState.pendingAttack;
  return ctx.zone==='mz' && ctx.card.face==='up' && !!a && a.player===ctx.opponent && a.targetUid!=null && a.targetUid===ctx.card.uid
    && API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}).length>0;
}
defineUnifiedCardV4('幻影の妖精', [{
  key:'redirect', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return u347FairyReady(ctx); },
  operation(ctx){
    const pool = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}); if(!pool.length) return;
    API.selectCard('幻影の妖精：攻撃を受けた事にする自分のモンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz') API.redirectAttack({targetUid:ensureCardUid(gameState, r.card)}); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], passive:{ onAttackDeclare(ctx){ return u347FairyReady(ctx); } } });

/* ---- サモン・リアクター・AI ---- */
function u347AiSummon(ctx){
  const e = ctx.event || {}, c = e.card, h = c ? locateCardAnyV4(c) : null;
  return ctx.zone==='mz' && ctx.card.face==='up' && !!h && h.zone==='mz' && h.p===ctx.opponent && Number(ctx.card.u347AiTurn)!==Number(gameState.turn);
}
function u347AiNegate(ctx){ const a = gameState.pendingAttack; return ctx.zone==='mz' && ctx.card.face==='up' && Number(ctx.card.u347AiTurn)===Number(gameState.turn) && !!a && a.player===ctx.opponent && ctx.card.u347AiNeg!==gameState.turn; }
function u347AiPartner(ctx, name){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===name}); }
const U347_AI_SET = ['トラップ・リアクター・RR','マジック・リアクター・AID'];
function u347AiBomber(ctx){ return ['hand','deck','grave'].reduce((a,z)=>a.concat(API.pileCards(ctx.player, z, x=>x.db.n==='ジャイアント・ボマー・エアレイド')), []); }
const u347AiTrigger = (ev)=>({
  key:'summon-burn-'+ev, type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:[ev], forced:true,
  condition(ctx){ return u347AiSummon(ctx); },
  operation(ctx){
    API.damageLP(ctx.opponent, 800, 'サモン・リアクター・AI');
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u347AiTurn', gameState.turn, 'サモン・リアクター・AI', {silent:true});
  },
  afterResolve(){} });
defineUnifiedCardV4('サモン・リアクター・AI', [u347AiTrigger('onNormalSummon'), u347AiTrigger('onSpecialSummon'), {
  key:'negate-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ return u347AiNegate(ctx); },
  operation(ctx){ API.negateAttack('サモン・リアクター・AI'); const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'u347AiNeg', gameState.turn, 'サモン・リアクター・AI', {silent:true}); },
  afterResolve(){}
}, {
  key:'summon-bomber', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u347Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    const miss = U347_AI_SET.filter(n=>!u347AiPartner(ctx, n).length);
    if(miss.length){ ctx.reason = '「'+miss[0]+'」が自分フィールドにいません'; return false; }
    if(!u347AiBomber(ctx).length){ ctx.reason = '「ジャイアント・ボマー・エアレイド」がいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const uids = U347_AI_SET.map(n=>{ const l = u347AiPartner(ctx, n); return l.length ? l[0].card.uid : null; });
    const me = locateCardAnyV4(ctx.card); if(uids.some(u=>u==null) || !me || me.zone!=='mz'){ done(false); return; }
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, 'サモン・リアクター・AI（墓地へ送る）'); });
    API.sendToGrave(me, 'サモン・リアクター・AI（墓地へ送る）'); done(true);
  },
  operation(ctx){
    const pool = u347AiBomber(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('サモン・リアクター・AI：特殊召喚する「ジャイアント・ボマー・エアレイド」', pool, t=>{
      const r = t && resolveTarget(t); if(r && ['hand','deck','grave'].indexOf(r.zone)>=0 && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)){ API.specialSummon(ctx.player, r.zone, r.index, 'atk', 'サモン・リアクター・AI'); if(r.zone==='deck') API.shuffle(ctx.player); }
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, onOtherSummon:true, includesSpecialSummon:true, timing:['free'],
  passive:{ onNormalSummon(ctx){ return u347AiSummon(ctx); }, onSpecialSummon(ctx){ return u347AiSummon(ctx); }, onAttackDeclare(ctx){ return u347AiNegate(ctx); } } });
