/* S03-U259: activation locks (2011 texts) — 超古代生物の墓場, インヴェルズの歩哨, エンジェルO7, ランドオルスのヒカリゴケ, 苦痛の回廊, 古代の機械砲台,
   ナチュル・バンブーシュート.
   Engine (this unit, engine/1ZD): activationLockS03 also covers monster effect activations (info.db.k==='m'), and lingering sources registered
   this turn (API.lingerS03, S03-U257) lock too. Reuses: continuous.cannotAttack / negateEffect, summonProvenance (tribute + materialRefs). */

function u259LevelOf(card){ return (typeof curLV==='function') ? Number(curLV(card)) : Number(dbOf(card).lv || 0); }
function u259OnFieldFaceUp(card){ const h = card && findCardByUid(card.uid); return !!h && h.zone==='mz' && card.face==='up'; }
function u259TributeSummoned(card){ const sp = card && card.summonProvenance; return !!sp && sp.summonType==='tribute'; }

/* ---- 超古代生物の墓場 (Continuous Trap): フィールド上のレベル6以上の特殊召喚されたモンスターは攻撃宣言できず、効果を発動する事もできない。 ---- */
function u259AncientGraveHit(card){ return !!card && card.specialSummoned===true && u259OnFieldFaceUp(card) && u259LevelOf(card) >= 6; }
defineScript('超古代生物の墓場', {
  type:'trap', priority:1,
  condition(ctx){ if(ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; } return true; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.db.k==='m' && i.zone==='mz' && u259AncientGraveHit(i.card),
  continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; },
    cannotAttack(card, self){ return !!self && self.face==='up' && !self.activationPending && u259AncientGraveHit(card); }}
});

/* ---- インヴェルズの歩哨: このカードがフィールド上に表側攻撃表示で存在する限り、フィールド上のレベル5以上の特殊召喚されたモンスターは効果を発動できない。 ---- */
defineScript('インヴェルズの歩哨', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.db.k==='m' && i.zone==='mz' && i.src.pos==='atk' && u259OnFieldFaceUp(i.src)
    && !!i.card && i.card.specialSummoned===true && u259OnFieldFaceUp(i.card) && u259LevelOf(i.card) >= 5
});

/* ---- エンジェルO7: このカードの生け贄召喚に成功した時、このカードは以下の効果を得る。
   ●このカードがフィールド上に表側表示で存在する限り、効果モンスターは効果を発動できない。 (summonProvenance tribute — zone-local) ---- */
defineScript('エンジェルO7', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.db.k==='m' && u259TributeSummoned(i.src) && u259OnFieldFaceUp(i.src)
});

/* ---- ランドオルスのヒカリゴケ (Spell): 自分フィールド上に「ナチュル」と名のついたモンスターが表側表示で存在する場合のみ発動できる。
   このターン、相手の効果モンスターは効果を発動する事ができない。 (the used card lingers for the turn, S03-U257) ---- */
function u259NaturiaFaceUp(p){ return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && x.db.k==='m' && isSetCardV4(x.db, SETCODE.NATURIA)}); }
defineScript('ランドオルスのヒカリゴケ', {
  type:'spell', priority:1,
  condition(ctx){ if(!u259NaturiaFaceUp(ctx.player).length){ ctx.reason = '自分フィールドに表側表示の「ナチュル」モンスターが必要です'; return false; } return true; },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u259MossTurnS03', gameState.turn, 'ランドオルスのヒカリゴケ');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, 'ランドオルスのヒカリゴケ');
  },
  afterResolve(){},
  activationLockS03:(i)=> i.db.k==='m' && i.p!==i.srcPlayer && Number(i.src.u259MossTurnS03)===Number(gameState.turn)
});

/* ---- 苦痛の回廊 (Continuous Spell): デッキから特殊召喚されたモンスターは、フィールド上に表側表示で存在する限り効果を発動できず無効化され、攻撃宣言できない。 ---- */
function u259FromDeckHit(card){ return !!card && card.specialSummoned===true && card.specialSummonedFrom==='deck' && u259OnFieldFaceUp(card); }
defineScript('苦痛の回廊', {
  type:'spell', priority:1,
  condition(ctx){ if(ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; } return true; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.db.k==='m' && i.zone==='mz' && u259FromDeckHit(i.card),
  continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; },
    negateEffect(card, self){ return !!self && self.face==='up' && !self.activationPending && u259FromDeckHit(card); },
    cannotAttack(card, self){ return !!self && self.face==='up' && !self.activationPending && u259FromDeckHit(card); }}
});

/* ---- 古代の機械砲台: このカードを生け贄に捧げる。相手ライフに500ポイントダメージを与え、このターンのバトルフェイズ中はお互いに罠カードを発動できない。
   (ignition; release itself as the cost; the released card lingers for the turn and locks Trap card activations of both players during the Battle Phase) ---- */
defineScript('古代の機械砲台', {
  type:'monster', priority:1, activateFrom:['mz'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドで表側表示の時に発動します'; return false; } return true; },
  cost(ctx, done){ const h = locateCardAnyV4(ctx.card); if(!h || h.zone!=='mz'){ done(false); return; } API.sendToGrave(h, '古代の機械砲台（リリース）'); done(true); },
  resolve(ctx){
    API.damageLP(ctx.opponent, 500, '古代の機械砲台');
    const me = locateCardAnyV4(ctx.card); if(!me) return;
    API.setCardFlag(me, 'u259CannonTurnS03', gameState.turn, '古代の機械砲台');
    const me2 = locateCardAnyV4(ctx.card); if(me2) API.lingerS03(ctx.player, me2, '古代の機械砲台');
  },
  afterResolve(){},
  activationLockS03:(i)=> i.db.k==='t' && gameState.phase==='battle' && Number(i.src.u259CannonTurnS03)===Number(gameState.turn)
});

/* ---- ナチュル・バンブーシュート: 「ナチュル」と名のついたモンスターをリリースしてアドバンス召喚に成功したこのカードがフィールド上に表側表示で存在する限り、
   相手は魔法・罠カードを発動する事ができない。 (summonProvenance: tribute + a 「ナチュル」 among materialRefs) ---- */
function u259BambooArmed(card){
  if(!u259TributeSummoned(card) || !u259OnFieldFaceUp(card)) return false;
  return (card.summonProvenance.materialRefs || []).some(u=>{ const h = findCardByUid(u); return !!h && isSetCardV4(dbOf(h.card), SETCODE.NATURIA); });
}
defineScript('ナチュル・バンブーシュート', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> (i.db.k==='s' || i.db.k==='t') && i.p!==i.srcPlayer && u259BambooArmed(i.src)
});
