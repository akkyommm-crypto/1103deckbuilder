/* S03-U59 未来融合－フューチャー・フュージョン (CARD_WORK)
   Requirement: known real-duel unsupported gap on Astra's fixed lists (only tolerated gap in
   data/r1_lists/known_gaps_v1.json), the mill engine for 【Dragunity】's F・G・D line
   (design consult logs/S03_DESIGN_CONSULT_FUTURE_FUSION_TIMING.md, left open by a previous writer).

   2011-era (pre-errata) text used here is data/carddata.json's own `e0` field for this card,
   independently confirmed against a live fetch of the card's yugioh-wiki.net page
   (《未来融合－フューチャー・フュージョン》, fetched 2026-09-17):
     "自分のエクストラデッキの融合モンスター１体をお互いに確認し、決められた融合素材モンスターを
      自分のデッキから墓地へ送る。発動後２回目の自分のスタンバイフェイズ時に、確認した融合モンスター
      １体を融合召喚扱いとしてエクストラデッキから特殊召喚する。このカードがフィールド上から離れた時、
      そのモンスターを破壊する。そのモンスターが破壊される時にこのカードを破壊する。"
   The wiki page states explicitly (own commentary, not scripting text): the card was errata'd, with the
   boundary FAQ note "日付がない、または2016年12月17日以前の日付の文章はエラッタ前の時のものである" —
   so every FAQ entry used below is dated <= 2011-08-31 and therefore pre-errata / in our 1103 window:
     - reveal + send-materials happens on THIS card's own activation resolution, immediately, in one step
       (NOT split into a later "1st Standby Phase" trigger — that split is the errata, confirmed by the
       page's own note "旧テキスト時代は、カードの発動の効果処理時に即座に融合素材を墓地へ送っていた");
     - the (2)-equivalent Special Summon at the 2nd own Standby Phase creates NO chain block in this era
       (page note: "現在の(2)に相当する効果はチェーンブロックを作らない裁定であった") -> implemented as a
       plain System v7 scheduled action, not a chain-linked effect;
     - activation is legal even with an empty Extra Deck or a full Monster Zone (FAQ 11/06/08, in-window;
       the 0-Extra-Deck case is the same "always legal, may fizzle" shape, just cited post-window) ->
       condition() never gates on resolution outcome;
     - materials are sent as "the card's effect", not a cost -> if the chain link is negated the whole
       thing simply never resolves (generic chain-negation, nothing card-specific needed).
   F・G・D (data/carddata.json, TESTED) is the target used by the fixed Dragunity list: material line
   "ドラゴン族モンスター×5" already parses through the existing generic material-spec engine
   (engine/20_effect_primitives_ex.js parseMaterialSpec/findMaterialCombos), so the player gets a real
   material choice here (5 of however many Dragon-type monsters are in the Deck) rather than an
   arbitrary auto-pick.

   Reused, not reinvented (per the design consult's own inventory):
     - engine/20_effect_primitives_ex.js parseMaterialSpec / findMaterialCombos / slotMatches (material
       matching, generalized here to Deck candidates instead of the Field);
     - engine/16_scheduler_v7.js API.schedule(at:'standbyPhase', turns:...) (turn-spanning delay;
       turnsUntilOwnTurnV7 + 2 lands on the SECOND own Standby Phase, journaled in gs.scheduledV7 so
       Replay / Undo / Redo / SaveLoad already reproduce it with no new state shape);
     - engine/40_legal_script_engine.js API.linkMutual (System v9) for the two-way "card leaves ->
       destroy monster / monster destroyed -> destroy card" link, set up only once the Special Summon
       actually happens;
     - the U58 resolution-time Deck-choice pattern (API.requestChoice + named resume handler) for both
       the "which Extra Deck monster" and "which N Deck monsters" choices, so the choices are SaveLoad-safe
       the same way 増援/テラ・フォーミング/おろかな埋葬 already are;
     - API.specialSummon's existing generic v46 special-summon-restriction / Monster-Zone-space checks
       for the delayed Special Summon (no new negation-of-special-summon logic needed).
   Not scripted (out of scope for this unit, recorded as remaining):
     - the multi-slot named-material branch (e.g. "A＋B") auto-picks the first valid combo instead of
       asking, matching the existing ミラクル・フュージョン/超融合 precedent -- no card in the fixed
       lists needs this branch today;
     - F・G・D's own "このカードは融合召喚でしか特殊召喚できない" restriction is not engine-enforced
       generically (pre-existing gap, shared with Miracle Fusion/Super Polymerization; harmless here since
       nothing else currently tries to Special Summon F・G・D outside this card's own Fusion-Summon path);
     - 神の警告 vs the 2nd-Standby-Phase Special Summon (no chain block in this era, so it is not
       targetable in the first place) and 群雄割拠/虚無魔人-style interactions at the 2nd Standby Phase
       are not scripted beyond what API.specialSummon's generic restriction check already covers. */

/* ---- 融合素材候補（デッキ）から、EXデッキの1体分の融合素材条件を判定する ----
   単一スロット（例: F・G・Dの「ドラゴン族モンスター×5」）なら、実戦的な素材選択のため
   条件を満たす候補をすべて集めてプレイヤーに選ばせる。複数スロット（名指しA＋B等）は
   findMaterialCombos で組み合わせを列挙し、既存カード群と同じく先頭の組を自動採用する。 */
function u59FutureFusionBuildOption(p, exCard, db){
  if(!(db.st||[]).includes('融合')) return null;
  const spec = (typeof parseMaterialSpec === 'function') ? parseMaterialSpec(db) : null;
  if(!spec || spec.permissive || !spec.slots || !spec.slots.length) return null;
  const deckPool = API.pileCards(p, 'deck', x => x.db.k === 'm');
  if(spec.slots.length === 1){
    const q = spec.slots[0];
    const qualifying = deckPool.filter(x => slotMatches(x.db, q, curLV(x.card), x.card));
    if(qualifying.length < q.count.min) return null;
    return {c: exCard, db, q, qualifying};
  }
  const matPool = deckPool.map(x => ({i: x.index, c: x.card, db: x.db, lv: curLV(x.card)}));
  const combos = findMaterialCombos(matPool, spec, null, 3);
  if(!combos.length) return null;
  return {c: exCard, db, combo: combos[0]};
}
function u59FutureFusionOptions(p){
  const out = [];
  (gameState.players[p].ex || []).forEach(c => {
    const o = u59FutureFusionBuildOption(p, c, dbOf(c));
    if(o) out.push(o);
  });
  return out;
}
function u59FutureFusionScheduleSummon(p, sourceCard, targetName){
  API.log(`未来融合－フューチャー・フュージョン：発動後2回目の自分スタンバイフェイズに「${targetName}」を融合召喚する予定`);
  API.schedule({at: 'standbyPhase', turns: turnsUntilOwnTurnV7(gameState, p) + 2, player: p,
    handler: 's03u59.future-fusion-summon', args: {uid: sourceCard.uid, targetName}});
}
function u59FutureFusionCommitCombo(p, sourceCard, o){
  o.combo.forEach(m => {
    const idx = gameState.players[p].deck.indexOf(m.c);
    if(idx >= 0) API.mill(p, idx, '未来融合－フューチャー・フュージョン');
  });
  u59FutureFusionScheduleSummon(p, sourceCard, o.db.n);
}
function u59FutureFusionProceed(p, sourceCard, o){
  API.log(`未来融合－フューチャー・フュージョン：${o.db.n} をお互いに確認`);
  if(o.qualifying){
    API.requestChoice({player: p, kind: 'card',
      title: `未来融合－フューチャー・フュージョン：${o.db.n} の融合素材としてデッキから墓地へ送るモンスター（${o.q.count.min}体）`,
      candidates: o.qualifying, min: o.q.count.min, max: o.q.count.min, cancelable: false,
      resume: {handler: 's03u59.future-fusion-materials', args: {player: p, sourceUid: sourceCard.uid, targetName: o.db.n}},
      meta: {scriptName: '未来融合－フューチャー・フュージョン'}});
    return;
  }
  u59FutureFusionCommitCombo(p, sourceCard, o);
}

API.registerChoiceHandler('s03u59.future-fusion-confirm', (answer, args) => {
  const picks = (typeof v49P1ChoiceCards === 'function') ? v49P1ChoiceCards(answer) : [];
  const exCard = picks[0] && picks[0].card;
  if(!exCard) return;
  const src = (args.sourceUid != null) ? findCardByUid(args.sourceUid) : null;
  if(!src || !src.card || src.zone !== 'sz') return;
  const p = args.player;
  const o = u59FutureFusionBuildOption(p, exCard, dbOf(exCard));
  if(!o) return;
  u59FutureFusionProceed(p, src.card, o);
});
API.registerChoiceHandler('s03u59.future-fusion-materials', (answer, args) => {
  const p = args.player;
  const picks = (typeof v49P1ChoiceCards === 'function') ? v49P1ChoiceCards(answer) : [];
  picks.forEach(x => {
    const h = (x.card && x.card.uid != null) ? findCardByUid(x.card.uid) : null;
    if(h && h.p === p && h.zone === 'deck') API.mill(p, h.index, '未来融合－フューチャー・フュージョン');
  });
  const src = (args.sourceUid != null) ? findCardByUid(args.sourceUid) : null;
  if(src && src.card && src.zone === 'sz') u59FutureFusionScheduleSummon(p, src.card, args.targetName);
});
API.registerScheduleHandler('s03u59.future-fusion-summon', (args) => {
  const h = (args.uid != null) ? findCardByUid(args.uid) : null;
  /* 旧テキスト時代の裁定: このカードがフィールドから離れていれば特殊召喚は起こらない（チェーンブロックなし）。 */
  if(!h || h.zone !== 'sz') return;
  const targetName = args.targetName;
  if(!targetName) return;
  const p = h.p, P = gameState.players[p];
  const exIdx = (P.ex || []).findIndex(c => cardName(c) === targetName);
  if(exIdx < 0){
    API.log(`未来融合－フューチャー・フュージョン：同名の「${targetName}」がエクストラデッキに存在しないため特殊召喚できません`);
    return;
  }
  const before = P.ex[exIdx];
  /* S03-U142: the player chooses face-up ATK or DEF for this Fusion Summon (it was always ATK). The summon happens when the
     choice is answered; the source card and the Fusion Monster are checked again then. */
  ensureCardUid(gameState, before);
  API.requestChoice({player:p, kind:'declare', title:`未来融合－フューチャー・フュージョン：${targetName} の表示形式`,
    candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}],
    min:1, max:1, cancelable:false, resume:{handler:'s03u142.future-fusion-pos', args:{sourceUid:h.card.uid, exUid:before.uid, player:p}},
    meta:{scriptName:'未来融合－フューチャー・フュージョン'}});
});
API.registerChoiceHandler('s03u142.future-fusion-pos', (answer, args) => {
  const c = answer && answer.cards && answer.cards[0];
  const pos = (c && c.value)==='def' ? 'def' : 'atk';
  const h = (args.sourceUid != null) ? findCardByUid(args.sourceUid) : null;
  if(!h || h.zone !== 'sz') return;
  const ex = (args.exUid != null) ? findCardByUid(args.exUid) : null;
  if(!ex || ex.zone !== 'ex' || ex.p !== args.player) return;
  const before = ex.card;
  const ok = API.specialSummon(args.player, 'ex', ex.index, pos, '未来融合－フューチャー・フュージョン', null, {summonKind: 'fusion'});
  if(ok) API.linkMutual({card: h.card}, {card: before}, {label: '未来融合－フューチャー・フュージョン'});
});

defineScript('未来融合－フューチャー・フュージョン', {
  type: 'spell', priority: 1,
  condition(ctx){
    /* このカードは発動（手札／セットからの発動）でしか効果を処理しない。一度解決して永続魔法として
       場に残っている間は再発動できる効果を持たない — getLegalZoneActions は resolve() を持つ
       表側カードを「⚡ 効果を発動」として無条件に提示するため、ここで明示的に塞ぐ
       （real-duel probe, R1 seed 0x59310001 first 1, turn 8: 場の未来融合が duelActivateFromZone 経由で
       二重に発動できてしまい、素材を二重送りしかねなかった）。
       手札からの発動判定・場での再発動判定はどちらも zone='sz'・eventName='legalCheck' で来るため
       区別できない（activationPending も発動前後どちらも false）。解決済みかどうかは resolve() が
       自分で立てるフラグでだけ判定する。 */
    if(ctx.card && ctx.card.u59FutureFusionResolved) return false;
    return true;   /* 2011 FAQ 11/06/08: モンスターゾーンに空きがなくても発動できる */
  },
  resolve(ctx){
    API.setCardFlag({card: ctx.card}, 'u59FutureFusionResolved', true, '未来融合－フューチャー・フュージョン', {silent: true});
    const p = ctx.player;
    const opts = u59FutureFusionOptions(p);
    if(!opts.length){
      API.log('未来融合－フューチャー・フュージョン：条件を満たす融合モンスターがないため効果は不発');
      return;
    }
    if(opts.length === 1){ u59FutureFusionProceed(p, ctx.card, opts[0]); return; }
    API.requestChoice({player: p, kind: 'card', title: '未来融合－フューチャー・フュージョン：お互いに確認する融合モンスター',
      candidates: opts.map(o => ({card: o.c, db: o.db})), min: 1, max: 1, cancelable: false,
      resume: {handler: 's03u59.future-fusion-confirm', args: {player: p, sourceUid: ctx.card.uid}},
      meta: {scriptName: '未来融合－フューチャー・フュージョン'}});
  }
});
