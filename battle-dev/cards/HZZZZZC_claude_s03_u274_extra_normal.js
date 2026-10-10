/* S03-U274: extra Normal Summons (2011 texts) — 二重召喚, 氷結界の虎将 グルナード.
   Engine (this unit): normalRightFreeS03 / consumeNormalRightS03 (engine/00; temporaryFlags.doubleSummonS03 1 = available, 2 = used) used by the
   Normal Summon / Set reducers and the legality checks; continuous.extraNormalS03 {filter} offered by extraNormalSummonKeyV370 (engine/40),
   consumed once per turn per source card. */

/* ---- 二重召喚 (Spell): ①:このターン自分は通常召喚を2回まで行う事ができる。 ---- */
defineScript('二重召喚', {
  type:'spell', priority:1,
  condition(ctx){
    if(API.me(ctx).temporaryFlags && API.me(ctx).temporaryFlags.doubleSummonS03 != null){ ctx.reason = 'このターンは既に通常召喚を2回まで行えます'; return false; }
    return true;
  },
  resolve(ctx){
    const tf = API.me(ctx).temporaryFlags || {};
    if(tf.doubleSummonS03 == null) API.setFlag(ctx.player, 'doubleSummonS03', 1, true);
    API.log('二重召喚：このターン、通常召喚を2回まで行える');
  },
  afterResolve(){}
});

/* ---- 氷結界の虎将 グルナード: このカードがフィールド上に表側表示で存在する限り、自分のメインフェイズ時に1度だけ、
   自分は通常召喚に加えて「氷結界」と名のついたモンスター1体を召喚できる。 ---- */
defineScript('氷結界の虎将 グルナード', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ extraNormalS03:{ filter(db){ return isSetCardV4(db, SETCODE.ICE_BARRIER); } } }
});
