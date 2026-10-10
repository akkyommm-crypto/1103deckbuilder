/* DrawEvent recovery batch — System v8 Draw event primitive で解消したカード。
   使う共通APIは onDrawCard / onAddToHand / drawnCardOf /
   drawOutsideDrawPhase / lastDraw / lastDrawCards / draw のみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* 引いたカードの実体（まだ手札にあるときだけ） */
function v8Drawn(ctx){ return API.drawnCardOf(ctx.event); }
/* 自分が引いたか */
function v8Mine(ctx){ return !!(ctx.event && ctx.event.player === ctx.player); }
/* 相手が引いたか */
function v8Foe(ctx){ return !!(ctx.event && ctx.event.player === ctx.opponent); }

/* ---- 引いたカードの中身で誘発するカード -------------------------------- */
/* 「自分のドローフェイズにドローしたカードが◯◯だった場合、見せて…」型 */
function v8DefineDrawPhaseReveal(name, pred, run, meta){
  defineUnifiedCardV4(name,[{
    key:'draw-phase-reveal',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onDrawCard'],
    condition(ctx){
      const h=v8Drawn(ctx);
      return v8Mine(ctx)&&ctx.event.normalDraw===true&&!!h&&pred(dbOf(h.card),h);},
    operation(ctx){const h=v8Drawn(ctx); if(h) run(ctx,h);},
    afterResolve(){}
  }],Object.assign({type:'spell',priority:1,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onDrawCard:ctx=>{const h=v8Drawn(ctx);
      return v8Mine(ctx)&&ctx.event.normalDraw===true&&!!h&&pred(dbOf(h.card),h);}}},meta||{}));
}

v8DefineDrawPhaseReveal('凡骨の意地',
  db=>db.k==='m'&&(db.st||[]).includes('通常'),
  ctx=>{ if(API.me(ctx).deck.length) API.draw(ctx.player,1); });

v8DefineDrawPhaseReveal('漆黒のトバリ',
  db=>db.k==='m'&&db.at==='闇',
  (ctx,h)=>{
    API.discard(ctx.player,h.index,'漆黒のトバリ',{byEffect:true,byPlayer:ctx.player});
    if(API.me(ctx).deck.length) API.draw(ctx.player,1);
  });

v8DefineDrawPhaseReveal('神速の具足',
  db=>db.k==='m'&&isCardInGroupV4(db,GROUP.SIX_SAMURAI_NAMED),
  (ctx,h)=>{
    if(h.zone==='hand'&&hasMonsterZoneSpace(ctx.player))
      API.specialSummon(ctx.player,'hand',h.index,'atk','神速の具足');
  });

defineUnifiedCardV4('光神テテュス',[{
  key:'draw-fairy-draw-again',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onDrawCard'],
  condition(ctx){
    const h=v8Drawn(ctx);
    return v8Mine(ctx)&&!!h&&dbOf(h.card).k==='m'&&dbOf(h.card).ra==='天使'
      &&API.me(ctx).deck.length>0;},
  operation(ctx){API.draw(ctx.player,1);},afterResolve(){}
}],{type:'monster',priority:1,
    passive:{onDrawCard:ctx=>{const h=v8Drawn(ctx);
      return v8Mine(ctx)&&!!h&&dbOf(h.card).k==='m'&&dbOf(h.card).ra==='天使';}}});

defineUnifiedCardV4('インフェルニティ・デーモン',[{
  key:'drawn-with-empty-hand-special-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.HAND,speed:1,events:['onDrawCard'],
  condition(ctx){
    /* 「手札が0枚の場合にこのカードをドローした時」= 引いた直後、
       このカード以外の手札が無いこと。 */
    return v8Mine(ctx)&&ctx.event.uid===ctx.card.uid
      &&API.me(ctx).hand.filter(x=>x&&x.uid!==ctx.card.uid).length===0
      &&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    const h=locateCardAnyV4(ctx.card);
    if(h&&h.zone==='hand')API.specialSummon(ctx.player,'hand',h.index,'atk','インフェルニティ・デーモン');
  },afterResolve(){}
},{
  key:'search-infernity-on-special-summon',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onSpecialSummon'],
  condition(ctx){
    return !!(ctx.event&&ctx.event.card===ctx.card)
      &&API.me(ctx).hand.length===0
      &&API.pileCards(ctx.player,'deck',x=>isSetCardV4(x.db,SETCODE.INFERNITY)).length>0;},
  operation(ctx){
    const pool=API.pileCards(ctx.player,'deck',x=>isSetCardV4(x.db,SETCODE.INFERNITY));
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'インフェルニティ・デーモン：手札に加える「インフェルニティ」',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.infernity-demon-search',args:{player:ctx.player}},
      meta:{scriptName:'インフェルニティ・デーモン'}});
  },afterResolve(){}
}],{type:'monster',priority:1,activateFrom:['hand'],includesSpecialSummon:true,
    passive:{onDrawCard:ctx=>v8Mine(ctx)&&ctx.event.uid===ctx.card.uid,
             onSpecialSummon:ctx=>!!(ctx.event&&ctx.event.card===ctx.card)}});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.infernity-demon-search',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(!h)return;
  if(h.zone==='deck')API.deckToHand(args.player,h.index,'インフェルニティ・デーモン');
  API.shuffle(args.player);
});

defineUnifiedCardV4('インフェルニティ・リローダー',[{
  key:'empty-hand-draw-and-check',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  condition(ctx){return API.me(ctx).hand.length===0&&API.me(ctx).deck.length>0;},
  operation(ctx){
    API.draw(ctx.player,1);
    /* 「この効果でドローしたカード」を直前のドロー記録から取る。 */
    const drawn=API.lastDrawCards();
    if(!drawn.length) return;
    const h=drawn[0], db=dbOf(h.card);
    if(db.k==='m') API.damageLP(ctx.opponent,(db.lv||0)*200);
    else API.damageLP(ctx.player,500);
  },afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});

defineUnifiedCardV4('フレグランス・ストーム',[{
  key:'destroy-plant-draw-chain',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&x.db.ra==='植物'}).length>0
    &&API.me(ctx).deck.length>0;},
  target(ctx,done){API.selectCard('フレグランス・ストーム：破壊する植物族',
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&x.db.k==='m'&&x.db.ra==='植物'}),
    t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(t)API.destroy(t,'フレグランス・ストーム');
    if(!API.me(ctx).deck.length) return;
    API.draw(ctx.player,1);
    const drawn=API.lastDrawCards();
    if(drawn.length&&dbOf(drawn[0].card).k==='m'&&dbOf(drawn[0].card).ra==='植物'
       &&API.me(ctx).deck.length) API.draw(ctx.player,1);
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true,destroysFieldV46:true});

defineUnifiedCardV4('悪魔の偵察者',[{
  key:'flip-opponent-draw-three-discard-spells',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onFlip'],
  condition(ctx){return !!(ctx.event&&ctx.event.card===ctx.card)&&API.foe(ctx).deck.length>0;},
  operation(ctx){
    API.draw(ctx.opponent,3);
    /* 「この効果でドローしたカード」の中から魔法カードだけを捨てる。 */
    API.lastDrawCards().slice().forEach(h=>{
      const cur=locateCardAnyV4(h.card);
      if(cur&&cur.zone==='hand'&&dbOf(cur.card).k==='s')
        API.discard(ctx.opponent,cur.index,'悪魔の偵察者',{byEffect:true,byPlayer:ctx.player});
    });
  },afterResolve(){}
}],{type:'monster',priority:1,forced:true,
    passive:{onFlip:ctx=>!!(ctx.event&&ctx.event.card===ctx.card)}});

/* ---- 相手のドローに反応するカード -------------------------------------- */
defineUnifiedCardV4('はたき落とし',[{
  key:'discard-normal-drawn-card',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onDrawCard'],
  condition(ctx){
    const h=v8Drawn(ctx);
    return v8Foe(ctx)&&ctx.event.normalDraw===true&&!!h;},
  operation(ctx){
    const h=v8Drawn(ctx);
    if(h&&h.zone==='hand')
      API.discard(ctx.opponent,h.index,'はたき落とし',{byEffect:true,byPlayer:ctx.player});
  },afterResolve(){}
}],{type:'trap',priority:2,
    passive:{onDrawCard:ctx=>v8Foe(ctx)&&ctx.event.normalDraw===true&&!!v8Drawn(ctx)}});

defineUnifiedCardV4('ナチュル・ラグウィード',[{
  key:'foe-extra-draw-response',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:2,events:['onDrawCard'],
  condition(ctx){
    return v8Foe(ctx)&&API.drawOutsideDrawPhase(ctx.event)&&API.me(ctx).deck.length>0;},
  cost(ctx,done){
    const h=locateCardAnyV4(ctx.card);
    if(!h||h.zone!=='mz'){done(false);return;}
    API.sendToGrave(h,'ナチュル・ラグウィード（コスト）');done(true);},
  operation(ctx){API.draw(ctx.player,2);},afterResolve(){}
}],{type:'monster',priority:2,
    passive:{onDrawCard:ctx=>v8Foe(ctx)&&API.drawOutsideDrawPhase(ctx.event)}});

defineUnifiedCardV4('便乗',[{
  key:'foe-extra-draw-piggyback',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:2,events:['onDrawCard'],
  condition(ctx){
    return v8Foe(ctx)&&API.drawOutsideDrawPhase(ctx.event)&&API.me(ctx).deck.length>0;},
  operation(ctx){API.draw(ctx.player,2);},afterResolve(){}
}],{type:'trap',priority:2,keep:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onDrawCard:ctx=>v8Foe(ctx)&&API.drawOutsideDrawPhase(ctx.event)}});

defineUnifiedCardV4('神の恵み',[{
  key:'heal-on-each-own-draw',type:EFFECT_TYPE.TRIGGER,range:LOCATION.SZONE,speed:1,events:['onDrawCard'],
  condition(ctx){return v8Mine(ctx);},
  operation(ctx){API.recoverLP(ctx.player,500);},afterResolve(){}
}],{type:'trap',priority:1,forced:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onDrawCard:ctx=>v8Mine(ctx)}});

/* ---- サーチ（デッキから手札に加わった時） ------------------------------ */
defineUnifiedCardV4('レアル・ジェネクス・アクセラレーター',[{
  key:'special-summon-searched-genex',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onAddToHand'],
  condition(ctx){
    const e=ctx.event;
    if(!e||e.player!==ctx.player||e.from!=='deck') return false;
    const h=(e.uid!=null)?findCardByUid(e.uid):null;
    return !!h&&h.zone==='hand'&&dbOf(h.card).k==='m'
      &&isCardInGroupV4(dbOf(h.card),GROUP.GENEX)&&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    const e=ctx.event;
    const h=(e&&e.uid!=null)?findCardByUid(e.uid):null;
    if(h&&h.zone==='hand')
      API.specialSummon(ctx.player,'hand',h.index,'atk','レアル・ジェネクス・アクセラレーター');
  },afterResolve(){}
}],{type:'monster',priority:1,includesSpecialSummon:true,
    passive:{onAddToHand:ctx=>{const e=ctx.event;
      if(!e||e.player!==ctx.player||e.from!=='deck') return false;
      const h=(e.uid!=null)?findCardByUid(e.uid):null;
      return !!h&&h.zone==='hand'&&dbOf(h.card).k==='m'&&isCardInGroupV4(dbOf(h.card),GROUP.GENEX);}}});
