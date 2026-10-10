/* S03-U268: 「モンスターカードゾーン上で破壊された場合、墓地へ送らずに装備カード扱いとして…装備できる」 — ドラグニティ－ジャベリン (2011 text).
   Engine (this unit, engine/1ZV + 1ZZG): destruction-substitute kind 'equipInstead' declared by equipInsteadS03:{hostFilter(host)}. Asked at the destruction
   (battle, or an effect destruction during a chain link — the U173 reach), one option per own face-up host; the card is still destroyed and its GY move
   becomes an Equip Card for the chosen host (equipInsteadPileS03). Returned by the U265 Sonnet subagent as needing this engine change. */
function javelinHostS03U268(c){ const d = dbOf(c); return !!d && d.k==='m' && isSetCardV4(d, SETCODE.DRAGUNITY) && currentRaceV17(c)==='鳥獣'; }
defineScript('ドラグニティ－ジャベリン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '破壊された時の置換のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  equipInsteadS03:{hostFilter:javelinHostS03U268}
});
