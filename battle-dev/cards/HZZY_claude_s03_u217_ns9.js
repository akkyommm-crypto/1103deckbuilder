/* S03-U217: NOT_STARTED cards (2011 texts) — かつて神と呼ばれた亀, マジシャンズ・ヴァルキリア, ヒエラコスフィンクス, 闇竜の黒騎士, 魔轟神獣コカトル,
   ミラージュ・ドラゴン, メカニカル・ハウンド, フォトン・ケルベロス.
   Engine: activationLockS03 (engine/1ZD monsterActivationLockReasonS03). */

/* ---- かつて神と呼ばれた亀: このカードがフィールド上に表側表示で存在する限り、お互いに攻撃力1800以上のモンスターを特殊召喚できない。 (engine/40, S03-U211) ---- */
defineScript('かつて神と呼ばれた亀', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db)=> Number(db.atk)>=1800
});

/* ---- マジシャンズ・ヴァルキリア: このカードがフィールド上に表側表示で存在する限り、相手は他の魔法使い族モンスターを攻撃対象に選択できない。 ---- */
defineScript('マジシャンズ・ヴァルキリア', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target!==self && self.face==='up' && target.face==='up' && currentRaceV17(target)==='魔法使い' }
});

/* ---- ヒエラコスフィンクス: このカードが自分フィールド上に表側表示で存在する限り、相手は裏側守備表示モンスターを攻撃対象に選択する事ができない。 ---- */
defineScript('ヒエラコスフィンクス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && target.face==='down' && target.pos==='def' }
});

/* ---- 闇竜の黒騎士: 1ターンに1度、戦闘で破壊された相手の墓地のレベル4以下のアンデット族モンスター1体を対象として発動できる。そのアンデット族モンスターを
   自分フィールドに特殊召喚する。 ---- */
function darkKnightTargetsS03(ctx){ return API.pileCards(ctx.opponent,'grave',x=>x.db.k==='m' && x.db.ra==='アンデット' && Number(x.db.lv||99)<=4
  && !!(x.card.graveInfo && x.card.graveInfo.battle && x.card.graveInfo.byDestroy) && canEffectSpecialSummonS03(x.card,'grave','闇竜の黒騎士')); }
defineScript('闇竜の黒騎士', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1, targets:true, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if(!darkKnightTargetsS03(ctx).length){ ctx.reason = '相手の墓地に戦闘で破壊されたレベル4以下のアンデット族がいません'; return false; }
    if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
    return true;
  },
  selectTargets(ctx, done){ API.selectCard('闇竜の黒騎士：特殊召喚するアンデット族', darkKnightTargetsS03(ctx), t=>done([t])); },
  resolve(ctx){ const t = ctx.selectedTargets[0], h = t && t.card && t.card.uid!=null ? findCardByUid(t.card.uid) : null;
    if(h && h.zone==='grave' && hasMonsterZoneSpace(ctx.player)) API.specialSummon(ctx.player, 'grave', h.index, 'atk', '闇竜の黒騎士', h.p); },
  afterResolve(){}
});

/* ---- 魔轟神獣コカトル: このカードが戦闘によって相手モンスターを破壊し墓地へ送った時、手札から「魔轟神」と名のついたモンスター1体を捨てて発動できる。
   デッキからカードを1枚ドローする。 (cost: the discard) ---- */
function cockatrCostsS03(ctx){ return API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && isSetCardV4(x.db, SETCODE.FABLED)); }
defineScript('魔轟神獣コカトル', {
  type:'monster', priority:1, dsTiming:'leave', onOtherSummon:false,
  condition(ctx){
    if(ctx.eventName!=='onBattleDestroy' || !windaarDestroyedS03(ctx)){ ctx.reason = '戦闘によって相手モンスターを破壊し墓地へ送った時に発動します'; return false; }
    if(!cockatrCostsS03(ctx).length){ ctx.reason = '手札に「魔轟神」モンスターがいません'; return false; }
    return true;
  },
  cost(ctx, done){ API.selectCard('魔轟神獣コカトル：捨てる「魔轟神」', cockatrCostsS03(ctx), t=>{ const r = resolveTarget(t); if(!r || r.zone!=='hand'){ done(false); return; } API.discard(ctx.player, r.index, '魔轟神獣コカトル（コスト）', {byEffect:false}); done(true); }); },
  resolve(ctx){ API.draw(ctx.player, 1); },
  afterResolve(){},
  passive:{ onBattleDestroy(ctx){ return windaarDestroyedS03(ctx) && cockatrCostsS03(ctx).length>0; } }
});

/* ---- ミラージュ・ドラゴン: このカードがフィールド上に表側表示で存在する限り、相手はバトルフェイズ中に罠カードを発動する事ができない。 ---- */
defineScript('ミラージュ・ドラゴン', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.p!==i.srcPlayer && i.db.k==='t' && gameState.phase==='battle'
});

/* ---- メカニカル・ハウンド: 自分の手札が0枚である限り、相手は魔法カードを発動する事ができない。 ---- */
defineScript('メカニカル・ハウンド', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=> i.p!==i.srcPlayer && i.db.k==='s' && !(gameState.players[i.srcPlayer].hand||[]).length
});

/* ---- フォトン・ケルベロス: このカードが召喚に成功したターン、このカードがフィールド上に表側表示で存在する限りお互いに罠カードを発動する事はできない。 ---- */
defineScript('フォトン・ケルベロス', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  activationLockS03:(i)=>{ const c = i.src, sp = c.summonProvenance;
    return i.db.k==='t' && Number(c.summonedTurn)===Number(gameState.turn) && !!sp && (sp.summonType==='normal' || sp.summonType==='tribute'); }
});
