/* S03-U344: eleven monsters with a Graveyard / hand / field summon condition (carddata texts; the Special Summon restrictions are read by the engine).

   霊魂の護送船       自分の墓地の光属性1体を除外した場合に特殊召喚できる。
   神聖なる魂         自分の墓地の光属性2体を除外した場合に特殊召喚できる。表側表示で存在する限り、相手のバトルフェイズ中のみ全ての相手モンスターの攻撃力は300ダウン。
   風の精霊 ガルーダ   自分の墓地の風属性1体を除外した場合に特殊召喚できる。相手のエンドフェイズ時、相手フィールドの表側表示モンスター1体を選択し、表示形式を変更できる。
   水の精霊 アクエリア 自分の墓地の水属性1体を除外した場合に特殊召喚できる。相手のスタンバイフェイズ毎に、相手フィールドの表側表示モンスター1体を選択し表示形式を変更できる。そのモンスターはこのターン表示形式を変更できない。
   氷炎の双竜         自分の墓地の水属性2体と炎属性1体を除外した場合のみ特殊召喚できる。1ターンに1度、手札を1枚捨てて発動できる。フィールドのモンスター1体を選択して破壊する。
   電池メン－業務用   自分の墓地の「電池メン」2体を除外した場合のみ特殊召喚できる。1ターンに1度、自分の墓地の雷族1体を除外して発動できる。フィールドのモンスター1体と魔法・罠カード1枚を選択して破壊する。
   真紅眼の闇竜       自分フィールドの「真紅眼の黒竜」1体をリリースした場合のみ特殊召喚できる。攻撃力は自分の墓地のドラゴン族1体につき300アップ。
   邪龍アナンタ       自分のフィールド及び墓地の爬虫類族を全て除外する事でのみ特殊召喚できる。攻撃力・守備力は除外した爬虫類族の数×600。自分フィールドに存在する限り、自分のエンドフェイズ時にフィールドのカード1枚を破壊する。
   降雷皇ハモン       自分フィールドの表側表示の永続魔法3枚を墓地へ送った場合のみ特殊召喚できる。守備表示で存在する限り相手は他のモンスターを攻撃対象に選択できない。戦闘で相手モンスターを破壊し墓地へ送った場合に1000ダメージ。
   磁石の戦士マグネット・バルキリオン  自分の手札・フィールドの「磁石の戦士α」「β」「γ」を1体ずつリリースした場合に特殊召喚できる。このカードをリリースし、墓地のα・β・γを1体ずつ対象として発動できる。そのモンスターを特殊召喚する。
   虚栄の大猿         手札から獣族1体を墓地へ送った場合に特殊召喚できる。成功した時、墓地へ送った獣族のレベルの数だけこのカードのレベルを上げるか下げる。

   Notes
   - Every Special Summon is a hand summonProcedure built by u344Proc from groups of cards to banish / release (helpers u342Bad, u342PickN of S03-U342); refused under ネクロバレー for the banish groups.
   - アナンタ / 大猿: the count / level is parked in a turn-temporary player flag and copied to the card by a forced self onSpecialSummon trigger (as S03-U337/U343). ウリア (a Set-card destruction that nothing can be chained to) is not part of this unit. */

function u344Proc(label, groups, banishes){
  return {
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(banishes && u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      for(const g of groups){ if(g.pool(ctx).length<g.n){ ctx.reason = g.label+'が足りません'; return false; } }
      return true;
    },
    cost(ctx, done){
      const run = i=>{
        if(i>=groups.length){ done(true); return; }
        const g = groups[i];
        u342PickN(label+'：'+g.label, ctx, g.pool, g.n, h=>{ if(g.apply) g.apply(h); else API.banish(h, label+'（特殊召喚の手順）'); }, ok=>{ if(!ok){ done(false); return; } run(i+1); });
      };
      run(0);
    }
  };
}
function u344Grave(attr){ return ctx=>API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at===attr); }
function u344Foe(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}); }
function u344TogglePos(label){
  return ctx=>{
    const pool = u344Foe(ctx); if(!pool.length) return;
    API.selectCard(label+'：表示形式を変更する相手モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.opponent || r.card.face!=='up') return;
      API.changePosition(r, r.card.pos==='atk' ? 'def' : 'atk', label);
      return r;
    });
  };
}

/* ---- 霊魂の護送船 / 神聖なる魂 ---- */
defineScript('霊魂の護送船', { type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  summonProcedure:u344Proc('霊魂の護送船', [{label:'墓地の光属性モンスター', n:1, pool:u344Grave('光')}], true) });
defineScript('神聖なる魂', { type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  summonProcedure:u344Proc('神聖なる魂', [{label:'墓地の光属性モンスター', n:2, pool:u344Grave('光')}], true),
  continuous:{ scope:'oppMonsters', from:['mz'], apply(card, self, info){
    if(!self || self.face!=='up' || gameState.phase!=='battle' || gameState.activePlayer===info.p) return null;
    return {atk:-300};
  } } });

/* ---- 風の精霊 ガルーダ / 水の精霊 アクエリア ---- */
const u344GarudaPick = u344TogglePos('風の精霊 ガルーダ');
function u344GarudaReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.activePlayer===ctx.opponent && u344Foe(ctx).length>0; }
defineUnifiedCardV4('風の精霊 ガルーダ', [{
  key:'end-toggle', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'],
  condition(ctx){ return u344GarudaReady(ctx); },
  operation(ctx){ u344GarudaPick(ctx); },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, timing:['free'], passive:{ onEndPhase(ctx){ return u344GarudaReady(ctx); } },
  summonProcedure:u344Proc('風の精霊 ガルーダ', [{label:'墓地の風属性モンスター', n:1, pool:u344Grave('風')}], true) });
function u344AquariaReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.activePlayer===ctx.opponent && gameState.phase==='standby' && u344Foe(ctx).length>0; }
defineUnifiedCardV4('水の精霊 アクエリア', [{
  key:'standby-toggle', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'],
  condition(ctx){ return u344AquariaReady(ctx); },
  operation(ctx){
    const pool = u344Foe(ctx); if(!pool.length) return;
    API.selectCard('水の精霊 アクエリア：表示形式を変更する相手モンスター', pool, t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz' || r.p!==ctx.opponent || r.card.face!=='up') return;
      API.changePosition(r, r.card.pos==='atk' ? 'def' : 'atk', '水の精霊 アクエリア');
      const h = locateCardAnyV4(r.card); if(h && h.zone==='mz') API.setCardFlag(h, 'u344AquariaTurn', gameState.turn, '水の精霊 アクエリア', {silent:true});
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, timing:['free'], passive:{ onStandbyPhase(ctx){ return u344AquariaReady(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; }, cannotChangePosition(target){ return !!target && Number(target.u344AquariaTurn)===Number(gameState.turn); } },
  summonProcedure:u344Proc('水の精霊 アクエリア', [{label:'墓地の水属性モンスター', n:1, pool:u344Grave('水')}], true) });

/* ---- 氷炎の双竜 ---- */
function u344Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u344AnyMon(){ return API.fieldCards({zone:'mz'}); }
defineUnifiedCardV4('氷炎の双竜', [{
  key:'discard-destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u344Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u344AnyMon().length){ ctx.reason = 'フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length){ done(false); return; }
    API.selectCard('氷炎の双竜：捨てる手札', pool, t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, '氷炎の双竜（コスト）'); done(true); });
  },
  operation(ctx){
    const pool = u344AnyMon(); if(!pool.length) return;
    API.selectCard('氷炎の双竜：破壊するモンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz') API.destroy(r, '氷炎の双竜'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, countLimit:{n:1, effects:['discard-destroy']},
  summonProcedure:u344Proc('氷炎の双竜', [{label:'墓地の水属性モンスター', n:2, pool:u344Grave('水')}, {label:'墓地の炎属性モンスター', n:1, pool:u344Grave('炎')}], true) });

/* ---- 電池メン－業務用 ---- */
function u344Batt(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('電池メン')===0); }
function u344Thunder(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='雷'); }
function u344Stones(){ return API.fieldCards({filter:x=>x.zone==='sz' || x.zone==='field'}); }
defineUnifiedCardV4('電池メン－業務用', [{
  key:'banish-destroy-two', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u344Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
    if(!u344Thunder(ctx).length){ ctx.reason = '墓地に雷族モンスターがいません'; return false; }
    if(!u344AnyMon().length || !u344Stones().length){ ctx.reason = 'フィールドにモンスターと魔法・罠カードが必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('電池メン－業務用：除外する墓地の雷族モンスター', u344Thunder(ctx), t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, '電池メン－業務用（コスト）'); done(true); });
  },
  operation(ctx){
    const mons = u344AnyMon(), sts = u344Stones(); if(!mons.length || !sts.length) return;
    API.selectCard('電池メン－業務用：破壊するモンスター', mons, t=>{
      const r = t && resolveTarget(t);
      API.selectCard('電池メン－業務用：破壊する魔法・罠カード', u344Stones(), t2=>{
        const s = t2 && resolveTarget(t2);
        if(r && r.zone==='mz') API.destroy(r, '電池メン－業務用');
        const s2 = s && locateCardAnyV4(s.card); if(s2 && ['sz','field'].indexOf(s2.zone)>=0) API.destroy(s2, '電池メン－業務用');
      });
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, countLimit:{n:1, effects:['banish-destroy-two']},
  summonProcedure:u344Proc('電池メン－業務用', [{label:'墓地の「電池メン」', n:2, pool:u344Batt}], true) });

/* ---- 真紅眼の闇竜 ---- */
defineScript('真紅眼の闇竜', { type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(card, self, info){
    if(card!==self || self.face!=='up') return null;
    const n = (gameState.players[info.p].grave||[]).filter(c=>c && dbOf(c).k==='m' && dbOf(c).ra==='ドラゴン').length;
    return n ? {atk:n*300} : null;
  } },
  summonProcedure:u344Proc('真紅眼の闇竜', [{label:'自分フィールドの「真紅眼の黒竜」', n:1, pool:ctx=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='真紅眼の黒竜'}),
    apply:h=>API.sendToGrave(h, '真紅眼の闇竜（リリース）')}], false) });

/* ---- 邪龍アナンタ ---- */
function u344Reptiles(ctx){
  const fl = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.db.k==='m' && x.db.ra==='爬虫類'});
  const gr = API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='爬虫類');
  return fl.concat(gr);
}
function u344AnantaReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure'; }
function u344AnantaEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && API.fieldCards({}).length>0; }
defineUnifiedCardV4('邪龍アナンタ', [{
  key:'count-reptiles', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u344AnantaReady(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const tf = gameState.players[ctx.player].temporaryFlags || {};
    API.setCardFlag(me, 'u344AnantaN', Number(tf.u344AnantaN)>0 ? Number(tf.u344AnantaN) : 0, '邪龍アナンタ', {silent:true});
  },
  afterResolve(){}
}, {
  key:'end-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u344AnantaEnd(ctx); },
  operation(ctx){
    const pool = API.fieldCards({}); if(!pool.length) return;
    API.selectCard('邪龍アナンタ：破壊するフィールドのカード', pool, t=>{ const r = t && resolveTarget(t); if(r && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, '邪龍アナンタ'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'],
  passive:{ onSpecialSummon(ctx){ return u344AnantaReady(ctx); }, onEndPhase(ctx){ return u344AnantaEnd(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = (Number(self.u344AnantaN)||0)*600; return {setAtk:n, setDef:n}; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(!u344Reptiles(ctx).length){ ctx.reason = '自分のフィールドか墓地に爬虫類族モンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const all = u344Reptiles(ctx).map(h=>h.card.uid!=null ? h.card.uid : ensureCardUid(gameState, h.card));
      if(!all.length){ done(false); return; }
      all.forEach(u=>{ const h = findCardByUid(u); if(h) API.banish(h, '邪龍アナンタ（特殊召喚の手順）'); });
      API.setFlag(ctx.player, 'u344AnantaN', all.length, true);
      done(true);
    }
  } });

/* ---- 降雷皇ハモン ---- */
function u344Conts(ctx){ return API.fieldCards({player:ctx.player, zone:'sz', filter:x=>x.card.face==='up' && x.db.k==='s' && x.db.sub==='永続'}); }
defineUnifiedCardV4('降雷皇ハモン', [{
  key:'kill-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return gearKilledFoeS03(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 1000, '降雷皇ハモン'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, dsTiming:'leave', timing:['free'], passive:{ onDamageStep(ctx){ return gearKilledFoeS03(ctx); } },
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; }, cannotBeAttackTarget(target, self){ return !!self && self.face==='up' && self.pos==='def' && target!==self; } },
  summonProcedure:u344Proc('降雷皇ハモン', [{label:'自分フィールドの表側表示の永続魔法カード', n:3, pool:u344Conts, apply:h=>API.sendToGrave(h, '降雷皇ハモン（特殊召喚の手順）')}], false) });

/* ---- 磁石の戦士マグネット・バルキリオン ---- */
const U344_MAG = ['磁石の戦士α','磁石の戦士β','磁石の戦士γ'];
function u344MagHF(ctx, name){ return API.pileCards(ctx.player, 'hand', x=>x.db.n===name).concat(API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===name})); }
function u344MagGrave(ctx, name){ return API.pileCards(ctx.player, 'grave', x=>x.db.n===name); }
defineUnifiedCardV4('磁石の戦士マグネット・バルキリオン', [{
  key:'release-revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u344Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    const miss = U344_MAG.filter(n=>!u344MagGrave(ctx, n).length);
    if(miss.length){ ctx.reason = '墓地に「'+miss[0]+'」がいません'; return false; }
    if(gameState.players[ctx.player].mz.length-1+3>ZONE_LIMITS.mz){ ctx.reason = 'モンスターゾーンが足りません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.sendToGrave(me, '磁石の戦士マグネット・バルキリオン（リリース）'); done(true); },
  operation(ctx){
    U344_MAG.forEach(n=>{
      const h = u344MagGrave(ctx, n)[0];
      if(h && hasMonsterZoneSpace(ctx.player)){ const r = locateCardAnyV4(h.card); if(r && r.zone==='grave') API.specialSummon(ctx.player, 'grave', r.index, 'atk', '磁石の戦士マグネット・バルキリオン'); }
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, includesSpecialSummon:true,
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ const miss = U344_MAG.filter(n=>!u344MagHF(ctx, n).length); if(miss.length){ ctx.reason = '「'+miss[0]+'」が手札・フィールドにいません'; return false; } return true; },
    cost(ctx, done){
      const picks = U344_MAG.map(n=>{ const l = u344MagHF(ctx, n); return l.length ? l[0].card.uid : null; });
      if(picks.some(u=>u==null)){ done(false); return; }
      picks.forEach(u=>{ const h = findCardByUid(u); if(!h) return; if(h.zone==='hand') API.discard(ctx.player, h.index, '磁石の戦士マグネット・バルキリオン（リリース）', {byEffect:false}); else if(h.zone==='mz') API.sendToGrave(h, '磁石の戦士マグネット・バルキリオン（リリース）'); });
      done(true);
    }
  } });

/* ---- 虚栄の大猿 ---- */
function u344Beast(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card && x.db.k==='m' && x.db.ra==='獣'); }
function u344ApeReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure'; }
defineUnifiedCardV4('虚栄の大猿', [{
  key:'level-choice', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'],
  condition(ctx){ const tf = gameState.players[ctx.player].temporaryFlags || {}; return u344ApeReady(ctx) && Number(tf.u344ApeLv)>0; },
  operation(ctx){
    const lv = Number((gameState.players[ctx.player].temporaryFlags||{}).u344ApeLv)||0; if(lv<=0) return;
    API.selectCard('虚栄の大猿：レベルを'+lv+'変更する', [{key:'up', label:'レベルを'+lv+'上げる'}, {key:'down', label:'レベルを'+lv+'下げる'}], t=>{
      const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
      if(t && t.key==='up') API.modLevel(me, lv, 'permanent', '虚栄の大猿');
      else if(t && t.key==='down') API.modLevel(me, -lv, 'permanent', '虚栄の大猿');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'], passive:{ onSpecialSummon(ctx){ const tf = gameState.players[ctx.player].temporaryFlags || {}; return u344ApeReady(ctx) && Number(tf.u344ApeLv)>0; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u344Beast(ctx).length){ ctx.reason = '手札に獣族モンスターがいません'; return false; } return true; },
    cost(ctx, done){
      API.selectCard('虚栄の大猿：墓地へ送る手札の獣族モンスター', u344Beast(ctx), t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; }
        const lv = Number(dbOf(r.card).lv)||0;
        API.discard(ctx.player, r.index, '虚栄の大猿（特殊召喚の手順）', {byEffect:false});
        API.setFlag(ctx.player, 'u344ApeLv', lv, true); done(true);
      });
    }
  } });
