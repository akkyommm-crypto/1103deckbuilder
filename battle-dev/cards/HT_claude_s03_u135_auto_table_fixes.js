/* S03-U135: AUTO_DECK_TABLE entries that the (now applied) identity filters cannot express.

   ---- コアキメイル・ロック ----
   このカードが戦闘によって破壊され墓地へ送られた時、デッキから「コアキメイルの鋼核」1枚または
   レベル4以下の「コアキメイル」と名のついたモンスター1体を手札に加える事ができる。
   The table entry {op:search, trig:ignition, f:{lvmax:4, cardCode:鋼核, tk:"m"}} was wrong both ways: an ignition effect
   instead of the battle-destroyed trigger, and (with the cardCode filter ignored) it searched any Lv4-or-lower monster;
   with the filter applied it matched nothing (鋼核 is a Spell). This script replaces it. */
function koakiLockCandsS03(p){
  return API.pileCards(p, 'deck', x=>x.db.n==='コアキメイルの鋼核'
    || (x.db.k==='m' && String(x.db.n||'').indexOf('コアキメイル')>=0 && (x.db.lv||0) <= 4));
}
defineScript('コアキメイル・ロック', {
  type:'monster', priority:1, activateFrom:['grave'],
  condition(ctx){
    if(!a3SelfBattleDestroyed(ctx)){ ctx.reason = '戦闘によって破壊され墓地へ送られた時に発動できます'; return false; }
    if(!koakiLockCandsS03(ctx.player).length){ ctx.reason = 'デッキに「コアキメイルの鋼核」またはレベル4以下の「コアキメイル」モンスターがありません'; return false; }
    return true;
  },
  resolve(ctx){
    const q = koakiLockCandsS03(ctx.player);
    if(!q.length) return;
    API.requestChoice({player:ctx.player, kind:'card', title:'コアキメイル・ロック：手札に加えるカード', candidates:q,
      min:1, max:1, cancelable:false, resume:{handler:'s03u135.koaki-lock-search', args:{player:ctx.player}}, meta:{scriptName:'コアキメイル・ロック'}});
  },
  afterResolve(){},
  passive:{ onDamageStep(ctx){ return a3SelfBattleDestroyed(ctx) && koakiLockCandsS03(ctx.player).length > 0; } }
});
API.registerChoiceHandler('s03u135.koaki-lock-search', (answer, args)=>{
  const picks = v49P1ChoiceCards(answer);
  const h = picks[0] && locateCardAnyV4(picks[0].card);
  if(h && h.zone==='deck' && h.p===args.player) API.searchDeck(args.player, h.index, 'コアキメイル・ロック');
});
