/* S03-U346: seven high-Level monsters with a restricted Tribute / Special Summon (carddata texts).

   邪神ドレッド・ルート  特殊召喚できない。自分フィールドのモンスター3体をリリースした場合のみ通常召喚できる。このカード以外のフィールドのモンスターの攻撃力・守備力は半分になる。
   邪神イレイザー        特殊召喚できない。3体リリースのみ通常召喚できる。攻撃力・守備力は相手フィールドのカードの数×1000。自分メインフェイズに発動できる：このカードを破壊する。破壊され墓地へ送られた場合、フィールドのカードを全て破壊する。
   邪神アバター          特殊召喚できない。3体リリースのみ通常召喚できる。召喚に成功した場合、相手ターンで数えて2ターンの間、相手は魔法・罠カードを発動できない。攻撃力・守備力は「邪神アバター」以外のフィールドの攻撃力が一番高いモンスターの攻撃力＋100。
   堕天使ディザイア      特殊召喚できない。天使族1体のリリースでアドバンス召喚できる。1ターンに1度、自分のメインフェイズに攻撃力を1000ダウンし、相手モンスター1体を墓地へ送る。
   神鳥シムルグ          特殊召喚できない。アドバンス召喚のリリースは風属性のみ。表側表示で存在する限り、お互いはお互いのエンドフェイズ毎に1000ダメージを受ける（魔法・罠カードをコントロールしている数×500少なくなる）。
   黒の魔法神官          通常召喚できない。自分フィールドのレベル6以上の魔法使い族2体をリリースした場合のみ特殊召喚できる。罠カードが発動した時、表側表示で存在する場合、その発動を無効にし破壊できる。
   幻魔皇ラビエル        通常召喚できない。自分フィールドの悪魔族3体をリリースした場合のみ特殊召喚できる。①:1ターンに1度、他の自分のモンスター1体をリリースして発動：ターン終了時まで、リリースしたモンスターの元々の攻撃力分アップ。②:相手がモンスターの召喚に成功した場合、「幻魔トークン」（悪魔族・闇・星1・1000/1000）を特殊召喚する。このトークンは攻撃宣言できない。

   Notes
   - 3-Tribute Normal Summons: normalSummonProcedure with includeStandard false and a single 3-Tribute method (the text's 「3体をリリースして…しなければならない」); the 「特殊召喚できない」 is cannotSpecialSummon. ディザイア / シムルグ: one method with a materialFilter (the Tribute count of the Level stays standard-rule: 2 for Level 7 → one filter-matched pair; ディザイア: includeStandard plus a 1-Tribute Angel method).
   - ドレッド・ルート: continuous mulFinalAtk / mulFinalDef 0.5 (S03-U323). アバター: setAtk / setDef = the highest ATK among the other monsters + 100; the Spell/Trap lock is the turn-ranged activationBanS03 (banActivationS03, S03-U229) on the opponent's next two turns.
   - 黒の魔法神官 answers a Trap Card activation on the chain (a QUICK effect reading the chain top). ラビエル: the token is created by a forced trigger on the opponent's Normal Summon; the token cannot attack (the card flag cannotAttack; a token script would be a registered name missing from the card DB — the gate's 'coverage sees Unified/helper scripts' check). */

function u346Tri3(db){ return {includeStandard:false, methods:[{id:'tribute3', tributes:3, modes:['summon'], summonLabel:'自分フィールドのモンスター3体をリリースして召喚'}]}; }
function u346Others(card){ return API.fieldCards({zone:'mz', filter:x=>x.card!==card && x.card.face==='up'}); }

/* ---- 邪神ドレッド・ルート ---- */
defineScript('邪神ドレッド・ルート', {
  type:'monster', priority:1, cannotSpecialSummon:true,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; }, resolve(){}, afterResolve(){},
  normalSummonProcedure:u346Tri3(),
  continuous:{ scope:'allMonsters', from:['mz'], apply(card, self){ if(!self || self.face!=='up' || card===self) return null; return {mulFinalAtk:0.5, mulFinalDef:0.5}; } }
});

/* ---- 邪神イレイザー ---- */
function u346FoeCards(p){ return API.fieldCards({player:p===0?1:0}).length; }
function u346EraserSent(ctx){
  const e = ctx.event || {}, g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && e.uid!=null && e.uid===ctx.card.uid && !!g && g.from==='mz' && !!g.byDestroy && Number(g.turn)===Number(gameState.turn) && API.fieldCards({}).length>0;
}
defineUnifiedCardV4('邪神イレイザー', [{
  key:'destroy-self', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    return true;
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.destroy(me, '邪神イレイザー'); },
  afterResolve(){}
}, {
  key:'destroyed-wipe', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, speed:1, events:['onSendToGrave'], forced:true,
  condition(ctx){ return u346EraserSent(ctx); },
  operation(){ API.fieldCards({}).slice().forEach(h=>{ const r = resolveTarget(h); if(r && ['mz','sz','field'].indexOf(r.zone)>=0) API.destroy(r, '邪神イレイザー'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, cannotSpecialSummon:true, timing:['free'], activateFrom:['mz','grave'], destroysFieldV46:true,
  normalSummonProcedure:u346Tri3(),
  passive:{ onSendToGrave(ctx){ return u346EraserSent(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self, info){ if(card!==self || self.face!=='up') return null; const n = u346FoeCards(info.p)*1000; return {setAtk:n, setDef:n}; } } });

/* ---- 邪神アバター ---- */
function u346Highest(self){ let m = 0; API.fieldCards({zone:'mz', filter:x=>x.card!==self && x.card.face==='up' && x.db.n!=='邪神アバター'}).forEach(h=>{ m = Math.max(m, curATK(h.card)); }); return m; }
function u346AvatarReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && ctx.eventName==='onNormalSummon' && eventIsSelfS03(ctx); }
defineUnifiedCardV4('邪神アバター', [{
  key:'summon-lock', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return u346AvatarReady(ctx); },
  operation(ctx){
    const t = gameState.turn, mine = gameState.activePlayer===ctx.player;
    const a = mine ? t+1 : t, b = a+2;
    banActivationS03(ctx.opponent, a, a, ['s','t'], '邪神アバター');
    banActivationS03(ctx.opponent, b, b, ['s','t'], '邪神アバター');
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotSpecialSummon:true, timing:['free'], normalSummonProcedure:u346Tri3(),
  passive:{ onNormalSummon(ctx){ return u346AvatarReady(ctx); } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){ if(card!==self || self.face!=='up') return null; const n = u346Highest(self)+100; return {setAtk:n, setDef:n}; } } });

/* ---- 堕天使ディザイア ---- */
function u346Foe(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz'}); }
defineUnifiedCardV4('堕天使ディザイア', [{
  key:'shrink-send', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!u346Foe(ctx).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.modAtk(me, -1000, 0, 'permanent', '堕天使ディザイア'); done(true); },
  operation(ctx){
    const pool = u346Foe(ctx); if(!pool.length) return;
    API.selectCard('堕天使ディザイア：墓地へ送る相手モンスター', pool, t=>{ const r = t && resolveTarget(t); if(r && r.zone==='mz' && r.p===ctx.opponent) API.sendToGrave(r, '堕天使ディザイア'); });
  },
  afterResolve(){}
}], {type:'monster', priority:1, cannotSpecialSummon:true, countLimit:{n:1, effects:['shrink-send']},
  normalSummonProcedure:{ includeStandard:true, methods:[{ id:'angel1', tributes:1, modes:['summon'], summonLabel:'天使族1体をリリースしてアドバンス召喚', materialFilter:(h)=> h.db.ra==='天使' }] } });

/* ---- 神鳥シムルグ ---- */
function u346Stones(p){ return (gameState.players[p].sz||[]).length + (gameState.players[p].field ? 1 : 0); }
function u346SimorghReady(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; }
defineUnifiedCardV4('神鳥シムルグ', [{
  key:'end-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true,
  condition(ctx){ return u346SimorghReady(ctx); },
  operation(){ [0,1].forEach(p=>{ const n = Math.max(0, 1000 - 500*u346Stones(p)); if(n>0) API.damageLP(p, n, '神鳥シムルグ'); }); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, cannotSpecialSummon:true, timing:['free'], passive:{ onEndPhase(ctx){ return u346SimorghReady(ctx); } },
  normalSummonProcedure:{ includeStandard:false, methods:[{ id:'wind', tributes:2, modes:['summon'], summonLabel:'風属性モンスター2体をリリースしてアドバンス召喚', materialFilter:(h)=> h.db.at==='風' }] } });

/* ---- 黒の魔法神官 ---- */
function u346Casters(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='魔法使い' && Number(x.db.lv)>=6}); }
function u346TrapOnChain(){
  const top = gameState.chain && gameState.chain[gameState.chain.length-1];
  if(!top) return false;
  const db = CARD_DB[findCardIndex(top.name)];
  return !!db && db.k==='t';
}
defineUnifiedCardV4('黒の魔法神官', [{
  key:'negate-trap', type:EFFECT_TYPE.QUICK, range:LOCATION.MZONE, speed:2, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(!u346TrapOnChain()){ ctx.reason = '罠カードが発動した時に発動します'; return false; }
    return true;
  },
  operation(){ negatePreviousChainLinkV2('黒の魔法神官', true); },
  afterResolve(){}
}], {type:'monster', priority:2, quickEffect:true, cannotNormalSummon:true, timing:['free','chain'],
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u346Casters(ctx).length<2){ ctx.reason = 'レベル6以上の魔法使い族モンスターが2体必要です'; return false; } return true; },
    cost(ctx, done){ u342PickN('黒の魔法神官：リリースするレベル6以上の魔法使い族', ctx, u346Casters, 2, h=>API.sendToGrave(h, '黒の魔法神官（リリース）'), done); }
  } });

/* ---- 幻魔皇ラビエル ---- */
function u346Fiends(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.ra==='悪魔'}); }
function u346RaviReady(ctx){
  const e = ctx.event || {}, c = e.card, h = c ? locateCardAnyV4(c) : null;
  return ctx.zone==='mz' && ctx.card.face==='up' && !!h && h.zone==='mz' && h.p===ctx.opponent && hasMonsterZoneSpace(ctx.player);
}
defineTokenSpecV11('幻魔トークン', {atk:1000, def:1000, lv:1, ra:'悪魔', at:'闇', pos:'atk'});
defineUnifiedCardV4('幻魔皇ラビエル', [{
  key:'release-boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動できます'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}).length){ ctx.reason = 'リリースする他のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('幻魔皇ラビエル：リリースする自分のモンスター', API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}), t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(!r || r.zone!=='mz' || !me || me.zone!=='mz'){ done(false); return; }
      API.setCardFlag(me, 'u346RaviAtk', Number(dbOf(r.card).atk)||0, '幻魔皇ラビエル', {silent:true});
      API.sendToGrave(r, '幻魔皇ラビエル（リリース）'); done(true);
    });
  },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return; const n = Number(me.card.u346RaviAtk)||0; if(n>0) API.modAtk(me, n, 0, 'endTurn', '幻魔皇ラビエル'); },
  afterResolve(){}
}, {
  key:'token', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ return u346RaviReady(ctx); },
  operation(ctx){
    if(!hasMonsterZoneSpace(ctx.player)) return;
    const uids = API.createTokens(ctx.player, '幻魔トークン', 1) || [];
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz') API.setCardFlag(h, 'cannotAttack', true, '幻魔皇ラビエル', {silent:true}); });   /* the token cannot declare an attack (card flag, until it leaves) */
  },
  afterResolve(){}
}], {type:'monster', priority:1, onOtherSummon:true, cannotNormalSummon:true, includesSpecialSummon:true, timing:['free'], passive:{ onNormalSummon(ctx){ return u346RaviReady(ctx); } },
  countLimit:{n:1, effects:['release-boost']},
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ if(u346Fiends(ctx).length<3){ ctx.reason = '悪魔族モンスターが3体必要です'; return false; } return true; },
    cost(ctx, done){ u342PickN('幻魔皇ラビエル：リリースする悪魔族モンスター', ctx, u346Fiends, 3, h=>API.sendToGrave(h, '幻魔皇ラビエル（リリース）'), done); }
  } });
