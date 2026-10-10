/* S03-U255: LV monsters 2 (2011 texts) — アルティメット・インセクト LV1 / LV3 / LV5 / LV7, 漆黒の魔王 LV6 / LV8, アームド・ドラゴン LV5 / LV7 / LV10,
   and 異次元の狂獣.
   「「X」の効果で特殊召喚した場合」: the LV-up helper of S03-U251 (lvUpResolveS03) and 漆黒の魔王 LV4 now pass opts.summonSrcS03 (S03-U238 record,
   zone-local) — read here with lvSummonedByS03.
   Engine (this unit, engine/00 BATTLE_CLEANUP): card.battleKillEffectTurnS03 (destroyed an effect monster by battle); the destroyer's script
   battleVictimBanishS03(destroyer, victim) banishes the victim instead of sending it to the GY; a declared battle-destroyed negator (engine/1S)
   also reaches a victim banished that way. */
function lvSummonedByS03(card, name){ return !!card && !!card.summonSrcS03 && card.summonSrcS03.name===name; }

/* ===================== アルティメット・インセクト ===================== */
/* 「自分のターンのスタンバイフェイズ時、表側表示のこのカードを墓地に送る事で「X」1体を手札またはデッキから特殊召喚する
   （召喚・特殊召喚・リバースしたターンを除く）」 — same timing as サイレント・ソードマン LV3 ② (swordsmanLv3ArmedS03) */
function insectLvUpS03(name, next, extra){
  return Object.assign({
    type:'monster', priority:1, activateFrom:['mz'],
    condition(ctx){
      if(!swordsmanLv3ArmedS03(ctx)){ ctx.reason = '自分のスタンバイフェイズに発動します（召喚・特殊召喚・リバースしたターンを除く）'; return false; }
      if(!lvUpTargetsS03(ctx.player, next).length){ ctx.reason = `「${next}」が手札・デッキにいません`; return false; }
      return true;
    },
    cost(ctx, done){ lvUpCostS03(ctx, done, name); },
    resolve(ctx){ lvUpResolveS03(ctx, next, name); },
    afterResolve(){},
    passive:{ onStandbyPhase(ctx){ return swordsmanLv3ArmedS03(ctx) && lvUpTargetsS03(ctx.player, next).length > 0; } }
  }, extra || {});
}
function insectDebuffS03(from, mod){
  return {scope:'oppMonsters', from:['mz'], apply(card, self){ return (self && self.face==='up' && lvSummonedByS03(self, from)) ? mod : null; }};
}
/* LV1: 自分フィールド上に表側表示で存在するこのカードは魔法の効果を受けない。 */
defineScript('アルティメット・インセクト LV1', insectLvUpS03('アルティメット・インセクト LV1', 'アルティメット・インセクト LV3', {
  unaffectedByS03(card, src){
    if(!src || src.k!=='s' || !card || card.face!=='up') return false;
    const h = findCardByUid(card.uid); return !!h && h.zone==='mz';
  }
}));
/* LV3: 「LV1」の効果で特殊召喚した場合、このカードがフィールド上に存在する限り、全ての相手モンスターの攻撃力は300ポイントダウンする。 */
defineScript('アルティメット・インセクト LV3', insectLvUpS03('アルティメット・インセクト LV3', 'アルティメット・インセクト LV5', {
  continuous:insectDebuffS03('アルティメット・インセクト LV1', {atk:-300})
}));
/* LV5: 「LV3」の効果で特殊召喚した場合 … 500ポイントダウン。 */
defineScript('アルティメット・インセクト LV5', insectLvUpS03('アルティメット・インセクト LV5', 'アルティメット・インセクト LV7', {
  continuous:insectDebuffS03('アルティメット・インセクト LV3', {atk:-500})
}));
/* LV7: 「LV5」の効果で特殊召喚した場合、このカードが自分フィールド上に存在する限り、全ての相手モンスターの攻撃力・守備力は700ポイントダウンする。 */
defineScript('アルティメット・インセクト LV7', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:insectDebuffS03('アルティメット・インセクト LV5', {atk:-700, def:-700})
});

/* ===================== 漆黒の魔王 ===================== */
/* LV6: 「漆黒の魔王 LV4」の効果で特殊召喚した場合、このカードが戦闘によって破壊した相手モンスターの効果は無効化される (engine/1S, effect monsters).
   この効果で相手モンスターの効果を無効化した次の自分ターンのスタンバイフェイズ時、このカードを墓地に送る事で「漆黒の魔王 LV8」を手札またはデッキから特殊召喚する。
   (「この効果で無効化した」 = it destroyed an effect monster by battle while summoned by LV4: card.battleKillEffectTurnS03) */
declareBattleDestroyedNegatorS03('漆黒の魔王 LV6', {condition(d){ return lvSummonedByS03(d, '漆黒の魔王 LV4'); }});
function darkLordLv6ArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  if(!me || gameState.phase!=='standby' || gameState.activePlayer!==me.p || !lvSummonedByS03(me.card, '漆黒の魔王 LV4')) return false;
  const t = Number(me.card.battleKillEffectTurnS03 || -1);
  return t > 0 && t < gameState.turn && gameState.turn <= t + 2;   // the next own turn
}
defineScript('漆黒の魔王 LV6', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(!darkLordLv6ArmedS03(ctx)){ ctx.reason = 'この効果で相手モンスターの効果を無効化した次の自分スタンバイフェイズに発動します'; return false; }
    if(!lvUpTargetsS03(ctx.player, '漆黒の魔王 LV8').length){ ctx.reason = '「漆黒の魔王 LV8」が手札・デッキにいません'; return false; }
    return true;
  },
  cost(ctx, done){ lvUpCostS03(ctx, done, '漆黒の魔王 LV6'); },
  resolve(ctx){ lvUpResolveS03(ctx, '漆黒の魔王 LV8', '漆黒の魔王 LV6'); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return darkLordLv6ArmedS03(ctx) && lvUpTargetsS03(ctx.player, '漆黒の魔王 LV8').length > 0; } }
});
/* LV8: 「漆黒の魔王 LV6」の効果で特殊召喚した場合、このカードが戦闘によって破壊した相手モンスターの効果を無効にし、ゲームから除外する。 */
declareBattleDestroyedNegatorS03('漆黒の魔王 LV8', {condition(d){ return lvSummonedByS03(d, '漆黒の魔王 LV6'); }});
defineScript('漆黒の魔王 LV8', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  battleVictimBanishS03(self){ return lvSummonedByS03(self, '漆黒の魔王 LV6'); }
});

/* ---- 異次元の狂獣: このカードが戦闘によって破壊したモンスターはゲームから除外される。 ---- */
defineScript('異次元の狂獣', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  battleVictimBanishS03(){ return true; }
});

/* ===================== アームド・ドラゴン ===================== */
/* cost: 「手札からモンスター1体を墓地へ送り」 — its ATK (printed; '?' = 0) is recorded on this card (journaled flag armedCostAtkS03) for the resolution */
function armedHandMonstersS03(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m'); }
function armedAtkOfDbS03(db){ const v = Number(db && db.atk); return Number.isFinite(v) && v > 0 ? v : 0; }
function armedFoeFaceUpS03(ctx, maxAtk){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && curATK(x.card) <= maxAtk}); }
function armedPayCostS03(ctx, done, label, pool){
  const me = lvFaceUpMzS03(ctx);
  if(!me || !pool.length){ done(false); return; }
  API.selectCard(`${label}：墓地へ送る手札のモンスター`, pool, t=>{
    const h = t && locateCardAnyV4(t.card || t);
    if(!h || h.zone!=='hand'){ done(false); return; }
    const atk = armedAtkOfDbS03(dbOf(h.card));
    API.sendHandToGrave(ctx.player, h.index, `${label}（コスト）`);
    const me2 = locateCardAnyV4(ctx.card);
    if(me2 && me2.zone==='mz') API.setCardFlag(me2, 'armedCostAtkS03', atk, label);
    done(true);
  });
}
function armedCostAtkS03(ctx){ const me = locateCardAnyV4(ctx.card); return me ? Number(me.card.armedCostAtkS03 || 0) : 0; }

/* LV5 ①: 手札からモンスター1体を墓地へ送り、そのモンスターの攻撃力以下の攻撃力を持つ相手フィールドのモンスター1体を対象として発動できる。
   この効果を発動するために墓地へ送ったモンスターの攻撃力以下の攻撃力を持つ、その相手モンスターを破壊する。
   ②: このカードが戦闘でモンスターを破壊したターンのエンドフェイズに、フィールドのこのカードを墓地へ送って発動できる。手札・デッキから「アームド・ドラゴン LV7」を特殊召喚する。
   (ruling chosen: only a face-up monster has a known ATK and can be targeted; the cost monster must leave a legal target) */
function armedLv5CostPoolS03(ctx){ return armedHandMonstersS03(ctx.player).filter(x=>armedFoeFaceUpS03(ctx, armedAtkOfDbS03(x.db)).length > 0); }
function armedLv5UpArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  return !!me && gameState.phase==='end' && Number(me.card.battleKillTurnS03 || -1)===gameState.turn;
}
defineUnifiedCardV4('アームド・ドラゴン LV5', [{
  key:'destroy', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!lvFaceUpMzS03(ctx)){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!armedLv5CostPoolS03(ctx).length){ ctx.reason = '手札のモンスターの攻撃力以下の相手モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ armedPayCostS03(ctx, done, 'アームド・ドラゴン LV5', armedLv5CostPoolS03(ctx)); },
  target(ctx, done){ API.selectCard('アームド・ドラゴン LV5：破壊する相手モンスター', armedFoeFaceUpS03(ctx, armedCostAtkS03(ctx)), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.opponent && curATK(r.card) <= armedCostAtkS03(ctx)) API.destroy(r, 'アームド・ドラゴン LV5', ctx.player);
  },
  afterResolve(){}
}, {
  key:'lvup', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'],
  condition(ctx){
    if(!armedLv5UpArmedS03(ctx)){ ctx.reason = '戦闘でモンスターを破壊したターンのエンドフェイズに発動できます'; return false; }
    if(!lvUpTargetsS03(ctx.player, 'アームド・ドラゴン LV7').length){ ctx.reason = '「アームド・ドラゴン LV7」が手札・デッキにいません'; return false; }
    return true;
  },
  cost(ctx, done){ lvUpCostS03(ctx, done, 'アームド・ドラゴン LV5'); },
  operation(ctx){ lvUpResolveS03(ctx, 'アームド・ドラゴン LV7', 'アームド・ドラゴン LV5'); },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true,
    passive:{ onEndPhase(ctx){ return armedLv5UpArmedS03(ctx) && lvUpTargetsS03(ctx.player, 'アームド・ドラゴン LV7').length > 0; } }});

/* LV7: 通常召喚できない。「アームド・ドラゴン LV5」の効果でのみ特殊召喚できる（engine/1ZK）。
   ①: 手札からモンスター1体を墓地へ送って発動できる。墓地へ送ったそのモンスターの攻撃力以下の攻撃力を持つ、相手フィールドのモンスターを全て破壊する。
   (face-down monsters are compared by their ATK as well) */
defineScript('アームド・ドラゴン LV7', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(!lvFaceUpMzS03(ctx)){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!armedHandMonstersS03(ctx.player).length){ ctx.reason = '手札にモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ armedPayCostS03(ctx, done, 'アームド・ドラゴン LV7', armedHandMonstersS03(ctx.player)); },
  resolve(ctx){
    const max = armedCostAtkS03(ctx);
    const uids = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>curATK(x.card) <= max}).map(x=>x.card.uid);
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.destroy(h, 'アームド・ドラゴン LV7', ctx.player); });
  },
  afterResolve(){}
});

/* LV10: 通常召喚できない。自分フィールド上に存在する「アームド・ドラゴン LV7」1体をリリースした場合のみ特殊召喚する事ができる（summon procedure from the hand）。
   手札を1枚墓地へ送る事で、相手フィールド上に表側表示で存在するモンスターを全て破壊する。 */
function armedLv7OnFieldS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.n==='アームド・ドラゴン LV7'}); }
defineScript('アームド・ドラゴン LV10', {
  type:'monster', priority:1, activateFrom:['mz'],
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!armedLv7OnFieldS03(ctx).length){ ctx.reason = '自分フィールドに「アームド・ドラゴン LV7」が必要です'; return false; } return true; },
    cost(ctx, done){
      API.selectCard('アームド・ドラゴン LV10：リリースする「アームド・ドラゴン LV7」', armedLv7OnFieldS03(ctx), t=>{
        const h = t && resolveTarget(t);
        if(!h || h.zone!=='mz'){ done(false); return; }
        API.sendToGrave(h, 'アームド・ドラゴン LV10（リリース）'); done(true);
      });
    }
  },
  condition(ctx){
    if(!lvFaceUpMzS03(ctx)){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '手札がありません'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = API.pileCards(ctx.player, 'hand', ()=>true);
    API.selectCard('アームド・ドラゴン LV10：墓地へ送る手札', pool, t=>{
      const h = t && locateCardAnyV4(t.card || t);
      if(!h || h.zone!=='hand'){ done(false); return; }
      API.sendHandToGrave(ctx.player, h.index, 'アームド・ドラゴン LV10（コスト）'); done(true);
    });
  },
  resolve(ctx){
    const uids = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'}).map(x=>x.card.uid);
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.destroy(h, 'アームド・ドラゴン LV10', ctx.player); });
  },
  afterResolve(){}
});
