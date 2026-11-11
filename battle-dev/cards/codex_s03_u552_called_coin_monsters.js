/* Codex S03-U552: replay-safe called coins with the existing registered choices.
   暴れ牛鬼: WIKI-F83252A31EDB (2005-03-18), damage is uncertain until the toss;
   a damage-redirection counter cannot respond merely to its activation.
   地雷蜘蛛: historical DB has 0 additional entries. The 1103 text loses LP,
   not damage and not activation cost; the existing LP Action's unspecified
   cause bypasses damage replacement. Current official FAQ cid4373 (2020-04-01)
   confirms mandatory attack-declaration trigger and normal battle continuation;
   this later supplement does not establish a dated 2011 ruling. */
function u552SpiderAttackS03(ctx){
  const a=gameState.pendingAttack;
  return !!(ctx.zone==='mz' && ctx.card.face==='up' && a && a.attackerUid===ctx.card.uid);
}
function u552CallS03(ctx,kind){
  const name=cardName(ctx.card);
  API.requestChoice({player:ctx.player,kind:'option',title:name+'：コイントスの裏表を宣言',
    candidates:[{key:'heads',value:'heads',label:'表'},{key:'tails',value:'tails',label:'裏'}],
    min:1,max:1,cancelable:false,resume:{handler:'u552.called-coin',args:{player:ctx.player,kind}},meta:{scriptName:name}});
}
API.registerChoiceHandler('u552.called-coin',(answer,args)=>{
  const c=(answer&&answer.cards||[])[0],call=c&&c.value==='tails'?'tails':'heads';
  const face=duelRandomInt(2,gameState)===0?'heads':'tails',hit=call===face;
  API.log((args.kind==='burn'?'暴れ牛鬼':'地雷蜘蛛')+'：'+(face==='heads'?'表':'裏')+'・'+(hit?'当たり':'ハズレ'));
  if(args.kind==='burn') API.damageLP(hit?1-args.player:args.player,1000,'暴れ牛鬼');
  else if(!hit) act({type:'LP',player:args.player,delta:-Math.floor(gameState.players[args.player].lp/2),cause:'unspecified',reason:'地雷蜘蛛：LPを半分失う'});
});
defineUnifiedCardV4('暴れ牛鬼',[{key:'called-burn',type:EFFECT_TYPE.IGNITION,range:LOCATION.MZONE,speed:1,events:['activate'],
  operation(ctx){u552CallS03(ctx,'burn');},afterResolve(){}
}],{type:'monster',priority:1,countLimit:1,timing:['mainPhase']});
defineUnifiedCardV4('地雷蜘蛛',[{key:'attack-coin',type:EFFECT_TYPE.TRIGGER,range:LOCATION.MZONE,speed:1,events:['onAttackDeclare'],forced:true,
  condition:u552SpiderAttackS03,operation(ctx){u552CallS03(ctx,'attack');},afterResolve(){}
}],{type:'monster',priority:1,forced:true,passive:{onAttackDeclare:u552SpiderAttackS03}});
