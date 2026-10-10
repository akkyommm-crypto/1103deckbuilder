/* =========================================================================
   S03-U139 — 「このカードがフィールド上に表側表示で存在する限り、お互いにシンクロ召喚をする事ができない」
   -------------------------------------------------------------------------
   天刑王 ブラック・ハイランダー. A lock on the Synchro Summon itself, not on Special Summoning Synchro Monsters: 死者蘇生 of a
   Synchro Monster stays legal. Checked where a Synchro Summon starts: the Extra Deck sheet (engine/20), beginExSummonV2
   (cards/40) and the effect-Synchro options (engine/1ZJ).
   A card declares it with declareSynchroSummonLockS03(name); it applies while that card is face-up on the field and its
   effects are not negated.
   ========================================================================= */
const SYNCHRO_SUMMON_LOCK_S03 = {};
function declareSynchroSummonLockS03(name){ SYNCHRO_SUMMON_LOCK_S03[name] = true; }
function synchroSummonLockReasonS03(p){
  if(typeof gameState === 'undefined' || !gameState || !gameState.players) return '';
  for(const P of gameState.players){
    for(const c of (P.mz || [])){
      if(!c || c.face !== 'up') continue;
      const n = dbOf(c).n;
      if(!SYNCHRO_SUMMON_LOCK_S03[n]) continue;
      if(typeof effectNegated === 'function' && effectNegated(c)) continue;
      return `「${n}」が表側表示で存在するため、シンクロ召喚できません`;
    }
  }
  return '';
}
