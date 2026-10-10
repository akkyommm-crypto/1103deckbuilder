/* S03-U72: literal defineScript replacements for the three original Gadget monsters
   (グリーン・ガジェット／レッド・ガジェット／イエロー・ガジェット), all x1+ in the TG Gadget major deck.
   Real text (Yugipedia / db.yugioh-card.com, all printed well before the 2011-08-31 cutoff):
   "When this card is Normal Summoned or Special Summoned, you can add 1 [color] Gadget from your Deck to
   your hand." Green -> Red, Red -> Yellow, Yellow -> Green (a 3-way cycle).
   The pre-existing AUTO_DECK_TABLE entries in cards/40_auto_interpreter.js already reproduced this exactly
   (correct cardCode cross-references, both onNormalSummon/onSpecialSummon wired, optional, real
   API.searchDeck) — no functional gap was found. Coverage classifies any AUTO_DECK_TABLE-sourced card as
   PARTIAL unconditionally, regardless of test coverage (script_coverage.py's `elif auto: status='PARTIAL'`
   branch never considers `tests`), so promoting to TESTED requires a real literal registration here — a
   later defineScript call always overwrites the table's own CARD_SCRIPTS entry (defineScript has no
   self-guard), matching the established precedent from every other AUTO_DECK_TABLE replacement this
   session (e.g. U68's 魔力掌握). This file reproduces the exact same, already-correct behavior as a real,
   dedicated registration so it can be exercised and promoted by a real DUEL-path test
   (tools/test_s03_u72_gadget_search_cycle.js). */
function s03u72GadgetSearch(name, targetName){
  defineScript(name, {
    type:'monster', priority:1, timing:['summon'], blocksIfNoDeckToHand:true, // S03-U72: ライオウ適用中は発動できない
    condition(ctx){
      if(!API.pileCards(ctx.player,'deck',x=>x.db.n===targetName).length){
        ctx.reason = `デッキに「${targetName}」がありません`; return false;
      }
      return true;
    },
    selectTargets(ctx, done){
      API.selectCard(`${name}：手札に加える「${targetName}」`,
        API.pileCards(ctx.player,'deck',x=>x.db.n===targetName), t=>done([t]));
    },
    resolve(ctx){
      const t = ctx.selectedTargets[0];
      if(!t){ API.log('デッキに候補がないため不発'); return; }
      API.searchDeck(ctx.player, t.index, name);
    },
    afterResolve(){},
    passive:{
      onNormalSummon(ctx){ return ctx.zone!=='deck'; },
      onSpecialSummon(ctx){ return ctx.zone!=='deck'; }
    }
  });
}
s03u72GadgetSearch('グリーン・ガジェット','レッド・ガジェット');
s03u72GadgetSearch('レッド・ガジェット','イエロー・ガジェット');
s03u72GadgetSearch('イエロー・ガジェット','グリーン・ガジェット');
