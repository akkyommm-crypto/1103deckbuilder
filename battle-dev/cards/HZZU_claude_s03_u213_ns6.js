/* S03-U213: NOT_STARTED cards (2011 texts) — イーグル・アイ, 侵略の炎, 忍び寄るデビルマンタ, 増幅する悪意.
   Engine: 「このカードが召喚に成功した時、罠カードを発動する事はできない」 — summonNoTrapS03 (engine/1ZD summonTrapLockReasonS03; the lock is
   recorded when the onNormalSummon event is dispatched in engine/30). */

/* ---- イーグル・アイ / 侵略の炎 / 忍び寄るデビルマンタ: このカードが召喚に成功した時、罠カードを発動する事はできない。 ---- */
const SUMMON_NO_TRAP_SCRIPT_S03 = {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  summonNoTrapS03:true
};
defineScript('イーグル・アイ', Object.assign({}, SUMMON_NO_TRAP_SCRIPT_S03));
defineScript('侵略の炎', Object.assign({}, SUMMON_NO_TRAP_SCRIPT_S03));
defineScript('忍び寄るデビルマンタ', Object.assign({}, SUMMON_NO_TRAP_SCRIPT_S03));


/* ---- 増幅する悪意: このカードがフィールド上に表側表示で存在する限り、相手ターンのスタンバイフェイズ時に自分の墓地に存在する「増幅する悪意」の枚数だけ、
   相手のデッキの上からカードを墓地に送る。 (forced) ---- */
function malevolenceCountS03(p){ return (gameState.players[p].grave||[]).filter(c=>c && cardName(c)==='増幅する悪意').length; }
function malevolenceReadyS03(ctx){ return ctx.zone==='mz' && ctx.card.face==='up' && gameState.phase==='standby' && gameState.activePlayer===ctx.opponent && malevolenceCountS03(ctx.player)>0; }
defineScript('増幅する悪意', {
  type:'monster', priority:1, forced:true,
  condition(ctx){ if(!malevolenceReadyS03(ctx)){ ctx.reason = '相手スタンバイフェイズに、墓地に「増幅する悪意」がある場合に発動します'; return false; } return true; },
  resolve(ctx){ const n = malevolenceCountS03(ctx.player); if(n>0) API.millTop(ctx.opponent, n, '増幅する悪意'); },
  afterResolve(){},
  passive:{ onStandbyPhase(ctx){ return malevolenceReadyS03(ctx); } }
});
