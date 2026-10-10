/* S03-U211: NOT_STARTED cards (2011 texts) — A・O・J D.D.チェッカー, 魔轟神ミーズトージ, ドラゴンに乗るワイバーン, マジカルフィシアリスト, E・HERO クノスペ,
   超古代恐獣.
   Engine: specialSummonLockS03 (engine/40 scriptSpecialSummonLockS03); characteristic mods with faceUpOnlyS03 end when the monster is
   turned face-down (engine/1G, engine/00 FX_SET_STATE). */

/* ---- A・O・J D.D.チェッカー: このカードがフィールド上に表側表示で存在する限り、お互いに光属性モンスターを特殊召喚できない。 ---- */
defineScript('A・O・J D.D.チェッカー', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db)=> db.at==='光'
});

/* ---- 魔轟神ミーズトージ: このカードを手札から墓地へ送り、チューナー以外の自分フィールド上の「魔轟神」と名のついたモンスター1体を選択して発動できる。
   選択したモンスターはフィールド上に表側表示で存在する限りチューナーとして扱う。 (cost: sending itself; the mod ends when the monster leaves
   the field or is turned face-down) ---- */
function mizutojiTargetsS03(ctx){
  return API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && isSetCardV4(x.db, SETCODE.FABLED) && !isTunerNowV17(x.card)});
}
defineScript('魔轟神ミーズトージ', {
  type:'monster', priority:1, timing:['mainPhase'], activateFrom:['hand'], targets:true,
  condition(ctx){
    if(ctx.zone!=='hand'){ ctx.reason = '手札から墓地へ送って発動します'; return false; }
    if(!mizutojiTargetsS03(ctx).length){ ctx.reason = 'チューナー以外の表側表示の「魔轟神」がいません'; return false; }
    return true;
  },
  cost(ctx, done){ const h = ctx.card && ctx.card.uid!=null ? findCardByUid(ctx.card.uid) : null; if(!h || h.zone!=='hand'){ done(false); return; }
    API.sendToGrave(h, '魔轟神ミーズトージ（コスト）'); done(true); },
  selectTargets(ctx, done){ API.selectCard('魔轟神ミーズトージ：チューナーとして扱う「魔轟神」', mizutojiTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){
    const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='mz' && h.card.face==='up') addCharModV17(h, {kind:'tuner', value:1, until:'permanent', label:'魔轟神ミーズトージ', faceUpOnlyS03:true});
  },
  afterResolve(){}
});

/* ---- ドラゴンに乗るワイバーン: 相手フィールドの表側表示モンスターが地・水・炎属性モンスターのみの場合、このカードは直接攻撃できる。 ---- */
defineScript('ドラゴンに乗るワイバーン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  canDirectAttack(card, loc){
    const p = loc ? loc.p : null; if(p!==0 && p!==1) return false;
    const up = (gameState.players[1-p].mz||[]).filter(c=>c && c.face==='up');
    return up.length>0 && up.every(c=>['地','水','炎'].indexOf((typeof currentAttributeV17==='function') ? currentAttributeV17(c) : dbOf(c).at)>=0);
  }
});

/* ---- マジカルフィシアリスト: このカードが召喚に成功した時、このカードに魔力カウンターを1つ置く(最大1つまで)。また、自分のメインフェイズ時にこのカードに
   乗っている魔力カウンターを1つ取り除く事で、自分フィールド上のモンスター1体を選択してその攻撃力をエンドフェイズ時まで500ポイントアップする。 ---- */
function physiCountersS03(card){ return (card && card.counters && card.counters['魔力']) || 0; }
defineUnifiedCardV4('マジカルフィシアリスト',[{
  key:'counter', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onNormalSummon'], forced:true,
  condition(ctx){ if(ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = 'このカードが召喚に成功した時に発動します'; return false; } return true; },
  operation(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && physiCountersS03(me.card)<1) API.addCounter(me, '魔力', 1); },
  afterResolve(){}
},{
  key:'boost', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE, speed:1, events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドで発動します'; return false; }
    if(physiCountersS03(ctx.card)<1){ ctx.reason = '魔力カウンターが乗っていません'; return false; }
    if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}).length){ ctx.reason = '自分フィールドに表側表示のモンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(!me || me.zone!=='mz'){ done(false); return; } API.removeCounter(me, '魔力', 1); done(true); },
  target(ctx, done){ API.selectCard('マジカルフィシアリスト：攻撃力を上げるモンスター', API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up'}), t=>done([t])); },
  operation(ctx){
    const t = ctx.selectedTargets && ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='mz' && h.card.face==='up') API.modAtk(h, 500, 0, 'endPhase', 'マジカルフィシアリスト');
  },
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, timing:['summon','mainPhase'],
  passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }});

/* ---- E・HERO クノスペ: 相手プレイヤーに戦闘ダメージを与える度に、このカードの攻撃力は100ポイントアップし、守備力は100ポイントダウンする。
   このカードを除く「E・HERO」と名のついたモンスターが自分フィールド上に表側表示で存在する限り、相手はこのカードを攻撃対象に選択できず、
   このカードは相手プレイヤーに直接攻撃する事ができる。 ---- */
function knospeHeroS03(self){
  const loc = self ? locateCard(self) : null; if(!loc || loc.zone!=='mz') return false;
  return (gameState.players[loc.p].mz||[]).some(c=>c && c!==self && c.face==='up' && isSetCardV4(dbOf(c), SETCODE.ELEMENTAL_HERO));
}
defineScript('E・HERO クノスペ', {
  type:'monster', priority:1, forced:true,
  condition(ctx){ if(ctx.zone!=='mz' || !a3DealtBattleDamage(ctx)){ ctx.reason = '相手に戦闘ダメージを与えた時に適用されます'; return false; } return true; },
  resolve(ctx){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz' && me.card.face==='up') API.modAtk(me, 100, -100, 'permanent', 'E・HERO クノスペ'); },
  afterResolve(){},
  canDirectAttack(card){ return !!card && card.face==='up' && knospeHeroS03(card); },
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target===self && self.face==='up' && knospeHeroS03(self) },
  passive:{ onBattleDamage(ctx){ return ctx.zone==='mz' && a3DealtBattleDamage(ctx); } }
});

/* ---- 超古代恐獣: このカードは恐竜族モンスター1体をリリースして表側攻撃表示でアドバンス召喚できる。
   ①:このカードがモンスターゾーンに存在し、自分の墓地から恐竜族モンスターが特殊召喚された時に発動できる。自分はデッキから1枚ドローする。 ---- */
function ultraDinoRevivedS03(ctx){
  if(ctx.zone!=='mz' || !ctx.card || ctx.card.face!=='up') return false;
  const e = ctx.event || {}, h = e.uid!=null ? findCardByUid(e.uid) : null;
  if(!h || h.zone!=='mz' || h.card===ctx.card) return false;
  const c = h.card;
  return c.face==='up' && c.specialSummoned===true && c.specialSummonedFrom==='grave' && c.specialSummonedFromPlayer===ctx.player
    && Number(c.summonedTurn)===Number(gameState.turn) && ((typeof currentRaceV17==='function') ? currentRaceV17(c) : dbOf(c).ra)==='恐竜';
}
defineScript('超古代恐獣', {
  type:'monster', priority:1, onOtherSummon:true,
  normalSummonProcedure:{ includeStandard:true, methods:[{ id:'ultraDino1', tributes:1, modes:['summon'], summonLabel:'恐竜族モンスター1体をリリースしてアドバンス召喚',
    materialFilter:(h)=> ((typeof currentRaceV17==='function') ? currentRaceV17(h.card) : h.db.ra)==='恐竜' }] },
  condition(ctx){ if(ctx.eventName!=='onSpecialSummon' || !ultraDinoRevivedS03(ctx)){ ctx.reason = '自分の墓地から恐竜族モンスターが特殊召喚された時に発動します'; return false; } return true; },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onSpecialSummon(ctx){ return ultraDinoRevivedS03(ctx); } }
});
