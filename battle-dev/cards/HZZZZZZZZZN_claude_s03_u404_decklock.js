/* S03-U404: 次元要塞兵器, G・B・ハンター, 転生断絶 (NOT_STARTED cards, carddata texts).

   次元要塞兵器    このカードがフィールド上に表側表示で存在する限り、お互いにデッキからカードを墓地へ送る事はできない。
   G・B・ハンター  このカードがフィールド上に表側表示で存在する限り、お互いのプレイヤーはフィールド上のカードをデッキに戻す事はできない。
   転生断絶        （永続罠）このカードがフィールド上に存在する限り、墓地からデッキに戻るカードはデッキに戻らずゲームから除外される。

   Notes
   - New engine/1ZZU (S03-U404): the script flags deckToGraveLockS03 / fieldReturnLockS03 / graveToDeckBanishS03 are read inside the reducers FX_TO_GRAVE (deck), FX_MILL, FX_MILL_TOP and FX_RETURN_DECK (deckLockSourceS03: a face-up, non-negated card of either side).
   - Limit: sends from the Deck by raw MOVE actions and returns to the Deck by shuffle-all effects are not intercepted (the central reducers above are). */

defineScript('次元要塞兵器', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  deckToGraveLockS03:true
});
defineScript('G・B・ハンター', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  fieldReturnLockS03:true
});
defineUnifiedCardV4('転生断絶', [{
  key:'activate', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE, speed:2, events:['activate'],
  condition(ctx){ const h = locateCardAnyV4(ctx.card); return !(h && h.zone==='sz' && ctx.card.face==='up'); }, operation(){}, afterResolve(){}
}], {type:'trap', priority:2, graveToDeckBanishS03:true });
CARD_SCRIPTS['転生断絶'].graveToDeckBanishS03 = true;
