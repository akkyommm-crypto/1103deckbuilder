/* =========================================================================
   S03-U383 — 「このカードが相手のコントロールするカードの効果の対象になり、その処理を行う時にサイコロを1回振る。
              X が出た場合、その効果を無効にし破壊する。」 (the 2003 「デーモン」 monsters)
   -------------------------------------------------------------------------
   Seven cards share the clause; only the faces and the protected monsters differ. The roll belongs to the PROCESSING of the effect,
   so it is made when the chain link is about to resolve (SOLVE_CHAIN, right before CHAIN_RESOLVE_TOP), not when it is added:
   the demon may have left the field in the meantime, and then there is no roll. A die is rolled for each protected target of the link
   that is a face-up monster controlled by the OTHER player than the link's controller; on a listed face the link is negated as an
   effect (mode 'effect') and its source card is destroyed (negateChainLinkV13 … destroySource), and no further die is rolled.
   ■ Card side:  declareDiceDemonS03(name, {faces:[1,3,6], scope:'self'|'demons'})
        scope 'self'   — the monster itself (default)
        scope 'demons' — every face-up monster of its controller whose name contains 「デーモン」 (ダークビショップデーモン)
   ■ The die: duelRandomInt(6) + 1 (the replay RNG, engine/06). Nothing is added to the state except the RNG and the negation Action.
   ========================================================================= */
const DICE_DEMON_S03 = {};
function declareDiceDemonS03(name, spec){ DICE_DEMON_S03[name] = Object.assign({faces:[], scope:'self'}, spec || {}); }
function diceDemonProtectsS03(srcHandle, targetHandle){
  /* does the face-up monster srcHandle protect targetHandle with its dice clause? */
  if(!srcHandle || !targetHandle || srcHandle.zone !== 'mz' || srcHandle.card.face !== 'up') return null;
  const spec = DICE_DEMON_S03[dbOf(srcHandle.card).n]; if(!spec) return null;
  if(typeof effectNegated === 'function' && effectNegated(srcHandle.card)) return null;
  if(spec.scope === 'demons'){
    if(targetHandle.p !== srcHandle.p) return null;
    if(String(dbOf(targetHandle.card).n || '').indexOf('デーモン') < 0) return null;
    return spec;
  }
  return srcHandle.card === targetHandle.card ? spec : null;
}
function applyDiceDemonResolveS03(link){
  if(!link || link.negated || link.chainId == null || !link.targets) return false;
  const restored = (typeof deserializeChainSelectionV2 === 'function') ? deserializeChainSelectionV2(link.targets) : [];
  const list = [].concat(...(Array.isArray(restored) ? restored : [restored]).filter(Boolean).map(x=>(x && !x.card && x.t && x.t.card) ? [x.t] : [x]));
  for(const t of list){
    const th = (t && t.card) ? locateCardAnyV4(t.card) : null;
    if(!th || th.zone !== 'mz' || !th.card || th.card.face !== 'up') continue;
    if(th.p === link.player) continue;   /* 「相手のコントロールするカードの効果」 */
    let spec = null, src = null;
    for(let p = 0; p < 2 && !spec; p++){
      (gameState.players[p].mz || []).forEach(c=>{
        if(spec || !c || c.face !== 'up') return;
        const sh = locateCardAnyV4(c); const s = diceDemonProtectsS03(sh, th);
        if(s){ spec = s; src = sh; }
      });
    }
    if(!spec) continue;
    const roll = duelRandomInt(6) + 1;
    API.log(`${cardName(src.card)}：サイコロ ${roll}`);
    if(spec.faces.indexOf(roll) >= 0){
      if(negateChainLinkV13(link.chainId, 'effect', cardName(src.card), true)) return true;
    }
  }
  return false;
}
