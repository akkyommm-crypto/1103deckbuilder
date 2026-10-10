/* Class A bulk 50 — batch 3 / 継続ステータス・誘発バーン 7枚。
   engine は触らない。既存の continuous.apply（scope/from）、v14 StatModifier、
   onDestroy / onLeaveField / onActivateSuccess だけで書く。
   カード登録の第1引数は必ず文字列リテラル。
   このバッチで SKIP した4枚の理由は末尾にまとめる。 */

/* 破壊イベントで、指定種族のモンスターが破壊されたか */
function cxDestroyedRace(ctx, race, ownOnly){
  const e=ctx.event||{};
  const h=locateCardAnyV4(ctx.card);
  if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
  const gone=e.card;
  if(!gone) return false;
  const gdb=dbOf(gone);
  if(gdb.k!=='m') return false;
  if(currentRaceV17(gone)!==race) return false;
  if(ownOnly && e.player!==ctx.player) return false;
  return true;
}

/* ===== 21. 火炎鳥 — 自分フィールドの鳥獣族が破壊される度に攻撃力+500 ===== */
defineUnifiedCardV4('火炎鳥',[{
  key:'own-bird-destroyed-atk-up', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDestroy'],
  condition(ctx){ return cxDestroyedRace(ctx,'鳥獣',true); },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.addBaseStats(h,500,0,'permanent','火炎鳥');},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onDestroy:ctx=>cxDestroyedRace(ctx,'鳥獣',true)}});

/* ===== 22. 本気ギレパンダ — フィールドの獣族が破壊される度に攻撃力+500 ===== */
defineUnifiedCardV4('本気ギレパンダ',[{
  key:'beast-destroyed-atk-up', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onDestroy'],
  condition(ctx){ return cxDestroyedRace(ctx,'獣',false); },
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.addBaseStats(h,500,0,'permanent','本気ギレパンダ');},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onDestroy:ctx=>cxDestroyedRace(ctx,'獣',false)}});

/* ===== 23. パワー・サプライヤー
   1ターンに1度、自分の表側モンスター1体を選択。このカードが表側で存在する限り
   選択したモンスターの攻撃力は400アップする。 ===== */
defineUnifiedCardV4('パワー・サプライヤー',[{
  key:'mark-supply-target', type:EFFECT_TYPE.IGNITION, range:LOCATION.MZONE,
  targetRange:LOCATION.MZONE, targetSide:'self', speed:1, events:['activate'],
  condition(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='mz'||h.card.face!=='up'){
      ctx.reason='表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(ctx.card.cxSupplyTurn===gameState.turn){
      ctx.reason='このターンは既に使用しています'; return false; }
    return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  target(ctx,done){
    API.selectCard('パワー・サプライヤー：攻撃力を400アップさせるモンスター',
      API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'}),
      t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(!h||h.p!==ctx.player||h.zone!=='mz') return;
    const me=locateCardAnyV4(ctx.card);
    if(!me) return;
    API.setCardFlag(me,'cxSupplyTurn',gameState.turn,'パワー・サプライヤー');
    API.setCardFlag(me,'cxSupplyUid',ensureCardUid(gameState,h.card),'パワー・サプライヤー');},
  afterResolve(){}
}],{type:'monster', priority:1, targets:true, timing:['mainPhase'],
    continuous:{scope:'ownMonsters', from:['mz'],
      apply(card,self){
        if(!self||self.face!=='up') return null;
        if(self.cxSupplyUid==null||card.uid==null) return null;
        return (card.uid===self.cxSupplyUid) ? {atk:400} : null;}}});

/* ===== 24. 電池メン－単二型
   自分フィールドの「電池メン－単二型」が全て攻撃表示なら、その数×500だけ
   自分の機械族の攻撃力アップ。全て守備表示なら守備力アップ。 ===== */
function cxOwnBatteryC(p){
  const ref=dbOf({id:findCardIndex('電池メン－単二型')});
  return API.fieldCards({player:p,zone:'mz',
    filter:x=>x.card.face==='up'&&sameCanonicalCardV4(x.db||dbOf(x.card),ref)});
}
defineScript('電池メン－単二型',{type:'monster',priority:1,
  continuous:{scope:'ownMonsters', from:['mz'],
    apply(card,self){
      const sh=locateCardAnyV4(self);
      if(!sh||sh.zone!=='mz'||self.face!=='up') return null;
      if(currentRaceV17(card)!=='機械') return null;
      const list=cxOwnBatteryC(sh.p);
      if(!list.length) return null;
      const allAtk=list.every(x=>x.card.pos==='atk');
      const allDef=list.every(x=>x.card.pos==='def');
      /* 「1体につき500」は各ソースが自分の分だけ返す。engine が全ソースを合算する。 */
      if(allAtk) return {atk:500};
      if(allDef) return {def:500};
      return null;}}});

/* ===== 25. 女邪神ヌヴィア
   召喚された場合このカードを破壊する。
   相手がモンスターをコントロールしていれば、相手モンスター1体につき攻撃力200ダウン。 ===== */
defineUnifiedCardV4('女邪神ヌヴィア',[{
  key:'destroy-self-on-summon', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onNormalSummon'],
  condition(ctx){
    const e=ctx.event||{};
    const h=locateCardAnyV4(ctx.card);
    return !!h && h.zone==='mz' && e.card===ctx.card;},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h) API.destroy(h,'女邪神ヌヴィア');},
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onNormalSummon(ctx){
      const e=ctx.event||{}; return ctx.zone==='mz'&&e.card===ctx.card;}},
    continuous:{scope:'self', from:['mz'],
      apply(card,self){
        const sh=locateCardAnyV4(self);
        if(!sh||sh.zone!=='mz') return null;
        const foe=(sh.p===0)?1:0;
        const n=API.fieldCards({player:foe,zone:'mz'}).length;
        return n>0 ? {atk:-200*n} : null;}}});

/* ===== 26. エレメントの泉（永続魔法）
   フィールドのモンスターが持ち主の手札に戻った時、自分は500LP回復する。 ===== */
function cxReturnedToHand(ctx){
  const e=ctx.event||{};
  const h=locateCardAnyV4(ctx.card);
  if(!h||h.zone!=='sz'||h.card.face!=='up') return false;
  return e.fromZone==='mz' && e.toZone==='hand';
}
defineUnifiedCardV4('エレメントの泉',[{
  key:'monster-to-hand-recover', type:EFFECT_TYPE.TRIGGER, range:LOCATION.SZONE,
  speed:1, events:['onLeaveField'],
  condition(ctx){ return cxReturnedToHand(ctx); },
  operation(ctx){ API.recoverLP(ctx.player,500); },
  afterResolve(){}
}],{type:'spell', priority:1, keep:true, forced:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onLeaveField:cxReturnedToHand}});

/* ===== 27. 連弾の魔術師
   このカードが表側で存在する限り、自分が通常魔法を発動する度に相手に400ダメージ。 ===== */
function cxOwnNormalSpell(ctx){
  const e=ctx.event||{};
  const h=locateCardAnyV4(ctx.card);
  if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
  /* v12 の sub は正規化済み。通常魔法は 'normal'。 */
  return e.player===ctx.player && e.kind==='spell' && e.sub==='normal';
}
defineUnifiedCardV4('連弾の魔術師',[{
  key:'own-normal-spell-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onActivateSuccess'],
  condition(ctx){ return cxOwnNormalSpell(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent,400); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onActivateSuccess:cxOwnNormalSpell}});

/* =====================================================================
   このバッチで SKIP した4枚（いずれも ENGINE_GAP のまま）
   ---------------------------------------------------------------------
   首領亀      … 「任意の枚数」= 1回の解決で API.specialSummon を複数回呼ぶ。
                 おジャマ・レッドと同じ理由（Action外の onSpecialSummon queue）で
                 per-action digest が一致しない。
   ビッグバンガール … 「自分のライフポイントが回復する度に」。onLPChange は EVENTS に
                 名前だけあり、engine のどこからも emit されていない。
   油断大敵     … 「相手のライフポイントが回復した時」。同じく onLPChange 未 emit。
   幻獣クロスウィング … 「このカードが墓地に存在する限り」の継続効果。
                 continuousSources() は sz / field / mz しか集めず、
                 墓地を継続効果のソースにできない。
   ===================================================================== */
