/* CharacteristicOverride recovery batch — System v17 の特性上書きで解消したカード。
   使う共通機構は API.setRace / setAttribute / setCardName / setTuner /
   clearCharMods / raceOf / attrOf / nameOf / isTunerNow と、
   continuous.raceOverride / attrOverride / nameOverride / tunerOverride、
   v15 の装備適正と装備先スコープ、P1.1 の宣言、既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v17OwnFaceUp(ctx,f){
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&(!f||f(x))});
}
function v17AllFaceUp(f){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&(!f||f(x))});
}
/* 永続カードに凍結した宣言を読む */
function v17Declared(self,kind){
  return self ? API.persistentDeclaration(self,kind) : null;
}

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p17ch.set-tuner',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.zone==='mz') API.setTuner(h,true,'permanent',args.reason);
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p17ch.set-name',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.zone==='mz') API.setCardName(h,String(args.name),args.until||'endPhase',args.reason);
  v49P1FinishSource(args);
});
/* 属性を宣言してから対象を選ぶ、2段階の選択を継続で繋ぐ */
API.registerChoiceHandler('p17ch.attr-then-pick',(answer,args)=>{
  const picked=(answer&&answer.cards||[])[0];
  const attr=picked?String(picked.value):'';
  const pool=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
  if(!attr||!pool.length){ v49P1FinishSource(args); return; }
  API.requestChoice({kind:'card',title:(args.reason||'効果')+'：属性を変えるモンスター',
    candidates:pool,min:1,max:1,cancelable:false,
    resume:{handler:'p17ch.set-attr',
            args:{player:args.player,reason:args.reason,attr,until:args.until||'endPhase',
                  sourceUid:(args.sourceUid!=null)?args.sourceUid:null}}});
});
API.registerChoiceHandler('p17ch.set-attr',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.zone==='mz') API.setAttribute(h,String(args.attr),args.until||'endPhase',args.reason);
  v49P1FinishSource(args);
});

/* =====================================================================
   1. チューナーとして扱う
   ===================================================================== */
function v17DefineTuneSpell(name,pool){
  defineUnifiedCardV4(name,[{
    key:'treat-as-tuner',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
    targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
    condition(ctx){ return pool(ctx).length>0; },
    operation(ctx){
      v49P1Open(ctx,{kind:'card',title:name+'：チューナーとして扱うモンスター',
        candidates:pool(ctx),min:1,max:1},'p17ch.set-tuner',{reason:name},true);},
    afterResolve(){}
  }],{type:'spell',priority:1,targets:true});
}
/* レベル4以下の通常モンスター */
v17DefineTuneSpell('ナチュラル・チューン',ctx=>v17OwnFaceUp(ctx,
  x=>(x.db.st||[]).indexOf('通常')>=0&&(x.db.lv||99)<=4&&!x.tuner));
/* レベル4の光属性モンスター（属性は現在値で見る） */
v17DefineTuneSpell('ライトニング・チューン',ctx=>v17OwnFaceUp(ctx,
  x=>x.attr==='光'&&(x.db.lv||0)===4&&!x.tuner));

/* =====================================================================
   2. カード名を別のカードとして扱う
   ===================================================================== */
/* 表側で存在する限り「サイバー・ドラゴン」として扱う */
defineScript('プロト・サイバー・ドラゴン',{
  continuous:{scope:'self', from:['mz'], apply(){ return null; },
    nameOverride(card){ return card.face==='up' ? 'サイバー・ドラゴン' : null; }}
});

/* 1ターンに1度、自分の名前をエンドフェイズ時まで「ジェネクス・コントローラー」に */
defineUnifiedCardV4('スペア・ジェネクス',[{
  key:'self-name-genex-controller',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){ return v17OtherGenex(ctx).length>0; },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.setCardName(h,'ジェネクス・コントローラー','endPhase','スペア・ジェネクス');},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});
function v17OtherGenex(ctx){
  return v17OwnFaceUp(ctx,x=>x.card.uid!==ctx.card.uid
    &&String(x.name||'').indexOf('ジェネクス')>=0);
}

/* 1ターンに1度、フィールドのチューナー1体の名前をエンドフェイズ時まで変える */
defineUnifiedCardV4('A・ジェネクス・リモート',[{
  key:'tuner-name-genex-controller',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){ return v17TunersOnField().length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'A・ジェネクス・リモート：名前を変えるチューナー',
      candidates:v17TunersOnField(),min:1,max:1},'p17ch.set-name',
      {reason:'A・ジェネクス・リモート',name:'ジェネクス・コントローラー',until:'endPhase'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,targets:true,timing:['mainPhase']});
function v17TunersOnField(){
  return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&x.tuner===true});
}

/* =====================================================================
   3. 属性を変える
   ===================================================================== */
/* 1ターンに1度、モンスター1体の属性をエンドフェイズ時まで宣言した属性にする */
defineUnifiedCardV4('A・ジェネクス・チェンジャー',[{
  key:'declare-attr-then-change',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(){ return v17AllFaceUp().length>0; },
  operation(ctx){
    v49P1Open(ctx,{kind:'declare',title:'A・ジェネクス・チェンジャー：属性を宣言',
      candidates:['闇','光','地','水','炎','風','神'].map((v,i)=>({key:'a'+i,label:v,value:v})),
      min:1,max:1},'p17ch.attr-then-pick',
      {reason:'A・ジェネクス・チェンジャー',until:'endPhase'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,targets:true,timing:['mainPhase']});

/* 属性を宣言して発動。このカードがある限り、全ての表側モンスターはその属性になる */
defineScript('DNA移植手術',{
  type:'trap', priority:2, condition(){ return true; },
  activationV11(ctx,d){
    API.declare(ctx,'attribute',
      {title:'DNA移植手術：属性を宣言',activation:d,cancelable:false},{handler:'p11cards.declare-commit',args:{}});},   /* S03-U263: commit the activation after the declaration */
  resolve(ctx){
    const h=locateCardAnyV4(ctx.card);
    const v=API.declared(ctx,'attribute');
    if(h&&v) API.persistDeclaration(h,'attribute',String(v));
    API.log('DNA移植手術：宣言した属性になる');},
  afterResolve(){},
  continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; },
    attrOverride(card,self){ return v17Declared(self,'attribute'); }}
});

/* 装備モンスターの属性は宣言した属性になる */
defineScript('幻惑の巻物',{
  type:'spell', priority:1, targets:true, condition(){ return API.fieldCards({zone:'mz', filter:x=>x.card.face==='up'}).length>0; },
  /* S03-U263: 「属性を1つ宣言して発動する」 — the attribute is declared, then the monster to equip is chosen, at activation (before: the activation never
     committed after the declaration, and no equip target was chosen) */
  activationV11(ctx,d){
    API.declare(ctx,'attribute',
      {title:'幻惑の巻物：属性を宣言',activation:d,cancelable:false},{handler:'s03u263.scroll-target',args:{}});},
  resolve(ctx){
    const h=locateCardAnyV4(ctx.card), t=ctx.selectedTargets&&ctx.selectedTargets[0]&&resolveTarget(ctx.selectedTargets[0]);
    const v=API.declared(ctx,'attribute');
    if(!h||!t||t.zone!=='mz'||t.card.face!=='up') return;
    API.equipSpell(h,t,'幻惑の巻物');
    const h2=locateCardAnyV4(ctx.card);
    if(h2&&v) API.persistDeclaration(h2,'attribute',String(v));
    API.log('幻惑の巻物：装備モンスターの属性を変える');},
  afterResolve(){},
  continuous:{scope:'equippedMonster', from:['sz'], apply(){ return null; },
    attrOverride(card,self){ return v17Declared(self,'attribute'); }}
});
API.registerChoiceHandler('s03u263.scroll-target',(a,x)=>{
  if(a.cancelled) return p11cAbort(x.activation);
  const pool=API.fieldCards({zone:'mz', filter:t=>t.card.face==='up'});
  if(!pool.length) return p11cAbort(x.activation);
  p11cOpen(x.activation,{title:'幻惑の巻物：装備するモンスター',candidates:pool,min:1,max:1,targeting:true,cancelable:false},'p11cards.commit-targets',{});
});

/* =====================================================================
   4. 種族を変える
   ===================================================================== */
/* 種族を宣言して発動。このカードがある限り、全ての表側モンスターはその種族になる */
defineScript('DNA改造手術',{
  type:'trap', priority:2, condition(){ return true; },
  activationV11(ctx,d){
    API.declare(ctx,'race',
      {title:'DNA改造手術：種族を宣言',activation:d,cancelable:false},{handler:'p11cards.declare-commit',args:{}});},   /* S03-U263 */
  resolve(ctx){
    const h=locateCardAnyV4(ctx.card);
    const v=API.declared(ctx,'race');
    if(h&&v) API.persistDeclaration(h,'race',String(v));
    API.log('DNA改造手術：宣言した種族になる');},
  afterResolve(){},
  continuous:{scope:'allMonsters', from:['sz'], apply(){ return null; },
    raceOverride(card,self){ return v17Declared(self,'race'); }}
});

/* 自分フィールドの全てのモンスターはエンドフェイズ時までドラゴン族になる */
defineUnifiedCardV4('竜の血族',[{
  key:'own-monsters-become-dragon',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(ctx){ return v17OwnFaceUp(ctx).length>0; },
  operation(ctx){
    v17OwnFaceUp(ctx).forEach(x=>API.setRace(x,'ドラゴン','endPhase','竜の血族'));},
  afterResolve(){}
}],{type:'trap',priority:2});

/* 相手フィールドの表側モンスターは自分のターンのみ植物族になる。
   相手の効果で破壊されたら1枚ドローする。 */
defineUnifiedCardV4('アイヴィ・シャックル',[{
  key:'destroyed-by-opponent-draw',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:2,
  events:['onLeaveField'],
  condition(ctx){
    const e=ctx.event||{};
    return !!(ctx.card&&e.uid===ctx.card.uid&&e.byDestroy===true
              &&e.fromFace==='up'&&API.me(ctx).deck.length>0);},
  operation(ctx){ API.draw(ctx.player,1); },
  afterResolve(){}
}],{type:'trap',priority:2,
    continuous:{scope:'oppMonsters', from:['sz'], apply(){ return null; },
      raceOverride(card,self){
        const loc=locateCardAnyV4(self);
        if(!loc) return null;
        /* 「自分のターンのみ」＝このカードのコントローラーのターン */
        return (gameState.activePlayer===loc.p&&card.face==='up') ? '植物' : null;
      }}});

/* 戦士族のみ装備可能。装備モンスターはドラゴン族となり、攻守が500アップする */
defineScript('竜魂の力',{
  type:'spell', priority:1, condition(){ return true; },
  resolve(){ API.log('竜魂の力：装備モンスターはドラゴン族になる'); },
  afterResolve(){},
  equipSpec:{canEquip(h){ return h.db.ra==='戦士'; },label:'戦士族のみ'},
  continuous:{scope:'equippedMonster', from:['sz'],
    apply(){ return {atk:500, def:500}; },
    raceOverride(){ return 'ドラゴン'; }}
});

/* ハーピィ・レディ2 / 3（別名＋戦闘由来の追加効果）、始祖神鳥シムルグ
   （手札での通常モンスター扱い）、墓守の従者（戦闘ダメージの分類変更）、
   アポカテクイル（条件つきレベル扱い）、ドラグニティ－パルチザン
   （モンスターを装備カード扱いにする手順）などは別primitiveが要るため
   ENGINE_GAP のまま残す。 */
