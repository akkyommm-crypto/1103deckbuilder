/* S03-U227: NOT_STARTED cards (2011 texts) — 暴君の暴飲暴食, ハンター・アウル, 切り込み隊長, 夜薔薇の騎士, フェアリー・アーチャー, ソニックジャマー, アマゾネスの剣士.
   Engine: selfDestroyWhenS03 (engine/1ZZF), effectFlags.noSpellActivationUntilS03 (engine/1ZD). */

/* ---- 暴君の暴飲暴食 (Continuous Trap): 自分フィールド上に存在するモンスター1体をリリースして発動する。このカードがフィールド上に存在する限り、
   お互いにレベル6以上のモンスターを特殊召喚する事はできない。自分の手札が3枚以上の場合、このカードを破壊する。 ---- */
defineScript('暴君の暴飲暴食', {
  type:'trap', priority:2,
  condition(ctx){ if(!API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}).length){ ctx.reason = 'リリースするモンスターがいません'; return false; } return true; },
  cost(ctx, done){ API.selectCard('暴君の暴飲暴食：リリースするモンスター', API.fieldCards({player:ctx.player, zone:'mz', filter:x=>!x.card.cannotTribute}), t=>{
    const r = resolveTarget(t); if(!r || r.zone!=='mz'){ done(false); return; } API.sendToGrave(r, '暴君の暴飲暴食（リリース）'); done(true); }); },
  resolve(){}, afterResolve(){},
  specialSummonLockS03:(db)=> (db.st||[]).indexOf('エクシーズ')<0 && Number(db.lv||0)>=6,
  selfDestroyWhenS03:(card, p)=> (gameState.players[p].hand||[]).length>=3 ? '暴君の暴飲暴食：手札が3枚以上のため破壊' : false
});

/* ---- ハンター・アウル: 自分フィールド上に表側表示で存在する風属性モンスター1体につき、このカードの攻撃力は500ポイントアップする。
   また、自分フィールド上に他の風属性モンスターが表側表示で存在する限り、相手はこのカードを攻撃対象に選択する事はできない。 ---- */
function owlWindsS03(self, excludeSelf){ const loc = self ? locateCard(self) : null; if(!loc) return 0; return (gameState.players[loc.p].mz||[]).filter(c=>c && c.face==='up' && (!excludeSelf || c!==self) && currentAttributeV17(c)==='風').length; }
defineScript('ハンター・アウル', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'],
    apply(target, self){ const n = owlWindsS03(self||target, false); return n ? {atk:n*500} : null; },
    cannotBeAttackTarget:(target, self)=> target===self && self.face==='up' && owlWindsS03(self, true)>0 }
});

/* ---- 切り込み隊長 / 夜薔薇の騎士: ①:このカードが召喚に成功した時に発動できる。手札からレベル4以下の（植物族）モンスター1体を特殊召喚する。
   ②:このカードがモンスターゾーンに存在する限り、相手は他の戦士族（植物族）モンスターを攻撃対象に選択できない。 ---- */
function summonFromHandS03(name, test){
  const pool = ctx=>API.pileCards(ctx.player,'hand',x=>x.db.k==='m' && Number(x.db.lv||99)<=4 && (!test || test(x.db)) && canEffectSpecialSummonS03(x.card,'hand',name));
  return {
    type:'monster', priority:1, blocksIfNoSpecialSummon:true, includesSpecialSummon:true,
    condition(ctx){
      if(ctx.eventName!=='onNormalSummon' || ctx.zone!=='mz' || !eventIsSelfS03(ctx)){ ctx.reason = '召喚に成功した時に発動します'; return false; }
      if(!pool(ctx).length){ ctx.reason = '手札に特殊召喚できるモンスターがいません'; return false; }
      if(!hasMonsterZoneSpace(ctx.player)){ ctx.reason = 'モンスターゾーンが一杯です'; return false; }
      return true;
    },
    resolve(ctx){ const p = pool(ctx); if(!p.length || !hasMonsterZoneSpace(ctx.player)) return;
      API.selectCard(name + '：特殊召喚するモンスター', p, t=>{ const r = resolveTarget(t); if(r && r.zone==='hand') API.specialSummon(ctx.player, 'hand', r.index, 'atk', name); }); },
    afterResolve(){},
    passive:{ onNormalSummon(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx) && pool(ctx).length>0 && hasMonsterZoneSpace(ctx.player); } }
  };
}
defineScript('切り込み隊長', Object.assign(summonFromHandS03('切り込み隊長', null), {
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> target!==self && self.face==='up' && target.face==='up' && currentRaceV17(target)==='戦士' }
}));
defineScript('夜薔薇の騎士', Object.assign(summonFromHandS03('夜薔薇の騎士', db=>db.ra==='植物'), {
  continuous:{ scope:'ownMonsters', from:['mz'], apply(){ return null; },
    cannotBeAttackTarget:(target, self)=> self.face==='up' && target.face==='up' && currentRaceV17(target)==='植物' }
}));

/* ---- フェアリー・アーチャー: 自分のメインフェイズ時に発動できる。自分フィールド上の光属性モンスターの数×400ポイントダメージを相手ライフに与える。
   「フェアリー・アーチャー」の効果は1ターンに1度しか使用できず、この効果を発動するターン、このカードは攻撃できない。 ---- */
defineScript('フェアリー・アーチャー', {
  type:'monster', priority:1, timing:['mainPhase'], countLimit:1,
  condition(ctx){
    if(ctx.zone!=='mz' || ctx.card.face!=='up'){ ctx.reason = 'フィールドに表側表示で存在する場合に発動します'; return false; }
    if((typeof attackCountV48==='function' ? attackCountV48(ctx.card) : 0) > 0){ ctx.reason = 'このターン既に攻撃しています'; return false; }
    return true;
  },
  cost(ctx, done){ const me = locateCardAnyV4(ctx.card); if(me && me.zone==='mz') API.setCardFlag(me, 'cannotAttackTurn', gameState.turn, 'フェアリー・アーチャー', {silent:true}); done(true); },
  resolve(ctx){ const n = API.fieldCards({player:ctx.player, zone:'mz', filter:x=>x.card.face==='up' && currentAttributeV17(x.card)==='光'}).length; if(n>0) API.damageLP(ctx.opponent, n*400); },
  afterResolve(){}
});

/* ---- ソニックジャマー: リバース：次のターンのエンドフェイズ終了時まで、相手は魔法カードを発動できない。 ---- */
defineUnifiedCardV4('ソニックジャマー',[{
  key:'flip-lock', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE, speed:1, events:['onFlip'], forced:true,
  condition(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); },
  operation(ctx){ API.setFlag(ctx.opponent, 'noSpellActivationUntilS03', gameState.turn+1, false); API.log('ソニックジャマー：次のターンの終了時まで、相手は魔法カードを発動できない'); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, passive:{ onFlip(ctx){ return ctx.zone==='mz' && eventIsSelfS03(ctx); } }});

/* ---- アマゾネスの剣士: ①:このカードの戦闘で発生する自分への戦闘ダメージは代わりに相手が受ける。 ---- */
defineScript('アマゾネスの剣士', {
  type:'monster', priority:1,
  condition(ctx){ ctx.reason = '永続効果のみのカードです'; return false; },
  resolve(){}, afterResolve(){},
  continuous:{ scope:'self', from:['mz'], apply(){ return null; },
    battleDamageRedirect(info){
      const self = info.self;
      if(!self || self.face!=='up' || info.to!==info.srcPlayer) return null;
      const inBattle = (info.atkCard && info.atkCard===self) || (info.defCard && info.defCard===self)
        || (info.atkCard && info.atkCard.uid!=null && info.atkCard.uid===self.uid) || (info.defCard && info.defCard.uid!=null && info.defCard.uid===self.uid);
      return inBattle ? (info.srcPlayer===0 ? 1 : 0) : null;
    } }
});
