/* S03-U73: トゥルース・リインフォース (Reinforce Truth), a x1+ TG Gadget major-deck Normal Trap classified
   PARTIAL under "AUTO_DECK_TABLE coarse implementation". Continues U72's priority #7 pass over the fixed
   lists' remaining PARTIAL AUTO_DECK_TABLE cards.
   Real text (Yugipedia, printed 2009-04-18 OCG, well within the 2011-08-31 cutoff — confirmed by real
   effect text already present in this project's own card database):
   "デッキからレベル2以下の戦士族モンスター1体を特殊召喚する。このカードを発動するターン、自分はバトル
   フェイズを行えない。" ("Special Summon 1 Level 2 or lower Warrior-Type monster from your Deck. You
   cannot conduct your Battle Phase the turn you activate this card.")
   Unlike U72's three Gadgets, this is a genuine functional gap, not just a missing-test classification: the
   pre-existing AUTO_DECK_TABLE entry ({op:"recruit",trig:"ignition",f:{lvmax:2,ra:"戦士",tk:"m"}}) correctly
   filters the Special Summon target (Level <=2, Warrior, monster) but the generic auto-interpreter has no way
   to express the card-specific "cannot conduct your Battle Phase this turn" restriction at all — no card in
   this codebase's history needed the auto-table to express a restriction clause, only a search/mill/recruit
   filter. This unit replaces it with a real, literal defineScript.
   The Special Summon target is a non-targeting Deck choice, so per this session's own established C-S03-26 /
   S03-U58 pattern (a non-targeting Deck-search/recruit choice is made at RESOLUTION time, not activation
   time), the choice is made via the existing registered s03u58.deck-special handler (precedent: ローンファ
   イア・ブロッサム / ワン・フォー・ワン, cards/00_generic_core.js) rather than selectTargets/targets:true.
   The Battle-Phase restriction reuses the existing, already-established temporaryFlags.noBattlePhase
   primitive (API.setFlag(player,'noBattlePhase',true,true)), set in cost() so it applies immediately upon
   activation regardless of whether the effect later resolves — matching this codebase's own precedent for
   the same real-rules shape (裁きの代行者 サターン, cards/36_1103_expansion_v340.js; エンシェント・フェアリー・
   ドラゴン, cards/47_v47_native.js — both "Condition"-type Battle-Phase locks tied to activation, not
   resolution). */
defineScript('トゥルース・リインフォース', {
  type:'trap', priority:2,
  condition(ctx){
    if(!API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && x.db.ra==='戦士' && (x.db.lv||99)<=2).length){
      ctx.reason = 'デッキにレベル2以下の戦士族モンスターがいません'; return false;
    }
    return true;
  },
  cost(ctx, done){
    API.setFlag(ctx.player, 'noBattlePhase', true, true);
    done(true);
  },
  resolve(ctx){
    const deck = API.pileCards(ctx.player,'deck',x=>x.db.k==='m' && x.db.ra==='戦士' && (x.db.lv||99)<=2);
    if(!deck.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'トゥルース・リインフォース：特殊召喚する戦士族',
      candidates:deck, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-special', args:{player:ctx.player, pos:'atk', reason:'トゥルース・リインフォース'}},
      meta:{scriptName:'トゥルース・リインフォース'}});
  },
  afterResolve(){}
});
