/* S03-U81 — BF－孤高のシルバー・ウィンド (BF main deck, NOT_STARTED, no flagged engine gap).
   Priority #7 (continuing S03-U79/U80's cross-reference pass). Real text (this project's own card database,
   printed 2009-07-18, within cutoff), DARK Winged Beast Synchro Effect Monster, Level 8 ("BF" Tuner + 1 or
   more non-Tuner monsters):
   ①: when this card is Synchro Summoned, you can select up to 2 monsters on the field with DEF lower than
      this card's ATK and destroy them. The turn you activate this effect, you cannot conduct your Battle
      Phase.
   ②: once during the opponent's turn, as long as this card exists face-up on the field, your "BF"-named
      monsters are not destroyed by battle.

   ① reuses the shared s03SynchroSelf real-synchro-self-summon check (cards/H1_claude_s03_dragunity.js,
   already the established convention for "when this card is Synchro Summoned" triggers in this codebase),
   the shared v380SelectUpTo "select up to N" targeting helper (precedent: 氷帝メビウス,
   cards/39_1103_expansion_v380b.js — an identically-shaped monster-trigger "select up to 2, destroy" real
   card), and the established temporaryFlags.noBattlePhase primitive (precedent: 裁きの代行者 サターン／
   エンシェント・フェアリー・ドラゴン, S03-U73) for "cannot conduct your Battle Phase this turn."
   ② reuses System v21 destruction protection (engine/1K_destruction_protection_v21.js, sc.continuous.
   protectV21) — its perTurn limit already tracks "used N times this exact turn number", and since this
   protection is only offered when gameState.activePlayer is the OPPONENT, the counter naturally resets to 0
   the next time it becomes the opponent's turn again (a fresh turn number), giving exactly "once per
   opponent's turn" with no new engine primitive needed. */

function u81SilverwindHosts(atkThreshold){
  return API.fieldCards({zone:'mz',filter:x=>curDEF(x.card)<atkThreshold});
}
defineScript('BF－孤高のシルバー・ウィンド', {
  type:'synchro', priority:1, targets:true,
  condition(ctx){
    if(!s03SynchroSelf(ctx)){ ctx.reason='このカードがシンクロ召喚に成功した場合に発動します'; return false; }
    if(!u81SilverwindHosts(curATK(ctx.card)).length){ ctx.reason='攻撃力より低い守備力を持つモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx,done){
    v380SelectUpTo('BF－孤高のシルバー・ウィンド：破壊するモンスター',u81SilverwindHosts(curATK(ctx.card)),2,done);
  },
  resolve(ctx){
    const targets=(ctx.selectedTargets||[]).map(t=>resolveTarget(t)).filter(Boolean);
    if(!targets.length) return;
    targets.forEach(r=>API.destroy(r,'BF－孤高のシルバー・ウィンド'));
    API.setFlag(ctx.player,'noBattlePhase',true,true);
  },
  afterResolve(){},
  passive:{onSpecialSummon(ctx){return s03SynchroSelf(ctx)&&u81SilverwindHosts(curATK(ctx.card)).length>0;}},
  continuous:{scope:'ownMonsters',from:['mz'],apply(){return null;},
    protectV21:{
      battle(target,srcCard){
        if(!isSetCardV4(dbOf(target),SETCODE.BLACKWING)) return false;
        const loc=locateCardAnyV4(srcCard);
        return !!(loc && gameState.activePlayer!==loc.p);
      },
      perTurn:1, perTurnScope:'source', label:'BF－孤高のシルバー・ウィンド'
    }}
});
