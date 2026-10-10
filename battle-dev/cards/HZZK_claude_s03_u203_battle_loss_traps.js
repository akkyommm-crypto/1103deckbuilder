/* S03-U203: Traps 「自分フィールド上のモンスターが戦闘によって破壊され墓地へ送られた時に発動する事ができる」 — a set Normal Trap offered in the event
   group of the battle destruction (onBattleDestroy; Spell / Trap candidates are ranked after the monster triggers, SEGOC ranks 4 / 5). Before, their
   AUTO_DECK_TABLE entries (cards/40) were coarse trig:"ignition" recruits, activatable at any time.
   The destroyed monster must have been on the trap controller's field: it is in that player's GY (its owner), destroyed by battle this turn,
   by the opponent (graveInfo.byPlayer, as for 悪魂邪苦止). The pool is the shared engine/1ZT one (cards/HZZF helpers). */
function ownBattleLossS03(ctx){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player) return false;
  const g = h.card.graveInfo;
  return !!(g && g.byDestroy && g.battle && Number(g.turn)===Number(gameState.turn) && g.byPlayer===ctx.opponent && ['mz'].indexOf(g.from)>=0);
}
function defineBattleLossTrapS03(name, spec){
  poolSpecS03(name, Object.assign({action:'summon', pos:'faceUp'}, spec));
  defineScript(name, {
    type:'trap', priority:2, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.eventName!=='onBattleDestroy' || !ownBattleLossS03(ctx)){ ctx.reason = '自分フィールドのモンスターが戦闘によって破壊され墓地へ送られた時に発動します'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：特殊召喚するモンスター`); },
    passive:{ onBattleDestroy(ctx){ return ctx.zone==='sz' && ownBattleLossS03(ctx) && hasMonsterZoneSpace(ctx.player); } }
  });
}
/* ヒーロー・シグナル: 自分フィールド上のモンスターが戦闘によって破壊され墓地へ送られた時に発動する事ができる。自分の手札またはデッキから「E・HERO」と名のついた
   レベル4以下のモンスター1体を特殊召喚する。 */
defineBattleLossTrapS03('ヒーロー・シグナル', {from:['hand','deck'], filter:{set:SETCODE.ELEMENTAL_HERO, lvmax:4}});
/* デステニー・シグナル: …自分の手札またはデッキから「D－HERO」と名のついたレベル4以下のモンスター1体を特殊召喚する。 */
defineBattleLossTrapS03('デステニー・シグナル', {from:['hand','deck'], filter:{nameHas:'D－HERO', lvmax:4}});

/* ---- 「自分フィールド上の…モンスターが破壊された時に発動する事ができる」 (onDestroy of an own monster; the trap is set on the same field) ---- */
function ownDestroyedS03(ctx, test){
  const e = ctx.event || {};
  const h = e.uid!=null ? findCardByUid(e.uid) : (e.card ? locateCardAnyV4(e.card) : null);
  if(!h || h.zone!=='grave' || h.p!==ctx.player) return false;
  const g = h.card.graveInfo;
  if(!(g && g.byDestroy && Number(g.turn)===Number(gameState.turn) && g.from==='mz')) return false;
  return !test || test(h.card, g);
}
function defineDestroyedTrapS03(name, spec, test, reason){
  poolSpecS03(name, Object.assign({action:'summon', pos:'faceUp'}, spec));
  defineScript(name, {
    type:'trap', priority:2, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.eventName!=='onDestroy' || !ownDestroyedS03(ctx, test)){ ctx.reason = reason; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    },
    resolve(ctx){ askPoolS03(ctx, name, `${name}：特殊召喚するモンスター`); },
    passive:{ onDestroy(ctx){ return ctx.zone==='sz' && ownDestroyedS03(ctx, test) && hasMonsterZoneSpace(ctx.player); } }
  });
}
/* スネーク・ホイッスル: 自分フィールド上に存在する爬虫類族モンスターが破壊された時に発動する事ができる。自分のデッキからレベル4以下の爬虫類族モンスター1体を
   自分フィールド上に特殊召喚する。 */
defineDestroyedTrapS03('スネーク・ホイッスル', {filter:{ra:'爬虫類', lvmax:4}}, (c)=>dbOf(c).ra==='爬虫類',
  '自分フィールドの爬虫類族モンスターが破壊された時に発動します');
/* 蛇神降臨: 自分フィールド上に表側表示で存在する「毒蛇王ヴェノミノン」が戦闘以外で破壊された時に発動できる。手札・デッキから「毒蛇神ヴェノミナーガ」1体を特殊召喚する。 */
defineDestroyedTrapS03('蛇神降臨', {from:['hand','deck'], filter:{name:'毒蛇神ヴェノミナーガ'}}, (c, g)=>cardName(c)==='毒蛇王ヴェノミノン' && g.face==='up' && !g.battle,
  '表側表示の「毒蛇王ヴェノミノン」が戦闘以外で破壊された時に発動します');
