/* LeaveField recovery batch — System v9 の離脱イベントと生存リンクで解消したカード。
   使う共通APIは onLeaveField / linkOnLeave / linkMutual / clearLink /
   linkState / leavingCardOf / leftOwnField と既存APIのみ。
   カード名で分岐する処理は共通engineに書かない。 */

/* 自分の墓地／除外から条件に合うモンスターを拾う */
function v9GravePool(ctx,f){ return API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&(!f||f(x))); }
function v9BanishPool(ctx,f){ return API.pileCards(ctx.player,'banish',x=>x.db.k==='m'&&(!f||f(x))); }
function v9HandDeckPool(ctx,f){
  return API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&(!f||f(x)))
    .concat(API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&(!f||f(x))));
}
/* 特殊召喚してから、このカードと相互リンクを張る共通処理 */
function v9SummonAndLink(ctx,handle,pos,label,spec){
  if(!handle||!hasMonsterZoneSpace(ctx.player)) return null;
  const from=handle.zone, idx=handle.index;
  if(from!=='grave'&&from!=='banish'&&from!=='hand'&&from!=='deck') return null;
  API.specialSummon(ctx.player,from,idx,pos||'atk',label);
  const now=findCardByUid(handle.card&&handle.card.uid);
  const self=locateCardAnyV4(ctx.card);
  if(!now||now.zone!=='mz'||!self) return null;
  if(spec&&spec.oneWay) API.linkOnLeave(now,self,spec.monsterOnGone||'destroy',label);
  else API.linkMutual(self,now,{aOnGone:(spec&&spec.selfOnGone)||'destroy',
                                bOnGone:(spec&&spec.monsterOnGone)||'destroy',label});
  return now;
}

/* ---- 蘇生／帰還 + 相互リンク（同一形状のファクトリ） -------------------- */
function v9DefineReviveLink(name,opts){
  defineUnifiedCardV4(name,[{
    key:'revive-and-link',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
    targetRange:opts.zone==='banish'?LOCATION.REMOVED:LOCATION.GRAVE,targetSide:'self',
    speed:opts.speed||2,events:['activate'],
    condition(ctx){return opts.pool(ctx).length>0&&hasMonsterZoneSpace(ctx.player)
      &&(!opts.extraCond||opts.extraCond(ctx));},
    cost:opts.cost,
    target(ctx,done){API.selectCard(name+'：特殊召喚するモンスター',opts.pool(ctx),t=>done([t]));},
    operation(ctx){
      const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
      v9SummonAndLink(ctx,t,opts.pos||'atk',name,opts.link||{});
    },afterResolve(){}
  }],{type:opts.type||'trap',priority:opts.speed||2,targets:true,includesSpecialSummon:true,
      continuous:{scope:'self',from:['sz'],apply(){return null;}}});
}

v9DefineReviveLink('エンジェル・リフト',{
  pool:ctx=>v9GravePool(ctx,x=>(x.db.lv||99)<=2), zone:'grave'});
v9DefineReviveLink('正統なる血統',{
  pool:ctx=>v9GravePool(ctx,x=>(x.db.st||[]).includes('通常')), zone:'grave'});
v9DefineReviveLink('蘇りし魂',{
  pool:ctx=>v9GravePool(ctx,x=>(x.db.st||[]).includes('通常')), zone:'grave', pos:'def'});
v9DefineReviveLink('ブレインハザード',{
  pool:ctx=>v9BanishPool(ctx,x=>x.db.ra==='サイキック'), zone:'banish'});
v9DefineReviveLink('化石岩の解放',{
  pool:ctx=>v9BanishPool(ctx,x=>x.db.ra==='岩石'), zone:'banish'});
v9DefineReviveLink('奇跡の光臨',{
  pool:ctx=>v9BanishPool(ctx,x=>x.db.ra==='天使'), zone:'banish'});
/* 闇次元の解放は「このカードが離れたらそのモンスターは破壊され除外される」 */
v9DefineReviveLink('闇次元の解放',{
  pool:ctx=>v9BanishPool(ctx,x=>x.db.at==='闇'), zone:'banish',
  link:{selfOnGone:'destroy',monsterOnGone:'destroyBanish'}});

defineUnifiedCardV4('携帯型バッテリー',[{
  key:'revive-two-batterymen',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.GRAVE,targetSide:'self',speed:2,events:['activate'],
  condition(ctx){return v9GravePool(ctx,x=>isSetCardV4(x.db,SETCODE.BATTERYMAN)).length>=2
    &&hasMonsterZoneSpace(ctx.player);},
  operation(ctx){
    for(let i=0;i<2;i++){
      const pool=v9GravePool(ctx,x=>isSetCardV4(x.db,SETCODE.BATTERYMAN));
      if(!pool.length||!hasMonsterZoneSpace(ctx.player)) break;
      const h=resolveTarget(pool[0]);
      v9SummonAndLink(ctx,h,'atk','携帯型バッテリー',{});
    }
  },afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

defineUnifiedCardV4('ヒステリック・パーティー',[{
  key:'revive-harpies',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(ctx){return API.me(ctx).hand.length>0&&hasMonsterZoneSpace(ctx.player)
    &&v9GravePool(ctx,x=>sameCanonicalCardV4(x.db,dbOf({id:findCardIndex('ハーピィ・レディ')}))).length>0;},
  cost(ctx,done){API.selectCard('ヒステリック・パーティー：捨てる手札',API.pileCards(ctx.player,'hand'),t=>{
    const h=resolveTarget(t);
    if(h)API.discard(ctx.player,h.index,'ヒステリック・パーティー（コスト）',{byEffect:false});
    done(!!h);});},
  operation(ctx){
    /* 「可能な限り特殊召喚」。この効果で出したモンスターだけをリンクする。 */
    for(let i=0;i<5;i++){
      const pool=v9GravePool(ctx,x=>sameCanonicalCardV4(x.db,dbOf({id:findCardIndex('ハーピィ・レディ')})));
      if(!pool.length||!hasMonsterZoneSpace(ctx.player)) break;
      const h=resolveTarget(pool[0]);
      if(!v9SummonAndLink(ctx,h,'atk','ヒステリック・パーティー',{oneWay:true})) break;
    }
  },afterResolve(){}
}],{type:'trap',priority:2,includesSpecialSummon:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

defineUnifiedCardV4('超栄養太陽',[{
  key:'tribute-plant-summon-bigger',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&x.db.k==='m'&&x.db.ra==='植物'&&(x.db.lv||99)<=2}).length>0;},
  cost(ctx,done){
    const pool=API.fieldCards({player:ctx.player,zone:'mz',
      filter:x=>x.card.face==='up'&&x.db.k==='m'&&x.db.ra==='植物'&&(x.db.lv||99)<=2});
    if(!pool.length){done(false);return;}
    API.selectCard('超栄養太陽：リリースする植物族',pool,t=>{
      const h=resolveTarget(t);
      if(!h){done(false);return;}
      const self=locateCardAnyV4(ctx.card);
      if(self)API.setCardFlag(self,'v9SunLevel',(dbOf(h.card).lv||0)+3,'超栄養太陽');
      API.sendToGrave(h,'超栄養太陽（リリース）');done(true);});},
  operation(ctx){
    const cap=Number(ctx.card&&ctx.card.v9SunLevel)||0;
    const pool=v9HandDeckPool(ctx,x=>x.db.ra==='植物'&&(x.db.lv||99)<=cap);
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'超栄養太陽：特殊召喚する植物族',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.super-solar-nutrient-summon',args:{player:ctx.player,sourceUid:ctx.card&&ctx.card.uid!=null?ctx.card.uid:null}},
      meta:{scriptName:'超栄養太陽'}});
  },afterResolve(){}
}],{type:'spell',priority:1,includesSpecialSummon:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。
   v9SummonAndLink はソースカードのハンドルを必要とするため、resume引数のUIDから引き直す。 */
API.registerChoiceHandler('s03u62.super-solar-nutrient-summon',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  const src=args.sourceUid!=null?findCardByUid(args.sourceUid):null;
  if(!src||!src.card)return;
  const ctx={player:args.player,card:src.card};
  v9SummonAndLink(ctx,h,'atk','超栄養太陽',{});
  API.shuffle(args.player);
});

defineUnifiedCardV4('魂の共有－コモンソウル',[{
  key:'summon-neospacian-share-atk',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:1,events:['activate'],
  condition(ctx){return API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}).length>0
    &&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.N_NEOSPACIAN)).length>0;},
  target(ctx,done){API.selectCard('魂の共有－コモンソウル：対象のモンスター',
    API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t) return;
    const pool=API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.N_NEOSPACIAN));
    if(!pool.length||!hasMonsterZoneSpace(t.p)) return;
    const h=resolveTarget(pool[0]);
    if(!h||h.zone!=='hand') return;
    API.specialSummon(t.p,'hand',h.index,'atk','魂の共有－コモンソウル',ctx.player);
    const now=findCardByUid(h.card.uid);
    if(!now) return;
    API.modAtk(t,API.curAtk(now),0,'permanent','魂の共有－コモンソウル');
    /* このカードが離れたら、この効果で出した「N」を手札に戻す */
    const self=locateCardAnyV4(ctx.card);
    if(self)API.linkOnLeave(now,self,'toHand','魂の共有－コモンソウル');
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true,includesSpecialSummon:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

/* ---- 選択した相手と相互リンク ------------------------------------------- */
defineUnifiedCardV4('グレイモヤ不発弾',[{
  key:'link-two-attack-monsters',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'both',speed:2,events:['activate'],
  condition(){return API.fieldCards({zone:'mz',
    filter:x=>x.card.face==='up'&&x.card.pos==='atk'}).length>=2;},
  operation(ctx){
    const self=locateCardAnyV4(ctx.card); if(!self) return;
    const pool=API.fieldCards({zone:'mz',filter:x=>x.card.face==='up'&&x.card.pos==='atk'});
    pool.slice(0,2).forEach(t=>{
      const h=resolveTarget(t);
      if(h&&h.card)API.linkMutual(self,h,{label:'グレイモヤ不発弾'});
    });
  },afterResolve(){}
}],{type:'trap',priority:2,destroysFieldV46:true,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});

defineUnifiedCardV4('鉄壁の布陣',[{
  key:'defense-boost-linked',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,
  targetRange:LOCATION.MZONE,targetSide:'self',speed:1,events:['activate'],
  condition(ctx){return API.fieldCards({player:ctx.player,zone:'mz'}).length>0;},
  target(ctx,done){API.selectCard('鉄壁の布陣：対象のモンスター',
    API.fieldCards({player:ctx.player,zone:'mz'}),t=>done([t]));},
  operation(ctx){
    const t=ctx.selectedTargets&&resolveTarget(ctx.selectedTargets[0]);
    if(!t||!t.card) return;
    const self=locateCardAnyV4(ctx.card);
    if(self)API.setCardFlag(self,'v9BastionUid',ensureCardUid(gameState,t.card),'鉄壁の布陣');
    /* 選択したモンスターが離れたらこのカードを破壊する（片方向） */
    if(self)API.linkOnLeave(self,t,'destroy','鉄壁の布陣');
  },afterResolve(){}
}],{type:'spell',priority:1,targets:true,
    continuous:{scope:'ownMonsters',from:['sz'],apply(card,self){
      if(!self.v9BastionUid||card.uid!==self.v9BastionUid) return null;
      const mine=API.fieldCards({player:locateCardAnyV4(self)?locateCardAnyV4(self).p:0,zone:'mz'});
      if(mine.length<2||!mine.every(x=>x.card.pos==='def')) return null;
      return {def:700};
    }}});

defineUnifiedCardV4('光のピラミッド',[{
  key:'link-sphinxes',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:1,events:['activate'],
  condition(ctx){return v9SphinxOnField(ctx).length>0;},
  operation(ctx){
    const self=locateCardAnyV4(ctx.card); if(!self) return;
    v9SphinxOnField(ctx).forEach(t=>{
      const h=resolveTarget(t);
      if(h)API.linkOnLeave(h,self,'destroyBanish','光のピラミッド');
    });
  },afterResolve(){}
}],{type:'trap',priority:1,
    continuous:{scope:'self',from:['sz'],apply(){return null;}}});
function v9SphinxOnField(ctx){
  const a=dbOf({id:findCardIndex('アンドロ・スフィンクス')});
  const b=dbOf({id:findCardIndex('スフィンクス・テーレイア')});
  return API.fieldCards({player:ctx.player,zone:'mz',
    filter:x=>x.card.face==='up'&&(sameCanonicalCardV4(x.db,a)||sameCanonicalCardV4(x.db,b))});
}

/* ---- 離脱イベントで誘発するカード --------------------------------------- */
defineUnifiedCardV4('D－タイム',[{
  key:'hero-left-field-search-dhero',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['onLeaveField'],
  condition(ctx){
    const h=API.leavingCardOf(ctx.event);
    return API.leftOwnField(ctx.event,ctx.player)&&!!h&&dbOf(h.card).k==='m'
      &&isSetCardV4(dbOf(h.card),SETCODE.ELEMENTAL_HERO)
      &&API.pileCards(ctx.player,'deck',x=>x.db.k==='m'
          &&isSetCardV4(x.db,SETCODE.DESTINY_HERO)
          &&(x.db.lv||99)<=(dbOf(h.card).lv||0)).length>0;},
  operation(ctx){
    const h=API.leavingCardOf(ctx.event); if(!h) return;
    const cap=dbOf(h.card).lv||0;
    const pool=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'
      &&isSetCardV4(x.db,SETCODE.DESTINY_HERO)&&(x.db.lv||99)<=cap);
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'D－タイム：手札に加える「D－HERO」',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.d-time-search',args:{player:ctx.player}},
      meta:{scriptName:'D－タイム'}});
  },afterResolve(){}
}],{type:'trap',priority:2});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.d-time-search',(answer,args)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(!h)return;
  if(h.zone==='deck')API.deckToHand(args.player,h.index,'D－タイム');
  API.shuffle(args.player);
});

defineUnifiedCardV4('マインフィールド',[{
  key:'self-left-field-recover-field-spell',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onLeaveField'],
  condition(ctx){
    return !!(ctx.event&&ctx.card&&ctx.event.uid===ctx.card.uid&&ctx.event.fromFace==='up')
      &&API.pileCards(ctx.player,'grave',x=>x.db.k==='s'&&x.db.sub==='フィールド').length>0;},
  operation(ctx){
    const pool=API.pileCards(ctx.player,'grave',x=>x.db.k==='s'&&x.db.sub==='フィールド');
    if(!pool.length) return;
    API.requestChoice({player:ctx.player,kind:'card',title:'マインフィールド：手札に加えるフィールド魔法',
      candidates:pool,min:1,max:1,cancelable:true,
      resume:{handler:'s03u62.minefield-return',args:{}},
      meta:{scriptName:'マインフィールド'}});
  },afterResolve(){}
}],{type:'monster',priority:1,activateFrom:['grave'],targets:true,
    passive:{onLeaveField:ctx=>!!(ctx.event&&ctx.card&&ctx.event.uid===ctx.card.uid&&ctx.event.fromFace==='up')}});
/* S03-U62: operation() 内の legacy API.selectCard を SaveLoad安全な登録済みハンドラへ移行。 */
API.registerChoiceHandler('s03u62.minefield-return',(answer)=>{
  const picks=v49P1ChoiceCards(answer);
  const h=picks[0]&&locateCardAnyV4(picks[0].card);
  if(h)API.returnToHand(h,'マインフィールド');
});

defineUnifiedCardV4('女神の加護',[{
  key:'gain-3000',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  condition(){return true;},
  operation(ctx){API.recoverLP(ctx.player,3000);},afterResolve(){}
},{
  key:'lose-3000-on-leave',type:EFFECT_TYPE.TRIGGER,range:LOCATION.GRAVE,speed:1,events:['onLeaveField'],
  condition(ctx){return !!(ctx.event&&ctx.card&&ctx.event.uid===ctx.card.uid&&ctx.event.fromFace==='up');},
  operation(ctx){API.damageLP(ctx.player,3000);},afterResolve(){}
}],{type:'trap',priority:2,forced:true,activateFrom:['grave'],
    continuous:{scope:'self',from:['sz'],apply(){return null;}},
    passive:{onLeaveField:ctx=>!!(ctx.event&&ctx.card&&ctx.event.uid===ctx.card.uid&&ctx.event.fromFace==='up')}});

/* スペースタイムポリス は「除外したカードを相手フィールドにセットする」
   専用の移動処理が必要で、LeaveField primitive だけでは足りない。
   カード固有のActionを足さず ENGINE_GAP のまま残す。 */
