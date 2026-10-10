/* P23 materialFilter で解禁されたカード。
   アドバンス召喚の素材制限は normalSummonProcedure.methods[].materialFilter で
   宣言するだけにする。独自の tribute picker も召喚UIも作らない。

   素材条件の authority:
     アーキタイプ … P4 の SETCODE / isSetCardV4（カード名の部分一致は使わない）
     種族・属性   … v17 の現在値（currentRaceV17 / currentAttributeV17）
   「ワーム」と名のついた爬虫類族 = SETCODE.WORM ∧ 現在の種族が爬虫類、の AND。

   トラファスフィア と 死王リッチーロード は今回見送り（末尾に理由）。 */

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v23At(card){ return locateCardAnyV4(card); }
/* 「ワーム」と名のついた爬虫類族モンスター */
function v23IsWormReptile(handle){
  if(!handle || !handle.card) return false;
  const db = handle.db || dbOf(handle.card);
  if(db.k !== 'm') return false;
  return isSetCardV4(db, SETCODE.WORM) && currentRaceV17(handle.card) === '爬虫類';
}
/* 自分フィールドの「ワーム」爬虫類族 */
function v23OwnWormReptiles(p){
  return API.fieldCards({player:p, zone:'mz', filter:x=>x.card.face==='up' && v23IsWormReptile(x)});
}

/* =====================================================================
   1. ソーラー・ジェネクス
   「ジェネクス」1体をリリースして召喚できる。
   自分フィールドの表側「ジェネクス」が墓地へ送られた時、相手に500ダメージ。
   ===================================================================== */
defineUnifiedCardV4('ソーラー・ジェネクス',[{
  key:'burn-when-own-genex-to-grave',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onLeaveField'],
  condition(ctx){
    const h=v23At(ctx.card), e=ctx.event||{};
    /* このカード自身が場に残っている間だけ働く。
       自身が墓地へ行った場合はもう適用されない。 */
    if(!h || h.zone!=='mz' || h.card.face!=='up') return false;
    if(e.player!==ctx.player || e.fromZone!=='mz') return false;
    if(e.fromFace!=='up' || e.toZone!=='grave') return false;
    const gone=findCardByUid(e.uid);
    if(!gone || !gone.card) return false;
    return isSetCardV4(dbOf(gone.card), SETCODE.GENEX);},
  operation(ctx){ API.damageLP(ctx.opponent,500); },
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
  normalSummonProcedure:{includeStandard:true,methods:[
    {id:'genexTribute1',tributes:1,modes:['summon'],
     summonLabel:'「ジェネクス」1体をリリースして召喚',
     materialFilter(c){ return isSetCardV4(c.db, SETCODE.GENEX); }}]},
  passive:{onLeaveField(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}});

/* =====================================================================
   2. ワーム・キング
   「ワーム」爬虫類族1体をリリースして表側攻撃表示でアドバンス召喚できる。
   自分の「ワーム」爬虫類族1体をリリースして、相手のカード1枚を選択して破壊。
   ===================================================================== */
defineUnifiedCardV4('ワーム・キング',[{
  key:'tribute-worm-destroy',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){
    const h=v23At(ctx.card);
    if(!h||h.zone!=='mz'||h.card.face!=='up'){
      ctx.reason='表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(!v23OwnWormReptiles(ctx.player).length){
      ctx.reason='リリースできる「ワーム」爬虫類族がいません'; return false; }
    return v23OpponentCards(ctx.opponent).length>0;},
  cost(ctx,done){
    const pool=v23OwnWormReptiles(ctx.player);
    if(!pool.length){ done(false); return; }
    API.selectCard('ワーム・キング：リリースする「ワーム」爬虫類族',pool,t=>{
      const h=resolveTarget(t);
      if(!h){ done(false); return; }
      API.sendToGrave(h,'ワーム・キング（コスト）');
      done(true);});},
  target(ctx,done){
    API.selectCard('ワーム・キング：破壊する相手のカード',v23OpponentCards(ctx.opponent),
      t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(h) API.destroy(h,'ワーム・キング');},
  afterResolve(){}
}],{type:'monster',priority:1,targets:true,timing:['mainPhase'],
  normalSummonProcedure:{includeStandard:true,methods:[
    {id:'wormTribute1',tributes:1,modes:['summon'],
     summonLabel:'「ワーム」爬虫類族1体をリリースして召喚',
     materialFilter(c){ return v23IsWormReptile(c); }}]}});
function v23OpponentCards(foe){
  return API.fieldCards({player:foe,zone:'mz'})
    .concat(API.fieldCards({player:foe,zone:'sz'}))
    .concat(API.fieldCards({player:foe,zone:'field'}));
}

/* =====================================================================
   3. ワーム・クィーン
   召喚手順は同じ。1ターンに1度、「ワーム」爬虫類族1体をリリースして、
   そのレベル以下の「ワーム」爬虫類族1体をデッキから特殊召喚する。
   ===================================================================== */
defineUnifiedCardV4('ワーム・クィーン',[{
  key:'tribute-worm-summon-from-deck',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,
  speed:1,events:['activate'],
  condition(ctx){
    const h=v23At(ctx.card);
    if(!h||h.zone!=='mz'||h.card.face!=='up'){
      ctx.reason='表側表示でモンスターゾーンに存在する必要があります'; return false; }
    if(ctx.card.v23QueenTurn===gameState.turn){
      ctx.reason='このターンは既に使用しています'; return false; }
    if(!v23OwnWormReptiles(ctx.player).length){
      ctx.reason='リリースできる「ワーム」爬虫類族がいません'; return false; }
    return v23DeckWormReptiles(ctx.player).length>0;},
  cost(ctx,done){
    const pool=v23OwnWormReptiles(ctx.player);
    if(!pool.length){ done(false); return; }
    ensureCardUid(gameState,ctx.card);
    API.selectCard('ワーム・クィーン：リリースする「ワーム」爬虫類族',pool,t=>{
      const h=resolveTarget(t);
      if(!h){ done(false); return; }
      /* P3: リリース前にレベルを控える。場を離れた後では読めない。 */
      API.recordCostSnapshot(h.card,['level']);
      const me=v23At(ctx.card);
      if(me) API.setCardFlag(me,'v23QueenTurn',gameState.turn,'ワーム・クィーン');
      API.sendToGrave(h,'ワーム・クィーン（コスト）');
      done(true);});},
  operation(ctx){
    const s=(API.costSnapshots(ctx)||[])[0];
    const lv=(s&&typeof s.level==='number')?s.level:0;
    if(lv<=0) return;
    const pool=v23DeckWormReptiles(ctx.player).filter(x=>(curLV(x.card)||0)<=lv);
    if(!pool.length||!hasMonsterZoneSpace(ctx.player)) return;
    v49P1Open(ctx,{kind:'card',title:'ワーム・クィーン：特殊召喚する「ワーム」爬虫類族',
      candidates:pool,min:1,max:1},
      'p1cards.special-summon',{from:'deck',pos:'atk',shuffleDeck:true,
        reason:'ワーム・クィーン'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,timing:['mainPhase'],includesSpecialSummon:true,
  normalSummonProcedure:{includeStandard:true,methods:[
    {id:'wormTribute1',tributes:1,modes:['summon'],
     summonLabel:'「ワーム」爬虫類族1体をリリースして召喚',
     materialFilter(c){ return v23IsWormReptile(c); }}]}});
function v23DeckWormReptiles(p){
  return API.pileCards(p,'deck',x=>x.db.k==='m'
    && isSetCardV4(x.db,SETCODE.WORM) && x.db.ra==='爬虫類');
}

/* =====================================================================
   4. 凛天使クイーン・オブ・ローズ
   植物族1体をリリースして表側攻撃表示でアドバンス召喚できる。
   自分のスタンバイフェイズ時に1度だけ、攻撃力が一番低いモンスター1体を破壊する。
   ===================================================================== */
defineUnifiedCardV4('凛天使クイーン・オブ・ローズ',[{
  key:'standby-destroy-lowest-atk',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,
  speed:1,events:['onStandbyPhase'],
  condition(ctx){
    const h=v23At(ctx.card);
    if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
    if(gameState.activePlayer!==ctx.player) return false;
    if(ctx.card.v23RoseTurn===gameState.turn) return false;
    return v23LowestAtkTargets().length>0;},
  operation(ctx){
    const me=v23At(ctx.card);
    if(me) API.setCardFlag(me,'v23RoseTurn',gameState.turn,'凛天使クイーン・オブ・ローズ');
    const pool=v23LowestAtkTargets();
    if(!pool.length) return;
    if(pool.length===1){ API.destroy(pool[0],'凛天使クイーン・オブ・ローズ'); return; }
    /* 攻撃力が同値で並んだ場合はコントローラーが選ぶ。 */
    v49P1Open(ctx,{kind:'card',title:'凛天使クイーン・オブ・ローズ：破壊するモンスター',
      candidates:pool,min:1,max:1},
      'p23rose.destroy-one',{reason:'凛天使クイーン・オブ・ローズ'},false);},
  afterResolve(){}
}],{type:'monster',priority:1,forced:true,
  normalSummonProcedure:{includeStandard:true,methods:[
    {id:'plantTribute1',tributes:1,modes:['summon'],
     summonLabel:'植物族1体をリリースして召喚',
     materialFilter(c){ return currentRaceV17(c.card)==='植物'; }}]},
  passive:{onStandbyPhase(ctx){return ctx.zone==='mz'&&ctx.card.face==='up';}}});
/* フィールドの表側モンスターのうち攻撃力が最小のもの（同値は全部返す） */
function v23LowestAtkTargets(){
  const all=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'});
  if(!all.length) return [];
  let min=Infinity;
  all.forEach(x=>{ const a=curATK(x.card)||0; if(a<min) min=a; });
  return all.filter(x=>(curATK(x.card)||0)===min);
}
API.registerChoiceHandler('p23rose.destroy-one',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h) API.destroy(h,args.reason);
  v49P1FinishSource(args);
});

/* =====================================================================
   今回見送り（P23 だけでは足りないもの）
   ---------------------------------------------------------------------
   トラファスフィア
     素材制限（鳥獣族）は materialFilter で書けるが、
     「罠カードの効果を受けない」は効果適用の中央地点が無いので表現できない。
     半分だけ実装して TESTED にはしない。

   死王リッチーロード
     素材制限（闇属性）は materialFilter で書けるが、
     ①「効果でリリースされ墓地へ送られた場合」は
     カード効果によるリリースを他の墓地送りと区別する provenance が要る。
     アドバンス召喚のリリースだけが p3{reason:'tribute'} を持ち、
     カード効果のリリースには刻印が無い（P25 の領域）。
   ===================================================================== */
