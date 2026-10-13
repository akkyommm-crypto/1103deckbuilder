/* S03-U343: ten monsters with a banish / send / release summon condition (carddata texts).

   デザート・ツイスター   通常召喚できない。自分の墓地の風属性2体と地属性1体を除外する事でのみ特殊召喚できる。手札を1枚捨てる事でフィールド上の魔法・罠カード1枚を破壊する（1ターンに1度）。
   フェンリル             通常召喚できない。自分の墓地の水属性2体を除外して特殊召喚する。戦闘によって相手モンスターを破壊した場合、次の相手ターンのドローフェイズをスキップする。
   デビルドーザー         通常召喚できない。自分の墓地の昆虫族2体を除外した場合のみ特殊召喚できる。相手ライフに戦闘ダメージを与えた時、相手のデッキの上から1枚を墓地へ送る。
   メガロック・ドラゴン   通常召喚できない。自分の墓地の岩石族を除外する事でのみ特殊召喚できる。元々の攻撃力・守備力は、除外した岩石族の数×700。
   モンタージュ・ドラゴン 通常召喚できない。手札からモンスター3体を墓地へ送った場合のみ特殊召喚できる。攻撃力は、墓地へ送ったモンスターのレベルの合計×300。
   マスターモンク         通常召喚できない。自分フィールドの「モンク・ファイター」1体を生け贄に捧げた場合のみ特殊召喚できる。1ターンに2回攻撃できる。
   原始太陽ヘリオス       攻撃力・守備力は、ゲームから除外されているモンスターの数×100。
   ヘリオス・デュオ・メギストス  自分フィールドの「原始太陽ヘリオス」1体を生け贄に捧げて特殊召喚できる。ATK/DEFは除外されているモンスターカードの数×200。戦闘で破壊され墓地へ送られた場合、エンドフェイズ時にATK/DEFを300アップして特殊召喚される。
   ヘリオス・トリス・メギストス  自分フィールドの「ヘリオス・デュオ・メギストス」1体を生け贄に捧げて特殊召喚できる。ATK/DEFは除外されているモンスターカードの数×300。戦闘で破壊された場合エンドフェイズ時に500アップして特殊召喚。相手フィールドにモンスターが存在する場合、もう1度だけ続けて攻撃できる。

   Notes
   - Shared helpers of S03-U342 (u342Bad, u342PickN). メガロック: the number banished is parked in the turn-temporary player flag u343MegaN and copied to the card by its forced self onSpecialSummon trigger (as マシンナーズ・カノン, S03-U337); the same for モンタージュ' level sum (u343LvSum). 元々の = continuous setBaseAtk / setBaseDef.
   - ヘリオス: continuous setAtk / setDef from the banished Monster Cards of both players; the revival of デュオ / トリス is a forced Graveyard trigger after a battle destruction (a3SelfBattleDestroyed) scheduling an End Phase handler (engine/16) that Special Summons it and adds the bonus as a permanent modifier. */

/* ---- デザート・ツイスター ---- */
function u343Wind(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='風'); }
function u343Earth(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='地'); }
function u343Stones(){ return API.fieldCards({filter:x=>x.zone==='sz' || x.zone==='field'}); }
defineUnifiedCardV4('デザート・ツイスター', [{
  key:'discard-destroy-st', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u343Stones().length){ ctx.reason = 'フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand'); if(!pool.length){ done(false); return; }
    API.selectCard('デザート・ツイスター：捨てる手札', pool, t=>{ const r = t && resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, 'デザート・ツイスター（コスト）'); done(true); });
  },
  operation(ctx){
    const pool = u343Stones(); if(!pool.length) return;
    API.selectCard('デザート・ツイスター：破壊する魔法・罠カード', pool, t=>{ const r = t && resolveTarget(t); if(r && ['sz','field'].indexOf(r.zone)>=0) API.destroy(r, 'デザート・ツイスター'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotNormalSummon:true, countLimit:{n:1, effects:['discard-destroy-st']},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(u343Wind(ctx).length<2 || u343Earth(ctx).length<1){ ctx.reason = '墓地に風属性2体と地属性1体が必要です'; return false; }
      return true;
    },
    cost(ctx, done){
      u342PickN('デザート・ツイスター：除外する墓地の風属性モンスター', ctx, u343Wind, 2, h=>API.banish(h, 'デザート・ツイスター（特殊召喚の手順）'), ok=>{
        if(!ok){ done(false); return; }
        u342PickN('デザート・ツイスター：除外する墓地の地属性モンスター', ctx, u343Earth, 1, h=>API.banish(h, 'デザート・ツイスター（特殊召喚の手順）'), done);
      });
    }
  }});

/* ---- フェンリル ---- */
function u343Water(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.at==='水'); }
defineUnifiedCardV4('フェンリル', [{
  key:'battle-kill-skip-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return gearKilledFoeS03(ctx); },
  operation(ctx){ API.skipOwnPhase(ctx.opponent, 'draw'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, dsTiming:'leave', timing:['free'], passive:{ onDamageStep(ctx){ return gearKilledFoeS03(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(u343Water(ctx).length<2){ ctx.reason = '墓地に水属性モンスターが2体必要です'; return false; }
      return true;
    },
    cost(ctx, done){ u342PickN('フェンリル：除外する墓地の水属性モンスター', ctx, u343Water, 2, h=>API.banish(h, 'フェンリル（特殊召喚の手順）'), done); }
  }});

/* ---- デビルドーザー ---- */
function u343Insects(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='昆虫'); }
function u343Dozer(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && e.attackerUid!=null && e.attackerUid===ctx.card.uid && e.player===ctx.opponent && Number(e.amount)>0 && API.pileCards(ctx.opponent,'deck').length>0; }
defineUnifiedCardV4('デビルドーザー', [{
  key:'hit-mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattleDamage'], forced:true,
  condition(ctx){ return u343Dozer(ctx); },
  operation(ctx){ API.millTop(ctx.opponent, 1, 'デビルドーザー'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, timing:['free'], passive:{ onBattleDamage(ctx){ return u343Dozer(ctx); } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(u343Insects(ctx).length<2){ ctx.reason = '墓地に昆虫族モンスターが2体必要です'; return false; }
      return true;
    },
    cost(ctx, done){ u342PickN('デビルドーザー：除外する墓地の昆虫族モンスター', ctx, u343Insects, 2, h=>API.banish(h, 'デビルドーザー（特殊召喚の手順）'), done); }
  }});

/* ---- メガロック・ドラゴン ---- */
function u343Rocks(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.ra==='岩石'); }
function u343SelfProc(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && ctx.eventName==='onSpecialSummon' && eventIsSelfS03(ctx) && ctx.card.specialSummonKind==='procedure'; }
defineUnifiedCardV4('メガロック・ドラゴン', [{
  key:'count-banished', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u343SelfProc(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const tf = gameState.players[ctx.player].temporaryFlags || {};
    API.setCardFlag(me, 'u343MegaN', Number(tf.u343MegaN)>0 ? Number(tf.u343MegaN) : 0, 'メガロック・ドラゴン', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'], passive:{ onSpecialSummon(ctx){ return u343SelfProc(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = Number(self.u343MegaN)||0; return n ? {setBaseAtk:n*700, setBaseDef:n*700} : null; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(u342Bad()){ ctx.reason = 'ネクロバレーが適用されているため墓地のカードを除外できません'; return false; }
      if(!u343Rocks(ctx).length){ ctx.reason = '墓地に岩石族モンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const picked = [];
      const step = ()=>{
        const pool = u343Rocks(ctx).filter(x=>picked.indexOf(x.card.uid)<0);
        const finish = ()=>{
          if(!picked.length){ done(false); return; }
          picked.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave') API.banish(h, 'メガロック・ドラゴン（特殊召喚の手順）'); });
          API.setFlag(ctx.player, 'u343MegaN', picked.length, true);
          done(true);
        };
        if(!pool.length){ finish(); return; }
        const cands = picked.length ? pool.concat([{key:'done', label:'これ以上除外しない（決定）'}]) : pool;
        API.selectCard('メガロック・ドラゴン：除外する墓地の岩石族モンスター（'+picked.length+'体選択済み）', cands, t=>{
          if(!t || t.key==='done'){ finish(); return; }
          const r = resolveTarget(t); if(!r || r.zone!=='grave'){ finish(); return; }
          picked.push(r.card.uid!=null ? r.card.uid : ensureCardUid(gameState, r.card)); step();
        });
      };
      step();
    }
  }});

/* ---- モンタージュ・ドラゴン ---- */
function u343HandMon(ctx){ return API.pileCards(ctx.player, 'hand', x=>x.card!==ctx.card && x.db.k==='m'); }
defineUnifiedCardV4('モンタージュ・ドラゴン', [{
  key:'count-levels', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u343SelfProc(ctx); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const tf = gameState.players[ctx.player].temporaryFlags || {};
    API.setCardFlag(me, 'u343LvSum', Number(tf.u343LvSum)>0 ? Number(tf.u343LvSum) : 0, 'モンタージュ・ドラゴン', {silent:true});
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'], passive:{ onSpecialSummon(ctx){ return u343SelfProc(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = Number(self.u343LvSum)||0; return {setAtk:n*300}; } },
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u343HandMon(ctx).length<3){ ctx.reason = '手札にモンスターが3体必要です'; return false; } return true; },
    cost(ctx, done){
      let sum = 0;
      u342PickN('モンタージュ・ドラゴン：墓地へ送る手札のモンスター', ctx, u343HandMon, 3, h=>{ sum += Number(dbOf(h.card).lv)||0; API.discard(ctx.player, h.index, 'モンタージュ・ドラゴン（特殊召喚の手順）', {byEffect:false}); }, ok=>{
        if(!ok){ done(false); return; }
        API.setFlag(ctx.player, 'u343LvSum', sum, true); done(true);
      });
    }
  }});

/* ---- マスターモンク ---- */
function u343Monk(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='モンク・ファイター'}); }
defineScript('マスターモンク', {
  type:'monster', priority:1, attackLimit:2,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u343Monk(ctx).length){ ctx.reason = '自分フィールドに「モンク・ファイター」がいません'; return false; } return true; },
    cost(ctx, done){
      const l = u343Monk(ctx); if(!l.length){ done(false); return; }
      API.sendToGrave(l[0], 'マスターモンク（リリース）'); done(true);
    }
  }
});

/* ---- 原始太陽ヘリオス / ヘリオス・デュオ・メギストス / ヘリオス・トリス・メギストス ---- */
function u343Banished(){ let n = 0; [0,1].forEach(p=>(gameState.players[p].banish||[]).forEach(c=>{ if(c && dbOf(c).k==='m') n++; })); return n; }
defineScript('原始太陽ヘリオス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = u343Banished()*100; return {setAtk:n, setDef:n}; } }
});
API.registerScheduleHandler('u343.helios-revive', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='grave' || h.p!==args.player || !hasMonsterZoneSpace(args.player)) return;
  const uid = h.card.uid;
  API.specialSummon(args.player, 'grave', h.index, 'atk', args.name);
  const now = findCardByUid(uid); if(now && now.zone==='mz') API.modAtk(now, args.bonus, args.bonus, 'permanent', args.name);
});
function u343Helios(name, material, per, bonus, extra){
  defineUnifiedCardV4(name, [{
    key:'battle-destroyed-revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onDamageStep'], forced:true,
    condition(ctx){ return a3SelfBattleDestroyed(ctx) && hasMonsterZoneSpace(ctx.player); },
    operation(ctx){ API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u343.helios-revive', args:{uid:ctx.card.uid, player:ctx.player, bonus, name}, note:name}); },
    afterResolve(){}
  }], Object.assign({type:'monster', priority:1, forced:true, timing:['free'], activateFrom:['grave'], includesSpecialSummon:true,
    passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && hasMonsterZoneSpace(ctx.player); } },
    continuous:Object.assign({ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = u343Banished()*per; return {setAtk:n, setDef:n}; } }, extra||{}),
    summonProcedure:{
      from:['hand'], positions:['atk','def'],
      condition(ctx){ if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===material}).length){ ctx.reason = '自分フィールドに「'+material+'」がいません'; return false; } return true; },
      cost(ctx, done){
        const l = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n===material}); if(!l.length){ done(false); return; }
        API.sendToGrave(l[0], name+'（リリース）'); done(true);
      }
    } }));
}
u343Helios('ヘリオス・デュオ・メギストス', '原始太陽ヘリオス', 200, 300);
u343Helios('ヘリオス・トリス・メギストス', 'ヘリオス・デュオ・メギストス', 300, 500, {
  grantsAttackLimit(card, self){ return (card===self && self.face==='up' && API.fieldCards({player:(locateCardAnyV4(self)||{}).p===0?1:0, zone:'mz'}).length>0) ? 2 : null; }
});
