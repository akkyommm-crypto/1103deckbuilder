/* S03-U430: ガーディアン・グラール, ガーディアン・ケースト, ガーディアン・エルマ, ガーディアン・バオウ, ガーディアン・シール (stale ENGINE_GAP cards: monsters that can only be summoned while a named Equip Spell stands on the field; carddata texts).

   ガーディアン・グラール  「重力の斧－グラール」が自分のフィールド上に存在する時のみ、このカードは召喚・反転召喚・特殊召喚する事ができる。手札にこのカード1枚しかない場合、手札からこのカードを特殊召喚する事ができる。
   ガーディアン・ケースト  「静寂のロッド－ケースト」が自分のフィールド上に存在する時のみ、このカードは召喚・反転召喚・特殊召喚する事ができる。このカードは魔法の効果を受けない。また相手モンスターから攻撃対象にされない。
   ガーディアン・エルマ    「蝶の短剣－エルマ」が自分のフィールド上に存在する時のみ、このカードは召喚・反転召喚・特殊召喚する事ができる。このカードが召喚・特殊召喚に成功した時、自分の墓地の装備魔法カード1枚をこのカードに装備する事ができる。
   ガーディアン・バオウ    「破邪の大剣－バオウ」が自分のフィールド上に存在する時のみ、このカードは召喚・反転召喚・特殊召喚する事ができる。戦闘で相手モンスターを破壊して墓地へ送る度に、このカードの攻撃力は1000ポイントアップする。また、戦闘で破壊した効果モンスターの効果は無効化される。
   ガーディアン・シール    「流星の弓－シール」が自分のフィールド上に存在する時のみ、このカードは召喚・反転召喚・特殊召喚する事ができる。このカードに装備された自分の装備カード1枚を墓地へ送る事で、相手フィールド上のモンスター1体を破壊する。

   Notes
   - The summon condition is the script hook summonConditionS03(p, db, kind) of S03-U384 (engine/1ZZS): '' = allowed, a string = the reason; a face-up card named X in my Spell & Trap Zone is "存在する". グラール's hand exception: kind 'special' is allowed while its owner's hand is exactly that card (and a summonProcedure from the hand offers the Special Summon).
   - ケースト: unaffectedByS03 (S03-U115) for Spell sources while face-up in a Monster Zone + continuous cannotBeAttackTarget on itself. エルマ: optional onNormalSummon / onSpecialSummon trigger → API.equipFromGrave. バオウ: forced onDamageStep (dsTiming 'after', a6DestroyedFoeInBattle) adds a permanent +1000 ATK; declareBattleDestroyedNegatorS03 for the effect-monster rule. シール: ignition, cost = one of my Equip Cards equipped to it goes to the Graveyard, destroys a chosen opponent monster. */

function u430Has(p, name){ return (gameState.players[p].sz||[]).some(c=>c && c.face==='up' && cardName(c)===name); }
function u430Cond(name, extra){
  return (p, db, kind)=>{
    if(typeof extra==='function'){ const r = extra(p, db, kind); if(r==='ok') return ''; }
    return u430Has(p, name) ? '' : `「${name}」が自分フィールドに存在しないため召喚・反転召喚・特殊召喚できません`;
  };
}
function u430Passive(extra){
  return Object.assign({type:'monster', priority:1, timing:['free'],
    condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){}}, extra || {});
}

/* ---- ガーディアン・グラール ---- */
defineScript('ガーディアン・グラール', u430Passive({
  summonConditionS03:u430Cond('重力の斧－グラール', (p, db, kind)=>{ const h = gameState.players[p].hand; return (kind==='special' && h.length===1 && cardName(h[0])==='ガーディアン・グラール') ? 'ok' : ''; }),
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ const h = gameState.players[ctx.player].hand; if(h.length!==1 || h[0]!==ctx.card){ ctx.reason = '手札にこのカード1枚しかない場合に特殊召喚できます'; return false; } return true; } } }));

/* ---- ガーディアン・ケースト ---- */
function u430KestUp(card, gs){ return typeof s03u115FaceUpInMz==='function' ? s03u115FaceUpInMz(card, gs) : (!!card && card.face==='up'); }
defineScript('ガーディアン・ケースト', u430Passive({
  summonConditionS03:u430Cond('静寂のロッド－ケースト'),
  unaffectedByS03(card, src, gs){ return !!src && src.k==='s' && u430KestUp(card, gs); },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, cannotBeAttackTarget(target, self){ return !!self && target===self && self.face==='up'; } } }));

/* ---- ガーディアン・エルマ ---- */
function u430ElmaSummoned(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && (e.uid===ctx.card.uid || e.card===ctx.card); }
function u430GraveEquips(p){ return API.pileCards(p, 'grave', x=>x.db.k==='s' && x.db.sub==='装備'); }
defineUnifiedCardV4('ガーディアン・エルマ', [{
  key:'equip', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onSpecialSummon'],
  condition(ctx){ if(!u430ElmaSummoned(ctx)){ ctx.reason = '召喚・特殊召喚に成功した時に発動します'; return false; } return u430GraveEquips(ctx.player).length>0; },
  operation(ctx){
    const pool = u430GraveEquips(ctx.player); if(!pool.length) return;
    API.selectCard('ガーディアン・エルマ：装備する墓地の装備魔法カード', pool, t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(r && r.zone==='grave' && me && me.zone==='mz') API.equipFromGrave(ctx.player, r, me, 'ガーディアン・エルマ');
    });
  },
  afterResolve(){}
}], u430Passive({summonConditionS03:u430Cond('蝶の短剣－エルマ'), passive:{ onNormalSummon(ctx){ return u430ElmaSummoned(ctx) && u430GraveEquips(ctx.player).length>0; }, onSpecialSummon(ctx){ return u430ElmaSummoned(ctx) && u430GraveEquips(ctx.player).length>0; } }}));

/* ---- ガーディアン・バオウ ---- */
function u430BaoKill(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && a6DestroyedFoeInBattle(ctx); }
defineUnifiedCardV4('ガーディアン・バオウ', [{
  key:'grow', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return !!u430BaoKill(ctx); },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') v4RegisterStatModifier(me, {atk:1000}, {code:'ガーディアン・バオウ', resetMask:RESET.LEAVE|RESET.FACE_DOWN}); },
  afterResolve(){}
}], u430Passive({forced:true, dsTiming:'after', summonConditionS03:u430Cond('破邪の大剣－バオウ'), passive:{ onDamageStep(ctx){ return !!u430BaoKill(ctx); } }}));
declareBattleDestroyedNegatorS03('ガーディアン・バオウ', {});

/* ---- ガーディアン・シール ---- */
function u430SealEquips(ctx){
  const me = locateCardAnyV4(ctx.card); if(!me) return [];
  return API.fieldCards({player:ctx.player, zone:'sz', filter:x=>x.card.equipTo && x.card.equipTo.uid===me.card.uid});
}
defineUnifiedCardV4('ガーディアン・シール', [{
  key:'smash', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){
    if(!u419Main(ctx)){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u430SealEquips(ctx).length){ ctx.reason = 'このカードに装備された自分の装備カードがありません'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const pool = u430SealEquips(ctx); if(!pool.length){ done(false); return; }
    API.selectCard('ガーディアン・シール：墓地へ送る装備された自分の装備カード', pool, t=>{ const r = t && resolveTarget(t); if(!r){ done(false); return; } API.sendToGrave(r, 'ガーディアン・シール（コスト）'); done(true); });
  },
  target(ctx, done){ API.selectCard('ガーディアン・シール：破壊する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz'}), t=>done([t])); },
  operation(ctx){ const t = ctx.selectedTargets && resolveTarget(ctx.selectedTargets[0]); if(t && t.zone==='mz' && t.p===ctx.opponent) API.destroy(t, 'ガーディアン・シール'); },
  afterResolve(){}
}], u430Passive({summonConditionS03:u430Cond('流星の弓－シール'), targets:true}));
