/* S03-U251: LV monsters (2011 texts) — サイレント・ソードマン LV3 / LV5 / LV7, ホルスの黒炎竜 LV4 / LV6 / LV8.
   Engine (this unit):
   - engine/1ZH: continuous negateSpell(card, self) on a monster — 「フィールドの魔法カードの効果は無効化される」 (LV7);
   - engine/00 FX_CONTROL / CONTROL_SWAP_V26: script controlLockS03(card) — 「コントロールを変更する事はできない」 (Horus LV4);
   - engine/00: card.directBattleDamageTurnS03 (direct-attack battle damage, LV5) and card.battleKillTurnS03 (destroyed a monster by
     battle, Horus LV4 / LV6), both zone-local and set by reducers;
   - engine/1ZK: 「「X」の効果でのみ特殊召喚できる」 is now a summon condition (LV7 / LV8), relaxed once properly summoned (蘇生制限).
   Existing capabilities: engine/1T declareTargetingNegatorS03 (LV3), engine/1ZG unaffectedByS03 (LV5 / Horus LV6). */

/* ---- shared: 「フィールドのこのカードを墓地へ送って発動できる。手札・デッキから「X」1体を特殊召喚する」 ---- */
function lvUpTargetsS03(p, name){
  return API.pileCards(p, 'hand', x=>x.db.n===name).concat(API.pileCards(p, 'deck', x=>x.db.n===name));
}
function lvFaceUpMzS03(ctx){
  const me = locateCardAnyV4(ctx.card);
  return (me && me.zone==='mz' && me.card.face==='up') ? me : null;
}
function lvUpCostS03(ctx, done, label){
  const me = lvFaceUpMzS03(ctx);
  if(!me){ done(false); return; }
  API.sendToGrave(me, label + '（コスト）');
  done(true);
}
function lvUpResolveS03(ctx, next, label){
  const q = lvUpTargetsS03(ctx.player, next);
  if(!q.length || (API.me(ctx).mz||[]).length >= 5) return;
  API.selectCard(`${label}：特殊召喚する「${next}」`, q, t=>{
    const r = t && locateCardAnyV4(t.card || t);
    if(r && (r.zone==='hand' || r.zone==='deck')) API.specialSummon(ctx.player, r.zone, r.index, 'atk', label, r.p, {summonSrcS03:label});   /* S03-U255: 「「X」の効果で特殊召喚した場合」 */
  });
}

/* ---- サイレント・ソードマン LV3 ----
   ①: このカードを対象とする相手の魔法カードの効果は無効化される (continuous; engine/1T, effect negation of that link).
   ②: 自分スタンバイフェイズにフィールドのこのカードを墓地へ送って発動できる。手札・デッキから「サイレント・ソードマン LV5」1体を特殊召喚する。
       この効果はこのカードが召喚・特殊召喚・リバースしたターンには発動できない。 */
declareTargetingNegatorS03('サイレント・ソードマン LV3', {
  applies({link, srcDb, negator}){
    if(!srcDb || srcDb.k!=='s') return null;
    const c = negator && negator.card;
    if(!c || c.face!=='up' || link.player===negator.p) return null;
    return {mode:'effect', destroySource:false, reason:'サイレント・ソードマン LV3'};
  }
});
function swordsmanLv3ArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  if(!me || gameState.phase!=='standby' || gameState.activePlayer!==me.p) return false;
  return me.card.summonedTurn!==gameState.turn && me.card.flippedTurnS03!==gameState.turn;
}
defineScript('サイレント・ソードマン LV3', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(!swordsmanLv3ArmedS03(ctx)){ ctx.reason = '自分スタンバイフェイズに発動します（召喚・特殊召喚・リバースしたターンを除く）'; return false; }
    if(!lvUpTargetsS03(ctx.player, 'サイレント・ソードマン LV5').length){ ctx.reason = '「サイレント・ソードマン LV5」が手札・デッキにいません'; return false; }
    return true;
  },
  cost(ctx, done){ lvUpCostS03(ctx, done, 'サイレント・ソードマン LV3'); },
  resolve(ctx){ lvUpResolveS03(ctx, 'サイレント・ソードマン LV5', 'サイレント・ソードマン LV3'); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return swordsmanLv3ArmedS03(ctx) && lvUpTargetsS03(ctx.player, 'サイレント・ソードマン LV5').length > 0; } }
});

/* ---- サイレント・ソードマン LV5 ----
   ①: このカードは相手の魔法カードの効果を受けない。
   ②: このカードが直接攻撃で相手に戦闘ダメージを与えた場合、次の自分ターンのスタンバイフェイズにフィールドのこのカードを墓地へ送って発動できる。
       手札・デッキから「サイレント・ソードマン LV7」1体を特殊召喚する。 */
function swordsmanLv5ArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  if(!me || gameState.phase!=='standby' || gameState.activePlayer!==me.p) return false;
  const t = Number(me.card.directBattleDamageTurnS03 || -1);
  return t > 0 && t < gameState.turn && gameState.turn <= t + 2;   // the next own turn
}
defineScript('サイレント・ソードマン LV5', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){
    if(!swordsmanLv5ArmedS03(ctx)){ ctx.reason = '直接攻撃で戦闘ダメージを与えた次の自分スタンバイフェイズに発動します'; return false; }
    if(!lvUpTargetsS03(ctx.player, 'サイレント・ソードマン LV7').length){ ctx.reason = '「サイレント・ソードマン LV7」が手札・デッキにいません'; return false; }
    return true;
  },
  cost(ctx, done){ lvUpCostS03(ctx, done, 'サイレント・ソードマン LV5'); },
  resolve(ctx){ lvUpResolveS03(ctx, 'サイレント・ソードマン LV7', 'サイレント・ソードマン LV5'); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return swordsmanLv5ArmedS03(ctx) && lvUpTargetsS03(ctx.player, 'サイレント・ソードマン LV7').length > 0; } },
  unaffectedByS03(card, src){
    if(!src || src.k!=='s' || !card) return false;
    const s = findCardByUid(src.uid), me = findCardByUid(card.uid);
    return !!(s && me && s.p!==me.p);
  }
});

/* ---- サイレント・ソードマン LV7: 通常召喚できない（text）。「サイレント・ソードマン LV5」の効果でのみ特殊召喚できる（engine/1ZK）。
   ①: このカードがモンスターゾーンに存在する限り、フィールドの魔法カードの効果は無効化される (engine/1ZH negateSpell). ---- */
defineScript('サイレント・ソードマン LV7', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    negateSpell(card, self){ return !!card && dbOf(card).k==='s' && !!self && self.face==='up'; }}
});

/* ---- ホルスの黒炎竜 LV4 / LV6: 「このカードがモンスターを戦闘によって破壊したターンのエンドフェイズ時、このカードを墓地に送る事で
   「X」1体を手札またはデッキから特殊召喚する」 (optional; any turn) ---- */
function horusArmedS03(ctx){
  const me = lvFaceUpMzS03(ctx);
  return !!me && gameState.phase==='end' && Number(me.card.battleKillTurnS03 || -1)===gameState.turn;
}
function horusLvUpScriptS03(name, next, extra){
  return Object.assign({
    type:'monster', priority:1, activateFrom:['mz'],
    condition(ctx){
      if(!horusArmedS03(ctx)){ ctx.reason = 'モンスターを戦闘で破壊したターンのエンドフェイズに発動します'; return false; }
      if(!lvUpTargetsS03(ctx.player, next).length){ ctx.reason = `「${next}」が手札・デッキにいません`; return false; }
      return true;
    },
    cost(ctx, done){ lvUpCostS03(ctx, done, name); },
    resolve(ctx){ lvUpResolveS03(ctx, next, name); },
    afterResolve(){},
    passive:{ onEndPhase(ctx){ return horusArmedS03(ctx) && lvUpTargetsS03(ctx.player, next).length > 0; } }
  }, extra || {});
}
/* LV4: このカードは自分フィールド上に表側表示で存在する限り、コントロールを変更する事はできない (engine/00 controlLockS03). */
defineScript('ホルスの黒炎竜 LV4', horusLvUpScriptS03('ホルスの黒炎竜 LV4', 'ホルスの黒炎竜 LV6', {
  controlLockS03(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz'; }
}));
/* LV6: このカードは自分フィールド上に表側表示で存在する限り、魔法の効果を受けない。 */
defineScript('ホルスの黒炎竜 LV6', horusLvUpScriptS03('ホルスの黒炎竜 LV6', 'ホルスの黒炎竜 LV8', {
  unaffectedByS03(card, src){
    if(!src || src.k!=='s' || !card || card.face!=='up') return false;
    const h = findCardByUid(card.uid); return !!h && h.zone==='mz';
  }
}));

/* ---- ホルスの黒炎竜 LV8: 通常召喚できない。「ホルスの黒炎竜 LV6」の効果でのみ特殊召喚する事ができる（engine/1ZK）。
   このカードが自分フィールド上に表側表示で存在する限り、魔法カードの発動を無効にし破壊する事ができる（quick effect, no count limit）。 ---- */
defineScript('ホルスの黒炎竜 LV8', {
  type:'monster', priority:2, quickEffect:true, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = '自分フィールド上に表側表示で存在する場合に発動します'; return false; }
    const e = ctx.event;
    if(!e || e.kind!=='spell'){ ctx.reason = '魔法カードが発動した時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ホルスの黒炎竜 LV8', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && !!ctx.event && ctx.event.kind==='spell'; } }
});
declareActivationResponseS03(['ホルスの黒炎竜 LV8']);   /* a chain response to the Spell activation (engine/1P), not a late trigger */
