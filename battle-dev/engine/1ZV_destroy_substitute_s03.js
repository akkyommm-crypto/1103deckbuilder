/* =========================================================================
   S03-U173 — optional destruction substitutes (「破壊される場合、代わりに〜できる」)
   -------------------------------------------------------------------------
   User decision (2026-09-26): at the destruction, pause and let the protected card's controller choose.
   - A card script declares the substitute:
       destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter(card)}   another own face-up monster
       destroySubstituteS03:{kind:'detach',     causes:['battle','effect']}                 one of its own Xyz materials
     The protected card must be face-up in a Monster Zone and its effects must not be negated.
   - Effect destruction (API.destroy / API.destroyAll while a chain link resolves in DUEL): when a protected card with a usable
     substitute would be destroyed, the destruction is not performed yet. It and every destruction after it in the same resolution
     are collected (DESTROY_SUB_BATCH_S03, live only) and flushed when the resolution returns (processSolveChainV27) or when the
     resolution's own choice has been answered (resumeAfterResolutionChoiceS03). Nothing moves until every decision is made.
   - Battle destruction: the damage step cleanup stage waits before BATTLE_CLEANUP.
   - Simultaneous destruction: the candidates are computed once from the board before anything moves; every card being destroyed in
     the same event is excluded, and a card chosen as one substitute cannot be chosen again for another.
   - Decision: one journaled registry choice per protected card (handler 's03u173.destroy-sub', JSON job in resume.args), not
     cancelable (closing the sheet or tapping outside never declines). 「身代わりを使う：…」 per candidate + 「使わずに破壊する」,
     asked even when there is only one candidate. Save / resume: the job is in the choice; the processor wait is rebuilt on load.
     Replay: the answer and every resulting move are Actions.
   - The substitute destruction is an effect destruction by the protected card's controller (source = the protected card) and is
     not itself substitutable (2011 rulings; YGOPro REASON_REPLACE).
   Limits (documented): destructions performed by a script's raw act() (not API.destroy / destroyAll), destruction as a cost and
   destruction outside a chain link resolution are not intercepted; a script step that inspects the destroyed card right after
   API.destroy in the same resolution sees the pre-decision board — S03-U294: such steps use API.afterDestroyS03 (engine/1ZZO), which runs after the decisions.
   ========================================================================= */
const DESTROY_SUB_HANDLER_S03 = 's03u173.destroy-sub';
let DESTROY_SUB_BATCH_S03 = null;

function destroySubDeclS03(card){
  if(!card || typeof CARD_SCRIPTS==='undefined') return null;
  const sc = CARD_SCRIPTS[cardName(card)];
  if(sc && sc.destroySubstituteS03) return sc.destroySubstituteS03;
  /* S03-U240: 「宝玉獣」 — destroyed in the Monster Zone → placed as a Continuous Spell instead of the GY (engine/1ZZH) */
  if(sc && sc.crystalPlaceS03) return {kind:'placeSpell', causes:['battle','effect'], faceUpOnly:!!sc.crystalPlaceS03.faceUpOnly};
  /* S03-U268: 「モンスターカードゾーン上で破壊された場合、墓地へ送らずに装備カード扱いとして自分フィールド上の…モンスター1体に装備できる」
     (ドラグニティ－ジャベリン) — script equipInsteadS03:{hostFilter(host)} */
  if(sc && sc.equipInsteadS03) return {kind:'equipInstead', causes:['battle','effect'], hostFilter:sc.equipInsteadS03.hostFilter};
  return null;
}

/* The substitutes usable now by `card` (controlled by p) against a destruction of `cause`, excluding the uids in `excl`. */
function destroySubOptionsS03(gs, card, p, cause, excl){
  gs = gs || gameState; excl = excl || [];
  const decl = destroySubDeclS03(card);
  /* S03-U240: the placement is not a substitute — the card itself is destroyed; only its destination changes. The texts without
     「表側表示の」 also apply to a face-down card (it is the card's own replacement, not a continuous effect of a face-up card). */
  if(decl && card && decl.kind==='placeSpell'){
    if(Array.isArray(decl.causes) && decl.causes.indexOf(cause)<0) return [];
    if(decl.faceUpOnly && card.face!=='up') return [];
    const locP = (card.uid!=null && typeof findCardByUidInState==='function') ? findCardByUidInState(gs, card.uid) : null;
    if(!locP || locP.zone!=='mz') return [];
    if(card.face==='up' && typeof effectNegated==='function' && effectNegated(card)) return [];
    const owner = (card.owner===0||card.owner===1) ? card.owner : p;
    if(typeof stZoneFreeS03==='function' && !stZoneFreeS03(gs, owner)) return [];
    return [{kind:'placeSpell', uid:card.uid, name:cardName(card)}];
  }
  /* S03-U268: equip instead of the GY — the card itself is still destroyed; one option per own face-up host (needs a free Spell & Trap Zone) */
  if(decl && card && decl.kind==='equipInstead'){
    if(Array.isArray(decl.causes) && decl.causes.indexOf(cause)<0) return [];
    const locE = (card.uid!=null && typeof findCardByUidInState==='function') ? findCardByUidInState(gs, card.uid) : null;
    if(!locE || locE.zone!=='mz') return [];
    if(card.face==='up' && typeof effectNegated==='function' && effectNegated(card)) return [];
    if(typeof stZoneFreeS03==='function' && !stZoneFreeS03(gs, p)) return [];
    const outE = [];
    (gs.players[p].mz||[]).forEach(c=>{
      if(!c || c===card || c.face!=='up') return;
      ensureCardUid(gs, c);
      if(excl.indexOf(c.uid)>=0) return;
      let okH = true; try{ okH = typeof decl.hostFilter==='function' ? !!decl.hostFilter(c) : true; }catch(e){ okH = false; }
      if(okH) outE.push({kind:'equipInstead', uid:card.uid, hostUid:c.uid, name:cardName(c)});
    });
    return outE;
  }
  if(!decl || !card || card.face!=='up') return [];
  if(Array.isArray(decl.causes) && decl.causes.indexOf(cause)<0) return [];
  const loc = (card.uid!=null && typeof findCardByUidInState==='function') ? findCardByUidInState(gs, card.uid) : null;
  if(!loc || loc.zone!=='mz') return [];
  if(typeof effectNegated==='function' && effectNegated(card)) return [];
  if(decl.kind==='detach'){
    return (card.xyz||[]).map(m=>{ ensureCardUid(gs, m); return {kind:'detach', uid:m.uid, name:cardName(m)}; });
  }
  /* S03-U286: 「代わりにこのカード以外の自分フィールド上のモンスター1体をリリースして…できる」 (地縛神 Cusillu) —
     destroySubstituteS03:{kind:'releaseOwn', causes:['battle'], after(player, protectedCard)}: any other monster its controller controls (face-up or
     face-down) is released instead; `after` runs once the release is done (journaled Actions). */
  if(decl.kind==='releaseOwn'){
    const out = [];
    (gs.players[p].mz||[]).forEach(c=>{
      if(!c || c===card) return;
      ensureCardUid(gs, c);
      if(excl.indexOf(c.uid)>=0) return;
      out.push({kind:'release', uid:c.uid, name:cardName(c)});
    });
    return out;
  }
  /* S03-U325: 「代わりに自分の墓地の…モンスター1体をゲームから除外できる」 (ラヴァル・グレイター) —
     destroySubstituteS03:{kind:'banishGrave', causes:['effect'], filter(card)}: any matching monster of its controller's Graveyard is banished instead */
  if(decl.kind==='banishGrave'){
    const outB = [];
    (gs.players[p].grave||[]).forEach(c=>{
      if(!c || excl.indexOf(c.uid)>=0) return;
      ensureCardUid(gs, c);
      if(dbOf(c).k!=='m' && !decl.anyKind) return;   /* S03-U424: anyKind — a Spell / Trap Card of the Graveyard (ライフ・ストリーム・ドラゴン: an Equip Spell) */
      if(typeof decl.filter==='function' && !decl.filter(c)) return;
      outB.push({kind:'banish', uid:c.uid, name:cardName(c)});
    });
    return outB;
  }
  /* S03-U337: 「代わりに手札から…モンスター1体を捨てる事ができる」 (墓守の大神官) —
     destroySubstituteS03:{kind:'discardHand', causes:['battle','effect'], filter(card)}: any matching monster in its controller's hand is discarded instead */
  if(decl.kind==='discardHand'){
    const outD = [];
    (gs.players[p].hand||[]).forEach(c=>{
      if(!c || excl.indexOf(c.uid)>=0) return;
      ensureCardUid(gs, c);
      if(dbOf(c).k!=='m') return;
      if(typeof decl.filter==='function' && !decl.filter(c)) return;
      outD.push({kind:'discard', uid:c.uid, name:cardName(c)});
    });
    return outD;
  }
  /* S03-U364: 「代わりにこのカードのカウンターを1つ取り除く」 (デス・モスキート / メタル・シューター) —
     destroySubstituteS03:{kind:'counter', counter:'カウンター', causes:['battle'], mandatory:true}: one counter of the protected card itself is removed instead */
  if(decl.kind==='counter'){
    const n = (card.counters && Number(card.counters[decl.counter||'カウンター'])) || 0;
    return n>0 ? [{kind:'counter', uid:card.uid, name:cardName(card)}] : [];
  }
  if(decl.kind==='destroyOwn'){
    const src = {uid:card.uid, k:'m'};
    const out = [];
    (gs.players[p].mz||[]).forEach(c=>{
      if(!c || c===card || c.face!=='up') return;
      ensureCardUid(gs, c);
      if(excl.indexOf(c.uid)>=0) return;
      if(typeof decl.filter==='function' && !decl.filter(c)) return;
      /* a card that this destruction could not destroy cannot be chosen */
      if(typeof protectionRecordV21==='function'
         && protectionRecordV21(gs, c, {cause:'effect', byPlayer:p, reason:cardName(card), sourceKind:'m', targeting:false})) return;
      if(typeof s03UnaffectedByU115==='function' && s03UnaffectedByU115(gs, c, src)) return;
      out.push({kind:'destroy', uid:c.uid, name:cardName(c)});
    });
    return out;
  }
  return [];
}

/* Would the effect destruction `a` (stamped FX_TO_GRAVE / FX_WIPE_ZONE shape) leave `card` on the field anyway? */
function destroySubGuardedS03(gs, card, a){
  if(typeof protectionRecordV21==='function' && typeof effectDestroyCtxV21==='function'
     && protectionRecordV21(gs, card, effectDestroyCtxV21(gs, a, card))) return true;
  if(a && a.srcS03 && typeof s03UnaffectedByU115==='function' && s03UnaffectedByU115(gs, card, a.srcS03)) return true;
  return false;
}

/* Only while a chain link resolves in the DUEL processor (not a cost, not the manual board). */
function destroySubContextS03(){
  if(typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL || !gameState) return false;
  if(typeof RESOLVING_LINK_S03==='undefined' || !RESOLVING_LINK_S03) return false;
  if(typeof SCRIPT_PHASE!=='undefined' && SCRIPT_PHASE==='cost') return false;
  if(gameState.__v44ReplayPreview) return false;
  const cur = gameState.processorCurrent, w = gameState.processorWaiting;
  return !!((cur && cur.type===PROCESSOR_V27.SOLVE_CHAIN) || (gameState.processorPaused && w && w.type===PROCESSOR_V27.SOLVE_CHAIN));
}

/* Bake the resolving effect's provenance into a deferred action now (the resolution context is gone when it is performed). */
function destroySubStampS03(a){
  if(typeof p3StampMoveProvenanceV3==='function') p3StampMoveProvenanceV3(a);
  if(typeof s03StampEffectSourceU115==='function') s03StampEffectSourceU115(a);
  if(a.p3===undefined) a.p3 = null;
  if(a.srcS03===undefined) a.srcS03 = null;
  return a;
}
function destroySubWipeCardsS03(gs, zone, players){
  const out = [];
  players.forEach(p=>{
    const P = gs.players[p]; if(!P) return;
    if(zone==='field'){ if(P.field) out.push({p, card:P.field}); return; }
    (P[zone]||[]).forEach(c=>{ if(c) out.push({p, card:c}); });
  });
  out.forEach(x=>ensureCardUid(gs, x.card));
  return out;
}

/* Called by API.destroy (kind 'destroy', act1 = the FX_TO_GRAVE action, r = the resolved target) and API.destroyAll
   (kind 'wipe', spec = {zone, players, reason}). true = deferred (the caller must not act). */
function destroySubInterceptS03(kind, x, r){
  if(!destroySubContextS03()) return false;
  const gs = gameState;
  const chainKey = RESOLVING_LINK_S03 ? String(RESOLVING_LINK_S03.uid)+'/'+String(RESOLVING_LINK_S03.name) : '';
  if(DESTROY_SUB_BATCH_S03 && DESTROY_SUB_BATCH_S03.chainKey!==chainKey){
    /* left over from another resolution (should not happen): perform it without asking */
    const stale = DESTROY_SUB_BATCH_S03; DESTROY_SUB_BATCH_S03 = null;
    destroySubApplyS03({site:'effect', ops:stale.ops, items:[], pos:0, picks:[], after:stale.after||[]});
  }
  let op = null;
  if(kind==='destroy'){
    if(!r || !r.card) return false;
    ensureCardUid(gs, r.card);
    const a = destroySubStampS03(Object.assign({}, x));
    delete a.player; delete a.zone; delete a.index;
    op = {t:'destroy', uid:r.card.uid, a};
    if(!DESTROY_SUB_BATCH_S03){
      if(!destroySubDeclS03(r.card)) return false;
      const probe = Object.assign({}, a, {player:r.p, zone:r.zone, index:r.index});
      if(destroySubGuardedS03(gs, r.card, probe)) return false;
      if(!destroySubOptionsS03(gs, r.card, r.p, 'effect', [r.card.uid]).length) return false;
    }
  }else{
    const a = destroySubStampS03({type:'FX_WIPE_ZONE', reason:x.reason});
    delete a.type;
    op = {t:'wipe', zone:x.zone, players:x.players.slice(), a};
    if(!DESTROY_SUB_BATCH_S03){
      const doomed = destroySubWipeCardsS03(gs, x.zone, x.players);
      const excl = doomed.map(d=>d.card.uid);
      const any = doomed.some(d=>destroySubDeclS03(d.card)
        && !destroySubGuardedS03(gs, d.card, Object.assign({type:'FX_WIPE_ZONE', player:d.p, zone:x.zone}, a))
        && destroySubOptionsS03(gs, d.card, d.p, 'effect', excl).length);
      if(!any) return false;
    }
  }
  if(!DESTROY_SUB_BATCH_S03) DESTROY_SUB_BATCH_S03 = {chainKey, ops:[]};
  DESTROY_SUB_BATCH_S03.ops.push(op);
  if(typeof trace==='function') trace(`破壊の身代わり：${kind==='destroy'?'破壊':'全体破壊'}を選択待ちへ`);
  return true;
}

/* Turn the collected effect destructions into decisions. true = a choice is open (the processor must wait). */
function flushDestroySubS03(){
  const B = DESTROY_SUB_BATCH_S03;
  if(!B || !gameState) return false;
  if(gameState.pendingChoice) return false;          // the resolution's own choice first
  DESTROY_SUB_BATCH_S03 = null;
  const gs = gameState;
  const doomed = [], perOp = [];
  B.ops.forEach(op=>{
    let list = [];
    if(op.t==='destroy'){
      const h = findCardByUidInState(gs, op.uid);
      if(h && ['mz','sz','field'].indexOf(h.zone)>=0) list = [{p:h.p, card:h.card, a:Object.assign({}, op.a, {player:h.p, zone:h.zone, index:h.index})}];
    }else{
      list = destroySubWipeCardsS03(gs, op.zone, op.players).map(d=>({p:d.p, card:d.card, a:Object.assign({type:'FX_WIPE_ZONE', player:d.p, zone:op.zone}, op.a)}));
    }
    list.forEach(d=>{ if(doomed.indexOf(d.card.uid)<0) doomed.push(d.card.uid); });
    perOp.push(list);
  });
  const items = [];
  perOp.forEach(list=>list.forEach(d=>{
    if(items.some(it=>it.uid===d.card.uid)) return;
    if(!destroySubDeclS03(d.card) || destroySubGuardedS03(gs, d.card, d.a)) return;
    const opts = destroySubOptionsS03(gs, d.card, d.p, 'effect', doomed);
    if(opts.length) items.push({uid:d.card.uid, p:d.p, name:cardName(d.card), cause:'effect', opts});
  }));
  return destroySubNextS03({site:'effect', ops:B.ops, items, pos:0, picks:[], after:B.after||[]});   /* S03-U294: continuations (engine/1ZZO) */
}

/* Battle: before BATTLE_CLEANUP. true = a choice is open (the cleanup stage waits and runs again after the decisions). */
function destroySubBattleS03(b){
  if(!b || b.subDoneS03 || typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL) return false;
  const gs = gameState;
  const doomed = [];
  gs.players.forEach((P,p)=>(P.mz||[]).forEach(c=>{ if(c && c.battleDestroyed){ ensureCardUid(gs, c); doomed.push({p, card:c}); } }));
  const excl = doomed.map(d=>d.card.uid);
  const items = [];
  doomed.forEach(d=>{
    const opts = destroySubOptionsS03(gs, d.card, d.p, 'battle', excl);
    if(opts.length) items.push({uid:d.card.uid, p:d.p, name:cardName(d.card), cause:'battle', opts});
  });
  if(!items.length) return false;
  return destroySubNextS03({site:'battle', ops:[], items, pos:0, picks:[]});
}

function destroySubKeyS03(o){ if(o.kind==='equipInstead') return 'eq:' + o.hostUid;   /* S03-U268 */
  if(o.kind==='release') return 'rel:' + o.uid;   /* S03-U286 */
  if(o.kind==='banish') return 'ban:' + o.uid;   /* S03-U325 */
  if(o.kind==='discard') return 'dis:' + o.uid;   /* S03-U337 */
  if(o.kind==='counter') return 'cnt:' + o.uid;   /* S03-U364 */
  return (o.kind==='detach' ? 'mat:' : (o.kind==='placeSpell' ? 'place:' : 'sub:')) + o.uid; }

/* Ask the next protected card, or perform everything. true = a choice is open. */
function destroySubNextS03(job){
  const gs = gameState;
  while(job.pos < job.items.length){
    const item = job.items[job.pos];
    const claimed = job.picks.filter(x=>x.use && (x.kind==='destroy' || x.kind==='release' || x.kind==='banish' || x.kind==='discard')).map(x=>x.subUid);   /* S03-U286: release */
    const opts = item.opts.filter(o=>(o.kind!=='destroy' && o.kind!=='release' && o.kind!=='banish' && o.kind!=='discard') || claimed.indexOf(o.uid)<0);
    if(!opts.length){ job.picks.push({uid:item.uid, use:false}); job.pos++; continue; }
    /* S03-U364: a mandatory replacement (「代わりに…取り除く」) with a single option is taken without asking */
    if(opts.length===1 && opts[0].kind==='counter'){
      const ph = findCardByUidInState(gs, item.uid), pd = ph ? destroySubDeclS03(ph.card) : null;
      if(pd && pd.mandatory===true){ job.picks.push({uid:item.uid, use:true, kind:'counter', subUid:opts[0].uid, p:item.p}); job.pos++; continue; }
    }
    const cands = opts.map(o=>{
      if(o.kind==='detach') return {key:destroySubKeyS03(o), label:`身代わりを使う：素材「${o.name}」を取り除く`, sub:`${item.name} のエクシーズ素材`};
      if(o.kind==='release') return {key:destroySubKeyS03(o), label:`代わりに「${o.name}」をリリースする`, sub:`${item.name} は破壊されない`, uid:o.uid};   /* S03-U286 */
      if(o.kind==='banish') return {key:destroySubKeyS03(o), label:`代わりに墓地の「${o.name}」を除外する`, sub:`${item.name} は破壊されない`, uid:o.uid};   /* S03-U325 */
      if(o.kind==='discard') return {key:destroySubKeyS03(o), label:`代わりに手札の「${o.name}」を捨てる`, sub:`${item.name} は破壊されない`, uid:o.uid};   /* S03-U337 */
      if(o.kind==='counter') return {key:destroySubKeyS03(o), label:`代わりに「${o.name}」のカウンターを1つ取り除く`, sub:`${item.name} は破壊されない`, uid:o.uid};   /* S03-U364 */
      if(o.kind==='equipInstead') return {key:destroySubKeyS03(o), label:`墓地へ送らずに「${o.name}」に装備する`, sub:`${item.name}（破壊されたまま装備カード扱いになる）`, uid:o.hostUid};
      if(o.kind==='placeSpell') return {key:destroySubKeyS03(o), label:'墓地へ送らずに、永続魔法カード扱いとして魔法＆罠ゾーンに置く', sub:`${item.name}（破壊されたまま行き先だけが変わります）`};   /* S03-U240 */
      const h = findCardByUidInState(gs, o.uid);
      return {key:destroySubKeyS03(o), label:`身代わりを使う：「${o.name}」を破壊`, sub:`${nameOf(item.p)}・モンスターゾーン`,
              uid:o.uid, p:h?h.p:null, zone:h?h.zone:null, index:h?h.index:null};
    });
    const placeS03 = opts.some(o=>o.kind==='placeSpell' || o.kind==='equipInstead');
    cands.push(placeS03 ? {key:'decline', label:'置かずに墓地へ送る', sub:`${item.name} は墓地へ送られます`}
                        : {key:'decline', label:'使わずに破壊する', sub:`${item.name} はそのまま破壊されます`});
    const causeJp = item.cause==='battle' ? '戦闘' : '効果';
    const opened = requestChoiceV49({
      player:item.p, kind:'card',
      title:`${item.name}：${causeJp}で破壊されます`,
      note: placeS03 ? `${item.name} は破壊されます。墓地へ送る代わりに魔法＆罠ゾーンへ置く事ができます。` : `代わりに失うカード／素材を選ぶと、${item.name} は破壊されません。`,
      candidates:cands, min:1, max:1, cancelable:false,
      resume:{handler:DESTROY_SUB_HANDLER_S03, args:{job}},
      meta:{scriptName:item.name}
    });
    if(opened) return true;
    job.picks.push({uid:item.uid, use:false}); job.pos++;
  }
  destroySubApplyS03(job);
  return false;
}

/* Perform the decisions and the collected destructions. */
function destroySubApplyS03(job){
  const gs = gameState;
  const used = job.picks.filter(x=>x.use);
  const spare = used.filter(x=>x.kind!=='placeSpell' && x.kind!=='equipInstead').map(x=>x.uid);   /* S03-U240 / U268: a placed / equipped card is still destroyed */
  if(job.items.length || job.site==='battle') act({type:'DESTROY_SUB_S03', site:job.site, picks:JSON.parse(JSON.stringify(job.picks))});
  used.forEach(x=>{
    const prot = findCardByUidInState(gs, x.uid);
    const protName = prot ? cardName(prot.card) : '';
    if(x.kind==='placeSpell' || x.kind==='equipInstead') return;   /* S03-U240 / U268: marked by the DESTROY_SUB_S03 reducer; destroyed below as collected */
    if(x.kind==='detach'){
      if(prot && prot.zone==='mz') act({type:'FX_DETACH', player:prot.p, mzIndex:prot.index, materialUid:x.subUid,
        reason:`${protName}（破壊の身代わり）`, srcS03:{uid:x.uid, k:'m'}});
      return;
    }
    if(x.kind==='banish'){   /* S03-U325: a Graveyard monster is banished instead (the protected card is not destroyed) */
      const g = findCardByUidInState(gs, x.subUid);
      if(g && g.zone==='grave') act({type:'FX_BANISH', player:g.p, zone:'grave', index:g.index, reason:`${protName}（破壊の代わりに除外）`});
      return;
    }
    if(x.kind==='counter'){   /* S03-U364: one counter of the protected card is removed instead (it is not destroyed) */
      const cd = prot ? destroySubDeclS03(prot.card) : null;
      if(prot && prot.zone==='mz') act({type:'COUNTER_REMOVE', player:prot.p, zone:'mz', index:prot.index, kind:(cd && cd.counter) || 'カウンター', n:1});
      return;
    }
    if(x.kind==='discard'){   /* S03-U337: a monster of the hand is discarded instead (the protected card is not destroyed) */
      const dh = findCardByUidInState(gs, x.subUid);
      if(dh && dh.zone==='hand') act({type:'FX_DISCARD', player:dh.p, handIndex:dh.index, reason:`${protName}（破壊の代わりに手札を捨てる）`});
      return;
    }
    if(x.kind==='release'){   /* S03-U286: released instead (not destroyed), then the declared after-step */
      const r = findCardByUidInState(gs, x.subUid);
      if(r && r.zone==='mz') act({type:'FX_TO_GRAVE', player:r.p, zone:'mz', index:r.index, reason:`${protName}（破壊の代わりにリリース）`, byDestroy:false,
        p3:{reason:'tribute', actingPlayer:x.p}, srcS03:{uid:x.uid, k:'m'}});
      const decl = prot ? destroySubDeclS03(prot.card) : null;
      if(decl && typeof decl.after==='function' && prot) decl.after(x.p, prot.card);
      return;
    }
    const s = findCardByUidInState(gs, x.subUid);
    if(s && s.zone==='mz') act({type:'FX_TO_GRAVE', player:s.p, zone:'mz', index:s.index, reason:`${protName}の身代わり`, byDestroy:true,
      byPlayer:x.p, p3:{reason:'effect', actingPlayer:x.p}, srcS03:{uid:x.uid, k:'m'}, destroySubS03:true});
  });
  if(job.site==='effect'){
    job.ops.forEach(op=>{
      if(op.t==='destroy'){
        if(spare.indexOf(op.uid)>=0) return;
        const h = findCardByUidInState(gs, op.uid);
        if(!h || ['mz','sz','field'].indexOf(h.zone)<0) return;
        act(Object.assign({}, op.a, {player:h.p, zone:h.zone, index:h.index}));
      }else{
        op.players.forEach(p=>act(Object.assign({type:'FX_WIPE_ZONE', player:p, zone:op.zone}, op.a, spare.length?{spareUidsS03:spare.slice()}:{})));
      }
    });
    /* S03-U294: the script steps that depend on what was destroyed run now (engine/1ZZO API.afterDestroyS03) */
    if(Array.isArray(job.after) && typeof runDestroyAfterS03==='function') job.after.forEach(e=>runDestroyAfterS03(e));
  }
}

registerChoiceHandlerV49(DESTROY_SUB_HANDLER_S03, function(answer, args){
  const job = JSON.parse(JSON.stringify((args && args.job) || {site:'effect', ops:[], items:[], pos:0, picks:[]}));
  const item = job.items[job.pos];
  const key = (answer && answer.keys && answer.keys[0]) || 'decline';
  const o = (item && key!=='decline') ? item.opts.find(q=>destroySubKeyS03(q)===key) : null;
  if(item) job.picks.push(o ? Object.assign({uid:item.uid, use:true, kind:o.kind, subUid:o.uid, p:item.p}, o.hostUid!=null ? {hostUid:o.hostUid} : {}) : {uid:item.uid, use:false});
  job.pos++;
  if(destroySubNextS03(job)) return;
  if(job.site==='battle'){
    const w = gameState.processorWaiting;
    if(gameState.processorPaused && w && w.type===PROCESSOR_V27.DAMAGE_STEP) processorResumeV27();
  }
});

/* Reducer part (engine/00 DESTROY_SUB_S03): the protected cards that used a substitute are not destroyed. */
function destroySubReduceS03(gs, a){
  const picks = Array.isArray(a.picks) ? a.picks : [];
  picks.forEach(x=>{
    const h = (typeof findCardByUidInState==='function') ? findCardByUidInState(gs, x.uid) : null;
    const nm = h ? cardName(h.card) : '';
    if(x.use && x.kind==='equipInstead'){
      /* S03-U268: still destroyed; its GY move becomes an Equip Card for the chosen host (engine/1ZZG equipInsteadPileS03) */
      if(h && h.card) h.card.equipInsteadS03 = {turn:gs.turn, hostUid:x.hostUid};
      logIt(gs, `${nm}：破壊され、墓地へ送らずに装備カード扱いとして装備する事を選んだ`);
    }else if(x.use && x.kind==='placeSpell'){
      /* S03-U240: still destroyed; its GY move goes to the Spell & Trap Zone (engine/1ZZG → 1ZZH) */
      if(h && h.card) h.card.crystalPlaceS03 = {turn:gs.turn};
      logIt(gs, `${nm}：破壊され、墓地へ送らずに魔法＆罠ゾーンへ置く事を選んだ`);
    }else if(x.use){
      if(a.site==='battle' && h && h.card) delete h.card.battleDestroyed;
      logIt(gs, `${nm}：破壊される代わりに${x.kind==='detach'?'エクシーズ素材を1つ取り除く':(x.kind==='release'?'モンスター1体をリリースする':(x.kind==='discard'?'手札のモンスター1体を捨てる':'身代わりのモンスターを破壊する'))}`);
    }else if(h){
      logIt(gs, `${nm}：身代わりを使わずに破壊される`);
    }
  });
  if(a.site==='battle' && gs.battle) gs.battle.subDoneS03 = true;
}

/* Save / resume: rebuild the processor wait of a pending substitute decision. */
function restoreDestroySubWaitAfterLoadS03(){
  if(typeof PLAY_MODE==='undefined' || PLAY_MODE!==PLAY_MODES.DUEL || !gameState) return false;
  const pc = gameState.pendingChoice;
  if(!pc || !pc.resume || pc.resume.handler!==DESTROY_SUB_HANDLER_S03) return false;
  const job = pc.resume.args && pc.resume.args.job;
  if(!job) return false;
  if(gameState.processorPaused || (gameState.processorQueue||[]).length) return false;
  ensureProcessorStateV27();
  let rest, wait;
  if(job.site==='battle'){
    if(!gameState.battle) return false;
    rest = [{type:PROCESSOR_V27.DAMAGE_STEP, payload:{stage:'cleanup'}}];
    wait = PROCESSOR_V27.DAMAGE_STEP;
  }else{
    rest = (gameState.chain||[]).length
      ? [{type:PROCESSOR_V27.ADJUST, payload:{reason:'chainLink'}}, {type:PROCESSOR_V27.SOLVE_CHAIN, payload:{}}]
      : [{type:PROCESSOR_V27.ADJUST, payload:{reason:'chainEnd'}}, {type:PROCESSOR_V27.CHAIN_END, payload:{}}, {type:PROCESSOR_V27.DRAIN_EVENTS, payload:{}}];
    wait = PROCESSOR_V27.SOLVE_CHAIN;
  }
  enqueueProcessorListFrontV27(rest);
  gameState.processorPaused = true;
  gameState.processorWaiting = {id:++gameState.processorSeq, type:wait, payload:{}, turn:gameState.turn, phase:gameState.phase};
  return true;
}

/* UI: the protected card shown at the top of the sheet. */
function destroySubSheetInfoS03(pc){
  if(!pc || !pc.resume || pc.resume.handler!==DESTROY_SUB_HANDLER_S03) return null;
  const job = pc.resume.args && pc.resume.args.job;
  const item = job && job.items && job.items[job.pos];
  if(!item) return null;
  return {uid:item.uid, name:item.name, cause:item.cause};
}

/* S03-U268: the pile replacing the GY for a card whose controller chose to equip it instead (called by graveRedirectPileS03, engine/1ZZG).
   The host must still be a face-up monster of that player and the Spell & Trap Zone must have room; otherwise it goes to the GY.
   Same fields as an Equip Card from the GY (engine/1N applyGraveEquipV31): equipUid, equipTo {p, uid}, v46MonsterEquip, host.equippedBy. */
function equipInsteadPileS03(gs, p, card){
  const m = card && card.equipInsteadS03;
  if(!m) return null;
  delete card.equipInsteadS03;
  if(Number(m.turn)!==Number(gs.turn)) return null;
  const host = (m.hostUid!=null && typeof findCardByUidInState==='function') ? findCardByUidInState(gs, m.hostUid) : null;
  if(!host || host.zone!=='mz' || host.p!==p || host.card.face!=='up'){ logIt(gs, `${cardName(card)}：装備先がいないため墓地へ送られる`); return null; }
  if(typeof stZoneFreeS03==='function' && !stZoneFreeS03(gs, p)){ logIt(gs, `${cardName(card)}：魔法＆罠ゾーンに空きがないため墓地へ送られる`); return null; }
  card.face = 'up'; card.pos = 'atk'; card.controller = p;
  card.equipUid = card.uid; card.equipTo = {p:host.p, uid:host.card.uid}; card.v46MonsterEquip = true;
  host.card.equippedBy = host.card.equippedBy || [];
  if(!host.card.equippedBy.includes(card.equipUid)) host.card.equippedBy.push(card.equipUid);
  logIt(gs, `${cardName(card)}：墓地へ送らず、装備カード扱いとして ${cardName(host.card)} に装備`);
  return gs.players[p].sz;
}
