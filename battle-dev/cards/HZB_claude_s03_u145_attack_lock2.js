/* S03-U145: the rest of the attack-time Spell/Trap lock cards (engine/1ZO), with their other effects.

   古代の機械獣       このカードは特殊召喚できない。①:攻撃する場合の魔法・罠ロック。
                      ②:このカードが戦闘で破壊した相手モンスターの効果は無効化される。 (U25 engine/1S, 漆黒の魔王 LV4 と同じ仕組み)
   古代の機械工兵     ①:このカードがモンスターゾーンに存在する限り、このカードを対象とする罠カードの効果は無効化され破壊される。
                      (U28 engine/1T targeting negator; both players' Trap cards)
                      ②:攻撃する場合の魔法・罠ロック。
                      ③:このカードが攻撃したダメージステップ終了時、相手フィールドの魔法・罠カード1枚を対象として発動する。破壊する。
                      (a trigger in the Monster Zone: when the attacking card was itself destroyed by that battle it is no longer on the
                      field at the end of the Damage Step and ③ is not activated)
   古代の機械究極巨人 「融合召喚でしか特殊召喚できない」 is enforced by U126 (engine/1ZK). ①:攻撃する場合の魔法・罠ロック。②:貫通。
                      ③:このカードが破壊された場合、自分の墓地の「古代の機械巨人」1体を対象として発動できる。召喚条件を無視して特殊召喚する。
                      (API.specialSummon opts.ignoreSummonConditionS03: 古代の機械巨人 cannot be Special Summoned otherwise)
   E－HERO ワイルド・サイクロン  「ダーク・フュージョンの効果でのみ特殊召喚できる」 is enforced for Fusion Spells by U130 (engine/1ZL) and for
                      revival by U127. ①:攻撃する場合の魔法・罠ロック。
                      ②:このカードが相手に戦闘ダメージを与えた場合に発動する。相手フィールドにセットされた魔法・罠カードを全て破壊する。 */

/* ---- 古代の機械獣 ---- */
declareAttackLockS03('古代の機械獣');
declareBattleDestroyedNegatorS03('古代の機械獣', {});
defineScript('古代の機械獣', { type:'monster', priority:1, cannotSpecialSummon:true,
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } } });

/* ---- 古代の機械工兵 ---- */
declareAttackLockS03('古代の機械工兵');
declareTargetingNegatorS03('古代の機械工兵', {
  applies({srcDb, negator}){
    if(!srcDb || srcDb.k !== 't') return null;
    if(!negator || !negator.card || negator.card.face !== 'up') return null;
    return {mode:'effect', destroySource:true, reason:'古代の機械工兵'};
  }
});
function u145FoeSpellTraps(ctx){
  return API.fieldCards({ player:ctx.opponent, filter:x => x.zone === 'sz' || x.zone === 'field' });
}
function u145EngineerAttacked(ctx){
  const b = ctx.battle || {};
  return ctx.zone === 'mz' && b.atkCard === ctx.card && ctx.card.face === 'up';
}
defineScript('古代の機械工兵', {
  type:'monster', priority:1, forced:true, targets:true, dsTiming:'end',
  condition(ctx){
    if(!u145EngineerAttacked(ctx)){ ctx.reason = 'このカードが攻撃したダメージステップ終了時に発動します'; return false; }
    if(!u145FoeSpellTraps(ctx).length){ ctx.reason = '相手フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('古代の機械工兵：破壊する相手の魔法・罠カード', u145FoeSpellTraps(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.p === ctx.opponent && (r.zone === 'sz' || r.zone === 'field')) API.destroy(r, '古代の機械工兵');
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } },
  passive:{ onDamageStep(ctx){ return ctx.step === 'end' && u145EngineerAttacked(ctx) && u145FoeSpellTraps(ctx).length > 0; } }
});

/* ---- 古代の機械究極巨人 ---- */
declareAttackLockS03('古代の機械究極巨人');
function u145DestroyedSelf(ctx){
  const e = ctx.event || {};
  if(ctx.eventName && ctx.eventName !== 'onDestroy') return false;
  if(ctx.zone !== 'grave' && ctx.zone !== 'banish') return false;
  const u = e.uid != null ? e.uid : (e.card && e.card.uid != null ? e.card.uid : null);
  return e.card === ctx.card || (u != null && ctx.card && u === ctx.card.uid);
}
function u145GiantsInGrave(ctx){
  return API.pileCards(ctx.player, 'grave', x => x.db.n === '古代の機械巨人');
}
defineScript('古代の機械究極巨人', {
  type:'monster', priority:1, targets:true, activateFrom:['grave','banish'], includesSpecialSummon:true, blocksIfNoSpecialSummon:true,
  condition(ctx){
    if(!u145DestroyedSelf(ctx)){ ctx.reason = 'このカードが破壊された場合に発動できます'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    if(!u145GiantsInGrave(ctx).length){ ctx.reason = '墓地に「古代の機械巨人」がいません'; return false; }
    return true;
  },
  selectTargets(ctx, done){
    API.selectCard('古代の機械究極巨人：特殊召喚する「古代の機械巨人」', u145GiantsInGrave(ctx), t => done([t]));
  },
  resolve(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(!r || r.p !== ctx.player || r.zone !== 'grave') return;
    API.specialSummon(ctx.player, 'grave', r.index, 'atk', '古代の機械究極巨人', null, {ignoreSummonConditionS03:true});
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; }, piercingDamage(info){ return s03PiercingS03(info, info && info.self); } },
  passive:{ onDestroy(ctx){ return u145DestroyedSelf(ctx) && u145GiantsInGrave(ctx).length > 0; } }
});

/* ---- E－HERO ワイルド・サイクロン ---- */
declareAttackLockS03('E－HERO ワイルド・サイクロン');
function u145FoeSetSpellTraps(ctx){
  return API.fieldCards({ player:ctx.opponent, filter:x => (x.zone === 'sz' || x.zone === 'field') && x.card && x.card.face === 'down' });
}
defineScript('E－HERO ワイルド・サイクロン', {
  type:'monster', priority:1, forced:true,
  condition(ctx){
    if(ctx.zone !== 'mz' || !a3DealtBattleDamage(ctx)){ ctx.reason = 'このカードが相手に戦闘ダメージを与えた場合に発動します'; return false; }
    return true;
  },
  resolve(ctx){
    /* each card is located again right before its destruction (indices shift as cards leave) */
    u145FoeSetSpellTraps(ctx).map(x => x.card)
      .forEach(c => { const r = locateCardAnyV4(c); if(r && r.p === ctx.opponent && (r.zone === 'sz' || r.zone === 'field') && r.card.face === 'down') API.destroy(r, 'E－HERO ワイルド・サイクロン'); });
  },
  afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; } },
  passive:{ onBattleDamage(ctx){ return ctx.zone === 'mz' && a3DealtBattleDamage(ctx); } }
});
