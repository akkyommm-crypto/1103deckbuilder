/* S03-U148: デュアル (Gemini) batch 3 on the U119 capability (defineGeminiS03, cards/HO). 2011 texts (project carddata).

   水面のアレサ          ●このカードが戦闘によって相手モンスターを破壊し墓地へ送った時、相手の手札をランダムに1枚捨てる。
   竜影魚レイ・ブロント  ●このカードの元々の攻撃力は2300になる。このカードは攻撃した場合、バトルフェイズ終了時に守備表示になる。
                         次の自分のターン終了時までこのカードは表示形式を変更できない。  (the ゴブリン突撃部隊 pattern, cards/B0)
   炎妖蝶ウィルプス      ●このカードをリリースし、「炎妖蝶ウィルプス」以外の自分の墓地のデュアルモンスター1体を対象として発動できる。
                         そのモンスターを特殊召喚する。この効果で特殊召喚したモンスターはもう1度召喚された状態として扱う。
   地獄の門番イル・ブラッド ●1ターンに1度、手札・自分または相手の墓地に存在するアンデット族モンスター1体を特殊召喚する事ができる。
                         このカードがフィールド上から離れた時、この効果で特殊召喚したアンデット族モンスターを破壊する。
   魔族召喚師            ●1ターンに1度、自分のメインフェイズ時に発動できる。手札または自分・相手の墓地から悪魔族モンスター1体を選んで
                         特殊召喚する。このカードがフィールド上から離れた時、この効果で特殊召喚した悪魔族モンスターを全て破壊する。

   イル・ブラッド / 魔族召喚師: the summoned monster carries `s03SummonedByUid` (zone-local, engine/00 ZONE_LOCAL_KEYS: it is
   forgotten when that monster leaves the field). When the summoner leaves the field face-up, a forced trigger destroys every
   monster on the field still carrying its uid. The flag is only ever written by the Gemini effect, so the summoner had its
   effects when the flag was set. (Not handled: the summoner turned face-down and face-up again before leaving — it would no
   longer have the effect but its old flags remain.) The monster is chosen at resolution (no target). */

/* ---- 水面のアレサ ---- */
function u148AresaKilled(ctx){
  if(ctx.zone!=='mz' || ctx.step!=='leave') return null;
  const foe = a6DestroyedFoeInBattle(ctx);
  if(!foe) return null;
  const h = locateCardAnyV4(foe);
  return (h && h.zone==='grave') ? foe : null;
}
defineGeminiS03('水面のアレサ', {
  type:'monster', priority:1, forced:true, dsTiming:'leave',
  condition(ctx){
    if(!u148AresaKilled(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊し墓地へ送った時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ if(API.foe(ctx).hand.length) v80DiscardRandom(ctx.opponent, 1, '水面のアレサ', ctx.player); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!u148AresaKilled(ctx); } }
});

/* ---- 竜影魚レイ・ブロント ---- */
defineGeminiS03('竜影魚レイ・ブロント', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card.attacked){ ctx.reason = '攻撃した場合に処理します'; return false; }
    if((Number(ctx.card.b0DefLockUntil)||0) >= gameState.turn){ ctx.reason = '既に処理しています'; return false; }
    return true;
  },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz') return;
    API.changePosition(me, 'def', '竜影魚レイ・ブロント');
    API.setCardFlag(me, 'b0DefLockUntil', gameState.turn + 2, '竜影魚レイ・ブロント');
  },
  afterResolve(){},
  passive:{ onBattlePhaseEnd(ctx){ return ctx.zone==='mz' && !!ctx.card.attacked && (Number(ctx.card.b0DefLockUntil)||0) < gameState.turn; } },
  continuous:{ scope:'self', from:['mz'],
    apply(card, self){ return card===self ? {setBaseAtk:2300} : null; },
    cannotChangePosition(target, self){ const me = self || target; return gameState.turn <= (Number(me && me.b0DefLockUntil)||0); } }
});

/* ---- 炎妖蝶ウィルプス ---- */
function u148WillpsPool(ctx){
  return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.n!=='炎妖蝶ウィルプス' && isGeminiS03(x.card)
    && canEffectSpecialSummonS03(x.card, 'grave', '炎妖蝶ウィルプス'));
}
defineGeminiS03('炎妖蝶ウィルプス', {
  type:'monster', priority:1, targets:true, timing:['mainPhase'], includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(!u148WillpsPool(ctx).length){ ctx.reason = '墓地に特殊召喚できる「炎妖蝶ウィルプス」以外のデュアルモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone!=='mz'){ done(false); return; }
    API.sendToGrave(me, '炎妖蝶ウィルプス（リリース）');
    done(true);
  },
  selectTargets(ctx, done){ API.selectCard('炎妖蝶ウィルプス：特殊召喚するデュアルモンスター', u148WillpsPool(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.p!==ctx.player || r.zone!=='grave' || !isGeminiS03(r.card)) return;
    const c = r.card;
    if(!API.specialSummon(ctx.player, 'grave', r.index, 'atk', '炎妖蝶ウィルプス')) return;
    const now = locateCardAnyV4(c);
    if(now && now.zone==='mz') API.setCardFlag(now, 'dualUp', true, '炎妖蝶ウィルプス');
  },
  afterResolve(){}
});

/* ---- 地獄の門番イル・ブラッド / 魔族召喚師 ---- */
function u148SummonPool(ctx, race){
  const ok = x=>x.db.k==='m' && x.db.ra===race && canEffectSpecialSummonS03(x.card, x.zone, ctx.card ? dbOf(ctx.card).n : null);
  const out = [];
  API.pileCards(ctx.player, 'hand', x=>x.db.k==='m' && x.db.ra===race).forEach(x=>{ if(ok(Object.assign({zone:'hand'},x))) out.push(x); });
  [ctx.player, ctx.opponent].forEach(p=>API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra===race).forEach(x=>{ if(ok(Object.assign({zone:'grave'},x))) out.push(x); }));
  return out;
}
API.registerChoiceHandler('s03u148.gatekeeper-summon', (answer, x)=>{
  if(!answer || answer.cancelled || !x) return;
  const t = (answer.cards || []).filter(y=>y && !y.stale && y.card)[0];
  const h = t && locateCardAnyV4(t.card);
  if(!h || (h.zone!=='hand' && h.zone!=='grave')) return;
  const p = x.player, name = x.name, src = x.src;
  if(!hasMonsterZoneSpace(p)) return;
  const c = h.card;
  if(!API.specialSummon(p, h.zone, h.index, 'atk', name, h.p)) return;
  const now = locateCardAnyV4(c);
  const me = findCardByUid(src);
  if(now && now.zone==='mz' && me && me.zone==='mz') API.setCardFlag(now, 's03SummonedByUid', src, name);
});
function u148DefineGatekeeper(name, race){
  defineUnifiedCardV4(name, [{
    key:'summon', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    condition(ctx){
      if(!geminiActiveS03(ctx.card)){ ctx.reason = 'もう1度召喚された状態でのみ有効です'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(!u148SummonPool(ctx, race).length){ ctx.reason = `手札・墓地に特殊召喚できる${race}族モンスターがいません`; return false; }
      return true;
    },
    operation(ctx){
      const cands = u148SummonPool(ctx, race);
      if(!cands.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.requestChoice({player:ctx.player, kind:'card', title:`${name}：特殊召喚する${race}族モンスター`, candidates:cands, min:1, max:1,
        cancelable:false, resume:{handler:'s03u148.gatekeeper-summon', args:{player:ctx.player, name, src:ensureCardUid(gameState, ctx.card)}},
        meta:{scriptName:name}});
    },
    afterResolve(){}
  },{
    key:'leave', type:EFFECT_TYPE.TRIGGER, range:LOCATION.ALL, speed:1, events:['onLeaveField'], forced:true,
    condition(ctx){ return u148GatekeeperLeft(ctx); },
    operation(ctx){
      const src = ctx.card.uid;
      [0,1].forEach(p=>API.fieldCards({player:p, zone:'mz', filter:x=>x.card && x.card.s03SummonedByUid===src}).map(x=>x.card).forEach(c=>{
        const h = locateCardAnyV4(c); if(h && h.zone==='mz') API.destroy(h, name);
      }));
    },
    afterResolve(){}
  }],{type:'monster', priority:1, timing:['mainPhase'], includesSpecialSummon:true, countLimit:{n:1, effects:['summon']},
    activateFrom:['mz','grave','banish','hand','deck','ex'],
    passive:{ onLeaveField(ctx){ return u148GatekeeperLeft(ctx); } }});
}
function u148GatekeeperLeft(ctx){
  const e = ctx.event || {};
  if(!eventIsSelfS03(ctx) || e.fromZone!=='mz' || e.fromFace!=='up') return false;
  const src = ctx.card && ctx.card.uid;
  return src!=null && API.fieldCards({zone:'mz', filter:x=>x.card && x.card.s03SummonedByUid===src}).length > 0;
}
u148DefineGatekeeper('地獄の門番イル・ブラッド', 'アンデット');
u148DefineGatekeeper('魔族召喚師', '悪魔');
