/* S03-U418: 神禽王アレクトール, 渋い忍者, ガガガマジシャン, ジェスター・コンフィ (NOT_STARTED cards with a "1体しか表側表示で存在できない" clause, carddata texts).

   神禽王アレクトール   相手フィールド上に同じ属性のモンスターが表側表示で2体以上存在する場合、このカードは手札から特殊召喚する事ができる。1ターンに1度、フィールド上に表側表示で存在するカード1枚を選択する。選択されたカードの効果はそのターン中無効になる。「神禽王アレクトール」はフィールド上に1体しか表側表示で存在できない。
   渋い忍者           このカードがリバースした時、自分の手札・墓地から「渋い忍者」以外の「忍者」と名のついたモンスターを任意の数だけ裏側守備表示で特殊召喚する事ができる。「渋い忍者」はフィールド上に1体しか表側表示で存在できない。
   ガガガマジシャン   このカードはS素材にできない。①：「ガガガマジシャン」は自分フィールドに1体しか表側表示で存在できない。②：1ターンに1度、1～8までの任意のレベルを宣言して発動できる。このカードのレベルはターン終了時まで宣言したレベルになる。
   ジェスター・コンフィ  ①：「ジェスター・コンフィ」は自分フィールドに1体しか表側表示で存在できない。②：このカードは手札から攻撃表示で特殊召喚できる。③：このカードの②の方法で特殊召喚した場合、次の相手エンドフェイズに相手フィールドの表側表示モンスター1体を対象として発動する。その相手の表側表示モンスターと表側表示のこのカードを持ち主の手札に戻す。

   Notes
   - NEW engine (engine/1ZZM, S03-U418): script flag uniqueNameS03:'any' | 'own' = 「X」 (the card's own name) can only be face-up once on either field / on my field. uniqueFaceUpReasonS03(db, p) refuses a face-up Normal / Flip / Special Summon (engine/40 v46FaceUpSummonRestrictionReason, now passing p), and a copy turned face-up while another is face-up is flagged uniqueViolationS03 and destroyed by the rule (the 地縛神 path).
   - アレクトール: summonProcedure from the hand (two face-up opponent monsters of one attribute); a once-per-turn ignition chooses a face-up card of the field and API.negateEffectUntil(…, 'endTurn').
   - 渋い忍者: optional onFlip trigger; the picked 「忍者」 monsters of the hand / Graveyard are Special Summoned face-down in Defense Position ({faceDown:true}), at most the free Monster Zones.
   - ガガガマジシャン: cannotSynchroMaterial; once-per-turn ignition: a 'declare' choice 1-8 and API.setLevel(…, 'endPhase').
   - ジェスター・コンフィ: ignition from the hand (Special Summon in Attack Position, stamps u418Jester = the turn); a forced onEndPhase trigger in the opponent's next End Phase bounces a chosen face-up opponent monster and itself. */

function u418Face(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; }
function u418Passive(extra){ return Object.assign({type:'monster', priority:1, timing:['free']}, extra); }

/* ---- 神禽王アレクトール ---- */
function u418SameAttr(p){
  const cnt = {};
  API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}).forEach(x=>{
    const a = (typeof currentAttributeV17==='function') ? currentAttributeV17(x.card) : x.db.at; cnt[a] = (cnt[a] || 0) + 1;
  });
  return Object.keys(cnt).some(a=>cnt[a]>=2);
}
function u418FieldFaceUp(){
  return [].concat(API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}), API.fieldCards({zone:'sz', filter:x=>x.card.face==='up'}), API.fieldCards({zone:'field', filter:x=>x.card.face==='up'}));
}
defineUnifiedCardV4('神禽王アレクトール', [{
  key:'negate', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u418Face(ctx) || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    if(!u418FieldFaceUp().length){ ctx.reason = 'フィールドに表側表示のカードがありません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = u418FieldFaceUp(); if(!pool.length) return;
    API.selectCard('神禽王アレクトール：効果を無効にする表側表示のカード', pool, t=>{
      const r = t && resolveTarget(t); if(r && (r.zone==='mz' || r.zone==='sz' || r.zone==='field') && r.card.face==='up') API.negateEffectUntil(r, 'endTurn', '神禽王アレクトール', ctx.card);
    });
  },
  afterResolve(){}
}], u418Passive({countLimit:{n:1, effects:['negate']}, uniqueNameS03:'any',
  summonProcedure:{ from:['hand'], positions:['atk','def'],
    condition(ctx){ if(!u418SameAttr(ctx.opponent)){ ctx.reason = '相手フィールドに同じ属性の表側表示モンスターが2体以上いません'; return false; } return true; } } }));

/* ---- 渋い忍者 ---- */
function u418Ninjas(p){
  return API.pileCards(p, 'hand', x=>x.db.k==='m' && String(x.db.n||'').indexOf('忍者')>=0 && x.db.n!=='渋い忍者')
    .concat(API.pileCards(p, 'grave', x=>x.db.k==='m' && String(x.db.n||'').indexOf('忍者')>=0 && x.db.n!=='渋い忍者' && canEffectSpecialSummonS03(x.card, 'grave', '渋い忍者')));
}
function u418FreeMz(p){ return Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length); }
function u418Flipped(ctx){ const e = ctx.event || {}; return ctx.zone==='mz' && (e.uid===ctx.card.uid || e.card===ctx.card); }
defineUnifiedCardV4('渋い忍者', [{
  key:'flip-ninjas', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'],
  condition(ctx){
    if(!u418Flipped(ctx)){ ctx.reason = 'リバースした時に発動します'; return false; }
    if(!u418Ninjas(ctx.player).length || !u418FreeMz(ctx.player)){ ctx.reason = '特殊召喚できる「忍者」モンスターがいません'; return false; }
    return true;
  },
  operation(ctx){
    const pool = u418Ninjas(ctx.player), max = Math.min(pool.length, u418FreeMz(ctx.player)); if(!max) return;
    v46PickAnyAtLeastOne('渋い忍者：裏側守備表示で特殊召喚する「忍者」', pool, max, picked=>{
      (picked || []).forEach(t=>{
        const h = findCardByUid(t.card.uid);
        if(h && (h.zone==='hand' || h.zone==='grave') && h.p===ctx.player && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, h.zone, h.index, 'def', '渋い忍者', null, {faceDown:true});
      });
    });
  },
  afterResolve(){}
}], u418Passive({uniqueNameS03:'any', includesSpecialSummon:true, passive:{ onFlip(ctx){ return u418Flipped(ctx) && u418Ninjas(ctx.player).length>0 && u418FreeMz(ctx.player)>0; } } }));

/* ---- ガガガマジシャン ---- */
API.registerChoiceHandler('u418.gagaga', (a, x)=>{
  if(!x || !a || a.cancelled) return;
  const pick = (a.cards || [])[0], lv = Number(pick && (pick.value || pick.key));
  const h = findCardByUid(x.uid);
  if(!h || h.zone!=='mz' || h.card.face!=='up' || !(lv>=1 && lv<=8)) return;
  API.setLevel(h, lv, 'endPhase', 'ガガガマジシャン');
});
defineUnifiedCardV4('ガガガマジシャン', [{
  key:'level', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(!u418Face(ctx) || ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズにフィールドに表側表示で存在する必要があります'; return false; }
    return true;
  },
  operation(ctx){
    const uid = ensureCardUid(gameState, ctx.card);
    API.requestChoice({player:ctx.player, kind:'declare', title:'ガガガマジシャン：宣言するレベル（1～8）',
      candidates:[1,2,3,4,5,6,7,8].map(n=>({key:'L'+n, label:'レベル'+n, value:n})), min:1, max:1, cancelable:false,
      resume:{handler:'u418.gagaga', args:{uid}}, meta:{scriptName:'ガガガマジシャン'}});
  },
  afterResolve(){}
}], u418Passive({countLimit:{n:1, effects:['level']}, uniqueNameS03:'own', cannotSynchroMaterial:true}));

/* ---- ジェスター・コンフィ ---- */
function u418FoeUp(ctx){ return API.fieldCards({player:ctx.opponent, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m'}); }
function u418JesterDue(ctx){
  return u418Face(ctx) && ctx.card.u418Jester!=null && gameState.activePlayer===ctx.opponent && Number(gameState.turn)===Number(ctx.card.u418Jester)+1 && u418FoeUp(ctx).length>0;
}
defineUnifiedCardV4('ジェスター・コンフィ', [{
  key:'hand-ss', type:EFFECT_TYPE.IGNITION, range:LOCATION.HAND, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札で発動します'; return false; }
    if(ctx.player!==gameState.activePlayer || (gameState.phase!=='main1' && gameState.phase!=='main2')){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンに空きがありません'; return false; }
    if(API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && cardName(x.card)==='ジェスター・コンフィ'}).length){ ctx.reason = '自分フィールドに「ジェスター・コンフィ」が表側表示で存在します'; return false; }
    return true;
  },
  operation(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='hand') return;
    if(API.specialSummon(ctx.player, 'hand', me.index, 'atk', 'ジェスター・コンフィ')){
      const put = locateCardAnyV4(ctx.card); if(put && put.zone==='mz') API.setCardFlag(put, 'u418Jester', gameState.turn, 'ジェスター・コンフィ', {silent:true});
    }
  },
  afterResolve(){}
}, {
  key:'bounce', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onEndPhase'], forced:true, targetRange:LOCATION.MZONE, targetSide:'opponent',
  condition(ctx){ return u418JesterDue(ctx); },
  operation(ctx){
    const pool = u418FoeUp(ctx); if(!pool.length) return;
    API.selectCard('ジェスター・コンフィ：手札に戻す相手の表側表示モンスター', pool, t=>{
      const r = t && resolveTarget(t), me = locateCardAnyV4(ctx.card);
      if(r && r.zone==='mz' && r.card.face==='up') API.returnToHand(r, 'ジェスター・コンフィ');
      const me2 = locateCardAnyV4(ctx.card); if(me2 && me2.zone==='mz' && me2.card.face==='up') API.returnToHand(me2, 'ジェスター・コンフィ');
    });
  },
  afterResolve(){}
}], u418Passive({uniqueNameS03:'own', activateFrom:['hand'], includesSpecialSummon:true, forced:false, targets:true, passive:{ onEndPhase(ctx){ return u418JesterDue(ctx); } } }));
