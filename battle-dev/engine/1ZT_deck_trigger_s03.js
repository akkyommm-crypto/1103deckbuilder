/* =========================================================================
   S03-U156 — shared engine for 「(戦闘によって破壊され｜フィールド上から)墓地へ送られた時、デッキから…を(特殊召喚する｜手札に加える)」
   -------------------------------------------------------------------------
   Recruiters (リクルーター) and searchers were implemented four different ways: v41DefineAttributeRecruiter (6 attribute recruiters),
   u52BattleRecruitScript (3), individual scripts, and — for ~30 cards — coarse AUTO_DECK_TABLE entries declared trig:"ignition", i.e. an
   effect activated from the GY at will instead of a trigger. クリッター / ゴブリンゾンビ reacted to ANY card sent to the GY from anywhere.
   ■ Card side: only a declaration   declareDeckTriggerS03(name, spec)
     spec.when     'battleToGrave'  — 「このカードが戦闘によって破壊され墓地へ送られた時」 (onBattleDestroy of this card, now in the GY)
                   'fieldToGrave'   — 「このカードがフィールド上から墓地へ送られた時」 (onLeaveField of this card: from mz/sz/field to the GY;
                                       every route — battle, effect destruction, Tribute, Synchro material, cost … — is the same event)
     spec.faceUp   true — 「フィールド上に表側表示で存在するこのカードが」 (it left the field face-up)
     spec.action   'summon' | 'search'
     spec.from     ['deck'] (default) or ['hand','deck'] (「自分の手札またはデッキから」)
     spec.filter   {atkmax, atkmin, defmax, defmin, lvmax, lvmin, lv, at, ra, name, notName, group (GROUP key), set (SETCODE), tuner:false,
                   nameHas, effectOnly, normalOnly (S03-U200), ritualOnly, spellNameAny (S03-U202)}
                   — name / notName: that card or a card treated as it (canonical identity)
                   — the pool is always Main Deck monsters (monsters only unless spec.filter.anyCard)
     spec.pos      'atk' 表側攻撃表示 | 'def' 表側守備表示 | 'faceDownDef' 裏側守備表示 | 'faceUp' 表側表示 (the player chooses) — summon only
     spec.optional true 「〜できる」 (the player may decline the trigger) | false 「〜する」 (forced)
     spec.max      how many may be chosen (「2体まで」 2, 「任意の数」 99); at least 1 when there is one to choose
     spec.minPick  0 — 「任意の数だけ…できる」 inside a forced effect: the player may choose none at resolution
     spec.summonNeedsZone false — the activation does not need a free zone (素早いモモンガ: the LP gain happens regardless)
     spec.lpCost   LP paid as the activation cost (パンダボーグ 800)
     spec.extra    fn(ctx) → '' or a reason: an additional activation condition
     spec.before   fn(ctx) — an effect applied at resolution before the Deck part (素早いモモンガ: +1000 LP; 「さらに」)
     spec.continuous  the card's continuous effects (the usual continuous object: scope / from / apply / protectV21 / …)
     spec.summonFlag  {key} — a zone-local turn mark set on each monster this effect Special Summons (プチトマボー: 「このターン、この効果で
                   特殊召喚したモンスターはシンクロ素材にできない」 → noSynchroMaterialTurnS03)
     spec.toOpponent  true — Special Summoned to the opponent's field (素早いムササビ 「相手フィールド上に」), from the player's Deck
   ■ Resolution (the regular path: trigger → activation → chain → resolution): the Deck is examined at RESOLUTION (it is not a
     target). No candidate → the effect resolves doing nothing more (the Deck is shuffled). Summon: needs a free Monster Zone to be
     activated; the monster is Special Summoned by API.specialSummon (summon conditions, 「特殊召喚できない」 and SS locks apply;
     FX_SPECIAL_SUMMON shuffles the Deck; an SS lock blocks the activation — blocksIfNoSpecialSummon, v4.4.0). Search: API.searchDeck
     (FX_SEARCH shuffles; a ライオウ-type lock blocks an optional search's activation — blocksIfNoDeckToHand — and a forced one resolves
     adding nothing, v32). The choice is a journaled requestChoice (the existing card-choice UI), never a direct move.
   ■ 1103 texts: the project carddata holds some modern texts (クリッター / 黒き森のウィッチ carry the later 「1ターンに1度」 and
     「このターン…発動できない」 clauses). The declarations follow the 2011 texts; nothing from later errata is added.
   ========================================================================= */
const DECK_TRIGGER_S03 = {};
/* 「〇〇」 names that card — or a card whose name is treated as it (ハーピィ・レディ1 「カード名を『ハーピィ・レディ』として扱う」):
   the canonical passcode identity (canonicalCardCodeV4), as the AUTO table's canonical filter did */
function deckTriggerNamedS03(db, card, name){
  if(db && db.n===name) return true;
  if(typeof findCardIndex!=='function' || typeof canonicalCardCodeV4!=='function') return false;
  const i = findCardIndex(name); const named = (i>=0 && typeof CARD_DB!=='undefined') ? CARD_DB[i] : null;
  if(!named || named.n!==name) return false;
  const want = canonicalCardCodeV4(named), have = canonicalCardCodeV4(card || db);
  return !!want && want===have;
}
function deckTriggerFilterS03(spec){
  const f = (spec && spec.filter) || {};
  return function(db, card){
    if(!db) return false;
    if(!f.anyCard && db.k!=='m') return false;
    if(db.k==='m' && db.ex) return false;
    const n = (v)=>Number(v)||0;
    if(f.atkmax!=null && n(db.atk)>f.atkmax) return false;
    if(f.atkmin!=null && n(db.atk)<f.atkmin) return false;
    if(f.defmax!=null && n(db.def)>f.defmax) return false;
    if(f.defmin!=null && n(db.def)<f.defmin) return false;
    if(f.lvmax!=null && n(db.lv)>f.lvmax) return false;
    if(f.lvmin!=null && n(db.lv)<f.lvmin) return false;
    if(f.lv!=null && n(db.lv)!==f.lv) return false;
    if(f.at!=null && db.at!==f.at) return false;
    if(f.ra!=null && db.ra!==f.ra) return false;
    if(f.name!=null && !deckTriggerNamedS03(db, card, f.name)) return false;
    if(f.notName!=null && deckTriggerNamedS03(db, card, f.notName)) return false;
    if(f.group!=null && !(typeof isCardInGroupV4==='function' && isCardInGroupV4(db, f.group))) return false;
    if(f.set!=null && !(typeof isSetCardV4==='function' && isSetCardV4(db, f.set))) return false;
    if(f.tuner===false && (db.st||[]).indexOf('チューナー')>=0) return false;
    /* S03-U200: 「「X」と名のついた」 without a setcode (レアル・ジェネクス), 「効果モンスター」, 「通常モンスター」 */
    if(f.nameHas!=null && String(db.n||'').indexOf(f.nameHas)<0) return false;
    if(f.effectOnly && (db.st||[]).indexOf('効果')<0) return false;
    if(f.normalOnly && (db.st||[]).indexOf('通常')<0) return false;
    /* S03-U202: 「儀式モンスター」; 「「A」または「B」と名のついた魔法カード」 */
    if(f.ritualOnly && (db.st||[]).indexOf('儀式')<0) return false;
    /* S03-U204: one of several named cards (「「A」または「B」」) */
    if(Array.isArray(f.names) && !f.names.some(nm=>deckTriggerNamedS03(db, card, nm))) return false;
    if(Array.isArray(f.spellNameAny) && !(db.k==='s' && f.spellNameAny.some(w=>String(db.n||'').indexOf(w)>=0))) return false;
    return true;
  };
}
function deckTriggerPoolS03(name, spec, p){
  const ok = deckTriggerFilterS03(spec);
  const from = spec.from || ['deck'];
  const out = [];
  from.forEach(z=>API.pileCards(p, z, x=>ok(x.db, x.card)).forEach(x=>{
    if(spec.action==='summon' && typeof canEffectSpecialSummonS03==='function' && !canEffectSpecialSummonS03(x.card, z, name)) return;
    out.push(x);
  }));
  return out;
}
/* did the declared trigger happen for this card? */
function deckTriggerHappenedS03(ctx, spec){
  if(!ctx || !ctx.card || ctx.zone!=='grave') return false;
  if(typeof eventIsSelfS03==='function' && !eventIsSelfS03(ctx)) return false;
  const e = ctx.event || {};
  if(spec.when==='battleToGrave'){
    if(ctx.eventName && ctx.eventName!=='onBattleDestroy') return false;
    if(spec.faceUp){ const g = ctx.card.graveInfo; if(!(g && g.face==='up')) return false; }
    return true;
  }
  if(spec.when==='fieldToGrave'){
    if(ctx.eventName && ctx.eventName!=='onLeaveField') return false;
    if(e.toZone!=='grave' || ['mz','sz','field'].indexOf(e.fromZone)<0) return false;
    if(spec.faceUp && e.fromFace!=='up') return false;
    return true;
  }
  return false;
}
function declareDeckTriggerS03(name, spec){
  const S = Object.assign({from:['deck'], max:1, optional:true}, spec||{});
  DECK_TRIGGER_S03[name] = S;
  const evName = S.when==='battleToGrave' ? 'onBattleDestroy' : 'onLeaveField';
  const summon = S.action==='summon';
  const reasonWhen = S.when==='battleToGrave' ? 'このカードが戦闘によって破壊され墓地へ送られた時に発動します' : 'このカードがフィールドから墓地へ送られた時に発動します';
  const canActivate = (ctx)=>{
    if(!deckTriggerHappenedS03(ctx, S)){ ctx.reason = reasonWhen; return false; }
    if(summon && S.summonNeedsZone!==false && !hasMonsterZoneSpace(S.toOpponent ? ctx.opponent : ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(S.lpCost && API.me(ctx).lp < S.lpCost){ ctx.reason = `${S.lpCost}ライフポイントを払えません`; return false; }
    if(typeof S.extra==='function'){ const w = S.extra(ctx); if(w){ ctx.reason = w; return false; } }
    return true;
  };
  const def = {
    type:'monster', priority:1, activateFrom:['grave'], forced:!S.optional,
    condition(ctx){ return canActivate(ctx); },
    selectTargets(ctx, done){ done([]); },
    resolve(ctx){
      if(typeof S.before==='function') S.before(ctx);
      if(summon && S.summonNeedsZone!==false && !hasMonsterZoneSpace(S.toOpponent ? ctx.opponent : ctx.player)){ API.log(`${name}：モンスターゾーンが空いていない`); return; }
      const pool = deckTriggerPoolS03(name, S, ctx.player);
      if(!pool.length){
        if((S.from||['deck']).indexOf('deck')>=0) API.shuffle(ctx.player);
        API.log(`${name}：条件を満たすカードがデッキに無い（デッキをシャッフル）`);
        return;
      }
      const room = summon ? Math.max(0, ZONE_LIMITS.mz - gameState.players[S.toOpponent ? ctx.opponent : ctx.player].mz.length) : 99;
      if(!room){ API.log(`${name}：モンスターゾーンが空いていない`); return; }
      const max = Math.max(1, Math.min(S.max||1, pool.length, room));
      const min = S.minPick===0 ? 0 : 1;
      API.requestChoice({player:ctx.player, kind:'card',
        title:`${name}：${summon?'特殊召喚する':'手札に加える'}カード${max>1?`（${max}枚まで）`:''}`,
        candidates:pool, min, max, cancelable:false,
        resume:{handler:'s03u156.deck-trigger', args:Object.assign({player:ctx.player, name, action:S.action, pos:S.pos||'atk'},
          S.summonFlag ? {flag:S.summonFlag.key} : {}, S.toOpponent ? {toOpponent:true} : {})},
        meta:{scriptName:name}});
    },
    afterResolve(){},
    passive:{}
  };
  def.passive[evName] = function(ctx){ return deckTriggerHappenedS03(ctx, S) && (!summon || S.summonNeedsZone===false || hasMonsterZoneSpace(ctx.player)); };
  if(summon){ def.includesSpecialSummon = true; def.blocksIfNoSpecialSummon = true; }
  /* v32 (S03-U01): an optional search cannot be activated under a ライオウ-type lock; a forced one is activated and adds nothing */
  else if(S.optional) def.blocksIfNoDeckToHand = true;
  if(S.lpCost) def.cost = function(ctx, done){ if(API.me(ctx).lp < S.lpCost){ done(false); return; } API.payCost(ctx.player, S.lpCost); done(true); };
  if(S.when==='battleToGrave') def.dsTiming = 'leave';
  /* S03-U167: a card's continuous effects declared next to its deck trigger (オシャレオン, ジェイドナイト, 機皇兵スキエル・アイン) */
  if(S.continuous) def.continuous = S.continuous;
  return defineScript(name, Object.assign(def, S.script||{}));
}
registerChoiceHandlerV49('s03u156.deck-trigger', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const p = args.player;
  const picked = (answer.cards||[]).filter(y=>y && !y.stale && y.uid!=null).map(y=>y.uid);
  const cards = picked.map(u=>{ const h = findCardByUid(u); return h && h.p===p && (h.zone==='deck' || h.zone==='hand') ? h.card : null; }).filter(Boolean);
  if(args.action==='search'){
    cards.forEach(c=>{ const h = locateCardAnyV4(c); if(h && h.zone==='deck') API.searchDeck(p, h.index, args.name); });
    return;
  }
  const to = args.toOpponent ? (p===0?1:0) : p;
  const summonOne = (c, pos)=>{
    const h = locateCardAnyV4(c); if(!h || (h.zone!=='deck' && h.zone!=='hand') || !hasMonsterZoneSpace(to)) return;
    if(pos==='faceDownDef') API.specialSummon(to, h.zone, h.index, 'def', args.name, args.toOpponent ? p : null, {faceDown:true});
    else API.specialSummon(to, h.zone, h.index, pos==='def'?'def':'atk', args.name, args.toOpponent ? p : null);
    /* S03-U169: the turn mark on the summoned monster (spec.summonFlag) */
    if(args.flag){ const now = locateCardAnyV4(c); if(now && now.zone==='mz') API.setCardFlag(now, args.flag, gameState.turn, args.name, {silent:true}); }
  };
  if(args.pos==='faceUp' && cards.length===1){
    /* 「特殊召喚する」 with no position: face-up Attack or face-up Defense, the player's choice */
    API.requestChoice({player:p, kind:'declare', title:`${args.name}：表示形式`,
      candidates:[{key:'atk', label:'表側攻撃表示', value:'atk'},{key:'def', label:'表側守備表示', value:'def'}], min:1, max:1, cancelable:false,
      resume:{handler:'s03u156.deck-trigger-pos', args:{player:p, name:args.name, uid:cards[0].uid}}, meta:{scriptName:args.name}});
    return;
  }
  cards.forEach(c=>summonOne(c, args.pos==='faceUp' ? 'atk' : args.pos));
});
registerChoiceHandlerV49('s03u156.deck-trigger-pos', (answer, args)=>{
  const pick = answer && answer.cards && answer.cards[0];
  const pos = (pick && pick.value==='def') ? 'def' : 'atk';
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.p!==args.player || (h.zone!=='deck' && h.zone!=='hand') || !hasMonsterZoneSpace(args.player)) return;
  API.specialSummon(args.player, h.zone, h.index, pos, args.name);
});

/* S03-U185: the same deck trigger as a v4 effect entry, for cards that combine it with other effects (メカウサー, サイバー・ラーバァ).
   Returns {effect, passive(ctx)}. */
function deckTriggerEffectV4S03(name, spec){
  const S = Object.assign({from:['deck'], max:1, optional:true}, spec||{});
  /* S03-U187: registered like declareDeckTriggerS03, so the spec (pool / filter) is discoverable by name (tools/test_s03_u135) */
  DECK_TRIGGER_S03[name] = S;
  const ev = S.when==='battleToGrave' ? 'onBattleDestroy' : 'onLeaveField';
  const can = (ctx)=>{
    if(!deckTriggerHappenedS03(ctx, S)) return false;
    if(S.action==='summon' && S.summonNeedsZone!==false && !hasMonsterZoneSpace(ctx.player)) return false;
    return true;
  };
  return {
    effect:{
      key:'deck-trigger', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, targetRange:LOCATION.DECK, targetSide:'self', speed:1,
      events:[ev], forced:!S.optional,
      condition(ctx){ return can(ctx); },
      operation(ctx){
        const pool = deckTriggerPoolS03(name, S, ctx.player);
        if(!pool.length){ API.shuffle(ctx.player); API.log(`${name}：条件を満たすカードがデッキに無い（デッキをシャッフル）`); return; }
        if(S.action==='summon' && !hasMonsterZoneSpace(ctx.player)) return;
        API.requestChoice({player:ctx.player, kind:'card', title:`${name}：${S.action==='summon'?'特殊召喚する':'手札に加える'}カード`,
          candidates:pool, min:1, max:1, cancelable:false,
          resume:{handler:'s03u156.deck-trigger', args:{player:ctx.player, name, action:S.action, pos:S.pos||'atk'}}, meta:{scriptName:name}});
      },
      afterResolve(){}
    },
    event: ev,
    passive(ctx){ return can(ctx); }
  };
}
