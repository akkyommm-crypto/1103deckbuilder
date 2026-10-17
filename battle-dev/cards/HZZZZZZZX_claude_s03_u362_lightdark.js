/* S03-U362: five monsters (carddata texts).

   ライトロード・ドルイド オルクス  表側表示で存在する限り、お互いに「ライトロード」モンスターを魔法・罠・効果モンスターの効果の対象にできない。自分のエンドフェイズ毎に発動する。自分のデッキの上からカードを2枚墓地へ送る。
   ライトエンド・ドラゴン          （S）このカードが相手モンスターと戦闘を行う攻撃宣言時に発動できる。このカードの攻撃力・守備力を500ダウンし、戦闘を行う相手モンスターの攻撃力・守備力はエンドフェイズ時まで1500ダウンする。
   ライトニング・トライコーン      （S）このカードが相手によって破壊された場合、自分の墓地の「サンダー・ユニコーン」または「ボルテック・バイコーン」1体を選択して特殊召喚できる。
   ダーク・クリエイター            通常召喚できない。自分の墓地に闇属性モンスターが5体以上存在し、自分フィールドにモンスターが存在しない場合に特殊召喚できる。1ターンに1度、自分の墓地の闇属性モンスター1体を除外する事で、自分の墓地の闇属性モンスター1体を選択して特殊召喚する。
   ダーク・カタパルター            自分のスタンバイフェイズにこのカードが守備表示だった場合、このカードにカウンターを1つ置く。カウンターと同じ数のカードを自分の墓地から除外する事で、その枚数と同じ枚数のフィールドの魔法・罠カードを破壊する。その後カウンターを全て取り除く。

   Notes
   - オルクス: continuous immuneToTarget (both players' Lightlords) + a forced onEndPhase trigger of its controller (API.millTop 2).
   - ライトエンド・ドラゴン: optional trigger on onAttackDeclare while it is the attacker or the target (not a direct attack); the −500 / −1500 are stat modifiers until the End Phase.
   - トライコーン: Graveyard trigger when destroyed (battle or effect) with the opponent as the destroyer (graveInfo.byPlayer).
   - クリエイター: hand procedure (summonProcedure condition) + once-per-turn ignition (banish cost, GY target).
   - カタパルター: card counter 'カウンター' (API.addCounter) on my Standby Phase in Defense Position; the ignition removes N Graveyard cards (cost) and destroys N Spell / Trap cards. */

/* ---- ライトロード・ドルイド オルクス ---- */
function u362Lord(card){ return !!card && String(dbOf(card).n||'').indexOf('ライトロード')>=0; }
function u362OrcusEnd(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.player===gameState.activePlayer && API.me(ctx).deck.length>0; }
defineUnifiedCardV4('ライトロード・ドルイド オルクス', [{
  key:'mill', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u362OrcusEnd(ctx); },
  operation(ctx){ API.millTop(ctx.player, 2, 'ライトロード・ドルイド オルクス'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'],
  passive:{ onEndPhase(ctx){ return u362OrcusEnd(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; }, immuneToTarget(target, self){ return !!self && self.face==='up' && u362Lord(target); } } });

/* ---- ライトエンド・ドラゴン ---- */
function u362LightEndOther(ctx){
  const a = gameState.pendingAttack; if(!a || ctx.zone!=='mz' || ctx.card.face!=='up' || a.targetUid==null || a.attackerUid==null) return null;
  const me = ctx.card.uid;
  const other = a.attackerUid===me ? a.targetUid : (a.targetUid===me ? a.attackerUid : null);
  const h = other!=null ? findCardByUid(other) : null;
  return (h && h.zone==='mz' && h.p===ctx.opponent && h.card.face==='up') ? h : null;
}
defineUnifiedCardV4('ライトエンド・ドラゴン', [{
  key:'weaken', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'],
  condition(ctx){ return !!u362LightEndOther(ctx); },
  operation(ctx){
    const o = u362LightEndOther(ctx), me = locateCardAnyV4(ctx.card); if(!o || !me) return;
    v4RegisterStatModifier(me, {atk:-500, def:-500}, {code:'ライトエンド・ドラゴン', resetMask:RESET.LEAVE|RESET.FACE_DOWN});
    v4RegisterStatModifier(o, {atk:-1500, def:-1500}, {code:'ライトエンド・ドラゴン', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], passive:{ onAttackDeclare(ctx){ return !!u362LightEndOther(ctx); } } });

/* ---- ライトニング・トライコーン ---- */
function u362TriSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && g.byPlayer===ctx.opponent && Number(g.turn)===Number(gameState.turn);
}
function u362TriPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.n==='サンダー・ユニコーン' || x.db.n==='ボルテック・バイコーン'); }
defineUnifiedCardV4('ライトニング・トライコーン', [{
  key:'revive', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave','onDestroy'],
  condition(ctx){ return u362TriSent(ctx) && hasMonsterZoneSpace(ctx.player) && u362TriPool(ctx).length>0; },
  operation(ctx){
    const pool = u362TriPool(ctx); if(!pool.length) return;
    API.selectCard('ライトニング・トライコーン：特殊召喚するモンスター', pool, t=>{
      const r = t && resolveTarget(t); if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ライトニング・トライコーン');
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], includesSpecialSummon:true,
  passive:{ onSendToGrave(ctx){ return u362TriSent(ctx) && hasMonsterZoneSpace(ctx.player) && u362TriPool(ctx).length>0; }, onDestroy(ctx){ return u362TriSent(ctx) && hasMonsterZoneSpace(ctx.player) && u362TriPool(ctx).length>0; } } });

/* ---- ダーク・クリエイター ---- */
function u362Dark(x){ return x.db.k==='m' && x.db.at==='闇'; }
defineUnifiedCardV4('ダーク・クリエイター', [{
  key:'recycle', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(API.pileCards(ctx.player, 'grave', u362Dark).length<2){ ctx.reason = '墓地に闇属性モンスターが2体必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ダーク・クリエイター：除外する闇属性モンスター', API.pileCards(ctx.player, 'grave', u362Dark), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
      API.banish(r, 'ダーク・クリエイター（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('ダーク・クリエイター：特殊召喚する闇属性モンスター', API.pileCards(ctx.player, 'grave', u362Dark), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'ダーク・クリエイター');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, countLimit:1, timing:['mainPhase'], cannotNormalSummon:true, includesSpecialSummon:true,
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(API.me(ctx).mz.length>0){ ctx.reason = '自分フィールドにモンスターが存在しない場合に特殊召喚できます'; return false; }
      if(API.pileCards(ctx.player, 'grave', u362Dark).length<5){ ctx.reason = '墓地に闇属性モンスターが5体以上必要です'; return false; }
      return true;
    }
  } });

/* ---- ダーク・カタパルター ---- */
function u362CatMine(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.card.pos==='def' && ctx.player===gameState.activePlayer && gameState.phase==='standby'; }
function u362CatN(card){ return API.countCounter({p:locateCardAnyV4(card).p, zone:'mz', index:locateCardAnyV4(card).index}, 'カウンター'); }
defineUnifiedCardV4('ダーク・カタパルター', [{
  key:'count', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onStandbyPhase'], forced:true,
  condition(ctx){ return u362CatMine(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.addCounter(me, 'カウンター', 1); },
  afterResolve(){}
}, {
  key:'blast', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.ONFIELD, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    const n = u362CatN(ctx.card);
    if(n<1){ ctx.reason = 'カウンターが乗っていません'; return false; }
    if(API.pileCards(ctx.player, 'grave', ()=>true).length<n){ ctx.reason = '墓地のカードが足りません'; return false; }
    if(API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'}).length<1){ ctx.reason = 'フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    const n = u362CatN(ctx.card); let k = 0;
    const step = ()=>{
      if(k>=n){ const me = locateCardAnyV4(ctx.card); if(me) API.setCardFlag(me, 'u362N', n, 'ダーク・カタパルター', {silent:true}); done(true); return; }
      API.selectCard('ダーク・カタパルター：除外する墓地のカード（'+(k+1)+'/'+n+'）', API.pileCards(ctx.player, 'grave', ()=>true), t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; }
        API.banish(r, 'ダーク・カタパルター（コスト）'); k++; step();
      });
    };
    step();
  },
  operation(ctx){
    const n = Number(ctx.card.u362N)||0; let k = 0;
    const step = ()=>{
      const pool = API.fieldCards({filter:x=>x.zone==='sz'||x.zone==='field'});
      if(k>=n || !pool.length){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz'){ const c = API.countCounter(me, 'カウンター'); if(c>0) API.removeCounter(me, 'カウンター', c); } return; }
      API.selectCard('ダーク・カタパルター：破壊する魔法・罠カード（'+(k+1)+'/'+n+'）', pool, t=>{
        const r = t && resolveTarget(t); if(r && (r.zone==='sz'||r.zone==='field')) API.destroy(r, 'ダーク・カタパルター'); k++; step();
      });
    };
    step();
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], passive:{ onStandbyPhase(ctx){ return u362CatMine(ctx); } } });
