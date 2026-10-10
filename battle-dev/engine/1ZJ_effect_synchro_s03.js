/* S03-U121: Synchro Summon performed by a card effect ("このカードを含む自分フィールドのモンスターをS素材としてS召喚する":
   フォーミュラ・シンクロン ②, TG ワンダー・マジシャン ②).

   Before this unit no script could Synchro Summon during an effect's resolution; both cards simply lacked ②.
   Rules: the effect is activated (a chain link, quick, the opponent's Main Phase); at resolution, if this card is still
   face-up in the Monster Zone, its controller Synchro Summons one Synchro Monster from the Extra Deck using this card and
   other monsters they control as materials (a legal combination for that monster). It is a Synchro Summon — "S召喚に成功
   した" effects (TG ハイパー・ライブラリアン, フォーミュラ・シンクロン ①) react after the chain — but it is performed during
   resolution, so there is no summon-negation window.

   Implementation: the existing EX pipeline (EX_SUMMON_PREPARE_V42 + EX_SUMMON_COMMIT_V42) with the materials that
   exCombos() found, filtered to combinations that include this card. The three choices (Synchro Monster, material
   combination, position) are registered ChoiceRequest handlers (SaveLoad-safe; args are plain JSON with uids). */

function effectSynchroOptionsS03(p, sourceUid){
  const P = gameState.players[p], out = [];
  const src = findCardByUid(sourceUid);
  if(!src || src.p!==p || src.zone!=='mz' || src.card.face!=='up') return out;
  if(typeof synchroSummonLockReasonS03==='function' && synchroSummonLockReasonS03(p)) return out;   /* S03-U139 */
  (P.ex||[]).forEach((ex, i)=>{
    const db = dbOf(ex);
    if(typeof exKind==='function' && exKind(db)!=='synchro') return;
    if(typeof v46SpecialSummonRestrictionReason==='function' && v46SpecialSummonRestrictionReason(p, db)) return;
    const res = exCombos(p, db);
    if(!res || res.permissive) return;
    const combos = (res.combos||[]).filter(cb=>cb.materials.indexOf(src.index)>=0)
      .map(cb=>({label:cb.label, uids:cb.materials.map(mi=>ensureCardUid(gameState, P.mz[mi]))}));
    if(combos.length) out.push({exUid:ensureCardUid(gameState, ex), name:db.n, combos});
  });
  return out;
}
function canEffectSynchroS03(p, sourceUid){ return effectSynchroOptionsS03(p, sourceUid).length > 0; }

/* resolution entry: start the choices */
function effectSynchroSummonS03(p, sourceUid, reason){
  const opts = effectSynchroOptionsS03(p, sourceUid);
  if(!opts.length){ API.log(`${reason||'効果'}：S召喚できるモンスターがいない`); return false; }
  const cands = opts.map(o=>{ const h=findCardByUid(o.exUid); return h ? {p:h.p, zone:'ex', index:h.index, card:h.card} : null; }).filter(Boolean);
  API.requestChoice({player:p, kind:'card', title:`${reason||'効果'}：S召喚するシンクロモンスター`, candidates:cands, min:1, max:1,
    cancelable:false, resume:{handler:'s03u121.effsyn-ex', args:{player:p, sourceUid, reason:reason||'効果'}}, meta:{scriptName:reason||null}});
  return true;
}
registerChoiceHandlerV49('s03u121.effsyn-ex', (answer, args)=>{
  const picked = (answer && answer.cards || []).filter(x=>x && x.card)[0];
  if(!picked) return;
  const exUid = ensureCardUid(gameState, picked.card);
  const opt = effectSynchroOptionsS03(args.player, args.sourceUid).find(o=>o.exUid===exUid);
  if(!opt){ API.log(`${args.reason}：S召喚できなくなった`); return; }
  const next = Object.assign({}, args, {exUid});
  if(opt.combos.length===1){ effectSynchroPositionS03(Object.assign(next, {uids:opt.combos[0].uids})); return; }
  API.requestChoice({player:args.player, kind:'declare', title:`${args.reason}：S素材の組み合わせ`,
    candidates:opt.combos.map((cb,i)=>({key:'m'+i, label:cb.label, value:cb.uids.join(',')})), min:1, max:1, cancelable:false,
    resume:{handler:'s03u121.effsyn-combo', args:next}, meta:{scriptName:args.reason}});
});
registerChoiceHandlerV49('s03u121.effsyn-combo', (answer, args)=>{
  const v = answer && answer.values ? answer.values[0] : (answer && answer.cards && answer.cards[0] && answer.cards[0].value);
  const uids = String(v||'').split(',').map(Number).filter(Number.isFinite);
  if(!uids.length) return;
  effectSynchroPositionS03(Object.assign({}, args, {uids}));
});
function effectSynchroPositionS03(args){
  API.requestChoice({player:args.player, kind:'declare', title:`${args.reason}：表示形式`,
    candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'}, {key:'def', label:'表側守備表示', value:'def'}], min:1, max:1, cancelable:false,
    resume:{handler:'s03u121.effsyn-pos', args}, meta:{scriptName:args.reason}});
}
registerChoiceHandlerV49('s03u121.effsyn-pos', (answer, args)=>{
  const v = answer && answer.values ? answer.values[0] : (answer && answer.cards && answer.cards[0] && answer.cards[0].value);
  const pos = v==='def' ? 'def' : 'atk';
  effectSynchroCommitS03(args.player, args.exUid, args.uids, pos, args.reason);
});
/* re-validate by uid (the chain may have changed the field) and perform the Synchro Summon */
function effectSynchroCommitS03(p, exUid, uids, pos, reason){
  const P = gameState.players[p];
  const ex = findCardByUid(exUid);
  if(!ex || ex.p!==p || ex.zone!=='ex'){ API.log(`${reason}：S召喚できなくなった`); return false; }
  const idx = uids.map(u=>{ const h=findCardByUid(u); return (h && h.p===p && h.zone==='mz') ? h.index : -1; });
  if(idx.some(i=>i<0)){ API.log(`${reason}：S素材が場を離れたためS召喚できない`); return false; }
  const res = exCombos(p, dbOf(ex.card));
  const legal = (res.combos||[]).some(cb=>cb.materials.length===idx.length && idx.every(i=>cb.materials.indexOf(i)>=0));
  if(!legal){ API.log(`${reason}：S素材の組み合わせが正しくなくなった`); return false; }
  act({type:'EX_SUMMON_PREPARE_V42', player:p, exIndex:ex.index, materials:idx, kind:'synchro', pos, byEffectS03:reason});
  if(!gameState.pendingExV2) return false;
  act({type:'EX_SUMMON_COMMIT_V42', player:p});
  return true;
}
