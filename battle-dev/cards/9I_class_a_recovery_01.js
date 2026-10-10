/* Existing-engine Class A recovery — sub-batch 1 (10 cards).
   No new primitive: P1/P1.1 choices, P3 cost snapshots, P4 identity,
   v18 LP and the existing Special Summon path only. */

function ca1rSelfHandle(ctx){ return locateCardAnyV4(ctx.card); }
function ca1rCostSnapshot(ctx){ return (API.costSnapshots(ctx)||[])[0]||null; }
function ca1rOwnFaceUp(ctx,pred){
  return API.fieldCards({player:ctx.player,zone:'mz',filter:x=>x.card.face==='up'&&(!pred||pred(x))});
}
function ca1rCommitSelfTribute(ctx,d,fields,reason){
  const h=ca1rSelfHandle(ctx); if(!h){ p11cAbort(d); return false; }
  API.recordActivationCost(ctx,'tribute',[h],fields||[],1);
  API.sendToGrave(h,reason+'（リリース）');
  p11cCommit(d,[]); return true;
}
function ca1rResolutionChoice(ctx,title,candidates,handler,args,min,max){
  if(!candidates.length) return false;
  return API.requestChoice({player:ctx.player,kind:'card',title,candidates,
    min:min==null?1:min,max:max==null?1:max,cancelable:false,
    resume:{handler,args:Object.assign({player:ctx.player},args||{})},
    meta:{scriptName:cardName(ctx.card),v4EffectKey:ctx.v4EffectKey||null}});
}

API.registerChoiceHandler('classa1.cost-commit',(answer,args)=>{
  if(answer.cancelled) return p11cAbort(args.activation);
  const q=p11cCards(answer); if(!q.length) return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'tribute','tribute',args.fields||[]);
  p11cCommit(args.activation,[]);
});
API.registerChoiceHandler('classa1.wok-cost',(answer,args)=>{
  if(answer.cancelled||!p11cCards(answer).length) return p11cAbort(args.activation);
  p11cRecordMove(args.activation,answer,'tribute','tribute',['atk','def']);
  p11cOpen(args.activation,{kind:'mode',title:'神秘の中華なべ：回復する数値',
    candidates:[{key:'atk',label:'攻撃力',value:'atk'},{key:'def',label:'守備力',value:'def'}],
    min:1,max:1,cancelable:false},'classa1.wok-mode',{});
});
API.registerChoiceHandler('classa1.wok-mode',(answer,args)=>{
  const mode=answer.cards&&answer.cards[0]&&answer.cards[0].value;
  if(answer.cancelled||(mode!=='atk'&&mode!=='def')) return p11cAbort(args.activation);
  p11cCommit(args.activation,[],mode);
});
API.registerChoiceHandler('classa1.special',(answer,args)=>{
  p11cCards(answer).forEach(t=>{
    const h=p11cHit(t.uid);
    if(h&&hasMonsterZoneSpace(args.player)) API.specialSummon(args.player,h.zone,h.index,args.pos||'atk',args.reason);
  });
  if(args.shuffle) API.shuffle(args.player);
});
API.registerChoiceHandler('classa1.aoi',(answer,args)=>{
  const t=p11cCards(answer)[0],h=t&&p11cHit(t.uid);
  if(h&&h.p===args.opponent&&h.zone==='hand') API.sendToGrave(h,'水霊術－「葵」');
});

/* 1103 text has no once-per-turn clause. */
defineScript('カタパルト・タートル',{type:'monster',priority:1,timing:['mainPhase'],
  condition(ctx){return ca1rOwnFaceUp(ctx).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'カタパルト・タートル：リリースするモンスター',candidates:ca1rOwnFaceUp(ctx)},'classa1.cost-commit',{fields:['atk']});},
  resolve(ctx){const s=ca1rCostSnapshot(ctx);if(s&&s.atk!=null)API.damageLP(ctx.opponent,Math.floor(Math.max(0,s.atk)/2));}});

defineScript('火霊術－「紅」',{type:'trap',priority:2,
  condition(ctx){return ca1rOwnFaceUp(ctx,x=>x.db.at==='炎').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'火霊術－「紅」：リリースする炎属性',candidates:ca1rOwnFaceUp(ctx,x=>x.db.at==='炎')},'classa1.cost-commit',{fields:['originalAtk']});},
  resolve(ctx){const s=ca1rCostSnapshot(ctx);if(s&&s.originalAtk!=null)API.damageLP(ctx.opponent,Math.max(0,s.originalAtk));}});

defineScript('サイコ・ソウル',{type:'trap',priority:2,
  condition(ctx){return ca1rOwnFaceUp(ctx,x=>x.db.ra==='サイキック').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'サイコ・ソウル：リリースするサイキック族',candidates:ca1rOwnFaceUp(ctx,x=>x.db.ra==='サイキック')},'classa1.cost-commit',{fields:['level']});},
  resolve(ctx){const s=ca1rCostSnapshot(ctx);if(s&&s.level!=null)API.recoverLP(ctx.player,Math.max(0,s.level)*300);}});

defineScript('神秘の中華なべ',{type:'spell',priority:2,
  condition(ctx){return ca1rOwnFaceUp(ctx).length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'神秘の中華なべ：リリースするモンスター',candidates:ca1rOwnFaceUp(ctx)},'classa1.wok-cost',{});},
  resolve(ctx){const s=ca1rCostSnapshot(ctx),n=s&&ctx.v4EffectKey&&s[ctx.v4EffectKey];if(n!=null)API.recoverLP(ctx.player,Math.max(0,n));}});

defineScript('炎の魔精イグニス',{type:'monster',priority:1,timing:['mainPhase'],
  condition(ctx){return ca1rOwnFaceUp(ctx,x=>x.db.at==='炎').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'炎の魔精イグニス：リリースする炎属性',candidates:ca1rOwnFaceUp(ctx,x=>x.db.at==='炎')},'classa1.cost-commit',{fields:[]});},
  resolve(ctx){const n=API.pileCards(ctx.player,'grave',x=>x.db.k==='m'&&x.db.at==='炎').length;if(n)API.damageLP(ctx.opponent,n*100);}});

defineScript('水霊術－「葵」',{type:'trap',priority:2,
  condition(ctx){return ca1rOwnFaceUp(ctx,x=>x.db.at==='水').length>0&&API.me(ctx).hand!==API.foe(ctx).hand&&API.foe(ctx).hand.length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'水霊術－「葵」：リリースする水属性',candidates:ca1rOwnFaceUp(ctx,x=>x.db.at==='水')},'classa1.cost-commit',{fields:[]});},
  resolve(ctx){const q=API.pileCards(ctx.opponent,'hand');if(!q.length)return;API.inspect(ctx.player,q,'水霊術－「葵」');ca1rResolutionChoice(ctx,'水霊術－「葵」：墓地へ送る相手の手札',q,'classa1.aoi',{opponent:ctx.opponent});}});

defineScript('超進化薬',{type:'spell',priority:1,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return ca1rOwnFaceUp(ctx,x=>x.db.ra==='爬虫類').length>0&&hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='恐竜').length>0;},
  activationV11(ctx,d){p11cOpen(d,{title:'超進化薬：リリースする爬虫類族',candidates:ca1rOwnFaceUp(ctx,x=>x.db.ra==='爬虫類')},'classa1.cost-commit',{fields:[]});},
  resolve(ctx){ca1rResolutionChoice(ctx,'超進化薬：特殊召喚する恐竜族',API.pileCards(ctx.player,'hand',x=>x.db.k==='m'&&x.db.ra==='恐竜'),'classa1.special',{reason:'超進化薬'});}});

defineScript('創世者の化身',{type:'monster',priority:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){const ref=dbOf({id:findCardIndex('創世神')});return hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'hand',x=>sameCanonicalCardV4(x.db,ref)).length>0;},
  activationV11(ctx,d){ca1rCommitSelfTribute(ctx,d,[],'創世者の化身');},
  resolve(ctx){const ref=dbOf({id:findCardIndex('創世神')});ca1rResolutionChoice(ctx,'創世者の化身：特殊召喚する創世神',API.pileCards(ctx.player,'hand',x=>sameCanonicalCardV4(x.db,ref)),'classa1.special',{reason:'創世者の化身'});}});

defineScript('大皇帝ペンギン',{type:'monster',priority:1,timing:['mainPhase'],includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return hasMonsterZoneSpace(ctx.player)&&API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.PENGUIN)&&!sameCanonicalCardV4(x.db,dbOf(ctx.card))).length>0;},
  activationV11(ctx,d){ca1rCommitSelfTribute(ctx,d,[],'大皇帝ペンギン');},
  resolve(ctx){const q=API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&isCardInGroupV4(x.db,GROUP.PENGUIN)&&!sameCanonicalCardV4(x.db,dbOf(ctx.card))),n=Math.min(2,5-API.me(ctx).mz.length,q.length);if(n>0)ca1rResolutionChoice(ctx,'大皇帝ペンギン：特殊召喚するペンギン',q,'classa1.special',{reason:'大皇帝ペンギン',shuffle:true},1,n);}});

defineScript('スワローズ・ネスト',{type:'spell',priority:2,includesSpecialSummon:true,blocksIfNoSpecialSummon:true,
  condition(ctx){return ca1rOwnFaceUp(ctx,x=>x.db.ra==='鳥獣').some(x=>API.pileCards(ctx.player,'deck',d=>d.db.k==='m'&&d.db.ra==='鳥獣'&&d.db.lv===x.db.lv).length>0);},
  activationV11(ctx,d){p11cOpen(d,{title:'スワローズ・ネスト：リリースする鳥獣族',candidates:ca1rOwnFaceUp(ctx,x=>x.db.ra==='鳥獣'&&API.pileCards(ctx.player,'deck',q=>q.db.k==='m'&&q.db.ra==='鳥獣'&&q.db.lv===x.db.lv).length>0)},'classa1.cost-commit',{fields:['level']});},
  resolve(ctx){const s=ca1rCostSnapshot(ctx);if(!s||s.level==null)return;ca1rResolutionChoice(ctx,'スワローズ・ネスト：特殊召喚する鳥獣族',API.pileCards(ctx.player,'deck',x=>x.db.k==='m'&&x.db.ra==='鳥獣'&&x.db.lv===s.level),'classa1.special',{reason:'スワローズ・ネスト',shuffle:true});}});
