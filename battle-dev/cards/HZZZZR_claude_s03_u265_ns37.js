/* S03-U265: NOT_STARTED cards (2011 texts) — アームズ・ホール, 暗黒界に続く結界通路, ネオフレムベル・ガルーダ, ジェネクス・ガイア, ウィード, エーリアン・サイコ.
   (ドラグニティ－ジャベリン needs an engine change — a destruction replacement that equips to a chosen monster — and is left to the parent.)
   Reuses: 光の援軍 (cost: millTop; search choice), 黒魔術のカーテン / スケープ・ゴート (noSummonS03 + noSpecialSummon, declareActivationNegatedReleaseS03),
   死者蘇生 (targeted GY summon), 古代の機械工兵 / 氷結界の虎将 (forced / End Phase trigger + selectTargets), 寡黙なるサイコプリースト (summon → Defense),
   ルシファー (continuous.cannotAttack), engine/1ZV destroySubstituteS03 (kind destroyOwn). */

/* ---- アームズ・ホール: このカードを発動するターン、自分は通常召喚できない。①:デッキの一番上のカードを墓地へ送って発動できる。自分のデッキ・墓地から装備魔法カード1枚を
   選んで手札に加える。 (read as スケープ・ゴート: the turn's Normal Summon / Set must not have been used; the cost mills the top card and consumes the Normal Summon right —
   MANUAL_TOGGLE_NORMAL_RIGHT_V43 is the journaled Action for it, so Normal Summon and Set are both locked until the end of the turn) ---- */
function armsHoleEquipsS265(p){
  const deckOk = !(typeof deckToHandLockReasonV32==='function' && deckToHandLockReasonV32(p));
  return [].concat(deckOk ? API.pileCards(p, 'deck', x=>x.db.k==='s' && x.db.sub==='装備') : [], API.pileCards(p, 'grave', x=>x.db.k==='s' && x.db.sub==='装備'));
}
registerChoiceHandlerV49('s03u265.arms-hole', (answer, args)=>{
  if(!answer || !args) return;
  const pick = (answer.cards||[])[0], h = pick && pick.uid!=null ? findCardByUid(pick.uid) : null;
  if(!h || h.p!==args.player) return;
  if(h.zone==='deck') API.searchDeck(args.player, h.index, 'アームズ・ホール');
  else if(h.zone==='grave') API.returnToHand(h, 'アームズ・ホール');
});
defineScript('アームズ・ホール', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).normalSummonUsed){ ctx.reason = 'このターン既に通常召喚（セット）を行っています'; return false; }
    if(!(API.me(ctx).deck||[]).length){ ctx.reason = 'デッキにカードがありません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.millTop(ctx.player, 1, 'アームズ・ホール（コスト）');
    if(!API.me(ctx).normalSummonUsed) act({type:'MANUAL_TOGGLE_NORMAL_RIGHT_V43', player:ctx.player});
    done(true);
  },
  resolve(ctx){
    const pool = armsHoleEquipsS265(ctx.player);
    if(!pool.length){ API.log('アームズ・ホール：デッキ・墓地に装備魔法カードがない'); return; }
    API.requestChoice({player:ctx.player, kind:'card', title:'アームズ・ホール：手札に加える装備魔法カード（デッキ・墓地）', candidates:pool, min:1, max:1, cancelable:false,
      resume:{handler:'s03u265.arms-hole', args:{player:ctx.player}}, meta:{scriptName:'アームズ・ホール'}});
  },
  afterResolve(){}
});

/* ---- 暗黒界に続く結界通路 (Quick-Play): 自分の墓地に存在する「暗黒界」と名のついたモンスター1体を選択して特殊召喚する。このカードを発動するターン、自分は召喚・反転召喚・
   特殊召喚する事はできない。 (as 黒魔術のカーテン: nothing may have been summoned this turn; the lock applies after this card's own Special Summon) ---- */
function kekkaiTargetsS265(p){ return API.pileCards(p, 'grave', x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.DARK_WORLD) && canEffectSpecialSummonS03(x.card, 'grave', '暗黒界に続く結界通路')); }
function kekkaiLockS265(p){ API.setFlag(p, 'noSummonS03', '暗黒界に続く結界通路', true); API.setFlag(p, 'noSpecialSummon', true, true); }
defineScript('暗黒界に続く結界通路', {
  type:'quick-play', priority:2, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    const P = API.me(ctx);
    if((P.ssHistory||[]).length || (P.temporaryFlags && P.temporaryFlags.summonedThisTurnS03)){ ctx.reason = 'このターン既にモンスターを召喚・反転召喚・特殊召喚しています'; return false; }
    if(!kekkaiTargetsS265(ctx.player).length){ ctx.reason = '墓地に特殊召喚できる「暗黒界」モンスターがいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('暗黒界に続く結界通路：特殊召喚する「暗黒界」モンスター', kekkaiTargetsS265(ctx.player), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', '暗黒界に続く結界通路');
    kekkaiLockS265(ctx.player);
  },
  afterResolve(){}
});
declareActivationNegatedReleaseS03('暗黒界に続く結界通路', {noSpecialSummonWhileChained:true});

/* ---- ネオフレムベル・ガルーダ: 自分のエンドフェイズ時、自分フィールド上にこのカード以外の「フレムベル」と名のついたモンスターが存在する場合、相手の墓地のカード1枚を選択して
   ゲームから除外する。 (forced — no 「できる」; the target is chosen when the trigger is put on the chain) ---- */
function garudaReadyS265(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && gameState.phase==='end' && gameState.activePlayer===ctx.player; }
function garudaFlamvellS265(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && isSetCardV4(x.db, SETCODE.FLAMVELL)}).length>0; }
function garudaTargetsS265(ctx){ return API.pileCards(ctx.opponent, 'grave'); }
defineScript('ネオフレムベル・ガルーダ', {
  type:'monster', priority:1, forced:true, targets:true,
  condition(ctx){
    if(!garudaReadyS265(ctx)){ ctx.reason = '自分のエンドフェイズに処理します'; return false; }
    if(!garudaFlamvellS265(ctx)){ ctx.reason = '自分フィールドにこのカード以外の「フレムベル」モンスターがいません'; return false; }
    if(!garudaTargetsS265(ctx).length){ ctx.reason = '相手の墓地にカードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ネオフレムベル・ガルーダ：除外する相手の墓地のカード', garudaTargetsS265(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='grave' && r.p===ctx.opponent) API.banish(r, 'ネオフレムベル・ガルーダ');
  },
  afterResolve(){},
  passive:{ onEndPhase(ctx){ return garudaReadyS265(ctx) && garudaFlamvellS265(ctx) && garudaTargetsS265(ctx).length>0; } }
});

/* ---- ジェネクス・ガイア: フィールド上に表側表示で存在するこのカードが破壊される場合、代わりに自分フィールド上に表側表示で存在する「ジェネクス・コントローラー」1体を破壊できる。
   (engine/1ZV: chosen by the controller at the destruction; the substitute is another card, never the protected card itself) ---- */
defineScript('ジェネクス・ガイア', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter:c=>cardName(c)==='ジェネクス・コントローラー'}
});

/* ---- ウィード: フィールド上に表側表示で存在するこのカードが破壊される場合、代わりにこのカード以外の自分フィールド上に表側表示で存在する植物族モンスター1体を破壊できる。 ---- */
defineScript('ウィード', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  destroySubstituteS03:{kind:'destroyOwn', causes:['battle','effect'], filter:c=>currentRaceV17(c)==='植物'}
});

/* ---- エーリアン・サイコ: このカードは召喚・反転召喚に成功した場合守備表示になる。このカードがフィールド上に表側表示で存在する限り、Aカウンターが乗ったモンスターは攻撃宣言を
   する事ができない。 (the first is forced; the second is a continuous effect over both fields) ---- */
function psychoSummonedS265(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || !eventIsSelfS03(ctx)) return false;
  return ctx.eventName==='onNormalSummon' || (ctx.eventName==='onFlip' && !!(ctx.event && ctx.event.flipSummon));
}
defineUnifiedCardV4('エーリアン・サイコ', [{
  key:'to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onFlip'], forced:true,
  condition(ctx){ return psychoSummonedS265(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up' && h.card.pos==='atk') API.changePosition(h, 'def', 'エーリアン・サイコ'); },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true,
  passive:{ onNormalSummon(ctx){ return psychoSummonedS265(ctx); }, onFlip(ctx){ return psychoSummonedS265(ctx); } },
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack(target, self){ return !!target && !!self && self.face==='up' && !!target.counters && Number(target.counters['A'])>0; } } });
