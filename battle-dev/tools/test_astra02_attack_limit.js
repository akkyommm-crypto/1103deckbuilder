require('./astra_harness')(String.raw`
function fresh(){resetA();EVT_V2_STATE=null;EVT_AFTER=null;CHAIN_AFTER_V2=null;RESOLUTION_SUMMON_BATCH_V2=null;}
function direct(c){gameState.phase='battle';gameState.activePlayer=0;requestProcessorV27(PROCESSOR_V27.ATTACK,{player:0,atkIdx:h(c).index,target:'direct'});pass();}
function pass(){for(let i=0;i<80;i++){
 if(EVT_V2_STATE||pendingChoiceV49(gameState))return;
 if(gameState.chainWindow&&gameState.chain.length){chainPassV2();continue;}
 if(gameState.processorWaiting&&gameState.processorWaiting.type==='POINT'&&gameState.processorPaused){pointPassV27();continue;}
 if(!gameState.processorPaused&&gameState.processorQueue.length){pumpProcessorV27();continue;}
 return;
 }throw Error('pass loop');}
function digest(){return v41StateDigest(gameState)+'|j='+V41_ACTION_JOURNAL.length;}

fresh();let host=mk('ライオウ'),eq=mk('ドラグニティ－ブランディストック');gameState.players[0].mz=[host];gameState.players[0].sz=[eq];eq.equipTo={p:0,uid:host.uid};baselineA();
ok('primitive equipped source grants total 2',attackLimitV48(host)===2);
direct(host);ok('primitive first real attack legal path',attackCountV48(host)===1&&canDeclareAttackV48(host),attackCountV48(host)+'/'+attackLimitV48(host));
direct(host);ok('primitive second real attack legal path',attackCountV48(host)===2&&!canDeclareAttackV48(host),attackCountV48(host)+'/'+attackLimitV48(host));
const before=digest();direct(host);ok('primitive third attack rejected by real processor',attackCountV48(host)===2&&digest()===before,digest());

fresh();host=mk('ライオウ');eq=mk('ドラグニティ－ブランディストック');const eq2=mk('閃光の双剣－トライス');gameState.players[0].mz=[host];gameState.players[0].sz=[eq,eq2];eq.equipTo={p:0,uid:host.uid};eq2.equipTo={p:0,uid:host.uid};baselineA();
ok('two continuous sources do not add',attackLimitV48(host)===2);
applyAction(gameState,{type:'GRANT_EXTRA_ATTACK_V48',player:0,index:0,n:2});ok('turn grant 3 still wins over source 2',attackLimitV48(host)===3);

fresh();host=mk('サイバー・ツイン・ドラゴン');eq=mk('ドラグニティ－ブランディストック');gameState.players[0].mz=[host];gameState.players[0].sz=[eq];eq.equipTo={p:0,uid:host.uid};baselineA();
ok('Cyber Twin inherent 2 remains exactly 2 with equip',attackLimitV48(host)===2);
API.sendToGrave(h(eq),'test');ok('Cyber Twin inherent 2 remains after source removal',attackLimitV48(host)===2);

fresh();host=mk('ライオウ');eq=mk('ドラグニティ－ブランディストック');gameState.players[0].mz=[host];gameState.players[0].sz=[eq];eq.equipTo={p:0,uid:host.uid};baselineA();
direct(host);API.sendToGrave(h(eq),'remove');ok('source removal after one attack removes second attack',attackLimitV48(host)===1&&!canDeclareAttackV48(host));
gameState.players[0].sz=[eq];eq.face='up';eq.equipTo={p:0,uid:host.uid};ok('source re-enable preserves count and allows remaining second',attackLimitV48(host)===2&&canDeclareAttackV48(host));
direct(host);API.sendToGrave(h(eq),'remove2');gameState.players[0].sz=[eq];eq.face='up';eq.equipTo={p:0,uid:host.uid};ok('re-equip after two attacks does not create third',attackLimitV48(host)===2&&!canDeclareAttackV48(host));
fresh();host=mk('ライオウ');eq=mk('ドラグニティ－ブランディストック');gameState.players[0].mz=[host];gameState.players[0].sz=[eq];eq.equipTo={p:0,uid:host.uid};baselineA();
direct(host);act({type:'PASS_TURN',player:0});act({type:'PASS_TURN',player:1});gameState.activePlayer=0;gameState.phase='battle';ok('next turn reset re-evaluates source',attackCountV48(host)===0&&attackLimitV48(host)===2&&canDeclareAttackV48(host),attackCountV48(host)+'/'+attackLimitV48(host));

fresh();host=mk('ライオウ');eq=mk('ドラグニティ－ブランディストック');gameState.players[0].mz=[host];gameState.players[0].sz=[eq];eq.equipTo={p:0,uid:host.uid};baselineA();
eq.negated=true;ok('source negation suppresses allowance',attackLimitV48(host)===1);eq.negated=false;host.negated=true;ok('host-only negation does not suppress external equip',attackLimitV48(host)===2);
host.controller=1;act({type:'FX_CONTROL',player:0,zone:'mz',index:0,toPlayer:1,reason:'test'});ok('control change follows UID link',attackLimitV48(host)===2);

fresh();host=mk('ライオウ');eq=mk('ドラグニティ－ブランディストック');gameState.players[0].mz=[host];gameState.players[0].sz=[eq];eq.equipTo={p:0,uid:host.uid};baselineA();
for(const bad of [null,undefined,0,-1,NaN,Infinity,1.5,'2']){
 const old=CARD_SCRIPTS['ドラグニティ－ブランディストック'].continuous.grantsAttackLimit;
 CARD_SCRIPTS['ドラグニティ－ブランディストック'].continuous.grantsAttackLimit=()=>bad;
 ok('invalid hook ignored '+String(bad),attackLimitV48(host)===1);
 CARD_SCRIPTS['ドラグニティ－ブランディストック'].continuous.grantsAttackLimit=old;
}
const old=CARD_SCRIPTS['ドラグニティ－ブランディストック'].continuous.grantsAttackLimit;
CARD_SCRIPTS['ドラグニティ－ブランディストック'].continuous.grantsAttackLimit=()=>{throw Error('boom');};
const d0=digest();ok('hook exception ignored without mutation',attackLimitV48(host)===1&&digest()===d0);
CARD_SCRIPTS['ドラグニティ－ブランディストック'].continuous.grantsAttackLimit=old;
`);
