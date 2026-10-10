/* S03-U264: attacker-aware attack restriction + multi-turn lingering effects (2011 texts) — ヒーロー・ヘイロー, エレメント・ソルジャー,
   ネクロ・ディフェンダー, メテオ・レイン, 泉の精霊, 味方殺しの女騎士, 能力調整, D－HERO デビルガイ.
   Engine (this unit): engine/1ZU continuous.cannotBeAttackedByS03(target, attacker, self) — the attacker is passed through
   forcedAttackTargetReasonS03 (engine/1ZR) from its three call sites (engine/30); API.lingerS03(p, card, reason, untilTurn) — a lingering effect
   lasting until a later turn (gs.lingerLongS03, collected for continuous effects and activation locks, pruned at turn start).
   Reuses: controlLockS03 (S03-U251), declareBattleDestroyedNegatorS03 (engine/1S), protectV21 / battleDamage / piercingDamage on lingering sources
   (S03-U257), activationLockS03 (S03-U217 / U259), API.modLevel (S03-U247), the v7 scheduler (engine/16), MOVE banish → mz (a return, not a summon). */

function u264FaceUpOnField(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz' && card.face==='up'; }
function u264AnyFaceUpAttr(attr){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && ((typeof currentAttributeV17==='function') ? currentAttributeV17(x.card) : x.db.at)===attr}).length > 0; }

/* ---- ヒーロー・ヘイロー (Trap): 発動後このカードは装備カードとなり、攻撃力1500以下の戦士族モンスター1体に装備する。
   相手の攻撃力1900以上のモンスターは、装備モンスターを攻撃する事ができない。 ---- */
function haloTargetsU264(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && currentRaceV17(x.card)==='戦士' && curATK(x.card) <= 1500}); }
defineScript('ヒーロー・ヘイロー', {
  type:'trap', priority:2, targets:true, activateFrom:['sz'],
  equipSpec:{ canEquip(h){ return !!(h && h.card && h.card.face==='up' && currentRaceV17(h.card)==='戦士' && curATK(h.card) <= 1500); }, label:'攻撃力1500以下の戦士族のみ' },
  condition(ctx){
    if(ctx.card && ctx.card.equipTo){ ctx.reason = '装備カードとして適用中です'; return false; }
    if(!haloTargetsU264().length){ ctx.reason = '攻撃力1500以下の表側表示の戦士族モンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('ヒーロー・ヘイロー：装備するモンスター', haloTargetsU264(), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
    if(r && r.zone==='mz' && r.card.face==='up' && me && me.zone==='sz') API.equipSpell(me, r, 'ヒーロー・ヘイロー');
  },
  afterResolve(){},
  continuous:{scope:'equippedMonster', from:['sz'], apply(){ return null; },
    cannotBeAttackedByS03(target, attacker, self){ return !!self && !!self.equipTo && target.uid===self.equipTo.uid && curATK(attacker) >= 1900; }}
});

/* ---- エレメント・ソルジャー: フィールド上に特定の属性を持つモンスターが存在する場合、以下の効果を得る。
   ●水属性:このカードのコントロールを変更する事ができない。 ●地属性:このカードが戦闘によって破壊した効果モンスターの効果は無効化される。
   (EARTH: as エレメント・デビル — judged when the destroyed monster's effect resolves) ---- */
defineScript('エレメント・ソルジャー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  controlLockS03(card){ return u264FaceUpOnField(card) && u264AnyFaceUpAttr('水'); }
});
declareBattleDestroyedNegatorS03('エレメント・ソルジャー', {condition(){ return u264AnyFaceUpAttr('地'); }});

/* ---- ネクロ・ディフェンダー: 自分のメインフェイズ時に、墓地に存在するこのカードをゲームから除外し、自分フィールド上のモンスター1体を選択して発動できる。
   次の相手のエンドフェイズ時まで、選択したモンスターは戦闘では破壊されず、選択したモンスターの戦闘によって発生する自分への戦闘ダメージは0になる。
   (the banished card lingers until the next opponent turn — API.lingerS03 with untilTurn) ---- */
function necroUntilU264(self){ return self && Number(self.u264NecroUntil) >= Number(gameState.turn) ? self : null; }
defineScript('ネクロ・ディフェンダー', {
  type:'monster', priority:1, targets:true, activateFrom:['grave'],
  condition(ctx){
    if(ctx.zone!=='grave'){ ctx.reason = '墓地から発動します'; return false; }
    if(gameState.activePlayer!==ctx.player || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz'}).length){ ctx.reason = '自分フィールドにモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='grave'){ done(false); return; } API.banish(h, 'ネクロ・ディフェンダー（コスト）'); done(true); },
  selectTargets(ctx, done){ API.selectCard('ネクロ・ディフェンダー：選択するモンスター', API.fieldCards({player:ctx.player, zone:'mz'}), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
    if(!r || r.zone!=='mz' || !me) return;
    const until = Number(gameState.turn) + 1;   // the next opponent turn (activated in its controller's own Main Phase)
    API.setCardFlag(me, 'u264NecroTarget', ensureCardUid(gameState, r.card), 'ネクロ・ディフェンダー', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u264NecroUntil', until, 'ネクロ・ディフェンダー');
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, 'ネクロ・ディフェンダー', until);
  },
  afterResolve(){},
  continuous:{scope:'self', from:['linger'], apply(){ return null; },
    protectV21:{ key:'ネクロ・ディフェンダー', label:'ネクロ・ディフェンダー', scope:'allMonsters', effect:false,
      battle:(target, self)=> !!necroUntilU264(self) && !!target && target.uid===self.u264NecroTarget },
    battleDamage(info){
      const self = necroUntilU264(info && info.self); if(!self) return info.amount;
      const t = findCardByUid(self.u264NecroTarget); if(!t || t.zone!=='mz') return info.amount;
      if(info.to!==t.p) return info.amount;
      return (info.atkCard===t.card || info.defCard===t.card) ? 0 : info.amount;
    }}
});

/* ---- メテオ・レイン (Trap): このターン自分のモンスターが守備表示モンスターを攻撃した時にその守備力を攻撃力が越えていれば、その数値だけ相手に戦闘ダメージを与える。 ---- */
defineScript('メテオ・レイン', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u264MeteorTurn', gameState.turn, 'メテオ・レイン', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u264MeteorPlayer', ctx.player, 'メテオ・レイン');
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, 'メテオ・レイン');
  },
  afterResolve(){},
  continuous:{scope:'self', from:['linger'], apply(){ return null; },
    piercingDamage(info){
      const s = info && info.self; if(!s || Number(s.u264MeteorTurn)!==Number(gameState.turn)) return 0;
      const a = info.atkCard && findCardByUid(info.atkCard.uid);
      return (a && a.p===Number(s.u264MeteorPlayer)) ? info.amount : 0;
    }}
});

/* ---- 泉の精霊 (Spell): 自分の墓地から装備魔法カード1枚を手札に加える。その装備魔法カードはこのターン発動できない。 ---- */
function fountainPoolU264(p){ return API.pileCards(p, 'grave', x=>x.db.k==='s' && x.db.sub==='装備'); }
defineScript('泉の精霊', {
  type:'spell', priority:1, targets:true,
  condition(ctx){ if(!fountainPoolU264(ctx.player).length){ ctx.reason = '墓地に装備魔法カードがありません'; return false; } return true; },
  selectTargets(ctx, done){ API.selectCard('泉の精霊：手札に加える装備魔法カード', fountainPoolU264(ctx.player), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && locateCardAnyV4(t.card || t);
    if(!h || h.zone!=='grave') return;
    const uid = ensureCardUid(gameState, h.card);
    API.returnToHand(h, '泉の精霊');
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u264FountainUid', uid, '泉の精霊', {silent:true});
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.setCardFlag(me2, 'u264FountainTurn', gameState.turn, '泉の精霊');
    const me3 = locateCardAnyV4(ctx.card); if(me3) API.lingerS03(ctx.player, me3, '泉の精霊');
  },
  afterResolve(){},
  activationLockS03:(i)=> !!i.card && i.card.uid!=null && i.card.uid===i.src.u264FountainUid && Number(i.src.u264FountainTurn)===Number(gameState.turn)
});

/* ---- 味方殺しの女騎士: 自分のスタンバイフェイズ毎に、このカードを除く自分のフィールド上モンスター1体を生け贄に捧げなければ、このカードを破壊する。
   (forced at its controller's Standby Phase; release another own monster, or this card is destroyed — the controller chooses) ---- */
function knightOthersU264(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card}); }
function knightReadyU264(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && gameState.phase==='standby' && gameState.activePlayer===ctx.player; }
registerChoiceHandlerV49('s03u264.knight-upkeep', (answer, args)=>{
  if(!answer || answer.cancelled || !args) return;
  const key = String((answer.keys && answer.keys[0]) || 'destroy');
  if(key.indexOf('rel')===0){
    const h = findCardByUid(Number(key.slice(3)));
    if(h && h.zone==='mz' && h.p===args.player && h.card.uid!==args.uid){ API.sendToGrave(h, '味方殺しの女騎士（リリース）'); return; }
  }
  const me = findCardByUid(args.uid);
  if(me && me.zone==='mz') API.destroy(me, '味方殺しの女騎士', args.player);
});
defineScript('味方殺しの女騎士', {
  type:'monster', priority:1, forced:true, activateFrom:['mz'],
  condition(ctx){ if(!knightReadyU264(ctx)){ ctx.reason = '自分のスタンバイフェイズに処理します'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz') return;
    const others = knightOthersU264(ctx);
    if(!others.length){ API.destroy(me, '味方殺しの女騎士', ctx.player); return; }
    API.requestChoice({player:ctx.player, kind:'option', cancelable:false, min:1, max:1, title:'味方殺しの女騎士：維持',
      candidates:others.map(m=>({key:'rel'+ensureCardUid(gameState, m.card), value:'rel'+m.card.uid, label:`${m.card.face==='up' ? cardName(m.card) : '裏側表示モンスター'} をリリースする`}))
        .concat([{key:'destroy', value:'destroy', label:'リリースせずにこのカードを破壊する'}]),
      resume:{handler:'s03u264.knight-upkeep', args:{player:ctx.player, uid:ensureCardUid(gameState, me.card)}}, meta:{scriptName:'味方殺しの女騎士'}});
  },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return knightReadyU264(ctx); } }
});

/* ---- 能力調整 (Spell): 自分フィールド上に表側表示で存在する全てのモンスターのレベルをエンドフェイズ時まで1つ下げる。 (those present at resolution) ---- */
defineScript('能力調整', {
  type:'spell', priority:1,
  condition(ctx){ if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; } return true; },
  resolve(ctx){
    const uids = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}).map(x=>x.card.uid);
    uids.forEach(u=>{ const h = findCardByUid(u); if(h && h.zone==='mz' && h.card.face==='up') API.modLevel(h, -1, 'endPhase', '能力調整'); });
  },
  afterResolve(){}
});

/* ---- D－HERO デビルガイ: このカードが自分フィールド上に表側攻撃表示で存在する場合、1ターンに1度だけ相手モンスター1体をゲームから除外する事ができる。
   この効果を使用したプレイヤーはこのターン戦闘を行えない。この効果によって除外したモンスターは、2回目の自分のスタンバイフェイズ時に同じ表示形式で
   相手フィールド上に戻る。 (no battle: this card lingers with continuous.cannotAttack for its controller's monsters; the return is scheduled (engine/16) and is a
   MOVE banish → Monster Zone, not a summon; with no free zone the monster goes to the GY) ---- */
registerScheduleHandlerV7('s03u264.devilguy-return', (args)=>{
  const h = args && args.uid!=null ? findCardByUid(args.uid) : null;
  if(!h || h.zone!=='banish') return;
  const P = gameState.players[h.p];
  if((P.mz||[]).length >= ZONE_LIMITS.mz){ act({type:'MOVE', player:h.p, from:'banish', fromIndex:h.index, to:'grave', face:'up'}); return; }
  act({type:'MOVE', player:h.p, from:'banish', fromIndex:h.index, to:'mz', face:args.face||'up', pos:args.pos||'atk'});
  API.log(`D－HERO デビルガイ：${cardName(findCardByUid(args.uid).card)} がフィールドに戻った`);
});
defineScript('D－HERO デビルガイ', {
  type:'monster', priority:1, targets:true, countLimit:1, activateFrom:['mz'],
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || ctx.card.pos!=='atk'){ ctx.reason = '表側攻撃表示で存在する場合に発動します'; return false; }
    if(!API.fieldCards({player:ctx.opponent, zone:'mz'}).length){ ctx.reason = '相手フィールドにモンスターがいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('D－HERO デビルガイ：除外する相手モンスター', API.fieldCards({player:ctx.opponent, zone:'mz'}), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card);
    if(me){ API.setCardFlag(me, 'u264DevilTurn', gameState.turn, 'D－HERO デビルガイ', {silent:true});
      const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'D－HERO デビルガイ'); }
    if(!r || r.zone!=='mz' || r.p!==ctx.opponent) return;
    const uid = ensureCardUid(gameState, r.card), face = r.card.face, pos = r.card.pos;
    API.banish(r, 'D－HERO デビルガイ');
    const b = findCardByUid(uid);
    if(b && b.zone==='banish') API.schedule({at:'standbyPhase', turns:4, player:ctx.player, handler:'s03u264.devilguy-return',
      args:{uid, face, pos}, source:ctx.card, note:'D－HERO デビルガイ'});
  },
  afterResolve(){},
  continuous:{scope:'ownMonsters', from:['mz','linger'], apply(){ return null; },
    cannotAttack(card, self){ return !!self && Number(self.u264DevilTurn)===Number(gameState.turn); }}
});
