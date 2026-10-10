/* S03-U214: 「墓地へ送られるカードは墓地へは行かず除外される」 — 光の追放者, 閃光の追放者 (NOT_STARTED), マクロコスモス (PARTIAL: auto-table recruit only),
   次元の裂け目 (ENGINE_GAP). The replacement itself is engine/1ZZG (graveToBanishS03, read by pushZone). 2011 texts. */

/* ---- 光の追放者 / 閃光の追放者: このカードがフィールド上に表側表示で存在する限り、墓地へ送られるカードは墓地へは行かずゲームから除外される。 ---- */
defineScript('光の追放者', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  graveToBanishS03:true
});
defineScript('閃光の追放者', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  graveToBanishS03:true
});

/* ---- 次元の裂け目 (Continuous Spell): このカードがフィールド上に存在する限り、墓地へ送られるモンスターは墓地へは行かずゲームから除外される。 ---- */
defineScript('次元の裂け目', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  graveToBanishS03:(card)=> dbOf(card).k==='m'
});

/* ---- マクロコスモス (Continuous Trap): このカードの発動時に、手札またはデッキから「原始太陽ヘリオス」1体を特殊召喚する事ができる。
   また、このカードがフィールド上に存在する限り、墓地へ送られるカードは墓地へは行かずゲームから除外される。
   (the summon is optional, at the activation's resolution; the auto-table Deck pool is kept as its spec) ---- */
poolSpecS03('マクロコスモス', {from:['hand','deck'], action:'summon', pos:'faceUp', minPick:0, filter:{name:'原始太陽ヘリオス'}});
defineScript('マクロコスモス', {
  type:'trap', priority:2,
  condition(){ return true; },
  resolve(ctx){
    if(!poolS03('マクロコスモス', ctx.player).length || !hasMonsterZoneSpace(ctx.player)) return;
    askPoolS03(ctx, 'マクロコスモス', 'マクロコスモス：特殊召喚する「原始太陽ヘリオス」（任意）');
  },
  afterResolve(){},
  graveToBanishS03:true
});
