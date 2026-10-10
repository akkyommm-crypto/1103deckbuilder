/* DestructionProtection recovery batch — System v21 で解消したカード。
   使う共通機構は sc.protectV21 / continuous.protectV21 / API.grantProtection（v21）、
   P3 cost snapshot、P4 setcode、v6 battleDamage、v9 LeaveField、
   v11 Token、v14 StatModifier、v15 Equip、既存APIのみ。

   v21 が防ぐのは破壊だけ。対象耐性（continuous.immuneToTarget）とは別物。
   無条件の戦闘破壊耐性は既存の battleProof をそのまま使う。 */

/* テキスト推定の battleProof は無条件なので、条件つき・回数つきのカードでは
   明示的に切って v21 の判定だけに任せる。battleProof の実装自体は変えない。 */
/* ---- 共通ヘルパ --------------------------------------------------------- */
/* 戦闘相手の現在の攻撃力／レベル */
function v21FoeATK(ctx){ const f=ctx&&ctx.opponentCard; return f?curATK(f):0; }
function v21FoeLV(ctx){ const f=ctx&&ctx.opponentCard; return f?curLV(f):0; }
/* そのカードが今いる場所 */
function v21At(card){ return locateCardAnyV4(card); }
/* 「1ターンに1度だけ戦闘では破壊されない」だけを持つカードの定型 */
function v21DefineOncePerTurnBattleProof(name, extraCond){
  defineUnifiedCardV4(name,[],{type:'monster',priority:1,battleProof:false,
    protectV21:{key:'v21.once',battle:(target)=>!extraCond||extraCond(target),
                perTurn:1,label:name}});
}
/* 「攻撃力◯以上のモンスターとの戦闘では破壊されない」の定型 */
function v21DefineAtkThresholdProof(name, atLeast){
  defineUnifiedCardV4(name,[],{type:'monster',priority:1,battleProof:false,
    protectV21:{key:'v21.atk',battle:(target,src,ctx)=>v21FoeATK(ctx)>=atLeast,label:name}});
}

/* =====================================================================
   1. 回数制限つきの戦闘破壊耐性
   ===================================================================== */
/* このカードは1ターンに2度まで、戦闘では破壊されない */
defineUnifiedCardV4('シールド・ウィング',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.twice',battle:true,perTurn:2,label:'シールド・ウィング'}});

/* ①:このカードは1ターンに1度だけ戦闘では破壊されない */
v21DefineOncePerTurnBattleProof('ダーク・リゾネーター');
v21DefineOncePerTurnBattleProof('マッシブ・ウォリアー');

/* ①:守備表示のこのカードは、1ターンに1度だけ戦闘では破壊されない */
v21DefineOncePerTurnBattleProof('ゴゴゴゴーレム',(card)=>card&&card.pos==='def');

/* このカードは1ターンに1度だけ戦闘では破壊されない。
   攻撃対象に選択された時、相手ライフに500ダメージを与える */
defineUnifiedCardV4('ナチュル・ビーンズ',[{
  key:'burn-on-attack-target',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onAttackDeclare'],
  condition(ctx){
    const h=v21At(ctx.card), e=ctx.event||{};
    if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
    return e.defenderUid===ctx.card.uid;},
  operation(ctx){ API.damageLP(ctx.opponent,500); },
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,battleProof:false,
  protectV21:{key:'v21.once',battle:true,perTurn:1,label:'ナチュル・ビーンズ'},
  passive:{onAttackDeclare(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}});

/* =====================================================================
   2. 戦闘相手を見る条件つき耐性
   ===================================================================== */
/* このカードは攻撃力1900以上のモンスターとの戦闘では破壊されない */
v21DefineAtkThresholdProof('ロードランナー',1900);
v21DefineAtkThresholdProof('氷結界の修験者',1900);
v21DefineAtkThresholdProof('翻弄するエルフの剣士',1900);

/* このカードはレベル4以上のモンスターとの戦闘では破壊されない */
defineUnifiedCardV4('氷弾使いレイス',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.lv',battle:(target,src,ctx)=>v21FoeLV(ctx)>=4,label:'氷弾使いレイス'}});

/* このカードは対象を指定しない魔法・罠カードの効果では破壊されない。
   また、攻撃力1900以下のモンスターとの戦闘では破壊されない */
defineUnifiedCardV4('異次元竜 トワイライトゾーンドラゴン',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.twilight',
    battle:(target,src,ctx)=>v21FoeATK(ctx)<=1900,
    /* S03-U168: 「対象を指定しない魔法・罠カードの効果」 — Spells / Traps only (sourceKind was null = any source, monsters included) */
    effect:true,sourceKind:['s','t'],nonTargetingOnly:true,
    label:'異次元竜 トワイライトゾーンドラゴン'}});

/* =====================================================================
   3. 自分の状況を見る条件つき耐性
   ===================================================================== */
/* 自分の手札が0枚の場合、攻撃表示のこのカードは戦闘では破壊されない */
defineUnifiedCardV4('リボーン・ゾンビ',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.handless',battle:(card)=>{
    const h=v21At(card);
    return !!h&&h.zone==='mz'&&card.pos==='atk'
      &&gameState.players[h.p].hand.length===0;},label:'リボーン・ゾンビ'}});

/* 自分の手札が0枚の場合、表側表示のこのカードは戦闘及びカードの効果では破壊されない */
defineUnifiedCardV4('インフェルニティ・ガーディアン',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.handless',
    battle:(card)=>v21HandEmptyFaceUp(card),
    effect:(card)=>v21HandEmptyFaceUp(card),
    label:'インフェルニティ・ガーディアン'}});
function v21HandEmptyFaceUp(card){
  const h=v21At(card);
  return !!h&&h.zone==='mz'&&card.face==='up'&&gameState.players[h.p].hand.length===0;
}

/* 表側守備表示の限り、1ターンに1度だけ戦闘またはカードの効果では破壊されない */
defineUnifiedCardV4('クロック・リゾネーター',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.once',
    battle:(card)=>v21FaceUpDef(card),
    effect:(card)=>v21FaceUpDef(card),
    perTurn:1,label:'クロック・リゾネーター'}});
function v21FaceUpDef(card){
  const h=v21At(card);
  return !!h&&h.zone==='mz'&&card.face==='up'&&card.pos==='def';
}

/* このカードは1ターンに1度だけ、対象を指定しないカードの効果では破壊されない */
defineUnifiedCardV4('深海王デビルシャーク',[],{type:'monster',priority:1,
  protectV21:{key:'v21.once',effect:true,nonTargetingOnly:true,perTurn:1,
              label:'深海王デビルシャーク'}});

/* 他の「ジュラック」がフィールドにいる場合、このカードは戦闘では破壊されない */
defineUnifiedCardV4('ジュラック・ブラキス',[],{type:'monster',priority:1,battleProof:false,
  protectV21:{key:'v21.jurrac',battle:(card)=>
    API.fieldCards({zone:'mz',filter:x=>x.card!==card&&x.card.face==='up'
      &&isSetCardV4(x.db,SETCODE.JURRAC)}).length>0,label:'ジュラック・ブラキス'}});

/* 自分フィールドにチューナーがいる場合このカードは戦闘では破壊されない。
   自分の表側のチューナーが場を離れた時、800回復する */
defineUnifiedCardV4('ブラックポータン',[{
  key:'recover-on-tuner-leave',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onLeaveField'],
  condition(ctx){
    const h=v21At(ctx.card), e=ctx.event||{};
    if(!h||h.zone!=='mz') return false;
    return e.player===ctx.player&&e.zone==='mz'&&e.face==='up'&&!!e.wasTuner;},
  operation(ctx){ API.recoverLP(ctx.player,800); },
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,battleProof:false,
  protectV21:{key:'v21.tuner',battle:(card)=>{
    const h=v21At(card); if(!h) return false;
    return API.fieldCards({player:h.p,zone:'mz',
      filter:x=>x.card.face==='up'&&isTunerNowV17(x.card)}).length>0;},
    label:'ブラックポータン'},
  passive:{onLeaveField(ctx){return ctx.zone==='mz';}}});

/* =====================================================================
   4. 継続効果で味方へ与える耐性
   ===================================================================== */
/* このカードがモンスターゾーンにある限り、自分の「アマゾネス」は戦闘では破壊されない */
defineUnifiedCardV4('アマゾネス女王',[],{type:'monster',priority:1,
  continuous:{scope:'ownMonsters',from:['mz'],apply(){return null;},
    protectV21:{scope:'ownMonsters',battle:(target)=>
      isSetCardV4(dbOf(target),SETCODE.AMAZONESS),label:'アマゾネス女王'}}});

/* 自分フィールド上モンスターは、攻撃力の同じモンスターとの戦闘では破壊されない */
defineUnifiedCardV4('騎士道精神',[{
  key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(){return true;},operation(){},afterResolve(){}
}],{type:'trap',subtype:'永続',priority:2,
  continuous:{scope:'ownMonsters',from:['sz'],apply(){return null;},
    protectV21:{scope:'ownMonsters',battle:(target,src,ctx)=>
      !!ctx&&!!ctx.opponentCard&&curATK(target)===curATK(ctx.opponentCard),
      label:'騎士道精神'}}});

/* このカードがある限り、攻撃表示のトークンは攻撃力1000アップし戦闘では破壊されない */
defineUnifiedCardV4('暴走闘君',[{
  key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(){return true;},operation(){},afterResolve(){}
}],{type:'trap',subtype:'永続',priority:2,
  continuous:{scope:'allMonsters',from:['sz'],
    apply(card){return (card&&card.token&&card.pos==='atk')?{atk:1000}:null;},
    protectV21:{scope:'allMonsters',battle:(target)=>
      !!target&&!!target.token&&target.pos==='atk',label:'暴走闘君'}}});

/* このカードがある限り、自分の「氷結界」は魔法・罠カードの効果では破壊されない。
   召喚・反転召喚に成功した時、守備表示になる */
defineUnifiedCardV4('氷結界の大僧正',[{
  key:'to-defense-on-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onNormalSummon','onFlip'],
  condition(ctx){ return ctx.zone==='mz'&&ctx.card.pos!=='def'; },
  operation(ctx){
    const h=v21At(ctx.card);
    if(h) API.changePosition(h,'def','氷結界の大僧正');},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
  continuous:{scope:'ownMonsters',from:['mz'],apply(){return null;},
    protectV21:{scope:'ownMonsters',effect:(target)=>
      isSetCardV4(dbOf(target),SETCODE.ICE_BARRIER),
      sourceKind:['s','t'],label:'氷結界の大僧正'}},
  passive:{onNormalSummon(ctx){return ctx.zone==='mz';},
           onFlip(ctx){return ctx.zone==='mz';}}});

/* このカードがある限り、自分の再度召喚された状態のデュアルは
   カードの効果では破壊されない */
defineUnifiedCardV4('エナジー・ブレイブ',[{
  key:'activate',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(){return true;},operation(){},afterResolve(){}
}],{type:'trap',subtype:'永続',priority:2,
  continuous:{scope:'ownMonsters',from:['sz'],apply(){return null;},
    protectV21:{scope:'ownMonsters',effect:(target)=>
      !!target&&target.dualUp===true&&(dbOf(target).st||[]).indexOf('デュアル')>=0,
      label:'エナジー・ブレイブ'}}});

/* =====================================================================
   5. 装備・エクシーズ・チェーン応答
   ===================================================================== */
/* 戦士族にのみ装備可能。攻撃力800アップ。
   モンスターに装備されているこのカードはカードの効果では破壊されない */
defineUnifiedCardV4('融合武器ムラサメブレード',[{
  key:'equip',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){ return v21WarriorTargets().length>0; },
  target(ctx,done){
    API.selectCard('融合武器ムラサメブレード：装備するモンスター',v21WarriorTargets(),t=>done([t]));},
  operation(ctx){
    const s=v21At(ctx.card), t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(s&&t) API.equipSpell(s,t,'融合武器ムラサメブレード');},
  afterResolve(){}
}],{type:'spell',subtype:'装備',priority:1,targets:true,
  protectV21:{key:'v21.murasame',effect:(card)=>{
    const h=v21At(card);
    return !!h&&h.zone==='sz'&&!!card.equipTo;},label:'融合武器ムラサメブレード'},
  continuous:{scope:'equippedMonster',from:['sz'],
    apply(card,self){return (self&&self.equipTo&&self.equipTo.uid===card.uid)?{atk:800}:null;}}});
function v21WarriorTargets(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&currentRaceV17(x.card)==='戦士'});
}

/* 自分のエクシーズ素材を1つ取り除いて発動。
   自分の全エクシーズモンスターはエンドフェイズ時までカードの効果では破壊されない */
defineUnifiedCardV4('皇の波動',[{
  key:'protect-own-xyz',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){ return v21OwnXyzWithMaterial(ctx.player).length>0; },
  /* S03-U114 */detachCostS03:{count:1,reason:'皇の波動（コスト）',holders(ctx){return v21OwnXyzWithMaterial(ctx.player);}},
  operation(ctx){
    API.fieldCards({player:ctx.player,zone:'mz',
      filter:x=>x.card.face==='up'&&(x.db.st||[]).indexOf('エクシーズ')>=0})
      .forEach(h=>API.grantProtection(h,{effect:true,until:'endPhase',
        key:'v21.kounohadou',label:'皇の波動'}));},
  afterResolve(){}
}],{type:'trap',priority:2});
function v21OwnXyzWithMaterial(p){
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&Array.isArray(x.card.xyz)&&x.card.xyz.length>0});
}

/* =====================================================================
   6. 無条件の戦闘破壊耐性 + 別効果
   ===================================================================== */
/* ①:このカードは戦闘では破壊されない。
   ②:1ターンに1度、攻撃表示のこのカードがある場合、
     レベル5以下のモンスター1体をリリースして発動できる。
     リリースしたモンスターの元々の攻撃力分のダメージを相手に与える */
defineUnifiedCardV4('キャッスル・ゲート',[{
  key:'tribute-burn',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){
    const h=v21At(ctx.card);
    if(!h||h.zone!=='mz'||h.card.face!=='up'||h.card.pos!=='atk'){
      ctx.reason='攻撃表示でモンスターゾーンに存在する必要があります'; return false; }
    if(ctx.card.v21CastleGateTurn===gameState.turn){
      ctx.reason='このターンは既に使用しています'; return false; }
    return v21CastleFodder(ctx.player).length>0;},
  cost(ctx,done){
    const pool=v21CastleFodder(ctx.player);
    if(!pool.length){ done(false); return; }
    API.selectCard('キャッスル・ゲート：リリースするレベル5以下',pool,t=>{
      const h=resolveTarget(t);
      if(!h){ done(false); return; }
      /* P3: リリース前に「元々の攻撃力」を控える。 */
      API.recordCostSnapshot(h.card,['originalAtk']);
      API.sendToGrave(h,'キャッスル・ゲート（コスト）');
      const me=v21At(ctx.card);
      if(me) API.setCardFlag(me,'v21CastleGateTurn',gameState.turn,'キャッスル・ゲート');
      done(true);});},
  operation(ctx){
    const s=(API.costSnapshots(ctx)||[])[0];
    const amt=s&&typeof s.originalAtk==='number'?s.originalAtk:0;
    if(amt>0) API.damageLP(ctx.opponent,amt);},
  afterResolve(){}
}],{type:'monster',priority:1,battleProof:true,timing:['mainPhase']});
function v21CastleFodder(p){
  return API.fieldCards({player:p,zone:'mz',filter:x=>(curLV(x.card)||0)<=5});
}

/* ホワイト・ホールは「ブラック・ホール」を小道具にせざるを得ず、
   それだけで小道具側を TESTED へ誤昇格させてしまうので見送る。
   エレキーウィ・鉄壁の機皇兵・スネーク・チョーク・地縛大神官・地獄の番熊は
   「エレキ」「機皇兵」「レプティレス」「地縛神」「万魔殿」の
   authority metadata が別に要る。
   始祖の守護者ティラス・進化の奇跡・ハードアームドラゴン・柴戦士タロ・
   ジェルエンデュオ・電磁シールドは、エクシーズ素材前提の効果適用、
   特殊召喚元の provenance、2体分のリリース、戦闘破壊イベント、
   自壊の常時強制が別に要る。いずれも ENGINE_GAP のまま残す。 */
