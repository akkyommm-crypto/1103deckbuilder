/* =========================================================================
   S03-U271 — position choice for effect Special Summons
   -------------------------------------------------------------------------
   「特殊召喚する」 with no position in the text: the summoning player chooses face-up Attack or face-up Defense Position. API.specialSummon
   takes a fixed position, and most scripts pass 'atk' (a known convention gap, recorded in CLAUDE_RESUME). New scripts use this helper:

     specialSummonPositionsS03(player, items, reason, after)
       items  [{uid, from}] — the cards to summon together (from 'hand' / 'grave' / 'deck' / …)
       after  optional name registered with registerSsPositionAfterS03(name, fn(player, summonedUids, args)) — runs after the summons
       args   optional JSON-safe data passed to `after`

   One journaled ChoiceRequest per card (kind 'option'); after the last answer every card still in its zone is summoned in order, then
   `after` runs. Nothing is summoned before all positions are chosen, so the summons stay together.
   ========================================================================= */
const SS_POSITION_AFTER_S03 = {};
function registerSsPositionAfterS03(name, fn){ SS_POSITION_AFTER_S03[name] = fn; }

function specialSummonPositionsS03(player, items, reason, after, extra){
  const list = (items || []).filter(x=>x && x.uid != null && x.from).map(x=>({uid:x.uid, from:x.from}));
  if(!list.length) return false;
  openSsPositionChoiceS03({player, items:list, reason:String(reason || '効果'), pos:[], after:after || null, extra:(extra != null ? extra : null)});
  return true;
}
function openSsPositionChoiceS03(args){
  const it = args.items[args.pos.length];
  const h = findCardByUid(it.uid);
  const nm = h ? cardName(h.card) : 'モンスター';
  return requestChoiceV49({
    player:args.player, kind:'option', title:`${args.reason}：${nm} を特殊召喚する表示形式`,
    candidates:[{key:'atk', value:'atk', label:'表側攻撃表示'}, {key:'def', value:'def', label:'表側守備表示'}],
    min:1, max:1, cancelable:false, resume:{handler:'s03.ss-position', args}, meta:{scriptName:args.reason}
  });
}
registerChoiceHandlerV49('s03.ss-position', (a, x)=>{
  if(!x) return;
  const c = (a && a.cards || [])[0];
  const args = Object.assign({}, x, {pos:(x.pos || []).concat([(c && c.value === 'def') ? 'def' : 'atk'])});
  if(args.pos.length < args.items.length){ openSsPositionChoiceS03(args); return; }
  const done = [];
  args.items.forEach((it, k)=>{
    const h = findCardByUid(it.uid);
    if(!h || h.zone !== it.from || h.p !== args.player || !hasMonsterZoneSpace(args.player)) return;
    API.specialSummon(args.player, it.from, h.index, args.pos[k], args.reason, null, {positionChosenS03:true});
    const now = findCardByUid(it.uid);
    if(now && now.zone === 'mz') done.push(it.uid);
  });
  const fn = args.after ? SS_POSITION_AFTER_S03[args.after] : null;
  if(typeof fn === 'function') fn(args.player, done, args.extra);
});

/* =========================================================================
   S03-U278 — position choice for every effect Special Summon whose text gives no position
   -------------------------------------------------------------------------
   Most scripts call API.specialSummon(..., 'atk', ...) where the text lets the summoning player choose face-up Attack or Defense (about 485
   TESTED cards). API.specialSummon stays synchronous (scripts act on the summoned card right after it), so:
     1. the summon happens as before (face-up Attack);
     2. if the summon happens while a chain link resolves, the caller did not choose ('atk' from a script), and every Special Summon sentence of
        the source card's text names no position (ssPositionFreeS03), the card is queued (journaled SS_POS_S03 op 'queue');
     3. when the script has finished and no other choice is pending (processor SOLVE_CHAIN, or after a resolution-time choice is answered),
        ssPositionPumpS03 opens one option choice per queued card (op 'take' first); 'def' sets face-up Defense as part of the summon
        (op 'set': no position-change event — the monster was summoned in that position).
   Cards that left the field or are no longer face-up Attack in the meantime are skipped.
   ========================================================================= */
function ssPositionFreeS03(name){
  const db = (typeof CARD_DB !== 'undefined' && typeof findCardIndex === 'function') ? CARD_DB[findCardIndex(name)] : null;
  const e = db && db.e ? String(db.e) : '';
  const ss = e.split(/[。\n]/).filter(x=>/特殊召喚(する|できる|し[、，])/.test(x));
  if(!ss.length) return false;
  /* S03-U283: only 「攻撃表示で／守備表示で…特殊召喚」 fixes the position. A 表示 that belongs to another clause
     (「表側表示で存在する…を…特殊召喚する」, キャトルミューティレーション) or 「表側表示で特殊召喚」 (either position) leaves it to the player. */
  return !ss.some(x=>/(攻撃|守備)表示で[^。]*特殊召喚/.test(x));
}
function ssPositionContextS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return null;
  const r = (typeof RESOLVING_LINK_S03 !== 'undefined') ? RESOLVING_LINK_S03 : null;
  if(r && r.name) return r.name;
  return null;
}
/* called by API.specialSummon after a successful summon */
function ssPositionMaybeQueueS03(p, card, pos, reason, opts){
  if(!card || card.uid == null || (pos && pos !== 'atk')) return;
  if(opts && opts.positionChosenS03) return;
  const src = ssPositionContextS03();
  if(!src || !ssPositionFreeS03(src)) return;
  act({type:'SS_POS_S03', op:'queue', uid:card.uid, player:p, src});
}
/* S03-U289: Tokens special summoned while a link resolves, from a text with no position — queue each new Token */
function ssPositionQueueTokensS03(p, uids){
  const src = ssPositionContextS03();
  if(!src || !ssPositionFreeS03(src)) return;
  (uids || []).forEach(u=>{ if(u != null) act({type:'SS_POS_S03', op:'queue', uid:u, player:p, src}); });
}
function ssPositionPumpS03(){
  if(typeof PLAY_MODE === 'undefined' || PLAY_MODE !== PLAY_MODES.DUEL) return false;
  if(!gameState || gameState.pendingChoice) return false;
  const q = Array.isArray(gameState.ssPosQueueS03) ? gameState.ssPosQueueS03 : [];
  while(q.length){
    const it = q[0];
    act({type:'SS_POS_S03', op:'take'});
    const h = findCardByUid(it.uid);
    if(!h || h.zone !== 'mz' || h.p !== it.player || h.card.face !== 'up') continue;   /* S03-U289: either position (Tokens are created in Defense) */
    requestChoiceV49({
      player:it.player, kind:'option', title:`${it.src}：${cardName(h.card)} を特殊召喚する表示形式`,
      candidates:[{key:'atk', value:'atk', label:'表側攻撃表示'}, {key:'def', value:'def', label:'表側守備表示'}],
      min:1, max:1, cancelable:false, resume:{handler:'s03.ss-position-free', args:{uid:it.uid, player:it.player}}, meta:{scriptName:it.src}
    });
    return true;
  }
  return false;
}
registerChoiceHandlerV49('s03.ss-position-free', (a, x)=>{
  if(!x) return;
  const c = (a && a.cards || [])[0];
  /* S03-U289: set the chosen position when it differs (a Token starts in Defense, a monster in Attack) */
  const want = (c && c.value === 'def') ? 'def' : 'atk';
  const hp = findCardByUid(x.uid);
  if(hp && hp.zone === 'mz' && hp.card.pos !== want) act({type:'SS_POS_S03', op:'set', uid:x.uid, pos:want});
});
