/* S03-U317: the four remaining 「六武衆」 monsters (carddata texts; the helpers of cards/37 — v350Six / v350SixOwn — and the substitute of S03-U173).

   六武衆－イロウ   自分フィールド上に「六武衆－イロウ」以外の「六武衆」と名のついたモンスターが存在し、このカードが裏側守備表示のモンスターを攻撃した場合、ダメージ計算を行わず裏側守備表示のままそのモンスターを破壊する。
   六武衆－カモン   自分フィールド上に「六武衆－カモン」以外の「六武衆」と名のついたモンスターが存在する場合、1ターンに1度、フィールド上に表側表示で存在する魔法・罠カード1枚を選択して破壊できる。この効果を発動するターン、
                     このカードは攻撃宣言できない。
   六武衆－ニサシ   自分フィールド上に「六武衆－ニサシ」以外の「六武衆」と名のついたモンスターが存在する場合、このカードは1度のバトルフェイズ中に2回攻撃する事ができる。
   六武衆－ヤリザ   自分フィールド上に「六武衆－ヤリザ」以外の「六武衆」と名のついたモンスターが存在する場合、このカードは相手プレイヤーに直接攻撃できる。
   (all four) また、フィールド上に表側表示で存在するこのカードが破壊される場合、代わりにこのカード以外の自分フィールド上に表側表示で存在する「六武衆」と名のついたモンスター1体を破壊できる。

   Notes
   - 「他の六武衆が存在する」 = a face-up 「六武衆」 monster of mine other than the card (v350SixOwn); the clause is checked when it matters (the attack, the effect).
   - The substitute is the optional destroyOwn kind of engine/1ZV (S03-U173): its controller chooses at the destruction.
   - イロウ: the pre-damage destruction is the one of ミスティック・ソードマン LV2 (a3DestroyBeforeDamage); only a Set (face-down Defense) target while イロウ is the attacker.
   - カモン: the card is flagged cannotAttackTurn for the turn it used the effect (it may still have attacked earlier; the text only forbids declaring an attack that turn after using it). */

const U317_SUB = {kind:'destroyOwn', causes:['battle','effect'], filter:c=>v350Six(c)};

/* ---- 六武衆－イロウ ---- */
function u317IroTarget(ctx){
  if(ctx.zone!=='mz' || ctx.card.face!=='up' || !v350SixOwn(ctx.player, ctx.card).length) return null;
  if(!a3IsAttacker(ctx)) return null;
  const t = a3AttackTarget();
  return (t && t.face==='down' && t.pos==='def') ? t : null;
}
defineScript('六武衆－イロウ', {
  type:'monster', priority:1, forced:true, dsTiming:'start', destroySubstituteS03:U317_SUB,
  condition(ctx){ if(!u317IroTarget(ctx)){ ctx.reason = '他の「六武衆」がいる時に裏側守備表示のモンスターを攻撃した場合に適用します'; return false; } return true; },
  resolve(ctx){ const t = u317IroTarget(ctx); if(t) a3DestroyBeforeDamage(t, '六武衆－イロウ'); },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return !!u317IroTarget(ctx); } }
});

/* ---- 六武衆－カモン ---- */
function u317KamonPool(){ return API.fieldCards({filter:x=>(x.zone==='sz' || x.zone==='field') && x.card.face==='up'}); }
defineScript('六武衆－カモン', {
  type:'monster', priority:1, countLimit:1, targets:true, timing:['mainPhase'], destroySubstituteS03:U317_SUB,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する必要があります'; return false; }
    if(ctx.player!==gameState.activePlayer){ ctx.reason = '自分のメインフェイズに発動します'; return false; }
    if(!v350SixOwn(ctx.player, ctx.card).length){ ctx.reason = '他の「六武衆」が必要です'; return false; }
    if(!u317KamonPool().length){ ctx.reason = '表側表示の魔法・罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('六武衆－カモン：破壊する表側表示の魔法・罠カード', u317KamonPool(), t=>done([t])); },
  resolve(ctx){
    const me = locateCardAnyV4(ctx.card);
    if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, '六武衆－カモン', {silent:true});
    const t = ctx.selectedTargets && ctx.selectedTargets[0], r = t && resolveTarget(t);
    if(r && (r.zone==='sz' || r.zone==='field') && r.card.face==='up') API.destroy(r, '六武衆－カモン');
  },
  afterResolve(){}
});

/* ---- 六武衆－ニサシ ---- */
defineScript('六武衆－ニサシ', {
  type:'monster', priority:1, destroySubstituteS03:U317_SUB,
  attackLimit(card){
    const h = locateCardAnyV4(card);
    if(!h || h.zone!=='mz' || card.face!=='up') return 1;
    return v350SixOwn(h.p, card).length ? 2 : 1;
  }
});

/* ---- 六武衆－ヤリザ ---- */
defineScript('六武衆－ヤリザ', {
  type:'monster', priority:1, destroySubstituteS03:U317_SUB,
  canDirectAttack(card, loc){
    if(!card || card.face!=='up' || !loc || loc.zone!=='mz') return false;
    if(typeof effectNegated==='function' && effectNegated(card)) return false;
    return v350SixOwn(loc.p, card).length>0;
  }
});
