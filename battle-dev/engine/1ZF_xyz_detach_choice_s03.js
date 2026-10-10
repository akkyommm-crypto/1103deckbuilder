/* =========================================================================
   S03-U114 — Xyz material detach choice (generic capability)
   -------------------------------------------------------------------------
   User report (reproduced on device): card effects that detach Xyz materials always removed the FIRST material.
   API.detachMaterial(p, mzIndex, reason) sent FX_DETACH without materialUid/materialIndex, and FX_DETACH then
   used index 0. U108 only fixed the manual field UI (openXyzDetachPick).

   Contract
   - requestDetachMaterialS03(spec) is the single primitive for "remove N Xyz materials" where the player chooses.
       spec: {player (chooser), holderUid | (holderPlayer?, mzIndex), count (default 1), reason,
              cancelable, cont, contArgs, cancelCont, scriptName}
     If the monster has exactly `count` materials they are all removed (no prompt). With more, a P1 ChoiceRequest
     (declare-kind, candidate value = material UID) asks "取り除くX素材を選択してください" and requires exactly
     `count` picks. Materials are identified by UID, never by array index. Continuations are registered names +
     JSON args (registerDetachContinuationS03), so a save taken inside the choice resumes with the same candidates.
   - Each removal is its own FX_DETACH {materialUid}; the material goes to its OWNER's GY (reducer). Replay replays
     the chosen UIDs from the journal.
   - Activation costs: a script (or a v4 effect) declares `detachCostS03:{count, reason, holders?, after?, targets?}`.
     prepareDuelActivation then runs the P1.1 path (prepared JSON descriptor → detach choice → optional registered
     target choice → commitPreparedActivationV11); cancelling the choice aborts the activation before anything moves.
   ========================================================================= */

const XYZ_DETACH_CONT_S03 = Object.create(null);
function registerDetachContinuationS03(name, fn){
  if(typeof name!=='string' || !name || typeof fn!=='function') throw new Error('registerDetachContinuationS03: bad args');
  XYZ_DETACH_CONT_S03[name] = fn;
}
function runDetachContinuationS03(name, args, uids){
  const fn = name && XYZ_DETACH_CONT_S03[name];
  if(typeof fn==='function') fn(args||{}, uids||[]);
}
function xyzHolderS03(spec){
  if(spec.holderUid!=null){
    const h = findCardByUid(spec.holderUid);
    return (h && h.zone==='mz') ? h : null;
  }
  const hp = (spec.holderPlayer===0||spec.holderPlayer===1) ? spec.holderPlayer : spec.player;
  const P = gameState.players[hp]; const c = P && P.mz[spec.mzIndex];
  if(!c) return null;
  ensureCardUid(gameState, c);
  return {p:hp, zone:'mz', index:spec.mzIndex, card:c};
}
/* Remove the given materials (by UID) from the holder, one FX_DETACH each. Returns the UIDs actually removed. */
function detachMaterialsByUidS03(holderUid, uids, reason){
  const done = [];
  (uids||[]).forEach(u=>{
    const h = findCardByUid(holderUid);
    if(!h || h.zone!=='mz') return;
    if(!(h.card.xyz||[]).some(m=>m && m.uid===u)) return;
    act({type:'FX_DETACH', player:h.p, mzIndex:h.index, materialUid:u, reason:reason||'効果'});
    done.push(u);
  });
  return done;
}
function detachMaterialLabelS03(m, holderP){
  const own = (m && m.owner!=null && m.owner!==holderP && typeof nameOf==='function') ? `（${nameOf(m.owner)}の所有）` : '';
  return `${cardName(m)}${own}`;
}
/* Closure-continuation variant for the non-DUEL runScript pipeline (which already runs costs with closures).
   done(true, uids) after the chosen materials are removed; done(false) when cancelled. */
function requestDetachMaterialLegacyS03(spec, done){
  spec = spec || {};
  const count = Math.max(1, Number(spec.count)||1);
  const h = xyzHolderS03(spec);
  if(!h){ done(false); return; }
  const mats = (h.card.xyz||[]).filter(Boolean);
  if(mats.length < count){ done(false); return; }
  mats.forEach(m=>ensureCardUid(gameState, m));
  ensureCardUid(gameState, h.card);
  const holderUid = h.card.uid;
  if(mats.length === count){ done(true, detachMaterialsByUidS03(holderUid, mats.map(m=>m.uid), spec.reason)); return; }
  requestChoiceV49({
    player:(spec.player===0||spec.player===1)?spec.player:h.p, kind:'declare',
    title: count>1 ? `取り除くX素材を${count}つ選択してください` : '取り除くX素材を選択してください',
    note:`${cardName(h.card)}：${spec.reason||''}（素材${mats.length}つ）`,
    candidates: mats.map(m=>({key:'mat:'+m.uid, label:detachMaterialLabelS03(m, h.p), value:m.uid})),
    min:count, max:count, cancelable:true,
    legacy:{onPick:(first, all)=>{
      const uids=(all||[first]).map(c=>c&&c.value).filter(v=>v!=null);
      if(uids.length!==count){ done(false); return; }
      done(true, detachMaterialsByUidS03(holderUid, uids, spec.reason));
    }, onCancel:()=>done(false)},
    meta:{scriptName: spec.scriptName || cardName(h.card)}
  });
}
/* runScript (non-DUEL) cost step for scripts declaring detachCostS03: holder → materials → spec.after. */
function runScriptDetachCostS03(ctx, spec, done){
  const count = Math.max(1, Number(spec.count)||1);
  const holders = detachCostHoldersS03(ctx, spec).filter(h=>(h.card.xyz||[]).length >= count);
  if(!holders.length){ done(false); return; }
  const fromHolder = hh=>{
    ensureCardUid(gameState, hh.card);
    requestDetachMaterialLegacyS03({player:ctx.player, holderUid:hh.card.uid, count, reason:spec.reason||''}, (ok, uids)=>{
      if(!ok){ done(false); return; }
      if(typeof spec.after==='function'){ try{ spec.after(ctx, uids); }catch(e){} }
      done(true);
    });
  };
  if(holders.length===1){ fromHolder(holders[0]); return; }
  API.selectCard('X素材を取り除くエクシーズモンスターを選択してください', holders, t=>{ const h=t&&resolveTarget(t); if(h) fromHolder(h); else done(false); });
}
/* Returns false (and does nothing) when the monster does not have enough materials. */
function requestDetachMaterialS03(spec){
  spec = spec || {};
  const count = Math.max(1, Number(spec.count)||1);
  const h = xyzHolderS03(spec);
  if(!h) return false;
  const mats = (h.card.xyz||[]).filter(Boolean);
  if(mats.length < count) return false;
  mats.forEach(m=>ensureCardUid(gameState, m));
  ensureCardUid(gameState, h.card);
  const holderUid = h.card.uid;
  if(mats.length === count){
    const uids = detachMaterialsByUidS03(holderUid, mats.map(m=>m.uid), spec.reason);
    runDetachContinuationS03(spec.cont, spec.contArgs, uids);
    return true;
  }
  const chooser = (spec.player===0||spec.player===1) ? spec.player : h.p;
  API.requestChoice({
    player: chooser, kind:'declare',
    title: count>1 ? `取り除くX素材を${count}つ選択してください` : '取り除くX素材を選択してください',
    note: `${cardName(h.card)}：${spec.reason||''}（素材${mats.length}つ）`,
    candidates: mats.map(m=>({key:'mat:'+m.uid, label:detachMaterialLabelS03(m, h.p), value:m.uid})),
    min: count, max: count, cancelable: !!spec.cancelable,
    resume:{handler:'s03u114.detach-pick', args:{holderUid, count, reason:spec.reason||'', cont:spec.cont||null,
      contArgs:spec.contArgs||{}, cancelCont:spec.cancelCont||null}},
    meta:{scriptName: spec.scriptName || cardName(h.card)}
  });
  return true;
}
registerChoiceHandlerV49('s03u114.detach-pick', (answer, args)=>{
  if(!answer || answer.cancelled){ runDetachContinuationS03(args.cancelCont, args.contArgs, []); return; }
  const uids = (answer.cards||[]).map(c=>c && c.value).filter(v=>v!=null);
  if(uids.length !== args.count){ runDetachContinuationS03(args.cancelCont, args.contArgs, []); return; }
  const done = detachMaterialsByUidS03(args.holderUid, uids, args.reason);
  runDetachContinuationS03(args.cont, args.contArgs, done);
});

/* ---- activation-cost integration (P1.1) ---------------------------------------------------------------- */
function detachCostSpecS03(sc, name, ctx){
  if(!sc) return null;
  let spec = sc.detachCostS03 || null;
  /* unified v4 cards: the effect being activated (v4SelectEffectForContext honours ctx.v4EffectKey) */
  if(!spec && typeof nativeEffectsV4==='function' && typeof v4SelectEffectForContext==='function' && nativeEffectsV4(name).length){
    let e = null;
    try{ e = v4SelectEffectForContext(name, ctx); }catch(err){ e = null; }
    spec = (e && e.detachCostS03) || null;
  }
  if(typeof spec==='function') spec = spec(ctx);
  return (spec && typeof spec==='object') ? spec : null;
}
function ctxFromPreparedDescS03(d, hit){
  const opts = {};
  if(d.event) opts.event = d.event;
  if(d.eventName) opts.eventName = d.eventName;
  if(d.v4EffectKey) opts.v4EffectKey = d.v4EffectKey;
  return makeContext(d.player, hit.card, hit.zone, hit.index, d.eventName||'activate', opts);
}
function detachCostHoldersS03(ctx, spec){
  if(typeof spec.holders==='function') return (spec.holders(ctx)||[]).filter(x=>x && x.card);
  return ctx.card ? [{p:ctx.player, zone:'mz', index:ctx.index, card:ctx.card}] : [];
}
function beginDetachCostS03(ctx, desc, spec){
  const count = Math.max(1, Number(spec.count)||1);
  const args = {activation:desc, count, reason:spec.reason||desc.name, player:desc.player};
  const holders = detachCostHoldersS03(ctx, spec).filter(h=>(h.card.xyz||[]).length >= count);
  if(!holders.length){ abortPreparedActivationV11(desc); showToast('取り除けるX素材がありません'); return; }
  holders.forEach(h=>ensureCardUid(gameState, h.card));
  if(holders.length === 1){ detachCostStepS03(holders[0].card.uid, args); return; }
  API.requestChoice({player:desc.player, kind:'card', title:'X素材を取り除くエクシーズモンスターを選択してください',
    candidates:holders, min:1, max:1, cancelable:true,
    resume:{handler:'s03u114.detach-holder', args}, meta:{scriptName:desc.name}});
}
registerChoiceHandlerV49('s03u114.detach-holder', (answer, args)=>{
  if(!answer || answer.cancelled) return abortPreparedActivationV11(args.activation);
  const c = (answer.cards||[]).find(x=>x && !x.stale);
  const uid = c && (c.uid!=null ? c.uid : (c.card && c.card.uid));
  if(uid==null) return abortPreparedActivationV11(args.activation);
  detachCostStepS03(uid, args);
});
function detachCostStepS03(holderUid, args){
  const ok = requestDetachMaterialS03({player:args.player, holderUid, count:args.count, reason:args.reason,
    cancelable:true, cont:'s03u114.cost-continue', contArgs:{activation:args.activation},
    cancelCont:'s03u114.cost-abort', scriptName:args.activation && args.activation.name});
  if(!ok) abortPreparedActivationV11(args.activation);
}
registerDetachContinuationS03('s03u114.cost-abort', a=>abortPreparedActivationV11(a.activation));
registerDetachContinuationS03('s03u114.cost-continue', (a, uids)=>continueAfterDetachCostS03(a.activation, uids));
function continueAfterDetachCostS03(d, uids){
  const sc = CARD_SCRIPTS[d.name], hit = findCardByUid(d.uid);
  if(!sc || !hit){ abortPreparedActivationV11(d); return; }
  const ctx = ctxFromPreparedDescS03(d, hit);
  const spec = detachCostSpecS03(sc, d.name, ctx) || {};
  if(typeof spec.after==='function'){ try{ spec.after(ctx, uids); }catch(e){ if(typeof trace==='function') trace(`detachCost after: ${e.message||e}`, false); } }
  /* Card targets after the cost: a registered choice (SaveLoad-safe) committed by the P1.1 handler. */
  if(typeof spec.targets==='function'){
    const t = spec.targets(ctx) || {};
    const cands = (t.candidates||[]).filter(Boolean);
    if(!cands.length){ commitPreparedActivationV11(d, {targets:[]}); return; }
    API.requestChoice({player:d.player, kind:t.kind||'card', title:t.title||`${d.name}：対象を選択`,
      candidates:cands, min:t.min||1, max:t.max||1, cancelable:false, targeting:t.kind!=='declare',
      resume:{handler:'p11cards.commit-targets', args:{activation:d}}, meta:{scriptName:d.name}});
    return;
  }
  commitPreparedActivationV11(d, {targets:[]});
}
