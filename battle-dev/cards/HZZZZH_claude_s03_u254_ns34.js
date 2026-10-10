/* S03-U254: NOT_STARTED cards (2011 texts) — 棘の妖精, D・バインド, 絶対服従魔人, ワーム・イーロキン, ニトロ・シンクロン.
   Engine unchanged. Reuses: continuous.cannotBeAttackTarget (engine/1ZU), continuous.cannotAttack / cannotChangePosition (engine/19 v10),
   dsTiming:'end' forced triggers (ゴロゴル pattern), declareBattleDestroyedNegatorS03 (engine/1S), the grave-source battleDamage / protectV21 hooks
   with a turn + battle-uid flag on the used card (クリボー, S03-U153 / バリア・リゾネーター), the 「シンクロ素材として墓地へ送られた」 helpers c8SynchroIs
   (cards/C1), API.changePosition + API.flip (ミドル・シールド・ガードナー).
   Groups: 「D」 = GROUP.D_MORPHTRONIC (exact passcode list in the overlay; setcode 4140 is NOT exact — it also holds ガジェット・アームズ etc.; D－HERO / ブレンD /
   ダブルツールD&C are not members); 「墓守の」 = SETCODE.GRAVEKEEPER (exactly the 墓守の-named cards, monsters used here);
   「BF」 = SETCODE.BLACKWING (monsters: exactly the BF－-named cards); 「ワーム」 = SETCODE.WORM (setcode_exact in the overlay).
   「ニトロ」 has no group: a Synchro Monster whose name contains 「ニトロ」 (only ニトロ・ウォリアー in 2011). 
   S03-U254 correction (parent): シャブティのお守り / BF－蒼天のジェット were dropped from this unit — their GY-source continuous effects pushed
   graveContinuousNamesV29() past the System v29 budget asserted by tools/test_grave_continuous_v29.js (≤ 20); they need a turn-scoped
   lingering-effect primitive instead. The helper wormTargetsS03 was renamed eloquinWormTargetsS03 (it overrode スクラップ・ワーム's, cards/HZZR). */

/* ---- 棘の妖精: 相手はこのカードを破壊しない限り、昆虫族モンスターを攻撃できない。
   このカードと戦闘を行ったモンスターは、ダメージステップ終了時に守備表示になる。
   (①: while it is face-up, the opponent cannot choose a face-up Insect monster of its controller as an attack target — the lock ends when this card leaves;
    a face-down monster has no race. ②: forced, at the end of the Damage Step; also applies when this card was destroyed in that battle) ---- */
defineScript('棘の妖精', {
  type:'monster', priority:1, forced:true, dsTiming:'end',
  condition(ctx){
    const o = a9BattleFoe(ctx);
    if(!o){ ctx.reason = 'このカードが戦闘を行った場合に処理します'; return false; }
    const h = locateCardAnyV4(o);
    if(!h || h.zone !== 'mz'){ ctx.reason = '戦闘した相手が場にいません'; return false; }
    if(h.card.face === 'up' && h.card.pos === 'def'){ ctx.reason = '既に表側守備表示です'; return false; }
    if(h.card.face === 'down'){ ctx.reason = '裏側表示です'; return false; }
    return true;
  },
  resolve(ctx){
    const o = a9BattleFoe(ctx);
    const h = o && locateCardAnyV4(o);
    if(h && h.zone === 'mz' && !(h.card.face === 'up' && h.card.pos === 'def')) API.changePosition(h, 'def', '棘の妖精');
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){
    const o = a9BattleFoe(ctx);
    if(!o) return false;
    const h = locateCardAnyV4(o);
    return !!(h && h.zone === 'mz' && h.card.face === 'up' && h.card.pos !== 'def'); } },
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget(target, self){
      if(!self || self.face !== 'up' || !target || target.face !== 'up') return false;
      return dbOf(target).ra === '昆虫';
    } }
});

/* ---- D・バインド (Continuous Trap): 自分フィールド上に「D」と名のついたモンスターが存在する限り、相手フィールド上のレベル4以上のモンスターは
   攻撃宣言できず、表示形式の変更もできない。
   (face-up Level 4+ monsters only — a face-down monster has no Level; the D monster must be face-up on the controller's field) ---- */
function dMonsterOnFieldS03(p){
  return (gameState.players[p].mz || []).some(c => c && c.face === 'up' && dbOf(c).k === 'm' && isCardInGroupV4(dbOf(c), GROUP.D_MORPHTRONIC));
}
function dBindLocksS03(target, self){
  if(!self || self.face !== 'up' || !target || target.face !== 'up') return false;
  const me = locateCard(self); if(!me) return false;
  if(!dMonsterOnFieldS03(me.p)) return false;
  return curLV(target) >= 4;
}
defineScript('D・バインド', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(){ API.log('D・バインド：相手のレベル4以上のモンスターは攻撃宣言・表示形式の変更ができない'); },
  afterResolve(){},
  continuous:{ scope:'oppMonsters', from:['sz'], apply(){ return null; },
    cannotAttack(target, self){ return dBindLocksS03(target, self); },
    cannotChangePosition(target, self){ return dBindLocksS03(target, self); } }
});

/* ---- 絶対服従魔人: 自分フィールド上にこのカードだけしかなく、手札が0枚でなければこのカードは攻撃できない。
   このカードが破壊した効果モンスターの効果は無効化される。
   (read as: it may attack only while it is the only card on its controller's field (monster, Spell/Trap and Field Zones) AND that player has 0 cards in hand) ---- */
declareBattleDestroyedNegatorS03('絶対服従魔人', {});
function soleCardNoHandS03(card){
  const h = locateCard(card); if(!h || h.zone !== 'mz') return false;
  const P = gameState.players[h.p];
  const cnt = (P.mz || []).filter(Boolean).length + (P.sz || []).filter(Boolean).length + (P.field ? 1 : 0);
  return cnt === 1 && (P.hand || []).length === 0;
}
defineScript('絶対服従魔人', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotAttack(card, self){ return card === self && !soleCardNoHandS03(self); } }
});

/* ---- ワーム・イーロキン: このカードは特殊召喚できない。1ターンに1度、フィールド上の「ワーム」と名のついた爬虫類族モンスター1体を選択して裏側守備表示にする事ができる。
   (ignition, Main Phase, targets one face-up 「ワーム」 Reptile monster on either side — itself included; once per turn) ---- */
function eloquinWormTargetsS03(){
  return API.fieldCards({ zone:'mz', filter:x => x.card.face === 'up' && x.db.k === 'm' && x.db.ra === '爬虫類' && isSetCardV4(x.db, SETCODE.WORM) });
}
defineScript('ワーム・イーロキン', {
  type:'monster', priority:1, countLimit:1, targets:true, cannotSpecialSummon:true, activateFrom:['mz'], timing:['mainPhase'],
  condition(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(!me || me.zone !== 'mz' || me.card.face !== 'up'){ ctx.reason = '表側表示で存在する必要があります'; return false; }
    if(!(gameState.activePlayer === ctx.player && (gameState.phase === 'main1' || gameState.phase === 'main2'))){
      ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!eloquinWormTargetsS03().length){ ctx.reason = '対象にできる「ワーム」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('ワーム・イーロキン：裏側守備表示にする「ワーム」', eloquinWormTargetsS03(), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    let r = t && resolveTarget(t);
    if(!r || r.zone !== 'mz' || r.card.face !== 'up' || !isSetCardV4(dbOf(r.card), SETCODE.WORM) || dbOf(r.card).ra !== '爬虫類') return;
    if(r.card.pos !== 'def') API.changePosition(r, 'def', 'ワーム・イーロキン');
    r = locateCardAnyV4(r.card);
    if(r && r.zone === 'mz' && r.card.face === 'up') API.flip(r, 'down', 'ワーム・イーロキン');
  },
  afterResolve(){}
});

/* ---- ニトロ・シンクロン: このカードが「ニトロ」と名のついたシンクロモンスターのシンクロ召喚に使用され墓地へ送られた場合、自分のデッキからカードを1枚ドローする。
   (forced trigger from the GY; the Synchro Monster must still be on the field to read its name — cards/C1 c8SynchroIs) ---- */
const nitroSynchroS03 = d => !!d && String(d.n || '').indexOf('ニトロ') >= 0 && (d.st || []).includes('シンクロ');
defineScript('ニトロ・シンクロン', {
  type:'monster', priority:1, forced:true, activateFrom:['grave'],
  condition(ctx){
    if(!c8SynchroIs(ctx, nitroSynchroS03)){ ctx.reason = '「ニトロ」と名のついたシンクロモンスターの素材になった場合に発動します'; return false; }
    if(!API.me(ctx).deck.length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onSendToGrave(ctx){ return !!c8SynchroIs(ctx, nitroSynchroS03) && API.me(ctx).deck.length > 0; } }
});
