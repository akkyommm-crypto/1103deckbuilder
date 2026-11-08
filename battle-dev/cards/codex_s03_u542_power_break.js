/* S03-U542 パワー・ブレイク (2011 text).
 WIKI-BFF7F463EBE8 (2010-02-21): targets 1-3 Equip Cards at activation.
 WIKI-304D13AAB7FB (2010-02-21): a lost target does not stop the others.
 WIKI-190C96FCEA8A (2010-02-21): monster/Trap Equip Cards count too.
 WIKI-336B19523906 (2010-02-21): Extra Deck returns count for damage.
 Existing P1 choice, returnToDeck and owner/Extra routing only; no Power Tool effect is assumed. */
/* S03-U480 existing dynamic target-count protocol: choose the count first,
   filter with explicit effectInfo, then commit exactly that many targets (P1.1).
   The pool registry is static card code; only the pool key/count enter saved choices. */
const EQUIP_TARGET_POOLS_U542 = {};
function u542TargetCountsS03(ctx,pool,max){
  const name=cardName(ctx.card),out=[];
  for(let n=1;n<=Math.min(max,pool.length);n++){
    const info=targetEffectSourceS03(ctx.player,{name:name,uid:ctx.card.uid,targetCount:n});
    if(filterTargetable(pool,ctx.player,info).length>=n)out.push(n);
  }
  return out;
}
function u542EquipActivationS03(ctx,d,poolKey,max){
  const counts=u542TargetCountsS03(ctx,EQUIP_TARGET_POOLS_U542[poolKey](ctx),max);
  if(!counts.length){p11cAbort(d);return;}
  p11cOpen(d,{kind:'option',title:d.name+'：対象にする枚数',
    candidates:counts.map(n=>({key:'count-'+n,label:n+'枚',value:n})),
    min:1,max:1,targeting:false,cancelable:false},'codex.u542.equip-count',{poolKey:poolKey});
}
API.registerChoiceHandler('codex.u542.equip-count',(a,x)=>{
  const d=x.activation,n=Number(a.cards&&a.cards[0]&&a.cards[0].value);
  if(a.cancelled || !targetCountAllowedS03(d.name,n)){p11cAbort(d);return;}
  const pool=EQUIP_TARGET_POOLS_U542[x.poolKey](p11cCtx(d.player));
  const opened=p11cOpen(d,{title:d.name+'：対象の装備カード（'+n+'枚）',candidates:pool,
    min:n,max:n,targeting:true,cancelable:false,
    effectInfo:targetEffectSourceS03(d.player,{name:d.name,uid:d.uid,targetCount:n})},
    'p11cards.commit-targets',{targetCount:n});
  if(!opened)p11cAbort(d);
});
function u542PowerToolS03(ctx){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'
    && currentNameV17(x.card)==='パワー・ツール・ドラゴン'}).length>0;
}
function u542EquipsS03(ctx){
  return API.fieldCards({player:ctx.player,zone:'sz',filter:x=>x.card.face==='up' && !!x.card.equipTo})
    .concat(API.pileCards(ctx.player,'grave',x=>x.db.k==='s' && x.db.sub==='装備'));
}
EQUIP_TARGET_POOLS_U542.power=u542EquipsS03;
defineUnifiedCardV4('パワー・ブレイク',[{
  key:'return-equips',type:EFFECT_TYPE.ACTIVATE,range:LOCATION.SZONE,speed:2,events:['activate'],
  targetRange:LOCATION.SZONE|LOCATION.GRAVE,targetSide:'self',
  condition(ctx){ return u542PowerToolS03(ctx) && u542TargetCountsS03(ctx,u542EquipsS03(ctx),3).length>0; },
  operation(ctx){
    let count=0; const shuffle=new Set();
    (ctx.selectedTargets||[]).forEach(t=>{
      const h=t && resolveTarget(t);
      if(!h || h.p!==ctx.player || (h.zone!=='sz' && h.zone!=='grave')) return;
      const uid=h.card.uid;
      API.returnToDeck(h,false,'パワー・ブレイク');
      const now=findCardByUid(uid);
      if(now && (now.zone==='deck'||now.zone==='ex')){ count++; if(now.zone==='deck')shuffle.add(now.p); }
    });
    shuffle.forEach(p=>API.shuffle(p));
    if(count) API.damageLP(ctx.opponent,count*500,'パワー・ブレイク');
  },afterResolve(){}
}],{type:'trap',priority:2,targets:true,targetCountRange:[1,3],
  activationV11(ctx,d){u542EquipActivationS03(ctx,d,'power',3);}});
