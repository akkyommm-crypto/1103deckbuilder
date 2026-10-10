/* =========================================================================
   S03-U150 — 「発動ターン相手は選択したモンスターしか攻撃対象にできず、全ての表側攻撃表示モンスターで選択したモンスターを
   攻撃しなければならない」 (立ちはだかる強敵)
   -------------------------------------------------------------------------
   立ちはだかる強敵 (TESTED) wrote BATTLE_GRANT_V6 'lock' (battlePermission.attackLockUid / attackLockTurn on the selected monster)
   and redirected the current attack, but nothing read the lock: the rest of the turn the opponent could attack any monster or
   attack directly, and nothing required its monsters to attack the selected one.
   ■ While a face-up monster in player X's Monster Zone carries the lock for this turn (battlePermission is zone-local: when the
     selected monster leaves the field the restriction ends), player Y (X's opponent):
     - may choose only that monster as an attack target (no other monster, no direct attack);
     - must attack it with every face-up Attack Position monster that can attack — the existing mustAttack rule
       (pendingMustAttack: the Battle Phase is not left without confirmation).
   ■ Wired into: the target list (battleTargetsV29), the attack request check and the replay pick (engine/30), mustAttackNow
     (engine/00). */
function forcedAttackTargetS03(attackingPlayer){
  if(typeof gameState==='undefined' || !gameState || (attackingPlayer!==0 && attackingPlayer!==1)) return null;
  const foe = attackingPlayer===0 ? 1 : 0;
  const mons = (gameState.players[foe].mz||[]).filter(Boolean);
  for(const c of mons){
    const perm = (typeof battlePermissionV6==='function') ? battlePermissionV6(c) : null;
    if(perm && perm.attackLockTurn===gameState.turn && perm.attackLockUid!=null && perm.attackLockUid===c.uid && c.face==='up') return c;
  }
  return null;
}
/* '' = this target is allowed; target = a card, or null for a direct attack */
function forcedAttackTargetReasonS03(attackingPlayer, target, attacker){
  /* S03-U160: continuous 「相手は…を攻撃対象に選択できない」 (engine/1ZU) — checked at the same three points; S03-U264: the attacker is passed on */
  if(target && typeof attackTargetForbiddenReasonS03==='function'){ const w = attackTargetForbiddenReasonS03(attackingPlayer, target, attacker||null); if(w) return w; }
  const f = forcedAttackTargetS03(attackingPlayer);
  if(!f) return '';
  if(target && target===f) return '';
  return `「${cardName(f)}」しか攻撃対象にできません（立ちはだかる強敵）`;
}
/* must this monster attack (the selected monster) now? */
function forcedAttackMustS03(card){
  if(!card || card.face!=='up' || card.pos!=='atk') return false;
  const h = (typeof locateCardAnyV4==='function') ? locateCardAnyV4(card) : null;
  if(!h || h.zone!=='mz' || h.p!==gameState.activePlayer) return false;
  return !!forcedAttackTargetS03(h.p);
}

/* S03-U150: who answers a legacy API.selectCard / selectPlayer / selectZone / confirm. requestChoiceV49 defaulted to the turn
   player, so an effect of the non-turn player (a Trap activated in the opponent's turn, its target chosen at activation or at
   resolution) was answered by its opponent. The chooser is now the effect's controller: the activating player during the
   activation preparation (ACTIVATION_PREP_S03), else the controller of the resolving effect (P3_EFFECT_CONTEXT, set for chain
   resolution and runScript). Outside an effect it stays undefined → the old default. */
function legacyChooserS03(){
  const prep = (typeof ACTIVE_SCRIPT!=='undefined' && !ACTIVE_SCRIPT && typeof ACTIVATION_PREP_S03!=='undefined') ? ACTIVATION_PREP_S03 : null;
  if(prep && (prep.player===0 || prep.player===1)) return prep.player;
  if(typeof P3_EFFECT_CONTEXT!=='undefined' && P3_EFFECT_CONTEXT && (P3_EFFECT_CONTEXT.player===0 || P3_EFFECT_CONTEXT.player===1)) return P3_EFFECT_CONTEXT.player;
  return undefined;
}
