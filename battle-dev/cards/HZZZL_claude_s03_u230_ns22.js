/* S03-U230: NOT_STARTED cards (2011 texts) — ヒーローズルール2, 極星將テュール, ヴォルカニック・カウンター, 黒魔導の執行官, 守護神エクゾード, 地縛神の咆哮. */

/* ---- ヒーローズルール2 (Counter Trap): 墓地のカードを対象とする効果モンスターの効果・魔法・罠カードの発動を無効にし破壊する。 ---- */
function heroRule2LinkS03(ctx){
  const e = ctx.event || {};
  const l = (gameState.chain||[])[Number(e.chainLink)-1];
  if(!l) return null;
  if((e.kind==='spell' || e.kind==='trap') && l.cardActivationS03!==true) return null;
  if(e.kind!=='spell' && e.kind!=='trap' && e.kind!=='monster') return null;
  const ts = typeof linkTargetUidsS03==='function' ? linkTargetUidsS03(l) : [];
  return ts.some(u=>{ const h = findCardByUid(u); return !!h && h.zone==='grave'; }) ? l : null;
}
defineScript('ヒーローズルール2', {
  type:'trap', priority:3,
  condition(ctx){ if(!heroRule2LinkS03(ctx)){ ctx.reason = '墓地のカードを対象とする発動に対して発動します'; return false; } return true; },
  resolve(ctx){ API.negateChainLink(ctx.event, 'activation', 'ヒーローズルール2', true); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return ctx.zone==='sz' && !!heroRule2LinkS03(ctx); } }
});
declareActivationResponseS03(['ヒーローズルール2']);

/* ---- 極星將テュール: フィールド上にこのカード以外の「極星」と名のついたモンスターが表側表示で存在しない場合、このカードを破壊する。
   このカードがフィールド上に表側表示で存在する限り、相手は「極星將テュール」以外の「極星」と名のついたモンスターを攻撃対象に選択する事はできない。 ---- */
function nordicMonsterS03(c){ const d = dbOf(c); return !!d && d.k==='m' && String(cardName(c)).indexOf('極星')===0; }
defineScript('極星將テュール', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  selfDestroyWhenS03:(card)=> ![0,1].some(q=>(gameState.players[q].mz||[]).some(c=>c && c!==card && c.face==='up' && nordicMonsterS03(c))) ? '極星將テュール：他の「極星」モンスターが存在しないため破壊' : false,
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && target!==self && cardName(target)!=='極星將テュール' && nordicMonsterS03(target) }
});

/* ---- ヴォルカニック・カウンター: このカードが墓地に存在し、自分が戦闘ダメージを受けた時に発動する。墓地のこのカードをゲームから除外し、自分の墓地に
   「ヴォルカニック・カウンター」以外の炎属性モンスターが存在する場合、自分が受けた戦闘ダメージと同じ数値のダメージを相手ライフに与える。 (forced) ---- */
function vCounterReadyS03(ctx){ const e = ctx.event || {}; return ctx.zone==='grave' && e.player===ctx.player && Number(e.delta)<0 && e.cause==='battle'; }
defineScript('ヴォルカニック・カウンター', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){ if(ctx.eventName!=='onLPChange' || !vCounterReadyS03(ctx)){ ctx.reason = '墓地に存在し、自分が戦闘ダメージを受けた時に発動します'; return false; } return true; },
  resolve(ctx){
    const me = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null;
    if(!me || me.zone!=='grave') return;
    API.banish(me, 'ヴォルカニック・カウンター');
    const other = API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && x.db.at==='炎' && x.db.n!=='ヴォルカニック・カウンター').length>0;
    const dmg = Math.abs(Number((ctx.event||{}).delta)||0);
    if(other && dmg>0) API.damageLP(ctx.opponent, dmg);
  },
  afterResolve(){},
  passive:{ onLPChange(ctx){ return vCounterReadyS03(ctx); } }
});

/* ---- release-a-monster summon procedure: 「自分フィールド上に存在する「X」1体をリリースした場合のみ特殊召喚する事ができる」 ---- */
function releaseProcedureS03(name, test, label){ return {
  from:'hand', positions:['atk','def'],
  condition(ctx){ if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && !x.card.cannotTribute && test(x.card)}).length){ ctx.reason = label + '1体をリリースする必要があります'; return false; } return true; },
  cost(ctx, done){ API.selectCard(name + '：リリースする' + label, API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && !x.card.cannotTribute && test(x.card)}), t=>{
    const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, name + '（特殊召喚の手順）'); done(true); }); }
}; }

/* ---- 黒魔導の執行官: このカードは通常召喚できない。自分フィールド上に存在する「ブラック・マジシャン」1体をリリースした場合のみ特殊召喚する事ができる。
   このカードがフィールド上に表側表示で存在する限り、自分または相手が通常魔法カードを発動する度に、相手ライフに1000ポイントダメージを与える。 (forced) ---- */
function enforcerNormalSpellS03(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && ctx.card.face==='up' && e.kind==='spell' && e.sub==='normal'; }
defineScript('黒魔導の執行官', {
  type:'monster', priority:1, forced:true,
  summonProcedure: releaseProcedureS03('黒魔導の執行官', c=>cardName(c)==='ブラック・マジシャン', '「ブラック・マジシャン」'),
  condition(ctx){ if(ctx.eventName!=='onActivateSuccess' || !enforcerNormalSpellS03(ctx)){ ctx.reason = '通常魔法カードが発動した時に発動します'; return false; } return true; },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000); },
  afterResolve(){},
  passive:{ onActivateSuccess(ctx){ return enforcerNormalSpellS03(ctx); } }
});

/* ---- 守護神エクゾード: このカードは通常召喚できない。自分フィールド上に存在する「スフィンクス」と名のついたモンスター1体をリリースした場合のみ特殊召喚する事ができる。
   このカードがフィールド上に表側表示で存在する限り、地属性モンスターが反転召喚に成功した時、相手ライフに1000ポイントダメージを与える。 (forced; either player's Flip Summon) ---- */
function exodeEarthFlipS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || e.flipSummon!==true) return false;
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  return !!(h && h.zone==='mz' && h.card!==ctx.card && currentAttributeV17(h.card)==='地');
}
defineScript('守護神エクゾード', {
  type:'monster', priority:1, forced:true, onOtherFlipS03:true,
  summonProcedure: releaseProcedureS03('守護神エクゾード', c=>String(cardName(c)).indexOf('スフィンクス')>=0, '「スフィンクス」'),
  condition(ctx){ if(ctx.eventName!=='onFlip' || !exodeEarthFlipS03(ctx)){ ctx.reason = '地属性モンスターが反転召喚に成功した時に発動します'; return false; } return true; },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000); },
  afterResolve(){},
  passive:{ onFlip(ctx){ return exodeEarthFlipS03(ctx); } }
});

/* ---- 地縛神の咆哮 (Continuous Trap): 相手モンスターの攻撃宣言時、攻撃モンスターの攻撃力が自分フィールド上に表側表示で存在する「地縛神」と名のついたモンスターの攻撃力より
   低い場合、その攻撃モンスター1体を破壊し、破壊したモンスターの攻撃力の半分のダメージを相手ライフに与える。この効果は1ターンに1度しか使用できない。 (forced) ---- */
function roarReadyS03(ctx){
  if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up' || ctx.card.activationPending) return null;
  const a = gameState.pendingAttack; if(!a || a.player!==ctx.opponent) return null;
  const h = findCardByUid(a.attackerUid); if(!h || h.zone!=='mz') return null;
  const ebs = (gameState.players[ctx.player].mz||[]).filter(c=>c && c.face==='up' && String(cardName(c)).indexOf('地縛神')===0);
  return (ebs.length && ebs.some(c=>curATK(h.card) < curATK(c))) ? h : null;
}
defineScript('地縛神の咆哮', {
  type:'trap', priority:2, fieldIgnition:true, forced:true, countLimit:1,
  condition(ctx){
    if(ctx.zone!=='sz' || !ctx.card || ctx.card.face!=='up') return true;                /* the card activation */
    if(!roarReadyS03(ctx)){ ctx.reason = '相手モンスターの攻撃宣言時、攻撃力が「地縛神」より低い場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    const h = roarReadyS03(ctx) || (function(){ const a = gameState.pendingAttack; return a ? findCardByUid(a.attackerUid) : null; })();
    if(!h || h.zone!=='mz') return;
    const atk = curATK(h.card), mark = API.destroyMarkS03(), uid = ensureCardUid(gameState, h.card);
    API.destroy(h, '地縛神の咆哮');
    /* S03-U294: damage only if it was destroyed, after any substitute decision (engine/1ZZO) */
    API.afterDestroyS03('s03u294.if-destroyed-lp', {mark, uids:[uid], to:ctx.opponent, n:Math.floor(Math.max(0, atk)/2), op:'damage'});
  },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return !!roarReadyS03(ctx); } }
});
