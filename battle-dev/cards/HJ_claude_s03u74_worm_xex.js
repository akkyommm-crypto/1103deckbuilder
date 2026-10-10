/* S03-U74: ワーム・ゼクス (Worm Xex), a x1+ Worm major-deck monster classified PARTIAL under
   "AUTO_DECK_TABLE coarse implementation". Continues U72/U73's priority #7 pass over the fixed lists'
   remaining PARTIAL AUTO_DECK_TABLE cards.
   Real text (Yugipedia, printed well before the 2011-08-31 cutoff): "When this card is Normal Summoned, you
   can send 1 Reptile-type 'Worm' monster from your Deck to the Graveyard. If you control a face-up 'Worm
   Yagan', this card cannot be destroyed by battle."
   Two real functional gaps the pre-existing AUTO_DECK_TABLE entry
   ({op:"mill",trig:"summon",f:{ra:"爬虫類",group:GROUP.WORM,tk:"m"}}) could not express:
   1. `f.group` is dead metadata — autoDeckMatches() (cards/40_auto_interpreter.js) never actually consumes
      `f.group`, only `f.ra`/`f.tk`/`f.arch`/etc. So the table's real filter was only "Reptile-type monster",
      NOT "Reptile-type Worm monster" as the real text requires — it would have incorrectly allowed milling
      any Reptile in the deck, Worm-archetype or not. Fixed here via the same archetype-name-substring idiom
      already established this session (String(db.n||'').indexOf('ワーム')>=0, precedent: カラクリ小町 弐弐四).
   2. `trig:"summon"` unconditionally wires BOTH onNormalSummon and onSpecialSummon (defineAutoDeckScript,
      same file) — but the real text is "When this card is Normal Summoned" only, not Special Summoned. The
      table version would have incorrectly offered the mill after a Special Summon too.
   3. The table has no way to express a standalone restriction/continuous clause at all (same class of gap as
      U73's Battle-Phase lock): the real "cannot be destroyed by battle while you control a face-up Worm
      Yagan" continuous battle-proof clause is entirely missing from the table version.
   Fix reuses two already-established primitives: the non-targeting Deck-mill choice resolves at resolution
   time via the existing s03u58.deck-mill handler (precedent: おろかな埋葬／終末の騎士／ダーク・グレファー,
   cards/00_generic_core.js — matching the established C-S03-26/S03-U58 rule), and continuous.battleProof(card)
   (precedent: カラクリ守衛 参壱参, S03-U71) checks for a real face-up ワーム・ヤガン by name — this only
   checks its physical field presence/face state, not any of ワーム・ヤガン's own effects (still NOT_STARTED,
   deferred — see S03-U71's report), so this card's own correctness does not depend on that one being
   implemented. */
defineScript('ワーム・ゼクス', {
  type:'monster', priority:1,
  condition(ctx){
    if(!API.pileCards(ctx.player,'deck',
        x=>x.db.k==='m' && x.db.ra==='爬虫類' && String(x.db.n||'').indexOf('ワーム')>=0).length){
      ctx.reason = 'デッキに「ワーム」と名のついた爬虫類モンスターがいません'; return false;
    }
    return true;
  },
  resolve(ctx){
    const deck = API.pileCards(ctx.player,'deck',
      x=>x.db.k==='m' && x.db.ra==='爬虫類' && String(x.db.n||'').indexOf('ワーム')>=0);
    if(!deck.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'ワーム・ゼクス：墓地へ送る「ワーム」モンスター',
      candidates:deck, min:1, max:1, cancelable:false,
      resume:{handler:'s03u58.deck-mill', args:{player:ctx.player, reason:'ワーム・ゼクス'}},
      meta:{scriptName:'ワーム・ゼクス'}});
  },
  afterResolve(){},
  continuous:{
    scope:'self', from:['mz'],
    apply(){ return null; },
    battleProof(card){
      const loc = locateCardAnyV4(card);
      if(!loc) return false;
      return API.fieldCards({player:loc.p, zone:'mz',
        filter:x=>x.card.face==='up' && x.db.n==='ワーム・ヤガン'}).length>0;
    }
  },
  passive:{
    onNormalSummon(ctx){ return ctx.event && ctx.event.card===ctx.card; }
  }
});
