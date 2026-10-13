/* S03-U333: six 「ジェネクス」 cards (carddata texts; 「ジェネクス」 = a monster whose name contains ジェネクス).

   A・ジェネクス・アクセル     (S) 1ターンに1度、手札を1枚捨てる事で、自分の墓地のレベル4以下の機械族モンスター1体を選択して特殊召喚する。この効果で特殊召喚したモンスターの攻撃力はエンドフェイズ時まで倍になり、相手プレイヤーに
                              直接攻撃する事はできず、自分のエンドフェイズ時にゲームから除外される。
   A・ジェネクス・ケミストリ   (Tuner) 属性を1つ宣言し、このカードを手札から捨てて発動できる。自分フィールド上の「ジェネクス」と名のついたモンスター1体を選択し、その属性を宣言した属性にする。この効果は相手ターンでも発動できる。
   A・ジェネクス・トライアーム (S) このカードのシンクロ素材としたチューナー以外のモンスターの属性によって、以下の効果を1ターンに1度、手札を1枚捨てて発動できる。●風:相手の手札をランダムに1枚墓地へ送る。●水:フィールド上の魔法・罠カード1枚を
                              選択して破壊する。●闇:フィールド上の光属性モンスター1体を選択して破壊し、デッキからカードを1枚ドローする。
   レアル・ジェネクス・クロキシアン (S) このカードがシンクロ召喚に成功した時、相手フィールド上のレベルが一番高いモンスター1体のコントロールを得る。
   レアル・ジェネクス・ヴィンディカイト (S) 相手はこのカードを攻撃対象に選択できない。このカードが戦闘によって相手モンスターを破壊した場合、デッキから「ジェネクス」と名のついたモンスター1体を手札に加える事ができる。
   ジオ・ジェネクス            (S) 1ターンに1度、自分フィールド上にレベル4以下の「ジェネクス」と名のついたモンスターが存在する限り、このカードの元々の攻撃力と元々の守備力をエンドフェイズ時まで入れ替える事ができる。

   Notes
   - アクセル: the discard is the cost; the revived monster is stamped (card flag u333AxelTurn = turn): its ATK doubles until the End Phase (a modifier equal to its current ATK), it cannot attack directly (アクセル' continuous cannotDirectAttack while アクセル is face-up) and a schedule banishes it at my End Phase (if still on the field).
   - ケミストリ: a Quick Effect from the hand (either player's turn): the Attribute is declared at resolution, then my face-up 「ジェネクス」 is chosen; the new Attribute is a permanent characteristic modifier (API.setAttribute).
   - トライアーム: the Attributes of the non-Tuner Synchro Materials are read from the materials the Synchro Summon recorded on the card (v380SummonMaterials); the three effects share the once-per-turn limit and each costs a hand card.
   - クロキシアン: forced Synchro Summon success trigger; ties for the highest Level are chosen by the controller; permanent control change. ヴィンディカイト: continuous cannotBeAttackTarget + the optional search after a battle kill. ジオ: API.swapBaseStats until the End Phase.
   - Left: ベルフレイム (counters from another player's Graveyard removals), リバイバー (a negated activation event), レアル・ジェネクス・オラクル, スペア / コントローラー (Normal). */

function u333Gx(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('ジェネクス')>=0; }
function u333Up(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up'; }
function u333Main(ctx){ return ctx.player===gameState.activePlayer && (gameState.phase==='main1' || gameState.phase==='main2'); }
function u333SelfSynchro(ctx){ return u333Up(ctx) && s03SelfSynchroSummonedU121(ctx); }

/* ---- アクセル ---- */
function u333GraveMachine(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && x.db.ra==='機械' && (x.db.lv||99)<=4); }
API.registerScheduleHandler('u333.axel-banish', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(h && h.zone==='mz' && Number(h.card.u333AxelTurn)===Number(args.turn)) API.banish(h, 'A・ジェネクス・アクセル（エンドフェイズ）');
});
defineUnifiedCardV4('A・ジェネクス・アクセル', [{
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'], targetRange:LOCATION.GRAVE, targetSide:'self',
  condition(ctx){
    if(!u333Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u333Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!(API.me(ctx).hand||[]).length){ ctx.reason = '捨てる手札がありません'; return false; }
    if(!u333GraveMachine(ctx.player).length){ ctx.reason = '墓地にレベル4以下の機械族モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('A・ジェネクス・アクセル：捨てる手札', API.pileCards(ctx.player, 'hand'), t=>{
      const r = t && resolveTarget(t);
      if(!r || r.zone!=='hand'){ done(false); return; }
      API.discard(ctx.player, r.index, 'A・ジェネクス・アクセル（コスト）'); done(true);
    });
  },
  target(ctx, done){ API.selectCard('A・ジェネクス・アクセル：特殊召喚する墓地の機械族（レベル4以下）', u333GraveMachine(ctx.player), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='grave' || r.p!==ctx.player || !hasMonsterZoneSpace(ctx.player)) return;
    const u = r.card.uid != null ? r.card.uid : ensureCardUid(gameState, r.card);
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'A・ジェネクス・アクセル');
    const now = findCardByUid(u);
    if(!now || now.zone!=='mz') return;
    API.setCardFlag(now, 'u333AxelTurn', gameState.turn, 'A・ジェネクス・アクセル', {silent:true});
    const n = curATK(now.card); if(n>0) API.modAtk(now, n, 0, 'endTurn', 'A・ジェネクス・アクセル');
    API.schedule({at:'endPhase', turns:0, player:ctx.player, handler:'u333.axel-banish', args:{uid:u, turn:gameState.turn}, note:'A・ジェネクス・アクセル'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, includesSpecialSummon:true, countLimit:{n:1, effects:['revive']},
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotDirectAttack(card, self){ return !!self && self.face==='up' && Number(card.u333AxelTurn)===Number(gameState.turn); } }});

/* ---- ケミストリ ---- */
API.registerChoiceHandler('u333.attr-declare', (answer, args)=>{
  const picked = (answer && answer.cards || [])[0], attr = picked ? String(picked.value) : '';
  const pool = API.fieldCards({player:args.player, zone:'mz', filter:x=>x.card.face==='up' && u333Gx(x.db)});
  if(!attr || !pool.length) return;
  API.requestChoice({kind:'card', title:'A・ジェネクス・ケミストリ：属性を変える「ジェネクス」', candidates:pool, min:1, max:1, cancelable:false,
    resume:{handler:'u333.attr-apply', args:{player:args.player, attr}}});
});
API.registerChoiceHandler('u333.attr-apply', (answer, args)=>{
  const picked = v49P1ChoiceCards(answer)[0], h = picked && locateCardAnyV4(picked.card);
  if(h && h.zone==='mz' && h.card.face==='up' && h.p===args.player) API.setAttribute(h, String(args.attr), 'permanent', 'A・ジェネクス・ケミストリ');
});
defineUnifiedCardV4('A・ジェネクス・ケミストリ', [{
  key:'discard-attr', type:EFFECT_TYPE.QUICK, range:LOCATION.HAND, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から発動します'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && u333Gx(x.db)}).length){ ctx.reason = '自分フィールドに表側表示の「ジェネクス」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ const i = (API.me(ctx).hand||[]).indexOf(ctx.card); if(i<0){ done(false); return; } API.discard(ctx.player, i, 'A・ジェネクス・ケミストリ（コスト）'); done(true); },
  operation(ctx){
    v49P1Open(ctx, {kind:'declare', title:'A・ジェネクス・ケミストリ：属性を宣言', candidates:['闇','光','地','水','炎','風'].map((v,i)=>({key:'a'+i,label:v,value:v})), min:1, max:1}, 'u333.attr-declare', {}, false);
  },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, activateFrom:['hand'], timing:['free','chain']});

/* ---- トライアーム ---- */
function u333MatAttrs(card){
  /* the Synchro Summon records the materials (name / Tuner / Level / Attribute) on the Synchro Monster (v380SummonMaterials, S03-U147) */
  const out = [];
  (Array.isArray(card && card.v380SummonMaterials) ? card.v380SummonMaterials : []).forEach(m=>{ if(m && !m.tuner && m.at && out.indexOf(m.at)<0) out.push(m.at); });
  return out;
}
function u333TriReady(ctx, attr){
  if(!u333Up(ctx) || !u333Main(ctx) || !(API.me(ctx).hand||[]).length) return false;
  return u333MatAttrs(ctx.card).indexOf(attr)>=0;
}
function u333TriCost(ctx, done){
  API.selectCard('A・ジェネクス・トライアーム：捨てる手札', API.pileCards(ctx.player, 'hand'), t=>{
    const r = t && resolveTarget(t);
    if(!r || r.zone!=='hand'){ done(false); return; }
    API.discard(ctx.player, r.index, 'A・ジェネクス・トライアーム（コスト）'); done(true);
  });
}
function u333TriEffect(key, attr, label, extra){
  return Object.assign({ key, type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
    condition(ctx){
      if(!u333TriReady(ctx, attr)){ ctx.reason = label+'：シンクロ素材にした'+attr+'属性のモンスターが必要です（メインフェイズ・手札あり）'; return false; }
      return extra.ok(ctx) ? true : (ctx.reason = extra.why, false);
    },
    cost:u333TriCost, afterResolve(){} }, extra.def);
}
defineUnifiedCardV4('A・ジェネクス・トライアーム', [
  u333TriEffect('wind', '風', '風', {
    ok:ctx=>(gameState.players[ctx.opponent].hand||[]).length>0, why:'相手の手札がありません',
    def:{ operation(ctx){ const h = gameState.players[ctx.opponent].hand||[]; if(h.length) API.sendHandToGrave(ctx.opponent, duelRandomInt(h.length, gameState), 'A・ジェネクス・トライアーム'); } } }),
  u333TriEffect('water', '水', '水', {
    ok:ctx=>API.fieldCards({}).some(x=>x.zone==='sz' || x.zone==='field'), why:'フィールド上に魔法・罠カードがありません',
    def:{ targetRange:LOCATION.ONFIELD, targetSide:'both',
      target(ctx, done){ API.selectCard('A・ジェネクス・トライアーム：破壊する魔法・罠カード', API.fieldCards({}).filter(x=>x.zone==='sz' || x.zone==='field'), t=>done([t])); },
      operation(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && (r.zone==='sz' || r.zone==='field')) API.destroy(r, 'A・ジェネクス・トライアーム'); } } }),
  u333TriEffect('dark', '闇', '闇', {
    ok:ctx=>API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && currentAttributeV17(x.card)==='光'}).length>0, why:'フィールド上に光属性モンスターがいません',
    def:{ targetRange:LOCATION.MZONE, targetSide:'both',
      target(ctx, done){ API.selectCard('A・ジェネクス・トライアーム：破壊する光属性モンスター', API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && currentAttributeV17(x.card)==='光'}), t=>done([t])); },
      operation(ctx){
        const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
        if(r && r.zone==='mz' && r.card.face==='up'){ API.destroy(r, 'A・ジェネクス・トライアーム'); API.draw(ctx.player, 1, 'A・ジェネクス・トライアーム'); }
      } } })
], {type:'monster', priority:1, targets:true, countLimit:{n:1, effects:['wind','water','dark']}});

/* ---- クロキシアン ---- */
function u333Highest(ctx){
  const all = API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up'});
  const mx = all.reduce((m,x)=>Math.max(m, curLV(x.card)), 0);
  return all.filter(x=>curLV(x.card)===mx);
}
defineUnifiedCardV4('レアル・ジェネクス・クロキシアン', [{
  key:'take-highest', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ return u333SelfSynchro(ctx) && u333Highest(ctx).length>0 && hasMonsterZoneSpace(ctx.player); },
  operation(ctx){
    const pool = u333Highest(ctx); if(!pool.length || !hasMonsterZoneSpace(ctx.player)) return;
    const go = t=>{ const r = t && (t.card ? t : resolveTarget(t)); const h = r && locateCardAnyV4(r.card); if(h && h.zone==='mz' && h.p===ctx.opponent && hasMonsterZoneSpace(ctx.player)) API.changeControl(h, ctx.player, 'レアル・ジェネクス・クロキシアン', 'permanent'); };
    if(pool.length===1){ go(pool[0]); return; }
    API.selectCard('レアル・ジェネクス・クロキシアン：コントロールを得るレベルが一番高いモンスター', pool, go);
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, timing:['free'], passive:{ onSpecialSummon(ctx){ return u333SelfSynchro(ctx) && u333Highest(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } }});

/* ---- ヴィンディカイト ---- */
function u333Killed(ctx){
  const b = ctx.battle || {};
  if(b.atkCard===ctx.card && b.destroyedDef && b.defCard) return b.defCard;
  if(b.defCard===ctx.card && b.destroyedAtk && b.atkCard) return b.atkCard;
  return null;
}
function u333DeckGx(p){ return API.pileCards(p, 'deck', x=>u333Gx(x.db)); }
defineUnifiedCardV4('レアル・ジェネクス・ヴィンディカイト', [{
  key:'kill-search', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'],
  condition(ctx){ return u333Up(ctx) && !!u333Killed(ctx) && u333DeckGx(ctx.player).length>0; },
  operation(ctx){
    const pool = u333DeckGx(ctx.player); if(!pool.length) return;
    API.selectCard('レアル・ジェネクス・ヴィンディカイト：手札に加える「ジェネクス」', pool, t=>{
      const r = t && resolveTarget(t);
      if(r && r.zone==='deck' && r.p===ctx.player && u333Gx(dbOf(r.card))){ API.searchDeck(ctx.player, r.index, 'レアル・ジェネクス・ヴィンディカイト'); API.shuffle(ctx.player); }
    });
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['free'], dsTiming:'after', passive:{ onDamageStep(ctx){ return u333Up(ctx) && !!u333Killed(ctx) && u333DeckGx(ctx.player).length>0; } },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, cannotBeAttackTarget(target, self){ return !!self && target===self && self.face==='up'; } }});

/* ---- ジオ ---- */
defineUnifiedCardV4('ジオ・ジェネクス', [{
  key:'swap-base', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u333Up(ctx)){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u333Main(ctx)){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && u333Gx(x.db) && (x.db.lv||99)<=4}).length){ ctx.reason = '自分フィールドにレベル4以下の「ジェネクス」がいません'; return false; }
    return true;
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.swapBaseStats(me, 'endPhase', 'ジオ・ジェネクス'); },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:{n:1, effects:['swap-base']}});
