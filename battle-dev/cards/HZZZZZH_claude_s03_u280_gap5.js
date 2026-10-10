/* S03-U280: ENGINE_GAP re-check 5 (2011 texts) — 深海の戦士, 砲弾ヤリ貝, 魚雷魚, キャトルミューティレーション, ライバル登場!, 魂の氷結.
   No engine change. Reuses: unaffectedByS03 (engine/1ZG, S03-U115; effect-source stamping for chain links, continuous layers and negation), canonical-name identity
   (sameCanonicalCardV4 + 「カード名を〜として扱う」, System v17), the ChoiceRequest primitive with a registered resume handler (System v4.9), API.specialSummon (the position
   question is asked by engine/1ZZK, S03-U278), API.skipPhase (System v7). All helper names carry the S280 suffix. */

/* ---- 深海の戦士 / 砲弾ヤリ貝 / 魚雷魚: 「海」がフィールド上に存在する限り、このカードは魔法の効果を受けない。
   (Ruling (Opus): while a face-up 「海」 (or a card treated as 「海」) is in either Field Zone, the face-up monster is unaffected by Spell card effects — chain-link effects and
   continuous Spell effects alike, so 魚雷魚 / 砲弾ヤリ貝 do not receive 「海」's own +200 / +200. Trap and monster effects still apply. Not a target restriction: a Spell may still
   select it, the effect just does nothing to it.) ---- */
function seaOnFieldS280(gs){
  const st = gs || gameState;
  if(!st || !st.players || typeof findCardIndex !== 'function') return false;
  const sea = dbOf({id:findCardIndex('海')});
  return [0,1].some(p=>{
    const f = st.players[p] && st.players[p].field;
    return !!f && f.face === 'up' && !f.activationPending && !f.activationNegated && sameCanonicalCardV4(f, sea);
  });
}
function seaImmuneS280(card, src, gs){
  if(!src || src.k !== 's' || !card || card.face !== 'up') return false;
  const st = gs || gameState;
  const h = (card.uid != null && typeof findCardByUidInState === 'function') ? findCardByUidInState(st, card.uid) : null;
  if(!h || h.zone !== 'mz' || h.card.face !== 'up') return false;
  return seaOnFieldS280(st);
}
defineScript('深海の戦士', { type:'monster', priority:1, unaffectedByS03(card, src, gs){ return seaImmuneS280(card, src, gs); } });
defineScript('砲弾ヤリ貝', { type:'monster', priority:1, unaffectedByS03(card, src, gs){ return seaImmuneS280(card, src, gs); } });
defineScript('魚雷魚', { type:'monster', priority:1, unaffectedByS03(card, src, gs){ return seaImmuneS280(card, src, gs); } });

/* ---- キャトルミューティレーション (Trap): 自分フィールド上に表側表示で存在する獣族モンスター1体を手札に戻し、手札から戻したモンスターと同じレベルの獣族モンスター1体を特殊召喚する。
   (nothing is targeted: both cards are chosen at resolution. Condition: a face-up Beast on the activator's field. 1: choose one of them and return it to the hand (its Level is read
   just before it moves). 2: only if it is really in the hand now, choose from the hand a Beast with the same Level — the returned card itself may be chosen — and Special Summon it;
   the position is asked by the engine (no position in the text).) ---- */
function catBeastsS280(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face === 'up' && x.db.k === 'm' && (typeof currentRaceV17 === 'function' ? currentRaceV17(x.card) : x.db.ra) === '獣'});
}
function catHandPoolS280(p, level){
  return API.pileCards(p, 'hand', x=>x.db.k === 'm' && (typeof currentRaceV17 === 'function' ? currentRaceV17(x.card) : x.db.ra) === '獣'
    && Number(x.db.lv) === level && level > 0 && canEffectSpecialSummonS03(x.card, 'hand', 'キャトルミューティレーション'));
}
defineScript('キャトルミューティレーション', {
  type:'trap', priority:2, includesSpecialSummon:true,
  condition(ctx){
    if(!catBeastsS280(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の獣族モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = catBeastsS280(ctx.player);
    if(!pool.length){ API.log('キャトルミューティレーション：表側表示の獣族モンスターがいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'キャトルミューティレーション：手札に戻す獣族モンスター', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u280.cat-return', args:{player:ctx.player}}, meta:{scriptName:'キャトルミューティレーション'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u280.cat-return', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player, pick = (a.cards || []).find(y=>y && !y.stale && y.uid != null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.p !== p || h.zone !== 'mz' || h.card.face !== 'up') return;
  const level = Number(typeof curLV === 'function' ? curLV(h.card) : dbOf(h.card).lv) || 0;
  const uid = pick.uid;
  API.returnToHand(h, 'キャトルミューティレーション');
  const back = findCardByUid(uid);
  if(!back || back.zone !== 'hand' || back.p !== p){ API.log('キャトルミューティレーション：手札に戻せなかったため特殊召喚しない'); return; }
  const pool = catHandPoolS280(p, level);
  if(!pool.length || !hasMonsterZoneSpace(p)){ API.log('キャトルミューティレーション：特殊召喚できる同じレベルの獣族モンスターが手札にいない'); return; }
  API.requestChoice({player:p, kind:'card', title:`キャトルミューティレーション：特殊召喚するレベル${level}の獣族モンスター（手札）`, candidates:pool, min:1, max:1, cancelable:false,
    resume:{handler:'s03u280.cat-summon', args:{player:p, level}}, meta:{scriptName:'キャトルミューティレーション'}});
});
API.registerChoiceHandler('s03u280.cat-summon', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player, pick = (a.cards || []).find(y=>y && !y.stale && y.uid != null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.p !== p || h.zone !== 'hand' || !hasMonsterZoneSpace(p)) return;
  if(!catHandPoolS280(p, Number(x.level)).some(y=>y.card.uid === pick.uid)) return;
  /* the text's only Special Summon sentence also contains 「表側表示」 (the Beast to return), so the engine's no-position detection (engine/1ZZK ssPositionFreeS03) does not
     queue the question: the position is asked explicitly with the shared helper (same question, summoning player chooses face-up Attack or Defense) */
  specialSummonPositionsS03(p, [{uid:pick.uid, from:'hand'}], 'キャトルミューティレーション');
});

/* ---- ライバル登場! (Trap): 相手フィールド上に表側表示で存在するモンスター1体を選択する。選択したモンスターと同じレベルのモンスター1体を自分の手札から特殊召喚する。
   (the target — a face-up monster on the opponent's field — is chosen at activation. At resolution, if it is still a face-up monster on the field, the hand is searched for a
   monster with the same current Level and one of them is Special Summoned (the position is asked by the engine). Needs a free Monster Zone to activate.) ---- */
function rivalTargetsS280(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face === 'up' && x.db.k === 'm'});
}
function rivalHandPoolS280(p, level){
  return API.pileCards(p, 'hand', x=>x.db.k === 'm' && level > 0 && (Number(typeof curLV === 'function' ? curLV(x.card) : x.db.lv) || 0) === level
    && canEffectSpecialSummonS03(x.card, 'hand', 'ライバル登場!'));
}
defineScript('ライバル登場!', {
  type:'trap', priority:2, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(!rivalTargetsS280(ctx).length){ ctx.reason = '相手フィールドに表側表示のモンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ライバル登場!：相手の表側表示モンスター', rivalTargetsS280(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const h = t && t.card && t.card.uid != null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone !== 'mz' || h.card.face !== 'up' || dbOf(h.card).k !== 'm'){ API.log('ライバル登場!：対象が表側表示のモンスターとして存在しない'); return; }
    const level = Number(typeof curLV === 'function' ? curLV(h.card) : dbOf(h.card).lv) || 0;
    const pool = rivalHandPoolS280(ctx.player, level);
    if(!pool.length || !hasMonsterZoneSpace(ctx.player)){ API.log('ライバル登場!：特殊召喚できる同じレベルのモンスターが手札にいない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:`ライバル登場!：特殊召喚するレベル${level}のモンスター（手札）`, candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u280.rival-summon', args:{player:ctx.player, level}}, meta:{scriptName:'ライバル登場!'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u280.rival-summon', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player, pick = (a.cards || []).find(y=>y && !y.stale && y.uid != null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.p !== p || h.zone !== 'hand' || !hasMonsterZoneSpace(p)) return;
  if(!rivalHandPoolS280(p, Number(x.level)).some(y=>y.card.uid === pick.uid)) return;
  API.specialSummon(p, 'hand', h.index, 'atk', 'ライバル登場!');
});

/* ---- 魂の氷結 (Trap): 自分のライフポイントが相手のライフポイントより2000以上少ない時に発動する事ができる。相手の次のバトルフェイズをスキップする。
   (condition: own LP <= opponent LP - 2000. Resolution: the opponent's next Battle Phase is skipped with the phase-skip API (System v7 skipPhase 'battle', which really goes to the
   Main Phase 2 when the opponent tries to enter it): this turn's if the opponent's turn has not reached its Battle Phase yet (Draw / Standby / Main Phase 1), otherwise the
   opponent's next turn's.) ---- */
defineScript('魂の氷結', {
  type:'trap', priority:2,
  condition(ctx){
    const me = API.me(ctx).lp, foe = API.foe(ctx).lp;
    if(!(me <= foe - 2000)){ ctx.reason = '自分のライフポイントが相手より2000以上少ない時に発動できます'; return false; }
    return true;
  },
  resolve(ctx){
    const thisTurn = gameState.activePlayer === ctx.opponent && ['draw', 'standby', 'main1'].indexOf(gameState.phase) >= 0;
    API.skipPhase(ctx.opponent, 'battle', thisTurn ? 0 : 1);
  },
  afterResolve(){}
});
