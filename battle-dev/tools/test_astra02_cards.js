require('./astra_harness')(String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function pick(c){const pc=pendingChoiceV49(gameState);if(!pc)throw Error('choice missing');const i=pc.candidates.findIndex(x=>x.uid===c.uid);if(i<0)throw Error('candidate missing '+cardName(c));__choicePickV49(i);}
function pass(){for(let i=0;i<100;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
function direct(c){gameState.phase='battle';gameState.activePlayer=0;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:h(c).index,target:'direct'});pass();}
function activate(c){const x=h(c);return prepareDuelActivation(cardName(c),x.p,x.zone,x.index,{});}
function replay(label){const pkg=v41ReplayPackage(gameState),a=v44ReplayAuditPackage(pkg);ok(label+' Replay nonempty',pkg.actions.length>0&&a.ok,JSON.stringify(a));}

ok('System02 literal registrations',!!CARD_SCRIPTS['ドラグニティ－ブランディストック']&&!!CARD_SCRIPTS['閃光の双剣－トライス']);

fresh();let dux=mk('ドラグニティ－ドゥクス'),br=mk('ドラグニティ－ブランディストック');gameState.players[0].hand=[dux];gameState.players[0].grave=[br];baselineA();
doNormalSummon(0,'atk');ok('Brandistock via Dux enters trigger',!!EVT_V2_STATE);eventPickV2(0);pick(br);pass();
ok('Brandistock equipped by real Dux chain',h(br).zone==='sz'&&br.equipTo.uid===dux.uid&&!br.specialSummoned);
gameState.phase='battle';gameState.activePlayer=0;
ok('Brandistock attack limit reaches attack legality',attackLimitV48(dux)===2&&canDeclareAttackV48(dux),attackCountV48(dux)+'/'+attackLimitV48(dux));
direct(dux);ok('Brandistock first attack leaves second legal',attackCountV48(dux)===1&&canDeclareAttackV48(dux));
direct(dux);ok('Brandistock second attack consumes allowance',attackCountV48(dux)===2&&!canDeclareAttackV48(dux));
const before=v41StateDigest(gameState)+'|'+V41_ACTION_JOURNAL.length;direct(dux);ok('Brandistock third attack rejected',attackCountV48(dux)===2&&(v41StateDigest(gameState)+'|'+V41_ACTION_JOURNAL.length)===before);
const pkgB=v41ReplayPackage(gameState);ok('Brandistock Replay is nonempty',pkgB.actions.length>0);

fresh();let tryce=mk('閃光の双剣－トライス'),cost=mk('サイクロン'),target=mk('ライオウ'),opp=mk('クリッター',1);gameState.players[0].hand=[tryce,cost];gameState.players[0].mz=[target];gameState.players[1].mz=[opp];baselineA();
ok('Tryce hand activation legal with cost and target',strictScriptLegalityV2('閃光の双剣－トライス',0,'hand',0,{cardOverride:tryce,logicalZone:'sz',prospectiveIndex:0}).ok,JSON.stringify(strictScriptLegalityV2('閃光の双剣－トライス',0,'hand',0,{cardOverride:tryce,logicalZone:'sz',prospectiveIndex:0})));
duelActivateFromHand(0);ok('Tryce moved to S/T and asks cost',h(tryce)&&h(tryce).zone==='sz'&&pendingChoiceV49(gameState)&&!pendingChoiceV49(gameState).targeting,JSON.stringify({loc:h(tryce),pc:pendingChoiceV49(gameState),chain:gameState.chain.length}));
pick(cost);ok('Tryce cost paid before mandatory target',h(cost).zone==='grave'&&pendingChoiceV49(gameState).targeting&&!pendingChoiceV49(gameState).cancelable);
pick(opp);ok('Tryce chain prepared with target snapshot',gameState.chain.length===1&&API.chainLinkTargets(gameState.chain[0].chainId).length===1);
const handAfterCost=gameState.players[0].hand.length;pass();
ok('Tryce resolves as Equip Spell to opponent monster',h(tryce).zone==='sz'&&tryce.equipTo.uid===opp.uid&&gameState.players[0].hand.length===handAfterCost);
ok('Tryce continuous ATK and attack limit apply',curATK(opp)===(dbOf(opp).atk||0)-500&&attackLimitV48(opp)===2);
replay('Tryce activation');

fresh();tryce=mk('閃光の双剣－トライス');target=mk('ライオウ');gameState.players[0].hand=[tryce];gameState.players[0].mz=[target];baselineA();
ok('Tryce illegal without separate hand cost',!strictScriptLegalityV2('閃光の双剣－トライス',0,'hand',0,{cardOverride:tryce,logicalZone:'sz',prospectiveIndex:0}).ok);
gameState.players[0].hand=[tryce,mk('サイクロン')];gameState.players[0].mz=[];ok('Tryce illegal without face-up target',!strictScriptLegalityV2('閃光の双剣－トライス',0,'hand',0,{cardOverride:tryce,logicalZone:'sz',prospectiveIndex:0}).ok);

fresh();tryce=mk('閃光の双剣－トライス');cost=mk('サイクロン');target=mk('ライオウ');gameState.players[0].hand=[tryce,cost];gameState.players[0].mz=[target];baselineA();
duelActivateFromHand(0);pick(cost);act({type:'FX_SET_STATE',player:0,zone:'mz',index:0,face:'down',pos:'def'});pick(target);pass();
ok('Tryce target face-down at resolution does not equip',h(tryce).zone==='grave'||!tryce.equipTo);

fresh();let kick=mk('ザ・キックマン'),unity=mk('団結の力'),gyTryce=mk('閃光の双剣－トライス'),reborn=mk('死者蘇生');gameState.players[0].grave=[kick,unity,gyTryce];gameState.players[0].hand=[reborn];baselineA();
duelActivateFromHand(0);pick(kick);pass();eventPickV2(0);pick(gyTryce);pass();
ok('Kick Man equips grave Tryce without activation cost',h(kick).zone==='mz'&&h(gyTryce).zone==='sz'&&gyTryce.equipTo.uid===kick.uid&&V41_ACTION_JOURNAL.filter(x=>x.action.type==='FX_HAND_SEND_GRAVE').length===0);
ok('Kick Man grave Tryce grants two attacks',attackLimitV48(kick)===2);
replay('Kick Man Tryce');
`);
