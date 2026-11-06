/* =========================================================================
   S03-U513 — 任意の装備身代わりと、それを使う未実装カード（カード実装）
   -------------------------------------------------------------------------
   《ファイティング・スピリッツ》（NOT_STARTED・装備魔法）
     装備モンスターの攻撃力は相手フィールド上に存在するモンスター1体につき300ポイントアップする。
     装備モンスターが戦闘によって破壊される場合、代わりにこのカードを破壊する事ができる。
   《白銀の翼》（NOT_STARTED・装備魔法）
     レベル8以上のドラゴン族シンクロモンスターにのみ装備可能。
     装備モンスターは1ターンに2度まで、戦闘では破壊されない。
     装備モンスターがカードの効果によって破壊される場合、代わりにこのカードを破壊する事ができる。
   《大和神》（ENGINE_GAP・星6 戦士/闇 2200/1200・スピリット）
     このカードは通常召喚する事ができない。
     自分の墓地に存在するスピリットモンスター1体をゲームから除外した場合のみ特殊召喚する事ができる。
     特殊召喚したターンのエンドフェイズ時に持ち主の手札に戻る。
     このカードが戦闘によって相手モンスターを破壊した場合、
     相手フィールド上に存在する魔法または罠カード1枚を破壊する事ができる。

   足した共通処理は 1 つだけ。装備カードが `equipSubstituteOptionalS03:{causes:[...]}` を申告すると、
   装備モンスターの破壊に対して S03-U173 の**任意の身代わり**（engine/1ZV）の選択肢に出る
   （種別 'equipSub'）。強制版の `equipSubstituteS03`（S03-U183）は触っていない。

   《大和神》の ENGINE_GAP の記録（「『通常召喚できない』の消費側が無い」）は失効していた:
   `cannotNormalSummon` は engine/70（S03-U190）が読んでおり、`FX_SPECIAL_SUMMON` は
   `summonedTurn` を立てる（engine/00）ので、S03-U244 のスピリットの戻りがそのまま使える。
   ========================================================================= */

/* ---- 共通処理: 任意の装備身代わりの申告を読む ----
   card（装備モンスター）に付いている装備カードのうち、`equipSubstituteOptionalS03` を申告していて
   表側表示・効果が無効でないものを返す。cause を渡した場合は原因（'battle' / 'effect'）で絞る。 */
function equipSubOptionalDeclsS03(card, cause, gs){
  gs = gs || gameState;
  const out = [];
  if(!card || !Array.isArray(card.equippedBy) || !card.equippedBy.length) return out;
  if(typeof CARD_SCRIPTS === 'undefined') return out;
  for(let p = 0; p < (gs.players || []).length; p++){
    const sz = gs.players[p].sz || [];
    for(let i = 0; i < sz.length; i++){
      const eq = sz[i];
      if(!eq || eq.face !== 'up' || eq.equipUid == null) continue;
      if(card.equippedBy.indexOf(eq.equipUid) < 0) continue;
      const sc = CARD_SCRIPTS[cardName(eq)], decl = sc && sc.equipSubstituteOptionalS03;
      if(!decl) continue;
      if(typeof effectNegated === 'function' && effectNegated(eq)) continue;
      if(cause && Array.isArray(decl.causes) && decl.causes.indexOf(cause) < 0) continue;
      ensureCardUid(gs, eq);
      out.push({uid:eq.uid, name:cardName(eq), p:p, index:i, decl:decl});
    }
  }
  return out;
}

/* ---- ファイティング・スピリッツ ---- */
function u513FoeMonsterCountS03(self){
  const h = locateCardAnyV4(self);
  if(!h) return 0;
  const foe = (h.p === 0) ? 1 : 0;
  return (gameState.players[foe].mz || []).filter(c => !!c).length;
}
u412Define('ファイティング・スピリッツ', {
  pred: x => !!x && x.db && x.db.k === 'm',
  own: true,
  meta: { activateFrom:['hand','sz'], equipSubstituteOptionalS03:{causes:['battle']} },
  continuous:{ apply(card, self){
    if(!equippedS03(card, self)) return null;
    const n = u513FoeMonsterCountS03(self);
    return n > 0 ? {atk:300 * n} : null; } }
});

/* ---- 白銀の翼 ---- */
function u513Lv8DragonSynchroS03(x){
  const db = x && x.db;
  if(!db || db.k !== 'm') return false;
  if(Number(db.lv) < 8) return false;
  if(db.ra !== 'ドラゴン') return false;
  return Array.isArray(db.st) && db.st.indexOf('シンクロ') >= 0;
}
u412Define('白銀の翼', {
  pred: u513Lv8DragonSynchroS03,
  own: true,
  meta: { activateFrom:['hand','sz'], equipSubstituteOptionalS03:{causes:['effect']} },
  continuous:{
    apply(){ return null; },
    /* 1ターンに2度まで戦闘では破壊されない（v21 の perTurn） */
    protectV21:{ key:'白銀の翼', label:'白銀の翼', perTurn:2,
      battle:(target, self) => equippedS03(target, self) }
  }
});

/* ---- 大和神 ---- */
function u513GraveSpiritsS03(p){
  return API.pileCards(p, 'grave', x => u512IsSpiritDbS03(x.db));
}
function u513BattleKilledFoeS03(ctx){
  const me = locateCardAnyV4(ctx.card);
  if(!me || me.zone !== 'mz') return null;
  const b = ctx.battle || {};
  let victim = null;
  if(b.atkCard === ctx.card && b.destroyedDef && b.defCard) victim = b.defCard;
  if(b.defCard === ctx.card && b.destroyedAtk && b.atkCard) victim = b.atkCard;
  if(!victim) return null;
  const vh = locateCardAnyV4(victim);
  /* 相手のモンスターを戦闘で破壊した場合（破壊された側はもう場に居ない） */
  return (vh && vh.p === ctx.player) ? null : victim;
}
function u513FoeStS03(ctx){
  return API.fieldCards({player:ctx.opponent, zone:'sz', filter:x => !!x.card});
}
defineSpiritS03('大和神', [{
  key:'battle-break-st', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1,
  events:['onDamageStep'], targetRange:LOCATION.SZONE, targetSide:'opponent',
  condition(ctx){
    if(!u513BattleKilledFoeS03(ctx)){
      ctx.reason = '戦闘で相手モンスターを破壊した場合に発動します'; return false; }
    if(!u513FoeStS03(ctx).length){
      ctx.reason = '相手フィールドに魔法・罠カードがありません'; return false; }
    return true;
  },
  target(ctx, done){
    API.selectCard('大和神：破壊する相手の魔法・罠', u513FoeStS03(ctx), t => done([t]));
  },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0];
    const r = t && resolveTarget(t);
    if(r && r.zone === 'sz') API.destroy(r, '大和神');
  },
  afterResolve(){}
}], {
  cannotSpecialSummon:false,          /* defineSpiritS03 の既定を上書き（このカードは特殊召喚でしか出せない） */
  cannotNormalSummon:true,
  targets:true,
  summonProcedure:{
    from:['hand'],
    positions:['atk','def'],
    condition(ctx){
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      if(!u513GraveSpiritsS03(ctx.player).length){
        ctx.reason = '墓地に除外するスピリットモンスターがいません'; return false; }
      return true;
    },
    cost(ctx, done){
      const q = u513GraveSpiritsS03(ctx.player);
      if(!q.length){ done(false); return; }
      API.selectCard('大和神：除外する墓地のスピリットモンスター', q, t => {
        const r = t && resolveTarget(t);
        if(!r || r.zone !== 'grave'){ done(false); return; }
        API.banish(r, '大和神（特殊召喚手順）');
        done(true);
      });
    },
    execute(ctx){
      const zone = ctx.zone || 'hand';
      const pile = gameState.players[ctx.player][zone] || [];
      const i = pile.indexOf(ctx.card);
      if(i < 0) return;
      const pos = (ctx.position === 'def' || ctx.pos === 'def') ? 'def' : 'atk';
      API.specialSummon(ctx.player, zone, i, pos, '大和神');
    }
  },
  passive:{ onDamageStep(ctx){
    return ctx.zone === 'mz' && !!u513BattleKilledFoeS03(ctx) && u513FoeStS03(ctx).length > 0; } }
});
