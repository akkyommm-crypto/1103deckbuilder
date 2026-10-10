/* S03-U220: NOT_STARTED cards (2011 texts) with the special-summon lock (specialSummonLockS03, engine/40) or the activation lock
   (activationLockS03, engine/1ZD) — the six 結界像, 召喚制限－パワーフィルター, 虚無の統括者, 漆黒の戦士 ワーウルフ, 暗黒の侵略者. */

/* ---- 「このカードがフィールド上に表側表示で存在する限り、お互いに○属性以外のモンスターを特殊召喚できない」 (結界像) ---- */
function barrierStatueS03(attr){ return {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db)=> db.at!==attr
}; }
defineScript('干ばつの結界像', barrierStatueS03('地'));
defineScript('業火の結界像', barrierStatueS03('炎'));
defineScript('深淵の結界像', barrierStatueS03('闇'));
defineScript('烈風の結界像', barrierStatueS03('風'));
defineScript('豪雨の結界像', barrierStatueS03('水'));
defineScript('閃光の結界像', barrierStatueS03('光'));

/* ---- 召喚制限－パワーフィルター (Continuous Spell): このカードがフィールド上に存在する限り、お互いのプレイヤーは攻撃力1000以下のモンスターを特殊召喚できない。 ---- */
defineScript('召喚制限－パワーフィルター', {
  type:'spell', priority:1, timing:['mainPhase'],
  condition(){ return true; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db)=> Number(db.atk)<=1000
});

/* ---- 虚無の統括者: このカードは特殊召喚できない。このカードがフィールド上に表側表示で存在する限り、相手はモンスターを特殊召喚できない。 ---- */
defineScript('虚無の統括者', {
  type:'monster', priority:1, cannotSpecialSummon:true,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db, p, src, q)=> p!==q
});

/* ---- 漆黒の戦士 ワーウルフ: このカードがフィールド上に表側表示で存在する限り、相手はバトルフェイズ中に罠カードを発動する事ができない。 ---- */
defineScript('漆黒の戦士 ワーウルフ', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.p!==i.srcPlayer && i.db.k==='t' && gameState.phase==='battle'
});

/* ---- 暗黒の侵略者: このカードがフィールド上に表側表示で存在する限り、相手は速攻魔法カードを発動する事ができない。 ---- */
defineScript('暗黒の侵略者', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.p!==i.srcPlayer && i.db.k==='s' && i.db.sub==='速攻'
});
