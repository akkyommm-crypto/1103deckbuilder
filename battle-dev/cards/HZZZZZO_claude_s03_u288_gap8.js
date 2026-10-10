/* S03-U288: ENGINE_GAP re-check 8 (2011 texts) — 森のざわめき, 機械複製術, 大波小波, ドラゴンを呼ぶ笛, バグ・ロード, 錬金生物 ホムンクルス.
   No engine change. Reuses: the P1.1 activation-time target (activationV11 + p11cOpen / 'p11cards.commit-targets'), the ChoiceRequest primitive with registered resume handlers
   (resolution-time choices, min 0 for 「できる」), API.specialSummon (the position question is asked by engine/1ZZK, S03-U278 / U283), API.destroy, API.returnToHand,
   FX_SET_STATE face 'down' + pos 'def' (a face-down change, not a Flip), requestDeclarationV11 kind 'attribute' + 'p11cards.declare-commit' (S03-U263 / U272),
   addCharModV17 with faceUpOnlyS03 (engine/1G, S03-U211). All helper names carry the S288 suffix. */

/* ---- 森のざわめき (Spell): 相手フィールド上に表側表示で存在するモンスター1体を選択して裏側守備表示にする。その後、フィールド上に存在するフィールド魔法カードを持ち主の手札に戻す事ができる。 ----
   The target (one face-up monster on the opponent's field) is chosen at activation. Resolution: if it is still a face-up monster of the opponent it becomes face-down Defense Position
   (FX_SET_STATE, not a Flip); only if that happened, its controller may (asked, may decline) return one Field Spell card on the field (either side; the Field Zone only holds
   Field Spells, so a Set one counts too) to its owner's hand. */
function rustleFoePoolS288(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>!!x.card && x.card.face==='up'}); }
function rustleFieldPoolS288(){ return API.fieldCards({zone:'field', filter:x=>!!x.card}); }
defineScript('森のざわめき', {
  type:'spell', priority:1, targets:true,
  condition(ctx){
    if(!rustleFoePoolS288(ctx).length){ ctx.reason = '相手フィールド上に表側表示のモンスターがいません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'森のざわめき：裏側守備表示にする相手モンスター', candidates:rustleFoePoolS288(ctx), min:1, max:1, targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t ? resolveTarget(t) : null;
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent || r.card.face!=='up'){ API.log('森のざわめき：対象が相手フィールドに表側表示で存在しないため不発'); return; }
    const uid = ensureCardUid(gameState, r.card);
    act({type:'FX_SET_STATE', player:r.p, zone:'mz', index:r.index, face:'down', pos:'def', reason:'森のざわめき'});
    const now = findCardByUid(uid);
    if(!now || now.zone!=='mz' || now.card.face!=='down' || now.card.pos!=='def'){ API.log('森のざわめき：裏側守備表示にできなかったため、その後の処理は行わない'); return; }
    const pool = rustleFieldPoolS288();
    if(!pool.length) return;
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:ctx.player, kind:'card', title:'森のざわめき：持ち主の手札に戻すフィールド魔法カード（選ばなくてもよい）', candidates:pool, min:0, max:1, cancelable:false,
      resume:{handler:'s03u288.rustle-field', args:{player:ctx.player}}, meta:{scriptName:'森のざわめき'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u288.rustle-field', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const pick = (a.cards || []).find(y=>y && !y.stale && y.uid!=null);
  const h = pick ? findCardByUid(pick.uid) : null;
  if(!h || h.zone!=='field') return;
  API.returnToHand(h, '森のざわめき');
});

/* ---- 機械複製術 (Spell): 自分フィールドの攻撃力500以下の機械族モンスター1体を対象として発動できる。デッキからその表側表示モンスターの同名モンスターを2体まで特殊召喚する。 ----
   The target (own face-up Machine with a current ATK of 500 or less) is chosen at activation. Resolution: if it is still a face-up monster of its controller and still a Machine
   with ATK 500 or less (a target that no longer meets the targeting condition is not affected), the player chooses
   1 to 2 monsters with the same name from the Deck (at least one when possible, at most the free Monster Zones) and Special Summons them; the Deck is shuffled by the summon
   (or, with none to summon, by the search). */
function replicaTargetPoolS288(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!!x.card && x.card.face==='up' && x.race==='機械' && curATK(x.card)<=500}); }
function replicaDeckPoolS288(p, card){
  return API.pileCards(p, 'deck', x=>x.db.k==='m' && sameCanonicalCardV4(x.card, card) && canEffectSpecialSummonS03(x.card, 'deck', '機械複製術'));
}
defineScript('機械複製術', {
  type:'spell', priority:1, targets:true, includesSpecialSummon:true,
  condition(ctx){
    if(!replicaTargetPoolS288(ctx).length){ ctx.reason = '自分フィールド上に攻撃力500以下の表側表示の機械族モンスターがいません'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'機械複製術：対象とする機械族モンスター', candidates:replicaTargetPoolS288(ctx), min:1, max:1, targeting:true, cancelable:false}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t ? resolveTarget(t) : null;
    if(!r || r.zone!=='mz' || r.p!==ctx.player || r.card.face!=='up'){ API.log('機械複製術：対象が表側表示のモンスターとして存在しないため不発'); return; }
    /* Opus review (S03-U288): a target that no longer meets the targeting condition (a Machine with ATK 500 or less) at resolution is not affected */
    if(currentRaceV17(r.card)!=='機械' || curATK(r.card)>500){ API.log('機械複製術：対象が攻撃力500以下の機械族モンスターではなくなったため不発'); return; }
    const pool = replicaDeckPoolS288(ctx.player, r.card);
    const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length);
    if(!pool.length || !room){ API.log('機械複製術：特殊召喚できる同名モンスターがデッキにいない、またはモンスターゾーンが空いていない'); API.shuffle(ctx.player); return; }
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:ctx.player, kind:'card', title:`機械複製術：デッキから特殊召喚する同名モンスター（${Math.min(2, room, pool.length)}体まで）`, candidates:pool, min:1, max:Math.min(2, room, pool.length), cancelable:false,
      resume:{handler:'s03u288.replica-pick', args:{player:ctx.player}}, meta:{scriptName:'機械複製術'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u288.replica-pick', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player;
  const uids = (a.cards || []).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  let n = 0;
  uids.slice(0, 2).forEach(u=>{
    const h = findCardByUid(u);
    if(!h || h.p!==p || h.zone!=='deck' || !hasMonsterZoneSpace(p)) return;
    if(API.specialSummon(p, 'deck', h.index, 'atk', '機械複製術')) n++;
  });
  if(!n) API.shuffle(p);
});

/* ---- 大波小波 (Spell): 自分フィールド上に表側表示で存在する水属性モンスターを全て破壊する。その後、破壊した数と同じ数まで手札から水属性モンスターを特殊召喚する事ができる。 ----
   Not activatable without a face-up WATER monster you control (current Attribute). Resolution: every such monster is destroyed; the number actually destroyed (a monster that is still
   on the field afterwards — a protected one — is not counted) is the limit for the optional (min 0) Special Summon of WATER monsters from the hand (also limited by the free zones). */
function tidalWaterPoolS288(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>!!x.card && x.card.face==='up' && x.attr==='水'}); }
function tidalHandPoolS288(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.attr==='水' && canEffectSpecialSummonS03(x.card, 'hand', '大波小波')); }
defineScript('大波小波', {
  type:'spell', priority:1, includesSpecialSummon:true, destroysFieldV46:true,
  condition(ctx){
    if(!tidalWaterPoolS288(ctx.player).length){ ctx.reason = '自分フィールド上に表側表示の水属性モンスターがいません'; return false; }
    return true;
  },
  resolve(ctx){
    const p = ctx.player;
    const uids = tidalWaterPoolS288(p).map(x=>ensureCardUid(gameState, x.card));
    if(!uids.length){ API.log('大波小波：破壊する水属性モンスターがいないため不発'); return; }
    const mark = API.destroyMarkS03();
    uids.slice().reverse().forEach(u=>{
      const h = findCardByUid(u);
      if(!h || h.zone!=='mz' || h.p!==p) return;
      API.destroy(h, '大波小波', p);
    });
    /* S03-U294: the number actually destroyed, after any substitute decision (engine/1ZZO) */
    API.afterDestroyS03('s03u294.tidal-after', {mark, uids, player:p});
  },
  afterResolve(){}
});
registerDestroyAfterS03('s03u294.tidal-after', a=>{
    const p = a.player, destroyed = API.destroyedSinceS03(a.mark, a.uids).length;
    if(destroyed<1) return;
    const pool = tidalHandPoolS288(p);
    const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length);
    const n = Math.min(destroyed, room, pool.length);
    if(n<1){ API.log('大波小波：手札から特殊召喚できる水属性モンスターがいない、またはモンスターゾーンが空いていない'); return; }
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:p, kind:'card', title:`大波小波：手札から特殊召喚する水属性モンスター（${n}体まで・選ばなくてもよい）`, candidates:pool, min:0, max:n, cancelable:false,
      resume:{handler:'s03u288.tidal-pick', args:{player:p, limit:destroyed}}, meta:{scriptName:'大波小波'}});
});
API.registerChoiceHandler('s03u288.tidal-pick', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player, limit = Number(x.limit) || 0;
  const uids = (a.cards || []).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  uids.slice(0, limit).forEach(u=>{
    const h = findCardByUid(u);
    if(!h || h.p!==p || h.zone!=='hand' || dbOf(h.card).k!=='m' || currentAttributeV17(h.card)!=='水' || !hasMonsterZoneSpace(p)) return;
    API.specialSummon(p, 'hand', h.index, 'atk', '大波小波');
  });
});

/* ---- ドラゴンを呼ぶ笛 (Spell): 手札からドラゴン族モンスターを2体まで特殊召喚する。この効果はフィールドに「ロード・オブ・ドラゴン－ドラゴンの支配者－」が存在する場合に発動と処理ができる。 ----
   Activation and resolution both need a face-up 「ロード・オブ・ドラゴン－ドラゴンの支配者－」 (or a card treated as it) on the field (either side). Resolution: the player chooses
   1 to 2 Dragon-Type monsters from the hand (at least one when possible, at most the free Monster Zones) and Special Summons them. */
const LORD_NAME_S288 = 'ロード・オブ・ドラゴン－ドラゴンの支配者－';
function lordUpS288(){
  const ref = dbOf({id:findCardIndex(LORD_NAME_S288)});
  return API.fieldCards({zone:'mz', filter:x=>!!x.card && x.card.face==='up' && sameCanonicalCardV4(x.card, ref)});
}
function whistleDragonPoolS288(p){ return API.pileCards(p, 'hand', x=>x.db.k==='m' && x.race==='ドラゴン' && canEffectSpecialSummonS03(x.card, 'hand', 'ドラゴンを呼ぶ笛')); }
defineScript('ドラゴンを呼ぶ笛', {
  type:'spell', priority:1, includesSpecialSummon:true,
  condition(ctx){
    if(!lordUpS288().length){ ctx.reason = 'フィールドに「ロード・オブ・ドラゴン－ドラゴンの支配者－」が存在する場合に発動できます'; return false; }
    return true;
  },
  resolve(ctx){
    if(!lordUpS288().length){ API.log('ドラゴンを呼ぶ笛：「ロード・オブ・ドラゴン－ドラゴンの支配者－」がフィールドに存在しないため処理できない'); return; }
    const p = ctx.player, pool = whistleDragonPoolS288(p);
    const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length);
    if(!pool.length || !room){ API.log('ドラゴンを呼ぶ笛：手札に特殊召喚できるドラゴン族モンスターがいない、またはモンスターゾーンが空いていない'); return; }
    pool.forEach(x=>ensureCardUid(gameState, x.card));
    API.requestChoice({player:p, kind:'card', title:`ドラゴンを呼ぶ笛：手札から特殊召喚するドラゴン族モンスター（${Math.min(2, room, pool.length)}体まで）`, candidates:pool, min:1, max:Math.min(2, room, pool.length), cancelable:false,
      resume:{handler:'s03u288.whistle-pick', args:{player:p}}, meta:{scriptName:'ドラゴンを呼ぶ笛'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u288.whistle-pick', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player;
  if(!lordUpS288().length) return;
  const uids = (a.cards || []).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  uids.slice(0, 2).forEach(u=>{
    const h = findCardByUid(u);
    if(!h || h.p!==p || h.zone!=='hand' || dbOf(h.card).k!=='m' || currentRaceV17(h.card)!=='ドラゴン' || !hasMonsterZoneSpace(p)) return;
    API.specialSummon(p, 'hand', h.index, 'atk', 'ドラゴンを呼ぶ笛');
  });
});

/* ---- バグ・ロード (Quick-Play Spell): お互いに自分フィールド上に表側表示で存在するレベル4以下のモンスター1体と同じレベルのモンスター1体を手札から特殊召喚する事ができる。 ----
   Nothing is targeted. Resolution: the activator, then the opponent, each decide (may decline) whether to Special Summon 1 monster from their own hand whose Level equals the Level
   of a face-up Level 4 or lower monster (Xyz Monsters have no Level) they control; both chosen monsters are Special Summoned together after both have decided. */
function bugLordPoolS288(p){
  const lvs = new Set();
  API.fieldCards({player:p, zone:'mz', filter:x=>!!x.card && x.card.face==='up' && x.db.k==='m' && (x.db.st||[]).indexOf('エクシーズ')<0}).forEach(x=>{
    const lv = curLV(x.card); if(lv>=1 && lv<=4) lvs.add(lv);
  });
  if(!lvs.size) return [];
  return API.pileCards(p, 'hand', x=>x.db.k==='m' && lvs.has(curLV(x.card)) && canEffectSpecialSummonS03(x.card, 'hand', 'バグ・ロード'));
}
function bugLordAskS288(args){
  while(args.i < args.order.length){
    const who = args.order[args.i];
    const pool = bugLordPoolS288(who);
    if(pool.length && hasMonsterZoneSpace(who)){
      pool.forEach(x=>ensureCardUid(gameState, x.card));
      API.requestChoice({player:who, kind:'card', title:'バグ・ロード：手札から特殊召喚するモンスター（自分フィールドの表側表示のレベル4以下のモンスターと同じレベル・選ばなくてもよい）', candidates:pool, min:0, max:1, cancelable:false,
        resume:{handler:'s03u288.bug-pick', args:{order:args.order, i:args.i, picks:args.picks}}, meta:{scriptName:'バグ・ロード'}});
      return;
    }
    args.i++;
  }
  /* both decided: summon the chosen monsters together */
  (args.picks || []).forEach(pk=>{
    const h = findCardByUid(pk.uid);
    if(!h || h.p!==pk.player || h.zone!=='hand' || !hasMonsterZoneSpace(pk.player)) return;
    if(!bugLordPoolS288(pk.player).some(x=>x.card.uid===pk.uid)) return;
    API.specialSummon(pk.player, 'hand', h.index, 'atk', 'バグ・ロード');
  });
}
API.registerChoiceHandler('s03u288.bug-pick', (a, x)=>{
  if(!x) return;
  const args = {order:x.order, i:x.i, picks:(x.picks || []).slice()};
  const pick = (a && !a.cancelled) ? (a.cards || []).find(y=>y && !y.stale && y.uid!=null) : null;
  if(pick) args.picks.push({player:args.order[args.i], uid:pick.uid});
  args.i++;
  bugLordAskS288(args);
});
defineScript('バグ・ロード', {
  type:'quick-play', priority:2, includesSpecialSummon:true,
  condition(){ return true; },
  resolve(ctx){
    const args = {order:[ctx.player, ctx.opponent], i:0, picks:[]};
    if(!bugLordPoolS288(ctx.player).length && !bugLordPoolS288(ctx.opponent).length){ API.log('バグ・ロード：特殊召喚できるモンスターが互いの手札にいない'); return; }
    bugLordAskS288(args);
  },
  afterResolve(){}
});

/* ---- 錬金生物 ホムンクルス: このモンスターの属性を変更する事ができる。この効果は1ターンに1度だけ使用する事ができる。 ----
   Ignition, once per turn, its controller's Main Phase, face-up in the Monster Zone. The Attribute (other than its current one) is declared at activation
   (requestDeclarationV11 kind 'attribute' + 'p11cards.declare-commit'). Resolution: while it stays face-up on the field it becomes that Attribute (a characteristic override that ends
   when it leaves the field or is turned face-down); a later use replaces the earlier choice. */
const HOMUNCULUS_NAME_S288 = '錬金生物 ホムンクルス';
const ATTRS_S288 = ['闇','光','地','水','炎','風','神'];
defineScript('錬金生物 ホムンクルス', {
  type:'monster', priority:1, countLimit:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    return true;
  },
  activationV11(ctx, d){
    const me = d.uid!=null ? findCardByUid(d.uid) : null;
    const cur = me ? currentAttributeV17(me.card) : '';
    API.declare(ctx, 'attribute', {title:'錬金生物 ホムンクルス：変更後の属性を宣言', values:ATTRS_S288.filter(a=>a!==cur), activation:d, cancelable:false},
      {handler:'p11cards.declare-commit', args:{}});
  },
  resolve(ctx){
    const v = API.declared(ctx, 'attribute');
    const h = locateCardAnyV4(ctx.card);
    if(!v || !h || h.zone!=='mz' || h.card.face!=='up'){ API.log('錬金生物 ホムンクルス：フィールドに表側表示で存在しないため属性を変更できない'); return; }
    API.clearCharMods(h, HOMUNCULUS_NAME_S288);
    const h2 = locateCardAnyV4(ctx.card);
    if(h2) addCharModV17(h2, {kind:'attr', value:String(v), until:'permanent', label:HOMUNCULUS_NAME_S288, faceUpOnlyS03:true});
    API.log(`錬金生物 ホムンクルス：属性を${v}に変更した`);
  },
  afterResolve(){}
});
