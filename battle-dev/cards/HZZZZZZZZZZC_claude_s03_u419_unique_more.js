/* S03-U419: エーリアン・リベンジャー, アマゾネスペット虎, レプティレス・ヴァースキ, 氷結界の伝道師 (NOT_STARTED cards, carddata texts; the face-up uniqueness of S03-U418).

   エーリアン・リベンジャー  このカードはフィールド上のAカウンターを2つ取り除き、手札から特殊召喚できる。1ターンに1度、相手フィールド上に表側表示で存在する全てのモンスターにAカウンターを1つ置く事ができる。このカードがフィールド上に表側表示で存在する限り、Aカウンターが乗ったモンスターは、「エーリアン」と名のついたモンスターと戦闘を行う場合、ダメージ計算時のみAカウンター1つにつき攻撃力・守備力が300ポイントダウンする。「エーリアン・リベンジャー」は自分フィールド上に1体しか表側表示で存在できない。
   アマゾネスペット虎        このカードは自分フィールド上に1枚しか表側表示で存在できない。自分フィールド上の「アマゾネス」という名のついたモンスターカード1枚につき、このカードの攻撃力は400ポイントアップする。相手はこのカードを破壊しない限り、他の「アマゾネス」という名のついたモンスターを攻撃できない。
   レプティレス・ヴァースキ  このカードは通常召喚できない。自分・相手フィールドの攻撃力0のモンスター2体をリリースした場合のみ特殊召喚できる。①：「レプティレス・ヴァースキ」はフィールドに1体しか表側表示で存在できない。②：1ターンに1度、相手フィールドの表側表示モンスター1体を対象として発動できる。その相手の表側表示モンスターを破壊する。
   氷結界の伝道師            自分フィールド上に「氷結界」と名のついたモンスターが表側表示で存在する場合、このカードは手札から特殊召喚する事ができる。この効果で特殊召喚するターン、自分はレベル5以上のモンスターを特殊召喚する事ができない。また、このカードをリリースする事で、「氷結界の伝道師」以外の自分の墓地に存在する「氷結界」と名のついたモンスター1体を選択して特殊召喚する。

   Notes
   - NEW (engine/1ZZS, S03-U419): the match of banSummonS03 knows {lvmin:N} (the ban applies to Level N or higher only).
   - リベンジャー: summonProcedure whose cost removes 2 A Counters one by one from any monsters of the field (API.removeCounter); ignition puts an A Counter on every face-up opponent monster (API.addCounter); continuous alienContinuousS03(true) (S03-U316); uniqueNameS03 'own' (text: 自分フィールド上).
   - ペット虎: uniqueNameS03 'own'; continuous ATK +400 x my face-up monsters whose name contains アマゾネス (itself included); continuous.cannotBeAttackTarget (scope allMonsters) stops the attack on my OTHER アマゾネス monsters while it is face-up.
   - ヴァースキ: cannotNormalSummon + summonProcedure releasing two face-up monsters of either field with 0 ATK (u342PickN); uniqueNameS03 'any'; a once-per-turn ignition destroys a chosen face-up opponent monster.
   - 伝道師: summonProcedure condition = a face-up 「氷結界」 monster of mine; the cost stamps banSummonS03(…, ['special'], {lvmin:5}) for the turn; the ignition releases itself (cost) and Special Summons a 「氷結界」 monster of the Graveyard. */

function u419Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free'],
    condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){}}, extra || {});
}
function u419Main(ctx){ return u418Face(ctx) && ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }

/* ---- エーリアン・リベンジャー ---- */
function u419Counters(){ return API.fieldCards({zone:'mz', filter:x=>alienCountersS03(x.card)>0}); }
function u419CounterTotal(){ return u419Counters().reduce((s, x)=>s + alienCountersS03(x.card), 0); }
function u419Foes(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
defineUnifiedCardV4('エーリアン・リベンジャー', [{
  key:'mark', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u419Foes(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  operation(ctx){ u419Foes(ctx).forEach(h=>API.addCounter(h, 'A', 1)); },
  afterResolve(){}
}], u419Passive({countLimit:{n:1, effects:['mark']}, uniqueNameS03:'own', continuous:alienContinuousS03(true),
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u419CounterTotal()<2){ ctx.reason = 'フィールドのAカウンターが2つありません'; return false; } return true; },
    cost(ctx, done){
      let left = 2;
      const step = ()=>{
        if(left<=0){ done(true); return; }
        const pool = u419Counters(); if(!pool.length){ done(false); return; }
        API.selectCard(`エーリアン・リベンジャー：Aカウンターを取り除くモンスター（残り${left}）`, pool, t=>{
          const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || alienCountersS03(r.card)<1){ done(false); return; }
          API.removeCounter(r, 'A', 1); left--; step();
        });
      };
      step();
    } } }));

/* ---- アマゾネスペット虎 ---- */
function u419Ama(x){ return x.card.face==='up' && x.db.k==='m' && String(x.db.n||'').indexOf('アマゾネス')>=0; }
defineScript('アマゾネスペット虎', u419Passive({uniqueNameS03:'own',
  continuous:{ scope:'allMonsters', from:['mz'],
    apply(card, self){
      if(card!==self || self.face!=='up') return null;
      const h = locateCardAnyV4(self); if(!h) return null;
      const n = API.fieldCards({player:h.p, zone:'mz', filter:u419Ama}).length;
      return n ? {atk:400*n} : null;
    },
    cannotBeAttackTarget(target, self){
      if(!self || self.face!=='up' || target===self || dbOf(target).k!=='m' || String(dbOf(target).n||'').indexOf('アマゾネス')<0) return false;
      const a = locateCardAnyV4(self), b = locateCardAnyV4(target);
      return !!a && !!b && a.zone==='mz' && b.zone==='mz' && a.p===b.p;
    } } }));

/* ---- レプティレス・ヴァースキ ---- */
function u419Zero(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && curATK(x.card)===0}); }
defineUnifiedCardV4('レプティレス・ヴァースキ', [{
  key:'destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u419Foes(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('レプティレス・ヴァースキ：破壊する相手の表側表示モンスター', u419Foes(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(t && t.zone==='mz' && t.p===ctx.opponent && t.card.face==='up') API.destroy(t, 'レプティレス・ヴァースキ');
  },
  afterResolve(){}
}], u419Passive({countLimit:{n:1, effects:['destroy']}, cannotNormalSummon:true, uniqueNameS03:'any', targets:true,
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u419Zero().length<2){ ctx.reason = '攻撃力0の表側表示モンスターが2体いません'; return false; } return true; },
    cost(ctx, done){ u342PickN('レプティレス・ヴァースキ：リリースする攻撃力0のモンスター', ctx, u419Zero, 2, h=>API.sendToGrave(h, 'レプティレス・ヴァースキ（リリース）'), done); } } }));

/* ---- 氷結界の伝道師 ---- */
function u419Ice(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && String(x.db.n||'').indexOf('氷結界')>=0}); }
function u419IceGrave(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('氷結界')>=0 && x.db.n!=='氷結界の伝道師' && canEffectSpecialSummonS03(x.card, 'grave', '氷結界の伝道師')); }
defineUnifiedCardV4('氷結界の伝道師', [{
  key:'release-revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u419IceGrave(ctx.player).length){ ctx.reason = '墓地に「氷結界」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, '氷結界の伝道師（リリース）'); done(true); },
  target(ctx, done){ API.selectCard('氷結界の伝道師：特殊召喚する「氷結界」モンスター', u419IceGrave(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]);
    if(t && t.zone==='grave' && t.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', t.index, 'atk', '氷結界の伝道師');
  },
  afterResolve(){}
}], u419Passive({targets:true, includesSpecialSummon:true,
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u419Ice(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「氷結界」モンスターがいません'; return false; } return true; },
    cost(ctx, done){ banSummonS03(ctx.player, gameState.turn, gameState.turn, ['special'], {lvmin:5}, '氷結界の伝道師'); done(true); } } }));
