/* S03-U281: ENGINE_GAP re-check 6 (2011 texts) — エヴォルダー・ディプロドクス, 反撃の毒牙, 古代の機械爆弾, 黒蠍団召集, 連鎖旋風, シャーク・ザ・クルー.
   No engine change in the Sonnet part (the Opus review moved the summon-source record into engine/40). Reuses: the P4 overlay groups (GROUP.EVOLTILE / VENOM / ANCIENT_GEAR / BLACK_SCORPION, groupMemberNowS03 of S03-U161), the Special Summon source record
   (summonSrcS03, S03-U238), the attack-declaration window + API.negateAttack + endBattlePhaseByEffectS03 (S03-U152), the counters API (API.addCounter), the P1.1 multi-target
   activation (activationV11 + p11cOpen / 'p11cards.commit-targets', S03-U269), the effect-destruction event (onDestroy) with the move provenance (API.movedByOpponentEffect,
   P3 / S03-U79), the shared deck trigger (declareDeckTriggerS03, S03-U156) and specialSummonPositionsS03 (S03-U278, the position is chosen by the summoning player).
   All helper names carry the S281 suffix. */

/* The Special Summon source of the 「エヴォルド」 monsters (and of every effect summon during a resolving chain link) is recorded by the engine since the
   Opus review of this unit (API.specialSummon, engine/40: summonSrcS03 from the resolving link when the caller gives none). */
/* ---- エヴォルダー・ディプロドクス: このカードが「エヴォルド」と名のついたモンスターの効果によって特殊召喚に成功した時、相手フィールド上に存在する魔法・罠カード1枚を選択して破壊する。
   (forced trigger of its own Special Summon success; the source is the 「エヴォルド」 monster whose effect summoned it (card.summonSrcS03, this turn). Target: 1 Spell/Trap card on the
   opponent's field (Spell & Trap Zones and the Field Zone, face-up or face-down) chosen at activation; with none, the trigger does not activate.) ---- */
function evoltileNameS281(reason){
  if(!reason || typeof findCardIndex !== 'function' || typeof CARD_DB === 'undefined') return false;
  const i = findCardIndex(String(reason));
  const db = i >= 0 ? CARD_DB[i] : null;
  return !!db && db.k === 'm' && db.n === String(reason) && isCardInGroupV4(db, GROUP.EVOLTILE);
}
function diploEventSelfS281(ctx){
  const e = ctx.event || {};
  if(!ctx.card) return false;
  if(e.card === ctx.card || (e.card && e.card.uid != null && e.card.uid === ctx.card.uid) || (e.uid != null && e.uid === ctx.card.uid)) return true;
  return Array.isArray(e.cards) && e.cards.some(c=>c === ctx.card || (c && c.uid != null && c.uid === ctx.card.uid));
}
function diploSummonedByEvoltileS281(ctx){
  const s = ctx.card && ctx.card.summonSrcS03;
  return !!s && Number(s.turn) === Number(gameState.turn) && evoltileNameS281(s.name);
}
function diploTargetsS281(ctx){ return API.fieldCards({player:ctx.opponent, filter:x=>x.zone === 'sz' || x.zone === 'field'}); }
function diploReadyS281(ctx){
  return ctx.zone === 'mz' && !!ctx.card && ctx.card.face === 'up' && ctx.card.specialSummoned === true && diploEventSelfS281(ctx) && diploSummonedByEvoltileS281(ctx);
}
defineScript('エヴォルダー・ディプロドクス', {
  type:'monster', priority:1, forced:true, targets:true, destroysFieldV46:true,
  condition(ctx){
    if(!diploReadyS281(ctx)){ ctx.reason = '「エヴォルド」と名のついたモンスターの効果によって特殊召喚に成功した時に発動します'; return false; }
    if(!diploTargetsS281(ctx).length){ ctx.reason = '相手フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('エヴォルダー・ディプロドクス：破壊する相手の魔法・罠カード', diploTargetsS281(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const h = t && t.card && t.card.uid != null ? findCardByUid(t.card.uid) : null;
    if(!h || h.p !== ctx.opponent || (h.zone !== 'sz' && h.zone !== 'field')){ API.log('エヴォルダー・ディプロドクス：対象が相手の魔法・罠カードとして存在しない'); return; }
    API.destroy(h, 'エヴォルダー・ディプロドクス', ctx.player);
  },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return diploReadyS281(ctx) && diploTargetsS281(ctx).length > 0; } }
});

/* ---- 反撃の毒牙 (Trap): 自分フィールド上に表側表示で存在する「ヴェノム」と名のついたモンスターが攻撃宣言を受けた時に発動する事ができる。相手モンスター1体の攻撃を無効にし、
   バトルフェイズを終了する。その後、攻撃モンスターにヴェノムカウンターを1つ置く。
   (activation: the opponent's attack declaration whose target is the activator's face-up 「ヴェノム」 monster (GROUP.VENOM, or a card treated as one). Resolution: the attack is
   negated, the Battle Phase ends, and only then — if the attacking monster is still on the field — it gets one Venom Counter. If the attack is no longer the declared attack of that
   monster (it left the field, the attack was already negated), nothing is done. Nothing is targeted.) ---- */
function venomAttackedS281(ctx){
  const a = gameState.pendingAttack;
  if(!a || a.player !== ctx.opponent || a.targetUid == null) return false;
  const h = findCardByUid(a.targetUid);
  return !!(h && h.zone === 'mz' && h.p === ctx.player && h.card.face === 'up' && dbOf(h.card).k === 'm' && groupMemberNowS03(h.card, GROUP.VENOM));
}
defineScript('反撃の毒牙', {
  type:'trap', priority:2,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = 'セットしてから発動します'; return false; }
    if(!venomAttackedS281(ctx)){ ctx.reason = '自分の表側表示の「ヴェノム」モンスターが攻撃宣言を受けた時に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const a = gameState.pendingAttack;
    const atkUid = a ? a.attackerUid : null;
    const h0 = atkUid != null ? findCardByUid(atkUid) : null;
    if(!a || a.player !== ctx.opponent || !h0 || h0.zone !== 'mz' || h0.p !== ctx.opponent){ API.log('反撃の毒牙：攻撃を無効にできる攻撃モンスターがいない'); return; }
    API.negateAttack('反撃の毒牙');
    endBattlePhaseByEffectS03('反撃の毒牙');
    const h = findCardByUid(atkUid);
    if(h && h.zone === 'mz' && h.p === ctx.opponent) API.addCounter(h, 'ヴェノム', 1);
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return ctx.zone === 'sz' && ctx.card.face === 'down' && venomAttackedS281(ctx); } }
});

/* ---- 古代の機械爆弾 (Spell): 自分フィールド上に表側表示で存在する「アンティーク・ギア」と名のついたモンスター1体を対象に発動する事ができる。対象のモンスターを破壊し、
   そのモンスターの元々の攻撃力の半分のダメージを相手ライフに与える。
   (target chosen at activation: one face-up 「アンティーク・ギア」 monster of the activator (GROUP.ANCIENT_GEAR, monsters only). At resolution it must still be that face-up monster on
   the activator's field; it is destroyed and only if it really left the field the opponent takes half its ORIGINAL (printed) ATK, rounded down — as effect damage.) ---- */
function gearTargetsS281(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face === 'up' && x.db.k === 'm' && groupMemberNowS03(x.card, GROUP.ANCIENT_GEAR)});
}
defineScript('古代の機械爆弾', {
  type:'spell', priority:1, targets:true, destroysFieldV46:true,
  condition(ctx){
    if(!gearTargetsS281(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「アンティーク・ギア」モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('古代の機械爆弾：破壊する自分の「アンティーク・ギア」', gearTargetsS281(ctx.player), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const h = t && t.card && t.card.uid != null ? findCardByUid(t.card.uid) : null;
    if(!h || h.zone !== 'mz' || h.p !== ctx.player || h.card.face !== 'up' || dbOf(h.card).k !== 'm' || !groupMemberNowS03(h.card, GROUP.ANCIENT_GEAR)){
      API.log('古代の機械爆弾：対象が表側表示の「アンティーク・ギア」として存在しない'); return;
    }
    const uid = h.card.uid, half = Math.floor((Number(dbOf(h.card).atk) || 0) / 2);
    API.destroy(h, '古代の機械爆弾', ctx.player);
    const now = findCardByUid(uid);
    if(now && now.zone === 'mz'){ API.log('古代の機械爆弾：破壊されなかったためダメージを与えない'); return; }
    if(half > 0) API.damageLP(ctx.opponent, half, '古代の機械爆弾');
  },
  afterResolve(){}
});

/* ---- 黒蠍団召集 (Spell): 自分フィールド上に「首領・ザルーグ」が表側表示で存在する時に発動する事ができる。自分の手札から「黒蠍」という名のついたモンスターカードを全て特殊召喚する事ができる。
   (同名カードは1枚のみ)
   (condition: a face-up 「首領・ザルーグ」 (or a card treated as it) on the activator's field. Nothing is targeted. At resolution the player chooses from the hand which 「黒蠍」 monsters
   (GROUP.BLACK_SCORPION, monsters only) to Special Summon — none to all, at most one per name (a second copy of a name is not offered), at most the number of free Monster Zones —
   and they are summoned together after the position of each is chosen (specialSummonPositionsS03).) ---- */
function zargRefS281(){ return dbOf({id:findCardIndex('首領・ザルーグ')}); }
function zargUpS281(p){
  const ref = zargRefS281();
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face === 'up' && sameCanonicalCardV4(x.card, ref)});
}
function scorpionHandPoolS281(p){
  const seen = new Set(), out = [];
  API.pileCards(p, 'hand', x=>x.db.k === 'm' && groupMemberNowS03(x.card, GROUP.BLACK_SCORPION) && canEffectSpecialSummonS03(x.card, 'hand', '黒蠍団召集')).forEach(x=>{
    const key = String(x.db.n);
    if(seen.has(key)) return;
    seen.add(key); out.push(x);
  });
  return out;
}
defineScript('黒蠍団召集', {
  type:'spell', priority:1, includesSpecialSummon:true,
  condition(ctx){
    if(!zargUpS281(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「首領・ザルーグ」が必要です'; return false; }
    return true;
  },
  resolve(ctx){
    const pool = scorpionHandPoolS281(ctx.player);
    const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length);
    if(!pool.length || !room){ API.log('黒蠍団召集：特殊召喚できる「黒蠍」モンスターが手札にいない、またはモンスターゾーンが空いていない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:`黒蠍団召集：特殊召喚する「黒蠍」モンスター（手札、同名カードは1枚のみ、${Math.min(room, pool.length)}枚まで・選ばなくてもよい）`,
      candidates:pool, min:0, max:Math.min(room, pool.length), cancelable:false,
      resume:{handler:'s03u281.scorpion-pick', args:{player:ctx.player}}, meta:{scriptName:'黒蠍団召集'}});
  },
  afterResolve(){}
});
API.registerChoiceHandler('s03u281.scorpion-pick', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player;
  const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length);
  const names = new Set(), items = [];
  (a.cards || []).filter(y=>y && !y.stale && y.uid != null).forEach(y=>{
    const h = findCardByUid(y.uid);
    if(!h || h.p !== p || h.zone !== 'hand' || dbOf(h.card).k !== 'm' || !groupMemberNowS03(h.card, GROUP.BLACK_SCORPION) || !canEffectSpecialSummonS03(h.card, 'hand', '黒蠍団召集')) return;
    const key = String(dbOf(h.card).n);
    if(names.has(key) || items.length >= room) return;
    names.add(key); items.push({uid:y.uid, from:'hand'});
  });
  if(items.length) specialSummonPositionsS03(p, items, '黒蠍団召集');
});

/* ---- 連鎖旋風 (Trap): 魔法・罠・効果モンスターの効果によってフィールド上に存在するカードが破壊された時、フィールド上に存在する魔法・罠カード2枚を選択して発動する事ができる。
   選択したカードを破壊する。
   (activation: a card on the field was destroyed by a card effect (Spell / Trap / Effect Monster — the onDestroy event of an effect destruction; battle destruction is another event).
   Two targets chosen at activation: Spell/Trap cards on the field (either side, face-up or face-down), not this card. Resolution: each chosen card still there is destroyed.) ---- */
function chainDestroyEventS281(ctx){
  const e = ctx.event || {};
  if(e.reason !== 'effect' || !e.card) return false;
  const mp = e.card.moveProvenance;
  if(mp && mp.reason !== 'effect') return false;
  return true;
}
function chainPoolS281(selfUid){
  return API.fieldCards({filter:x=>(x.zone === 'sz' || x.zone === 'field') && (selfUid == null || x.card.uid !== selfUid)});
}
defineScript('連鎖旋風', {
  type:'trap', priority:2, targets:true, destroysFieldV46:true,
  condition(ctx){
    if(ctx.zone !== 'sz'){ ctx.reason = 'セットしてから発動します'; return false; }
    if(!chainDestroyEventS281(ctx)){ ctx.reason = '魔法・罠・効果モンスターの効果によってフィールド上のカードが破壊された時に発動します'; return false; }
    if(chainPoolS281(ctx.card.uid).length < 2){ ctx.reason = '破壊する魔法・罠カードが2枚必要です（このカードを除く）'; return false; }
    return true;
  },
  activationV11(ctx, d){
    p11cOpen(d, {title:'連鎖旋風：破壊するフィールド上の魔法・罠カード（2枚）', candidates:chainPoolS281(ctx.card.uid), min:2, max:2, targeting:true}, 'p11cards.commit-targets', {});
  },
  resolve(ctx){
    (ctx.selectedTargets || []).slice(0, 2).forEach(t=>{
      const h = t && t.card && t.card.uid != null ? findCardByUid(t.card.uid) : null;
      if(h && (h.zone === 'sz' || h.zone === 'field') && h.card !== ctx.card) API.destroy(h, '連鎖旋風', ctx.player);
    });
  },
  afterResolve(){},
  passive:{ onDestroy(ctx){ return ctx.zone === 'sz' && ctx.card.face === 'down' && chainDestroyEventS281(ctx) && chainPoolS281(ctx.card.uid).length >= 2; } }
});

/* ---- シャーク・ザ・クルー: 自分フィールド上に表側表示で存在するこのカードが相手のカードの効果によって破壊された場合、自分のデッキからレベル4以下の水属性モンスターを2体まで
   自分フィールド上に特殊召喚する事ができる。
   (optional trigger of the shared deck trigger (it left the field face-up to the GY), additionally: destroyed (not just sent to the GY) with the move provenance of an effect whose acting
   player is the opponent. The Deck is examined at resolution; the player chooses 1–2 WATER monsters of Level 4 or lower (free zones), the position of each is chosen by the player
   (specialSummonPositionsS03 — the shared 'faceUp' path would not ask when two are chosen), and they are summoned together.) ---- */
function sharkByFoeEffectS281(ctx){
  const c = ctx.card, g = c && c.graveInfo;
  return !!(g && g.byDestroy && API.movedByOpponentEffect(c, ctx.player));
}
declareDeckTriggerS03('シャーク・ザ・クルー', {when:'fieldToGrave', faceUp:true, action:'summon', optional:true, pos:'faceUp', max:2, filter:{at:'水', lvmax:4},
  extra(ctx){ return sharkByFoeEffectS281(ctx) ? '' : '表側表示のこのカードが相手のカードの効果によって破壊された時に発動できます'; },
  script:{
    resolve(ctx){
      const name = 'シャーク・ザ・クルー', S = DECK_TRIGGER_S03[name];
      const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length);
      if(!room){ API.log(`${name}：モンスターゾーンが空いていない`); return; }
      const pool = deckTriggerPoolS03(name, S, ctx.player);
      if(!pool.length){ API.shuffle(ctx.player); API.log(`${name}：条件を満たすカードがデッキに無い（デッキをシャッフル）`); return; }
      const max = Math.max(1, Math.min(2, pool.length, room));
      API.requestChoice({player:ctx.player, kind:'card', title:`${name}：特殊召喚するレベル4以下の水属性モンスター（デッキ、${max}体まで）`,
        candidates:pool, min:1, max, cancelable:false,
        resume:{handler:'s03u281.shark-pick', args:{player:ctx.player}}, meta:{scriptName:name}});
    }
  }
});
API.registerChoiceHandler('s03u281.shark-pick', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const p = x.player;
  const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length);
  const items = [];
  (a.cards || []).filter(y=>y && !y.stale && y.uid != null).forEach(y=>{
    const h = findCardByUid(y.uid);
    if(!h || h.p !== p || h.zone !== 'deck' || items.length >= 2 || items.length >= room) return;
    const db = dbOf(h.card);
    if(db.k !== 'm' || db.at !== '水' || !(Number(db.lv) <= 4) || !canEffectSpecialSummonS03(h.card, 'deck', 'シャーク・ザ・クルー')) return;
    items.push({uid:y.uid, from:'deck'});
  });
  if(items.length) specialSummonPositionsS03(p, items, 'シャーク・ザ・クルー');
});
