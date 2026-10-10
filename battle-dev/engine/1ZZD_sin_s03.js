/* =========================================================================
   S03-U187 — 「Sin」 monsters (common mechanism)
   -------------------------------------------------------------------------
   2011 texts share: このカードは通常召喚できない。(EXデッキ｜デッキ｜手札・デッキ)から「X」1体を除外した場合のみ特殊召喚できる。
   ①「Sin」モンスターはフィールドに1体しか表側表示で存在できない。 ② 他の自分のモンスターは攻撃宣言できない。
   ③ フィールド魔法カードが表側表示で存在しない場合にこのカードは破壊される (engine-wide: enforceSinUpkeep, name prefix 「Sin」).
   declareSinS03(name, {banish, from, script}) defines the summon procedure (the player picks the copy / zone when there are several)
   and ②; ① is checked by the procedure and by canEffectSpecialSummonS03 / API.specialSummon (sinUniqueReasonS03).
   Sin スターダスト・ドラゴン ②: 「フィールドゾーンの表側表示のカードは効果では破壊されない」 — sinFieldProtectedS03, read by the
   FX_TO_GRAVE / FX_WIPE_ZONE reducers.
   ========================================================================= */
function isSinDbS03(db){ return !!db && db.k==='m' && String(db.n||'').indexOf('Sin ')===0; }
function sinFaceUpS03(gs){ gs = gs || gameState; const out = []; gs.players.forEach((P,p)=>(P.mz||[]).forEach(c=>{ if(c && c.face==='up' && isSinDbS03(dbOf(c))) out.push({p, card:c}); })); return out; }
function sinUniqueReasonS03(card){
  if(!card || !isSinDbS03(dbOf(card))) return '';
  return sinFaceUpS03().length ? '「Sin」モンスターはフィールドに1体しか表側表示で存在できません' : '';
}
function sinBanishPoolS03(p, banish, from){
  const out = [];
  from.forEach(z=>API.pileCards(p, z, x=>x.db.n===banish).forEach(x=>out.push(x)));
  return out;
}
function declareSinS03(name, spec){
  const S = Object.assign({from:['deck']}, spec||{});
  const zonesJp = S.from.map(z=>({ex:'EXデッキ', deck:'デッキ', hand:'手札'}[z]||z)).join('・');
  const def = Object.assign({
    type:'monster', priority:1,
    summonProcedure:{from:'hand', positions:['atk','def'],
      condition(ctx){
        if(!sinBanishPoolS03(ctx.player, S.banish, S.from).length){ ctx.reason = `${zonesJp}に「${S.banish}」がありません`; return false; }
        const u = sinUniqueReasonS03(ctx.card); if(u){ ctx.reason = u; return false; }
        return true;
      },
      cost(ctx, done){
        const pool = sinBanishPoolS03(ctx.player, S.banish, S.from);
        if(!pool.length){ done(false); return; }
        const go = (t)=>{ const r = resolveTarget(t); if(!r){ done(false); return; } API.banish(r, `${name}（特殊召喚の手順）`); done(true); };
        if(pool.length===1 || S.from.length===1){ go(pool[0]); return; }
        API.selectCard(`${name}：除外する「${S.banish}」`, pool, go);
      }},
    continuous:{scope:'ownMonsters', from:['mz'], apply(){ return null; }, cannotAttack(target, self){ return target!==self; }}
  }, S.script||{});
  return defineScript(name, def);
}
/* Sin スターダスト・ドラゴン ② */
function sinFieldProtectedS03(gs, card){
  if(!card) return false;
  return (gs||gameState).players.some(P=>(P.mz||[]).some(c=>c && c.face==='up' && cardName(c)==='Sin スターダスト・ドラゴン' && !(typeof effectNegated==='function' && effectNegated(c))));
}
