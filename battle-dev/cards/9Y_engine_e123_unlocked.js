/* E1/E2/E3 で解禁されたカード。engine 修正そのものは engine 側で完了済み。
   ここは cards/ だけで書ける形に落としたもの。
   カード登録の第1引数は必ず文字列リテラル。 */

/* ===== E3: 幻獣クロスウィング
   「このカードが墓地に存在する限り、フィールド上の「幻獣」と名のついた
     モンスターの攻撃力は300ポイントアップする。」
   「幻獣」は P4 の PHANTOM_BEAST 群。名前の部分一致は使わない。
   continuous.from に 'grave' を明示した場合だけ墓地がソースになる（System v29）。 ===== */
defineScript('幻獣クロスウィング',{type:'monster',priority:1,
  continuous:{scope:'allMonsters', from:['grave'],
    apply(card,self){
      const sh=locateCardAnyV4(self);
      if(!sh||sh.zone!=='grave') return null;
      const db=dbOf(card);
      if(db.k!=='m') return null;
      return isCardInGroupV4(db, GROUP.PHANTOM_BEAST) ? {atk:300} : null;}}});

/* =====================================================================
   E1 について — engine 変更はしていない。
   「1回の効果解決で複数体を特殊召喚すると Replay digest がずれる」という
   前回の報告は誤りだった。engine には既に RESOLUTION_SUMMON_BATCH_V2 があり、
   チェーンリンク解決中は queueSpecialSummonSuccessV2 が gameState ではなく
   モジュール側の配列へ溜め、解決後に「同時特殊召喚」1イベントとして流す。
   したがって Action と Action の間で deferredEvents は動かず digest は一致する。
   前回ずれたのは、テストが operation() を解決経路の外から直接呼び、
   batch が開いていなかったため。カード側の書き方はそのままでよい。
   ===================================================================== */

/* 手札から複数体を順に特殊召喚する共通の継続。ゾーンの空きを毎回見る。 */
API.registerChoiceHandler('e123.summon-many-from-hand',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    if(!hasMonsterZoneSpace(args.player)) break;
    const h=locateCardAnyV4(picked.card);
    if(h&&h.p===args.player&&h.zone==='hand')
      API.specialSummon(args.player,'hand',h.index,args.pos||'atk',args.reason);
  }
});
/* 手札の候補と、実際に呼べる上限（宣言上限・候補数・ゾーンの空きの最小） */
function e123HandPool(p,f){ return API.pileCards(p,'hand',x=>x.db.k==='m'&&f(x)); }
function e123Room(p){ return Math.max(0, ZONE_LIMITS.mz - gameState.players[p].mz.length); }

/* ===== E1-1. おジャマ・レッド
   「このカードが召喚に成功した時、手札から「おジャマ」と名のついたモンスターを
     4体まで自分フィールド上に攻撃表示で特殊召喚する事ができる。」 ===== */
function e123OjamaInHand(p){
  return e123HandPool(p,x=>isSetCardV4(x.db,SETCODE.OJAMA));
}
defineUnifiedCardV4('おジャマ・レッド',[{
  key:'summon-many-ojama', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onNormalSummon'],
  condition(ctx){
    return caSummonedSelf(ctx) && e123Room(ctx.player)>0
      && e123OjamaInHand(ctx.player).length>0;},
  operation(ctx){
    const pool=e123OjamaInHand(ctx.player);
    const max=Math.min(4,pool.length,e123Room(ctx.player));
    if(max<=0) return;
    v49P1Open(ctx,{kind:'card',title:'おジャマ・レッド：特殊召喚する「おジャマ」（4体まで）',
      candidates:pool,min:0,max:max},'e123.summon-many-from-hand',
      {reason:'おジャマ・レッド',pos:'atk'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, includesSpecialSummon:true,
    passive:{onNormalSummon:ctx=>caSummonedSelf(ctx)&&e123Room(ctx.player)>0
      &&e123OjamaInHand(ctx.player).length>0}});

/* ===== E1-2. 首領亀
   「このカードが召喚・反転召喚に成功した時、自分の手札から「首領亀」を
     任意の枚数特殊召喚する事ができる。」 ===== */
function e123TurtleInHand(p){
  const ref=dbOf({id:findCardIndex('首領亀')});
  return e123HandPool(p,x=>sameCanonicalCardV4(x.db,ref));
}
defineUnifiedCardV4('首領亀',[{
  key:'summon-any-number-self', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onNormalSummon','onFlip'],
  condition(ctx){
    return caSummonedSelf(ctx) && e123Room(ctx.player)>0
      && e123TurtleInHand(ctx.player).length>0;},
  operation(ctx){
    const pool=e123TurtleInHand(ctx.player);
    const max=Math.min(pool.length,e123Room(ctx.player));
    if(max<=0) return;
    v49P1Open(ctx,{kind:'card',title:'首領亀：特殊召喚する「首領亀」（任意の枚数）',
      candidates:pool,min:0,max:max},'e123.summon-many-from-hand',
      {reason:'首領亀',pos:'atk'},false);},
  afterResolve(){}
}],{type:'monster', priority:1, includesSpecialSummon:true,
    passive:{onNormalSummon:ctx=>caSummonedSelf(ctx)&&e123Room(ctx.player)>0
        &&e123TurtleInHand(ctx.player).length>0,
      onFlip:ctx=>caSummonedSelf(ctx)&&e123Room(ctx.player)>0
        &&e123TurtleInHand(ctx.player).length>0}});

/* ===== E2-1. ビッグバンガール
   「このカードがフィールド上に表側表示で存在する限り、
     自分のライフポイントが回復する度に、相手ライフに500ポイントダメージを与える。」
   System v28 の onLPChange を使う。delta>0（＝実際に回復した）時だけ反応する。 ===== */
function e123OwnLpRecovered(ctx){
  const e=ctx.event||{};
  const h=locateCardAnyV4(ctx.card);
  if(!h||h.zone!=='mz'||h.card.face!=='up') return false;
  return e.player===ctx.player && Number(e.delta)>0;
}
defineUnifiedCardV4('ビッグバンガール',[{
  key:'own-lp-recover-burn', type:EFFECT_TYPE.TRIGGER, range:LOCATION.MZONE,
  speed:1, events:['onLPChange'],
  condition(ctx){ return e123OwnLpRecovered(ctx); },
  operation(ctx){ API.damageLP(ctx.opponent,500); },
  afterResolve(){}
}],{type:'monster', priority:1, forced:true,
    passive:{onLPChange:e123OwnLpRecovered}});

/* ===== E2-2. 油断大敵（通常罠）
   「相手のライフポイントが回復した時に発動する事ができる。
     相手フィールド上に存在するモンスター1体を選択して破壊する。」 ===== */
function e123FoeLpRecovered(ctx){
  const e=ctx.event||{};
  return e.player===ctx.opponent && Number(e.delta)>0;
}
defineUnifiedCardV4('油断大敵',[{
  key:'foe-lp-recover-destroy', type:EFFECT_TYPE.ACTIVATE, range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE, targetSide:'opponent', speed:2, events:['onLPChange'],
  condition(ctx){
    if(!e123FoeLpRecovered(ctx)) return false;
    if(!API.fieldCards({player:ctx.opponent,zone:'mz'}).length){
      ctx.reason='相手フィールドにモンスターがいません'; return false; }
    return true;},
  target(ctx,done){
    API.selectCard('油断大敵：破壊する相手モンスター',
      API.fieldCards({player:ctx.opponent,zone:'mz'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&ctx.selectedTargets[0];
    const h=t&&resolveTarget(t);
    if(h&&h.zone==='mz') API.destroy(h,'油断大敵');},
  afterResolve(){}
}],{type:'trap', priority:2, targets:true,
    passive:{onLPChange(ctx){
      return e123FoeLpRecovered(ctx)
        && API.fieldCards({player:ctx.opponent,zone:'mz'}).length>0;}}});
