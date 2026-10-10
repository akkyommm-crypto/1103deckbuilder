/* S03-U271: damage origin (2011 texts) — リフレクト・ネイチャー, 墓守の従者.
   Engine (this unit): LP rules may carry originPlayerS03 (API.addLpRule({originPlayer})) — only damage whose origin player (the resolving
   link's player for effect damage, the inflicting side for battle damage) matches; script battleDamageAsEffectS03:true makes the battle
   damage a monster inflicts on its controller's opponent count as effect damage (engine/00 battleDamageCauseS03). */

/* ---- リフレクト・ネイチャー (Trap): このターン、相手が発動したライフポイントにダメージを与える効果は、相手ライフにダメージを与える効果になる。 ---- */
defineScript('リフレクト・ネイチャー', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){
    API.addLpRule({player:ctx.player, cause:'effect', mode:'redirect', toPlayer:ctx.opponent, originPlayer:ctx.opponent, turns:0, label:'リフレクト・ネイチャー'});
    API.log('リフレクト・ネイチャー：このターン、相手が発動した効果によるダメージは相手が受ける');
  },
  afterResolve(){}
});

/* ---- 墓守の従者 (monster): このカードが相手プレイヤーに与える戦闘ダメージは効果によるダメージとして扱う。 ---- */
defineScript('墓守の従者', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  battleDamageAsEffectS03:true
});
