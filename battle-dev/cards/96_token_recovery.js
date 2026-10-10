/* Token recovery batch — System v11 のトークン identity で解消したカード。
   使う共通機構は defineTokenSpecV11 / API.createTokens / createTokenFrom /
   lastTokenCreated / tokensOf / tokenWasDestroyed / tokenDestroyedByBattle /
   goneTokenKey / goneTokenController と既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* ---- 正規のトークン定義（engine ではなくカード側が宣言する） ------------- */
defineTokenSpecV11('プラントークン',        {atk:800, def:500, lv:1, ra:'植物',   at:'地', pos:'def'});
defineTokenSpecV11('チュウボーンJr.トークン',{atk:100, def:300, lv:1, ra:'アンデット', at:'地', pos:'def'});
defineTokenSpecV11('アイヴィトークン',      {atk:0,   def:0,   lv:1, ra:'植物',   at:'地', pos:'def'});
defineTokenSpecV11('ナイトメア・デーモン・トークン',{atk:2000,def:2000,lv:6,ra:'悪魔',at:'闇',pos:'atk'});
defineTokenSpecV11('毒蛇トークン',          {atk:1200,def:1200,lv:3, ra:'爬虫類', at:'地', pos:'atk'});
defineTokenSpecV11('ニードルトークン',      {atk:500, def:500, lv:1, ra:'植物',   at:'地', pos:'def'});
defineTokenSpecV11('邪神トークン',          {atk:1000,def:1000,lv:4, ra:'悪魔',   at:'闇', pos:'atk'});
defineTokenSpecV11('ミラージュトークン',    {atk:0,   def:0,   lv:1, ra:'',       at:'',   pos:'atk'});
defineTokenSpecV11('クリボートークン',      {atk:300, def:200, lv:1, ra:'悪魔',   at:'闇', pos:'atk'});

/* ---- 共通ヘルパ --------------------------------------------------------- */
function v11Opponent(p){ return p===0?1:0; }
/* 破壊に成功した枚数を数える。場から実際に消えた分だけ数える。 */
function v11DestroyAndCount(list, reason){
  let n=0;
  list.slice().reverse().forEach(x=>{
    const h=locateCardAnyV4(x.card); if(!h) return;
    API.destroy(h,reason);
    /* 破壊に成功＝フィールドから消えた。トークンは消滅し、
       通常のカードは墓地へ行くので、ゾーンで判定する。 */
    const after=locateCardAnyV4(x.card);
    if(!after || ['mz','sz','field'].indexOf(after.zone)<0) n++;
  });
  return n;
}
/* 「そのトークンが破壊された時」の共通条件 */
function v11GoneTokenIs(ctx,key,needBattle){
  const e=ctx.event;
  if(!API.tokenWasDestroyed(e)) return false;
  if(API.goneTokenKey(e)!==key) return false;
  return needBattle ? API.tokenDestroyedByBattle(e) : true;
}
/* 自分のフィールドの植物族 */
function v11OwnFieldMonsters(ctx,f){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>!f||f(x)});
}

/* ---- 選択の継続 --------------------------------------------------------- */
API.registerChoiceHandler('p11tok.destroy-up-to',(answer,args)=>{
  for(const picked of v49P1ChoiceCards(answer)){
    const h=locateCardAnyV4(picked.card);
    if(h) API.destroy(h,args.reason);
  }
  v49P1FinishSource(args);
});
API.registerChoiceHandler('p11tok.copy-token',(answer,args)=>{
  const picked=v49P1ChoiceCards(answer)[0];
  const h=picked&&locateCardAnyV4(picked.card);
  if(h&&h.zone==='mz'){
    const uids=API.createTokenFrom(args.player,h,'ミラージュトークン',1,'ミラージュトークン');
    if(uids.length){
      API.schedule({at:'endPhase',turns:0,player:args.player,
        handler:'v7.destroyUid',args:{uid:uids[0],reason:'物理分身'},note:'物理分身'});
    }
  }
  v49P1FinishSource(args);
});

/* =====================================================================
   1. 相手フィールドにトークンを出すカード
   ===================================================================== */
/* 植物族1体をリリースし、相手フィールドにプラントークン2体 */
defineUnifiedCardV4('竹頭木屑',[{
  key:'tribute-plant-give-two-plant-tokens',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(ctx){ return v11OwnFieldMonsters(ctx,x=>x.db.ra==='植物').length>0; },
  cost(ctx,done){
    const pool=v11OwnFieldMonsters(ctx,x=>x.db.ra==='植物');
    if(!pool.length){ done(false); return; }
    API.selectCard('竹頭木屑：リリースする植物族',pool,t=>{
      const h=resolveTarget(t);
      if(h) API.sendToGrave(h,'竹頭木屑（リリース）');
      done(!!h);});},
  operation(ctx){
    API.createTokens(v11Opponent(ctx.player),'プラントークン',2,
      {p:ctx.player,zone:'sz',index:0,card:ctx.card});},
  afterResolve(){}
}],{type:'trap',priority:2});

/* リバース：相手フィールドにチュウボーンJr.トークン3体 */
defineUnifiedCardV4('チュウボーン',[{
  key:'flip-give-three-jr-tokens',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onFlip'],forced:true,
  condition(ctx){ return !!(ctx.event&&ctx.event.card===ctx.card); },
  operation(ctx){
    API.createTokens(v11Opponent(ctx.player),'チュウボーンJr.トークン',3,
      {p:ctx.player,zone:'mz',index:0,card:ctx.card});},
  afterResolve(){}
}],{type:'monster',priority:1,passive:{onFlip:()=>true}});

/* リバース：相手フィールドにアイヴィトークン1体。
   そのトークンが破壊された時、コントローラーは300ダメージ。 */
defineUnifiedCardV4('アイヴィ・ウォール',[{
  key:'flip-give-ivy-token',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onFlip'],forced:true,
  condition(ctx){ return !!(ctx.event&&ctx.event.card===ctx.card); },
  operation(ctx){
    API.createTokens(v11Opponent(ctx.player),'アイヴィトークン',1,
      {p:ctx.player,zone:'mz',index:0,card:ctx.card});},
  afterResolve(){}
},{
  key:'ivy-token-destroyed-damage',type:EFFECT_TYPE.TRIGGER,range:LOCATION.ALL,speed:1,
  events:['onLeaveField'],forced:true,
  condition(ctx){ return v11GoneTokenIs(ctx,'アイヴィトークン',false); },
  operation(ctx){
    const who=API.goneTokenController(ctx.event);
    if(who===0||who===1) API.damageLP(who,300);},
  afterResolve(){}
}],{type:'monster',priority:1,passive:{onFlip:()=>true}});

/* モンスター1体をリリースし、相手フィールドにナイトメア・デーモン・トークン3体。
   破壊された時、そのコントローラーは1体につき800ダメージ。 */
defineUnifiedCardV4('ナイトメア・デーモンズ',[{
  key:'tribute-give-three-nightmare-tokens',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['activate'],
  condition(ctx){ return v11OwnFieldMonsters(ctx).length>0; },
  cost(ctx,done){
    const pool=v11OwnFieldMonsters(ctx);
    if(!pool.length){ done(false); return; }
    API.selectCard('ナイトメア・デーモンズ：リリースするモンスター',pool,t=>{
      const h=resolveTarget(t);
      if(h) API.sendToGrave(h,'ナイトメア・デーモンズ（リリース）');
      done(!!h);});},
  operation(ctx){
    API.createTokens(v11Opponent(ctx.player),'ナイトメア・デーモン・トークン',3,
      {p:ctx.player,zone:'sz',index:0,card:ctx.card});},
  afterResolve(){}
},{
  key:'nightmare-token-destroyed-damage',type:EFFECT_TYPE.TRIGGER,range:LOCATION.ALL,speed:1,
  events:['onLeaveField'],forced:true,
  condition(ctx){ return v11GoneTokenIs(ctx,'ナイトメア・デーモン・トークン',false); },
  operation(ctx){
    const who=API.goneTokenController(ctx.event);
    if(who===0||who===1) API.damageLP(who,800);},
  afterResolve(){}
}],{type:'trap',priority:2});

/* リバース：自分フィールドに毒蛇トークン1体。
   そのトークンが戦闘で破壊された場合、相手に500ダメージ。 */
defineUnifiedCardV4('スネークポット',[{
  key:'flip-summon-venom-token',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onFlip'],forced:true,
  condition(ctx){ return !!(ctx.event&&ctx.event.card===ctx.card); },
  operation(ctx){
    API.createTokens(ctx.player,'毒蛇トークン',1,
      {p:ctx.player,zone:'mz',index:0,card:ctx.card});},
  afterResolve(){}
},{
  key:'venom-token-battle-destroyed-burn',type:EFFECT_TYPE.TRIGGER,range:LOCATION.ALL,speed:1,
  events:['onLeaveField'],forced:true,
  condition(ctx){
    if(!v11GoneTokenIs(ctx,'毒蛇トークン',true)) return false;
    /* 自分の側の毒蛇トークンだけが対象 */
    return API.goneTokenController(ctx.event)===ctx.player;},
  operation(ctx){ API.damageLP(v11Opponent(ctx.player),500); },
  afterResolve(){}
}],{type:'monster',priority:1,passive:{onFlip:()=>true}});

/* 戦闘で相手モンスターを破壊した場合、相手フィールドにニードルトークン1体 */
defineUnifiedCardV4('サボウ・ファイター',[{
  key:'battle-destroy-give-needle-token',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,
  events:['onBattleDestroy'],forced:true,
  condition(ctx){
    const lb=API.lastBattleContext();
    if(!lb||!ctx.card||ctx.card.uid==null) return false;
    /* 破壊されたのは相手の側で、攻撃したのはこのカード。 */
    return lb.attackerUid===ctx.card.uid&&!!lb.destroyedDefender
      &&!!(ctx.event&&ctx.event.uid!==ctx.card.uid);},
  operation(ctx){
    API.createTokens(v11Opponent(ctx.player),'ニードルトークン',1,
      {p:ctx.player,zone:'mz',index:0,card:ctx.card});},
  afterResolve(){}
}],{type:'monster',priority:1});

/* セットされたこのカードが破壊され墓地へ送られた時、邪神トークン1体 */
defineUnifiedCardV4('黄金の邪神像',[{
  key:'set-destroyed-summon-evil-token',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:2,
  events:['onLeaveField'],
  condition(ctx){
    const e=ctx.event||{};
    return !!(ctx.card&&e.uid===ctx.card.uid&&e.fromFace==='down'
              &&e.fromZone==='sz'&&e.byDestroy===true
              &&hasMonsterZoneSpace(ctx.player));},
  operation(ctx){ API.createTokens(ctx.player,'邪神トークン',1); },
  afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true});

/* 相手のターンのみ：相手モンスターの数値を写したミラージュトークン1体。
   ターン終了時に破壊する。 */
defineUnifiedCardV4('物理分身',[{
  key:'copy-opponent-monster-as-token',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'opponent',speed:2,events:['activate'],
  condition(ctx){
    return gameState.activePlayer!==ctx.player
      &&hasMonsterZoneSpace(ctx.player)
      &&API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}).length>0;},
  operation(ctx){
    v49P1Open(ctx,{kind:'card',title:'物理分身：写す相手モンスター',
      candidates:API.fieldCards({player:ctx.opponent,zone:'mz',filter:x=>x.card.face==='up'}),
      min:1,max:1},'p11tok.copy-token',{reason:'物理分身'},true);},
  afterResolve(){}
}],{type:'trap',priority:2,targets:true,includesSpecialSummon:true});

/* =====================================================================
   2. トークンをまとめて扱うカード
   ===================================================================== */
/* トークンが特殊召喚された時、フィールドの全トークンを破壊し ×300 ダメージ */
defineUnifiedCardV4('トークン謝肉祭',[{
  key:'token-summoned-wipe-tokens-burn',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:2,events:['onTokenSummon'],
  condition(){ return API.tokensOf().length>0; },
  operation(ctx){
    const n=v11DestroyAndCount(API.tokensOf(),'トークン謝肉祭');
    if(n>0) API.damageLP(v11Opponent(ctx.player),n*300);},
  afterResolve(){}
}],{type:'trap',priority:2});

/* 自分のトークンを全て破壊し、その数までフィールドのカードを破壊する */
defineUnifiedCardV4('トークン復活祭',[{
  key:'wipe-own-tokens-then-destroy',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return API.tokensOf(null,ctx.player).length>0; },
  operation(ctx){
    const n=v11DestroyAndCount(API.tokensOf(null,ctx.player),'トークン復活祭');
    const pool=API.fieldCards({});
    if(n<=0||!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'トークン復活祭：破壊するカード（'+n+'枚まで）',
      candidates:pool,min:0,max:Math.min(n,pool.length)},
      'p11tok.destroy-up-to',{reason:'トークン復活祭'},true);},
  afterResolve(){}
}],{type:'spell',priority:1,destroysFieldV46:true});

/* 自分の「クリボー」と「クリボートークン」を全て破壊し、
   その数まで相手フィールドのカードを破壊する */
defineUnifiedCardV4('機雷化',[{
  key:'wipe-kuriboh-then-destroy-opponent',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  speed:1,events:['activate'],
  condition(ctx){ return v11KuribohGroup(ctx).length>0; },
  operation(ctx){
    const n=v11DestroyAndCount(v11KuribohGroup(ctx),'機雷化');
    const pool=API.fieldCards({player:ctx.opponent});
    if(n<=0||!pool.length) return;
    v49P1Open(ctx,{kind:'card',title:'機雷化：破壊する相手のカード（'+n+'枚まで）',
      candidates:pool,min:0,max:Math.min(n,pool.length)},
      'p11tok.destroy-up-to',{reason:'機雷化'},true);},
  afterResolve(){}
}],{type:'spell',priority:1,destroysFieldV46:true});
/* 「クリボー」本体と「クリボートークン」をまとめて拾う */
function v11KuribohGroup(ctx){
  const kuriboh=dbOf({id:findCardIndex('クリボー')});
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>{
    if(isTokenV11(x.card)) return tokenKeyV11(x.card)==='クリボートークン';
    return sameCanonicalCardV4(x.db,kuriboh);
  }});
}

/* 暴走闘君・武闘円舞・星蝕－レベル・クライム－・人造天使・リバイバル・ギフト
   などは、戦闘破壊耐性 / レベル変動 / カウンター罠の発動イベント /
   特殊召喚したモンスターの効果無効 が別に要るため ENGINE_GAP のまま残す。 */
