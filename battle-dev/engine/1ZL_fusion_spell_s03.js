/* S03-U130: Fusion Summon by a Fusion Spell — 「融合」 and 「ダーク・フュージョン」.
   S03-U132: generalised into per-spell profiles (material zones, how the materials leave, the Fusion Monster's race /
   attribute, an after-summon step) for 「龍の鏡」 and 「オーバーロード・フュージョン」 (both NOT_STARTED).

   融合: 「①:自分の手札・フィールドから、融合モンスターカードによって決められた融合素材モンスターを墓地へ送り、その融合モンスター1体を
   EXデッキから融合召喚する。」 — was NOT_STARTED: in DUEL mode a Fusion Monster could not be Fusion Summoned with 融合 at all
   (the Extra Deck sheet says 「融合召喚は融合魔法・カード効果の解決から行います」).
   ダーク・フュージョン: the same with 悪魔族 Fusion Monsters only, and 「この効果で特殊召喚したモンスターは、このターン相手の効果の
   対象にならない」.
   龍の鏡 / オーバーロード・フュージョン: materials from the own field / GY are banished (ドラゴン族 / 機械族・闇属性 Fusion Monsters).

   Procedure (all at resolution; the spells do not target):
   1. the player picks a Fusion Monster in the Extra Deck that can be Fusion Summoned now with materials from the profile's
      zones (field: face-up or face-down monsters; tokens are not used as materials here);
   2. picks the material combination (when there is more than one), and the battle position (face-up ATK / DEF);
   3. the materials leave (to the GY: hand FX_HAND_SEND_GRAVE / field API.sendToGrave, marked `fusionMaterialS03` —
      「融合召喚に使用した融合素材モンスター」, zone-local; or banished: API.banish), then the monster is Special Summoned as a
      Fusion Summon (summonKind 'fusion' → also recorded as properly summoned, U127), then the profile's after-step runs.
   Excluded Fusion Monsters: those whose own text says 「「N」の効果でのみ／でしか特殊召喚できる」 with this spell not among N
   (e.g. the E－HERO that only ダーク・フュージョン can summon, U127 `properSummonSourcesS03`), those blocked by
   「融合召喚でしか」-type conditions for another kind (U126), and any Special Summon lock on the player (v46).
   GY materials are not offered while ネクロバレー stops that move (graveMoveBlocked).
   Not handled here (recorded): Fusion Material substitutes (e.g. 「融合素材モンスター1体の代わりにできる」) and Fusion Monsters
   whose material line cannot be parsed (`parseMaterialSpec(...).permissive`) are not offered. */

/* profiles: JSON-safe data + a named after-step (the choice handlers only carry the spell name) */
const FUSION_SPELL_PROFILES_S03 = {
  '融合':                   {zones:['hand','mz'], dispose:'grave'},
  'ダーク・フュージョン':     {zones:['hand','mz'], dispose:'grave', race:'悪魔', after:'oppTargetImmuneTurn'},
  '龍の鏡':                 {zones:['mz','grave'], dispose:'banish', race:'ドラゴン'},
  'オーバーロード・フュージョン': {zones:['mz','grave'], dispose:'banish', race:'機械', attr:'闇'},
  /* S03-U133 */
  'パワー・ボンド':           {zones:['hand','mz'], dispose:'grave', race:'機械', after:'powerBond'},
  'ジェムナイト・フュージョン': {zones:['hand','mz'], dispose:'grave', exNameIncludes:'ジェムナイト'}
};
function fusionSpellProfileS03(spell){ return FUSION_SPELL_PROFILES_S03[spell] || {zones:['hand','mz'], dispose:'grave'}; }
const FUSION_SPELL_AFTER_S03 = {
  /* ダーク・フュージョン: このターン相手の効果の対象にならない */
  oppTargetImmuneTurn(put, spell){ API.setCardFlag(put, 'oppTargetImmuneTurnS03', gameState.turn, spell); },
  /* S03-U133 パワー・ボンド: 「この効果で特殊召喚したモンスターの攻撃力は、その元々の攻撃力分アップする。このカードを発動したターンの
     エンドフェイズに自分はこの効果でアップした数値分のダメージを受ける。」 — the boost stays while the monster is face-up on the
     field (permanent mod); the damage is scheduled for this turn's End Phase (System v7) and happens even if the monster has
     left the field. */
  powerBond(put, spell, p){
    const up = Math.max(0, Number(baseAtkV14(put.card)) || 0);
    if(!up) return;
    API.modAtk(put, up, 0, 'permanent', spell);
    API.schedule({at:'endPhase', turns:0, player:p, handler:'s03u133.power-bond-damage', args:{player:p, amount:up}, note:spell});
  }
};
registerScheduleHandlerV7('s03u133.power-bond-damage', (args)=>{
  if(args && (args.player===0 || args.player===1) && args.amount > 0) API.damageLP(args.player, args.amount);
});

function fusionSpellPoolS03(p, prof){
  const P = gameState.players[p];
  const zones = (prof && prof.zones) || ['hand','mz'];
  const pool = [];
  const push = (zone, c, i, lv, live)=>{ if(typeof cannotFusionMaterialS03==='function' && cannotFusionMaterialS03(c)) return;   /* S03-U174 */
    pool.push({i:pool.length, p, zone, index:i, card:c, c:live, db:dbOf(c), lv}); };
  if(zones.indexOf('hand')>=0) (P.hand||[]).forEach((c,i)=>{
    if(!c || c.token) return; const db = dbOf(c); if(!db || db.k!=='m') return;
    push('hand', c, i, db.lv||0, c);
  });
  if(zones.indexOf('mz')>=0) (P.mz||[]).forEach((c,i)=>{
    if(!c || c.token) return; const db = dbOf(c); if(!db || db.k!=='m') return;
    const lv = (c.face==='up' && typeof curLV==='function') ? (curLV(c)||0) : (db.lv||0);
    push('mz', c, i, lv, c.face==='up' ? c : null);
  });
  if(zones.indexOf('grave')>=0 && !(typeof graveMoveBlocked==='function' && graveMoveBlocked('grave', prof.dispose==='banish' ? 'banish' : 'leave')))
    (P.grave||[]).forEach((c,i)=>{
      if(!c) return; const db = dbOf(c); if(!db || db.k!=='m') return;
      push('grave', c, i, db.lv||0, c);
    });
  return pool;
}
/* why this Fusion Monster cannot be Fusion Summoned by this spell ('' = it can, material aside) */
function fusionSpellMonsterBlockS03(p, card, spell, prof){
  const db = dbOf(card);
  prof = prof || fusionSpellProfileS03(spell);
  if(!db || (db.st||[]).indexOf('融合') < 0) return '融合モンスターではありません';
  if(prof.race && db.ra !== prof.race) return `${prof.race}族の融合モンスターではありません`;
  if(prof.attr && db.at !== prof.attr) return `${prof.attr}属性の融合モンスターではありません`;
  if(prof.exNameIncludes && String(db.n||'').indexOf(prof.exNameIncludes) < 0) return `「${prof.exNameIncludes}」融合モンスターではありません`;
  const src = (typeof properSummonSourcesS03==='function') ? properSummonSourcesS03(db).filter(n=>n!==db.n) : [];
  if(src.length && src.indexOf(spell) < 0) return `${db.n}は「${src.join('」「')}」の効果でのみ特殊召喚できます`;
  const only = (typeof summonOnlyReasonS03==='function') ? summonOnlyReasonS03(card, 'fusion', spell) : '';
  if(only) return only;
  const lock = (typeof v46SpecialSummonRestrictionReason==='function') ? v46SpecialSummonRestrictionReason(p, db) : '';
  if(lock) return lock;
  return '';
}
/* S03-U134: Fusion Material substitutes — 沼地の魔神王 / 融合呪印生物: 「このカードは、融合モンスターカードにカード名が記された融合素材
   モンスター1体の代わりにできる。その際、他の融合素材モンスターは正規のものでなければならない。」
   - only for a material named on the Fusion Monster card (a nameExact slot; not 「E・HERO」モンスター / 炎族モンスター …);
   - one substitute per Fusion Summon; the other materials must be the real ones;
   - the substitute's effect must apply: in the hand, in the GY, or face-up on the field;
   - not for Fusion Monsters that must use the printed materials (「このカードの融合召喚は上記のカードでしか行えない」,
     「上記(の)カードを融合素材にした融合召喚でのみ」). */
function fusionSubstituteCardS03(card, zone){
  if(!card || card.token) return false;
  if(zone==='mz' && card.face!=='up') return false;
  const e = String((dbOf(card)||{}).e || '');
  return /このカード(?:は、融合モンスターカードにカード名が記された|を)融合素材モンスター1体の代わりに/.test(e);
}
function fusionNoSubstituteS03(db){
  return /融合召喚は上記のカードでしか行えない|上記の?カードを融合素材にした融合召喚でのみ/.test(String((db||{}).e||''));
}
/* the material combinations for this Fusion Monster, including those with one substitute (each entry keeps its pool object) */
function fusionCombosS03(pool, spec, fusionDb, limit){
  const LIM = limit || 60;
  const base = findMaterialCombos(pool, spec, null, LIM);
  if(!spec || !spec.slots || fusionNoSubstituteS03(fusionDb)) return base;
  const names = [];
  spec.slots.forEach(q=>{ if(q.nameExact && names.indexOf(q.nameExact)<0) names.push(q.nameExact); });
  if(!names.length) return base;
  const out = base.slice();
  const seen = new Set(base.map(cb=>cb.map(m=>m.i).sort((a,b)=>a-b).join(',')));
  pool.filter(m=>fusionSubstituteCardS03(m.card, m.zone)).forEach(s=>names.forEach(n=>{
    if(cardName(s.card)===n) return;
    const alt = Object.assign({}, s, {db:Object.assign({}, s.db, {n}), c:null});
    const pool2 = pool.filter(m=>m!==s).concat([alt]);
    findMaterialCombos(pool2, spec, null, LIM).forEach(cb=>{
      if(cb.indexOf(alt) < 0) return;
      const mapped = cb.map(m=>m===alt ? s : m);
      const key = mapped.map(m=>m.i).sort((a,b)=>a-b).join(',');
      if(seen.has(key) || out.length >= LIM*2) return;
      seen.add(key); out.push(mapped);
    });
  }));
  return out;
}
function fusionSpellOptionsS03(p, spell){
  if(typeof deckLockSourceS03==='function' && deckLockSourceS03(gameState,'fusionSummonBanS03')) return [];   /* S03-U413: 融合禁止エリア */
  const P = gameState.players[p];
  const prof = fusionSpellProfileS03(spell);
  const pool = fusionSpellPoolS03(p, prof);
  const out = [];
  (P.ex||[]).forEach((c,ei)=>{
    if(!c || fusionSpellMonsterBlockS03(p, c, spell, prof)) return;
    const spec = parseMaterialSpec(dbOf(c));
    if(!spec || !spec.slots) return;
    const combos = fusionCombosS03(pool, spec, dbOf(c), 60)   /* S03-U134: with Fusion Material substitutes */
      .filter(cb=>(P.mz||[]).length - cb.filter(m=>m.zone==='mz').length < ZONE_LIMITS.mz);
    if(combos.length) out.push({ex:{p, zone:'ex', index:ei, card:c, db:dbOf(c)}, combos});
  });
  return out;
}
function fusionSpellComboUidsS03(combo){ return combo.map(m=>ensureCardUid(gameState, m.card)); }
function fusionSpellComboLabelS03(combo){
  const zj = {hand:'手札', mz:'フィールド', grave:'墓地'};
  return combo.map(m=>`${m.zone==='mz'&&m.card.face!=='up'?'裏側の'+cardName(m.card):cardName(m.card)}（${zj[m.zone]||m.zone}）`).join(' ＋ ');
}
/* resolution entry point used by the spells */
function fusionSpellResolveS03(ctx, spell){
  const o = fusionSpellOptionsS03(ctx.player, spell);
  if(!o.length){ API.log(`${spell}：融合召喚できる融合モンスターがいない`); return; }
  API.requestChoice({player:ctx.player, kind:'card', title:`${spell}：融合召喚する融合モンスター`, candidates:o.map(x=>x.ex),
    min:1, max:1, cancelable:false,
    resume:{handler:'s03u130.fusion-ex', args:{player:ctx.player, spell}}, meta:{scriptName:spell}});
}
registerChoiceHandlerV49('s03u130.fusion-ex', (answer, args)=>{
  const picked = (answer && answer.cards || []).filter(x=>x && !x.stale && x.card)[0];
  if(!picked) return;
  const exUid = ensureCardUid(gameState, picked.card);
  const opt = fusionSpellOptionsS03(args.player, args.spell).find(o=>ensureCardUid(gameState, o.ex.card)===exUid);
  if(!opt){ API.log(`${args.spell}：融合召喚できなくなった`); return; }
  const next = Object.assign({}, args, {exUid});
  const verb = fusionSpellProfileS03(args.spell).dispose==='banish' ? '除外する' : '墓地へ送る';
  if(opt.combos.length===1){ fusionSpellAskPosS03(Object.assign(next, {mats:fusionSpellComboUidsS03(opt.combos[0])})); return; }
  API.requestChoice({player:args.player, kind:'declare', title:`${args.spell}：${cardName(picked.card)} の融合素材（${verb}）`,
    candidates:opt.combos.map((cb,k)=>({key:'m'+k, label:fusionSpellComboLabelS03(cb), value:fusionSpellComboUidsS03(cb).join(',')})),
    min:1, max:1, cancelable:false, resume:{handler:'s03u130.fusion-mats', args:next}, meta:{scriptName:args.spell}});
});
registerChoiceHandlerV49('s03u130.fusion-mats', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  const uids = String((c && c.value) || '').split(',').map(Number).filter(Number.isFinite);
  if(uids.length) fusionSpellAskPosS03(Object.assign({}, args, {mats:uids}));
});
function fusionSpellAskPosS03(args){
  const ex = findCardByUid(args.exUid);
  API.requestChoice({player:args.player, kind:'declare', title:`${args.spell}：${ex?cardName(ex.card):'融合モンスター'} の表示形式`,
    candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}],
    min:1, max:1, cancelable:false, resume:{handler:'s03u130.fusion-pos', args}, meta:{scriptName:args.spell}});
}
registerChoiceHandlerV49('s03u130.fusion-pos', (answer, args)=>{
  const c = answer && answer.cards && answer.cards[0];
  fusionSpellCommitS03(args, (c && c.value)==='def' ? 'def' : 'atk');
});
function fusionSpellCommitS03(args, pos){
  const p = args.player, spell = args.spell;
  const prof = fusionSpellProfileS03(spell);
  const ex = findCardByUid(args.exUid);
  if(!ex || ex.p!==p || ex.zone!=='ex'){ API.log(`${spell}：融合モンスターがエクストラデッキにない`); return; }
  const opt = fusionSpellOptionsS03(p, spell).find(o=>ensureCardUid(gameState, o.ex.card)===args.exUid);
  const uids = args.mats || [];
  const valid = opt && opt.combos.some(cb=>{ const u = fusionSpellComboUidsS03(cb); return u.length===uids.length && uids.every(x=>u.indexOf(x)>=0); });
  if(!valid){ API.log(`${spell}：選んだ融合素材がそろっていない`); return; }
  uids.forEach(u=>{
    const h = findCardByUid(u); if(!h) return;
    if(prof.dispose==='banish') API.banish(h, `${spell}（融合素材）`);
    else if(h.zone==='hand') API.sendHandToGrave(h.p, h.index, `${spell}（融合素材）`);
    else API.sendToGrave(h, `${spell}（融合素材）`);
  });
  if(prof.dispose!=='banish')
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='grave') API.setCardFlag(h, 'fusionMaterialS03', spell, spell, {silent:true}); });
  const now = findCardByUid(args.exUid);
  if(!now || now.zone!=='ex') return;
  API.specialSummon(p, 'ex', now.index, pos, spell, null, {summonKind:'fusion'});
  const put = findCardByUid(args.exUid);
  if(put && put.zone==='mz'){
    API.setCardFlag(put, 'fusionMaterialCount', uids.length, spell, {silent:true});
    const after = prof.after && FUSION_SPELL_AFTER_S03[prof.after];
    if(after) after(put, spell, p);
  }
}
/* 「このターン相手の効果の対象にならない」 (oppTargetImmuneTurnS03 = the turn) — used by filterTargetable(cands, byPlayer) */
function oppTargetImmuneNowS03(card, controller, byPlayer){
  return !!(card && card.oppTargetImmuneTurnS03!=null && card.oppTargetImmuneTurnS03===gameState.turn
    && byPlayer!=null && controller!=null && byPlayer!==controller);
}
