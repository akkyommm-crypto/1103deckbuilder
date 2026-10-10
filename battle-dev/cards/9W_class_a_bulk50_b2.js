/* Class A bulk 50 — batch 2 / 戦闘ダメージ・攻撃対象・リクルート 10枚。
   engine は触らない。既存の onDamageStep / onAttackDeclare / onFlip、
   v49 P1 ChoiceRequest、v80 の乱数捨て、v6 Battle、P4 authority だけで書く。
   カード登録の第1引数は必ず文字列リテラル。 */

/* 相手モンスターの攻撃によって自身がリバースしたか（バトル由来のリバース） */
function cwFlippedByAttack(ctx){
  const e=ctx.event||{}, b=gameState.battle;
  const h=locateCardAnyV4(ctx.card);
  if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
  if(ctx.card.uid==null||e.uid!==ctx.card.uid) return false;
  if(!b||b.flippedUid!==ctx.card.uid) return false;
  const atk=b.atkCard;
  if(!atk) return false;
  const ah=locateCardAnyV4(atk);
  return !!ah && ah.p===ctx.opponent;
}
function cwAttackerOf(){ const b=gameState.battle; return b?b.atkCard:null; }

/* ===== 11. ワーム・ノーブル ===== */
defineUnifiedCardV4('ワーム・ノーブル',[{
  key:'flip-by-attack-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){ return cwFlippedByAttack(ctx); },
  operation(ctx){
    const atk=cwAttackerOf();
    if(!atk) return;
    API.damageLP(ctx.opponent, Math.floor(curATK(atk)/2));},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'after',
    passive:{onFlip:cwFlippedByAttack}});

/* ===== 12. ワーム・ホープ ===== */
defineUnifiedCardV4('ワーム・ホープ',[{
  key:'flip-by-attack-draw', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onFlip'],
  condition(ctx){ return cwFlippedByAttack(ctx) && API.me(ctx).deck.length>0; },
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
},{
  key:'leave-field-discard-one', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE,
  speed:1, events:['onLeaveField'],
  condition(ctx){
    const e=ctx.event||{};
    return e.uid!=null && ctx.card.uid===e.uid
      && e.fromZone==='mz' && e.toZone==='grave'
      && gameState.players[ctx.player].hand.length>0;},
  operation(ctx){
    const hand=gameState.players[ctx.player].hand
      .map((c,i)=>({p:ctx.player,zone:'hand',index:i,card:c,db:dbOf(c)}));
    if(!hand.length) return;
    v49P1Open(ctx,{kind:'card',title:'ワーム・ホープ：墓地へ送る手札',
      candidates:hand,min:1,max:1},'p1cards.discard',{reason:'ワーム・ホープ'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'after', activateFrom:['grave'],
    passive:{onFlip:cwFlippedByAttack,
             onLeaveField(ctx){ return ctx.zone==='mz'&&ctx.card.face==='up'; }}});

/* ===== 13. エレキンメダイ — 直接攻撃で戦闘ダメージを与えた時にランダム1枚捨て ===== */
defineUnifiedCardV4('エレキンメダイ',[{
  key:'direct-damage-random-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDamageStep'],
  condition(ctx){ return v81BattleDamageBySelf(ctx,true) && API.foe(ctx).hand.length>0; },
  operation(ctx){ v80DiscardRandom(ctx.opponent,1,'エレキンメダイ',ctx.player); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'after',
    passive:{onDamageStep:ctx=>v81BattleDamageBySelf(ctx,true)&&API.foe(ctx).hand.length>0}});

/* ===== 14. 追い剥ぎゴブリン（永続罠）
   自分フィールドのモンスターが相手ライフに戦闘ダメージを与えた時にランダム1枚捨て ===== */
function cwOwnMonsterDealt(ctx){
  const b=ctx.battle||{};
  if(ctx.zone!=='sz'||ctx.card.face!=='up'||ctx.step!=='after') return false;
  if(!(Number(b.damage)>0)||b.toPlayer!==ctx.opponent) return false;
  const atk=b.atkCard; if(!atk) return false;
  const ah=locateCardAnyV4(atk);
  return !!ah && ah.p===ctx.player;
}
defineUnifiedCardV4('追い剥ぎゴブリン',[{
  key:'own-battle-damage-random-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE,
  speed:1, events:['onDamageStep'],
  condition(ctx){ return cwOwnMonsterDealt(ctx) && API.foe(ctx).hand.length>0; },
  operation(ctx){ v80DiscardRandom(ctx.opponent,1,'追い剥ぎゴブリン',ctx.player); },
  afterResolve(){}
}],{type:'trap', priority:2, keep:true, forced:true, dsTiming:'after',
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onDamageStep:ctx=>cwOwnMonsterDealt(ctx)&&API.foe(ctx).hand.length>0}});

/* ===== 15. 義賊の極意書
   自分の通常モンスター1体を選択。このターンそのモンスターが相手に戦闘ダメージを
   与えた時、相手の手札をランダムに2枚捨てる。
   刻印は選ばれたモンスター側の純JSONフラグ、誘発の宿主は墓地のこのカード。 ===== */
function cwOwnNormalMonsters(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&(x.db||dbOf(x.card)).k==='m'
      &&((x.db||dbOf(x.card)).st||[]).includes('通常')});
}
function cwBanditHit(ctx){
  const b=ctx.battle||{};
  if(ctx.step!=='after') return false;
  if(!(Number(b.damage)>0)||b.toPlayer!==ctx.opponent) return false;
  const atk=b.atkCard;
  return !!atk && atk.cwBanditTurn===gameState.turn;
}
defineUnifiedCardV4('義賊の極意書',[{
  key:'mark-normal-monster', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:2, events:['activate'],
  condition(ctx){
    if(!cwOwnNormalMonsters(ctx.player).length){
      ctx.reason='自分フィールドに通常モンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('義賊の極意書：選択する通常モンスター',
      cwOwnNormalMonsters(ctx.player),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h||h.p!==ctx.player||h.zone!=='mz') return;
    API.setCardFlag(h,'cwBanditTurn',gameState.turn,'義賊の極意書');},
  afterResolve(){}
},{
  key:'marked-battle-damage-discard-two', type:EFFECT_TYPE.TRIGGER, range:LOCATION.GRAVE,
  speed:1, events:['onDamageStep'],
  condition(ctx){ return cwBanditHit(ctx) && API.foe(ctx).hand.length>0; },
  operation(ctx){ v80DiscardRandom(ctx.opponent,2,'義賊の極意書',ctx.player); },
  afterResolve(){}
}],{type:'trap', priority:2, targets:true, forced:true, dsTiming:'after',
    activateFrom:['grave'],
    passive:{onDamageStep:ctx=>cwBanditHit(ctx)&&API.foe(ctx).hand.length>0}});

/* ===== 16. 朽ち果てた武将
   召喚成功時に手札から「ゾンビタイガー」1体を特殊召喚（任意）
   ＋ 相手プレイヤーへの直接攻撃に成功した場合、相手はランダムに1枚捨てる ===== */
defineUnifiedCardV4('朽ち果てた武将',[{
  key:'summon-recruit-zombie-tiger', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onNormalSummon'],
  condition(ctx){
    return caSummonedSelf(ctx) && hasMonsterZoneSpace(ctx.player)
      && caHand(ctx,x=>sameCanonicalCardV4(x.db,caRefDb('ゾンビタイガー'))).length>0;},
  operation(ctx){
    const pool=caHand(ctx,x=>sameCanonicalCardV4(x.db,caRefDb('ゾンビタイガー')));
    if(!pool.length||!hasMonsterZoneSpace(ctx.player)) return;
    v49P1Open(ctx,{kind:'card',title:'朽ち果てた武将：特殊召喚する「ゾンビタイガー」',
      candidates:pool,min:1,max:1},'p1cards.special-summon',
      {from:'hand',pos:'atk',reason:'朽ち果てた武将'},false);},
  afterResolve(){}
},{
  key:'direct-attack-random-discard', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDamageStep'],
  condition(ctx){ return v81BattleDamageBySelf(ctx,true) && API.foe(ctx).hand.length>0; },
  operation(ctx){ v80DiscardRandom(ctx.opponent,1,'朽ち果てた武将',ctx.player); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true, dsTiming:'after', includesSpecialSummon:true,
    passive:{onNormalSummon:ctx=>caSummonedSelf(ctx)&&hasMonsterZoneSpace(ctx.player)
       &&caHand(ctx,x=>sameCanonicalCardV4(x.db,caRefDb('ゾンビタイガー'))).length>0,
     onDamageStep:ctx=>v81BattleDamageBySelf(ctx,true)&&API.foe(ctx).hand.length>0}});

/* ===== 17. クレイ・チャージ
   自分の「E・HERO クレイマン」が攻撃対象に選択された時に発動。
   攻撃モンスターと選択されたクレイマンを破壊し、相手に800ダメージ。 ===== */
function cwOwnClayman(p){
  const ref=caRefDb('E・HERO クレイマン');
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>sameCanonicalCardV4(x.db||dbOf(x.card),ref)});
}
function cwClaymanTargeted(ctx){
  const a=gameState.pendingAttack;
  if(!a||a.targetUid==null) return false;
  const t=findCardByUid(a.targetUid);
  if(!t||t.p!==ctx.player||t.zone!=='mz') return false;
  return sameCanonicalCardV4(t.db||dbOf(t.card),caRefDb('E・HERO クレイマン'));
}
defineUnifiedCardV4('クレイ・チャージ',[{
  key:'clayman-targeted-mutual-destroy', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['onAttackDeclare'],
  condition(ctx){ return cwClaymanTargeted(ctx); },
  operation(ctx){
    const a=gameState.pendingAttack;
    if(!a) return;
    /* セットされた状態で選択されていた場合は、めくって確認してから処理する。 */
    const def=(a.targetUid!=null)?findCardByUid(a.targetUid):null;
    if(def&&def.card&&def.card.face==='down')
      API.reveal({player:def.p,audience:'both',cards:[def],label:'クレイ・チャージ',until:'resolution'});
    const atk=(a.attackerUid!=null)?findCardByUid(a.attackerUid):null;
    if(atk) API.destroy(atk,'クレイ・チャージ');
    const def2=(a.targetUid!=null)?findCardByUid(a.targetUid):null;
    if(def2) API.destroy(def2,'クレイ・チャージ');
    API.damageLP(ctx.opponent,800);},
  afterResolve(){}
}],{type:'trap', priority:2, passive:{onAttackDeclare:cwClaymanTargeted}});

/* ===== 18. 機皇廠
   「機皇」が攻撃対象に選択された時に発動。墓地の「機皇兵」1体を手札に加え、
   その後、攻撃対象となったモンスターを破壊する。 ===== */
function cwMeklordTargeted(ctx){
  const a=gameState.pendingAttack;
  if(!a||a.targetUid==null) return false;
  const t=findCardByUid(a.targetUid);
  if(!t||t.zone!=='mz'||t.card.face!=='up') return false;
  return isCardInGroupV4(t.db||dbOf(t.card), GROUP.MEKLORD);
}
function cwGraveMeklordArmy(p){
  return API.pileCards(p,'grave',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.MEKLORD_ARMY));
}
API.registerChoiceHandler('cwb2.army-to-hand-then-destroy',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.p===args.player&&h.zone==='grave') API.returnToHand(h,args.reason);
  const t=(args.targetUid!=null)?findCardByUid(args.targetUid):null;
  if(t&&t.zone==='mz') API.destroy(t,args.reason);
});
defineUnifiedCardV4('機皇廠',[{
  key:'meklord-targeted-recover-destroy', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  speed:2, events:['onAttackDeclare'],
  condition(ctx){
    if(!cwMeklordTargeted(ctx)) return false;
    return cwGraveMeklordArmy(ctx.player).length>0;},
  operation(ctx){
    const a=gameState.pendingAttack;
    const pool=cwGraveMeklordArmy(ctx.player);
    if(!a||!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'機皇廠：手札に加える「機皇兵」',
      candidates:pool,min:1,max:1},'cwb2.army-to-hand-then-destroy',
      {reason:'機皇廠',targetUid:a.targetUid},false);},
  afterResolve(){}
}],{type:'trap', priority:2,
    passive:{onAttackDeclare(ctx){
      return cwMeklordTargeted(ctx)&&cwGraveMeklordArmy(ctx.player).length>0;}}});

/* ===== 19. ダブルアタック
   手札からモンスター1枚を捨て、捨てたモンスターよりレベルが低い
   自分のモンスター1体はこのターン2回攻撃できる。 ===== */
defineUnifiedCardV4('ダブルアタック',[{
  key:'discard-then-double-attack', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    const hand=API.pileCards(ctx.player,'hand',x=>x.db.k==='m');
    if(!hand.length){ ctx.reason='捨てるモンスターが手札にありません'; return false; }
    const own=API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'});
    if(!own.length){ ctx.reason='自分フィールドに表側モンスターがいません'; return false; }
    const maxLv=Math.max.apply(null,hand.map(x=>Number(x.db.lv)||0));
    return own.some(x=>(curLV(x.card)||0)<maxLv);},
  cost(ctx,done){
    const hand=API.pileCards(ctx.player,'hand',x=>x.db.k==='m');
    if(!hand.length){ done(false); return; }
    API.selectCard('ダブルアタック：墓地へ捨てるモンスター',hand,t=>{
      const h=resolveTarget(t);
      if(!h||h.zone!=='hand'){ done(false); return; }
      API.recordCostSnapshot(h.card,['level']);
      API.discard(ctx.player,h.index,'ダブルアタック（コスト）',{byEffect:true,byPlayer:ctx.player});
      done(true);});},
  target(ctx,done){
    const s=(API.costSnapshots(ctx)||[])[0];
    const lv=(s&&typeof s.level==='number')?s.level:0;
    const pool=API.fieldCards({player:ctx.player,zone:'mz',
      filter:x=>x.card.face==='up'&&(curLV(x.card)||0)<lv});
    if(!pool.length){ done([]); return; }
    API.selectCard('ダブルアタック：2回攻撃させるモンスター',pool,t=>done([t]));},
  operation(ctx){
    const s=(API.costSnapshots(ctx)||[])[0];
    const lv=(s&&typeof s.level==='number')?s.level:0;
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h||h.p!==ctx.player||h.zone!=='mz'||h.card.face!=='up') return;
    if((curLV(h.card)||0)>=lv) return;
    API.grantAdditionalAttack(h,1,'ダブルアタック',false);},
  afterResolve(){}
}],{type:'spell', priority:1, targets:true, timing:['mainPhase']});

/* =====================================================================
   20. おジャマ・レッド は engine repair batch（E1 調査）で解禁され、
   cards/9Y_engine_e123_unlocked.js へ移した。
   E1 は engine の欠陥ではなく、テストが chain 解決経路（RESOLUTION_SUMMON_BATCH_V2）
   を通していなかったための誤判定だった。詳細は 9Y 側のコメントを参照。
   ===================================================================== */
