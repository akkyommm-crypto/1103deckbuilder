/* S03-U243: NOT_STARTED cards (2011 texts) — ワンショット・キャノン, ベビー・トラゴン, シャインエルフ, スクラップ・ビースト, ミラー・レディバグ, カラクリ忍者 参参九.
   Reuses: detachCostS03 (S03-U114), API.grantDirectAttack (journaled, turn-stamped), onOtherSummon (opponent's summons), v4RegisterStatModifier with RESET.LEAVE|RESET.FACE_DOWN,
   graveInfo.srcUidS03 (S03-U208), onBattlePhaseEnd (S03-U236), selfDestroyWhenS03 (S03-U227), LEVEL_MOD_V16 (API.setLevel), summonProcedure, mustAttack / canDirectAttack,
   API.changePosition (notifies カラクリ). 「スクラップ」 is the setcode SETCODE.SCRAP (data/setcode_overlay_v4.json); it covers exactly the 21 cards whose names contain スクラップ.
   「カラクリ」 has no card-pool setcode use here (the position change goes through API.changePosition). Xyz Monsters have a Rank, not a Level: they are never "Level 1 monsters"
   (ベビー・トラゴン) and add nothing to the Level total (ミラー・レディバグ). */

function isXyzDbS03U243(db){ return !!db && (db.st||[]).indexOf('エクシーズ')>=0; }
function summonedMonstersS03U243(ctx){
  const e = ctx.event || {};
  const list = (Array.isArray(e.cards) && e.cards.length) ? e.cards : [e.card || {uid:e.uid}];
  return list.map(c=>{ const u = c && c.uid!=null ? c.uid : null; return u!=null ? findCardByUid(u) : null; }).filter(h=>h && h.zone==='mz' && h.card.face==='up');
}

/* ---- ワンショット・キャノン: 「ワンショット・ロケット」＋チューナー以外のモンスター1体。1ターンに1度、自分のメインフェイズ時に発動できる。
   フィールド上に表側表示で存在するモンスター1体を選択して破壊し、そのコントローラーに破壊したモンスターの攻撃力の半分のダメージを与える。
   (Main Phase 1 or 2; the ATK is read when it is destroyed (resolution), the damage goes to the controller at that time; no damage when the monster was not destroyed;
   half of the ATK rounded down) ---- */
function cannonPoolS03U243(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
defineUnifiedCardV4('ワンショット・キャノン', [{
  key:'destroy-half-damage', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!cannonPoolS03U243().length){ ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('ワンショット・キャノン：破壊するモンスター', cannonPoolS03U243(), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(!r || r.zone!=='mz' || r.card.face!=='up') return;
    const uid = ensureCardUid(gameState, r.card), atk = Math.max(0, curATK(r.card)), ctrl = r.p;
    const mark = API.destroyMarkS03();
    API.destroy(r, 'ワンショット・キャノン');
    /* S03-U294: damage only if it was destroyed, after any substitute decision (engine/1ZZO) */
    API.afterDestroyS03('s03u294.if-destroyed-lp', {mark, uids:[uid], to:ctrl, n:Math.floor(atk/2), op:'damage'});
  },
  afterResolve(){}
}], {type:'monster', priority:1, countLimit:1, timing:['mainPhase'], targets:true, destroysFieldV46:true});

/* ---- ベビー・トラゴン: レベル1モンスター×3。自分のメインフェイズ1でこのカードのエクシーズ素材を1つ取り除き、自分フィールド上に表側表示で存在するレベル1のモンスター1体を
   選択して発動する事ができる。選択したモンスターは相手プレイヤーに直接攻撃する事ができる。
   (the grant is API.grantDirectAttack — turn-stamped and journaled; Xyz Monsters have no Level) ---- */
function tragonPoolS03U243(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && !isXyzDbS03U243(x.db) && curLV(x.card)===1});
}
defineUnifiedCardV4('ベビー・トラゴン', [{
  key:'detach-direct-attack', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || gameState.phase!=='main1'){ ctx.reason = '自分のメインフェイズ1に発動します'; return false; }
    if(!(ctx.card.xyz||[]).length){ ctx.reason = 'X素材がありません'; return false; }
    if(!tragonPoolS03U243(ctx).length){ ctx.reason = '自分フィールドに表側表示のレベル1モンスターがいません'; return false; }
    return true;
  },
  detachCostS03:{count:1, reason:'ベビー・トラゴン（コスト）',
    targets(ctx){ return {title:'ベビー・トラゴン：直接攻撃できるようにするレベル1モンスター', candidates:tragonPoolS03U243(ctx)}; }},
  target(ctx, done){ API.selectCard('ベビー・トラゴン：直接攻撃できるようにするレベル1モンスター', tragonPoolS03U243(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.p===ctx.player && r.card.face==='up' && !isXyzDbS03U243(dbOf(r.card)) && curLV(r.card)===1) API.grantDirectAttack(r);
  },
  afterResolve(){}
}], {type:'xyz', priority:1, timing:['mainPhase'], targets:true});

/* ---- シャインエルフ: レベル2モンスター×2。相手がモンスターの召喚・特殊召喚に成功した時、このカードのエクシーズ素材を1つ取り除いて発動できる。
   そのモンスターの攻撃力は500ポイントダウンする。
   (optional trigger on the opponent's Normal / Special Summon, never on the controller's own; the decrease lasts while the monster is face-up on the field;
   if several monsters were special summoned at once, the first one still face-up is the "that monster") ---- */
function elfSummonedS03U243(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return null;
  const e = ctx.event || {};
  if(e.player!==ctx.opponent || !(ctx.eventName==='onNormalSummon' || ctx.eventName==='onSpecialSummon')) return null;
  const l = summonedMonstersS03U243(ctx).filter(h=>h.p===ctx.opponent);
  return l.length ? l[0] : null;
}
defineUnifiedCardV4('シャインエルフ', [{
  key:'summon-atk-down', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon','onSpecialSummon'],
  condition(ctx){
    if(!elfSummonedS03U243(ctx)){ ctx.reason = '相手がモンスターの召喚・特殊召喚に成功した時に発動します'; return false; }
    if(!(ctx.card.xyz||[]).length){ ctx.reason = 'X素材がありません'; return false; }
    return true;
  },
  detachCostS03:{count:1, reason:'シャインエルフ（コスト）'},
  operation(ctx){
    const h = elfSummonedS03U243(ctx);
    if(!h) return;
    v4RegisterStatModifier(h, {atk:-500}, {controller:ctx.player, code:'シャインエルフ -500', targetCard:h.card, resetMask:RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'xyz', priority:1, onOtherSummon:true,
     passive:{ onNormalSummon:ctx=>!!elfSummonedS03U243(ctx), onSpecialSummon:ctx=>!!elfSummonedS03U243(ctx) }});

/* ---- スクラップ・ビースト: ①フィールド上に表側守備表示で存在するこのカードが攻撃対象に選択された場合、バトルフェイズ終了時にこのカードを破壊する。
   ②このカードが「スクラップ」と名のついたカードの効果によって破壊され墓地へ送られた場合、「スクラップ・ビースト」以外の自分の墓地に存在する「スクラップ」と名のついたモンスター1体を
   選択して手札に加える事ができる。
   (① the position is read when it is selected (the attack declaration) and kept in a journaled card flag, so a later position change does not matter; the destruction is its own effect, so
   the 「スクラップ」 source of ② is this card itself — ② then applies to that destruction too) ---- */
function scrapBeastDestroyedS03U243(ctx){
  const g = ctx.card && ctx.card.graveInfo;
  if(!(g && g.byDestroy && !g.battle && Number(g.turn)===Number(gameState.turn) && g.srcUidS03!=null)) return false;
  const s = findCardByUid(g.srcUidS03);
  return !!(s && isSetCardV4(dbOf(s.card), SETCODE.SCRAP));
}
function scrapBeastTargetsS03U243(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.card!==ctx.card && x.db.k==='m' && isSetCardV4(x.db, SETCODE.SCRAP) && x.db.n!=='スクラップ・ビースト'); }
function scrapBeastSelectedS03U243(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || ctx.card.pos!=='def') return false;
  const a = gameState.pendingAttack;
  return !!a && a.targetUid!=null && a.targetUid===ensureCardUid(gameState, ctx.card);
}
defineUnifiedCardV4('スクラップ・ビースト', [{
  key:'mark-attacked', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return scrapBeastSelectedS03U243(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.setCardFlag(h, 'scrapBeastTargetedS03U243', gameState.turn, 'スクラップ・ビースト', {silent:true}); },
  afterResolve(){}
},{
  key:'bp-end-destroy', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onBattlePhaseEnd'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && Number(ctx.card.scrapBeastTargetedS03U243)===Number(gameState.turn); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz') API.destroy(h, 'スクラップ・ビースト'); },
  afterResolve(){}
},{
  key:'retrieve-scrap', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['onSendToGrave'],
  condition(ctx){
    if(ctx.zone!=='grave' || !eventIsSelfS03(ctx) || !scrapBeastDestroyedS03U243(ctx)){ ctx.reason = '「スクラップ」の効果で破壊され墓地へ送られた場合に発動します'; return false; }
    if(!scrapBeastTargetsS03U243(ctx).length){ ctx.reason = '墓地に他の「スクラップ」モンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('スクラップ・ビースト：手札に加える「スクラップ」モンスター', scrapBeastTargetsS03U243(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && h.p===ctx.player) API.returnToHand(h, 'スクラップ・ビースト');
  },
  afterResolve(){}
}], {type:'monster', priority:1, targets:true, activateFrom:['grave'],
     passive:{ onSendToGrave(ctx){ return ctx.zone==='grave' && eventIsSelfS03(ctx) && scrapBeastDestroyedS03U243(ctx) && scrapBeastTargetsS03U243(ctx).length>0; } }});

/* ---- ミラー・レディバグ: 自分フィールド上に表側表示でモンスターが1体以上存在し、自分の墓地にモンスターが存在しない場合、このカードは手札から特殊召喚する事ができる。
   この効果で特殊召喚に成功した時、このカードのレベルはこのカード以外の自分フィールド上に存在するモンスターのレベルを合計したレベルになる。
   また、フィールド上に表側表示で存在するこのカードのレベルが12を超えた場合、このカードを破壊する。
   (a summon procedure: no chain; the Level is set once, permanently, when it is summoned that way — only face-up non-Xyz monsters carry a Level) ---- */
function ladybugOthersS03U243(p, self){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card!==self && x.card.face==='up' && x.db.k==='m' && !isXyzDbS03U243(x.db)}); }
function ladybugProcSummonedS03U243(ctx){
  const e = ctx.event || {};
  return ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && eventIsSelfS03(ctx) && e.kind==='procedure';
}
defineUnifiedCardV4('ミラー・レディバグ', [{
  key:'set-level', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onSpecialSummon'], forced:true,
  condition(ctx){ if(!ladybugProcSummonedS03U243(ctx)){ ctx.reason = '手札からの特殊召喚手順で特殊召喚に成功した時に適用されます'; return false; } return true; },
  operation(ctx){
    const h = locateCardAnyV4(ctx.card);
    if(!h || h.zone!=='mz' || h.card.face!=='up') return;
    const total = ladybugOthersS03U243(ctx.player, h.card).reduce((n,x)=>n+curLV(x.card), 0);
    API.setLevel(h, total, 'permanent', 'ミラー・レディバグ');
  },
  afterResolve(){}
}], {type:'monster', priority:1,
  summonProcedure:{from:'hand', positions:['atk','def'], condition(ctx){
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}).length){ ctx.reason = '自分フィールドに表側表示のモンスターが存在しません'; return false; }
    if(API.pileCards(ctx.player, 'grave', x=>x.db.k==='m').length){ ctx.reason = '自分の墓地にモンスターが存在します'; return false; }
    return true;
  }},
  selfDestroyWhenS03:(card)=> curLV(card)>12 ? 'ミラー・レディバグ：レベルが12を超えたため破壊' : false,
  passive:{ onSpecialSummon:ctx=>ladybugProcSummonedS03U243(ctx) }});

/* ---- カラクリ忍者 参参九: ①攻撃可能な場合には攻撃しなければならない。②フィールド上に表側攻撃表示で存在するこのカードが攻撃対象に選択された時、このカードの表示形式を守備表示にする。
   ③このカードがリバースした時、フィールド上に表側表示で存在するモンスター1体を選択して墓地へ送る。④このカードがリバースしたターン、このカードは相手プレイヤーに直接攻撃する事ができる。
   (③ marks the turn in a journaled card flag when it resolves — the flipped card itself is always a possible target, so the effect can always be put on the chain — ④ reads that flag) ---- */
function sanzankuAttackedS03U243(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || ctx.card.pos!=='atk') return false;
  const a = gameState.pendingAttack;
  return !!a && a.targetUid!=null && a.targetUid===ensureCardUid(gameState, ctx.card);
}
function sanzankuPoolS03U243(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
defineUnifiedCardV4('カラクリ忍者 参参九', [{
  key:'attacked-to-defense', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onAttackDeclare'], forced:true,
  condition(ctx){ return sanzankuAttackedS03U243(ctx); },
  operation(ctx){ const h = locateCardAnyV4(ctx.card); if(h && h.zone==='mz' && h.card.face==='up' && h.card.pos==='atk') API.changePosition(h, 'def', 'カラクリ忍者 参参九'); },
  afterResolve(){}
},{
  key:'flip-send', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'both', speed:1, events:['onFlip'], forced:true,
  condition(ctx){
    if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up' || !eventIsSelfS03(ctx)){ ctx.reason = 'リバースした時に発動します'; return false; }
    if(!sanzankuPoolS03U243().length){ ctx.reason = 'フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('カラクリ忍者 参参九：墓地へ送るモンスター', sanzankuPoolS03U243(), t=>done([t])); },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone==='mz') API.setCardFlag(me, 'sanzankuFlippedS03U243', gameState.turn, 'カラクリ忍者 参参九', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.card.face==='up') API.sendToGrave(r, 'カラクリ忍者 参参九');
  },
  afterResolve(){}
}], {type:'monster', priority:1, forced:true, targets:true,
     canDirectAttack:(card)=> !!card && card.face==='up' && Number(card.sanzankuFlippedS03U243)===Number(gameState.turn),
     continuous:{ scope:'self', from:['mz'], apply(){ return null; }, mustAttack(){ return true; } },
     passive:{ onAttackDeclare:ctx=>sanzankuAttackedS03U243(ctx),
               onFlip:ctx=>ctx.zone==='mz' && !!ctx.card && ctx.card.face==='up' && eventIsSelfS03(ctx) && sanzankuPoolS03U243().length>0 }});
