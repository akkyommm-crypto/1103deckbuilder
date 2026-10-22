/* S03-U463: 超合魔獣ラプテノス.
   Its live continuous source makes every face-up Gemini monster on either
   field count as Gemini Summoned; no permanent flag is written to a target. */
defineScript('超合魔獣ラプテノス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason='永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ geminiAllDualS03:true }
});
