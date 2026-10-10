/* S03-U225: NOT_STARTED cards (2011 texts) — 猛毒の風, 電池メン－単一型, 氷結界の術者, 氷結界の守護陣, 蜃気楼の筒, ジャンク・ブレーダー, グレイヴ・オージャ. */

/* ---- 猛毒の風 (Continuous Spell): このカードがフィールド上に存在する限り、お互いに風属性モンスターを特殊召喚する事はできない。
   また、フィールド上に表側表示で存在する全ての風属性モンスターの攻撃力は500ポイントダウンする。 ---- */
defineScript('猛毒の風', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db)=> db.at==='風',
  continuous:{ scope:'allMonsters', from:['sz'], apply(target){ return (target && target.face==='up' && currentAttributeV17(target)==='風') ? {atk:-500} : null; } }
});

/* ---- 電池メン－単一型: このカードが自分フィールド上に表側表示で存在する限り、相手は自分フィールド上に存在する「電池メン－単一型」以外の雷族モンスターを攻撃対象に選択できない。 ---- */
defineScript('電池メン－単一型', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && target.face==='up' && cardName(target)!=='電池メン－単一型' && currentRaceV17(target)==='雷' }
});

/* ---- 氷結界の術者 / 氷結界の守護陣: 自分フィールド上にこのカード以外の「氷結界」と名のついたモンスターが存在する限り、…攻撃宣言できない。 ---- */
function otherIceBarrierS03(self){ const loc = locateCard(self); if(!loc) return false; return (gameState.players[loc.p].mz||[]).some(c=>c && c!==self && c.face==='up' && isSetCardV4(dbOf(c), SETCODE.ICE_BARRIER)); }
/* 氷結界の術者: フィールド上のレベル4以上のモンスターは攻撃宣言できない。 */
defineScript('氷結界の術者', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'allMonsters', from:['mz'], apply(){ return null; },
    cannotAttack:(card, self)=> self.face==='up' && otherIceBarrierS03(self) && curLV(card)>=4 }
});
/* 氷結界の守護陣: このカードの守備力以上の攻撃力を持つ相手モンスターは攻撃宣言できない。 */
defineScript('氷結界の守護陣', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'oppMonsters', from:['mz'], apply(){ return null; },
    cannotAttack:(card, self)=> self.face==='up' && otherIceBarrierS03(self) && curATK(card)>=curDEF(self) }
});

/* ---- 蜃気楼の筒 (Quick-Play Spell): このカードは手札から発動する事はできない。自分フィールド上に表側表示で存在するモンスターが攻撃対象に選択された時に発動する事ができる。
   相手ライフに1000ポイントダメージを与える。 ---- */
function mirageTubeReadyS03(ctx){
  const a = gameState.pendingAttack;
  if(ctx.zone!=='sz' || !a || a.player!==ctx.opponent || a.targetUid==null) return false;
  const h = findCardByUid(a.targetUid);
  return !!(h && h.zone==='mz' && h.p===ctx.player && h.card.face==='up');
}
defineScript('蜃気楼の筒', {
  type:'spell', priority:2,
  condition(ctx){
    if(ctx.zone==='hand'){ ctx.reason = '手札からは発動できません'; return false; }
    if(!mirageTubeReadyS03(ctx)){ ctx.reason = '自分の表側表示モンスターが攻撃対象に選択された時に発動します'; return false; }
    return true;
  },
  resolve(ctx){ API.damageLP(ctx.opponent, 1000); },
  afterResolve(){},
  passive:{ onAttackDeclare(ctx){ return ctx.card && ctx.card.face==='down' && mirageTubeReadyS03(ctx); } }
});

/* ---- ジャンク・ブレーダー: 自分の墓地に存在する「ジャンク」と名のついたモンスター1体をゲームから除外する事で、このカードの攻撃力はエンドフェイズ時まで400ポイントアップする。 ---- */
function junkBladeCostsS03(ctx){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.JUNK)); }
defineScript('ジャンク・ブレーダー', {
  type:'monster', priority:1, timing:['mainPhase'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!junkBladeCostsS03(ctx).length){ ctx.reason = '墓地に「ジャンク」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('ジャンク・ブレーダー：除外する「ジャンク」', junkBladeCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='grave'){ done(false); return; } API.banish(r, 'ジャンク・ブレーダー（コスト）'); done(true); }); },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.modAtk(me, 400, 0, 'endPhase', 'ジャンク・ブレーダー'); },
  afterResolve(){}
});

/* ---- グレイヴ・オージャ: 自分フィールド上に裏側守備表示モンスターが存在する限り、このカードを攻撃対象に選択する事はできない。
   自分フィールド上のモンスターが反転召喚する度に、相手ライフに300ポイントダメージを与える。 (forced) ---- */
function ogreFlipSummonedS03(ctx){
  const e = ctx.event || {};
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || e.flipSummon!==true) return false;
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  return !!(h && h.zone==='mz' && h.p===ctx.player);
}
defineScript('グレイヴ・オージャ', {
  type:'monster', priority:1, forced:true, onOtherSummon:true, onOtherFlipS03:true,
  condition(ctx){ if(ctx.eventName!=='onFlip' || !ogreFlipSummonedS03(ctx)){ ctx.reason = '自分のモンスターが反転召喚した時に発動します'; return false; } return true; },
  resolve(ctx){ API.damageLP(ctx.opponent, 300); },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target===self && self.face==='up' && (function(){ const loc = locateCard(self); return !!loc && (gameState.players[loc.p].mz||[]).some(c=>c && c!==self && c.face==='down' && c.pos==='def'); })() },
  passive:{ onFlip(ctx){ return ogreFlipSummonedS03(ctx); } }
});
