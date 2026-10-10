/* =========================================================================
   System v4.5 WIP — practical single-player card batch
   -------------------------------------------------------------------------
   Focus: cards already present in 1103 test/deck pools that can be expressed
   accurately with the common v4 Effect/API layer.
   ========================================================================= */
function v45FaceUpSelfField(ctx){
  return API.fieldCards({player:ctx.player,filter:x=>x.card&&x.card.face==='up'});
}
function v45PickOneThenOptionalSecond(title,pool,done){
  const src=(pool||[]).slice();
  if(!src.length){done([]);return;}
  API.selectCard(title,src,first=>{
    const chosen=[first],left=src.filter(x=>x.card!==first.card);
    if(!left.length){done(chosen);return;}
    API.confirm(title,'もう1枚選びますか？',()=>API.selectCard(title,left,second=>done([first,second])),()=>done(chosen));
  });
}
function v45PickUpTo(title,pool,max,done){
  const src=(pool||[]).slice(),picked=[];
  if(!src.length){done([]);return;}
  const step=()=>{
    const left=src.filter(x=>!picked.some(y=>y.card===x.card));
    if(!left.length||picked.length>=max){done(picked);return;}
    API.selectCard(`${title}（${picked.length+1}/${max}）`,left,t=>{
      picked.push(t);
      const rest=left.filter(x=>x.card!==t.card);
      if(!rest.length||picked.length>=max){done(picked);return;}
      API.confirm(title,'さらに選びますか？',step,()=>done(picked));
    });
  };
  step();
}
function v45IsFlipEffectDb(d){
  const e=String((d&&d.e)||'')+'\n'+String((d&&d.e0)||'');
  return /リバース\s*[:：]|リバースした(時|場合)|リバース効果/.test(e);
}
function v45SelfMz(ctx){
  const h=locateCardAnyV4(ctx.card);
  return h&&h.p===ctx.player&&h.zone==='mz'?h:null;
}
function v45BanishedLevelMonster(x){
  if(!x||!x.db||x.db.k!=='m')return false;
  if((x.db.st||[]).includes('エクシーズ'))return false; // Xyz has Rank, not Level.
  return Number(x.db.lv||0)>0&&Number(x.db.lv||0)<=4;
}

/* マジカル・アンドロイド — 自分End Phase、表側サイキック×600回復。 */
defineUnifiedCardV4('マジカル・アンドロイド',[{
  key:'end-heal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onEndPhase'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.player!==gameState.activePlayer){ctx.reason='自分のエンドフェイズに表側表示で発動します';return false;}
    return true;
  },
  operation(ctx){
    const n=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&x.db.ra==='サイキック'}).length;
    if(n)API.recoverLP(ctx.player,n*600);
  },afterResolve(){}
}],{type:'synchro',priority:1,forced:true,passive:{onEndPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.player===gameState.activePlayer;}}});

/* 氷結界の虎王ドゥローレン — 自分表側を任意枚数戻し、戻った枚数×500。 */
defineUnifiedCardV4('氷結界の虎王ドゥローレン',[{
  key:'bounce-boost',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.ONFIELD,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    const pool=v45FaceUpSelfField(ctx).filter(x=>x.card!==ctx.card);
    if(!pool.length){ctx.reason='戻せる自分の表側表示カードがありません';return false;}
    return true;
  },
  target(ctx,done){
    const pool=v45FaceUpSelfField(ctx).filter(x=>x.card!==ctx.card),picked=[];
    const step=()=>{
      const left=pool.filter(x=>!picked.some(y=>y.card===x.card));
      if(!left.length){done(picked);return;}
      API.selectCard(`ドゥローレン：手札に戻すカード（${picked.length+1}枚目）`,left,t=>{
        picked.push(t);
        const rest=left.filter(x=>x.card!==t.card);
        if(!rest.length){done(picked);return;}
        API.confirm('氷結界の虎王ドゥローレン','さらにカードを選びますか？',step,()=>done(picked));
      });
    };
    step();
  },
  operation(ctx){
    let n=0;
    (ctx.selectedTargets||[]).forEach(t=>{
      const r=resolveTarget(t);
      if(!r||r.p!==ctx.player||!['mz','sz','field'].includes(r.zone)||r.card.face!=='up'||r.card===ctx.card)return;
      API.returnToHand(r,'氷結界の虎王ドゥローレン'); n++;
    });
    if(n){
      v4RegisterStatModifier({card:ctx.card},{atk:n*500},{controller:ctx.player,code:'Dewloren +500',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN});
    }
  },afterResolve(){}
}],{type:'synchro',priority:1,countLimit:1,targets:true,timing:['mainPhase']});

/* 虚空海竜リヴァイエール — X素材1つを取り除き、双方の除外Lv4以下を自分場へ。 */
defineUnifiedCardV4('虚空海竜リヴァイエール',[{
  key:'return-banished',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.REMOVED,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){
    const h=v45SelfMz(ctx);
    if(!h||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    if(!(ctx.card.xyz||[]).length){ctx.reason='取り除けるX素材がありません';return false;}
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    const pool=API.pileCards(0,'banish',v45BanishedLevelMonster).concat(API.pileCards(1,'banish',v45BanishedLevelMonster));
    if(!pool.length){ctx.reason='除外されているレベル4以下のモンスターがいません';return false;}
    return true;
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'虚空海竜リヴァイエール（コスト）',targets(ctx){return {title:'虚空海竜リヴァイエール：特殊召喚する除外モンスター',candidates:API.pileCards(0,'banish',v45BanishedLevelMonster).concat(API.pileCards(1,'banish',v45BanishedLevelMonster))};}},
    target(ctx,done){
    const pool=API.pileCards(0,'banish',v45BanishedLevelMonster).concat(API.pileCards(1,'banish',v45BanishedLevelMonster));
    API.selectCard('虚空海竜リヴァイエール：特殊召喚する除外モンスター',pool,t=>done([t]));
  },
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);
    if(!r||r.zone!=='banish'||!v45BanishedLevelMonster({db:dbOf(r.card)})||!hasMonsterZoneSpace(ctx.player))return;
    API.specialSummon(ctx.player,'banish',r.index,'atk','虚空海竜リヴァイエール',r.p);
  },afterResolve(){}
}],{type:'xyz',priority:1,countLimit:1,targets:true,timing:['mainPhase'],blocksIfNoSpecialSummon:true,includesSpecialSummon:true});

/* 戦士の生還 — 墓地の戦士族1体を対象に回収。 */
defineUnifiedCardV4('戦士の生還',[{
  key:'recover-warrior',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.HAND|LOCATION.SZONE,targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){const p=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士');if(!p.length){ctx.reason='墓地に戦士族モンスターがいません';return false;}return true;},
  target(ctx,done){API.selectCard('戦士の生還：手札に加える戦士族',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士'),t=>done([t]));},
  operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.returnToHand(t,'戦士の生還');}
}],{type:'spell',priority:1,targets:true});

/* クレボンス — 自身が攻撃対象になった攻撃宣言時、800LPで攻撃を無効。 */
defineUnifiedCardV4('クレボンス',[{
  key:'negate-attack',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:2,events:['onAttackDeclare'],
  condition(ctx){
    const a=gameState.pendingAttack,uid=ensureCardUid(gameState,ctx.card);
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||!a||a.targetUid!==uid){ctx.reason='このカードが攻撃対象に選択された時に発動します';return false;}
    if(API.me(ctx).lp<800){ctx.reason='800LPを払えません';return false;}
    return true;
  },
  cost(ctx,done){API.payCost(ctx.player,800);done(true);},
  operation(){API.negateAttack('クレボンス');},afterResolve(){}
}],{type:'monster',priority:2,quickEffect:true,passive:{onAttackDeclare(ctx){const a=gameState.pendingAttack;return ctx.zone==='mz'&&ctx.card.face==='up'&&!!a&&a.targetUid===ensureCardUid(gameState,ctx.card);}}});

/* 深淵の暗殺者 — 1103旧テキスト。リバース破壊 + 手札から墓地へ送られた時のFLIP回収。 */
defineUnifiedCardV4('深淵の暗殺者',[
  {
    key:'flip-destroy',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['onFlip'],
    condition(ctx){if(ctx.eventName!=='onFlip'||ctx.zone!=='mz'){ctx.reason='リバースした場合に発動します';return false;}const p=API.fieldCards({player:ctx.opponent,zone:'mz'});if(!p.length){ctx.reason='相手フィールドにモンスターがいません';return false;}return true;},
    target(ctx,done){API.selectCard('深淵の暗殺者：破壊する相手モンスター',API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
    operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.destroy(t,'深淵の暗殺者');},afterResolve(){}
  },
  {
    key:'hand-to-grave-recover',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,targetRange:LOCATION.GRAVE,targetSide:'self',speed:1,events:['onSendToGrave'],
    condition(ctx){
      const g=ctx.card&&ctx.card.graveInfo;
      if(ctx.zone!=='grave'||!g||g.from!=='hand'){ctx.reason='このカードが手札から墓地へ送られた時に発動します';return false;}
      const p=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v45IsFlipEffectDb(x.db));
      if(!p.length){ctx.reason='墓地にリバース効果モンスターがいません';return false;}return true;
    },
    target(ctx,done){API.selectCard('深淵の暗殺者：手札に戻すリバース効果モンスター',API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&v45IsFlipEffectDb(x.db)),t=>done([t]));},
    operation(ctx){const t=ctx.selectedTargets&&ctx.selectedTargets[0];if(t)API.returnToHand(t,'深淵の暗殺者');},afterResolve(){}
  }
],{type:'monster',priority:1,targets:true,forced:true,activateFrom:['grave'],passive:{onFlip(ctx){return ctx.zone==='mz';},onSendToGrave(ctx){return ctx.zone==='grave'&&ctx.card&&ctx.card.graveInfo&&ctx.card.graveInfo.from==='hand';}}});

/* 魔導雑貨商人 — 最初の魔法・罠までめくり、それだけ手札へ。途中は墓地へ。 */
defineUnifiedCardV4('魔導雑貨商人',[{
  key:'flip-excavate',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onFlip'],
  condition(ctx){if(ctx.eventName!=='onFlip'||ctx.zone!=='mz'){ctx.reason='リバースした場合に発動します';return false;}return true;},
  operation(ctx){
    const P=API.me(ctx); let guard=0;
    while(P.deck.length&&guard++<80){
      const d=dbOf(P.deck[0]);
      /* S03-U04: 《ライオウ》適用中は手札に加えられるカードも墓地へ送る（09/03/02 wiki）。 */
      if(d.k==='s'||d.k==='t'){if(deckToHandLockReasonV32(ctx.player))API.millTop(ctx.player,1,'魔導雑貨商人（手札に加えられない）');else API.deckToHand(ctx.player,0,'魔導雑貨商人');return;}
      API.millTop(ctx.player,1,'魔導雑貨商人');
    }
  },afterResolve(){}
}],{type:'monster',priority:1,forced:true,passive:{onFlip(ctx){return ctx.zone==='mz';}}});

/* E・HERO The シャイニング — 除外E・HERO×300 + 場から墓地へ送られた時に最大2体回収。 */
defineUnifiedCardV4('E・HERO The シャイニング',[{
  key:'recover-banished-heroes',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,targetRange:LOCATION.REMOVED,targetSide:'self',speed:1,events:['onSendToGrave'],
  condition(ctx){
    const g=ctx.card&&ctx.card.graveInfo;
    if(ctx.zone!=='grave'||!g||g.from!=='mz'){ctx.reason='フィールドから墓地へ送られた時に発動します';return false;}
    const p=API.pileCards(ctx.player,'banish',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO));
    if(!p.length){ctx.reason='除外されているE・HEROがいません';return false;}return true;
  },
  target(ctx,done){v45PickOneThenOptionalSecond('E・HERO The シャイニング：手札に加えるE・HERO',API.pileCards(ctx.player,'banish',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)),done);},
  operation(ctx){(ctx.selectedTargets||[]).forEach(t=>{const r=resolveTarget(t);if(r&&r.zone==='banish'&&r.p===ctx.player)API.returnToHand(r,'E・HERO The シャイニング');});},afterResolve(){}
}],{
  type:'fusion',priority:1,targets:true,activateFrom:['grave'],passive:{onSendToGrave(ctx){return ctx.zone==='grave'&&ctx.card&&ctx.card.graveInfo&&ctx.card.graveInfo.from==='mz';}},
  continuous:{scope:'self',from:['mz'],apply(card,self,info){if(card!==self)return null;const n=API.pileCards(info.p,'banish',x=>isSetCardV4(x.db,SETCODE.ELEMENTAL_HERO)).length;return n?{atk:n*300}:null;}}
});

/* V・HERO アドレイション — 相手1体 + 自分の他HERO1体を固定対象。 */
defineUnifiedCardV4('V・HERO アドレイション',[{
  key:'adoration-down',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    const foe=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'});
    const hero=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card!==ctx.card&&x.card.face==='up'&&isSetCardV4(x.db,SETCODE.HERO)});
    if(!foe.length||!hero.length){ctx.reason='相手の表側モンスターと、自分の他のHEROが必要です';return false;}return true;
  },
  target(ctx,done){
    const foe=API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'});
    API.selectCard('V・HERO アドレイション：弱体化する相手モンスター',foe,t1=>{
      const hero=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card!==ctx.card&&x.card.face==='up'&&isSetCardV4(x.db,SETCODE.HERO)});
      API.selectCard('V・HERO アドレイション：参照する自分のHERO',hero,t2=>done([t1,t2]));
    });
  },
  operation(ctx){
    const foe=ctx.selectedTargets&&ctx.selectedTargets[0],hero=ctx.selectedTargets&&ctx.selectedTargets[1];
    const rf=foe&&resolveTarget(foe),rh=hero&&resolveTarget(hero);if(!rf||!rh)return;
    const n=curATK(rh.card);if(!n)return;
    v4RegisterStatModifier(rf,{atk:-n,def:-n},{controller:ctx.player,code:'V-HERO Adoration',targetCard:rf.card,resetMask:RESET.LEAVE|RESET.END|RESET.FACE_DOWN});
  },afterResolve(){}
}],{type:'fusion',priority:1,countLimit:1,targets:true,timing:['mainPhase']});


/* =========================================================================
   System v4.5 WIP — Synchro / Xyz practical batch B
   ========================================================================= */

/* ミスト・ウォーム — S召喚成功時、相手フィールドのカードを1～3枚戻す。 */
defineUnifiedCardV4('ミスト・ウォーム',[{
  key:'synchro-bounce',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,targetRange:LOCATION.ONFIELD,targetSide:'opponent',speed:1,events:['onSpecialSummon'],
  condition(ctx){
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||!(ctx.event&&ctx.event.kind==='synchro')){ctx.reason='S召喚に成功した時に発動します';return false;}
    if(!API.fieldCards({player:ctx.opponent}).length){ctx.reason='相手フィールドにカードがありません';return false;}
    return true;
  },
  target(ctx,done){v45PickUpTo('ミスト・ウォーム：手札に戻す相手カード',API.fieldCards({player:ctx.opponent}),3,done);},
  operation(ctx){(ctx.selectedTargets||[]).forEach(t=>{const r=resolveTarget(t);if(r&&r.p===ctx.opponent&&['mz','sz','field'].includes(r.zone))API.returnToHand(r,'ミスト・ウォーム');});},afterResolve(){}
}],{type:'synchro',priority:1,forced:true,targets:true,passive:{onSpecialSummon(ctx){return ctx.zone==='mz'&&ctx.card.face==='up'&&!!(ctx.event&&ctx.event.kind==='synchro');}}});

/* ギガンテック・ファイター — 双方墓地の戦士族×100 + 戦闘破壊時に戦士族を蘇生。 */
defineUnifiedCardV4('ギガンテック・ファイター',[{
  key:'battle-revive-warrior',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,targetRange:LOCATION.GRAVE,targetSide:'both',speed:1,events:['onBattleDestroy'],
  condition(ctx){
    if(ctx.zone!=='grave'||!(ctx.event&&ctx.event.card===ctx.card)){ctx.reason='このカードが戦闘で破壊され墓地へ送られた時に発動します';return false;}
    if(!hasMonsterZoneSpace(ctx.player)){ctx.reason='モンスターゾーンが一杯です';return false;}
    if(gameState.players[ctx.player].temporaryFlags&&gameState.players[ctx.player].temporaryFlags.noSpecialSummon){ctx.reason='このターンは特殊召喚できません';return false;}
    const pool=API.pileCards(0,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士').concat(API.pileCards(1,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士'));
    if(!pool.length){ctx.reason='墓地に戦士族モンスターがいません';return false;}
    return true;
  },
  target(ctx,done){
    const pool=API.pileCards(0,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士').concat(API.pileCards(1,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士'));
    API.selectCard('ギガンテック・ファイター：特殊召喚する戦士族',pool,t=>done([t]));
  },
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0],r=t&&resolveTarget(t);
    if(!r||r.zone!=='grave'||dbOf(r.card).k!=='m'||dbOf(r.card).ra!=='戦士'||!hasMonsterZoneSpace(ctx.player))return;
    API.specialSummon(ctx.player,'grave',r.index,'atk','ギガンテック・ファイター',r.p);
  },afterResolve(){}
}],{
  type:'synchro',priority:1,targets:true,activateFrom:['grave'],blocksIfNoSpecialSummon:true,includesSpecialSummon:true,
  passive:{onBattleDestroy(ctx){return ctx.zone==='grave'&&ctx.event&&ctx.event.card===ctx.card;}},
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self)return null;
    const n=API.pileCards(0,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士').length+API.pileCards(1,'grave',x=>x.db.k==='m'&&x.db.ra==='戦士').length;
    return n?{atk:n*100}:null;
  }}
});

/* フレムベル・ウルキサス — 貫通 + 戦闘ダメージを与える度にATK+300（永続）。 */
defineUnifiedCardV4('フレムベル・ウルキサス',[{
  key:'battle-damage-boost',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{};
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.step!=='after'||b.atkCard!==ctx.card||!(b.damage>0)||b.toPlayer!==ctx.opponent){ctx.reason='このカードが相手に戦闘ダメージを与えた時に発動します';return false;}
    return true;
  },
  operation(ctx){v4RegisterStatModifier({card:ctx.card},{atk:300},{controller:ctx.player,code:'Flamvell Uruquizas +300',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.FACE_DOWN});},afterResolve(){}
}],{
  type:'synchro',priority:1,forced:true,dsTiming:'after',
  passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='after'&&b.atkCard===ctx.card&&b.damage>0&&b.toPlayer===ctx.opponent;}},
  continuous:{scope:'self',from:['mz'],apply(){return null;},piercingDamage(info){
    if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def')return 0;
    return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
  }}
});

/* BF－アームズ・ウィング — 守備表示へ攻撃中は+500、さらに貫通。 */
defineUnifiedCardV4('BF－アームズ・ウィング',[],{
  type:'synchro',priority:1,
  continuous:{scope:'self',from:['mz'],apply(card,self){
    if(card!==self)return null;
    const b=typeof battleContextV28==='function'?battleContextV28():{};
    const damageStep=!!(b&&b.step&&['start','before','calc','after','leave','end'].includes(b.step));
    if(damageStep&&b.atkCard===self&&b.defCard&&b.defCard.pos==='def')return {atk:500};
    return null;
  },piercingDamage(info){
    if(info.atkCard!==info.self||!info.defCard||info.defCard.pos!=='def')return 0;
    return Math.max(0,curATK(info.atkCard)-curDEF(info.defCard));
  }}
});

/* グレンザウルス — 戦闘破壊して墓地へ送った後、X素材1つで1000ダメージ。 */
defineUnifiedCardV4('グレンザウルス',[{
  key:'battle-burn',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDamageStep'],
  condition(ctx){
    const b=ctx.battle||{};
    if(ctx.zone!=='mz'||ctx.card.face!=='up'||ctx.step!=='leave'||b.atkCard!==ctx.card||!b.destroyedDef){ctx.reason='このカードが戦闘で相手モンスターを破壊し墓地へ送った時に発動します';return false;}
    if(!(ctx.card.xyz||[]).length){ctx.reason='取り除けるX素材がありません';return false;}
    return true;
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'グレンザウルス（コスト）'},
    operation(ctx){API.damageLP(ctx.opponent,1000);},afterResolve(){}
}],{type:'xyz',priority:1,dsTiming:'leave',passive:{onDamageStep(ctx){const b=ctx.battle||{};return ctx.zone==='mz'&&ctx.card.face==='up'&&ctx.step==='leave'&&b.atkCard===ctx.card&&!!b.destroyedDef&&(ctx.card.xyz||[]).length>0;}}});

/* No.17 リバイス・ドラゴン — X素材1つでATK+500。素材0なら直接攻撃不可。 */
defineUnifiedCardV4('No.17 リバイス・ドラゴン',[{
  key:'revise-boost',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){
    const h=v45SelfMz(ctx);
    if(!h||ctx.card.face!=='up'){ctx.reason='表側表示でフィールドに存在する必要があります';return false;}
    if(!(ctx.card.xyz||[]).length){ctx.reason='取り除けるX素材がありません';return false;}
    return true;
  },
  /* S03-U114 */detachCostS03:{count:1,reason:'No.17 リバイス・ドラゴン（コスト）'},
    operation(ctx){v4RegisterStatModifier({card:ctx.card},{atk:500},{controller:ctx.player,code:'Number 17 +500',targetCard:ctx.card,resetMask:RESET.LEAVE|RESET.FACE_DOWN});},afterResolve(){}
}],{
  type:'xyz',priority:1,countLimit:1,timing:['mainPhase'],
  continuous:{scope:'self',from:['mz'],apply(){return null;},cannotDirectAttack(card,self){return card===self&&!(self.xyz||[]).length;}}
});
