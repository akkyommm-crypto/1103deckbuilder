/* S03-U229: NOT_STARTED cards (2011 texts) — 平穏の賢者, 静寂の聖者, 言語道断侍, 強引な安全協定, C・シューター, 炎熱刀プロミネンス, 燃え盛るヒータ, 荒ぶるアウス,
   逆巻くエリア, 勝利の導き手フレイヤ. Engine: effectFlags.activationBanS03 (engine/1ZD). */

/* adds a turn-ranged activation ban to player p (engine/1ZD reads it; old entries are dropped) */
function banActivationS03(p, from, to, kinds, label){
  const cur = API.getFlag(p, 'activationBanS03');
  const keep = (Array.isArray(cur) ? cur : []).filter(b=>b && Number(b.to)>=Number(gameState.turn));
  keep.push({from, to, kinds, label});
  API.setFlag(p, 'activationBanS03', keep, false);
}

/* ---- 平穏の賢者 / 静寂の聖者: このカードが戦闘によって相手モンスターを破壊した場合、相手プレイヤーは次のターン罠（魔法）カードを発動できない。 (forced) ---- */
function sageWinS03(ctx){ const h = destroyedByThisS03(ctx); return !!h && h.p===ctx.opponent; }
function sageScriptS03(name, kind){ return {
  type:'monster', priority:1, forced:true, dsTiming:'leave',
  condition(ctx){ if(ctx.eventName!=='onBattleDestroy' || !sageWinS03(ctx)){ ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; } return true; },
  resolve(ctx){ banActivationS03(ctx.opponent, gameState.turn+1, gameState.turn+1, [kind], name); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return sageWinS03(ctx); } }
}; }
defineScript('平穏の賢者', sageScriptS03('平穏の賢者', 't'));
defineScript('静寂の聖者', sageScriptS03('静寂の聖者', 's'));

/* ---- 言語道断侍: 800ライフポイントを払う。エンドフェイズまで、全ての魔法・罠カードは発動する事ができない。 (cost: the LP) ---- */
defineScript('言語道断侍', {
  type:'monster', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(API.me(ctx).lp<800){ ctx.reason = 'ライフポイントが足りません'; return false; }
    return true;
  },
  cost(ctx, done){ if(API.me(ctx).lp<800){ done(false); return; } API.payCost(ctx.player, 800); done(true); },
  resolve(ctx){ [0,1].forEach(p=>banActivationS03(p, gameState.turn, gameState.turn, ['s','t'], '言語道断侍')); },
  afterResolve(){}
});

/* ---- 強引な安全協定: 手札を1枚捨てる。このターンのエンドフェイズ時まで、罠カードを発動する事はできない。 (cost: the discard) ---- */
defineScript('強引な安全協定', {
  type:'trap', priority:2,
  condition(ctx){ if(!API.me(ctx).hand.length){ ctx.reason = '捨てる手札がありません'; return false; } return true; },
  cost(ctx, done){ API.selectCard('強引な安全協定：捨てる手札', API.pileCards(ctx.player,'hand'), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, '強引な安全協定（コスト）', {byEffect:false}); done(true); }); },
  resolve(ctx){ [0,1].forEach(p=>banActivationS03(p, gameState.turn, gameState.turn, ['t'], '強引な安全協定')); },
  afterResolve(){}
});

/* ---- C・シューター: 自分フィールド上に存在する「C」と名のついたモンスター1体を墓地へ送って発動する。相手ライフに800ポイントダメージを与える。1ターンに1度。 ---- */
function cShooterCostsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>String(x.db.n||'').indexOf('C・')===0}); }
defineScript('C・シューター', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!cShooterCostsS03(ctx).length){ ctx.reason = '墓地へ送る「C」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('C・シューター：墓地へ送る「C」', cShooterCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, 'C・シューター（コスト）'); done(true); }); },
  resolve(ctx){ API.damageLP(ctx.opponent, 800); },
  afterResolve(){}
});

/* ---- 炎熱刀プロミネンス: 1ターンに1度、自分の墓地の「ラヴァル」と名のついたモンスター1体をゲームから除外して発動できる。このカードの攻撃力はエンドフェイズ時まで
   300ポイントアップする。この効果は相手ターンでも発動できる。 (a quick effect) ---- */
function prominenceCostsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.LAVAL)); }
defineScript('炎熱刀プロミネンス', {
  type:'monster', priority:2, quickEffect:true, countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!prominenceCostsS03(ctx).length){ ctx.reason = '墓地に「ラヴァル」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('炎熱刀プロミネンス：除外する「ラヴァル」', prominenceCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, '炎熱刀プロミネンス（コスト）'); done(true); }); },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.modAtk(me, 300, 0, 'endPhase', '炎熱刀プロミネンス'); },
  afterResolve(){}
});

/* ---- 燃え盛るヒータ / 荒ぶるアウス / 逆巻くエリア: このカードを除く自分フィールド上の炎（地・水）属性モンスター1体を生け贄に捧げる事で、手札から炎（地・水）属性モンスター1体を
   特殊召喚する。1ターンに1度。この効果によって特殊召喚されたモンスターは、このカードが自分フィールド上から離れた場合破壊される。 (cost: the release; linked, engine v9) ---- */
function charmerS03(name, attr){
  const costs = ctx=>API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && !x.card.cannotTribute && currentAttributeV17(x.card)===attr});
  const pool = ctx=>API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && x.db.at===attr && canEffectSpecialSummonS03(x.card,'hand',name));
  return {
    type:'monster', priority:1, timing:['mainPhase'], countLimit:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
      if(!costs(ctx).length){ ctx.reason = 'リリースする' + attr + '属性モンスターがいません'; return false; }
      if(!pool(ctx).length){ ctx.reason = '手札に' + attr + '属性モンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){ API.selectCard(name + '：リリースするモンスター', costs(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, name + '（リリース）'); done(true); }); },
    resolve(ctx){
      const p = pool(ctx); if(!p.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.selectCard(name + '：特殊召喚するモンスター', p, t=>{
        const r = resolveTarget(t); if(!r || r.zone!=='hand') return; const u = r.card.uid;
        if(API.specialSummon(ctx.player, 'hand', r.index, 'atk', name)===false) return;
        const now = u!=null ? findCardByUid(u) : null, me = locateCardAnyV4(ctx.card);
        if(now && now.zone==='mz' && me && me.zone==='mz') API.linkOnLeave(now, me, 'destroy', name);
        else if(now && now.zone==='mz') API.destroy(now, name);      /* the charmer already left the field */
      });
    },
    afterResolve(){}
  };
}
defineScript('燃え盛るヒータ', charmerS03('燃え盛るヒータ', '炎'));
defineScript('荒ぶるアウス', charmerS03('荒ぶるアウス', '地'));
defineScript('逆巻くエリア', charmerS03('逆巻くエリア', '水'));

/* ---- 勝利の導き手フレイヤ: 自分フィールド上に「勝利の導き手フレイヤ」以外の天使族モンスターが表側表示で存在する場合、このカードを攻撃対象に選択する事はできない。
   このカードが自分フィールド上に表側表示で存在する限り、自分フィールド上に表側表示で存在する天使族モンスターの攻撃力・守備力は400ポイントアップする。 ---- */
defineScript('勝利の導き手フレイヤ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'],
    apply(target, self){ return (self && self.face==='up' && target && target.face==='up' && currentRaceV17(target)==='天使') ? {atk:400, def:400} : null; },
    cannotBeAttackTarget:(target, self)=> target===self && self.face==='up' && (function(){ const loc = locateCard(self); return !!loc && (gameState.players[loc.p].mz||[]).some(c=>c && c!==self && c.face==='up' && cardName(c)!=='勝利の導き手フレイヤ' && currentRaceV17(c)==='天使'); })() }
});
