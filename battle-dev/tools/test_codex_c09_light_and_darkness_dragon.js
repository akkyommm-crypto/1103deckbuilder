/* CODEX-C09 — 光と闇の竜.
   Official ruling coverage: cannot be Special Summoned; LIGHT and DARK while
   face-up; mandatory once-per-chain activation negation without destruction;
   resolution-time 500/500 check and persistent self reduction; mandatory
   destroyed-to-GY trigger from field/hand/Deck, own-field wipe, then revival. */
const harness=require('./astra_harness');
const COMMON=String.raw`
function z(c){const h=findCardByUid(c.uid);return h?h.zone:null;}
function fresh(){resetA();gameState.activePlayer=0;gameState.turn=16;gameState.phase='main1';gameState.rngInitialSeed=gameState.rngState=0xc09a11;EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;}
function drive(){for(let i=0;i<1400;i++){
  const q=pendingChoiceV49(gameState);if(q){__choicePickV49(0);continue;}
  if(typeof EVT_V2_STATE!=='undefined'&&EVT_V2_STATE){const g=EVT_V2_STATE.groups[EVT_V2_STATE.rank]||[];if(g.length)eventPickV2(0);else eventSkipGroupV2();continue;}
  if(gameState.pendingSummon&&!gameState.chain.length){commitPendingSummonV2();continue;}
  if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
  const w=gameState.processorWaiting;if(w&&w.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
  if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
  return 'idle';
}return 'loop';}
function audit(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+': Replay audit',a.ok,JSON.stringify(a).slice(0,260));}
`;

/* A. A real Spell Card activation is forcibly negated, not destroyed, and the
      Dragon loses exactly 500 ATK/DEF. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',1),spark=mk('火の粉',0);gameState.players[1].mz=[lad];gameState.players[0].hand=[spark];baselineA();
ok('A: 光と闇の竜 script is registered',!!CARD_SCRIPTS['光と闇の竜']);
duelActivateFromHand(0);drive();
ok('A: Spell Card activation is negated without effect damage',gameState.players[1].lp===8000&&z(spark)==='grave',JSON.stringify({lp:gameState.players[1].lp,spark:z(spark)}));
ok('A: successful negation lowers ATK/DEF by 500',curATK(lad)===2300&&curDEF(lad)===1900,JSON.stringify({atk:curATK(lad),def:curDEF(lad)}));
audit('A');
`);

/* B. A DARK hand monster effect pays its cost but its activation is negated;
      the target stays in the GY. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',1),crow=mk('D.D.クロウ',0),target=mk('死者蘇生',1);gameState.players[1].mz=[lad];gameState.players[0].hand=[crow];gameState.players[1].grave=[target];baselineA();
duelActivateFromHand(0);drive();
ok('B: monster effect activation is negated after its cost',z(crow)==='grave'&&z(target)==='grave',JSON.stringify({crow:z(crow),target:z(target),chain:gameState.chain,actions:(gameState.actionLog||[]).slice(-12)}));
ok('B: monster-effect negation also lowers both stats',curATK(lad)===2300&&curDEF(lad)===1900);
audit('B');
`);

/* C. The effect still activates below 500 DEF, but resolution does nothing. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',1),spark=mk('火の粉',0);gameState.players[1].mz=[lad];gameState.players[0].hand=[spark];baselineA();
v4RegisterStatModifier({p:1,zone:'mz',index:0,card:lad},{atk:-2000,def:-2000},{controller:1,code:'C09 low stats',targetCard:lad,resetMask:RESET.LEAVE|RESET.FACE_DOWN|RESET.DISABLE});
duelActivateFromHand(0);drive();
ok('C: below-500 DEF means no negation and no additional reduction',gameState.players[1].lp===7800&&curATK(lad)===800&&curDEF(lad)===400,JSON.stringify({lp:gameState.players[1].lp,atk:curATK(lad),def:curDEF(lad)}));
audit('C');
`);

/* D. Spell/Trap effects from an already face-up card are not Card activations;
      the response is once per chain. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',1),continuous=mk('波動キャノン',0);gameState.players[1].mz=[lad];gameState.players[0].sz=[continuous];baselineA();
const sc=CARD_SCRIPTS['光と闇の竜'];
gameState.chain=[{name:'波動キャノン',player:0,uid:continuous.uid,cardId:continuous.id,chainId:901,prepared:true,cardActivationS03:false}];
let ctx=makeContext(1,lad,'mz',0,'onActivateSuccess',{event:makeActivationEventV12(gameState,gameState.chain[0])});
ok('D negative: an already-face-up Spell effect is not answered',!!sc&&sc.condition(ctx)===false);
gameState.chain[0].cardActivationS03=true;ctx=makeContext(1,lad,'mz',0,'onActivateSuccess',{event:makeActivationEventV12(gameState,gameState.chain[0])});
ok('D: a Spell Card activation is answered',sc.condition(ctx)===true);
ensureCardUid(gameState,lad);gameState.chain.push({name:'光と闇の竜',player:1,uid:lad.uid,cardId:lad.id,chainId:902,prepared:true,v4EffectKey:'negate-activation'});
ctx=makeContext(1,lad,'mz',0,'onActivateSuccess',{event:makeActivationEventV12(gameState,gameState.chain[0])});
ok('D negative: the same Dragon cannot activate its negation twice in one chain',sc.condition(ctx)===false,JSON.stringify({ladUid:lad.uid,links:gameState.chain.map(x=>({name:x.name,uid:x.uid,key:x.v4EffectKey})),used:c09LaddAlreadyUsedThisChain(lad),reason:ctx.reason}));
`);

/* E. It cannot be Special Summoned and is both LIGHT and DARK while face-up. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',0);gameState.players[0].grave=[lad];baselineA();
const summoned=API.specialSummon(0,'grave',0,'atk','C09 restriction test');
ok('E: it cannot be Special Summoned',summoned===false&&z(lad)==='grave');
gameState.players[0].grave=[];gameState.players[0].mz=[lad];baselineA();
ok('E: face-up card is both LIGHT and DARK',typeof hasAttributeV17==='function'&&hasAttributeV17(lad,'光')&&hasAttributeV17(lad,'闇'));
lad.face='down';ok('E negative: face-down card has only its printed LIGHT Attribute',hasAttributeV17(lad,'光')&&!hasAttributeV17(lad,'闇'));
`);

/* F. Destroyed on the field: mandatory target, wipe every own field zone,
      then revive. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',0),revive=mk('ワイト',0),ownM=mk('ライオウ',0),ownS=mk('サイクロン',0,'down'),ownF=mk('竜の渓谷',0);gameState.players[0].mz=[lad,ownM];gameState.players[0].sz=[ownS];gameState.players[0].field=ownF;gameState.players[0].grave=[revive];baselineA();
API.destroy({p:0,zone:'mz',index:0,card:lad},'C09 field destruction');flushDeferredEventsV2();drive();
ok('F: all own field cards are destroyed before the selected monster is revived',z(ownM)==='grave'&&z(ownS)==='grave'&&z(ownF)==='grave'&&z(revive)==='mz',JSON.stringify({m:z(ownM),s:z(ownS),f:z(ownF),r:z(revive)}));
audit('F');
`);

/* G. Officially the trigger also fires when destroyed in the hand or Deck. */
for(const from of ['hand','deck'])harness(COMMON+String.raw`
fresh();const from=${JSON.stringify(from)},lad=mk('光と闇の竜',0),revive=mk('ワイト',0),own=mk('ライオウ',0);gameState.players[0][from]=[lad];gameState.players[0].grave=[revive];gameState.players[0].mz=[own];baselineA();
act({type:'FX_TO_GRAVE',player:0,zone:from,index:0,reason:'C09 hidden-zone destruction',byDestroy:true});flushDeferredEventsV2();drive();
ok('G '+from+': destroyed-to-GY trigger wipes and revives',z(lad)==='grave'&&z(own)==='grave'&&z(revive)==='mz',JSON.stringify({lad:z(lad),own:z(own),revive:z(revive)}));
audit('G '+from);
`);

/* H. Mandatory even with no target/field, and a missing target at resolution
      never prevents the field wipe. */
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',0);gameState.players[0].mz=[lad];baselineA();API.destroy({p:0,zone:'mz',index:0,card:lad},'C09 no target');flushDeferredEventsV2();drive();
ok('H: no target and no field does not hang or fault',z(lad)==='grave'&&!gameState.systemFault&&drive()==='idle',String(gameState.systemFault||''));audit('H no target');
`);
harness(COMMON+String.raw`
fresh();const lad=mk('光と闇の竜',0),target=mk('ワイト',0),own=mk('ライオウ',0);gameState.players[0].grave=[lad,target];gameState.players[0].mz=[own];baselineA();
const sc=CARD_SCRIPTS['光と闇の竜'],ctx=makeContext(0,lad,'grave',0,'onDestroy',{event:{player:0,card:lad,reason:'effect'}});ctx.v4EffectKey='destroyed-revive';ctx.selectedTargets=[{p:0,zone:'grave',index:1,card:target}];API.banish({p:0,zone:'grave',index:1,card:target},'C09 target leaves');sc.resolve(ctx);
ok('H: target leaving the GY does not stop the own-field wipe',z(target)==='banish'&&z(own)==='grave');audit('H missing target');
`);
