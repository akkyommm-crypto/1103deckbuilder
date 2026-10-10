/* =========================================================================
   S03-U160 — 「（このカードがフィールド上に表側表示で存在する限り、）相手は…を攻撃対象に選択できない」
   -------------------------------------------------------------------------
   A continuous declaration on the card: continuous.cannotBeAttackTarget(target, src) → true when the opponent of src's controller
   may not choose `target` as an attack target. Reach is continuous.scope (ownMonsters etc.), as for the other continuous keys.
   Checked where the attack target is decided: the target list (battleTargetsV29), the attack request, the replay pick — through
   forcedAttackTargetReasonS03 (engine/1ZR). A direct attack is not an attack target and is not affected.
   Cards: スカー・ウォリアー (other face-up Warriors). ========================================================================= */
/* S03-U264: attacker (optional) — continuous.cannotBeAttackedByS03(target, attacker, self) for restrictions that depend on the attacking monster
   (ヒーロー・ヘイロー 「相手の攻撃力1900以上のモンスターは、装備モンスターを攻撃する事ができない」); same reach and 「相手は」 rule as cannotBeAttackTarget. */
function attackTargetForbiddenReasonS03(attackingPlayer, target, attacker){
  if(!target || typeof continuousSources!=='function') return '';
  const loc = (typeof locateCard==='function') ? locateCard(target) : null;
  if(!loc || loc.zone!=='mz' || loc.p===attackingPlayer) return '';
  /* S03-U218: 「このターン、お互いは裏側表示モンスターを攻撃できない」 (陽動作戦) — a turn-stamped flag on either player (temporaryFlags) */
  if(target.face==='down' && gameState.players.some(P=>P && P.temporaryFlags && Number(P.temporaryFlags.noAttackFaceDownS03)===Number(gameState.turn)))
    return 'このターンは裏側表示モンスターを攻撃できません';
  let why = '';
  continuousSources().some(src=>{
    const cont = src.sc && src.sc.continuous;
    const f0 = cont && cont.cannotBeAttackTarget, fa = cont && cont.cannotBeAttackedByS03;
    if(typeof f0!=='function' && !(typeof fa==='function' && attacker)) return false;
    const f = typeof f0==='function' ? f0 : null;
    /* 「相手は」: only the source controller's opponent is restricted — unless the card declares cannotBeAttackTargetBothS03
       (S03-U253: 「お互いに…攻撃できない」, マシンナーズ・スナイパー) */
    if(src.p===attackingPlayer && !src.sc.continuous.cannotBeAttackTargetBothS03) return false;
    if(!continuousReaches(src.sc.continuous.scope||'self', src.p, loc, src.card, target)) return false;
    let hit = false; try{ hit = (!!f && !!f(target, src.card)) || (typeof fa==='function' && !!attacker && !!fa(target, attacker, src.card)); }catch(e){ hit = false; }
    if(hit) why = `「${cardName(src.card)}」の効果で「${cardName(target)}」は攻撃対象に選択できません`;
    return hit;
  });
  return why;
}
