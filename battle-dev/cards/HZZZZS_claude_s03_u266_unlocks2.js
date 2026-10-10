/* S03-U266: ENGINE_GAP reasons covered by newer capabilities (2011 texts) — 因幡之白兎, 阿修羅, サーチライトメン, きつね火, ワンショット・ブースター.
   Engine (this unit): SET_MONSTER / SET_ST refuse a player whose temporaryFlags.noSetS03 is this turn (「このターン相手プレイヤーはフィールド上に
   カードをセットする事ができない」); tributeCandidates accepts a function form of the script declaration noAdvanceTributeS03 (S03-U169);
   NORMAL_SUMMON records temporaryFlags.normalSummonSuccessS03 (「自分がモンスターの召喚に成功したターン」 — Normal / Tribute Summons only).
   Reuses: the spirit return of S03-U244 (spiritReturnEffectS03: summonedTurn / flippedTurnS03), attackAllMonstersS03 (engine/1ZQ, S03-U149),
   the attacker-aware continuous.cannotBeAttackedByS03 (engine/1ZU, S03-U264), the script-level canDirectAttack, the battle record (engine/15
   battleAttacksRecordV6, S03-U236), summon procedures. */

/* ---- 因幡之白兎: このカードは特殊召喚できない。召喚・リバースしたターンのエンドフェイズ時に持ち主の手札に戻る。
   相手フィールド上にモンスターが存在する場合、このカードの攻撃は相手プレイヤーへの直接攻撃としなければならない。 ---- */
defineUnifiedCardV4('因幡之白兎', [spiritReturnEffectS03('因幡之白兎')], {type:'monster', priority:1, cannotSpecialSummon:true, canDirectAttack:true,
  passive:{ onEndPhase(ctx){ return spiritReturnDueS03(ctx); } },
  continuous:{scope:'oppMonsters', from:['mz'], apply(){ return null; }, cannotBeAttackTargetBothS03:true,
    cannotBeAttackedByS03(target, attacker, self){ return !!self && attacker===self && self.face==='up'; }}});

/* ---- 阿修羅: このカードは特殊召喚できない。召喚・リバースしたターンのエンドフェイズ時に持ち主の手札に戻る。
   このカードは相手フィールド上に存在する全てのモンスターに1回ずつ攻撃をする事ができる。 ---- */
defineUnifiedCardV4('阿修羅', [spiritReturnEffectS03('阿修羅')], {type:'monster', priority:1, cannotSpecialSummon:true, attackAllMonstersS03:true,
  passive:{ onEndPhase(ctx){ return spiritReturnDueS03(ctx); } }});

/* ---- サーチライトメン: リバース:このターン相手プレイヤーはフィールド上にカードをセットする事ができない。 (a flip effect, forced) ---- */
defineScript('サーチライトメン', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){
    const e = ctx.event;
    if(!e || !(e.card===ctx.card || (e.uid!=null && ctx.card && e.uid===ctx.card.uid))){ ctx.reason = 'リバースした時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.setFlag(ctx.opponent, 'noSetS03', gameState.turn, true); API.log('サーチライトメン：このターン相手はカードをセットできない'); },
  afterResolve(){},
  passive:{ onFlip(ctx){ const e = ctx.event; return !!e && (e.card===ctx.card || (e.uid!=null && ctx.card && e.uid===ctx.card.uid)); } }
});

/* ---- きつね火: フィールド上に表側表示で存在するこのカードが戦闘によって破壊され墓地へ送られたターンのエンドフェイズ時、このカードを墓地から特殊召喚する。
   このカードはフィールド上に表側表示で存在する限り、アドバンス召喚のためにはリリースできない。 (forced; graveInfo {battle, face, turn}) ---- */
function kitsuneDueU266(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  return ctx.zone==='grave' && gameState.phase==='end' && !!g && g.battle===true && g.face==='up' && Number(g.turn)===Number(gameState.turn)
    && Number(ctx.card.u266KitsuneTurn)!==Number(gameState.turn);
}
defineScript('きつね火', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  noAdvanceTributeS03(card){ return !!card && card.face==='up'; },
  condition(ctx){ if(!kitsuneDueU266(ctx)){ ctx.reason = '戦闘破壊されたターンのエンドフェイズに発動します'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='grave') return;
    API.setCardFlag(me, 'u266KitsuneTurn', gameState.turn, 'きつね火', {silent:true});
    const me2 = locateCardAnyV4(ctx.card);
    if(me2 && me2.zone==='grave' && (API.me(ctx).mz||[]).length < ZONE_LIMITS.mz) API.specialSummon(ctx.player, 'grave', me2.index, 'atk', 'きつね火', me2.p);
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return kitsuneDueU266(ctx); } }
});

/* ---- ワンショット・ブースター: 自分がモンスターの召喚に成功したターン、このカードは手札から特殊召喚できる。
   また、このカードをリリースして発動できる。このターン自分のモンスターと戦闘を行った相手モンスター1体を選択して破壊する。 ---- */
function boosterTargetsU266(ctx){
  const rec = (typeof battleAttacksRecordV6==='function') ? battleAttacksRecordV6(gameState) : [];
  const mine = u=>{ const h = u!=null ? findCardByUid(u) : null; return !!h && h.p===ctx.player; };
  const theirs = new Set();
  rec.forEach(x=>{ if(!x) return;
    if(mine(x.attackerUid) && x.defenderUid!=null) theirs.add(x.defenderUid);
    if(mine(x.defenderUid) && x.attackerUid!=null) theirs.add(x.attackerUid); });
  return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.uid!=null && theirs.has(x.card.uid)});
}
defineScript('ワンショット・ブースター', {
  type:'monster', priority:1, targets:true, activateFrom:['mz'],
  summonProcedure:{
    from:['hand'], positions:['atk','def'],
    condition(ctx){ const t = gameState.players[ctx.player].temporaryFlags || {}; if(!t.normalSummonSuccessS03){ ctx.reason = 'このターン自分がモンスターの召喚に成功している必要があります'; return false; } return true; },
    cost(ctx, done){ done(true); }
  },
  condition(ctx){
    const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; }
    if(!boosterTargetsU266(ctx).length){ ctx.reason = 'このターン自分のモンスターと戦闘を行った相手モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz'){ done(false); return; } API.sendToGrave(h, 'ワンショット・ブースター（リリース）'); done(true); },
  selectTargets(ctx, done){ API.selectCard('ワンショット・ブースター：破壊する相手モンスター', boosterTargetsU266(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t); if(r && r.zone==='mz') API.destroy(r, 'ワンショット・ブースター', ctx.player); },
  afterResolve(){}
});
