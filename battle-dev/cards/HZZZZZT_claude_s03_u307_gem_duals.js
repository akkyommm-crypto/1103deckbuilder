/* S03-U307: ジェムナイト・アイオーラ / ジェムナイト・アンバー — Gemini monsters on the U119 capability (defineGeminiS03, cards/HO). 2011 texts (project carddata).

   ジェムナイト・アイオーラ ●1ターンに1度、自分の墓地の「ジェム」と名のついたモンスター1体をゲームから除外して発動できる。
                            自分の墓地の「ジェムナイト」と名のついたカード1枚を選択して手札に加える。
   ジェムナイト・アンバー   ●1ターンに1度、手札から「ジェムナイト」と名のついたカード1枚を墓地へ送って発動できる。
                            ゲームから除外されている自分のモンスター1体を選択して手札に戻す。

   「ジェム」「ジェムナイト」と名のついた: the P4 authority groups GROUP.GEM (24 cards) / GROUP.GEMKNIGHT (17 cards), added in P4-v8 by passcode — never name matching
   at run time. The Gem-Knights contain 「ジェム」 in their names, so they are 「ジェム」 cards too (GEM ⊃ GEMKNIGHT); the setcode 0x100f is NOT used (it also tags
   ジェム・エンハンス / 輝石融合 / パーティカル・フュージョン, whose names do not contain ジェムナイト).

   Cost, then target (the engine's order for a script with `cost` and `selectTargets`): アイオーラ's cost card is a 「ジェム」 monster and the target is another card, so
   the activation needs a pair of two different cards (the same ジェムナイト monster cannot be both the cost and the target; after the cost is banished it is out of the
   Graveyard and cannot be chosen). アンバー's cost card leaves the hand, so its target pool (the banished zone) does not depend on the cost.
   Both effects target (「選択して」), so the target is chosen on activation and checked again at resolution (it must still be in the same zone). Adding to the hand
   from the Graveyard / the banished zone goes through API.returnToHand (a Graveyard lock such as ネクロバレー applies). */

function u307Gem(x){ return x && x.card && isCardInGroupV4(x.card, GROUP.GEM); }
function u307Knight(x){ return x && x.card && isCardInGroupV4(x.card, GROUP.GEMKNIGHT); }

/* ---- ジェムナイト・アイオーラ ---- */
function u307AioraCosts(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && u307Gem(x)); }
function u307AioraTargets(ctx){ return API.pileCards(ctx.player, 'grave', x=>u307Knight(x)); }
/* a cost card c is usable when some target t other than c remains in the Graveyard */
function u307AioraUsableCosts(ctx){
  const ts = u307AioraTargets(ctx);
  return u307AioraCosts(ctx).filter(c=>ts.some(t=>t.card!==c.card));
}
defineGeminiS03('ジェムナイト・アイオーラ', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(!u307AioraUsableCosts(ctx).length){ ctx.reason = '墓地に除外できる「ジェム」モンスターと、手札に加える別の「ジェムナイト」カードが必要です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ジェムナイト・アイオーラ：除外する墓地の「ジェム」モンスター', u307AioraUsableCosts(ctx), t=>{
      const r = t && resolveTarget(t);
      if(!r || r.p!==ctx.player || r.zone!=='grave'){ done(false); return; }
      const c = r.card;
      API.banish(r, 'ジェムナイト・アイオーラ（コスト）');
      const now = locateCardAnyV4(c);
      done(!!(now && now.zone==='banish'));
    });
  },
  selectTargets(ctx, done){ API.selectCard('ジェムナイト・アイオーラ：手札に加える墓地の「ジェムナイト」', u307AioraTargets(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.p!==ctx.player || r.zone!=='grave' || !isCardInGroupV4(r.card, GROUP.GEMKNIGHT)) return;
    API.returnToHand(r, 'ジェムナイト・アイオーラ');
  },
  afterResolve(){}
});

/* ---- ジェムナイト・アンバー ---- */
function u307AmberCosts(ctx){ return API.pileCards(ctx.player, 'hand', x=>u307Knight(x)); }
function u307AmberTargets(ctx){ return API.pileCards(ctx.player, 'banish', x=>x.db.k==='m'); }
defineGeminiS03('ジェムナイト・アンバー', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(!u307AmberCosts(ctx).length){ ctx.reason = '手札に「ジェムナイト」と名のついたカードがありません'; return false; }
    if(!u307AmberTargets(ctx).length){ ctx.reason = '除外されている自分のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('ジェムナイト・アンバー：墓地へ送る手札の「ジェムナイト」', u307AmberCosts(ctx), t=>{
      const r = t && resolveTarget(t);
      if(!r || r.p!==ctx.player || r.zone!=='hand'){ done(false); return; }
      const c = r.card;
      API.sendHandToGrave(ctx.player, r.index, 'ジェムナイト・アンバー（コスト）');
      const now = locateCardAnyV4(c);
      done(!!(now && now.zone==='grave'));
    });
  },
  selectTargets(ctx, done){ API.selectCard('ジェムナイト・アンバー：手札に戻す除外されている自分のモンスター', u307AmberTargets(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.p!==ctx.player || r.zone!=='banish' || dbOf(r.card).k!=='m') return;
    API.returnToHand(r, 'ジェムナイト・アンバー');
  },
  afterResolve(){}
});
