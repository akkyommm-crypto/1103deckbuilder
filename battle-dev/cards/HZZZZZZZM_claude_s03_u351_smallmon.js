/* S03-U351: five small monsters (carddata texts).

   X－セイバー ガラハド  相手モンスターに攻撃する場合、ダメージステップの間攻撃力300アップ。相手モンスターに攻撃される場合、ダメージステップの間攻撃力500ダウン。攻撃対象に選択された時、自分の他の「セイバー」1体をリリースする事でその攻撃を無効にする。
   オアシスの使者        自分フィールドにレベル3以下の通常モンスターが表側表示で存在する限り、このカードを攻撃対象に選択できない。レベル3以下の通常モンスターの戦闘によって発生するコントローラーへの戦闘ダメージは0。
   イービル・ソーン      このカードをリリースして発動できる。相手に300ダメージを与え、デッキから「イービル・ソーン」を2体まで攻撃表示で特殊召喚できる。この効果で特殊召喚したモンスターは効果を発動できない。
   C・リペアラー         戦闘でモンスターを破壊し墓地へ送った時、相手に300ダメージ。1ターンに1度、自分の墓地の「C・リペアラー」以外の「C」レベル4以下のモンスター1体を特殊召喚できる。この効果を発動するターンこのカードは攻撃できない。
   C・コイル             自分フィールドの「C」モンスター1体を選択して発動する。攻撃力・守備力300アップ。1ターンに1度。

   Notes
   - ガラハド: continuous atk hook read from gameState.battle (the ライトロード・パラディン ジェイン / TG ラッシュ・ライノ pattern); the attack negation is a speed-2 trigger on onAttackDeclare with a release cost (ゼンマイナイト pattern), API.negateAttack.
   - オアシスの使者: continuous cannotBeAttackTarget on itself + battleDamage hook (info.atkCard / defCard / to / srcPlayer).
   - イービル・ソーン: the release is the cost; 「効果を発動できない」 = API.negateEffectUntil(…, 'permanent') on the summoned copies.
   - C・リペアラー: the revive marks the card cannotAttackTurn (as ウィキッド・リボーン, S03-U348); the 300 damage is a forced onDestroy-side trigger (battle destruction by this card). */

/* ---- X－セイバー ガラハド ---- */
function u351GalSelfAttacking(self){
  const b = gameState.battle; if(!b || b.target==='direct') return false;
  const P = gameState.players[b.player]; return !!P && (P.mz||[])[b.atkIdx]===self;
}
function u351GalAttacked(self){
  const b = gameState.battle; if(!b || b.target==='direct' || b.targetUid==null) return false;
  return b.targetUid===self.uid;
}
function u351GalDecl(ctx){
  const a = gameState.pendingAttack, t = a && a.targetUid!=null ? findCardByUid(a.targetUid) : null;
  return !!(a && a.player===ctx.opponent && t && t.zone==='mz' && t.p===ctx.player && t.card.uid===ctx.card.uid && ctx.card.face==='up');
}
function u351Sabers(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card!==ctx.card && x.card.face==='up' && isSetCardV4(x.db, SETCODE.X_SABER)}); }
defineUnifiedCardV4('X－セイバー ガラハド', [{
  key:'negate-attack', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:2, events:['onAttackDeclare'],
  condition(ctx){ return ctx.zone==='mz' && u351GalDecl(ctx) && u351Sabers(ctx).length>0; },
  cost(ctx, done){
    API.selectCard('X－セイバー ガラハド：リリースする「セイバー」', u351Sabers(ctx), t=>{
      const r = t && resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, 'X－セイバー ガラハド（リリース）'); done(true);
    });
  },
  operation(){ API.negateAttack('X－セイバー ガラハド'); },
  afterResolve(){}
}], {type:'monster', priority:2,
  passive:{ onAttackDeclare(ctx){ return ctx.zone==='mz' && u351GalDecl(ctx) && u351Sabers(ctx).length>0; } },
  continuous:{ scope:'self', from:['mz'], apply(card, self){
    if(card!==self || self.face!=='up') return null;
    if(u351GalSelfAttacking(self)) return {atk:300};
    if(u351GalAttacked(self)) return {atk:-500};
    return null;
  } }
});

/* ---- オアシスの使者 ---- */
function u351Normal3(card){ const d = dbOf(card); return !!d && d.k==='m' && (d.st||[]).indexOf('効果')<0 && !(d.st||[]).some(s=>['融合','儀式','シンクロ','エクシーズ','ペンデュラム'].indexOf(s)>=0) && Number(d.lv)<=3 && card.face==='up'; }
function u351OasisHas(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>u351Normal3(x.card)}).length>0; }
defineUnifiedCardV4('オアシスの使者', [], {
  type:'monster', priority:1,
  continuous:{ scope:'allMonsters', from:['mz'],
    cannotBeAttackTarget(target, self){
      if(target!==self || self.face!=='up') return false;
      const h = findCardByUid(self.uid); return !!h && h.zone==='mz' && u351OasisHas(h.p);
    },
    battleDamage(info){
      const s = info && info.self; if(!s || s.face!=='up') return info.amount;
      const h = findCardByUid(s.uid); if(!h || h.zone!=='mz' || info.to!==h.p) return info.amount;
      const lowNormal = c=>!!c && u351Normal3(c);
      return (lowNormal(info.atkCard) || lowNormal(info.defCard)) ? 0 : info.amount;
    } }
});

/* ---- イービル・ソーン ---- */
defineUnifiedCardV4('イービル・ソーン', [{
  key:'burst', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){ return ctx.zone==='mz' && ctx.card.face==='up'; },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz'){ done(false); return; } API.sendToGrave(h, 'イービル・ソーン（リリース）'); done(true); },
  operation(ctx){
    API.damageLP(ctx.opponent, 300, 'イービル・ソーン');
    const room = Math.max(0, ZONE_LIMITS.mz - gameState.players[ctx.player].mz.length);
    const pool = () => API.pileCards(ctx.player, 'deck', x=>x.db.n==='イービル・ソーン');
    const one = (left)=>{
      if(left<=0 || !pool().length || !hasMonsterZoneSpace(ctx.player)) return;
      API.selectCard('イービル・ソーン：攻撃表示で特殊召喚する「イービル・ソーン」', pool(), t=>{
        const r = t && resolveTarget(t); if(!r || r.zone!=='deck') return;
        const uid = ensureCardUid(gameState, r.card);
        API.specialSummon(ctx.player, 'deck', r.index, 'atk', 'イービル・ソーン');
        const h = findCardByUid(uid); if(h && h.zone==='mz') API.negateEffectUntil(h, 'permanent', 'イービル・ソーン', ctx.card);
        one(left-1);
      });
    };
    one(Math.min(2, room));
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], includesSpecialSummon:true});

/* ---- C・リペアラー ---- */
function u351CPool(ctx){ return API.pileCards(ctx.player, 'grave', x=>x.db.k==='m' && x.db.n!=='C・リペアラー' && String(x.db.n||'').indexOf('C・')===0 && Number(x.db.lv)<=4); }
defineUnifiedCardV4('C・リペアラー', [{
  key:'burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onDamageStep'], forced:true,
  condition(ctx){ return gearKilledFoeS03(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent, 300, 'C・リペアラー'); },
  afterResolve(){}
}, {
  key:'revive', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.GRAVE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up') return false;
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u351CPool(ctx).length){ ctx.reason = '墓地に「C」と名のついたレベル4以下のモンスターがいません'; return false; }
    if(ctx.card.attackedTurn===gameState.turn || (ctx.card.attacksThisTurn|0)>0){ ctx.reason = '攻撃したターンには発動できません'; return false; }
    return true;
  },
  target(ctx, done){ API.selectCard('C・リペアラー：特殊召喚するモンスター', u351CPool(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, 'C・リペアラー', {silent:true});
    if(r && r.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', r.index, 'atk', 'C・リペアラー');
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], targets:true, countLimit:1, includesSpecialSummon:true, dsTiming:'leave',
  passive:{ onDamageStep(ctx){ return gearKilledFoeS03(ctx); } }});

/* ---- C・コイル ---- */
function u351CField(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && String(x.db.n||'').indexOf('C・')===0}); }
defineUnifiedCardV4('C・コイル', [{
  key:'boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){ if(ctx.zone!=='mz' || ctx.card.face!=='up') return false; if(!u351CField(ctx).length){ ctx.reason = '自分フィールドに「C」と名のついたモンスターがいません'; return false; } return true; },
  target(ctx, done){ API.selectCard('C・コイル：攻撃力・守備力を300アップするモンスター', u351CField(ctx), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && r.zone==='mz' && r.card.face==='up') v4RegisterStatModifier(r, {atk:300, def:300}, {code:'C・コイル', resetMask:RESET.END|RESET.LEAVE|RESET.FACE_DOWN});
  },
  afterResolve(){}
}], {type:'monster', priority:1, timing:['mainPhase'], targets:true, countLimit:1});
