/* S03-U421: ヴァンパイアジェネシス, 異次元の一角戦士, ネオス・ワイズマン, サイバー・エルタニン (NOT_STARTED cards with a Special Summon procedure, carddata texts).

   ヴァンパイアジェネシス  このカードは通常召喚できない。自分フィールド上に存在する「ヴァンパイア・ロード」1体をゲームから除外した場合のみ特殊召喚する事ができる。1ターンに1度、手札からアンデット族モンスター1体を墓地に捨てる事で、捨てたアンデット族モンスターよりレベルの低いアンデット族モンスター1体を自分の墓地から選択して特殊召喚する。
   異次元の一角戦士        このカードは通常召喚できず、このカードを特殊召喚するターン自分は通常召喚できない。このカードは相手フィールド上にモンスターが存在し、自分フィールド上にチューナーが表側表示で存在する場合に特殊召喚する事ができる。この方法で特殊召喚に成功した時、ゲームから除外されているチューナー以外のレベル3以下の自分のモンスター1体を選択して特殊召喚する事ができる。この効果で特殊召喚したモンスターの効果は無効化される。
   ネオス・ワイズマン      このカードは通常召喚できない。自分のモンスターゾーンの表側表示の、「E・HERO ネオス」と「ユベル」を1体ずつ墓地へ送った場合のみ特殊召喚できる。①：フィールドのこのカードは効果で破壊されない。②：このカードが相手モンスターと戦闘を行ったダメージステップ終了時に発動する。その相手モンスターの攻撃力分のダメージを相手に与える。その相手モンスターの守備力分だけ自分のLPを回復する。
   サイバー・エルタニン    このカードは通常召喚できない。自分の墓地及び自分フィールドの表側表示モンスターの中から、機械族・光属性モンスターを全て除外した場合のみ特殊召喚できる。①：このカードの攻撃力・守備力は、このカードを特殊召喚するために除外したモンスターの数×500になる。②：このカードが特殊召喚に成功した場合に発動する。このカード以外のフィールドの表側表示モンスターを全て墓地へ送る。

   Notes
   - ヴァンパイアジェネシス: procedure cost banishes a face-up 「ヴァンパイア・ロード」 of my field; the once-per-turn ignition discards an Undead of the hand (the cost; its Level is stored as the card flag u421Lv) and Special Summons a lower-Level Undead of the Graveyard.
   - 一角戦士: cannotNormalSummon, procedure = the opponent has a monster and I control a face-up Tuner (cost: the Normal Summon ban of the turn); an optional onSpecialSummon trigger of its own procedure summon (specialSummonKind 'procedure') offers a banished non-Tuner Level 3 or lower monster of mine, Special Summoned with its effects negated (permanent).
   - ワイズマン: procedure cost sends one face-up 「E・HERO ネオス」 and one 「ユベル」 of my Monster Zone to the Graveyard; protectV21 effect destruction; a forced onDamageStep (dsTiming 'after') trigger deals the battle partner's ATK to the opponent and recovers my LP by its DEF.
   - エルタニン: procedure cost banishes EVERY face-up Machine LIGHT monster of my field and Graveyard (at least one), the count n is procedureDataS03 and afterSummonS03 sets its base ATK / DEF to 500 x n; a forced onSpecialSummon trigger sends all the other face-up monsters of the field to the Graveyard. */

function u421Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free'],
    condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){}}, extra || {});
}
function u421NoNormal(p, label){ banSummonS03(p, gameState.turn, gameState.turn, ['normal'], {}, label); }

/* ---- ヴァンパイアジェネシス ---- */
function u421UndHand(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.db.ra==='アンデット'); }
function u421UndGrave(p, lvMax){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='アンデット' && Number(x.db.lv)<lvMax && canEffectSpecialSummonS03(x.card, 'grave', 'ヴァンパイアジェネシス')); }
function u421VampOk(p){ return u421UndHand(p).filter(h=>u421UndGrave(p, Number(h.db.lv)).length>0); }
defineUnifiedCardV4('ヴァンパイアジェネシス', [{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u421VampOk(ctx.player).length){ ctx.reason = '捨てられるアンデット族モンスターと、それよりレベルの低い墓地のアンデット族モンスターが必要です'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u421VampOk(ctx.player); if(!pool.length){ done(false); return; }
    API.selectCard('ヴァンパイアジェネシス：捨てるアンデット族モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='hand' || r.p!==ctx.player){ done(false); return; }
      const lv = Number(dbOf(r.card).lv), me = locateCardAnyV4(ctx.card);
      API.discard(ctx.player, r.index, 'ヴァンパイアジェネシス（コスト）');
      if(me) API.setCardFlag(me, 'u421Lv', lv, 'ヴァンパイアジェネシス', {silent:true});
      done(true);
    });
  },
  operation(ctx){
    const lv = Number(ctx.card.u421Lv) || 0, pool = u421UndGrave(ctx.player, lv); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('ヴァンパイアジェネシス：特殊召喚するレベルの低いアンデット族モンスター', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ヴァンパイアジェネシス');
    });
  },
  afterResolve(){}
}], u421Passive({countLimit:{n:1, effects:['revive']}, cannotNormalSummon:true, includesSpecialSummon:true,
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='ヴァンパイア・ロード'}).length){ ctx.reason = '自分フィールドに「ヴァンパイア・ロード」がいません'; return false; } return true; },
    cost(ctx, done){
      const l = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='ヴァンパイア・ロード'}); if(!l.length){ done(false); return; }
      API.banish(l[0], 'ヴァンパイアジェネシス（特殊召喚の手順）'); done(true);
    } } }));

/* ---- 異次元の一角戦士 ---- */
function u421Tuner(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('チューナー')>=0}); }
function u421Banished(p){ return API.pileCards(p, 'banish', x=>x.db.k==='m' && (x.db.st||[]).indexOf('チューナー')<0 && Number(x.db.lv)<=3 && canEffectSpecialSummonS03(x.card, 'banish', '異次元の一角戦士')); }
function u421OwnProc(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card) && ctx.card.specialSummonKind==='procedure'; }
defineUnifiedCardV4('異次元の一角戦士', [{
  key:'banished', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], targetRange:LOCATION.REMOVED, targetSide:'self',
  condition(ctx){
    if(!u421OwnProc(ctx)){ ctx.reason = 'この方法で特殊召喚に成功した時に発動します'; return false; }
    return u421Banished(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player);
  },
  operation(ctx){
    const pool = u421Banished(ctx.player); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    API.selectCard('異次元の一角戦士：特殊召喚する除外されているレベル3以下のモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='banish' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
      const uid = ensureCardUid(gameState, r.card);
      if(API.specialSummon(ctx.player, 'banish', r.index, 'atk', '異次元の一角戦士')){ const h = findCardByUid(uid); if(h && h.zone==='mz') API.negateEffectUntil(h, 'permanent', '異次元の一角戦士', ctx.card); }
    });
  },
  afterResolve(){}
}], u421Passive({cannotNormalSummon:true, includesSpecialSummon:true, passive:{ onSpecialSummon(ctx){ return u421OwnProc(ctx) && u421Banished(ctx.player).length>0 && hasMonsterZoneSpace(ctx.player); } },
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
      if(!u421Tuner(ctx.player).length){ ctx.reason = '自分フィールドに表側表示のチューナーがいません'; return false; }
      return true;
    },
    cost(ctx, done){ u421NoNormal(ctx.player, '異次元の一角戦士'); done(true); } } }));

/* ---- ネオス・ワイズマン ---- */
function u421Neos(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='E・HERO ネオス'}); }
function u421Yubel(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='ユベル'}); }
function u421WiseOther(ctx){ if(ctx.zone!=='mz' || ctx.card.face!=='up') return null; const o = a5BattleOtherOf(ctx.card); return o || null; }
defineUnifiedCardV4('ネオス・ワイズマン', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u421WiseOther(ctx); },
  operation(ctx){
    const o = u421WiseOther(ctx); if(!o) return;
    API.damageLP(ctx.opponent, Math.max(0, curATK(o)), 'ネオス・ワイズマン');
    API.recoverLP(ctx.player, Math.max(0, curDEF(o)));
  },
  afterResolve(){}
}], u421Passive({cannotNormalSummon:true, forced:true, dsTiming:'after', passive:{ onDamageStep(ctx){ return !!u421WiseOther(ctx); } },
  protectV21:{key:'u421.wise', effect:true, label:'ネオス・ワイズマン'},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } },
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u421Neos(ctx.player).length || !u421Yubel(ctx.player).length){ ctx.reason = '自分のモンスターゾーンに表側表示の「E・HERO ネオス」と「ユベル」が必要です'; return false; } return true; },
    cost(ctx, done){
      const a = u421Neos(ctx.player), b = u421Yubel(ctx.player); if(!a.length || !b.length){ done(false); return; }
      const ua = a[0].card.uid, ub = b[0].card.uid;
      [ua, ub].forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.sendToGrave(h, 'ネオス・ワイズマン（特殊召喚の手順）'); });
      done(true);
    } } }));

/* ---- サイバー・エルタニン ---- */
function u421Machines(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && x.db.ra==='機械' && x.db.at==='光'})
    .concat(API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='機械' && x.db.at==='光'));
}
defineUnifiedCardV4('サイバー・エルタニン', [{
  key:'sweep', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); },
  operation(ctx){
    API.fieldCards({zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && x.db.k==='m'}).forEach(x=>{ const h = findCardByUid(x.card.uid); if(h && h.zone==='mz') API.sendToGrave(h, 'サイバー・エルタニン'); });
  },
  afterResolve(){}
}], u421Passive({cannotNormalSummon:true, forced:true, includesSpecialSummon:true,
  passive:{ onSpecialSummon(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); } },
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u421Machines(ctx.player).length){ ctx.reason = '機械族・光属性モンスターがいません'; return false; } return true; },
    cost(ctx, done){
      const l = u421Machines(ctx.player); if(!l.length){ done(false); return; }
      const uids = l.map(x=>ensureCardUid(gameState, x.card));
      uids.forEach(u=>{ const h = findCardByUid(u); if(h) API.banish(h, 'サイバー・エルタニン（特殊召喚の手順）'); });
      ctx.procedureDataS03 = {n:uids.length}; done(true);
    },
    afterSummonS03(h, data){ const n = Number(data && data.n) || 0; if(h && h.zone==='mz') API.setBaseStats(h, 500*n, 500*n, 'permanent', 'サイバー・エルタニン'); } } }));
