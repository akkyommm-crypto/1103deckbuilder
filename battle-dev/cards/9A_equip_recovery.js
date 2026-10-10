/* Equip recovery batch — System v15 の装備機構で解消したカード。
   使う共通機構は sc.equipSpec / API.equipLegal / equipTargets /
   equipsOn / equipCount / equippedMonster / moveEquip / detachEquip /
   onEquipAttached / onEquipDetached / continuous scope 'equippedMonster' と、
   v13 の効果無効・v14 の元々の数値・v10 の表示形式・既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v15Opponent(p){ return p===0?1:0; }
/* 場の装備カード（装備中のものだけ） */
function v15AttachedEquips(filter){
  const out=[];
  for(let p=0;p<2;p++){
    (gameState.players[p].sz||[]).forEach((c,i)=>{
      if(!c||!c.equipTo) return;
      const h={p,zone:'sz',index:i,card:c,db:dbOf(c)};
      if(!filter||filter(h)) out.push(h);
    });
  }
  return out;
}
/* 自分の装備カードのうち、別の正しい対象が存在するもの */
function v15MovableEquips(filter){
  return v15AttachedEquips(filter).filter(h=>{
    const now=API.equippedMonster(h);
    return API.equipTargets(h).some(t=>!now||t.card.uid!==now.card.uid);
  });
}

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p15eq.move-equip',(answer,args)=>{
  const cards=v49P1ChoiceCards(answer);
  if(cards.length<2){ v49P1FinishSource(args); return; }
  const eq=locateCardAnyV4(cards[0].card), mon=locateCardAnyV4(cards[1].card);
  if(eq&&mon) API.moveEquip(eq,mon,args.reason);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p15eq.destroy-one',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h) API.destroy(h,args.reason);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p15eq.change-position',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(!h||h.zone!=='mz') continue;
    if(h.card.face==='down') API.flipFaceUpByEffect(h,'atk',args.reason);
    else API.changePosition(h,h.card.pos==='atk'?'def':'atk',args.reason);
  }
  v49P1FinishSource(args);
});
/* 「攻撃力または守備力」の宣言を装備カードに凍結する */
API.registerChoiceHandler('p15eq.equip-mode',(answer,args)=>{
  const picked=(answer&&answer.cards||[])[0];
  const mode=picked&&picked.value;
  const src=(args.sourceUid!=null)?findCardByUid(args.sourceUid):null;
  if(src&&(mode==='atk'||mode==='def')) API.persistDeclaration(src,'equipMode',mode);
});

/* =====================================================================
   1. 装備できる相手が決まっているカード
   ===================================================================== */
/* 機械族のみ装備可能。攻撃力または守備力が700アップ（発動時に選ぶ） */
defineUnifiedCardV4('7カード',[{
  key:'declare-atk-or-def',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){ return v15EquipTargetsFor(ctx).length>0; },
  operation(ctx){
    ensureCardUid(gameState,ctx.card);
    v49P1Open(ctx,{kind:'mode',title:'7カード：上げるのは攻撃力か守備力か',
      candidates:[{key:'atk',label:'攻撃力+700',value:'atk'},
                  {key:'def',label:'守備力+700',value:'def'}],min:1,max:1},
      'p15eq.equip-mode',{reason:'7カード',sourceUid:ctx.card.uid},false);},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true,
    equipSpec:{canEquip(h){ return dbOf(h.card).ra==='機械'; },label:'機械族のみ'},
    continuous:{scope:'equippedMonster',from:['sz'],
      apply(card,self){
        const mode=API.persistentDeclaration(self,'equipMode')||'atk';
        return mode==='def'?{def:700}:{atk:700};
      }}});
function v15EquipTargetsFor(ctx){
  const h=locateCardAnyV4(ctx.card);
  return h?API.equipTargets(h):[];
}

/* 「D」のみ装備可能。装備モンスターが破壊された時、お互いに元々の攻撃力分のダメージ */
defineUnifiedCardV4('D・レトロエンジン',[{
  key:'equipped-destroyed-mutual-damage',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,
  speed:1,events:['onLeaveField'],forced:true,
  condition(ctx){
    const e=ctx.event||{};
    if(e.byDestroy!==true) return false;
    const eq=ctx.card;
    return !!(eq&&eq.equipTo&&e.uid===eq.equipTo.uid);},
  operation(ctx){
    const h=API.leavingCardOf(ctx.event);
    const dmg=h?API.baseAtk(h):0;
    if(dmg>0){ API.damageLP(ctx.player,dmg); API.damageLP(v15Opponent(ctx.player),dmg); }},
  afterResolve(){}
}],{type:'spell',priority:1,
    equipSpec:{canEquip(h){ return isCardInGroupV4(h.db,GROUP.D_MORPHTRONIC); },label:'「D」のみ'},
    continuous:{scope:'equippedMonster',from:['sz'],apply(){return null;}}});

/* 「E・HERO スパークマン」にのみ装備可能。表示形式変更を3回使うと自壊 */
defineUnifiedCardV4('スパークガン',[{
  key:'change-position-three-times',type:EFFECT_TYPE.IGNITION,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){
    return !!ctx.card.equipTo
      &&(gameState.phase==='main1'||gameState.phase==='main2')
      &&gameState.activePlayer===ctx.player
      &&API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  operation(ctx){
    const self=locateCardAnyV4(ctx.card); if(!self) return;
    API.addCounter(self,'使用',1);
    v49P1Open(ctx,{kind:'card',title:'スパークガン：表示形式を変更するモンスター',
      candidates:API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}),min:1,max:1},
      'p15eq.change-position',{reason:'スパークガン'},false);
    if(API.countCounter(self,'使用')>=3) API.destroy(self,'スパークガン');},
  afterResolve(){}
}],{type:'spell',priority:1,targets:true,timing:['mainPhase'],
    equipSpec:{canEquip(h){
      return sameCanonicalCardV4(h.db,dbOf({id:findCardIndex('E・HERO スパークマン')}));
    },label:'「E・HERO スパークマン」のみ'},
    continuous:{scope:'equippedMonster',from:['sz'],apply(){return null;}}});

/* 装備モンスターは戦闘では破壊されない */
defineScript('ミスト・ボディ',{
  type:'spell', priority:1, condition(){ return true; },
  resolve(){ API.log('ミスト・ボディ：装備モンスターは戦闘では破壊されない'); },
  afterResolve(){},
  continuous:{scope:'equippedMonster', from:['sz'], apply(){ return null; },
    battleProof(){ return true; }}
});

/* =====================================================================
   2. 装備イベントに反応するカード
   ===================================================================== */
/* このカードに装備カードが装備された場合、その装備カードを破壊する */
defineUnifiedCardV4('鉄の騎士 ギア・フリード',[{
  key:'destroy-equip-attached-to-self',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onEquipAttached'],forced:true,
  condition(ctx){
    const e=ctx.event||{};
    return !!(ctx.card&&e.uid===ctx.card.uid&&API.equipCardOfEvent(e));},
  operation(ctx){
    const h=API.equipCardOfEvent(ctx.event);
    if(h) API.destroy(h,'鉄の騎士 ギア・フリード');},
  afterResolve(){}
}],{type:'monster',priority:1});

/* 装備カードが装備された時、ターン終了時まで全ての装備カードの効果を無効にする */
defineUnifiedCardV4('ガラスの鎧',[{
  key:'equip-attached-negate-all-equips',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onEquipAttached'],
  condition(ctx){ return !!API.equipCardOfEvent(ctx.event); },
  operation(ctx){
    v15AttachedEquips().forEach(h=>API.negateEffectUntil(h,'endTurn','ガラスの鎧',ctx.card));},
  afterResolve(){}
}],{type:'trap',priority:2});

/* 装備される度に1000回復、装備カードが場を離れる度に1000ダメージ */
defineUnifiedCardV4('士気高揚',[{
  key:'equip-attached-recover',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onEquipAttached'],forced:true,
  condition(ctx){
    const h=API.equipCardOfEvent(ctx.event);
    return !!(h&&dbOf(h.card).k==='s');},
  operation(ctx){
    const h=API.equipCardOfEvent(ctx.event);
    if(h) API.recoverLP(h.p,1000);},
  afterResolve(){}
},{
  key:'equip-left-field-damage',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,
  events:['onLeaveField'],forced:true,
  condition(ctx){
    const e=ctx.event||{};
    if(e.fromZone!=='sz') return false;
    const h=API.leavingCardOf(e);
    return !!(h&&dbOf(h.card).k==='s'&&dbOf(h.card).sub==='装備');},
  operation(ctx){
    const e=ctx.event||{};
    if(e.player===0||e.player===1) API.damageLP(e.player,1000);},
  afterResolve(){}
}],{type:'spell',priority:1,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* =====================================================================
   3. 装備を移し替えるカード
   ===================================================================== */
/* 装備カード1枚を別の正しい対象へ移し替える */
defineUnifiedCardV4('移り気な仕立屋',[{
  key:'move-any-equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'both',speed:2,events:['activate'],
  condition(){ return v15MovableEquips().length>0; },
  operation(ctx){
    const eqs=v15MovableEquips();
    const mons=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
    v49P1Open(ctx,{kind:'card',title:'移り気な仕立屋：装備カード→移し替え先の順に選択',
      candidates:eqs.concat(mons),min:2,max:2},'p15eq.move-equip',
      {reason:'移り気な仕立屋'},true);},
  afterResolve(){}
}],{type:'spell',priority:2,targets:true});

/* 1ターンに1度、自分の「ヴァイロン」装備カードを別の正しい対象へ移し替える */
defineUnifiedCardV4('ヴァイロン・スティグマ',[{
  key:'move-vylon-equip',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.ONFIELD,targetSide:'both',speed:2,events:['activate'],
  condition(ctx){ return v15OwnVylonEquips(ctx).length>0; },
  operation(ctx){
    const eqs=v15OwnVylonEquips(ctx);
    const mons=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
    v49P1Open(ctx,{kind:'card',title:'ヴァイロン・スティグマ：装備カード→移し替え先の順に選択',
      candidates:eqs.concat(mons),min:2,max:2},'p15eq.move-equip',
      {reason:'ヴァイロン・スティグマ'},false);},
  afterResolve(){}
}],{type:'monster',priority:2,countLimit:1,targets:true,
    timing:['mainPhase','opponentTurn']});
function v15OwnVylonEquips(ctx){
  return v15MovableEquips(h=>h.p===ctx.player&&isSetCardV4(h.db,SETCODE.VYLON));
}

/* 表側モンスター1体を選び、全ての装備カードをそれに装備する。
   正しい対象でない装備カードは破壊する。 */
defineUnifiedCardV4('力の集約',[{
  key:'gather-all-equips',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],
  condition(){ return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).length>0
    &&v15AttachedEquips().length>0; },
  target(ctx,done){
    API.selectCard('力の集約：装備を集めるモンスター',
      API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t) return;
    v15AttachedEquips().slice().reverse().forEach(h=>{
      const eq=locateCardAnyV4(h.card); if(!eq) return;
      const dst=locateCardAnyV4(t.card); if(!dst) return;
      if(API.equipLegal(eq,dst)) API.moveEquip(eq,dst,'力の集約');
      else API.destroy(eq,'力の集約（正しい対象ではない）');
    });},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true});

/* 攻撃宣言時、装備カードの数まで相手モンスターの表示形式を変更できる */
defineUnifiedCardV4('ヴァイロン・ソルジャー',[{
  key:'attack-declare-change-positions',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'opponent',speed:1,events:['onAttackDeclare'],
  condition(ctx){
    const b=(typeof currentBattleIdentityV6==='function')?currentBattleIdentityV6(gameState):null;
    if(!b||!ctx.card||ctx.card.uid==null||b.attackerUid!==ctx.card.uid) return false;
    const h=locateCardAnyV4(ctx.card);
    return !!h&&API.equipCount(h)>0
      &&API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card); if(!h) return;
    const n=API.equipCount(h);
    const pool=API.fieldCards({player:ctx.opponent,zone:'mz'});
    v49P1Open(ctx,{kind:'card',
      title:'ヴァイロン・ソルジャー：表示形式を変更する相手モンスター（'+n+'体まで）',
      candidates:pool,min:0,max:Math.min(n,pool.length)},
      'p15eq.change-position',{reason:'ヴァイロン・ソルジャー'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,
    passive:{onAttackDeclare:ctx=>ctx.zone==='mz'}});

/* 竜魂の力・幻惑の巻物（種族／属性の上書き）、降格処分・シンクロ・ヒーロー
   （レベル修整）、裸の王様（魔法・罠まで届く無効化スコープ）、
   ドラグニティ系（モンスターを装備カード扱いにする手順）、鎖付き爆弾
   （罠→装備への変換）などは別primitiveが要るため ENGINE_GAP のまま残す。 */
