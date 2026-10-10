/* S03-U115: consumers of the "unaffected by Spell/Trap card effects" capability (engine/1ZG_unaffected_by_st_s03.js)
   whose whole text is covered by existing capabilities. Both were ENGINE_GAP.
   Other same-shape cards stay deferred because another part of their text needs a separate capability:
   トラファスフィア (Tribute restriction), 伝説のフィッシャーマン (cannot be attacked while 海), サイレント・ソードマン LV5 /
   サイレント・マジシャン LV8 (LV-up / summon restrictions), 砂塵の結界 / 暴君の威圧 (field-wide grants), 最後の進軍,
   極神聖帝オーディン, 儀式魔人ディザーズ. */

/* location of `card` in the state the reducer is applying to (not the live global), so Replay decides the same way */
function s03u115FaceUpInMz(card, gs){
  const st = gs || (typeof gameState!=='undefined' ? gameState : null);
  if(!card || !st || card.uid==null || typeof findCardByUidInState!=='function') return false;
  const h = findCardByUidInState(st, card.uid);
  return !!(h && h.zone==='mz' && h.card.face==='up');
}

/* ---- E・HERO ワイルドマン ----
   ①:このカードはモンスターゾーンに存在する限り、罠カードの効果を受けない。 */
defineScript('E・HERO ワイルドマン', {
  type:'monster', priority:1,
  unaffectedByS03(card, src, gs){ return src && src.k==='t' && s03u115FaceUpInMz(card, gs); }
});

/* ---- 力の代行者 マーズ ----
   このカードは魔法カードの効果を受けない。自分フィールド上に「天空の聖域」が表側表示で存在し、自分のライフポイントが
   相手より上の場合、その数値だけこのカードの攻撃力・守備力がアップする。 */
defineScript('力の代行者 マーズ', {
  type:'monster', priority:1,
  unaffectedByS03(card, src, gs){ return src && src.k==='s' && s03u115FaceUpInMz(card, gs); },
  continuous:{
    scope:'self', from:['mz'],
    apply(card, self, info){
      if(card!==self || !info) return null;
      const p = info.p, P = gameState.players[p], O = gameState.players[p===0?1:0];
      const f = P && P.field;
      if(!f || f.face!=='up' || cardName(f)!=='天空の聖域' || f.activationPending || f.activationNegated) return null;
      const diff = (Number(P.lp)||0) - (Number(O.lp)||0);
      return diff>0 ? {atk:diff, def:diff} : null;
    }
  }
});
