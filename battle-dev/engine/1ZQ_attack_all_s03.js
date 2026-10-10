/* =========================================================================
   S03-U149 — 「相手フィールド上の全てのモンスターに1回ずつ攻撃できる」
   -------------------------------------------------------------------------
   Before this unit the ability was a forced trigger at the start of the Battle Phase (cards/91 v6DefineMultiAttacker:
   ジュラック・モノロフ, 神機王ウル) that wrote BATTLE_GRANT_V6 'multi' (battlePermission.multiAttackTurn). Nothing read that
   permission: attackLimitV48 stayed 1, so after its first attack the monster could not attack again. The grant also went
   through the chain as an activated effect although the ability is continuous. Their test only checked the flag.
   ■ Rule (continuous, while the card is face-up in the Monster Zone and its script declares attackAllMonstersS03 — true or
     a function(card) — or it has the old 'multi' grant this turn):
     - it may declare an attack against each opponent monster it has not attacked this turn;
     - a direct attack follows the normal rule (only with no opponent monster) and only as its first attack of the turn;
     - after it has attacked it cannot attack directly, and a monster it already attacked this turn cannot be attacked again.
   ■ Record: card.attackAllS03 = {turn, uids:[target uid | 'direct' ...]} is written by the reducers (ATTACK_DECLARE_V48,
     ATTACK_PENDING_RETARGET_S03) only for such cards — the Journal of every other attack is unchanged. Zone-local.
   ■ Wired into: canDeclareAttackV48 (engine/00), the attack request check and the target list (engine/30). */
function attackAllActiveS03(card){
  if(!card || card.face!=='up') return false;
  const h = (typeof locateCardAnyV4==='function') ? locateCardAnyV4(card) : null;
  if(!h || h.zone!=='mz') return false;
  if(typeof effectNegated==='function' && effectNegated(card)) return false;
  const sc = (typeof CARD_SCRIPTS!=='undefined') ? CARD_SCRIPTS[cardName(card)] : null;
  const rule = sc && sc.attackAllMonstersS03;
  let on = false;
  try{ on = (typeof rule==='function') ? !!rule(card, h) : !!rule; }catch(e){ on = false; }
  if(!on && typeof grantedMultiAttackV6==='function') on = grantedMultiAttackV6(card, gameState);
  return on;
}
function attackAllRecordS03(card, gs){
  gs = gs || gameState;
  const r = card && card.attackAllS03;
  return (r && r.turn===gs.turn && Array.isArray(r.uids)) ? r.uids : [];
}
/* reducer helper: note one more attack target (a uid or 'direct') for an attack-all card */
function noteAttackAllTargetS03(gs, card, target){
  if(!card) return;
  const prev = (card.attackAllS03 && card.attackAllS03.turn===gs.turn) ? card.attackAllS03.uids.slice() : [];
  prev.push(target==null ? 'direct' : target);
  card.attackAllS03 = {turn:gs.turn, uids:prev};
}
/* may this attack-all card declare an attack now? (null = the card is not attack-all: use the normal rule) */
function attackAllCanDeclareS03(card){
  if(!attackAllActiveS03(card)) return null;
  const h = locateCardAnyV4(card); if(!h) return false;
  const foe = h.p===0 ? 1 : 0;
  const done = attackAllRecordS03(card);
  const mons = (gameState.players[foe].mz||[]).filter(Boolean);
  if(!mons.length) return done.length===0;
  return mons.some(c=>done.indexOf(c.uid)<0);
}
/* is this target legal for an attack-all card? target: a card, or null for a direct attack ('' = legal) */
function attackAllTargetReasonS03(card, target){
  if(!attackAllActiveS03(card)) return '';
  const done = attackAllRecordS03(card);
  if(target==null) return done.length ? 'このターン既に攻撃しているため直接攻撃できません' : '';
  ensureCardUid(gameState, target);
  return done.indexOf(target.uid)>=0 ? 'このモンスターにはこのターン既に攻撃しています' : '';
}
