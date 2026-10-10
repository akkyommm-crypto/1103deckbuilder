/* =========================================================================
   System v4.7 — practical 1103 Extra Deck / utility batch D
   -------------------------------------------------------------------------
   Original implementation against this project's Unified Effect/API layer.
   Historical 1103 behavior is preferred where later card errata differ.
   ========================================================================= */
function v47SelfMz(ctx){
  const h=locateCardAnyV4(ctx.card); return h&&h.p===ctx.player&&h.zone==='mz'?h:null;
}
function v47OwnFaceUpMonsters(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>x.card&&x.card.face==='up'});
}
function v47OpponentFaceUpMonsters(p){
  return API.fieldCards({player:p===0?1:0,zone:'mz',filter:x=>x.card&&x.card.face==='up'});
}
/* S03-U114: v47DetachSelf (always the first material) was removed — these costs use detachCostS03. */
function v47FusionSummonedNow(ctx){
  const d=dbOf(ctx.card)||{};
  return ctx.eventName==='onSpecialSummon'&&ctx.zone==='mz'&&ctx.card&&ctx.card.specialSummonedFrom==='ex'&&Array.isArray(d.st)&&d.st.includes('融合');
}
function v47SetOwnFlag(ctx,key,value,reason){
  const h=v47SelfMz(ctx); return h?API.setCardFlag(h,key,value,reason):false;
}
function v47OriginalAtk(card){ return Math.max(0,Number((dbOf(card)||{}).atk)||0); }

/* -------------------------------------------------------------------------
   アームズ・エイド
   - MZ: once/turn equip itself to another monster.
   - SZONE while equipped: +1000 ATK and burn when equipped monster destroys by battle.
   - SZONE: can unequip and Special Summon itself in Attack Position.
   ------------------------------------------------------------------------- */
defineUnifiedCardV4('アームズ・エイド',[
  {
    key:'equip-self',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='モンスターゾーンに表側表示で存在する必要があります';return false;}
      if(ctx.card.v47ArmoryTurn===gameState.turn){ctx.reason='このターンは既に効果を使用しています';return false;}
      if(gameState.players[ctx.player].sz.length>=ZONE_LIMITS.sz){ctx.reason='魔法・罠ゾーンが一杯です';return false;}
      if(!API.fieldCards({zone:'mz',filter:x=>x.card!==ctx.card&&x.card.face==='up'}).length){ctx.reason='装備できる表側表示モンスターがいません';return false;}
      return true;
    },
    target(ctx,done){API.selectCard('アームズ・エイド：装備するモンスター',API.fieldCards({zone:'mz',filter:x=>x.card!==ctx.card&&x.card.face==='up'}),t=>done([t]));},
    operation(ctx){
      const self=v47SelfMz(ctx),t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t); if(!self||!r||r.zone!=='mz')return;
      API.setCardFlag(self,'v47ArmoryTurn',gameState.turn,'アームズ・エイド');
      API.equipMonster(ctx.player,self,r,'アームズ・エイド');
    },afterResolve(){}
  },
  {
    key:'unequip-self',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,speed:1,events:['activate'],
    condition(ctx){
      const h=locateCardAnyV4(ctx.card);
      if(!h||h.p!==ctx.player||h.zone!=='sz'||ctx.card.v46MonsterEquip!==true){ctx.reason='装備カード扱いで存在する必要があります';return false;}
      if(ctx.card.v47ArmoryTurn===gameState.turn){ctx.reason='このターンは既に効果を使用しています';return false;}
      if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
      const ss=v46SpecialSummonRestrictionReason(ctx.player,dbOf(ctx.card));if(ss){ctx.reason=ss;return false;}return true;
    },
    operation(ctx){
      const h=locateCardAnyV4(ctx.card);if(!h||h.zone!=='sz')return;
      API.setCardFlag(h,'v47ArmoryTurn',gameState.turn,'アームズ・エイド');
      API.unequip(h,'アームズ・エイド');
      const now=locateCardAnyV4(ctx.card);if(now&&now.zone==='sz')API.specialSummon(ctx.player,'sz',now.index,'atk','アームズ・エイド');
    },afterResolve(){}
  },
  {
    key:'equip-burn',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onDamageStep'],
    condition(ctx){
      const b=ctx.battle||{},to=ctx.card&&ctx.card.equipTo;if(ctx.zone!=='sz'||ctx.card.v46MonsterEquip!==true||!to||ctx.step!=='leave')return false;
      const target=findCardByUid(to.uid);if(!target||target.zone!=='mz')return false;
      return (b.atkCard===target.card&&!!b.destroyedDef)||(b.defCard===target.card&&!!b.destroyedAtk);
    },
    operation(ctx){
      const b=ctx.battle||{},to=ctx.card&&ctx.card.equipTo,target=to&&findCardByUid(to.uid);if(!target)return;
      const destroyed=b.atkCard===target.card&&b.destroyedDef?b.defCard:(b.defCard===target.card&&b.destroyedAtk?b.atkCard:null);
      const n=v47OriginalAtk(destroyed);if(n)API.damageLP(ctx.opponent,n);
    },afterResolve(){}
  }
],{
  type:'synchro',priority:1,passive:{onDamageStep(ctx){const b=ctx.battle||{},to=ctx.card&&ctx.card.equipTo,t=to&&findCardByUid(to.uid);return ctx.zone==='sz'&&ctx.card.v46MonsterEquip===true&&ctx.step==='leave'&&!!(t&&((b.atkCard===t.card&&b.destroyedDef)||(b.defCard===t.card&&b.destroyedAtk)));}},
  continuous:{scope:'allMonsters',from:['sz'],apply(card,self){
    if(!self||self.v46MonsterEquip!==true||!self.equipTo||card.uid==null)return null;
    return self.equipTo.uid===card.uid?{atk:1000}:null;
  }}
});

/* -------------------------------------------------------------------------
   エンシェント・フェアリー・ドラゴン — 1103 historical text.
   The 2011 version had no "different name" search restriction.
   ------------------------------------------------------------------------- */
defineUnifiedCardV4('エンシェント・フェアリー・ドラゴン',[
  {
    key:'hand-special',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.HAND,targetSide:'self',speed:1,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'||gameState.phase!=='main1'){ctx.reason='自分のメインフェイズ1に発動できます';return false;}
      if(ctx.card.v47AfdSpecialTurn===gameState.turn){ctx.reason='このターンは既にこの効果を使用しています';return false;}
      if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
      const pool=API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&!x.db.ex&&Number(x.db.lv||99)<=4&&!v46SpecialSummonRestrictionReason(ctx.player,x.db));
      if(!pool.length){ctx.reason='特殊召喚できるレベル4以下のモンスターが手札にいません';return false;}return true;
    },
    target(ctx,done){API.selectCard('エンシェント・フェアリー・ドラゴン：特殊召喚するモンスター',API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&!x.db.ex&&Number(x.db.lv||99)<=4&&!v46SpecialSummonRestrictionReason(ctx.player,x.db)),t=>done([t]));},
    operation(ctx){
      const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t),self=v47SelfMz(ctx);if(!r||r.zone!=='hand'||!self)return;
      API.setCardFlag(self,'v47AfdSpecialTurn',gameState.turn,'エンシェント・フェアリー・ドラゴン');
      API.setFlag(ctx.player,'noBattlePhase',true,true);
      API.specialSummon(ctx.player,'hand',r.index,'atk','エンシェント・フェアリー・ドラゴン');
    },afterResolve(){}
  },
  {
    key:'field-replace',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.FIELD,targetSide:'both',speed:1,events:['activate'],
    condition(ctx){
      if(ctx.zone!=='mz'||ctx.card.face!=='up'||!['main1','main2'].includes(gameState.phase)){ctx.reason='自分メインフェイズに発動できます';return false;}
      if(ctx.card.v47AfdFieldTurn===gameState.turn){ctx.reason='このターンは既にこの効果を使用しています';return false;}
      if(!API.fieldCards({zone:'field'}).length){ctx.reason='フィールド魔法が存在しません';return false;}return true;
    },
    operation(ctx){
      const self=v47SelfMz(ctx);if(!self)return;API.setCardFlag(self,'v47AfdFieldTurn',gameState.turn,'エンシェント・フェアリー・ドラゴン');
      const fields=API.fieldCards({zone:'field'}).slice();fields.forEach(t=>{const r=resolveTarget(t);if(r)API.destroy(r,'エンシェント・フェアリー・ドラゴン');});
      API.recoverLP(ctx.player,1000);
      const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='s'&&x.db.sub==='フィールド');
      if(pool.length)API.requestChoice({player:ctx.player,kind:'yesno',title:'エンシェント・フェアリー・ドラゴン',
        note:'デッキからフィールド魔法1枚を手札に加えますか？',
        candidates:[{key:'yes',label:'はい',value:true},{key:'no',label:'いいえ',value:false}],
        min:1,max:1,cancelable:false,
        resume:{handler:'s03u62.afd-field-search-confirm',args:{player:ctx.player}},
        meta:{scriptName:'エンシェント・フェアリー・ドラゴン'}});
    },afterResolve(){}
  }
],{type:'synchro',priority:1,targets:true,timing:['mainPhase']});
/* S03-U62: operation() 内の legacy API.confirm + 入れ子の legacy API.selectCard を
   SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.afd-field-search-confirm',(answer,args)=>{
  if(answer.cancelled||!(answer.cards[0]&&answer.cards[0].value===true))return;
  const pool=API.pileCards(args.player,'deck',x=>x.db.k==='s'&&x.db.sub==='フィールド');
  if(!pool.length)return;
  API.requestChoice({player:args.player,kind:'card',title:'加えるフィールド魔法',
    candidates:pool,min:1,max:1,cancelable:true,
    resume:{handler:'s03u62.afd-field-search-pick',args:{player:args.player}},
    meta:{scriptName:'エンシェント・フェアリー・ドラゴン'}});
});
API.registerChoiceHandler('s03u62.afd-field-search-pick',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h&&h.zone==='deck')API.searchDeck(args.player,h.index,'エンシェント・フェアリー・ドラゴン');
});

/* C・ドラゴン — grave C monsters banish boost / battle-damage mill 3. */
defineUnifiedCardV4('C・ドラゴン',[
  {
    key:'chain-banish-boost',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
    condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;const p=API.pileCards(ctx.player,'grave',x=>String(x.db.n||'').startsWith('C・'));if(!p.length){ctx.reason='自分の墓地に「C」モンスターがいません';return false;}return true;},
    operation(ctx){
      const cards=API.pileCards(ctx.player,'grave',x=>String(x.db.n||'').startsWith('C・')).map(x=>x.card),n=cards.length;
      cards.forEach(c=>{const h=locateCardAnyV4(c);if(h&&h.zone==='grave')API.banish(h,'C・ドラゴン');});
      const self=v47SelfMz(ctx);if(self&&n)v4RegisterStatModifier(self,{atk:n*200},{controller:ctx.player,code:'C・ドラゴン',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN|RESET.DISABLE});
    },afterResolve(){}
  },
  {
    key:'battle-mill',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
    condition(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card&&Number(b.damage||0)>0&&b.toPlayer===ctx.opponent;},
    operation(ctx){API.millTop(ctx.opponent,3,'C・ドラゴン');},afterResolve(){}
  }
],{type:'synchro',priority:1,forced:true,timing:['mainPhase'],passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card&&Number(b.damage||0)>0&&b.toPlayer===ctx.opponent;}}});

/* 発条機甲ゼンマイスター — material ATK + delayed flip-up. */
defineUnifiedCardV4('発条機甲ゼンマイスター',[{
  key:'windup-set',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!(ctx.card.xyz||[]).length){ctx.reason='X素材がありません';return false;}if(!v47OwnFaceUpMonsters(ctx.player).length){ctx.reason='自分フィールドに表側表示モンスターがいません';return false;}return true;},
  /* S03-U114 */detachCostS03:{count:1,reason:'発条機甲ゼンマイスター（コスト）',targets(ctx){return {title:'発条機甲ゼンマイスター：裏側守備表示にするモンスター',candidates:v47OwnFaceUpMonsters(ctx.player)};}},
  target(ctx,done){API.selectCard('発条機甲ゼンマイスター：裏側守備表示にするモンスター',v47OwnFaceUpMonsters(ctx.player),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(!r||r.p!==ctx.player||r.zone!=='mz'||r.card.face!=='up')return;ensureCardUid(gameState,r.card);API.setCardFlag(r,'v47ZenmaisterTurn',gameState.turn,'発条機甲ゼンマイスター');API.flip(r,'down','発条機甲ゼンマイスター');API.changePosition(r,'def','発条機甲ゼンマイスター');API.registerReserveEffect(ctx.player,'発条機甲ゼンマイスター：表側攻撃表示','endPhase','対象を表側攻撃表示にする',{kind:'flipUpAttackUids',uids:[r.card.uid],flagKey:'v47ZenmaisterTurn'});},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,targets:true,timing:['mainPhase'],continuous:{scope:'self',from:['mz'],apply(card,self){return card===self?{atk:(self.xyz||[]).length*300}:null;}}});

/* 潜航母艦エアロ・シャーク */
defineUnifiedCardV4('潜航母艦エアロ・シャーク',[{
  key:'aero-burn',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!(ctx.card.xyz||[]).length){ctx.reason='X素材がありません';return false;}return true;},
  /* S03-U114 */detachCostS03:{count:1,reason:'潜航母艦エアロ・シャーク（コスト）'},
  operation(ctx){API.damageLP(ctx.opponent,(gameState.players[ctx.player].banish||[]).filter(c=>dbOf(c).k==='m').length*100);},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,timing:['mainPhase']});

/* No.30 破滅のアシッド・ゴーレム — mandatory Standby detach / 2000 damage. */
defineUnifiedCardV4('No.30 破滅のアシッド・ゴーレム',[{
  key:'acid-standby',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onStandbyPhase'],
  condition(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;},
  operation(ctx){const h=v47SelfMz(ctx);if(!h)return;if((ctx.card.xyz||[]).length){/* S03-U114 */ensureCardUid(gameState,ctx.card);requestDetachMaterialS03({player:ctx.player,holderUid:ctx.card.uid,count:1,reason:'No.30 破滅のアシッド・ゴーレム',cancelable:false});}else API.damageLP(ctx.player,2000);},afterResolve(){}
}],{type:'xyz',priority:1,forced:true,passive:{onStandbyPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;}},continuous:{scope:'self',from:['mz'],cannotAttack(card,self){return card===self&&!(self.xyz||[]).length;}}});

/* No.20 蟻岩土ブリリアント */
defineUnifiedCardV4('No.20 蟻岩土ブリリアント',[{
  key:'giga-boost',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!(ctx.card.xyz||[]).length){ctx.reason='X素材がありません';return false;}return true;},
  /* S03-U114 */detachCostS03:{count:1,reason:'No.20 蟻岩土ブリリアント（コスト）'},
  operation(ctx){v47OwnFaceUpMonsters(ctx.player).forEach(t=>v4RegisterStatModifier(t,{atk:300},{controller:ctx.player,code:'No.20 +300',targetCard:t.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN}));},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,timing:['mainPhase']});

/* No.34 電算機獣テラ・バイト */
defineUnifiedCardV4('No.34 電算機獣テラ・バイト',[{
  key:'tera-control',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!(ctx.card.xyz||[]).length){ctx.reason='X素材がありません';return false;}
    const p=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&curLV(x.card)<=4});if(!p.length){ctx.reason='相手フィールドに表側攻撃表示のレベル4以下モンスターがいません';return false;}return true;
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'No.34 電算機獣テラ・バイト（コスト）',targets(ctx){return {title:'No.34 電算機獣テラ・バイト：コントロールを得るモンスター',candidates:API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&curLV(x.card)<=4})};}},
  target(ctx,done){API.selectCard('No.34 電算機獣テラ・バイト：コントロールを得るモンスター',API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'&&curLV(x.card)<=4}),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(r&&r.p===ctx.opponent&&r.zone==='mz')API.changeControl(r,ctx.player,'No.34 電算機獣テラ・バイト','endPhase');},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,targets:true,timing:['mainPhase']});

/* サンダーエンド・ドラゴン */
defineUnifiedCardV4('サンダーエンド・ドラゴン',[{
  key:'thunder-wipe',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!(ctx.card.xyz||[]).length){ctx.reason='X素材がありません';return false;}return true;},
  /* S03-U114 */detachCostS03:{count:1,reason:'サンダーエンド・ドラゴン（コスト）'},
  operation(ctx){API.fieldCards({zone:'mz',filter:x=>x.card!==ctx.card}).slice().forEach(t=>{const r=resolveTarget(t);if(r)API.destroy(r,'サンダーエンド・ドラゴン');});},afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,timing:['mainPhase'],destroysFieldV46:true});

/* E・HERO Great TORNADO — fusion-summon halve all opposing monsters. */
defineUnifiedCardV4('E・HERO Great TORNADO',[{
  key:'tornado-half',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onSpecialSummon'],
  condition(ctx){return v47FusionSummonedNow(ctx);},
  operation(ctx){v47OpponentFaceUpMonsters(ctx.player).forEach(t=>v4RegisterStatModifier(t,{setAtk:Math.floor(curATK(t.card)/2),setDef:Math.floor(curDEF(t.card)/2)},{controller:ctx.player,code:'Great TORNADO half',targetCard:t.card,resetMask:RESET.LEAVE|RESET.FACE_DOWN}));},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,passive:{onSpecialSummon(ctx){return v47FusionSummonedNow(ctx);}}});

/* E・HERO ガイア — fusion-summon target half + gain that lost ATK until End. */
defineUnifiedCardV4('E・HERO ガイア',[{
  key:'gaia-drain',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['onSpecialSummon'],
  condition(ctx){if(!v47FusionSummonedNow(ctx))return false;const p=v47OpponentFaceUpMonsters(ctx.player);if(!p.length){ctx.reason='相手フィールドに表側表示モンスターがいません';return false;}return true;},
  target(ctx,done){API.selectCard('E・HERO ガイア：攻撃力を半分にするモンスター',v47OpponentFaceUpMonsters(ctx.player),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t),self=v47SelfMz(ctx);if(!r||!self)return;
    const old=Math.max(0,curATK(r.card)),half=Math.floor(old/2),gain=Math.max(0,old-half);
    v4RegisterStatModifier(r,{setAtk:half},{controller:ctx.player,code:'E・HERO ガイア half',targetCard:r.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN});
    if(gain)v4RegisterStatModifier(self,{atk:gain},{controller:ctx.player,code:'E・HERO ガイア gain',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN|RESET.DISABLE});
  },afterResolve(){}
}],{type:'fusion',priority:1,targets:true,passive:{onSpecialSummon(ctx){return v47FusionSummonedNow(ctx)&&v47OpponentFaceUpMonsters(ctx.player).length>0;}}});

/* E・HERO ノヴァマスター */
defineUnifiedCardV4('E・HERO ノヴァマスター',[{
  key:'nova-draw',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&((b.atkCard===ctx.card&&!!b.destroyedDef)||(b.defCard===ctx.card&&!!b.destroyedAtk));},
  operation(ctx){API.draw(ctx.player,1);},afterResolve(){}
}],{type:'fusion',priority:1,forced:true,passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&((b.atkCard===ctx.card&&!!b.destroyedDef)||(b.defCard===ctx.card&&!!b.destroyedAtk));}}});

/* A・O・J ライト・ゲイザー */
defineUnifiedCardV4('A・O・J ライト・ゲイザー',[],{type:'synchro',priority:1,continuous:{scope:'self',from:['mz'],apply(card,self,info){if(card!==self)return null;const opp=info&&info.p===0?1:0;const n=(gameState.players[opp].grave||[]).filter(c=>(dbOf(c)||{}).at==='光').length;return {atk:n*200};}}});

/* 神聖騎士パーシアス */
defineUnifiedCardV4('神聖騎士パーシアス',[{
  key:'parshath-position',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['activate'],
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!v47OpponentFaceUpMonsters(ctx.player).length){ctx.reason='相手フィールドに表側表示モンスターがいません';return false;}return true;},
  target(ctx,done){API.selectCard('神聖騎士パーシアス：表示形式を変更するモンスター',v47OpponentFaceUpMonsters(ctx.player),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);if(r)API.changePosition(r,r.card.pos==='atk'?'def':'atk','神聖騎士パーシアス');},afterResolve(){}
}],{type:'synchro',priority:1,countLimit:1,targets:true,timing:['mainPhase'],continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def')return 0;return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));}}});

/* 魔轟神ヴァルキュルス */
defineUnifiedCardV4('魔轟神ヴァルキュルス',[{
  key:'valkyrus-draw',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){if(ctx.zone!=='mz'||ctx.card.face!=='up')return false;if(!API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='悪魔').length){ctx.reason='手札に捨てられる悪魔族モンスターがいません';return false;}return true;},
  cost(ctx,done){API.selectCard('魔轟神ヴァルキュルス：捨てる悪魔族モンスター',API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='悪魔'),t=>{const r=resolveTarget(t);if(!r||r.zone!=='hand'){done(false);return;}API.discard(ctx.player,r.index,'魔轟神ヴァルキュルス（コスト）',{byEffect:false});done(true);});},
  operation(ctx){API.draw(ctx.player,1);},afterResolve(){}
}],{type:'synchro',priority:1,countLimit:1,timing:['mainPhase']});
