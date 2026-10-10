/* S03-U249: 「…の効果を受けない」 (2011 texts) — 天下人 紫炎, トラファスフィア, 暴君の威圧 (ENGINE_GAP).
   Engine: S03-U115 (engine/1ZG): an action stamped with its effect source {uid, k} is skipped for a card that is unaffected by it, and
   continuous Spell / Trap sources skip it too. A card declares unaffectedByS03(card, src); S03-U249 adds continuous.grantUnaffectedS03
   (another face-up card grants it). */

/* ---- 天下人 紫炎: このカードは罠の効果を受けない。 ---- */
defineScript('天下人 紫炎', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  unaffectedByS03(card, src){ return !!src && src.k==='t'; }
});

/* ---- トラファスフィア: このカードをアドバンス召喚する場合、リリースするモンスターは鳥獣族モンスターでなければならない。
   このカードはフィールド上に表側表示で存在する限り罠カードの効果を受けない。 (the Tribute Summon / Set method is restricted: System v23 materialFilter) ---- */
defineScript('トラファスフィア', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  normalSummonProcedure:{includeStandard:false, methods:[
    {id:'wingedBeastTribute', tributes:1, modes:['summon','set'],
     summonLabel:'鳥獣族モンスター1体をリリースしてアドバンス召喚', setLabel:'鳥獣族モンスター1体をリリースしてアドバンスセット',
     materialFilter(c){ return (typeof currentRaceV17==='function' ? currentRaceV17(c.card) : c.db.ra)==='鳥獣'; }}]},
  unaffectedByS03(card, src){
    if(!src || src.k!=='t' || !card || card.face!=='up') return false;
    const h = findCardByUid(card.uid); return !!h && h.zone==='mz';
  }
});

/* ---- 暴君の威圧 (Continuous Trap): 自分フィールド上に存在するモンスター1体をリリースして発動する。このカードがフィールド上に存在する限り、
   フィールド上に表側表示で存在する元々の持ち主が自分となるモンスターは、このカード以外の罠カードの効果を受けない。 ---- */
function tyrantPressureCostsS03(ctx){ return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}); }
defineScript('暴君の威圧', {
  type:'trap', priority:2,
  condition(ctx){
    if(ctx.zone==='sz' && ctx.card && ctx.card.face==='up' && !ctx.card.activationPending){ ctx.reason = '発動済みです'; return false; }
    if(!tyrantPressureCostsS03(ctx).length){ ctx.reason = 'リリースするモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){
    API.selectCard('暴君の威圧：リリースするモンスター', tyrantPressureCostsS03(ctx), t=>{
      const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; }
      API.sendToGrave(r, '暴君の威圧（リリース）'); done(true);
    });
  },
  resolve(){}, afterResolve(){},
  continuous:{scope:'self', from:['sz'], apply(){ return null; },
    grantUnaffectedS03(card, src, self){
      if(!card || !self || self.face!=='up' || self.activationPending || !src || src.k!=='t' || src.uid===self.uid) return false;
      const me = findCardByUid(self.uid), h = findCardByUid(card.uid);
      if(!me || me.zone!=='sz' || !h || h.zone!=='mz' || card.face!=='up') return false;
      const owner = (card.owner===0 || card.owner===1) ? card.owner : h.p;
      return owner===me.p;
    }}
});
